import {
  Container,
  Typography,
  Box,
  TextField,
  Button,
  Snackbar,
  Alert,
  Paper
} from "@mui/material";
import { useState } from "react";
import axios from "axios";

export default function PerfilPage() {
  const [senhaAtual, setSenhaAtual] = useState("");
  const [novaSenha, setNovaSenha] = useState("");
  const [confirmarSenha, setConfirmarSenha] = useState("");
  const [statusMsg, setStatusMsg] = useState("");
  const [statusTipo, setStatusTipo] = useState("success");
  const [openSnackbar, setOpenSnackbar] = useState(false);

  const handleSubmit = async () => {
    const token = localStorage.getItem("token");

    try {
      const response = await axios.post(
        "http://168.121.7.194:9001/api/change-password/",
        {
          senha_atual: senhaAtual,
          nova_senha: novaSenha,
          confirmar_senha: confirmarSenha
        },
        {
          headers: {
            Authorization: `Bearer ${token}`
          }
        }
      );
      setStatusMsg(response.data.detail || "Senha alterada com sucesso.");
      setStatusTipo("success");
      setSenhaAtual("");
      setNovaSenha("");
      setConfirmarSenha("");
    } catch (error) {
      setStatusMsg(
        error.response?.data?.detail || "Erro ao alterar a senha."
      );
      setStatusTipo("error");
    } finally {
      setOpenSnackbar(true);
    }
  };

  return (
    <Container maxWidth="sm">
      <Box mt={6} component={Paper} elevation={3} p={4} borderRadius={2}>
        <Typography variant="h5" gutterBottom>
          Alterar Senha
        </Typography>
        <TextField
          label="Senha Atual"
          type="password"
          fullWidth
          margin="normal"
          value={senhaAtual}
          onChange={(e) => setSenhaAtual(e.target.value)}
        />
        <TextField
          label="Nova Senha"
          type="password"
          fullWidth
          margin="normal"
          value={novaSenha}
          onChange={(e) => setNovaSenha(e.target.value)}
        />
        <TextField
          label="Confirmar Nova Senha"
          type="password"
          fullWidth
          margin="normal"
          value={confirmarSenha}
          onChange={(e) => setConfirmarSenha(e.target.value)}
        />
        <Button
          variant="contained"
          color="primary"
          fullWidth
          sx={{ mt: 2 }}
          onClick={handleSubmit}
        >
          Salvar Alterações
        </Button>
      </Box>

      <Snackbar
        open={openSnackbar}
        autoHideDuration={4000}
        onClose={() => setOpenSnackbar(false)}
      >
        <Alert
          onClose={() => setOpenSnackbar(false)}
          severity={statusTipo}
          sx={{ width: "100%" }}
        >
          {statusMsg}
        </Alert>
      </Snackbar>
    </Container>
  );
}
