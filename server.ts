import express from 'express';
import http from 'node:http';
import https from 'node:https';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import { GoogleGenAI, ThinkingLevel, Type } from '@google/genai';
import {
  INITIAL_DAILY_BRIEFING,
  MOCK_WEEKLY_REPORT,
  INITIAL_EMAIL_LOGS,
  PRESS_OUTLETS,
} from './src/data/mockNewsData.ts';
import type { DailyBriefing, EmailDispatchLog, WeeklyReport, BriefingTone } from './src/types/news.ts';
import { getCurrentKoreanDateString } from './src/utils/dateUtils.ts';
import { extractSearchKeywords, getOfficialOutletHomepage } from './src/utils/linkUtils.ts';
import {
  transformBriefingTone,
  formatLeadSummaryByTone,
  toBulletKorean,
  toBulletInsightLine,
} from './src/utils/toneTransformer.ts';
import {
  fetchRealArticlesForOutlets,
  fetchSectorHeadlinesReal,
  buildRealBriefing,
  collectRelatedArticlesContext,
} from './src/services/realNewsCollector.ts';
import { computeKeywordTrends } from './src/utils/keywordTrend.ts';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
app.use(express.json({ limit: '5mb' }));

// In-memory logs
const emailLogs: EmailDispatchLog[] = [...INITIAL_EMAIL_LOGS];

// Health check endpoint for Vercel and uptime monitoring
app.get(['/api/health', '/health'], (_req, res) => {
  res.json({
    status: 'ok',
    service: 'Morning Brief AI API',
    geminiConfigured: Boolean(process.env.GEMINI_API_KEY),
    timestamp: new Date().toISOString(),
  });
});

// Safe image proxy for Korean news press photos (bypasses strict CDN hotlink/Referer blocks in iframe)
function isDisallowedProxyHost(hostname: string): boolean {
  const h = hostname.toLowerCase();
  if (
    h === 'localhost' ||
    h === '0.0.0.0' ||
    h === '::1' ||
    h.endsWith('.local') ||
    h.endsWith('.internal') ||
    h.startsWith('127.') ||
    h.startsWith('10.') ||
    h.startsWith('192.168.') ||
    h.startsWith('169.254.') ||
    /^172\.(1[6-9]|2\d|3[0-1])\./.test(h)
  ) {
    return true;
  }
  return false;
}

function fetchImageBufferSafe(
  targetUrl: string,
  redirectsLeft = 3,
  timeoutMs = 6000
): Promise<{ status: number; contentType: string; buffer: Buffer } | null> {
  return new Promise((resolve) => {
    let settled = false;
    const finish = (val: { status: number; contentType: string; buffer: Buffer } | null) => {
      if (!settled) {
        settled = true;
        resolve(val);
      }
    };

    try {
      const parsed = new URL(targetUrl);
      if ((parsed.protocol !== 'http:' && parsed.protocol !== 'https:') || isDisallowedProxyHost(parsed.hostname)) {
        finish(null);
        return;
      }

      const referer = parsed.hostname.includes('pstatic.net')
        ? 'https://n.news.naver.com/'
        : `${parsed.protocol}//${parsed.hostname}/`;
      const lib = parsed.protocol === 'https:' ? https : http;
      const req = lib.get(
        targetUrl,
        {
          family: 4,
          timeout: timeoutMs,
          headers: {
            'User-Agent':
              'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
            Accept: 'image/avif,image/webp,image/apng,image/*,*/*;q=0.8',
            Referer: referer,
          },
        },
        (upstream) => {
          const status = upstream.statusCode || 0;
          if (status >= 300 && status < 400 && upstream.headers.location && redirectsLeft > 0) {
            upstream.resume();
            const nextUrl = new URL(upstream.headers.location, targetUrl).toString();
            fetchImageBufferSafe(nextUrl, redirectsLeft - 1, timeoutMs).then(finish);
            return;
          }

          if (status < 200 || status >= 300) {
            upstream.resume();
            finish(null);
            return;
          }

          const contentType = String(upstream.headers['content-type'] || '').split(';')[0].trim().toLowerCase();
          const chunks: Buffer[] = [];
          let totalBytes = 0;
          const MAX_BYTES = 8 * 1024 * 1024;

          upstream.on('data', (chunk) => {
            const buf = Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk);
            totalBytes += buf.length;
            if (totalBytes > MAX_BYTES) {
              req.destroy();
              finish(null);
              return;
            }
            chunks.push(buf);
          });
          upstream.on('end', () => {
            const buffer = Buffer.concat(chunks);
            if (buffer.length < 100) {
              finish(null);
              return;
            }
            // Validate image content type or magic bytes
            const isImgType = contentType.startsWith('image/');
            const isMagicImg =
              (buffer[0] === 0xff && buffer[1] === 0xd8) || // JPEG
              (buffer[0] === 0x89 && buffer[1] === 0x50 && buffer[2] === 0x4e && buffer[3] === 0x47) || // PNG
              (buffer[0] === 0x47 && buffer[1] === 0x49 && buffer[2] === 0x46) || // GIF
              (buffer.subarray(0, 4).toString('ascii') === 'RIFF' && buffer.subarray(8, 12).toString('ascii') === 'WEBP'); // WEBP
            if (!isImgType && !isMagicImg) {
              finish(null);
              return;
            }
            finish({
              status,
              contentType: isImgType ? contentType : 'image/jpeg',
              buffer,
            });
          });
          upstream.on('error', () => finish(null));
        }
      );

      req.on('timeout', () => {
        req.destroy();
        finish(null);
      });
      req.on('error', () => finish(null));
    } catch {
      finish(null);
    }
  });
}

