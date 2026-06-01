# Decisions — Data Flow

> Firestore·S3·Admin SDK·서버 이전 관련 결정. 새 결정은 맨 위에 추가 (최신이 위).

## 2026-06-01 — 게스트 공개 API에서 호스트 이름 1개 필드만 노출, 다른 PII 비노출 원칙

### 결정

게스트 업로드 화면이 받는 `GET /api/events/[eventId]?token=...` 응답에 호스트 이름(`hostName`) 1개 필드만 추가. users 컬렉션의 다른 필드(`email`, `phone`, `createdAt`, `termsAgreedAt`, `privacyAgreedAt`)는 절대 노출 안 함.

### 배경

- 본 엔드포인트는 sessionToken만 있으면 로그인 없이 열리는 공개 엔드포인트. 게스트(참가자)가 진입하는 첫 화면이 fetch 함.
- 게스트 화면 uploader 단계 문구에 "{호스트}님과 함께 만드는 {행사명} 영상입니다" 형태로 호스트 이름을 노출하기로 결정 → 응답에 이름 필요.
- 호스트 displayName은 events 문서에 박혀 있지 않고 `users/{hostId}.name`에만 있음 (auth-model 2026-05-19 v2 가입 흐름).

### 사양

- `events.hostId` → `users/{hostId}` Admin SDK 조회 → `name` 필드만 추출.
- `name`이 string이고 trim 후 비어 있지 않으면 그대로, 그 외(users 문서 부재 / 옛 계정 / 빈 이름)에는 `null` 반환.
- users 조회 실패는 `console.error("[events GET] host name lookup failed:", err)` 남기고 `hostName: null`로 정상 응답 진행 (이름 못 가져와도 업로드는 가능해야 함).
- 클라이언트는 `hostName || "호스트"` fallback으로 두 곳(인사 문장·길이 안내 문장) 동일 변수 사용.

### 원칙 (재발 방지)

본 결정으로 "게스트 공개 API는 호스트 이름 1개 필드만 노출" 명시. 향후 본 엔드포인트 또는 다른 sessionToken 기반 게스트 API에 필드 추가 시 PII 비노출 원칙을 우선 검토. email·phone·생년월일 등은 게스트가 알 필요 없음.

### 변경 영역

- `src/app/api/events/[eventId]/route.ts` — users 조회 try/catch 블록 + `hostName` 응답 필드 추가
- `src/app/upload/[eventId]/page.tsx` — event 상태 타입에 hostName, hostDisplay fallback, uploader 첫 방문 문구 교체

## 2026-05-28 — 리드 폼 API = 본 앱 /api/lead 재사용 (옵션 2) + CORS

- **결정**: 가격 페이지 폼 백엔드를 별도 함수 신설 대신 본 앱(`congre-three`)의 신규 API route `POST /api/lead`로 구현(옵션 2). 랜딩(`congre.kr`)에서 cross-origin 호출.
- **CORS**: 허용 origin `["https://congre.kr", "https://www.congre.kr"]` 요청 origin 반사 + `Vary: Origin`. (apex는 307→www, www가 메인이라 둘 다 허용)
- **코드 위치**: `src/app/api/lead/route.ts` (신규). `emailChannel.send()` 어댑터 재사용.

## 2026-05-21 — D2 사양 재작성 (B5 결정 반영)

### 배경

2026-05-09 D2 원본 본문 = "서브컬렉션 `events/{eventId}/renders/{renderId}` 전환, 재렌더 무제한 무료 안전망". 2026-05-21 B5 결정 (market-product.md 참조)에서 재렌더 매번 유료 채택 → D2 전제(무제한 무료 안전망) 더 이상 유효 아님.

### 재작성된 결정

#### 완성본 보존 구조

기존 결정과 동일: `events/{eventId}/renders/{renderId}` 서브컬렉션. 단일 `videoUrl` 필드 덮어쓰기 폐기.

#### 보관 기간

