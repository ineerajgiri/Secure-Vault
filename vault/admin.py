from django.contrib import admin
from .models import Profile
from .models import Document

admin.site.register(Profile)
@admin.register(Document)
class DocumentAdmin(admin.ModelAdmin):
    list_display = ("filename", "owner", "uploaded_at", "s3_key")
    list_filter = ("uploaded_at",)
    search_fields = ("filename", "s3_key", "owner__username")
    readonly_fields = ("uploaded_at",)
