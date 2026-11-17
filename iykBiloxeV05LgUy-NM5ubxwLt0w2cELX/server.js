const http = require('node:http');

const PORT = 3000;
const HOST = '127.0.0.1';
const FROM = 'NexonMC Support <support@nexonmc.org>';
const COLOR = '#5865F2';

const esc = (s) =>
  String(s)
    .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;').replace(/'/g, '&#39;');

const embed = (title, message) => `
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:600px;font-family:Arial,sans-serif;">
  <tr>
    <td width="4" style="background:${COLOR};"></td>
    <td style="background:#f2f3f5;padding:16px 20px;">
      <p style="margin:0 0 4px;font-size:12px;color:#5c5e66;font-weight:bold;">NexonMC Support</p>
      <h2 style="margin:0 0 10px;font-size:18px;color:#060607;">${esc(title)}</h2>
      <p style="margin:0;font-size:14px;line-height:1.5;color:#2e3338;">${esc(message).replace(/\r?\n/g, '<br>')}</p>
    </td>
  </tr>
</table>`;

const page = (notice = '') => `<!DOCTYPE html>
<html><body style="font-family:Arial,sans-serif;max-width:600px;margin:40px auto;">
  <h1>NexonMC Support</h1>
  ${notice}
  <form method="POST">
    <p><input name="to" type="email" placeholder="Recipient email" required style="width:100%"></p>
    <p><input name="subject" placeholder="Subject" required style="width:100%"></p>
    <p><input name="title" placeholder="Embed title (optional)" style="width:100%"></p>
    <p><textarea name="message" rows="8" placeholder="Message" required style="width:100%"></textarea></p>
    <button>Send</button>
  </form>
</body></html>`;

http.createServer(async (req, res) => {
  if (req.method !== 'POST') {
    res.writeHead(200, { 'Content-Type': 'text/html' });
    return res.end(page());
  }

  let body = '';
  for await (const chunk of req) body += chunk;
  const form = new URLSearchParams(body);
  const to = form.get('to')?.trim();
  const subject = form.get('subject')?.trim().replace(/[\r\n]+/g, ' ');
  const title = form.get('title')?.trim() || subject;
  const message = form.get('message')?.trim();

  const r = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${process.env.RESEND_API_KEY}`,
    },
    body: JSON.stringify({
      from: FROM,
      to: [to],
      subject,
      html: embed(title, message),
      text: `${title}\n\n${message}`,
    }),
  });
  const data = await r.json();

  const notice = r.ok
    ? `<p style="color:green;">Sent to ${esc(to)}.</p>`
    : `<p style="color:red;">Error: ${esc(data.message || 'Send failed')}</p>`;

  res.writeHead(200, { 'Content-Type': 'text/html' });
  res.end(page(notice));
}).listen(PORT, HOST, () => console.log(`Open http://localhost:${PORT}`));
