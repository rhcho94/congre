import Link from "next/link";
import { BrandName } from "@/components/BrandName";
import { LANDING_URL } from "@/lib/constants";

// Next 기본 영어 404("This page could not be found.") 대신 한글 화면.
// 없는 주소, 그리고 share/[eventId]의 notFound()에서 온다.
export default function NotFound() {
  return (
    <div className="min-h-screen flex items-center justify-center px-6">
      <div className="notice w-full max-w-sm flex flex-col items-center gap-4 text-center" style={{ padding: "32px 24px" }}>
        <BrandName height={28} />
        <h1 className="display" style={{ fontSize: 22, lineHeight: 1.3 }}>
          페이지를 찾을 수 없어요
        </h1>
        <p className="text-sm text-muted leading-relaxed">
          주소가 잘못됐거나, 이미 사라진 페이지예요.
          <br />
          호스트 로그인은 app.congre.kr에서 시작해요.
        </p>
        <div className="flex flex-col gap-2 w-full" style={{ marginTop: 8 }}>
          <Link href="/host" className="btn btn-primary w-full">
            호스트 로그인
          </Link>
          <a href={LANDING_URL} className="btn btn-secondary w-full">
            Congre 소개 보기
          </a>
        </div>
      </div>
    </div>
  );
}
