# 핸드오프 2026-10-13 — 국내 처리 전환 시작: S3 서울 이전·함수 서울, 엔진 교체 결정

작성: 채팅 클로드 코난. 다음 세션은 이 문서 + 프로젝트 문서 `claude/pending-backlog.md`(L절) + 필드샷 세션이 쓴 "콩그레 국내 이전 플레이북" 제2판(저장소 밖, Ray 보관)으로 시작.

## 1. 한 줄 요약
"참가자 영상·개인정보는 국내에서만 처리"를 목표로 정하고(Shotstack → 서울 자체 엔진), 오늘은 그 바닥 작업인 S3 서울 이전과 Vercel 함수 서울 이전을 끝내 라이브 검증했다. 엔진 만들기(3단계)는 다음 세션부터.

## 2. 커밋 (base `4143a91`)

| 해시 | 메시지 | 내용 |
|---|---|---|
| `2c02ee7` | chore(infra): run Vercel functions in Seoul (icn1) | `vercel.json` `"regions": ["icn1"]` 1줄. push·배포·검증 완료 |
| `b06f0e1` | docs: record domestic-processing decisions, S3 Seoul move and Vercel icn1 (2026-10-13) | CHANGELOG 10/13, decisions/infra.md 결정 6건, CLAUDE.md·PROJECT.md·ops/monitoring.md 버킷·리전 표기 |
| (이 문서) | docs(handoff): 2026-10-13 … | |

검증 방식: 코난이 클라우드 작업 공간에서 수정본·패치를 만들고 블롭 해시를 미리 계산 → CC가 `git apply --cached`로 스테이징에 적용 → 해시 대조 → 커밋. 두 커밋 모두 해시 전부 일치.

## 3. 결정 (Ray, 상세는 decisions/infra.md 2026-10-13)
1. 목표: 영상·개인정보 국내 처리. Shotstack을 서울 자체 엔진으로 교체 후 제거. 이유 4가지(국외 이전 / 핵심을 외부 업체가 쥠 / 노하우 축적 / 국외 이전 고지·동의 안 받고 싶음).
2. 무중단 장치(스위치·폴백·단계적 전환) 안 만듦 — 유료 행사 0건, 데이터 전부 삭제 가능, 1~2일 중단 허용. 플레이북 7-1 P2~P7은 YAGNI.
3. 행사 최대 길이 = 참가자 클립 합계 30분(1,800초), 행사 생성(결제 화면) 단계에서 막는다.
4. 엔진은 필드샷 엔진 복사 → `congre-engine` 새 비공개 레포·새 AWS 자원.
5. 세로 화면 빈 곳은 흐린 배경.
6. 10/24 첫 유료 시연은 엔진이 목표(늦으면 Shotstack 비상구).
- 레포 공개(public)는 의도된 것, 필요하면 비공개 전환 가능(Ray). 코난 추천은 비공개 전환 — 공개 레포에 AWS 계정 번호·액세스 키 ID 3개(6월 핸드오프, 비밀 키는 없음)·토스 MID가 있다. 미결.

## 4. 실측·발견
- **데이터 지도(C0)**: Firestore `(default)` = 서울 asia-northeast3(처음부터. 처리방침의 "미국 us-central1"은 사실과 다름) / S3 `congre-mvp-videos` = 시드니 / Vercel 함수 = 워싱턴 iad1(대시보드·레포 모두 지역 설정 없었음) / Vercel Pro / AWS 계정 783837106823 = 필드샷 엔진과 같은 계정.
- **Shotstack 연동 구조**(코드 `4143a91`): 필드샷 교체 전과 같음. 업로드는 폰 → S3 직접(5분 presigned PUT), 렌더 때 24시간 presigned GET을 Shotstack에 넘김, Shotstack이 버킷 맨 위 `{renderId}.mp4`에 직접 씀, 5분 cron이 상태 조회. `src`에서 Shotstack 언급 파일 10개(실행 코드 7 + 처리방침·주석 3).
- **기능 20개 대조**: 엔진이 전환 6종·색감 3종(`muted`·`boost`·`contrast`)·이름 자막·글자 카드·인트로/아웃트로·BGM 반복(0.5초 겹침, 음량 10%)을 이름까지 같게 갖고 있다. 차이 3: 워터마크(콩그레는 "made by Congre" 나눔펜 글씨 0.6 → PNG 필요), 빈 곳 배경(결정 5), BGM `calm`(앱이 고르므로 엔진 수정 불필요).
- **Shotstack 연동 키** = IAM 사용자 `shotstack-s3`의 `AKIA3NACVCKDQQGC6GRG`(콘솔 키 ID가 6/06 핸드오프 기록과 일치). 앱 사용자 = `congre-s3-user` `AKIA3NACVCKDZGIOZX4S`, 정책 `AmazonS3FullAccess`(계정 모든 버킷 — 엔진 교체 때 좁히기).
- **옛 버킷 퍼블릭 액세스 차단이 꺼져 있었다** — 6/04 public-read 실험 뒤 다시 안 켠 것으로 보임(data-flow.md는 "켜진 상태 유지"라고 적혀 있어 문서와 실제가 달랐음). 버킷 정책·ACL 공개 권한은 없어 실제 노출은 없었다. 새 버킷은 켬.
- **사고 1건**: Vercel `AWS_REGION` 값 앞 공백 → `PRESIGN_FAILED` 500. 화면 목록에선 공백이 안 보이고, 하객 화면은 "업로드에 실패했어요. 네트워크를…"만 보여 줬다. 원인은 Vercel 로그 `[presign] getSignedUrl failed: Region not accepted: region=" ap-northeast-2"`. 값 재타이핑으로 해소 → 백로그 L2.
- **Vercel 로그 읽는 법**: "Received in Seoul"은 입구일 뿐(원래부터 서울). 지역 판정은 "Routed to Washington, D.C. (iad1)" 단계가 있느냐로. 로그 화면은 `?page=…&selectedLogId=…` 주소로 예전 구간에 고정될 수 있다 → 시간 막대 끝 시각과 Deployment ID부터 확인. cron 요청은 입구가 워싱턴으로 찍혀 판정용으로 쓰지 않는다.
- **검증**: 새 버킷 업로드 → `events/` 생성 → 대시보드 재생(Ray) / 새 배포 `dpl_7E2nvjzy…`에서 "Routed to Washington" 사라짐 / 이벤트 생성 문자(솔라피) 수신. **토스 결제는 미검증**(라이브 키라 실결제 필요 — 유료 시험 결제 때).
- 랜딩 상단 메뉴 "로그인" → "내 이벤트"(4페이지, git 밖) 배포·라이브 확인. 첫 배포 `5DTg…`는 수정 전, 두 번째 `E1A9…`가 반영본.

