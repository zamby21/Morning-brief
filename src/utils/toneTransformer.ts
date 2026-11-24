import type { DailyBriefing, BriefingTone, NewsStory } from '../types/news.ts';
import { getCurrentKoreanDateString } from './dateUtils.ts';

/**
 * Strips leading numbering, bullet symbols, or [시사점]/[핵심] tags cleanly
 */
export function stripSummaryDecorations(line: string): string {
  return (line || '')
    .replace(/^[0-9]+[.)]\s*/, '')
    .replace(/^[▪•·\-]\s*/, '')
    .replace(/^\[(시사점|핵심|배경|전망|요약|참고)\]\s*/, '')
    .replace(/^(쉽게\s*(?:말해|정리하면|보면),?\s*|여기에\s*더해\s*|특히\s*눈여겨볼\s*점은\s*|앞으로는\s*|참고로\s*)/, '')
    .trim();
}

/**
 * Converts plain/news declarative endings (~다 / ~했다 / ~됐다 / ~이다) into formal honorific report style (~습니다 / ~입니다)
 */
export function toFormalKorean(line: string): string {
  let s = stripSummaryDecorations(line);
  if (!s) return '';

  // Remove leftover friendly/bullet endings back toward formal first
  s = s
    .replace(/했어요[.!]?$/g, '했습니다.')
    .replace(/되었어요[.!]?$/g, '되었습니다.')
    .replace(/됐어요[.!]?$/g, '됐습니다.')
    .replace(/있어요[.!]?$/g, '있습니다.')
    .replace(/없어요[.!]?$/g, '없습니다.')
    .replace(/전망이에요[.!]?$/g, '전망입니다.')
    .replace(/계획이에요[.!]?$/g, '계획입니다.')
    .replace(/예정이에요[.!]?$/g, '예정입니다.')
    .replace(/것으로 보여요[.!]?$/g, '것으로 보입니다.')
    .replace(/(?:이에요|예요)[.!]?$/g, '입니다.')
    .replace(/([가-힣]+)함$/g, '$1했습니다.')
    .replace(/([가-힣]+)됨$/g, '$1되었습니다.')
    .replace(/있음$/g, '있습니다.')
    .replace(/없음$/g, '없습니다.')
    .replace(/([가-힣]+)임$/g, '$1입니다.');

  // If already in formal honorific ending, ensure trailing period and return immediately
  if (/(?:습니다|입니다|봅니다|됩니다|합니다|랍니다)[.?!]?$/.test(s)) {
    return /[.?!]$/.test(s) ? s : `${s}.`;
  }

  // Convert Korean news plain form (해라체) endings cleanly into 합쇼체
  const replacements: [RegExp, string][] = [
    [/밝혔다\.?$/g, '밝혔습니다.'],
    [/전했다\.?$/g, '전했습니다.'],
    [/말했다\.?$/g, '말했습니다.'],
    [/강조했다\.?$/g, '강조했습니다.'],
    [/설명했다\.?$/g, '설명했습니다.'],
    [/지적했다\.?$/g, '지적했습니다.'],
    [/발표했다\.?$/g, '발표했습니다.'],
    [/우려했다\.?$/g, '우려했습니다.'],
    [/예고했다\.?$/g, '예고했습니다.'],
    [/제안했다\.?$/g, '제안했습니다.'],
    [/진단했다\.?$/g, '진단했습니다.'],
    [/분석했다\.?$/g, '분석했습니다.'],
    [/분석됐다\.?$/g, '분석되었습니다.'],
    [/분석된다\.?$/g, '분석됩니다.'],
    [/파악됐다\.?$/g, '파악되었습니다.'],
    [/파악된다\.?$/g, '파악됩니다.'],
    [/나타났다\.?$/g, '나타났습니다.'],
    [/확인됐다\.?$/g, '확인되었습니다.'],
    [/전망된다\.?$/g, '전망됩니다.'],
    [/전망이다\.?$/g, '전망입니다.'],
    [/계획이다\.?$/g, '계획입니다.'],
    [/예정이다\.?$/g, '예정입니다.'],
    [/방침이다\.?$/g, '방침입니다.'],
    [/실정이다\.?$/g, '실정입니다.'],
    [/보인다\.?$/g, '보입니다.'],
    [/따른다\.?$/g, '따릅니다.'],
    [/이어진다\.?$/g, '이어집니다.'],
    [/커진다\.?$/g, '커집니다.'],
    [/높아진다\.?$/g, '높아집니다.'],
    [/했다\.?$/g, '했습니다.'],
    [/됐다\.?$/g, '되었습니다.'],
    [/졌다\.?$/g, '졌습니다.'],
    [/났다\.?$/g, '났습니다.'],
    [/왔다\.?$/g, '왔습니다.'],
    [/갔다\.?$/g, '갔습니다.'],
    [/봤다\.?$/g, '봤습니다.'],
    [/였다\.?$/g, '였습니다.'],
    [/았다\.?$/g, '았습니다.'],
    [/었다\.?$/g, '었습니다.'],
    [/있다\.?$/g, '있습니다.'],
    [/없다\.?$/g, '없습니다.'],
    [/한다\.?$/g, '합니다.'],
    [/된다\.?$/g, '됩니다.'],
    [/진다\.?$/g, '집니다.'],
    [/낸다\.?$/g, '냅니다.'],
    [/이다\.?$/g, '입니다.'],
    [/([가-힣])다\.?$/g, '$1습니다.'],
  ];

  for (const [pattern, replacement] of replacements) {
    if (pattern.test(s)) {
      s = s.replace(pattern, replacement);
      break;
    }
  }

  if (!/[.?!다요음임]$/.test(s)) s += '.';
  return s;
}

