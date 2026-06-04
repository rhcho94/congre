# 2026-06-04 — ⑦ 완성본 Shotstack→S3 이전 (presigned) — S3 전송 미작동 추적 중

## 한 줄 요약
⑦ 완성본을 Shotstack CDN → 우리 S3로 이전 + presigned 서빙으로 결정·구현 완료(코드·docs 커밋됨).
그러나 **실측에서 완성본이 S3에 안 떨어지는 문제 미해결.** 권한 문제는 배제됨. 다음 세션은
"Shotstack→S3 전송(serve)이 왜 실패하나"를 production 키로 직접 조회하는 데서 시작.

## 본 세션 커밋 (모두 push 완료, 현재 HEAD = 74dbc12)
- `d55da3a` docs: record decision for Shotstack→S3 migration and public serving (track 7)
- `f3c817f` docs: add missing handoff for onedrive relocation (df7b33c) — 직전 트랙 누락분 정리
- `74dbc12` feat: serve completed videos via presigned URLs instead of public S3 (track 7)
  - 13 files. shotstack.ts(destination 추가, acl 제거), check-rendering(HeadObject로 S3 확인 +
    videoS3Key 저장 + 알림은 /share 링크로), s3-server.ts(getVideoPresignedUrl 헬퍼),
    share/page(presigned 발급), host API(presigned 발급), events.ts(videoS3Key 필드), 외 정리.
- 작업 트리 clean. 이후 진단(정찰·Serve API 호출)은 전부 읽기 전용, 커밋 없음.

## 결정 사항 (decisions/data-flow.md 2026-06-04, 16개)
- (가) Shotstack→S3 destinations 채택. 저장 위치는 현행 videoUrl→**videoS3Key**(객체 키)로 변경.
  D2 서브컬렉션 전환은 결제 코드 이후로 미룸.
- (나) 서빙 방식: **presigned (1시간 만료)**. 세션 중 public → presigned로 선회.
  선회 트리거: ① public-read fetch HEAD 403 실측 ② 미성년자 영상 통제력.
  알림(메일·SMS·알림톡)은 S3 직접링크 대신 `/share/{eventId}` 페이지 링크 사용(만료 회피).
- 미성년자 리스크 꼬리표: 영업 진입 전 만료 단축·로그인 게이트·다운로드 차단 법무 검토 묶음.

## 외부 설정 완료 상태 (이번 세션에 한 것 — 다음 세션에서 재확인 불필요, 단 ★ 항목 제외)
- **AWS IAM**:
  - 사용자 `shotstack-s3` 신규 생성 (콘솔 로그인 없음, 전용 키).
  - 정책 `shotstack-s3-write`: s3:PutObject/GetObject/PutObjectAcl
    + (세션 후반 추가) AbortMultipartUpload/ListMultipartUploadParts/ListBucket/
    ListBucketMultipartUploads/GetBucketLocation. (객체는 `.../*`, 버킷레벨은 버킷 ARN로 분리)
  - 정책 편집 시각 22:09 KST 반영 확인.
- **Shotstack PRODUCTION**: Integrations → AWS S3 = `Connected` (저장 성공 배너 확인).
- 버킷 `congre-mvp-videos`, 리전 `ap-southeast-2` (버킷 목록에서 직접 확인).
- ★ **미확인(다음 세션 1순위)**: Shotstack Connect에 실제로 등록된 Access Key ID가
  `shotstack-s3` 사용자 키가 맞는지 끝까지 대조 안 함. (계정에 IAM 사용자 2개 존재:
  `shotstack-s3`(전용) + `congre-s3-user`(앱용, AmazonS3FullAccess, 오늘도 사용 중))

## 핵심 미해결 문제 (사실만)
- Shotstack 렌더 status = done. 출력 임시 URL은 `shotstack-api-**v1**-output...` → **v1=production 환경**.
- Shotstack 대시보드 PRODUCTION "My Renders" 해당 render 상세 → output 자산 표기 `s3 • 0 B`.
  (자산 클릭해도 전송 에러 상세 안 나옴.)
