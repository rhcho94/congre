# Known Issues & Deferred Tasks

> 진행 중·보류·메모 항목만 둔다. 해결 완료 항목은 known-issues-resolved.md로 이동.

## Firestore composite index — eventId + uploaderPhone + uploaderName 3조건 쿼리

- **현황**: `/api/clips/check` GET 및 `POST /api/clips` 중복 체크에서 `eventId + uploaderPhone + uploaderName` 3조건 composite where 쿼리 사용. Firestore는 이 복합 인덱스를 자동 생성하지 않음.
- **발현 조건**: PR 1 배포 후 첫 업로드 시도 시. Firestore가 쿼리를 거부하며 Vercel 로그에 인덱스 생성 링크 포함된 에러 출력.
- **처리**: Vercel 로그 → Functions 탭 → 에러 메시지 내 "Create index" 링크 클릭 → Firebase 콘솔에서 인덱스 자동 생성 (1~2분 소요).
- **격상 트리거**: 인덱스 생성 링크가 에러에 포함되지 않는 경우 → Firebase 콘솔 → Firestore → 색인 탭에서 수동 생성 (컬렉션: clips, 필드: eventId ASC + uploaderPhone ASC + uploaderName ASC).

## 환경변수 미등록 — 운영 작업 [6] 대기 중

- **CRON_SECRET**: `/api/cron/check-render-deadlines` Bearer 인증 토큰. 코드 준비 완료, Vercel + GitHub Secrets 등록 필요.
- **NEXT_PUBLIC_APP_URL**: 크론에서 dashboardUrl 구성 시 사용 (`https://congre-three.vercel.app`). Vercel 등록 필요.

## 네이버 메일 도달성 — 1차 점검 포인트 (메모)

- 현황 (2026-05-08 점검): 1통 실측에서 네이버 받은편지함 정상 도달, 경고 배너 없음. 약한 고리 아님으로 판정하고 보류.
- 인증 측 정합성 모두 통과: SPF (send.congre.kr 등록), DKIM (resend._domainkey 등록, 외부 검증 일치), DMARC (p=none, 발행됨), Resend verified.
- 잠재 리스크: 메일 From 주소가 noreply@congre.kr (루트)인데 SPF는 send.congre.kr (서브)에 등록됨. SPF alignment 측면에서 mismatch이지만 DKIM alignment로 DMARC 통과 중인 것으로 추정. 신규 도메인 평판이 쌓이지 않은 상태에서 발송량이 늘면 도달성이 떨어질 가능성 잠재.
- 점검 트리거: 사용자(특히 네이버 메일 사용 학부모·교사)로부터 "메일이 안 옴" 또는 "스팸함에서 발견" 신고 발생 시.
- 점검 순서:
  1. 본인 네이버 계정으로 트랜잭션 메일 1통 발송 → 받은편지함/스팸함/미도착 확인
  2. 스팸함 / 미도착 → 다음 작업 후보 2가지:
     a. 루트 congre.kr에 SPF 추가 등록 (Resend 콘솔 가이드 따름)
     b. 코드 From 주소를 noreply@send.congre.kr로 변경
  3. 둘 중 어느 게 적절한지는 그 시점 Resend 권장 사항 + 발신자 표시 UX 우선순위로 결정
- 관련 결정: DECISIONS 2026-05-02 (이메일 발송 도메인 congre.kr)

## 미성년자 영상 법적 리스크 — 시장 진입 전 검토 필요

- **현상**: 1순위 시장(학교 졸업식)이 미성년자 영상 수집·처리. 단순 "이용약관 체크"로는 부족할 수 있음.
- **검토 영역**:
  - 개인정보보호법상 미성년자 동의 절차 (부모 동의 필수 여부)
  - 클립에 다른 학생 얼굴 비치는 경우 그 학생들 부모 동의
  - 영상 보존 기간 (학교 기록물 관리 규정 적용 가능성)
- **우선순위**: 시장 진입 결정 시점 전 법무 검토 필수. 운영자 1인 비개발자 상황에서 기술 사고보다 법무 리스크가 큼.
- **현재 처리**: 미정. 결정 시 DECISIONS.md에 추가 예정.

## Shotstack console.error 디버그 로그 영구 보존 (메모)

- **현황**: `shotstack.ts` createRender의 non-OK 분기에 `console.error("[shotstack] non-OK response:", res.status, text)` 영구 보존 확정 (DECISIONS 2026-05-08).
- **위치**: `src/lib/shotstack.ts` — `if (!res.ok)` 블록
- **이유**: Vercel 서버 로그가 유일한 원격 디버깅 채널. throw 전 전체 응답 본문 출력이 진단에 결정적이었음 (width/height 오류 발견).
- **운영 메모**: 프로덕션에서 Shotstack API 스키마 변경/오류 발생 시 Vercel 로그 → Functions 탭 → "non-OK response" 검색으로 바로 확인 가능.

## 재렌더 UX 갭 — done 상태 버튼 미노출, 클립 토글 모달 없음

- **현황**: 재렌더 버튼이 `status === "closed" && clips.length > 0` 조건에서만 노출 (정찰 B7). `status === "done"` 완성 후엔 안 보임. 클립 제외 토글 UI도 별도 섹션에 있어 재렌더 직전 토글 화면을 다시 보여주는 흐름 아님.
- **위치**: `src/app/dashboard/events/[eventId]/page.tsx` — done 상태 블록, 재렌더 버튼 조건부 렌더링
- **결정 사항**: DECISIONS 2026-05-09 (D1) 재렌더 정책에서 "done 상태에도 노출 + 클립 토글 모달" 사양 확정.
- **처리 시점**: 필드 테스트 첫 회차 결과 보고 갈래 5에서 처리.

