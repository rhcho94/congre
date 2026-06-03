# 2026-06-03 — Firestore composite index 트랙 (no-op 종료)

## 한 줄 요약
"첫 업로드 차단" 예방 트랙으로 시작했으나, 콘솔 실측 + 운영자 실측 결과
필요한 인덱스가 이미 존재·활성이고 known-issues 메모가 stale인 것으로 확인.
작업 불필요(no-op). stale 메모 삭제 후 종료.

## 발견 (사실 그대로)
- Firebase 콘솔 색인 탭 실측: clips 컬렉션에 `eventId + uploaderName` 인덱스
  존재·"사용 설정됨". (그 외 clips: eventId+uploadedAt, events: hostId+createdAt.)
- 운영자 실측: 게스트 중복 체크는 eventId + uploaderName 으로 사람 구분.
  같은 폰 재사용 OK, 이름은 매번 바꿔야 함(몇 번째 클립인지 구분 목적).
  uploaderPhone 은 중복 판정에 미사용.
- known-issues 의 "eventId + uploaderPhone + uploaderName 3조건" 메모는
  실제 코드/동작과 불일치(stale). → 삭제.
- 주의: 위 결론은 콘솔 + 운영자 실측 기반. 코드 본문(쿼리 .where 절) 직접
  정찰은 생략함(실측 2개가 같은 결론이라 불필요 판단). 추후 의심 시 정찰 대상은
  src/app/api/clips/check/route.ts, src/app/api/clips/route.ts 중복 체크 분기.

## 미완
- 없음. 이 트랙 종료.

## 다음 세션 후보 (06-03 invite-og 핸드오프에서 이월, 미착수)
- ★ ⑦ 완성본 /share OG + Shotstack→S3(B). 선행: 운영자 Shotstack Integrations에
  S3 등록(전용 IAM 키).
- ★ OneDrive 이전(L6). 지난 세션 빌드에서 .next 잠금 실제 발생.
- CLAUDE.md lint 게이트 문서 불일치(문서 "errors 0" vs 실제 baseline 11).
- (열린 질문) 앱 소개 문서 — 용도 미정.

## 본 세션 학습 (프로세스)
- docs 메모는 "과거에 그렇게 적혔다"는 사실이지 "현재 코드가 그렇다"는 사실 아님.
  실측과 메모가 충돌하면 메모를 먼저 의심. (이번 세션 내 핸드오프 "미커밋" 메모도
  같은 함정이었음 — 한 세션에 같은 오진 2회.)
- micro-step마다 정찰→승인→실행 사이클을 돌리지 말 것. 채팅 클로드가 가진 도구
  (과거 채팅 검색, 첨부, 운영자 실측 한 줄)로 결론 나는 건 즉답. 정찰은 코드 본문을
  실제로 읽어야만 하는 경우로 한정.
