"""Congre PDF 공통 모듈 — 디자인 토큰·폰트·헬퍼."""
from reportlab.lib.colors import HexColor
from reportlab.pdfbase import pdfmetrics
from reportlab.pdfbase.ttfonts import TTFont

# 디자인 토큰 (globals.css 정합)
BG = HexColor("#0c0b09")
SURFACE = HexColor("#151310")
SURFACE2 = HexColor("#1e1a13")
ACCENT = HexColor("#c8892c")
TEXT = HexColor("#ede8df")
MUTED = HexColor("#79716a")
RULE = HexColor("#2a2520")

# 페이지 — A4 가로
PAGE_W = 841
PAGE_H = 595

# 마진
MARGIN_X = 56
MARGIN_TOP = 56
MARGIN_BOTTOM = 56

# 폰트 등록
FONTS_REGISTERED = False

def register_fonts(fonts_dir="fonts"):
    global FONTS_REGISTERED
    if FONTS_REGISTERED:
        return
    pdfmetrics.registerFont(TTFont("Cormorant-Italic", f"{fonts_dir}/CormorantGaramond-Italic.ttf"))
    pdfmetrics.registerFont(TTFont("Cormorant-BoldItalic", f"{fonts_dir}/CormorantGaramond-BoldItalic.ttf"))
    pdfmetrics.registerFont(TTFont("DMSans", f"{fonts_dir}/DMSans-Regular.ttf"))
    pdfmetrics.registerFont(TTFont("DMSans-Medium", f"{fonts_dir}/DMSans-Medium.ttf"))
    pdfmetrics.registerFont(TTFont("DMSans-Bold", f"{fonts_dir}/DMSans-Bold.ttf"))
    pdfmetrics.registerFont(TTFont("NotoKR", f"{fonts_dir}/NotoSansKR-Regular.ttf"))
    pdfmetrics.registerFont(TTFont("NotoKR-Medium", f"{fonts_dir}/NotoSansKR-Medium.ttf"))
    pdfmetrics.registerFont(TTFont("NotoKR-Bold", f"{fonts_dir}/NotoSansKR-Bold.ttf"))
    FONTS_REGISTERED = True

def is_korean(ch):
    """한글·CJK 영역 판별."""
    o = ord(ch)
    # 한글 자모·완성형·호환 자모·CJK 통합 한자
    return (0xAC00 <= o <= 0xD7A3) or (0x1100 <= o <= 0x11FF) or (0x3130 <= o <= 0x318F) or (0x3400 <= o <= 0x9FFF)

def split_runs(text):
    """텍스트를 한글·영문 영역으로 분해. [(text, is_korean), ...] 반환."""
    if not text:
        return []
    runs = []
    cur = text[0]
    cur_k = is_korean(text[0])
    for ch in text[1:]:
        ch_k = is_korean(ch)
        if ch_k == cur_k:
            cur += ch
        else:
            runs.append((cur, cur_k))
            cur = ch
            cur_k = ch_k
    runs.append((cur, cur_k))
    return runs

def draw_mixed_text(c, x, y, text, size, en_font="DMSans", kr_font="NotoKR", color=None):
    """한글·영문 자동 전환 출력. x, y에서 시작. 끝 x 좌표 반환."""
    if color is not None:
        c.setFillColor(color)
    cur_x = x
    for run, is_k in split_runs(text):
        font = kr_font if is_k else en_font
        c.setFont(font, size)
        c.drawString(cur_x, y, run)
        cur_x += c.stringWidth(run, font, size)
    return cur_x

def text_width_mixed(c, text, size, en_font="DMSans", kr_font="NotoKR"):
    """한글·영문 혼합 텍스트 폭 계산."""
    w = 0
    for run, is_k in split_runs(text):
        font = kr_font if is_k else en_font
        w += c.stringWidth(run, font, size)
    return w

def fill_bg(c):
    """페이지 배경 칠하기."""
    c.setFillColor(BG)
    c.rect(0, 0, PAGE_W, PAGE_H, fill=1, stroke=0)

