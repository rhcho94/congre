"""Congre 사용 가이드 (합본 PDF) — 호스트 6 STEP + 게스트 2 STEP."""
from reportlab.pdfgen import canvas
from pdf_common import (
    register_fonts, fill_bg,
    draw_page_footer, draw_section_tag, draw_h3, draw_para, draw_mixed_text,
    draw_tracked_text, draw_screenshot_placeholder, draw_cover_page,
    text_width_mixed,
    BG, ACCENT, TEXT, MUTED, RULE, SURFACE, SURFACE2,
    PAGE_W, PAGE_H, MARGIN_X, MARGIN_TOP, MARGIN_BOTTOM,
)

OUT = "congre-user-guide.pdf"
FOOTER_LABEL = "CONGRE  ·  USER  GUIDE"

register_fonts()
c = canvas.Canvas(OUT, pagesize=(PAGE_W, PAGE_H))


# ============================================================
# 공통 헬퍼
# ============================================================

def draw_guide_header(c, page_num, side_label, side="HOST"):
    """가이드 페이지 헤더 — 좌측 '{NN} {B|C} · {가이드명}' + 우측 Congre."""
    side_char = "B" if side == "HOST" else "C"
    guide_name = "호스트 사용 가이드" if side == "HOST" else "참가자 사용 가이드"
    # 좌측
    c.setFillColor(MUTED)
    c.setFont("DMSans-Medium", 8)
    c.drawString(MARGIN_X, PAGE_H - MARGIN_TOP + 10, f"{page_num:02d}")
    cur_x = MARGIN_X + c.stringWidth(f"{page_num:02d}", "DMSans-Medium", 8) + 8
    c.setFont("NotoKR", 8)
    c.drawString(cur_x, PAGE_H - MARGIN_TOP + 10, f"{side_char} · {guide_name}")
    # 우측 Congre
    c.setFont("Cormorant-Italic", 14)
    c.setFillColor(ACCENT)
    brand_w = c.stringWidth("Congre", "Cormorant-Italic", 14)
    c.drawString(PAGE_W - MARGIN_X - brand_w, PAGE_H - MARGIN_TOP + 10, "Congre")


def page_content_start(c, page_num, side, step_label, title_ko):
    """본문 페이지 시작 — 헤더 + 섹션 태그 + 대제목. 본문 시작 y 반환."""
    fill_bg(c)
    draw_guide_header(c, page_num, "", side=side)
    y = PAGE_H - MARGIN_TOP - 50
    # 섹션 태그
    draw_section_tag(c, MARGIN_X, y, step_label)
    y -= 38
    # 대제목
    c.setFillColor(TEXT)
    c.setFont("NotoKR-Bold", 30)
    c.drawString(MARGIN_X, y, title_ko)
    return y - 50  # 본문 시작


def draw_subsection(c, x, y, sub_title, items, max_width, item_size=9.5, line_height=14.5, item_gap=4):
    """소제목 + 항목 리스트. 끝 y 반환."""
    # 소제목
    draw_h3(c, x, y, sub_title, size=11)
    y -= 18
    # 항목들 (불릿 + 본문)
    for item in items:
        c.setFillColor(ACCENT)
        c.circle(x + 3, y + 4, 1.2, fill=1, stroke=0)
        # draw_para로 줄바꿈
        end_y = draw_para(c, x + 12, y, item, size=item_size,
                          max_width=max_width - 12, line_height=line_height, color=TEXT)
        # draw_para 반환값 = 마지막 그린 줄의 y. 다음 항목 시작 = end_y - line_height - item_gap
        y = end_y - line_height - item_gap
    return y + line_height - 4  # 여유 보정


def draw_callout(c, x, y, label, body, max_width):
    """라벨 + 본문 콜아웃 (팁·주의·예시 영역). 끝 y 반환."""
    # 라벨 (액센트)
    draw_h3(c, x, y, label, size=10.5)
    y -= 16
    # 본문
    end_y = draw_para(c, x, y, body, size=9.5, max_width=max_width, line_height=14.5, color=MUTED)
    return end_y - 14.5


