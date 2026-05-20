# 핸드오프 — S2-04 P2 마이페이지 프로필 수정

날짜: 2026-05-20
세션: S2-04 P2

## 완료 작업

### 코드
- `src/app/mypage/page.tsx` — 프로필 수정 UI 추가
  - `editMode` 상태 토글 (이름·전화번호 입력 ↔ 읽기 표시)
  - `handleSave()`: 빈 값 검증 → `updateUserDoc` 호출 → 로컬 상태 갱신 → alert
  - "프로필 수정" 버튼은 `userDoc !== null`일 때만 표시
  - `saving` 상태 중 입력 disabled + 버튼 텍스트 변경
  - catch 블록 `console.error("[mypage] updateUserDoc failed:", err)` 포함

- `src/lib/users.ts` — `updateUserDoc` 함수 추가
  - `updateDoc(doc(db, "users", uid), { name, phone })`
  - `updateDoc` import 추가

- `firestore.rules` — users update 규칙 추가
  - `request.resource.data.diff(resource.data).affectedKeys().hasOnly(['name', 'phone'])`
  - name·phone 필드만 수정 허용, 본인 doc만

### 문서
- `docs/CHANGELOG.md` — 2026-05-20 S2-04 P2 항목 추가
- `docs/PROJECT.md` — 마이페이지 P1 → P1·P2
- `docs/launch-roadmap.md` — P2 행 완료 표기, 추천 진행 순서 5번 갱신

## Firestore 규칙 배포 필요 (운영자 수동 작업)

git push만으로 실 Firestore에 미반영. 다음 중 하나 실행:

**옵션 A (콘솔):** Firebase Console → Firestore → Rules 탭 → `firestore.rules` 내용 붙여넣기 → 게시

**옵션 B (CLI):** `firebase deploy --only firestore:rules`

배포 전까지 프로필 수정 시 Firestore에서 permission-denied 에러 발생.

## 다음 작업 후보

| 순위 | 작업 | 비고 |
|---|---|---|
| 1 | S2-04 P3 비밀번호 변경 | `updatePassword` + 현재 비밀번호 재인증 필요 |
| 2 | S2-04 P4 회원 탈퇴 | Auth 삭제 + Firestore users 삭제 |
| 3 | S4-09 완성본 보존 정책 | DECISIONS 사양 확정, 영업 차단 우려 |
