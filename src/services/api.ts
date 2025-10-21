// src/services/api.ts
const API_URL = import.meta.env.VITE_API_URL || "http://localhost:8000";

// ---- Token store (usa localStorage) ----
function getToken(): string | null {
  return localStorage.getItem("access_token");
}
function setToken(t: string | null) {
  if (t) localStorage.setItem("access_token", t);
  else localStorage.removeItem("access_token");
  // notifica o AuthContext (se registrado)
  if (tokenUpdateHandler) tokenUpdateHandler(t);
}

// Permite o AuthContext “ouvir” quando o token muda aqui
let tokenUpdateHandler: ((token: string | null) => void) | null = null;
export function setTokenUpdateHandler(fn: (token: string | null) => void) {
  tokenUpdateHandler = fn;
}

// ---- Chama /auth/refresh para renovar o token ----
export async function refreshAccessToken(): Promise<string> {
  const res = await fetch(`${API_URL}/auth/refresh`, {
    method: "POST",
    credentials: "include", // envia cookie httpOnly do refresh
  });
  if (!res.ok) {
    throw new Error("Refresh failed");
  }
  const data = (await res.json()) as { access_token: string };
  setToken(data.access_token);
  return data.access_token;
}

// ---- Wrapper principal de fetch ----
export async function apiFetch(
  input: RequestInfo | URL,
  init: RequestInit = {},
  { retryOn401 = true }: { retryOn401?: boolean } = {}
): Promise<Response> {
  const headers = new Headers(init.headers || {});
  const token = getToken();
  if (token) headers.set("Authorization", `Bearer ${token}`);

  const first = await fetch(input instanceof URL ? input.toString() : input, {
    ...init,
    headers,
  });

  // Se deu 401, tenta detectar a mensagem do backend
  if (first.status === 401 && retryOn401) {
    try {
      const errJson = await first.clone().json().catch(() => ({} as any));
      const detail: string =
        errJson?.detail ||
        first.statusText ||
        "";

      const looksExpired =
        /invalid|expired|token/i.test(detail);

      if (looksExpired) {
        // tenta renovar
        await refreshAccessToken();

        // refaz a request com o novo token (uma vez)
        const h2 = new Headers(init.headers || {});
        const t2 = getToken();
        if (t2) h2.set("Authorization", `Bearer ${t2}`);

        return fetch(input instanceof URL ? input.toString() : input, {
          ...init,
          headers: h2,
        });
      }
    } catch {
      // se qualquer coisa falhar, cai pra resposta original
    }
  }

  return first;
}
