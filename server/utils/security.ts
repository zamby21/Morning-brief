import crypto from 'node:crypto';
import type express from 'express';
import { PRESS_OUTLETS } from '../../src/data/pressMetadata.ts';
import type { DailyBriefing, BriefingTone } from '../../src/types/news.ts';
import { readPersistentJson, writePersistentJson } from './persistentStore.ts';

// Lightweight per-IP sliding-window rate limiter to protect AI & proxy endpoints
const rateLimitBuckets = new Map<string, { count: number; resetAt: number }>();

export function getClientIp(req: express.Request): string {
  const xff = req.headers['x-forwarded-for'];
  if (typeof xff === 'string' && xff.trim()) {
    return xff.split(',')[0].trim();
  }
  return req.socket?.remoteAddress || 'unknown';
}

export function createRateLimiter(bucketName: string, maxRequests: number, windowMs = 60_000) {
  return (req: express.Request, res: express.Response, next: express.NextFunction) => {
    const now = Date.now();
    const key = `${bucketName}:${getClientIp(req)}`;
    const existing = rateLimitBuckets.get(key);

    if (rateLimitBuckets.size > 5000) {
      for (const [k, v] of rateLimitBuckets.entries()) {
        if (now >= v.resetAt) rateLimitBuckets.delete(k);
      }
    }

    if (!existing || now >= existing.resetAt) {
      rateLimitBuckets.set(key, { count: 1, resetAt: now + windowMs });
      return next();
    }

    if (existing.count >= maxRequests) {
      const retryAfterSec = Math.max(1, Math.ceil((existing.resetAt - now) / 1000));
      res.setHeader('Retry-After', String(retryAfterSec));
      return res.status(429).json({
        success: false,
        error: '요청이 너무 많습니다. 잠시 후 다시 시도해주세요.',
      });
    }

    existing.count += 1;
    return next();
  };
}

export const VALID_TONES = new Set<BriefingTone>(['formal', 'bullet', 'friendly', 'insight']);
export const VALID_OUTLET_IDS = new Set<string>(PRESS_OUTLETS.map((o) => o.id));
export const VALID_DAYS = new Set<string>(['월', '화', '수', '목', '금', '토', '일']);
export const MAX_OUTLETS_PER_REQUEST = PRESS_OUTLETS.length;

// Server-side trusted briefing cache (by briefing.id) & rolling KST daily history (up to 14 days)
export const serverBriefingStore = new Map<string, DailyBriefing>();
const MAX_STORED_BRIEFINGS = 20;

export interface DailyHistoryEntry {
  kstDate: string;
  dateLabel: string;
  topKeywords: string[];
  headlines: Array<{ outletName: string; title: string; topic?: string }>;
  updatedAt: string;
}

export const dailyBriefingHistory = new Map<string, DailyHistoryEntry>();
const MAX_DAILY_HISTORY_DAYS = 14;
const PERSISTENT_HISTORY_KEY = 'morning_brief:daily_history:v1';
let historyLoadedPromise: Promise<void> | null = null;

export async function ensureDailyHistoryLoaded(): Promise<void> {
  if (!historyLoadedPromise) {
    historyLoadedPromise = (async () => {
      const stored = await readPersistentJson<DailyHistoryEntry[]>(PERSISTENT_HISTORY_KEY);
      if (Array.isArray(stored)) {
        for (const entry of stored) {
          if (entry && typeof entry.kstDate === 'string' && !dailyBriefingHistory.has(entry.kstDate)) {
            dailyBriefingHistory.set(entry.kstDate, entry);
          }
        }
      }
    })();
  }
  return historyLoadedPromise;
}

export function getKstDateKey(date: Date = new Date()): string {
  return date.toLocaleDateString('en-CA', { timeZone: 'Asia/Seoul' });
}

export function saveServerBriefing(briefing: DailyBriefing): void {
  if (!briefing?.id) return;
  if (serverBriefingStore.has(briefing.id)) {
    serverBriefingStore.delete(briefing.id);
  }
  serverBriefingStore.set(briefing.id, briefing);
  while (serverBriefingStore.size > MAX_STORED_BRIEFINGS) {
    const oldestKey = serverBriefingStore.keys().next().value;
    if (!oldestKey) break;
    serverBriefingStore.delete(oldestKey);
  }

  // Record live daily snapshots for grounded weekly report synthesis
  if (briefing.sourceType === 'live' && briefing.frontPageStories.length > 0) {
    const kstDate = getKstDateKey();
    dailyBriefingHistory.set(kstDate, {
      kstDate,
      dateLabel: briefing.briefingDate,
      topKeywords: (briefing.topKeywords || []).slice(0, 8),
      headlines: briefing.frontPageStories.slice(0, 12).map((s) => ({
        outletName: s.outletName,
        title: s.title,
        topic: s.topic,
      })),
      updatedAt: new Date().toISOString(),
    });
    while (dailyBriefingHistory.size > MAX_DAILY_HISTORY_DAYS) {
      const oldestDate = dailyBriefingHistory.keys().next().value;
      if (!oldestDate) break;
      dailyBriefingHistory.delete(oldestDate);
    }
    void writePersistentJson(
      PERSISTENT_HISTORY_KEY,
      Array.from(dailyBriefingHistory.values())
    );
  }
}

export function isAdminRefreshAuthorized(req: express.Request): boolean {
  const configuredToken = (process.env.ADMIN_REFRESH_TOKEN || '').trim();
  // Require an explicitly configured non-empty server token before allowing privileged refresh
  if (!configuredToken) return false;
  const provided =
    typeof req.headers['x-admin-token'] === 'string' ? req.headers['x-admin-token'].trim() : '';
  if (!provided) return false;
  const a = Buffer.from(configuredToken, 'utf8');
  const b = Buffer.from(provided, 'utf8');
  if (a.length !== b.length) return false;
  return crypto.timingSafeEqual(a, b);
}

export function maskEmailAddress(email: string): string {
  const parts = (email || '').split('@');
  if (parts.length !== 2) return '***';
  const [local, domain] = parts;
  const visible = local.length <= 2 ? local[0] || '*' : local.slice(0, 2);
  return `${visible}***@${domain}`;
}

export function isValidHHMM(value: unknown): value is string {
  return typeof value === 'string' && /^([01]\d|2[0-3]):([0-5]\d)$/.test(value);
}

export function isValidIanaTimeZone(value: unknown): value is string {
  if (typeof value !== 'string' || value.length < 3 || value.length > 64) return false;
  try {
    Intl.DateTimeFormat(undefined, { timeZone: value });
    return true;
  } catch {
    return false;
  }
}

export function makeTraceId(): string {
  return crypto.randomBytes(4).toString('hex');
}
