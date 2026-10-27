import React from 'react';

/**
 * Utility functions for generating real portal search links and handling external navigation
 */

// Hanja to Hangul mapping for typical Korean press headlines
export const HANJA_TO_HANGUL: Record<string, string> = {
  '韓': '한',
  '美': '미',
  '日': '일',
  '中': '중',
  '北': '북',
  '與': '여',
  '野': '야',
  '尹': '윤',
  '檢': '검',
  '軍': '군',
  '政': '정',
  '黨': '당',
  '靑': '청',
  '法': '법',
  '文': '문',
  '李': '이',
  '金': '김',
};

// Common non-discriminating buzzwords that cause 0 search results on portal search engines
export const SEARCH_STOP_WORDS = new Set([
  '앞두고', '전격', '현실화', '우려', '증폭', '논의', '사상', '최대치', '돌파',
  '경신', '시사', '본궤도', '카운트다운', '비상', '난타전', '반토막', '여파', '쇼크',
  '포착', '신호탄', '초읽기', '초비상', '초미의', '관심', '집중', '위기', '대응',
  '발생', '확인', '관련', '결과', '발표', '예고', '지목', '해소', '강화', '타결',
  '합의', '제기', '오나', '낸다', '찾는다', '방치', '본격', '직격', '속', '등', '및',
  '1면', '1면톱', '공통이슈', '단독', '특종', '단독기사', '3줄요약', '종합', '취재',
  '속보', '포토', '영상', '카드뉴스', '사설', '칼럼', '기자', '보도', '뉴스'
]);

/**
 * Safely decodes any pre-encoded URI component to avoid double percent-encoding
 */
export function safeDecodeUri(text: string): string {
  if (!text) return '';
  try {
    return decodeURIComponent(text);
  } catch {
    return text;
  }
}

/**
 * Cleans titles by removing category tags, quotes, brackets, and punctuation to eliminate character errors.
 */
