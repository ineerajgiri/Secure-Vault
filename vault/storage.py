"""
Standalone S3 storage helpers.

Uploads/downloads raw bytes to a configured bucket. This module does not
encrypt, touch Django models, or talk to HTTP views — Step 4 will wire those.
"""

from __future__ import annotations

import boto3
from botocore.exceptions import BotoCoreError, ClientError
from decouple import UndefinedValueError, config


class StorageError(Exception):
    """Raised when an S3 operation fails or configuration is invalid."""


def _require_env(name: str) -> str:
    try:
        value = config(name)
    except UndefinedValueError as exc:
        raise StorageError(
            f"{name} is missing from the environment/.env. "
            "Set AWS credentials and bucket settings before using storage."
        ) from exc
    if not value or not str(value).strip():
        raise StorageError(f"{name} is empty in the environment/.env.")
    return str(value).strip()


def _get_s3_client():
    """Build a boto3 S3 client from .env — never hardcode credentials."""
    return boto3.client(
        "s3",
        aws_access_key_id=_require_env("AWS_ACCESS_KEY_ID"),
        aws_secret_access_key=_require_env("AWS_SECRET_ACCESS_KEY"),
        region_name=_require_env("AWS_S3_REGION"),
    )


def _bucket_name() -> str:
    return _require_env("AWS_S3_BUCKET_NAME")


def upload_to_s3(encrypted_bytes: bytes, s3_key: str) -> bool:
    """
    Upload bytes to S3 at s3_key.

    Returns True on success. Raises StorageError on failure (does not fail silently).
    """
    if not isinstance(encrypted_bytes, (bytes, bytearray)):
        raise TypeError("encrypted_bytes must be bytes")
    if not s3_key or not str(s3_key).strip():
        raise ValueError("s3_key must be a non-empty string")

    client = _get_s3_client()
    bucket = _bucket_name()
    key = str(s3_key).strip()

    try:
        client.put_object(
            Bucket=bucket,
            Key=key,
            Body=bytes(encrypted_bytes),
            # ContentType is opaque ciphertext for now; real MIME can come later.
            ContentType="application/octet-stream",
        )
    except ClientError as exc:
        code = exc.response.get("Error", {}).get("Code", "Unknown")
        raise StorageError(
            f"S3 upload failed for key '{key}' in bucket '{bucket}' "
            f"(AWS error: {code}). Check credentials, bucket name, region, and IAM policy."
        ) from exc
    except BotoCoreError as exc:
        raise StorageError(
            f"S3 upload failed for key '{key}' due to a network/client error: {exc}"
        ) from exc

    return True


def download_from_s3(s3_key: str) -> bytes:
    """
    Download object bytes from S3 for s3_key.

    Raises StorageError if the object is missing or the request fails.
    """
    if not s3_key or not str(s3_key).strip():
        raise ValueError("s3_key must be a non-empty string")

    client = _get_s3_client()
    bucket = _bucket_name()
    key = str(s3_key).strip()

    try:
        response = client.get_object(Bucket=bucket, Key=key)
        body = response["Body"].read()
    except ClientError as exc:
        code = exc.response.get("Error", {}).get("Code", "Unknown")
        raise StorageError(
            f"S3 download failed for key '{key}' in bucket '{bucket}' "
            f"(AWS error: {code}). Object may not exist, or IAM/credentials are wrong."
        ) from exc
    except BotoCoreError as exc:
        raise StorageError(
            f"S3 download failed for key '{key}' due to a network/client error: {exc}"
        ) from exc

    if not isinstance(body, (bytes, bytearray)):
        raise StorageError(f"S3 returned unexpected body type for key '{key}'.")
    return bytes(body)


def delete_from_s3(s3_key: str) -> bool:
    """
    Delete object at s3_key from S3.

    Returns True on success. Raises StorageError on failure.
    Note: S3 delete is often idempotent (missing key may still return success);
    ClientError / network failures still raise.
    """
    if not s3_key or not str(s3_key).strip():
        raise ValueError("s3_key must be a non-empty string")

    client = _get_s3_client()
    bucket = _bucket_name()
    key = str(s3_key).strip()

    try:
        client.delete_object(Bucket=bucket, Key=key)
    except ClientError as exc:
        code = exc.response.get("Error", {}).get("Code", "Unknown")
        raise StorageError(
            f"S3 delete failed for key '{key}' in bucket '{bucket}' "
            f"(AWS error: {code}). Check credentials, bucket name, and IAM policy."
        ) from exc
    except BotoCoreError as exc:
        raise StorageError(
            f"S3 delete failed for key '{key}' due to a network/client error: {exc}"
        ) from exc

    return True
