# 핸드오프 2026-11-14 — 인플루언서 쿠폰 코드화, 엔진 잠듦 대응

> 작성: 코난(채팅 클로드) · 기준 HEAD: 앱 `f864a38`, 엔진 `793a60f`
> 전체 시험은 하지 않고 마감. 다음 세션 첫 일은 4절 시험.

## 1. 한 일

### 1-1. 인플루언서 쿠폰 (앱 `f864a38`, push `5effa21..f864a38`)

- 배경: 인플루언서 장뽀득 이벤트로 무료 이용 쿠폰 10장 제공.
- Ray 결정: 10장, 1인 1장, 클립 30개 × 15초 고정(45,000원 상당), 사용기간 4개월, 선발은 뽀득(댓글 중 결혼식 날짜 가까운 순, 우리는 확인 안 함), 우리는 코드만 넘김, 쿠폰 행사는 완성 뒤 다시 만들기 숨김(B안).
- 변경 5파일 +63 −42:
  - `src/app/api/events/route.ts` — 휴대폰 번호 쿠폰 → 코드 쿠폰. 입력은 대문자로 바꾸고 영숫자만 남김. `expiresAt`이 Timestamp가 아니면 `INVALID_COUPON`, 지났으면 `COUPON_EXPIRED`. 15초·30개 고정. 사용 처리 때 `used: true`, `eventId`, `usedAt` 기록.
  - `src/app/dashboard/create/page.tsx` — "쿠폰 코드" 칸(text, 대문자), 30개 × 15초 안내, 오류 문구 3개(등록 안 됨 / 이미 사용 / 기간 지남).
  - `src/app/api/host/events/[eventId]/route.ts` — `viaCoupon` 응답.
  - `src/app/dashboard/events/[eventId]/page.tsx` — 쿠폰 행사는 다시 만들기 버튼 대신 "쿠폰으로 만든 이벤트는 완성본을 다시 만들 수 없어요."
  - `src/lib/events.ts` — 주석.
- 게이트: 빌드 정적 31/31, Route 41, lint 12 errors / 2 warnings (변동 없음).

쿠폰 문서 형식 (Firestore `betaCoupons/{문서 ID}`):

| 필드 | 형식 | 값 |
|---|---|---|
| 문서 ID | 문자열 | 코드에서 하이픈 뺀 대문자 (`PPD-7K3Q-M9XA` → `PPD7K3QM9XA`) |
| `used` | boolean | `false` |
| `expiresAt` | timestamp | 등록일 + 4개월 |
| `campaign` | string | `jangbbodeuk-2026-11` |

쿠폰 행사는 plan `paid`, unlocked true, unlockedBy = 코드로 저장되어 마감 때 결제를 건너뛴다.

### 1-2. 엔진 잠듦 대응 (엔진 `793a60f`, push `44ceabe..793a60f`)

- 사고: 11/14 쿠폰 시험 행사 `rmDqxc9wrkLYJwFanIxu` 렌더 11:20 시작 → 11:25 실패 알림. 실행 `rmDqxc9wrkLYJwFanIxu-1794622810459`.
- 원인: render-clip·merge 둘 다 `Lambda.AWSLambdaException`(함수 초기화 중). 약 3주 미사용으로 Lambda가 Inactive 상태가 됨. 실행 전체 약 13초, 기존 재시도(2초 간격 2회)로는 깨어나기 전에 포기. "영상 생성 다시 시작"으로는 완성됨(이미 깨어난 뒤).
- 변경 3파일 +30 −2:
  - `app/render_clip.py`, `app/merge.py` — 입력이 `{"warmup": true}`면 바로 반환.
  - `template.yaml` — 두 함수에 EventBridge Scheduler(ScheduleV2) 매일 04:00 Asia/Seoul. Step Functions BakeOne·Merge Retry 맨 앞에 `Lambda.AWSLambdaException` 20초 간격·6회·1.5배(약 7분).
- 배포: 1차는 스케줄러 권한 없음으로 자동 롤백 → Ray가 IAM 사용자 `congre-engine-deployer`에 인라인 정책 `congre-engine-scheduler-warmup` 추가(Create/Get/Update/DeleteSchedule, 깨우기 역할 PassRole) → 재배포 changeset Add 4·Modify 4·Delete 0 → UPDATE_COMPLETE(약 19:22).

## 2. 확인된 것

- 쿠폰 코드로 행사 생성 OK, 마감 때 결제 화면 없이 렌더 시작 OK.
- 엔진 스택 UPDATE_COMPLETE.

## 3. 확인 안 된 것

- 새 엔진 이미지로 렌더 (배포 뒤 렌더 0회).
- 깨우기 첫 실행 (첫 회차 11/15 04:00).
- 쿠폰 오류 경로, 다시 만들기 숨김 화면, Firestore 사용 기록.

## 4. 다음 세션 할 일 (순서대로)

1. 새 엔진으로 무료 시험 렌더 1회.
2. 쿠폰 시험:
   - 행사 `rmDqxc9wrkLYJwFanIxu` 대시보드에 안내 문구(버튼 없음).
   - `TESTOK1` 재사용 → "이미 사용된 쿠폰이에요…"
   - `TESTOLD1` → "사용 기간이 지난 쿠폰이에요."
   - `NOPE123` → "등록되지 않은 쿠폰 코드예요…"
   - Firestore `TESTOK1`에 `used: true`, `eventId`, `usedAt`.
3. CloudWatch에서 04:00 깨우기 호출 기록 확인 (deployer에 `scheduler:ListSchedules` 권한 없음 — 의도. 콘솔로 볼 것).
4. 시험 데이터 정리: 쿠폰 `TESTOK1`·`TESTOLD1`, 행사 `rmDqxc9wrkLYJwFanIxu`, 10/21 리허설 행사 `vg3eDzwELqKkraMhwKw2`.
5. 실제 쿠폰 10장 발급(`PPD-XXXX-XXXX`, 0·O·1·I·L 제외) → 콘솔 등록 → 뽀득에게 목록 + DM 안내문.
6. 문서 커밋: known-issues(엔진 잠듦 해소, 쿠폰 항목 갱신), CHANGELOG(`f864a38`, `793a60f`).

## 5. 메모

- 엔진 selfcheck 함수 메모리: 실제 4096MB, 템플릿 1024MB (11/7 변경, git 밖, 누가 했는지 모름). 렌더와 무관.
- 앱 cron·메일·알림 파일 주석에 "베타 쿠폰" 남음(주석만).
- 엔진 Dockerfile 기본 이미지 버전 고정 안 됨(FFmpeg는 고정).
- 쿠폰 행사 다시 만들기는 화면에서만 숨김. 서버는 `done`에서 다시 시작을 막지 않음(known-issues "재렌더 결제가 서버에서 강제되지 않는다").
- 인플루언서 광고 표기·이벤트 고지는 Ray 담당.

## 6. 학습

- CC 프롬프트 첫 줄은 환경 확인(OS·폴더·HEAD). 클라우드 세션(Linux)과 잘못 연 폴더를 둘 다 이 줄로 잡았다.
- 숫자·문구 정찰은 넓게 grep (쿠폰 "번호" 문구와 20/30 줄을 첫 정찰에서 놓침).
- 실패 원인은 실행 기록(예외 이름·시간·재시도 간격)을 먼저 보고 짚는다.
