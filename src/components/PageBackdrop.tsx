/**
 * PageBackdrop — 참가자·공유 화면(pattern "e") 맨 위 사진 배경.
 * 사진은 public/images/bg-event.jpg(768×620). 아래쪽은 그림 파일 안에서 이미 바탕색으로 덮여 있다.
 * 페이지와 함께 스크롤된다(fixed 아님). 나머지 패턴은 그리지 않는다.
 */

type Pattern = "a" | "b" | "c" | "d" | "e";

export default function PageBackdrop({ pattern }: { pattern: Pattern }) {
  if (pattern !== "e") return null;

  return (
    <div
      aria-hidden
      style={{
        position: "absolute",
        top: 0,
        left: 0,
        width: "100%",
        aspectRatio: "768 / 620",
        background: "url(/images/bg-event.jpg) top center / 100% auto no-repeat",
        zIndex: -10,
        pointerEvents: "none",
      }}
    />
  );
}
