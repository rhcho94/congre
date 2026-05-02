import { sendNotification } from "../send";
import { renderRenderCompletedEmail } from "@/emails/render-completed";
import { renderSms, smsTemplates } from "../sms-templates";

export interface RenderCompletedCtx {
  eventId: string;
  title: string;
  videoUrl: string;
  organizerEmail: string;
  organizerPhone: string;
  dashboardUrl: string;
}

export async function notifyRenderCompleted(ctx: RenderCompletedCtx): Promise<void> {
  const html = renderRenderCompletedEmail({
    title: ctx.title,
    videoUrl: ctx.videoUrl,
    dashboardUrl: ctx.dashboardUrl,
    isDelayed: false,
  });

  await sendNotification("render_completed", ctx.eventId, [
    {
      channel: "email",
      to: ctx.organizerEmail,
      message: {
        subject: `[Congre] '${ctx.title}' 영상 편집이 완료되었습니다`,
        html,
        text: `'${ctx.title}' 영상 편집이 완료되었습니다.\n\n영상: ${ctx.videoUrl}\n대시보드: ${ctx.dashboardUrl}`,
      },
    },
    {
      channel: "sms",
      to: ctx.organizerPhone,
      message: {
        text: renderSms(smsTemplates.render_completed, {
          title: ctx.title,
          url: ctx.dashboardUrl,
        }),
      },
    },
  ]);
}
