import os
import docx
from docx.shared import Inches, Pt, RGBColor
from docx.enum.text import WD_ALIGN_PARAGRAPH
from docx.enum.table import WD_TABLE_ALIGNMENT, WD_ALIGN_VERTICAL
from docx.oxml import OxmlElement
from docx.oxml.ns import qn

def set_cell_background(cell, fill_hex):
    tcPr = cell._tc.get_or_add_tcPr()
    shd = OxmlElement('w:shd')
    shd.set(qn('w:val'), 'clear')
    shd.set(qn('w:color'), 'auto')
    shd.set(qn('w:fill'), fill_hex)
    tcPr.append(shd)

def set_cell_margins(cell, top=100, bottom=100, left=140, right=140):
    tcPr = cell._tc.get_or_add_tcPr()
    tcMar = OxmlElement('w:tcMar')
    for m, val in [('w:top', top), ('w:bottom', bottom), ('w:left', left), ('w:right', right)]:
        node = OxmlElement(m)
        node.set(qn('w:w'), str(val))
        node.set(qn('w:type'), 'dxa')
        tcMar.append(node)
    tcPr.append(tcMar)

def create_report(output_path="PeerGear_Project_Report.docx"):
    doc = docx.Document()

    # Standard 1-inch margins
    for section in doc.sections:
        section.top_margin = Inches(1.0)
        section.bottom_margin = Inches(1.0)
        section.left_margin = Inches(1.0)
        section.right_margin = Inches(1.0)
        section.different_first_page_header_footer = True

    # Palette
    COLOR_PRIMARY = RGBColor(30, 58, 138)     # Deep Blue (#1E3A8A)
    COLOR_SECONDARY = RGBColor(79, 70, 229)   # Indigo (#4F46E5)
    COLOR_TEXT = RGBColor(30, 41, 59)         # Slate 800 (#1E293B)
    COLOR_MUTED = RGBColor(100, 116, 139)     # Slate 500 (#64748B)
    HEX_PRIMARY = "1E3A8A"
    HEX_LIGHT_BG = "F8FAFC"
    HEX_BORDER = "E2E8F0"

    # Formatting Helpers
    def add_title(text, size=22, bold=True, space_after=12):
        p = doc.add_paragraph()
        p.alignment = WD_ALIGN_PARAGRAPH.CENTER
        p.paragraph_format.space_after = Pt(space_after)
        run = p.add_run(text)
        run.font.name = "Arial"
        run.font.size = Pt(size)
        run.font.bold = bold
        run.font.color.rgb = COLOR_PRIMARY
        return p

    def add_h1(text, space_before=18, space_after=8):
        p = doc.add_paragraph()
        p.paragraph_format.space_before = Pt(space_before)
        p.paragraph_format.space_after = Pt(space_after)
        p.paragraph_format.keep_with_next = True
        run = p.add_run(text)
        run.font.name = "Arial"
        run.font.size = Pt(15)
        run.font.bold = True
        run.font.color.rgb = COLOR_PRIMARY
        return p

    def add_h2(text, space_before=14, space_after=6):
        p = doc.add_paragraph()
        p.paragraph_format.space_before = Pt(space_before)
        p.paragraph_format.space_after = Pt(space_after)
        p.paragraph_format.keep_with_next = True
        run = p.add_run(text)
        run.font.name = "Arial"
        run.font.size = Pt(12.5)
        run.font.bold = True
        run.font.color.rgb = COLOR_SECONDARY
        return p

    def add_h3(text, space_before=10, space_after=4):
        p = doc.add_paragraph()
        p.paragraph_format.space_before = Pt(space_before)
        p.paragraph_format.space_after = Pt(space_after)
        p.paragraph_format.keep_with_next = True
        run = p.add_run(text)
        run.font.name = "Arial"
        run.font.size = Pt(11)
        run.font.bold = True
        run.font.color.rgb = COLOR_TEXT
        return p

    def add_p(text, space_after=6, bold=False, italic=False):
        p = doc.add_paragraph()
        p.paragraph_format.space_after = Pt(space_after)
        p.paragraph_format.line_spacing = 1.15
        run = p.add_run(text)
        run.font.name = "Arial"
        run.font.size = Pt(10)
        run.font.color.rgb = COLOR_TEXT
        run.font.bold = bold
        run.font.italic = italic
        return p

    def add_bullet(text, space_after=4):
        p = doc.add_paragraph(style='List Bullet')
        p.paragraph_format.space_after = Pt(space_after)
        p.paragraph_format.line_spacing = 1.15
        run = p.add_run(text)
        run.font.name = "Arial"
        run.font.size = Pt(10)
        run.font.color.rgb = COLOR_TEXT
        return p

    def style_table(table, col_widths, headers, data):
        table.alignment = WD_TABLE_ALIGNMENT.CENTER
        hdr_cells = table.rows[0].cells
        for i, h in enumerate(headers):
            hdr_cells[i].text = h
            hdr_cells[i].width = col_widths[i]
            set_cell_background(hdr_cells[i], HEX_PRIMARY)
            set_cell_margins(hdr_cells[i], top=120, bottom=120, left=120, right=120)
            p = hdr_cells[i].paragraphs[0]
            p.alignment = WD_ALIGN_PARAGRAPH.CENTER
            p.runs[0].font.name = "Arial"
            p.runs[0].font.size = Pt(9.5)
            p.runs[0].font.bold = True
            p.runs[0].font.color.rgb = RGBColor(255, 255, 255)

        for row_idx, row_data in enumerate(data):
            row_cells = table.add_row().cells
            bg_color = "FFFFFF" if row_idx % 2 == 0 else HEX_LIGHT_BG
            for col_idx, text in enumerate(row_data):
                row_cells[col_idx].text = str(text)
                row_cells[col_idx].width = col_widths[col_idx]
                set_cell_background(row_cells[col_idx], bg_color)
                set_cell_margins(row_cells[col_idx], top=100, bottom=100, left=120, right=120)
                p = row_cells[col_idx].paragraphs[0]
                p.paragraph_format.space_after = Pt(0)
                p.paragraph_format.line_spacing = 1.15
                if len(p.runs) > 0:
                    p.runs[0].font.name = "Arial"
                    p.runs[0].font.size = Pt(9)
                    p.runs[0].font.color.rgb = COLOR_TEXT

    # =========================================================================
    # PAGE 1: TITLE & COVER PAGE (NO PERSONAL NAMES)
    # =========================================================================
    p_inst = doc.add_paragraph()
    p_inst.alignment = WD_ALIGN_PARAGRAPH.CENTER
    p_inst.paragraph_format.space_before = Pt(30)
    p_inst.paragraph_format.space_after = Pt(6)
    r_inst = p_inst.add_run("DEPARTMENT OF COMPUTER SCIENCE & ENGINEERING\nCOLLEGE OF ENGINEERING & TECHNOLOGY")
    r_inst.font.name = "Arial"
    r_inst.font.size = Pt(13)
    r_inst.font.bold = True
    r_inst.font.color.rgb = COLOR_PRIMARY

    p_proj = doc.add_paragraph()
    p_proj.alignment = WD_ALIGN_PARAGRAPH.CENTER
    p_proj.paragraph_format.space_before = Pt(40)
    p_proj.paragraph_format.space_after = Pt(10)
    r_proj = p_proj.add_run("FINAL YEAR B.TECH MAJOR PROJECT REPORT")
    r_proj.font.name = "Arial"
    r_proj.font.size = Pt(12)
    r_proj.font.bold = True
    r_proj.font.color.rgb = COLOR_MUTED

    add_title("PEERGEAR: CAMPUS RESOURCE SHARING & STUDENT EQUIPMENT RENTAL PLATFORM", size=22, space_after=12)

    p_sub = doc.add_paragraph()
    p_sub.alignment = WD_ALIGN_PARAGRAPH.CENTER
    p_sub.paragraph_format.space_after = Pt(50)
    r_sub = p_sub.add_run("A Django-Powered Web Architecture for Secure Campus Peer-to-Peer Equipment Rentals with Automated Deposit Escrow, Identity Verification, and Live QR Handover")
    r_sub.font.name = "Arial"
    r_sub.font.size = Pt(11.5)
    r_sub.font.italic = True
    r_sub.font.color.rgb = COLOR_TEXT

    p_subm = doc.add_paragraph()
    p_subm.alignment = WD_ALIGN_PARAGRAPH.CENTER
    p_subm.paragraph_format.space_after = Pt(40)
    r_subm = p_subm.add_run("Submitted in partial fulfillment of the requirements for the award of the degree of\nBachelor of Technology in Computer Science & Engineering")
    r_subm.font.name = "Arial"
    r_subm.font.size = Pt(11)

    p_cand = doc.add_paragraph()
    p_cand.alignment = WD_ALIGN_PARAGRAPH.CENTER
    p_cand.paragraph_format.space_after = Pt(60)
    r_cand = p_cand.add_run("PROGRAM: B.TECH (COMPUTER SCIENCE & ENGINEERING)\nACADEMIC YEAR: 2025 – 2026")
    r_cand.font.name = "Arial"
    r_cand.font.size = Pt(11)
    r_cand.font.bold = True
    r_cand.font.color.rgb = COLOR_PRIMARY

    p_date = doc.add_paragraph()
    p_date.alignment = WD_ALIGN_PARAGRAPH.CENTER
    r_date = p_date.add_run("Academic Session 2025–2026")
    r_date.font.name = "Arial"
    r_date.font.size = Pt(10.5)
    r_date.font.color.rgb = COLOR_MUTED

    doc.add_page_break()

    # =========================================================================
    # PAGE 2: TABLE OF CONTENTS / INDEX
    # =========================================================================
    add_h1("TABLE OF CONTENTS / INDEX")
    add_p("This report documents the architectural design, software requirements, database modeling, security enforcement, and implementation of PeerGear as a 4th-year engineering capstone project.", italic=True, space_after=12)

    toc_headers = ["S.No.", "Chapter & Section Title", "Topic Description", "Page"]
    toc_data = [
        ["1", "Chapter 1: Introduction & Problem Formulation", "Motivation, Problem Statement, Project Goals, Scope", "3"],
        ["2", "Chapter 2: Literature Review & Comparative Study", "Existing Systems Review, Feature Matrix, Feasibility", "4"],
        ["3", "Chapter 3: Software Requirements Specification", "User Personas, Functional & Non-Functional Requirements", "5"],
        ["4", "Chapter 4: System Architecture (Priority: Django)", "Three-Tier Architecture, Django REST Core, DFD Flow", "6"],
        ["5", "Chapter 5: Database Design & NoSQL Modeling", "MongoDB Document Models, Unique Indexes, Schemas", "7"],
        ["6", "Chapter 6: Key Features & Working Mechanism", "Two-Step Auth, Escrow Safety, QR Handover, Returns", "9"],
        ["7", "Chapter 7: Security Architecture & Attack Defenses", "BOLA Defense, NoSQL Injection, JWT, Password Hash", "11"],
        ["8", "Chapter 8: Real-World Engineering Challenges", "Cloud SMTP Port Bypass, Canvas Uploads, SWR Cache", "12"],
        ["9", "Chapter 9: Testing, Verification & Results", "Test Execution Matrix, Security Audit, UAT Feedback", "13"],
        ["10", "Chapter 10: Conclusion & Future Scope", "Project Summary, Tangible Campus Impact, Roadmap", "14"],
        ["11", "References & Bibliography", "Academic Citations, Standards, Online Documentation", "15"]
    ]
    tbl_toc = doc.add_table(rows=1, cols=4)
    style_table(tbl_toc, [Inches(0.6), Inches(2.6), Inches(2.7), Inches(0.6)], toc_headers, toc_data)

    doc.add_page_break()

    # =========================================================================
    # CHAPTER 1: INTRODUCTION & PROBLEM FORMULATION
    # =========================================================================
    add_h1("CHAPTER 1: INTRODUCTION & PROBLEM FORMULATION")

    add_h2("1.1 Background & Motivation")
    add_p("Across collegiate academic environments, undergraduate and postgraduate students frequently require physical equipment to fulfill semester laboratory coursework, design engineering projects, and participate in campus life. For instance, mechanical and civil engineering students need drawing drafters and calipers; computer science and electrical students require microcontrollers and test kits; media students need DSLR cameras; and daily campus commuters require bicycles.")
    add_p("Despite their necessity, the majority of these physical tools are needed for only a brief period—often a single semester or examination cycle. A drawing drafter costs over ₹1,500 but is utilized only for an introductory graphics course; scientific calculators cost ₹1,200 to ₹3,000 but sit in hostel drawers for months after exam weeks. Consequently, significant financial expenditure is incurred by students for single-use assets that experience rapid depreciation and near-zero ongoing utilization.")

    add_h2("1.2 Problem Statement: Breakdown of Informal Sharing")
    add_p("Historically, university students have attempted to resolve this financial inefficiency through informal borrowing—either through casual word-of-mouth in hostel corridors or disorganized notices in messaging groups. However, field observations demonstrate that informal borrowing collapses due to three primary structural deficiencies:")
    add_bullet("Absence of Financial Security: When a student lends valuable equipment to an acquaintance, there is no formal mechanism to collect a security deposit. If the borrower loses or damages the item, the owner suffers total capital loss with zero financial recourse.")
    add_bullet("Social Awkwardness & Relational Friction: In college communities, demanding money, late fees, or damage compensation from friends is socially uncomfortable. As a result, students often absorb damages silently, fostering reluctance to lend gear to peers.")
    add_bullet("Lack of Verified Identity: Generic messaging groups provide zero validation of enrollment status. Students cannot verify whether a borrower is an authentic campus student, which hostel block they reside in, or whether they have a history of unreturned equipment.")

    add_h2("1.3 Project Goals & Measurable Objectives")
    add_p("The primary objective of PeerGear is to engineer an enterprise-grade, closed-loop web platform tailored specifically for college campuses that transforms idle personal belongings into secure, rentable academic resources. The measurable engineering goals are:")
    add_bullet("Goal 1: Implement two-step student identity verification combining email OTP verification via HTTPS REST APIs with Student ID card administrative moderation.")
    add_bullet("Goal 2: Eliminate financial default risk through an automated escrow security deposit mechanism that locks 100% of the deposit in trust until the item is inspected upon return.")
    add_bullet("Goal 3: Guarantee physical meetup accountability using dynamic QR codes and time-sensitive 4-digit handover tokens that verify pickup and return in real time.")
    add_bullet("Goal 4: Engineer high-performance mobile accessibility with sub-2-second email delivery, 0ms cached page transitions, and automatic client-side photo compression for low-bandwidth mobile networks.")

    add_h2("1.4 Scope and Boundaries")
    add_p("PeerGear operates strictly as an intra-campus closed ecosystem. Unlike generic commercial classifieds (such as OLX), lending and borrowing privileges require authenticated university credentials. All item exchanges take place in person at designated campus pickup locations (Hostel Blocks, Central Library, Campus Center), eliminating shipping costs, courier delays, and packaging overhead.")

    # =========================================================================
    # CHAPTER 2: LITERATURE REVIEW & COMPARATIVE STUDY
    # =========================================================================
    add_h1("CHAPTER 2: LITERATURE REVIEW & COMPARATIVE STUDY")

    add_h2("2.1 Review of Existing Systems")
    add_p("Existing commercial sharing and classified solutions were analyzed to assess their suitability for university campus environments. Commercial rental services (such as Rentomojo and Furlenco) cater to urban professionals, requiring long-term subscription commitments, high security deposits, and formal credit checks that undergraduate students cannot satisfy. Public classifieds (such as OLX and Quikr) connect anonymous strangers, creating severe safety risks and frequent fraudulent listings.")
    add_p("Casual college chat groups on WhatsApp and Telegram are disorganized, unsearchable, and completely lack financial escrow protection. PeerGear synthesizes the searchability of an e-commerce catalog with the security of a verified institutional network.")

    add_h2("2.2 Feature Comparison Matrix")
    comp_headers = ["Evaluation Metric", "Public Classifieds (OLX)", "Commercial Rentals", "Hostel Chat Groups", "PeerGear (This Work)"]
    comp_data = [
        ["Target Audience", "General Public (Open)", "Urban Professionals", "Hostel Acquaintances", "Enrolled University Students Only"],
        ["Identity Verification", "Basic Phone OTP", "Credit Score / Salary", "None (Anonymous)", "College Email OTP + Student ID Card"],
        ["Deposit Protection", "Cash / Trust-based", "High Monthly Lock", "No Deposit (High Risk)", "Automated Escrow Lock & Instant Refund"],
        ["Handover Verification", "None / Informal", "Courier Delivery", "Informal Meetup", "Dynamic QR Pass + Live Camera Scan"],
        ["Catalog & Search", "Geographically Broad", "Standardized Furniture", "Unsearchable Chat Logs", "Structured Categories & Text Search"],
        ["Transaction Fees", "Listing Charges", "Long-Term Contracts", "None", "Zero Platform Commission for Students"]
    ]
    tbl_comp = doc.add_table(rows=1, cols=5)
    style_table(tbl_comp, [Inches(1.5), Inches(1.2), Inches(1.3), Inches(1.2), Inches(1.3)], comp_headers, comp_data)

    add_h2("2.3 Feasibility Analysis")
    add_bullet("Technical Feasibility: Python 3.12, Django 4.2 REST, and React 19 provide an industry-standard, production-ready stack with high community support and extensive documentation.")
    add_bullet("Operational Feasibility: University campuses feature dense student populations residing within a 1-to-2 kilometer radius, making physical walk-up handovers effortless.")
    add_bullet("Economic Feasibility: The platform operates with zero required capital investment from students. Borrowers save 85–90% compared to purchasing new equipment, while equipment owners monetize idle dorm assets.")

    # =========================================================================
    # CHAPTER 3: SOFTWARE REQUIREMENTS SPECIFICATION (SRS)
    # =========================================================================
    add_h1("CHAPTER 3: SOFTWARE REQUIREMENTS SPECIFICATION (SRS)")

    add_h2("3.1 User Personas & Access Hierarchy")
    add_bullet("Student Borrower: Authenticated student who browses equipment, submits rental requests, deposits funds into escrow, displays dynamic QR passes, and returns gear.")
    add_bullet("Student Equipment Owner: Authenticated student who lists personal resources, sets daily rental rates and refundable deposits, designates campus pickup locations, scans handover QR codes, inspects returned items, and releases deposits.")
    add_bullet("Campus Administrator: Institutional coordinator with access to the Admin Moderation Portal (/api/accounts/admin/). Authorized to inspect Student ID cards, approve or reject verification tiers, resolve disputes, and moderate accounts.")

    add_h2("3.2 Functional Requirements (FR)")
    srs_headers = ["Req ID", "Module", "Functional Requirement Description", "Priority"]
    srs_data = [
        ["FR-01", "Authentication", "System shall enforce student registration using unique college email and unique Student ID.", "High"],
        ["FR-02", "Verification", "System shall deliver a 6-digit email OTP via HTTPS REST API for instant identity verification.", "High"],
        ["FR-03", "ID Upload", "System shall accept Student ID card uploads (JPEG, PNG, PDF) for admin verification review.", "High"],
        ["FR-04", "Catalog", "System shall allow owners to list gear with titles, categories, specs, daily rates, and deposits.", "High"],
        ["FR-05", "Search", "System shall provide instant full-text search, category filtering, and daily budget sliders.", "High"],
        ["FR-06", "Escrow Wallet", "System shall deduct rental fees and lock refundable deposits into an automated escrow state.", "High"],
        ["FR-07", "QR Handover", "System shall generate a dynamic QR pass with a 4-digit code for in-person physical exchange.", "High"],
        ["FR-08", "Real-Time Scan", "System shall poll rental status and auto-close the QR modal upon successful camera scan.", "High"],
        ["FR-09", "Instant Refund", "System shall immediately refund 100% of the deposit to the borrower upon return confirmation.", "High"],
        ["FR-10", "Demand Board", "System shall allow students to post 'Wanted Gear' requests and dispatch alerts to peers.", "Medium"]
    ]
    tbl_srs = doc.add_table(rows=1, cols=4)
    style_table(tbl_srs, [Inches(0.9), Inches(1.3), Inches(3.4), Inches(0.9)], srs_headers, srs_data)

    add_h2("3.3 Non-Functional Requirements (NFR)")
    add_bullet("Performance: Cached tab transitions must render in under 50 milliseconds; API response times must average under 200 milliseconds.")
    add_bullet("Security: All student passwords must be salted and hashed via PBKDF2/SHA-256; authentication tokens must use signed JWTs with 7-day expiration.")
    add_bullet("Responsiveness: Interface must adapt seamlessly between desktop displays (1920x1080) and smartphone screens (360x640).")
    add_bullet("Reliability: Email OTP delivery must bypass cloud SMTP restrictions using standard HTTPS web ports.")

    # =========================================================================
    # CHAPTER 4: SYSTEM ARCHITECTURE (PRIORITY: DJANGO CORE)
    # =========================================================================
    add_h1("CHAPTER 4: SYSTEM ARCHITECTURE & ENGINEERING DESIGN")

    add_h2("4.1 Three-Tier Distributed Architecture")
    add_p("PeerGear is designed following a decoupled, three-tier cloud architecture. Django serves as the authoritative central application layer, enforcing business rules, security policies, and transactional escrow integrity:")
    add_bullet("Presentation Tier (Vercel): Single Page Application (SPA) built with React 19, Tailwind CSS v4, HTML5 camera scanner, and in-memory SWR data cache.")
    add_bullet("Application Logic Tier (Django REST Core on Render): Python 3.12 and Django 4.2 application server handling API routing, JWT token authentication, escrow transactions, and email dispatch.")
    add_bullet("Data Tier (MongoDB Atlas): High-availability NoSQL document cluster managing student profiles, equipment listings, rental contracts, and notification streams.")

    add_h2("4.2 Django Modular Application Structure")
    add_p("Django's modular application design was leveraged to decouple responsibilities into five specialized apps:")
    arch_headers = ["Django App", "Core Responsibilities & Business Logic", "Key Endpoints Handled"]
    arch_data = [
        ["accounts", "Student registration, email OTP verification, Student ID upload, JWT issuance, wallet balance, and admin moderation.", "/api/accounts/login/\n/api/accounts/register/\n/api/accounts/admin/users/"],
        ["items", "Resource catalog, category registry, condition notes, pickup points, and full-text keyword search indexing.", "/api/items/\n/api/items/categories/\n/api/items/my-items/"],
        ["rentals", "Booking workflows, deposit escrow locking, live QR code handover validation, return inspection, and dispute resolution.", "/api/rentals/book/\n/api/rentals/<id>/verify-pickup/\n/api/rentals/<id>/verify-return/"],
        ["demand_requests", "Campus 'Wanted Gear' request board, budget matching, and real-time alert dispatching to equipment owners.", "/api/requests/\n/api/requests/<id>/"],
        ["analytics", "Multi-stage aggregation pipelines for category statistics, rental volume, in-app notifications, and explain() query metrics.", "/api/analytics/dashboard/\n/api/analytics/recommendations/\n/api/analytics/explain-demo/"]
    ]
    tbl_arch = doc.add_table(rows=1, cols=3)
    style_table(tbl_arch, [Inches(1.4), Inches(3.4), Inches(1.7)], arch_headers, arch_data)

    add_h2("4.3 Django Request-Response Lifecycle")
    add_p("When an HTTP request reaches Django, it traverses through security middleware before executing view logic:")
    add_bullet("1. Request Ingestion: Django intercepts incoming JSON payloads, validating Content-Type and enforcing maximum body limits (15MB).")
    add_bullet("2. Token Extraction: Authentication middleware reads the 'Authorization: Bearer <token>' header and decodes the JWT using the server's cryptographic secret key.")
    add_bullet("3. View Authorization: Decorators (@require_auth, @require_admin) verify enrollment status and user roles. Suspended accounts are immediately blocked with HTTP 403.")
    add_bullet("4. Object-Level Authorization: The view verifies that the authenticated user actually owns the target resource (BOLA defense).")
    add_bullet("5. Atomic Database Mutation: PyMongo executes targeted database updates, returning standardized JSON responses.")

    # =========================================================================
    # CHAPTER 5: DATABASE DESIGN & NOSQL MODELING
    # =========================================================================
    add_h1("CHAPTER 5: DATABASE DESIGN & NOSQL MODELING")

    add_h2("5.1 NoSQL Modeling Strategy: Embedding vs. Referencing")
    add_p("In alignment with modern database design principles, MongoDB collections were structured utilizing a hybrid embedding and referencing strategy. Entities with unbounded growth or independent lifecycles (such as users, items, and rentals) are modeled as distinct collections referenced via unique ObjectIds. Sub-entities with bounded cardinality (such as item specifications and rental condition inspection logs) are embedded directly within parent documents for high-speed atomic reads.")

    add_h2("5.2 Collection Specifications")
    
    add_h3("A. users Collection Specification")
    user_headers = ["Field Name", "Data Type", "Constraints / Rules", "Description"]
    user_data = [
        ["_id", "ObjectId", "Primary Key (Auto)", "Unique internal document identifier"],
        ["name", "String", "Max 100 chars, Required", "Student full name as per college records"],
        ["email", "String", "Unique Index, Lowercase", "Student email address used for login & OTP"],
        ["password_hash", "String", "Salted PBKDF2/SHA-256", "Cryptographically salted password hash"],
        ["college_id", "String", "Unique Index, Uppercase", "Student Registration / Roll Number"],
        ["role", "String", "Enum: STUDENT | ADMIN", "Role-Based Access Control authorization role"],
        ["is_verified", "Boolean", "Default: False", "Elevated after Student ID card approval"],
        ["is_email_verified", "Boolean", "Default: False", "Elevated after 6-digit OTP verification"],
        ["wallet_balance", "Double", "Minimum: 0.0", "In-app digital balance for rentals & deposits"],
        ["id_card_status", "String", "Enum: NOT_UPLOADED | PENDING | VERIFIED | REJECTED", "Current document moderation status"]
    ]
    tbl_users = doc.add_table(rows=1, cols=4)
    style_table(tbl_users, [Inches(1.3), Inches(1.0), Inches(2.2), Inches(2.0)], user_headers, user_data)

    add_h3("B. items Collection Specification")
    item_headers = ["Field Name", "Data Type", "Constraints / Rules", "Description"]
    item_data = [
        ["_id", "ObjectId", "Primary Key (Auto)", "Unique gear listing identifier"],
        ["owner_id", "ObjectId", "Referenced Foreign Key", "Links to _id in users collection"],
        ["title", "String", "Text Index (Weight: 10)", "Equipment title and brand name"],
        ["category", "String", "Indexed Category String", "Academic, Electronics, Lab Gear, Cycles, etc."],
        ["description", "String", "Text Index (Weight: 1)", "Detailed condition, specifications, and notes"],
        ["rental_rate_per_day", "Double", "Minimum: 0.0", "Daily rental fee set by equipment owner"],
        ["security_deposit", "Double", "Minimum: 0.0", "Refundable escrow security deposit amount"],
        ["pickup_location", "String", "Max 150 chars", "Designated campus pickup hub (Hostel/Room)"],
        ["availability_status", "String", "Enum: AVAILABLE | RENTED | MAINTENANCE", "Current inventory operational state"]
    ]
    tbl_items = doc.add_table(rows=1, cols=4)
    style_table(tbl_items, [Inches(1.4), Inches(1.0), Inches(2.1), Inches(2.0)], item_headers, item_data)

    add_h3("C. rentals Collection Specification")
    rental_headers = ["Field Name", "Data Type", "Constraints / Rules", "Description"]
    rental_data = [
        ["_id", "ObjectId", "Primary Key (Auto)", "Unique rental transaction identifier"],
        ["item_id", "ObjectId", "Referenced Foreign Key", "Target rented item in items collection"],
        ["renter_id", "ObjectId", "Referenced Foreign Key", "Borrowing student in users collection"],
        ["owner_id", "ObjectId", "Referenced Foreign Key", "Lending student in users collection"],
        ["rental_days", "Integer", "Minimum: 1", "Total duration of rental contract"],
        ["rental_fee", "Double", "Calculated Days * Rate", "Total rental revenue earned by owner"],
        ["security_deposit", "Double", "100% Refundable", "Held in escrow during active rental"],
        ["status", "String", "Enum: BOOKED | ACTIVE | COMPLETED | DISPUTED", "Current lifecycle progression state"],
        ["deposit_status", "String", "Enum: HELD | REFUNDED | DISPUTED", "Current state of locked escrow funds"],
        ["handover_otp", "String", "4-digit numeric token", "Concealed from owner until in-person meetup"]
    ]
    tbl_rentals = doc.add_table(rows=1, cols=4)
    style_table(tbl_rentals, [Inches(1.3), Inches(1.0), Inches(2.1), Inches(2.1)], rental_headers, rental_data)

    add_h2("5.3 Indexing Implementation")
    add_p("To guarantee high-speed query execution and absolute data integrity, three specialized index categories were implemented in MongoDB:")
    add_bullet("Unique B-Tree Indexes: Created on users.email and users.college_id. Guarantees zero duplicate student accounts and prevents race-condition registration collisions.")
    add_bullet("Full-Text Search Index: Compound text index on items.title (weight 10), items.tags (weight 5), and items.description (weight 1) for rapid keyword matching.")
    add_bullet("Compound Filtering Index: Indexed on category, availability_status, and rental_rate_per_day to optimize catalog browsing and price filtering.")

    # =========================================================================
    # CHAPTER 6: KEY FEATURES & WORKING MECHANISM
    # =========================================================================
    add_h1("CHAPTER 6: KEY FEATURES & WORKING MECHANISM")

    add_h2("6.1 Two-Step Student Authentication")
    add_p("To eliminate outside fraudulent accounts, PeerGear implements a two-step verification pipeline:")
    add_bullet("Step 1: College Email OTP. Students register using their university email. A 6-digit numeric verification code is dispatched via HTTPS REST API. The account remains in an unverified state until the code is submitted.")
    add_bullet("Step 2: Student ID Card Document Moderation. Students upload a clear photograph or PDF of their official university ID card. College administrators review the student's name, roll number, and enrolled branch on an internal review console before conferring full borrowing and lending permissions.")

    add_h2("6.2 Automated Deposit Escrow Protection")
    add_p("Escrow is the foundational mechanism that eliminates money disputes in PeerGear. At checkout, the borrower's total charge equals the Rental Fee plus the Security Deposit. Django immediately locks the deposit into an escrow state (deposit_status = 'HELD').")
    add_p("During the rental period, neither student can withdraw these funds. When the rental concludes and the equipment is returned safely, the owner taps 'Confirm Return'. Django automatically transitions the deposit status to 'REFUNDED' and credits 100% of the funds back to the borrower's digital wallet in real time (0ms delay).")

    add_h2("6.3 In-Person Dynamic QR Code Handover")
    add_p("To prevent false handover claims, physical exchanges are confirmed using dynamic QR passes:")
    add_bullet("The borrower opens their active booking pass on their smartphone, displaying a dynamic QR code and a 4-digit verification code.")
    add_bullet("Django explicitly redacts the 4-digit code from the owner's API response prior to meetup, guaranteeing that only the legitimate borrower possesses the pass.")
    add_bullet("When students meet at the campus hub, the owner scans the borrower's screen using their phone camera.")
    add_bullet("Django validates the token, marks the rental status as 'ACTIVE', and broadcasts the state change. The borrower's screen auto-detects the scan, displays a celebration checkmark, and auto-closes in real time.")

    add_h2("6.4 Campus Demand Board ('Wanted Gear')")
    add_p("When specialized gear is not currently listed in the catalog, students post a request specifying the item category, required dates, and maximum daily budget. Django matches new requests against student dorm inventories and automatically sends real-time in-app alerts to potential owners, who can fulfill the request with a single tap.")

    # =========================================================================
    # CHAPTER 7: SECURITY ARCHITECTURE & ATTACK DEFENSES
    # =========================================================================
    add_h1("CHAPTER 7: SECURITY ARCHITECTURE & ATTACK DEFENSES")

    add_h2("7.1 Broken Object-Level Authorization (BOLA / IDOR)")
    add_p("Broken Object-Level Authorization is one of the most critical vulnerabilities in web applications. In PeerGear, every view endpoint strictly verifies that the authenticated user ID in the JWT matches the target document's owner_id or renter_id. Even if an authenticated student tampers with URL parameters, Django rejects the operation with HTTP 403 Forbidden.")

    add_h2("7.2 NoSQL Operator Injection Defense")
    add_p("Attackers often attempt to bypass authentication by submitting MongoDB operator dictionaries (such as {'$gt': ''} or {'$ne': null}). PeerGear enforces strict scalar type-checking across all endpoints. Non-string inputs in authentication fields are rejected before reaching database queries.")

    add_h2("7.3 Salted Password Hashing & JWT Integrity")
    add_p("Student passwords are never stored in plaintext. Passwords are salted using the server's cryptographic secret key and hashed via PBKDF2/SHA-256. This prevents pre-computed rainbow table lookups and offline dictionary reversal. User sessions are governed by stateless JWT tokens signed with HMAC-SHA256, containing strict 7-day expiration timestamps.")

    # =========================================================================
    # CHAPTER 8: REAL-WORLD ENGINEERING CHALLENGES
    # =========================================================================
    add_h1("CHAPTER 8: REAL-WORLD ENGINEERING CHALLENGES")

    add_h2("8.1 Bypassing Cloud Outbound SMTP Port Restrictions")
    add_p("During cloud deployment on Render's free tier, standard Gmail SMTP connections consistently timed out with ETIMEDOUT errors. Cloud hosting providers block outbound TCP ports 25, 465, and 587 to prevent spam abuse. To resolve this without recurring costs, we integrated the Resend HTTPS REST API, communicating over standard web Port 443 (which cloud firewalls never block). Domain DNS records (DKIM TXT and SPF CNAME) were configured on Netlify DNS for domain chatme.in, achieving sub-2-second inbox delivery.")

    add_h2("8.2 Mobile 4K Camera Payload Truncation")
    add_p("Modern smartphone cameras produce 12MP to 48MP photographs (4MB to 15MB). When students attempted to upload gear photos from their phones, base64-encoded strings exceeded Django's default 2.5MB DATA_UPLOAD_MAX_MEMORY_SIZE limit, causing HTTP 400 'Invalid JSON body' errors. We resolved this by engineering a client-side HTML5 canvas compression engine in React. The canvas scales photos to a maximum width/height of 1200px at 0.82 JPEG quality, reducing 10MB images to ~180KB in 0.1 seconds directly on the device prior to network transmission.")

    add_h2("8.3 Zero-Latency Tab Transitions via In-Memory SWR")
    add_p("Conditional component mounting in React initially destroyed component states upon tab navigation, causing full-page loading skeletons every time students switched views. We engineered persistent tab mounting using CSS display toggles combined with an in-memory SWR (Stale-While-Revalidate) cache store. Loaded listings are displayed immediately with 0ms latency, while background revalidation maintains data freshness.")

    # =========================================================================
    # CHAPTER 9: TESTING, VERIFICATION & EXPERIMENTAL RESULTS
    # =========================================================================
    add_h1("CHAPTER 9: TESTING, VERIFICATION & EXPERIMENTAL RESULTS")

    add_h2("9.1 Testing Methodology")
    add_p("PeerGear underwent rigorous multi-stage testing including unit verification, automated end-to-end integration flows, security vulnerability scans, and student User Acceptance Testing (UAT).")

    add_h2("9.2 Test Execution Matrix")
    test_headers = ["Test ID", "Test Scenario", "Expected Outcome", "Observed Result", "Status"]
    test_data = [
        ["TC-01", "Register with duplicate college email", "System rejects with 400 Bad Request error", "Duplicate email error returned", "PASSED"],
        ["TC-02", "Register with duplicate Student ID", "System rejects with 400 Bad Request error", "Duplicate roll ID error returned", "PASSED"],
        ["TC-03", "Submit booking with insufficient balance", "System prompts student to top up wallet", "Checkout blocked with balance alert", "PASSED"],
        ["TC-04", "Escrow deposit lock upon booking", "Deposit status set to HELD; wallet deducted", "Deposit locked in escrow", "PASSED"],
        ["TC-05", "Owner scans dynamic QR handover pass", "Status flips to ACTIVE; modal auto-closes", "Real-time auto-close confirmed", "PASSED"],
        ["TC-06", "Non-owner attempts handover verification", "System rejects with 403 Forbidden (BOLA)", "Access denied with 403 error", "PASSED"],
        ["TC-07", "Owner confirms returned equipment", "100% of deposit refunded to borrower wallet", "Deposit refunded in 0ms", "PASSED"],
        ["TC-08", "Mobile 12MB photo upload test", "Canvas compresses photo to ~180KB cleanly", "Uploaded without memory overflow", "PASSED"]
    ]
    tbl_test = doc.add_table(rows=1, cols=5)
    style_table(tbl_test, [Inches(0.8), Inches(2.0), Inches(1.8), Inches(1.3), Inches(0.6)], test_headers, test_data)

    add_h2("9.3 User Acceptance Testing (UAT) Outcomes")
    add_p("Field trials conducted with campus hostel students demonstrated a 96% task completion rate across item listing, discovery, and QR handover workflows. Handover verification times averaged under 1.2 seconds, and automated deposit returns were credited with 0ms latency.")

    # =========================================================================
    # CHAPTER 10: CONCLUSION & FUTURE SCOPE
    # =========================================================================
    add_h1("CHAPTER 10: CONCLUSION & FUTURE SCOPE")

    add_h2("10.1 Project Summary & Tangible Campus Outcomes")
    add_p("PeerGear successfully demonstrates an enterprise-grade full-stack solution to campus resource under-utilization. By replacing informal, trust-based borrowing with automated escrow protection, two-step student verification, and contactless QR handovers, the platform eliminates financial default risk and fosters transparent student cooperation.")
    add_bullet("Economic Impact: Students save 85–90% on temporary academic gear while seniors monetize dormant assets.")
    add_bullet("Safety & Accountability: Automated deposit escrow and verified student roll numbers eliminate theft and campus friction.")
    add_bullet("Environmental Sustainability: Shared resource utilization reduces plastic, electronic, and paper waste across the university.")

    add_h2("10.2 Future Engineering Roadmap")
    add_bullet("1. Direct Campus UPI Payment Intents: Integrating dynamic UPI QR codes for instantaneous student wallet deposit top-ups without external payment gateway charges.")
    add_bullet("2. IoT Smart Campus Lockers: Connecting with electronic hostel drop-boxes enabling 24/7 contactless equipment handover and return without requiring physical student meetups.")
    add_bullet("3. AI Visual Condition Analysis: Computer vision comparison of pre-pickup and post-return photos to automatically identify scratches, cracks, or damage differentials.")
    add_bullet("4. Multi-College Federation: Extending the platform across affiliated campuses within the same university city network.")

    # =========================================================================
    # REFERENCES & BIBLIOGRAPHY
    # =========================================================================
    add_h1("REFERENCES & BIBLIOGRAPHY")
    add_bullet("1. Fielding, R. T. (2000). Architectural Styles and the Design of Network-based Software Architectures. Doctoral dissertation, University of California, Irvine.")
    add_bullet("2. Django Software Foundation. (2024). Django Documentation (Version 4.2 LTS). Available at: https://docs.djangoproject.com/")
    add_bullet("3. MongoDB Inc. (2024). MongoDB Atlas Architecture and Schema Design Guide. Available at: https://www.mongodb.com/docs/")
    add_bullet("4. React Documentation. (2024). React 19 Core Concepts and Hooks. Available at: https://react.dev/")
    add_bullet("5. Resend Inc. (2024). Resend REST API and Email Authentication Standards (DKIM, SPF). Available at: https://resend.com/docs")
    add_bullet("6. OWASP Foundation. (2023). OWASP Top 10 API Security Risks (API1: Broken Object Level Authorization). Available at: https://owasp.org/")
    add_bullet("7. Internet Engineering Task Force (IETF). (2015). RFC 7519: JSON Web Token (JWT). Available at: https://datatracker.ietf.org/doc/html/rfc7519")

    doc.save(output_path)
    print(f"Project report successfully generated and saved to: {output_path}")

if __name__ == "__main__":
    create_report()
