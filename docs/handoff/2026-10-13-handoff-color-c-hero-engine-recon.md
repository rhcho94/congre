# 핸드오프 2026-10-13 (밤) — 랜딩 히어로 개정 · 색 체계 C(랜딩+앱) · 엔진 정찰 끝, 새 레포 전 단계

작성: 채팅 클로드 코난. 다음 세션은 이 문서 + 직전 핸드오프 `2026-10-13-handoff-domestic-s3-seoul.md` + 프로젝트 문서 `claude/pending-backlog.md` + 플레이북 제2판(Ray 보관)으로 시작.

## 1. 한 줄 요약
엔진 정찰(필드샷 `ac008d1` 기준 골프 전용 기능 목록·제거 순서·결정 5건)을 끝내고 새 레포 만들기 직전에서 멈춤. 그 사이 Ray 요청으로 랜딩 히어로(문구 한 줄·전부 폰으로·폭죽+확대)와 색 체계 C(네이비 + 코랄 주 버튼 + 크림)를 랜딩·앱 모두에 적용·배포·라이브 확인했다.

## 2. 커밋 (base `a2cb816`)

| 해시 | 메시지 | 내용 |
|---|---|---|
| `cef34c4` | style(theme): apply color system C — navy ink, coral CTA, cream ground | 13파일 +87 −69. globals.css 토큰·`--cta` 추가, BrandName·공유 로고·QR·성공 초록·메일 팔레트, 문서 5개 |
| `d3efb04` | chore(assets): regenerate logo images in color system C | 이미지 5개(og·logo·email·apple-icon·favicon) + L16 resolved 이동 + CHANGELOG |
| (이 문서) | docs(handoff): … | |

검증: 두 커밋 모두 코난이 GitHub `origin/main`에서 해시·파일 수·이미지 체크섬 독립 대조. 이미지는 코난이 PC 작업트리에 직접 넣고(픽셀 대조 완료) CC가 커밋만 했다.

랜딩(git 밖) 배포 2회: 21:48 `4v5num6a8`(히어로+색), 22:35 `4sgqlmfi3`(아이콘 2개). 둘 다 `✓ Ready`·Aliased. 코난이 라이브 `www.congre.kr` 본문·`site.css` 토큰 확인. 아이콘·앱 화면은 Ray 눈 확인(10/14 아침 "좋다").

## 3. 결정 (Ray)

### 엔진 (D1~D5, 전부 코난 추천대로)
1. **D1 화면 전환**: 페이드 3종 복원(필드샷 `5374c3b`이 컷으로 바꿨던 것) + 필드샷의 진짜 밀기는 유지. 콩그레 앱은 `TRANSITION_POOLS` soft=[fade, fadeSlow]를 실제로 쓰므로 복원 필수.
2. **D2 색·글자**: 엔진의 필드샷 값(배경 `#111C17`, 액센트 `#A8C69F`, 이름 52px/320px)을 콩그레 Shotstack 값(배경 `#0c0b09`, 글자 흰색 64, 이름 흰색 36·테두리 4·바닥 가운데)으로. Shotstack 36과 엔진 자막 단위가 1:1인지는 모름 → ④ 비교에서 눈으로.
3. **D3 회전 판단 제거**: 하늘·잔디 비율로 위쪽 판단하는 `content_rotation`(bake.py 243~306) 삭제. 실내 행사 전제 아님.
4. **D4 소리 정리 유지**: 바람 잡음·음량 통일·덕킹은 두고 ④에서 실제 콩그레 클립으로 귀 판단.
5. **D5 커밋 기록 유지**: 필드샷 30커밋을 그대로 물려받아 새 레포 생성(비공개).
- 워터마크: 콩그레 것("made by Congre" 나눔펜 52 흰색 60%)을 PNG로 새로 만든다 — 결정 아닌 할 일.

### 랜딩·앱
6. 히어로 문구 한 줄: "하객이 남긴 10초 축하 영상, 마감하면 **10분 안에 자동으로** 한 편이 돼요." "완성!" 도장 제거.
7. 색 체계 C 채택. 원칙: **구조(제목·선·테두리·포커스·링크)는 네이비, 행동(주 버튼)만 코랄**. 코난은 "AI 슬롭 재현"이라 솔직히 경고했고 레퍼런스 5곳(Partiful·Paperless Post·토스·Zola·Punkpost) 제시 뒤 Ray가 C로 확정. 상세 `decisions/design.md` 2026-10-13.
8. 앱 토큰 이름 대응: 랜딩 `--ink` = 앱 `--accent`(네이비), 랜딩 `--accent` = 앱 `--cta`(코랄). 값은 같고 이름만 다르다.

## 4. 실측·발견

### 엔진 레포 정찰 (`rhcho94/fieldshot-engine` `ac008d1`, 30커밋, 19파일)
- 지울 것: `analyze.py`(339) · `analyze_handler.py`(75) · `Dockerfile.analyze`(31) · `caster.py`(163) · `scorebar.py`(108) + `assets/fonts/` 굵은 글꼴 2개 · `bake.py` 하이라이트 구간(443~560) · 색감 `live`·`major` · `template.yaml`의 Caster·Analyze 함수·Bedrock 권한·작업 흐름 분석 갈래(Route·RouteHighlight·AnalyzeOne) · Dockerfile의 Pillow. 파일 5개 합 716줄.
- 그대로: 클립 굽기·합치기(BGM once/loop/다시 틀기)·카드·사진·영상·HDR·흐린 배경·4K 먼저 줄이기·30분 방어·실패 클립 건너뛰기·점검 함수. 클립당 100초 상한은 콩그레 paid와 같음(`plans.ts`).
- 이름 바꿀 것: `fieldshot-engine` → `congre-engine`(AWS 자원·IAM 범위·samconfig 스택·ECR), 기본 버킷 `congre-bible-mvp-videos` → `congre-videos-kr`.
- 핸드오프(10/13 낮)의 "기능 이름까지 같다"는 동작까지 같다는 뜻이 아니었다 — 페이드 건이 그 예.

