"""Reusable ownership helpers — IDOR guard lives here."""

from rest_framework.exceptions import NotFound

from .models import Document


def get_owned_document_or_404(*, user, document_id: int) -> Document:
    """
    Return a Document only if it belongs to ``user``.

    Always 404 (not 403) when missing OR owned by someone else — so we do
    not leak whether another user's document id exists.
    """
    try:
        return Document.objects.get(pk=document_id, owner=user)
    except Document.DoesNotExist as exc:
        raise NotFound(detail="Document not found.") from exc
