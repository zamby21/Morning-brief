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
  '1면', '1면톱', '공통이슈', '단독', '특종', '단독기사', '3줄요약', '종합', '취재'
]);

/**
 * Cleans titles by removing category tags, quotes, and punctuation.
 */
export function cleanTitleForSearch(title: string): string {
  let cleaned = title;
  for (const [hanja, hangul] of Object.entries(HANJA_TO_HANGUL)) {
    cleaned = cleaned.replaceAll(hanja, hangul);
  }

  return cleaned
    .replace(/\[.*?\]/g, ' ')
    .replace(/\(.*?\)/g, ' ')
    .replace(/["'“”‘’`·…\-,:;!?]/g, ' ')
    .trim();
}

/**
 * Extracts compact, search-engine-friendly keywords that reliably yield articles on real news portals.
 */
export function extractSearchKeywords(title: string, keywords?: string[]): string {
  // If explicitly provided keywords exist, clean and use the top 2-3 content keywords
  if (keywords && keywords.length > 0) {
    const validKws = keywords
      .map((k) => k.replace(/[^a-zA-Z0-9가-힣]/g, '').trim())
      .filter((k) => k.length >= 2 && !SEARCH_STOP_WORDS.has(k));
    if (validKws.length > 0) {
      return validKws.slice(0, 3).join(' ');
    }
  }

  // Otherwise, intelligently extract key nouns from the title
  const cleaned = cleanTitleForSearch(title);

  const words = cleaned
    .split(/\s+/)
    .filter((w) => w.length >= 2 || ['AI', 'PF', 'RD', 'IT', 'HBM', 'DSR'].includes(w.toUpperCase()))
    .filter((w) => !SEARCH_STOP_WORDS.has(w));

  if (words.length > 0) {
    return words.slice(0, 3).join(' ');
  }

  return cleaned.slice(0, 15).trim();
}

/**
 * Naver News Search URL: guaranteed to find real news articles
 */
export function getNaverNewsUrl(title: string, outletName?: string, keywords?: string[]): string {
  const terms = extractSearchKeywords(title, keywords);
  const isMultiple = !outletName || outletName.includes('공통') || outletName.includes('multiple');
  const query = isMultiple ? terms : `${outletName} ${terms}`;
  return `https://search.naver.com/search.naver?where=news&query=${encodeURIComponent(query.trim())}`;
}

/**
 * Daum News Search URL: guaranteed to find real news articles
 */
export function getDaumNewsUrl(title: string, outletName?: string, keywords?: string[]): string {
  const terms = extractSearchKeywords(title, keywords);
  const isMultiple = !outletName || outletName.includes('공통') || outletName.includes('multiple');
  const query = isMultiple ? terms : `${outletName} ${terms}`;
  return `https://search.daum.net/search?w=news&q=${encodeURIComponent(query.trim())}`;
}

/**
 * Google News Cluster Search URL
 */
export function getGoogleNewsUrl(title: string, keywords?: string[]): string {
  const terms = extractSearchKeywords(title, keywords);
  return `https://news.google.com/search?q=${encodeURIComponent(terms)}&hl=ko&gl=KR&ceid=KR%3Ako`;
}

/**
 * Direct official media outlet search or article URL
 */
export function getDirectOutletUrl(
  outletId?: string,
  outletName?: string,
  title?: string,
  keywords?: string[],
  fallbackHomepage?: string
): string {
  const terms = extractSearchKeywords(title || '', keywords);

  switch (outletId) {
    case 'chosun':
      return `https://www.chosun.com/search/?query=${encodeURIComponent(terms)}`;
    case 'joongang':
      return `https://www.joongang.co.kr/search?keyword=${encodeURIComponent(terms)}`;
    case 'donga':
      return `https://www.donga.com/news/search?query=${encodeURIComponent(terms)}`;
    case 'mk':
      return `https://www.mk.co.kr/search?word=${encodeURIComponent(terms)}`;
    case 'hankyung':
      return `https://www.hankyung.com/search?keyword=${encodeURIComponent(terms)}`;
    case 'sedaily':
      return `https://www.sedaily.com/Search/?scText=${encodeURIComponent(terms)}`;
    case 'khan':
      return `https://www.khan.co.kr/search?q=${encodeURIComponent(terms)}`;
    case 'herald':
      return `https://biz.heraldcorp.com/search.php?q=${encodeURIComponent(terms)}`;
    case 'asiae':
      return `https://www.asiae.co.kr/search?query=${encodeURIComponent(terms)}`;
    default:
      if (outletName) {
        return `https://search.naver.com/search.naver?where=news&query=${encodeURIComponent(`${outletName} ${terms}`.trim())}`;
      }
      return fallbackHomepage || 'https://news.naver.com';
  }
}

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
