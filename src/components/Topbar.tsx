type TopbarProps = {
  onOpenSidebar: () => void;
};

export default function Topbar({ onOpenSidebar }: TopbarProps) {
  return (
    <header
      className="sticky top-0 z-30 flex h-12 items-center gap-2 bg-primary/95 px-3 text-white shadow md:hidden"
      aria-label="Barra superior (mobile apenas)"
    >
      {/* Botão hamburger — visível só no mobile */}
      <button
        onClick={onOpenSidebar}
        className="inline-flex items-center justify-center rounded-lg bg-white/10 px-3 py-2 text-white hover:bg-white/20 focus:outline-none focus:ring-2 focus:ring-white/40"
        aria-label="Abrir menu lateral"
      >
        ☰
      </button>
    </header>
  );
}



