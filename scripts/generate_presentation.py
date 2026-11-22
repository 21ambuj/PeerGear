import os
import pptx
from pptx.util import Inches, Pt
from pptx.dml.color import RGBColor
from pptx.enum.text import PP_ALIGN
from pptx.enum.shapes import MSO_SHAPE

def create_presentation(output_path="PeerGear_Presentation.pptx"):
    prs = pptx.Presentation()
    # 16:9 Widescreen dimensions (13.333 x 7.5 inches)
    prs.slide_width = Inches(13.333)
    prs.slide_height = Inches(7.5)
    blank_layout = prs.slide_layouts[6]

    # Color Palette (Modern, academic, clean & professional)
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
        tag_box = slide.shapes.add_textbox(Inches(0.8), Inches(0.40), Inches(10), Inches(0.35))
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
        title_box = slide.shapes.add_textbox(Inches(0.8), Inches(0.75), Inches(11.5), Inches(0.55))
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
            sub_box = slide.shapes.add_textbox(Inches(0.8), Inches(1.32), Inches(11.5), Inches(0.45))
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
    # SLIDE 1: Title Slide (Dark Theme - NO PERSONAL NAMES)
    # =========================================================================
    slide1 = prs.slides.add_slide(blank_layout)
    set_slide_background(slide1, DARK_BG)

    # Accent Top Stripe
    stripe1 = slide1.shapes.add_shape(MSO_SHAPE.RECTANGLE, Inches(0), Inches(0), Inches(13.333), Inches(0.15))
    stripe1.fill.solid()
    stripe1.fill.fore_color.rgb = PRIMARY
    stripe1.line.color.rgb = PRIMARY

    # Title box
    tbox = slide1.shapes.add_textbox(Inches(1.0), Inches(1.4), Inches(11.3), Inches(2.4))
    tf1 = tbox.text_frame
    tf1.word_wrap = True

    p0 = tf1.paragraphs[0]
    p0.text = "FINAL YEAR B.TECH CAPSTONE PROJECT PRESENTATION"
    p0.font.size = Pt(11)
    p0.font.bold = True
    p0.font.color.rgb = RGBColor(129, 140, 248) # Indigo 400
    p0.font.name = "Arial"
    p0.space_after = Pt(8)

    p1 = tf1.add_paragraph()
    p1.text = "PeerGear"
    p1.font.size = Pt(46)
    p1.font.bold = True
    p1.font.color.rgb = RGBColor(255, 255, 255)
    p1.font.name = "Arial"

    p2 = tf1.add_paragraph()
    p2.text = "A Django-Powered Campus Resource Sharing & Equipment Rental System"
    p2.font.size = Pt(17)
    p2.font.bold = True
    p2.font.color.rgb = RGBColor(224, 231, 255) # Indigo 100
    p2.font.name = "Arial"
    p2.space_after = Pt(6)

    p3 = tf1.add_paragraph()
    p3.text = "A safe, closed-campus web platform enabling students to share, rent, and monetize semester gear with automated deposit escrow and live QR handover."
    p3.font.size = Pt(12.5)
    p3.font.color.rgb = RGBColor(148, 163, 184) # Slate 400
    p3.font.name = "Arial"

    # Card 1: Academic & Department Details (NO PERSONAL NAMES)
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
    pc1_0.text = "ACADEMIC DETAILS"
    pc1_0.font.size = Pt(10)
    pc1_0.font.bold = True
    pc1_0.font.color.rgb = RGBColor(148, 163, 184)
    pc1_0.font.name = "Arial"
    pc1_0.space_after = Pt(4)

    pc1_1 = tf_c1.add_paragraph()
    pc1_1.text = "Department of Computer Science & Engineering"
    pc1_1.font.size = Pt(16)
    pc1_1.font.bold = True
    pc1_1.font.color.rgb = RGBColor(255, 255, 255)
    pc1_1.font.name = "Arial"
    pc1_1.space_after = Pt(6)

    pc1_2 = tf_c1.add_paragraph()
    pc1_2.text = "• Bachelor of Technology (B.Tech CSE)\n• 4th Year Final Semester Major Project Showcase\n• Academic Session: 2025 – 2026"
    pc1_2.font.size = Pt(11.5)
    pc1_2.font.color.rgb = RGBColor(203, 213, 225)
    pc1_2.font.name = "Arial"

    # Card 2: Core Platform Focus (NO PERSONAL NAMES)
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
    pc2_0.text = "PROJECT HIGHLIGHTS"
    pc2_0.font.size = Pt(10)
    pc2_0.font.bold = True
    pc2_0.font.color.rgb = RGBColor(148, 163, 184)
    pc2_0.font.name = "Arial"
    pc2_0.space_after = Pt(4)

    pc2_1 = tf_c2.add_paragraph()
    pc2_1.text = "Django Backend Core & Real-World Campus Utility"
    pc2_1.font.size = Pt(16)
    pc2_1.font.bold = True
    pc2_1.font.color.rgb = RGBColor(255, 255, 255)
    pc2_1.font.name = "Arial"
    pc2_1.space_after = Pt(6)

    pc2_2 = tf_c2.add_paragraph()
    pc2_2.text = "• Robust Django REST API handling business logic & security\n• Two-step campus verification with College ID checks\n• Automated deposit escrow preventing theft or disputes\n• Dynamic QR pass with live in-person auto-close"
    pc2_2.font.size = Pt(11.5)
    pc2_2.font.color.rgb = RGBColor(203, 213, 225)
    pc2_2.font.name = "Arial"

    # =========================================================================
    # SLIDE 2: Problem Statement & Campus Motivation
    # =========================================================================
    slide2 = prs.slides.add_slide(blank_layout)
    set_slide_background(slide2, LIGHT_BG)
    add_header(slide2, "Need Analysis & Motivation", "The Student Problem: High Expenses & Zero Campus Trust", 
               "Understanding the financial strain and social awkwardness college students face with short-term equipment.")

    problems = [
        ("1. Expensive Temporary Needs", 
         "• Students frequently need costly tools for only a single semester, lab practical, or exam (e.g. engineering drafters, scientific calculators, lab aprons, DSLR cameras, sports kits, cycles).\n\n• Buying brand-new equipment for short-term use creates unnecessary financial burden on students and parents.",
         ACCENT_ROSE),
        ("2. Idle Gear Sitting in Hostels", 
         "• Senior students already own these exact tools, but after their semester ends, the items sit unused in hostel cupboards for 85–90% of the academic year.\n\n• There is no organized, trustworthy campus platform for seniors to safely rent out their idle gear and earn pocket money.",
         ACCENT_AMBER),
        ("3. Broken Informal Borrowing", 
         "• Loaning items informally to hostel mates often leads to delayed returns, equipment damage, or lost items with zero financial recourse.\n\n• Asking friends for cash deposits or late fees is socially awkward, causing students to refuse lending to peers altogether.",
         PRIMARY)
    ]

    for i, (p_title, p_body, accent) in enumerate(problems):
        x = Inches(0.8 + i * 3.95)
        box = slide2.shapes.add_shape(MSO_SHAPE.ROUNDED_RECTANGLE, x, Inches(2.0), Inches(3.75), Inches(4.8))
        box.fill.solid()
        box.fill.fore_color.rgb = CARD_BG
        box.line.color.rgb = CARD_BORDER
        box.line.width = Pt(1)

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
    # SLIDE 3: Proposed Solution - PeerGear Platform
    # =========================================================================
    slide3 = prs.slides.add_slide(blank_layout)
    set_slide_background(slide3, LIGHT_BG)
    add_header(slide3, "System Solution", "PeerGear: A Trust-First Campus Resource Sharing System", 
               "Four foundational pillars designed specifically to make peer equipment sharing safe, automated, and dispute-free.")

    solutions = [
        ("1. Closed-Campus Verification",
         "• Restricted access: Only verified college students can browse, list, or rent gear.\n• Two-step security: College email confirmation code + physical College ID card upload.\n• Eliminates outsiders and stranger danger, keeping all transactions safe inside campus walls."),
        ("2. Django-Powered Business Rules",
         "• High-reliability Django backend enforces automated rental booking and dispute logic.\n• Manages atomic wallet deductions, booking schedules, and condition inspection logs.\n• Eliminates double-booking conflicts and handles transaction security automatically."),
        ("3. 100% Refundable Deposit Escrow",
         "• A refundable security deposit is safely locked by the platform during the entire rental.\n• Owners are protected against damage or loss without having to ask friends for cash.\n• Honest borrowers receive their full deposit back immediately upon verified return."),
        ("4. Dynamic QR Pass Handover",
         "• Physical exchange is confirmed using a dynamic QR pass shown on the borrower's phone.\n• The owner scans the pass using their phone camera when meeting at the hostel or campus hub.\n• Prevents fake claims, confirms identity, and auto-closes in real time upon successful scan.")
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
    # SLIDE 4: Technology Stack (PRIORITY ON DJANGO)
    # =========================================================================
    slide4 = prs.slides.add_slide(blank_layout)
    set_slide_background(slide4, LIGHT_BG)
    add_header(slide4, "Technology Architecture", "Full-Stack Architecture with Django Backend Core", 
               "Clean multi-tier architecture where Django orchestrates APIs, database operations, security, and transactions.")

    tech_cards = [
        ("Client Layer (Frontend)", 
         "React 19 & Tailwind CSS", 
         "• Modern, responsive user interface built with React 19, Tailwind CSS, and Vite.\n\n"
         "• Features an in-app HTML5 camera scanner for instant QR code verification.\n\n"
         "• Client-side canvas image compression scaling mobile photos before upload.\n\n"
         "• In-memory SWR caching for 0ms instant tab navigation across campus listings.",
         PRIMARY),
        ("Core Engine (Backend) - PRIORITY", 
         "Django REST & Python 3.12", 
         "• Django 4.2 serves as the core application engine orchestrating all platform operations.\n\n"
         "• Modular Django apps: accounts, items, rentals, demand_requests, and analytics.\n\n"
         "• Enforces stateless JWT authentication, Role-Based Access Control, and BOLA defenses.\n\n"
         "• Executes automated deposit escrow locks and instant 0ms refund payouts upon return.",
         ACCENT_GREEN),
        ("Data Layer & Cloud Services", 
         "MongoDB Atlas & Cloud Mail", 
         "• MongoDB Atlas Cloud Cluster managing flexible document schemas for equipment.\n\n"
         "• Unique B-Tree indexes on student email and roll number preventing duplicate accounts.\n\n"
         "• Compound text search indexes enabling instant keyword matching across gear.\n\n"
         "• Resend HTTPS REST API (Port 443) ensuring reliable sub-2s email OTP deliverability.",
         ACCENT_AMBER)
    ]

    for i, (layer, tech, details, accent) in enumerate(tech_cards):
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
        pt.font.size = Pt(15.5)
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
    # SLIDE 5: System Workflow & Process Flow Diagram
    # =========================================================================
    slide5 = prs.slides.add_slide(blank_layout)
    set_slide_background(slide5, LIGHT_BG)
    add_header(slide5, "Operational Lifecycle", "End-to-End System Process Flow", 
               "The complete step-by-step student rental journey from initial onboarding to return and automated deposit refund.")

    steps = [
        ("Step 1: Student Onboarding", 
         "Student registers using college email; verifies 6-digit email OTP; uploads physical College ID card for admin moderation approval."),
        ("Step 2: Discover or List", 
         "Borrowers explore catalog with instant category tabs and price sliders; Owners list idle dorm gear in 1 minute with photos and daily rates."),
        ("Step 3: Booking & Escrow", 
         "Borrower selects rental dates; Django validates wallet balance, calculates daily fees, and locks refundable deposit into secure escrow."),
        ("Step 4: Live QR Handover", 
         "Students meet at campus hub; borrower opens dynamic QR pass; owner scans with phone camera; Django verifies handover in real time."),
        ("Step 5: Active Rental", 
         "Rental contract transitions to ACTIVE; borrower's screen auto-closes; item condition tracking and timestamps are locked by Django."),
        ("Step 6: Return & Refund", 
         "Students meet for return; owner inspects gear and taps confirm; Django immediately releases 100% of deposit back to borrower's wallet.")
    ]

    for i, (st_title, st_body) in enumerate(steps):
        row = i // 3
        col = i % 3
        x = Inches(0.8 + col * 3.95)
        y = Inches(2.0 + row * 2.45)

        card = slide5.shapes.add_shape(MSO_SHAPE.ROUNDED_RECTANGLE, x, y, Inches(3.75), Inches(2.25))
        card.fill.solid()
        card.fill.fore_color.rgb = CARD_BG
        card.line.color.rgb = CARD_BORDER

        # Number Badge
        num_badge = slide5.shapes.add_shape(MSO_SHAPE.OVAL, x + Inches(0.22), y + Inches(0.2), Inches(0.35), Inches(0.35))
        num_badge.fill.solid()
        num_badge.fill.fore_color.rgb = PRIMARY
        num_badge.line.color.rgb = PRIMARY
        tf_n = num_badge.text_frame
        p_n = tf_n.paragraphs[0]
        p_n.text = str(i + 1)
        p_n.font.size = Pt(11)
        p_n.font.bold = True
        p_n.font.color.rgb = RGBColor(255, 255, 255)
        p_n.alignment = PP_ALIGN.CENTER

        tf = card.text_frame
        tf.word_wrap = True
        tf.margin_left = Inches(0.68)
        tf.margin_top = Inches(0.2)
        tf.margin_right = Inches(0.22)

        p = tf.paragraphs[0]
        p.text = st_title
        p.font.size = Pt(13)
        p.font.bold = True
        p.font.color.rgb = TEXT_MAIN
        p.font.name = "Arial"
        p.space_after = Pt(6)

        pb = tf.add_paragraph()
        pb.text = st_body
        pb.font.size = Pt(11)
        pb.font.color.rgb = TEXT_MUTED
        pb.font.name = "Arial"

    # =========================================================================
    # SLIDE 6: Key Features: Security, Authentication & Campus Trust
    # =========================================================================
    slide6 = prs.slides.add_slide(blank_layout)
    set_slide_background(slide6, LIGHT_BG)
    add_header(slide6, "Trust & Security Architecture", "Identity Verification, Trust Badges & Django Defenses", 
               "How the system guarantees that every user is an authenticated student and protects database integrity.")

    sec_cards = [
        ("Two-Step Verification", 
         "Guaranteed Campus Identity", 
         "• College Email Verification: 6-digit OTP delivered via HTTPS REST API confirms valid student email ownership.\n\n"
         "• Student ID Card Moderation: Physical College ID card upload reviewed by college coordinators before lending privileges.\n\n"
         "• Duplicate Prevention: Django and MongoDB strictly enforce unique constraints on email and student roll numbers.",
         PRIMARY),
        ("Visual Campus Trust", 
         "Transparent Community Reputation", 
         "• 'Campus ID Verified' Shield: Displayed on verified student profiles and active listing cards.\n\n"
         "• Student Transparency: Listings clearly show student Registration ID, Hostel Block, and community trust rating (1 to 5 stars).\n\n"
         "• Borrowers know exactly which student they are meeting at the hostel before booking.",
         ACCENT_CYAN),
        ("Django Security Defenses", 
         "Authorization & Data Protection", 
         "• Broken Object-Level Authorization (BOLA): Django checks verify only legitimate owners can confirm handovers or returns.\n\n"
         "• NoSQL Injection Protection: Rejects dictionary operator queries to protect database collections from unauthorized writes.\n\n"
         "• Salted Password Hashing: Uses cryptographic salts with PBKDF2/SHA-256 to defend against rainbow table attacks.",
         ACCENT_GREEN)
    ]

    for i, (layer, tech, details, accent) in enumerate(sec_cards):
        x = Inches(0.8 + i * 3.95)
        box = slide6.shapes.add_shape(MSO_SHAPE.ROUNDED_RECTANGLE, x, Inches(2.0), Inches(3.75), Inches(4.8))
        box.fill.solid()
        box.fill.fore_color.rgb = CARD_BG
        box.line.color.rgb = CARD_BORDER

        top_bar = slide6.shapes.add_shape(MSO_SHAPE.RECTANGLE, x, Inches(2.0), Inches(3.75), Inches(0.1))
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
        pt.font.size = Pt(15)
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
    # SLIDE 7: Core Working: Automated Escrow & In-Person QR Handover
    # =========================================================================
    slide7 = prs.slides.add_slide(blank_layout)
    set_slide_background(slide7, LIGHT_BG)
    add_header(slide7, "Core Functionality: Working Mechanism", "Automated Escrow Protection & Live QR Handover", 
               "How Django automates financial security and eliminates physical handover disputes when students meet on campus.")

    cards_s7 = [
        ("FINANCIAL SAFETY MODULE",
         "Automated Security Deposit Escrow",
         "• Upfront Cost Transparency: Total fee = Days × Daily Rate + Refundable Deposit. Clearly displayed before checkout.\n\n"
         "• Automated Escrow Lock: During checkout, Django locks the deposit into an escrow state. Neither student can unilaterally take the money.\n\n"
         "• Lender Protection: The owner is 100% protected against item damage or loss without having to ask friends for cash.\n\n"
         "• Borrower Guarantee: Responsible borrowers are guaranteed an immediate 100% refund upon return, ending hostel payment friction.\n\n"
         "• Integrated Student Wallet: Built-in digital campus wallet seamlessly handles payments, earnings, and deposit holds.",
         PRIMARY),
        ("PHYSICAL VERIFICATION MODULE",
         "In-Person Dynamic QR Code Handover",
         "• Campus Meetup: Borrower and owner meet at the agreed campus spot (Hostel lobby, library gate, or common room).\n\n"
         "• Dynamic QR Pass: The borrower opens their booking pass on their phone, displaying a dynamic QR code and 4-digit code.\n\n"
         "• Secret OTP Redaction: Django hides the 4-digit OTP from the owner's API before meetup, preventing premature claims.\n\n"
         "• Instant Camera Scan: The owner opens the PeerGear camera scanner on their phone and scans the borrower's screen.\n\n"
         "• Real-Time Auto-Close: Verification takes under 1 second. A green checkmark appears on both phones, and the QR pass auto-closes.",
         ACCENT_GREEN)
    ]

    for i, (tag, title, body, accent) in enumerate(cards_s7):
        x = Inches(0.8 + i * 5.95)
        box = slide7.shapes.add_shape(MSO_SHAPE.ROUNDED_RECTANGLE, x, Inches(2.0), Inches(5.75), Inches(4.8))
        box.fill.solid()
        box.fill.fore_color.rgb = CARD_BG
        box.line.color.rgb = CARD_BORDER

        top_bar = slide7.shapes.add_shape(MSO_SHAPE.RECTANGLE, x, Inches(2.0), Inches(5.75), Inches(0.1))
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
        pt.font.size = Pt(15.5)
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
    # SLIDE 8: Core Working: Inspection, Instant Deposit Refund & Demand Board
    # =========================================================================
    slide8 = prs.slides.add_slide(blank_layout)
    set_slide_background(slide8, LIGHT_BG)
    add_header(slide8, "Core Functionality: Returns & Demand", "Return Inspection, Instant Refund & Campus Demand Board", 
               "Closing the rental cycle with 0ms automated deposit refunds and fulfilling unlisted campus equipment needs.")

    ret_cards = [
        ("Return & Instant Refund", 
         "0ms Automated Deposit Return", 
         "• Return Inspection: At the end of the rental, students meet back at the campus hub. The owner inspects the returned gear.\n\n"
         "• One-Tap Confirmation: The owner taps 'Confirm Return' on their PeerGear dashboard.\n\n"
         "• Instant Wallet Credit: Django unlocks the escrow deposit immediately. 100% of the deposit is credited back to the borrower's wallet in real time (zero waiting days).\n\n"
         "• Dispute Arbitration: In case of damage, admins inspect evidence and arbitrate funds fairly.",
         ACCENT_GREEN),
        ("Campus Demand Board", 
         "Fulfilling Unlisted Needs", 
         "• 'Wanted Gear' Requests: If equipment isn't listed, students post a request with the required category and maximum daily budget.\n\n"
         "• Instant Peer Notifications: Django alerts students who own matching gear in their hostel rooms.\n\n"
         "• 1-Click Fulfillment: Seniors can list the requested item with a single tap, directly connecting with the junior requester.\n\n"
         "• Ensures no student is left without gear before semester exams or lab practicals.",
         PRIMARY),
        ("Mutual Ratings & Trust", 
         "Self-Regulating Community", 
         "• 5-Star Reviews: Both borrower and owner submit ratings and feedback after each completed exchange.\n\n"
         "• Campus Reputation: Punctual and careful students build a strong campus Trust Score.\n\n"
         "• High-trust students gain priority access to high-value items (like DSLR cameras and lab instruments).\n\n"
         "• Fosters long-term responsibility across hostel blocks and university departments.",
         ACCENT_AMBER)
    ]

    for i, (r_tag, r_title, r_body, accent) in enumerate(ret_cards):
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
        pt.font.size = Pt(15)
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
    # SLIDE 9: Project Impact, Results & Future Scope (Dark Theme)
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
    p9_tag.text = "PROJECT IMPACT & FUTURE ROADMAP"
    p9_tag.font.size = Pt(11)
    p9_tag.font.bold = True
    p9_tag.font.color.rgb = RGBColor(52, 211, 153) # Emerald 400
    p9_tag.font.name = "Arial"
    p9_tag.space_after = Pt(4)

    p9_t = tf_th.add_paragraph()
    p9_t.text = "Real-World Student Benefits & Future Scalability"
    p9_t.font.size = Pt(24)
    p9_t.font.bold = True
    p9_t.font.color.rgb = RGBColor(255, 255, 255)
    p9_t.font.name = "Arial"

    # Left Box: Project Impact
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
    pl_0.text = "REAL-WORLD CAMPUS IMPACT"
    pl_0.font.size = Pt(11)
    pl_0.font.bold = True
    pl_0.font.color.rgb = RGBColor(52, 211, 153)
    pl_0.font.name = "Arial"
    pl_0.space_after = Pt(8)

    pl_1 = tf_l.add_paragraph()
    pl_1.text = "Direct Economic & Community Benefits:"
    pl_1.font.size = Pt(14)
    pl_1.font.bold = True
    pl_1.font.color.rgb = RGBColor(255, 255, 255)
    pl_1.font.name = "Arial"
    pl_1.space_after = Pt(8)

    pl_2 = tf_l.add_paragraph()
    pl_2.text = (
        "• 85–90% Student Cost Savings:\n"
        "  Dramatically cuts out-of-pocket expenses for items needed only for one semester or a single exam.\n\n"
        "• Monetizing Idle Assets:\n"
        "  Seniors earn pocket money from calculators, lab aprons, and sports kits that would otherwise sit idle.\n\n"
        "• Zero Stolen or Disputed Items:\n"
        "  Automated escrow deposit locks and verified ID authentication eliminate theft, defaults, and hostel friction.\n\n"
        "• Eco-Friendly Green Campus:\n"
        "  Promotes circular resource reuse, reducing plastic, electronic, and paper waste across the university."
    )
    pl_2.font.size = Pt(11.5)
    pl_2.font.color.rgb = RGBColor(226, 232, 240)
    pl_2.font.name = "Arial"

    # Right Box: Future Scope
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
    pr_0.text = "FUTURE ENGINEERING ROADMAP"
    pr_0.font.size = Pt(11)
    pr_0.font.bold = True
    pr_0.font.color.rgb = RGBColor(129, 140, 248)
    pr_0.font.name = "Arial"
    pr_0.space_after = Pt(8)

    pr_1 = tf_r.add_paragraph()
    pr_1.text = "Upcoming Scalability Enhancements:"
    pr_1.font.size = Pt(14)
    pr_1.font.bold = True
    pr_1.font.color.rgb = RGBColor(255, 255, 255)
    pr_1.font.name = "Arial"
    pr_1.space_after = Pt(8)

    pr_2 = tf_r.add_paragraph()
    pr_2.text = (
        "1. Direct Campus UPI Payment Intents:\n"
        "  Integrating dynamic UPI QR codes for instantaneous student wallet deposit top-ups without external gateways.\n\n"
        "2. IoT Smart Campus Lockers:\n"
        "  Connecting with electronic hostel drop-boxes enabling 24/7 contactless equipment handover and return.\n\n"
        "3. AI Visual Condition Analysis:\n"
        "  Computer vision comparison of pre-pickup and post-return photos to automatically identify scratches or damage.\n\n"
        "4. Multi-College Federation:\n"
        "  Extending the platform to inter-college resource sharing across universities in the same city."
    )
    pr_2.font.size = Pt(11.5)
    pr_2.font.color.rgb = RGBColor(226, 232, 240)
    pr_2.font.name = "Arial"

    prs.save(output_path)
    print(f"Presentation successfully saved to: {output_path}")

if __name__ == "__main__":
    create_presentation()
