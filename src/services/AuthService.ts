// AuthService.ts
type Role = "client" | "admin" | "administrator";

export type LoginResponse = {
  access_token: string;
  token_type: "bearer";
  role: Role;
  is_active: boolean;
  id: number;              // <<< adicionar
};

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:8000";

export async function login(email: string, password: string): Promise<LoginResponse> {
  const res = await fetch(`${API_URL}/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password })
  });

  if (!res.ok) {
    const detail = (await res.json().catch(() => ({} as any)))?.detail;
    throw new Error(detail || "Email ou senha incorretos.");
  }

  return res.json();
}
