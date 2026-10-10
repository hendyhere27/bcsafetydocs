// bcsafetydocs-free-docs — serves the free-download lead capture flow.
// Route: bcsafetydocs.com/api/* (path-based, coexists with the Pages-served static site)
//
// Each free document page POSTs { email, product } to /api/free-download.
// This worker emails the download link via Resend and records the signup in
// the D1 database `bcsafetydocs-leads` (table `signups`). Leads are then
// filed into Resend's "General" segment by a separate sync step — see
// README.md for why, and how.

import { assess } from "../firesmart-logic.js";
import { buildReportEmail } from "./firesmart-email.js";
import { calculate } from "../cor-rebate-logic.js";
import { buildRebateEmail } from "./rebate-email.js";
import { assess as assessGap } from "../cor-gap-logic.js";
import { buildGapEmail } from "./gap-email.js";
import { scheduleSequence, handleUnsubscribe, runDueSequence } from "./sequence.js";

// Product slug -> filename on bcsafetydocs.com. Add an entry here each time
// a new free document ships.
const PRODUCTS = {
  "hot-work-permit": {
    title: "Hot Work Permit Template",
    filename: "BC_Hot_Work_Permit_Part12.docx",
  },
  loto: {
    title: "Lockout / Tagout Procedure Template",
    filename: "BC_LOTO_Procedure_Part10.docx",
  },
  flha: {
    title: "Daily Field Level Hazard Assessment",
    filename: "BC_Daily_FLHA_Form.docx",
  },
  "safe-work-procedure": {
    title: "Safe Work Procedure Template",
    filename: "BC_Safe_Work_Procedure_Template.docx",
  },
  "incident-report": {
    title: "Incident Investigation Report",
    filename: "BC_Incident_Investigation_Report.docx",
  },
  "emergency-response": {
    title: "Emergency Response Plan",
    filename: "BC_Emergency_Response_Plan.docx",
  },
  "confined-space": {
    title: "Confined Space Entry Permit Template",
    filename: "BC_Confined_Space_Entry_Permit_Part9.docx",
  },
  jsa: {
    title: "JSA / FLHA Template",
    filename: "BC_JSA_FLHA_Template_Part3.docx",
  },
  "policy-statement": {
    title: "Occupational Health & Safety Policy Statement",
    filename: "BC_COR_Policy_Statement.docx",
  },
};

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function corsHeaders() {
  return {
    "Access-Control-Allow-Origin": "https://bcsafetydocs.com",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type",
  };
}

function json(obj, status) {
  return new Response(JSON.stringify(obj), {
    status,
    headers: { "Content-Type": "application/json", ...corsHeaders() },
  });
}

export default {
  async fetch(request, env, ctx) {
    // Backup for the cron trigger: any API hit also sends follow-ups that are due.
    ctx.waitUntil(processDue(env, "lazy"));

    if (request.method === "OPTIONS") {
      return new Response(null, { headers: corsHeaders() });
    }

    const url = new URL(request.url);

    if (url.pathname === "/api/free-download" && request.method === "POST") {
      return handleFreeDownload(request, env);
    }

    if (url.pathname === "/api/firesmart-report" && request.method === "POST") {
      return handleFiresmartReport(request, env);
    }

    if (url.pathname === "/api/cor-rebate-report" && request.method === "POST") {
      return handleRebateReport(request, env);
    }

    if (url.pathname === "/api/cor-gap-report" && request.method === "POST") {
      return handleGapReport(request, env);
    }

    if (url.pathname === "/api/call-request" && request.method === "POST") {
      return handleCallRequest(request, env);
    }

    if (url.pathname === "/api/tick" && request.method === "GET") {
      return json({ ok: true }, 200);
    }

    if (url.pathname === "/api/unsubscribe" && (request.method === "GET" || request.method === "POST")) {
      return handleUnsubscribe(request, env);
    }

    return json({ ok: false, error: "Not found" }, 404);
  },

  // Daily cron (see wrangler.jsonc): send any due follow-up emails.
  async scheduled(event, env, ctx) {
    ctx.waitUntil(processDue(env, event.cron || "cron", true));
  },
};

