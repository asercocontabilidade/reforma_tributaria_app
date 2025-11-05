// src/components/UserEditModal.tsx
import { useEffect, useMemo, useState } from "react";
import type { Role, UserRow } from "../services/UsersService";
import { useAuth } from "../contexts/AuthContext"; 

type Props = {
  open: boolean;
  onClose: () => void;
  initial?: UserRow | null;
  onSubmit: (data: { id: number; email: string; full_name: string; cnpj_cpf: string; role: Role }) => Promise<void>;
};

export default function UserEditModal({ open, onClose, initial, onSubmit }: Props) {
  const auth = useAuth();
  const currentRole = auth.role; // papel do usuário logado

  const [form, setForm] = useState({
    id: 0,
    email: "",
    full_name: "",
    cnpj_cpf: "",
    role: "client" as Role,
  });
  const [saving, setSaving] = useState(false);

  // opções permitidas de acordo com o papel do usuário logado
  const allowedRoles: Role[] = useMemo(() => {
    if (currentRole === "administrator") return ["client", "support", "administrator"];
    return ["client", "support"];
  }, [currentRole]);

  useEffect(() => {
    if (open && initial) {
      const initialRole = allowedRoles.includes(initial.role) ? initial.role : allowedRoles[0];
      setForm({
        id: initial.id,
        email: initial.email || "",
        full_name: initial.full_name || "",
        cnpj_cpf: initial.cnpj_cpf || "",
        role: initialRole,
      });
    }
  }, [open, initial, allowedRoles]);

  function onChange<K extends keyof typeof form>(k: K, v: (typeof form)[K]) {
    setForm((f) => ({ ...f, [k]: v }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.id) return;
    setSaving(true);
    try {
      // remove máscara antes de enviar
      const payload = {
        ...form,
        cnpj_cpf: unmaskCPF(form.cnpj_cpf),
      };
      await onSubmit(payload); // envia sem caracteres especiais
      onClose();
    } catch (e: any) {
      alert(e?.message || "Falha ao atualizar usuário.");
    } finally {
      setSaving(false);
    }
  }

  if (!open) return null;

  function formatCPF(value: string) {
    const numeric = value.replace(/\D/g, ""); 
    return numeric
      .replace(/(\d{3})(\d)/, "$1.$2")
      .replace(/(\d{3})(\d)/, "$1.$2")
      .replace(/(\d{3})(\d{1,2})$/, "$1-$2")
      .slice(0, 14); 
  }

  function unmaskCPF(value: string) {
    return value.replace(/\D/g, "");
  }

  // garante valor válido de role
  const roleValue = allowedRoles.includes(form.role) ? form.role : allowedRoles[0];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="backdrop" onClick={onClose} />
      <div className="relative w-full max-w-xl rounded-2xl border border-gray-200 bg-white p-4 shadow-xl dark:border-white/10 dark:bg-[#0f0e2f]">
        <div className="mb-3 flex items-center justify-between">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Editar usuário</h3>
          <button
            onClick={onClose}
            className="rounded-lg bg-gray-100 px-3 py-1.5 text-sm hover:bg-gray-200 dark:bg-white/10 dark:hover:bg-white/20"
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
            <label className="mb-1 block text-xs font-medium text-gray-600 dark:text-gray-300">CPF</label>
            <input
              className="input"
              value={form.cnpj_cpf}
              onChange={(e) => onChange("cnpj_cpf", formatCPF(e.target.value))}
              placeholder="Digite o CPF"
              maxLength={14} // 000.000.000-00
            />
          </div>

          <div className="md:col-span-2">
            <label className="mb-1 block text-xs font-medium text-gray-600 dark:text-gray-300">Perfil</label>
            <select
              className="input"
              value={roleValue}
              onChange={(e) => onChange("role", e.target.value as Role)}
            >
              {allowedRoles.map(r => <option key={r} value={r}>{r}</option>)}
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


