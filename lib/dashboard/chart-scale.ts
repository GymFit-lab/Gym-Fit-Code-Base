/** "Nice" y-axis scale: rounds the max up to 1/2/2.5/5 × 10ⁿ steps so ticks read cleanly. */
export function niceScale(max: number, tickCount = 4) {
  if (!(max > 0)) return { max: 1, ticks: [0, 1] };

  const rawStep = max / tickCount;
  const magnitude = 10 ** Math.floor(Math.log10(rawStep));
  const normalized = rawStep / magnitude;
  const step =
    (normalized <= 1
      ? 1
      : normalized <= 2
        ? 2
        : normalized <= 2.5
          ? 2.5
          : normalized <= 5
            ? 5
            : 10) * magnitude;
  const niceMax = Math.ceil(max / step) * step;
  const ticks = Array.from({ length: Math.round(niceMax / step) + 1 }, (_, i) =>
    Number((i * step).toFixed(6)),
  );

  return { max: niceMax, ticks };
}
