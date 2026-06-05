# 2026-06-05 — ⑦ Shotstack→S3 전송 실패: 원인 우리 쪽 아님 확정, Shotstack 지원 대기

## 한 줄 요약
⑦ S3 copy 실패("Failed to copy file to S3. Access denied")를 우리 쪽 7개 층 전부 점검·정상 확인.
직접 PutObject 테스트로 "shotstack-s3 키로 우리가 직접 쓰면 3종 ACL 다 성공, Shotstack 경유만 실패"를
실측 확정 → 원인은 Shotstack의 자격증명 처리 방식. 지원에 2차 격상(등록 키 ID + 원본 에러 요청) 후 대기.

## 본 세션 커밋
- 없음. 전부 읽기 전용 진단 + 외부 콘솔 설정 변경(아래). 코드 변경 0, working tree clean 유지.

## 외부 설정 변경 (이번 세션에 실제로 바꾼 것)
- **AWS S3 버킷 congre-mvp-videos: Object Ownership 변경**
  - BucketOwnerEnforced(ACL 비활성) → **Bucket owner preferred(ACL 활성)**.
  - ★ 이건 ACL 가설 검증용으로 바꾼 것인데 원인이 아니었음. 공개 권한은 안 줬고 객체는 비공개 유지(BPA on).
    presigned 서빙엔 무해. 되돌릴지는 ⑦ 해결 후 판단(되돌려도 무방).
- 진단 부산물: 버킷 루트에 4바이트 테스트 객체 3개 잔존
  (_diag-test-noacl.txt, _diag-test-private.txt, _diag-test-bofc.txt).
  shotstack-s3엔 DeleteObject 권한 없어 cleanup 실패 → congre-s3-user(FullAccess)나 콘솔로 삭제 필요.

## 점검 완료 — 우리 쪽 7개 층 전부 정상 (다시 파지 말 것)
| 층 | 결과 | 확인 방법 |
|---|---|---|
| 키 인증 | ✅ Active, Last used s3/ap-southeast-2 | AWS IAM 캡처 |
| IAM 정책 본문 | ✅ PutObject 등 on `congre-mvp-videos/*`, Deny·Condition 없음 | 콘솔 JSON 직접 읽음 |
| Object Ownership | ✅ ACL 허용으로 변경 후에도 동일 실패 | 변경+재테스트 |
| 기본 암호화 | ✅ AES256 (KMS 아님) | CC GetBucketEncryption |
| 버킷 정책 | ✅ 없음 (NoSuchBucketPolicy) | CC GetBucketPolicy |
| 리전/버킷 | ✅ ap-southeast-2 / congre-mvp-videos, render 요청과 일치 | CC + render destinations |
| Shotstack 환경 | ✅ PRODUCTION 토글에서 Connected | 운영자 캡처 |

## 결정적 실측 — 직접 PutObject 테스트
- **shotstack-s3 키(AKIA3NAC...DW5FM)로 우리가 직접 PutObject 3종 전부 성공**: ACL 없음 / private /
  bucket-owner-full-control. ListBucket도 성공.
- 그런데 동일 키로 Shotstack render의 copy는 실패. → 차이는 "Shotstack 경유" 단 하나.
- **결론: 원인은 우리 인프라가 아니라 Shotstack의 자격증명 처리 방식.** (signature 변형 / region / 다른 키 등 —
  우리가 못 보는 영역.)

## Shotstack 지원 격상 상태
- 2차 메시지 전송 완료(human agent 요청). 핵심 2개 질문:
  1. Production S3 integration에 **현재 등록된 Access Key ID**가 shotstack-s3(...DW5FM)와 일치하나?
     (대시보드가 저장 키를 안 보여줘서 우리가 직접 확인 불가.)
  2. copy-step 로그의 **원본 S3 에러**(error code + request ID).
- 실패 render ID: 25680c47-aee2-43b8-b941-1588b84c1f5c, b35064a0-d2ba-4b87-ac96-1bd483a476f2.
  계정 owner: rjc0lwsrbj.
- **대기 중. 답 오면 위 1·2로 (i)등록 키 불일치 / (ii)Shotstack 내부 처리 갈림.**

## 죽은 가설 (지원 답 오기 전 다시 파지 말 것)
- [죽음] 키 오타/무효 — 직접 PUT 성공이 키 유효성 증명.
- [죽음] IAM 권한 부족 — 정책 본문 직접 읽음, PutObject on /* 있음.
- [죽음] ACL/BucketOwnerEnforced — ACL 켜고도, bucket-owner-full-control 명시하고도 동일 실패.
- [죽음] KMS/버킷 정책/리전/sandbox 등록 — 전부 점검·정상.
- [죽음] 입력 자산 만료 — 공개 이미지 minimal render에서도 전송 단계 실패.
- [열림, 지원만 답 가능] 등록 키 불일치 / Shotstack 내부 credential 처리.
  ※ CC가 "등록 키 대조"를 반복 제안하나, Shotstack은 저장 키를 안 보여줘 우리 쪽에서 확인 불가 → 지원 질문 1로 위임.

## 검증 미완 (S3 전송 풀린 뒤)
- presigned 서빙 코드(74dbc12) end-to-end 미검증 — S3에 완성본이 도달한 적 없어 /share·대시보드 재생 미확인.

## 이번 세션 학습
- **강한 외부 선례가 약한 로컬 반증을 덮어쓰게 두지 말 것.** ACL 가설을 커뮤니티+AWS문서로 "거의 확실"이라
  단정했으나, no-acl render도 실패했던 로컬 실측이 이미 반증이었음. 가정("Shotstack이 기본 ACL 붙이나봄")으로
  봉합해 두 번 헛걸음. 로컬 실측 > 외부 선례.
- **"키 사용됨"(Last used) ≠ "이 경로에서 사용됨".** Last used를 "Shotstack이 이 키를 썼다"는 증거로 과대해석.
  우리 직접 테스트만으로도 Last used가 갱신됨. 인증 도달 ≠ 특정 호출 경로 사용.
- **서술이 아니라 ground truth를 읽을 것.** IAM 정책을 핸드오프 *서술*로만 믿다가, 직접 JSON 읽고서야 깨끗함 확정.
- **진단 채널은 "데이터가 있을 조건"부터 확인.** CloudTrail 데이터 이벤트는 기본 off → 빈손 위험 커서 안 팜.

## 다음 세션 후보 (이월)
- ⑦ Shotstack 지원 답변 처리 (최우선): 등록 키 불일치면 Disconnect→재등록, 내부 문제면 추가 정보 받아 대응.
- ⑦ 풀린 직후: presigned 서빙(74dbc12) end-to-end 검증 + 버킷 테스트 객체 3개 삭제 + Object Ownership 되돌릴지 판단.
- 도메인/환경변수 드리프트 정정 (congre-three → congre / app.congre.kr) — render 요청·CLAUDE.md 둘 다 옛 값.
- CLAUDE.md lint 게이트 문서 정정 ("errors 0" → "delta 0, baseline 11 errors/3 warnings").
- ⑦ Part A: /share OG 썸네일 (정적 로고, 미착수).
- 옛 OneDrive 폴더 삭제 여부, npm audit (별도 트랙).