async function handleFreeDownload(request, env) {
  let body;
  try {
    body = await request.json();
  } catch {
    return json({ ok: false, error: "Invalid request." }, 400);
  }

  const email = typeof body.email === "string" ? body.email.trim() : "";
  const product = typeof body.product === "string" ? body.product : "";
  const optIn = body.marketingOptIn === true ? 1 : 0; // unticked box by default (CASL)

  if (!EMAIL_RE.test(email)) {
    return json({ ok: false, error: "Please enter a valid email address." }, 400);
  }

  const productInfo = PRODUCTS[product];
  if (!productInfo) {
    return json({ ok: false, error: "Unknown product." }, 400);
  }

  if (!env.RESEND_API_KEY) {
    console.error("RESEND_API_KEY secret is not set on this worker.");
    return json({ ok: false, error: "Delivery is temporarily unavailable. Please email info@bcsafetydocs.com." }, 500);
  }

  const downloadUrl = `https://bcsafetydocs.com/${productInfo.filename}`;

  const emailResp = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${env.RESEND_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from: "BC Safety Docs <info@bcsafetydocs.com>",
      to: [email],
      subject: `Your free download: ${productInfo.title}`,
      html:
        `<p>Thanks for requesting the <strong>${productInfo.title}</strong>.</p>` +
        `<p><a href="${downloadUrl}">Click here to download ${productInfo.filename}</a></p>` +
        `<p style="color:#777;font-size:13px;">This is a working tool — review it with a qualified person and verify it against the current WorkSafeBC OHS Regulation before use.</p>` +
        `<p>Questions? Email <a href="mailto:info@bcsafetydocs.com">info@bcsafetydocs.com</a></p>`,
      text:
        `Thanks for requesting the ${productInfo.title}.\n\n` +
        `Download: ${downloadUrl}\n\n` +
        `This is a working tool — review it with a qualified person and verify it against the current WorkSafeBC OHS Regulation before use.\n\n` +
        `Questions? Email info@bcsafetydocs.com`,
    }),
  });

  if (!emailResp.ok) {
    const errText = await emailResp.text();
    console.error("Resend send-email failed:", emailResp.status, errText);
    return json({ ok: false, error: "Could not send the email. Please try again or email info@bcsafetydocs.com." }, 502);
  }

  // Record the signup in D1 — never fail the user-facing request over this
  // (the download email has already gone out). This is the system of record
  // for leads; they're filed into Resend's General segment afterwards (see
  // README.md), because RESEND_API_KEY is Sending-access only and Resend
  // rejects Contacts API calls from it (401 restricted_api_key).
  try {
    await env.DB
      .prepare("INSERT INTO signups (email, product, marketing_opt_in) VALUES (?, ?, ?)")
      .bind(email.toLowerCase(), product, optIn)
      .run();
  } catch (e) {
    console.error("D1 signup insert failed:", e);
  }

  return json({ ok: true }, 200);
}


