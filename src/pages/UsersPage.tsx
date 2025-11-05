// src/pages/UsersPage.tsx
import { useEffect, useMemo, useRef, useState } from "react";
import {
  createUser,
  fetchUsers,
  updateUserStatus,
  updateAuthenticatedStatus, // deslogar
  fetchUserById,             // pré-preencher edição
  updateUser,                // salvar edição
  fetchCompanyById,          // 👈 buscar razão social
  type UserRow,
  type CreateUserPayload,
  type Role,
} from "../services/UsersService";
import UserFormModal from "../components/UserFormModal";
import UserEditModal from "../components/UserEditModal";

/* =========================================================
   Utils: preservar posição de scroll em ações async
========================================================= */
async function preserveScroll<T>(fn: () => Promise<T>): Promise<T> {
  const x = window.scrollX;
  const y = window.scrollY;
  try {
    const res = await fn();
    requestAnimationFrame(() => window.scrollTo({ left: x, top: y, behavior: "auto" }));
    return res;
  } catch (e) {
    requestAnimationFrame(() => window.scrollTo({ left: x, top: y, behavior: "auto" }));
    throw e;
  }
}

/* =========================================================
   HorizontalScroller
========================================================= */
function HorizontalScroller({
  children,
  className = "",
  step = 240,
}: {
  children: React.ReactNode;
  className?: string;
  step?: number;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const [canLeft, setCanLeft] = useState(false);
  const [canRight, setCanRight] = useState(false);
  const scrollByDir = (dir: 1 | -1, amount = step) => {
    const el = ref.current;
    if (!el) return;
    el.scrollBy({ left: dir * amount, behavior: "smooth" });
  };
  
  function updateArrows() {
    const el = ref.current;
    if (!el) return;
    const { scrollLeft, scrollWidth, clientWidth } = el;
    setCanLeft(scrollLeft > 0);
    setCanRight(scrollLeft + clientWidth < scrollWidth - 1);
  }

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    updateArrows();

    const onScroll = () => updateArrows();
    el.addEventListener("scroll", onScroll, { passive: true });

    const ro = new ResizeObserver(() => updateArrows());
    ro.observe(el);

    const onWinResize = () => updateArrows();
    window.addEventListener("resize", onWinResize, { passive: true });

    const t = setTimeout(updateArrows, 60);

    return () => {
      el.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onWinResize);
      ro.disconnect();
      clearTimeout(t);
    };
  }, []);


  return (
    <div className={`relative isolate ${className}`}>
      <div
        ref={ref}
        className="overflow-x-auto [scrollbar-width:none] [-ms-overflow-style:none]"
        style={{ scrollbarWidth: "none" }}
      >
        <style>{`.no-scrollbar::-webkit-scrollbar{display:none;}`}</style>
        <div className="no-scrollbar min-w-full">{children}</div>
      </div>

      {/* Setas sobre o scroller (acompanham o scroll vertical da página) */}
      <div className="pointer-events-none">
        {canLeft && (
          <button
            type="button"
            onClick={() => scrollByDir(-1)}
            className="absolute left-2 top-1/2 -translate-y-1/2 z-30 rounded-full bg-white p-2 shadow-md ring-1 ring-black/5
                      hover:shadow-lg transition dark:bg-white/10 dark:text-white dark:ring-white/10
                      pointer-events-auto"
            aria-label="Rolagem para a esquerda"
          >
          <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth={2}>
            <path d="M15 18l-6-6 6-6" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
          </button>
        )}

        {canRight && (
          <button
            type="button"
            onClick={() => scrollByDir(1)}
            className="absolute right-2 top-1/2 -translate-y-1/2 z-30 rounded-full bg-white p-2 shadow-md ring-1 ring-black/5
                      hover:shadow-lg transition dark:bg-white/10 dark:text-white dark:ring-white/10
                      pointer-events-auto"
            aria-label="Rolagem para a direita"
          >
          <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth={2}>
            <path d="M9 18l6-6-6-6" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
          </button>
        )}
      </div>
    </div>
  );
}

/* =========================================================
   Status visual
========================================================= */
function StatusBadge({ active }: { active: boolean }) {
  return (
    <span
      className={[
        "inline-flex items-center gap-1 rounded-full px-2 py-1 text-xs font-medium",
        active
          ? "bg-green-100 text-green-700 dark:bg-green-900/20 dark:text-green-300"
          : "bg-red-100 text-red-700 dark:bg-red-900/20 dark:text-red-300",
      ].join(" ")}
    >
      <span className={["h-2 w-2 rounded-full", active ? "bg-green-500" : "bg-red-500"].join(" ")} />
      {active ? "Ativa" : "Bloqueada"}
    </span>
  );
}

