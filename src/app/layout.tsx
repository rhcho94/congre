import type { Metadata } from "next";
import { Gowun_Dodum, Nanum_Pen_Script } from "next/font/google";
import "./globals.css";

const gowun = Gowun_Dodum({
  variable: "--font-gowun",
  weight: "400",
  preload: false,
  display: "swap",
});

const nanumPen = Nanum_Pen_Script({
  variable: "--font-nanum-pen",
  weight: "400",
  preload: false,
  display: "swap",
});

export const metadata: Metadata = {
  title: "Congre | 이벤트 순간을 하나의 영상으로",
  description:
    "QR로 참가자 영상을 모아 자동으로 편집해 주는 이벤트 영상 플랫폼",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="ko" className={`${gowun.variable} ${nanumPen.variable}`}>
      <body className="min-h-screen">{children}</body>
    </html>
  );
}