// POST /api/firesmart-report  { email, answers }
// Re-computes the result server-side from the raw answers (the client never
// supplies report text), emails the full report, and records the lead.
async function handleFiresmartReport(request, env) {
  let body;
  try {
    body = await request.json();
  } catch {
    return json({ ok: false, error: "Invalid request." }, 400);
  }

  const email = typeof body.email === "string" ? body.email.trim() : "";
  if (!EMAIL_RE.test(email) || email.length > 200) {
    return json({ ok: false, error: "Please enter a valid email address." }, 400);
  }

  const result = assess(body.answers);
  if (!result.ok) {
    return json({ ok: false, error: result.error }, 400);
  }
  const optIn = body.marketingOptIn === true ? 1 : 0;

  if (!env.RESEND_API_KEY) {
    console.error("RESEND_API_KEY secret is not set on this worker.");
    return json({ ok: false, error: "Delivery is temporarily unavailable. Please email info@bcsafetydocs.com." }, 500);
  }

  // Light abuse protection: this endpoint emails whatever address it is given.
  // Max 3 reports per email and 10 per network address per 24 hours.
  const ip = request.headers.get("CF-Connecting-IP") || "unknown";
  const ipHash = await sha256Hex(ip);
  try {
    const perEmail = await env.DB
      .prepare("SELECT COUNT(*) AS n FROM firesmart_assessments WHERE email = ? AND created_at > datetime('now','-1 day')")
      .bind(email.toLowerCase())
      .first();
    const perIp = await env.DB
      .prepare("SELECT COUNT(*) AS n FROM firesmart_assessments WHERE ip_hash = ? AND created_at > datetime('now','-1 day')")
      .bind(ipHash)
      .first();
    if ((perEmail && perEmail.n >= 3) || (perIp && perIp.n >= 10)) {
      return json({ ok: false, error: "That's the daily limit for reports. Please try again tomorrow." }, 429);
    }
  } catch (e) {
    console.error("Rate-limit check failed (continuing):", e);
  }

  const { subject, html, text } = buildReportEmail(result);

  const emailResp = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${env.RESEND_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from: "BC Safety Docs <info@bcsafetydocs.com>",
      to: [email],
      subject,
      html,
      text,
    }),
  });

  if (!emailResp.ok) {
    const errText = await emailResp.text();
    console.error("Resend send-email failed (firesmart):", emailResp.status, errText);
    return json({ ok: false, error: "Could not send the email. Please try again or email info@bcsafetydocs.com." }, 502);
  }

  try {
    await env.DB
      .prepare("INSERT INTO firesmart_assessments (email, fsa, score, level, answers_json, ip_hash, marketing_opt_in) VALUES (?, ?, ?, ?, ?, ?, ?)")
      .bind(email.toLowerCase(), result.answers.fsa, result.score, result.level.id, JSON.stringify(result.answers), ipHash, optIn)
      .run();
    // Only people who ticked the optional box go on the list that feeds Resend (CASL).
    if (optIn) {
      await env.DB
        .prepare("INSERT INTO signups (email, product, marketing_opt_in) VALUES (?, ?, 1)")
        .bind(email.toLowerCase(), "firesmart-assessment")
        .run();
    }
  } catch (e) {
    console.error("D1 firesmart insert failed:", e);
  }

  return json({ ok: true, score: result.score }, 200);
}