/* =========================================================
   Controle de sessão (apenas Deslogar)
========================================================= */
function SessionControl({
  logged,
  onLogout,
}: {
  logged: boolean;
  onLogout: () => void;
}) {
  if (!logged) {
    return (
      <span className="inline-flex items-center rounded-lg px-3 py-1.5 text-xs font-medium
                       bg-gray-200 text-gray-800 dark:bg-white/10 dark:text-white">
        Deslogado
      </span>
    );
  }
  return (
    <button
      type="button"
      onClick={onLogout}
      className="rounded-lg bg-green-100 text-green-700 hover:bg-green-200
                 dark:bg-green-900/20 dark:text-green-300 dark:hover:bg-green-900/30
                 px-3 py-1.5 text-xs font-medium focus:outline-none focus:ring-2 focus:ring-green-400/40"
      title="Forçar logout deste usuário"
    >
      Deslogar
    </button>
  );
}

/* =========================================================
   Página
========================================================= */
export default function UsersPage() {
  const [rows, setRows] = useState<UserRow[]>([]);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  const [createOpen, setCreateOpen] = useState(false);

  // edição
  const [editOpen, setEditOpen] = useState(false);
  const [editing, setEditing] = useState<UserRow | null>(null);

  // filtros
  const [filterEmail, setFilterEmail] = useState("");
  const [filterCompany, setFilterCompany] = useState("");

  // cache de empresas por id (para evitar chamadas repetidas)
  const companyCacheRef = useRef<Map<number, string>>(new Map());

  async function enrichWithCompanyName(list: UserRow[]): Promise<UserRow[]> {
    // ids únicos válidos
    const ids = Array.from(
      new Set(
        list
          .map(u => u.company_id)
          .filter((v): v is number => typeof v === "number" && !Number.isNaN(v))
      )
    );

    // busca apenas os que não estão no cache
    const toFetch = ids.filter(id => !companyCacheRef.current.has(id));
    if (toFetch.length) {
      const results = await Promise.allSettled(toFetch.map(id => fetchCompanyById(id)));
      results.forEach((r, i) => {
        const id = toFetch[i];
        if (r.status === "fulfilled" && r.value) {
          companyCacheRef.current.set(id, r.value.company_name || "");
        } else {
          companyCacheRef.current.set(id, "");
        }
      });
    }

    // aplica company_name no array
    return list.map(u => ({
      ...u,
      company_name:
        typeof u.company_id === "number"
          ? (companyCacheRef.current.get(u.company_id) ?? null)
          : null,
    }));
  }

  async function load() {
    setLoading(true);
    setErr(null);
    try {
      const data = await fetchUsers();
      const enriched = await enrichWithCompanyName(data);

      // 👇 ORDENAR A-Z por email (case-insensitive, com fallback para string vazia)
      enriched.sort((a, b) =>
        (a.full_name || "").localeCompare(b.full_name || "", "pt-BR", { sensitivity: "base" })
      );

      setRows(enriched);
    } catch (e: any) {
      setErr(e?.message || "Falha ao carregar usuários.");
      setRows([]);
    } finally {
      setLoading(false);
    }
  }


  useEffect(() => {
    preserveScroll(load);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function handleCreate(data: CreateUserPayload) {
    await preserveScroll(async () => {
      await createUser(data);
      await load();
    });
  }

  async function handleToggleActive(u: UserRow) {
    await preserveScroll(async () => {
      await updateUserStatus(u.id, !u.is_active);
      await load();
    });
  }

  async function handleLogout(u: UserRow) {
    await preserveScroll(async () => {
      await updateAuthenticatedStatus(u.id, false);
      await load();
    });
  }

  async function openEdit(u: UserRow) {
    await preserveScroll(async () => {
      const full = await fetchUserById(u.id);
      // também preencher razão social (se ainda não tiver)
      const withCompany =
        typeof full.company_id === "number"
          ? { ...full, company_name: companyCacheRef.current.get(full.company_id!) ?? null }
          : full;
      setEditing(withCompany);
      setEditOpen(true);
    });
  }
  
  function formatCpfCnpj(value?: string | null): string {
    if (!value) return "—";
    const digits = value.replace(/\D/g, "");

    if (digits.length === 11) {
      // CPF
      return digits.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, "$1.$2.$3-$4");
    } else if (digits.length === 14) {
      // CNPJ
      return digits.replace(
        /(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})/,
        "$1.$2.$3/$4-$5"
      );
    }

    // já vem formatado ou tem tamanho inesperado
    return value;
  }

  async function handleEditSubmit(data: { id: number; email: string; full_name: string; cnpj_cpf: string; role: Role }) {
    await preserveScroll(async () => {
      await updateUser(data);
      setEditOpen(false);
      await load();
    });
  }

  const filteredRows = useMemo(() => {
    const emailQ = filterEmail.trim().toLowerCase();
    const compQ = filterCompany.trim().toLowerCase();

    return rows.filter(r => {
      const okEmail =
        !emailQ || (r.email || "").toLowerCase().includes(emailQ);
      const okCompany =
        !compQ || (r.company_name || "").toLowerCase().includes(compQ);
      return okEmail && okCompany;
    });
  }, [rows, filterEmail, filterCompany]);

  const total = filteredRows.length;
  const hasData = total > 0;

  return (
    <div className="p-4 md:p-6">
      <div className="mb-4 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <h2 className="text-2xl font-semibold text-primary dark:text-white">Usuários</h2>
        <button
          type="button"
          className="btn btn-primary rounded-xl px-4 py-2"
          onClick={() => setCreateOpen(true)}
        >
          + Novo usuário
        </button>
      </div>

      {/* Filtros */}
      <div className="mb-3 grid gap-3 sm:grid-cols-1 md:grid-cols-3">
        <div>
          <label className="mb-1 block text-xs font-medium text-gray-600 dark:text-gray-300">Filtrar por email</label>
          <input
            className="input"
            placeholder="ex: joao@empresa.com"
            value={filterEmail}
            onChange={(e) => setFilterEmail(e.target.value)}
          />
        </div>
        <div>
          <label className="mb-1 block text-xs font-medium text-gray-600 dark:text-gray-300">Filtrar por empresa</label>
          <input
            className="input"
            placeholder="ex: Aserco"
            value={filterCompany}
            onChange={(e) => setFilterCompany(e.target.value)}
          />
        </div>
      </div>

      {err && (
        <div className="mb-4 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700 dark:border-red-500/40 dark:bg-red-900/20 dark:text-red-200">
          {err}
        </div>
      )}

      {loading && (
        <div className="rounded-lg border border-gray-200 p-4 text-sm text-gray-600 dark:border-white/10 dark:text-gray-300">
          Carregando…
        </div>
      )}

      {!loading && !err && !hasData && (
        <div className="rounded-lg border border-gray-200 p-4 text-sm text-gray-600 dark:border-white/10 dark:text-gray-300">
          Nenhum usuário encontrado.
        </div>
      )}

      {!loading && !err && hasData && (
        <HorizontalScroller>
          <table className="min-w-full border-separate border-spacing-y-2">
            <thead>
              <tr className="text-left text-sm text-gray-600 dark:text-gray-300">
                <th className="px-3 py-2">Email</th>
                <th className="px-3 py-2 min-w-[160px]">Nome</th>
                <th className="px-3 py-2 min-w-[140px]">CPF</th>
                <th className="px-3 py-2">Razão social</th> {/* 👈 NOVA COLUNA */}
                <th className="px-3 py-2">Perfil</th>
                <th className="px-3 py-2">Status</th>
                <th className="px-3 py-2">Sessão</th>
                <th className="px-3 py-2">Alterado em</th>
                <th className="px-3 py-2 text-right">Ações</th>
              </tr>
            </thead>
            <tbody>
              {filteredRows.map((u) => (
                <tr key={u.id} className="card dark:bg-[#0f0e2f]">
                  <td className="px-3 py-2">{u.email}</td>
                  <td className="px-3 py-2">{u.full_name || "—"}</td>
                  <td className="px-3 py-2">{formatCpfCnpj(u.cnpj_cpf)}</td>
                  <td className="px-3 py-2">{u.company_name || "—"}</td> {/* 👈 mostra razão social */}
                  <td className="px-3 py-2 capitalize">{u.role}</td>
                  <td className="px-3 py-2">
                    <StatusBadge active={u.is_active} />
                  </td>
                  <td className="px-3 py-2">
                    <SessionControl
                      logged={Boolean(u.is_authenticated)}
                      onLogout={() => handleLogout(u)}
                    />
                  </td>
                  <td className="px-3 py-2">
                    {u.status_changed_at ? new Date(u.status_changed_at).toLocaleString() : "—"}
                  </td>
                  <td className="px-3 py-2 text-right">
                    <div className="inline-flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => handleToggleActive(u)}
                        className={[
                          "btn rounded-lg px-3 py-1.5 text-sm",
                          u.is_active
                            ? "bg-red-100 text-red-700 hover:bg-red-200 dark:bg-red-900/20 dark:text-red-300 dark:hover:bg-red-900/30"
                            : "bg-green-100 text-green-700 hover:bg-green-200 dark:bg-green-900/20 dark:text-green-300 dark:hover:bg-green-900/30",
                        ].join(" ")}
                        title={u.is_active ? "Bloquear conta" : "Ativar conta"}
                      >
                        {u.is_active ? "Bloquear" : "Ativar"}
                      </button>

                      <button
                        type="button"
                        onClick={() => openEdit(u)}
                        className="rounded-lg px-3 py-1.5 text-sm text-gray-700 hover:bg-gray-100
                                   dark:text-gray-200 dark:hover:bg-white/10"
                        title="Editar cadastro"
                      >
                        Editar
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          <div className="mt-2 text-sm text-gray-600 dark:text-gray-300">
            Total de usuários: <strong>{total}</strong>
          </div>
        </HorizontalScroller>
      )}

      {/* Modal criar */}
      <UserFormModal
        open={createOpen}
        onClose={() => setCreateOpen(false)}
        onSubmit={(payload) => preserveScroll(() => handleCreate(payload))}
      />

      {/* Modal editar */}
      <UserEditModal
        open={editOpen}
        onClose={() => setEditOpen(false)}
        initial={editing}
        onSubmit={(payload) => preserveScroll(() => handleEditSubmit(payload))}
      />
    </div>
  );
}

