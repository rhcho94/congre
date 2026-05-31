# 2026-05-31 — 사이클 4 (1/2): 본 앱 14화면 랜딩 룩앤필 통일 + 라이브 배포

## 본 세션 한 줄 요약

직전 핸드오프(2026-05-30-v5-r10-pricing-deploy.md) 이어받음. 사이클 4의 **본 앱 리뉴얼(디자인 통일)** 파트 완료 → `app.congre.kr` (congre-three) 라이브 push. 정찰→결정→실행→검증 풀 사이클. 커밋 4개 push 완료. **버튼 연결 파트는 미착수** (사이클 4의 나머지 절반, 별도 트랙).

## 본 세션 커밋 (git, 전부 push 완료)

```
c4df447 style: make work screen background photo clearly visible
6065bc9 style: increase background photo visibility on work screens
088523c style: apply landing look & feel to all 14 app screens (tokens, components, bg photo)
8edd2b5 style: add Pretendard, swap design tokens to landing palette, define shared component classes
```
- origin/main = c4df447 (일치 확인). Vercel(congre-three) 자동 배포 트리거됨.
- 커밋 구조: 토대(8edd2b5) → 14화면(088523c) → 배경농도 조정 2회(6065bc9, c4df447). 출력 한도로 응답 분할했으나 각 커밋 독립 빌드 통과 (atomic 유지).

## 완료된 작업

### 디자인 통일 — 본 앱 14개 화면

새 랜딩(www.congre.kr) 룩앤필을 본 앱에 적용. **텍스트·흐름·버튼 동작 무변경, 디자인만.**

적용 토큰 (globals.css :root, 랜딩 실측값):
- 배경 #0c0b09, surface 3단계 #151310/#1e1a13/#28221a
- 골드 #c8892c, accent-hi #d99a3a, accent-soft #c8892c1f, warm oklch(0.68 0.16 35)
- 텍스트 #ede8df, muted #79716a, hairline rgba(237,232,223,0.07/0.14)
- radius 14/22/28, max-width 1240/1360, pad 32
- 기존 변수명(--surface, --border, --accent-bright)은 legacy 별칭으로 하위호환 (사용처 244곳/19파일이라 별칭 매핑 방식 채택)

폰트:
- **제목 = Pretendard Variable 700 normal (고딕).** CDN: jsdelivr orioncactus/pretendard@v1.3.9
- serif(브랜드 "Congre"만) = Cormorant Garamond italic + Noto Serif KR
- 한글 본문 = Pretendard 우선 + Noto Sans KR fallback
- layout.tsx에 Pretendard <link> 추가. Cormorant·DM Sans 유지.

공통 컴포넌트 클래스 (globals.css 정의, 14화면 공유):
`.display .eyebrow .btn(.btn-primary/secondary/quiet/kakao) .input .card .row .badge(.badge-live/done/draft) .hr`

배경 사진 (PageBackdrop.tsx 컴포넌트):
- deploy/images 4장 → public/images/bg-stage-a~e.png (5장, e는 a 재사용)
- 패턴별 고정 배정: A=a(birth) B=b(reun) C=c(dol) D=d(corp) E=e(birth)
- **첫인상 화면(a/e: 로그인·가입·verify·create·upload·share)**: 사진 또렷 (filter saturate0.9 brightness0.92, 오버레이 0.45→0.62→0.80). 폼은 글라스 패널 위.
- **작업/읽기 화면(b/c/d: dashboard·mypage·events·terms·privacy·guide×3)**: 사진 opacity 0.40 / blur 1px / saturate0.85 brightness1.0, 오버레이 0.30→0.45. 본문은 솔리드 .card 위. (초기 0.10이 너무 흐려서 0.22→0.40으로 2회 조정, 운영자 "딱 좋다" 확정)

화면별 특이사항:
- C 이벤트상세: 카카오 노랑 버튼을 btn-kakao(46px, 작게)로 위계 낮춤. 영상 다운로드 btn-primary 전체폭=주인공. 화질(1080p) 표시 안 함(필드 없음 확인).
- E 게스트: 장식 이모지 2건 제거(📹 촬영, 🎬 완료). 단계 로직(verifying~error 7단계) 무변경.
- 위험 버튼(마감/탈퇴)은 빨강 인라인 유지 — 위험 신호 보존.

### 14화면 = 15파일 (share가 page.tsx + ShareActions.tsx 2파일)
host, signup, verify-email, dashboard/create, dashboard, mypage, dashboard/events/[eventId], terms, privacy, guide, guide/host, guide/guest, upload/[eventId], share/[eventId](+ShareActions)

## 미착수 — 사이클 4 나머지 절반 (버튼 연결)