### 히어로 개정 (`index.html`, 백업 `index_pre_heroflow_backup.html`)
- 10/30 시작 → 카드 5개 1초 간격(15) → 인사 글자 15개 0.11초 간격 다다다닥(30) → 300ms 뒤 폭죽 40개 + 폰 1.75배 → 제목 카드 → 10초 재생 → 반복. 코난 Playwright 실측: 30/30 시점 주변 요소 0개.
- 가운데 정렬 3개를 `transform:translateX(-50%)` → `translate:-50% 0`로 바꿈(날아가는 transform과 분리).

### 색 적용 범위
- 랜딩: `site.css` 토큰 14 교체 + `--accent/--accent-hi` 추가, `index.html` 인라인 색 전부, 로고 SVG 4페이지(선·워드마크 네이비, 재생 삼각형 코랄). 백업 `*_pre_colorC_backup.*` 5개.
- 앱: 정찰에서 하드코딩 색은 QR 2·성공 초록 5·공유 로고 4줄·BrandName 4자리·메일 4값뿐. 약관·처리방침은 토큰만 써서 자동.
- 이미지: 앱 5개 + 랜딩 2개(`apple-touch-icon.png`·`favicon.ico`) 새로 그림. 레포 `public/fonts/NanumPenScript-Regular.ttf`는 영문만 든 31KB 축약본(워터마크용)이라 한글 손글씨엔 못 씀 — 이미지는 전체 글꼴(npm `@fontsource/nanum-pen-script`)로 만듦.
- 요금 페이지 "추천" 글씨와 "시작하기" 버튼이 둘 다 코랄 — 한 카드에 포인트 2회. Ray가 10/14 "좋다"로 넘어갔으니 그대로.

### 기타
- `.claude/agents/eye` 정의의 lint baseline이 11로 적혀 있음. known-issues는 12(2026-08-15 상향). 판정엔 영향 없었음.
- CC가 python `\u` 이스케이프로 한글 문서를 편집하다 깨뜨렸다가(교체→교좴) `git checkout --`으로 되돌리고 Edit로 재작업. 결과는 깨끗.
- 색 대안 캔버스(Claude Design, "Congre 색 대안 3가지")는 참고용. 로고는 진짜 SVG가 아니라 흉내.

## 5. 미완 — 다음 세션 가장 먼저
1. **`congre-engine` 새 레포 만들기** (1-가·1-나 프롬프트는 10/13 21:16 메시지에 있음, 아직 실행 안 함)
   - Ray: GitHub에서 `rhcho94/congre-engine` **비공개·완전히 빈** 레포 생성 (README·.gitignore·license 전부 체크 해제)
   - CC 확인 프롬프트: `C:\projects\fieldshot-engine` git status / HEAD = `ac008d1ea28f71323cfb7026b66405af81175946` / origin/main 대조 / 커밋 수 30 / `git ls-remote` 새 레포 빈 것 확인 / `C:\projects\congre-engine` 폴더 없음
   - 그다음 실행 프롬프트(복사 → 원격 교체 → push)는 확인 보고 뒤 작성
2. 엔진 커밋 순서(결정됨): ① 복사 ② 골프 파일·함수·흐름 삭제 ③ bake.py 하이라이트·선수 바·회전 판단·골프 색감 제거 ④ 콩그레 값(페이드 복원·색·글자·워터마크 PNG) ⑤ 이름·버킷 교체. 여기까지 AWS 안 건드림.
3. AWS 준비 전 Ray 확인: Lambda 동시 실행(10→1,000)·메모리(3,008MB) 증액 승인 상태 — 아직 모름.

## 6. 다음 세션 후보
- (상) 엔진 1~5 → AWS 준비(IAM 사용자·ECR·첫 배포) → ④ Shotstack 나란히 비교
- (중) `known-issues-resolved.md` L16의 "남은 것: 랜딩 2개" 줄 삭제(이미 배포됨) — 다음 docs 커밋에 끼움
- (중) `.claude/agents/eye` baseline 11→12 정정
- (하) CLAUDE.md 학습 룰 후보: "한글 문서는 python `\u` 이스케이프로 편집하지 않는다 — Edit 도구로"
- (하) 앱 `globals.css`·랜딩 `site.css` 값이 같은지 주기 점검 (이름이 달라 grep으로 못 잡음)
- 백로그 L1·L2(휴대폰 번호 오류 안내·환경변수 trim)는 그대로 보류

## 7. 학습
- 색 "체계"를 만든 것과 "이 브랜드답다"는 다른 문제다. 색표 3장을 나란히 내밀면 전부 템플릿처럼 보인다 — 레퍼런스와 "쓰는 자리 규칙"이 먼저.
- 복사 출발점의 기능 대조는 이름이 아니라 동작으로 한다. 커밋 로그(`git log -S`)가 "왜 바뀌었나"를 가장 빨리 알려 준다.
- PC가 연결돼 있으면 코난이 파일을 직접 넣고 체크섬·픽셀로 대조한 뒤 CC는 커밋만 — 전달 사고가 없다. 단 PNG는 전송 중 재압축돼 바이트가 달라지므로 픽셀로 대조한다.
