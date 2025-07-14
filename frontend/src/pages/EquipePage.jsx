import { useState } from "react";
import {
  Container, Typography, Box, TextField, Button, Grid, Snackbar, Alert, Paper
} from "@mui/material";
import PersonIcon from "@mui/icons-material/Person";
import EmailIcon from "@mui/icons-material/Email";
import LockIcon from "@mui/icons-material/Lock";
import InfoIcon from "@mui/icons-material/Info";
import MailOutlineIcon from "@mui/icons-material/MailOutline";
import BusinessIcon from "@mui/icons-material/Business";

import api from "../services/api";

export default function EquipePage() {
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [senha, setSenha] = useState("");
  const [msg, setMsg] = useState("");
  const [open, setOpen] = useState(false);

  const handleCriarUsuario = async () => {
    try {
      const res = await api.post("usuarios/empresa/", {
        username,
        email,
        password: senha,
      });

      setMsg(res.data.detail);
      setUsername("");
      setEmail("");
      setSenha("");
    } catch (err) {
      setMsg(err.response?.data?.detail || "Erro ao criar usuário");
    } finally {
      setOpen(true);
    }
  };

  return (
    <Container maxWidth="lg">
      <Box textAlign="center" mt={6} mb={4}>
        <Typography variant="h4" fontWeight="bold" color="text.primary">
          👥 Adicionar Colaborador
        </Typography>
        <Typography variant="subtitle1" color="text.secondary">
          Os novos usuários serão vinculados automaticamente à sua empresa
        </Typography>
      </Box>

      <Grid container spacing={4}>
        {/* Formulário */}
        <Grid item xs={12} md={8}>
          <Paper
            elevation={4}
            sx={{
              backgroundColor: "#1A1E24",
              p: 4,
              borderRadius: 3,
              color: "#ffffff",
            }}
          >
            <Typography variant="h6" fontWeight="bold" gutterBottom>
              👤 Informações do Colaborador
            </Typography>
            <Typography variant="body2" mb={3}>
              Preencha os dados para criar um novo usuário
            </Typography>

            <TextField
              fullWidth
              label="Nome de usuário"
              placeholder="Digite o nome completo"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              InputProps={{
                startAdornment: <PersonIcon sx={{ mr: 1, color: "#fff" }} />,
                sx: { color: "#fff" },
              }}
              InputLabelProps={{
                sx: { color: "#fff" },
              }}
              sx={{ mb: 2 }}
            />

            <TextField
              fullWidth
              label="Email"
              placeholder="exemplo@empresa.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              InputProps={{
                startAdornment: <EmailIcon sx={{ mr: 1, color: "#fff" }} />,
                sx: { color: "#fff" },
              }}
              InputLabelProps={{
                sx: { color: "#fff" },
              }}
              sx={{ mb: 2 }}
            />

            <TextField
              fullWidth
              label="Senha"
              type="password"
              placeholder="Digite uma senha segura"
              value={senha}
              onChange={(e) => setSenha(e.target.value)}
              InputProps={{
                startAdornment: <LockIcon sx={{ mr: 1, color: "#fff" }} />,
                sx: { color: "#fff" },
              }}
              InputLabelProps={{
                sx: { color: "#fff" },
              }}
              sx={{ mb: 3 }}
            />

            <Button
              variant="contained"
              fullWidth
              sx={{
                py: 1.5,
                fontWeight: "bold",
                background: "linear-gradient(90deg, #00C9A7, #007CF0)",
              }}
              onClick={handleCriarUsuario}
            >
              + Criar Usuário
            </Button>
          </Paper>
        </Grid>

        {/* Card lateral com informações */}
        <Grid item xs={12} md={4}>
          <Paper
            elevation={4}
            sx={{
              backgroundColor: "#121721",
              color: "#FFFFFF",
              p: 3,
              borderRadius: 3,
              boxShadow: "0 6px 20px rgba(0,0,0,0.3)",
            }}
          >
            <Typography variant="h6" fontWeight="bold" gutterBottom>
              <InfoIcon sx={{ verticalAlign: "middle", mr: 1 }} />
              Informações Importantes
            </Typography>

            <Box mb={2} mt={1} p={2} sx={{ backgroundColor: "#003A32", borderRadius: 2 }}>
              <Typography variant="subtitle2" sx={{ color: "#00E676", fontWeight: "bold" }}>
                ✅ Acesso Automático
              </Typography>
              <Typography variant="body2">
                O colaborador receberá acesso imediato após a criação da conta.
              </Typography>
            </Box>

            <Box mb={2} p={2} sx={{ backgroundColor: "#002B5B", borderRadius: 2 }}>
              <Typography variant="subtitle2" sx={{ color: "#40C4FF", fontWeight: "bold" }}>
                🏢 Vinculação Empresarial
              </Typography>
              <Typography variant="body2">
                O usuário será automaticamente vinculado à sua empresa atual.
              </Typography>
            </Box>

            <Box p={2} sx={{ backgroundColor: "#2C3E50", borderRadius: 2 }}>
              <Typography variant="subtitle2" sx={{ color: "#FFEB3B", fontWeight: "bold" }}>
                📧 Notificação por Email
              </Typography>
              <Typography variant="body2">
                Um email de boas-vindas será enviado com as credenciais de acesso.
              </Typography>
            </Box>
          </Paper>
        </Grid>
      </Grid>

      {/* Feedback de criação */}
      <Snackbar open={open} autoHideDuration={4000} onClose={() => setOpen(false)}>
        <Alert onClose={() => setOpen(false)} severity={msg.includes("sucesso") ? "success" : "error"}>
          {msg}
        </Alert>
      </Snackbar>
    </Container>
  );
}
