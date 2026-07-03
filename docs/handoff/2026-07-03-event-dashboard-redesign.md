# 2026-07-03 핸드오프 — 이벤트 대시보드 재설계 (2차 백로그 ①②③④⑤ 완료)

## 한 줄 요약
완주율 트랙 2차 백로그(이벤트 대시보드 화면 재설계) 전체 완료·push. 상태별 블록 순서 재배치 + 클립목록 조밀화 + 섹션 제목 색 강조. CD 시안 없이 글 사양으로 진행(대부분 순서·표현 변경이라 CD 불필요 판정). 대상 파일 1개: src/app/dashboard/events/[eventId]/page.tsx.

## 이 세션 push 완료 — origin/main 반영 (최신순)
- fecf635 refactor(event-dashboard): 클립목록 조밀화 + 섹션 제목 색 강조
- 821380c refactor(event-dashboard): 상태별 블록 순서 재배치 — done블록 상단·QR 하단 이동 (내부 무변경)
- (하위) 437aee9 docs: 완주율 세션 핸드오프 갱신 — 지난 세션 미푸시분, 이번에 함께 올라감
- ahead 0, Vercel 자동배포 → app.congre.kr 라이브. Ray 실화면 확인 완료.

## 한 일 상세
### ①② 순서 재배치 (821380c)
JSX 블록 물리 순서를 한 번 재배치 → open·done 두 상태 화면 동시 개선. 블록 통째 이동(108 insertions/108 deletions 대칭 = 순수 이동), 내부·조건식 무변경.
- 최종 물리 순서: 헤더 → done블록 → 꾸미기 → 스타일 → 클립목록 → QR
- open 화면 결과: 헤더 → 꾸미기 → 스타일 → 클립목록 → QR (done블록 null)
- done 화면 결과: 헤더 → 완성영상 → 꾸미기 → 스타일 → 클립목록 (QR null)
- 구분선(hr mb-8, 헤더 직후)은 미이동 — 헤더/본문 구분 역할 유지, Ray 실화면 OK.

### ⑤③④ 조밀화·제목색 (fecf635)
- ⑤ 클립 리스트: 클립 항목 바깥 래퍼 glass-panel(유리 카드) → "flex flex-col py-2 border-b border-[var(--hairline)]" 얇은 행. 리스트 컨테이너 gap-2→gap-0. 전번(uploaderPhone)·업로드시각 렌더 제거(인터페이스 필드는 유지, JSX만 삭제).
- 유지된 것: #역순번호 / 이름(truncate) / 제외토글(Eye·EyeOff, handleToggleExclusion, 판별 clip.excludedAt) / 재생토글(Play·X, handlePlayClip, 판별 activeClipId===clip.id) / 인라인 플레이어(isActive→playbackUrl video, 9/16). 아코디언(한 번에 하나만 열림)은 activeClipId 단일 state라 원래부터 그렇게 동작 — 새로 만든 것 아님.
- ④ 제목색: 섹션 제목 4곳에 인라인 style={{color:"var(--accent)"}} 추가(주황). .eyebrow 전역 정의(globals.css)는 미접촉 — 기존 "당첨"(--accent)·"편집완료"(#5ba06e) 인라인 패턴과 동일. 대상: 참가자 초대 / 영상 시작·끝 꾸미기 / 영상 스타일 / 업로드된 클립.
- ③ 개수표시: "업로드된 클립 (N개)"는 ④ 제목색에 포함 처리(별도 작업 없음).
- dead code 정리: 시각 렌더 제거로 formatUploadTime 호출부 0 → 함수 정의 + axe가 임시로 붙였던 eslint-disable 억제주석 함께 삭제. grep 0건 확인.
- build 통과, lint 11/3 baseline delta 0.

## 미착수 — 3차 백로그 (다음 세션 후보)
### 새 이벤트 폼 스마트 기본값 (기능, 동작 변경)
- 카피 아님. DB 값 프리필 = 동작 변경이라 scout(create 데이터흐름) 선행 필요.
- 이메일·전번: 로그인 호스트 users 문서에서 기본값(수정 가능). 날짜: 당일 기본. 이벤트 이름: 이름 넣은 예시 placeholder냐 실입력이냐 결정 필요.
- 근거: 라나 리서치(스마트 기본값=활성화 에너지↓, 아는 정보 다시 안 묻기).

### 2차에서 보류한 항목
- 시각 위계 세부(제목 크게/버튼 작게)는 이번에 "제목 색 강조"로 대체·축소함. 실사용 후 그래도 거슬리면 재검토(YAGNI).

## 기타 백로그 (YAGNI, 미착수)
- 미인증 시 "첫 이벤트 만들기" CTA에 disabled 표시/인증 유도 문구(지난 핸드오프 CTA 먹통 건 = 미인증이 원인, 버그 아님).
- 첫-테스트 흐름 후반부(참가자 업로드 upload/[eventId]·완성본 결과 화면) 아직 안 훑음 → 다음에 마저 훑어 카피/레이아웃/기능 3바구니 분류.

## 다음 세션 후보 (우선순위)
1. 첫-테스트 흐름 후반부 마저 훑기(참가자 업로드·완성본) → 3바구니 분류.
2. 3차 새 이벤트 폼 프리필 — create 데이터흐름 scout 선행.
3. (별도 트랙) 결제 스파이크(Toss v2 test키) / 이메일 도달성 A층 재확인 — 핸드오프 2026-07-03-email-verification-domain-fix.md 참조.

## 이 세션 학습 한 줄
- "재설계"라는 단어에 반사적으로 CD 시안을 붙이지 말 것. 항목을 성격별로 분해하면 대부분 순서·표현 변경이라 글 사양으로 충분하고, CD가 진짜 필요한 건 "시각적으로 선택지가 있는 것"뿐. 회귀 위험은 디자인 애매함이 아니라 큰 파일을 건드리는 데서 오므로 그건 scout 정찰로 잡는다.
