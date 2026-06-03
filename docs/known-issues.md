# Known Issues & Deferred Tasks

> 진행 중·보류·메모 항목만 둔다. 해결 완료 항목은 known-issues-resolved.md로 이동.

## Vercel 자동배포 단발 누락 (2026-06-01 발생)

- **현황**: `git push origin main` 정상(remote에 커밋 도달 확인)인데 Vercel Project Deployments 탭에 해당 커밋이 안 뜸. 직전·직후 커밋은 정상 자동배포됨. 단발 누락 패턴.
- **발현 케이스**: 2026-06-01 커밋 `238c3cd` (feat: add dynamic OG card for guest invite link). 빌드 시간 충분히 지나도 Vercel이 트리거 안 함. 결과적으로 OG generateMetadata가 프로덕션에 안 박혀 카카오 카드 동적 미반영.
- **확인 방법**: `curl -s https://app.congre.kr/upload/<eventId>?token=...` 응답에서 build ID (`"b":"<해시>"`)가 직전 배포 이후 안 바뀜. 또는 Vercel Deployments 탭 커밋 해시 직접 비교.
- **처치**: 빈 커밋 + push로 웹훅 재트리거.
  ```
  git commit --allow-empty -m "chore: trigger redeploy for <topic> (<해시> missed by Vercel)" && git push
  ```
- **격상 트리거**: 반복 발생 시 Vercel ↔ GitHub 웹훅 연결 점검 (Vercel 대시보드 → Project → Settings → Git → Disconnect/Reconnect).

## Firestore composite index — eventId + uploaderPhone + uploaderName 3조건 쿼리

- **현황**: `/api/clips/check` GET 및 `POST /api/clips` 중복 체크에서 `eventId + uploaderPhone + uploaderName` 3조건 composite where 쿼리 사용. Firestore는 이 복합 인덱스를 자동 생성하지 않음.
- **발현 조건**: PR 1 배포 후 첫 업로드 시도 시. Firestore가 쿼리를 거부하며 Vercel 로그에 인덱스 생성 링크 포함된 에러 출력.
- **처리**: Vercel 로그 → Functions 탭 → 에러 메시지 내 "Create index" 링크 클릭 → Firebase 콘솔에서 인덱스 자동 생성 (1~2분 소요).
- **격상 트리거**: 인덱스 생성 링크가 에러에 포함되지 않는 경우 → Firebase 콘솔 → Firestore → 색인 탭에서 수동 생성 (컬렉션: clips, 필드: eventId ASC + uploaderPhone ASC + uploaderName ASC).

## OG 이미지 도메인 하드코딩 — 환경변수 정리 시 통합 필요

- 현황: /upload/[eventId] OG 이미지 URL이 https://app.congre.kr로 하드코딩.
  이유: NEXT_PUBLIC_APP_URL 실제 값이 https://congre-three.vercel.app이라,
  사용자에게 보이는 OG 이미지 도메인을 정식 도메인으로 고정하기 위해 OG
  경로만 하드코딩함. 환경변수는 미변경(공유/크론 등 다른 사용처 영향 회피).
- 위치: src/app/upload/[eventId]/layout.tsx generateMetadata
- 격상 트리거: NEXT_PUBLIC_APP_URL을 app.congre.kr로 통일하는 도메인 정책
  정리 작업 시. 그때 이 하드코딩 제거하고 환경변수로 환원.
- 주의: OG 이미지 URL은 카카오가 영구 캐시하므로, 도메인을 바꾸면 이미
  뿌려진 초대장 미리보기가 깨질 수 있음. 도메인 확정 후 변경 권장.

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
- 2026-05-20 갱신: Firebase Auth 인증 메일도 noreply@congre.kr 발신으로 통합됨. Gmail 도달 실측 확인. 네이버 메일 실측은 미실시, 트리거 발생 시 점검.

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
- **2026-05-19 v2 격상**: 본 룰을 CLAUDE.md 절대 규칙으로 격상. 모든 catch 블록에 `console.error("[context] failed:", err)` 의무. 본 세션 가입 흐름 진단에서 catch console.error 누락이 사고 #3 영역.

## 재렌더 UX 갭 — done 상태 버튼 미노출, 클립 토글 모달 없음

