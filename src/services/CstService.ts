// src/services/CstService.ts
const API_URL = import.meta.env.VITE_API_URL || "http://localhost:8000";

// Ajuste a rota conforme o seu backend.
// Exemplos suportados: /cst/{code}/details  ou  /itens/cst-details?code=...
const DETAILS_ENDPOINT = (code: string) => `${API_URL}/cst/${encodeURIComponent(code)}/details`;

export type CstDetails = {
  reduction_percent?: string | number | null; // "10%" ou 10
  legal_basis?: string | null;                // ex.: "Lei X, artigo Y..."
};

export async function fetchCstDetails(code: string): Promise<CstDetails> {
  const res = await fetch(DETAILS_ENDPOINT(code), { method: "GET" });
  if (!res.ok) {
    // opcional: extraia erro do json
    throw new Error(`Falha ao buscar detalhes do CST ${code}`);
  }
  const json = await res.json();
  // normalize chaves, se o backend retornar em pt_BR:
  // return { reduction_percent: json.percentual_reducao, legal_basis: json.base_legal };
  return json as CstDetails;
}
