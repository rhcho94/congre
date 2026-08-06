# 2026-08-06 핸드오프 — 보안 감사 1회차

## 한 줄 요약
`/security-review` 4축 정찰로 HIGH 3건·MEDIUM 6건·LOW 9건 발견. HIGH 2건(로그 서명 URL 유출, events 규칙 결제 게이트 우회)을 커밋 2개로 처리하고 콘솔 게시·실사용 검증까지 완료. 남은 HIGH 1건(저장형 XSS)은 파일 3개 규모라 다음 사이클로 이월. 쿠폰 3종 취약은 10장 규모·임시 코드 근거로 등재만 하고 수용.

## 이번 세션 커밋
- `01b80f3` fix(security): Shotstack 요청 로그에서 서명 URL 제거 — 1파일 13↑/1↓
- `bc7915a` fix(security): events 클라이언트 직접 생성 차단 + createEvent 데드 코드 제거 — 2파일 5↑/31↓
- (본 핸드오프 + 문서 5개 커밋)

## 처리 완료

### H-2 결제 게이트 우회 (실제 운영 중이던 구멍)
`firestore.rules`의 events `allow create`가 `hostId` 한 필드만 강제하고 plan·unlocked·maxClips·maxClipSeconds는 무검증이었음. 이메일 인증만 마친 계정이 브라우저 콘솔에서 클라이언트 SDK로 `unlocked:true` 이벤트를 만들면 `render/start`의 결제 게이트(`plan==="paid" && !unlocked`)를 통째로 우회 가능. `update: if false`로 잠겨 있었으나 create 한 번이면 update가 불필요.
- 정찰로 클라이언트 직접 생성 경로 0건 확정 → `allow create: if false` 차단
- 근거: `firebase/firestore` import 파일 3개(firebase.ts·users.ts·events.ts)뿐이고, events create 지점은 `lib/events.ts:59` 하나. 그것을 감싼 `createEvent`는 호출부 0건. `@/lib/events` import 3곳은 전부 `type` 수식자(컴파일 시 소거)
- 영구 동작 불가가 되는 `createEvent` 데드 코드 동시 제거. `Timestamp`를 `import type`으로 전환해 이 모듈이 런타임에 클라이언트 Firestore SDK를 끌어오지 않게 됨
- 콘솔 게시 완료 + 이벤트 생성 실사용 검증 통과

### M-4 서명 URL 로그 평문 노출
`lib/shotstack.ts:346`이 createRender body 전체를 JSON으로 기록해 참가자 원본 영상·intro/outro·BGM의 24시간 presigned URL을 서명값째로 Vercel 런타임 로그에 남기고 있었음. 로그 열람 권한자가 한 줄 복사로 24시간 참가자 영상을 인증 없이 다운로드 가능. 구조 요약 로그로 교체(asset.src 미참조, destinations는 버킷명·리전 포함으로 제외).
- 원 감사 등급 MEDIUM → 코난이 HIGH로 상향. 참가자 원본 영상은 PII이고 수정이 한 줄

## 처리하지 않은 것 (등재 완료)
- **H-1 저장형 XSS (HIGH, 다음 사이클 1순위)** — presign이 클라이언트 `fileType`을 검증 없이 ContentType으로 서명하고, og-image가 미인증으로 그 ContentType 그대로 재전송. `next.config.ts` 빈 설정이라 nosniff·CSP 완화 장치 0. 파일 3개 규모(presign·og-image·next.config)라 세션 잔여 시간 부족으로 이월
- M-1·M-2 키 무검증 (MEDIUM) — M-4가 막혀 전제 조건(키 사전 인지)이 다시 어려워짐. H-1 처리 후 재평가
- M-3·M-5·M-6 쿠폰 3종 — 10장 규모·Toss PG 전환 시 소멸할 임시 코드. 격상 트리거 등재
- LOW 9건 — known-issues 한 항목으로 묶어 등재

## 정정된 것
- **known-issues의 clips 항목이 stale이었음.** 2026-06-18 `0a83224`에서 `if false`로 차단됐고 콘솔 게시본도 일치 확인 → resolved로 이관
- **PROJECT.md:124 규칙 현황이 2026-05-19 기준에서 멈춰 있었음** → 2026-08-06 게시본 기준으로 갱신
- CC 보고 중 "docs 전체에 게시 완료 기록 0건"은 오류. PROJECT.md:124에 있었으나 내용이 낡았던 것

## 미완 작업 (다음 세션 시작 시 먼저 확인)
1. **B 트랙(H-1 XSS) 실행** — 범위 확정됨. 정찰 불필요, 사양 결정부터 시작 가능
2. S3 버킷 정책·퍼블릭 액세스 차단·CORS 미확인 — H-1 처방 설계 전 Ray 콘솔 확인 필요
3. Vercel 로그 접근 권한 범위·로그 드레인 연동 여부 미확인 — 코드 밖

## 다음 세션 후보 (우선순위)
1. **H-1 XSS 처리** — 남은 유일한 HIGH
2. M-1·M-2 키 프리픽스 검증
3. Gmail 스팸 분류 재확인 — 코드 밖, Ray 실측 영역
4. Congre Bible 포크 — 별도 인프라, 전용 프로젝트
5. lint error 11건 / warning 3건 — baseline, 이번 세션 delta 0

## 블로커 (변동 없음)
- Toss PG 심사 대기 — 코드 밖. 추가 서류 요청 메일 스팸함 확인 권장

## 이번 세션 학습
- **문서 부재를 상태 부재로 읽지 말 것.** "게시 기록이 docs에 없다"에서 "게시가 안 됐을 것"으로 건너뛰었으나, 콘솔 실측 결과 게시는 되어 있었음. 기록이 없는 것과 일이 안 된 것은 다른 층. 외부 시스템 상태는 그 시스템에서 직접 확인이 유일한 근거
- **코드를 안 바꾸는 작업이 유실 위험이 더 크다.** 감사·진단은 파일 변경 0이라 git이 흔적을 남기지 않음. "전에 감사했었나?"를 아무도 확정할 수 없어 세션 초 30분 소모. CLAUDE.md 절대 규칙으로 등재
- **곧 사라질 코드는 단단하게 만들지 않는다.** 쿠폰 3종을 등급 하향한 근거는 취약성 자체가 아니라 코드의 수명. 다만 수명 전제(Toss PG 승인)가 깨지면 재평가라는 조건을 함께 박아둠
- 관측(4회차): CC 실행 시간 튐 없음. 4축 병렬 정찰 중 "Audit Firestore rules" 에이전트가 10h 52m으로 표시됐으나 실제 경과는 수 분. 타이머 표시 이상으로 보이며 결과물은 정확
