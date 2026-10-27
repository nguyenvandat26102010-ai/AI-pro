/**
 * NDAWG PRO — PART 6/8
 * Multi-Model Knowledge Synthesizer
 *
 * Implements claim extraction, token-set & exact-hash deduplication,
 * cross-model contradiction detection, and Knowledge Ingestion Gate (Gold/Silver/Bronze).
 */

import {
  ContradictionPair,
  ExtractedClaim,
  KnowledgeGateBadge,
  SynthesizedKnowledgeArtifact
} from './types.ts';

export class KnowledgeSynthesizer {
  private artifacts: Map<string, SynthesizedKnowledgeArtifact> = new Map();

  constructor() {
    this.seedDefaultArtifacts();
  }

  /**
   * Simple deterministic hash for strings
   */
  private computeSimpleHash(text: string): string {
    let hash = 0;
    const clean = text.toLowerCase().trim().replace(/\s+/g, ' ');
    for (let i = 0; i < clean.length; i++) {
      const char = clean.charCodeAt(i);
      hash = (hash << 5) - hash + char;
      hash |= 0;
    }
    return 'h_' + Math.abs(hash).toString(16);
  }

  /**
   * Token set Jaccard similarity for deduplication (supports Vietnamese & Unicode)
   */
  public computeTokenSimilarity(textA: string, textB: string): number {
    const normalize = (t: string) =>
      t
        .toLowerCase()
        .replace(/[^\p{L}\p{N}\s]/gu, ' ')
        .split(/\s+/)
        .filter((w) => w.length > 0);

    const tokensA = new Set(normalize(textA));
    const tokensB = new Set(normalize(textB));

    if (tokensA.size === 0 && tokensB.size === 0) return 1.0;
    if (tokensA.size === 0 || tokensB.size === 0) return 0.0;

    let intersectionCount = 0;
    for (const t of tokensA) {
      if (tokensB.has(t)) intersectionCount++;
    }

    const unionCount = new Set([...tokensA, ...tokensB]).size;
    return intersectionCount / unionCount;
  }

  /**
   * Detect contradictions between two claims
   */
  public detectContradiction(claimA: ExtractedClaim, claimB: ExtractedClaim): ContradictionPair | null {
    const textA = claimA.text.toLowerCase();
    const textB = claimB.text.toLowerCase();

    // Check for direct negation patterns
    const negationKeywords = ['không', 'chưa bao giờ', 'ngừng', 'sai', 'not', 'never', 'false', 'deprecated'];
    const hasNegationA = negationKeywords.some((w) => textA.includes(w));
    const hasNegationB = negationKeywords.some((w) => textB.includes(w));

    // High similarity in subject but opposite polarity
    const sim = this.computeTokenSimilarity(textA, textB);
    if (sim >= 0.25 && hasNegationA !== hasNegationB) {
      return {
        claimA,
        claimB,
        topic: 'Negation Conflict',
        reason: `Mâu thuẫn khẳng định/phủ định giữa nguồn "${claimA.sourceModelOrProvider}" và "${claimB.sourceModelOrProvider}".`,
        severity: 'HIGH'
      };
    }

    // Number extraction conflict
    const numsA: string[] = textA.match(/\d+(?:\.\d+)?/g) || [];
    const numsB: string[] = textB.match(/\d+(?:\.\d+)?/g) || [];
    const diffNumsA = numsA.filter((n: string) => !numsB.includes(n));
    const diffNumsB = numsB.filter((n: string) => !numsA.includes(n));
    if (sim >= 0.25 && diffNumsA.length > 0 && diffNumsB.length > 0) {
      return {
        claimA,
        claimB,
        topic: 'Numerical Conflict',
        reason: `Số liệu không khớp: Nguồn A ghi "${diffNumsA.join(', ')}" nhưng Nguồn B ghi "${diffNumsB.join(', ')}".`,
        severity: 'MEDIUM'
      };
    }

    return null;
  }

