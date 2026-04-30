import {
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  sendPasswordResetEmail,
  type User,
  type NextOrObserver,
} from "firebase/auth";
import { getFirebaseAuth } from "./firebase";

export type { User };

export async function loginWithEmail(email: string, password: string) {
  return signInWithEmailAndPassword(getFirebaseAuth(), email, password);
}

export async function logout() {
  return signOut(getFirebaseAuth());
}

export async function resetPassword(email: string) {
  return sendPasswordResetEmail(getFirebaseAuth(), email);
}

// onAuthStateChanged를 직접 노출하지 않고 래핑 — auth 인스턴스를 숨김
export function subscribeToAuthChanges(callback: NextOrObserver<User>) {
  return onAuthStateChanged(getFirebaseAuth(), callback);
}
