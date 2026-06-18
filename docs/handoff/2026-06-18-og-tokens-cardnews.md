# 2026-06-18 핸드오프 — /share OG · 디자인 토큰 동기화 · 커뮤니티 카드뉴스

## 한 줄 요약
FGT 코드 실폰 검증 완료(FGT 시작 가능) + /share OG 프록시 전환 + 디자인 토큰 문서 동기화 + 블로그·카페용 커뮤니티 콘텐츠(카드뉴스 8장 + 텍스트 3종) 제작.

## 본 세션 커밋
- `62d79e7` feat(seo): /share OG 이미지를 og-image 프록시로 전환 (브랜드 카드 폴백)
- `baa55d0` docs(design): sync design tokens to light theme
- (커뮤니티 콘텐츠는 git 외부 — 마케팅 자산, 저장소 미포함)

## 결정·발견
- **FGT**: 이전 세션 `0be3268`(유료 비활성·render/start 결제 가드·19세 체크박스) 실폰 검증 완료. ④ cron 실측 200 확인(닫힘). DoD §2 4개 전부 통과 → **FGT 시작 가능 상태**.
- **/share OG**: 기존 `${appUrl}/logo.png` 하드참조 + appUrl 빈 문자열 시 상대경로로 떨어져 카톡 크롤러가 못 읽는 위험 있었음. `/api/og-image/[eventId]` 프록시로 전환(=/upload와 동일, 인트로 이미지 있으면 노출/없으면 og-image.png 브랜드 카드 폴백). 미사용된 appUrl 선언도 제거.
- **디자인 토큰**: CLAUDE.md·PROJECT.md가 다크 시절 값(bg #0c0b09, accent #c8892c 골드, 본문 DM Sans)으로 stale였음 → globals.css 라이트 실값으로 동기화(bg #f4f1ea, accent 주황 #E8794A, 본문 Pretendard, bgflow 그라데이션·.glass-panel·[data-theme=dark] 스코프 반영). film grain은 globals.css L126에 정의는 있으나 display:none(비활성)이라 "글로벌 유틸"에서 제외.
- **앰버 잔재 2건(미처리, 분리)**: ① PROJECT.md "브랜드 표기 규칙" 줄이 아직 "앰버 색"(실제는 --accent 주황). ② `.glow-accent` glow 색이 옛 골드 rgba(200,137,44) 하드코딩(globals.css L156, 토큰 미참조) — 라이트에서 쓰는 화면 있으면 색 튐. 코드라 사용처 정찰부터.
- **커뮤니티 콘텐츠(git 외부)**: 카드뉴스 8장(CD 조립, 표지 A 단일), 마스킹/합성 소스 7장, 텍스트 3종(A 짧게/B 중간/C 길게). 호스트 실명→가성명 "이서연", 클립 번호→더미. 표지 통계 줄을 실측값 "100개 클립·영상완성 10분 이내"로 교체. "AI/실시간" 표현은 "자동 편집" 톤으로 카드·텍스트 통일. 저장: `C:\Users\PC\Downloads\congre\marketing\cardnews-2026-06\`.

## 미완 작업 (다음 세션 최우선 아님 — 운영자 행동 영역)
- CD에서 최종 카드 8장 PNG export → 마케팅 폴더 `cards\`에 보관 → 블로그·카페 게시.

## 다음 세션 후보 (우선순위)
1. **(高) FGT 실제 실행** — 코드 준비 끝. 운영 결심 영역(실사용자·행사 섭외).
2. **(中) 라이트 테마 마무리 트랙** — glassPanel 인라인 4곳→.glass-panel 통합(정찰 대기) + 앰버 잔재 2건(.glow-accent, PROJECT.md 문구) + .card 가독성 1곳 + 자잘한 대비.
3. **(中) 라이브 랜딩(congre.kr) 정합** — "1,200+ 학교·8분" 옛 통계가 아직 라이브(카드는 실측값으로 교체됨). "AI/실시간"→"자동" 톤도 라이브 반영 검토. 랜딩 트랙(deploy/index.html).
4. **(blocked) 결제 Phase 3** — 토스 인증(~1개월) + 통신판매업 신고 대기.

## 본 세션 학습
- **CC 자체 합계 드리프트 재발**: baa55d0 보고 끝 파일별 합계(PROJECT +17/CLAUDE −7)가 커밋 통계(35 ins/17 del) 및 Update 출력과 불일치. 커밋·Update 출력이 authoritative, CC 손계산 합계는 신뢰 금지.
- **"소개글" = 형식 가정 금지**: "한/두/세 페이지 소개글"을 글 분량으로 읽었으나 실제는 카드뉴스(이미지 주·글은 캡션). 산출물 형식부터 확인.
- **공개 게시물 = PII·허위수치 사전 점검 필수**: 스크린샷에 실명·전화·이메일·내부 노트북 대화창 + 랜딩 허위통계("1,200+ 학교"). 마스킹/교체 후 게시.
