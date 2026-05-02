import { Resend } from "resend";
import type { Channel, NotificationMessage, NotificationResult } from "./types";

const apiKey = process.env.RESEND_API_KEY;
const fromAddress = process.env.EMAIL_FROM ?? "noreply@congre.app";
const fromName = process.env.EMAIL_FROM_NAME ?? "Congre";
const from = `${fromName} <${fromAddress}>`;

export const emailChannel: Channel = {
  async send(to: string, message: NotificationMessage): Promise<NotificationResult> {
    if (!apiKey) {
      console.log("[email:dry-run] to=%s subject=%s", to, message.subject ?? "(no subject)");
      return { success: true };
    }
    const resend = new Resend(apiKey);
    const { data, error } = await resend.emails.send({
      from,
      to,
      subject: message.subject ?? "Congre 알림",
      html: message.html ?? `<pre>${message.text}</pre>`,
      text: message.text,
    });
    if (error) return { success: false, error: error.message };
    return { success: true, messageId: data?.id };
  },
};
