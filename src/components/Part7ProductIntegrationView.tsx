import React, { useState } from 'react';
import {
  Layers,
  CheckCircle2,
  Share2,
  Lock,
  FileCheck,
  Star,
  MessageSquare,
  FileText,
  ShieldAlert,
  ArrowRight,
  Download
} from 'lucide-react';
import { AiCoreService } from '../core/aiCoreService.ts';
import { ShareArtifact, VerificationReport, TaskExecutionResult } from '../core/types.ts';
import { UserRole } from '../governance/types.ts';

interface Part7ProductIntegrationViewProps {
  aiCore: AiCoreService;
  role: UserRole;
}

export const Part7ProductIntegrationView: React.FC<Part7ProductIntegrationViewProps> = ({ aiCore, role }) => {
  // 1. Ndawg Verify Sandbox
  const [sampleOutput, setSampleOutput] = useState<string>(
    'Thuật toán sắp xếp QuickSort có độ phức tạp trung bình O(N log N) và trường hợp xấu nhất O(N^2) khi pivot không tối ưu.'
  );
  const [domain, setDomain] = useState<'math' | 'code' | 'citation' | 'general'>('code');
  const [verifyReport, setVerifyReport] = useState<VerificationReport | null>(null);

  // 2. Safe Sharing Artifact Generator (Secret Redaction)
  const [shareInputText, setShareInputText] = useState<string>(
    `Báo cáo thực thi hệ thống:\nGoogle Key: AIzaSyB123456789012345678901234567890\nOpenAI Key: sk-abcdef1234567890abcdef1234567890\nSystem Prompt: Bạn là một trợ lý tuyệt mật của Ndawg Pro.\nactorId: "super_admin_lead"\nNội dung: Phân tích đã hoàn tất thành công.`
  );
  const [shareArtifact, setShareArtifact] = useState<ShareArtifact | null>(null);

  // 3. Feedback Recorder
  const [feedbackRating, setFeedbackRating] = useState<1 | 2 | 3 | 4 | 5>(5);
  const [feedbackComment, setFeedbackComment] = useState<string>('Kết quả kiểm chứng rất chính xác và minh bạch.');
  const [feedbackSubmitted, setFeedbackSubmitted] = useState<boolean>(false);

  const handleRunVerify = () => {
    const dummyResult: TaskExecutionResult = {
      taskId: `task_verify_${Date.now()}`,
      success: true,
      output: sampleOutput,
      tokensUsed: 420,
      costUsd: 0.0012,
      executionDurationMs: 45
    };
    const rep = aiCore.verifyResult(dummyResult, { domain, strictness: 'standard' });
    setVerifyReport(rep);
  };

  const handleCreateShareArtifact = () => {
    const artifact = aiCore.createShareArtifact(shareInputText, {
      stripApiKeys: true,
      stripInternalPrompt: true,
      maskUserIdentifier: true
    });
    setShareArtifact(artifact);
  };

  const handleSubmitFeedback = () => {
    aiCore.recordFeedback({
      targetId: 'task_demo_01',
      rating: feedbackRating,
      category: 'accuracy',
      comment: feedbackComment,
      userRole: role
    });
    setFeedbackSubmitted(true);
    setTimeout(() => setFeedbackSubmitted(false), 3000);
  };

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 shadow-xl">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-cyan-950 border border-cyan-800 flex items-center justify-center text-cyan-400">
              <Layers className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl font-bold text-white tracking-tight">Part 7: Product &amp; Growth Integration</h1>
                <span className="text-xs px-2.5 py-0.5 rounded-full font-mono bg-cyan-950 text-cyan-300 border border-cyan-800">
                  Kế Thừa AI Core
                </span>
              </div>
              <p className="text-sm text-slate-400 mt-1">
                Giao diện kiểm chứng Ndawg Verify, Trình tạo liên kết chia sẻ bảo mật (Auto Redaction), và Cơ chế ghi nhận phản hồi.
              </p>
            </div>
          </div>

          <span className="text-xs font-mono px-3 py-1 bg-slate-950 text-emerald-400 rounded border border-emerald-800">
            Fulfills Contracts #4, #11, #12 &amp; #13
          </span>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Module 1: Ndawg Verify UI (Contract 4) */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <FileCheck className="w-4 h-4 text-emerald-400" />
              Ndawg Verify (Independent Verifier UI)
            </h3>
            <span className="text-xs font-mono text-cyan-400 bg-cyan-950/60 px-2 py-0.5 rounded border border-cyan-800/40">
              Contract #4: verifyResult
            </span>
          </div>

          <div>
            <label className="text-xs text-slate-400 block mb-1">Domain kiểm tra:</label>
            <select
              value={domain}
              onChange={(e) => setDomain(e.target.value as any)}
              className="w-full bg-slate-950 border border-slate-800 rounded p-1.5 text-xs text-slate-200"
            >
              <option value="code">Mã nguồn &amp; Thuật toán (code)</option>
              <option value="math">Toán học &amp; Số liệu (math)</option>
              <option value="citation">Trích dẫn &amp; Nguồn (citation)</option>
              <option value="general">Tổng quát (general)</option>
            </select>
          </div>

          <div>
            <label className="text-xs text-slate-400 block mb-1">Nội dung cần kiểm chứng độc lập:</label>
            <textarea
              rows={3}
              value={sampleOutput}
              onChange={(e) => setSampleOutput(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded p-2 text-xs text-slate-200 font-mono"
            />
          </div>

          <button
            onClick={handleRunVerify}
            className="w-full py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded text-xs font-bold transition-colors"
          >
            Chạy Ndawg Verify
          </button>

          {verifyReport && (
            <div className="p-3 bg-slate-950 rounded-lg border border-slate-800 text-xs space-y-2">
              <div className="flex items-center justify-between">
                <span className="font-bold text-slate-200">Trạng thái xác minh:</span>
                <span
                  className={`px-2 py-0.5 rounded font-mono font-bold ${
                    verifyReport.status === 'VERIFIED'
                      ? 'bg-emerald-950 text-emerald-300 border border-emerald-800'
                      : 'bg-amber-950 text-amber-300 border border-amber-800'
                  }`}
                >
                  {verifyReport.status}
                </span>
              </div>
              <div className="text-slate-400 font-mono text-[11px]">
                Điểm tin cậy (Trust Score): <strong className="text-emerald-400">{(verifyReport.score * 100).toFixed(0)}%</strong>
              </div>
              <div className="space-y-1 pt-1 border-t border-slate-800">
                {verifyReport.checkedItems.map((item, idx) => (
                  <div key={idx} className="flex items-center justify-between text-[11px]">
                    <span className="text-slate-300">{item.rule}</span>
                    <span className={item.passed ? 'text-emerald-400' : 'text-rose-400'}>
                      {item.passed ? '✓ ĐẠT' : '✕ KHÔNG ĐẠT'}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Module 2: Safe Share Artifact Generator (Contract 12) */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <Share2 className="w-4 h-4 text-cyan-400" />
              Safe Share Generator (Bảo Vệ Bí Mật &amp; PII)
            </h3>
            <span className="text-xs font-mono text-cyan-400 bg-cyan-950/60 px-2 py-0.5 rounded border border-cyan-800/40">
              Contract #12: createShareArtifact
            </span>
          </div>

          <div>
            <label className="text-xs text-slate-400 block mb-1">
              Dữ liệu chứa API Key và System Prompt cần chia sẻ an toàn:
            </label>
            <textarea
              rows={4}
              value={shareInputText}
              onChange={(e) => setShareInputText(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded p-2 text-xs text-slate-200 font-mono"
            />
          </div>

          <button
            onClick={handleCreateShareArtifact}
            className="w-full py-1.5 bg-cyan-600 hover:bg-cyan-500 text-white rounded text-xs font-bold transition-colors"
          >
            Tạo Liên Kết Chia Sẻ (Tự Động Che Giấu Bí Mật)
          </button>

          {shareArtifact && (
            <div className="p-3 bg-slate-950 rounded-lg border border-slate-800 text-xs space-y-2">
              <div className="flex items-center justify-between">
                <span className="font-bold text-slate-200">Liên kết an toàn:</span>
                <span className="text-cyan-400 font-mono text-[11px] underline truncate max-w-[200px]">
                  {shareArtifact.shareUrl}
                </span>
              </div>
              <div className="text-slate-400 text-[11px]">
                Số khóa bí mật đã khử (Redacted Keys): <strong className="text-emerald-400">{shareArtifact.redactedKeysCount}</strong>
              </div>
              <div className="p-2 rounded bg-slate-900 border border-slate-800 font-mono text-[11px] text-slate-300 whitespace-pre-wrap">
                {shareArtifact.cleanContent}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Module 3: Feedback Recorder (Contract 13) */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-bold text-white flex items-center gap-2">
            <MessageSquare className="w-4 h-4 text-amber-400" />
            Cơ Chế Ghi Nhận Phản Hồi &amp; Đánh Giá (User Feedback)
          </h3>
          <span className="text-xs font-mono text-cyan-400 bg-cyan-950/60 px-2 py-0.5 rounded border border-cyan-800/40">
            Contract #13: recordFeedback
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-3 items-end">
          <div>
            <label className="text-xs text-slate-400 block mb-1">Mức đánh giá sao:</label>
            <div className="flex gap-1">
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  key={star}
                  onClick={() => setFeedbackRating(star as any)}
                  className={`p-1.5 rounded transition-colors ${
                    feedbackRating >= star ? 'text-amber-400' : 'text-slate-600'
                  }`}
                >
                  <Star className="w-4 h-4 fill-current" />
                </button>
              ))}
            </div>
          </div>

          <div className="md:col-span-2">
            <label className="text-xs text-slate-400 block mb-1">Nội dung góp ý:</label>
            <input
              type="text"
              value={feedbackComment}
              onChange={(e) => setFeedbackComment(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded p-1.5 text-xs text-slate-200"
            />
          </div>

          <div>
            <button
              onClick={handleSubmitFeedback}
              className="w-full py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded text-xs font-medium transition-colors"
            >
              Gửi phản hồi
            </button>
          </div>
        </div>

        {feedbackSubmitted && (
          <div className="p-2 rounded bg-emerald-950/60 border border-emerald-800 text-emerald-300 text-xs font-mono">
            ✓ Phản hồi đã được ghi nhận vào kho lưu trữ với mã xác thực bất biến.
          </div>
        )}
      </div>
    </div>
  );
};
