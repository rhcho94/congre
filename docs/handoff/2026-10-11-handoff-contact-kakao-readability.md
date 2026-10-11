# 핸드오프 2026-10-11 — 응대 채널 전환·카카오 채널 정비·랜딩 가독성 (10/09 세션 이어서)

작성: 채팅 클로드 코난. 10/09 출시 전 감사 세션(`2026-10-09-handoff-launch-audit.md`)이 10/11까지 이어졌다. 그 문서 4절 "Ray가 해야 하는 것" 5가지를 하나씩 처리하고, 커플 피드백(카카오 채널·랜딩 가독성)을 반영했다. 다음 세션은 이 문서 + 프로젝트 문서 `claude/pending-backlog.md`로 시작.

## 1. 한 줄 요약
공식 응대 채널을 "카카오톡 1순위 + 전화"로 확정해 메일·랜딩 문구를 바꾸고, 탈퇴 실험과 첫 자동 정리를 실측 확인했으며, 랜딩 가독성 개선과 가짜 후기 삭제를 배포했다. S3 서울 이전은 1단계(현 버킷 설정 확인)에서 멈춰 있다.

## 2. 커밋 (base `e1ce9c6` 위 7개, 전부 push 완료)

| 해시 | 메시지 | 내용 |
|---|---|---|
| `203f89d` | docs(handoff): record 10/09 apply, push and landing deploy results | 10/09 핸드오프 3절(적용·배포 결과) |
| `65823c8` | docs: record first cleanup cron run (2026-10-09 03:00) verified from Vercel logs | I2 자동 정리 첫 실행 확인 |
| `63801ac` | docs(ops): refund runbook — Toss cancel rules from FAQ, narrow open question to the 0-won limit | 토스 FAQ로 취소 규칙 기록. 남은 질문은 "취소한도 0원일 때 '취소하기'가 되는가" 하나 |
| `76bebf7` | docs: record withdrawal test pass, contact-channel and 10-min decisions | 탈퇴 실험 통과(eventsDeleted 14), notifications.md 채널 결정, legal.md "통상 10분" 유지·법률은 Ray |
| `01e28df` | fix(notifications): email contact line → 카카오톡 first, then phone; drop cs@ email | 메일 머리말·렌더 실패 안내 문의처 → "카카오톡 채널 @congre, 전화 010-5891-7583" |
| `c5fa85a` | docs: landing contact switch, deploy runs from Ray's PowerShell, build baseline 33/33 | landing.md 28, CLAUDE.md 배포 절차·빌드 기준 33/33 |
| `164eec6` | docs: landing readability (cards + numbered titles), fake reviews removed, Kakao channel setup, deploy-auth note | landing.md 29, PROJECT.md, CHANGELOG 10/11, CLAUDE.md "Not authorized" 두 원인 |

검증 게이트(코드 커밋 `01e28df`): 컨테이너 `next build --webpack`(폰트 mock) 33/33, lint baseline 동일, `tsc --noEmit` 클린.

## 3. 결정 (Ray, 10/09 21:51 이후)
- "통상 10분 이내" 문구는 그대로 둔다(H4 종결).
- 공식 응대 채널: **카카오톡 1순위, 전화 2순위.** 이메일 `cs@`는 표기에서 뺀다.
- 약관·처리방침 등 법률 상담은 Ray가 직접 처리. 코난은 본문을 손대지 않는다.
- 탈퇴 실험은 토스 심사용 계정으로. ckevin 계정은 삭제해도 된다.
- S3는 서울(ap-northeast-2)로 **옮긴다**.
- 랜딩: 가독성 안 A 채택, 후기 섹션은 실제 후기가 아니므로 삭제, 섹션 제목은 "1. 50초로 보는 사용법" 형식(작은 라벨 삭제).

