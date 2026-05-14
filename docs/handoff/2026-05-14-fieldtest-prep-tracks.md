## 세션 한 줄 요약

실전 테스트 전 자잘한 보완 작업 5트랙 처리 (1-A·2·3·5 완료, 1-B 보류,
4 정찰만). 다음 세션은 트랙 4 사양 결정·실행 영역.

## 본 세션 커밋

| # | 해시 | 메시지 | 핵심 변경 |
|---|---|---|---|
| 1 | (known-issues) | docs: remove resolved env/cron known-issues | known-issues 2건 제거 (환경변수 이미 등록 상태 확인, GitHub Actions cron 항목) |
| 2 | b4fe433 | feat: increase max clip duration 10s → 16s | upload 페이지 MAX_SEC 10→16, 안내 문구·UI 동기화 |
| 3 | c3c69e3 | feat: simplify event creation form + redesign intro/outro section | 인트로/아웃트로 섹션 카드화·순서 재배치, 이벤트 생성 폼 간소화 |
| 4 | 498695d | chore: rewrite landing copy "10초 영상" → "짧은 축하 동영상" | 랜딩 카피 전체 10초 언급 제거, 표현 유연화 |
| 5 | 29ee9f4 | feat: auto-save intro/outro text with debounce, remove manual save button | 텍스트 debounce 자동 저장(500ms), 저장 버튼 제거, 저장 상태 라벨 추가 |

push 완료, origin/main 반영.

## 트랙별 결과 정리 표

| 트랙 | 영역 | 결과 | 커밋 | 미해결 |
|------|------|------|------|--------|
| 1-A | 클립 최대 길이 10→16초 | ✓ 완료 | b4fe433 | — |
| 1-B | 카메라 화각 (광각 방지) | 보류 | — | 아이폰 실기기 디버그 필요 (하단 사유 참조) |
| 2 | 인트로/아웃트로 UX 재배치 + 카드화 | ✓ 완료 | c3c69e3 | — |
| 3 | 랜딩 카피 "10초 영상" 제거 | ✓ 완료 | 498695d | — |
| 4 | 디자인 시스템 묶음 | 정찰만 완료 | — | 사양 결정·실행 다음 세션 |
| 5 | 자동 저장 + 저장 손실 방지 | ✓ 완료 | 29ee9f4 | 빈 텍스트 의도적 비우기 불가 (YAGNI, 별도 트랙) |

## 트랙 1-B 보류 사유 + 재개 트리거

**사유**: `pickStandardBackCamera` 로직이 광각을 막으려 설계됐으나 운영자
기기에서 여전히 광각 발생. 라벨 매칭(`"후면 카메라"` / `"Back Camera"`)
실패 추정. 실기기에서 카메라 라벨 디버그 로그를 찍어야 실제 라벨값
확인 후 최적 픽스 결정 가능.

**재개 트리거**: 운영자가 아이폰 실기기 가진 사람 섭외. 디버그 로그 추가
→ 라벨 출력 확인 → 라벨 매칭 보강 또는 다른 선택지(facingMode 강제 등)
결정. 운영자 거론 전까지 더 안 꺼냄.

## 트랙 4 정찰 결과 요약 — 다음 세션 사양 결정 영역

### 디자인 토큰 매핑

- **정의 위치**: `src/app/globals.css` 단일 파일 `:root` (line 3-11)
- **Tailwind 매핑**: `@theme inline`으로 전체 Tailwind 유틸리티에 자동 연결
- **영향 범위**: CSS 변수 1줄 변경 → 전체 10개 파일 즉시 반영. 수동 수정 불필요.
- **`--surface-2` 함정**: Tailwind 매핑명이 `--color-surface2` (하이픈 없음). Tailwind 클래스 `bg-surface-2`가 아닌 `bg-[var(--surface-2)]` 인라인으로 사용 중. 작업 시 주의.