/**
 * Converts sentence into ultra-concise executive bulleted nominal form (개조식 드라이톤)
 */
export function toBulletKorean(line: string): string {
  let s = stripSummaryDecorations(line);
  if (!s) return '';

  // Trim verbose journalistic filler phrases to create real telegraphic compression
  s = s
    .replace(/^(?:이날|오늘|한편|이어|또한|특히|그러면서|이와\s*함께)\s+/g, '')
    .replace(/^\[[^\]]+=[^\]]+\]\s*/g, '')
    .replace(/^[가-힣]+\s*(?:기자|특파원)\s*[=·]\s*/g, '')
    .replace(/([가-힣0-9]+)에\s*따르면\s+/g, '$1 기준 ')
    .replace(/것으로\s*(?:파악됐다|파악되었다|파악됩니다)\.?$/g, '파악')
    .replace(/것으로\s*(?:나타났다|나타났습니다)\.?$/g, '확인')
    .replace(/것으로\s*(?:분석됐다|분석되었다|분석된다|분석됩니다)\.?$/g, '분석')
    .replace(/것으로\s*(?:전망된다|전망됩니다|보인다|보입니다)\.?$/g, '전망')
    .replace(/것으로\s*(?:알려졌다|알려졌습니다)\.?$/g, '전해짐')
    .replace(/것으로\s*(?:풀이된다|풀이됩니다|해석된다|해석됩니다)\.?$/g, '해석');

  const bulletReplacements: [RegExp, string][] = [
    [/전망(?:이다|입니다|된다|됩니다)\.?$/g, '전망'],
    [/계획(?:이다|입니다)\.?$/g, '계획'],
    [/예정(?:이다|입니다)\.?$/g, '예정'],
    [/방침(?:이다|입니다)\.?$/g, '방침'],
    [/실정(?:이다|입니다)\.?$/g, '실정'],
    [/강조(?:했다|했습니다)\.?$/g, '강조'],
    [/밝혔(?:다|습니다)\.?$/g, '발표'],
    [/발표(?:했다|했습니다)\.?$/g, '발표'],
    [/전했(?:다|습니다)\.?$/g, '전달'],
    [/말했(?:다|습니다)\.?$/g, '언급'],
    [/설명했(?:다|습니다)\.?$/g, '설명'],
    [/지적했(?:다|습니다)\.?$/g, '지적'],
    [/우려했(?:다|습니다)\.?$/g, '우려'],
    [/제안했(?:다|습니다)\.?$/g, '제안'],
    [/예고했(?:다|습니다)\.?$/g, '예고'],
    [/진단했(?:다|습니다)\.?$/g, '진단'],
    [/분석했(?:다|습니다)\.?$/g, '분석'],
    [/분석(?:됐다|되었다|된다|됩니다)\.?$/g, '분석'],
    [/확인(?:됐다|되었다|된다|됩니다)\.?$/g, '확인'],
    [/나타났(?:다|습니다)\.?$/g, '확인'],
    [/있(?:다|습니다)\.?$/g, '있음'],
    [/없(?:다|습니다)\.?$/g, '없음'],
    [/보인(?:다|습니다)|보입니다\.?$/g, '관측'],
    [/(?:했|하였)(?:다|습니다)\.?$/g, '함'],
    [/(?:됐|되었)(?:다|습니다)\.?$/g, '됨'],
    [/렸(?:다|습니다)\.?$/g, '림'],
    [/셨(?:다|습니다)\.?$/g, '심'],
    [/쳤(?:다|습니다)\.?$/g, '침'],
    [/졌(?:다|습니다)\.?$/g, '짐'],
    [/났(?:다|습니다)\.?$/g, '남'],
    [/냈(?:다|습니다)\.?$/g, '냄'],
    [/섰(?:다|습니다)\.?$/g, '섬'],
    [/뒀(?:다|습니다)\.?$/g, '둠'],
    [/봤(?:다|습니다)\.?$/g, '봄'],
    [/컸(?:다|습니다)\.?$/g, '큼'],
    [/왔(?:다|습니다)\.?$/g, '옴'],
    [/갔(?:다|습니다)\.?$/g, '감'],
    [/뤘(?:다|습니다)\.?$/g, '룸'],
    [/웠(?:다|습니다)\.?$/g, '움'],
    [/겼(?:다|습니다)\.?$/g, '김'],
    [/([가-힣]+)한다\.?$/g, '$1함'],
    [/([가-힣]+)합니다\.?$/g, '$1함'],
    [/([가-힣]+)된다\.?$/g, '$1됨'],
    [/([가-힣]+)됩니다\.?$/g, '$1됨'],
    [/([가-힣]+)이다\.?$/g, '$1임'],
    [/([가-힣]+)입니다\.?$/g, '$1임'],
    [/([가-힣]*(?:었|았|였))(?:다|습니다)\.?$/g, '$1음'],
    [/([가-힣]+)다\.?$/g, '$1음'],
    [/([가-힣]+)습니다\.?$/g, '$1음'],
  ];

  for (const [pattern, replacement] of bulletReplacements) {
    if (pattern.test(s)) {
      s = s.replace(pattern, replacement);
      break;
    }
  }

  s = s.replace(/\.+$/, '').trim();
  return `▪ ${s}`;
}

