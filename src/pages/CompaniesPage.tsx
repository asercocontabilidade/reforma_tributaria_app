// src/pages/CompaniesPage.tsx
import { useEffect, useRef, useState } from "react";
import {
  Company,
  fetchCompanies,
  createCompany,
  linkUserToCompany,
  CreateCompanyPayload,
} from "../services/CompanyService";
import { fetchAllUsers, UserLite } from "../services/UsersCompanyService";

/* ===========================
   HorizontalScroller
=========================== */
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
    const onResize = () => updateArrows();
    el.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onResize, { passive: true });
    const t = setTimeout(updateArrows, 50);
    return () => {
      el.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onResize);
      clearTimeout(t);
    };
  }, []);

  function scrollByDir(dir: 1 | -1) {
    const el = ref.current;
    if (!el) return;
    el.scrollBy({ left: dir * step, behavior: "smooth" });
  }

  return (
    <div className={`relative ${className}`}>
      <div
        ref={ref}
        className="overflow-x-auto [scrollbar-width:none] [-ms-overflow-style:none]"
        style={{ scrollbarWidth: "none" }}
      >
        <style>{`.no-scrollbar::-webkit-scrollbar{display:none;}`}</style>
        <div className="no-scrollbar min-w-full">{children}</div>
      </div>

      {canLeft && (
        <button
          onClick={() => scrollByDir(-1)}
          className="absolute left-2 top-1/2 -translate-y-1/2 rounded-full bg-white p-2 shadow-md ring-1 ring-black/5
                     hover:shadow-lg transition dark:bg-white/10 dark:text-white dark:ring-white/10"
        >
          <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M15 18l-6-6 6-6" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </button>
      )}

      {canRight && (
        <button
          onClick={() => scrollByDir(1)}
          className="absolute right-2 top-1/2 -translate-y-1/2 rounded-full bg-white p-2 shadow-md ring-1 ring-black/5
                     hover:shadow-lg transition dark:bg-white/10 dark:text-white dark:ring-white/10"
        >
          <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M9 18l6-6-6-6" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </button>
      )}
    </div>
  );
}

/* ===========================
   Modal (atualizado c/ scrollbar estilizada)
=========================== */
function Modal({
  open,
  onClose,
  title,
  children,
}: {
  open: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
}) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4">
      {/* Fundo */}
      <div
        className="fixed inset-0 bg-black/40 backdrop-blur-sm"
        onClick={onClose}
      />
      {/* Caixa do modal */}
      <div
        className="
          relative w-full max-w-2xl rounded-2xl border border-gray-200 bg-white shadow-xl
          dark:border-white/10 dark:bg-[#0f0e2f]
          flex flex-col
          max-h-[85vh]
        "
      >
        {/* Cabeçalho fixo */}
        <div className="sticky top-0 z-10 flex items-center justify-between border-b border-gray-100 bg-white px-4 pt-4 pb-3 dark:border-white/10 dark:bg-[#0f0e2f]">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">{title}</h3>
          <button
            onClick={onClose}
            className="rounded-lg bg-gray-100 px-3 py-1.5 text-sm hover:bg-gray-200 dark:bg-white/10 dark:hover:bg-white/20"
            aria-label="Fechar"
          >
            ✕
          </button>
        </div>

        {/* Conteúdo rolável */}
        <div
          className="
            px-4 pb-4 overflow-y-auto flex-1
            scrollbar-thin
            scrollbar-thumb-rounded-full
            scrollbar-track-rounded-full
            scrollbar-thumb-gray-400
            scrollbar-track-gray-100
            dark:scrollbar-thumb-gray-600
            dark:scrollbar-track-[#1a1a1a]
          "
        >
          {children}
        </div>

        {/* 🔹 estilo da scrollbar para navegadores WebKit (Chrome, Edge, Safari) */}
        <style>{`
          .scrollbar-thin::-webkit-scrollbar {
            width: 6px;
          }
          .scrollbar-thin::-webkit-scrollbar-thumb {
            background-color: rgba(107, 114, 128, 0.6);
            border-radius: 6px;
          }
          .dark .scrollbar-thin::-webkit-scrollbar-thumb {
            background-color: rgba(156, 163, 175, 0.4);
          }
          .scrollbar-thin::-webkit-scrollbar-track {
            background-color: transparent;
          }
        `}</style>
      </div>
    </div>
  );
}




/* ===========================
   LinkUserDialog
=========================== */
type LinkDialogProps = {
  open: boolean;
  onClose: () => void;
  company: Company | null;
  users: UserLite[];
  onLinked: (companyId: number, userId: number) => Promise<void>;
};

