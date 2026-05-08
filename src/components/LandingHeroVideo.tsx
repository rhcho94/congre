"use client";

import { useRef, useState } from "react";
import { Volume2, VolumeX } from "lucide-react";

export default function LandingHeroVideo() {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [muted, setMuted] = useState(true);

  function toggleMute() {
    const video = videoRef.current;
    if (!video) return;
    video.muted = !video.muted;
    setMuted(video.muted);
  }

  return (
    <div
      className="relative overflow-hidden rounded-2xl bg-surface shadow-2xl"
      style={{
        aspectRatio: "9 / 16",
        width: "100%",
        maxWidth: "260px",
        boxShadow: "0 0 60px 0 rgba(200, 137, 44, 0.12), 0 32px 64px rgba(0,0,0,0.6)",
      }}
    >
      <video
        ref={videoRef}
        autoPlay
        muted
        loop
        playsInline
        preload="metadata"
        className="w-full h-full object-cover"
        style={{ background: "var(--surface)" }}
      >
        <source src="/videos/hero.mp4" type="video/mp4" />
      </video>

      <div
        className="pointer-events-none absolute inset-0 rounded-2xl"
        style={{ boxShadow: "inset 0 0 40px 0 rgba(12,11,9,0.4)" }}
        aria-hidden
      />

      <button
        onClick={toggleMute}
        className="absolute bottom-3 right-3 z-10 w-8 h-8 flex items-center justify-center rounded-full bg-black/50 hover:bg-black/70 transition-colors duration-200"
        aria-label={muted ? "소리 켜기" : "소리 끄기"}
      >
        {muted
          ? <VolumeX size={14} strokeWidth={1.5} className="text-white opacity-70" />
          : <Volume2 size={14} strokeWidth={1.5} style={{ color: "var(--accent)" }} />
        }
      </button>
    </div>
  );
}
