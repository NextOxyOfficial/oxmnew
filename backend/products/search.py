"""Finding a product by typing the bits of its name you remember.

The picker matched the whole typed string against the name in one piece, so
"motul 10w40" could only find a product whose name contained those two words
side by side. "Motul Royel 10W40 Mineral" — the one actually being looked for —
never appeared, because "Royel" sits between them. In a parts shop that is the
normal case: names carry a brand, a grade, a model and a spec, and nobody
recalls them in the stored order.

So each word is matched on its own and **all** of them must appear somewhere on
the product. That keeps the list tight (two words narrow rather than widen it)
while freeing the order they are typed in. Ranking then puts the closest names
first, and in-stock items above ones that cannot actually be sold today.

The tokeniser is shared with the order search, so "chain, kit" and "chain kit"
behave the same everywhere in the app.
"""

from django.db.models import Case, IntegerField, Q, Value, When

from orders.search import parse_terms  # one tokenising rule for the whole app

#: Ranking weights, strongest evidence first.
W_NAME_STARTS = 120  # the whole query opens the name — almost certainly it
W_NAME_TERM = 20
W_CODE_TERM = 12
W_CATEGORY_TERM = 4
W_IN_STOCK = 8  # a tiebreak, never enough to outrank a better name


def _weighted(condition, weight):
    return Case(
        When(condition, then=Value(weight)),
        default=Value(0),
        output_field=IntegerField(),
    )


def apply(queryset, raw):
    """Filter and rank `queryset` for what was typed.

    Returns (queryset, terms). With nothing searchable the queryset comes back
    untouched, so the caller does not need to branch.
    """
    terms = parse_terms(raw)
    if not terms:
        return queryset, terms

    score = _weighted(Q(name__istartswith=(raw or "").strip()), W_NAME_STARTS)
    score = score + _weighted(Q(stock__gt=0), W_IN_STOCK)

    for term in terms:
        # AND across terms: every word has to be somewhere on the product.
        # OR across fields: it does not matter which part of it carries them,
        # so a grade in the name and a brand in the category still match.
        queryset = queryset.filter(
            Q(name__icontains=term)
            | Q(product_code__icontains=term)
            | Q(category__name__icontains=term)
            | Q(variants__color__icontains=term)
            | Q(variants__size__icontains=term)
            | Q(variants__custom_variant__icontains=term)
        )
        score = (
            score
            + _weighted(Q(name__icontains=term), W_NAME_TERM)
            + _weighted(Q(product_code__icontains=term), W_CODE_TERM)
            + _weighted(Q(category__name__icontains=term), W_CATEGORY_TERM)
        )

    return (
        queryset.annotate(match_score=score)
        .distinct()
        .order_by("-match_score", "name"),
        terms,
    )
