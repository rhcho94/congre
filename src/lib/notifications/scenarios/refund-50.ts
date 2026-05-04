import { sendNotification } from "../send";
import { renderRefund50Email } from "@/emails/refund-50";
import { renderSms, smsTemplates } from "../sms-templates";

export interface Refund50Ctx {
  eventId: string;
  title: string;
  organizerEmail: string;
  organizerPhone: string;
  dashboardUrl: string;
}

export async function notifyRefund50(ctx: Refund50Ctx): Promise<void> {
  const html = renderRefund50Email({
    title: ctx.title,
    dashboardUrl: ctx.dashboardUrl,
  });

  await sendNotification("refund_50", ctx.eventId, [
    {
      channel: "email",
      to: ctx.organizerEmail,
      message: {
        subject: `[Congre] '${ctx.title}' 편집 지연으로 50% 환불이 확정되었습니다`,
        html,
        text: `'${ctx.title}' 편집 지연으로 50% 환불이 확정되었습니다. 환불 절차 문의: 카카오톡 @congre\n\n대시보드: ${ctx.dashboardUrl}`,
      },
    },
    {
      channel: "sms",
      to: ctx.organizerPhone,
      message: {
        text: renderSms(smsTemplates.refund_50, { title: ctx.title }),
      },
    },
  ]);

  // TODO [6]: process.env.CONGRE_INTERNAL_PHONE 환경변수 등록 후 사내 SMS×2 활성화
  const internalPhone = process.env.CONGRE_INTERNAL_PHONE;
  if (internalPhone) {
    const internalText = renderSms(smsTemplates.refund_50, { title: ctx.title });
    await sendNotification("refund_50_internal", ctx.eventId, [
      { channel: "sms", to: internalPhone, message: { text: internalText } },
      { channel: "sms", to: internalPhone, message: { text: internalText } },
    ]);
  }
}
