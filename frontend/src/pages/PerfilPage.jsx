import {
  Container, Typography, Box, TextField, Button, Snackbar, Alert, Grid, Paper
} from "@mui/material";
import { useState } from "react";
import LockIcon from "@mui/icons-material/Lock";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import EmailIcon from "@mui/icons-material/Email";
import PersonOffIcon from "@mui/icons-material/PersonOff";
import AutorenewIcon from "@mui/icons-material/Autorenew";
import VisibilityIcon from "@mui/icons-material/Visibility";

export default function PerfilPage() {
  const [senhaAtual, setSenhaAtual] = useState("");
  const [novaSenha, setNovaSenha] = useState("");
  const [confirmarSenha, setConfirmarSenha] = useState("");
  const [statusMsg, setStatusMsg] = useState("");
  const [statusTipo, setStatusTipo] = useState("success");
  const [openSnackbar, setOpenSnackbar] = useState(false);

  const handleSubmit = async () => {
    try {
      const response = await api.post("change-password/", {
        senha_atual: senhaAtual,
        nova_senha: novaSenha,
        confirmar_senha: confirmarSenha
      });
      setStatusMsg(response.data.detail || "Senha alterada com sucesso.");
      setStatusTipo("success");
      setSenhaAtual("");
      setNovaSenha("");
      setConfirmarSenha("");
    } catch (error) {
      setStatusMsg(error.response?.data?.detail || "Erro ao alterar a senha.");
      setStatusTipo("error");
    } finally {
      setOpenSnackbar(true);
    }
  };

  return (
    <Container maxWidth="md">
      <Box mt={6}>
        <Typography variant="h4" align="center" fontWeight="bold" sx={{ color: "#1A1E24" }}>
          <LockIcon sx={{ mr: 1 }} />
          Alterar Senha
        </Typography>
        <Typography variant="subtitle1" align="center" color="text.secondary" mb={4}>
          Mantenha sua conta segura alterando sua senha regularmente
        </Typography>

        <Grid container spacing={4}>
          <Grid item xs={12} md={7}>
            <Box
              sx={{
                backgroundColor: "#1A1E24",
                color: "#E0F7FA",
                borderRadius: 3,
                p: 4,
                boxShadow: "0px 6px 20px rgba(0,0,0,0.3)",
                border: "1px solid #2E3A4A",
              }}
            >
              <Typography variant="h6" sx={{ fontWeight: 700, mb: 1 }}>
                🔐 Informações de Segurança
              </Typography>
              <Typography variant="body2" sx={{ mb: 3 }}>
                Digite sua senha atual e escolha uma nova senha
              </Typography>

              {[
                {
                  label: "Senha Atual",
                  value: senhaAtual,
                  setValue: setSenhaAtual,
                  placeholder: "Digite sua senha atual",
                },
                {
                  label: "Nova Senha",
                  value: novaSenha,
                  setValue: setNovaSenha,
                  placeholder: "Digite sua nova senha",
                },
                {
                  label: "Confirmar Nova Senha",
                  value: confirmarSenha,
                  setValue: setConfirmarSenha,
                  placeholder: "Confirme sua nova senha",
                },
              ].map((campo, i) => (
                <TextField
                  key={i}
                  fullWidth
                  type="password"
                  label={campo.label}
                  placeholder={campo.placeholder}
                  value={campo.value}
                  onChange={(e) => campo.setValue(e.target.value)}
                  InputProps={{
                    startAdornment: <LockIcon sx={{ mr: 1, color: "#fff" }} />,
                    sx: { color: "#fff" },
                    inputProps: { style: { color: '#fff' } }
                  }}
                  InputLabelProps={{
                    sx: { color: "#fff" },
                  }}
                  sx={{ mb: 2 }}
                />
              ))}

              <Button
                fullWidth
                variant="contained"
                sx={{
                  mt: 2,
                  background: "linear-gradient(to right, #007bff, #00c6ff)",
                  color: "white",
                  fontWeight: "bold",
                }}
                startIcon={<CheckCircleIcon />}
                onClick={handleSubmit}
              >
                Salvar Alterações
              </Button>
            </Box>
          </Grid>

          <Grid item xs={12} md={5}>
            <Box
              sx={{
                backgroundColor: "#1A1E24",
                color: "#E0F7FA",
                borderRadius: 3,
                p: 3,
                border: "1px solid #2E3A4A",
              }}
            >
              <Typography variant="h6" sx={{ fontWeight: 700, mb: 2 }}>
                🛡️ Dicas de Segurança
              </Typography>

              <Box mb={2} p={2} sx={{ backgroundColor: "#004D40", borderRadius: 2 }}>
                <Typography fontWeight="bold" sx={{ color: "#00E676" }}>
                  <LockIcon fontSize="small" sx={{ mr: 1 }} />
                  Senha Forte
                </Typography>
                <Typography variant="body2">
                  Use pelo menos 8 caracteres com letras maiúsculas, minúsculas, números e símbolos.
                </Typography>
              </Box>

              <Box mb={2} p={2} sx={{ backgroundColor: "#0D1B2A", borderRadius: 2 }}>
                <Typography fontWeight="bold" sx={{ color: "#2196f3" }}>
                  <PersonOffIcon fontSize="small" sx={{ mr: 1 }} />
                  Não Compartilhe
                </Typography>
                <Typography variant="body2">
                  Nunca compartilhe sua senha com outras pessoas ou armazene em locais inseguros.
                </Typography>
              </Box>

              <Box p={2} sx={{ backgroundColor: "#1B5E20", borderRadius: 2 }}>
                <Typography fontWeight="bold" sx={{ color: "#69f0ae" }}>
                  <AutorenewIcon fontSize="small" sx={{ mr: 1 }} />
                  Altere Regularmente
                </Typography>
                <Typography variant="body2">
                  Recomendamos alterar sua senha a cada 3-6 meses para maior segurança.
                </Typography>
              </Box>
            </Box>
          </Grid>
        </Grid>
      </Box>

      <Snackbar
        open={openSnackbar}
        autoHideDuration={4000}
        onClose={() => setOpenSnackbar(false)}
      >
        <Alert onClose={() => setOpenSnackbar(false)} severity={statusTipo} sx={{ width: "100%" }}>
          {statusMsg}
        </Alert>
      </Snackbar>
    </Container>
  );
}
