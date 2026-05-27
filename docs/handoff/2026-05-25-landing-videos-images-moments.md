# 2026-05-25 — Landing v4: 영상 4편 임베드 + Moments 갤러리 + 카테고리 슬롯

## 완료된 작업 (순서대로)

### 1. v3 → v4 복사 + 한글 폰트 fallback 수정

`Landing v3.html` → `Landing v4.html` 복사 후 작업 시작. v3는 백업 보존.

```html
<link href="https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@1,400;1,500;1,600&family=DM+Sans:wght@400;500;600&family=Noto+Sans+KR:wght@300;400;500;600;700&family=Noto+Serif+KR:wght@400;500;600;700&display=swap" rel="stylesheet">
```

- **사유**: `--serif: "Cormorant Garamond", "Noto Serif KR"` 의 fallback이 실제로 로드되지 않아 한글 헤드라인이 시스템 폰트로 떨어짐. Noto Serif KR 명시 로드.
- **영향**: 큰 세리프 헤드라인의 한글 글리프가 정상 표시됨.

### 2. 헤드라인 line-height 보정 — 한글 줄겹침 해결

`.display` 및 디스플레이 헤드라인 5곳 `line-height: 1.02 ~ 1.1` → `1.15 ~ 1.2`.

- **사유**: Noto Serif KR 글리프가 영문 대비 세로로 길어 `line-height 1.02` 에서 위·아래 줄이 겹침.
- **적용 위치**: `.display`, comparison `.vs-col h3`, bento `.tile h3`, case `.case h3`, cta-final `h2`.
- **검증 영역**: 모바일 헤드라인 줄바꿈 시 가독성.

### 3. 영상 4편 자산화 — `videos/` 폴더 신설

`uploads/`의 원본 파일을 `videos/` 폴더로 명확한 이름으로 복사.

| 파일 | 컨셉 |
|---|---|
| `videos/wedding_1.mp4` | 결혼식 다국적 하객 축하 (레퍼런스, 15초) |
| `videos/wedding_2.mp4` | 결혼식 다국어 셀카 (1→2→3→4명, 폰 하나 공유) |
| `videos/graduation.mp4` | 중학교 졸업식 (1→6명, 한국어 메시지) |
| `videos/challenge.mp4` | K-pop 챌린지 (1→6명, 자유 안무) |

- **사유**: 영상 임베드 경로 일관성. 원본은 `uploads/`에 보존.

### 4. Hero 영상 임베드 — placeholder → 실제 영상

`.vid-main` 안에 실제 `<video>` 요소 추가. `has-video` 클래스로 placeholder 효과 무력화.

```html
<div class="vid-main has-video">
  <video class="bg-video" src="videos/wedding_1.mp4" autoplay muted loop playsinline preload="metadata"></video>
  <span class="live-tag">…</span>
  <div class="vid-meta">…</div>
</div>
```

```css
.vid-main video.bg-video { position: absolute; inset: 0; width: 100%; height: 100%; object-fit: cover; z-index: 0; }
.vid-main.has-video .play { display: none; }
```

- **유지 요소**: LIVE EDITING 배지, 진행률 바, "23/30명 업로드" 메타 — "AI 실시간 편집" 어포던스 살림.
- **사유**: hero에서 가장 완성도 높은 wedding_1 사용. 무음 자동 루프 + retina 포스터.

### 5. Showcase 섹션 신규 — 4편 가로 마키

How it works 다음, Occasions 앞에 신규 섹션 삽입.

```html
<section class="showcase" data-screen-label="04 Showcase">
  ...
  <div class="showcase-track">
    <div class="showcase-card">
      <div class="showcase-phone"><video src="videos/wedding_1.mp4" ...></video></div>
      <div class="showcase-cap">…</div>
    </div>
    ... (4개 카드 × 2회 복제로 seamless loop)
  </div>
</section>
```

```css
.showcase-track {
  display: flex; gap: 36px;
  animation: showcase-scroll 38s linear infinite;
  width: max-content;
}
.showcase-track:hover { animation-play-state: paused; }
@keyframes showcase-scroll { 0% { transform: translateX(0); } 100% { transform: translateX(-50%); } }
```

- **카드 4개**: 결혼식·결혼식 다국어·졸업식·챌린지. 9:16 세로 폰 프레임 + 캡션.
- **마스크 페이드**: 좌우 가장자리 8% 영역 자연 페이드.
- **검증 영역**: 모바일에서 카드 폭(280px) 화면 너무 차지하는지.

### 6. Bento Occasions 업데이트 — 챌린지 타일 추가 + 영상 임베드

기존 6 타일 → 7 타일 재배치. `size-wide mem` → `size-sm mem` 으로 축소해서 챌린지 자리 마련.

| 타일 | 변경 |
|---|---|
| 졸업식 (feat) | `videos/graduation.mp4` 임베드 |
| 결혼식 (size-md) | `videos/wedding_2.mp4` 임베드 |
| **챌린지·모임 (size-md, 신규)** | `videos/challenge.mp4` 임베드, 보라+골드 배경 |
| 기업 행사 (size-sm) | placeholder 유지 |
| 동창회 (size-sm) | placeholder 유지 |
| 생일 (size-sm) | placeholder 유지 |
| 추모 (size-sm, 축소됨) | placeholder 유지 |

```css
.bento .tile.has-video .art video.tile-video { position: absolute; inset: 0; width: 100%; height: 100%; object-fit: cover; z-index: 1; opacity: 0.92; }
.bento .tile.has-video .art::before { /* gradient overlay for text legibility */ }
.bento .tile.has-video .phones { display: none; } /* 실제 영상이 폰 추상화 대체 */

.bento .tile.chal .art {
  background:
    radial-gradient(40% 30% at 30% 30%, rgba(217, 100, 154, 0.18), transparent 60%),
    radial-gradient(50% 40% at 70% 70%, rgba(217,154,58,0.22), transparent 65%),
    linear-gradient(135deg, #1f1a26, #0c0b09);
}
```

