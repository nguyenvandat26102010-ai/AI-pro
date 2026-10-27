import React, { useState } from 'react';
import {
  GraduationCap,
  BookOpen,
  RotateCcw,
  CheckCircle2,
  Brain,
  TrendingUp,
  Clock,
  Layers,
  ChevronRight,
  Eye,
  Calendar
} from 'lucide-react';
import {
  StudyCenterEngine,
  Flashcard,
  StudyDeck,
  StudyMasteryStats
} from '../modules/studyCenter.ts';

interface StudyCenterViewProps {
  studyCenter: StudyCenterEngine;
}

export const StudyCenterView: React.FC<StudyCenterViewProps> = ({ studyCenter }) => {
  const [decks] = useState<StudyDeck[]>(() => studyCenter.getDecks());
  const [selectedDeckId, setSelectedDeckId] = useState<string>(decks[0]?.id || '');
  const [cards, setCards] = useState<Flashcard[]>(() => studyCenter.getCards(selectedDeckId));
  const [currentCardIndex, setCurrentCardIndex] = useState<number>(0);
  const [isAnswerRevealed, setIsAnswerRevealed] = useState<boolean>(false);
  const [stats, setStats] = useState<StudyMasteryStats>(() => studyCenter.getMasteryStats(selectedDeckId));
  const [lastReviewFeedback, setLastReviewFeedback] = useState<{ ef: number; interval: number; grade: number } | null>(null);

  const currentCard = cards[currentCardIndex];

  const refreshState = (deckId = selectedDeckId) => {
    const freshCards = studyCenter.getCards(deckId);
    setCards(freshCards);
    setStats(studyCenter.getMasteryStats(deckId));
  };

  const handleSelectDeck = (deckId: string) => {
    setSelectedDeckId(deckId);
    setCurrentCardIndex(0);
    setIsAnswerRevealed(false);
    setLastReviewFeedback(null);
    refreshState(deckId);
  };

  const handleRateCard = (grade: number) => {
    if (!currentCard) return;

    const updated = studyCenter.reviewCard(currentCard.id, grade);
    setLastReviewFeedback({
      ef: updated.easinessFactor,
      interval: updated.intervalDays,
      grade
    });

    // Move to next card or loop
    setIsAnswerRevealed(false);
    setCurrentCardIndex((prev) => (prev + 1) % cards.length);
    refreshState();
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-slate-900 border border-slate-800 rounded-xl p-5">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-bold text-white flex items-center gap-2">
              <GraduationCap className="w-5 h-5 text-emerald-400" />
              Study Center — SuperMemo SM-2 &amp; Verifiable Active Recall
            </h1>
            <span className="text-xs px-2.5 py-0.5 rounded-full font-mono bg-emerald-950 text-emerald-300 border border-emerald-800">
              Part 4/5
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Thuật toán lặp lại ngắt quãng SuperMemo SM-2 toán học • Tỷ lệ thành thạo thực nghiệm • Không huy hiệu ảo
          </p>
        </div>

        {/* Deck Selector */}
        <div className="flex items-center gap-2">
          {decks.map((deck) => (
            <button
              key={deck.id}
              onClick={() => handleSelectDeck(deck.id)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                selectedDeckId === deck.id
                  ? 'bg-emerald-600 text-white shadow-sm'
                  : 'bg-slate-950 text-slate-400 hover:text-white border border-slate-800'
              }`}
            >
              {deck.title}
            </button>
          ))}
        </div>
      </div>

      {/* Real Empirical Mastery Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="p-4 rounded-xl bg-slate-900 border border-slate-800">
          <span className="text-[11px] text-slate-400 uppercase tracking-wider block">Thành Thạo Thực Nghiệm</span>
          <div className="flex items-baseline gap-2 mt-1">
            <span className="text-2xl font-bold font-mono text-emerald-400">{stats.masteryPercentage}%</span>
            <span className="text-xs text-slate-500 font-mono">({stats.masteredCards}/{stats.totalCards} thẻ)</span>
          </div>
          <span className="text-[10px] text-slate-500 block mt-0.5">Tiêu chí: Reps ≥ 2 &amp; EF ≥ 2.0</span>
        </div>

        <div className="p-4 rounded-xl bg-slate-900 border border-slate-800">
          <span className="text-[11px] text-slate-400 uppercase tracking-wider block">Ước Tính Ghi Nhớ Trung Bình</span>
          <div className="flex items-baseline gap-2 mt-1">
            <span className="text-2xl font-bold font-mono text-cyan-400">{stats.averageRetentionRate}%</span>
          </div>
          <span className="text-[10px] text-slate-500 block mt-0.5">Hàm số R(t) = exp(-t/S)</span>
        </div>

        <div className="p-4 rounded-xl bg-slate-900 border border-slate-800">
          <span className="text-[11px] text-slate-400 uppercase tracking-wider block">Số Thẻ Đã Ôn Tập</span>
          <div className="flex items-baseline gap-2 mt-1">
            <span className="text-2xl font-bold font-mono text-indigo-400">{stats.reviewedCards}</span>
            <span className="text-xs text-slate-500 font-mono">/ {stats.totalCards}</span>
          </div>
          <span className="text-[10px] text-slate-500 block mt-0.5">Dựa trên lịch sử bài làm thật</span>
        </div>

        <div className="p-4 rounded-xl bg-slate-900 border border-slate-800">
          <span className="text-[11px] text-slate-400 uppercase tracking-wider block">Cần Ôn Tập Hôm Nay</span>
          <div className="flex items-baseline gap-2 mt-1">
            <span className="text-2xl font-bold font-mono text-amber-400">{stats.dueTodayCount}</span>
            <span className="text-xs text-slate-500 font-mono">thẻ đến hạn</span>
          </div>
          <span className="text-[10px] text-slate-500 block mt-0.5">SuperMemo Due Scheduler</span>
        </div>
      </div>

      {/* Main Flashcard Reviewer Deck */}
      {currentCard ? (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          <div className="lg:col-span-8 space-y-4">
            <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 space-y-5">
              <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-mono font-bold text-emerald-400">
                    Thẻ {currentCardIndex + 1}/{cards.length}
                  </span>
                  <div className="flex items-center gap-1">
                    {currentCard.tags.map((t) => (
                      <span key={t} className="text-[10px] px-1.5 py-0.5 rounded bg-slate-950 text-slate-400 border border-slate-800 font-mono">
                        #{t}
                      </span>
                    ))}
                  </div>
                </div>

                <div className="text-xs font-mono text-slate-400 flex items-center gap-3">
                  <span>Reps: {currentCard.repetitions}</span>
                  <span>Interval: {currentCard.intervalDays}d</span>
                  <span>EF: {currentCard.easinessFactor.toFixed(2)}</span>
                </div>
              </div>

              {/* Front Question */}
              <div className="space-y-2">
                <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block">
                  Câu Hỏi (Question / Prompt)
                </span>
                <p className="text-base font-medium text-slate-100 leading-relaxed">
                  {currentCard.question}
                </p>
              </div>

              {/* Reveal Answer Button or Answer Back */}
              {!isAnswerRevealed ? (
                <div className="pt-4 border-t border-slate-800">
                  <button
                    onClick={() => setIsAnswerRevealed(true)}
                    className="w-full py-3 rounded-lg bg-emerald-600/20 hover:bg-emerald-600/30 border border-emerald-500/40 text-emerald-300 font-medium text-xs flex items-center justify-center gap-2 transition-all"
                  >
                    <Eye className="w-4 h-4" />
                    <span>Lật Thẻ Để Xem Đáp Án &amp; Chấm Điểm SM-2</span>
                  </button>
                </div>
              ) : (
                <div className="pt-4 border-t border-slate-800 space-y-4">
                  <div className="p-4 rounded-lg bg-slate-950 border border-slate-800 space-y-2">
                    <span className="text-[11px] font-semibold text-emerald-400 uppercase tracking-wider block">
                      Đáp Án Chuẩn (Reference Answer)
                    </span>
                    <p className="text-xs text-slate-200 leading-relaxed">
                      {currentCard.answer}
                    </p>
                  </div>

                  {/* 6-Grade SM-2 Rating Buttons */}
                  <div className="space-y-2">
                    <span className="text-[11px] text-slate-400 uppercase tracking-wider block font-semibold">
                      Chấm Điểm Đánh Giá Mức Độ Ghi Nhớ (SuperMemo Grade 0 - 5):
                    </span>
                    <div className="grid grid-cols-2 sm:grid-cols-6 gap-2">
                      <button
                        onClick={() => handleRateCard(0)}
                        className="p-2 rounded-lg bg-rose-950/60 hover:bg-rose-900/60 border border-rose-800 text-rose-300 text-xs transition-colors text-center"
                      >
                        <strong className="block text-sm">0</strong>
                        <span className="text-[10px] block">Quên sạch</span>
                      </button>

                      <button
                        onClick={() => handleRateCard(1)}
                        className="p-2 rounded-lg bg-rose-950/40 hover:bg-rose-900/40 border border-rose-800/80 text-rose-300 text-xs transition-colors text-center"
                      >
                        <strong className="block text-sm">1</strong>
                        <span className="text-[10px] block">Sai hoàn toàn</span>
                      </button>

                      <button
                        onClick={() => handleRateCard(2)}
                        className="p-2 rounded-lg bg-amber-950/40 hover:bg-amber-900/40 border border-amber-800/80 text-amber-300 text-xs transition-colors text-center"
                      >
                        <strong className="block text-sm">2</strong>
                        <span className="text-[10px] block">Sai nhớ mang máng</span>
                      </button>

                      <button
                        onClick={() => handleRateCard(3)}
                        className="p-2 rounded-lg bg-indigo-950/40 hover:bg-indigo-900/40 border border-indigo-800/80 text-indigo-300 text-xs transition-colors text-center"
                      >
                        <strong className="block text-sm">3</strong>
                        <span className="text-[10px] block">Khó khăn</span>
                      </button>

                      <button
                        onClick={() => handleRateCard(4)}
                        className="p-2 rounded-lg bg-cyan-950/40 hover:bg-cyan-900/40 border border-cyan-800/80 text-cyan-300 text-xs transition-colors text-center"
                      >
                        <strong className="block text-sm">4</strong>
                        <span className="text-[10px] block">Tốt sau ngập ngừng</span>
                      </button>

                      <button
                        onClick={() => handleRateCard(5)}
                        className="p-2 rounded-lg bg-emerald-950/60 hover:bg-emerald-900/60 border border-emerald-800 text-emerald-300 text-xs transition-colors text-center"
                      >
                        <strong className="block text-sm">5</strong>
                        <span className="text-[10px] block">Hoàn hảo</span>
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {/* Feedback Alert from Last Review */}
              {lastReviewFeedback && (
                <div className="p-3 rounded-lg bg-slate-950 border border-slate-800 flex items-center justify-between text-xs font-mono text-slate-300">
                  <span>Vừa chấm: Điểm {lastReviewFeedback.grade}/5</span>
                  <span className="text-emerald-400">
                    Khoảng lặp mới: {lastReviewFeedback.interval} ngày (EF: {lastReviewFeedback.ef.toFixed(2)})
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* Right Column: SM-2 Mathematical Logic & Attempt History */}
          <div className="lg:col-span-4 space-y-4">
            <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 space-y-3">
              <span className="text-xs font-semibold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
                <Brain className="w-3.5 h-3.5 text-emerald-400" />
                Công Thức SuperMemo SM-2 Thuần
              </span>

              <div className="p-3 rounded-lg bg-slate-950 border border-slate-800 font-mono text-[11px] text-slate-300 space-y-1.5">
                <p className="text-cyan-300 font-bold">EF&apos; = max(1.3, EF + (0.1 - (5-q)*(0.08 + (5-q)*0.02)))</p>
                <p className="text-slate-400">Khi q &lt; 3: n = 0, interval = 1 ngày (Reset)</p>
                <p className="text-slate-400">Khi q ≥ 3:</p>
                <p className="pl-2 text-slate-400">• n=0 → I=1 ngày</p>
                <p className="pl-2 text-slate-400">• n=1 → I=6 ngày</p>
                <p className="pl-2 text-slate-400">• n≥2 → I = round(I * EF&apos;)</p>
              </div>

              <span className="text-[11px] text-slate-500 block">
                Mọi chỉ số ghi nhớ đều được tính chính xác không dùng số liệu giả lập.
              </span>
            </div>

            {/* Recent Attempts on Card */}
            <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 space-y-3">
              <span className="text-xs font-semibold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5 text-indigo-400" />
                Lịch Sử Ôn Tập Của Thẻ
              </span>

              {currentCard.reviewHistory.length > 0 ? (
                <div className="space-y-1.5 max-h-48 overflow-y-auto pr-1">
                  {currentCard.reviewHistory.map((att, i) => (
                    <div key={i} className="p-2 rounded bg-slate-950 border border-slate-800 text-[11px] font-mono flex items-center justify-between text-slate-300">
                      <span>Điểm: <strong className="text-emerald-400">{att.grade}/5</strong></span>
                      <span className="text-slate-500">I: {att.intervalAfter}d • EF: {att.easinessFactorAfter}</span>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-xs text-slate-500 italic">Thẻ mới chưa có lịch sử làm bài.</p>
              )}
            </div>
          </div>
        </div>
      ) : (
        <div className="p-8 rounded-xl bg-slate-900 border border-slate-800 text-center text-slate-500 text-xs">
          Không có thẻ học nào trong bộ bài này.
        </div>
      )}
    </div>
  );
};
