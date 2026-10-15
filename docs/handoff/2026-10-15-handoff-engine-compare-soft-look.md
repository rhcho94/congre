# 핸드오프 2026-10-15 — ④ Shotstack 나란히 비교 끝, 제품 원칙 "얼굴은 부드럽고 밝게", 엔진 화면 값 재배포

작성: 채팅 클로드 코난. 다음 세션은 이 문서 + 프로젝트 문서 `claude/pending-backlog.md`(N절) + 플레이북 제2판(Ray 보관)으로 시작.
직전 핸드오프: `2026-10-14-handoff-engine-first-deploy.md`.

## 1. 한 줄 요약
같은 시험 행사를 Shotstack과 엔진으로 구워 비교했고, Ray가 화면 값과 제품 원칙을 정했다. 엔진은 새 값으로 서울 재배포(`44ceabe`), 앱은 "또렷하게" 색감 제거 + 원칙 문서(`5b25965`). **앱은 아직 Shotstack으로 렌더한다 — 다음은 ⑤ 앱 교체.**

## 2. 제품 원칙 (Ray, 2026-10-15)
콩그레는 중요한 행사에서 사람들의 얼굴과 목소리를 담는 서비스다. 완성본에서 얼굴과 피부는 부드럽고 밝게 빛나 보여야 한다 — 최종 결과물에 꼭 필요한 특징이다.
기록 위치: CLAUDE.md 프로젝트 개요, 엔진 README 규칙, `docs/decisions/rendering.md` 2026-10-15, claude.ai 프로젝트 기억.

## 3. 커밋·배포
| 레포 | 해시 | 내용 |
|---|---|---|
| `rhcho94/congre-engine` | `44ceabe` | feat: soft bright look — 시네마틱 재조정, 기본 톤 + 빛 번짐, 자막 64, 글자 카드 92, 또렷하게 제거 (4파일 +48 −15) |
| AWS 스택 `congre-engine` | UPDATE_COMPLETE | 바뀔 목록: 함수 3 + 작업 지휘 Modify, 교체 없음. 점검 함수 ok (새 필터 gblur·blend·vibrance·colorbalance 포함) |
| `rhcho94/congre` | `5b25965` | feat(rendering): drop Sharp filter, add product principle (7파일 +26 −5). build 통과, lint 12/3 기준선 동일. 라이브: 색감 선택지 "없음·시네마틱·화사하게" (Ray 확인) |
| `rhcho94/congre` | (이 문서) | docs(handoff) |

방식은 10/14와 같다: 코난이 작업 공간에서 수정·시험 → 패치 + 트리 지문 → PC 다운로드 폴더 + sha256 대조 → CC `git apply --index` → 지문 대조 → 커밋·push. 두 커밋 모두 코난이 GitHub에서 독립 대조.

## 4. 비교 결과와 결정 (상세 `docs/decisions/rendering.md` 2026-10-15)
- 시험 행사 `pqn3ILDLyhv5qnb1kakE` (무료, 클립 5개, 시네마틱·벅차게·부드럽게·이름 표시). Shotstack 완성본 = renderId `f3576b11-941e-400c-ad9c-1ea5b5309186`, 44.586초. **Shotstack 비상구가 새 버킷 `congre-videos-kr`에서 도는 것 확인** (10/13부터 미검증이던 항목 종료).
- 엔진 실행 4회 모두 성공: `cmp-pqn3-a-1`·`b-1`(10/14, 옛 값), `cmp-pqn3-a-2`·`b-2`(10/15, 새 값). 길이 44.559초(Shotstack과 1프레임 차).
- 결정: 시네마틱 = "중간 2" / 기본 톤 = 시네마틱 절반 세기 / 또렷하게 제거 / 가로 클립 흐린 배경 유지 / 이름 자막 64(엔진 위치 유지) / 글자 카드 92 / 음량 −16.9 LUFS 유지(Shotstack −26.9).
- 시간: 엔진 전체 56초 → 67초 (가장 긴 10초 클립 조각 50 → 58초, 색 보정 필터 비용).

