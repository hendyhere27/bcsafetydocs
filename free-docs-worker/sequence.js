// COR follow-up sequence: three short emails (day 2, 5, 10) for people who
// ticked the optional follow-up box on the incentive calculator or gap check.
//
// How it works: at opt-in the worker queues three rows in D1 (`sequence_emails`,
// status 'pending', send_at = day 2/5/10 at 16:00 UTC). A daily cron trigger runs
// runDueSequence(), which sends whatever is due through Resend and skips anyone
// who has unsubscribed. (Resend's own scheduled sends can't be cancelled with the
// sending-only API key, so unsubscribes would not stop them; sending from our own
// queue means an unsubscribe always takes effect.) Day 0 is the report/estimate
// the worker has already emailed.
//
// Compliance (CASL): only opted-in addresses are scheduled; every email carries an
// unsubscribe link, List-Unsubscribe headers and the sender's postal address
// (env MAILING_ADDRESS; with no address set nothing is scheduled, except for
// Resend's @resend.dev test inboxes, which get a placeholder).

import { CONSTANTS, fmt } from "../cor-rebate-logic.js";

const SITE = "https://bcsafetydocs.com";
const FROM = "Derek Henderson, BC Safety Docs <info@bcsafetydocs.com>";
const REPLY_TO = "info@bcsafetydocs.com";
const STEPS = [2, 5, 10]; // days after opt-in
const SEND_HOUR_UTC = 16; // about 8-9 am Pacific

const esc = (s) =>
  String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");

const RECORDS_LINE =
  "Auditors want to see that the system has actually been running, not just written down. BCCSA says there should be at least 6 months of supporting evidence, with 12 months recommended; the BC Forest Safety Council reviews the 12 months before an audit. Some partners publish no minimum, so ask yours.";
const HALF_RULE =
  "Audits are scored two ways: 80% overall and at least 50% in every element (stated by BCCSA, AgSafe, go2HR, Energy Safety Canada and the BC Forest Safety Council). A strong overall mark doesn't rescue an audit if one element falls below 50%.";

function para(text) {
  return `<p style="margin:0 0 14px;font-size:15px;line-height:1.6;color:#1A1A1A;">${text}</p>`;
}
function button(href, label) {
  return `<p style="margin:18px 0;"><a href="${esc(href)}" style="display:inline-block;background:#F5C400;color:#1A1A1A;font-weight:700;text-decoration:none;padding:11px 20px;border-radius:3px;font-size:15px;">${esc(label)}</a></p>`;
}

