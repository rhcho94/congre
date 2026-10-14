# 핸드오프 2026-10-14 (오전) — 자체 렌더 엔진 `congre-engine` 구축·서울 첫 배포

작성: 채팅 클로드 코난. 다음 세션은 이 문서 + 직전 핸드오프 `2026-10-13-handoff-color-c-hero-engine-recon.md` + 프로젝트 문서 `claude/pending-backlog.md`(M절) + 플레이북 제2판(Ray 보관)으로 시작.

## 1. 한 줄 요약
필드샷 엔진을 복사해 `rhcho94/congre-engine`을 만들고(골프 제거·콩그레 모양·이름 교체), 엔진 전용 IAM 사용자·ECR·스택까지 서울에 첫 배포했다. 점검 함수 ok. 앱은 아직 Shotstack으로 렌더한다 — 다음은 ④ Shotstack과 나란히 비교.

## 2. 커밋

### 엔진 레포 `rhcho94/congre-engine` (비공개, 로컬 `C:\projects\congre-engine`)
| 해시 | 메시지 | 내용 |
|---|---|---|
| `ac008d1` | (필드샷 엔진 복사, 30커밋) | 출발점 |
| `893f067` | refactor: remove golf-only features (analyze, highlight, scorebar, caster, content rotation) | 14파일 +15 −1,139. 빈 필터 FFmpeg 버그 수정 포함 |
| `50e75c6` | feat: apply Congre look — dark background, white text, fades restored, Congre watermark | 2파일 +23 −16 (워터마크 PNG 포함) |
| `55abedd` | chore: rename to congre-engine and point at congre-videos-kr | 5파일 +39 −30 |

방식: 코난이 작업 공간에서 수정·시험 → 패치 + 트리 지문(`git write-tree`) → PC 다운로드 폴더에 넣고 sha256 대조 → CC가 `git apply --index` 후 지문 대조 → 커밋·push. 세 커밋 모두 지문 일치, 코난이 GitHub에서 독립 대조.

### 앱 레포 `rhcho94/congre`
| 해시 | 메시지 |
|---|---|
| `3b83030` | docs(handoff): 2026-10-13 color system C, hero rework, engine recon (+ eye baseline 11→12, resolved L16 정리) |
| (이 문서) | docs: engine first deploy — decisions, changelog, handoff (2026-10-14) |

## 3. 결정 (Ray, 상세 decisions/infra.md 2026-10-14)
- D1 전환: 페이드 3종 + zoom은 배경색 페이드 복원, 밀기 2종은 실제 밀기 유지
- D2 색·글자: 콩그레 Shotstack 값(배경 `#0C0B09`, 글자 흰색 64, 이름 흰색 36·테두리 4·바닥 120px 추정, 워터마크 "made by Congre" 나눔펜 52 흰색 60%)
- D3 하늘·잔디 회전 판단 제거 / D4 소리 정리 유지(④에서 귀로 판단) / D5 필드샷 커밋 기록 유지
- ②③ 한 커밋으로 합침 (반쯤 지운 상태를 커밋하지 않으려고)

## 4. 실측·발견
- **필드샷 엔진의 숨은 버그**: 이름 없음 + 페이드(컷) 클립은 필터 줄이 비어 FFmpeg 실패(`[f],setparams…` Filter not found). 콩그레는 "이름 끔 + 부드럽게"면 클립 전부 실패할 뻔했다. `null` 필터로 수정. **필드샷 쪽 알림 여부는 Ray**.
- **D3 실측 근거**: 필드샷 코드가 시험용 가로 색 막대 영상 2개를 ccw로 돌림(margin 0.38·0.39 > 기준 0.3).
- 변경 전후 FFmpeg 명령 문자열 대조(작업 공간 FFmpeg 6.1): 세로 클립·카드·사진·영상은 완전히 같음. 다른 것은 회전 제거·빈 필터 수정 두 가지뿐.
- 레포 `public/fonts/NanumPenScript-Regular.ttf`는 영문만 든 축약본 — 워터마크 PNG는 이걸로 그렸다(영문뿐이라 충분).
- GitHub 레포가 처음엔 `rhcho94-congre-engine`으로 만들어졌다(이름 칸에 계정명 포함) → Rename. PC `git ls-remote`는 "Repository not found"만 보여 이름 문제와 권한 문제를 못 가른다 — 코난의 저장소 목록 조회로 찾음.
- AWS 콘솔 우상단 "글로벌"(IAM·Support)과 지역 서비스(Lambda·ECR·S3)의 차이 — Ray 질문, 정상.
- 엔진 `samconfig.toml`·`README.md`는 `congre-engine` 기준. `필드샷` 언급은 출처 4곳에만 남김(의도).

