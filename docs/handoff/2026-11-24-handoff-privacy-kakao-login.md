# 핸드오프 2026-11-24 (오후) — 처리방침 국외 이전 표 정정, 카카오 로그인 추가·운영 반영

> 작성: 코난(채팅 클로드) · 세션: 2026-11-24 12:39~13:50 · 기준 HEAD: 앱 main `33b476c`(GitHub 실측 `git ls-remote`). 이 문서와 문서 2개 갱신은 그 위 커밋 1개.
> 같은 날 오전 핸드오프: `2026-11-24-handoff-meta-tracking-live.md`. 엔진·랜딩 변경 없음.

## 한 줄

**오전 핸드오프의 정리 3건을 닫고, 처리방침의 옛 국외 이전 표기를 고쳐 배포했고(`d6c94e6`), 카카오 로그인을 넣어 운영에 올렸다(`33b476c`). 카카오 가입 → 이벤트 만들기 → 탈퇴까지 Ray 폰 테스트 통과.**

## 커밋

| 해시 | 내용 | 크기 |
|---|---|---|
| `d6c94e6` | docs(legal): 개인정보처리방침 v1.0 보완 — 처리 위탁·국외 이전 현황 정정 (공지·시행 2026-11-24) | 4파일 +37 −52 |
| `33b476c` | feat(auth): 카카오 로그인 추가 — 카카오로 시작하기, 가입 마무리, 카카오 회원 탈퇴 확인 | 25파일 +629 −30 |

둘 다 코난이 Ray PC 저장소(`C:\projects\congre`)에서 편집·커밋, push는 Ray PowerShell(코난 쪽 push는 403으로 막혀 있다).

## 1. 오전 핸드오프 정리 3건

- push: 할 것이 없었다. 12:45경 GitHub main이 이미 `f2cd751`이었다(오전 핸드오프의 "push는 하지 않았다"와 다름).
- 메모장 전환 API 토큰 지우기, 프로젝트 자동 첨부 문서 재업로드: Ray "했어"(13:02). 코난은 보지 않았다.
- 프로젝트 문서 `claude/pending-backlog-current.md` 갱신(V절 신설, D12·D13).

## 2. 처리방침 국외 이전 표 정정 (`d6c94e6`)

- 제5조 위탁 표: Shotstack 삭제, AWS 업무를 "클립 영상 파일 저장 및 영상 자동 편집 (Amazon S3 등, 서울 리전)"으로.
- 제5조의2: AWS(ap-southeast-2)·Shotstack(호주) 삭제. Google은 "미국 (Firebase Authentication)", 이전 항목 "호스트 이메일, 비밀번호 해시"만.
- 근거: S3·엔진·Firestore는 서울(decisions/infra.md 2026-10-13), Firebase Authentication은 미국 데이터센터 전용(Firebase 공식 문서, 11/24 확인).
- 배포 확인: 13:00경 `app.congre.kr/privacy` 글자 대조(코난) — 머리말 11월 24일 보완, 위탁 표 6행, 국외 이전 4곳, `ap-southeast-2`·`us-central1` 없음.
- **전제 하나**: "외국 회사의 서울 리전 저장은 국외 이전이 아니다"로 보고 AWS를 뺐다. 법무 검토 미수행(백로그 D12). 상세는 `docs/legal/CHANGELOG.md`.

## 3. 카카오 로그인 (`33b476c`)

Ray 결정: 11/20 결정 5(메타 다음에 카카오 가입), 11/24 "A로 가자"(카카오 회원은 이벤트 만들 때 이메일을 직접 적는다). 상세·기각한 안·필드샷과 다른 점은 `docs/decisions/auth-model.md` 2026-11-24.

- 새 파일 7개: `src/lib/kakao-auth.ts`, `src/components/KakaoLoginButton.tsx`, `src/app/api/auth/kakao/start/route.ts`, `…/callback/route.ts`, `src/app/api/user/kakao-signup/route.ts`, `src/app/auth/kakao/page.tsx`, `…/KakaoAuthView.tsx`. 필드샷(`rhcho94/congre-bible-mvp` `be4b055`)에서 옮김.
- 연결: `auth.ts`(`isVerifiedHost`·`isKakaoUser`·탈퇴), 로그인·가입 화면 버튼, 대시보드·이벤트 만들기·마이페이지·인증 배너, `api/user/delete`(재로그인 10분 확인 + 카카오 연결 끊기), `api/events`(가입 미완료 카카오 계정 `SIGNUP_INCOMPLETE` 403).
- 결제·환불·알림 코드는 손대지 않았다(`organizerEmail` 필수 그대로).
- 처리방침 보완(카카오 회원번호·닉네임 — 제2조·제3조·제5조·제5조의2, 같은 날 11/24), 호스트 가이드, `.env.local.example`, PROJECT.md 환경변수 3줄.
- 검증(코난 작업 공간): tsc 통과, lint 12 errors / 2 warnings 변동 없음, `next build` 통과 — **글꼴 내려받기만 가짜로 대체**(`NEXT_FONT_GOOGLE_MOCKED_RESPONSES`). 정적 36/36, 새 주소 4개(`/api/auth/kakao/start`·`/callback`, `/api/user/kakao-signup`, `/auth/kakao`).

