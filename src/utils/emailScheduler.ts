export interface TimezoneOption {
  id: string;
  label: string;
  shortLabel: string;
}

export const TIMEZONE_OPTIONS: TimezoneOption[] = [
  { id: 'Asia/Seoul', label: '서울 / 한국 표준시 (KST, UTC+9)', shortLabel: 'KST' },
  { id: 'Asia/Tokyo', label: '도쿄 / 일본 표준시 (JST, UTC+9)', shortLabel: 'JST' },
  { id: 'America/New_York', label: '뉴욕 / 미 동부 (EST/EDT)', shortLabel: 'ET' },
  { id: 'America/Los_Angeles', label: '로스앤젤레스 / 미 서부 (PST/PDT)', shortLabel: 'PT' },
  { id: 'Europe/London', label: '런던 / 영국 표준시 (GMT/BST)', shortLabel: 'GMT' },
  { id: 'UTC', label: '협정 세계시 (UTC)', shortLabel: 'UTC' },
];

export const DAYS_OF_WEEK = ['월', '화', '수', '목', '금', '토', '일'] as const;
export const WEEKDAY_PRESET = ['월', '화', '수', '목', '금'];
export const WEEKEND_PRESET = ['토', '일'];
export const QUICK_TIME_PRESETS = ['06:30', '07:00', '08:00', '08:30', '09:00', '12:00', '18:00', '21:00'] as const;

const WEEKDAY_EN_TO_KO: Record<string, string> = {
  Mon: '월',
  Tue: '화',
  Wed: '수',
  Thu: '목',
  Fri: '금',
  Sat: '토',
  Sun: '일',
};

export function getTimezoneShortLabel(timezoneId?: string): string {
  const tz = timezoneId || 'Asia/Seoul';
  return TIMEZONE_OPTIONS.find((opt) => opt.id === tz)?.shortLabel || tz;
}

export function getTimezoneFullLabel(timezoneId?: string): string {
  const tz = timezoneId || 'Asia/Seoul';
  return TIMEZONE_OPTIONS.find((opt) => opt.id === tz)?.label || tz;
}

export function formatKoreanTimeLabel(time24?: string): string {
  const safe = /^\d{2}:\d{2}$/.test(time24 || '') ? (time24 as string) : '09:00';
  const [hStr, mStr] = safe.split(':');
  const h = Number(hStr);
  const period = h < 12 ? '오전' : '오후';
  const h12 = h === 0 ? 12 : h > 12 ? h - 12 : h;
  return `${period} ${String(h12).padStart(2, '0')}:${mStr}`;
}

export function formatScheduleDaysSummary(days: string[] = []): string {
  const normalized = DAYS_OF_WEEK.filter((d) => days.includes(d));
  if (normalized.length === 0) return '발송 요일 미선택';
  if (normalized.length === 7) return '매일';
  if (
    normalized.length === 5 &&
    WEEKDAY_PRESET.every((d) => normalized.includes(d as (typeof DAYS_OF_WEEK)[number]))
  ) {
    return '평일 (월~금)';
  }
  if (
    normalized.length === 2 &&
    WEEKEND_PRESET.every((d) => normalized.includes(d as (typeof DAYS_OF_WEEK)[number]))
  ) {
    return '주말 (토·일)';
  }
  return normalized.join('·');
}

export interface ZonedNowParts {
  year: string;
  month: string;
  day: string;
  hour: number;
  minute: number;
  weekdayKo: string;
  dateKey: string;
  hhmm: string;
}

export function getZonedNowParts(timezoneId = 'Asia/Seoul', now = new Date()): ZonedNowParts {
  const tz = TIMEZONE_OPTIONS.some((t) => t.id === timezoneId) ? timezoneId : 'Asia/Seoul';
  const formatter = new Intl.DateTimeFormat('en-US', {
    timeZone: tz,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    weekday: 'short',
    hour12: false,
  });

  const parts = formatter.formatToParts(now);
  const map: Record<string, string> = {};
  for (const p of parts) {
    if (p.type !== 'literal') map[p.type] = p.value;
  }

  const rawHour = Number(map.hour === '24' ? '0' : map.hour || '0');
  const rawMin = Number(map.minute || '0');
  const hh = String(rawHour).padStart(2, '0');
  const mm = String(rawMin).padStart(2, '0');
  const weekdayKo = WEEKDAY_EN_TO_KO[map.weekday || 'Mon'] || '월';
  const dateKey = `${map.year}-${map.month}-${map.day}`;

  return {
    year: map.year || '2026',
    month: map.month || '01',
    day: map.day || '01',
    hour: rawHour,
    minute: rawMin,
    weekdayKo,
    dateKey,
    hhmm: `${hh}:${mm}`,
  };
}

