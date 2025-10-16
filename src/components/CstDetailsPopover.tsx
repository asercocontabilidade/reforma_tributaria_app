import { useEffect, useRef, useState } from "react";
import { fetchCstDetails, CstDetails } from "../services/CstService";

// Tipagem
type Props = {
  cst: string;
  className?: string;
};

// Cache simples para não repetir chamadas
const memoryCache = new Map<string, CstDetails>();

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

export default function CstDetailsPopover({ cst, className = "" }: Props) {
  const [open, setOpen] = useState(false);
  const [details, setDetails] = useState<CstDetails | null>(null);
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

  async function toggle() {
    if (!open) {
      if (memoryCache.has(cst)) {
        setDetails(memoryCache.get(cst)!);
        setErr(null);
        setOpen(true);
        return;
      }

      setLoading(true);
      setErr(null);
      try {
        const d = await fetchCstDetails(cst);
        memoryCache.set(cst, d);
        setDetails(d);
        setOpen(true);
      } catch (e: any) {
        console.warn("Falha ao buscar detalhes — modo teste ativado.");
        setErr(e?.message || "Erro ao carregar detalhes");
        // textos fixos de teste quando a API falhar
        setDetails({
          reduction_percent: "Teste: 12%",
          legal_basis: "Lei 12.345/2024 - Art. 3º, inciso IV",
        });
        setOpen(true);
      } finally {
        setLoading(false);
      }
    } else {
      setOpen(false);
    }
  }

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

              <div className="rounded-lg bg-gray-50 p-3 text-sm dark:bg-white/10">
                <div className="mb-1 text-xs text-gray-500 dark:text-gray-400">
                  Percentual de redução
                </div>
                <div className="font-medium text-gray-900 dark:text-gray-100">
                  {details?.reduction_percent ?? "—"}
                </div>
                {err && (
                  <div className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                    (dados de teste exibidos por falha na requisição)
                  </div>
                )}
              </div>

              <div className="rounded-lg bg-gray-50 p-3 text-sm dark:bg-white/10">
                <div className="mb-1 text-xs text-gray-500 dark:text-gray-400">
                  Base legal
                </div>
                <div className="font-medium text-gray-900 dark:text-gray-100 whitespace-pre-wrap break-words">
                  {details?.legal_basis ?? "—"}
                </div>
                {err && (
                  <div className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                    (dados de teste exibidos por falha na requisição)
                  </div>
                )}
              </div>

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


