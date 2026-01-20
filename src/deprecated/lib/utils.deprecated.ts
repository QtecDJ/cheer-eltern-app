export function getScoreColor(score: number): string {
  if (score >= 8) return "text-emerald-500";
  if (score >= 6) return "text-green-500";
  if (score >= 4) return "text-yellow-500";
  if (score >= 2) return "text-orange-500";
  return "text-red-500";
}

export function getScoreLabel(score: number): string {
  if (score >= 8) return "Hervorragend";
  if (score >= 6) return "Gut";
  if (score >= 4) return "Befriedigend";
  if (score >= 2) return "Ausbaufähig";
  return "Anfänger";
}
