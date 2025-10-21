import { NavLink } from "react-router-dom";
import { isAdmin, useAuth } from "../contexts/AuthContext";
import { useState } from "react";
import ThemeToggle from "./ThemeToggle";

type SidebarProps = { isOpen: boolean; onClose: () => void };

// ---------- helpers ----------
const cn = (...c: (string | false | null | undefined)[]) => c.filter(Boolean).join(" ");

// ---------- ÍCONES (SVG inline) ----------
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
    <svg
      className={cn(className, "transition-transform", open && "rotate-180")}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
    >
      <path d="M6 9l6 6 6-6" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export default function Sidebar({ isOpen, onClose }: SidebarProps) {
  const { role, clear } = useAuth();
  const admin = isAdmin(role);

  // estados dos accordions
  const [cadastrosOpen, setCadastrosOpen] = useState(false);
  const [financeiroOpen, setFinanceiroOpen] = useState(false);

  const linkBase =
    "flex items-center gap-2 px-4 py-3 rounded-xl text-white/90 hover:bg-white/10 focus:outline-none focus:ring-2 focus:ring-white/40 transition";
  const linkActive = "bg-white/10";

  return (
    <>
      {isOpen && <div className="backdrop md:hidden" onClick={onClose} aria-hidden="true" />}
      <aside
        className={[
          "fixed left-0 top-0 z-40 h-screen w-64 bg-primary text-white p-4 flex flex-col transition-transform md:translate-x-0",
          isOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0",
        ].join(" ")}
        aria-hidden={!isOpen}
        aria-label="Menu lateral"
      >
        {/* Header */}
        <div className="mb-6 flex items-center justify-between">
          <h1 className="text-xl font-bold tracking-wide">Reforma Tributária</h1>
          <button
            onClick={onClose}
            className="md:hidden rounded-lg bg-white/10 px-3 py-2 hover:bg-white/20 focus:outline-none focus:ring-2 focus:ring-white/40"
            aria-label="Fechar menu"
          >
            ✕
          </button>
        </div>

        {/* Navegação */}
        <nav className="flex-1 space-y-2 overflow-y-auto">
          {/* Consulta NCM (mantém fora do dropdown) */}
          {/* Home */}
          <NavLink
            to="/"
            end
            className={({ isActive }) => `${linkBase} ${isActive ? linkActive : ""}`}
            onClick={onClose}
          >
            <IconHome className="w-5 h-5" />
            <span>Home</span>
          </NavLink>

          <NavLink
            to="/itens"
            className={({ isActive }) => `${linkBase} ${isActive ? linkActive : ""}`}
            onClick={onClose}
          >
            <IconSearch className="w-5 h-5" />
            <span>Consulta NCM</span>
          </NavLink>


          {/* Cadastros gerais (apenas admin) */}
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

              <div
                id="cadastros-panel"
                className={cn("overflow-hidden transition-all", cadastrosOpen ? "max-h-40 mt-1" : "max-h-0")}
              >
                <ul className="pl-2">
                  <li>
                    <NavLink
                      to="/cadastro/empresa"
                      className={({ isActive }) =>
                        cn(
                          "ml-6 mt-1 flex items-center gap-2 rounded-lg px-4 py-2 text-white/90 hover:bg-white/10 focus:outline-none focus:ring-2 focus:ring-white/40 transition",
                          isActive && "bg-white/10",
                        )
                      }
                      onClick={onClose}
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
                          isActive && "bg-white/10",
                        )
                      }
                      onClick={onClose}
                    >
                      <IconUsers className="w-5 h-5" />
                      <span>Usuário</span>
                    </NavLink>
                  </li>
                </ul>
              </div>
            </div>
          )}

          {/* Financeiro (novo menu suspenso) */}
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

              <div
                id="financeiro-panel"
                className={cn("overflow-hidden transition-all", financeiroOpen ? "max-h-32 mt-1" : "max-h-0")}
              >
                <ul className="pl-2">
                  <li>
                    <NavLink
                      to="/financeiro/contas"
                      className={({ isActive }) =>
                        cn(
                          "ml-6 mt-1 flex items-center gap-2 rounded-lg px-4 py-2 text-white/90 hover:bg-white/10 focus:outline-none focus:ring-2 focus:ring-white/40 transition",
                          isActive && "bg-white/10",
                        )
                      }
                      onClick={onClose}
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

        {/* Toggle de tema dentro da lateral */}
        <div className="mt-2 flex items-center justify-between gap-2">
          <span className="text-sm text-white/80">Tema</span>
          <ThemeToggle />
        </div>

        {/* Sair */}
        <button
          onClick={() => {
            clear();
            onClose();
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