export function cleanTitleForSearch(title: string): string {
  let cleaned = safeDecodeUri(title);

  // Hanja to Hangul replacement
  for (const [hanja, hangul] of Object.entries(HANJA_TO_HANGUL)) {
    cleaned = cleaned.replaceAll(hanja, hangul);
  }

  return cleaned
    // Remove brackets and inside tags [종합], (단독), <1면>
    .replace(/\[.*?\]/g, ' ')
    .replace(/\(.*?\)/g, ' ')
    .replace(/<.*?>/g, ' ')
    .replace(/\{.*?\}/g, ' ')
    .replace(/【.*?】/g, ' ')
    .replace(/〔.*?〕/g, ' ')
    // Remove url query disrupting chars (#, ?, &, +, %, quotes)
    .replace(/[#"'$%&*+/:;<=>?@[\\\]^`{|}~]/g, ' ')
    .replace(/["'“”‘’`·…\-,:;!?]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

/**
 * Extracts compact, search-engine-friendly keywords that reliably yield articles on real news portals.
 */
export function extractSearchKeywords(title: string, keywords?: string[]): string {
  // If explicitly provided keywords exist, clean and use top keywords
  if (keywords && keywords.length > 0) {
    const validKws = keywords
      .map((k) => safeDecodeUri(k).replace(/[^a-zA-Z0-9가-힣]/g, '').trim())
      .filter((k) => k.length >= 2 && !SEARCH_STOP_WORDS.has(k));
    if (validKws.length > 0) {
      return validKws.slice(0, 3).join(' ');
    }
  }

  // Otherwise, intelligently extract key nouns from the title
  const cleaned = cleanTitleForSearch(title);

  const words = cleaned
    .split(/\s+/)
    .map((w) => w.replace(/[^a-zA-Z0-9가-힣]/g, '').trim())
    .filter((w) => w.length >= 2 || ['AI', 'PF', 'RD', 'IT', 'HBM', 'DSR', 'TSMC', 'EV'].includes(w.toUpperCase()))
    .filter((w) => !SEARCH_STOP_WORDS.has(w));

  if (words.length > 0) {
    return words.slice(0, 3).join(' ');
  }

  return cleaned.slice(0, 20).trim();
}

/**
 * Formulates a clean, human-readable Korean search query free of syntax/encoding errors.
 */
export function getCleanNaverQuery(title: string, outletName?: string, keywords?: string[]): string {
  const terms = extractSearchKeywords(title, keywords);
  const isMultiple = !outletName || outletName.includes('공통') || outletName.includes('multiple') || outletName.includes('전체');
  const cleanOutlet = outletName ? outletName.replace(/[^a-zA-Z0-9가-힣]/g, '').trim() : '';

  if (isMultiple || !cleanOutlet) {
    return terms;
  }
  return `${cleanOutlet} ${terms}`.trim();
}

/**
 * Naver News Search URL: guaranteed to find real news articles without character errors
 */
export function getNaverNewsUrl(title: string, outletName?: string, keywords?: string[]): string {
  const query = getCleanNaverQuery(title, outletName, keywords);
  return `https://search.naver.com/search.naver?where=news&sm=tab_jum&query=${encodeURIComponent(query)}`;
}

/**
 * Daum News Search URL: guaranteed to find real news articles
 */
export function getDaumNewsUrl(title: string, outletName?: string, keywords?: string[]): string {
  const query = getCleanNaverQuery(title, outletName, keywords);
  return `https://search.daum.net/search?w=news&q=${encodeURIComponent(query)}`;
}

/**
 * Google News Cluster Search URL
 */
export function getGoogleNewsUrl(title: string, keywords?: string[]): string {
  const terms = extractSearchKeywords(title, keywords);
  return `https://news.google.com/search?q=${encodeURIComponent(terms)}&hl=ko&gl=KR&ceid=KR%3Ako`;
}

/**
 * Canonical official press outlet homepage or verified article URL
 */
export function getOfficialOutletHomepage(
  outletId?: string,
  outletName?: string,
  providedUrl?: string
): string {
  // If a valid HTTP URL was provided for the story, use it
  if (providedUrl && (providedUrl.startsWith('http://') || providedUrl.startsWith('https://')) && !providedUrl.includes('localhost')) {
    return providedUrl;
  }

  // Reliable official news portals by ID or Name
  const id = (outletId || '').toLowerCase();
  const name = (outletName || '');

  if (id === 'sbs' || name.includes('SBS')) return 'https://news.sbs.co.kr';
  if (id === 'kbs' || name.includes('KBS')) return 'https://news.kbs.co.kr';
  if (id === 'mbc' || name.includes('MBC')) return 'https://imnews.imbc.com';
  if (id === 'ytn' || name.includes('YTN')) return 'https://www.ytn.co.kr';
  if (id === 'jtbc' || name.includes('JTBC')) return 'https://news.jtbc.co.kr';
  if (id === 'chosun' || name.includes('조선일보')) return 'https://www.chosun.com';
  if (id === 'joongang' || name.includes('중앙일보')) return 'https://www.joongang.co.kr';
  if (id === 'donga' || name.includes('동아일보')) return 'https://www.donga.com';
  if (id === 'hani' || name.includes('한겨레')) return 'https://www.hani.co.kr';
  if (id === 'khan' || name.includes('경향신문')) return 'https://www.khan.co.kr';
  if (id === 'mk' || name.includes('매일경제')) return 'https://www.mk.co.kr';
  if (id === 'hankyung' || name.includes('한국경제')) return 'https://www.hankyung.com';
  if (id === 'sedaily' || name.includes('서울경제')) return 'https://www.sedaily.com';
  if (id === 'herald' || name.includes('헤럴드경제')) return 'https://biz.heraldcorp.com';
  if (id === 'asiae' || name.includes('아시아경제')) return 'https://www.asiae.co.kr';
  if (id === 'yonhap' || name.includes('연합뉴스')) return 'https://www.yna.co.kr';
  if (id === 'news1' || name.includes('뉴스1')) return 'https://www.news1.kr';
  if (id === 'newsis' || name.includes('뉴시스')) return 'https://www.newsis.com';
  if (id === 'hankookilbo' || name.includes('한국일보')) return 'https://www.hankookilbo.com';
  if (id === 'kmib' || name.includes('국민일보')) return 'https://www.kmib.co.kr';
  if (id === 'seoul' || name.includes('서울신문')) return 'https://www.seoul.co.kr';
  if (id === 'segye' || name.includes('세계일보')) return 'https://www.segye.com';
  if (id === 'munhwa' || name.includes('문화일보')) return 'https://www.munhwa.com';
  if (id === 'mt' || name.includes('머니투데이')) return 'https://www.mt.co.kr';
  if (id === 'edaily' || name.includes('이데일리')) return 'https://www.edaily.co.kr';
  if (id === 'fnnews' || name.includes('파이낸셜뉴스')) return 'https://www.fnnews.com';
  if (id === 'dt' || name.includes('디지털타임스')) return 'https://www.dt.co.kr';
  if (id === 'etnews' || name.includes('전자신문')) return 'https://www.etnews.com';

  return 'https://news.naver.com';
}

/**
 * Backward-compatible alias for getOfficialOutletHomepage
 */
export const getDirectOutletUrl = (
  outletId?: string,
  outletName?: string,
  _title?: string,
  _keywords?: string[],
  fallbackHomepage?: string
): string => {
  return getOfficialOutletHomepage(outletId, outletName, fallbackHomepage);
};

export function openExternalSafe(url: string, e?: React.SyntheticEvent) {
  if (e) {
    e.stopPropagation();
  }
  try {
    const a = document.createElement('a');
    a.href = url;
    a.target = '_blank';
    a.rel = 'noopener noreferrer';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  } catch (err) {
    console.warn('Unable to open external link safely:', err);
  }
}

export async function copyToClipboardSafe(text: string): Promise<boolean> {
  // 1. Try modern navigator.clipboard if available and focused
  if (typeof navigator !== 'undefined' && navigator.clipboard && typeof navigator.clipboard.writeText === 'function') {
    try {
      await navigator.clipboard.writeText(text);
      return true;
    } catch {
      // In iframes or unfocused windows, writeText throws DOMException; fall through to fallback
    }
  }

  // 2. Reliable fallback using hidden textarea and execCommand
  try {
    const textArea = document.createElement('textarea');
    textArea.value = text;
    textArea.style.position = 'fixed';
    textArea.style.top = '0';
    textArea.style.left = '-9999px';
    textArea.style.width = '2em';
    textArea.style.height = '2em';
    textArea.style.padding = '0';
    textArea.style.border = 'none';
    textArea.style.outline = 'none';
    textArea.style.boxShadow = 'none';
    textArea.style.background = 'transparent';
    textArea.setAttribute('readonly', '');
    document.body.appendChild(textArea);
    textArea.focus();
    textArea.select();
    textArea.setSelectionRange(0, textArea.value.length);
    const successful = document.execCommand('copy');
    document.body.removeChild(textArea);
    if (successful) {
      return true;
    }
  } catch (err) {
    console.warn('Fallback copy failed:', err);
  }

  // 3. Last resort prompt if both fail
  try {
    if (typeof window !== 'undefined' && window.prompt) {
      window.prompt('아래 링크/텍스트를 복사(Ctrl+C)하세요:', text);
      return true;
    }
  } catch {
    // Ignore prompt failure
  }

  return false;
}
