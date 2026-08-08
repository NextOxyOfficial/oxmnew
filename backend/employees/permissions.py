"""What a staff login is allowed to do.

The catalogue lives here, in one list, because three things have to agree on
it: the checkbox screen the owner ticks, the guard that runs on every request,
and the menu the frontend draws. A permission invented in only one of those
three would be a hole or a dead menu item.

A staff account is a real Django `User` that *belongs to* a shop owner. The
owner's records stay owned by the owner — staff never get their own copy of the
data, they get scoped access to their employer's. Which is why every viewset
resolves "whose books am I looking at" through `owner_for()` rather than
`request.user` directly.
"""

#: (code, Bangla label, group) — the group only orders the checkbox screen.
PERMISSIONS = [
    # ── Products ───────────────────────────────────────────────────────
    ("products.view", "প্রোডাক্ট দেখা", "প্রোডাক্ট"),
    ("products.add", "নতুন প্রোডাক্ট যোগ করা", "প্রোডাক্ট"),
    ("products.edit", "প্রোডাক্ট এডিট করা", "প্রোডাক্ট"),
    ("products.delete", "প্রোডাক্ট মুছে ফেলা", "প্রোডাক্ট"),
    ("products.stock", "স্টক কম-বেশি করা", "প্রোডাক্ট"),
    ("products.buy_price", "কেনা দাম দেখা", "প্রোডাক্ট"),
    # ── Vehicles ───────────────────────────────────────────────────────
    ("vehicles.view", "মোটর বাইক দেখা", "মোটর বাইক"),
    ("vehicles.add", "নতুন বাইক যোগ করা", "মোটর বাইক"),
    ("vehicles.edit", "বাইকের তথ্য বদলানো", "মোটর বাইক"),
    ("vehicles.sell", "বাইক বিক্রি করা", "মোটর বাইক"),
    ("vehicles.delete", "বাইক মুছে ফেলা", "মোটর বাইক"),
    # ── Sales ──────────────────────────────────────────────────────────
    ("orders.view", "বিক্রির তালিকা দেখা", "বিক্রি"),
    ("orders.add", "নতুন বিক্রি করা", "বিক্রি"),
    ("orders.edit", "বিক্রি এডিট করা", "বিক্রি"),
    ("orders.delete", "বিক্রি মুছে ফেলা", "বিক্রি"),
    ("orders.discount", "ছাড় দেওয়া", "বিক্রি"),
    ("orders.profit", "বিক্রির লাভ দেখা", "বিক্রি"),
    # ── Customers ──────────────────────────────────────────────────────
    ("customers.view", "কাস্টমার দেখা", "কাস্টমার"),
    ("customers.add", "নতুন কাস্টমার যোগ করা", "কাস্টমার"),
    ("customers.edit", "কাস্টমারের তথ্য বদলানো", "কাস্টমার"),
    ("customers.delete", "কাস্টমার মুছে ফেলা", "কাস্টমার"),
    ("customers.due", "বাকির খাতা দেখা ও নেওয়া", "কাস্টমার"),
    # ── Suppliers ──────────────────────────────────────────────────────
    ("suppliers.view", "সাপ্লায়ার দেখা", "সাপ্লায়ার"),
    ("suppliers.manage", "সাপ্লায়ার, কেনা আর পেমেন্ট সামলানো", "সাপ্লায়ার"),
    # ── Banking ────────────────────────────────────────────────────────
    ("banking.view", "ব্যাংক অ্যাকাউন্ট ও লেনদেন দেখা", "ব্যাংকিং"),
    ("banking.transact", "জমা, খরচ, উত্তোলন করা", "ব্যাংকিং"),
    ("banking.loans", "লোন আর কিস্তি সামলানো", "ব্যাংকিং"),
    ("banking.costs", "অফিস ম্যানেজমেন্টের খরচ সামলানো", "ব্যাংকিং"),
    # ── Employees ──────────────────────────────────────────────────────
    ("employees.view", "কর্মচারীর তালিকা দেখা", "কর্মচারী"),
    ("employees.manage", "কর্মচারী যোগ ও এডিট করা", "কর্মচারী"),
    ("employees.salary", "বেতন আর ইনসেনটিভ সামলানো", "কর্মচারী"),
    # ── Reports ────────────────────────────────────────────────────────
    ("analytics.view", "অ্যানালিটিক্স ও রিপোর্ট দেখা", "রিপোর্ট"),
    ("dashboard.money", "ড্যাশবোর্ডে টাকার হিসাব দেখা", "রিপোর্ট"),
    # ── Tools ──────────────────────────────────────────────────────────
    ("sms.send", "এসএমএস পাঠানো", "টুলস"),
    ("notebook.use", "নোটবুক ব্যবহার করা", "টুলস"),
    ("documents.use", "জরুরি কাগজপত্র দেখা ও রাখা", "টুলস"),
    ("settings.view", "সেটিংস দেখা", "টুলস"),
]

PERMISSION_CODES = {code for code, _, _ in PERMISSIONS}

#: A sensible starting tick-list for a shop-floor salesperson — enough to serve
#: a customer, nothing that touches money at rest or other people's pay.
DEFAULT_PRESET = [
    "products.view",
    "vehicles.view",
    "orders.view",
    "orders.add",
    "customers.view",
    "customers.add",
    "notebook.use",
]


def grouped():
    """The catalogue arranged for the checkbox screen, order preserved."""
    groups = []
    seen = {}
    for code, label, group in PERMISSIONS:
        if group not in seen:
            seen[group] = {"group": group, "items": []}
            groups.append(seen[group])
        seen[group]["items"].append({"code": code, "label": label})
    return groups


def clean(codes):
    """Drop anything not in the catalogue.

    A stale code left in the database after a permission is renamed would
    silently grant nothing — better to strip it on the way in so what is stored
    is always what the guard checks.
    """
    if not isinstance(codes, (list, tuple, set)):
        return []
    return sorted({str(c) for c in codes} & PERMISSION_CODES)
