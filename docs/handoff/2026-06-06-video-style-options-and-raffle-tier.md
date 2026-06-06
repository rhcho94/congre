# 2026-06-06 — 영상 스타일 옵션 3종 구현(색감·전환·이름자막) + 추첨 티어 결정 + ⑦ 대기 유지

## 한 줄 요약
영상 품질 "고급 설정" 그릇(createRender style 인자)을 깔고 색감·전환·이름자막 3옵션을
대시보드에서 호스트가 고르게 atomic 3커밋으로 구현. 추첨 기능은 "티어2 기본거처 + 이름
회전 MVP"로 개념 확정(구현은 아직). ⑦은 raw 로그 미도착으로 대기 유지.

## 본 세션 커밋 (본 앱 git)
- e6572e2 feat: add per-event video color filter option (cinematic/vivid/sharp)
- 310f2b4 feat: add per-event transition style option (soft/dynamic)
- c991df9 feat: add per-event participant name captions

## 본 세션 결정·발견
### 영상 스타일 "고급 설정" 묶음
- 그릇 = createRender 5번째 인자 `style?: { filter?, transition?, showNames? }`. 옵션은
  하나씩 이 그릇에 키 추가하는 패턴.
- 배치 = 이벤트 대시보드(`events/[eventId]`)의 intro/outro 입력 자리. **생성 폼 아님**
  (introText가 생성 폼이 아니라 대시보드에서 PATCH로 입력되는 걸 정찰로 확인 → 그릇 위치
  수정). autosave 500ms debounce → PATCH, 디폴트=필드 없음(현행 관행 그대로).
- 색감: muted(시네마틱)/boost(화사)/contrast(또렷). 미선택=미적용. videoClips clip 레벨 filter.
- 전환: TRANSITION_POOL 단일 → 3개 풀(default/soft/dynamic). soft=[fade,fadeSlow],
  dynamic=[slideLeftFast,slideRightFast,zoom]. 풀 크기 ≥2로 pickSequence 무한루프 회피.
- 이름자막: showNames 토글. 참가자 영상과 같은 numeric start/length로 rich-text 캡션
  (NotoSansKR 36 white + stroke, 하단 중앙). [A] textClips 공유(겹침 시 새 트랙)/[B] 새 트랙.
- 채택 항목: 색감·이름자막·전환·BGM(정찰선행). **모션(effect)은 이번 메뉴 제외** — 그릇
  있으니 후속 추가 가능.
- 옵션화 사유: 품질 + "정교하게 만든다"는 신뢰 시그널(운영자 인사이트). progressive
  disclosure(디폴트로 그냥 가거나 펼쳐 조정)로 비개발자 호스트 압도 회피.

### 추첨 기능 (개념 확정, 구현 아직)
- 티어 포지셔닝: **티어2(현장·오픈)가 기본거처** — 추첨은 렌더 불필요(썸네일/이름만)라
  티어2 데드타임(완성 미보장)을 메우고, 마감 후 렌더 시간 변수에 의존 안 함. 단 기술적으론
  이벤트 단위로 둬 티어 하드결속 X(토글 추상화는 YAGNI로 안 만듦).
- 비주얼: **이름 회전 MVP**. 정찰 결과 클립에 썸네일/정지이미지가 Firestore·S3·클라 어디에도
  없음. 영상 직접 회전(성능 리스크)·썸네일 생성(업로드 흐름 손댐) 대신 uploaderName 회전.
  썸네일은 v2 후보로 보류.
- 데이터: 클립 1건=업로더 1명 강제(중복 업로드 409) → 클립 목록=업로더 목록=1인1표 풀.

### Shotstack 외부 사실 재확인 (문서)
- effect(zoomIn 등)·filter(boost/muted/contrast 등)·transition(Fast/Slow 속도 변형)·caption/
  title/html asset 모두 빌트인(외부 인프라 0). 키프레임 미지원·트랙 내 클립 겹침 금지 = 맞음 확인.
  512MB 제한은 미확인 유지.

## 미완 / 대기 (다음 세션 우선순위)
1. **⑦ Shotstack raw 로그 도착 여부 확인** (최우선·외부 대기). 미도착이면 계속 대기.
2. **영상 스타일 3종 렌더 실측** (⑦ 풀린 뒤 한 영상에서 몰아서): ① 색감 디폴트 승격 여부
   ② 전환 soft/dynamic 체감 ③ 자막 위치·가독성 ④ intro 비디오 캡션 어긋남 실제 정도.
3. **BGM 분위기 옵션**: 현재 곡이 1곡 고정인지 여러 곡인지 미확인 → shotstack.ts soundtrack
   src 출처 정찰 선행. 곡 자산(라이선스) 확보 필요.
4. **추첨/이름자막 묶음 설계**: 추첨을 "지금 만들 기능"으로 확정 시 → 호스트 대시보드 진행
   화면 설계. 이름자막과 같은 "사람 중심" 축.

## 본 세션 학습
- **프롬프트에 절대 숫자(인덱스 카운트 등)를 박지 말 것** — 첨부본이 stale일 수 있음(DECISIONS
  rendering 29로 박았으나 실제 32). "현재 +1" 같은 상대값으로 위임.
- **정찰이 설계 그림을 수정함** — "생성 폼에 introText 있을 것" 가정이 깨짐(실제 대시보드).
  실행 프롬프트 짜기 전 반대쪽 끝(폼·저장·읽기 경로) 정찰의 값.
