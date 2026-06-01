# 2026-06-01 — 무료 플랜 워터마크 본 앱 구현 완료

## 본 세션 한 줄 요약

2026-05-30에 사양만 확정돼 있던 무료 플랜 워터마크("made by Congre")를 본 앱 렌더 파이프라인에 구현. 정찰 → 폰트 확보 → 코드 → 렌더 검증을 한 사이클로 닫음. 구현 중 Shotstack rich-text의 제약 3가지(width/height 미지원, 트랙 배열 레이어 순서, 여백은 텍스트 패딩으로만)를 렌더 사고로 하나씩 발견·해소. 코드 5커밋 + docs 1커밋.

## 본 세션 커밋 / 배포

본 앱 repo (git):
- `dc2b898` feat: add watermark track for free plan renders (초기 도입 — plan 인자 + 무료 조건 + 폰트 주입)
- `98404d5` fix: position watermark to bottom-right with sized text box (width/height 박스 배치 시도)
- `552f373` fix: drop unsupported width/height from watermark rich-text asset (제약 a 발견 후 제거)
- `d652e15` fix: move watermark track to top layer so it stays visible (제약 b — unshift)
- `5ccd6e8` fix: add whitespace padding to watermark for edge spacing (제약 c — 텍스트 패딩)
- `971b0cf` docs: record watermark implementation and Shotstack rich-text constraints

(랜딩 트랙 변경 없음)

신규 파일: `public/fonts/CormorantGaramond-Italic.ttf` (SIL OFL, 407488 bytes). Google Fonts 공식 "Cormorant Garamond" 정적 italic. name table Family="Cormorant Garamond" / Subfamily="Italic"로 검증됨 — Shotstack font.family는 "Cormorant Garamond"가 정답(붙여쓰기·Italic 포함 아님).

## 최종 워터마크 사양 (구현 확정값)

- 적용: `plan === "free"` 완성본 only
- asset: `type: "rich-text"`, `text: "made by Congre   \n "` (끝 공백·줄바꿈 = 우하단 모서리 여백)
- font: `family: "Cormorant Garamond"`, `size: 40`, `color: "#c8892c"`
- align: `{ horizontal: "right", vertical: "bottom" }`
- clip: `start: 0`, `length: "end"`, `opacity: 0.40`
- 트랙: `tracks.unshift(...)`로 최상단 레이어
- 폰트 주입: `timeline.fonts`에 무료 플랜 조건부 추가 (NotoSansKR과 배열 공존)

## 본 세션 발견 / 사고 — Shotstack rich-text 제약 3가지

작업의 본질이 코드가 아니라 "Shotstack rich-text가 어떻게 동작하는지"를 렌더 사고로 알아내는 것이었음. 셋 다 decisions/rendering.md 2026-06-01에 박힘.

1. **rich-text asset은 width/height 미지원** — production에서 `code: unknown_property` 400. 공식 /learn 문서 예시엔 width/height가 분명히 있었으나 production 스키마는 거부. **DECISIONS 2026-05-08("width/height Unknown property 400") 사고의 재발.** "문서 예시에 있으니 정상 필드"로 한 단계 가볍게 판단한 게 원인. 향후 rich-text 필드 추가 시 width/height류는 문서에 있어도 의심 1순위.

2. **tracks 배열 레이어 순서 = 앞이 위층, 뒤가 아래층** — 정찰 때 채팅 클로드·CC 둘 다 "맨 끝 = 최상단"으로 오해. 워터마크를 push(끝)하니 `fit:cover` 영상이 덮어 평소엔 안 보이고 전환 효과 때만 잠깐 비쳤음. `unshift`로 최상단 이동해 해소. **"맨 위 레이어"의 배열 방향을 문서로 확정 안 하고 통념으로 넘어간 게 사고.**

3. **rich-text 여백은 텍스트 공백·줄바꿈으로만** — clip.offset은 전체화면 캔버스에 무효 / asset.width·height 거부 / clip.position 전체화면 asset에 무효. align이 글자를 모서리에 딱 붙이는데, 여백은 text 문자열에 공백·줄바꿈을 넣어 글자를 안쪽으로 미는 방식이 유일.

