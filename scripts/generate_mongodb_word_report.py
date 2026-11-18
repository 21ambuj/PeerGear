"""
PeerGear: Comprehensive Academic Word Report Generator for MongoDB Subject
Generates a formal 15-page academic project report in .docx format.
Adheres strictly to academic guidelines:
- Page 1: Clean Cover Page with Candidate Name, Reg No, Roll No, Course, University
- 15 fully-articulated chapters covering NoSQL theory, BSON modeling, schemas,
  indexes, execution profiling, aggregation pipelines, security, transactions,
  backend (Django/PyMongo) and frontend (React/Vite).
- No watermarks, no unnecessary clutter. Professional typography and tables.
"""

import os
import sys
import docx
from docx.shared import Inches, Pt, RGBColor
from docx.enum.text import WD_ALIGN_PARAGRAPH
from docx.enum.table import WD_TABLE_ALIGNMENT
from docx.oxml import parse_xml
from docx.oxml.ns import nsdecls

OUTPUT_FILE = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), "CampusShare_PeerGear_MongoDB_Project_Report.docx")

# Color Palette Constants
COLOR_MONGO_DARK = "00684A"      # MongoDB Deep Green
COLOR_MONGO_LIGHT = "F0FDF4"     # Light Green tint
COLOR_SLATE_DARK = "0F172A"      # Slate 900
COLOR_SLATE_MED = "334155"       # Slate 700
COLOR_SLATE_LIGHT = "F8FAFC"     # Slate 50 (Code background)
COLOR_BORDER = "CBD5E1"          # Slate 300
COLOR_WHITE = "FFFFFF"

def set_cell_background(cell, hex_color):
    """Sets background shading of a table cell."""
    shading_elm = parse_xml(f'<w:shd {nsdecls("w")} w:fill="{hex_color}"/>')
    cell._tc.get_or_add_tcPr().append(shading_elm)

def set_cell_margins(cell, top=100, bottom=100, left=150, right=150):
    """Sets internal padding for a table cell in dxa (1 pt = 20 dxa)."""
    tcPr = cell._tc.get_or_add_tcPr()
    tcMar = parse_xml(f'<w:tcMar {nsdecls("w")}><w:top w:w="{top}" w:type="dxa"/><w:bottom w:w="{bottom}" w:type="dxa"/><w:left w:w="{left}" w:type="dxa"/><w:right w:w="{right}" w:type="dxa"/></w:tcMar>')
    tcPr.append(tcMar)

def add_styled_heading(doc, text, level):
    """Adds a professionally formatted heading."""
    p = doc.add_paragraph()
    run = p.add_run(text)
    run.bold = True
    p.paragraph_format.keep_with_next = True
    
    if level == 1:
        run.font.name = "Calibri"
        run.font.size = Pt(16.5)
        run.font.color.rgb = RGBColor(0x00, 0x68, 0x4A)
        p.paragraph_format.space_before = Pt(14)
        p.paragraph_format.space_after = Pt(5)
    elif level == 2:
        run.font.name = "Calibri"
        run.font.size = Pt(12.5)
        run.font.color.rgb = RGBColor(0x0F, 0x17, 0x2A)
        p.paragraph_format.space_before = Pt(9)
        p.paragraph_format.space_after = Pt(3)
    elif level == 3:
        run.font.name = "Calibri"
        run.font.size = Pt(11)
        run.font.color.rgb = RGBColor(0x33, 0x41, 0x55)
        p.paragraph_format.space_before = Pt(7)
        p.paragraph_format.space_after = Pt(2)
    return p

def add_body_paragraph(doc, text, bold_prefix="", space_after=4):
    """Adds a standard body paragraph with 1.15 line spacing."""
    p = doc.add_paragraph()
    p.paragraph_format.line_spacing = 1.15
    p.paragraph_format.space_after = Pt(space_after)
    if bold_prefix:
        r_pre = p.add_run(bold_prefix)
        r_pre.font.name = "Calibri"
        r_pre.font.size = Pt(10)
        r_pre.bold = True
        r_pre.font.color.rgb = RGBColor(0x0F, 0x17, 0x2A)
    
    r_body = p.add_run(text)
    r_body.font.name = "Calibri"
    r_body.font.size = Pt(10)
    r_body.font.color.rgb = RGBColor(0x1E, 0x29, 0x3B)
    return p

