export interface SpeechBriefingItem {
  id: string;
  outletLabel: string;
  title: string;
  summaryLines: string[];
  aiInsight?: string;
}

export type SpeechPlaybackStatus = 'idle' | 'playing' | 'paused';
export type SpeechStage = 'header' | 'summary' | 'insight' | null;

export interface SectionSpeechState {
  activeSectionId: string | null;
  status: SpeechPlaybackStatus;
  currentItemIndex: number;
  currentItemId: string | null;
  currentOutletLabel: string | null;
  totalItems: number;
  rate: number;
  stage: SpeechStage;
  errorMessage: string | null;
}

interface SpeechChunk {
  itemIndex: number;
  itemId: string;
  outletLabel: string;
  stage: Exclude<SpeechStage, null>;
  text: string;
}

type Listener = () => void;

const RATE_CYCLE = [1.0, 1.2, 1.4, 0.9];

let state: SectionSpeechState = {
  activeSectionId: null,
  status: 'idle',
  currentItemIndex: -1,
  currentItemId: null,
  currentOutletLabel: null,
  totalItems: 0,
  rate: 1.0,
  stage: null,
  errorMessage: null,
};

let activeItems: SpeechBriefingItem[] = [];
let activeChunks: SpeechChunk[] = [];
let currentChunkIndex = 0;
let sessionCounter = 0;
const listeners = new Set<Listener>();

const emit = () => {
  listeners.forEach((fn) => fn());
};

const updateState = (partial: Partial<SectionSpeechState>) => {
  state = { ...state, ...partial };
  emit();
};

export const isWebSpeechSupported = (): boolean =>
  typeof window !== 'undefined' &&
  'speechSynthesis' in window &&
  typeof SpeechSynthesisUtterance !== 'undefined';

const cleanTextForSpeech = (raw: string): string =>
  (raw || '')
    .replace(/^[0-9]+[.)]\s*/, '')
    .replace(/^[▪•·\-–—■□▶▷]+\s*/, '')
    .replace(/\s+/g, ' ')
    .trim();

const cleanHeadlineForSpeech = (raw: string): string =>
  (raw || '')
    .replace(/^\[[^\]]+\]\s*/, '')
    .replace(/\s+/g, ' ')
    .trim();

const pickKoreanVoice = (): SpeechSynthesisVoice | null => {
  if (!isWebSpeechSupported()) return null;
  try {
    const voices = window.speechSynthesis.getVoices();
    if (!voices || voices.length === 0) return null;
    return (
      voices.find(
        (v) =>
          v.lang.toLowerCase() === 'ko-kr' &&
          /google|yuna|sora|heami|sunhi|seoyeon/i.test(v.name)
      ) ||
      voices.find((v) => v.lang.toLowerCase() === 'ko-kr') ||
      voices.find((v) => v.lang.toLowerCase().startsWith('ko')) ||
      null
    );
  } catch {
    return null;
  }
};

// Warm up voices early on Chromium browsers and stop audio on page unload
if (isWebSpeechSupported()) {
  try {
    window.speechSynthesis.getVoices();
    window.speechSynthesis.addEventListener?.('voiceschanged', () => {
      try {
        window.speechSynthesis.getVoices();
      } catch {
        // Ignore
      }
    });
    window.addEventListener('beforeunload', () => {
      try {
        window.speechSynthesis.cancel();
      } catch {
        // Ignore
      }
    });
  } catch {
    // Ignore
  }
}

