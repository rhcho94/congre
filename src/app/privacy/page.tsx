import { BrandName } from "@/components/BrandName";
import { LANDING_URL } from "@/lib/constants";
import PageBackdrop from "@/components/PageBackdrop";

export default function PrivacyPage() {
  return (
    <>
      <PageBackdrop pattern="d" />
      <div className="min-h-screen">
        <nav className="flex items-center justify-between px-8 py-6">
          <a href={LANDING_URL} className="text-xl tracking-wider hover:opacity-75 transition-opacity duration-200">
            <BrandName />
          </a>
          <a href={LANDING_URL} className="btn-quiet text-xs tracking-widest uppercase">
            ← 홈
          </a>
        </nav>

        <main className="mx-auto max-w-3xl px-6 py-16">
          <div className="mb-10">
            <p className="eyebrow mb-3">Legal</p>
            <h1 className="display text-3xl">Congre 개인정보처리방침</h1>
            <p className="text-xs text-muted mt-3">시행일: 2026년 9월 1일</p>
          </div>

          <div className="hr mb-10" />

          <div className="glass-panel flex flex-col gap-12 text-sm leading-relaxed text-muted">
          <section className="flex flex-col gap-2">
            <p>
              Congre(이하 "회사"라 함)는 「개인정보 보호법」 제30조에 따라 정보주체의 개인정보를 보호하고 이와 관련한 고충을 신속하고 원활하게 처리할 수 있도록 다음과 같이 개인정보 처리방침을 수립·공개합니다.
            </p>
          </section>

          <section className="flex flex-col gap-2">
            <h2 className="text-sm font-medium text-foreground">제1조 (개인정보의 처리 목적)</h2>
            <p>
              회사는 다음의 목적을 위하여 최소한의 개인정보를 수집·이용합니다. 처리하고 있는 개인정보는 다음의 목적 외의 용도로는 이용되지 않으며, 이용 목적이 변경되는 경우에는 「개인정보 보호법」 제18조에 따라 별도의 동의를 받는 등 필요한 조치를 이행할 예정입니다.
            </p>
            <ol className="list-decimal pl-6 flex flex-col gap-1">
              <li><strong className="text-foreground">호스트 회원 가입 및 관리</strong>: 본인 식별·인증, 회원자격 유지·관리, 서비스 부정이용 방지, 각종 고지·통지</li>
              <li><strong className="text-foreground">서비스 제공</strong>: 이벤트 생성·운영, 영상 클립 수집 및 완성본 영상 제작, 결과 영상 공유</li>
              <li><strong className="text-foreground">알림 발송</strong>: 이벤트 진행 상태(렌더 시작·완료·지연·실패) 알림, 참가자 결과 영상 알림</li>
              <li><strong className="text-foreground">고객 응대</strong>: 문의·민원 사항의 확인, 처리 결과 통보</li>
            </ol>
          </section>

          <section className="flex flex-col gap-2">
            <h2 className="text-sm font-medium text-foreground">제2조 (수집하는 개인정보 항목 및 수집 방법)</h2>
            <p>① 회사는 다음과 같이 개인정보를 수집합니다.</p>
            <div className="overflow-x-auto">
              <table className="w-full border-collapse border border-border text-xs">
                <thead>
                  <tr className="bg-surface">
                    <th className="border border-border px-3 py-2 text-left font-medium text-foreground">정보주체</th>
                    <th className="border border-border px-3 py-2 text-left font-medium text-foreground">수집 항목</th>
                    <th className="border border-border px-3 py-2 text-left font-medium text-foreground">수집 방법</th>
                    <th className="border border-border px-3 py-2 text-left font-medium text-foreground">수집 시점</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td className="border border-border px-3 py-2 align-top">호스트 (회원)</td>
                    <td className="border border-border px-3 py-2 align-top">이메일 주소, 비밀번호, 이름</td>
                    <td className="border border-border px-3 py-2 align-top">회원가입 폼 입력</td>
                    <td className="border border-border px-3 py-2 align-top">회원가입 시</td>
                  </tr>
                  <tr>
                    <td className="border border-border px-3 py-2 align-top">호스트 (회원)</td>
                    <td className="border border-border px-3 py-2 align-top">휴대전화번호</td>
                    <td className="border border-border px-3 py-2 align-top">이벤트 생성 폼 입력</td>
                    <td className="border border-border px-3 py-2 align-top">이벤트 생성 시</td>
                  </tr>
                  <tr>
                    <td className="border border-border px-3 py-2 align-top">호스트 (회원)</td>
                    <td className="border border-border px-3 py-2 align-top">이벤트 정보(제목, 인트로·아웃트로 텍스트 등)</td>
                    <td className="border border-border px-3 py-2 align-top">이벤트 생성 폼 입력</td>
                    <td className="border border-border px-3 py-2 align-top">이벤트 생성 시</td>
                  </tr>
                  <tr>
                    <td className="border border-border px-3 py-2 align-top">참가자 (비회원)</td>
                    <td className="border border-border px-3 py-2 align-top">이름, 휴대전화번호</td>
                    <td className="border border-border px-3 py-2 align-top">영상 업로드 폼 입력</td>
                    <td className="border border-border px-3 py-2 align-top">영상 업로드 시</td>
                  </tr>
                  <tr>
                    <td className="border border-border px-3 py-2 align-top">참가자 (비회원)</td>
                    <td className="border border-border px-3 py-2 align-top">영상 콘텐츠(클립)</td>
                    <td className="border border-border px-3 py-2 align-top">카메라 촬영 후 업로드</td>
                    <td className="border border-border px-3 py-2 align-top">영상 업로드 시</td>
                  </tr>
                  <tr>
                    <td className="border border-border px-3 py-2 align-top">호스트·참가자 공통</td>
                    <td className="border border-border px-3 py-2 align-top">서비스 이용 기록, 접속 IP, 접속 로그</td>
                    <td className="border border-border px-3 py-2 align-top">자동 수집</td>
                    <td className="border border-border px-3 py-2 align-top">서비스 이용 시</td>
                  </tr>
                  <tr>
                    <td className="border border-border px-3 py-2 align-top">호스트 (회원)</td>
                    <td className="border border-border px-3 py-2 align-top">결제 수단의 종류, 결제 승인번호, 거래일시, 결제 금액, 결제·취소·환불 내역</td>
                    <td className="border border-border px-3 py-2 align-top">결제대행사를 통하여 수집</td>
                    <td className="border border-border px-3 py-2 align-top">유료 이벤트 마감·결제 시</td>
                  </tr>
                </tbody>
              </table>
            </div>
            <p>② 회사는 「개인정보 보호법」 제23조에 따른 민감정보(인종, 사상·신념, 정치적 견해, 건강 정보 등) 및 제24조에 따른 고유식별정보(주민등록번호, 운전면허번호 등)를 수집하지 아니합니다.</p>
            <p>③ 회원의 카드번호, 계좌번호 등 결제수단의 상세 정보는 결제대행사가 수집·보관하며, 회사는 이를 수집하거나 보관하지 아니합니다.</p>
          </section>

          <section className="flex flex-col gap-2">
            <h2 className="text-sm font-medium text-foreground">제3조 (개인정보의 처리 및 보유 기간)</h2>
            <p>① 회사는 개인정보를 수집·이용 목적에 필요한 최소한의 기간 동안만 보유·처리하며, 보유 기간이 경과한 후에는 지체 없이 파기합니다.</p>
            <p>② 항목별 보유 기간은 다음과 같습니다.</p>
            <div className="overflow-x-auto">
              <table className="w-full border-collapse border border-border text-xs">
                <thead>
                  <tr className="bg-surface">
                    <th className="border border-border px-3 py-2 text-left font-medium text-foreground">항목</th>
                    <th className="border border-border px-3 py-2 text-left font-medium text-foreground">보유 기간</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td className="border border-border px-3 py-2 align-top">호스트 회원정보 (이메일, 비밀번호, 이름)</td>
                    <td className="border border-border px-3 py-2 align-top">회원 탈퇴 시까지</td>
                  </tr>
                  <tr>
                    <td className="border border-border px-3 py-2 align-top">이벤트 정보 (제목, 인트로·아웃트로 텍스트, 호스트 휴대전화번호 등)</td>
                    <td className="border border-border px-3 py-2 align-top">회원 탈퇴 시까지 또는 호스트 요청 시까지</td>
                  </tr>
                  <tr>
                    <td className="border border-border px-3 py-2 align-top">참가자 정보 (이름, 휴대전화번호)</td>
                    <td className="border border-border px-3 py-2 align-top">결과 알림 발송 시점으로부터 약 48시간. 다만 회사의 사유로 완성본 제작이 지연되거나 실패한 이벤트의 경우 해당 클립과 함께 최대 7일까지 보존될 수 있습니다.</td>
                  </tr>
                  <tr>
                    <td className="border border-border px-3 py-2 align-top">클립 영상</td>
                    <td className="border border-border px-3 py-2 align-top">참가자 결과 알림 발송 시점으로부터 약 48시간. 다만 회사의 사유로 완성본 제작이 지연되거나 실패한 이벤트의 클립은 「Congre 서비스 이용약관」 제11조 제⑤항에 따라 결제 완료 시점(무료 플랜의 경우 이벤트 마감 시점)으로부터 최대 7일까지 보존될 수 있습니다.</td>
                  </tr>
                  <tr>
                    <td className="border border-border px-3 py-2 align-top">완성본 영상</td>
                    <td className="border border-border px-3 py-2 align-top">완성본 생성 시점으로부터 약 7일</td>
                  </tr>
                  <tr>
                    <td className="border border-border px-3 py-2 align-top">서비스 이용 기록, 접속 IP, 접속 로그</td>
                    <td className="border border-border px-3 py-2 align-top">「통신비밀보호법」에 따라 3개월</td>
                  </tr>
                  <tr>
                    <td className="border border-border px-3 py-2 align-top">계약 또는 청약철회 등에 관한 기록</td>
                    <td className="border border-border px-3 py-2 align-top">「전자상거래 등에서의 소비자보호에 관한 법률」에 따라 5년</td>
                  </tr>
                  <tr>
                    <td className="border border-border px-3 py-2 align-top">대금결제 및 재화 등의 공급에 관한 기록</td>
                    <td className="border border-border px-3 py-2 align-top">「전자상거래 등에서의 소비자보호에 관한 법률」에 따라 5년</td>
                  </tr>
                  <tr>
                    <td className="border border-border px-3 py-2 align-top">소비자의 불만 또는 분쟁 처리에 관한 기록</td>
                    <td className="border border-border px-3 py-2 align-top">「전자상거래 등에서의 소비자보호에 관한 법률」에 따라 3년</td>
                  </tr>
                </tbody>
              </table>
            </div>
            <p>③ 자동 삭제는 1일 1회 정해진 시각(한국 표준시 기준 새벽 시간대)에 실행되므로, 실제 삭제 시점은 위 기준 시각으로부터 최대 약 24시간의 오차가 있을 수 있습니다.</p>
            <p>④ 다음의 사유에 해당하는 경우에는 해당 사유가 종료될 때까지 개인정보를 보관할 수 있습니다.</p>
            <ol className="list-decimal pl-6 flex flex-col gap-1">
              <li>관련 법령에 따른 보존 의무가 있는 경우. 「전자상거래 등에서의 소비자보호에 관한 법률」, 「통신비밀보호법」, 「국세기본법」 등이 이에 해당합니다.</li>
              <li>정보주체와의 분쟁 또는 소송이 진행 중인 경우</li>
            </ol>
            <p>⑤ 회원이 회원 탈퇴를 신청하는 경우, 본 조 ②항의 보유 기간과 무관하게 회원 계정 정보, 회원이 생성한 모든 이벤트 정보, 부속 클립 및 완성본 영상이 즉시 일괄 삭제됩니다. 다만 본 조 ④항에 따라 법령상 보존 의무가 있는 거래기록은 해당 보존 기간이 경과할 때까지 분리 보관되며, 이 경우 보관 항목은 법령이 정한 범위로 한정됩니다. 자세한 사항은 「Congre 서비스 이용약관」 제18조에서 정합니다.</p>
          </section>

          <section className="flex flex-col gap-2">
            <h2 className="text-sm font-medium text-foreground">제4조 (개인정보의 제3자 제공)</h2>
            <p>
              회사는 정보주체의 개인정보를 제1조의 처리 목적 범위 내에서만 처리하며, 정보주체의 별도 동의, 법률의 특별한 규정 등 「개인정보 보호법」 제17조 및 제18조에 해당하는 경우 외에는 제3자에게 제공하지 아니합니다.
            </p>
          </section>

          <section className="flex flex-col gap-2">
            <h2 className="text-sm font-medium text-foreground">제5조 (개인정보 처리의 위탁)</h2>
            <p>① 회사는 원활한 서비스 제공을 위하여 다음과 같이 개인정보 처리 업무를 외부 전문 업체에 위탁하고 있습니다.</p>
            <div className="overflow-x-auto">
              <table className="w-full border-collapse border border-border text-xs">
                <thead>
                  <tr className="bg-surface">
                    <th className="border border-border px-3 py-2 text-left font-medium text-foreground">수탁자</th>
                    <th className="border border-border px-3 py-2 text-left font-medium text-foreground">위탁 업무</th>
                    <th className="border border-border px-3 py-2 text-left font-medium text-foreground">처리 항목</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td className="border border-border px-3 py-2 align-top">Google LLC</td>
                    <td className="border border-border px-3 py-2 align-top">회원 인증 및 데이터베이스 (Firebase Authentication, Cloud Firestore)</td>
                    <td className="border border-border px-3 py-2 align-top">호스트 이메일, 비밀번호 해시, 이름, 이벤트 정보</td>
                  </tr>
                  <tr>
                    <td className="border border-border px-3 py-2 align-top">Amazon Web Services, Inc.</td>
                    <td className="border border-border px-3 py-2 align-top">클립 영상 파일 저장 (Amazon S3)</td>
                    <td className="border border-border px-3 py-2 align-top">클립 영상 콘텐츠</td>
                  </tr>
                  <tr>
                    <td className="border border-border px-3 py-2 align-top">Shotstack Pty Ltd</td>
                    <td className="border border-border px-3 py-2 align-top">영상 자동 편집 엔진</td>
                    <td className="border border-border px-3 py-2 align-top">클립 영상 콘텐츠, 인트로·아웃트로 텍스트</td>
                  </tr>
                  <tr>
                    <td className="border border-border px-3 py-2 align-top">Resend, Inc.</td>
                    <td className="border border-border px-3 py-2 align-top">호스트 이메일 알림 발송</td>
                    <td className="border border-border px-3 py-2 align-top">호스트 이메일, 이름</td>
                  </tr>
                  <tr>
                    <td className="border border-border px-3 py-2 align-top">주식회사 솔라피 (SOLAPI)</td>
                    <td className="border border-border px-3 py-2 align-top">호스트·참가자 SMS 알림 발송</td>
                    <td className="border border-border px-3 py-2 align-top">호스트·참가자 휴대전화번호, 이름, 이벤트 제목, 결과 영상 URL</td>
                  </tr>
                  <tr>
                    <td className="border border-border px-3 py-2 align-top">Vercel, Inc.</td>
                    <td className="border border-border px-3 py-2 align-top">서비스 호스팅 및 운영</td>
                    <td className="border border-border px-3 py-2 align-top">서비스 이용 기록, 접속 IP, 접속 로그</td>
                  </tr>
                  <tr>
                    <td className="border border-border px-3 py-2 align-top">토스페이먼츠 주식회사</td>
                    <td className="border border-border px-3 py-2 align-top">신용카드 등 결제 처리, 결제 취소 및 환불 처리</td>
                    <td className="border border-border px-3 py-2 align-top">결제 수단의 종류, 결제 승인번호, 거래일시, 결제 금액, 결제·취소·환불 내역</td>
                  </tr>
                </tbody>
              </table>
            </div>
            <p>② 회사는 위탁계약 체결 시 「개인정보 보호법」 제26조에 따라 위탁업무 수행 목적 외 개인정보 처리 금지, 기술적·관리적 보호조치, 재위탁 제한, 수탁자에 대한 관리·감독, 손해배상 등 책임에 관한 사항을 계약서 등 문서에 명시하고, 수탁자가 개인정보를 안전하게 처리하는지 감독합니다.</p>
            <p>③ 위탁업무의 내용이나 수탁자가 변경될 경우에는 지체 없이 본 처리방침을 통하여 공개합니다.</p>
          </section>

          <section className="flex flex-col gap-2">
            <h2 className="text-sm font-medium text-foreground">제5조의2 (개인정보의 국외 이전)</h2>
            <p>① 회사는 서비스 제공을 위하여 다음과 같이 개인정보를 국외로 이전합니다.</p>
            <div className="overflow-x-auto">
              <table className="w-full border-collapse border border-border text-xs">
                <thead>
                  <tr className="bg-surface">
                    <th className="border border-border px-3 py-2 text-left font-medium text-foreground">수탁자</th>
                    <th className="border border-border px-3 py-2 text-left font-medium text-foreground">이전 국가·리전</th>
                    <th className="border border-border px-3 py-2 text-left font-medium text-foreground">이전 일시 및 방법</th>
                    <th className="border border-border px-3 py-2 text-left font-medium text-foreground">이전 항목</th>
                    <th className="border border-border px-3 py-2 text-left font-medium text-foreground">보유 기간</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td className="border border-border px-3 py-2 align-top">Google LLC</td>
                    <td className="border border-border px-3 py-2 align-top">미국 (Firestore 리전: us-central1)</td>
                    <td className="border border-border px-3 py-2 align-top">서비스 이용 시점에 네트워크를 통한 전송</td>
                    <td className="border border-border px-3 py-2 align-top">호스트 이메일, 비밀번호 해시, 이름, 이벤트 정보</td>
                    <td className="border border-border px-3 py-2 align-top">제3조에 따른 보유 기간</td>
                  </tr>
                  <tr>
                    <td className="border border-border px-3 py-2 align-top">Amazon Web Services, Inc.</td>
                    <td className="border border-border px-3 py-2 align-top">ap-southeast-2</td>
                    <td className="border border-border px-3 py-2 align-top">클립 영상 업로드 시점에 네트워크를 통한 전송</td>
                    <td className="border border-border px-3 py-2 align-top">클립 영상 콘텐츠</td>
                    <td className="border border-border px-3 py-2 align-top">제3조에 따른 보유 기간</td>
                  </tr>
                  <tr>
                    <td className="border border-border px-3 py-2 align-top">Shotstack Pty Ltd</td>
                    <td className="border border-border px-3 py-2 align-top">호주</td>
                    <td className="border border-border px-3 py-2 align-top">완성본 영상 생성 시점에 네트워크를 통한 전송</td>
                    <td className="border border-border px-3 py-2 align-top">클립 영상 콘텐츠, 인트로·아웃트로 텍스트</td>
                    <td className="border border-border px-3 py-2 align-top">제3조에 따른 보유 기간</td>
                  </tr>
                  <tr>
                    <td className="border border-border px-3 py-2 align-top">Resend, Inc.</td>
                    <td className="border border-border px-3 py-2 align-top">미국</td>
                    <td className="border border-border px-3 py-2 align-top">알림 발송 시점에 네트워크를 통한 전송</td>
                    <td className="border border-border px-3 py-2 align-top">호스트 이메일, 이름</td>
                    <td className="border border-border px-3 py-2 align-top">발송 직후 처리 완료</td>
                  </tr>
                  <tr>
                    <td className="border border-border px-3 py-2 align-top">Vercel, Inc.</td>
                    <td className="border border-border px-3 py-2 align-top">미국 (글로벌 엣지 네트워크 포함)</td>
                    <td className="border border-border px-3 py-2 align-top">서비스 이용 시점에 네트워크를 통한 전송</td>
                    <td className="border border-border px-3 py-2 align-top">서비스 이용 기록, 접속 IP, 접속 로그</td>
                    <td className="border border-border px-3 py-2 align-top">제3조에 따른 보유 기간</td>
                  </tr>
                </tbody>
              </table>
            </div>
            <p>② 정보주체는 「개인정보 보호법」 제28조의8에 따라 회사에 개인정보의 국외 이전을 거부할 수 있습니다. 다만, 거부 시 서비스의 일부 또는 전부를 이용하지 못할 수 있습니다.</p>
          </section>

          <section className="flex flex-col gap-2">
            <h2 className="text-sm font-medium text-foreground">제6조 (정보주체와 법정대리인의 권리·의무 및 그 행사 방법)</h2>
            <p>① 정보주체는 회사에 대하여 언제든지 다음 각 호의 권리를 행사할 수 있습니다.</p>
            <ol className="list-decimal pl-6 flex flex-col gap-1">
              <li>개인정보 열람 요구</li>
              <li>개인정보 정정·삭제 요구</li>
              <li>개인정보 처리 정지 요구</li>
              <li>개인정보 수집·이용·제공 동의 철회</li>
            </ol>
            <p>② 만 14세 미만 아동의 법정대리인은 그 아동의 개인정보에 대한 열람, 정정·삭제, 처리 정지를 요구할 수 있습니다.</p>
            <p>③ 권리 행사는 회사에 대하여 서면, 전자우편 등을 통하여 하실 수 있으며, 회사는 이에 대해 지체 없이 조치합니다.</p>
            <p>④ 권리 행사는 정보주체의 법정대리인이나 위임을 받은 자 등 대리인을 통하여 하실 수 있으며, 이 경우 「개인정보 처리 방법에 관한 고시」(개인정보보호위원회 고시) 별지 제11호 서식에 따른 위임장을 제출하여야 합니다.</p>
            <p>⑤ 개인정보 열람 및 처리정지 요구는 「개인정보 보호법」 제35조 제5항, 제37조 제2항에 따라 정보주체의 권리가 제한될 수 있습니다.</p>
            <p>⑥ 개인정보의 정정·삭제 요구는 다른 법령에서 그 개인정보가 수집 대상으로 명시되어 있는 경우에는 그 삭제를 요구할 수 없습니다.</p>
            <p>⑦ 회사는 정보주체 권리에 따른 열람의 요구, 정정·삭제의 요구, 처리정지의 요구 시 열람 등 요구를 한 자가 본인이거나 정당한 대리인인지를 확인합니다.</p>
          </section>

          <section className="flex flex-col gap-2">
            <h2 className="text-sm font-medium text-foreground">제7조 (개인정보의 안전성 확보 조치)</h2>
            <p>회사는 「개인정보 보호법」 제29조에 따라 개인정보의 안전성 확보를 위하여 다음과 같은 조치를 취하고 있습니다.</p>
            <ol className="list-decimal pl-6 flex flex-col gap-3">
              <li>
                <p><strong className="text-foreground">관리적 조치</strong></p>
                <ul className="list-disc pl-5 mt-1 flex flex-col gap-1">
                  <li>개인정보 처리 직원의 최소화 및 교육</li>
                  <li>개인정보 처리방침의 수립·시행</li>
                </ul>
              </li>
              <li>
                <p><strong className="text-foreground">기술적 조치</strong></p>
                <ul className="list-disc pl-5 mt-1 flex flex-col gap-1">
                  <li>개인정보처리시스템 등의 접근권한 관리: 회원 인증 시스템(Firebase Authentication)을 통한 권한 분리, 데이터베이스 보안 규칙(Firestore Security Rules)을 통한 비인가 접근 차단</li>
                  <li>비밀번호의 암호화: 회원의 비밀번호는 단방향 암호화하여 저장</li>
                  <li>통신 구간 암호화: 서비스 전 구간에 HTTPS(TLS) 적용</li>
                  <li>클립 영상 접근 통제: 클립 영상은 사전 서명된 URL(Pre-signed URL)을 통해 권한이 있는 자에게만 일시적으로 접근 허용</li>
                </ul>
              </li>
              <li>
                <p><strong className="text-foreground">물리적 조치</strong></p>
                <ul className="list-disc pl-5 mt-1 flex flex-col gap-1">
                  <li>회사는 자체 서버를 보유하지 아니하며, 본 처리방침 제5조에 따른 수탁자(클라우드 사업자 등)의 데이터 센터 보안 정책에 따라 보호됩니다.</li>
                </ul>
              </li>
            </ol>
          </section>

          <section className="flex flex-col gap-2">
            <h2 className="text-sm font-medium text-foreground">제8조 (개인정보 자동 수집 장치의 설치·운영 및 거부)</h2>
            <p>① 회사는 서비스 이용 과정에서 다음과 같은 자동 수집 또는 저장 장치를 운영합니다.</p>
            <ol className="list-decimal pl-6 flex flex-col gap-3">
              <li>
                <p><strong className="text-foreground">브라우저 저장소(LocalStorage)</strong></p>
                <ul className="list-disc pl-5 mt-1 flex flex-col gap-1">
                  <li>사용 목적: 회원 로그인 상태 유지</li>
                  <li>저장 항목: 회원 인증 토큰 (Firebase Authentication에서 발급)</li>
                  <li>저장 위치: 회원의 브라우저 LocalStorage. 외부로 전송되지 아니합니다.</li>
                </ul>
              </li>
              <li>
                <p><strong className="text-foreground">접속 로그</strong></p>
                <ul className="list-disc pl-5 mt-1 flex flex-col gap-1">
                  <li>사용 목적: 서비스 이용 현황 분석, 부정 이용 방지</li>
                  <li>수집 항목: 접속 IP 주소, 접속 일시, 사용한 서비스 기능</li>
                </ul>
              </li>
            </ol>
            <p>② 정보주체는 다음과 같은 방법으로 LocalStorage에 저장된 정보를 거부하거나 삭제할 수 있습니다.</p>
            <ol className="list-decimal pl-6 flex flex-col gap-1">
              <li>인터넷 브라우저의 사이트 데이터 삭제 기능을 통해 LocalStorage 데이터를 삭제할 수 있습니다.</li>
              <li>다만, LocalStorage 데이터를 삭제하는 경우 회원 로그인이 해제되며, 다시 서비스를 이용하기 위해서는 재로그인이 필요합니다.</li>
            </ol>
          </section>

          <section className="flex flex-col gap-2">
            <h2 className="text-sm font-medium text-foreground">제9조 (개인정보 보호책임자)</h2>
            <p>① 회사는 개인정보 처리에 관한 업무를 총괄해서 책임지고, 개인정보 처리와 관련한 정보주체의 불만 처리 및 피해 구제 등을 위하여 아래와 같이 개인정보 보호책임자를 지정하고 있습니다.</p>
            <div className="overflow-x-auto">
              <table className="w-full border-collapse border border-border text-xs">
                <tbody>
                  <tr>
                    <td className="border border-border px-3 py-2 font-medium text-foreground bg-surface">개인정보 보호책임자</td>
                    <td className="border border-border px-3 py-2">Congre 운영팀</td>
                  </tr>
                  <tr>
                    <td className="border border-border px-3 py-2 font-medium text-foreground bg-surface">연락처</td>
                    <td className="border border-border px-3 py-2">
                      <a href="mailto:ray@rayne.co.kr" className="text-accent hover:underline">
                        ray@rayne.co.kr
                      </a>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
            <p>② 정보주체는 회사의 서비스를 이용하면서 발생한 모든 개인정보 보호 관련 문의, 불만 처리, 피해 구제 등에 관한 사항을 개인정보 보호책임자에게 문의할 수 있으며, 회사는 정보주체의 문의에 대하여 지체 없이 답변 및 처리해드릴 것입니다.</p>
          </section>

          <section className="flex flex-col gap-2">
            <h2 className="text-sm font-medium text-foreground">제10조 (권익침해 구제 방법)</h2>
            <p>정보주체는 개인정보 침해로 인한 구제를 받기 위하여 개인정보분쟁조정위원회, 한국인터넷진흥원 개인정보침해신고센터 등에 분쟁 해결이나 상담 등을 신청할 수 있습니다. 그 밖의 기타 개인정보 침해의 신고·상담에 대해서는 아래의 기관에 문의하시기 바랍니다.</p>
            <div className="overflow-x-auto">
              <table className="w-full border-collapse border border-border text-xs">
                <thead>
                  <tr className="bg-surface">
                    <th className="border border-border px-3 py-2 text-left font-medium text-foreground">기관</th>
                    <th className="border border-border px-3 py-2 text-left font-medium text-foreground">연락처</th>
                    <th className="border border-border px-3 py-2 text-left font-medium text-foreground">홈페이지</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td className="border border-border px-3 py-2 align-top">개인정보분쟁조정위원회</td>
                    <td className="border border-border px-3 py-2 align-top">(국번 없이) 1833-6972</td>
                    <td className="border border-border px-3 py-2 align-top">www.kopico.go.kr</td>
                  </tr>
                  <tr>
                    <td className="border border-border px-3 py-2 align-top">개인정보침해신고센터 (한국인터넷진흥원)</td>
                    <td className="border border-border px-3 py-2 align-top">(국번 없이) 118</td>
                    <td className="border border-border px-3 py-2 align-top">privacy.kisa.or.kr</td>
                  </tr>
                  <tr>
                    <td className="border border-border px-3 py-2 align-top">대검찰청 사이버수사과</td>
                    <td className="border border-border px-3 py-2 align-top">(국번 없이) 1301</td>
                    <td className="border border-border px-3 py-2 align-top">www.spo.go.kr</td>
                  </tr>
                  <tr>
                    <td className="border border-border px-3 py-2 align-top">경찰청 사이버수사국</td>
                    <td className="border border-border px-3 py-2 align-top">(국번 없이) 182</td>
                    <td className="border border-border px-3 py-2 align-top">ecrm.police.go.kr</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </section>

          <section className="flex flex-col gap-2">
            <h2 className="text-sm font-medium text-foreground">제11조 (개인정보 처리방침의 변경)</h2>
            <p>① 본 개인정보 처리방침은 시행일로부터 적용되며, 법령 및 방침에 따른 변경 내용의 추가, 삭제 및 정정이 있는 경우에는 변경 사항의 시행 7일 전부터 서비스 화면을 통하여 공지합니다.</p>
            <p>② 다만, 정보주체의 권리에 중대한 영향을 미치는 변경이 있는 경우에는 시행 30일 전부터 공지합니다.</p>
            <p>③ 변경 이력은 본 처리방침의 부칙에 누적하여 기재합니다.</p>
          </section>

          <section className="flex flex-col gap-2">
            <h2 className="text-sm font-medium text-foreground">사업자 정보</h2>
            <div className="overflow-x-auto">
              <table className="w-full border-collapse border border-border text-xs">
                <tbody>
                  <tr>
                    <td className="border border-border px-3 py-2 font-medium text-foreground bg-surface">상호</td>
                    <td className="border border-border px-3 py-2">레이네(Rayne)</td>
                  </tr>
                  <tr>
                    <td className="border border-border px-3 py-2 font-medium text-foreground bg-surface">대표자</td>
                    <td className="border border-border px-3 py-2">조래환</td>
                  </tr>
                  <tr>
                    <td className="border border-border px-3 py-2 font-medium text-foreground bg-surface">사업자등록번호</td>
                    <td className="border border-border px-3 py-2">412-19-02824</td>
                  </tr>
                  <tr>
                    <td className="border border-border px-3 py-2 font-medium text-foreground bg-surface">사업장 주소</td>
                    <td className="border border-border px-3 py-2">경기도 성남시 분당구 미금로 36, 201호 A82호 (구미동, 브리엘프라자)</td>
                  </tr>
                  <tr>
                    <td className="border border-border px-3 py-2 font-medium text-foreground bg-surface">통신판매업신고번호</td>
                    <td className="border border-border px-3 py-2">신고 면제 대상 (전자상거래법 제12조 제1항 단서)</td>
                  </tr>
                  <tr>
                    <td className="border border-border px-3 py-2 font-medium text-foreground bg-surface">연락처</td>
                    <td className="border border-border px-3 py-2">010-7582-2020</td>
                  </tr>
                  <tr>
                    <td className="border border-border px-3 py-2 font-medium text-foreground bg-surface">이메일</td>
                    <td className="border border-border px-3 py-2">
                      <a href="mailto:ray@rayne.co.kr" className="text-accent hover:underline">
                        ray@rayne.co.kr
                      </a>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </section>

          <section className="flex flex-col gap-2">
            <h2 className="text-sm font-medium text-foreground">부칙</h2>
            <p>이 개인정보 처리방침은 2026년 9월 1일부터 시행합니다.</p>
          </section>
        </div>

        <div className="rule mt-14 mb-10" />

        <div className="flex flex-col gap-3">
          <p className="text-xs text-muted leading-relaxed">
            개인정보 관련 문의:{" "}
            <a href="mailto:cs@rayne.co.kr" className="text-accent hover:underline">
              cs@rayne.co.kr
            </a>
          </p>
          <a
            href={LANDING_URL}
            className="text-xs text-muted hover:text-accent tracking-widest uppercase transition-colors duration-200"
          >
            ← 홈으로
          </a>
        </div>
      </main>
      </div>
    </>
  );
}
