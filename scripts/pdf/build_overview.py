"""Congre 앱소개서 — 본 빌드 (3페이지, A4 가로)."""
from reportlab.pdfgen import canvas
from pdf_common import (
    register_fonts, fill_bg,
    draw_page_header, draw_page_footer,
    draw_section_tag, draw_h3, draw_para, draw_mixed_text, text_width_mixed,
    BG, ACCENT, TEXT, MUTED, RULE, SURFACE, SURFACE2,
    PAGE_W, PAGE_H, MARGIN_X, MARGIN_TOP, MARGIN_BOTTOM,
)

OUT = "congre-company-overview.pdf"

register_fonts()
c = canvas.Canvas(OUT, pagesize=(PAGE_W, PAGE_H))

# =============================================================
# 페이지 1 — 문제 (PROBLEM)
# =============================================================
fill_bg(c)
draw_page_header(c, 1, 3, "P R O B L E M")

y = PAGE_H - MARGIN_TOP - 50
draw_section_tag(c, MARGIN_X, y, "S E C T I O N   0 1")
y -= 50

# 대제목
c.setFillColor(TEXT)
c.setFont("NotoKR-Bold", 36)
c.drawString(MARGIN_X, y, "행사가 끝나면,")
y -= 46
c.drawString(MARGIN_X, y, "영상은 어디로 가나요")
y -= 60

# 영문 부제 italic
c.setFont("Cormorant-Italic", 18)
c.setFillColor(ACCENT)
c.drawString(MARGIN_X, y, "The moments are lost.")
y -= 50

# 4개 시장 2x2 그리드
markets = [
    ("돌잔치",
     "부모는 아이를 봐야 하는데 카메라도 들어야 합니다. 손님 한 사람 한 사람의 축하 영상은 단톡방에 흩어진 채 남습니다."),
    ("기업 행사",
     "컨퍼런스·송년회 영상 편집을 외주에 맡기면 수십·수백만 원, 보통 2~3주 후 받습니다. 분위기가 식은 후입니다."),
    ("결혼식",
     "신랑신부는 그날 카메라를 들 수 없습니다. 하객의 진심 어린 축하는 사진 몇 장으로 남습니다."),
    ("졸업식",
     "학생 한 명 한 명의 소감을 한 편에 담으려면 누군가 모든 학생을 인터뷰해야 합니다. 시간과 인력이 듭니다."),
]
col_w = (PAGE_W - 2 * MARGIN_X - 32) / 2
row_h = 90
start_y = y
for i, (label, body) in enumerate(markets):
    col = i % 2
    row = i // 2
    bx = MARGIN_X + col * (col_w + 32)
    by = start_y - row * (row_h + 16)
    draw_h3(c, bx, by, label, size=12)
    draw_para(c, bx, by - 22, body, size=9.5, max_width=col_w, line_height=15, color=TEXT)

# 하단 한 줄
y_bottom = MARGIN_BOTTOM + 30
draw_mixed_text(c, MARGIN_X, y_bottom,
                "공통 문제 — 개인 영상이 모이지 않고, 모여도 한 편으로 만들기 어렵습니다.",
                10.5, en_font="DMSans-Medium", kr_font="NotoKR-Medium", color=MUTED)

draw_page_footer(c)
c.showPage()

# =============================================================
# 페이지 2 — 해결 방법 (SOLUTION)
# =============================================================
fill_bg(c)
draw_page_header(c, 2, 3, "S O L U T I O N")

y = PAGE_H - MARGIN_TOP - 50
draw_section_tag(c, MARGIN_X, y, "S E C T I O N   0 2")
y -= 50

# 대제목
c.setFillColor(TEXT)
c.setFont("NotoKR-Bold", 36)
c.drawString(MARGIN_X, y, "QR 한 번이면,")
y -= 46
c.drawString(MARGIN_X, y, "5분 후 완성")
y -= 60

# 영문 부제 italic
c.setFont("Cormorant-Italic", 18)
c.setFillColor(ACCENT)
c.drawString(MARGIN_X, y, "From QR to final video — in 5 minutes.")
y -= 44

