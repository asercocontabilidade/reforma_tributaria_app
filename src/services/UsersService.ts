// src/services/UsersService.ts
import { apiFetch } from "./api";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:8000";

/** Perfis válidos */
export type Role = "client" | "support" | "administrator";

export type UserRow = {
  id: number;
  email: string;
  cnpj_cpf: string | null;
  ip_address?: string | null;
  full_name: string | null;
  role: Role;
  is_active: boolean;
  status_changed_at: string | null;
  company_id?: number | null;
  is_authenticated?: boolean | null;
  /** preenchido no front a partir do company_id */
  company_name?: string | null;
};

export type CreateUserPayload = {
  email: string;
  cnpj_cpf?: string | null;
  ip_address?: string | null;
  password: string;
  full_name?: string;
  role: Role;
};

// LISTAR
export async function fetchUsers(): Promise<UserRow[]> {
  const url = `${API_URL}/users/find_all_users`;
  const res = await apiFetch(url, { method: "GET" });
  if (!res.ok) {
    const detail = (await res.json().catch(() => ({} as any)))?.detail || res.statusText;
    throw new Error(detail || "Falha ao carregar usuários.");
  }
  return res.json();
}

// CRIAR
export async function createUser(payload: CreateUserPayload): Promise<void> {
  const url = `${API_URL}/auth/register`;
  const res = await apiFetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json", accept: "application/json" },
    body: JSON.stringify(payload),
  });
  if (!res.ok) {
    const detail = (await res.json().catch(() => ({} as any)))?.detail || res.statusText;
    throw new Error(detail || "Falha ao criar usuário.");
  }
}

// ATIVAR/BLOQUEAR
export async function updateUserStatus(id: number, is_active: boolean): Promise<void> {
  const url = `${API_URL}/users/${id}/status`;
  const res = await apiFetch(url, {
    method: "PATCH",
    headers: { "Content-Type": "application/json", accept: "application/json" },
    body: JSON.stringify({ is_active }),
  });
  if (!res.ok) {
    const detail = (await res.json().catch(() => ({} as any)))?.detail || res.statusText;
    throw new Error(detail || "Falha ao alterar status.");
  }
}

// Alternar sessão (logado/deslogado)
export async function updateAuthenticatedStatus(id: number, is_authenticated: boolean): Promise<void> {
  const url = `${API_URL}/users/${id}/authenticated_status`;
  const res = await apiFetch(url, {
    method: "PATCH",
    headers: { "Content-Type": "application/json", accept: "application/json" },
    body: JSON.stringify({ is_authenticated }),
  });
  if (!res.ok) {
    const detail = (await res.json().catch(() => ({} as any)))?.detail || res.statusText;
    throw new Error(detail || "Falha ao alterar status de sessão.");
  }
}

// Buscar 1 usuário por id (para edição)
export async function fetchUserById(id: number): Promise<UserRow> {
  const url = `${API_URL}/users/get_user_by_id/${id}`;
  const res = await apiFetch(url, { method: "GET" });
  if (!res.ok) {
    const detail = (await res.json().catch(() => ({} as any)))?.detail || res.statusText;
    throw new Error(detail || "Falha ao buscar usuário.");
  }
  return res.json();
}

// Atualizar dados do usuário
export async function updateUser(payload: {
  id: number;
  email: string;
  full_name: string;
  cnpj_cpf: string;
  role: Role;
}): Promise<void> {
  const url = `${API_URL}/users/update_user`;
  const res = await apiFetch(url, {
    method: "PUT",
    headers: { "Content-Type": "application/json", accept: "application/json" },
    body: JSON.stringify(payload),
  });
  if (!res.ok) {
    const detail = (await res.json().catch(() => ({} as any)))?.detail || res.statusText;
    throw new Error(detail || "Falha ao atualizar usuário.");
  }
}

/** ===== Empresa (para razão social) ===== */
export type Company = {
  id: number;
  company_name: string;
};

export async function fetchCompanyById(companyId: number): Promise<Company | null> {
  if (!companyId && companyId !== 0) return null;
  const url = `${API_URL}/company/find_company_by_company_id/${companyId}`;
  const res = await apiFetch(url, { method: "GET" });
  if (!res.ok) {
    // se 404 ou erro, retorna null para não quebrar a lista
    return null;
  }
  const data = await res.json();
  return { id: data.id, company_name: data.company_name } as Company;
}





