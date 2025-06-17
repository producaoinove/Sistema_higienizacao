import { useState } from "react";
import {
  Container, Typography, Box, TextField, Button, Snackbar, Alert
} from "@mui/material";
import axios from "axios";

export default function EquipePage() {
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [senha, setSenha] = useState("");
  const [msg, setMsg] = useState("");
  const [open, setOpen] = useState(false);

  const handleCriarUsuario = async () => {
    const token = localStorage.getItem("token");
    try {
      const res = await axios.post("http://168.121.7.194:9001/api/usuarios/empresa/", {
        username, email, password: senha,
      }, {
        headers: { Authorization: `Bearer ${token}` }
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
    <Container maxWidth="sm">
      <Box mt={6} textAlign="center">
        <Typography variant="h4" fontWeight="bold">👥 Adicionar Colaborador</Typography>
        <Typography variant="subtitle1" color="text.secondary" mb={4}>
          Os novos usuários serão vinculados automaticamente à sua empresa
        </Typography>

        <TextField fullWidth label="Nome de usuário" value={username} onChange={(e) => setUsername(e.target.value)} sx={{ mb: 2 }} />
        <TextField fullWidth label="Email" value={email} onChange={(e) => setEmail(e.target.value)} sx={{ mb: 2 }} />
        <TextField fullWidth type="password" label="Senha" value={senha} onChange={(e) => setSenha(e.target.value)} sx={{ mb: 2 }} />

        <Button variant="contained" onClick={handleCriarUsuario}>Criar Usuário</Button>
      </Box>

      <Snackbar open={open} autoHideDuration={4000} onClose={() => setOpen(false)}>
        <Alert onClose={() => setOpen(false)} severity={msg.includes("sucesso") ? "success" : "error"}>
          {msg}
        </Alert>
      </Snackbar>
    </Container>
  );
}
