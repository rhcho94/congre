# Shotstack 영상 품질 향상 후보 — 즉효 기능 + 가짜 비트싱크

> 조사일 2026-06-05. Shotstack 공식 문서 기준. **결정 아님 — 후보·참고용.**
> 실제 채택 전 "Congre 현재 사용 여부"(코드 정찰)와 비용·품질 검증이 선행되어야 함.

## 이 문서의 범위
- 담는 것: Shotstack이 **이미 제공**해서 외부 인프라 없이 켤 수 있는 영상 품질 기능
  (1번 즉효 3종) + 외부 인프라 0으로 가능한 가짜 비트싱크(2번).
- 안 담는 것: 자동 전사 자막·TTS(크레딧·품질 검증 선행), AI 베스트 순간 선별·얼굴인식
  (외부 인프라 + 미성년자 법적 리스크). → 별도 영역에서 다룸.

## 3층 프레임 (맥락)
- 층 1: Shotstack이 제공함 → 우리가 안 쓰고 있을 뿐.
- 층 2: Congre 현재 사용 여부 → **코드(src/lib/shotstack.ts) 정찰 필요. 현재 미실시.**
- 층 3: Shotstack 밖(별도 서비스 통합 필요).

## 1번 — 즉효 3종 (Shotstack 제공, 외부 인프라 0)

### (1) Rich Captions — 애니메이션 자막
- 무엇: 단어 단위로 튀는 자막. karaoke(노래방)·bounce·pop 애니메이션 + 말하는 단어 하이라이트.
  기존 caption asset의 후속 버전.
- 매력 기여: 틱톡·릴스의 "글자 튀는" 감성. Gen Z 또래 공유 콘텐츠의 핵심 비주얼.
- 부르는 법(개념): caption asset에 오디오/영상 클립을 alias로 연결 → 자동 전사 + 스타일 적용.
  Rich Captions는 여기에 word-level 애니메이션·하이라이트를 더한 상위 버전.
- 단서: 자동 전사 품질(시끄러운 현장 + 짧은 멘트)은 **미검증**. 수동 SRT/VTT 주입도 가능.

### (2) 모션 이펙트 — 줌·팬
- 무엇: zoomIn, slideRight/slideDown 등 클립 모션 효과. Fast/Slow 접미사로 3단계 속도.
- 매력 기여: 정적인 클립에 생기 부여(켄번스 효과). 정지화면 같은 밋밋함 제거.
- 부르는 법(개념): 클립의 effect 속성.

### (3) 필터 — 색보정
- 무엇: boost(색감 강조), greyscale 등.
- 매력 기여: 한 줄로 통일된 "시네마틱" 룩. 제각각인 폰 영상의 색감을 정돈.
- 부르는 법(개념): 클립의 filter 속성.

## 2번 — 가짜 비트싱크 (외부 인프라 0, Congre가 timing 계산)
- 원리: Shotstack은 음악 비트 감지를 **하지 않음**. 받은 timing(start/length)대로 렌더할 뿐.
  따라서 Congre가 **고정 템포 기준 컷 지점을 계산**해서 클립 길이를 그 격자에 맞추면
  "박자에 맞춰 끊기는" 느낌을 낼 수 있음.
  예) BGM 120 BPM → 1박 0.5초 → 클립당 4박(2초)·8박(4초) 격자로 컷.
- 장점: 외부 라이브러리·인프라 0. 비용 0. "리듬감" 즉시 확보.
- 한계: 진짜 비트 감지가 아니라서 곡의 실제 다운비트·드롭과 안 맞을 수 있음.
  곡마다 BPM·박자가 다르므로 BGM별 BPM 메타데이터가 선행 필요.
- 고급화 경로(나중·층 3): 진짜 비트 감지는 외부 오디오 분석 필요. 지금은 YAGNI.

## 중요 단서·제약 (다음에 볼 때 헛걸음 방지)
- Shotstack 한계: 키프레임·커스텀 애니메이션 미지원(고급 효과는 After Effects 오버레이 권장).
  같은 트랙에서 클립 시간 겹침 금지(깜빡임). 영상 자산 합계 512MB 제한(2020 자료 — **현재 유효성 미확인**).
- AI 생성 자산(TTS·text-to-image·자동 전사)은 **크레딧 소모 = 비용**. Shotstack storage 과금 맥락과 함께 볼 것.
- **Congre 현재 사용 여부 미확인**: 확인된 사용분 = 트랜지션 in/out, 음량 페이드, 한글 자막,
  한글 인트로/아웃트로(rich-text), NotoSansKR 폰트. effect·filter·rich-caption·자동 전사 사용 여부는
  src/lib/shotstack.ts 정찰 전까지 불명.

## 다음 단계 후보
1. CC 정찰 1회(읽기 전용): shotstack.ts에서 현재 effect·filter·caption 사용 여부 확인
   → "안 쓰는 즉효" 목록 확정.
2. 즉효 3종 중 우선순위 결정 (Rich Captions가 매력 대비 효과 가장 클 것으로 추정 — 미확정).
3. 가짜 비트싱크는 BGM별 BPM 메타데이터 선행 필요.

## 출처 (Shotstack 공식 문서, 2026-06-05 조사)
- Edit API / 핵심 개념: shotstack.io/docs/api, shotstack.io/docs/guide/getting-started/core-concepts/
- Captions / Rich Captions: shotstack.io/docs/guide/architecting-an-application/captions/ , help.shotstack.io 자동 자막
- AI 자산(TTS·text-to-image·image-to-video·GPT-4): shotstack.io/docs/guide/generating-assets/
- 한계(키프레임 미지원): shotstack.io/learn/studio-designers-guide/
