// src/services/TermsService.ts
import { apiFetch } from "./api";

const API_URL = import.meta.env.VITE_API_URL;

export async function checkSignedContract(userId: number, type: string): Promise<boolean> {
  const url = `${API_URL}/users/is_signed_contract/${userId}/${type}`;
  const res = await apiFetch(url, { method: "GET" });

  if (!res.ok) {
    const data = await res.json().catch(() => null);

    if (data?.detail?.includes("Contrato não encontrado")) {
      return false;
    }
    throw new Error(data?.detail || "Erro ao verificar contrato.");
  }

  return res.json();
}

export async function signContract(payload: {
  user_id: number;
  type_of_contract: string;
  is_signature_accepted: boolean;
  term_content: string;
}) {
  const url = `${API_URL}/users/contract_signing`;
  const res = await apiFetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json", accept: "*/*" },
    body: JSON.stringify(payload),
  });

  if (!res.ok) {
    const data = await res.json().catch(() => null);
    throw new Error(data?.detail || "Erro ao assinar contrato.");
  }
}