- **현황**: 재렌더 버튼이 `status === "closed" && clips.length > 0` 조건에서만 노출 (정찰 B7). `status === "done"` 완성 후엔 안 보임. 클립 제외 토글 UI도 별도 섹션에 있어 재렌더 직전 토글 화면을 다시 보여주는 흐름 아님.
- **위치**: `src/app/dashboard/events/[eventId]/page.tsx` — done 상태 블록, 재렌더 버튼 조건부 렌더링
- **결정 사항**: DECISIONS 2026-05-09 (D1) 재렌더 정책 + 2026-05-21 B5 결정에서 사양 갱신됨. done 상태 노출 + 클립 토글 모달 + 재렌더 결제 게이트 통합.
- **처리 시점**: 필드 테스트 첫 회차 결과 보고 갈래 5에서 처리.

## 완성본 단일 필드 덮어쓰기 구조 — D2 구현 시 전환 예정

- **현황**: `events/{eventId}.videoUrl` 단일 필드에 Shotstack URL 직접 저장 (정찰 E15, `src/app/api/cron/check-rendering/route.ts:45`). 재렌더 시 이전 영상 URL 소실. 한 이벤트는 단일 완성본만 보존하는 구조.
- **결정 사항**: DECISIONS 2026-05-09 (D2) + 2026-05-21 D2 재작성 (B5 반영)에서 사양 확정. 서브컬렉션 전환 + 7일 모두 보관 + 매일 cron 일괄 삭제.
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
- **2026-06-02 갱신**:
  - Shotstack 현 플랜: 구독 200 credits/월($39), PRODUCTION. 보유 385.33, 30일 사용 22.63(렌더 크레딧 여유).
  - 진짜 병목 = Shotstack 호스팅 전송 500MB/월·저장 500MB(2026-06-02 저장 392MB=78%). 출시 시 시청 트래픽으로 전송 초과 예상.
  - 해결책 B(권장): 렌더 output에 S3 destination 지정 + Shotstack 호스팅 opt-out(`{"provider":"shotstack","exclude":true}`). 기존 S3(ap-southeast-2) 재사용 → 저장·전송 동시 해결. 임시 URL 24h 주의(반드시 S3 URL 서빙).
  - 해결책 C: 목적지 Cloudflare R2(egress 무료) — 대규모 시.
  - 추가 점검(불명): cleanup cron이 Shotstack 호스팅분(cdn.shotstack.io)을 실제 삭제하는지. 저장 78% 누적 원인일 수 있음. B 적용 시 소멸.

## 호스트 가이드 PDF — iOS 분기 갱신 필요

- **현황**: `congre-host-guide.pdf` 8페이지 작성 완료 상태. 2026-05-19 v1에서 처리된 iOS Safari capture 480p 사고 처리(옵션 B)가 가이드 본문에 반영 안 됨.
- **갱신 영역**:
  - STEP 03 또는 STEP 04 영역에 "참가자 iPhone 사용 시 갤러리 영상 업로드 흐름" 안내 추가
  - FAQ에 "iPhone 사용자가 영상 못 올린다" 영역 추가
- **격상 트리거**: 영업 진입 시점 + 첫 학교 시장 호스트 인터뷰 후 발견 이슈
- **관련 영역**: 게스트 가이드 PDF + 합본 PDF 재합본 작업 묶음

## 게스트 가이드 PDF — iOS 분기 갱신 필요

- **현황**: `congreguestguide.pdf` 7페이지 (추정) 작성 완료 상태. 2026-05-19 v1 iOS Safari 480p 사고 처리 전 버전.
- **갱신 영역**:
  - iPhone 사용자 흐름 분기 추가 ("지금 촬영하기" 안 보임, "갤러리에서 선택" 우선 안내)
  - iOS 정책 안내 본문 ("iOS 정책상 즉석 촬영 화질 제한")
- **격상 트리거**: 동일 (영업 진입 시점)
- **관련 영역**: 호스트 가이드 PDF + 합본 PDF 재합본 작업 묶음

## 합본 PDF (15p) — 호스트 가이드 + 게스트 가이드 단순 합본 재작성

