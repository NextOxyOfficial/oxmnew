"""Whose books is this request looking at, and may it?

A staff login is a separate Django user, but it owns no data of its own — every
product, order and taka belongs to the shop owner who created the login. So
every place that used to say `request.user` has to ask two questions instead:

  * `owner_for(request)` — whose records, and
  * `HasPermission` — is this login allowed to touch them.

Getting the first one wrong is the dangerous half: a staff login resolving to
itself would see an empty shop, but a staff login resolving to the *wrong*
owner would see someone else's. `owner_for` only ever walks the one link from
the login to its employer, so there is no path to a third party.
"""

from rest_framework import permissions


def staff_access(user):
    """The EmployeeAccess row behind this login, or None for an owner."""
    if user is None or not user.is_authenticated:
        return None
    return getattr(user, "staff_access", None)


def owner_for(request):
    """The user whose records this request may read and write.

    An owner is their own owner. A staff login resolves to its employer. A
    disabled login resolves to itself, which owns nothing — so it sees an empty
    shop rather than being handed the employer's data by accident.
    """
    user = getattr(request, "user", None)
    access = staff_access(user)
    if access is None:
        return user
    if not access.is_enabled:
        return user
    return access.owner


def is_staff_login(request):
    return staff_access(getattr(request, "user", None)) is not None


def permissions_for(user):
    """Everything this login may do. Owners are unrestricted."""
    access = staff_access(user)
    if access is None:
        return None  # None means "no restrictions", not "none allowed".
    return list(access.permissions or []) if access.is_enabled else []


def can(request, code):
    """True when the request may perform `code`."""
    granted = permissions_for(getattr(request, "user", None))
    return True if granted is None else code in granted


class HasPermission(permissions.BasePermission):
    """Guards a viewset with `required_permissions`.

    Declared per HTTP method so one viewset can let a salesperson read the
    order list while refusing them the delete button:

        required_permissions = {
            "GET": "orders.view",
            "POST": "orders.add",
            "DELETE": "orders.delete",
        }

    A method with no entry falls back to `"*"`, and with neither the viewset is
    open to any signed-in login. That default is deliberate: existing viewsets
    keep working for owners, and staff are still confined by `owner_for`, which
    every queryset goes through.
    """

    message = "এই কাজটা করার অনুমতি আপনার নেই।"

    def has_permission(self, request, view):
        granted = permissions_for(request.user)
        if granted is None:
            return True

        access = staff_access(request.user)
        if access is not None and not access.is_enabled:
            self.message = "আপনার লগইন বন্ধ করে দেওয়া হয়েছে।"
            return False

        table = getattr(view, "required_permissions", None) or {}
        code = table.get(request.method, table.get("*"))
        if code is None:
            return True

        if isinstance(code, (list, tuple)):
            return any(c in granted for c in code)
        return code in granted
