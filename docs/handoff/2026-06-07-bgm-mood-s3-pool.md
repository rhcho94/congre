# 2026-06-07 — BGM 분위기 선택 기능 구현 (S3 곡 풀) + 진단 부산물 cleanup

## 한 줄 요약
BGM 1곡 고정 → 분위기 3종(calm/lively/epic) × S3 곡 풀에서 매 렌더 랜덤 픽 구조로 확장.
색감(videoFilter)이 깔아둔 [대시보드 select → Firestore → render/start → createRender] 레일 복제.
코드 완성·커밋·push 완료, UI·저장 검증 완료. 단 실제 렌더 동작 검증은 ⑦(렌더 막힘)에 묶여 대기.
세션 앞부분에 ⑦ 진단 부산물 cleanup도 완료.

## 본 세션 커밋 (본 앱 git)
- **186d935** `docs: add 2026-06-06 track7 shotstack handoff` — 6/6 핸드오프 커밋 누락분 박음 (push 완료)
- **8bd63b5** `feat: add BGM mood selection with S3 audio pool (calm/lively/epic)` — BGM 기능 4파일 (push 완료)
  - 4 files changed, 100 insertions(+), 5 deletions(-)

## 외부 작업 (이번 세션 실제로 바꾼 것)
- **S3 진단 부산물 6개 삭제** — `_diag-2026-06-06-{noacl,private,bofc}.txt` + `_diag-test-{noacl,private,bofc}.txt`.
  콘솔에서 삭제 (24.0B, 실패 0). 버킷 루트 정리 완료.
- **로컬 진단 스크립트 2개 삭제** — `tmp-diag-serve-prod.mjs` + `tmp-diag-acl.mjs` (둘 다 untracked, git 무관).
  핸드오프엔 1개만 적혀 있었으나 실제 2개 잔존(tmp-diag-acl.mjs는 누락분).
- **S3에 BGM 곡 1개 업로드** — `audio/lively/lively_o1.mp3` (기존 bgm.mp3와 동일 곡, 경쾌 톤).
  파일명 `lively_o1`은 알파벳 o 오타지만 코드 동작 무관(폴더 list로 .mp3 전부 잡음). 그대로 둠.
- 로컬 `public/audio/lively_o1.mp3`(S3 업로드용 사본) 삭제. `public/audio/bgm.mp3`는 폴백용으로 유지.

## 본 세션 결정·발견

### BGM 분위기 기능 — 최종 사양
- **분위기 3종**: calm / lively / epic. 기본값 **lively**.
- **곡 인식 = S3 동적 조회** (하드코딩 배열 아님). 렌더 시 `audio/{mood}/` 폴더를 ListObjectsV2로 조회,
  .mp3 중 랜덤 1곡 → 24h presigned URL → soundtrack src. 곡을 S3에 던지면 코드 수정 없이 풀에 들어감.
- **폴백 3단**: 선택 mood 폴더 비었으면 → lively 폴더 → 그것도 비었으면 → bgmSrc undefined
  → shotstack.ts가 기존 public/audio/bgm.mp3로 폴백. 곡 0개여도 렌더 안 깨짐.
- **호스트는 분위기만 선택, 곡은 시스템 랜덤** (B-1). 곡 미리듣기 UI 안 만듦 (YAGNI).
- **호스트 = 곡 지정**(B-2)은 미채택 — 미리듣기 인프라 필요해서 보류.
- effect "fadeInFadeOut" / volume 0.1 그대로 유지.

### 곡 호스팅 = S3 분리 (결정)
- 곡 30개(3종×10곡 목표) 시 약 110MB. public/audio/면 git+Vercel 배포에 통째로 박혀 저장소 부풀음
  (현재 .git 81M, 되돌리기 어려운 부채). S3 분리로 git·배포 깨끗 + 곡 교체가 S3 업로드만으로 끝.
- **기술 리스크 0** — 참가자 영상·intro·outro 미디어가 이미 전부 S3 presigned(getSignedUrl, 24h)로
  Shotstack에 전달 중. BGM은 옆 코드 복제. 오히려 기존 public BGM이 코드베이스에서 혼자 튀던 예외였음.
- 키 경로 규칙: `audio/{mood}/파일명.mp3` (분위기별 폴더).

### 검증 상태 (중요)
- ✅ **빌드·린트 통과** — build green(28 routes), lint 11 errors/3 warnings = delta-0 (신규 0).
- ✅ **UI·저장 검증** — 운영자가 이벤트 상세 "영상 스타일" 카드에서 음악 분위기 select 노출 확인.
- ⏳ **실제 렌더 동작 미검증** — 렌더가 ⑦(S3 copy 막힘)에 묶여 불가. ⑦ 풀리면 즉시 검증.
- 함정 메모: 현재 lively 곡(lively_o1.mp3)이 기존 bgm.mp3와 동일 곡이라, 렌더해도 S3에서 왔는지
  폴백인지 소리로 구분 불가. 진짜 검증은 (a) Vercel 로그에 `[render/start] bgm pick failed` 없는지
  확인 또는 (b) calm/epic에 다른 곡 올린 뒤 그 분위기로 렌더해 소리로 구분.

