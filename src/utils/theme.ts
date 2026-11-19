import { ThemeMode } from '../types/news';

export const THEME_STORAGE_KEY = 'morning_brief_theme_v1';
export const PREFS_STORAGE_KEY = 'morning_brief_user_preferences_v2';
export const SUN_COORDS_STORAGE_KEY = 'morning_brief_sun_coords_v1';
export const SUN_CACHE_STORAGE_KEY = 'morning_brief_sun_cache_v1';

export interface SunCoordinates {
  lat: number;
  lng: number;
  label: string;
  isCustom: boolean;
}

export interface SunScheduleInfo {
  sunrise: Date;
  sunset: Date;
  sunriseText: string;
  sunsetText: string;
  isDaytime: boolean;
  resolvedTheme: 'light' | 'dark';
  nextTransitionTime: Date;
  nextTransitionType: 'sunrise' | 'sunset';
  nextTransitionTheme: 'light' | 'dark';
  coords: SunCoordinates;
}

export const DEFAULT_SEOUL_COORDS: SunCoordinates = {
  lat: 37.5665,
  lng: 126.978,
  label: '서울 기준',
  isCustom: false,
};

const DEG2RAD = Math.PI / 180;
const RAD2DEG = 180 / Math.PI;

function normalizeDegrees(deg: number): number {
  let d = deg % 360;
  if (d < 0) d += 360;
  return d;
}

/**
 * Standard NOAA solar sunrise/sunset algorithm (accurate within ~1-2 minutes).
 * Computes exact UTC timestamps for sunrise and sunset on the local calendar date of `date`.
 */
function calculateSolarEventUtc(
  year: number,
  month: number, // 1-12
  day: number,   // 1-31
  lat: number,
  lng: number,
  isSunrise: boolean
): Date | null {
  const n1 = Math.floor((275 * month) / 9);
  const n2 = Math.floor((month + 9) / 12);
  const n3 = 1 + Math.floor((year - 4 * Math.floor(year / 4) + 2) / 3);
  const dayOfYear = n1 - n2 * n3 + day - 30;

  const lngHour = lng / 15;
  const t = dayOfYear + ((isSunrise ? 6 : 18) - lngHour) / 24;

  // Sun's mean anomaly
  const M = 0.9856 * t - 3.289;

  // Sun's true longitude
  const L = normalizeDegrees(
    M + 1.916 * Math.sin(M * DEG2RAD) + 0.02 * Math.sin(2 * M * DEG2RAD) + 282.634
  );

  // Sun's right ascension
  let RA = normalizeDegrees(Math.atan(0.91764 * Math.tan(L * DEG2RAD)) * RAD2DEG);
  const Lquadrant = Math.floor(L / 90) * 90;
  const RAquadrant = Math.floor(RA / 90) * 90;
  RA = (RA + (Lquadrant - RAquadrant)) / 15;

  // Sun's declination
  const sinDec = 0.39782 * Math.sin(L * DEG2RAD);
  const cosDec = Math.cos(Math.asin(sinDec));

  // Official zenith = 90.833 degrees (accounts for atmospheric refraction & solar disc)
  const zenith = 90.833;
  const cosH =
    (Math.cos(zenith * DEG2RAD) - sinDec * Math.sin(lat * DEG2RAD)) /
    (cosDec * Math.cos(lat * DEG2RAD));

  if (cosH > 1 || cosH < -1) {
    return null; // Polar night / midnight sun
  }

  const H =
    (isSunrise
      ? 360 - Math.acos(cosH) * RAD2DEG
      : Math.acos(cosH) * RAD2DEG) / 15;

  // Local mean time of rising/setting
  const T = H + RA - 0.06571 * t - 6.622;

  // Adjust back to UTC hours [0, 24)
  let UT = (T - lngHour) % 24;
  if (UT < 0) UT += 24;

  // Anchor UTC date cleanly relative to local calendar day & longitude
  const utcDayMidnight = Date.UTC(year, month - 1, day, 0, 0, 0, 0);
  // Estimate approximate local solar offset from longitude to prevent UTC date wrap errors
  const approxOffsetHours = Math.round(lng / 15);
  let eventMs = utcDayMidnight + UT * 3600 * 1000;
  const localNoonMs = utcDayMidnight + (12 - approxOffsetHours) * 3600 * 1000;
  if (isSunrise && eventMs > localNoonMs) {
    eventMs -= 24 * 3600 * 1000;
  } else if (!isSunrise && eventMs < localNoonMs) {
    eventMs += 24 * 3600 * 1000;
  }

  return new Date(eventMs);
}

export function formatTimeHHMM(date: Date): string {
  const h = String(date.getHours()).padStart(2, '0');
  const m = String(date.getMinutes()).padStart(2, '0');
  return `${h}:${m}`;
}

export function getStoredSunCoords(): SunCoordinates {
  if (typeof window === 'undefined') return DEFAULT_SEOUL_COORDS;
  try {
    const raw = localStorage.getItem(SUN_COORDS_STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (
        parsed &&
        typeof parsed.lat === 'number' &&
        typeof parsed.lng === 'number' &&
        Number.isFinite(parsed.lat) &&
        Number.isFinite(parsed.lng)
      ) {
        return {
          lat: parsed.lat,
          lng: parsed.lng,
          label: typeof parsed.label === 'string' && parsed.label ? parsed.label : '현재 위치',
          isCustom: Boolean(parsed.isCustom),
        };
      }
    }
  } catch {
    // Ignore storage error
  }
  return DEFAULT_SEOUL_COORDS;
}

