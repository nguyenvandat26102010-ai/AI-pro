import React, { useState } from 'react';
import {
  Gamepad2,
  AlertTriangle,
  CheckCircle2,
  Shield,
  Search,
  Plus,
  Flame,
  Clock,
  Sparkles,
  ExternalLink
} from 'lucide-react';
import {
  GameIntelligenceEngine,
  GameKnowledgeEntry,
  GameStrategyQueryResult,
  GameSourceType,
  GameVerificationTier
} from '../modules/gameIntelligence.ts';

interface GameIntelligenceViewProps {
  gameIntelligence: GameIntelligenceEngine;
}

export const GameIntelligenceView: React.FC<GameIntelligenceViewProps> = ({ gameIntelligence }) => {
  const [selectedGame, setSelectedGame] = useState<string>('League of Legends');
  const [searchQuery, setSearchQuery] = useState<string>('Aatrox');
  const [queryResult, setQueryResult] = useState<GameStrategyQueryResult | null>(() =>
    gameIntelligence.queryStrategy('League of Legends', 'Aatrox')
  );
  const [entries, setEntries] = useState<GameKnowledgeEntry[]>(() => gameIntelligence.getAllEntries());

  const activePatch = gameIntelligence.getActivePatch(selectedGame);

  const handleSearch = (subject: string) => {
    setSearchQuery(subject);
    const res = gameIntelligence.queryStrategy(selectedGame, subject);
    setQueryResult(res);
  };

  const handleGameChange = (game: string) => {
    setSelectedGame(game);
    const res = gameIntelligence.queryStrategy(game, searchQuery);
    setQueryResult(res);
  };

  const handlePatchChange = (newPatch: string) => {
    gameIntelligence.setActivePatch(selectedGame, newPatch);
    const res = gameIntelligence.queryStrategy(selectedGame, searchQuery);
    setQueryResult(res);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-slate-900 border border-slate-800 rounded-xl p-5">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-bold text-white flex items-center gap-2">
              <Gamepad2 className="w-5 h-5 text-amber-400" />
              Game Intelligence — Versioned Meta &amp; Strategy Engine
            </h1>
            <span className="text-xs px-2.5 py-0.5 rounded-full font-mono bg-amber-950 text-amber-300 border border-amber-800">
              Part 4/5
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Gắn kết phiên bản (Patch/Season) • 3 Cấp độ nguồn gốc (Official / Community / AI Hypothesis) • Cảnh báo dữ liệu phiên bản cũ
          </p>
        </div>

        {/* Game Switcher & Active Patch Badge */}
        <div className="flex items-center gap-2">
          {['League of Legends', 'Dota 2', 'Valorant'].map((g) => (
            <button
              key={g}
              onClick={() => handleGameChange(g)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                selectedGame === g
                  ? 'bg-amber-600 text-white shadow-sm'
                  : 'bg-slate-950 text-slate-400 hover:text-white border border-slate-800'
              }`}
            >
              {g}
            </button>
          ))}
        </div>
      </div>

      {/* Active Patch Status & Manual Patch Toggle (for demonstration) */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 flex flex-wrap items-center justify-between gap-3 text-xs">
        <div className="flex items-center gap-3">
          <span className="text-slate-400">Game đang chọn:</span>
          <span className="font-bold text-white font-mono">{selectedGame}</span>
          <span className="text-slate-500">|</span>
          <span className="text-slate-400">Phiên bản hiện hành:</span>
          <span className="px-2 py-0.5 rounded bg-emerald-950 text-emerald-300 border border-emerald-800 font-mono font-bold">
            {activePatch}
          </span>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-slate-400">Chuyển thử nghiệm phiên bản:</span>
          {selectedGame === 'League of Legends' && (
            <>
              <button
                onClick={() => handlePatchChange('v14.12')}
                className={`px-2 py-1 rounded font-mono ${
                  activePatch === 'v14.12'
                    ? 'bg-amber-600 text-white'
                    : 'bg-slate-950 text-slate-400 border border-slate-800'
                }`}
              >
                v14.12 (Mới nhất)
              </button>
              <button
                onClick={() => handlePatchChange('v14.10')}
                className={`px-2 py-1 rounded font-mono ${
                  activePatch === 'v14.10'
                    ? 'bg-amber-600 text-white'
                    : 'bg-slate-950 text-slate-400 border border-slate-800'
                }`}
              >
                v14.10 (Cũ hơn)
              </button>
            </>
          )}
        </div>
      </div>

      {/* Search Bar & Quick Subjects */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 space-y-3">
        <div className="flex items-center gap-2">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-500 absolute left-3 top-2.5" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => handleSearch(e.target.value)}
              placeholder="Tìm kiếm tướng, chiến thuật, hoặc meta (VD: Aatrox, Draktharr, AP Sniper)..."
              className="w-full pl-9 pr-3 py-2 bg-slate-950 border border-slate-700 rounded-lg text-xs text-slate-200 focus:outline-none focus:border-amber-500"
            />
          </div>
        </div>

        <div className="flex items-center gap-2 text-xs">
          <span className="text-slate-500 text-[11px]">Gợi ý tra cứu:</span>
          {['Aatrox', 'Lethality Draktharr', 'AP Sniper', 'Invoker'].map((s) => (
            <button
              key={s}
              onClick={() => handleSearch(s)}
              className="px-2 py-1 rounded bg-slate-950 hover:bg-slate-800 text-slate-300 text-[11px] border border-slate-800"
            >
              {s}
            </button>
          ))}
        </div>
      </div>

      {/* Query Result Card with Outdated Warning */}
      {queryResult ? (
        <div className="space-y-4">
          {/* Outdated Patch Banner if applicable */}
          {queryResult.isOutdated && (
            <div className="p-4 rounded-xl bg-amber-950/80 border border-amber-700 text-amber-200 text-xs flex items-start gap-3 shadow-lg shadow-amber-950/40">
              <AlertTriangle className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
              <div className="flex-1">
                <span className="font-bold uppercase tracking-wider block text-amber-300">
                  CẢNH BÁO DỮ LIỆU PHIÊN BẢN CŨ (OUTDATED METADATA)
                </span>
                <p className="mt-1 font-mono text-[11px] leading-relaxed">
                  {queryResult.outdatedWarning}
                </p>
                <p className="mt-1 text-slate-300 text-[11px]">
                  Phiên bản của hướng dẫn này là <span className="font-bold text-amber-300 font-mono">{queryResult.entry.patchVersion}</span>, trong khi máy chủ chính thức đang chạy <span className="font-bold text-emerald-300 font-mono">{queryResult.currentActivePatch}</span>. Tỷ lệ thắng và sự hiệu quả có thể không còn chính xác.
                </p>
              </div>
            </div>
          )}

          {/* Strategy Details Card */}
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-800 pb-3">
              <div>
                <h3 className="text-base font-bold text-white flex items-center gap-2">
                  <span>{queryResult.entry.subject}</span>
                  <span
                    className={`text-[10px] font-mono px-2 py-0.5 rounded border ${
                      queryResult.entry.sourceType === 'OFFICIAL_DATA'
                        ? 'bg-emerald-950 text-emerald-300 border-emerald-800'
                        : queryResult.entry.sourceType === 'COMMUNITY_META'
                        ? 'bg-indigo-950 text-indigo-300 border-indigo-800'
                        : 'bg-amber-950 text-amber-300 border-amber-800'
                    }`}
                  >
                    {queryResult.entry.sourceType.replace('_', ' ')}
                  </span>
                </h3>
                <span className="text-xs text-slate-400 font-mono">
                  Patch: {queryResult.entry.patchVersion} • Season: {queryResult.entry.season} • Cập nhật: {new Date(queryResult.entry.lastUpdated).toLocaleDateString()}
                </span>
              </div>

              <div className="flex items-center gap-2">
                <span className="text-xs text-slate-400">Độ tin cậy:</span>
                <span className="text-sm font-bold font-mono text-cyan-400">
                  {(queryResult.effectiveConfidence * 100).toFixed(0)}%
                </span>
              </div>
            </div>

            <p className="text-xs text-slate-300 leading-relaxed">
              {queryResult.entry.summary}
            </p>

            {/* AI Hypothesis Disclaimer if applicable */}
            {queryResult.entry.hypothesisDetails?.isTheoretical && (
              <div className="p-3 rounded-lg bg-indigo-950/40 border border-indigo-800/80 text-xs text-indigo-300 space-y-1">
                <div className="flex items-center gap-2 font-semibold">
                  <Sparkles className="w-3.5 h-3.5 text-indigo-400" />
                  <span>SỞ HỮU TRÍ THỨC: GIẢ THUYẾT CHIẾN THUẬT AI</span>
                </div>
                <p className="text-[11px] text-indigo-200">
                  {queryResult.entry.hypothesisDetails.disclaimer}
                </p>
              </div>
            )}

            {/* Build Itemization */}
            {queryResult.entry.buildRecommendations && (
              <div className="space-y-3 pt-2">
                <div>
                  <span className="text-[11px] uppercase tracking-wider text-slate-400 font-semibold block mb-1.5">
                    Trang Bị Cốt Lõi (Core Itemization)
                  </span>
                  <div className="flex flex-wrap gap-2">
                    {queryResult.entry.buildRecommendations.coreItems.map((item) => (
                      <span
                        key={item}
                        className="px-2.5 py-1 rounded bg-slate-950 border border-slate-700 text-xs font-medium text-amber-200 shadow-sm"
                      >
                        {item}
                      </span>
                    ))}
                  </div>
                </div>

                {queryResult.entry.buildRecommendations.situationalItems && (
                  <div>
                    <span className="text-[11px] uppercase tracking-wider text-slate-400 font-semibold block mb-1.5">
                      Trang Bị Tình Huống (Situational Options)
                    </span>
                    <div className="flex flex-wrap gap-2">
                      {queryResult.entry.buildRecommendations.situationalItems.map((item) => (
                        <span
                          key={item}
                          className="px-2 py-0.5 rounded bg-slate-950 border border-slate-800 text-xs text-slate-300"
                        >
                          {item}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {queryResult.entry.buildRecommendations.winRatePercent && (
                  <div className="p-3 rounded-lg bg-slate-950 border border-slate-800 flex items-center justify-between text-xs font-mono">
                    <span className="text-slate-400">
                      Tỷ lệ thắng thực nghiệm: <strong className="text-emerald-400">{queryResult.entry.buildRecommendations.winRatePercent}%</strong>
                    </span>
                    <span className="text-slate-500">
                      Cỡ mẫu: {queryResult.entry.buildRecommendations.winRateSampleCount?.toLocaleString()} trận
                    </span>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      ) : (
        <div className="p-8 rounded-xl bg-slate-900 border border-slate-800 text-center text-slate-500 text-xs">
          Không tìm thấy chiến thuật phù hợp với truy vấn &quot;{searchQuery}&quot;. Hãy thử từ khóa khác.
        </div>
      )}
    </div>
  );
};
