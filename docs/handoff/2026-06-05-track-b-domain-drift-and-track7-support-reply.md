# 2026-06-05 — 트랙 B(도메인 드리프트) 완결 + ⑦ Shotstack 지원 1차 답변 처리

## 한 줄 요약
NEXT_PUBLIC_APP_URL 옛값(congre-three.vercel.app) 교체+재배포로 사용자 노출 링크 13곳을 app.congre.kr로
정상화하고, 코드·문서의 옛 프로젝트명/도메인 드리프트를 2커밋으로 정리(트랙 B 종료). ⑦은 Shotstack 지원
1차 답변을 받았으나 진단 방향을 우리 쪽(SCP/버킷 제한)으로 되돌리려 해 직접-PutObject 실측으로 재반박 +
render ID 불일치 지적하는 답장 발송, raw 로그 대기로 복귀.

## 본 세션 커밋
- d50f230 — docs: fix domain/project-name drift (congre-three -> congre/app.congre.kr)
  - src/app/guide/host/page.tsx L58 (호스트 가이드 본문 도메인) / docs/PROJECT.md (배포 URL·Firebase Action
    URL·환경변수 표) / CLAUDE.md (배포 섹션·절대규칙 식별자 예시) / docs/known-issues.md (Gmail 스팸 트리거 기록)
  - 직전 세션 미푸시 핸드오프 ab2ce5d도 이 push에 함께 올라감(6e81ddd..d50f230)
- 6c6e7c3 — docs: clean up residual congre-three drift + fix self-contradicting domain line
  - d50f230이 남긴 보정: CLAUDE.md L20 자기모순 줄(기본 도메인=커스텀 도메인 둘 다 app.congre.kr) 정정 +
    PROJECT.md L30·L67 bare 옛값 잔여분 정리

## 트랙 B (도메인 드리프트) — 종료
- **근본 원인**: Vercel NEXT_PUBLIC_APP_URL Production 값이 옛 congre-three.vercel.app. 이 env가 코드 13곳
  (공유 /share·OG·이메일 인증·카카오 공유·크론 알림 링크)의 도메인을 결정 → 전부 옛 도메인으로 새고 있었음.
- **핵심 처리(콘솔, 운영자)**: NEXT_PUBLIC_APP_URL Production → https://app.congre.kr 교체 +
  빌드 캐시 없이 재배포(Skipping build cache 확인). NEXT_PUBLIC_ 변수는 빌드 시 코드에 구워지므로 재배포 필수.
  → 이 한 번으로 13곳 동시 정상화.
- **검증(실측)**: app.congre.kr 대시보드에서 공유 링크 복사 → app.congre.kr/share/... 확인됨(운영자 "확인").
- **하드코딩 도메인은 이미 정답값**: constants.ts(congre.kr 랜딩), lead/route.ts CORS(congre.kr/www),
  upload/[eventId]/layout.tsx·og-image/route.ts(app.congre.kr) — 손 안 댐. 코드에 박힌 옛 도메인은 guide/host 한 곳뿐이었음.
- **업로드 초대 링크 /upload는 window.location.origin 기반** — 호스트가 보고 있는 도메인을 자동으로 따라감.
  app.congre.kr에서 작업하면 자동 정상. 호스트가 vercel URL로 들어갈 때만 옛 도메인. 지금 손 안 댐(YAGNI, 증거 없음).

## ⑦ Shotstack→S3 — 외부 대기 (지원 1차 답변 처리 완료, raw 로그 대기)
- **지원 1차 답변 골자**: (a) 우리 destination syntax 정상, payload 정상 파싱·last used 100ms 갱신 →
  우리 쪽 malformed request 아님 확인. (b) 거의 즉시 거부 = 버킷 엔드포인트 external restriction이나 AWS
  Organizations SCP 같은 high-level 보안 경계일 "가능성 강함"이라 추정. (c) core eng팀에 에스컬레이션,
  raw copy-step 로그에서 AWS Request ID + Extended Request ID 추출 중 → CloudTrail 조회용으로 보내주겠다.
- **우리 판단 — 지원의 (b)는 우리 실측에 이미 반증됨**: shotstack-s3 키 그 자체로 우리가 직접 PutObject 3종
  (no-acl/private/bucket-owner-full-control) 전부 성공 + ListBucket 성공. SCP나 버킷 엔드포인트 제한이 그 키를
  막는다면 우리 직접 PUT도 거부됐어야 함. 유일한 변수는 "Shotstack 경유" 하나. → 원인은 Shotstack의 credential
  처리. (단, 조직 레벨 SCP는 우리가 직접 본 적 없는 영역이라 100% 배제는 안 함을 답장에 명시.)
- **render ID 불일치 발견**: 우리가 보낸 ID는 25680c47... + b35064a0...인데, 지원 답변은 두 번째를
  55a7919e-91b7-4191-a56f-6c0e90f1e303로 적음(우리가 보낸 적 없는 ID). 엉뚱한 render에서 로그 뽑으면 헛걸음 →
  답장에서 출처 확인 요청.
- **발송한 답장 골자**: (1) 55a7919e ID 출처 확인 요청 (2) 직접-PutObject 성공 실측을 명확히 재진술하여
  SCP/버킷 제한 가설 재반박 (3) raw 로그에 AWS error code·Request ID·Extended Request ID + 워커가 실제 제시한
  Access Key ID 포함 요청(원래 질문1 등록키 대조와 동일).
