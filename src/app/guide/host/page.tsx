import Link from "next/link";
import { BrandName } from "@/components/BrandName";

export default function GuideHostPage() {
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
          <p className="text-xs tracking-[0.4em] uppercase text-accent mb-3">HOST GUIDE</p>
          <h1
            className="text-3xl italic text-foreground"
            style={{ fontFamily: "var(--font-display, serif)" }}
          >
            호스트 가이드
          </h1>
          <p className="text-sm text-muted mt-3">이벤트 만들기부터 완성본 공유까지 — 다섯 단계</p>
        </div>

        <div className="rule mb-10" />

        <div className="flex flex-col gap-14 text-sm leading-relaxed text-muted">

          {/* 시작하기 전에 */}
          <section className="flex flex-col gap-4">
            <h2 className="text-base font-medium text-foreground tracking-wide">시작하기 전에</h2>
            <p>
              Congre 호스트 가이드에 오신 것을 환영합니다. 이 문서는 행사 주최자가 Congre로 이벤트를
              만들고, 참가자 영상을 모으고, 완성본을 받기까지의 다섯 단계를 안내합니다.
            </p>
            <div className="flex flex-col gap-2">
              <p className="text-sm font-medium text-foreground">필요한 것</p>
              <ul className="list-disc pl-5 flex flex-col gap-1">
                <li>
                  호스트 계정 — 현재는 운영자가 수동으로 발급합니다. 카카오톡 채널 @congre 로
                  문의해 주세요. 이메일과 임시 비밀번호를 전달드립니다.
                </li>
                <li>행사 기본 정보 — 행사명, 행사 날짜</li>
                <li>알림 받을 연락처 — 이메일 주소, 휴대폰 번호 (완성본·진행 상태 알림용)</li>
                <li>
                  참가자에게 공유할 수단 — 단톡방, 인쇄용 QR 게시판, 문자 메시지 중 무엇이든 가능
                </li>
              </ul>
            </div>
            <p>이벤트 만들기까지 약 2분. 마감 후 영상 완성까지 5분 내외.</p>
          </section>

          <div className="rule" />

          {/* STEP 01 */}
          <section className="flex flex-col gap-4">
            <span className="text-xs tracking-[0.4em] uppercase text-accent">STEP 01</span>
            <h2 className="text-base font-medium text-foreground tracking-wide">로그인</h2>
            <p>운영자로부터 받은 이메일과 임시 비밀번호로 접속합니다.</p>
            <ul className="list-disc pl-5 flex flex-col gap-1">
              <li>브라우저에서 congre-three.vercel.app 접속</li>
              <li>우측 상단 "주최자 로그인" 클릭</li>
              <li>이메일과 비밀번호 입력 후 "로그인"</li>
            </ul>
            <p className="text-xs opacity-70">
              첫 로그인 후 비밀번호 변경 권장. 비밀번호를 잊으셨다면 로그인 화면 하단의
              "비밀번호를 잊으셨나요?" 클릭 후 등록된 이메일로 재설정 링크가 전송됩니다.
            </p>
          </section>

          {/* STEP 02 */}
          <section className="flex flex-col gap-4">
            <span className="text-xs tracking-[0.4em] uppercase text-accent">STEP 02</span>
            <h2 className="text-base font-medium text-foreground tracking-wide">새 이벤트 만들기</h2>
            <p>대시보드 우측 상단 "+ 새 이벤트" 버튼을 누르면 이벤트 생성 폼이 열립니다.</p>
            <div className="flex flex-col gap-2">
              <p className="text-sm font-medium text-foreground">입력 항목</p>
              <ul className="list-disc pl-5 flex flex-col gap-1">
                <li>이벤트 이름 — 행사명 (예: "졸업식 2026")</li>
                <li>이벤트 날짜 — 행사 당일</li>
                <li>플랜 — 무료 10클립 / 소형 50 / 중형 200 / 대형 무제한</li>
                <li>클립 길이 — 참가자가 올릴 수 있는 영상 최대 길이. 5~30초 사이 선택 (기본 15초).</li>
                <li>알림 수신 정보 — 이메일과 휴대폰. 완성 시 두 채널로 알림.</li>
              </ul>
            </div>
            <p className="text-xs opacity-70">
              플랜은 생성 후 변경 불가. 인원이 애매하면 한 단계 위로. 알림 받을 연락처는
              로그인 계정과 달라도 됩니다.
            </p>
          </section>

          {/* STEP 03 */}
          <section className="flex flex-col gap-4">
            <span className="text-xs tracking-[0.4em] uppercase text-accent">STEP 03</span>
            <h2 className="text-base font-medium text-foreground tracking-wide">참가자에게 공유</h2>
            <p>
              이벤트가 만들어지면 QR 코드와 공유 링크가 즉시 발급됩니다. 참가자는 별도 앱 설치
              없이 폰 브라우저로 바로 접속합니다.
            </p>
            <div className="flex flex-col gap-2">
              <p className="text-sm font-medium text-foreground">두 가지 공유 방법</p>
              <ul className="list-disc pl-5 flex flex-col gap-1">
                <li>QR 이미지 저장 — 인쇄해서 행사장 입구·테이블·게시판에 부착</li>
                <li>링크 복사 — 단톡방·카톡·문자로 전달</li>
              </ul>
            </div>
            <div className="flex flex-col gap-2">
              <p className="text-sm font-medium text-foreground">인트로 / 아웃트로 (선택)</p>
              <p>
                "영상 시작·끝 꾸미기"에서 텍스트 최대 60자와 이미지·영상을 추가할 수 있습니다.
                비워두면 참가자 영상만으로 완성본이 만들어집니다.
              </p>
              <p className="text-xs opacity-70">
                예시: 시작 "결혼식이 시작됩니다" / 마무리 "함께해 주셔서 감사합니다"
              </p>
            </div>
          </section>

          {/* STEP 04 */}
          <section className="flex flex-col gap-4">
            <span className="text-xs tracking-[0.4em] uppercase text-accent">STEP 04</span>
            <h2 className="text-base font-medium text-foreground tracking-wide">마감과 클립 확인</h2>
            <p>
              행사가 끝나면 대시보드 우측의 빨간 "마감하기" 버튼을 누릅니다. 마감 즉시 신규
              업로드가 차단되고 자동 편집이 시작됩니다.
            </p>
            <div className="flex flex-col gap-2">
              <p className="text-sm font-medium text-foreground">마감 전 확인할 것</p>
              <ul className="list-disc pl-5 flex flex-col gap-1">
                <li>업로드된 클립 목록 — 닉네임과 업로드 시각으로 식별</li>
                <li>각 클립 미리보기 — 재생 버튼으로 영상 확인</li>
                <li>원치 않는 클립 제외 — 토글로 영상 포함 여부 선택</li>
              </ul>
            </div>
            <p>
              행사 종료 직후가 표준. 지각 참가자가 있다면 30분 정도 여유.
            </p>
            <p>자동 편집은 마감 즉시 시작되며 약 5분 내외로 완성됩니다.</p>
          </section>

          {/* STEP 05 */}
          <section className="flex flex-col gap-4">
            <span className="text-xs tracking-[0.4em] uppercase text-accent">STEP 05</span>
            <h2 className="text-base font-medium text-foreground tracking-wide">완성본 받기와 공유</h2>
            <p>
              자동 편집이 완료되면 등록한 이메일과 휴대폰으로 알림이 도착합니다. 대시보드에서
              직접 영상을 미리보고 공유할 수 있습니다.
            </p>
            <div className="flex flex-col gap-2">
              <p className="text-sm font-medium text-foreground">공유 옵션</p>
              <ul className="list-disc pl-5 flex flex-col gap-1">
                <li>영상 다운로드 — MP4 파일로 폰·PC에 저장. 가장 안정적인 보관.</li>
                <li>카카오톡 — 단톡방에 바로 전달</li>
                <li>링크 복사 — SNS·블로그·이메일 어디든</li>
              </ul>
            </div>
            <div className="flex flex-col gap-2">
              <p className="text-sm font-medium text-foreground">재렌더</p>
              <p>
                완성본이 마음에 들지 않으면 클립을 다시 골라 영상을 새로 만들 수 있습니다.
              </p>
            </div>
            <p className="text-xs opacity-70">
              개별 클립은 렌더링 직후, 완성 영상은 며칠 내 자동 삭제됩니다. 다운로드 보관 권장.
            </p>
          </section>

          <div className="rule" />

          {/* FAQ */}
          <section className="flex flex-col gap-6">
            <span className="text-xs tracking-[0.4em] uppercase text-accent">FAQ</span>
            <h2 className="text-base font-medium text-foreground tracking-wide">자주 묻는 질문</h2>

            <div className="flex flex-col gap-5">
              <div className="flex flex-col gap-1">
                <p className="text-sm font-medium text-foreground">
                  Q. 예상 시간이 지났는데 완성본이 안 와요
                </p>
                <p>
                  A. 카카오톡 채널 @congre 로 이벤트명을 알려주세요. 진행 상태를 확인해 드립니다.
                </p>
              </div>
              <div className="flex flex-col gap-1">
                <p className="text-sm font-medium text-foreground">
                  Q. 참가자가 업로드를 못 한다고 해요
                </p>
                <p>
                  A. 폰 브라우저에서 카메라 권한이 허용되어 있는지 먼저 확인 부탁드립니다. 그래도
                  안 되면 채널로 문의 주세요.
                </p>
              </div>
              <div className="flex flex-col gap-1">
                <p className="text-sm font-medium text-foreground">
                  Q. 영상은 며칠까지 받을 수 있나요?
                </p>
                <p>A. 완성본은 며칠 내 자동 삭제됩니다. 다운로드해 보관해 주세요.</p>
              </div>
              <div className="flex flex-col gap-1">
                <p className="text-sm font-medium text-foreground">
                  Q. 미성년자가 포함된 영상은 어떻게 하나요?
                </p>
                <p>
                  A. 학교·기관 행사라면 사전에 학부모 동의를 받는 것을 권장합니다. 개인정보 보호
                  측면에서 신중한 검토가 필요한 영역입니다.
                </p>
              </div>
              <div className="flex flex-col gap-1">
                <p className="text-sm font-medium text-foreground">
                  Q. 클립을 잘못 골라서 영상에 포함시켰어요
                </p>
                <p>
                  A. 재렌더 기능을 사용하세요. 클립 토글로 제외한 뒤 영상을 다시 만들 수 있습니다.
                </p>
              </div>
              <div className="flex flex-col gap-1">
                <p className="text-sm font-medium text-foreground">
                  Q. 한 행사에 영상을 여러 편 만들 수 있나요?
                </p>
                <p>
                  A. 한 이벤트는 한 편의 완성본을 만듭니다. 학급별·테이블별로 나누고 싶다면 각각
                  별도의 이벤트로 만드세요.
                </p>
              </div>
            </div>
          </section>

        </div>

        <div className="rule mt-14 mb-10" />

        <div className="flex flex-col gap-3">
          <p className="text-xs text-muted leading-relaxed">
            문의 — 카카오톡 채널 @congre (도입·운영 문의 모두. 전화는 발신만, 수신 없음)
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
