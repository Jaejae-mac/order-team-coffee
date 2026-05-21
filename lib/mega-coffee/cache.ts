/**
 * lib/mega-coffee/cache.ts
 * 서버 인메모리 캐시 (1시간 TTL)
 */
import { ScrapedMenuItem, scrapeMegaCoffeeMenu } from "./scraper";

const TTL_MS = 60 * 60 * 1000;

interface CacheStore {
  items: ScrapedMenuItem[];
  fetchedAt: number;
}

declare global {
  // eslint-disable-next-line no-var
  var __megaCoffeeCache: CacheStore | undefined;
}

export async function getCachedMenu(forceRefresh = false): Promise<{
  items: ScrapedMenuItem[];
  fetchedAt: number;
  fromCache: boolean;
}> {
  const now = Date.now();
  const cached = global.__megaCoffeeCache;

  if (!forceRefresh && cached && now - cached.fetchedAt < TTL_MS) {
    return { items: cached.items, fetchedAt: cached.fetchedAt, fromCache: true };
  }

  const items = await scrapeMegaCoffeeMenu();
  global.__megaCoffeeCache = { items, fetchedAt: Date.now() };

  return { items, fetchedAt: Date.now(), fromCache: false };
}

export function clearCache() {
  global.__megaCoffeeCache = undefined;
}
