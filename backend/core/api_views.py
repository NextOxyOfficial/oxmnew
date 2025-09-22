from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from django.db.models import Sum
from django.utils import timezone
from products.models import Product
from customers.models import Customer
from suppliers.models import Supplier


@api_view(["GET"])
@permission_classes([IsAuthenticated])
def dashboard_stats(request):
    """Get comprehensive dashboard statistics"""
    user = request.user

    # Product stats
    products = Product.objects.filter(user=user)
    product_count = products.count()
    low_stock_count = products.filter(stock__lte=10).count()
    out_of_stock_count = products.filter(stock=0).count()

    # Calculate inventory value
    total_inventory_value = sum(
        (product.buy_price * product.stock) for product in products
    )

    # Customer stats
    customers = Customer.objects.filter(user=user)
    customer_count = customers.count()
    vip_customers = customers.filter(status="active").count()

    # Order stats using Order model
    try:
        from orders.models import Order

        orders = Order.objects.filter(user=user)
        order_count = orders.count()
        completed_orders = orders.filter(status="completed").count()
        total_revenue = orders.aggregate(total=Sum("total_amount"))["total"] or 0
        pending_orders = orders.filter(status="pending").count()
    except ImportError:
        # Fallback if orders app not available yet
        order_count = 0
        completed_orders = 0
        total_revenue = 0
        pending_orders = 0

    # Supplier stats
    supplier_count = Supplier.objects.filter(user=user).count()

    # Recent activity (sample data)
    recent_activities = [
        {
            "id": 1,
            "type": "order",
            "title": "New order received",
            "description": f"Order from customer - ${(total_revenue / order_count):.0f}"
            if order_count > 0
            else "Order from customer - $450",
            "timestamp": "2 minutes ago",
        },
        {
            "id": 2,
            "type": "product",
            "title": "Low stock alert",
            "description": f"{low_stock_count} products running low",
            "timestamp": "15 minutes ago",
        },
        {
            "id": 3,
            "type": "customer",
            "title": "New customer registered",
            "description": "VIP customer account created",
            "timestamp": "1 hour ago",
        },
    ]

    return Response(
        {
            "products": {
                "total": product_count,
                "low_stock": low_stock_count,
                "out_of_stock": out_of_stock_count,
                "inventory_value": float(total_inventory_value),
            },
            "customers": {
                "total": customer_count,
                "vip": vip_customers,
            },
            "orders": {
                "total": order_count,
                "completed": completed_orders,
                "pending": pending_orders,
                "revenue": float(total_revenue),
            },
            "suppliers": {
                "total": supplier_count,
            },
            "recent_activities": recent_activities,
            "summary": {
                "product_count": product_count,
                "total_revenue": float(total_revenue),
                "order_count": order_count,
                "customer_count": customer_count,
            },
        }
    )


@api_view(["GET"])
@permission_classes([IsAuthenticated])
def search_global(request):
    """Global search across products, customers, orders, suppliers"""
    query = request.GET.get("q", "").strip()

    if not query or len(query) < 2:
        return Response({"results": [], "total": 0})

    user = request.user
    results = []

    # Search products
    products = Product.objects.filter(user=user, name__icontains=query)[:5]

    for product in products:
        stock_level = (
            "HIGH_STOCK"
            if product.stock > 20
            else "MEDIUM_STOCK"
            if product.stock > 10
            else "LOW_STOCK"
        )
        results.append(
            {
                "id": str(product.id),
                "type": "product",
                "title": product.name,
                "subtitle": f"{product.category.name if product.category else 'Uncategorized'} • ${product.sell_price} • {product.stock} in stock",
                "href": f"/dashboard/products/{product.id}",
                "badge": stock_level,
            }
        )

    # Search customers
    customers = Customer.objects.filter(user=user, name__icontains=query)[:5]

    for customer in customers:
        results.append(
            {
                "id": str(customer.id),
                "type": "customer",
                "title": customer.name,
                "subtitle": f"{customer.email} • {customer.phone} • {customer.status.title()} Customer",
                "href": f"/dashboard/customers/{customer.id}",
                "avatar": "".join(
                    [word[0].upper() for word in customer.name.split()[:2]]
                ),
            }
        )

    # Search suppliers
    suppliers = Supplier.objects.filter(user=user, name__icontains=query)[:3]

    for supplier in suppliers:
        results.append(
            {
                "id": str(supplier.id),
                "type": "supplier",
                "title": supplier.name,
                "subtitle": f"{supplier.email or 'No email'} • {supplier.contact_person or 'No contact'}",
                "href": f"/dashboard/suppliers/{supplier.id}",
            }
        )

    return Response({"results": results, "total": len(results), "query": query})


"""
Notifications endpoint removed.
"""
