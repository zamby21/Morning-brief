import React, { useState } from 'react';
import {
  X,
  Share2,
  Copy,
  Check,
  Send,
  MessageCircle,
  Mail,
  CheckCircle2,
  ExternalLink,
} from 'lucide-react';
import { NewsStory } from '../types/news';

interface SocialShareModalProps {
  isOpen: boolean;
  onClose: () => void;
  story: NewsStory | null;
  onSendFriendEmail: (friendEmail: string, storyTitle: string) => void;
}

export const SocialShareModal: React.FC<SocialShareModalProps> = ({
  isOpen,
  onClose,
  story,
  onSendFriendEmail,
}) => {
  const [copied, setCopied] = useState(false);
  const [friendEmail, setFriendEmail] = useState('');
  const [emailSent, setEmailSent] = useState(false);

  if (!isOpen || !story) return null;

  const shareText = `[모닝브리프 AI 3줄 요약]
📰 ${story.outletName} | ${story.title}

${story.leadSummary.join('\n')}

🔗 원문 기사: ${story.originalUrl}
공유 출처: 모닝브리프 AI (대한민국 10대 언론사 뉴스 요약)`;

  const handleCopyText = async () => {
    try {
      await navigator.clipboard.writeText(shareText);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Clipboard copy error:', err);
    }
  };

  const handleNativeShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: `[모닝브리프] ${story.title}`,
          text: `${story.title}\n\n${story.leadSummary.join('\n')}`,
          url: story.originalUrl,
        });
      } catch (e) {
        console.log('Share dismissed', e);
      }
    } else {
      handleCopyText();
    }
  };

  const handleSendEmail = (e: React.FormEvent) => {
    e.preventDefault();
    if (!friendEmail) return;
    onSendFriendEmail(friendEmail, story.title);
    setEmailSent(true);
    setTimeout(() => {
      setEmailSent(false);
      setFriendEmail('');
      onClose();
    }, 1500);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="bg-white border border-slate-200 rounded-3xl w-full max-w-lg shadow-2xl overflow-hidden text-slate-800">
        {/* Header */}
        <div className="px-6 py-5 border-b border-slate-200 flex items-center justify-between bg-slate-50/80">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-blue-100 text-blue-700">
              <Share2 className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900">
                기사 3줄 요약 공유하기
              </h3>
              <p className="text-xs text-slate-500">
                동료나 지인에게 핵심 요약본을 신속하게 공유하세요.
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

        {/* Content */}
        <div className="p-6 space-y-5 bg-slate-50/50">
          {/* Preview Box */}
          <div className="bg-white border border-slate-200 rounded-2xl p-4 space-y-2 text-xs shadow-xs">
            <div className="flex items-center justify-between border-b border-slate-100 pb-2">
              <span className="font-bold text-slate-900 truncate">
                [{story.outletName}] {story.title}
              </span>
              <span className="text-[10px] bg-blue-50 text-blue-700 px-2 py-0.5 rounded font-bold shrink-0">
                3줄 요약
              </span>
            </div>
            <div className="text-slate-600 space-y-1 font-mono text-[11px] leading-relaxed">
              {story.leadSummary.slice(0, 3).map((l, i) => (
                <div key={i}>{l}</div>
              ))}
            </div>
          </div>

          {/* Quick Share Buttons */}
          <div className="grid grid-cols-2 gap-2.5">
            <button
              onClick={handleCopyText}
              className="py-3 px-4 rounded-xl bg-white hover:bg-slate-100 border border-slate-200 text-slate-700 font-bold text-xs flex items-center justify-center gap-2 transition active:scale-95 shadow-xs cursor-pointer"
            >
              {copied ? (
                <>
                  <Check className="w-4 h-4 text-emerald-600" />
                  <span className="text-emerald-700">복사 완료!</span>
                </>
              ) : (
                <>
                  <Copy className="w-4 h-4 text-slate-500" />
                  <span>텍스트 전체 복사</span>
                </>
              )}
            </button>

            <button
              onClick={handleNativeShare}
              className="py-3 px-4 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs flex items-center justify-center gap-2 transition active:scale-95 shadow-xs cursor-pointer"
            >
              <Share2 className="w-4 h-4" />
              <span>SNS / 메신저 공유</span>
            </button>
          </div>

          {/* Email to Colleague Form */}
          <form onSubmit={handleSendEmail} className="space-y-2 pt-2 border-t border-slate-200">
            <label className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
              <Mail className="w-3.5 h-3.5 text-blue-600" />
              <span>동료에게 이메일로 3줄 요약 전달하기</span>
            </label>
            <div className="flex gap-2">
              <input
                type="email"
                required
                value={friendEmail}
                onChange={(e) => setFriendEmail(e.target.value)}
                placeholder="colleague@company.com"
                className="flex-1 bg-white border border-slate-300 rounded-xl px-3.5 py-2 text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:border-blue-500 transition"
              />
              <button
                type="submit"
                className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-900 text-white font-bold text-xs flex items-center gap-1.5 transition active:scale-95 cursor-pointer shadow-xs"
              >
                <Send className="w-3 h-3" />
                <span>전송</span>
              </button>
            </div>
            {emailSent && (
              <p className="text-xs text-emerald-700 font-semibold flex items-center gap-1 mt-1">
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>성공적으로 전달되었습니다!</span>
              </p>
            )}
          </form>
        </div>
      </div>
    </div>
  );
};