// POST /api/cor-rebate-report  { email, payroll, workers?, baseRate, marketingOptIn }
// Re-computes the estimate server-side, emails the full breakdown, and records
// the lead. The follow-up sequence needs its own opt-in (CASL): only people who
// ticked the box are also added to `signups`, which feeds the Resend sync.
async function handleRebateReport(request, env) {
  let body;
  try {
    body = await request.json();
  } catch {
    return json({ ok: false, error: "Invalid request." }, 400);
  }

  const email = typeof body.email === "string" ? body.email.trim() : "";
  if (!EMAIL_RE.test(email) || email.length > 200) {
    return json({ ok: false, error: "Please enter a valid email address." }, 400);
  }

  const result = calculate({ payroll: body.payroll, workers: body.workers, baseRate: body.baseRate });
  if (!result.ok) {
    return json({ ok: false, error: result.error }, 400);
  }
  const optIn = body.marketingOptIn === true ? 1 : 0;

  if (!env.RESEND_API_KEY) {
    console.error("RESEND_API_KEY secret is not set on this worker.");
    return json({ ok: false, error: "Delivery is temporarily unavailable. Please email info@bcsafetydocs.com." }, 500);
  }

  // Max 3 estimates per email and 10 per network address per 24 hours.
  const ip = request.headers.get("CF-Connecting-IP") || "unknown";
  const ipHash = await sha256Hex(ip);
  try {
    const perEmail = await env.DB
      .prepare("SELECT COUNT(*) AS n FROM cor_rebate_calcs WHERE email = ? AND created_at > datetime('now','-1 day')")
      .bind(email.toLowerCase())
      .first();
    const perIp = await env.DB
      .prepare("SELECT COUNT(*) AS n FROM cor_rebate_calcs WHERE ip_hash = ? AND created_at > datetime('now','-1 day')")
      .bind(ipHash)
      .first();
    if ((perEmail && perEmail.n >= 3) || (perIp && perIp.n >= 10)) {
      return json({ ok: false, error: "That's the daily limit for estimates. Please try again tomorrow." }, 429);
    }
  } catch (e) {
    console.error("Rate-limit check failed (continuing):", e);
  }

  const { subject, html, text } = buildRebateEmail(result);

  const emailResp = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${env.RESEND_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from: "BC Safety Docs <info@bcsafetydocs.com>",
      to: [email],
      subject,
      html,
      text,
    }),
  });

  if (!emailResp.ok) {
    const errText = await emailResp.text();
    console.error("Resend send-email failed (cor-rebate):", emailResp.status, errText);
    return json({ ok: false, error: "Could not send the email. Please try again or email info@bcsafetydocs.com." }, 502);
  }

  try {
    await env.DB
      .prepare(
        "INSERT INTO cor_rebate_calcs (email, payroll, workers, base_rate, annual_incentive, marketing_opt_in, ip_hash) VALUES (?, ?, ?, ?, ?, ?, ?)"
      )
      .bind(email.toLowerCase(), result.inputs.payroll, result.inputs.workers, result.inputs.baseRate, result.annual, optIn, ipHash)
      .run();
    if (optIn) {
      await env.DB
        .prepare("INSERT INTO signups (email, product, marketing_opt_in) VALUES (?, ?, 1)")
        .bind(email.toLowerCase(), "cor-rebate-calculator")
        .run();
    }
  } catch (e) {
    console.error("D1 cor-rebate insert failed:", e);
  }

  if (optIn) {
    await scheduleSequence(env, {
      email,
      kind: "rebate",
      data: { annual: result.annual, threeYear: result.threeYear },
    });
  }

  return json({ ok: true }, 200);
}

