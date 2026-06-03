import { GetObjectCommand, S3Client } from "@aws-sdk/client-s3";
import type { NextRequest } from "next/server";
import { getAdminDb } from "@/lib/firebase-admin";

const FALLBACK_URL = "https://app.congre.kr/logo.png";

function fallbackRedirect(): Response {
  return Response.redirect(FALLBACK_URL, 302);
}

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ eventId: string }> }
) {
  const { eventId } = await params;

  let introMediaKey: string;
  try {
    const db = getAdminDb();
    const snap = await db.collection("events").doc(eventId).get();
    if (!snap.exists) return fallbackRedirect();
    const data = snap.data()!;
    const mediaType = data.introMediaType as "image" | "video" | undefined;
    const key = data.introMediaKey as string | undefined;
    if (mediaType !== "image" || !key) return fallbackRedirect();
    introMediaKey = key;
  } catch (err) {
    console.error("[og-image] event lookup failed:", err);
    return fallbackRedirect();
  }

  if (!process.env.AWS_ACCESS_KEY_ID || !process.env.AWS_S3_BUCKET) {
    console.error("[og-image] S3 not configured");
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
        Key: introMediaKey,
      })
    );
    if (!obj.Body) {
      console.error("[og-image] s3 empty body for key:", introMediaKey);
      return fallbackRedirect();
    }
    const bytes = await obj.Body.transformToByteArray();
    const contentType = obj.ContentType ?? "application/octet-stream";
    return new Response(Buffer.from(bytes), {
      headers: { "Content-Type": contentType },
    });
  } catch (err) {
    console.error("[og-image] s3 fetch failed:", err);
    return fallbackRedirect();
  }
}
