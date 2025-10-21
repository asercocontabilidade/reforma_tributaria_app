// src/components/UserFormModal.tsx
import { useState } from "react";
import type { CreateUserPayload, Role } from "../services/UsersService";

type Props = {
  open: boolean;
  onClose: () => void;
  onSubmit: (data: CreateUserPayload) => Promise<void>;
};

const ROLES: Role[] = ["client", "admin", "administrator"];

export default function UserFormModal({ open, onClose, onSubmit }: Props) {
  const [email, setEmail] = useState("");
  const [cnpjCpf, setCnpjCpf] = useState("");
  const [ip, setIp] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [role, setRole] = useState<Role>("client");
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  if (!open) return null;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setErr(null);
    setLoading(true);
    try {
      await onSubmit({
        email,
        cnpj_cpf: cnpjCpf || undefined,
        ip_address: ip || undefined,
        password,
        full_name: fullName || undefined,
        role,
      });
      onClose();
      // limpa
      setEmail(""); setCnpjCpf(""); setIp(""); setPassword(""); setFullName(""); setRole("client");
    } catch (ex: any) {
      setErr(ex?.message || "Falha ao criar usuário");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div className="backdrop" onClick={onClose} />

      {/* Modal */}
      <div className="relative z-10 w-[min(92vw,680px)] rounded-2xl border border-gray-200 bg-white p-6 shadow-xl dark:border-white/10 dark:bg-[#0f0e2f]">
        <div className="mb-4 flex items-center justify-between">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Novo usuário</h3>
          <button
            className="rounded-lg bg-gray-100 px-2 py-1 text-sm hover:bg-gray-200 dark:bg-white/10 dark:text-white dark:hover:bg-white/20"
            onClick={onClose}
          >
            Fechar
          </button>
        </div>

        {err && (
          <div className="mb-3 rounded-lg border border-red-200 bg-red-50 p-2 text-sm text-red-700 dark:border-red-500/40 dark:bg-red-900/20 dark:text-red-200">
            {err}
          </div>
        )}

        <form onSubmit={handleSubmit} className="grid grid-cols-1 gap-3 md:grid-cols-2">
          <div className="md:col-span-1">
            <label className="mb-1 block text-xs font-medium text-gray-600 dark:text-gray-300">Email *</label>
            <input className="input" type="email" required value={email} onChange={e => setEmail(e.target.value)} />
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium text-gray-600 dark:text-gray-300">Senha *</label>
            <input className="input" type="password" required value={password} onChange={e => setPassword(e.target.value)} />
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium text-gray-600 dark:text-gray-300">Nome completo</label>
            <input className="input" value={fullName} onChange={e => setFullName(e.target.value)} />
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium text-gray-600 dark:text-gray-300">CNPJ/CPF</label>
            <input className="input" value={cnpjCpf} onChange={e => setCnpjCpf(e.target.value)} />
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium text-gray-600 dark:text-gray-300">IP address</label>
            <input className="input" value={ip} onChange={e => setIp(e.target.value)} />
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium text-gray-600 dark:text-gray-300">Perfil *</label>
            <select className="input" value={role} onChange={e => setRole(e.target.value as Role)}>
              {ROLES.map(r => <option key={r} value={r}>{r}</option>)}
            </select>
          </div>

          <div className="md:col-span-2 mt-2 flex justify-end gap-2">
            <button type="button" className="btn rounded-lg bg-gray-100 text-gray-800 hover:bg-gray-200 dark:bg-white/10 dark:text-white dark:hover:bg-white/20" onClick={onClose}>
              Cancelar
            </button>
            <button type="submit" disabled={loading} className="btn btn-primary rounded-lg px-4">
              {loading ? "Salvando..." : "Salvar"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
