# 2026-05-26 — Landing v4: Vercel 별도 프로젝트 첫 배포 + 모바일 반응형 4사고 해결

## 완료된 작업 (순서대로)

### 1. Vercel 별도 프로젝트로 첫 배포 — `congre-landing`

운영자가 클로드 디자인에서 받은 Landing v4 파일들(로컬 `C:\Users\PC\Downloads\congre\deploy`)을 Vercel에 첫 배포. GitHub 웹 업로드는 영상 파일 다수로 세션 타임아웃 반복 실패 → GitHub 우회.

- **배포 방식**: PowerShell + Vercel CLI 경로 (Node 22.17.0 설치 확인됨)
  ```
  cd C:\Users\PC\Downloads\congre\deploy
  npx vercel
  ```
- **프로젝트 정보**:
  - Vercel 프로젝트명: `congre-landing` (계정: `rhcho94s-projects`)
  - Production URL: `https://congre-landing.vercel.app` (Aliased, 항상 최신 배포 가리킴)
  - Inspect URL: `https://vercel.com/rhcho94s-projects/congre-landing`
- **배포 폴더 구조** (`C:\Users\PC\Downloads\congre\deploy`):
  ```
  index.html (97KB)
  image-slot.js
  .image-slots.state.json (468KB, 이미지 데이터 일부 포함)
  README.md
  videos/ (영상 4편)
  index.html.backup (이번 세션 작업 전 백업)
  ```
- **이후 재배포 명령**: `npx vercel --prod` (동일 폴더에서)
- **본 앱과의 관계**: 본 앱 `congre-three.vercel.app`과 별도 프로젝트. 같은 Vercel 계정 안에 두 프로젝트 공존. 본 앱 레포·코드는 안 건드림.

### 2. 모바일 반응형 4가지 사고 진단 + 해결

폰(갤럭시) 첫 접속 시 다수 사고 발견. 운영자 표현: "전체적으로 반응형이라기보단, 오른쪽이 잘린 채로 줌인 줌아웃만 되고 있는 것 같다."

이 표현이 **가로 오버플로 사고의 교과서적 증상**이었음.

#### 사고 진단 최종 정리 (해결 순서)

| # | 사고 | 진짜 원인 | 처방 |
|---|---|---|---|
| ① | 헤드라인 폰트 크기 데스크탑 기준 → 한글 글자 6~7자 1줄에 안 들어감 | `.hero h1 { font-size: clamp(56px, 7.6vw, 108px) }` 최소값 56px이 한글에 너무 큼 | 미디어 쿼리 없이 글로벌 clamp 자체를 축소: `clamp(32px, 9vw, 48px)` |
| ② | Showcase 마키 카드 너무 큼 (모바일에서 한 카드가 화면 60% 차지) | `.showcase-card { width: 220px }` 모바일에도 큼 | `@media (max-width: 640px)` 블록에 `.showcase-card { width: 200px }` |
| ③ | Hero 영상 화면 절반만 차지 (옆 패널과 2컬럼 유지) | `.hero-visual` 2컬럼 그리드가 980px·640px 미디어 쿼리에서도 유지 | `@media (max-width: 640px)`에 `.hero-visual { grid-template-columns: 1fr; max-width: 100% }` 추가 |
| ④ | 페이지 전체가 가로로 넘침. 줌인/줌아웃만 작동, 반응형 미디어 쿼리 자체가 발동 안 함 | 어딘가 요소가 모바일 폭 초과 → 페이지가 데스크탑 폭으로 렌더링됨 | `html, body { overflow-x: hidden }` 글로벌 추가 (Shopify 사례 표준 해결) |

#### 사고 ①-④ 처방 후에도 헤드라인 안 작아짐 — 진짜 범인 발견

- **현상**: 위 4가지 처방 모두 적용 + 재배포 후에도 "편집이 끝" 헤드라인 여전히 오른쪽 잘림. clamp 32px가 안 먹힘.
- **진단 경로**: PC 크롬 F12 → Ctrl+Shift+M (모바일 시뮬레이션, 375px iPhone SE) → "편집이" 글자 Inspect → Elements + Styles 패널 확인.
- **진짜 범인**: HTML에 직접 박힌 인라인 스타일
  ```html
  <span class="br accent" style="width: 570px; font-size: 90px">편집이 끝난다.</span>
  ```
  인라인 스타일은 CSS 셀렉터·미디어 쿼리·clamp 모두를 무력화하는 최고 우선순위.
- **처방**: `style="width: 570px; font-size: 90px"` 부분만 삭제. 클래스(`class="br accent"`)는 유지.
- **결과**: 헤드라인 정상 작아짐 + 4가지 사고 모두 시각적으로 확인 완료.

#### 작업한 파일 변경 (`index.html`)

| 줄 | 변경 내용 |
|---|---|
| 32 | `html, body { ... overflow-x: hidden; }` 추가 |
| 156 | `.hero h1` font-size `clamp(56px, 7.6vw, 108px)` → `clamp(32px, 9vw, 48px)` |
| 1190 | `@media (max-width: 640px)` 안 `.showcase-card` 폭 `220px` → `200px` |
| 1192 | `@media (max-width: 640px)` 블록에 `.hero-visual { grid-template-columns: 1fr; max-width: 100% }` 추가 |
| 1500 | `<span class="br accent">` 의 인라인 `style="width: 570px; font-size: 90px"` 삭제 |

