/**
 * NDAWG PRO — Study Center Engine
 * Apex Module Intelligence: Part 4/5
 *
 * Implements:
 * 1. SuperMemo SM-2 Spaced Repetition Algorithm (exact mathematical formula).
 * 2. Memory retention estimation R(t) = exp(-t / S).
 * 3. Empirical attempt history and real mastery percentage calculation (zero fake achievements).
 * 4. Deck & Flashcard management.
 */

export interface ReviewAttempt {
  timestamp: string;
  grade: number; // 0 to 5
  intervalAfter: number;
  easinessFactorAfter: number;
}

export interface Flashcard {
  id: string;
  deckId: string;
  question: string;
  answer: string;
  tags: string[];
  intervalDays: number;
  repetitions: number;
  easinessFactor: number; // starts at 2.5, min 1.3
  lastReviewedAt: string | null;
  nextReviewDate: string;
  reviewHistory: ReviewAttempt[];
}

export interface StudyDeck {
  id: string;
  title: string;
  subject: string;
  description: string;
  createdAt: string;
}

export interface StudyMasteryStats {
  totalCards: number;
  reviewedCards: number;
  masteredCards: number; // cards with repetitions >= 2 and EF >= 2.0
  masteryPercentage: number; // 0 to 100% strictly computed from attempts
  averageRetentionRate: number; // estimated average retention across deck
  dueTodayCount: number;
}

export class StudyCenterEngine {
  private decks: StudyDeck[] = [];
  private cards: Flashcard[] = [];

  constructor() {
    this.seedStudyData();
  }

  private seedStudyData() {
    this.decks = [
      {
        id: 'deck_ai_governance',
        title: 'AI Governance & Model Safety',
        subject: 'AI Alignment & Security',
        description: 'Core concepts in constitutional limits, prompt injection defenses, and legal registries.',
        createdAt: '2026-05-01T00:00:00Z'
      },
      {
        id: 'deck_algo_ds',
        title: 'Distributed Systems & Consensus',
        subject: 'Computer Science',
        description: 'Raft, Paxos, vector clocks, and hash-chain audit ledgers.',
        createdAt: '2026-05-10T00:00:00Z'
      }
    ];

    this.cards = [
      {
        id: 'card_gov_01',
        deckId: 'deck_ai_governance',
        question: 'Tại sao cờ train_on_output và cache_output phải mặc định là DENY?',
        answer: 'Để bảo vệ quyền sở hữu trí tuệ, ngăn rò rỉ dữ liệu người dùng và tuân thủ điều khoản dịch vụ (TOS) của nhà cung cấp API thương mại.',
        tags: ['legal', 'terms', 'privacy'],
        intervalDays: 6,
        repetitions: 2,
        easinessFactor: 2.5,
        lastReviewedAt: new Date(Date.now() - 86400000 * 2).toISOString(),
        nextReviewDate: new Date(Date.now() + 86400000 * 4).toISOString(),
        reviewHistory: [
          { timestamp: new Date(Date.now() - 86400000 * 8).toISOString(), grade: 4, intervalAfter: 1, easinessFactorAfter: 2.5 },
          { timestamp: new Date(Date.now() - 86400000 * 2).toISOString(), grade: 5, intervalAfter: 6, easinessFactorAfter: 2.6 }
        ]
      },
      {
        id: 'card_gov_02',
        deckId: 'deck_ai_governance',
        question: 'Hệ thống 3-Tier Agent Permissions phân cấp hành động như thế nào?',
        answer: 'Tier 1 (Read: tự động), Tier 2 (Reversible Write: yêu cầu snapshot & payload hoàn tác), Tier 3 (Irreversible: bắt buộc xác nhận modal người dùng).',
        tags: ['security', 'governor', 'permissions'],
        intervalDays: 1,
        repetitions: 1,
        easinessFactor: 2.36,
        lastReviewedAt: new Date(Date.now() - 86400000).toISOString(),
        nextReviewDate: new Date().toISOString(),
        reviewHistory: [
          { timestamp: new Date(Date.now() - 86400000).toISOString(), grade: 3, intervalAfter: 1, easinessFactorAfter: 2.36 }
        ]
      },
      {
        id: 'card_gov_03',
        deckId: 'deck_ai_governance',
        question: 'Nguyên lý tam quyền phân lập (Planner - Executor - Verifier) trong Reliable Agent là gì?',
        answer: 'Planner chỉ lập kế hoạch và đặt tiêu chí; Executor gọi công cụ; Verifier độc lập nghiệm thu. Planner tuyệt đối không được tự nghiệm thu (no self-certification).',
        tags: ['agent', 'architecture', 'reliability'],
        intervalDays: 0,
        repetitions: 0,
        easinessFactor: 2.5,
        lastReviewedAt: null,
        nextReviewDate: new Date().toISOString(),
        reviewHistory: []
      }
    ];
  }

  public getDecks(): StudyDeck[] {
    return [...this.decks];
  }

