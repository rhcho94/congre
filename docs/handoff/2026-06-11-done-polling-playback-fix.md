# 2026-06-11 done 상태 폴링 중단 — 완성본 재생 무한 재버퍼링 수정

## 한 줄 요약
어제 "재렌더 완성본 품질 결함"으로 적혔던 1순위 블로커는 품질 문제가 아니라
재생 경로 버그였음. done 이벤트의 5초 폴링이 presigned videoUrl을 계속 재발급해
<video src>를 갈아끼워, 받던 영상 버리고 0부터 무한 재시작. done에서 폴링
중단(69bff94)으로 해결, 실측 정상 확인.

## 본 세션 커밋
- 69bff94 fix: stop dashboard event polling once status is done
  - src/app/dashboard/events/[eventId]/page.tsx (1 file, +3 / -1)
  - receivedStatus 변수에 evt.status 저장 → finally에서 status !== "done"일 때만
    다음 setTimeout(fetchEvent, 5000) 예약. done tick에서 폴링 자연 종료.
  - setEvent(evt)는 유지(화면은 done 데이터로 채워짐). 기존 tick 가드
    (unmount cancelled, document.hidden, 404) 미변경.
  - build 통과 / lint 11 errors + 3 warnings (baseline delta 0)

## 진단 경로 (발견 사항)
- 증상: 대시보드 재생 시 2~3초만 나오고 까만 화면, BGM 도입부만 반복.
  단 다운로드하면 정상. 총 재생시간(duration)은 정상 표시.
- 결정적 단서 순서:
  1. "다운로드는 정상" → 파일·합성 층 문제 가설 즉시 기각.
  2. 네트워크 미디어 필터: 같은 .mp4가 17kB/15kB/4MB로 잘게 쪼개져 수십 번
     무한 반복. 재생 위치는 0:00 고정.
  3. 응답 헤더: 도메인 congre-mvp-videos.s3 (우리 S3), 206 + Accept-Ranges:
     bytes (S3 Range 정상). 요청 Range: bytes=0- (전체 요청). URL에
     X-Amz-Expires=3600 + 매 요청 다른 Signature → presigned URL이 매번 새로
     발급되는 게 확정 증거.
- 코드 정찰: <video src={event.videoUrl}>가 5초 폴링 event state에 묶임.
  GET /api/host/events/[eventId]가 매 요청 getVideoPresignedUrl로 새 서명 발급
  (s3-server.ts:18, expiresIn 3600). 폴링은 done에서도 안 멈추던 구조였음.

## 폐기된 가설 (다음 세션에서 사실로 취급 금지)
- (a) "재렌더 완성본 품질 결함" — 파일은 정상. 재생 경로 문제였음.
- (b) faststart/moov atom 뒤배치 — Shotstack output 옵션에 faststart 토글 없음
  (공식 문서 확인). 그러나 우리 S3는 Range 정상이라 moov 문제 아님.
- (c) S3 서빙 Range 미지원 — Accept-Ranges: bytes로 정상 확인됨.

## 미완 / 다음 세션 후보
- 🟡 rendering 갇힌 잔여 6건 — Firestore status→closed 수동 변경 후 "다시 시작"
  버튼으로 동일 복구 가능. (7kg2dUVqPYAsOD4aMyYM, FfKl53IyDrvLjimxu5nb,
  Imzt0K5lqcvMwZlWcK0X, iyX3pk0O0Gwhfs7SD8SN, M8KIxxR6w7YKlRH5Q2RQ,
  xVZeOB7NDmYhR47K2N6y)
- 🟡 다른 호스트 이벤트 복구 경로 부재 — render/start는 hostId!==uid면 403,
  대시보드 목록도 hostId==uid. 운영자가 남의 갇힌 이벤트 복구 불가.
  졸업식 시즌 전 admin 복구 기능 또는 비상 복구 스크립트 필요. 실고객 없어 보류.
- 🟢 CC ※recap 재발 — 이번 정찰 프롬프트 보고 말미에 또 붙음(CLAUDE.md 절대
  규칙 위반, 학습 룰 #1). 실행 프롬프트엔 안 붙음. per-prompt 아닌 규칙 강화
  검토 영역(9302871 escalation 패턴과 동일).
- 🟢 dotenv ^17.4.2 스크립트 stdout 외부 광고 문구. DOTENV_CONFIG_QUIET 또는
  핀 다운그레이드로 억제 가능. 별도 트랙.

## 본 세션 학습 한 줄
증상 라벨("품질 결함")보다 관측 데이터를 따라갈 것 — "다운로드는 정상" 한 마디가
파일 가설을 즉시 깼고, Range: bytes=0- + 매번 다른 Signature가 진짜 원인을 박음.
