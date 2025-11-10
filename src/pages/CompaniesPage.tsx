// src/pages/CompaniesPage.tsx
import { useEffect, useMemo, useRef, useState } from "react";
import { fetchCompanies, updateCompany, type CompanyRow, linkUserToCompany } from "../services/CompanyService";
import { fetchAllUsers, type UserLite } from "../services/UsersCompanyService";
import CompanyFormModal from "../components/CompanyFormModal";
import CompanyEditModal from "../components/CompanyEditModal";
import { formatISODateOnly } from "../utils/date"

/* ===========================
   Helpers de formatação (listagem)
=========================== */
const onlyDigits = (v?: string | null) => (v || "").replace(/\D/g, "");
const formatCnpjView = (v?: string | null) => {
  const d = onlyDigits(v);
  if (d.length !== 14) return v || "—";
  return d.replace(/^(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})$/, "$1.$2.$3/$4-$5");
};
const formatPhoneView = (v?: string | null) => {
  const d = onlyDigits(v);
  if (d.length === 11) return d.replace(/^(\d{2})(\d{5})(\d{4})$/, "($1) $2-$3");
  if (d.length === 10) return d.replace(/^(\d{2})(\d{4})(\d{4})$/, "($1) $2-$3");
  if (d.length === 9)  return d.replace(/^(\d{5})(\d{4})$/, "$1-$2");
  if (d.length === 8)  return d.replace(/^(\d{4})(\d{4})$/, "$1-$2");
  return v || "—";
};

/* ===========================
   HorizontalScroller (mesmo comportamento)
=========================== */
function HorizontalScroller({ children, className = "", step = 280 }: { children: React.ReactNode; className?: string; step?: number; }) {
  const ref = useRef<HTMLDivElement>(null);
  const [canLeft, setCanLeft] = useState(false);
  const [canRight, setCanRight] = useState(false);
  const update = () => {
    const el = ref.current; if (!el) return;
    setCanLeft(el.scrollLeft > 0);
    setCanRight(el.scrollLeft + el.clientWidth < el.scrollWidth - 1);
  };
  useEffect(() => {
    const el = ref.current; if (!el) return;
    update();
    const onScroll = () => update();
    const onResize = () => update();
    el.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onResize, { passive: true });
    const ro = new ResizeObserver(update);
    ro.observe(el);
    const t = setTimeout(update, 60);
    return () => { el.removeEventListener("scroll", onScroll); window.removeEventListener("resize", onResize); ro.disconnect(); clearTimeout(t); };
  }, []);
  const scrollByDir = (dir: 1 | -1, amount = step) => ref.current?.scrollBy({ left: dir * amount, behavior: "smooth" });

  return (
    <div className={`relative isolate ${className}`}>
      <div ref={ref} className="overflow-x-auto [scrollbar-width:none] [-ms-overflow-style:none]" style={{ scrollbarWidth: "none" }}>
        <style>{`.no-scrollbar::-webkit-scrollbar{display:none;}`}</style>
        <div className="no-scrollbar min-w-full">{children}</div>
      </div>
      <div className="pointer-events-none">
        {canLeft && (
          <button type="button" onClick={() => scrollByDir(-1)}
            className="absolute left-2 top-1/2 -translate-y-1/2 z-30 rounded-full bg-white p-2 shadow-md ring-1 ring-black/5 hover:shadow-lg transition dark:bg-white/10 dark:text-white dark:ring-white/10 pointer-events-auto"
            aria-label="Rolagem à esquerda">
            <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2"><path d="M15 18l-6-6 6-6" strokeLinecap="round" strokeLinejoin="round"/></svg>
          </button>
        )}
        {canRight && (
          <button type="button" onClick={() => scrollByDir(1)}
            className="absolute right-2 top-1/2 -translate-y-1/2 z-30 rounded-full bg-white p-2 shadow-md ring-1 ring-black/5 hover:shadow-lg transition dark:bg-white/10 dark:text-white dark:ring-white/10 pointer-events-auto"
            aria-label="Rolagem à direita">
            <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2"><path d="M9 18l6-6-6-6" strokeLinecap="round" strokeLinejoin="round"/></svg>
          </button>
        )}
      </div>
    </div>
  );
}

