# 2026-08-05 핸드오프 — 에러 키 전수 정찰 + 문서 반영

## 한 줄 요약
직전 세션 미확인 항목이던 `errBody.code` 전역 잔존 여부를 scout 전수 정찰로 "없음" 확정. 정찰 중 드러난 에러 키 관례 예외 2곳은 코드를 고치지 않고 문서(known-issues + CLAUDE.md 절대 규칙)로만 처리. 세션 초에 Project Knowledge 3주 stale 드리프트를 발견해 재업로드로 복구.

## 이번 세션 커밋
- `dcbe657` docs: API 에러 키 관례 예외 2곳 등재 + 서버 단독 변경 금지 규약 — 3파일 17줄 추가(CLAUDE.md +1 / docs/CHANGELOG.md +4 / docs/known-issues.md +12). src 무변경.
  - **push 결과 미보고 상태로 세션 종료**. 본 핸드오프 커밋과 함께 push되면 해소.

## 이번 세션 결정·발견

### 1. Project Knowledge 드리프트 (세션 초 발견 → 복구 완료)
자동 첨부 문서가 레포보다 약 3주 뒤처져 있었음. 실측 근거: DECISIONS 인덱스 rendering 38/legal 2/misc 6(레포는 40/3/7), CHANGELOG 최상단 2026-07-12(레포는 2026-08-04), known-issues에 "쿠폰"·"data-theme" grep 0건.
- 원인: Project Knowledge는 수동 재업로드 문서라 커밋과 자동 동기되지 않음. 직전 세션의 문서 커밋(`6ed4aaa`·`8db1a5d`)이 반영 안 된 채였음.
- 조치: Ray가 5개 문서 전량 재업로드 → 실측으로 반영 확인. 이후 `dcbe657`로 CLAUDE.md가 또 바뀌었으므로 **CLAUDE.md 재업로드 필요(세션 종료 시점 완료 여부 미확인)**.
- 구조적 함의: 문서 커밋이 있는 세션은 종료 전에 재업로드 대상 파일을 명시하는 게 기본 절차.

### 2. `errBody.code` 전수 정찰 결과 — 불일치 0건 확정
scout가 src/app/api 전 route.ts 에러 응답 지점 98개 + 프론트 에러 읽기 지점 13개를 전수 대조.
- **런타임 판독 실패로 이어지는 서버↔프론트 키 불일치는 `dashboard/create/page.tsx` 외에 없음.** 그 1건은 직전 세션 `b950821`로 이미 해소됨.
- 프론트 `err.code` 매치 5건(signup·host×2·verify-email·mypage)은 전부 Firebase SDK 예외 객체의 `auth/...` 코드. 우리 API 응답 본문과 무관하며 수정 대상 아님.
- 정찰 프롬프트에 (a)우리 API 본문 / (b)Firebase 예외 분리 지시를 미리 박은 것이 유효했음. 안 박았으면 "구멍 다수 발견" 오보가 났을 구조.

### 3. 에러 키 관례 예외 2곳 — 코드 미수정 결정 (Ray 승인)
- `api/clips/route.ts:61` — 409 PLAN_LIMIT_REACHED가 `code` 키. 같은 파일 다른 응답은 `error`.
- `api/user/delete/route.ts` — 라우트 전체가 `code`+`message` 조합.
- 둘 다 짝 프론트가 그 키에 맞춰져 있어 **현재 동작 정상**(`upload/[eventId]/page.tsx:328-332`는 error·code 둘 다 읽음, `lib/auth.ts:96-98`은 code+message를 읽음).
- 결정: 고치지 않음. 게스트 업로드·회원 탈퇴는 실서비스 핵심 경로이고, 얻는 것(키 일관성)보다 잘 도는 경로를 건드리는 위험이 큼. 2026-05-31 lint refs 2건 보류와 같은 논리.
- 대신 함정("서버 키만 통일하면 프론트가 못 읽어 조용히 범용 문구로 떨어짐")을 CLAUDE.md 절대 규칙 + known-issues에 등재.

### 4. `refundStatus` 필드 출처 확정
`refundStatus`/`refund50At`/`refund100At`는 render_delayed 다단계 환불 트랙(2026-05-04) 산물. 근거: CHANGELOG 2026-05-04 `/api/cron/check-render-deadlines` 신설 항목 + 알림 템플릿 refund-50/refund-100 신규 + known-issues-resolved.md `render_delayed 장애 대응 시나리오 재설계 [RESOLVED 2026-05-04]`. 미상 필드 아님.
- 직전 세션에서 못 찾은 이유: DECISIONS 위주로 탐색했으나 이 트랙 흔적은 CHANGELOG와 resolved 쪽에만 있었음. → 출처 추적은 4개 문서 전수 grep이 기본.

## 직전 핸드오프 "미검증/미확인" 4건 정산
| 항목 | 상태 |
|---|---|
| `errBody.code` 전역 잔존 | **종결** — 없음 확정 |
| `refundStatus` 필드 출처 | **종결** — 2026-05-04 환불 트랙 |
| 쿠폰 재사용 에러 메시지 실측 | 미검증 유지 — known-issues 등재됨, 다음 쿠폰 발급 시 자연 확인 |
| `data-theme="dark"` 근본 원인 | 미확정 유지 — known-issues 등재됨, 화면은 인라인 color로 닫힘 |

## 미완 작업 (다음 세션 시작 시 먼저 확인)
1. **`dcbe657` + 본 핸드오프 커밋 push 성공 여부** — 세션 종료 시점 미확인.
2. **CLAUDE.md Project Knowledge 재업로드** — `dcbe657`로 절대 규칙 1줄 추가됨. 미반영 시 다음 세션의 코난이 새 규칙을 못 봄.

## 다음 세션 후보 (우선순위)
1. **보안 감사 사이클** — `/security-review` 1회(presigned URL, Firestore rules, render/start 결제 가드). 두 세션 연속 이월 중. UI·에러 트랙이 모두 닫혔으므로 이제 막는 것 없음. 발견량에 따라 한 세션으로 안 닫힐 수 있어 시간 여유 있을 때 열 것.
2. Gmail 스팸 분류 재확인 — 코드 밖, Ray 실측 영역.
3. Congre Bible 포크 — 별도 인프라, 전용 프로젝트.
4. lint error 11건 / warning 3건 — 기존 baseline, 이번 세션 delta 0. 별도 사이클.

## 블로커 (변동 없음)
- Toss PG 심사 대기 — 코드 밖. 추가 서류 요청 메일 스팸함 확인 권장.

## 이번 세션 학습
- **숫자 검증 시 내 기준값도 검증 대상.** axe 보고의 삽입 범위(L5~17)와 내 예상 줄 수(12)가 어긋나 상대 숫자를 의심했으나, `git diff --stat` 실측 결과 실 증분은 12로 axe가 정확했고 내 카운트가 틀렸음(불릿 9개로 셈, 실제 10개). 상대 숫자만 의심하고 자기 기준값은 안 재는 형태의 오류.
- **정찰 프롬프트에 오분류 함정을 미리 박으면 오보를 원천 차단한다.** (a)/(b) 분리 지시가 `err.code` 5건 오탐을 막았음. 같은 문자열이 서로 다른 층에서 쓰이는 영역은 정찰 지시 단계에서 분리 기준을 주는 게 사후 검증보다 싸다.
- 관측(3회차): CC 실행 시간 간헐적 튐. 문서 3곳 삽입에 axe 9분 43초(직전 세션 axe 6분 5초 / eye 46분 14초). 결과물은 매번 정확. 원인 불명, 누적 관측만.
