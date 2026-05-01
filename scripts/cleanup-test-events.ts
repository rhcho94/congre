import * as dotenv from "dotenv";
import { resolve } from "path";
import * as readline from "readline";
import * as fs from "fs";

// .env.local 로드 (Next.js 앱과 무관하게 직접 로드)
dotenv.config({ path: resolve(process.cwd(), ".env.local") });

import { initializeApp, getApps, cert } from "firebase-admin/app";
import { getFirestore, type DocumentData } from "firebase-admin/firestore";
import { S3Client, DeleteObjectCommand } from "@aws-sdk/client-s3";

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

// ── S3 클라이언트 초기화 ───────────────────────────────────────────────────
function initS3() {
  const region = process.env.AWS_REGION;
  const accessKeyId = process.env.AWS_ACCESS_KEY_ID;
  const secretAccessKey = process.env.AWS_SECRET_ACCESS_KEY;
  const bucket = process.env.AWS_S3_BUCKET;

  if (!region || !accessKeyId || !secretAccessKey || !bucket) {
    console.error("❌ 환경변수 누락: AWS_REGION / AWS_ACCESS_KEY_ID / AWS_SECRET_ACCESS_KEY / AWS_S3_BUCKET");
    process.exit(1);
  }

  return {
    s3: new S3Client({ region, credentials: { accessKeyId, secretAccessKey } }),
    bucket,
  };
}

// ── 출력 헬퍼 ─────────────────────────────────────────────────────────────
function formatDate(val: DocumentData | undefined): string {
  if (!val) return "—";
  if (typeof val.toDate === "function") return val.toDate().toISOString();
  return String(val);
}

function hr(char = "─", len = 60) {
  return char.repeat(len);
}

// ── readline 확인 프롬프트 ─────────────────────────────────────────────────
function askConfirm(question: string): Promise<string> {
  const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
  return new Promise((resolve) => {
    rl.question(question, (answer) => {
      rl.close();
      resolve(answer.trim());
    });
  });
}

// ── 클립 데이터 타입 ────────────────────────────────────────────────────────
interface ClipRecord {
  id: string;
  eventId: string;
  s3Key: string;
  uploadedAt: DocumentData;
}

interface EventRecord {
  id: string;
  title: string;
  status: string;
  createdAt: DocumentData;
  clips: ClipRecord[];
}

