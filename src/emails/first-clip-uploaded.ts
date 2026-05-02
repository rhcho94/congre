import { baseEmail, C } from "./layouts/base";

export interface FirstClipUploadedEmailCtx {
  title: string;
  dashboardUrl: string;
}

export function renderFirstClipUploadedEmail(ctx: FirstClipUploadedEmailCtx): string {
  return baseEmail(
    `'${ctx.title}' 첫 번째 클립이 업로드되었습니다`,
    `
    <h1 style="margin:0 0 8px;font-size:22px;font-weight:700;color:${C.text};">첫 번째 클립이 업로드되었습니다</h1>
    <p style="margin:0 0 28px;font-size:14px;color:${C.muted};">참가자들이 영상을 찍기 시작했습니다!</p>
    <table role="presentation" cellpadding="0" cellspacing="0" width="100%"
           style="background:${C.bg};border:1px solid ${C.border};border-radius:4px;margin-bottom:28px;">
      <tr>
        <td style="padding:20px 24px;">
          <p style="margin:0 0 6px;font-size:11px;color:${C.muted};text-transform:uppercase;letter-spacing:0.1em;">이벤트</p>
          <p style="margin:0;font-size:17px;font-weight:700;color:${C.text};">${ctx.title}</p>
        </td>
      </tr>
    </table>
    <p style="margin:0 0 20px;font-size:14px;color:${C.text};line-height:1.7;">
      대시보드에서 업로드된 클립을 실시간으로 확인할 수 있습니다.
    </p>
    <a href="${ctx.dashboardUrl}"
       style="display:inline-block;padding:12px 28px;background:${C.accent};color:#fff;font-size:13px;font-weight:600;text-decoration:none;border-radius:2px;letter-spacing:0.05em;">
      대시보드 확인하기 →
    </a>
    `
  );
}
