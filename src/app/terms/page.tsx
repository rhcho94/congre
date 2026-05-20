import Link from "next/link";
import { BrandName } from "@/components/BrandName";

export default function TermsPage() {
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
          href="/"
          className="text-xs tracking-widest uppercase text-muted hover:text-accent transition-colors duration-200"
        >
          ← 홈
        </Link>
      </nav>

      <main className="mx-auto max-w-3xl px-6 py-16">
        <div className="mb-10">
          <p className="text-xs tracking-[0.4em] uppercase text-accent mb-3">Legal</p>
          <h1
            className="text-3xl italic text-foreground"
            style={{ fontFamily: "var(--font-display, serif)" }}
          >
            Congre 서비스 이용약관
          </h1>
          <p className="text-xs text-muted mt-3">시행일: 2026년 5월 11일 (v0.1) | v0.2 개정: 2026년 5월 20일</p>
        </div>

        <div className="rule mb-10" />

        <div className="flex flex-col gap-12 text-sm leading-relaxed text-muted">
          {/* 제1장 총칙 */}
          <section className="flex flex-col gap-4">
            <h2 className="text-base font-medium text-foreground tracking-wide">제1장 총칙</h2>

            <article className="flex flex-col gap-2">
              <h3 className="text-sm font-medium text-foreground">제1조 (목적)</h3>
              <p>
                이 약관은 Congre(이하 "회사"라 함)가 제공하는 다중 참가자 영상 회고 제작 서비스(이하 "서비스"라 함)의 이용에 관하여 회사와 이용자 간의 권리·의무 및 책임 사항을 규정함을 목적으로 합니다.
              </p>
            </article>

            <article className="flex flex-col gap-2">
              <h3 className="text-sm font-medium text-foreground">제2조 (용어의 정의)</h3>
              <p>이 약관에서 사용하는 용어의 정의는 다음과 같습니다.</p>
              <ol className="list-decimal pl-6 flex flex-col gap-1">
                <li>"서비스"란 회사가 제공하는 다중 참가자 영상 회고 제작 및 관련 부가 서비스 일체를 말합니다.</li>
                <li>"회원"이란 본 약관에 따라 회사와 이용계약을 체결하여 서비스를 이용하는 호스트를 말합니다.</li>
                <li>"호스트"란 이벤트를 생성하고 운영하는 회원을 말합니다.</li>
                <li>"참가자"란 호스트가 생성한 이벤트에 영상을 업로드하는 자를 말합니다. 참가자는 회원가입 없이 서비스의 일부 기능을 이용합니다.</li>
                <li>"이벤트"란 호스트가 생성한 영상 모집 단위를 말합니다.</li>
                <li>"클립"이란 참가자가 업로드한 개별 영상을 말합니다.</li>
                <li>"완성본"이란 클립들을 편집·결합하여 생성된 최종 영상을 말합니다.</li>
                <li>"비밀번호"란 회원의 개인정보 보호 및 본인 확인을 위해 회원이 설정한 문자·숫자·특수문자의 조합을 말합니다.</li>
              </ol>
            </article>

            <article className="flex flex-col gap-2">
              <h3 className="text-sm font-medium text-foreground">제3조 (약관의 효력 및 변경)</h3>
              <p>① 이 약관은 서비스 화면에 게시하거나 기타의 방법으로 회원에게 공지함으로써 효력이 발생합니다.</p>
              <p>② 회사는 「약관의 규제에 관한 법률」, 「전자상거래 등에서의 소비자보호에 관한 법률」, 「정보통신망 이용촉진 및 정보보호 등에 관한 법률」 등 관련 법령에 위배되지 않는 범위에서 이 약관을 변경할 수 있습니다.</p>
              <p>③ 회사는 약관을 변경하는 경우 적용일자 및 변경 사유를 명시하여 적용일자 7일 이전부터 서비스 화면에 공지합니다. 다만, 회원에게 불리하게 변경하는 경우에는 적용일자 30일 이전부터 공지하며, 회원이 명시적으로 거부 의사를 표시하지 아니하는 경우 변경 약관에 동의한 것으로 봅니다.</p>
              <p>④ 회원이 변경된 약관에 동의하지 않는 경우 이용계약을 해지할 수 있습니다.</p>
            </article>

            <article className="flex flex-col gap-2">
              <h3 className="text-sm font-medium text-foreground">제4조 (약관 외 준칙)</h3>
              <p>
                이 약관에 명시되지 아니한 사항은 「약관의 규제에 관한 법률」, 「전자상거래 등에서의 소비자보호에 관한 법률」, 「정보통신망 이용촉진 및 정보보호 등에 관한 법률」, 「개인정보 보호법」 및 기타 관련 법령의 규정에 따릅니다.
              </p>
            </article>
          </section>

          {/* 제2장 이용계약 */}
          <section className="flex flex-col gap-4">
            <h2 className="text-base font-medium text-foreground tracking-wide">제2장 이용계약</h2>

            <article className="flex flex-col gap-2">
              <h3 className="text-sm font-medium text-foreground">제5조 (이용계약의 체결)</h3>
              <p>
                ① 이용계약은 회사가 정한 회원가입 방법에 따라 회원자격이 부여되고, 회원이 본 약관 및{" "}
                <Link href="/privacy" className="text-accent hover:underline">
                  개인정보처리방침
                </Link>
                을 확인할 수 있는 상태에서 서비스를 이용함으로써 성립합니다.
              </p>
              <p>
                ② 회사는 본 약관 및{" "}
                <Link href="/privacy" className="text-accent hover:underline">
                  개인정보처리방침
                </Link>
                을 서비스 화면에 상시 게시하여, 회원이 언제든지 그 내용을 확인할 수 있도록 합니다.
              </p>
              <p>③ 신청인은 회원자격을 부여받는 시점에 만 14세 이상이어야 합니다. 만 14세 미만인 자는 회원이 될 수 없으며, 참가자로서만 서비스를 이용할 수 있습니다.</p>
            </article>

            <article className="flex flex-col gap-2">
              <h3 className="text-sm font-medium text-foreground">제6조 (회원자격의 부여 및 제한)</h3>
              <p>① 회사는 자체 기준에 따라 회원자격을 부여합니다.</p>
              <p>② 회사는 다음 각 호에 해당하는 경우 회원자격 부여를 보류하거나 거부할 수 있으며, 이미 부여된 경우 회원자격을 박탈할 수 있습니다.</p>
              <ol className="list-decimal pl-6 flex flex-col gap-1">
                <li>신청 또는 가입 정보 내용을 허위로 기재한 경우</li>
                <li>타인의 명의·이메일 등을 도용하여 신청한 경우</li>
                <li>만 14세 미만인 자가 회원자격을 신청한 경우</li>
                <li>이전에 본 약관 위반으로 회원자격을 상실한 적이 있는 경우</li>
                <li>기타 본 약관에 위배되거나 위법·부당한 신청·이용임이 확인되는 경우</li>
              </ol>
            </article>

            <article className="flex flex-col gap-2">
              <h3 className="text-sm font-medium text-foreground">제7조 (회원정보의 변경 및 비밀번호 관리)</h3>
              <p>① 회원은 회원가입 시 등록한 정보가 변경된 경우 지체 없이 회사에 변경 사항을 알리거나 직접 수정하여야 합니다.</p>
              <p>② 회원은 자신의 비밀번호에 대한 관리 책임을 지며, 이를 제3자에게 양도하거나 대여할 수 없습니다.</p>
              <p>③ 회원은 자신의 비밀번호가 도용되었거나 제3자에 의해 사용되고 있음을 인지한 경우 즉시 회사에 통지하고 회사의 안내에 따라야 합니다.</p>
              <p>④ 회원이 전항의 통지를 게을리하거나 회사의 안내에 따르지 않아 발생한 손해에 대하여 회사는 책임을 지지 않습니다.</p>
            </article>
          </section>

          {/* 제3장 서비스 제공 */}
          <section className="flex flex-col gap-4">
            <h2 className="text-base font-medium text-foreground tracking-wide">제3장 서비스 제공</h2>

            <article className="flex flex-col gap-2">
              <h3 className="text-sm font-medium text-foreground">제8조 (제공 서비스의 내용)</h3>
              <p>① 회사는 다음 각 호의 서비스를 제공합니다.</p>
              <ol className="list-decimal pl-6 flex flex-col gap-1">
                <li>호스트의 이벤트 생성 및 관리</li>
                <li>참가자의 영상(클립) 업로드 기능 제공</li>
                <li>클립의 자동 편집 및 완성본 영상 생성</li>
                <li>영상 결과의 호스트·참가자 공유 기능</li>
                <li>이벤트 진행 상태 및 결과에 관한 알림 발송</li>
                <li>기타 회사가 정하는 부가 서비스</li>
              </ol>
              <p>② 회사는 서비스의 내용을 변경할 수 있으며, 이 경우 변경 사항을 사전에 공지합니다. 단, 긴급한 사유가 있는 경우 사후에 공지할 수 있습니다.</p>
            </article>

            <article className="flex flex-col gap-2">
              <h3 className="text-sm font-medium text-foreground">제9조 (서비스 제공 시간 및 중지)</h3>
              <p>① 서비스는 연중무휴 1일 24시간 제공함을 원칙으로 합니다. 다만, 회사는 다음 각 호에 해당하는 경우 서비스의 일부 또는 전부를 중지할 수 있습니다.</p>
              <ol className="list-decimal pl-6 flex flex-col gap-1">
                <li>서비스 설비의 보수·점검·교체·고장 등이 발생한 경우</li>
                <li>정전, 통신 장애, 기간통신사업자의 서비스 중지 등 회사가 통제할 수 없는 사정이 발생한 경우</li>
                <li>천재지변, 국가비상사태, 정부의 명령 등 불가항력적 사유가 있는 경우</li>
                <li>외부 협력사(클라우드, 영상 편집 엔진 등)의 서비스 장애로 인해 서비스 제공이 불가능한 경우</li>
                <li>기타 운영상·기술상 필요한 경우</li>
              </ol>
              <p>② 회사는 전항에 따라 서비스를 중지하는 경우 사전에 공지합니다. 다만, 긴급한 경우에는 사후에 공지할 수 있습니다.</p>
            </article>

            <article className="flex flex-col gap-2">
              <h3 className="text-sm font-medium text-foreground">제10조 (무료 베타 서비스의 면책)</h3>
              <p>① 회사는 현재 서비스를 무료 베타 형태로 제공하고 있습니다. 무료 베타 서비스는 다음 각 호의 사항이 적용됩니다.</p>
              <ol className="list-decimal pl-6 flex flex-col gap-1">
                <li>일정 수준의 가용성을 보장하지 아니합니다.</li>
                <li>서비스 수준 협약(SLA)이 적용되지 아니합니다.</li>
                <li>사전 고지 없이 기능이 변경·중단될 수 있습니다.</li>
              </ol>
              <p>② 회사는 무료 베타 서비스의 이용으로 인하여 회원에게 발생한 손해에 대하여 회사의 고의 또는 중대한 과실이 없는 한 책임을 지지 아니합니다.</p>
              <p>③ 회사가 향후 유료 서비스를 도입하는 경우, 결제·환불 등 유료 서비스 관련 사항은 별도 약관 또는 별도 고지를 통해 안내합니다.</p>
            </article>
          </section>

          {/* 제4장 데이터 처리 */}
          <section className="flex flex-col gap-4">
            <h2 className="text-base font-medium text-foreground tracking-wide">제4장 데이터 처리</h2>

            <article className="flex flex-col gap-2">
              <h3 className="text-sm font-medium text-foreground">제11조 (영상 데이터의 보유 및 자동 삭제)</h3>
              <p>① 회사는 서비스의 성질상 영상 데이터를 영구 보존하지 아니하며, 다음 각 호의 기간이 경과한 후 자동으로 삭제합니다.</p>
              <ol className="list-decimal pl-6 flex flex-col gap-1">
                <li><strong className="text-foreground">클립</strong>: 참가자 결과 알림이 발송된 시점으로부터 약 24시간 후 자동 삭제</li>
                <li><strong className="text-foreground">완성본</strong>: 완성본 영상이 생성된 시점으로부터 약 7일 후 자동 삭제</li>
              </ol>
              <p>② 자동 삭제는 1일 1회 정해진 시각에 실행되므로, 실제 삭제 시점은 전항의 기준 시각으로부터 최대 약 24시간의 오차가 있을 수 있습니다.</p>
              <p>③ 회원은 자동 삭제 이전에 호스트 대시보드 또는 참가자 결과 페이지를 통해 영상을 본인의 기기에 저장할 수 있습니다. 자동 삭제 이후의 영상 복구는 불가능합니다.</p>
              <p>④ 회사는 자동 삭제와 별도로, 회원의 요청이 있는 경우 또는 본 약관에 따른 이용 제한·계약 해지 사유가 발생한 경우 영상 데이터를 즉시 삭제할 수 있습니다.</p>
            </article>

            <article className="flex flex-col gap-2">
              <h3 className="text-sm font-medium text-foreground">제12조 (참가자 정보의 처리)</h3>
              <p>① 호스트가 생성한 이벤트에 영상을 업로드하는 참가자는 이름 및 휴대전화번호를 입력하여야 합니다.</p>
              <p>
                ② 회사가 참가자로부터 수집하는 개인정보의 항목, 이용 목적, 보유 기간 등 상세 사항은 별도의{" "}
                <Link href="/privacy" className="text-accent hover:underline">
                  개인정보처리방침
                </Link>
                에서 정합니다.
              </p>
              <p>③ 참가자가 업로드한 클립의 저작재산권은 참가자 본인에게 귀속되며, 회사는 서비스 제공 목적의 범위 내에서 해당 클립을 처리·결합·삭제할 수 있는 권리를 가집니다.</p>
              <p>④ 호스트는 참가자에게 본 서비스 이용 사실, 영상 수집 목적, 보유 기간을 사전에 안내할 의무를 지며, 이에 대한 책임은 호스트에게 있습니다.</p>
            </article>

            <article className="flex flex-col gap-2">
              <h3 className="text-sm font-medium text-foreground">제13조 (미성년자 이용에 관한 특칙)</h3>
              <p>① 만 14세 미만의 자는 호스트로 회원가입할 수 없습니다.</p>
              <p>② 호스트는 자신이 생성한 이벤트의 참가자 중 만 14세 미만의 자가 포함될 가능성이 있는 경우, 사전에 이를 파악하고 법정대리인의 동의가 필요함을 참가자 및 그 보호자에게 안내할 의무를 부담합니다.</p>
              <p>③ 호스트는 참가자에게 미성년자가 포함되는 경우 다음 각 호의 사항을 사전에 안내하여야 합니다.</p>
              <ol className="list-decimal pl-6 flex flex-col gap-1">
                <li>영상 수집의 목적</li>
                <li>영상의 자동 삭제 기간</li>
                <li>완성본 영상의 공유 범위</li>
                <li>만 14세 미만의 경우 법정대리인 동의 필요</li>
              </ol>
              <p>④ 본 조에 따른 동의 확보 의무 위반으로 발생한 분쟁이나 손해에 대하여 회사는 책임을 지지 아니하며, 해당 책임은 호스트에게 있습니다.</p>
            </article>

            <article className="flex flex-col gap-2">
              <h3 className="text-sm font-medium text-foreground">제14조 (재렌더 정책)</h3>
              <p>① 호스트는 이벤트의 영상 편집 결과에 대하여 재렌더(영상 다시 만들기)를 요청할 수 있습니다.</p>
              <p>② 무료 베타 서비스 단계에서 재렌더 횟수에 별도의 제한을 두지 아니합니다. 다만, 재렌더 시 이전에 생성된 완성본 영상은 새로운 완성본으로 대체되며 복구되지 아니할 수 있습니다.</p>
              <p>③ 회사가 향후 유료 서비스를 도입하는 경우, 재렌더에 별도의 결제 또는 사용 한도가 적용될 수 있으며, 이는 별도 고지를 통해 안내합니다.</p>
            </article>
          </section>

          {/* 제5장 회사·회원의 의무 */}
          <section className="flex flex-col gap-4">
            <h2 className="text-base font-medium text-foreground tracking-wide">제5장 회사·회원의 의무</h2>

            <article className="flex flex-col gap-2">
              <h3 className="text-sm font-medium text-foreground">제15조 (회사의 의무)</h3>
              <p>① 회사는 관련 법령과 이 약관을 준수하며, 안정적이고 지속적인 서비스 제공을 위해 노력합니다.</p>
              <p>
                ② 회사는 회원의 개인정보 보호를 위하여 보안 시스템을 갖추고{" "}
                <Link href="/privacy" className="text-accent hover:underline">
                  개인정보처리방침
                </Link>
                을 공시·준수합니다.
              </p>
              <p>③ 회사는 서비스 제공 중 알게 된 회원의 개인정보를 본인의 동의 없이 제3자에게 누설·제공하지 아니합니다. 다만, 관련 법령에 따라 수사기관 또는 권한 있는 기관의 요청이 있는 경우에는 그러하지 아니합니다.</p>
              <p>④ 회사는 회원이 제기하는 의견이나 불만이 정당하다고 판단될 경우 적절한 조치를 취하기 위해 노력합니다.</p>
            </article>

            <article className="flex flex-col gap-2">
              <h3 className="text-sm font-medium text-foreground">제16조 (회원의 의무 및 금지행위)</h3>
              <p>① 회원은 다음 각 호의 행위를 하여서는 아니 됩니다.</p>
              <ol className="list-decimal pl-6 flex flex-col gap-1">
                <li>가입 신청 또는 회원정보 변경 시 허위 사실을 기재하는 행위</li>
                <li>타인의 정보를 도용하거나 명의를 도용하는 행위</li>
                <li>회사의 서비스를 이용하여 법령 또는 공서양속에 반하는 콘텐츠를 게시·전송하는 행위</li>
                <li>다른 회원 또는 제3자의 명예를 훼손하거나 권리를 침해하는 행위</li>
                <li>회사의 서비스를 영리 목적으로 무단 이용하거나, 회사의 동의 없이 서비스를 복제·변경·배포하는 행위</li>
                <li>서비스의 정상적인 운영을 방해하거나, 회사의 시스템에 부정한 방법으로 접근하는 행위</li>
                <li>기타 관련 법령에 위배되는 행위</li>
              </ol>
              <p>② 회원이 전항을 위반하여 발생한 결과에 대한 책임은 해당 회원이 부담하며, 회사가 이로 인하여 손해를 입은 경우 회원은 회사에 대하여 손해를 배상할 책임이 있습니다.</p>
            </article>

            <article className="flex flex-col gap-2">
              <h3 className="text-sm font-medium text-foreground">제17조 (호스트의 의무)</h3>
              <p>① 호스트는 자신이 생성한 이벤트의 운영 및 참가자 모집·관리에 관한 책임을 부담합니다.</p>
              <p>② 호스트는 참가자에게 다음 각 호의 사항을 사전에 안내할 의무를 부담합니다.</p>
              <ol className="list-decimal pl-6 flex flex-col gap-1">
                <li>본 서비스를 이용하여 영상을 수집한다는 사실</li>
                <li>영상의 자동 삭제 기간(클립 약 24시간, 완성본 약 7일)</li>
                <li>완성본 영상의 공유 범위</li>
                <li>만 14세 미만 참가자의 경우 법정대리인 동의가 필요할 수 있다는 사실</li>
              </ol>
              <p>③ 호스트가 본 조에 따른 의무를 위반하여 참가자 또는 제3자와 분쟁이 발생한 경우, 그 책임은 호스트에게 있으며, 회사는 이에 대하여 책임을 지지 아니합니다.</p>
              <p>④ 호스트는 참가자가 업로드한 클립을 본 서비스의 목적 범위를 넘어 제3자에게 무단으로 공유·배포하여서는 아니 됩니다.</p>
            </article>
          </section>

          {/* 제6장 계약 해지 및 책임 */}
          <section className="flex flex-col gap-4">
            <h2 className="text-base font-medium text-foreground tracking-wide">제6장 계약 해지 및 책임</h2>

            <article className="flex flex-col gap-2">
              <h3 className="text-sm font-medium text-foreground">제18조 (회원 탈퇴 및 자료 삭제)</h3>
              <p>① 회원은 마이페이지의 "회원 탈퇴" 기능을 통하여 언제든지 회원 탈퇴를 신청할 수 있습니다.</p>
              <p>② 회원은 진행 중인 이벤트(상태가 "오픈", "마감", "렌더링 중"인 이벤트)가 존재하는 경우 회원 탈퇴를 신청할 수 없으며, 모든 이벤트를 마감하여 완료 상태로 전환한 후에 탈퇴를 신청하여야 합니다.</p>
              <p>③ 회원 탈퇴가 처리되는 즉시 다음 각 호의 정보가 일괄 삭제됩니다.</p>
              <ol className="list-decimal pl-6 flex flex-col gap-1">
                <li>회원 계정 정보 (이메일, 이름, 휴대전화번호 등 회원가입 시 등록한 모든 정보)</li>
                <li>회원이 생성한 모든 이벤트 및 부속 정보 (인트로·아웃트로 텍스트 등 포함)</li>
                <li>해당 이벤트에 업로드된 모든 클립 및 완성본 영상</li>
              </ol>
              <p>④ 전항에 따라 삭제된 정보는 복구할 수 없으며, 회원은 탈퇴 신청 전 필요한 영상을 본인의 기기에 저장하여야 합니다.</p>
              <p>⑤ 회사는 관련 법령에 따라 일정 기간 보존하여야 하는 정보가 있는 경우, 해당 기간 동안 해당 정보를 분리 보관할 수 있습니다.</p>
            </article>

            <article className="flex flex-col gap-2">
              <h3 className="text-sm font-medium text-foreground">제19조 (이용 제한 및 계약 해지)</h3>
              <p>① 회사는 회원이 다음 각 호에 해당하는 경우 사전 통지 후 서비스 이용을 일시 정지하거나 이용계약을 해지할 수 있습니다. 다만, 긴급한 사유가 있는 경우 사후에 통지할 수 있습니다.</p>
              <ol className="list-decimal pl-6 flex flex-col gap-1">
                <li>본 약관 제16조의 금지행위를 한 경우</li>
                <li>본 약관 제17조의 호스트 의무를 중대하게 위반한 경우</li>
                <li>가입 신청 또는 회원정보를 허위로 기재한 사실이 확인된 경우</li>
                <li>회사 또는 다른 회원·참가자에게 손해를 끼치거나 끼칠 우려가 있는 경우</li>
                <li>기타 관련 법령 또는 본 약관을 위반한 경우</li>
              </ol>
              <p>② 본 조에 따른 이용 제한 또는 계약 해지로 인하여 회원에게 발생한 손해에 대하여 회사는 회사의 고의 또는 중대한 과실이 없는 한 책임을 지지 아니합니다.</p>
            </article>

            <article className="flex flex-col gap-2">
              <h3 className="text-sm font-medium text-foreground">제20조 (손해배상 및 면책)</h3>
              <p>① 회사는 무료로 제공되는 서비스와 관련하여 회원 또는 제3자에게 발생한 손해에 대하여 회사의 고의 또는 중대한 과실이 없는 한 책임을 지지 아니합니다.</p>
              <p>② 회사는 다음 각 호의 사유로 인하여 발생한 손해에 대하여 책임을 지지 아니합니다.</p>
              <ol className="list-decimal pl-6 flex flex-col gap-1">
                <li>천재지변, 전쟁, 정부의 명령 등 불가항력적 사유</li>
                <li>회원·참가자 또는 제3자의 귀책사유로 인한 서비스 이용 장애</li>
                <li>외부 협력사(클라우드, 영상 편집 엔진, 통신사 등)의 서비스 장애</li>
                <li>회원이 본 약관 또는 관련 법령을 위반하여 발생한 손해</li>
                <li>호스트가 참가자에게 본 약관 제17조에 따른 의무를 이행하지 아니하여 발생한 분쟁</li>
                <li>회원이 자신의 비밀번호를 부주의하게 관리하여 발생한 손해</li>
                <li>영상 데이터의 자동 삭제 후 복구 요청에 대한 응대 불가</li>
              </ol>
              <p>③ 회사는 회원 또는 참가자가 업로드한 콘텐츠의 내용 또는 합법성에 대하여 검증할 의무를 부담하지 아니하며, 해당 콘텐츠로 인하여 발생한 분쟁이나 손해에 대하여 책임을 지지 아니합니다.</p>
            </article>

            <article className="flex flex-col gap-2">
              <h3 className="text-sm font-medium text-foreground">제21조 (분쟁의 해결 및 고객 응대)</h3>
              <p>① 회사는 회원이 제기하는 정당한 의견이나 불만을 신속하게 처리하기 위해 노력합니다.</p>
              <p>② 현재 회사의 고객 응대 채널은 카카오톡 채널 "@congre"이며, 정식 개설 시 서비스 화면을 통하여 안내합니다.</p>
              <p>③ 회사와 회원 사이에 발생한 분쟁은 상호 협의에 의하여 해결함을 원칙으로 합니다. 협의가 이루어지지 아니하는 경우, 「전자상거래 등에서의 소비자보호에 관한 법률」 등 관련 법령 및 「소비자기본법」에 따른 분쟁조정기관에 조정을 신청할 수 있습니다.</p>
            </article>

            <article className="flex flex-col gap-2">
              <h3 className="text-sm font-medium text-foreground">제22조 (관할 법원 및 준거법)</h3>
              <p>① 본 약관 및 서비스 이용에 관한 분쟁에 대하여는 대한민국 법령을 준거법으로 합니다.</p>
              <p>② 회사와 회원 간에 발생한 분쟁에 관한 소송은 「민사소송법」이 정한 관할 법원을 전속 관할로 합니다.</p>
            </article>
          </section>

          {/* 부칙 */}
          <section className="flex flex-col gap-4">
            <h2 className="text-base font-medium text-foreground tracking-wide">부칙</h2>
            <p>이 약관은 2026년 5월 11일부터 시행합니다. (v0.1)</p>
            <p>이 약관(v0.2)은 2026년 5월 20일부터 시행합니다.</p>
          </section>
        </div>

        <div className="rule mt-14 mb-10" />

        <div className="flex flex-col gap-3">
          <p className="text-xs text-muted leading-relaxed">
            이용약관 관련 문의:{" "}
            <a href="mailto:hello@congre.kr" className="text-accent hover:underline">
              hello@congre.kr
            </a>
          </p>
          <Link
            href="/"
            className="text-xs text-muted hover:text-accent tracking-widest uppercase transition-colors duration-200"
          >
            ← 홈으로
          </Link>
        </div>
      </main>
    </div>
  );
}
