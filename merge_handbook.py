#!/usr/bin/env python3
"""Merge cover + body PDFs into final handbook."""
from pypdf import PdfReader, PdfWriter, Transformation

A4_W, A4_H = 595.28, 841.89

def normalize_page_to_a4(page):
    box = page.mediabox
    w, h = float(box.width), float(box.height)
    if abs(w - A4_W) > 2 or abs(h - A4_H) > 2:
        sx, sy = A4_W / w, A4_H / h
        page.add_transformation(Transformation().scale(sx=sx, sy=sy))
        page.mediabox.lower_left = (0, 0)
        page.mediabox.upper_right = (A4_W, A4_H)
    return page

def insert_cover(cover_pdf, body_pdf, output_pdf):
    writer = PdfWriter()
    cover_page = PdfReader(cover_pdf).pages[0]
    writer.add_page(normalize_page_to_a4(cover_page))
    for page in PdfReader(body_pdf).pages:
        writer.add_page(normalize_page_to_a4(page))
    writer.add_metadata({
        '/Title': 'PZC 家族辦公室專業認可證書畢業生客戶開拓手冊',
        '/Author': 'Z.ai',
        '/Creator': 'Z.ai',
        '/Subject': '家族辦公室畢業生客戶開拓實戰指南'
    })
    with open(output_pdf, 'wb') as f:
        writer.write(f)

insert_cover(
    '/home/z/my-project/download/pzc_cover.pdf',
    '/home/z/my-project/download/pzc_handbook_body.pdf',
    '/home/z/my-project/download/PZC_Graduate_Client_Acquisition_Handbook.pdf'
)
print("Final PDF merged successfully!")
