# 2026-09-20 핸드오프 — 재과금 차단 + 쿠폰 이벤트 마감 버그 수정

> 직전 핸드오프: `2026-09-18-handoff-closed-state-collision.md`
> 다음 세션 첨부: 이 문서

## 1. 요약

직전 핸드오프의 ③-3(재과금 위험)을 정찰 3회로 확정하고 닫았다. 새 status 값 없이 기존 필드 조합으로 해결했다. 작업 중 실제 베타 쿠폰 사용자가 마감에서 막히는 사고가 발생해 Firestore 수동 우회 후 원인을 고쳤다. 원인은 2026-08-13부터 있던 버그였다. 두 수정 모두 프로덕션 실화면에서 검증했다.

## 2. 커밋

| 커밋 | 내용 | push |
|---|---|---|
| `fc1e487` | fix(payment): 렌더 실패 후 재과금 차단, 전액 환불 이벤트 재시작 잠금 | 완료 |
| `495e047` | fix(dashboard): 쿠폰 이벤트 마감 시 결제 페이지 이동 수정 | 완료 |
| `945ec7e` | docs: 사이클 기록 (CHANGELOG, decisions, known-issues 9건, CLAUDE.md lint 게이트 정정) | 이 문서와 함께 |

## 3. 확정된 사실 (정찰 3회, 2026-09-19)

- `status: "closed"`를 쓰는 곳은 3곳뿐이다. `close`(open에서), `confirm` 최초 결제(open에서), `check-rendering` 렌더 실패(rendering에서). 렌더 성공은 항상 `done`이다. 따라서 `closed` + `unlocked: true`는 "결제(또는 쿠폰)했으나 성공한 렌더가 없음" 한 가지 뜻이다
- `prepare`는 `status`와 `unlocked`만 보고 결제 모드를 정한다. `renderId`와 렌더 완료 여부를 보지 않는다
- `confirm`의 재렌더 분기는 `refund50At`·`refund100At`만 쓴다. 재렌더 결제 후 렌더가 실패하면 수정 전에는 80%가 반복 청구될 수 있었다
- `render/start`에는 status 검사가 없다. 결제 가드는 `plan === "paid" && !unlocked` 하나다
- 쿠폰 이벤트는 `plan: "paid"`, `unlocked: true`, `unlockedBy`를 가지며 `firstPaidAmount`가 없다
- `firestore.rules`가 events의 클라이언트 읽기·쓰기를 전부 막는다. 모든 상태 변경은 서버(Admin SDK)를 거친다
- 토스 결제취소 API 호출이 코드에 없다. 환불은 수동 처리로 추정된다(Ray 확인 필요)
- `refundStatus`는 `render/start` update에서 `"none"`으로 덮이지만, 새 가드는 그보다 앞에서 읽는다
- done 화면에도 재렌더 입구("영상 다시 만들기")가 있고 closed 버튼과 같은 모달을 쓴다

## 4. 이번 세션 결정 (Ray)

- 방향 A(최소 수정) 채택. 새 status 값 신설은 기각
- 재렌더 결제(80%)는 `done`에서만
- `closed` + `unlocked: true`의 재시작은 무료
- `refundStatus: "100"` 유료 이벤트는 렌더 실패 후 재시작 불가. 서버 가드 포함
- `refundStatus: "50"`은 허용
- 쿠폰 이벤트 렌더 실패 후 무료 재시작 허용
- 결제 필요 판정은 `plan === "paid" && unlocked !== true`
- 재렌더 결제 서버 강제(B안)는 다음 사이클로 보류
- 코드 커밋과 문서 커밋 분리

상세는 `docs/decisions/market-product.md` 2026-09-20 항목.

## 5. 실화면 검증 (2026-09-20, 프로덕션, 테스트 키)

테스트 이벤트 `mg3fNMxKINplMzjPPH9A`의 Firestore 필드를 바꿔 가며 확인했다.

| 항목 | 상태 | 결과 |
|---|---|---|
| T1 | closed + unlocked → 결제 URL 직접 접속 | "지금은 결제를 진행할 수 없는 상태예요" 통과 |
| T2 | T1 + refundStatus "100" | 버튼 대신 환불 안내 통과 (제목 밀림 → known-issues 등재) |
| T3 | refundStatus 삭제 → 모달 | 80% 문구 없음, "다시 만들기" 통과 |
| T4 | open + unlocked → 마감 | 결제 페이지 없이 렌더 시작 통과 |

실사용 건: 베타 쿠폰 이벤트 `rhiavrg80fcndwEkI81U`는 495e047 배포 전에 Firestore에서 수동으로 마감했다(`status: "closed"`, `closedAt` 추가). 주최자에게 재시작 버튼 안내를 보냈다.

## 6. 직전 핸드오프(2026-09-18) 정정

