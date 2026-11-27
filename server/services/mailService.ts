import nodemailer from 'nodemailer';
import { escapeHtml, isValidEmailAddress, sanitizeHttpUrl } from '../../src/utils/htmlSanitizer.ts';
import { maskEmailAddress } from '../utils/security.ts';

export type MailProviderKind = 'naver-smtp' | 'none';

export interface MailProviderStatusInfo {
  configured: boolean;
  provider: MailProviderKind;
  providerLabel: string;
  missingFields: string[];
}

export interface SendBriefingMailParams {
  recipient: string;
  subject: string;
  htmlBody: string;
}

export interface SendBriefingMailResult {
  success: boolean;
  provider: MailProviderKind;
  providerLabel: string;
  status: 'success' | 'failed';
  messageId?: string;
  message: string;
  httpStatus?: number;
}

const NAVER_SMTP_HOST = 'smtp.naver.com';
const NAVER_SMTP_PORT = 587;

/**
 * Resolve Naver Mail SMTP configuration strictly from server-side environment variables.
 */
export function getMailProviderStatus(): MailProviderStatusInfo {
  const naverEmail = (process.env.NAVER_EMAIL || '').trim();
  const naverAppPassword = (process.env.NAVER_APP_PASSWORD || '').trim();

  const missingFields: string[] = [];
  if (!naverEmail || !isValidEmailAddress(naverEmail)) {
    missingFields.push('NAVER_EMAIL');
  }
  if (!naverAppPassword) {
    missingFields.push('NAVER_APP_PASSWORD');
  }

  if (missingFields.length === 0) {
    return {
      configured: true,
      provider: 'naver-smtp',
      providerLabel: '네이버 메일 SMTP',
      missingFields: [],
    };
  }

  return {
    configured: false,
    provider: 'none',
    providerLabel: '미연동',
    missingFields,
  };
}

export function isMailProviderConfigured(): boolean {
  return getMailProviderStatus().configured;
}

/**
 * Strip CR/LF control characters to prevent SMTP header injection.
 */
function sanitizeMailHeaderValue(value: string): string {
  return value.replace(/[\r\n]+/g, ' ').trim();
}

/**
 * Build an email-client-compatible (inline-styled, table-wrapped) sanitized HTML newsletter.
 */
