/**
 * Seasonal Theme System
 * Passt visuelles Design an Jahreszeiten und deutsche Feiertage an
 * Immer im Cheerleading/Sport-Kontext
 */

export interface SeasonalTheme {
  id: string;
  name: string;
  emoji: string;
  gradient: string;
  accentColor: string;
  bgPattern?: string;
  greeting: string;
  motivationalText: string;
  iconOverlay?: string;
}

/**
 * Prüft ob ein Datum in einem Zeitraum liegt
 */
function isDateInRange(date: Date, startMonth: number, startDay: number, endMonth: number, endDay: number): boolean {
  const month = date.getMonth() + 1; // 0-indexed
  const day = date.getDate();
  
  if (startMonth === endMonth) {
    return month === startMonth && day >= startDay && day <= endDay;
  }
  
  if (startMonth < endMonth) {
    return (month === startMonth && day >= startDay) || 
           (month === endMonth && day <= endDay) ||
           (month > startMonth && month < endMonth);
  } else {
    // Übergang Jahreswechsel (z.B. Dezember-Januar)
    return (month === startMonth && day >= startDay) || 
           (month === endMonth && day <= endDay) ||
           (month > startMonth || month < endMonth);
  }
}

/**
 * Berechnet Ostersonntag nach Gauß-Algorithmus
 */
function getEasterDate(year: number): Date {
  const a = year % 19;
  const b = Math.floor(year / 100);
  const c = year % 100;
  const d = Math.floor(b / 4);
  const e = b % 4;
  const f = Math.floor((b + 8) / 25);
  const g = Math.floor((b - f + 1) / 3);
  const h = (19 * a + b - d - g + 15) % 30;
  const i = Math.floor(c / 4);
  const k = c % 4;
  const l = (32 + 2 * e + 2 * i - h - k) % 7;
  const m = Math.floor((a + 11 * h + 22 * l) / 451);
  const month = Math.floor((h + l - 7 * m + 114) / 31);
  const day = ((h + l - 7 * m + 114) % 31) + 1;
  
  return new Date(year, month - 1, day);
}

/**
 * Ermittelt das aktuelle Theme basierend auf Datum
 */