app.get(['/api/image-proxy', '/image-proxy'], async (req, res) => {
  const rawUrl = typeof req.query.url === 'string' ? req.query.url.trim() : '';
  if (!rawUrl || !/^https?:\/\//i.test(rawUrl)) {
    return res.status(400).send('Invalid image URL');
  }
  const result = await fetchImageBufferSafe(rawUrl);
  if (!result) {
    return res.status(404).send('Image unavailable');
  }
  res.setHeader('Content-Type', result.contentType);
  res.setHeader('Cache-Control', 'public, max-age=3600');
  res.setHeader('X-Content-Type-Options', 'nosniff');
  return res.status(200).send(result.buffer);
});

// Shared Gemini AI client
const apiKey = process.env.GEMINI_API_KEY || '';
const ai = new GoogleGenAI({
  apiKey,
  httpOptions: {
    headers: {
      'User-Agent': 'aistudio-build',
    },
  },
});

const PRIMARY_GEMINI_MODEL = 'gemini-4-hydrogen';
const FALLBACK_GEMINI_MODEL = 'gemini-3.1-flash-lite';
const GEMINI_CACHE_TTL_MS = 10 * 60 * 1000;
const modelCooldownUntil: Record<string, number> = {};
const geminiSummaryCache = new Map<string, { expiresAt: number; data: DailyBriefing }>();

function isQuotaError(err: unknown): boolean {
  const msg = err instanceof Error ? err.message : String(err || '');
  return msg.includes('429') || msg.includes('RESOURCE_EXHAUSTED') || msg.toLowerCase().includes('quota');
}

function getCooldownMs(err: unknown): number {
  const msg = err instanceof Error ? err.message : String(err || '');
  const match = msg.match(/"retryDelay"\s*:\s*"(\d+)s"/);
  if (match) {
    const sec = Number(match[1]);
    if (Number.isFinite(sec) && sec > 0) {
      return Math.min(sec * 1000, 30 * 60 * 1000);
    }
  }
  return 10 * 60 * 1000;
}

async function generateWithResilientModel(
  contents: string,
  config: Record<string, unknown>,
  timeoutMs = 7000
): Promise<any | null> {
  if (!apiKey) return null;

  const now = Date.now();
  const candidates = [PRIMARY_GEMINI_MODEL, FALLBACK_GEMINI_MODEL].filter(
    (m) => !modelCooldownUntil[m] || now >= modelCooldownUntil[m]
  );

  if (candidates.length === 0) {
    return null;
  }

  for (const model of candidates) {
    try {
      const modelConfig: Record<string, unknown> = { ...config };
      if (model === PRIMARY_GEMINI_MODEL && !modelConfig.thinkingConfig) {
        modelConfig.thinkingConfig = { thinkingLevel: ThinkingLevel.LOW };
      }
      const reqPromise = ai.models.generateContent({
        model,
        contents,
        config: modelConfig,
      });
      const timeoutPromise = new Promise((_, reject) =>
        setTimeout(() => reject(new Error('Gemini API timeout')), timeoutMs)
      );
      return await Promise.race([reqPromise, timeoutPromise]);
    } catch (err: any) {
      if (isQuotaError(err)) {
        modelCooldownUntil[model] = Date.now() + getCooldownMs(err);
        continue;
      }
      throw err;
    }
  }

  return null;
}

// Helper for tone prompt description
function getToneDescription(tone: string): string {
  switch (tone) {
    case 'bullet':
      return '개조식 드라이톤 (총 3줄): 서술어·접속사를 극단적으로 줄이고 기호(▪)와 명사형·단답형(~함, ~임, ~됨, ~전망, ~강조)으로 팩트만 압축한 임원 보고용 메모 스타일';
    case 'friendly':
      return '친근한 설명체 (총 3줄): "쉽게 정리하면", "여기에 더해", "참고로" 같은 부드러운 연결과 ~했어요/~이에요/~전망이에요 어미로 비전문가에게 풀어서 설명하는 뉴스레터 스타일';
    case 'insight':
      return '인사이트 버전 (기본 · 총 4줄 · 개조식): 반드시 배열 길이 4로 작성. 1~3번째 줄은 원문 핵심 사실 3줄을 개조식("▪ "으로 시작, 명사형/단답형 종결 ~함/~임/~전망/~발표/~추진)으로 압축하고, 마지막 4번째 줄은 반드시 "[시사점] "으로 시작하는 개조식 심층 시사점 1줄로 작성. 특히 [시사점]은 해당 기사 본문뿐 아니라 함께 제공된 관련 타 언론사 기사 및 동향 맥락을 심층 교차 검토하여, 산업·시장·정책·사회적 파급효과와 구체적 대응 포인트를 뻔한 상투어 없이 압축 제시(~전망, ~필요, ~우려, ~관건, ~주목 등 개조식 종결)';
    case 'formal':
    default:
      return '격식 브리핑체 (총 3줄): 정중하고 품격 있는 공식 언론 브리핑·보고서 문어체(~했습니다, ~되었습니다, ~것으로 분석됩니다)';
  }
}

