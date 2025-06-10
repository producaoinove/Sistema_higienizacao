import {
  Box,
  Button,
  Container,
  Paper,
  TextField,
  Typography,
  Snackbar,
  Alert,
} from "@mui/material";
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAlerta } from "../components/AlertSnackbar";
import axios from "axios";

export default function LoginPage() {
  const navigate = useNavigate();
  const [usuario, setUsuario] = useState("");
  const [senha, setSenha] = useState("");
  const [erro, setErro] = useState("");
  const { mostrarAlerta, AlertaComponent } = useAlerta();

  const handleLogin = async () => {
    try {
      const res = await axios.post("http://168.121.7.194:9001/api/login/", {
        username: usuario,
        password: senha,
      });
      mostrarAlerta("Login realizado com sucesso!", "success");
      localStorage.setItem("token", res.data.access);
      window.location.href = "/";
    } catch (err) {
      mostrarAlerta("Usuário ou senha inválidos.", "error");
    }
  };

  return (
    <Container maxWidth="sm">
      <Paper elevation={4} sx={{ mt: 10, p: 4, borderRadius: 3 }}>
        <Typography variant="h5" fontWeight="bold" gutterBottom align="center">
          🔐 Acesso ao Sistema
        </Typography>

        <TextField
          label="Usuário"
          fullWidth
          margin="normal"
          value={usuario}
          onChange={(e) => setUsuario(e.target.value)}
        />
        <TextField
          label="Senha"
          type="password"
          fullWidth
          margin="normal"
          value={senha}
          onChange={(e) => setSenha(e.target.value)}
        />

        <Button
          variant="contained"
          fullWidth
          sx={{ mt: 2, textTransform: "none" }}
          onClick={handleLogin}
        >
          Entrar
        </Button>

        <Box mt={3} display="flex" justifyContent="space-between">
          <Button variant="text" onClick={() => navigate("/register")}>
            Criar conta
          </Button>
          <Button variant="text" onClick={() => navigate("/esqueci-senha")}>
            Esqueci minha senha
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
