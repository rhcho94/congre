# 2026-06-19 핸드오프 — 1단계 에이전트 팀 완성 (스카웃·눈깔·도끼 추가)

## 한 줄 요약
지난 세션에 만든 라나에 이어 정찰관(스카웃)·검증관(눈깔)·실행관(도끼)을
설계·생성·시운전까지 완료. 1단계 팀 4명 풀세트 완성. 도끼+눈깔 풀사이클을
og-image Cache-Control 실제 수정으로 실전 검증해 통과.

## 본 세션 커밋 (push 안 함, Ray 몫 — origin 대비 6커밋)
- 2deda21 chore(agents): add scout subagent for internal recon
- 8ed45f6 docs(known-issues): confirm L10 OG proxy findings via scout, note fallback drift
- 2f3befb chore(agents): add eye subagent for change verification
- 63a2eeb chore(agents): add axe subagent for spec-driven code edits
- 418761f feat(seo): add Cache-Control to og-image proxy response (1d CDN+browser cache)
- (이 핸드오프 커밋)

## 팀 4명 최종 정의
- 라나(lana): 외부 리서치. 도구 Read/Grep/Glob/WebSearch/WebFetch. 읽기+웹.
- 스카웃(scout): 내부 코드 정찰. 도구 Read/Grep/Glob. 읽기 전용. "코드=1차 소스" 실측.
- 눈깔(eye): 변경 검증. 도구 Read/Grep/Glob/Bash. 사양 대조 + build/lint 게이트. 읽기·검사.
- 도끼(axe): 코드 실행. 도구 Read/Grep/Glob/Write/Edit/Bash. 수정 + 자체 build/lint. 커밋·push 안 함.
- 전부 .claude/agents/{name}.md, model: sonnet.

## 핵심 결정·발견
- 실행관(도끼)은 커밋하지 않는다 — 라나 외부 표준 리서치 결과. 검증은 "커밋 전"
  게이트가 주류(BUILD→CHECK 루프, Plan-Execute-Verify). 불합격 시 커밋 전 루프백이
  압도적 권장. 우리 비개발자 1인 환경에선 reset/amend 부담 회피와도 맞음. 그래서
  도끼 도구에서 git commit/add/push/reset 전부 제외. 커밋은 검증 통과 후 메인 CC가.
- 도끼·눈깔 분업 = BUILD(도끼 자체 게이트)→CHECK(눈깔 독립 게이트) 이중. 같은
  build/lint라도 목적 다름(자가진단 vs 최종 게이트).
- 표준 패턴 출처: ReAct, Plan-and-Execute, Reflexion, Self-Refine, CRITIC,
  Generator-Critic, Plan-Execute-Verify-Replan, Scout-Guard-Orchestrator-Build-Check.
- 코난 자기정정: "지난 핸드오프에 실행관=커밋까지로 적힘"을 근거로 A안(커밋 포함)
  추천했으나, 그 문서 정의는 눈깔 없던 시절 그림. 바깥 표준+새 눈깔 놓으니 답 바뀜.
  문서가 1차 소스인 건 "현 코드 상태"일 때고, "어떻게 설계할까"는 바깥 표준이 1차.

## 시운전 결과
- 스카웃: L10 라나 발견 3건 코드 실측 → 3건 다 일치 확정 + ③에서 9ebf887 문서/코드
  드리프트 발견(핸드오프엔 "브랜드 카드로 교체"라 적혔으나 현 코드는 302 그대로).
- 눈깔(1차): 코난이 만든 L10 갱신을 사양 대조 → 합격. 단 사양 작성자=검증 기준
  작성자가 같아(둘 다 코난) 진짜 독립 검증은 아니었음.
- 도끼+눈깔(풀사이클): og-image Cache-Control 추가. 도끼 수정(58줄)→자체 build/lint
  통과(11/3)→커밋 전 멈춤→눈깔 독립 검증(60줄, fallback 미수정 확인, build/lint 11/3
  delta0)→합격→메인 CC 커밋(418761f). 다른 두 주체가 처음 맞물려 통과. 팀 실작동 확인.

## L10 상태 갱신
- ① 전체 버퍼링 / ② Cache-Control 없음 / ③ fallback 302 = scout 코드 확정.
- ② 는 이번 세션에 도끼+눈깔로 수정 완료(418761f). public, max-age=86400, s-maxage=86400.
- ③ 의 9ebf887 진상(브랜드 카드 드리프트가 (a)되돌림인지 (b)다른 파일 오기인지)은
  git 이력 확인 필요 = scout 권한 밖. 다음 세션 후보 3번.
- ① 4.5MB 413 가능성은 미측정. 손댈 때 아님.

## 미완 작업 (다음 세션 가장 먼저)
1. push: origin 대비 6커밋 대기. Ray가 git push.
2. (선택) tmp-pricing-variants.html untracked 1개 — 이번 작업 무관, 정리 여부 별도 판단.

## 다음 세션 후보 (우선순위)
1. (高) 2단계 셋업 — CC가 직원 자동 호출(자동 위임). 팀 4명 다 됐으니 "되는지"에서
   "편해지는지"로. Ray 복붙 노동 감소가 여기서 시작.
2. (高/이월) FGT 실제 실행 — 코드·보안·랜딩 준비 끝, 운영 결심 영역.
3. (中) 9ebf887 git 이력 정찰 — L10 ③ 미확정 진상. scout+도끼 쓰는 실전.
4. (보류) _shared 전역 문서 골격 + CLAUDE.md 룰 이관.

## 본 세션 학습
- 직원마다 역할 다르면 도구도 다른 게 맞음. 스카웃=읽기만, 눈깔=읽기+게이트,
  도끼=쓰기. 일률로 묶을 필요 없음.
- 도끼·눈깔처럼 baseline 숫자(errors 11/warnings 3)가 프롬프트에 박힌 직원이 둘.
  react-hooks 정리 사이클로 baseline 바뀌면 두 파일 다 갱신해야 함(코난 체크포인트).
- CC Write 출력에서 frontmatter 5~6번째 줄이 "---el: sonnet"로 겹쳐 보이는 건 화면
  렌더 현상. scout·eye·axe 세 번 다 재현, 실제 파일은 매번 정상. 단 쓰기 권한
  직원일수록 실제 파일 head로 확인하고 감.
- 설계 질문은 바깥 표준부터(라나). 코난은 내부 코드·문서에 매몰돼 표준을 놓치는
  경향. 실행관 커밋 여부가 그 사례 — 라나 없었으면 표준과 어긋난 A안으로 갔음.
