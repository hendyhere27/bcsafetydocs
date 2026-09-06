// bcsafetydocs-free-docs — serves the free-download lead capture flow.
// Route: bcsafetydocs.com/api/* (path-based, coexists with the Pages-served static site)
//
// Each free document page POSTs { email, product } to /api/free-download.
// This worker emails the download link via Resend and adds the contact to
// Resend's "General" segment (bcsafetydocs.com's Resend account is capped at
// 3 segments and all are in use, so contacts are tagged via `properties`
// instead of a dedicated segment) for future subscription marketing.

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
};

const GENERAL_SEGMENT_ID = "f0329a1b-f3c8-4497-af7c-8db460dbbabe";
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
  async fetch(request, env) {
    if (request.method === "OPTIONS") {
      return new Response(null, { headers: corsHeaders() });
    }

    const url = new URL(request.url);

    if (url.pathname === "/api/free-download" && request.method === "POST") {
      return handleFreeDownload(request, env);
    }

    return json({ ok: false, error: "Not found" }, 404);
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

  // Best-effort contact capture — never fail the user-facing request over this.
  try {
    const contactResp = await fetch("https://api.resend.com/contacts", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${env.RESEND_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        email,
        segments: [GENERAL_SEGMENT_ID],
        properties: { lead_source: "free_download", last_free_product: product },
      }),
    });
    if (!contactResp.ok) {
      console.error("Resend create-contact non-OK:", contactResp.status, await contactResp.text());
    }
  } catch (e) {
    console.error("Resend create-contact threw:", e);
  }

  return json({ ok: true }, 200);
}
