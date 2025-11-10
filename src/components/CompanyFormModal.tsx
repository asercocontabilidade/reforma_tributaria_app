// src/components/CompanyFormModal.tsx
import { useEffect, useMemo, useState } from "react";
import { createCompany, type CompanyRow } from "../services/CompanyService";

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
  if (d.length <= 10) return d.replace(/^(\d{0,2})(\d{0,4})(\d{0,4}).*/, (_m, a, b, c) =>
    (a ? `(${a}` : "") + (a && a.length === 2 ? ") " : "") + (b || "") + (b && c ? "-" : "") + (c || "")
  );
  return d.replace(/^(\d{2})(\d{5})(\d{0,4}).*/, (_m, a, b, c) => `(${a}) ${b}${c ? "-" + c : ""}`);
};

/* scrollbar moderna */
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
  const [erpCode, setErpCode] = useState("");
  const [fantasia, setFantasia] = useState("");
  const [razao, setRazao] = useState("");
  const [cnpj, setCnpj] = useState("");
  const [phone, setPhone] = useState("");
  const [rua, setRua] = useState("");
  const [numero, setNumero] = useState("");
  const [bairro, setBairro] = useState("");
  const [municipio, setMunicipio] = useState("");
  const [estado, setEstado] = useState("");
  const [cnae, setCnae] = useState("");
  const [regimes, setRegimes] = useState<string[]>([]);
  const [assinatura, setAssinatura] = useState<"basic" | "pro" | "special">("basic");
  const [valor, setValor] = useState<number>(100);

    // datas (novas)
  const [contractStart, setContractStart] = useState<string>(toLocalInput(new Date().toISOString()));
  const [contractEnd, setContractEnd] = useState<string>(toLocalInput(new Date().toISOString()));

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

  // >>> Validação relaxada (evita botão travado)
  const isValid =
    erpCode.trim() &&
    razao.trim() &&
    fantasia.trim() &&
    onlyDigits(cnpj).length === 14;

  if (!open) return null;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!isValid) return;

    const payload = {
      customer_name: fantasia,
      role: assinatura,
      company_name: razao,
      cnpj: onlyDigits(cnpj),
      phone_number: onlyDigits(phone), // pode ficar vazio
      address,
      cnae_company: cnae,
      tax_regime: regimes.join("; "),
      erp_code: erpCode,
      monthly_value: Number(assinatura === "basic" ? 100 : assinatura === "pro" ? 150 : valor || 0),
      contract_start_date: new Date().toISOString(),
      contract_end_date: new Date().toISOString(),
    };

    await createCompany(payload as any);
    await onSubmit({ id: 0, municipio, estado, ...payload } as any);
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
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Nova empresa</h3>
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
              {/* Código ERP */}
              <div className="md:col-span-2">
                <label className="mb-1 block text-xs font-medium text-gray-600 dark:text-gray-300">Código ERP *</label>
                <input className="input" value={erpCode} onChange={(e) => setErpCode(e.target.value)} />
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

              {/* CNAE */}
              <div>
                <label className="mb-1 block text-xs font-medium text-gray-600 dark:text-gray-300">CNAE</label>
                <input className="input" value={cnae} onChange={(e) => setCnae(e.target.value)} />
              </div>

              {/* Regimes (opcional) */}
              <div className="md:col-span-2">
                <label className="mb-1 block text-xs font-medium text-gray-600 dark:text-gray-300">Regime</label>
                <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 md:grid-cols-3">
                  {REGIMES.map((r) => (
                    <label key={r} className="flex items-center gap-2 text-sm text-gray-700 dark:text-gray-200">
                      <input
                        type="checkbox"
                        checked={regimes.includes(r)}
                        onChange={(e) =>
                          setRegimes((prev) => (e.target.checked ? [...prev, r] : prev.filter((x) => x !== r)))
                        }
                      />
                      <span>{r}</span>
                    </label>
                  ))}
                </div>
              </div>

              {/* Assinatura */}
              <div>
                <label className="mb-1 block text-xs font-medium text-gray-600 dark:text-gray-300">Assinatura *</label>
                <select className="input" value={assinatura} onChange={(e) => setAssinatura(e.target.value as any)}>
                  <option value="basic">Basic (R$ 100,00)</option>
                  <option value="pro">Pro (R$ 150,00)</option>
                  <option value="special">Special (valor manual)</option>
                </select>
              </div>

              {/* Valor mensal */}
              <div>
                <label className="mb-1 block text-xs font-medium text-gray-600 dark:text-gray-300">Valor mensal {assinatura !== "special" ? "(auto)" : ""}</label>
                <input className="input" type="number" step="0.01" value={valor} onChange={(e) => setValor(Number(e.target.value))} disabled={assinatura !== "special"} />
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

            {/* ações */}
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




