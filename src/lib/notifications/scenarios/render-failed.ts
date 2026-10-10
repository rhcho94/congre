import { sendNotification } from "../send";
import { renderRenderFailedEmail } from "@/emails/render-failed";
import { renderSms, smsTemplates } from "../sms-templates";

export interface RenderFailedCtx {
  eventId: string;
  title: string;
  organizerEmail: string;
  organizerPhone: string;
  dashboardUrl: string;
}

export async function notifyRenderFailed(ctx: RenderFailedCtx): Promise<void> {
  const html = renderRenderFailedEmail({
    title: ctx.title,
    dashboardUrl: ctx.dashboardUrl,
  });

  await sendNotification("render_failed", ctx.eventId, [
    {
      channel: "email",
      to: ctx.organizerEmail,
      message: {
        subject: `[Congre] '${ctx.title}' 영상 편집 실패 안내`,
        html,
        text: `'${ctx.title}' 영상 편집에 실패했습니다.\n\n대시보드: ${ctx.dashboardUrl}\n문의: 카카오톡 채널 @congre, 전화 010-5891-7583`,
      },
    },
    {
      channel: "sms",
      to: ctx.organizerPhone,
      message: {
        text: renderSms(smsTemplates.render_failed, { title: ctx.title }),
      },
    },
  ]);

  // 운영자 알림: 렌더 실패는 환불·수동 복구가 걸리는 사고라 지연·환불과 같은 번호로 보낸다.
  const internalPhone = process.env.CONGRE_INTERNAL_PHONE;
  if (internalPhone) {
    await sendNotification("render_failed_internal", ctx.eventId, [
      {
        channel: "sms",
        to: internalPhone,
        message: { text: `[Congre 운영] 렌더 실패 '${ctx.title}' eventId=${ctx.eventId}` },
      },
    ]);
  }
}