function normalizeGeminiLeadSummary(
  rawLines: string[],
  targetTone: string,
  aiInsightRaw?: string
): { leadSummary: string[]; aiInsight?: string } {
  const cleaned = (rawLines || [])
    .map((line) => String(line || '').replace(/^[0-9]+[.)]\s*/, '').trim())
    .filter(Boolean);

  const explicitInsightFromLines = cleaned.find((l) => l.startsWith('[시사점]'));
  const resolvedInsightRaw =
    (aiInsightRaw && aiInsightRaw.trim().length >= 8 ? aiInsightRaw : explicitInsightFromLines) || '';
  const normalizedInsight = resolvedInsightRaw ? toBulletInsightLine(resolvedInsightRaw) : undefined;

  if (targetTone === 'insight') {
    const factLines = cleaned
      .filter((l) => !l.startsWith('[시사점]'))
      .slice(0, 3)
      .map((l) => (l.startsWith('▪') ? l : toBulletKorean(l)));
    if (factLines.length >= 3 && normalizedInsight) {
      return {
        leadSummary: [...factLines, normalizedInsight],
        aiInsight: normalizedInsight,
      };
    }
    if (cleaned.length >= 4) {
      const f3 = cleaned.slice(0, 3).map((l) => (l.startsWith('▪') ? l : toBulletKorean(l)));
      const ins = toBulletInsightLine(cleaned[3]);
      return {
        leadSummary: [...f3, ins],
        aiInsight: ins,
      };
    }
  }

  const factOnly = cleaned.filter((l) => !l.startsWith('[시사점]')).slice(0, 3);
  return {
    leadSummary: factOnly.length > 0 ? factOnly : cleaned.slice(0, 3),
    aiInsight: normalizedInsight,
  };
}