# ============================================================
# 표지 페이지들
# ============================================================

def cover_combined():
    """1페이지 — 합본 표지."""
    draw_cover_page(c,
        title_ko="사용 가이드",
        title_en="U S E R   G U I D E",
        subtitle="B · 호스트용 가이드 (8페이지)        C · 참가자용 가이드 (4페이지)",
        label_top="C O N G R E   ·   U S E R   G U I D E")
    # 추가 부제 — 더 아래
    draw_mixed_text(c, MARGIN_X, MARGIN_BOTTOM + 22,
                    "이벤트 만들기부터 완성본 공유까지, 호스트와 참가자 양쪽 흐름을 한 권에 담았습니다.",
                    10, en_font="DMSans", kr_font="NotoKR", color=MUTED)
    c.showPage()


def cover_host():
    """2페이지 — 호스트 표지."""
    draw_cover_page(c,
        title_ko="호스트 가이드",
        title_en="H O S T   G U I D E",
        subtitle="이벤트 만들기부터 완성본 공유까지 — 여섯 단계",
        label_top="B   ·   H O S T   G U I D E")
    c.showPage()


def cover_guest():
    """11페이지 — 게스트 표지."""
    draw_cover_page(c,
        title_ko="참가자 가이드",
        title_en="G U E S T   G U I D E",
        subtitle="QR 한 번이면 끝 — 앱 설치 없이 세 단계",
        label_top="C   ·   G U E S T   G U I D E")
    c.showPage()


# ============================================================
# 호스트 가이드 본문
# ============================================================

def host_start():
    """페이지 3 — 시작하기 전에."""
    y = page_content_start(c, 2, "HOST", "S T A R T", "시작하기 전에")

    # 인트로 본문 (전체 폭)
    full_w = PAGE_W - 2 * MARGIN_X
    end = draw_para(c, MARGIN_X, y,
        "Congre 호스트 가이드에 오신 것을 환영합니다. 본 문서는 행사 주최자가 Congre로 이벤트를 만들고, "
        "참가자 영상을 모으고, 완성본을 받기까지의 여섯 단계를 안내합니다.",
        size=10.5, max_width=full_w, line_height=17, color=TEXT)
    y = end - 28

    # 2열 — 필요한 것 / 소요 시간
    col_w = (full_w - 40) / 2
    col_left_y = y
    col_right_y = y

    # 좌측 — 필요한 것
    col_left_y = draw_subsection(c, MARGIN_X, col_left_y, "필요한 것", [
        "이메일 주소와 휴대폰 번호 — 가입과 결과 알림용",
        "행사 기본 정보 — 행사명, 행사 날짜",
        "참가자에게 공유할 수단 — 단톡방, 인쇄용 QR 게시판, 문자 메시지 중 무엇이든",
    ], max_width=col_w)

    # 우측 — 소요 시간
    col_right_y = draw_subsection(c, MARGIN_X + col_w + 40, col_right_y, "소요 시간", [
        "가입과 이벤트 만들기까지 약 5분",
        "마감 후 영상 완성까지 5분 내외",
    ], max_width=col_w)

    draw_page_footer(c, FOOTER_LABEL)
    c.showPage()


