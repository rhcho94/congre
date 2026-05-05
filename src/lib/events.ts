import {
  collection, addDoc, doc, getDoc, updateDoc, onSnapshot,
  query, where, serverTimestamp, Timestamp,
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
}

export interface Clip {
  id: string;
  eventId: string;
  s3Key: string;
  uploadedAt: Timestamp;
  sessionToken: string;
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

export async function getEvent(eventId: string): Promise<CongreEvent | null> {
  if (!isFirebaseConfigured) return null;
  const db = getFirebaseFirestore();
  const snap = await getDoc(doc(db, "events", eventId));
  if (!snap.exists()) return null;
  return { id: snap.id, ...snap.data() } as CongreEvent;
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

export function subscribeToHostEvents(
  hostId: string,
  callback: (events: CongreEvent[]) => void,
  onError?: (err: Error) => void
): () => void {
  if (!isFirebaseConfigured) {
    callback([]);
    return () => {};
  }
  const db = getFirebaseFirestore();
  const q = query(
    collection(db, "events"),
    where("hostId", "==", hostId)
  );
  return onSnapshot(
    q,
    (snap) => {
      const events = snap.docs
        .map((d) => ({ id: d.id, ...d.data() }) as CongreEvent)
        .sort((a, b) => (b.createdAt?.toMillis?.() ?? 0) - (a.createdAt?.toMillis?.() ?? 0));
      callback(events);
    },
    onError
  );
}

export function subscribeToClips(
  eventId: string,
  callback: (clips: Clip[]) => void,
  onError?: (err: Error) => void
): () => void {
  if (!isFirebaseConfigured) {
    callback([]);
    return () => {};
  }
  const db = getFirebaseFirestore();
  const q = query(
    collection(db, "clips"),
    where("eventId", "==", eventId)
  );
  return onSnapshot(
    q,
    (snap) => {
      const clips = snap.docs
        .map((d) => ({ id: d.id, ...d.data() }) as Clip)
        .sort((a, b) => (b.uploadedAt?.toMillis?.() ?? 0) - (a.uploadedAt?.toMillis?.() ?? 0));
      callback(clips);
    },
    onError
  );
}

export async function saveClipMetadata(data: {
  eventId: string;
  s3Key: string;
  sessionToken: string;
}): Promise<void> {
  if (!isFirebaseConfigured) return;
  const db = getFirebaseFirestore();
  console.log("[saveClipMetadata] addDoc 시작 →", { eventId: data.eventId, s3Key: data.s3Key });
  const clipRef = await addDoc(collection(db, "clips"), {
    eventId: data.eventId,
    s3Key: data.s3Key,
    sessionToken: data.sessionToken,
    uploadedAt: serverTimestamp(),
  });
  console.log("[saveClipMetadata] clips 저장 성공 →", clipRef.id);
}
