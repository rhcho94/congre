# 2026-09-16 핸드오프 — 통신판매업 신고번호 표기 교체 + 랜딩 배포 제외 규칙 신설

> 직전 핸드오프: `2026-09-14-handoff-launch-clearance-vendor-risk.md`
> 다음 세션 첨부: 이 문서 + 직전 핸드오프(2번 라이브 키 정찰 프롬프트가 거기 있음)

## 1. 요약

직전 핸드오프의 남은 일 ① "신고번호 표기 교체"를 끝냈다. 정찰 결과 교체 대상이 추정 4곳이 아니라 6곳(본 앱 2 + 랜딩 4)이었다. 랜딩 작업 중 `deploy/` 폴더 전체가 공개 업로드돼 `CLAUDE.md` 등 운영 문서까지 열려 있음을 발견해 `.vercelignore`로 차단했다(L14 해소).

## 2. 완료

### 본 앱 (git)
- `da032b3` fix(legal): 약관·개인정보처리방침 통신판매업신고번호를 신고번호로 교체
  - `terms/page.tsx:371`, `privacy/page.tsx:455` → `제2026-성남분당B-0854호`
  - 같은 커밋에 legal.md 결정 3건, known-issues 사업자 정보 항목 갱신, CHANGELOG
  - eye 검증: build 정적 페이지 32/32, lint 12 errors + 3 warnings(기준선 동일)
  - push 후 Vercel Ready 확인, `app.congre.kr/terms`·`/privacy` 실화면 새 번호 확인
- `eaf36c6` docs: 랜딩 신고번호 교체·배포 제외 규칙 신설 기록 + L14 해소
  - L14 → known-issues-resolved.md 이동, L8 확인 항목 ④ 갱신·⑤ 추가, landing.md (22), CHANGELOG, CLAUDE.md 학습 룰 2건

### 랜딩 (git 밖, `congre-landing`)
- 신고번호 교체 4곳: index.html:3767 푸터, about.html:179 본문·:231 푸터, faq.html:329 푸터
- 백업: `index_pre_bizno_backup.html`·`about_pre_bizno_backup.html`·`faq_pre_bizno_backup.html`
- `.vercelignore` 신설(차단 목록 방식): `.env*`, `.vercel`, `*.md`, `handoff/`, `*_backup.html`, `*.bak`, `*.backup`, `Landing v*.html`, `index_v*.html`, `Pricing Card.html`, `screenshots/`, `.thumbnail`, `uploads/*.mp4`, `uploads/*.png`, `uploads/*.jpeg`
- 배포: Inspect `8ZUXbWKetrVtJk2dz9XTRh1TSEMp`, Aliased `https://www.congre.kr`
- 실측(시크릿 창) 전부 통과: 현행 페이지 4개·`uploads/*.jpg` 5개·`.image-slots.state.json` 정상 / `CLAUDE.md`·백업·`.backup`·`.env.local`·uploads 하위 `.md`·스크린샷·시안·uploads mp4 전부 404

## 3. 이번 세션 결정 (Ray)

- 사이트 주소 표기 유지. 신고증 표기와 형식만 다르고 같은 주소(Ray 확인)
- 약관·개인정보처리방침 시행일 `2026년 9월 1일` 유지. 사실 정정으로 처리. 법률 자문을 거친 판단은 아님
- 사업자 정보 공유 상수 추출 안 함(YAGNI). 남은 트리거: 070 유선번호 신청 시
- 랜딩 배포 제외 규칙은 차단 목록(A) 방식. 허용 목록(B)은 기각
- uploads의 png 62개·jpeg 1개도 제외 규칙에 추가

## 4. Shotstack 2차 회신 (진행 중)

- 이메일 재발송에도 사람이 아니라 AI 상담원이 답했다. "이메일이면 사람이 받는다"는 전제는 틀렸다.
- 회신 판정:
  - 계약서와 일치해 확인으로 받음: 표준 사전 점검 통보 기간 없음(72시간은 크레딧 제외 기준), 장애 통보 시점 약속 없음, 멈춘 렌더는 SLA 자동 포함 아님
  - 미해결: 출력 보관 질문을 "임시 URL 24시간 만료"로만 답해 Shotstack destination 보관 여부는 여전히 미확인
  - 계약서와 충돌(채택 안 함): 크레딧 이월 3배(계약 3.3조는 월말 소멸), 유료 구독 시 비활동 삭제 면제(8.4조에 예외 없음으로 요약돼 있음), SLA 청구 기한 10일(5.2조는 7일)
- 사람 담당자 서면 확인을 요청하는 답장을 발송했다(Ray, 2026-09-16. 위 충돌 3건 + destination 질문). 발송 전 3.3·8.4조 원문 대조 여부는 확인하지 못했다.

## 5. 남은 일

| 순서 | 항목 | 상태 |
|---|---|---|
| ② | 라이브 키 교체 정찰 (Shotstack destination 설정 여부 포함) | 프롬프트 작성됨(직전 핸드오프), 미실행 |
| ③ | 유료 개시 전 필수 2건 (클립 0개 결제 후 렌더 실패, 409 재발행 경로) | 미착수 |
| ④ | 라이브 키 교체 | ②③ 뒤 |
| 별도 | Shotstack 사람 담당자 회신 | 답장 발송 완료, 회신 대기 |

## 6. 학습·패턴

- 배포 CLI 출력의 `Ready`·`Aliased` 확인 전에 실측하지 않는다. 이번에 로그인이 풀려 에러로 멈춘 배포를 모르고 실측부터 해 오판할 뻔했다(CLAUDE.md 학습 룰 등재).
- 이 PC의 Vercel CLI는 패키지·로그인이 사라질 수 있다. 재로그인은 `npx vercel login`(디바이스 코드 방식). `vercel deploy --temporary`는 congre.kr에 반영되지 않으니 쓰지 않는다.
- `grep -c`는 줄 수를 센다. 한 줄에 여러 번 나오는 문자열의 기대값은 `grep -o … | wc -l`로 잡는다.
- CC 보고를 터미널에서 복사하면 긴 줄이 잘리거나 블록이 겹친다. 검증은 짧은 출력(`--stat`, `grep -o | wc -l`) 위주로 요청한다.
- 전수 검색이 추정 목록을 이겼다. 핸드오프의 "추정 4곳"은 6곳이었다(faq 푸터·about 본문 누락).

## 7. 미확인

- uploads의 png 62개 내용 — 본 적 없음. 차단됐으므로 공개 노출은 해소.
- `.vercelignore`가 있을 때 Vercel이 `.gitignore`를 함께 따르는지 — 모름. `.env*`·`.vercel`을 규칙에 직접 넣어 우회.