/* ===========================
   Modal genérico (do seu snippet)
=========================== */
function Modal({ open, onClose, title, children }: { open: boolean; onClose: () => void; title: string; children: React.ReactNode; }) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4">
      <div className="fixed inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full max-w-2xl rounded-2xl border border-gray-200 bg-white shadow-xl dark:border-white/10 dark:bg-[#0f0e2f] flex flex-col max-h:[85vh] max-h-[85vh]">
        <div className="sticky top-0 z-10 flex items-center justify-between border-b border-gray-100 bg-white px-4 pt-4 pb-3 dark:border-white/10 dark:bg-[#0f0e2f]">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">{title}</h3>
          <button onClick={onClose} className="rounded-lg bg-gray-100 px-3 py-1.5 text-sm hover:bg-gray-200 dark:bg-white/10 dark:hover:bg-white/20" aria-label="Fechar">✕</button>
        </div>
        <div className="px-4 pb-4 overflow-y-auto flex-1 scrollbar-thin scrollbar-thumb-rounded-full scrollbar-track-rounded-full scrollbar-thumb-gray-400 scrollbar-track-gray-100 dark:scrollbar-thumb-gray-600 dark:scrollbar-track-[#1a1a1a]">
          {children}
        </div>
        <style>{`
          .scrollbar-thin::-webkit-scrollbar{ width:6px; }
          .scrollbar-thin::-webkit-scrollbar-thumb{ background-color:rgba(107,114,128,.6); border-radius:6px; }
          .dark .scrollbar-thin::-webkit-scrollbar-thumb{ background-color:rgba(156,163,175,.4); }
          .scrollbar-thin::-webkit-scrollbar-track{ background-color:transparent; }
        `}</style>
      </div>
    </div>
  );
}

/* ===========================
   LinkUserDialog com busca por e-mail
=========================== */
type LinkDialogProps = {
  open: boolean;
  onClose: () => void;
  company: CompanyRow | null;
  users: UserLite[];
  onLinked: (companyId: number, userId: number) => Promise<void>;
};

