export default function Loader() {
  return (
    <div className="flex items-center justify-center py-6" role="status" aria-live="polite">
      <div className="h-6 w-6 animate-spin rounded-full border-2 border-secondary border-t-transparent" />
      <span className="ml-3 text-sm text-gray-600">Carregando…</span>
    </div>
  );
}
