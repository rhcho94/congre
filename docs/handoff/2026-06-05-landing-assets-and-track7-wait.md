# 2026-06-05 (v2) — 랜딩 자산 3건 배포 + ⑦ 대기 유지 + 제품 브레인스토밍 + 영상품질 문서 신규

## 한 줄 요약
랜딩(congre.kr) 영상/이미지 자산 3건 교체·배포(READY, 폰·PC 실측 통과). ⑦은 Shotstack 지원
2차 답변에서 SCP 가설 공식 철회 + render ID 2개 고정 — raw 로그 대기 유지(답장 없이 침묵).
제품 방향 브레인스토밍(추첨 기능·두 티어 모델·영상 매력 축) 진행, Shotstack 품질 후보를
공식 문서 docs/rendering-quality-candidates.md로 신규 작성.

## 본 세션 커밋
- (랜딩, git 외부) 영상 src 교체 + CTA 이미지 삽입/문구 삭제 + 송년 타일 이미지 교체 → Vercel 배포만
- docs: add Shotstack video-quality feature candidates (rich captions, motion FX, filters, pseudo beat-sync)
  → docs/rendering-quality-candidates.md 신규 (본 앱 git)
- docs: add 2026-06-05 v2 handoff (본 파일)

## 본 세션 변경 — 랜딩 트랙 (git 외부, Vercel만)
- 데모 모달 영상: videos/demo.mp4 추가 + <video id="demoVideo"> src 교체(wedding_intro.mp4 → demo.mp4).
  기존 wedding_intro.mp4는 타일 루프용 잔존. 신규 영상 1440×1080(4:3) 64.7초 34MB preload=metadata.
- Occasions "송년·입사·퇴임" 타일: uploads/기업행사.jpg 덮어쓰기(연회장 건배 사진). markup 변경 없음.
- CTA(cta-final): <p>참가자에게 링크만…</p> 삭제 + uploads/cta-storyboard.jpg 삽입(inline style max-width 640px).
- 배포: npx vercel --prod --yes → READY, alias www.congre.kr. 폰·PC 실측 3개 자산 모두 통과.

## ⑦ Shotstack→S3 — 외부 대기 (2차 답변 처리, raw 로그 대기 유지)
- 지원 2차 답변: (a) 엉뚱한 render ID(55a7919e…) 우리 스레드 출처 해명 + 우리 지정 2개(25680c47…,
  b35064a0…)로 내부 티켓 명시 고정. (b) 우리 직접 PutObject 3종 ACL 성공 인정 → SCP/버킷 경계 가설
  공식 철회. 초점을 "워커 환경 요청 구성/평가"(리전 엔드포인트·user-agent·세션/헤더)로 좁힘.
  (c) raw error payload + AWS Request ID + 워커 컨테이너 실제 Access Key ID 추출 후 보내주겠다 — CloudTrail 대조용.
- 우리 판단: 직전 두 카드(render ID 정정 / PutObject 반박) 그대로 먹힘. 원인 후보 "Shotstack 워커
  내부 처리 / 등록 키 불일치"로 좁혀짐. 새로 밀 카드 없음 → 답장 없이 대기(옵션 B).

## 제품 브레인스토밍 (결정 아님 — 다음 라운드 후보)
### 시장 재정의
- 1순위(졸업식)의 구매자는 학교·교사가 아니라 **학생 본인들**(또래끼리 재미). 결혼식은 신랑신부 본인.
  → B2B 납품이 아니라 또래/소비자 소셜 콘텐츠. 매력 중심이 "전문 퀄리티"보다 공유·확산·정체성·실시간·재미로 이동.
### 추첨 기능 구상 (현장 진행자 전제)
- 업로드한 영상 썸네일이 빠르게 돌다 점점 느려지며 탈락 → 결승 2개 교차 → 당첨 연출.
- 확정 스펙: 추첨 풀=업로더(사람) 단위(1인 1표), 당첨=여러 명(순차/동시), 공정성=A안(연출 우선 랜덤),
  진행 화면=호스트 대시보드 한 곳 큰 화면(참가자 폰 동기화 안 함 — YAGNI).
