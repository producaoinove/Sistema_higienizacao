// Página principal – visual dark theme
import { useState } from "react";
import api from "../services/api";
import {
  Container, Typography, Box, Tabs, Tab, Snackbar, Alert, Divider, Paper,
  Dialog, DialogTitle, DialogContent, IconButton, useTheme
} from "@mui/material";
import TabNumerosIndividuais from "../components/TabNumerosIndividuais";
import TabLotesBlacklist from "../components/TabLotesBlacklist";
import CloseIcon from "@mui/icons-material/Close";

export default function MinhaBlacklistPage() {
  const [tabIndex, setTabIndex] = useState(0);
  const [snackbar, setSnackbar] = useState({ open: false, message: "", severity: "info" });
  const [modalNumeros, setModalNumeros] = useState({ open: false, numeros: [], nomeLote: "" });
  const theme = useTheme();

  const handleChange = (_, newValue) => setTabIndex(newValue);
  const showSnackbar = (message, severity = "info") => setSnackbar({ open: true, message, severity });

  const abrirModalLote = async (loteId, nome) => {
    try {
      const res = await api.get(`blacklist/lote/${loteId}/numeros/`);
      setModalNumeros({ open: true, numeros: res.data, nomeLote: nome });
    } catch {
      showSnackbar("Erro ao carregar números do lote", "error");
    }
  };

  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 6 }}>
      <Paper elevation={3} sx={{ p: 4, mb: 3, background: "#0F121A", borderRadius: 3 }}>
        <Typography variant="h5" fontWeight="bold" textAlign="center" sx={{ color: "white", mb: 1 }}>
          🛡️ Gerenciamento da Blacklist
        </Typography>
        <Typography variant="body2" textAlign="center" sx={{ color: theme.palette.grey[400] }}>
          Visualize, edite e organize os números bloqueados da sua operação
        </Typography>
        <Divider sx={{ my: 3, background: theme.palette.grey[700] }} />

        <Tabs
          value={tabIndex}
          onChange={handleChange}
          centered
          TabIndicatorProps={{ sx: { background: "#007BFF" } }}
        >
          <Tab
            label="NÚMEROS INDIVIDUAIS"
            sx={{ color: tabIndex === 0 ? "#fff" : theme.palette.grey[500], fontWeight: 600 }}
          />
          <Tab
            label="LOTES DA BLACKLIST"
            sx={{ color: tabIndex === 1 ? "#fff" : theme.palette.grey[500], fontWeight: 600 }}
          />
        </Tabs>
      </Paper>

      {tabIndex === 0 && <TabNumerosIndividuais showSnackbar={showSnackbar} />}
      {tabIndex === 1 && (
        <TabLotesBlacklist showSnackbar={showSnackbar} onVisualizarNumeros={abrirModalLote} />
      )}

      {/* Modal Visualizar Números do Lote */}
      <Dialog
        open={modalNumeros.open}
        onClose={() => setModalNumeros({ open: false, numeros: [], nomeLote: "" })}
        maxWidth="sm"
        fullWidth
        PaperProps={{ sx: { background: "#1C1F2A", borderRadius: 2 } }}
      >
        <DialogTitle sx={{ color: "white", fontWeight: 600 }}>
          Números do lote: {modalNumeros.nomeLote}
          <IconButton
            onClick={() => setModalNumeros({ open: false, numeros: [], nomeLote: "" })}
            sx={{ position: "absolute", right: 8, top: 8, color: theme.palette.grey[400] }}
          >
            <CloseIcon />
          </IconButton>
        </DialogTitle>
        <DialogContent dividers sx={{ maxHeight: 350, overflowY: "auto", color: "white" }}>
          {modalNumeros.numeros.length ? (
            <Box component="ul" sx={{ pl: 3, m: 0 }}>
              {modalNumeros.numeros.map((n, idx) => (
                <li key={idx}>{n}</li>
              ))}
            </Box>
          ) : (
            <Typography variant="body2" sx={{ color: theme.palette.grey[400] }}>
              Nenhum número neste lote.
            </Typography>
          )}
        </DialogContent>
      </Dialog>

      {/* Snackbar */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={4000}
        onClose={() => setSnackbar(prev => ({ ...prev, open: false }))}
      >
        <Alert severity={snackbar.severity}>{snackbar.message}</Alert>
      </Snackbar>
    </Container>
  );
}
