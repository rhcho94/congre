import { baseEmail, C } from "./layouts/base";

export interface ParticipantResultEmailCtx {
  title: string;
  videoUrl: string;
}

export function renderParticipantResultEmail(ctx: ParticipantResultEmailCtx): string {
  return baseEmail(
    `'${ctx.title}' 결과 영상이 준비되었습니다`,
    `
    <h1 style="margin:0 0 8px;font-size:22px;font-weight:700;color:${C.text};">결과 영상이 준비되었습니다</h1>
    <p style="margin:0 0 28px;font-size:14px;color:${C.muted};">함께 만든 추억 영상을 확인해 보세요.</p>
    <table role="presentation" cellpadding="0" cellspacing="0" width="100%"
           style="background:${C.bg};border:1px solid ${C.border};border-radius:4px;margin-bottom:28px;">
      <tr>
        <td style="padding:20px 24px;">
          <p style="margin:0 0 6px;font-size:11px;color:${C.muted};text-transform:uppercase;letter-spacing:0.1em;">이벤트</p>
          <p style="margin:0;font-size:17px;font-weight:700;color:${C.text};">${ctx.title}</p>
        </td>
      </tr>
    </table>
    <a href="${ctx.videoUrl}"
       style="display:inline-block;padding:12px 28px;background:${C.accent};color:#fff;font-size:13px;font-weight:600;text-decoration:none;border-radius:2px;letter-spacing:0.05em;margin-bottom:12px;">
      영상 보러가기 →
    </a>
    `
  );
}
