/** Thin progress bar. Pair it with a visible "x of y" label; it adds no text. */
export function ProgressMeter({ done, total }: { done: number; total: number }) {
  const percent = total === 0 ? 0 : Math.round((done / total) * 100);
  return (
    <div
      aria-hidden="true"
      className="h-1.5 overflow-hidden rounded-full bg-brand-soft"
    >
      <div
        className="h-full rounded-full bg-brand"
        style={{ width: `${percent}%` }}
      />
    </div>
  );
}
