# 2026-09-21 핸드오프 — 세로 클립 회전 문제 transcode 해결 + 카카오 공유 정리

> 직전 핸드오프: `2026-09-20-handoff-rerender-charge-coupon-close.md`
> 다음 세션 첨부: 이 문서

## 1. 요약

인트로·아웃트로 텍스트가 있는 이벤트에서 세로 촬영 클립이 90도 눕던 문제를
`transcode: true`로 해결했다. 같은 세션에서 카카오 공유 4019(도메인 등록 누락, 콘솔 조치)와
카카오 공유 카드 이미지 불일치도 처리했다. 세 건 모두 프로덕션 실화면에서 검증했다.

## 2. 커밋

| 커밋 | 내용 | push |
|---|---|---|
| `59d10a2` | fix(render): force transcode on participant clips to apply rotation metadata | 완료 |
| `4bb80a7` | fix(share): use OG image for Kakao share card instead of logo | 완료 |
| `91c4f55` | docs: 2026-09-20~21 사이클 기록 — 회전 문제 transcode 해결, 카카오 공유 카드 통일 | 완료 |

## 3. 확정된 사실

- 세로 촬영 클립은 **가로 픽셀 + Rotation 90 메타데이터** 구조다(MediaInfo 실측).
  iPhone 15 Pro / iOS 26.7 — `.mov`, H.264, 1920×1080, Rotation 90.
  Galaxy S26 Ultra / Android 16 — `.mp4`, HEVC 10bit HLG, 3840×2160, Rotation 90
- 같은 클립 파일로 인트로·아웃트로 텍스트 유무만 바꾼 실험에서 텍스트 있으면 누움,
  없으면 정상이었다. 이것이 원인 확정의 결정적 증거였다
- `transcode: true` 검증(프로덕션): 텍스트 있음/없음 모두 정상(이중 회전 없음),
  한글 폰트 정상, 렌더 시간 체감 변화 없음(클립 1개 기준),
  인트로 텍스트 + 인트로 미디어 2트랙 조합도 정상
- 카카오 4019 원인은 커스텀 도메인 이전 시 콘솔 등록 누락이었다.
  [제품 링크 관리] 웹 도메인과 [플랫폼 키 > JavaScript 키] SDK 도메인 두 곳에
  `https://app.congre.kr`를 추가해 해결했다. 코드 변경 없음
- 삭제 시계는 **세 개**다. 원본 클립 `participantNotifiedAt` + 48시간(`done` 한정),
  완성본 `videos[].doneAt` + 7일, 정체 이벤트 `closedAt` + 7일.
  cron은 `0 18 * * *`(UTC) = KST 익일 03:00 1회
- 버킷 `congre-mvp-videos`, 리전 `ap-southeast-2` (실값 확인)

## 4. 기각된 가설 (다시 밟지 말 것)

- "Shotstack이 회전 메타데이터를 원래 무시한다" — 텍스트 없는 이벤트는 정상이므로 틀림
- "업로드 과정에서 파일이 변형된다" — 원본 그대로 S3에 올라간다
- "`videoFilter` 등 이벤트 설정 차이" — 필드 자체가 없었다
- "`useDualTrack`은 텍스트 기준으로 갈린다" — 실제는 **미디어** 기준이다
- `transform.rotate` 직접 회전 / Ingest API `fixRotation` — 가능하지만 `transcode`로 충분하다

## 5. 이번 세션 결정 (Ray)

- `transcode: true` 채택. 원인(H1 트랙 첫 클립 위치 / H2 rich-text·fonts 존재) 규명은 이월
- 카카오 공유 카드는 안 B(공용 `og-image.png`). 안 A(`/api/og-image/<id>`)는 2단계로 이월
- 사고 이벤트 `rhiavrg80fcndwEkI81U`는 재렌더로 구제하지 않는다

상세는 `docs/decisions/rendering.md`·`misc.md`·`infra.md`·`market-product.md` 2026-09-21 항목.

## 6. 남은 일

전부 급하지 않다. 1~9는 이번 세션에서 known-issues에 신규 등재했다.
위 2건은 **렌더를 만들지 않고** 확인할 수 있다.

