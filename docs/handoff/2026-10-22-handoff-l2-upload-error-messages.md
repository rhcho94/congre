# 핸드오프 2026-10-22 (밤) — L2 하객 업로드 실패 문구

작성: 채팅 클로드 코난. 다음 세션은 이 문서 + 프로젝트 문서 `claude/pending-backlog.md`로 시작.
직전 핸드오프: `2026-10-22-handoff-cleanup-runbook-rehearsal.md`(`ca5606d`).

## 1. 한 줄 요약
L2 정찰 → Ray 결정((a) 환경변수 trim은 코드로 안 함, (b) 하객 업로드 실패 문구 3갈래, (c) 클립 기록 저장 실패는 등재만) → 커밋 2개 push(`ca5606d..1bb3e47`).

## 2. 커밋
| 레포 | 해시 | 내용 | push |
|---|---|---|---|
| `rhcho94/congre` | `16ede38` | fix(upload): distinguish server-side and closed-event upload errors for guests — 1파일 +12 −2 | `ca5606d..1bb3e47`, 10/22 23:2x |
| `rhcho94/congre` | `1bb3e47` | docs: known-issues clip save failure, changelog 10/22 — 2파일 +15 | 같은 push |
| `rhcho94/congre` | (이 문서) | docs(handoff) | |

게이트(커밋 1 수정본 기준): 빌드 정적 31/31, Route 41, lint 12 errors / 2 warnings. 기준값과 같음. 커밋 2는 문서만.

## 3. 정찰 (HEAD `ca5606d`, 읽기 전용)
- `new S3Client` 9곳 / 8파일, 모두 trim 없음. trim은 엔진 호출 `lib/engine.ts`(Step Functions)만.
- 하객 업로드 실패 문구는 `upload/[eventId]/page.tsx:374` 1곳. S3 미설정이면 하객에게 "S3가 연결되지 않아…"라는 개발자 문구가 보였다.
- 클립 기록 저장(`:307-337`)은 `DUPLICATE_UPLOADER`·`PLAN_LIMIT_REACHED` 말고는 브라우저 콘솔에만 남기고 완료 화면을 보여 준다. 저장 대기는 5초에서 끊는다(`:320-322`). `/api/clips/route.ts`는 try/catch가 없다.
- 10/19 정찰의 줄 번호(327-328, 336, 201-215)는 그대로였다.

## 4. 결정 (Ray)
- (a) 코드 변경 없음. 다시 생기면 Vercel 로그 `[presign] getSignedUrl failed`를 보고 값 재입력.
- (b) 문구 3갈래:

| 상황 | 코드 | 문구 |
|---|---|---|
| 서버 문제 | `PRESIGN_FAILED`, `INTERNAL_ERROR`, `S3_NOT_CONFIGURED`, `presign_failed:5xx` | 지금 서비스에 문제가 있어 업로드하지 못했어요. 잠시 뒤 다시 시도해주세요. |
| 마감 | `EVENT_CLOSED` | 이미 마감된 이벤트라 영상을 올릴 수 없어요. (재시도 없이 바로) |
| 그 밖 | 나머지 | 업로드에 실패했어요. 네트워크를 확인하고 다시 시도해주세요. (기존) |

  서버 문제는 일시적일 수 있어 재시도 3번을 유지했다.
- (c) known-issues 등재만. 함정: 5초 초과를 실패로 보고 재시도시키면 서버가 이미 저장한 경우 `DUPLICATE_UPLOADER`("이전 영상과 다른 이름을 입력해주세요")로 하객을 잘못 안내하고, S3 고아 파일도 생긴다.

## 5. 검증
- 코난: diff 줄 수(+12 −2, +15), 문구 원문, known-issues 위치, CHANGELOG 해시 대조.
- 라이브 확인은 안 했다. 서버 문제 문구는 일부러 고장을 내야 보이고, 마감된 행사의 하객 화면이 업로드 전에 막는지는 코난이 코드를 본 적 없어 모른다.
- 업로드 서명과 기록 저장 사이에 마감되면 저장 쪽에서 조용히 넘어간다 — (c) 등재 항목과 같은 경로.

## 6. 백로그
`claude/pending-backlog.md` 10/22 23:30 갱신: L2를 종료 절로. 새 보류 없음.

## 7. 다음 후보
1. ⑧ 처리방침 개정 — 출시 전 필수(Ray 법률). 일정은 코난이 모른다.
2. O7 완성본 크기 — 실고객 행사 길이를 본 뒤.
3. S1·S2 — 첫 실고객 반응 뒤.
4. 작은 것: S5 리허설 시험 행사 문서 삭제(Firebase 콘솔), R1 번호 typeof 가드.

지금 코드로 바로 할 출시 전 필수 항목은 없다.

## 8. 학습
- 이번 결정을 가른 건 "고칠 것"보다 "고치면 생기는 문제"(5초 끊기 → 중복 오안내)였다. 재시도·타임아웃이 걸린 흐름은 고치기 전에 "이미 성공했는데 실패로 본 경우"부터 따진다.
- 백로그 문서는 고칠 때 통째로 다시 써야 하고 프로젝트 캐시를 초기화하므로, 세션 끝에 한 번만 쓴다.
