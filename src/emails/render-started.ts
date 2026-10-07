import { baseEmail, C } from "./layouts/base";

export interface RenderStartedEmailCtx {
  title: string;
  clipCount: number;
  renderEstimateMin: number;
  dashboardUrl: string;
}

export function renderRenderStartedEmail(ctx: RenderStartedEmailCtx): string {
  return baseEmail(
    `'${ctx.title}' 영상 편집이 시작되었습니다`,
    `
    <h1 style="margin:0 0 8px;font-size:22px;font-weight:700;color:${C.text};">영상 편집이 시작되었습니다</h1>
    <p style="margin:0 0 28px;font-size:14px;color:${C.muted};">클립을 자동으로 합쳐 하나의 영상을 만들고 있습니다.</p>
    <table role="presentation" cellpadding="0" cellspacing="0" width="100%"
           style="background:${C.bg};border:1px solid ${C.border};border-radius:4px;margin-bottom:28px;">
      <tr>
        <td style="padding:20px 24px;">
          <p style="margin:0 0 6px;font-size:11px;color:${C.muted};">이벤트</p>
          <p style="margin:0 0 16px;font-size:17px;font-weight:700;color:${C.text};">${ctx.title}</p>
          <p style="margin:0 0 4px;font-size:11px;color:${C.muted};">편집 클립 수</p>
          <p style="margin:0;font-size:14px;color:${C.text};">${ctx.clipCount}개</p>
        </td>
      </tr>
    </table>
    <p style="margin:0 0 20px;font-size:14px;color:${C.text};line-height:1.7;">
      편집은 통상 10분 이내에 끝납니다. 완료되면 별도로 알림을 보내드립니다.
    </p>
    <a href="${ctx.dashboardUrl}"
       style="display:inline-block;padding:12px 28px;background:${C.accent};color:#fff;font-size:13px;font-weight:600;text-decoration:none;border-radius:6px;">
      대시보드 확인하기
    </a>
    `
  );
}
