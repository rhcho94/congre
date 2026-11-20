# 핸드오프 2026-11-20 — 메타 광고 추적 준비 (꺼진 채)

> 작성: 코난(채팅 클로드) · 레포 `rhcho94/congre` · 브랜치 `feat/meta-tracking`(main `87c342c` 위 커밋 2개) · **main에는 아직 없다**
> 이 세션은 필드샷 Claude 프로젝트 대화에서 진행했다(Ray "똑같은 세팅을 congre.kr도 만들자"). 필드샷 쪽 원본: `rhcho94/congre-bible-mvp` DEC-13 · 핸드오프 2026-11-14.

## 한 줄

**필드샷과 같은 메타 광고 추적(픽셀 · 전환 API · 유입 정보 저장)을 콩그레 앱과 랜딩에 넣었다. 환경변수와 랜딩 ID가 비어 있어 아직 아무것도 수집하지 않는다. 남은 것은 Ray 최종 승인 → main 반영 → 메타 설정 → 켜기 → 테스트.**

## 커밋 (브랜치 `feat/meta-tracking`)

| 해시 | 내용 |
|---|---|
| `f6f4d7d` | docs(legal): 개인정보처리방침 v1.0 보완 — 메타 광고 성과 측정 (`src/app/privacy/page.tsx` · `docs/legal/CHANGELOG.md`) |
| 이 문서 커밋 | feat: 메타 광고 추적 추가 — 새 파일 4개 + 연결 4곳 + 문서 |

검증: `npx tsc --noEmit` 0, `npm run lint` 12 errors / 2 warnings(변경 전 같은 자리에서 잰 값과 같음). **`npm run build`는 코난 작업 공간에서 돌리지 않았다** — Ray PC에서 확인한다.

## Ray 결정 (2026-11-20)

1. 메타 데이터 세트는 콩그레용으로 새로 만든다.
2. 랜딩에도 픽셀을 넣는다. 랜딩과 앱은 합치지 않고 쿠키를 `congre.kr` 전체에서 함께 쓴다.
3. 참가자 화면은 뺀다.
4. 유료 이용자가 아직 없으므로 처리방침은 공지와 같은 날 시행.
5. 카카오 가입도 콩그레에 넣는다 — **메타 다음**, 별도 작업(아직 시작 안 함).

상세 · 필드샷과 다른 점 · 모르는 것은 `docs/decisions/infra.md` 2026-11-20.

## 앱에서 바뀐 것

- 새 파일: `src/lib/attribution.ts`(쿠키 `cg_attr`) · `src/lib/meta-capi.ts` · `src/components/MarketingTracker.tsx` · `src/app/api/user/signup-complete/route.ts`
- 연결: `src/app/layout.tsx`(추적 컴포넌트) · `src/app/signup/page.tsx`(가입 직후 `signup-complete` 호출, 실패해도 가입은 진행) · `src/app/api/events/route.ts`(이벤트 생성 알림) · `src/app/api/payment/confirm/route.ts`(결제 알림 — 새로 저장한 결제만)
- 문서: `decisions/infra.md` · `DECISIONS.md`(infra 12개) · `PROJECT.md` 환경변수 · `.env.local.example` 3줄 · `CHANGELOG.md` · `known-issues.md`(문구 묶음 10번)

## 랜딩에서 바뀐 것 (git 밖, Ray PC `C:\Users\PC\Downloads\congre\deploy`, **배포 전**)

- 새 파일 `visit.js`(65줄) — 맨 위 `PIXEL_ID`가 비어 있으면 아무것도 하지 않는다.
- `index.html` · `about.html` · `faq.html` · `pricing.html`의 `</head>` 바로 위에 `<script src="/visit.js" defer></script>` 한 줄씩.
- 백업: `index_pre_meta_backup.html` 등 4개(`*_backup.html` 규칙으로 배포 제외).
- 확인: 문법 검사 통과, 가짜 브라우저로 5가지 경우(ID 없음 / 광고 값 있음 / 없음 / 쿠키 이미 있음 / 로컬 주소) 동작 확인. **실제 브라우저에서는 열어 보지 않았다.**

## 남은 순서 (Ray 최종 승인 뒤)

