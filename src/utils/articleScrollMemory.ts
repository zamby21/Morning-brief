import { ReadableArticleRef, getArticleReadKeys } from './readArticles';

const STORAGE_KEY_ARTICLE_SCROLL = 'morning_brief_article_scroll_v1';
const MAX_STORED_SCROLL_ENTRIES = 100;
const SCROLL_TTL_MS = 7 * 24 * 60 * 60 * 1000; // 7 days
const MIN_PERSISTABLE_SCROLL_PX = 40;
const MIN_SCROLLABLE_RANGE_PX = 80;

export interface SavedArticleScrollPosition {
  scrollTop: number;
  scrollRatio: number;
  scrollHeight: number;
  updatedAt: number;
}

type ScrollStorageMap = Record<string, SavedArticleScrollPosition>;

let memoryCache: ScrollStorageMap | null = null;

function readStorageMap(): ScrollStorageMap {
  if (memoryCache) return memoryCache;
  if (typeof window === 'undefined') {
    memoryCache = {};
    return memoryCache;
  }

  try {
    const raw = localStorage.getItem(STORAGE_KEY_ARTICLE_SCROLL);
    if (!raw) {
      memoryCache = {};
      return memoryCache;
    }
    const parsed = JSON.parse(raw);
    if (parsed && typeof parsed === 'object' && !Array.isArray(parsed)) {
      const now = Date.now();
      const cleaned: ScrollStorageMap = {};
      for (const [key, value] of Object.entries(parsed)) {
        if (
          value &&
          typeof value === 'object' &&
          typeof (value as SavedArticleScrollPosition).scrollTop === 'number' &&
          Number.isFinite((value as SavedArticleScrollPosition).scrollTop) &&
          typeof (value as SavedArticleScrollPosition).updatedAt === 'number' &&
          now - (value as SavedArticleScrollPosition).updatedAt < SCROLL_TTL_MS
        ) {
          cleaned[key] = value as SavedArticleScrollPosition;
        }
      }
      memoryCache = cleaned;
      return memoryCache;
    }
  } catch (err) {
    console.warn('Failed to load article scroll positions from localStorage', err);
  }

  memoryCache = {};
  return memoryCache;
}

function flushStorageMap(map: ScrollStorageMap): void {
  const entries = Object.entries(map);
  if (entries.length > MAX_STORED_SCROLL_ENTRIES) {
    entries.sort((a, b) => b[1].updatedAt - a[1].updatedAt);
    const trimmed: ScrollStorageMap = {};
    for (const [k, v] of entries.slice(0, MAX_STORED_SCROLL_ENTRIES)) {
      trimmed[k] = v;
    }
    memoryCache = trimmed;
  } else {
    memoryCache = map;
  }

  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(STORAGE_KEY_ARTICLE_SCROLL, JSON.stringify(memoryCache));
  } catch (err) {
    console.warn('Failed to persist article scroll positions to localStorage', err);
  }
}

function getPrimaryScrollKey(article: ReadableArticleRef): string | null {
  const keys = getArticleReadKeys(article);
  // Prefer stable title+outlet key so scroll memory survives live news refreshes that regenerate IDs
  const titleKey = keys.find((k) => k.startsWith('title::'));
  return titleKey || keys[0] || null;
}

export function loadArticleScrollPosition(
  article: ReadableArticleRef | null | undefined
): SavedArticleScrollPosition | null {
  if (!article) return null;
  const map = readStorageMap();
  const keys = getArticleReadKeys(article);
  const now = Date.now();

  // Prefer title-based match first, then ID-based match
  const orderedKeys = [
    ...keys.filter((k) => k.startsWith('title::')),
    ...keys.filter((k) => !k.startsWith('title::')),
  ];

  for (const key of orderedKeys) {
    const entry = map[key];
    if (entry && now - entry.updatedAt < SCROLL_TTL_MS && entry.scrollTop >= MIN_PERSISTABLE_SCROLL_PX) {
      return entry;
    }
  }
  return null;
}

export function saveArticleScrollPosition(
  article: ReadableArticleRef | null | undefined,
  scrollTop: number,
  scrollHeight: number,
  clientHeight: number
): void {
  if (!article) return;
  const primaryKey = getPrimaryScrollKey(article);
  if (!primaryKey) return;

  const map = readStorageMap();
  const maxScroll = Math.max(0, scrollHeight - clientHeight);

  // Only persist scroll position when article body is genuinely scrollable and user scrolled down;
  // scrolling back to the top clears the saved bookmark so reopening starts at the top cleanly.
  if (maxScroll < MIN_SCROLLABLE_RANGE_PX || scrollTop < MIN_PERSISTABLE_SCROLL_PX) {
    const allKeys = getArticleReadKeys(article);
    let removed = false;
    for (const k of allKeys) {
      if (k in map) {
        delete map[k];
        removed = true;
      }
    }
    if (removed) {
      flushStorageMap(map);
    }
    return;
  }

  const clampedTop = Math.round(Math.min(scrollTop, maxScroll));
  const ratio = maxScroll > 0 ? Math.min(1, Math.max(0, clampedTop / maxScroll)) : 0;

  map[primaryKey] = {
    scrollTop: clampedTop,
    scrollRatio: Number(ratio.toFixed(4)),
    scrollHeight: Math.round(scrollHeight),
    updatedAt: Date.now(),
  };

  flushStorageMap(map);
}

export function clearArticleScrollPosition(
  article: ReadableArticleRef | null | undefined
): void {
  if (!article) return;
  const map = readStorageMap();
  let changed = false;
  for (const key of getArticleReadKeys(article)) {
    if (key in map) {
      delete map[key];
      changed = true;
    }
  }
  if (changed) {
    flushStorageMap(map);
  }
}