def draw_page_header(c, page_num, total, section_label, brand_pos="right"):
    """페이지 상단 헤더 — 좌측 페이지 번호 + 섹션 라벨, 우측 Congre 브랜드."""
    # 좌측: "01 · OVERVIEW" 형식
    left = f"{page_num:02d}  ·  {section_label}"
    c.setFont("DMSans-Medium", 8)
    c.setFillColor(MUTED)
    # 트래킹 (자간) 효과 — 글자 사이 간격
    cur_x = MARGIN_X
    for ch in left:
        c.drawString(cur_x, PAGE_H - MARGIN_TOP + 10, ch)
        cur_x += c.stringWidth(ch, "DMSans-Medium", 8) + 1.5  # tracking
    # 우측: Congre (italic)
    c.setFont("Cormorant-Italic", 14)
    c.setFillColor(ACCENT)
    brand_w = c.stringWidth("Congre", "Cormorant-Italic", 14)
    c.drawString(PAGE_W - MARGIN_X - brand_w, PAGE_H - MARGIN_TOP + 10, "Congre")

def draw_page_footer(c, label="CONGRE  ·  COMPANY OVERVIEW"):
    """페이지 하단 구분선 + 푸터 카피. label = 우측 라벨."""
    # 구분선
    c.setStrokeColor(RULE)
    c.setLineWidth(0.5)
    c.line(MARGIN_X, MARGIN_BOTTOM - 20, PAGE_W - MARGIN_X, MARGIN_BOTTOM - 20)
    # 좌측: 문의 채널 (한글·영문 혼합)
    draw_mixed_text(c, MARGIN_X, MARGIN_BOTTOM - 35, "문의  ·  카카오톡 채널 @congre", 7.5, color=MUTED)
    # 우측: 영문 라벨 (자간 적용)
    c.setFont("DMSans", 7.5)
    c.setFillColor(MUTED)
    total_w = sum(c.stringWidth(ch, "DMSans", 7.5) + 1.2 for ch in label) - 1.2
    cur_x = PAGE_W - MARGIN_X - total_w
    for ch in label:
        c.drawString(cur_x, MARGIN_BOTTOM - 35, ch)
        cur_x += c.stringWidth(ch, "DMSans", 7.5) + 1.2

def draw_section_tag(c, x, y, label, size=8.5):
    """섹션 태그 — 대문자 + 자간 + 액센트 컬러 + 하단 짧은 라인."""
    c.setFont("DMSans-Medium", size)
    c.setFillColor(ACCENT)
    cur_x = x
    for ch in label:
        c.drawString(cur_x, y, ch)
        cur_x += c.stringWidth(ch, "DMSans-Medium", size) + 2.5  # 강한 자간
    # 하단 짧은 라인
    c.setStrokeColor(ACCENT)
    c.setLineWidth(0.6)
    c.line(x, y - 6, x + 28, y - 6)

def draw_h1_kor(c, x, y, text, size=42, color=None):
    """한글 디스플레이 — Bold (italic 불가)."""
    c.setFillColor(color if color else TEXT)
    draw_mixed_text(c, x, y, text, size, en_font="Cormorant-Italic", kr_font="NotoKR-Bold", color=color)

def draw_h2(c, x, y, text, size=22, color=None):
    """페이지 안 H2 — 한글 Medium."""
    draw_mixed_text(c, x, y, text, size, en_font="DMSans-Bold", kr_font="NotoKR-Bold", color=color or TEXT)

def draw_h3(c, x, y, text, size=12, color=None):
    """소제목 — 액센트 컬러."""
    draw_mixed_text(c, x, y, text, size, en_font="DMSans-Bold", kr_font="NotoKR-Bold", color=color or ACCENT)

def wrap_text_mixed(c, text, size, max_width, en_font="DMSans", kr_font="NotoKR"):
    """한글·영문 혼합 텍스트 줄바꿈. 줄 리스트 반환."""
    # 단어 영역 분해 — 공백 또는 한글 경계에서 분리
    # 단순 영역: 공백으로 1차 분리, 각 토큰의 폭 측정
    words = []
    cur = ""
    for ch in text:
        if ch == " ":
            if cur:
                words.append(cur)
                cur = ""
            words.append(" ")
        else:
            cur += ch
    if cur:
        words.append(cur)

    lines = []
    cur_line = ""
    for w in words:
        candidate = cur_line + w
        if text_width_mixed(c, candidate, size, en_font, kr_font) <= max_width:
            cur_line = candidate
        else:
            if cur_line.strip():
                lines.append(cur_line.rstrip())
            cur_line = w if w != " " else ""
    if cur_line.strip():
        lines.append(cur_line.rstrip())
    return lines

