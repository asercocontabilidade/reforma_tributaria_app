// src/components/CompanyEditModal.tsx
import { useEffect, useMemo, useState } from "react";
import type { CompanyRow } from "../services/CompanyService";

/* máscaras */
const onlyDigits = (v: string) => (v || "").replace(/\D/g, "");
const maskCnpj = (v: string) => {
  const d = onlyDigits(v).slice(0, 14);
  return d
    .replace(/^(\d{2})(\d)/, "$1.$2")
    .replace(/^(\d{2})\.(\d{3})(\d)/, "$1.$2.$3")
    .replace(/^(\d{2})\.(\d{3})\.(\d{3})(\d)/, "$1.$2.$3/$4")
    .replace(/(\d{4})(\d{0,2})$/, "$1-$2");
};
const maskPhone = (v: string) => {
  const d = onlyDigits(v).slice(0, 11);
  if (d.length <= 10) {
    return d.replace(/^(\d{0,2})(\d{0,4})(\d{0,4}).*/, (_m, a, b, c) =>
      (a ? `(${a}` : "") + (a && a.length === 2 ? ") " : "") + (b || "") + (b && c ? "-" : "") + (c || "")
    );
  }
  return d.replace(/^(\d{2})(\d{5})(\d{0,4}).*/, (_m, a, b, c) => `(${a}) ${b}${c ? "-" + c : ""}`);
};

const ScrollStyles = () => (
  <style>{`
    .nice-scroll{ scrollbar-width: thin; scrollbar-color: rgba(100,116,139,.6) transparent; }
    .nice-scroll::-webkit-scrollbar{ height: 8px; width: 10px; }
    .nice-scroll::-webkit-scrollbar-track{ background: transparent; }
    .nice-scroll::-webkit-scrollbar-thumb{ background: rgba(100,116,139,.6); border-radius: 8px; }
    .nice-scroll::-webkit-scrollbar-thumb:hover{ background: rgba(100,116,139,.85); }
  `}</style>
);

type Props = {
  open: boolean;
  onClose: () => void;
  initial: CompanyRow | null;
  onSubmit: (data: CompanyRow) => Promise<void>;
};

const REGIMES = [
  "MEI – Microempreendedor Individual",
  "Simples Nacional",
  "Lucro Presumido",
  "Lucro Real",
  "Cooperativa",
  "Outras",
  "Não se Aplica",
] as const;

const toLocalInput = (iso: string) => (iso ? iso.slice(0, 16) : "");
const toIso = (local: string) => (local ? new Date(local).toISOString() : new Date().toISOString());

