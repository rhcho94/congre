# 2026-06-06 — ⑦ Shotstack→S3 copy 실패: 측정으로 "Shotstack 쪽 문제" 확정 + 지원 정밀 격상

## 한 줄 요약
⑦ S3 copy "Access denied"를, 그동안 한 번도 안 본 **Serve API** 측정으로 끝까지 파서 — 노출된 옛 키
폐기 → 새 키 발급 → Shotstack `Rotate Credentials` 재등록 후의 렌더(16:02)도 동일 Access Denied 확정.
같은 새 키로 우리 직접 PutObject는 3종 ACL 다 200 성공. 즉 우리 쪽(키·IAM 정책·버킷·ACL·region) 전부
결백, 원인은 Shotstack 내부 자격증명 처리. 반박 불가능한 증거로 지원 정밀 격상 후 외부 대기.

## 본 세션 커밋 (본 앱 git)
- **없음.** 전부 읽기 전용 진단 + 외부 콘솔 작업(아래). 코드 변경 0, working tree clean.

## 외부 작업 (이번 세션에 실제로 바꾼 것)
- **AWS IAM `shotstack-s3` 액세스 키 교체**
  - 옛 키 `AKIA3NACVCKDZNGDW5FM` **폐기(삭제)** — 진단 중 Secret이 채팅에 평문 노출되어 CC가 실행 거부 +
    폐기 권고 → 폐기. (안전망 정상 작동. Secret은 어디에도 기록하지 않음)
  - 새 키 `AKIA3NACVCKDQQGC6GRG` **발급**. (Secret은 운영자만 보관, 문서·채팅 미기록)
- **Shotstack 대시보드 → Integrations → AWS S3 (PRODUCTION) → Rotate Credentials**로 새 키 재주입.
  화면 "integration updated successfully / Connection Active" 확인.
- 진단 부산물: 버킷 루트에 4바이트 테스트 객체 **6개** 잔존
  (`_diag-2026-06-06-{noacl,private,bofc}.txt` 3개 + 이전 세션 `_diag-test-{noacl,private,bofc}.txt` 3개).
  shotstack-s3엔 DeleteObject 권한 없음 → `congre-s3-user`(FullAccess)나 콘솔로 삭제 필요.
- 로컬 잔존 파일: `tmp-diag-serve-prod.mjs` (C:\projects\congre 루트) — **아직 삭제 안 함.** 다음 세션
  cleanup 또는 즉시 `rm`.

## 본 세션 결정·발견

### ⑦ 원인 = Shotstack 쪽 (측정 기반 확정)
- **결정적 측정**: Serve API(`GET /serve/v1/assets/render/{renderId}`)로 S3 전송 상태를 처음으로 직접 조회.
  - edit API(`getRenderStatus`)는 렌더 상태 + Shotstack CDN url만 줌. **S3 전송 상태는 Serve API에만 있음**
    (Shotstack 공식: "Get Render Status는 CDN url만, Serve API로 따로 조회"). 우리가 그동안 이걸 안 봤음.
  - 새 키 rotate **이후**의 렌더 `958c311c-d834-4666-97ad-06f28981b5e4` (created 16:02:24Z):
    - asset id `0d9a79e5-f113-4c52-81c4-84412cded751`, provider s3,
      `status: failed`, error "Failed to copy file to S3. Access denied...", providerId (none),
      created→updated 약 180ms (즉시 거부).
  - 옛 렌더 `10f6f283`(13:55), `7e0ea991`도 동일 failed/Access Denied.
- **우리 쪽 결백 증거**:
  - 같은 새 키로 직접 PutObject 3종(noacl / private / bucket-owner-full-control) **전부 HTTP 200 성공**
    (현재 버킷 설정 = Bucket owner preferred, ACL 활성 상태에서 실측).
  - IAM 정책 `shotstack-s3-write` JSON에 `s3:PutObject, s3:GetObject, s3:PutObjectAcl` + multipart 포함
    (Resource `arn:aws:s3:::congre-mvp-videos/*`). Shotstack이 1차로 지목한 "PutObjectAcl 누락"은 사실 아님.
  - 버킷 정책 Deny 없음, region ap-southeast-2, 기본 암호화 AES256(SSE-S3).
- **죽은 가설**: "Shotstack이 옛/다른 키를 들고 있다(키 불일치)" — 새 키 rotate 후 렌더도 동일 실패로 사망.
- 결론: 키·IAM·버킷·ACL·region 전부 정상인데 Shotstack copy만 거부 = **Shotstack 내부 자격증명 처리 문제**.
  우리가 바꿀 수 있는 영역 아님.

### 진단 과정에서 갈렸던 오해들 (다음 세션이 다시 안 빠지게)
- Shotstack Outputs UI의 `s3 • 0 B`는 "복사 절반 실패"가 **아니라** "전송 실패/미완"의 표시였음.
- 중간에 stage 키로 Serve 조회 → 404("No assets found") → "copy 시작조차 안 됨"으로 오판했으나,
  production 키로 다시 조회하니 자산 존재 + `failed`. **404는 환경(키) 불일치 탓이었음.**
