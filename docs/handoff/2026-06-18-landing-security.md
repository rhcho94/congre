# 2026-06-18 핸드오프 — 라이브 랜딩 문구 정합 + 보안 점검·수정

## 한 줄 요약
라이브 랜딩(congre.kr)의 허위 수치·거짓 동작서술을 실측·"자동" 톤으로 정합(배포 완료) + Claude Code 보안 점검으로 나온 취약점 4건 수정(코드 2커밋 push + firestore.rules 콘솔 게시, 실폰 검증까지 완료).

## 본 세션 커밋
- (랜딩) git 외부 트랙 — `deploy/index.html` 직접 수정 후 `npx vercel --prod`. 저장소 커밋 없음.
- `<코드커밋>` feat(security): presign·clips/check에 sessionToken·호스트 ID 토큰 검증 추가
- `0a83224` feat(security): firestore.rules clips 완전 차단 + events create hostId 강제·update 잠금
  - push: `db94a2c..0a83224 main -> main`
- ※ 코드커밋 해시는 CC push 보고에 있음(이 문서엔 미기재) — 필요 시 `git log`로 확인.

---

## 트랙 1 — 라이브 랜딩 문구 정합 (git 외부)

### 배경
FGT로 외부 실사용자가 곧 공개 랜딩을 거치는데, 라이브에 허위·과장 문구가 살아 있었음. 카드뉴스는 직전 세션에 실측값으로 교체했으나 라이브 랜딩은 미반영 상태였음.

### 한 것 (deploy/index.html, 라이브 배포 완료)
- **그룹 ① 허위 수치 제거**: "1,200+ 학교"(거짓) → 능력치 문구("100개 클립이 한 편으로"). "8분"(옛값) → "10분"(카드뉴스 실측과 정합). 히어로·비교 섹션·SVG 스톱워치·하단 통계 블록·주석까지.
- **그룹 ② 거짓 동작서술 교체**: "올리는/올라오는 순간 편집/완성", "실시간으로 만든다" 류 → "마감하면/마감 후 자동" 톤. **실제 동작은 마감 버튼 후 일괄 렌더**이지 올리는 순간 편집이 아님(§ 사실 근거: 핸드오프 2026-06-17 §3 B3).
  - 카톡 공유 메시지(Web Share API text)도 "올리면 자동 완성" → "올리고 마감하면 자동 완성"으로 교체(외부로 퍼지는 문구라 중요).
- **그룹 ③ 유지(의도)**: "AI" 브랜딩, "LIVE FEED"·"실시간 업로드/수집"은 손대지 않음. **참가자 업로드는 실제로 실시간이라 사실**. AI는 마케팅 관용어로 거짓 아님 판단.

### 백업
CC가 편집 전 `deploy/index.html.bak` 생성(git 외부라 롤백 안전장치). 보존/삭제는 Ray 재량.

### 비차단 잔재 (Ray 판단: 그냥 둠)
- L3464 `<b>마감 즉시</b><span>마감하면 …</span>` — "마감" 연달아 반복. 거짓 아님, 미세 어색. **수정 안 하기로 결정**.

### 다음 세션 주의
- 랜딩은 git 외부 트랙 → 변경이 저장소에 자동 기록 안 됨. "현재 라이브 문구"가 쟁점이면 라이브를 직접 fetch(1차 소스).

---

## 트랙 2 — 보안 점검·수정 (본 앱, git)

### 점검 방법
- CC `/security-review`는 diff 기반이라 clean tree에서 "볼 게 없음"으로 나옴(도구 범위 한계, 실패 아님). → **fallback: 전체 코드베이스 점검** 일반 지시로 4영역(presigned URL / Firestore 규칙 / 결제 가드 / 인증·소유권) 병렬 감사.
- 결과: High 5 + Medium 다수. **결제 가드는 No findings**(FGT 핵심 안전장치 검증됨).

