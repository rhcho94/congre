"use client";

import { useState, useRef } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";

// Mock — replace with API fetch by video id in production
const videoData = {
  title: "2025 팀 워크샵 하이라이트",
  event: "팀 워크샵",
  date: "2025-05-10",
  participants: 24,
  duration: "3:24",
};

export default function PlayerPage() {
  const { id } = useParams<{ id: string }>();
  const [isPlaying, setIsPlaying] = useState(false);
  const [showOverlay, setShowOverlay] = useState(true);
  const videoRef = useRef<HTMLVideoElement>(null);

  function togglePlay() {
    const video = videoRef.current;
    if (!video) return;
    if (video.paused) {
      video.play();
    } else {
      video.pause();
    }
  }

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Nav */}
      <header className="flex items-center justify-between px-6 py-5 border-b border-border">
        <Link
          href="/"
          className="text-xl italic tracking-wider text-foreground hover:text-accent transition-colors duration-200"
          style={{ fontFamily: "var(--font-display, serif)" }}
        >
          Congre
        </Link>
        <Link
          href="/host"
          className="text-xs tracking-widest uppercase text-muted hover:text-accent transition-colors duration-200"
        >
          주최자 →
        </Link>
      </header>

      {/* Content */}
      <main className="flex-1 flex flex-col items-center justify-center px-6 py-10 gap-8">
        {/* Event meta */}
        <div className="text-center">
          <p className="text-xs tracking-[0.4em] uppercase text-accent mb-2">
            {videoData.event} · #{id}
          </p>
          <h1
            className="text-2xl italic text-foreground"
            style={{ fontFamily: "var(--font-display, serif)" }}
          >
            {videoData.title}
          </h1>
          <p className="mt-1.5 text-xs text-muted">
            {videoData.date} · 참가자 {videoData.participants}명 · {videoData.duration}
          </p>
        </div>

        {/* 9:16 Player */}
        <div
          className="relative bg-surface border border-border overflow-hidden cursor-pointer glow-accent"
          style={{ width: "100%", maxWidth: "320px", aspectRatio: "9 / 16" }}
          onClick={togglePlay}
          onMouseEnter={() => setShowOverlay(true)}
          onMouseLeave={() => isPlaying && setShowOverlay(false)}
        >
          {/* Placeholder background */}
          <div className="absolute inset-0 flex items-center justify-center bg-[var(--surface-2)]">
            <div className="flex flex-col items-center gap-3 opacity-30">
              <svg
                width="36"
                height="36"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.5"
                className="text-muted"
              >
                <polygon points="23 7 16 12 23 17 23 7" />
                <rect x="1" y="5" width="15" height="14" rx="2" ry="2" />
              </svg>
              <p className="text-xs text-muted tracking-widest uppercase">영상</p>
            </div>
          </div>

          {/* Real video (src from API/storage) */}
          <video
            ref={videoRef}
            className="absolute inset-0 w-full h-full object-cover opacity-0"
            playsInline
            onPlay={() => setIsPlaying(true)}
            onPause={() => setIsPlaying(false)}
            onEnded={() => { setIsPlaying(false); setShowOverlay(true); }}
          />

          {/* Play / Pause overlay */}
          {showOverlay && (
            <div className="absolute inset-0 flex items-center justify-center">
              <div
                className="w-14 h-14 border border-accent flex items-center justify-center"
                style={{ background: "rgba(12,11,9,0.65)" }}
              >
                {isPlaying ? (
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor" className="text-accent">
                    <rect x="6" y="4" width="4" height="16" />
                    <rect x="14" y="4" width="4" height="16" />
                  </svg>
                ) : (
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor" className="text-accent ml-0.5">
                    <polygon points="5 3 19 12 5 21 5 3" />
                  </svg>
                )}
              </div>
            </div>
          )}

          {/* Viewfinder corners */}
          <span className="absolute top-3 left-3 w-4 h-4 border-t border-l border-accent opacity-50" />
          <span className="absolute top-3 right-3 w-4 h-4 border-t border-r border-accent opacity-50" />
          <span className="absolute bottom-3 left-3 w-4 h-4 border-b border-l border-accent opacity-50" />
          <span className="absolute bottom-3 right-3 w-4 h-4 border-b border-r border-accent opacity-50" />
        </div>

        {/* Actions */}
        <div className="flex items-center gap-3">
          <button className="flex items-center gap-2 px-6 py-2.5 bg-accent text-background text-xs tracking-widest uppercase font-medium hover:brightness-110 transition-all duration-200 glow-accent">
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
              <polyline points="7 10 12 15 17 10" />
              <line x1="12" y1="15" x2="12" y2="3" />
            </svg>
            다운로드
          </button>
          <button className="flex items-center gap-2 px-6 py-2.5 border border-border text-muted text-xs tracking-widest uppercase hover:border-accent hover:text-foreground transition-all duration-200">
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="18" cy="5" r="3" />
              <circle cx="6" cy="12" r="3" />
              <circle cx="18" cy="19" r="3" />
              <line x1="8.59" y1="13.51" x2="15.42" y2="17.49" />
              <line x1="15.41" y1="6.51" x2="8.59" y2="10.49" />
            </svg>
            공유
          </button>
        </div>
      </main>

      <div className="rule mx-6 mb-6" />

      <footer className="px-6 pb-6 text-center">
        <p className="text-xs tracking-[0.3em] uppercase text-muted">
          Congre · AI 자동 편집
        </p>
      </footer>
    </div>
  );
}
