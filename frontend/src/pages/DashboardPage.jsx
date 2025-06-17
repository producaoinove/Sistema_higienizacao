import { useEffect, useState } from "react";
import axios from "axios";
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
  FormControl, FormLabel, FormGroup, FormControlLabel, Checkbox
} from "@mui/material";
import DownloadIcon from "@mui/icons-material/Download";
import InsertDriveFileIcon from "@mui/icons-material/InsertDriveFile";
import CloudUploadIcon from "@mui/icons-material/CloudUpload";



export default function DashboardPage() {
  const [arquivos, setArquivos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [file, setFile] = useState(null);
  const [statusMsg, setStatusMsg] = useState("");
  const [openSnackbar, setOpenSnackbar] = useState(false);
  const [detalhesUpload, setDetalhesUpload] = useState(null);
  const [openDialog, setOpenDialog] = useState(false);
  const [tipoFiltro, setTipoFiltro] = useState("global");




  const fetchArquivos = async () => {
    setLoading(true); // <- isso é o que faltava
    const token = localStorage.getItem("token");
    try {
      const response = await axios.get("http://168.121.7.194:9001/api/uploadarquivo/", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      setArquivos(response.data);
    } catch (error) {
      console.error("Erro ao carregar arquivos:", error);
    } finally {
      setLoading(false);
    }
  };


  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) {
      window.location.href = "/login";
      return;
    }

    fetchArquivos();
  }, []);

  const handleUpload = async () => {
    if (!file) return;

    const novoId = Date.now(); // ID temporário
    const dataEnvio = new Date().toISOString();

    const novoArquivo = {
      id: novoId,
      arquivo_original: file.name,
      data_upload: dataEnvio,
      resumo_resultado: null,
      arquivo_processado: null,
    };

    // ⏳ Mostra o card visual imediatamente
    setArquivos((prev) => [novoArquivo, ...prev]);

    const formData = new FormData();
    formData.append("arquivo_original", file);
    formData.append("tipo_filtro", tipoFiltro);

    const token = localStorage.getItem("token");

    try {
      // 🔄 Envia o arquivo
      const response = await axios.post("http://168.121.7.194:9001/api/upload/", formData, {
        headers: {
          "Content-Type": "multipart/form-data",
          Authorization: `Bearer ${token}`,
        },
      });

      console.log("✅ RESPOSTA:", response.data);

      // ⏱️ Aguarda um tempo (opcional, depende do processamento no backend)
      await new Promise(resolve => setTimeout(resolve, 3000));

      // 🔄 Atualiza os arquivos reais após o backend processar
      await fetchArquivos();

      setDetalhesUpload({
        total: response.data.total_entrada,
        removidos: response.data.total_removidos,
        linhas: response.data.linhas_removidas,
        retorno: response.data.total_retorno,
        download: response.data.arquivo_processado,
      });
      setOpenDialog(true);
      setStatusMsg("Arquivo enviado com sucesso!");
    } catch (error) {
      if (error.response) {
        if (error.response.status === 401) {
          localStorage.removeItem("token");
          window.location.href = "/login";
          return;
        }
        console.error("❌ ERRO BACKEND:", error.response.data);
        setStatusMsg(error.response.data?.detail || "Erro ao enviar o arquivo.");
      } else {
        console.error("❌ ERRO GERAL:", error);
        setStatusMsg("Erro inesperado.");
      }
    } finally {
      setOpenSnackbar(true);
      setFile(null);
      document.getElementById("upload-input").value = "";
    }
  };




  return (
    <Container maxWidth="lg">
      <Box mt={5} mb={4} textAlign="center">
        <Typography variant="h4" fontWeight="bold">
          📄 Painel de Processamento de Arquivos
        </Typography>
        <Typography variant="subtitle1" color="text.secondary">
          Envie um novo arquivo e veja os resultados logo abaixo
        </Typography>
      </Box>

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

          <Typography sx={{ mt: 2, fontWeight: 'bold', color: '#0d6efd' }}>
            Selecione uma das opções de blacklist:
          </Typography>

          <FormControl component="fieldset" sx={{ mt: 1 }}>
            <FormGroup row>
              {[
                { label: "Minha Blacklist", value: "cliente" },
                { label: "Blacklist do Sistema", value: "global" },
                { label: "Usar as Duas", value: "ambos" },
              ].map((opcao) => (
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

          <Box
            mt={2}
            p={2}
            border="1px dashed #90caf9"
            borderRadius={2}
            bgcolor="#e3f2fd"
            textAlign="left"
          >
            <Typography variant="subtitle2" color="primary" fontWeight="bold" gutterBottom>
              📌 Como deve estar sua planilha:
            </Typography>

            <Typography variant="body2" color="text.primary" gutterBottom>
              O sistema reconhece automaticamente os números de telefone e DDD se as colunas tiverem os seguintes nomes:
            </Typography>

            <Typography variant="body2" color="text.secondary" component="div">
              <ul style={{ paddingLeft: 20, marginTop: 8 }}>
                <li>
                  <strong>Colunas de telefone:</strong> <code>TEL1 a TEL10</code>, <code>TELEFONE1 a TELEFONE10</code>, <code>LEFONE 1 a LEFONE 10</code>, <code>NÚMERO1 a NÚMERO10</code>, <code>NUMERO1 a NUMERO10</code>, etc.
                </li>
                <li>
                  <strong>Colunas de DDD:</strong> <code>DDD1 a DDD10</code>, <code>TE.1 a TE.10</code>, etc.
                </li>
                <li>
                  <strong>Coluna com DDD e número juntos:</strong> o sistema aceita colunas únicas com nomes como <code>telefone_completo</code>, <code>celular</code>, <code>número</code>, <code>tel_cliente</code>, <code>fone1</code>, etc.
                </li>
                <li>
                  O sistema também reconhece colunas que contenham no nome as palavras <em>tel</em>, <em>fone</em>, <em>cel</em> ou <em>número</em>, mesmo com acento.
                </li>
              </ul>
            </Typography>

            <Typography variant="body2" sx={{ mt: 1 }}>
              ✅ Não é necessário mapear colunas manualmente. Basta que os nomes estejam corretos.
            </Typography>
          </Box>


        </label>

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


      {loading ? (
        <Box display="flex" justifyContent="center" mt={6}>
          <CircularProgress />
        </Box>
      ) : (
        <Grid container spacing={4} justifyContent="center" alignItems="center" sx={{ mt: 4 }}>
          {arquivos.slice(0, 1).map((item) => (
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

                  {item.resumo_resultado ? (
                    <Typography variant="body2" color="text.primary">
                      {item.resumo_resultado}
                    </Typography>
                  ) : (
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

                {item.arquivo_processado && (
                  <CardActions>
                    <Button
                      variant="contained"
                      fullWidth
                      color="primary"
                      startIcon={<DownloadIcon />}
                      href={item.arquivo_processado}
                      target="_blank"
                    >
                      Baixar Arquivo
                    </Button>
                  </CardActions>
                )}
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
                      <Typography variant="body1" color="success.main" sx={{ mt: 1.5, fontWeight: 500 }}>
                        <strong>Total retorno:</strong> {detalhesUpload.retorno}
                      </Typography>
                    </Box>
                  )}
                </DialogContent>
                <DialogActions sx={{ justifyContent: "center", pb: 2, flexDirection: "column", gap: 1 }}>
                  {arquivos[0]?.arquivo_processado && (
                    <Button
                      variant="contained"
                      color="primary"
                      fullWidth
                      startIcon={<DownloadIcon />}
                      href={arquivos[0].arquivo_processado}
                      target="_blank"
                    >
                      Baixar Arquivo
                    </Button>
                  )}
                  <Button
                    variant="contained"
                    color="secondary"
                    fullWidth
                    onClick={() => setOpenDialog(false)}
                    sx={{ textTransform: 'none', px: 4 }}
                  >
                    Fechar
                  </Button>
                </DialogActions>
              </Dialog>
            </Grid>
          ))}

          <Grid item xs={12} textAlign="center">
            <Button
              variant="outlined"
              color="primary"
              onClick={() => window.location.href = "/historico"}
            >
              Ver histórico completo
            </Button>
          </Grid>
        </Grid>
      )}

      <Snackbar
        open={openSnackbar}
        autoHideDuration={4000}
        onClose={() => setOpenSnackbar(false)}
      >
        <Alert
          onClose={() => setOpenSnackbar(false)}
          severity={statusMsg.includes("sucesso") ? "success" : "error"}
          sx={{ width: "100%" }}
        >
          {statusMsg}
        </Alert>
      </Snackbar>
    </Container>
  );
}
