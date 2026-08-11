"""
Standalone Fernet encryption helpers.

This module only deals with bytes in / bytes out. It does not touch models,
views, S3, or HTTP. Upload/download layers will call these functions later.
"""

from __future__ import annotations

from cryptography.fernet import Fernet, InvalidToken
from decouple import UndefinedValueError, config


def _load_fernet() -> Fernet:
    """
    Build a Fernet instance from FERNET_KEY in the environment/.env.

    Security: the key never lives in source code — only in env config.
    """
    try:
        key = config("FERNET_KEY")
    except UndefinedValueError as exc:
        raise RuntimeError(
            "FERNET_KEY is missing from the environment/.env. "
            "Generate one with: python generate_key.py"
        ) from exc

    if not key or not str(key).strip():
        raise RuntimeError(
            "FERNET_KEY is empty. Generate one with: python generate_key.py"
        )

    # .env values are strings; Fernet accepts url-safe base64-encoded 32-byte keys.
    try:
        return Fernet(key.encode("utf-8") if isinstance(key, str) else key)
    except (ValueError, TypeError) as exc:
        raise RuntimeError(
            "FERNET_KEY has an invalid format. It must be a url-safe "
            "base64-encoded 32-byte key from Fernet.generate_key(). "
            "Generate one with: python generate_key.py"
        ) from exc


def encrypt_file(file_bytes: bytes) -> bytes:
    """Encrypt plain file bytes. Returns Fernet token bytes (safe to store in S3)."""
    if not isinstance(file_bytes, (bytes, bytearray)):
        raise TypeError("file_bytes must be bytes")
    return _load_fernet().encrypt(bytes(file_bytes))


def decrypt_file(encrypted_bytes: bytes) -> bytes:
    """Decrypt Fernet token bytes back to the original plain file bytes."""
    if not isinstance(encrypted_bytes, (bytes, bytearray)):
        raise TypeError("encrypted_bytes must be bytes")
    try:
        return _load_fernet().decrypt(bytes(encrypted_bytes))
    except InvalidToken as exc:
        # Wrong key, corrupted ciphertext, or non-Fernet data
        raise ValueError(
            "Decryption failed: ciphertext is invalid, tampered, "
            "or was encrypted with a different FERNET_KEY."
        ) from exc
