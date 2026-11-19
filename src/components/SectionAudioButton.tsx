import React, { useSyncExternalStore } from 'react';
import {
  Volume2,
  Pause,
  Play,
  Square,
  SkipBack,
  SkipForward,
} from 'lucide-react';
import {
  SpeechBriefingItem,
  getSectionSpeechState,
  subscribeSectionSpeech,
  startSectionSpeech,
  togglePauseSectionSpeech,
  stopSectionSpeech,
  skipSectionSpeechItem,
  cycleSectionSpeechRate,
  isWebSpeechSupported,
} from '../utils/sectionSpeechPlayer';

export type SectionAudioAccent = 'blue' | 'purple' | 'rose' | 'amber';

interface SectionAudioButtonProps {
  sectionId: string;
  sectionLabel: string;
  items: SpeechBriefingItem[];
  accent?: SectionAudioAccent;
}

const ACCENT_STYLES: Record<
  SectionAudioAccent,
  {
    idleBtn: string;
    activeContainer: string;
    primaryBtn: string;
    counterText: string;
  }
> = {
  blue: {
    idleBtn:
      'bg-white dark:bg-slate-800 hover:bg-blue-50 dark:hover:bg-blue-950/70 text-blue-700 dark:text-blue-300 border-blue-200 dark:border-blue-800',
    activeContainer:
      'bg-blue-50/90 dark:bg-blue-950/60 border-blue-300 dark:border-blue-700',
    primaryBtn: 'bg-blue-600 hover:bg-blue-700 text-white',
    counterText: 'text-blue-700 dark:text-blue-300',
  },
  purple: {
    idleBtn:
      'bg-white dark:bg-slate-800 hover:bg-purple-50 dark:hover:bg-purple-950/70 text-purple-700 dark:text-purple-300 border-purple-200 dark:border-purple-800',
    activeContainer:
      'bg-purple-50/90 dark:bg-purple-950/60 border-purple-300 dark:border-purple-700',
    primaryBtn: 'bg-purple-600 hover:bg-purple-700 text-white',
    counterText: 'text-purple-700 dark:text-purple-300',
  },
  rose: {
    idleBtn:
      'bg-white dark:bg-slate-800 hover:bg-rose-50 dark:hover:bg-rose-950/70 text-rose-700 dark:text-rose-300 border-rose-200 dark:border-rose-800',
    activeContainer:
      'bg-rose-50/90 dark:bg-rose-950/60 border-rose-300 dark:border-rose-700',
    primaryBtn: 'bg-rose-600 hover:bg-rose-700 text-white',
    counterText: 'text-rose-700 dark:text-rose-300',
  },
  amber: {
    idleBtn:
      'bg-white dark:bg-slate-800 hover:bg-amber-50 dark:hover:bg-amber-950/70 text-amber-800 dark:text-amber-300 border-amber-200 dark:border-amber-800',
    activeContainer:
      'bg-amber-50/90 dark:bg-amber-950/60 border-amber-300 dark:border-amber-700',
    primaryBtn: 'bg-amber-600 hover:bg-amber-700 text-white',
    counterText: 'text-amber-800 dark:text-amber-300',
  },
};

export const useActiveSectionSpeechItemId = (sectionId: string): string | null => {
  const speech = useSyncExternalStore(
    subscribeSectionSpeech,
    getSectionSpeechState,
    getSectionSpeechState
  );
  if (speech.activeSectionId !== sectionId || speech.status === 'idle') {
    return null;
  }
  return speech.currentItemId;
};

