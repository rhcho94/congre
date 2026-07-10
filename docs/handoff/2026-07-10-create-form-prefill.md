# 2026-07-10 핸드오프 — 새 이벤트 폼 스마트 프리필 (3차 백로그 완료)

## 한 줄 요약
완주율 트랙 3차 백로그(새 이벤트 폼 스마트 기본값) 완료·push. 첫 이벤트 생성 문턱 낮추기 목적 — users 문서에서 이름·전번 읽어 제목·휴대폰 프리필, 날짜는 오늘(KST) 자동. 대상 파일 1개: src/app/dashboard/create/page.tsx. Ray 실화면 4필드 + 엔터 흐름 확인 완료.

## 이 세션 push 완료 — origin/main 반영
- 848f155 feat(create): 첫 이벤트 폼 스마트 프리필 — 제목·전번·날짜 자동 채움 (29 insertions / 4 deletions)
- Vercel 자동배포 → app.congre.kr 라이브. Ray 실화면 확인 완료.

## 한 일 상세
### 배경 (정찰 결과)
- create 페이지는 onAuthStateChanged 콜백에서 이메일만 자동 채우고 있었음. Firestore users 문서는 안 읽음. 이름·전번은 Auth 객체에 없고 users 컬렉션에만 있어, "users 문서 읽기 추가"가 이 작업의 실체였음.
- 제출 구조는 이미 <form onSubmit> + e.preventDefault → 값만 채워지면 엔터로 생성 가능(기존 구조).
- users 필드명 실측: name, phone (src/lib/users.ts:12,13).

### 구현 (848f155)
- onAuthStateChanged 콜백에서 getUserDoc(uid) 1회 재사용(새 의존성 0).
- 이름: name 있으면 title 초기값 `${name}씨의 축하영상입니다`. 없거나 빈 문자열이면 조건부 spread로 title 빈칸 유지(억지 "씨" 문구 방지).
- 전번: phone 있으면 organizerPhone 프리필, 없으면 빈칸.
- 이메일: 현행 유지(getUserDoc spread에 email 키 없어 덮어쓰기 없음).
- 날짜: 오늘 KST(toLocaleString "en-US" timeZone Asia/Seoul) 로컬 계산, YYYY-MM-DD. 서버 fetch 없음(시드니 리전 UTC 어긋남 회피).
- 옛 계정(users 문서 없음): if 가드 + catch 조용히 처리 + console.error("[create] user profile prefetch failed:", err).
- 프리필은 초기값만 — onChange 전부 살아있어 수정 가능.
- 미접촉: handleSubmit·payload·/api/events 라우트, form/onSubmit 구조, 미인증 리디렉션 가드.
- build 통과, lint 11/3 baseline delta 0. axe·eye 독립 검증 동일 결론.

## 이 세션 결정
- 제목 문구 = 범용 "OO씨의 축하영상입니다"(행사 안 박음). 결혼식 고정 안 함 — 졸업식·기업행사로 시장 넓힐 때 코드 재수정 불필요(YAGNI). 침투 마케팅 타깃은 결혼식이지만 디폴트 문구는 범용 유지.
- 이름 못 가져오는 옛 계정 = 제목 빈칸(범용 억지 문구 안 넣음). 취지가 "첫 이벤트 거부감↓"이고 옛 계정은 그 대상이 아니므로 신규 흐름만 매끄러우면 충분.

## 미착수 (다음 세션 후보, 우선순위)
1. 첫-테스트 흐름 후반부 마저 훑기(참가자 업로드 upload/[eventId]·완성본 결과 화면) → 카피/레이아웃/기능 3바구니 분류. 아직 안 훑음.
2. (별도 트랙) 결제 스파이크(Toss v2 test키) / 이메일 도달성 A층 재확인 — 핸드오프 2026-07-03-email-verification-domain-fix.md 참조.

## 이 세션 학습 한 줄
- "폼에 자동으로 채워라"가 항상 공짜가 아님. 이미 손에 쥔 값(Auth 이메일)이냐, 새로 읽어와야 하는 값(users 문서의 이름·전번)이냐부터 정찰로 가름. 실체는 "프리필"이 아니라 "users 문서 fetch 추가"였고, 정찰이 이걸 잡아줘서 사양이 정확해짐.
