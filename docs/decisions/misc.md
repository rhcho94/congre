# Decisions — Misc

> 영역 외 결정 (프로세스 룰·UI 라이브러리 등). 새 결정은 맨 위에 추가 (최신이 위).

## 2026-05-14 (2) — Track 4 강화: 1차 변경 폭 부족 → 한 단계 상향

- **결정**: (1) 배경 토큰 추가 명도 상향 (#13110f→#1f1c18 / #1c1916→#2a261f / #26211a→#34302a). (2) Primary 버튼 그라디언트를 더 밝은 팔레트(from-[#f5b04a] to-[#a06f1f])로 교체 + inset highlight·drop shadow·amber glow 복합 shadow 풀세트 적용 + glow-accent 클래스 제거(shadow에 통합). (3) 헤일로 4곳(landing Final CTA·host·upload·events done) opacity-15→opacity-25, ellipse 70% 60%→100% 90%로 강화.
- **이유**: 1차(cc255f8) 변경 후 실제 화면에서 변화 폭이 시각적으로 부족했음. 배경 너무 어두움, 버튼 입체감 부족, 헤일로 너무 희미. 한 단계 추가 상향.
- **적용**: `globals.css` 토큰 3개. 5개 파일 12개 버튼 shadow 풀세트 교체. 4곳 헤일로 opacity·ellipse 수정(page.tsx Final CTA에 zIndex:-1 추가 포함).

## 2026-05-14 — 디자인 시스템 통합: 토큰 명도·버튼 입체감·헤일로 확산

- **결정**: (1) 배경 토큰 3개 명도 상향 (#0c0b09→#13110f / #151310→#1c1916 / #1e1a13→#26211a). (2) Primary 버튼 `bg-accent` → `bg-gradient-to-b from-accent-bright to-accent`로 통일. Primary C 불일관 2건(재설정 메일·다시 시도)도 `glow-accent` 추가해 정규화. (3) Final CTA 헤일로 패턴(`radial-gradient amber opacity-15`)을 host 로그인·upload standby·events done 3곳에 확산.
- **이유**: 배경이 너무 어두워 가독성 낮았음. 버튼 3개 분류가 불일관으로 디자인 시스템 신뢰도 저하. 헤일로는 핵심 전환·감동 포인트에만 선택적 적용.
- **적용**: `src/app/globals.css` 토큰 3개. 6개 파일 12개 Primary 버튼 className. 3개 페이지 헤일로(`relative isolate` 컨테이너 + `absolute zIndex:-1` halo div 패턴).

## 2026-05-08 — 갈래 패턴: 정찰 → 코드 커밋 → 문서 커밋

- **결정**: 큰 기능은 갈래로 분리. 각 갈래: 정찰(코드 변경 없음) → 코드 atomic 커밋 → 다음 갈래 정찰... → 완료 후 문서 갱신 atomic 커밋 1개.
- **이유**: 정찰이 실행 범위를 결정하므로 선행 필요. 문서는 완료된 사실을 기록하므로 코드 후행. 중간 문서 갱신은 미완성 상태를 기록하게 되어 혼란 유발.
- **적용**: 인트로/아웃트로 작업이 초안 — 갈래 1(폰트) → 갈래 2(UI/API) → 갈래 3(Shotstack 연결 + 디버그 + 미세 수정) → 갈래 4(문서) 순서.

## 2026-05-01 — 파티클 효과: canvas-confetti + CSS 하이브리드

- **결정**: 랜딩 페이지 burst는 canvas-confetti, 영상 주변 sparkle은 순수 CSS.
- **이유**: canvas-confetti는 7KB gzipped, 의존성 0개. burst 형태가 자연스럽게 구현되며 RAF 기반이라 끝나면 자동 정리. sparkle은 idle 상태에서 CPU 안 먹게 GPU 합성으로 처리.
- **대안**: tsparticles는 60KB+로 과함. 순수 CSS만으로는 다수 입자 burst가 키프레임 관리 부담.
