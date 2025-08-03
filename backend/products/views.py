import csv
import json

from django.db import transaction
from django.db.models import Count, Q, Sum
from django_filters.rest_framework import DjangoFilterBackend
from rest_framework import filters, status, viewsets
from rest_framework.decorators import action
from rest_framework.parsers import FormParser, JSONParser, MultiPartParser
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response

from .models import Product, ProductPhoto, ProductStockMovement, ProductVariant
from .serializers import (
    ProductCreateSerializer,
    ProductDetailSerializer,
    ProductListSerializer,
    ProductPhotoSerializer,
    ProductStockMovementSerializer,
    ProductVariantSerializer,
)


class ProductViewSet(viewsets.ModelViewSet):
    """ViewSet for managing products"""

    permission_classes = [IsAuthenticated]
    parser_classes = [MultiPartParser, FormParser, JSONParser]
    filter_backends = [
        DjangoFilterBackend,
        filters.SearchFilter,
        filters.OrderingFilter,
    ]
    filterset_fields = ["category", "supplier", "has_variants", "is_active"]
    search_fields = ["name", "details", "location"]
    ordering_fields = ["name", "created_at", "updated_at", "buy_price", "sell_price"]
    ordering = ["-created_at"]

    def get_queryset(self):
        """Return products for the authenticated user"""
        return (
            Product.objects.filter(user=self.request.user)
            .select_related("category", "supplier")
            .prefetch_related("variants", "photos")
        )

    def get_serializer_class(self):
        """Return appropriate serializer based on action"""
        if self.action == "list":
            return ProductListSerializer
        elif self.action == "create":
            return ProductCreateSerializer
        else:
            return ProductDetailSerializer

    def create(self, request, *args, **kwargs):
        """Create a new product with custom handling for FormData"""
        data = request.data.copy()

        print("=== BACKEND CREATE PRODUCT DEBUG ===")
        print("Original request.data keys:", list(request.data.keys()))
        print("Original request.FILES keys:", list(request.FILES.keys()))

        # Handle photos from FormData
        photos = []

        # Check if photos are sent as a list with the same key
        if "photos" in request.FILES:
            photos_files = request.FILES.getlist("photos")
            photos.extend(photos_files)
            print(f"Found {len(photos_files)} photos with key 'photos'")

        # Also check for photos with different keys (e.g., photos[0], photos[1], etc.)
        for key in request.FILES:
            if key.startswith("photos") and key != "photos":
                photos.append(request.FILES[key])
                print(f"Found photo with key '{key}'")

        print(f"Total photos found: {len(photos)}")

        # Handle colorSizeVariants JSON string
        if "colorSizeVariants" in data and isinstance(data["colorSizeVariants"], str):
            try:
                parsed_variants = json.loads(data["colorSizeVariants"])

                # Handle case where the variants might be nested in another array
                # This can happen if the data gets processed multiple times
                if (
                    isinstance(parsed_variants, list)
                    and len(parsed_variants) == 1
                    and isinstance(parsed_variants[0], list)
                ):
                    print("Detected nested array in colorSizeVariants, flattening...")
                    parsed_variants = parsed_variants[0]

                data["colorSizeVariants"] = parsed_variants
                print("Parsed colorSizeVariants:", parsed_variants)
                print("Type after parsing:", type(parsed_variants))
            except json.JSONDecodeError as e:
                print("JSON decode error:", str(e))
                print("Raw colorSizeVariants data:", repr(data["colorSizeVariants"]))
                return Response(
                    {"error": f"Invalid colorSizeVariants JSON: {str(e)}"},
                    status=status.HTTP_400_BAD_REQUEST,
                )

        # Convert string boolean values
        if "hasVariants" in data:
            data["hasVariants"] = data["hasVariants"] in ["true", "True", True]
            print("Converted hasVariants:", data["hasVariants"])
        elif "has_variants" in data:
            data["has_variants"] = data["has_variants"] in ["true", "True", True]
            print("Converted has_variants:", data["has_variants"])

        # Convert numeric fields - handle both snake_case and camelCase
        numeric_fields = ["buyPrice", "sellPrice", "stock", "buy_price", "sell_price"]
        for field in numeric_fields:
            if field in data and data[field]:
                try:
                    if field == "stock":
                        data[field] = int(data[field])
                    else:
                        data[field] = float(data[field])
                    print(f"Converted {field}:", data[field])
                except (ValueError, TypeError):
                    data[field] = 0
                    print(f"Failed to convert {field}, set to 0")

        print(
            "Final data for serializer:",
            {k: v for k, v in data.items() if k != "photos"},
        )
        print("Photos in data:", len(photos))

        # Debug colorSizeVariants specifically
        if "colorSizeVariants" in data:
            print("=== colorSizeVariants DEBUG ===")
            print("Type:", type(data["colorSizeVariants"]))
            print("Value:", data["colorSizeVariants"])
            print("Is list?", isinstance(data["colorSizeVariants"], list))
            if (
                isinstance(data["colorSizeVariants"], list)
                and data["colorSizeVariants"]
            ):
                print("First element type:", type(data["colorSizeVariants"][0]))
                print("First element:", data["colorSizeVariants"][0])
        else:
            print("colorSizeVariants not in data")

        # Don't add photos to data - handle them separately
        # Remove any photos from data to avoid validation issues
        if "photos" in data:
            del data["photos"]

        # Prepare clean data for serializer to avoid QueryDict nesting issues
        # Only include fields that are supported by the serializer
        serializer_class = self.get_serializer_class()
        valid_fields = set(serializer_class.Meta.fields)

        # Map snake_case field names to camelCase for the serializer
        field_mapping = {
            "buy_price": "buyPrice",
            "sell_price": "sellPrice",
            "product_code": "productCode",
            "has_variants": "hasVariants",
        }

        serializer_data = {}
        for key, value in data.items():
            # Check if it's a direct valid field or needs mapping
            mapped_key = field_mapping.get(key, key)

            if (
                mapped_key in valid_fields or key == "colorSizeVariants"
            ):  # colorSizeVariants is write_only
                if key == "colorSizeVariants" and isinstance(value, list):
                    # Ensure we pass the list directly, not nested
                    if value and isinstance(value[0], list):
                        print(
                            "WARNING: Flattening nested colorSizeVariants before serializer"
                        )
                        serializer_data[key] = value[0]
                    else:
                        serializer_data[key] = value
                else:
                    # Use the mapped key for the serializer
                    serializer_data[mapped_key] = value
            else:
                print(f"Skipping unknown field: {key}")

        print("=== SERIALIZER INPUT DATA ===")
        print("serializer_data:", serializer_data)
        if "colorSizeVariants" in serializer_data:
            print("colorSizeVariants type:", type(serializer_data["colorSizeVariants"]))
            print("colorSizeVariants value:", serializer_data["colorSizeVariants"])

        # Create serializer with clean data
        serializer = self.get_serializer(data=serializer_data)
        print("Serializer data before validation:", serializer.initial_data)

        if serializer.is_valid():
            print("Serializer is valid, proceeding to save")
            # Save the product first
            product = serializer.save()

            # Now handle photos separately
            if photos:
                print(f"Creating {len(photos)} ProductPhoto objects")
                for i, photo in enumerate(photos):
                    ProductPhoto.objects.create(product=product, image=photo, order=i)

            response_serializer = ProductDetailSerializer(
                product, context={"request": request}
            )
            return Response(response_serializer.data, status=status.HTTP_201_CREATED)
        else:
            print("Serializer validation errors:", serializer.errors)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    @action(detail=True, methods=["post"])
    def add_variant(self, request, pk=None):
        """Add a new variant to an existing product"""
        product = self.get_object()

        if not product.has_variants:
            return Response(
                {"error": "This product does not support variants"},
                status=status.HTTP_400_BAD_REQUEST,
            )

        serializer = ProductVariantSerializer(data=request.data)
        if serializer.is_valid():
            serializer.save(product=product)
            return Response(serializer.data, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    @action(
        detail=True,
        methods=["patch", "delete"],
        url_path="variants/(?P<variant_id>[^/.]+)",
    )
    def manage_variant(self, request, pk=None, variant_id=None):
        """Update or delete a specific variant"""
        product = self.get_object()

        try:
            variant = product.variants.get(id=variant_id)
        except ProductVariant.DoesNotExist:
            return Response(
                {"error": "Variant not found"}, status=status.HTTP_404_NOT_FOUND
            )

        if request.method == "PATCH":
            serializer = ProductVariantSerializer(
                variant, data=request.data, partial=True
            )
            if serializer.is_valid():
                serializer.save()
                return Response(serializer.data)
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

        elif request.method == "DELETE":
            variant.delete()
            return Response(status=status.HTTP_204_NO_CONTENT)

    @action(detail=True, methods=["post"])
    def add_photos(self, request, pk=None):
        """Add photos to a product"""
        product = self.get_object()
        photos = request.FILES.getlist("photos")

        if not photos:
            return Response(
                {"error": "No photos provided"}, status=status.HTTP_400_BAD_REQUEST
            )

        created_photos = []
        for i, photo in enumerate(photos):
            # Get the current max order
            max_order = (
                product.photos.aggregate(max_order=Sum("order"))["max_order"] or 0
            )

            photo_obj = ProductPhoto.objects.create(
                product=product, image=photo, order=max_order + i + 1
            )
            created_photos.append(photo_obj)

        serializer = ProductPhotoSerializer(created_photos, many=True)
        return Response(serializer.data, status=status.HTTP_201_CREATED)

    @action(detail=True, methods=["delete"], url_path="photos/(?P<photo_id>[^/.]+)")
    def delete_photo(self, request, pk=None, photo_id=None):
        """Delete a specific photo"""
        product = self.get_object()

        try:
            photo = product.photos.get(id=photo_id)
        except ProductPhoto.DoesNotExist:
            return Response(
                {"error": "Photo not found"}, status=status.HTTP_404_NOT_FOUND
            )

        photo.delete()
        return Response(status=status.HTTP_204_NO_CONTENT)

    @action(detail=True, methods=["post"])
    def adjust_stock(self, request, pk=None):
        """Adjust product stock"""
        product = self.get_object()
        variant_id = request.data.get("variant_id")
        quantity = request.data.get("quantity")
        reason = request.data.get("reason", "Manual adjustment")
        notes = request.data.get("notes", "")

        if quantity is None:
            return Response(
                {"error": "Quantity is required"}, status=status.HTTP_400_BAD_REQUEST
            )

        try:
            quantity = int(quantity)
        except (ValueError, TypeError):
            return Response(
                {"error": "Invalid quantity"}, status=status.HTTP_400_BAD_REQUEST
            )

        with transaction.atomic():
            if variant_id:
                try:
                    variant = product.variants.get(id=variant_id)
                except ProductVariant.DoesNotExist:
                    return Response(
                        {"error": "Variant not found"}, status=status.HTTP_404_NOT_FOUND
                    )

                previous_stock = variant.stock
                new_stock = max(0, previous_stock + quantity)
                variant.stock = new_stock
                variant.save()

                # Record stock movement
                ProductStockMovement.objects.create(
                    product=product,
                    variant=variant,
                    user=request.user,
                    movement_type="adjustment",
                    quantity=quantity,
                    previous_stock=previous_stock,
                    new_stock=new_stock,
                    reason=reason,
                    notes=notes,
                )

                return Response(
                    {
                        "message": "Stock adjusted successfully",
                        "previous_stock": previous_stock,
                        "new_stock": new_stock,
                        "variant_id": variant.id,
                    }
                )
            else:
                previous_stock = product.stock
                new_stock = max(0, previous_stock + quantity)
                product.stock = new_stock
                product.save()

                # Record stock movement
                ProductStockMovement.objects.create(
                    product=product,
                    user=request.user,
                    movement_type="adjustment",
                    quantity=quantity,
                    previous_stock=previous_stock,
                    new_stock=new_stock,
                    reason=reason,
                    notes=notes,
                )

                return Response(
                    {
                        "message": "Stock adjusted successfully",
                        "previous_stock": previous_stock,
                        "new_stock": new_stock,
                    }
                )

    @action(detail=False, methods=["post"])
    def upload_csv(self, request):
        """Upload products from CSV file"""
        if "csv_file" not in request.FILES:
            return Response(
                {"error": "No CSV file provided"}, status=status.HTTP_400_BAD_REQUEST
            )

        csv_file = request.FILES["csv_file"]

        if not csv_file.name.endswith(".csv"):
            return Response(
                {"error": "File must be a CSV file"}, status=status.HTTP_400_BAD_REQUEST
            )

        try:
            # Reset file pointer and read CSV
            csv_file.seek(0)
            decoded_file = csv_file.read().decode("utf-8")
            lines = decoded_file.splitlines()
            csv_reader = csv.DictReader(lines)

            products_created = 0
            products_errors = []

            with transaction.atomic():
                for row_num, row in enumerate(
                    csv_reader, start=2
                ):  # Start at 2 to account for header
                    try:
                        # Clean and validate data
                        name = row.get("name", "").strip()
                        if not name:
                            products_errors.append(
                                f"Row {row_num}: Product name is required"
                            )
                            continue

                        # Check for existing product with same name for this user
                        if Product.objects.filter(
                            name=name, user=request.user
                        ).exists():
                            products_errors.append(
                                f"Row {row_num}: Product '{name}' already exists"
                            )
                            continue

                        # Parse basic fields
                        product_data = {
                            "name": name,
                            "product_code": row.get("product_code", "").strip() or None,
                            "location": row.get("location", "").strip() or None,
                            "details": row.get("details", "").strip() or "",
                            "user": request.user,
                            "has_variants": False,  # Default for CSV upload
                        }

                        # Parse prices with validation
                        try:
                            buy_price = float(row.get("buy_price", 0))
                            sell_price = float(row.get("sell_price", 0))

                            if buy_price <= 0:
                                products_errors.append(
                                    f"Row {row_num}: Buy price must be greater than 0"
                                )
                                continue
                            if sell_price <= 0:
                                products_errors.append(
                                    f"Row {row_num}: Sell price must be greater than 0"
                                )
                                continue
                            if sell_price < buy_price:
                                products_errors.append(
                                    f"Row {row_num}: Sell price must be >= buy price"
                                )
                                continue

                            product_data["buy_price"] = buy_price
                            product_data["sell_price"] = sell_price
                        except (ValueError, TypeError):
                            products_errors.append(
                                f"Row {row_num}: Invalid price values"
                            )
                            continue

                        # Parse stock
                        try:
                            stock = int(row.get("stock", 0))
                            if stock <= 0:
                                products_errors.append(
                                    f"Row {row_num}: Stock quantity must be greater than 0"
                                )
                                continue
                            product_data["stock"] = stock
                        except (ValueError, TypeError):
                            products_errors.append(
                                f"Row {row_num}: Invalid stock value"
                            )
                            continue

                        # Handle category
                        category_name = row.get("category", "").strip()
                        if category_name:
                            try:
                                from core.models import Category

                                category, created = Category.objects.get_or_create(
                                    name=category_name,
                                    user=request.user,
                                    defaults={"is_active": True},
                                )
                                product_data["category"] = category
                            except Exception as e:
                                products_errors.append(
                                    f"Row {row_num}: Error with category: {str(e)}"
                                )
                                continue

                        # Handle supplier
                        supplier_name = row.get("supplier", "").strip()
                        if supplier_name:
                            try:
                                from suppliers.models import Supplier

                                supplier, created = Supplier.objects.get_or_create(
                                    name=supplier_name,
                                    user=request.user,
                                    defaults={"is_active": True},
                                )
                                product_data["supplier"] = supplier
                            except Exception as e:
                                products_errors.append(
                                    f"Row {row_num}: Error with supplier: {str(e)}"
                                )
                                continue

                        # Create the product
                        Product.objects.create(**product_data)
                        products_created += 1

                    except Exception as e:
                        products_errors.append(f"Row {row_num}: {str(e)}")
                        continue

            return Response(
                {
                    "success": True,
                    "products_created": products_created,
                    "errors": products_errors,
                    "message": f"Successfully created {products_created} products",
                },
                status=status.HTTP_201_CREATED,
            )

        except Exception as e:
            return Response(
                {"error": f"Error processing CSV file: {str(e)}"},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR,
            )

    @action(detail=False, methods=["get"])
    def download_csv_template(self, request):
        """Download CSV template for product upload"""
        from django.http import HttpResponse

        response = HttpResponse(content_type="text/csv")
        response["Content-Disposition"] = 'attachment; filename="products_template.csv"'

        writer = csv.writer(response)
        writer.writerow(
            [
                "name",
                "product_code",
                "category",
                "supplier",
                "location",
                "details",
                "buy_price",
                "sell_price",
                "stock",
            ]
        )

        # Add sample data
        writer.writerow(
            [
                "Sample Product 1",
                "SP001",
                "Electronics",
                "Sample Supplier",
                "Warehouse A",
                "Sample product description",
                "50.00",
                "75.00",
                "100",
            ]
        )
        writer.writerow(
            [
                "Sample Product 2",
                "",  # Empty product_code to show it's optional
                "Clothing",
                "Another Supplier",
                "Store Room B",
                "Another sample product",
                "25.00",
                "40.00",
                "50",
            ]
        )

        return response

    @action(detail=False, methods=["get"])
    def statistics(self, request):
        """Get product statistics"""
        queryset = self.get_queryset()

        total_products = queryset.count()
        active_products = queryset.filter(is_active=True).count()
        products_with_variants = queryset.filter(has_variants=True).count()
        total_stock = sum(product.total_stock for product in queryset)

        # Calculate total inventory value
        total_value = 0
        for product in queryset:
            if product.has_variants:
                for variant in product.variants.all():
                    total_value += variant.stock * variant.buy_price
            else:
                total_value += product.stock * product.buy_price

        # Low stock products (less than 10 items)
        low_stock_products = []
        for product in queryset:
            if product.has_variants:
                for variant in product.variants.all():
                    if variant.stock < 10:
                        low_stock_products.append(
                            {
                                "product": product.name,
                                "variant": str(variant),
                                "stock": variant.stock,
                            }
                        )
            else:
                if product.stock < 10:
                    low_stock_products.append(
                        {
                            "product": product.name,
                            "variant": None,
                            "stock": product.stock,
                        }
                    )

        return Response(
            {
                "total_products": total_products,
                "active_products": active_products,
                "products_with_variants": products_with_variants,
                "total_stock": total_stock,
                "total_inventory_value": total_value,
                "low_stock_count": len(low_stock_products),
                "low_stock_products": low_stock_products[:10],  # Limit to first 10
            }
        )

    @action(detail=False, methods=["get"])
    def stats(self, request):
        """Get product statistics"""
        queryset = self.get_queryset()

        total_products = queryset.count()
        active_products = queryset.filter(is_active=True).count()
        low_stock_products = queryset.filter(stock__lte=10).count()
        out_of_stock_products = queryset.filter(stock=0).count()

        # Calculate total inventory value
        total_buy_value = sum(product.total_buy_price for product in queryset)
        total_sell_value = sum(product.total_sell_price for product in queryset)

        # Get top categories
        category_stats = (
            queryset.values("category__name")
            .annotate(count=Count("id"))
            .order_by("-count")[:5]
        )

        return Response(
            {
                "total_products": total_products,
                "active_products": active_products,
                "low_stock_products": low_stock_products,
                "out_of_stock_products": out_of_stock_products,
                "total_buy_value": float(total_buy_value),
                "total_sell_value": float(total_sell_value),
                "top_categories": list(category_stats),
            }
        )

    @action(detail=False, methods=["get"])
    def search(self, request):
        """Advanced search endpoint for products"""
        query = request.query_params.get("q", "").strip()

        if not query or len(query) < 2:
            return Response({"results": [], "total": 0})

        queryset = self.get_queryset()

        # Search in multiple fields
        search_results = queryset.filter(
            Q(name__icontains=query)
            | Q(details__icontains=query)
            | Q(location__icontains=query)
            | Q(category__name__icontains=query)
            | Q(supplier__name__icontains=query)
        ).distinct()

        # Format results for frontend
        results = []
        for product in search_results[:10]:  # Limit to 10 results
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

        return Response(
            {"results": results, "total": search_results.count(), "query": query}
        )


class ProductStockMovementViewSet(viewsets.ReadOnlyModelViewSet):
    """ViewSet for viewing stock movements"""

    serializer_class = ProductStockMovementSerializer
    permission_classes = [IsAuthenticated]
    filter_backends = [DjangoFilterBackend, filters.OrderingFilter]
    filterset_fields = ["product", "variant", "movement_type"]
    ordering_fields = ["created_at"]
    ordering = ["-created_at"]

    def get_queryset(self):
        """Return stock movements for the authenticated user"""
        return ProductStockMovement.objects.filter(
            user=self.request.user
        ).select_related("product", "variant")
