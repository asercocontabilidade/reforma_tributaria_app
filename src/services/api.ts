// src/services/api.ts
const API_URL = import.meta.env.VITE_API_URL || "http://localhost:8000";

function getToken(): string | null {
  return localStorage.getItem("access_token");
}
function setToken(t: string | null) {
  if (t) localStorage.setItem("access_token", t);
  else localStorage.removeItem("access_token");
  if (tokenUpdateHandler) tokenUpdateHandler(t);
}

// Permite o AuthContext “ouvir” mudanças do token
let tokenUpdateHandler: ((token: string | null) => void) | null = null;
export function setTokenUpdateHandler(fn: (token: string | null) => void) {
  tokenUpdateHandler = fn;
}

export async function refreshAccessToken(): Promise<string> {
  const res = await fetch(`${API_URL}/auth/refresh`, {
    method: "POST",
    credentials: "include",
  });
  if (!res.ok) {
    throw new Error("Refresh failed");
  }
  const data = (await res.json()) as { access_token: string };
  setToken(data.access_token);
  return data.access_token;
}

async function extractDetail(res: Response): Promise<string> {
  try {
    const clone = res.clone();
    const json = await clone.json();
    return (json?.detail ?? json?.message ?? "").toString();
  } catch {
    try {
      return await res.clone().text();
    } catch {
      return "";
    }
  }
}

function looksLikeInvalidOrExpired(detail: string): boolean {
  const s = (detail || "").toLowerCase();
  return (
    s.includes("invalid or expired token") ||
    (s.includes("invalid") && s.includes("token")) ||
    (s.includes("expired") && s.includes("token")) ||
    s.includes("token expirado") ||
    s.includes("token inválido")
  );
}

export async function apiFetch(
  input: RequestInfo | URL,
  init: RequestInit = {},
  { retryOn401 = true }: { retryOn401?: boolean } = {}
): Promise<Response> {
  const url = input instanceof URL ? input.toString() : (input as string);
  const token = getToken();

  const h1 = new Headers(init.headers || {});
  if (token) h1.set("Authorization", `Bearer ${token}`);

  let res = await fetch(url, { ...init, headers: h1 });
  if (res.ok) return res;

  if (res.status === 401 && retryOn401) {
    const detail1 = await extractDetail(res);

    if (looksLikeInvalidOrExpired(detail1)) {
      try {
        await refreshAccessToken();
      } catch {
        throw new Error("Sua conta expirou, saia e entre novamente.");
      }

      const newToken = getToken();
      const h2 = new Headers(init.headers || {});
      if (newToken) h2.set("Authorization", `Bearer ${newToken}`);

      res = await fetch(url, { ...init, headers: h2 });
      if (res.ok) return res;

      if (res.status === 401) {
        const detail2 = await extractDetail(res);
        if (looksLikeInvalidOrExpired(detail2)) {
          throw new Error("Sua conta expirou, saia e entre novamente.");
        }
      }
    }
  }

  return res;
}

export async function apiGetJson<T>(path: string, init: RequestInit = {}): Promise<T> {
  const res = await apiFetch(`${API_URL}${path}`, { ...init, method: "GET" });
  if (!res.ok) {
    const detail = await extractDetail(res);
    throw new Error(detail || res.statusText);
  }
  return res.json() as Promise<T>;
}

export async function apiPostJson<T>(
  path: string,
  body: unknown,
  init: RequestInit = {}
): Promise<T> {
  const res = await apiFetch(`${API_URL}${path}`, {
    method: "POST",
    headers: { "Content-Type": "application/json", ...(init.headers || {}) },
    body: JSON.stringify(body),
    ...init,
  });
  if (!res.ok) {
    const detail = await extractDetail(res);
    throw new Error(detail || res.statusText);
  }
  return res.json() as Promise<T>;
}

export async function apiPatchJson<T>(
  path: string,
  body: unknown,
  init: RequestInit = {}
): Promise<T> {
  const res = await apiFetch(`${API_URL}${path}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json", ...(init.headers || {}) },
    body: JSON.stringify(body),
    ...init,
  });
  if (!res.ok) {
    const detail = await extractDetail(res);
    throw new Error(detail || res.statusText);
  }
  return res.json() as Promise<T>;
}

