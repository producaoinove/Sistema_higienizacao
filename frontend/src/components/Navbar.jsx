import { AppBar, Toolbar, Typography, Button, Box } from "@mui/material";
import { useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import axios from "axios";

export default function Navbar() {
  const navigate = useNavigate();
  const [username, setUsername] = useState("");

  const handleLogout = () => {
    localStorage.removeItem("token");
    navigate("/login");
  };

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (token) {
      axios
        .get("http://168.121.7.194:9001/api/me/", {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        })
        .then((res) => {
          setUsername(res.data.username);
        })
        .catch(() => {
          setUsername("");
        });
    }
  }, []);

  return (
    <AppBar position="static" color="primary">
      <Toolbar sx={{ display: "flex", justifyContent: "space-between" }}>
        <Typography
          variant="h6"
          component="div"
          sx={{ cursor: "pointer" }}
          onClick={() => navigate("/")}
        >
          📊 Sistema de Higienização
        </Typography>
        <Box display="flex" alignItems="center" gap={2}>
          {username && (
            <Typography variant="body1" sx={{ color: "white" }}>
              Olá, {username} 👋
            </Typography>
          )}
          <Button color="inherit" onClick={() => navigate("/")}>Dashboard</Button>
          <Button color="inherit" onClick={() => navigate("/perfil")}>Perfil</Button>
          <Button color="inherit" onClick={handleLogout}>Sair</Button>
        </Box>
      </Toolbar>
    </AppBar>
  );
}
