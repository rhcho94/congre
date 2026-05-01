"use client";

import type { ReactNode } from "react";

const sparkles = [
  { top: "8%",  left: "6%",  size: 10, delay: 0,   dur: 3.8 },
  { top: "15%", left: "82%", size: 8,  delay: 1.1, dur: 4.5 },
  { top: "38%", left: "90%", size: 12, delay: 2.3, dur: 3.2 },
  { top: "62%", left: "88%", size: 7,  delay: 0.7, dur: 5.1 },
  { top: "78%", left: "75%", size: 9,  delay: 1.8, dur: 4.0 },
  { top: "85%", left: "12%", size: 11, delay: 3.0, dur: 3.6 },
  { top: "55%", left: "4%",  size: 8,  delay: 0.4, dur: 5.5 },
  { top: "25%", left: "18%", size: 7,  delay: 2.6, dur: 4.2 },
];

function StarSVG({ size, color }: { size: number; color: string }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 20 20"
      fill={color}
      aria-hidden
    >
      <path d="M10 0 L11.5 8.5 L20 10 L11.5 11.5 L10 20 L8.5 11.5 L0 10 L8.5 8.5 Z" />
    </svg>
  );
}

export default function LandingSparkles({ children }: { children: ReactNode }) {
  return (
    <div className="relative">
      {children}

      {sparkles.map((s, i) => (
        <span
          key={i}
          className="pointer-events-none absolute sparkle-star"
          style={{
            top: s.top,
            left: s.left,
            zIndex: 10,
            animationDelay: `${s.delay}s`,
            animationDuration: `${s.dur}s`,
          }}
          aria-hidden
        >
          <StarSVG
            size={s.size}
            color={i % 3 === 0 ? "#c8892c" : i % 3 === 1 ? "#e8b860" : "#ffffff"}
          />
        </span>
      ))}

      <style>{`
        @keyframes sparkle-fade {
          0%   { opacity: 0; transform: scale(0.6) rotate(0deg); }
          30%  { opacity: 1; transform: scale(1) rotate(15deg); }
          70%  { opacity: 1; transform: scale(1) rotate(-10deg); }
          100% { opacity: 0; transform: scale(0.6) rotate(0deg); }
        }
        .sparkle-star {
          animation: sparkle-fade linear infinite;
        }
        @media (prefers-reduced-motion: reduce) {
          .sparkle-star {
            animation-play-state: paused;
            opacity: 0;
          }
        }
      `}</style>
    </div>
  );
}
