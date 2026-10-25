/**
 * Date utility for Korean localized dates and times.
 * Computes current date/time in Asia/Seoul time zone (KST).
 */

export function getCurrentKoreanDateString(date: Date = new Date()): string {
  try {
    const formatter = new Intl.DateTimeFormat('ko-KR', {
      timeZone: 'Asia/Seoul',
      year: 'numeric',
      month: 'numeric',
      day: 'numeric',
      weekday: 'short',
    });
    const parts = formatter.formatToParts(date);
    const p: Record<string, string> = {};
    parts.forEach((x) => (p[x.type] = x.value));
    return `${p.year}년 ${p.month}월 ${p.day}일 (${p.weekday})`;
  } catch {
    const y = date.getFullYear();
    const m = date.getMonth() + 1;
    const d = date.getDate();
    const days = ['일', '월', '화', '수', '목', '금', '토'];
    return `${y}년 ${m}월 ${d}일 (${days[date.getDay()]})`;
  }
}

export function getCurrentKoreanFullDateString(date: Date = new Date()): string {
  try {
    const formatter = new Intl.DateTimeFormat('ko-KR', {
      timeZone: 'Asia/Seoul',
      year: 'numeric',
      month: 'numeric',
      day: 'numeric',
      weekday: 'long',
    });
    const parts = formatter.formatToParts(date);
    const p: Record<string, string> = {};
    parts.forEach((x) => (p[x.type] = x.value));
    return `${p.year}년 ${p.month}월 ${p.day}일 ${p.weekday}`;
  } catch {
    const y = date.getFullYear();
    const m = date.getMonth() + 1;
    const d = date.getDate();
    const days = ['일요일', '월요일', '화요일', '수요일', '목요일', '금요일', '토요일'];
    return `${y}년 ${m}월 ${d}일 ${days[date.getDay()]}`;
  }
}

export function getCurrentYMD(date: Date = new Date()): string {
  try {
    const formatter = new Intl.DateTimeFormat('ko-KR', {
      timeZone: 'Asia/Seoul',
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    });
    const parts = formatter.formatToParts(date);
    const p: Record<string, string> = {};
    parts.forEach((x) => (p[x.type] = x.value));
    return `${p.year}-${p.month}-${p.day}`;
  } catch {
    const y = date.getFullYear();
    const m = String(date.getMonth() + 1).padStart(2, '0');
    const d = String(date.getDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
  }
}

export function getCurrentKoreanTime(date: Date = new Date()): string {
  try {
    const formatter = new Intl.DateTimeFormat('ko-KR', {
      timeZone: 'Asia/Seoul',
      hour: '2-digit',
      minute: '2-digit',
      hour12: true,
    });
    return formatter.format(date);
  } catch {
    return '09:00 AM';
  }
}
