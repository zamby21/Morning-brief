import {
  DailyBriefing,
  EmailDispatchLog,
  WeeklyReport,
  BriefingTone,
  OperationalStatus,
  MailProviderStatus,
} from '../types/news';
import { transformBriefingTone } from '../utils/toneTransformer';
import { escapeHtml, sanitizeHttpUrl } from '../utils/htmlSanitizer';

export const LOCAL_EMAIL_LOGS_STORAGE_KEY = 'morning_brief_local_email_logs_v1';

function readLocalEmailLogs(): EmailDispatchLog[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(LOCAL_EMAIL_LOGS_STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed.slice(0, 30) : [];
  } catch {
    return [];
  }
}

function writeLocalEmailLogs(logs: EmailDispatchLog[]): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(LOCAL_EMAIL_LOGS_STORAGE_KEY, JSON.stringify(logs.slice(0, 30)));
  } catch {
    // Ignore storage quota restrictions
  }
}

/**
 * Helper to generate sanitized HTML email newsletter for offline/static fallback preview
 */
function generateClientHtmlNewsletter(
  targetEmail: string,
  briefing: DailyBriefing,
  scheduledTime: string
): string {
  const safeTime = escapeHtml(scheduledTime || '09:00');
  const safeDate = escapeHtml(briefing?.briefingDate || '오늘');
  const safeEmail = escapeHtml(targetEmail);
  const safeKeywords = (briefing?.topKeywords || [])
    .slice(0, 10)
    .map((k) => escapeHtml(k))
    .join(' ');

  const frontCards = (briefing?.frontPageStories || [])
    .slice(0, 5)
    .map((s) => {
      const safeHref = sanitizeHttpUrl(s.originalUrl);
      const linesHtml = (s.leadSummary || [])
        .slice(0, 4)
        .map((l) => `<div class="line">${escapeHtml(l)}</div>`)
        .join('');
      const linkHtml = safeHref
        ? `<a class="link-btn" href="${escapeHtml(safeHref)}" target="_blank" rel="noopener noreferrer">원문 기사 바로보기 →</a>`
        : '';
      return `
        <div class="card">
          <div class="card-outlet">${escapeHtml(s.outletName)} | 홈페이지 주요 톱</div>
          <div class="card-title">${escapeHtml(s.title)}</div>
          ${linesHtml}
          ${linkHtml}
        </div>
      `;
    })
    .join('');

  return `<!DOCTYPE html>
<html lang="ko">
<head>
  <meta charset="utf-8">
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, "Pretendard", sans-serif; background-color: #f8fafc; margin: 0; padding: 24px; color: #1e293b; }
    .container { max-width: 680px; margin: 0 auto; background: #ffffff; border-radius: 12px; overflow: hidden; border: 1px solid #e2e8f0; }
    .header { background: #0f172a; color: #ffffff; padding: 32px 28px; }
    .badge { display: inline-block; background: #2563eb; color: #ffffff; font-size: 11px; font-weight: 700; padding: 4px 10px; border-radius: 9999px; }
    .title { font-size: 22px; font-weight: 800; margin: 12px 0 6px 0; color: #ffffff; }
    .meta { font-size: 13px; color: #94a3b8; }
    .notice { background: #fffbeb; border-bottom: 1px solid #fde68a; color: #92400e; padding: 12px 28px; font-size: 12px; font-weight: 600; }
    .section { padding: 24px 28px; border-bottom: 1px solid #f1f5f9; }
    .sec-title { font-size: 16px; font-weight: 800; color: #0f172a; margin-bottom: 16px; }
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
      <span class="badge">뉴스레터 미리보기 · 희망 시각 ${safeTime}</span>
      <div class="title">모닝브리프 - 대한민국 주요 언론사 뉴스 요약</div>
      <div class="meta">${safeDate} | 수신 예정: ${safeEmail}</div>
    </div>
    <div class="notice">안내: 외부 이메일 발송 서버가 아직 연동되지 않은 미리보기 화면입니다.</div>
    <div class="section">
      <div class="sec-title">오늘의 핵심 키워드</div>
      <p style="font-size: 13px; color: #2563eb; font-weight: 600;">${safeKeywords}</p>
    </div>
    <div class="section">
      <div class="sec-title">언론사별 홈페이지 첫화면 주요 기사</div>
      ${frontCards}
    </div>
    <div class="footer">
      본 화면은 모닝브리프 뉴스레터 미리보기입니다. (희망 발송 시각: ${safeTime})<br>
      실제 이메일 발송은 네이버 메일 SMTP(NAVER_EMAIL, NAVER_APP_PASSWORD) 설정 후 활성화됩니다.
    </div>
  </div>
</body>
</html>`;
}

