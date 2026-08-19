"""
Document API: upload, list, download, delete.

Security model:
- Every view requires IsAuthenticated (JWT).
- List queryset is always filtered by request.user (never Document.objects.all()).
- Single-object routes use get_owned_document_or_404 (owner + pk) → 404 on IDOR.
- s3_key is never returned in API responses.
"""

from __future__ import annotations

import mimetypes
import os
from io import BytesIO
from uuid import uuid4

from django.http import FileResponse
from rapidfuzz import fuzz
from rest_framework import status
from rest_framework.parsers import FormParser, MultiPartParser
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView

from .encryption import decrypt_file, encrypt_file
from .models import Document
from .ownership import get_owned_document_or_404
from .serializers import DocumentSerializer
from .storage import StorageError, delete_from_s3, download_from_s3, upload_to_s3
from .validators import parse_tags, validate_uploaded_file

from rest_framework import generics
from rest_framework.permissions import AllowAny
from django.contrib.auth.models import User
from .serializers import RegisterSerializer

# Score neeche 70 ke matlab "match nahi" — fuzzy tag search ke liye
FUZZY_TAG_THRESHOLD = 70


class DocumentListCreateView(APIView):
    """GET /api/documents/ — list mine | POST /api/documents/ — upload."""

    permission_classes = [IsAuthenticated]
    parser_classes = [MultiPartParser, FormParser]

    def get(self, request):
        # OWNERSHIP: only this user's rows — never .all()
        qs = Document.objects.filter(owner=request.user)

        tag = request.query_params.get("tag")
        if tag:
            # Fuzzy match: user ke saare tags nikalo, phir score karke shortlist banao
            all_tags = set()
            for doc_tags in qs.values_list("tags", flat=True):
                all_tags.update(doc_tags or [])

            matched_tags = [
                candidate
                for candidate in all_tags
                if fuzz.partial_ratio(tag.lower(), candidate.lower()) >= FUZZY_TAG_THRESHOLD
            ]

            if matched_tags:
                doc_ids = [
                    doc.id
                    for doc in qs
                    if any(t in (doc.tags or []) for t in matched_tags)
                ]
                qs = qs.filter(id__in=doc_ids)
            else:
                qs = qs.none()

        serializer = DocumentSerializer(qs, many=True)
        return Response(serializer.data)

    def post(self, request):
        uploaded = request.FILES.get("file")
        if uploaded is None:
            return Response(
                {"file": "This field is required."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        validate_uploaded_file(uploaded)
        tags = parse_tags(request.data.get("tags"))

        filename = os.path.basename(uploaded.name)
        file_bytes = uploaded.read()
        encrypted_bytes = encrypt_file(file_bytes)

        # Per-user prefix + uuid avoids collisions and keeps keys namespaced by owner
        s3_key = f"{request.user.id}/{uuid4().hex}_{filename}"

        try:
            upload_to_s3(encrypted_bytes, s3_key)
        except StorageError as exc:
            return Response(
                {"detail": str(exc)},
                status=status.HTTP_502_BAD_GATEWAY,
            )

        try:
            document = Document.objects.create(
                owner=request.user,  # OWNERSHIP: always authenticated user
                filename=filename,
                s3_key=s3_key,
                tags=tags,
            )
        except Exception:
            # Avoid orphaned ciphertext in S3 if DB insert fails
            try:
                delete_from_s3(s3_key)
            except StorageError:
                pass
            raise

        return Response(
            DocumentSerializer(document).data,
            status=status.HTTP_201_CREATED,
        )


class DocumentDownloadView(APIView):
    """GET /api/documents/<id>/download/ — decrypt and return original file."""

    permission_classes = [IsAuthenticated]

    def get(self, request, pk):
        # OWNERSHIP: 404 if not owned by request.user (IDOR-safe)
        document = get_owned_document_or_404(user=request.user, document_id=pk)

        try:
            encrypted_bytes = download_from_s3(document.s3_key)
            plain_bytes = decrypt_file(encrypted_bytes)
        except StorageError as exc:
            return Response(
                {"detail": str(exc)},
                status=status.HTTP_502_BAD_GATEWAY,
            )
        except ValueError as exc:
            return Response(
                {"detail": str(exc)},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR,
            )

        response = FileResponse(
            BytesIO(plain_bytes),
            as_attachment=True,
            filename=document.filename,
        )
        return response


class DocumentViewView(APIView):
    """GET /api/documents/<id>/view/ — decrypt and stream inline (no download)."""

    permission_classes = [IsAuthenticated]

    def get(self, request, pk):
        # OWNERSHIP: 404 if not owned by request.user (IDOR-safe)
        document = get_owned_document_or_404(user=request.user, document_id=pk)

        try:
            encrypted_bytes = download_from_s3(document.s3_key)
            plain_bytes = decrypt_file(encrypted_bytes)
        except StorageError as exc:
            return Response(
                {"detail": str(exc)},
                status=status.HTTP_502_BAD_GATEWAY,
            )
        except ValueError as exc:
            return Response(
                {"detail": str(exc)},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR,
            )

        content_type, _ = mimetypes.guess_type(document.filename)
        content_type = content_type or "application/octet-stream"

        response = FileResponse(
            BytesIO(plain_bytes),
            as_attachment=False,  # inline — browser tries to render, not download
            filename=document.filename,
            content_type=content_type,
        )
        return response


class DocumentDeleteView(APIView):
    """DELETE /api/documents/<id>/ — remove S3 object then DB row."""

    permission_classes = [IsAuthenticated]

    def delete(self, request, pk):
        # OWNERSHIP: 404 if not owned by request.user (IDOR-safe)
        document = get_owned_document_or_404(user=request.user, document_id=pk)

        try:
            delete_from_s3(document.s3_key)
        except StorageError as exc:
            return Response(
                {"detail": str(exc)},
                status=status.HTTP_502_BAD_GATEWAY,
            )

        document.delete()
        return Response(status=status.HTTP_204_NO_CONTENT)


class RegisterView(generics.CreateAPIView):
    queryset = User.objects.all()
    serializer_class = RegisterSerializer
    permission_classes = [AllowAny]