직전 핸드오프(v5-r10)의 버튼 연결 사양 9건은 **아직 미착수**. 디자인만 했고 흐름·연결은 안 건드림. 다음 작업 후보 1순위.

## 다음 작업 후보 (별도 트랙)

### 우선순위 높음
1. **버튼 연결** (사이클 4 나머지): 랜딩→본 앱 직행, 가격카드 CTA→플랜 자동선택, 사전예약 모달 UI 제거(백엔드 유지). v5-r10 핸드오프 사양 9건 참조. ※ 단 이 핸드오프의 랜딩↔본앱 연결은 www.congre.kr(별도 repo) ↔ app.congre.kr(본 repo) 관계 재확인 필요.
2. **옛 랜딩 `/` 삭제 + 그 자리 처리** (운영자 "지워버려" 결정). src/app/page.tsx (429줄, "이 순간을 영원히" 옛 랜딩). 삭제 후 `/`를 로그인/대시보드/redirect 중 무엇으로 할지 결정 필요. 디자인 통일 대상에서 제외했었음(어차피 삭제 예정).

### 우선순위 중간
3. **게스트 카피 개선**: /upload uploader 단계에 "여기가 영상 올리는 곳"이라는 맥락 없음. "이름과 전화번호를 입력해주세요…"만 있어 왜 입력하는지 불명. 게스트 흐름 전체 카피 한 번에 손보기 권장.
4. **dead code 정리**: host/page.tsx 안에 옛 dashboard/create view + mockEvents 잔재. 진짜 대시보드는 /dashboard. 이번에 디자인만 칠했고 삭제 안 함.
5. **dashboard 썸네일**: 현재 placeholder. 인트로 미디어에서 썸네일 추출 로직은 기능 작업이라 이번 제외.
6. **워터마크 본 앱 코드 구현**: 사양 확정됨(v5-r10). shotstack.ts createRender에 plan 인자, 무료플랜만 워터마크 트랙.

## 본 세션 학습 룰 후보 (격상 보류, 1회 관측)

1. **"토큰 변수 존재 ≠ 그게 쓰인다"** — 랜딩에 `--serif` 변수가 있다고 "제목=serif"로 단정해 CD 브리프에 박았으나, 실제 랜딩 Hero 제목은 Pretendard 700 고딕(.hero h1.display override)이었음. CD 시안도 그 잘못된 브리프 따라 명조로 나왔고, 운영자가 "랜딩과 다르다"고 잡아냄. → 토큰 명세는 변수 정의만 보지 말고 "실제 적용처"를 코드로 한 단계 더 검증. 운영자 눈 + 코드 grep 둘 다.

2. **CC 출력 한도 — 큰 작업은 처음부터 패턴별 분할 지시** — 14파일(~5,267줄) 한 커밋 지시했으나 CC 한 응답 출력 한도로 패턴(A~E)별 분할 진행 필요했음. CC가 두 번 멈춰 물음(작업량 알림 + 출력 한도). → 다음부터 10파일 넘는 일괄 작업은 처음부터 "패턴별 응답 분할, 커밋은 끝에 1번" 형태로 지시.

3. **`rm -rf .next`를 dev 서버 도는 중 실행 금지** — CC가 빌드 검증하려 dev 가동 중 .next 삭제 → Turbopack 캐시 손상 메시지. 페이지 응답은 200 정상이었으나 hot reload 불확실. → dev 도는 중엔 캐시 건드리지 말 것.

## 다음 세션 진입 컨텍스트

- 본 앱 디자인 통일 완료 + 라이브(app.congre.kr) push 완료
- 커밋 4개 (위), origin/main = c4df447
- 사이클 4 = 디자인(완료) + 버튼연결(미착수) 두 파트. 버튼연결이 다음 1순위
- 별도 트랙 6건 (위)
- 제목 폰트 = Pretendard 700 (CD 명세의 명조 italic은 폐기 결정 — 다음 클로드 헷갈리지 말 것)
- PageBackdrop.tsx = 배경 사진 컴포넌트. 패턴별 농도 분기. 값 조정은 여기 한 곳.

운영자 다음 세션 첫 메시지에 포함:
- 본 핸드오프 첨부
- 작업 영역 명시 (버튼연결 / 옛랜딩삭제 / 게스트카피 / 워터마크 중 택1)
- 라이브(app.congre.kr) 실측 결과 (디자인 반영 확인됐는지)

## 작업 요약 (한 줄)

본 앱 14화면을 새 랜딩 룩앤필로 통일 (Pretendard 고딕 제목 + 골드 토큰 + 배경사진 + 컴포넌트 클래스), 커밋 4개 app.congre.kr 라이브 push 완료. 사이클 4 버튼연결 파트는 다음 세션.