### 수정한 것 (FGT 전 필수 + 개인정보 1건 = 4건)
1. **presign 무인증** → kind 분기 인증: clip/thumb는 `sessionToken === events.sessionToken` + `status==="open"`, intro/outro는 `verifyIdToken` + `hostId===uid`.
2. **presign path traversal** → fileName 화이트리스트 `/^[A-Za-z0-9._-]+$/` + kind별 확장자(clip=mp4/mov/webm, thumb=jpg, intro/outro=형식 미확정이라 제한 생략). 클라이언트는 비ASCII(한글 파일명) `_` 치환 후 전송.
3. **firestore clips 무차별 수정·삭제** → `clips: read,create,update,delete: if false` 완전 차단(모든 clip mutation은 Admin SDK 경유라 무해).
4. **clips/check 무인증 enumeration** → `?token=` 필수, sessionToken 일치 검증.
- (보너스) firestore events: create에 `hostId==auth.uid` 강제, update `if false` 잠금(events 갱신은 전부 Admin 경유 확인).

### ★ firestore.rules는 push만으로 미적용 (절대 규칙)
- 커밋·push는 저장소에만. **실 적용은 Firebase 콘솔 Rules 탭에서 게시 필요.**
- 이번 세션에 콘솔 게시 완료 + 실폰 검증(이벤트 생성·클립 업로드·인트로/아웃트로 정상) 통과.

### 게이트 판정 메모
- lint baseline = 11 errors / 3 warnings(React 19 strict, Next 16 누적). 이번 변경 **delta-0**(stash 검증). 커밋 룰대로 통과. CLAUDE.md "errors 0" 문구는 baseline 합의 이전 표현이라 stale.

### 미수정(의도적, FGT 무관 — Ray 결정: 깔끔하게 그냥 둠)
- B·C 그룹(presign 업로드 용량 제한 없음, render/start Shotstack 소스 URL 24h, render/status Low 무인증)은 FGT 직접 위협 약함. **후속 후보로 남기지 않고 종결.** 필요 시 이 핸드오프에서 재발굴.

---

## 미완 작업
- 없음. 두 트랙 모두 배포·게시·실측까지 닫힘.

## 다음 세션 후보 (우선순위)
1. **(高) FGT 실제 실행** — 코드·보안·랜딩 준비 끝. 운영 결심 영역(실사용자·행사 섭외).
2. **(中) 라이트 테마 마무리 트랙** — glassPanel 인라인 4곳→.glass-panel 통합(정찰 대기) + 앰버 잔재 2건(.glow-accent, PROJECT.md 문구) + .card 가독성 1곳.
3. **(중) 커뮤니티 카드뉴스 게시** — CD 최종 PNG export → 블로그·카페(운영자 행동 영역, 직전 세션 이월).
4. **(blocked) 결제 Phase 3** — 토스 인증(~1개월) + 통신판매업 신고 대기.

## 정리 후보 (비차단)
- `C:\projects\congre\tmp-pricing-variants.html` — 추적 안 된 임시 가격 시안. 보안 작업 무관. 삭제/이동 여부 Ray 재량.

## 본 세션 학습
- **diff 기반 도구를 전체 점검에 쓰면 빈손**: `/security-review`는 clean tree에서 무소득. 전체 점검은 일반 지시 fallback이 표준(메모리에도 기록됨).
- **인증 추가 시 "정상 경로가 안 깨지는지" 정찰이 핵심**: clips는 전부 Admin 경유라 `if false`가 가장 안전. 정찰 없이 잠갔으면 정상 기능 사고 가능성. "구멍 막다 기능 죽이기"가 더 큰 사고.
- **서버 화이트리스트는 클라 정규화와 짝**: 호스트 한글 파일명이 서버 화이트리스트에 걸려 정상 업로드 막힐 뻔 → 클라 sanitize로 짝 맞춤.
- **함수명 기억 추측 금지**: `uploadFileViaPresignedUrl`로 잘못 기억(실제 `getPresignedUrl`). 코드 직접 안 본 식별자는 정찰로 확인.
