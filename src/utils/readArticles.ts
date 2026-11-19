export interface ReadableArticleRef {
  id?: string;
  title: string;
  outletName?: string;
}

const STORAGE_KEY_READ_ARTICLES = 'morning_brief_read_articles_v1';
const MAX_STORED_READ_KEYS = 600;

const normalizeText = (value?: string): string =>
  (value || '').trim().replace(/\s+/g, ' ').toLowerCase();

/**
 * Generates stable read-state keys for an article so read status persists across
 * reloads, tone switches, and live news refreshes (even if dynamic IDs change).
 */
export const getArticleReadKeys = (article: ReadableArticleRef): string[] => {
  const keys: string[] = [];
  const cleanId = article.id?.trim();
  if (cleanId) {
    keys.push(`id::${cleanId}`);
  }
  const normalizedTitle = normalizeText(article.title);
  if (normalizedTitle) {
    const normalizedOutlet = normalizeText(article.outletName);
    keys.push(`title::${normalizedOutlet}::${normalizedTitle}`);
  }
  return keys;
};

export const isArticleRead = (
  readKeys: ReadonlySet<string> | undefined,
  article: ReadableArticleRef
): boolean => {
  if (!readKeys || readKeys.size === 0) return false;
  return getArticleReadKeys(article).some((key) => readKeys.has(key));
};

export const addReadArticleKeys = (
  current: ReadonlySet<string>,
  article: ReadableArticleRef
): Set<string> => {
  const keysToAdd = getArticleReadKeys(article);
  if (keysToAdd.length === 0) return current instanceof Set ? current : new Set(current);
  const alreadyHasAll = keysToAdd.every((key) => current.has(key));
  if (alreadyHasAll) return current as Set<string>;

  const next = new Set(current);
  for (const key of keysToAdd) {
    next.add(key);
  }

  if (next.size > MAX_STORED_READ_KEYS) {
    const trimmed = Array.from(next).slice(next.size - MAX_STORED_READ_KEYS);
    return new Set(trimmed);
  }
  return next;
};

export const removeReadArticleKeys = (
  current: ReadonlySet<string>,
  article: ReadableArticleRef
): Set<string> => {
  const keysToRemove = getArticleReadKeys(article);
  if (keysToRemove.length === 0) return current as Set<string>;
  const hasAny = keysToRemove.some((key) => current.has(key));
  if (!hasAny) return current as Set<string>;

  const next = new Set(current);
  for (const key of keysToRemove) {
    next.delete(key);
  }
  return next;
};

export const loadReadArticleKeys = (): Set<string> => {
  if (typeof window === 'undefined') return new Set();
  try {
    const raw = localStorage.getItem(STORAGE_KEY_READ_ARTICLES);
    if (!raw) return new Set();
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed)) {
      return new Set(parsed.filter((item): item is string => typeof item === 'string' && item.length > 0));
    }
  } catch (err) {
    console.warn('Failed to load read articles from localStorage', err);
  }
  return new Set();
};

export const saveReadArticleKeys = (keys: ReadonlySet<string>): void => {
  if (typeof window === 'undefined') return;
  try {
    const serialized = Array.from(keys).slice(-MAX_STORED_READ_KEYS);
    localStorage.setItem(STORAGE_KEY_READ_ARTICLES, JSON.stringify(serialized));
  } catch (err) {
    console.warn('Failed to save read articles to localStorage', err);
  }
};
