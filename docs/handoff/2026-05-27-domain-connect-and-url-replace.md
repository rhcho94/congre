# 2026-05-27 — 도메인 congre.kr 가비아 → Vercel 연결 + 랜딩 푸터 URL 치환

> 직전 세션(2026-05-26 cont, Landing tiles + button flow)에서 미연결로 박아둔 임시 URL을 정리하는 사이클. 도메인 연결 → DNS 입력 → Vercel 검증 → 코드 치환 → 배포 흐름을 한 번에 마감.

## 완료된 작업 (순서대로)

### 1. Vercel 두 프로젝트에 도메인 추가

| 도메인 | 어느 프로젝트에 | 역할 |
|---|---|---|
| `congre.kr` | `congre-landing` | 랜딩 (307 → `www.congre.kr`) |
| `www.congre.kr` | `congre-landing` | 랜딩 메인 (Vercel 기본값) |
| `app.congre.kr` | `congre-three` | 본 앱 |

Vercel이 자동 할당한 DNS 값:

| 도메인 | 타입 | 호스트 | 값 |
|---|---|---|---|
| `congre.kr` | A | @ | `216.150.1.1` |
| `www.congre.kr` | CNAME | www | `e90d33e36f2987f1.vercel-dns-016.com.` |
| `app.congre.kr` | CNAME | app | `1e7ad02a99b98173.vercel-dns-017.com.` |

> 표준 76.76.21.21이 아니라 도메인별 고유 IP·CNAME이 할당됨. 검색 결과(`easytip.kr` 2026-03)에 같은 케이스 사례 있었음.

**참고**: Vercel UI 기본 셋업이 `www.congre.kr`을 메인으로 잡고 apex(`congre.kr`)는 307 리다이렉트. 운영자가 향후 apex 메인으로 바꾸고 싶으면 1분 작업. DNS 값은 동일.

### 2. 가비아 DNS 레코드 3개 추가

진입 경로 (가비아 신규 UI 기준):
- My가비아 → 도메인 상세 → **네임서버/DNS호스트/DNSSEC** 탭 → 좌측 사이드바 **DNS 관리** → `congre.kr` **레코드 수정**

기존 DNS 레코드 8개(AWS SES MX·TXT, Resend DKIM, DMARC, Firebase SPF/DKIM/verification)는 **건드리지 않고** 신규 3개만 행 추가. 작업 후 총 11건.

### 3. Vercel 검증 통과

DNS 전파 후 세 도메인 모두 ⚠️ Invalid → ✅ Valid Configuration. HTTPS 인증서 자동 발급 완료. 운영자 브라우저 접속 테스트 통과:
- `https://congre.kr` → 정상
- `https://www.congre.kr` → 정상
- `https://app.congre.kr` → 정상

### 4. 랜딩 `index.html` 푸터 URL 치환 (CC 트랙)

정찰 후 실행 2단계 분리.

**정찰 결과** (CC):
- `congre-three.vercel.app` 매칭 4건 (L2143, L2144, L2151, L2152) — 핸드오프 가정과 일치 ✅
- `congre-landing.vercel.app` 매칭 0건 — 의외의 곳 없음
- `deploy/` 폴더는 git 저장소 아님 (형상관리 외부)
- 배포 명령: `npx vercel --prod --yes` 그대로 사용

**실행** (CC):
- `https://congre-three.vercel.app/` → `https://app.congre.kr/` 일괄 치환
- 4건 모두 `target="_blank" rel="noopener noreferrer"` 속성 유지
- 치환 후 검증: `congre-three.vercel.app` 0건 / `app.congre.kr` 4건 ✅
- Vercel prod 배포: READY, 96.4KB 차분만 업로드

## 미완 작업 (다음 세션 시작 시 가장 먼저)

**운영자 푸터 클릭 테스트 미실행**. 마지막 사용자 경로 검증이 빠진 상태로 세션 종료. 다음 세션 시작 시:
- 새 탭에서 `https://congre.kr` 접속 (캐시 무시 Ctrl+Shift+R)
- 푸터 4개 링크 클릭 (위쪽 ul 2개, 아래 foot-bottom 2개) → 새 탭에서 `https://app.congre.kr/terms`·`/privacy` 정상 표시 확인
- `hello@congre.kr` 클릭 시 메일 앱 열리는지

## 결정 이력 메모