// POST /api/cor-gap-report  { email, answers: {1..13: have|partial|none}, sector, marketingOptIn }
// Re-scores server-side, emails the full report, records the lead. As with the
// rebate calculator, only people who ticked the follow-up box reach `signups`.
async function handleGapReport(request, env) {
  let body;
  try {
    body = await request.json();
  } catch {
    return json({ ok: false, error: "Invalid request." }, 400);
  }

  const email = typeof body.email === "string" ? body.email.trim() : "";
  if (!EMAIL_RE.test(email) || email.length > 200) {
    return json({ ok: false, error: "Please enter a valid email address." }, 400);
  }

  const result = assessGap({ answers: body.answers, sector: body.sector });
  if (!result.ok) {
    return json({ ok: false, error: result.error }, 400);
  }
  const optIn = body.marketingOptIn === true ? 1 : 0;

  if (!env.RESEND_API_KEY) {
    console.error("RESEND_API_KEY secret is not set on this worker.");
    return json({ ok: false, error: "Delivery is temporarily unavailable. Please email info@bcsafetydocs.com." }, 500);
  }

  // Max 3 reports per email and 10 per network address per 24 hours.
  const ip = request.headers.get("CF-Connecting-IP") || "unknown";
  const ipHash = await sha256Hex(ip);
  try {
    const perEmail = await env.DB
      .prepare("SELECT COUNT(*) AS n FROM cor_gap_checks WHERE email = ? AND created_at > datetime('now','-1 day')")
      .bind(email.toLowerCase())
      .first();
    const perIp = await env.DB
      .prepare("SELECT COUNT(*) AS n FROM cor_gap_checks WHERE ip_hash = ? AND created_at > datetime('now','-1 day')")
      .bind(ipHash)
      .first();
    if ((perEmail && perEmail.n >= 3) || (perIp && perIp.n >= 10)) {
      return json({ ok: false, error: "That's the daily limit for reports. Please try again tomorrow." }, 429);
    }
  } catch (e) {
    console.error("Rate-limit check failed (continuing):", e);
  }

  const { subject, html, text } = buildGapEmail(result);

  const emailResp = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${env.RESEND_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from: "BC Safety Docs <info@bcsafetydocs.com>",
      to: [email],
      subject,
      html,
      text,
    }),
  });

  if (!emailResp.ok) {
    const errText = await emailResp.text();
    console.error("Resend send-email failed (cor-gap):", emailResp.status, errText);
    return json({ ok: false, error: "Could not send the email. Please try again or email info@bcsafetydocs.com." }, 502);
  }

  try {
    await env.DB
      .prepare(
        "INSERT INTO cor_gap_checks (email, sector, have_count, partial_count, none_count, answers_json, marketing_opt_in, ip_hash) VALUES (?, ?, ?, ?, ?, ?, ?, ?)"
      )
      .bind(email.toLowerCase(), result.sector, result.counts.have, result.counts.partial, result.counts.none, JSON.stringify(result.answers), optIn, ipHash)
      .run();
    if (optIn) {
      await env.DB
        .prepare("INSERT INTO signups (email, product, marketing_opt_in) VALUES (?, ?, 1)")
        .bind(email.toLowerCase(), "cor-gap-check")
        .run();
    }
  } catch (e) {
    console.error("D1 cor-gap insert failed:", e);
  }

  if (optIn) {
    await scheduleSequence(env, {
      email,
      kind: "gap",
      data: {
        have: result.counts.have,
        partial: result.counts.partial,
        none: result.counts.none,
        freeCount: result.freeDocs.length,
        kitCount: result.kitDocs.length,
        top: result.top.map((g) => {
          const d = g.docs.find((x) => x.free) || g.docs[0];
          return { name: g.name, docTitle: d.title, docUrl: d.url || "", free: !!d.free };
        }),
      },
    });
  }

  return json({ ok: true }, 200);
}

async function sha256Hex(text) {
  const buf = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(text));
  return [...new Uint8Array(buf)].slice(0, 8).map((b) => b.toString(16).padStart(2, "0")).join("");
}


// Sends due follow-up emails and records the run. Cron runs always log; lazy runs
// (triggered by any API request) only log when something was actually due.
async function processDue(env, source, always = false) {
  try {
    const n = await env.DB
      .prepare("SELECT COUNT(*) AS n FROM sequence_emails WHERE status = 'pending' AND send_at <= datetime('now')")
      .first();
    if (!always && (!n || n.n === 0)) return;
    let result = { due: 0, sent: 0 };
    let error = null;
    try {
      result = await runDueSequence(env);
    } catch (e) {
      error = String(e && e.message ? e.message : e).slice(0, 300);
      console.error("runDueSequence failed:", e);
    }
    await env.DB
      .prepare("INSERT INTO cron_log (cron, due, sent, error) VALUES (?, ?, ?, ?)")
      .bind(source, result.due, result.sent, error)
      .run();
  } catch (e) {
    console.error("processDue failed:", e);
  }
}


