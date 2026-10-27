import React, { useState } from 'react';
import {
  GitMerge,
  ShieldCheck,
  AlertOctagon,
  Copy,
  Plus,
  Trash2,
  Award,
  Sparkles,
  Layers,
  Database
} from 'lucide-react';
import { KnowledgeSynthesizer } from '../core/knowledgeSynthesizer.ts';
import { SynthesizedKnowledgeArtifact } from '../core/types.ts';

interface KnowledgeSynthesizerViewProps {
  knowledgeSynthesizer: KnowledgeSynthesizer;
}

export const KnowledgeSynthesizerView: React.FC<KnowledgeSynthesizerViewProps> = ({ knowledgeSynthesizer }) => {
  const [topic, setTopic] = useState<string>('Kiến trúc Bộ nhớ KV Cache trong Transformer');
  const [claimInputs, setClaimInputs] = useState<Array<{ text: string; source: string }>>([
    {
      text: 'KV Cache lưu trữ các tensor Key và Value của các token trước đó nhằm tránh tính toán lại O(N^2).',
      source: 'Gemini 2.5 Pro'
    },
    {
      text: 'KV Cache lưu trữ Key và Value của token trước để tránh tính lại attention, nhưng tiêu tốn VRAM tỷ lệ thuận với độ dài chuỗi.',
      source: 'Claude 3.7 Sonnet'
    },
    {
      text: 'PagedAttention giúp giảm phân mảnh bộ nhớ của KV Cache bằng cách chia nhỏ thành các trang bộ nhớ vật lý không liên tục.',
      source: 'vLLM Whitepaper'
    }
  ]);

  const [artifacts, setArtifacts] = useState<SynthesizedKnowledgeArtifact[]>(() =>
    knowledgeSynthesizer.getArtifacts()
  );
  const [lastResult, setLastResult] = useState<SynthesizedKnowledgeArtifact | null>(null);

  const handleAddClaim = () => {
    setClaimInputs([...claimInputs, { text: '', source: 'Gemini 2.5 Flash' }]);
  };

  const handleRemoveClaim = (idx: number) => {
    setClaimInputs(claimInputs.filter((_, i) => i !== idx));
  };

  const handleUpdateClaim = (idx: number, field: 'text' | 'source', val: string) => {
    const updated = [...claimInputs];
    updated[idx][field] = val;
    setClaimInputs(updated);
  };

  const handleSynthesize = () => {
    const validClaims = claimInputs.filter((c) => c.text.trim().length > 0);
    if (validClaims.length === 0) return;

    const res = knowledgeSynthesizer.synthesize(topic, validClaims);
    setLastResult(res);
    setArtifacts(knowledgeSynthesizer.getArtifacts());
  };

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 shadow-xl">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-cyan-950 border border-cyan-800 flex items-center justify-center text-cyan-400">
              <GitMerge className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl font-bold text-white tracking-tight">Multi-Model Knowledge Synthesizer</h1>
                <span className="text-xs px-2.5 py-0.5 rounded-full font-mono bg-cyan-950 text-cyan-300 border border-cyan-800">
                  Ingestion Gate: Gold / Silver / Bronze
                </span>
              </div>
              <p className="text-sm text-slate-400 mt-1">
                Thu thập và tổng hợp tri thức đa mô hình: Tự động khử trùng lặp (Hash &amp; Token Jaccard), phát hiện mâu thuẫn (Contradiction Detector), và cấp chứng chỉ độ tin cậy.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-xs font-mono px-3 py-1 bg-slate-950 text-slate-300 rounded border border-slate-800">
              Kho tri thức: <strong className="text-cyan-400">{artifacts.length}</strong> Artifacts
            </span>
          </div>
        </div>
      </div>

      {/* Synthesis Sandbox */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 space-y-4">
        <div>
          <label className="text-xs text-slate-400 block mb-1">Chủ đề tri thức cần tổng hợp:</label>
          <input
            type="text"
            value={topic}
            onChange={(e) => setTopic(e.target.value)}
            className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2 text-xs text-slate-200 font-medium focus:border-cyan-500 focus:outline-none"
          />
        </div>

        {/* Claim Inputs */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-300">
              Các khẳng định (Claims) từ nhiều mô hình hoặc tài liệu:
            </span>
            <button
              onClick={handleAddClaim}
              className="px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded text-xs flex items-center gap-1 font-mono transition-colors"
            >
              <Plus className="w-3.5 h-3.5 text-cyan-400" />
              Thêm khẳng định
            </button>
          </div>

          {claimInputs.map((claim, idx) => (
            <div key={idx} className="flex items-start gap-2 bg-slate-950 p-2.5 rounded-lg border border-slate-800">
              <span className="text-slate-500 font-mono text-xs pt-1.5 w-6 shrink-0">#{idx + 1}</span>
              <textarea
                rows={2}
                value={claim.text}
                onChange={(e) => handleUpdateClaim(idx, 'text', e.target.value)}
                placeholder="Nhập nội dung claim..."
                className="flex-1 bg-slate-900 border border-slate-800 rounded p-1.5 text-xs text-slate-200 font-mono focus:border-cyan-500 focus:outline-none"
              />
              <input
                type="text"
                value={claim.source}
                onChange={(e) => handleUpdateClaim(idx, 'source', e.target.value)}
                placeholder="Nguồn / Mô hình"
                className="w-36 bg-slate-900 border border-slate-800 rounded p-1.5 text-xs text-cyan-300 font-mono"
              />
              {claimInputs.length > 1 && (
                <button
                  onClick={() => handleRemoveClaim(idx)}
                  className="p-1.5 text-slate-500 hover:text-rose-400 rounded transition-colors"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              )}
            </div>
          ))}
        </div>

        <button
          onClick={handleSynthesize}
          className="w-full py-2 bg-cyan-600 hover:bg-cyan-500 text-white rounded-lg text-xs font-bold flex items-center justify-center gap-2 shadow-lg shadow-cyan-600/20 transition-all"
        >
          <GitMerge className="w-4 h-4" />
          Tổng hợp Tri thức &amp; Kiểm định Ingestion Gate
        </button>
      </div>

      {/* Synthesis Evaluation Result */}
      {lastResult && (
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 space-y-4">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <div className="flex items-center gap-3">
              <h3 className="text-sm font-bold text-white">Kết Quả Tổng Hợp: {lastResult.topic}</h3>
              <span
                className={`text-xs px-2.5 py-0.5 rounded-full font-bold font-mono border flex items-center gap-1 ${
                  lastResult.badge === 'Gold'
                    ? 'bg-amber-950 text-amber-300 border-amber-600'
                    : lastResult.badge === 'Silver'
                    ? 'bg-slate-800 text-slate-200 border-slate-600'
                    : 'bg-rose-950 text-rose-300 border-rose-800'
                }`}
              >
                <Award className="w-3.5 h-3.5" />
                GATE BADGE: {lastResult.badge}
              </span>
            </div>
            <div className="text-xs font-mono text-slate-400">
              Đồng thuận: <strong className="text-emerald-400">{(lastResult.consensusScore * 100).toFixed(0)}%</strong> • Khử trùng: <strong className="text-cyan-400">{lastResult.deduplicatedCount}</strong>
            </div>
          </div>

          {/* Contradictions Found */}
          {lastResult.contradictionsFound.length > 0 ? (
            <div className="p-3 bg-rose-950/30 border border-rose-800/80 rounded-lg space-y-2">
              <div className="flex items-center gap-2 text-rose-400 font-bold text-xs">
                <AlertOctagon className="w-4 h-4" />
                Phát hiện {lastResult.contradictionsFound.length} Mâu Thuẫn Chéo (Contradictions):
              </div>
              <div className="space-y-1.5 text-xs">
                {lastResult.contradictionsFound.map((contra, i) => (
                  <div key={i} className="p-2 bg-slate-950 rounded border border-rose-900/60 font-mono text-[11px] space-y-1">
                    <div className="flex items-center justify-between text-rose-300">
                      <span>[{contra.severity}] {contra.topic}</span>
                      <span className="text-slate-500">{contra.reason}</span>
                    </div>
                    <div className="grid grid-cols-2 gap-2 text-slate-300 pt-1">
                      <div className="p-1 bg-slate-900 rounded">
                        <span className="text-cyan-400 block text-[10px]">[{contra.claimA.sourceModelOrProvider}]</span>
                        {contra.claimA.text}
                      </div>
                      <div className="p-1 bg-slate-900 rounded">
                        <span className="text-indigo-400 block text-[10px]">[{contra.claimB.sourceModelOrProvider}]</span>
                        {contra.claimB.text}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className="p-3 bg-emerald-950/30 border border-emerald-800/60 rounded-lg flex items-center gap-2 text-emerald-400 text-xs font-mono">
              <ShieldCheck className="w-4 h-4" />
              Không phát hiện mâu thuẫn chéo giữa các nguồn cung cấp. Toàn bộ khẳng định nhất quán.
            </div>
          )}

          {/* Canonical Deduplicated Claims */}
          <div>
            <span className="text-xs font-semibold text-slate-300 block mb-2">
              Khẳng định Chuẩn hóa đã được lọc trùng lặp ({lastResult.canonicalClaims.length} Claims):
            </span>
            <div className="space-y-1.5">
              {lastResult.canonicalClaims.map((claim) => (
                <div key={claim.id} className="p-2.5 rounded bg-slate-950 border border-slate-800 text-xs flex items-start justify-between gap-3">
                  <span className="text-slate-200">{claim.text}</span>
                  <div className="flex items-center gap-2 shrink-0 font-mono text-[10px]">
                    <span className="text-slate-400">{claim.sourceModelOrProvider}</span>
                    <span className="text-cyan-400">{claim.hash}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Artifacts Catalog */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 space-y-3">
        <h3 className="text-sm font-semibold text-slate-200 flex items-center gap-2">
          <Database className="w-4 h-4 text-cyan-400" />
          Danh Mục Tri Thức Đã Tổng Hợp ({artifacts.length})
        </h3>
        <div className="space-y-2">
          {artifacts.map((art) => (
            <div key={art.id} className="p-3 rounded-lg bg-slate-950 border border-slate-800 flex items-center justify-between text-xs">
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-bold text-slate-200">{art.topic}</span>
                  <span
                    className={`text-[10px] px-2 py-0.2 rounded-full font-mono border ${
                      art.badge === 'Gold'
                        ? 'bg-amber-950 text-amber-300 border-amber-700'
                        : art.badge === 'Silver'
                        ? 'bg-slate-800 text-slate-300 border-slate-600'
                        : 'bg-rose-950 text-rose-300 border-rose-800'
                    }`}
                  >
                    {art.badge}
                  </span>
                </div>
                <div className="text-[11px] text-slate-400 mt-1 flex items-center gap-3">
                  <span>Khẳng định: {art.canonicalClaims.length}</span>
                  <span>Mâu thuẫn: {art.contradictionsFound.length}</span>
                  <span>Nguồn: {art.provenance.join(', ')}</span>
                </div>
              </div>
              <span className="font-mono text-cyan-400 text-xs">{(art.consensusScore * 100).toFixed(0)}% Consensus</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
