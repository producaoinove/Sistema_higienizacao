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
import api from "../services/api";
import MailOutlineIcon from "@mui/icons-material/MailOutline";
import logo from '../assets/logo.png';

export default function ForgotPasswordPage() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [msg, setMsg] = useState("");
  const [tipo, setTipo] = useState("success");

  const handleReset = async () => {
    try {
      await api.post("redefinir-senha/", { email });
      setMsg("Instruções enviadas para seu e-mail.");
      setTipo("success");
      setTimeout(() => navigate("/login"), 2000);
    } catch {
      setMsg("Erro ao enviar recuperação.");
      setTipo("error");
    }
  };

  return (
    <Container maxWidth="xs" sx={{ display: "flex", alignItems: "center", justifyContent: "center", minHeight: "100vh", background: "#f1f5fa" }}>
      <Paper
        elevation={8}
        sx={{
          p: 4,
          borderRadius: 3,
          width: "100%",
          background: "#121826",
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
          fontWeight="bold"
          textAlign="center"
          sx={{ color: "#fff", mb: 2 }}
        >
          Recuperar Senha
        </Typography>

        <Typography variant="body2" sx={{ color: "#aaa", mb: 1 }}>
          Email cadastrado
        </Typography>
        <TextField
          placeholder="Digite seu e-mail"
          fullWidth
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          InputProps={{
            sx: {
              background: "#2A2F3A",
              color: "#fff",
              borderRadius: 1,
            },
            endAdornment: (
              <InputAdornment position="end">
                <IconButton edge="end" disabled>
                  <MailOutlineIcon sx={{ color: "#aaa" }} />
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
          onClick={handleReset}
        >
          Enviar Recuperação
        </Button>

        <Box mt={4} textAlign="center">
          <Button
            variant="text"
            onClick={() => navigate("/login")}
            sx={{ color: "#1976D2", textTransform: "none" }}
          >
            Voltar para login
          </Button>
        </Box>
      </Paper>

      <Snackbar open={!!msg} autoHideDuration={4000} onClose={() => setMsg("")}>
        <Alert severity={tipo} onClose={() => setMsg("")}>
          {msg}
        </Alert>
      </Snackbar>
    </Container>
  );
}
