// src/services/CstService.ts
const API_URL = import.meta.env.VITE_API_URL || "http://localhost:8000";

// Novo endpoint: /itens/details?ncm=...&item=...
const DETAILS_ENDPOINT = (params: { ncm?: string; item?: string }) => {
  const usp = new URLSearchParams();
  if (params.ncm) usp.set("ncm", params.ncm);
  if (params.item) usp.set("item", params.item);
  return `${API_URL}/itens/details?${usp.toString()}`;
};

// Tipos normalizados no front
export type ItemDetails = {
  anexo?: string;
  item?: string;
  ncm?: string;
  product_description?: string; // DESCRIÇÃO DO PRODUTO
  full_description?: string;    // DESCRIÇÃO COMPLETA  (vai para "Base legal")
  ibs?: string | number | null; // IBS
  cbs?: string | number | null; // CBS
};

// O backend retorna: { count: number, data: Array<{ ...pt-BR... }> }
export async function fetchItemDetails(params: {
  ncm?: string;
  item?: string;
}): Promise<ItemDetails | null> {
  if (!params.ncm && !params.item) {
    throw new Error("Informe ncm ou item");
  }

  const res = await fetch(DETAILS_ENDPOINT(params), { method: "GET" });
  if (!res.ok) {
    throw new Error("Falha ao buscar detalhes");
  }
  const json = await res.json();

// src/services/CstService.ts (substitua apenas a parte de escolha do chosen)
  const arr = Array.isArray(json?.data) ? json.data : [];
  if (arr.length === 0) return null;

  let chosen = arr[0];

  // prioriza match exato do NCM (se informado)
  if (params.ncm) {
    const exact = arr.filter(
      (r: any) => String(r?.["NCM"] ?? "").trim() === String(params.ncm).trim()
    );
    if (exact.length) {
      // dentre os exatos, pega o maior IBS (se disponível), senão maior CBS
      const toNum = (x: any) => {
        const n = Number(String(x ?? "").replace(",", "."));
        return isNaN(n) ? -Infinity : n;
      };
      exact.sort((a: any, b: any) => (toNum(b["IBS"]) - toNum(a["IBS"])) || (toNum(b["CBS"]) - toNum(a["CBS"])));
      chosen = exact[0];
    }
  }

  // Normalização das chaves
  const map: ItemDetails = {
    anexo: chosen?.["ANEXO"] ?? "",
    item: chosen?.["ITEM"] ?? "",
    ncm: chosen?.["NCM"] ?? "",
    product_description: chosen?.["DESCRIÇÃO DO PRODUTO"] ?? "",
    full_description: chosen?.["DESCRIÇÃO COMPLETA"] ?? "",
    ibs: chosen?.["IBS"] ?? chosen?.["CST IBS E CBS"] ?? null,
    cbs: chosen?.["CBS"] ?? null,
  };

  return map;
}