export function getCurrentSeasonalTheme(): SeasonalTheme {
  const now = new Date();
  const month = now.getMonth() + 1;
  const day = now.getDate();
  const year = now.getFullYear();
  
  // Deutsche Feiertage (Priorität: höchste zuerst)
  
  // Weihnachten (1. Dezember - 6. Januar)
  if (isDateInRange(now, 12, 1, 1, 6)) {
    return {
      id: 'christmas',
      name: 'Weihnachtszeit',
      emoji: '🎄',
      gradient: 'from-red-900 via-green-900 to-red-900',
      accentColor: 'text-red-400',
      greeting: 'Frohe Weihnachten! 🎅',
      motivationalText: 'Mit festlicher Energie ins Training! ✨🎄',
      iconOverlay: '❄️',
    };
  }
  
  // Silvester/Neujahr (27. Dezember - 2. Januar)
  if (isDateInRange(now, 12, 27, 1, 2)) {
    return {
      id: 'newyear',
      name: 'Jahreswechsel',
      emoji: '🎆',
      gradient: 'from-yellow-600 via-orange-600 to-pink-600',
      accentColor: 'text-yellow-300',
      greeting: 'Guten Rutsch! 🎆',
      motivationalText: 'Neue Ziele, neue Erfolge! 🚀',
      iconOverlay: '🎊',
    };
  }
  
  // Ostern (Karfreitag bis Ostermontag +7 Tage = 2 Wochen)
  const easter = getEasterDate(year);
  const easterStart = new Date(easter);
  easterStart.setDate(easterStart.getDate() - 2); // Karfreitag
  const easterEnd = new Date(easter);
  easterEnd.setDate(easterEnd.getDate() + 9); // Ostermontag + 1 Woche
  
  if (now >= easterStart && now <= easterEnd) {
    return {
      id: 'easter',
      name: 'Osterzeit',
      emoji: '🐰',
      gradient: 'from-yellow-400 via-pink-400 to-purple-400',
      accentColor: 'text-pink-400',
      greeting: 'Frohe Ostern! 🐰',
      motivationalText: 'Mit Frühlingsenergie durchstarten! 🌸',
      iconOverlay: '🥚',
    };
  }
  
  // Halloween (20. Oktober - 1. November)
  if (isDateInRange(now, 10, 20, 11, 1)) {
    return {
      id: 'halloween',
      name: 'Halloween',
      emoji: '🎃',
      gradient: 'from-orange-900 via-purple-900 to-orange-900',
      accentColor: 'text-orange-400',
      greeting: 'Happy Halloween! 👻',
      motivationalText: 'Spektakuläre Stunts warten! 🎃✨',
      iconOverlay: '👻',
    };
  }
  
  // Karneval/Fasching (1 Woche vor bis 1 Tag nach Rosenmontag)
  // Rosenmontag ist 48 Tage vor Ostersonntag
  const rosenmontag = new Date(easter);
  rosenmontag.setDate(rosenmontag.getDate() - 48);
  const karnevalStart = new Date(rosenmontag);
  karnevalStart.setDate(karnevalStart.getDate() - 7);
  const karnevalEnd = new Date(rosenmontag);
  karnevalEnd.setDate(karnevalEnd.getDate() + 1);
  
  if (now >= karnevalStart && now <= karnevalEnd) {
    return {
      id: 'carnival',
      name: 'Karneval',
      emoji: '🎭',
      gradient: 'from-purple-600 via-pink-600 to-yellow-600',
      accentColor: 'text-pink-400',
      greeting: 'Helau & Alaaf! 🎭',
      motivationalText: 'Bunt und energiegeladen! 🎉',
      iconOverlay: '🎊',
    };
  }
  
  // Sommer-EM/WM Vibes (wenn gerade EM/WM läuft - kann angepasst werden)
  // Standard: Juni-Juli für Fußball-EM
  if (isDateInRange(now, 6, 10, 7, 15)) {
    return {
      id: 'euro',
      name: 'EM-Stimmung',
      emoji: '⚽',
      gradient: 'from-black via-red-600 to-yellow-600',
      accentColor: 'text-yellow-400',
      greeting: 'Sport verbindet! ⚽',
      motivationalText: 'Zeig dein Können wie die Profis! 🏆',
      iconOverlay: '🇩🇪',
    };
  }
  
  // Jahreszeiten (Fallback)
  
  // Frühling (1. März - 31. Mai)
  if (month >= 3 && month <= 5) {
    return {
      id: 'spring',
      name: 'Frühling',
      emoji: '🌸',
      gradient: 'from-green-400 via-teal-400 to-blue-400',
      accentColor: 'text-green-400',
      greeting: 'Hallo Frühling! 🌸',
      motivationalText: 'Frische Energie für neue Stunts! 🌱',
      iconOverlay: '🦋',
    };
  }
  
  // Sommer (1. Juni - 31. August)
  if (month >= 6 && month <= 8) {
    return {
      id: 'summer',
      name: 'Sommer',
      emoji: '☀️',
      gradient: 'from-yellow-400 via-orange-400 to-red-400',
      accentColor: 'text-yellow-300',
      greeting: 'Sommer Power! ☀️',
      motivationalText: 'Heiße Moves im Sommer-Training! 🔥',
      iconOverlay: '🏖️',
    };
  }
  
  // Herbst (1. September - 30. November)
  if (month >= 9 && month <= 11) {
    return {
      id: 'autumn',
      name: 'Herbst',
      emoji: '🍂',
      gradient: 'from-orange-600 via-red-600 to-amber-700',
      accentColor: 'text-orange-400',
      greeting: 'Herbst-Energie! 🍂',
      motivationalText: 'Stark wie die Herbstwinde! 💪',
      iconOverlay: '🍁',
    };
  }
  
  // Winter (1. Dezember - 28. Februar) - aber nur wenn nicht Weihnachten
  if (month === 12 || month === 1 || month === 2) {
    return {
      id: 'winter',
      name: 'Winter',
      emoji: '❄️',
      gradient: 'from-blue-900 via-cyan-800 to-blue-900',
      accentColor: 'text-blue-300',
      greeting: 'Winter-Training! ❄️',
      motivationalText: 'Cool bleiben, heiß performen! 🧊',
      iconOverlay: '⛄',
    };
  }
  
  // Fallback (sollte nie erreicht werden)
  return {
    id: 'default',
    name: 'Standard',
    emoji: '⭐',
    gradient: 'from-pink-600 via-purple-600 to-pink-600',
    accentColor: 'text-pink-400',
    greeting: 'Willkommen zurück! ⭐',
    motivationalText: 'Gib alles im Training! 💪',
  };
}

/**
 * Hook für einfache Verwendung in Komponenten
 */
export function useSeasonalTheme(): SeasonalTheme {
  return getCurrentSeasonalTheme();
}
