import { PutObjectCommand, S3Client } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import type { NextRequest } from "next/server";
import { verifyIdToken } from "@/lib/auth-server";
import { getAdminDb } from "@/lib/firebase-admin";

const isS3Configured = Boolean(process.env.AWS_ACCESS_KEY_ID && process.env.AWS_S3_BUCKET);

// fileName 화이트리스트: 영숫자·하이픈·점·언더스코어만. / 와 .. 등 경로 조작 차단.
const FILENAME_RE = /^[A-Za-z0-9._-]+$/;

// kind별 확장자 화이트리스트.
// - clip: upload page L260-274가 webm/mp4/mov 중 하나로 결정
// - thumb: upload page L291이 .jpg 고정
// - intro/outro: <input accept="image/*,video/*"> — 실제 형식 미확정이라 ext 제한 생략
const EXT_WHITELIST: Record<string, string[] | null> = {
  clip: ["mp4", "mov", "webm"],
  thumb: ["jpg"],
  intro: null,
  outro: null,
};

export async function GET() {
  return Response.json({ configured: isS3Configured });
}

export async function POST(request: NextRequest) {
  if (!isS3Configured) {
    return Response.json({ error: "S3_NOT_CONFIGURED" }, { status: 503 });
  }

  let body: { eventId?: unknown; fileName?: unknown; fileType?: unknown; kind?: unknown; token?: unknown };
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: "BAD_REQUEST" }, { status: 400 });
  }

  const { eventId, fileName, fileType, kind, token } = body;

  if (typeof eventId !== "string" || typeof fileName !== "string" || typeof fileType !== "string") {
    return Response.json({ error: "BAD_REQUEST" }, { status: 400 });
  }

  if (kind !== "clip" && kind !== "intro" && kind !== "outro" && kind !== "thumb") {
    return Response.json({ error: "INVALID_KIND" }, { status: 400 });
  }

  // fileName 화이트리스트 (path traversal 차단)
  if (!FILENAME_RE.test(fileName)) {
    return Response.json({ error: "INVALID_FILENAME" }, { status: 400 });
  }

  // kind별 확장자 화이트리스트
  const allowedExts = EXT_WHITELIST[kind];
  if (allowedExts) {
    const dotIdx = fileName.lastIndexOf(".");
    const ext = dotIdx >= 0 ? fileName.slice(dotIdx + 1).toLowerCase() : "";
    if (!allowedExts.includes(ext)) {
      return Response.json({ error: "INVALID_EXTENSION" }, { status: 400 });
    }
  }

  // 이벤트 존재 확인 + kind별 인증 분기
  let eventData: FirebaseFirestore.DocumentData;
  try {
    const db = getAdminDb();
    const snap = await db.collection("events").doc(eventId).get();
    if (!snap.exists) {
      return Response.json({ error: "EVENT_NOT_FOUND" }, { status: 404 });
    }
    eventData = snap.data()!;
  } catch (err) {
    console.error("[presign] event lookup failed:", err);
    return Response.json({ error: "INTERNAL_ERROR" }, { status: 500 });
  }

  if (kind === "clip" || kind === "thumb") {
    // 참가자 업로드: sessionToken + status=open 검증
    if (typeof token !== "string" || !token) {
      return Response.json({ error: "UNAUTHORIZED" }, { status: 401 });
    }
    if (!eventData.sessionToken || eventData.sessionToken !== token) {
      return Response.json({ error: "UNAUTHORIZED" }, { status: 401 });
    }
    if (eventData.status !== "open") {
      return Response.json({ error: "EVENT_CLOSED" }, { status: 409 });
    }
  } else {
    // intro/outro: 호스트 Firebase ID 토큰 + hostId 일치 검증
    let uid: string;
    try {
      const decoded = await verifyIdToken(request);
      uid = decoded.uid;
    } catch (err) {
      console.error("[presign] verifyIdToken failed:", err);
      return Response.json({ error: "UNAUTHORIZED" }, { status: 401 });
    }
    if (eventData.hostId !== uid) {
      return Response.json({ error: "FORBIDDEN" }, { status: 403 });
    }
  }

  // codec 파라미터 제거 — presign 서명 값과 PUT Content-Type 헤더가 정확히 일치해야 함
  const contentType = fileType.split(";")[0] || "video/webm";
  const key = `events/${eventId}/${kind}/${Date.now()}-${fileName}`;

  const s3 = new S3Client({
    region: process.env.AWS_REGION!,
    credentials: {
      accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
      secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
    },
  });

  const command = new PutObjectCommand({
    Bucket: process.env.AWS_S3_BUCKET!,
    Key: key,
    ContentType: contentType,
  });

  try {
    const url = await getSignedUrl(s3, command, { expiresIn: 300 });
    console.log(`[presign] kind=${kind} key=${key} contentType=${contentType} expires=300s`);
    return Response.json({ url, key });
  } catch (err) {
    console.error("[presign] getSignedUrl failed:", err);
    return Response.json({ error: "PRESIGN_FAILED" }, { status: 500 });
  }
}
