import { baseEmail, C } from "./layouts/base";

export interface EventCreatedEmailCtx {
  title: string;
  date: string;
  dashboardUrl: string;
}

export function renderEventCreatedEmail(ctx: EventCreatedEmailCtx): string {
  return baseEmail(
    `'${ctx.title}' 이벤트가 생성되었습니다`,
    `
    <h1 style="margin:0 0 8px;font-size:22px;font-weight:700;color:${C.text};">이벤트가 생성되었습니다</h1>
    <p style="margin:0 0 28px;font-size:14px;color:${C.muted};">참가자를 초대할 준비가 완료되었습니다.</p>
    <table role="presentation" cellpadding="0" cellspacing="0" width="100%"
           style="background:${C.bg};border:1px solid ${C.border};border-radius:4px;margin-bottom:28px;">
      <tr>
        <td style="padding:20px 24px;">
          <p style="margin:0 0 6px;font-size:11px;color:${C.muted};text-transform:uppercase;letter-spacing:0.1em;">이벤트 이름</p>
          <p style="margin:0 0 16px;font-size:17px;font-weight:700;color:${C.text};">${ctx.title}</p>
          <p style="margin:0 0 4px;font-size:11px;color:${C.muted};text-transform:uppercase;letter-spacing:0.1em;">이벤트 날짜</p>
          <p style="margin:0;font-size:14px;color:${C.text};">${ctx.date}</p>
        </td>
      </tr>
    </table>
    <p style="margin:0 0 20px;font-size:14px;color:${C.text};line-height:1.7;">
      대시보드에서 QR 코드와 공유 링크를 확인하고 참가자를 초대하세요.
      마감 후 자동으로 영상 편집이 시작됩니다.
    </p>
    <a href="${ctx.dashboardUrl}"
       style="display:inline-block;padding:12px 28px;background:${C.accent};color:#fff;font-size:13px;font-weight:600;text-decoration:none;border-radius:2px;letter-spacing:0.05em;">
      대시보드 바로가기 →
    </a>
    `
  );
}
