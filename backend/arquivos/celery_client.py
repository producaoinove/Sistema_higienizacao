from celery import Celery
from django.conf import settings

app = Celery('verificador')
app.config_from_object('django.conf:settings', namespace='CELERY')
