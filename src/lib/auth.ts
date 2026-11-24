import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signInWithCustomToken,
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
import { isKakaoUid } from "./kakao-auth";

export type { User };

// 카카오 로그인 (2026-11-24) — 서버가 만든 Firebase 커스텀 토큰으로 로그인
export async function loginWithKakaoToken(token: string) {
  return signInWithCustomToken(getFirebaseAuth(), token);
}

// 이벤트를 만들 수 있는 호스트인가 — 이메일 회원은 이메일 인증, 카카오 회원은 카카오가 본인 계정을 확인했으므로 통과
export function isVerifiedHost(user: User | null | undefined): boolean {
  return Boolean(user && (user.emailVerified || isKakaoUid(user.uid)));
}

export function isKakaoUser(user: User | null | undefined): boolean {
  return Boolean(user && isKakaoUid(user.uid));
}

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

// 카카오 회원은 비밀번호 대신 "카카오로 다시 로그인한 직후"를 서버가 확인한다 — 오래됐으면 code REAUTH_REQUIRED
export async function deleteAccount(currentPassword: string): Promise<void> {
  const auth = getFirebaseAuth();
  const user = auth.currentUser;
  if (!user) throw new Error("로그인 상태가 아닙니다");

  if (!isKakaoUid(user.uid)) {
    if (!user.email) throw new Error("로그인 상태가 아닙니다");
    const credential = EmailAuthProvider.credential(user.email, currentPassword);
    await reauthenticateWithCredential(user, credential);
  }

  const idToken = await user.getIdToken(true);
  const res = await fetch("/api/user/delete", {
    method: "POST",
    headers: { Authorization: `Bearer ${idToken}` },
  });

  if (!res.ok) {
    const data = await res.json().catch(() => ({})) as { message?: string; code?: string };
    const error = new Error(data.message ?? "탈퇴 처리 실패");
    (error as Error & { code?: string }).code = data.code ?? "UNKNOWN";
    throw error;
  }

  await signOut(auth);
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
