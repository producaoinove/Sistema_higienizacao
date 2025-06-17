from django.contrib import admin, messages
from django.contrib.auth.admin import UserAdmin
from django.contrib.auth.models import User
from django.urls import path
from django.shortcuts import render, redirect
from .models import UploadArquivo, Blacklist, BlacklistGlobal, EmpresaBlacklist, Empresa, PerfilUsuario
from .forms import BlacklistImportForm
import pandas as pd
import re

@admin.register(UploadArquivo)
class UploadArquivoAdmin(admin.ModelAdmin):
    list_display = ('usuario', 'arquivo_original', 'data_upload', 'resumo_resultado')
    


@admin.register(Empresa)
class EmpresaAdmin(admin.ModelAdmin):
    list_display = ('nome',)
    search_fields = ('nome',)




@admin.register(PerfilUsuario)
class PerfilUsuarioAdmin(admin.ModelAdmin):
    list_display = ('user', 'empresa', 'is_master')
    list_filter = ('empresa', 'is_master')
    search_fields = ('user__username', 'empresa__nome')



@admin.register(Blacklist)
class BlacklistAdmin(admin.ModelAdmin):
    list_display = ('numero', 'listar_empresas')
    search_fields = ('numero',)
    
    def listar_empresas(self, obj):
        empresas = Empresa.objects.filter(empresablacklist__blacklist=obj).values_list('nome', flat=True)
        return ", ".join(empresas) or "—"
    listar_empresas.short_description = "Empresas"




@admin.register(BlacklistGlobal)
class BlacklistGlobalAdmin(admin.ModelAdmin):
    list_display = ('numero',)
    search_fields = ('numero',)

    def get_urls(self):
        urls = super().get_urls()
        custom_urls = [
            path('importar/', self.admin_site.admin_view(self.importar_blacklist_global), name='importar_blacklist_global'),
        ]
        return custom_urls + urls

    def importar_blacklist_global(self, request):
        if request.method == 'POST':
            form = BlacklistImportForm(request.POST, request.FILES)
            if form.is_valid():
                arquivo = form.cleaned_data['arquivo']
                ext = arquivo.name.split('.')[-1].lower()

                if ext == 'csv':
                    df = pd.read_csv(arquivo, dtype=str, sep=';', on_bad_lines='skip')
                else:
                    df = pd.read_excel(arquivo, dtype=str)

                col = next((c for c in df.columns if re.search(r'tel|cel|numero', c, re.IGNORECASE)), None)
                if not col:
                    self.message_user(request, "Coluna com números não encontrada.", level=messages.ERROR)
                    return redirect('..')

                
                adicionados = 0
                ignorados = 0

                existentes = set(BlacklistGlobal.objects.values_list('numero', flat=True))

                novos_numeros = []
                for valor in df[col].dropna().unique():
                    num = re.sub(r'\D', '', str(valor)).strip().replace('\u200b', '')
                    if num.startswith('55'):
                        num = num[2:]
                    if not num or len(num) > 20 or num in existentes:
                        ignorados += 1
                        continue
                    novos_numeros.append(BlacklistGlobal(numero=num))
                    existentes.add(num)
                    adicionados += 1

                BlacklistGlobal.objects.bulk_create(novos_numeros, batch_size=500)

                self.message_user(
                    request,
                    f'{adicionados} números adicionados à blacklist global. '
                    f'{ignorados} ignorados (duplicados ou inválidos).',
                    level=messages.SUCCESS
                )
                return redirect('admin:arquivos_blacklistglobal_changelist')
        else:
            form = BlacklistImportForm()

        return render(request, 'admin/importar_blacklist.html', {
            'form': form,
            'title': 'Importar Blacklist Global'
        })



class PerfilUsuarioInline(admin.StackedInline):
    model = PerfilUsuario
    can_delete = False
    verbose_name_plural = 'Perfil da Empresa'
    fk_name = 'user'

class CustomUserAdmin(UserAdmin):
    inlines = (PerfilUsuarioInline,)

    def get_inline_instances(self, request, obj=None):
        if not obj:
            return []
        return super().get_inline_instances(request, obj)

# Remove o UserAdmin padrão
admin.site.unregister(User)
# Registra com o perfil vinculado
admin.site.register(User, CustomUserAdmin)