function LinkUserDialog({ open, onClose, company, users, onLinked }: LinkDialogProps) {
  const [selectedUserId, setSelectedUserId] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);
  const companyId = company?.id ?? null;

  useEffect(() => {
    setSelectedUserId(null);
  }, [open]);

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
        <label className="text-sm text-gray-700 dark:text-gray-200">Selecione o usuário</label>
        <select
          value={selectedUserId ?? ""}
          onChange={(e) => setSelectedUserId(Number(e.target.value))}
          className="input"
        >
          <option value="" disabled>
            Selecione…
          </option>
          {users.map((u) => (
            <option value={u.id} key={u.id}>
              {u.email}
            </option>
          ))}
        </select>

        <div className="flex justify-end gap-2 pt-2">
          <button
            className="rounded-lg px-3 py-2 text-sm text-gray-700 hover:bg-gray-100 dark:text-gray-200 dark:hover:bg-white/10"
            onClick={onClose}
          >
            Cancelar
          </button>

          {/* 🔵 Azul escuro solicitado (#13123A) */}
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
   CreateCompanyDialog
=========================== */
type CreateDialogProps = {
  open: boolean;
  onClose: () => void;
  onCreated: () => void;
};

function CreateCompanyDialog({ open, onClose, onCreated }: CreateDialogProps) {
  const [form, setForm] = useState<CreateCompanyPayload>({
    customer_name: "",
    role: "basic", // assinatura padrão
    company_name: "",
    phone_number: "",
    address: "",
    contract_start_date: new Date().toISOString(),
    contract_end_date: new Date().toISOString(),
    cnae_company: "",
    tax_regime: "",
    erp_code: "",
    monthly_value: 0,
  });
  const [loading, setLoading] = useState(false);

  function onChange<K extends keyof CreateCompanyPayload>(k: K, v: CreateCompanyPayload[K]) {
    setForm((f) => ({ ...f, [k]: v }));
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    try {
      await createCompany(form);
      onCreated();
      onClose();
    } catch {
      alert("Falha ao cadastrar empresa.");
    } finally {
      setLoading(false);
    }
  }

  const dateValue = (iso: string) => iso.slice(0, 16);

  return (
    <Modal open={open} onClose={onClose} title="Cadastrar nova empresa">
      <form onSubmit={onSubmit} className="grid grid-cols-1 gap-3 md:grid-cols-2">
        {/* Cliente */}
        <div>
          <label className="mb-1 block text-xs font-medium text-gray-600 dark:text-gray-300">
            Cliente
          </label>
          <input
            className="input"
            value={form.customer_name}
            onChange={(e) => onChange("customer_name", e.target.value)}
          />
        </div>

        {/* Empresa */}
        <div>
          <label className="mb-1 block text-xs font-medium text-gray-600 dark:text-gray-300">
            Empresa
          </label>
          <input
            className="input"
            value={form.company_name}
            onChange={(e) => onChange("company_name", e.target.value)}
          />
        </div>

        {/* Telefone */}
        <div>
          <label className="mb-1 block text-xs font-medium text-gray-600 dark:text-gray-300">
            Telefone
          </label>
          <input
            className="input"
            value={form.phone_number}
            onChange={(e) => onChange("phone_number", e.target.value)}
          />
        </div>

        {/* Endereço */}
        <div>
          <label className="mb-1 block text-xs font-medium text-gray-600 dark:text-gray-300">
            Endereço
          </label>
          <input
            className="input"
            value={form.address}
            onChange={(e) => onChange("address", e.target.value)}
          />
        </div>

        {/* Início do contrato */}
        <div>
          <label className="mb-1 block text-xs font-medium text-gray-600 dark:text-gray-300">
            Início do contrato
          </label>
          <input
            type="datetime-local"
            className="input"
            value={dateValue(form.contract_start_date)}
            onChange={(e) => onChange("contract_start_date", new Date(e.target.value).toISOString())}
          />
        </div>

        {/* Fim do contrato */}
        <div>
          <label className="mb-1 block text-xs font-medium text-gray-600 dark:text-gray-300">
            Fim do contrato
          </label>
          <input
            type="datetime-local"
            className="input"
            value={dateValue(form.contract_end_date)}
            onChange={(e) => onChange("contract_end_date", new Date(e.target.value).toISOString())}
          />
        </div>

        {/* CNAE */}
        <div>
          <label className="mb-1 block text-xs font-medium text-gray-600 dark:text-gray-300">
            CNAE
          </label>
          <input
            className="input"
            value={form.cnae_company}
            onChange={(e) => onChange("cnae_company", e.target.value)}
          />
        </div>

        {/* Regime Tributário */}
        <div>
          <label className="mb-1 block text-xs font-medium text-gray-600 dark:text-gray-300">
            Regime tributário
          </label>
          <input
            className="input"
            value={form.tax_regime}
            onChange={(e) => onChange("tax_regime", e.target.value)}
          />
        </div>

        {/* ERP Code */}
        <div>
          <label className="mb-1 block text-xs font-medium text-gray-600 dark:text-gray-300">
            ERP Code
          </label>
          <input
            className="input"
            value={form.erp_code}
            onChange={(e) => onChange("erp_code", e.target.value)}
          />
        </div>

        {/* Valor mensal */}
        <div>
          <label className="mb-1 block text-xs font-medium text-gray-600 dark:text-gray-300">
            Valor mensal
          </label>
          <input
            type="number"
            step="0.01"
            className="input"
            value={form.monthly_value}
            onChange={(e) => onChange("monthly_value", Number(e.target.value))}
          />
        </div>

        {/* Assinatura (basic | pro) */}
        <div>
          <label className="mb-1 block text-xs font-medium text-gray-600 dark:text-gray-300">
            Assinatura
          </label>
          <select
            className="input"
            value={form.role}
            onChange={(e) => onChange("role", e.target.value as CreateCompanyPayload["role"])}
          >
            <option value="basic">Basic</option>
            <option value="pro">Pro</option>
          </select>
        </div>

        {/* Botões */}
        <div className="col-span-full mt-2 flex justify-end gap-2">
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg px-3 py-2 text-sm text-gray-700 hover:bg-gray-100 dark:text-gray-200 dark:hover:bg-white/10"
          >
            Cancelar
          </button>
          <button
            type="submit"
            className="btn btn-primary rounded-lg px-4 py-2 text-sm"
            disabled={loading}
          >
            {loading ? "Salvando…" : "Salvar"}
          </button>
        </div>
      </form>
    </Modal>
  );
}