export interface NextDispatchInfo {
  isActive: boolean;
  nextLabel: string;
  remainingLabel: string;
  currentSlotKey: string;
  matchesCurrentMinute: boolean;
}

export function getNextScheduledDispatchInfo(
  config: {
    autoEmailEnabled: boolean;
    deliveryTime: string;
    deliveryTimezone?: string;
    deliveryDays: string[];
  },
  now = new Date()
): NextDispatchInfo {
  const tz = config.deliveryTimezone || 'Asia/Seoul';
  const safeTime = /^\d{2}:\d{2}$/.test(config.deliveryTime || '') ? config.deliveryTime : '09:00';
  const [targetH, targetM] = safeTime.split(':').map(Number);
  const zonedNow = getZonedNowParts(tz, now);
  const currentSlotKey = `${tz}|${zonedNow.dateKey}|${safeTime}`;

  const days = DAYS_OF_WEEK.filter((d) => (config.deliveryDays || []).includes(d));
  const matchesCurrentMinute =
    config.autoEmailEnabled &&
    days.includes(zonedNow.weekdayKo as (typeof DAYS_OF_WEEK)[number]) &&
    zonedNow.hour === targetH &&
    zonedNow.minute === targetM;

  if (!config.autoEmailEnabled) {
    return {
      isActive: false,
      nextLabel: '자동 발송 일시 중지됨',
      remainingLabel: '스위치를 켜면 예약 발송이 재개됩니다',
      currentSlotKey,
      matchesCurrentMinute: false,
    };
  }

  if (days.length === 0) {
    return {
      isActive: false,
      nextLabel: '발송 요일 미선택',
      remainingLabel: '최소 1개 이상의 발송 요일을 선택하세요',
      currentSlotKey,
      matchesCurrentMinute: false,
    };
  }

  const nowTotalMin = zonedNow.hour * 60 + zonedNow.minute;
  const targetTotalMin = targetH * 60 + targetM;
  const todayIdx = DAYS_OF_WEEK.indexOf(zonedNow.weekdayKo as (typeof DAYS_OF_WEEK)[number]);

  let daysAhead = 0;
  let foundDay = zonedNow.weekdayKo;
  for (let offset = 0; offset <= 7; offset++) {
    const candidateDay = DAYS_OF_WEEK[(todayIdx + offset) % 7];
    if (!days.includes(candidateDay)) continue;
    if (offset === 0 && targetTotalMin <= nowTotalMin) continue;
    daysAhead = offset;
    foundDay = candidateDay;
    break;
  }

  const diffMinutes = daysAhead * 24 * 60 + (targetTotalMin - nowTotalMin);
  const diffHours = Math.floor(diffMinutes / 60);
  const remMins = diffMinutes % 60;

  const dayPrefix =
    daysAhead === 0 ? '오늘' : daysAhead === 1 ? '내일' : `${daysAhead}일 뒤 (${foundDay})`;
  const tzShort = getTimezoneShortLabel(tz);

  const remainingLabel =
    diffHours >= 24
      ? `약 ${Math.floor(diffHours / 24)}일 ${diffHours % 24}시간 후`
      : diffHours > 0
      ? `${diffHours}시간 ${remMins}분 후`
      : `${Math.max(1, remMins)}분 후`;

  return {
    isActive: true,
    nextLabel: `${dayPrefix} ${formatKoreanTimeLabel(safeTime)} (${tzShort})`,
    remainingLabel,
    currentSlotKey,
    matchesCurrentMinute,
  };
}