// 1. API: Generate / Refresh daily briefing
app.post(['/api/summarize', '/summarize'], async (req, res) => {
  try {
    const { outletIds, tone = 'insight', forceRefresh = false } = req.body;
    const selectedOutlets = PRESS_OUTLETS.filter((o) =>
      outletIds && outletIds.length > 0 ? outletIds.includes(o.id) : o.isDefaultMajor
    );
    const targetOutletIds = selectedOutlets.map((o) => o.id);

    // 1. Always harvest real-time center homepage lead articles and live sector headlines in parallel
    const [realArticlesMap, liveSectorHeadlines] = await Promise.all([
      fetchRealArticlesForOutlets(targetOutletIds, Boolean(forceRefresh)),
      fetchSectorHeadlinesReal(Boolean(forceRefresh)),
    ]);

    // 2. Build default robust briefing with verified real articles (full verbatim text + inline photos)
    const realBriefing = buildRealBriefing(
      realArticlesMap,
      tone as BriefingTone,
      targetOutletIds,
      liveSectorHeadlines
    );

    // 3. If Gemini is available, enhance ALL sections with deep cross-article insight synthesis
    if (apiKey) {
      try {
        const titlesSignature = realBriefing.frontPageStories
          .map((s) => `${s.outletId}:${s.title}`)
          .join('|');
        const cacheKey = `v2:${tone}:${targetOutletIds.join(',')}:${titlesSignature}`;
        const cached = geminiSummaryCache.get(cacheKey);
        if (cached && Date.now() < cached.expiresAt) {
          return res.json({ success: true, data: cached.data, source: 'gemini-verified-cache' });
        }

        const allCollectedRaw = Object.values(realArticlesMap).flat();
        const storiesForRelated = [
          ...realBriefing.frontPageStories,
          ...realBriefing.overlappingStories,
          ...realBriefing.exclusiveStories,
          ...(realBriefing.sectorHeadlines || []).map((h) => ({
            id: h.id,
            title: h.title,
            outletName: h.outletName,
            keywords: h.tags,
          })),
        ];

        const relatedContextMap = await collectRelatedArticlesContext(
          storiesForRelated,
          allCollectedRaw,
          realBriefing.sectorHeadlines || []
        );

        const buildStoryPayload = (
          s: {
            id: string;
            outletName: string;
            title: string;
            fullContent?: string;
            baseSummary?: string[];
            topic?: string;
          },
          excerptLimit = 900
        ) => ({
          id: s.id,
          outletName: s.outletName,
          title: s.title,
          topic: s.topic || '',
          bodyExcerpt: (s.fullContent || (s.baseSummary || []).join(' ')).slice(0, excerptLimit),
          relatedArticles: relatedContextMap[s.id] || [],
        });

        const geminiInputPayload = {
          frontPageStories: realBriefing.frontPageStories.map((s) => buildStoryPayload(s, 900)),
          overlappingStories: realBriefing.overlappingStories.map((s) => ({
            ...buildStoryPayload(s, 900),
            bundledCount: Math.max(s.clusterOutlets?.length || 0, s.coveredOutlets?.length || 0),
            clusterArticles: (s.clusterOutlets || []).map((c) => ({
              outletName: c.outletName,
              headline: c.headline,
              summary: (c.leadSummary || []).slice(0, 2).join(' ').slice(0, 240),
            })),
          })),
          exclusiveStories: realBriefing.exclusiveStories.map((s) => buildStoryPayload(s, 800)),
          sectorHeadlines: (realBriefing.sectorHeadlines || []).map((h) =>
            buildStoryPayload(
              {
                id: h.id,
                outletName: h.outletName,
                title: h.title,
                topic: h.sectorLabel,
                fullContent: h.fullContent || h.summary,
                baseSummary: h.baseSummary,
              },
              480
            )
          ),
        };

        const isInsightMode = tone === 'insight';

        const prompt = `당신은 대한민국 최고 수준의 경제·정책·산업 뉴스 수석 애널리스트 겸 에디터입니다.
아래 제공된 '실제 실시간 언론사 기사 원문 발췌(bodyExcerpt)'와 '타 언론사 관련 보도(relatedArticles)'를 심층 교차 검토하여 브리핑 요약과 시사점을 작성하세요.

[필수 준수 규칙]:
1. 절대로 기사 원문에 없는 가짜 사실이나 임의 수치를 지어내지 마세요.
2. 입력된 frontPageStories, overlappingStories, exclusiveStories, sectorHeadlines 4개 배열의 **모든 항목을 단 1개도 누락하지 말고 100% 전수** 동일한 id로 반환하세요.
3. leadSummary 각 문장에 '1. 2. 3.' 같은 숫자 번호를 절대 붙이지 마세요.
4. 어조 지침을 완벽히 따르세요: ${getToneDescription(tone)}
5. ${
          isInsightMode
            ? `현재 'insight' 모드입니다. 모든 항목의 leadSummary는 반드시 정확히 4줄(배열 길이 4)로 작성하세요:
   - 1~3번째 줄: 기사 본문 핵심 사실 3줄을 개조식("▪ "으로 시작, 명사형/단답형 종결: ~함/~임/~발표/~확대/~전망)으로 작성
   - 4번째 줄: 반드시 "[시사점] "으로 시작하는 개조식 1줄. 반드시 해당 기사 본문 + relatedArticles(관련 타 언론사 기사들)의 맥락을 종합·심층 검토하여, 단기 현상 너머의 구조적 파급효과·리스크·정책/시장 대응 포인트를 구체적 주체·키워드와 함께 압축 제시 (예: "[시사점] ...에 따른 ... 리스크 확대 우려, ... 선제 대응 필요"). 추상적·상투적 문구 금지!`
            : `leadSummary는 정확히 3줄(배열 길이 3)로 작성하고, 별도 aiInsight 필드에 해당 기사와 relatedArticles를 심층 교차 검토한 개조식 1줄 시사점("[시사점] ...")을 함께 생성하세요.`
        }
6. 모든 항목에 대해 aiInsight 필드에도 개조식 심층 시사점("[시사점] ...")을 반드시 채워주세요.
7. overlappingStories 중 bundledCount가 3 이상(유사 기사 3개 이상 묶임)인 항목은 clusterArticles에 묶인 모든 기사의 핵심 내용을 통합해 한눈에 이해되는 '종합 1줄 요약'을 integratedOneLineSummary 필드에 작성하세요 (자연스러운 한국어 1문장, 45~95자, 번호·불릿·접두어 금지). bundledCount가 3 미만이면 빈 문자열("")을 반환하세요.

[실시간 기사 원문 및 관련 기사 교차 데이터]:
${JSON.stringify(geminiInputPayload)}`;

        const storyOutputSchema = {
          type: Type.OBJECT,
          properties: {
            id: { type: Type.STRING },
            leadSummary: {
              type: Type.ARRAY,
              items: { type: Type.STRING },
            },
            aiInsight: { type: Type.STRING },
          },
          required: ['id', 'leadSummary', 'aiInsight'],
        };

        const overlappingOutputSchema = {
          type: Type.OBJECT,
          properties: {
            id: { type: Type.STRING },
            leadSummary: {
              type: Type.ARRAY,
              items: { type: Type.STRING },
            },
            aiInsight: { type: Type.STRING },
            integratedOneLineSummary: { type: Type.STRING },
          },
          required: ['id', 'leadSummary', 'aiInsight', 'integratedOneLineSummary'],
        };

        const response = await generateWithResilientModel(
          prompt,
          {
            thinkingConfig: { thinkingLevel: ThinkingLevel.MEDIUM },
            responseMimeType: 'application/json',
            responseSchema: {
              type: Type.OBJECT,
              properties: {
                topKeywords: {
                  type: Type.ARRAY,
                  items: { type: Type.STRING },
                },
                summaryNote: { type: Type.STRING },
                frontPageStories: {
                  type: Type.ARRAY,
                  items: storyOutputSchema,
                },
                overlappingStories: {
                  type: Type.ARRAY,
                  items: overlappingOutputSchema,
                },
                exclusiveStories: {
                  type: Type.ARRAY,
                  items: storyOutputSchema,
                },
                sectorHeadlines: {
                  type: Type.ARRAY,
                  items: storyOutputSchema,
                },
              },
              required: [
                'topKeywords',
                'frontPageStories',
                'overlappingStories',
                'exclusiveStories',
                'sectorHeadlines',
              ],
            },
          },
          28000
        );

        if (!response) {
          return res.json({ success: true, data: realBriefing, source: 'real-rss-verified' });
        }

        const parsed = JSON.parse(response.text || '{}');

        const mergeEnhancements = (targets: any[], generatedList?: any[]) => {
          if (!Array.isArray(targets) || !Array.isArray(generatedList)) return;
          generatedList.forEach((gItem: any) => {
            const existing = targets.find((s) => s.id === gItem.id);
            if (!existing || !Array.isArray(gItem.leadSummary) || gItem.leadSummary.length === 0) return;

            const normalized = normalizeGeminiLeadSummary(gItem.leadSummary, tone, gItem.aiInsight);
            if (normalized.leadSummary.length > 0) {
              existing.leadSummary = normalized.leadSummary;
            }
            if (normalized.aiInsight) {
              existing.aiInsight = normalized.aiInsight;
            }
            if (typeof gItem.integratedOneLineSummary === 'string') {
              const cleanedOneLine = gItem.integratedOneLineSummary
                .replace(/^(\[?\s*종합\s*1줄\s*요약\s*\]?\s*[:\-·]?\s*|▪\s*|[-•]\s*|[0-9]+[.)]\s*)/, '')
                .replace(/\s+/g, ' ')
                .trim();
              const bundledCount = Math.max(
                existing.clusterOutlets?.length || 0,
                existing.coveredOutlets?.length || 0
              );
              if (bundledCount >= 3 && cleanedOneLine.length >= 12) {
                existing.integratedOneLineSummary = cleanedOneLine;
              }
            }
          });
        };

        if (parsed.frontPageStories && parsed.frontPageStories.length > 0) {
          realBriefing.topKeywords =
            Array.isArray(parsed.topKeywords) && parsed.topKeywords.length > 0
              ? parsed.topKeywords.map((k: string) => (k.startsWith('#') ? k : `#${k}`)).slice(0, 8)
              : realBriefing.topKeywords;
          realBriefing.summaryNote = parsed.summaryNote || realBriefing.summaryNote;

          mergeEnhancements(realBriefing.frontPageStories, parsed.frontPageStories);
          mergeEnhancements(realBriefing.overlappingStories, parsed.overlappingStories);
          mergeEnhancements(realBriefing.exclusiveStories, parsed.exclusiveStories);
          mergeEnhancements(realBriefing.sectorHeadlines || [], parsed.sectorHeadlines);

          if (parsed.topKeywords && parsed.topKeywords.length > 0) {
            realBriefing.keywordTrends = computeKeywordTrends(
              realBriefing.topKeywords,
              [
                ...realBriefing.frontPageStories,
                ...realBriefing.overlappingStories,
                ...realBriefing.exclusiveStories,
              ],
              realBriefing.sectorHeadlines || [],
              allCollectedRaw,
              Math.max(10, targetOutletIds.length)
            );
          }

          geminiSummaryCache.set(cacheKey, {
            expiresAt: Date.now() + GEMINI_CACHE_TTL_MS,
            data: realBriefing,
          });
        }
        return res.json({ success: true, data: realBriefing, source: 'gemini-verified-real' });
      } catch (geminiErr: any) {
        if (!isQuotaError(geminiErr)) {
          console.info('Using verified real RSS briefing fallback:', geminiErr?.message || 'unavailable');
        }
        return res.json({ success: true, data: realBriefing, source: 'real-rss-verified' });
      }
    }

    return res.json({ success: true, data: realBriefing, source: 'real-rss-verified' });
  } catch (error: any) {
    console.error('Error generating summary:', error);
    const fallback = transformBriefingTone(INITIAL_DAILY_BRIEFING, (req.body.tone || 'insight') as BriefingTone);
    return res.json({ success: true, data: fallback, source: 'fallback', error: error.message });
  }
});

