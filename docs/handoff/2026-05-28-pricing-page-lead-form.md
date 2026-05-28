# 2026-05-28 — 가격 페이지 + 리드 수집 폼 (B 트랙) 구현·배포

> 직전 사이클(2026-05-27 CD backfill, R1~R3 랜딩 리뉴얼) 이후. CD 토큰 소진(주별 리뉴얼 대기)으로 R4 보류 → 오래 미뤄진 "가격 페이지 + 신청 폼" 트랙 진입. 사양 결정 → CC 정찰 → CC 실행 → 검증까지 한 사이클 마감.

## 본 세션 한 줄 요약

가격 페이지(`/pricing`) + 리드 수집 폼 신규 구현·배포 완료. 폼 제출 → 본 앱 `/api/lead` → Resend → 운영자 메일 수신까지 전 경로 작동 확인. 진행 중 사고 4건 발견·해소. 본 앱 커밋 4건, 랜딩 배포 2회(기능+URL매핑). B 트랙 마감, A 트랙(BM 결정) 다음 사이클로 이월.

## 작업 배경

- 운영자 비즈니스 모델: 무료·유료 병행 예정, **결제 시스템 미연결·가격 미정**
- 결정: B(임시 페이지 + 리드 수집) 먼저 → A(BM 결정) 나중. 순서 B→A
- 트랙 분리: 랜딩(`congre-landing`, deploy/, git 외부) + 본 앱(`congre-three`, API)

## 결정 사항 (사양 확정본)

| 항목 | 결정 |
|---|---|
| 페이지 메시지 톤 | 행사 유형별 안내 + 베타 무료 명시 혼합 |
| 라우트 | `/pricing` (cleanUrls로 깔끔한 URL) |
| nav 연결 | "요금" 토스트 placeholder 제거 → `/pricing` |
| 폼 필드 | 필수 4개(이름·이메일·행사유형·일자) + 선택 3개(인원·소속·문의) |
| 행사 유형 | 결혼식/졸업식/기업·기관/동호회·모임/기타(직접입력) |
| 제출 흐름 | 이메일 발송만 (Firestore 저장 안 함, YAGNI) |
| 발신 | noreply@congre.kr (기존 EMAIL_FROM) |
| reply-to | 신청자 이메일 (운영자가 받은 메일에서 바로 회신) |
| 수신 | **rhcho@naver.com** (원래 hello@congre.kr 의도였으나 수신 MX 없어 변경 — 아래 사고 참조) |
| rate limit | 미구현 (honeypot만, TODO 주석) |
| 폼 폰트 | index.html 톤 그대로(Cormorant + DM Sans + Noto Sans KR). Pretendard 아님 (아래 known-issue) |

## 실행 내역

### 본 앱 (congre-three) — git 커밋 4건

| 해시 | 메시지 | 변경 |
|---|---|---|
| 110b3e1 | feat: emailChannel reply-to 지원 추가 | types.ts + email.ts, replyTo? 옵션 필드 (2파일 1줄씩) |
| (커밋2) | feat(api): add /api/lead endpoint for pricing inquiry form | src/app/api/lead/route.ts 신규 112줄 |
| 4063edc | fix(api): allow www.congre.kr origin in /api/lead CORS | route.ts CORS origin 반사 (+22/-18) |
| 4bc2add | fix(api): change lead recipient to working mailbox | LEAD_TO 수신지 변경 (1줄) |

- API 엔드포인트: `POST https://app.congre.kr/api/lead`
- CORS 허용: `["https://congre.kr", "https://www.congre.kr"]` 요청 origin 반사 + `Vary: Origin`
- 기존 emailChannel.send() 어댑터 재사용 (옵션 A — 우회 안 함)

### 랜딩 (deploy/, git 외부) — 배포 2회

- `deploy/pricing.html` 신규 605줄 — Hero + 행사유형 카드 4장 + 폼 + footer
- `deploy/index.html` 수정 2곳 (L1487 top nav, L2125 footer "요금" → `/pricing`)
- `deploy/vercel.json` 신규 `{"cleanUrls": true}` — `/pricing` 깔끔한 URL 매핑(404 해소)
- 배포: `npx vercel --prod --yes` (deploy 폴더에서)