## 4. 실측·발견
- **탈퇴 실험(I3)**: 유료·클립 0개·진행 중 이벤트가 탈퇴를 막아 Firebase 콘솔에서 상태를 바꾼 뒤 성공. Vercel 로그 `eventsDeleted: 14`.
- **마이페이지 이벤트 개수**: 종료(closed) 이벤트가 개수에서 빠진다("진행중 0"). 메모만, 미수정.
- **`CONGRE_INTERNAL_PHONE`**: Vercel Production·Preview 둘 다 있음(Ray 화면 확인).
- **랜딩 연락처**: 카카오 채팅 링크 8곳, 전화 링크, `cs@` 0곳. 라이브 확인.
- **랜딩 가독성**: 카드 종이 배경·선·여백, 펜 글씨 빨간 번호, FAQ 그룹 제목 20px·밑줄. 백업 `*_pre_readability_backup.html`, `site_pre_readability.css.bak`. 라이브 확인.
- **FAQ 아이폰 문구 = 코드 일치**: `isIOS`는 `/iPhone|iPod/`라 아이패드는 감지하지 않는다. FAQ도 아이폰만 말한다.
- **카카오 채널**: 주소 `https://pf.kakao.com/_lqwxbX`(소문자 L), 채팅 `/chat`. 비즈니스 심사 신청함, 인사말 다시 붙여 넣음, 채팅 메뉴 6개 설정. '바로가기' 토글은 심사 전이라 켜지지 않음.
- **랜딩 배포**: 10/11 Ray PowerShell에서도 `Not authorized` → `vercel login` 뒤 성공. 로그인 만료는 10/09·10/11 두 번, 이유 모름.
- **S3 이전 정찰**: S3 코드는 전부 `AWS_REGION`·`AWS_S3_BUCKET` 환경변수를 쓴다(presign·재생·썸네일·og-image·초대 URL·렌더 시작의 BGM 목록 `audio/{mood}/`·check-rendering HeadObject·s3-server·shotstack.ts destination). Firestore에는 URL이 아니라 키만 저장. 처리방침에 "ap-southeast-2" 표기 있음(약 266·336줄) → 이전 뒤 Ray(법률 트랙)가 수정.

## 5. 미완 — 다음 세션 첫 작업
1. **S3 서울 이전 1단계**: Ray가 AWS 콘솔에서 `congre-mvp-videos`의 CORS 설정 글, 수명 주기 규칙, 최상위 폴더 목록을 보여 준다. 그다음 새 버킷(ap-northeast-2) → CORS 복사 → `audio/` 복사 → IAM(앱 사용자 + `shotstack-s3-write` 정책) → Vercel 환경변수 → 테스트 렌더.

## 6. 다음 세션 후보 (우선순위)
- 🔴 운영 채팅 시간 결정(코난 추천: 매일 10~22시) / 토스 1:1 문의 발송(0원 한도 질문) → 답을 런북 4절에 / 카카오 채팅 메뉴 6개 실제로 눌러 보기 / 평일 9~18시 다른 계정으로 인사말 확인 / 비즈니스 심사 승인 후 '바로가기' 재활성화(전화하기·소식 유지)
- 🔴 S3 이전 → 사전 대청소 F(테스트 이벤트 약 33건, ckevin, Auth·users 불일치 iioOWh·7jHaqn·fx8xt4, S3 고아 파일, `videos`·`notifications`·`betaCoupons` 처리 결정, payments 보존) → 처리방침 리전 문구(Ray)
- 🔴 법률(Ray): D1~D6, known-issues 약관·처리방침 불일치 9건 묶음, 미성년자(B5)
- 🟡 Shotstack 크레딧 10/31 확인, status.shotstack.io 구독, 토스 테스트 시크릿 키 재발급, 렌더 멈춤 런북 리허설, J8(재렌더 시 환불 플래그 미초기화), 마이페이지 종료 이벤트 개수
- ⚪ Shotstack Preview 키 경고, A1 Peace 메일 보관, A2 주문번호 기록, H10 before-test.png 삭제, 카카오 채널 옛 번호 확인

## 7. 학습
- 한 번의 관찰로 원인을 문서에 박지 않는다: 10/10 "CC가 실행하면 실패"라고 적었으나 10/11 Ray PowerShell도 실패했다. 원인이 둘(실행 주체·로그인 만료)이었다. CLAUDE.md 학습 룰에 반영.
