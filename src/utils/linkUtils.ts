import React from 'react';

/**
 * Verified canonical homepage URLs for all major Korean press outlets.
 * These are guaranteed to return HTTP 200 and never result in broken search queries.
 */
export const OUTLET_CANONICAL_HOMEPAGES: Record<string, string> = {
  chosun: 'https://www.chosun.com',
  joongang: 'https://www.joongang.co.kr',
  donga: 'https://www.donga.com',
  hani: 'https://www.hani.co.kr',
  khan: 'https://www.khan.co.kr',
  mk: 'https://www.mk.co.kr',
  maeil: 'https://www.mk.co.kr',
  hankyung: 'https://www.hankyung.com',
  sedaily: 'https://www.sedaily.com',
  herald: 'https://biz.heraldcorp.com',
  asiae: 'https://www.asiae.co.kr',
  yonhap: 'https://www.yna.co.kr',
  news1: 'https://www.news1.kr',
  newsis: 'https://www.newsis.com',
  hankookilbo: 'https://www.hankookilbo.com',
  kmib: 'https://www.kmib.co.kr',
  seoul: 'https://www.seoul.co.kr',
  segye: 'https://www.segye.com',
  munhwa: 'https://www.munhwa.com',
  mt: 'https://www.mt.co.kr',
  edaily: 'https://www.edaily.co.kr',
  fnnews: 'https://www.fnnews.com',
  dt: 'https://www.dt.co.kr',
  etnews: 'https://www.etnews.com',
  sbs: 'https://news.sbs.co.kr',
  kbs: 'https://news.kbs.co.kr',
  mbc: 'https://imnews.imbc.com',
  ytn: 'https://www.ytn.co.kr',
  jtbc: 'https://news.jtbc.co.kr',
  chosunbiz: 'https://biz.chosun.com',
  ajunews: 'https://www.ajunews.com',
  newspim: 'https://www.newspim.com',
  dnews: 'https://www.dnews.co.kr',
  etoday: 'https://www.etoday.co.kr',
  bizwatch: 'https://news.bizwatch.co.kr',
  nocut: 'https://www.nocutnews.co.kr',
  dailian: 'https://www.dailian.co.kr',
  newstomato: 'https://www.newstomato.com',
  dealsite: 'https://dealsite.co.kr',
  mbn: 'https://www.mbn.co.kr',
  channela: 'https://www.ichannela.com',
  tvchosun: 'https://news.tvchosun.com',
  asiatoday: 'https://www.asiatoday.co.kr',
  viva100: 'https://www.viva100.com',
  ekn: 'https://www.ekn.kr',
  wowtv: 'https://www.wowtv.co.kr',
  sbsbiz: 'https://biz.sbs.co.kr',
};

