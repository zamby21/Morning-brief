import http from 'node:http';
import https from 'node:https';
import zlib from 'node:zlib';
import type {
  DailyBriefing,
  NewsStory,
  BriefingTone,
  SectorHeadlineItem,
  ArticleContentBlock,
} from '../types/news.ts';
import { PRESS_OUTLETS, DEFAULT_10_OUTLETS, SAMPLE_DATA_SNAPSHOT_DATE } from '../data/pressMetadata.ts';
import { getCurrentKoreanDateString } from '../utils/dateUtils.ts';
import { extractSearchKeywords, getOfficialOutletHomepage } from '../utils/linkUtils.ts';
import { transformBriefingTone } from '../utils/toneTransformer.ts';
import { computeKeywordTrends } from '../utils/keywordTrend.ts';

export interface RawRSSArticle {
  outletId: string;
  outletName: string;
  title: string;
  link: string;
  naverUrl?: string;
  pubDate: string;
  snippet: string;
  leadSentences?: string[];
  fullBody?: string;
  articleBlocks?: ArticleContentBlock[];
  leadImage?: string;
  leadImageCaption?: string;
  reporter?: string;
  category?: string;
  isTopLead?: boolean;
}

interface OutletCacheEntry {
  articles: RawRSSArticle[];
  fetchedAt: number;
  kstDate: string;
}

interface OutletFetchHealth {
  okCount: number;
  failCount: number;
  lastOkAt?: string;
  lastErrorAt?: string;
}

// Per-outlet KST-dated short cache (30s) to avoid yesterday bleed and unselected-outlet leakage
const outletCache = new Map<string, OutletCacheEntry>();
const outletFetchHealth = new Map<string, OutletFetchHealth>();
let cachedSectorHeadlines: SectorHeadlineItem[] = [];
let lastSectorFetchedTime = 0;
let lastSectorFetchedKstDate = '';
const CACHE_TTL_MS = 120 * 1000;
const MAX_ARTICLE_AGE_MS = 24 * 60 * 60 * 1000;

function getKstDateKey(date: Date = new Date()): string {
  return date.toLocaleDateString('en-CA', { timeZone: 'Asia/Seoul' });
}

let lastCollectorSuccessAt: string | null = null;

function recordOutletHealth(outletId: string, ok: boolean): void {
  const prev = outletFetchHealth.get(outletId) || { okCount: 0, failCount: 0 };
  const nowIso = new Date().toISOString();
  if (ok) {
    prev.okCount += 1;
    prev.lastOkAt = nowIso;
    lastCollectorSuccessAt = nowIso;
  } else {
    prev.failCount += 1;
    prev.lastErrorAt = nowIso;
  }
  outletFetchHealth.set(outletId, prev);
}

export function getCollectorHealthSnapshot(): {
  status: 'ok' | 'degraded' | 'unavailable';
  trackedOutlets: number;
  healthyOutlets: number;
  degradedOutlets: string[];
  cachedOutletCount: number;
  cachedSectorCount: number;
  lastSuccessAt: string | null;
} {
  let healthyOutlets = 0;
  const degradedOutlets: string[] = [];
  for (const [id, stat] of outletFetchHealth.entries()) {
    const lastOk = stat.lastOkAt ? Date.parse(stat.lastOkAt) : 0;
    const lastErr = stat.lastErrorAt ? Date.parse(stat.lastErrorAt) : 0;
    if (stat.okCount > 0 && lastOk >= lastErr) {
      healthyOutlets += 1;
    } else if (stat.failCount > 0) {
      degradedOutlets.push(id);
    }
  }
  const status: 'ok' | 'degraded' | 'unavailable' =
    outletFetchHealth.size === 0
      ? 'ok'
      : healthyOutlets === 0
      ? 'unavailable'
      : degradedOutlets.length > 0
      ? 'degraded'
      : 'ok';
  return {
    status,
    trackedOutlets: outletFetchHealth.size,
    healthyOutlets,
    degradedOutlets: degradedOutlets.slice(0, 15),
    cachedOutletCount: outletCache.size,
    cachedSectorCount: cachedSectorHeadlines.length,
    lastSuccessAt: lastCollectorSuccessAt,
  };
}