## 완성본 단일 필드 덮어쓰기 구조 — D2 구현 시 전환 예정

- **현황**: `events/{eventId}.videoUrl` 단일 필드에 Shotstack URL 직접 저장 (정찰 E15, `src/app/api/cron/check-rendering/route.ts:45`). 재렌더 시 이전 영상 URL 소실. 한 이벤트는 단일 완성본만 보존하는 구조.
- **결정 사항**: DECISIONS 2026-05-09 (D2) 완성본 보존 정책에서 서브컬렉션 `events/{eventId}/renders/{renderId}` 전환 사양 확정.
- **처리 시점**: 갈래 6 (7일 보관 + 삭제 알림) 작업 시 동시 전환.

## 클립 메타데이터 저장 실패 — S3 고아 파일 발생 가능

- **현황**: 마감(close) 후 참가자 업로드 시 S3에는 파일이 올라가지만, POST /api/clips가 409 EVENT_CLOSED 반환됨. 클라이언트는 `.catch()`로 무시하고 done stage로 전환. S3에 고아 파일이 누적될 수 있음.
- **위치**: `src/app/upload/[eventId]/page.tsx` doUpload, `src/app/api/clips/route.ts` 마감 검증 분기
- **발견 경위**: 갈래 필드-1 정찰(A4 항목)에서 발견. 닉네임 작업 범위와 무관하여 별도 처리.
- **잠재성**: 마감 시점과 사용자 업로드 완료 사이의 race가 흔하지 않으면 빈도 낮음. S3 비용 측면에서 작은 이슈지만 누적 시 정리 부담.
- **처리 시점**: 필드 테스트 첫 회차 후 빈도 측정. S3 정리 cron 추가 또는 클라이언트에서 마감 사전 체크 추가 등 옵션 평가.

## 호스트 클립 제거 시 영상 미리보기 흐름 검증 필요

- **현황**: 호스트 대시보드 클립 목록이 닉네임 + 업로드 시각으로 식별 (갈래 필드-1으로 추가됨). 호스트가 "민준 클립 빼주세요" 요청을 받았을 때, 영상 내용 확인 없이 토글만 누르는 흐름이 안전한지 검증 필요. Play 버튼이 있으나 실제 흐름은 필드 테스트에서 관찰 예정.
- **위치**: `src/app/dashboard/events/[eventId]/page.tsx` 클립 목록
- **격상 트리거**: 호스트가 클립 제외 후 "잘못 뺀 것 같다" 사고 발생 시. 양방향 토글이라 복구 가능하나 발견까지 시간 소요.
- **처리 시점**: 격상 트리거 대기. 필드 테스트 첫 회차에서 흐름 직접 관찰.

## GitHub 저장소 Public 유지 — 보안·비즈니스 정보 노출 (실전 테스트 후 결정)

- **현황**: `rhcho94/congre` 저장소 Public 상태. 코드 + docs(DECISIONS·PROJECT·known-issues·CHANGELOG 등) 전체 공개. .env 노출은 없음 (2026-05-14 검색 확인). GitHub Secrets + Vercel 환경변수로 시크릿 분리 완료.
- **위험**: 비즈니스 로직(API 엔드포인트·Firestore 구조·인증 흐름) + 비즈니스 정보(시장 정의·BM·기술 결정·알려진 약점) 노출. 1단계 환경변수 누출 위험은 차단됐으나 2·3단계는 노출 중.
- **처리 보류**: 실전 테스트 우선. 테스트 도중 코드 변경 최소화 원칙으로 Private 전환은 테스트 끝난 후 처리.
- **Private 전환 시 부작용**: GitHub Actions cron 5분 간격 운영 시 월 8,640분 사용 추정. Private free 한도 월 2,000분 초과. 격상 옵션: (a) GitHub Pro $4/월, (b) Vercel Cron Jobs 이전(이미 Vercel Pro 가입), (c) cron 간격 늘리기.
- **권장**: Vercel Cron Jobs 이전 후 Private 전환. 코드 변경 필요(workflow → vercel.json + /api/cron/* 엔드포인트 검증).

## 영상 호스팅 CDN 이전 — 비용 검토 보류 (메모)

- **현황**: 영상 호스팅이 Shotstack CDN (cdn.shotstack.io) 경유. bandwidth 비용은 Shotstack 마진 포함 추정.
- **비용 비교** (영상 1편 3GB + 300명 시청 1회 기준):
  - Cloudflare R2: 약 60원 (egress $0/GB, 저장 $0.015/GB·월)
  - Bunny CDN: 약 3.6만 원
  - AWS S3: 약 10.8만 원
  - Shotstack 현재: 약 18만 원 (추정)
- **트레이드오프**: R2 이전 시 신규 인프라 1개 추가 (Cloudflare 계정·R2 버킷·도메인 연결).
- **격상 트리거**: Shotstack fair use 한도 도달 / 100명+ 규모 시장 진입 / 첫 회차 후 사용량 데이터 재평가.
- **미완 정찰 영역**: R2 한국 PoP 위치, R2 한국 결제·세금 처리, Shotstack 자체 호스팅 옵트아웃 정확한 사양.
- **관련 정찰**: 2026-05-09 채팅 클로드 세션. ROADMAP 보류 중 항목 참조.