export interface FetchSummaryResponse {
  success?: boolean;
  degraded?: boolean;
  errorCode?: string;
  collectorStatus?: OperationalStatus;
  aiStatus?: OperationalStatus;
  aiErrorCode?: string;
  data: DailyBriefing;
  source: string;
}

/**
 * Fetch live daily briefing summary from server.
 * Topic filtering (`subscribedTopics` / `customTopics`) is intentionally handled client-side
 * so topic tag switching is instantaneous and avoids redundant server scrapes/cache fragmentation.
 */
export async function fetchSummary(
  outletIds: string[],
  tone: BriefingTone,
  forceRefresh = false
): Promise<FetchSummaryResponse> {
  const controller = typeof AbortController !== 'undefined' ? new AbortController() : undefined;
  const timeoutId = controller ? setTimeout(() => controller.abort(), 45_000) : undefined;
  try {
    const res = await fetch('/api/summarize', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      cache: 'no-store',
      signal: controller?.signal,
      body: JSON.stringify({ outletIds, tone, forceRefresh }),
    });
    const result = await res.json().catch(() => null);
    if (result && result.data) {
      return {
        success: typeof result.success === 'boolean' ? result.success : res.ok,
        degraded: Boolean(result.degraded),
        errorCode: result.errorCode,
        collectorStatus: result.collectorStatus || result.data.collectorStatus,
        aiStatus: result.aiStatus || result.data.aiStatus,
        aiErrorCode: result.aiErrorCode || result.data.aiErrorCode,
        data: result.data,
        source: result.source || (res.ok ? 'live' : 'fallback'),
      };
    }
  } catch (err) {
    console.warn('API /api/summarize unreachable or failed, using local sample fallback:', err);
  } finally {
    if (timeoutId) clearTimeout(timeoutId);
  }

  // Graceful client-side sample fallback (dynamically loaded only when live collection fails)
  const { INITIAL_DAILY_BRIEFING } = await import('../data/initialDailyBriefing');
  const fallback = transformBriefingTone(
    {
      ...INITIAL_DAILY_BRIEFING,
      sourceType: 'mock',
      sectorSourceType: 'mock',
      isFallback: true,
      degraded: true,
      errorCode: 'CLIENT_NETWORK_UNREACHABLE',
      collectorStatus: 'unavailable',
      aiStatus: 'unavailable',
    },
    tone
  );
  fallback.selectedOutletIds = outletIds && outletIds.length > 0 ? outletIds : fallback.selectedOutletIds;

  return {
    success: false,
    degraded: true,
    errorCode: 'CLIENT_NETWORK_UNREACHABLE',
    collectorStatus: 'unavailable',
    aiStatus: 'unavailable',
    data: fallback,
    source: 'client_sample_fallback',
  };
}

export async function rewriteTone(
  currentBriefing: DailyBriefing,
  targetTone: BriefingTone
): Promise<DailyBriefing> {
  try {
    const res = await fetch('/api/rewrite-tone', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        briefingId: currentBriefing?.id,
        currentBriefing,
        targetTone,
      }),
    });
    if (res.ok) {
      const data = await res.json();
      if (data && data.data) {
        return data.data;
      }
    }
  } catch (err) {
    console.warn('API /api/rewrite-tone unreachable, executing client-side tone transformation:', err);
  }

  return transformBriefingTone(currentBriefing, targetTone);
}

export async function fetchWeeklyReport(): Promise<WeeklyReport> {
  try {
    const res = await fetch('/api/weekly-report', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
    });
    if (res.ok) {
      const data = await res.json();
      if (data && data.data) {
        return data.data;
      }
    }
  } catch (err) {
    console.warn('API /api/weekly-report unreachable, using local sample report:', err);
  }

  const { MOCK_WEEKLY_REPORT } = await import('../data/mockNewsData');
  return { ...MOCK_WEEKLY_REPORT, sourceType: 'mock', isFallback: true };
}

export const DEFAULT_MAIL_PROVIDER_STATUS: MailProviderStatus = {
  configured: false,
  provider: 'none',
  providerLabel: '미연동',
  missingFields: ['NAVER_EMAIL', 'NAVER_APP_PASSWORD'],
};