| # | 항목 | 상태 |
|---|---|---|
| 1 | 회전 원인 H1/H2 가르기 | **렌더 0건.** 무료 플랜 + 인트로 텍스트 없음 + 세로 클립 완성본의 방향 확인. 누움 → H2 / 정상 → H1 |
| 2 | probe baseUrl `/edit/` 누락 의심 | **렌더 0건.** Vercel Logs에서 `probe` 검색. `probe non-OK: 404`가 보이면 실제 버그 |
| 3 | `makeMediaClip`에 transcode 미적용 | 호스트 인트로·아웃트로 미디어(`shotstack.ts:97-113`). 반환 타입 명시 선언이라 타입도 함께 수정 필요 |
| 4 | Preview 환경에 `SHOTSTACK_API_KEY` 없음 | Production 스코프에만 있어 브랜치 push로 테스트 렌더 불가 |
| 5 | `NEXT_PUBLIC_APP_URL` 빈 문자열일 때 공유 `imageUrl`이 상대 경로 | `share/[eventId]/page.tsx:50`, `dashboard/events/[eventId]/page.tsx:582`. `shareUrl`에는 폴백이 있으나 `imageUrl`에는 없음 |
| 6 | 카카오 SDK 버전 미고정·`integrity` 없음 | 2곳(`ShareActions.tsx:27`, `dashboard/events/[eventId]/page.tsx:337`) |
| 7 | cleanup의 S3 삭제 실패 처리·썸네일 미삭제 | 실패를 `console.warn`으로 삼키고 Firestore 문서는 삭제. `thumbKey` 삭제 코드 없음 |
| 8 | 갤럭시 HDR(HLG 10bit) 클립 색 표현 미확인 | 증상 보고는 없음 |
| 9 | `/api/og-image/<id>` 실동작·302 처리 미확인 | 카카오 카드 안 A의 전제 |

직전 핸드오프(2026-09-20)에서 넘어온 항목:

| 항목 | 상태 |
|---|---|
| ③-1 결제 전 마감 + 클립 0개 차단 | **변동 없음.** 미착수. `3615b9b` diff 참조. 결제 전 마감은 `closed` + `unlocked: false`로 구분되므로 `prepare` 최초 결제 분기가 이 조합을 받도록 설계 필요 |
| ③-2 409 재발행 경로 | **변동 없음.** ③-1에 종속 |
| ③-3 재과금 위험 | 완료 (`fc1e487`) |
| 쿠폰 마감 버그 | 완료 (`495e047`) |
| 재렌더 결제 서버 강제 (B안) | **변동 없음.** 보류. known-issues 등재 |
| ④ 라이브 키 교체 | **변동 없음.** ③-1·③-2 뒤. 전에 환불 수동 처리 확인, S3 고착 known-issue 검토 |
| ⑤ 실결제 검증 | **변동 없음.** ④ 뒤 |

라이브 키 교체 시 `NEXT_PUBLIC_TOSS_CLIENT_KEY`는 빌드 시 코드에 박히므로 Vercel 값 변경 후
재배포가 필요하다.

## 7. 미확인

- 클립 20개 규모 실사용 이벤트에서 `transcode`의 렌더 시간 영향. 검증은 클립 1개 기준이었다
- "2026-07 중순까지는 정상이었다"는 Ray의 기억과, timeline 생성 코드가 2026-05-07
  (`0160db5`·`37afdb8`) 이후 실질 변화가 없다는 사실이 어긋난다. Shotstack 서버 쪽 변경
  가능성이 있으나 **추정이며 확인하지 못했다**
- 테스트로 만든 이벤트들의 완성본이 운영 S3 버킷에 남아 있다. 정리 필요 여부 미정
- 직전 핸드오프 9장의 미확인 항목(수동 마감한 쿠폰 이벤트의 `done` 도달 여부,
  테스트 이벤트 `mg3fNMxKINplMzjPPH9A` 상태, 2026-08-13 이후 다른 쿠폰 이벤트가 마감에서
  막혔는지, 환불 수동 집행 여부, lint 에러 12건의 파일별 위치)은 이번 세션에서 다루지 않았다

## 8. 학습·패턴

- 한 이벤트만 보고 일반화했다. 증상을 볼 때 "정상 사례가 있는가"를 먼저 찾는다
- 같은 파일을 쓰고 변수 하나만 바꾼 실험이 결정적이었다. 소스가 다르면 어떤 비교도
  판정이 안 된다
- 필드 이름으로 추측하기 전에 실제 값을 본다. `useDualTrack`(실제는 미디어 기준)과
  `videoFilter`(필드 자체가 없었음) 두 번의 오독이 틀린 가설을 만들었다
- 벤더 공식 스키마 원문에 해법이 직접 적혀 있었다. `videoasset.yaml`의 `transcode` 필드
  설명에 "fix rotation problems". 자체 구현 경로를 설계하느라 돈 뒤에 찾았다
- 채팅 클로드의 지시에 사실 오류가 있었다(문서 커밋 지시의 "사고 기록의 `closedAt` 7일").
  CC가 대상 문구를 못 찾자 임의 수정 대신 보고했고, 실제 오류였던 `PROJECT.md`를 코드
  근거로 정정했다. 지시를 못 찾으면 멈추고 보고하는 것이 옳았다

## 9. 운영 메모

- 다른 프로젝트(구조 동일)에서 같은 회전 증상이 보고됐다. 해결법은 동일하게
  `transcode: true`다
