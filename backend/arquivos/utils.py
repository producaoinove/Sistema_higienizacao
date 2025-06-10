import pandas as pd
import uuid
import re
import os
from django.conf import settings
from .models import Blacklist

def padronizar_numero(ddd: str, telefone: str) -> str:
    if not telefone:
        return None
    telefone = re.sub(r"\D", "", telefone)
    ddd = re.sub(r"\D", "", ddd or "")
    if len(telefone) >= 10:
        return telefone
    if ddd and len(telefone) in [8, 9]:
        return ddd + telefone
    return None

def processar_arquivo(instancia):
    base_blacklist = set(b.numero for b in Blacklist.objects.all())
    print(f"[DEBUG] Blacklist com {len(base_blacklist)} números")

    ext = os.path.splitext(instancia.arquivo_original.name)[-1].lower()
    sep_detectado = ";"

    if ext == ".csv":
        df = None
        tentativas = [
            {"encoding": "utf-8", "sep": ","},
            {"encoding": "utf-8", "sep": ";"},
            {"encoding": "latin1", "sep": ","},
            {"encoding": "latin1", "sep": ";"},
        ]
        for tentativa in tentativas:
            try:
                df = pd.read_csv(
                    instancia.arquivo_original.path,
                    encoding=tentativa["encoding"],
                    sep=tentativa["sep"],
                    dtype=str,
                    engine="python",
                    on_bad_lines="skip"
                ).fillna("")
                df = df.applymap(lambda x: str(int(float(x))) if isinstance(x, float) else str(x))
                if not df.empty and len(df.columns) > 1:
                    sep_detectado = tentativa["sep"]
                    break
            except Exception:
                continue

        if df is None or df.empty or len(df.columns) <= 1:
            instancia.resumo_resultado = '[ERRO] Falha ao ler o arquivo CSV.'
            instancia.save()
            return
    else:
        xls = pd.ExcelFile(instancia.arquivo_original.path)
        for sheet in xls.sheet_names:
            df = pd.read_excel(xls, sheet_name=sheet, dtype=str).fillna("")
            if not df.empty:
                break
        else:
            instancia.resumo_resultado = '[ERRO] Nenhuma aba válida encontrada.'
            instancia.save()
            return

    col_ddd = []
    col_tel = []

    for i in range(1, 11):
        ddd_opcoes = [f"TE.{i-1}", f"DDD{i}", "TE"] if i == 1 else [f"TE.{i-1}", f"DDD{i}"]
        tel_opcoes = [f"LEFONE {i}", f"TEL{i}", f"NÚMERO{i}", f"NUMERO{i}"]

        ddd_col = next((col for col in ddd_opcoes if col in df.columns), None)
        tel_col_nome = next((col for col in tel_opcoes if col in df.columns), None)

        if tel_col_nome:
            col_tel.append(tel_col_nome)
            col_ddd.append(ddd_col)

    colunas_extras_tel = [col for col in df.columns if re.search(r'tel|fone|cel|n[úu]mero', col, re.IGNORECASE)]
    for tel_col_nome in colunas_extras_tel:
        if tel_col_nome not in col_tel:
            col_ddd.append(None)
            col_tel.append(tel_col_nome)

    linhas_para_excluir = []
    linhas_removidas = 0
    numeros_removidos = 0
    total_entrada = len(df)

    for idx, row in df.iterrows():
        numeros_formatados = []
        for ddd_col, tel_col in zip(col_ddd, col_tel):
            ddd = row.get(ddd_col, "") if ddd_col else ""
            tel = row.get(tel_col, "")
            numero = padronizar_numero(ddd, tel)
            if numero:
                numeros_formatados.append((tel_col, numero))

        validos = [num for _, num in numeros_formatados if num]
        if all(num in base_blacklist for num in validos) and validos:
            linhas_para_excluir.append(idx)
            linhas_removidas += 1
        else:
            for col, num in numeros_formatados:
                if num in base_blacklist:
                    df.at[idx, col] = ''
                    for ddd_col, tel_col in zip(col_ddd, col_tel):
                        if tel_col == col and ddd_col:
                            df.at[idx, ddd_col] = ''
                    numeros_removidos += 1

    df_final = df.drop(index=linhas_para_excluir)
    total_retorno = len(df_final)

    nome_original = os.path.splitext(os.path.basename(instancia.arquivo_original.name))[0]
    nome_saida = f"{nome_original}_processado{ext}"
    caminho_saida = os.path.join(settings.MEDIA_ROOT, 'processados', nome_saida)

    contador = 1
    while os.path.exists(caminho_saida):
        nome_saida = f"{nome_original}_processado{contador}{ext}"
        caminho_saida = os.path.join(settings.MEDIA_ROOT, 'processados', nome_saida)
        contador += 1

    os.makedirs(os.path.dirname(caminho_saida), exist_ok=True)

    if ext == ".csv":
        df_final.to_csv(caminho_saida, index=False, sep=sep_detectado)
    else:
        df_final.to_excel(caminho_saida, index=False)

    instancia.arquivo_processado.name = f'processados/{nome_saida}'
    instancia.resumo_resultado = (
        f'{linhas_removidas} linhas removidas completamente, '
        f'{numeros_removidos} números individuais removidos'
    )
    instancia.save()

    return {
        "resumo_resultado": instancia.resumo_resultado,
        "total_entrada": total_entrada,
        "total_retorno": total_retorno,
        "total_removidos": numeros_removidos,
        "linhas_removidas": linhas_removidas,
        "arquivo_processado": f"{settings.MEDIA_URL}{instancia.arquivo_processado.name}"
    }