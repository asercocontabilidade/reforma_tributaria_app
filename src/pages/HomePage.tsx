import { useNavigate } from "react-router-dom"; // ⬅️ adicione no topo do arquivo


export default function HomePage() {
  // 🔗 Ajuste o número comercial do WhatsApp se desejar
  const WHATSAPP_LINK =
  "https://wa.me/5599999999999?text=Ol%C3%A1%2C%20gostaria%20de%20saber%20mais%20sobre%20a%20adequa%C3%A7%C3%A3o%20do%20NCM%20%C3%A0%20reforma%20tribut%C3%A1ria.";
  
  // Dentro do componente:
  const navigate = useNavigate();
  
  return (
    <div className="p-6">
      {/* Header */}
      <div className="mb-6">
        <h2 className="mb-2 text-2xl font-semibold text-primary dark:text-white">Home</h2>
        <p className="text-gray-700 dark:text-gray-200 text-justify">
          Bem-vindo! Você está autenticado.
        </p>
      </div>

      {/* Hero / Destaque */}
<section className="relative overflow-hidden rounded-2xl border border-white/10 
  bg-gradient-to-br from-[#1E2A78] via-[#202656] to-[#0F1536] 
  p-6 md:p-8 dark:from-[#1B225E] dark:via-[#1A1F45] dark:to-[#0B0E28]">        <h3 className="text-xl md:text-2xl font-semibold text-white">
          NCM e a Nova Reforma Tributária: o que muda para sua empresa
        </h3>
        <p className="mt-2 text-sm md:text-base text-white/80 max-w-3xl text-justify">
          A classificação correta do <strong>NCM</strong> é a base para o enquadramento de <strong>IBS</strong>, <strong>CBS</strong> e, quando aplicável, do <strong>Imposto Seletivo (IS)</strong>.
          Nosso sistema ajuda você a pesquisar NCM, entender mapeamentos e manter o cadastro de produtos alinhado às novas regras.
        </p>

        <div className="mt-6 flex flex-col sm:flex-row gap-3">
        <button
          onClick={() => navigate("/itens")} // ⬅️ rota da tela de consulta de NCM
          className="inline-flex items-center justify-center rounded-xl px-5 py-3 text-sm font-semibold bg-white text-gray-900 hover:bg-gray-100 transition"
        >
          🔎 Consultar NCM
        </button>

          {/* <a
            href={WHATSAPP_LINK}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center justify-center rounded-xl px-5 py-3 text-sm font-semibold border border-white/30 text-white hover:bg-white/10 transition"
          >
            💬 Fale com o time
          </a> */}
        </div>

        {/* Glow decorativo */}
        <span className="pointer-events-none absolute -top-16 -right-16 h-48 w-48 rounded-full bg-white/10 blur-3xl" />
      </section>

      {/* Cartões informativos */}
      <section className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-6">
        <article className="rounded-2xl border border-gray-200/40 dark:border-white/10 bg-white/70 dark:bg-white/5 p-5">
          <h4 className="text-base font-semibold text-gray-900 dark:text-white">O que é NCM?</h4>
          <p className="mt-2 text-sm text-gray-700 dark:text-gray-300 text-justify">
            A <strong>Nomenclatura Comum do Mercosul (NCM)</strong> identifica mercadorias na
            classificação fiscal. Cada produto possui um código NCM que direciona benefícios,
            exceções e, agora, o enquadramento nos novos tributos.
          </p>
        </article>

        <article className="rounded-2xl border border-gray-200/40 dark:border-white/10 bg-white/70 dark:bg-white/5 p-5">
          <h4 className="text-base font-semibold text-gray-900 dark:text-white">IBS e CBS</h4>
          <p className="mt-2 text-sm text-gray-700 dark:text-gray-300 text-justify">
            <strong>IBS</strong> (imposto sobre bens e serviços) e <strong>CBS</strong> (contribuição sobre bens e serviços)
            substituem parte dos tributos atuais. O <strong>NCM</strong> orienta a alíquota aplicável e
            o tratamento tributário em operações de bens e serviços.
          </p>
        </article>

        <article className="rounded-2xl border border-gray-200/40 dark:border-white/10 bg-white/70 dark:bg-white/5 p-5">
          <h4 className="text-base font-semibold text-gray-900 dark:text-white">Imposto Seletivo (IS)</h4>
          <p className="mt-2 text-sm text-gray-700 dark:text-gray-300 text-justify">
            O <strong>IS</strong> incide sobre bens e serviços com impactos negativos específicos (ex.: externalidades).
            A correta classificação de NCM ajuda a identificar hipóteses de incidência e evitar autuações.
          </p>
        </article>
      </section>

      {/* Importância da adequação */}
      <section className="mt-8 grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="rounded-2xl border border-gray-200/40 dark:border-white/10 bg-white/70 dark:bg-white/5 p-6">
          <h4 className="text-base font-semibold text-gray-900 dark:text-white">Por que adequar agora?</h4>
            <ul className="mt-3 space-y-2 text-sm text-gray-700 dark:text-gray-300 text-justify">
            <li>• <strong>Preços e margens:</strong> alíquotas corretas evitam erosão de margem ou preços errados.</li>
            <li>• <strong>Conformidade:</strong> reduz riscos de autuação e glosas de crédito.</li>
            <li>• <strong>Operação:</strong> cadastros consistentes simplificam a emissão fiscal e o compliance.</li>
            <li>• <strong>Governança:</strong> trilha de auditoria e evidências para fiscalizações.</li>
          </ul>
        </div>

        <div className="rounded-2xl border border-gray-200/40 dark:border-white/10 bg-white/70 dark:bg-white/5 p-6">
          <h4 className="text-base font-semibold text-gray-900 dark:text-white">Como o sistema ajuda</h4>
          <ul className="mt-3 space-y-2 text-sm text-gray-700 dark:text-gray-300 text-justify">
            <li>• Busca por <strong>NCM</strong>, descrição e anexos.</li>
            <li>• Visualização de <strong>alíquotas IBS/CBS</strong> e sinalização de possível <strong>IS</strong>.</li>
            <li>• Histórico e controles para <strong>auditoria</strong>.</li>
            <li>• Integração via <strong>API</strong> com o seu ERP.</li>
          </ul>

          <div className="mt-4 flex flex-wrap gap-3">
            <a
              href="/ncm"
              className="inline-flex items-center justify-center rounded-xl px-4 py-2 text-sm font-semibold bg-white text-gray-900 hover:bg-gray-100 transition"
            >
              🔎 Começar agora
            </a>
            <a
              // href={WHATSAPP_LINK}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center justify-center rounded-xl px-4 py-2 text-sm font-semibold border border-white/30 text-white hover:bg-white/10 transition"
            >
              💬 Falar com especialista
            </a>
          </div>
        </div>
      </section>

      {/* Aviso / Nota de responsabilidade */}
      <section className="mt-8">
        <div className="rounded-2xl border border-amber-200/40 dark:border-amber-300/30 bg-amber-50/60 dark:bg-amber-900/10 p-4">
          <p className="text-xs text-amber-900 dark:text-amber-200 text-justify">
            <strong>Nota:</strong> As regras da reforma podem evoluir conforme regulamentações e atos normativos.
            Utilize as consultas como apoio à decisão e mantenha seus cadastros revisados periodicamente.
          </p>
        </div>
      </section>
    </div>
  );
}


