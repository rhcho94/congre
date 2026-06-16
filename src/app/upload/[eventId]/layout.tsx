import type { Metadata } from "next";
import type { ReactNode } from "react";
import { getAdminDb } from "@/lib/firebase-admin";

type Props = { params: Promise<{ eventId: string }> };

function truncate(s: string, max: number): string {
  return s.length > max ? s.slice(0, max) + "…" : s;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { eventId } = await params;
  try {
    const db = getAdminDb();
    const eventSnap = await db.collection("events").doc(eventId).get();
    if (!eventSnap.exists) return {};
    const eventData = eventSnap.data()!;
    const title = eventData.title as string | undefined;
    const hostId = eventData.hostId as string | undefined;

    let hostName: string | null = null;
    if (hostId) {
      try {
        const userSnap = await db.collection("users").doc(hostId).get();
        if (userSnap.exists) {
          const raw = userSnap.data()?.name;
          if (typeof raw === "string" && raw.trim()) {
            hostName = raw.trim();
          }
        }
      } catch (err) {
        console.error("[upload-og] host name lookup failed:", err);
      }
    }

    if (!title || !title.trim()) return {};

    const truncatedTitle = truncate(title.trim(), 20);
    const truncatedHost = hostName ? truncate(hostName, 12) : null;

    const ogTitle = truncatedHost
      ? `${truncatedHost}님이 초대했어요 · ${truncatedTitle}`
      : `${truncatedTitle} 영상에 초대합니다`;
    const ogDescription = "짧은 축하·소감·챌린지 영상을 올려주세요";

    const ogImageUrl = `https://app.congre.kr/api/og-image/${eventId}`;

    return {
      title: ogTitle,
      description: ogDescription,
      openGraph: {
        title: ogTitle,
        description: ogDescription,
        url: `https://app.congre.kr/upload/${eventId}`,
        type: "website",
        images: [{ url: ogImageUrl, width: 1200, height: 630, alt: ogTitle }],
      },
      twitter: {
        card: "summary_large_image",
        title: ogTitle,
        description: ogDescription,
        images: [ogImageUrl],
      },
    };
  } catch (err) {
    console.error("[upload-og] failed:", err);
    return {};
  }
}

export default function UploadLayout({ children }: { children: ReactNode }) {
  return <div data-theme="dark">{children}</div>;
}
