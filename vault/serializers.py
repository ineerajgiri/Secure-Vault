from rest_framework import serializers

from .models import Document


class DocumentSerializer(serializers.ModelSerializer):
    """
    Public document metadata only.

    Security: s3_key and owner are intentionally omitted so clients never
    learn internal storage paths or can spoof ownership via the API.
    """

    class Meta:
        model = Document
        fields = ("id", "filename", "tags", "uploaded_at")
        read_only_fields = ("id", "filename", "tags", "uploaded_at")
