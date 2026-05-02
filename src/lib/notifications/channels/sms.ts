import type { Channel, NotificationMessage, NotificationResult } from "./types";

const apiKey = process.env.SOLAPI_API_KEY;
const apiSecret = process.env.SOLAPI_API_SECRET;
const sender = process.env.SOLAPI_SENDER;

const isDryRun = !apiKey || !apiSecret || !sender;

export const smsChannel: Channel = {
  async send(to: string, message: NotificationMessage): Promise<NotificationResult> {
    if (isDryRun) {
      console.log("[sms:dry-run] to=%s text=%s", to, message.text);
      return { success: true };
    }
    try {
      // Dynamic import avoids module-level side effects when env vars are absent
      const { SolapiMessageService } = await import("solapi");
      const service = new SolapiMessageService(apiKey!, apiSecret!);
      // SOLAPI automatically upgrades SMS→LMS when text exceeds 90 bytes
      type MsgPayload = { to: string; from: string; text: string };
      const res = await service.send({ to, from: sender!, text: message.text } as MsgPayload as never);
      const msgId =
        (res as Record<string, unknown>)?.messageId as string | undefined ??
        (res as Record<string, unknown>)?.groupId as string | undefined;
      return { success: true, messageId: msgId };
    } catch (err) {
      return { success: false, error: err instanceof Error ? err.message : String(err) };
    }
  },
};
