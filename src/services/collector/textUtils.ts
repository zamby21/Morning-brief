import type { ArticleContentBlock } from '../../types/news.ts';
import { PRESS_OUTLETS } from '../../data/pressMetadata.ts';

export const MAX_ARTICLE_AGE_MS = 24 * 60 * 60 * 1000;
export const MAX_CITATION_EXCERPT_CHARS = 700;
export const EXPLICIT_EXCLUSIVE_TITLE_REGEX = /(?:^|\s)(?:\[단독\]|【단독】|\(단독\)|<단독>|단독[\s:·\-])/;

export function getKstDateKey(date: Date = new Date()): string {
  return date.toLocaleDateString('en-CA', { timeZone: 'Asia/Seoul' });
}

export function parseKstDateTimeString(raw: string): string | undefined {
  const trimmed = (raw || '').trim();
  if (!trimmed) return undefined;
  const m = trimmed.match(/^(\d{4})-(\d{2})-(\d{2})[ T](\d{2}):(\d{2})(?::(\d{2}))?$/);
  if (m) {
    const iso = `${m[1]}-${m[2]}-${m[3]}T${m[4]}:${m[5]}:${m[6] || '00'}+09:00`;
    if (!Number.isNaN(Date.parse(iso))) return iso;
  }
  const parsed = Date.parse(trimmed);
  if (!Number.isNaN(parsed)) {
    return new Date(parsed).toISOString();
  }
  return undefined;
}

