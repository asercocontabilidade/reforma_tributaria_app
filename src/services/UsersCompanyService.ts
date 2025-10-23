// src/services/UsersService.ts
import { apiGetJson } from "./api";

export type UserRole = "client" | "admin" | "administrator";

export type UserLite = {
  id: number;
  email: string;
  cnpj_cpf?: string | null;
  ip_address?: string | null;
  full_name?: string | null;
  role: UserRole | string;
  is_active: boolean;
  status_changed_at?: string | null;
  company_id?: number | null; // se o backend enviar, ótimo; caso não, tratamos como null
};

export async function fetchAllUsers(): Promise<UserLite[]> {
  return apiGetJson<UserLite[]>(`/users/find_all_users`);
}