### 5초 클립 오인 (가설 분리로 회피)
400 사고가 난 렌더에서 운영자가 "처음으로 5초(maxClipSeconds)를 선택했다"고 보고 → 5초가 원인이라는 가설이 떠올랐으나, Vercel 로그 createRender body 전문 확인 결과 5초 클립·align 모두 정상 통과, 거부된 건 width 단 하나였음. **두 의심(5초 / 워터마크)을 묶지 않고 전문으로 가른 게 오진 회피.** (known-issues "사고 두 가지 동시 발생 시 독립성 먼저 검증" 학습 적용.)

### CC 자체검증 1건 (양호)
docs 갱신 시 rendering.md 인덱스 항목 수가 채팅 클로드 프롬프트엔 "29→30"으로 적혔으나, CC가 `grep ^##` 실측으로 32개 확인 후 인덱스를 30→32로 정정. 인덱스 표기 숫자가 실제 파일과 어긋나 있던 것을 CC 실측이 잡음.

## 미완 / 다음 작업 후보 (다음 세션 1번은 운영자가 택)

**워터마크 트랙은 닫힘.**

### 우선순위 중간
1. **게스트 카피 개선** — /upload uploader 단계 맥락 부족. 위험 낮고 빠른 성과.
2. **dead code 정리** — host/page.tsx 옛 dashboard/create view + mockEvents.
3. **dashboard 썸네일** — placeholder, 인트로 미디어 썸네일 추출.

### 보류 트랙 (트리거 대기)
- **워터마크 여백/크기 미세조정** — 현재 공백 패딩으로 "자연스러운 정도" 확보. 픽셀 정밀 아님. font.size 40이 1920 세로에서 작다는 판단 들면 키우기(원본 결정 수치 변경 = 운영자 영역). 트리거: 워터마크가 너무 작다/흐리다 운영자 판단 시.
- **유료 플랜 실수치** — small/medium/large 클립 길이·수 상한 임시값(plans.ts). known-issues 등재.
- **upload:613 ref stale (불확실 2건)** — 사이클 6 보류분. "다시 시도 버튼 안 보임/엉뚱" 사고 시 격상.
- **lint baseline 11건** — 신규 작업 lint 게이트 "errors ≤ 11 (delta 0)".

## 본 세션 학습 한 줄

- **Shotstack 같은 외부 렌더 엔진 작업은 "문서로 사양 확정"이 아니라 "렌더로 사양 발견"이다.** rich-text의 제약 3가지가 전부 문서가 아닌 실제 렌더 사고에서 나옴. 문서 예시는 출발점일 뿐 production 스키마 보장이 아니며(2026-05-08 재발), 한 번에 맞추려 말고 한 변경 → 렌더 확인 → 다음 변경의 작은 사이클이 맞다. (단 Shotstack 렌더는 길이당 과금이라 "완벽주의 N회 굴리기"는 비용. "자연스러운 정도"에서 멈출 것.)

## 다음 세션 진입 컨텍스트

- 무료 플랜 워터마크 라이브. 무료 이벤트 완성본 우하단에 "made by Congre" Cormorant italic 골드 반투명, 영상 전체 길이 노출, 가려짐 없음. 검증 완료.
- shotstack.ts createRender 시그니처는 이제 4-arg: `(clips, intro?, outro?, plan?)`. 향후 createRender 호출부 추가 시 plan 인자 주의.
- render/start route는 eventData.plan을 추출해 전달 중. clips/route.ts:54와 동일 패턴.
- 신규 작업 lint 게이트: errors ≤ 11 (delta 0). react/no-unescaped-entities는 eslint.config.mjs에서 off (사이클 6).
- 운영자 다음 세션 첫 메시지: 본 핸드오프 첨부 + 작업 영역 명시(게스트카피 / dead code / 썸네일 중 택1).