export function extractRealPubDateFromHtml(html: string): string | undefined {
  if (!html) return undefined;
  const naverDataDate = html.match(/data-date-time=["'](\d{4}-\d{2}-\d{2}\s+\d{2}:\d{2}(?::\d{2})?)["']/i)?.[1];
  if (naverDataDate) {
    const iso = parseKstDateTimeString(naverDataDate);
    if (iso) return iso;
  }
  const metaPub =
    html.match(/<meta[^>]+property=["']article:published_time["'][^>]+content=["']([^"']+)["']/i)?.[1] ||
    html.match(/<meta[^>]+content=["']([^"']+)["'][^>]+property=["']article:published_time["']/i)?.[1] ||
    html.match(/<meta[^>]+name=["'](?:pubdate|article:published_time|date|DC\.date\.issued)["'][^>]+content=["']([^"']+)["']/i)?.[1] ||
    html.match(/"datePublished"\s*:\s*"([^"]+)"/i)?.[1];
  if (metaPub) {
    const iso = parseKstDateTimeString(metaPub);
    if (iso) return iso;
  }
  return undefined;
}

export function isWithinLast24Hours(pubDateRaw: string | undefined, nowMs = Date.now()): boolean {
  if (!pubDateRaw) return true;
  const ts = Date.parse(pubDateRaw);
  if (Number.isNaN(ts)) return true;
  const age = nowMs - ts;
  return age >= -2 * 60 * 60 * 1000 && age <= MAX_ARTICLE_AGE_MS;
}

export function normalizeTitleForDedup(title: string): string {
  return (title || '')
    .replace(/\[[^\]]*\]|【[^】]*】|\([^)]*\)/g, ' ')
    .replace(/[^a-zA-Z0-9가-힣\s]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    .toLowerCase();
}

export function areTitlesNearDuplicate(a: string, b: string): boolean {
  const na = normalizeTitleForDedup(a);
  const nb = normalizeTitleForDedup(b);
  if (!na || !nb) return false;
  if (na === nb) return true;
  if (na.length >= 16 && nb.length >= 16 && (na.includes(nb) || nb.includes(na))) return true;
  const ta = new Set(na.split(' ').filter((w) => w.length >= 2));
  const tb = new Set(nb.split(' ').filter((w) => w.length >= 2));
  if (ta.size < 3 || tb.size < 3) return false;
  let inter = 0;
  for (const w of ta) {
    if (tb.has(w)) inter += 1;
  }
  const overlap = inter / Math.min(ta.size, tb.size);
  return overlap >= 0.8;
}

export function decodeHtmlEntities(str: string): string {
  if (!str) return '';
  return str
    .replace(/&quot;/g, '"')
    .replace(/&#034;/g, '"')
    .replace(/&#34;/g, '"')
    .replace(/&#039;/g, "'")
    .replace(/&#39;/g, "'")
    .replace(/&apos;/g, "'")
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&middot;/g, '·')
    .replace(/&#183;/g, '·')
    .replace(/&hellip;/g, '…')
    .replace(/&#8230;/g, '…')
    .replace(/&lsquo;/g, '‘')
    .replace(/&rsquo;/g, '’')
    .replace(/&ldquo;/g, '“')
    .replace(/&rdquo;/g, '”')
    .replace(/&nbsp;/g, ' ')
    .replace(/&#x([0-9a-fA-F]+);/gi, (_, hex) => {
      const code = parseInt(hex, 16);
      return Number.isFinite(code) && code >= 32 && code !== 127 ? String.fromCharCode(code) : ' ';
    })
    .replace(/&#([0-9]+);/g, (_, dec) => {
      const code = parseInt(dec, 10);
      return Number.isFinite(code) && code >= 32 && code !== 127 ? String.fromCharCode(code) : ' ';
    })
    .replace(/\s+/g, ' ')
    .trim();
}

export function normalizeArticleUrl(href: string, baseUrl: string): string {
  if (!href) return baseUrl;
  const trimmed = href.trim();
  if (trimmed.startsWith('//')) return `https:${trimmed}`;
  if (trimmed.startsWith('/')) return `${baseUrl.replace(/\/$/, '')}${trimmed}`;
  return trimmed;
}

export const BOILERPLATE_SUBSTRINGS = [
  '무단전재',
  '무단 전재',
  '재배포',
  'AI 학습 및 활용 금지',
  'Copyright',
  'copyright',
  '저작권',
  'Google 검색',
  '추천 검색어',
  '이동 통신망',
  '데이터 통화료',
  '섹션 정보',
  '중복 분류',
  '언론사의 주요 뉴스',
  '메인에서 바로 만나보세요',
  '메인에서 만나보세요',
  '함께 많이 본 기사',
  '유사한 기사, 관심 기사',
  '자동 추천합니다',
  '글자크기 설정',
  '다른 기사의 본문',
  '회원이 되어주세요',
  '편의 기능이 궁금',
  '중앙일보 회원',
  '기사제보',
  '개인정보',
  '구독',
  '로그인',
  '회원가입',
  '앱에서 보기',
  '전체기사',
  '관련기사',
  '뉴스레터',
  '많이 본 뉴스',
  '크게보기',
  '기자 =',
];

export function stripInlineTagsCleanly(html: string): string {
  const withNewlines = html
    .replace(/<(?:script|style|figure|figcaption|aside|nav)[\s\S]*?<\/(?:script|style|figure|figcaption|aside|nav)>/gi, ' ')
    .replace(/<\/?(?:a|span|strong|em|b|i|u|mark|font|small)[^>]*>/gi, '')
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/<(?:p|div|li|h[1-6])(?:\s+[^>]*)?>/gi, '\n')
    .replace(/<\/(?:p|div|li|h[1-6])>/gi, '\n')
    .replace(/<[^>]+>/g, ' ');

  return withNewlines
    .split(/\n+/)
    .map((line) => decodeHtmlEntities(line))
    .filter(Boolean)
    .join('\n');
}

export function stripReporterEmailSuffix(text: string): string {
  return (text || '')
    .replace(/\s*[가-힣]{2,4}\s*기자\s*[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}\.?$/g, '')
    .replace(/\s+[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}\.?$/g, '')
    .trim();
}

export function isCleanBodySentence(s: string): boolean {
  if (!s || s.length < 20 || s.length > 480) return false;
  if (!/[.?!다요음임함됨]["'”’)\]]*$/.test(s)) return false;
  if (s.includes('http://') || s.includes('https://') || s.includes('&lt;') || s.includes('@')) return false;
  return !BOILERPLATE_SUBSTRINGS.some((bad) => s.includes(bad));
}

export function isCleanParagraph(p: string): boolean {
  if (!p || p.length < 28 || p.length > 1100) return false;
  if (!/[.?!다요음임함됨]["'”’)\]]*$/.test(p)) return false;
  if (p.includes('http://') || p.includes('https://') || p.includes('@')) return false;
  return !BOILERPLATE_SUBSTRINGS.some((bad) => p.includes(bad));
}

export function isCleanVerbatimLine(p: string): boolean {
  if (!p || p.length < 12 || p.length > 2000) return false;
  if (p.includes('http://') || p.includes('https://') || p.includes('&lt;')) return false;
  if (/^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/.test(p)) return false;
  if (/^[가-힣]{2,4}\s*기자\s*$/.test(p)) return false;
  if (p.length < 28 && !/[.?!다요음임함됨"'”’]/.test(p)) return false;
  return !BOILERPLATE_SUBSTRINGS.some((bad) => p.includes(bad));
}

export function isCleanSubheading(s: string): boolean {
  if (!s || s.length < 6 || s.length > 140) return false;
  if (s.includes('http://') || s.includes('https://') || s.includes('@')) return false;
  return !BOILERPLATE_SUBSTRINGS.some((bad) => s.includes(bad));
}

export function splitLongParagraphCleanly(text: string): string[] {
  const normalized = (text || '')
    .replace(/(?<=[다요음임함됨][.?!]["'”’)?]*)(?=[가-힣A-Z0-9\[“‘"'(])/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();

  if (!normalized) return [];
  if (normalized.length <= 320) return [normalized];

  const sentences = normalized
    .split(/(?<=[.?!]["'”’)?]*)\s+/)
    .map((s) => s.trim())
    .filter(Boolean);

  if (sentences.length <= 2) return [normalized];

  const chunks: string[] = [];
  let buf = '';
  let countInBuf = 0;

  for (const sent of sentences) {
    const candidate = buf ? `${buf} ${sent}` : sent;
    if (buf && (candidate.length > 280 || countInBuf >= 2)) {
      chunks.push(buf);
      buf = sent;
      countInBuf = 1;
    } else {
      buf = candidate;
      countInBuf += 1;
    }
  }
  if (buf) chunks.push(buf);

  return chunks.length > 0 ? chunks : [normalized];
}

export function generate3LineSummaryFromSnippet(
  _title: string,
  snippet: string,
  _outletName: string,
  preExtractedSentences?: string[]
): string[] {
  const baseSentences = (preExtractedSentences || [])
    .map((s) => s.replace(/^[0-9]+[.)]\s*/, '').trim())
    .filter((s) => s.length >= 12 && !BOILERPLATE_SUBSTRINGS.some((bad) => s.includes(bad)));

  if (baseSentences.length >= 3) {
    return baseSentences.slice(0, 3);
  }

  const cleanSnip = decodeHtmlEntities(
    (snippet || '').replace(/<[^>]+>/g, ' ').replace(/https?:\/\/[^\s]+/g, ' ')
  );
  const candidateSentences = cleanSnip
    .split(/(?<=[.?!])\s+/)
    .map((s) => s.replace(/^[0-9]+[.)]\s*/, '').trim())
    .filter(isCleanBodySentence);

  const combined = [...baseSentences];
  for (const s of candidateSentences) {
    const key = s.slice(0, 16);
    if (!combined.some((u) => u.includes(key))) {
      combined.push(s);
    }
    if (combined.length >= 3) return combined.slice(0, 3);
  }

  if (combined.length > 0) {
    return combined;
  }

  return ['본문 발췌 부족 — 제목과 원문 링크만 제공'];
}

export function inferTopicFromText(title: string): string {
  if (/도시개발|도시재생|재건축|재개발|정비사업|신도시|택지|모아타운|신속통합|선도지구|스마트시티/.test(title))
    return '도시개발·정비';
  if (/부동산|아파트|집값|전세|월세|청약|분양|주택공급|임대|토지/.test(title)) return '부동산·정책';
  if (/건설|수주|시공|착공|플랜트|토목|GTX|철도|인프라|공사비/.test(title)) return '건설·인프라';
  if (/증시|코스피|코스닥|주가|외국인|매도|매수|투자|금리|환율|대출|은행|PF|경제/.test(title)) return '금융·경제';
  if (/트럼프|시진핑|푸틴|APEC|외교|중국|미국|정상회담|관세|통상|안보/.test(title)) return '외교·국제';
  if (/엔비디아|AI|반도체|삼성|하이닉스|빅테크|클라우드|배터리/.test(title)) return 'IT·반도체';
  if (/법원|무죄|구형|특검|국힘|與|野|대통령|국회|청문|재판|검찰|헌재/.test(title)) return '정치·사법';
  if (/수능|경찰|교육|교사|의료|노동|파업|기후|사고/.test(title)) return '사회·교육';
  return '종합·1면 톱';
}

export function trimCitationExcerpt(raw?: string, maxChars = MAX_CITATION_EXCERPT_CHARS): string {
  const cleaned = (raw || '').replace(/\r\n/g, '\n').trim();
  if (!cleaned) return '';
  if (cleaned.length <= maxChars) return cleaned;
  const sliced = cleaned.slice(0, maxChars);
  const lastPeriod = Math.max(sliced.lastIndexOf('. '), sliced.lastIndexOf('다.'), sliced.lastIndexOf('\n'));
  const cut = lastPeriod > maxChars * 0.55 ? sliced.slice(0, lastPeriod + 1) : sliced;
  return `${cut.trim()}…`;
}

export function trimCitationBlocks(blocks?: ArticleContentBlock[]): ArticleContentBlock[] | undefined {
  if (!blocks || blocks.length === 0) return undefined;
  const result: ArticleContentBlock[] = [];
  let textChars = 0;
  let textBlocks = 0;
  let images = 0;

  for (const blk of blocks) {
    if (blk.type === 'image') {
      if (images < 1 && blk.url) {
        result.push(blk);
        images += 1;
      }
      continue;
    }
    const text = (blk.text || '').trim();
    if (!text) continue;
    if (textBlocks >= 3 || textChars >= MAX_CITATION_EXCERPT_CHARS) break;
    const remaining = MAX_CITATION_EXCERPT_CHARS - textChars;
    const clipped = text.length > remaining ? `${text.slice(0, remaining).trim()}…` : text;
    result.push({ ...blk, text: clipped });
    textChars += clipped.length;
    textBlocks += 1;
  }

  return result.length > 0 ? result : undefined;
}

export function formatPublishedAtFromRaw(
  rawPubDate: string | undefined,
  fallbackDateLabel: string,
  fallbackShortTime: string
): string {
  if (rawPubDate) {
    const parsed = new Date(rawPubDate);
    if (!Number.isNaN(parsed.getTime())) {
      const monthDay = parsed.toLocaleDateString('ko-KR', {
        timeZone: 'Asia/Seoul',
        month: 'long',
        day: 'numeric',
      });
      const hhmm = parsed.toLocaleTimeString('ko-KR', {
        timeZone: 'Asia/Seoul',
        hour: '2-digit',
        minute: '2-digit',
        hour12: false,
      });
      return `${monthDay} ${hhmm}`;
    }
  }
  return `${fallbackDateLabel} ${fallbackShortTime} 수집`;
}

const CLUSTERING_STOPWORDS = new Set([
  '단독', '속보', '종합', '포토', '영상', '기자', '언론', '보도', '기사', '뉴스',
  '오늘', '내일', '어제', '최근', '올해', '내년', '지난', '이번', '관련', '대한',
  '위해', '통해', '따른', '대해', '에서', '으로', '까지', '부터', '하고', '하는',
  '했다', '한다', '됐다', '된다', '있다', '없다', '이다', '하며', '라며', '라고',
  '밝혀', '강조', '주장', '전망', '예정', '가능', '우려', '논란', '확대', '추진',
  '발표', '공개', '진행', '시작', '결정', '합의', '검토', '요구', '비판', '반발',
  '정부', '한국', '국내', '세계', '글로벌', '시장', '업계', '기업', '대표', '회장',
  '의원', '장관', '대통령', '국회', '서울', '전국', '가운데', '것으로', '이어',
]);

export function extractClusterTokens(text: string): string[] {
  const normalized = (text || '')
    .replace(/\[[^\]]*\]|【[^】]*】|\([^)]*\)/g, ' ')
    .replace(/[‘’“”"'`·…—–\-.,?!:;()[\]{}<>\/\\|@#$%^&*+=~]/g, ' ')
    .toLowerCase();

  const rawWords = normalized.split(/\s+/).filter(Boolean);
  const tokens: string[] = [];

  for (const w of rawWords) {
    const stem = w.replace(/(은|는|이|가|을|를|의|에|서|로|으로|와|과|도|만|까지|부터|에서|에게|한테|보다|처럼)$/, '');
    const candidate = stem.length >= 2 ? stem : w;
    if (candidate.length < 2) continue;
    if (/^\d+$/.test(candidate)) continue;
    if (CLUSTERING_STOPWORDS.has(candidate)) continue;
    tokens.push(candidate);
  }

  return Array.from(new Set(tokens));
}

export function computeTfIdfCosine(
  aWeights: Map<string, number>,
  bWeights: Map<string, number>
): number {
  if (aWeights.size === 0 || bWeights.size === 0) return 0;
  let dot = 0;
  let normA = 0;
  let normB = 0;
  for (const [term, w] of aWeights.entries()) {
    normA += w * w;
    const bw = bWeights.get(term);
    if (bw !== undefined) dot += w * bw;
  }
  for (const w of bWeights.values()) {
    normB += w * w;
  }
  if (normA === 0 || normB === 0) return 0;
  return dot / (Math.sqrt(normA) * Math.sqrt(normB));
}

export function computeArticlePairSimilarity(
  aTitleTokens: Set<string>,
  aBodyTokens: Set<string>,
  aTfIdf: Map<string, number>,
  bTitleTokens: Set<string>,
  bBodyTokens: Set<string>,
  bTfIdf: Map<string, number>
): { score: number; sharedKeywords: string[] } {
  if (aTitleTokens.size === 0 || bTitleTokens.size === 0) {
    return { score: 0, sharedKeywords: [] };
  }

  const sharedTitle: string[] = [];
  for (const t of aTitleTokens) {
    if (bTitleTokens.has(t)) sharedTitle.push(t);
  }

  const sharedCross: string[] = [];
  for (const t of aTitleTokens) {
    if (!bTitleTokens.has(t) && bBodyTokens.has(t)) sharedCross.push(t);
  }
  for (const t of bTitleTokens) {
    if (!aTitleTokens.has(t) && aBodyTokens.has(t)) sharedCross.push(t);
  }

  const sharedKeywords = Array.from(new Set([...sharedTitle, ...sharedCross]));

  if (sharedTitle.length < 2 && !(sharedTitle.length >= 1 && sharedCross.length >= 2)) {
    return { score: 0, sharedKeywords };
  }

  const titleUnionSize = new Set([...aTitleTokens, ...bTitleTokens]).size;
  const titleMinSize = Math.min(aTitleTokens.size, bTitleTokens.size);
  const titleJaccard = titleUnionSize > 0 ? sharedTitle.length / titleUnionSize : 0;
  const titleOverlap = titleMinSize > 0 ? sharedTitle.length / titleMinSize : 0;
  const tfIdfCosine = computeTfIdfCosine(aTfIdf, bTfIdf);

  const combined = tfIdfCosine * 0.45 + titleOverlap * 0.35 + titleJaccard * 0.2;
  return {
    score: Math.min(1, combined),
    sharedKeywords,
  };
}

export function matchesOutletSourceName(
  sourceTagText: string,
  outletName: string,
  logoText?: string
): boolean {
  const cleanSource = decodeHtmlEntities(sourceTagText || '').replace(/\s+/g, '').toLowerCase();
  if (!cleanSource) return false;
  const targets = [outletName, logoText || '']
    .map((s) => s.replace(/\s+/g, '').toLowerCase())
    .filter((s) => s.length >= 2);
  return targets.some((t) => cleanSource === t || cleanSource.includes(t) || t.includes(cleanSource));
}

export function resolveOutletMetaFromPressName(pressNameRaw: string): {
  outletId: string;
  outletName: string;
} {
  const cleanName = (pressNameRaw || '').split('|')[0].trim();
  if (!cleanName) {
    return { outletId: 'hankyung', outletName: '한국경제' };
  }
  const exact = PRESS_OUTLETS.find(
    (p) =>
      p.name === cleanName ||
      p.logoText === cleanName ||
      cleanName.includes(p.name) ||
      p.name.includes(cleanName)
  );
  if (exact) {
    return { outletId: exact.id, outletName: exact.name };
  }
  return { outletId: cleanName.toLowerCase().replace(/[^a-z0-9가-힣]/g, ''), outletName: cleanName };
}

export function extractSectorHighlight(
  title: string,
  summaryText: string
): {
  highlightBadge?: string;
  keyFigure?: string;
  impactRating: 'Crucial' | 'High' | 'Medium';
} {
  const combined = `${title} ${summaryText}`;
  const trillionMatch = combined.match(/([0-9,.]+조(?:\s*[0-9,.]+억)?\s*원?)/);
  const hundredMillionMatch = combined.match(/([0-9,.]+억\s*(?:달러|불|원)?)/);
  const ratioMatch = combined.match(/([0-9,.]+대\s*1)/);
  const pctMatch = combined.match(/([0-9]+(?:\.[0-9]+)?%p?)/);

  const keyFigure = trillionMatch?.[1] || ratioMatch?.[1] || hundredMillionMatch?.[1] || pctMatch?.[1];
  const highlightBadge = keyFigure ? keyFigure.trim() : undefined;

  const impactRating: 'Crucial' | 'High' | 'Medium' =
    /긴급|최대|사상|전격|기준금리|부동산\s*PF|GTX|로또|유예|파장|쇼크|선도지구|용적률/.test(combined)
      ? 'Crucial'
      : keyFigure
      ? 'High'
      : 'Medium';

  return { highlightBadge, keyFigure, impactRating };
}
