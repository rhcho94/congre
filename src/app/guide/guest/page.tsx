import Link from "next/link";
import type { CSSProperties } from "react";
import { BrandName } from "@/components/BrandName";
import { LANDING_URL } from "@/lib/constants";
import PageBackdrop from "@/components/PageBackdrop";

// 섹션마다 위 1px 선으로 구분 (큰 상자 없음) — 호스트 가이드와 같은 방식
const SECTION: CSSProperties = { borderTop: "1px solid var(--line)", padding: "18px 0" };
const STEP_LABEL: CSSProperties = { fontSize: 14, color: "var(--pen-red)" };
const H2: CSSProperties = { fontSize: 20, lineHeight: 1.35, color: "var(--accent)" };
const H3: CSSProperties = { fontSize: 17, color: "var(--text)" };
const LIST: CSSProperties = { paddingLeft: 18, fontSize: 15, lineHeight: 1.55 };
const SMALL: CSSProperties = { fontSize: 13, lineHeight: 1.55, color: "var(--muted)" };
const FAQ_Q: CSSProperties = { fontSize: 16, color: "var(--text)" };

export default function GuideGuestPage() {
  return (
    <>
      <PageBackdrop pattern="d" />
      <div className="min-h-screen">
        <nav className="flex items-center justify-between gap-2 pl-5 pr-3.5 py-2 min-h-[60px]">
          <a href={LANDING_URL} className="inline-flex items-center hover:opacity-75 transition-opacity duration-200">
            <BrandName />
          </a>
          <Link href="/guide" className="btn-quiet text-sm" style={{ padding: "0 6px" }}>
            ← 가이드
          </Link>
        </nav>

        <main className="mx-auto max-w-3xl px-5 pb-16" style={{ fontSize: 15, lineHeight: 1.6, color: "var(--text)" }}>
          <div className="flex flex-col gap-1.5" style={{ padding: "12px 0 18px" }}>
            <h1 className="display" style={{ fontSize: 28, lineHeight: 1.3 }}>참가자 가이드</h1>
            <p className="text-muted" style={{ fontSize: 15 }}>QR 한 번이면 끝. 앱 설치 없이 세 단계</p>
          </div>

          {/* 시작하기 전에 */}
          <section className="flex flex-col gap-2.5" style={SECTION}>
            <h2 style={H2}>시작하기 전에</h2>
            <p>
              주최자로부터 QR 코드 또는 링크를 받으셨다면 준비 완료입니다. 별도의 앱 설치 없이
              폰 브라우저로 바로 진행됩니다.
            </p>
            <div className="flex flex-col gap-1">
              <h3 style={H3}>필요한 것</h3>
              <ul className="list-disc flex flex-col gap-1" style={LIST}>
                <li>주최자가 보낸 QR 또는 링크</li>
                <li>폰 브라우저: 안드로이드는 Chrome, 아이폰은 Safari 권장</li>
                <li>
                  카메라 권한 허용: 처음 카메라를 켤 때 브라우저가 권한을 묻습니다. "허용" 선택
                </li>
              </ul>
            </div>
            <p>전체 과정 약 1~2분. 익숙한 인스타그램 스토리 정도의 흐름입니다.</p>
            <div className="flex flex-col gap-1">
              <h3 style={H3}>개인정보</h3>
              <p>
                촬영한 영상은 행사 영상 편집에만 사용되며, 결과 알림 후 48시간 안에 자동 삭제됩니다. 완성본은 7일간 보관됩니다.
              </p>
            </div>
          </section>

          {/* STEP 01 */}
          <section className="flex flex-col gap-2.5" style={SECTION}>
            <span style={STEP_LABEL}>1단계</span>
            <h2 style={H2}>
              이름과 전화번호 입력
            </h2>
            <p>
              QR을 스캔하거나 링크를 누르면 이벤트 화면이 열립니다. 먼저 이름과 전화번호를 입력합니다.
            </p>
            <div className="flex flex-col gap-1">
              <h3 style={H3}>입력 항목</h3>
              <ul className="list-disc flex flex-col gap-1" style={LIST}>
                <li>
                  이름: 행사 안에서 알아볼 수 있는 이름 (최대 20자). 본명을 쓰지 않아도 됩니다.
                </li>
                <li>전화번호: 완성본이 나오면 문자(SMS)로 알림을 받습니다. 010-1234-5678 또는 01012345678 형식</li>
              </ul>
            </div>
            <p>이름과 전화번호를 넣은 뒤 개인정보 안내에 동의 체크를 해야 "다음"을 누를 수 있어요.</p>
            <div className="flex flex-col gap-1">
              <h3 style={H3}>같은 이름 + 번호는 한 번만</h3>
              <p>
                여러 개를 올리려면 이름을 다르게 (예: "서연 1", "서연 2") 입력하세요.
              </p>
            </div>
            <p style={SMALL}>
              익명으로 참여하고 싶다면 이름을 별명·이니셜로. 어떤 사이인지 함께 적으면 더 좋아요
              (예: "신부 친구 서연").
            </p>
          </section>

          {/* STEP 02 */}
          <section className="flex flex-col gap-2.5" style={SECTION}>
            <span style={STEP_LABEL}>2단계</span>
            <h2 style={H2}>촬영 시작</h2>
            <p>이름 입력 후 "다음"을 누르면 촬영 화면이 나옵니다.</p>
            <ul className="list-disc flex flex-col gap-1" style={LIST}>
              <li>"지금 촬영하기"를 탭하면 폰 카메라 앱이 열립니다.</li>
              <li>촬영을 마치면 자동으로 가이드 화면으로 돌아옵니다.</li>
            </ul>
            <div className="flex flex-col gap-1">
              <h3 style={H3}>카메라 권한</h3>
              <p>처음 촬영할 때 폰이 카메라 권한을 묻습니다. "허용" 선택.</p>
            </div>
            <div className="flex flex-col gap-1">
              <h3 style={H3}>촬영 시간</h3>
              <p>
                호스트가 정한 최대 시간이 있어요 (무료 10초, 유료 10~100초). 촬영 화면에서 "최대 N초"로 확인.
                그 시간을 넘으면 잘립니다.
              </p>
              <p>짧고 진심 어린 한마디가 더 좋은 영상이 됩니다.</p>
            </div>
            <div className="flex flex-col gap-1">
              <h3 style={H3}>갤러리에서 선택</h3>
              <p>
                이미 찍어둔 영상도 올릴 수 있어요. "지금 촬영하기" 아래의 "갤러리에서 선택"
                링크를 누르세요.
              </p>
            </div>
            <div className="flex flex-col gap-1">
              <h3 style={H3}>촬영이 끝나면</h3>
              <ul className="list-disc flex flex-col gap-1" style={LIST}>
                <li>재생 버튼으로 미리보기 확인</li>
                <li>마음에 들면 "업로드하기"</li>
                <li>다시 찍고 싶으면 "다시 촬영"</li>
              </ul>
            </div>
            <div className="flex flex-col gap-1">
              <h3 style={H3}>예시 멘트</h3>
              <ul className="list-disc flex flex-col gap-1" style={LIST}>
                <li>결혼식: "신랑·신부 둘 다 너무 예쁘다. 행복하게 살아!"</li>
                <li>돌잔치: "첫 생일 축하해! 건강하게만 자라 줘."</li>
                <li>졸업 파티: "오늘 졸업하니까 사실 좀 후련해. 친구들 다 잘 됐으면 좋겠다."</li>
              </ul>
            </div>
          </section>

          {/* 완료 & FAQ */}
          <section className="flex flex-col gap-2.5" style={SECTION}>
            <span style={STEP_LABEL}>3단계</span>
            <h2 style={H2}>
              완료, 그리고 자주 묻는 질문
            </h2>

            <div className="flex flex-col gap-1">
              <h3 style={H3}>업로드 완료</h3>
              <p>업로드가 끝나면 "전달됐어요!" 화면이 나타납니다. 여기서 끝입니다.</p>
            </div>
            <div className="flex flex-col gap-1">
              <h3 style={H3}>하나 더 올리고 싶다면</h3>
              <p>
                화면 하단 "하나 더 올리기" 클릭. 이때는 다른 이름으로 입력해야 합니다.
              </p>
            </div>
            <div className="flex flex-col gap-1">
              <h3 style={H3}>완성본은 언제?</h3>
              <p>
                행사 종료 후 주최자가 마감하면 자동 편집이 시작되고 통상 10분 이내에 완성됩니다. 완성본은 7일간 보관됩니다.
              </p>
            </div>

            <div className="flex flex-col gap-0.5">
              <h3 style={FAQ_Q}>
                Q. 잘못 올렸어요. 지울 수 있나요?
              </h3>
              <p>
                A. 직접 삭제는 불가. 주최자에게 부탁하면 영상에서 제외할 수 있습니다.
              </p>
            </div>
            <div className="flex flex-col gap-0.5">
              <h3 style={FAQ_Q}>
                Q. 익명으로 참여 가능한가요?
              </h3>
              <p>A. 네. 이름을 별명·이니셜로. 전화번호는 알림 용도로만 사용.</p>
            </div>
            <div className="flex flex-col gap-0.5">
              <h3 style={FAQ_Q}>Q. 내 영상이 어디로 가나요?</h3>
              <p>A. 행사 영상에 포함됩니다. 결과 알림 후 48시간이 지나면 개별 클립은 자동 삭제됩니다.</p>
            </div>
            <div className="flex flex-col gap-0.5">
              <h3 style={FAQ_Q}>
                Q. 다른 사람 얼굴이 나와도 되나요?
              </h3>
              <p>A. 가능하면 본인 위주로. 부득이하면 그분 동의 권장.</p>
            </div>
            <div className="flex flex-col gap-0.5">
              <h3 style={FAQ_Q}>Q. 카메라가 안 켜져요</h3>
              <p>
                A. 브라우저 설정에서 사이트 권한 &gt; 카메라 &gt; 허용으로 변경 후 새로고침.
              </p>
            </div>
          </section>

          <section className="flex flex-col gap-1" style={SECTION}>
            <p style={SMALL}>
              문의: 카카오톡 채널 @congre. 촬영·업로드 중 문제가 생기면 채널로 연락 주세요.
            </p>
            <Link
              href="/guide"
              className="inline-flex items-center self-start hover:brightness-110 transition-all"
              style={{ minHeight: 44, fontSize: 15, color: "var(--accent)" }}
            >
              ← 가이드로
            </Link>
          </section>
        </main>
      </div>
    </>
  );
}
