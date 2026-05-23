# 2026-05-23 — Shotstack 영상 퀄리티 격상 + outroText 사고 해소

## 완료된 작업 (커밋 순)

### 1. volumeEffect: fadeInFadeOut 도입 — `04185b6`

`src/lib/shotstack.ts` `videoClips.map` 영역 asset에 `volumeEffect: "fadeInFadeOut"` 추가.

```ts
asset: { type: "video", src: clip.src, volumeEffect: "fadeInFadeOut" },
```

- **적용 범위**: 참가자 video clip 전용. makeMediaClip(intro/outro 미디어)·rich-text overlay는 변경 없음.
- **사유**: 야외 촬영 영상 cut 영역 음량 급변 흡수. BGM volume 0.1로 낮아 인터뷰 음성 묻힘 부담 없음.
- **검증 영역**: 실제 렌더 후 시각·청각 확인 필요 (Shotstack 페이드 시간 공식 명시 없음).

### 2. transition in/out 분리 — `c84bc73`

`pickSequence` 1회 → 2회 호출. `transitionsIn` / `transitionsOut` 독립 생성.

```ts
const transitionsIn = pickSequence(TRANSITION_POOL, clips.length);
const transitionsOut = pickSequence(TRANSITION_POOL, clips.length);
// ...
transition: { in: transitionsIn[i], out: transitionsOut[i] },
```

- **TRANSITION_POOL**: `["fadeFast", "slideLeftFast", "slideRightFast", "zoom"]` 그대로.
- **사유**: 한 클립 in/out 조합 다양화. in·out 강제 분리 없음 (YAGNI).
- **검증 영역**: 실제 렌더 후 시각 확인.

### 3. outroText + outroMedia 동시 입력 사고 해소 — `90030a5`

**사고 사양**: outroText + outroMedia 둘 다 입력 시 [A] 분기(듀얼 track)에서 outroText가 코드 참조 없이 무시됨. UI "✓ 저장됨" 피드백으로 호스트 입장 원인 파악 불가.

**해소 (갈래 C)**: [A] 분기 `mediaClips` 배열 끝에 `outro?.text` 조건부 직렬 추가.

```ts
const mediaClips = [
  ...(hasIntroMedia ? [makeMediaClip(...)] : []),
  ...videoClips,
  ...(hasOutroMedia ? [makeMediaClip(...)] : []),
  ...(outro?.text ? [makeTextClip(outro.text, "auto", false, 3)] : []),  // 추가
];
```

- `overlayMode=false` — [B] 분기 outroText 처리와 동일 형태 (검은 배경 단독 3초 클립).
- cross-track 동기화 문제 해당 없음 — 같은 track[1] 안 직렬 배치.
- **검증 영역**: 실제 렌더 후 outroMedia 뒤 outroText 정상 출력 시각 확인.

## 4 경로 사양 (도입 후)

| 경로 | useDualTrack | outroText 처리 |
|---|---|---|
| outroText만 | false → [B] | allClips 끝 직렬 (기존 그대로) |
| outroMedia만 | true → [A] | `outro?.text` 없음 → 추가 안 됨 |
| 둘 다 | true → [A] | mediaClips 끝 직렬 추가 (사고 해소) |
| 둘 다 없음 | false → [B] | 없음 (기존 그대로) |

## 정찰 결과 메모 (코드 변경 없음)

### outroMedia 업로드 사양
- accept: `image/*,video/*` — 이미지·영상 모두 허용. 10MB 초과 시 alert.
- S3 key: `events/{eventId}/outro/{timestamp}-{originalFileName}`.
- mediaType 판정: 클라이언트에서 `file.type.startsWith("video/")`.
- 서버 MIME 타입 검증 없음.

### introText + introMedia 동시 입력 사고 여부
- [A] 분기에서 introText는 무시되지 않음 — `textClips`에 포함됨.
- `makeTextClip(intro.text, 0, true, 3)` — start=0, length=3, overlayMode=true.
- introMedia 재생 중 처음 3초 overlay 구조. 코드 레벨 사고 없음.
- overlay 품질(가독성·duration 정합)은 실제 렌더 확인 영역.

### api/events POST 미사용 경로
- `/api/events` POST body에 `introText` / `outroText` 수신 경로 존재하나, 이벤트 생성 폼(`/dashboard/create`)에서는 이 필드를 전송하지 않음. 현재 UI에서 도달 불가한 dead path.

## 다음 세션 후보

- 실제 렌더 테스트: volumeEffect + transition in/out 분리 + outroText 직렬 배치 시각·청각 확인
- outroText + outroMedia 동시 입력 경로 실제 렌더 검증
- introText overlay duration 정합 검토 (introMedia 3초 미만 영상 케이스)
- api/events POST introText/outroText dead path 정리 여부 결정
