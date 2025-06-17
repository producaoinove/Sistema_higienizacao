from django.db import models
from django.contrib.auth.models import User
import re
from django.core.validators import MaxLengthValidator




class Empresa(models.Model):
    nome = models.CharField(max_length=100)

    def __str__(self):
        return self.nome
    
    

class UploadArquivo(models.Model):
    empresa = models.ForeignKey(Empresa, on_delete=models.CASCADE)
    usuario = models.ForeignKey(User, on_delete=models.CASCADE)
    arquivo_original = models.FileField(upload_to='uploads/')
    arquivo_processado = models.FileField(upload_to='processados/', null=True, blank=True)
    data_upload = models.DateTimeField(auto_now_add=True)
    resumo_resultado = models.TextField(blank=True)
    


class Blacklist(models.Model):
    numero = models.CharField(max_length=20, unique=True, validators=[MaxLengthValidator(20)])

    def __str__(self):
        return self.numero

    def save(self, *args, **kwargs):
        import re
        num = re.sub(r'\D', '', self.numero)
        if num.startswith('55'):
            num = num[2:]
        self.numero = num
        super().save(*args, **kwargs)



class PerfilUsuario(models.Model):
    user = models.OneToOneField(User, on_delete=models.CASCADE)
    empresa = models.ForeignKey(Empresa, on_delete=models.CASCADE)
    is_master = models.BooleanField(default=False)

    def __str__(self):
        return f"{self.user.username} ({self.empresa.nome})"
    
    

class BlacklistGlobal(models.Model):
    numero = models.CharField(max_length=20, unique=True)

    def __str__(self):
        return self.numero

    def save(self, *args, **kwargs):
        import re
        num = re.sub(r'\D', '', self.numero)
        if num.startswith('55'):
            num = num[2:]
        self.numero = num
        super().save(*args, **kwargs)
        
        

class EmpresaBlacklist(models.Model):
    empresa = models.ForeignKey(Empresa, on_delete=models.CASCADE)
    blacklist = models.ForeignKey(Blacklist, on_delete=models.CASCADE)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        unique_together = ('empresa', 'blacklist')