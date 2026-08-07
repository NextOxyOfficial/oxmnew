"""Prove the mail path works, end to end.

Password-reset failures are invisible: the API answers "কোড পাঠানো হয়েছে"
whether or not the message left the building, because saying otherwise would
tell an attacker which addresses exist. So there has to be a way to check
deliberately.

    python manage.py check_email you@example.com
"""

from django.conf import settings
from django.core.mail import get_connection, send_mail
from django.core.management.base import BaseCommand


class Command(BaseCommand):
    help = "Send a test email and report exactly where it failed, if it did."

    def add_arguments(self, parser):
        parser.add_argument("to", help="Address to send the test message to")

    def handle(self, *args, **options):
        to = options["to"]

        self.stdout.write("Configuration")
        self.stdout.write(f"  backend : {settings.EMAIL_BACKEND.rsplit('.', 1)[-1]}")
        self.stdout.write(f"  host    : {settings.EMAIL_HOST}:{settings.EMAIL_PORT}")
        self.stdout.write(f"  tls/ssl : {settings.EMAIL_USE_TLS} / {settings.EMAIL_USE_SSL}")
        self.stdout.write(f"  auth    : {'yes' if settings.EMAIL_HOST_USER else 'no'}")
        self.stdout.write(f"  from    : {settings.DEFAULT_FROM_EMAIL}")
        self.stdout.write("")

        try:
            connection = get_connection(fail_silently=False)
            connection.open()
        except Exception as exc:  # noqa: BLE001 — the whole point is to report it
            self.stderr.write(self.style.ERROR(f"Could not reach the mail server: {exc}"))
            self.stderr.write(
                "  If the host is 127.0.0.1, check that Postfix is running:\n"
                "    systemctl status postfix"
            )
            return
        connection.close()
        self.stdout.write(self.style.SUCCESS("Mail server reachable."))

        try:
            sent = send_mail(
                subject="OxyManager — মেইল পরীক্ষা",
                message=(
                    "এটা একটা পরীক্ষামূলক মেইল। এটা পেলে পাসওয়ার্ড রিসেটের "
                    "মেইলও যাবে।\n\n— OxyManager"
                ),
                from_email=settings.DEFAULT_FROM_EMAIL,
                recipient_list=[to],
                fail_silently=False,
            )
        except Exception as exc:  # noqa: BLE001
            self.stderr.write(self.style.ERROR(f"Send failed: {exc}"))
            return

        if not sent:
            self.stderr.write(self.style.ERROR("The backend accepted nothing."))
            return

        self.stdout.write(self.style.SUCCESS(f"Handed to the mail server for {to}."))
        self.stdout.write(
            "\nAccepted is not the same as delivered. On the server, confirm it left:\n"
            "  tail -f /var/log/mail.log      # look for status=sent\n"
            "  mailq                          # anything stuck\n"
            "\nIf it bounced for SPF or DKIM, the DNS records are missing — the\n"
            "message itself is fine, the domain just has not vouched for this host."
        )
