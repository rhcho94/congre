# 로드맵 / 백로그 / 알려진 이슈

## 진행 중

- (현재 진행 중인 작업 없음)

## 다음 작업 후보

### 알림 시스템 실제 연결 (API 키 발급 + 테스트)

- congre.kr 도메인 등록
- Resend 가입 + congre.kr 도메인 인증 (DNS 전파 1~2시간)
- SOLAPI 가입 + 발신번호 등록 (영업일 1~2일)
- .env.local에 RESEND_API_KEY, SOLAPI_* 키 입력
- 알림 시나리오 5건 실제 발송 테스트

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
