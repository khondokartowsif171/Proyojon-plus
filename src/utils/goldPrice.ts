import { useState, useEffect, useCallback } from "react";

const CACHE_KEY = "gp_live_cache";
const CACHE_TTL = 15 * 60 * 1000;

export interface LiveGoldPrice {
  usdPerOz: number;
  bdtPer24kGram: number;
  bdtPer22kGram: number;
  bdtPer18kGram: number;
  bdtRate: number;
  updatedAt: string;
}

async function fetchLiveGoldPrice(): Promise<LiveGoldPrice | null> {
  try {
    const cached = localStorage.getItem(CACHE_KEY);
    if (cached) {
      const { data, ts } = JSON.parse(cached);
      if (Date.now() - ts < CACHE_TTL) return data as LiveGoldPrice;
    }

    const [goldRes, rateRes] = await Promise.all([
      fetch("https://data-asg.goldprice.org/dbXRates/USD"),
      fetch("https://open.er-api.com/v6/latest/USD"),
    ]);

    if (!goldRes.ok || !rateRes.ok) return null;

    const goldData = await goldRes.json();
    const rateData = await rateRes.json();

    const usdPerOz: number = goldData.items[0].xauPrice;
    const bdtRate: number = rateData.rates.BDT;
    const bdtPerGram24k = (usdPerOz / 31.1035) * bdtRate;

    const result: LiveGoldPrice = {
      usdPerOz,
      bdtPer24kGram: Math.round(bdtPerGram24k),
      bdtPer22kGram: Math.round(bdtPerGram24k * 0.916),
      bdtPer18kGram: Math.round(bdtPerGram24k * 0.75),
      bdtRate: Math.round(bdtRate),
      updatedAt: new Date().toISOString(),
    };

    localStorage.setItem(CACHE_KEY, JSON.stringify({ data: result, ts: Date.now() }));
    return result;
  } catch {
    return null;
  }
}

export function minutesAgo(iso: string): string {
  const mins = Math.floor((Date.now() - new Date(iso).getTime()) / 60000);
  if (mins < 1) return "এইমাত্র";
  if (mins === 1) return "১ মিনিট আগে";
  return `${mins} মিনিট আগে`;
}

export function useLiveGoldPrice() {
  const [price, setPrice] = useState<LiveGoldPrice | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  const load = useCallback(async (forceRefresh = false) => {
    setLoading(true);
    setError(false);
    if (forceRefresh) localStorage.removeItem(CACHE_KEY);
    const result = await fetchLiveGoldPrice();
    setPrice(result);
    setError(result === null);
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  return { price, loading, error, refresh: () => load(true) };
}
