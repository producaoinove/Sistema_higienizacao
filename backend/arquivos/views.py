from rest_framework import generics, permissions, status
from django.contrib.auth.tokens import default_token_generator
from django.utils.encoding import force_bytes, smart_str
from django.core.mail import send_mail
from urllib.parse import urljoin
from django.conf import settings
from django.urls import reverse
from django.contrib.auth.models import User
from rest_framework.response import Response
from django.views.decorators.http import condition
from django.views.decorators.csrf import csrf_exempt
from rest_framework.parsers import MultiPartParser
import requests
from rest_framework.pagination import PageNumberPagination
from .models import UploadArquivo, PerfilUsuario, Empresa, Blacklist, EmpresaBlacklist, BlacklistLote, BlacklistItem
from .serializers import UploadArquivoSerializer
from .utils import processar_arquivo
from django.http import StreamingHttpResponse, JsonResponse, HttpResponse, FileResponse, Http404
from django.utils.http import urlsafe_base64_decode, urlsafe_base64_encode
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated, AllowAny
import pandas as pd
import re
from django.contrib.auth.decorators import login_required
import os
import time
import json
import logging
logger = logging.getLogger(__name__)
import threading
from rest_framework.generics import RetrieveAPIView
from urllib.parse import urlencode
import mimetypes


#API RF
MICROSERVICO_BASE_URL = "http://127.0.0.1:9011/api1/"



class UploadArquivoView(generics.CreateAPIView):
    queryset = UploadArquivo.objects.all()
    serializer_class = UploadArquivoSerializer
    permission_classes = [IsAuthenticated]
    parser_classes = [MultiPartParser]

    def perform_create(self, serializer):
        perfil = self.request.user.perfilusuario
        tipo_filtro = self.request.data.get("tipo_filtro", "cliente")

        # Salva a instância no banco
        instance = serializer.save(usuario=self.request.user, empresa=perfil.empresa)

        # Função que será executada em segundo plano
        def tarefa():
            processar_arquivo(instance, tipo_filtro)

        # Dispara a thread e segue com a resposta
        threading.Thread(target=tarefa).start()

        # Armazena instância para usar na resposta
        self.instancia_processada = instance

    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        self.perform_create(serializer)

        instance = self.instancia_processada
        headers = self.get_success_headers(serializer.data)

        return Response({
            "id": instance.id,
            "mensagem": "Arquivo enviado com sucesso. Processamento iniciado.",
        }, status=201, headers=headers)



class UploadArquivoDetailView(RetrieveAPIView):
    queryset = UploadArquivo.objects.all()
    permission_classes = [IsAuthenticated]

    def get(self, request, *args, **kwargs):
        perfil = request.user.perfilusuario
        upload_id = kwargs.get("pk")
        try:
            instancia = UploadArquivo.objects.get(id=upload_id, empresa=perfil.empresa)
        except UploadArquivo.DoesNotExist:
            return Response({"detail": "Arquivo não encontrado."}, status=404)

        return Response({
            "id": instancia.id,
            "total_entrada": instancia.total_entrada,
            "total_removidos": instancia.total_removidos,
            "linhas_removidas": instancia.linhas_removidas,
            "total_retorno": instancia.total_retorno,
            "arquivo_processado": f"{settings.MEDIA_URL}{instancia.arquivo_processado.name}" if instancia.arquivo_processado else None,
        })




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
@permission_classes([AllowAny])
def solicitar_redefinicao_senha(request):
    email = request.data.get("email")
    user = User.objects.filter(email=email).first()

    if not user:
        return Response({"detail": "E-mail não encontrado."}, status=400)

    uid = urlsafe_base64_encode(force_bytes(user.pk))
    token = default_token_generator.make_token(user)

    url = f"{settings.FRONTEND_URL}/redefinir-senha/{uid}/{token}/"
    assunto = "Redefinição de senha - Invertus"
    corpo = f"Olá, clique no link abaixo para redefinir sua senha:\n\n{url}\n\nSe você não solicitou, ignore este e-mail."

    send_mail(
        assunto,
        corpo,
        settings.DEFAULT_FROM_EMAIL,
        [email],
        fail_silently=False,
    )

    return Response({"detail": "E-mail de redefinição enviado com sucesso."})