export async function fetchMailProviderStatus(): Promise<MailProviderStatus> {
  try {
    const res = await fetch('/api/health', { cache: 'no-store' });
    if (res.ok) {
      const data = await res.json();
      const provider = data?.mailProvider === 'naver-smtp' ? 'naver-smtp' : 'none';
      return {
        configured: Boolean(data?.mailProviderConfigured),
        provider,
        providerLabel:
          typeof data?.mailProviderLabel === 'string'
            ? data.mailProviderLabel
            : provider === 'naver-smtp'
            ? '네이버 메일 SMTP'
            : '미연동',
        missingFields: Array.isArray(data?.mailProviderMissingFields)
          ? data.mailProviderMissingFields.filter((f: unknown): f is string => typeof f === 'string')
          : [],
      };
    }
  } catch {
    // Ignore unreachable health check
  }
  return DEFAULT_MAIL_PROVIDER_STATUS;
}

export async function sendEmailBriefing(
  recipient: string,
  briefing: DailyBriefing,
  scheduledTime: string
): Promise<{
  success: boolean;
  isPreviewOnly?: boolean;
  mailProviderConfigured?: boolean;
  provider?: 'naver-smtp' | 'none';
  providerLabel?: string;
  missingFields?: string[];
  messageId?: string;
  message: string;
  log?: EmailDispatchLog;
  htmlPreview: string;
  history: EmailDispatchLog[];
}> {
  const targetEmail = (recipient || '').trim();
  const existingLogs = readLocalEmailLogs();

  try {
    const res = await fetch('/api/send-email', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        recipient: targetEmail,
        briefingId: briefing?.id,
        briefing,
        scheduledTime,
      }),
    });
    const data = await res.json().catch(() => null);
    if (res.ok && data && data.success) {
      const nextHistory = data.log
        ? [data.log, ...existingLogs].slice(0, 30)
        : existingLogs;
      writeLocalEmailLogs(nextHistory);
      return {
        ...data,
        history: nextHistory,
      };
    }
    if (data) {
      const nextHistory = data.log
        ? [data.log, ...existingLogs].slice(0, 30)
        : existingLogs;
      if (data.log) writeLocalEmailLogs(nextHistory);
      return {
        success: false,
        isPreviewOnly: Boolean(data.isPreviewOnly),
        mailProviderConfigured: Boolean(data.mailProviderConfigured),
        provider: data.provider,
        providerLabel: data.providerLabel,
        missingFields: Array.isArray(data.missingFields) ? data.missingFields : undefined,
        message: data.message || '이메일 발송 처리에 실패했습니다.',
        log: data.log,
        htmlPreview: '',
        history: nextHistory,
      };
    }
  } catch (err) {
    console.warn('API /api/send-email unreachable, generating local HTML preview:', err);
  }

  // Client-side preview generation (honestly marked as preview-only, never fake sent)
  const previewLog: EmailDispatchLog = {
    id: `preview-${Date.now()}`,
    sentAt: new Date().toLocaleString('ko-KR', { timeZone: 'Asia/Seoul' }),
    recipient: targetEmail,
    status: 'preview',
    isPreviewOnly: true,
    headline: `[미리보기] ${briefing?.briefingDate || '오늘'} 모닝브리프 뉴스레터`,
    storiesCount:
      (briefing?.frontPageStories?.length || 0) +
      (briefing?.overlappingStories?.length || 0) +
      (briefing?.exclusiveStories?.length || 0),
    provider: 'none',
  };

  const nextHistory = [previewLog, ...existingLogs].slice(0, 30);
  writeLocalEmailLogs(nextHistory);

  return {
    success: true,
    isPreviewOnly: true,
    mailProviderConfigured: false,
    provider: 'none',
    providerLabel: '미연동',
    missingFields: ['NAVER_EMAIL', 'NAVER_APP_PASSWORD'],
    message: `${targetEmail} 대상 뉴스레터 미리보기가 생성되었습니다. (네이버 메일 SMTP 미연동으로 실제 이메일은 전송되지 않습니다.)`,
    log: previewLog,
    htmlPreview: generateClientHtmlNewsletter(targetEmail, briefing, scheduledTime),
    history: nextHistory,
  };
}

export function loadEmailLogsFromStorage(): EmailDispatchLog[] {
  return readLocalEmailLogs();
}

export async function saveEmailSchedule(_schedule: {
  recipientEmail: string;
  deliveryTime: string;
  deliveryTimezone: string;
  deliveryDays: string[];
  autoEmailEnabled: boolean;
}): Promise<boolean> {
  // Email schedules are stored strictly per-browser in localStorage to avoid sharing PII globally
  return true;
}
