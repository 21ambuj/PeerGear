import os
import pptx
from pptx.util import Inches, Pt
from pptx.dml.color import RGBColor
from pptx.enum.text import PP_ALIGN
from pptx.enum.shapes import MSO_SHAPE

def create_presentation(output_path="PeerGear_Presentation.pptx"):
    prs = pptx.Presentation()
    # 16:9 Widescreen dimensions
    prs.slide_width = Inches(13.333)
    prs.slide_height = Inches(7.5)
    blank_layout = prs.slide_layouts[6]

    # Color Palette (Clean, human-designed, academic & student-friendly)
    DARK_BG = RGBColor(15, 23, 42)        # Slate 900
    LIGHT_BG = RGBColor(248, 250, 252)    # Slate 50
    CARD_BG = RGBColor(255, 255, 255)     # White
    CARD_BORDER = RGBColor(226, 232, 240) # Slate 200
    PRIMARY = RGBColor(79, 70, 229)       # Indigo 600
    PRIMARY_DARK = RGBColor(49, 46, 129)  # Indigo 900
    TEXT_MAIN = RGBColor(30, 41, 59)      # Slate 800
    TEXT_MUTED = RGBColor(100, 116, 139)  # Slate 500
    ACCENT_GREEN = RGBColor(16, 185, 129) # Emerald 500
    ACCENT_AMBER = RGBColor(217, 119, 6)  # Amber 600
    ACCENT_ROSE = RGBColor(225, 29, 72)   # Rose 600
    ACCENT_CYAN = RGBColor(14, 165, 233)  # Sky 500

    def add_header(slide, tag_text, title_text, subtitle_text=None):
        # Category Tag
        tag_box = slide.shapes.add_textbox(Inches(0.8), Inches(0.42), Inches(10), Inches(0.35))
        tf_tag = tag_box.text_frame
        tf_tag.word_wrap = True
        tf_tag.margin_left = tf_tag.margin_top = tf_tag.margin_right = tf_tag.margin_bottom = 0
        p_tag = tf_tag.paragraphs[0]
        p_tag.text = tag_text.upper()
        p_tag.font.size = Pt(10)
        p_tag.font.bold = True
        p_tag.font.color.rgb = PRIMARY
        p_tag.font.name = "Arial"

        # Main Title
        title_box = slide.shapes.add_textbox(Inches(0.8), Inches(0.78), Inches(11.5), Inches(0.55))
        tf_title = title_box.text_frame
        tf_title.word_wrap = True
        tf_title.margin_left = tf_title.margin_top = tf_title.margin_right = tf_title.margin_bottom = 0
        p_title = tf_title.paragraphs[0]
        p_title.text = title_text
        p_title.font.size = Pt(22)
        p_title.font.bold = True
        p_title.font.color.rgb = TEXT_MAIN
        p_title.font.name = "Arial"

        if subtitle_text:
            sub_box = slide.shapes.add_textbox(Inches(0.8), Inches(1.35), Inches(11.5), Inches(0.45))
            tf_sub = sub_box.text_frame
            tf_sub.word_wrap = True
            tf_sub.margin_left = tf_sub.margin_top = tf_sub.margin_right = tf_sub.margin_bottom = 0
            p_sub = tf_sub.paragraphs[0]
            p_sub.text = subtitle_text
            p_sub.font.size = Pt(12)
            p_sub.font.color.rgb = TEXT_MUTED
            p_sub.font.name = "Arial"

    def set_slide_background(slide, color):
        bg = slide.shapes.add_shape(MSO_SHAPE.RECTANGLE, 0, 0, Inches(13.333), Inches(7.5))
        bg.fill.solid()
        bg.fill.fore_color.rgb = color
        bg.line.color.rgb = color

    # =========================================================================
    # SLIDE 1: Title Slide (Dark Theme)
    # =========================================================================
    slide1 = prs.slides.add_slide(blank_layout)
    set_slide_background(slide1, DARK_BG)

    # Accent Top Stripe
    stripe1 = slide1.shapes.add_shape(MSO_SHAPE.RECTANGLE, Inches(0), Inches(0), Inches(13.333), Inches(0.15))
    stripe1.fill.solid()
    stripe1.fill.fore_color.rgb = PRIMARY
    stripe1.line.color.rgb = PRIMARY

    # Title box
    tbox = slide1.shapes.add_textbox(Inches(1.0), Inches(1.5), Inches(11.3), Inches(2.3))
    tf1 = tbox.text_frame
    tf1.word_wrap = True

    p0 = tf1.paragraphs[0]
    p0.text = "COLLEGE CAPSTONE PROJECT PRESENTATION"
    p0.font.size = Pt(11)
    p0.font.bold = True
    p0.font.color.rgb = RGBColor(129, 140, 248) # Indigo 400
    p0.font.name = "Arial"
    p0.space_after = Pt(10)

    p1 = tf1.add_paragraph()
    p1.text = "PeerGear"
    p1.font.size = Pt(46)
    p1.font.bold = True
    p1.font.color.rgb = RGBColor(255, 255, 255)
    p1.font.name = "Arial"

    p2 = tf1.add_paragraph()
    p2.text = "Campus Resource Sharing & Student Equipment Rental System"
    p2.font.size = Pt(17)
    p2.font.bold = True
    p2.font.color.rgb = RGBColor(224, 231, 255) # Indigo 100
    p2.font.name = "Arial"
    p2.space_after = Pt(6)

    p3 = tf1.add_paragraph()
    p3.text = "A safe, closed-campus platform for students to share, rent, and monetize semester gear with verified trust and deposit protection."
    p3.font.size = Pt(13)
    p3.font.color.rgb = RGBColor(148, 163, 184) # Slate 400
    p3.font.name = "Arial"

    # Presenter Card Box
    card1 = slide1.shapes.add_shape(MSO_SHAPE.ROUNDED_RECTANGLE, Inches(1.0), Inches(4.2), Inches(5.4), Inches(2.4))
    card1.fill.solid()
    card1.fill.fore_color.rgb = RGBColor(30, 41, 59)
    card1.line.color.rgb = RGBColor(51, 65, 85)

    tf_c1 = card1.text_frame
    tf_c1.word_wrap = True
    tf_c1.margin_left = Inches(0.3)
    tf_c1.margin_top = Inches(0.25)
    tf_c1.margin_right = Inches(0.3)

    pc1_0 = tf_c1.paragraphs[0]
    pc1_0.text = "PROJECT CANDIDATE"
    pc1_0.font.size = Pt(10)
    pc1_0.font.bold = True
    pc1_0.font.color.rgb = RGBColor(148, 163, 184)
    pc1_0.font.name = "Arial"
    pc1_0.space_after = Pt(4)

    pc1_1 = tf_c1.add_paragraph()
    pc1_1.text = "Ambuj Kumar Maurya"
    pc1_1.font.size = Pt(18)
    pc1_1.font.bold = True
    pc1_1.font.color.rgb = RGBColor(255, 255, 255)
    pc1_1.font.name = "Arial"
    pc1_1.space_after = Pt(4)

    pc1_2 = tf_c1.add_paragraph()
    pc1_2.text = "B.Tech in Computer Science & Engineering\nFinal Semester Project Evaluation • Session 2025–2026"
    pc1_2.font.size = Pt(12)
    pc1_2.font.color.rgb = RGBColor(203, 213, 225)
    pc1_2.font.name = "Arial"

    # Project Scope Box
    card2 = slide1.shapes.add_shape(MSO_SHAPE.ROUNDED_RECTANGLE, Inches(6.7), Inches(4.2), Inches(5.6), Inches(2.4))
    card2.fill.solid()
    card2.fill.fore_color.rgb = RGBColor(30, 41, 59)
    card2.line.color.rgb = RGBColor(51, 65, 85)

    tf_c2 = card2.text_frame
    tf_c2.word_wrap = True
    tf_c2.margin_left = Inches(0.3)
    tf_c2.margin_top = Inches(0.25)
    tf_c2.margin_right = Inches(0.3)

    pc2_0 = tf_c2.paragraphs[0]
    pc2_0.text = "PROJECT OBJECTIVE & FOCUS"
    pc2_0.font.size = Pt(10)
    pc2_0.font.bold = True
    pc2_0.font.color.rgb = RGBColor(148, 163, 184)
    pc2_0.font.name = "Arial"
    pc2_0.space_after = Pt(4)

    pc2_1 = tf_c2.add_paragraph()
    pc2_1.text = "Safe & Affordable Campus Resource Exchange"
    pc2_1.font.size = Pt(16)
    pc2_1.font.bold = True
    pc2_1.font.color.rgb = RGBColor(255, 255, 255)
    pc2_1.font.name = "Arial"
    pc2_1.space_after = Pt(4)

    pc2_2 = tf_c2.add_paragraph()
    pc2_2.text = "• Solves high temporary equipment costs for college students\n• Verified student-only access with College ID authentication\n• 100% refundable security deposit protection\n• Contactless in-person QR pass handover and instant return"
    pc2_2.font.size = Pt(11.5)
    pc2_2.font.color.rgb = RGBColor(203, 213, 225)
    pc2_2.font.name = "Arial"

    # =========================================================================
    # SLIDE 2: The Campus Problem
    # =========================================================================
    slide2 = prs.slides.add_slide(blank_layout)
    set_slide_background(slide2, LIGHT_BG)
    add_header(slide2, "Need Analysis & Motivation", "The Student Problem: High Expenses & Zero Campus Trust", 
               "Understanding the financial strain and social awkwardness college students face with short-term equipment.")

    problems = [
        ("1. Expensive Temporary Needs", 
         "• Students frequently need costly items for only a few days or weeks (e.g. engineering drafters, scientific calculators, lab coats, DSLR cameras, sports gear, cycles).\n\n• Buying brand-new equipment for a single semester or exam causes heavy financial strain on students and their families.",
         ACCENT_ROSE),
        ("2. Idle Gear Lying in Hostels", 
         "• Senior students already own these exact tools, but once their course is over, the items sit idle in dorm cupboards for 85–90% of the academic year.\n\n• There is no organized, trustworthy campus platform for seniors to safely rent out their idle gear and earn pocket money.",
         ACCENT_AMBER),
        ("3. Broken Informal Borrowing", 
         "• Loaning items informally to hostel mates often results in delayed returns, damage, or unreturned gear with zero financial recovery.\n\n• Asking friends for security deposits or late fees is socially awkward, causing students to refuse lending to peers altogether.",
         PRIMARY)
    ]

    for i, (p_title, p_body, accent) in enumerate(problems):
        x = Inches(0.8 + i * 3.95)
        box = slide2.shapes.add_shape(MSO_SHAPE.ROUNDED_RECTANGLE, x, Inches(2.0), Inches(3.75), Inches(4.8))
        box.fill.solid()
        box.fill.fore_color.rgb = CARD_BG
        box.line.color.rgb = CARD_BORDER
        box.line.width = Pt(1)

        # Top accent bar on each card
        top_bar = slide2.shapes.add_shape(MSO_SHAPE.RECTANGLE, x, Inches(2.0), Inches(3.75), Inches(0.1))
        top_bar.fill.solid()
        top_bar.fill.fore_color.rgb = accent
        top_bar.line.color.rgb = accent

        tf = box.text_frame
        tf.word_wrap = True
        tf.margin_left = Inches(0.3)
        tf.margin_top = Inches(0.35)
        tf.margin_right = Inches(0.3)

        p = tf.paragraphs[0]
        p.text = p_title
        p.font.size = Pt(15)
        p.font.bold = True
        p.font.color.rgb = TEXT_MAIN
        p.font.name = "Arial"
        p.space_after = Pt(12)

        pb = tf.add_paragraph()
        pb.text = p_body
        pb.font.size = Pt(12)
        pb.font.color.rgb = TEXT_MUTED
        pb.font.name = "Arial"

    # =========================================================================
    # SLIDE 3: System Overview (The Solution)
    # =========================================================================
    slide3 = prs.slides.add_slide(blank_layout)
    set_slide_background(slide3, LIGHT_BG)
    add_header(slide3, "System Solution", "PeerGear: Safe, Closed-Loop Campus Sharing", 
               "Four foundational pillars designed specifically to make peer equipment sharing safe, automated, and dispute-free.")

    solutions = [
        ("1. Closed-Campus Verification",
         "• Exclusive access: Only registered college students can browse, rent, or list gear.\n• Two-step security: College email confirmation code + physical College ID card upload.\n• Eliminates strangers and keeps the community safe within college boundaries."),
        ("2. 100% Refundable Deposit Escrow",
         "• A refundable security deposit is safely held by the platform during the entire rental.\n• Owners are protected against damage or loss without having to ask friends for cash.\n• Honest borrowers receive their full deposit back immediately upon verified return."),
        ("3. Dynamic QR Pass Handover",
         "• Physical exchange is confirmed using a dynamic QR pass shown on the borrower's phone.\n• The owner scans the pass using their camera when meeting at the hostel or campus hub.\n• Prevents fake claims, confirms identity, and auto-closes in real time upon successful scan."),
        ("4. Campus Demand / Request Board",
         "• Can't find an item? Students post a 'Wanted Gear' request with their daily budget.\n• Other campus students who own the item receive an instant alert and can list it right away.\n• Ensures students get the exact equipment they need for projects and labs.")
    ]

    for i, (s_title, s_body) in enumerate(solutions):
        row = i // 2
        col = i % 2
        x = Inches(0.8 + col * 5.95)
        y = Inches(2.0 + row * 2.45)

        card = slide3.shapes.add_shape(MSO_SHAPE.ROUNDED_RECTANGLE, x, y, Inches(5.75), Inches(2.25))
        card.fill.solid()
        card.fill.fore_color.rgb = CARD_BG
        card.line.color.rgb = CARD_BORDER
        card.line.width = Pt(1)

        tf = card.text_frame
        tf.word_wrap = True
        tf.margin_left = Inches(0.3)
        tf.margin_top = Inches(0.25)
        tf.margin_right = Inches(0.3)

        p = tf.paragraphs[0]
        p.text = s_title
        p.font.size = Pt(15)
        p.font.bold = True
        p.font.color.rgb = PRIMARY_DARK
        p.font.name = "Arial"
        p.space_after = Pt(6)

        pb = tf.add_paragraph()
        pb.text = s_body
        pb.font.size = Pt(11.5)
        pb.font.color.rgb = TEXT_MUTED
        pb.font.name = "Arial"

    # =========================================================================
    # SLIDE 4: Feature 1 - Student Verification & Trust Badges
    # =========================================================================
    slide4 = prs.slides.add_slide(blank_layout)
    set_slide_background(slide4, LIGHT_BG)
    add_header(slide4, "Core Functionality: Trust & Safety", "Student Identity Verification & Safe Campus Badges", 
               "Multi-tier verification system that ensures only legitimate, accountable college students trade on campus.")

    verify_steps = [
        ("Step 1: College Email Verification", 
         "Instant Email Security Code", 
         "• Students register using their college email address.\n\n• A 6-digit verification code is instantly delivered to their inbox to verify email ownership.\n\n• Blocks fake accounts, automated bots, and unauthorized outside signups.",
         PRIMARY),
        ("Step 2: Student ID Card Upload", 
         "Official ID & Registration Check", 
         "• Students upload a clear photo or document of their physical College ID Card.\n\n• College administrators inspect the student's name, roll number, and enrolled branch on an internal review panel.\n\n• Confirms authentic campus enrollment before lending permissions are granted.",
         ACCENT_CYAN),
        ("Step 3: Visible Trust Badges", 
         "Transparent Campus Reputation", 
         "• Verified students receive a prominent 'Campus ID Verified' shield badge on their profile and items.\n\n• Listing cards clearly display the student's Registration Number, Hostel Block, and community Trust Rating.\n\n• Borrowers know exactly who they are meeting before booking.",
         ACCENT_GREEN)
    ]

    for i, (layer, tech, details, accent) in enumerate(verify_steps):
        x = Inches(0.8 + i * 3.95)
        box = slide4.shapes.add_shape(MSO_SHAPE.ROUNDED_RECTANGLE, x, Inches(2.0), Inches(3.75), Inches(4.8))
        box.fill.solid()
        box.fill.fore_color.rgb = CARD_BG
        box.line.color.rgb = CARD_BORDER

        top_bar = slide4.shapes.add_shape(MSO_SHAPE.RECTANGLE, x, Inches(2.0), Inches(3.75), Inches(0.1))
        top_bar.fill.solid()
        top_bar.fill.fore_color.rgb = accent
        top_bar.line.color.rgb = accent

        tf = box.text_frame
        tf.word_wrap = True
        tf.margin_left = Inches(0.3)
        tf.margin_top = Inches(0.3)
        tf.margin_right = Inches(0.3)

        p = tf.paragraphs[0]
        p.text = layer
        p.font.size = Pt(11)
        p.font.bold = True
        p.font.color.rgb = accent
        p.font.name = "Arial"

        pt = tf.add_paragraph()
        pt.text = tech
        pt.font.size = Pt(16)
        pt.font.bold = True
        pt.font.color.rgb = TEXT_MAIN
        pt.font.name = "Arial"
        pt.space_after = Pt(10)

        pd = tf.add_paragraph()
        pd.text = details
        pd.font.size = Pt(11.5)
        pd.font.color.rgb = TEXT_MUTED
        pd.font.name = "Arial"

    # =========================================================================
    # SLIDE 5: Feature 2 - Item Discovery & Listing
    # =========================================================================
    slide5 = prs.slides.add_slide(blank_layout)
    set_slide_background(slide5, LIGHT_BG)
    add_header(slide5, "Core Functionality: Exploration & Listing", "Finding Gear in Seconds & Listing Idle Items", 
               "Designed for ease of use on smartphones: intuitive catalog discovery for borrowers and a 1-minute listing flow for owners.")

    cards_s5 = [
        ("FOR BORROWERS: SMART CATALOG EXPLORATION",
         "How Students Find Exactly What They Need",
         "• One-Tap Category Filters: Quick navigation across Academics, Electronics, Lab Gear, Cycles, Sports Equipment, and Textbooks.\n\n"
         "• Real-Time Search & Price Slider: Instant keyword matching and budget filters to discover items under specific daily rental rates.\n\n"
         "• Transparent Item Details: View high-resolution photos, condition tags (Brand New, Excellent, Good), technical specs, daily rental fees, and refundable deposit amounts.\n\n"
         "• Prominent Pickup Location: Clear indication of where the equipment is located (e.g. Hostel Block B, Common Room, or Library Gate) before booking.",
         PRIMARY),
        ("FOR OWNERS: 1-MINUTE SMART LISTING FLOW",
         "Monetizing Idle Dorm Gear with Ease",
         "• Mobile Photo Upload: Take or select photos directly from a smartphone with automatic image optimization for fast loading.\n\n"
         "• Custom Rates & Deposits: Owners set their own fair daily rental fee (e.g. ₹20/day) and security deposit (e.g. ₹200).\n\n"
         "• Clear Condition & Notes: Add accurate descriptions, included accessories (chargers, cases, cables), and special usage rules.\n\n"
         "• Convenient Campus Pickup Point: Designate a comfortable, safe spot on campus for item collection.\n\n"
         "• Instant Campus Availability: Listed items go live immediately to the campus student directory.",
         ACCENT_GREEN)
    ]

    for i, (tag, title, body, accent) in enumerate(cards_s5):
        x = Inches(0.8 + i * 5.95)
        box = slide5.shapes.add_shape(MSO_SHAPE.ROUNDED_RECTANGLE, x, Inches(2.0), Inches(5.75), Inches(4.8))
        box.fill.solid()
        box.fill.fore_color.rgb = CARD_BG
        box.line.color.rgb = CARD_BORDER

        top_bar = slide5.shapes.add_shape(MSO_SHAPE.RECTANGLE, x, Inches(2.0), Inches(5.75), Inches(0.1))
        top_bar.fill.solid()
        top_bar.fill.fore_color.rgb = accent
        top_bar.line.color.rgb = accent

        tf = box.text_frame
        tf.word_wrap = True
        tf.margin_left = Inches(0.3)
        tf.margin_top = Inches(0.25)
        tf.margin_right = Inches(0.3)

        p = tf.paragraphs[0]
        p.text = tag
        p.font.size = Pt(10)
        p.font.bold = True
        p.font.color.rgb = accent
        p.font.name = "Arial"

        pt = tf.add_paragraph()
        pt.text = title
        pt.font.size = Pt(16)
        pt.font.bold = True
        pt.font.color.rgb = TEXT_MAIN
        pt.font.name = "Arial"
        pt.space_after = Pt(10)

        pd = tf.add_paragraph()
        pd.text = body
        pd.font.size = Pt(11.5)
        pd.font.color.rgb = TEXT_MUTED
        pd.font.name = "Arial"

    # =========================================================================
    # SLIDE 6: Feature 3 - Booking & Deposit Escrow Protection
    # =========================================================================
    slide6 = prs.slides.add_slide(blank_layout)
    set_slide_background(slide6, LIGHT_BG)
    add_header(slide6, "Core Functionality: Financial Safety", "Fair Rental Booking & Automated Escrow Protection", 
               "Eliminating social awkwardness and money disputes through automated security deposit protection.")

    escrow_cards = [
        ("1. Transparent Cost Calculation",
         "• Before confirming a booking, students see an exact financial summary: Rental Days × Daily Rate + Refundable Deposit.\n• No hidden platform commissions or surprise charges at checkout.\n• Both borrower and owner have full clarity on fees before meeting."),
        ("2. Integrated Digital Wallet",
         "• Every registered student has a secure campus wallet balance.\n• Seamlessly handles rental payments, payouts from rented items, and deposit holds.\n• Eliminates messy cash exchanges and change issues in hostel rooms."),
        ("3. Automated Escrow Holding",
         "• The refundable security deposit is securely locked in escrow by the platform when booking is confirmed.\n• The owner cannot withhold it unfairly, and the borrower cannot default on damage.\n• Guaranteed protection for both parties during the entire rental period."),
        ("4. Win-Win Peace of Mind",
         "• Owners feel 100% confident renting valuable electronics or lab kits to peers.\n• Borrowers know their deposit is safe and will be refunded immediately upon return.\n• Protects campus friendships and avoids uncomfortable debt discussions.")
    ]

    for i, (e_title, e_body) in enumerate(escrow_cards):
        row = i // 2
        col = i % 2
        x = Inches(0.8 + col * 5.95)
        y = Inches(2.0 + row * 2.45)

        card = slide6.shapes.add_shape(MSO_SHAPE.ROUNDED_RECTANGLE, x, y, Inches(5.75), Inches(2.25))
        card.fill.solid()
        card.fill.fore_color.rgb = CARD_BG
        card.line.color.rgb = CARD_BORDER

        tf = card.text_frame
        tf.word_wrap = True
        tf.margin_left = Inches(0.3)
        tf.margin_top = Inches(0.22)
        tf.margin_right = Inches(0.3)

        p = tf.paragraphs[0]
        p.text = e_title
        p.font.size = Pt(15)
        p.font.bold = True
        p.font.color.rgb = PRIMARY_DARK
        p.font.name = "Arial"
        p.space_after = Pt(6)

        pb = tf.add_paragraph()
        pb.text = e_body
        pb.font.size = Pt(11.5)
        pb.font.color.rgb = TEXT_MUTED
        pb.font.name = "Arial"

    # =========================================================================
    # SLIDE 7: Feature 4 - In-Person QR Pass Handover
    # =========================================================================
    slide7 = prs.slides.add_slide(blank_layout)
    set_slide_background(slide7, LIGHT_BG)
    add_header(slide7, "Core Functionality: Physical Handover", "In-Person Exchange via Dynamic QR Code Pass", 
               "A fast, contactless verification process when students meet on campus, featuring real-time auto-close.")

    qr_steps = [
        ("Step 1: Meet at Campus Hub", 
         "Borrower & Owner Meetup", 
         "• Students meet at the designated pickup spot (e.g. Hostel B Lobby or Library).\n\n• Both verify each other's identity on their PeerGear profile.",
         PRIMARY),
        ("Step 2: Show Dynamic Pass", 
         "Secure Handover QR Code", 
         "• Borrower opens their booking pass on their phone.\n\n• Displays a dynamic QR code and a 4-digit backup code (hidden from owner until meetup).",
         ACCENT_CYAN),
        ("Step 3: Owner Camera Scan", 
         "Instant Mobile Verification", 
         "• Owner opens the PeerGear camera scanner.\n\n• Scans the borrower's screen to verify authenticity in less than 1 second.",
         ACCENT_AMBER),
        ("Step 4: Live Auto-Close", 
         "Real-Time Confirmation", 
         "• A celebration checkmark appears on both screens.\n\n• The QR pass auto-closes instantly, and the rental status transitions to 'Active'.",
         ACCENT_GREEN)
    ]

    for i, (step_num, step_title, step_body, accent) in enumerate(qr_steps):
        x = Inches(0.8 + i * 2.95)
        box = slide7.shapes.add_shape(MSO_SHAPE.ROUNDED_RECTANGLE, x, Inches(2.0), Inches(2.8), Inches(4.8))
        box.fill.solid()
        box.fill.fore_color.rgb = CARD_BG
        box.line.color.rgb = CARD_BORDER

        top_bar = slide7.shapes.add_shape(MSO_SHAPE.RECTANGLE, x, Inches(2.0), Inches(2.8), Inches(0.1))
        top_bar.fill.solid()
        top_bar.fill.fore_color.rgb = accent
        top_bar.line.color.rgb = accent

        tf = box.text_frame
        tf.word_wrap = True
        tf.margin_left = Inches(0.2)
        tf.margin_top = Inches(0.25)
        tf.margin_right = Inches(0.2)

        p = tf.paragraphs[0]
        p.text = step_num
        p.font.size = Pt(11)
        p.font.bold = True
        p.font.color.rgb = accent
        p.font.name = "Arial"

        pt = tf.add_paragraph()
        pt.text = step_title
        pt.font.size = Pt(14)
        pt.font.bold = True
        pt.font.color.rgb = TEXT_MAIN
        pt.font.name = "Arial"
        pt.space_after = Pt(8)

        pd = tf.add_paragraph()
        pd.text = step_body
        pd.font.size = Pt(11)
        pd.font.color.rgb = TEXT_MUTED
        pd.font.name = "Arial"

    # =========================================================================
    # SLIDE 8: Feature 5 - Return Inspection & Instant Refund
    # =========================================================================
    slide8 = prs.slides.add_slide(blank_layout)
    set_slide_background(slide8, LIGHT_BG)
    add_header(slide8, "Core Functionality: Return & Refund", "Hassle-Free Returns & Automated Instant Deposit Refund", 
               "Closing the rental cycle with simple condition verification, instant automated refunds, and community trust building.")

    return_cards = [
        ("1. Return Meetup & Condition Inspection", 
         "Fast 1-Minute Inspection", 
         "• When the rental period concludes, students meet back at the campus pickup point.\n\n• The owner inspects the returned equipment to ensure it is in the original condition with all accessories intact.\n\n• Fast, straightforward in-person verification without paperwork.",
         ACCENT_AMBER),
        ("2. Instant Automated Deposit Refund", 
         "Zero Waiting Time for Money", 
         "• The owner taps 'Confirm Return Received' on their PeerGear dashboard.\n\n• The system immediately unlocks the escrow security deposit.\n\n• 100% of the deposit is credited back to the borrower's digital wallet in real time—no waiting days for manual bank settlements.",
         ACCENT_GREEN),
        ("3. Mutual Ratings & Reviews", 
         "Building Campus Reputation", 
         "• Both the borrower and owner rate their experience from 1 to 5 stars and leave brief feedback.\n\n• Honest, punctual students increase their campus Trust Rating.\n\n• Fosters a self-regulating, high-trust community where dependable students receive priority bookings.",
         PRIMARY)
    ]

    for i, (r_tag, r_title, r_body, accent) in enumerate(return_cards):
        x = Inches(0.8 + i * 3.95)
        box = slide8.shapes.add_shape(MSO_SHAPE.ROUNDED_RECTANGLE, x, Inches(2.0), Inches(3.75), Inches(4.8))
        box.fill.solid()
        box.fill.fore_color.rgb = CARD_BG
        box.line.color.rgb = CARD_BORDER

        top_bar = slide8.shapes.add_shape(MSO_SHAPE.RECTANGLE, x, Inches(2.0), Inches(3.75), Inches(0.1))
        top_bar.fill.solid()
        top_bar.fill.fore_color.rgb = accent
        top_bar.line.color.rgb = accent

        tf = box.text_frame
        tf.word_wrap = True
        tf.margin_left = Inches(0.3)
        tf.margin_top = Inches(0.3)
        tf.margin_right = Inches(0.3)

        p = tf.paragraphs[0]
        p.text = r_tag
        p.font.size = Pt(11)
        p.font.bold = True
        p.font.color.rgb = accent
        p.font.name = "Arial"

        pt = tf.add_paragraph()
        pt.text = r_title
        pt.font.size = Pt(16)
        pt.font.bold = True
        pt.font.color.rgb = TEXT_MAIN
        pt.font.name = "Arial"
        pt.space_after = Pt(10)

        pd = tf.add_paragraph()
        pd.text = r_body
        pd.font.size = Pt(11.5)
        pd.font.color.rgb = TEXT_MUTED
        pd.font.name = "Arial"

    # =========================================================================
    # SLIDE 9: Feature 6 & Campus Impact (Dark Theme)
    # =========================================================================
    slide9 = prs.slides.add_slide(blank_layout)
    set_slide_background(slide9, DARK_BG)

    stripe9 = slide9.shapes.add_shape(MSO_SHAPE.RECTANGLE, Inches(0), Inches(0), Inches(13.333), Inches(0.15))
    stripe9.fill.solid()
    stripe9.fill.fore_color.rgb = ACCENT_GREEN
    stripe9.line.color.rgb = ACCENT_GREEN

    # Header Box
    th_box = slide9.shapes.add_textbox(Inches(1.0), Inches(0.65), Inches(11.3), Inches(1.2))
    tf_th = th_box.text_frame
    tf_th.word_wrap = True
    p9_tag = tf_th.paragraphs[0]
    p9_tag.text = "ADDITIONAL FUNCTIONALITY & REAL-WORLD VALUE"
    p9_tag.font.size = Pt(11)
    p9_tag.font.bold = True
    p9_tag.font.color.rgb = RGBColor(52, 211, 153) # Emerald 400
    p9_tag.font.name = "Arial"
    p9_tag.space_after = Pt(4)

    p9_t = tf_th.add_paragraph()
    p9_t.text = "Campus Demand Board & Real-World Student Impact"
    p9_t.font.size = Pt(24)
    p9_t.font.bold = True
    p9_t.font.color.rgb = RGBColor(255, 255, 255)
    p9_t.font.name = "Arial"

    # Left Box: Demand Board Feature
    c_left = slide9.shapes.add_shape(MSO_SHAPE.ROUNDED_RECTANGLE, Inches(1.0), Inches(2.1), Inches(5.4), Inches(4.7))
    c_left.fill.solid()
    c_left.fill.fore_color.rgb = RGBColor(30, 41, 59)
    c_left.line.color.rgb = RGBColor(51, 65, 85)

    tf_l = c_left.text_frame
    tf_l.word_wrap = True
    tf_l.margin_left = Inches(0.35)
    tf_l.margin_top = Inches(0.3)
    tf_l.margin_right = Inches(0.35)

    pl_0 = tf_l.paragraphs[0]
    pl_0.text = "FEATURE 6: CAMPUS DEMAND BOARD"
    pl_0.font.size = Pt(11)
    pl_0.font.bold = True
    pl_0.font.color.rgb = RGBColor(129, 140, 248)
    pl_0.font.name = "Arial"
    pl_0.space_after = Pt(8)

    pl_1 = tf_l.add_paragraph()
    pl_1.text = "Fulfilling Unlisted Student Needs:"
    pl_1.font.size = Pt(14)
    pl_1.font.bold = True
    pl_1.font.color.rgb = RGBColor(255, 255, 255)
    pl_1.font.name = "Arial"
    pl_1.space_after = Pt(8)

    pl_2 = tf_l.add_paragraph()
    pl_2.text = (
        "• Post 'Wanted Gear' Requests:\n"
        "  If an item isn't currently listed, a student posts a request with the required category, needed dates, and maximum daily budget.\n\n"
        "• Instant Alerts to Campus Peers:\n"
        "  Students who own the item receive an immediate in-app notification about the demand.\n\n"
        "• One-Click Fulfillment:\n"
        "  Owners can list the requested equipment with a single tap, directly connecting with the requester.\n\n"
        "• High Resource Utilization:\n"
        "  Ensures no student gets stuck before exams or project submissions."
    )
    pl_2.font.size = Pt(11.5)
    pl_2.font.color.rgb = RGBColor(226, 232, 240)
    pl_2.font.name = "Arial"

    # Right Box: Real-World Campus Impact
    c_right = slide9.shapes.add_shape(MSO_SHAPE.ROUNDED_RECTANGLE, Inches(6.8), Inches(2.1), Inches(5.5), Inches(4.7))
    c_right.fill.solid()
    c_right.fill.fore_color.rgb = RGBColor(30, 41, 59)
    c_right.line.color.rgb = RGBColor(51, 65, 85)

    tf_r = c_right.text_frame
    tf_r.word_wrap = True
    tf_r.margin_left = Inches(0.35)
    tf_r.margin_top = Inches(0.3)
    tf_r.margin_right = Inches(0.35)

    pr_0 = tf_r.paragraphs[0]
    pr_0.text = "REAL-WORLD CAMPUS BENEFITS"
    pr_0.font.size = Pt(11)
    pr_0.font.bold = True
    pr_0.font.color.rgb = RGBColor(52, 211, 153)
    pr_0.font.name = "Arial"
    pr_0.space_after = Pt(8)

    pr_1 = tf_r.add_paragraph()
    pr_1.text = "Direct Economic & Community Impact:"
    pr_1.font.size = Pt(14)
    pr_1.font.bold = True
    pr_1.font.color.rgb = RGBColor(255, 255, 255)
    pr_1.font.name = "Arial"
    pr_1.space_after = Pt(8)

    pr_2 = tf_r.add_paragraph()
    pr_2.text = (
        "• 85–90% Student Cost Savings:\n"
        "  Drastically reduces out-of-pocket expenses for equipment used only for a semester or single lab practical.\n\n"
        "• Monetizing Idle Assets:\n"
        "  Seniors earn pocket money from calculators, lab aprons, and sports kits that would otherwise gather dust.\n\n"
        "• Zero Stolen or Disputed Items:\n"
        "  Escrow deposit holding and verified ID authentication eliminate theft, defaults, and hostel friction.\n\n"
        "• Eco-Friendly & Sustainable Campus:\n"
        "  Promotes circular economy and resource reuse, cutting down electronic and plastic waste on campus."
    )
    pr_2.font.size = Pt(11.5)
    pr_2.font.color.rgb = RGBColor(226, 232, 240)
    pr_2.font.name = "Arial"

    prs.save(output_path)
    print(f"Presentation successfully saved to: {output_path}")

if __name__ == "__main__":
    create_presentation()
