# 2026-06-01 — 게스트 업로드 화면 카피 보강 + 호스트 이름 노출

## 본 세션 한 줄 요약

게스트 업로드 화면(uploader 단계) 카피를 보강. 호스트 이름을 게스트
공개 API에 노출(이름 1필드만)하고, 첫 방문 문구에 호스트 이름·행사
이름·요청 영상 길이·정보 사용 목적을 담음. 이후 운영자 실측 피드백으로
문구를 압축(호스트 이름 1회·3줄)하고, 입력칸 아래 "같은 이름…" 중복
안내를 삭제. 마지막으로 줄바꿈 방지 1글자 수정. 코드 3커밋.

## 본 세션 커밋 (이전→이후)

- `e4c9c63` feat: show host name and clip length guidance on guest upload screen
  (게스트 GET API에 hostName 필드 추가 + uploader 첫 방문 문구 신설)
- `a850195` refactor: condense guest upload copy and remove duplicate name notice
  (문구 4줄→3줄 압축, 호스트 이름 반복 제거, "같은 이름…" 안내 삭제)
- `fd13767` refactor: drop one char from guest copy to prevent line wrap
  ("전달에만"→"전달에" 1글자 삭제 — 4줄째 줄바꿈 방지)

## 본 세션 결정 / 발견

- **게스트 공개 API 호스트 이름 노출 결정** (decisions/data-flow.md
  2026-06-01): sessionToken 기반 공개 엔드포인트 GET /api/events/[eventId]
  응답에 users.name 1필드만 join. email·phone 등 다른 PII 비노출 원칙 명시.
- **호스트 이름 노출은 리스크 아님 판단**: 게스트 초청 링크는 서로 아는
  사이가 보내고 받음 → 실명 노출 무방. 별도 표시명(B안) 불필요(YAGNI).
- **길이 강제는 안내성(자동 컷)**: render/start route.ts:90
  Math.min(duration, maxClipSeconds)로 앞 N초만 사용. 거부 아님. 그래서
  문구도 "올려주세요"(안내)지 "막혀요"(제약) 아님.
- **"같은 이름…" 사전 안내 삭제**: 중복 시 검증 에러 메시지(L152)로
  충분하다고 운영자 결정. "이름 달리하면 여러 개 가능" 정보는 함께
  사라짐(운영자가 해당 시나리오 미사용 판단).

## 미완

- 없음. 게스트 카피 트랙 닫힘. 줄바꿈 실측 완료(운영자 확인).

## 다음 세션 후보

- **(우선) 게스트 흐름 일러스트 — CD 트랙**: 이름·전번 입력 → 다음 →
  영상 촬영 → 올리기 → 문자로 완성본 받기를 이미지/아이콘으로 안내.
  텍스트 설명을 시각으로 대체·보강. CD(Claude Design)에서 디자인
  사이클로 열어야 함(코드 트랙 아님). 다크·시네마틱·골드 톤, 모바일 사이즈.
- dead code 정리 (host/page.tsx 옛 dashboard/create view + mockEvents).
- dashboard 썸네일 (placeholder, 인트로 미디어 썸네일 추출).

## 메모 (다음 docs 손볼 때 같이)

- **decisions/data-flow.md 2026-06-01 결정문에 깨진 줄 1개**: "…null
  반환." 다음에 "변수 사용."만 떠 있고 앞 문장이 잘림(hostDisplay
  fallback 변수 관련 문장으로 추정). 다음 data-flow.md 수정 시 복원.

## 본 세션 학습 한 줄

- 화면 카피는 "코드로 확정"이 아니라 "실측으로 확정"이다. 호스트 이름
  중복·줄 밀림 둘 다 코드 리뷰 아닌 운영자 폰 스샷에서 잡힘. 텍스트
  변경은 작은 사이클(한 변경 → 폰 실측 → 다음)이 맞다.
