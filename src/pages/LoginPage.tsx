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
  const [err, setErr] = useState<string | null>(
    wasBlocked ? "Conta bloqueada. Contate o administrador." : null
  );

  const [showInfo, setShowInfo] = useState(false); // controla expansão

  // 🔗 Ajuste o número comercial do WhatsApp
  const WHATSAPP_LINK =
    "https://wa.me/5599999999999?text=Ol%C3%A1%2C%20tenho%20interesse%20em%20me%20cadastrar%20no%20sistema%20de%20consulta%20de%20NCM.";

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
        id: res.id,
      });

      navigate("/");
    } catch (error: any) {
      setErr(error?.message || "Email ou senha incorretos.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="relative min-h-screen bg-login flex flex-col items-center justify-center p-4 transition-all duration-300">
      <div
        className={`w-full max-w-5xl transition-all duration-500 ${
          showInfo ? "grid md:grid-cols-2 gap-8" : "flex justify-center"
        }`}
      >
        {/* Painel de Login */}
        <div
          className={`card transition-all duration-500 ${
            showInfo
              ? "w-full md:max-w-none"
              : "w-full max-w-md"
          }`}
        >
          <h2 className="mb-1 text-2xl font-semibold text-primary dark:text-white text-center">
            Aserco Tributário
          </h2>
          <p className="mb-6 text-sm text-gray-600 dark:text-gray-300 text-center">
            Acesse o nosso sistema com suas credenciais
          </p>

          {err && (
            <div
              className="mb-4 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700 dark:border-red-500/40 dark:bg-red-900/20 dark:text-red-200"
              role="alert"
            >
              {err}
            </div>
          )}

          <form onSubmit={onSubmit} className="space-y-4">
            <label className="block">
              <span className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-200">
                Email
              </span>
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
              <span className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-200">
                Senha
              </span>
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

            <button
              type="submit"
              className="btn btn-primary w-full"
              disabled={loading}
            >
              {loading ? "Entrando..." : "Entrar"}
            </button>
          </form>

          {loading && <Loader />}

          <div className="mt-6 flex flex-col items-center gap-3">
            <button
              type="button"
              onClick={() => setShowInfo((v) => !v)}
              className="relative inline-flex items-center justify-center gap-2 px-4 py-3 text-sm font-semibold bg-transparent transition-transform duration-300 hover:scale-105 focus:outline-none"
              aria-expanded={showInfo}
              aria-controls="painel-informativo"
            >
              <span
                className="bg-gradient-to-r from-[#2563eb] via-[#7c3aed] to-[#0ea5e9] bg-clip-text text-transparent animate-gradient-x font-semibold tracking-wide"
              >
                {showInfo ? "Ocultar informações" : "Mostrar informações sobre o sistema"}
              </span>
              <span
                aria-hidden
                className="bg-gradient-to-r from-[#2563eb] via-[#7c3aed] to-[#0ea5e9] bg-clip-text text-transparent animate-gradient-x"
              >
                {showInfo ? "▲" : "▼"}
              </span>
            </button>

            <style>{`
              @keyframes gradient-x {
                0%, 100% { background-position: 0% 50%; }
                50% { background-position: 100% 50%; }
              }
              .animate-gradient-x {
                background-size: 200% 200%;
                animation: gradient-x 5s ease infinite;
              }
            `}</style>

            <style>{`
              @keyframes gradient-x {
                0%, 100% { background-position: 0% 50%; }
                50% { background-position: 100% 50%; }
              }
              .animate-gradient-x {
                background-size: 200% 200%;
                animation: gradient-x 5s ease infinite;
              }
            `}</style>

            {/* <p className="text-xs text-gray-500 dark:text-gray-300 text-center">
              Dúvidas? Fale com o administrador.
            </p> */}
          </div>
        </div>

        {/* Painel Informativo */}
        {showInfo && (
          <aside
            id="painel-informativo"
            className="w-full h-full transition-all duration-500 animate-[fadeIn_.3s_ease-out]"
          >
            <div className="rounded-2xl border border-white/10 bg-white/10 backdrop-blur-md dark:bg-white/5 p-6 md:p-8 text-white shadow-xl h-full flex flex-col">
              <header className="mb-4">
                <span className="inline-flex items-center rounded-full px-3 py-1 text-xs font-medium bg-white/20">
                  Nova Reforma Tributária
                </span>
                <h3 className="mt-3 text-xl md:text-2xl font-semibold">
                  Consulta de NCM para IBS/CBS
                </h3>
                <p className="mt-2 text-sm text-white/80 leading-relaxed">
                  Nosso sistema ajuda você a identificar enquadramentos de NCM
                  na reforma tributária, com visão consolidada para tomada de
                  decisão e conferências fiscais.
                </p>
              </header>

              <ul className="mt-4 space-y-3 text-sm text-white/90">
                <li className="flex gap-3">
                  <span aria-hidden>🔎</span>
                  <div>
                    <p className="font-medium">Busca inteligente por NCM</p>
                    <p className="text-white/80">
                      Pesquise por NCM, descrição e anexos.
                    </p>
                  </div>
                </li>
                <li className="flex gap-3">
                  <span aria-hidden>📊</span>
                  <div>
                    <p className="font-medium">Mapeamento para IBS/CBS</p>
                    <p className="text-white/80">
                      Visualize percentuais e classificações.
                    </p>
                  </div>
                </li>
                <li className="flex gap-3">
                  <span aria-hidden>🧾</span>
                  <div>
                    <p className="font-medium">Evidências e auditoria</p>
                    <p className="text-white/80">
                      Histórico e trilha de conferências.
                    </p>
                  </div>
                </li>
                <li style={{paddingBottom: 8}} className="flex gap-3">
                  <span aria-hidden>⚙️</span>
                  <div>
                    <p className="font-medium">Integração simples</p>
                    <p className="text-white/80">
                      API preparada para seu ERP.
                    </p>
                  </div>
                </li>
              </ul>

              <div className="mt-6 md:mt-auto">
                <a
                  href={WHATSAPP_LINK}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full inline-flex items-center justify-center gap-2 rounded-xl px-4 py-3 text-sm font-semibold bg-green-500 hover:bg-green-600 active:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-400 transition"
                  aria-label="Fale conosco no WhatsApp para cadastro"
                >
                  <span>💬 Fale conosco no WhatsApp</span>
                </a>
                <p className="mt-3 text-xs text-white/70">
                  Precisa testar antes? Fale com nosso time comercial e solicite
                  seu cadastro.
                </p>
              </div>
            </div>
          </aside>
        )}
      </div>

      <footer className="w-full px-6 text-center mt-10 md:mt-0 md:absolute md:bottom-8">
        <p className="text-[11px] sm:text-xs md:text-sm text-white font-medium leading-relaxed max-w-5xl mx-auto opacity-80">
        {/* <p className="text-[11px] sm:text-xs md:text-sm text-white font-medium leading-relaxed max-w-5xl mx-auto opacity-90">  */}

        {/* <p className="text-[11px] sm:text-xs md:text-sm text-gray-500 dark:text-gray-400 font-medium leading-relaxed max-w-5xl mx-auto opacity-80">  */}
          Este sistema e seu conteúdo são de propriedade exclusiva da{" "}
          <span className="font-semibold">Aserco Contabilidade</span>. É vedada
          qualquer forma de acesso, reprodução, distribuição ou uso por terceiros
          sem autorização prévia e expressa da empresa, sob pena de responsabilidade
          civil e penal.
        </p>
      </footer>

      <style>{`
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(6px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </div>
  );
}





