'use client';

import { createContext, useContext, useState, useEffect, useCallback } from 'react';

export type Currency = 'INR' | 'USD';

interface CurrencyContextValue {
  currency: Currency;
  setCurrency: (c: Currency) => void;
  convert: (amountInINR: number) => number;
  format: (amountInINR: number) => string;
  formatCompact: (amountInINR: number) => string;
  symbol: string;
  rate: number;
}

// Exchange rate: 1 USD = 83 INR (production would fetch from API)
const EXCHANGE_RATES: Record<Currency, { rate: number; locale: string; symbol: string }> = {
  INR: { rate: 1, locale: 'en-IN', symbol: '\u20B9' },
  USD: { rate: 1 / 83, locale: 'en-US', symbol: '$' },
};

const CurrencyContext = createContext<CurrencyContextValue | null>(null);

export function CurrencyProvider({ children }: { children: React.ReactNode }) {
  const [currency, setCurrencyState] = useState<Currency>('INR');

  useEffect(() => {
    const saved = localStorage.getItem('nimbus-currency') as Currency | null;
    if (saved && (saved === 'INR' || saved === 'USD')) {
      setCurrencyState(saved);
    }
  }, []);

  const setCurrency = useCallback((c: Currency) => {
    setCurrencyState(c);
    localStorage.setItem('nimbus-currency', c);
  }, []);

  const config = EXCHANGE_RATES[currency];

  const convert = useCallback(
    (amountInINR: number) => amountInINR * config.rate,
    [config.rate],
  );

  const format = useCallback(
    (amountInINR: number) => {
      const converted = amountInINR * config.rate;
      return new Intl.NumberFormat(config.locale, {
        style: 'currency',
        currency,
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      }).format(converted);
    },
    [currency, config.locale, config.rate],
  );

  const formatCompact = useCallback(
    (amountInINR: number) => {
      const converted = amountInINR * config.rate;
      return new Intl.NumberFormat(config.locale, {
        style: 'currency',
        currency,
        notation: 'compact',
        minimumFractionDigits: 0,
        maximumFractionDigits: 1,
      }).format(converted);
    },
    [currency, config.locale, config.rate],
  );

  return (
    <CurrencyContext.Provider
      value={{
        currency,
        setCurrency,
        convert,
        format,
        formatCompact,
        symbol: config.symbol,
        rate: config.rate,
      }}
    >
      {children}
    </CurrencyContext.Provider>
  );
}

export function useCurrency() {
  const ctx = useContext(CurrencyContext);
  if (!ctx) throw new Error('useCurrency must be used within CurrencyProvider');
  return ctx;
}
