# 핸드오프 2026-10-09 — 출시 전 문구 감사·일괄 정리 (코난 단독 실행 세션)

작성: 채팅 클로드 코난. Ray 지시(16:38): "내가 따로 해야 할 일 빼고 나머지는 묻지 말고 한 번에 처리, 안 되는 건 남겨라". 이 세션은 CC 없이 코난이 Ray PC의 저장소를 직접 읽고(스냅샷) 컨테이너에서 빌드·커밋한 뒤 Ray PC에 패치로 적용했다. 다음 세션은 이 문서 + 프로젝트 문서 `claude/pending-backlog.md`로 시작.

## 1. 끝난 것 — 앱 저장소 커밋 15개 (base `21d5470` 위)

검증 게이트: 매 커밋 `next build` 32/32(컨테이너, Google Fonts 차단이라 `--webpack` + 폰트 mock으로 빌드), `npm run lint` 12 errors(baseline 동일), `tsc --noEmit` 클린. 독립 검증: 패치를 쓰지 않은 별도 에이전트가 14개 커밋 전건 OK 판정(줄 끝 CRLF 보존 확인 포함).

| 커밋 | 내용 | 출처 항목 |
|---|---|---|
| fix(notifications) 무료·쿠폰 이벤트 지연 알림 | `refund50At != null`을 paid로 넘겨 결제 건만 환불 문구. 새 SMS `render_delayed_free`. "꽁그레팀" → "Congre 팀" | 문구 감사 #1·#25, known-issues 해소 |
| fix(signup) 만 19세 → 만 14세 | 약관 제5조·legal 결정과 일치 | #2 |
| fix(notifications) 완성 문자 링크 | 대시보드 → 공유 페이지 | #24 |
| fix(cron) check-rendering 이벤트 단위 try/catch | 한 건 실패가 회차를 안 막음 | B7 |
| fix(ui) 워터마크 배지 무료만 | 대시보드·참가자 완료 화면. API에 `plan` 추가 | #10·#11 |
| fix(copy) 결제 화면·생성 메일·기본 제목 | "이벤트당 1회" → 80% 재결제 안내(모드별) 등 | #6·#15·#23·#30 |
| fix(signup) 010 11자리 + 가이드 4곳 | 이벤트 생성 규칙과 통일 | #19·#28·#31·#32 |
| chore(ui) 업로드 실패 문구·정원 단위·PAID_NOT_AVAILABLE·catch console.error·주석 | | #35·#38, M7 |
| refactor(host) mock 뷰 삭제 | 133줄 제거, 로그인 마크업 그대로 | H6 |
| feat(app) 한글 404 | `src/app/not-found.tsx` | H7 |
| fix(ui) 가입일 표기·"호스트 로그인" | | H8·#28 |
| feat(notifications) 렌더 실패 운영자 문자 | `CONGRE_INTERNAL_PHONE` 설정 시 | 체크리스트 E |
| chore(env) `.env.local.example` 7개 추가 | | 9/30 이월 |
| docs | infra.md 9/22~24 결정 4건(A4), landing.md(27) 리드 문구, 9/14 핸드오프 정정(A3), CLAUDE.md·PROJECT.md 배포 명령(H9), known-issues 7건 해소 이동 + 2건 등재, legal/CHANGELOG 정리, `docs/ops/runbook-refund-manual.md` 신설, CHANGELOG 10/09·9/23 | |
| chore | 빈 줄·DECISIONS legal 개수 | 검증 nit |

## 2. 랜딩 (git 밖, `deploy/`)
- `pricing.html`: "결제는 이벤트당 1회이며" 자기모순 제거, "200개 이상" → "초과", "갯수" → "개수"(3곳). `faq.html`: 이전 완성본 7일 다운로드 가능으로 정정(#7·#8·#33·#34).
- `.vercelignore`: 미사용 자산 제외 — `images/*`(og-image.png 제외), `videos/*`(wedding_2.mp4 제외), `uploads/`, `image-slot.js`, `.image-slots.state.json`, `media/selfie-*.jpg`, `_*.tgz`(H5). 파일은 지우지 않았다.
- 배포 여부는 3절 참조.

## 3. 적용·배포 결과 (21:00~21:35, PC 재연결 뒤)
- **앱**: 16개 커밋을 PC 저장소에 `git am`(core.autocrlf=true로 LF 보존) → 번들 → 컨테이너에서 push `21d5470..e1ce9c6`. Vercel 자동 배포. 라이브 확인: `/login` 한글 404, 가입 "만 14세"·"휴대폰 번호", 가이드 "010으로 시작하는 11자리". PC 실측 `npm run build`는 하지 않았다(VM에는 Windows용 node_modules뿐) — 컨테이너 build 32/32·tsc·독립 검토로 갈음.
- **랜딩**: Ray가 PowerShell에서 배포. 첫 시도 "Not authorized"(CLI 로그인 풀림, 9/16에 이어 2번째) → `vercel login` 뒤 성공. 라이브 확인: "영상 개수"·"첫 결제 뒤"·"200개 초과"·faq "7일 동안 대시보드", `images/birth.png` 404, og-image·wedding_2.mp4 정상, 첫 화면 정상.
- **I2 자동 정리 첫 실행**: 21:39 Ray가 Vercel 로그 캡처로 확인 — `OCT 09 03:00:15 200 cleanup done { clipsDeleted: 0, videosDeleted: 1, notificationsDeleted: … }`. C21 코드로 돌았다(새 키 등장). 세부는 known-issues-resolved.md cleanup 항목. 코난은 Vercel 로그에 직접 닿을 수단이 없었다(앱 내 브라우저·Chrome 확장 모두 미로그인) — 다음 세션 전에 앱 내 브라우저에서 Vercel 로그인 1회 권장.

## 4. Ray가 해야 하는 것 (코난이 대신 못 함)
1. 토스 1:1 문의 A5(환불 절차·취소한도) → 답을 `docs/ops/runbook-refund-manual.md` 4절에.
2. 법률 상담 D1~D5 + known-issues "약관·처리방침 문구와 코드가 어긋나는 곳 묶음"(9건). 약관·처리방침 본문은 코난이 손대지 않았다.
3. 결정 2건: (a) "통상 10분 이내" 문구 vs 코드 기준 15분+(H4) — 토스 심사 표기와 묶임. (b) 공식 고객 응대 채널 1순위(카카오톡 / 이메일 / 전화) — 지금 매체마다 다름(#16).
4. Vercel 환경변수 `CONGRE_INTERNAL_PHONE` 설정 여부 확인(없으면 운영자 문자 전부 무음).
5. 탈퇴 실험 I3(테스트 계정), 대청소 F(운영 DB·S3), S3 서울 이전 I1(AWS 콘솔), 테스트 시크릿 키 재발급, 카카오 채널 옛 번호, status.shotstack.io 구독, Shotstack 월말 크레딧.

## 5. 학습
- 저장소에 CRLF·LF 파일이 섞여 있다. 파이썬 텍스트 모드로 쓰면 CRLF가 통째로 LF가 돼 diff가 파일 전체로 번진다 → 바이트 모드로 읽고 원래 줄 끝을 유지하는 `edit.py`로 바꿔 세 커밋을 다시 만들었다. 커밋 뒤 `git ls-files --eol`로 확인.
- 컨테이너에선 Google Fonts를 못 받아 Turbopack 빌드가 실패한다. `NEXT_FONT_GOOGLE_MOCKED_RESPONSES` + `next build --webpack`이면 통과(타입·번들 검증 목적). PC 실측 빌드(Turbopack)는 push 전에 한 번 더.
