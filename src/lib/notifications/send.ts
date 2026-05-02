import { emailChannel } from "./channels/email";
import { smsChannel } from "./channels/sms";
import { saveNotificationHistory } from "./history";
import type { NotificationMessage } from "./channels/types";

export type ChannelType = "email" | "sms";

export interface ChannelTarget {
  channel: ChannelType;
  to: string;
  message: NotificationMessage;
}

export async function sendNotification(
  scenario: string,
  eventId: string,
  targets: ChannelTarget[]
): Promise<void> {
  await Promise.allSettled(
    targets.map(async ({ channel, to, message }) => {
      const adapter = channel === "email" ? emailChannel : smsChannel;
      const result = await adapter.send(to, message);
      await saveNotificationHistory({
        eventId,
        scenario,
        channel,
        recipient: to,
        status: result.success ? "sent" : "failed",
        error: result.error,
        providerMessageId: result.messageId,
      });
      if (!result.success) {
        console.error("[notifications] %s/%s FAILED: %s", scenario, channel, result.error);
      }
    })
  );
}
