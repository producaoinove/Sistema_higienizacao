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

export default function RegisterPage() {
  const navigate = useNavigate();
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [senha, setSenha] = useState("");
  const [msg, setMsg] = useState("");
  const [tipo, setTipo] = useState("success");
  const { mostrarAlerta, AlertaComponent } = useAlerta();

  const handleRegister = async () => {
    try {
      await axios.post("http://168.121.7.194:9001/api/register/", {
        username,
        email,
        password: senha,
      });
      mostrarAlerta("Conta criada com sucesso!", "success");
      setTimeout(() => navigate("/login"), 2000);
    } catch {
      mostrarAlerta("Erro ao criar conta.", "error");
    }
  };

  return (
    <Container maxWidth="sm">
      <Paper elevation={4} sx={{ mt: 10, p: 4, borderRadius: 3 }}>
        <Typography variant="h5" fontWeight="bold" gutterBottom align="center">
          ✍️ Criar Conta
        </Typography>

        <TextField label="Usuário" fullWidth margin="normal" value={username} onChange={(e) => setUsername(e.target.value)} />
        <TextField label="Email" fullWidth margin="normal" value={email} onChange={(e) => setEmail(e.target.value)} />
        <TextField label="Senha" type="password" fullWidth margin="normal" value={senha} onChange={(e) => setSenha(e.target.value)} />

        <Button fullWidth variant="contained" sx={{ mt: 2 }} onClick={handleRegister}>
          Criar Conta
        </Button>
      </Paper>

      <Snackbar open={!!msg} autoHideDuration={4000} onClose={() => setMsg("")}>
        <Alert severity={tipo} onClose={() => setMsg("")}>{msg}</Alert>
      </Snackbar>
      <AlertaComponent />
    </Container>
  );
}
