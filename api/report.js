const MAX_FIELD = 1200;

function clean(value) {
  return String(value || "")
    .replace(/\r/g, "")
    .trim()
    .slice(0, MAX_FIELD);
}

function escapeHtml(value) {
  return clean(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;");
}

function json(res, status, data) {
  res.statusCode = status;
  res.setHeader("Content-Type", "application/json; charset=utf-8");
  res.end(JSON.stringify(data));
}

export default async function handler(req, res) {
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    return json(res, 405, { ok: false, error: "Method not allowed" });
  }

  const token = process.env.TELEGRAM_BOT_TOKEN;
  const chatId = process.env.TELEGRAM_CHAT_ID;

  if (!token || !chatId) {
    return json(res, 500, { ok: false, error: "Report bot is not configured" });
  }

  const body = typeof req.body === "object" && req.body ? req.body : {};
  const source = escapeHtml(body.source || "Regent site");
  const name = escapeHtml(body.name || "anonymous");
  const contact = escapeHtml(body.contact || "");
  const provider = escapeHtml(body.provider || "");
  const city = escapeHtml(body.city || "");
  const windows = escapeHtml(body.windows || "");
  const result = escapeHtml(body.result || "");
  const discord = escapeHtml(body.discord || "");
  const youtube = escapeHtml(body.youtube || "");
  const details = escapeHtml(body.details || "");
  const userAgent = escapeHtml(req.headers["user-agent"] || "");

  const message = [
    "🧪 <b>Regent Connect beta report</b>",
    "",
    `<b>Source:</b> ${source}`,
    `<b>Name:</b> ${name}`,
    contact ? `<b>Contact:</b> ${contact}` : "",
    `<b>Provider:</b> ${provider || "—"}`,
    `<b>City:</b> ${city || "—"}`,
    `<b>Windows:</b> ${windows || "—"}`,
    `<b>Result:</b> ${result || "—"}`,
    `<b>Discord:</b> ${discord || "—"}`,
    `<b>YouTube:</b> ${youtube || "—"}`,
    "",
    details ? `<b>Details:</b>\n${details}` : "",
    "",
    `<b>User-Agent:</b> ${userAgent || "—"}`
  ].filter(Boolean).join("\n");

  const response = await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      chat_id: chatId,
      text: message.slice(0, 3900),
      parse_mode: "HTML",
      disable_web_page_preview: true
    })
  });

  if (!response.ok) {
    const errorText = await response.text();
    return json(res, 502, { ok: false, error: errorText.slice(0, 500) });
  }

  return json(res, 200, { ok: true });
}