// data for kind "rebate": { annual, threeYear }
// data for kind "gap":    { have, partial, none, top: [{ name, docTitle, docUrl, free }], freeCount, kitCount }
export function buildSequenceEmail({ kind, step, data, unsubUrl, address }) {
  const kit = CONSTANTS.KIT_PRICE;
  const calc = `${SITE}/cor-rebate-calculator`;
  const gap = `${SITE}/cor-gap-check`;
  const kitUrl = `${SITE}/cor-kit`;
  let subject, bodyHtml, bodyText;

  if (kind === "rebate") {
    const a = fmt(data.annual), t = fmt(data.threeYear);
    if (step === 1) {
      subject = `Your ${a} COR incentive: the records question`;
      bodyHtml =
        para(`Your calculator estimate was up to <strong>${esc(a)} a year</strong> (${esc(t)} over three years).`) +
        para(`Before any of it is paid you have to pass a certification audit. ${esc(RECORDS_LINE)}`) +
        para(`So the records you start keeping this month are a clock you can't skip later. The free gap check takes two minutes and shows which of the 13 COR elements you already cover.`) +
        button(gap, "Take the gap check");
      bodyText = `Your calculator estimate was up to ${a} a year (${t} over three years).\n\nBefore any of it is paid you have to pass a certification audit. ${RECORDS_LINE}\n\nSo the records you start keeping this month are a clock you can't skip later. The free gap check takes two minutes and shows which of the 13 COR elements you already cover: ${gap}`;
    } else if (step === 2) {
      subject = `One empty element can hold back your ${a}`;
      bodyHtml =
        para(`${esc(HALF_RULE)}`) +
        para(`So a single missing element can delay your estimated <strong>${esc(a)} a year</strong>. Several of the documents behind the 13 elements are free templates; the rest are in the COR kit: 18 editable documents plus a bonus audit quick reference, <strong>$${kit} CAD</strong> once, against your estimated ${esc(a)} a year. It is the written program only, not certification.`) +
        button(kitUrl, "See the COR kit") +
        para(`Or see where you stand first: <a href="${esc(gap)}" style="color:#1A5276;">the free gap check</a>.`);
      bodyText = `${HALF_RULE}\n\nSo a single missing element can delay your estimated ${a} a year. Several of the documents behind the 13 elements are free templates; the rest are in the COR kit: 18 editable documents plus a bonus audit quick reference, $${kit} CAD once, against your estimated ${a} a year. It is the written program only, not certification.\n\nSee the kit: ${kitUrl}\nOr see where you stand first (free gap check): ${gap}`;
    } else {
      subject = "Want me to look at your gaps?";
      bodyHtml =
        para(`It's Derek at BC Safety Docs. You ran the COR calculator a week and a half ago (estimate: up to ${esc(a)} a year).`) +
        para(`If you reply with your industry, roughly how many workers you have, and what you already have written down, I'll send back the three things I'd tackle first. No cost, no sales call.`) +
        para(`If you'd rather not hear from me, the unsubscribe link below ends these emails.`);
      bodyText = `It's Derek at BC Safety Docs. You ran the COR calculator a week and a half ago (estimate: up to ${a} a year).\n\nIf you reply with your industry, roughly how many workers you have, and what you already have written down, I'll send back the three things I'd tackle first. No cost, no sales call.\n\nIf you'd rather not hear from me, the unsubscribe link below ends these emails.`;
    }
  } else {
    const { have, partial, none, top, freeCount, kitCount } = data;
    const names = top.map((t) => t.name);
    const first = names[0] || "keeping your records going";
    const tally = `${have} of 13 elements in place, ${partial} partly, ${none} missing`;
    if (step === 1) {
      subject = top.length ? `Your COR gap check: start with ${first.toLowerCase()}` : "Your COR gap check: keep the records going";
      const docsHtml = top
        .map((t) => `<li style="margin:4px 0;">${esc(t.name)}: ${t.free ? `<a href="${SITE}${esc(t.docUrl)}" style="color:#1A5276;">${esc(t.docTitle)}</a> (free)` : `${esc(t.docTitle)} (in the COR kit)`}</li>`)
        .join("");
      const docsText = top.map((t) => `- ${t.name}: ${t.docTitle}${t.free ? ` (free) ${SITE}${t.docUrl}` : " (in the COR kit)"}`).join("\n");
      bodyHtml =
        para(`Your gap check showed <strong>${esc(tally)}</strong>.`) +
        (top.length ? para(`Start here:`) + `<ul style="margin:0 0 14px;padding-left:20px;font-size:15px;line-height:1.5;color:#1A1A1A;">${docsHtml}</ul>` : "") +
        para(`${esc(RECORDS_LINE)}`) +
        button(gap, "Retake the gap check");
      bodyText = `Your gap check showed ${tally}.\n\n${top.length ? `Start here:\n${docsText}\n\n` : ""}${RECORDS_LINE}\n\nRetake the gap check: ${gap}`;
    } else if (step === 2) {
      subject = "Why one missing element matters in a COR audit";
      bodyHtml =
        para(`${esc(HALF_RULE)}`) +
        para(`You had ${esc(String(none))} element${none === 1 ? "" : "s"} missing and ${esc(String(partial))} partly in place, so that rule matters for you. ${esc(String(freeCount))} of the documents behind your gaps are free templates${kitCount ? `; the other ${esc(String(kitCount))} are only in the COR kit (18 editable documents plus a bonus audit quick reference, <strong>$${kit} CAD</strong> once)` : ""}. The kit is the written program only, not certification.`) +
        button(kitUrl, "See the COR kit");
      bodyText = `${HALF_RULE}\n\nYou had ${none} element${none === 1 ? "" : "s"} missing and ${partial} partly in place, so that rule matters for you. ${freeCount} of the documents behind your gaps are free templates${kitCount ? `; the other ${kitCount} are only in the COR kit (18 editable documents plus a bonus audit quick reference, $${kit} CAD once)` : ""}. The kit is the written program only, not certification.\n\nSee the kit: ${kitUrl}`;
    } else {
      subject = "Want me to look at your gaps?";
      bodyHtml =
        para(`It's Derek at BC Safety Docs. You ran the COR gap check a week and a half ago (${esc(tally)}).`) +
        para(`If you reply with your industry, roughly how many workers you have, and what you already have written down, I'll send back the three things I'd tackle first. No cost, no sales call.`) +
        para(`If you'd rather not hear from me, the unsubscribe link below ends these emails.`);
      bodyText = `It's Derek at BC Safety Docs. You ran the COR gap check a week and a half ago (${tally}).\n\nIf you reply with your industry, roughly how many workers you have, and what you already have written down, I'll send back the three things I'd tackle first. No cost, no sales call.\n\nIf you'd rather not hear from me, the unsubscribe link below ends these emails.`;
    }
  }

  const why = kind === "rebate" ? "COR incentive calculator" : "COR gap check";
  const footerHtml =
    `<p style="margin:22px 0 0;font-size:12px;line-height:1.55;color:#777;border-top:1px solid #E5E5E5;padding-top:14px;">You're getting this because you ticked the follow-up box on the ${why} at bcsafetydocs.com. ` +
    `<a href="${esc(unsubUrl)}" style="color:#777;">Unsubscribe</a>. BC Safety Docs, ${esc(address)}. BC Safety Docs is independent and not affiliated with WorkSafeBC or any certifying partner.</p>`;
  const footerText = `\n\n--\nYou're getting this because you ticked the follow-up box on the ${why} at bcsafetydocs.com.\nUnsubscribe: ${unsubUrl}\nBC Safety Docs, ${address}. BC Safety Docs is independent and not affiliated with WorkSafeBC or any certifying partner.\n`;

  const html =
    `<!doctype html><html><body style="margin:0;background:#F4F4F4;font-family:Arial,Helvetica,sans-serif;">` +
    `<table role="presentation" width="100%" cellpadding="0" cellspacing="0"><tr><td align="center" style="padding:20px 10px;">` +
    `<table role="presentation" width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;background:#fff;border-radius:6px;">` +
    `<tr><td style="padding:26px 28px;">${bodyHtml}<p style="margin:0;font-size:15px;color:#1A1A1A;">Derek Henderson<br><span style="color:#777;font-size:13px;">BC Safety Docs</span></p>${footerHtml}</td></tr></table></td></tr></table></body></html>`;

  return { subject, html, text: bodyText + "\n\nDerek Henderson\nBC Safety Docs" + footerText };
}

