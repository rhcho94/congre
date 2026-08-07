import { DeleteObjectCommand, GetObjectCommand, S3Client } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";

// 클라이언트가 보낸 S3 키가 해당 이벤트 폴더 소속인지 검증.
// 정규식 대신 startsWith 사용 — eventId의 정규식 특수문자로 인한 오작동 방지.
export function isKeyInEvent(key: string, eventId: string): boolean {
  if (!eventId) return false;
  return key.startsWith(`events/${eventId}/`);
}

export async function deleteS3Object(key: string): Promise<void> {
  const s3 = new S3Client({
    region: process.env.AWS_REGION!,
    credentials: {
      accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
      secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
    },
  });
  await s3.send(new DeleteObjectCommand({
    Bucket: process.env.AWS_S3_BUCKET!,
    Key: key,
  }));
}

export async function getVideoPresignedUrl(s3Key: string): Promise<string> {
  const s3 = new S3Client({
    region: process.env.AWS_REGION!,
    credentials: {
      accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
      secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
    },
  });
  return await getSignedUrl(
    s3,
    new GetObjectCommand({ Bucket: process.env.AWS_S3_BUCKET!, Key: s3Key }),
    { expiresIn: 3600 }
  );
}
