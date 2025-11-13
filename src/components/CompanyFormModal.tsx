// src/components/CompanyFormModal.tsx
import { useEffect, useMemo, useState } from "react";
import { createCompany, type CompanyRow } from "../services/CompanyService";

/* =========================================================
   Loaders XLS (UF/Município + CNAE)
========================================================= */
const SHEET_URL = "/data/Municipio_Estado.xls";      // deve estar em public/data
const CNAE_URL  = "/data/Atividade_Federal.xls";     // deve estar em public/data

type UFMap = Record<string, string[]>;
type CNAEMap = Record<string, string>;

let __UF_CACHE__: { estados: string[]; map: UFMap } | null = null;
let __CNAE_CACHE__: CNAEMap | null = null;

// importa xlsx com fallback para o bundle full (necessário para .xls antigo)
async function getXLSX() {
  try {
    return await import("xlsx");
  } catch {
    const mod = await import("xlsx/dist/xlsx.full.min.js");
    return (mod as any).default ?? (mod as any);
  }
}

// normaliza cabeçalhos para tolerar variações
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

async function loadMunicipioEstado(): Promise<{ estados: string[]; map: UFMap }> {
  if (__UF_CACHE__) return __UF_CACHE__;
  const res = await fetch(`${SHEET_URL}?v=${Date.now()}`);
  if (!res.ok) throw new Error(`Falha ao carregar ${SHEET_URL} (${res.status})`);
  const buf = await res.arrayBuffer();
  const XLSX = await getXLSX();
  const wb = XLSX.read(buf, { type: "array" });
  const ws = wb.Sheets[wb.SheetNames[0]];
  if (!ws) throw new Error("Planilha de UF/Município vazia.");
  const rows = XLSX.utils.sheet_to_json<Record<string, any>>(ws, { defval: "" });

  const estadoCols = ["NOME_ESTADO", "NOME ESTADO", "ESTADO", "UF"];
  const municipioCols = ["NOME_MUNICIPIO", "NOME MUNICIPIO", "MUNICIPIO", "CIDADE"];

  const map: UFMap = {};
  for (const r of rows) {
    const estado = String(pickColumn(r, estadoCols) ?? "").trim();
    const municipio = String(pickColumn(r, municipioCols) ?? "").trim();
    if (!estado || !municipio) continue;
    (map[estado] ??= []).push(municipio);
  }

  for (const k of Object.keys(map)) {
    map[k] = Array.from(new Set(map[k])).sort((a, b) => a.localeCompare(b));
  }
  const estados = Object.keys(map).sort((a, b) => a.localeCompare(b));
  __UF_CACHE__ = { estados, map };
  return __UF_CACHE__;
}