/**
 * Converts sentence into warm, conversational newsletter style (친근한 설명체)
 */
export function toFriendlyKorean(line: string, idx: number): string {
  let s = stripSummaryDecorations(line);
  if (!s) return '';

  // First normalize plain endings to readable polite conversational forms
  const friendlyReplacements: [RegExp, string][] = [
    [/전망(?:이다|입니다|된다|됩니다)\.?$/g, '전망이에요.'],
    [/계획(?:이다|입니다)\.?$/g, '계획이래요.'],
    [/예정(?:이다|입니다)\.?$/g, '예정이에요.'],
    [/방침(?:이다|입니다)\.?$/g, '방침이라고 해요.'],
    [/실정(?:이다|입니다)\.?$/g, '상황이에요.'],
    [/밝혔(?:다|습니다)\.?$/g, '밝혔어요.'],
    [/발표했(?:다|습니다)\.?$/g, '발표했답니다.'],
    [/전했(?:다|습니다)\.?$/g, '전했어요.'],
    [/말했(?:다|습니다)\.?$/g, '이야기했어요.'],
    [/강조했(?:다|습니다)\.?$/g, '강조했어요.'],
    [/설명했(?:다|습니다)\.?$/g, '설명해 주었어요.'],
    [/지적했(?:다|습니다)\.?$/g, '짚어냈어요.'],
    [/우려했(?:다|습니다)\.?$/g, '걱정하고 있어요.'],
    [/제안했(?:다|습니다)\.?$/g, '제안했답니다.'],
    [/예고했(?:다|습니다)\.?$/g, '예고했어요.'],
    [/진단했(?:다|습니다)\.?$/g, '진단했어요.'],
    [/분석했(?:다|습니다)\.?$/g, '분석했어요.'],
    [/분석(?:됐다|되었다|된다|됩니다)\.?$/g, '분석되고 있어요.'],
    [/파악(?:됐다|되었다|된다|됩니다)\.?$/g, '파악되었어요.'],
    [/확인(?:됐다|되었다|된다|됩니다)\.?$/g, '확인되었어요.'],
    [/나타났(?:다|습니다)\.?$/g, '나타났어요.'],
    [/보인(?:다|습니다)|보입니다\.?$/g, '것으로 보여요.'],
    [/있(?:다|습니다)\.?$/g, '있어요.'],
    [/없(?:다|습니다)\.?$/g, '없어요.'],
    [/(?:했|하였)(?:다|습니다)\.?$/g, '했어요.'],
    [/(?:됐|되었)(?:다|습니다)\.?$/g, '되었어요.'],
    [/졌(?:다|습니다)\.?$/g, '졌어요.'],
    [/났(?:다|습니다)\.?$/g, '났어요.'],
    [/왔(?:다|습니다)\.?$/g, '왔어요.'],
    [/갔(?:다|습니다)\.?$/g, '갔어요.'],
    [/([가-힣]+)한다\.?$/g, '$1해요.'],
    [/([가-힣]+)합니다\.?$/g, '$1해요.'],
    [/([가-힣]+)된다\.?$/g, '$1돼요.'],
    [/([가-힣]+)됩니다\.?$/g, '$1돼요.'],
    [/([가-힣]+)이다\.?$/g, '$1이에요.'],
    [/([가-힣]+)입니다\.?$/g, '$1이에요.'],
    [/([가-힣]+)다\.?$/g, '$1어요.'],
    [/([가-힣]+)습니다\.?$/g, '$1어요.'],
  ];

  // Any Hangul syllable ending with ㅆ batchim (codePoint - 0xAC00) % 28 === 20 before 다/습니다 always takes 어요
  const pastMatch = s.match(/([가-힣])(?:다|습니다)\.?$/);
  if (pastMatch) {
    const code = pastMatch[1].charCodeAt(0) - 0xac00;
    if (code >= 0 && code <= 11171 && code % 28 === 20 && !/(?:었|았|였|됐|했)$/.test(s.replace(/(?:다|습니다)\.?$/, ''))) {
      s = s.replace(/([가-힣])(?:다|습니다)\.?$/, '$1어요.');
    } else {
      for (const [pattern, replacement] of friendlyReplacements) {
        if (pattern.test(s)) {
          s = s.replace(pattern, replacement);
          break;
        }
      }
    }
  } else {
    for (const [pattern, replacement] of friendlyReplacements) {
      if (pattern.test(s)) {
        s = s.replace(pattern, replacement);
        break;
      }
    }
  }

  // Add conversational lead-ins that differentiate tone structurally for the reader
  if (idx === 0 && !s.startsWith('이번 소식') && !s.startsWith('쉽게')) {
    s = `쉽게 정리하면, ${s}`;
  } else if (idx === 1 && !s.startsWith('여기에') && !s.startsWith('특히')) {
    s = `여기에 더해 ${s}`;
  } else if (idx === 2 && !s.startsWith('참고로') && !s.startsWith('따라서')) {
    s = `참고로 ${s}`;
  }

  if (!/[.?!요]$/.test(s)) s += '.';
  return s;
}

