import Link from "next/link";
import { BrandName } from "@/components/BrandName";

export default function GuideGuestPage() {
  return (
    <div className="min-h-screen bg-background">
      <nav className="flex items-center justify-between px-8 py-6 border-b border-border">
        <Link
          href="/"
          className="text-xl tracking-wider hover:opacity-75 transition-opacity duration-200"
        >
          <BrandName />
        </Link>
        <Link
          href="/guide"
          className="text-xs tracking-widest uppercase text-muted hover:text-accent transition-colors duration-200"
        >
          ← 가이드
        </Link>
      </nav>

      <main className="mx-auto max-w-3xl px-6 py-16">
        <div className="mb-10">
          <p className="text-xs tracking-[0.4em] uppercase text-accent mb-3">GUEST GUIDE</p>
          <h1
            className="text-3xl italic text-foreground"
            style={{ fontFamily: "var(--font-display, serif)" }}
          >
            참가자 가이드
          </h1>
          <p className="text-sm text-muted mt-3">QR 한 번이면 끝 — 앱 설치 없이 세 단계</p>
        </div>

        <div className="rule mb-10" />

        <div className="flex flex-col gap-14 text-sm leading-relaxed text-muted">

          {/* 시작하기 전에 */}
          <section className="flex flex-col gap-4">
            <h2 className="text-base font-medium text-foreground tracking-wide">시작하기 전에</h2>
            <p>
              주최자로부터 QR 코드 또는 링크를 받으셨다면 준비 완료입니다. 별도의 앱 설치 없이
              폰 브라우저로 바로 진행됩니다.
            </p>
            <div className="flex flex-col gap-2">
              <p className="text-sm font-medium text-foreground">필요한 것</p>
              <ul className="list-disc pl-5 flex flex-col gap-1">
                <li>주최자가 보낸 QR 또는 링크</li>
                <li>폰 브라우저 — 안드로이드는 Chrome, 아이폰은 Safari 권장</li>
                <li>
                  카메라 권한 허용 — 처음 카메라를 켤 때 브라우저가 권한을 묻습니다. "허용" 선택
                </li>
              </ul>
            </div>
            <p>전체 과정 약 1~2분. 익숙한 인스타그램 스토리 정도의 흐름입니다.</p>
            <div className="flex flex-col gap-2">
              <p className="text-sm font-medium text-foreground">개인정보</p>
              <p>
                촬영한 영상은 행사 영상 편집에만 사용되고, 완성본이 만들어진 직후 자동 삭제됩니다.
                인터넷에 영구 보존되지 않습니다.
              </p>
            </div>
          </section>

          <div className="rule" />

          {/* STEP 01 */}
          <section className="flex flex-col gap-4">
            <span className="text-xs tracking-[0.4em] uppercase text-accent">STEP 01</span>
            <h2 className="text-base font-medium text-foreground tracking-wide">
              이름과 전화번호 입력
            </h2>
            <p>
              QR을 스캔하거나 링크를 누르면 이벤트 화면이 열립니다. 먼저 이름과 전화번호를 입력합니다.
            </p>
            <div className="flex flex-col gap-2">
              <p className="text-sm font-medium text-foreground">입력 항목</p>
              <ul className="list-disc pl-5 flex flex-col gap-1">
                <li>
                  이름 — 행사 안에서 알아볼 수 있는 이름 (최대 20자). 본명을 쓰지 않아도 됩니다.
                </li>
                <li>전화번호 — 결과 영상 알림용. 010-1234-5678 또는 01012345678 형식</li>
              </ul>
            </div>
            <div className="flex flex-col gap-1">
              <p className="text-sm font-medium text-foreground">같은 이름 + 번호는 한 번만</p>
              <p>
                여러 개를 올리려면 이름을 다르게 (예: "민준 1", "민준 2") 입력하세요.
              </p>
            </div>
            <p className="text-xs opacity-70">
              익명으로 참여하고 싶다면 이름을 별명·이니셜로. 단체 행사에서는 소속 표기 함께
              (예: "3학년 7반 민준").
            </p>
          </section>

          {/* STEP 02 */}
          <section className="flex flex-col gap-4">
            <span className="text-xs tracking-[0.4em] uppercase text-accent">STEP 02</span>
            <h2 className="text-base font-medium text-foreground tracking-wide">촬영 시작</h2>
            <p>이름 입력 후 "다음"을 누르면 촬영 화면이 나옵니다.</p>
            <ul className="list-disc pl-5 flex flex-col gap-1">
              <li>"지금 촬영하기"를 탭하면 폰 카메라 앱이 열립니다.</li>
              <li>촬영을 마치면 자동으로 가이드 화면으로 돌아옵니다.</li>
            </ul>
            <div className="flex flex-col gap-1">
              <p className="text-sm font-medium text-foreground">카메라 권한</p>
              <p>처음 촬영할 때 폰이 카메라 권한을 묻습니다. "허용" 선택.</p>
            </div>
            <div className="flex flex-col gap-1">
              <p className="text-sm font-medium text-foreground">촬영 시간</p>
              <p>
                호스트가 정한 최대 시간이 있어요 (5~30초). 촬영 화면에서 "최대 N초"로 확인.
                그 시간을 넘으면 잘립니다.
              </p>
              <p>짧고 진심 어린 한마디가 더 좋은 영상이 됩니다.</p>
            </div>
            <div className="flex flex-col gap-1">
              <p className="text-sm font-medium text-foreground">갤러리에서 선택</p>
              <p>
                이미 찍어둔 영상도 올릴 수 있어요. "지금 촬영하기" 아래의 "갤러리에서 선택"
                링크를 누르세요.
              </p>
            </div>
            <div className="flex flex-col gap-2">
              <p className="text-sm font-medium text-foreground">촬영이 끝나면</p>
              <ul className="list-disc pl-5 flex flex-col gap-1">
                <li>재생 버튼으로 미리보기 확인</li>
                <li>마음에 들면 "업로드하기"</li>
                <li>다시 찍고 싶으면 "다시 촬영"</li>
              </ul>
            </div>
            <div className="flex flex-col gap-2">
              <p className="text-sm font-medium text-foreground">예시 멘트</p>
              <ul className="list-disc pl-5 flex flex-col gap-1 text-xs opacity-70">
                <li>졸업식: "오늘 졸업하니까 사실 좀 후련해. 친구들 다 잘 됐으면 좋겠다."</li>
                <li>결혼식: "신랑·신부 둘 다 너무 예쁘다. 행복하게 살아!"</li>
                <li>기업 행사: "이번 분기 다들 진짜 고생했어요."</li>
              </ul>
            </div>
          </section>

          <div className="rule" />

          {/* 완료 & FAQ */}
          <section className="flex flex-col gap-6">
            <span className="text-xs tracking-[0.4em] uppercase text-accent">DONE &amp; FAQ</span>
            <h2 className="text-base font-medium text-foreground tracking-wide">
              완료, 그리고 자주 묻는 질문
            </h2>

            <div className="flex flex-col gap-3">
              <div className="flex flex-col gap-1">
                <p className="text-sm font-medium text-foreground">업로드 완료</p>
                <p>업로드가 끝나면 "전달됐어요!" 화면이 나타납니다. 여기서 끝입니다.</p>
              </div>
              <div className="flex flex-col gap-1">
                <p className="text-sm font-medium text-foreground">하나 더 올리고 싶다면</p>
                <p>
                  화면 하단 "하나 더 올리기" 클릭. 이때는 다른 이름으로 입력해야 합니다.
                </p>
              </div>
              <div className="flex flex-col gap-1">
                <p className="text-sm font-medium text-foreground">완성본은 언제?</p>
                <p>
                  행사 종료 후 주최자가 마감하면 자동 편집이 시작되고 약 5분 내외로 완성됩니다.
                </p>
              </div>
            </div>

            <div className="rule" />

            <div className="flex flex-col gap-5">
              <div className="flex flex-col gap-1">
                <p className="text-sm font-medium text-foreground">
                  Q. 잘못 올렸어요. 지울 수 있나요?
                </p>
                <p>
                  A. 직접 삭제는 불가. 주최자에게 부탁하면 영상에서 제외할 수 있습니다.
                </p>
              </div>
              <div className="flex flex-col gap-1">
                <p className="text-sm font-medium text-foreground">
                  Q. 익명으로 참여 가능한가요?
                </p>
                <p>A. 네. 이름을 별명·이니셜로. 전화번호는 알림 용도로만 사용.</p>
              </div>
              <div className="flex flex-col gap-1">
                <p className="text-sm font-medium text-foreground">Q. 내 영상이 어디로 가나요?</p>
                <p>A. 행사 영상에 포함됩니다. 렌더링 직후 개별 클립은 자동 삭제.</p>
              </div>
              <div className="flex flex-col gap-1">
                <p className="text-sm font-medium text-foreground">
                  Q. 다른 사람 얼굴이 나와도 되나요?
                </p>
                <p>A. 가능하면 본인 위주로. 부득이하면 그분 동의 권장.</p>
              </div>
              <div className="flex flex-col gap-1">
                <p className="text-sm font-medium text-foreground">Q. 카메라가 안 켜져요</p>
                <p>
                  A. 브라우저 설정에서 사이트 권한 — 카메라 — 허용으로 변경 후 새로고침.
                </p>
              </div>
            </div>
          </section>

        </div>

        <div className="rule mt-14 mb-10" />

        <div className="flex flex-col gap-3">
          <p className="text-xs text-muted leading-relaxed">
            문의 — 카카오톡 채널 @congre · 촬영·업로드 중 문제가 생기면 채널로 연락 주세요.
          </p>
          <Link
            href="/guide"
            className="text-xs text-muted hover:text-accent tracking-widest uppercase transition-colors duration-200"
          >
            ← 가이드로
          </Link>
        </div>
      </main>
    </div>
  );
}
