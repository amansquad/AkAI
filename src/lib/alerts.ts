// Messages for the app's owner, sent by the sticker bot to TELEGRAM_ALERT_CHAT_ID
// (the same chat as the daily crash digest). Quietly does nothing when that
// isn't set up, and never throws: an alert must not break the request it is about.
export async function alertOwner(text: string): Promise<boolean> {
  const token = process.env.TELEGRAM_BOT_TOKEN?.trim();
  const chat = process.env.TELEGRAM_ALERT_CHAT_ID?.trim();
  if (!token || !chat) return false;
  try {
    const r = await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ chat_id: chat, text: text.slice(0, 4000), disable_web_page_preview: true }),
    });
    return r.ok;
  } catch {
    return false;
  }
}
