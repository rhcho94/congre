import { BrandName } from "@/components/BrandName";

export default function CongreBadge({ className }: { className?: string }) {
  return (
    <div
      className={`inline-flex flex-col items-center px-4 py-2 rounded-2xl border border-white/10 gap-0.5 ${className ?? ""}`}
      style={{ background: "rgba(12,11,9,0.72)", backdropFilter: "blur(8px)" }}
    >
      <div className="flex items-center gap-2">
        <span className="text-[9px]" style={{ color: "var(--accent)" }}>◆</span>
        <BrandName className="text-sm font-light tracking-widest" />
      </div>
      <BrandName withMadeBy className="text-[9px] tracking-[0.22em] uppercase font-light" />
    </div>
  );
}
