/**
 * ECG ("heartbeat") path generator, shared by the on-page SVG and the OG image.
 * One beat = flat line → P wave → QRS spike → T wave, drawn on a 120-unit-tall canvas
 * with the baseline at y = 60.
 */
export const ECG_BEAT_WIDTH = 300;
export const ECG_HEIGHT = 120;

const BEAT = "h90 l10 -8 l10 8 h30 l8 12 l12 -60 l12 82 l10 -34 h30 q15 -18 30 0 h58";

export function ecgPath(beats: number) {
  return `M0 60 ${Array.from({ length: Math.max(1, beats) }, () => BEAT).join(" ")}`;
}