# 5개 차별점 — 좌측 5개 리스트
diffs = [
    ("QR 1회로 수집",
     "참가자가 QR을 스캔하면 폰 브라우저에서 바로 촬영·업로드. 한 명의 호스트가 100명의 영상을 동시에 모읍니다."),
    ("앱 설치 없음",
     "참가자는 가입·다운로드 불필요. 링크 또는 QR 하나로 진행됩니다."),
    ("5분 내 AI 자동 편집",
     "마감 즉시 AI가 베스트컷을 선별해 한 편의 영상을 완성합니다. 외주 2주가 자동 5분으로."),
    ("자동 알림",
     "마감·렌더 시작·완료까지 호스트는 이메일·SMS로 자동 안내받습니다. 진행 상황 별도 확인 불필요."),
    ("9:16 SNS 최적",
     "인스타 릴스·틱톡·카카오 어디에든 즉시 업로드 가능한 세로 영상."),
]

# 좌측 영역 + 우측 강조 박스
left_w = (PAGE_W - 2 * MARGIN_X) * 0.58
right_x = MARGIN_X + left_w + 24
right_w = PAGE_W - MARGIN_X - right_x

# 5개 차별점 좌측 세로 배치
list_start_y = y
for i, (label, body) in enumerate(diffs):
    by = list_start_y - i * 50
    # 번호 (액센트, 큰)
    c.setFont("Cormorant-Italic", 22)
    c.setFillColor(ACCENT)
    num_w = c.stringWidth(f"0{i+1}", "Cormorant-Italic", 22)
    c.drawString(MARGIN_X, by - 4, f"0{i+1}")
    # 라벨
    draw_h3(c, MARGIN_X + 36, by, label, size=11.5)
    # 본문
    draw_para(c, MARGIN_X + 36, by - 18, body, size=9, max_width=left_w - 36, line_height=13.5, color=TEXT)

# 우측 강조 박스 — "외주 2주가 자동 5분"
box_y = list_start_y - 220
box_h = 160
# 박스 배경
c.setFillColor(SURFACE2)
c.rect(right_x, box_y, right_w, box_h, fill=1, stroke=0)
# 좌측 액센트 라인
c.setFillColor(ACCENT)
c.rect(right_x, box_y, 3, box_h, fill=1, stroke=0)

# 박스 안 내용
bx = right_x + 24
# 영문 라벨
c.setFont("DMSans-Bold", 8)
c.setFillColor(ACCENT)
cur_x = bx
for ch in "C O R E   V A L U E":
    c.drawString(cur_x, box_y + box_h - 28, ch)
    cur_x += c.stringWidth(ch, "DMSans-Bold", 8) + 1.8

# 큰 숫자 — Cormorant italic
c.setFont("Cormorant-Italic", 56)
c.setFillColor(TEXT)
c.drawString(bx, box_y + 76, "2 weeks")
c.setFont("NotoKR-Bold", 14)
c.setFillColor(MUTED)
c.drawString(bx + 175, box_y + 96, "외주")

# 화살표 + 결과
c.setFont("Cormorant-Italic", 18)
c.setFillColor(MUTED)
c.drawString(bx, box_y + 52, "becomes")

c.setFont("Cormorant-Italic", 56)
c.setFillColor(ACCENT)
c.drawString(bx, box_y + 8, "5 min")
c.setFont("NotoKR-Bold", 14)
c.setFillColor(TEXT)
c.drawString(bx + 145, box_y + 28, "AI 자동")

# 박스 하단 한 줄
draw_mixed_text(c, bx, box_y - 18,
                "행사 분위기가 식기 전에 영상이 나옵니다.",
                9.5, en_font="DMSans-Medium", kr_font="NotoKR-Medium", color=MUTED)

draw_page_footer(c)
c.showPage()

# =============================================================
# 페이지 3 — 구현 기능 (FEATURES)
# =============================================================
fill_bg(c)
draw_page_header(c, 3, 3, "F E A T U R E S")

y = PAGE_H - MARGIN_TOP - 50
draw_section_tag(c, MARGIN_X, y, "S E C T I O N   0 3")
y -= 50