### ⑦ Shotstack 지원 답신 (6/07 진전)
- Shotstack이 IAM 정책에 PutObjectAcl 명시 + 직접 bucket-owner-full-control 테스트 통과를 확인하고,
  두 질문(① worker가 실제 로드한 Access Key ID가 새 키 ...GC6GRG 맞는지 ② 그 403의 raw S3 에러코드 +
  AWS Request ID + Extended Request ID)을 코어 엔지니어링에 재격상. 여전히 "로그 대기 중" = 외부 대기.
- 진단 방향이 운영자 인프라 쪽으로 안 돌아가게 잘 묶임. 운영자 추가 액션 없음, 추가 답신도 불필요.
- 가설(확정 아님): destinations(고객 S3 직접 복사) 기능이 6/4 도입 = 상대적 새 기능. 우리 조합
  (리전+버킷설정+rotate 타이밍)에서 안 걸러진 그쪽 문제를 밟았을 가능성. 단 키 전파 지연/설정 상호작용
  등 다른 가능성도 열림. raw 로그 와야 확정. 한 가설에 가두지 말 것.

## 미완 / 대기 (다음 세션 우선순위)

1. **⑦ Shotstack raw 로그 답신 대기** (외부, 운영자 액션 없음) — 코어 엔지니어링 로그.
   답신 분기: 등록 키가 옛 키면 → 재등록 실효 문제 / 새 키 맞는데 거부면 → 완전히 Shotstack 버그 확정.
2. **BGM 실제 렌더 검증** — ⑦ 풀리면 즉시. lively 외 분위기 곡 올린 뒤 분위기별 곡 교체 확인.
3. **② 앱 고착 해소** — rendering 박힌 이벤트 6개+. ⑦ 해결 시 cron HeadObject 통과로 자동 복구. ⑦과 묶음.
4. **BGM 곡 풀 채우기** (운영자, 코드 무관) — calm/epic 곡 확보 + S3 audio/{mood}/ 업로드.
   lively도 추가 곡 환영. S3에 던지면 자동 반영.
5. **public/audio/bgm.mp3 정리** — ⑦ 풀리고 BGM S3 경로 동작 확인된 뒤. 폴백 의존 끊고 git 부채 해소.
   지금 지우면 폴백 깨지니 금지.

## 다음 세션 후보 (우선순위)
- (대기) ⑦ raw 로그 답신 → 그에 따라 분기
- (대기) BGM 렌더 검증 — ⑦과 동시
- (중) ② 앱 고착 해소 — ⑦과 동시
- (소) BGM 곡 풀 채우기 (운영자 병렬, 코드 무관)
- (소) public/audio/bgm.mp3 정리 (BGM S3 동작 확인 후)
- (소) 버킷 Object Ownership 복원 (BucketOwnerEnforced ← Bucket owner preferred, ⑦ 해결 후 판단)

## 본 세션 학습
- **두 트랙이 같은 경로를 공유하면 한쪽 막힘이 다른쪽 검증을 막는다** — BGM 검증을 "실제 렌더"로
  제안했다가 ⑦이 렌더 경로를 막고 있음을 운영자가 지적. 트랙 분리해 사고하되, 검증 단계에서 공유
  의존성(렌더 경로) 점검할 것.
- **"S3 규칙은 표준이고 일관됨"이 우리 편** — 같은 키·버킷에 우리 PutObject는 통과, Shotstack은 거부.
  S3가 일관 동작한다는 게 오히려 "차이는 Shotstack이 보낸 요청에 있다"를 증명. Access Denied 뒤의
  raw 에러코드(키 무효 / 서명 불일치 / 헤더)가 어느 경우인지 가름.
- **첨부 안 된 영역을 "없다"로 단정 금지** — CC recap의 "live lottery" 기능을 환각으로 단정했으나
  실제 구현됨(898b4d1 커밋). 컨텍스트에 안 보이면 "모른다"까지, "없다"로 한 단계 더 단정 X.
- **CC ※ recap 금지 무시 — 본 세션 4회 누적** — 프롬프트 최상단 명시에도 반복. per-prompt 한계 확인.
  CLAUDE.md 절대 규칙 레벨로 격상 검토 필요 (다음 세션 후보).

## CC recap 패턴 메모 (별건, 처리 후보)
본 세션 CC가 ※ recap을 4회 붙임 (cleanup 2회 중 "live lottery" 환각 1회 + 커밋·구현). 프롬프트 최상단
금지에도 무시. 메모리에도 기록된 반복 패턴. per-prompt 지시로 안 잡히니 CLAUDE.md 절대 규칙에
"보고 끝에 어떤 형태의 요약/recap/다음단계도 금지" 명시 추가가 다음 후보.