## 5. 실측·발견
- **빛 번짐은 밝기(Y)에만** — 색(U·V)까지 screen으로 겹치면 어두운 흐린 배경이 보라색으로 뜨고, U·V opacity 0이면 흐린 사본의 색이 섞여 윤곽에 초록·보라 번짐. U·V는 normal·opacity 1(원래 화면 색 그대로)이 맞다. 로컬에서 잡고 서버에서도 확인.
- **글자 크기 단위**: 엔진(자막 ASS) 크기 × 1.45 ≈ Shotstack 크기. "감사합니다." 폭 303px(Shotstack) vs 209px(엔진 64).
- **Shotstack 무작위 배경음악은 기록이 안 남는다** — 앱은 고른 곡 키를 Firestore에 저장하지 않고 Shotstack 주문서에만 넣는다. 비교 때 곡을 못 맞춰 엔진은 `audio/epic/epic_01.mp3`(19초, 세 번 이어 붙임)로 구웠다. ⑤에서 엔진으로 바꿀 때 **고른 곡 키를 행사 문서에 남기는 것**을 같이 검토(재렌더 때 같은 곡이 나오게).
- **Ray PC `.env.local`은 옛 값** — `AWS_REGION=ap-southeast-2`, `AWS_S3_BUCKET=congre-mvp-videos`, `SHOTSTACK_ENV=stage`. 그래서 Shotstack production 주문서 조회가 403. 운영 값은 Vercel에만 있다(백로그 기존 항목). 로컬 실행 전에 바꿔야 한다.
- **Windows 수동 시험 주의 2가지**
  - 한글 든 JSON을 `aws ... --input file://`로 넘길 때 `export AWS_CLI_FILE_ENCODING=UTF-8` 필요(없으면 cp949로 읽어 실패).
  - `sam.cmd build` 전에 Docker Desktop을 켠다(꺼져 있으면 "container runtime" 오류).
- 엔진 수동 실행 재료는 PC `C:\Users\PC\Downloads\engine-cmp\` (`job-a.json`·`job-b.json`·완성본 4개). `engine-jobs/`는 버킷 수명 주기 규칙 `engine-jobs-1day`로 하루 뒤 자동 삭제(10/14 Ray 콘솔에서 설정, 버전 관리 비활성 확인).
- "또렷하게"로 이미 저장된 행사: Shotstack으로 렌더하는 동안은 Shotstack 값이 그대로 걸린다. 엔진은 기본 톤으로 굽는다. 유료 행사 0건이라 손대지 않음.

## 6. 미완 — 다음 세션 가장 먼저: ⑤ 앱 교체 정찰
읽기 전용 정찰부터. Shotstack을 부르거나 Shotstack 결과에 기대는 곳(10/14 코난 grep, 동작은 미확인):
- `src/lib/shotstack.ts`(424줄) — 설계도 만들기·주문·상태 조회
- `src/app/api/render/start/route.ts`(237줄) — 클립 정렬·길이·인트로/아웃트로·배경음악 무작위·전환 → `createRender`
- `src/app/api/cron/check-rendering/route.ts` — 완료 확인(엔진은 DescribeExecution)
- `src/app/api/render/complete/route.ts`, `src/app/api/render/status/route.ts`
- `src/app/api/cron/cleanup/route.ts`, `src/app/api/user/delete/route.ts` — 완성본 위치(엔진은 `renders/{renderId}.mp4`, Shotstack은 버킷 맨 위)
- `src/app/privacy/page.tsx` — 처리방침 Shotstack 언급(⑧, Ray)
- `src/components/CongreBadge.tsx`, `src/app/dashboard/events/[eventId]/page.tsx`
- 엔진 쪽 입력 모양은 엔진 `app/render_clip.py`·`app/merge.py` 머리말 + `template.yaml` 작업 지휘 정의.

⑤ 직전 준비(10/14 핸드오프에서 이월): 앱 IAM `congre-s3-user`에 작업 지휘 `StartExecution`·`DescribeExecution` 인라인 정책 + Vercel 변수 `ENGINE_STATE_MACHINE_ARN`(`arn:aws:states:ap-northeast-2:783837106823:stateMachine:congre-engine-render-job`).
그다음: ⑤ 30분 상한 커밋(따로) → ⑥ 실사이트 무료·유료 시험 → ⑦ Shotstack 정리 → ⑧ 처리방침.

## 7. 다음 세션 후보
- (상) 6절 ⑤ 정찰
- (중) 배경음악 곡 키를 행사 문서에 기록 — ⑤에 포함할지 결정
- (중) 필드샷 엔진에 빈 필터 버그 알림 (10/14 이월, Ray 판단)
- (하) 음악 이음새(짧은 곡 반복 시 2초 겹침) — Ray가 아직 귀로 판단 안 함. ⑥ 시험 때

## 8. 학습
- 화면 값은 말로 정하지 말고 같은 원본 화면에 후보 값을 걸어 나란히 보여 준다. Ray는 "화사하게와 부드럽게 사이" 같은 상대적 표현으로 답하므로, 그 사이를 몇 단계로 쪼개 다시 보여 주면 한 번에 정해진다.
- 필터 미리보기(정지 화면 RGB)와 실제 영상(YUV 처리)은 다르게 나올 수 있다 — 미리보기 값을 코드에 옮긴 뒤 반드시 실제 굽기로 다시 본다(보라색 번짐이 그렇게 잡혔다).
- 원칙은 결정이 나온 그 순간에 문서·기억에 박는다. 원칙이 다른 기존 선택지("또렷하게")와 부딪히는지 바로 훑어보면 숨은 결정이 드러난다.
