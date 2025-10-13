type Props = {
  page: number;
  totalPages: number;
  onChange: (page: number) => void;
};

export default function Pagination({ page, totalPages, onChange }: Props) {
  const canPrev = page > 1;
  const canNext = page < totalPages;

  return (
    <div className="mt-4 flex items-center justify-between gap-2">
      <button
        className="btn bg-gray-100 hover:bg-gray-200 dark:bg-white/10 dark:hover:bg-white/20"
        disabled={!canPrev}
        onClick={() => onChange(page - 1)}
      >
        ← Anterior
      </button>

      <span className="text-sm text-gray-600 dark:text-gray-300">
        Página <strong>{page}</strong> de <strong>{totalPages || 1}</strong>
      </span>

      <button
        className="btn bg-gray-100 hover:bg-gray-200 dark:bg-white/10 dark:hover:bg-white/20"
        disabled={!canNext}
        onClick={() => onChange(page + 1)}
      >
        Próxima →
      </button>
    </div>
  );
}