- **현황**: 호스트 가이드 8p + 게스트 가이드 7p 단순 합본 = 15p. v1 v2 잔여 작업.
- **선행 조건**: 위 호스트 가이드 + 게스트 가이드 iOS 분기 갱신 완료
- **격상 트리거**: 영업 진입 시점

## 신규 호스트 가입 직후 대시보드 가이드 동선 검증

- **현황**: 2026-05-19 v2 P2 작업에서 대시보드 3곳(dashboard, dashboard/create, dashboard/events/[eventId]) nav에 "사용 가이드" 링크 추가. 가입 직후 신규 호스트가 가이드를 발견하는 동선은 운영자 우려 영역에서 출발했으나, 실제 신규 호스트 첫 진입 시 발견·이용 흐름은 필드 테스트에서 관찰 예정.
- **격상 트리거**: 신규 호스트가 "뭘 해야 할지 모르겠다" 보고 발생 시
- **처리 후보**: 가입 직후 first-time 안내 모달 / 온보딩 페이지 / 대시보드 빈 상태 placeholder에 가이드 링크 강조 등
- **관련 영역**: S2-03 P3 이메일 인증 차단 흐름 완료 (2026-05-19 v3). onboarding 개선(first-time 안내 모달 등)은 보정 큐 등재.

## clips 컬렉션 보안 규칙 정비 필요

- **현황**: `clips` 컬렉션 보안 규칙이 `allow update, delete: if request.auth != null`. 인증된 호스트면 다른 호스트 클립도 update·delete 가능. 현재 클라이언트가 직접 Firestore에 쓰지 않고 Admin SDK 경유라 실질 위험 낮음.
- **개선 영역**:
  - `allow update, delete: if request.auth != null && exists(/databases/$(database)/documents/events/$(resource.data.eventId))` 같은 조건 추가 → 이벤트 호스트 검증
  - 또는 events 보안 규칙처럼 hostId 매칭 추가
- **격상 트리거**: 클라이언트 SDK가 clips 직접 쓰는 흐름 추가 시점 + 영업 진입 전 보안 점검
- **관련 영역**: launch-roadmap S4-09 D2 완성본 보존 (서브컬렉션 전환) 작업과 묶음 가능
- **출처**: 2026-05-19 v2 P1 정찰

## host/page.tsx dead code — dashboard·create 뷰 도달 불가

- **현황**: `/host/page.tsx`는 login·signup·forgotPassword 3뷰를 포함하지만 dashboard·create 뷰는 `/dashboard`, `/dashboard/create`로 이동했고 host 파일 내 해당 분기는 도달 불가. `mockEvents` 같은 테스트 픽스처도 잔류.
- **위치**: `src/app/host/page.tsx` — view 분기 상태 중 "dashboard", "create" 케이스
- **격상 트리거**: 코드베이스 정리 또는 /host 리팩터 착수 시. 현재 dead code라 사용자 영향 없음.

## Firebase sendEmailVerification too-many-requests 방어 상태

- **현황**: `auth.ts`의 `sendEmailVerification` 호출이 inner try/catch로 방어됨 (실패해도 가입 계속 진행). 인증 메일 미수신 시점에만 발현 가능. P3a EmailVerificationBanner 재발송으로 복구 경로 확보.
- **격상 트리거**: 가입 실패 사고 발생 시 본 영역 1순위 가설. Vercel 로그 `[signup] sendEmailVerification failed:` 검색.
- **위치**: `src/lib/auth.ts` — `sendEmailVerification` inner catch 블록

## Firebase 이메일 발송 일일 한도 (Spark 플랜)

- **현황**: Firebase Auth 이메일 발송 (인증 메일, 비밀번호 재설정) 일일 한도가 Spark 플랜에 존재. 정확한 수치 비공개 (외부 자료 기준 약 100~200/일 추정). 영업 차단도 중 — 졸업식 시즌 대량 가입 시 격상 가능.
- **격상 트리거**: 발송 실패 사고 (사용자 "인증 메일 안 옴" 다수 신고) 시 → Identity Platform 격상 (Blaze 플랜 + API 활성화) 또는 Firebase 지원팀 한도 증액 요청.

## 루트 congre.kr SPF 미래 통합 영역

