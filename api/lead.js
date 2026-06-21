import { validateLead } from "../js/validation.js";

function clean(value, maxLength = 160) {
  return String(value ?? "").trim().slice(0, maxLength);
}

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ ok: false, error: "Method not allowed" });
  }

  const lead = {
    name: clean(req.body?.name, 80),
    contact: clean(req.body?.contact, 120),
    program: clean(req.body?.program, 80),
  };
  const errors = validateLead(lead);

  if (Object.keys(errors).length) {
    return res.status(400).json({ ok: false, errors });
  }

  const token = process.env.TELEGRAM_BOT_TOKEN;
  const chatId = process.env.TELEGRAM_CHAT_ID;

  if (!token || !chatId) {
    return res
      .status(503)
      .json({ ok: false, error: "Delivery is not configured" });
  }

  const text = [
    "Новая заявка Usmanova Fit",
    `Имя: ${lead.name}`,
    `Контакт: ${lead.contact}`,
    `Программа: ${lead.program}`,
  ].join("\n");

  try {
    const reply = await fetch(
      `https://api.telegram.org/bot${token}/sendMessage`,
      {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ chat_id: chatId, text }),
      },
    );

    if (!reply.ok) {
      return res
        .status(502)
        .json({ ok: false, error: "Telegram delivery failed" });
    }

    return res.status(200).json({ ok: true });
  } catch {
    return res.status(502).json({ ok: false, error: "Network error" });
  }
}
