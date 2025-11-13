import { NavLink } from "react-router-dom";
import { isAdmin, useAuth } from "../contexts/AuthContext";
import { useEffect, useState } from "react";
import ThemeToggle from "./ThemeToggle";
import bgImage from "../assets/Aserco.png";

// ---------- helpers ----------
const cn = (...c) => c.filter(Boolean).join(" ");

// Hook simples para detectar mobile pelo breakpoint (md = 768px)
function useIsMobile() {
  const [isMobile, setIsMobile] = useState(() => window.matchMedia("(max-width: 767.98px)").matches);
  useEffect(() => {
    const mq = window.matchMedia("(max-width: 767.98px)");
    const handler = (e) => setIsMobile(e.matches);
    mq.addEventListener?.("change", handler);
    return () => mq.removeEventListener?.("change", handler);
  }, []);
  return isMobile;
}

// ---------- ÍCONES ----------
function IconSearch({ className = "w-5 h-5" }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor">
      <circle cx="11" cy="11" r="7" strokeWidth="2" />
      <path d="M21 21l-3.5-3.5" strokeWidth="2" strokeLinecap="round" />
    </svg>
  );
}
function IconHome({ className = "w-5 h-5" }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor">
      <path d="M3 11l9-7 9 7" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M9 22V12h6v10" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}
function IconBuilding({ className = "w-5 h-5" }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor">
      <rect x="3" y="3" width="18" height="18" rx="2" strokeWidth="2" />
      <path d="M9 7h.01M9 11h.01M9 15h.01M15 7h.01M15 11h.01M15 15h.01" strokeWidth="2" strokeLinecap="round" />
      <path d="M3 19h18" strokeWidth="2" />
    </svg>
  );
}
function IconUsers({ className = "w-5 h-5" }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor">
      <path d="M16 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" strokeWidth="2" />
      <circle cx="9" cy="7" r="4" strokeWidth="2" />
      <path d="M22 21v-2a4 4 0 0 0-3-3.87" strokeWidth="2" />
      <path d="M16 3.13a4 4 0 0 1 0 7.75" strokeWidth="2" />
    </svg>
  );
}
function IconWallet({ className = "w-5 h-5" }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor">
      <path d="M3 7h16a2 2 0 0 1 2 2v6a3 3 0 0 1-3 3H5a2 2 0 0 1-2-2V7z" strokeWidth="2" />
      <path d="M16 7V5a2 2 0 0 0-2-2H5" strokeWidth="2" strokeLinecap="round" />
      <circle cx="17.5" cy="12" r="1.25" />
    </svg>
  );
}
function IconChevron({ className = "w-4 h-4", open = false }) {
  return (
    <svg className={cn(className, "transition-transform", open && "rotate-180")} viewBox="0 0 24 24" fill="none" stroke="currentColor">
      <path d="M6 9l6 6 6-6" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

/** Ícone de engrenagem (configurações) */
function GearIcon({ className = "h-5 w-5" }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 512 512"
      fill="none"
      stroke="currentColor"
      strokeWidth="24"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
    >
      <path d="M487.4 315.7l-42.7-24.7c2.8-13.3 4.3-27 4.3-41s-1.5-27.7-4.3-41l42.7-24.7c6.1-3.5 8.4-11 5.4-17.4l-45.3-78.5c-3-5.3-9.2-7.8-15.2-6.1l-50.2 14.4c-21.6-18.4-46.3-33.2-73.1-43.2L301 20.6c-1.1-6.6-6.8-11.4-13.5-11.4h-90c-6.7 0-12.4 4.8-13.5 11.4l-7.6 52.2c-26.8 10-51.5 24.8-73.1 43.2l-50.2-14.4c-6-1.7-12.3.8-15.2 6.1L-7 166.9c-3 6.4-.7 13.9 5.4 17.4l42.7 24.7c-2.8 13.3-4.3 27-4.3 41s1.5 27.7 4.3 41L-1.6 315.7c-6.1 3.5-8.4 11-5.4 17.4l45.3 78.5c3 5.3 9.2 7.8 15.2 6.1l50.2-14.4c21.6 18.4 46.3 33.2 73.1 43.2l7.6 52.2c1.1 6.6 6.8 11.4 13.5 11.4h90c6.7 0 12.4-4.8 13.5-11.4l7.6-52.2c26.8-10 51.5-24.8 73.1-43.2l50.2 14.4c6 1.7 12.3-.8 15.2-6.1l45.3-78.5c3-6.4.7-13.9-5.4-17.4zM256 336c-44.2 0-80-35.8-80-80s35.8-80 80-80 80 35.8 80 80-35.8 80-80 80z" />
    </svg>
  );
}

export default function Sidebar({ isOpen, onClose }) {
  const { role, clear } = useAuth();
  const admin = isAdmin(role);
  const isMobile = useIsMobile();

  const [cadastrosOpen, setCadastrosOpen] = useState(false);
  const [financeiroOpen, setFinanceiroOpen] = useState(false);

  const linkBase =
    "flex items-center gap-2 px-4 py-3 rounded-xl text-white/90 hover:bg-white/10 focus:outline-none focus:ring-2 focus:ring-white/40 transition";
  const linkActive = "bg-white/10";

  // Callback para clique em links: fecha apenas no mobile
  const handleNavClick = () => {
    if (isMobile) onClose();
  };

  return (
    <>
      {/* Backdrop só no mobile */}
      {isOpen && <div className="backdrop md:hidden" onClick={onClose} aria-hidden="true" />}

      {/* <aside
        className={[
          "fixed left-0 top-0 z-40 h-screen w-64 bg-primary text-white p-4 flex flex-col transition-transform md:translate-x-0",
          isOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0",
        ].join(" ")}
        aria-hidden={!isOpen}
        aria-label="Menu lateral"
      > */}

      <aside
        className={[
          "fixed left-0 top-0 z-40 h-screen w-64 text-white p-4 flex flex-col transition-transform",
          isOpen ? "translate-x-0 md:translate-x-0" : "-translate-x-full md:-translate-x-full",
        ].join(" ")}
        style={{
          backgroundImage: `linear-gradient(rgba(0,0,0,0.5), rgba(0,0,0,0.6)), url(${bgImage})`,
          backgroundSize: "cover",
          backgroundPosition: "center",
          backgroundRepeat: "no-repeat",
        }}
        aria-hidden={!isOpen}
        aria-label="Menu lateral"
      >
        {/* Header */}
        {/* Header */}
        <div className="mb-6 flex flex-col items-start gap-3">
          <div className="flex w-full items-center justify-between">
            {/* Botões */}
            <div className="flex items-center gap-2 w-full justify-end">
              {/* Botão fechar - mobile */}
              <button
                onClick={onClose}
                className="md:hidden rounded-lg bg-white/10 px-3 py-2 hover:bg-white/20 focus:outline-none focus:ring-2 focus:ring-white/40"
                aria-label="Fechar menu"
                title="Fechar"
              >
                ✕
              </button>

              {/* Botão esconder - desktop */}
              <button
                onClick={onClose}
                className="hidden md:inline-flex items-center gap-2 rounded-lg bg-white/10 px-3 py-2 hover:bg-white/20 focus:outline-none focus:ring-2 focus:ring-white/40"
                aria-label="Esconder menu lateral"
                title="Esconder"
              >
                <span className="text-sm">Esconder</span>
                <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                  <path d="M15 18l-6-6 6-6" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </button>
            </div>
          </div>

          {/* Título abaixo do botão */}
          <h1 className="text-xl font-bold tracking-wide">Aserco Tributário</h1>
        </div>


        {/* Navegação */}
        <nav
          className="
            flex-1 space-y-2 overflow-y-auto
            scrollbar-hide md:[&::-webkit-scrollbar]:hidden md:[scrollbar-width:none]
          "
        >
          <NavLink to="/" end className={({ isActive }) => `${linkBase} ${isActive ? linkActive : ""}`} onClick={handleNavClick}>
            <IconHome className="w-5 h-5" />
            <span>Página Inicial</span>
          </NavLink>

          <NavLink to="/itens" className={({ isActive }) => `${linkBase} ${isActive ? linkActive : ""}`} onClick={handleNavClick}>
            <IconSearch className="w-5 h-5" />
            <span>Consulta NCM</span>
            
          </NavLink>
          <NavLink
            to="/configuracoes"
            className={({ isActive }) =>
              `${linkBase} ${isActive ? linkActive : ""} group`
            }
            onClick={handleNavClick}
          >
            <GearIcon className="h-5 w-5 opacity-90 group-hover:opacity-100" />
            <span>Configurações</span>
          </NavLink>

          {admin && (
            <div className="mt-2">
              <button
                type="button"
                className={cn(linkBase, "w-full justify-between aria-expanded:bg-white/10")}
                aria-expanded={cadastrosOpen}
                aria-controls="cadastros-panel"
                onClick={() => setCadastrosOpen((v) => !v)}
              >
                <span className="inline-flex items-center gap-2">
                  <IconBuilding className="w-5 h-5" />
                  <span>Cadastros gerais</span>
                </span>
                <IconChevron open={cadastrosOpen} />
              </button>

              <div id="cadastros-panel" className={cn("overflow-hidden transition-all", cadastrosOpen ? "max-h-40 mt-1" : "max-h-0")}>
                <ul className="pl-2">
                  <li>
                    <NavLink
                      to="/empresas"
                      className={({ isActive }) =>
                        cn(
                          "ml-6 mt-1 flex items-center gap-2 rounded-lg px-4 py-2 text-white/90 hover:bg-white/10 focus:outline-none focus:ring-2 focus:ring-white/40 transition",
                          isActive && "bg-white/10"
                        )
                      }
                      onClick={handleNavClick}
                    >
                      <IconBuilding className="w-5 h-5" />
                      <span>Empresa</span>
                    </NavLink>
                  </li>
                  <li>
                    <NavLink
                      to="/usuarios"
                      className={({ isActive }) =>
                        cn(
                          "ml-6 mt-1 flex items-center gap-2 rounded-lg px-4 py-2 text-white/90 hover:bg-white/10 focus:outline-none focus:ring-2 focus:ring-white/40 transition",
                          isActive && "bg-white/10"
                        )
                      }
                      onClick={handleNavClick}
                    >
                      <IconUsers className="w-5 h-5" />
                      <span>Usuário</span>
                    </NavLink>
                  </li>
                </ul>
              </div>
            </div>
          )}

          {admin && (
            <div className="mt-2">
              <button
                type="button"
                className={cn(linkBase, "w-full justify-between aria-expanded:bg-white/10")}
                aria-expanded={financeiroOpen}
                aria-controls="financeiro-panel"
                onClick={() => setFinanceiroOpen((v) => !v)}
              >
                <span className="inline-flex items-center gap-2">
                  <IconWallet className="w-5 h-5" />
                  <span>Financeiro</span>
                </span>
                <IconChevron open={financeiroOpen} />
              </button>

              <div id="financeiro-panel" className={cn("overflow-hidden transition-all", financeiroOpen ? "max-h-32 mt-1" : "max-h-0")}>
                <ul className="pl-2">
                  <li>
                    <NavLink
                      to="/financeiro/contas"
                      className={({ isActive }) =>
                        cn(
                          "ml-6 mt-1 flex items-center gap-2 rounded-lg px-4 py-2 text-white/90 hover:bg-white/10 focus:outline-none focus:ring-2 focus:ring-white/40 transition",
                          isActive && "bg-white/10"
                        )
                      }
                      onClick={handleNavClick}
                    >
                      <IconWallet className="w-5 h-5" />
                      <span>Contas</span>
                    </NavLink>
                  </li>
                </ul>
              </div>
            </div>
          )}
        </nav>

        {/* Toggle de tema */}
        <div className="mt-2 flex items-center justify-between gap-2">
          <span className="text-sm text-white/80">Tema</span>
          <ThemeToggle />
        </div>

        {/* Sair */}
        <button
          onClick={() => {
            clear();
            onClose(); // fecha também no desktop (intencional)
          }}
          className="mt-4 btn bg-white/10 text-white hover:bg-white/20"
          title="Sair"
        >
          Sair
        </button>

        <p className="mt-auto text-xs text-white/60">© {new Date().getFullYear()}</p>
      </aside>
    </>
  );
}


