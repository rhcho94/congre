/**
 * PageBackdrop — 전 페이지 공통 배경 사진 + 오버레이.
 * 패턴별 농도 분기: 첫인상 화면(form/guest)은 사진 살림, 작업/읽기는 흐리게.
 * 사진 자산은 public/images/bg-stage-{a..e}.png.
 */

type Pattern = "a" | "b" | "c" | "d" | "e";

const FIRST_IMPRESSION: Record<Pattern, boolean> = {
  a: true,  // 폼류 — 사진 살림
  b: false, // 목록류 — 흐리게
  c: false, // 작업 — 흐리게
  d: false, // 정적 — 흐리게
  e: true,  // 게스트 — 사진 살림
};

export default function PageBackdrop({ pattern }: { pattern: Pattern }) {
  const firstImpression = FIRST_IMPRESSION[pattern];

  return (
    <>
      <div
        aria-hidden
        className="fixed inset-0 pointer-events-none"
        style={{
          zIndex: -10,
          backgroundImage: `url(/images/bg-stage-${pattern}.png)`,
          backgroundSize: "cover",
          backgroundPosition: "center",
          ...(firstImpression
            ? { filter: "saturate(0.9) brightness(0.92)" }
            : {
                opacity: 0.4,
                filter: "saturate(0.85) brightness(1.0) blur(1px)",
                transform: "scale(1.08)",
              }),
        }}
      />
      <div
        aria-hidden
        className="fixed inset-0 pointer-events-none"
        style={{
          zIndex: -9,
          background: firstImpression
            ? "linear-gradient(180deg, rgba(12,11,9,0.45) 0%, rgba(12,11,9,0.62) 50%, rgba(12,11,9,0.80) 100%)"
            : "linear-gradient(180deg, rgba(12,11,9,0.30) 0%, rgba(12,11,9,0.45) 100%)",
        }}
      />
    </>
  );
}
