import { GetObjectCommand, S3Client } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import type { NextRequest } from "next/server";
import { verifyIdToken } from "@/lib/auth-server";
import { getAdminDb } from "@/lib/firebase-admin";

const isS3Configured = Boolean(process.env.AWS_ACCESS_KEY_ID && process.env.AWS_S3_BUCKET);

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ clipId: string }> }
) {
  // 1. 인증
  let uid: string;
  try {
    const decoded = await verifyIdToken(request);
    uid = decoded.uid;
  } catch {
    return Response.json({ error: "UNAUTHORIZED" }, { status: 401 });
  }

  if (!isS3Configured) {
    return Response.json({ error: "S3_NOT_CONFIGURED" }, { status: 503 });
  }

  const { clipId } = await params;

  try {
    const db = getAdminDb();

    // 2. 클립 조회
    const clipSnap = await db.collection("clips").doc(clipId).get();
    if (!clipSnap.exists) {
      return Response.json({ error: "CLIP_NOT_FOUND" }, { status: 404 });
    }
    const clip = clipSnap.data() as { eventId: string; s3Key: string };

    // 3. 이벤트 소유자 확인
    const eventSnap = await db.collection("events").doc(clip.eventId).get();
    if (!eventSnap.exists) {
      return Response.json({ error: "EVENT_NOT_FOUND" }, { status: 404 });
    }
    const event = eventSnap.data() as { hostId: string };
    if (event.hostId !== uid) {
      return Response.json({ error: "FORBIDDEN" }, { status: 403 });
    }

    // 4. presigned GET URL 발급 (1시간)
    const s3 = new S3Client({
      region: process.env.AWS_REGION!,
      credentials: {
        accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
      },
    });

    const url = await getSignedUrl(
      s3,
      new GetObjectCommand({ Bucket: process.env.AWS_S3_BUCKET!, Key: clip.s3Key }),
      { expiresIn: 3600 }
    );

    return Response.json({ url, expiresAt: Date.now() + 3600 * 1000 });
  } catch (err) {
    const msg = err instanceof Error ? err.message : "internal_error";
    console.error("[clips/playback]", msg);
    return Response.json({ error: msg }, { status: 500 });
  }
}
