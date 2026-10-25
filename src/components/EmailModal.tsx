import React, { useState } from 'react';
import {
  X,
  Mail,
  Send,
  Eye,
  CheckCircle2,
  Clock,
  History,
  Sparkles,
  ExternalLink,
} from 'lucide-react';
import { DailyBriefing, EmailDispatchLog } from '../types/news';

interface EmailModalProps {
  isOpen: boolean;
  onClose: () => void;
  briefing: DailyBriefing;
  recipientEmail: string;
  deliveryTime: string;
  emailLogs: EmailDispatchLog[];
  onSendEmail: (email: string) => Promise<string>;
}

export const EmailModal: React.FC<EmailModalProps> = ({
  isOpen,
  onClose,
  briefing,
  recipientEmail,
  deliveryTime,
  emailLogs,
  onSendEmail,
}) => {
  const [emailInput, setEmailInput] = useState(recipientEmail);
  const [activeTab, setActiveTab] = useState<'send' | 'preview' | 'logs'>('send');
  const [isSending, setIsSending] = useState(false);
  const [sendResultMsg, setSendResultMsg] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSend = async () => {
    if (!emailInput) return;
    setIsSending(true);
    setSendResultMsg(null);
    try {
      const msg = await onSendEmail(emailInput);
      setSendResultMsg(msg || `${emailInput} 주소로 발송 완료되었습니다.`);
    } catch (err: any) {
      setSendResultMsg('발송 처리 중 오류가 발생했습니다.');
    } finally {
      setIsSending(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="bg-white border border-slate-200 rounded-3xl w-full max-w-3xl max-h-[92vh] flex flex-col shadow-2xl overflow-hidden text-slate-800">
        {/* Header */}
        <div className="px-6 py-5 border-b border-slate-200 flex items-center justify-between bg-slate-50/80">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-blue-100 text-blue-700">
              <Mail className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                모닝브리프 이메일 자동 발송 센터
              </h3>
              <p className="text-xs text-slate-500">
                매일 오전 {deliveryTime} 정각 자동 발송 관리 및 즉시 발송 테스트
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

        {/* Tab Navigation */}
        <div className="px-6 pt-3 pb-2 bg-slate-50 border-b border-slate-200 flex items-center gap-2 text-xs">
          <button
            onClick={() => setActiveTab('send')}
            className={`px-3 py-1.5 rounded-xl font-bold transition flex items-center gap-1.5 cursor-pointer ${
              activeTab === 'send'
                ? 'bg-blue-600 text-white shadow-xs'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/80'
            }`}
          >
            <Send className="w-3.5 h-3.5" />
            <span>즉시 발송</span>
          </button>
          <button
            onClick={() => setActiveTab('preview')}
            className={`px-3 py-1.5 rounded-xl font-bold transition flex items-center gap-1.5 cursor-pointer ${
              activeTab === 'preview'
                ? 'bg-blue-600 text-white shadow-xs'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/80'
            }`}
          >
            <Eye className="w-3.5 h-3.5" />
            <span>뉴스레터 템플릿 미리보기</span>
          </button>
          <button
            onClick={() => setActiveTab('logs')}
            className={`px-3 py-1.5 rounded-xl font-bold transition flex items-center gap-1.5 cursor-pointer ${
              activeTab === 'logs'
                ? 'bg-blue-600 text-white shadow-xs'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/80'
            }`}
          >
            <History className="w-3.5 h-3.5" />
            <span>발송 이력 ({emailLogs.length})</span>
          </button>
        </div>

        {/* Body Container */}
        <div className="p-6 overflow-y-auto space-y-5 text-slate-800 bg-slate-50/50">
          {activeTab === 'send' && (
            <div className="space-y-4">
              <div className="bg-white border border-slate-200 rounded-2xl p-5 space-y-4 shadow-xs">
                <div>
                  <h4 className="text-sm font-bold text-slate-900">
                    발송 대상 이메일 주소
                  </h4>
                  <p className="text-xs text-slate-500 mt-0.5">
                    해당 이메일로 오늘 아침의 10대 언론사 1면 및 공통이슈 3줄 요약 뉴스레터가 전송됩니다.
                  </p>
                </div>

                <div className="flex flex-col sm:flex-row gap-2">
                  <input
                    type="email"
                    value={emailInput}
                    onChange={(e) => setEmailInput(e.target.value)}
                    placeholder="name@example.com"
                    className="flex-1 bg-slate-50 border border-slate-300 rounded-xl px-4 py-2.5 text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:border-blue-500 focus:bg-white transition"
                  />
                  <button
                    onClick={handleSend}
                    disabled={isSending || !emailInput}
                    className="px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white font-bold text-xs flex items-center justify-center gap-1.5 transition active:scale-95 shadow-xs cursor-pointer"
                  >
                    <Send className={`w-3.5 h-3.5 ${isSending ? 'animate-bounce' : ''}`} />
                    <span>{isSending ? '전송 중...' : '지금 바로 발송하기'}</span>
                  </button>
                </div>

                {sendResultMsg && (
                  <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-xs text-emerald-800 flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                    <span>{sendResultMsg}</span>
                  </div>
                )}
              </div>

              {/* Automatic Dispatch Schedule info */}
              <div className="bg-gradient-to-r from-blue-50 via-indigo-50/60 to-slate-50 border border-blue-200 rounded-2xl p-4 flex items-start gap-3">
                <Clock className="w-5 h-5 text-blue-600 shrink-0 mt-0.5" />
                <div className="text-xs space-y-1">
                  <div className="font-bold text-slate-900">
                    매일 오전 {deliveryTime} 정각 자동 발송 예약 중
                  </div>
                  <p className="text-slate-600">
                    현재 시스템은 매일 아침 조간 신문 1면 보도가 집계되는 즉시 지정된 주소로 뉴스레터를 자동 인쇄 및 발송 처리합니다. 발송 시간 변경은 ‘수신 대시보드’ 메뉴에서 가능합니다.
                  </p>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'preview' && (
            <div className="bg-white border border-slate-200 rounded-2xl p-5 space-y-4 shadow-xs">
              <div className="border-b border-slate-100 pb-3">
                <div className="text-xs text-slate-400">발송 제목:</div>
                <div className="text-sm font-bold text-slate-900 mt-0.5">
                  [모닝브리프] {briefing.briefingDate} 대한민국 주요 언론사 1면 및 공통이슈 3줄 요약
                </div>
              </div>

              {/* Newsletter Preview Card */}
              <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 space-y-3 text-xs text-slate-700">
                <div className="border-b border-slate-200 pb-2 flex items-center justify-between">
                  <span className="font-bold text-blue-700">모닝브리프 AI 09:00 데일리</span>
                  <span className="text-[11px] text-slate-500">{briefing.briefingDate}</span>
                </div>
                <p className="font-semibold text-slate-800 leading-relaxed">
                  {briefing.summaryNote}
                </p>

                <div className="pt-2 space-y-2">
                  <div className="font-bold text-slate-800">
                    ■ 주요 신문 1면 톱 보도 (미리보기):
                  </div>
                  {briefing.frontPageStories.slice(0, 3).map((s, idx) => (
                    <div key={idx} className="bg-white p-2.5 rounded-lg border border-slate-200">
                      <div className="font-bold text-slate-900 text-xs mb-1">
                        [{s.outletName}] {s.title}
                      </div>
                      <div className="text-[11px] text-slate-600 space-y-0.5">
                        {s.leadSummary.slice(0, 2).map((l, i) => (
                          <div key={i}>{l}</div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {activeTab === 'logs' && (
            <div className="space-y-2">
              {emailLogs.length === 0 ? (
                <div className="text-center py-10 bg-white rounded-2xl border border-slate-200 text-slate-500 text-xs shadow-xs">
                  아직 발송 이력이 없습니다.
                </div>
              ) : (
                emailLogs.map((log) => (
                  <div
                    key={log.id}
                    className="p-3.5 rounded-xl bg-white border border-slate-200 flex items-center justify-between text-xs shadow-xs"
                  >
                    <div className="space-y-0.5">
                      <div className="font-bold text-slate-900">{log.headline}</div>
                      <div className="text-[11px] text-slate-500">
                        수신: {log.recipient} · {log.sentAt}
                      </div>
                    </div>
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800">
                      전송 성공
                    </span>
                  </div>
                ))
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 bg-white border-t border-slate-200 flex items-center justify-end">
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
