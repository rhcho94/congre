# 2026-06-27 핸드오프 — 랜딩 히어로 재구성 + 음소거 토글 (카피·배치 전면 개편)

> ⚠️ **랜딩 트랙(git 외부)** 작업 기록. 코드 변경은 `C:\Users\PC\Downloads\congre\deploy\index.html`(git 없음, Vercel 배포본만 형상)이라 이 핸드오프는 본 앱 레포에 기록만 남긴다. 본 앱 코드는 무변경. www.congre.kr 라이브 반영 완료.

## 한 줄 요약
"무슨 앱인지 모르겠다"는 외부 피드백을 받아 랜딩 히어로를 카피·요소배치 전면 재구성. 생성형 영상 툴로 오해되던 "LIVE·AI 영상 메이커" 폐기 → "영상 방명록"(결과물 명사) + 메커니즘 배지로 전환. 완성본 영상(demo.mp4)을 가로 16:9 폰 목업으로 히어로 인라인 노출 + 음소거 토글 추가, 기존 LIVE·EDITING 과정 영상은 How it works 섹션으로 이동. www.congre.kr 배포 완료, 라이브 정상 확인.

## 배경 / 문제
- 외부 피드백: 사전정보 없는 사람이 첫 화면을 봐도 뭐 하는 앱인지 모름. 인생네컷처럼 "결과물이 즉시 연상"돼야 하는데 안 됨.
- 리서치 진단(웹서치): ① 헤드라인이 속도(benefit)만 말하고 카테고리(뭔지)를 안 줌 ② "AI 영상 메이커"가 2026 시점엔 Sora·Veo 등 생성형 영상으로 오해됨 ③ 히어로 비주얼이 결과물이 아니라 AI 편집 "과정"(진행률)을 보여줌 ④ 요소 과부하로 초점 분산.
- 비교 앱(Tribute·Memento·Celebrate.buzz·Vloggi)은 전부 "여러 명 클립 모아 → 한 편" 메커니즘을 첫 문장에 박고, 결과물에 명사("video guestbook/montage/gift")를 붙임. "영상 방명록"은 Celebrate.buzz "video guestbook"의 한국화.

## 확정 카피 (최종 — www.congre.kr 라이브 반영됨)
- **배지(메커니즘):** `QR 스캔 → 촬영 → 행사 영상 완성`
- **헤드라인:** `이 순간을 영원히,` / `영상 방명록` (2번째 줄 accent 강조)
- **서브헤드:** `각자 폰으로 10~30초씩 찍어 올리면, AI가 즉시 한 편으로 합친 소감 영상을 만들어드려요`
- **주 버튼:** `무료로 시작하기` (단독)

### 카피 결정 메모
- 헤드라인은 "영상 방명록"(결과물 명사, 인생네컷 전략) 확정. "이 순간을 영원히"(감성)로 보완.
- "10~30초"는 실제 사양(무료 10초 / 유료 호스트가 90초 이내 설정, **이미 구현됨**)보다 좁게 적은 것. 의도적 — "짧게 한마디" 부담 없는 인상이 전환에 유리. 실제 범위 안이라 거짓 아님.
- 배지 "찍고/촬영" 동사 중복 회피 위해 "QR 스캔"으로 확정.

## 구조 변경 (deploy/index.html)
1. **텍스트 3개 교체** — 배지/헤드라인/서브헤드 (위 확정 카피).
2. **버튼 정리** — 상단바 "시작하기" 삭제, 히어로 "1분 데모 보기"(data-cta="demo") 삭제. "무료로 시작하기"만 남김. CTA 4개→1개.
3. **LIVE·EDITING 영상 이동** — `div.vid-main`(graduation.mp4 배경 + clip-stream + ai-process 진행률, 한 덩어리) 통째를 히어로 → `03 How it works`(id="how") 3카드 아래로 이동(`.ht-demo` 래퍼). `div.feed`(LIVE FEED)는 히어로 유지.
4. **완성본 영상 히어로 인라인** — demo.mp4를 `.hero-demo-phone`(가로 16:9 폰 목업, 기존 `.showcase-phone` 패턴 복제·변형) 안에 노출.
5. **`.howto` 높이 잠금 해제** — `max-height:100vh→none`, `overflow:hidden→visible`(min-height:100vh 유지). vid-main이 들어오며 100vh 초과로 하단 잘리던 것 해소.
6. **그리드/여백 미세조정** — 데스크톱 `.hero-grid` `1fr 1fr → 1fr 1.4fr`(가로 폰 키움). 모바일 `.hero-demo-phone width:calc(100%-40px); margin:0 auto`(좌우 여백).
7. **음소거 토글 추가** — `.hero-demo-phone` 안 우하단에 `.hero-mute-toggle` 버튼(38px 원형, `.live-tag` 톤). Feather 스타일 인라인 SVG 2종(volume-x / volume-2). JS: 클릭 시 `video.muted` 토글 + 아이콘 스왑 + 언뮤트 시 `play()`. 초기 muted 자동재생 유지. IntersectionObserver 가시성 로직 무변경(소리 켠 뒤 스크롤 복귀해도 muted 강제 복귀 안 함).