- S3 버킷 `congre-mvp-videos` 루트: `events/` 폴더(과거 참가자 클립)만 있음.
  완성본 `<renderId>.mp4` **객체 아예 없음** (0바이트짜리도 없음 = 전송이 시작도 못 함).
- 우리 cron(check-rendering)의 인증된 HeadObject → **404**(객체 부재), 위와 정합.
- render 요청에 destinations 정확히 실림: provider s3, region ap-southeast-2, bucket congre-mvp-videos.
  (옛 render 7e0ea991엔 acl:public-read 박혀있었고, 새 render 08ff5351엔 acl 없음 — 우리 코드 변천 반영.)
- `provider: shotstack, exclude: true`는 **안 넣음** → Shotstack CDN 사본은 기본 유지되는 설정.
- render detail의 render-level `error: ""` (렌더 자체 에러 없음).

## 가설 검토 (다음 세션이 헷갈리지 않게 — 살아있는 것 vs 죽은 것)
- **[죽음] 권한 부족**: 아님. congre-s3-user=FullAccess, shotstack-s3도 멀티파트까지 충분.
- **[죽음] 멀티파트 권한 누락**: 권한 추가했으나 멈춘 render는 추가 전 거라 검증 불가 + 객체가
  0바이트도 아닌 "전무"라 멀티파트 중단(부분 업로드)과 증상 불일치. 원인 아닐 가능성 큼.
- **[약함] 환경 불일치(stage vs prod)**: 렌더 출력 URL이 v1(production)이라, 렌더는 production에서
  돈 것으로 보임. S3 등록도 production이라 환경은 맞는 듯 → 이 가설은 약해짐.
  (Serve API 404는 CC가 로컬 **stage 키**로 production render를 조회해서 난 것 — 환경 진단 아님.)
- **[★살아있음 1순위] Shotstack Connect에 등록된 키가 잘못/오타/엉뚱한 사용자**: 객체가 전무 +
  뚜렷한 에러 안 뜸 → 자격증명이 안 맞아 전송 자체가 안 일어나는 정황과 가장 부합.
  (Shotstack 문서상 키 틀리면 "No S3 credentials found" 에러가 나야 하나, 우리는 그 에러를
   제대로 된 채널에서 확인한 적 없음.)
