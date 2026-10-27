import React, { useState } from 'react';
import {
  BarChart3,
  ShieldCheck,
  AlertCircle,
  HelpCircle,
  Clock,
  DollarSign,
  TrendingUp,
  Database,
  Filter,
  Layers,
  Sparkles
} from 'lucide-react';
import { EvalHarnessEngine } from '../evaluation/evalHarness.ts';
import { ModelScorecardEntry } from '../evaluation/types.ts';

interface ModelScorecardViewProps {
  evalHarness: EvalHarnessEngine;
}

export const ModelScorecardView: React.FC<ModelScorecardViewProps> = ({ evalHarness }) => {
  const [selectedCategory, setSelectedCategory] = useState<string>('ALL');
  const [selectedModel, setSelectedModel] = useState<string>('ALL');
  const [scorecardEntries, setScorecardEntries] = useState<ModelScorecardEntry[]>(() =>
    evalHarness.generateScorecard()
  );

  const refreshScorecard = () => {
    setScorecardEntries(evalHarness.generateScorecard());
  };

  const filteredEntries = scorecardEntries.filter((entry) => {
    const matchCat = selectedCategory === 'ALL' || entry.taskCategory === selectedCategory;
    const matchMod = selectedModel === 'ALL' || entry.modelId === selectedModel;
    return matchCat && matchMod;
  });

  const uniqueModels = Array.from(new Set(scorecardEntries.map((e) => e.modelId)));
  const uniqueCategories = Array.from(new Set(scorecardEntries.map((e) => e.taskCategory)));

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className="px-2.5 py-0.5 rounded text-xs font-semibold bg-indigo-950 text-indigo-400 border border-indigo-800/80">
                MULTI-DIMENSIONAL SCORECARD
              </span>
              <span className="text-xs text-slate-400 font-mono">Sample Count &ge; 5 Required</span>
            </div>
            <h2 className="text-2xl font-bold text-white tracking-tight">
              Bảng Đánh Giá Năng Lực Thực Nghiệm Đa Chiều
            </h2>
            <p className="text-sm text-slate-400 mt-1 max-w-3xl">
              Đánh giá độc lập theo từng loại nhiệm vụ. Nghiêm cấm gộp thành một điểm tổng duy nhất gây ngộ nhận. Nếu số mẫu kiểm thử dưới 5, hệ thống hiển thị chính xác trạng thái: <span className="text-amber-400 font-medium">"Chưa đủ dữ liệu đánh giá."</span>
            </p>
          </div>

          <button
            onClick={refreshScorecard}
            className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-semibold bg-slate-800 hover:bg-slate-700 text-white border border-slate-700 transition"
          >
            <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
            <span>Làm mới Scorecard</span>
          </button>
        </div>
      </div>

      {/* Metric Integrity Rules Banner */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-4 flex items-start gap-3">
          <ShieldCheck className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
          <div className="text-xs">
            <h4 className="font-semibold text-white">Quy tắc mẫu kiểm thử tối thiểu (&ge;5)</h4>
            <p className="text-slate-400 mt-1">
              Tuyệt đối không ngoại suy khi số mẫu thử nghiệm dưới 5. Điểm số chỉ được tính khi có đủ bằng chứng.
            </p>
          </div>
        </div>

        <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-4 flex items-start gap-3">
          <Layers className="w-5 h-5 text-indigo-400 shrink-0 mt-0.5" />
          <div className="text-xs">
            <h4 className="font-semibold text-white">Tách biệt từng miền nhiệm vụ</h4>
            <p className="text-slate-400 mt-1">
              Không cào bằng điểm lập trình với suy luận ngôn ngữ. Mỗi mô hình có ma trận thế mạnh riêng biệt.
            </p>
          </div>
        </div>

        <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-4 flex items-start gap-3">
          <Database className="w-5 h-5 text-cyan-400 shrink-0 mt-0.5" />
          <div className="text-xs">
            <h4 className="font-semibold text-white">Bằng chứng có thể kiểm chứng lại</h4>
            <p className="text-slate-400 mt-1">
              Mọi điểm số gắn liền với mã SHA-256 của từng lần chạy thực tế trong Eval Harness.
            </p>
          </div>
        </div>
      </div>

      {/* Filter Controls */}
      <div className="flex flex-wrap items-center gap-3 bg-slate-900 p-4 border border-slate-800 rounded-xl text-xs">
        <div className="flex items-center gap-2">
          <Filter className="w-4 h-4 text-slate-400" />
          <span className="text-slate-400">Lọc theo Model:</span>
          <select
            value={selectedModel}
            onChange={(e) => setSelectedModel(e.target.value)}
            className="bg-slate-800 border border-slate-700 text-white rounded-lg px-2.5 py-1.5 focus:outline-none focus:ring-1 focus:ring-cyan-500"
          >
            <option value="ALL">Tất cả Models</option>
            {uniqueModels.map((m) => (
              <option key={m} value={m}>
                {m}
              </option>
            ))}
          </select>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-slate-400">Lọc theo Danh mục:</span>
          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="bg-slate-800 border border-slate-700 text-white rounded-lg px-2.5 py-1.5 focus:outline-none focus:ring-1 focus:ring-cyan-500"
          >
            <option value="ALL">Tất cả Danh mục</option>
            {uniqueCategories.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Scorecard Table */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <BarChart3 className="w-5 h-5 text-indigo-400" />
            <h3 className="text-base font-bold text-white">
              Ma Trận Năng Lực Đa Chiều ({filteredEntries.length} Hàng)
            </h3>
          </div>
          <span className="text-xs text-slate-400 font-mono">No deceptive single score</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-950/70 text-slate-400 border-b border-slate-800">
              <tr>
                <th className="py-2.5 px-3">Mô hình &amp; Nhà cung cấp</th>
                <th className="py-2.5 px-3">Phiên bản</th>
                <th className="py-2.5 px-3">Loại nhiệm vụ</th>
                <th className="py-2.5 px-3">Số mẫu thử (N)</th>
                <th className="py-2.5 px-3">Điểm thực nghiệm</th>
                <th className="py-2.5 px-3">Tỷ lệ thành công</th>
                <th className="py-2.5 px-3">Độ trễ TB</th>
                <th className="py-2.5 px-3">Chi phí TB</th>
                <th className="py-2.5 px-3">Mức độ tin cậy</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800 text-slate-300">
              {filteredEntries.map((entry, idx) => {
                const isInsufficient = entry.confidenceLevel === 'INSUFFICIENT_DATA';

                return (
                  <tr key={`${entry.modelId}_${entry.taskCategory}_${idx}`} className="hover:bg-slate-800/40">
                    <td className="py-3 px-3">
                      <div className="font-semibold text-white font-mono">{entry.modelId}</div>
                      <div className="text-[10px] text-slate-500">{entry.provider}</div>
                    </td>
                    <td className="py-3 px-3 font-mono text-slate-400">{entry.modelVersion}</td>
                    <td className="py-3 px-3">
                      <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-slate-800 text-cyan-300 border border-slate-700">
                        {entry.taskCategory}
                      </span>
                    </td>
                    <td className="py-3 px-3 font-mono font-bold">
                      <span className={entry.sampleCount < 5 ? 'text-amber-400' : 'text-slate-300'}>
                        {entry.sampleCount} runs
                      </span>
                    </td>
                    <td className="py-3 px-3">
                      {isInsufficient ? (
                        <div className="flex items-center gap-1.5 text-amber-400 font-medium">
                          <AlertCircle className="w-3.5 h-3.5" />
                          <span>Chưa đủ dữ liệu đánh giá.</span>
                        </div>
                      ) : (
                        <div className="flex items-center gap-2">
                          <div className="w-16 bg-slate-800 rounded-full h-2 overflow-hidden">
                            <div
                              className="bg-cyan-500 h-full rounded-full"
                              style={{ width: `${Math.round(entry.score * 100)}%` }}
                            />
                          </div>
                          <span className="font-mono font-bold text-cyan-400">
                            {(entry.score * 100).toFixed(1)}%
                          </span>
                        </div>
                      )}
                    </td>
                    <td className="py-3 px-3 font-mono">
                      {isInsufficient ? (
                        <span className="text-slate-600">N/A</span>
                      ) : (
                        <span className="text-emerald-400 font-bold">
                          {(entry.successRate * 100).toFixed(0)}%
                        </span>
                      )}
                    </td>
                    <td className="py-3 px-3 font-mono text-slate-400">
                      {isInsufficient ? <span className="text-slate-600">N/A</span> : `${entry.latencyMs}ms`}
                    </td>
                    <td className="py-3 px-3 font-mono text-slate-400">
                      {isInsufficient ? <span className="text-slate-600">N/A</span> : `$${entry.costUsd.toFixed(4)}`}
                    </td>
                    <td className="py-3 px-3">
                      {entry.confidenceLevel === 'HIGH' && (
                        <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-950 text-emerald-400 border border-emerald-800">
                          HIGH (&ge;10)
                        </span>
                      )}
                      {entry.confidenceLevel === 'MEDIUM' && (
                        <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-cyan-950 text-cyan-400 border border-cyan-800">
                          MEDIUM (5-9)
                        </span>
                      )}
                      {entry.confidenceLevel === 'INSUFFICIENT_DATA' && (
                        <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-950 text-amber-400 border border-amber-800">
                          &lt; 5 SAMPLES
                        </span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
