import React, { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
    Container,
    Typography,
    TextField,
    Button,
    Paper,
    Snackbar,
    Alert,
} from "@mui/material";
import api from "../services/api";

export default function ConfirmResetPasswordPage() {
    const { uidb64, token } = useParams();
    const [novaSenha, setNovaSenha] = useState("");
    const [confirmarSenha, setConfirmarSenha] = useState("");
    const [msg, setMsg] = useState("");
    const [tipo, setTipo] = useState("success");
    const navigate = useNavigate();

    const handleConfirmar = async () => {
        if (novaSenha !== confirmarSenha) {
            setTipo("error");
            setMsg("As senhas não coincidem.");
            return;
        }

        try {
            await api.post(`/redefinir-senha/${uidb64}/${token}/`, {
                senha: novaSenha,
                confirmar: confirmarSenha,
            });

            setTipo("success");
            setMsg("Senha redefinida com sucesso!");
            setTimeout(() => navigate("/login"), 2000);
        } catch (error) {
            setTipo("error");
            setMsg("Erro ao redefinir a senha.");
        }
    };

    return (
        <Container maxWidth="sm">
            <Paper elevation={4} sx={{ p: 4, mt: 6 }}>
                <Typography variant="h5" gutterBottom>
                    Redefinir Senha
                </Typography>

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
                    fullWidth
                    variant="contained"
                    sx={{ mt: 2 }}
                    onClick={handleConfirmar}
                >
                    Confirmar Nova Senha
                </Button>
            </Paper>

            <Snackbar
                open={!!msg}
                autoHideDuration={4000}
                onClose={() => setMsg("")}
            >
                <Alert severity={tipo}>{msg}</Alert>
            </Snackbar>
        </Container>
    );
}
