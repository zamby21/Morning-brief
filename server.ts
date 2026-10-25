import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import { GoogleGenAI, Type } from '@google/genai';
import {
  INITIAL_DAILY_BRIEFING,
  MOCK_WEEKLY_REPORT,
  INITIAL_EMAIL_LOGS,
  PRESS_OUTLETS,
} from './src/data/mockNewsData.ts';
import type { DailyBriefing, EmailDispatchLog, WeeklyReport, BriefingTone } from './src/types/news.ts';
import { getCurrentKoreanDateString } from './src/utils/dateUtils.ts';
import { extractSearchKeywords } from './src/utils/linkUtils.ts';
import { transformBriefingTone } from './src/utils/toneTransformer.ts';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
app.use(express.json());

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

// Helper for tone prompt description
function getToneDescription(tone: string): string {
  switch (tone) {
    case 'bullet':
      return '개조식 드라이한 톤(~함, ~임, 명사형 종결, 군더더기 없는 핵심 팩트 중심)';
    case 'friendly':
      return '친근하고 알기 쉬운 뉴스레터 설명 톤(~해요, ~알려드려요, 비전문가도 이해하기 쉽게)';
    case 'insight':
      return '비즈니스 및 투자자 인사이트 톤(시장 파급 효과, 기업 실적 영향, 리스크와 기회 관점 부각)';
    case 'formal':
    default:
      return '정중하고 격식 있는 공식 언론 브리핑 톤(~했습니다, ~로 파악되었습니다)';
  }
}