export function buildNewsletterHtml(options: {
  recipientEmail: string;
  briefingDate: string;
  scheduledTime: string;
  summaryNote?: string;
  topKeywords: string[];
  frontStories: any[];
  overlapStories: any[];
  exclStories: any[];
  mailProviderConfigured: boolean;
}): string {
  const {
    recipientEmail,
    briefingDate,
    scheduledTime,
    summaryNote,
    topKeywords,
    frontStories,
    overlapStories,
    exclStories,
    mailProviderConfigured,
  } = options;

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
      .map(
        (l: unknown) =>
          `<div style="font-size:13px;color:#334155;line-height:1.65;margin:4px 0;">${escapeHtml(
            String(l || '').slice(0, 300)
          )}</div>`
      )
      .join('');
    const safeHref = sanitizeHttpUrl(story?.originalUrl);
    const linkHtml = safeHref
      ? `<div style="margin-top:8px;"><a href="${escapeHtml(
          safeHref
        )}" target="_blank" rel="noopener noreferrer" style="display:inline-block;font-size:12px;color:${accentColor};text-decoration:none;font-weight:700;">${escapeHtml(
          ctaLabel
        )}</a></div>`
      : '';

    return `
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="margin-bottom:12px;border-collapse:collapse;">
        <tr>
          <td style="background-color:#f8fafc;border:1px solid #e2e8f0;border-left:4px solid ${accentColor};border-radius:8px;padding:14px 16px;">
            <div style="font-size:11px;font-weight:700;color:${accentColor};margin-bottom:4px;">${safeOutlet}</div>
            <div style="font-size:14px;font-weight:700;color:#0f172a;line-height:1.45;margin-bottom:8px;">${safeTitle}</div>
            ${linesHtml}
            ${linkHtml}
          </td>
        </tr>
      </table>
    `;
  };

  const badgeText = mailProviderConfigured
    ? `데일리 브리핑 · 희망 시각 ${escapeHtml(scheduledTime)}`
    : `뉴스레터 미리보기 · 희망 시각 ${escapeHtml(scheduledTime)}`;

  const safeKeywords = topKeywords
    .slice(0, 10)
    .map((k) => escapeHtml(String(k || '').slice(0, 40)))
    .filter(Boolean);

  const keywordChipsHtml = safeKeywords
    .map(
      (kw) =>
        `<span style="display:inline-block;background-color:#eff6ff;color:#1d4ed8;border:1px solid #bfdbfe;border-radius:6px;padding:4px 8px;font-size:12px;font-weight:700;margin:0 6px 6px 0;">${kw}</span>`
    )
    .join('');

  const safeSummaryNote =
    typeof summaryNote === 'string' && summaryNote.trim()
      ? `<p style="margin:10px 0 0 0;font-size:13px;line-height:1.65;color:#475569;">${escapeHtml(
          summaryNote.trim().slice(0, 400)
        )}</p>`
      : '';

  return `<!DOCTYPE html>
<html lang="ko">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>[모닝브리프] ${escapeHtml(briefingDate)}</title>
</head>
<body style="margin:0;padding:20px 12px;background-color:#f1f5f9;font-family:-apple-system,BlinkMacSystemFont,'Apple SD Gothic Neo','Malgun Gothic','Pretendard',sans-serif;color:#1e293b;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="max-width:680px;margin:0 auto;background-color:#ffffff;border:1px solid #e2e8f0;border-radius:12px;overflow:hidden;border-collapse:separate;">
    <tr>
      <td style="background-color:#0f172a;color:#ffffff;padding:28px 24px;">
        <span style="display:inline-block;background-color:#2563eb;color:#ffffff;font-size:11px;font-weight:700;padding:4px 10px;border-radius:9999px;">${badgeText}</span>
        <div style="font-size:21px;font-weight:800;margin:12px 0 6px 0;color:#ffffff;line-height:1.35;">모닝브리프 - 대한민국 주요 언론사 뉴스 요약</div>
        <div style="font-size:13px;color:#94a3b8;">${escapeHtml(briefingDate)} | 수신: ${escapeHtml(recipientEmail)}</div>
      </td>
    </tr>
    ${
      mailProviderConfigured
        ? ''
        : `<tr>
      <td style="background-color:#fffbeb;border-bottom:1px solid #fde68a;color:#92400e;padding:12px 24px;font-size:12px;font-weight:600;">
        안내: 네이버 메일 SMTP 환경 변수(NAVER_EMAIL, NAVER_APP_PASSWORD)가 설정되지 않은 미리보기 화면입니다.
      </td>
    </tr>`
    }
    <tr>
      <td style="padding:22px 24px;border-bottom:1px solid #f1f5f9;">
        <div style="font-size:15px;font-weight:800;color:#0f172a;margin-bottom:12px;">오늘의 핵심 키워드</div>
        <div>${keywordChipsHtml || '<span style="font-size:12px;color:#64748b;">수집된 키워드가 없습니다.</span>'}</div>
        ${safeSummaryNote}
      </td>
    </tr>
    <tr>
      <td style="padding:22px 24px;border-bottom:1px solid #f1f5f9;">
        <div style="font-size:15px;font-weight:800;color:#0f172a;margin-bottom:14px;">언론사별 홈페이지 첫화면 주요 보도</div>
        ${frontStories
          .map((s: any) =>
            renderCardHtml(
              s,
              '#2563eb',
              `${String(s?.outletName || '언론사')} | 홈페이지 주요 톱`,
              '원문 기사 바로보기 →'
            )
          )
          .join('')}
      </td>
    </tr>
    ${
      overlapStories.length > 0
        ? `<tr>
      <td style="padding:22px 24px;border-bottom:1px solid #f1f5f9;">
        <div style="font-size:15px;font-weight:800;color:#0f172a;margin-bottom:14px;">언론사 공통 핵심 이슈</div>
        ${overlapStories
          .map((s: any) =>
            renderCardHtml(s, '#7c3aed', String(s?.outletName || '공통 보도'), '관련 기사 보기 →')
          )
          .join('')}
      </td>
    </tr>`
        : ''
    }
    ${
      exclStories.length > 0
        ? `<tr>
      <td style="padding:22px 24px;border-bottom:1px solid #f1f5f9;">
        <div style="font-size:15px;font-weight:800;color:#0f172a;margin-bottom:14px;">언론사 단독 표기 보도</div>
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
      </td>
    </tr>`
        : ''
    }
    <tr>
      <td style="background-color:#f8fafc;padding:18px 24px;text-align:center;font-size:12px;color:#64748b;line-height:1.6;">
        ${
          mailProviderConfigured
            ? `본 메일은 모닝브리프에서 네이버 메일 SMTP를 통해 발송되었습니다. (희망 발송 시각: ${escapeHtml(scheduledTime)})`
            : `본 화면은 모닝브리프 뉴스레터 미리보기입니다. (희망 발송 시각: ${escapeHtml(scheduledTime)})<br>실제 이메일 발송은 네이버 메일 SMTP(NAVER_EMAIL, NAVER_APP_PASSWORD) 설정 후 활성화됩니다.`
        }
      </td>
    </tr>
  </table>
</body>
</html>`;
}

