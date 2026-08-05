import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { getAdminDb } from "@/lib/firebase-admin";
import { getVideoPresignedUrl } from "@/lib/s3-server";
import { BrandName } from "@/components/BrandName";
import PageBackdrop from "@/components/PageBackdrop";
import { ShareActions } from "./ShareActions";

type Props = { params: Promise<{ eventId: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { eventId } = await params;
  try {
    const db = getAdminDb();
    const snap = await db.collection("events").doc(eventId).get();
    if (!snap.exists) return { title: "Congre" };
    const title = snap.data()!.title as string;
    return {
      title: `${title} — Congre`,
      openGraph: {
        title,
        description: "Congre로 만든 영상입니다 🎬",
        images: [`https://app.congre.kr/api/og-image/${eventId}`],
      },
    };
  } catch {
    return { title: "Congre" };
  }
}

const scrim: React.CSSProperties = {
  background: "linear-gradient(180deg, rgba(12,11,9,0.78), rgba(12,11,9,0.90))",
  borderRadius: "var(--r-md)",
  padding: "16px 18px",
};

export default async function SharePage({ params }: Props) {
  const { eventId } = await params;
  const db = getAdminDb();
  const snap = await db.collection("events").doc(eventId).get();

  if (!snap.exists) notFound();

  const data = snap.data()!;
  const title = data.title as string;
  const videoS3Key = (data.videoS3Key ?? undefined) as string | undefined;
  const status = data.status as string;
  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "";
  const shareUrl = `${appUrl}/share/${eventId}`;
  const logoUrl = `${appUrl}/logo.png`;

  const isReady = status === "done" && !!videoS3Key;
  const videoUrl = isReady ? await getVideoPresignedUrl(videoS3Key!) : undefined;

  return (
    <div data-theme="dark">
      <PageBackdrop pattern="e" />
      <div className="min-h-screen flex flex-col">
        <main className="flex-1 flex flex-col items-center w-full max-w-sm mx-auto px-4 py-10 gap-6">
          <h1 className="display text-xl text-center w-full" style={{ ...scrim, color: "#ede8df" }}>
            {title}
          </h1>

          {isReady ? (
            <>
              <video
                src={videoUrl}
                controls
                playsInline
                className="w-full"
                style={{ aspectRatio: "9/16", background: "#0c0b09", borderRadius: "var(--r-md)" }}
              />
              <ShareActions eventTitle={title} shareUrl={shareUrl} logoUrl={logoUrl} />
            </>
          ) : (
            <div className="flex flex-col items-center gap-3 py-16 text-center" style={scrim}>
              <p className="eyebrow">영상 준비 중입니다</p>
              <p className="text-xs text-muted">
                편집이 완료되면 이 페이지에서 확인할 수 있습니다.
              </p>
            </div>
          )}
        </main>

        <footer className="w-full text-center py-6" style={{ borderTop: "1px solid var(--hairline)" }}>
          <BrandName withMadeBy className="text-sm" />
        </footer>
      </div>
    </div>
  );
}
