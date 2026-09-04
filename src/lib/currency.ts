/* =========================================================
   Shared currency store — synced with the Header dropdown.
   Mirrors branify.store's currency system: base USD prices,
   per-currency rates, symbol position & en-US formatting.
========================================================= */

import { useEffect, useState, useCallback } from 'react';

export interface CurrencyInfo {
  code: string;
  name: string;
  symbol: string;
  symbolPosition: 'prefix' | 'suffix';
  flag: string;
  countryName: string;
  decimals: number;
  defaultRate: number;
}

/* The 7 currencies offered in the BRANIFY header dropdown,
   with rates/symbols identical to branify.store's table. */
export const SUPPORTED_CURRENCIES: Record<string, CurrencyInfo> = {
  PKR: { code: 'PKR', name: 'Pakistani Rupee', symbol: 'PKR ', symbolPosition: 'prefix', flag: '🇵🇰', countryName: 'Pakistan', decimals: 0, defaultRate: 278.5 },
  USD: { code: 'USD', name: 'US Dollar', symbol: '$', symbolPosition: 'prefix', flag: '🇺🇸', countryName: 'United States', decimals: 0, defaultRate: 1 },
  AED: { code: 'AED', name: 'UAE Dirham', symbol: 'AED ', symbolPosition: 'prefix', flag: '🇦🇪', countryName: 'United Arab Emirates', decimals: 0, defaultRate: 3.67 },
  EUR: { code: 'EUR', name: 'Euro', symbol: '€', symbolPosition: 'prefix', flag: '🇪🇺', countryName: 'European Union', decimals: 0, defaultRate: 0.92 },
  GBP: { code: 'GBP', name: 'British Pound', symbol: '£', symbolPosition: 'prefix', flag: '🇬🇧', countryName: 'United Kingdom', decimals: 0, defaultRate: 0.79 },
  SAR: { code: 'SAR', name: 'Saudi Riyal', symbol: 'SAR ', symbolPosition: 'prefix', flag: '🇸🇦', countryName: 'Saudi Arabia', decimals: 0, defaultRate: 3.75 },
  HKD: { code: 'HKD', name: 'Hong Kong Dollar', symbol: 'HK$', symbolPosition: 'prefix', flag: '🇭🇰', countryName: 'Hong Kong', decimals: 0, defaultRate: 7.8 },
};

export const CURRENCY_LIST: CurrencyInfo[] = Object.values(SUPPORTED_CURRENCIES);

const STORAGE_KEY = 'branify-currency';
const CHANGE_EVENT = 'branify-currency-change';

const isBrowser = typeof window !== 'undefined';

function readStoredCurrency(): string {
  if (!isBrowser) return 'PKR';
  const stored = window.localStorage.getItem(STORAGE_KEY);
  return stored && SUPPORTED_CURRENCIES[stored] ? stored : 'PKR';
}

export function getCurrency(): string {
  return readStoredCurrency();
}

export function setCurrency(code: string): void {
  if (!SUPPORTED_CURRENCIES[code] || !isBrowser) return;
  window.localStorage.setItem(STORAGE_KEY, code);
  window.dispatchEvent(new CustomEvent(CHANGE_EVENT, { detail: code }));
}

/* branify.store's exact price formatter (Lh in the live bundle):
   rates are applied on USD, >=100 values and 0-decimal currencies
   are rounded, symbol prefixed/suffixed, optional " (CODE)" suffix. */
export function formatPrice(usd: number, code: string = readStoredCurrency(), showCode = false): string {
  const info = SUPPORTED_CURRENCIES[code] || SUPPORTED_CURRENCIES.USD;
  const converted = usd * info.defaultRate;
  let formatted: string;
  if (info.decimals === 0 || converted >= 100) {
    formatted = Math.round(converted).toLocaleString('en-US', { maximumFractionDigits: 0 });
  } else {
    formatted = converted.toLocaleString('en-US', { minimumFractionDigits: info.decimals, maximumFractionDigits: info.decimals });
  }
  const withSymbol = info.symbolPosition === 'prefix' ? `${info.symbol}${formatted}` : `${formatted}${info.symbol}`;
  return showCode && code !== 'USD' ? `${withSymbol} (${code})` : withSymbol;
}

/* React hook — any component using it re-renders when the
   currency is changed anywhere in the app (incl. the Header). */
export function useCurrency(): {
  currency: string;
  currencyInfo: CurrencyInfo;
  setCurrencyCode: (code: string) => void;
  format: (usd: number, showCode?: boolean) => string;
} {
  const [currency, setCode] = useState<string>(readStoredCurrency());

  useEffect(() => {
    const onChange = (e: Event) => {
      const detail = (e as CustomEvent<string>).detail;
      if (detail) setCode(detail);
      else setCode(readStoredCurrency());
    };
    window.addEventListener(CHANGE_EVENT, onChange);
    window.addEventListener('storage', onChange);
    return () => {
      window.removeEventListener(CHANGE_EVENT, onChange);
      window.removeEventListener('storage', onChange);
    };
  }, []);

  const setCurrencyCode = useCallback((code: string) => {
    setCurrency(code);
  }, []);

  const format = useCallback((usd: number, showCode = false) => formatPrice(usd, currency, showCode), [currency]);

  return { currency, currencyInfo: SUPPORTED_CURRENCIES[currency] || SUPPORTED_CURRENCIES.USD, setCurrencyCode, format };
}