## 5. 콘솔에서 바꾼 것 (git 밖)
- S3 새 버킷 `congre-videos-kr`(서울, 글로벌 네임스페이스): 퍼블릭 차단 활성, ACL 비활성, CORS(GET·PUT, `*`), 버전 관리 끔, SSE-S3·버킷 키, 수명 주기 없음. `audio/` 23곡(calm 7·epic 6·lively 10 — 개수는 Ray 확인).
- IAM 정책 `shotstack-s3-write`: `ShotstackS3ObjectWrite`·`ShotstackS3BucketList`의 Resource를 배열로 바꿔 새 버킷 추가. `ShotstackSourceRead`(Track ⑦)·필드샷 문단 2개는 그대로. **정책 버전 5/5 꽉 참** — 다음 수정 때 가장 오래된 버전 삭제를 묻는다.
- Vercel `congre` 환경변수 `AWS_REGION=ap-northeast-2`, `AWS_S3_BUCKET=congre-videos-kr`(Production·Preview).
- 손대지 않음: 옛 버킷 `congre-mvp-videos`(Shotstack 정리 때 삭제), Vercel 대시보드 Function Regions(오후에 서울 체크만 하고 저장 안 함 — `iad1` 표시 그대로, 실제 지역은 `vercel.json`이 결정), Ray PC `.env.local`(아직 시드니 값일 것 — 로컬 실행 전 교체).

## 6. 다음 세션 — 3단계 엔진 만들기
순서(코난 전체 계획): ① S3 ✅ ② 함수 지역 ✅ ③ `congre-engine` 만들기 ④ Shotstack과 나란히 비교(이때 Shotstack 비상구가 새 버킷에서 도는지도 확인) ⑤ 앱 교체 커밋 + 30분 상한 커밋(따로) ⑥ 실사이트 무료·유료 시험 행사(토스 결제 확인 포함) ⑦ Shotstack 정리(환경변수·연동·IAM 키·옛 버킷, 구독 해지 — 필드샷은 이미 엔진) ⑧ 처리방침(Ray).
- 첫걸음: 필드샷 엔진 `ac008d1` 기준으로 골프 전용 기능(플레이북 9장) 목록과 빼는 순서 정찰. 엔진 레포는 이 세션에서 읽기 가능했음.
- 엔진 작업 전 확인: Lambda 동시 실행·메모리 상한은 같은 계정이라 필드샷 값(동시 10→1,000 요청 여부, 메모리 3,008MB 상한)을 그대로 물려받는다 — 현재 승인 상태는 모름.
- 10/24까지 1~6이 끝날지는 장담 못 함(필드샷 CE2는 약 12세션, 콩그레는 복사·삭제라 짧을 것으로 예상하지만 실측 없음).

## 7. 학습
- 콘솔 값은 직접 타이핑한다. 붙여 넣기는 앞뒤 공백이 딸려 오고 화면 목록에선 안 보인다.
- "사용자에게 파일 카드만 보내고 저장은 맡긴다"는 단계가 빠지기 쉽다 — PC가 연결돼 있으면 코난이 다운로드 폴더에 직접 넣고 지문까지 대조한다(오늘 1회 실패 뒤 전환).
- 같은 보고가 다시 붙여 넣어질 수 있다 — CC 보고 끝의 `done 오후 …` 시각으로 새 보고인지 확인.
