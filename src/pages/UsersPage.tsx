// src/pages/UsersPage.tsx
import { useEffect, useMemo, useState } from "react";
import { createUser, fetchUsers, updateUserStatus, type UserRow, type CreateUserPayload } from "../services/UsersService";
import UserFormModal from "../components/UserFormModal";

function StatusBadge({ active }: { active: boolean }) {
  return (
    <span
      className={[
        "inline-flex items-center gap-1 rounded-full px-2 py-1 text-xs font-medium",
        active
          ? "bg-green-100 text-green-700 dark:bg-green-900/20 dark:text-green-300"
          : "bg-red-100 text-red-700 dark:bg-red-900/20 dark:text-red-300",
      ].join(" ")}
    >
      <span
        className={[
          "h-2 w-2 rounded-full",
          active ? "bg-green-500" : "bg-red-500",
        ].join(" ")}
      />
      {active ? "Ativa" : "Bloqueada"}
    </span>
  );
}

export default function UsersPage() {
  const [rows, setRows] = useState<UserRow[]>([]);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [modalOpen, setModalOpen] = useState(false);

  async function load() {
    setLoading(true);
    setErr(null);
    try {
      const data = await fetchUsers();
      setRows(data);
    } catch (e: any) {
      setErr(e?.message || "Falha ao carregar usuários.");
      setRows([]);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, []);

  async function handleCreate(data: CreateUserPayload) {
    await createUser(data);
    await load();
  }

  async function handleToggle(u: UserRow) {
    try {
      await updateUserStatus(u.id, !u.is_active);
      await load();
    } catch (e: any) {
      alert(e?.message || "Falha ao alterar status.");
    }
  }

  const total = rows.length;
  const hasData = total > 0;

  return (
    <div className="p-4 md:p-6">
      <div className="mb-4 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <h2 className="text-2xl font-semibold text-primary dark:text-white">Usuários</h2>
        <button
          className="btn btn-primary rounded-xl px-4 py-2"
          onClick={() => setModalOpen(true)}
        >
          + Novo usuário
        </button>
      </div>

      {err && (
        <div className="mb-4 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700 dark:border-red-500/40 dark:bg-red-900/20 dark:text-red-200">
          {err}
        </div>
      )}

      {loading && (
        <div className="rounded-lg border border-gray-200 p-4 text-sm text-gray-600 dark:border-white/10 dark:text-gray-300">
          Carregando…
        </div>
      )}

      {!loading && !err && !hasData && (
        <div className="rounded-lg border border-gray-200 p-4 text-sm text-gray-600 dark:border-white/10 dark:text-gray-300">
          Nenhum usuário encontrado.
        </div>
      )}

      {!loading && !err && hasData && (
        <div className="overflow-x-auto">
          <table className="min-w-full border-separate border-spacing-y-2">
            <thead>
              <tr className="text-left text-sm text-gray-600 dark:text-gray-300">
                {/* id e ip_address NÃO exibidos */}
                <th className="px-3 py-2">Email</th>
                <th className="px-3 py-2">Nome</th>
                <th className="px-3 py-2">CNPJ/CPF</th>
                <th className="px-3 py-2">Perfil</th>
                <th className="px-3 py-2">Status</th>
                <th className="px-3 py-2">Alterado em</th>
                <th className="px-3 py-2 text-right">Ações</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((u) => (
                <tr key={u.id} className="card dark:bg-[#0f0e2f]">
                  <td className="px-3 py-2">{u.email}</td>
                  <td className="px-3 py-2">{u.full_name || "—"}</td>
                  <td className="px-3 py-2">{u.cnpj_cpf || "—"}</td>
                  <td className="px-3 py-2 capitalize">{u.role}</td>
                  <td className="px-3 py-2">
                    <StatusBadge active={u.is_active} />
                  </td>
                  <td className="px-3 py-2">
                    {u.status_changed_at ? new Date(u.status_changed_at).toLocaleString() : "—"}
                  </td>
                  <td className="px-3 py-2 text-right">
                    <button
                      onClick={() => handleToggle(u)}
                      className={[
                        "btn rounded-lg px-3 py-1.5 text-sm",
                        u.is_active
                          ? "bg-red-100 text-red-700 hover:bg-red-200 dark:bg-red-900/20 dark:text-red-300 dark:hover:bg-red-900/30"
                          : "bg-green-100 text-green-700 hover:bg-green-200 dark:bg-green-900/20 dark:text-green-300 dark:hover:bg-green-900/30",
                      ].join(" ")}
                      title={u.is_active ? "Bloquear conta" : "Ativar conta"}
                    >
                      {u.is_active ? "Bloquear" : "Ativar"}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          <div className="mt-2 text-sm text-gray-600 dark:text-gray-300">
            Total de usuários: <strong>{total}</strong>
          </div>
        </div>
      )}

      <UserFormModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        onSubmit={handleCreate}
      />
    </div>
  );
}
