# Known Issues & Deferred Tasks

## ✅ Phase 4 AI 렌더링 파이프라인 (완료)
- S3 업로드 정상
- Shotstack 렌더링 정상 (stage 환경, 워터마크 있음)
- 영상 재생 및 다운로드 정상
- 클립 타임라인 순서 수정 (uploadedAt 오름차순)

## clipCount 증가 실패 (무시됨)
- 현상: 업로드 시 events.clipCount 증가 permission-denied 발생
- 원인: 비로그인 참가자가 events 문서 update 불가 (Firebase 규칙)
- 현재 처리: .catch()로 무시 중. 클립 목록은 onSnapshot으로 직접 세므로 기능 영향 없음
- 해결 방법: Firebase 규칙에서 clipCount 필드만 비로그인 update 허용
  또는 Cloud Function으로 clipCount 업데이트 위임
- 우선순위: 배포 전 처리
