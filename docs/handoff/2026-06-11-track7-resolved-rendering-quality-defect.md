# 2026-06-11 Track ⑦ 해결 + 렌더 복구 흐름 검증 + 완성품 품질 결함 발견

## 한 줄 요약
Track ⑦(Shotstack→S3 0바이트/복사 실패)는 IAM 정책에 소스 버킷 GetObject 누락이 진짜 원인으로 확정·해결됨. rendering에 갇힌 이벤트 복구 흐름도 검증함. 단, 재렌더된 완성품 영상의 품질 결함을 새로 발견 — 다음 세션 1순위.

## ⑦ 해결 (확정)
- 진짜 원인: IAM 정책 `shotstack-s3-write`에 Shotstack 소스 버킷(`shotstack-api-v1-output`)에 대한 `s3:GetObject` 권한 누락. Shotstack 워커가 우리 IAM 자격증명(`shotstack-s3` 사용자, prod 키 …GC6GRG)으로 자기 출력 버킷에서 렌더 결과를 읽어(HeadObject) 우리 버킷으로 복사하는 구조인데, 우리 정책은 우리 버킷(`congre-mvp-videos`) 권한만 있고 소스 버킷 읽기 권한이 없어 HeadObject가 AccessDenied로 막힘.
- 해결: 정책에 블록 추가(영구 보존) — `{ Sid: ShotstackSourceRead, Effect: Allow, Action: s3:GetObject, Resource: arn:aws:s3:::shotstack-api-v1-output/* }`. 추가 후 재렌더 → S3 도착 → done 전환까지 정상 확인(render ecc75d01).
- 발견 경위: CloudTrail Trail + CloudWatch Logs Insights로 워커 실제 호출을 직접 판정. errorCode 있는 행 필터로 단 1건의 AccessDenied(HeadObject, shotstack-api-v1-output, user/shotstack-s3) 포착. 디버깅용 CloudTrail 인프라(추적·로그버킷·로그그룹)는 사용 후 정리 완료.
- 폐기된 옛 가설(다음 세션에서 사실로 취급 금지): (a) "워커가 sandbox 키 사용" — 실제 prod 키 정상. (b) "PutObject 403" — 실제 실패는 PutObject 아닌 HeadObject. (c) "cross-account라 우리가 못 고침" — 우리 IAM 한 줄로 해결됨(Shotstack 버킷 정책은 이미 우리를 허용해둔 상태였음).

## rendering 갇힌 이벤트 복구 흐름 (검증됨)
- status가 rendering에 갇힌 이벤트는 cleanup cron(status==done만 대상)에 안 잡혀 클립이 100% 생존 → 재렌더 가능.
- 복구 경로 A(채택): Firestore에서 해당 이벤트 status를 closed로 수동 변경 → 대시보드 "영상 생성 다시 시작" 버튼 노출 → 호스트(운영자)가 클릭 → 새 renderId로 재렌더. 옛 깨진 renderId는 버려짐.
- 검증: #5 오늘밤(keMEBO5TzErHuSc9DkLf, 클립2), #4 게스트카드(wEyqYrqXVLKHTOpl9gxa, 클립6) 둘 다 closed 변경 후 버튼 클릭 → done 전환까지 흐름 정상 작동 확인.
- rendering에 아직 갇힌 잔여 6건(필요 시 동일 방식 복구 가능): 7kg2dUVqPYAsOD4aMyYM, FfKl53IyDrvLjimxu5nb, Imzt0K5lqcvMwZlWcK0X, iyX3pk0O0Gwhfs7SD8SN, M8KIxxR6w7YKlRH5Q2RQ, xVZeOB7NDmYhR47K2N6y.

## 🔴 다음 세션 1순위 — 완성품 품질 결함
- #4·#5 재렌더가 done까지 정상 도달했으나, 완성된 결과 영상이 제대로 나오지 못함(품질 이상). 이는 전송(⑦) 문제와 별개의 렌더 구성/합성 층 문제.
- 증상 상세는 미기록 — 다음 세션에서 운영자가 화면 보며 설명 예정. 진단 방향: 클립 합성/순서/인트로·아웃트로/자막/BGM 중 어느 층인지 切り分け부터.

## 🟡 새 운영 리스크 — 남의 호스트 이벤트 복구 경로 부재
- Shotstack 대시보드는 계정 단위 전체 가시성(모든 호스트 렌더 보임). 그러나 앱은 hostId 격리: render/start는 hostId !== uid → 403, 대시보드 목록은 where(hostId==uid). 따라서 운영자가 "다른 호스트의 rendering 갇힌 이벤트"를 풀어줄 경로가 현재 코드에 없음.
- 실고객(졸업식 등) 이벤트가 rendering에 갇히면 운영자가 복구 불가 + 24h 후 클립/결과물 소실 위험 → 고객 지원 마비 시나리오.
- 처리: 졸업식 시즌 진입 전 admin 복구 기능 또는 운영자 비상 복구 스크립트(Admin SDK는 hostId 무관) 필요. 지금은 실고객 없어 보류, 리스크 등재만.

## 🟢 자잘
- dotenv 패키지(^17.4.2)가 스크립트 stdout에 외부 광고 문구(vestauth.com / dotenvx.com) 노출. 보안 사고 아님. DOTENV_CONFIG_QUIET 또는 핀 다운그레이드로 억제 가능. 별도 트랙 메모.
- CC 메타 코멘트 재발: 이번 정찰 보고 말미에 "※ recap" 메타 코멘트를 또 붙임(CLAUDE.md 절대 규칙 위반, 학습 룰 #1 재발). 게다가 내용도 stale(이미 완료된 단계를 "다음"으로 표기).

## 이번 세션 학습
- 외부 벤더가 에러 메시지로 직접 권한을 명시하면, 그건 "그쪽은 준비됐다"는 신호일 수 있음 — 사람 메일의 추측성 지시와 격이 다름. 출처의 격(공식 에러 vs 메일 추측)을 구분할 것.
- "테스트 통과 ≠ 같은 동작 검증": PutObject 직접 테스트 성공에 갇혀 5일간 키 문제로 봤으나, 워커의 실제 실패 동작은 HeadObject였음. 같은 키라도 같은 동작인지부터 확인.
- cron 삭제 영향은 경과 시간이 아니라 트리거 조건(쿼리 status 필터)부터 볼 것 — rendering 갇힌 이벤트는 cleanup 면제.
