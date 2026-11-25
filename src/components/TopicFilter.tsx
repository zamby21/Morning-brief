import React, { useEffect, useState } from 'react';
import {
  Check,
  Filter,
  Plus,
  RotateCcw,
  Save,
  SlidersHorizontal,
  Star,
  X,
} from 'lucide-react';
import {
  AVAILABLE_TOPICS,
  INITIAL_USER_PREFERENCES,
  RECOMMENDED_CUSTOM_TOPICS,
} from '../data/pressMetadata';

export const SUBSCRIBED_ONLY_TOPIC = '__SUBSCRIBED__';

interface TopicFilterProps {
  selectedTopic: string;
  onSelectTopic: (topic: string) => void;
  topics?: string[];
  subscribedTopics: string[];
  onSavePersonalization: (
    nextTopics: string[],
    nextSubscribed: string[],
    silent?: boolean
  ) => void;
  onResetPersonalization: () => void;
}

const DEFAULT_EDITABLE_TOPICS = AVAILABLE_TOPICS.filter((t) => t !== '전체');

export const TopicFilter: React.FC<TopicFilterProps> = ({
  selectedTopic,
  onSelectTopic,
  topics,
  subscribedTopics,
  onSavePersonalization,
  onResetPersonalization,
}) => {
  const activeTopicList = Array.isArray(topics) ? topics : DEFAULT_EDITABLE_TOPICS;

  const [isEditing, setIsEditing] = useState(false);
  const [draftTopics, setDraftTopics] = useState<string[]>(activeTopicList);
  const [draftSubscribed, setDraftSubscribed] = useState<string[]>(subscribedTopics);
  const [newTopicInput, setNewTopicInput] = useState('');
  const [saveSuccess, setSaveSuccess] = useState(false);

  useEffect(() => {
    setDraftTopics(activeTopicList);
    setDraftSubscribed(subscribedTopics);
  }, [activeTopicList, subscribedTopics]);

  const normalizeAndCommit = (
    nextRawTopics: string[],
    nextRawSubscribed: string[],
    silent = false
  ) => {
    const cleanedTopics = Array.from(
      new Set(nextRawTopics.map((t) => t.trim()).filter((t) => t && t !== '전체'))
    );
    const cleanedSubscribed = Array.from(
      new Set(nextRawSubscribed.filter((t) => cleanedTopics.includes(t)))
    );

    setDraftTopics(cleanedTopics);
    setDraftSubscribed(cleanedSubscribed);
    onSavePersonalization(cleanedTopics, cleanedSubscribed, silent);

    if (
      selectedTopic !== '전체' &&
      selectedTopic !== SUBSCRIBED_ONLY_TOPIC &&
      !cleanedTopics.includes(selectedTopic)
    ) {
      onSelectTopic('전체');
    }
  };

  const handleOpenEdit = () => {
    if (!isEditing) {
      setDraftTopics(activeTopicList);
      setDraftSubscribed(subscribedTopics);
      setNewTopicInput('');
      setSaveSuccess(false);
    }
    setIsEditing((prev) => !prev);
  };

  const handleAddTopic = (rawValue: string) => {
    const clean = rawValue.trim().replace(/^#/, '');
    if (!clean || clean === '전체' || clean === SUBSCRIBED_ONLY_TOPIC) return;

    const nextTopics = draftTopics.includes(clean)
      ? draftTopics
      : [...draftTopics, clean];
    const nextSubscribed = draftSubscribed.includes(clean)
      ? draftSubscribed
      : [...draftSubscribed, clean];

    setNewTopicInput('');
    setSaveSuccess(false);
    normalizeAndCommit(nextTopics, nextSubscribed, true);
  };

  const handleDeleteTopic = (topicToDelete: string) => {
    const nextTopics = draftTopics.filter((t) => t !== topicToDelete);
    const nextSubscribed = draftSubscribed.filter((t) => t !== topicToDelete);
    setSaveSuccess(false);
    normalizeAndCommit(nextTopics, nextSubscribed, true);
  };

  const handleToggleDraftSubscribe = (topic: string) => {
    const nextSubscribed = draftSubscribed.includes(topic)
      ? draftSubscribed.filter((t) => t !== topic)
      : [...draftSubscribed, topic];
    setSaveSuccess(false);
    normalizeAndCommit(draftTopics, nextSubscribed, true);
  };

  const handleSave = () => {
    const pendingClean = newTopicInput.trim().replace(/^#/, '');
    let nextTopics = [...draftTopics];
    let nextSubscribed = [...draftSubscribed];

    if (
      pendingClean &&
      pendingClean !== '전체' &&
      pendingClean !== SUBSCRIBED_ONLY_TOPIC
    ) {
      if (!nextTopics.includes(pendingClean)) {
        nextTopics = [...nextTopics, pendingClean];
      }
      if (!nextSubscribed.includes(pendingClean)) {
        nextSubscribed = [...nextSubscribed, pendingClean];
      }
      setNewTopicInput('');
    }

    normalizeAndCommit(nextTopics, nextSubscribed, false);
    setSaveSuccess(true);
    setTimeout(() => setSaveSuccess(false), 2400);
  };

  const handleReset = () => {
    onResetPersonalization();
    setDraftTopics(DEFAULT_EDITABLE_TOPICS);
    setDraftSubscribed(INITIAL_USER_PREFERENCES.subscribedTopics);
    setNewTopicInput('');
    setSaveSuccess(true);
    setTimeout(() => setSaveSuccess(false), 2400);
  };

  const availableRecommendations = RECOMMENDED_CUSTOM_TOPICS.filter(
    (rec) => !draftTopics.includes(rec)
  );

  return (
    <div className="bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 rounded-2xl p-3.5 sm:p-4 shadow-xs transition-colors space-y-3">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex flex-wrap items-center gap-2 min-w-0">
          <Filter className="w-3.5 h-3.5 text-cyan-600 dark:text-cyan-400 shrink-0" aria-hidden="true" />
          <h4 className="text-xs font-bold text-slate-800 dark:text-slate-100 tracking-tight whitespace-nowrap">
            관심 주제 구독 &amp; 뷰 필터
          </h4>
          <span className="text-[11px] font-mono tabular-nums text-slate-500 dark:text-slate-400 whitespace-nowrap">
            구독 {subscribedTopics.length}개 · 전체 {activeTopicList.length}개
          </span>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <p className="hidden md:block text-[11px] text-slate-500 dark:text-slate-400">
            주제를 클릭하면 즉시 필터링되며, 다시 클릭하면 전체로 돌아갑니다.
          </p>
          <button
            type="button"
            onClick={handleOpenEdit}
            aria-expanded={isEditing}
            className={`inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl text-xs font-bold border transition cursor-pointer whitespace-nowrap shrink-0 ${
              isEditing
                ? 'bg-cyan-700 dark:bg-cyan-600 text-white border-cyan-700 dark:border-cyan-500 shadow-2xs'
                : 'bg-slate-50 dark:bg-slate-800 hover:bg-cyan-50 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 border-slate-200 dark:border-slate-700'
            }`}
          >
            <SlidersHorizontal className="w-3.5 h-3.5" aria-hidden="true" />
            <span>{isEditing ? '편집 닫기' : '개인화 설정'}</span>
          </button>
        </div>
      </div>

      {/* Main Interactive Topic Filter Buttons */}
      <div className="flex flex-wrap items-center gap-1.5">
        <button
          type="button"
          onClick={() => onSelectTopic('전체')}
          aria-pressed={selectedTopic === '전체'}
          className={`text-xs px-3 py-1.5 rounded-xl font-semibold transition cursor-pointer whitespace-nowrap shrink-0 ${
            selectedTopic === '전체'
              ? 'bg-cyan-700 dark:bg-cyan-600 text-white shadow-xs font-bold'
              : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200/80 dark:hover:bg-slate-700 border border-slate-200/80 dark:border-slate-700'
          }`}
        >
          전체
        </button>

        {subscribedTopics.length > 0 && (
          <button
            type="button"
            onClick={() =>
              onSelectTopic(
                selectedTopic === SUBSCRIBED_ONLY_TOPIC ? '전체' : SUBSCRIBED_ONLY_TOPIC
              )
            }
            aria-pressed={selectedTopic === SUBSCRIBED_ONLY_TOPIC}
            className={`text-xs px-2.5 py-1.5 rounded-xl font-semibold transition inline-flex items-center gap-1 cursor-pointer whitespace-nowrap shrink-0 ${
              selectedTopic === SUBSCRIBED_ONLY_TOPIC
                ? 'bg-amber-600 text-white shadow-xs font-bold'
                : 'bg-amber-50 dark:bg-amber-950/60 text-amber-900 dark:text-amber-200 border border-amber-300/80 dark:border-amber-700/80 hover:bg-amber-100 dark:hover:bg-amber-900/60'
            }`}
            title="내가 구독한 모든 관심 주제 기사만 모아보기"
          >
            <Star
              className={`w-3 h-3 shrink-0 ${
                selectedTopic === SUBSCRIBED_ONLY_TOPIC
                  ? 'fill-white text-white'
                  : 'fill-amber-500 text-amber-500'
              }`}
              aria-hidden="true"
            />
            <span>구독 주제만</span>
            <span className="font-mono tabular-nums text-[10px] opacity-90">
              {subscribedTopics.length}
            </span>
          </button>
        )}

        {activeTopicList.map((topic) => {
          const isCurrentActive = selectedTopic === topic;
          const isSubscribed = subscribedTopics.includes(topic);

          return (
            <button
              key={topic}
              type="button"
              onClick={() => onSelectTopic(isCurrentActive ? '전체' : topic)}
              aria-pressed={isCurrentActive}
              className={`text-xs px-2.5 py-1.5 rounded-xl font-medium transition inline-flex items-center gap-1.5 cursor-pointer whitespace-nowrap shrink-0 ${
                isCurrentActive
                  ? 'bg-cyan-600 text-white shadow-xs font-bold ring-2 ring-cyan-300 dark:ring-cyan-500/40'
                  : isSubscribed
                  ? 'bg-cyan-50 dark:bg-cyan-950/60 text-cyan-800 dark:text-cyan-200 border border-cyan-200 dark:border-cyan-800 hover:bg-cyan-100 dark:hover:bg-cyan-900/60'
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-200/80 dark:hover:bg-slate-700 border border-slate-200/60 dark:border-slate-700'
              }`}
            >
              <span>{topic}</span>
              {isSubscribed && (
                <Check
                  className={`w-3 h-3 shrink-0 ${
                    isCurrentActive ? 'text-white' : 'text-cyan-600 dark:text-cyan-400'
                  }`}
                  aria-label="구독 중"
                />
              )}
            </button>
          );
        })}
      </div>

      {/* Inline Personalization Management Panel */}
      {isEditing && (
        <div className="pt-3 border-t border-slate-200/80 dark:border-slate-800 space-y-3 bg-slate-50/75 dark:bg-slate-950/45 rounded-xl p-3 sm:p-3.5">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div>
              <h5 className="text-xs font-bold text-slate-900 dark:text-slate-100">
                내 관심 주제 필터 개인화 (추가 · 구독 체크 · 삭제 · 저장)
              </h5>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                추가·삭제한 관심 주제와 구독 설정은 브라우저 로컬 스토리지에 자동 저장되며, [저장하기]로 확정 알림을 받을 수 있습니다.
              </p>
            </div>

            <div className="flex items-center gap-1.5 shrink-0">
              <button
                type="button"
                onClick={handleReset}
                className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-[11px] font-semibold bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-700 transition cursor-pointer whitespace-nowrap"
              >
                <RotateCcw className="w-3 h-3" aria-hidden="true" />
                <span>기본값 복원</span>
              </button>
              <button
                type="button"
                onClick={handleSave}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold bg-cyan-700 hover:bg-cyan-800 dark:bg-cyan-600 dark:hover:bg-cyan-500 text-white transition cursor-pointer shadow-xs whitespace-nowrap"
              >
                {saveSuccess ? (
                  <>
                    <Check className="w-3.5 h-3.5" aria-hidden="true" />
                    <span>저장됨</span>
                  </>
                ) : (
                  <>
                    <Save className="w-3.5 h-3.5" aria-hidden="true" />
                    <span>저장하기</span>
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Add Custom Topic Form */}
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleAddTopic(newTopicInput);
            }}
            className="flex items-center gap-2 max-w-lg"
          >
            <input
              type="text"
              value={newTopicInput}
              onChange={(e) => setNewTopicInput(e.target.value)}
              placeholder="새 관심 주제 입력 (예: K방산, 바이오·헬스케어, 삼성전자)"
              aria-label="새 관심 주제 입력"
              maxLength={24}
              className="flex-1 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl px-3 py-1.5 text-xs text-slate-900 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:border-cyan-500 transition"
            />
            <button
              type="submit"
              disabled={!newTopicInput.trim()}
              className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl bg-cyan-600 hover:bg-cyan-700 disabled:opacity-50 text-white text-xs font-bold transition cursor-pointer whitespace-nowrap shrink-0"
            >
              <Plus className="w-3.5 h-3.5" aria-hidden="true" />
              <span>주제 추가</span>
            </button>
          </form>

          {/* Editable Topic List (Toggle subscription or Delete) */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between text-[11px] font-semibold text-slate-600 dark:text-slate-300">
              <span>등록된 주제 목록 (클릭: 구독 ON/OFF · X: 삭제)</span>
              <span className="font-mono tabular-nums text-slate-500 dark:text-slate-400">
                {draftTopics.length}개 중 {draftSubscribed.length}개 구독
              </span>
            </div>

            {draftTopics.length === 0 ? (
              <p className="text-xs text-slate-500 dark:text-slate-400 py-2">
                등록된 주제가 없습니다. 위 입력창이나 추천 주제를 눌러 추가해 주세요.
              </p>
            ) : (
              <div className="flex flex-wrap items-center gap-1.5">
                {draftTopics.map((topic) => {
                  const isSub = draftSubscribed.includes(topic);
                  return (
                    <div
                      key={topic}
                      className={`inline-flex items-center rounded-xl border text-xs transition ${
                        isSub
                          ? 'bg-cyan-50 dark:bg-cyan-950/70 border-cyan-300 dark:border-cyan-700 text-cyan-900 dark:text-cyan-100'
                          : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300'
                      }`}
                    >
                      <button
                        type="button"
                        onClick={() => handleToggleDraftSubscribe(topic)}
                        aria-pressed={isSub}
                        title={isSub ? `${topic} 구독 해제` : `${topic} 구독 설정`}
                        className="inline-flex items-center gap-1.5 pl-2.5 pr-1.5 py-1.5 font-semibold cursor-pointer whitespace-nowrap"
                      >
                        <Check
                          className={`w-3 h-3 shrink-0 ${
                            isSub
                              ? 'text-cyan-700 dark:text-cyan-300 opacity-100'
                              : 'text-slate-400 opacity-35'
                          }`}
                          aria-hidden="true"
                        />
                        <span>{topic}</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDeleteTopic(topic)}
                        title={`${topic} 삭제`}
                        aria-label={`${topic} 주제 삭제`}
                        className="pr-2 pl-1 py-1.5 text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 cursor-pointer transition"
                      >
                        <X className="w-3.5 h-3.5" aria-hidden="true" />
                      </button>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Recommended Quick-Add Topics */}
          {availableRecommendations.length > 0 && (
            <div className="space-y-1.5 pt-2 border-t border-slate-200/70 dark:border-slate-800">
              <span className="block text-[11px] font-semibold text-slate-500 dark:text-slate-400">
                추천 관심 주제 빠른 추가:
              </span>
              <div className="flex flex-wrap items-center gap-1.5">
                {availableRecommendations.map((rec) => (
                  <button
                    key={rec}
                    type="button"
                    onClick={() => handleAddTopic(rec)}
                    className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-[11px] font-semibold bg-white dark:bg-slate-800 hover:bg-cyan-50 dark:hover:bg-cyan-950/60 text-slate-700 dark:text-slate-200 border border-dashed border-slate-300 dark:border-slate-700 hover:border-cyan-400 dark:hover:border-cyan-600 transition cursor-pointer whitespace-nowrap"
                  >
                    <Plus className="w-3 h-3 text-cyan-600 dark:text-cyan-400" aria-hidden="true" />
                    <span>{rec}</span>
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
