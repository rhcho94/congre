@AGENTS.md

---

# Congre — 프로젝트 작업 규칙

이 파일은 Claude Code가 자동으로 읽는 컨텍스트 파일입니다.
새 작업 시작 전 반드시 다음 순서로 컨텍스트를 잡아주세요:

1. AGENTS.md (위 참조) — Next.js 버전 특화 규칙
2. 이 파일의 아래 내용 — Congre 프로젝트 규칙
3. docs/PROJECT.md — 현재 스냅샷
4. docs/ROADMAP.md — 다음 할 일과 알려진 이슈
5. docs/known-issues.md — 재현된 버그·이미 기록된 이슈 (재발견 방지)
6. docs/CHANGELOG.md 최근 10줄 — 최근 작업 흐름
7. (필요 시) docs/DECISIONS.md — 왜 이렇게 짰는지

## 협업 스타일

- **운영자 프로필**: 1인 비개발자 운영자. 코드 직접 수정하지 않으며 Claude Code와 프롬프트로 협업.
- **세션 컨텍스트**: 새 세션 시작 시 docs/handoff/ 최신 파일 → DECISIONS.md → ROADMAP.md → known-issues.md 순으로 읽어 컨텍스트 확보.
- **워크플로**: 계획(분석·권장안 제시) → 사용자 승인 → 실행(코드 작성) 순서 준수. 승인 없이 코드 작성 금지.
- **확인과 실행 분리**: "분석만 보고" 지시 시 파일 수정 금지. 실행은 명시적 승인 후에만.
- **Atomic 커밋**: 한 작업 단위를 한 커밋에. 관련 docs 갱신도 같은 커밋에 포함.
- **YAGNI**: 현재 요구사항에 없는 기능·추상화·에러 핸들링 추가 금지.
- **보고 시 숫자 검증**: 파일 수, 라인 수, 커밋 해시 등 보고 전 실제 값 확인. 추정치 보고 금지.
- **커밋 전 git status 필수**: 의도한 파일만 변경됐는지 확인 후 커밋.
- **응답 스타일**: 개발 용어 처음 등장 시 짧게라도 풀어 설명 (비유 포함). 외부 작업(GitHub, Vercel, 카카오 등)은 메뉴 트리 + 단계별로 안내.
- **응답 톤**: 직설적이되 따뜻하게. 사용자 자책 시 위로 과하게 하지 말고 패턴만 짚어줄 것.

## 절대 규칙

- 브랜드 "Congre" 표기는 반드시 `src/components/BrandName.tsx` 컴포넌트 사용. 인라인 텍스트로 흩어 쓰지 말 것.
- 변수명·파일명·환경변수·도메인 등 기술 식별자는 소문자 (congre-mvp, congre-three.vercel.app).
- Tailwind는 v4 사용 중이며 **config 파일 없음**. `@import` 방식. tailwind.config.js 만들지 말 것.
- 커밋 메시지는 conventional commits (feat:, fix:, chore:, docs:, refactor:).
- 작업 완료 시 자동으로 commit & push.

## 디자인 토큰 (CSS 변수)

- 배경: `var(--bg)` (#0c0b09)
- Surface: `var(--surface)` (#151310), `var(--surface-2)` (#1e1a13)
- 액센트: `var(--accent)` (#c8892c, 앰버/골드)
- 텍스트: `var(--text)` (#ede8df), `var(--muted)` (#79716a)
- 폰트: `var(--font-display)` (Cormorant Garamond italic), `var(--font-body)` (DM Sans)
- 글로벌 유틸: `.rule`, `.glow-accent`, body::after film grain

## 문서 갱신 의무

작업 끝나면 다음을 같은 커밋에 포함:
- 새 기능 추가 → `docs/CHANGELOG.md`에 한 줄 추가
- 기술 결정 (라이브러리 선택, 아키텍처 변경) → `docs/DECISIONS.md`에 항목 추가
- 새로운 알려진 이슈 / 다음 작업 후보 변경 → `docs/ROADMAP.md` 갱신
- 환경변수 / 기술 스택 / 디자인 토큰 변경 → `docs/PROJECT.md` 해당 섹션 갱신
