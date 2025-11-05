// src/components/UserEditModal.tsx
import { useEffect, useState } from "react";
import type { Role, UserRow } from "../services/UsersService";

type Props = {
  open: boolean;
  onClose: () => void;
  initial?: UserRow | null;
  onSubmit: (data: { id: number; email: string; full_name: string; cnpj_cpf: string; role: Role }) => Promise<void>;
};

export default function UserEditModal({ open, onClose, initial, onSubmit }: Props) {
  const [form, setForm] = useState({
    id: 0,
    email: "",
    full_name: "",
    cnpj_cpf: "",
    role: "client" as Role,
  });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (open && initial) {
      setForm({
        id: initial.id,
        email: initial.email || "",
        full_name: initial.full_name || "",
        cnpj_cpf: initial.cnpj_cpf || "",
        role: initial.role,
      });
    }
  }, [open, initial]);

  function onChange<K extends keyof typeof form>(k: K, v: (typeof form)[K]) {
    setForm((f) => ({ ...f, [k]: v }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.id) return;
    setSaving(true);
    try {
      await onSubmit(form);
      onClose();
    } catch (e: any) {
      alert(e?.message || "Falha ao atualizar usuário.");
    } finally {
      setSaving(false);
    }
  }

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="backdrop" onClick={onClose} />
      <div className="relative w-full max-w-xl rounded-2xl border border-gray-200 bg-white p-4 shadow-xl dark:border-white/10 dark:bg-[#0f0e2f]">
        <div className="mb-3 flex items-center justify-between">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Editar usuário</h3>
          <button
            onClick={onClose}
            className="rounded-lg bg-gray-100 px-3 py-1.5 text-sm hover:bg-gray-200 dark:bg-white/10 dark:hover:bg:white/20"
            aria-label="Fechar"
          >
            ✕
          </button>
        </div>

        <form onSubmit={handleSubmit} className="grid grid-cols-1 gap-3 md:grid-cols-2">
          <div className="md:col-span-2">
            <label className="mb-1 block text-xs font-medium text-gray-600 dark:text-gray-300">Email</label>
            <input
              className="input"
              value={form.email}
              onChange={(e) => onChange("email", e.target.value)}
            />
          </div>

          <div>
            <label className="mb-1 block text-xs font-medium text-gray-600 dark:text-gray-300">Nome completo</label>
            <input
              className="input"
              value={form.full_name}
              onChange={(e) => onChange("full_name", e.target.value)}
            />
          </div>

          <div>
            <label className="mb-1 block text-xs font-medium text-gray-600 dark:text-gray-300">CNPJ/CPF</label>
            <input
              className="input"
              value={form.cnpj_cpf}
              onChange={(e) => onChange("cnpj_cpf", e.target.value)}
            />
          </div>

          <div className="md:col-span-2">
            <label className="mb-1 block text-xs font-medium text-gray-600 dark:text-gray-300">Perfil</label>
            <select
              className="input"
              value={form.role}
              onChange={(e) => onChange("role", e.target.value as Role)}
            >
              <option value="client">Client</option>
              <option value="admin">Admin</option>
              <option value="administrator">Administrator</option>
            </select>
          </div>

          <div className="md:col-span-2 mt-2 flex justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="rounded-lg px-3 py-2 text-sm text-gray-700 hover:bg-gray-100 dark:text-gray-200 dark:hover:bg-white/10"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={saving}
              className="btn btn-primary rounded-lg px-4 py-2 text-sm"
            >
              {saving ? "Salvando…" : "Salvar"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

