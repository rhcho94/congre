import { FieldValue } from "firebase-admin/firestore";
import { getAdminDb } from "@/lib/firebase-admin";

interface NotificationRecord {
  eventId: string;
  scenario: string;
  channel: "email" | "sms";
  recipient: string;
  status: "sent" | "failed";
  error?: string;
  providerMessageId?: string;
}

export async function saveNotificationHistory(record: NotificationRecord): Promise<void> {
  try {
    await getAdminDb()
      .collection("notifications")
      .add({ ...record, sentAt: FieldValue.serverTimestamp() });
  } catch (err) {
    // Never let history writes crash the notification flow
    console.error("[notifications:history] save failed:", err);
  }
}
