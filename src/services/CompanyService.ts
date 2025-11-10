// src/services/CompanyService.ts
import { apiFetch, apiGetJson, apiPostJson } from "./api";

export type CompanyRole = "basic" | "pro" | "special" | string;

export type CompanyRow = {
  id: number;
  // Nome Fantasia
  customer_name: string;
  // Assinatura (Basic/Pro/Special)
  role: CompanyRole;

  // Razão Social
  company_name: string;

  // NOVO: CNPJ vindo do endpoint
  cnpj?: string | null;

  phone_number?: string | null;

  // endereço "legacy" vindo do backend (manter compat.)
  address?: string | null;

  // Subcampos de endereço — front-end only (enviados combinados em address)
  endereco_rua?: string | null;
  endereco_numero?: string | null;
  endereco_bairro?: string | null;
  municipio?: string | null;
  estado?: string | null;

  contract_start_date: string; // ISO
  contract_end_date: string;   // ISO

  // CNAE completo / principal
  cnae_company?: string | null;

  // Regime(s) selecionado(s) — armazenados como string (ex.: "Simples Nacional;Lucro Real")
  tax_regime?: string | null;

  // ERP
  erp_code?: string | null;

  // Valor mensal
  monthly_value: number;

  // NOVO: Escritório vinculado (Razão Social)
  office_razao_social?: string | null;

  // (campos livres que possam vir da API)
  [k: string]: any;
};

const baseUrl = import.meta.env.VITE_API_URL || "http://localhost:8000";

// LISTAR
export async function fetchCompanies(baseUrl = import.meta.env.VITE_API_URL || "http://localhost:8000"): Promise<Company[]> {
  return apiGetJson<Company[]>(`/company/find_all_company`);
}

// CRIAR (seu backend pode ter outra rota; mantive /company/register)
export async function createCompany(payload: CompanyRow): Promise<CompanyRow> {
  return apiPostJson<CompanyRow>(`${baseUrl}/company/register`, payload);
}

// ATUALIZAR
// OBS: o enunciado traz a URL sem a '/', respeitei exatamente como fornecido.
const UPDATE_URL = "http://192.168.1.65:8037/company/update_company";

export async function updateCompany(payload: CompanyRow): Promise<CompanyRow> {
  // Monta address completo a partir dos subcampos (sem perder compatibilidade)
  const {
    endereco_rua,
    endereco_numero,
    endereco_bairro,
    municipio,
    estado,
    ...rest
  } = payload;

  const address =
    payload.address && payload.address.trim().length > 0
      ? payload.address
      : [
          endereco_rua,
          endereco_numero ? `Nº ${endereco_numero}` : null,
          endereco_bairro,
          municipio,
          estado,
        ]
          .filter(Boolean)
          .join(" - ");

  const body = {
    ...rest,
    address,
    municipio,
    estado,
  };

  const res = await apiFetch(UPDATE_URL, {
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

export async function linkUserToCompany(
  companyId: number,
  userId: number,
  baseUrl = import.meta.env.VITE_API_URL || "http://localhost:8000"
): Promise<{ success: boolean }> {
  // endpoint: POST /users/update_user_company/company_id/user_id  (corpo vazio)
  return apiPostJson<{ success: boolean }>(`/users/update_user_company/${companyId}/${userId}`, {});
}



