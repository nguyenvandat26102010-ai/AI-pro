/**
 * NDAWG PRO — Game Intelligence Engine
 * Apex Module Intelligence: Part 4/5
 *
 * Implements:
 * 1. Versioned Game Knowledge linked to gameTitle, activePatch, season & update timestamp.
 * 2. 3-Tier Source Provenance (Official Data vs Community Meta vs AI Hypothesis).
 * 3. Automatic Outdated Patch Warnings when strategy references superseded patches.
 * 4. Patch Delta & Strategy Evaluation.
 */

export type GameSourceType = 'OFFICIAL_DATA' | 'COMMUNITY_META' | 'AI_HYPOTHESIS';
export type GameVerificationTier = 'VERIFIED_OFFICIAL' | 'COMMUNITY_SUPPORTED' | 'AI_HYPOTHETICAL_UNVERIFIED';

export interface GameKnowledgeEntry {
  id: string;
  gameTitle: string;
  category: 'CHAMPION_BUILD' | 'MACRO_STRATEGY' | 'ITEM_TIER' | 'PATCH_DELTA';
  subject: string; // e.g. "Aatrox Top Lane" or "Dragon Soul Priority"
  patchVersion: string;
  season: string;
  lastUpdated: string;
  sourceType: GameSourceType;
  verificationTier: GameVerificationTier;
  sourceUrl?: string;
  summary: string;
  buildRecommendations?: {
    coreItems: string[];
    situationalItems: string[];
    winRateSampleCount?: number;
    winRatePercent?: number;
  };
  hypothesisDetails?: {
    isTheoretical: boolean;
    confidenceScore: number;
    disclaimer: string;
  };
}

export interface GameStrategyQueryResult {
  entry: GameKnowledgeEntry;
  currentActivePatch: string;
  isOutdated: boolean;
  outdatedWarning?: string;
  effectiveConfidence: number;
}

export class GameIntelligenceEngine {
  private activePatches: Record<string, string> = {
    'League of Legends': 'v14.12',
    'Dota 2': 'v7.36c',
    'Valorant': 'v8.11',
    'Genshin Impact': 'v4.7'
  };

  private knowledgeBase: GameKnowledgeEntry[] = [];

  constructor() {
    this.seedGameData();
  }

  private seedGameData() {
    this.knowledgeBase = [
      {
        id: 'gk_lol_aatrox_current',
        gameTitle: 'League of Legends',
        category: 'CHAMPION_BUILD',
        subject: 'Aatrox (Top Lane - Bruiser AD)',
        patchVersion: 'v14.12',
        season: 'Season 2026 Split 1',
        lastUpdated: '2026-06-15T00:00:00Z',
        sourceType: 'OFFICIAL_DATA',
        verificationTier: 'VERIFIED_OFFICIAL',
        sourceUrl: 'https://riotgames.com/api/lol/v14.12/champions/aatrox',
        summary: 'Eclipse + Sundered Sky build tối ưu sau khi sát thương cơ bản chiêu Q được buff ở v14.12.',
        buildRecommendations: {
          coreItems: ['Eclipse', 'Sundered Sky', 'Sterak Gage', 'Plated Steelcaps'],
          situationalItems: ['Death Dance', 'Maw of Malmortius', 'Serylda Grudge'],
          winRateSampleCount: 18450,
          winRatePercent: 51.8
        }
      },
      {
        id: 'gk_lol_aatrox_old',
        gameTitle: 'League of Legends',
        category: 'CHAMPION_BUILD',
        subject: 'Aatrox (Top Lane - Lethality Draktharr)',
        patchVersion: 'v13.20',
        season: 'Season 2023 Split 2',
        lastUpdated: '2023-10-12T00:00:00Z',
        sourceType: 'COMMUNITY_META',
        verificationTier: 'COMMUNITY_SUPPORTED',
        sourceUrl: 'https://community.op.gg/trends/aatrox-v13.20',
        summary: 'Lên Dạ Kiếm Draktharr one-shot xạ thủ trong giao tranh tổng.',
        buildRecommendations: {
          coreItems: ['Duskblade of Draktharr', 'Serylda Grudge', 'Edge of Night'],
          situationalItems: ['Ravenous Hydra', 'Guardian Angel'],
          winRateSampleCount: 42000,
          winRatePercent: 49.2
        }
      },
      {
        id: 'gk_lol_theorycraft_ap_kaisa',
        gameTitle: 'League of Legends',
        category: 'CHAMPION_BUILD',
        subject: 'Kai\'Sa (Mid Lane - Full AP Sniper)',
        patchVersion: 'v14.12',
        season: 'Season 2026 Split 1',
        lastUpdated: '2026-06-16T00:00:00Z',
        sourceType: 'AI_HYPOTHESIS',
        verificationTier: 'AI_HYPOTHETICAL_UNVERIFIED',
        summary: 'Giả thuyết chiến thuật AI: Tận dụng tỷ lệ SMPT của chiêu W sau thay đổi chỉ số năng lượng cơ bản.',
        buildRecommendations: {
          coreItems: ['Malignance', 'Shadowflame', 'Rabadon Deathcap', 'Cryptbloom'],
          situationalItems: ['Zhonya Hourglass', 'Banshee Veil']
        },
        hypothesisDetails: {
          isTheoretical: true,
          confidenceScore: 0.68,
          disclaimer: 'Đây là suy luận từ AI dựa trên toán học chỉ số, chưa có kiểm chứng thống kê quy mô lớn từ giải đấu chuyên nghiệp.'
        }
      },
      {
        id: 'gk_dota_invoker',
        gameTitle: 'Dota 2',
        category: 'CHAMPION_BUILD',
        subject: 'Invoker (Mid Lane - Quas/Wex Control)',
        patchVersion: 'v7.36c',
        season: 'TI 2026 Cycle',
        lastUpdated: '2026-06-18T00:00:00Z',
        sourceType: 'COMMUNITY_META',
        verificationTier: 'COMMUNITY_SUPPORTED',
        sourceUrl: 'https://dotabuff.com/heroes/invoker/builds',
        summary: 'Urn of Shadows + Witch Blade tăng tốc gank đường sớm.',
        buildRecommendations: {
          coreItems: ['Urn of Shadows', 'Spirit Vessel', 'Witch Blade', 'Blink Dagger'],
          situationalItems: ['Black King Bar', 'Scythe of Vyse'],
          winRateSampleCount: 12800,
          winRatePercent: 52.4
        }
      }
    ];
  }

