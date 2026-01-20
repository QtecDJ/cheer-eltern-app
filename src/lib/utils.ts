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
/**
 * @deprecated Candidate for removal/relocation. Kept for compatibility.
 */
/**
 * @deprecated Candidate for removal/relocation. Kept for compatibility.
 */
// `getScoreColor` and `getScoreLabel` moved to
// `src/deprecated/lib/utils.deprecated.ts` and removed to clean up unused exports.
