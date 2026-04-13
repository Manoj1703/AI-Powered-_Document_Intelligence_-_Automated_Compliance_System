from __future__ import annotations
# Service for handling file uploads and text extraction from various document formats.
from io import BytesIO # Standard libraries for handling binary data and file paths.
from typing import BinaryIO # Third-party libraries for document parsing.

import docx
from pypdf import PdfReader


ALLOWED_EXTENSIONS = {".pdf", ".docx", ".txt"}

# Helper function to read all bytes from a file-like object without altering its position.
def _read_all_bytes(file_obj: BinaryIO) -> bytes:
    file_obj.seek(0)
    content = file_obj.read()
    file_obj.seek(0)
    return content

# Main function to extract text based on file extension. Supports PDF, DOCX, and TXT formats.
def extract_text(file) -> str:
    filename = (file.filename or "").lower()

    if filename.endswith(".pdf"):
        file_bytes = _read_all_bytes(file.file)
        reader = PdfReader(BytesIO(file_bytes))
        text_parts: list[str] = []
        for page in reader.pages:
            page_text = page.extract_text() or ""
            if page_text.strip():
                text_parts.append(page_text)
        return "\n".join(text_parts)
# For DOCX files, we read the bytes and use python-docx to extract text from paragraphs.
    if filename.endswith(".docx"):
        file_bytes = _read_all_bytes(file.file)
        doc = docx.Document(BytesIO(file_bytes))
        return "\n".join([p.text for p in doc.paragraphs if p.text.strip()])
# For TXT files, 
    file_bytes = _read_all_bytes(file.file)
    try:
        return file_bytes.decode("utf-8")# If UTF-8 decoding fails, we try Latin-1, which can handle a wider range of byte sequences without errors.
    except UnicodeDecodeError:
        return file_bytes.decode("latin-1", errors="ignore")# If the file extension is not supported, we raise an error.