- 모든 완성본: 완성 시점부터 **7일**
- 매일 1회 cron 일괄 삭제 (현재 `/api/cron/cleanup` 확장)
- 매 문서별 정확한 만료 시간 추적 안 함 — cron 실행 시점에 `completedAt + 7d < now` 조건으로 일괄 처리

#### 호스트 다중 완성본 보유

재렌더 매번 결제 → 호스트당 N개 완성본 동시 보존 가능. 호스트는 N개 모두에서 다운로드·공유 가능.

#### 삭제 멱등성

기존 cleanup cron의 `videoDeletedAt` 마커 패턴 유지. 서브컬렉션 문서별로 동일 마커 적용.

### 본 결정으로 영향받는 영역

- `src/app/api/cron/check-rendering/route.ts` — 단일 `videoUrl` 필드 덮어쓰기 폐기, 서브컬렉션 신규 문서 생성으로 전환
- `src/app/api/cron/cleanup/route.ts` — 서브컬렉션 순회 + 만료 문서 삭제 로직 추가
- `src/lib/events.ts` — CongreEvent 인터페이스에서 `videoUrl` 필드 제거 또는 호환 영역 짚어둠
- `src/app/dashboard/events/[eventId]/page.tsx` — done 상태 UI에서 최신 1개 → N개 목록 표시
- `src/app/share/[eventId]/page.tsx` — 공유 페이지에서 어느 완성본 보여줄지 결정 필요 (최신? 첫? 호스트 선택?)

### 본 결정에 미포함 — 다음 결정 영역

- 서브컬렉션 필드 스키마 상세 (renderId, completedAt, videoUrl, renderCost 등)
- 공유 페이지 다중 완성본 노출 방식 (드롭다운? 최신만?)
- 기존 events 문서의 videoUrl 필드 마이그레이션 (있는 데이터 어떻게 처리?)

### 본 결정 진입 시점

S4-09 본격 진입 시. S3-05·S3-06·S3-07·S3-08 (결제 코드) 완료 후가 자연 순서.

---

## 2026-05-11 — 초대장 이미지도 클립과 동일한 presigned GET URL 패턴 사용

- **결정**: `events.coverImageUrl`, `events.galleryUrls` 필드에 공개 URL 대신 S3 키(path) 저장. 표시 시점에 presigned GET URL(1시간 만료)로 변환.
- **이유**:
  - S3 버킷 기본 설정("Block all public access" 활성화) 유지. 버킷 정책 변경·ACL 추가 없이 동작.
  - 클립 영상(presigned GET, 1시간)과 동일 패턴 → 코드 일관성.
  - 공개 URL(`url.split('?')[0]`) 방식은 버킷 비공개 정책으로 403 반환 확인.
- **구현**:
  - 대시보드: `GET /api/host/events/[eventId]/invite-urls` 신설 → presigned GET URL 반환.
  - `/invite` SSR: 서버 컴포넌트 내부에서 `GetObjectCommand` + `getSignedUrl`로 직접 변환.
  - `generateMetadata` OG 이미지도 동일 변환 적용.
- **대안 검토**:
  - ACL `public-read` 추가: Block public access 비활성화 필요, 버킷 정책 변경 → 기각(인프라 변경 최소화).
  - CloudFront 배포: 오버엔지니어링 → 기각.
  - 공개 URL 직접 저장: 버킷 비공개 정책으로 403 → 기각.

## 2026-05-10 — 닉네임 재사용 정책 폐기 + 식별 키를 이름+전번 복합으로 전환 (PR 1)

- **결정**: 2026-05-09 "닉네임 재사용 정책 변경: '한 닉 = 한 영상' 정식 채택" 폐기. 식별 키를 `eventId + uploaderPhone + uploaderName` 복합으로 변경.
- **중복 정책**:
  - 다른 전번 → 통과
  - 같은 전번 + 다른 이름 → 통과 (친구 폰 돌려쓰기)
  - 같은 전번 + 같은 이름 → 차단
