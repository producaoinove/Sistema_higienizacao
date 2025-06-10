from django.contrib import admin, messages
from django.urls import path
from django.shortcuts import render, redirect
from .models import UploadArquivo, Blacklist
from .forms import BlacklistImportForm
import pandas as pd
import re

@admin.register(UploadArquivo)
class UploadArquivoAdmin(admin.ModelAdmin):
    list_display = ('usuario', 'arquivo_original', 'data_upload', 'resumo_resultado')

@admin.register(Blacklist)
class BlacklistAdmin(admin.ModelAdmin):
    list_display = ('numero',)
    search_fields = ('numero',)

    def get_urls(self):
        urls = super().get_urls()
        custom_urls = [
            path('importar/', self.admin_site.admin_view(self.importar_blacklist), name='importar_blacklist'),
        ]
        return custom_urls + urls

    def importar_blacklist(self, request):
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

                numeros_existentes = set(
                    Blacklist.objects.values_list('numero', flat=True)
                )

                for valor in df[col].dropna().unique():
                    num = re.sub(r'\D', '', str(valor)).strip().replace('\u200b', '')
                    if num.startswith('55'):
                        num = num[2:]
                    if not num or len(num) > 20 or num in numeros_existentes:
                        ignorados += 1
                        continue
                    try:
                        Blacklist.objects.create(numero=num)
                        numeros_existentes.add(num)
                        adicionados += 1
                    except Exception:
                        ignorados += 1  # ignora duplicata ou erro inesperado

                self.message_user(
                    request,
                    f'{adicionados} números adicionados com sucesso. '
                    f'{ignorados} ignorados (duplicados ou com mais de 20 dígitos).',
                    level=messages.SUCCESS
                )
                return redirect('..')
        else:
            form = BlacklistImportForm()

        return render(request, 'admin/importar_blacklist.html', {
            'form': form,
            'title': 'Importar Blacklist'
        })

