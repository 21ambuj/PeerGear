import docx
import os

doc_path = r"D:\DjangoMongoPRO\PeerGear_MongoDB_Project_Report_12Pages.docx"
print("File Size:", round(os.path.getsize(doc_path) / 1024, 2), "KB")

doc = docx.Document(doc_path)
print("Total Paragraphs:", len(doc.paragraphs))
print("Total Tables:", len(doc.tables))

page_breaks = 0
for p in doc.paragraphs:
    for r in p.runs:
        if "w:br" in r._r.xml and 'type="page"' in r._r.xml:
            page_breaks += 1

print("Explicit Page Breaks:", page_breaks)
print("Total Structured Pages:", page_breaks + 1)
