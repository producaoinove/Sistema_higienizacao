import { useState, useEffect } from "react";
import api from "../services/api";
import {
  Box, Button, Typography, Table, TableHead, TableRow,
  TableCell, TableBody, IconButton, CircularProgress, Dialog, DialogTitle,
  DialogContent, DialogActions, TextField, Input, Paper, Tooltip, Stack
} from "@mui/material";
import DeleteIcon from "@mui/icons-material/Delete";
import EditIcon from "@mui/icons-material/Edit";
import CloudUploadIcon from "@mui/icons-material/CloudUpload";
import VisibilityIcon from "@mui/icons-material/Visibility";
import DownloadIcon from "@mui/icons-material/Download";

export default function TabLotesBlacklist({ showSnackbar }) {
  const [lotes, setLotes] = useState([]);
  const [loading, setLoading] = useState(false);
  const [nomeLote, setNomeLote] = useState("");
  const [file, setFile] = useState(null);
  const [editDialog, setEditDialog] = useState({ open: false, id: null, nome: "" });
  const [busca, setBusca] = useState("");
  const [modalNumeros, setModalNumeros] = useState({ open: false, numeros: [], nome: "" });

  const fetchLotes = async () => {
    setLoading(true);
    try {
      const res = await api.get("blacklist/lote/");
      setLotes(res.data || []);
    } catch {
      showSnackbar("Erro ao carregar lotes", "error");
    } finally {
      setLoading(false);
    }
  };

  const fetchNumerosDoLote = async (lote) => {
    try {
      const res = await api.get(`blacklist/lote/${lote.id}/numeros/`);
      setModalNumeros({ open: true, numeros: res.data, nome: lote.nome });
    } catch {
      showSnackbar("Erro ao buscar números do lote", "error");
    }
  };

  const baixarNumeros = () => {
    const blob = new Blob([
      `numero\n` + modalNumeros.numeros.join("\n")
    ], { type: "text/csv;charset=utf-8;" });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", `${modalNumeros.nome}_numeros.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  useEffect(() => {
    fetchLotes();
  }, []);

  const handleCriarLote = async () => {
    if (!nomeLote || !file) return;
    const formData = new FormData();
    formData.append("nome", nomeLote);
    formData.append("arquivo", file);

    try {
      await api.post("blacklist/lote/criar/", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      setNomeLote("");
      setFile(null);
      fetchLotes();
      showSnackbar("Lote criado com sucesso", "success");
    } catch {
      showSnackbar("Erro ao criar lote", "error");
    }
  };

  const handleExcluirLote = async (id) => {
    try {
      await api.delete(`blacklist/lote/${id}/excluir/`);
      fetchLotes();
      showSnackbar("Lote excluído com sucesso", "success");
    } catch {
      showSnackbar("Erro ao excluir lote", "error");
    }
  };

  const handleRenomearLote = async () => {
    try {
      await api.post(`blacklist/lote/${editDialog.id}/renomear/`, {
        nome: editDialog.nome
      });
      setEditDialog({ open: false, id: null, nome: "" });
      fetchLotes();
      showSnackbar("Lote renomeado com sucesso", "success");
    } catch {
      showSnackbar("Erro ao renomear lote", "error");
    }
  };

  const lotesFiltrados = lotes.filter(l => l.nome.toLowerCase().includes(busca.toLowerCase()));

  return (
    <Paper sx={{ p: 3, backgroundColor: "#0F121A", color: "white", borderRadius: 3 }}>
      <Typography variant="h6" gutterBottom sx={{ color: "white", display: 'flex', alignItems: 'center', gap: 1 }}>
        <Box component="span" sx={{ fontSize: 20 }}>📁</Box> Lotes de Blacklist
      </Typography>

      <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} mb={2} alignItems="center">
        <TextField
          size="small"
          placeholder="Nome do Lote"
          value={nomeLote}
          onChange={(e) => setNomeLote(e.target.value)}
          InputProps={{ sx: { backgroundColor: '#1C1F2A', color: 'white' } }}
        />

        <label htmlFor="file-lote-upload">
          <Input
            id="file-lote-upload"
            type="file"
            sx={{ display: "none" }}
            onChange={(e) => setFile(e.target.files[0])}
          />
          <Button component="span" variant="contained" color="success" startIcon={<CloudUploadIcon />}>
            Selecionar Arquivo
          </Button>
        </label>

        <Button variant="contained" color="primary" onClick={handleCriarLote}>Criar Lote</Button>

        <TextField
          size="small"
          placeholder="Buscar Lote"
          value={busca}
          onChange={(e) => setBusca(e.target.value)}
          InputProps={{ sx: { backgroundColor: '#1C1F2A', color: 'white' } }}
        />
      </Stack>

      {loading ? <CircularProgress /> : (
        <Table size="small" sx={{ backgroundColor: '#1C1F2A', color: 'white' }}>
          <TableHead>
            <TableRow>
              <TableCell sx={{ color: 'white' }}>Nome</TableCell>
              <TableCell sx={{ color: 'white' }}>Total de Números</TableCell>
              <TableCell sx={{ color: 'white' }}>Criado em</TableCell>
              <TableCell sx={{ color: 'white' }} align="center">Ações</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {lotesFiltrados.length > 0 ? lotesFiltrados.map(lote => (
              <TableRow key={lote.id}>
                <TableCell sx={{ color: "#fff" }}>{lote.nome}</TableCell>
                <TableCell>
                  <Box sx={{ backgroundColor: '#2BC48A', px: 1.5, py: 0.2, borderRadius: 10, fontSize: 12, color: 'white', display: 'inline-block' }}>{lote.total_numeros}</Box>
                </TableCell>
                <TableCell sx={{ color: "#fff" }}>{new Date(lote.criado_em).toLocaleString()}</TableCell>
                <TableCell align="center">
                  <Tooltip title="Visualizar Números"><IconButton onClick={() => fetchNumerosDoLote(lote)}><VisibilityIcon sx={{ color: '#ccc' }} /></IconButton></Tooltip>
                  <Tooltip title="Renomear"><IconButton onClick={() => setEditDialog({ open: true, id: lote.id, nome: lote.nome })}><EditIcon sx={{ color: '#ccc' }} /></IconButton></Tooltip>
                  <Tooltip title="Excluir"><IconButton onClick={() => handleExcluirLote(lote.id)}><DeleteIcon sx={{ color: '#ccc' }} /></IconButton></Tooltip>
                </TableCell>
              </TableRow>
            )) : (
              <TableRow>
                <TableCell sx={{ color: "#fff" }} colSpan={4} align="center">Nenhum lote encontrado.</TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      )}

      {/* Modal Números */}
      <Dialog open={modalNumeros.open} onClose={() => setModalNumeros({ open: false, numeros: [], nome: "" })} maxWidth="sm" fullWidth>
        <DialogTitle sx={{ backgroundColor: '#0F121A', color: 'white' }}>Números do Lote: {modalNumeros.nome}</DialogTitle>
        <DialogContent sx={{ backgroundColor: '#1C1F2A', color: 'white' }} dividers>
          <Box sx={{ maxHeight: 300, overflowY: 'auto' }}>
            {modalNumeros.numeros.map((n, i) => (
              <Typography key={i} sx={{ color: 'white' }}>{n}</Typography>
            ))}
          </Box>
        </DialogContent>
        <DialogActions sx={{ backgroundColor: '#1C1F2A' }}>
          <Button onClick={() => setModalNumeros({ open: false, numeros: [], nome: "" })} sx={{ color: '#2196f3' }}>Fechar</Button>
          <Button variant="contained" color="primary" onClick={baixarNumeros} startIcon={<DownloadIcon />}>Exportar CSV</Button>
        </DialogActions>
      </Dialog>

      {/* Modal Renomear */}
      <Dialog open={editDialog.open} onClose={() => setEditDialog({ open: false, id: null, nome: "" })}>
        <DialogTitle sx={{ backgroundColor: '#0F121A', color: 'white' }}>Renomear Lote</DialogTitle>
        <DialogContent sx={{ backgroundColor: '#1C1F2A' }}>
          <TextField
            fullWidth
            placeholder="Novo nome"
            value={editDialog.nome}
            onChange={(e) => setEditDialog(prev => ({ ...prev, nome: e.target.value }))}
            InputProps={{ sx: { color: 'white' } }}
          />
        </DialogContent>
        <DialogActions sx={{ backgroundColor: '#1C1F2A' }}>
          <Button onClick={() => setEditDialog({ open: false, id: null, nome: "" })} sx={{ color: '#2196f3' }}>Cancelar</Button>
          <Button onClick={handleRenomearLote} variant="contained" color="primary">Salvar</Button>
        </DialogActions>
      </Dialog>
    </Paper>
  );
}