#### 검증 (최종 폰 스크린샷 + PC DevTools 시뮬레이션 모두 확인)

- 헤드라인 "올리는 순간, 편집이 끝난다." 화면 안에 깔끔하게 들어감
- Hero 영상 풀폭 차지
- 가로 스와이프 안 됨, 줌은 정상 작동 (접근성 도구)
- Showcase 마키 자연스럽게 흐름

## 결정 이력 메모

- **Vercel 별도 프로젝트 채택 (옵션 2)**: 본 앱 레포의 `public/landing/` 통합(옵션 1) 또는 Next.js React 컴포넌트로 통합(옵션 3) 대비 채택. 표준 SaaS 패턴 (Linear·Notion·Figma 다수 사례). 본 앱·랜딩 독립. 도메인 분리 가능 (`congre.kr` = 랜딩, `app.congre.kr` = 본 앱 구조 권장).
- **GitHub 우회 + PowerShell + Vercel CLI**: 비개발자 운영자에게 GitHub 웹 업로드는 영상·바이너리 다수 시 자주 실패. CLI 경로가 일관·안전. 이후 모든 수정 사이클이 메모장 편집 → PowerShell `findstr` 검증 → `npx vercel --prod` 재배포 → 시크릿 탭 확인 흐름으로 고정됨.
- **인라인 스타일 진단 학습**: "수정한 CSS가 적용 안 보임" 사고에서 CSS 셀렉터 충돌·캐시·viewport만 의심하고 HTML 인라인 스타일을 1순위 가설에 안 넣었음. PC DevTools Inspect 한 번이 가설 10개보다 빨랐음. 다음 사이클부터 인라인 스타일을 1순위에.
- **운영자 표현 = 진단 단서 룰**: "줌인/줌아웃만 되는 느낌" = 가로 오버플로의 교과서적 증상. 사용자 표현을 진지하게 받아 적고 검색하면 표준 처방이 나옴 (이번 케이스 Shopify community 사례 매칭).
- **무료 티어 한계 → 유료 플랜 표준 룰 적용 X (이번엔)**: GitHub 웹 업로드 한계는 우회(Vercel CLI)로 해결. CLAUDE.md 룰상 "우회 검토하지 말고 유료 가입"이지만, 이번엔 더 깔끔한 대안(Vercel CLI)이 있어 그 길로. 무료 티어 자체가 막은 게 아니라 인터페이스 선택 문제.

## 알려진 이슈

- **다른 헤드라인에 인라인 스타일 잠재**: 이번 세션 `font-size: 90px` 검색은 줄 1500 한 곳만 매칭. 다른 헤드라인 (예: Why Now 섹션 "영상으로 남기는 오늘") 에 다른 크기 인라인 스타일이 박혀 있을 가능성 미확인. **격상 트리거**: 추가 헤드라인 잘림 보고 시. **점검**: `findstr /n /c:"font-size:" index.html` → HTML 인라인 스타일 형태 식별.
- **`.image-slots.state.json` 상태 미확인**: 468KB 파일 존재. 50 슬롯(Moments) + 10 슬롯(Hero LIVE FEED) 중 몇 개가 이미 드롭됐는지 미확인. **점검**: 폰/PC에서 페이지 직접 열어 슬롯 확인.
- **도메인 `congre.kr` 미연결**: DNS 응답 없음 상태. 등록 상태·구매처(가비아·후이즈 등) 운영자만 알고 있음. 연결 시점에 운영자가 정보 제공해야 진행 가능.
- **Showcase 마키 모바일 터치 동작 미점검**: 이전 핸드오프에 적힌 검증 영역. 이번 세션은 카드 폭 축소(200px)만 적용. 스크롤 속도·터치 동작은 별도 점검 필요.

## 다음 세션 후보

이전 핸드오프 (2026-05-25) 의 후보 + 이번 세션 파생 후보:

1. **50장 썸네일 이미지 마무리 생성 (Kling Image) + 슬롯 드롭** — Moments 졸업식 20 + 결혼식 20 + K-pop 10
2. **결혼식 영상 풀버전 45초 만들지 / 15초 4편 유지할지 결정**
3. **기업행사·동창회·생일·추모 타일 영상화 여부 결정**
4. **사용 후기 섹션에 실제 사진/아바타 추가 검토**
5. **모바일 마키 스크롤 속도·터치 동작 점검** (이번 세션 일부 해결)
6. **가격 페이지·신청 폼 디자인 시작**
7. **도메인 `congre.kr` Vercel 연결** (이번 세션 파생, DNS 전파 30분~24시간)
8. **다른 헤드라인 인라인 스타일 일괄 점검 + 제거** (이번 세션 파생, 알려진 이슈 1번)

## 다음 세션 시작 시 컨텍스트

랜딩 페이지 작업은 본 앱 CC(Claude Code) 트랙과 별도. 새 채팅 세션 시작 시:

1. 본 핸드오프 파일 첨부
2. 작업 영역 명시: "랜딩 페이지 (Vercel 별도 프로젝트, 정적 HTML) 작업. 본 앱 코드는 안 건드림."
3. 로컬 폴더: `C:\Users\PC\Downloads\congre\deploy`
4. 배포 명령: `npx vercel --prod` (해당 폴더에서)
5. 본 앱 `docs/DECISIONS.md`·`known-issues.md`엔 이번 작업 반영 X (랜딩 페이지는 별도 트랙).
