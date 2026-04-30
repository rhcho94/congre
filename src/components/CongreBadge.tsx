export default function CongreBadge({ className }: { className?: string }) {
  return (
    <div
      className={`inline-flex flex-col items-center px-4 py-2 rounded-2xl border border-white/10 gap-0.5 ${className ?? ""}`}
      style={{ background: "rgba(12,11,9,0.72)", backdropFilter: "blur(8px)" }}
    >
      <div className="flex items-center gap-2">
        <span className="text-[9px]" style={{ color: "var(--accent)" }}>◆</span>
        <span
          className="text-sm font-light italic tracking-widest text-white"
          style={{ fontFamily: "var(--font-display, Georgia, serif)" }}
        >
          congre
        </span>
      </div>
      <span className="text-[9px] tracking-[0.22em] uppercase font-light" style={{ color: "rgba(255,255,255,0.4)" }}>
        made with congre
      </span>
    </div>
  );
}
