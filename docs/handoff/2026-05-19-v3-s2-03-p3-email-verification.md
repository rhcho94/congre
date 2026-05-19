# 핸드오프 — 2026-05-19 v3 S2-03 P3 이메일 인증 차단 흐름

## 세션 한 줄 요약

S2-03 P3 (이메일 인증 차단 흐름) 본 세션 진입. P3a (보안 규칙 + 배너
+ UI 차단) + P3b (custom action URL + /verify-email 페이지) 완료
→ 운영자 실측 검증 통과 → Gmail 스팸함 사고 발견 → 외부 자료 조사
+ P3d (Firebase custom domain) 신설 → 가비아 DKIM 등록 거부 사고
2건 + 운영자 정정 → 루트 도메인 `congre.kr`로 확정 → DNS 4건 등록
완료 → **검증 대기 중 (1~48시간)**. P3c (docs 끝물) 미완. 본 세션
사고 패턴 4건 + 룰 학습 영역.

## 본 세션 커밋 (2건, 모두 CC)

| # | 해시 | 메시지 | 변경 |
|---|---|---|---|
| 1 | bada6d0 | feat(auth): block event creation for unverified email | 4 files (+~110/-9) |
| 2 | 08be31f | feat(auth): custom email verification action handler | 3 files (+~117/-2) |

origin/main 반영 완료.

운영자 콘솔 작업:
- Firebase Firestore Rules 게시 (bada6d0 보안 규칙 반영)
- Firebase Authentication Templates 액션 URL 설정 (08be31f 적용)
- Firebase Authentication custom domain `congre.kr` 신청
- 가비아 DNS 레코드 4건 등록 (TXT 2건 + CNAME 2건)

본 세션 채팅 클로드 본인 산출물 (커밋 외):
- 본 핸드오프 — present_files로 운영자 공유 예정

---

## Track A — 진입 + 두 핸드오프 교차 검증

### 진입점

운영자 트리거: "S2-03 P3 (이메일 인증 차단 흐름)". 직전 v2 핸드오프
다음 세션 후보 1순위 영역.

### 본인 시야 한계 명시

자동 첨부 4개(CLAUDE.md, AGENTS.md, DECISIONS.md 인덱스,
known-issues.md) + 운영자 첨부 1개(05-19 v1 핸드오프 = iOS 480p)만
가진 상태로 진입. 운영자가 v2 핸드오프 파일도 첨부했으나 컨텍스트엔
본문 없이 경로만. 본인이 view로 직접 읽음.

### 두 핸드오프 교차 검증 결과

| 항목 | iOS 480p | S2-03 P1+P2 | 정합 |
|---|---|---|---|
| 다음 진입점 | "S2-03 P1" (회귀 없으면) | "S2-03 P3" | ✅ 시계열 정합 |
| 운영자 진입 트리거 | "S2-03 P3" | "S2-03 P3" | ✅ |

다만 명시한 모르는 영역 3건:
1. S2-03 v2 끝물 5건(C1~C5) 실 처리 여부 — 자동 첨부 CLAUDE.md에
   신규 룰 2건 누락 확인됨 (C4 미처리 추정)
2. launch-roadmap.md P3 사양 본문 — 운영자 PC 파일
3. 현재 firestore.rules 본문 — P3 사양에 필수

### 선행 정찰

운영자 선택 "둘 다 (정찰 + 사양 본문 첨부)"로 진입. CC 정찰 + 운영자
launch-roadmap 첨부 동시 진행. 다만 CC가 정찰 프롬프트 대신 다른
프롬프트(v2 끝물 5건 실행 추정) 실행 → 검증 표 0단계로 발견. 이는
운영자 영역 (다른 프롬프트 사용)으로 분류. CC가 작업 결과 03f40b4
커밋 보고. C1~C5 영역 모두 처리됨 확정 (다만 본인이 view로 직접
검증 안 함, CC 보고 표 신뢰).

### firestore.rules 별도 정찰

본인이 2건 정찰 프롬프트 1건 추가 — `view firestore.rules`. CC 정찰
결과로 현 본문 회수:

```
match /events/{eventId} {
  allow read: if false;
  allow create: if request.auth != null
                && exists(/databases/$(database)/documents/users/$(request.auth.uid));
  ...
}
```

→ events create에 옵션 B(users doc exists)만 들어간 상태. P3에서
옵션 C(email_verified == true 추가)로 격상 영역 확정.

---

