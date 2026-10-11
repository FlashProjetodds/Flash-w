/**
 * FLASH Platform - Global Error & Object Formatting Utility
 * RÈGLE STRICTE : INTERDICTION ABSOLUE D'AFFICHER [object Object] DANS L'INTERFACE.
 */

export function formatSafeError(error: unknown, fallbackMessage = 'Une erreur est survenue lors du traitement.'): string {
  if (!error) return fallbackMessage;

  if (typeof error === 'string') {
    const trimmed = error.trim();
    if (trimmed === '[object Object]' || trimmed.length === 0) {
      return fallbackMessage;
    }
    return trimmed;
  }

  if (error instanceof Error) {
    if (error.message && error.message.trim() && error.message !== '[object Object]') {
      return error.message;
    }
  }

  if (typeof error === 'object') {
    try {
      const record = error as Record<string, unknown>;
      if (typeof record.message === 'string' && record.message !== '[object Object]') {
        return record.message;
      }
      if (typeof record.error === 'string' && record.error !== '[object Object]') {
        return record.error;
      }
      if (typeof record.description === 'string' && record.description !== '[object Object]') {
        return record.description;
      }
      // If none of the known keys exist, return fallback instead of stringifying an unreadable raw JSON
      return fallbackMessage;
    } catch {
      return fallbackMessage;
    }
  }

  return fallbackMessage;
}

export function safeString(value: unknown, fallback = ''): string {
  if (value === null || value === undefined) return fallback;
  if (typeof value === 'string') {
    return value === '[object Object]' ? fallback : value;
  }
  if (typeof value === 'number' || typeof value === 'boolean') {
    return String(value);
  }
  return fallback;
}

export function formatOdds(odds: number | undefined | null): string {
  if (typeof odds !== 'number' || isNaN(odds) || odds <= 1.0) {
    return '-';
  }
  return odds.toFixed(2);
}

export function formatOddsVariation(variation: number | undefined | null): string {
  if (typeof variation !== 'number' || isNaN(variation) || variation === 0) {
    return '';
  }
  const sign = variation > 0 ? '+' : '';
  return `${sign}${variation.toFixed(2)}`;
}

export function formatCurrency(amount: number | undefined | null, currency = 'FCFA'): string {
  if (typeof amount !== 'number' || isNaN(amount)) {
    return `0 ${currency}`;
  }
  const rounded = Math.round(amount);
  return `${rounded.toLocaleString('fr-FR')} ${currency}`;
}
