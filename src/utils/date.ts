/**
 * Utilitaires de date et heure pour EXTRA.
 * Gestion de l'heure locale française (Europe/Paris) et formatage des dates de matchs.
 */

export const FRENCH_TIMEZONE = 'Europe/Paris';

export function getUserTimeZone(): string {
  try {
    return Intl.DateTimeFormat().resolvedOptions().timeZone || FRENCH_TIMEZONE;
  } catch {
    return FRENCH_TIMEZONE;
  }
}

/**
 * Nettoie et met en majuscule la première lettre d'un mot (sans ponctuation résiduelle)
 */
function capitalizeWord(str: string): string {
  if (!str) return '';
  const cleaned = str.replace(/\./g, '').trim();
  if (!cleaned) return '';
  return cleaned.charAt(0).toUpperCase() + cleaned.slice(1);
}

/**
 * Extrait les composantes calendaires (année, mois, jour) en heure locale française (Europe/Paris)
 */
export function getParisDateParts(date: Date): { year: number; month: number; day: number } {
  const parts = new Intl.DateTimeFormat('fr-FR', {
    timeZone: FRENCH_TIMEZONE,
    year: 'numeric',
    month: 'numeric',
    day: 'numeric',
  }).formatToParts(date);

  const year = parseInt(parts.find(p => p.type === 'year')?.value || '0', 10);
  const month = parseInt(parts.find(p => p.type === 'month')?.value || '0', 10);
  const day = parseInt(parts.find(p => p.type === 'day')?.value || '0', 10);

  return { year, month, day };
}

/**
 * Génère la clé de date YYYY-MM-DD en heure locale française
 */
export function getParisDateKey(dateInput: string | Date | number): string {
  try {
    if (!dateInput) return '';
    let parsedInput = dateInput;
    if (typeof dateInput === 'string' && dateInput.includes(' ') && !dateInput.includes('T')) {
      parsedInput = dateInput.replace(' ', 'T');
    }
    const date = typeof parsedInput === 'string' || typeof parsedInput === 'number' ? new Date(parsedInput) : parsedInput;
    if (isNaN(date.getTime())) return '';
    const { year, month, day } = getParisDateParts(date);
    return `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
  } catch {
    return '';
  }
}

/**
 * Formate l'heure d'un match en heure locale française (ex: "20:45", "14:30")
 */
export function formatMatchTimeFrench(dateInput: string | Date | number | null | undefined): string {
  if (!dateInput) return '--:--';
  try {
    const date = typeof dateInput === 'string' || typeof dateInput === 'number' ? new Date(dateInput) : dateInput;
    if (isNaN(date.getTime())) return '--:--';

    return new Intl.DateTimeFormat('fr-FR', {
      timeZone: FRENCH_TIMEZONE,
      hour: '2-digit',
      minute: '2-digit',
      hour12: false,
    }).format(date);
  } catch {
    return '--:--';
  }
}

/**
 * Fonction utilitaire principale :
 * Formate la date d'un match en heure locale française et renvoie le jour :
 * - 'Aujourd\'hui' si le match a lieu aujourd'hui
 * - 'Demain' si le match a lieu demain
 * - 'Lun 12 Oct' pour les autres dates (abréviation jour, numéro du jour, abréviation mois en majuscules initiales)
 */
export function formatMatchDayFrench(dateInput: string | Date | number | null | undefined): string {
  if (!dateInput) return '';
  try {
    const date = typeof dateInput === 'string' || typeof dateInput === 'number' ? new Date(dateInput) : dateInput;
    if (isNaN(date.getTime())) return '';

    const targetParts = getParisDateParts(date);
    const nowParts = getParisDateParts(new Date());

    const targetMidnight = Date.UTC(targetParts.year, targetParts.month - 1, targetParts.day);
    const nowMidnight = Date.UTC(nowParts.year, nowParts.month - 1, nowParts.day);
    const diffDays = Math.round((targetMidnight - nowMidnight) / (24 * 60 * 60 * 1000));

    if (diffDays === 0) {
      return "Aujourd'hui";
    }
    if (diffDays === 1) {
      return 'Demain';
    }
    if (diffDays === -1) {
      return 'Hier';
    }

    // Formatage 'Lun 12 Oct' en heure locale française
    const parts = new Intl.DateTimeFormat('fr-FR', {
      timeZone: FRENCH_TIMEZONE,
      weekday: 'short',
      day: 'numeric',
      month: 'short',
    }).formatToParts(date);

    const rawWeekday = parts.find(p => p.type === 'weekday')?.value || '';
    const rawDay = parts.find(p => p.type === 'day')?.value || '';
    const rawMonth = parts.find(p => p.type === 'month')?.value || '';

    const weekday = capitalizeWord(rawWeekday);
    const day = rawDay.trim();
    const month = capitalizeWord(rawMonth);

    return `${weekday} ${day} ${month}`.trim();
  } catch {
    return '';
  }
}

/**
 * Formate la date et l'heure du match en heure locale française :
 * - "Aujourd'hui · 20:45"
 * - "Demain · 18:00"
 * - "Lun 12 Oct · 21:00"
 */
export function formatMatchDateTimeFrench(dateInput: string | Date | number | null | undefined): string {
  if (!dateInput) return '';
  const dayStr = formatMatchDayFrench(dateInput);
  if (!dayStr) return '';
  const timeStr = formatMatchTimeFrench(dateInput);
  return `${dayStr} · ${timeStr}`;
}

/**
 * Alias rétro-compatible pour l'affichage de l'heure du match
 */
export function formatEventTime(dateInput: string | Date): string {
  return formatMatchTimeFrench(dateInput);
}

/**
 * Alias rétro-compatible pour l'affichage complet de la date et de l'heure
 */
export function formatEventDateTime(dateInput: string | Date): string {
  return formatMatchDateTimeFrench(dateInput);
}

/**
 * Formatage d'une date complète en français pour les reçus de paris et logs admin
 */
export function formatFullDateTime(dateInput: string | Date): string {
  try {
    const date = typeof dateInput === 'string' ? new Date(dateInput) : dateInput;
    if (isNaN(date.getTime())) return '';

    return new Intl.DateTimeFormat('fr-FR', {
      timeZone: FRENCH_TIMEZONE,
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: false,
    }).format(date);
  } catch {
    return '';
  }
}

export function formatCurrency(amount: number | undefined | null, currency = 'FCFA'): string {
  if (typeof amount !== 'number' || isNaN(amount)) {
    return `0 ${currency}`;
  }
  const rounded = Math.round(amount);
  return `${rounded.toLocaleString('fr-FR')} ${currency}`;
}
