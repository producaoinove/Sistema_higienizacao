from django.db import migrations, models

class Migration(migrations.Migration):

    initial = True

    dependencies = []

    operations = [
        migrations.CreateModel(
            name='BaseCNPJreceita',
            fields=[
                ('id', models.AutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('data_inicio_atividades', models.CharField(max_length=10, blank=True, null=True)),
                ('natureza_juridica', models.CharField(max_length=100, blank=True, null=True)),
                ('descricaonj', models.CharField(max_length=100, blank=True, null=True)),
                ('cnae_fiscal', models.CharField(max_length=20, blank=True, null=True)),
                ('descricaocf', models.CharField(max_length=100, blank=True, null=True)),
                ('cnpj', models.CharField(max_length=18, unique=True)),
                ('razao_social', models.CharField(max_length=255, blank=True, null=True)),
                ('nome_fantasia', models.CharField(max_length=255, blank=True, null=True)),
                ('matriz_filial', models.CharField(max_length=20, blank=True, null=True)),
                ('decisor', models.CharField(max_length=255, blank=True, null=True)),
                ('situacao_cadastral', models.CharField(max_length=100, blank=True, null=True)),
                ('correio_eletronico', models.CharField(max_length=255, blank=True, null=True)),
                ('logradouro', models.CharField(max_length=255, blank=True, null=True)),
                ('num_fachada', models.CharField(max_length=20, blank=True, null=True)),
                ('complemento1', models.CharField(max_length=255, blank=True, null=True)),
                ('bairro', models.CharField(max_length=100, blank=True, null=True)),
                ('cep', models.CharField(max_length=10, blank=True, null=True)),
                ('municipio', models.CharField(max_length=100, blank=True, null=True)),
                ('uf', models.CharField(max_length=2, blank=True, null=True)),
                ('cpf', models.CharField(max_length=20, blank=True, null=True)),
                ('mei_nao_mei', models.CharField(max_length=1, blank=True, null=True)),
                ('tel1', models.CharField(max_length=20, blank=True, null=True)),
                ('tel2', models.CharField(max_length=20, blank=True, null=True)),
                ('tel3', models.CharField(max_length=20, blank=True, null=True)),
            ],
        ),
    ]