### 카카오·Vercel 설정 (Ray)

- 카카오 개발자 앱 `congre`(ID 1444949, 비즈 앱 아님 — 그대로 둠): 카카오 로그인 사용 설정 ON(캡처 확인), OpenID Connect OFF, 웹훅 미설정. 리다이렉트 URI `https://app.congre.kr/api/auth/kakao/callback`, 닉네임 동의항목(Ray "끝까지 했어" — 화면은 코난이 보지 않음).
- Vercel `congre`: `KAKAO_REST_API_KEY`·`KAKAO_CLIENT_SECRET`·`KAKAO_ADMIN_KEY`, 코난 추천 Secret·Production만(넣은 화면은 보지 않음).
- 배포 순서(Vercel 캡처 13:39): `33b476c` push 배포 → 그 배포 Redeploy가 Production Current. 환경변수는 push 뒤에 넣었고 Redeploy로 반영됐다.

### 테스트 (Ray 폰)

- 13:44 첫 시도: 카카오 `KOE006`(등록하지 않은 리다이렉트 URI). 우리 쪽이 보낸 주소는 맞았다. Ray가 카카오 쪽을 고침 — **무엇이 빠져 있었는지는 코난이 듣지 못했다.**
- 13:48 "모두 통과"(Ray 보고): 버튼 → 카카오 동의 → 가입 마무리 → 새 이벤트(이메일 칸 비어 있음) → 마이페이지 → 탈퇴(카카오 재로그인).
- 코난이 직접 본 것은 없다(Firestore `users`의 `provider: "kakao"`·`signupTrackedAt`, 메타 가입 완료 신호, 탈퇴 뒤 카카오 "연결된 서비스"에서 사라졌는지 포함).

## 4. 남은 것

- 이 문서 커밋의 push(Ray).
- Ray 메모장의 카카오 키 3개 지우기.
- 테스트로 만든 이벤트·계정이 남아 있는지(탈퇴까지 했으면 없어야 한다) — 보지 않았다.
- 약관 제2조·제7조의 "비밀번호" 문구는 이메일 회원 전제 그대로(법률 묶음).
- 카카오 웹훅(이용자가 카카오 쪽에서 연결을 끊었을 때 알림) 미설정 — 받는 코드가 없다. 필요해지면.
- 프로젝트 자동 첨부 문서 재업로드(`33b476c` 이후 기준으로 다시).

## 5. 다음 세션 후보

1. 광고 집행 전 준비(백로그 V절): 광고 계정·페이지·결제 수단을 레이네 안에, Congre 데이터 세트 연결, "고객 기기에서 전환 측정" 결정, AI 생성 인물 광고 표시 기준 원문 확인.
2. 법률(D12 서울 리전 국외 이전 해당 여부, D13 광고 측정 동의, 약관 비밀번호 문구).
3. 쿠폰 10장 발급(U1), 폰 실기 확인(U12).

## 6. 관측 · 학습

- 코난 작업 공간에서 `next build`가 Google Fonts 403으로 실패하던 것은 `NEXT_FONT_GOOGLE_MOCKED_RESPONSES`로 글꼴 응답을 대체하면 통과한다(화면 글꼴 모양은 검증되지 않는다).
- Vercel Redeploy는 "그 배포의 코드"를 다시 빌드한다 — 환경변수만 바꿨을 때는 맞는 버튼이지만, 새 커밋을 올리려면 push다. 이번에는 Redeploy 대상이 카카오 커밋이라 결과가 맞았다.
- 핸드오프의 "하지 않았다"도 실측으로 다시 본다(오전 핸드오프의 push 상태가 달랐다).
- 필드샷 저장소는 PC 폴더 접근 요청이 거절돼 GitHub에서 읽기 전용으로 받아 읽었다.
