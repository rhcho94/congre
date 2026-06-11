# 2026-06-11 prod 100클립 용량 실측 — done 7분, ⑦ 100클립 실검증 완료

## 한 줄 요약
prod 키로 100클립×10초(16.8분) 완성본 렌더가 done까지 정상 도달. 총 7분 10초.
우리 S3에 1.5GB 정상 도착 + 다운로드 재생 정상 → ⑦ 해결이 100클립 실데이터에서
작동함이 실측 확정. "마감 후 약 7분 내 완성본 도착" SLA 근거 확보(단독 렌더 기준).

## 본 세션 작업 (코드 변경 없음 — 시뮬레이션/검증만)
임시 스크립트로 prod Shotstack 렌더 1건 실행 후 삭제. 커밋 없음.
- render: f75b31b7-1a74-4c88-b291-fe7d4c467217
- 게이트: prod 강제(SHOTSTACK_ENV=production + stage 키 7ka65P 감지 시 중단) +
  명령행 일회성 env 주입(.env.local은 stage 그대로 무변경).
- 잔류물 s3://congre-mvp-videos/f75b31b7….mp4 (1.5GB) 검증 후 운영자 수동 삭제 완료.

## 실측 사실 (추정 0)
| 항목 | 결과 |
|---|---|
| 제출 수용 | renderId 반환, createRender 응답 2.8초 |
| 최종 status | done |
| 클립 수 천장 / 요청 크기 한도 | 미발현(통과) |
| 총 렌더 시간(submit→done) | 430초 = 7분 10초 (실시간 0.43배) |
| 우리 S3 도착 | congre-mvp-videos에 1.5GB 정상(0바이트 아님) |
| 출력 내용 | 다운로드 재생 정상 |

상태 전환 타임라인:
- fetching/preprocessing: ~25s
- rendering: 약 6분 32초 (대부분)
- saving(S3 복사 추정): 약 12초
- done: +429s

## 시뮬 입력 구성 (실제 render/start 대비 대체분)
- src: 실 clip 1건(event mr94KGsRpQzFm6bKPOAI clip, presigned 24h) 100개 복제
- intro/outro: text-only("prod test intro/outro") — 실 이벤트 미디어 대체
- plan: "free"(워터마크 트랙 포함)
- style: undefined(filter/transition/showNames 미적용, bgm은 ${appUrl}/audio/bgm.mp3 폴백)
→ 즉 트랜지션·페이드·BGM 무드선택·showNames 등 풀 레이어링은 이번 테스트 범위 밖.
  검증된 것은 "클립 100개 + 텍스트 인트로/아웃트로 + 폰트/BGM 폴백"의 done 도달.

## 미검증/범위 밖 (다음에 필요 시)
- 동시성: 여러 이벤트 동시 렌더 시 큐 대기. 본 테스트는 단독 1건 기준.
- 풀 레이어링 100클립: transition/fade/bgm 무드/showNames 다 얹은 100클립 done은 미검증.
- literal 출력 길이 초 단위 정밀 측정 안 함(재생 정상으로 갈음).

## 🟡 남의 호스트 갇힌 이벤트 복구 — 코드 경로 정찰 완료, 대상 미확인
- 운영자 보고: 약 5일 전 별도 계정이 호스트로 이벤트 생성·업로드 후 "편집 중" 고착.
  계정 ID 운영자 확인 중(미확보).
- rendering 갇힌 현 6건은 전부 hostId=rhcho(bPG65…) → 그 "남의 이벤트"는 이 6건에 없음.
  다른 status거나 24h cleanup으로 소멸했을 수 있음 → 계정 확보 후 hostId≠rhcho 전수
  (status 무관) 정찰로 존재·상태·클립 생존부터 확정 필요.
- 복구는 버튼 불가(대시보드 where hostId==uid + render/start hostId!==uid→403).
  Admin SDK 스크립트만 길(hostId 무관).
- 스크립트 골격(정찰로 확정, 미실행):
  - 렌더 생성 = src/lib/shotstack.ts createRender(clips,intro,outro,plan,style) 공유 함수
    직접 호출(인증 가드와 분리됨).
  - 성공 후 events 문서 필드셋 = render/start/route.ts:187-203(status=rendering, renderId,
    deadline/refund 타임스탬프 등). videoS3Key+done은 이후 check-rendering cron이 세팅.
  - 미결정: route 핵심을 공유 함수로 추출 vs 스크립트 복제(후자는 route와 drift 위험).

## 🟡 rendering 갇힌 6건(전부 본인 이벤트)
7kg2dUVqPYAsOD4aMyYM, FfKl53IyDrvLjimxu5nb, Imzt0K5lqcvMwZlWcK0X,
M8KIxxR6w7YKlRH5Q2RQ, iyX3pk0O0Gwhfs7SD8SN, xVZeOB7NDmYhR47K2N6y
- 본인 이벤트라 status→closed + "다시 시작" 버튼으로 복구 가능(직전 세션 검증된 경로).

## 🟢 CC ※recap 재발 — 본 세션 4회 누적
- 자유형(정찰/보고) 프롬프트마다 말미에 ※recap 반복. 실행 프롬프트엔 안 붙음.
  CLAUDE.md 절대 규칙에 이미 있으나 per-prompt로 안 잡힘 → 규칙 강화 필요
  (9302871 escalation 패턴 영역).
- dotenv ^17.4.2 stdout 외부 광고 문구: 별도 트랙(DOTENV_CONFIG_QUIET 또는 핀 다운).

## 본 세션 학습 한 줄
"stage 키 = 완전 격리"가 아님 — createRender의 destinations가 prod S3로 하드코딩돼
있어 stage 렌더 결과물도 prod 버킷에 샌다. 환경 격리는 키뿐 아니라 코드 내 목적지까지 봐야 함.
