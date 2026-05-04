import { baseEmail, C } from "./layouts/base";

export interface RenderDelayedEmailCtx {
  title: string;
  dashboardUrl: string;
}

export function renderRenderDelayedEmail(ctx: RenderDelayedEmailCtx): string {
  return baseEmail(
    `'${ctx.title}' 영상 편집이 지연되고 있습니다`,
    `
    <h1 style="margin:0 0 8px;font-size:22px;font-weight:700;color:${C.text};">영상 편집이 지연되고 있습니다</h1>
    <p style="margin:0 0 28px;font-size:14px;color:${C.muted};">진심으로 사과드립니다. 예상보다 시간이 더 걸리고 있습니다.</p>
    <table role="presentation" cellpadding="0" cellspacing="0" width="100%"
           style="background:${C.bg};border:1px solid ${C.border};border-radius:4px;margin-bottom:28px;">
      <tr>
        <td style="padding:20px 24px;">
          <p style="margin:0 0 6px;font-size:11px;color:${C.muted};text-transform:uppercase;letter-spacing:0.1em;">이벤트</p>
          <p style="margin:0;font-size:17px;font-weight:700;color:${C.text};">${ctx.title}</p>
        </td>
      </tr>
    </table>
    <p style="margin:0 0 16px;font-size:14px;color:${C.text};line-height:1.7;">
      현재 영상 편집이 예상 완료 시각을 초과하였습니다. 저희 팀이 빠르게 확인하고 있으며, 영상은 반드시 완성하여 전달드리겠습니다.
    </p>
    <p style="margin:0 0 24px;font-size:14px;color:${C.text};line-height:1.7;">
      지금으로부터 <strong>30분 이내에도 완료되지 않을 경우 결제 금액의 50%가 자동으로 환불 확정</strong>됩니다. 별도로 연락드리겠습니다.
    </p>
    <a href="${ctx.dashboardUrl}"
       style="display:inline-block;padding:12px 28px;background:${C.accent};color:#fff;font-size:13px;font-weight:600;text-decoration:none;border-radius:2px;letter-spacing:0.05em;margin-bottom:20px;">
      대시보드 확인하기 →
    </a>
    <p style="margin:20px 0 0;font-size:13px;color:${C.muted};line-height:1.7;">
      환불 절차 문의: 카카오톡 채널 <strong style="color:${C.text};">@congre</strong><br>
      불편을 드려 진심으로 죄송합니다. — 꽁그레팀 드림
    </p>
    `
  );
}