@api_view(["POST"])
@permission_classes([AllowAny])
def confirmar_redefinicao_senha(request, uidb64, token):
    nova_senha = request.data.get("senha")
    confirmar = request.data.get("confirmar")

    if nova_senha != confirmar:
        return Response({"detail": "Senhas não coincidem."}, status=400)

    try:
        uid = urlsafe_base64_decode(uidb64).decode()
        user = User.objects.get(pk=uid)
    except Exception:
        return Response({"detail": "Link inválido."}, status=400)

    if not default_token_generator.check_token(user, token):
        return Response({"detail": "Token inválido ou expirado."}, status=400)

    user.set_password(nova_senha)
    user.save()
    return Response({"detail": "Senha redefinida com sucesso."})


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



@api_view(["POST"])
@permission_classes([IsAuthenticated])
def criar_lote_blacklist(request):
    perfil = request.user.perfilusuario
    empresa = perfil.empresa
    nome = request.data.get("nome")
    arquivo = request.FILES.get("arquivo")

    if not nome or not arquivo:
        return Response({"detail": "Nome e arquivo são obrigatórios."}, status=400)

    # Cria lote
    lote = BlacklistLote.objects.create(empresa=empresa, nome=nome)

    # Lê arquivo
    ext = arquivo.name.split('.')[-1].lower()
    try:
        df = pd.read_csv(arquivo, dtype=str, sep=';', on_bad_lines='skip') if ext == "csv" else pd.read_excel(arquivo, dtype=str)
    except Exception as e:
        return Response({"detail": f"Erro ao ler arquivo: {str(e)}"}, status=400)

    col = next((c for c in df.columns if re.search(r'tel|cel|numero', c, re.IGNORECASE)), None)
    if not col:
        return Response({"detail": "Coluna com números não encontrada."}, status=400)

    numeros_raw = df[col].dropna().unique()

    numeros = set()
    for val in numeros_raw:
        num = re.sub(r'\D', '', str(val)).strip().replace('\u200b', '')
        if num.startswith("55"):
            num = num[2:]
        if num and len(num) <= 20:
            numeros.add(num)

    novos = [BlacklistItem(lote=lote, numero=n) for n in numeros]
    BlacklistItem.objects.bulk_create(novos, batch_size=500)

    return Response({
        "detail": f"Lote criado com {len(novos)} números.",
        "id_lote": lote.id,
        "total": len(novos),
    })
    
    
    
@api_view(["GET"])
@permission_classes([IsAuthenticated])
def listar_lotes_blacklist(request):
    perfil = request.user.perfilusuario
    lotes = BlacklistLote.objects.filter(empresa=perfil.empresa).order_by("-criado_em")

    data = [{
        "id": lote.id,
        "nome": lote.nome,
        "criado_em": lote.criado_em.strftime('%Y-%m-%d %H:%M:%S'),
        "total_numeros": lote.itens.count()
    } for lote in lotes]

    return Response(data)




@api_view(["GET"])
@permission_classes([IsAuthenticated])
def listar_numeros_do_lote(request, lote_id):
    perfil = request.user.perfilusuario
    try:
        lote = BlacklistLote.objects.get(id=lote_id, empresa=perfil.empresa)
    except BlacklistLote.DoesNotExist:
        return Response({"detail": "Lote não encontrado."}, status=404)

    numeros = lote.itens.values_list("numero", flat=True)
    return Response(list(numeros))




@api_view(["DELETE"])
@permission_classes([IsAuthenticated])
def excluir_lote(request, lote_id):
    perfil = request.user.perfilusuario
    qs = BlacklistLote.objects.filter(id=lote_id, empresa=perfil.empresa)
    if not qs.exists():
        return Response({"detail": "Lote não encontrado."}, status=404)

    qs.delete()
    return Response({"detail": "Lote excluído com sucesso."})



@api_view(["POST"])
@permission_classes([IsAuthenticated])
def renomear_lote(request, lote_id):
    novo_nome = request.data.get("nome")
    perfil = request.user.perfilusuario

    if not novo_nome:
        return Response({"detail": "Nome novo é obrigatório."}, status=400)

    try:
        lote = BlacklistLote.objects.get(id=lote_id, empresa=perfil.empresa)
    except BlacklistLote.DoesNotExist:
        return Response({"detail": "Lote não encontrado."}, status=404)

    lote.nome = novo_nome
    lote.save()
    return Response({"detail": "Lote renomeado com sucesso."})



