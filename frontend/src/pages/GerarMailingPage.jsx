// GerarMailingPage — card escuro + dropdowns escuros com seleção verde
import React, { useEffect, useState } from "react";
import {
  Box,
  TextField,
  InputLabel,
  MenuItem,
  FormControl,
  Select,
  Typography,
  Button,
  Checkbox,
  ListItemText,
  OutlinedInput,
  RadioGroup,
  FormControlLabel,
  Radio,
  Autocomplete,
  Card,
  InputAdornment,
  Tooltip,
  Paper,
} from "@mui/material";
import LocationOnIcon from "@mui/icons-material/LocationOn";
import ApartmentIcon from "@mui/icons-material/Apartment";
import DownloadIcon from "@mui/icons-material/Download";
import SearchIcon from "@mui/icons-material/Search";
import api from "../services/api";

export default function GerarMailingPage() {
  // ---------- state ----------
  const [ufs] = useState(["AC", "AL", "AM", "AP", "BA", "CE", "DF", "ES", "GO", "MA", "MG", "MS", "MT", "PA", "PB", "PE", "PI", "PR", "RJ", "RN", "RO", "RR", "RS", "SC", "SE", "SP", "TO"]);
  const [cidades, setCidades] = useState([]);
  const [carregandoCidades, setCarregandoCidades] = useState(false);
  const [opcoesCnaes, setOpcoesCnaes] = useState([]);
  const [progresso, setProgresso] = useState(null);
  const [filtros, setFiltros] = useState({
    cnae_fiscal: [],
    uf: "",
    municipios: [],
    tipo_telefone: "todos",
    busca_termo: "",
  });

  // ---------- efeitos ----------
  useEffect(() => {
    api.get("cnaes/").then((res) => {
      const lista = res.data.map((it) => {
        const [codigo] = it.split(" - ");
        return { codigo: codigo.trim(), label: it.trim() };
      });
      setOpcoesCnaes(lista);
    });
  }, []);

  useEffect(() => {
    if (filtros.uf) {
      setCarregandoCidades(true);
      api
        .get(`cidades/?uf=${filtros.uf}`)
        .then((res) => { setCidades(res.data); setCarregandoCidades(false); })
        .catch(() => { setCidades([]); setCarregandoCidades(false); });
    } else setCidades([]);
  }, [filtros.uf]);

  // ---------- helpers ----------
  const handleChange = (e) => setFiltros({ ...filtros, [e.target.name]: e.target.value });

  const exportarCSV = async () => {
    const taskId = await iniciarExportacaoAssincrona();
    if (taskId) await verificarProgressoEbaixar(taskId);
  };

  const verificarProgressoEbaixar = async (taskId) => {
    const maxTentativas = 300;
    let tentativas = 0;
    setProgresso(0);

    while (tentativas < maxTentativas) {
      await new Promise((r) => setTimeout(r, 2000));
      const statusRes = await api.get(`async/tasks/${taskId}/`);

      const progressoAtual = statusRes.data?.progresso ?? 0; // <- CORRIGIDO AQUI
      setProgresso(progressoAtual);

      if (progressoAtual === 100) {
        const nomeArquivo = statusRes.data?.resultado?.arquivo ?? "mailing.zip";

        const download = await api.get(
          `async/tasks/${taskId}/download/?filename=${encodeURIComponent(nomeArquivo)}`,
          { responseType: "blob" }
        );

        const url = URL.createObjectURL(new Blob([download.data]));
        const a = document.createElement("a");
        a.href = url;
        a.download = nomeArquivo;
        document.body.appendChild(a);
        a.click();
        a.remove();


        setTimeout(() => {
          setProgresso(null);
        }, 1000);

        return;
      }

      tentativas++;
    }

    setProgresso(null);
    alert("Tempo excedido ao gerar arquivo ZIP.");
  };



  const iniciarExportacaoAssincrona = async () => {
    const p = new URLSearchParams();
    Object.entries(filtros).forEach(([k, v]) => {
      Array.isArray(v) ? v.forEach((x) => p.append(k, x)) : v && p.append(k, v);
    });

    try {
      const res = await api.post(`async/tasks/?${p.toString()}`);
      return res.data.task_id;
    } catch {
      alert("Erro ao iniciar exportação assíncrona.");
      return null;
    }
  };
  // ---------- estilo dropdown escuro ----------
  const menuDarkProps = {
    PaperProps: {
      sx: {
        bgcolor: "#0F121B",
        color: "#fff",
        "& .MuiMenuItem-root": { fontSize: 14 },
        "& .MuiMenuItem-root:hover": { bgcolor: "#1A1E24" },
        "& .Mui-selected": { bgcolor: "#00C46A !important", color: "#fff" },
      },
    },
  };

  // ---------- render ----------
  return (
    <Box sx={{ background: "#e8ecf4", px: { xs: 2, md: 6 }, py: 4 }}>
      <Card elevation={6} sx={{ background: "#0F121B", color: "#fff", borderRadius: 3, p: { xs: 3, md: 4 } }}>
        {/* título */}
        <Box display="flex" alignItems="center" gap={1} mb={3}>
          <SearchIcon sx={{ color: "white", fontSize: 24 }} />
          <Typography variant="h6" fontWeight={600}>Filtros de Busca</Typography>
        </Box>

        {/* termo de busca */}
        <Typography variant="body2" sx={{ mb: 1 }}>Buscar por termo (razão social ou fantasia)</Typography>
        <TextField
          placeholder="Digite o termo de busca..."
          fullWidth
          value={filtros.busca_termo}
          onChange={(e) => setFiltros({ ...filtros, busca_termo: e.target.value })}
          InputProps={{ sx: { bgcolor: "#717783", borderRadius: 1, color: "#fff" } }}
          sx={{ mb: 3 }}
        />

        {/* grid filtros */}
        <Box display="grid" gap={3} gridTemplateColumns={{ xs: "1fr", md: "repeat(3,1fr)" }}>
          {/* CNAE */}
          <Autocomplete
            multiple
            options={opcoesCnaes}
            getOptionLabel={(o) => o.label}
            value={opcoesCnaes.filter((o) => filtros.cnae_fiscal.includes(o.codigo))}
            onChange={(_, v) => setFiltros({ ...filtros, cnae_fiscal: v.map((x) => x.codigo) })}
            PaperComponent={({ children, ...props }) => (
              <Paper {...props} sx={{ bgcolor: "#0F121B", color: "#fff", "& .MuiAutocomplete-option": { fontSize: 14 }, "& .MuiAutocomplete-option[aria-selected='true']": { bgcolor: "#00C46A", color: "#fff" } }}>{children}</Paper>
            )}
            renderInput={(params) => (
              <TextField {...params} placeholder="CNAEs" InputProps={{ ...params.InputProps, sx: { bgcolor: "#717783", borderRadius: 1, color: "#fff" } }} />
            )}
          />

          {/* UF */}
          <FormControl>
            <Select
              displayEmpty
              name="uf"
              value={filtros.uf}
              onChange={handleChange}
              input={<OutlinedInput sx={{ background: "#717783", borderRadius: 1 }} />}
              startAdornment={
                <InputAdornment position="start">
                  <LocationOnIcon sx={{ color: "white" }} />
                </InputAdornment>
              }
              MenuProps={{
                PaperProps: {
                  sx: {
                    bgcolor: "#0F121B",
                    color: "white",
                    "& .MuiMenuItem-root": {
                      "&:hover": { backgroundColor: "#1f1f1f" },
                      "&.Mui-selected": {
                        backgroundColor: "#00c776",
                        "&:hover": { backgroundColor: "#00b066" },
                      },
                    },
                  },
                },
              }}
            >
              <MenuItem value="">
                <Typography variant="body2" sx={{ fontStyle: "italic", color: "#ccc" }}>
                  UF
                </Typography>
              </MenuItem>
              {ufs.map((uf) => (
                <MenuItem key={uf} value={uf}>
                  {uf}
                </MenuItem>
              ))}
            </Select>
          </FormControl>


          {/* Cidades */}
          <FormControl>
            <Select
              multiple
              name="municipios"
              value={filtros.municipios}
              onChange={handleChange}
              input={<OutlinedInput sx={{ bgcolor: "#717783", borderRadius: 1, color: "#fff" }} />}
              renderValue={(sel) => sel.join(", ")}
              startAdornment={<InputAdornment position="start"><ApartmentIcon sx={{ color: "#C2D1DF" }} /></InputAdornment>}
              MenuProps={menuDarkProps}
            >
              {cidades.map((cidade) => (
                <MenuItem
                  key={cidade}
                  value={cidade}
                  disableRipple
                  sx={{
                    '&.Mui-selected': { backgroundColor: 'transparent !important' },
                    '&.Mui-focusVisible': { backgroundColor: 'transparent' }
                  }}
                >
                  <Checkbox
                    checked={filtros.municipios.includes(cidade)}
                    sx={{
                      color: "#00CFA0",
                      '&.Mui-checked': {
                        color: "#00CFA0"
                      }
                    }}
                  />
                  <ListItemText primary={cidade} />
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        </Box>

        {/* telefone */}
        <Box mt={4}>
          <Typography variant="body2" sx={{ mb: 1 }}>Telefone</Typography>
          <RadioGroup row name="tipo_telefone" value={filtros.tipo_telefone} onChange={handleChange}>
            {[
              { val: "fixo", label: "Fixo" },
              { val: "movel", label: "Móvel" },
              { val: "todos", label: "Móveis + Fixos" },
            ].map((opt) => (
              <FormControlLabel key={opt.val} value={opt.val} control={<Radio sx={{ color: "#007BFF", "&.Mui-checked": { color: "#00C46A" } }} />} label={<Typography sx={{ color: "#fff" }}>{opt.label}</Typography>} />
            ))}
          </RadioGroup>
        </Box>

        <Box mt={4} textAlign="right">
          <Tooltip title="Exportar resultado em CSV" arrow>
            <Button
              onClick={exportarCSV}
              startIcon={<DownloadIcon />}
              sx={{
                px: 4,
                py: 1.5,
                fontWeight: 600,
                background: "linear-gradient(90deg,#0057D8 0%,#00CFA0 100%)",
                color: "white",
                borderRadius: 1,
                "&:hover": { background: "linear-gradient(90deg,#0044bb 0%,#07b98e 100%)" }
              }}
            >
              EXPORTAR CSV
            </Button>
          </Tooltip>
        </Box>

        {progresso !== null && (
          <Box mt={3}>
            <Typography variant="body2" sx={{ color: "#fff", mb: 1 }}>
              {progresso < 100
                ? `Exportando dados: ${progresso}%`
                : "Preparando download..."}
            </Typography>
            <Box sx={{ width: '100%', background: "#333", borderRadius: 1, overflow: "hidden" }}>
              <Box
                sx={{
                  width: progresso === 0 ? "4%" : `${progresso}%`,
                  height: 8,
                  background:
                    progresso < 100
                      ? "linear-gradient(90deg,#0057D8 0%,#00CFA0 100%)"
                      : "repeating-linear-gradient(90deg,#00CFA0,#00CFA0 10px,#009F84 10px,#009F84 20px)",
                  transition: "width 0.4s ease, background 0.3s ease",
                }}
              />
            </Box>
          </Box>
        )}

      </Card>

      {/* Tip Box */}
      <Paper elevation={0} sx={{ mt: 4, p: 3, background: "#d9f3f9", borderRadius: 2 }}>
        <Typography variant="subtitle1" sx={{ fontWeight: 600, display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
          <Box component="span" sx={{ width: 8, height: 8, borderRadius: '50%', background: '#00CFA0' }} />
          Dica de uso
        </Typography>
        <Typography variant="body2" sx={{ color: '#555' }}>
          Utilize os filtros para segmentar sua lista de contatos. Quanto mais específicos os critérios, melhor será a qualidade do mailing gerado.
        </Typography>
      </Paper>
    </Box>
  );
}