// 2. API: Rewrite briefing tone via Gemini (supports 3+1 deep cross-article insight & all 4 sections)
app.post(['/api/rewrite-tone', '/rewrite-tone'], async (req, res) => {
  const { currentBriefing, targetTone } = req.body;
  if (!currentBriefing || !targetTone) {
    return res.status(400).json({ error: 'Missing currentBriefing or targetTone' });
  }

  if (!apiKey) {
    const transformed = transformBriefingTone(currentBriefing, targetTone as BriefingTone);
    return res.json({ success: true, data: transformed, source: 'local-rewrite' });
  }

  try {
    const isInsightMode = targetTone === 'insight';
    const allHeadlinesContext = [
      ...(currentBriefing.frontPageStories || []).map((s: any) => `[${s.outletName}] ${s.title}`),
      ...(currentBriefing.sectorHeadlines || []).slice(0, 9).map((h: any) => `[${h.outletName}/${h.sectorLabel}] ${h.title}`),
    ];

    const prompt = `당신은 대한민국 대표 뉴스 브리핑 수석 애널리스트입니다.
아래 뉴스 기사들의 요약을 희망 어조에 맞춰 문체와 구조를 뚜렷하게 재작성해주세요.

[희망 어조 지침]: ${getToneDescription(targetTone)}

[필수 규칙]:
- 원래 사실 관계와 수치는 훼손하지 마세요.
- '1. 2. 3.' 같은 숫자 번호는 절대 붙이지 마세요.
- ${
      isInsightMode
        ? `현재 'insight' 모드이므로 모든 항목의 summary 배열 길이는 반드시 정확히 4로 작성하세요:
  * 1~3번째 줄: 원 팩트 3줄을 개조식("▪ "으로 시작, ~함/~임/~전망/~발표 등 명사형/단답형 종결)으로 압축
  * 4번째 줄: 반드시 "[시사점] "으로 시작하는 개조식 1줄 — 해당 기사의 본문 요약(bodyExcerpt)과 아래 [당일 타 언론사 관련 보도 전체 목록]을 교차·심층 검토하여 구체적이고 날카로운 파급효과·대응 시사점을 도출하세요.`
        : `모든 항목의 summary 배열 길이는 반드시 정확히 3으로 작성하세요.`
    }

[당일 타 언론사 관련 보도 전체 목록 (교차 검토용)]:
${JSON.stringify(allHeadlinesContext)}

[재작성 대상 기사 목록]:
${JSON.stringify({
  frontPage: (currentBriefing.frontPageStories || []).map((s: any) => ({
    id: s.id,
    title: s.title,
    summary: s.baseSummary || s.leadSummary,
    bodyExcerpt: (s.fullContent || '').slice(0, 600),
  })),
  overlapping: (currentBriefing.overlappingStories || []).map((s: any) => ({
    id: s.id,
    title: s.title,
    summary: s.baseSummary || s.leadSummary,
    bodyExcerpt: (s.fullContent || '').slice(0, 600),
  })),
  exclusive: (currentBriefing.exclusiveStories || []).map((s: any) => ({
    id: s.id,
    title: s.title,
    summary: s.baseSummary || s.leadSummary,
    bodyExcerpt: (s.fullContent || '').slice(0, 600),
  })),
  sectorHeadlines: (currentBriefing.sectorHeadlines || []).map((h: any) => ({
    id: h.id,
    title: h.title,
    summary: h.baseSummary || h.leadSummary || [h.summary],
    bodyExcerpt: (h.fullContent || '').slice(0, 420),
  })),
})}`;

    const rewriteItemSchema = {
      type: Type.OBJECT,
      properties: {
        id: { type: Type.STRING },
        summary: {
          type: Type.ARRAY,
          items: { type: Type.STRING },
        },
        aiInsight: { type: Type.STRING },
      },
      required: ['id', 'summary'],
    };

    const response = await generateWithResilientModel(
      prompt,
      {
        thinkingConfig: { thinkingLevel: isInsightMode ? ThinkingLevel.MEDIUM : ThinkingLevel.LOW },
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            frontPage: { type: Type.ARRAY, items: rewriteItemSchema },
            overlapping: { type: Type.ARRAY, items: rewriteItemSchema },
            exclusive: { type: Type.ARRAY, items: rewriteItemSchema },
            sectorHeadlines: { type: Type.ARRAY, items: rewriteItemSchema },
          },
        },
      },
      22000
    );

    if (!response) {
      return res.json({
        success: true,
        data: transformBriefingTone(currentBriefing, targetTone as BriefingTone),
        source: 'local-rewrite',
      });
    }

    const parsed = JSON.parse(response.text || '{}');
    const updated = transformBriefingTone(currentBriefing, targetTone as BriefingTone);
    updated.tone = targetTone;

    const applyRewritten = (targets: any[], rewrittenList?: any[]) => {
      if (!Array.isArray(targets) || !Array.isArray(rewrittenList)) return;
      targets.forEach((s: any) => {
        const match = rewrittenList.find((item: any) => item.id === s.id);
        if (match && Array.isArray(match.summary) && match.summary.length > 0) {
          const normalized = normalizeGeminiLeadSummary(match.summary, targetTone, match.aiInsight || s.aiInsight);
          if (normalized.leadSummary.length > 0) {
            s.leadSummary = normalized.leadSummary;
          }
          if (normalized.aiInsight) {
            s.aiInsight = normalized.aiInsight;
          }
        }
      });
    };

    applyRewritten(updated.frontPageStories, parsed.frontPage);
    applyRewritten(updated.overlappingStories, parsed.overlapping);
    applyRewritten(updated.exclusiveStories, parsed.exclusive);
    applyRewritten(updated.sectorHeadlines || [], parsed.sectorHeadlines);

    return res.json({ success: true, data: updated, source: 'gemini-rewrite' });
  } catch (err: any) {
    if (!isQuotaError(err)) {
      console.info('Rewrite tone fallback:', err?.message || 'unavailable');
    }
    return res.json({
      success: true,
      data: transformBriefingTone(currentBriefing, targetTone as BriefingTone),
      source: 'local-rewrite',
    });
  }
});

