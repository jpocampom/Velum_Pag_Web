/* =====================================================================
   VELUM — contact form endpoint (Vercel Serverless Function)
   Receives the contact form POST and sends the lead by email via Resend.
   Secrets/config come from environment variables (never in code):
     RESEND_API_KEY   (required)  Resend API key
     CONTACT_TO       (required)  destination inbox for leads
     CONTACT_FROM     (optional)  verified sender, e.g. "VELUM <no-reply@by-velum.com>"
   ===================================================================== */

export default async function handler(req, res) {
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    return res.status(405).json({ ok: false, error: "method_not_allowed" });
  }

  try {
    const body = await readJson(req);
    const clean = (s) => String(s == null ? "" : s).trim().slice(0, 2000);

    // Honeypot — real users leave this empty. Silently accept & drop bots.
    if (clean(body._hp)) return res.status(200).json({ ok: true });

    const nombre = clean(body.nombre);
    const empresa = clean(body.empresa);
    const email = clean(body.email);
    const sector = clean(body.sector);
    const volumen = clean(body.volumen);
    const telefono = clean(body.telefono);
    const mensaje = clean(body.mensaje);
    const lang = clean(body.lang) || "es";
    const page = clean(body.page);
    const consent = body.consent === true || body.consent === "true" || body.consent === "on";

    const emailOk = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
    if (!nombre || !empresa || !emailOk || !consent) {
      return res.status(400).json({ ok: false, error: "invalid_input" });
    }

    const KEY = process.env.RESEND_API_KEY;
    const TO = process.env.CONTACT_TO;
    const FROM = process.env.CONTACT_FROM || "VELUM <no-reply@by-velum.com>";
    if (!KEY || !TO) {
      // Log which variable is missing (never the values) so it shows in Runtime Logs.
      console.error("not_configured", { RESEND_API_KEY: !!KEY, CONTACT_TO: !!TO, CONTACT_FROM: !!process.env.CONTACT_FROM });
      return res.status(500).json({ ok: false, error: "not_configured" });
    }

    const esc = (s) => String(s).replace(/[<>&"]/g, (c) =>
      ({ "<": "&lt;", ">": "&gt;", "&": "&amp;", '"': "&quot;" }[c]));
    const rows = [
      ["Nombre", nombre], ["Empresa", empresa], ["Sector", sector],
      ["Volumen", volumen], ["Email", email], ["Teléfono", telefono],
      ["Idioma", lang], ["Página", page],
    ];
    const html = `<div style="font-family:Arial,Helvetica,sans-serif;font-size:14px;color:#211F1B;line-height:1.5">
      <h2 style="font-weight:600;margin:0 0 12px">Nuevo contacto · VELUM</h2>
      <table style="border-collapse:collapse">${rows.map(([k, v]) =>
        `<tr><td style="padding:4px 16px 4px 0;color:#7C786E;vertical-align:top">${k}</td><td style="padding:4px 0"><strong>${esc(v) || "—"}</strong></td></tr>`).join("")}</table>
      <p style="margin:16px 0 0;white-space:pre-wrap">${esc(mensaje) || "—"}</p>
    </div>`;
    const text = rows.map(([k, v]) => `${k}: ${v || "—"}`).join("\n") + `\n\nMensaje:\n${mensaje || "—"}`;

    const r = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: { Authorization: `Bearer ${KEY}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        from: FROM,
        to: [TO],
        reply_to: email,
        subject: `Nuevo contacto · ${empresa}${sector ? " · " + sector : ""}`,
        html,
        text,
      }),
    });

    if (!r.ok) {
      const detail = await r.text().catch(() => "");
      console.error("resend_error", r.status, detail);
      return res.status(502).json({ ok: false, error: "send_failed" });
    }
    return res.status(200).json({ ok: true });
  } catch (err) {
    console.error("contact_handler_error", err);
    return res.status(500).json({ ok: false, error: "server_error" });
  }
}

function readJson(req) {
  return new Promise((resolve) => {
    if (req.body && typeof req.body === "object") return resolve(req.body);
    let data = "";
    req.on("data", (c) => { data += c; if (data.length > 1e6) req.destroy(); });
    req.on("end", () => { try { resolve(JSON.parse(data || "{}")); } catch (e) { resolve({}); } });
    req.on("error", () => resolve({}));
  });
}
