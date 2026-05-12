import { GetObjectCommand, S3Client } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import type { NextRequest } from "next/server";
import { verifyIdToken } from "@/lib/auth-server";
import { getAdminDb } from "@/lib/firebase-admin";

const isS3Configured = Boolean(process.env.AWS_ACCESS_KEY_ID && process.env.AWS_S3_BUCKET);

function makeS3Client() {
  return new S3Client({
    region: process.env.AWS_REGION!,
    credentials: {
      accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
      secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
    },
  });
}

async function keyToPresignedUrl(s3: S3Client, key: string): Promise<string> {
  return getSignedUrl(
    s3,
    new GetObjectCommand({ Bucket: process.env.AWS_S3_BUCKET!, Key: key }),
    { expiresIn: 3600 }
  );
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ eventId: string }> }
) {
  let uid: string;
  try {
    const token = await verifyIdToken(request);
    uid = token.uid;
  } catch {
    return Response.json({ error: "UNAUTHORIZED" }, { status: 401 });
  }

  const { eventId } = await params;

  try {
    const db = getAdminDb();
    const snap = await db.collection("events").doc(eventId).get();

    if (!snap.exists) {
      return Response.json({ error: "NOT_FOUND" }, { status: 404 });
    }
    if (snap.data()!.hostId !== uid) {
      return Response.json({ error: "FORBIDDEN" }, { status: 403 });
    }

    if (!isS3Configured) {
      return Response.json({ coverImageUrl: null, galleryUrls: [], introMediaUrl: null, outroMediaUrl: null });
    }

    const data = snap.data()!;
    const coverKey = (data.coverImageUrl ?? null) as string | null;
    const galleryKeys = (data.galleryUrls ?? []) as string[];
    const introMediaKey = (data.introMediaKey ?? null) as string | null;
    const outroMediaKey = (data.outroMediaKey ?? null) as string | null;

    const s3 = makeS3Client();
    const [coverImageUrl, introMediaUrl, outroMediaUrl, ...galleryUrls] = await Promise.all([
      coverKey ? keyToPresignedUrl(s3, coverKey) : Promise.resolve(null),
      introMediaKey ? keyToPresignedUrl(s3, introMediaKey) : Promise.resolve(null),
      outroMediaKey ? keyToPresignedUrl(s3, outroMediaKey) : Promise.resolve(null),
      ...galleryKeys.map((k) => keyToPresignedUrl(s3, k)),
    ]);

    return Response.json({ coverImageUrl, galleryUrls, introMediaUrl, outroMediaUrl });
  } catch (err) {
    console.error("[invite-urls GET]", err);
    return Response.json({ error: "INTERNAL_ERROR" }, { status: 500 });
  }
}