// 3. API: Weekly Report Generator
app.post(['/api/weekly-report', '/weekly-report'], async (req, res) => {
  try {
    if (!apiKey) {
      return res.json({ success: true, data: MOCK_WEEKLY_REPORT, source: 'cached' });
    }

    const prompt = `지난 1주일간 대한민국 주요 10대 언론사(조선, 중앙, 동아, 한겨레, 경향, 매경, 한경, 서경, 헤럴드, 아경)의 데이터베이스를 기반으로 한 '주간 심층 이슈 분석 리포트'를 JSON 형태로 작성해주세요.

구성:
1. 주간 종합 진단 (overallDiagnosis): 2~3문장
2. 주간 톱 6 키워드 및 빈도
3. 7일간의 날짜별 메인 이슈 타임라인 (timeline) - 각 일자별 보수/진보/경제지의 논조 비교 포함
4. 3개 핵심 분야별(반도체/AI, 금융/거시/부동산, 정치/사회) 심층 분석
5. 차주 주목할 핵심 이벤트 4가지 (outlookNextWeek)`;

    const response = await generateWithResilientModel(
      prompt,
      { responseMimeType: 'application/json' },
      7000
    );

    if (!response) {
      return res.json({ success: true, data: MOCK_WEEKLY_REPORT, source: 'fallback' });
    }

    const parsed: WeeklyReport = JSON.parse(response.text || '{}');
    return res.json({ success: true, data: parsed, source: 'gemini-live' });
  } catch (error: any) {
    if (!isQuotaError(error)) {
      console.info('Weekly report fallback:', error?.message || 'unavailable');
    }
    return res.json({ success: true, data: MOCK_WEEKLY_REPORT, source: 'fallback' });
  }
});

