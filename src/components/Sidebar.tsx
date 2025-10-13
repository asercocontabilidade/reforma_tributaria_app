import { NavLink } from "react-router-dom";
import { isAdmin, useAuth } from "../contexts/AuthContext";
import ThemeToggle from "./ThemeToggle";

type SidebarProps = {
  isOpen: boolean;
  onClose: () => void;
};

export default function Sidebar({ isOpen, onClose }: SidebarProps) {
  const { role, clear } = useAuth();
  const admin = isAdmin(role);

  const linkBase =
    "flex items-center gap-2 px-4 py-3 rounded-xl text-white/90 hover:bg-white/10 focus:outline-none focus:ring-2 focus:ring-white/40 transition";
  const linkActive = "bg-white/10";

  return (
    <>
      {isOpen && <div className="backdrop md:hidden" onClick={onClose} aria-hidden="true" />}

      <aside
        className={[
          "fixed left-0 top-0 z-40 h-screen w-64 bg-primary text-white p-4 flex flex-col transition-transform md:translate-x-0",
          isOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0"
        ].join(" ")}
        aria-hidden={!isOpen}
        aria-label="Menu lateral"
      >
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

        <nav className="flex-1 space-y-2">
          <NavLink
            to="/"
            end
            className={({ isActive }) => `${linkBase} ${isActive ? linkActive : ""}`}
            onClick={onClose}
          >
            🏠 Home
          </NavLink>
          <NavLink
            to="/itens"
            className={({ isActive }) => `${linkBase} ${isActive ? linkActive : ""}`}
            onClick={onClose}
          >
            🔎 Pesquisar Itens NCM
          </NavLink>
          {admin && (
            <NavLink
              to="/cadastro"
              className={({ isActive }) => `${linkBase} ${isActive ? linkActive : ""}`}
              onClick={onClose}
            >
              🧾 Cadastro
            </NavLink>
          )}
        </nav>

        {/* Toggle de tema dentro da lateral */}
        <div className="mt-2 flex items-center justify-between gap-2">
          <span className="text-sm text-white/80">Tema</span>
          <ThemeToggle />
        </div>

        <button
          onClick={() => { clear(); onClose(); }}
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