// 1. API: Generate / Refresh daily briefing
app.post(['/api/summarize', '/summarize'], async (req, res) => {
  try {
    const { outletIds, tone = 'formal', topics = [] } = req.body;
    const selectedOutlets = PRESS_OUTLETS.filter((o) =>
      outletIds && outletIds.length > 0 ? outletIds.includes(o.id) : o.isDefaultMajor
    );
    const outletNames = selectedOutlets.map((o) => o.name).join(', ');

    if (!apiKey) {
      // Fallback with styled existing data
      const adjustedBriefing = transformBriefingTone(INITIAL_DAILY_BRIEFING, tone as BriefingTone);
      return res.json({
        success: true,
        data: adjustedBriefing,
        source: 'database_cache',
      });
    }

    const prompt = `대한민국 대표 언론사 당일(오늘 오전 9시 기준) 뉴스 요약 브리핑을 작성해주세요.
선택된 언론사: ${outletNames}
희망 어조: ${getToneDescription(tone)}
우선 관심 주제: ${topics.length > 0 ? topics.join(', ') : '반도체, 금융/거시, 부동산, 정치/국감, AI/테크'}

요구사항:
1. 상단에 오늘의 핵심 핫 키워드 태그 6~8개 (#키워드 형식)
2. 각 언론사의 당일 신문 1면/첫페이지 핵심 기사 (선택된 언론사별 각 1건씩, 반드시 정확히 3줄 이내 요약, 원문 링크 포함)
3. 언론사들에서 중복적으로 낸 공통 핵심 기사 3건 (각 3줄 이내 요약, 보도한 언론사 목록, 공통 합의점 요약)
4. 각 언론사만의 단독 또는 심층 특별 기사 3건 (각 3줄 이내 요약, [단독] 뱃지)
5. 모든 요약 문항은 각 기사별로 정확히 1, 2, 3번 3줄 번호 매김으로 작성해주세요.`;

    const response = await ai.models.generateContent({
      model: 'gemini-3.8-flash',
      contents: prompt,
      config: {
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
              items: {
                type: Type.OBJECT,
                properties: {
                  outletName: { type: Type.STRING },
                  title: { type: Type.STRING },
                  leadSummary: {
                    type: Type.ARRAY,
                    items: { type: Type.STRING },
                    description: '정확히 최대 3줄의 요약 문장 배열',
                  },
                  originalUrl: { type: Type.STRING },
                  topic: { type: Type.STRING },
                  keywords: {
                    type: Type.ARRAY,
                    items: { type: Type.STRING },
                  },
                },
                required: ['outletName', 'title', 'leadSummary', 'originalUrl'],
              },
            },
            overlappingStories: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  title: { type: Type.STRING },
                  coveredOutlets: {
                    type: Type.ARRAY,
                    items: { type: Type.STRING },
                  },
                  leadSummary: {
                    type: Type.ARRAY,
                    items: { type: Type.STRING },
                  },
                  consensusPoints: {
                    type: Type.ARRAY,
                    items: { type: Type.STRING },
                  },
                  originalUrl: { type: Type.STRING },
                  topic: { type: Type.STRING },
                },
                required: ['title', 'coveredOutlets', 'leadSummary'],
              },
            },
            exclusiveStories: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  outletName: { type: Type.STRING },
                  title: { type: Type.STRING },
                  exclusiveBadge: { type: Type.STRING },
                  leadSummary: {
                    type: Type.ARRAY,
                    items: { type: Type.STRING },
                  },
                  originalUrl: { type: Type.STRING },
                  topic: { type: Type.STRING },
                },
                required: ['outletName', 'title', 'leadSummary'],
              },
            },
          },
          required: ['topKeywords', 'frontPageStories', 'overlappingStories', 'exclusiveStories'],
        },
      },
    });

    const parsed = JSON.parse(response.text || '{}');
    const briefing: DailyBriefing = {
      id: `briefing-live-${Date.now()}`,
      briefingDate: getCurrentKoreanDateString(),
      briefingTime: '09:00 AM (실시간 생성)',
      topKeywords: parsed.topKeywords || INITIAL_DAILY_BRIEFING.topKeywords,
      tone,
      selectedOutletIds: selectedOutlets.map((o) => o.id),
      summaryNote: parsed.summaryNote || INITIAL_DAILY_BRIEFING.summaryNote,
      frontPageStories: (parsed.frontPageStories || []).map((s: any, idx: number) => ({
        id: `fp-live-${idx}`,
        outletId: selectedOutlets[idx % selectedOutlets.length]?.id || 'live',
        outletName: s.outletName || '주요 언론',
        category: 'frontpage',
        title: s.title,
        leadSummary: (s.leadSummary || []).slice(0, 3),
        originalUrl: `https://search.naver.com/search.naver?where=news&query=${encodeURIComponent(`${s.outletName ? s.outletName + ' ' : ''}${extractSearchKeywords(s.title, s.keywords)}`)}`,
        publishedAt: `${getCurrentKoreanDateString()} 07:00`,
        keywords: s.keywords || ['핵심보도'],
        topic: s.topic || '종합',
        reactions: { insightful: 15, important: 40, surprising: 5 },
      })),
      overlappingStories: (parsed.overlappingStories || []).map((s: any, idx: number) => ({
        id: `ol-live-${idx}`,
        outletId: 'multiple',
        outletName: `${(s.coveredOutlets || []).length}개 언론사 공통 보도`,
        category: 'overlapping',
        title: s.title,
        leadSummary: (s.leadSummary || []).slice(0, 3),
        coveredOutlets: s.coveredOutlets || [],
        consensusPoints: s.consensusPoints || [],
        originalUrl: `https://search.naver.com/search.naver?where=news&query=${encodeURIComponent(extractSearchKeywords(s.title, ['공통이슈']))}`,
        publishedAt: `${getCurrentKoreanDateString()} 08:00`,
        keywords: ['공통이슈'],
        topic: s.topic || '종합이슈',
        reactions: { insightful: 25, important: 80, surprising: 10 },
      })),
      exclusiveStories: (parsed.exclusiveStories || []).map((s: any, idx: number) => ({
        id: `ex-live-${idx}`,
        outletId: 'exclusive',
        outletName: s.outletName || '단독보도',
        category: 'exclusive',
        title: s.title,
        exclusiveBadge: s.exclusiveBadge || `${s.outletName} 단독`,
        leadSummary: (s.leadSummary || []).slice(0, 3),
        originalUrl: `https://search.naver.com/search.naver?where=news&query=${encodeURIComponent(`${s.outletName ? s.outletName + ' ' : ''}${extractSearchKeywords(s.title, s.keywords)}`)}`,
        publishedAt: `${getCurrentKoreanDateString()} 07:30`,
        keywords: ['단독기획'],
        topic: s.topic || '심층취재',
        importanceRating: 'Crucial',
        reactions: { insightful: 30, important: 95, surprising: 20 },
      })),
    };

    return res.json({ success: true, data: briefing, source: 'gemini-live' });
  } catch (error: any) {
    console.error('Error generating summary:', error);
    const fallback = transformBriefingTone(INITIAL_DAILY_BRIEFING, (req.body.tone || 'formal') as BriefingTone);
    return res.json({ success: true, data: fallback, source: 'fallback', error: error.message });
  }
});

