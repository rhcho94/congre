# 로드맵 / 백로그 / 알려진 이슈

## 진행 중

특별히 진행 중인 작업 없음. 다음 작업 후보 참조.

## 다음 작업 후보

### ✅ 알림 시스템 Phase 1 완료 (2026-05-03)

- ✅ congre.kr 도메인 가비아 등록 (1년)
- ✅ Resend 가입 + congre.kr 도메인 인증 (DKIM/SPF/DMARC)
- ✅ SOLAPI 가입 + 발신번호 등록 + API 키 발급
- ✅ .env.local 6개 변수 입력
- ✅ 시나리오 5/5건 발송 검증 완료 (event_created, render_completed, render_delayed, render_failed, render_started)
- ✅ notifications:history undefined 에러 수정 (commit bcfe1f3)
- ✅ SMS failedMessageList 상세 사유 출력 (commit 79af076)

### render_delayed 장애 대응 시나리오 재설계

배경: 편집 지연 시 단순 완료 사후 안내보다 비즈니스 임팩트가 큼 — 행사 중 상영 계획 무산, 결혼식 등 재현 불가 행사에서의 환불 사유, 완성본 미생성 가능성.

**상태: 전체 완료 (2026-05-05)**
세부 사항: docs/DECISIONS.md `## 2026-05-04` 항목 + docs/handoff/2026-05-04.md, docs/handoff/2026-05-05.md 참조.

코드 작업 체크리스트:
- [x] [1] /api/render/start 인증 추가 + E 계산 + 새 필드 기록
- [x] [2] 알림 템플릿 5종 추가 (render-started, render-delayed, refund-50, refund-100, render-completed)
- [x] [3] /api/cron/check-render-deadlines 신설
- [x] [4] /api/render/complete 수정 (refundStatus 따라 분기)
- [x] [5] GitHub Actions 워크플로 추가 (.github/workflows/cron-check-deadlines.yml)
- [x] [6] 운영 작업:
  - [x] CRON_SECRET 등록 (Vercel + GitHub Secrets)
  - [x] NEXT_PUBLIC_APP_URL / APP_URL 등록 (Vercel + GitHub Secrets)
  - [x] GitHub Actions 수동 실행 통과 + cron 5분 간격 조정
  - [x] 카카오톡 채널 @congre 개설 (검색용 ID `congre`, 채팅 허용)
  - [x] CONGRE_INTERNAL_PHONE Vercel 등록 (`01075822020`, Redeploy 완료)

### 알림 시스템 Phase 2

- 시나리오 2건 트리거 연결 (첫 클립 업로드 → clips onCreate 훅, 참가자 결과 → 참가자 연락처 수집 선행 필요)
- 알림 자동 재시도 — 채널 실패 시 재시도 로직 (Vercel Cron or queue) ← render_delayed 재설계 완료 후 진행 권장 (cron 인프라 공유)

### 보안

- Firestore 보안 규칙 종합 점검 (clips create 검증, events update 권한 강화)
  - /api/render/complete: 현재 401 잠금 상태. 향후 Shotstack webhook 서명 검증 후 재활성화 검토

### 결제

- 유료 플랜 결제 (토스페이먼츠)

### 영상 강화

- **한글 인트로/아웃트로** — 행사 주최자 텍스트 입력, Shotstack HTML asset + 커스텀 TTF 렌더. 상세: docs/known-issues.md
- **영상 강화 방향 6항목 평가** — 인물 보정·배경 정리·특수효과·인아웃 효과·코멘트 자막·인트로/아웃트로. 현재 Shotstack 가능 범위 확인 및 부족한 항목 대체 플랫폼 검토. 상세: docs/DECISIONS.md (2026-05-05)
- **/probe API 기반 예상 편집 시간 안내** (선택) — 사용자 피드백 시 구현 검토. 상세: docs/DECISIONS.md (2026-05-05)

### 기타

- FCM 푸시 알림 — iOS 16.4+ 지원 확인 후 재검토

## 출시 전 처리 필수 항목

- **비용 모니터링 셋업** (출시 차단) — Shotstack·AWS S3·SOLAPI·Resend 각 서비스별 사용량·비용 알림 설정. 출시 후 예상치 못한 과금 방지.

## 보류 중 (나중에 검토 필요)

- **글로벌 B2B 진출 시 도메인·브랜드 전략 재검토**
  - `congre.com`은 일본 컨벤션·행사 컨설팅 회사 보유 중 — 글로벌 진출 시 충돌 가능성
  - 옵션: 이름 유지 + 다른 TLD / 변형 이름 + .com / 새 이름 + .com / congre.com 인수
  - 결정 시점: 글로벌 진출 직전 (마케팅 본격화 전)

- **청첩장 글로벌 B2B 전략 검토** (별도 세션)

## 약한 고리 (2026-05-06 재평가 — 1순위 시장 학교 졸업식 반영)

우선순위 순:

1. **Firestore 보안 — 미성년자 데이터** (Phase B로 분리, 작업 진입 대기). `events` 컬렉션 `allow read: if true`로 sessionToken·organizerEmail·organizerPhone 노출. 학생 영상이 미성년자 개인정보라 격상.
2. **알림 도달성 — 네이버 메일 미해결** (handoff 2026-05-05-evening 별도 작업 후보). 학부모·교사 사용자 비율 높아 격상. SPF/DKIM 인증 점검 필요.
3. **cron 신뢰성 — webhook 도입 후보** (신규). GitHub Actions runner 할당 지연으로 "렌더 끝났는데 알림 늦음" 발생. 표준 답은 **Shotstack webhook 도입 + 현재 cron을 fallback으로**. 작업 1단계: Shotstack webhook 지원 여부 docs 확인.
4. ~~단일 편집 엔진 의존~~ → 약점이 아닌 비즈니스 leverage로 재평가. "시장에서 커지면 Shotstack에 한국 시장 패키지 협상" (DECISIONS 시장 정의 참조).

## 다음 작업 후보 (시장 정의 후 추가)

- **클립 제외 기능**: 행사 주최자가 부적절한 클립을 전체 편집에서 제외. 미성년자 영상 맥락에선 "본인 동의 철회권" 측면도 있어 권한 모델 설계 필요. 시점(렌더 전 vs 후) 트레이드오프 검토 필요.

## 알려진 이슈

상세 추적은 [`known-issues.md`](./known-issues.md) 참조.

요약:
- `clipCount` permission-denied (무시 중, 기능 영향 없음)
