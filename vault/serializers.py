from rest_framework import serializers
from django.contrib.auth.models import User
from django.contrib.auth.password_validation import validate_password
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

class RegisterSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True, validators=[validate_password])

    class Meta:
        model = User
        fields = ["username", "password", "email"]

    def create(self, validated_data):
        return User.objects.create_user(**validated_data)