# 대제목
c.setFillColor(TEXT)
c.setFont("NotoKR-Bold", 36)
c.drawString(MARGIN_X, y, "지금 동작하는 모든 것")
y -= 56

# 영문 부제
c.setFont("Cormorant-Italic", 18)
c.setFillColor(ACCENT)
c.drawString(MARGIN_X, y, "Everything that works today.")
y -= 40

# 5개 기능 그룹 — 좌측 2열 분배
features = [
    ("호스트",
     ["회원가입·이메일 인증", "이벤트 생성 (4 플랜)", "QR·링크 공유",
      "인트로/아웃트로 텍스트·이미지", "클립 토글로 제외", "마감 / 재렌더",
      "마이페이지 (프로필·비밀번호·탈퇴)"]),
    ("게스트",
     ["QR·링크 진입", "이름·전화 입력", "폰 네이티브 카메라 + 갤러리 선택",
      "인당 최대 16초 (호스트 설정)", "미리보기·재촬영"]),
    ("AI · 자동화",
     ["베스트컷 자동 선별", "5분 내 자동 편집", "자동 삭제 (클립 24h · 완성본 7일)"]),
    ("알림",
     ["이메일 + SMS 동시 발송", "이벤트 생성 / 렌더 시작 / 완료",
      "지연 / 실패 / 참가자 결과"]),
    ("공유",
     ["MP4 다운로드", "카카오톡 즉시 전송",
      "링크 복사 (SNS·블로그)", "9:16 세로 (인스타·틱톡 최적)"]),
]

# 3x2 그리드 (5칸 + 플랜 박스 1칸)
group_w = (PAGE_W - 2 * MARGIN_X - 2 * 20) / 3
group_h = 130

start_y = y
for i, (label, items) in enumerate(features):
    col = i % 3
    row = i // 3
    gx = MARGIN_X + col * (group_w + 20)
    gy = start_y - row * (group_h + 14)
    # 라벨 (액센트)
    draw_h3(c, gx, gy, label, size=11.5)
    # 항목들
    for j, item in enumerate(items):
        item_y = gy - 22 - j * 14
        # 불릿
        c.setFillColor(ACCENT)
        c.circle(gx + 3, item_y + 4, 1.2, fill=1, stroke=0)
        # 본문
        draw_mixed_text(c, gx + 12, item_y, item, 8.5, color=TEXT)

# 플랜 박스 — 우하단 6번째 자리
plan_x = MARGIN_X + 2 * (group_w + 20)
plan_y = start_y - 1 * (group_h + 14)
# 박스 배경
c.setFillColor(SURFACE)
c.rect(plan_x, plan_y - group_h + 14, group_w, group_h, fill=1, stroke=0)
# 좌측 액센트 라인
c.setFillColor(ACCENT)
c.rect(plan_x, plan_y - group_h + 14, 2, group_h, fill=1, stroke=0)
# 내용
draw_h3(c, plan_x + 16, plan_y, "플랜", size=11.5)
plans = [
    ("무료", "10클립"),
    ("소형", "50클립"),
    ("중형", "200클립"),
    ("대형", "무제한"),
]
for j, (name, capacity) in enumerate(plans):
    py = plan_y - 22 - j * 16
    # 플랜명 (텍스트)
    draw_mixed_text(c, plan_x + 16, py, name, 9, en_font="DMSans-Medium", kr_font="NotoKR-Medium", color=TEXT)
    # 용량 (액센트, 우측 정렬)
    cap_w = text_width_mixed(c, capacity, 9, en_font="DMSans-Medium", kr_font="NotoKR-Medium")
    draw_mixed_text(c, plan_x + group_w - 16 - cap_w, py, capacity, 9,
                    en_font="DMSans-Medium", kr_font="NotoKR-Medium", color=ACCENT)

# 하단 한 줄
y_bottom = MARGIN_BOTTOM + 30
draw_mixed_text(c, MARGIN_X, y_bottom,
                "행사당 단건 결제 · 가격은 별도 문의",
                10.5, en_font="DMSans-Medium", kr_font="NotoKR-Medium", color=MUTED)

draw_page_footer(c)
c.showPage()

c.save()
print(f"빌드 완료: {OUT}")