def draw_para(c, x, y, text, size=10.5, max_width=None, line_height=None, color=None, en_font="DMSans", kr_font="NotoKR"):
    """본문 단락 — 줄바꿈 자동. 마지막 줄 y 반환."""
    if max_width is None:
        max_width = PAGE_W - 2 * MARGIN_X
    if line_height is None:
        line_height = size * 1.6
    if color is None:
        color = TEXT
    lines = wrap_text_mixed(c, text, size, max_width, en_font, kr_font)
    cy = y
    for line in lines:
        draw_mixed_text(c, x, cy, line, size, en_font=en_font, kr_font=kr_font, color=color)
        cy -= line_height
    return cy + line_height  # 마지막 그린 라인의 y


def draw_tracked_text(c, x, y, text, font, size, tracking=1.5, color=None):
    """자간(tracking) 적용된 텍스트. cur_x 반환."""
    if color is not None:
        c.setFillColor(color)
    c.setFont(font, size)
    cur_x = x
    for ch in text:
        c.drawString(cur_x, y, ch)
        cur_x += c.stringWidth(ch, font, size) + tracking
    return cur_x

def draw_screenshot_placeholder(c, x, y, w, h, label="[ S C R E E N S H O T ]"):
    """폰 화면 캡처 자리 표시 — 라운드 박스 + 라벨. 디자이너가 채울 영역."""
    # 외곽선
    c.setStrokeColor(RULE)
    c.setLineWidth(1.0)
    c.roundRect(x, y, w, h, 8, fill=0, stroke=1)
    # 라벨 (중앙) — 한글·영문 자동 전환 + 자간
    # 자간 적용한 폭 계산 (한글·영문 혼합)
    label_w = 0
    for ch in label:
        font = "NotoKR-Medium" if 0xAC00 <= ord(ch) <= 0xD7A3 or 0x3000 <= ord(ch) <= 0x303F else "DMSans-Medium"
        label_w += c.stringWidth(ch, font, 9) + 1.5
    label_w -= 1.5
    cx = x + (w - label_w) / 2
    cy = y + h / 2 - 4
    # 한글·영문 자동 전환 그리기
    cur_x = cx
    c.setFillColor(MUTED)
    for ch in label:
        is_k = 0xAC00 <= ord(ch) <= 0xD7A3 or 0x3000 <= ord(ch) <= 0x303F
        font = "NotoKR-Medium" if is_k else "DMSans-Medium"
        c.setFont(font, 9)
        c.drawString(cur_x, cy, ch)
        cur_x += c.stringWidth(ch, font, 9) + 1.5
    # 부제 — 디자이너 안내
    sub = "디자이너 추가 영역"
    c.setFont("NotoKR", 7.5)
    sub_w = c.stringWidth(sub, "NotoKR", 7.5)
    c.drawString(x + (w - sub_w) / 2, cy - 16, sub)

def draw_cover_page(c, title_ko, title_en, subtitle, label_top="C O N G R E"):
    """표지 페이지 — 합본 / 호스트 표지 / 게스트 표지 공통."""
    fill_bg(c)
    # 상단 라벨
    draw_tracked_text(c, MARGIN_X, PAGE_H - MARGIN_TOP - 20, label_top, "DMSans-Medium", 9, tracking=2, color=ACCENT)
    # 좌측 짧은 라인
    c.setStrokeColor(ACCENT)
    c.setLineWidth(0.7)
    c.line(MARGIN_X, PAGE_H - MARGIN_TOP - 32, MARGIN_X + 36, PAGE_H - MARGIN_TOP - 32)

    # 중앙 대제목 — Cormorant italic (영문)
    cy = PAGE_H / 2 + 60
    c.setFont("Cormorant-Italic", 84)
    c.setFillColor(TEXT)
    c.drawString(MARGIN_X, cy, "Congre")

    # 한글 제목
    cy -= 60
    c.setFont("NotoKR-Bold", 32)
    c.setFillColor(TEXT)
    c.drawString(MARGIN_X, cy, title_ko)

    # 영문 부제 (자간)
    cy -= 30
    draw_tracked_text(c, MARGIN_X, cy, title_en, "DMSans-Medium", 10, tracking=2.5, color=MUTED)

    # 하단 부제
    if subtitle:
        draw_mixed_text(c, MARGIN_X, MARGIN_BOTTOM + 40, subtitle, 11, en_font="DMSans", kr_font="NotoKR", color=MUTED)
