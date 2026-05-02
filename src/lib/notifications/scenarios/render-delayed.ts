import { sendNotification } from "../send";
import { renderRenderCompletedEmail } from "@/emails/render-completed";
import { renderSms, smsTemplates } from "../sms-templates";

export interface RenderDelayedCtx {
  eventId: string;
  title: string;
  videoUrl: string;
  organizerEmail: string;
  organizerPhone: string;
  dashboardUrl: string;
}

export async function notifyRenderDelayed(ctx: RenderDelayedCtx): Promise<void> {
  const html = renderRenderCompletedEmail({
    title: ctx.title,
    videoUrl: ctx.videoUrl,
    dashboardUrl: ctx.dashboardUrl,
    isDelayed: true,
  });

  await sendNotification("render_delayed", ctx.eventId, [
    {
      channel: "email",
      to: ctx.organizerEmail,
      message: {
        subject: `[Congre] '${ctx.title}' 영상 편집이 완료되었습니다 (지연)`,
        html,
        text: `'${ctx.title}' 영상 편집이 완료되었습니다. 예상보다 시간이 걸렸습니다.\n\n영상: ${ctx.videoUrl}\n대시보드: ${ctx.dashboardUrl}`,
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
}