/* ===========================
   Helpers UI
=========================== */
function PlanBadge({ role }: { role: Company["role"] }) {
  const isPro = String(role).toLowerCase() === "pro";
  return (
    <span
      className={[
        "inline-flex items-center rounded-full px-2.5 py-1 text-xs font-medium",
        isPro
          ? "bg-[#13123A] text-white"
          : "bg-gray-100 text-gray-800 dark:bg-white/10 dark:text-gray-100",
      ].join(" ")}
      title={isPro ? "Plano Pro" : "Plano Basic"}
    >
      {isPro ? "Pro" : "Basic"}
    </span>
  );
}

/* ===========================
   Page
=========================== */
export default function CompaniesPage() {
  const [companies, setCompanies] = useState<Company[]>([]);
  const [users, setUsers] = useState<UserLite[]>([]);
  const [expandedCompanyId, setExpandedCompanyId] = useState<number | null>(null);
  const [openCreate, setOpenCreate] = useState(false);
  const [linkOpen, setLinkOpen] = useState(false);
  const [linkCompany, setLinkCompany] = useState<Company | null>(null);
  const [err, setErr] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [rows, setRows] = useState<UserLite[]>([]);

  async function loadCompanies() {
    setLoading(true);
    setErr(null);
    try {
      const data = await fetchCompanies();
      setCompanies(data);
      setRows(data);
    } catch (e: any) {
      console.error("Erro ao buscar empresas:", e);
      setErr(e?.message || "Erro ao buscar empresas.");
      setRows([]);
    } finally {
      setLoading(false);
    }
  }

  async function loadUsers() {
    const u = await fetchAllUsers();
    setUsers(u);
  }

  useEffect(() => {
    loadCompanies();
    loadUsers();
  }, []);

  async function handleLinked(companyId: number, userId: number) {
    setUsers((prev) => prev.map((u) => (u.id === userId ? { ...u, company_id: companyId } : u)));
    await loadUsers();
    setExpandedCompanyId(companyId);
  }

  function usersForCompany(companyId: number): UserLite[] {
    return users.filter((u) => (u as any).company_id === companyId);
  }

  const total = rows.length;
  const hasData = total > 0;

  return (
    <div className="p-4 md:p-6">
      <div className="mb-4 flex items-start justify-between">
        <h2 className="text-2xl font-semibold text-primary dark:text-white">Empresas</h2>
        <button className="btn btn-primary rounded-lg px-4 py-2 text-sm" onClick={() => setOpenCreate(true)}>
          + Nova empresa
        </button>
      </div>

      {err && (
        <div
          className="mb-4 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700
                     dark:border-red-500/40 dark:bg-red-900/20 dark:text-red-200"
        >
          {err}
        </div>
      )}

      {loading && (
        <div className="text-sm text-gray-600 dark:text-gray-300">
          Carregando empresas…
        </div>
      )}

      {!loading && !err && (
        <HorizontalScroller>
          <table className="min-w-full border-separate border-spacing-y-2">
            <thead>
              <tr className="text-left text-sm text-gray-600 dark:text-gray-300">
                <th className="px-3 py-2">Cliente</th>
                <th className="px-3 py-2 min-w-[220px]">Empresa</th>
                <th className="px-3 py-2">Assinatura</th>{/* NOVA COLUNA */}
                <th className="px-3 py-2">Telefone</th>
                <th className="px-3 py-2 min-w-[280px]">Endereço</th>
                <th className="px-3 py-2">Início</th>
                <th className="px-3 py-2">Fim</th>
                <th className="px-3 py-2">CNAE</th>
                <th className="px-3 py-2">Regime</th>
                <th className="px-3 py-2">ERP</th>
                <th className="px-3 py-2 min-w-[160px]">Valor mensal</th>
                <th className="px-3 py-2 text-right">Ações</th>
              </tr>
            </thead>
            <tbody>
              {companies.map((c) => {
                const expanded = expandedCompanyId === c.id;
                const linked = usersForCompany(c.id);
                return (
                  <tr key={c.id} className="card dark:bg-[#0f0e2f] align-top">
                    <td className="px-3 py-2">{c.customer_name}</td>
                    <td className="px-3 py-2">{c.company_name}</td>
                    <td className="px-3 py-2">
                      <PlanBadge role={c.role as any} />
                    </td>
                    <td className="px-3 py-2">{c.phone_number}</td>
                    <td className="px-3 py-2">{c.address}</td>
                    <td className="px-3 py-2 text-sm">
                      {new Date(c.contract_start_date).toLocaleDateString()}
                    </td>
                    <td className="px-3 py-2 text-sm">
                      {new Date(c.contract_end_date).toLocaleDateString()}
                    </td>
                    <td className="px-3 py-2">{c.cnae_company}</td>
                    <td className="px-3 py-2">{c.tax_regime}</td>
                    <td className="px-3 py-2">{c.erp_code}</td>
                    <td className="px-3 py-2">R$ {Number(c.monthly_value).toFixed(2)}</td>
                    <td className="px-3 py-2">
                      <div className="flex justify-end gap-2">
                        <button
                          className="rounded-lg px-3 py-2 text-sm text-gray-700 hover:bg-gray-100 dark:text-gray-200 dark:hover:bg-white/10"
                          onClick={() =>
                            setExpandedCompanyId((prev) => (prev === c.id ? null : c.id))
                          }
                        >
                          Usuários vinculados
                        </button>

                        <button
                          className="rounded-lg bg-[#13123A] px-3 py-2 text-sm text-white hover:bg-[#1C1A50]
                                     focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#13123A]
                                     dark:bg-[#13123A] dark:hover:bg-[#1C1A50]"
                          onClick={() => {
                            setLinkCompany(c);
                            setLinkOpen(true);
                          }}
                        >
                          Vincular usuário
                        </button>
                      </div>

                      {expanded && (
                        <div className="mt-3 rounded-xl border border-gray-200 bg-gray-50 p-3 text-sm dark:border-white/10 dark:bg-white/5">
                          <div className="mb-2 font-medium text-gray-800 dark:text-gray-100">
                            Usuários vinculados:
                          </div>
                          <ul className="space-y-1">
                            {linked.length > 0 ? (
                              linked.map((u) => (
                                <li key={u.id} className="rounded-lg bg-white px-2 py-2 dark:bg-white/10">
                                  {u.email}
                                </li>
                              ))
                            ) : (
                              <li className="text-gray-600 dark:text-gray-300">
                                Nenhum usuário vinculado.
                              </li>
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
          <div className="mt-2 text-sm text-gray-600 dark:text-gray-300">
            Total de empresas: <strong>{total}</strong>
          </div>
        </HorizontalScroller>
      )}

      <CreateCompanyDialog
        open={openCreate}
        onClose={() => setOpenCreate(false)}
        onCreated={loadCompanies}
      />

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




