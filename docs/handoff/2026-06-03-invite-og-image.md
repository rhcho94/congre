# 2026-06-03 — 초대장 OG 이미지 (C안: S3 프록시) 완료

> 본 앱 트랙. 직전 핸드오프(2026-06-02 share-flow-and-invite-og)의 보류 지점
> "초대장 OG — OG 이미지 호스팅 전략 A/B 결정"을 C안으로 매듭.

## 본 세션 한 줄 요약
초대 페이지 /upload/[eventId]의 카카오/SNS 미리보기에 호스트 인트로 이미지를
띄우는 작업을, S3 비공개 유지 + 프록시 라우트(C안)로 구현·커밋·실측 완료.

## 본 세션 커밋
- `65c4d17` — feat: add OG preview image for invite pages via S3 proxy route
  - 5 files (+88/-1): 신규 src/app/api/og-image/[eventId]/route.ts(+64),
    수정 src/app/upload/[eventId]/layout.tsx(+7/-1), docs/known-issues.md(+12),
    docs/CHANGELOG.md(+4), docs/PROJECT.md(+1).
  - 빌드 통과(/api/og-image/[eventId] 동적 라우트 등록 확인), lint baseline
    (11 errors/3 warnings) delta 0, main push 완료. 숫자 자체 검증 통과
    (staged 합계 = +88, 일치).
- ※ 이 핸드오프 파일 미커밋 → docs(handoff):로 커밋 필요.

## 결정 (A/B/C → C 확정)
- B(presigned 만료 연장) 탈락: AWS presigned 최대 7일 한계라 졸업식 초대 주기
  (행사 몇 주 전부터 배포)와 안 맞음 → 미리보기 깨짐.
- A(intro 경로만 S3 public-read) 탈락: 비개발자 운영자가 미성년 영상 버킷의
  공개 정책을 직접 수정하는 리스크(정책 오작성 시 클립까지 노출) 과다.
- C(프록시 라우트) 채택: S3 비공개 유지, /api/og-image/[eventId]가 서버에서
  객체 바이트 직접 서빙. presigned 미사용 → 카카오 영구 캐시 vs 만료 충돌 소멸.

## 구현 사양 (확정 동작)
- 라우트: eventId(path param)만 입력. getAdminDb()로 events/{eventId} 조회 →
  introMediaType==="image" && introMediaKey 존재 시 GetObjectCommand로 바이트
  읽어 Response(Buffer.from(bytes))로 반환. 그 외(영상/미설정/이벤트 없음/
  에러)는 https://app.congre.kr/logo.png로 302 fallback.
- 보안: 클라이언트가 S3 key 못 줌(eventId만). key는 events 문서에서 읽음 +
  애초에 서버가 events/{eventId}/intro/ prefix로 생성(presign 화이트리스트).
  임의 경로 주입 불가. 인증 의존 없음(시크릿 창 검증 통과 = 봇도 이미지 수신).
- 분기: 영상 인트로는 썸네일 추출 안 함(YAGNI), 로고 fallback.
- 캐시 헤더 없음(매번 S3 재읽기, YAGNI). 트래픽 문제 시 추가 후보.
- OG 이미지 도메인: NEXT_PUBLIC_APP_URL 실제 값이 congre-three.vercel.app이라,
  OG URL만 https://app.congre.kr 하드코딩((나)안). 환경변수 미변경.

## 실측 (빌드 통과 ≠ 사용자 화면, 학습 룰대로 직접 확인)
- /api/og-image/{eventId} 브라우저 직접 + 시크릿 창 → 인트로 이미지 정상 출력
  (인증 무관 확인).
- 카카오 공유 디버거 → 인트로 이미지 정상 인식.
- 검증된 동작: 링크 생성 후 인트로를 나중에 넣어도, 라우트가 요청 시점 문서를
  새로 읽어 반영됨. 단 카카오/카톡 클라이언트 캐시는 별도 단계라, 인트로 넣기
  전 공유한 링크는 디버거 캐시 초기화 필요. 카톡 PC/폰/서버 캐시 3중 분리 —
  판단은 디버거 미리보기로.

## 새로 등재된 known-issue
- OG 이미지 도메인 하드코딩(known-issues.md 추가됨): NEXT_PUBLIC_APP_URL을
  app.congre.kr로 통일하는 도메인 정책 정리 시 이 하드코딩 제거+환원. 카카오
  영구 캐시 때문에 도메인 변경 시 기존 초대장 미리보기 깨질 수 있음 — 주의.

## L6 발현 기록 (격상 트리거 현실화)
- 이번 빌드에서 OneDrive .next 잠금 실제 발생(known-issues L6 격상 트리거 중
  "npm run build 간헐 실패"). rm -rf .next 후 재빌드로 회피. 근본 해결은 본 앱
  폴더를 OneDrive 밖으로 이전(예: C:\projects\congre). 다음 후보로 등재 권장.

## 미완 / 다음 세션 후보 (우선순위)
- ★ ⑦ 완성본 /share OG + B(Shotstack→S3 전환) 한 묶음 — 중요-비긴급. B 선행:
  운영자 Shotstack Integrations에 S3 등록(전용 IAM 키).
- ★ Firestore composite index 사전 생성(clips: eventId+uploaderPhone+
  uploaderName) — 첫 업로드 차단 방지.
- ★ OneDrive 이전(L6) — 빌드 안정화. git·Vercel 재연결 확인 필요(한 사이클).
- CLAUDE.md lint 게이트 문서 불일치: 문서 "errors 0" vs 실제 baseline 11.
  둘 맞추기 결정 필요.
- (열린 질문) "앱 소개 문서" — 전용 소개 문서 없음. 용도(투자/온보딩/사용자)
  미정. market-product.md 미열람. 용도 정해지면 기존 가리킬지/신규 작성할지 결정.
- (선택) NEXT_PUBLIC_APP_URL 도메인 정책 정리(위 하드코딩 환원 동반) / 랜딩
  영상 경량화 + Spend Management / 랜딩 L1~L5.

## 본 세션 학습
- CC 메타 코멘트 재발: 프롬프트에 "recap·다음 단계 금지" 명시했으나 보고 끝에
  ※ recap 붙임. CLAUDE.md 절대 규칙 위반 반복 패턴 — 다음 프롬프트에서 재강조.
- OG 디버깅은 "사람이 보는 것 ≠ 봇이 받는 것 ≠ 클라이언트가 캐시한 것" 3층 분리.
  진단은 시크릿 창(인증 무관 확인) + 공유 디버거(서버 캐시 확인)로. 카톡 화면
  (PC/폰)은 클라이언트 캐시라 판단 근거 부적합.
