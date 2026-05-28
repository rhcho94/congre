# 2026-05-29 — B 트랙 docs 정식 반영 + A 트랙 가격 정책 결정 + gitignore 정리

## 본 세션 한 줄 요약

직전 2026-05-28 B 트랙(가격 페이지 + 리드 폼) 작업의 docs 정식 반영, A 트랙(가격 정책) 결정 박기, gitignore 위생 정리. 코드 변경 0건, 4커밋 모두 docs/git 메타. 부수적으로 7일 묵은 D1 누락 정정(B5 갱신 메모) + 직전 세션 핸드오프 추적 누락 정정까지 잡힘.

## 본 세션 커밋

| 해시 | 메시지 |
|---|---|
| 27bbad1 | docs: reflect 2026-05-28 B-track (pricing page + lead form) into decisions/known-issues/changelog/project |
| 068aa44 | docs: fix duplicate L6 numbering in known-issues (pricing Pretendard → L7) |
| e03247b | docs: A-track pricing policy decision + fix D1 B5 update gap |
| fc36fb7 | chore: gitignore desktop.ini + *.docx, track guide-content + reference + missing handoff |

## 본 세션 결정·발견

### A 트랙 가격 정책 (decisions/market-product.md 2026-05-28 (2))

B5 빈칸 채우기. 6개 결정:
1. 가격 산정 기준 = 행사 사진 가격대 이하 (원가 기반 아님, Shotstack 원가는 사후 실측)
2. 세그먼트 차등 없음 (행사 유형 무관 동일 가격)
3. 커스텀 상담 트랙 신설 (결혼식 특수 옵션·졸업식 학교 공식 신청은 별도 청구. /pricing 폼이 사실상 진입점)
4. PG = 토스페이먼츠 방향, 구현은 사업자 준비 후 보류
5. 워터마크 = 없는 방향 + 정찰 영역
6. **A 트랙 메타**: 본 트랙은 정책 + 홈피 표시 테스트 영역. 결제 기능 구현은 차후 별도 트랙.

### D1 B5 누락 정정 (decisions/rendering.md)

2026-05-21 B5 본문에 "rendering.md D1 갱신 트리거"가 박혀 있었으나 7일간 처리 누락. 본 세션이 D1 "**결정**" 줄 다음에 "**2026-05-21 B5 갱신**" 메모 한 줄 추가로 정정. data-flow.md D2는 같은 트리거를 같은 날 처리한 것과 비교됨.

### 신규 known-issues 3건

- 리드 폼 수신지 코드 상수 하드코딩 (임시 = 개인 네이버)
- 리드 폼 rate limit 미구현 (honeypot만, TODO 주석)
- L7. pricing.html Pretendard 미전환 (R9 zip 적용 시 누락 방지)

### L6 중복 정정

직전 세션 27bbad1이 신규 랜딩 항목을 L6으로 매겨 본 앱 L6(OneDrive)와 충돌. L 번호는 섹션 무관 전역 일련번호인데 CC가 섹션 내부 기준으로 매김. 068aa44에서 L7로 정정. 본 앱 L6은 무변경 (다른 docs 참조 중).

### 추적 누락 정정 (fc36fb7)

- 직전 세션 핸드오프(`2026-05-28-pricing-page-lead-form.md`) 추적 누락 발견 → git add
- guide-content.md + reference/ 16개 PNG 추적 시작
- desktop.ini + *.docx는 .gitignore 무시

## 본 세션 학습 (CLAUDE.md 학습 룰 후보)

- **"갱신 트리거" 표시는 같은 세션에 처리해야 함** — B5 본문의 "D1 갱신 트리거"가 7일 휘발됨. 표시만 해놓으면 다음 세션이 그걸 알 길이 없음. 같은 세션 처리 or 별도 to-do 가시화 필요.
- **CC L 번호 부여 시 "전역 일련번호" 명시 필요** — 섹션 내부 기준으로 매기는 패턴 관측. 프롬프트에 "L은 전역 카운터, 다음 빈 번호 부여"로 박을 것.
- **CC 메타 코멘트 재발 패턴** — CLAUDE.md 절대 규칙에 박혀 있어도 첫 1~2턴에 ※recap 끼움. 프롬프트 끝에 "recap·다음 단계·합계표 끼우지 말 것" 명시할 때만 안 함. 즉 매 프롬프트 끝에 명시 필요.

위 3개는 학습 룰 정식 격상 후보. 본 세션에서는 격상 안 함 (CLAUDE.md 수정은 별도 트랙).

## 미완 작업

없음. 본 세션 모든 트랙 마감.

## 다음 세션 후보

### 우선순위 높음
- **워터마크 정찰** (A 트랙 5번 후속) — CC 정찰 영역. Shotstack 자체 워터마크 옵션 + 후처리 구현 비용 + 무료 플랜 인센티브 구조 트레이드오프 확인 후 결정.

### CD 토큰 복구 후
- **R4 결과물 섹션** — 직전 핸드오프(2026-05-28)에 "사양 확정·CD 영어 프롬프트 작성 완료" 상태로 박혀 있음. CD 복구 즉시 진입 가능.
- **R5~R8 + R9 zip 적용** — 랜딩 리뉴얼 잔여. R9 적용 시 KI-L7(pricing.html Pretendard) 같이 처리해야 함.
- **덩어리 2: 홈피 가격 표시 UI** — A 트랙 결정의 자연스러운 후속. /pricing 페이지에 실제 플랜 표 노출. CD/CC 협업 영역.

### 운영자 결정 후
- **CLAUDE.md 학습 룰 3건 격상** (위 학습 영역) — 패턴 충분히 관측됨 판단 시.
- **회사 메일함 구축** — KI 리드 폼 수신지 복원 트리거.

### reference/ 16개 PNG 영역
- 운영자 검증 필요 (민감 정보·추적 가치). 문제 발견 시 git history 정리.

## 다음 세션 진입 컨텍스트

운영자 첫 메시지에 포함할 것:
- 본 핸드오프 첨부
- 작업 영역 명시 (워터마크 정찰 / R4 CD / 덩어리 2 표시 / 학습 룰 격상 중 택1)
- 워터마크 정찰이면: 운영자 결정 영역 없음, CC가 정찰 → 보고 → 결정 갈래 운영자 검토
- R4면: CD 토큰 복구 확인 + 직전 세션 영어 프롬프트 위치 알려주기