// ── 메인 ──────────────────────────────────────────────────────────────────
async function main() {
  console.log(hr("═"));
  console.log(`  Congre — 테스트 데이터 정리 스크립트`);
  console.log(`  모드: ${isDryRun ? "DRY-RUN (읽기 전용)" : "⚠️  EXECUTE (실제 삭제)"}`);
  console.log(`  대상 hostId: ${TARGET_HOST_ID}`);
  console.log(hr("═"));

  const db = initAdmin();

  // ── 1. 이벤트 + 클립 전체 조회 ────────────────────────────────────────
  const eventsSnap = await db
    .collection("events")
    .where("hostId", "==", TARGET_HOST_ID)
    .get();

  const eventRecords: EventRecord[] = [];
  let totalClips = 0;

  for (const eventDoc of eventsSnap.docs) {
    const data = eventDoc.data();
    const clipsSnap = await db
      .collection("clips")
      .where("eventId", "==", eventDoc.id)
      .get();

    const clips: ClipRecord[] = clipsSnap.docs.map((d) => {
      const c = d.data();
      return {
        id: d.id,
        eventId: eventDoc.id,
        s3Key: c.s3Key ?? "",
        uploadedAt: c.uploadedAt,
      };
    });

    totalClips += clips.length;
    eventRecords.push({
      id: eventDoc.id,
      title: data.title ?? "—",
      status: data.status ?? "—",
      createdAt: data.createdAt,
      clips,
    });
  }

  // ── 2. 목록 출력 ────────────────────────────────────────────────────────
  console.log(`\n📋 이벤트 (${eventRecords.length}건)`);
  console.log(hr());

  for (const ev of eventRecords) {
    console.log(`  ID       : ${ev.id}`);
    console.log(`  제목     : ${ev.title}`);
    console.log(`  상태     : ${ev.status}`);
    console.log(`  생성일   : ${formatDate(ev.createdAt)}`);

    if (ev.clips.length === 0) {
      console.log(`  클립     : (없음)`);
    } else {
      console.log(`  클립 (${ev.clips.length}건):`);
      for (const clip of ev.clips) {
        console.log(`    ├─ id       : ${clip.id}`);
        console.log(`    │  s3Key    : ${clip.s3Key}`);
        console.log(`    │  업로드일 : ${formatDate(clip.uploadedAt)}`);
      }
    }
    console.log(hr("─"));
  }

  // ── 3. 요약 출력 ─────────────────────────────────────────────────────────
  console.log(`\n📊 요약`);
  console.log(hr());
  console.log(`  hostId  : ${TARGET_HOST_ID}`);
  console.log(`  이벤트  : ${eventRecords.length}건`);
  console.log(`  클립    : ${totalClips}건`);

  // ── DRY-RUN 종료 ────────────────────────────────────────────────────────
  if (isDryRun) {
    console.log(`\n  ℹ️  DRY-RUN — 아무것도 삭제되지 않았습니다.`);
    console.log(`  실제 삭제하려면: npm run cleanup:execute`);
    console.log(hr("═"));
    return;
  }

  // ── EXECUTE 모드: 사용자 확인 ────────────────────────────────────────────
  console.log();
  console.log(`  삭제 대상: 이벤트 ${eventRecords.length}건, 클립 ${totalClips}건 (Firestore + S3)`);
  console.log(`  ⚠️  이 작업은 되돌릴 수 없습니다.`);
  console.log();

  const answer = await askConfirm(`  Type 'DELETE' to confirm (anything else aborts): `);

  if (answer !== "DELETE") {
    console.log(`\n  Aborted.`);
    console.log(hr("═"));
    process.exit(0);
  }

  // ── 로그 준비 ────────────────────────────────────────────────────────────
  const timestamp = new Date().toISOString().replace(/:/g, "-");
  const logPath = resolve(process.cwd(), `scripts/cleanup-log-${timestamp}.txt`);
  const logLines: string[] = [
    `Congre cleanup log — ${new Date().toISOString()}`,
    `hostId: ${TARGET_HOST_ID}`,
    `Target: ${eventRecords.length} events, ${totalClips} clips`,
    "",
  ];

  const { s3, bucket } = initS3();

  const allClips = eventRecords.flatMap((ev) => ev.clips);
  const failedS3: { key: string; error: string }[] = [];
  const failedClips: { id: string; error: string }[] = [];
  const failedEvents: { id: string; error: string }[] = [];
  let s3Deleted = 0;
  let clipsDeleted = 0;
  let eventsDeleted = 0;

  console.log(`\n${hr("═")}`);

  // ── Phase 1: S3 객체 삭제 ──────────────────────────────────────────────
  console.log(`\n[Phase 1] S3 객체 삭제 (${allClips.length}건)`);
  logLines.push("=== Phase 1: S3 ===");

  for (let i = 0; i < allClips.length; i++) {
    const clip = allClips[i]!;
    if (!clip.s3Key) {
      logLines.push(`SKIP (no s3Key): clip ${clip.id}`);
      continue;
    }
    try {
      await s3.send(new DeleteObjectCommand({ Bucket: bucket, Key: clip.s3Key }));
      s3Deleted++;
      const msg = `[S3] ${s3Deleted}/${allClips.length} deleted: ${clip.s3Key}`;
      console.log(`  ${msg}`);
      logLines.push(`OK: ${clip.s3Key}`);
    } catch (err) {
      const errMsg = err instanceof Error ? err.message : String(err);
      failedS3.push({ key: clip.s3Key, error: errMsg });
      console.error(`  [S3] FAILED: ${clip.s3Key} — ${errMsg}`);
      logLines.push(`FAIL: ${clip.s3Key} — ${errMsg}`);
    }
  }

  // ── Phase 2: Firestore clips 삭제 ─────────────────────────────────────
  console.log(`\n[Phase 2] Firestore clips 삭제 (${allClips.length}건)`);
  logLines.push("", "=== Phase 2: Firestore clips ===");

  for (let i = 0; i < allClips.length; i++) {
    const clip = allClips[i]!;
    try {
      await db.collection("clips").doc(clip.id).delete();
      clipsDeleted++;
      const msg = `[Firestore clips] ${clipsDeleted}/${allClips.length} deleted: ${clip.id}`;
      console.log(`  ${msg}`);
      logLines.push(`OK: ${clip.id}`);
    } catch (err) {
      const errMsg = err instanceof Error ? err.message : String(err);
      failedClips.push({ id: clip.id, error: errMsg });
      console.error(`  [Firestore clips] FAILED: ${clip.id} — ${errMsg}`);
      logLines.push(`FAIL: ${clip.id} — ${errMsg}`);
    }
  }

  // ── Phase 3: Firestore events 삭제 ────────────────────────────────────
  console.log(`\n[Phase 3] Firestore events 삭제 (${eventRecords.length}건)`);
  logLines.push("", "=== Phase 3: Firestore events ===");

  for (let i = 0; i < eventRecords.length; i++) {
    const ev = eventRecords[i]!;
    try {
      await db.collection("events").doc(ev.id).delete();
      eventsDeleted++;
      const msg = `[Firestore events] ${eventsDeleted}/${eventRecords.length} deleted: ${ev.id}`;
      console.log(`  ${msg}`);
      logLines.push(`OK: ${ev.id}`);
    } catch (err) {
      const errMsg = err instanceof Error ? err.message : String(err);
      failedEvents.push({ id: ev.id, error: errMsg });
      console.error(`  [Firestore events] FAILED: ${ev.id} — ${errMsg}`);
      logLines.push(`FAIL: ${ev.id} — ${errMsg}`);
    }
  }

  // ── 로그 파일 작성 ────────────────────────────────────────────────────
  logLines.push("", "=== Summary ===");
  logLines.push(`S3:     ${s3Deleted}/${allClips.length} deleted, ${failedS3.length} failed`);
  logLines.push(`Clips:  ${clipsDeleted}/${allClips.length} deleted, ${failedClips.length} failed`);
  logLines.push(`Events: ${eventsDeleted}/${eventRecords.length} deleted, ${failedEvents.length} failed`);

  if (failedS3.length > 0) {
    logLines.push("", "--- S3 failures ---");
    failedS3.forEach((f) => logLines.push(`  ${f.key}: ${f.error}`));
  }
  if (failedClips.length > 0) {
    logLines.push("", "--- Clip failures ---");
    failedClips.forEach((f) => logLines.push(`  ${f.id}: ${f.error}`));
  }
  if (failedEvents.length > 0) {
    logLines.push("", "--- Event failures ---");
    failedEvents.forEach((f) => logLines.push(`  ${f.id}: ${f.error}`));
  }

  fs.writeFileSync(logPath, logLines.join("\n") + "\n", "utf-8");

  // ── 최종 콘솔 요약 ────────────────────────────────────────────────────
  console.log(`\n${hr("═")}`);
  console.log(`  ✅ S3:     ${s3Deleted}/${allClips.length} deleted (${failedS3.length} failed)`);
  console.log(`  ✅ Clips:  ${clipsDeleted}/${allClips.length} deleted (${failedClips.length} failed)`);
  console.log(`  ✅ Events: ${eventsDeleted}/${eventRecords.length} deleted (${failedEvents.length} failed)`);
  console.log(`  📄 Log:    scripts/cleanup-log-${timestamp}.txt`);
  console.log(hr("═"));
}

main().catch((err) => {
  console.error("❌ 스크립트 오류:", err);
  process.exit(1);
});
