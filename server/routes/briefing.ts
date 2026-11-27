import type express from 'express';
import { PRESS_OUTLETS } from '../../src/data/pressMetadata.ts';
import type { WeeklyReport, BriefingTone, OperationalStatus } from '../../src/types/news.ts';
import { transformBriefingTone } from '../../src/utils/toneTransformer.ts';
import { getCollectorHealthSnapshot } from '../../src/services/realNewsCollector.ts';
import {
  createRateLimiter,
  dailyBriefingHistory,
  ensureDailyHistoryLoaded,
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
  getGeminiHealthSnapshot,
  rewriteBriefingWithGemini,
} from '../services/gemini.ts';
import { getMailProviderStatus } from './email.ts';

const FORCE_REFRESH_COOLDOWN_MS = 10_000;
let lastForcedRefreshAt = 0;

function parseRequestedOutlets(outletIds: unknown): {
  error?: string;
  targetOutletIds: string[];
} {
  let requestedOutletIds: string[] = [];
  if (outletIds !== undefined) {
    if (!Array.isArray(outletIds)) {
      return { error: '언론사 목록 형식이 올바르지 않습니다.', targetOutletIds: [] };
    }
    if (outletIds.length > MAX_OUTLETS_PER_REQUEST) {
      return {
        error: `한 번에 최대 ${MAX_OUTLETS_PER_REQUEST}개 언론사까지 요청할 수 있습니다.`,
        targetOutletIds: [],
      };
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
  return { targetOutletIds: selectedOutlets.map((o) => o.id) };
}

export function registerBriefingRoutes(app: express.Express): void {
  // Health check endpoint with separated collector, Gemini, and mail provider statuses
  app.get(['/api/health', '/health'], createRateLimiter('health', 60), async (_req, res) => {
    await ensureDailyHistoryLoaded();
    const mailStatus = getMailProviderStatus();
    const collectorHealth = getCollectorHealthSnapshot();
    const geminiHealth = getGeminiHealthSnapshot();

    const overallStatus: OperationalStatus =
      collectorHealth.status === 'unavailable'
        ? 'unavailable'
        : collectorHealth.status === 'degraded' || geminiHealth.status !== 'ok'
        ? 'degraded'
        : 'ok';

    res.json({
      status: overallStatus,
      service: 'Morning Brief API',
      geminiConfigured: geminiHealth.configured,
      collector: {
        status: collectorHealth.status,
        trackedOutlets: collectorHealth.trackedOutlets,
        healthyOutlets: collectorHealth.healthyOutlets,
        degradedOutletCount: collectorHealth.degradedOutlets.length,
        lastSuccessAt: collectorHealth.lastSuccessAt,
      },
      gemini: {
        status: geminiHealth.status,
        configured: geminiHealth.configured,
        errorCode: geminiHealth.errorCode,
        lastSuccessAt: geminiHealth.lastSuccessAt,
      },
      mailProviderConfigured: mailStatus.configured,
      mailProvider: mailStatus.provider,
      mailProviderLabel: mailStatus.providerLabel,
      mailProviderMissingFields: mailStatus.missingFields,
      storedDaysCount: dailyBriefingHistory.size,
      collectorHealth,
      timestamp: new Date().toISOString(),
    });
  });

  // 1. Generate / Refresh daily briefing (topic filtering is applied client-side)
  app.post(['/api/summarize', '/summarize'], createRateLimiter('summarize', 20), async (req, res) => {
    try {
      const body = req.body && typeof req.body === 'object' ? req.body : {};
      const { outletIds, tone = 'insight', forceRefresh = false } = body;

      if (typeof tone !== 'string' || !VALID_TONES.has(tone as BriefingTone)) {
        return res.status(400).json({ success: false, errorCode: 'INVALID_TONE', error: '지원하지 않는 요약 어조입니다.' });
      }

      const parsedOutlets = parseRequestedOutlets(outletIds);
      if (parsedOutlets.error) {
        return res.status(400).json({ success: false, errorCode: 'INVALID_OUTLETS', error: parsedOutlets.error });
      }

      const nowMs = Date.now();
      const allowForce =
        Boolean(forceRefresh) &&
        (isAdminRefreshAuthorized(req) || nowMs - lastForcedRefreshAt >= FORCE_REFRESH_COOLDOWN_MS);
      if (allowForce) {
        lastForcedRefreshAt = nowMs;
      }

      const payload = await generateLiveSummaryPayload(
        parsedOutlets.targetOutletIds,
        tone as BriefingTone,
        allowForce
      );
      return res.status(payload.success ? 200 : 503).json(payload);
    } catch (error: any) {
      const traceId = makeTraceId();
      console.error(`[summarize:${traceId}] Error generating summary:`, error);
      const safeTone: BriefingTone =
        typeof req.body?.tone === 'string' && VALID_TONES.has(req.body.tone as BriefingTone)
          ? (req.body.tone as BriefingTone)
          : 'insight';
      const geminiHealth = getGeminiHealthSnapshot();
      const { INITIAL_DAILY_BRIEFING } = await import('../../src/data/initialDailyBriefing.ts');
      const fallback = transformBriefingTone(
        {
          ...INITIAL_DAILY_BRIEFING,
          sourceType: 'mock',
          sectorSourceType: 'mock',
          isFallback: true,
          degraded: true,
          errorCode: 'SUMMARIZE_INTERNAL_ERROR',
          collectorStatus: 'unavailable',
          aiStatus: geminiHealth.status,
          aiErrorCode: geminiHealth.errorCode || undefined,
        },
        safeTone
      );
      return res.status(503).json({
        success: false,
        degraded: true,
        errorCode: 'SUMMARIZE_INTERNAL_ERROR',
        collectorStatus: 'unavailable',
        aiStatus: geminiHealth.status,
        aiErrorCode: geminiHealth.errorCode || undefined,
        data: fallback,
        source: 'fallback',
        traceId,
      });
    }
  });

  // Privileged force-refresh endpoint requiring explicit ADMIN_REFRESH_TOKEN
  app.post(['/api/admin/refresh', '/admin/refresh'], createRateLimiter('admin-refresh', 10), async (req, res) => {
    if (!isAdminRefreshAuthorized(req)) {
      return res.status(401).json({
        success: false,
        errorCode: 'ADMIN_TOKEN_REQUIRED',
        error: '유효한 관리자 인증 토큰(X-Admin-Token)이 필요합니다.',
      });
    }

    const nowMs = Date.now();
    if (nowMs - lastForcedRefreshAt < FORCE_REFRESH_COOLDOWN_MS) {
      return res.status(429).json({
        success: false,
        errorCode: 'REFRESH_COOLDOWN',
        error: '강제 새로고침 쿨다운 중입니다. 잠시 후 다시 시도하세요.',
      });
    }

    const body = req.body && typeof req.body === 'object' ? req.body : {};
    const { outletIds, tone = 'insight' } = body;
    if (typeof tone !== 'string' || !VALID_TONES.has(tone as BriefingTone)) {
      return res.status(400).json({ success: false, errorCode: 'INVALID_TONE', error: '지원하지 않는 요약 어조입니다.' });
    }
    const parsedOutlets = parseRequestedOutlets(outletIds);
    if (parsedOutlets.error) {
      return res.status(400).json({ success: false, errorCode: 'INVALID_OUTLETS', error: parsedOutlets.error });
    }

    lastForcedRefreshAt = nowMs;
    const payload = await generateLiveSummaryPayload(
      parsedOutlets.targetOutletIds,
      tone as BriefingTone,
      true
    );
    return res.status(payload.success ? 200 : 503).json(payload);
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
    await ensureDailyHistoryLoaded();
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