def host_step01():
    """페이지 4 — STEP 01 가입·로그인·인증."""
    y = page_content_start(c, 3, "HOST", "S T E P   0 1", "가입하고 로그인하기")

    # 좌측 본문 / 우측 placeholder
    left_w = (PAGE_W - 2 * MARGIN_X) * 0.55
    right_x = MARGIN_X + left_w + 24
    right_w = PAGE_W - MARGIN_X - right_x

    # 본문
    end = draw_para(c, MARGIN_X, y,
        "Congre는 호스트가 직접 가입합니다. app.congre.kr 우측 상단 '주최자 로그인' 클릭 후 "
        "하단 '회원가입' 클릭.",
        size=10, max_width=left_w, line_height=16, color=TEXT)
    y = end - 22

    # 가입 입력 영역
    y = draw_subsection(c, MARGIN_X, y, "가입 입력", [
        "이메일 · 비밀번호 (최소 6자)",
        "이름과 전화번호 (10~11자리 숫자)",
        "이용약관 · 개인정보처리방침 동의",
    ], max_width=left_w)
    y -= 16

    # 이메일 인증 영역
    y = draw_subsection(c, MARGIN_X, y, "이메일 인증", [
        "가입 직후 인증 메일이 발송됩니다. 메일 안 '인증' 링크를 클릭하면 완료.",
        "인증 완료 전까지 이벤트 생성은 차단되며, 대시보드 상단 안내 배너에서 '인증 메일 재발송' 가능.",
    ], max_width=left_w)
    y -= 14

    # 팁
    draw_callout(c, MARGIN_X, y, "팁",
        "비밀번호를 잊으셨다면 로그인 화면 '비밀번호를 잊으셨나요?' 클릭하면 등록 이메일로 재설정 링크 발송.",
        max_width=left_w)

    # 우측 placeholder
    ph_h = 320
    ph_y = MARGIN_BOTTOM + 60
    draw_screenshot_placeholder(c, right_x, ph_y, right_w, ph_h, "[ 회원가입 화면 ]")

    draw_page_footer(c, FOOTER_LABEL)
    c.showPage()


def host_step02():
    """페이지 5 — STEP 02 새 이벤트 만들기 (자물쇠)."""
    y = page_content_start(c, 4, "HOST", "S T E P   0 2", "새 이벤트 만들기")

    left_w = (PAGE_W - 2 * MARGIN_X) * 0.55
    right_x = MARGIN_X + left_w + 24
    right_w = PAGE_W - MARGIN_X - right_x

    end = draw_para(c, MARGIN_X, y,
        "대시보드 우측 상단 '+ 새 이벤트' 클릭하면 이벤트 생성 폼이 열립니다.",
        size=10, max_width=left_w, line_height=16, color=TEXT)
    y = end - 22

    y = draw_subsection(c, MARGIN_X, y, "입력 항목", [
        "이벤트 이름 — 행사명 (예: '돌잔치 2026')",
        "이벤트 날짜 — 행사 당일",
        "플랜 — 무료 10클립 / 소형 50 / 중형 200 / 대형 무제한",
        "클립 길이 — 참가자가 올릴 수 있는 영상 최대 길이",
    ], max_width=left_w)
    y -= 16

    y = draw_subsection(c, MARGIN_X, y, "클립 길이 — 플랜별 한도", [
        "무료 플랜은 최대 10초까지 선택 가능",
        "유료 플랜에서는 5초 · 10초 · 15초 · 30초 중 자유롭게 선택",
        "잠긴 옵션은 자물쇠 아이콘으로 표시됩니다",
    ], max_width=left_w)
    y -= 14

    draw_callout(c, MARGIN_X, y, "팁",
        "플랜은 생성 후 변경 불가. 인원이 애매하면 한 단계 위로.",
        max_width=left_w)

    ph_h = 320
    ph_y = MARGIN_BOTTOM + 60
    draw_screenshot_placeholder(c, right_x, ph_y, right_w, ph_h, "[ 새 이벤트 만들기 ]")

    draw_page_footer(c, FOOTER_LABEL)
    c.showPage()