  /**
   * Ingest and synthesize claims from multiple sources
   */
  public synthesize(
    topic: string,
    rawClaims: Array<{ text: string; source: string; confidence?: number }>
  ): SynthesizedKnowledgeArtifact {
    const extractedClaims: ExtractedClaim[] = rawClaims.map((rc, idx) => ({
      id: `claim_${Date.now()}_${idx}`,
      text: rc.text.trim(),
      sourceModelOrProvider: rc.source,
      confidence: rc.confidence ?? 0.85,
      timestamp: Date.now(),
      hash: this.computeSimpleHash(rc.text)
    }));

    // Step 1: Deduplication
    const canonicalClaims: ExtractedClaim[] = [];
    let deduplicatedCount = 0;

    for (const claim of extractedClaims) {
      const isDuplicate = canonicalClaims.some(
        (c) => c.hash === claim.hash || this.computeTokenSimilarity(c.text, claim.text) > 0.82
      );

      if (isDuplicate) {
        deduplicatedCount++;
      } else {
        canonicalClaims.push(claim);
      }
    }

    // Step 2: Cross-Contradiction Analysis
    const contradictionsFound: ContradictionPair[] = [];
    for (let i = 0; i < canonicalClaims.length; i++) {
      for (let j = i + 1; j < canonicalClaims.length; j++) {
        const contra = this.detectContradiction(canonicalClaims[i], canonicalClaims[j]);
        if (contra) {
          contradictionsFound.push(contra);
        }
      }
    }

    // Step 3: Provenance count
    const providers = Array.from(new Set(rawClaims.map((c) => c.source)));

    // Step 4: Consensus Score & Ingestion Gate Badge
    const highSeverityContras = contradictionsFound.filter((c) => c.severity === 'HIGH').length;
    let consensusScore = 1.0;
    if (contradictionsFound.length > 0) {
      consensusScore = Math.max(0.1, 1.0 - contradictionsFound.length * 0.25);
    }

    let badge: KnowledgeGateBadge = 'Bronze';
    let ingestionPassed = false;

    if (providers.length >= 2 && highSeverityContras === 0 && consensusScore >= 0.8) {
      badge = 'Gold';
      ingestionPassed = true;
    } else if (highSeverityContras === 0 && consensusScore >= 0.6) {
      badge = 'Silver';
      ingestionPassed = true;
    } else {
      badge = 'Bronze';
      ingestionPassed = false;
    }

    const artifact: SynthesizedKnowledgeArtifact = {
      id: `art_${Date.now()}_${Math.floor(Math.random() * 1000)}`,
      topic,
      badge,
      canonicalClaims,
      deduplicatedCount,
      contradictionsFound,
      consensusScore,
      provenance: providers,
      ingestionPassed
    };

    this.artifacts.set(artifact.id, artifact);
    return artifact;
  }

  public getArtifacts(): SynthesizedKnowledgeArtifact[] {
    return Array.from(this.artifacts.values());
  }

  public getArtifactById(id: string): SynthesizedKnowledgeArtifact | null {
    return this.artifacts.get(id) || null;
  }

  private seedDefaultArtifacts() {
    this.synthesize('Kiến trúc Transformer & Attention', [
      { text: 'Transformer dựa hoàn toàn trên cơ chế Self-Attention thay cho RNN và CNN.', source: 'Gemini 2.5 Pro' },
      { text: 'Cơ chế Self-Attention tính toán ma trận Q, K, V với độ phức tạp bậc hai O(N^2).', source: 'Claude 3.7 Sonnet' },
      { text: 'Transformer dựa trên cơ chế Self-Attention thay thế kiến trúc tuần hoàn.', source: 'GPT-4o' } // near duplicate
    ]);

    this.synthesize('So sánh hiệu năng FP8 trên GPU H100', [
      { text: 'GPU NVIDIA H100 hỗ trợ định dạng số học FP8 với thông lượng tính toán Tensor Core 2000 TFLOPS.', source: 'Hardware Whitepaper' },
      { text: 'Định dạng FP8 trên H100 cung cấp thông lượng khoảng 2000 TFLOPS cho phép huấn luyện nhanh gấp đôi FP16.', source: 'NVIDIA Technical Docs' }
    ]);
  }
}
