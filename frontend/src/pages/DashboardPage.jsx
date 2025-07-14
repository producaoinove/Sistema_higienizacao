import { useEffect, useState } from "react";
import api from "../services/api";
import logo2 from '../assets/logo2.png';
import {
  Container,
  Typography,
  Grid,
  Card,
  CardContent,
  CardActions,
  Button,
  CircularProgress,
  Box,
  Chip,
  Divider,
  Input,
  Snackbar,
  Alert,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  FormControl,
  FormLabel,
  FormGroup,
  FormControlLabel,
  Checkbox
} from "@mui/material";
import { motion } from "framer-motion";
import DownloadIcon from "@mui/icons-material/Download";
import InsertDriveFileIcon from "@mui/icons-material/InsertDriveFile";
import CloudUploadIcon from "@mui/icons-material/CloudUpload";


// Função que escuta o backend via Server-Sent Events (SSE)
const esperarProcessamento = (uploadId) => {
  return new Promise((resolve, reject) => {
    const eventSource = new EventSource(`/api/eventos/processamento/${uploadId}/`, {
      withCredentials: true
    });

    const timeout = setTimeout(() => {
      eventSource.close();
      resolve(false); // timeout atingido
    }, 120000); // 2 minutos

    eventSource.addEventListener("concluido", (event) => {
      const uploadIdRecebido = event.data;

      clearTimeout(timeout);
      eventSource.close();
      resolve(true);
    });


    eventSource.onerror = (err) => {
      clearTimeout(timeout);
      eventSource.close();
      console.error("Erro SSE:", err);
      resolve(false); // Trata como falha, mas não joga exceção
    };
  });
};



