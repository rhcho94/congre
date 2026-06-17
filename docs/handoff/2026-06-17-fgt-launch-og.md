# 2026-06-17 (2) 세션 핸드오프 — FGT 출발 + 초대 OG

## 한 줄 요약
FGT 완료조건 4개 전부 통과 → FGT 시작 가능 상태 도달. FGT용 무료 전환
(유료 차단 + 19세 체크) 커밋·배포. 초대 링크 OG fallback을 로고→브랜드
카드로 교체·배포. 둘 다 라이브 검증 완료.

## 이번 세션 커밋
- 0be3268 feat(fgt): 유료 경로 차단 + 19세 자가신고 (FGT 무료 전환)
- 9ebf887 feat(seo): 초대 링크 OG fallback을 브랜드 카드로 교체

## 완료·검증
### FGT (완료조건 §2 전부 통과)
- ④ cron 실측: /api/cron/check-rendering, vercel-cron/1.0, 200, 5분 간격
  확인(Logs). CRON_SECRET 프로덕션 설정·Pro 플랜 확인 → 배선+동작 둘 다 OK.
- ①②③ 코드(단일 커밋 0be3268):
  - ① dashboard/create: 유료 라디오 disabled + "· 준비 중" 표시, opacity 0.55,
    cursor not-allowed. 기본 무료 유지.
  - ② render/start L48 직후 plan 가드: paid면 PAID_NOT_AVAILABLE 403 +
    console.error. clips 조회 전에 차단. events/[eventId] 에러 분기에
    "유료 플랜은 현재 준비 중입니다." 케이스 추가.
  - ③ signup: ageAgreed 체크박스("만 19세 이상입니다. (필수)"), canSubmit 필수.
- §2-1 무료 한 바퀴 실사용(실폰): 가입(19세 체크)→생성(유료 비활성 확인)→
  QR→업로드→마감→렌더→완성 알림(이메일+SMS)→게스트 완성 링크 전부 정상.
  5/5 한도 차단·10초 컷도 확인.

### 초대 링크 OG (커밋 9ebf887)
- api/og-image/[eventId] FALLBACK_URL: app.congre.kr/logo.png →
  app.congre.kr/og-image.png. 인트로 이미지 분기·6개 fallback 경로 로직 불변,
  상수 한 줄만 교체.
- public/og-image.png 신규(525,028 bytes, 랜딩 deploy/images에서 복사).
  트랙 분리 원칙상 본 앱 사본 채택(랜딩 URL 직접 참조 안 함).
- 검증: 카카오 공유 디버거에서 새 브랜드 카드 스크랩 확인. 톡방 캐시(나와의
  채팅)는 지연이라 디버거로 가름.

## 다음 세션 후보 (우선순위)
1. [우선] 게스트 완성 share 링크(/share/...) OG 손보기. 5월 9일에 OG 메타
   넣은 흔적 있음 → 현재 뭘 보여주는지 정찰부터(코드로 확인, 추측 금지).
   초대 링크와 동일하게 브랜드 카드 fallback 적용 가능한지 검토.
2. 동시 업로드 race condition 점검(읽기 전용): clips 라우트가 5클립 한도를
   트랜잭션으로 막는지. 동시 요청 시 6개 새는지. FGT엔 무료라 무해, 정식 운영 전.
3. 6번째 촬영 "진입 차단" 얹기(정식 운영 경험 개선). 동시성 때문에 올릴 때
   차단은 안전망으로 유지 필수.
4. 레거시 이벤트(옛 plan 값) 일괄 삭제 — Ray 예정.

## 학습 (한 줄씩)
- OG fallback이 한 상수로 모이면 6경로 한 줄로 교체됨. layout은 프록시에
  위임하므로 불변. 손댈 곳 = 프록시 라우트 1파일.
- 트랙 분리: 랜딩 자산을 본 앱이 쓸 땐 URL 직접 참조보다 public/ 사본이
  안전(랜딩 git 외부라 드리프트 위험).
- 카카오 캐시는 URL 단위 + 같은 톡방(나와의 채팅)은 갱신 지연. 진위는
  공유 디버거로 가름(방 캐시 우회).

## 미해결·이월
- share 링크 OG (다음 세션 1번)
- 동시성 점검·진입 차단(정식 운영 전)
- 레거시 이벤트 삭제(Ray)
