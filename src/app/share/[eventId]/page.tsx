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
      title: `${title} | Congre`,
      openGraph: {
        title,
        description: "Congre로 만든 영상입니다",
        images: [`https://app.congre.kr/api/og-image/${eventId}`],
      },
    };
  } catch {
    return { title: "Congre" };
  }
}

/** 로고 D 마크(logo-d-mark.svg) — 만료 카드 전용 */
function LogoMark() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" width={56} height={56} role="img" aria-label="Congre">
      <path d="M18 22h52l12 12v44H18z" fill="#FFFFFF" stroke="#1F3C9C" strokeWidth="4" strokeLinejoin="round" />
      <path d="M70 22v12h12" fill="none" stroke="#1F3C9C" strokeWidth="4" strokeLinejoin="round" />
      <path d="M43 33l18 11-18 11z" fill="#1F3C9C" stroke="#1F3C9C" strokeWidth="2" strokeLinejoin="round" />
      <path d="M30 66c4-3 8-3 12 0s8 3 12 0 8-3 12 0" fill="none" stroke="#C62828" strokeWidth="3.5" strokeLinecap="round" />
    </svg>
  );
}

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
  const shareImageUrl = `${appUrl}/og-image.png`;

  const isReady = status === "done" && !!videoS3Key;
  // cleanup 크론이 7일 뒤 videoS3Key=null + videoDeletedAt(Timestamp)을 기록한다. 존재 여부만 본다.
  const isExpired = status === "done" && !videoS3Key && !!data.videoDeletedAt;
  const videoUrl = isReady ? await getVideoPresignedUrl(videoS3Key!) : undefined;

  return (
    <>
      <PageBackdrop pattern="e" />
      <div className="min-h-screen flex flex-col">
        <main className="flex-1 flex flex-col w-full max-w-sm mx-auto px-5 pt-10 pb-10 gap-[18px]">
          {isExpired ? (
            <div className="notice flex flex-col items-center gap-3 text-center" style={{ padding: "28px 20px" }}>
              <LogoMark />
              <p className="text-sm text-muted">{title}</p>
              <h1 className="display" style={{ fontSize: 24, lineHeight: 1.3 }}>
                보관 기간(7일)이 지나
                <br />
                영상이 삭제됐어요
              </h1>
            </div>
          ) : (
            <>
              <div className="notice">
                <h1 className="display text-xl text-center">{title}</h1>
              </div>

              {isReady ? (
                <>
                  <video
                    src={videoUrl}
                    controls
                    playsInline
                    className="w-full"
                    style={{ aspectRatio: "9/16", background: "#000" }}
                  />
                  <ShareActions eventTitle={title} shareUrl={shareUrl} shareImageUrl={shareImageUrl} />
                </>
              ) : (
                <div className="notice flex flex-col items-center gap-3 text-center" style={{ padding: "40px 20px" }}>
                  <p className="display" style={{ fontSize: 18 }}>영상 준비 중입니다</p>
                  <p className="text-sm text-muted">
                    편집이 완료되면 이 페이지에서 확인할 수 있습니다.
                  </p>
                </div>
              )}
            </>
          )}
        </main>

        <footer className="w-full flex justify-center" style={{ padding: "16px 20px 24px", borderTop: "1px solid var(--line)" }}>
          <BrandName withMadeBy />
        </footer>
      </div>
    </>
  );
}