- **현황**: P3d에서 Firebase Auth용 SPF를 루트 `congre.kr`에 등록 (`v=spf1 include:_spf.firebasemail.com ~all`). SPF는 도메인당 1개 원칙 (Firebase 공식 명시). Resend는 현재 `send.congre.kr` 서브도메인 SPF 별도 사용 중이라 충돌 없음.
- **잠재 리스크**: 향후 다른 메일 서비스가 루트 `congre.kr` SPF 통합을 요구할 경우 Firebase SPF와 병합 필요. `v=spf1 include:A include:B ~all` 방식으로 통합 가능하나 작업 필요.
- **격상 트리거**: 새 메일 서비스 도입 시 SPF 충돌 경고 발생 시.

## 잔여 호스트 계정 — Auth만 있고 Firestore users 문서 없음

- **현황**: S2-03 P2 (2026-05-19 v2 가입 흐름 도입) 이전 가입한 호스트 계정은 Firebase Auth에만 존재. Firestore users 컬렉션에 프로필 문서 없음.
- **발현**: 이런 계정으로 `/mypage` 진입 시 이름·전화번호·가입일 필드에 "-" 표시 (P1.5 보정으로 UI 깨짐은 회피).
- **처리**: S2-03 P0 (운영자 콘솔 cleanup)에서 해소. 영업 개시 직전 작업 영역.
- **격상 트리거**: 잔여 계정이 사용자(외부 호스트)에게 노출되는 경우.
- **관련 결정**: DECISIONS auth-model 2026-05-19 v2, launch-roadmap S2-03 P0.
- **발견 경위**: 2026-05-20 S2-04 P1 검증 영역.

## Hydration 에러 — dev 환경, Next.js 16.2.4 + 브라우저 확장

- **현황**: dev 서버 (`npm run dev`) 영역에서 좌하단 토스트로 hydration mismatch 경고 노출. 에러 위치 `src/app/layout.tsx:29` (`<html>` 태그).
- **원인 영역**: 브라우저 확장 (LanguageTool 등)이 HTML 태그에 `data-lt-installed` 같은 속성 주입. 서버 렌더 HTML과 클라이언트 HTML 불일치 영역.
- **production 영향**: 없음 (production 빌드는 dev overlay 미노출).
- **사용자 노출**: 없음 (운영자 dev 환경만).
- **Next.js 버전 영역**: 16.2.4 (stale) 신호 — 버전 업그레이드 별도 영역.
- **격상 트리거**: production 빌드에서 hydration mismatch 발견 시 (현재 미발현).
- **처리**: 본인 작업 없음. 보정 큐 메모 영역.
- **발견 경위**: 2026-05-20 S2-04 P1 검증 영역.

## 리드 폼 수신지 코드 상수 하드코딩 (임시 = 개인 네이버)

- **현황**: `src/app/api/lead/route.ts` L5 `const LEAD_TO = "rhcho@naver.com"` 코드 상수. 환경변수 아님. 원래 `hello@congre.kr` 의도였으나 수신용 MX 레코드 없어(발송 전용 도메인) 변경.
- **잠재성**: 회사 메일함(`hello@congre.kr`) 수신 MX 부재. 리드 알림이 개인 네이버로만 옴. 운영자만 받는 알림이라 당장 문제는 아님.
- **격상 트리거**: (a) 회사 메일함 정식 구축 시 → 수신 MX 추가 + 환경변수(`LEAD_TO`)로 분리 + 주소 복원, (b) 영업 인력 추가 시 공용 수신함 필요.

## 본 앱 lint errors baseline (2026-05-31 사이클로 103 → 11 축소)

- **2026-05-31 사이클 5 시점 정찰**: `npm run lint` 베이스라인 = 103 errors + 4 warnings (107 problems). 옛 랜딩 `/` 삭제 작업(2026-05-31) 진입 전 측정에서 발견. 규칙별 분포:
  - `react/no-unescaped-entities` 92건 (3개 파일 집중: guide/guest 34, terms 30, guide/host 26 + privacy 2)
  - `react-hooks/set-state-in-effect` 9건 (dashboard/events/[eventId] 3, upload/[eventId] 2, dashboard 1, mypage 1, share/[eventId]/ShareActions 1, verify-email 1)
  - `react-hooks/refs` 2건 (upload/[eventId] 2)
