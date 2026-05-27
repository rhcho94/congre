# Handoff — 2026-05-20 v3: S2-04 마이페이지 P3·P4 완료 + docs 정리

## 세션 완료 항목

### S2-04 P3 — 비밀번호 변경
- `src/lib/auth.ts`: `changePassword(currentPassword, newPassword)` 함수 추가 (reauthenticate + updatePassword)
- `src/app/mypage/page.tsx`: 비밀번호 섹션 UI 추가 (Eye/EyeOff 토글, 현재·새 비밀번호 입력, auth/wrong-password 처리)

### S2-04 P4 — 회원 탈퇴
- `src/lib/auth.ts`: `deleteAccount(currentPassword)` 함수 추가 (reauthenticate → API POST → signOut)
- `src/app/api/user/delete/route.ts`: 신규 API 라우트 (Admin SDK — 진행 중 이벤트 차단 + 클립/이벤트/사용자 일괄 삭제)
- `src/app/mypage/page.tsx`: 회원 탈퇴 섹션 UI 추가 (INCOMPLETE_EVENTS 차단 메시지 + confirm 다이얼로그)
- `src/app/terms/page.tsx`: v0.2 개정 — 제18조 본문 교체 (5단락 탈퇴 정책 명시) + 부칙 v0.2 추가
- `src/app/privacy/page.tsx`: v0.2 개정 — 제3조 ⑤항 추가 (탈퇴 시 일괄 삭제) + 부칙 v0.2 추가
- `docs/decisions/legal.md`: 2026-05-20 결정 2건 추가
- `docs/legal/CHANGELOG.md`: [0.2] 섹션 추가

### docs 정리 (코드 변경 없음)
- `docs/known-issues.md`: 회원 탈퇴 데드락 항목 등재 + 네이버 메일 갱신 (2026-05-20)
- `docs/decisions/auth-model.md`: P3d DNS 검증 완료 + Gmail 실측 확인 내용 보완
- `docs/CHANGELOG.md`: P3d 검증 완료 항목 추가 (2026-05-20)
- `docs/PROJECT.md`: 완료된 기능 — Firebase Auth 커스텀 이메일 발신 도메인 항목 추가

## 알려진 이슈 — 회원 탈퇴 데드락 (다음 세션 우선 결정 필요)

클립 0개로 마감(close)한 이벤트는 렌더링이 시작되지 않아 `closed` 상태로 영구 정체. 탈퇴 차단 조건에 `closed`가 포함돼 있어 호스트가 해당 이벤트를 없애지 않으면 탈퇴 불가.

해결 옵션 (결정 미완):
1. 차단 범위 축소 — `closed`를 차단 대상에서 제외 (클립 있는 closed는 race 가능성)
2. 자동 done 전환 — 클립 0개로 마감 시 즉시 done 처리
3. 호스트 이벤트 삭제 기능 추가

임시 우회: Firebase 콘솔 → Firestore → events 컬렉션 → 해당 문서 직접 삭제

## 현재 커밋 상태

- `eab4f5f` — docs: P3d 검증 완료 반영 + P4 회원 탈퇴 데드락 known-issues 등재
- `3398b52` — 이전 커밋 (S2-04 P4 완료)

## 다음 후보 작업

- 회원 탈퇴 데드락 해결 (3개 옵션 중 결정 필요)
- launch-roadmap 확인 후 다음 트랙 진입
