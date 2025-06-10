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
import axios from "axios";

export default function ForgotPasswordPage() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [msg, setMsg] = useState("");
  const [tipo, setTipo] = useState("success");

  const handleReset = async () => {
    try {
      await axios.post("http://168.121.7.194:9001/api/reset-password/", { email });
      setMsg("Instruções enviadas para seu e-mail.");
      setTipo("success");
      setTimeout(() => navigate("/login"), 2000);
    } catch {
      setMsg("Erro ao enviar recuperação.");
      setTipo("error");
    }
  };

  return (
    <Container maxWidth="sm">
      <Paper elevation={4} sx={{ mt: 10, p: 4, borderRadius: 3 }}>
        <Typography variant="h5" fontWeight="bold" gutterBottom align="center">
          🔑 Recuperar Senha
        </Typography>

        <TextField label="Email cadastrado" fullWidth margin="normal" value={email} onChange={(e) => setEmail(e.target.value)} />

        <Button fullWidth variant="contained" sx={{ mt: 2 }} onClick={handleReset}>
          Enviar Recuperação
        </Button>
      </Paper>

      <Snackbar open={!!msg} autoHideDuration={4000} onClose={() => setMsg("")}>
        <Alert severity={tipo} onClose={() => setMsg("")}>{msg}</Alert>
      </Snackbar>
    </Container>
  );
}
