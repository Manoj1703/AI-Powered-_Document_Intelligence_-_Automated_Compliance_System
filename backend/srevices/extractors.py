# This module provides functions to extract text content from various file formats, including PDF, DOCX, Excel, CSV, and TXT. It uses libraries like pdfplumber for PDFs, python-docx for Word documents, and pandas for Excel and CSV files. The main function `extract_text_by_extension` determines the appropriate extraction method based on the file extension and returns the extracted text as a string.
from __future__ import annotations

import pandas as pd
import pdfplumber
from docx import Document

ALLOWED_EXTENSIONS = {".pdf", ".docx", ".xlsx", ".xls", ".csv", ".txt"}

# Extract text from PDF files using pdfplumber
def extract_pdf(file_path: str) -> str:
    text_parts: list[str] = []
    with pdfplumber.open(file_path) as pdf:
        for page in pdf.pages:
            page_text = page.extract_text() or ""
            if page_text.strip():
                text_parts.append(page_text)
    return "\n".join(text_parts)

# For DOCX files, we read the bytes and use python-docx 
def extract_docx(file_path: str) -> str:
    doc = Document(file_path)
    return "\n".join([para.text for para in doc.paragraphs if para.text.strip()])

# For Excel files, we read all sheets so multi-sheet workbooks are fully analyzed. 
def extract_excel(file_path: str) -> str:
    # Read all sheets so multi-sheet workbooks are fully analyzed.
    workbook = pd.read_excel(file_path, sheet_name=None)
    sheet_text: list[str] = []

    for sheet_name, frame in workbook.items():
        if frame.empty:
            continue
        sheet_text.append(f"Sheet: {sheet_name}")
        sheet_text.append(frame.fillna("").to_string(index=False))# fillna("") to replace NaN values with empty strings 

    return "\n\n".join(sheet_text)


def extract_csv(file_path: str) -> str:
    frame = pd.read_csv(file_path)
    return frame.fillna("").to_string(index=False)


def extract_txt(file_path: str) -> str:
    try:
        with open(file_path, "r", encoding="utf-8") as handle:#encoding
            return handle.read()
    except UnicodeDecodeError:
        with open(file_path, "r", encoding="latin-1", errors="ignore") as handle:#Latin-1 wider range of byte .
            return handle.read()
        

def extract_text_by_extension(file_path: str, extension: str) -> str:
    ext = extension.lower()
#extraction
    if ext == ".pdf":
        return extract_pdf(file_path)
    if ext == ".docx":
        return extract_docx(file_path)
    if ext in {".xlsx", ".xls"}:
        return extract_excel(file_path)
    if ext == ".csv":
        return extract_csv(file_path)
    if ext == ".txt":
        return extract_txt(file_path)

    raise ValueError(f"Unsupported file extension: {extension}")