export function saveSunCoords(coords: SunCoordinates): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(SUN_COORDS_STORAGE_KEY, JSON.stringify(coords));
  } catch {
    // Ignore storage error
  }
}

export function resetSunCoordsToDefault(): SunCoordinates {
  if (typeof window !== 'undefined') {
    try {
      localStorage.removeItem(SUN_COORDS_STORAGE_KEY);
    } catch {
      // Ignore storage error
    }
  }
  return DEFAULT_SEOUL_COORDS;
}

export function requestCurrentLocationCoords(): Promise<SunCoordinates> {
  return new Promise((resolve, reject) => {
    if (typeof navigator === 'undefined' || !navigator.geolocation) {
      reject(new Error('이 브라우저에서는 위치 정보를 지원하지 않습니다.'));
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const lat = Number(pos.coords.latitude.toFixed(4));
        const lng = Number(pos.coords.longitude.toFixed(4));
        const coords: SunCoordinates = {
          lat,
          lng,
          label: `내 위치 (${lat.toFixed(2)}°N, ${lng.toFixed(2)}°E)`,
          isCustom: true,
        };
        saveSunCoords(coords);
        resolve(coords);
      },
      (err) => {
        if (err.code === err.PERMISSION_DENIED) {
          reject(new Error('위치 권한이 거부되어 서울 기준 일출·일몰 시간을 사용합니다.'));
        } else {
          reject(new Error('현재 위치를 가져오지 못했습니다. 서울 기준 시간을 유지합니다.'));
        }
      },
      { enableHighAccuracy: false, timeout: 6000, maximumAge: 60 * 60 * 1000 }
    );
  });
}

export function getSunSchedule(
  now: Date = new Date(),
  coordsOverride?: SunCoordinates
): SunScheduleInfo {
  const coords = coordsOverride || getStoredSunCoords();
  const year = now.getFullYear();
  const month = now.getMonth() + 1;
  const day = now.getDate();

  const fallbackSunrise = new Date(year, month - 1, day, 6, 30, 0, 0);
  const fallbackSunset = new Date(year, month - 1, day, 18, 0, 0, 0);

  const sunrise =
    calculateSolarEventUtc(year, month, day, coords.lat, coords.lng, true) || fallbackSunrise;
  const sunset =
    calculateSolarEventUtc(year, month, day, coords.lat, coords.lng, false) || fallbackSunset;

  const nowMs = now.getTime();
  const isDaytime = nowMs >= sunrise.getTime() && nowMs < sunset.getTime();
  const resolvedTheme: 'light' | 'dark' = isDaytime ? 'light' : 'dark';

  let nextTransitionTime: Date;
  let nextTransitionType: 'sunrise' | 'sunset';
  let nextTransitionTheme: 'light' | 'dark';

  if (nowMs < sunrise.getTime()) {
    nextTransitionTime = sunrise;
    nextTransitionType = 'sunrise';
    nextTransitionTheme = 'light';
  } else if (nowMs < sunset.getTime()) {
    nextTransitionTime = sunset;
    nextTransitionType = 'sunset';
    nextTransitionTheme = 'dark';
  } else {
    const tomorrow = new Date(year, month - 1, day + 1, 12, 0, 0, 0);
    const tomorrowSunrise =
      calculateSolarEventUtc(
        tomorrow.getFullYear(),
        tomorrow.getMonth() + 1,
        tomorrow.getDate(),
        coords.lat,
        coords.lng,
        true
      ) || new Date(year, month - 1, day + 1, 6, 30, 0, 0);
    nextTransitionTime = tomorrowSunrise;
    nextTransitionType = 'sunrise';
    nextTransitionTheme = 'light';
  }

  return {
    sunrise,
    sunset,
    sunriseText: formatTimeHHMM(sunrise),
    sunsetText: formatTimeHHMM(sunset),
    isDaytime,
    resolvedTheme,
    nextTransitionTime,
    nextTransitionType,
    nextTransitionTheme,
    coords,
  };
}

export function isValidThemeMode(value: unknown): value is ThemeMode {
  return value === 'light' || value === 'dark' || value === 'system' || value === 'sun';
}

export function getStoredThemeMode(): ThemeMode {
  if (typeof window === 'undefined') return 'sun';
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
  return 'sun';
}

export function resolveTheme(mode: ThemeMode, now: Date = new Date()): 'light' | 'dark' {
  if (mode === 'dark') return 'dark';
  if (mode === 'light') return 'light';
  if (mode === 'sun') {
    const schedule = getSunSchedule(now);
    // Persist today's sunrise/sunset timestamps so index.html pre-paint script avoids FOUC
    if (typeof window !== 'undefined') {
      try {
        localStorage.setItem(
          SUN_CACHE_STORAGE_KEY,
          JSON.stringify({
            dateKey: `${now.getFullYear()}-${now.getMonth() + 1}-${now.getDate()}`,
            sunriseMs: schedule.sunrise.getTime(),
            sunsetMs: schedule.sunset.getTime(),
          })
        );
      } catch {
        // Ignore storage error
      }
    }
    return schedule.resolvedTheme;
  }
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
    case 'sun':
      return '일출·일몰 자동';
    case 'light':
      return '라이트 모드';
    case 'dark':
      return '다크 모드';
    case 'system':
    default:
      return '시스템 설정';
  }
}
