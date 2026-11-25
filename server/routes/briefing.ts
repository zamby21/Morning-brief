import type express from 'express';
import { PRESS_OUTLETS } from '../../src/data/pressMetadata.ts';
import type { WeeklyReport, BriefingTone } from '../../src/types/news.ts';
import { transformBriefingTone } from '../../src/utils/toneTransformer.ts';
import { getCollectorHealthSnapshot } from '../../src/services/realNewsCollector.ts';
import {
  createRateLimiter,
  dailyBriefingHistory,
  isAdminRefreshAuthorized,
  makeTraceId,
  MAX_OUTLETS_PER_REQUEST,
  serverBriefingStore,
  VALID_OUTLET_IDS,
  VALID_TONES,
} from '../utils/security.ts';
import {
  generateLiveSummaryPayload,
  generateWeeklyReportWithGemini,
  isGeminiConfigured,
  rewriteBriefingWithGemini,
} from '../services/gemini.ts';
import { isResendConfigured } from './email.ts';

const FORCE_REFRESH_COOLDOWN_MS = 10_000;
let lastForcedRefreshAt = 0;

export function registerBriefingRoutes(app: express.Express): void {
  // Health check endpoint for Vercel and uptime monitoring
  app.get(['/api/health', '/health'], createRateLimiter('health', 60), (_req, res) => {
    const mailConfigured = isResendConfigured();
    res.json({
      status: 'ok',
      service: 'Morning Brief API',
      geminiConfigured: isGeminiConfigured(),
      mailProviderConfigured: mailConfigured,
      mailProvider: mailConfigured ? 'resend' : 'none',
      storedDaysCount: dailyBriefingHistory.size,
      collectorHealth: getCollectorHealthSnapshot(),
      timestamp: new Date().toISOString(),
    });
  });

  // 1. Generate / Refresh daily briefing (topic filtering is applied client-side)
  app.post(['/api/summarize', '/summarize'], createRateLimiter('summarize', 20), async (req, res) => {
    try {
      const body = req.body && typeof req.body === 'object' ? req.body : {};
      const { outletIds, tone = 'insight', forceRefresh = false } = body;

      if (typeof tone !== 'string' || !VALID_TONES.has(tone as BriefingTone)) {
        return res.status(400).json({ success: false, error: '지원하지 않는 요약 어조입니다.' });
      }

      let requestedOutletIds: string[] = [];
      if (outletIds !== undefined) {
        if (!Array.isArray(outletIds)) {
          return res.status(400).json({ success: false, error: '언론사 목록 형식이 올바르지 않습니다.' });
        }
        if (outletIds.length > MAX_OUTLETS_PER_REQUEST) {
          return res.status(400).json({
            success: false,
            error: `한 번에 최대 ${MAX_OUTLETS_PER_REQUEST}개 언론사까지 요청할 수 있습니다.`,
          });
        }
        requestedOutletIds = Array.from(
          new Set(
            outletIds.filter((id): id is string => typeof id === 'string' && VALID_OUTLET_IDS.has(id))
          )
        );
      }

      const selectedOutlets = PRESS_OUTLETS.filter((o) =>
        requestedOutletIds.length > 0 ? requestedOutletIds.includes(o.id) : o.isDefaultMajor
      );
      const targetOutletIds = selectedOutlets.map((o) => o.id);

      const nowMs = Date.now();
      const allowForce =
        Boolean(forceRefresh) &&
        isAdminRefreshAuthorized(req) &&
        nowMs - lastForcedRefreshAt >= FORCE_REFRESH_COOLDOWN_MS;
      if (allowForce) {
        lastForcedRefreshAt = nowMs;
      }

      const payload = await generateLiveSummaryPayload(
        targetOutletIds,
        tone as BriefingTone,
        allowForce
      );
      return res.json(payload);
    } catch (error: any) {
      const traceId = makeTraceId();
      console.error(`[summarize:${traceId}] Error generating summary:`, error);
      const safeTone: BriefingTone =
        typeof req.body?.tone === 'string' && VALID_TONES.has(req.body.tone as BriefingTone)
          ? (req.body.tone as BriefingTone)
          : 'insight';
      const { INITIAL_DAILY_BRIEFING } = await import('../../src/data/initialDailyBriefing.ts');
      const fallback = transformBriefingTone(
        { ...INITIAL_DAILY_BRIEFING, sourceType: 'mock', sectorSourceType: 'mock', isFallback: true },
        safeTone
      );
      return res.json({
        success: true,
        data: fallback,
        source: 'fallback',
        traceId,
      });
    }
  });

  // 2. Rewrite briefing tone via Gemini (prefers server-cached briefing by briefingId)
  app.post(['/api/rewrite-tone', '/rewrite-tone'], createRateLimiter('rewrite-tone', 20), async (req, res) => {
    const { briefingId, currentBriefing, targetTone } = req.body || {};
    const trustedFromStore =
      typeof briefingId === 'string' && serverBriefingStore.has(briefingId)
        ? serverBriefingStore.get(briefingId)
        : undefined;
    const sourceBriefing = trustedFromStore || currentBriefing;

    if (
      !sourceBriefing ||
      typeof sourceBriefing !== 'object' ||
      typeof targetTone !== 'string' ||
      !VALID_TONES.has(targetTone as BriefingTone)
    ) {
      return res.status(400).json({ success: false, error: '브리핑 데이터 또는 어조 값이 올바르지 않습니다.' });
    }

    const result = await rewriteBriefingWithGemini(sourceBriefing, targetTone as BriefingTone);
    return res.json({ success: true, data: result.data, source: result.source });
  });

  // 3. Weekly Report Generator (strictly grounded in accumulated daily history; lazy mock fallback)
  app.post(['/api/weekly-report', '/weekly-report'], createRateLimiter('weekly-report', 15), async (_req, res) => {
    const { MOCK_WEEKLY_REPORT } = await import('../../src/data/mockNewsData.ts');
    const sampleReport: WeeklyReport = {
      ...MOCK_WEEKLY_REPORT,
      sourceType: 'mock',
      isFallback: true,
    };

    const result = await generateWeeklyReportWithGemini(sampleReport);
    return res.json({
      success: true,
      data: result.data,
      source: result.source,
      storedDaysCount: result.storedDaysCount,
    });
  });
}