def host_step03():
    """페이지 6 — STEP 03 참가자에게 공유."""
    y = page_content_start(c, 5, "HOST", "S T E P   0 3", "참가자에게 공유")

    left_w = (PAGE_W - 2 * MARGIN_X) * 0.55
    right_x = MARGIN_X + left_w + 24
    right_w = PAGE_W - MARGIN_X - right_x

    end = draw_para(c, MARGIN_X, y,
        "이벤트 생성 즉시 QR 코드와 공유 링크가 발급됩니다. 참가자는 별도 앱 설치 없이 폰 브라우저로 바로 진입합니다.",
        size=10, max_width=left_w, line_height=16, color=TEXT)
    y = end - 22

    y = draw_subsection(c, MARGIN_X, y, "두 가지 공유 방법", [
        "QR 이미지 저장 — 인쇄해서 행사장 입구 · 테이블 · 게시판에 부착",
        "링크 복사 — 단톡방 · 카톡 · 문자로 전달",
    ], max_width=left_w)
    y -= 16

    y = draw_subsection(c, MARGIN_X, y, "인트로 / 아웃트로 (선택)", [
        "'영상 시작 · 끝 꾸미기'에서 텍스트 최대 60자와 이미지 · 영상을 추가",
        "비워두면 참가자 영상만으로 완성본이 만들어집니다",
    ], max_width=left_w)
    y -= 14

    draw_callout(c, MARGIN_X, y, "예시",
        "시작 '돌잔치가 시작됩니다' / 마무리 '함께해 주셔서 감사합니다'",
        max_width=left_w)

    ph_h = 320
    ph_y = MARGIN_BOTTOM + 60
    draw_screenshot_placeholder(c, right_x, ph_y, right_w, ph_h, "[ 참가자 초대 — QR + 마감 버튼 ]")

    draw_page_footer(c, FOOTER_LABEL)
    c.showPage()


def host_step04():
    """페이지 7 — STEP 04 마감과 클립 확인."""
    y = page_content_start(c, 6, "HOST", "S T E P   0 4", "마감과 클립 확인")

    left_w = (PAGE_W - 2 * MARGIN_X) * 0.55
    right_x = MARGIN_X + left_w + 24
    right_w = PAGE_W - MARGIN_X - right_x

    end = draw_para(c, MARGIN_X, y,
        "행사가 끝나면 대시보드 우측의 빨간 '마감하기' 버튼을 누릅니다. 마감 즉시 신규 업로드가 차단되고 자동 편집이 시작됩니다.",
        size=10, max_width=left_w, line_height=16, color=TEXT)
    y = end - 22

    y = draw_subsection(c, MARGIN_X, y, "마감 전 확인할 것", [
        "업로드된 클립 목록 — 닉네임과 업로드 시각으로 식별",
        "각 클립 미리보기 — 재생 버튼으로 영상 확인",
        "원치 않는 클립 제외 — 토글로 영상 포함 여부 선택",
    ], max_width=left_w)
    y -= 16

    draw_callout(c, MARGIN_X, y, "마감 타이밍",
        "행사 종료 직후가 표준. 지각 참가자가 있다면 30분 정도 여유.",
        max_width=left_w)
    y -= 50

    draw_callout(c, MARGIN_X, y, "자동 알림",
        "마감 즉시 '렌더 시작' 이메일 · SMS 자동 발송 — 진행 상황을 별도로 확인하지 않으셔도 됩니다.",
        max_width=left_w)

    ph_h = 320
    ph_y = MARGIN_BOTTOM + 60
    draw_screenshot_placeholder(c, right_x, ph_y, right_w, ph_h, "[ 대시보드 — 마감 버튼 ]")

    draw_page_footer(c, FOOTER_LABEL)
    c.showPage()


