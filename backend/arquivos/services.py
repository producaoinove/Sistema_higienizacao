import psycopg2
from psycopg2.extras import execute_values
import csv
import gc
import os
from django.db import connection
from more_itertools import chunked

def processar_csv_em_background(arquivos):
    print("🚀 Processamento em segundo plano iniciado!\n")

    conn_params = connection.get_connection_params()
    conn = psycopg2.connect(**conn_params)
    cur = conn.cursor()
    cur.execute("SET statement_timeout = 600000;")

    for caminho in arquivos:
        nome_arquivo = os.path.basename(caminho)
        print(f"📂 Lendo arquivo: {nome_arquivo}")
        try:
            with open(caminho, "r", encoding="utf-8", errors="ignore") as arquivo:
                reader = csv.reader(arquivo, delimiter=";", quotechar='"')
                headers = next(reader)
                headers = [h.strip().lower() for h in headers]
                rows = []
                total_linhas = 0

                for i, campos in enumerate(reader, start=2):
                    total_linhas += 1
                    if len(campos) < len(headers):
                        campos += [""] * (len(headers) - len(campos))
                    elif len(campos) > len(headers):
                        campos = campos[:len(headers)]

                    row = dict(zip(headers, campos))

                    cnpj = (row.get("cnpj") or "").replace(".", "").replace("/", "").replace("-", "").strip()
                    if not cnpj:
                        continue

                    dados = (
                        cnpj,
                        row.get("data_inicio_atividades"),
                        row.get("natureza_juridica"),
                        row.get("descricaonj"),
                        row.get("cnae_fiscal"),
                        row.get("descricaocf"),
                        row.get("razao_social"),
                        row.get("nome_fantasia"),
                        row.get("matriz_filial"),
                        row.get("decisor"),
                        row.get("situacao_cadastral"),
                        row.get("correio_eletronico"),
                        row.get("logradouro"),
                        row.get("num_fachada"),
                        row.get("complemento1"),
                        row.get("bairro"),
                        row.get("cep"),
                        row.get("municipio"),
                        row.get("uf"),
                        row.get("cpf"),
                        row.get("mei_nao_mei"),
                        row.get("tel1"),
                        row.get("tel2"),
                        row.get("tel3"),
                    )

                    rows.append(dados)

            if not rows:
                print(f"⚠️ Nenhuma linha válida encontrada em '{nome_arquivo}'.")
                continue

            sql = """
                INSERT INTO arquivos_basecnpjreceita (
                    cnpj, data_inicio_atividades, natureza_juridica, descricaonj, cnae_fiscal, descricaocf,
                    razao_social, nome_fantasia, matriz_filial, decisor, situacao_cadastral,
                    correio_eletronico, logradouro, num_fachada, complemento1, bairro, cep,
                    municipio, uf, cpf, mei_nao_mei, tel1, tel2, tel3
                )
                VALUES %s
                ON CONFLICT (cnpj) DO UPDATE SET
                    data_inicio_atividades = EXCLUDED.data_inicio_atividades,
                    natureza_juridica = EXCLUDED.natureza_juridica,
                    descricaonj = EXCLUDED.descricaonj,
                    cnae_fiscal = EXCLUDED.cnae_fiscal,
                    descricaocf = EXCLUDED.descricaocf,
                    razao_social = EXCLUDED.razao_social,
                    nome_fantasia = EXCLUDED.nome_fantasia,
                    matriz_filial = EXCLUDED.matriz_filial,
                    decisor = EXCLUDED.decisor,
                    situacao_cadastral = EXCLUDED.situacao_cadastral,
                    correio_eletronico = EXCLUDED.correio_eletronico,
                    logradouro = EXCLUDED.logradouro,
                    num_fachada = EXCLUDED.num_fachada,
                    complemento1 = EXCLUDED.complemento1,
                    bairro = EXCLUDED.bairro,
                    cep = EXCLUDED.cep,
                    municipio = EXCLUDED.municipio,
                    uf = EXCLUDED.uf,
                    cpf = EXCLUDED.cpf,
                    mei_nao_mei = EXCLUDED.mei_nao_mei,
                    tel1 = EXCLUDED.tel1,
                    tel2 = EXCLUDED.tel2,
                    tel3 = EXCLUDED.tel3
            """

            
            for chunk in chunked(rows, 5000):
                try:
                    execute_values(cur, sql, chunk, page_size=1000)
                    conn.commit()
                except Exception as e:
                    conn.rollback()
                    print(f"❌ Falha ao inserir chunk: {e}")
            print(f"✅ {nome_arquivo} processado com sucesso. {len(rows)} linhas válidas de {total_linhas} lidas.")

        except Exception as e:
            conn.rollback()
            print(f"❌ Erro ao processar '{nome_arquivo}': {e}")

        finally:
            if os.path.exists(caminho):
                try:
                    os.remove(caminho)
                    print(f"🧹 Arquivo removido: {nome_arquivo}\n")
                except Exception as e:
                    print(f"⚠️ Falha ao remover {nome_arquivo}: {e}\n")
                    
            rows = []
            gc.collect()  # força liberação de memória

    cur.close()
    conn.close()
    print("🎯 TODOS os arquivos CSV foram processados.\n")
