import { notFound, redirect } from "next/navigation";
import type { Metadata } from "next";
import Link from "next/link";
import { GetObjectCommand, S3Client } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { getAdminDb } from "@/lib/firebase-admin";
import { BrandName } from "@/components/BrandName";

const isS3Configured = Boolean(process.env.AWS_ACCESS_KEY_ID && process.env.AWS_S3_BUCKET);

async function keyToUrl(key: string): Promise<string> {
  if (!isS3Configured || !key) return key;
  const s3 = new S3Client({
    region: process.env.AWS_REGION!,
    credentials: {
      accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
      secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
    },
  });
  return getSignedUrl(
    s3,
    new GetObjectCommand({ Bucket: process.env.AWS_S3_BUCKET!, Key: key }),
    { expiresIn: 3600 }
  );
}

type Props = { params: Promise<{ eventId: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { eventId } = await params;
  try {
    const db = getAdminDb();
    const snap = await db.collection("events").doc(eventId).get();
    if (!snap.exists) return { title: "Congre" };
    const data = snap.data()!;
    const title = data.title as string;
    const welcomeText = (data.welcomeText ?? "") as string;
    const coverImageKey = (data.coverImageUrl ?? "") as string;
    const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "";
    const ogImage = coverImageKey.trim()
      ? await keyToUrl(coverImageKey)
      : `${appUrl}/logo.png`;
    return {
      title: `${title} — Congre`,
      openGraph: {
        title,
        description: welcomeText.trim() ? welcomeText : `${title} 초대장`,
        images: [ogImage],
      },
    };
  } catch {
    return { title: "Congre" };
  }
}

export default async function InvitePage({ params }: Props) {
  const { eventId } = await params;
  const db = getAdminDb();
  const snap = await db.collection("events").doc(eventId).get();

  if (!snap.exists) notFound();

  const data = snap.data()!;
  const title = data.title as string;
  const status = data.status as string;
  const sessionToken = (data.sessionToken ?? null) as string | null;
  const welcomeText = (data.welcomeText ?? "") as string;
  const coverImageKey = (data.coverImageUrl ?? "") as string;
  const galleryKeys = (data.galleryUrls ?? []) as string[];
  const rawDate = data.date as { toDate(): Date } | undefined;
  const dateStr = rawDate
    ? rawDate.toDate().toLocaleDateString("ko-KR", { year: "numeric", month: "long", day: "numeric" })
    : null;

  const hasContent = welcomeText.trim() || coverImageKey.trim() || galleryKeys.length > 0;

  if (!hasContent) {
    redirect(
      status === "open" && sessionToken
        ? `/upload/${eventId}?token=${sessionToken}`
        : `/upload/${eventId}`
    );
  }

  const uploadUrl =
    status === "open" && sessionToken ? `/upload/${eventId}?token=${sessionToken}` : null;

  const [coverImageUrl, ...galleryUrls] = await Promise.all([
    coverImageKey.trim() ? keyToUrl(coverImageKey) : Promise.resolve(""),
    ...galleryKeys.map(keyToUrl),
  ]);

  return (
    <div className="min-h-screen flex flex-col" style={{ background: "var(--bg)", color: "var(--text)" }}>
      <main className="flex-1 flex flex-col w-full max-w-sm mx-auto px-4 py-10 gap-6">
        {coverImageUrl.trim() && (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={coverImageUrl}
            alt={title}
            className="w-full object-cover"
            style={{ maxHeight: "320px" }}
          />
        )}

        <div className="flex flex-col gap-1">
          <h1
            className="text-2xl"
            style={{ fontFamily: "var(--font-display)", fontStyle: "italic" }}
          >
            {title}
          </h1>
          {dateStr && (
            <p className="text-sm" style={{ color: "var(--muted)" }}>
              {dateStr}
            </p>
          )}
        </div>

        {welcomeText.trim() && (
          <p className="text-sm leading-relaxed whitespace-pre-line" style={{ color: "var(--text)" }}>
            {welcomeText}
          </p>
        )}

        {status === "closed" && (
          <p className="text-sm tracking-widest uppercase" style={{ color: "var(--muted)" }}>
            업로드 기간이 종료되었습니다
          </p>
        )}

        {status === "rendering" && (
          <p className="text-sm" style={{ color: "var(--muted)" }}>
            영상 제작 중입니다. 잠시만 기다려주세요.
          </p>
        )}

        {status === "done" && (
          <p className="text-sm" style={{ color: "var(--muted)" }}>
            영상이 완성되었습니다.
          </p>
        )}

        {uploadUrl && (
          <Link
            href={uploadUrl}
            className="w-full py-3.5 text-sm tracking-widest uppercase font-medium text-center block transition-all duration-200 hover:brightness-110"
            style={{ background: "var(--accent)", color: "var(--bg)" }}
          >
            영상 올리기
          </Link>
        )}

        {status === "done" && (
          <Link
            href={`/share/${eventId}`}
            className="w-full py-3.5 text-sm tracking-widest uppercase font-medium text-center block transition-all duration-200 hover:brightness-110"
            style={{ background: "var(--accent)", color: "var(--bg)" }}
          >
            완성 영상 보기
          </Link>
        )}

        {galleryUrls.length > 0 && (
          <div className="grid grid-cols-2 gap-2">
            {galleryUrls.map((url, i) => (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                key={url}
                src={url}
                alt={`갤러리 ${i + 1}`}
                className="w-full object-cover aspect-square"
              />
            ))}
          </div>
        )}
      </main>

      <footer className="w-full border-t text-center py-6" style={{ borderColor: "var(--border)" }}>
        <BrandName withMadeBy className="text-sm" />
      </footer>
    </div>
  );
}
