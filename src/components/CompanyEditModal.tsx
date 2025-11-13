// src/components/CompanyEditModal.tsx
import { useEffect, useMemo, useState } from "react";
import type { CompanyRow } from "../services/CompanyService";

/* =========================================================
   Loader CNAE via XLS
========================================================= */
const CNAE_URL = "/data/Atividade_Federal.xls";
type CNAEMap = Record<string, string>;
let __CNAE_CACHE__: CNAEMap | null = null;

async function getXLSX() {
  try {
    return await import("xlsx");
  } catch {
    const mod = await import("xlsx/dist/xlsx.full.min.js");
    return (mod as any).default ?? (mod as any);
  }
}

const norm = (s: string) =>
  (s || "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[\s_]+/g, "")
    .toUpperCase();

function pickColumn(obj: Record<string, any>, candidates: string[]) {
  const mapKeys: Record<string, string> = {};
  for (const k of Object.keys(obj)) mapKeys[norm(k)] = k;
  for (const cand of candidates) {
    const found = mapKeys[norm(cand)];
    if (found) return obj[found];
  }
  return undefined;
}

async function loadCNAEMap(): Promise<CNAEMap> {
  if (__CNAE_CACHE__) return __CNAE_CACHE__;
  const res = await fetch(`${CNAE_URL}?v=${Date.now()}`);
  if (!res.ok) throw new Error(`Falha ao carregar ${CNAE_URL}`);
  const buf = await res.arrayBuffer();
  const XLSX = await getXLSX();
  const wb = XLSX.read(buf, { type: "array" });
  const ws = wb.Sheets[wb.SheetNames[0]];
  const rows = XLSX.utils.sheet_to_json<Record<string, any>>(ws, { defval: "" });

  const map: CNAEMap = {};
  for (const r of rows) {
    const codigo = String(pickColumn(r, ["CODIGOATIVFEDERAL", "CNAE", "CODIGO"]) ?? "").trim();
    const descricao = String(pickColumn(r, ["DESCRATIVFEDERAL", "DESCRICAO", "ATIVIDADE"]) ?? "").trim();
    if (codigo) map[codigo.replace(/\D/g, "")] = descricao;
  }

  __CNAE_CACHE__ = map;
  return map;
}

/* =========================================================
   Máscaras
========================================================= */
const onlyDigits = (v: string) => (v || "").replace(/\D/g, "");
const maskCnpj = (v: string) => {
  const d = onlyDigits(v).slice(0, 14);
  return d
    .replace(/^(\d{2})(\d)/, "$1.$2")
    .replace(/^(\d{2})\.(\d{3})(\d)/, "$1.$2.$3")
    .replace(/^(\d{2})\.(\d{3})\.(\d{3})(\d)/, "$1.$2.$3/$4")
    .replace(/(\d{4})(\d{0,2})$/, "$1-$2");
};
const maskCpf = (v: string) =>
  onlyDigits(v)
    .slice(0, 11)
    .replace(/^(\d{3})(\d)/, "$1.$2")
    .replace(/^(\d{3})\.(\d{3})(\d)/, "$1.$2.$3")
    .replace(/(\d{3})\.(\d{3})\.(\d{3})(\d{0,2})$/, "$1.$2.$3-$4");
const maskPhone = (v: string) => {
  const d = onlyDigits(v).slice(0, 11);
  if (d.length <= 10)
    return d.replace(/^(\d{0,2})(\d{0,4})(\d{0,4}).*/, (_m, a, b, c) =>
      (a ? `(${a}` : "") + (a && a.length === 2 ? ") " : "") + (b || "") + (b && c ? "-" : "") + (c || "")
    );
  return d.replace(/^(\d{2})(\d{5})(\d{0,4}).*/, (_m, a, b, c) => `(${a}) ${b}${c ? "-" + c : ""}`);
};
const maskCNAE = (v: string) => {
  const d = v.replace(/\D/g, "").slice(0, 7);
  return d.replace(/^(\d{4})(\d)/, "$1-$2").replace(/^(\d{4}-\d)(\d{2})/, "$1/$2");
};

/* =========================================================
   Scrollbar
========================================================= */
const ScrollStyles = () => (
  <style>{`
    .nice-scroll{ scrollbar-width: thin; scrollbar-color: rgba(100,116,139,.6) transparent; }
    .nice-scroll::-webkit-scrollbar{ height: 8px; width: 10px; }
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

export default function CompanyEditModal({ open, onClose, initial, onSubmit }: Props) {
  const [form, setForm] = useState<CompanyRow | null>(null);
  const [email, setEmail] = useState("");
  const [cpf, setCpf] = useState("");

  const [rua, setRua] = useState("");
  const [numero, setNumero] = useState("");
  const [bairro, setBairro] = useState("");
  const [municipio, setMunicipio] = useState("");
  const [estado, setEstado] = useState("");

  const [regime, setRegime] = useState<string>("");
  const [assinatura, setAssinatura] = useState<"basic" | "pro" | "special">("basic");
  const [valor, setValor] = useState<number>(100);
  const [contractStart, setContractStart] = useState<string>(toLocalInput(new Date().toISOString()));
  const [contractEnd, setContractEnd] = useState<string>(toLocalInput(new Date().toISOString()));

  const [cnaeMap, setCnaeMap] = useState<CNAEMap>({});
  const [cnaeDesc, setCnaeDesc] = useState("");

  // carregar CNAE
  useEffect(() => {
    if (open)
      loadCNAEMap().then(setCnaeMap).catch(console.error);
  }, [open]);

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
        cnae_company: maskCNAE(initial.cnae_company || ""),
      });
      setRua(get("Rua"));
      setNumero(get("Nº"));
      setBairro(get("Bairro"));
      setMunicipio(initial.municipio || get("Município"));
      setEstado(initial.estado || get("Estado"));
      setEmail((initial as any).email || "");
      setCpf((initial as any).cpf || "");

      const first = (initial.tax_regime || "").split(";")[0]?.trim() || "";
      setRegime(REGIMES.includes(first as any) ? first : "");

      const role = (initial.role as any) || "basic";
      setAssinatura(role);
      setValor(role === "basic" ? 100 : role === "pro" ? 150 : Number(initial.monthly_value || 0));
      setCnaeDesc((initial as any).cnae_description || "");
    }
  }, [open, initial]);

  useEffect(() => {
    const code = onlyDigits(form?.cnae_company || "");
    setCnaeDesc(cnaeMap[code] || "");
  }, [form?.cnae_company, cnaeMap]);

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

  const isValid =
    !!form &&
    email.trim() &&
    cpf.trim() &&
    (form.erp_code || "").trim() &&
    (form.company_name || "").trim() &&
    (form.customer_name || "").trim() &&
    onlyDigits(form.cnpj || "").length === 14;

  if (!open || !form) return null;
  const on = <K extends keyof CompanyRow>(k: K, v: CompanyRow[K]) => setForm((f) => (f ? { ...f, [k]: v } : f));

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!isValid) return;

    const payload: CompanyRow = {
      ...form,
      email,
      cpf: onlyDigits(cpf),
      cnpj: onlyDigits(form.cnpj || ""),
      phone_number: onlyDigits(form.phone_number || ""),
      cnae_company: onlyDigits(form.cnae_company || ""),
      cnae_description: cnaeDesc,
      address,
      tax_regime: regime || "",
      role: assinatura,
      monthly_value: Number(assinatura === "basic" ? 100 : assinatura === "pro" ? 150 : valor || 0),
      municipio,
      estado,
    } as any;

    await onSubmit(payload);
    onClose();
  }

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <ScrollStyles />
      <div className="fixed inset-0 bg-black/30" onClick={onClose} />
      <div className="relative flex min-h-full items-start md:items-center justify-center p-3">
        <div className="relative w-full max-w-3xl rounded-2xl border border-gray-200 bg-white shadow-xl dark:border-white/10 dark:bg-[#0f0e2f] max-h-[90vh] flex flex-col">
          <div className="sticky top-0 z-10 flex items-center justify-between px-4 py-3 md:px-6 md:py-4 bg-white/90 backdrop-blur dark:bg-[#0f0e2f]/90">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Editar empresa</h3>
            <button onClick={onClose} className="rounded-lg bg-gray-100 px-2 py-1 text-sm hover:bg-gray-200 dark:bg-white/10 dark:text-white dark:hover:bg-white/20">
              Fechar
            </button>
          </div>

          <form onSubmit={handleSubmit} className="flex min-h-0 flex-1 flex-col px-4 md:px-6">
            <div className="nice-scroll grid grid-cols-1 gap-3 overflow-y-auto md:grid-cols-2 min-h-0 flex-1 py-3 overscroll-contain">
              
              {/* novos campos */}
              <div>
                <label className="text-xs font-medium mb-1 block">E-mail *</label>
                <input className="input" type="email" value={email} onChange={(e) => setEmail(e.target.value)} />
              </div>
              <div>
                <label className="text-xs font-medium mb-1 block">CPF *</label>
                <input className="input" value={cpf} onChange={(e) => setCpf(maskCpf(e.target.value))} placeholder="000.000.000-00" />
              </div>

              {/* ERP */}
              <div className="md:col-span-2">
                <label className="text-xs font-medium mb-1 block">Código ERP *</label>
                <input className="input" type="number" value={form.erp_code || ""} onChange={(e) => on("erp_code", e.target.value)} />
              </div>

              {/* Nome Fantasia / Razão */}
              <div>
                <label className="text-xs font-medium mb-1 block">Nome Fantasia *</label>
                <input className="input" value={form.customer_name || ""} onChange={(e) => on("customer_name", e.target.value)} />
              </div>
              <div>
                <label className="text-xs font-medium mb-1 block">Razão Social *</label>
                <input className="input" value={form.company_name || ""} onChange={(e) => on("company_name", e.target.value)} />
              </div>

              {/* CNPJ / Telefone */}
              <div>
                <label className="text-xs font-medium mb-1 block">CNPJ *</label>
                <input className="input" value={form.cnpj || ""} onChange={(e) => on("cnpj", maskCnpj(e.target.value))} placeholder="00.000.000/0000-00" />
              </div>
              <div>
                <label className="text-xs font-medium mb-1 block">Telefone</label>
                <input className="input" value={form.phone_number || ""} onChange={(e) => on("phone_number", maskPhone(e.target.value))} placeholder="(00) 00000-0000" />
              </div>

              {/* Endereço */}
              <div>
                <label className="text-xs font-medium mb-1 block">Rua</label>
                <input className="input" value={rua} onChange={(e) => setRua(e.target.value)} />
              </div>
              <div>
                <label className="text-xs font-medium mb-1 block">Nº</label>
                <input className="input" type="number" value={numero} onChange={(e) => setNumero(e.target.value)} />
              </div>
              <div>
                <label className="text-xs font-medium mb-1 block">Bairro</label>
                <input className="input" value={bairro} onChange={(e) => setBairro(e.target.value)} />
              </div>
              <div>
                <label className="text-xs font-medium mb-1 block">Município</label>
                <input className="input" value={municipio} onChange={(e) => setMunicipio(e.target.value)} />
              </div>
              <div>
                <label className="text-xs font-medium mb-1 block">Estado</label>
                <input className="input" value={estado} onChange={(e) => setEstado(e.target.value)} />
              </div>

              {/* CNAE + descrição */}
              <div>
                <label className="text-xs font-medium mb-1 block">CNAE</label>
                <input className="input" placeholder="0000-0/00" value={form.cnae_company || ""} onChange={(e) => on("cnae_company", maskCNAE(e.target.value))} />
              </div>
              <div>
                <label className="text-xs font-medium mb-1 block">Descrição CNAE</label>
                <input className="input bg-gray-50" value={cnaeDesc} readOnly />
              </div>

              {/* Regime */}
              <div className="md:col-span-2">
                <label className="text-xs font-medium mb-1 block">Regime tributário</label>
                <select className="input" value={regime} onChange={(e) => setRegime(e.target.value)}>
                  <option value="">Selecione...</option>
                  {REGIMES.map((r) => (
                    <option key={r} value={r}>{r}</option>
                  ))}
                </select>
              </div>

              {/* Assinatura / Valor */}
              <div>
                <label className="text-xs font-medium mb-1 block">Assinatura *</label>
                <select className="input" value={assinatura} onChange={(e) => setAssinatura(e.target.value as any)}>
                  <option value="basic">Basic (R$100)</option>
                  <option value="pro">Pro (R$150)</option>
                  <option value="special">Special (valor manual)</option>
                </select>
              </div>
              <div>
                <label className="text-xs font-medium mb-1 block">Valor mensal {assinatura !== "special" ? "(auto)" : ""}</label>
                <input className="input" type="number" step="0.01" value={valor} onChange={(e) => setValor(Number(e.target.value))} disabled={assinatura !== "special"} />
              </div>
            </div>

            <div className="sticky bottom-0 z-10 mt-3 flex items-center justify-between bg-white/90 backdrop-blur dark:bg-[#0f0e2f]/90 px-0 py-3 text-xs text-gray-500 dark:text-gray-400">
              {!isValid && <span>Preencha E-mail, CPF, ERP, Razão Social, Nome Fantasia e CNPJ válido.</span>}
              <div className="ml-auto flex gap-2">
                <button
                  type="button"
                  onClick={onClose}
                  className="rounded-lg px-3 py-2 text-sm text-gray-700 hover:bg-gray-100 dark:text-gray-200 dark:hover:bg-white/10"
                >
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