@api_view(["PUT"])
@permission_classes([IsAuthenticated])
def editar_numero_do_lote(request, lote_id, numero_antigo):
    perfil = request.user.perfilusuario
    novo_numero = request.data.get("novo_numero")

    if not novo_numero:
        return Response({"detail": "Novo número é obrigatório."}, status=400)

    novo_numero = re.sub(r'\D', '', novo_numero).strip()
    if novo_numero.startswith("55"):
        novo_numero = novo_numero[2:]

    if not novo_numero or len(novo_numero) > 20:
        return Response({"detail": "Número inválido."}, status=400)

    try:
        lote = BlacklistLote.objects.get(id=lote_id, empresa=perfil.empresa)
        item = lote.itens.get(numero=numero_antigo)
    except BlacklistLote.DoesNotExist:
        return Response({"detail": "Lote não encontrado."}, status=404)
    except BlacklistItem.DoesNotExist:
        return Response({"detail": "Número não encontrado nesse lote."}, status=404)

    # Verifica se já existe o novo número no lote
    if lote.itens.filter(numero=novo_numero).exists():
        return Response({"detail": "Este número já existe no lote."}, status=400)

    item.numero = novo_numero
    item.save()

    return Response({"detail": "Número atualizado com sucesso."})




@api_view(["DELETE"])
@permission_classes([IsAuthenticated])
def remover_numero_do_lote(request, lote_id, numero):
    perfil = request.user.perfilusuario
    numero = re.sub(r'\D', '', numero).strip()
    if numero.startswith("55"):
        numero = numero[2:]

    try:
        lote = BlacklistLote.objects.get(id=lote_id, empresa=perfil.empresa)
        item = lote.itens.get(numero=numero)
    except BlacklistLote.DoesNotExist:
        return Response({"detail": "Lote não encontrado."}, status=404)
    except BlacklistItem.DoesNotExist:
        return Response({"detail": "Número não encontrado nesse lote."}, status=404)

    item.delete()
    return Response({"detail": "Número removido com sucesso."})




@api_view(["GET"])
@permission_classes([IsAuthenticated])
def status_processamento_view(request, id):
    try:
        perfil = request.user.perfilusuario
        instancia = UploadArquivo.objects.get(id=id, empresa=perfil.empresa)

        if instancia.arquivo_processado:
            status = "concluído"

            try:
                resumo = json.loads(instancia.resumo_resultado)
            except Exception:
                resumo = {}  # Evita quebra se o campo estiver malformatado

            return Response({
                "status": status,
                "resumo_resultado": instancia.resumo_resultado,
                "total_entrada": resumo.get("total_entrada", 0),
                "total_retorno": resumo.get("total_retorno", 0),
                "total_removidos": resumo.get("total_removidos", 0),
                "linhas_removidas": resumo.get("linhas_removidas", []),
                "arquivo_processado": f"{settings.MEDIA_URL}{instancia.arquivo_processado.name}" if instancia.arquivo_processado else None
            })

        return Response({"status": "pendente"})

    except UploadArquivo.DoesNotExist:
        return Response({"status": "erro", "mensagem": "Arquivo não encontrado"}, status=404)





@api_view(["GET"])
@permission_classes([IsAuthenticated])
def status_upload_view(request, pk):
    try:
        instancia = UploadArquivo.objects.get(pk=pk, usuario=request.user)
    except UploadArquivo.DoesNotExist:
        return Response({"detail": "Arquivo não encontrado."}, status=404)

    if instancia.arquivo_processado:
        status = "concluido"
        return Response({
            "status": status,
            "resumo_resultado": instancia.resumo_resultado,
            "total_entrada": instancia.total_entrada,
            "total_retorno": instancia.total_retorno,
            "total_removidos": instancia.total_removidos,
            "linhas_removidas": json.loads(instancia.linhas_removidas) if instancia.linhas_removidas else [],
            "arquivo_processado": f"{settings.MEDIA_URL}{instancia.arquivo_processado.name}" if instancia.arquivo_processado else None
        })
    else:
        return Response({"status": "processando"})
    
    