1. **Ray PC CC**: 브랜치를 받아 `npm run build` · lint 확인 → main에 합쳐 push → Vercel 배포 확인. 이때 처리방침 보완이 운영에 게시된다(환경변수가 없으니 수집은 아직 없다).
   - **보완 일자**: 방침 머리말 · 부칙에 "2026년 11월 20일"로 적었다. 배포가 다른 날이면 그 날짜로 고친 뒤 배포한다.
2. **Ray(메타 이벤트 관리자)**: 데이터 세트 새로 만들기(이름 예: `Congre`) → 전환 API 토큰 만들기 → 설정 끄기: 자동 고급 매칭(8개 항목) · AI 자동 이벤트 · "상세한 페이지 및 제품 정보를 자동으로 포함". "고객 기기에서 전환 측정"은 필드샷과 같이 광고 집행 전에 정한다.
3. **Ray(Vercel 프로젝트 `congre`)**: `NEXT_PUBLIC_META_PIXEL_ID`(Config) · `META_CAPI_ACCESS_TOKEN` · `META_TEST_EVENT_CODE`(테스트 동안만)를 Production에만 넣고 재배포. Preview에는 넣지 않는다.
4. **랜딩**: `visit.js`의 `PIXEL_ID`에 같은 ID를 넣고 Ray PowerShell에서 배포(`npx --yes vercel@62.7.0 --prod --yes`).
5. **테스트(메타 이벤트 관리자 "이벤트 테스트")**: 랜딩 PageView · 앱 PageView(브라우저), CompleteRegistration · EventCreated(서버). 버튼 클릭 자동 수집(SubscribedButtonClick)이 안 들어오는지. 테스트 계정 `users` 문서에 `attribution` · `signupTrackedAt`. 광고 값을 붙인 랜딩 주소(`https://www.congre.kr/?utm_source=test&fbclid=test123`)로 들어가 가입까지 해서 **랜딩에서 생긴 쿠키가 앱 가입에 붙는지** 본다.
6. 확인이 끝나면 `META_TEST_EVENT_CODE`를 지우고 재배포, 테스트 계정 탈퇴.

## 모르는 것 · 확인 안 한 것

- 메타 이벤트 테스트는 하지 않았다(ID · 토큰이 없다). 필드샷에서 통과한 코드를 옮긴 것이지만 콩그레에서 돈 적은 없다.
- 메타 픽셀이 `_fbp` 쿠키를 `congre.kr` 전체 범위로 적는지 실물로 보지 않았다. 아니면 랜딩 방문과 앱 가입이 메타 쪽에서 덜 이어진다(우리 DB의 `attribution`은 영향 없음).
- `congre.kr` → `www.congre.kr` 넘김이 주소 뒤 광고 값을 보존하는지 미확인. 광고 도착 주소는 `https://www.congre.kr`로 건다.
- Purchase는 첫 실제 결제 때 확인(필드샷과 같음).
- 법무 검토 미수행(쿠키 동의 배너 필요 여부 등) — `docs/legal/CHANGELOG.md` 미확정.
- 처리방침 국외 이전 표의 AWS 리전 · Shotstack 행은 옛 상태 그대로다(known-issues 문구 묶음 3 · 10번). 이번에 고치지 않았다.

## 다음 세션 후보

1. 위 남은 순서 1 ~ 6.
2. 카카오 가입 추가(Ray 결정 5). 필드샷 구현은 전용 파일 7개 · 420줄 + 연결. 넣을 때 `api/user/signup-complete`와 같은 가입 완료 알림을 카카오 가입 경로에도 붙인다. 카카오 개발자 사이트 설정 · 환경변수 3개 · 처리방침 보완이 따라온다.
3. 랜딩을 git에 올리기(주소 · 배포 방식 그대로) — Ray가 "합칠 수 없어?"를 물었고 지금은 따로 두기로 했다.

## 학습

- 사이트가 둘로 나뉘어도 같은 상위 도메인이면 쿠키 범위 한 줄로 이어진다 — 합치기부터 떠올리기 전에 "무엇 때문에 합치려는가"를 먼저 가른다.
- 랜딩 폴더 접근 자동 요청은 거절된다. Ray가 데스크톱 앱 "Add folder"로 붙이면 코난이 직접 읽고 고칠 수 있다(필드샷 11/20 핸드오프와 같은 관찰).
