import json
import os
from decimal import Decimal, InvalidOperation

import requests
from django.conf import settings
from django.db import transaction
from django.db import IntegrityError
from django.utils import timezone
from rest_framework import status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from shurjopay_plugin import *

from .models import PaymentTransaction, SMSPackage, SubscriptionPlan, UserSMSCredit, UserSubscription

# Use absolute path for log directory to avoid permission issues
BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
SHURJOPAY_LOG = os.path.join(BASE_DIR, "logs", "shurjopay_live.log")

engine = ShurjopayPlugin(
    ShurjoPayConfigModel(
        SP_USERNAME=settings.SP_USERNAME,
        SP_PASSWORD=settings.SP_PASSWORD,
        SP_ENDPOINT=settings.SP_ENDPOINT,
        SP_RETURN=settings.SP_RETURN,
        SP_CANCEL=settings.SP_CANCEL,
        SP_PREFIX=settings.SP_PREFIX,
        SP_LOGDIR=SHURJOPAY_LOG,
    )
)


@api_view(["GET"])
@permission_classes([IsAuthenticated])
def verifyPayment(request):
    # Extracting query parameters
    required_params = [
        "sp_order_id",
    ]

    # Check if all required parameters are provided
    missing_params = [
        param for param in required_params if param not in request.query_params
    ]
    if missing_params:
        return Response(
            {"error": f"Missing mandatory parameters: {', '.join(missing_params)}"},
            status=status.HTTP_400_BAD_REQUEST,
        )
    oid = request.query_params.get("sp_order_id")

    try:
        payment_details = engine.verify_payment(oid)

        if hasattr(payment_details, "__dict__"):
            payment_details_dict = payment_details.__dict__
        else:
            return Response(
                {"error": "Payment details could not be serialized."},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR,
            )

        def _extract_str_candidates(obj, keys):
            candidates = []
            if not isinstance(obj, dict):
                return candidates
            for key in keys:
                val = obj.get(key)
                if isinstance(val, str) and val.strip():
                    candidates.append(val.strip())
            return candidates

        message_candidates = _extract_str_candidates(
            payment_details_dict,
            [
                "shurjopay_message",
                "sp_message",
                "message",
                "msg",
            ],
        )
        data_obj = payment_details_dict.get("data")
        if isinstance(data_obj, dict):
            message_candidates.extend(
                _extract_str_candidates(
                    data_obj,
                    [
                        "shurjopay_message",
                        "sp_message",
                        "message",
                        "msg",
                    ],
                )
            )

        shurjopay_message = message_candidates[0] if message_candidates else None
        msg_normalized = (str(shurjopay_message).strip().lower() if shurjopay_message else "")

        is_successful = (
            msg_normalized in {"success", "successful"}
            or payment_details_dict.get("payment_verification_status") is True
            or payment_details_dict.get("bank_status") == "Completed"
        )

        order_id_candidates = _extract_str_candidates(
            payment_details_dict,
            [
                "customer_order_id",
                "merchant_invoice_no",
                "merchant_invoice",
                "invoice_no",
                "invoice",
                "order_id",
            ],
        )
        if isinstance(data_obj, dict):
            order_id_candidates.extend(
                _extract_str_candidates(
                    data_obj,
                    [
                        "customer_order_id",
                        "merchant_invoice_no",
                        "merchant_invoice",
                        "invoice_no",
                        "invoice",
                        "order_id",
                    ],
                )
            )

        gateway_customer_order_id = next(
            (
                c
                for c in order_id_candidates
                if isinstance(c, str) and c.startswith(("SUB-", "SMS-", "BANK-"))
            ),
            None,
        )
        if not gateway_customer_order_id:
            gateway_customer_order_id = order_id_candidates[0] if order_id_candidates else None

        amount = (
            payment_details_dict.get("amount")
            or payment_details_dict.get("payable_amount")
            or payment_details_dict.get("received_amount")
        )
        currency = payment_details_dict.get("currency") or ""

        payment_type = "unknown"

        credits_added = None
        total_credits = None
        applied = False
        application_error = None

        with transaction.atomic():
            txn = PaymentTransaction.objects.select_for_update().filter(sp_order_id=oid).first()
            if txn and txn.user_id != request.user.id:
                return Response(
                    {"error": "This payment does not belong to the authenticated user."},
                    status=status.HTTP_403_FORBIDDEN,
                )

            if not txn and gateway_customer_order_id:
                txn = (
                    PaymentTransaction.objects.select_for_update()
                    .filter(customer_order_id=gateway_customer_order_id)
                    .first()
                )
                if txn and txn.user_id != request.user.id:
                    return Response(
                        {"error": "This payment does not belong to the authenticated user."},
                        status=status.HTTP_403_FORBIDDEN,
                    )

            if not txn:
                txn = PaymentTransaction.objects.create(
                    user=request.user,
                    customer_order_id=gateway_customer_order_id or oid,
                )

            original_customer_order_id = txn.customer_order_id
            canonical_customer_order_id = txn.customer_order_id
            if (
                gateway_customer_order_id
                and isinstance(gateway_customer_order_id, str)
                and gateway_customer_order_id != canonical_customer_order_id
                and (
                    gateway_customer_order_id.startswith("SUB-")
                    or gateway_customer_order_id.startswith("SMS-")
                )
                and (
                    not isinstance(canonical_customer_order_id, str)
                    or not (
                        canonical_customer_order_id.startswith("SUB-")
                        or canonical_customer_order_id.startswith("SMS-")
                    )
                )
            ):
                try:
                    txn.customer_order_id = gateway_customer_order_id
                    canonical_customer_order_id = gateway_customer_order_id
                except Exception:
                    pass

            payment_type = "unknown"
            if isinstance(canonical_customer_order_id, str):
                if canonical_customer_order_id.startswith("SUB-"):
                    payment_type = "subscription"
                elif canonical_customer_order_id.startswith("SMS-"):
                    payment_type = "sms_package"

            sms_package_id = None
            sms_qty = 1
            if payment_type == "sms_package" and isinstance(canonical_customer_order_id, str):
                parts = canonical_customer_order_id.split("-")
                if len(parts) >= 2:
                    try:
                        sms_package_id = int(parts[1])
                    except Exception:
                        sms_package_id = None

                for part in parts:
                    if isinstance(part, str) and len(part) >= 2 and part[0].lower() == "q":
                        try:
                            parsed_qty = int(part[1:])
                            if parsed_qty > 0:
                                sms_qty = parsed_qty
                        except Exception:
                            pass

            txn.sp_order_id = oid
            txn.payment_type = payment_type
            txn.is_successful = is_successful
            if amount is not None:
                try:
                    txn.amount = amount
                except Exception:
                    pass
            txn.currency = currency
            txn.raw_response = json.dumps(payment_details_dict, default=str)

            if is_successful and not txn.is_applied:
                if payment_type == "subscription":
                    plan_slug = None
                    if isinstance(canonical_customer_order_id, str):
                        parts = canonical_customer_order_id.split("-")
                        if len(parts) >= 2:
                            plan_slug = parts[1].lower()

                    try:
                        if plan_slug:
                            plan = SubscriptionPlan.objects.get(name__iexact=plan_slug)
                        else:
                            plan = SubscriptionPlan.objects.get(name__iexact="pro")

                        user_subscription, created = UserSubscription.objects.get_or_create(
                            user=request.user,
                            defaults={
                                "plan": plan,
                                "active": True,
                            },
                        )
                        if not created:
                            user_subscription.plan = plan
                            user_subscription.active = True
                            user_subscription.save()

                        txn.is_applied = True
                        txn.applied_at = timezone.now()
                        applied = True
                    except SubscriptionPlan.DoesNotExist:
                        application_error = "Subscription plan not found"

                elif payment_type == "sms_package":
                    if sms_package_id is not None:
                        try:
                            sms_package = SMSPackage.objects.get(id=sms_package_id)
                            user_sms_credit, _ = UserSMSCredit.objects.get_or_create(
                                user=request.user,
                                defaults={"credits": 0},
                            )
                            add_credits = sms_package.sms_count * max(sms_qty, 1)
                            user_sms_credit.credits += add_credits
                            user_sms_credit.save()
                            credits_added = add_credits
                            total_credits = user_sms_credit.credits

                            txn.is_applied = True
                            txn.applied_at = timezone.now()
                            applied = True
                        except SMSPackage.DoesNotExist:
                            application_error = "SMS package not found"

            if (
                is_successful
                and payment_type == "sms_package"
                and txn.is_applied
                and credits_added is None
                and sms_package_id is not None
            ):
                try:
                    sms_package = SMSPackage.objects.get(id=sms_package_id)
                    credits_added = sms_package.sms_count * max(sms_qty, 1)
                    user_sms_credit = UserSMSCredit.objects.filter(user=request.user).first()
                    if user_sms_credit:
                        total_credits = user_sms_credit.credits
                except SMSPackage.DoesNotExist:
                    application_error = application_error or "SMS package not found"

            try:
                txn.save()
            except IntegrityError:
                try:
                    txn.customer_order_id = original_customer_order_id
                    txn.save()
                except Exception:
                    raise

        payment_details_dict["customer_order_id"] = txn.customer_order_id
        payment_details_dict["payment_type"] = payment_type
        payment_details_dict["applied"] = applied or (txn.is_applied if txn else False)
        if application_error:
            payment_details_dict["application_error"] = application_error
        if credits_added is not None:
            payment_details_dict["credits_added"] = credits_added
        if total_credits is not None:
            payment_details_dict["total_credits"] = total_credits

        return Response(payment_details_dict, status=status.HTTP_200_OK)
    except Exception as e:
        return Response({"error": str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


@api_view(["GET"])
@permission_classes([IsAuthenticated])
def makePayment(request):
    # Extracting query parameters
    required_params = [
        "amount",
        "order_id",
        "currency",
        "customer_name",
        "customer_address",
        "customer_phone",
        "customer_city",
        "customer_post_code",
    ]

    # Check if all required parameters are provided
    missing_params = [
        param for param in required_params if param not in request.query_params
    ]
    if missing_params:
        return Response(
            {"error": f"Missing mandatory parameters: {', '.join(missing_params)}"},
            status=status.HTTP_400_BAD_REQUEST,
        )

    try:
        # Extract parameters from the request
        amount = request.query_params.get("amount")
        order_id = request.query_params.get("order_id")
        currency = request.query_params.get("currency")
        customer_name = request.query_params.get("customer_name")
        customer_address = request.query_params.get("customer_address")
        customer_phone = request.query_params.get("customer_phone")
        customer_city = request.query_params.get("customer_city")
        customer_post_code = request.query_params.get("customer_post_code")

        payment_type = "unknown"
        if isinstance(order_id, str):
            if order_id.startswith("SUB-"):
                payment_type = "subscription"
            elif order_id.startswith("SMS-"):
                payment_type = "sms_package"

        defaults = {
            "payment_type": payment_type,
            "currency": currency or "",
            "raw_response": "",
            "is_successful": False,
            "is_applied": False,
        }
        if amount is not None:
            try:
                defaults["amount"] = Decimal(str(amount))
            except (InvalidOperation, TypeError, ValueError):
                pass

        PaymentTransaction.objects.get_or_create(
            user=request.user,
            customer_order_id=order_id,
            defaults=defaults,
        )

        payment_details_dict = None
        plugin_error = None
        try:
            model = PaymentRequestModel(
                amount=amount,
                order_id=order_id,
                currency=currency,
                customer_name=customer_name,
                customer_address=customer_address,
                customer_phone=customer_phone,
                customer_city=customer_city,
                customer_post_code=customer_post_code,
            )
            payment_details = engine.make_payment(model)
            if hasattr(payment_details, "__dict__"):
                payment_details_dict = payment_details.__dict__
            elif isinstance(payment_details, dict):
                payment_details_dict = payment_details
        except Exception as e:
            plugin_error = e
            payment_details_dict = None

        sp_endpoint = settings.SP_ENDPOINT.rstrip("/")
        base_api_url = sp_endpoint if sp_endpoint.endswith("/api") else f"{sp_endpoint}/api"

        if payment_details_dict is None:
            return Response(
                {
                    "error": "Payment initiation failed",
                    "exception": f"{type(plugin_error).__name__}: {str(plugin_error)}" if plugin_error else "Unknown",
                },
                status=status.HTTP_502_BAD_GATEWAY,
            )

        sp_order_id = None
        sp_candidate_keys = [
            "sp_order_id",
            "shurjopay_order_id",
            "shurjopay_orderid",
            "sporder_id",
            "sporderid",
            "spOrderId",
            "spOrderID",
            "order_id",
        ]

        def _extract_any_candidates(obj, keys):
            candidates = []
            if not isinstance(obj, dict):
                return candidates
            for key in keys:
                val = obj.get(key)
                if val is None:
                    continue
                sval = str(val).strip()
                if sval:
                    candidates.append(sval)
            return candidates

        sp_order_candidates = _extract_any_candidates(payment_details_dict, sp_candidate_keys)
        data_obj = payment_details_dict.get("data")
        if isinstance(data_obj, dict):
            sp_order_candidates.extend(_extract_any_candidates(data_obj, sp_candidate_keys))

        sp_order_id = next(
            (
                c
                for c in sp_order_candidates
                if c
                and c != str(order_id)
                and not c.startswith(("SUB-", "SMS-", "BANK-"))
            ),
            None,
        )
        if not sp_order_id:
            sp_order_id = next((c for c in sp_order_candidates if c and c != str(order_id)), None)

        if sp_order_id:
            PaymentTransaction.objects.filter(
                user=request.user,
                customer_order_id=order_id,
            ).update(sp_order_id=sp_order_id)

        return Response(payment_details_dict, status=status.HTTP_200_OK)

    except Exception as e:
        # More specific error messages based on the error type
        if isinstance(e, KeyError):
            missing_key = None
            try:
                if e.args:
                    missing_key = e.args[0]
            except Exception:
                missing_key = None

            if missing_key == "checkout_url" or str(e) == "'checkout_url'":
                msg = "Payment gateway did not return checkout_url"
            else:
                msg = f"Payment gateway response missing required field: {missing_key or str(e)}"
            return Response(
                {
                    "error": msg,
                    "exception": f"KeyError({missing_key or str(e)})",
                },
                status=status.HTTP_502_BAD_GATEWAY,
            )

        error_message = str(e)
        if "ShurjoPay" in error_message or "SP_" in error_message:
            error_message = "Payment gateway configuration error. Please contact support."
        elif "Invalid" in error_message:
            error_message = f"Invalid payment data: {error_message}"
        
        return Response({"error": error_message}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