function translateNaverSmtpError(err: unknown): { message: string; httpStatus: number } {
  const errorObj = err as { code?: string; responseCode?: number } | undefined;
  const code = errorObj?.code || '';
  const responseCode = errorObj?.responseCode;

  if (code === 'EAUTH' || responseCode === 535 || responseCode === 534) {
    return {
      message:
        '네이버 메일 SMTP 인증에 실패했습니다. NAVER_EMAIL, NAVER_APP_PASSWORD(애플리케이션 비밀번호) 및 네이버 메일 환경설정의 POP3/SMTP 사용 여부를 확인해주세요.',
      httpStatus: 502,
    };
  }
  if (code === 'ETIMEDOUT' || code === 'ESOCKET' || code === 'ECONNECTION') {
    return {
      message: '네이버 메일 SMTP 서버(smtp.naver.com:587) 연결 시간이 초과되었습니다. 잠시 후 다시 시도해주세요.',
      httpStatus: 504,
    };
  }
  if (responseCode === 550 || responseCode === 553 || responseCode === 554) {
    return {
      message: '네이버 메일 SMTP에서 발송이 거부되었습니다. 발신자(NAVER_EMAIL) 및 수신자 주소를 확인해주세요.',
      httpStatus: 502,
    };
  }
  return {
    message: '네이버 메일 SMTP 전송 중 오류가 발생했습니다. 환경 변수 및 네이버 메일 SMTP 설정을 확인해주세요.',
    httpStatus: 502,
  };
}

/**
 * Send newsletter email via Naver Mail SMTP (smtp.naver.com, port 587, secure: false) using nodemailer.
 */
export async function dispatchBriefingEmail(
  params: SendBriefingMailParams
): Promise<SendBriefingMailResult> {
  const status = getMailProviderStatus();
  if (!status.configured) {
    return {
      success: false,
      provider: 'none',
      providerLabel: '미연동',
      status: 'failed',
      message: '네이버 메일 SMTP 환경 변수(NAVER_EMAIL, NAVER_APP_PASSWORD)가 설정되지 않았습니다.',
      httpStatus: 503,
    };
  }

  const naverEmail = (process.env.NAVER_EMAIL || '').trim();
  const naverAppPassword = (process.env.NAVER_APP_PASSWORD || '').trim();

  const transporter = nodemailer.createTransport({
    host: NAVER_SMTP_HOST,
    port: NAVER_SMTP_PORT,
    secure: false,
    auth: {
      user: naverEmail,
      pass: naverAppPassword,
    },
    connectionTimeout: 12_000,
    greetingTimeout: 10_000,
    socketTimeout: 15_000,
  });

  try {
    const info = await transporter.sendMail({
      from: naverEmail,
      to: params.recipient,
      subject: sanitizeMailHeaderValue(params.subject),
      html: params.htmlBody,
    });

    return {
      success: true,
      provider: 'naver-smtp',
      providerLabel: '네이버 메일 SMTP',
      status: 'success',
      messageId: info.messageId,
      message: `${params.recipient} 주소로 네이버 메일 SMTP를 통해 뉴스레터 이메일이 발송되었습니다.`,
    };
  } catch (err) {
    const translated = translateNaverSmtpError(err);
    const errCode = (err as { code?: string; responseCode?: number } | undefined)?.code || 'unknown';
    console.warn(
      `[NaverSMTP] Delivery failed (${errCode}) for ${maskEmailAddress(params.recipient)}`
    );
    return {
      success: false,
      provider: 'naver-smtp',
      providerLabel: '네이버 메일 SMTP',
      status: 'failed',
      message: translated.message,
      httpStatus: translated.httpStatus,
    };
  } finally {
    transporter.close();
  }
}
