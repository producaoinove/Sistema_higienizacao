from rest_framework import serializers
from .models import UploadArquivo

class UploadArquivoSerializer(serializers.ModelSerializer):
    class Meta:
        model = UploadArquivo
        fields = '__all__'
        read_only_fields = ['usuario', 'arquivo_processado', 'resumo_resultado', 'data_upload']
