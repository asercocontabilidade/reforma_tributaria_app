import { apiFetch } from "./api";

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

const token = localStorage.getItem("access_token"); // ou pegue do seu AuthContext

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:8000";

export async function searchItems(params: {
  q?: string;
  field?: FilterField;
  q2?: string;
  field2?: FilterField;
  page?: number;
  limit?: number;
}): Promise<SearchResponse> {
  const url = new URL(`${API_URL}/itens/search`);
  Object.entries(params).forEach(([k, v]) => {
    if (v !== undefined && v !== null && String(v).length > 0) url.searchParams.set(k, String(v));
  });

  const res = await apiFetch(url.toString(), { method: "GET" });
  if (!res.ok) {
    const detail = (await res.json().catch(() => ({} as any)))?.detail || res.statusText;
    throw new Error(detail);
  }
  return res.json();
}