import { sendNotification } from "../send";
import { renderParticipantResultEmail } from "@/emails/participant-result";
import { renderSms, smsTemplates } from "../sms-templates";

export interface ParticipantResultCtx {
  eventId: string;
  title: string;
  videoUrl: string;
  recipientEmail?: string;
  recipientPhone?: string;
}

// Trigger not connected yet — will be wired in a future PR when participant contact collection is built.
export async function notifyParticipantResult(ctx: ParticipantResultCtx): Promise<void> {
  const targets = [];

  if (ctx.recipientEmail) {
    const html = renderParticipantResultEmail({ title: ctx.title, videoUrl: ctx.videoUrl });
    targets.push({
      channel: "email" as const,
      to: ctx.recipientEmail,
      message: {
        subject: `[Congre] '${ctx.title}' 결과 영상이 준비되었습니다`,
        html,
        text: `'${ctx.title}' 결과 영상이 준비되었습니다.\n\n영상: ${ctx.videoUrl}`,
      },
    });
  }

  if (ctx.recipientPhone) {
    targets.push({
      channel: "sms" as const,
      to: ctx.recipientPhone,
      message: {
        text: renderSms(smsTemplates.participant_result, {
          title: ctx.title,
          url: ctx.videoUrl,
        }),
      },
    });
  }

  if (targets.length > 0) {
    await sendNotification("participant_result", ctx.eventId, targets);
  }
}
