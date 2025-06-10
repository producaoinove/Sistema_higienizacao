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
  DialogContentText,
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

  const fetchArquivos = async () => {
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

    // ⏳ Adiciona o card visual imediatamente
    setArquivos(prev => [novoArquivo, ...prev]);

    const formData = new FormData();
    formData.append("arquivo_original", file);

    const token = localStorage.getItem("token");

    try {
      const response = await axios.post("http://168.121.7.194:9001/api/upload/", formData, {
        headers: {
          "Content-Type": "multipart/form-data",
          Authorization: `Bearer ${token}`,
        },
      });

      // ✅ Atualiza os dados depois do upload e processamento
      fetchArquivos();

      console.log(response.data);
      console.log(detalhesUpload)
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
      setStatusMsg("Erro ao enviar o arquivo.");
    } finally {
      setOpenSnackbar(true);
      setFile(null);
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
            disabled={!file}
          >
            Enviar Arquivo xlsx ou csv
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
