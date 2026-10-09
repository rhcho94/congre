import { sendNotification } from "../send";
import { renderParticipantResultEmail } from "@/emails/participant-result";
import { renderSms, smsTemplates } from "../sms-templates";

export interface ParticipantResultCtx {
  eventId: string;
  title: string;
  // videoUrl: /share/{eventId} page link (not direct S3 URL — presigned 만료 회피)
  videoUrl: string;
  recipientEmail?: string;
  recipientPhone?: string;
}

// 호출처: api/cron/check-rendering (완성 처리 시 참가자 전화번호별 1회).
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