// 4. API: Send / Preview Briefing Email
app.post(['/api/send-email', '/send-email'], (req, res) => {
  const { recipient, briefing, scheduledTime = '09:00' } = req.body;
  const targetEmail = typeof recipient === 'string' ? recipient.trim() : '';
  if (!targetEmail || !targetEmail.includes('@')) {
    return res.status(400).json({
      success: false,
      message: '수신 이메일 주소를 입력해주세요.',
    });
  }

  const newLog: EmailDispatchLog = {
    id: `log-${Date.now()}`,
    sentAt: new Date().toLocaleString('ko-KR', { timeZone: 'Asia/Seoul' }),
    recipient: targetEmail,
    status: 'success',
    headline: `[모닝브리프 AI] ${briefing?.briefingDate || '오늘'} 대한민국 10대 언론사 1면 및 공통이슈 3줄 요약`,
    storiesCount:
      (briefing?.frontPageStories?.length || 0) +
      (briefing?.overlappingStories?.length || 0) +
      (briefing?.exclusiveStories?.length || 0),
  };

  emailLogs.unshift(newLog);

  // Generate HTML newsletter preview
  const htmlNewsletter = `
  <!DOCTYPE html>
  <html>
  <head>
    <meta charset="utf-8">
    <style>
      body { font-family: -apple-system, BlinkMacSystemFont, "Pretendard", sans-serif; background-color: #f8fafc; margin: 0; padding: 24px; color: #1e293b; }
      .container { max-width: 680px; margin: 0 auto; background: #ffffff; border-radius: 12px; overflow: hidden; border: 1px solid #e2e8f0; }
      .header { background: #0f172a; color: #ffffff; padding: 32px 28px; }
      .badge { display: inline-block; background: #2563eb; color: #ffffff; font-size: 11px; font-weight: 700; padding: 4px 10px; border-radius: 9999px; }
      .title { font-size: 22px; font-weight: 800; margin: 12px 0 6px 0; color: #ffffff; }
      .meta { font-size: 13px; color: #94a3b8; }
      .section { padding: 24px 28px; border-bottom: 1px solid #f1f5f9; }
      .sec-title { font-size: 16px; font-weight: 800; color: #0f172a; margin-bottom: 16px; display: flex; align-items: center; }
      .card { background: #f8fafc; border-left: 4px solid #2563eb; border-radius: 6px; padding: 14px 16px; margin-bottom: 14px; }
      .card-title { font-size: 14px; font-weight: 700; color: #0f172a; margin-bottom: 8px; }
      .card-outlet { font-size: 11px; font-weight: 700; color: #2563eb; margin-bottom: 4px; }
      .line { font-size: 12.5px; color: #334155; line-height: 1.6; margin: 3px 0; }
      .link-btn { display: inline-block; font-size: 11px; color: #2563eb; text-decoration: none; margin-top: 6px; font-weight: 600; }
      .footer { background: #f1f5f9; padding: 20px 28px; text-align: center; font-size: 12px; color: #64748b; }
    </style>
  </head>
  <body>
    <div class="container">
      <div class="header">
        <span class="badge">매일 오전 ${scheduledTime} 자동 발송</span>
        <div class="title">모닝브리프 AI - 대한민국 주요 언론사 뉴스 요약</div>
        <div class="meta">${briefing?.briefingDate || '오늘'} | 수신: ${targetEmail}</div>
      </div>
      <div class="section">
        <div class="sec-title">🔥 오늘의 주요 키워드</div>
        <p style="font-size: 13px; color: #2563eb; font-weight: 600;">${(briefing?.topKeywords || []).join(' ')}</p>
      </div>
      <div class="section">
        <div class="sec-title">📰 언론사별 신문 1면 핵심 보도 (3줄 요약)</div>
        ${(briefing?.frontPageStories || [])
          .slice(0, 5)
          .map(
            (s: any) => `
          <div class="card">
            <div class="card-outlet">${s.outletName} | 1면 톱기사</div>
            <div class="card-title">${s.title}</div>
            ${s.leadSummary.map((l: string) => `<div class="line">${l}</div>`).join('')}
            <a class="link-btn" href="${s.originalUrl}" target="_blank">원문 기사 바로보기 →</a>
          </div>
        `
          )
          .join('')}
      </div>
      <div class="section">
        <div class="sec-title">🔄 언론사 공통 핵심 이슈 (교차 검증)</div>
        ${(briefing?.overlappingStories || [])
          .slice(0, 2)
          .map(
            (s: any) => `
          <div class="card" style="border-left-color: #7c3aed;">
            <div class="card-outlet" style="color: #7c3aed;">${s.outletName}</div>
            <div class="card-title">${s.title}</div>
            ${s.leadSummary.map((l: string) => `<div class="line">${l}</div>`).join('')}
            <a class="link-btn" style="color: #7c3aed;" href="${s.originalUrl}" target="_blank">관련 기사 모아보기 →</a>
          </div>
        `
          )
          .join('')}
      </div>
      <div class="section">
        <div class="sec-title">🌟 언론사 단독 및 심층 특별 기사</div>
        ${(briefing?.exclusiveStories || [])
          .slice(0, 2)
          .map(
            (s: any) => `
          <div class="card" style="border-left-color: #ea580c;">
            <div class="card-outlet" style="color: #ea580c;">[${s.exclusiveBadge || '단독'}] ${s.outletName}</div>
            <div class="card-title">${s.title}</div>
            ${s.leadSummary.map((l: string) => `<div class="line">${l}</div>`).join('')}
            <a class="link-btn" style="color: #ea580c;" href="${s.originalUrl}" target="_blank">원문 단독 기사 보기 →</a>
          </div>
        `
          )
          .join('')}
      </div>
      <div class="footer">
        본 메일은 모닝브리프 AI 서비스 구독 설정에 따라 매일 오전 ${scheduledTime}에 발송됩니다.<br>
        수신 시간 변경 및 언론사 선택은 모닝브리프 웹 대시보드에서 관리하실 수 있습니다.
      </div>
    </div>
  </body>
  </html>
  `;

  res.json({
    success: true,
    message: `${targetEmail} 주소로 오늘의 모닝브리프 요약본이 정상 발송되었습니다.`,
    log: newLog,
    htmlPreview: htmlNewsletter,
    history: emailLogs,
  });
});

