"""Order creation over the public API key.

The products endpoint let an outside site *show* the shop's catalogue but gave
it no way to sell: the developer had to fall back on the session-authenticated
dashboard API, which a storefront cannot use. This closes that loop — a website
can read products with the key and post an order back with the same key.

Stock is decremented inside the same transaction as the order, so two visitors
buying the last unit cannot both succeed.
"""

from decimal import Decimal, InvalidOperation

from customers.models import Customer
from django.db import transaction
from orders.models import Order, OrderItem
from products.models import Product, ProductVariant
from rest_framework import permissions, status
from rest_framework.response import Response
from rest_framework.views import APIView

from .authentication import PublicAPIKeyAuthentication, RateLimitMixin


def _decimal(value, field):
    try:
        return Decimal(str(value))
    except (InvalidOperation, TypeError, ValueError):
        raise ValueError(f"{field} must be a number.")


class PublicOrderCreateView(RateLimitMixin, APIView):
    """POST an order the way an e-commerce checkout would.

    Prices are taken from the shop's own product records, never from the
    request. A storefront that could name its own price would be a hole, not a
    feature.
    """

    authentication_classes = [PublicAPIKeyAuthentication]
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request):
        user = request.user
        items_data = request.data.get("items") or []
        customer_data = request.data.get("customer") or {}

        if not isinstance(items_data, list) or not items_data:
            return Response(
                {"error": "items is required and must be a non-empty list."},
                status=status.HTTP_400_BAD_REQUEST,
            )
        if len(items_data) > 100:
            return Response(
                {"error": "An order can hold at most 100 line items."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        try:
            with transaction.atomic():
                order = self._build(user, items_data, customer_data, request.data)
        except ValueError as exc:
            return Response({"error": str(exc)}, status=status.HTTP_400_BAD_REQUEST)

        return Response(self._represent(order), status=status.HTTP_201_CREATED)

    # ------------------------------------------------------------------

    def _build(self, user, items_data, customer_data, payload):
        subtotal = Decimal("0")
        buy_total = Decimal("0")
        lines = []

        for raw in items_data:
            if not isinstance(raw, dict):
                raise ValueError("Each item must be an object.")

            try:
                quantity = int(raw.get("quantity", 0))
            except (TypeError, ValueError):
                raise ValueError("quantity must be a whole number.")
            if quantity < 1:
                raise ValueError("quantity must be at least 1.")

            # Scoped to the key's owner, so one shop's key can never sell
            # another shop's product.
            product = Product.objects.filter(
                id=raw.get("product_id"), user=user, is_active=True
            ).first()
            if product is None:
                raise ValueError(
                    f"Product {raw.get('product_id')} was not found in this store."
                )

            variant = None
            if raw.get("variant_id"):
                variant = ProductVariant.objects.filter(
                    id=raw["variant_id"], product=product
                ).first()
                if variant is None:
                    raise ValueError(
                        f"Variant {raw['variant_id']} does not belong to product "
                        f"{product.id}."
                    )
            elif product.has_variants:
                raise ValueError(
                    f"Product {product.id} has variants — variant_id is required."
                )

            unit_price = variant.sell_price if variant else product.sell_price
            buy_price = variant.buy_price if variant else product.buy_price

            if not product.no_stock_required:
                available = variant.stock if variant else product.stock
                if available < quantity:
                    raise ValueError(
                        f"Only {available} left of {product.name}."
                    )

            line_total = unit_price * quantity
            subtotal += line_total
            buy_total += buy_price * quantity
            lines.append((product, variant, quantity, unit_price, buy_price, line_total))

        discount = _decimal(payload.get("discount_amount", 0), "discount_amount")
        if discount < 0 or discount > subtotal:
            raise ValueError("discount_amount must be between 0 and the subtotal.")
        paid = _decimal(payload.get("paid_amount", 0), "paid_amount")
        if paid < 0:
            raise ValueError("paid_amount cannot be negative.")

        total = subtotal - discount
        if paid > total:
            raise ValueError("paid_amount cannot be more than the order total.")

        customer = None
        phone = (customer_data.get("phone") or "").strip()
        if phone:
            # Match on phone so a repeat buyer lands on the same customer row
            # instead of creating a duplicate on every order.
            customer = Customer.objects.filter(user=user, phone=phone).first()
            if customer is None and customer_data.get("name"):
                customer = Customer.objects.create(
                    user=user,
                    name=customer_data["name"].strip(),
                    phone=phone,
                    email=(customer_data.get("email") or "").strip() or None,
                    address=(customer_data.get("address") or "").strip() or None,
                )

        order = Order.objects.create(
            user=user,
            customer=customer,
            customer_name=(customer_data.get("name") or "").strip() or None,
            customer_phone=phone or None,
            customer_email=(customer_data.get("email") or "").strip() or None,
            customer_address=(customer_data.get("address") or "").strip() or None,
            status=payload.get("status", "pending"),
            subtotal=subtotal,
            discount_amount=discount,
            total_amount=total,
            paid_amount=paid,
            due_amount=total - paid,
            total_buy_price=buy_total,
            total_sell_price=subtotal,
            gross_profit=subtotal - buy_total,
            net_profit=total - buy_total,
            notes=(payload.get("notes") or "").strip() or None,
        )

        for product, variant, quantity, unit_price, buy_price, line_total in lines:
            OrderItem.objects.create(
                order=order,
                product=product,
                variant=variant,
                quantity=quantity,
                unit_price=unit_price,
                buy_price=buy_price,
                total_price=line_total,
                product_name=product.name,
            )
            if product.no_stock_required:
                continue
            if variant:
                ProductVariant.objects.filter(pk=variant.pk).update(
                    stock=variant.stock - quantity
                )
            else:
                Product.objects.filter(pk=product.pk).update(
                    stock=product.stock - quantity
                )

        return order

    @staticmethod
    def _represent(order):
        return {
            "id": order.id,
            "order_number": order.order_number,
            "status": order.status,
            "subtotal": str(order.subtotal),
            "discount_amount": str(order.discount_amount),
            "total_amount": str(order.total_amount),
            "paid_amount": str(order.paid_amount),
            "due_amount": str(order.due_amount),
            "customer": {
                "name": order.customer_name,
                "phone": order.customer_phone,
                "email": order.customer_email,
            },
            "items": [
                {
                    "product_id": item.product_id,
                    "variant_id": item.variant_id,
                    "product_name": item.product_name,
                    "quantity": item.quantity,
                    "unit_price": str(item.unit_price),
                    "total_price": str(item.total_price),
                }
                for item in order.items.all()
            ],
            "created_at": order.created_at,
        }


class PublicOrderDetailView(RateLimitMixin, APIView):
    """Read one order back — a storefront needs this for its own status page."""

    authentication_classes = [PublicAPIKeyAuthentication]
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request, order_number):
        order = (
            Order.objects.filter(user=request.user, order_number=order_number)
            .prefetch_related("items")
            .first()
        )
        if order is None:
            return Response(
                {"error": "Order not found."}, status=status.HTTP_404_NOT_FOUND
            )
        return Response(PublicOrderCreateView._represent(order))
