// src/services/CompanyService.ts
import { apiGetJson, apiPostJson } from "./api";

export type CompanyRole = "basic" | "pro" | "enterprise"; // ajuste se houver enum no backend

export type Company = {
  id: number;
  customer_name: string;
  role: CompanyRole | string;
  company_name: string;
  phone_number: string;
  address: string;
  contract_start_date: string; // ISO
  contract_end_date: string;   // ISO
  cnae_company: string;
  tax_regime: string;
  erp_code: string;
  monthly_value: number;
};

export type CreateCompanyPayload = Omit<Company, "id">;

export async function fetchCompanies(baseUrl = import.meta.env.VITE_API_URL || "http://localhost:8000"): Promise<Company[]> {
  return apiGetJson<Company[]>(`/company/find_all_company`);
}

export async function createCompany(
  payload: CreateCompanyPayload,
  baseUrl = import.meta.env.VITE_API_URL || "http://localhost:8000"
): Promise<Company> {
  return apiPostJson<Company>(`/company/register`, payload);
}

export async function linkUserToCompany(
  companyId: number,
  userId: number,
  baseUrl = import.meta.env.VITE_API_URL || "http://localhost:8000"
): Promise<{ success: boolean }> {
  // endpoint: POST /users/update_user_company/company_id/user_id  (corpo vazio)
  return apiPostJson<{ success: boolean }>(`/users/update_user_company/${companyId}/${userId}`, {});
}


