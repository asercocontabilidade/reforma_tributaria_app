export default function ChatGptPage() {
  return (
    <div className="p-6 flex flex-col items-center justify-center min-h-screen text-center">
      {/* Ícone do robô em destaque */}
      <div className="mb-6">
        <svg
          className="w-24 h-24 text-blue-400 animate-[glow_3s_ease-in-out_infinite]"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <rect x="3" y="8" width="18" height="12" rx="2" className="stroke-current" />
          <path d="M12 2v4" className="stroke-current" />
          <circle cx="8" cy="14" r="2" className="fill-current text-blue-400 animate-[blink_4s_infinite]" />
          <circle cx="16" cy="14" r="2" className="fill-current text-blue-400 animate-[blink_4s_infinite_delay]" />

          <style>{`
            @keyframes glow {
              0%, 100% { filter: drop-shadow(0 0 2px rgba(96,165,250,0.4)); }
              50% { filter: drop-shadow(0 0 10px rgba(96,165,250,0.9)); }
            }

            @keyframes blink {
              0%, 90%, 100% { transform: scaleY(1); opacity: 1; }
              92%, 98% { transform: scaleY(0.1); opacity: 0.5; }
            }

            .animate-[blink_4s_infinite_delay] {
              animation: blink 4s infinite 2s;
            }
          `}</style>
        </svg>
      </div>

      <h1 className="text-2xl font-semibold mb-3 text-primary dark:text-blue-400">
        Integração com ChatGPT 🤖
      </h1>
      <p className="text-gray-600 dark:text-gray-300 max-w-md">
        Essa é a nova área de inteligência artificial integrada ao sistema.  
        Aqui você poderá conversar com o ChatGPT para consultas fiscais,  
        dúvidas sobre NCM e apoio tributário automatizado.
      </p>
    </div>
  );
}

