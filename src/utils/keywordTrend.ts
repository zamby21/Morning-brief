import type {
  DailyBriefing,
  KeywordTrendData,
  KeywordTrendPoint,
  NewsStory,
  SectorHeadlineItem,
} from '../types/news.ts';

export interface RawArticleForTrend {
  outletName: string;
  title: string;
  snippet?: string;
  pubDate?: string;
}

export interface RealTrendSnapshot {
  hourBucketKey: string;
  timeLabel: string;
  timestampMs: number;
  outletCount: number;
}

// In-memory store of genuine observed outlet counts per keyword over time (no synthetic/hash fallbacks).
// Pruned to a rolling 24-hour window and hydrated/persisted by server persistentStore.
const observedKeywordHistory = new Map<string, RealTrendSnapshot[]>();
const TWENTY_FOUR_HOURS_MS = 24 * 60 * 60 * 1000;

export function hydrateKeywordTrendHistory(
  serialized: Record<string, RealTrendSnapshot[]> | null | undefined
): void {
  if (!serialized || typeof serialized !== 'object') return;
  const cutoff = Date.now() - TWENTY_FOUR_HOURS_MS;
  for (const [key, snaps] of Object.entries(serialized)) {
    if (!Array.isArray(snaps)) continue;
    const valid = snaps
      .filter(
        (s) =>
          s &&
          typeof s.hourBucketKey === 'string' &&
          typeof s.timestampMs === 'number' &&
          s.timestampMs >= cutoff &&
          typeof s.outletCount === 'number'
      )
      .sort((a, b) => a.timestampMs - b.timestampMs);
    if (valid.length === 0) continue;
    const existing = observedKeywordHistory.get(key) || [];
    const mergedByBucket = new Map<string, RealTrendSnapshot>();
    for (const s of [...valid, ...existing]) {
      if (s.timestampMs >= cutoff) {
        mergedByBucket.set(s.hourBucketKey, s);
      }
    }
    observedKeywordHistory.set(
      key,
      Array.from(mergedByBucket.values()).sort((a, b) => a.timestampMs - b.timestampMs)
    );
  }
}

export function serializeKeywordTrendHistory(): Record<string, RealTrendSnapshot[]> {
  const cutoff = Date.now() - TWENTY_FOUR_HOURS_MS;
  const result: Record<string, RealTrendSnapshot[]> = {};
  for (const [key, snaps] of observedKeywordHistory.entries()) {
    const fresh = snaps.filter((s) => s.timestampMs >= cutoff);
    if (fresh.length > 0) {
      result[key] = fresh.slice(-24);
    }
  }
  return result;
}

const TREND_IGNORED_TOKENS = new Set([
  '이어', '대한', '통해', '위해', '따른', '대해', '관련', '가운데', '것으로',
  '오늘', '내일', '어제', '이번', '지난', '올해', '내년', '최근', '현재',
  '있다', '없다', '했다', '한다', '됐다', '된다', '이다', '하며', '라며',
]);

