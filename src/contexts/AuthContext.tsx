import { createContext, useContext, ReactNode, useEffect } from "react";
import { create } from "zustand";
import { refresh } from "../services/AuthService"; // ⬅️ Adiciona o serviço de refresh
import { setTokenUpdateHandler } from "../services/api"; // 👈 novo

// --- Tipos ---
type Role = "admin" | "administrator" | "client" | "support";

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

const AuthContext = createContext<typeof useAuthStore | null>(null);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const store = useAuthStore;

  async function tryRefreshToken() {
    const persisted = STORAGE.get();
    if (!persisted.token) return; 
    try {
      const { access_token } = await refresh(); 
      store.getState().setAuth({
        token: access_token,
        role: (persisted.role ?? "client") as Role,
        isActive: persisted.isActive ?? true,
        id: persisted.userId ?? 0,
      });
      console.log("🔁 Token renovado com sucesso.");
    } catch (err) {
      console.warn("❌ Falha ao renovar token:", err);
    }
  }

  useEffect(() => {
    tryRefreshToken();
  }, []);

  useEffect(() => {
    // quando api.ts renovar token, refletir no Zustand
    setTokenUpdateHandler((t) => {
      if (t) {
        store.getState().setAuth({
          token: t,
          role: (localStorage.getItem("role") as any) ?? "client",
          isActive: (localStorage.getItem("is_active") ?? "true") === "true",
          id: Number(localStorage.getItem("user_id") ?? "0"),
        });
      } else {
        // se zerou, desloga localmente
        store.getState().clear();
      }
    });
  }, [store]);

  useEffect(() => {
    const onFocus = () => {
      const persisted = STORAGE.get();
      if (!persisted.token) return;
      store.getState().setAuth({
        token: persisted.token!,
        role: (persisted.role ?? "client") as Role,
        isActive: persisted.isActive ?? true,
        id: persisted.userId ?? 0,
      });
      tryRefreshToken();
    };

    window.addEventListener("focus", onFocus);
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
export const isAdmin = (role: Role | null) => role === "admin" || role === "administrator" || role === "support";


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