### 핵심 기하 (영상 비율)
- demo.mp4 = **1440×1080(4:3)인데 실제 콘텐츠는 1440×808(16:9 가로), 상하 136px씩 검은 띠 구워짐.** (ffmpeg cropdetect 실측.)
- 세로(9:16) 박스+cover로는 상하 띠 제거 불가(cover는 세로 박스에서 좌우만 자름). → **가로(16:9) 박스+cover** 채택: 상하 135px씩 잘려 띠 사실상 제거(잔여~1px), 16:9 콘텐츠라 좌우 잘림 거의 0. 소스·박스 비율 일치가 정답.

## 배포
- `cd C:\Users\PC\Downloads\congre\deploy && npx vercel --prod --yes`
- 결과: READY/production, www.congre.kr 반영. congre.kr→www 307(기존 정상).
- 백업: `index_pre_hero_redesign_backup.html`(작업 전 원본, deploy 폴더).
- known-issues L8(푸터 절대경로)·L9(pricing 계산기)는 같은 파일 직접 수정이라 보존됨(CD zip 덮어쓰기 아님).
- 라이브 확인: 히어로·영상·토글 정상, **영상 끊김 없음**(로컬 npx serve에서만 끊김, Vercel 정상).

## 미완 / 다음 세션 후보 (우선순위)
1. **(中) demo.mp4 교체** — 현재 4:3(상하 띠 구워진) 가로 샘플. 실제 서비스 완성본은 세로 캔버스(PROJECT.md). 띠 없는/실제 결과물 영상으로 교체 시 히어로 정직성↑. 교체 시 박스 비율 재검토.
2. **(低) 죽은 코드 청소** — (a) `#demoModal`/`demoVideo`/JS(cta==='demo')가 버튼 삭제로 완전 고아. (b) CC가 한 줄 교체를 "추가"로 처리해 남긴 죽은 CSS 줄(`.hero-demo-video` aspect-ratio 중복, `.howto` max-height/overflow 중복) — 후행값 승이라 동작 정상이나 청소 대상. 격상: 랜딩 코드 정리 사이클.
3. **(低) 음소거 토글 접근성** — `.hero-mute-toggle`이 `aria-hidden="true"`인 `.hero-visual` 안에 있어 키보드/스크린리더 접근 불가(마우스·터치는 정상). 핵심기능 아니라 방치, 접근성 정비 사이클에 일괄 처리. (2026-06-27 Ray 안 A 채택)
4. (승계) Gmail SPF alignment + 네이버 정상화 경위 — FGT 2단계 전.
5. (승계) FGT 카톡 발송 — Ray 발송 후 막힌 지점 들고 오면.

## 본 세션 학습
- **소스 영상 비율을 먼저 실측하라**: "세로로 보여주자"는 디자인 결정이 소스(가로 16:9)와 안 맞아 띠·잘림 반복. ffmpeg cropdetect로 일찍 쟀으면 우회 줄었음. object-fit:cover 기하(세로 박스=좌우만 자름)도 추측 말고 확인.
- **CC가 한 줄 교체를 "추가"로 처리하는 패턴 재발(2회+)**: str_replace 시 옛 줄 안 지우고 새 줄 끼워넣음. CSS는 후행값 승이라 화면 정상이나 죽은 줄 누적. 보고의 "removed N line"을 코드로 교차검증 필요(보고 검증 룰이 작동해 매번 잡음).
- **결과물 명사 + 메커니즘 배지 = 클래리티 핵심**: "AI 영상 메이커"(카테고리 오해) → "영상 방명록"(결과물 연상) + "QR 스캔→촬영→완성"(동작) 분담이 5초 이해를 살림.
- **랜딩 트랙은 git 외부**라 핸드오프가 커밋에 안 실림 → 본 앱 레포에 `landing-` 표시로 기록만 남기는 방식 채택.
- **로컬 끊김 ≠ 라이브 끊김**: `npx serve`는 영상 스트리밍(range) 미지원이라 끊김. Vercel은 정상. 로컬 재생 이슈를 라이브 문제로 단정하지 말 것.
