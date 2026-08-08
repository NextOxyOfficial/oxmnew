import os

from rest_framework import serializers

from .models import ImportantDocument


class ImportantDocumentSerializer(serializers.ModelSerializer):
    """Read + write. The file is the only required field beyond the title."""

    doc_type_display = serializers.CharField(
        source="get_doc_type_display", read_only=True
    )
    file_url = serializers.SerializerMethodField()
    file_name = serializers.ReadOnlyField()
    file_size = serializers.ReadOnlyField()
    extension = serializers.ReadOnlyField()
    days_left = serializers.ReadOnlyField()
    status = serializers.ReadOnlyField()
    uploaded_by_name = serializers.SerializerMethodField()

    class Meta:
        model = ImportantDocument
        fields = [
            "id",
            "title",
            "doc_type",
            "doc_type_display",
            "file",
            "file_url",
            "file_name",
            "file_size",
            "extension",
            "reference_number",
            "issued_by",
            "issue_date",
            "expiry_date",
            "days_left",
            "status",
            "notes",
            "is_pinned",
            "uploaded_by_name",
            "created_at",
            "updated_at",
        ]
        read_only_fields = ["id", "created_at", "updated_at"]
        extra_kwargs = {
            # Write-only in effect: clients read `file_url`, which is absolute.
            "file": {"write_only": True, "required": True},
        }

    def get_file_url(self, obj):
        if not obj.file:
            return None
        request = self.context.get("request")
        return request.build_absolute_uri(obj.file.url) if request else obj.file.url

    def get_uploaded_by_name(self, obj):
        if not obj.uploaded_by:
            return None
        full = obj.uploaded_by.get_full_name()
        return full or obj.uploaded_by.username

    def validate_file(self, value):
        """Guard the two things that actually bite: type and size.

        The extension allow-list matters beyond tidiness — MEDIA_ROOT is served
        as static files, so an uploaded .html or .svg would execute on our own
        origin. Only inert types are accepted.
        """
        ext = os.path.splitext(value.name)[1].lower()
        if ext not in ImportantDocument.ALLOWED_EXTENSIONS:
            allowed = ", ".join(e.lstrip(".") for e in ImportantDocument.ALLOWED_EXTENSIONS)
            raise serializers.ValidationError(
                f"এই ধরনের ফাইল রাখা যাবে না। যেগুলো চলবে: {allowed}"
            )
        if value.size > ImportantDocument.MAX_FILE_SIZE:
            mb = ImportantDocument.MAX_FILE_SIZE // (1024 * 1024)
            raise serializers.ValidationError(f"ফাইল {mb} এমবির বেশি বড় হলে চলবে না।")
        return value

    def validate(self, attrs):
        """Dates must make sense relative to each other."""
        issue = attrs.get("issue_date", getattr(self.instance, "issue_date", None))
        expiry = attrs.get("expiry_date", getattr(self.instance, "expiry_date", None))
        if issue and expiry and expiry < issue:
            raise serializers.ValidationError(
                {"expiry_date": "মেয়াদ শেষের তারিখ ইস্যুর তারিখের আগে হতে পারে না।"}
            )
        return attrs


class ImportantDocumentUpdateSerializer(ImportantDocumentSerializer):
    """Editing details must not force a re-upload of the same file."""

    class Meta(ImportantDocumentSerializer.Meta):
        extra_kwargs = {"file": {"write_only": True, "required": False}}
