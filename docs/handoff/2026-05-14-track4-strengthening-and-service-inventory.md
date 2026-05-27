## 세션 한 줄 요약

Track 4 디자인 시스템 강화(2라운드) 완료 + 외부 서비스 인벤토리 정찰
및 실전 테스트 사전 차단 액션 처리. 실전 테스트 진입 가능 상태.
다음 세션은 테스트 결과 회고 또는 테스트 기간 중 고도화 작업 영역.

## 본 세션 커밋

| # | 해시 | 메시지 | 핵심 변경 |
|---|---|---|---|
| 1 | cc255f8 | feat: brighten background tokens, unify primary buttons with gradient, expand halo to 3 key pages | Track 4 1차: 토큰 명도(#0c0b09→#13110f), Primary 12개 gradient 통일, 헤일로 3페이지 확산 |
| 2 | 5e6901b | refactor: strengthen Track 4 visual changes (background, button depth, halo intensity) | Track 4 2차 강화: 토큰 추가 상향(#13110f→#1f1c18), 버튼 입체감 풀세트(gradient 폭 확대+drop shadow+inset+glow), 헤일로 강도(opacity-15→25, ellipse 100%×90%) |
| 3 | e6d7be9 | docs: record external service inventory + pre-test risk mitigations | infra.md 결정 2건, known-issues.md GitHub Public 항목, PROJECT.md 인벤토리 표 9행 추가 |

3건 모두 origin/main 반영 완료.

## 본 세션 외부 처리 (코드 아닌 운영자 직접 작업)

| # | 작업 | 결과 |
|---|------|------|
| 1 | SOLAPI 충전 | 이전 잔액 47.1원/47건 → 충전 완료 |
| 2 | Firebase Spark → Blaze 전환 | 완료 |
| 3 | Firebase 예산 알림 $5 임계값 50/90/100% | 완료 |
| 4 | GitHub `.env` 노출 확인 | 결과 없음 — 안전 확정 |

---

## Track 4 결정·실행 결과

### 1차(cc255f8) 후 운영자 시각 확인

- 배경 명도 변화 "거의 모르겠음"
- 버튼 변화 "아예 안 보여서 어느 버튼 봐야 할지 모르겠음"
- 헤일로 "조금 더 늘었다 정도, 큰 차이 없음"

→ 추측 깨진 학습: 운영자가 표현한 "너무 어둡다·입체감·헤일로"는
보수적 옵션 B 한 칸 위 강도였음. 옵션 카드 작성 시 보수→중간→과감
3단계 중 중간을 추천으로 잡는 패턴으로 정정.

### 2차(5e6901b) 강화 결과 — 운영자 OK

- "이정도면 충분. 시각적으로 좋은 것을 고르는 것은 자신 없어서, 이정도
  해결하는 선으로 마감"
- 작은 버튼 3건 부담 후보 보고됨(host 재설정·upload 다시 시도·events
  영상 다운로드) — 실전 테스트 중 거슬리면 그때 경량화. 거론 보류.

### Track 4 최종 사양

- **배경 토큰**: --bg #1f1c18 / --surface #2a261f / --surface-2 #34302a
- **Primary 버튼 12건**: `bg-gradient-to-b from-[#f5b04a] to-[#a06f1f]`
  + shadow 풀세트(inset highlight + drop shadow + amber glow). glow-accent
  클래스 제거(shadow에 통합).
- **헤일로 4곳**: opacity-25, radial-gradient ellipse 100% 90%
  - 랜딩 Final CTA, host 로그인, upload standby, events done

---

## 외부 서비스 인벤토리 정찰 결과

### 9개 서비스 현황 (PROJECT.md에 표 형태로 영구 기록됨)

| # | 서비스 | 플랜 | 위험도 |
|---|--------|------|:-----:|
| 1 | Vercel | Pro | 🟢 |
| 2 | Firebase | Blaze (이번 세션 전환) | 🟢 |
| 3 | Shotstack | Pro $39/월 (192.42 credits) | 🟢 |
| 4 | SOLAPI | 충전식 (이번 세션 충전) | 🟢 |
| 5 | Resend | Free | 🟢 |
| 6 | AWS | Free Trial ($100, 169일 남음) | 🟢 |
| 7 | GitHub Actions | Public 무료 무제한 | 🟢 |
| 8 | 카카오 | 무료 API (월 4/300만 사용) | 🟢 |
| 9 | 도메인 (가비아) | 1년 등록 | 🟢 |

### 사전 차단 처리된 위험

- **SOLAPI 잔액 거의 0** → 충전으로 차단 (decisions/infra.md 기록)
- **Firebase Spark 한도 도달 가능성** → Blaze 전환 + 예산 알림 설정
  (decisions/infra.md 기록)

### 미해결 — 정찰 중 발견된 추가 결정 필요 영역

1. **GitHub Public 유지 여부** (known-issues.md 추가됨)
   - 운영자 직감 "Public이 당연한가" 정확함. 실서비스에선 Private이 표준.
   - 1단계 위험(env 노출) 차단됨. 2·3단계(코드 + docs 노출) 노출 중.
   - **결정 보류**: 실전 테스트 우선. 테스트 후 처리.
   - **CC 정찰에서 발견**: decisions/infra.md에 "2026-05-07 Cron 이전:
     GitHub Actions → Vercel Cron, Pro 업그레이드"가 이미 기록되어 있음.
     즉 Vercel Cron 이전은 처리 완료된 상태. known-issues.md에 적힌
     "권장: Vercel Cron Jobs 이전" 문구는 이미 완료 사실 반영 필요
     (다음 세션 보정 항목).

2. **AWS 무료 트라이얼 만료 (~2026-10-28)**
   - 169일 남음. 만료 전 결제 카드 자동 청구 전환 / 다른 인프라 이전
     검토 필요.
   - **격상 트리거**: 만료 30일 전 (~2026-09-28).

---

## 본 세션 학습

1. **보수적 옵션 패턴 한 칸 위로** — Track 4 1차에서 추천 B(보수적)
   채택했으나 변화 폭 부족. 운영자가 자체 시각 판단에 자신 없을 때는
   "중간" 옵션이 적절. 다음부터 시각·UX 영역 옵션 카드는 보수→중간→과감
   3단계 중 중간 추천 패턴 적용.

2. **권장 액션 제시 전 영역 파일 정찰** — 외부 서비스 정찰 중 "Vercel
   Cron Jobs 이전 권장" 안내했으나 사실 이미 처리된 작업이었음
   (decisions/infra.md 2026-05-07 기록). 자동 첨부 안 된 영역 파일에
   결정 본문이 있을 수 있으므로, 권장 액션 제시 전에 해당 영역 파일
   첨부 요청 또는 CC에 사전 정찰 위임이 안전.

3. **`.env` 노출 확인 = 30초로 큰 사고 차단** — Public 저장소에서
   환경변수 누출 여부가 가장 큰 위험. GitHub 검색 30초로 안전 확정.
   다음 Public 저장소 운영 시 같은 점검 패턴 표준화.

4. **자동 첨부 ≠ 모든 정보** — 자동 첨부되는 건 CLAUDE.md, AGENTS.md,
   DECISIONS.md(인덱스만), known-issues.md, PROJECT.md 5개. **영역별
   결정 본문(infra.md, market-product.md 등)은 안 들어옴**. 영역 깊이
   필요 시 운영자 첨부 또는 CC 위임.

5. **CC 검증 표 진화** — 1차 라운드 "이전 세션 확인" 갈음 패턴 발견 후
   정정 요청 → 2차 라운드부터 현 세션 직접 실행 명시로 개선됨. 정정
   요청이 한 번 통하면 유지되는 패턴 관측.

6. **운영자 직감 신뢰** — Public 안전성 질문에서 운영자 직감이 정확했음.
   "당연한가?" 류 질문은 무의식적 의심 신호. 가볍게 넘기지 말고 솔직한
   평가 + 트레이드오프 제시 패턴 강화.

---

## 미해결 — 다음 세션 진입점

### 운영자 의사 — 실전 테스트 + 그 사이 고도화 병행

운영자 원문: "실전 테스트 실시하는 데는 며칠이 걸릴거고, 그 사이에도
앱은 계속 고도화할거야"

→ 다음 세션은 두 갈래 가능:
- (a) 실전 테스트 결과 회고 (테스트 1회차 끝난 경우)
- (b) 테스트 기간 중 고도화 작업 (영역은 운영자가 가져옴)

### 고도화 작업 후보 (운영자가 선택 시 진입)

다음은 known-issues.md·정찰 결과·이번 세션에서 거론된 후보들. 운영자가
다음 세션 시작 시 어느 영역부터 들어갈지 선택하면 됨.

**(거론 보류 큐 — 실전 테스트 결과 후 결정 영역)**:
| 항목 | 출처 |
|------|------|
| 재렌더 UX 갭 (done 상태 버튼 미노출) | known-issues |
| 완성본 단일 필드 덮어쓰기 → 서브컬렉션 전환 (D2) | known-issues |
| 클립 메타데이터 저장 실패 (S3 고아 파일) | known-issues |
| 호스트 클립 제거 시 영상 미리보기 흐름 검증 | known-issues |
| 영상 호스팅 CDN 이전 (R2 vs Shotstack) | known-issues |
| 미성년자 영상 법적 리스크 | known-issues |
| 네이버 메일 도달성 | known-issues |
| BGM 다양성 격상 | 이전 세션 보류 |
| 야외 환경 음량 검증 | 이전 세션 보류 |

**(보류 큐 — 운영자 트리거 대기)**:
| 항목 | 출처 |
|------|------|
| Track 1-B 카메라 광각 픽스 (iPhone 실기기 디버그) | 이전 세션 |
| Track 4 작은 버튼 3건 부담 가능 (실전 후 평가) | 본 세션 |
| Track 5 빈 텍스트 의도적 비우기 불가 (YAGNI 보류) | 이전 세션 |
| GitHub Private 전환 (Vercel Cron 이전 후) | 본 세션 |

**(예정된 작업 트리거)**:
- AWS 무료 트라이얼 만료 30일 전 (~2026-09-28) — 결제 전환 또는 이전 결정

### 보정 후보 (다음 세션 첫 작업 가능)

- known-issues.md "GitHub 저장소 Public 유지" 항목의 "권장: Vercel Cron
  Jobs 이전" 문구가 부정확. 이미 2026-05-07 결정으로 이전 완료된 상태
  (decisions/infra.md). 한 줄 문구 보정.

---

## 다음 세션 시작 시 운영자 작업 — 5개 셋트

진입점: **운영자가 가져오는 고도화 영역 또는 실전 테스트 결과 회고**.

- CLAUDE.md (자동 첨부)
- AGENTS.md (자동 첨부)
- 본 핸드오프 (`2026-05-14-track4-strengthening-and-service-inventory.md`)
  ← 운영자 직접 첨부
- DECISIONS.md 인덱스 (자동 첨부)
- known-issues.md (자동 첨부)

작업 영역 파일은 진입 결정 후 영역에 맞춰 첨부.

### 진입 시나리오별 추가 필요 자료

| 진입 시나리오 | 추가 첨부 |
|--------------|----------|
| 실전 테스트 결과 회고 | 운영자가 관찰한 사고·패턴 메모 (자유 형식) |
| 코드 변경 영역 진입 | 해당 영역 코드 파일 + 관련 decisions 영역 파일 |
| 인프라·결제 영역 진입 | decisions/infra.md (자동 첨부 안 됨) |
| 시장·BM 영역 진입 | decisions/market-product.md (자동 첨부 안 됨) |

**첫 메시지 한 줄 (운영자 결정 시 자유 선택)**:

"본 핸드오프 외엔 모르는 것으로 간주, 진단·결정 시 모르는 영역이면
명시. CC 보고 받으면 검증 표 먼저. 이번 세션 진입점은 [영역명]."