- 5장 표의 "렌더 완료 후 = closed" 행은 틀렸다. 성공은 항상 `done`이다
- 4장의 재과금 조건 "`renderId` 없음"은 틀렸다. `renderId`와 무관하게 `closed` + `unlocked: true`면 해당했다
- "`closed`를 읽는 곳 10곳"은 리터럴 기준이다. `status !== "open"` 같은 간접 형태를 포함하면 30곳 이상이다
- "lint baseline이 11이 아니라 12" 지적은 틀렸다. known-issues 본문은 이미 12였고 11은 제목의 이력 표기다. 실제 불일치는 CLAUDE.md:108의 "errors 0"이었고 945ec7e에서 정정했다
- DECISIONS 인덱스 불일치는 실재했다(표기 19, 실제 20). 945ec7e에서 21로 정정했다

## 7. 운영 사고 — CC 실행 환경 혼선

2026-09-19 axe·eye는 데스크톱 앱 CC에서 실행했다. 이 세션은 클라우드 리눅스 컨테이너(`/home/user/congre`)다. 2026-09-20 아침 로컬 `C:\projects\congre`의 다른 CC 세션(58fbfb5 시점에 시작된 오래된 세션)에서 커밋을 시도해 변경이 없다고 멈췄다. 두 곳은 별개 복사본이다.

- 커밋·push는 데스크톱 앱 CC 한 곳에서만 한다
- 로컬 `C:\projects\congre`는 현재 origin보다 뒤처져 있다. 다시 쓰기 전에 `git pull` 필요
- CC 프롬프트 0단계에 `pwd`와 HEAD 확인을 넣는다
- 데스크톱 CC의 "세션 재개됨"은 유휴 컨테이너 재시작이며 작업트리는 유지된다

## 8. 남은 일

| 항목 | 상태 |
|---|---|
| ③-1 결제 전 마감 + 클립 0개 차단 | 미착수. `3615b9b` diff 참조. 결제 전 마감은 `closed` + `unlocked: false`로 구분되므로 `prepare` 최초 결제 분기가 이 조합을 받도록 설계 필요 |
| ③-2 409 재발행 경로 | ③-1에 종속 |
| ③-3 재과금 위험 | 완료 (fc1e487) |
| 쿠폰 마감 버그 | 완료 (495e047) |
| 재렌더 결제 서버 강제 (B안) | 보류. known-issues 등재 |
| ④ 라이브 키 교체 | ③-1·③-2 뒤. 전에 환불 수동 처리 확인, S3 고착 known-issue 검토 |
| ⑤ 실결제 검증 | ④ 뒤 |

라이브 키 교체 시 `NEXT_PUBLIC_TOSS_CLIENT_KEY`는 빌드 시 코드에 박히므로 Vercel 값 변경 후 재배포가 필요하다.

## 9. 미확인

- 수동 마감한 쿠폰 이벤트 `rhiavrg80fcndwEkI81U`가 `done`까지 갔는지
- 테스트 이벤트 `mg3fNMxKINplMzjPPH9A`가 T4 렌더 후 `done`까지 갔는지. 이 이벤트에는 `unlocked: true`가 남아 있어 최초 결제 테스트용으로는 새 테스트 이벤트를 만드는 편이 낫다
- 2026-08-13 이후 다른 쿠폰 이벤트가 마감에서 막혔는지. `betaCoupons`의 `used: true` 문서의 `eventId`로 추적 가능
- 환불을 토스 대시보드에서 수동 집행하는지 (Ray)
- known-issues의 "재렌더 결제 게이트 잔여 — B5 재렌더 유료화 미구현"과 "랜딩 pricing에 재렌더 80% 재결제가 공개 선언됨 — 코드 없음" 항목이 2026-08-16 재렌더 유료화 이후 낡았는지. 이번에 열어보지 않았다
- lint 에러 12건의 파일별 위치. 9/19 eye는 대시보드 파일에 3건이라 했고 9/20 eye는 전부 다른 파일이라 했다. 개수(12/3)는 일치

## 10. 학습·패턴

- 상태값 문제는 쓰는 곳과 읽는 곳을 둘 다 표로 놓아야 보인다. 읽는 곳만 30곳을 훑었을 때는 새 status가 필요해 보였고, 쓰는 곳 3곳을 놓자 기존 조합으로 충분하다는 것이 보였다
- CC 보고의 "유일한 경로" 같은 전칭 표현은 검색 범위를 확인한다. 1차 정찰이 done 화면의 재렌더 입구를 놓쳤다
- CC의 요약 문장과 원출력이 충돌하면 원출력을 믿는다. 제목 한 줄만 읽은 baseline 오독, lint 위치 요약 불일치 사례
- `git diff --stat`의 파일별 숫자는 추가+삭제 합계다
- 급한 사용자 장애는 Firestore 수동 우회 → 원인 정찰 → 수정 순으로 처리했다. 코드 경로를 이미 정찰해 둔 덕분에 우회 방법이 안전하다는 것을 바로 판단할 수 있었다
- eye 통과 후 실화면 확인을 생략하지 않았다. 이번에는 문제가 없었지만, 직전 사이클의 롤백은 이 단계에서 발견됐다
