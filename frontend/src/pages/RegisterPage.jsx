import {
  Box,
  Button,
  Container,
  Paper,
  TextField,
  Typography,
  Snackbar,
  Alert,
  Link
} from "@mui/material";
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAlerta } from "../components/AlertSnackbar";
import api from "../services/api";
import logo from "../assets/logo.png";

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
      await api.post("register/", {
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
    <Box
      sx={{
        minHeight: "100vh",
        background: "#EAF0F6",
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        py: 8,
      }}
    >
      <Paper
        elevation={8}
        sx={{
          p: 4,
          width: "100%",
          maxWidth: 400,
          backgroundColor: "#0F1621",
          borderRadius: 3,
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
          color="#FFFFFF"
          gutterBottom
        >
          Criar Conta
        </Typography>

        <TextField
          label="Usuário"
          fullWidth
          margin="normal"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          InputProps={{
            style: { backgroundColor: "#1A1E24", color: "#fff" },
          }}
          InputLabelProps={{ style: { color: "#AEB4C0" } }}
        />
        <TextField
          label="Email"
          fullWidth
          margin="normal"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          InputProps={{
            style: { backgroundColor: "#1A1E24", color: "#fff" },
          }}
          InputLabelProps={{ style: { color: "#AEB4C0" } }}
        />
        <TextField
          label="Senha"
          type="password"
          fullWidth
          margin="normal"
          value={senha}
          onChange={(e) => setSenha(e.target.value)}
          InputProps={{
            style: { backgroundColor: "#1A1E24", color: "#fff" },
          }}
          InputLabelProps={{ style: { color: "#AEB4C0" } }}
        />

        <Button
          fullWidth
          onClick={handleRegister}
          sx={{
            mt: 3,
            background: "linear-gradient(to right, #0057D8, #00B2FF)",
            color: "#fff",
            fontWeight: "bold",
            borderRadius: 2,
            "&:hover": {
              background: "linear-gradient(to right, #004bbd, #00a2e0)",
            },
          }}
        >
          Criar Conta
        </Button>

        <Box display="flex" justifyContent="space-between" mt={3}>
          <Link
            onClick={() => navigate("/login")}
            underline="hover"
            sx={{ color: "#007BFF", cursor: "pointer", fontSize: 13 }}
          >
            Já tenho conta
          </Link>
          <Link
            onClick={() => navigate("/esqueci-senha")}
            underline="hover"
            sx={{ color: "#007BFF", cursor: "pointer", fontSize: 13 }}
          >
            Esqueci minha senha
          </Link>
        </Box>
      </Paper>

      <Snackbar open={!!msg} autoHideDuration={4000} onClose={() => setMsg("")}>
        <Alert severity={tipo} onClose={() => setMsg("")}>{msg}</Alert>
      </Snackbar>
      <AlertaComponent />
    </Box>
  );
}
