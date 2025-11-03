// src/pages/SettingsPage.tsx
import { useEffect, useState } from "react";
import { getUserById, updateUserConfig, UserConfig } from "../services/UserConfigService";
import { useAuth } from "../contexts/AuthContext"; // já existente no seu projeto

// Ícones simples
function Eye({ className = "h-5 w-5" }) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8S1 12 1 12z" strokeLinecap="round" strokeLinejoin="round" />
      <circle cx="12" cy="12" r="3" />
    </svg>
  );
}
function EyeOff({ className = "h-5 w-5" }) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M17.94 17.94A10.94 10.94 0 0 1 12 20c-7 0-11-8-11-8a20.76 20.76 0 0 1 5.06-6.94M9.9 4.24A10.94 10.94 0 0 1 12 4c7 0 11 8 11 8a20.76 20.76 0 0 1-3.44 4.52M1 1l22 22" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export default function SettingsPage() {
  const { userId } = useAuth(); // pega o id do contexto
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [ok, setOk] = useState<string | null>(null);

  const [user, setUser] = useState<UserConfig | null>(null);

  // campos editáveis
  const [newFullName, setNewFullName] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [showPass, setShowPass] = useState(false);

  useEffect(() => {
    if (!userId) return;
    (async () => {
      setLoading(true);
      setErr(null);
      setOk(null);
      try {
        const u = await getUserById(userId);
        setUser(u);
        setNewFullName(u.full_name || "");
      } catch (e: any) {
        setErr(e?.message || "Erro ao carregar dados do usuário.");
      } finally {
        setLoading(false);
      }
    })();
  }, [userId]);

  async function onSave(e: React.FormEvent) {
    e.preventDefault();
    setOk(null);
    setErr(null);

    if (!user) return;

    // se nada foi alterado, evita chamada desnecessária
    const changedName = (newFullName || "").trim() !== (user.full_name || "").trim();
    const changedPass = (newPassword || "").trim().length > 0;
    if (!changedName && !changedPass) {
      setOk("Nada para salvar.");
      return;
    }

    // confirmação
    const confirmed = window.confirm("Você deseja alterar essas informações?");
    if (!confirmed) return;

    setLoading(true);
    try {
      await updateUserConfig({
        id: user.id,
        full_name: changedName ? newFullName.trim() : undefined,
        password: changedPass ? newPassword : undefined,
      });

      // atualiza o “user” local para refletir as mudanças
      if (changedName) {
        setUser((u) => (u ? { ...u, full_name: newFullName.trim() } : u));
      }
      setNewPassword(""); // limpa campo de senha
      setOk("Configurações atualizadas com sucesso.");
    } catch (e: any) {
      setErr(e?.message || "Erro ao atualizar configurações.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="p-4 md:p-6">
      <h2 className="mb-4 text-2xl font-semibold text-primary dark:text-white">Configurações</h2>

      {/* Alertas */}
      {err && (
        <div className="mb-4 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700 dark:border-red-500/40 dark:bg-red-900/20 dark:text-red-200">
          {err}
        </div>
      )}
      {ok && (
        <div className="mb-4 rounded-lg border border-green-200 bg-green-50 p-3 text-sm text-green-700 dark:border-green-500/40 dark:bg-green-900/20 dark:text-green-200">
          {ok}
        </div>
      )}

      {loading && (
        <div className="text-sm text-gray-600 dark:text-gray-300">Carregando…</div>
      )}

      {!loading && user && (
        <form onSubmit={onSave} className="grid grid-cols-1 gap-4 md:grid-cols-2">
          {/* Card: Nome completo */}
          <div className="card dark:bg-[#0f0e2f]">
            <div className="mb-3">
              <div className="text-sm font-medium text-gray-700 dark:text-gray-200">Nome atual</div>
              <div className="text-base font-semibold text-gray-900 dark:text-gray-100">{user.full_name || "—"}</div>
            </div>
            <div className="mt-2">
              <label className="mb-1 block text-xs font-medium text-gray-600 dark:text-gray-300">
                Novo nome completo
              </label>
              <input
                className="input"
                value={newFullName}
                onChange={(e) => setNewFullName(e.target.value)}
                placeholder="Digite o novo nome"
              />
            </div>
          </div>

          {/* Card: Senha */}
          <div className="card dark:bg-[#0f0e2f]">
            <div className="mb-3">
              <div className="text-sm font-medium text-gray-700 dark:text-gray-200">Alterar senha</div>
              <div className="text-xs text-gray-500 dark:text-gray-400">
                Escolha uma senha forte.
              </div>
            </div>
            <div className="mt-2">
              <label className="mb-1 block text-xs font-medium text-gray-600 dark:text-gray-300">Nova senha</label>
              <div className="relative">
                <input
                  className="input pr-10"
                  type={showPass ? "text" : "password"}
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="Digite a nova senha"
                />
                <button
                  type="button"
                  onClick={() => setShowPass((s) => !s)}
                  className="absolute right-2 top-1/2 -translate-y-1/2 rounded-md p-1 text-gray-600 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-white/10"
                  aria-label={showPass ? "Ocultar senha" : "Mostrar senha"}
                >
                  {showPass ? <EyeOff /> : <Eye />}
                </button>
              </div>
            </div>
          </div>

          {/* Ações */}
          <div className="col-span-full flex justify-end">
            <button
              type="submit"
              className="btn btn-primary rounded-lg px-4 py-2 text-sm"
              disabled={loading}
            >
              {loading ? "Salvando…" : "Salvar alterações"}
            </button>
          </div>
        </form>
      )}
    </div>
  );
}
