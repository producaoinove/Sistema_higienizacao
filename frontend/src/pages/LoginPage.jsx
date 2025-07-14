import {
  Box,
  Button,
  Container,
  Paper,
  TextField,
  Typography,
  Snackbar,
  Alert,
  InputAdornment,
  IconButton
} from "@mui/material";
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAlerta } from "../components/AlertSnackbar";
import api from "../services/api";
import MoreHorizIcon from "@mui/icons-material/MoreHoriz";
import logo from '../assets/logo.png';

export default function LoginPage() {
  const navigate = useNavigate();
  const [usuario, setUsuario] = useState("");
  const [senha, setSenha] = useState("");
  const [erro, setErro] = useState("");
  const { mostrarAlerta, AlertaComponent } = useAlerta();

  const handleLogin = async () => {
    try {
      const res = await api.post("login/", {
        username: usuario,
        password: senha,
      });
      mostrarAlerta("Login realizado com sucesso!", "success");
      localStorage.setItem("token", res.data.access);
      window.location.href = "/";
    } catch {
      mostrarAlerta("Usuário ou senha inválidos.", "error");
    }
  };

  return (
    <Container maxWidth="xs" sx={{ display: "flex", justifyContent: "center", alignItems: "center", minHeight: "100vh", background: "#f1f5fa" }}>
      <Paper
        elevation={8}
        sx={{
          p: 4,
          background: "#121826",
          borderRadius: 3,
          width: "100%",
          boxShadow: "0px 4px 20px rgba(0,0,0,0.3)",
        }}
      >
        <Box display="flex" justifyContent="center" mb={2}>
          <img
            src={logo}
            alt="Invertus"
            sx={{
              width: 40,
              height: 40,
              background: "#0057D8",
              borderRadius: 2,
            }}
          />
        </Box>

        <Typography
          variant="h6"
          align="center"
          fontWeight="bold"
          sx={{ color: "#fff", mb: 2 }}
        >
          Acesso ao Sistema
        </Typography>

        <Typography variant="body2" sx={{ color: "#aaa", mb: 1 }}>
          Usuário
        </Typography>
        <TextField
          placeholder="Digite seu usuário"
          fullWidth
          value={usuario}
          onChange={(e) => setUsuario(e.target.value)}
          InputProps={{
            sx: {
              background: "#2A2F3A",
              color: "#fff",
              borderRadius: 1,
            },
            endAdornment: (
              <InputAdornment position="end">
                <IconButton edge="end" disabled>
                  <MoreHorizIcon sx={{ color: "#aaa" }} />
                </IconButton>
              </InputAdornment>
            ),
          }}
        />

        <Typography variant="body2" sx={{ color: "#aaa", mt: 2, mb: 1 }}>
          Senha
        </Typography>
        <TextField
          placeholder="Digite sua senha"
          type="password"
          fullWidth
          value={senha}
          onChange={(e) => setSenha(e.target.value)}
          InputProps={{
            sx: {
              background: "#2A2F3A",
              color: "#fff",
              borderRadius: 1,
            },
            endAdornment: (
              <InputAdornment position="end">
                <IconButton edge="end" disabled>
                  <MoreHorizIcon sx={{ color: "#aaa" }} />
                </IconButton>
              </InputAdornment>
            ),
          }}
        />

        <Button
          fullWidth
          sx={{
            mt: 3,
            fontWeight: "bold",
            background: "linear-gradient(90deg, #0057D8, #00D4FF)",
            color: "#fff",
            borderRadius: 1,
            textTransform: "none",
            ":hover": {
              background: "linear-gradient(90deg, #0044bb, #00c0e6)",
            },
          }}
          onClick={handleLogin}
        >
          Entrar
        </Button>

        <Box mt={4} display="flex" justifyContent="space-between">
          <Button
            variant="text"
            sx={{ color: "#1976D2", fontWeight: 500, textTransform: "none" }}
            onClick={() => navigate("/register")}
          >
            CRIAR CONTA
          </Button>
          <Button
            variant="text"
            sx={{ color: "#1976D2", fontWeight: 500, textTransform: "none" }}
            onClick={() => navigate("/esqueci-senha")}
          >
            ESQUECI MINHA SENHA
          </Button>
        </Box>
      </Paper>

      <Snackbar
        open={!!erro}
        autoHideDuration={4000}
        onClose={() => setErro("")}
      >
        <Alert severity="error" onClose={() => setErro("")}>
          {erro}
        </Alert>
      </Snackbar>

      <AlertaComponent />
    </Container>
  );
}
