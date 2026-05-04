import { baseEmail, C } from "./layouts/base";

export interface Refund100EmailCtx {
  title: string;
  dashboardUrl: string;
}

export function renderRefund100Email(ctx: Refund100EmailCtx): string {
  return baseEmail(
    `'${ctx.title}' 편집 지연 — 100% 환불 확정 안내`,
    `
    <h1 style="margin:0 0 8px;font-size:22px;font-weight:700;color:${C.text};">100% 환불이 확정되었습니다</h1>
    <p style="margin:0 0 28px;font-size:14px;color:${C.muted};">심각한 지연에 대해 깊이 사과드립니다.</p>
    <table role="presentation" cellpadding="0" cellspacing="0" width="100%"
           style="background:${C.bg};border:1px solid ${C.border};border-radius:4px;margin-bottom:28px;">
      <tr>
        <td style="padding:20px 24px;">
          <p style="margin:0 0 6px;font-size:11px;color:${C.muted};text-transform:uppercase;letter-spacing:0.1em;">이벤트</p>
          <p style="margin:0 0 16px;font-size:17px;font-weight:700;color:${C.text};">${ctx.title}</p>
          <p style="margin:0 0 4px;font-size:11px;color:${C.muted};text-transform:uppercase;letter-spacing:0.1em;">환불 내용</p>
          <p style="margin:0;font-size:14px;font-weight:700;color:${C.accent};">결제 금액의 100% 환불 확정</p>
        </td>
      </tr>
    </table>
    <p style="margin:0 0 16px;font-size:14px;color:${C.text};line-height:1.7;">
      24시간이 지나도록 영상 편집이 완료되지 못한 점에 대해 <strong>결제 금액 전액을 환불</strong>해 드리기로 확정하였습니다.
    </p>
    <p style="margin:0 0 24px;font-size:14px;color:${C.text};line-height:1.7;">
      단, <strong>영상 작업은 끝까지 완성하여 반드시 전달드립니다.</strong> 이것은 저희의 약속입니다. 완성 즉시 별도로 안내드리겠습니다.
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
