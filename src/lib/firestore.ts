import { collection, addDoc, serverTimestamp } from "firebase/firestore";
import { getFirebaseFirestore, isFirebaseConfigured } from "./firebase";

export interface VideoMeta {
  eventId: string;
  s3Key: string;
  fileName: string;
  fileSize: number;
  mimeType: string;
  sessionToken: string;
}

export async function saveVideoMetadata(data: VideoMeta): Promise<void> {
  if (!isFirebaseConfigured) return;
  const db = getFirebaseFirestore();
  await addDoc(collection(db, "videos"), {
    ...data,
    uploadedAt: serverTimestamp(),
  });
}
