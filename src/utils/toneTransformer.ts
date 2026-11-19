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

/**
 * Synthesizes a sharp, article-specific 1-line strategic/market/policy implication ([시사점]) in concise bullet style (개조식)
 * as a deterministic fallback when Gemini cross-article insight is not yet attached.
 */
export function buildArticleSpecificInsight(
  title: string,
  baseLines: string[],
  topic: string = '',
  outletName: string = ''
): string {
  const strippedLines = baseLines.map((l) => l.replace(/^\[[^\]]+\]\s*/g, '').trim());
  const combinedText = `${title} ${strippedLines.join(' ')} ${topic}`;
  const thirdFact = stripSummaryDecorations(strippedLines[2] || '').replace(/\.$/, '');
  const cleanTitle = (title || '')
    .replace(/\[.*?\]/g, '')
    .replace(/“|”|"|'/g, '')
    .trim();

  // If 3rd fact already captures a concrete forward-looking consequence or risk, anchor the bullet insight on it
  const hasForecastCue = /(전망|우려|파장|영향|변동|확대|기대|대비|분수령|관건|과제|위기|기회|효과|촉각)/.test(thirdFact);
  if (hasForecastCue && thirdFact.length >= 20 && thirdFact.length <= 130 && !thirdFact.includes('점에')) {
    const bulletBody = toBulletKorean(thirdFact).replace(/^▪\s*/, '').trim();
    return `[시사점] ${bulletBody} — 관련 업계·정책 당국의 선제적 리스크 점검 필요`;
  }

  if (/수능|시험|부정행위|수험생|교육부|세무사|커닝/.test(combinedText)) {
    return `[시사점] 시험 공정성 훼손 차단 및 첨단 부정행위 방지 체계 고도화가 제도 신뢰 회복의 핵심 관건`;
  }
  if (/비타민|건강|의료|질병|병원|영양제|방역/.test(combinedText)) {
    return `[시사점] 계절·생활 환경 변화에 맞춘 근거 기반 예방 보건 및 공중위생 대응 체계 강화 필요`;
  }
  if (/트럼프|시진핑|푸틴|APEC|한한령|FTA|중국|미국|관세|외교|공급망/.test(combinedText)) {
    return `[시사점] 주요국 통상·안보 협의 구도 재편에 따른 수출·공급망 리스크 및 신시장 기회 동시 대비 필요`;
  }
  if (/법원|판결|무죄|구형|특검|재판|계엄|대법|구속|수사|경찰/.test(combinedText)) {
    return `[시사점] 사법 판단과 수사 향방이 향후 정책 추진 동력 및 제도적 기준 재정비의 중대 분수령 전망`;
  }
  if (/반도체|HBM|엔비디아|삼성전자|SK하이닉스|하이닉스|희토류/.test(combinedText)) {
    return `[시사점] AI 인프라·첨단 기술 패권 경쟁 심화 속 핵심 밸류체인 자립도 및 수익성 방어 역량 주목`;
  }
  if (/부동산|아파트|전세|분양|집값|주택|건설|PF|재건축|신안|대전|지역/.test(combinedText)) {
    return `[시사점] 입지·수급 여건별 시장 양극화 심화 우려 속 실수요 대응 및 자금조달·PF 리스크 정밀 관리 필요`;
  }
  if (/증시|코스피|코스닥|주가|성장률|금리|환율|GDP|KDI|수출/.test(combinedText)) {
    return `[시사점] '${cleanTitle.slice(0, 26)}${cleanTitle.length > 26 ? '…' : ''}' 흐름이 거시·수급 변곡점으로 작용하며 업종별 실적 차별화 확대 전망`;
  }

  const label = outletName ? `${outletName} 보도 사안 관련 ` : '';
  return `[시사점] ${label}후속 조치 및 이해관계자 대응 속도가 향후 정책·시장 파급 폭을 좌우할 핵심 변수 전망`;
}

/**
 * Formats 3 factual summary lines into the requested BriefingTone consistently across all sections.
 * - insight: 3 lines in bullet style (개조식) + 1 line of [시사점] in bullet style (개조식) => total 4 lines
 * - bullet: 3 lines in bullet style (개조식)
 * - formal: 3 lines in formal briefing style (~습니다/~입니다)
 * - friendly: 3 lines in conversational explanatory style (~했어요/~이에요)
 */
export function formatLeadSummaryByTone(
  title: string,
  candidateLines: string[],
  targetTone: BriefingTone,
  topic: string = '',
  outletName: string = '',
  aiInsight?: string
): { baseSummary: string[]; leadSummary: string[] } {
  const cleanBase = (candidateLines || []).map(stripSummaryDecorations).filter(Boolean);
  while (cleanBase.length < 3) {
    const fallbackLine =
      cleanBase.length === 0
        ? `${outletName ? `${outletName}이 ` : ''}"${title}" 사안을 주요 보도로 다뤘습니다.`
        : cleanBase.length === 1
        ? `관련 현장과 이해관계자들의 입장 및 세부 쟁점이 집중 보도되고 있습니다.`
        : `후속 조치와 시장·사회적 파급 결과에 관심이 모아지고 있습니다.`;
    cleanBase.push(fallbackLine);
  }
  const preservedBase = cleanBase.slice(0, 3);

  let nextSummary: string[];
  if (targetTone === 'insight') {
    const bulletLines = preservedBase.map((line) => toBulletKorean(line));
    const insightLine =
      aiInsight && aiInsight.trim().length >= 8
        ? toBulletInsightLine(aiInsight)
        : buildArticleSpecificInsight(title, preservedBase, topic, outletName);
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