- **에러 코드**: DUPLICATE_NICKNAME → DUPLICATE_UPLOADER
- **이유**: 2026-05-09 "참가자 입력 사양 변경: 닉네임 → 이름+전화번호" 결정으로 닉네임 자체가 폐기되어 닉 재사용 정책의 전제가 사라짐. 사양 모순 정합화.
- **organizerPhone 검증 추가**: `/^010\d{8}$/` (uploaderPhone과 동일 규칙). 숫자만 허용.
- **uploaderPhone 입력 UX**: 사용자 자유 입력(하이픈 허용) → 클라이언트 정제 후 검증. organizerPhone과 비대칭이지만 운영자(1회 입력) vs 참가자(현장 수기) 차이로 의도된 비대칭.
- **참가자 결과 SMS 멱등성**: `events.notifications.participantNotifiedAt` (기존 notifications.* nested 패턴, PR 2에서 구현 예정).
- **대안 검토**:
  - 닉네임 사양 유지: 시스템 자동 SMS 발송 불가 → 기각.
  - 평면 `events.participantNotifiedAt`: 기존 notifications.* 패턴과 부정합 → 기각.

## 2026-05-09 — 참가자 입력 사양 변경: 닉네임 → 이름 + 전화번호

- **결정**: 참가자 업로드 시점에 **이름 + 전화번호** 입력 받기. 닉네임 사양 폐기. 시장 분기 없이 졸업식·결혼식·기업 행사 등 모든 시장 통일 사양.
- **이유**:
  - 호스트가 참가자에게 결과물을 전달할 시스템적 식별자가 필요. 닉네임만으로는 시스템 자동 발송 불가 — 호스트가 단톡방·SNS 게시로 우회해야 함.
  - 운영자 모델: 렌더 완료 시 시스템이 모든 참가자 SMS로 직접 알림 발송 (`notifyParticipantResult` — 현재 dead code, 연락처 수집 후 활성화).
  - 이름이 닉네임 역할 대체 — 호스트 측 클립 식별. 결혼식·졸업식 시장에서 자동 식별 정합.
  - 시장 통일 사양 = 운영 단순함 + 코드 단순함.
- **대안 검토**:
  - 닉네임만 (현재 사양): 시스템 자동 발송 불가 → 기각.
  - 시장별 분기 (졸업식은 닉네임, 결혼식은 이름+연락처): 운영·코드 복잡도 증가 → 기각.
  - 이메일만: 도달성 약함 (네이버 메일 known-issues 메모, 시청률 미검증) → 기각.
  - 전화번호만 (이름 없음): 호스트 측 클립 식별자 부재 → 기각.
- **시장별 함의**:
  - 졸업식 1순위 시장 (미성년자): 부모 동의 절차 + 개인정보 처리방침 격상 필요. D4 법무 영역.
  - 결혼식 시장: 차단형 선제조건 C7 해소.
  - 노인 안부 시장 (B2G): 별도 BM이라 본 사양 외 추가 검토 필요.
- **구현 영향 (정찰 안 됨, 추정)**:
  - 업로드 페이지: nickname stage → name + phone stage
  - POST /api/clips: uploaderName + uploaderPhone 받기
  - Firestore clips 컬렉션: phone 필드 추가
  - 호스트 대시보드: 닉 → 이름 표시
  - `notifyParticipantResult`: dead code 활성화 + cron 호출 연결
  - 참가자 SMS 템플릿 신규
  - 시청 페이지 신규 (다운로드는 호스트만)
- **작업 시점**: 필드 테스트 첫 회차 후. 연락처 수집 = 개인정보 처리방침 격상 + 법무 검토(D4) 병행 필요. P2 수준.

## 2026-05-09 — share 페이지 신설: URL 구조·데이터 취득 갈래·카톡 공유 링크 변경