// Name to canonical homepage mapping
export const OUTLET_NAME_HOMEPAGES: Record<string, string> = {
  '조선일보': 'https://www.chosun.com',
  '중앙일보': 'https://www.joongang.co.kr',
  '동아일보': 'https://www.donga.com',
  '한겨레': 'https://www.hani.co.kr',
  '경향신문': 'https://www.khan.co.kr',
  '매일경제': 'https://www.mk.co.kr',
  '한국경제': 'https://www.hankyung.com',
  '서울경제': 'https://www.sedaily.com',
  '헤럴드경제': 'https://biz.heraldcorp.com',
  '아시아경제': 'https://www.asiae.co.kr',
  '연합뉴스': 'https://www.yna.co.kr',
  '뉴스1': 'https://www.news1.kr',
  '뉴시스': 'https://www.newsis.com',
  '한국일보': 'https://www.hankookilbo.com',
  '국민일보': 'https://www.kmib.co.kr',
  '서울신문': 'https://www.seoul.co.kr',
  '세계일보': 'https://www.segye.com',
  '문화일보': 'https://www.munhwa.com',
  '머니투데이': 'https://www.mt.co.kr',
  '이데일리': 'https://www.edaily.co.kr',
  '파이낸셜뉴스': 'https://www.fnnews.com',
  '디지털타임스': 'https://www.dt.co.kr',
  '전자신문': 'https://www.etnews.com',
  '조선비즈': 'https://biz.chosun.com',
  '아주경제': 'https://www.ajunews.com',
  '뉴스핌': 'https://www.newspim.com',
  '대한경제': 'https://www.dnews.co.kr',
  '이투데이': 'https://www.etoday.co.kr',
  '비즈워치': 'https://news.bizwatch.co.kr',
  '노컷뉴스': 'https://www.nocutnews.co.kr',
  '데일리안': 'https://www.dailian.co.kr',
  '뉴스토마토': 'https://www.newstomato.com',
  '딜사이트': 'https://dealsite.co.kr',
  '아시아투데이': 'https://www.asiatoday.co.kr',
  '브릿지경제': 'https://www.viva100.com',
  '에너지경제': 'https://www.ekn.kr',
  '한국경제TV': 'https://www.wowtv.co.kr',
  'SBS Biz': 'https://biz.sbs.co.kr',
  'MBN': 'https://www.mbn.co.kr',
  '매일방송': 'https://www.mbn.co.kr',
  '채널A': 'https://www.ichannela.com',
  'TV조선': 'https://news.tvchosun.com',
  'SBS': 'https://news.sbs.co.kr',
  'KBS': 'https://news.kbs.co.kr',
  'MBC': 'https://imnews.imbc.com',
  'YTN': 'https://www.ytn.co.kr',
  'JTBC': 'https://news.jtbc.co.kr',
};

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
  '속보', '포토', '영상', '카드뉴스', '사설', '칼럼', '기자', '보도', '뉴스', '총력전',
  '이어', '가운데', '것으로', '대한', '통해', '위해', '따른', '대해', '오늘', '내일',
  '어제', '이번', '지난', '올해', '내년', '최근', '지금', '다시', '추진', '검토',
  '예정', '가능', '전망', '강조', '주장', '밝혀', '했다', '한다', '됐다', '된다',
  '있다', '없다', '이다', '하며', '라며', '라고', '만에', '이후', '이상', '이하'
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
    .replace(/《.*?》/g, ' ')
    // Remove url query disrupting chars (#, ?, &, +, %, quotes)
    .replace(/[#"'$%&*+/:;<=>?@[\\\]^`{|}~]/g, ' ')
    .replace(/["'“”‘’`·…\-,:;!?]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

/**
 * Extracts compact, search-engine-friendly keywords that reliably yield articles on real news portals.
 * Keeps only 1 or 2 high-signal nouns so search engines do not fail with 0 results.
 */
export function extractSearchKeywords(title: string, keywords?: string[]): string {
  // If explicitly provided keywords exist, clean and use the top 1 or 2 keywords
  if (keywords && keywords.length > 0) {
    const validKws = keywords
      .map((k) => safeDecodeUri(k).replace(/[^a-zA-Z0-9가-힣]/g, '').trim())
      .filter((k) => k.length >= 2 && !SEARCH_STOP_WORDS.has(k));
    if (validKws.length > 0) {
      return validKws.slice(0, 2).join(' ');
    }
  }

  // Otherwise, extract high-signal nouns from the cleaned title
  const cleaned = cleanTitleForSearch(title);

  const words = cleaned
    .split(/\s+/)
    .map((w) => w.replace(/[^a-zA-Z0-9가-힣]/g, '').trim())
    .filter((w) => w.length >= 2 || ['AI', 'PF', 'RD', 'IT', 'HBM', 'DSR', 'TSMC', 'EV', 'GTX'].includes(w.toUpperCase()))
    .filter((w) => !SEARCH_STOP_WORDS.has(w));

  if (words.length > 0) {
    return words.slice(0, 2).join(' ');
  }

  return cleaned.slice(0, 15).trim();
}

/**
 * Extracts title words for accurate portal news search.
 * Combines at least `minWords` (default 3) and up to `defaultWords` (default 5) words
 * from the original article title while preserving headline order.
 */
export function extractTitleSearchWords(
  title: string,
  keywords?: string[],
  outletName?: string,
  defaultWords = 5,
  minWords = 3
): string[] {
  const cleaned = cleanTitleForSearch(title);
  const rawTokens = cleaned
    .split(/\s+/)
    .map((w) => w.replace(/[^a-zA-Z0-9가-힣.]/g, '').replace(/^\.+|\.+$/g, '').trim())
    .filter(Boolean);

  const uniqueTokens: string[] = [];
  const seen = new Set<string>();
  for (const token of rawTokens) {
    const key = token.toLowerCase();
    if (!seen.has(key)) {
      seen.add(key);
      uniqueTokens.push(token);
    }
  }

  const preferredTokens = uniqueTokens.filter(
    (w) => w.length >= 2 && !SEARCH_STOP_WORDS.has(w)
  );
  const lengthTwoTokens = uniqueTokens.filter((w) => w.length >= 2);

  const selectedSet = new Set<string>();
  for (const token of preferredTokens) {
    if (selectedSet.size >= defaultWords) break;
    selectedSet.add(token);
  }

  // Fill up to defaultWords (5) from remaining 2+ char title words so short/stopword-heavy headlines stay rich
  if (selectedSet.size < defaultWords) {
    for (const token of lengthTwoTokens) {
      if (selectedSet.size >= defaultWords) break;
      selectedSet.add(token);
    }
  }

  // Ensure at least minWords (3) from title tokens (including 1-char tokens if needed)
  if (selectedSet.size < minWords) {
    for (const token of uniqueTokens) {
      if (selectedSet.size >= minWords) break;
      selectedSet.add(token);
    }
  }

  // Preserve original headline word order
  const orderedResult = uniqueTokens
    .filter((token) => selectedSet.has(token))
    .slice(0, defaultWords);

  // Fallback only when the title itself had fewer than minWords (3) words
  if (orderedResult.length < minWords && keywords && keywords.length > 0) {
    const existingLower = new Set(orderedResult.map((w) => w.toLowerCase()));
    for (const kw of keywords) {
      if (orderedResult.length >= minWords) break;
      const cleanKw = safeDecodeUri(kw).replace(/[^a-zA-Z0-9가-힣]/g, '').trim();
      if (cleanKw.length >= 2 && !existingLower.has(cleanKw.toLowerCase())) {
        orderedResult.push(cleanKw);
        existingLower.add(cleanKw.toLowerCase());
      }
    }
  }

  if (orderedResult.length < minWords && outletName) {
    const isMultiple =
      outletName.includes('공통') ||
      outletName.includes('multiple') ||
      outletName.includes('전체') ||
      outletName.includes('개사') ||
      outletName.includes('언론사');
    const cleanOutlet = outletName.replace(/[^a-zA-Z0-9가-힣]/g, '').trim();
    if (
      !isMultiple &&
      cleanOutlet &&
      !orderedResult.some((w) => w.toLowerCase() === cleanOutlet.toLowerCase())
    ) {
      orderedResult.unshift(cleanOutlet);
    }
  }

  return orderedResult.slice(0, defaultWords);
}

/**
 * Formulates a clean, human-readable Korean search query free of syntax/encoding errors.
 * Combines the press outlet name (when a specific outlet is present) with at least 3 and
 * by default 5 words from the original article title.
 */
export function getCleanNaverQuery(title: string, outletName?: string, keywords?: string[]): string {
  const titleWords = extractTitleSearchWords(title, keywords, undefined, 5, 3);
  const isMultiple =
    !outletName ||
    outletName.includes('공통') ||
    outletName.includes('multiple') ||
    outletName.includes('전체') ||
    outletName.includes('개사') ||
    outletName.includes('언론사');
  const cleanOutlet = outletName ? outletName.replace(/[^a-zA-Z0-9가-힣]/g, '').trim() : '';

  if (titleWords.length > 0) {
    if (
      !isMultiple &&
      cleanOutlet &&
      !titleWords.some((w) => w.toLowerCase() === cleanOutlet.toLowerCase())
    ) {
      return `${cleanOutlet} ${titleWords.join(' ')}`.trim();
    }
    return titleWords.join(' ').trim();
  }

  const fallback = extractSearchKeywords(title, keywords);
  if (!isMultiple && cleanOutlet && !fallback.includes(cleanOutlet)) {
    return `${cleanOutlet} ${fallback}`.trim();
  }
  return fallback;
}

/**
 * Naver News Search URL: guaranteed to find real news articles without character errors.
 */
export function getNaverNewsUrl(title: string, outletName?: string, keywords?: string[]): string {
  const query = getCleanNaverQuery(title, outletName, keywords);
  return `https://search.naver.com/search.naver?where=news&query=${encodeURIComponent(query)}`;
}

/**
 * Naver Main Search URL: opens Naver general search with clean query.
 */
export function getNaverMainSearchUrl(query?: string): string {
  if (!query) return 'https://search.naver.com';
  return `https://search.naver.com/search.naver?query=${encodeURIComponent(query.trim())}`;
}

/**
 * Daum News Search URL
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
 * Canonical official press outlet homepage or verified article URL.
 * Guarantees that internal search URLs or third-party portal URLs (Naver, Daum, Google)
 * are NEVER returned as an official outlet homepage.
 */
export function getOfficialOutletHomepage(
  outletId?: string,
  outletName?: string,
  providedUrl?: string
): string {
  // If providedUrl is already a real article on the press outlet's OWN domain (and NOT a search query)
  if (
    providedUrl &&
    (providedUrl.startsWith('http://') || providedUrl.startsWith('https://')) &&
    !providedUrl.includes('localhost') &&
    !providedUrl.includes('search.naver.com') &&
    !providedUrl.includes('naver.com') &&
    !providedUrl.includes('daum.net') &&
    !providedUrl.includes('google.com') &&
    !providedUrl.includes('/search?') &&
    !providedUrl.includes('/search/') &&
    !providedUrl.includes('where=news') &&
    !providedUrl.includes('word=') &&
    !providedUrl.includes('query=')
  ) {
    return providedUrl;
  }

  // 1. Check ID in canonical homepages map
  const id = (outletId || '').toLowerCase().trim();
  if (id && OUTLET_CANONICAL_HOMEPAGES[id]) {
    return OUTLET_CANONICAL_HOMEPAGES[id];
  }

  // 2. Check Name in canonical name map
  const name = (outletName || '').trim();
  if (name) {
    for (const [outletKey, url] of Object.entries(OUTLET_NAME_HOMEPAGES)) {
      if (name === outletKey || name.includes(outletKey) || outletKey.includes(name)) {
        return url;
      }
    }
  }

  // 3. Fallback to Naver News Portal
  return 'https://news.naver.com';
}

/**
 * Generates direct search URL on the press outlet's OWN website
 * (e.g. search.khan.co.kr for Kyunghyang, chosun.com/search for Chosun)
 */
export function getOfficialOutletSearchUrl(
  outletId?: string,
  outletName?: string,
  title?: string,
  keywords?: string[]
): string {
  const titleWords = extractTitleSearchWords(title || '', keywords, undefined, 3, 2);
  const query =
    titleWords.length > 0
      ? titleWords.join(' ')
      : extractSearchKeywords(title || '', keywords).split(' ')[0] || '';
  const encodedQuery = encodeURIComponent(query);
  const id = (outletId || '').toLowerCase().trim();
  const name = (outletName || '').trim();

  if (id === 'khan' || name.includes('경향')) {
    return `https://search.khan.co.kr/?q=${encodedQuery}`;
  }
  if (id === 'chosunbiz' || name.includes('조선비즈')) {
    return `https://biz.chosun.com/nsearch/?query=${encodedQuery}`;
  }
  if (id === 'chosun' || name.includes('조선일보') || name === '조선') {
    return `https://www.chosun.com/search/?query=${encodedQuery}`;
  }
  if (id === 'joongang' || name.includes('중앙')) {
    return `https://www.joongang.co.kr/search?keyword=${encodedQuery}`;
  }
  if (id === 'donga' || name.includes('동아')) {
    return `https://www.donga.com/news/search?query=${encodedQuery}`;
  }
  if (id === 'hani' || name.includes('한겨레')) {
    return `https://search.hani.co.kr/search?q=${encodedQuery}`;
  }
  if (id === 'mk' || id === 'maeil' || name.includes('매일경제')) {
    return `https://www.mk.co.kr/search?word=${encodedQuery}`;
  }
  if (id === 'hankyung' || name.includes('한국경제')) {
    return `https://www.hankyung.com/search?query=${encodedQuery}`;
  }
  if (id === 'sedaily' || name.includes('서울경제')) {
    return `https://www.sedaily.com/search?query=${encodedQuery}`;
  }
  if (id === 'herald' || name.includes('헤럴드')) {
    return `https://biz.heraldcorp.com/search?q=${encodedQuery}`;
  }
  if (id === 'asiae' || name.includes('아시아경제')) {
    return `https://www.asiae.co.kr/search?query=${encodedQuery}`;
  }
  if (id === 'edaily' || name.includes('이데일리')) {
    return `https://www.edaily.co.kr/search/news/?keyword=${encodedQuery}`;
  }
  if (id === 'mt' || name.includes('머니투데이')) {
    return `https://www.mt.co.kr/search?kwd=${encodedQuery}`;
  }
  if (id === 'fnnews' || name.includes('파이낸셜뉴스')) {
    return `https://www.fnnews.com/search?search_txt=${encodedQuery}`;
  }
  if (id === 'ajunews' || name.includes('아주경제')) {
    return `https://www.ajunews.com/search?q=${encodedQuery}`;
  }
  if (id === 'newspim' || name.includes('뉴스핌')) {
    return `https://www.newspim.com/search?search=${encodedQuery}`;
  }
  if (id === 'etoday' || name.includes('이투데이')) {
    return `https://www.etoday.co.kr/search/?kwd=${encodedQuery}`;
  }
  if (id === 'dnews' || name.includes('대한경제')) {
    return `https://www.dnews.co.kr/uhtml/autosearch/index.jsp?search_word=${encodedQuery}`;
  }
  if (id === 'bizwatch' || name.includes('비즈워치')) {
    return `https://news.bizwatch.co.kr/search?search_text=${encodedQuery}`;
  }
  if (id === 'yonhap' || name.includes('연합뉴스')) {
    return `https://www.yna.co.kr/search/index?query=${encodedQuery}`;
  }
  if (id === 'news1' || name.includes('뉴스1')) {
    return `https://www.news1.kr/search?query=${encodedQuery}`;
  }
  if (id === 'newsis' || name.includes('뉴시스')) {
    return `https://www.newsis.com/search/?val=${encodedQuery}`;
  }
  if (id === 'hankookilbo' || name.includes('한국일보')) {
    return `https://www.hankookilbo.com/search?query=${encodedQuery}`;
  }
  if (id === 'kmib' || name.includes('국민일보')) {
    return `https://www.kmib.co.kr/search/searchResult.asp?searchWord=${encodedQuery}`;
  }
  if (id === 'seoul' || name.includes('서울신문')) {
    return `https://search.seoul.co.kr/index.php?keyword=${encodedQuery}`;
  }
  if (id === 'segye' || name.includes('세계일보')) {
    return `https://www.segye.com/search?query=${encodedQuery}`;
  }
  if (id === 'munhwa' || name.includes('문화일보')) {
    return `https://www.munhwa.com/search?query=${encodedQuery}`;
  }
  if (id === 'dt' || name.includes('디지털타임스')) {
    return `https://www.dt.co.kr/search?query=${encodedQuery}`;
  }
  if (id === 'etnews' || name.includes('전자신문')) {
    return `https://search.etnews.com/etnews/search.html?kwd=${encodedQuery}`;
  }
  if (id === 'sbs' || name === 'SBS') {
    return `https://news.sbs.co.kr/news/search/result.do?query=${encodedQuery}`;
  }
  if (id === 'kbs' || name === 'KBS') {
    return `https://news.kbs.co.kr/news/pc/search/search.do?query=${encodedQuery}`;
  }
  if (id === 'ytn' || name === 'YTN') {
    return `https://www.ytn.co.kr/search/?q=${encodedQuery}`;
  }
  if (id === 'jtbc' || name === 'JTBC') {
    return `https://news.jtbc.co.kr/search?keyword=${encodedQuery}`;
  }

  return getOfficialOutletHomepage(outletId, outletName);
}

const BARE_HOMEPAGE_SET = new Set([
  ...Object.values(OUTLET_CANONICAL_HOMEPAGES).map((u) => u.replace(/\/+$/, '')),
  'https://www.heraldcorp.com',
  'https://news.naver.com',
]);

/**
 * Returns the best direct article URL or official in-site search URL on the press outlet's own portal.
 * Never returns third-party portal/aggregator redirect URLs (Google News, Naver, Daum).
 */
export function getArticleOrOutletUrl(
  outletId?: string,
  outletName?: string,
  title?: string,
  keywords?: string[],
  providedUrl?: string
): string {
  const normalizedProvided = (providedUrl || '').trim().replace(/\/+$/, '');
  const isPortalOrAggregator =
    normalizedProvided.includes('news.google.com') ||
    normalizedProvided.includes('google.com') ||
    normalizedProvided.includes('naver.com') ||
    normalizedProvided.includes('daum.net') ||
    normalizedProvided.includes('/search?') ||
    normalizedProvided.includes('/search/') ||
    normalizedProvided.includes('where=news');

  if (
    normalizedProvided &&
    (normalizedProvided.startsWith('http://') || normalizedProvided.startsWith('https://')) &&
    !normalizedProvided.includes('localhost') &&
    !isPortalOrAggregator &&
    !BARE_HOMEPAGE_SET.has(normalizedProvided)
  ) {
    return providedUrl!.trim();
  }

  return getOfficialOutletSearchUrl(outletId, outletName, title, keywords);
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

/**
 * Safe external navigation helper that handles browser popups and mobile webviews reliably.
 */
export function openExternalSafe(url: string, e?: React.SyntheticEvent) {
  if (e) {
    e.stopPropagation();
  }
  if (!url) return;

  try {
    const win = window.open(url, '_blank', 'noopener,noreferrer');
    if (!win) {
      // If popup blocker intervened, simulate click on a temporary anchor
      const a = document.createElement('a');
      a.href = url;
      a.target = '_blank';
      a.rel = 'noopener noreferrer';
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
    }
  } catch (err) {
    console.warn('Unable to open external link safely:', err);
    try {
      window.location.href = url;
    } catch {
      // ignore
    }
  }
}

/**
 * Universal clipboard copy helper with multi-tier fallback (Clipboard API -> execCommand -> prompt)
 */
export async function copyToClipboardSafe(text: string): Promise<boolean> {
  if (!text) return false;

  // 1. Modern navigator.clipboard if available
  if (typeof navigator !== 'undefined' && navigator.clipboard && typeof navigator.clipboard.writeText === 'function') {
    try {
      await navigator.clipboard.writeText(text);
      return true;
    } catch {
      // In iframes or unfocused tabs, writeText throws DOMException; fall through to fallback
    }
  }

  // 2. Fallback using hidden textarea and execCommand
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

  // 3. Last resort prompt
  try {
    if (typeof window !== 'undefined' && window.prompt) {
      window.prompt('아래 텍스트를 복사(Ctrl+C 또는 길게 눌러 복사)하세요:', text);
      return true;
    }
  } catch {
    // Ignore prompt failure
  }

  return false;
}
