import { DailyBriefing, EmailDispatchLog, WeeklyReport, BriefingTone } from '../types/news';

export async function fetchSummary(
  outletIds: string[],
  tone: BriefingTone,
  topics: string[]
): Promise<{ data: DailyBriefing; source: string }> {
  try {
    const res = await fetch('/api/summarize', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ outletIds, tone, topics }),
    });
    if (!res.ok) throw new Error('Failed to fetch summary');
    return await res.json();
  } catch (err) {
    console.warn('API error, using local fallback:', err);
    throw err;
  }
}

export async function rewriteTone(
  currentBriefing: DailyBriefing,
  targetTone: BriefingTone
): Promise<DailyBriefing> {
  const res = await fetch('/api/rewrite-tone', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ currentBriefing, targetTone }),
  });
  if (!res.ok) throw new Error('Failed to rewrite tone');
  const data = await res.json();
  return data.data;
}

export async function fetchWeeklyReport(): Promise<WeeklyReport> {
  const res = await fetch('/api/weekly-report', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
  });
  if (!res.ok) throw new Error('Failed to fetch weekly report');
  const data = await res.json();
  return data.data;
}

export async function sendEmailBriefing(
  recipient: string,
  briefing: DailyBriefing,
  scheduledTime: string
): Promise<{ success: boolean; message: string; log: EmailDispatchLog; htmlPreview: string; history: EmailDispatchLog[] }> {
  const res = await fetch('/api/send-email', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ recipient, briefing, scheduledTime }),
  });
  if (!res.ok) throw new Error('Failed to send email briefing');
  return await res.json();
}

export async function fetchEmailLogs(): Promise<EmailDispatchLog[]> {
  const res = await fetch('/api/email-logs');
  if (!res.ok) throw new Error('Failed to fetch email logs');
  const data = await res.json();
  return data.logs;
}
