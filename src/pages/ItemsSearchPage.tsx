import { useEffect, useMemo, useState } from "react";
import { searchItems, FilterField, ItemRow, SearchResponse } from "../services/ItemsService";
import Loader from "../components/Loader";
import Pagination from "../components/Pagination";
import FilterDropdown from "../components/FilterDropdown.tsx";

const CHECK_OPTIONS: { label: string; value: Exclude<FilterField, "ALL"> }[] = [
  { label: "ITEM", value: "ITEM" },
  { label: "Descrição do Produto", value: "DESCRIÇÃO DO PRODUTO" },
  { label: "NCM", value: "NCM" },
  { label: "Descrição TIPI", value: "DESCRIÇÃO TIPI" },
];

export default function ItemsSearchPage() {
  // filtros (máx 2) escolhidos no dropdown
  const [selected, setSelected] = useState<Exclude<FilterField, "ALL">[]>([]);
  const [q1, setQ1] = useState("");
  const [q2, setQ2] = useState("");

  const [page, setPage] = useState(1);
  const [limit] = useState(15);

  const [data, setData] = useState<ItemRow[]>([]);
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  const field1: FilterField = selected[0] ?? "ALL";
  const field2: FilterField | undefined = selected[1];

  const canSearch = useMemo(() => {
    if (selected.length === 0) return q1.trim().length >= 0; // ALL pode ser vazio (lista tudo)
    if (selected.length === 1) return q1.trim().length > 0;
    return q1.trim().length > 0 && q2.trim().length > 0;
  }, [selected, q1, q2]);

  useEffect(() => {
    if (selected.length < 2) setQ2("");
  }, [selected.length]);

  async function runSearch(goToPage?: number) {
    const targetPage = goToPage ?? page;
    setLoading(true);
    setErr(null);
    try {
      const res: SearchResponse = await searchItems({
        field: field1,
        q: q1.trim(),
        field2: field2 ?? undefined,
        q2: field2 ? q2.trim() : undefined,
        page: targetPage,
        limit,
      });
      setData(res.data);
      setPage(res.page);
      setTotalPages(res.total_pages);
      setTotalItems(res.total_items);
    } catch (e: any) {
      setErr(e?.message || "Erro ao buscar itens.");
      setData([]);
      setTotalPages(1);
      setTotalItems(0);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    runSearch(1);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!canSearch) return;
    runSearch(1);
  }

  return (
    <div className="p-4 md:p-6">
        <div className="mb-4 flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
        <h2 className="text-2xl font-semibold text-primary dark:text-white">
            Pesquisar Itens
        </h2>

        <FilterDropdown
            options={CHECK_OPTIONS}
            value={selected}
            onChange={setSelected}
            max={2}
            className="mt-2 md:mt-0"  // 👈 empurra pra baixo no mobile, alinha no desktop
        />
        </div>
      {/* Inputs de busca (1º e 2º conforme filtros) */}
      <form onSubmit={onSubmit} className="mb-4 grid gap-3 md:grid-cols-[1fr_auto]">
        <div className="grid gap-3 sm:grid-cols-1 md:grid-cols-2">
          {/* Campo 1 */}
          <div className="flex flex-col">
            <label className="mb-1 text-xs font-medium text-gray-600 dark:text-gray-300">
              {selected[0] ? `Buscar em ${selected[0]}` : "Buscar (Todos)"}
            </label>
            <input
              type="text"
              className="input"
              placeholder={selected[0] ? `Digite para ${selected[0]}` : "Digite para buscar em todos os campos"}
              value={q1}
              onChange={(e) => setQ1(e.target.value)}
            />
          </div>

          {/* Campo 2 (aparece se há 2 filtros) */}
          {selected.length === 2 && (
            <div className="flex flex-col">
              <label className="mb-1 text-xs font-medium text-gray-600 dark:text-gray-300">
                Buscar em {selected[1]}
              </label>
              <input
                type="text"
                className="input"
                placeholder={`Digite para ${selected[1]}`}
                value={q2}
                onChange={(e) => setQ2(e.target.value)}
              />
            </div>
          )}
        </div>

        <div className="flex items-end">
          <button type="submit" className="btn btn-primary min-w-[140px]" disabled={!canSearch}>
            Pesquisar
          </button>
        </div>
      </form>

      {loading && <Loader />}

      {err && (
        <div className="mb-4 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700 dark:border-red-500/40 dark:bg-red-900/20 dark:text-red-200">
          {err}
        </div>
      )}

      {!loading && !err && data.length === 0 && (
        <div className="rounded-lg border border-gray-200 p-4 text-sm text-gray-600 dark:border-white/10 dark:text-gray-300">
          Nenhum resultado encontrado.
        </div>
      )}

      {!loading && !err && data.length > 0 && (
        <div className="overflow-x-auto">
          <table className="min-w-full border-separate border-spacing-y-2">
            <thead>
              <tr className="text-left text-sm text-gray-600 dark:text-gray-300">
                <th className="px-3 py-2">ITEM</th>
                <th className="px-3 py-2">DESCRIÇÃO DO PRODUTO</th>
                <th className="px-3 py-2">NCM</th>
                <th className="px-3 py-2">DESCRIÇÃO TIPI</th>
                <th className="px-3 py-2">CST IBS E CBS</th>
                <th className="px-3 py-2">CCLASSTRIB</th>
              </tr>
            </thead>
            <tbody>
              {data.map((row, idx) => (
                <tr key={idx} className="card dark:bg-[#0f0e2f]">
                  <td className="px-3 py-2">{row.ITEM}</td>
                  <td className="px-3 py-2">{row["DESCRIÇÃO DO PRODUTO"]}</td>
                  <td className="px-3 py-2">{row.NCM}</td>
                  <td className="px-3 py-2">{row["DESCRIÇÃO TIPI"]}</td>
                  <td className="px-3 py-2">{row["CST IBS E CBS"]}</td>
                  <td className="px-3 py-2">{row.CCLASSTRIB}</td>
                </tr>
              ))}
            </tbody>
          </table>

          <div className="mt-2 text-sm text-gray-600 dark:text-gray-300">
            Total de itens: <strong>{totalItems}</strong>
          </div>

          <Pagination page={page} totalPages={totalPages} onChange={(p) => runSearch(p)} />
        </div>
      )}
    </div>
  );
}


