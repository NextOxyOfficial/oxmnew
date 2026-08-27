"""Finding an order by typing roughly what you remember about it.

The list used to run DRF's SearchFilter across a handful of fields. That
answers "does this row contain the string", which is the wrong question for a
counter. A shopkeeper types "gpx chain" meaning *a chain, for a GPX* — two
words that will never appear together in one field, so the AND-across-terms
behaviour returned nothing. And when something did match, the results came back
newest-first, so the order that matched on three products sat below one that
matched on a stray word in its notes.

So: every term is scored independently, an order keeps the sum, and anything
scoring zero is dropped. The weights are ordered by how sure the match makes
us — an order number is nearly proof, a product name is strong evidence, a word
in the notes is a hint.

Because the terms are known here, the response can also say *which* products
matched, which is the part that makes a long result list readable: the
shopkeeper sees "চেইন স্প্রোকেট সেট" under order #2012 and knows immediately
whether it is the one.
"""

import re

from django.db.models import Case, Count, IntegerField, Q, Value, When

#: Weight per matched term, highest confidence first. A product match is
#: counted per matching item, so an order containing three of the searched
#: parts outranks one containing a single part.
W_ORDER_NUMBER = 60
W_CUSTOMER = 25
W_PHONE = 25
W_PRODUCT_ITEM = 12
W_VARIANT_ITEM = 6
W_NOTES = 3

#: Single letters match nearly everything and only add noise. Two is enough for
#: a part code like "R2" while still throwing away stray punctuation.
MIN_TERM = 2

#: Beyond this the query is a sentence, not a search, and each extra term costs
#: another set of annotations.
MAX_TERMS = 6


def parse_terms(raw):
    """Split what was typed into searchable words.

    A leading "#" is how the UI tells the user to search by order number, so it
    is stripped rather than searched for. Punctuation between words is treated
    as a separator so "GPX, chain" behaves like "GPX chain".
    """
    if not raw:
        return []
    cleaned = str(raw).strip().lstrip("#")
    parts = [part.strip() for part in re.split(r"[\s,;/]+", cleaned)]
    terms, seen = [], set()
    for part in parts:
        lowered = part.lower()
        if len(part) < MIN_TERM or lowered in seen:
            continue
        seen.add(lowered)
        terms.append(part)
        if len(terms) >= MAX_TERMS:
            break
    # A one-character query is still a real intent — search it as typed rather
    # than returning the whole book.
    if not terms and cleaned:
        terms = [cleaned]
    return terms


def _weighted(condition, weight):
    return Case(When(condition, then=Value(weight)), default=Value(0),
                output_field=IntegerField())


def apply(queryset, terms):
    """Annotate a relevance score, keep only what matched, best first.

    Returns the queryset unchanged when there is nothing to search for, so the
    caller does not need to branch.
    """
    if not terms:
        return queryset

    score = Value(0, output_field=IntegerField())
    keep = Q()

    for term in terms:
        # Counting matching *items* rather than testing existence is what makes
        # "brake pad filter" rank an order holding both above one holding either.
        product_hits = Count(
            "items", filter=Q(items__product_name__icontains=term), distinct=True
        )
        variant_hits = Count(
            "items", filter=Q(items__variant_details__icontains=term), distinct=True
        )

        score = (
            score
            + _weighted(Q(order_number__icontains=term), W_ORDER_NUMBER)
            + _weighted(Q(customer_name__icontains=term), W_CUSTOMER)
            + _weighted(Q(customer_phone__icontains=term), W_PHONE)
            + _weighted(Q(notes__icontains=term), W_NOTES)
            + product_hits * Value(W_PRODUCT_ITEM)
            + variant_hits * Value(W_VARIANT_ITEM)
        )

        # OR across terms, not AND: "gpx chain" should still find the chain
        # even when the bike's name is nowhere on the order. Ranking, not
        # filtering, is what pushes the orders matching both to the top.
        keep |= (
            Q(order_number__icontains=term)
            | Q(customer_name__icontains=term)
            | Q(customer_phone__icontains=term)
            | Q(notes__icontains=term)
            | Q(items__product_name__icontains=term)
            | Q(items__variant_details__icontains=term)
        )

    # A digits-only query is almost always the order id off a printed slip.
    numeric = [term for term in terms if term.isdigit()]
    if numeric:
        keep |= Q(id__in=[int(term) for term in numeric])
        score = score + _weighted(
            Q(id__in=[int(term) for term in numeric]), W_ORDER_NUMBER
        )

    return (
        queryset.filter(keep)
        .annotate(match_score=score)
        .distinct()
        .order_by("-match_score", "-created_at")
    )


def matched_item_names(order, terms, limit=6):
    """Which of this order's products the search actually hit.

    Reads the already-prefetched items rather than querying again, so adding
    this to a page of results costs nothing.
    """
    if not terms:
        return []
    lowered = [term.lower() for term in terms]
    names = []
    for item in order.items.all():
        haystack = f"{item.product_name or ''} {item.variant_details or ''}".lower()
        if any(term in haystack for term in lowered):
            label = item.product_name or ""
            if item.variant_details:
                label = f"{label} ({item.variant_details})"
            if label and label not in names:
                names.append(label)
            if len(names) >= limit:
                break
    return names
