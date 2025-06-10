import { Snackbar, Alert } from "@mui/material";
import { useState } from "react";

export function useAlerta() {
  const [alerta, setAlerta] = useState({ open: false, msg: "", tipo: "success" });

  const mostrarAlerta = (msg, tipo = "success") => {
    setAlerta({ open: true, msg, tipo });
  };

  const AlertaComponent = () => (
    <Snackbar
      open={alerta.open}
      autoHideDuration={4000}
      onClose={() => setAlerta({ ...alerta, open: false })}
      anchorOrigin={{ vertical: "top", horizontal: "center" }}
    >
      <Alert
        onClose={() => setAlerta({ ...alerta, open: false })}
        severity={alerta.tipo}
        variant="filled"
        sx={{ width: "100%" }}
      >
        {alerta.msg}
      </Alert>
    </Snackbar>
  );

  return { mostrarAlerta, AlertaComponent };
}