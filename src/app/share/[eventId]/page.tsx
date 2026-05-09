import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { getAdminDb } from "@/lib/firebase-admin";
import { BrandName } from "@/components/BrandName";
import { ShareActions } from "./ShareActions";

type Props = { params: Promise<{ eventId: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { eventId } = await params;
  try {
    const db = getAdminDb();
    const snap = await db.collection("events").doc(eventId).get();
    if (!snap.exists) return { title: "Congre" };
    const title = snap.data()!.title as string;
    const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "";
    return {
      title: `${title} — Congre`,
      openGraph: {
        title,
        description: "Congre로 만든 영상입니다 🎬",
        images: [`${appUrl}/logo.png`],
      },
    };
  } catch {
    return { title: "Congre" };
  }
}

export default async function SharePage({ params }: Props) {
  const { eventId } = await params;
  const db = getAdminDb();
  const snap = await db.collection("events").doc(eventId).get();

  if (!snap.exists) notFound();

  const data = snap.data()!;
  const title = data.title as string;
  const videoUrl = (data.videoUrl ?? undefined) as string | undefined;
  const status = data.status as string;
  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "";
  const shareUrl = `${appUrl}/share/${eventId}`;
  const logoUrl = `${appUrl}/logo.png`;

  const isReady = status === "done" && !!videoUrl;

  return (
    <div className="min-h-screen flex flex-col" style={{ background: "var(--bg)", color: "var(--text)" }}>
      <main className="flex-1 flex flex-col items-center w-full max-w-sm mx-auto px-4 py-10 gap-6">
        <h1
          className="text-xl text-center w-full"
          style={{ fontFamily: "var(--font-display)", fontStyle: "italic" }}
        >
          {title}
        </h1>

        {isReady ? (
          <>
            <video
              src={videoUrl}
              controls
              playsInline
              className="w-full"
              style={{ aspectRatio: "9/16", background: "#0c0b09" }}
            />
            <ShareActions eventTitle={title} shareUrl={shareUrl} logoUrl={logoUrl} />
          </>
        ) : (
          <div className="flex flex-col items-center gap-3 py-16 text-center">
            <p className="text-sm tracking-widest uppercase" style={{ color: "var(--muted)" }}>
              영상 준비 중입니다
            </p>
            <p className="text-xs" style={{ color: "var(--muted)" }}>
              편집이 완료되면 이 페이지에서 확인할 수 있습니다.
            </p>
          </div>
        )}
      </main>

      <footer className="w-full border-t text-center py-6" style={{ borderColor: "var(--border)" }}>
        <BrandName withMadeBy className="text-sm" />
      </footer>
    </div>
  );
}
