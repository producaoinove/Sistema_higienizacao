from django.db import models
from django.contrib.auth.models import User
import re
from django.core.validators import MaxLengthValidator

class UploadArquivo(models.Model):
    usuario = models.ForeignKey(User, on_delete=models.CASCADE)
    arquivo_original = models.FileField(upload_to='uploads/')
    arquivo_processado = models.FileField(upload_to='processados/', null=True, blank=True)
    data_upload = models.DateTimeField(auto_now_add=True)
    resumo_resultado = models.TextField(blank=True)

class Blacklist(models.Model):
    numero = models.CharField(max_length=20, validators=[MaxLengthValidator(20)], unique=True)

    def __str__(self):
        return self.numero

    def save(self, *args, **kwargs):
        # Limpa caracteres não numéricos
        num = re.sub(r'\D', '', self.numero)
        # Remove 55 se começar com ele
        if num.startswith('55'):
            num = num[2:]
        self.numero = num
        super().save(*args, **kwargs)