export default function DashboardPage() {
  const [arquivos, setArquivos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [file, setFile] = useState(null);
  const [statusMsg, setStatusMsg] = useState("");
  const [openSnackbar, setOpenSnackbar] = useState(false);
  const [detalhesUpload, setDetalhesUpload] = useState(null);
  const [openDialog, setOpenDialog] = useState(false);
  const [tipoFiltro, setTipoFiltro] = useState("global");
  const [uploadEmAndamento, setUploadEmAndamento] = useState(false);
  const [openInfo, setOpenInfo] = useState(false);


  const fetchArquivos = async () => {
    setLoading(true);
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



  const handleUpload = async () => {
    if (!file) return;

    setUploadEmAndamento(true);
    setStatusMsg(""); // limpa mensagem anterior

    const formData = new FormData();
    formData.append("arquivo_original", file);
    formData.append("tipo_filtro", tipoFiltro);

    try {
      // Envia o arquivo
      const response = await api.post("upload/", formData, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      });

      const uploadId = response.data.id;
      if (!uploadId) {
        throw new Error("ID do upload não foi retornado pela API.");
      }

      // Aguarda o SSE indicar conclusão
      const processado = await esperarProcessamento(uploadId);

      if (!processado) {
        setStatusMsg("⏰ Tempo excedido aguardando processamento.");
        setOpenSnackbar(true);
        return;
      }

      // Busca os dados processados
      const resultado = await api.get(`upload/status/${uploadId}/`);

      // Atualiza a tabela de arquivos
      await fetchArquivos();

      // Mostra o modal com dados detalhados
      setDetalhesUpload({
        total: resultado.data.total_entrada,
        removidos: resultado.data.total_removidos,
        linhas: resultado.data.linhas_removidas,
        retorno: resultado.data.total_retorno,
        download: resultado.data.arquivo_processado,
      });

      setOpenDialog(true);
      setStatusMsg("✅ Arquivo enviado com sucesso!");
      setOpenSnackbar(true);

    } catch (error) {
      console.error("Erro real:", error);

      if (error.response) {
        console.log("Data:", error.response.data);
        console.log("Status:", error.response.status);
        console.log("Headers:", error.response.headers);
      } else if (error.request) {
        console.log("Request:", error.request);
      } else {
        console.log("Erro desconhecido:", error.message);
      }

      setStatusMsg("❌ Erro ao enviar o arquivo.");
      setOpenSnackbar(true);
    } finally {
      setUploadEmAndamento(false);
      setFile(null);
      const input = document.getElementById("upload-input");
      if (input) input.value = "";
    }
  };




  return (
    <Container maxWidth="lg">
      {/* Cabeçalho */}
      <Box mt={5} mb={4} textAlign="center">
        <Typography variant="h4" fontWeight="bold">📄 Painel de Processamento de Arquivos</Typography>
        <Typography variant="subtitle1" color="text.secondary">Envie um novo arquivo e veja os resultados logo abaixo</Typography>
      </Box>

      {/* Área de upload ocupa 100% */}
      <Grid container spacing={4} alignItems="flex-start">
        <Grid item xs={12} md={8}>
          <Box
            sx={{
              border: "2px dashed #90caf9",
              borderRadius: 3,
              p: 4,
              textAlign: "center",
              backgroundColor: "#f5faff",
              transition: "0.3s",
              ":hover": {
                backgroundColor: "#e8f4ff",
                cursor: "pointer",
              },
            }}
            onDragOver={(e) => e.preventDefault()}
            onDrop={(e) => {
              e.preventDefault();
              const droppedFile = e.dataTransfer.files[0];
              if (droppedFile) setFile(droppedFile);
            }}
          >
            <CloudUploadIcon sx={{ fontSize: 50, color: "#2196f3", mb: 2 }} />
            <Typography variant="h6" gutterBottom>
              Selecione ou arraste o arquivo para enviar
            </Typography>

            <label htmlFor="upload-input">
              <Input
                id="upload-input"
                type="file"
                sx={{ display: "none" }}
                onChange={(e) => setFile(e.target.files[0])}
              />
              <Button variant="outlined" component="span" sx={{ mt: 2 }}>
                Escolher Arquivo
              </Button>
            </label>

            <Typography sx={{ mt: 2, fontWeight: 'bold', color: '#0d6efd' }}>
              Selecione uma das opções de blacklist:
            </Typography>

            <FormControl component="fieldset" sx={{ mt: 1 }}>
              <FormGroup row>
                {[{ label: "Minha Blacklist", value: "cliente" }, { label: "Blacklist do Sistema", value: "global" }, { label: "Usar as Duas", value: "ambos" }].map((opcao) => (
                  <FormControlLabel
                    key={opcao.value}
                    control={
                      <Checkbox
                        checked={tipoFiltro === opcao.value}
                        onChange={() => setTipoFiltro(opcao.value)}
                        checkedIcon={<span style={{ color: "#2196f3" }}>✅</span>}
                      />
                    }
                    label={opcao.label}
                  />
                ))}
              </FormGroup>
            </FormControl>

            {file && (
              <Typography sx={{ mt: 1 }} color="text.secondary">
                📎 {file.name}
              </Typography>
            )}

            <Box mt={3}>
              <Button
                variant="contained"
                color="primary"
                startIcon={<CloudUploadIcon />}
                onClick={handleUpload}
                disabled={!file || !tipoFiltro}
              >
                Enviar Arquivo csv
              </Button>
            </Box>
          </Box>
        </Grid>

        <Grid item xs={12} md={4}>
          <Box
            sx={{
              backgroundColor: "#1A1E24",
              color: "#E0F7FA",
              borderRadius: 3,
              p: 4,
              boxShadow: "0px 6px 20px rgba(0,0,0,0.3)",
              border: "1px solid #2E3A4A",
              fontSize: "0.95rem",
              lineHeight: 1.6,
              height: "100%"
            }}
          >
            <Typography variant="h6" sx={{ fontWeight: 700, mb: 2 }}>
              📌 Instruções para envio:
            </Typography>

            <Typography component="div">
              O sistema reconhece automaticamente os números de telefone e DDD das colunas com os seguintes nomes:
              <ul style={{ paddingLeft: 18, marginTop: 10 }}>
                <li><strong>Colunas de telefone:</strong> TEL1 a TEL10, TELEFONE1 a TELEFONE10, etc.</li>
                <li><strong>Colunas de DDD:</strong> DDD1 a DDD10, TE.1 a TE.10, etc.</li>
                <li><strong>Coluna com DDD e número juntos:</strong> telefone_completo, celular, número, tel_cliente, fone1, etc.</li>
                <li>Também reconhece colunas com "tel", "fone", "número", mesmo com acento.</li>
              </ul>
            </Typography>

            <Box
              sx={{
                mt: 3,
                px: 2,
                py: 1.5,
                borderRadius: 2,
                backgroundColor: "#004D40",
                color: "#00E676",
                fontWeight: 600,
                fontSize: "0.85rem",
              }}
            >
              ✅ Não é necessário mapear colunas manualmente. Basta que os nomes estejam corretos.
            </Box>
          </Box>
        </Grid>
      </Grid>

      {/* Lista de arquivos processados */}
      {loading ? (<Box display="flex" justifyContent="center" mt={6}><CircularProgress /></Box>) : (
        <Grid container spacing={4} justifyContent="center" sx={{ mt: 4 }}>
          {arquivos.slice(0, 1).map(item => (
            <Grid item xs={12} sm={6} md={4} key={item.id}>
              <Card elevation={4} sx={{ borderRadius: 3 }}>
                <CardContent>
                  <Box display="flex" alignItems="center" gap={1} mb={1}>
                    <InsertDriveFileIcon color="primary" />
                    <Typography variant="h6" noWrap>
                      {item.arquivo_original?.split("/").pop()}
                    </Typography>
                  </Box>

                  <Typography variant="body2" color="text.secondary">
                    Enviado em: <strong>{new Date(item.data_upload).toLocaleString()}</strong>
                  </Typography>

                  <Divider sx={{ my: 1 }} />

                  {/* RESUMO DE RESULTADOS */}
                  {item.resumo_resultado && item.resumo_resultado !== "null" ? (() => {
                    let resumo;
                    try {
                      resumo = JSON.parse(item.resumo_resultado);
                    } catch (e) {
                      return (
                        <Typography variant="body2" color="error">
                          Erro ao ler o resumo do arquivo.
                        </Typography>
                      );
                    }

                    return (
                      <>
                        <Typography variant="body2">
                          <strong>Total enviado:</strong> {resumo.total_entrada}
                        </Typography>
                        <Typography variant="body2">
                          <strong>Encontrados na blacklist:</strong> {resumo.total_removidos}
                        </Typography>
                        <Typography variant="body2">
                          <strong>Linhas excluídas:</strong> {resumo.linhas_removidas}
                        </Typography>
                        <Typography variant="body2" sx={{ color: "green" }}>
                          <strong>Total retorno:</strong> {resumo.total_retorno}
                        </Typography>
                      </>
                    );
                  })() : (
                    <Typography variant="body2" color="warning.main" fontStyle="italic">
                      <span style={{ marginRight: 6 }}>⌛</span> Aguardando processamento...
                    </Typography>
                  )}

                  <Box mt={2}>
                    <Chip
                      label={item.arquivo_processado ? "Processado" : "Em processamento"}
                      color={item.arquivo_processado ? "success" : "warning"}
                    />
                  </Box>
                </CardContent>
                {item.arquivo_processado && (<CardActions>
                  <Button
                    fullWidth
                    variant="contained"
                    color="primary"
                    startIcon={<DownloadIcon />}
                    onClick={() => handleDownload(item.id)} // ✅ aqui vai a função correta
                  >
                    Baixar Arquivo
                  </Button>
                </CardActions>)}
              </Card>
              <Dialog open={openDialog} onClose={() => setOpenDialog(false)} maxWidth="xs" fullWidth>
                <DialogTitle sx={{ fontWeight: "bold", fontSize: 20, textAlign: "center", pb: 0 }}>
                  ✅ Processamento Finalizado
                </DialogTitle>
                <DialogContent sx={{ textAlign: "center", mt: 2 }}>
                  {detalhesUpload && (
                    <Box>
                      <Typography variant="body1" gutterBottom>
                        <strong>Total enviado:</strong> {detalhesUpload.total}
                      </Typography>
                      <Typography variant="body1" gutterBottom>
                        <strong>Encontrados na blacklist:</strong> {detalhesUpload.removidos}
                      </Typography>
                      <Typography variant="body1" gutterBottom>
                        <strong>Linhas excluídas:</strong> {detalhesUpload.linhas}
                      </Typography>
                      <Typography
                        variant="body1"
                        color="success.main"
                        sx={{ mt: 1.5, fontWeight: 500 }}
                      >
                        <strong>Total retorno:</strong> {detalhesUpload.retorno}
                      </Typography>
                    </Box>
                  )}
                </DialogContent>
                <DialogActions sx={{ justifyContent: "center", pb: 2, flexDirection: "column", gap: 1 }}>
                  {arquivos[0]?.arquivo_processado && (
                    <Button
                      variant="contained"
                      fullWidth
                      color="primary"
                      startIcon={<DownloadIcon />}
                      onClick={() => handleDownload(arquivos[0].id)}
                    >
                      Baixar Arquivo
                    </Button>
                  )}
                  <Button
                    variant="contained"
                    color="secondary"
                    fullWidth
                    onClick={() => setOpenDialog(false)}
                    sx={{ textTransform: "none", px: 4 }}
                  >
                    Fechar
                  </Button>
                </DialogActions>
              </Dialog>

            </Grid>))}
          <Grid item xs={12} textAlign="center" mb={5}><Button variant="outlined" onClick={() => window.location.href = "/historico"}>Ver histórico completo</Button></Grid>
        </Grid>)}

      {/* Snackbar */}
      <Snackbar open={openSnackbar} autoHideDuration={4000} onClose={() => setOpenSnackbar(false)}>
        <Alert onClose={() => setOpenSnackbar(false)} severity={statusMsg.includes("sucesso") ? "success" : "error"} sx={{ width: "100%" }}>{statusMsg}</Alert>
      </Snackbar>

      {/* Dialog processamento */}
      <Dialog open={uploadEmAndamento} disableEscapeKeyDown hideBackdrop={false} PaperProps={{ component: motion.div, initial: { opacity: 0, scale: 0.9, y: -30 }, animate: { opacity: 1, scale: 1, y: 0 }, transition: { duration: 0.4, ease: "easeOut" }, sx: { borderRadius: 3, p: 3 } }}>
        <DialogTitle sx={{ textAlign: "center", fontWeight: "bold" }}>⏳ Estamos processando seu arquivo...</DialogTitle>
        <DialogContent sx={{ display: "flex", flexDirection: "column", alignItems: "center" }}>
          <CircularProgress sx={{ color: "#2196f3", mb: 3 }} />
          <Typography variant="body2" align="center">Isso pode levar alguns segundos dependendo do tamanho da base enviada.</Typography>
          <Typography variant="caption" color="text.disabled" mt={1}>Não feche esta aba durante o processamento.</Typography>
        </DialogContent>
      </Dialog>

      {/* Botão flutuante de ajuda */}
      <Box sx={{ position: "fixed", bottom: 30, right: 30, zIndex: 1300 }}>
        <Button variant="contained" onClick={() => setOpenInfo(true)} sx={{ borderRadius: "50%", minWidth: 60, minHeight: 60, backgroundColor: "#1A1E24", color: "#00E676", boxShadow: "0 0 12px rgba(0,230,118,.5)", fontSize: 24, fontWeight: "bold", ":hover": { backgroundColor: "#263238" } }}>?</Button>
      </Box>

      {/* Dialog instruções */}
      <Dialog open={openInfo} onClose={() => setOpenInfo(false)} maxWidth="sm" fullWidth PaperProps={{ sx: { zIndex: 1400, borderRadius: 3, backgroundColor: "#1A1E24", color: "#E0F7FA", p: 3 } }}>
        <DialogTitle sx={{ color: "#00E676", fontWeight: 700 }}>📌 Como deve estar sua planilha</DialogTitle>
        <DialogContent dividers>
          <Typography component="div" variant="body2">
            O sistema reconhece automaticamente os números de telefone e DDD das colunas com os seguintes nomes:
            <ul style={{ paddingLeft: 20, marginTop: 10 }}>
              <li><strong>Colunas de telefone:</strong> TEL1 a TEL10, TELEFONE1 a TELEFONE10, etc.</li>
              <li><strong>Colunas de DDD:</strong> DDD1 a DDD10, TE.1 a TE.10, etc.</li>
              <li><strong>Coluna com DDD e número juntos:</strong> telefone_completo, celular, número, tel_cliente, fone1, etc.</li>
              <li>Também reconhece colunas com "tel", "fone", "número", mesmo com acento.</li>
            </ul>
          </Typography>
          <Box mt={2} p={2} sx={{ borderRadius: 2, backgroundColor: "#004D40", color: "#00E676", fontWeight: 600, fontSize: "0.85rem" }}>✅ Não é necessário mapear colunas manualmente. Basta que os nomes estejam corretos.</Box>
        </DialogContent>
        <DialogActions sx={{ justifyContent: "center" }}>
          <Button variant="contained" sx={{ backgroundColor: "#00E676", color: "#1A1E24", fontWeight: "bold" }} onClick={() => setOpenInfo(false)}>Fechar</Button>
        </DialogActions>
      </Dialog>

    </Container>
  );
}
