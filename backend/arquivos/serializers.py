from rest_framework import serializers
from .models import UploadArquivo

class UploadArquivoSerializer(serializers.ModelSerializer):
    arquivo_processado = serializers.SerializerMethodField()

    class Meta:
        model = UploadArquivo
        fields = '__all__'
        read_only_fields = ['usuario', 'empresa', 'arquivo_processado', 'resumo_resultado', 'data_upload']

    def get_arquivo_processado(self, obj):
        if obj.arquivo_processado:
            return f"/api/baixar-processado/{obj.id}/"
        return None