- 미확정: 추첨을 "지금 만들 기능"으로 확정 안 함(아이디어 단계). 두 티어 중 어디 붙을지에 따라 설계 갈림.
- 미확인: 호스트 대시보드의 업로더 데이터 형태 + 클립 썸네일 유무 → 만들 때 CC 정찰 선행.
### 두 티어 모델 구상 (시간 보장 축)
- 티어1(사전·정예): 미리 부탁받은 친구들이 행사 전 업로드 → 완성 보장 → 식전영상 본편. "약속 가능한 핵심 상품".
- 티어2(현장·오픈): QR/링크로 현장 다수 수집 → **마감~행사종료 사이 완성 보장 안 됨(반드시 사고)**.
  제안 프레임: 현장 완성을 약속하지 말고 "라이브(현장 스크린에 흐름·추첨)" + "사후 보너스 영상"으로 재구성.
- 미확인: 마감 후 렌더 소요 시간(수 분 vs 수십 분) → 티어2가 "행사 중 보너스" 가능한지 가르는 핵심 변수. 추측 금지.

## 새 문서
- docs/rendering-quality-candidates.md: Shotstack 영상 품질 후보. 1번 즉효 3종(Rich Captions·모션 이펙트·필터,
  외부 인프라 0) + 2번 가짜 비트싱크(Congre가 timing 계산). 제외: 자동 전사/TTS(크레딧·품질 검증), 얼굴인식(외부+미성년자 리스크).
- 핵심 단서: Shotstack은 키프레임 미지원, 트랙 내 클립 겹침 금지, 512MB 제한(현재 유효성 미확인),
  AI 자산=크레딧 소모. Congre 현재 effect·filter·rich-caption 사용 여부 미확인 → shotstack.ts 정찰 필요.

## 이번 세션 학습
- 불확실 신호 뜨면 CC 정찰 전에 과거 대화부터 검색(L6 OneDrive는 6/3에 이미 해소됐는데 핸드오프 "확인 필요"
  문구만 보고 정찰부터 짤 뻔함).
- 외부 도구 존재를 환경 확인 없이 단정 금지(python -m http.server 가정 → 이 PC Python 미설치, Node http-server로 대체).
- .jpg/.jpeg는 동일 형식·확장자만 다름. 코드가 .jpg를 가리키면 파일도 .jpg여야 매칭. 비개발자에겐 이름 맞춘 파일 직접 제공이 안전.
- Shotstack 같은 외부 SaaS 기능은 추측 금지·공식 문서 확인. "제공 여부"와 "우리 사용 여부"를 층으로 분리.

## 떨어진 신호 (다음 세션 후보 / 메모)
- 랜딩 git 외부 리스크(L8 계열): 이번 3건 변경 Vercel에만 존재, git 이력 없음. CD가 새 zip 풀어덮으면 소실 가능.
- CC ※recap 반복: 이번에도 프롬프트 명시 금지에도 첨부. CC 설정 레벨 손볼 신호(누적).
- CTA 스토리보드 이미지: 번호 태그·AI "Congre" 글자 포함 콘티를 운영자 판단으로 게시. NO-TEXT 룰과 긴장. 추후 교체 여지.
- 마감 후 렌더 소요 시간 미확인 — 두 티어·현장 보너스 설계의 핵심 변수.

## 다음 세션 시작 시 가장 먼저
- ⑦ Shotstack 지원 raw 로그(error payload + AWS Request ID + 워커 실제 Access Key ID) 도착 여부 확인
  (최우선·외부 대기). 도착 시 CloudTrail 대조로 등록키 불일치 / 워커 내부 처리 갈림. 미도착이면 ⑦ 계속 대기.
- 제품 트랙 이어갈 경우: 추첨이 어느 티어에 붙는지 결정 → 그 뒤 설계. 또는 즉효 3종 정찰부터.
