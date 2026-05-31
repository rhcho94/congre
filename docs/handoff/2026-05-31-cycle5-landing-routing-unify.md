# 2026-05-31 — 사이클 5: 본 앱 루트 정리 + 로고/링크 동선 일원화

## 본 세션 한 줄 요약

옛 본 앱 랜딩(`/`) 삭제에서 출발해 세 갈래로 번짐: (1) `/` → `/host` 서버 리디렉트, (2) 앱 내 로고·홈버튼 18곳 → 외부 랜딩 `congre.kr` 연결, (3) 그 결과 드러난 랜딩 푸터 약관·개인정보 404 수정. 본 앱 2커밋 + 랜딩 1배포 + docs 2커밋. 전부 라이브 실측 통과.

## 본 세션 커밋 / 배포

본 앱 repo (git):
- `ba583ea` refactor: replace old landing at / with redirect to /host
- `371bb62` feat: link logo and home buttons to external landing (congre.kr)
- `98e917f` docs: record landing footer terms/privacy link fix + CD zip overwrite caveat
- `6325ef0` docs: correct landing decisions index count

랜딩 트랙 (git 외부):
- 배포 `dpl_9QmSYY5pDJzELxPHPnxiGZv4j86d` (READY) — deploy/index.html 푸터 약관·개인정보 4건 절대경로화

## 본 세션 결정

1. **본 앱 루트 `/` = `/host` 서버 리디렉트** (옛 랜딩 삭제). `next/navigation` `redirect()`. 마케팅은 `congre.kr`, 앱은 `app.congre.kr`로 역할 분리. `/host`가 로그인 사용자를 `/dashboard`로 자동 전달(코드 확인 host/page.tsx:89)하므로 리디렉트 한 줄로 모든 경우 처리.
2. **앱 내 로고·홈버튼 = 외부 랜딩 `congre.kr`로** (옵션 A). 로고 12 + "← 홈"류 6 = 18곳. `<Link href="/">` → `<a href={LANDING_URL}>`, 같은 탭. URL은 `src/lib/constants.ts`의 `LANDING_URL` 상수(환경변수 아님 — 안 바뀌는 값, YAGNI).
3. **회원 탈퇴 후 이동 = `/host` 명시** (마케팅 랜딩 아님). mypage:201.
4. **랜딩 푸터 약관·개인정보 = 본 앱 절대경로** (옵션 A). `https://app.congre.kr/terms`·`/privacy`. 약관 단일 소스(본 앱) 유지, 랜딩 중복 페이지 안 만듦. decisions/landing.md (12).

## 본 세션 발견 / 사고

- **lint errors 103건 baseline** (기존부터 존재, 본 작업 무관). 변경 영역 밖(verify-email, notifications/sms 등). known-issues 등록. 검증 게이트를 "errors 0" → "신규 error 추가 0(delta)"으로 운영자 승인.
- **OneDrive `.next` 잠금(L6) 실제 발현 2회**. `npm run build` 1차 EPERM → `rm -rf .next` 후 통과. 그간 "잠재 리스크"였던 게 이번에 실발현. 빈도 잦아지면 본 앱 폴더 OneDrive 밖 이전이 표준 답.
- **랜딩 푸터 약관·개인정보 라이브 404** — 랜딩 `deploy/`에 terms.html·privacy.html 없음 + 상대경로 `/terms`·`/privacy`가 자기 도메인 가리켜 404. 본 세션 수정으로 해소(라이브 200 실측).
- **landing.md 편집 손상 사고(복원됨)** — 신규 항목을 맨 위에 끼우는 Edit에서 기존 (10) 헤더를 삼켜 본문 뒤섞임. 즉시 복원, 최종 헤더 15개 정합 확인, 커밋엔 정상 상태만. docs엔 build 게이트 없어 위험했던 순간.
- **DECISIONS 인덱스 landing 수 불일치** — 표기 10(→작업 중 11)이나 실제 ## 15개. 6325ef0에서 15로 정정.

## 미완 / 다음 작업 후보 (다음 세션 1번은 운영자가 택)

