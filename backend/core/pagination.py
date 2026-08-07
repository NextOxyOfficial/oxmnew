from rest_framework.pagination import PageNumberPagination


class StandardPagination(PageNumberPagination):
    """Default paginator for every list endpoint.

    Plain PageNumberPagination ignores `?page_size=`, so the "কয়টা দেখাবেন"
    selector on the list screens had no effect — the client asked for 25 rows and
    silently got 10. Allowing the query param makes that control real, and the
    max_page_size cap keeps a hand-crafted `?page_size=100000` from turning a
    list request into a full table dump.
    """

    page_size_query_param = "page_size"
    # 500, not 200: several screens legitimately need the whole customer
    # book at once (duplicate detection, the customer picker, name
    # lookups). Anything larger should paginate server-side instead.
    max_page_size = 500