def add_code_block(doc, code_str, caption=""):
    """Adds a clean, syntax-friendly code block inside a bordered container."""
    if caption:
        p_cap = doc.add_paragraph()
        p_cap.paragraph_format.space_before = Pt(4)
        p_cap.paragraph_format.space_after = Pt(1)
        r_cap = p_cap.add_run(f"Code Listing: {caption}")
        r_cap.font.name = "Calibri"
        r_cap.font.size = Pt(8.5)
        r_cap.bold = True
        r_cap.font.color.rgb = RGBColor(0x00, 0x68, 0x4A)

    table = doc.add_table(rows=1, cols=1)
    table.alignment = WD_TABLE_ALIGNMENT.CENTER
    table.autofit = False
    
    cell = table.cell(0, 0)
    cell.width = Inches(6.5)
    set_cell_background(cell, COLOR_SLATE_LIGHT)
    set_cell_margins(cell, top=80, bottom=80, left=120, right=120)
    
    tcPr = cell._tc.get_or_add_tcPr()
    borders = parse_xml(f'<w:tcBorders {nsdecls("w")}><w:top w:val="single" w:sz="4" w:space="0" w:color="{COLOR_BORDER}"/><w:left w:val="single" w:sz="18" w:space="0" w:color="{COLOR_MONGO_DARK}"/><w:bottom w:val="single" w:sz="4" w:space="0" w:color="{COLOR_BORDER}"/><w:right w:val="single" w:sz="4" w:space="0" w:color="{COLOR_BORDER}"/></w:tcBorders>')
    tcPr.append(borders)
    
    cp = cell.paragraphs[0]
    cp.paragraph_format.line_spacing = 1.0
    cp.paragraph_format.space_after = Pt(0)
    c_run = cp.add_run(code_str.strip())
    c_run.font.name = "Consolas"
    c_run.font.size = Pt(8)
    c_run.font.color.rgb = RGBColor(0x0F, 0x17, 0x2A)
    
    p_spacer = doc.add_paragraph()
    p_spacer.paragraph_format.space_before = Pt(0)
    p_spacer.paragraph_format.space_after = Pt(2.5)

def add_callout(doc, text, title="ARCHITECTURAL PRINCIPLE"):
    """Adds a stylized callout box for core academic points."""
    table = doc.add_table(rows=1, cols=1)
    table.alignment = WD_TABLE_ALIGNMENT.CENTER
    table.autofit = False
    
    cell = table.cell(0, 0)
    cell.width = Inches(6.5)
    set_cell_background(cell, COLOR_MONGO_LIGHT)
    set_cell_margins(cell, top=90, bottom=90, left=130, right=130)
    
    tcPr = cell._tc.get_or_add_tcPr()
    borders = parse_xml(f'<w:tcBorders {nsdecls("w")}><w:top w:val="none"/><w:left w:val="single" w:sz="24" w:space="0" w:color="{COLOR_MONGO_DARK}"/><w:bottom w:val="none"/><w:right w:val="none"/></w:tcBorders>')
    tcPr.append(borders)
    
    cp = cell.paragraphs[0]
    cp.paragraph_format.line_spacing = 1.15
    cp.paragraph_format.space_after = Pt(1)
    r_tit = cp.add_run(f"KEY CONCEPT: {title}\n")
    r_tit.font.name = "Calibri"
    r_tit.font.size = Pt(9.5)
    r_tit.bold = True
    r_tit.font.color.rgb = RGBColor(0x00, 0x68, 0x4A)
    
    r_txt = cp.add_run(text)
    r_txt.font.name = "Calibri"
    r_txt.font.size = Pt(9)
    r_txt.font.color.rgb = RGBColor(0x1E, 0x29, 0x3B)
    
    p_spacer = doc.add_paragraph()
    p_spacer.paragraph_format.space_before = Pt(0)
    p_spacer.paragraph_format.space_after = Pt(2.5)

def add_table_data(doc, headers, rows_data, col_widths=None):
    """Creates a styled table with dark green header and alternating row colors."""
    table = doc.add_table(rows=len(rows_data) + 1, cols=len(headers))
    table.alignment = WD_TABLE_ALIGNMENT.CENTER
    table.autofit = False
    
    # Header Row
    hdr_cells = table.rows[0].cells
    for i, title in enumerate(headers):
        hdr_cells[i].text = title
        set_cell_background(hdr_cells[i], COLOR_MONGO_DARK)
        set_cell_margins(hdr_cells[i], top=80, bottom=80, left=100, right=100)
        p = hdr_cells[i].paragraphs[0]
        p.paragraph_format.space_after = Pt(0)
        p.alignment = WD_ALIGN_PARAGRAPH.LEFT
        for run in p.runs:
            run.font.name = "Calibri"
            run.font.size = Pt(8.5)
            run.font.bold = True
            run.font.color.rgb = RGBColor(0xFF, 0xFF, 0xFF)
            
    # Data Rows
    for r_idx, row in enumerate(rows_data):
        row_cells = table.rows[r_idx + 1].cells
        bg_col = COLOR_SLATE_LIGHT if r_idx % 2 == 1 else COLOR_WHITE
        for c_idx, val in enumerate(row):
            row_cells[c_idx].text = str(val)
            set_cell_background(row_cells[c_idx], bg_col)
            set_cell_margins(row_cells[c_idx], top=60, bottom=60, left=100, right=100)
            p = row_cells[c_idx].paragraphs[0]
            p.paragraph_format.space_after = Pt(0)
            p.alignment = WD_ALIGN_PARAGRAPH.LEFT
            for run in p.runs:
                run.font.name = "Calibri"
                run.font.size = Pt(8)
                run.font.color.rgb = RGBColor(0x1E, 0x29, 0x3B)
                
    if col_widths:
        for row in table.rows:
            for idx, width in enumerate(col_widths):
                row.cells[idx].width = Inches(width)

    p_spacer = doc.add_paragraph()
    p_spacer.paragraph_format.space_before = Pt(0)
    p_spacer.paragraph_format.space_after = Pt(2.5)

print("Framework initialized. Generating full 15-page document...")
