"""Replace an order's items in one step, with stock moved by the difference.

The edit page used to save an order by removing every item one request at a
time — each putting its stock back — then re-adding them one request at a time,
each taking stock again. Sixty-odd requests, no transaction, and the removal
errors were swallowed. Two things went wrong with that:

* **A request failing midway left the order half rebuilt.** On order #2150 the
  31st item was refused, so four save attempts each left 30 items behind with
  the totals from before the edit. Across the shop, 88 orders no longer add up
  to their own subtotal; #643 has no items at all and a ৳1,240 subtotal.

* **The re-add asked the shelf, not the order.** It checked current stock
  without counting what this very order already held, and it ignored
  `no_stock_required`. A service charge — stock 0 by design — could be put on
  a new order but never saved again on an edited one.

Here the whole edit is one transaction. Stock moves by the *difference*
between what the order held and what it now asks for, so an order keeps what it
already reserved even if the shelf is empty, and nothing is touched for items
that do not track stock. If any line is refused, nothing changes at all.
"""

from collections import defaultdict
from decimal import Decimal, InvalidOperation

from django.db import transaction

from products.models import Product, ProductVariant

from .models import OrderItem


class EditRefused(Exception):
    """A line cannot be saved. The message is shown to the shopkeeper as is."""


def _decimal(value, field, label):
    try:
        number = Decimal(str(value))
    except (InvalidOperation, TypeError, ValueError):
        raise EditRefused(f"{label}: {field} সংখ্যা হতে হবে।")
    if number < 0:
        raise EditRefused(f"{label}: {field} মাইনাস হতে পারে না।")
    return number


def _stock_key(product, variant):
    """Which shelf a line draws from, or None when it draws from no shelf.

    Mirrors order creation exactly: a variant line uses the variant's stock, a
    plain line uses the product's — unless the product is marked
    `no_stock_required` (a service charge, labour), which has no shelf at all.
    """
    if variant is not None:
        return ("variant", variant.id)
    if product.no_stock_required:
        return None
    return ("product", product.id)


def replace_items(order, owner, lines):
    """Make `order` hold exactly `lines`, moving stock by the difference.

    `lines` is a list of dicts with product, variant (optional), quantity,
    unit_price and buy_price (optional). Raises EditRefused with a Bangla
    message when the edit cannot be applied; in that case nothing is changed.
    """
    if not isinstance(lines, list) or not lines:
        raise EditRefused("অর্ডারে অন্তত একটা প্রোডাক্ট থাকতে হবে।")

    with transaction.atomic():
        # ── resolve every requested line against THIS shop's catalogue ──
        product_ids = set()
        for line in lines:
            try:
                product_ids.add(int(line.get("product")))
            except (TypeError, ValueError):
                raise EditRefused("একটা লাইনে প্রোডাক্ট বেছে নেওয়া হয়নি।")

        # Scoped to the owner: a product id from another shop must look exactly
        # like one that does not exist.
        products = {
            p.id: p
            for p in Product.objects.select_for_update().filter(
                id__in=product_ids, user=owner
            )
        }

        wanted = []
        for index, line in enumerate(lines, start=1):
            product = products.get(int(line["product"]))
            if product is None:
                raise EditRefused(f"{index} নম্বর লাইনের প্রোডাক্টটা পাওয়া যায়নি।")
            label = product.name

            variant = None
            variant_id = line.get("variant")
            if isinstance(variant_id, dict):
                variant_id = variant_id.get("id")
            if variant_id not in (None, "", 0, "0"):
                try:
                    variant = ProductVariant.objects.select_for_update().get(
                        id=int(variant_id), product=product
                    )
                except (ProductVariant.DoesNotExist, TypeError, ValueError):
                    raise EditRefused(f"{label}: এই ভ্যারিয়েন্টটা পাওয়া যায়নি।")

            try:
                quantity = int(line.get("quantity"))
            except (TypeError, ValueError):
                raise EditRefused(f"{label}: পরিমাণ লিখুন।")
            if quantity < 1:
                raise EditRefused(f"{label}: পরিমাণ অন্তত 1 হতে হবে।")

            unit_price = _decimal(line.get("unit_price", 0), "দাম", label)
            # The buy price on an existing line is history — it is what the
            # goods cost when they were sold — so the page sends it back as it
            # was. Only a brand-new line falls back to today's price.
            raw_buy = line.get("buy_price")
            if raw_buy in (None, ""):
                raw_buy = (
                    variant.buy_price
                    if variant is not None and variant.buy_price
                    else product.buy_price or 0
                )
            buy_price = _decimal(raw_buy, "কেনা দাম", label)

            wanted.append(
                {
                    "product": product,
                    "variant": variant,
                    "quantity": quantity,
                    "unit_price": unit_price,
                    "buy_price": buy_price,
                    "key": _stock_key(product, variant),
                }
            )

        # ── what the order holds now, per shelf ─────────────────────────
        # of=("self",): lock only the item rows. Postgres refuses FOR UPDATE on
        # the nullable side of the variant LEFT JOIN, and the product/variant
        # rows that actually hold stock are locked one by one just below.
        existing = list(
            order.items.select_related("product", "variant").select_for_update(
                of=("self",)
            )
        )
        held = defaultdict(int)
        for item in existing:
            key = _stock_key(item.product, item.variant)
            if key is not None:
                held[key] += item.quantity

        need = defaultdict(int)
        for line in wanted:
            if line["key"] is not None:
                need[line["key"]] += line["quantity"]

        # ── check every shelf before moving any of them ──────────────────
        # Only the *extra* is asked of the shelf. An order that already held
        # one Valve R15 may keep it even if none are left in the shop.
        shelves = {}
        for key in set(held) | set(need):
            kind, pk = key
            if kind == "variant":
                shelf = ProductVariant.objects.select_for_update().get(id=pk)
                name = f"{shelf.product.name} ({shelf.color} {shelf.size})".strip()
            else:
                shelf = Product.objects.select_for_update().get(id=pk)
                name = shelf.name
            extra = need[key] - held[key]
            if extra > shelf.stock:
                raise EditRefused(
                    f"{name}: স্টকে আছে {shelf.stock} টা, "
                    f"আরও {extra} টা লাগবে।"
                )
            shelves[key] = (shelf, extra)

        # ── apply: stock by the difference, then the lines ─────────────
        for shelf, extra in shelves.values():
            if extra:
                shelf.stock -= extra
                shelf.save(update_fields=["stock"])

        order.items.all().delete()
        # One create() per line rather than bulk_create, so OrderItem.save()
        # stays the single place that derives total_price and the cached
        # product name. A few dozen inserts inside one transaction is nothing.
        for line in wanted:
            OrderItem.objects.create(
                order=order,
                product=line["product"],
                variant=line["variant"],
                quantity=line["quantity"],
                unit_price=line["unit_price"],
                buy_price=line["buy_price"],
            )
    return order