def evento_processamento(request, upload_id):
    def event_stream():
        while True:
            obj = UploadArquivo.objects.filter(id=upload_id).first()
            if obj and obj.arquivo_processado:
                yield f"event: concluido\ndata: {upload_id}\n\n"
                break
            else:
                # Envia ping para manter a conexão aberta
                yield f"event: ping\ndata: aguardando\n\n"
            time.sleep(10)
    
    response = StreamingHttpResponse(event_stream(), content_type='text/event-stream')
    response['Cache-Control'] = 'no-cache'
    return response




@api_view(["GET"])
@permission_classes([IsAuthenticated])
def download_arquivo_processado(request, arquivo_id):
    try:
        perfil = request.user.perfilusuario
        arquivo = UploadArquivo.objects.get(id=arquivo_id, empresa=perfil.empresa)

        if not arquivo.arquivo_processado:
            raise Http404("Arquivo ainda não está pronto.")

        caminho = arquivo.arquivo_processado.path
        if not os.path.exists(caminho):
            raise Http404("Arquivo não encontrado no sistema de arquivos.")

        nome = os.path.basename(arquivo.arquivo_processado.name)
        tipo, _ = mimetypes.guess_type(nome)

        return FileResponse(
            open(caminho, 'rb'),
            as_attachment=True,
            filename=nome,
            content_type=tipo or 'application/octet-stream'
        )

    except UploadArquivo.DoesNotExist:
        raise Http404("Arquivo não encontrado.")
    



def build_params_dict(params_dict):
    result = []
    for k, v in params_dict.items():
        if isinstance(v, list):
            result.extend([(k, item) for item in v])
        else:
            result.append((k, v))
    return result



@login_required
def filtrar_cnpjs(request):
    filtros_raw = {
        "cnae_fiscal": request.GET.getlist("cnae_fiscal"),
        "uf": request.GET.get("uf"),
        "tipo_telefone": request.GET.get("tipo_telefone"),
        "busca_termo": request.GET.get("busca_termo"),
        "municipios": request.GET.getlist("municipios"),
    }
    filtros = {k: v for k, v in filtros_raw.items() if v}
    params = build_params_dict(filtros)

    url = urljoin(MICROSERVICO_BASE_URL, "gerarMailing/")
    try:
        response = requests.get(url, params=params, timeout=10)
        return JsonResponse(response.json(), safe=False, status=response.status_code)
    except requests.exceptions.RequestException as e:
        return JsonResponse({"erro": f"Falha ao conectar com microserviço: {str(e)}"}, status=500)



def listar_cidades_por_uf(request):
    uf = request.GET.get("uf")
    if not uf:
        return JsonResponse({"erro": "UF não informada"}, status=400)

    url = urljoin(MICROSERVICO_BASE_URL, "cidades/")
    response = requests.get(url, params={"uf": uf})
    return JsonResponse(response.json(), safe=False, status=response.status_code)

def listar_cnaes(request):
    url = urljoin(MICROSERVICO_BASE_URL, "cnaes/")
    response = requests.get(url)
    return JsonResponse(response.json(), safe=False, status=response.status_code)

@csrf_exempt
def iniciar_exportacao(request):
    query = request.META.get("QUERY_STRING", "")
    url = urljoin(MICROSERVICO_BASE_URL, f"async/tasks/?{query}")
    try:
        res = requests.post(url, timeout=15)
        return JsonResponse(res.json(), status=res.status_code)
    except requests.exceptions.RequestException as e:
        return JsonResponse({"erro": f"Falha ao iniciar exportação: {str(e)}"}, status=500)
    

@csrf_exempt
def verificar_progresso(request, task_id):
    url = f"{MICROSERVICO_BASE_URL}async/tasks/{task_id}/"
    res = requests.get(url)
    return JsonResponse(res.json(), status=res.status_code)



@csrf_exempt
def baixar_arquivo(request, task_id):
    filename = request.GET.get("filename")
    url = f"{MICROSERVICO_BASE_URL}async/tasks/{task_id}/download/"
    if filename:
        url += f"?filename={filename}"

    res = requests.get(url, stream=True)

    if res.status_code == 200:
        response = HttpResponse(res.content, content_type=res.headers['Content-Type'])
        download_name = filename or "mailing.zip"
        response['Content-Disposition'] = f'attachment; filename="{download_name}"'
        return response
    else:
        return JsonResponse({"erro": "Falha ao baixar o arquivo"}, status=res.status_code)