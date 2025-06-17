// frontend: Painel de blacklist do cliente

import { useEffect, useState } from "react";
import axios from "axios";
import {
  Container, Typography, Box, Button, Table, TableHead, TableRow,
  TableCell, TableBody, IconButton, Input, Snackbar, Alert, CircularProgress
} from "@mui/material";
import DeleteIcon from "@mui/icons-material/Delete";
import DownloadIcon from "@mui/icons-material/Download";
import CloudUploadIcon from "@mui/icons-material/CloudUpload";
import SendIcon from "@mui/icons-material/Send";


export default function MinhaBlacklist() {
  const [blacklist, setBlacklist] = useState([]);
  const [loading, setLoading] = useState(false);
  const [nextPage, setNextPage] = useState(null);
  const [file, setFile] = useState(null);
  const [mensagem, setMensagem] = useState("");
  const [openSnackbar, setOpenSnackbar] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [novoNumero, setNovoNumero] = useState("");
  const [blacklistOriginal, setBlacklistOriginal] = useState([]);

  const token = localStorage.getItem("token");

  const fetchBlacklist = async () => {
    setLoading(true);
    try {
      const res = await axios.get("http://168.121.7.194:9001/api/blacklist_cliente/", {
        headers: { Authorization: `Bearer ${token}` }
      });
      console.log("Resposta da API:", res.data); // ✅ agora sim
      setBlacklist(res.data.results || []);
      setBlacklistOriginal(res.data.results || []);
      setNextPage(res.data.next);
    } catch (err) {
      console.error("Erro ao buscar blacklist", err);
    } finally {
      setLoading(false);
    }
  };


  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) {
      window.location.href = "/login"; // redireciona se não estiver logado
      return;
    }
    fetchBlacklist();
  }, []);


  const handleDelete = async (id) => {
    try {
      await axios.delete(`http://168.121.7.194:9001/api/blacklist_cliente/${id}/`, {
        headers: { Authorization: `Bearer ${token}` }
      });

      // Remover localmente da lista sem recarregar tudo
      setBlacklist(prev => prev.filter(item => item.id !== id));
    } catch (err) {
      console.error("Erro ao excluir", err);
      setMensagem("Erro ao excluir número.");
      setOpenSnackbar(true);
    }
  };

  const handleUpload = async () => {
    if (!file) return;
    setUploading(true);
    const formData = new FormData();
    formData.append("arquivo", file);

    try {
      const res = await axios.post("http://168.121.7.194:9001/api/upload_blacklist_cliente/", formData, {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "multipart/form-data",
        },
      });
      setMensagem(res.data.detail);
      fetchBlacklist();
    } catch (err) {
      setMensagem("Erro ao enviar o arquivo");
    } finally {
      setUploading(false);
      setOpenSnackbar(true);
    }
  };

  const handleAdicionarManual = async () => {
    if (!novoNumero) return;

    try {
      const res = await axios.post("http://168.121.7.194:9001/api/adicionar_blacklist_cliente/", {
        numero: novoNumero
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });

      setNovoNumero("");
      // Adiciona o novo número localmente com fallback de data
      setBlacklist(prev => [
        ...prev,
        {
          id: Date.now(), // fallback visual
          numero: novoNumero,
          created_at: new Date().toISOString()
        }
      ]);

      setMensagem("Número adicionado com sucesso.");
      setOpenSnackbar(true);
    } catch (err) {
      console.error("Erro ao adicionar manualmente", err);
      setMensagem("Erro ao adicionar número.");
      setOpenSnackbar(true);
    }
  };
  console.log("Blacklist atual:", blacklist);

  return (
    <Container maxWidth="md">
      <Box mt={4} mb={3} textAlign="center">
        <Typography variant="h5" fontWeight="bold">📵 Minha Blacklist</Typography>
        <Typography variant="body2">Gerencie os números que deseja excluir da higienização</Typography>
      </Box>

      <Box
        display="flex"
        flexDirection={{ xs: "column", sm: "row" }}
        gap={2}
        mb={3}
        alignItems="center"
        justifyContent="space-between"
        flexWrap="wrap"
      >
        <label htmlFor="file-upload">
          <Input
            id="file-upload"
            type="file"
            sx={{ display: "none" }}
            onChange={(e) => setFile(e.target.files[0])}
          />
          <Button
            component="span"
            variant="outlined"
            color="primary"
            startIcon={<CloudUploadIcon />}
          >
            {file ? file.name : "Selecionar Arquivo"}
          </Button>
        </label>

        <Box display="flex" gap={2}>
          <Button
            onClick={handleUpload}
            variant="contained"
            color="primary"
            startIcon={<SendIcon />}
            disabled={uploading || !file}
          >
            Enviar Blacklist
          </Button>

          <Button
            variant="outlined"
            color="secondary"
            startIcon={<DownloadIcon />}
            href="http://168.121.7.194:9001/api/baixar_blacklist_cliente/"
            target="_blank"
          >
            Baixar Atual
          </Button>
        </Box>
      </Box>

      <Box display="flex" justifyContent="space-between" mb={2} gap={2}>
        <Input
          fullWidth
          placeholder="🔍 Buscar número..."
          onChange={(e) => {
            const termo = e.target.value.toLowerCase();
            const filtrados = blacklistOriginal.filter((item) =>
              item.numero.toString().includes(termo)
            );
            setBlacklist(filtrados);
          }}
        />

        <Box display="flex" gap={1}>
          <Input
            placeholder="(84) 99123-4567"
            value={novoNumero}
            onChange={(e) => setNovoNumero(e.target.value)}
          />
          <Button
            variant="contained"
            color="success"
            onClick={handleAdicionarManual}
          >
            Adicionar
          </Button>
        </Box>
      </Box>


      {loading ? <CircularProgress /> : (
        <Table size="small">
          <TableHead>
            <TableRow>
              <TableCell>Número</TableCell>
              <TableCell>Data</TableCell>
              <TableCell>Ações</TableCell>
            </TableRow>
          </TableHead>
          {Array.isArray(blacklist) && blacklist.length > 0 ? (
            <TableBody>
              {blacklist.map((item) => (
                <TableRow key={item.id}>
                  <TableCell>{item.numero}</TableCell>
                  <TableCell>
                    {item.created_at ? new Date(item.created_at).toLocaleString() : "-"}
                  </TableCell>
                  <TableCell>
                    <IconButton onClick={() => handleDelete(item.id)}>
                      <DeleteIcon />
                    </IconButton>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          ) : (
            <TableBody>
              <TableRow>
                <TableCell colSpan={3} align="center">
                  Nenhum número encontrado.
                </TableCell>
              </TableRow>
            </TableBody>
          )}

        </Table>
      )}

      <Snackbar open={openSnackbar} autoHideDuration={4000} onClose={() => setOpenSnackbar(false)}>
        <Alert onClose={() => setOpenSnackbar(false)} severity="info">{mensagem}</Alert>
      </Snackbar>
    </Container>
  );
}
