import { sendNotification } from "../send";
import { renderRenderDelayedEmail } from "@/emails/render-delayed";
import { renderSms, smsTemplates } from "../sms-templates";

export interface RenderDelayedCtx {
  eventId: string;
  title: string;
  organizerEmail: string;
  organizerPhone: string;
  dashboardUrl: string;
}

export async function notifyRenderDelayed(ctx: RenderDelayedCtx): Promise<void> {
  const html = renderRenderDelayedEmail({
    title: ctx.title,
    dashboardUrl: ctx.dashboardUrl,
  });

  await sendNotification("render_delayed", ctx.eventId, [
    {
      channel: "email",
      to: ctx.organizerEmail,
      message: {
        subject: `[Congre] '${ctx.title}' 영상 편집이 지연되고 있습니다`,
        html,
        text: `'${ctx.title}' 영상 편집이 지연되고 있습니다. 결제 후 4시간이 지나도록 완료되지 않으면 50% 환불이 확정됩니다. 문의: 카카오톡 @congre\n\n대시보드: ${ctx.dashboardUrl}`,
      },
    },
    {
      channel: "sms",
      to: ctx.organizerPhone,
      message: {
        text: renderSms(smsTemplates.render_delayed, { title: ctx.title }),
      },
    },
  ]);

  // TODO [6]: process.env.CONGRE_INTERNAL_PHONE 환경변수 등록 후 사내 SMS×2 활성화
  const internalPhone = process.env.CONGRE_INTERNAL_PHONE;
  if (internalPhone) {
    const internalText = renderSms(smsTemplates.render_delayed, { title: ctx.title });
    await sendNotification("render_delayed_internal", ctx.eventId, [
      { channel: "sms", to: internalPhone, message: { text: internalText } },
      { channel: "sms", to: internalPhone, message: { text: internalText } },
    ]);
  }
}
