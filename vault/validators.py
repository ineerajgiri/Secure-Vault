"""Upload validation helpers (size + basic type checks)."""

from __future__ import annotations

import os

from rest_framework.exceptions import ValidationError

# 30 MiB hard limit for uploaded files
MAX_UPLOAD_BYTES = 30 * 1024 * 1024

ALLOWED_EXTENSIONS = {
    ".pdf",
    ".png",
    ".jpg",
    ".jpeg",
    ".gif",
    ".webp",
    ".txt",
    ".csv",
    ".doc",
    ".docx",
    ".xls",
    ".xlsx",
    ".zip",
}

ALLOWED_CONTENT_TYPES = {
    "application/pdf",
    "image/png",
    "image/jpeg",
    "image/gif",
    "image/webp",
    "text/plain",
    "text/csv",
    "application/msword",
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    "application/vnd.ms-excel",
    "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    "application/zip",
    "application/octet-stream",  # some clients send this; extension still checked
    "application/x-zip-compressed",  # Windows browsers often send this for .zip
}


def validate_uploaded_file(uploaded_file) -> None:
    """Raise ValidationError if size or type is not allowed."""
    size = getattr(uploaded_file, "size", None)
    if size is None:
        raise ValidationError({"file": "Could not determine file size."})
    if size <= 0:
        raise ValidationError({"file": "Empty files are not allowed."})
    if size > MAX_UPLOAD_BYTES:
        raise ValidationError(
            {"file": f"File too large. Maximum size is {MAX_UPLOAD_BYTES // (1024 * 1024)}MB."}
        )

    filename = getattr(uploaded_file, "name", "") or ""
    _, ext = os.path.splitext(filename.lower())
    if ext not in ALLOWED_EXTENSIONS:
        raise ValidationError(
            {
                "file": (
                    f"File type '{ext or 'unknown'}' is not allowed. "
                    f"Allowed: {', '.join(sorted(ALLOWED_EXTENSIONS))}"
                )
            }
        )

    content_type = (getattr(uploaded_file, "content_type", None) or "").lower()
    if content_type and content_type not in ALLOWED_CONTENT_TYPES:
        raise ValidationError(
            {"file": f"Content type '{content_type}' is not allowed."}
        )


def parse_tags(raw) -> list:
    """Accept JSON list string, comma-separated string, or already-a-list."""
    import json

    if raw is None or raw == "":
        return []
    if isinstance(raw, list):
        return [str(t).strip() for t in raw if str(t).strip()]
    if isinstance(raw, str):
        text = raw.strip()
        if text.startswith("["):
            try:
                data = json.loads(text)
            except json.JSONDecodeError as exc:
                raise ValidationError({"tags": "tags must be valid JSON or comma-separated."}) from exc
            if not isinstance(data, list):
                raise ValidationError({"tags": "tags JSON must be a list."})
            return [str(t).strip() for t in data if str(t).strip()]
        return [part.strip() for part in text.split(",") if part.strip()]
    raise ValidationError({"tags": "Invalid tags format."})
