import { FormEvent, useState } from "react";
import { login } from "../services/AuthService";
import { useAuth } from "../contexts/AuthContext";
import Loader from "../components/Loader";
import { useNavigate, useSearchParams } from "react-router-dom";

export default function LoginPage() {
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const wasBlocked = params.get("blocked") === "1";

  const { setAuth } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPwd, setShowPwd] = useState(false);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState<string | null>(wasBlocked ? "Conta bloqueada. Contate o administrador." : null);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setErr(null);
    setLoading(true);
    try {
      const res = await login(email, password);

      if (!res.is_active) {
        setErr("Conta bloqueada. Contate o administrador.");
        setLoading(false);
        return;
      }

      // ⬇️ PROPAGAR O ID AQUI
      if (typeof res.id !== "number") {
        console.warn("Login: resposta sem id esperado:", res);
        setErr("Não foi possível obter o identificador do usuário.");
        setLoading(false);
        return;
      }

      setAuth({
        token: res.access_token,
        role: res.role as any,
        isActive: res.is_active,
        id: res.id, // <<< essencial
      });

      navigate("/");
    } catch (error: any) {
      setErr(error?.message || "Email ou senha incorretos.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary to-[#0b0a28] p-4 dark:from-[#0b0a28] dark:to-[#050415]">
      <div className="card w-full max-w-md">
        <h2 className="mb-1 text-2xl font-semibold text-primary dark:text-white">Entrar</h2>
        <p className="mb-6 text-sm text-gray-600 dark:text-gray-300">Acesse com suas credenciais</p>

        {err && (
          <div
            className="mb-4 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700 dark:border-red-500/40 dark:bg-red-900/20 dark:text-red-200"
            role="alert"
            aria-live="assertive"
          >
            {err}
          </div>
        )}

        <form onSubmit={onSubmit} className="space-y-4">
          <label className="block">
            <span className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-200">Email</span>
            <input
              type="email"
              className="input"
              placeholder="voce@empresa.com"
              autoComplete="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </label>

          <label className="block">
            <span className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-200">Senha</span>
            <div className="relative">
              <input
                type={showPwd ? "text" : "password"}
                className="input pr-24"
                placeholder="••••••••"
                autoComplete="current-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                minLength={8}
              />
              <button
                type="button"
                onClick={() => setShowPwd((s) => !s)}
                className="absolute right-2 top-1/2 -translate-y-1/2 text-sm text-gray-600 hover:text-gray-900 dark:text-gray-300 dark:hover:text-white"
                aria-label={showPwd ? "Ocultar senha" : "Mostrar senha"}
              >
                {showPwd ? "Ocultar" : "Mostrar"}
              </button>
            </div>
          </label>

          <button type="submit" className="btn btn-primary w-full" disabled={loading}>
            {loading ? "Entrando..." : "Entrar"}
          </button>
        </form>

        {loading && <Loader />}

        <p className="mt-6 text-center text-xs text-gray-500 dark:text-gray-300">
          Dúvidas? Fale com o administrador.
        </p>
      </div>
    </div>
  );
}


