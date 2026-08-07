"""Reject writes that point at another shop's records.

DRF's `PrimaryKeyRelatedField` validates that a row *exists*, never that the
caller owns it. So a serializer that accepts `customer` happily attached a due
payment to a stranger's customer — reads were scoped, writes were not.

`OwnedRelationsMixin` closes that by re-checking every relation named in
`owned_relations` against the requesting user. It is deliberately explicit:
listing the fields is one line per serializer and makes the intent auditable,
whereas guessing from field names would silently miss a renamed relation.
"""

from rest_framework import serializers

# How to reach the owning user from each model. `None` means the model has a
# direct `user` field.
OWNER_PATHS = {
    "customer": "user",
    "order": "user",
    "product": "user",
    "supplier": "user",
    "employee": "user",
    "vehicle": "user",
    "loan": "user",
    "cost": "user",
    "notebook": "created_by",
    "account": "owner",
    "variant": "product__user",
}


class OwnedRelationsMixin:
    """Mixin for ModelSerializers that accept foreign keys on write."""

    #: Field names whose target must belong to the requesting user.
    owned_relations: tuple = ()

    def _owner_of(self, field_name, instance):
        path = OWNER_PATHS.get(field_name, "user")
        obj = instance
        for part in path.split("__"):
            obj = getattr(obj, part, None)
            if obj is None:
                return None
        return obj

    def validate(self, attrs):
        attrs = super().validate(attrs)
        request = self.context.get("request")
        user = getattr(request, "user", None)
        if user is None or not user.is_authenticated:
            return attrs
        # Staff run support tasks across shops; everyone else is confined.
        if user.is_staff or user.is_superuser:
            return attrs

        errors = {}
        for field in self.owned_relations:
            target = attrs.get(field)
            if target is None:
                continue
            owner = self._owner_of(field, target)
            if owner is not None and owner.pk != user.pk:
                # Same wording as a missing row: confirming that the id exists
                # would let someone map another shop's records by probing ids.
                errors[field] = ["Invalid pk — object does not exist."]
        if errors:
            raise serializers.ValidationError(errors)
        return attrs
