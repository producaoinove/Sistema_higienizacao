import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import RegisterPage from "./pages/RegisterPage";
import ForgotPasswordPage from "./pages/ForgotPasswordPage";
import LoginPage from "./pages/LoginPage";
import DashboardPage from "./pages/DashboardPage";
import Layout from "./pages/Layout";
import PerfilPage from "./pages/PerfilPage";
import HistoricoPage from "./pages/HistoricoPage";
import MinhaBlacklistPage from "./pages/MinhaBlacklistPage";
import EquipePage from "./pages/EquipePage";
import ConfirmResetPasswordPage from "./pages/ConfirmResetPasswordPage";
import GerarMailingPage from "./pages/GerarMailingPage";



function App() {
  const token = localStorage.getItem("token");

  return (
    <BrowserRouter>
      <Routes>
        {/* Rotas públicas */}
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />
        <Route path="/esqueci-senha" element={<ForgotPasswordPage />} />
        <Route path="/redefinir-senha/:uidb64/:token" element={<ConfirmResetPasswordPage />} />

        {/* Rotas privadas */}
        <Route
          path="/"
          element={token ? <Layout /> : <Navigate to="/login" />}
        >
          <Route index element={<DashboardPage />} />
          <Route path="perfil" element={<PerfilPage />} />
          <Route path="historico" element={<HistoricoPage />} />
          <Route path="/minha-blacklist" element={<MinhaBlacklistPage />} />
          <Route path="/equipe" element={<EquipePage />} />
          <Route path="gerarMailing" element={<GerarMailingPage />} />
        </Route>

        {/* Redirecionamento padrão */}
        <Route path="*" element={<Navigate to={token ? "/" : "/login"} />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
