import { sendNotification } from "../send";
import { renderEventCreatedEmail } from "@/emails/event-created";

export interface EventCreatedCtx {
  eventId: string;
  title: string;
  date: string;
  organizerEmail: string;
  dashboardUrl: string;
}

export async function notifyEventCreated(ctx: EventCreatedCtx): Promise<void> {
  const html = renderEventCreatedEmail({
    title: ctx.title,
    date: ctx.date,
    dashboardUrl: ctx.dashboardUrl,
  });

  await sendNotification("event_created", ctx.eventId, [
    {
      channel: "email",
      to: ctx.organizerEmail,
      message: {
        subject: `[Congre] '${ctx.title}' 이벤트가 생성되었습니다`,
        html,
        text: `'${ctx.title}' 이벤트가 성공적으로 생성되었습니다.\n\n대시보드: ${ctx.dashboardUrl}`,
      },
    },
  ]);
}
