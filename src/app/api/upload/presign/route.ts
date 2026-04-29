import { PutObjectCommand, S3Client } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import type { NextRequest } from "next/server";

const isS3Configured = Boolean(process.env.AWS_ACCESS_KEY_ID && process.env.AWS_S3_BUCKET);

export async function GET() {
  return Response.json({ configured: isS3Configured });
}

export async function POST(request: NextRequest) {
  if (!isS3Configured) {
    return Response.json({ error: "S3_NOT_CONFIGURED" }, { status: 503 });
  }

  const { eventId, fileName, fileType } = await request.json();

  // codec 파라미터 제거 — presign 서명 값과 PUT Content-Type 헤더가 정확히 일치해야 함
  const contentType = (fileType as string).split(";")[0] || "video/webm";
  const key = `events/${eventId}/${Date.now()}-${fileName}`;

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

  const url = await getSignedUrl(s3, command, { expiresIn: 300 });

  return Response.json({ url, key });
}
