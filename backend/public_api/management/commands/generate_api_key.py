from django.contrib.auth.models import User
from django.core.management.base import BaseCommand, CommandError

from public_api.models import PublicAPIKey


class Command(BaseCommand):
    help = "Generate a public API key for a user"

    def add_arguments(self, parser):
        parser.add_argument(
            "username", type=str, help="Username of the user to generate API key for"
        )
        parser.add_argument(
            "--name",
            type=str,
            default="Generated API Key",
            help='Name for the API key (default: "Generated API Key")',
        )
        parser.add_argument(
            "--requests-per-hour",
            type=int,
            default=1000,
            help="Maximum requests per hour (default: 1000)",
        )
        parser.add_argument(
            "--requests-per-day",
            type=int,
            default=10000,
            help="Maximum requests per day (default: 10000)",
        )
        parser.add_argument(
            "--regenerate",
            action="store_true",
            help="Regenerate existing API key instead of creating new one",
        )

    def handle(self, *args, **options):
        username = options["username"]

        try:
            user = User.objects.get(username=username)
        except User.DoesNotExist:
            raise CommandError(f'User "{username}" does not exist.')

        # Check if user already has an API key
        try:
            api_key = PublicAPIKey.objects.get(user=user)
            if options["regenerate"]:
                old_key = api_key.key
                new_key = api_key.regenerate_key()
                self.stdout.write(
                    self.style.SUCCESS(
                        f'Successfully regenerated API key for user "{username}"'
                    )
                )
                self.stdout.write(f"Old key: {old_key}")
                self.stdout.write(f"New key: {new_key}")
            else:
                self.stdout.write(
                    self.style.WARNING(
                        f'User "{username}" already has an API key: {api_key.key}'
                    )
                )
                self.stdout.write(
                    "Use --regenerate flag to regenerate the existing key."
                )
        except PublicAPIKey.DoesNotExist:
            # Create new API key
            api_key = PublicAPIKey.objects.create(
                user=user,
                name=options["name"],
                requests_per_hour=options["requests_per_hour"],
                requests_per_day=options["requests_per_day"],
            )

            self.stdout.write(
                self.style.SUCCESS(
                    f'Successfully created API key for user "{username}"'
                )
            )
            self.stdout.write(f"API Key: {api_key.key}")
            self.stdout.write(f"Name: {api_key.name}")
            self.stdout.write(f"Requests per hour: {api_key.requests_per_hour}")
            self.stdout.write(f"Requests per day: {api_key.requests_per_day}")

            self.stdout.write("")
            self.stdout.write("Usage example:")
            self.stdout.write(
                f'curl -H "Authorization: Bearer {api_key.key}" http://localhost:8000/api/public/products/'
            )
