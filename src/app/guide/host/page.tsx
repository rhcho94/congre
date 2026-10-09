import Link from "next/link";
import type { CSSProperties } from "react";
import { BrandName } from "@/components/BrandName";
import { LANDING_URL } from "@/lib/constants";
import PageBackdrop from "@/components/PageBackdrop";

// 섹션마다 위 1px 선으로 구분 (큰 상자 없음)
const SECTION: CSSProperties = { borderTop: "1px solid var(--line)", padding: "18px 0" };
const STEP_LABEL: CSSProperties = { fontSize: 14, color: "var(--pen-red)" };
const H2: CSSProperties = { fontSize: 20, lineHeight: 1.35, color: "var(--accent)" };
const H3: CSSProperties = { fontSize: 17, color: "var(--text)" };
const LIST: CSSProperties = { paddingLeft: 18, fontSize: 15, lineHeight: 1.55 };
const SMALL: CSSProperties = { fontSize: 13, lineHeight: 1.55, color: "var(--muted)" };
const FAQ_Q: CSSProperties = { fontSize: 16, color: "var(--text)" };

export default function GuideHostPage() {
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
            <h1 className="display" style={{ fontSize: 28, lineHeight: 1.3 }}>호스트 가이드</h1>
            <p className="text-muted" style={{ fontSize: 15 }}>이벤트 만들기부터 완성본 공유까지, 여섯 단계</p>
          </div>

          {/* 시작하기 전에 */}
          <section className="flex flex-col gap-2.5" style={SECTION}>
            <h2 style={H2}>시작하기 전에</h2>
            <p>
              Congre 호스트 가이드에 오신 것을 환영합니다. 이 문서는 행사 주최자가 Congre로 이벤트를
              만들고, 참가자 영상을 모으고, 완성본을 받기까지의 여섯 단계를 안내합니다.
            </p>
            <div className="flex flex-col gap-1">
              <h3 style={H3}>필요한 것</h3>
              <ul className="list-disc flex flex-col gap-1" style={LIST}>
                <li>이메일 주소와 휴대폰 번호: 가입과 결과 알림용</li>
                <li>행사 기본 정보: 행사명, 행사 날짜</li>
                <li>
                  참가자에게 공유할 수단: 단톡방, 인쇄용 QR 게시판, 문자 메시지 중 무엇이든 가능
                </li>
              </ul>
            </div>
            <p>가입과 이벤트 만들기까지 약 5분. 마감 후 영상 완성까지 통상 10분 이내.</p>
            <p>가입 시 이용약관·개인정보처리방침 동의가 필요합니다.</p>
          </section>

          {/* STEP 01 */}
          <section className="flex flex-col gap-2.5" style={SECTION}>
            <span style={STEP_LABEL}>1단계</span>
            <h2 style={H2}>가입하고 로그인하기</h2>
            <p>Congre는 호스트가 직접 가입합니다. app.congre.kr에 들어가면 바로 로그인 화면이 열리고, 아래 "회원가입"으로 가입합니다.</p>
            <div className="flex flex-col gap-1">
              <h3 style={H3}>가입 입력</h3>
              <ul className="list-disc flex flex-col gap-1" style={LIST}>
                <li>이메일, 비밀번호 (최소 6자)</li>
                <li>이름과 휴대폰 번호 (010으로 시작하는 11자리)</li>
                <li>이용약관, 개인정보처리방침 동의</li>
              </ul>
            </div>
            <div className="flex flex-col gap-1">
              <h3 style={H3}>이메일 인증</h3>
              <ul className="list-disc flex flex-col gap-1" style={LIST}>
                <li>가입 직후 인증 메일이 발송됩니다. 메일 안 "인증" 링크를 클릭하면 완료.</li>
                <li>인증 완료 전까지 이벤트 생성은 차단되며, 대시보드 상단 안내 배너에서 "인증 메일 재발송" 가능.</li>
              </ul>
            </div>
            <p style={SMALL}>
              비밀번호를 잊으셨다면 로그인 화면 "비밀번호를 잊으셨나요?" 클릭 → 등록 이메일로 재설정 링크 발송.
            </p>
          </section>

          {/* STEP 02 */}
          <section className="flex flex-col gap-2.5" style={SECTION}>
            <span style={STEP_LABEL}>2단계</span>
            <h2 style={H2}>새 이벤트 만들기</h2>
            <p>대시보드 우측 상단 "+ 새 이벤트" 버튼을 누르면 이벤트 생성 폼이 열립니다.</p>
            <div className="flex flex-col gap-1">
              <h3 style={H3}>입력 항목</h3>
              <ul className="list-disc flex flex-col gap-1" style={LIST}>
                <li>이벤트 이름: 행사명 (예: "지은과 민호의 결혼식")</li>
                <li>이벤트 날짜: 행사 당일</li>
                <li>플랜: 무료 5클립까지 / 그 이상은 사용한 만큼(클립 수·길이) 비용 발생</li>
                <li>클립 길이: 참가자가 올릴 수 있는 영상 최대 길이</li>
              </ul>
            </div>
            <div className="flex flex-col gap-1">
              <h3 style={H3}>클립 길이와 개수: 플랜별 한도</h3>
              <ul className="list-disc flex flex-col gap-1" style={LIST}>
                <li>무료 플랜은 클립 5개, 길이 10초로 고정</li>
                <li>유료 플랜은 길이 10초부터 100초까지 5초 단위로 선택</li>
                <li>유료 플랜은 개수(정원)를 10개부터 200개까지 선택</li>
              </ul>
            </div>
            <p style={SMALL}>
              정원은 넉넉히 잡아도 됩니다. 결제는 마감 때 실제로 올라온 영상 수로 계산합니다 (최소 10,000원).
            </p>
          </section>

          {/* STEP 03 */}
          <section className="flex flex-col gap-2.5" style={SECTION}>
            <span style={STEP_LABEL}>3단계</span>
            <h2 style={H2}>참가자에게 공유</h2>
            <p>
              이벤트가 만들어지면 QR 코드와 공유 링크가 즉시 발급됩니다. 참가자는 별도 앱 설치
              없이 폰 브라우저로 바로 접속합니다.
            </p>
            <div className="flex flex-col gap-1">
              <h3 style={H3}>두 가지 공유 방법</h3>
              <ul className="list-disc flex flex-col gap-1" style={LIST}>
                <li>QR 이미지 저장: 인쇄해서 행사장 입구·테이블·게시판에 부착</li>
                <li>링크 복사: 단톡방·카톡·문자로 전달</li>
              </ul>
            </div>
            <div className="flex flex-col gap-1">
              <h3 style={H3}>인트로 / 아웃트로 (선택)</h3>
              <p>
                "영상 꾸미기"에서 텍스트 최대 60자와 이미지·영상을 추가할 수 있습니다.
                비워두면 참가자 영상만으로 완성본이 만들어집니다.
              </p>
              <p style={SMALL}>
                예시: 시작 "결혼식이 시작됩니다" / 마무리 "함께해 주셔서 감사합니다"
              </p>
            </div>
          </section>

          {/* STEP 04 */}
          <section className="flex flex-col gap-2.5" style={SECTION}>
            <span style={STEP_LABEL}>4단계</span>
            <h2 style={H2}>마감과 결제</h2>
            <p>
              행사가 끝나면 이벤트 화면 맨 아래의 "마감하기" 버튼을 누릅니다. 마감 즉시 신규
              업로드가 차단됩니다.
            </p>
            <div className="flex flex-col gap-1">
              <h3 style={H3}>무료와 유료의 차이</h3>
              <ul className="list-disc flex flex-col gap-1" style={LIST}>
                <li>무료: 마감 즉시 자동 편집이 시작됩니다.</li>
                <li>
                  유료: 마감하면 결제 화면으로 넘어가고, 결제가 끝나면 자동 편집이 시작됩니다. 금액은
                  마감 시점에 올라온 영상 수로 계산합니다.
                </li>
              </ul>
            </div>
            <div className="flex flex-col gap-1">
              <h3 style={H3}>마감 전 확인할 것</h3>
              <ul className="list-disc flex flex-col gap-1" style={LIST}>
                <li>업로드된 클립 목록: 순번과 참가자 이름으로 식별</li>
                <li>각 클립 미리보기: 재생 버튼으로 영상 확인</li>
                <li>원치 않는 클립 제외: 토글로 영상 포함 여부 선택</li>
              </ul>
            </div>
            <p>
              행사 종료 직후가 표준. 지각 참가자가 있다면 30분 정도 여유.
            </p>
            <div className="flex flex-col gap-1">
              <h3 style={H3}>자동 알림</h3>
              <p>편집이 시작되면 "렌더 시작" 이메일과 문자가 자동 발송됩니다. 진행 상황을 별도로 확인하지 않으셔도 됩니다.</p>
            </div>
            <p>자동 편집은 시작 후 통상 10분 이내에 완성됩니다.</p>
          </section>

          {/* STEP 05 */}
          <section className="flex flex-col gap-2.5" style={SECTION}>
            <span style={STEP_LABEL}>5단계</span>
            <h2 style={H2}>완성본 받기와 공유</h2>
            <p>
              자동 편집이 완료되면 등록한 이메일과 휴대폰으로 알림이 도착합니다. 지연·실패 시에도 상태 알림이 자동 발송됩니다.
            </p>
            <div className="flex flex-col gap-1">
              <h3 style={H3}>공유 옵션</h3>
              <ul className="list-disc flex flex-col gap-1" style={LIST}>
                <li>영상 다운로드: MP4 파일로 폰·PC에 저장. 가장 안정적인 보관.</li>
                <li>카카오톡: 단톡방에 바로 전달</li>
                <li>링크 복사: SNS·블로그·이메일 어디든</li>
              </ul>
            </div>
            <div className="flex flex-col gap-1">
              <h3 style={H3}>재렌더</h3>
              <p>
                완성본이 마음에 들지 않으면 클립을 다시 골라 영상을 새로 만들 수 있습니다. 유료 이벤트는
                처음 결제 금액의 80%를 다시 결제합니다. 참가자 영상 보관 기간(48시간)이 지나면 다시 만들 수
                없습니다.
              </p>
            </div>
            <div className="flex flex-col gap-1">
              <h3 style={H3}>자동 삭제: 보관 기한</h3>
              <p>개별 클립은 결과 알림 후 48시간, 완성 영상은 7일 후 자동 삭제됩니다. 다운로드해 보관해 주세요.</p>
            </div>
          </section>

          {/* STEP 06 */}
          <section className="flex flex-col gap-2.5" style={SECTION}>
            <span style={STEP_LABEL}>6단계</span>
            <h2 style={H2}>내 계정 관리</h2>
            <p>대시보드 상단 "마이페이지" 링크에서 본인 계정을 관리할 수 있습니다.</p>
            <div className="flex flex-col gap-1">
              <h3 style={H3}>마이페이지 4가지 영역</h3>
              <ul className="list-disc flex flex-col gap-1" style={LIST}>
                <li>이벤트 요약: 진행 중과 완료된 이벤트 수를 한눈에</li>
                <li>프로필: 이름과 전화번호 수정</li>
                <li>비밀번호 변경: 현재 비밀번호 + 신규 비밀번호 입력</li>
                <li>회원 탈퇴: 비밀번호 재인증 후 모든 데이터 즉시 삭제</li>
              </ul>
            </div>
            <div className="flex flex-col gap-1">
              <h3 style={H3}>주의: 회원 탈퇴</h3>
              <p>
                진행 중(수집 중, 편집 중)인 이벤트가 있으면 탈퇴할 수 없습니다. 모든 이벤트를 마감한 뒤
                탈퇴해 주세요. 탈퇴하면 완성본도 함께 삭제되니, 보관할 영상은 사전에 다운로드해 주세요.
              </p>
            </div>
          </section>

          {/* FAQ */}
          <section className="flex flex-col gap-2.5" style={SECTION}>
            <h2 style={H2}>자주 묻는 질문</h2>

            <div className="flex flex-col gap-2.5">
              <div className="flex flex-col gap-0.5">
                <h3 style={FAQ_Q}>
                  Q. 예상 시간이 지났는데 완성본이 안 와요
                </h3>
                <p>
                  A. 카카오톡 채널 @congre 로 이벤트명을 알려주세요. 진행 상태를 확인해 드립니다.
                </p>
              </div>
              <div className="flex flex-col gap-0.5">
                <h3 style={FAQ_Q}>
                  Q. 참가자가 업로드를 못 한다고 해요
                </h3>
                <p>
                  A. 폰 브라우저에서 카메라 권한이 허용되어 있는지 먼저 확인 부탁드립니다. 그래도
                  안 되면 채널로 문의 주세요.
                </p>
              </div>
              <div className="flex flex-col gap-0.5">
                <h3 style={FAQ_Q}>
                  Q. 영상은 며칠까지 받을 수 있나요?
                </h3>
                <p>A. 개별 클립 48시간, 완성본 7일 후 자동 삭제됩니다. 다운로드해 보관해 주세요.</p>
              </div>
              <div className="flex flex-col gap-0.5">
                <h3 style={FAQ_Q}>
                  Q. 미성년자가 포함된 영상은 어떻게 하나요?
                </h3>
                <p>
                  A. 학교·기관 행사라면 사전에 학부모 동의를 받는 것을 권장합니다. 개인정보 보호
                  측면에서 신중한 검토가 필요한 영역입니다.
                </p>
              </div>
              <div className="flex flex-col gap-0.5">
                <h3 style={FAQ_Q}>
                  Q. 클립을 잘못 골라서 영상에 포함시켰어요
                </h3>
                <p>
                  A. 재렌더 기능을 사용하세요. 클립 토글로 제외한 뒤 영상을 다시 만들 수 있습니다.
                </p>
              </div>
              <div className="flex flex-col gap-0.5">
                <h3 style={FAQ_Q}>
                  Q. 한 행사에 영상을 여러 편 만들 수 있나요?
                </h3>
                <p>
                  A. 한 이벤트는 한 번에 한 편의 완성본을 만듭니다(다시 만들면 새 완성본으로 바뀌고, 이전 완성본은 7일간 내려받을 수 있어요). 신랑 측과 신부 측처럼 나누고 싶다면 각각
                  별도의 이벤트로 만드세요.
                </p>
              </div>
            </div>
          </section>

          <section className="flex flex-col gap-1" style={SECTION}>
            <p style={SMALL}>
              문의: 카카오톡 채널 @congre, 전화 010-5891-7583 (도입·운영 문의 모두)
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
