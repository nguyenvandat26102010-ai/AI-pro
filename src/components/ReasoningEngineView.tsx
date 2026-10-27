import React, { useState } from 'react';
import {
  Brain,
  CheckCircle2,
  AlertTriangle,
  RotateCcw,
  Play,
  FileCheck2,
  Activity,
  Layers,
  Sparkles,
  ShieldAlert,
  ArrowRight
} from 'lucide-react';
import { ReasoningEngine } from '../core/reasoningEngine.ts';
import { ReasoningMode, ReasoningTaskResult } from '../core/types.ts';

interface ReasoningEngineViewProps {
  reasoningEngine: ReasoningEngine;
}

export const ReasoningEngineView: React.FC<ReasoningEngineViewProps> = ({ reasoningEngine }) => {
  const [selectedMode, setSelectedMode] = useState<ReasoningMode>('Verified');
  const [prompt, setPrompt] = useState<string>('Hãy tính 125 * 38 và phân tích các thừa số nguyên tố.');
  const [domain, setDomain] = useState<'math' | 'code' | 'logic' | 'research' | 'general'>('math');
  const [isRunning, setIsRunning] = useState<boolean>(false);
  const [result, setResult] = useState<ReasoningTaskResult | null>(null);

  const presets = [
    {
      label: 'Toán học chuẩn xác',
      prompt: 'Hãy tính 125 * 38 và phân tích các thừa số nguyên tố.',
      domain: 'math' as const,
      mode: 'Verified' as const
    },
    {
      label: 'Tự động sửa sai (Flaw Test Loop)',
      prompt: 'flaw_test: Hãy tính 240 / 6 và kiểm chứng độc lập.',
      domain: 'math' as const,
      mode: 'Verified' as const
    },
    {
      label: 'Ràng buộc định dạng Code',
      prompt: 'require_code: Hãy viết hàm tính giai thừa bằng đệ quy và memoization.',
      domain: 'code' as const,
      mode: 'Deep' as const
    },
    {
      label: 'Phân tích Logic Nhanh (Fast Mode)',
      prompt: 'So sánh ưu nhược điểm giữa KV Cache và PagedAttention trong LLM inference.',
      domain: 'research' as const,
      mode: 'Fast' as const
    }
  ];

  const handleRun = async () => {
    setIsRunning(true);
    setResult(null);
    try {
      const res = await reasoningEngine.executeReasoning({
        id: `reason_${Date.now()}`,
        prompt,
        domain,
        mode: selectedMode,
        maxRepairs: 3
      });
      setResult(res);
    } finally {
      setIsRunning(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 shadow-xl">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-indigo-950 border border-indigo-800 flex items-center justify-center text-indigo-400">
              <Brain className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl font-bold text-white tracking-tight">Reasoning Engine: Giải - Kiểm - Sửa</h1>
                <span className="text-xs px-2.5 py-0.5 rounded-full font-mono bg-indigo-950 text-indigo-300 border border-indigo-800">
                  4 Chế Độ Suy Luận
                </span>
              </div>
              <p className="text-sm text-slate-400 mt-1">
                Quy trình suy luận có kiểm chứng: Giải candidate solution → Kiểm chứng độc lập qua kernel số học &amp; ràng buộc → Tự động sửa chữa sai lệch tối đa 3 lần.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 text-xs font-mono">
            <span className="text-slate-500">QUY TẮC BẢO ĐẢM:</span>
            <span className="bg-emerald-950/70 text-emerald-300 border border-emerald-800 px-2 py-1 rounded">
              KHÔNG TẠO DANH HIỆU VERIFIED GIẢ
            </span>
          </div>
        </div>
      </div>

      {/* Control Sandbox */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 space-y-4">
        {/* Presets */}
        <div>
          <span className="text-xs font-semibold text-slate-400 block mb-2">Mẫu thử nghiệm định sẵn:</span>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2">
            {presets.map((p) => (
              <button
                key={p.label}
                onClick={() => {
                  setPrompt(p.prompt);
                  setDomain(p.domain);
                  setSelectedMode(p.mode);
                }}
                className="text-left p-2.5 rounded-lg bg-slate-950 border border-slate-800 hover:border-indigo-600 transition-colors text-xs"
              >
                <div className="font-semibold text-indigo-300">{p.label}</div>
                <div className="text-[11px] text-slate-500 truncate mt-0.5">{p.prompt}</div>
              </button>
            ))}
          </div>
        </div>

        {/* Mode Selector & Domain */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <div>
            <label className="text-xs text-slate-400 block mb-1">Chế độ suy luận (Reasoning Mode)</label>
            <div className="grid grid-cols-4 gap-1">
              {(['Fast', 'Standard', 'Deep', 'Verified'] as ReasoningMode[]).map((mode) => (
                <button
                  key={mode}
                  onClick={() => setSelectedMode(mode)}
                  className={`py-1.5 text-xs font-mono rounded border transition-colors ${
                    selectedMode === mode
                      ? 'bg-indigo-600 text-white border-indigo-400 font-bold'
                      : 'bg-slate-950 text-slate-400 border-slate-800 hover:border-slate-700'
                  }`}
                >
                  {mode}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="text-xs text-slate-400 block mb-1">Lĩnh vực (Domain)</label>
            <select
              value={domain}
              onChange={(e) => setDomain(e.target.value as any)}
              className="w-full bg-slate-950 border border-slate-800 rounded p-1.5 text-xs text-slate-200"
            >
              <option value="math">Toán học &amp; Số liệu (math)</option>
              <option value="code">Lập trình &amp; Thuật toán (code)</option>
              <option value="logic">Suy luận logic (logic)</option>
              <option value="research">Nghiên cứu &amp; Tổng hợp (research)</option>
              <option value="general">Tổng quát (general)</option>
            </select>
          </div>

          <div className="flex items-end">
            <button
              onClick={handleRun}
              disabled={isRunning || !prompt.trim()}
              className="w-full py-2 bg-gradient-to-r from-indigo-600 to-cyan-600 hover:from-indigo-500 hover:to-cyan-500 text-white rounded-lg text-xs font-bold flex items-center justify-center gap-2 shadow-lg shadow-indigo-600/20 disabled:opacity-50 transition-all"
            >
              {isRunning ? (
                <>
                  <Activity className="w-4 h-4 animate-spin" />
                  Đang chạy Giải - Kiểm - Sửa...
                </>
              ) : (
                <>
                  <Play className="w-4 h-4" />
                  Thực thi Suy luận &amp; Kiểm chứng
                </>
              )}
            </button>
          </div>
        </div>

        {/* Prompt Input */}
        <div>
          <label className="text-xs text-slate-400 block mb-1">Nội dung bài toán / Yêu cầu suy luận:</label>
          <textarea
            rows={3}
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-xs text-slate-200 font-mono focus:border-indigo-500 focus:outline-none"
            placeholder="Nhập câu hỏi, phép tính hoặc logic cần giải quyết..."
          />
        </div>
      </div>

      {/* Results Display */}
      {result && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Answer & Summary */}
          <div className="lg:col-span-2 space-y-4">
            <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 space-y-4">
              <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                <div className="flex items-center gap-2">
                  <span className="text-xs text-slate-400 uppercase font-mono">Kết quả cuối cùng:</span>
                  <span
                    className={`text-xs px-2.5 py-0.5 rounded-full font-bold font-mono border ${
                      result.outcome === 'VERIFIED'
                        ? 'bg-emerald-950 text-emerald-300 border-emerald-800'
                        : result.outcome === 'UNVERIFIED'
                        ? 'bg-amber-950 text-amber-300 border-amber-800'
                        : 'bg-rose-950 text-rose-300 border-rose-800'
                    }`}
                  >
                    {result.outcome === 'VERIFIED'
                      ? '✓ ĐÃ XÁC MINH (VERIFIED)'
                      : result.outcome === 'UNVERIFIED'
                      ? '⚠ CHƯA XÁC MINH (UNVERIFIED)'
                      : '✕ THẤT BẠI (FAILED)'}
                  </span>
                </div>
                <div className="text-xs font-mono text-slate-500">
                  {result.durationMs}ms • {result.repairAttempts} lần sửa tự động
                </div>
              </div>

              {/* Initial vs Repaired Comparison if repairs occurred */}
              {result.repairAttempts > 0 && (
                <div className="p-3 bg-amber-950/30 border border-amber-800/60 rounded-lg text-xs space-y-1">
                  <div className="text-amber-400 font-semibold flex items-center gap-1.5">
                    <RotateCcw className="w-3.5 h-3.5" />
                    Vòng lặp tự động sửa lỗi (Auto-repair Loop Active)
                  </div>
                  <div className="text-slate-400 text-[11px]">
                    Câu trả lời ban đầu: <span className="line-through text-slate-500">{result.initialAnswer}</span>
                  </div>
                  <div className="text-emerald-300 text-[11px] font-mono">
                    Đã sửa thành công sau {result.repairAttempts} lần đối chiếu độc lập.
                  </div>
                </div>
              )}

              {/* Final Answer text */}
              <div className="p-4 bg-slate-950 rounded-lg border border-slate-800 text-sm font-mono text-slate-200 leading-relaxed whitespace-pre-wrap">
                {result.finalAnswer}
              </div>

              {/* Structured ReasoningSummary */}
              <div className="border-t border-slate-800 pt-4 space-y-3">
                <h4 className="text-xs font-bold uppercase text-slate-300 flex items-center gap-2">
                  <FileCheck2 className="w-4 h-4 text-cyan-400" />
                  Reasoning Summary Cấu Trúc
                </h4>
                <div className="grid grid-cols-2 gap-3 text-xs">
                  <div className="bg-slate-950 p-2.5 rounded border border-slate-800">
                    <span className="text-slate-500 font-mono text-[10px] block">MỤC TIÊU (GOALS)</span>
                    <ul className="list-disc list-inside text-slate-300 mt-1 space-y-0.5">
                      {result.summary.goals.map((g, i) => (
                        <li key={i}>{g}</li>
                      ))}
                    </ul>
                  </div>
                  <div className="bg-slate-950 p-2.5 rounded border border-slate-800">
                    <span className="text-slate-500 font-mono text-[10px] block">PHƯƠNG PHÁP &amp; CÔNG CỤ</span>
                    <div className="text-slate-300 mt-1 flex flex-wrap gap-1">
                      {result.summary.methods.concat(result.summary.toolsUsed).map((m, i) => (
                        <span key={i} className="px-1.5 py-0.5 bg-slate-800 rounded font-mono text-[10px]">
                          {m}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Evidence table */}
                <div className="bg-slate-950 p-3 rounded border border-slate-800 text-xs">
                  <span className="text-slate-500 font-mono text-[10px] block mb-2">BẰNG CHỨNG ĐÃ ĐỐI CHIẾU (EVIDENCE)</span>
                  <div className="space-y-1.5">
                    {result.summary.evidence.map((ev, i) => (
                      <div key={i} className="flex items-center justify-between text-[11px] p-1.5 rounded bg-slate-900 border border-slate-800">
                        <span className="font-mono text-slate-300">{ev.claim}</span>
                        <div className="flex items-center gap-2 shrink-0">
                          <span className="text-[10px] text-slate-500">[{ev.source}]</span>
                          <span
                            className={`px-1.5 py-0.2 rounded font-mono text-[10px] ${
                              ev.verified ? 'text-emerald-400 bg-emerald-950 border border-emerald-800' : 'text-amber-400 bg-amber-950'
                            }`}
                          >
                            {ev.verified ? 'VERIFIED' : 'UNVERIFIED'}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Execution Trace Column */}
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 space-y-3">
            <h3 className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-2">
              <Activity className="w-4 h-4 text-amber-400" />
              Tiến Trình Giải - Kiểm - Sửa ({result.traces.length} Bước)
            </h3>

            <div className="space-y-2.5 text-xs">
              {result.traces.map((trace) => {
                const phaseBg =
                  trace.phase === 'SOLVE'
                    ? 'border-indigo-800 bg-indigo-950/40 text-indigo-300'
                    : trace.phase === 'VERIFY'
                    ? trace.passedVerification
                      ? 'border-emerald-800 bg-emerald-950/40 text-emerald-300'
                      : 'border-rose-800 bg-rose-950/40 text-rose-300'
                    : 'border-amber-800 bg-amber-950/40 text-amber-300';

                return (
                  <div key={trace.stepIndex} className={`p-2.5 rounded-lg border ${phaseBg} space-y-1`}>
                    <div className="flex items-center justify-between text-[11px] font-mono font-bold">
                      <span>
                        Bước {trace.stepIndex}: [{trace.phase}]
                      </span>
                      {trace.phase === 'VERIFY' && (
                        <span>{trace.passedVerification ? '✓ ĐẠT' : '✕ SAI LỆCH'}</span>
                      )}
                    </div>
                    <div className="text-slate-200 text-xs">{trace.description}</div>
                    <div className="text-slate-400 text-[11px] font-mono whitespace-pre-wrap">{trace.details}</div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