function scheduledAt(days) {
  const d = new Date();
  d.setUTCDate(d.getUTCDate() + days);
  d.setUTCHours(SEND_HOUR_UTC, 0, 0, 0);
  return d.toISOString().slice(0, 19).replace("T", " ");
}

function addressFor(env, email) {
  if (env.MAILING_ADDRESS) return env.MAILING_ADDRESS;
  if (email.endsWith("@resend.dev")) return "[test mailing address]";
  return null;
}

// Called after an opted-in report has been sent. Never throws.
export async function scheduleSequence(env, { email, kind, data }) {
  try {
    email = email.toLowerCase();
    if (!addressFor(env, email)) {
      console.error("MAILING_ADDRESS not set: follow-up sequence not queued for", email);
      return;
    }

    const sub = await env.DB.prepare("SELECT token, unsubscribed FROM sequence_subs WHERE email = ?").bind(email).first();
    if (sub && sub.unsubscribed) return; // respect a past unsubscribe
    if (!sub) {
      await env.DB.prepare("INSERT INTO sequence_subs (email, token) VALUES (?, ?)").bind(email, crypto.randomUUID().replace(/-/g, "")).run();
    }

    const active = await env.DB
      .prepare("SELECT COUNT(*) AS n FROM sequence_emails WHERE email = ? AND status = 'pending'")
      .bind(email)
      .first();
    if (active && active.n > 0) return; // already in a sequence

    const payload = JSON.stringify({ kind, data });
    for (let i = 0; i < STEPS.length; i++) {
      await env.DB
        .prepare("INSERT INTO sequence_emails (email, kind, step, send_at, payload_json) VALUES (?, ?, ?, ?, ?)")
        .bind(email, kind, i + 1, scheduledAt(STEPS[i]), payload)
        .run();
    }
  } catch (e) {
    console.error("scheduleSequence failed:", e);
  }
}