## 검증 결과 (전 경로 통과)

- ✅ www.congre.kr/pricing 접속 정상 (cleanUrls)
- ✅ nav "요금" → /pricing 이동 (토스트 안 뜸)
- ✅ 폼 제출 → API → Resend → rhcho@naver.com 수신 통과 (네이버 받은편지함)
- ✅ reply-to 신청자 이메일 정상 (Resend 로그 Reply-to: rhcho@naver.com 확인)
- ✅ Subject 매핑 정상 ([Congre 문의] 졸업식 — {이름})
- ✅ CORS preflight www origin 반사 (curl 204 + Access-Control-Allow-Origin: www.congre.kr)

## 본 세션 사고 4건 (학습 룰 누적용)

### 1. emailChannel reply-to 미지원 → 어댑터 확장으로 해소
사양에 "reply-to 신청자 이메일" 박았으나 기존 emailChannel.send()에 replyTo 전달 경로 없음. CC가 "우회 구현 금지" 룰대로 멈추고 보고. 옵션 A(어댑터에 replyTo? 옵션 필드 추가) 채택 — 추상화 유지, 기존 7개 호출처 무영향. **학습: 사양에 외부 채널 기능 박을 때 기존 어댑터가 그 기능 지원하는지 정찰 단계에서 확인.**

### 2. footer "복사" 사양 모호 → CC 자체 판단 단순화
"footer: index.html과 동일(복사)" 지시했으나 pricing.html엔 토스트 핸들러 script가 없어 literal 복사 시 죽은 링크 발생. CC가 작동 안 할 메뉴(FAQ·소개·블로그) 삭제 + 도입문의를 /pricing 임의 연결 — 자체 판단을 보고에 누락했다가 확인 질문에 자진 신고. 운영자 결정으로 (c)단순화 유지 + 도입문의 2개 삭제(원래 메일·카톡 외부 동작이라 /pricing 자기참조는 부적합). **학습: 정적 페이지 간 "복사" 지시 시 의존 script도 따라가는지 명시. "동일 복사"는 literal/동작보존/단순화 중 어느 것인지 사양에 못박기.**

### 3. CORS origin www 누락
1단계에서 CORS를 `https://congre.kr`만 허용. 실제 메인은 `www.congre.kr`(도메인 핸드오프 명시: apex는 307 리다이렉트, www가 메인)인데 빠뜨림 → 폼 제출 시 preflight 차단(브라우저 Console 에러로 확정). origin 반사 방식으로 두 도메인 허용. **학습: CORS·도메인 관련 설정 시 도메인 핸드오프의 "www가 메인" 사실 반영. apex만 박지 말 것.**

### 4. hello@congre.kr 수신 MX 없음 (발송 전용 도메인)
폼 수신지를 hello@congre.kr로 정했으나, 가비아 DNS에 이 주소 **수신용 MX 레코드 없음**. MX는 `send` 호스트의 AWS SES feedback-smtp뿐(발송·바운스용). Resend 로그가 Sent에서 멈춤(받을 서버 없음). 수신지를 운영자 실사용 rhcho@naver.com으로 변경해 해소. **학습: 발송 도메인 인증(SES·Resend·DKIM)과 수신 메일박스(MX)는 별개. 폼 수신지 정할 때 그 주소가 실제 메일 받을 수 있는지(수신 MX 존재) 확인.**

## 신규 known-issues

### KI-A. pricing.html Pretendard 미전환
- **현황**: deploy/pricing.html은 index.html과 동일 Cormorant 톤으로 생성. R1~R3 Pretendard 결정은 CD 안에만 보관, R4~R8 zip 일괄 적용 예정이라 현 배포는 아직 Cormorant.
- **트리거**: R9 zip 적용 시 index.html은 Pretendard 전환되는데 pricing.html 누락되면 이 페이지만 Cormorant로 남음.
- **표식**: pricing.html 상단 `<!-- TODO: R4~R8 Pretendard 전환 시 이 페이지도 포함 -->` 주석 박힘.
- **조치**: R9(zip 적용) 작업 시 pricing.html도 전환 대상 포함 확인.

