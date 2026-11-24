import { DailyBriefing, EmailDispatchLog, WeeklyReport, BriefingTone } from '../types/news';
import { INITIAL_DAILY_BRIEFING, MOCK_WEEKLY_REPORT } from '../data/mockNewsData';
import { transformBriefingTone } from '../utils/toneTransformer';
import { escapeHtml, sanitizeHttpUrl } from '../utils/htmlSanitizer';

// In-memory preview logs for offline/static client sessions (external mail provider not connected)
const clientEmailLogs: EmailDispatchLog[] = [];

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
          <div class="card-outlet">${escapeHtml(s.outletName)} | 1면 톱기사</div>
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
      <div class="sec-title">언론사별 신문 1면 핵심 보도</div>
      ${frontCards}
    </div>
    <div class="footer">
      본 화면은 모닝브리프 뉴스레터 미리보기입니다. (희망 발송 시각: ${safeTime})<br>
      실제 자동 이메일 발송은 외부 메일 발송 서비스(SMTP/API) 연동 후 활성화됩니다.
    </div>
  </div>
</body>
</html>`;
}

export async function fetchSummary(
  outletIds: string[],
  tone: BriefingTone,
  topics: string[],
  forceRefresh = false
): Promise<{ data: DailyBriefing; source: string }> {
  try {
    const res = await fetch('/api/summarize', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ outletIds, tone, topics, forceRefresh }),
    });
    if (res.ok) {
      const result = await res.json();
      if (result && result.data) {
        return result;
      }
    }
  } catch (err) {
    console.warn('API /api/summarize unreachable or failed, using local sample fallback:', err);
  }

  // Graceful client-side sample fallback (explicitly marked as mock + isFallback, no forged dates or synthetic stories)
  const fallback = transformBriefingTone(
    { ...INITIAL_DAILY_BRIEFING, sourceType: 'mock', sectorSourceType: 'mock', isFallback: true },
    tone
  );
  fallback.selectedOutletIds = outletIds && outletIds.length > 0 ? outletIds : fallback.selectedOutletIds;

  return {
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

  return { ...MOCK_WEEKLY_REPORT, sourceType: 'mock', isFallback: true };
}

export async function sendEmailBriefing(
  recipient: string,
  briefing: DailyBriefing,
  scheduledTime: string
): Promise<{
  success: boolean;
  isPreviewOnly?: boolean;
  message: string;
  log: EmailDispatchLog;
  htmlPreview: string;
  history: EmailDispatchLog[];
}> {
  const targetEmail = (recipient || '').trim();

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
    if (res.ok) {
      const data = await res.json();
      if (data && data.success) {
        return data;
      }
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
  };

  clientEmailLogs.unshift(previewLog);

  return {
    success: true,
    isPreviewOnly: true,
    message: `${targetEmail} 대상 뉴스레터 미리보기가 생성되었습니다. (외부 메일 서버 미연동으로 실제 이메일은 전송되지 않습니다.)`,
    log: previewLog,
    htmlPreview: generateClientHtmlNewsletter(targetEmail, briefing, scheduledTime),
    history: clientEmailLogs,
  };
}

export async function fetchEmailLogs(): Promise<EmailDispatchLog[]> {
  try {
    const res = await fetch('/api/email-logs');
    if (res.ok) {
      const data = await res.json();
      if (data && data.logs) {
        return data.logs;
      }
    }
  } catch (err) {
    console.warn('API /api/email-logs unreachable, returning local preview logs:', err);
  }
  return clientEmailLogs;
}

export async function saveEmailSchedule(schedule: {
  recipientEmail: string;
  deliveryTime: string;
  deliveryTimezone: string;
  deliveryDays: string[];
  autoEmailEnabled: boolean;
}): Promise<boolean> {
  try {
    const res = await fetch('/api/email-schedule', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(schedule),
    });
    return res.ok;
  } catch {
    return false;
  }
}
