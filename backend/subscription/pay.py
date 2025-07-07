from django.shortcuts import render
from rest_framework import status
from rest_framework.response import Response
from rest_framework.decorators import api_view
from shurjopay_plugin import *
from django.conf import settings

engine = ShurjopayPlugin(
    ShurjoPayConfigModel(
        SP_USERNAME=settings.SP_USERNAME,
        SP_PASSWORD=settings.SP_PASSWORD,
        SP_ENDPOINT=settings.SP_ENDPOINT,
        SP_RETURN=settings.SP_RETURN,
        SP_CANCEL=settings.SP_CANCEL,
        SP_PREFIX=settings.SP_PREFIX,
        SP_LOGDIR="./shurjopay_live.log",
    )
)


@api_view(["GET"])
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

        return Response(payment_details_dict, status=status.HTTP_200_OK)
    except Exception as e:
        return Response({"error": str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


@api_view(["GET"])
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

        # Creating the payment request model
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

        # Making the payment
        payment_details = engine.make_payment(model)

        # Convert the payment details to a dictionary
        if hasattr(payment_details, "__dict__"):
            payment_details_dict = payment_details.__dict__
        else:
            return Response(
                {"error": "Payment details could not be serialized."},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR,
            )

        return Response(payment_details_dict, status=status.HTTP_200_OK)

    except Exception as e:
        print(str(e))
        return Response({"error": str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
