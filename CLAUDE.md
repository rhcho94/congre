@AGENTS.md

---

# Congre — 프로젝트 작업 규칙

이 파일은 Claude Code(이하 CC)가 자동으로 읽는 컨텍스트 파일입니다. 채팅 클로드(claude.ai)와 Claude Design(이하 CD)은 자동 로드 안 되므로 운영자가 새 세션 시작 시 직접 첨부해야 합니다.

## 프로젝트 개요

다수 참가자가 폰으로 짧은 인터뷰 영상(인당 10초 이내)을 올리면 자동 편집해 하나의 회고 영상으로 만들어주는 서비스. 1순위 시장은 초·중·고 졸업식. 보조 시장은 결혼식·기업 행사·동창회.

상세 사양은 `docs/PROJECT.md` 참조. **작업 시작 전 PROJECT.md 해당 섹션을 먼저 읽어주세요.**

## 환경 정보

### 본 앱 (Next.js)
- 로컬 경로: `C:\projects\congre`
- GitHub: `rhcho94/congre`
- 배포: Vercel 프로젝트 `congre`, 커스텀 도메인 `https://app.congre.kr`
- DB: Firebase 프로젝트 `congre-mvp` (Firestore + Auth)
- 스토리지: AWS S3 버킷 `congre-mvp-videos`
- 영상 편집: Shotstack (production 키)

### 랜딩 페이지 (정적 HTML)
- 로컬 경로: `C:\Users\PC\Downloads\congre\deploy`
- GitHub: 없음 (git 외부). 변경 이력은 Vercel Deployments 탭이 유일
- 배포: Vercel 프로젝트 `congre-landing`, 도메인 `https://congre.kr` + `https://www.congre.kr`
- 자산: `deploy/videos/` (영상 5개) + `.image-slots.state.json` (이미지 41장 base64)

## 기술 스택

본 앱: Next.js (App Router) + TypeScript, Tailwind v4 (config 없음, @import 방식), Firebase, AWS S3, Shotstack, Vercel.

랜딩: 단일 `index.html` + 인라인 CSS/JS + `image-slot.js` (이미지 슬롯 컴포넌트). 정적 호스팅.

폰트: 본문 Pretendard, 디스플레이 Cormorant Garamond italic, 한글 NotoSansKR (영상은 `public/fonts/NotoSansKR-Regular.ttf`).

주요 의존성·환경변수는 `docs/PROJECT.md` 참조.

## 자주 쓰는 명령어