- **[살아있음 2순위] Shotstack serve/copy 단계 실패**: 커뮤니티에 동일 증상("Serve error — Failed
  to copy file to S3", render는 done인데 S3 전송만 실패) 보고 있음. Serve API/Edit detail의
  destinations 상태 필드에 사유가 있을 것.
- **[미확인] 버킷 Object Ownership / 버킷 정책**: 기존 클립 소유자가 긴 캐노니컬 ID였음.
  다른 principal 쓰기 거부 가능성 — 단 보통 에러로 뜨지 침묵 0바이트는 덜 전형적. 후순위.

## 다음 세션 첫 작업 (이 순서로, IAM 헤매지 말 것)
1. **Shotstack Connect 등록 키 확정**: Shotstack 대시보드 PRODUCTION → Integrations → S3
   Configure에 들어있는 Access Key ID가 `shotstack-s3` 사용자 키와 일치하는지 끝자리까지 대조.
   (IAM → shotstack-s3 → 보안 자격 증명에서 키 ID 확인 후 비교.) 불일치면 → 거기서 끝.
2. **전송(serve) 실패 사유 직접 조회 (production 키로)**:
   - Serve API: `GET https://api.shotstack.io/serve/v1/assets/render/{renderId}` (x-api-key = **production** 키)
     ※ 이번 세션 CC는 로컬 stage 키로 호출해 404. 반드시 production 키로 재시도.
   - 또는 Edit detail: `GET https://api.shotstack.io/edit/v1/render/{renderId}` 전체 응답의
     `data.output.destinations[].status` 필드에 전송 상태/에러가 있는지.
   - 둘 중 하나에 "Failed to copy" / "No S3 credentials" / "Access Denied" 등 사유가 나오면 원인 확정.
3. (1·2로 안 갈리면) 버킷 Object Ownership / 버킷 정책 확인.
- 멈춘 render 2개(`08ff5351-79df-4d2e-8820-194c01f30d52`, `7e0ea991-aedd-4fcc-9652-bf5f4de39031`)는
  죽은 것 — 살리려 말고 새 테스트 렌더로 검증. 거슬리면 Firestore에서 status만 바꿔 cron이 그만 보게.
- 신규 이벤트 `iyX3pk0O0Gwhfs7SD8SN`도 로그에 404로 등장 — 동일 문제로 멈춰있을 것.

## 검증 미완 (S3 전송 풀린 뒤 해야 함)
- presigned 서빙 코드(74dbc12)는 배포됐으나 **end-to-end 미검증**: 아직 S3에 도달한 완성본이
  없어서 /share·대시보드 presigned 재생을 한 번도 확인 못 함. S3 전송 풀리면 즉시 확인.

## 곁가지 발견 (이번 문제와 무관, 별도 정리 대상)
- **도메인/환경변수 드리프트**: render 요청에 `congre-three.vercel.app`이 박힘
  (NEXT_PUBLIC_APP_URL). 그러나 실제 Vercel 프로젝트는 `congre`(app.congre.kr).
  CLAUDE.md 환경정보도 `congre-three`로 적혀있음 → 문서·환경변수 정정 필요.
  (입력 에셋은 정상 로드돼 영상은 완성됐으므로 0바이트와 직접 무관.)
- **lint baseline 실측 = 11 errors + 3 warnings** (이번 세션 확인). CLAUDE.md "errors 0" 문서
  불일치 정정 시 이 값 사용.
- IAM `shotstack-s3`는 전용 최소권한 유지 방침(세션 중 "FullAccess congre-s3-user 키로 바꾸자"는
  제안 나왔으나 자기모순이라 폐기 — 전용 키 유지가 맞음).

## 다음 세션 후보 (이월)
- ⑦ S3 전송 문제 해결 (최우선, 위 첫 작업)
- ⑦ Part A: /share OG 썸네일 개선 (현재 정적 로고. presigned 전환과 무관하게 미착수)
- 도메인/환경변수 드리프트 정정 (congre-three → congre)
- CLAUDE.md lint 게이트 문서 정정 ("errors 0" → "delta 0, baseline 11 errors/3 warnings")
- 옛 OneDrive 폴더 삭제 여부 (직전 트랙 이월, 아직 미삭제)
- npm audit 16건 (별도 트랙, 신중히)

## 본 세션 학습
- **에러를 담은 "채널"부터 찾을 것.** Shotstack 대시보드 Overview엔 전송 에러가 안 뜬다 — serve
  에러는 Serve API/Edit destinations 필드에 있다. 그걸 안 보고 S3 콘솔·IAM만 들쑤신 게 헛걸음 원인.
- **"0 B" 표기를 객체 실재로 오독.** 대시보드 `s3 • 0 B`를 "빈 객체 존재"로 읽었으나 S3엔 객체
  전무. 표기보다 실물(S3 콘솔)을 먼저 봤어야 함.
- **권한 충분한데 막히면 권한이 아니다.** 충분 확인 후에도 권한만 반복해 판 것이 가장 큰 삽질.
  운영자 지적으로 교정됨. 다음엔 "권한 OK 확인 즉시 다른 층(자격증명 일치/전송 단계/버킷 정책)으로".
- **마이크로 단계마다 멈춰 묻지 말 것.** 라인엔딩·매 커밋 확인 등 과도한 분기로 채팅이 비대해짐.
  읽기 전용 정찰·저위험 작업은 묶어서 진행.