export const SectionAudioButton: React.FC<SectionAudioButtonProps> = ({
  sectionId,
  sectionLabel,
  items,
  accent = 'blue',
}) => {
  const speech = useSyncExternalStore(
    subscribeSectionSpeech,
    getSectionSpeechState,
    getSectionSpeechState
  );

  const isThisSectionActive =
    speech.activeSectionId === sectionId && speech.status !== 'idle';
  const supported = isWebSpeechSupported();
  const styles = ACCENT_STYLES[accent];
  const disabled = !supported || items.length === 0;

  if (!isThisSectionActive) {
    return (
      <button
        type="button"
        disabled={disabled}
        onClick={() => startSectionSpeech(sectionId, items, 0)}
        aria-label={`${sectionLabel} 요약 음성으로 듣기 (${items.length}건)`}
        title={
          !supported
            ? '현재 브라우저에서는 음성 읽기(Web Speech API)를 지원하지 않습니다.'
            : items.length === 0
            ? '읽을 기사가 없습니다.'
            : `${sectionLabel} ${items.length}건의 언론사·기사제목·요약내용·시사점을 순서대로 음성으로 듣기`
        }
        className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold border shadow-2xs transition active:scale-95 whitespace-nowrap shrink-0 ${
          disabled
            ? 'opacity-45 cursor-not-allowed bg-slate-100 dark:bg-slate-800 text-slate-400 dark:text-slate-500 border-slate-200 dark:border-slate-700'
            : `cursor-pointer ${styles.idleBtn}`
        }`}
      >
        <Volume2 className="w-3.5 h-3.5 shrink-0" aria-hidden="true" />
        <span>음성 듣기</span>
      </button>
    );
  }

  const stageLabel =
    speech.stage === 'header'
      ? '제목'
      : speech.stage === 'summary'
      ? '요약'
      : speech.stage === 'insight'
      ? '시사점'
      : '';

  return (
    <div
      role="region"
      aria-label={`${sectionLabel} 음성 브리핑 제어`}
      className={`inline-flex items-center gap-1 p-1 rounded-xl border shadow-2xs transition-colors shrink-0 ${styles.activeContainer}`}
    >
      <button
        type="button"
        onClick={togglePauseSectionSpeech}
        aria-label={speech.status === 'playing' ? '음성 브리핑 일시정지' : '음성 브리핑 이어듣기'}
        className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-[11px] font-bold transition active:scale-95 cursor-pointer whitespace-nowrap shrink-0 ${styles.primaryBtn}`}
      >
        {speech.status === 'playing' ? (
          <>
            <Pause className="w-3 h-3 shrink-0" aria-hidden="true" />
            <span>일시정지</span>
          </>
        ) : (
          <>
            <Play className="w-3 h-3 shrink-0" aria-hidden="true" />
            <span>이어듣기</span>
          </>
        )}
      </button>

      <div className="flex items-center gap-1 px-1.5 text-[11px] whitespace-nowrap">
        <span className={`font-mono tabular-nums font-extrabold ${styles.counterText}`}>
          {speech.currentItemIndex + 1}/{speech.totalItems}
        </span>
        {stageLabel && (
          <span className="text-slate-500 dark:text-slate-400 font-medium hidden sm:inline">
            · {stageLabel}
          </span>
        )}
      </div>

      <button
        type="button"
        disabled={speech.currentItemIndex <= 0}
        onClick={() => skipSectionSpeechItem(-1)}
        aria-label="이전 기사로 이동"
        title="이전 기사"
        className="p-1 rounded-lg text-slate-600 dark:text-slate-300 hover:bg-white/80 dark:hover:bg-slate-800 disabled:opacity-35 disabled:cursor-not-allowed transition cursor-pointer"
      >
        <SkipBack className="w-3.5 h-3.5" aria-hidden="true" />
      </button>

      <button
        type="button"
        disabled={speech.currentItemIndex >= speech.totalItems - 1}
        onClick={() => skipSectionSpeechItem(1)}
        aria-label="다음 기사로 이동"
        title="다음 기사"
        className="p-1 rounded-lg text-slate-600 dark:text-slate-300 hover:bg-white/80 dark:hover:bg-slate-800 disabled:opacity-35 disabled:cursor-not-allowed transition cursor-pointer"
      >
        <SkipForward className="w-3.5 h-3.5" aria-hidden="true" />
      </button>

      <button
        type="button"
        onClick={cycleSectionSpeechRate}
        aria-label={`읽기 속도 ${speech.rate.toFixed(1)}배속`}
        title="읽기 속도 조절 (0.9x ~ 1.4x)"
        className="px-1.5 py-1 rounded-lg text-[11px] font-mono tabular-nums font-bold text-slate-700 dark:text-slate-200 hover:bg-white/80 dark:hover:bg-slate-800 transition cursor-pointer whitespace-nowrap"
      >
        {speech.rate.toFixed(1)}x
      </button>

      <button
        type="button"
        onClick={stopSectionSpeech}
        aria-label="음성 브리핑 정지"
        title="정지"
        className="p-1 rounded-lg text-slate-500 dark:text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 hover:bg-white/80 dark:hover:bg-slate-800 transition cursor-pointer"
      >
        <Square className="w-3 h-3 fill-current" aria-hidden="true" />
      </button>
    </div>
  );
};