// Cron entry point: send everything that is due, skipping unsubscribed addresses.
export async function runDueSequence(env) {
  const due = await env.DB
    .prepare("SELECT id, email, kind, step, payload_json, attempts FROM sequence_emails WHERE status = 'pending' AND send_at <= datetime('now') ORDER BY send_at, id LIMIT 50")
    .all();
  let sent = 0;
  for (const row of due.results || []) {
    try {
      const sub = await env.DB.prepare("SELECT token, unsubscribed FROM sequence_subs WHERE email = ?").bind(row.email).first();
      if (!sub || sub.unsubscribed) {
        await env.DB.prepare("UPDATE sequence_emails SET status = 'canceled' WHERE id = ?").bind(row.id).run();
        continue;
      }
      const address = addressFor(env, row.email);
      if (!address) continue; // address removed: leave pending
      const { kind, data } = JSON.parse(row.payload_json);
      const unsubUrl = `${SITE}/api/unsubscribe?t=${sub.token}`;
      const { subject, html, text } = buildSequenceEmail({ kind, step: row.step, data, unsubUrl, address });
      const resp = await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${env.RESEND_API_KEY}`,
          "Content-Type": "application/json",
          "Idempotency-Key": `cor-seq-${row.id}`,
        },
        body: JSON.stringify({
          from: FROM,
          to: [row.email],
          reply_to: REPLY_TO,
          subject,
          html,
          text,
          headers: { "List-Unsubscribe": `<${unsubUrl}>`, "List-Unsubscribe-Post": "List-Unsubscribe=One-Click" },
        }),
      });
      if (resp.ok) {
        const out = await resp.json().catch(() => ({}));
        await env.DB.prepare("UPDATE sequence_emails SET status = 'sent', resend_id = ?, sent_at = datetime('now') WHERE id = ?").bind(out.id || null, row.id).run();
        sent++;
      } else {
        const errText = (await resp.text()).slice(0, 200);
        console.error("Sequence send failed:", row.id, resp.status, errText);
        const attempts = (row.attempts || 0) + 1;
        await env.DB
          .prepare("UPDATE sequence_emails SET attempts = ?, last_error = ?, status = ? WHERE id = ?")
          .bind(attempts, `${resp.status} ${errText}`, attempts >= 3 ? "failed" : "pending", row.id)
          .run();
      }
    } catch (e) {
      console.error("runDueSequence row failed:", row.id, e);
    }
  }
  return { due: (due.results || []).length, sent };
}

const pageHtml = (title, body) =>
  `<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="robots" content="noindex"><title>${esc(title)}</title></head>` +
  `<body style="font-family:Arial,Helvetica,sans-serif;max-width:520px;margin:12vh auto;padding:0 20px;color:#1A1A1A;line-height:1.6;"><h1 style="font-size:22px;">${esc(title)}</h1>${body}` +
  `<p style="margin-top:28px;font-size:13px;color:#777;"><a href="${SITE}" style="color:#777;">bcsafetydocs.com</a></p></body></html>`;

const htmlResp = (status, title, body) =>
  new Response(pageHtml(title, body), { status, headers: { "Content-Type": "text/html; charset=utf-8", "X-Robots-Tag": "noindex" } });

// GET  /api/unsubscribe?t=TOKEN  -> confirmation page with a button
// POST /api/unsubscribe?t=TOKEN  -> unsubscribes (also the List-Unsubscribe one-click target)
export async function handleUnsubscribe(request, env) {
  const url = new URL(request.url);
  const token = (url.searchParams.get("t") || "").trim();
  if (!/^[a-f0-9]{32}$/.test(token)) return htmlResp(400, "Link not valid", "<p>This unsubscribe link isn't valid. Email <a href=\"mailto:info@bcsafetydocs.com\">info@bcsafetydocs.com</a> and we'll remove you.</p>");

  const sub = await env.DB.prepare("SELECT email, unsubscribed FROM sequence_subs WHERE token = ?").bind(token).first();
  if (!sub) return htmlResp(404, "Link not valid", "<p>We couldn't find that subscription. Email <a href=\"mailto:info@bcsafetydocs.com\">info@bcsafetydocs.com</a> and we'll remove you.</p>");

  if (request.method === "GET") {
    if (sub.unsubscribed) return htmlResp(200, "You're unsubscribed", "<p>You won't get any more of these emails.</p>");
    return htmlResp(
      200,
      "Unsubscribe from COR follow-up emails?",
      `<p>This stops the remaining follow-up emails to ${esc(sub.email)}.</p><form method="post" action="/api/unsubscribe?t=${token}"><button type="submit" style="font-size:16px;padding:10px 22px;cursor:pointer;">Unsubscribe</button></form>`
    );
  }

  // POST: mark unsubscribed and cancel anything still queued (the cron skips unsubscribed addresses too).
  await env.DB.prepare("UPDATE sequence_subs SET unsubscribed = 1, unsubscribed_at = datetime('now') WHERE token = ?").bind(token).run();
  await env.DB.prepare("UPDATE sequence_emails SET status = 'canceled' WHERE email = ? AND status = 'pending'").bind(sub.email).run();
  return htmlResp(200, "You're unsubscribed", "<p>You won't get any more of these emails.</p>");
}
