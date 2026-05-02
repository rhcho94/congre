# 로드맵 / 백로그 / 알려진 이슈

## 진행 중

- (현재 진행 중인 작업 없음)

## 다음 작업 후보

- Firestore 보안 규칙 종합 점검 (clips create 검증, events update 권한 강화, 추적 가능 인프라 구축)

- 알림 시스템 Phase 2 — 시나리오 2건 트리거 연결 (첫 클립 업로드 → clips onCreate 훅, 참가자 결과 → 참가자 연락처 수집 선행 필요)
- 알림 자동 재시도 — 채널 실패 시 재시도 로직 (Vercel Cron or queue)
- 유료 플랜 결제 (토스페이먼츠)
- FCM 푸시 알림 — iOS 16.4+ 지원 확인 후 재검토

## 알려진 이슈

상세 추적은 [`known-issues.md`](./known-issues.md) 참조.

요약:
- `clipCount` permission-denied (무시 중, 기능 영향 없음)