  public getCards(deckId?: string): Flashcard[] {
    if (deckId) {
      return this.cards.filter((c) => c.deckId === deckId);
    }
    return [...this.cards];
  }

  /**
   * Evaluates card review using mathematical SuperMemo SM-2 algorithm:
   *
   * EF' = max(1.3, EF + (0.1 - (5 - q) * (0.08 + (5 - q) * 0.02)))
   *
   * If q < 3: n = 0, interval = 1
   * If q >= 3:
   *   n = 0 -> interval = 1
   *   n = 1 -> interval = 6
   *   n >= 2 -> interval = round(interval * EF')
   *   n = n + 1
   */
  public reviewCard(cardId: string, grade: number): Flashcard {
    if (grade < 0 || grade > 5) {
      throw new Error(`INVALID_GRADE: Review grade must be integer between 0 and 5, received ${grade}`);
    }

    const card = this.cards.find((c) => c.id === cardId);
    if (!card) {
      throw new Error(`CARD_NOT_FOUND: Card ID ${cardId} does not exist.`);
    }

    const q = grade;
    const oldEF = card.easinessFactor;
    const oldRepetitions = card.repetitions;
    const oldInterval = card.intervalDays;

    // Calculate new Easiness Factor (EF)
    const deltaEF = 0.1 - (5 - q) * (0.08 + (5 - q) * 0.02);
    const newEF = Math.max(1.3, Number((oldEF + deltaEF).toFixed(3)));

    let newRepetitions = 0;
    let newInterval = 1;

    if (q >= 3) {
      if (oldRepetitions === 0) {
        newInterval = 1;
      } else if (oldRepetitions === 1) {
        newInterval = 6;
      } else {
        newInterval = Math.max(1, Math.round(oldInterval * newEF));
      }
      newRepetitions = oldRepetitions + 1;
    } else {
      // Repetition lapsed / forgotten
      newRepetitions = 0;
      newInterval = 1;
    }

    const now = new Date();
    const nextReview = new Date(now.getTime() + newInterval * 86400000);

    card.easinessFactor = newEF;
    card.repetitions = newRepetitions;
    card.intervalDays = newInterval;
    card.lastReviewedAt = now.toISOString();
    card.nextReviewDate = nextReview.toISOString();
    card.reviewHistory.push({
      timestamp: now.toISOString(),
      grade: q,
      intervalAfter: newInterval,
      easinessFactorAfter: newEF
    });

    return { ...card };
  }

  /**
   * Calculates retention probability R(t) = exp(-t / S)
   * where t is days since last review and S is memory stability.
   */
  public calculateRetention(card: Flashcard, daysElapsed: number): number {
    if (card.repetitions === 0 || !card.lastReviewedAt) {
      return 0.5; // Baseline unlearned retention
    }
    const stability = Math.max(1, card.intervalDays * (card.easinessFactor / 2.5));
    const retention = Math.exp(-Math.max(0, daysElapsed) / stability);
    return Math.min(1.0, Math.max(0.01, Number(retention.toFixed(3))));
  }

  /**
   * Computes genuine mastery statistics based strictly on empirical attempts.
   */
  public getMasteryStats(deckId?: string): StudyMasteryStats {
    const targetCards = this.getCards(deckId);
    const totalCards = targetCards.length;
    if (totalCards === 0) {
      return {
        totalCards: 0,
        reviewedCards: 0,
        masteredCards: 0,
        masteryPercentage: 0,
        averageRetentionRate: 0,
        dueTodayCount: 0
      };
    }

    const reviewedCards = targetCards.filter((c) => c.reviewHistory.length > 0).length;
    const masteredCards = targetCards.filter((c) => c.repetitions >= 2 && c.easinessFactor >= 2.0).length;
    const masteryPercentage = Number(((masteredCards / totalCards) * 100).toFixed(1));

    const now = new Date();
    const dueTodayCount = targetCards.filter((c) => new Date(c.nextReviewDate) <= now).length;

    let totalRetention = 0;
    for (const card of targetCards) {
      if (card.lastReviewedAt) {
        const elapsedDays = (now.getTime() - new Date(card.lastReviewedAt).getTime()) / 86400000;
        totalRetention += this.calculateRetention(card, elapsedDays);
      } else {
        totalRetention += 0.5;
      }
    }
    const averageRetentionRate = Number(((totalRetention / totalCards) * 100).toFixed(1));

    return {
      totalCards,
      reviewedCards,
      masteredCards,
      masteryPercentage,
      averageRetentionRate,
      dueTodayCount
    };
  }

  public addCard(deckId: string, question: string, answer: string, tags: string[] = []): Flashcard {
    const card: Flashcard = {
      id: `card_${Date.now()}_${Math.floor(Math.random() * 1000)}`,
      deckId,
      question,
      answer,
      tags,
      intervalDays: 0,
      repetitions: 0,
      easinessFactor: 2.5,
      lastReviewedAt: null,
      nextReviewDate: new Date().toISOString(),
      reviewHistory: []
    };
    this.cards.push(card);
    return card;
  }
}