### 본 앱
- `npm run dev` — 로컬 개발 서버 (http://localhost:3000)
- `npm run build` — 프로덕션 빌드 (커밋 전 필수 통과)
- `npm run lint` — ESLint
- `npx firebase emulators:start --only firestore` — Firestore 보안 규칙 테스트 (사전 조건: Java)

### 랜딩
- `cd C:\Users\PC\Downloads\congre\deploy && npx vercel --prod --yes` — 프로덕션 배포

## 작업 트랙 (두 트랙 분리)

본 앱과 랜딩은 별도 트랙. 한 사이클에서 두 트랙 섞지 말 것.

| 항목 | 본 앱 트랙 | 랜딩 트랙 |
|---|---|---|
| 코드 형태 | Next.js 컴포넌트 분산 | 단일 index.html |
| 형상관리 | git (`rhcho94/congre`) | git 외부 (현재) |
| 변경 도구 | CC (직접 코드 수정·커밋) | CD에서 zip 생성 → 로컬 풀어덮기 |
| 배포 트리거 | git push → Vercel 자동 | `npx vercel --prod --yes` 수동 |
| 도메인 | app.congre.kr | congre.kr, www.congre.kr |

트랙 간 영향 작업 예외: 디자인 토큰 변경, 도메인 정책 변경, 본 앱 URL이 랜딩 푸터에 노출되는 경우. 이때만 두 트랙 동시 작업.

## 세 클로드 영역 구분

각 클로드는 컨텍스트 격리. 한 클로드가 본 것은 자기 채팅창에 직접 입력된 것 + 자기가 접근 가능한 도구로 가져온 것뿐. 운영자가 다리 역할.

| 클로드 | 위치 | 역할 |
|---|---|---|
| 채팅 클로드 | claude.ai (웹·앱) | 계획·정찰·결정·핸드오프 작성·검증 |
| CD (Claude Design) | claude.ai/design (좌측 사이드바 팔레트 아이콘) | 시각적 디자인 생성·반복 (주로 랜딩) |
| CC (Claude Code) | 로컬 터미널 | 코드 작성·커밋·배포 (주로 본 앱) |

**핵심 룰**: 결정·실행·기록은 영역별로 분리. CD 안에서 시각·결정·실행·기록 다 섞지 말 것 — CD turn 한도 도달 시 휘발됨. 결정은 채팅 클로드에 알려 docs에 기록, 실행은 CC, 시각은 CD.

CD ↔ CC 연동: CD Export → "Handoff to Claude Code" 명령 또는 zip. 명령은 CC 터미널에 붙여넣어 적용. 운영자가 다리.

CD 자체 학습 자료: https://support.claude.com/en/articles/14604416-get-started-with-claude-design

## 사용자 컨텍스트

**운영자는 1인 비개발자 출신 초보자입니다.** 코드 직접 수정하지 않으며 채팅 클로드·CD·CC와 프롬프트로 협업.

- 개발 용어 처음 나올 때 짧게 풀어 설명 (비유 포함)
- 영어 기술 용어는 한국어로도 한 번 풀어주기
- 외부 작업(GitHub, Vercel, 카카오, 가비아 등)은 메뉴 트리 + 단계별 안내
- 결과 보고에 숫자(파일 수, 라인 수, 커밋 해시) 포함 시 자체 검증 한 번 더
- 모르는 영역은 추측으로 메우지 말기. "확실하지 않다" 또는 "본 적 없다"고 명시

## 작업 원칙

### 큰 작업 분해
정찰 → 사용자 승인 → 실행 → 검증 순서. 한 번에 다 하지 말기. 사용자가 "분석만 보고" 지시 시 파일 수정 금지.

### Atomic 커밋
한 커밋은 하나의 논리적 변경 단위. 빌드 깨진 채 중간 커밋 금지. 관련 docs 갱신도 같은 커밋에 포함.

### YAGNI
지금 요구사항에 없는 기능·추상화·에러 핸들링 추가 금지.

### 검증 게이트 (커밋 전 필수)
본 앱 atomic 커밋 전:
1. `npm run build` — 빌드 통과
2. `npm run lint` — errors 0 (warnings 개수 기존과 동일)

랜딩 atomic 변경 전:
- `index.html` 브라우저 로컬 점검 (`python3 -m http.server` 또는 VS Code Live Server)
- 배포 후 운영자 폰·PC 실측 검증

### 사용자 명시 지시 외 자동 진행 금지
큰 작업을 단계로 나눠 진행할 때, 사용자가 "다음 단계 검토 멈춤" 같은 멈춤 지시를 했다면 그대로 멈춤. 결과가 OK일 것 같아 보여도 자체 추론으로 다음 단계 진행 금지.

### 보고 검증
- 숫자(파일 수, 라인 수, 커밋 해시) 포함 시 보고 전 실제 값 확인. 추정치 보고 금지.
- 커밋 전 `git status` 필수. 의도한 파일만 변경됐는지 확인 후 커밋.

### 메타 코멘트 금지
→ 절대 규칙 "CC 보고 끝 메타 코멘트 전면 금지" 참조.

### 작업 완료 처리
본 앱: 자동으로 commit & push.
랜딩: 자동으로 vercel 재배포.

## 새 세션 시작 시 (Kickoff)

채팅 클로드는 파일을 자동으로 못 읽고, 컨텍스트에 흐릿하게 남은 정보를 "안다"고 착각하는 경향이 있음. 다음으로 방지.

### 핵심 5개 셋트 (매 세션 동일)
1. CLAUDE.md (이 파일 전체) — Project Knowledge 상시 보관
2. AGENTS.md — Next.js 버전 특화 규칙. Project Knowledge 상시 보관
3. docs/handoff/ 최신 파일 — 직전 세션 인계. 매번 운영자가 골라 첨부
4. docs/DECISIONS.md (인덱스) + 해당 영역 파일 — 도메인 결정. 사고 진단 시 첫 grep 대상
5. docs/known-issues.md — 알려진 이슈. 재발견 방지

작업 영역 따라 필요시 추가: PROJECT.md / ROADMAP.md / CHANGELOG.md.

### Kickoff 룰
- **모르면 모른다고 명시 요청**: 첫 메시지에 "이 5개 셋트 외엔 모르는 것으로 간주해라. 진단·결정 시 모르는 영역이면 명시해라" 포함
- **비공개 파일은 형식 먼저**: .env 같은 클로드가 못 읽는 파일은 운영자가 변수 이름 목록을 먼저 제공. 값은 진짜 필요할 때만
- **추측이 깨졌을 때**: 사용자 한 마디로 추측이 깨지면 짧게 정정하고 패턴만 짚는다. 사과·자책 늘어놓지 않음. "왜 잘못 짚었는지" 한 줄만 본인 학습용으로 남김
- **두 클로드 교차 검증**: CC 진단이 의심스러우면 채팅 클로드에, 채팅 클로드 결정이 의심스러우면 CC에 검증 요청

## 절대 규칙

- 브랜드 "Congre" 표기는 반드시 `src/components/BrandName.tsx` 컴포넌트 사용. 인라인 텍스트로 흩어 쓰지 말 것.
- 변수명·파일명·환경변수·도메인 등 기술 식별자는 소문자 (congre-mvp, app.congre.kr).
- Tailwind는 v4 사용 중이며 **config 파일 없음**. `@import` 방식. tailwind.config.js 만들지 말 것.
- 커밋 메시지는 conventional commits (feat:, fix:, chore:, docs:, refactor:).
- **무료 티어 한계는 유료 플랜으로 해결**: Vercel·GitHub Actions·AWS·SOLAPI·Resend·카카오 등 인프라 무료 티어 제약(쿼터·throttling·기능 제한)에 걸렸을 때, 우회 방법 검토하지 말고 유료 플랜이 표준 답임을 사용자에게 알리고 진행. 어느 플랜·얼마짜리 가입은 사용자 결정 영역.
- **Firestore 보안 규칙은 git push만으로 미반영**: `firestore.rules` 파일 변경 + 커밋 + push는 코드 저장소에만 반영됨. 실 Firestore에 적용하려면 별도 배포 단계 필요. 보안 규칙 변경 사양에 다음 단계 의무 포함: (1) 에뮬레이터 Rules Playground 테스트, (2) 커밋 + push, (3) **Firebase 콘솔 Rules 탭에서 본문 게시** 또는 `firebase deploy --only firestore:rules` 실행. 운영자 1인 비개발자 환경에서 콘솔 게시가 표준. 본 룰 누락 시 가입·이벤트 생성 등 클라이언트 동작이 옛 규칙으로 거부됨 (2026-05-19 v2 세션 사고 #4).
- **catch 블록 console.error 의무**: 사용자에 에러 메시지 표시하는 모든 catch 블록에 `console.error("[context] failed:", err)` 의무. Vercel·브라우저 서버 로그가 유일한 원격 디버깅 채널. 누락 시 진단 1단계로 console.error 추가가 첫 번째 정정 작업이 됨 (Shotstack 2026-05-08 결정 / 가입 흐름 2026-05-19 v2 사고 #3과 일관성).
- **CC 보고 끝 메타 코멘트 전면 금지**: CC 작업 완료 보고는 변경 파일·동작 흐름·빌드/린트 결과로만 끝낸다. 보고 끝에 어떤 형태의 요약·recap("※ recap" 류)·다음 단계 제안·"다음은 X 또는 Y"·자체 합계표도 붙이지 말 것. 다음 단계는 운영자/채팅 클로드가 결정한다. (작업 원칙 "메타 코멘트 금지" + 프롬프트 최상단 금지에도 2026-06-07까지 반복 무시 — 절대 규칙 격상.)
- **문서 책임자 = 채팅 클로드(코난)**: 문서(docs/·CLAUDE.md·AGENTS.md 등)의 생성·갱신·삭제·배치 결정은 모두 코난 소관. CC는 코난 프롬프트대로 문서를 손대고, 자체 판단으로 문서를 건드리지 않는다. 코드-문서 불일치는 코난이 명시 기록한 "의도된 지연"을 제외하고 전부 코난 책임. **전제**: 모든 코드 변경(Ray가 CC에 직접 시킨 것 포함)의 커밋 결과가 코난에게 보고되어야 이 책임이 성립한다. 보고 다리가 끊기면 드리프트 발생. (2026-06-19 Ray 승인)
- **서브에이전트 추가/수정 후 CC 재시작 필수**: CC는 세션 시작 시 .claude/agents/ 명부를 1회만 스캔한다. 세션 도중 만든·고친 서브에이전트는 CC를 껐다 켜야 Agent 명부에 등록된다. 추가/수정 직후 시운전이 'Agent type not found'로 실패하면 미반영이 아니라 명부 미갱신 — CC 재시작으로 해결. (2026-06-19 라나 시운전에서 확인)

## 디자인 토큰 (CSS 변수)

라이트 테마가 기본(`:root`). 다크는 `[data-theme="dark"]` 스코프로 업로드·공유 화면에만 적용. 정의 위치: `src/app/globals.css` (값은 2026-06-17 실값 기준).

**라이트 기본(:root)**
- 배경: `var(--bg)` (#f4f1ea) + 전역 `body::before` bgflow 14s 파스텔 그라데이션(#b9a8e6·#98c6ea·#f0a8d0·#a0ddc8·#e6d68f)
- Surface: `var(--surface-1)` (#ffffff), `var(--surface-2)` (#f0ece2), `var(--surface-3)` (#e8e2d5)
- 액센트: `var(--accent)` (#E8794A, 주황), `var(--accent-hi)` (#ef8a5d) — 골드 #c8892c는 폐기(다크 스코프에만 잔존)
- 텍스트: `var(--text)` (#1a1612), `var(--text-dim)` (#3d362e), `var(--muted)` (#6b635a)
- 헤어라인: `var(--hairline)`, `var(--hairline-strong)`
- 폰트: `var(--font-body)`=Pretendard(본문), `var(--font-display)`=Cormorant Garamond(next/font 주입), 영상 한글 NotoSansKR
- Legacy 별칭: `--surface`=`var(--surface-1)`, `--border`=`var(--hairline-strong)`, `--accent-bright`=`var(--accent-hi)`
- 글로벌 유틸: `.glass-panel`(frosted glass + inset sheen + fractalNoise grain), `.glow-accent`, `.rule`

**다크 오버라이드(`[data-theme="dark"]`)**: --bg #0c0b09 / --surface-1 #151310 / --accent #c8892c(골드) 등 12개 변수 재정의.

랜딩 트랙은 이 토큰을 인라인으로 사용 (CSS 변수 없으면 hex 직접). 본 앱 토큰과 동기 유지.

## 채팅 인계 (HANDOVER) 규약

작성 흐름:
1. 채팅 끝날 때 채팅 클로드가 한국어로 핸드오프 내용 작성
2. `docs/handoff/YYYY-MM-DD-{topic}.md` 파일명으로 저장
3. 같은 커밋에 포함

새 채팅 시작 시:
- Project Knowledge 상시 보관: `CLAUDE.md`, `AGENTS.md`, `DECISIONS.md` (인덱스), `known-issues.md`
- 매번 운영자가 첨부: 직전 `docs/handoff/` 파일 (가장 최근 날짜)
- 작업 영역에 따라 추가: PROJECT.md, ROADMAP.md, 작업 영역 코드 파일

핸드오프 내용:
- 본 세션 한 줄 요약
- 본 세션 커밋 (해시 + 메시지)
- 본 세션 결정·발견 사항
- 미완 작업 (다음 세션 시작 시 가장 먼저 처리할 것)
- 다음 세션 후보 (우선순위 표시)
- 본 세션 학습 한 줄 (있으면)

## 주요 문서 위치

```
docs/
├── PROJECT.md              현재 스냅샷 (수시 갱신)
├── DECISIONS.md            인덱스 (영역별 파일 링크)
├── decisions/
│   ├── rendering.md
│   ├── notifications.md
│   ├── auth-model.md
│   ├── legal.md
│   ├── market-product.md
│   ├── infra.md
│   ├── data-flow.md
│   ├── landing.md          (랜딩 영역, 2026-05-27 신규)
│   └── misc.md
├── known-issues.md         진행 중 이슈
├── known-issues-resolved.md 해결된 이슈 아카이브
├── ROADMAP.md              다음 할 일
├── CHANGELOG.md            작업 이력
├── handoff/
│   └── YYYY-MM-DD-*.md     세션별 인계
└── legal/
    └── CHANGELOG.md        약관·개인정보 변경 이력
```

## 문서 갱신 의무

작업 끝나면 다음을 같은 커밋에 포함:
- 새 기능 추가 → `docs/CHANGELOG.md`에 한 줄 추가
- 기술 결정 (라이브러리 선택, 아키텍처 변경, 정책 변경) → `docs/decisions/{영역}.md`에 항목 추가. 인덱스의 항목 수 갱신
- 새 알려진 이슈 / 다음 작업 후보 변경 → `docs/ROADMAP.md` 또는 `docs/known-issues.md` 갱신
- 환경변수 / 기술 스택 / 디자인 토큰 / 도메인 변경 → `docs/PROJECT.md` 해당 섹션 갱신
- 해소된 known-issues는 known-issues-resolved.md로 이동

## 응답 스타일

- 직설적이되 따뜻하게. 사용자 자책 시 위로 과하게 하지 말고 패턴만 짚어줄 것.
- 단순 옵션 비교가 아닌 트레이드오프 명시.
- 추천 + 그 이유 제시 (단, 강요 X).
- 결정 갈래가 있을 때는 옵션 비교 표로 정리.
- 응답에 외부 작업 안내 포함 시 메뉴 트리 + 단계별로.

## 학습 룰 (누적)

본 프로젝트에서 사고로 학습된 룰. 추가 시 가장 위에 한 줄로.

- **에이전트 팀 순서 규칙 (자동 위임)**: 사소하지 않은 작업은
  라나(외부 리서치)→정찰관(scout, 내부 코드 읽기전용)→Ray 승인
  →실행관(axe, 수정만·커밋/push 안 함)→검증관(eye, 사양 대조 읽기전용) 순.
  CC 본체가 이 순서를 지휘한다(서브에이전트끼리는 서로 못 부름).
  정찰이 끝나면 CC는 멈추고 계획을 Ray에게 올려 승인을 받는다 —
  이 게이트는 자동화하지 않는다. 실행관은 커밋하지 않고 작업트리에만
  변경을 남기며, 검증관 통과 후에 커밋한다(push는 Ray 검토용 별도 단계).
  자동 위임은 각 에이전트 description으로 발동하나, 신뢰 전 이름을
  직접 불러(명시 호출) 시운전해 확인한다. 팀 4명(lana·scout·axe·eye)
  모두 구축됨.
- **에이전트 라우팅 빠른 참조**: 작업 성격별 담당. 순서·승인 게이트는 위 "에이전트 팀 순서 규칙" 참조.
  | 작업 성격 | 담당 | 안전성 |
  |---|---|---|
  | 외부 정보·표준 해법·라이브러리·공식문서·에러 검색 | lana(라나) | 읽기 전용 → 능동 위임 OK |
  | 우리 코드 현 상태·구현 방식·영향 범위 실측 | scout(정찰관) | 읽기 전용 → 능동 위임 OK |
  | 변경 후 사양 대조 + build/lint 검사 | eye(검증관) | 읽기·검사 전용 → 능동 위임 OK |
  | 승인된 사양대로 코드 수정·생성 | axe(실행관) | 코드 변경 → Ray 승인 후에만, 자동 발동 금지 |
- **화면 등장 시 "기존 구현 vs 새 CD 시안" 먼저 확인**: 기존 코드 요소를 CD 신규 작업으로 오인해 헛발(라이트 reskin 때 LIVE·EDITING 데모 오인). CD 캡처 흐름 중이면 "이건 기존 거냐 새 거냐"부터 가름.
- **디자인 핸드오프 URL은 채팅 클로드가 못 엶(73MB 초과)**: CD 시안 검토는 스크린샷, 구현은 HTML·이미지 export로 받는다.
- **CD는 "교체/빼기"를 명시 안 하면 안 뺌**: "추가"만 시키면 기존 요소를 그대로 둬 중복 발생. 교체·제거를 프롬프트에 명시.
- **디자인 레퍼런스는 운영자 선수집이 AI slop 회피에 결정적**: 막연한 "모던하게"가 아니라 구체 레퍼런스(Partiful·Weverse 등)가 시스템을 날카롭게 함.
- **정적 이미지 배경 < animated gradient**: "꿈틀대는" 배경은 정적 이미지로 안 됨. 레퍼런스가 쓴 건 CSS animated gradient.
- **운영자 레퍼런스 실물이 톤 방향 1차 근거**: Partiful 실물이 라이트인데 다크로 헛다리. 운영자가 가져온 실물 스크린샷을 톤 방향 1순위 기준으로.
- **"밝게/가볍게" 반복은 톤 방향 재검토 신호**: 색 미세조정으로 안 풀리는, 톤 자체의 문제일 수 있음.
- **API 용어 이름값 추론 사고**: Shotstack fit:"cover"를 CSS 통념(비율 유지)으로 읽었으나 실제는 stretch. 증상↔코드가 충돌할 때(소스는 가로인데 코드가 cover로 늘어남) 코드 글자의 의미를 의심하고 공식 문서로 확인.
- **테스트 통과 ≠ 같은 동작 검증 사고**: 직접 PutObject 테스트 성공에 갇혀 5일간 키 문제로 오진. 실제 워커 실패는 HeadObject였음. "같은 키"라도 "같은 동작/같은 대상 버킷"인지부터 확인.
- **벤더 에러 출처의 격 구분**: 외부 벤더가 공식 에러 메시지로 직접 권한을 명시하면 "그쪽은 준비됨" 신호일 수 있음. 사람 메일의 추측성 지시와 격이 다름.
- **CC 메타 코멘트 재발 사고**: CLAUDE.md 절대 규칙에 박혀 있어도 ※recap·다음 단계·합계표를 보고 끝에 끼움. 매 프롬프트 끝에 "recap·다음 단계·합계표 끼우지 말 것" 명시할 때만 안 함.
- **CC L 번호 부여 섹션 내부 기준 사고**: CC가 known-issues.md L 번호를 섹션 내부 카운터로 매겨 전역 충돌 발생. L은 전역 일련번호, 다음 빈 번호 부여라고 프롬프트에 명시 필요.
- **갱신 트리거 표시 휘발 사고**: A 결정 본문에 "B docs 갱신 트리거"라고 표시만 해놓으면 다음 세션이 그걸 알 길이 없음. 트리거 표시는 같은 세션에 같은 커밋으로 처리 필수.
- **CD는 명시 안 하면 AI slop으로 수렴**: Anthropic 본인 공식 인정. Inter font / 흰-보라 그라데이션 / 정적 일러스트로 회귀. 회피: GSAP·Anime.js 등 라이브러리 명시 요청 + variants 2개 비교 요청 + 부정·긍정 지시 둘 다 박기 + 참고 스크린샷 첨부.
- **CD 프롬프트는 짧은 스캐폴드 + 인라인 코멘트 흐름**: 첫 영어 500단어+ 막힘 위험. 200단어 4요소(Goal/Layout/Content/Audience) 스캐폴드 + 인라인 코멘트로 디테일 잡기.
- **CD 압축·축약 시 운영자 원안 의도 점검부터**: CD가 더 깔끔한 해석으로 보여도 운영자 BM 본질이 사라졌는지 확인. R1 학생 사진 띠가 정적 카운터로 압축됐을 때 채팅 클로드가 "더 깔끔" 평가 → 추측 어긋남.
- **docs 박힌 숫자도 출처 확인 필요**: PROJECT.md "12분"이 실측 아닌 placeholder였음. 사실로 가정 전 운영자에 확인.
- **외부 SaaS UI 변경 가정 사고**: 가비아·Vercel처럼 UI 자주 바뀌는 곳은 안내 전 운영자 첫 화면 확인부터.
- **Vercel DNS 값 추측 사고**: A 레코드 IP·CNAME은 Vercel이 도메인별로 고유 값 할당. 표준값 추측 금지, 사용자 화면에서 확인.
- **fetch 반복 보고 오진 사고**: 사용자가 "무한 호출" 보고 시 첫 질문은 호출 빈도 아니라 **간격**. 5초·30초·1초 어느 쪽이냐로 정상 폴링/실제 루프 즉시 갈림.
- **CD 안에서 결정·실행·기록 섞임 사고**: CD turn 한도 도달 시 다 휘발됨. 결정은 채팅 클로드에 알려 docs에 박고, 실행은 CC에 위임.
- **"써본 적 있어?" 질문의 범위 모호**: "도구 자체로 처음" vs "본 프로젝트에서 처음"이 다름. 시간·범위 명시한 질문으로 물을 것.
- **검증 안 된 사고 보고는 가설로 표시**: revert 결정의 근거가 다른 오진과 묶여 있는지 점검.
