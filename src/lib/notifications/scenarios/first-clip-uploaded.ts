import { sendNotification } from "../send";
import { renderFirstClipUploadedEmail } from "@/emails/first-clip-uploaded";

export interface FirstClipUploadedCtx {
  eventId: string;
  title: string;
  organizerEmail: string;
  dashboardUrl: string;
}

// Trigger not connected yet — will be wired in a future PR via clips onCreate.
export async function notifyFirstClipUploaded(ctx: FirstClipUploadedCtx): Promise<void> {
  const html = renderFirstClipUploadedEmail({
    title: ctx.title,
    dashboardUrl: ctx.dashboardUrl,
  });

  await sendNotification("first_clip_uploaded", ctx.eventId, [
    {
      channel: "email",
      to: ctx.organizerEmail,
      message: {
        subject: `[Congre] '${ctx.title}' 첫 클립이 업로드되었습니다`,
        html,
        text: `'${ctx.title}' 이벤트에 첫 번째 클립이 업로드되었습니다.\n\n대시보드: ${ctx.dashboardUrl}`,
      },
    },
  ]);
}