### KI-B. 폼 수신지 = 개인 네이버 (임시)
- **현황**: LEAD_TO = rhcho@naver.com. hello@congre.kr 수신 MX 없어 임시로 개인 메일 사용.
- **잠재성**: 회사 도메인 메일함(hello@congre.kr) 부재. 리드 알림이 개인 네이버로만 옴. 운영자만 받는 알림이라(신청자 비노출) 당장 문제는 아님.
- **격상 트리거**: (a) 회사 메일함 정식 구축 시점 → 수신 MX 추가 + LEAD_TO 되돌리기, (b) 영업 인력 추가 시 공용 수신함 필요.
- **네이버 도달성**: 이번엔 받은편지함 통과. 단 From이 noreply@congre.kr(SES·Resend)이라 향후 스팸 분류 가능성 잔존(기존 known-issue "네이버 메일 도달성" 연장선).

### KI-C. OneDrive .next 잠금 (격상 트리거 발현)
- **현황**: 본 앱 빌드 중 `.next` 폴더 OneDrive 잠금으로 1회 실패 → `rm -rf .next` 후 재빌드로 우회. 본 세션 중 수 회 발생.
- **연결**: 기존 known-issue L6(본 앱 OneDrive 안 위치)의 격상 트리거가 실제 발현된 것.
- **격상 트리거**: 반복 빈도 증가 시 본 앱 OneDrive 외부 이전 검토.

## 미반영 / 다음 처리

- **수신지 임시값**: rhcho@naver.com은 임시. 회사 메일함 구축 시 되돌릴 것 (KI-B)
- **본 세션 docs 미반영**: 본 핸드오프 외 DECISIONS·known-issues.md 정식 반영은 다음 세션에서 (랜딩 트랙은 본 앱 docs와 별도 트랙 룰)
- **사양 .md**: 2026-05-28-pricing-page-spec-b-track.md (별도 파일)

## 다음 세션 후보

### A 트랙 — BM 결정 (B→A 순서의 A)
- 가격 모델(행사 1건당 vs 구독 vs 기관 연계약 vs 혼합)
- 세그먼트별 가격(B2C: 결혼식·동호회 / B2B: 졸업식·기업)
- 무료 티어 여부, 결제 인프라(토스페이먼츠·스트라이프 등) 도입
- 리드 폼 데이터 쌓이면 어느 세그먼트 많은지 참고 가능

### 랜딩 리뉴얼 R4~R8 (CD 토큰 복구 후)
- R4 결과물 섹션: 사양 확정·CD 영어 프롬프트 작성 완료 상태 (직전 세션). CD 토큰 복구되면 즉시 복붙 가능
- R5~R8, R9(zip export → 로컬 → 배포)

### known-issue 처리
- KI-A: R9 zip 시 pricing.html Pretendard 포함
- KI-B: 회사 메일함 구축 결정 시 수신지 복원
- KI-C: OneDrive 외부 이전 검토

## 다음 세션 진입 컨텍스트

운영자가 다음 세션 첫 메시지에 포함할 것:
- 본 핸드오프 파일 첨부
- 작업 영역 명시 (A 트랙 BM 결정 / R4 CD / known-issue 처리 중 택1)
- A 트랙이면: 가격·세그먼트·결제 인프라는 운영자 결정 영역. 시장·원가·경쟁사는 운영자가 안다

## 작업 요약 (한 줄)

`/pricing` 가격 페이지 + 리드 수집 폼 구현·배포 완료. 폼→API→Resend→메일 수신 전 경로 작동. 본 앱 커밋 4건 + 랜딩 배포 2회. 사고 4건(reply-to 미지원·footer 단순화·CORS www 누락·수신 MX 없음) 발견·해소. known-issue 3건 누적. B 트랙 마감, A 트랙(BM 결정) 이월.
