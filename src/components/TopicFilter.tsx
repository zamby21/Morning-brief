import React from 'react';
import { Filter } from 'lucide-react';
import { AVAILABLE_TOPICS } from '../data/mockNewsData';

interface TopicFilterProps {
  selectedTopic: string;
  onSelectTopic: (topic: string) => void;
  subscribedTopics: string[];
  onToggleSubscribedTopic: (topic: string) => void;
}

export const TopicFilter: React.FC<TopicFilterProps> = ({
  selectedTopic,
  onSelectTopic,
  subscribedTopics,
  onToggleSubscribedTopic,
}) => {
  return (
    <div className="bg-white border border-slate-200/90 rounded-2xl p-3.5 sm:p-4 shadow-xs">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 mb-2.5">
        <div className="flex items-center gap-2">
          <Filter className="w-3.5 h-3.5 text-cyan-600" />
          <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
            관심 주제 구독 & 뷰 필터
          </h4>
          <span className="text-[11px] text-slate-500">
            (구독 주제 {subscribedTopics.length}개)
          </span>
        </div>
        <p className="text-[11px] text-slate-500">
          태그를 클릭하면 즉시 해당 주제 기사만 필터링됩니다.
        </p>
      </div>

      <div className="flex flex-wrap items-center gap-1.5">
        {AVAILABLE_TOPICS.map((topic) => {
          const isCurrentActive = selectedTopic === topic;
          const isSubscribed = subscribedTopics.includes(topic);

          return (
            <div key={topic} className="flex items-center">
              <button
                onClick={() => onSelectTopic(topic)}
                className={`text-xs px-2.5 py-1.5 rounded-xl font-medium transition flex items-center gap-1.5 cursor-pointer ${
                  isCurrentActive
                    ? 'bg-cyan-600 text-white shadow-xs font-bold ring-2 ring-cyan-300'
                    : isSubscribed
                    ? 'bg-cyan-50 text-cyan-800 border border-cyan-200 hover:bg-cyan-100'
                    : 'bg-slate-100 text-slate-600 hover:text-slate-900 hover:bg-slate-200/80 border border-slate-200/60'
                }`}
              >
                <span>{topic}</span>
                {isSubscribed && topic !== '전체' && (
                  <span
                    title="구독 중인 관심사"
                    className="w-1.5 h-1.5 rounded-full bg-cyan-500"
                  ></span>
                )}
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
};
