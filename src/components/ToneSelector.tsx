import React from 'react';
import { Sparkles, Check } from 'lucide-react';
import { BriefingTone } from '../types/news';

interface ToneSelectorProps {
  currentTone: BriefingTone;
  onSelectTone: (tone: BriefingTone) => void;
  isLoading: boolean;
}

export const ToneSelector: React.FC<ToneSelectorProps> = ({
  currentTone,
  onSelectTone,
  isLoading,
}) => {
  const tones: {
    id: BriefingTone;
    name: string;
    badge: string;
    description: string;
    example: string;
  }[] = [
    {
      id: 'formal',
      name: '격식 브리핑체',
      badge: '공식 보고',
      description: '정중하고 신뢰감 있는 표준 언론 어조',
      example: '‘~했습니다’, ‘~인 것으로 분석되었습니다’',
    },
    {
      id: 'bullet',
      name: '개조식 드라이톤',
      badge: '시간 절약',
      description: '군더더기를 뺀 핵심 팩트 위주의 신속 전달',
      example: '‘~함’, ‘~실정임’, ‘~대응책 발표’',
    },
    {
      id: 'friendly',
      name: '친근한 설명체',
      badge: '쉬운 해설',
      description: '누구나 이해하기 쉬운 친절한 뉴스레터 어조',
      example: '‘~했어요!’, ‘~되었답니다’, ‘알아볼까요?’',
    },
    {
      id: 'insight',
      name: '투자·비즈니스 인사이트',
      badge: '시장 영향',
      description: '기업 실적, 거시 경제, 기회와 리스크 분석 중심',
      example: '‘[시사점] 시장 변동성 확대 및 수혜 전망’',
    },
  ];

  return (
    <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-4 sm:p-5 shadow-sm backdrop-blur-sm">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <div className="p-1.5 rounded-lg bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
            <Sparkles className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              요약본 어조(Tone) 개인화 설정
            </h3>
            <p className="text-xs text-slate-400">
              취향이나 읽는 상황에 맞게 4가지 문체 중 선택하시면 AI가 요약본 문장을 즉시 재작성합니다.
            </p>
          </div>
        </div>
        {isLoading && (
          <span className="text-xs text-indigo-400 animate-pulse font-medium">
            AI 어조 변환 중...
          </span>
        )}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2.5">
        {tones.map((t) => {
          const isSelected = currentTone === t.id;
          return (
            <button
              key={t.id}
              onClick={() => onSelectTone(t.id)}
              disabled={isLoading}
              className={`p-3 rounded-xl border text-left transition relative flex flex-col justify-between ${
                isSelected
                  ? 'bg-gradient-to-b from-indigo-950/60 to-slate-900 border-indigo-500 shadow-md shadow-indigo-500/10 ring-1 ring-indigo-500'
                  : 'bg-slate-800/60 border-slate-700/60 hover:bg-slate-800 hover:border-slate-600'
              }`}
            >
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-xs font-bold text-white flex items-center gap-1.5">
                    {t.name}
                  </span>
                  <span
                    className={`text-[10px] font-semibold px-1.5 py-0.5 rounded ${
                      isSelected
                        ? 'bg-indigo-500 text-white'
                        : 'bg-slate-700 text-slate-300'
                    }`}
                  >
                    {t.badge}
                  </span>
                </div>
                <p className="text-[11px] text-slate-300 leading-tight mb-2">
                  {t.description}
                </p>
              </div>
              <div className="text-[10px] text-indigo-300/80 bg-slate-950/50 px-2 py-1 rounded border border-slate-800">
                예시: {t.example}
              </div>
              {isSelected && (
                <div className="absolute top-2 right-2 -mr-1 -mt-1 w-4 h-4 bg-indigo-500 rounded-full flex items-center justify-center text-white">
                  <Check className="w-2.5 h-2.5" />
                </div>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
};
