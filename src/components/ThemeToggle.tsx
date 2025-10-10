import { useTheme } from "../contexts/ThemeContext";

export default function ThemeToggle() {
  const { theme, toggle } = useTheme();
  const isDark = theme === "dark";

  return (
    <button
      onClick={toggle}
      className="relative inline-flex h-6 w-12 items-center rounded-full bg-white/30 dark:bg-white/20 transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-white/40"
      role="switch"
      aria-checked={isDark}
      aria-label="Alternar tema claro/escuro"
    >
      <span
        className={`absolute left-1 top-1 h-4 w-4 transform rounded-full bg-white shadow transition-transform duration-300 ${
          isDark ? "translate-x-6" : "translate-x-0"
        }`}
      />
      {/* Ícones decorativos */}
      <span className="absolute left-1.5 text-xs text-yellow-300 dark:hidden">☀️</span>
      <span className="absolute right-1.5 text-xs hidden dark:block">🌙</span>
    </button>
  );
}