- 렌더 응답 `response.url` = `shotstack-api-v1-output.s3-ap-southeast-2.amazonaws.com/...` → **24h 임시 url**.
  영구 CDN url(`cdn.shotstack.io/au/v1/{owner}/{renderId}.mp4`) 조립 시도 → 브라우저에서 **Access Denied**
  (보존 안 됐거나 경로 형식 다름). → "저장해서 오래 쓸 url"이 현재 손에 없음. A안(CDN 우회)의 전제가 깨짐.

### 도메인 일소 최종 확인
- 오늘 렌더 `10f6f283` timeline: BGM/폰트 src 전부 `app.congre.kr` (깨끗). 도메인 일소 정상 반영 확인.
- 옛 렌더(`7e0ea991`, `08ff5351`, `ac366659`) timeline엔 `congre-three.vercel.app` 잔존 — 이미 끝난 렌더의
  기록일 뿐 변경 불가·무해. src 코드(src/)엔 congre-three 매치 0건(env 보간), 잔존 33건은 모두 docs/ 역사기록.

### 앱 구조 사실 (CC 정찰 인용 기반)
- `render/start`: destinations 페이로드에 `provider:s3, options:{region,bucket}`만, **prefix/filename 미지정**
  → Shotstack 디폴트 = 버킷 루트 `{renderId}.mp4`. (shotstack.ts:251-267)
- `check-rendering` cron: `status=="rendering"` 쿼리(*/5 * * * *), Shotstack url 무시하고
  `HeadObject(bucket, {renderId}.mp4)`로 S3 존재만 확인 → 있으면 done+videoS3Key 저장, 404면 console.log +
  continue로 **status:"rendering" 영구 유지**. (check-rendering/route.ts:37,61-77)
- 호스트 GET·공유 페이지: `videoS3Key` → `getVideoPresignedUrl`(S3 1h presigned). **CDN url은 저장 안 함**,
  `videoUrl`은 Firestore 영속 필드 아님. → 영상 표시가 전적으로 "S3에 완성본 존재"에 의존.
- 완성본 단일 필드 덮어쓰기 구조(D2 서브컬렉션 미전환) — known-issues 그대로.

## 미완 / 대기 (다음 세션 우선순위)

1. **⑦ Shotstack 지원 답신 대기 (외부, 내 액션 없음)**
   - 송부한 정밀 격상 질문 2개: ① rotate 후 실제 등록된 Access Key ID가 새 키(...GC6GRG)인지
     ② render `958c311c` / asset `0d9a79e5`의 raw S3 에러 코드 + AWS Request ID.
   - 답신 오면: 등록 키가 옛 키면 → 재등록 실효 문제, 새 키 맞는데 거부면 → 완전히 Shotstack 버그 확정.

2. **앱 고착 해소 (② 별도 트랙) — ⑦과 묶어 재설계 필요**
   - 현재 `rendering`에 박힌 이벤트 6개+ ("편집 중" 영구 고착). 관측된 eventId:
     `7kg2dUVqPYAsOD4aMyYM`, `iyX3pk0O0Gwhfs7SD8SN`, `wEyqYrqXVLKHTOpl9gxa`, `xVZeOB7NDmYhR47K2N6y` 등.
   - CDN url 우회(A안)는 24h 임시 url + 영구 url Access Denied로 막힘. 그대로는 못 감.
   - ⑦이 풀리면(S3 copy 정상화) cron HeadObject가 통과되며 박힌 이벤트 자동 복구됨. ⑦ 해결과 묶어 처리.

3. **진단 부산물 cleanup**
   - 버킷 루트 `_diag-*` 6개 삭제 (congre-s3-user 또는 콘솔).
   - 로컬 `tmp-diag-serve-prod.mjs` 삭제.

4. **버킷 Object Ownership** — 이전 세션에 `BucketOwnerEnforced` → `Bucket owner preferred`로 바꾼 것 미복원
   (무해, presigned 서빙 영향 없음). ⑦ 해결 후 복원 여부 판단.

## 다음 세션 후보 (우선순위)
- (대기) ⑦ 지원 답신 → 그에 따라 분기
- (중) ② 앱 고착 해소 — ⑦ 해결과 동시. CDN 우회는 영구 url 확보 경로 재설계 선결
- (소) 진단 부산물 cleanup (S3 6개 + 로컬 스크립트)

## 본 세션 학습
- **그동안 안 본 측정값이 답이었다** — ⑦을 여러 세션 "권한 층"만 두드렸으나, S3 전송 상태는 edit API가
  아니라 **Serve API**에만 있었음. 막힌 진단은 "측정 안 한 채널"부터 의심.
- **키 환경 혼동 주의 (sandbox vs production)** — 진단 중 stage/production 키가 3번 섞여 edit 403 / Serve 404
  오측정 발생. `.env.local`의 `SHOTSTACK_ENV=stage`. Serve/edit 조회는 **반드시 production 키 + edit
  response.status=done 확인 후** 결과 유효. 가장 확실한 production 키 출처 = Vercel 환경변수(cron이 쓰는 값).
- **Secret은 터미널 인라인만, 채팅 금지** — Secret 평문 채팅 노출 → 키 폐기·재발급 1사이클 소요. 진단 명령은
  `$env:...="..."; node ...; Remove-Item Env:...` + `Clear-History` 패턴으로.
- **외부 SaaS UI "Connected/updated successfully"는 동작 보증 아님** — Shotstack가 "연결됨" 표시해도 실제
  copy는 Access Denied였음. 검증은 항상 실제 렌더 + Serve API 측정으로.
