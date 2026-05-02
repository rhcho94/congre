# Changelog

> 기능 단위 작업 이력. 최신이 위.

## 2026-05-02

- refactor: closeEvent 서버 API 이전 — POST /api/events/[eventId]/close, hostId 주최자 검증 포함, 클라이언트 Firestore 직접 쓰기 완전 제거
- feat: 알림 시스템 도입 — Resend 이메일 + SOLAPI SMS, 시나리오 5건 트리거 연결 (이벤트 생성, 렌더 시작/완료/지연/실패), 시나리오 2건 함수만 구현 (첫 클립 업로드, 참가자 결과)
- feat: POST /api/events 신설 — 서버 사이드 이벤트 생성 + 알림 트리거
- feat: POST /api/render/complete 신설 — 렌더 완료 서버 사이드 처리 + 10분 기준 완료/지연 분기
- feat: events 문서에 organizerEmail, organizerPhone, deadlineAt 필드 추가
- refactor: render/start에서 Firestore 상태 업데이트 서버 사이드로 이전

## 2026-05-01

- chore: 테스트 데이터 정리 실행 — events 32건 + clips 57건 + S3 객체 57건 삭제
- chore: add execute mode to cleanup script with S3 object deletion
- chore: add dry-run cleanup script for test events
- feat: 클립 재생 Pre-signed URL 구현 (firebase-admin 도입)
- docs: 프로젝트 문서화 시스템 도입 (CLAUDE.md 확장, README 갱신, docs/ 신규 4종)
- feat: 랜딩 페이지 파티클 효과 추가 (canvas-confetti burst + ambient CSS sparkles)
