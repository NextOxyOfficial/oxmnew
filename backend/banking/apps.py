from django.apps import AppConfig


class BankingConfig(AppConfig):
    default_auto_field = 'django.db.models.BigAutoField'
    name = 'banking'
    verbose_name = 'Banking Management'
    
    def ready(self):
        import banking.signals