def host_step05():
    """페이지 8 — STEP 05 완성본 받기와 공유."""
    y = page_content_start(c, 7, "HOST", "S T E P   0 5", "완성본 받기와 공유")

    left_w = (PAGE_W - 2 * MARGIN_X) * 0.55
    right_x = MARGIN_X + left_w + 24
    right_w = PAGE_W - MARGIN_X - right_x

    end = draw_para(c, MARGIN_X, y,
        "자동 편집이 완료되면 등록한 이메일과 휴대폰으로 알림이 도착합니다. "
        "지연 · 실패 시에도 상태 알림이 자동 발송됩니다.",
        size=10, max_width=left_w, line_height=16, color=TEXT)
    y = end - 22

    y = draw_subsection(c, MARGIN_X, y, "공유 옵션", [
        "영상 다운로드 — MP4 파일로 폰 · PC에 저장. 가장 안정적인 보관",
        "카카오톡 — 단톡방에 바로 전달",
        "링크 복사 — SNS · 블로그 · 이메일 어디든",
    ], max_width=left_w)
    y -= 14

    draw_callout(c, MARGIN_X, y, "재렌더",
        "완성본이 마음에 들지 않으면 클립을 다시 골라 영상을 새로 만들 수 있습니다.",
        max_width=left_w)
    y -= 50

    draw_callout(c, MARGIN_X, y, "자동 삭제 — 보관 기한",
        "개별 클립은 결과 알림 후 24시간, 완성 영상은 7일 후 자동 삭제됩니다. 다운로드해 보관해 주세요.",
        max_width=left_w)

    ph_h = 320
    ph_y = MARGIN_BOTTOM + 60
    draw_screenshot_placeholder(c, right_x, ph_y, right_w, ph_h, "[ 편집 완료 + 공유 옵션 ]")

    draw_page_footer(c, FOOTER_LABEL)
    c.showPage()


def host_step06():
    """페이지 9 — STEP 06 내 계정 관리 (신규)."""
    y = page_content_start(c, 8, "HOST", "S T E P   0 6", "내 계정 관리")

    left_w = (PAGE_W - 2 * MARGIN_X) * 0.55
    right_x = MARGIN_X + left_w + 24
    right_w = PAGE_W - MARGIN_X - right_x

    end = draw_para(c, MARGIN_X, y,
        "대시보드 상단 '마이페이지' 링크에서 본인 계정을 관리할 수 있습니다.",
        size=10, max_width=left_w, line_height=16, color=TEXT)
    y = end - 22

    y = draw_subsection(c, MARGIN_X, y, "마이페이지 4가지 영역", [
        "이벤트 요약 — 진행 중과 완료된 이벤트 수를 한눈에",
        "프로필 — 이름과 전화번호 수정",
        "비밀번호 변경 — 현재 비밀번호 + 신규 비밀번호 입력",
        "회원 탈퇴 — 비밀번호 재인증 후 모든 데이터 즉시 삭제",
    ], max_width=left_w)
    y -= 16

    draw_callout(c, MARGIN_X, y, "주의 — 회원 탈퇴",
        "회원 탈퇴 시 진행 중인 이벤트와 완성본도 함께 삭제됩니다. 보관할 영상은 사전에 다운로드해 주세요.",
        max_width=left_w)

    ph_h = 320
    ph_y = MARGIN_BOTTOM + 60
    draw_screenshot_placeholder(c, right_x, ph_y, right_w, ph_h, "[ 마이페이지 화면 ]")

    draw_page_footer(c, FOOTER_LABEL)
    c.showPage()