### 우선순위 높음
1. **lint errors 103건 정리** — 본 세션 발견. 독립 트랙. **정찰부터**(103건 종류별 분류: 자동수정 가능 / 코드 로직 확인 필요 / 의도적). lint 수정은 "안전한 빼기"가 아니라 실제 동작 건드릴 수 있어 검증 무거움. known-issues "본 앱 lint errors 103건" 항목 참조.
2. **워터마크 본 앱 구현** — 사양 확정(40px/0.40, Cormorant italic #c8892c 우하, 무료 플랜만). shotstack.ts createRender + plan 전달 + 무료 전용 워터마크 트랙 + Cormorant ttf. 렌더 파이프라인 핵심부, 검증 무거움.

### 우선순위 중간
3. **게스트 카피 개선** — /upload uploader 단계 맥락 부족.
4. **dead code 정리** — host/page.tsx 옛 dashboard/create view + mockEvents.
5. **dashboard 썸네일** — placeholder, 인트로 미디어 썸네일 추출.

### 랜딩 트랙 (별도, CD 경유)
- **known-issues L8 주의**: 이번 푸터 약관·개인정보 4줄 수정은 git 외부 직접 수정분. 다음 CD 랜딩 zip 풀어덮기 시 사라져 404 재발 가능. zip 적용 후 푸터 href가 `app.congre.kr` 절대경로인지 확인 의무. 근본 해소 후보: CD 원본에 절대경로 반영 / 랜딩에 terms·privacy.html 추가.

## 본 세션 학습 룰 후보 (격상 보류, 1회 관측)

1. **기술 게이트 통과 ≠ 사용자 동선 검증**. build·lint·"링크 안 죽음"이 다 통과해도 "사용자가 가려던 곳으로 가는가"는 별개. 로고 리디렉트가 "깜빡 제자리" 도는 걸 실측 전엔 못 잡음. 실측 항목을 "안 죽었나"가 아니라 "원하는 곳 가나"로.
2. **링크 도착지를 외부 사이트로 바꿀 땐 그 도착 사이트 자체 점검도**. 출발점(앱 로고)만 고치고 도착점(랜딩 푸터) 상태를 안 봐서 404가 사각지대로 남음.
3. **docs 신규 항목 "맨 위 삽입" Edit는 헤더 앵커가 위험**. 기존 헤더를 old_string에 넣으면 삼켜질 수 있음. 헤더 바로 위 빈 줄/구분선을 앵커로 잡는 게 안전. docs엔 build 게이트가 없어 손상이 그냥 커밋될 수 있음.
4. **CC가 git 외부 경로(deploy/) 접근·수정 가능** — 이번에 확인됨. 단 랜딩 변경 원칙은 CD 경유라, CC 직접 수정분은 git 외부 = CD zip에 덮일 위험. 직접 수정 시 known-issues에 기록 의무.

## 다음 세션 진입 컨텍스트

- 본 앱 루트 동선 정리 완료: `/` → /host, 로고/홈 → congre.kr, 탈퇴 후 → /host. 앱 내 `href="/"` 0개.
- 로그인 경로는 `/host`(login 폴더 아님), 가입은 `/signup`. 약관·개인정보는 본 앱에만 존재(`app.congre.kr/terms`·`/privacy`).
- lint 103 baseline 깔려 있음 — 다음 lint 작업 시 "신규 0" 기준 또는 정리 착수.
- 운영자 다음 세션 첫 메시지: 본 핸드오프 첨부 + 작업 영역 명시(lint정리 / 워터마크 / 게스트카피 중 택1). lint 택 시 정찰부터.

## 작업 요약 (한 줄)

옛 본 앱 랜딩 삭제 → /host 리디렉트 + 로고/홈버튼 18곳 외부 랜딩 연결 + 랜딩 푸터 약관·개인정보 404 수정. 본 앱 2커밋 + docs 2커밋 + 랜딩 1배포, 전부 라이브 실측 통과. 마케팅(congre.kr)·앱(app.congre.kr) 역할 분리 동선 완성.
