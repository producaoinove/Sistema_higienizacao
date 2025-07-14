import { useEffect, useState } from "react";
import api from "../services/api"; // agora tudo via api.js
import {
  Box, Input, Button, Table, TableHead, TableRow,
  TableCell, TableBody, IconButton, CircularProgress, Typography
} from "@mui/material";
import DeleteIcon from "@mui/icons-material/Delete";
import CloudUploadIcon from "@mui/icons-material/CloudUpload";
import DownloadIcon from "@mui/icons-material/Download";
import SendIcon from "@mui/icons-material/Send";

export default function TabNumerosIndividuais({ showSnackbar }) {
  const [blacklist, setBlacklist] = useState([]);
  const [blacklistOriginal, setBlacklistOriginal] = useState([]);
  const [loading, setLoading] = useState(false);
  const [file, setFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [novoNumero, setNovoNumero] = useState("");

  const fetchBlacklist = async () => {
    setLoading(true);
    try {
      const res = await api.get("blacklist_cliente/");
      setBlacklist(res.data.results || []);
      setBlacklistOriginal(res.data.results || []);
    } catch {
      showSnackbar("Erro ao carregar blacklist", "error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBlacklist();
  }, []);

  const handleDelete = async (id) => {
    try {
      await api.delete(`blacklist_cliente/${id}/`);
      setBlacklist(prev => prev.filter(item => item.id !== id));
    } catch {
      showSnackbar("Erro ao excluir número", "error");
    }
  };

  const handleDownload = async () => {
    try {
      const res = await api.get("baixar_blacklist_cliente/", {
        responseType: "blob",
      });

      const url = window.URL.createObjectURL(res.data);
      const a = document.createElement("a");
      a.href = url;
      a.download = "minha_blacklist.csv";
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);
    } catch {
      showSnackbar("Erro ao baixar blacklist", "error");
    }
  };

  const handleUpload = async () => {
    if (!file) return;
    setUploading(true);
    const formData = new FormData();
    formData.append("arquivo", file);

    try {
      const res = await api.post("upload_blacklist_cliente/", formData, {
        headers: { "Content-Type": "multipart/form-data" }
      });
      showSnackbar(res.data.detail || "Arquivo enviado com sucesso", "success");
      fetchBlacklist();
    } catch {
      showSnackbar("Erro ao enviar o arquivo", "error");
    } finally {
      setUploading(false);
    }
  };

  const handleAdicionarManual = async () => {
    if (!novoNumero) return;
    try {
      await api.post("adicionar_blacklist_cliente/", { numero: novoNumero });
      setNovoNumero("");
      fetchBlacklist();
      showSnackbar("Número adicionado com sucesso", "success");
    } catch {
      showSnackbar("Erro ao adicionar número", "error");
    }
  };

  return (
    <Box sx={{ background: "#0e1218", p: 3, borderRadius: 3, mt: 2 }}>
      <Typography variant="h6" sx={{ color: "white", fontWeight: "bold", mb: 2 }}>
        📞 Números Individuais
      </Typography>

      <Box display="flex" flexWrap="wrap" gap={2} alignItems="center" mb={3}>
        <label htmlFor="file-upload-individual">
          <Input
            id="file-upload-individual"
            type="file"
            sx={{ display: "none" }}
            onChange={(e) => setFile(e.target.files[0])}
          />
          <Button
            component="span"
            startIcon={<CloudUploadIcon />}
            sx={{ background: "#00994d", color: "white", px: 2, borderRadius: 1 }}
          >
            Selecionar Arquivo
          </Button>
        </label>

        <Button
          onClick={handleUpload}
          disabled={uploading || !file}
          startIcon={<SendIcon />}
          sx={{ background: "#1c1f26", color: uploading || !file ? "gray" : "white", px: 2, borderRadius: 1 }}
        >
          Enviar Blacklist
        </Button>

        <Button
          onClick={handleDownload}
          startIcon={<DownloadIcon />}
          sx={{ background: "#8e24aa", color: "white", px: 2, borderRadius: 1 }}
        >
          Baixar Atual
        </Button>

        <Input
          placeholder="(84) 99123-4567"
          value={novoNumero}
          onChange={(e) => setNovoNumero(e.target.value)}
          sx={{ background: "#2a2f3a", px: 2, borderRadius: 1, color: "white" }}
        />
        <Button
          variant="contained"
          color="success"
          onClick={handleAdicionarManual}
          sx={{ borderRadius: 1 }}
        >
          Adicionar
        </Button>
      </Box>

      <Input
        fullWidth
        placeholder="Buscar número..."
        sx={{ mb: 2, background: "#2a2f3a", px: 2, borderRadius: 1, color: "white" }}
        onChange={(e) => {
          const termo = e.target.value.toLowerCase();
          const filtrados = blacklistOriginal.filter(item =>
            item.numero.toString().includes(termo)
          );
          setBlacklist(filtrados);
        }}
      />

      {loading ? <CircularProgress /> : (
        <Table size="small" sx={{ background: "#1c1f26", borderRadius: 2 }}>
          <TableHead>
            <TableRow>
              <TableCell sx={{ color: "white" }}>Número</TableCell>
              <TableCell sx={{ color: "white" }}>Data</TableCell>
              <TableCell sx={{ color: "white" }}>Ações</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {blacklist.length > 0 ? (
              blacklist.map(item => (
                <TableRow key={item.id}>
                  <TableCell sx={{ color: "white" }}>{item.numero}</TableCell>
                  <TableCell sx={{ color: "white" }}>{new Date(item.created_at).toLocaleString()}</TableCell>
                  <TableCell>
                    <IconButton onClick={() => handleDelete(item.id)}>
                      <DeleteIcon sx={{ color: "white" }} />
                    </IconButton>
                  </TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={3} align="center" sx={{ color: "white" }}>Nenhum número encontrado.</TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      )}
    </Box>
  );
}
