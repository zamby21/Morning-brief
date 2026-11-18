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
      id: 'insight',
      name: '인사이트 버전 (요약 2줄 + 시사점 1줄)',
      badge: '기본 설정 · 2+1',
      description: '핵심 사실 2줄을 먼저 요약하고, 마지막 3번째 줄에 [시사점] 1줄을 제시합니다.',
      example: '요약 2줄 + [시사점] 산업·시장·정책 파급 및 대응 포인트',
    },
    {
      id: 'formal',
      name: '격식 브리핑체',
      badge: '공식 보고 · 합쇼체',
      description: '임원·기관 공식 보고용으로 정제된 정중한 격식 문어체 3줄 요약입니다.',
      example: '‘~했습니다.’, ‘~되었습니다.’, ‘~전망입니다.’',
    },
    {
      id: 'bullet',
      name: '개조식 드라이톤',
      badge: '초압축 · 명사형',
      description: '접속어·서술어를 덜어내고 기호(▪)와 명사형 종결로 핵심만 빠르게 전달합니다.',
      example: '‘▪ 핵심 사안 발표 · ~추진 함 / ~확대 전망’',
    },
    {
      id: 'friendly',
      name: '친근한 설명체',
      badge: '쉬운 해설 · 해요체',
      description: '배경을 풀어서 설명하는 대화형 뉴스레터 어조로 부담 없이 읽힙니다.',
      example: '‘쉽게 정리하면, ~했어요. 여기에 더해 ~전망이에요.’',
    },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 dark:bg-black/75 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-3xl w-full max-w-2xl flex flex-col shadow-2xl overflow-hidden text-slate-800 dark:text-slate-100">
        {/* Header */}
        <div className="px-6 py-5 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between bg-slate-50/80 dark:bg-slate-950/70">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-indigo-100 dark:bg-indigo-950/70 text-indigo-700 dark:text-indigo-300">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
                요약본 어조(Tone) 개인화 설정
                <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-indigo-100 dark:bg-indigo-950/80 text-indigo-700 dark:text-indigo-300">
                  AI 재요약
                </span>
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                원하시는 스타일에 맞추어 AI가 3줄 요약 문장을 실시간으로 재구성합니다.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-slate-800 dark:hover:text-white hover:bg-slate-200 dark:hover:bg-slate-800 transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tone Options */}
        <div className="p-6 space-y-3 bg-slate-50/50 dark:bg-slate-950/40">
          {tones.map((t) => {
            const isSelected = currentTone === t.id;
            return (
              <div
                key={t.id}
                onClick={() => onSelectTone(t.id)}
                className={`p-4 rounded-2xl border transition-all cursor-pointer flex items-start justify-between gap-4 ${
                  isSelected
                    ? 'bg-white dark:bg-slate-800 border-indigo-500 shadow-sm ring-2 ring-indigo-500/20 dark:ring-indigo-500/40'
                    : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-600 hover:shadow-xs'
                }`}
              >
                <div className="space-y-1.5 flex-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-sm font-bold text-slate-900 dark:text-white">{t.name}</span>
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded ${
                      isSelected ? 'bg-indigo-100 dark:bg-indigo-950/80 text-indigo-800 dark:text-indigo-300' : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300'
                    }`}>
                      {t.badge}
                    </span>
                  </div>
                  <p className="text-xs text-slate-600 dark:text-slate-300 font-medium">{t.description}</p>
                  <div className="text-[11px] text-slate-500 dark:text-slate-400 flex items-center gap-1.5 pt-1">
                    <MessageSquareQuote className="w-3.5 h-3.5 text-slate-400 dark:text-slate-500 shrink-0" />
                    <span>예시 문미: <strong className="text-slate-700 dark:text-slate-200">{t.example}</strong></span>
                  </div>
                </div>

                <div
                  className={`w-6 h-6 rounded-full border flex items-center justify-center shrink-0 mt-0.5 transition ${
                    isSelected
                      ? 'bg-indigo-600 border-indigo-600 text-white shadow-xs'
                      : 'border-slate-300 dark:border-slate-600 text-transparent'
                  }`}
                >
                  <Check className="w-3.5 h-3.5" strokeWidth={3} />
                </div>
              </div>
            );
          })}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 bg-white dark:bg-slate-900 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between">
          <span className="text-xs text-slate-500 dark:text-slate-400">
            {isLoading ? '새 어조로 실시간 재요약 생성 중...' : '클릭 즉시 모든 브리핑 카드에 적용됩니다.'}
          </span>
          <button
            onClick={onClose}
            className="px-5 py-2.5 rounded-xl text-xs font-bold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 hover:bg-slate-200 dark:hover:bg-slate-700 hover:text-slate-900 dark:hover:text-white transition cursor-pointer"
          >
            닫기
          </button>
        </div>
      </div>
    </div>
  );
};
