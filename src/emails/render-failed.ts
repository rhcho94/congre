import { baseEmail, C } from "./layouts/base";

export interface RenderFailedEmailCtx {
  title: string;
  dashboardUrl: string;
}

export function renderRenderFailedEmail(ctx: RenderFailedEmailCtx): string {
  return baseEmail(
    `'${ctx.title}' 영상 편집 실패 안내`,
    `
    <h1 style="margin:0 0 8px;font-size:22px;font-weight:700;color:${C.text};">영상 편집에 실패했습니다</h1>
    <p style="margin:0 0 28px;font-size:14px;color:${C.muted};">죄송합니다. 편집 처리 중 오류가 발생했습니다.</p>
    <table role="presentation" cellpadding="0" cellspacing="0" width="100%"
           style="background:#fff5f5;border:1px solid #f5c6cb;border-radius:4px;margin-bottom:28px;">
      <tr>
        <td style="padding:20px 24px;">
          <p style="margin:0 0 6px;font-size:11px;color:${C.muted};text-transform:uppercase;letter-spacing:0.1em;">이벤트</p>
          <p style="margin:0;font-size:17px;font-weight:700;color:${C.text};">${ctx.title}</p>
        </td>
      </tr>
    </table>
    <p style="margin:0 0 16px;font-size:14px;color:${C.text};line-height:1.7;">
      대시보드에서 이벤트 상태를 확인하고 다시 편집을 시도해 보세요.
      문제가 지속되면 support@congre.app으로 문의해 주세요.
    </p>
    <a href="${ctx.dashboardUrl}"
       style="display:inline-block;padding:12px 28px;background:${C.accent};color:#fff;font-size:13px;font-weight:600;text-decoration:none;border-radius:2px;letter-spacing:0.05em;">
      대시보드 확인하기 →
    </a>
    `
  );
}
