#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""Merge cover + body PDFs and add metadata."""

from pypdf import PdfReader, PdfWriter
import os

BASE = '/home/z/my-project/download'
COVER = os.path.join(BASE, 'andy_report_cover.pdf')
BODY = os.path.join(BASE, 'andy_report_body.pdf')
OUTPUT = os.path.join(BASE, 'Andy_JP_Property_ML_Report.pdf')

def main():
    writer = PdfWriter()

    # Append cover
    reader_cover = PdfReader(COVER)
    writer.append_pages_from_reader(reader_cover)

    # Append body
    reader_body = PdfReader(BODY)
    writer.append_pages_from_reader(reader_body)

    # Add metadata
    writer.add_metadata({
        '/Title': '日本物業投資評估報告',
        '/Author': 'PZC Group',
        '/Subject': 'ML V2 機率加權分析 - 客戶Andy',
        '/Creator': 'PZC Group Risk Modelling',
        '/Producer': 'PZC Analytics Engine',
    })

    with open(OUTPUT, 'wb') as f:
        writer.write(f)

    total_pages = len(reader_cover.pages) + len(reader_body.pages)
    print(f'Merged PDF: {OUTPUT}')
    print(f'Total pages: {total_pages} (cover: {len(reader_cover.pages)}, body: {len(reader_body.pages)})')

if __name__ == '__main__':
    main()
