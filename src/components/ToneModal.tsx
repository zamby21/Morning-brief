import React from 'react';
import { Sparkles, X, Check, MessageSquareQuote } from 'lucide-react';
import { BriefingTone } from '../types/news';

interface ToneModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentTone: BriefingTone;
  onSelectTone: (tone: BriefingTone) => void;
  isLoading: boolean;
}

export const ToneModal: React.FC<ToneModalProps> = ({
  isOpen,
  onClose,
  currentTone,
  onSelectTone,
  isLoading,
}) => {
  if (!isOpen) return null;

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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="bg-white border border-slate-200 rounded-3xl w-full max-w-2xl flex flex-col shadow-2xl overflow-hidden text-slate-800">
        {/* Header */}
        <div className="px-6 py-5 border-b border-slate-200 flex items-center justify-between bg-slate-50/80">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-indigo-100 text-indigo-700">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                요약본 어조(Tone) 개인화 설정
                <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-indigo-100 text-indigo-700">
                  AI 재요약
                </span>
              </h3>
              <p className="text-xs text-slate-500">
                원하시는 스타일에 맞추어 AI가 3줄 요약 문장을 실시간으로 재구성합니다.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-slate-800 hover:bg-slate-200 transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tone Options */}
        <div className="p-6 space-y-3 bg-slate-50/50">
          {tones.map((t) => {
            const isSelected = currentTone === t.id;
            return (
              <div
                key={t.id}
                onClick={() => onSelectTone(t.id)}
                className={`p-4 rounded-2xl border transition-all cursor-pointer flex items-start justify-between gap-4 ${
                  isSelected
                    ? 'bg-white border-indigo-500 shadow-sm ring-2 ring-indigo-500/20'
                    : 'bg-white border-slate-200 hover:border-slate-300 hover:shadow-xs'
                }`}
              >
                <div className="space-y-1.5 flex-1">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-bold text-slate-900">{t.name}</span>
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded ${
                      isSelected ? 'bg-indigo-100 text-indigo-800' : 'bg-slate-100 text-slate-600'
                    }`}>
                      {t.badge}
                    </span>
                  </div>
                  <p className="text-xs text-slate-600 font-medium">{t.description}</p>
                  <div className="text-[11px] text-slate-500 flex items-center gap-1.5 pt-1">
                    <MessageSquareQuote className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                    <span>예시 문미: <strong className="text-slate-700">{t.example}</strong></span>
                  </div>
                </div>

                <div
                  className={`w-6 h-6 rounded-full border flex items-center justify-center shrink-0 mt-0.5 transition ${
                    isSelected
                      ? 'bg-indigo-600 border-indigo-600 text-white shadow-xs'
                      : 'border-slate-300 text-transparent'
                  }`}
                >
                  <Check className="w-3.5 h-3.5" strokeWidth={3} />
                </div>
              </div>
            );
          })}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 bg-white border-t border-slate-200 flex items-center justify-between">
          <span className="text-xs text-slate-500">
            {isLoading ? '새 어조로 실시간 재요약 생성 중...' : '클릭 즉시 모든 브리핑 카드에 적용됩니다.'}
          </span>
          <button
            onClick={onClose}
            className="px-5 py-2.5 rounded-xl text-xs font-bold bg-slate-100 text-slate-700 hover:bg-slate-200 hover:text-slate-900 transition cursor-pointer"
          >
            닫기
          </button>
        </div>
      </div>
    </div>
  );
};
