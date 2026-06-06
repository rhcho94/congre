import { GetObjectCommand, S3Client } from "@aws-sdk/client-s3";
import type { NextRequest } from "next/server";
import { getAdminDb } from "@/lib/firebase-admin";

const FALLBACK_URL = "https://app.congre.kr/logo.png";

function fallbackRedirect(): Response {
  return Response.redirect(FALLBACK_URL, 302);
}

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ clipId: string }> }
) {
  const { clipId } = await params;

  let thumbKey: string;
  try {
    const db = getAdminDb();
    const snap = await db.collection("clips").doc(clipId).get();
    if (!snap.exists) return fallbackRedirect();
    const data = snap.data()!;
    const key = data.thumbKey as string | undefined;
    if (!key) return fallbackRedirect();
    thumbKey = key;
  } catch (err) {
    console.error("[clip-thumb] clip lookup failed:", err);
    return fallbackRedirect();
  }

  if (!process.env.AWS_ACCESS_KEY_ID || !process.env.AWS_S3_BUCKET) {
    console.error("[clip-thumb] S3 not configured");
    return fallbackRedirect();
  }

  try {
    const s3 = new S3Client({
      region: process.env.AWS_REGION!,
      credentials: {
        accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
      },
    });
    const obj = await s3.send(
      new GetObjectCommand({
        Bucket: process.env.AWS_S3_BUCKET!,
        Key: thumbKey,
      })
    );
    if (!obj.Body) {
      console.error("[clip-thumb] s3 empty body for key:", thumbKey);
      return fallbackRedirect();
    }
    const bytes = await obj.Body.transformToByteArray();
    return new Response(Buffer.from(bytes), {
      headers: { "Content-Type": "image/jpeg" },
    });
  } catch (err) {
    console.error("[clip-thumb] s3 fetch failed:", err);
    return fallbackRedirect();
  }
}
