# 핸드오프 2026-10-16 — ⑤ 앱 교체 끝: 실사이트 렌더는 congre-engine, 30분 상한, 문서 정리

작성: 채팅 클로드 코난. 다음 세션은 이 문서 + 프로젝트 문서 `claude/pending-backlog.md`(O절)로 시작.
직전 핸드오프: `2026-10-15-handoff-engine-compare-soft-look.md`.

## 1. 한 줄 요약
앱이 Shotstack 대신 자체 엔진으로 렌더한다(`d63da17`). 이벤트는 영상 개수 × 길이 1,800초(30분)를 넘으면 만들 수 없다(`cc56594`). 첫 실사이트 렌더 성공(무료 시험 행사, 약 5분). 문서·절차서를 엔진 기준으로 정리(`a004ad4`). **다음은 ⑥ 유료 시험.**

## 2. 커밋·배포
| 레포 | 해시 | 내용 | push |
|---|---|---|---|
| `rhcho94/congre` | `cc56594` | feat(events): cap total clip time at 30 minutes — 6파일 +64 −8 | 10/15 21:08 `d117234..cc56594` |
| `rhcho94/congre` | `d63da17` | feat(render): switch rendering from Shotstack to congre-engine — 13파일 +283 −581 | 10/15 22:50 `cc56594..d63da17` |
| `rhcho94/congre` | `a004ad4` | docs: switch docs to congre-engine, rewrite render-stuck runbook — 13파일 +179 −134 | 10/16 10:23 `d63da17..a004ad4` |
| `rhcho94/congre` | (이 문서) | docs(handoff) | |
| 엔진 `rhcho94/congre-engine` | `44ceabe` | 변경 없음 | |

Ray 콘솔 작업(10/15 밤): IAM 사용자 `congre-s3-user`에 인라인 정책 `congre-engine-run`(StartExecution = 상태 머신, DescribeExecution = 그 실행들) · Vercel `ENGINE_STATE_MACHINE_ARN` 추가(콘피그 타입, Production·Preview) · `AWS_REGION` = ap-northeast-2 확인 · Firestore `status == rendering` 0건 확인(교체 직전).

새 기준값: 빌드 정적 페이지 **31/31**, Route 표 **41**(이전 문서값 42는 잘못 센 값, C2 직전 실측 43), lint **12 errors / 2 warnings**. eye·axe 정의도 12/2로 고침 — **CC 재시작해야 반영**.

## 3. 결정 (상세 `docs/decisions/rendering.md` 2026-10-15~16)
- **Shotstack 코드 제거 (Ray)** — 환경변수 스위치로 둘 다 남기는 안(코난 추천) 대신 제거. 엔진 장애 시 git 되돌림 + 재배포가 복귀 경로.
- **배경음악 곡 저장, 다시 만들 때 같은 곡 (Ray)** — 행사 문서 `bgmKey`. 분위기 폴더가 같으면 재사용. 엔진에는 항상 `mode: "once"`.
- **30분 상한 (Ray)** — 이벤트 만들기 화면에서 넘으면 경고 + 버튼 막음, 서버 `api/events`도 `TOTAL_TOO_LONG`. 요금 = 초당 100원이라 최대 180,000원과 같은 말(Ray). 쿠폰(20×30)은 검사 제외. render/start에도 최종 검사. 대시보드 합계 표시는 안 만듦(YAGNI).
- **엔진 연결 방식** — `renderId` = `{eventId}-{밀리초}` = 실행 이름, 완성본 `renders/{renderId}.mp4`를 `renderOutKey`로 저장, 빠진 하객 클립 `renderSkipped`, 곡 없으면 음악 없음, 인트로·아웃트로 글자 공백만 있으면 카드 생략.
- **`@aws-sdk/client-sfn` 3.1038.0** — client-s3과 같은 버전. 최신판은 업로드 서명이 쓰는 하위 패키지 20개를 같이 올려서 되돌림.
- **짧은 배경음악 1개 삭제 (Ray)** — "어색하진 않지만 제품 문제처럼 보일 수 있다". 기존 행사 `bgmKey` 대비 코드는 안 함 — 지금 행사는 출시 전 대청소로 전부 지움(Ray).