## Track B — 외부 자료 조사 + 사양 갈래 결정

### 첫 사양 (외부 자료 조사 없이)

본인이 4갈래 결정 영역 제시:
- 차단 범위 (A/B/C)
- UI 차단 위치 (a/b/c)
- 인증 메일 재발송 UX (α/β/γ)
- 인증 완료 감지 (i/ii/iii)

운영자가 4갈래 모두 본인 추천대로 결정 (B+b+α+i+ii).

**본인 사고 패턴 #1 — 외부 자료 조사 누락**: 운영자 한 마디로 짚힘:
"이런 이메일 인증같은 기능은 거의 모든 앱에서 채택하고 있는
기능일거야. 이미 수많은 성공 케이스가 있을거고, 관련 문서도 많을테니,
앞으로 할일들 범위를 좀 넓혀서 관련 자료를 넓고 깊게 검색해봐."

본인 학습용 한 줄: **표준 패턴 영역(가입·인증·결제 등)은 사양 갈래
짜기 전에 외부 자료 조사가 0단계**.

### 외부 자료 조사 결과

운영자 트리거로 4회 검색:
1. Firebase email verification UX 패턴
2. sendEmailVerification rate limit
3. onAuthStateChanged emailVerified 감지
4. actionCodeSettings continueUrl

**핵심 발견**:
- ✅ Quora UX 권장: Progressive verification (강제 차단 ≠ 권장). 운영자
  결정 갈래 b 정합
- ✅ Firebase 공식 SDK 한계 — onAuthStateChanged가 emailVerified 변화
  감지 못 함. 표준 우회 = polling 또는 manual reload. 운영자 결정 i+ii
  정합
- ⚠️ Firebase 공식 custom email action handler 패턴 — Custom action
  URL로 인증 메일 본문 링크를 우리 도메인 `/verify-email`로 받음. 본인
  첫 사양에 없었던 영역
- ✅ Firebase rate limit — 정확한 frequency 공개 안 됨. 60초 카운트다운
  표준 패턴

### Custom action URL 도입 결정 (P3b 신설)

운영자 옵션 1(continueUrl 경유) vs 옵션 2(콘솔 액션 URL 자체 교체)
중 **옵션 2 선택** — UX 매끈러움 영역.

이로 인해 P3 작업이 2단계로 분리:
- **P3a**: 보안 규칙 + 배너 + UI 차단 (단일 atomic)
- **P3b**: actionCodeSettings + /verify-email + 콘솔 Templates 설정

---

## Track C — P3a 실행

### 사전 정찰 (변경 영역 5개 파일)

본인 선택 ① "정찰 먼저". CC 정찰 결과로 본인 사전 추정 2건 어긋남:

| 본인 추정 | 실측 | 학습 |
|---|---|---|
| 이벤트 생성 위치 = host/page.tsx create 뷰 | 실제 = /dashboard/create 별도 페이지 (host create 뷰는 **dead code**) | 직전 v2 정찰 회수 본문을 그대로 단정 사용 금지 |
| sendEmailVerification 호출 위치 = signup/page.tsx | 실제 = lib/auth.ts line 34 (inner try/catch 방어됨) | 본인이 본 적 없는 영역에서 단정 |

**본인 사고 패턴 #2 — 직전 세션 정찰 회수 정보 단정 사용**. 본인 학습용
한 줄: **직전 세션 정찰 회수 정보를 그대로 단정 사용 금지. 본인이
본 적 없는 영역은 본인이 본 적 없음**.

### CC 정찰 추가 발견 (사양 영향)

1. emailVerified 체크 진입점 — dashboard/page.tsx subscribeToAuthChanges
   콜백에 통합 가능 (useEffect 추가 안 함)
2. 이벤트 생성 차단 두 군데 가능 (dashboard + dashboard/create)
3. **host/page.tsx dead code** (3뷰 중 2뷰) — known-issues 등재 후보

운영자 결정:
- 배너 노출: 1곳 (dashboard/page.tsx만)
- host/page.tsx dead code: 본 세션 끝물 묶음 처리 (known-issues 등재)

### 실행 (커밋 bada6d0)

4개 파일 변경:
1. `firestore.rules` — events create에 `email_verified == true` 1줄 추가
2. `src/components/EmailVerificationBanner.tsx` — 신규 (재발송 +
   reload + 60초 카운트다운)
3. `src/app/dashboard/page.tsx` — 배너 통합 + 버튼 disabled 분기 +
   subscribeToAuthChanges 콜백에 user.reload() 추가
