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
          Congre
        </span>
      </div>
      <span className="text-[9px] tracking-[0.22em] uppercase font-light">
        <span style={{ color: "rgba(200,137,44,0.45)" }}>made by </span>
        <span style={{ color: "var(--accent)" }}>Congre</span>
      </span>
    </div>
  );
}
