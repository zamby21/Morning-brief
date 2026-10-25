import { DailyBriefing, BriefingTone } from '../types/news';
import { getCurrentKoreanDateString } from './dateUtils';

/**
 * Transforms the tone and wording of a DailyBriefing object client-side or server-side.
 * Supported tones:
 * - formal: 격식 브리핑체 (~했습니다, ~로 파악되었습니다)
 * - bullet: 개조식 드라이톤 (~함, ~임, 명사형 종결, 간결한 팩트 위주)
 * - friendly: 친근한 설명체 (~해요, ~알려드려요, 친절한 뉴스레터 어조)
 * - insight: 투자·비즈니스 인사이트 ([시사점], 시장 파급 및 전략적 분석)
 */
export function transformBriefingTone(briefing: DailyBriefing, targetTone: BriefingTone): DailyBriefing {
  const deepCopy: DailyBriefing = JSON.parse(JSON.stringify(briefing));
  deepCopy.tone = targetTone;
  deepCopy.briefingDate = deepCopy.briefingDate || getCurrentKoreanDateString();

  const rewriteLine = (text: string, tone: BriefingTone): string => {
    // Strip existing prefix numbering e.g. "1. "
    const clean = text.replace(/^[0-9]\.\s*/, '').trim();

    if (tone === 'bullet') {
      return (
        clean
          .replace(/했습니다|였습니다|되었습니다/g, '함')
          .replace(/있습니다/g, '있음')
          .replace(/입니다/g, '임')
          .replace(/실정입니다/g, '실정임')
          .replace(/전망됩니다/g, '전망됨')
          .replace(/밝혔습니다/g, '밝힘')
          .replace(/나타났습니다/g, '나타남')
          .replace(/강조했습니다/g, '강조함')
          .replace(/분석됩니다/g, '분석됨')
          .replace(/발표했습니다/g, '발표함')
      );
    }

    if (tone === 'friendly') {
      return clean
        .replace(/했습니다|였습니다/g, '했어요!')
        .replace(/되었습니다/g, '되었답니다.')
        .replace(/있습니다/g, '있어요.')
        .replace(/입니다/g, '이에요.')
        .replace(/전망됩니다/g, '전망돼요!')
        .replace(/밝혔습니다/g, '밝혔답니다.')
        .replace(/나타났습니다/g, '나타났어요.')
        .replace(/강조했습니다/g, '강조했어요!')
        .replace(/분석됩니다/g, '분석되고 있어요.')
        .replace(/발표했습니다/g, '발표했답니다.');
    }

    if (tone === 'insight') {
      const insightBody = clean.replace(/했습니다|였습니다|되었습니다/g, '한 것으로 분석');
      return `[시사점] ${insightBody}되어, 향후 산업 생태계와 시장 변동성에 대비가 요구됩니다.`;
    }

    // Default 'formal'
    return clean;
  };

  const processStories = (stories: any[]) =>
    (stories || []).map((s) => ({
      ...s,
      leadSummary: (s.leadSummary || []).map((line: string, idx: number) => {
        const transformed = rewriteLine(line, targetTone);
        return `${idx + 1}. ${transformed.replace(/^[0-9]\.\s*/, '')}`;
      }),
    }));

  deepCopy.frontPageStories = processStories(deepCopy.frontPageStories);
  deepCopy.overlappingStories = processStories(deepCopy.overlappingStories);
  deepCopy.exclusiveStories = processStories(deepCopy.exclusiveStories);

  return deepCopy;
}