- **결정**:
  - `/share/{eventId}` 공개 공유 페이지 신설. 인증 없음. 호스트·게스트 동일 화면.
  - 데이터 취득: D-1(SSR 서버 컴포넌트) 채택 — `getAdminDb()`로 events 직접 read, `generateMetadata`로 og 태그 렌더.
  - 호스트 대시보드 카톡 공유 `link.webUrl` / `link.mobileWebUrl`: `event.videoUrl`(cdn.shotstack.io) → `${NEXT_PUBLIC_APP_URL}/share/${eventId}`.
  - 카톡 공유 `imageUrl`: `event.videoUrl` → `${NEXT_PUBLIC_APP_URL}/logo.png` (운영자 `public/logo.png` 업로드 예정).
  - 공유 버튼(카톡·링크복사)은 `ShareActions.tsx` 클라이언트 컴포넌트로 분리. 대시보드 버튼은 추출 리팩토링 하지 않고 인라인 유지(YAGNI).
  - 상태별 화면 분기: `status === "done" && videoUrl 있음` → 영상 재생 + 공유 버튼 / 그 외 → "영상 준비 중" 안내 / doc 없음 → `notFound()`.
- **이유**:
  - 카카오 피드 공유의 `link.webUrl`은 카카오 콘솔에 등록된 도메인이어야 함. 기존 코드가 `cdn.shotstack.io`를 직접 넣어 "자세히 보기" 클릭 시 카카오 초기화면으로 fallback. congre 자체 도메인 URL이 필요해 공유 페이지 신설.
  - D-1(SSR) 채택 이유: `generateMetadata`로 og:title/og:image를 서버에서 렌더해 카톡 링크 미리보기 카드(제목·썸네일) 지원. D-2(클라이언트 fetch)는 og 태그 렌더 불가.
  - `public/logo.png` 별도 업로드 예정 — 파일 없어도 빌드 통과. og:image fetch 실패는 카카오 측 처리에 위임.
- **대안 검토**:
  - 갈래 A (cdn.shotstack.io를 카카오 콘솔에 임시 등록): Shotstack 제3자 도메인을 콘솔에 등록하는 형태 → 영구 의존 + 도메인 변경 시 재발 → 기각.
  - D-2 (API 라우트 + 클라이언트 컴포넌트): og 태그 불가, 파일 2개 신설 → 기각.
  - 공유 버튼 컴포넌트 추출 리팩토링: 대시보드 인라인 코드 변경 범위 증가, 이번 작업 필요 범위 아님 → YAGNI, 기각.

## 2026-05-09 — 닉네임 재사용 정책 변경: "한 닉 = 한 영상" 정식 채택

- **결정**: 같은 날(2026-05-09) 등록된 의제 15 결정("하나 더 올리기" 시 sessionStorage 자동 재사용 + nickname stage 건너뛰기)을 변경. "하나 더 올리기" 시 nickname stage로 직행하여 사용자가 새 닉을 입력해야 진행되도록 함. 이전 닉은 sessionStorage에서 인풋에 미리 채우되 같은 닉으로는 통과 못 함 (의제 16 "한 행사 안에서 닉네임 영구 고유" 정책 적용).
- **변경 사유**:
  - 의제 15와 의제 16의 사양 모순 발견 — 의제 15는 같은 사용자가 같은 닉으로 N개 영상 올리는 흐름, 의제 16은 한 행사 안 닉 고유. 두 사양이 충돌함.
  - 운영자 사용 시나리오 검토 — 호스트가 "민준 3번째 영상만 쓰자" 같은 식별·정리 작업 시, 닉이 영상별로 고유해야 정확. 같은 사람이 여러 영상 올리려면 "민준 1", "민준 2" 등 의미 부여 식별자가 호스트 사용성과 정합.
  - 핫픽스 시점 발견된 사용성 사고 — 직전 구현은 "하나 더 올리기" 후 카메라까지 거친 뒤 업로드 시점에 차단되어 사용자 마찰. nickname stage 직행으로 사고 시점 앞당겨 명확화.
- **사양 상세**:
  - reRecord 함수: done → idle이 아닌 done → nickname으로 직행
  - nickname stage 재진입 식별: sessionStorage에 닉이 있으면 재진입으로 판단
  - 재진입 안내: "이전 닉네임은 이미 사용됐어요. 새 닉네임을 입력해주세요. (예: 민준 2, 민준 한마디 더)"
  - 인풋 미리 채움: 이전 닉을 인풋 초기값으로 (사용자가 수정 시작점으로 활용)
