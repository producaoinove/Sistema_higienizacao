import { useEffect, useState } from "react";
import api from "../services/api";
import {
  Container, Typography, Grid, Card, CardContent, CardActions,
  Button, CircularProgress, Box, Chip, Divider, TextField
} from "@mui/material";
import DownloadIcon from "@mui/icons-material/Download";
import InsertDriveFileIcon from "@mui/icons-material/InsertDriveFile";

export default function HistoricoPage() {
  const [arquivos, setArquivos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [busca, setBusca] = useState("");
  const [dataInicio, setDataInicio] = useState("");
  const [dataFim, setDataFim] = useState("");
  const [paginaAtual, setPaginaAtual] = useState(1);
  const itensPorPagina = 6;


  const handleDownload = async (id) => {
    try {
      const response = await api.get(`baixar-processado/${id}/`, {
        responseType: 'blob',
      });

      if (!response || response.status !== 200) {
        throw new Error('Erro ao baixar o arquivo');
      }

      const contentType = response.headers['content-type'] || '';
      if (contentType.includes('text/html')) {
        const reader = new FileReader();
        reader.onload = () => {
          console.error("⚠️ HTML recebido:", reader.result);
        };
        reader.readAsText(response.data);
        throw new Error("Resposta inesperada (HTML recebido em vez do arquivo)");
      }

      const blob = new Blob([response.data], { type: contentType });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;

      const contentDisposition = response.headers['content-disposition'];
      const fileNameMatch = contentDisposition?.match(/filename="?([^"]+)"?/);
      a.download = decodeURIComponent(fileNameMatch?.[1] || 'arquivo.csv');

      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Erro ao baixar arquivo:', error);
    }
  };


  const fetchArquivos = async () => {
    try {
      const response = await api.get("uploadarquivo/");
      setArquivos(response.data);
    } catch (error) {
      console.error("Erro ao carregar arquivos:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchArquivos();
  }, []);

  const arquivosFiltrados = arquivos.filter((item) => {
    const nome = item.arquivo_original?.toLowerCase() || "";
    const data = new Date(item.data_upload);
    const inicio = dataInicio ? new Date(dataInicio) : null;
    const fim = dataFim ? new Date(dataFim + "T23:59:59") : null;
    const dentroDoIntervalo = (!inicio || data >= inicio) && (!fim || data <= fim);
    return nome.includes(busca.toLowerCase()) && dentroDoIntervalo;
  });

  const totalPaginas = Math.ceil(arquivosFiltrados.length / itensPorPagina);
  const indiceInicial = (paginaAtual - 1) * itensPorPagina;
  const indiceFinal = indiceInicial + itensPorPagina;
  const arquivosPaginados = arquivosFiltrados.slice(indiceInicial, indiceFinal);

  return (
    <Container maxWidth="lg">
      <Box mt={5} mb={3} textAlign="center">
        <Typography variant="h4" fontWeight="bold">🗂 Histórico de Arquivos Enviados</Typography>
        <Typography variant="subtitle1" color="text.secondary">
          Consulte abaixo todos os arquivos processados
        </Typography>

        <Box mt={3} mb={2} display="flex" justifyContent="center" gap={2}>
          <TextField label="Buscar por nome" variant="outlined" size="small" value={busca} onChange={(e) => { setBusca(e.target.value); setPaginaAtual(1); }} sx={{ width: 250 }} />
          <TextField label="Data início" type="date" size="small" value={dataInicio} onChange={(e) => { setDataInicio(e.target.value); setPaginaAtual(1); }} InputLabelProps={{ shrink: true }} />
          <TextField label="Data fim" type="date" size="small" value={dataFim} onChange={(e) => { setDataFim(e.target.value); setPaginaAtual(1); }} InputLabelProps={{ shrink: true }} />
        </Box>
      </Box>

      {loading ? (
        <Box display="flex" justifyContent="center" mt={6}><CircularProgress /></Box>
      ) : (
        <Grid container spacing={4}>
          {arquivosPaginados.map((item) => (
            <Grid item xs={12} sm={6} md={4} key={item.id}>
              <Card elevation={4} sx={{ borderRadius: 3 }}>
                <CardContent>
                  <Box display="flex" alignItems="center" gap={1} mb={1}>
                    <InsertDriveFileIcon color="primary" />
                    <Typography variant="h6" noWrap>
                      {item.arquivo_original?.split("/").pop() || "Arquivo sem nome"}
                    </Typography>
                  </Box>
                  <Typography variant="body2" color="text.secondary">
                    Enviado em: <strong>{new Date(item.data_upload).toLocaleString()}</strong>
                  </Typography>
                  <Divider sx={{ my: 1 }} />
                  {item.resumo_resultado ? (
                    (() => {
                      let resumo;
                      try {
                        resumo = JSON.parse(item.resumo_resultado);
                      } catch (e) {
                        resumo = null;
                      }

                      return resumo ? (
                        <Box>
                          <Typography variant="body2"><strong>Total enviado:</strong> {resumo.total_entrada}</Typography>
                          <Typography variant="body2"><strong>Encontrados na blacklist:</strong> {resumo.total_removidos}</Typography>
                          <Typography variant="body2"><strong>Linhas excluídas:</strong> {resumo.linhas_removidas}</Typography>
                          <Typography variant="body2" sx={{ color: "green" }}><strong>Total retorno:</strong> {resumo.total_retorno}</Typography>
                        </Box>
                      ) : (
                        <Typography variant="body2" color="error">Erro ao ler o resumo</Typography>
                      );
                    })()
                  ) : (
                    <Typography variant="body2" color="warning.main" fontStyle="italic">
                      ⏳ Aguardando processamento...
                    </Typography>
                  )}
                  <Box mt={2}>
                    {item.arquivo_processado ? (
                      <Chip label="Processado" color="success" />
                    ) : (
                      <Chip label="Em processamento" color="warning" />
                    )}
                  </Box>
                </CardContent>
                {item.arquivo_processado && (
                  <CardActions>
                    <Button
                      variant="contained"
                      fullWidth
                      color="primary"
                      startIcon={<DownloadIcon />}
                      onClick={() => handleDownload(item.id)}
                    >
                      Baixar Arquivo
                    </Button>
                  </CardActions>
                )}
              </Card>
            </Grid>
          ))}
        </Grid>
      )}

      {totalPaginas > 1 && (
        <Box mt={4} display="flex" justifyContent="center" alignItems="center" gap={2}>
          <Button variant="outlined" onClick={() => setPaginaAtual((prev) => Math.max(prev - 1, 1))} disabled={paginaAtual === 1}>Anterior</Button>
          <Typography>Página {paginaAtual} de {totalPaginas}</Typography>
          <Button variant="outlined" onClick={() => setPaginaAtual((prev) => Math.min(prev + 1, totalPaginas))} disabled={paginaAtual === totalPaginas}>Próxima</Button>
        </Box>
      )}
    </Container>
  );
}
