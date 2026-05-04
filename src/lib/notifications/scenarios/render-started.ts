import { sendNotification } from "../send";
import { renderRenderStartedEmail } from "@/emails/render-started";
import { renderSms, smsTemplates } from "../sms-templates";

export interface RenderStartedCtx {
  eventId: string;
  title: string;
  clipCount: number;
  renderEstimateMin: number;
  organizerEmail: string;
  organizerPhone: string;
  dashboardUrl: string;
}

export async function notifyRenderStarted(ctx: RenderStartedCtx): Promise<void> {
  const html = renderRenderStartedEmail({
    title: ctx.title,
    clipCount: ctx.clipCount,
    renderEstimateMin: ctx.renderEstimateMin,
    dashboardUrl: ctx.dashboardUrl,
  });

  await sendNotification("render_started", ctx.eventId, [
    {
      channel: "email",
      to: ctx.organizerEmail,
      message: {
        subject: `[Congre] '${ctx.title}' 영상 편집이 시작되었습니다`,
        html,
        text: `'${ctx.title}' 영상 편집이 시작되었습니다. 클립 ${ctx.clipCount}개 처리 중.\n\n대시보드: ${ctx.dashboardUrl}`,
      },
    },
    {
      channel: "sms",
      to: ctx.organizerPhone,
      message: {
        text: renderSms(smsTemplates.render_started, { title: ctx.title }),
      },
    },
  ]);
}
