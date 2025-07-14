from django import forms

class MultiFileInput(forms.ClearableFileInput):
    allow_multiple_selected = True

class MultiFileField(forms.FileField):
    widget = MultiFileInput

    def clean(self, data, initial=None):
        # Garante que retorna uma lista de arquivos mesmo se apenas 1 for enviado
        if not data:
            return []
        if isinstance(data, list):
            return data
        return [data]

class BlacklistImportForm(forms.Form):
    arquivo = forms.FileField(label='Escolha o arquivo (.xlsx ou .csv)')
    

class CSVUploadForm(forms.Form):
    csv_files = MultiFileField(
        label="Selecione um ou vários CSVs",
        widget=MultiFileInput(attrs={"multiple": True})
    )