const buildChunksForItems = (items: SpeechBriefingItem[]): SpeechChunk[] => {
  const chunks: SpeechChunk[] = [];

  items.forEach((item, idx) => {
    const outlet = cleanTextForSpeech(item.outletLabel) || '언론사';
    const title = cleanHeadlineForSpeech(item.title);
    const ordinalLabel = `${idx + 1}번째 기사.`;

    // 1. 언론사 + 기사제목
    chunks.push({
      itemIndex: idx,
      itemId: item.id,
      outletLabel: outlet,
      stage: 'header',
      text: `${ordinalLabel} ${outlet}. ${title}.`,
    });

    // 2. 요약내용 & 3. 시사점 분리
    const rawLines = Array.isArray(item.summaryLines) ? item.summaryLines : [];
    const summaryTexts: string[] = [];
    let insightText = '';

    for (const rawLine of rawLines) {
      const cleaned = cleanTextForSpeech(rawLine);
      if (!cleaned) continue;
      if (cleaned.startsWith('[시사점]')) {
        const body = cleaned.replace(/^\[시사점\]\s*/, '').trim();
        if (body) insightText = body;
      } else {
        summaryTexts.push(cleaned);
      }
    }

    if (!insightText && item.aiInsight) {
      const fallbackInsight = cleanTextForSpeech(item.aiInsight)
        .replace(/^\[시사점\]\s*/, '')
        .trim();
      if (fallbackInsight) insightText = fallbackInsight;
    }

    summaryTexts.forEach((line, lineIdx) => {
      chunks.push({
        itemIndex: idx,
        itemId: item.id,
        outletLabel: outlet,
        stage: 'summary',
        text: lineIdx === 0 ? `요약 내용. ${line}` : line,
      });
    });

    if (insightText) {
      chunks.push({
        itemIndex: idx,
        itemId: item.id,
        outletLabel: outlet,
        stage: 'insight',
        text: `시사점. ${insightText}`,
      });
    }
  });

  return chunks;
};

const speakChunkAt = (chunkIdx: number, sessionId: number) => {
  if (sessionId !== sessionCounter) return;
  if (!isWebSpeechSupported()) return;

  if (chunkIdx < 0 || chunkIdx >= activeChunks.length) {
    activeItems = [];
    activeChunks = [];
    currentChunkIndex = 0;
    updateState({
      activeSectionId: null,
      status: 'idle',
      currentItemIndex: -1,
      currentItemId: null,
      currentOutletLabel: null,
      totalItems: 0,
      stage: null,
      errorMessage: null,
    });
    return;
  }

  currentChunkIndex = chunkIdx;
  const chunk = activeChunks[chunkIdx];
  const utterance = new SpeechSynthesisUtterance(chunk.text);
  utterance.lang = 'ko-KR';
  utterance.rate = state.rate;
  utterance.pitch = 1;

  const koreanVoice = pickKoreanVoice();
  if (koreanVoice) {
    utterance.voice = koreanVoice;
  }

  utterance.onstart = () => {
    if (sessionId !== sessionCounter) return;
    updateState({
      status: 'playing',
      currentItemIndex: chunk.itemIndex,
      currentItemId: chunk.itemId,
      currentOutletLabel: chunk.outletLabel,
      stage: chunk.stage,
      errorMessage: null,
    });
  };

  utterance.onend = () => {
    if (sessionId !== sessionCounter) return;
    speakChunkAt(chunkIdx + 1, sessionId);
  };

  utterance.onerror = (event) => {
    if (sessionId !== sessionCounter) return;
    if (event.error === 'canceled' || event.error === 'interrupted') return;
    activeItems = [];
    activeChunks = [];
    currentChunkIndex = 0;
    updateState({
      activeSectionId: null,
      status: 'idle',
      currentItemIndex: -1,
      currentItemId: null,
      currentOutletLabel: null,
      totalItems: 0,
      stage: null,
      errorMessage: '음성 재생 중 오류가 발생했습니다.',
    });
  };

  updateState({
    status: 'playing',
    currentItemIndex: chunk.itemIndex,
    currentItemId: chunk.itemId,
    currentOutletLabel: chunk.outletLabel,
    stage: chunk.stage,
  });

  window.speechSynthesis.speak(utterance);
};