export default function CompanyEditModal({ open, onClose, initial, onSubmit }: Props) {
  const [form, setForm] = useState<CompanyRow | null>(null);

  // endereço granular
  const [rua, setRua] = useState("");
  const [numero, setNumero] = useState("");
  const [bairro, setBairro] = useState("");
  const [municipio, setMunicipio] = useState("");
  const [estado, setEstado] = useState("");

  const [regimes, setRegimes] = useState<string[]>([]);
  const [assinatura, setAssinatura] = useState<"basic" | "pro" | "special">("basic");
  const [valor, setValor] = useState<number>(100);

    const [contractStart, setContractStart] = useState<string>(toLocalInput(new Date().toISOString()));
  const [contractEnd, setContractEnd] = useState<string>(toLocalInput(new Date().toISOString()));

  useEffect(() => {
    if (open && initial) {
      const addr = initial.address || "";
      const get = (label: string) => {
        const m = addr.match(new RegExp(`${label}:\\s*([^|]+)`));
        return m ? m[1].trim() : "";
      };
      setForm({
        ...initial,
        cnpj: maskCnpj(initial.cnpj || ""),
        phone_number: maskPhone(initial.phone_number || ""),
      });
      setRua(get("Rua"));
      setNumero(get("Nº"));
      setBairro(get("Bairro"));
      setMunicipio(initial.municipio || get("Município"));
      setEstado(initial.estado || get("Estado"));
      const rg = (initial.tax_regime || "").split(";").map((s) => s.trim()).filter(Boolean);
      setRegimes(rg);
      const role = (initial.role as any) || "basic";
      setAssinatura(role);
      setValor(role === "basic" ? 100 : role === "pro" ? 150 : Number(initial.monthly_value || 0));
    }
  }, [open, initial]);

  useEffect(() => {
    if (assinatura === "basic") setValor(100);
    if (assinatura === "pro") setValor(150);
  }, [assinatura]);

  const address = useMemo(() => {
    const parts = [
      rua && `Rua: ${rua}`,
      numero && `Nº: ${numero}`,
      bairro && `Bairro: ${bairro}`,
      municipio && `Município: ${municipio}`,
      estado && `Estado: ${estado}`,
    ].filter(Boolean);
    return parts.join(" | ");
  }, [rua, numero, bairro, municipio, estado]);

  // >>> Validação relaxada: só exigências essenciais
  const isValid =
    !!form &&
    (form.erp_code || "").trim() &&
    (form.company_name || "").trim() &&
    (form.customer_name || "").trim() &&
    onlyDigits(form.cnpj || "").length === 14 &&
    // telefone, regimes, município/estado e cnae NÃO travam mais o botão
    true;

  if (!open || !form) return null;
  const on = <K extends keyof CompanyRow>(k: K, v: CompanyRow[K]) => setForm((f) => (f ? { ...f, [k]: v } : f));

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!isValid) return;

    const payload: CompanyRow = {
      ...form,
      cnpj: onlyDigits(form.cnpj || ""),
      phone_number: onlyDigits(form.phone_number || ""), // opcional (pode ficar vazio)
      address,
      tax_regime: regimes.join("; "),
      role: assinatura,
      monthly_value: Number(assinatura === "basic" ? 100 : assinatura === "pro" ? 150 : valor || 0),
      contract_start_date: form.contract_start_date || new Date().toISOString(),
      contract_end_date: form.contract_end_date || new Date().toISOString(),
      municipio,
      estado,
    } as any;

    // NÃO chama updateCompany aqui; quem salva é o pai (CompaniesPage)
    await onSubmit(payload);
    onClose();
  }

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <ScrollStyles />
      <div className="fixed inset-0 bg-black/30" onClick={onClose} />
      <div className="relative flex min-h-full items-start md:items-center justify-center p-3">
        <div
          className="relative w-full max-w-3xl rounded-2xl border border-gray-200 bg-white shadow-xl dark:border-white/10 dark:bg-[#0f0e2f]
                     max-h-[90vh] flex flex-col"
        >
          <div className="sticky top-0 z-10 flex items-center justify-between px-4 py-3 md:px-6 md:py-4 bg-white/90 backdrop-blur dark:bg-[#0f0e2f]/90">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Editar empresa</h3>
            <button onClick={onClose} className="rounded-lg bg-gray-100 px-2 py-1 text-sm hover:bg-gray-200 dark:bg-white/10 dark:text-white dark:hover:bg-white/20">
              Fechar
            </button>
          </div>

          <form onSubmit={handleSubmit} className="flex min-h-0 flex-1 flex-col px-4 md:px-6">
            <div
              className="nice-scroll grid grid-cols-1 gap-3 overflow-y-auto md:grid-cols-2
                         min-h-0 flex-1 py-3 overscroll-contain"
              style={{ WebkitOverflowScrolling: "touch" }}
            >
              <div className="md:col-span-2">
                <label className="mb-1 block text-xs font-medium text-gray-600 dark:text-gray-300">Código ERP *</label>
                <input className="input" value={form.erp_code || ""} onChange={(e) => on("erp_code", e.target.value)} />
              </div>

              <div>
                <label className="mb-1 block text-xs font-medium text-gray-600 dark:text-gray-300">Nome Fantasia *</label>
                <input className="input" value={form.customer_name || ""} onChange={(e) => on("customer_name", e.target.value)} />
              </div>
              <div>
                <label className="mb-1 block text-xs font-medium text-gray-600 dark:text-gray-300">Razão Social *</label>
                <input className="input" value={form.company_name || ""} onChange={(e) => on("company_name", e.target.value)} />
              </div>

              <div>
                <label className="mb-1 block text-xs font-medium text-gray-600 dark:text-gray-300">CNPJ *</label>
                <input className="input" value={form.cnpj || ""} onChange={(e) => on("cnpj", maskCnpj(e.target.value))} placeholder="00.000.000/0000-00" inputMode="numeric" />
              </div>
              <div>
                <label className="mb-1 block text-xs font-medium text-gray-600 dark:text-gray-300">Telefone</label>
                <input className="input" value={form.phone_number || ""} onChange={(e) => on("phone_number", maskPhone(e.target.value))} placeholder="(00) 00000-0000" inputMode="numeric" />
              </div>

              {/* Endereço */}
              <div>
                <label className="mb-1 block text-xs font-medium text-gray-600 dark:text-gray-300">Endereço (Rua)</label>
                <input className="input" value={rua} onChange={(e) => setRua(e.target.value)} />
              </div>
              <div>
                <label className="mb-1 block text-xs font-medium text-gray-600 dark:text-gray-300">Nº</label>
                <input className="input" value={numero} onChange={(e) => setNumero(e.target.value)} />
              </div>
              <div>
                <label className="mb-1 block text-xs font-medium text-gray-600 dark:text-gray-300">Bairro</label>
                <input className="input" value={bairro} onChange={(e) => setBairro(e.target.value)} />
              </div>
              <div>
                <label className="mb-1 block text-xs font-medium text-gray-600 dark:text-gray-300">Município</label>
                <input className="input" value={municipio} onChange={(e) => setMunicipio(e.target.value)} />
              </div>
              <div>
                <label className="mb-1 block text-xs font-medium text-gray-600 dark:text-gray-300">Estado</label>
                <input className="input" value={estado} onChange={(e) => setEstado(e.target.value)} />
              </div>

              <div>
                <label className="mb-1 block text-xs font-medium text-gray-600 dark:text-gray-300">CNAE</label>
                <input className="input" value={form.cnae_company || ""} onChange={(e) => on("cnae_company", e.target.value)} />
              </div>

              {/* Regimes (opcional) */}
              <div className="md:col-span-2">
                <label className="mb-1 block text-xs font-medium text-gray-600 dark:text-gray-300">Regime</label>
                <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 md:grid-cols-3">
                  {REGIMES.map((r) => {
                    const checked = regimes.includes(r);
                    return (
                      <label key={r} className="flex items-center gap-2 text-sm text-gray-700 dark:text-gray-200">
                        <input
                          type="checkbox"
                          checked={checked}
                          onChange={(e) => setRegimes((prev) => (e.target.checked ? [...prev, r] : prev.filter((x) => x !== r)))}
                        />
                        <span>{r}</span>
                      </label>
                    );
                  })}
                </div>
              <div>
                <label className="mb-1 block text-xs font-medium text-gray-600 dark:text-gray-300" style={{paddingTop: 15}}>Assinatura *</label>
                <select className="input" value={assinatura} onChange={(e) => setAssinatura(e.target.value as any)}>
                  <option value="basic">Basic (R$ 100,00)</option>
                  <option value="pro">Pro (R$ 150,00)</option>
                  <option value="special">Special (valor manual)</option>
                </select>
              </div>

              <div>
                <label className="mb-1 block text-xs font-medium text-gray-600 dark:text-gray-300">Valor mensal {assinatura !== "special" ? "(auto)" : ""}</label>
                <input
                  className="input"
                  type="number"
                  step="0.01"
                  value={valor}
                  onChange={(e) => setValor(Number(e.target.value))}
                  disabled={assinatura !== "special"}
                />
              </div>
            </div>

              {/* Datas (NOVO) */}
              <div>
                <label className="mb-1 block text-xs font-medium text-gray-600 dark:text-gray-300">Início do contrato *</label>
                <input type="datetime-local" className="input" value={contractStart} onChange={(e) => setContractStart(e.target.value)} required />
              </div>
              <div>
                <label className="mb-1 block text-xs font-medium text-gray-600 dark:text-gray-300">Fim do contrato *</label>
                <input type="datetime-local" className="input" value={contractEnd} onChange={(e) => setContractEnd(e.target.value)} required />
              </div>
            </div>

            <div className="sticky bottom-0 z-10 mt-3 flex items-center justify-between bg-white/90 backdrop-blur dark:bg-[#0f0e2f]/90 px-0 py-3 text-xs text-gray-500 dark:text-gray-400">
              {!isValid && <span>Preencha ERP, Razão Social, Nome Fantasia e CNPJ válido.</span>}
              <div className="ml-auto flex gap-2">
                <button type="button" onClick={onClose} className="rounded-lg px-3 py-2 text-sm text-gray-700 hover:bg-gray-100 dark:text-gray-200 dark:hover:bg-white/10">
                  Cancelar
                </button>
                <button type="submit" disabled={!isValid} className="btn btn-primary rounded-lg px-4 py-2 text-sm disabled:opacity-60">
                  Salvar
                </button>
              </div>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}


