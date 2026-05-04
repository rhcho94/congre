import { sendNotification } from "../send";
import { renderRefund100Email } from "@/emails/refund-100";
import { renderSms, smsTemplates } from "../sms-templates";

export interface Refund100Ctx {
  eventId: string;
  title: string;
  organizerEmail: string;
  organizerPhone: string;
  dashboardUrl: string;
}

export async function notifyRefund100(ctx: Refund100Ctx): Promise<void> {
  const html = renderRefund100Email({
    title: ctx.title,
    dashboardUrl: ctx.dashboardUrl,
  });

  await sendNotification("refund_100", ctx.eventId, [
    {
      channel: "email",
      to: ctx.organizerEmail,
      message: {
        subject: `[Congre] '${ctx.title}' 편집 지연으로 100% 환불이 확정되었습니다`,
        html,
        text: `'${ctx.title}' 편집 지연으로 100% 환불이 확정되었습니다. 영상은 완성 후 전달드립니다. 환불 절차 문의: 카카오톡 @congre\n\n대시보드: ${ctx.dashboardUrl}`,
      },
    },
    {
      channel: "sms",
      to: ctx.organizerPhone,
      message: {
        text: renderSms(smsTemplates.refund_100, { title: ctx.title }),
      },
    },
  ]);

  // TODO [6]: process.env.CONGRE_INTERNAL_PHONE 환경변수 등록 후 사내 SMS×2 활성화
  const internalPhone = process.env.CONGRE_INTERNAL_PHONE;
  if (internalPhone) {
    const internalText = renderSms(smsTemplates.refund_100, { title: ctx.title });
    await sendNotification("refund_100_internal", ctx.eventId, [
      { channel: "sms", to: internalPhone, message: { text: internalText } },
      { channel: "sms", to: internalPhone, message: { text: internalText } },
    ]);
  }
}
