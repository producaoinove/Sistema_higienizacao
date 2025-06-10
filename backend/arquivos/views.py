from rest_framework import generics, permissions, status
from django.contrib.auth.models import User
from rest_framework.response import Response
from rest_framework.parsers import MultiPartParser
from .models import UploadArquivo
from .serializers import UploadArquivoSerializer
from .utils import processar_arquivo
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated, AllowAny


class UploadArquivoView(generics.CreateAPIView):
    queryset = UploadArquivo.objects.all()
    serializer_class = UploadArquivoSerializer
    permission_classes = [permissions.IsAuthenticated]
    parser_classes = [MultiPartParser]

    def perform_create(self, serializer):
        instance = serializer.save(usuario=self.request.user)
        resultado = processar_arquivo(instance)
        self.resultado = resultado  # ← armazena para usar no response
        
        
    def create(self, request, *args, **kwargs):
        response = super().create(request, *args, **kwargs)
        resultado = getattr(self, 'resultado', {})
        if isinstance(resultado, dict):
            response.data.update(resultado)
        return response




class UploadArquivoListView(generics.ListAPIView):
    queryset = UploadArquivo.objects.all()
    serializer_class = UploadArquivoSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        return UploadArquivo.objects.filter(usuario=self.request.user).order_by('-data_upload')



@api_view(["GET"])
@permission_classes([IsAuthenticated])
def me_view(request):
    return Response({
        "username": request.user.username,
        "email": request.user.email
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

    if User.objects.filter(username=username).exists():
        return Response({"detail": "Usuário já existe."}, status=status.HTTP_400_BAD_REQUEST)

    user = User.objects.create_user(username=username, email=email, password=password)
    user.save()
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