def host_faq():
    """페이지 10 — 호스트 FAQ."""
    y = page_content_start(c, 9, "HOST", "F A Q", "자주 묻는 질문")

    # 전체 폭 2열
    full_w = PAGE_W - 2 * MARGIN_X
    col_w = (full_w - 40) / 2

    qa_left = [
        ("Q. 예상 시간이 지났는데 완성본이 안 와요",
         "카카오톡 채널 @congre로 이벤트명을 알려주세요. 진행 상태를 확인해 드립니다."),
        ("Q. 참가자가 업로드를 못 한다고 해요",
         "폰 브라우저에서 카메라 권한이 허용되어 있는지 먼저 확인해 주세요. 그래도 안 되면 채널로 문의."),
        ("Q. 영상은 며칠까지 받을 수 있나요?",
         "개별 클립 24시간, 완성본 7일 후 자동 삭제됩니다. 다운로드해 보관해 주세요."),
    ]
    qa_right = [
        ("Q. 미성년자가 포함된 영상은 어떻게 하나요?",
         "학교 · 기관 행사라면 사전에 학부모 동의를 받는 것을 권장합니다."),
        ("Q. 클립을 잘못 골라서 영상에 포함시켰어요",
         "재렌더 기능을 사용하세요. 클립 토글로 제외한 뒤 영상을 다시 만들 수 있습니다."),
        ("Q. 한 행사에 영상을 여러 편 만들 수 있나요?",
         "한 이벤트는 한 편의 완성본을 만듭니다. 학급별 · 테이블별로 나누고 싶다면 각각 별도의 이벤트로 만드세요."),
    ]

    left_y = y
    for q, a in qa_left:
        draw_h3(c, MARGIN_X, left_y, q, size=10)
        end_y = draw_para(c, MARGIN_X, left_y - 16, a,
                          size=9.5, max_width=col_w, line_height=14, color=MUTED)
        left_y = end_y - 26

    right_y = y
    right_x = MARGIN_X + col_w + 40
    for q, a in qa_right:
        draw_h3(c, right_x, right_y, q, size=10)
        end_y = draw_para(c, right_x, right_y - 16, a,
                          size=9.5, max_width=col_w, line_height=14, color=MUTED)
        right_y = end_y - 26

    # 하단 안내
    draw_mixed_text(c, MARGIN_X, MARGIN_BOTTOM + 20,
                    "문의 — 카카오톡 채널 @congre (도입 · 운영 문의 모두)",
                    9.5, en_font="DMSans", kr_font="NotoKR", color=MUTED)

    draw_page_footer(c, FOOTER_LABEL)
    c.showPage()


# ============================================================
# 게스트 가이드 본문
# ============================================================

def guest_start():
    """페이지 12 — 게스트 시작하기 전에."""
    fill_bg(c)
    draw_guide_header(c, 2, "", side="GUEST")
    y = PAGE_H - MARGIN_TOP - 50
    draw_section_tag(c, MARGIN_X, y, "S T A R T")
    y -= 38
    c.setFillColor(TEXT)
    c.setFont("NotoKR-Bold", 30)
    c.drawString(MARGIN_X, y, "시작하기 전에")
    y -= 50

    full_w = PAGE_W - 2 * MARGIN_X
    end = draw_para(c, MARGIN_X, y,
        "주최자로부터 QR 코드 또는 링크를 받으셨다면 준비 완료입니다. "
        "별도의 앱 설치 없이 폰 브라우저로 바로 진행됩니다.",
        size=10.5, max_width=full_w, line_height=17, color=TEXT)
    y = end - 26

    col_w = (full_w - 40) / 2
    col_left_y = y
    col_right_y = y

    col_left_y = draw_subsection(c, MARGIN_X, col_left_y, "필요한 것", [
        "주최자가 보낸 QR 또는 링크",
        "폰 브라우저 — 안드로이드는 Chrome, 아이폰은 Safari 권장",
        "카메라 권한 허용 — 처음 카메라를 켤 때 브라우저가 권한을 묻습니다. '허용' 선택",
    ], max_width=col_w)

    col_right_y = draw_subsection(c, MARGIN_X + col_w + 40, col_right_y, "소요 시간", [
        "전체 과정 약 1~2분",
        "익숙한 인스타그램 스토리 정도의 흐름입니다",
    ], max_width=col_w)
    col_right_y -= 20

    draw_callout(c, MARGIN_X + col_w + 40, col_right_y, "개인정보",
        "촬영한 영상은 행사 영상 편집에만 사용되며, 결과 알림 후 24시간 안에 자동 삭제됩니다. "
        "완성본은 7일간 보관됩니다.",
        max_width=col_w)

    draw_page_footer(c, FOOTER_LABEL)
    c.showPage()


