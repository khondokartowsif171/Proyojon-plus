import { useState, useEffect, useCallback } from "react";

const WORKER_URL = "https://gold-price-proxy.khondokartowsif171.workers.dev";
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

    const res = await fetch(WORKER_URL);
    if (!res.ok) return null;

    const data = await res.json();
    if (!data.ok) return null;

    const result: LiveGoldPrice = {
      usdPerOz: data.usdPerOz,
      bdtPer24kGram: data.bdtPer24kGram,
      bdtPer22kGram: data.bdtPer22kGram,
      bdtPer18kGram: data.bdtPer18kGram,
      bdtRate: data.bdtRate,
      updatedAt: data.updatedAt,
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
