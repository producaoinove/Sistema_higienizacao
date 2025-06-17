from django.urls import path
from rest_framework_simplejwt.views import TokenObtainPairView, TokenRefreshView
from .views import UploadArquivoView, UploadArquivoListView, me_view, change_password_view, register_view, reset_password_view, upload_blacklist_cliente, criar_usuario_empresa, listar_blacklist_cliente, remover_numero_blacklist, adicionar_blacklist_manual, baixar_blacklist_cliente

urlpatterns = [
    path('login/', TokenObtainPairView.as_view(), name='token_obtain_pair'),
    path('refresh/', TokenRefreshView.as_view(), name='token_refresh'),
    path('upload/', UploadArquivoView.as_view(), name='upload_arquivo'),
    path('uploadarquivo/', UploadArquivoListView.as_view(), name='lista_uploads'),
    path("change-password/", change_password_view, name="change_password"),
    path("register/", register_view, name="register"),
    path("reset-password/", reset_password_view, name="reset_password"),
    path("me/", me_view, name="me"),
    path("upload_blacklist_cliente/", upload_blacklist_cliente),
    path("blacklist_cliente/", listar_blacklist_cliente),
    path("blacklist_cliente/<int:pk>/", remover_numero_blacklist),
    path("adicionar_blacklist_cliente/", adicionar_blacklist_manual),
    path("baixar_blacklist_cliente/", baixar_blacklist_cliente),
]
