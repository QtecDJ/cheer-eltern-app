/**
 * Seasonal Theme System
 * Aktiviert spezielle Themen nur an genauen deutschen Feiertagen
 * Sonst normale App-Ansicht
 */

export interface SeasonalTheme {
  id: string;
  name: string;
  emoji?: string;
  gradient: string;
  accentColor: string;
  greeting: string;
  motivationalText: string;
  iconOverlay?: string;
  isActive: boolean; // Neu: zeigt an ob Theme aktiv ist
  overlayEffect?: 'snow' | 'confetti' | 'sparkles' | 'leaves' | 'hearts';
}

/**
 * Prüft ob ein Datum genau ein bestimmter Tag ist oder in kleinem Zeitraum (±1-2 Tage)
 */
function isNearDate(date: Date, targetMonth: number, targetDay: number, daysBefore: number = 0, daysAfter: number = 0): boolean {
  const targetDate = new Date(date.getFullYear(), targetMonth - 1, targetDay);
  const startDate = new Date(targetDate);
  startDate.setDate(startDate.getDate() - daysBefore);
  const endDate = new Date(targetDate);
  endDate.setDate(endDate.getDate() + daysAfter);
  
  return date >= startDate && date <= endDate;
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
 * Ermittelt das aktuelle Theme basierend auf genauen Feiertagen
 */
export function getCurrentSeasonalTheme(): SeasonalTheme {
  const now = new Date();
  const month = now.getMonth() + 1;
  const day = now.getDate();
  const year = now.getFullYear();
  
  // Standard/Normales Theme (wird zurückgegeben wenn kein Feiertag)
  const defaultTheme: SeasonalTheme = {
    id: 'default',
    name: 'Standard',
    gradient: 'from-background to-muted/30',
    accentColor: 'text-primary',
    greeting: 'Willkommen',
    motivationalText: 'Bereit für dein Training?',
    isActive: false,
  };
  
  // ===== GESETZLICHE FEIERTAGE DEUTSCHLAND =====
  
  // Neujahr (1. Januar ±2 Tage)
  if (isNearDate(now, 1, 1, 2, 2)) {
    return {
      id: 'newyear',
      name: 'Neujahr',
      emoji: '🎆',
      gradient: 'from-yellow-600 via-orange-600 to-pink-600',
      accentColor: 'text-yellow-300',
      greeting: 'Frohes Neues Jahr! 🎆',
      motivationalText: 'Neue Ziele, neue Erfolge! 🚀',
      iconOverlay: '🎊',
      isActive: true,
      overlayEffect: 'confetti',
    };
  }
  
  // Heilige Drei Könige (6. Januar ±1 Tag)
  if (isNearDate(now, 1, 6, 1, 1)) {
    return {
      id: 'epiphany',
      name: 'Heilige Drei Könige',
      emoji: '⭐',
      gradient: 'from-amber-600 via-yellow-500 to-amber-600',
      accentColor: 'text-yellow-400',
      greeting: 'Sternsingerzeit! ⭐',
      motivationalText: 'Mit Glanz ins Training! ✨',
      iconOverlay: '👑',
      isActive: true,
      overlayEffect: 'sparkles',
    };
  }
  
  // Ostern berechnen (für Karneval und Ostern)
  const easter = getEasterDate(year);
  
  // Karneval/Fasching (Rosenmontag ist 48 Tage vor Ostersonntag)
  // Karnevalszeit: 7 Tage vor Rosenmontag bis 1 Tag nach Rosenmontag
  const rosenmontag = new Date(easter);
  rosenmontag.setDate(rosenmontag.getDate() - 48);
  const karnevalStart = new Date(rosenmontag);
  karnevalStart.setDate(karnevalStart.getDate() - 7);
  const karnevalEnd = new Date(rosenmontag);
  karnevalEnd.setDate(karnevalEnd.getDate() + 1); // Aschermittwoch
  
  if (now >= karnevalStart && now <= karnevalEnd) {
    return {
      id: 'carnival',
      name: 'Karneval',
      emoji: '🎭',
      gradient: 'from-purple-600 via-pink-600 to-yellow-600',
      accentColor: 'text-pink-400',
      greeting: 'Helau & Alaaf! 🎭🎉',
      motivationalText: 'Bunt und energiegeladen ins Training! 🎊',
      iconOverlay: '🎊',
      isActive: true,
      overlayEffect: 'confetti',
    };
  }
  
  const karfreitag = new Date(easter);
  karfreitag.setDate(karfreitag.getDate() - 2);
  const ostermontag = new Date(easter);
  ostermontag.setDate(ostermontag.getDate() + 1);
  
  // Karfreitag bis Ostermontag (±1 Tag)
  const easterStart = new Date(karfreitag);
  easterStart.setDate(easterStart.getDate() - 1);
  const easterEnd = new Date(ostermontag);
  easterEnd.setDate(easterEnd.getDate() + 1);
  
  if (now >= easterStart && now <= easterEnd) {
    return {
      id: 'easter',
      name: 'Ostern',
      emoji: '🐰',
      gradient: 'from-yellow-400 via-pink-400 to-purple-400',
      accentColor: 'text-pink-400',
      greeting: 'Frohe Ostern! 🐰🥚',
      motivationalText: 'Mit Frühlingsenergie durchstarten! 🌸',
      iconOverlay: '🥚',
      isActive: true,
      overlayEffect: 'sparkles',
    };
  }
  
  // Tag der Arbeit (1. Mai ±1 Tag)
  if (isNearDate(now, 5, 1, 1, 1)) {
    return {
      id: 'laborday',
      name: 'Tag der Arbeit',
      emoji: '💪',
      gradient: 'from-red-600 via-orange-500 to-yellow-500',
      accentColor: 'text-red-400',
      greeting: 'Tag der Arbeit! 💪',
      motivationalText: 'Teamwork macht uns stark! 🤝',
      iconOverlay: '⚡',
      isActive: true,
    };
  }
  
  // Christi Himmelfahrt (Ostersonntag + 39 Tage ±1)
  const christiHimmelfahrt = new Date(easter);
  christiHimmelfahrt.setDate(christiHimmelfahrt.getDate() + 39);
  const himmelfahrtStart = new Date(christiHimmelfahrt);
  himmelfahrtStart.setDate(himmelfahrtStart.getDate() - 1);
  const himmelfahrtEnd = new Date(christiHimmelfahrt);
  himmelfahrtEnd.setDate(himmelfahrtEnd.getDate() + 1);
  
  if (now >= himmelfahrtStart && now <= himmelfahrtEnd) {
    return {
      id: 'ascension',
      name: 'Christi Himmelfahrt',
      emoji: '☁️',
      gradient: 'from-blue-400 via-cyan-400 to-blue-500',
      accentColor: 'text-blue-300',
      greeting: 'Schönen Vatertag! ☁️',
      motivationalText: 'Hoch hinaus mit neuen Stunts! 🚀',
      iconOverlay: '✨',
      isActive: true,
    };
  }
  
  // Pfingsten (Ostersonntag + 49/50 Tage ±1)
  const pfingstsonntag = new Date(easter);
  pfingstsonntag.setDate(pfingstsonntag.getDate() + 49);
  const pfingstmontag = new Date(easter);
  pfingstmontag.setDate(pfingstmontag.getDate() + 50);
  const pfingstenStart = new Date(pfingstsonntag);
  pfingstenStart.setDate(pfingstenStart.getDate() - 1);
  const pfingstenEnd = new Date(pfingstmontag);
  pfingstenEnd.setDate(pfingstenEnd.getDate() + 1);
  
  if (now >= pfingstenStart && now <= pfingstenEnd) {
    return {
      id: 'pentecost',
      name: 'Pfingsten',
      emoji: '🕊️',
      gradient: 'from-green-400 via-emerald-400 to-teal-400',
      accentColor: 'text-green-300',
      greeting: 'Frohe Pfingsten! 🕊️',
      motivationalText: 'Frische Energie fürs Training! 🌿',
      iconOverlay: '🌸',
      isActive: true,
      overlayEffect: 'sparkles',
    };
  }
  
  // Tag der Deutschen Einheit (3. Oktober ±1)
  if (isNearDate(now, 10, 3, 1, 1)) {
    return {
      id: 'unification',
      name: 'Tag der Deutschen Einheit',
      emoji: '🇩🇪',
      gradient: 'from-black via-red-600 to-yellow-500',
      accentColor: 'text-yellow-400',
      greeting: 'Tag der Einheit! 🇩🇪',
      motivationalText: 'Gemeinsam sind wir stark! 💪',
      iconOverlay: '🦅',
      isActive: true,
      overlayEffect: 'confetti',
    };
  }
  
  // Halloween (31. Oktober ±2 Tage)
  if (isNearDate(now, 10, 31, 2, 2)) {
    return {
      id: 'halloween',
      name: 'Halloween',
      emoji: '🎃',
      gradient: 'from-orange-900 via-purple-900 to-orange-900',
      accentColor: 'text-orange-400',
      greeting: 'Happy Halloween! 🎃👻',
      motivationalText: 'Spektakuläre Stunts warten! ✨',
      iconOverlay: '👻',
      isActive: true,
      overlayEffect: 'sparkles',
    };
  }
  
  // Allerheiligen (1. November ±1)
  if (isNearDate(now, 11, 1, 1, 1)) {
    return {
      id: 'allsaints',
      name: 'Allerheiligen',
      emoji: '🕯️',
      gradient: 'from-purple-900 via-indigo-900 to-purple-900',
      accentColor: 'text-purple-300',
      greeting: 'Allerheiligen 🕯️',
      motivationalText: 'Mit Ruhe und Kraft ins Training',
      iconOverlay: '✨',
      isActive: true,
    };
  }
  
  // Advent & Nikolaus (6. Dezember ±2)
  if (isNearDate(now, 12, 6, 2, 2)) {
    return {
      id: 'nikolaus',
      name: 'Nikolaus',
      emoji: '🎅',
      gradient: 'from-red-800 via-red-600 to-red-800',
      accentColor: 'text-red-300',
      greeting: 'Frohen Nikolaus! 🎅',
      motivationalText: 'Ho ho ho - Training ruft! 🎁',
      iconOverlay: '🎁',
      isActive: true,
      overlayEffect: 'snow',
    };
  }
  
  // Weihnachten (24.-26. Dezember ±2 Tage)
  if (isNearDate(now, 12, 24, 2, 0) || isNearDate(now, 12, 25, 0, 2) || isNearDate(now, 12, 26, 0, 2)) {
    return {
      id: 'christmas',
      name: 'Weihnachten',
      emoji: '🎄',
      gradient: 'from-red-900 via-green-900 to-red-900',
      accentColor: 'text-red-400',
      greeting: 'Frohe Weihnachten! 🎄✨',
      motivationalText: 'Mit festlicher Energie ins Training! 🎅',
      iconOverlay: '❄️',
      isActive: true,
      overlayEffect: 'snow',
    };
  }
  
  // Silvester (31. Dezember ±1)
  if (isNearDate(now, 12, 31, 1, 0)) {
    return {
      id: 'silvester',
      name: 'Silvester',
      emoji: '🎆',
      gradient: 'from-purple-900 via-pink-700 to-yellow-600',
      accentColor: 'text-yellow-300',
      greeting: 'Guten Rutsch! 🎆🎊',
      motivationalText: 'Feuerwerk der Stunts! 🚀',
      iconOverlay: '🎇',
      isActive: true,
      overlayEffect: 'confetti',
    };
  }
  
  // Kein aktiver Feiertag - normale App
  return defaultTheme;
}

/**
 * Hook für einfache Verwendung in Komponenten
 */
export function useSeasonalTheme(): SeasonalTheme {
  return getCurrentSeasonalTheme();
}
