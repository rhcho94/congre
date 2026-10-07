// 무료 플랜 워터마크 미리보기 — 영상 위에 실제로 얹히는 "made by Congre" 펜 글씨 모양을 보여 준다.
// 영상 위 모습이라 어두운 바탕을 쓴다. (렌더 쪽 값: src/lib/shotstack.ts 워터마크, Nanum Pen 흰색 0.6)
export default function CongreBadge({ className }: { className?: string }) {
  return (
    <div
      className={`inline-block ${className ?? ""}`}
      style={{ background: "rgba(20,20,20,0.72)", padding: "6px 12px" }}
    >
      <span className="pen" style={{ fontSize: 20, lineHeight: 1.1, color: "#fff", opacity: 0.9 }}>
        made by Congre
      </span>
    </div>
  );
}