function LinkUserDialog({ open, onClose, company, users, onLinked }: LinkDialogProps) {
  const [query, setQuery] = useState("");
  const [selectedUserId, setSelectedUserId] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);
  const companyId = company?.id ?? null;

  useEffect(() => {
    if (open) {
      setQuery("");
      setSelectedUserId(null);
    }
  }, [open]);

  const filteredUsers = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return users;
    return users.filter((u) => (u.email || "").toLowerCase().includes(q));
  }, [users, query]);

  // se sobrar 1 resultado e nenhum selecionado, seleciona automaticamente
  useEffect(() => {
    if (filteredUsers.length === 1 && !selectedUserId) {
      setSelectedUserId(filteredUsers[0].id);
    }
  }, [filteredUsers, selectedUserId]);

  async function handleLink() {
    if (!companyId || !selectedUserId) return;
    setLoading(true);
    try {
      await linkUserToCompany(companyId, selectedUserId);
      await onLinked(companyId, selectedUserId);
      onClose();
    } catch {
      alert("Falha ao vincular usuário à empresa.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <Modal open={open} onClose={onClose} title={`Vincular usuário — ${company?.company_name ?? ""}`}>
      <div className="space-y-3">
        {/* Busca */}
        <div>
          <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-200">
            Buscar por e-mail
          </label>
          <input
            className="input"
            placeholder="Digite parte do e-mail…"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            autoFocus
          />
          <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
            {filteredUsers.length} resultado(s){query ? " filtrado(s)" : ""}.
          </p>
        </div>

        {/* Lista / select */}
        <div>
          <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-200">
            Selecione o usuário
          </label>
          <select
            value={selectedUserId ?? ""}
            onChange={(e) => setSelectedUserId(Number(e.target.value))}
            className="input"
          >
            <option value="" disabled>
              {filteredUsers.length ? "Selecione…" : "Nenhum usuário encontrado"}
            </option>
            {filteredUsers.map((u) => (
              <option value={u.id} key={u.id}>
                {u.email}
              </option>
            ))}
          </select>
        </div>

        {/* Ações */}
        <div className="flex justify-end gap-2 pt-2">
          <button
            className="rounded-lg px-3 py-2 text-sm text-gray-700 hover:bg-gray-100 dark:text-gray-200 dark:hover:bg-white/10"
            onClick={onClose}
          >
            Cancelar
          </button>

          <button
            className="rounded-lg bg-[#13123A] px-4 py-2 text-sm text-white hover:bg-[#1C1A50]
                       focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#13123A]
                       dark:bg-[#13123A] dark:hover:bg-[#1C1A50]"
            onClick={handleLink}
            disabled={!selectedUserId || loading}
          >
            {loading ? "Vinculando…" : "Vincular"}
          </button>
        </div>
      </div>
    </Modal>
  );
}


/* ===========================
   Página
=========================== */
export default function CompaniesPage() {
  const [rows, setRows] = useState<CompanyRow[]>([]);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  const [createOpen, setCreateOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [editing, setEditing] = useState<CompanyRow | null>(null);
  const [q, setQ] = useState("");

  // 🔁 Estados da lógica antiga dos botões
  const [users, setUsers] = useState<UserLite[]>([]);
  const [expandedCompanyId, setExpandedCompanyId] = useState<number | null>(null);
  const [linkOpen, setLinkOpen] = useState(false);
  const [linkCompany, setLinkCompany] = useState<CompanyRow | null>(null);

  async function load() {
    setLoading(true); setErr(null);
    try {
      const data = await fetchCompanies();
      setRows((data || []).sort((a, b) => (a.erp_code || "").localeCompare(b.erp_code || "", "pt-BR", { sensitivity: "base" })));
    } catch (e: any) {
      setErr(e?.message || "Falha ao carregar empresas."); setRows([]);
    } finally { setLoading(false); }
  }

  async function loadUsers() {
    try {
      const u = await fetchAllUsers();
      setUsers(u);
    } catch {
      // silencioso — mantém UX
    }
  }

  useEffect(() => { load(); loadUsers(); }, []);

  const filtered = useMemo(() => {
    const needle = q.trim().toLowerCase();
    if (!needle) return rows;
    return rows.filter((r) =>
      [r.erp_code, r.company_name, r.customer_name, r.cnpj, r.municipio, r.estado, r.cnae_company, r.tax_regime, r.role]
        .join(" ").toLowerCase().includes(needle)
    );
  }, [rows, q]);

  // 🔁 lógica de pós-vínculo (mantém seção expandida)
  async function handleLinked(companyId: number, userId: number) {
    // atualiza UI rapidamente
    setUsers((prev) => prev.map((u) => (u.id === userId ? ({ ...u, company_id: companyId } as any) : u)));
    await loadUsers();
    setExpandedCompanyId(companyId);
  }

  function usersForCompany(companyId: number): UserLite[] {
    // UsersCompanyService expõe company_id
    return users.filter((u: any) => u.company_id === companyId);
  }

  async function handleCreate(_: CompanyRow) { await load(); }
  async function handleEditSubmit(c: CompanyRow) { await updateCompany(c); await load(); }

  return (
    <div className="p-4 md:p-6">
      {/* Título + criar */}
      <div className="mb-2 flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
        <h2 className="text-2xl font-semibold text-primary dark:text-white">Empresas</h2>
        <button className="btn btn-primary rounded-xl px-4 py-2" onClick={() => setCreateOpen(true)}>+ Nova empresa</button>
      </div>

      {/* Filtro */}
      <div className="mb-4" style={{paddingTop: 20}}>
        <label className="mb-1 block text-xs font-medium text-gray-600 dark:text-gray-300">Filtrar:</label>
        <input className="input w-full md:max-w-md" placeholder="Filtrar por qualquer campo…" value={q} onChange={(e) => setQ(e.target.value)} />
      </div>

      {err && <div className="mb-4 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700 dark:border-red-500/40 dark:bg-red-900/20 dark:text-red-200">{err}</div>}
      {loading && <div className="rounded-lg border border-gray-200 p-4 text-sm text-gray-600 dark:border-white/10 dark:text-gray-300">Carregando…</div>}
      {!loading && !err && filtered.length === 0 && <div className="rounded-lg border border-gray-200 p-4 text-sm text-gray-600 dark:border-white/10 dark:text-gray-300">Nenhuma empresa encontrada.</div>}

      {!loading && !err && filtered.length > 0 && (
        <HorizontalScroller className="mt-1">
          <table className="min-w-full border-separate border-spacing-y-2">
            <thead>
              <tr className="text-left text-sm text-gray-600 dark:text-gray-300">
                {/* ORDEM SOLICITADA */}
                <th className="px-3 py-2">ERP Code</th>
                <th className="px-3 py-2">Razão Social</th>
                {/* <th className="px-3 py-2">Município</th> */}
                {/* <th className="px-3 py-2">Estado</th> */}
                <th className="px-3 py-2">CNAE Completo</th>
                <th className="px-3 py-2">Regime</th>
                <th className="px-3 py-2">Assinatura</th>
                <th className="px-3 py-2">Valor</th>
                {/* novas colunas solicitadas */}
                <th className="px-3 py-2">Início</th>
                <th className="px-3 py-2">Fim</th>
                {/* extras */}
                {/* demais em qualquer ordem */}
                <th className="px-3 py-2">Nome Fantasia</th>
                <th className="px-3 py-2">CNPJ</th>
                <th className="px-3 py-2">Telefone</th>
                <th className="px-3 py-2">Endereço</th>
                <th className="px-3 py-2 text-right">Ações</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((c) => {
                const expanded = expandedCompanyId === c.id;
                const linked = usersForCompany(c.id);
                return (
                  <tr key={c.id} className="card dark:bg-[#0f0e2f] align-top">
                    <td className="px-3 py-2">{c.erp_code || "—"}</td>
                    <td className="px-3 py-2">{c.company_name || "—"}</td>
                    {/* <td className="px-3 py-2">{c.municipio || "—"}</td> */}
                    {/* <td className="px-3 py-2">{c.estado || "—"}</td> */}
                    <td className="px-3 py-2">{c.cnae_company || "—"}</td>
                    <td className="px-3 py-2">{c.tax_regime || "—"}</td>
                    <td className="px-3 py-2 capitalize">{c.role || "—"}</td>
                    <td className="px-3 py-2 min-w-[110px]">{c.monthly_value != null ? `R$ ${Number(c.monthly_value).toFixed(2)}` : "—"}</td>
                    {/* início/fim formatados */}
                    <td className="px-3 py-2 text-sm">{c.contract_start_date ? formatISODateOnly(c.contract_start_date) : "—"}</td>
                    <td className="px-3 py-2 text-sm">{c.contract_end_date ? formatISODateOnly(c.contract_end_date) : "—"}</td>
                    {/* demais */}
                    <td className="px-3 py-2 min-w-[140px]">{c.customer_name || "—"}</td>
                    <td className="px-3 py-2">{formatCnpjView(c.cnpj)}</td>
                    <td className="px-3 py-2">{formatPhoneView(c.phone_number)}</td>
                    <td className="px-3 py-2 min-w-[240px]">{c.address || "—"}</td>

                    <td className="px-3 py-2 text-right">
                      <div className="inline-flex items-center gap-2">
                        {/* 🔙 LÓGICA ANTIGA RESTAURADA */}
                        <button
                          className="rounded-lg px-3 py-1.5 text-sm text-gray-700 hover:bg-gray-100 dark:text-gray-200 dark:hover:bg-white/10"
                          onClick={() => setExpandedCompanyId((prev) => (prev === c.id ? null : c.id))}
                        >
                          Usuários vinculados
                        </button>
                        <button
                          className="btn btn-primary rounded-lg px-3 py-1.5 text-sm"
                          title="Vincular usuário"
                          onClick={() => { setLinkCompany(c); setLinkOpen(true); }}
                        >
                          Vincular usuário
                        </button>
                        {/* Editar empresa (mantido) */}
                        <button
                          type="button"
                          onClick={() => { setEditing(c); setEditOpen(true); }}
                          className="rounded-lg px-3 py-1.5 text-sm text-gray-700 hover:bg-gray-100 dark:text-gray-200 dark:hover:bg-white/10"
                          title="Editar empresa"
                        >
                          Editar
                        </button>
                      </div>

                      {/* Área expandida com os usuários */}
                      {expanded && (
                        <div className="mt-3 rounded-xl border border-gray-200 bg-gray-50 p-3 text-sm dark:border-white/10 dark:bg-white/5 text-left">
                          <div className="mb-2 font-medium text-gray-800 dark:text-gray-100">Usuários vinculados:</div>
                          <ul className="space-y-1">
                            {linked.length > 0 ? (
                              linked.map((u) => (
                                <li key={u.id} className="rounded-lg bg-white px-2 py-2 dark:bg-white/10">
                                  {u.email}
                                </li>
                              ))
                            ) : (
                              <li className="text-gray-600 dark:text-gray-300">Nenhum usuário vinculado.</li>
                            )}
                          </ul>
                        </div>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
          <div className="mt-2 text-sm text-gray-600 dark:text-gray-300">Total de empresas: <strong>{filtered.length}</strong></div>
        </HorizontalScroller>
      )}

      {/* Modais existentes */}
      <CompanyFormModal open={createOpen} onClose={() => setCreateOpen(false)} onSubmit={async () => { await load(); }} />
      <CompanyEditModal open={editOpen} onClose={() => setEditOpen(false)} initial={editing} onSubmit={handleEditSubmit} />

      {/* 🔁 Modal de vínculo de usuário (lógica antiga) */}
      <LinkUserDialog
        open={linkOpen}
        onClose={() => setLinkOpen(false)}
        company={linkCompany}
        users={users}
        onLinked={handleLinked}
      />
    </div>
  );
}









