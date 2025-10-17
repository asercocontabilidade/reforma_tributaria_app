import { useEffect, useRef, useState } from "react";
import { fetchItemDetails, ItemDetails } from "../services/CstService";

// Tipagem
type Props = {
  cst: string;           // continua exibindo o CST na UI (rótulo)
  ncm?: string;          // novo: identifica a linha a consultar no backend
  itemId?: string;       // opcional: alternativa se não houver NCM
  className?: string;
};

// Cache simples para não repetir chamadas
const memoryCache = new Map<string, ItemDetails | null>();

// helper no topo do componente
function fmtPercent(v: string | number | null | undefined) {
  if (v === null || v === undefined || v === "") return "—";
  const raw = String(v).trim().replace(",", ".");
  const num = Number(raw);
  if (!isNaN(num)) {
    const pct = num <= 1 && num >= 0 ? num * 100 : num; // 1 -> 100, 0.6 -> 60
    // arredonda de forma amigável (sem zeros desnecessários)
    const s = Number.isInteger(pct) ? String(pct) : pct.toFixed(2).replace(/\.00$/, "");
    return `${s}%`;
  }
  return raw; // se vier "200" já formatado
}


// Ícone de olho 👁️
function EyeIcon({ className = "w-4 h-4" }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      aria-hidden="true"
    >
      <path
        d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8S1 12 1 12z"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <circle cx="12" cy="12" r="3" strokeWidth="2" />
    </svg>
  );
}

export default function CstDetailsPopover({ cst, ncm, itemId, className = "" }: Props) {
  const [open, setOpen] = useState(false);
  const [details, setDetails] = useState<ItemDetails | null>(null);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const ref = useRef<HTMLDivElement>(null);

  // Fecha popover ao clicar fora
  useEffect(() => {
    function onDocClick(e: MouseEvent) {
      if (!ref.current) return;
      if (!ref.current.contains(e.target as Node)) setOpen(false);
    }
    if (open) document.addEventListener("mousedown", onDocClick);
    return () => document.removeEventListener("mousedown", onDocClick);
  }, [open]);

  function cacheKey() {
    return `k:${ncm ?? ""}|${itemId ?? ""}`;
  }

  async function toggle() {
    if (!open) {
      const key = cacheKey();

      if (memoryCache.has(key)) {
        setDetails(memoryCache.get(key)!);
        setErr(null);
        setOpen(true);
        return;
      }

      setLoading(true);
      setErr(null);
      try {
        const d = await fetchItemDetails({ ncm, item: itemId });
        memoryCache.set(key, d);
        setDetails(d);
        setOpen(true);
      } catch (e: any) {
        console.warn("Falha ao buscar detalhes — exibindo dados de teste.");
        setErr(e?.message || "Erro ao carregar detalhes");
        // dados de teste apenas se a API falhar
        const fallback: ItemDetails = {
          anexo: "",
          item: itemId ?? "",
          ncm: ncm ?? "",
          product_description: "",
          full_description:
            "Teste: DESCRIÇÃO COMPLETA (substitui Base Legal quando API falhar).",
          ibs: "Teste: 12%",
          cbs: "Teste: 8%",
        };
        memoryCache.set(key, fallback);
        setDetails(fallback);
        setOpen(true);
      } finally {
        setLoading(false);
      }
    } else {
      setOpen(false);
    }
  }

  // Render
  return (
    <div className={`relative ${className}`} ref={ref}>
      {/* Linha única: número do CST + botão olho */}
      <div className="flex items-center justify-center gap-2">
        <span className="text-sm font-medium text-gray-900 dark:text-gray-100">
          {cst}
        </span>
        <button
          type="button"
          onClick={toggle}
          title="Ver detalhes"
          className="rounded-md p-1 text-primary hover:bg-gray-100 dark:text-white dark:hover:bg-white/10 focus:outline-none focus:ring-2 focus:ring-primary/40"
          aria-expanded={open}
          aria-controls={`cst-pop-${cst}`}
        >
          <EyeIcon />
          <span className="sr-only">Ver detalhes do CST {cst}</span>
        </button>
      </div>

      {/* Popover */}
      {open && (
        <div
          id={`cst-pop-${cst}`}
          role="dialog"
          aria-label={`Detalhes do CST ${cst}`}
          className="absolute z-40 mt-2 w-[min(92vw,22rem)] right-0 rounded-xl border border-gray-200 bg-white p-3 shadow-xl dark:border-white/10 dark:bg-[#1e1e1e]"
        >
          {loading && (
            <div className="text-sm text-gray-600 dark:text-gray-300">
              Carregando…
            </div>
          )}

          {!loading && (
            <div className="space-y-2">
              <div className="text-xs uppercase tracking-wide text-gray-500 dark:text-gray-400">
                Informações do CST
              </div>

              {/* Percentuais IBS/CBS */}
              <div className="rounded-lg bg-gray-50 p-3 text-sm dark:bg-white/10">
                <div className="mb-1 text-xs text-gray-500 dark:text-gray-400">
                  Percentual de redução
                </div>
                <div className="font-medium text-gray-900 dark:text-gray-100">
                  {details?.ibs || details?.cbs ? (
                    <>
                      {details?.ibs != null && details?.ibs !== "" ? (
                        <span>IBS: {fmtPercent(details.ibs)}</span>
                      ) : null}
                      {details?.ibs && details?.cbs ? <span> • </span> : null}
                      {details?.cbs != null && details?.cbs !== "" ? (
                        <span>CBS: {fmtPercent(details.cbs)}</span>
                      ) : null}
                    </>
                  ) : (
                    "—"
                  )}
                </div>
                {err && (
                  <div className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                    (dados de teste exibidos por falha na requisição)
                  </div>
                )}
              </div>

              {/* Base legal -> agora mostra DESCRIÇÃO COMPLETA */}
              <div className="rounded-lg bg-gray-50 p-3 text-sm dark:bg-white/10">
                <div className="mb-1 text-xs text-gray-500 dark:text-gray-400">
                  Base legal
                </div>
                <div className="font-medium text-gray-900 dark:text-gray-100 whitespace-pre-wrap break-words">
                  {details?.full_description ?? "—"}
                </div>
                {err && (
                  <div className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                    (dados de teste exibidos por falha na requisição)
                  </div>
                )}
              </div>

              {/* Contexto opcional: NCM/ITEM */}
              {(details?.ncm || details?.item) && (
                <div className="rounded-lg bg-gray-50 p-3 text-xs text-gray-600 dark:bg-white/5 dark:text-gray-300">
                  {details?.ncm ? <div>NCM: {details.ncm}</div> : null}
                  {details?.item ? <div>ITEM: {details.item}</div> : null}
                </div>
              )}

              <div className="flex justify-end">
                <button
                  type="button"
                  className="btn rounded-md px-3 py-1.5 text-sm bg-gray-100 hover:bg-gray-200 dark:bg-white/10 dark:hover:bg-white/20"
                  onClick={() => setOpen(false)}
                >
                  Fechar
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}



