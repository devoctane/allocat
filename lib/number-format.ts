export interface CurrencyFormatOptions {
  minimumFractionDigits?: number;
  maximumFractionDigits?: number;
}

const CURRENCY_LOCALE = "en-IN";
const CURRENCY_CODE = "INR";

const currencyFormatterCache = new Map<string, Intl.NumberFormat>();

function getCurrencyFormatter(options: CurrencyFormatOptions = {}) {
  const minimumFractionDigits = options.minimumFractionDigits ?? 0;
  const maximumFractionDigits =
    options.maximumFractionDigits ?? minimumFractionDigits;
  const cacheKey = `${minimumFractionDigits}:${maximumFractionDigits}`;

  let formatter = currencyFormatterCache.get(cacheKey);

  if (!formatter) {
    formatter = new Intl.NumberFormat(CURRENCY_LOCALE, {
      style: "currency",
      currency: CURRENCY_CODE,
      minimumFractionDigits,
      maximumFractionDigits,
    });
    currencyFormatterCache.set(cacheKey, formatter);
  }

  return formatter;
}

export function formatCurrency(
  value: number,
  options: CurrencyFormatOptions = {}
) {
  return getCurrencyFormatter(options).format(value);
}

export function formatCurrencyParts(
  value: number,
  options: CurrencyFormatOptions = {}
) {
  return getCurrencyFormatter(options).formatToParts(value);
}

export function hasNumericText(value: string) {
  return /\d/.test(value);
}