def guest_step01():
    """페이지 13 — 게스트 STEP 01 이름·전화."""
    fill_bg(c)
    draw_guide_header(c, 3, "", side="GUEST")
    y = PAGE_H - MARGIN_TOP - 50
    draw_section_tag(c, MARGIN_X, y, "S T E P   0 1")
    y -= 38
    c.setFillColor(TEXT)
    c.setFont("NotoKR-Bold", 30)
    c.drawString(MARGIN_X, y, "이름과 전화번호 입력")
    y -= 50

    left_w = (PAGE_W - 2 * MARGIN_X) * 0.55
    right_x = MARGIN_X + left_w + 24
    right_w = PAGE_W - MARGIN_X - right_x

    end = draw_para(c, MARGIN_X, y,
        "QR을 스캔하거나 링크를 누르면 이벤트 화면이 열립니다. 먼저 이름과 전화번호를 입력합니다.",
        size=10, max_width=left_w, line_height=16, color=TEXT)
    y = end - 22

    y = draw_subsection(c, MARGIN_X, y, "입력 항목", [
        "이름 — 행사 안에서 알아볼 수 있는 이름 (최대 20자). 본명을 쓰지 않아도 됩니다",
        "전화번호 — 완성본이 나오면 SMS · 이메일로 직접 알림 받습니다",
    ], max_width=left_w)
    y -= 16

    draw_callout(c, MARGIN_X, y, "같은 이름 + 번호는 한 번만",
        "여러 개를 올리려면 이름을 다르게 (예: '민준 1', '민준 2') 입력하세요.",
        max_width=left_w)
    y -= 50

    draw_callout(c, MARGIN_X, y, "팁",
        "익명으로 참여하고 싶다면 이름을 별명 · 이니셜로. 단체 행사에서는 소속 표기 함께 (예: '3학년 7반 민준').",
        max_width=left_w)

    ph_h = 320
    ph_y = MARGIN_BOTTOM + 60
    draw_screenshot_placeholder(c, right_x, ph_y, right_w, ph_h, "[ 이름 + 전화번호 입력 화면 ]")

    draw_page_footer(c, FOOTER_LABEL)
    c.showPage()


def guest_step02():
    """페이지 14 — 게스트 STEP 02 촬영 시작 (G1)."""
    fill_bg(c)
    draw_guide_header(c, 4, "", side="GUEST")
    y = PAGE_H - MARGIN_TOP - 50
    draw_section_tag(c, MARGIN_X, y, "S T E P   0 2")
    y -= 38
    c.setFillColor(TEXT)
    c.setFont("NotoKR-Bold", 30)
    c.drawString(MARGIN_X, y, "촬영 시작")
    y -= 50

    left_w = (PAGE_W - 2 * MARGIN_X) * 0.55
    right_x = MARGIN_X + left_w + 24
    right_w = PAGE_W - MARGIN_X - right_x

    end = draw_para(c, MARGIN_X, y,
        "이름 입력 후 '다음'을 누르면 촬영 화면이 나옵니다.",
        size=10, max_width=left_w, line_height=16, color=TEXT)
    y = end - 22

    y = draw_subsection(c, MARGIN_X, y, "두 가지 방법", [
        "'지금 촬영하기' 탭 — 폰 카메라 앱이 열립니다. 촬영 후 자동으로 가이드 화면으로 돌아옵니다",
        "'갤러리에서 선택' — 이미 찍어둔 영상을 올릴 수 있습니다",
    ], max_width=left_w)
    y -= 14

    y = draw_subsection(c, MARGIN_X, y, "촬영 시간", [
        "호스트가 정한 최대 시간 (5~30초). 촬영 화면에서 '최대 N초'로 확인",
        "그 시간을 넘으면 잘립니다. 짧고 진심 어린 한마디가 더 좋은 영상이 됩니다",
    ], max_width=left_w)
    y -= 14

    draw_callout(c, MARGIN_X, y, "촬영이 끝나면",
        "재생 버튼으로 미리보기. 마음에 들면 '업로드하기', 다시 찍고 싶으면 '다시 촬영'.",
        max_width=left_w)

    ph_h = 320
    ph_y = MARGIN_BOTTOM + 60
    draw_screenshot_placeholder(c, right_x, ph_y, right_w, ph_h, "[ 촬영 시작 화면 ]")

    draw_page_footer(c, FOOTER_LABEL)
    c.showPage()