- **2026-05-31 사이클 6 처리**: `react/no-unescaped-entities` 규칙을 `eslint.config.mjs`에서 `"off"`로 비활성화 (커밋 `69639d2`). 따옴표/아포스트로피 HTML entity 강제 규칙으로 화면 영향 없음, 자동수정 불가 + 92건 대량이라 일괄 비활성화 채택.
- **현재 baseline**: 11 errors + 3 warnings.
  - `react-hooks/set-state-in-effect` 9건 — 별도 트랙
  - `react-hooks/refs` 2건 — 별도 트랙
  - 둘 다 메타상 `fixable: "code"`이나 실제 동작 영향 가능성 있어 자동수정 안전성 미검증 → 수동 점검 트랙
- **격상 트리거**: react-hooks/* 11건 정리 사이클 착수 시. 사용자가 별도로 지시.
- **검증 게이트 운영**: 신규 작업의 lint 게이트는 "errors ≤ 11 (현 baseline)"으로 운영. delta 0이면 통과.
- **2026-05-31 B 정찰**: 잔존 11건(set-state-in-effect 9 + refs 2)을 한 건씩 분류. 결과 **[실제 위험] 0 / [무해·관행] 9 / [불확실] 2**.
  - **무해 9건**: 마운트 1회 초기화(Kakao SDK 로드 2건 — `dashboard/events/[eventId]:277` + `share/[eventId]/ShareActions:25`, iOS 감지 — `upload/[eventId]:118`, verify-email called-ref 가드 1회 — `verify-email:31`) / 외부 트리거 fetch(user 변경) 2건(`dashboard:81`, `mypage:65`) / 화면전환 1회 sessionStorage 복원(`upload/[eventId]:100`) / 500ms 디바운스 자동저장 2건(`dashboard/events/[eventId]:295`·`319` intro/outro). 무한 루프 구조 없음 확인. `setInterval`·반복 `setTimeout` 0건 (1a784d0 오진형 5초 폴링 패턴 없음).
  - **불확실 2건**: `src/app/upload/[eventId]/page.tsx:613`, `react-hooks/refs` (같은 위치 2건, 실질 1지점). JSX 렌더 중 `blobRef.current`를 직접 읽음 — `{blobRef.current && (<button>다시 시도</button>)}` (stage==="error" 분기 안). 규칙 위반은 명백하나, ref가 stale이라 버튼 노출이 어긋나는 **실제 오작동 여부는 런타임 시퀀스(`blobRef` set 시점 ↔ `stage="error"` set 시점 순서) 확인 필요**라 미확정.
- **운영자 결정 (2026-05-31)**: 불확실 2건은 수정하지 않고 보류. 지금까지 필드에서 "다시 시도 버튼이 안 뜬다 / 잘못 뜬다" 사고 보고 0건. 잘 도는 업로드 실패 경로를 건드리는 수정 위험이 더 크다고 판단.
- **격상 트리거 (refs 2건)**: 필드 테스트·운영 중 "녹화·업로드 실패 후 '다시 시도' 버튼이 안 보인다 / 엉뚱하게 보인다" 사고 보고 발생 시 → `upload/[eventId]/page.tsx:613` ref stale 가설 1순위. 진단 순서: `blobRef` set 위치(파일 선택/녹화 완료 핸들러)와 `stage="error"` set 위치(업로드 실패 catch)의 호출 순서 추적.

## 리드 폼 rate limit 미구현 (honeypot만)

- **현황**: `src/app/api/lead/route.ts`에 honeypot만 구현(L52~57, 검증 전 평가). rate limit은 미구현 — L78에 TODO 주석(`// TODO: rate limit — 봇 트래픽 발견 시 Upstash 격상`). 사양 §5엔 "같은 IP 1분 3회 초과 429"가 있었으나 이번 배포에서 빠짐.
- **격상 트리거**: 스팸 폼 트래픽 발생 시 → Upstash 등으로 rate limit 도입(사양 §10).

## 랜딩 페이지 영역 (L4~L5, L7)

### L4. 후기 섹션 실사진/아바타 미적용

- **현황**: 후기 섹션이 placeholder 텍스트만. 실사진·아바타 없음
- **결정 영역**: 운영자. 실제 후기 수집 가능 시점 결정

### L5. 모바일 마키 스크롤 속도·터치 점검 미실행

- **현황**: 데스크톱은 38초 1바퀴. 모바일 실측 안 됨
- **처리 시점**: 다음 랜딩 수정 사이클 또는 필드 테스트 시
- **운영자 결정 (2026-05-30)**: 보류, 이대로

### L7. pricing.html Pretendard 미전환

- **현황**: `deploy/pricing.html`은 index.html과 동일 Cormorant 톤으로 생성. R1~R3 Pretendard 결정은 CD 안에만 보관, R4~R8 zip 일괄 적용 예정이라 현 배포는 아직 Cormorant.
- **표식**: pricing.html 상단 `<!-- TODO: R4~R8 Pretendard 전환 시 이 페이지도 포함 -->` 주석 박힘.
- **격상 트리거**: R9 zip 적용 시 index.html은 Pretendard 전환되는데 pricing.html 누락되면 이 페이지만 Cormorant로 남음.
- **운영자 결정 (2026-05-30)**: 보류, 이대로. Pricing Section.html 교체로 사실상 해소 영역도 있으나 운영자 명시 결정.

### L8. 랜딩 푸터 약관·개인정보 링크 = git 외부 직접 수정분 (CD zip 덮어쓰기 주의)

- **현황**: 2026-05-31 `deploy/index.html` 푸터 4건(L3627·L3628 본문 + L3635·L3636 foot-bottom — `/terms`·`/privacy` 상대경로 → `https://app.congre.kr/terms`·`/privacy` 절대경로)을 CC가 직접 수정·배포. 랜딩은 git 외부 트랙이라 이 수정은 git에 없고 Vercel 배포본(`dpl_9QmSYY5pDJzELxPHPnxiGZv4j86d`)에만 존재.
- **위험**: 다음에 CD에서 랜딩 zip을 새로 뽑아 풀어덮으면 이 4줄 수정이 사라져 404 재발. CD zip에는 이 수정이 없음.
- **다음 CD 랜딩 작업 시 의무**: zip 적용 후 푸터 약관·개인정보 href가 `https://app.congre.kr/terms`·`/privacy` 절대경로인지 확인. 아니면 재적용.
- **근본 해소 후보**: (a) CD 소스(랜딩 원본)에 이 절대경로를 반영해 zip부터 올바르게, (b) 랜딩 `deploy/`에 `terms.html`·`privacy.html` 추가해 자기 도메인 유지. 미정.
- **관련 결정**: decisions/landing.md 2026-05-31 (12).
- **L 번호 부여 메모**: 사양 원안은 "L7"이었으나 L7(pricing.html Pretendard) 기존 점유 → 전역 일련번호 룰(CLAUDE.md 학습 룰 #2)에 따라 L8 부여.

## 본 앱 환경 (L6)

### L6. 본 앱 로컬 경로 OneDrive 안 — 잠재 격상 트리거 있음

- **현황**: 본 앱 로컬 경로가 `C:\Users\PC\OneDrive\바탕 화면\my-project\congre`. OneDrive 폴더 안에 git 저장소 존재.
- **잠재 리스크**:
  - OneDrive가 `.git/` 동기화 시도하면서 `index.lock` 충돌 가능
  - 한글 폴더명("바탕 화면")이 일부 명령행 도구·환경 변수 호환 이슈
  - Webpack·Next.js 빌드 도중 OneDrive 파일 잠금으로 빌드 실패 사례 보고됨
- **현재 상태**: 운영자가 지금까지 정상 운영. 큰 사고 없음
- **발현 이력**: 2026-05-28 B 트랙 작업 중 `.next` 폴더 OneDrive 잠금으로 빌드 1회 실패 → `rm -rf .next` 후 재빌드로 우회 (세션 중 수 회). 격상 트리거(`npm run build` 간헐 실패) 실제 발현. 반복 빈도 증가 시 OneDrive 외부 이전 검토.
- **격상 트리거**:
  - git 명령이 "index.lock" 에러로 실패
  - `npm run build` 간헐 실패
  - 파일 저장 후 옛 내용이 다른 도구에서 보임
- **격상 시 처리**: OneDrive 외부 폴더로 이전 (예: `C:\projects\congre`)

## 유료 플랜 실수치 (small/medium/large 클립 길이·수 상한) 미정

- **현황**: 2026-05-29 (3) 결정에서 무료 플랜 사양만 공식화 (클립 길이 10초 / 수 10개). 유료 플랜 small/medium/large 실수치는 plans.ts:3~8 초기값(클립 수: small 50, medium 200, large 5000) 그대로 코드에 박혀 있으나 임시값.
- **결정 영역**: 운영자. 가격 산정 + 운영 데이터 모인 후 결정.
- **격상 트리거**: 가격 표시 UI 트랙 진입 또는 영업 진입 직전.
- **관련 결정**: decisions/market-product.md 2026-05-29 (3) 4번, 2026-05-28 (2).
- **2026-05-30 부분 해소**: market-product.md 2026-05-30 (4) 결정으로 유료 플랜 가격·클립 수 확정 (소형 ₩10,000 / 50개, 중형 ₩50,000 / 200개, 라지 별도 문의 / 200+). 잔여: 클립 길이 PLAN_MAX_CLIP_SECONDS 코드 갱신 (decisions/market-product.md 2026-05-30 (6) 트리거).

## 가입 모델 재검토 트랙 (외부 검증 후)

- **현황**: 운영자 의도 = "가입 없이 이벤트 생성 진입 → 완성본 보기·유료 시점에 가입 유도". 본 시점 본 앱은 가입 + 이메일 인증 필수.
- **본 시점 처리**: 외부 검증 진입 = 현 가입 흐름 그대로 유지 (사이클 4 결정).
- **격상 트리거**: 외부 검증 결과 호스트 가입 단계 이탈률 높을 시.
- **변경 영역**: 익명 호스트 토큰 발급 + 임시 이벤트 + 가입 유도 시점 결정 + 유료 흐름과 결합.

## V5 R10 + 가격 UI 일괄 배포 시 사전 검증 단계 누락 영역

- **현황**: 본 세션 일괄 배포 단계에서 zip 안 파일 구조(Landing v6.html, Pricing Section.html 등 신규 파일명) 점검을 진입 전 안내 못 함. 운영자 dir 점검 박은 후 발견.
- **패턴**: CD zip은 deploy 폴더 파일을 직접 갈음 X. 별도 파일명으로 저장됨. 이미 학습 룰 #1 박힌 영역이나 본 세션 또 발현.
- **처리**: 본 세션 핸드오프에 학습 룰 후보로 박음. 다음 세션 본인이 격상 검토.

---

## 1a784d0 회귀 의심 → 미재현 확인 (2026-05-11)

- **현황**: 1a784d0 (커밋 6: branch share URL target by invite content presence) 배포
  직후 일부 이벤트에서 "화면 stuck + 무한 호출" 사고로 보고됨. b98cb2c로 revert.
  이후 4f05a44로 동일 변경 재배포 + 운영자 단독 회귀 테스트 결과 **미재현**.
- **실제 진단**:
  - "무한 호출"은 5초 간격 정상 폴링 (setTimeout(fetchEvent, 5000),
    setTimeout(fetchClips, 5000))의 오진. 호출 빈도만 보고 무한 루프로 단정함.
  - "화면 stuck"은 실재 여부 불명. 무한 호출 오진과 묶여 회귀로 분류됐으나
    재검증 시 Console 깨끗, 화면 정상, 분기 양방향 동작 모두 정상.
- **학습**:
  - fetch 반복 보고 시 첫 질문은 호출 빈도가 아니라 **간격**. 5초·30초·1초
    어느 쪽이냐로 정상 폴링/실제 루프 즉시 갈림.
  - 사고 보고 두 가지가 동시 발생했을 때 한 원인으로 묶기 전에 각 현상의
    독립성 먼저 검증.
  - 검증 안 된 사고 보고는 가설로 표시. revert 결정의 근거가 다른 오진과
    묶여 있는지 점검.
- **관련 커밋**: 1a784d0, b98cb2c, 4f05a44
- **관련 핸드오프**: docs/handoff/2026-05-11-pr9-cont2.md
