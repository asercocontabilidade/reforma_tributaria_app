import { useAuth } from "../contexts/AuthContext";
import { signContract } from "../services/TermsService";

export default function TermsModal({
  open,
  onAccept,
  onReject,
}: {
  open: boolean;
  onAccept: () => void;
  onReject: () => void;
}) {
  if (!open) return null;

  const exampleTerms = `
TERMOS DE USO — ASERCO TRIBUTÁRIO

Conforme LGPD (Lei 13.709/2018), você declara estar ciente:
• Seus dados pessoais serão utilizados exclusivamente para fins de autenticação e uso do sistema;
• Você poderá solicitar a correção ou exclusão de dados pessoais a qualquer momento;
• Suas atividades podem ser registradas para fins de segurança e auditoria.

Ao clicar em "ACEITAR", você concorda com os Termos de Uso.
  `;

  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-[9999]">
      <div className="bg-white dark:bg-[#181726] max-w-2xl w-full p-6 rounded-xl shadow-xl">
        <h2 className="text-xl font-semibold text-gray-800 dark:text-white mb-3">
          Termos de Uso
        </h2>

        <div className="p-3 bg-gray-100 dark:bg-white/10 rounded-lg max-h-[300px] overflow-y-auto text-sm whitespace-pre-line">
          {exampleTerms}
        </div>

        <div className="mt-6 flex justify-end gap-4">
          <button
            onClick={onReject}
            className="px-4 py-2 rounded-lg bg-red-600 text-white hover:bg-red-700"
          >
            Recusar
          </button>

          <button
            onClick={onAccept}
            className="px-4 py-2 rounded-lg bg-green-600 text-white hover:bg-green-700"
          >
            Aceitar e continuar
          </button>
        </div>
      </div>
    </div>
  );
}
