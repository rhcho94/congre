"use client";

import { useEffect, useRef } from "react";
import confetti from "canvas-confetti";

const PALETTE = ["#ede8df", "#c8892c", "#e8b860", "#ffffff"];

export default function LandingParticles() {
  const timersRef = useRef<ReturnType<typeof setTimeout>[]>([]);

  useEffect(() => {
    if (typeof window === "undefined") return;

    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reducedMotion) return;

    const isMobile = window.innerWidth < 768;
    const mobileScalar = isMobile ? 0.8 : 0.7;

    // Initial burst
    const canvas = document.createElement("canvas");
    canvas.style.cssText =
      "position:fixed;top:0;left:0;width:100%;height:100%;pointer-events:none;z-index:50";
    document.body.appendChild(canvas);

    const myConfetti = confetti.create(canvas, { resize: true, useWorker: true });

    myConfetti({
      particleCount: 80,
      spread: 360,
      startVelocity: 35,
      scalar: mobileScalar,
      ticks: 120,
      gravity: 0.8,
      colors: PALETTE,
      shapes: ["circle", "square"],
      origin: { x: 0.5, y: 0.5 },
    });

    // Ambient bursts at random intervals (5–9s)
    let stopped = false;

    function scheduleNext() {
      if (stopped) return;
      const delay = 5000 + Math.random() * 4000;
      const id = setTimeout(() => {
        if (stopped) return;
        const x = 0.15 + Math.random() * 0.7;
        const y = 0.1 + Math.random() * 0.5;
        myConfetti({
          particleCount: 25,
          spread: 120,
          scalar: 0.6,
          ticks: 90,
          gravity: 0.7,
          colors: PALETTE,
          shapes: ["circle", "square"],
          origin: { x, y },
        });
        scheduleNext();
      }, delay);
      timersRef.current.push(id);
    }

    scheduleNext();

    return () => {
      stopped = true;
      timersRef.current.forEach(clearTimeout);
      timersRef.current = [];
      myConfetti.reset();
      canvas.remove();
    };
  }, []);

  return null;
}