## 4. 실측
- 첫 실사이트 엔진 렌더: 시험 행사 `pqn3ILDLyhv5qnb1kakE`(무료, 클립 5개) 다시 만들기. 시작 10/16 08:20:16(작업 이름의 밀리초) → 완성 문자 08:25. 44.559초(10/15 엔진 비교본과 같음), −16.9 LUFS, 1080×1920 30fps, 47.7MB. 이름 자막 5명·페이드 전환 5곳·워터마크·흐린 배경·아웃트로 카드 확인(코난, 파일 분석). Ray: 음악 이음새 어색하지 않음, 얼굴 "비슷하게 보여".
- 엔진 완성본 크기: crf 18이라 44.6초에 47.7MB(약 8.6Mbps). 30분이면 약 1.9GB(비례 추정) — known-issues 등재, ⑥ 뒤 판단.
- 빌드 라우트 비교(HEAD vs C2): 차이는 삭제한 API 2개뿐, 화면 페이지 손실 없음.

## 5. 사고·발견
- **10/15 정찰 2에서 CC가 PC `.env.local`의 `SHOTSTACK_API_KEY` 값을 화면에 출력**(grep 범위에 `.env*` 미제외 — 코난 프롬프트 누락). 외부 전송 없음. 그 파일은 `SHOTSTACK_ENV=stage`라 시험용 키일 가능성 높음(미확인). ⑦에서 키 폐기. CLAUDE.md 학습 룰 추가: grep·cat에서 `.env*`는 항상 뺀다.
- axe는 운영 규칙상 `npm install`을 못 해 C2 첫 빌드가 실패 → CC가 직접 설치. 패키지 추가가 있는 사양은 설치 주체를 명시할 것.
- 엔진 `bake.py` 22행 주석("fade 3종은 컷")은 낡음 — 실제로는 배경색 페이드. ⑦ 때 엔진 커밋으로.
- 렌더 시작 → 완성 알림 약 5분 = 엔진 약 1분 + cron 5분 주기. "통상 10분 이내" 안내와 맞음.

## 6. 미완 — 다음 세션 가장 먼저
1. Ray: **CC 재시작**, 프로젝트 자동 첨부 문서 재업로드(CLAUDE.md, docs/known-issues.md·DECISIONS.md·PROJECT.md).
2. **⑥ 유료 시험** — 새 유료 행사(최소 금액 10,000원) → 결제 → 결제 성공 페이지가 render/start 자동 호출(무료 시험과 다른 경로, 실행해 본 적 없음) → 완성. 계획부터.
3. 그다음: ⑦ Shotstack 정리(구독 해지·키 폐기·옛 시드니 버킷·Vercel `SHOTSTACK_*`·`public/fonts/` 2개·엔진 주석) → ⑧ 처리방침(Ray 법률, 위탁처 Shotstack(호주) → AWS 서울).

## 7. 다음 세션 후보
- (상) ⑥ 유료 시험
- (중) ⑦ Shotstack 정리
- (중) 경쟁사 VidDay·Tribute 대비 가격·재렌더 80% 재검토 — 첫 실고객 반응 뒤(백로그 O6)
- (하) L1 휴대폰 번호 오류 안내(INVALID_PHONE) — C1에서 같은 분기를 손봤지만 이건 남음

## 8. 학습
- 문서 경로는 프로젝트 첨부본 이름이 아니라 레포 실측으로 쓴다(이번에 `docs/` 아래였음).
- 사양의 숫자 기준값은 옮겨 적기 전에 출처를 다시 본다(정적 페이지 32 vs 33, 라우트 42 vs 실제 43).
- 정찰 프롬프트에 "9곳"처럼 개수를 적으면 목록을 세고 적는다(실제 10개).
- 세션 마무리는 백로그 갱신 + 핸드오프 둘 다. 백로그만 하고 끝내지 않는다.