- **Vercel UI 변경 가정 사고**: 채팅 클로드가 첫 안내에서 "입력창이 화면에 바로 보인다"고 가정 (옛 UI 기억). 실제는 "Add Existing" 버튼 먼저 눌러야 모달 뜨는 새 UI. 운영자 스크린샷 보고 정정. **다음부터: 외부 SaaS UI 안내 전 운영자 첫 화면 확인.**
- **Vercel A 레코드 IP 표준값 추측 사고**: 76.76.21.21로 안내했으나 실제는 216.150.1.1 (도메인별 고유 IP). 검색에 케이스 있었으니 처음부터 "Vercel 화면이 표시하는 값을 그대로 쓸 것"으로 강조했어야. **다음부터: Vercel DNS 값은 항상 사용자 화면에서 확인.**
- **가비아 신규 UI 메뉴 트리 추측 사고**: 처음에 옛 UI 메뉴 (My가비아 → 도메인 관리 → 관리 → DNS 정보 → 도메인 연결 설정 → 레코드 수정) 기반 안내. 실제 진입은 좌측 사이드바 "DNS 관리". 운영자 첫 스크린샷 보고 정정. **다음부터: UI 자주 바뀌는 곳(가비아·Vercel)은 사용자 화면 먼저 보고 안내.**
- **기존 DNS 레코드 8개 발견 → 이메일 인프라 보호 경고**: AWS SES·Resend·Firebase 이메일 발송 인프라 살아있는 거 확인. 운영자가 "실수할 일 없고 전에도 해봤다"고 응답해 신뢰 처리. 결과적으로 사고 없이 마감. 다만 비개발자 운영자 작업이라 한 번 더 강조해둔 게 적절했음.
- **deploy 폴더 형상관리 외부 발견**: git 저장소 아님. 사고 발생 시 Vercel Deployments → promotion으로 롤백 가능하니 큰 위험 아님. 단, 미래에 협업이 늘거나 PR 검토 흐름 필요해지면 git 도입 검토.

## 해소된 알려진 이슈 (직전 핸드오프 기준)

- ✅ **`/terms`·`/privacy` 본 앱 절대 URL 임시 사용** → `https://app.congre.kr/`로 치환 완료. 도메인 미연결 임시 조치 해소.

## 신규 알려진 이슈

### deploy 폴더 형상관리 외부 (메모)
- **현황**: `C:\Users\PC\Downloads\congre\deploy` 는 git 저장소 아님. 본 앱 리포(`/c/Users/PC/...../congre`)와 별도 트랙으로 운영 중. 작업 이력·롤백 포인트 외부 (Vercel Deployments 탭이 유일).
- **잠재성**: 단독 운영자 1인 사이클이라 큰 사고 위험 없음. Vercel Deployments에서 이전 배포 promotion 가능.
- **격상 트리거**: (a) 협업자 추가 시점, (b) 큰 디자인 리팩토링 들어가는 사이클, (c) Vercel Deployments 히스토리 한도 도달.

## 격상 가능해진 후보 (도메인 연결로 차단 해제)

- **카톡 인앱 브라우저 `navigator.share` 미지원** (직전 핸드오프 알려진 이슈) → 카카오 JavaScript SDK 도입 검토 진입 가능. 카카오 디벨로퍼스에 자체 도메인 등록 필요한데 이제 `congre.kr` 사용 가능.
- **이메일 발송 도메인 점검** (직전 핸드오프 known-issues `네이버 메일 도달성`) → 이번 작업은 영향 없음. 다만 가비아 DNS 추가 작업 시 기존 8개 이메일 인프라 무사 보존 확인.

## 다음 세션 후보

직전 핸드오프 후보에서 갱신:

### 마감 작업
- **푸터 4개 링크 클릭 테스트** (위 미완 작업) — 다음 세션 시작 시 가장 먼저

### 콘텐츠
- **결혼식 영상 풀버전 만들지 / 15초 4편 유지 결정** (이전 후보 잔여) — 영상 길이는 운영자가 로컬에서 파일 우클릭 → 속성 → 자세히 → 길이로 확인 가능
- **후기 섹션 사진/아바타 추가** (이전 후보 잔여)

### 신규 페이지
- **가격 페이지 + 신청 폼 사양** (이전 후보 잔여) — "요금" 메뉴 현재 토스트 placeholder

### 카카오 SDK 도입 검토 (격상 트리거 해소)
- 도메인 연결됐으므로 진입 가능. 운영자 결정 영역 (카카오 디벨로퍼스 앱 등록 + 카카오 디벨로퍼스 콘솔 도메인 등록 필요).

### 운영자 페이지 텍스트 수정 사이클
- 운영자가 페이지 직접 보고 발견하는 수정 목록. 다음 세션 시작 시 운영자가 가져오면 처리.

## 다음 세션 시작 시 컨텍스트

랜딩 페이지 트랙은 본 앱 CC 트랙과 별도. 새 채팅 세션 시작 시:

1. 본 핸드오프 파일 첨부
2. 작업 영역 명시: "랜딩 페이지 (Vercel 별도 프로젝트, 정적 HTML) 작업. 본 앱 코드는 안 건드림."
3. 로컬 폴더: `C:\Users\PC\Downloads\congre\deploy`
4. 배포 명령: `npx vercel --prod --yes` (해당 폴더에서)
5. 현재 프로덕션 도메인:
   - 랜딩: `https://congre.kr` (307 → `www.congre.kr`), `https://www.congre.kr`
   - 본 앱: `https://app.congre.kr`
6. 본 앱 `docs/DECISIONS.md`·`known-issues.md`엔 이번 작업 반영 X (랜딩 페이지는 별도 트랙).

## 작업 요약 (한 줄)

가비아 congre.kr → Vercel 두 프로젝트 연결 (`congre-landing` + `congre-three`) + 랜딩 푸터 4개 링크를 `app.congre.kr`로 일괄 치환 + 프로덕션 배포 완료. 푸터 클릭 테스트만 다음 세션으로 이월.