- **호스트 사용성 함의**: 호스트 대시보드 클립 목록의 닉네임이 영상별 고유 식별자가 됨. 같은 사람이 여러 영상 올린 경우 호스트는 닉으로 정확히 어떤 영상인지 식별 가능.
- **자체 학습**: 의제 15·16 결정 시점에 두 의제 간 충돌을 짚지 못함. 다음 사양 결정 시 결정된 의제들끼리 충돌 가능성 점검 단계 추가.
- **대안**:
  - sessionStorage 자동 재사용 유지 + 서버 검증 약화: 의제 16 위반 → 기각.
  - 자동 suffix ("민준 2" 자동 생성): 의제 16 결정 시점에 한 번 기각된 옵션. 사용자 예상 못한 이름 → 기각.
  - "하나 더 올리기" 흐름 자체 제거: UX 마찰 큼 → 기각.

## 2026-05-09 — 완성본 보존 정책 (D2): 7일 보관, 서브컬렉션, 이전 버전 섹션 UI

- **결정**:
  - 데이터: 완성본을 7일 보관. 서브컬렉션 `events/{eventId}/renders/{renderId}` 구조로 보존. 단일 필드 `events.videoUrl` 덮어쓰기 구조에서 전환.
  - 알림: D-1 시점에 이메일 + SMS 발송. 각 영상마다 개별 발송.
  - UI: 최신본을 메인 영역에 표시 (현재 단일 영상 UI 유지). 화면 아래쪽에 "이전 버전" 섹션 추가. N개 카드로 나열, 각 카드에 생성 시각 + 삭제 예정 시각 표시. 카드 클릭 시 메인 영역에 해당 버전 재생 + 다운로드/공유/링크복사 버튼이 그 버전 대상으로 전환.
- **이유**:
  - 재렌더 무제한(D1) 정책의 안전망. 사용자 안심 + 직전 학습("발생 시 복구 불가능 = 비용 큼")의 적용.
  - 서브컬렉션 선택 이유: (a) 재렌더 무제한이라 배열이 길어질 수 있음, (b) 각 렌더의 메타데이터(포함 클립, 인트로/아웃트로 텍스트)를 함께 저장 시 디버깅 가치 큼, (c) Firestore 단일 문서 1MB 한도 회피.
  - UI 옵션 선택 이유: D2의 핵심 가치는 "재렌더 후 이전 백업이 7일 살아있다는 안심". 안전망 가시성과 메인 흐름 단순성을 둘 다 잡는 구조.
  - 카드 클릭으로 메인 끌어올리기: 별도 액션 버튼 없이 단일 인터랙션. UI 단순 유지.
- **1차안 제외** (필드 테스트 후 결정): 카드에 포함 클립 수 표시, 클립 목록 펼치기. 사용자가 "어떤 버전인지 모르겠다"고 말할 때 격상.
- **대안**:
  - 단일 필드 + 이전 N개 별도 필드: 무제한 재렌더 모델과 부정합 → 기각.
  - 모든 버전 동등 카드 그리드: 1개 그리드 어색 + 메인 미리보기 사라짐 → 기각.
  - 이전 버전 드롭다운 숨김: D2 핵심 가치(안전망 가시성) 약화 → 기각.

## 2026-05-06 — Phase B-3 2단계 완료: events/clips Admin SDK 전용 전환

- **결정**: 대시보드의 Client SDK 실시간 구독 3개(subscribeToHostEvents, subscribeToEvent, subscribeToClips)를 서버 API polling으로 전환. Firestore rules에서 events/clips의 read를 `if false`로 잠금하여 Admin SDK 전용 경로로 통일. 권한 종류가 다른 라우트는 `/api/host/...` prefix로 분리.
- **이유**:
  - PII(sessionToken, organizerEmail 등) 노출을 클라이언트 SDK 의존에서 분리해 서버에서만 필터링 가능.
  - 인증 종류가 다른 케이스(호스트 Bearer vs 참가자 token)는 endpoint를 분리하는 게 OWASP 권장. 한 endpoint에서 인증 종류 분기 시 PII 노출 분기 사고 위험.
  - Polling 5초 + 탭 숨김 시 중단 + visibilitychange 복귀 시 재시작으로 실시간성 큰 손실 없이 보안 표면 축소.
