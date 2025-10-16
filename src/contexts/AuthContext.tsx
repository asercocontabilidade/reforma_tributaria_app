// src/contexts/Auth.tsx
import { createContext, useContext, ReactNode, useEffect } from "react";
import { create } from "zustand";

// --- Tipos ---
type Role = "admin" | "administrator" | "client";

type AuthState = {
  token: string | null;
  role: Role | null;
  isActive: boolean;
  userId: number | null;
  setAuth: (data: { token: string; role: Role; isActive: boolean; id: number }) => void;
  clear: () => Promise<void>;
};

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:8000";

// --- Helpers de persistência ---
const STORAGE = {
  get(): Partial<AuthState> {
    const token = localStorage.getItem("access_token");
    const role = localStorage.getItem("role") as Role | null;
    const isActiveRaw = localStorage.getItem("is_active");
    const idRaw = localStorage.getItem("user_id");

    return {
      token: token ?? null,
      role: role ?? null,
      isActive: isActiveRaw ? isActiveRaw === "true" : true, // default true se não existir
      userId: idRaw ? Number(idRaw) : null,
    };
  },
  set(s: { token: string; role: Role; isActive: boolean; id: number }) {
    localStorage.setItem("access_token", s.token);
    localStorage.setItem("role", s.role);
    localStorage.setItem("is_active", String(s.isActive));
    localStorage.setItem("user_id", String(s.id));
  },
  clear() {
    localStorage.removeItem("access_token");
    localStorage.removeItem("role");
    localStorage.removeItem("is_active");
    localStorage.removeItem("user_id");
  },
};

// --- Store (Zustand) ---
const useAuthStore = create<AuthState>((set, get) => {
  // estado inicial reidratado
  const init = STORAGE.get();

  return {
    token: init.token ?? null,
    role: init.role ?? null,
    isActive: init.isActive ?? true,
    userId: init.userId ?? null,

    setAuth: ({ token, role, isActive, id }) => {
      STORAGE.set({ token, role, isActive, id });
      set({ token, role, isActive, userId: id });
    },

    clear: async () => {
      const { userId, token } = get();

      // (opcional) avisa o backend que o usuário saiu
      try {
        if (userId != null) {
          await fetch(`${API_URL}/users/${userId}/authenticated_status`, {
            method: "PATCH",
            headers: {
              accept: "application/json",
              "Content-Type": "application/json",
              ...(token ? { Authorization: `Bearer ${token}` } : {}),
            },
            body: JSON.stringify({ is_authenticated: false }),
          });
        }
      } catch (err) {
        console.error("Falha ao atualizar status de autenticação:", err);
      } finally {
        STORAGE.clear();
        set({ token: null, role: null, isActive: false, userId: null });
      }
    },
  };
});

// --- Contexto/Provider (mantive sua API pública) ---
const AuthContext = createContext<typeof useAuthStore | null>(null);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const store = useAuthStore;

  // Reidratação segura ao focar a aba: NÃO sobrescreve sem token
  useEffect(() => {
    const onFocus = async () => {
      const persisted = STORAGE.get();
      // Se NÃO houver token persistido, não mexe no estado atual
      if (!persisted.token) return;

      // (Opcional) Se quiser validar expiração e fazer refresh:
      // try {
      //   if (isExpired(persisted.token)) {
      //     const r = await fetch(`${API_URL}/auth/refresh`, { method: "POST", credentials: "include" });
      //     if (r.ok) {
      //       const j = await r.json();
      //       // mantenha role/isActive/userId do storage
      //       store.getState().setAuth({
      //         token: j.access_token,
      //         role: (persisted.role ?? "client") as Role,
      //         isActive: persisted.isActive ?? true,
      //         id: persisted.userId ?? 0,
      //       });
      //       return;
      //     }
      //   }
      // } catch (_) {}

      // Sem refresh: apenas garante que o estado em memória reflete o storage
      // Importante: só chama setAuth se houver token.
      store.getState().setAuth({
        token: persisted.token!,
        role: (persisted.role ?? "client") as Role,
        isActive: persisted.isActive ?? true,
        id: persisted.userId ?? 0,
      });
    };

    window.addEventListener("focus", onFocus);
    // chama uma vez no mount para inicializar a sessão reidratada
    onFocus();

    return () => window.removeEventListener("focus", onFocus);
  }, [store]);

  return <AuthContext.Provider value={store}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx();
};

// Helper para checar admin
export const isAdmin = (role: Role | null) => role === "admin" || role === "administrator";

/* Opcional: checar expiração do JWT
function isExpired(token: string): boolean {
  try {
    const base64 = token.split(".")[1];
    const json = JSON.parse(atob(base64));
    if (!json?.exp) return false;
    const now = Math.floor(Date.now() / 1000);
    return json.exp < now;
  } catch {
    return false;
  }
}
*/