| 토큰 | 값 | Tailwind 클래스 |
|------|-----|----------------|
| `--bg` | `#0c0b09` | `bg-background` |
| `--surface` | `#151310` | `bg-surface` |
| `--surface-2` | `#1e1a13` | `bg-[var(--surface-2)]` (인라인만) |
| `--text` | `#ede8df` | `text-foreground` |
| `--muted` | `#79716a` | `text-muted` |
| `--accent` | `#c8892c` | `text-accent`, `bg-accent` |
| `--accent-bright` | `#e8a038` | `text-accent-bright` |

### 헤일로 효과 — 정체 확인

운영자가 "지금 시작해보세요 주변 헤일로"라 한 것은 **버튼 box-shadow가
아닌 섹션 배경 레이어**. 두 효과가 중첩됨.

**레이어 1 — 섹션 배경 헤일로** (`src/app/page.tsx` line 289-294):
```jsx
<div
  className="pointer-events-none absolute inset-0 opacity-15"
  style={{
    background: "radial-gradient(ellipse 70% 60% at 50% 50%, #c8892c 0%, transparent 70%)",
  }}
  aria-hidden
/>
```
현재 `src/app/page.tsx` Final CTA 섹션에만 존재. 다른 페이지 없음.

**레이어 2 — 버튼 box-shadow** (`globals.css` line 69-71):
```css
.glow-accent {
  box-shadow: 0 0 40px 0 rgba(200, 137, 44, 0.18);
}
```
이미 대부분 Primary CTA 버튼에 적용 중.

**섹션 헤일로 적용 시 필요 작업**: 대상 section에 `relative` + 헤일로 div
삽입 + 기존 콘텐츠 `relative` 감싸기. 파일당 3~5줄.

### 버튼 패턴 분류

| 분류 | 패턴 | glow | scale | 사용처 수 |
|------|------|:----:|:-----:|:--------:|
| Primary A (Full) | `bg-accent glow-accent hover:scale-[1.02] active:scale-[0.98]` | ✓ | ✓ | 2 (랜딩만) |
| Primary B (Simple) | `bg-accent glow-accent hover:brightness-110` | ✓ | ✗ | 8 |
| Primary C (No glow) | `bg-accent hover:brightness-110` | ✗ | ✗ | 2 ← 불일관 |
| Secondary | `border border-border hover:border-accent` | ✗ | ✗ | 5 |
| Ghost link | `text-accent hover:brightness-110` | ✗ | ✗ | 3 |
| Destructive | `bg-red-600 hover:bg-red-700` | ✗ | ✗ | 2 |
| Icon toggle | dynamic inline style | ✗ | ✗ | 4 |

**Primary C 불일관 2건**:
- `host/page.tsx` line 339 — "재설정 메일 보내기" (비밀번호 재설정 모달 내)
- `upload/[eventId]/page.tsx` line 780 — "다시 시도" (에러 복구 버튼)

### 헤일로 확산 후보 (객관 평가)

| 페이지 | 영역 | 적용 권장 | 사유 |
|--------|------|:--------:|------|
| `host/page.tsx` | 로그인 폼 섹션 | ✓ | 핵심 전환점. 감성 강화 적합 |
| `upload/[eventId]/page.tsx` | 촬영 시작 영역 | ✓ | 참가자 경험 핵심 순간 |
| `events/[eventId]/page.tsx` | 영상 완성 영역 (done status) | ✓ | 감동 포인트 |
| `dashboard/create/page.tsx` | 이벤트 생성 폼 | △ | 폼 작성 집중 방해 가능성 |
| `dashboard/page.tsx` | 이벤트 목록 헤더 | ✗ | 관리 화면, 실용성 우선 |

---

## 본 세션 학습

1. **known-issues 문서가 현실 뒤처짐** — 정찰 단계가 작업 자체를 대체한
   케이스. 환경변수 등록 이미 됐음을 정찰에서 확인 → 작업 불필요 판명.
   작업 시작 전 정찰로 "이미 해결된 문제인가" 점검 가치 큼.

2. **트랙 1-A 대시보드 안내 "16초 이내 권장" 교차 발견** — 사실은 참가자
   클립 안내가 아닌 인트로/아웃트로 미디어 안내였음. 트랙 2 정찰에서 발견.
   정찰 깊이가 부족했던 영역 (트랙 경계 넘어 영향 발견 케이스).

