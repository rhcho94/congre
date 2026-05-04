import { baseEmail, C } from "./layouts/base";

export interface Refund50EmailCtx {
  title: string;
  dashboardUrl: string;
}

export function renderRefund50Email(ctx: Refund50EmailCtx): string {
  return baseEmail(
    `'${ctx.title}' 편집 지연 — 50% 환불 확정 안내`,
    `
    <h1 style="margin:0 0 8px;font-size:22px;font-weight:700;color:${C.text};">50% 환불이 확정되었습니다</h1>
    <p style="margin:0 0 28px;font-size:14px;color:${C.muted};">오랜 기다림에 다시 한 번 사과드립니다.</p>
    <table role="presentation" cellpadding="0" cellspacing="0" width="100%"
           style="background:${C.bg};border:1px solid ${C.border};border-radius:4px;margin-bottom:28px;">
      <tr>
        <td style="padding:20px 24px;">
          <p style="margin:0 0 6px;font-size:11px;color:${C.muted};text-transform:uppercase;letter-spacing:0.1em;">이벤트</p>
          <p style="margin:0 0 16px;font-size:17px;font-weight:700;color:${C.text};">${ctx.title}</p>
          <p style="margin:0 0 4px;font-size:11px;color:${C.muted};text-transform:uppercase;letter-spacing:0.1em;">환불 내용</p>
          <p style="margin:0;font-size:14px;font-weight:700;color:${C.accent};">결제 금액의 50% 환불 확정</p>
        </td>
      </tr>
    </table>
    <p style="margin:0 0 16px;font-size:14px;color:${C.text};line-height:1.7;">
      영상 편집이 예상보다 크게 지연된 점에 대해 결제 금액의 <strong>50%를 환불해 드리기로 확정</strong>하였습니다. 영상은 현재도 편집 중이며, 완성 즉시 전달드립니다.
    </p>
    <p style="margin:0 0 24px;font-size:14px;color:${C.text};line-height:1.7;">
      환불은 저희 팀이 직접 처리하며, 절차 안내는 카카오톡 채널로 연락 주시면 안내드리겠습니다.
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
