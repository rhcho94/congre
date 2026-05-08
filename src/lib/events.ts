import {
  collection, addDoc, doc, updateDoc,
  serverTimestamp, Timestamp,
} from "firebase/firestore";
import { getFirebaseFirestore, isFirebaseConfigured } from "./firebase";

export type EventPlan = "free" | "small" | "medium" | "large";
export type EventStatus = "open" | "closed" | "rendering" | "done";

export interface CongreEvent {
  id: string;
  title: string;
  date: Timestamp;
  plan: EventPlan;
  hostId: string;
  status: EventStatus;
  sessionToken: string | null;
  uploadToken?: string;          // 원본 토큰 — 마감 후에도 QR 재표시용으로 보존
  createdAt: Timestamp;
  renderId?: string;
  videoUrl?: string;
  draftVideoUrl?: string;
  organizerEmail?: string;
  organizerPhone?: string;
  deadlineAt?: Timestamp;        // 마감 시각 — render/start에서 저장, 완료 시간 계산용
  introText?: string;
  outroText?: string;
}

export interface Clip {
  id: string;
  eventId: string;
  s3Key: string;
  uploadedAt: Timestamp;
  uploaderName?: string;
  sessionToken?: string;
  excludedAt?: Timestamp | null;
}

export async function createEvent(input: {
  title: string;
  date: string; // "YYYY-MM-DD"
  plan: EventPlan;
  hostId: string;
}): Promise<{ eventId: string; sessionToken: string }> {
  if (!isFirebaseConfigured) throw new Error("Firebase not configured");
  const db = getFirebaseFirestore();
  const sessionToken = crypto.randomUUID();
  const ref = await addDoc(collection(db, "events"), {
    title: input.title,
    date: Timestamp.fromDate(new Date(input.date + "T00:00:00")),
    plan: input.plan,
    hostId: input.hostId,
    status: "open" as EventStatus,
    sessionToken,
    uploadToken: sessionToken,   // 마감 시 sessionToken은 null이 되지만 uploadToken은 보존
    createdAt: serverTimestamp(),
  });
  return { eventId: ref.id, sessionToken };
}


export async function updateEventRender(
  eventId: string,
  data: {
    status?: EventStatus;
    renderId?: string;
    videoUrl?: string;
    draftVideoUrl?: string;
  }
): Promise<void> {
  if (!isFirebaseConfigured) return;
  const db = getFirebaseFirestore();
  await updateDoc(doc(db, "events", eventId), data);
}
