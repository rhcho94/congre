# 로드맵 / 백로그 / 알려진 이슈

## 진행 중

- (현재 진행 중인 작업 없음)

## 다음 작업 후보

### ✅ 알림 시스템 Phase 1 완료 (2026-05-03)

- ✅ congre.kr 도메인 가비아 등록 (1년)
- ✅ Resend 가입 + congre.kr 도메인 인증 (DKIM/SPF/DMARC)
- ✅ SOLAPI 가입 + 발신번호 등록 + API 키 발급
- ✅ .env.local 6개 변수 입력
- ✅ 시나리오 5/5건 발송 검증 완료 (event_created, render_completed, render_delayed, render_failed, render_started)
- ✅ notifications:history undefined 에러 수정 (commit bcfe1f3)
- ✅ SMS failedMessageList 상세 사유 출력 (commit 79af076)

### render_delayed 장애 대응 시나리오 재설계

배경: 편집 지연 시 단순 완료 사후 안내보다 비즈니스 임팩트가 큼 — 행사 중 상영 계획 무산, 결혼식 등 재현 불가 행사에서의 환불 사유, 완성본 미생성 가능성.

필요 작업: 단순 메시지 톤 수정이 아닌 다단계 알림 시나리오 설계.

결정 보류 사항 (다음 세션에서 합의 필요):
1. 지연 임계값 단계 분리 (예: 5분 감지 / 15분 상영 불가 확정 / 완성본 실패 3단계)
2. 이벤트 데이터에 행사 시각 정보 존재 여부 확인 — 시스템이 자동 판단 가능한지
3. 운영자 에스컬레이션 채널 (이메일·SMS → 슬랙 → 전화 단계별)
4. 고객 통보 시점과 주체 (자동 vs 운영자 확인 후 수동)
5. 환불·보상 정책의 알림 포함 여부

### 알림 시스템 Phase 2

- 시나리오 2건 트리거 연결 (첫 클립 업로드 → clips onCreate 훅, 참가자 결과 → 참가자 연락처 수집 선행 필요)
- 알림 자동 재시도 — 채널 실패 시 재시도 로직 (Vercel Cron or queue)

### 보안

- Firestore 보안 규칙 종합 점검 (clips create 검증, events update 권한 강화)
  - /api/render/start 인증 누락 (Authorization 헤더 + hostId 검증 추가 필요)
  - /api/render/complete 검증 강화 (Shotstack webhook 서명 검증 검토)

### 결제

- 유료 플랜 결제 (토스페이먼츠)

### 기타

- FCM 푸시 알림 — iOS 16.4+ 지원 확인 후 재검토

## 보류 중 (나중에 검토 필요)

- **글로벌 B2B 진출 시 도메인·브랜드 전략 재검토**
  - `congre.com`은 일본 컨벤션·행사 컨설팅 회사 보유 중 — 글로벌 진출 시 충돌 가능성
  - 옵션: 이름 유지 + 다른 TLD / 변형 이름 + .com / 새 이름 + .com / congre.com 인수
  - 결정 시점: 글로벌 진출 직전 (마케팅 본격화 전)

- **청첩장 글로벌 B2B 전략 검토** (별도 세션)

## 알려진 이슈

상세 추적은 [`known-issues.md`](./known-issues.md) 참조.

요약:
- `clipCount` permission-denied (무시 중, 기능 영향 없음)