3. **자동 저장 > 다이얼로그 경고** — 트랙 5에서 저장 손실 방지 방식으로
   "마감 전 경고 다이얼로그" 대신 "자동 저장"을 선택. 사용자 데이터 손실
   시점 차단이 더 안전한 패턴.

4. **빈 텍스트 skip 사양의 부작용** — 자동 저장 debounce에서 빈 텍스트를
   skip하면 의도적 비우기 불가능. 이전 저장값이 Firestore에 그대로 남음.
   운영자 결정(YAGNI)으로 별도 트랙 영역으로 분리. 알려진 한계.

5. **`isClosed` 대신 `event?.status` 직접 사용** — derived value를 useEffect
   의존성에 넣으면 scope 문제 + 불필요한 재실행 위험. `event?.status`
   (primitive string)을 dep array에 직접 사용하는 것이 React 관례에 맞음.

6. **헤일로 = 버튼 box-shadow가 아닌 섹션 배경 레이어** — 운영자 표현
   "버튼 주변 헤일로"와 실제 구현 차이. 정찰로 확인. 다음 세션 사양 결정
   시 운영자 명확화 필요 영역.

7. **자체 검증 표 패턴** — 트랙 4 정찰 보고에 자체 검증 7항목 끼워 넣어
   사실 영역 정확성 선보증. 다음 세션 정찰들에도 표준화 권장.

---

## 미해결 — 다음 세션 진입점

### 트랙 4 사양 결정 라운드 (다음 세션 진입점)

운영자 결정 필요 3개 영역:

| # | 영역 | 현재 상태 | 결정 필요 |
|---|------|----------|----------|
| (3) | 배경·글자색 명도 | `--bg: #0c0b09` 너무 어둡다 판단 | 어느 정도까지 밝게 할지 + 토큰값 |
| (5) | 버튼 입체감 패턴 | flat (glow-accent box-shadow만) | shadow / gradient / inset / bevel 선택 |
| (6) | 헤일로 확산 범위 | 랜딩 Final CTA 섹션만 | host·upload·events done 추천 vs 범위 직접 결정 |

운영자 결정 후 실행 단계 분해 예정.

### 트랙 1-B 카메라 화각 (보류 큐)

운영자 거론 전까지 더 안 꺼냄.

### 거론 보류 큐 (실전 테스트 결과 후 결정)

운영자 원문: "다른 모든 이슈는 실전테스트 결과를 보고 결정. 기록해 놓고
내가 물어볼 때까지 더이상 거론하지 말 것"

| 항목 | 메모 |
|------|------|
| 재렌더 UX 갭 (done 상태 버튼 미노출) | 보류 |
| 완성본 단일 필드 덮어쓰기 | 보류 |
| 클립 메타데이터 저장 실패 (S3 고아 파일) | 보류 |
| 호스트 클립 제거 시 영상 미리보기 흐름 검증 | 보류 |
| 영상 호스팅 CDN 이전 | 보류 |
| 미성년자 영상 법적 리스크 | 보류 |
| 네이버 메일 도달성 | 보류 |
| BGM 다양성 격상 | 보류 |
| 야외 환경 음량 검증 | 보류 |

---

## 다음 세션 시작 시 운영자 작업 — 5개 셋트

진입점: **트랙 4 사양 결정 라운드**.

- CLAUDE.md (자동 첨부)
- AGENTS.md (자동 첨부)
- 본 핸드오프 (`2026-05-14-fieldtest-prep-tracks.md`) ← 운영자 직접 첨부
- DECISIONS.md 인덱스 (자동 첨부)
- known-issues.md (자동 첨부)

작업 영역 파일은 트랙 4 사양 결정 후 실행 단계 진입 시 영역에 맞춰 첨부.

**첫 메시지 한 줄**:

"실전 테스트 전 트랙 4 사양 결정 라운드. 핸드오프 정찰 결과 기반. 외엔
모르는 것으로 간주, 진단·결정 시 모르는 영역이면 명시. CC 보고 받으면
검증 표 먼저."
