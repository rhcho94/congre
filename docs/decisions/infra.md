# Decisions — Infra

> Vercel·Firebase·GitHub Actions·도메인·무료 티어 정책 관련 결정. 새 결정은 맨 위에 추가 (최신이 위).

## 2026-06-02 운영 모니터링 방식

- 전용 화면(/admin) 빌드는 호스트 수십 명+ 시점으로 보류(events read 차단 → Admin SDK 서버 라우트 필요).
- 출시 초기엔 docs/ops/monitoring.md 수동 점검 문서로 운영(Firebase 콘솔 직접 열람 + 서비스 대시보드 + 비용 알림 이메일 AWS $100·Firebase ₩50,000).
- 운영자 사건 알림(C)은 채널 미정. 후보: 기존 SMS(CONGRE_INTERNAL_PHONE)/텔레그램 봇/카카오 나에게 보내기. SMS는 SOLAPI·이메일은 Resend 한도 공유, 텔레그램·카톡은 한도 무관.

## 2026-05-14 — SOLAPI 잔액 충전

- **결정**: SOLAPI 잔액 충전 처리. 이전 잔액 47.1원(약 47건) → 충전 완료.
- **이유**: 알림 시나리오 6건 트리거 중 참가자 단위 발송(N명마다 N건) 다수. 30명 회차당 약 33건 최소 발송 예상. 기존 잔액으로 1회차 진행 시 거의 소진. 실전 테스트 도중 잔액 0 도달 시 알림 무성공 + 호스트 미인지 위험 있어 사전 충전.

## 2026-05-14 — Firebase Spark → Blaze 전환

- **결정**: Firebase 요금제 Spark(무료) → Blaze(종량제) 전환.
- **이유**: 실전 테스트 시 Spark 일 한도(read 50K / write 20K)에 도달할 가능성 있음. 5초 폴링 + 호스트 대시보드 + 참가자 페이지 동시 사용 시 단일 회차로도 한도 임박 시나리오 존재. 한도 도달 시 즉시 read/write 차단 → 앱 사용 불능. Blaze는 Spark 한도 내에서 여전히 무료이고 초과분만 종량제(추가 read 100K 약 $0.06). 부담 거의 없으며 안전 마진 확보 효과 큼.
- **예산 알림**: $5 임계값으로 50%·90%·100% 알림 설정 완료.
- **무료 티어 한계 → 유료 플랜 룰(CLAUDE.md) 적용 사례**.

## 2026-05-07 — Cron 이전: GitHub Actions → Vercel Cron, Pro 업그레이드

- **결정**: GitHub Actions schedule cron을 폐기하고 Vercel Cron으로 이전. Vercel Pro 플랜으로 업그레이드 ($20/월).
- **이유**:
  - GitHub Actions free tier에서 `*/5 * * * *` 스케줄이 실측 평균 5시간 간격으로 실행됨 (8시간 동안 12회, 60배 부족). 추가로 runner 할당 실패("The job was not acquired by Runner of type hosted") 발생.
  - render_delayed 정책의 T+E+30분 비가역 임계값은 분 단위 정밀도 필요. 5시간 간격 cron으로는 임계값 자체가 무의미.
  - DECISIONS 2026-05-06 "무료 티어 한계 시 유료 플랜" 정책 적용. 우회 검토 0회.
- **대안 검토**:
  - Shotstack webhook 도입 (cron 유지): 시간 카운트(render_delayed)는 webhook으로 못 함. 보완재이지 대체재 아님.
  - 외부 cron 서비스 (cron-job.org 등): 운영 책임 분산, 1인 비개발자에게 트레이드오프 나쁨.
  - cron 간격 매시간으로 변경: render_delayed 정책 후퇴.
- **인증**: Vercel Cron이 호출 시 `Authorization: Bearer ${CRON_SECRET}` 헤더 자동 주입. 라우트 코드 수정 불필요.
- **정리**: GitHub Actions 워크플로 yml 2개 삭제. GitHub Secrets (APP_URL, CRON_SECRET)는 사용자가 GitHub UI에서 별도 삭제.

## 2026-05-06 — 무료 티어 한계 시 유료 플랜으로 진행

- **결정**: Vercel, GitHub Actions, AWS, SOLAPI, Resend, 카카오 등 인프라·플랫폼 무료 티어의 쿼터·throttling·기능 제한에 걸렸을 때, 우회 솔루션 검토 단계를 건너뛰고 유료 플랜으로 해결.
- **이유**:
  - 우회 검토(다른 무료 서비스 찾기, 자체 구현 등)는 시간·복잡도·향후 유지보수 부담을 키움.
  - 1인 비개발자 운영자에게 가장 비싼 자원은 시간. 유료 플랜의 월 비용보다 우회 작업의 시간 비용이 더 큼.
  - 직전 사례: GitHub Actions cron throttling — 무료 티어에서 매분 스케줄이 4시간에 1회만 실행. 우회 검토(외부 cron 서비스, Vercel Cron Jobs 비교) 자체가 부담이었음.
- **적용 영역**: 인프라·플랫폼 한정 (외부 신규 서비스 가입, 비즈니스 모델 영향 결정은 별도).
- **결제 결정권**: 사용자가 플랜·금액 보고 직접 결정. 클로드(채팅·CC)는 "유료 플랜이 표준 답"까지만 제안.
- **트리거**: 작업 중 무료 티어 한계가 막다른 길로 등장할 때 → 클로드는 우회 시도 0회로 두고 유료 플랜 추천 + 사용자 결정 대기.

## 2026-05-02 — 도메인 전략: congre.kr 우선 등록

- **결정**: 1단계(한국 시장)는 `congre.kr`만 등록. 다른 TLD는 글로벌 진출 검토 시점에 결정.
- **배경**: `congre.com`은 일본의 컨벤션·국제행사 컨설팅 회사가 보유 중. 업종이 "행사" 카테고리 공유로 인접하나 즉각적인 직접 충돌은 아님. 글로벌 B2B 진출 시 충돌 가능성은 인지하고 있음.
- **이름 어원**: "Congre" = 한국식 유머 발음 "꽁그래츄(Congrats)"의 줄임. "축하"의 친근한 표현.
- **2단계 옵션 (글로벌 검토 시 선택 필요)**:
  a. 이름 유지 + `.net` 또는 다른 TLD
  b. 변형 이름 + `.com`
  c. 새 이름 + `.com`
  d. `congre.com` 인수 시도
- **결정 시점**: 글로벌 진출 직전, 적어도 마케팅 본격화 전.
