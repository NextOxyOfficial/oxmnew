from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from django.db.models import Sum
from django.utils import timezone
from products.models import Product, ProductSale
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

    # Order stats using ProductSale model
    sales = ProductSale.objects.filter(user=user)
    order_count = sales.count()
    # All sales are considered completed
    completed_orders = order_count
    total_revenue = sales.aggregate(total=Sum("total_amount"))["total"] or 0
    # No pending orders in ProductSale model
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


@api_view(["GET"])
@permission_classes([IsAuthenticated])
def get_notifications(request):
    """Get dynamic notifications for the user"""
    user = request.user
    notifications = []
    notification_id = 1

    try:
        # Get user's products for stock notifications
        products = Product.objects.filter(user=user)
        low_stock_products = products.filter(stock__lte=5, stock__gt=0).count()
        out_of_stock_products = products.filter(stock=0).count()

        # Low stock notification
        if low_stock_products > 0:
            notifications.append(
                {
                    "id": notification_id,
                    "title": "Low Stock Alert",
                    "message": f"{low_stock_products} product{'s' if low_stock_products != 1 else ''} running low on stock",
                    "type": "warning",
                    "timestamp": "Just now",
                    "read": False,
                }
            )
            notification_id += 1

        # Out of stock notification
        if out_of_stock_products > 0:
            notifications.append(
                {
                    "id": notification_id,
                    "title": "Out of Stock",
                    "message": f"{out_of_stock_products} product{'s' if out_of_stock_products != 1 else ''} out of stock",
                    "type": "error",
                    "timestamp": "5 minutes ago",
                    "read": False,
                }
            )
            notification_id += 1

        # Check for recent customers
        from customers.models import Customer

        recent_customers = Customer.objects.filter(user=user).order_by("-created_at")[
            :1
        ]
        if recent_customers.exists():
            customer = recent_customers.first()
            notifications.append(
                {
                    "id": notification_id,
                    "title": "New Customer",
                    "message": f"{customer.name} has been added to your customer list",
                    "type": "success",
                    "timestamp": "2 hours ago",
                    "read": False,
                }
            )
            notification_id += 1

        # Check for recent orders (using ProductSale)
        recent_sales = ProductSale.objects.filter(user=user).order_by("-sale_date")[:1]
        if recent_sales.exists():
            sale = recent_sales.first()
            notifications.append(
                {
                    "id": notification_id,
                    "title": "New Order",
                    "message": f"Sale #{sale.id} to {sale.customer_name or 'Guest'}",
                    "type": "info",
                    "timestamp": "3 hours ago",
                    "read": True,
                }
            )
            notification_id += 1

        # System notifications
        notifications.append(
            {
                "id": notification_id,
                "title": "System Update",
                "message": "OxyManager has been updated with new features",
                "type": "info",
                "timestamp": "1 day ago",
                "read": True,
            }
        )
        notification_id += 1

        # Welcome notification for new users
        if user.date_joined and (timezone.now() - user.date_joined).days < 7:
            notifications.insert(
                0,
                {
                    "id": notification_id,
                    "title": "Welcome to OxyManager!",
                    "message": "Get started by adding your first product or customer",
                    "type": "success",
                    "timestamp": "Welcome",
                    "read": False,
                },
            )

    except Exception as e:
        # Fallback notifications if there are any errors
        notifications = [
            {
                "id": 1,
                "title": "Welcome!",
                "message": "Welcome to OxyManager Business Suite",
                "type": "info",
                "timestamp": "Just now",
                "read": False,
            }
        ]

    return Response(
        {
            "notifications": notifications,
            "unread_count": len([n for n in notifications if not n["read"]]),
        }
    )