### 7. Hero LIVE FEED 슬롯을 image-slot으로 — 사용자 드롭

기존 `.feed-item .thumb` (CSS gradient 더미) → `<image-slot>` 컴포넌트.

```html
<div class="thumb"><image-slot id="hero-thumb-01" shape="rounded" radius="8" placeholder=""></image-slot></div>
```

- 슬롯 수: 10개 (`hero-thumb-01` ~ `hero-thumb-10`)
- 마키 듀플리케이트로 20장 보이는 효과 (같은 id = 같은 이미지 공유)
- `.image-slots.state.json`에 자동 저장
- `image-slot.js` starter component 가져옴 (프로젝트 루트에 위치)

### 8. Moments 갤러리 섹션 신규 — 카테고리별 가로 마키

Showcase 다음, Occasions 앞에 신규 섹션. **JS로 슬롯 동적 생성**.

```html
<section class="moments" data-screen-label="05 Moments">
  ...
  <div class="strip cat-grad"><div class="strip-head">…</div>
    <div class="strip-track" data-category="grad" data-count="20"></div>
  </div>
  <div class="strip cat-wed">
    <div class="strip-track reverse" data-category="wed" data-count="20"></div>
  </div>
  <div class="strip cat-kpop">
    <div class="strip-track" data-category="kpop" data-count="10"></div>
  </div>
</section>

<script>
document.querySelectorAll('.strip-track[data-category]').forEach(track => {
  const cat = track.dataset.category;
  const count = parseInt(track.dataset.count, 10);
  const items = [];
  for (let i = 1; i <= count; i++) {
    const id = `m-${cat}-${String(i).padStart(2, '0')}`;
    items.push(`<div class="mslot"><image-slot id="${id}" shape="rounded" radius="14" placeholder=""></image-slot></div>`);
  }
  track.innerHTML = items.join('') + items.join(''); // 2배 복제 = seamless loop
});
</script>
```

- **3 카테고리 스트립**: 졸업식 20, 결혼식 20, K-pop 10 = 총 50 슬롯
- **결혼식 스트립은 `reverse`** — 시각 다양성 위해 반대 방향 스크롤 (75초 1바퀴, 다른 둘은 60초)
- **호버 시 일시정지**: `.strip:hover .strip-track { animation-play-state: paused; }`
- **컬러 액센트 분리**: 졸업식 골드옐로우, 결혼식 웜골드, K-pop 핑크

## 4가지 영상 임베드 위치 (요약 표)

| 영상 | Hero | Showcase | Bento |
|---|---|---|---|
| wedding_1 | ✅ 메인 배경 | ✅ Card 1 | — |
| wedding_2 | — | ✅ Card 2 | ✅ 결혼식 타일 |
| graduation | — | ✅ Card 3 | ✅ 졸업식 (feat) 타일 |
| challenge | — | ✅ Card 4 | ✅ 챌린지 타일 |

## 결정 이력 메모

- **챌린지·모임 카테고리 신규 추가**: 동창회 타일 대체 X. 신규 size-md 타일 추가. 추모 size-wide → size-sm 축소로 공간 마련.
- **K-pop 영상 단독 카테고리화 결정**: Occasions의 다른 행사들과 톤(네온·비비드) 너무 달라 별도 자리. 결과: Bento + Showcase + Moments 세 곳에 모두 노출.
- **Moments 슬롯 동적 생성 (JS)**: 50개 슬롯 HTML 직접 작성은 노이즈 큼. JS forEach 루프로 ID 자동 부여 (`m-grad-01` 등).
- **image-slot 같은 id 중복 사용**: 마키 듀플리케이트에서 같은 id 사용 = 같은 이미지 공유. 의도된 동작.
- **이미지 사양 결정**: 360×640 JPG q=85, 개당 50–100KB. Kling 768×1344 생성 후 리사이즈.

## 사용자 작업 가이드

미리보기에서 편집 모드로 전환 후:
1. **Hero LIVE FEED** 슬롯 10개에 혼합 이미지 드롭
2. **Moments 졸업식 스트립** 슬롯 20개에 졸업식 이미지 드롭
3. **Moments 결혼식 스트립** 슬롯 20개에 결혼식 이미지 드롭
4. **Moments K-pop 스트립** 슬롯 10개에 K-pop 이미지 드롭

드롭한 이미지는 `.image-slots.state.json`에 자동 저장됨. 새로고침해도 유지.

## 알려진 이슈

- **Kling 가짜 한글 텍스트**: 배경에 가짜 한국어 문자 종종 생성. C4 졸업식 영상에서 발견 후 negative prompt 강화 (`gibberish text, fake hangul, scrambled characters`).
- **Kling 다인원 부정확**: 5명+ 컷은 1회 생성으로 인원수 정확히 안 맞음. C2 영상 재생성 다수 (각자 폰 → 단체 셀카 구조로 최종 변경).
- **이탤릭 한글 합성**: Noto Serif KR은 이탤릭 글리프 없어 브라우저 합성. 약간 어색. 거슬리면 한글만 정자체 처리 필요.

## 다음 세션 후보

- 50장 썸네일 이미지 마무리 생성 (Kling Image, 분류·드롭)
- 결혼식 영상 풀버전 45초 만들지 / 15초 4편으로 유지할지 결정
- 기업행사·동창회·생일·추모 타일 영상화 여부 결정
- 사용 후기 섹션에 실제 사진/아바타 추가 검토
- 모바일에서 마키 스크롤 속도·터치 동작 점검
- 가격 페이지·신청 폼 디자인 시작
