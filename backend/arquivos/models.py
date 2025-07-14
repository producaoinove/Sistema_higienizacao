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
        
        
        

class BlacklistLote(models.Model):
    empresa = models.ForeignKey(Empresa, on_delete=models.CASCADE)
    nome = models.CharField(max_length=100)
    criado_em = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"Lote {self.nome} ({self.empresa.nome})"


class BlacklistItem(models.Model):
    lote = models.ForeignKey(BlacklistLote, on_delete=models.CASCADE, related_name="itens")
    numero = models.CharField(max_length=20)

    class Meta:
        unique_together = ('lote', 'numero')

    def save(self, *args, **kwargs):
        num = re.sub(r'\D', '', self.numero)
        if num.startswith('55'):
            num = num[2:]
        self.numero = num
        super().save(*args, **kwargs)




class BaseCNPJreceita(models.Model):
    data_inicio_atividades = models.CharField(max_length=10, blank=True, null=True)
    natureza_juridica = models.CharField(max_length=100, blank=True, null=True)
    descricaonj = models.CharField(max_length=100, blank=True, null=True)
    cnae_fiscal = models.CharField(max_length=20, blank=True, null=True)
    descricaocf = models.CharField(max_length=100, blank=True, null=True)
    cnpj = models.CharField(max_length=18, unique=True)
    razao_social = models.CharField(max_length=255, blank=True, null=True)
    nome_fantasia = models.CharField(max_length=255, blank=True, null=True)
    matriz_filial = models.CharField(max_length=20, blank=True, null=True)
    decisor = models.CharField(max_length=255, blank=True, null=True)
    situacao_cadastral = models.CharField(max_length=100, blank=True, null=True)
    correio_eletronico = models.CharField(max_length=255, blank=True, null=True)
    logradouro = models.CharField(max_length=255, blank=True, null=True)
    num_fachada = models.CharField(max_length=20, blank=True, null=True)
    complemento1 = models.CharField(max_length=255, blank=True, null=True)
    bairro = models.CharField(max_length=100, blank=True, null=True)
    cep = models.CharField(max_length=10, blank=True, null=True)
    municipio = models.CharField(max_length=100, blank=True, null=True)
    uf = models.CharField(max_length=2, blank=True, null=True)
    cpf = models.CharField(max_length=20, blank=True, null=True)
    mei_nao_mei = models.CharField(max_length=1, blank=True, null=True)
    tel1 = models.CharField(max_length=20, blank=True, null=True)
    tel2 = models.CharField(max_length=20, blank=True, null=True)
    tel3 = models.CharField(max_length=20, blank=True, null=True)

    def __str__(self):
        return self.cnpj