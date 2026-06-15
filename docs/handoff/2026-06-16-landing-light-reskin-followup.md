# 2026-06-16 — 랜딩 라이트 reskin 실측·후속 마무리

## 한 줄 요약
랜딩 라이트 reskin의 실측·후속 마무리. 배경(animated gradient)을 화면
고정 레이어로 빼고 비비드 파스텔로 확정(낮 실측 통과), 가독성 11곳 정리,
문구 1곳 교체. 라이트 전환 결정 + 학습룰을 영구문서에 박음(핸드오프1 보류분 해소).

## 본 세션 커밋
- (랜딩, git 외부) 배경 고정+비비드 / 가독성 11곳 / 문구 1곳 — Vercel 배포만 (git 없음)
  - dpl_4xvsKHYMibn8uuNhLjSSPkfESGeu (배경)
  - dpl_FBDSDuHxPCqZ9BRQLjo3rhaxiefR (가독성 11곳)
  - dpl_CJVGky7dvzehFdCaYtMXZzj1yrw9 (문구)
- fac854a docs(landing): 라이트 톤 전환 결정 + 학습룰 7개 + 인덱스 19
- (본 커밋) docs(landing): 배경 비비드 확정 + 후속 핸드오프

## 본 세션 한 일
1. 배경: html 직접 배경(페이지 전체 캔버스 = 화면 안 꿈틀 약함) →
   body::before position:fixed 고정 레이어. 색 연한 파스텔 → 비비드
   (#b9a8e6 #98c6ea #f0a8d0 #a0ddc8 #e6d68f). 낮 자연광 실측 통과·확정.
2. 가독성 11곳(다크 잔재 색): LIVE·EDITING 글자, 외주2주/예전방식 글자,
   Congre 붉은기("8분"만 주황 분리), Occasions 큰 영상 3개 글씨 삭제,
   하단 4타일 VIDEO 라벨 추가, VIDEO 글자색 밝게.
3. 문구: "각자의 폰에서 이런 한 컷씩" → "각자의 폰으로 10초 한마디."
4. 문서: decisions/landing.md (19) 라이트 전환 + CLAUDE.md 학습룰 7개
   + 인덱스 19 (핸드오프1의 "적용 때 박기" 보류분 해소).

## 미완 / 다음 세션 후보
- 🟢 배경 색 확정 완료 — 더 손댈 것 없음.
- 앱(본 앱) 15화면 라이트 전환 = 다음 큰 덩어리 (전부 다크, 미착수).
  그룹: 호스트(dashboard/create/events/mypage)·인증(host/signup/verify)=라이트,
  게스트(upload)·결과물(share)=다크, 법적/가이드=맨 뒤.
- 손질 잔여(이번 캡처 미발현): 카드 대비, SVG 일러스트 떠보임, 히어로
  모바일 버튼·선 깨짐 — 발현 시 정찰.

## 백업 (deploy 폴더)
- index_pre_bgfix_backup.html (배경 수정 전)
- index_pre_textcolor_backup.html (가독성 11곳 전)

## 주의 (변동 없음)
- 랜딩 = git 외부(C:\Users\PC\Downloads\congre\deploy, npx vercel --prod --yes).
- L8 푸터 약관·개인정보 절대경로(app.congre.kr) 보존 — CD zip 덮으면 소실 주의.

## 본 세션 학습
- 색 체감은 조명 의존 — 야간 1차 인상으로 색을 깎지 말고 낮 실측 후 확정
  (어젯밤 "진한 감" → 낮에 문제없음).
