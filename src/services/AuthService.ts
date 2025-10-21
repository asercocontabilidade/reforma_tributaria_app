// services/AuthService.ts
type Role = "client" | "admin" | "administrator";

export type LoginResponse = {
  access_token: string;
  token_type: "bearer";
  role: Role;
  is_active: boolean;
  id: number;
};

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:8000";

export async function login(email: string, password: string): Promise<LoginResponse> {
  const res = await fetch(`${API_URL}/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    credentials: "include",
    body: JSON.stringify({ email, password }),
  });

  if (!res.ok) {
    const detail = (await res.json().catch(() => ({} as any)))?.detail;
    throw new Error(detail || "Email ou senha incorretos.");
  }

  return res.json();
}

export async function refresh(): Promise<{ access_token: string; token_type: "bearer" }> {
  const res = await fetch(`${API_URL}/auth/refresh`, {
    method: "POST",
    credentials: "include", // envia cookie rt
  });
  if (!res.ok) {
    const detail = (await res.json().catch(() => ({} as any)))?.detail;
    throw new Error(detail || "Não foi possível renovar o token.");
  }
  return res.json();
}

