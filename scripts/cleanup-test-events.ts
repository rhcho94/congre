import * as dotenv from "dotenv";
import { resolve } from "path";

// .env.local 로드 (Next.js 앱과 무관하게 직접 로드)
dotenv.config({ path: resolve(process.cwd(), ".env.local") });

import { initializeApp, getApps, cert } from "firebase-admin/app";
import { getFirestore, type DocumentData } from "firebase-admin/firestore";

// ── 대상 설정 ──────────────────────────────────────────────────────────────
const TARGET_HOST_ID = "gZosYRLJ5uaQ38wXdErBE7BHMTo2";

// ── 실행 모드 ──────────────────────────────────────────────────────────────
const isDryRun = !process.argv.includes("--execute");

// ── Firebase Admin 초기화 ──────────────────────────────────────────────────
function initAdmin() {
  const projectId = process.env.FIREBASE_ADMIN_PROJECT_ID;
  const clientEmail = process.env.FIREBASE_ADMIN_CLIENT_EMAIL;
  const privateKey = process.env.FIREBASE_ADMIN_PRIVATE_KEY;

  if (!projectId || !clientEmail || !privateKey) {
    console.error("❌ 환경변수 누락: FIREBASE_ADMIN_PROJECT_ID / FIREBASE_ADMIN_CLIENT_EMAIL / FIREBASE_ADMIN_PRIVATE_KEY");
    process.exit(1);
  }

  if (getApps().length === 0) {
    initializeApp({
      credential: cert({
        projectId,
        clientEmail,
        privateKey: privateKey.replace(/\\n/g, "\n"),
      }),
    });
  }

  return getFirestore();
}

// ── 출력 헬퍼 ─────────────────────────────────────────────────────────────
function formatDate(val: DocumentData | undefined): string {
  if (!val) return "—";
  // Firestore Timestamp
  if (typeof val.toDate === "function") return val.toDate().toISOString();
  return String(val);
}

function hr(char = "─", len = 60) {
  return char.repeat(len);
}

// ── 메인 ──────────────────────────────────────────────────────────────────
async function main() {
  console.log(hr("═"));
  console.log(`  Congre — 테스트 데이터 정리 스크립트`);
  console.log(`  모드: ${isDryRun ? "DRY-RUN (읽기 전용)" : "⚠️  EXECUTE (실제 삭제)"}`);
  console.log(`  대상 hostId: ${TARGET_HOST_ID}`);
  console.log(hr("═"));

  const db = initAdmin();

  // ── 1. 이벤트 조회 ────────────────────────────────────────────────────
  const eventsSnap = await db
    .collection("events")
    .where("hostId", "==", TARGET_HOST_ID)
    .get();

  const events = eventsSnap.docs;
  console.log(`\n📋 이벤트 (${events.length}건)`);
  console.log(hr());

  let totalClips = 0;
  const clipsByEvent: Record<string, DocumentData[]> = {};

  for (const eventDoc of events) {
    const data = eventDoc.data();
    console.log(`  ID       : ${eventDoc.id}`);
    console.log(`  제목     : ${data.title ?? "—"}`);
    console.log(`  상태     : ${data.status ?? "—"}`);
    console.log(`  생성일   : ${formatDate(data.createdAt)}`);

    // ── 2. 해당 이벤트의 클립 조회 ──────────────────────────────────────
    const clipsSnap = await db
      .collection("clips")
      .where("eventId", "==", eventDoc.id)
      .get();

    clipsByEvent[eventDoc.id] = clipsSnap.docs.map((d) => ({ id: d.id, ...d.data() }));
    totalClips += clipsSnap.size;

    if (clipsSnap.size === 0) {
      console.log(`  클립     : (없음)`);
    } else {
      console.log(`  클립 (${clipsSnap.size}건):`);
      for (const clipDoc of clipsSnap.docs) {
        const c = clipDoc.data();
        console.log(`    ├─ id       : ${clipDoc.id}`);
        console.log(`    │  s3Key    : ${c.s3Key ?? "—"}`);
        console.log(`    │  업로드일 : ${formatDate(c.uploadedAt)}`);
      }
    }
    console.log(hr("─"));

    // execute 모드일 때만 삭제 (dry-run에서는 절대 호출되지 않음)
    if (!isDryRun) {
      for (const clipDoc of clipsSnap.docs) {
        await db.collection("clips").doc(clipDoc.id).delete();
        console.log(`  🗑️  clips/${clipDoc.id} 삭제됨`);
      }
      await db.collection("events").doc(eventDoc.id).delete();
      console.log(`  🗑️  events/${eventDoc.id} 삭제됨`);
    }
  }

  // ── 3. 요약 ─────────────────────────────────────────────────────────
  console.log(`\n📊 요약`);
  console.log(hr());
  console.log(`  hostId  : ${TARGET_HOST_ID}`);
  console.log(`  이벤트  : ${events.length}건`);
  console.log(`  클립    : ${totalClips}건`);

  if (isDryRun) {
    console.log(`\n  ℹ️  DRY-RUN — 아무것도 삭제되지 않았습니다.`);
    console.log(`  실제 삭제하려면: npm run cleanup:execute`);
  } else {
    console.log(`\n  ✅ 삭제 완료`);
  }
  console.log(hr("═"));
}

main().catch((err) => {
  console.error("❌ 스크립트 오류:", err);
  process.exit(1);
});
