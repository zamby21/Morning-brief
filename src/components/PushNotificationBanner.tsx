import React from 'react';
import { Bell, Smartphone, X, CheckCircle2 } from 'lucide-react';

interface PushNotificationBannerProps {
  isVisible: boolean;
  onClose: () => void;
  onEnablePush: () => void;
  isPushEnabled: boolean;
  pushMessage: string | null;
}

export const PushNotificationBanner: React.FC<PushNotificationBannerProps> = ({
  isVisible,
  onClose,
  onEnablePush,
  isPushEnabled,
  pushMessage,
}) => {
  if (pushMessage) {
    const isLocalRegionAlert = pushMessage.startsWith('[내 지역 뉴스 알림');
    return (
      <div className="fixed bottom-5 right-5 z-50 max-w-sm w-full bg-white dark:bg-slate-900 border border-purple-300 dark:border-purple-700 rounded-2xl p-4 shadow-xl animate-in slide-in-from-bottom-5 duration-300 text-slate-800 dark:text-slate-100">
        <div className="flex items-start gap-3">
          <div
            className={`p-2 rounded-xl text-white shrink-0 shadow-xs ${
              isLocalRegionAlert ? 'bg-amber-600' : 'bg-purple-600'
            }`}
          >
            <Bell className="w-5 h-5 animate-bounce" />
          </div>
          <div className="flex-1">
            <div className="flex items-center justify-between">
              <span
                className={`text-xs font-bold ${
                  isLocalRegionAlert
                    ? 'text-amber-700 dark:text-amber-300'
                    : 'text-purple-700 dark:text-purple-300'
                }`}
              >
                {isLocalRegionAlert
                  ? '[내 지역 뉴스 실시간 알림]'
                  : '[모닝브리프 AI 모바일 푸시 알림]'}
              </span>
              <button
                onClick={onClose}
                className="text-slate-400 hover:text-slate-700 dark:hover:text-white cursor-pointer"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
            <p className="text-xs font-semibold text-slate-900 dark:text-white mt-1 leading-snug">
              {pushMessage}
            </p>
            <div className="text-[10px] text-slate-500 dark:text-slate-400 mt-1.5 flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
              <span>
                {isLocalRegionAlert
                  ? '선택 지자체 주요 기사 실시간 감지됨'
                  : '오전 09:00 정각 알림 시스템 연동됨'}
              </span>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!isVisible || isPushEnabled) return null;

  return (
    <div className="bg-purple-50 dark:bg-purple-950/60 border-b border-purple-200 dark:border-purple-800/80 px-4 py-2 text-xs text-purple-900 dark:text-purple-100 transition-colors">
      <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <Bell className="w-4 h-4 text-purple-600 dark:text-purple-400 animate-pulse" />
          <span className="font-medium">
            모바일 기기에서 매일 오전 9시 뉴스 요약 푸시 알림을 바로 받아보시겠습니까?
          </span>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={onEnablePush}
            className="px-3 py-1 rounded-lg bg-purple-600 text-white text-[11px] font-bold hover:bg-purple-700 transition active:scale-95 shadow-xs cursor-pointer"
          >
            푸시 알림 켜기
          </button>
          <button
            onClick={onClose}
            className="text-purple-500 dark:text-purple-300 hover:text-purple-800 dark:hover:text-white p-1 cursor-pointer"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
};
