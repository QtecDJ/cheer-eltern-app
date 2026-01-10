import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

// Tailwind CSS Klassen zusammenführen
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// Datum formatieren auf Deutsch
export function formatDate(dateString: string): string {
  const date = new Date(dateString);
  return date.toLocaleDateString("de-DE", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

// Kurzes Datum
export function formatDateShort(dateString: string): string {
  const date = new Date(dateString);
  return date.toLocaleDateString("de-DE", {
    day: "numeric",
    month: "short",
  });
}

// Relatives Datum (heute, morgen, etc.)
export function getRelativeDate(dateString: string): string {
  const date = new Date(dateString);
  const today = new Date();
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);

  const dateOnly = new Date(date.getFullYear(), date.getMonth(), date.getDate());
  const todayOnly = new Date(today.getFullYear(), today.getMonth(), today.getDate());
  const tomorrowOnly = new Date(tomorrow.getFullYear(), tomorrow.getMonth(), tomorrow.getDate());

  if (dateOnly.getTime() === todayOnly.getTime()) {
    return "Heute";
  }
  if (dateOnly.getTime() === tomorrowOnly.getTime()) {
    return "Morgen";
  }
  
  const diffTime = dateOnly.getTime() - todayOnly.getTime();
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  
  if (diffDays > 0 && diffDays <= 7) {
    return `In ${diffDays} Tagen`;
  }
  
  return formatDateShort(dateString);
}

// Alter berechnen
export function calculateAge(birthDate: string): number {
  const today = new Date();
  const birth = new Date(birthDate);
  let age = today.getFullYear() - birth.getFullYear();
  const monthDiff = today.getMonth() - birth.getMonth();
  
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
    age--;
  }
  
  return age;
}

// Anwesenheitsquote berechnen
export function calculateAttendanceRate(present: number, total: number): number {
  if (total === 0) return 0;
  return Math.round((present / total) * 100);
}

// Score zu Farbe
export function getScoreColor(score: number): string {
  if (score >= 8) return "text-emerald-500";
  if (score >= 6) return "text-green-500";
  if (score >= 4) return "text-yellow-500";
  if (score >= 2) return "text-orange-500";
  return "text-red-500";
}

// Score zu Label
export function getScoreLabel(score: number): string {
  if (score >= 8) return "Hervorragend";
  if (score >= 6) return "Gut";
  if (score >= 4) return "Befriedigend";
  if (score >= 2) return "Ausbaufähig";
  return "Anfänger";
}
