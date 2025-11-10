// utils/date.ts
export function formatISODateOnly(iso?: string | null) {
  if (!iso) return "—";
  // pega só a parte YYYY-MM-DD para não “andar” com o fuso
  const s = String(iso);
  const ymd = s.length >= 10 ? s.slice(0, 10) : s;
  const [y, m, d] = ymd.split("-");
  if (!y || !m || !d) return "—";
  return `${d.padStart(2, "0")}/${m.padStart(2, "0")}/${y}`;
}
