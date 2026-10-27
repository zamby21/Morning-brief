import React, { useState, useEffect } from 'react';
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
  Save,
  Check,
  BookmarkCheck,
  Trash2,
  Plus,
  ShieldCheck,
} from 'lucide-react';
import { DailyBriefing, EmailDispatchLog } from '../types/news';

interface EmailModalProps {
  isOpen: boolean;
  onClose: () => void;
  briefing: DailyBriefing;
  recipientEmail: string;
  savedRecipientEmails?: string[];
  deliveryTime: string;
  emailLogs: EmailDispatchLog[];
  onSendEmail: (email: string) => Promise<string>;
  onSaveRecipientEmail?: (email: string, alsoAddToList?: boolean) => void;
  onDeleteSavedEmail?: (email: string) => void;
}

export const EmailModal: React.FC<EmailModalProps> = ({
  isOpen,
  onClose,
  briefing,
  recipientEmail,
  savedRecipientEmails = [],
  deliveryTime,
  emailLogs,
  onSendEmail,
  onSaveRecipientEmail,
  onDeleteSavedEmail,
}) => {
  const [emailInput, setEmailInput] = useState(recipientEmail);
  const [activeTab, setActiveTab] = useState<'send' | 'preview' | 'logs'>('send');
  const [isSending, setIsSending] = useState(false);
  const [sendResultMsg, setSendResultMsg] = useState<string | null>(null);
  const [saveSuccessMsg, setSaveSuccessMsg] = useState<string | null>(null);
  const [autoSaveOnSend, setAutoSaveOnSend] = useState(true);

  // Sync with recipientEmail prop when modal opens or prop changes
  useEffect(() => {
    if (recipientEmail) {
      setEmailInput(recipientEmail);
    }
  }, [recipientEmail, isOpen]);

  if (!isOpen) return null;

  const emailList = Array.from(
    new Set([
      recipientEmail,
      ...savedRecipientEmails,
    ].filter((e) => e && e.includes('@')))
  );

  const isCurrentInputSavedDefault = emailInput.trim().toLowerCase() === recipientEmail.trim().toLowerCase();

  const handleSaveDefaultEmail = (targetEmail?: string) => {
    const toSave = (targetEmail || emailInput).trim();
    if (!toSave || !toSave.includes('@')) {
      setSaveSuccessMsg('올바른 이메일 주소(예: name@example.com)를 입력해주세요.');
      setTimeout(() => setSaveSuccessMsg(null), 3000);
      return;
    }

    if (onSaveRecipientEmail) {
      onSaveRecipientEmail(toSave, true);
    }
    setEmailInput(toSave);
    setSaveSuccessMsg(`'${toSave}' 주소가 기본 수신 이메일로 저장되었습니다. (다시 실행해도 유지)`);
    setTimeout(() => setSaveSuccessMsg(null), 3500);
  };

  const handleSelectSavedEmail = (email: string) => {
    setEmailInput(email);
    setSendResultMsg(null);
  };

  const handleDeleteEmail = (e: React.MouseEvent, emailToDelete: string) => {
    e.stopPropagation();
    if (onDeleteSavedEmail) {
      onDeleteSavedEmail(emailToDelete);
    }
  };

  const handleSend = async () => {
    const target = emailInput.trim();
    if (!target || !target.includes('@')) {
      setSendResultMsg('올바른 발송 대상 이메일 주소를 입력해주세요.');
      return;
    }

    // Auto save if enabled
    if (autoSaveOnSend && onSaveRecipientEmail) {
      onSaveRecipientEmail(target, true);
    }

    setIsSending(true);
    setSendResultMsg(null);
    try {
      const msg = await onSendEmail(target);
      setSendResultMsg(msg || `${target} 주소로 발송 완료되었습니다.`);
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
              <div className="flex items-center gap-2 flex-wrap">
                <h3 className="text-lg font-bold text-slate-900">
                  모닝브리프 이메일 발송 & 수신 주소 관리
                </h3>
                <span className="text-[11px] font-bold text-emerald-800 bg-emerald-100 px-2 py-0.5 rounded-full flex items-center gap-1">
                  <ShieldCheck className="w-3 h-3 text-emerald-600" />
                  <span>설정 자동 저장 지원</span>
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-0.5">
                매일 오전 {deliveryTime} 정각 자동 발송 관리 및 수신 이메일 영구 저장
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
            <span>수신 메일 설정 & 즉시 발송</span>
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
              {/* Recipient Email Settings & Storage Box */}
              <div className="bg-white border border-slate-200 rounded-2xl p-5 space-y-4 shadow-xs">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 pb-1">
                  <div>
                    <h4 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                      <Mail className="w-4 h-4 text-blue-600" />
                      <span>수신 이메일 주소 설정 및 저장</span>
                    </h4>
                    <p className="text-xs text-slate-500 mt-0.5">
                      입력하신 이메일 주소를 저장하시면 웹페이지를 다시 열어도 이전 설정이 자동으로 유지됩니다.
                    </p>
                  </div>
                  <div className="flex items-center gap-1.5 self-start sm:self-auto">
                    <span className="text-[11px] text-slate-500">현재 기본값:</span>
                    <span className="text-xs font-bold text-blue-700 bg-blue-50 px-2 py-0.5 rounded border border-blue-200">
                      {recipientEmail}
                    </span>
                  </div>
                </div>

                {/* Email Input & Action Buttons */}
                <div className="space-y-2">
                  <div className="flex flex-col sm:flex-row gap-2">
                    <div className="relative flex-1">
                      <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                      <input
                        type="email"
                        value={emailInput}
                        onChange={(e) => setEmailInput(e.target.value)}
                        placeholder="수신할 이메일 주소 (예: user@example.com)"
                        className="w-full bg-slate-50 border border-slate-300 rounded-xl pl-10 pr-4 py-2.5 text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:border-blue-500 focus:bg-white transition"
                      />
                    </div>

                    {/* Save Recipient Email Button */}
                    <button
                      type="button"
                      onClick={() => handleSaveDefaultEmail()}
                      className={`px-4 py-2.5 rounded-xl font-bold text-xs flex items-center justify-center gap-1.5 transition active:scale-95 shadow-xs cursor-pointer ${
                        isCurrentInputSavedDefault
                          ? 'bg-slate-100 text-slate-700 border border-slate-200 hover:bg-slate-200'
                          : 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-emerald-600/20'
                      }`}
                      title="입력한 이메일을 기본 수신 주소로 브라우저에 저장합니다."
                    >
                      {isCurrentInputSavedDefault ? (
                        <>
                          <Check className="w-3.5 h-3.5 text-emerald-600" />
                          <span>기본값 저장됨</span>
                        </>
                      ) : (
                        <>
                          <Save className="w-3.5 h-3.5" />
                          <span>수신 메일 저장</span>
                        </>
                      )}
                    </button>

                    {/* Direct Send Button */}
                    <button
                      type="button"
                      onClick={handleSend}
                      disabled={isSending || !emailInput}
                      className="px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white font-bold text-xs flex items-center justify-center gap-1.5 transition active:scale-95 shadow-xs cursor-pointer"
                    >
                      <Send className={`w-3.5 h-3.5 ${isSending ? 'animate-bounce' : ''}`} />
                      <span>{isSending ? '전송 중...' : '지금 바로 발송'}</span>
                    </button>
                  </div>

                  {/* Auto-save checkbox */}
                  <div className="flex items-center justify-between text-xs text-slate-600 pt-1 px-1">
                    <label className="flex items-center gap-2 cursor-pointer select-none">
                      <input
                        type="checkbox"
                        checked={autoSaveOnSend}
                        onChange={(e) => setAutoSaveOnSend(e.target.checked)}
                        className="w-3.5 h-3.5 text-blue-600 rounded cursor-pointer"
                      />
                      <span>발송 시 이 주소를 기본 수신 이메일로 자동 저장 (다음 실행 시에도 유지)</span>
                    </label>
                  </div>
                </div>

                {/* Save Feedback Alert */}
                {saveSuccessMsg && (
                  <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-xs text-emerald-800 flex items-center gap-2 animate-in fade-in duration-200">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                    <span>{saveSuccessMsg}</span>
                  </div>
                )}

                {/* Send Result Feedback Alert */}
                {sendResultMsg && (
                  <div className="p-3 rounded-xl bg-blue-50 border border-blue-200 text-xs text-blue-800 flex items-center gap-2 animate-in fade-in duration-200">
                    <CheckCircle2 className="w-4 h-4 text-blue-600 shrink-0" />
                    <span>{sendResultMsg}</span>
                  </div>
                )}

                {/* Saved Recipient Emails Chips (Quick Selection) */}
                <div className="pt-3 border-t border-slate-100 space-y-2">
                  <div className="flex items-center justify-between text-xs text-slate-600">
                    <span className="font-bold flex items-center gap-1.5">
                      <BookmarkCheck className="w-3.5 h-3.5 text-blue-600" />
                      <span>저장된 수신 이메일 목록 (클릭하여 빠른 선택)</span>
                    </span>
                    <span className="text-[11px] text-slate-400">총 {emailList.length}개 주소 등록됨</span>
                  </div>

                  <div className="flex flex-wrap items-center gap-1.5">
                    {emailList.map((addr) => {
                      const isDefault = addr.toLowerCase() === recipientEmail.toLowerCase();
                      const isSelected = addr.toLowerCase() === emailInput.trim().toLowerCase();
                      return (
                        <div
                          key={addr}
                          onClick={() => handleSelectSavedEmail(addr)}
                          className={`group px-3 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition cursor-pointer border ${
                            isSelected
                              ? 'bg-blue-600 text-white border-blue-600 shadow-xs'
                              : 'bg-slate-100 hover:bg-slate-200 text-slate-700 border-slate-200'
                          }`}
                        >
                          <span>{addr}</span>
                          {isDefault && (
                            <span
                              className={`text-[9px] px-1.5 py-0.2 rounded-full font-bold ${
                                isSelected ? 'bg-white text-blue-700' : 'bg-blue-100 text-blue-700'
                              }`}
                            >
                              기본
                            </span>
                          )}
                          {emailList.length > 1 && !isDefault && (
                            <button
                              type="button"
                              onClick={(e) => handleDeleteEmail(e, addr)}
                              className={`p-0.5 rounded-full hover:bg-black/10 transition cursor-pointer ml-0.5 ${
                                isSelected ? 'text-white/80 hover:text-white' : 'text-slate-400 hover:text-slate-700'
                              }`}
                              title="저장 목록에서 삭제"
                            >
                              <X className="w-3 h-3" />
                            </button>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>

              {/* Automatic Dispatch Schedule info */}
              <div className="bg-gradient-to-r from-blue-50 via-indigo-50/60 to-slate-50 border border-blue-200 rounded-2xl p-4 flex items-start gap-3">
                <Clock className="w-5 h-5 text-blue-600 shrink-0 mt-0.5" />
                <div className="text-xs space-y-1">
                  <div className="font-bold text-slate-900">
                    매일 오전 {deliveryTime} 정각 자동 발송 안내
                  </div>
                  <p className="text-slate-600">
                    저장된 수신 이메일로 매일 아침 조간 신문 1면 보도가 집계되는 즉시 뉴스레터가 자동 발송됩니다. 설정하신 이메일은 브라우저(localStorage)에 영구 저장되어 다음에 웹을 열었을 때도 그대로 유지됩니다.
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
