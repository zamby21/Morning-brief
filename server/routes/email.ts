import type express from 'express';
import type { EmailDispatchLog } from '../../src/types/news.ts';
import { isValidEmailAddress } from '../../src/utils/htmlSanitizer.ts';
import {
  createRateLimiter,
  serverBriefingStore,
  isValidHHMM,
} from '../utils/security.ts';
import {
  buildNewsletterHtml,
  dispatchBriefingEmail,
  getMailProviderStatus,
} from '../services/mailService.ts';

export { getMailProviderStatus, isMailProviderConfigured } from '../services/mailService.ts';

export function registerEmailRoutes(app: express.Express): void {
  // Dispatch newsletter via Naver Mail SMTP (nodemailer) when NAVER_EMAIL & NAVER_APP_PASSWORD are set,
  // or return a sanitized HTML preview when unconfigured. Stateless: never stores/exposes other users' emails.
  app.post(['/api/send-email', '/send-email'], createRateLimiter('send-email', 20), async (req, res) => {
    const {
      recipient,
      briefingId,
      briefing: clientBriefing,
      scheduledTime = '09:00',
    } = req.body || {};

    const targetEmail = typeof recipient === 'string' ? recipient.trim() : '';
    if (!isValidEmailAddress(targetEmail)) {
      return res.status(400).json({
        success: false,
        message: '올바른 수신 이메일 주소를 입력해주세요.',
      });
    }

    const providerStatus = getMailProviderStatus();
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
    const sectorStories = Array.isArray(briefing?.sectorHeadlines) ? briefing.sectorHeadlines.slice(0, 3) : [];
    const topKeywords = Array.isArray(briefing?.topKeywords)
      ? briefing.topKeywords.slice(0, 10).map((k: unknown) => String(k || '').slice(0, 40))
      : [];

    const emailSubject = `[모닝브리프] ${safeBriefingDate} 대한민국 주요 언론사 뉴스 요약`;
    const totalStoriesCount =
      frontStories.length + overlapStories.length + exclStories.length + sectorStories.length;

    const htmlNewsletter = buildNewsletterHtml({
      recipientEmail: targetEmail,
      briefingDate: safeBriefingDate,
      scheduledTime: safeScheduledTime,
      summaryNote: typeof briefing?.summaryNote === 'string' ? briefing.summaryNote : undefined,
      topKeywords,
      frontStories,
      overlapStories,
      exclStories,
      sectorStories,
      mailProviderConfigured: providerStatus.configured,
    });

    if (providerStatus.configured) {
      const dispatchResult = await dispatchBriefingEmail({
        recipient: targetEmail,
        subject: emailSubject,
        htmlBody: htmlNewsletter,
      });

      const log: EmailDispatchLog = {
        id: dispatchResult.messageId || `${dispatchResult.status}-${Date.now()}`,
        sentAt: new Date().toLocaleString('ko-KR', { timeZone: 'Asia/Seoul' }),
        recipient: targetEmail,
        status: dispatchResult.status,
        isPreviewOnly: false,
        headline: emailSubject,
        storiesCount: totalStoriesCount,
        provider: dispatchResult.provider,
        messageId: dispatchResult.messageId,
      };

      if (!dispatchResult.success) {
        return res.status(dispatchResult.httpStatus || 502).json({
          success: false,
          isPreviewOnly: false,
          mailProviderConfigured: true,
          provider: dispatchResult.provider,
          providerLabel: dispatchResult.providerLabel,
          missingFields: [],
          message: dispatchResult.message,
          log,
        });
      }

      return res.json({
        success: true,
        isPreviewOnly: false,
        mailProviderConfigured: true,
        provider: dispatchResult.provider,
        providerLabel: dispatchResult.providerLabel,
        missingFields: [],
        messageId: dispatchResult.messageId,
        message: dispatchResult.message,
        log,
        htmlPreview: htmlNewsletter,
      });
    }

    const missingHint =
      providerStatus.missingFields.length > 0
        ? `(${providerStatus.missingFields.join(', ')} 미설정으로 실제 발송은 수행되지 않습니다.)`
        : '(네이버 메일 SMTP 미연동으로 실제 발송은 수행되지 않습니다.)';

    const previewLog: EmailDispatchLog = {
      id: `preview-${Date.now()}`,
      sentAt: new Date().toLocaleString('ko-KR', { timeZone: 'Asia/Seoul' }),
      recipient: targetEmail,
      status: 'preview',
      isPreviewOnly: true,
      headline: `[미리보기] ${safeBriefingDate} 모닝브리프 뉴스레터`,
      storiesCount: totalStoriesCount,
      provider: 'none',
    };

    return res.json({
      success: true,
      isPreviewOnly: true,
      mailProviderConfigured: false,
      provider: providerStatus.provider,
      providerLabel: providerStatus.providerLabel,
      missingFields: providerStatus.missingFields,
      message: `${targetEmail} 대상 뉴스레터 미리보기가 생성되었습니다. ${missingHint}`,
      log: previewLog,
      htmlPreview: htmlNewsletter,
    });
  });

  // Explicitly disable unauthenticated shared PII endpoints (user preferences & logs are stored strictly in each user's browser)
  app.all(['/api/email-logs', '/email-logs', '/api/email-schedule', '/email-schedule'], (_req, res) => {
    return res.status(403).json({
      success: false,
      errorCode: 'PRIVATE_LOCAL_STORAGE_ONLY',
      message: '개인정보 보호를 위해 수신 이메일과 발송 이력은 공용 서버에 저장되지 않으며 브라우저 로컬 저장소에만 보관됩니다.',
    });
  });
}
