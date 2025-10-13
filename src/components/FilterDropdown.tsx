import { useEffect, useRef, useState } from "react";
import type { FilterField } from "../services/ItemsService";

type OnlySelectable = Exclude<FilterField, "ALL">;

type Option = { label: string; value: OnlySelectable };

type Props = {
  options: Option[];
  value: OnlySelectable[];          // selecionados (máx 2)
  onChange: (next: OnlySelectable[]) => void;
  max?: number;                     // default 2
  className?: string;
};

export default function FilterDropdown({
  options,
  value,
  onChange,
  max = 2,
  className = "",
}: Props) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  // fecha ao clicar fora
  useEffect(() => {
    function onDocClick(e: MouseEvent) {
      if (!ref.current) return;
      if (!ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", onDocClick);
    return () => document.removeEventListener("mousedown", onDocClick);
  }, []);

  function toggle(v: OnlySelectable) {
    const exists = value.includes(v);
    if (exists) onChange(value.filter((x) => x !== v));
    else if (value.length < max) onChange([...value, v]);
    // se já tem 2, ignora (ou você pode mostrar toast/aviso)
  }

  const count = value.length;
  const disabledValues = new Set<OnlySelectable>();
  if (count >= max) {
    options.forEach((opt) => {
      if (!value.includes(opt.value)) disabledValues.add(opt.value);
    });
  }

  return (
    <div ref={ref} className={`relative ${className}`}>
      <button
        type="button"
        aria-haspopup="listbox"
        aria-expanded={open}
        onClick={() => setOpen((s) => !s)}
        className="btn rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-800 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-primary/40 dark:border-white/10 dark:bg-white/5 dark:text-white dark:hover:bg-white/10"
      >
        Filtros ({count}/2)
      </button>

      {open && (
        <div
          role="listbox"
          tabIndex={-1}
          className="absolute z-30 mt-2 w-72 max-w-[90vw] rounded-xl border border-gray-200 bg-white p-2 shadow-lg dark:border-white/10 dark:bg-[#0f0e2f]"
        >
          <div className="mb-2 px-2 text-xs font-medium text-gray-600 dark:text-gray-300">
            Selecione até 2 colunas
          </div>
          <ul className="max-h-64 space-y-1 overflow-auto pr-1">
            {options.map((opt) => {
              const checked = value.includes(opt.value);
              const disabled = disabledValues.has(opt.value);
              return (
                <li key={opt.value}>
                  <label
                    className={`flex cursor-pointer items-center gap-2 rounded-lg px-2 py-2 text-sm ${
                      disabled ? "opacity-50" : "hover:bg-gray-50 dark:hover:bg-white/10"
                    }`}
                  >
                    <input
                      type="checkbox"
                      className="h-4 w-4"
                      checked={checked}
                      disabled={disabled}
                      onChange={() => toggle(opt.value)}
                    />
                    <span className="text-gray-800 dark:text-gray-200">{opt.label}</span>
                  </label>
                </li>
              );
            })}
          </ul>

          {count > 0 && (
            <>
              <div className="mt-2 flex flex-wrap gap-2 px-2">
                {value.map((v) => (
                  <span
                    key={v}
                    className="inline-flex items-center gap-1 rounded-full bg-gray-100 px-2 py-1 text-xs text-gray-700 dark:bg-white/10 dark:text-gray-200"
                  >
                    {v}
                    <button
                      type="button"
                      className="rounded p-0.5 hover:bg-gray-200 dark:hover:bg-white/20"
                      onClick={() => onChange(value.filter((x) => x !== v))}
                      aria-label={`remover ${v}`}
                    >
                      ×
                    </button>
                  </span>
                ))}
              </div>
              <div className="mt-2 flex justify-end gap-2 px-2 pb-1">
                <button
                  type="button"
                  className="rounded-lg px-3 py-1.5 text-sm text-gray-700 hover:bg-gray-100 dark:text-gray-200 dark:hover:bg-white/10"
                  onClick={() => onChange([])}
                >
                  Limpar
                </button>
                <button
                  type="button"
                  className="btn btn-primary rounded-lg px-3 py-1.5 text-sm"
                  onClick={() => setOpen(false)}
                >
                  OK
                </button>
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
}
