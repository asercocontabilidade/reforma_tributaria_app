export type FilterField = "ITEM" | "ANEXO" | "DESCRIÇÃO DO PRODUTO" | "NCM" | "DESCRIÇÃO TIPI" | "ALL";

export type ItemRow = {
  ITEM: string;
  ANEXO: string;
  "DESCRIÇÃO DO PRODUTO": string;
  NCM: string;
  "DESCRIÇÃO TIPI": string;
  "CST IBS E CBS": string;
  CCLASSTRIB: string;
};

export type SearchResponse = {
  page: number;
  total_pages: number;
  total_items: number;
  data: ItemRow[];
};

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:8000";

export async function searchItems(params: {
  field: FilterField;
  q: string;
  field2?: FilterField | null;
  q2?: string;
  page: number;
  limit?: number;
}): Promise<SearchResponse> {
  const url = new URL(`${API_URL}/itens/search`);
  url.searchParams.set("field", params.field || "ALL");
  url.searchParams.set("q", params.q || "");
  if (params.field2) url.searchParams.set("field2", params.field2);
  if (params.q2) url.searchParams.set("q2", params.q2);
  url.searchParams.set("page", String(params.page || 1));
  if (params.limit) url.searchParams.set("limit", String(params.limit));

  const res = await fetch(url.toString(), { method: "GET" });
  if (!res.ok) {
    const detail = (await res.json().catch(() => ({} as any)))?.detail || res.statusText;
    throw new Error(detail);
  }
  return res.json();
}