- **대안 검토**:
  - SSE: Vercel 함수 800s 한도 + 재연결 루프 부담 + Vercel docs 권장 사용처 아님 → 기각.
  - 한 endpoint에서 Bearer 유무로 분기 (B 옵션): 분기 실수 시 PII 노출 사고 위험 → 기각.
- **관련 커밋**: 40bc970 (GET /api/events), 0a501b7 (/api/host/events/[eventId] + /api/host/clips), de6551b (/api/render/start eventId 기반), a701572 (대시보드 polling 전환), b2f618d (firestore.rules 잠금 + production 배포).

## 2026-05-03 — Firestore Admin SDK에 ignoreUndefinedProperties: true 적용

- **결정**: `firebase-admin.ts`의 `getAdminDb()`에서 db 인스턴스를 캐싱하고, 최초 1회 `db.settings({ ignoreUndefinedProperties: true })` 호출 (A안). commit: bcfe1f3
- **컨텍스트**: `notifications` 컬렉션 저장 시 `error`, `providerMessageId` 등 optional 필드가 `undefined`인 채로 전달되어 Firestore가 거부. 발송 자체는 성공해도 이력이 누락됨.
- **대안 검토**:
  - A안: Admin SDK 전역 `ignoreUndefinedProperties: true` **(선택)** — 공식 권장 방식. 이후 다른 컬렉션 쓰기에서도 동일 문제 예방
  - B안: `history.ts` 저장 직전 `undefined` 필드 제거 — 로컬 패치라 향후 다른 컬렉션에서 재발 위험
- **안전성 검토**: 코드베이스 전체 `: undefined` 의도적 사용 0건(grep 확인) — 부작용 없음.
- **구현 주의**: `settings()`는 인스턴스당 1회만 허용. `_db` 변수로 인스턴스 캐싱 후 조건부 호출.

## 2026-05-02 — 마감 처리(closeEvent)를 서버 API로 이전

- **결정**: 이벤트 마감을 클라이언트 SDK 직접 쓰기 대신 `POST /api/events/[eventId]/close`로 처리.
- **이유**: 클라이언트에서 Firestore에 직접 쓰면 인증 토큰이 있어도 "요청자 == 주최자" 서버 검증이 불가능함. 서버 이전으로 hostId 비교 + 403 반환이 가능해짐. 이로써 모든 이벤트 상태 변경이 서버 사이드 경로로 통일됨.
- **대안**: Firestore 규칙에서 `request.auth.uid == resource.data.hostId` 조건 — 규칙 관리 복잡도 증가, 서버 로직과 이원화.

## 2026-05-02 — Firestore Rules를 로컬 파일로 관리

- **결정**: `firestore.rules`를 프로젝트 루트에 두고 Git으로 변경 이력 추적. `firebase.json` + `.firebaserc`(프로젝트: congre-mvp)로 Firebase CLI 연동.
- **이유**: 콘솔에서만 관리하면 변경 이력이 없어 언제 어떤 규칙이 적용됐는지 알 수 없음. 코드 리뷰와 PR 흐름에 보안 규칙 변경을 포함시키기 위함.
- **배포 방법**: `firebase deploy --only firestore:rules` (Firebase CLI 필요 — `npm install -g firebase-tools`)
- **대안**: Firebase 콘솔에서 직접 관리 — 추적 불가.

## 2026-05-01 — firebase-admin 도입

- **결정**: 서버 측 인증/Firestore 접근에 firebase-admin 사용. 첫 적용 지점은 클립 재생 API.
- **이유**: 푸시 알림(FCM), 결제 webhook 검증, 권한 분기 등에서 어차피 필요. 보안 표면을 클라이언트 SDK에만 의존하지 않게 됨.
- **대안**: 인증 없이 short-lived URL만으로 운영 — 단기적으로 가능하나 운영 기능 확장 시 한계.
