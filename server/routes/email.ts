import type express from 'express';
import type { EmailDispatchLog } from '../../src/types/news.ts';
import { escapeHtml, sanitizeHttpUrl, isValidEmailAddress } from '../../src/utils/htmlSanitizer.ts';
import {
  createRateLimiter,
  serverBriefingStore,
  VALID_DAYS,
  isValidHHMM,
  isValidIanaTimeZone,
} from '../utils/security.ts';

const emailLogs: EmailDispatchLog[] = [];

export function isResendConfigured(): boolean {
  return Boolean(process.env.RESEND_API_KEY && process.env.RESEND_API_KEY.trim().length > 0);
}

let savedEmailSchedule = {
  recipientEmail: '',
  deliveryTime: '09:00',
  deliveryTimezone: 'Asia/Seoul',
  deliveryDays: ['월', '화', '수', '목', '금'],
  autoEmailEnabled: false,
  isPreviewOnly: true,
  updatedAt: new Date().toISOString(),
};

export function registerEmailRoutes(app: express.Express): void {
  // Dispatch via Resend API when configured or generate sanitized HTML preview
  app.post(['/api/send-email', '/send-email'], createRateLimiter('send-email', 20), async (req, res) => {
    const { recipient, briefingId, briefing: clientBriefing, scheduledTime = '09:00' } = req.body || {};
    const targetEmail = typeof recipient === 'string' ? recipient.trim() : '';
    if (!isValidEmailAddress(targetEmail)) {
      return res.status(400).json({
        success: false,
        message: '올바른 수신 이메일 주소를 입력해주세요.',
      });
    }

    const briefing =
      (typeof briefingId === 'string' && serverBriefingStore.has(briefingId)
        ? serverBriefingStore.get(briefingId)
        : undefined) || clientBriefing;

    const safeScheduledTime = isValidHHMM(scheduledTime) ? scheduledTime : '09:00';
    const safeBriefingDate =
      typeof briefing?.briefingDate === 'string' && briefing.briefingDate.trim()
        ? briefing.briefingDate.trim().slice(0, 60)
        : '오늘';

    const frontStories = Array.isArray(briefing?.frontPageStories) ? briefing.frontPageStories.slice(0, 5) : [];
    const overlapStories = Array.isArray(briefing?.overlappingStories) ? briefing.overlappingStories.slice(0, 2) : [];
    const exclStories = Array.isArray(briefing?.exclusiveStories) ? briefing.exclusiveStories.slice(0, 2) : [];
    const topKeywords = Array.isArray(briefing?.topKeywords)
      ? briefing.topKeywords.slice(0, 10).map((k: unknown) => escapeHtml(String(k || '').slice(0, 40)))
      : [];

    const renderCardHtml = (
      story: any,
      accentColor: string,
      outletPrefix: string,
      ctaLabel: string
    ): string => {
      const safeOutlet = escapeHtml(outletPrefix);
      const safeTitle = escapeHtml(String(story?.title || '').slice(0, 200));
      const lines = Array.isArray(story?.leadSummary) ? story.leadSummary.slice(0, 4) : [];
      const linesHtml = lines
        .map((l: unknown) => `<div class="line">${escapeHtml(String(l || '').slice(0, 300))}</div>`)
        .join('');
      const safeHref = sanitizeHttpUrl(story?.originalUrl);
      const linkHtml = safeHref
        ? `<a class="link-btn" style="color: ${accentColor};" href="${escapeHtml(safeHref)}" target="_blank" rel="noopener noreferrer">${escapeHtml(ctaLabel)}</a>`
        : '';
      return `
      <div class="card" style="border-left-color: ${accentColor};">
        <div class="card-outlet" style="color: ${accentColor};">${safeOutlet}</div>
        <div class="card-title">${safeTitle}</div>
        ${linesHtml}
        ${linkHtml}
      </div>
    `;
    };

    const resendApiKey = (process.env.RESEND_API_KEY || '').trim();
    const mailProviderConfigured = resendApiKey.length > 0;
    const fromEmail = (process.env.RESEND_FROM_EMAIL || '').trim() || 'Morning Brief <onboarding@resend.dev>';
    const emailSubject = `[모닝브리프] ${safeBriefingDate} 대한민국 주요 언론사 뉴스 요약`;
    const totalStoriesCount = frontStories.length + overlapStories.length + exclStories.length;

    const htmlNewsletter = `<!DOCTYPE html>
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
      <span class="badge">${
        mailProviderConfigured
          ? `데일리 브리핑 · 희망 시각 ${escapeHtml(safeScheduledTime)}`
          : `뉴스레터 미리보기 · 희망 시각 ${escapeHtml(safeScheduledTime)}`
      }</span>
      <div class="title">모닝브리프 - 대한민국 주요 언론사 뉴스 요약</div>
      <div class="meta">${escapeHtml(safeBriefingDate)} | 수신: ${escapeHtml(targetEmail)}</div>
    </div>
    ${
      mailProviderConfigured
        ? ''
        : '<div class="notice">안내: 외부 이메일 발송 서버가 아직 연동되지 않은 미리보기 화면입니다.</div>'
    }
    <div class="section">
      <div class="sec-title">오늘의 핵심 키워드</div>
      <p style="font-size: 13px; color: #2563eb; font-weight: 600;">${topKeywords.join(' ')}</p>
    </div>
    <div class="section">
      <div class="sec-title">언론사별 신문 1면 핵심 보도</div>
      ${frontStories
        .map((s: any) =>
          renderCardHtml(s, '#2563eb', `${String(s?.outletName || '언론사')} | 1면 톱기사`, '원문 기사 바로보기 →')
        )
        .join('')}
    </div>
    ${
      overlapStories.length > 0
        ? `<div class="section">
      <div class="sec-title">언론사 공통 핵심 이슈</div>
      ${overlapStories
        .map((s: any) => renderCardHtml(s, '#7c3aed', String(s?.outletName || '공통 보도'), '관련 기사 보기 →'))
        .join('')}
    </div>`
        : ''
    }
    ${
      exclStories.length > 0
        ? `<div class="section">
      <div class="sec-title">언론사 단독 보도</div>
      ${exclStories
        .map((s: any) =>
          renderCardHtml(
            s,
            '#ea580c',
            `[${String(s?.exclusiveBadge || '단독')}] ${String(s?.outletName || '')}`,
            '원문 단독 기사 보기 →'
          )
        )
        .join('')}
    </div>`
        : ''
    }
    <div class="footer">
      ${
        mailProviderConfigured
          ? `본 메일은 모닝브리프에서 발송된 데일리 뉴스 브리핑입니다. (희망 발송 시각: ${escapeHtml(safeScheduledTime)})`
          : `본 화면은 모닝브리프 뉴스레터 미리보기입니다. (희망 발송 시각: ${escapeHtml(safeScheduledTime)})<br>실제 자동 이메일 발송은 외부 메일 발송 서비스(Resend 등) 연동 후 활성화됩니다.`
      }
    </div>
  </div>
</body>
</html>`;

    if (mailProviderConfigured) {
      const controller = new AbortController();
      const timer = setTimeout(() => controller.abort(), 12_000);
      try {
        const resendRes = await fetch('https://api.resend.com/emails', {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${resendApiKey}`,
            'Content-Type': 'application/json',
          },
          signal: controller.signal,
          body: JSON.stringify({
            from: fromEmail,
            to: [targetEmail],
            subject: emailSubject,
            html: htmlNewsletter,
          }),
        });
        const resendData = await resendRes.json().catch(() => ({}));
        if (!resendRes.ok) {
          const failedLog: EmailDispatchLog = {
            id: `failed-${Date.now()}`,
            sentAt: new Date().toLocaleString('ko-KR', { timeZone: 'Asia/Seoul' }),
            recipient: targetEmail,
            status: 'failed',
            isPreviewOnly: false,
            headline: emailSubject,
            storiesCount: totalStoriesCount,
          };
          emailLogs.unshift(failedLog);
          if (emailLogs.length > 50) emailLogs.length = 50;
          console.warn('[Resend] Email delivery failed:', resendRes.status, resendData?.message || resendData?.name || '');
          return res.status(502).json({
            success: false,
            isPreviewOnly: false,
            mailProviderConfigured: true,
            message: '이메일 발송 서비스(Resend) 전송에 실패했습니다. API 키 및 발신자 도메인 설정을 확인해주세요.',
            log: failedLog,
            history: emailLogs,
          });
        }

        const sentLog: EmailDispatchLog = {
          id: typeof resendData?.id === 'string' ? resendData.id : `sent-${Date.now()}`,
          sentAt: new Date().toLocaleString('ko-KR', { timeZone: 'Asia/Seoul' }),
          recipient: targetEmail,
          status: 'success',
          isPreviewOnly: false,
          headline: emailSubject,
          storiesCount: totalStoriesCount,
        };
        emailLogs.unshift(sentLog);
        if (emailLogs.length > 50) emailLogs.length = 50;

        return res.json({
          success: true,
          isPreviewOnly: false,
          mailProviderConfigured: true,
          provider: 'resend',
          resendId: resendData?.id,
          message: `${targetEmail} 주소로 실제 뉴스레터 이메일이 발송되었습니다.`,
          log: sentLog,
          htmlPreview: htmlNewsletter,
          history: emailLogs,
        });
      } catch (err: any) {
        const failedLog: EmailDispatchLog = {
          id: `failed-${Date.now()}`,
          sentAt: new Date().toLocaleString('ko-KR', { timeZone: 'Asia/Seoul' }),
          recipient: targetEmail,
          status: 'failed',
          isPreviewOnly: false,
          headline: emailSubject,
          storiesCount: totalStoriesCount,
        };
        emailLogs.unshift(failedLog);
        if (emailLogs.length > 50) emailLogs.length = 50;
        console.warn('[Resend] Email request error:', err?.message || err);
        return res.status(502).json({
          success: false,
          isPreviewOnly: false,
          mailProviderConfigured: true,
          message: '이메일 발송 서버(Resend) 연결 중 오류가 발생했습니다.',
          log: failedLog,
          history: emailLogs,
        });
      } finally {
        clearTimeout(timer);
      }
    }

    const newLog: EmailDispatchLog = {
      id: `preview-${Date.now()}`,
      sentAt: new Date().toLocaleString('ko-KR', { timeZone: 'Asia/Seoul' }),
      recipient: targetEmail,
      status: 'preview',
      isPreviewOnly: true,
      headline: `[미리보기] ${safeBriefingDate} 모닝브리프 뉴스레터`,
      storiesCount: totalStoriesCount,
    };

    emailLogs.unshift(newLog);
    if (emailLogs.length > 50) {
      emailLogs.length = 50;
    }

    return res.json({
      success: true,
      isPreviewOnly: true,
      mailProviderConfigured: false,
      provider: 'none',
      message: `${targetEmail} 대상 뉴스레터 미리보기가 생성되었습니다. (RESEND_API_KEY 미설정으로 실제 발송은 수행되지 않습니다.)`,
      log: newLog,
      htmlPreview: htmlNewsletter,
      history: emailLogs,
    });
  });

  app.get(['/api/email-logs', '/email-logs'], createRateLimiter('email-logs', 60), (_req, res) => {
    const mailConfigured = isResendConfigured();
    res.json({ logs: emailLogs, isPreviewOnly: !mailConfigured, mailProviderConfigured: mailConfigured });
  });

  app.get(['/api/email-schedule', '/email-schedule'], createRateLimiter('email-schedule', 30), (_req, res) => {
    res.json({ success: true, isPreviewOnly: true, schedule: savedEmailSchedule });
  });

  app.post(['/api/email-schedule', '/email-schedule'], createRateLimiter('email-schedule', 20), (req, res) => {
    const { recipientEmail, deliveryTime, deliveryTimezone, deliveryDays, autoEmailEnabled } = req.body || {};

    if (recipientEmail !== undefined && recipientEmail !== '' && !isValidEmailAddress(recipientEmail)) {
      return res.status(400).json({ success: false, error: '올바른 이메일 주소 형식이 아닙니다.' });
    }
    if (deliveryTime !== undefined && !isValidHHMM(deliveryTime)) {
      return res.status(400).json({ success: false, error: '발송 시각은 00:00~23:59 형식이어야 합니다.' });
    }
    if (deliveryTimezone !== undefined && !isValidIanaTimeZone(deliveryTimezone)) {
      return res.status(400).json({ success: false, error: '지원하지 않는 시간대(Timezone)입니다.' });
    }
    if (deliveryDays !== undefined) {
      if (
        !Array.isArray(deliveryDays) ||
        deliveryDays.length > 7 ||
        !deliveryDays.every((d) => typeof d === 'string' && VALID_DAYS.has(d))
      ) {
        return res.status(400).json({ success: false, error: '발송 요일 값이 올바르지 않습니다.' });
      }
    }
    if (autoEmailEnabled !== undefined && typeof autoEmailEnabled !== 'boolean') {
      return res.status(400).json({ success: false, error: '자동 발송 여부는 불리언 값이어야 합니다.' });
    }

    savedEmailSchedule = {
      recipientEmail:
        recipientEmail !== undefined ? String(recipientEmail).trim() : savedEmailSchedule.recipientEmail,
      deliveryTime: deliveryTime !== undefined ? deliveryTime : savedEmailSchedule.deliveryTime,
      deliveryTimezone: deliveryTimezone !== undefined ? deliveryTimezone : savedEmailSchedule.deliveryTimezone,
      deliveryDays: deliveryDays !== undefined ? Array.from(new Set(deliveryDays)) : savedEmailSchedule.deliveryDays,
      autoEmailEnabled: autoEmailEnabled !== undefined ? autoEmailEnabled : savedEmailSchedule.autoEmailEnabled,
      isPreviewOnly: true,
      updatedAt: new Date().toISOString(),
    };

    res.json({
      success: true,
      isPreviewOnly: true,
      note: '설정이 저장되었습니다. 실제 예약 발송은 외부 메일 발송 서비스 및 서버 스케줄러 연동 후 동작합니다.',
      schedule: savedEmailSchedule,
    });
  });
}
