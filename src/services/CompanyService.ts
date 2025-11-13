// src/services/CompanyService.ts
import { apiFetch, apiGetJson, apiPostJson } from "./api";

export type CompanyRole = "basic" | "pro" | "special" | string;

export type CompanyRow = {
  id: number;
  customer_name: string;
  role: CompanyRole;
  company_name: string;

  // NOVOS
  email?: string | null;
  cpf?: string | null;

  cnpj?: string | null;
  phone_number?: string | null;

  address?: string | null;
  endereco_rua?: string | null;
  endereco_numero?: string | null;
  endereco_bairro?: string | null;
  municipio?: string | null;
  estado?: string | null;

  contract_start_date: string;
  contract_end_date: string;

  cnae_company?: string | null;
  cnae_description?: string | null; // <—— NOVO

  tax_regime?: string | null;
  erp_code?: string | null;
  monthly_value: number;

  office_razao_social?: string | null;
  [k: string]: any;
};

const baseUrl = import.meta.env.VITE_API_URL || "http://localhost:8000";

// LISTAR
export async function fetchCompanies(): Promise<CompanyRow[]> {
  return apiGetJson<CompanyRow[]>(`/company/find_all_company`);
}

// CRIAR
export async function createCompany(payload: CompanyRow): Promise<CompanyRow> {
  const {
    endereco_rua,
    endereco_numero,
    endereco_bairro,
    municipio,
    estado,
    ...rest
  } = payload;

  const address =
    payload.address && payload.address.trim()
      ? payload.address
      : [
          endereco_rua && `Rua: ${endereco_rua}`,
          endereco_numero && `Nº: ${endereco_numero}`,
          endereco_bairro && `Bairro: ${endereco_bairro}`,
          municipio && `Município: ${municipio}`,
          estado && `Estado: ${estado}`,
        ].filter(Boolean).join(" | ");

  // 🔴 Garante explicitamente os campos novos no body
  const body = {
    ...rest,
    email: payload.email ?? "",                 // <—— forçar envio
    cpf: payload.cpf ?? "",                     // <—— forçar envio (já deve vir só dígitos do form)
    cnae_description: payload.cnae_description ?? "", // <—— forçar envio
    address,
    municipio,
    estado,
  };

  return apiPostJson<CompanyRow>(`/company/register`, body);
}

// ATUALIZAR
export async function updateCompany(payload: CompanyRow): Promise<CompanyRow> {
  const {
    endereco_rua,
    endereco_numero,
    endereco_bairro,
    municipio,
    estado,
    ...rest
  } = payload;

  const address =
    payload.address && payload.address.trim()
      ? payload.address
      : [
          endereco_rua && `Rua: ${endereco_rua}`,
          endereco_numero && `Nº: ${endereco_numero}`,
          endereco_bairro && `Bairro: ${endereco_bairro}`,
          municipio && `Município: ${municipio}`,
          estado && `Estado: ${estado}`,
        ].filter(Boolean).join(" | ");

  // 🔴 Garante explicitamente os campos novos no body
  const body = {
    ...rest,
    email: payload.email ?? "",
    cpf: payload.cpf ?? "",
    cnae_description: payload.cnae_description ?? "",
    address,
    municipio,
    estado,
  };

  const res = await apiFetch(`${baseUrl}/company/update_company`, {
    method: "PUT",
    headers: { "Content-Type": "application/json", accept: "application/json" },
    body: JSON.stringify(body),
  });
  if (!res.ok) {
    const detail = (await res.json().catch(() => ({} as any)))?.detail || res.statusText;
    throw new Error(detail || "Falha ao atualizar empresa.");
  }
  return res.json();
}

// VINCULAR USUÁRIO
export async function linkUserToCompany(
  companyId: number,
  userId: number,
  baseUrlOverride = baseUrl
): Promise<{ success: boolean }> {
  return apiPostJson<{ success: boolean }>(`/users/update_user_company/${companyId}/${userId}`, {});
}





