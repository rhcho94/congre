import { baseEmail, C } from "./layouts/base";

export interface RenderCompletedEmailCtx {
  title: string;
  videoUrl: string;
  dashboardUrl: string;
  refundStatus?: "none" | "50" | "100";
}

export function renderRenderCompletedEmail(ctx: RenderCompletedEmailCtx): string {
  const refundBlock =
    ctx.refundStatus === "50" || ctx.refundStatus === "100"
      ? `<p style="margin:0 0 20px;font-size:13px;color:${C.muted};line-height:1.7;padding:12px 16px;background:${C.bg};border-left:3px solid ${C.accent};">
        ${ctx.refundStatus}% 환불이 확정된 상태입니다. 환불 절차 문의: 카카오톡 <strong style="color:${C.text};">@congre</strong>
      </p>`
      : "";

  return baseEmail(
    `'${ctx.title}' 영상 편집 완료`,
    `
    <h1 style="margin:0 0 8px;font-size:22px;font-weight:700;color:${C.text};">영상 편집이 완료되었습니다</h1>
    <p style="margin:0 0 28px;font-size:14px;color:${C.muted};">완성된 영상을 지금 바로 확인하세요.</p>
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
      대시보드에서 완성된 영상을 확인하고 SNS에 공유해 보세요.
    </p>
    <a href="${ctx.dashboardUrl}"
       style="display:inline-block;padding:12px 28px;background:${C.accent};color:#fff;font-size:13px;font-weight:600;text-decoration:none;border-radius:2px;letter-spacing:0.05em;margin-bottom:12px;">
      영상 확인하기 →
    </a>
    <br>
    <a href="${ctx.videoUrl}"
       style="display:inline-block;margin-top:8px;font-size:12px;color:${C.accent};text-decoration:underline;">
      영상 직접 링크
    </a>
    ${refundBlock}
    `
  );
}