export const stopSectionSpeech = () => {
  sessionCounter += 1;
  activeItems = [];
  activeChunks = [];
  currentChunkIndex = 0;

  if (isWebSpeechSupported()) {
    try {
      window.speechSynthesis.cancel();
    } catch {
      // Ignore cancellation errors
    }
  }

  if (state.status !== 'idle' || state.activeSectionId !== null) {
    updateState({
      activeSectionId: null,
      status: 'idle',
      currentItemIndex: -1,
      currentItemId: null,
      currentOutletLabel: null,
      totalItems: 0,
      stage: null,
      errorMessage: null,
    });
  }
};

export const startSectionSpeech = (
  sectionId: string,
  items: SpeechBriefingItem[],
  startItemIndex = 0
): boolean => {
  if (!isWebSpeechSupported()) {
    updateState({ errorMessage: '이 브라우저에서는 음성 읽기 기능을 지원하지 않습니다.' });
    return false;
  }

  if (!items || items.length === 0) {
    return false;
  }

  const chunks = buildChunksForItems(items);
  if (chunks.length === 0) return false;

  const clampedItemIdx = Math.max(0, Math.min(items.length - 1, startItemIndex));
  const startChunkIdx = Math.max(
    0,
    chunks.findIndex((c) => c.itemIndex === clampedItemIdx)
  );

  const sessionId = ++sessionCounter;
  activeItems = items;
  activeChunks = chunks;
  currentChunkIndex = startChunkIdx;

  try {
    window.speechSynthesis.cancel();
  } catch {
    // Ignore cancel errors
  }

  const firstChunk = chunks[startChunkIdx];
  updateState({
    activeSectionId: sectionId,
    status: 'playing',
    currentItemIndex: firstChunk.itemIndex,
    currentItemId: firstChunk.itemId,
    currentOutletLabel: firstChunk.outletLabel,
    totalItems: items.length,
    stage: firstChunk.stage,
    errorMessage: null,
  });

  speakChunkAt(startChunkIdx, sessionId);
  return true;
};

export const togglePauseSectionSpeech = () => {
  if (!isWebSpeechSupported() || !state.activeSectionId) return;

  if (state.status === 'playing') {
    try {
      window.speechSynthesis.pause();
    } catch {
      // Ignore
    }
    updateState({ status: 'paused' });
    return;
  }

  if (state.status === 'paused') {
    try {
      if (window.speechSynthesis.paused) {
        window.speechSynthesis.resume();
        updateState({ status: 'playing' });
        return;
      }
    } catch {
      // Fallback: replay current chunk cleanly
    }
    const sessionId = ++sessionCounter;
    try {
      window.speechSynthesis.cancel();
    } catch {
      // Ignore
    }
    speakChunkAt(currentChunkIndex, sessionId);
  }
};

export const skipSectionSpeechItem = (delta: -1 | 1) => {
  if (!state.activeSectionId || activeItems.length === 0) return;
  const targetIdx = state.currentItemIndex + delta;
  if (targetIdx < 0 || targetIdx >= activeItems.length) {
    if (delta > 0) {
      stopSectionSpeech();
    }
    return;
  }
  const targetChunkIdx = activeChunks.findIndex((c) => c.itemIndex === targetIdx);
  if (targetChunkIdx === -1) return;

  const sessionId = ++sessionCounter;
  try {
    window.speechSynthesis.cancel();
  } catch {
    // Ignore
  }
  speakChunkAt(targetChunkIdx, sessionId);
};

export const cycleSectionSpeechRate = () => {
  const idx = RATE_CYCLE.indexOf(state.rate);
  const nextRate = RATE_CYCLE[(idx + 1) % RATE_CYCLE.length];
  updateState({ rate: nextRate });

  if (state.status === 'playing' && state.activeSectionId && activeChunks.length > 0) {
    const sessionId = ++sessionCounter;
    try {
      window.speechSynthesis.cancel();
    } catch {
      // Ignore
    }
    speakChunkAt(currentChunkIndex, sessionId);
  }
};

export const getSectionSpeechState = (): SectionSpeechState => state;

export const subscribeSectionSpeech = (listener: Listener): (() => void) => {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
};
