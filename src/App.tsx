import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { useState } from "react";
import Sidebar from "./components/Sidebar";
import Topbar from "./components/Topbar";
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

  // No mobile: abre/fecha normalmente. No desktop: permanece aberto ao navegar.
  const [sidebarOpen, setSidebarOpen] = useState(() =>
    typeof window !== "undefined" && window.matchMedia("(min-width: 768px)").matches
  );

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-[#0b0a28]">
      {/* Sidebar */}
      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      {/* Tab lateral (só desktop) quando a sidebar estiver fechada */}
      {!sidebarOpen && (
        <button
          onClick={() => setSidebarOpen(true)}
          className="
            hidden md:flex
            fixed left-0 top-1/2 -translate-y-1/2
            z-50 h-12 w-5
            items-center justify-center
            rounded-r-xl
            bg-primary/90 text-white shadow-lg
            hover:bg-primary focus:outline-none focus:ring-2 focus:ring-primary/40
          "
          aria-label="Abrir menu lateral"
          title="Abrir menu"
        >
          {/* chevron apontando para direita */}
          <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor">
            <path d="M9 6l6 6-6 6" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </button>
      )}

      {/* Topbar (no mobile você usa este botão para abrir) */}
      <Topbar onOpenSidebar={() => setSidebarOpen(true)} />

      {/* Conteúdo principal — desloca no desktop somente quando a sidebar está aberta */}
      <main className={`p-4 md:p-6 transition-[margin] ${sidebarOpen ? "md:ml-64" : "md:ml-0"}`}>
        <Routes>
          <Route element={<ProtectedRoute />}>
            <Route path="/" element={<HomePage />} />
            <Route path="/itens" element={<ItemsSearchPage />} />
            <Route path="/usuarios" element={<UsersPage />} />
            <Route path="/empresas" element={<CompaniesPage />} />
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



