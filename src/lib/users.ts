import { doc, setDoc, serverTimestamp } from "firebase/firestore";
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
