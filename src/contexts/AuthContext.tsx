// Auth.tsx (ou onde está seu store/contexto)
import { createContext, useContext, ReactNode, useEffect } from "react";
import { create } from "zustand";

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

const useAuthStore = create<AuthState>((set, get) => ({
  token: localStorage.getItem("access_token"),
  role: (localStorage.getItem("role") as Role) || null,
  isActive: localStorage.getItem("is_active") === "true",
  userId: (() => {
    const v = localStorage.getItem("user_id");
    return v ? Number(v) : null;
  })(),

  setAuth: ({ token, role, isActive, id }) => {
    localStorage.setItem("access_token", token);
    localStorage.setItem("role", role);
    localStorage.setItem("is_active", String(isActive));
    localStorage.setItem("user_id", String(id));
    set({ token, role, isActive, userId: id });
  },

  clear: async () => {
    const { userId, token } = get();

    console.log("TESTEEE: ", userId)
    // tenta desautenticar no backend antes de limpar local
    try {
      if (userId != null) {
        await fetch(`${API_URL}/users/${userId}/authenticated_status`, {
          method: "PATCH",
          headers: {
            "accept": "application/json",
            "Content-Type": "application/json",
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
          },
          body: JSON.stringify({ is_authenticated: false })
        });
      }
    } catch (err) {
      // não bloqueia o logout local se a API falhar
      console.error("Falha ao atualizar status de autenticação:", err);
    } finally {
      // limpeza local SEMPRE acontece
      localStorage.removeItem("access_token");
      localStorage.removeItem("role");
      localStorage.removeItem("is_active");
      localStorage.removeItem("user_id");
      set({ token: null, role: null, isActive: false, userId: null });
    }
  }
}));

const AuthContext = createContext<ReturnType<typeof useAuthStore> | null>(null);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const store = useAuthStore();

  useEffect(() => {
    const onFocus = () => {
      const token = localStorage.getItem("access_token") || null;
      const role = (localStorage.getItem("role") as Role) || null;
      const isActive = localStorage.getItem("is_active") === "true";
      const userIdStr = localStorage.getItem("user_id");
      const userId = userIdStr ? Number(userIdStr) : null;

      // atualiza o estado em microtask para evitar colisões de render
      setTimeout(
        () =>
          store.setAuth({
            token: token || "",
            role: (role || "client") as Role,
            isActive,
            id: userId ?? 0 // se não houver, passa 0; o setAuth guarda mesmo assim
          }),
        0
      );
    };
    window.addEventListener("focus", onFocus);
    return () => window.removeEventListener("focus", onFocus);
  }, [store]);

  return <AuthContext.Provider value={useAuthStore}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx();
};

export const isAdmin = (role: Role | null) => role === "admin" || role === "administrator";

