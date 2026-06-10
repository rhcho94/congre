# 2026-06-10 — Shotstack S3 복사 0바이트 실패 (⑦ 재개)

## 한 줄 요약
Shotstack이 "S3 자격증명 sandbox 저장 버그 패치" 통보 → 지시대로 삭제·재연결·재렌더했으나 복사 여전히 실패. 렌더 Outputs에 s3 출력이 0바이트로 기록됨(완성본은 32.5MB). 원인은 우리 코드/요청/키 아님 — Shotstack 복사 단계 내부 실패로 확정. 증거 담아 회신 발송. 답신 대기.

## 확정된 진단
- 대상 renderId: f62e74ce-f728-4489-aec0-db7c64e1b49f (이벤트 M8KIxxR6w7YKlRH5Q2RQ)
- Shotstack 렌더: Done, 미리보기 정상 재생, Render Time ~60s, 완성본 32.5MB
- Shotstack 대시보드 Outputs 탭: 자산 1개 "f62e74ce-...b49f.mp4", 라벨 "s3", 크기 "0 B"
- 우리 S3 버킷 congre-mvp-videos: 전체 167객체 중 renderId 포함 객체 0개 (완성본 없음)
- 렌더 요청 destination 정확: provider s3 / region ap-southeast-2 / bucket congre-mvp-videos
- 완성본 기대 키 = 루트 {renderId}.mp4 — Outputs의 파일명과 일치 → 키 경로 불일치 아님 (후보 (a) 배제)
- 같은 앱 S3 키(AKIA3NACVCKDZGIOZX4S)로 BGM presigned GET 정상 → 우리 키 읽기 정상
- 결론: destination 복사가 시도되나 0바이트 전송으로 실패 → 버킷에 파일 안 생김 → cron이 루트 {renderId}.mp4 head 영구 404 → status가 rendering에 무한 고착

## done 고착 메커니즘 (코드 규명 완료)
- 완료 감지 = cron 폴링 (vercel.json, /api/cron/check-rendering, */5). webhook 라우트(/api/render/complete)는 USE_CRON 401로 비활성.
- check-rendering: Shotstack done이어도 HeadObject({renderId}.mp4)가 성공해야 status=done + videoS3Key 저장. 실패 시 continue → 무한 rendering. (route.ts:61-77)
- Firestore 확인: status=rendering, renderId 있음, videoS3Key/renderDoneAt undefined.

## 오늘 덤으로 검증된 것 (그동안 ⑦에 막혀 못 보던 것)
- Group A 내용 (렌더 요청 JSON + 미리보기로 확인): BGM 분위기 픽(calm/calm_01.mp3)·믹싱·fadeInFadeOut, 한글 이름 자막(NotoSansKR), 워터마크 "made by Congre"(Cormorant 0.4 opacity), 클립 volumeEffect fadeInFadeOut, transition in/out 분리(fadeSlow/fade) — 모두 정상.
- Group B 알림 실전 작동 확인 (Firestore notifications): renderStarted / renderDelayed / refund50 발송됨. renderCompleted·participant = null (done 안 됐으니 정상).
- 미검증: 한글 인트로/아웃트로 (이번 이벤트는 인트로/아웃트로 클립 미입력 → 요청에 없음). 별도 검증 필요.

## 발송한 회신 (Shotstack)
- 이전 스레드 Reply. 담당자 Peace. 제목 "Re: S3 destination copy still failing after the fix (output shows 0 B)".
- 핵심 증거: Outputs의 s3 0 B + 버킷 전체 리스트 0개 + 요청 destination 정확 + 같은 키 읽기 정상.
- 요청: renderId f62e74ce-...b49f의 복사 로그 — raw S3 error, AWS Request ID, 워커가 실제 쓴 Access Key ID.

## 미완 / 대기 (다음 세션 우선순위)
1. (대기) Shotstack 답신 — 외부. 운영자 액션 없음. 시드니 업무시간 기준.
2. (대기) ⑦ 복사 풀리면: 재렌더 → 버킷 완성본 확인 → done 전환 → 완료/참가자 알림 → 7개 박힌 이벤트 일괄 정리.
3. (중) 한글 인트로/아웃트로 검증 — 인트로/아웃트로 입력한 이벤트로 재렌더 시.
4. (별건) CC ※recap 격상(9302871) 실패 확인 — 이번 정찰 보고 끝에 또 recap 붙음. 다음 레버는 운영 단계 잘라내기.

## 학습
- 외부 SaaS "패치했다" 통보 ≠ 해결. 결과물(s3 0 B, 버킷 0개)로 실측 검증해야 함. 통보를 믿고 종료 선언하지 않은 게 옳았음.
- 벤더 대시보드의 출력 메타데이터(Outputs 탭 크기 0 B)가 "복사 시도했으나 실패"를 구분하는 결정적 증거였음. 버킷에 "없다"만으론 시도 여부를 모름 — 벤더 측 출력 기록까지 봐야 (가)요청누락 / (나)복사실패가 갈림.