/**
 * Formats a raw implication sentence cleanly into a concise bullet-style (개조식) "[시사점] ..." line
 */
export function toBulletInsightLine(rawInsight: string): string {
  const cleanBody = stripSummaryDecorations(rawInsight);
  if (!cleanBody) return '';
  const bulletized = toBulletKorean(cleanBody).replace(/^▪\s*/, '').trim();
  return `[시사점] ${bulletized}`;
}

export const UNAVAILABLE_AI_INSIGHT_LINE =
  '[시사점] AI 분석 불가 — 요약 모델 미연결 또는 일시 지연으로 원문 핵심 3줄 요약만 제공합니다.';

/**
 * Returns an honest placeholder notice instead of fabricating domain-regex boilerplate
 * whenever Gemini cross-article insight is not attached.
 */
export function buildArticleSpecificInsight(
  _title?: string,
  _baseLines?: string[],
  _topic: string = '',
  _outletName: string = ''
): string {
  return UNAVAILABLE_AI_INSIGHT_LINE;
}

/**
 * Formats 3 factual summary lines into the requested BriefingTone consistently across all sections.
 * - insight: 3 lines in bullet style (개조식) + 1 line of [시사점] (real Gemini insight or explicit unavailable notice)
 * - bullet: 3 lines in bullet style (개조식)
 * - formal: 3 lines in formal briefing style (~습니다/~입니다)
 * - friendly: 3 lines in conversational explanatory style (~했어요/~이에요)
 */
