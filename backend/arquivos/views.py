from rest_framework import generics, permissions, status
from django.contrib.auth.models import User
from rest_framework.response import Response
from rest_framework.parsers import MultiPartParser
from rest_framework.pagination import PageNumberPagination
from .models import UploadArquivo, PerfilUsuario, Empresa, Blacklist, EmpresaBlacklist
from .serializers import UploadArquivoSerializer
from .utils import processar_arquivo
from django.http import StreamingHttpResponse
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated, AllowAny
import pandas as pd
import re
import logging
logger = logging.getLogger(__name__)


class UploadArquivoView(generics.CreateAPIView):
    queryset = UploadArquivo.objects.all()
    serializer_class = UploadArquivoSerializer
    permission_classes = [permissions.IsAuthenticated]
    parser_classes = [MultiPartParser]

    def create(self, request, *args, **kwargs):
        print("📥 ENTROU NO CREATE")  # ← isso tem que aparecer
        return super().create(request, *args, **kwargs)

    def perform_create(self, serializer):
        perfil = self.request.user.perfilusuario
        tipo_filtro = self.request.data.get("tipo_filtro", "cliente")

        print("📦 request.data:", self.request.data)
        print("📂 request.FILES:", self.request.FILES)

        instance = serializer.save(usuario=self.request.user, empresa=perfil.empresa)
        resultado = processar_arquivo(instance, tipo_filtro)
        self.resultado = resultado
        
    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        self.perform_create(serializer)

        headers = self.get_success_headers(serializer.data)

        return Response({
            "id": serializer.data["id"],
            "arquivo_processado": serializer.data["arquivo_processado"],
            "total_entrada": self.resultado["total_entrada"],
            "total_removidos": self.resultado["total_removidos"],
            "linhas_removidas": self.resultado["linhas_removidas"],
            "total_retorno": self.resultado["total_retorno"],
        }, status=201, headers=headers)





class UploadArquivoListView(generics.ListAPIView):
    queryset = UploadArquivo.objects.all()
    serializer_class = UploadArquivoSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        perfil = self.request.user.perfilusuario
        return UploadArquivo.objects.filter(empresa=perfil.empresa).order_by('-data_upload')



@api_view(["GET"])
@permission_classes([IsAuthenticated])
def me_view(request):
    perfil = request.user.perfilusuario
    return Response({
        "username": request.user.username,
        "email": request.user.email,
        "is_master": perfil.is_master  # ⬅️ novo campo no retorno
    })
    
    

@api_view(["POST"])
@permission_classes([IsAuthenticated])
def change_password_view(request):
    user = request.user
    data = request.data

    atual = data.get("senha_atual")
    nova = data.get("nova_senha")
    confirmar = data.get("confirmar_senha")

    if not user.check_password(atual):
        return Response({"detail": "Senha atual incorreta."}, status=status.HTTP_400_BAD_REQUEST)

    if nova != confirmar:
        return Response({"detail": "A nova senha e a confirmação não coincidem."}, status=status.HTTP_400_BAD_REQUEST)

    user.set_password(nova)
    user.save()

    return Response({"detail": "Senha alterada com sucesso."})


@api_view(["POST"])
@permission_classes([AllowAny])
def register_view(request):
    username = request.data.get("username")
    email = request.data.get("email")
    password = request.data.get("password")
    nome_empresa = request.data.get("empresa")

    if User.objects.filter(username=username).exists():
        return Response({"detail": "Usuário já existe."}, status=status.HTTP_400_BAD_REQUEST)

    empresa, _ = Empresa.objects.get_or_create(nome=nome_empresa)
    user = User.objects.create_user(username=username, email=email, password=password)
    PerfilUsuario.objects.create(user=user, empresa=empresa)

    return Response({"detail": "Usuário criado com sucesso."}, status=status.HTTP_201_CREATED)



@api_view(["POST"])
@permission_classes([AllowAny])
def reset_password_view(request):
    email = request.data.get("email")
    user = User.objects.filter(email=email).first()

    if not user:
        return Response({"detail": "E-mail não encontrado."}, status=status.HTTP_400_BAD_REQUEST)

    # Para simplificação: resetar para "nova_senha123"
    user.set_password("nova_senha123")
    user.save()

    return Response({
        "detail": "Senha redefinida com sucesso. Nova senha temporária: nova_senha123"
    })



