import { ThemeMode } from '../types/news';

export const THEME_STORAGE_KEY = 'morning_brief_theme_v1';
export const PREFS_STORAGE_KEY = 'morning_brief_user_preferences_v2';

export function isValidThemeMode(value: unknown): value is ThemeMode {
  return value === 'light' || value === 'dark' || value === 'system';
}

export function getStoredThemeMode(): ThemeMode {
  if (typeof window === 'undefined') return 'system';
  try {
    const direct = localStorage.getItem(THEME_STORAGE_KEY);
    if (isValidThemeMode(direct)) return direct;

    const rawPrefs = localStorage.getItem(PREFS_STORAGE_KEY);
    if (rawPrefs) {
      const parsed = JSON.parse(rawPrefs);
      if (parsed && isValidThemeMode(parsed.theme)) {
        return parsed.theme;
      }
    }
  } catch (err) {
    console.warn('Failed to read theme from localStorage:', err);
  }
  return 'system';
}

export function resolveTheme(mode: ThemeMode): 'light' | 'dark' {
  if (mode === 'dark') return 'dark';
  if (mode === 'light') return 'light';
  if (typeof window !== 'undefined' && window.matchMedia) {
    return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
  }
  return 'light';
}

export function applyThemeToDocument(mode: ThemeMode): 'light' | 'dark' {
  const resolved = resolveTheme(mode);
  if (typeof document !== 'undefined') {
    const root = document.documentElement;
    root.classList.toggle('dark', resolved === 'dark');
    root.style.colorScheme = resolved;
    root.dataset.themeMode = mode;
  }
  return resolved;
}

export function persistThemeMode(mode: ThemeMode): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(THEME_STORAGE_KEY, mode);
    const rawPrefs = localStorage.getItem(PREFS_STORAGE_KEY);
    if (rawPrefs) {
      const parsed = JSON.parse(rawPrefs);
      if (parsed && typeof parsed === 'object') {
        localStorage.setItem(PREFS_STORAGE_KEY, JSON.stringify({ ...parsed, theme: mode }));
      }
    }
  } catch (err) {
    console.warn('Failed to persist theme to localStorage:', err);
  }
}

export function getThemeLabel(mode: ThemeMode): string {
  switch (mode) {
    case 'light':
      return '라이트 모드';
    case 'dark':
      return '다크 모드';
    case 'system':
    default:
      return '시스템 설정';
  }
}
