const C = {
  bg: "#EEF4FB",
  surface: "#ffffff",
  text: "#222222",
  muted: "#4A5468",
  accent: "#1F3C9C",
  border: "#C9D6EA",
  dangerBg: "#fff5f5",
  dangerText: "#A61B1B",
};

// 머리글 로고 이미지(public/email-logo.png, 250×80을 절반 크기로 표시)
const APP_URL = process.env.NEXT_PUBLIC_APP_URL || "https://app.congre.kr";

export function baseEmail(preview: string, body: string): string {
  return `<!DOCTYPE html>
<html lang="ko">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>${preview}</title>
</head>
<body style="margin:0;padding:40px 0;background:${C.bg};font-family:'Apple SD Gothic Neo','Malgun Gothic','맑은 고딕',sans-serif;">
  <table role="presentation" cellpadding="0" cellspacing="0" width="100%" style="max-width:580px;margin:0 auto;">
    <tr><td>
      <!-- Header -->
      <table role="presentation" cellpadding="0" cellspacing="0" width="100%"
             style="background:${C.surface};border-bottom:1px solid ${C.border};">
        <tr>
          <td style="padding:28px 40px;">
            <img src="${APP_URL}/email-logo.png" width="125" height="40" alt="Congre" style="display:block;border:0;outline:none;text-decoration:none">
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
              문의: 카카오톡 채널 @congre, 전화 010-5891-7583
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