function escapeRegExp(str: string): string {
  return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function normalizeKeywordTokens(keyword: string): string[] {
  const clean = keyword.replace(/^#/, '').trim().toLowerCase();
  if (!clean || TREND_IGNORED_TOKENS.has(clean)) return [];
  const parts = clean
    .split(/[\s·,/+-]+/)
    .map((p) => p.trim())
    .filter((p) => p.length >= 2 && !TREND_IGNORED_TOKENS.has(p));
  return parts.length > 0 ? Array.from(new Set([clean, ...parts])) : [clean];
}

function textMatchesKeyword(text: string | undefined, tokens: string[]): boolean {
  if (!text || tokens.length === 0) return false;
  const lower = text.toLowerCase();
  return tokens.some((tok) => {
    if (tok.length < 2 || TREND_IGNORED_TOKENS.has(tok)) return false;
    const escaped = escapeRegExp(tok);
    const isShortKorean = /^[가-힣]{2}$/.test(tok);
    if (isShortKorean) {
      // Prevent short 2-char Korean words from matching inside conjugated verbs or unrelated words
      const boundaryRegex = new RegExp(
        `(?:^|[\\s"'‘’“”\\[(\\-·,.:;!?#])${escaped}(?:$|\\s|["'‘’“”\\])\\-·,.:;!?]|은|는|이|가|을|를|의|에|서|로|와|과|도|만)`
      );
      return boundaryRegex.test(lower);
    }
    const startBoundaryRegex = new RegExp(`(?:^|[\\s"'‘’“”\\[(\\-·,.:;!?#])${escaped}`);
    return startBoundaryRegex.test(lower);
  });
}

function getKstHourBucket(nowMs: number): { hourBucketKey: string; timeLabel: string; hour: number } {
  const kstDate = new Date(nowMs + 9 * 60 * 60 * 1000);
  const yyyy = kstDate.getUTCFullYear();
  const mm = String(kstDate.getUTCMonth() + 1).padStart(2, '0');
  const dd = String(kstDate.getUTCDate()).padStart(2, '0');
  const hh = kstDate.getUTCHours();
  const hhStr = String(hh).padStart(2, '0');
  return {
    hourBucketKey: `${yyyy}-${mm}-${dd}T${hhStr}`,
    timeLabel: `${hhStr}시`,
    hour: hh,
  };
}

function recordObservedSnapshot(keywordKey: string, outletCount: number, nowMs: number): RealTrendSnapshot[] {
  const cutoff = nowMs - TWENTY_FOUR_HOURS_MS;
  const existing = (observedKeywordHistory.get(keywordKey) || []).filter(
    (snap) => snap.timestampMs >= cutoff
  );
  const bucket = getKstHourBucket(nowMs);
  const sameBucketIdx = existing.findIndex((s) => s.hourBucketKey === bucket.hourBucketKey);
  const nextSnap: RealTrendSnapshot = {
    hourBucketKey: bucket.hourBucketKey,
    timeLabel: bucket.timeLabel,
    timestampMs: nowMs,
    outletCount,
  };

  if (sameBucketIdx >= 0) {
    existing[sameBucketIdx] = nextSnap;
  } else {
    existing.push(nextSnap);
  }

  existing.sort((a, b) => a.timestampMs - b.timestampMs);
  observedKeywordHistory.set(keywordKey, existing);
  return existing;
}

/**
 * Computes strictly factual keyword coverage metrics from real matched articles only.
 * Never fabricates outlet counts, outlet names, percentage changes, or synthetic 24h series.
 * Historical 24h trend curves and deltas are only populated once genuine multi-hour
 * observations have been recorded.
 */
export function computeKeywordTrend(
  rawKeyword: string,
  stories: NewsStory[] = [],
  sectorHeadlines: SectorHeadlineItem[] = [],
  rawArticles: RawArticleForTrend[] = [],
  _totalMonitoredOutlets = 10,
  recordHistory = true
): KeywordTrendData {
  const displayKeyword = rawKeyword.startsWith('#') ? rawKeyword : `#${rawKeyword}`;
  const historyKey = displayKeyword.replace(/^#/, '').trim().toLowerCase();
  const tokens = normalizeKeywordTokens(displayKeyword);

  const matchedOutlets = new Set<string>();
  const matchedTitles = new Set<string>();

  for (const story of stories) {
    const keywordMatch = (story.keywords || []).some((k) => textMatchesKeyword(k, tokens));
    const titleMatch = textMatchesKeyword(story.title, tokens);
    const summaryMatch = (story.leadSummary || []).some((l) => textMatchesKeyword(l, tokens));

    if (keywordMatch || titleMatch || summaryMatch) {
      matchedTitles.add(`${story.outletName}:${story.title}`);
      if (story.coveredOutlets && story.coveredOutlets.length > 0) {
        story.coveredOutlets.forEach((o) => {
          if (o) matchedOutlets.add(o);
        });
      } else if (story.outletName && !story.outletName.includes('언론사')) {
        matchedOutlets.add(story.outletName);
      }
    }
  }

  for (const item of sectorHeadlines) {
    const tagMatch = (item.tags || []).some((t) => textMatchesKeyword(t, tokens));
    const titleMatch = textMatchesKeyword(item.title, tokens);
    const summaryMatch = textMatchesKeyword(item.summary, tokens);
    if (tagMatch || titleMatch || summaryMatch) {
      matchedTitles.add(`${item.outletName}:${item.title}`);
      if (item.outletName) matchedOutlets.add(item.outletName);
    }
  }

  for (const art of rawArticles) {
    if (textMatchesKeyword(art.title, tokens) || textMatchesKeyword(art.snippet, tokens)) {
      matchedTitles.add(`${art.outletName}:${art.title}`);
      if (art.outletName) matchedOutlets.add(art.outletName);
    }
  }

  const coveredOutlets = Array.from(matchedOutlets);
  const currentOutletCount = coveredOutlets.length;
  const matchedArticleCount = matchedTitles.size;

  const nowMs = Date.now();
  const history = recordHistory
    ? recordObservedSnapshot(historyKey, currentOutletCount, nowMs)
    : (observedKeywordHistory.get(historyKey) || []).filter(
        (snap) => snap.timestampMs >= nowMs - TWENTY_FOUR_HOURS_MS
      );

  // Only claim a historical trend when we actually have >= 2 distinct hourly observations
  const hasHistoricalTrend = history.length >= 2;

  if (!hasHistoricalTrend) {
    return {
      keyword: displayKeyword,
      dailyChangePercent: null,
      direction: 'flat',
      currentOutletCount,
      previousOutletCount: null,
      matchedArticleCount,
      coveredOutlets,
      hourlySeries: [],
      peakHourLabel: '수집 중',
      peakOutletCount: currentOutletCount,
      hasHistoricalTrend: false,
    };
  }

  const hourlySeries: KeywordTrendPoint[] = history.map((snap, idx) => {
    const hoursAgo = Math.max(0, Math.round((nowMs - snap.timestampMs) / (60 * 60 * 1000)));
    return {
      hourLabel: idx === history.length - 1 || hoursAgo === 0 ? '현재' : `-${hoursAgo}h`,
      timeLabel: snap.timeLabel,
      outletCount: snap.outletCount,
    };
  });

  const baselineOutletCount = history[0].outletCount;
  let dailyChangePercent = 0;
  if (baselineOutletCount > 0) {
    dailyChangePercent = Math.round(
      ((currentOutletCount - baselineOutletCount) / baselineOutletCount) * 100
    );
  } else if (currentOutletCount > 0) {
    dailyChangePercent = 100;
  }

  let peakPoint = hourlySeries[hourlySeries.length - 1];
  for (const pt of hourlySeries) {
    if (pt.outletCount >= peakPoint.outletCount) {
      peakPoint = pt;
    }
  }

  const direction: 'up' | 'down' | 'flat' =
    dailyChangePercent > 0 ? 'up' : dailyChangePercent < 0 ? 'down' : 'flat';

  return {
    keyword: displayKeyword,
    dailyChangePercent,
    direction,
    currentOutletCount,
    previousOutletCount: baselineOutletCount,
    matchedArticleCount,
    coveredOutlets,
    hourlySeries,
    peakHourLabel: peakPoint.hourLabel === '현재' ? '현재' : peakPoint.timeLabel,
    peakOutletCount: peakPoint.outletCount,
    hasHistoricalTrend: true,
  };
}

export function computeKeywordTrends(
  keywords: string[],
  stories: NewsStory[] = [],
  sectorHeadlines: SectorHeadlineItem[] = [],
  rawArticles: RawArticleForTrend[] = [],
  totalMonitoredOutlets = 10
): Record<string, KeywordTrendData> {
  const trends: Record<string, KeywordTrendData> = {};
  for (const kw of keywords) {
    const displayKw = kw.startsWith('#') ? kw : `#${kw}`;
    trends[displayKw] = computeKeywordTrend(
      displayKw,
      stories,
      sectorHeadlines,
      rawArticles,
      totalMonitoredOutlets,
      true
    );
  }
  return trends;
}

export function getKeywordTrendForBriefing(
  keyword: string,
  briefing?: DailyBriefing
): KeywordTrendData {
  const displayKw = keyword.startsWith('#') ? keyword : `#${keyword}`;
  const precomputed = briefing?.keywordTrends?.[displayKw] || briefing?.keywordTrends?.[keyword];
  if (precomputed) {
    return {
      ...precomputed,
      hasHistoricalTrend: Boolean(precomputed.hasHistoricalTrend && precomputed.hourlySeries?.length >= 2),
      dailyChangePercent:
        precomputed.hasHistoricalTrend && typeof precomputed.dailyChangePercent === 'number'
          ? precomputed.dailyChangePercent
          : null,
      previousOutletCount:
        precomputed.hasHistoricalTrend && typeof precomputed.previousOutletCount === 'number'
          ? precomputed.previousOutletCount
          : null,
    };
  }

  const allStories: NewsStory[] = [
    ...(briefing?.frontPageStories || []),
    ...(briefing?.overlappingStories || []),
    ...(briefing?.exclusiveStories || []),
  ];
  const sectorItems: SectorHeadlineItem[] = briefing?.sectorHeadlines || [];
  const monitoredCount = Math.max(10, briefing?.selectedOutletIds?.length || 10);

  return computeKeywordTrend(displayKw, allStories, sectorItems, [], monitoredCount, false);
}
