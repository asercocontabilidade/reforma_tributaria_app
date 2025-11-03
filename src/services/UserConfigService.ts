// src/services/UserConfigService.ts
import { apiFetch } from "./api";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:8000";

export type UserConfig = {
  id: number;
  email: string;
  cnpj_cpf: string | null;
  ip_address: string | null;
  full_name: string;
  role: "client" | "admin" | "administrator";
  is_active: boolean;
  status_changed_at: string | null;
  company_id: number | null;
};

export async function getUserById(userId: number): Promise<UserConfig> {
  const url = `${API_URL}/users/get_user_by_id/${userId}`;
  const res = await apiFetch(url, { method: "GET" });
  if (!res.ok) {
    const detail = (await res.json().catch(() => ({} as any)))?.detail || res.statusText;
    throw new Error(detail || "Erro ao buscar usuário.");
  }
  return res.json();
}

export type UpdateUserConfigPayload = {
  id: number;
  password?: string;   // opcional
  full_name?: string;  // opcional
};

export async function updateUserConfig(payload: UpdateUserConfigPayload): Promise<void> {
  const url = `${API_URL}/users/update_user_config`;
  const res = await apiFetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json", accept: "*/*" },
    body: JSON.stringify(payload),
  });
  if (!res.ok) {
    const detail = (await res.json().catch(() => ({} as any)))?.detail || res.statusText;
    throw new Error(detail || "Erro ao atualizar configurações do usuário.");
  }
}