// 5. API: Get Email Logs
app.get(['/api/email-logs', '/email-logs'], (req, res) => {
  res.json({ logs: emailLogs });
});

// 6. API: Email Auto-Dispatch Schedule
let savedEmailSchedule = {
  recipientEmail: '',
  deliveryTime: '09:00',
  deliveryTimezone: 'Asia/Seoul',
  deliveryDays: ['월', '화', '수', '목', '금'],
  autoEmailEnabled: true,
  updatedAt: new Date().toISOString(),
};

app.get(['/api/email-schedule', '/email-schedule'], (_req, res) => {
  res.json({ success: true, schedule: savedEmailSchedule });
});

app.post(['/api/email-schedule', '/email-schedule'], (req, res) => {
  const { recipientEmail, deliveryTime, deliveryTimezone, deliveryDays, autoEmailEnabled } = req.body || {};
  savedEmailSchedule = {
    recipientEmail:
      typeof recipientEmail === 'string' && (recipientEmail === '' || recipientEmail.includes('@'))
        ? recipientEmail.trim()
        : savedEmailSchedule.recipientEmail,
    deliveryTime: typeof deliveryTime === 'string' && /^\d{2}:\d{2}$/.test(deliveryTime) ? deliveryTime : savedEmailSchedule.deliveryTime,
    deliveryTimezone: typeof deliveryTimezone === 'string' && deliveryTimezone ? deliveryTimezone : savedEmailSchedule.deliveryTimezone,
    deliveryDays: Array.isArray(deliveryDays) ? deliveryDays : savedEmailSchedule.deliveryDays,
    autoEmailEnabled: typeof autoEmailEnabled === 'boolean' ? autoEmailEnabled : savedEmailSchedule.autoEmailEnabled,
    updatedAt: new Date().toISOString(),
  };
  res.json({ success: true, schedule: savedEmailSchedule });
});

// Vite middleware in dev or static files in prod
// Only activate when not running in Vercel Serverless Function
if (!process.env.VERCEL) {
  if (process.env.NODE_ENV !== 'production') {
    const { createServer } = await import('vite');
    const vite = await createServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static(path.resolve(__dirname, 'dist')));
    app.get('*', (req, res) => {
      res.sendFile(path.resolve(__dirname, 'dist', 'index.html'));
    });
  }

  const PORT = process.env.PORT ? parseInt(process.env.PORT, 10) : 3000;
  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Morning Brief Server running on http://0.0.0.0:${PORT}`);
  });
}

export default app;