4. `src/app/dashboard/create/page.tsx` — 미인증 redirect

빌드 PASS. 운영자 콘솔 게시 (Firestore Rules) → 실측 검증 6단계 모두
통과.

### CC 보고 표 숫자 의외값 (P3a + P3b 반복)

- P3a EmailVerificationBanner: 보고 표 85줄 vs Write 보고 106줄 (21줄 차이)
- P3b auth.ts: 보고 표 +4줄 vs diff +5줄 (1줄 차이)
- P3b Banner.tsx: 보고 표 +4줄 vs diff +5줄 (1줄 차이)
- P3b verify-email: 보고 표 102줄 vs Write 109줄 (7줄 차이)

**본인 사고 패턴 #3 — CC 보고 표 숫자 검증 누락 반복**: P3a에서
의외값 발견했으나 본인이 짚지 않고 넘김 → P3b에서도 같은 패턴 반복.
**검증 표 0단계 짚는 의식 미달**.

본인 학습용 한 줄: **CC 보고 표 숫자는 본인이 한 번 더 diff/Write
출력과 대조해야 결정타. 룰 격상 안 함 (기존 CLAUDE.md "보고 시 숫자
검증" 룰로 커버), 본인 검증 표 0단계 의무 강화 영역**.

---

## Track D — P3b 실행

### 실행 (커밋 08be31f)

3개 파일 변경:
1. `src/lib/auth.ts` — actionCodeSettings 적용
2. `src/components/EmailVerificationBanner.tsx` — 재발송 호출에 동일
   actionCodeSettings 적용
3. `src/app/verify-email/page.tsx` — 신규 (oobCode 추출 →
   applyActionCode → 성공 시 자동 redirect to /dashboard)

Suspense 분리 정합 (useSearchParams 요구). 빌드 PASS, /verify-email
25번째 라우트 생성.

운영자 콘솔 Templates 액션 URL 설정 → 실측 검증 5단계 통과.

---

## Track E — Gmail 스팸함 사고 + P3d 신설

### 사고 발현

운영자 실측 보고: "구글메일인데, 바로 스팸함으로 감. 다른 기능은 모두
정상 통과"

### 외부 자료 조사

본인이 검색 1회로 결정타 회수:
- 원인: Firebase 기본 발송 도메인(`noreply@congre-mvp.firebaseapp.com`
  추정) 평판 ↓
- 공식 해결책: Firebase Authentication > Templates > "customize domain"
  → DNS TXT + CNAME 추가 → 최대 24h 검증 → "Apply Custom Domain"
- 외부 자료 본문: <https://firebase.google.com/docs/auth/email-custom-domain>

### P3d 신설

운영자 옵션 A(즉시 처리, 본인 추천) vs B(보류) vs C(SMTP) 중 **A 선택**.
서브도메인 후보 운영자 결정: `auth.congre.kr` (본인 추천, 인증 전용).

### 가비아 DKIM 등록 사고 #1 (auth.congre.kr 점 2개)

Firebase가 준 DNS 레코드:
- TXT `auth.congre.kr` (점 1개) — 등록 OK
- CNAME `firebase1._domainkey.auth.congre.kr` (점 2개) — **거부**.
  에러: "호스트에는 점(.)은 하나만 입력할 수 있습니다"

### 본인 가설 단정 사고 (반복)

본인이 가설 A·B 단정:
- 가설 A: "가비아가 다단계 서브도메인 지원 안 함" → ❌
- 가설 B: "한 도메인 zone당 한 단계 깊이까지만" → ❌

**운영자 정정**: ".congre.kr 앞에있는 값에 .이 두개면 않된다는 말임".
실제 = 가비아 호스트 칸이 점 1개까지만 허용. 즉 `auth` 또는
`firebase1._domainkey` 같은 점 1개는 OK, `firebase1._domainkey.auth`
같은 점 2개는 거부.

**본인 사고 패턴 #4 — 외부 자료 조사 안 한 영역에서 가설 단정**:
첫 사고에서 본인이 "본인 시야 외"로 떠넘김 → 운영자 한 마디 "이것도
다 남들 하는 방법이 당연히 있을 거야. 찾아봐"로 짚힘.

본인 학습용 한 줄: **표준 영역(Firebase custom domain + 한국 도메인
등록처)은 사례 많음. "본 적 없음"이 외부 자료 조사 안 한 영역
명시 ≠ 결정 못 함. "본 적 없음"은 검색 안 한 사고 영역**.

### 외부 자료 조사 2회로 결정타 회수

- Firebase 공식 본문 확인: **apex domain 또는 subdomain 둘 다 지원**
  ("this domain can be an apex domain or subdomain")
- 가비아 호스트 칸 점 1개 제한은 외부 사례에서 일관 확인 (다단계 항상
  점 1개로 처리)
- Cloudflare 이전 옵션도 가비아 공식 매뉴얼이 직접 안내

### 옵션 B 확정 (루트 `congre.kr` 사용)

운영자 결정. Firebase 콘솔 재설정 → 새 DNS 레코드 표:
- TXT `congre.kr` (점 0개 = `@`) v=spf1 include:_spf.firebasemail.com ~all
- TXT `congre.kr` (점 0개) firebase=congre-mvp
- CNAME `firebase1._domainkey.congre.kr` (점 1개) — 가비아 OK
- CNAME `firebase2._domainkey.congre.kr` (점 1개) — 가비아 OK

운영자 가비아 4건 등록 완료. **현재 DNS 검증 대기 중 (1~48시간)**.

---

## 본 세션 사고 패턴 4건 종합

| # | 패턴 | 발현 | 학습 |
|---|---|---|---|
| 1 | 외부 자료 조사 0단계 누락 | P3 첫 사양 짤 때 | 표준 패턴 영역은 사양 갈래 짜기 전 외부 자료 조사 |
| 2 | 직전 세션 정찰 회수 정보 단정 사용 | P3a 변경 영역 추정 (2건 어긋남) | 본인이 본 적 없는 영역은 본인이 본 적 없음 |
| 3 | CC 보고 표 숫자 검증 누락 (P3a + P3b 반복) | 4건 의외값 발견 | 검증 표 0단계 의무 강화 |
| 4 | 외부 자료 조사 안 한 영역에서 가설 단정 (가비아 사고) | 가설 A·B 둘 다 운영자 정정 | "본 적 없음" = 검색 안 한 사고 영역 명시 |

### 공통 패턴

사고 #1·#4는 같은 가지 — **외부 자료 조사 의식 부재**. 표준 영역에선
외부 자료가 결정타 영역. 사고 #2·#3은 다른 가지 — **본인 단정 사고
+ 검증 표 미적용**. 둘 다 검증 표 0·1단계 의무화로 발견 가능.

---

## 검증 표 룰 효과 확인

본 세션 검증 표 사용 사례:

| 단계 | 발견 | 결과 |
|---|---|---|
| P3a 검증 표 0단계 | CC 작업 정합 확인 (4 파일 atomic, 빌드 PASS) | 통과 |
| P3a 검증 표 1단계 | CC 보고 표 숫자 의외값 (Banner.tsx 85 vs 106) | **본인 짚지 않음** ← 사고 #3 |
| P3b 검증 표 0단계 | CC 작업 정합 확인 | 통과 |
| P3b 검증 표 1단계 | CC 보고 표 숫자 의외값 4건 | **이 시점에서야 패턴 짚음** ← 사고 #3 발견 |
| 가비아 사고 가설 단정 | 본인 가설 두 번 단정 | **운영자 정정** ← 사고 #4 |

검증 표 0단계 룰 자체는 효과 입증. 다만 **본인이 짚는 의식 부족이
누락의 결정타**. 룰 격상 안 함, 본인 의식 강화 영역.

---

## 보정 큐 (다음 세션 작업 후보)

| # | 항목 | 출처 | 상태 |
|---|---|---|---|
| ~~A~~ | ~~S2-03 P3a (보안 규칙 + 배너 + UI 차단)~~ | 본 세션 | **완료 (bada6d0)** |
| ~~B~~ | ~~S2-03 P3b (custom action URL + /verify-email)~~ | 본 세션 | **완료 (08be31f)** |
| **C1** | **S2-03 P3d (custom domain DNS 검증 + Apply + 재테스트)** | 본 세션 | **DNS 검증 대기 중. 운영자 1~48h 후 Firebase 콘솔에서 Verify + Apply 클릭 + 재테스트** |
| **C2** | **P3c (docs 끝물 묶음)** | 본 세션 미완 | **다음 세션 진입 우선** |
| **C3** | **CC 보고 본문 vs 03f40b4 커밋 직접 검증** | Track A 영역 | 본인이 view 안 한 영역. 다음 세션 초기에 git log 정찰로 확인 |
| **D1** | S2-04 마이페이지 | launch-roadmap | 다음 세션 후보 |
| **D2** | S4-09 D2 완성본 보존 (서브컬렉션 전환) | DECISIONS 2026-05-09 | 사양 확정됨 |

### P3c 작업 범위 (다음 세션 진입)

| 파일 | 변경 |
|---|---|
| `docs/CHANGELOG.md` | 2026-05-19 v3 항목 (P3 영역 한 줄) |
| `docs/PROJECT.md` | 완료된 기능에 호스트 이메일 인증 차단 흐름 추가 |
| `docs/launch-roadmap.md` | S2-03 P3 상태 "다음 세션 후보" → "완료" 갱신 |
| `docs/decisions/auth-model.md` | 2026-05-19 v3 신규 항목 — P3 결정 본문 (옵션 B+b+α+i+ii + custom action URL + custom domain) |
| `docs/known-issues.md` | 신규 등재 4건 (아래) |

### known-issues 등재 4건 (P3c 영역)

1. **host/page.tsx dead code**: 3뷰 중 2뷰(dashboard·create) 도달 불가.
   mockEvents 사용. P3 작업 외 영역. 별도 작업 후보
2. **Firebase sendEmailVerification too-many-requests 방어 상태**:
   auth.ts inner catch로 방어됨. 인증 메일 미수신 시점에만 발현. P3
   배너 재발송으로 복구 경로 확보. 격상 트리거: 가입 실패 사고 발생 시
   본 영역 1순위 가설
3. **Firebase 이메일 발송 일일 한도 (Spark 플랜)**: 사용자 수 비례,
   정확한 수치 비공개. 영업 차단도 중 (졸업식 시즌 대량 가입 시 격상
   가능). 격상 트리거: 발송 실패 사고 시 Identity Platform 격상 또는
   Firebase 지원 한도 증액 요청
4. **루트 congre.kr SPF 미래 통합 영역**: 현재 Firebase Auth만 SPF
   등록 (`v=spf1 include:_spf.firebasemail.com ~all`). 향후 다른 메일
   서비스(예: Resend가 루트로 통합 요구 또는 새 서비스 추가)가 루트
   SPF 요구 시 통합 필요. SPF 1개 원칙 (Firebase 공식 명시).

---

## 거론 보류 큐 (이전 세션 계승)

- 재렌더 UX 갭 (done 상태 버튼 미노출)
- S4-09 D2 완성본 보존 (서브컬렉션 전환)
- S3 고아 파일 (마감 후 업로드 race)
- 호스트 클립 제거 시 영상 미리보기 흐름 검증
- 영상 호스팅 CDN 이전 (R2 vs Shotstack)
- 미성년자 영상 법적 리스크
- 네이버 메일 도달성
- BGM 다양성 격상
- 야외 환경 음량 검증
- iPad UA 감지 한계 (Track E iOS 사고 잔여)
- 합본 PDF 재합본 (iOS 분기 갱신 후)

### 예정된 작업 트리거

- AWS 무료 트라이얼 만료 30일 전 (~2026-09-28)
- **P3d DNS 검증 완료 시점** (1~48시간 후) — 운영자가 Firebase 콘솔
  Verify + Apply + 실측 재테스트

---

## 운영자 P3d 완료 작업 (DNS 검증 후)

DNS 1~48h 검증 대기 후:

### 1단계 — Firebase 콘솔 검증 확인

```
Firebase 콘솔
└─ congre-mvp 프로젝트
   └─ Authentication > Templates 탭
      └─ 이메일 인증 항목 편집 ✏️
         └─ 도메인 검증 상태 확인
            ├─ "Verification complete" 녹색 메시지 노출 → 2단계 진행
            └─ "검증 대기 중" → 더 기다림 (최대 48h)
```

### 2단계 — Apply Custom Domain 클릭

검증 완료되면 **"Apply Custom Domain"** 버튼 활성화. 클릭 → 인증 메일
발송 도메인이 `congre.kr`로 변경 적용.

### 3단계 — 실측 재테스트

- 새 가입 (또는 기존 미인증 계정 재사용)
- 가입 직후 발송되는 인증 메일이 **Gmail 받은편지함 도달** 확인
- 스팸함 도달이면 사고 잔여. 본인 진입해서 추가 외부 자료 조사 필요

### 4단계 — 본 채팅 또는 다음 세션에 보고

- 받은편지함 정상 도달 → "P3d 완료" 한 줄
- 스팸함 잔여 → 화면 캡처 + Gmail 헤더 정보 (Show original)
- 검증 자체 실패 → 가비아 DNS 화면 캡처 + Firebase 콘솔 화면 캡처

---

## 다음 세션 진입점 (본인 추천 우선순위)

| 순위 | 후보 | 비고 |
|---|---|---|
| 1 | **P3c (docs 끝물 묶음)** | 본 세션 미완. 본 세션 학습 본문 보존 영역. 사이즈 소~중. 한 세션 처리 가능 |
| 2 | **P3d 검증 완료 회고** | 운영자 검증 결과 의존. 사고 잔여 시 정정 트랙 |
| 3 | S2-04 마이페이지 | launch-roadmap. 사이즈 중 |
| 4 | S4-09 D2 완성본 보존 | 사양 확정. 영업 차단 우려 |

본인 추천: **P3c 먼저, P3d 검증 결과 회고 묶음**. P3d 검증 결과 의존
영역은 P3c docs 갱신과 자연스럽게 묶음 처리 가능.

---

## 다음 세션 시작 시 운영자 작업 — 5개 셋트

- CLAUDE.md (자동 첨부)
- AGENTS.md (자동 첨부)
- **직전 핸드오프 (본 파일, `2026-05-19-v3-s2-03-p3-email-verification.md`)** ← 운영자 직접 첨부
- **직직전 핸드오프 (`2026-05-19-v2-s2-03-host-signup.md`)** ← 운영자 직접 첨부 (Kickoff 룰 6번 의무)
- DECISIONS.md 인덱스 (자동 첨부)
- known-issues.md (자동 첨부)

추가 첨부 후보:
- launch-roadmap.md (S2-04 또는 후속 작업 진입 시 사양 참조)

### 자동 첨부 stale 가능성 경고

본 세션 끝물 처리(P3c) 미완. 자동 첨부된 PROJECT.md / DECISIONS.md /
known-issues.md / CLAUDE.md 본문은 본 세션 학습 본문(P3 완료, 신규
known-issues 4건, 사고 패턴 등) 반영 안 된 상태. **현재 저장소
상태로 단정 금지**. 본 핸드오프 본문 우선 참조.

### 첫 메시지 한 줄 (Kickoff 룰 6번 의무)

> "본 핸드오프 2개 외엔 모르는 것으로 간주. 진단·결정 시 모르는
> 영역이면 명시. CC 보고 받으면 검증 표 먼저. 첫 답변에 두 핸드오프
> 교차 검증 결과 출력 의무 (CLAUDE.md Kickoff 룰 6번). 이번 세션
> 진입점: P3c (docs 끝물 묶음) 또는 [운영자 명명 영역]."

### 다음 세션 채팅 클로드 본인용 노트

**본 세션 사고 패턴 4건 학습 영역 — 다음 세션 본인이 미리 봐야 재발
차단**:

1. **외부 자료 조사 0단계 룰**: 표준 패턴 영역(가입·인증·결제·DNS·
   브라우저 호환성 등) 사양 짜기 전 외부 자료 조사가 0단계. 본인
   머릿속만으로 사양 메우면 사고 #1·#4 재발
2. **본인이 본 적 없는 영역 단정 금지**: 직전 세션 정찰 회수 정보도
   본인이 view 안 했으면 단정 사용 금지. 사고 #2 재발 차단
3. **검증 표 0단계 의무**: CC 보고 도착 시 첫 단계 = "본인 요청 ↔
   실제 보고 작업 일치 여부 확인". 1단계 = "사양 ↔ 실측 정합". CC
   보고 표 숫자는 diff/Write 출력과 대조. 사고 #3 재발 차단
4. **"본 적 없음" ≠ "결정 못 함"**: "본 적 없음"은 검색 안 한 사고
   영역 명시. 외부 자료 조사로 결정 가능. 사고 #4 재발 차단

**검증 표 룰 본 세션도 효과 입증** (4건 이상 발견). 룰 유지.

**P3d 검증 결과 의존 영역**: 운영자가 검증 완료 + Apply + 재테스트
보고하면 P3c docs 갱신에 결과 본문 반영. 검증 실패 시 정정 트랙
(외부 자료 추가 조사 또는 옵션 E(Cloudflare 이전) 격상 검토).

**launch-roadmap.md 갱신 의무**: P3 완료 + P3d 신설 영역 본문 정정
필요. P3c 작업에 포함.
