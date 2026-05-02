const C = {
  bg: "#f5f0e8",
  surface: "#ffffff",
  text: "#1a1208",
  muted: "#6b6560",
  accent: "#c8892c",
  border: "#e5dfd6",
  dangerBg: "#fff5f5",
  dangerText: "#c0392b",
};

export function baseEmail(preview: string, body: string): string {
  return `<!DOCTYPE html>
<html lang="ko">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>${preview}</title>
</head>
<body style="margin:0;padding:40px 0;background:${C.bg};font-family:'DM Sans',Helvetica,Arial,sans-serif;">
  <table role="presentation" cellpadding="0" cellspacing="0" width="100%" style="max-width:580px;margin:0 auto;">
    <tr><td>
      <!-- Header -->
      <table role="presentation" cellpadding="0" cellspacing="0" width="100%"
             style="background:${C.surface};border-bottom:1px solid ${C.border};">
        <tr>
          <td style="padding:28px 40px;">
            <span style="font-size:20px;font-weight:700;color:${C.accent};letter-spacing:0.12em;">Congre</span>
          </td>
        </tr>
      </table>
      <!-- Body -->
      <table role="presentation" cellpadding="0" cellspacing="0" width="100%"
             style="background:${C.surface};">
        <tr><td style="padding:32px 40px 40px;">${body}</td></tr>
      </table>
      <!-- Footer -->
      <table role="presentation" cellpadding="0" cellspacing="0" width="100%"
             style="background:${C.surface};border-top:1px solid ${C.border};">
        <tr>
          <td style="padding:20px 40px 32px;">
            <p style="margin:0;font-size:11px;color:${C.muted};line-height:1.7;">
              이 메일은 Congre에서 발송된 자동 알림입니다.<br>
              문의: support@congre.app
            </p>
          </td>
        </tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`;
}

export { C };