async function loadCNAEMap(): Promise<CNAEMap> {
  if (__CNAE_CACHE__) return __CNAE_CACHE__;
  const res = await fetch(`${CNAE_URL}?v=${Date.now()}`);
  if (!res.ok) throw new Error(`Falha ao carregar ${CNAE_URL} (${res.status})`);
  const buf = await res.arrayBuffer();
  const XLSX = await getXLSX();
  const wb = XLSX.read(buf, { type: "array" });
  const ws = wb.Sheets[wb.SheetNames[0]];
  if (!ws) throw new Error("Planilha de CNAE vazia.");
  const rows = XLSX.utils.sheet_to_json<Record<string, any>>(ws, { defval: "" });

  const map: CNAEMap = {};
  for (const r of rows) {
    const codigo = String(pickColumn(r, ["CODIGOATIVFEDERAL", "CODIGO", "CNAE"]) ?? "").trim();
    const descricao = String(pickColumn(r, ["DESCRATIVFEDERAL", "DESCRICAO", "ATIVIDADE"]) ?? "").trim();
    if (!codigo) continue;
    map[codigo.replace(/\D/g, "")] = descricao; // chave sem máscara
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
    return d.replace(
      /^(\d{0,2})(\d{0,4})(\d{0,4}).*/,
      (_m, a, b, c) =>
        (a ? `(${a}` : "") + (a && a.length === 2 ? ") " : "") + (b || "") + (b && c ? "-" : "") + (c || "")
    );
  return d.replace(/^(\d{2})(\d{5})(\d{0,4}).*/, (_m, a, b, c) => `(${a}) ${b}${c ? "-" + c : ""}`);
};

const maskCNAE = (v: string) => {
  const d = v.replace(/\D/g, "").slice(0, 7);
  return d.replace(/^(\d{4})(\d)/, "$1-$2").replace(/^(\d{4}-\d)(\d{2})/, "$1/$2");
};

const maskCep = (v: string) => {
  const d = onlyDigits(v).slice(0, 8);
  return d.replace(/^(\d{5})(\d{0,3})$/, (_m, a, b) => (b ? `${a}-${b}` : a));
};

/* =========================================================
   Scrollbar
========================================================= */
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

export default function CompanyFormModal({ open, onClose, onSubmit }: Props) {
  // Novos campos
  const [email, setEmail] = useState("");
  const [cpf, setCpf] = useState("");

  // Campos básicos
  const [erpCode, setErpCode] = useState("");
  const [fantasia, setFantasia] = useState("");
  const [razao, setRazao] = useState("");
  const [cnpj, setCnpj] = useState("");
  const [phone, setPhone] = useState("");

  // UF/Município
  const [estados, setEstados] = useState<string[]>([]);
  const [munMap, setMunMap] = useState<UFMap>({});
  const [munFiltered, setMunFiltered] = useState<string[]>([]);
  const [estado, setEstado] = useState("");
  const [municipio, setMunicipio] = useState("");
  const [loadingUF, setLoadingUF] = useState(false);
  const [errUF, setErrUF] = useState<string | null>(null);

  // Endereço
  const [cep, setCep] = useState("");
  const [rua, setRua] = useState("");
  const [numero, setNumero] = useState("");
  const [bairro, setBairro] = useState("");

  // CNAE
  const [cnae, setCnae] = useState("");
  const [cnaeDesc, setCnaeDesc] = useState("");
  const [cnaeMap, setCnaeMap] = useState<CNAEMap>({});

  // Comerciais
  const [regime, setRegime] = useState<string>("");
  const [assinatura, setAssinatura] = useState<"basic" | "pro" | "special">("basic");
  const [valor, setValor] = useState<number>(100);

  // Datas
  const [contractStart, setContractStart] = useState<string>(toLocalInput(new Date().toISOString()));
  const [contractEnd, setContractEnd] = useState<string>(toLocalInput(new Date().toISOString()));

  // Carregar planilhas
  useEffect(() => {
    if (!open) return;
    (async () => {
      setLoadingUF(true);
      setErrUF(null);
      try {
        const { estados, map } = await loadMunicipioEstado();
        setEstados(estados);
        setMunMap(map);
      } catch (e: any) {
        console.error(e);
        setErrUF(e?.message || "Erro ao carregar UF/Município");
      } finally {
        setLoadingUF(false);
      }
      try {
        const mapCNAE = await loadCNAEMap();
        setCnaeMap(mapCNAE);
      } catch (e) {
        console.error(e);
      }
    })();
  }, [open]);

  // Filtra municípios ao alterar estado
  useEffect(() => {
    const list = munMap[estado] || [];
    setMunFiltered(list);
    if (municipio && !list.includes(municipio)) setMunicipio("");
  }, [estado, munMap]);

  // Define valor automático por plano
  useEffect(() => {
    if (assinatura === "basic") setValor(100);
    if (assinatura === "pro") setValor(150);
  }, [assinatura]);

  // Preenche descrição do CNAE automaticamente
  useEffect(() => {
    const code = onlyDigits(cnae);
    setCnaeDesc(cnaeMap[code] || "");
  }, [cnae, cnaeMap]);

  const address = useMemo(() => {
    const parts = [
      rua && `Rua: ${rua}`,
      numero && `Nº: ${numero}`,
      bairro && `Bairro: ${bairro}`,
      municipio && `Município: ${municipio}`,
      estado && `Estado: ${estado}`,
      cep && `CEP: ${onlyDigits(cep)}`,
    ].filter(Boolean);
    return parts.join(" | ");
  }, [rua, numero, bairro, municipio, estado, cep]);

  // Validação mínima
  const isValid =
    email.trim() &&
    cpf.trim() &&
    erpCode.trim() &&
    razao.trim() &&
    fantasia.trim() &&
    onlyDigits(cnpj).length === 14;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!isValid) return;

    const payload = {
      // novos campos conforme pedido
      email,
      cpf: onlyDigits(cpf),

      // existentes
      customer_name: fantasia,
      role: assinatura,
      company_name: razao,
      cnpj: onlyDigits(cnpj),
      phone_number: onlyDigits(phone),
      address, // inclui CEP por último

      // cnae + descrição
      cnae_company: onlyDigits(cnae),
      cnae_description: cnaeDesc, // auto a partir da planilha

      tax_regime: regime || "",
      erp_code: erpCode,
      monthly_value: Number(assinatura === "basic" ? 100 : assinatura === "pro" ? 150 : valor || 0),
      contract_start_date: toIso(contractStart),
      contract_end_date: toIso(contractEnd),
    };

    console.log("payload ->", payload);
    await createCompany(payload as any);
    await onSubmit({ id: 0, municipio, estado, ...payload } as any);
    onClose();
  }

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <ScrollStyles />
      <div className="fixed inset-0 bg-black/30" onClick={onClose} />
      <div className="relative flex min-h-full items-start md:items-center justify-center p-3">
        <div className="relative w-full max-w-3xl rounded-2xl border border-gray-200 bg-white shadow-xl dark:border-white/10 dark:bg-[#0f0e2f] max-h-[90vh] flex flex-col">
          <div className="sticky top-0 z-10 flex items-center justify-between px-4 py-3 md:px-6 md:py-4 bg-white/90 backdrop-blur dark:bg-[#0f0e2f]/90">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Nova empresa</h3>
            <button
              onClick={onClose}
              className="rounded-lg bg-gray-100 px-2 py-1 text-sm hover:bg-gray-200 dark:bg-white/10 dark:text-white dark:hover:bg:white/20"
            >
              Fechar
            </button>
          </div>

          <form onSubmit={handleSubmit} className="flex min-h-0 flex-1 flex-col px-4 md:px-6">
            <div
              className="nice-scroll grid grid-cols-1 gap-3 overflow-y-auto md:grid-cols-2 min-h-0 flex-1 py-3 overscroll-contain"
              style={{ WebkitOverflowScrolling: "touch" }}
            >
              {/* ====== Novos campos: Email / CPF ====== */}
              <div>
                <label className="mb-1 block text-xs font-medium text-gray-600 dark:text-gray-300">E-mail *</label>
                <input className="input" type="email" value={email} onChange={(e) => setEmail(e.target.value)} />
              </div>
              <div>
                <label className="mb-1 block text-xs font-medium text-gray-600 dark:text-gray-300">CPF *</label>
                <input className="input" value={cpf} onChange={(e) => setCpf(maskCpf(e.target.value))} placeholder="000.000.000-00" inputMode="numeric" />
              </div>

              {/* ERP */}
              <div className="md:col-span-2">
                <label className="mb-1 block text-xs font-medium text-gray-600 dark:text-gray-300">Código ERP *</label>
                <input className="input" type="number" value={erpCode} onChange={(e) => setErpCode(e.target.value)} />
              </div>

              {/* Fantasia / Razão */}
              <div>
                <label className="mb-1 block text-xs font-medium text-gray-600 dark:text-gray-300">Nome Fantasia *</label>
                <input className="input" value={fantasia} onChange={(e) => setFantasia(e.target.value)} />
              </div>
              <div>
                <label className="mb-1 block text-xs font-medium text-gray-600 dark:text-gray-300">Razão Social *</label>
                <input className="input" value={razao} onChange={(e) => setRazao(e.target.value)} />
              </div>

              {/* CNPJ / Telefone */}
              <div>
                <label className="mb-1 block text-xs font-medium text-gray-600 dark:text-gray-300">CNPJ *</label>
                <input className="input" value={cnpj} onChange={(e) => setCnpj(maskCnpj(e.target.value))} placeholder="00.000.000/0000-00" inputMode="numeric" />
              </div>
              <div>
                <label className="mb-1 block text-xs font-medium text-gray-600 dark:text-gray-300">Telefone</label>
                <input className="input" value={phone} onChange={(e) => setPhone(maskPhone(e.target.value))} placeholder="(00) 00000-0000" inputMode="numeric" />
              </div>

              {/* ======== CEP → Estado → Município ======== */}
              <div>
                <label className="mb-1 block text-xs font-medium text-gray-600 dark:text-gray-300">CEP</label>
                <input className="input" value={cep} onChange={(e) => setCep(maskCep(e.target.value))} placeholder="00000-000" inputMode="numeric" />
              </div>

              {/* Estado */}
              <div>
                <div className="flex items-center justify-between">
                  <label className="mb-1 block text-xs font-medium text-gray-600 dark:text-gray-300">Estado</label>
                  {loadingUF && <span className="text-[11px] text-gray-500">carregando…</span>}
                </div>
                <input
                  className="input"
                  list="lista-estados"
                  value={estado}
                  onChange={(e) => setEstado(e.target.value)}
                  placeholder={errUF ? "Erro ao carregar estados" : "Digite e selecione o Estado"}
                />
                <datalist id="lista-estados">
                  {estados.map((uf) => (
                    <option key={uf} value={uf} />
                  ))}
                </datalist>
                {errUF && <div className="mt-1 text-[11px] text-red-600">{errUF}</div>}
              </div>

              {/* Município */}
              <div className="md:col-span-2">
                <label className="mb-1 block text-xs font-medium text-gray-600 dark:text-gray-300">Município</label>
                <select className="input" value={municipio} onChange={(e) => setMunicipio(e.target.value)} disabled={!estado || !!errUF}>
                  <option value="">{estado ? "Selecione..." : "Selecione primeiro o Estado"}</option>
                  {munFiltered.map((m) => (
                    <option key={m} value={m}>
                      {m}
                    </option>
                  ))}
                </select>
              </div>

              {/* Endereço granular */}
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

              {/* CNAE + descrição (auto) */}
              <div>
                <label className="mb-1 block text-xs font-medium text-gray-600 dark:text-gray-300">CNAE</label>
                <input
                  className="input"
                  placeholder="0000-0/00"
                  value={cnae}
                  onChange={(e) => setCnae(maskCNAE(e.target.value))}
                  title="Digite o código do CNAE (a descrição será preenchida automaticamente)"
                />
              </div>
              <div>
                <label className="mb-1 block text-xs font-medium text-gray-600 dark:text-gray-300">Descrição CNAE</label>
                <input className="input bg-gray-50 dark:bg-white/5" value={cnaeDesc} readOnly />
              </div>

              {/* Regime tributário */}
              <div className="md:col-span-2">
                <label className="mb-1 block text-xs font-medium text-gray-600 dark:text-gray-300">Regime tributário</label>
                <select className="input" value={regime} onChange={(e) => setRegime(e.target.value)}>
                  <option value="">Selecione...</option>
                  {REGIMES.map((r) => (
                    <option key={r} value={r}>
                      {r}
                    </option>
                  ))}
                </select>
              </div>

              {/* Assinatura / Valor */}
              <div>
                <label className="mb-1 block text-xs font-medium text-gray-600 dark:text-gray-300">Assinatura *</label>
                <select className="input" value={assinatura} onChange={(e) => setAssinatura(e.target.value as any)}>
                  <option value="basic">Basic (R$ 100,00)</option>
                  <option value="pro">Pro (R$ 150,00)</option>
                  <option value="special">Special (valor manual)</option>
                </select>
              </div>
              <div>
                <label className="mb-1 block text-xs font-medium text-gray-600 dark:text-gray-300">
                  Valor mensal {assinatura !== "special" ? "(auto)" : ""}
                </label>
                <input
                  className="input"
                  type="number"
                  step="0.01"
                  value={valor}
                  onChange={(e) => setValor(Number(e.target.value))}
                  disabled={assinatura !== "special"}
                />
              </div>

              {/* Datas */}
              <div>
                <label className="mb-1 block text-xs font-medium text-gray-600 dark:text-gray-300">Início do contrato *</label>
                <input type="datetime-local" className="input" value={contractStart} onChange={(e) => setContractStart(e.target.value)} required />
              </div>
              <div>
                <label className="mb-1 block text-xs font-medium text-gray-600 dark:text-gray-300">Fim do contrato *</label>
                <input type="datetime-local" className="input" value={contractEnd} onChange={(e) => setContractEnd(e.target.value)} required />
              </div>
            </div>

            {/* Ações */}
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






