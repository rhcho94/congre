# 2026-06-03 — OneDrive 이전 (L6) 트랙

## 한 줄 요약
본 앱 로컬 폴더를 OneDrive 안(`C:\Users\PC\OneDrive\바탕 화면\my-project\congre`)에서
OneDrive 밖(`C:\projects\congre`)으로 이전. git clone 방식. 빌드 통과 확인, 문서 정정 완료.
L6 해소 종료.

## 본 세션 커밋
- `df7b33c` docs: relocate app to C:\projects\congre (out of OneDrive), resolve L6
  - 3 files changed, +18/-18
  - CLAUDE.md(경로 1줄), known-issues.md(L6 17줄 제거), known-issues-resolved.md(L6 이동 + 해소 줄)

## 본 세션 한 일 (사실 그대로)
- **이사 방식: A(새 클론)** 채택. 이유: B(통째 복사)는 `.next`(지난 잠금 폴더)·node_modules를
  같이 복사해 이사 목적이 무의미해짐.
- `git clone https://github.com/rhcho94/congre C:/projects/congre` → 마지막 커밋 a2353a1 일치 확인.
- 옛 폴더의 `.env.local` + `.env.local.example` 두 개를 새 폴더로 cp.
- `npm install` 성공(691 packages). `npm run build` 성공(전 라우트, 에러 0). → **이사 목적(OneDrive 밖 빌드) 달성 증거.**
- 운영자가 CC를 새 폴더에서 재실행, `pwd` = `C:/projects/congre` 확인.
- 문서 정정: grep으로 옛 경로 박힌 위치 전수 조사 → 현재 상태 문서(CLAUDE.md)만 정정,
  과거 기록(handoff/*, plans/*)은 역사 보존 원칙으로 그대로 둠. .gitignore OneDrive 주석도 유지.

## 미완 / 다음 세션 첫 확인 항목
- **옛 OneDrive 폴더 아직 살아있음** (백업용 잔류). `C:\Users\PC\OneDrive\바탕 화면\my-project\congre`.
  → 며칠 새 폴더로 빌드·배포·CC 문제없으면 그때 삭제. **다음 세션에서 "삭제했나/계속 둘까?" 확인.**
- 삭제 전, git에 안 올라간 로컬 파일이 `.env*` 말고 또 없는지 한 번 더 점검하면 안전
  (이번엔 git status clean이라 거의 없을 것으로 봤으나, 삭제는 되돌릴 수 없으니 신중).

## 다음 세션 후보 (이월 + 신규)
- ★ ⑦ 완성본 /share OG + Shotstack→S3(B). 선행: 운영자 Shotstack Integrations에 S3 등록(전용 IAM 키).
- **(신규) npm audit 16건** (1 low / 13 moderate / 2 high). 이사로 생긴 게 아니라 원래 있던 것.
  지금 `npm audit fix` 하면 라이브러리 버전 멋대로 올라 빌드 깨질 수 있어 보류함. 별도 트랙으로 신중히.
- CLAUDE.md lint 게이트 문서 불일치(문서 "errors 0" vs 실제 baseline). 고치기 전 `npm run lint` 실측 1회 필요.
- (열린 질문) 앱 소개 문서 — 용도 미정.

## 본 세션 학습 (프로세스)
- **"문서에 적힌 경로" ≠ "실제 박힌 위치".** 경로 정정 전 grep 전수 조사로 어디 박혔는지 실측한 뒤,
  현재 상태 문서만 고치고 과거 기록은 보존. 추측으로 "이 두 파일이겠지" 하면 빠뜨림.
- **CC가 옛 프롬프트 반복 + recap 메타 코멘트 붙인 사례 1회** (세션 초반). CLAUDE.md "메타 코멘트 금지"
  위반. 새 프롬프트가 안 들어가면 같은 출력이 반복됨 — 출력이 직전과 동일하면 "프롬프트 들어갔나" 먼저 확인.