// POST /api/call-request  { name, email, phone?, message?, topic, source, website }
// "Request a free call" forms on the kit page and the thank-you page. Stores the
// request, emails it to info@ (reply-to = the requester) and sends a confirmation.
// Not a marketing signup: nothing is added to `signups`.
async function handleCallRequest(request, env) {
  let body;
  try {
    body = await request.json();
  } catch {
    return json({ ok: false, error: "Invalid request." }, 400);
  }
  if (typeof body.website === "string" && body.website.trim() !== "") {
    return json({ ok: true }, 200); // honeypot: pretend success
  }

  const clean = (v, max) => (typeof v === "string" ? v.replace(/[\u0000-\u001f\u007f]+/g, " ").trim().slice(0, max) : "");
  const name = clean(body.name, 100);
  const email = clean(body.email, 200);
  const phone = clean(body.phone, 40);
  const message = typeof body.message === "string" ? body.message.replace(/\u0000/g, "").trim().slice(0, 1500) : "";
  const topic = body.topic === "buyer-offer" ? "buyer-offer" : "question";
  const source = clean(body.source, 100);

  if (!name) return json({ ok: false, error: "Please enter your name." }, 400);
  if (!EMAIL_RE.test(email)) return json({ ok: false, error: "Please enter a valid email address." }, 400);
  if (!env.RESEND_API_KEY) {
    console.error("RESEND_API_KEY secret is not set on this worker.");
    return json({ ok: false, error: "Please email info@bcsafetydocs.com." }, 500);
  }

  const ip = request.headers.get("CF-Connecting-IP") || "unknown";
  const ipHash = await sha256Hex(ip);
  try {
    const perEmail = await env.DB
      .prepare("SELECT COUNT(*) AS n FROM call_requests WHERE email = ? AND created_at > datetime('now','-1 day')")
      .bind(email.toLowerCase())
      .first();
    const perIp = await env.DB
      .prepare("SELECT COUNT(*) AS n FROM call_requests WHERE ip_hash = ? AND created_at > datetime('now','-1 day')")
      .bind(ipHash)
      .first();
    if ((perEmail && perEmail.n >= 3) || (perIp && perIp.n >= 10)) {
      return json({ ok: false, error: "That's the daily limit for requests. Please email info@bcsafetydocs.com." }, 429);
    }
  } catch (e) {
    console.error("Rate-limit check failed (continuing):", e);
  }

  try {
    await env.DB
      .prepare("INSERT INTO call_requests (name, email, phone, topic, message, source, ip_hash) VALUES (?, ?, ?, ?, ?, ?, ?)")
      .bind(name, email.toLowerCase(), phone, topic, message, source, ipHash)
      .run();
  } catch (e) {
    console.error("D1 call_requests insert failed:", e);
  }

  const label = topic === "buyer-offer" ? "FIRST-5 BUYER CALL" : "Call request";
  const send = (payload) =>
    fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: { Authorization: `Bearer ${env.RESEND_API_KEY}`, "Content-Type": "application/json" },
      body: JSON.stringify({ from: "BC Safety Docs <info@bcsafetydocs.com>", ...payload }),
    });

  const note = await send({
    to: ["info@bcsafetydocs.com"],
    reply_to: [email],
    subject: `[${label}] ${name}`,
    text:
      `${label}\n\nName: ${name}\nEmail: ${email}\nPhone: ${phone || "(none)"}\nFrom page: ${source || "(unknown)"}\n\nMessage:\n${message || "(none)"}\n\n` +
      (topic === "buyer-offer"
        ? "This came from the thank-you page for the first-5-buyers offer. Check the email against a Stripe payment before booking.\n"
        : "Reply to this email to arrange a time.\n"),
  });
  if (!note.ok) {
    console.error("Resend notify failed (call-request):", note.status, await note.text());
    return json({ ok: false, error: "Could not send your request. Please email info@bcsafetydocs.com." }, 502);
  }

  // Confirmation to the requester; failure here doesn't fail the request.
  try {
    await send({
      to: [email],
      reply_to: ["info@bcsafetydocs.com"],
      subject: "We got your call request",
      text:
        `Hi ${name.split(" ")[0] || "there"},\n\nThanks for your request. I'll email you to find a time that works.\n\n` +
        (topic === "buyer-offer"
          ? "Because this is for the first-5-buyers offer, I'll confirm your purchase when I reply. Please take the free COR gap check before the call if you haven't: https://bcsafetydocs.com/cor-gap-check\n\n"
          : "") +
        `You can reply to this email with anything you'd like covered.\n\nDerek Henderson\nBC Safety Docs\nhttps://bcsafetydocs.com\n`,
    });
  } catch (e) {
    console.error("Call-request confirmation failed:", e);
  }

  return json({ ok: true }, 200);
}
