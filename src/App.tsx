import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { useState } from "react";
import Sidebar from "./components/Sidebar";
import Topbar from "./components/Topbar"; // 👈 voltou
import HomePage from "./pages/HomePage";
import CadastroPage from "./pages/CadastroPage";
import LoginPage from "./pages/LoginPage";
import ProtectedRoute from "./routes/ProtectedRoute";
import { useAuth, isAdmin } from "./contexts/AuthContext";
import { ThemeProvider } from "./contexts/ThemeContext";
import ItemsSearchPage from "./pages/ItemsSearchPage";
import UsersPage from "./pages/UsersPage";
import PageNewLayout from "./pages/PageNewLayout";
import CompaniesPage from "./pages/CompaniesPage";

function Shell() {
  const { role } = useAuth();
  const admin = isAdmin(role);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-[#0b0a28]">
      {/* Sidebar colapsável */}
      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      {/* Topbar compacta sem texto */}
      <Topbar onOpenSidebar={() => setSidebarOpen(true)} />

      {/* Conteúdo (deslocado no desktop pela sidebar) */}
      <main className="p-4 md:p-6 md:ml-64">
        <Routes>
          <Route element={<ProtectedRoute />}>
            <Route path="/" element={<HomePage />} />
            <Route path="/itens" element={<ItemsSearchPage />} />
            <Route path="/usuarios" element={<UsersPage />} />
            <Route path="/empresas" element={<CompaniesPage />} />
            {/* <Route path="*" element={<Navigate to="/usuarios" replace />} /> */}
            {admin ? (
              <Route path="/cadastro" element={<CadastroPage />} />
            ) : (
              <Route path="/cadastro" element={<Navigate to="/" replace />} />
            )}
          </Route>
          <Route path="/pagina" element={<PageNewLayout />} />
          <Route path="*" element={<Navigate to="/pagina" replace />} />
        </Routes>
      </main>
    </div>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <ThemeProvider>
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          <Route path="/*" element={<Shell />} />
        </Routes>
      </ThemeProvider>
    </BrowserRouter>
  );
}


