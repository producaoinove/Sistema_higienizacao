import { AppBar, Toolbar, Typography, Button, Box } from "@mui/material";
import { useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import api from "../services/api";
import logo from '../assets/logo.png';

export default function Navbar() {
  const navigate = useNavigate();
  const location = window.location.pathname;

  const [username, setUsername] = useState("");
  const [isMaster, setIsMaster] = useState(false);

  const handleLogout = () => {
    localStorage.removeItem("token");
    navigate("/login");
  };

  useEffect(() => {
    api.get("me/")
      .then((res) => {
        setUsername(res.data.username);
        setIsMaster(res.data.is_master);
      })
      .catch(() => {
        setUsername("");
      });
  }, []);

  // Botão customizado
  const NavButton = ({ to, label }) => {
    const isActive = location === to;

    return (
      <Button
        onClick={() => navigate(to)}
        sx={{
          color: isActive ? "#007BFF" : "#FFFFFF",
          backgroundColor: isActive ? "#0F1621" : "transparent",
          fontWeight: 500,
          borderRadius: "8px",
          px: 2,
          textTransform: "none",
          '&:hover': {
            backgroundColor: "#0F1621",
          }
        }}
      >
        {label}
      </Button>
    );
  };

  return (
    <AppBar
      position="static"
      elevation={0}
      sx={{
        backgroundColor: "#1A1E24",
        boxShadow: "none",
      }}
    >
      <Toolbar
        sx={{
          display: "flex",
          justifyContent: "space-between",
          minHeight: "64px",
          px: 4,
        }}
      >
        <Box
          onClick={() => navigate("/")}
          sx={{
            display: "flex",
            alignItems: "center",
            cursor: "pointer",
          }}
        >
          <Box sx={{ position: "relative" }}>
            <img
              src={logo}
              alt="Invertus"
              style={{
                height: 100,
                position: "absolute",
                top: -50,
                left: 0,
              }}
            />
          </Box>
        </Box>

        <Box display="flex" alignItems="center" gap={2}>
          {username && (
            <>
              <Typography variant="body2" sx={{ color: "#C2D1DF" }}>
                Olá, {username} 👋
              </Typography>
              <NavButton to="/" label="Dashboard" />
              <NavButton to="/minha-blacklist" label="Minha Blacklist" />
              <NavButton to="/gerarMailing" label="Gerar Mailing" />
              {isMaster && <NavButton to="/equipe" label="Equipe" />}
              <NavButton to="/perfil" label="Perfil" />
            </>
          )}
          <Button
            onClick={handleLogout}
            sx={{
              backgroundColor: "#00A865",
              color: "#fff",
              fontWeight: 500,
              borderRadius: 2,
              px: 2,
              '&:hover': {
                backgroundColor: '#009457'
              }
            }}
          >
            Sair
          </Button>
        </Box>
      </Toolbar>
    </AppBar>
  );
}