function parseKstDateTimeString(raw: string): string | undefined {
  const trimmed = (raw || '').trim();
  if (!trimmed) return undefined;
  // Format: "2026-11-22 07:15:30" or "2026-11-22 07:15"
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

function extractRealPubDateFromHtml(html: string): string | undefined {
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

function isWithinLast24Hours(pubDateRaw: string | undefined, nowMs = Date.now()): boolean {
  if (!pubDateRaw) return true;
  const ts = Date.parse(pubDateRaw);
  if (Number.isNaN(ts)) return true;
  const age = nowMs - ts;
  // Allow slight clock skew up to 2h in the future; reject anything older than 24h
  return age >= -2 * 60 * 60 * 1000 && age <= MAX_ARTICLE_AGE_MS;
}

function normalizeTitleForDedup(title: string): string {
  return (title || '')
    .replace(/\[[^\]]*\]|【[^】]*】|\([^)]*\)/g, ' ')
    .replace(/[^a-zA-Z0-9가-힣\s]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    .toLowerCase();
}

function areTitlesNearDuplicate(a: string, b: string): boolean {
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

// Verified official Naver Press Desk (media.naver.com/press/{naverCode}) directory for all Naver CP outlets
export const OUTLET_PRESS_DESK_MAP: Record<
  string,
  { name: string; naverCode: string; homepageUrl: string }
> = {
  // 10대 대표 종합·경제지 (기본값)
  mk: { name: '매일경제', naverCode: '009', homepageUrl: 'https://www.mk.co.kr' },
  hankyung: { name: '한국경제', naverCode: '015', homepageUrl: 'https://www.hankyung.com' },
  chosun: { name: '조선일보', naverCode: '023', homepageUrl: 'https://www.chosun.com' },
  joongang: { name: '중앙일보', naverCode: '025', homepageUrl: 'https://www.joongang.co.kr' },
  donga: { name: '동아일보', naverCode: '020', homepageUrl: 'https://www.donga.com' },
  hani: { name: '한겨레', naverCode: '028', homepageUrl: 'https://www.hani.co.kr' },
  khan: { name: '경향신문', naverCode: '032', homepageUrl: 'https://www.khan.co.kr' },
  sedaily: { name: '서울경제', naverCode: '011', homepageUrl: 'https://www.sedaily.com' },
  herald: { name: '헤럴드경제', naverCode: '016', homepageUrl: 'https://biz.heraldcorp.com' },
  asiae: { name: '아시아경제', naverCode: '277', homepageUrl: 'https://www.asiae.co.kr' },

  // 종합·경제·전문지 (Naver CP 공식 코드 검증 완료)
  kmib: { name: '국민일보', naverCode: '005', homepageUrl: 'https://www.kmib.co.kr' },
  hankookilbo: { name: '한국일보', naverCode: '469', homepageUrl: 'https://www.hankookilbo.com' },
  munhwa: { name: '문화일보', naverCode: '021', homepageUrl: 'https://www.munhwa.com' },
  seoul: { name: '서울신문', naverCode: '081', homepageUrl: 'https://www.seoul.co.kr' },
  segye: { name: '세계일보', naverCode: '022', homepageUrl: 'https://www.segye.com' },
  mt: { name: '머니투데이', naverCode: '008', homepageUrl: 'https://www.mt.co.kr' },
  edaily: { name: '이데일리', naverCode: '018', homepageUrl: 'https://www.edaily.co.kr' },
  fnnews: { name: '파이낸셜뉴스', naverCode: '014', homepageUrl: 'https://www.fnnews.com' },
  chosunbiz: { name: '조선비즈', naverCode: '366', homepageUrl: 'https://biz.chosun.com' },
  nocut: { name: '노컷뉴스', naverCode: '079', homepageUrl: 'https://www.nocutnews.co.kr' },
  newstapa: { name: '뉴스타파', naverCode: '607', homepageUrl: 'https://newstapa.org' },
  thefact: { name: '더팩트', naverCode: '629', homepageUrl: 'https://www.tf.co.kr' },
  dailian: { name: '데일리안', naverCode: '119', homepageUrl: 'https://www.dailian.co.kr' },
  sidae: { name: '동행미디어 시대', naverCode: '417', homepageUrl: 'https://www.sidaenews.co.kr' },
  mediatoday: { name: '미디어오늘', naverCode: '006', homepageUrl: 'https://www.mediatoday.co.kr' },
  bizwatch: { name: '비즈워치', naverCode: '648', homepageUrl: 'https://news.bizwatch.co.kr' },
  inews24: { name: '아이뉴스24', naverCode: '031', homepageUrl: 'https://www.inews24.com' },
  ohmynews: { name: '오마이뉴스', naverCode: '047', homepageUrl: 'https://www.ohmynews.com' },
  economist: { name: '이코노미스트', naverCode: '243', homepageUrl: 'https://economist.co.kr' },
  joseilbo: { name: '조세일보', naverCode: '123', homepageUrl: 'https://www.joseilbo.com' },
  joongangsunday: { name: '중앙SUNDAY', naverCode: '353', homepageUrl: 'https://www.joongang.co.kr/sunday' },
  pressian: { name: '프레시안', naverCode: '002', homepageUrl: 'https://www.pressian.com' },

  // 방송·통신사
  yonhap: { name: '연합뉴스', naverCode: '001', homepageUrl: 'https://www.yna.co.kr' },
  news1: { name: '뉴스1', naverCode: '421', homepageUrl: 'https://www.news1.kr' },
  newsis: { name: '뉴시스', naverCode: '003', homepageUrl: 'https://www.newsis.com' },
  kbs: { name: 'KBS', naverCode: '056', homepageUrl: 'https://news.kbs.co.kr' },
  mbc: { name: 'MBC', naverCode: '214', homepageUrl: 'https://imnews.imbc.com' },
  sbs: { name: 'SBS', naverCode: '055', homepageUrl: 'https://news.sbs.co.kr' },
  ytn: { name: 'YTN', naverCode: '052', homepageUrl: 'https://www.ytn.co.kr' },
  jtbc: { name: 'JTBC', naverCode: '437', homepageUrl: 'https://news.jtbc.co.kr' },
  tvchosun: { name: 'TV조선', naverCode: '448', homepageUrl: 'http://news.tvchosun.com' },
  mbn: { name: 'MBN', naverCode: '057', homepageUrl: 'https://www.mbn.co.kr' },
  channela: { name: '채널A', naverCode: '449', homepageUrl: 'https://www.ichannela.com' },
  yonhaptv: { name: '연합뉴스TV', naverCode: '422', homepageUrl: 'https://www.yonhapnewstv.co.kr' },
  wowtv: { name: '한국경제TV', naverCode: '215', homepageUrl: 'https://www.wowtv.co.kr' },
  sbsbiz: { name: 'SBS 비즈', naverCode: '374', homepageUrl: 'https://biz.sbs.co.kr' },
  kbc: { name: 'kbc광주방송', naverCode: '660', homepageUrl: 'https://www.ikbc.co.kr' },

  // IT 전문지
  etnews: { name: '전자신문', naverCode: '030', homepageUrl: 'https://www.etnews.com' },
  zdnet: { name: '지디넷코리아', naverCode: '092', homepageUrl: 'https://zdnet.co.kr' },
  bloter: { name: '블로터', naverCode: '293', homepageUrl: 'https://www.bloter.net' },
  ddaily: { name: '디지털데일리', naverCode: '138', homepageUrl: 'https://www.ddaily.co.kr' },
  dt: { name: '디지털타임스', naverCode: '029', homepageUrl: 'https://www.dt.co.kr' },

  // 지역 주요 언론사
  gangwon_domin: { name: '강원도민일보', naverCode: '654', homepageUrl: 'https://www.kado.net' },
  gangwon_ilbo: { name: '강원일보', naverCode: '087', homepageUrl: 'https://www.kwnews.co.kr' },
  gyeonggi_ilbo: { name: '경기일보', naverCode: '666', homepageUrl: 'https://www.kyeonggi.com' },
  kookje_shinmun: { name: '국제신문', naverCode: '658', homepageUrl: 'http://www.kookje.co.kr' },
  daejeon_ilbo: { name: '대전일보', naverCode: '656', homepageUrl: 'https://www.daejonilbo.com' },
  imaeil: { name: '매일신문', naverCode: '088', homepageUrl: 'https://www.imaeil.com' },
  busan_ilbo: { name: '부산일보', naverCode: '082', homepageUrl: 'https://www.busan.com' },
};

const BROWSER_HEADERS: Record<string, string> = {
  'User-Agent':
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
  'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
  'Accept-Language': 'ko-KR,ko;q=0.9,en-US;q=0.8,en;q=0.7',
  'Accept-Encoding': 'gzip, deflate, br',
};

function decodeHtmlBuffer(buf: Buffer, contentTypeHeader = ''): string {
  const ct = contentTypeHeader.toLowerCase();
  const headAscii = buf.subarray(0, 2048).toString('latin1').toLowerCase();
  const isEucKr =
    ct.includes('euc-kr') ||
    ct.includes('ks_c_5601') ||
    ct.includes('cp949') ||
    /charset\s*=\s*['"]?(?:euc-kr|ks_c_5601|cp949)/.test(headAscii);

  if (isEucKr) {
    try {
      return new TextDecoder('euc-kr').decode(buf);
    } catch {
      return buf.toString('utf8');
    }
  }
  return buf.toString('utf8');
}

/**
 * IPv4-guaranteed fast HTML fetcher (avoids container IPv6 DNS hangs on Naver/Korean news domains)
 * Automatically decodes gzip/br/deflate and EUC-KR/CP949 legacy Korean press encodings.
 */
async function fetchHtmlFast(
  url: string,
  timeoutMs = 4500,
  redirectsLeft = 4,
  retriesLeft = 1
): Promise<{ ok: boolean; status: number; text: string; finalUrl: string }> {
  const attempt = (): Promise<{ ok: boolean; status: number; text: string; finalUrl: string }> =>
    new Promise((resolve) => {
      let settled = false;
      const done = (resObj: { ok: boolean; status: number; text: string; finalUrl: string }) => {
        if (!settled) {
          settled = true;
          resolve(resObj);
        }
      };

      try {
        const parsed = new URL(url);
        const lib = parsed.protocol === 'https:' ? https : http;
        const req = lib.get(
          url,
          {
            family: 4,
            timeout: timeoutMs,
            headers: BROWSER_HEADERS,
          },
          (res) => {
            const status = res.statusCode || 0;
            if (status >= 300 && status < 400 && res.headers.location && redirectsLeft > 0) {
              res.resume();
              const nextUrl = new URL(res.headers.location, url).toString();
              fetchHtmlFast(nextUrl, timeoutMs, redirectsLeft - 1, retriesLeft).then(done);
              return;
            }

            const chunks: Buffer[] = [];
            res.on('data', (chunk) => chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk)));
            res.on('end', () => {
              try {
                const raw = Buffer.concat(chunks);
                const enc = (res.headers['content-encoding'] || '').toLowerCase();
                let buf: Buffer = raw;
                if (enc.includes('gzip')) buf = zlib.gunzipSync(raw);
                else if (enc.includes('br')) buf = zlib.brotliDecompressSync(raw);
                else if (enc.includes('deflate')) buf = zlib.inflateSync(raw);
                const decodedText = decodeHtmlBuffer(buf, String(res.headers['content-type'] || ''));
                done({ ok: status >= 200 && status < 300, status, text: decodedText, finalUrl: url });
              } catch {
                done({ ok: false, status, text: '', finalUrl: url });
              }
            });
            res.on('error', () => done({ ok: false, status, text: '', finalUrl: url }));
          }
        );
        req.on('timeout', () => {
          req.destroy();
          done({ ok: false, status: 0, text: '', finalUrl: url });
        });
        req.on('error', () => done({ ok: false, status: 0, text: '', finalUrl: url }));
      } catch {
        done({ ok: false, status: 0, text: '', finalUrl: url });
      }
    });

  const first = await attempt();
  if (!first.ok && first.status === 0 && retriesLeft > 0) {
    return fetchHtmlFast(url, timeoutMs, redirectsLeft, retriesLeft - 1);
  }
  return first;
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

function normalizeArticleUrl(href: string, baseUrl: string): string {
  if (!href) return baseUrl;
  const trimmed = href.trim();
  if (trimmed.startsWith('//')) return `https:${trimmed}`;
  if (trimmed.startsWith('/')) return `${baseUrl.replace(/\/$/, '')}${trimmed}`;
  return trimmed;
}

const BOILERPLATE_SUBSTRINGS = [
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

function stripInlineTagsCleanly(html: string): string {
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

function stripReporterEmailSuffix(text: string): string {
  return (text || '')
    .replace(/\s*[가-힣]{2,4}\s*기자\s*[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}\.?$/g, '')
    .replace(/\s+[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}\.?$/g, '')
    .trim();
}

function isCleanBodySentence(s: string): boolean {
  if (!s || s.length < 20 || s.length > 480) return false;
  if (!/[.?!다요음임함됨]["'”’)\]]*$/.test(s)) return false;
  if (s.includes('http://') || s.includes('https://') || s.includes('&lt;') || s.includes('@')) return false;
  return !BOILERPLATE_SUBSTRINGS.some((bad) => s.includes(bad));
}

function isCleanParagraph(p: string): boolean {
  if (!p || p.length < 28 || p.length > 1100) return false;
  if (!/[.?!다요음임함됨]["'”’)\]]*$/.test(p)) return false;
  if (p.includes('http://') || p.includes('https://') || p.includes('@')) return false;
  return !BOILERPLATE_SUBSTRINGS.some((bad) => p.includes(bad));
}

function isCleanVerbatimLine(p: string): boolean {
  if (!p || p.length < 12 || p.length > 2000) return false;
  if (p.includes('http://') || p.includes('https://') || p.includes('&lt;')) return false;
  // Filter pure email/byline-only lines, but keep genuine body sentences/quotes/subheadings
  if (/^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/.test(p)) return false;
  if (/^[가-힣]{2,4}\s*기자\s*$/.test(p)) return false;
  if (p.length < 28 && !/[.?!다요음임함됨"'”’]/.test(p)) return false;
  return !BOILERPLATE_SUBSTRINGS.some((bad) => p.includes(bad));
}

function isCleanSubheading(s: string): boolean {
  if (!s || s.length < 6 || s.length > 140) return false;
  if (s.includes('http://') || s.includes('https://') || s.includes('@')) return false;
  return !BOILERPLATE_SUBSTRINGS.some((bad) => s.includes(bad));
}

function splitLongParagraphCleanly(text: string): string[] {
  const normalized = (text || '')
    // Separate fused Korean sentence boundaries (e.g. "커지고 있다.19일" -> "커지고 있다. 19일")
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

function resolveArticleImageUrl(rawUrl: string, baseUrl: string): string | null {
  if (!rawUrl) return null;
  const cleaned = decodeHtmlEntities(rawUrl).trim().replace(/^['"]|['"]$/g, '');
  if (!cleaned || cleaned.startsWith('data:') || cleaned.startsWith('javascript:')) return null;

  let abs = cleaned;
  try {
    if (cleaned.startsWith('//')) {
      abs = `https:${cleaned}`;
    } else if (!/^https?:\/\//i.test(cleaned)) {
      abs = baseUrl ? new URL(cleaned, baseUrl).toString() : '';
    }
  } catch {
    return null;
  }
  if (!/^https?:\/\//i.test(abs)) return null;

  const lower = abs.toLowerCase();
  if (/\.(?:svg|ico)(?:\?|$)/i.test(lower)) return null;
  if (
    /(?:\/icon|\/icons\/|\/logo|logo_|_logo|\/btn|btn_|_btn|banner|\/ad\/|\/ads\/|ad_|doubleclick|googlesyndication|blank\.|spacer\.|1x1|pixel\.|sprite|share_|sns_|journalist_img|profile_|avatar|loading\.gif|noimage|no_img|default_img|common\/img\/ic_|static\.news\.naver\.net\/image\/news\/m\/20|ssl\.pstatic\.net\/static\/newsstand|dthumb-phinf\.pstatic\.net\/.*type=nf)/i.test(
      lower
    )
  ) {
    return null;
  }
  return abs;
}

function extractImgSrcFromTag(imgTag: string, baseUrl: string): string | null {
  // Skip tiny tracking pixels / UI icons based on explicit width/height attributes
  const widthM = imgTag.match(/\bwidth\s*=\s*["']?(\d+)/i);
  const heightM = imgTag.match(/\bheight\s*=\s*["']?(\d+)/i);
  if ((widthM && Number(widthM[1]) > 0 && Number(widthM[1]) < 80) || (heightM && Number(heightM[1]) > 0 && Number(heightM[1]) < 60)) {
    return null;
  }

  const attrPriority = [
    /\bdata-src\s*=\s*["']([^"']+)["']/i,
    /\bdata-lazy-src\s*=\s*["']([^"']+)["']/i,
    /\bdata-original\s*=\s*["']([^"']+)["']/i,
    /\bdata-origin\s*=\s*["']([^"']+)["']/i,
    /\bdata-img-src\s*=\s*["']([^"']+)["']/i,
    /\bsrc\s*=\s*["']([^"']+)["']/i,
  ];
  for (const re of attrPriority) {
    const m = imgTag.match(re);
    if (m && m[1]) {
      const resolved = resolveArticleImageUrl(m[1], baseUrl);
      if (resolved) return resolved;
    }
  }
  return null;
}

function extractOgImage(articleHtml: string, articleUrl: string): string | undefined {
  const raw =
    articleHtml.match(/<meta[^>]+property=["']og:image["'][^>]+content=["']([^"']+)["']/i)?.[1] ||
    articleHtml.match(/<meta[^>]+content=["']([^"']+)["'][^>]+property=["']og:image["']/i)?.[1] ||
    articleHtml.match(/<meta[^>]+name=["']twitter:image["'][^>]+content=["']([^"']+)["']/i)?.[1] ||
    '';
  return resolveArticleImageUrl(raw, articleUrl) || undefined;
}

function extractReporterName(articleHtml: string): string | undefined {
  const raw =
    articleHtml.match(/<em[^>]*class=["'][^"']*media_end_head_journalist_name[^"']*["'][^>]*>([\s\S]*?)<\/em>/i)?.[1] ||
    articleHtml.match(/<span[^>]*class=["'][^"']*byline_s[^"']*["'][^>]*>([\s\S]*?)<\/span>/i)?.[1] ||
    articleHtml.match(/<meta[^>]+(?:name|property)=["'](?:dable:author|author|article:author)["'][^>]+content=["']([^"']+)["']/i)?.[1] ||
    '';
  const cleaned = decodeHtmlEntities(raw.replace(/<[^>]+>/g, ' '))
    .replace(/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g, '')
    .replace(/\s+/g, ' ')
    .trim();
  if (cleaned && cleaned.length >= 2 && cleaned.length <= 40 && !cleaned.startsWith('http')) {
    return cleaned;
  }
  return undefined;
}

/**
 * Extracts ordered verbatim article blocks (inline photos with captions, editorial subheadings,
 * and complete body paragraphs without artificial truncation) directly from an article body HTML fragment.
 */
function extractOrderedArticleBlocks(containerHtml: string, baseUrl: string): ArticleContentBlock[] {
  if (!containerHtml) return [];

  let work = containerHtml
    .replace(/<(?:script|style|noscript|iframe|aside|nav|form|button|svg)[\s\S]*?<\/(?:script|style|noscript|iframe|aside|nav|form|button|svg)>/gi, '\n')
    .replace(/<div[^>]*class=["'][^"']*(?:vod_player|video_area|ad_wrap|art_ad|related_news|reporter_area|copyright|byline_wrap|share_area|sns_area|news_like|tag_area)[^"']*["'][^>]*>[\s\S]*?<\/div>/gi, '\n');

  const placeholders: ArticleContentBlock[] = [];
  const seenImages = new Set<string>();
  const registerBlock = (block: ArticleContentBlock): string => {
    const idx = placeholders.length;
    placeholders.push(block);
    return `\n[[ART_BLOCK_${idx}]]\n`;
  };

  // 1. Naver News inline photo + caption (<span class="end_photo_org">...</span> + optional <em class="img_desc">...</em>)
  work = work.replace(
    /<span[^>]*class=["'][^"']*end_photo_org[^"']*["'][^>]*>([\s\S]*?)<\/span>(?:\s*(?:<br\s*\/?>|\s)*<em[^>]*class=["'][^"']*img_desc[^"']*["'][^>]*>([\s\S]*?)<\/em>)?/gi,
    (_m, spanInner: string, capInner?: string) => {
      const imgTag = spanInner.match(/<img[^>]+>/i)?.[0] || '';
      const imgUrl = extractImgSrcFromTag(imgTag, baseUrl);
      if (!imgUrl || seenImages.has(imgUrl)) return '\n';
      seenImages.add(imgUrl);
      const caption = capInner
        ? decodeHtmlEntities(capInner.replace(/<br\s*\/?>/gi, ' ').replace(/<[^>]+>/g, ' ')).trim()
        : decodeHtmlEntities(imgTag.match(/\balt=["']([^"']+)["']/i)?.[1] || '').trim();
      return registerBlock({
        type: 'image',
        url: imgUrl,
        caption: caption && caption.length >= 2 && caption !== '이미지' ? caption : undefined,
      });
    }
  );

  // 2. Standard HTML5 <figure> ... <img> ... <figcaption> ... </figure>
  work = work.replace(/<figure[^>]*>([\s\S]*?)<\/figure>/gi, (_m, figInner: string) => {
    const imgTag = figInner.match(/<img[^>]+>/i)?.[0] || '';
    const imgUrl = extractImgSrcFromTag(imgTag, baseUrl);
    if (!imgUrl || seenImages.has(imgUrl)) return '\n';
    seenImages.add(imgUrl);
    const capMatch =
      figInner.match(/<figcaption[^>]*>([\s\S]*?)<\/figcaption>/i)?.[1] ||
      figInner.match(/<(?:p|span|div|em)[^>]*class=["'][^"']*(?:caption|img_desc|desc|txt)[^"']*["'][^>]*>([\s\S]*?)<\/(?:p|span|div|em)>/i)?.[1] ||
      '';
    const caption = decodeHtmlEntities(capMatch.replace(/<br\s*\/?>/gi, ' ').replace(/<[^>]+>/g, ' ')).trim() ||
      decodeHtmlEntities(imgTag.match(/\balt=["']([^"']+)["']/i)?.[1] || '').trim();
    return registerBlock({
      type: 'image',
      url: imgUrl,
      caption: caption && caption.length >= 2 && caption !== '이미지' ? caption : undefined,
    });
  });

  // 3. Remaining standalone <img> tags inside article body (optionally followed by caption element)
  work = work.replace(
    /<img[^>]+>(?:\s*(?:<\/a>|<\/span>|<br\s*\/?>|\s)*<(?:em|figcaption|p|span|div)[^>]*class=["'][^"']*(?:img_desc|caption|photo_desc|img_txt|photo_cap)[^"']*["'][^>]*>([\s\S]*?)<\/(?:em|figcaption|p|span|div)>)?/gi,
    (fullMatch: string, capInner?: string) => {
      const imgTag = fullMatch.match(/<img[^>]+>/i)?.[0] || '';
      const imgUrl = extractImgSrcFromTag(imgTag, baseUrl);
      if (!imgUrl || seenImages.has(imgUrl)) return '\n';
      seenImages.add(imgUrl);
      const caption = capInner
        ? decodeHtmlEntities(capInner.replace(/<br\s*\/?>/gi, ' ').replace(/<[^>]+>/g, ' ')).trim()
        : decodeHtmlEntities(imgTag.match(/\balt=["']([^"']+)["']/i)?.[1] || '').trim();
      return registerBlock({
        type: 'image',
        url: imgUrl,
        caption: caption && caption.length >= 2 && caption !== '이미지' ? caption : undefined,
      });
    }
  );

  // Strip stray orphan img_desc captions after images were extracted
  work = work.replace(/<em[^>]*class=["'][^"']*img_desc[^"']*["'][^>]*>[\s\S]*?<\/em>/gi, '\n');

  // 4. Editorial subheadings (<strong class="media_end_summary">, <h2>, <h3>, <h4>)
  work = work.replace(
    /<strong[^>]*class=["'][^"']*media_end_summary[^"']*["'][^>]*>([\s\S]*?)<\/strong>/gi,
    (_m, inner: string) => {
      const text = decodeHtmlEntities(inner.replace(/<br\s*\/?>/gi, ' · ').replace(/<[^>]+>/g, ' ')).trim();
      return isCleanSubheading(text) ? registerBlock({ type: 'subheading', text }) : '\n';
    }
  );
  work = work.replace(/<h[2-4][^>]*>([\s\S]*?)<\/h[2-4]>/gi, (_m, inner: string) => {
    const text = decodeHtmlEntities(inner.replace(/<br\s*\/?>/gi, ' ').replace(/<[^>]+>/g, ' ')).trim();
    return isCleanSubheading(text) ? registerBlock({ type: 'subheading', text }) : '\n';
  });

  // 5. Convert block-level separators into newlines and strip remaining inline formatting tags
  const textWithMarkers = work
    .replace(/<\/?(?:a|span|strong|em|b|i|u|mark|font|small)[^>]*>/gi, '')
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/<(?:p|div|li|blockquote)(?:\s+[^>]*)?>/gi, '\n')
    .replace(/<\/(?:p|div|li|blockquote)>/gi, '\n')
    .replace(/<[^>]+>/g, ' ');

  const rawLines = textWithMarkers
    .split(/\n+/)
    .map((line) => decodeHtmlEntities(line).trim())
    .filter(Boolean);

  const blocks: ArticleContentBlock[] = [];
  const seenTextKeys = new Set<string>();

  for (const line of rawLines) {
    const markerMatch = line.match(/^\[\[ART_BLOCK_(\d+)\]\]$/);
    if (markerMatch) {
      const blk = placeholders[Number(markerMatch[1])];
      if (blk) blocks.push(blk);
      continue;
    }

    // Handle cases where text and marker appear on the same line
    if (line.includes('[[ART_BLOCK_')) {
      const parts = line.split(/(\[\[ART_BLOCK_\d+\]\])/g).map((x) => x.trim()).filter(Boolean);
      for (const part of parts) {
        const mm = part.match(/^\[\[ART_BLOCK_(\d+)\]\]$/);
        if (mm) {
          const blk = placeholders[Number(mm[1])];
          if (blk) blocks.push(blk);
        } else {
          const cleaned = stripReporterEmailSuffix(part.replace(/\s+/g, ' ').trim());
          for (const para of splitLongParagraphCleanly(cleaned)) {
            if (isCleanVerbatimLine(para)) {
              const key = para.slice(0, 28);
              if (!seenTextKeys.has(key)) {
                seenTextKeys.add(key);
                blocks.push({ type: 'text', text: para });
              }
            }
          }
        }
      }
      continue;
    }

    const cleaned = stripReporterEmailSuffix(line.replace(/\s+/g, ' ').trim());
    for (const para of splitLongParagraphCleanly(cleaned)) {
      if (isCleanVerbatimLine(para)) {
        const key = para.slice(0, 28);
        if (!seenTextKeys.has(key)) {
          seenTextKeys.add(key);
          blocks.push({ type: 'text', text: para });
        }
      }
    }

    if (blocks.length >= 120) break;
  }

  return blocks;
}

/**
 * Extracts ordered text, header, and image blocks from Chosun Fusion JSON payloads
 */
function extractChosunFusionBlocks(articleHtml: string, articleUrl: string): ArticleContentBlock[] {
  const blocks: ArticleContentBlock[] = [];
  const seenImages = new Set<string>();
  const seenText = new Set<string>();

  // Match Fusion JSON content_elements in sequence (text, header, image)
  const tokenRe =
    /"content":"((?:[^"\\]|\\.)*)","type":"(text|header)"|"caption":"((?:[^"\\]|\\.)*)"[^}]{0,400}"type":"image"[^}]{0,400}"url":"(https?:\/\/[^"]+)"|"type":"image"[^}]{0,400}"url":"(https?:\/\/[^"]+)"(?:[^}]{0,400}"caption":"((?:[^"\\]|\\.)*)")?/g;

  for (const m of articleHtml.matchAll(tokenRe)) {
    if (m[2] === 'text' || m[2] === 'header') {
      const raw = decodeHtmlEntities(
        (m[1] || '')
          .replace(/\\"/g, '"')
          .replace(/\\n/g, ' ')
          .replace(/\\u003c/gi, '<')
          .replace(/\\u003e/gi, '>')
          .replace(/<\/?(?:a|span|strong|em|b|i|u)[^>]*>/gi, '')
          .replace(/<[^>]+>/g, ' ')
      ).trim();
      const cleaned = stripReporterEmailSuffix(raw);
      if (m[2] === 'header' && isCleanSubheading(cleaned)) {
        blocks.push({ type: 'subheading', text: cleaned });
      } else if (isCleanVerbatimLine(cleaned)) {
        const key = cleaned.slice(0, 28);
        if (!seenText.has(key)) {
          seenText.add(key);
          blocks.push({ type: 'text', text: cleaned });
        }
      }
    } else {
      const imgUrlRaw = m[4] || m[5] || '';
      const capRaw = m[3] || m[6] || '';
      const imgUrl = resolveArticleImageUrl(imgUrlRaw, articleUrl);
      if (imgUrl && !seenImages.has(imgUrl)) {
        seenImages.add(imgUrl);
        const caption = decodeHtmlEntities(capRaw.replace(/\\"/g, '"').replace(/\\n/g, ' ').replace(/<[^>]+>/g, ' ')).trim();
        blocks.push({
          type: 'image',
          url: imgUrl,
          caption: caption && caption.length >= 2 ? caption : undefined,
        });
      }
    }
    if (blocks.length >= 120) break;
  }

  return blocks;
}

function extractArticleTextAndSummary(
  articleHtml: string,
  homepageBullets: string[] = [],
  homepagePrologue = '',
  articleUrl = ''
): {
  sentences: string[];
  fullBody: string;
  articleBlocks: ArticleContentBlock[];
  leadImage?: string;
  leadImageCaption?: string;
  reporter?: string;
} {
  const paragraphPool: string[] = [];
  const fullBodyParas: string[] = [];
  let orderedBlocks: ArticleContentBlock[] = [];
  const reporter = extractReporterName(articleHtml);

  const pushLinesToPools = (rawLines: string[]) => {
    const cleanedLines = rawLines
      .flatMap((s) => splitLongParagraphCleanly(stripReporterEmailSuffix(s.replace(/\s+/g, ' ').trim())))
      .filter(Boolean);

    const paras = cleanedLines.filter(isCleanVerbatimLine);
    fullBodyParas.push(...paras);

    for (const line of cleanedLines) {
      const sents = line
        .split(/(?<=[.?!]["'”’)?]*)\s+/)
        .map((s) => stripReporterEmailSuffix(s.trim()))
        .filter(isCleanBodySentence);
      paragraphPool.push(...sents);
    }

    if (fullBodyParas.length < 2 && paragraphPool.length >= 2) {
      for (let i = 0; i < paragraphPool.length; i += 2) {
        const chunk = paragraphPool.slice(i, i + 2).join(' ');
        if (chunk.length >= 28) fullBodyParas.push(chunk);
      }
    }
  };

  const absorbOrderedBlocks = (blocks: ArticleContentBlock[]) => {
    if (blocks.length === 0) return;
    orderedBlocks = blocks;
    const textLines = blocks
      .filter((b) => b.type === 'text' && b.text)
      .map((b) => b.text as string);
    pushLinesToPools(textLines);
  };

  // 1. Naver News article page: scope strictly to dic_area / articeBody (preserves ALL text + inline photos + captions)
  const dicArea =
    articleHtml.match(/<article[^>]*id=["']dic_area["'][^>]*>([\s\S]*?)<\/article>/i)?.[1] ||
    articleHtml.match(/<div[^>]*id=["'](?:dic_area|articeBody|newsEndContents)["'][^>]*>([\s\S]*?)<\/div>\s*(?:<div[^>]*class=["'][^"']*(?:byline|copyright|news_end|reporter|media_end))/i)?.[1] ||
    articleHtml.match(/<div[^>]*class=["'][^"']*newsct_article[^"']*["'][^>]*>([\s\S]*?)<\/article>/i)?.[1];

  if (dicArea || articleUrl.includes('news.naver.com')) {
    if (dicArea) {
      absorbOrderedBlocks(extractOrderedArticleBlocks(dicArea, articleUrl));
    }
  } else {
    // 2. Donga Ilbo <section class="news_view"> (keeps inline photos + full verbatim text)
    const dongaView =
      articleHtml.match(/class="news_view"[^>]*>([\s\S]*?)<div class="news_like_wrap/i)?.[1] ||
      articleHtml.match(/class="news_view"[^>]*>([\s\S]*?)<\/section>/i)?.[1];

    if (dongaView && articleUrl.includes('donga.com')) {
      const cleanedDonga = dongaView.replace(/<div[^>]*class=["'][^"']*view_(?:m_ad|ad|relation|series)[^"']*["'][^>]*>[\s\S]*?<\/div>/gi, '\n');
      absorbOrderedBlocks(extractOrderedArticleBlocks(cleanedDonga, articleUrl));
    }

    // 3. Chosun Fusion JSON content elements (ordered text + headers + inline images)
    if (fullBodyParas.length < 2) {
      const fusionOrdered = extractChosunFusionBlocks(articleHtml, articleUrl);
      if (fusionOrdered.some((b) => b.type === 'text')) {
        absorbOrderedBlocks(fusionOrdered);
      }
    }

    // 4. Common Korean press CMS body containers (covers Edaily, SBS, JoongAng, MK, Hankyung, NewsTomato, regional CMS)
    if (fullBodyParas.length < 2) {
      const cmsContainerMatch =
        articleHtml.match(/<(?:article|div|section)[^>]*(?:id|class)=["'][^"']*(?:article-view-content-div|article_body|articleBody|news_body|news_text|rns_text|text_area|art_txt|article_txt|view_con|news_cnt|content_body|article_view_body)[^"']*["'][^>]*>([\s\S]*?)<\/(?:article|section)>/i)?.[1] ||
        articleHtml.match(/<div[^>]*(?:id|class)=["'][^"']*(?:article-view-content-div|article_body|articleBody|news_body|news_text|rns_text|text_area|art_txt|article_txt|view_con|news_cnt)[^"']*["'][^>]*>([\s\S]{150,45000}?)(?:<div[^>]*class=["'][^"']*(?:copyright|byline|reporter|share|related|tag|banner|ad_|comment)|<\/section>|<\/article>)/i)?.[1] ||
        articleHtml.match(/itemprop=["']articleBody["'][^>]*>([\s\S]{150,45000}?)(?:<\/article>|<\/section>|<div[^>]*class=["'][^"']*(?:copyright|byline|related|share))/i)?.[1];

      if (cmsContainerMatch) {
        absorbOrderedBlocks(extractOrderedArticleBlocks(cmsContainerMatch, articleUrl));
      }
    }

    // 5. Standard <p> body paragraphs from newspaper article pages
    if (fullBodyParas.length < 2) {
      const bodyOnly = articleHtml.replace(
        /<(?:header|footer|nav|aside|script|style)[\s\S]*?<\/(?:header|footer|nav|aside|script|style)>/gi,
        ' '
      );
      const pMatches = [...bodyOnly.matchAll(/<p(?:\s+[^>]*)?>([\s\S]*?)<\/p>/gi)];
      const pLines: string[] = [];
      for (const pm of pMatches) {
        const clean = stripInlineTagsCleanly(pm[1]).replace(/\s+/g, ' ').trim();
        if (clean) pLines.push(clean);
      }
      pushLinesToPools(pLines);
    }

    // 6. JSON-LD articleBody fallback
    if (fullBodyParas.length < 2 || paragraphPool.length < 3) {
      const ldMatches = [
        ...articleHtml.matchAll(/<script[^>]*type="application\/ld\+json"[^>]*>([\s\S]*?)<\/script>/gi),
      ];
      for (const m of ldMatches) {
        try {
          const json = JSON.parse(m[1]);
          const body =
            json?.articleBody ||
            (Array.isArray(json) ? json.find((x: any) => x?.articleBody)?.articleBody : '') ||
            (Array.isArray(json?.['@graph']) ? json['@graph'].find((x: any) => x?.articleBody)?.articleBody : '');
          if (body && typeof body === 'string' && body.length > 80) {
            const cleanBody = decodeHtmlEntities(body.replace(/<[^>]+>/g, ' '));
            pushLinesToPools(cleanBody.split(/\n+/));
          }
        } catch {
          // Ignore malformed JSON-LD
        }
      }
    }

    // 7. Generic <br>-delimited body line fallback for legacy Korean sites that avoid <p> tags
    if (fullBodyParas.length < 2) {
      const strippedAll = articleHtml
        .replace(/<(?:head|script|style|header|footer|nav|aside|noscript|iframe|form)[\s\S]*?<\/(?:head|script|style|header|footer|nav|aside|noscript|iframe|form)>/gi, '\n');
      const rawLines = stripInlineTagsCleanly(strippedAll)
        .split(/\n+/)
        .map((s) => s.trim())
        .filter((s) => s.length >= 42 && s.length <= 1200 && isCleanParagraph(s));
      if (rawLines.length >= 2) {
        pushLinesToPools(rawLines);
      }
    }

    // 8. Meta og:description fallback
    const ogDesc =
      articleHtml.match(/<meta[^>]+property=["']og:description["'][^>]+content=["']([\s\S]*?)["']/i)?.[1] ||
      articleHtml.match(/<meta[^>]+content=["']([\s\S]*?)["'][^>]+property=["']og:description["']/i)?.[1] ||
      '';
    if (ogDesc) {
      const ogSents = decodeHtmlEntities(ogDesc)
        .split(/(?<=[.?!]["'”’)?]*)\s+/)
        .map((s) => s.trim())
        .filter(isCleanBodySentence);
      paragraphPool.push(...ogSents);
    }
  }

  if (homepagePrologue) {
    const proSents = decodeHtmlEntities(homepagePrologue)
      .split(/(?<=[.?!]["'”’)?]*)\s+/)
      .map((s) => s.trim())
      .filter(isCleanBodySentence);
    paragraphPool.push(...proSents);
  }

  // Prefer editorial sub-bullets shown directly on homepage hero (like Kyunghyang) if >= 3 clean bullets exist
  const cleanBullets = homepageBullets
    .map((b) => decodeHtmlEntities(b).replace(/^[·•\-]\s*/, '').trim())
    .filter((b) => b.length >= 12);

  // Deduplicate sentences while preserving order
  const uniqueSentences: string[] = [];
  if (cleanBullets.length >= 3) {
    uniqueSentences.push(...cleanBullets.slice(0, 3));
  } else {
    for (const s of paragraphPool) {
      const normalized = s.replace(/^[0-9]+[.)]\s*/, '').trim();
      const key = normalized.slice(0, 16);
      if (!uniqueSentences.some((u) => u.includes(key) || normalized.includes(u.slice(0, 16)))) {
        uniqueSentences.push(normalized);
      }
      if (uniqueSentences.length >= 3) break;
    }
  }

  // Deduplicate fullBody paragraphs cleanly WITHOUT truncating the original article (up to 100 paragraphs)
  const uniqueParas: string[] = [];
  for (const p of fullBodyParas) {
    const key = p.slice(0, 24);
    if (!uniqueParas.some((u) => u.includes(key) || p.includes(u.slice(0, 24)))) {
      uniqueParas.push(p);
    }
    if (uniqueParas.length >= 100) break;
  }

  // If sentence pool came up short (<3) despite rich paragraphs, derive clean sentences from uniqueParas
  if (uniqueSentences.length < 3 && uniqueParas.length > 0) {
    for (const para of uniqueParas) {
      const normalized = para.length > 260 ? `${para.slice(0, 255).trim()}…` : para;
      const key = normalized.slice(0, 16);
      if (!uniqueSentences.some((u) => u.includes(key) || normalized.includes(u.slice(0, 16)))) {
        uniqueSentences.push(normalized);
      }
      if (uniqueSentences.length >= 3) break;
    }
  }

  // Ensure articleBlocks exists even when extracted via <p> or JSON-LD fallback
  if (orderedBlocks.filter((b) => b.type === 'text').length === 0 && uniqueParas.length > 0) {
    orderedBlocks = [
      ...orderedBlocks.filter((b) => b.type === 'image'),
      ...uniqueParas.map((text): ArticleContentBlock => ({ type: 'text', text })),
    ];
  }

  // If no inline image was found in body container, prepend og:image as lead photo when available
  const hasInlineImage = orderedBlocks.some((b) => b.type === 'image' && b.url);
  const ogImage = extractOgImage(articleHtml, articleUrl);
  if (!hasInlineImage && ogImage) {
    orderedBlocks = [{ type: 'image', url: ogImage }, ...orderedBlocks];
  }

  const firstImgBlock = orderedBlocks.find((b) => b.type === 'image' && b.url);
  const leadImage = firstImgBlock?.url || ogImage;
  const leadImageCaption = firstImgBlock?.caption;

  const fullBody = uniqueParas.length > 0 ? uniqueParas.join('\n\n') : uniqueSentences.join('\n\n');

  return {
    sentences: uniqueSentences,
    fullBody,
    articleBlocks: orderedBlocks,
    leadImage,
    leadImageCaption,
    reporter,
  };
}

const TOP10_CUSTOM_HOMEPAGE_IDS = new Set([
  'khan',
  'chosun',
  'joongang',
  'donga',
  'hani',
  'mk',
  'sedaily',
  'herald',
  'asiae',
]);

function extractCleanHtmlTitle(html: string, outletName: string): string {
  const raw =
    html.match(/<h2[^>]*id=["']title_area["'][^>]*>([\s\S]*?)<\/h2>/i)?.[1] ||
    html.match(/<meta[^>]+property=["']og:title["'][^>]+content=["']([\s\S]*?)["']/i)?.[1] ||
    html.match(/<meta[^>]+content=["']([\s\S]*?)["'][^>]+property=["']og:title["']/i)?.[1] ||
    html.match(/<h1[^>]*>([\s\S]*?)<\/h1>/i)?.[1] ||
    html.match(/<title[^>]*>([\s\S]*?)<\/title>/i)?.[1] ||
    '';

  let cleaned = decodeHtmlEntities(raw.replace(/<[^>]+>/g, ' ')).trim();
  const escapedOutlet = outletName.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  cleaned = cleaned
    .replace(new RegExp(`\\s*[-|·:]\\s*${escapedOutlet}(?:\\s*뉴스)?\\s*$`, 'i'), '')
    .replace(/\s*[-|]\s*(?:네이버\s*뉴스|다음\s*뉴스|뉴스)\s*$/i, '')
    .trim();
  return cleaned;
}

function parseNaverPressDeskCandidates(html: string, naverCode: string): Array<{ url: string; title: string }> {
  const candidates: Array<{ url: string; title: string }> = [];
  const seen = new Set<string>();

  const editMatches = [
    ...html.matchAll(
      /<li class="press_edit_news_item[^"]*"[\s\S]*?<a href="([^"]+)"[^>]*>[\s\S]*?<span class="press_edit_news_title">([\s\S]*?)<\/span>/gi
    ),
  ];
  for (const m of editMatches) {
    const url = decodeHtmlEntities(m[1]).trim();
    const title = decodeHtmlEntities(
      m[2].replace(/<[^>]+>/g, '').replace(/\s*[0-9]+(?:\.[0-9]+)?\s*(?:초|분|시간|일)\s*전.*$/g, '')
    ).trim();
    if (url && title.length >= 6 && !seen.has(url)) {
      seen.add(url);
      candidates.push({ url, title });
    }
  }

  // Fallback pattern if Naver press page renders ranking or headline card markup
  if (candidates.length === 0) {
    const fallbackRe = new RegExp(
      `<a[^>]*href="(https:\\/\\/n\\.news\\.naver\\.com\\/(?:mnews\\/)?article\\/${naverCode}\\/\\d+[^"]*)"[^>]*>([\\s\\S]{6,300}?)<\\/a>`,
      'gi'
    );
    for (const m of html.matchAll(fallbackRe)) {
      const url = decodeHtmlEntities(m[1]).trim();
      const title = decodeHtmlEntities(m[2].replace(/<[^>]+>/g, ' ')).trim();
      if (url && title.length >= 8 && !seen.has(url)) {
        seen.add(url);
        candidates.push({ url, title });
      }
    }
  }

  return candidates;
}

async function fetchNaverArticleDetail(
  naverArticleUrl: string,
  fallbackTitle: string,
  outletName: string,
  homepageBullets: string[] = [],
  prologue = ''
): Promise<{
  title: string;
  originUrl: string;
  naverUrl: string;
  pubDate?: string;
  leadSentences: string[];
  fullBody: string;
  articleBlocks: ArticleContentBlock[];
  leadImage?: string;
  leadImageCaption?: string;
  reporter?: string;
} | null> {
  const artRes = await fetchHtmlFast(naverArticleUrl, 4500);
  if (!artRes.ok || !artRes.text) return null;

  const artHtml = artRes.text;
  const origM =
    artHtml.match(/<a[^>]*href="([^"]+)"[^>]*class="[^"]*media_end_head_origin_link/i) ||
    artHtml.match(/<a[^>]*class="[^"]*media_end_head_origin_link[^"]*"[^>]*href="([^"]+)"/i);
  const originUrl = origM ? decodeHtmlEntities(origM[1]).trim() : '';
  const resolvedTitle = fallbackTitle || extractCleanHtmlTitle(artHtml, outletName);
  const pubDate = extractRealPubDateFromHtml(artHtml);
  const extracted = extractArticleTextAndSummary(artHtml, homepageBullets, prologue, naverArticleUrl);

  return {
    title: resolvedTitle,
    originUrl,
    naverUrl: naverArticleUrl,
    pubDate,
    leadSentences: extracted.sentences,
    fullBody: extracted.fullBody,
    articleBlocks: extracted.articleBlocks,
    leadImage: extracted.leadImage,
    leadImageCaption: extracted.leadImageCaption,
    reporter: extracted.reporter,
  };
}

function extractGenericArticleLinks(html: string, homepageUrl: string): string[] {
  let rootHost = '';
  try {
    rootHost = new URL(homepageUrl).hostname.replace(/^(?:www|news|biz|it|m|imnews)\./, '');
  } catch {
    return [];
  }

  const links: string[] = [];
  const seen = new Set<string>();
  const hrefMatches = [...html.matchAll(/href=["']([^"'#\s]+)["']/gi)];

  for (const m of hrefMatches) {
    const rawHref = decodeHtmlEntities(m[1]).trim();
    if (!rawHref || rawHref.startsWith('javascript:') || rawHref.startsWith('mailto:')) continue;
    let absUrl = '';
    try {
      absUrl = new URL(rawHref, homepageUrl).toString();
    } catch {
      continue;
    }
    if (!absUrl.startsWith('http')) continue;
    let u: URL;
    try {
      u = new URL(absUrl);
    } catch {
      continue;
    }
    if (!u.hostname.includes(rootHost)) continue;
    const pathAndQuery = `${u.pathname}${u.search}`;
    if (
      /\/(?:login|member|join|search|rss|sitemap|company|about|privacy|terms|ad|event|subscribe|mypage|video|photo|gallery|list|section|category|tag)\b/i.test(
        pathAndQuery
      ) ||
      /\.(?:jpg|jpeg|png|gif|webp|svg|css|js|pdf|ico|xml)(?:\?|$)/i.test(u.pathname)
    ) {
      continue;
    }

    const looksLikeArticle =
      /(?:articleView|ReadNews|news\/view|news\/read|uhtml\/view|site\/data\/html|view\.php|view\.jsp|view\.html|view\.do|view\.asp|\/article\/|\/articles\/|\/view\/\d|\/news\/\d|\/\d{4}\/\d{2}\/\d{2}\/|idxno=\d|newsId=\d|seq=\d|no=\d|art_id=\d|nid=\d|aid=\d)/i.test(
        pathAndQuery
      );

    if (looksLikeArticle && !seen.has(absUrl)) {
      seen.add(absUrl);
      links.push(absUrl);
      if (links.length >= 8) break;
    }
  }
  return links;
}

/**
 * Universal fallback for outlets without an official Naver CP Press Desk (or if Press Desk fails):
 * 1) Direct homepage article discovery + full body extraction
 * 2) Naver News Search filtered to the outlet's own domain + full body extraction
 */
async function fetchUniversalOutletArticle(
  outletId: string,
  outletName: string,
  homepageUrl: string
): Promise<RawRSSArticle | null> {
  const candidateUrls: string[] = [];
  const seen = new Set<string>();
  const pushCandidate = (u: string) => {
    if (u && !seen.has(u)) {
      seen.add(u);
      candidateUrls.push(u);
    }
  };

  // Step A: Direct homepage scrape for top article links on same domain
  try {
    const homeRes = await fetchHtmlFast(homepageUrl, 4000, 4, 0);
    if (homeRes.ok && homeRes.text) {
      for (const u of extractGenericArticleLinks(homeRes.text, homepageUrl).slice(0, 4)) {
        pushCandidate(u);
      }
    }
  } catch {
    // Continue to Naver News search discovery
  }

  // Step B: Naver News search discovery matching the outlet's official domain
  if (candidateUrls.length < 3) {
    try {
      const hostBase = new URL(homepageUrl).hostname.replace(/^(?:www|news|biz|it|m|imnews)\./, '');
      const sr = await fetchHtmlFast(
        `https://search.naver.com/search.naver?where=news&sort=1&query=${encodeURIComponent(outletName)}`,
        4000,
        3,
        0
      );
      if (sr.ok && sr.text) {
        const domainRe = new RegExp(
          `https?:\\/\\/[a-zA-Z0-9.-]*${hostBase.replace(/\./g, '\\.')}\\/[^"'\\s<>]+`,
          'gi'
        );
        for (const m of sr.text.matchAll(domainRe)) {
          const u = decodeHtmlEntities(m[0]).trim();
          if (
            u.length > homepageUrl.length + 5 &&
            !/\/(?:index|main|login|member|rss|search|image|img|photo|static|assets|favicon)\b/i.test(u) &&
            !/\.(?:jpg|jpeg|png|gif|webp|svg|css|js|ico)(?:\?|$)/i.test(u)
          ) {
            pushCandidate(u);
            if (candidateUrls.length >= 6) break;
          }
        }
      }
    } catch {
      // Ignore search error
    }
  }

  let bestFallback: RawRSSArticle | null = null;

  for (const url of candidateUrls.slice(0, 4)) {
    const artRes = await fetchHtmlFast(url, 4000, 3, 0);
    if (!artRes.ok || !artRes.text) continue;

    const title = extractCleanHtmlTitle(artRes.text, outletName);
    if (!title || title.length < 8) continue;

    const extracted = extractArticleTextAndSummary(artRes.text, [], '', artRes.finalUrl || url);
    const detectedPubDate = extractRealPubDateFromHtml(artRes.text) || new Date().toISOString();
    const articleObj: RawRSSArticle = {
      outletId,
      outletName,
      title,
      link: artRes.finalUrl || url,
      pubDate: detectedPubDate,
      snippet: extracted.fullBody || extracted.sentences.join(' '),
      leadSentences: extracted.sentences,
      fullBody: extracted.fullBody,
      articleBlocks: extracted.articleBlocks,
      leadImage: extracted.leadImage,
      leadImageCaption: extracted.leadImageCaption,
      reporter: extracted.reporter,
      isTopLead: true,
    };

    if (extracted.fullBody.length >= 140) {
      return articleObj;
    }
    if (!bestFallback || (articleObj.fullBody?.length || 0) > (bestFallback.fullBody?.length || 0)) {
      bestFallback = articleObj;
    }
  }

  return bestFallback;
}

/**
 * Directly scrapes the REAL-TIME center biggest lead article displayed on each newspaper's official homepage,
 * with verified Naver Press Desk full-text extraction for all 59 Naver CP outlets and universal scraping for all remaining outlets.
 */
async function fetchHomepageCenterLeadArticle(
  outletId: string,
  outletName: string
): Promise<RawRSSArticle | null> {
  const outletMeta = PRESS_OUTLETS.find((p) => p.id === outletId);
  const desk = OUTLET_PRESS_DESK_MAP[outletId];
  const homepageUrl = desk?.homepageUrl || outletMeta?.homepageUrl || getOfficialOutletHomepage(outletId, outletName);
  const naverCode = desk?.naverCode || '';

  let title = '';
  let link = '';
  let prologue = '';
  let homepageBullets: string[] = [];
  let naverArticleUrl = '';
  let leadSentences: string[] = [];
  let fullBody = '';
  let articleBlocks: ArticleContentBlock[] = [];
  let leadImage: string | undefined;
  let leadImageCaption: string | undefined;
  let reporter: string | undefined;
  let pubDate: string | undefined;

  // 1. Direct Homepage HTML Extraction for Top 10 Custom-Mapped Major Outlets
  if (TOP10_CUSTOM_HOMEPAGE_IDS.has(outletId)) {
    try {
      const res = await fetchHtmlFast(homepageUrl, 4500);

      if (res.ok) {
        const html = res.text;

        if (outletId === 'khan') {
          const sec = html.match(/<section class="head">([\s\S]*?)<\/section>/i)?.[1] || html;
          const m = sec.match(/<a href="(https:\/\/www\.khan\.co\.kr\/article\/[^"]+)"[^>]*title="([^"]+)"/i);
          if (m) {
            link = m[1];
            title = decodeHtmlEntities(m[2]);
            const ul = sec.match(/<ul[^>]*>([\s\S]*?)<\/ul>/i)?.[1] || '';
            const bullets = [...ul.matchAll(/<li[^>]*>[\s\S]*?<a[^>]*>([\s\S]*?)<\/a>/gi)]
              .slice(1, 4)
              .map((x) => decodeHtmlEntities(x[1].replace(/<[^>]+>/g, '')));
            homepageBullets = bullets.filter(Boolean);
          }
        } else if (outletId === 'chosun') {
          const m =
            html.match(
              /text--center[\s\S]{0,220}<a class="story-card__headline[^"]*h2[^"]*"[^>]*href="([^"]+)"[^>]*>([\s\S]*?)<\/a>/i
            ) ||
            html.match(/<a class="story-card__headline[^"]*h2[^"]*"[^>]*href="([^"]+)"[^>]*>([\s\S]*?)<\/a>/i) ||
            html.match(/<a class="story-card__headline[^"]*"[^>]*href="([^"]+)"[^>]*>([\s\S]*?)<\/a>/i);
          if (m) {
            link = normalizeArticleUrl(m[1], homepageUrl);
            title = decodeHtmlEntities(m[2].replace(/<br\s*\/?>/gi, ' ').replace(/<[^>]+>/g, ''));
          }
        } else if (outletId === 'joongang') {
          const m =
            html.match(/<h2 class="headline[^"]*fs_lg32[^"]*"[\s\S]*?<a href="([^"]+)"[^>]*>([\s\S]*?)<\/a>/i) ||
            html.match(/<h2 class="headline[^"]*"[\s\S]*?<a href="([^"]+)"[^>]*>([\s\S]*?)<\/a>/i);
          if (m) {
            link = normalizeArticleUrl(m[1], homepageUrl);
            const spanMatch = m[2].match(/<span class="sm_hidden">([\s\S]*?)<\/span>/i);
            title = decodeHtmlEntities(
              (spanMatch ? spanMatch[1] : m[2]).replace(/<br\s*\/?>/gi, ' ').replace(/<[^>]+>/g, '')
            );
          }
        } else if (outletId === 'donga') {
          const m = html.match(/class="top_headline_sec"[\s\S]*?<h2[^>]*>[\s\S]*?<a href="([^"]+)"[^>]*>([\s\S]*?)<\/a>/i);
          if (m) {
            link = normalizeArticleUrl(m[1], homepageUrl);
            title = decodeHtmlEntities(m[2].replace(/<[^>]+>/g, ''));
          }
        } else if (outletId === 'hani') {
          const m = html.match(
            /<article class="MainTopArticle_card__[^"]*"[\s\S]*?<a href="([^"]+)"[^>]*>[\s\S]*?<strong class="MainTopArticle_title__[^"]*">([\s\S]*?)<\/strong>([\s\S]*?)<\/a>/i
          );
          if (m) {
            link = normalizeArticleUrl(m[1], homepageUrl);
            title = decodeHtmlEntities(m[2].replace(/<[^>]+>/g, ''));
            const p = m[3].match(/<p class="MainTopArticle_prologue__[^"]*">([\s\S]*?)<\/p>/i);
            if (p) prologue = decodeHtmlEntities(p[1].replace(/<[^>]+>/g, ''));
          }
        } else if (outletId === 'mk') {
          const m = html.match(
            /class="headline_news_sec"[\s\S]*?class="top_headline_title[^"]*"[\s\S]*?<a href="([^"]+)"[^>]*>[\s\S]*?<h3 class="headline_tit">([\s\S]*?)<\/h3>([\s\S]*?)<\/a>/i
          );
          if (m) {
            link = normalizeArticleUrl(m[1], homepageUrl);
            title = decodeHtmlEntities(m[2].replace(/<[^>]+>/g, ''));
            const d = m[3].match(/<div class="newsdesc">([\s\S]*?)<\/div>/i);
            if (d) prologue = decodeHtmlEntities(d[1].replace(/<[^>]+>/g, ''));
          }
        } else if (outletId === 'sedaily') {
          const m = html.match(
            /class="card main-23"[^>]*>[\s\S]{0,120}?<h2[^>]*class="headline"[^>]*>\s*<a[^>]*href="([^"]+)"[^>]*>([\s\S]*?)<\/a>([\s\S]{0,900})/i
          );
          if (m) {
            link = normalizeArticleUrl(m[1], homepageUrl);
            title = decodeHtmlEntities(m[2].replace(/<[^>]+>/g, ''));
            const d = m[3].match(/<p class="description[^"]*">([\s\S]*?)<\/p>/i);
            if (d) prologue = decodeHtmlEntities(d[1].replace(/<[^>]+>/g, ''));
          }
        } else if (outletId === 'herald') {
          const m = html.match(
            /site_main connect_layout[\s\S]*?<article class="headline"[\s\S]*?<a href="([^"]+)"[^>]*>([\s\S]*?)<\/a>/i
          );
          if (m) {
            link = normalizeArticleUrl(m[1], homepageUrl);
            const tM = m[2].match(/<p class="news_title">([\s\S]*?)<\/p>/i);
            title = decodeHtmlEntities((tM ? tM[1] : m[2]).replace(/<[^>]+>/g, ''));
            const d = m[2].match(/<p class="news_text[^"]*">([\s\S]*?)<\/p>/i);
            if (d) prologue = decodeHtmlEntities(d[1].replace(/<[^>]+>/g, ''));
          }
        } else if (outletId === 'asiae') {
          const m = html.match(
            /<section class="headline" id="top"[\s\S]*?<div class="txt_box">[\s\S]*?<h2>[\s\S]*?<a href="([^"]+)"[^>]*>([\s\S]*?)<\/a>([\s\S]*?)<\/div>/i
          );
          if (m) {
            link = normalizeArticleUrl(m[1], homepageUrl);
            title = decodeHtmlEntities(m[2].replace(/<[^>]+>/g, ''));
            const d = m[3].match(/<p class="desc">([\s\S]*?)<\/p>/i);
            if (d) prologue = decodeHtmlEntities(d[1].replace(/<[^>]+>/g, ''));
          }
        }
      }
    } catch (err) {
      console.warn(`Direct homepage scrape failed for ${outletName}:`, err);
    }
  }

  // 1-b. If direct homepage link was obtained, extract genuine full body + inline photos from the direct article page
  if (title && link) {
    const artRes = await fetchHtmlFast(link, 4500);
    if (artRes.ok && artRes.text) {
      pubDate = extractRealPubDateFromHtml(artRes.text) || pubDate;
      const extracted = extractArticleTextAndSummary(artRes.text, homepageBullets, prologue, link);
      if (extracted.sentences.length > 0 || extracted.fullBody.length > 50) {
        leadSentences = extracted.sentences;
        fullBody = extracted.fullBody;
        articleBlocks = extracted.articleBlocks;
        leadImage = extracted.leadImage;
        leadImageCaption = extracted.leadImageCaption;
        reporter = extracted.reporter;
      }
    }
  }

  // 2. Official Naver Press Desk (primary for all 50+ non-top-10 Naver CP outlets like Edaily/SBS/KBS/MBC/JTBC/MT/FNNews,
  //    and reliable full-body + photo fallback for Top 10 outlets when homepage is WAF-blocked or returned thin body/no photos)
  const needsNaverEnrichment = !title || fullBody.length < 220 || !articleBlocks.some((b) => b.type === 'image');
  if (naverCode && needsNaverEnrichment) {
    try {
      const deskRes = await fetchHtmlFast(`https://media.naver.com/press/${naverCode}`, 4500);
      if (deskRes.ok && deskRes.text) {
        const candidates = parseNaverPressDeskCandidates(deskRes.text, naverCode);

        // If we already have a homepage title, try matching that exact story on Naver first for cleaner full body & photos
        if (title && candidates.length > 0) {
          const titleWords = extractSearchKeywords(title)
            .split(' ')
            .filter((w) => w.length >= 2);
          const matchingCandidate = candidates.find((c) =>
            titleWords.slice(0, 3).filter((w) => c.title.includes(w)).length >= Math.min(2, titleWords.length)
          );
          if (matchingCandidate) {
            const detail = await fetchNaverArticleDetail(
              matchingCandidate.url,
              title,
              outletName,
              homepageBullets,
              prologue
            );
            if (detail && (detail.fullBody.length >= fullBody.length || (!articleBlocks.some((b) => b.type === 'image') && detail.articleBlocks.some((b) => b.type === 'image')))) {
              naverArticleUrl = detail.naverUrl;
              if (!link || link.includes('news.naver.com')) {
                link = detail.originUrl || detail.naverUrl;
              }
              if (detail.leadSentences.length > 0) leadSentences = detail.leadSentences;
              if (detail.fullBody.length >= fullBody.length) {
                fullBody = detail.fullBody;
                articleBlocks = detail.articleBlocks;
                leadImage = detail.leadImage || leadImage;
                leadImageCaption = detail.leadImageCaption || leadImageCaption;
              } else if (detail.leadImage && !leadImage) {
                leadImage = detail.leadImage;
                leadImageCaption = detail.leadImageCaption;
                articleBlocks = [{ type: 'image', url: detail.leadImage, caption: detail.leadImageCaption }, ...articleBlocks];
              }
              reporter = detail.reporter || reporter;
              pubDate = detail.pubDate || pubDate;
            }
          }
        }

        // If we still don't have a rich article (>=150 chars body), pick the top lead candidate with a real full body
        if ((!title || fullBody.length < 150) && candidates.length > 0) {
          let bestDetail: Awaited<ReturnType<typeof fetchNaverArticleDetail>> = null;
          for (const cand of candidates.slice(0, 5)) {
            const detail = await fetchNaverArticleDetail(cand.url, cand.title, outletName);
            if (!detail) continue;
            if (!bestDetail || detail.fullBody.length > bestDetail.fullBody.length) {
              bestDetail = detail;
            }
            if (detail.fullBody.length >= 280) {
              bestDetail = detail;
              break;
            }
          }

          if (bestDetail && bestDetail.fullBody.length > fullBody.length) {
            title = bestDetail.title;
            naverArticleUrl = bestDetail.naverUrl;
            link = bestDetail.originUrl || bestDetail.naverUrl;
            leadSentences = bestDetail.leadSentences;
            fullBody = bestDetail.fullBody;
            articleBlocks = bestDetail.articleBlocks;
            leadImage = bestDetail.leadImage;
            leadImageCaption = bestDetail.leadImageCaption;
            reporter = bestDetail.reporter || reporter;
            pubDate = bestDetail.pubDate || pubDate;
          }
        }
      }
    } catch (err) {
      console.warn(`Naver press desk fetch failed for ${outletName}:`, err);
    }
  }

  // 3. Universal Direct-Site + Naver News Search Fallback for non-Naver-CP outlets (or if CP desk failed completely)
  if (!title || fullBody.length < 100) {
    const universal = await fetchUniversalOutletArticle(outletId, outletName, homepageUrl);
    if (universal && (!title || (universal.fullBody?.length || 0) > fullBody.length)) {
      return universal;
    }
  }

  if (!title) return null;

  if (leadSentences.length === 0) {
    if (homepageBullets.length > 0) {
      leadSentences = homepageBullets.slice(0, 3);
    } else if (prologue) {
      leadSentences = prologue
        .split(/(?<=[.?!]["'”’)?]*)\s+/)
        .filter(isCleanBodySentence)
        .slice(0, 3);
    }
  }

  return {
    outletId,
    outletName,
    title,
    link: link || homepageUrl,
    naverUrl: naverArticleUrl || undefined,
    pubDate: pubDate || new Date().toISOString(),
    snippet: fullBody || prologue || leadSentences.join(' '),
    leadSentences,
    fullBody,
    articleBlocks: articleBlocks.length > 0 ? articleBlocks : undefined,
    leadImage,
    leadImageCaption,
    reporter,
    isTopLead: true,
  };
}

function matchesOutletSourceName(sourceTagText: string, outletName: string, logoText?: string): boolean {
  const cleanSource = decodeHtmlEntities(sourceTagText || '').replace(/\s+/g, '').toLowerCase();
  if (!cleanSource) return false;
  const targets = [outletName, logoText || '']
    .map((s) => s.replace(/\s+/g, '').toLowerCase())
    .filter((s) => s.length >= 2);
  return targets.some((t) => cleanSource === t || cleanSource.includes(t) || t.includes(cleanSource));
}

/**
 * Fetch real articles for specified Korean press outlets in real-time.
 * Strictly returns ONLY the requested outletIds and evicts entries from previous KST dates.
 */
export async function fetchRealArticlesForOutlets(
  outletIds: string[] = DEFAULT_10_OUTLETS,
  forceRefresh = false
): Promise<Record<string, RawRSSArticle[]>> {
  const outletsToFetch = PRESS_OUTLETS.filter((p) =>
    outletIds.length > 0 ? outletIds.includes(p.id) : p.isDefaultMajor
  );

  const now = Date.now();
  const todayKst = getKstDateKey();

  // Evict stale entries from prior KST dates so yesterday's articles never bleed into today
  for (const [key, entry] of outletCache.entries()) {
    if (entry.kstDate !== todayKst || now - entry.fetchedAt > 6 * 60 * 60 * 1000) {
      outletCache.delete(key);
    }
  }

  const results: Record<string, RawRSSArticle[]> = {};
  const outletsNeedingFetch: typeof outletsToFetch = [];

  for (const outlet of outletsToFetch) {
    const cached = outletCache.get(outlet.id);
    if (
      !forceRefresh &&
      cached &&
      cached.kstDate === todayKst &&
      now - cached.fetchedAt < CACHE_TTL_MS &&
      cached.articles.length > 0
    ) {
      results[outlet.id] = cached.articles;
    } else {
      outletsNeedingFetch.push(outlet);
    }
  }

  // Process in controlled concurrency batches (max 8 outlets at a time)
  const BATCH_SIZE = 8;
  for (let i = 0; i < outletsNeedingFetch.length; i += BATCH_SIZE) {
    const batch = outletsNeedingFetch.slice(i, i + BATCH_SIZE);
    await Promise.allSettled(
      batch.map(async (outlet) => {
        const articles: RawRSSArticle[] = [];

        // 1. Fetch verified full-text lead article (Homepage -> Naver Press Desk -> Universal Direct/Search)
        const topLead = await fetchHomepageCenterLeadArticle(outlet.id, outlet.name);
        if (topLead) {
          articles.push(topLead);
        }

        // 2. Fetch Google News RSS strictly verified by <source> matching outlet.name and within 24h
        try {
          const searchUrl = `https://news.google.com/rss/search?q=${encodeURIComponent(`"${outlet.name}" when:1d`)}&hl=ko&gl=KR&ceid=KR:ko`;
          const res = await fetch(searchUrl, {
            signal: AbortSignal.timeout(3000),
            headers: { 'User-Agent': 'Mozilla/5.0 (MorningBrief/1.0)' },
          });

          if (res.ok) {
            const xml = await res.text();
            const itemBlocks = [...xml.matchAll(/<item>([\s\S]*?)<\/item>/gi)].slice(0, 8);
            const escapedOutlet = outlet.name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
            let secondaryAdded = 0;

            for (const blockMatch of itemBlocks) {
              if (secondaryAdded >= 3) break;
              const itemXml = blockMatch[1] || '';
              const sourceText = itemXml.match(/<source[^>]*>([\s\S]*?)<\/source>/i)?.[1] || '';
              // Reject articles that merely mention the outlet name without actually being published by it
              if (!matchesOutletSourceName(sourceText, outlet.name, outlet.logoText)) {
                continue;
              }

              const rawTitle = itemXml.match(/<title>([\s\S]*?)<\/title>/i)?.[1] || '';
              const rawLink = itemXml.match(/<link>([\s\S]*?)<\/link>/i)?.[1] || '';
              const rawPubDate = itemXml.match(/<pubDate>([\s\S]*?)<\/pubDate>/i)?.[1]?.trim() || '';
              const rawDesc = itemXml.match(/<description>([\s\S]*?)<\/description>/i)?.[1] || '';

              if (rawPubDate && !isWithinLast24Hours(rawPubDate, now)) {
                continue;
              }

              let t = decodeHtmlEntities(rawTitle.replace(/<!\[CDATA\[([\s\S]*?)\]\]>/g, '$1'));
              t = t
                .replace(new RegExp(`\\s*-\\s*${escapedOutlet}(?:\\s*뉴스)?\\s*$`, 'i'), '')
                .replace(/\s*-\s*(?:KBS|MBC|SBS|YTN|JTBC)\s*뉴스\s*$/i, '')
                .trim();

              let snip = decodeHtmlEntities(
                rawDesc
                  .replace(/<!\[CDATA\[([\s\S]*?)\]\]>/g, '$1')
                  .replace(/<[^>]+>/g, ' ')
                  .replace(/https?:\/\/[^\s]+/g, ' ')
                  .replace(/[\r\n]+/g, ' ')
                  .replace(/\s+/g, ' ')
                  .trim()
              );

              if (snip.includes('news.google.com') || snip.length < 25 || snip === t) {
                snip = '';
              }

              if (t && !articles.some((a) => areTitlesNearDuplicate(a.title, t))) {
                articles.push({
                  outletId: outlet.id,
                  outletName: outlet.name,
                  title: t,
                  link: rawLink.replace(/&amp;/g, '&').trim(),
                  pubDate: parseKstDateTimeString(rawPubDate) || rawPubDate || new Date().toISOString(),
                  snippet: snip,
                });
                secondaryAdded += 1;
              }
            }
          }
        } catch {
          // Ignore RSS secondary feed failure
        }

        if (articles.length > 0) {
          recordOutletHealth(outlet.id, true);
          outletCache.set(outlet.id, {
            articles,
            fetchedAt: Date.now(),
            kstDate: todayKst,
          });
          results[outlet.id] = articles;
        } else {
          recordOutletHealth(outlet.id, false);
        }
      })
    );
  }

  return results;
}

const SECTOR_CONFIGS: {
  sector: 'construction' | 'realestate' | 'urban' | 'finance';
  sectorLabel: string;
  pressSection: string;
  queries: string[];
  relevanceRegex: RegExp;
  defaultTag: string;
}[] = [
  {
    sector: 'construction',
    sectorLabel: '건설·SOC',
    pressSection: '건설·산업 면',
    queries: ['건설 수주', '인프라 착공', '플랜트 원전 시공', 'GTX 철도 토목'],
    relevanceRegex: /건설|수주|시공|착공|토목|플랜트|원전|GTX|철도|인프라|공사비|현대건설|대우건설|삼성물산|GS건설|DL이앤씨|HDC|시공사/,
    defaultTag: '건설수주',
  },
  {
    sector: 'realestate',
    sectorLabel: '부동산·주택',
    pressSection: '부동산·정책 면',
    queries: ['부동산 아파트', '분양 청약 경쟁률', '전세 월세 집값', '주택공급 임대 매매'],
    relevanceRegex: /부동산|아파트|청약|분양|집값|주택|전세|월세|임대|매매|빌딩|오피스텔|토지|공급|실거래가|거래량/,
    defaultTag: '부동산시장',
  },
  {
    sector: 'urban',
    sectorLabel: '도시개발·정비',
    pressSection: '도시개발·정비 면',
    queries: ['재건축 재개발 정비사업', '신도시 택지개발 도시재생', '모아타운 신속통합기획', '역세권 복합개발 스마트시티'],
    relevanceRegex: /도시개발|도시재생|재건축|재개발|정비사업|정비구역|신도시|택지|지구단위|신속통합|모아타운|복합개발|역세권|용적률|선도지구|스마트시티|노후계획도시/,
    defaultTag: '도시개발',
  },
  {
    sector: 'finance',
    sectorLabel: '금융·금리',
    pressSection: '금융·증권 면',
    queries: ['기준금리 대출', '부동산PF 금융', '주담대 가계부채 은행', '환율 코스피 증권'],
    relevanceRegex: /금융|금리|은행|한국은행|기준금리|대출|주담대|PF|가계부채|금융위|금감원|증권|보험|밸류업|코스피|환율|펀드/,
    defaultTag: '금융정책',
  },
];

function resolveOutletMetaFromPressName(pressNameRaw: string): { outletId: string; outletName: string } {
  const cleanName = (pressNameRaw || '').split('|')[0].trim();
  if (!cleanName) {
    return { outletId: 'hankyung', outletName: '한국경제' };
  }
  const exact = PRESS_OUTLETS.find(
    (p) => p.name === cleanName || p.logoText === cleanName || cleanName.includes(p.name) || p.name.includes(cleanName)
  );
  if (exact) {
    return { outletId: exact.id, outletName: exact.name };
  }
  return { outletId: cleanName.toLowerCase().replace(/[^a-z0-9가-힣]/g, ''), outletName: cleanName };
}

function extractSectorHighlight(title: string, summaryText: string): {
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

/**
 * Harvests live real-time Construction, Real Estate, Urban Development, and Finance articles
 * sorted by latest (sort=1) and strictly filtered to articles published within the last 24 hours.
 */
export async function fetchSectorHeadlinesReal(forceRefresh = false): Promise<SectorHeadlineItem[]> {
  const now = Date.now();
  const todayKst = getKstDateKey();
  if (
    !forceRefresh &&
    lastSectorFetchedKstDate === todayKst &&
    cachedSectorHeadlines.length >= 6 &&
    now - lastSectorFetchedTime < CACHE_TTL_MS
  ) {
    return cachedSectorHeadlines;
  }

  const todayFormatted = getCurrentKoreanDateString();
  const nowKstShort = new Date()
    .toLocaleTimeString('ko-KR', {
      timeZone: 'Asia/Seoul',
      hour: '2-digit',
      minute: '2-digit',
      hour12: false,
    })
    .slice(0, 5);

  const collected: SectorHeadlineItem[] = [];
  const seenNaverUrls = new Set<string>();
  const seenTitles: string[] = [];

  await Promise.allSettled(
    SECTOR_CONFIGS.map(async (cfg) => {
      const candidateLinks: string[] = [];

      // Run 4 latest-sorted (sort=1) topic search queries in parallel for this sector
      const searchPages = await Promise.allSettled(
        cfg.queries.map((q) =>
          fetchHtmlFast(
            `https://search.naver.com/search.naver?where=news&sort=1&query=${encodeURIComponent(q)}`,
            3500
          )
        )
      );

      for (const sp of searchPages) {
        if (sp.status === 'fulfilled' && sp.value.ok) {
          const matches = [
            ...sp.value.text.matchAll(/https:\/\/n\.news\.naver\.com\/mnews\/article\/\d+\/\d+/g),
          ].map((m) => m[0]);
          for (const link of matches) {
            if (!seenNaverUrls.has(link) && !candidateLinks.includes(link)) {
              candidateLinks.push(link);
            }
          }
        }
      }

      // Fetch up to 10 distinct Naver article pages in parallel
      const targetLinks = candidateLinks.slice(0, 10);
      const articleResponses = await Promise.allSettled(
        targetLinks.map(async (naverUrl) => {
          const res = await fetchHtmlFast(naverUrl, 3500);
          return { naverUrl, res };
        })
      );

      let sectorAdded = 0;
      for (const itemRes of articleResponses) {
        if (sectorAdded >= 5) break;
        if (itemRes.status !== 'fulfilled' || !itemRes.value.res.ok) continue;

        const { naverUrl, res } = itemRes.value;
        const html = res.text;

        const rawTitle =
          html.match(/<h2[^>]*id="title_area"[^>]*>([\s\S]*?)<\/h2>/i)?.[1] ||
          html.match(/<meta[^>]+property=["']og:title["'][^>]+content=["']([\s\S]*?)["']/i)?.[1] ||
          '';
        const title = decodeHtmlEntities(rawTitle.replace(/<[^>]+>/g, '')).trim();
        if (!title || title.length < 8) continue;
        // Deduplicate wire-republished / syndicated near-identical titles across outlets
        if (seenTitles.some((existing) => areTitlesNearDuplicate(existing, title))) continue;

        const realPubDateIso = extractRealPubDateFromHtml(html);
        if (realPubDateIso && !isWithinLast24Hours(realPubDateIso, now)) {
          continue;
        }

        const rawAuthor =
          html.match(/<meta[^>]+property=["']og:article:author["'][^>]+content=["']([^"']+)["']/i)?.[1] || '';
        const { outletId, outletName } = resolveOutletMetaFromPressName(rawAuthor);

        const origMatch =
          html.match(/<a[^>]*href="([^"]+)"[^>]*class="[^"]*media_end_head_origin_link/i) ||
          html.match(/<a[^>]*class="[^"]*media_end_head_origin_link[^"]*"[^>]*href="([^"]+)"/i);
        const directOriginUrl = origMatch ? decodeHtmlEntities(origMatch[1]).trim() : '';

        const reporterRaw =
          html.match(/<em[^>]*class="media_end_head_journalist_name"[^>]*>([\s\S]*?)<\/em>/i)?.[1] || '';
        const reporterClean = decodeHtmlEntities(reporterRaw.replace(/<[^>]+>/g, '')).trim();

        const extracted = extractArticleTextAndSummary(html, [], '', naverUrl);
        if (!cfg.relevanceRegex.test(`${title} ${extracted.sentences.join(' ')}`)) {
          continue;
        }

        const baseSummary = generate3LineSummaryFromSnippet(
          title,
          extracted.fullBody,
          outletName,
          extracted.sentences
        );
        const bodyText = (extracted.fullBody || baseSummary.join('\n\n')).trim();
        const rawTags = extractSearchKeywords(title).split(' ').filter((w) => w.length >= 2);
        const tags = Array.from(new Set([...rawTags, cfg.defaultTag])).slice(0, 4);

        const { highlightBadge, keyFigure, impactRating } = extractSectorHighlight(
          title,
          baseSummary.join(' ')
        );

        seenNaverUrls.add(naverUrl);
        seenTitles.push(title);
        sectorAdded += 1;

        collected.push({
          id: `sec-live-${cfg.sector}-${Date.now().toString(36)}-${sectorAdded}`,
          sector: cfg.sector,
          sectorLabel: cfg.sectorLabel,
          outletId,
          outletName,
          title,
          summary: baseSummary[0] || title,
          baseSummary,
          leadSummary: baseSummary,
          publishedAt: formatPublishedAtFromRaw(realPubDateIso, todayFormatted, nowKstShort),
          originalUrl: directOriginUrl || naverUrl,
          naverUrl,
          tags,
          impactRating,
          highlightBadge,
          keyFigure,
          fullContent: trimCitationExcerpt(bodyText),
          articleBlocks: trimCitationBlocks(extracted.articleBlocks),
          leadImage: extracted.leadImage,
          leadImageCaption: extracted.leadImageCaption,
          reporter: reporterClean || extracted.reporter || `${outletName} 취재기자`,
          pressSection: cfg.pressSection,
          sourceType: 'live',
          isFallback: false,
        });
      }
    })
  );

  // Do NOT silently mix MOCK_SECTOR_HEADLINES into live sector collection.
  if (collected.length > 0) {
    cachedSectorHeadlines = collected;
    lastSectorFetchedTime = now;
    lastSectorFetchedKstDate = todayKst;
    return collected;
  }

  return lastSectorFetchedKstDate === todayKst ? cachedSectorHeadlines : [];
}

/**
 * Extracts up to 3 genuine sentences from the article body or snippet.
 * Never fabricates unsupported domain-template sentences when body text is insufficient.
 */
export function generate3LineSummaryFromSnippet(
  _title: string,
  snippet: string,
  _outletName: string,
  preExtractedSentences?: string[]
): string[] {
  // 1. Use clean sentences extracted from the actual article body or homepage bullets
  const baseSentences = (preExtractedSentences || [])
    .map((s) => s.replace(/^[0-9]+[.)]\s*/, '').trim())
    .filter((s) => s.length >= 12 && !BOILERPLATE_SUBSTRINGS.some((bad) => s.includes(bad)));

  if (baseSentences.length >= 3) {
    return baseSentences.slice(0, 3);
  }

  // 2. Otherwise parse genuine sentences from snippet text
  const cleanSnip = decodeHtmlEntities((snippet || '').replace(/<[^>]+>/g, ' ').replace(/https?:\/\/[^\s]+/g, ' '));
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

  // 3. Return only genuinely extracted sentences, or an honest insufficient-excerpt notice
  if (combined.length > 0) {
    return combined;
  }

  return ['본문 발췌 부족 — 제목과 원문 링크만 제공'];
}

function inferTopicFromText(title: string): string {
  if (/도시개발|도시재생|재건축|재개발|정비사업|신도시|택지|모아타운|신속통합|선도지구|스마트시티/.test(title)) return '도시개발·정비';
  if (/부동산|아파트|집값|전세|월세|청약|분양|주택공급|임대|토지/.test(title)) return '부동산·정책';
  if (/건설|수주|시공|착공|플랜트|토목|GTX|철도|인프라|공사비/.test(title)) return '건설·인프라';
  if (/증시|코스피|코스닥|주가|외국인|매도|매수|투자|금리|환율|대출|은행|PF|경제/.test(title)) return '금융·경제';
  if (/트럼프|시진핑|푸틴|APEC|외교|중국|미국|정상회담|관세|통상|안보/.test(title)) return '외교·국제';
  if (/엔비디아|AI|반도체|삼성|하이닉스|빅테크|클라우드|배터리/.test(title)) return 'IT·반도체';
  if (/법원|무죄|구형|특검|국힘|與|野|대통령|국회|청문|재판|검찰|헌재/.test(title)) return '정치·사법';
  if (/수능|경찰|교육|교사|의료|노동|파업|기후|사고/.test(title)) return '사회·교육';
  return '종합·1면 톱';
}

const MAX_CITATION_EXCERPT_CHARS = 700;
const EXPLICIT_EXCLUSIVE_TITLE_REGEX = /(?:^|\s)(?:\[단독\]|【단독】|\(단독\)|<단독>|단독[\s:·\-])/;

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

function trimCitationExcerpt(raw?: string, maxChars = MAX_CITATION_EXCERPT_CHARS): string {
  const cleaned = (raw || '').replace(/\r\n/g, '\n').trim();
  if (!cleaned) return '';
  if (cleaned.length <= maxChars) return cleaned;
  const sliced = cleaned.slice(0, maxChars);
  const lastPeriod = Math.max(sliced.lastIndexOf('. '), sliced.lastIndexOf('다.'), sliced.lastIndexOf('\n'));
  const cut = lastPeriod > maxChars * 0.55 ? sliced.slice(0, lastPeriod + 1) : sliced;
  return `${cut.trim()}…`;
}

function trimCitationBlocks(blocks?: ArticleContentBlock[]): ArticleContentBlock[] | undefined {
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

function formatPublishedAtFromRaw(
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

function extractClusterTokens(text: string): string[] {
  const normalized = (text || '')
    .replace(/\[[^\]]*\]|【[^】]*】|\([^)]*\)/g, ' ')
    .replace(/[‘’“”"'`·…—–\-.,?!:;()[\]{}<>\/\\|@#$%^&*+=~]/g, ' ')
    .toLowerCase();

  const rawWords = normalized.split(/\s+/).filter(Boolean);
  const tokens: string[] = [];

  for (const w of rawWords) {
    // Strip common Korean trailing particles (조사) for better entity matching
    const stem = w.replace(/(은|는|이|가|을|를|의|에|서|로|으로|와|과|도|만|까지|부터|에서|에게|한테|보다|처럼)$/, '');
    const candidate = stem.length >= 2 ? stem : w;
    if (candidate.length < 2) continue;
    if (/^\d+$/.test(candidate)) continue;
    if (CLUSTERING_STOPWORDS.has(candidate)) continue;
    tokens.push(candidate);
  }

  return Array.from(new Set(tokens));
}

function computeTfIdfCosine(
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

function computeArticlePairSimilarity(
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

  // Require at least 2 concrete shared title tokens, or 1 shared title token + >=2 cross-context tokens
  if (sharedTitle.length < 2 && !(sharedTitle.length >= 1 && sharedCross.length >= 2)) {
    return { score: 0, sharedKeywords };
  }

  const titleUnionSize = new Set([...aTitleTokens, ...bTitleTokens]).size;
  const titleMinSize = Math.min(aTitleTokens.size, bTitleTokens.size);
  const titleJaccard = titleUnionSize > 0 ? sharedTitle.length / titleUnionSize : 0;
  const titleOverlap = titleMinSize > 0 ? sharedTitle.length / titleMinSize : 0;
  const tfIdfCosine = computeTfIdfCosine(aTfIdf, bTfIdf);

  // Weighted TF-IDF cosine + title Jaccard/overlap in [0, 1]
  const combined = tfIdfCosine * 0.45 + titleOverlap * 0.35 + titleJaccard * 0.2;
  return {
    score: Math.min(1, combined),
    sharedKeywords,
  };
}

/**
 * Builds a verified DailyBriefing strictly reflecting real-time homepage & feed stories
 */
export function buildRealBriefing(
  articlesByOutlet: Record<string, RawRSSArticle[]>,
  tone: BriefingTone = 'insight',
  selectedOutletIds: string[] = DEFAULT_10_OUTLETS,
  sectorHeadlinesInput?: SectorHeadlineItem[]
): DailyBriefing {
  const todayFormatted = getCurrentKoreanDateString();
  const collectedAtIso = new Date().toISOString();
  const nowKstTime = new Date().toLocaleTimeString('ko-KR', {
    timeZone: 'Asia/Seoul',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false,
  });
  const shortTime = nowKstTime.slice(0, 5);

  // 1. Build FrontPage stories in selectedOutletIds order (strictly isolated to requested outlets)
  const frontPageStories: NewsStory[] = [];
  const allKeywords: string[] = [];
  const targetIds = selectedOutletIds.length > 0 ? selectedOutletIds : DEFAULT_10_OUTLETS;
  const targetIdSet = new Set(targetIds);

  for (const outletId of targetIds) {
    const articles = articlesByOutlet[outletId];
    if (!articles || articles.length === 0) continue;

    const art = articles[0];
    const keywords = extractSearchKeywords(art.title).split(' ').slice(0, 3);
    keywords.forEach((k) => {
      if (k && !allKeywords.includes(`#${k}`)) allKeywords.push(`#${k}`);
    });

    const baseSummary = generate3LineSummaryFromSnippet(
      art.title,
      art.snippet,
      art.outletName,
      art.leadSentences
    );

    frontPageStories.push({
      id: `fp-${outletId}-${Date.now().toString(36)}`,
      outletId,
      outletName: art.outletName,
      category: 'frontpage',
      title: art.title,
      leadSummary: baseSummary,
      baseSummary,
      originalUrl: art.link || getOfficialOutletHomepage(outletId, art.outletName),
      naverUrl: art.naverUrl || undefined,
      publishedAt: formatPublishedAtFromRaw(art.pubDate, todayFormatted, shortTime),
      keywords: keywords.length > 0 ? keywords : ['주요기사'],
      topic: inferTopicFromText(art.title),
      reporter: art.reporter || `${art.outletName} 편집국`,
      pressSection: '홈페이지 주요 톱',
      newspaperPage: '언론사 홈페이지 첫화면',
      reactions: { insightful: 0, important: 0, surprising: 0 },
      fullContent: trimCitationExcerpt(art.fullBody || art.snippet || ''),
      articleBlocks: trimCitationBlocks(art.articleBlocks),
      leadImage: art.leadImage,
      leadImageCaption: art.leadImageCaption,
    });
  }

  // 2. Real TF-IDF + Jaccard Cross-Outlet Clustering (STRICTLY >= 3 distinct outlets, only selectedOutletIds)
  const allCollected: RawRSSArticle[] = [];
  for (const outletId of targetIdSet) {
    const outletArts = articlesByOutlet[outletId] || [];
    const seenForOutlet: string[] = [];
    for (const art of outletArts) {
      if (!seenForOutlet.some((t) => areTitlesNearDuplicate(t, art.title))) {
        seenForOutlet.push(art.title);
        allCollected.push(art);
      }
    }
  }

  const overlappingStories: NewsStory[] = [];

  const buildClusterIntegratedOneLineSummary = (
    sharedTerms: string[],
    outlets: string[],
    representativeTitle: string
  ): string => {
    const cleanRep = representativeTitle
      .replace(/^\[[^\]]+\]\s*/, '')
      .replace(/\s+/g, ' ')
      .trim();
    const outletPreview = outlets.slice(0, 3).join('·');
    const extraCount = Math.max(0, outlets.length - 3);
    const outletGroupLabel =
      extraCount > 0 ? `${outletPreview} 등 ${outlets.length}개사` : `${outletPreview} ${outlets.length}개사`;
    const termsHint = sharedTerms.slice(0, 3).join('·');
    if (termsHint) {
      return `${outletGroupLabel}가 '${termsHint}' 관련 현안(${cleanRep.slice(0, 38)}${cleanRep.length > 38 ? '…' : ''})을 공통 보도하고 있습니다.`;
    }
    return `${outletGroupLabel}가 '${cleanRep}' 현안을 동시 보도하고 있습니다.`;
  };

  interface IndexedArticle {
    idx: number;
    art: RawRSSArticle;
    titleTokens: Set<string>;
    bodyTokens: Set<string>;
    tfIdf: Map<string, number>;
    timestampMs: number | null;
  }

  const rawTokenSets = allCollected.map((art) => {
    const titleList = extractClusterTokens(art.title);
    const bodyList = extractClusterTokens(
      `${(art.leadSentences || []).slice(0, 3).join(' ')} ${(art.fullBody || art.snippet || '').slice(0, 450)}`
    );
    return {
      titleList,
      bodyList,
      titleSet: new Set(titleList),
      bodySet: new Set(bodyList),
    };
  });

  // Compute corpus-wide IDF across all collected articles
  const docFreq = new Map<string, number>();
  const totalDocs = Math.max(1, rawTokenSets.length);
  for (const item of rawTokenSets) {
    const uniqueDocTerms = new Set([...item.titleSet, ...item.bodySet]);
    for (const term of uniqueDocTerms) {
      docFreq.set(term, (docFreq.get(term) || 0) + 1);
    }
  }

  const indexed: IndexedArticle[] = allCollected.map((art, idx) => {
    const parsedTime = art.pubDate ? Date.parse(art.pubDate) : Number.NaN;
    const { titleSet, bodySet } = rawTokenSets[idx];
    const tfIdf = new Map<string, number>();
    // Weight title terms 2.5x higher than opening-paragraph body terms
    for (const term of titleSet) {
      const df = docFreq.get(term) || 1;
      const idf = Math.log((totalDocs + 1) / (df + 1)) + 1;
      tfIdf.set(term, 2.5 * idf);
    }
    for (const term of bodySet) {
      const df = docFreq.get(term) || 1;
      const idf = Math.log((totalDocs + 1) / (df + 1)) + 1;
      tfIdf.set(term, (tfIdf.get(term) || 0) + 1.0 * idf);
    }
    return {
      idx,
      art,
      titleTokens: titleSet,
      bodyTokens: bodySet,
      tfIdf,
      timestampMs: Number.isNaN(parsedTime) ? null : parsedTime,
    };
  });

  const PAIR_SIMILARITY_THRESHOLD = 0.30;
  const MAX_TIME_WINDOW_MS = 24 * 60 * 60 * 1000;

  interface PairEdge {
    i: number;
    j: number;
    score: number;
    sharedKeywords: string[];
  }

  const edges: PairEdge[] = [];
  // Track max cross-outlet similarity per article for exclusive cross-verification
  const maxOtherOutletSimilarity = new Map<number, number>();

  for (let i = 0; i < indexed.length; i += 1) {
    for (let j = i + 1; j < indexed.length; j += 1) {
      if (indexed[i].art.outletId === indexed[j].art.outletId) continue;
      if (
        indexed[i].timestampMs !== null &&
        indexed[j].timestampMs !== null &&
        Math.abs((indexed[i].timestampMs as number) - (indexed[j].timestampMs as number)) > MAX_TIME_WINDOW_MS
      ) {
        continue;
      }

      const sim = computeArticlePairSimilarity(
        indexed[i].titleTokens,
        indexed[i].bodyTokens,
        indexed[i].tfIdf,
        indexed[j].titleTokens,
        indexed[j].bodyTokens,
        indexed[j].tfIdf
      );

      if (sim.score > (maxOtherOutletSimilarity.get(i) || 0)) {
        maxOtherOutletSimilarity.set(i, sim.score);
      }
      if (sim.score > (maxOtherOutletSimilarity.get(j) || 0)) {
        maxOtherOutletSimilarity.set(j, sim.score);
      }

      if (sim.score >= PAIR_SIMILARITY_THRESHOLD) {
        edges.push({ i, j, score: sim.score, sharedKeywords: sim.sharedKeywords });
      }
    }
  }

  edges.sort((a, b) => b.score - a.score);

  // Greedy clustering: one article per outlet per cluster, requiring strong similarity to cluster seed
  const assignedArticles = new Set<number>();
  interface RawCluster {
    members: IndexedArticle[];
    pairScores: number[];
    sharedCounts: Map<string, number>;
  }
  const builtClusters: RawCluster[] = [];

  for (const edge of edges) {
    if (assignedArticles.has(edge.i) && assignedArticles.has(edge.j)) continue;

    let targetCluster: RawCluster | undefined;
    let candidateIdx: number | null = null;

    if (assignedArticles.has(edge.i) && !assignedArticles.has(edge.j)) {
      targetCluster = builtClusters.find((c) => c.members.some((m) => m.idx === edge.i));
      candidateIdx = edge.j;
    } else if (assignedArticles.has(edge.j) && !assignedArticles.has(edge.i)) {
      targetCluster = builtClusters.find((c) => c.members.some((m) => m.idx === edge.j));
      candidateIdx = edge.i;
    }

    if (targetCluster && candidateIdx !== null) {
      const candidate = indexed[candidateIdx];
      const alreadyHasOutlet = targetCluster.members.some(
        (m) => m.art.outletId === candidate.art.outletId
      );
      if (alreadyHasOutlet) continue;

      const seed = targetCluster.members[0];
      const seedSim = computeArticlePairSimilarity(
        seed.titleTokens,
        seed.bodyTokens,
        seed.tfIdf,
        candidate.titleTokens,
        candidate.bodyTokens,
        candidate.tfIdf
      );
      if (seedSim.score < PAIR_SIMILARITY_THRESHOLD * 0.9) continue;

      targetCluster.members.push(candidate);
      targetCluster.pairScores.push(seedSim.score);
      seedSim.sharedKeywords.forEach((kw) => {
        targetCluster!.sharedCounts.set(kw, (targetCluster!.sharedCounts.get(kw) || 0) + 1);
      });
      assignedArticles.add(candidateIdx);
    } else if (!assignedArticles.has(edge.i) && !assignedArticles.has(edge.j)) {
      const sharedCounts = new Map<string, number>();
      edge.sharedKeywords.forEach((kw) => sharedCounts.set(kw, 1));
      builtClusters.push({
        members: [indexed[edge.i], indexed[edge.j]],
        pairScores: [edge.score],
        sharedCounts,
      });
      assignedArticles.add(edge.i);
      assignedArticles.add(edge.j);
    }
  }

  // Strictly require 3+ distinct outlets for "공통 보도"
  const qualifiedClusters = builtClusters.filter((c) => c.members.length >= 3);
  qualifiedClusters.sort((a, b) => {
    if (b.members.length !== a.members.length) return b.members.length - a.members.length;
    const avgA = a.pairScores.reduce((s, v) => s + v, 0) / Math.max(1, a.pairScores.length);
    const avgB = b.pairScores.reduce((s, v) => s + v, 0) / Math.max(1, b.pairScores.length);
    return avgB - avgA;
  });

  // Track all article indices belonging to any multi-outlet cluster (>= 2 outlets)
  const multiOutletClusterIndices = new Set<number>();
  for (const c of builtClusters) {
    if (c.members.length >= 2) {
      c.members.forEach((m) => multiOutletClusterIndices.add(m.idx));
    }
  }

  for (let cIdx = 0; cIdx < Math.min(5, qualifiedClusters.length); cIdx += 1) {
    const cluster = qualifiedClusters[cIdx];
    const uniqueByOutlet = cluster.members.map((m) => m.art);
    const uniqueOutlets = uniqueByOutlet.map((m) => m.outletName);

    const avgSim =
      cluster.pairScores.reduce((sum, v) => sum + v, 0) / Math.max(1, cluster.pairScores.length);
    const realSimilarityScore = Math.max(1, Math.min(99, Math.round(avgSim * 100)));

    const sharedKeywords = Array.from(cluster.sharedCounts.entries())
      .sort((a, b) => b[1] - a[1])
      .map(([kw]) => kw)
      .slice(0, 4);

    const representative = uniqueByOutlet[0];
    const clusterTitle = representative.title;

    const clusterOutlets = uniqueByOutlet.map((m) => {
      const meta = PRESS_OUTLETS.find((p) => p.id === m.outletId || p.name === m.outletName);
      const cleanUrl =
        m.link && !m.link.includes('news.google.com')
          ? m.link
          : getOfficialOutletHomepage(m.outletId, m.outletName);
      return {
        outletId: m.outletId,
        outletName: m.outletName,
        category: meta?.category === 'economy' ? '경제지' : '종합지',
        headline: m.title,
        leadSummary: generate3LineSummaryFromSnippet(m.title, m.snippet, m.outletName, m.leadSentences),
        stance: '동일 이슈 보도',
        originalUrl: cleanUrl,
        publishedAt: formatPublishedAtFromRaw(m.pubDate, todayFormatted, shortTime),
        reporter: m.reporter || `${m.outletName} 편집국`,
        fullContent: trimCitationExcerpt(m.fullBody || m.snippet),
        articleBlocks: trimCitationBlocks(m.articleBlocks),
        leadImage: m.leadImage,
        leadImageCaption: m.leadImageCaption,
      };
    });

    const sampleSummaries = uniqueByOutlet
      .slice(0, 3)
      .map((m) => `${m.outletName}: ${m.title}`);

    const primaryWithBody =
      uniqueByOutlet.find((m) => m.fullBody && m.fullBody.length >= 120) || representative;

    const integratedOneLineSummary = buildClusterIntegratedOneLineSummary(
      sharedKeywords,
      uniqueOutlets,
      clusterTitle
    );

    overlappingStories.push({
      id: `ol-cluster-${cIdx + 1}-${Date.now().toString(36)}`,
      outletId: 'multiple',
      outletName: `${uniqueOutlets.length}개 언론사 공통 보도 (${uniqueOutlets.join(', ')})`,
      category: 'overlapping',
      title: clusterTitle,
      leadSummary: sampleSummaries.slice(0, 3),
      baseSummary: sampleSummaries.slice(0, 3),
      originalUrl:
        clusterOutlets[0]?.originalUrl ||
        getOfficialOutletHomepage(representative.outletId, representative.outletName),
      publishedAt: formatPublishedAtFromRaw(representative.pubDate, todayFormatted, shortTime),
      keywords: sharedKeywords.length > 0 ? sharedKeywords : extractSearchKeywords(clusterTitle).split(' ').slice(0, 3),
      topic: inferTopicFromText(clusterTitle),
      similarityScore: realSimilarityScore,
      integratedOneLineSummary,
      coveredOutlets: uniqueOutlets,
      clusterOutlets,
      consensusPoints: [
        ...(sharedKeywords.length > 0
          ? [`공통 핵심어 (유사도 ${realSimilarityScore}%): ${sharedKeywords.join(', ')}`]
          : []),
        ...uniqueByOutlet.slice(0, 4).map((m) => `[${m.outletName}] ${m.title}`),
      ],
      fullContent: trimCitationExcerpt(primaryWithBody?.fullBody || primaryWithBody?.snippet),
      articleBlocks: trimCitationBlocks(primaryWithBody?.articleBlocks),
      leadImage: primaryWithBody?.leadImage,
      leadImageCaption: primaryWithBody?.leadImageCaption,
    });
  }

  // 3. Exclusive stories: strictly require explicit [단독] marker in title
  //    AND verify that NO other outlet covered the same story (not in any multi-outlet cluster & low cross-outlet similarity).
  const EXCLUSIVE_CROSS_COVERAGE_CUTOFF = 0.34;
  const realExclusives = indexed
    .filter((item) => EXPLICIT_EXCLUSIVE_TITLE_REGEX.test(item.art.title.trim()))
    .filter((item) => !multiOutletClusterIndices.has(item.idx))
    .filter((item) => (maxOtherOutletSimilarity.get(item.idx) || 0) < EXCLUSIVE_CROSS_COVERAGE_CUTOFF)
    .map((item) => item.art)
    .filter((art, idx, arr) => arr.findIndex((x) => x.outletId === art.outletId && areTitlesNearDuplicate(x.title, art.title)) === idx)
    .slice(0, 6);

  const exclusiveStories: NewsStory[] = realExclusives.map((art, idx) => {
    const baseSummary = generate3LineSummaryFromSnippet(art.title, art.snippet, art.outletName, art.leadSentences);
    return {
      id: `ex-${art.outletId}-${idx}-${Date.now().toString(36)}`,
      outletId: art.outletId,
      outletName: art.outletName,
      category: 'exclusive',
      title: art.title,
      leadSummary: baseSummary,
      baseSummary,
      originalUrl: art.link || getOfficialOutletHomepage(art.outletId, art.outletName),
      naverUrl: art.naverUrl || undefined,
      publishedAt: formatPublishedAtFromRaw(art.pubDate, todayFormatted, shortTime),
      keywords: extractSearchKeywords(art.title).split(' ').slice(0, 3),
      topic: inferTopicFromText(art.title),
      reporter: art.reporter || `${art.outletName} 편집국`,
      exclusiveBadge: `${art.outletName} 단독`,
      importanceRating: 'Crucial',
      reactions: { insightful: 0, important: 0, surprising: 0 },
      fullContent: trimCitationExcerpt(art.fullBody || art.snippet || ''),
      articleBlocks: trimCitationBlocks(art.articleBlocks),
      leadImage: art.leadImage,
      leadImageCaption: art.leadImageCaption,
    };
  });

  // Never silently substitute stale mock headlines into a live briefing
  const resolvedSectorHeadlines: SectorHeadlineItem[] = Array.isArray(sectorHeadlinesInput)
    ? sectorHeadlinesInput
    : [];

  // Rank default topKeywords by genuine cross-outlet & corpus frequency (never arbitrary outlet order)
  const keywordOutletSets = new Map<string, Set<string>>();
  const keywordDocCounts = new Map<string, number>();
  for (const art of allCollected) {
    const tokens = extractClusterTokens(art.title);
    for (const tok of tokens) {
      if (tok.length < 2 || /^\d+$/.test(tok)) continue;
      if (!keywordOutletSets.has(tok)) keywordOutletSets.set(tok, new Set());
      keywordOutletSets.get(tok)!.add(art.outletId);
      keywordDocCounts.set(tok, (keywordDocCounts.get(tok) || 0) + 1);
    }
  }
  const rankedTerms = Array.from(keywordDocCounts.entries())
    .sort((a, b) => {
      const outletsA = keywordOutletSets.get(a[0])?.size || 0;
      const outletsB = keywordOutletSets.get(b[0])?.size || 0;
      if (outletsB !== outletsA) return outletsB - outletsA;
      return b[1] - a[1];
    })
    .map(([term]) => `#${term}`);

  const topKeywords = (rankedTerms.length > 0 ? rankedTerms : allKeywords).slice(0, 8);
  const keywordTrends = computeKeywordTrends(
    topKeywords,
    [...frontPageStories, ...overlappingStories, ...exclusiveStories],
    resolvedSectorHeadlines,
    allCollected,
    Math.max(10, targetIds.length)
  );

  const hasLiveFrontPage = frontPageStories.length > 0;
  const hasLiveSector = resolvedSectorHeadlines.length > 0;

  const rawBriefing: DailyBriefing = {
    id: `briefing-real-${Date.now()}`,
    briefingDate: hasLiveFrontPage ? todayFormatted : `샘플 시점 (${SAMPLE_DATA_SNAPSHOT_DATE})`,
    briefingTime: hasLiveFrontPage ? `${nowKstTime} 수집` : '수집 실패',
    sourceType: hasLiveFrontPage ? 'live' : 'mock',
    sectorSourceType: hasLiveSector ? 'live' : 'mock',
    isFallback: !hasLiveFrontPage,
    ...(hasLiveFrontPage ? {} : { sampleSnapshotDate: SAMPLE_DATA_SNAPSHOT_DATE }),
    collectedAt: collectedAtIso,
    topKeywords,
    keywordTrends,
    tone,
    selectedOutletIds: targetIds,
    frontPageOutletIds: targetIds,
    overlappingOutletIds: targetIds,
    summaryNote: hasLiveFrontPage
      ? '선택한 대한민국 주요 언론사 공식 홈페이지 첫화면 및 뉴스 피드에서 수집한 최신 기사를 요약했습니다.'
      : '외부 언론사 피드 수집에 실패하여 실시간 기사를 불러오지 못했습니다. 잠시 후 [실시간 갱신]을 다시 시도해주세요.',
    frontPageStories,
    overlappingStories,
    exclusiveStories,
    sectorHeadlines: resolvedSectorHeadlines,
  };

  return transformBriefingTone(rawBriefing, tone);
}

/**
 * Collects cross-outlet related articles (from collected press pool + live Naver News search)
 * so Gemini can synthesize genuinely deep, multi-source [시사점] insights.
 */
export async function collectRelatedArticlesContext(
  stories: Array<{ id: string; title: string; outletName: string; keywords?: string[] }>,
  allCollected: RawRSSArticle[],
  sectorHeadlines: SectorHeadlineItem[] = []
): Promise<Record<string, Array<{ outletName: string; title: string; excerpt?: string }>>> {
  const result: Record<string, Array<{ outletName: string; title: string; excerpt?: string }>> = {};

  const localPool: Array<{ outletName: string; title: string; excerpt: string }> = [
    ...allCollected.map((a) => ({
      outletName: a.outletName,
      title: a.title,
      excerpt: (a.leadSentences?.[0] || a.snippet || '').slice(0, 140),
    })),
    ...sectorHeadlines.map((h) => ({
      outletName: h.outletName,
      title: h.title,
      excerpt: (h.summary || '').slice(0, 140),
    })),
  ];

  const needWebSearch: Array<{ id: string; query: string; title: string; outletName: string }> = [];

  for (const story of stories) {
    const tokens = extractSearchKeywords(story.title)
      .split(' ')
      .filter((w) => w.length >= 2);
    const matches: Array<{ outletName: string; title: string; excerpt?: string; score: number }> = [];

    for (const cand of localPool) {
      if (cand.title === story.title) continue;
      let score = 0;
      for (const tok of tokens) {
        if (cand.title.includes(tok)) score += 2;
        else if (cand.excerpt.includes(tok)) score += 1;
      }
      if (score >= 2) {
        matches.push({
          outletName: cand.outletName,
          title: cand.title,
          excerpt: cand.excerpt || undefined,
          score: cand.outletName !== story.outletName ? score + 1 : score,
        });
      }
    }

    matches.sort((a, b) => b.score - a.score);
    const deduped: Array<{ outletName: string; title: string; excerpt?: string }> = [];
    for (const m of matches) {
      if (!deduped.some((d) => d.title === m.title)) {
        deduped.push({ outletName: m.outletName, title: m.title, excerpt: m.excerpt });
      }
      if (deduped.length >= 3) break;
    }

    result[story.id] = deduped;

    // Queue lightweight Naver News search for top stories with fewer than 2 local related articles
    if (deduped.length < 2 && tokens.length >= 2 && needWebSearch.length < 8) {
      needWebSearch.push({
        id: story.id,
        query: tokens.slice(0, 3).join(' '),
        title: story.title,
        outletName: story.outletName,
      });
    }
  }

  // Fetch related Naver News search headlines in parallel (strictly 2500ms timeout so briefing stays snappy)
  if (needWebSearch.length > 0) {
    await Promise.allSettled(
      needWebSearch.map(async (item) => {
        const res = await fetchHtmlFast(
          `https://search.naver.com/search.naver?where=news&sort=0&query=${encodeURIComponent(item.query)}`,
          2500,
          2,
          0
        );
        if (!res.ok || !res.text) return;

        const html = res.text;
        const found: Array<{ outletName: string; title: string }> = [];
        // Extract article titles from Naver news search result anchors
        const anchorMatches = [
          ...html.matchAll(/<a[^>]*class=["'][^"']*news_tit[^"']*["'][^>]*title=["']([^"']+)["']/gi),
        ];
        for (const m of anchorMatches) {
          const t = decodeHtmlEntities(m[1]).trim();
          if (t && t.length >= 10 && t !== item.title && !found.some((f) => f.title === t)) {
            found.push({ outletName: '관련보도', title: t });
          }
          if (found.length >= 3) break;
        }
        // Alternate Naver markup fallback (sds-comps / api_txt_lines)
        if (found.length === 0) {
          const altMatches = [
            ...html.matchAll(/<span[^>]*class=["'][^"']*sds-comps-text-type-headline1[^"']*["'][^>]*>([\s\S]*?)<\/span>/gi),
          ];
          for (const m of altMatches) {
            const t = decodeHtmlEntities(m[1].replace(/<[^>]+>/g, ' ')).trim();
            if (t && t.length >= 10 && t !== item.title && !found.some((f) => f.title === t)) {
              found.push({ outletName: '관련보도', title: t });
            }
            if (found.length >= 3) break;
          }
        }

        if (found.length > 0) {
          const existing = result[item.id] || [];
          for (const f of found) {
            if (!existing.some((e) => e.title === f.title)) {
              existing.push(f);
            }
            if (existing.length >= 3) break;
          }
          result[item.id] = existing;
        }
      })
    );
  }

  return result;
}
