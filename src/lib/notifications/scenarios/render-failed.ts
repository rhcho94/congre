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
        text: `'${ctx.title}' 영상 편집에 실패했습니다.\n\n대시보드: ${ctx.dashboardUrl}\n문의: support@congre.app`,
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
}
