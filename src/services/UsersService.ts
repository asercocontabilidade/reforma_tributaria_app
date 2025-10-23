// src/services/UsersService.ts
import { apiFetch } from "./api";

/**
 * Por padrão, usamos a mesma base, mas você pode
 * sobrescrever por .env se os endpoints estiverem em portas diferentes.
 *
 * VITE_API_URL_USERS      → GET /users/find_all_users  e POST /auth/register
 * VITE_API_URL_STATUS     → PATCH /users/{id}/status
 */
const API_URL_USERS =
  import.meta.env.VITE_API_URL_USERS ||
  import.meta.env.VITE_API_URL ||
  "http://192.168.1.65:8022";

const API_URL_STATUS =
  import.meta.env.VITE_API_URL_STATUS ||
  API_URL_USERS || // fallback: mesma base
  "http://192.168.1.65:8022";

export type Role = "client" | "admin" | "administrator";

export type UserRow = {
  id: number;
  email: string;
  cnpj_cpf: string | null;
  ip_address: string | null;
  full_name: string | null;
  role: Role;
  is_active: boolean;
  status_changed_at: string | null;
  company_id: number | null;
};

// ---- LISTAR ----
export async function fetchUsers(): Promise<UserRow[]> {
  const url = `${API_URL_USERS}/users/find_all_users`;
  const res = await apiFetch(url, { method: "GET" });
  if (!res.ok) {
    const detail = (await res.json().catch(() => ({} as any)))?.detail || res.statusText;
    throw new Error(detail);
  }
  return res.json();
}

// ---- CRIAR ----
export type CreateUserPayload = {
  email: string;
  cnpj_cpf?: string;
  ip_address?: string;
  password: string;
  full_name?: string;
  role: Role;
  company_id?: number; 
};

export async function createUser(payload: CreateUserPayload): Promise<UserRow> {
  const url = `${API_URL_USERS}/auth/register`;
  const res = await apiFetch(
    url,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    }
  );
  if (!res.ok) {
    const detail = (await res.json().catch(() => ({} as any)))?.detail || res.statusText;
    throw new Error(detail);
  }
  return res.json();
}

// ---- ALTERAR STATUS ----
export async function updateUserStatus(id: number, isActive: boolean): Promise<void> {
  const url = `${API_URL_STATUS}/users/${id}/status`;
  const res = await apiFetch(
    url,
    {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ is_active: isActive }),
    }
  );
  if (!res.ok) {
    const detail = (await res.json().catch(() => ({} as any)))?.detail || res.statusText;
    throw new Error(detail);
  }
}
