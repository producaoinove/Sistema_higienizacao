from django import forms

class BlacklistImportForm(forms.Form):
    arquivo = forms.FileField(label='Escolha o arquivo (.xlsx ou .csv)')