export function formatLeadSummaryByTone(
  title: string,
  candidateLines: string[],
  targetTone: BriefingTone,
  _topic: string = '',
  outletName: string = '',
  aiInsight?: string
): { baseSummary: string[]; leadSummary: string[] } {
  const cleanBase = (candidateLines || []).map(stripSummaryDecorations).filter(Boolean);
  while (cleanBase.length < 3) {
    const fallbackLine =
      cleanBase.length === 0
        ? `${outletName ? `${outletName}이 ` : ''}"${title}" 사안을 주요 보도로 다뤘습니다.`
        : cleanBase.length === 1
        ? `관련 세부 내용은 언론사 원문 기사에서 확인할 수 있습니다.`
        : `추가 경과 및 후속 보도는 공식 원문 링크를 참고하세요.`;
    cleanBase.push(fallbackLine);
  }
  const preservedBase = cleanBase.slice(0, 3);

  let nextSummary: string[];
  if (targetTone === 'insight') {
    const bulletLines = preservedBase.map((line) => toBulletKorean(line));
    const hasRealAiInsight =
      Boolean(aiInsight) &&
      aiInsight!.trim().length >= 8 &&
      !aiInsight!.includes('AI 분석 불가');
    const insightLine = hasRealAiInsight
      ? toBulletInsightLine(aiInsight!)
      : UNAVAILABLE_AI_INSIGHT_LINE;
    nextSummary = [...bulletLines, insightLine];
  } else if (targetTone === 'bullet') {
    nextSummary = preservedBase.map((line) => toBulletKorean(line));
  } else if (targetTone === 'friendly') {
    nextSummary = preservedBase.map((line, idx) => toFriendlyKorean(line, idx));
  } else {
    nextSummary = preservedBase.map((line) => toFormalKorean(line));
  }

  return {
    baseSummary: preservedBase,
    leadSummary: nextSummary,
  };
}

/**
 * Transforms a DailyBriefing cleanly into the requested tone while preserving factual baseSummary and Gemini aiInsight.
 * - insight (default): 3 lines of bullet factual summary (개조식) + 1 line of bullet [시사점] (총 4줄)
 * - formal: 3 lines in dignified formal briefing Korean (~했습니다 / ~입니다)
 * - bullet: 3 lines in ultra-concise executive bullet format (▪ ~함 / ~임 / ~전망)
 * - friendly: 3 lines in approachable explanatory newsletter Korean (~했어요 / ~이에요)
 */
export function transformBriefingTone(briefing: DailyBriefing, targetTone: BriefingTone): DailyBriefing {
  const deepCopy: DailyBriefing = JSON.parse(JSON.stringify(briefing));
  deepCopy.tone = targetTone;
  deepCopy.briefingDate = deepCopy.briefingDate || getCurrentKoreanDateString();

  const processStories = (stories: NewsStory[]) =>
    (stories || []).map((s) => {
      const existingInsightLine =
        s.aiInsight ||
        (s.leadSummary || []).find((l) => l.trim().startsWith('[시사점]'));

      const candidateBase =
        s.baseSummary && s.baseSummary.length >= 3
          ? s.baseSummary
          : (s.leadSummary || []).filter((l) => !l.trim().startsWith('[시사점]'));

      const { baseSummary, leadSummary } = formatLeadSummaryByTone(
        s.title,
        candidateBase,
        targetTone,
        s.topic,
        s.outletName,
        existingInsightLine
      );

      return {
        ...s,
        baseSummary,
        leadSummary,
        aiInsight: existingInsightLine ? toBulletInsightLine(existingInsightLine) : s.aiInsight,
      };
    });

  deepCopy.frontPageStories = processStories(deepCopy.frontPageStories);
  deepCopy.overlappingStories = processStories(deepCopy.overlappingStories);
  deepCopy.exclusiveStories = processStories(deepCopy.exclusiveStories);

  if (Array.isArray(deepCopy.sectorHeadlines) && deepCopy.sectorHeadlines.length > 0) {
    deepCopy.sectorHeadlines = deepCopy.sectorHeadlines.map((h) => {
      const existingInsightLine =
        h.aiInsight ||
        (h.leadSummary || []).find((l) => l.trim().startsWith('[시사점]'));

      const bodyParas = (h.fullContent || '')
        .split(/\n\n+/)
        .map((p) => p.replace(/^\[[^\]]+\]\s*/g, '').trim())
        .filter((p) => p.length >= 20);
      const fallbackCandidates = [
        h.summary,
        ...bodyParas.slice(1, 3),
        ...(h.keyFigure ? [`핵심 지표 및 규모는 ${h.keyFigure}로 집계되었습니다.`] : []),
      ].filter(Boolean);

      const candidateBase =
        h.baseSummary && h.baseSummary.length >= 3
          ? h.baseSummary
          : h.leadSummary && h.leadSummary.filter((l) => !l.trim().startsWith('[시사점]')).length >= 2
          ? h.leadSummary.filter((l) => !l.trim().startsWith('[시사점]'))
          : fallbackCandidates;

      const { baseSummary, leadSummary } = formatLeadSummaryByTone(
        h.title,
        candidateBase,
        targetTone,
        h.sectorLabel,
        h.outletName,
        existingInsightLine
      );

      return {
        ...h,
        baseSummary,
        leadSummary,
        aiInsight: existingInsightLine ? toBulletInsightLine(existingInsightLine) : h.aiInsight,
      };
    });
  }

  return deepCopy;
}
