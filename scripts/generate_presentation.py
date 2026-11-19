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

    # Color Palette (Professional, modern, clean, human-designed)
    DARK_BG = RGBColor(15, 23, 42)      # Slate 900
    LIGHT_BG = RGBColor(248, 250, 252)  # Slate 50
    CARD_BG = RGBColor(255, 255, 255)   # White
    CARD_BORDER = RGBColor(226, 232, 240) # Slate 200
    PRIMARY = RGBColor(79, 70, 229)     # Indigo 600
    PRIMARY_DARK = RGBColor(49, 46, 129) # Indigo 900
    TEXT_MAIN = RGBColor(30, 41, 59)    # Slate 800
    TEXT_MUTED = RGBColor(100, 116, 139) # Slate 500
    TEXT_LIGHT = RGBColor(241, 245, 249) # Slate 100
    ACCENT_GREEN = RGBColor(16, 185, 129) # Emerald 500
    ACCENT_AMBER = RGBColor(217, 119, 6)  # Amber 600
    TAG_BG = RGBColor(238, 242, 255)    # Indigo 50
    TAG_TEXT = RGBColor(67, 56, 202)    # Indigo 700

    def add_header(slide, tag_text, title_text, subtitle_text=None):
        # Category Tag
        tag_box = slide.shapes.add_textbox(Inches(0.8), Inches(0.45), Inches(8), Inches(0.4))
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
        title_box = slide.shapes.add_textbox(Inches(0.8), Inches(0.8), Inches(11), Inches(0.6))
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
            sub_box = slide.shapes.add_textbox(Inches(0.8), Inches(1.4), Inches(11.5), Inches(0.4))
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
        # send to back via order

    # =========================================================================
    # SLIDE 1: Title Slide (Dark Theme)
    # =========================================================================
    slide1 = prs.slides.add_slide(blank_layout)
    set_slide_background(slide1, DARK_BG)

    # Accent Top Stripe
    stripe = slide1.shapes.add_shape(MSO_SHAPE.RECTANGLE, Inches(0), Inches(0), Inches(13.333), Inches(0.15))
    stripe.fill.solid()
    stripe.fill.fore_color.rgb = PRIMARY
    stripe.line.color.rgb = PRIMARY

    # Title box
    tbox = slide1.shapes.add_textbox(Inches(1.0), Inches(1.6), Inches(11.3), Inches(2.2))
    tf1 = tbox.text_frame
    tf1.word_wrap = True

    p0 = tf1.paragraphs[0]
    p0.text = "CAMPUS PEER-TO-PEER RESOURCE SHARING PLATFORM"
    p0.font.size = Pt(12)
    p0.font.bold = True
    p0.font.color.rgb = RGBColor(129, 140, 248) # Indigo 400
    p0.font.name = "Arial"
    p0.space_after = Pt(12)

    p1 = tf1.add_paragraph()
    p1.text = "PeerGear"
    p1.font.size = Pt(46)
    p1.font.bold = True
    p1.font.color.rgb = RGBColor(255, 255, 255)
    p1.font.name = "Arial"

    p2 = tf1.add_paragraph()
    p2.text = "A Verified Campus Resource Exchange & Renting System with Escrow Security & Live QR Handover"
    p2.font.size = Pt(16)
    p2.font.color.rgb = RGBColor(203, 213, 225) # Slate 300
    p2.font.name = "Arial"

    # Presenter Card Box
    card1 = slide1.shapes.add_shape(MSO_SHAPE.ROUNDED_RECTANGLE, Inches(1.0), Inches(4.3), Inches(5.4), Inches(2.3))
    card1.fill.solid()
    card1.fill.fore_color.rgb = RGBColor(30, 41, 59)
    card1.line.color.rgb = RGBColor(51, 65, 85)

    tf_c1 = card1.text_frame
    tf_c1.word_wrap = True
    tf_c1.margin_left = Inches(0.3)
    tf_c1.margin_top = Inches(0.25)

    pc1_0 = tf_c1.paragraphs[0]
    pc1_0.text = "STUDENT DEVELOPER"
    pc1_0.font.size = Pt(10)
    pc1_0.font.bold = True
    pc1_0.font.color.rgb = RGBColor(148, 163, 184)
    pc1_0.font.name = "Arial"

    pc1_1 = tf_c1.add_paragraph()
    pc1_1.text = "Ambuj Kumar Maurya"
    pc1_1.font.size = Pt(18)
    pc1_1.font.bold = True
    pc1_1.font.color.rgb = RGBColor(255, 255, 255)
    pc1_1.font.name = "Arial"

    pc1_2 = tf_c1.add_paragraph()
    pc1_2.text = "B.Tech Computer Science & Engineering\nFinal Project Showcase • Academic Session 2025–2026"
    pc1_2.font.size = Pt(12)
    pc1_2.font.color.rgb = RGBColor(203, 213, 225)
    pc1_2.font.name = "Arial"

    # Tech Stack Box
    card2 = slide1.shapes.add_shape(MSO_SHAPE.ROUNDED_RECTANGLE, Inches(6.7), Inches(4.3), Inches(5.6), Inches(2.3))
    card2.fill.solid()
    card2.fill.fore_color.rgb = RGBColor(30, 41, 59)
    card2.line.color.rgb = RGBColor(51, 65, 85)

    tf_c2 = card2.text_frame
    tf_c2.word_wrap = True
    tf_c2.margin_left = Inches(0.3)
    tf_c2.margin_top = Inches(0.25)

    pc2_0 = tf_c2.paragraphs[0]
    pc2_0.text = "CORE ARCHITECTURE & INFRASTRUCTURE"
    pc2_0.font.size = Pt(10)
    pc2_0.font.bold = True
    pc2_0.font.color.rgb = RGBColor(148, 163, 184)
    pc2_0.font.name = "Arial"

    pc2_1 = tf_c2.add_paragraph()
    pc2_1.text = "Full-Stack Cloud Implementation"
    pc2_1.font.size = Pt(16)
    pc2_1.font.bold = True
    pc2_1.font.color.rgb = RGBColor(255, 255, 255)
    pc2_1.font.name = "Arial"

    pc2_2 = tf_c2.add_paragraph()
    pc2_2.text = "• Frontend: React 19, Tailwind CSS v4, Vite\n• Backend: Django 4.2 REST, Python 3.12, PyJWT\n• Database: MongoDB Atlas Cloud Cluster\n• Services: Resend HTTPS Mail API, Vercel & Render"
    pc2_2.font.size = Pt(11.5)
    pc2_2.font.color.rgb = RGBColor(203, 213, 225)
    pc2_2.font.name = "Arial"

    # =========================================================================
    # SLIDE 2: Problem Statement & Campus Motivation
    # =========================================================================
    slide2 = prs.slides.add_slide(blank_layout)
    set_slide_background(slide2, LIGHT_BG)
    add_header(slide2, "Background & Motivation", "The Student Problem: High Costs & Zero Campus Trust", 
               "Understanding the economic and trust barriers college students face with specialized equipment.")

    # 3 Problem Columns
    problems = [
        ("1. Expensive Temporary Needs", 
         "• College students frequently require expensive tools for just a few days or weeks (e.g., scientific calculators, lab coats, drafters, DSLR cameras, sports kits, cycles).\n• Purchasing new gear for a single semester or exam causes unnecessary financial strain on students and parents.",
         RGBColor(239, 68, 68)), # Rose
        ("2. Vast Idle Hostel Assets", 
         "• Senior students already own these exact tools, but after coursework completes, the items sit idle in dorm rooms for 85–90% of the year.\n• No organized college marketplace exists to safely monetize or share these assets within the campus community.",
         RGBColor(245, 158, 11)), # Amber
        ("3. Breakdown of Informal Sharing", 
         "• Informal hostel borrowing often leads to damaged or unreturned equipment with zero financial recourse.\n• Asking friends for security deposits or late fees is socially awkward, creating fear of theft and reluctance to lend to peers.",
         RGBColor(99, 102, 241)) # Indigo
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
    # SLIDE 3: Proposed Solution - PeerGear Architecture
    # =========================================================================
    slide3 = prs.slides.add_slide(blank_layout)
    set_slide_background(slide3, LIGHT_BG)
    add_header(slide3, "System Solution", "PeerGear: Closed-Loop Trust & Automated Escrow", 
               "Four foundational pillars designed specifically to make peer equipment sharing safe, automated, and dispute-free.")

    solutions = [
        ("1. Closed-Campus Identity Verification",
         "• Two-tier validation: 6-digit email OTP verification + Student ID Card photo/PDF upload.\n• Administrative moderation dashboard confirms legitimate campus enrollment before lending permissions are granted."),
        ("2. Automated Escrow Security Deposit",
         "• 100% refundable security deposit is locked in escrow during checkout.\n• Owner is guaranteed compensation if equipment is damaged, while responsible borrowers receive an automated 100% instant refund upon verified return."),
        ("3. Dynamic QR Pass Handover & Return",
         "• In-person exchange is secured with a real-time dynamic QR code containing a cryptographically checked 4-digit handover OTP.\n• Owner scans the pass using their camera; borrower's screen auto-verifies and auto-closes in real time."),
        ("4. Community Demand Board & Smart Alerts",
         "• When students cannot find equipment, they post a request with category and daily budget.\n• Platform monitors new listings and automatically dispatches real-time alerts to students matching the category.")
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
    # SLIDE 4: Technology Stack & Cloud Infrastructure
    # =========================================================================
    slide4 = prs.slides.add_slide(blank_layout)
    set_slide_background(slide4, LIGHT_BG)
    add_header(slide4, "Technology Architecture", "Modern Full-Stack Cloud Implementation", 
               "Production-grade technologies selected for high performance, mobile responsiveness, and zero maintenance overhead.")

    tech_cards = [
        ("Client Layer (Frontend)", 
         "React 19 & Tailwind CSS v4", 
         "• Vite high-speed bundler for sub-second build times\n• In-memory SWR cache for 0ms instant tab navigation\n• HTML5 QR Code scanner & client canvas image compression\n• Responsive mobile-first design with bottom navigation",
         PRIMARY),
        ("Application Layer (Backend)", 
         "Django 4.2 REST & Python 3.12", 
         "• Stateless PyJWT token authentication & salted password hashing\n• BOLA / IDOR defense verifying user ownership on all endpoints\n• Resend HTTPS REST API mail dispatcher (Port 443)\n• Dual URL routing supporting both /api/ and direct endpoints",
         RGBColor(16, 185, 129)),
        ("Data & Cloud Infrastructure", 
         "MongoDB Atlas & Cloud Hosting", 
         "• MongoDB Atlas M0 Cluster (campusshare_db) with TLS certifi\n• PyMongo document modeling with compound text search indexes\n• Vercel Edge Network for frontend static distribution\n• Render Gunicorn container service for Python backend",
         RGBColor(217, 119, 6))
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
    # SLIDE 5: Database Modeling & MongoDB Schema Design
    # =========================================================================
    slide5 = prs.slides.add_slide(blank_layout)
    set_slide_background(slide5, LIGHT_BG)
    add_header(slide5, "Data Layer Modeling", "MongoDB Schema Design: Embedding vs. Referencing", 
               "Strategic NoSQL document modeling balancing atomicity, query performance, and relational integrity.")

    schemas = [
        ("users Collection", 
         "Stores campus credentials, verification tiers, and financial escrow balances.",
         "• _id: ObjectId, name, email, college_id (Unique Index)\n• password_hash: PBKDF2/SHA-256 salted hash\n• role: STUDENT | ADMIN, trust_score: float (5.0 default)\n• is_verified, verification_tier, wallet_balance: float\n• id_card_status: NOT_UPLOADED | PENDING | VERIFIED | REJECTED"),
        ("items Collection", 
         "Resource catalog with compound full-text search indexes.",
         "• _id: ObjectId, owner_id (Referenced ObjectId -> users)\n• title, category, description, tags: list[str]\n• rental_rate_per_day: float, security_deposit: float\n• pickup_location: str (e.g., 'Hostel Block B Room 302')\n• specifications: dict (Embedded key-value attributes)\n• images: list[str] (Sanitized image URLs / Base64)\n• Compound Text Index: title + description + tags"),
        ("rentals Collection", 
         "Transactional contract linking borrower, owner, item, and escrow status.",
         "• _id: ObjectId, item_id, owner_id, renter_id (Referenced IDs)\n• start_date, end_date, rental_days, rental_fee, security_deposit\n• status: BOOKED -> ACTIVE -> RETURN_REQUESTED -> COMPLETED\n• deposit_status: HELD -> REFUNDED | DISPUTED\n• handover_otp: 4-digit token (Hidden from owner before physical meetup)\n• condition_tracking: Embedded pickup & return inspection logs + photos"),
        ("Supporting Collections", 
         "Dedicated collections ensuring decoupled, resilient campus microservices.",
         "• item_requests: Student demand board (category, keyword, max_budget)\n• email_otps: 6-digit codes with 10-min TTL & intelligent deduplication\n• categories: Dynamic category registry with custom student tags\n• notifications: In-app real-time alert logs with unread counters")
    ]

    for i, (s_name, s_desc, s_fields) in enumerate(schemas):
        row = i // 2
        col = i % 2
        x = Inches(0.8 + col * 5.95)
        y = Inches(2.0 + row * 2.45)

        card = slide5.shapes.add_shape(MSO_SHAPE.ROUNDED_RECTANGLE, x, y, Inches(5.75), Inches(2.25))
        card.fill.solid()
        card.fill.fore_color.rgb = CARD_BG
        card.line.color.rgb = CARD_BORDER

        tf = card.text_frame
        tf.word_wrap = True
        tf.margin_left = Inches(0.25)
        tf.margin_top = Inches(0.2)
        tf.margin_right = Inches(0.25)

        p = tf.paragraphs[0]
        p.text = s_name
        p.font.size = Pt(14)
        p.font.bold = True
        p.font.color.rgb = PRIMARY_DARK
        p.font.name = "Arial"

        pd = tf.add_paragraph()
        pd.text = s_desc
        pd.font.size = Pt(10.5)
        pd.font.color.rgb = TEXT_MUTED
        pd.font.name = "Arial"
        pd.space_after = Pt(4)

        pf = tf.add_paragraph()
        pf.text = s_fields
        pf.font.size = Pt(10)
        pf.font.color.rgb = TEXT_MAIN
        pf.font.name = "Courier New"

    # =========================================================================
    # SLIDE 6: End-to-End Operational Workflow
    # =========================================================================
    slide6 = prs.slides.add_slide(blank_layout)
    set_slide_background(slide6, LIGHT_BG)
    add_header(slide6, "Operational Workflow", "Complete Peer-to-Peer Rental Lifecycle", 
               "Step-by-step transaction walkthrough from discovery to automated deposit return.")

    steps = [
        ("Step 1: Discover", "Browse catalog or search with instant category filters; inspect item condition, specs, and owner's verified trust badge."),
        ("Step 2: Book & Escrow", "Borrower selects rental dates; rental fee and refundable deposit are transferred into secure escrow balance."),
        ("Step 3: Meet at Hub", "Both students meet in person at the agreed pickup point (e.g. Campus Hostel Block, Room, or Common Center)."),
        ("Step 4: QR Scan", "Borrower presents dynamic QR pass; Owner scans with camera or verifies the 4-digit OTP."),
        ("Step 5: Active Rental", "Contract transitions to ACTIVE in real time; borrower's screen auto-closes and equipment condition is locked."),
        ("Step 6: Return & Refund", "Owner inspects returned item; 100% deposit is automatically refunded to borrower's wallet instantly.")
    ]

    for i, (st_title, st_body) in enumerate(steps):
        row = i // 3
        col = i % 3
        x = Inches(0.8 + col * 3.95)
        y = Inches(2.0 + row * 2.45)

        card = slide6.shapes.add_shape(MSO_SHAPE.ROUNDED_RECTANGLE, x, y, Inches(3.75), Inches(2.25))
        card.fill.solid()
        card.fill.fore_color.rgb = CARD_BG
        card.line.color.rgb = CARD_BORDER

        # Step Number Badge
        num_badge = slide6.shapes.add_shape(MSO_SHAPE.OVAL, x + Inches(0.25), y + Inches(0.2), Inches(0.35), Inches(0.35))
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
        tf.margin_left = Inches(0.7)
        tf.margin_top = Inches(0.2)
        tf.margin_right = Inches(0.25)

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
    # SLIDE 7: Real-World Engineering Challenges & Solutions
    # =========================================================================
    slide7 = prs.slides.add_slide(blank_layout)
    set_slide_background(slide7, LIGHT_BG)
    add_header(slide7, "Engineering Case Studies", "Technical Challenges Overcome During Development", 
               "Key production hurdles encountered and the technical architectural solutions engineered to resolve them.")

    challenges = [
        ("Cloud SMTP Firewall Port 587 Block",
         "The Problem:",
         "Render's free tier blocks outbound TCP ports 25, 465, and 587 to prevent spam abuse, causing standard Gmail SMTP connections to silently time out with ETIMEDOUT.",
         "The Architectural Solution:",
         "Integrated Resend's HTTPS REST API communicating over standard Port 443 (which cloud firewalls never block). Configured DNS TXT (DKIM), CNAME (SPF), and DMARC records on verified domain chatme.in for reliable sub-2s email OTP deliverability.",
         RGBColor(239, 68, 68)),
        ("Mobile 4K Camera Upload Crashes",
         "The Problem:",
         "Smartphone cameras take 12MP-48MP photos (4MB-15MB). Converting raw photos to Base64 exceeded Django's default 2.5MB DATA_UPLOAD_MAX_MEMORY_SIZE, truncating payloads and returning 'Invalid JSON body' 400 errors.",
         "The Architectural Solution:",
         "Engineered client-side HTML5 canvas compression in React before upload (auto-scales photos to max 1200px at 0.82 JPEG quality, reducing 10MB images to ~200KB in 0.1s). Increased server upload memory limit to 15MB as safety margin.",
         RGBColor(245, 158, 11)),
        ("Tab Navigation Latency & Skeletons",
         "The Problem:",
         "Conditional tab rendering ({activeTab === 'explore' && <ExplorePage />}) destroyed components on tab switch. Switching back unmounted state and triggered full-page loading skeletons every time.",
         "The Architectural Solution:",
         "Designed persistent tab mounting via CSS display toggles (keeping loaded components in DOM). Implemented in-memory SWR (Stale-While-Revalidate) cache store with concurrent Promise.all fetching, achieving instant 0ms tab navigation.",
         RGBColor(16, 185, 129))
    ]

    for i, (c_title, c_label1, c_prob, c_label2, c_sol, accent) in enumerate(challenges):
        x = Inches(0.8 + i * 3.95)
        box = slide7.shapes.add_shape(MSO_SHAPE.ROUNDED_RECTANGLE, x, Inches(2.0), Inches(3.75), Inches(4.8))
        box.fill.solid()
        box.fill.fore_color.rgb = CARD_BG
        box.line.color.rgb = CARD_BORDER

        top_bar = slide7.shapes.add_shape(MSO_SHAPE.RECTANGLE, x, Inches(2.0), Inches(3.75), Inches(0.1))
        top_bar.fill.solid()
        top_bar.fill.fore_color.rgb = accent
        top_bar.line.color.rgb = accent

        tf = box.text_frame
        tf.word_wrap = True
        tf.margin_left = Inches(0.25)
        tf.margin_top = Inches(0.25)
        tf.margin_right = Inches(0.25)

        p = tf.paragraphs[0]
        p.text = c_title
        p.font.size = Pt(13)
        p.font.bold = True
        p.font.color.rgb = TEXT_MAIN
        p.font.name = "Arial"
        p.space_after = Pt(8)

        p_l1 = tf.add_paragraph()
        p_l1.text = c_label1
        p_l1.font.size = Pt(10)
        p_l1.font.bold = True
        p_l1.font.color.rgb = accent
        p_l1.font.name = "Arial"

        p_p = tf.add_paragraph()
        p_p.text = c_prob
        p_p.font.size = Pt(10.5)
        p_p.font.color.rgb = TEXT_MUTED
        p_p.font.name = "Arial"
        p_p.space_after = Pt(8)

        p_l2 = tf.add_paragraph()
        p_l2.text = c_label2
        p_l2.font.size = Pt(10)
        p_l2.font.bold = True
        p_l2.font.color.rgb = PRIMARY
        p_l2.font.name = "Arial"

        p_s = tf.add_paragraph()
        p_s.text = c_sol
        p_s.font.size = Pt(10.5)
        p_s.font.color.rgb = TEXT_MAIN
        p_s.font.name = "Arial"

    # =========================================================================
    # SLIDE 8: Security & Campus Trust Architecture
    # =========================================================================
    slide8 = prs.slides.add_slide(blank_layout)
    set_slide_background(slide8, LIGHT_BG)
    add_header(slide8, "Security Engineering", "Security Defenses & Campus Trust Infrastructure", 
               "Multi-layered safeguards protecting student identity, financial balances, and database integrity.")

    sec_items = [
        ("BOLA / IDOR Authorization Guardrails",
         "• Strict ownership verification on every endpoint (e.g. only the legitimate item owner can verify pickup or return).\n• Renter's 4-digit handover OTP is completely redacted from the owner's API payload until in-person physical verification."),
        ("NoSQL Injection Defense",
         "• Sanitized inputs rejecting operator objects ($gt, $ne, $where) to prevent authentication bypass.\n• Type-strict validation enforcing strings and positive numbers across rates and deposits."),
        ("Salted Cryptographic Hashing",
         "• Passwords secured using PBKDF2 algorithm with SHA-256 and unique per-user cryptographic salts.\n• Defense against rainbow table and offline dictionary analysis."),
        ("Visual Trust Badges & Verified Transparency",
         "• Listing cards highlight 'Campus ID Verified' shield badges, student registration IDs, and hostel blocks.\n• Transparent community trust scores (1.0 to 5.0 stars) foster accountability across hostel communities.")
    ]

    for i, (s_title, s_body) in enumerate(sec_items):
        row = i // 2
        col = i % 2
        x = Inches(0.8 + col * 5.95)
        y = Inches(2.0 + row * 2.45)

        card = slide8.shapes.add_shape(MSO_SHAPE.ROUNDED_RECTANGLE, x, y, Inches(5.75), Inches(2.25))
        card.fill.solid()
        card.fill.fore_color.rgb = CARD_BG
        card.line.color.rgb = CARD_BORDER

        tf = card.text_frame
        tf.word_wrap = True
        tf.margin_left = Inches(0.3)
        tf.margin_top = Inches(0.25)
        tf.margin_right = Inches(0.3)

        p = tf.paragraphs[0]
        p.text = s_title
        p.font.size = Pt(14)
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
    # SLIDE 9: Conclusion & Future Scope (Dark Theme)
    # =========================================================================
    slide9 = prs.slides.add_slide(blank_layout)
    set_slide_background(slide9, DARK_BG)

    # Accent Top Stripe
    stripe9 = slide9.shapes.add_shape(MSO_SHAPE.RECTANGLE, Inches(0), Inches(0), Inches(13.333), Inches(0.15))
    stripe9.fill.solid()
    stripe9.fill.fore_color.rgb = ACCENT_GREEN
    stripe9.line.color.rgb = ACCENT_GREEN

    # Header Box
    th_box = slide9.shapes.add_textbox(Inches(1.0), Inches(0.7), Inches(11.3), Inches(1.2))
    tf_th = th_box.text_frame
    tf_th.word_wrap = True
    p9_tag = tf_th.paragraphs[0]
    p9_tag.text = "PROJECT SUMMARY & ROADMAP"
    p9_tag.font.size = Pt(11)
    p9_tag.font.bold = True
    p9_tag.font.color.rgb = RGBColor(52, 211, 153) # Emerald 400
    p9_tag.font.name = "Arial"
    p9_tag.space_after = Pt(6)

    p9_t = tf_th.add_paragraph()
    p9_t.text = "Conclusion & Future Scalability"
    p9_t.font.size = Pt(26)
    p9_t.font.bold = True
    p9_t.font.color.rgb = RGBColor(255, 255, 255)
    p9_t.font.name = "Arial"

    # Left Box: Key Achievements
    c_left = slide9.shapes.add_shape(MSO_SHAPE.ROUNDED_RECTANGLE, Inches(1.0), Inches(2.2), Inches(5.4), Inches(4.5))
    c_left.fill.solid()
    c_left.fill.fore_color.rgb = RGBColor(30, 41, 59)
    c_left.line.color.rgb = RGBColor(51, 65, 85)

    tf_l = c_left.text_frame
    tf_l.word_wrap = True
    tf_l.margin_left = Inches(0.35)
    tf_l.margin_top = Inches(0.3)
    tf_l.margin_right = Inches(0.35)

    pl_0 = tf_l.paragraphs[0]
    pl_0.text = "KEY PROJECT OUTCOMES"
    pl_0.font.size = Pt(11)
    pl_0.font.bold = True
    pl_0.font.color.rgb = RGBColor(52, 211, 153)
    pl_0.font.name = "Arial"
    pl_0.space_after = Pt(10)

    pl_1 = tf_l.add_paragraph()
    pl_1.text = "• Fully Functional Campus Platform: Successfully deployed live full-stack system connecting students securely.\n\n• Solves Real Campus Friction: Eliminates unnecessary personal expenditure on temporary equipment while monetizing idle dorm gear.\n\n• Verified Trust & Reliability: Zero payment defaults via automated deposit escrow, sub-2s email OTPs, and real-time QR handover auto-close.\n\n• Mobile-Optimized Performance: 0ms cached page transitions and client-side canvas compression for smooth smartphone use."
    pl_1.font.size = Pt(12)
    pl_1.font.color.rgb = RGBColor(226, 232, 240)
    pl_1.font.name = "Arial"

    # Right Box: Future Roadmap
    c_right = slide9.shapes.add_shape(MSO_SHAPE.ROUNDED_RECTANGLE, Inches(6.8), Inches(2.2), Inches(5.5), Inches(4.5))
    c_right.fill.solid()
    c_right.fill.fore_color.rgb = RGBColor(30, 41, 59)
    c_right.line.color.rgb = RGBColor(51, 65, 85)

    tf_r = c_right.text_frame
    tf_r.word_wrap = True
    tf_r.margin_left = Inches(0.35)
    tf_r.margin_top = Inches(0.3)
    tf_r.margin_right = Inches(0.35)

    pr_0 = tf_r.paragraphs[0]
    pr_0.text = "FUTURE ENHANCEMENTS"
    pr_0.font.size = Pt(11)
    pr_0.font.bold = True
    pr_0.font.color.rgb = RGBColor(129, 140, 248)
    pr_0.font.name = "Arial"
    pr_0.space_after = Pt(10)

    pr_1 = tf_r.add_paragraph()
    pr_1.text = "1. Campus UPI Dynamic QR Integration\nDirect in-app UPI QR payment intents for instantaneous wallet deposit top-ups without third-party gateways.\n\n2. Geofenced Smart Campus Lockers\nIntegration with IoT hostel drop-boxes enabling contactless 24/7 equipment handover and return.\n\n3. AI-Driven Visual Condition Analysis\nComputer vision comparison between pre-pickup and post-return photos to automatically identify scratches or damage differentials.\n\n4. Multi-College Federation\nCross-campus federated access allowing student exchange across affiliated colleges within the same university city."
    pr_1.font.size = Pt(12)
    pr_1.font.color.rgb = RGBColor(226, 232, 240)
    pr_1.font.name = "Arial"

    prs.save(output_path)
    print(f"Presentation successfully saved to: {output_path}")

if __name__ == "__main__":
    create_presentation()
