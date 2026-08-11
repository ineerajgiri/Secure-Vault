from django.conf import settings
from django.db import models


class Document(models.Model):
    """
    Metadata for an encrypted file stored in S3.

    The actual file bytes live in S3 (encrypted). This row only tracks
    ownership and how to find/decrypt the object later.
    """

    owner = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="documents",
    )
    filename = models.CharField(max_length=255)
    s3_key = models.CharField(max_length=1024, unique=True)
    # JSONField: structured list of tags, e.g. ["invoice", "2024"].
    # Better than comma-separated CharField for filtering / validation later.
    tags = models.JSONField(default=list, blank=True)
    uploaded_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["-uploaded_at"]
        indexes = [
            # Speeds up "list my documents" queries filtered by owner
            models.Index(fields=["owner", "-uploaded_at"]),
        ]

    def __str__(self) -> str:
        return f"{self.filename} (owner_id={self.owner_id})"
