import { doc, setDoc, getDoc, serverTimestamp, Timestamp } from "firebase/firestore";
import { getFirebaseFirestore } from "./firebase";

export async function createUserDoc(
  uid: string,
  data: { email: string; name: string; phone: string }
) {
  const db = getFirebaseFirestore();
  const now = serverTimestamp();
  await setDoc(doc(db, "users", uid), {
    email: data.email.toLowerCase(),
    name: data.name,
    phone: data.phone,
    createdAt: now,
    termsAgreedAt: now,
    privacyAgreedAt: now,
  });
}

export interface UserDoc {
  email: string;
  name: string;
  phone: string;
  createdAt: Timestamp | null;
  termsAgreedAt: Timestamp | null;
  privacyAgreedAt: Timestamp | null;
}

export async function getUserDoc(uid: string): Promise<UserDoc | null> {
  const db = getFirebaseFirestore();
  const snap = await getDoc(doc(db, "users", uid));
  if (!snap.exists()) return null;
  const data = snap.data();
  return {
    email: data.email as string,
    name: data.name as string,
    phone: data.phone as string,
    createdAt: (data.createdAt ?? null) as Timestamp | null,
    termsAgreedAt: (data.termsAgreedAt ?? null) as Timestamp | null,
    privacyAgreedAt: (data.privacyAgreedAt ?? null) as Timestamp | null,
  };
}
