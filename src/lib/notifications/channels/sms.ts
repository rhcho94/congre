import type { Channel, NotificationMessage, NotificationResult } from "./types";

const apiKey = process.env.SOLAPI_API_KEY;
const apiSecret = process.env.SOLAPI_API_SECRET;
const sender = process.env.SOLAPI_SENDER;

const isDryRun = !apiKey || !apiSecret || !sender;

console.log("[sms:env]",
  "apiKey=", !!apiKey, apiKey?.length ?? 0,
  "apiSecret=", !!apiSecret, apiSecret?.length ?? 0,
  "sender=", !!sender, sender?.length ?? 0,
  "isDryRun=", isDryRun);

export const smsChannel: Channel = {
  async send(to: string, message: NotificationMessage): Promise<NotificationResult> {
    if (isDryRun) {
      console.log("[sms:dry-run] to=%s text=%s", to, message.text);
      return { success: true };
    }
    try {
      console.log("[sms:try] starting, to=", to, "sender=", sender);
      // Dynamic import avoids module-level side effects when env vars are absent
      const { SolapiMessageService, MessageNotReceivedError } = await import("solapi");
      console.log("[sms:try] solapi imported");
      const service = new SolapiMessageService(apiKey!, apiSecret!);
      // SOLAPI automatically upgrades SMS→LMS when text exceeds 90 bytes
      type MsgPayload = { to: string; from: string; text: string };
      const res = await service.send({ to, from: sender!, text: message.text } as MsgPayload as never);
      console.log("[sms:try] service.send returned", res);
      const msgId =
        (res as Record<string, unknown>)?.messageId as string | undefined ??
        (res as Record<string, unknown>)?.groupId as string | undefined;
      return { success: true, messageId: msgId };
    } catch (err) {
      console.error("[sms:catch] error type=", err?.constructor?.name, "message=", err instanceof Error ? err.message : String(err));
      // Re-import for instanceof check — module is cached, no cost
      const { MessageNotReceivedError } = await import("solapi");
      if (err instanceof MessageNotReceivedError) {
        const details = err.failedMessageList
          .map((m) => `[${m.statusCode}] ${m.statusMessage} (to: ${m.to})`)
          .join(", ");
        console.error("[sms] SOLAPI rejected:", details);
        return { success: false, error: details };
      }
      return { success: false, error: err instanceof Error ? err.message : String(err) };
    }
  },
};