## 5. AWS 상태 (계정 783837106823, 서울 ap-northeast-2)
| 항목 | 값 |
|---|---|
| IAM 사용자 | `congre-engine-deployer` (콘솔 로그인 없음, 액세스 키 1개 — Ray PC 프로필 `congre-engine`에만) |
| IAM 정책 | `congre-engine-deployer` (고객 관리형, 필드샷 정책과 이름만 다름. 사본: `C:\Users\PC\Downloads\engine-aws\congre-engine-deployer-policy.json`) |
| ECR | `783837106823.dkr.ecr.ap-northeast-2.amazonaws.com/congre-engine` |
| 스택 | `congre-engine` CREATE_COMPLETE (11:52) |
| 작업 지휘 ARN | `arn:aws:states:ap-northeast-2:783837106823:stateMachine:congre-engine-render-job` |
| 함수 | `congre-engine-selfcheck` · `congre-engine-render-clip` · `congre-engine-merge` |
| 시험 버킷 | `congre-engine-test-783837106823` (7일 자동 삭제) |
| Lambda 동시 실행 | 1,000 (필드샷과 공유) |
| Lambda 메모리 상한 | 3,008MB. 증액 요청은 지원 사례에 없음(베이직 플랜 추정) — 막히면 그때 |

## 6. 미완 — 다음 세션 가장 먼저 (④ Shotstack과 나란히 비교)
1. **Ray 콘솔**: `congre-videos-kr` 수명 주기 규칙 `engine-jobs-1day`(접두사 `engine-jobs/`, 1일 뒤 삭제). 플레이북 5-2 ②.
2. **실사이트 무료 시험 행사 1건**: 클립 3~5개 — 가로 영상, 이름 있는/없는 클립, "부드럽게" 전환을 섞는다 → 마감 → Shotstack 완성본(버킷 맨 위 `{renderId}.mp4`). 겸사겸사 Shotstack 비상구가 새 버킷에서 도는지도 확인(10/13 핸드오프 미검증 항목).
3. 같은 클립 키로 엔진 작업 입력 JSON을 만들어 `aws stepfunctions start-execution --profile congre-engine`로 돌림 → `renders/` 완성본 → Ray 눈·귀 비교 (이름 자막 크기 D2, 소리 정리 D4).
   - 클립 키는 Firestore 행사 문서나 S3 목록에서. 코난은 Firestore·S3를 직접 못 본다 — Ray 콘솔 캡처 또는 CC 정찰.
4. 그다음: ⑤ 앱 교체 커밋 + 30분 상한 커밋(따로) → ⑥ 실사이트 무료·유료 시험 → ⑦ Shotstack 정리 → ⑧ 처리방침.

## 7. 다음 세션 후보
- (상) 위 6절
- (중) 앱 IAM `congre-s3-user`에 엔진 작업 지휘 StartExecution·DescribeExecution 인라인 정책 + Vercel `ENGINE_STATE_MACHINE_ARN` — ⑤ 직전
- (중) 필드샷 쪽에 빈 필터 버그 알림 (Ray 판단)
- (하) 랜딩·앱 이름 자막 등 Shotstack 값과의 차이는 ④에서 한꺼번에

## 8. 학습
- 복사 출발점은 "이름이 같다"가 아니라 "같은 입력으로 같은 명령이 나오는가"로 대조한다. 명령 문자열 비교가 바뀐 곳과 안 바뀐 곳을 동시에 증명했다.
- PNG는 파일 전송 중 재압축될 수 있다 — 지문 대조가 필요한 바이너리는 `git diff --binary` 패치 안에 텍스트로 담아 보낸다.
- 필드샷에서 검증된 IAM 정책은 처음부터 쓰지 말고 읽어 와서 이름만 바꾼다. 바뀐 곳이 이름뿐인지 diff로 증명한다.