- **다음 처리**: 지원이 raw 로그 보내면 → CloudTrail 대조. 등록 키 불일치면 Disconnect→재등록, 내부 처리 문제면
  추가 대응. 그 전엔 ⑦에서 우리가 밀 게 없음(외부 대기).

## 죽은 가설 (다시 파지 말 것) — 이전 세션에서 이월 + 이번 강화
- [죽음] 키 무효 / IAM 권한 부족 / ACL·BucketOwnerEnforced / KMS·버킷정책·리전·sandbox / 입력자산 만료 — 전부 점검·정상.
- [죽음·이번 강화] 버킷 엔드포인트 external restriction / Organizations SCP — 직접 PutObject 성공이 반박.
  지원이 이 방향을 제시했으나 우리 실측이 덮음. (SCP만은 직접 점검 못 함 = 약한 열림, 그러나 직접 PUT 성공과 모순.)
- [열림, 지원만 답 가능] Shotstack 내부 credential 처리 / 등록 키 불일치. → raw 로그 + 등록 Access Key ID로 갈림.

## 메일 도달성 — Gmail 스팸 (신규 트랙, 별도 사이클)
- **발견**: 비번 재설정 메일이 네이버는 받은편지함 정상, Gmail은 스팸함 분류(완전 미수신 아님).
- **의미**: 메일 발송/도달 자체는 정상, "분류"만 문제. env 교체 부작용 아님(메일은 링크 도메인만 결정, 발송 경로 무관).
- **원인 추정**: SPF alignment mismatch — 발신 noreply@congre.kr(루트) vs SPF send.congre.kr(서브). 신규 도메인
  평판 미축적. Gmail이 네이버보다 엄격. (추정, 확정 아님.)
- **known-issues 메모와 어긋남**: 기존 "Gmail 도달 실측 확인(2026-05-20)"과 충돌. 과거엔 받은편지함이었는데 지금 스팸 →
  평판 하락 또는 그때 스팸함 미확인. 어느 쪽인지 불확실.
- **처리**: known-issues 네이버 메일 항목에 2026-06-05 트리거 발동 기록 추가(d50f230). 본 수정(SPF 보강 a/b)은
  DNS·Resend·Firebase 걸친 별도 사이클로 미룸.

## 떨어진 신호 (다음 세션 후보 / 확인 필요)
- **로컬 경로가 이미 C:\projects\congre** (CC 보고 L18) → known-issues L6 OneDrive 이전이 이미 된 듯한 신호.
  언제·어떻게 됐는지 불확실. L6 갱신(해결로 이동?) 필요 여부 확인 대상. ★ 가벼운 확인으로 닫을 수 있음.
- **CLAUDE.md lint 게이트 문서 정정**: "errors 0" → delta 0. 이번에 baseline 숫자 실측 확정(11 errors / 3 warnings)
  되어 정확히 박을 수 있게 됨.
- **PROJECT.md 환경변수 표 Preview/Development 셀 = "확인 필요"**: 운영자가 Production만 바꿨는지 콘솔에서
  Preview/Dev 값 미확인. 다음에 확인 후 채울 것.
- **범위 밖 옛값 잔존**(handoff 7개, decisions/auth-model.md, docs/ops/ 2개, README.md, .env.local.example,
  scripts/pdf/build_user_guide.py, docs/guide-content.md, known-issues-resolved.md): handoff는 과거 기록이라
  그대로 둠. 나머지는 사용자 비노출 → YAGNI. 신호만.
- **Shotstack storage 과금 메일**(6/3 수신, free storage 초과→크레딧 과금): ⑦ render 실패 원인 가능성 낮음
  (에러가 Access denied지 quota 아님). 이번 답장엔 의도적으로 미포함(초점 분산 방지). 로그 받아도 안 풀리면 그때 별도 문의.

## 이번 세션 학습
- **"메일 안 옴" 보고 시 발송 실패로 점프 금지.** 첫 확인은 스팸함·전체보관함. 네이버 정상+Gmail 스팸은
  발송이 아니라 도달성·분류 신호.
- **지원의 그럴듯한 추론이 우리 로컬 실측을 덮게 두지 말 것.** 지원이 SCP/버킷 제한을 제시했으나, 같은 키
  직접 PutObject 성공이라는 실측이 이미 반증. 로컬 실측 > 외부 추론(지난 세션 "외부 선례 vs 로컬 반증" 학습의 재현).
- **외부에서 받은 식별자(render ID 등)도 우리 원본과 대조할 것.** 지원이 우리가 안 보낸 render ID를 끼워 넣음 —
  그대로 받으면 엉뚱한 데서 로그 뽑힘.
- **docs 경로는 기억으로 쓰지 말 것.** 채팅 클로드가 프롬프트에 docs/CLAUDE.md로 적었으나 실제는 루트 CLAUDE.md.
  CC가 추측 안 하고 확인 후 처리해 사고 회피.
- **CC ※recap은 프롬프트에 직접 "직전에 또 붙었음, 빼라"고 짚으면 빠짐.** 매번 짚어야 빠지는 건 CC 설정 레벨 손볼 신호.

## 다음 세션 시작 시 가장 먼저
- ⑦ Shotstack 지원의 raw 로그 답변 도착 여부 확인(최우선·외부 대기). 도착했으면 CloudTrail 대조로 등록키
  불일치 / 내부 처리 갈림. 미도착이면 ⑦은 계속 대기 — 위 "떨어진 신호" 중 가벼운 것(로컬 경로/L6 확인,
  lint 게이트 문서 정정) 처리.