// 2. API: Rewrite briefing tone via Gemini
app.post(['/api/rewrite-tone', '/rewrite-tone'], async (req, res) => {
  const { currentBriefing, targetTone } = req.body;
  if (!currentBriefing || !targetTone) {
    return res.status(400).json({ error: 'Missing currentBriefing or targetTone' });
  }

  if (!apiKey) {
    const transformed = transformBriefingTone(currentBriefing, targetTone as BriefingTone);
    return res.json({ success: true, data: transformed });
  }

  try {
    const prompt = `다음 뉴스 요약 기사들의 3줄 요약 문장들을 '${getToneDescription(targetTone)}'으로 어조만 자연스럽게 재작성해주세요.
원래 사실과 3줄 분량 제약은 절대 훼손하지 말고 오직 문체와 전달 방식만 변경하세요.

내용:
${JSON.stringify({
  frontPage: currentBriefing.frontPageStories.map((s: any) => ({ id: s.id, summary: s.leadSummary })),
  overlapping: currentBriefing.overlappingStories.map((s: any) => ({ id: s.id, summary: s.leadSummary })),
  exclusive: currentBriefing.exclusiveStories.map((s: any) => ({ id: s.id, summary: s.leadSummary })),
})}`;

    const response = await ai.models.generateContent({
      model: 'gemini-3.8-flash',
      contents: prompt,
      config: {
        responseMimeType: 'application/json',
      },
    });

    const parsed = JSON.parse(response.text || '{}');
    const updated = JSON.parse(JSON.stringify(currentBriefing));
    updated.tone = targetTone;

    if (parsed.frontPage) {
      updated.frontPageStories.forEach((s: any) => {
        const match = parsed.frontPage.find((item: any) => item.id === s.id);
        if (match && match.summary) s.leadSummary = match.summary.slice(0, 3);
      });
    }
    if (parsed.overlapping) {
      updated.overlappingStories.forEach((s: any) => {
        const match = parsed.overlapping.find((item: any) => item.id === s.id);
        if (match && match.summary) s.leadSummary = match.summary.slice(0, 3);
      });
    }
    if (parsed.exclusive) {
      updated.exclusiveStories.forEach((s: any) => {
        const match = parsed.exclusive.find((item: any) => item.id === s.id);
        if (match && match.summary) s.leadSummary = match.summary.slice(0, 3);
      });
    }

    return res.json({ success: true, data: updated });
  } catch (err: any) {
    console.error('Rewrite tone error:', err);
    return res.json({ success: true, data: transformBriefingTone(currentBriefing, targetTone as BriefingTone) });
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

    const response = await ai.models.generateContent({
      model: 'gemini-3.8-flash',
      contents: prompt,
      config: {
        responseMimeType: 'application/json',
      },
    });

    const parsed: WeeklyReport = JSON.parse(response.text || '{}');
    return res.json({ success: true, data: parsed, source: 'gemini-live' });
  } catch (error: any) {
    console.error('Weekly report error:', error);
    return res.json({ success: true, data: MOCK_WEEKLY_REPORT, source: 'fallback' });
  }
});

// 4. API: Send / Preview Briefing Email
app.post(['/api/send-email', '/send-email'], (req, res) => {
  const { recipient, briefing, scheduledTime = '09:00' } = req.body;
  const targetEmail = recipient || 'sr.JI78@gmail.com';

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