  public getActivePatch(gameTitle: string): string {
    return this.activePatches[gameTitle] || 'v1.0';
  }

  public setActivePatch(gameTitle: string, newPatch: string) {
    this.activePatches[gameTitle] = newPatch;
  }

  public getAllEntries(): GameKnowledgeEntry[] {
    return [...this.knowledgeBase];
  }

  /**
   * Queries game knowledge with automatic outdated patch verification.
   */
  public queryStrategy(gameTitle: string, subjectQuery: string): GameStrategyQueryResult | null {
    const activePatch = this.getActivePatch(gameTitle);
    const matches = this.knowledgeBase.filter(
      (k) =>
        k.gameTitle.toLowerCase() === gameTitle.toLowerCase() &&
        k.subject.toLowerCase().includes(subjectQuery.toLowerCase())
    );

    if (matches.length === 0) return null;

    // Pick closest match (prefer current patch if available)
    const exactPatchMatch = matches.find((m) => m.patchVersion === activePatch);
    const target = exactPatchMatch || matches[0];

    const isOutdated = target.patchVersion !== activePatch;
    let outdatedWarning: string | undefined = undefined;

    if (isOutdated) {
      outdatedWarning = `CẢNH BÁO: Dữ liệu thuộc phiên bản cũ (${target.patchVersion}). Phiên bản hiện tại là (${activePatch}). Chiến thuật có thể đã thay đổi do cân bằng tướng/vật phẩm.`;
    }

    let effectiveConfidence = 1.0;
    if (target.verificationTier === 'AI_HYPOTHETICAL_UNVERIFIED') {
      effectiveConfidence = target.hypothesisDetails?.confidenceScore || 0.6;
    } else if (target.verificationTier === 'COMMUNITY_SUPPORTED') {
      effectiveConfidence = 0.85;
    }

    return {
      entry: target,
      currentActivePatch: activePatch,
      isOutdated,
      outdatedWarning,
      effectiveConfidence
    };
  }

  public addEntry(entry: Omit<GameKnowledgeEntry, 'id' | 'lastUpdated'>): GameKnowledgeEntry {
    const newEntry: GameKnowledgeEntry = {
      ...entry,
      id: `gk_${Date.now()}`,
      lastUpdated: new Date().toISOString()
    };
    this.knowledgeBase.unshift(newEntry);
    return newEntry;
  }
}