def guest_done_faq():
    """페이지 15 — 게스트 완료 + FAQ."""
    fill_bg(c)
    draw_guide_header(c, 5, "", side="GUEST")
    y = PAGE_H - MARGIN_TOP - 50
    draw_section_tag(c, MARGIN_X, y, "D O N E   &   F A Q")
    y -= 38
    c.setFillColor(TEXT)
    c.setFont("NotoKR-Bold", 30)
    c.drawString(MARGIN_X, y, "완료, 그리고 자주 묻는 질문")
    y -= 40

    full_w = PAGE_W - 2 * MARGIN_X
    col_w = (full_w - 40) / 2

    # 좌측: 완료 안내 영역
    left_y = y
    left_y = draw_subsection(c, MARGIN_X, left_y, "업로드 완료", [
        "업로드가 끝나면 '전달됐어요!' 화면이 나타납니다",
        "하단 '하나 더 올리기' 클릭으로 다른 이름으로 추가 가능",
    ], max_width=col_w)
    left_y -= 8

    draw_callout(c, MARGIN_X, left_y, "완성본은 언제?",
        "행사 종료 후 주최자가 마감하면 자동 편집이 시작되고 약 5분 내외로 완성됩니다. "
        "완성본은 7일간 보관됩니다.",
        max_width=col_w)

    # 우측: FAQ
    right_x = MARGIN_X + col_w + 40
    right_y = y
    qa = [
        ("Q. 잘못 올렸어요. 지울 수 있나요?",
         "직접 삭제는 불가. 주최자에게 부탁하면 영상에서 제외할 수 있습니다."),
        ("Q. 익명으로 참여 가능한가요?",
         "네. 이름을 별명 · 이니셜로. 전화번호는 알림 용도로만 사용."),
        ("Q. 내 영상이 어디로 가나요?",
         "행사 영상에 포함됩니다. 렌더링 직후 개별 클립은 자동 삭제."),
        ("Q. 카메라가 안 켜져요",
         "브라우저 설정에서 카메라 권한을 '허용'으로 변경 후 새로고침."),
    ]
    for q, a in qa:
        draw_h3(c, right_x, right_y, q, size=9.5)
        end_y = draw_para(c, right_x, right_y - 14, a,
                          size=9, max_width=col_w, line_height=13, color=MUTED)
        right_y = end_y - 18

    draw_mixed_text(c, MARGIN_X, MARGIN_BOTTOM + 20,
                    "문의 — 카카오톡 채널 @congre · 촬영 · 업로드 중 문제가 생기면 채널로 연락 주세요.",
                    9.5, en_font="DMSans", kr_font="NotoKR", color=MUTED)

    draw_page_footer(c, FOOTER_LABEL)
    c.showPage()


# ============================================================
# 메인 빌드 — 15페이지
# ============================================================

cover_combined()       # 1
cover_host()           # 2
host_start()           # 3
host_step01()          # 4
host_step02()          # 5
host_step03()          # 6
host_step04()          # 7
host_step05()          # 8
host_step06()          # 9
host_faq()             # 10
cover_guest()          # 11
guest_start()          # 12
guest_step01()         # 13
guest_step02()         # 14
guest_done_faq()       # 15

c.save()
print(f"빌드 완료: {OUT}")
