# 2026-06-01 — 게스트 흐름 스트립(FlowStrip) + 초대 링크 OG 카드

## 본 세션 한 줄 요약
게스트 업로드 화면에 4단계 흐름 안내 스트립(FlowStrip) 추가, 게스트 초대 링크의 카카오/SNS 미리보기 카드를 호스트·행사 이름 동적으로 만듦. OG 카드는 코드는 맞았으나 Vercel이 커밋 하나를 자동배포 누락 → 빈 커밋 재푸시로 해결.

## 본 세션 커밋
- 8f1d332 feat: add flow guide strip to guest upload screen (FlowStrip.tsx 신규 + page.tsx 첫방문 삽입)
- 238c3cd feat: add dynamic OG card for guest invite link (upload/[eventId]/layout.tsx 신규 generateMetadata)
- 0e55a71 chore: trigger redeploy for OG card (238c3cd missed by Vercel) (빈 커밋, 배포 트리거용)

## 본 세션 결정/발견
- FlowStrip: CD app-restyle/Flow Strip.html 자산을 React+Tailwind로 변환. 4단계(이름·번호/촬영/올리기/링크 받기), 첫 방문(!isReturning)만 노출. 인라인 SVG, 외부 의존성·전역 CSS 0. Noto Sans KR 화면 폰트 별도 로드 안 함(주변 한글과 동일 fallback). decisions/misc.md 2026-06-01.
- OG 카드: /upload/[eventId]/layout.tsx server-side generateMetadata. events.title + users.name 2회 Admin 조회. "${hostName}님이 초대했어요 · ${title}" + "짧은 축하·소감·챌린지 영상을 올려주세요". hostName 12자/title 20자 절단. decisions/data-flow.md 2026-06-01.
- page.tsx가 "use client"라 같은 폴더 server layout.tsx에 generateMetadata 분리하는 변형 패턴 채택 — 정상 작동 확인됨(curl로 og:title 동적값 검증).
- OG 미반영 원인 = Vercel 자동배포가 238c3cd 단발 누락. 다른 커밋은 다 정상 배포됨. 빈 커밋 재푸시로 깨워 해결. curl 빌드ID 변경(ZNdN→j4fn)으로 적용 확인.
- 검증 경로: curl로 프로덕션 OG 직접 확인이 카카오 디버거·캐싱보다 확실. 카카오 카드는 디버거 "캐시 초기화" 후 갱신.

## 본 세션 학습
- 배포 커밋은 추론 금지, Vercel Deployments에서 해시 직접 확인. 화면에 기능 보인다고(FlowStrip) 그 뒤 커밋(OG)까지 배포된 건 아님.
- "데이터가 시스템에 있다"와 "이 코드 경로에서 바로 쓸 수 있다"는 다름. hostName도 게스트 화면 경로엔 있었으나 메타 경로엔 없어 재조회 필요했음.
- 화면 카피·시각은 코드 통과가 아니라 실측으로 확정. OG는 카톡 실제 카드까지 봐야 끝.

## 미완 / 다음 세션 후보
1. (보류했던) 모바일 레이아웃 줄밀림·치우침 — 정찰 안 함. 깨지는 화면 폰 스샷부터.
2. 문자(SMS) 커버 — OG는 카톡 전용. "링크 복사" 텍스트에 문장("○○님이 초대...") 넣을지. YAGNI 검토.
3. lint 11건(react-hooks) baseline 보류 — 출처/타당성 미확인. 한번 점검.
4. decisions/data-flow.md 2026-06-01 결정문 깨진 줄 1개 복원(직전 핸드오프 메모).
5. dead code 정리(host/page.tsx), dashboard 썸네일 — 기존 후보 유지.

## known-issues 추가 메모
- Vercel 자동배포 단발 누락: push 됐는데 Vercel Deployments에 해당 커밋 안 뜸. 다른 커밋은 정상. 처치: git commit --allow-empty -m "..." && git push로 깨움. 반복 시 Vercel↔GitHub 웹훅 점검.
