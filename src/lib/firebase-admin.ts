import { getApps, initializeApp, cert, type App } from "firebase-admin/app";
import { getAuth, type Auth } from "firebase-admin/auth";
import { getFirestore, type Firestore } from "firebase-admin/firestore";

function getAdminApp(): App {
  const existing = getApps();
  if (existing.length > 0) return existing[0]!;

  const projectId = process.env.FIREBASE_ADMIN_PROJECT_ID;
  const clientEmail = process.env.FIREBASE_ADMIN_CLIENT_EMAIL;
  const privateKey = process.env.FIREBASE_ADMIN_PRIVATE_KEY;

  if (!projectId || !clientEmail || !privateKey) {
    throw new Error(
      "Firebase Admin 환경변수 누락: FIREBASE_ADMIN_PROJECT_ID, FIREBASE_ADMIN_CLIENT_EMAIL, FIREBASE_ADMIN_PRIVATE_KEY 확인"
    );
  }

  return initializeApp({
    credential: cert({
      projectId,
      clientEmail,
      privateKey: privateKey.replace(/\\n/g, "\n"),
    }),
  });
}

export function getAdminAuth(): Auth {
  return getAuth(getAdminApp());
}

let _db: Firestore | null = null;

export function getAdminDb(): Firestore {
  if (_db) return _db;
  _db = getFirestore(getAdminApp());
  try {
    // Firestore rejects undefined values by default; this makes optional fields safe to spread
    _db.settings({ ignoreUndefinedProperties: true });
  } catch (err) {
    // SSR 모듈 격리 환경에서 다른 인스턴스가 이미 settings 적용한 경우 무시
    if (!(err instanceof Error) || !err.message.includes("already")) {
      throw err;
    }
  }
  return _db;
}
