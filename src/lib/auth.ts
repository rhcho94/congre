import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  sendEmailVerification,
  signOut,
  onAuthStateChanged,
  sendPasswordResetEmail,
  EmailAuthProvider,
  reauthenticateWithCredential,
  updatePassword,
  type User,
  type NextOrObserver,
} from "firebase/auth";
import { getFirebaseAuth } from "./firebase";
import { createUserDoc } from "./users";

export type { User };

export async function loginWithEmail(email: string, password: string) {
  return signInWithEmailAndPassword(getFirebaseAuth(), email, password);
}

export async function signUpWithEmail(params: {
  email: string;
  password: string;
  name: string;
  phone: string;
}) {
  const auth = getFirebaseAuth();
  let createdUser: User | null = null;

  try {
    const cred = await createUserWithEmailAndPassword(auth, params.email, params.password);
    createdUser = cred.user;

    const actionCodeSettings = {
      url: `${process.env.NEXT_PUBLIC_APP_URL}/verify-email`,
      handleCodeInApp: false,
    };
    try {
      await sendEmailVerification(cred.user, actionCodeSettings);
    } catch (e) {
      console.error("[signup] sendEmailVerification failed:", e);
    }

    // 토큰을 Firestore SDK로 전파 강제. 가입 직후 setDoc 시 permission-denied 방지
    await cred.user.getIdToken(true);

    await createUserDoc(cred.user.uid, {
      email: params.email,
      name: params.name,
      phone: params.phone,
    });

    return cred.user;
  } catch (err) {
    if (createdUser) {
      try {
        await createdUser.delete();
      } catch (deleteErr) {
        console.error("[signup] rollback delete failed:", deleteErr);
      }
    }
    throw err;
  }
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

export async function changePassword(
  currentPassword: string,
  newPassword: string
): Promise<void> {
  const auth = getFirebaseAuth();
  const user = auth.currentUser;
  if (!user || !user.email) throw new Error("로그인 상태가 아닙니다");
  const credential = EmailAuthProvider.credential(user.email, currentPassword);
  await reauthenticateWithCredential(user, credential);
  await updatePassword(user, newPassword);
}