@api_view(["POST"])
@permission_classes([IsAuthenticated])
def upload_blacklist_cliente(request):
    perfil = request.user.perfilusuario
    arquivo = request.FILES.get("arquivo")

    if not arquivo:
        return Response({"detail": "Nenhum arquivo enviado."}, status=400)

    ext = arquivo.name.split('.')[-1].lower()
    try:
        df = pd.read_csv(arquivo, dtype=str, sep=';', on_bad_lines='skip') if ext == "csv" else pd.read_excel(arquivo, dtype=str)
    except Exception as e:
        return Response({"detail": f"Erro ao ler o arquivo: {str(e)}"}, status=400)

    col = next((c for c in df.columns if re.search(r'tel|cel|numero', c, re.IGNORECASE)), None)
    if not col:
        return Response({"detail": "Coluna com números não encontrada."}, status=400)

    numeros_raw = df[col].dropna().unique()

    # Limpa e normaliza os números
    numeros_formatados = set()
    for valor in numeros_raw:
        num = re.sub(r'\D', '', str(valor)).strip().replace('\u200b', '')
        if num.startswith("55"):
            num = num[2:]
        if num and len(num) <= 20:
            numeros_formatados.add(num)

    if not numeros_formatados:
        return Response({"detail": "Nenhum número válido encontrado."}, status=400)

    # Busca existentes para evitar duplicação
    existentes_global = set(Blacklist.objects.filter(numero__in=numeros_formatados).values_list('numero', flat=True))
    novos_globais = [Blacklist(numero=n) for n in numeros_formatados if n not in existentes_global]
    Blacklist.objects.bulk_create(novos_globais, batch_size=500)

    # Garante que todos os números estão agora no banco
    todos_blacklists = {
        b.numero: b.id for b in Blacklist.objects.filter(numero__in=numeros_formatados)
    }

    existentes_cliente = set(
        EmpresaBlacklist.objects.filter(
            empresa=perfil.empresa,
            blacklist_id__in=todos_blacklists.values()
        ).values_list("blacklist__numero", flat=True)
    )

    novos_vinculos = [
        EmpresaBlacklist(empresa=perfil.empresa, blacklist_id=todos_blacklists[num])
        for num in numeros_formatados if num not in existentes_cliente
    ]

    EmpresaBlacklist.objects.bulk_create(novos_vinculos, batch_size=500)

    return Response({
        "detail": f"{len(novos_vinculos)} números adicionados à sua blacklist.",
        "adicionados": len(novos_vinculos),
        "ignorados": len(numeros_formatados) - len(novos_vinculos),
    })



@api_view(["POST"])
@permission_classes([IsAuthenticated])
def criar_usuario_empresa(request):
    empresa = request.user.perfilusuario.empresa
    username = request.data.get("username")
    email = request.data.get("email")
    password = request.data.get("password")

    if not all([username, email, password]):
        return Response({"detail": "Todos os campos são obrigatórios."}, status=400)

    if User.objects.filter(username=username).exists():
        return Response({"detail": "Nome de usuário já existe."}, status=400)

    user = User.objects.create_user(username=username, email=email, password=password)
    PerfilUsuario.objects.create(user=user, empresa=empresa)

    return Response({"detail": "Usuário criado com sucesso."}, status=201)


class ClienteBlacklistPagination(PageNumberPagination):
    page_size = 100

@api_view(["GET"])
@permission_classes([IsAuthenticated])
def listar_blacklist_cliente(request):
    perfil = request.user.perfilusuario
    qs = EmpresaBlacklist.objects.filter(
        empresa=perfil.empresa
    ).select_related("blacklist").order_by("-created_at")

    paginator = ClienteBlacklistPagination()
    paginated = paginator.paginate_queryset(qs, request)

    data = [
        {
            "id": item.id,
            "numero": item.blacklist.numero,
            "created_at": item.created_at.isoformat() if item.created_at else ""
        }
        for item in paginated
    ]

    return paginator.get_paginated_response(data)


@api_view(["DELETE"])
@permission_classes([IsAuthenticated])
def remover_numero_blacklist(request, pk):
    perfil = request.user.perfilusuario
    qs = EmpresaBlacklist.objects.filter(id=pk, empresa=perfil.empresa)
    if not qs.exists():
        return Response({"detail": "Número não encontrado."}, status=404)
    qs.delete()
    return Response({"detail": "Número removido com sucesso."})


@api_view(["POST"])
@permission_classes([IsAuthenticated])
def adicionar_blacklist_manual(request):
    perfil = request.user.perfilusuario
    numero = request.data.get("numero")
    if not numero:
        return Response({"detail": "Número ausente."}, status=400)

    numero = re.sub(r'\D', '', numero).strip()
    if numero.startswith('55'):
        numero = numero[2:]
    if not numero or len(numero) > 20:
        return Response({"detail": "Número inválido."}, status=400)

    blacklist, _ = Blacklist.objects.get_or_create(numero=numero)
    _, created = EmpresaBlacklist.objects.get_or_create(
        empresa=perfil.empresa,
        blacklist=blacklist
    )
    return Response({"detail": "Número adicionado com sucesso."})


@api_view(["GET"])
@permission_classes([IsAuthenticated])
def baixar_blacklist_cliente(request):
    perfil = request.user.perfilusuario
    qs = EmpresaBlacklist.objects.filter(empresa=perfil.empresa).select_related("blacklist")

    def gerar_csv():
        yield "numero,data\n"
        for item in qs:
            yield f"{item.blacklist.numero},{item.created_at.strftime('%d/%m/%Y %H:%M:%S')}\n"

    response = StreamingHttpResponse(gerar_csv(), content_type='text/csv')
    response['Content-Disposition'] = 'attachment; filename="minha_blacklist.csv"'
    return response