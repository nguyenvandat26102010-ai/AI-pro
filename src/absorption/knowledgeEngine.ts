/**
 * NDAWG PRO — VERIFIED KNOWLEDGE ENGINE & CLAIM RESEARCH ENGINE
 * Stores verified, cited, and temporally-bounded knowledge items.
 *
 * Core rule:
 * ABSORPTION = MEASURE → VERIFY → STORE WITH CITATION → REUSE UNDER TERMS.
 * Never store unverified AI output as objective fact.
 */

import {
  ClaimVerificationStatus,
  ConflictEdge,
  ReusePolicy,
  SourceRankingTier,
  VerifiedClaim
} from './types.ts';
import { ProviderTermsRegistry } from './providerTermsRegistry.ts';

export const INITIAL_VERIFIED_CLAIMS: VerifiedClaim[] = [
  {
    id: 'claim_101',
    claim: 'Google Gemini 2.5 Flash supports a 1,000,000 token context window with multimodal inputs.',
    short_explanation: 'Official Gemini API specifications confirm 1M token context capacity for Flash models.',
    source_url: 'https://ai.google.dev/gemini-api/docs/models/gemini',
    source_title: 'Gemini Models Documentation',
    source_rank: 'TIER_1_OFFICIAL',
    published_date: '2026-02-15',
    accessed_date: '2026-10-18',
    verification_method: 'Primary documentation verification and API endpoint parameter validation.',
    independent_supporting_sources: [
      'https://cloud.google.com/vertex-ai/docs/generative-ai/model-reference/gemini'
    ],
    contradiction_level: 'NONE',
    effective_date: '2026-02-15',
    review_due_date: '2026-12-31',
    verification_status: 'Verified',
    origin_provider: 'gemini-2.5-flash',
    reuse_policy: 'store-with-citation',
    storage_permission_granted: true,
    is_accessible_url: true,
    version: 1,
    change_log: [
      {
        timestamp: '2026-10-18T10:00:00Z',
        note: 'Initial verified entry from primary Google Cloud documentation.',
        changedBy: 'analyst_lead_01'
      }
    ]
  },
  {
    id: 'claim_102',
    claim: 'Anthropic Claude 3.5 Sonnet supports computer use and API tool calling with prompt caching.',
    short_explanation: 'Anthropic documentation details prompt caching and desktop agent interaction capabilities.',
    source_url: 'https://docs.anthropic.com/en/docs/build-with-claude/prompt-caching',
    source_title: 'Anthropic Prompt Caching Guide',
    source_rank: 'TIER_1_OFFICIAL',
    published_date: '2024-10-22',
    accessed_date: '2026-10-10',
    verification_method: 'Verified against official technical documentation.',
    independent_supporting_sources: [],
    contradiction_level: 'NONE',
    effective_date: '2024-10-22',
    review_due_date: '2026-11-30',
    verification_status: 'Verified',
    origin_provider: 'claude-3-5-sonnet',
    reuse_policy: 'store-with-citation',
    storage_permission_granted: true,
    is_accessible_url: true,
    version: 1,
    change_log: [
      {
        timestamp: '2026-10-10T12:00:00Z',
        note: 'Verified from Anthropic official documentation.',
        changedBy: 'analyst_lead_01'
      }
    ]
  },
  {
    id: 'claim_103',
    claim: 'Early benchmark report claimed Model Z achieved 98.4% on GSM8K without chain of thought.',
    short_explanation: 'Self-reported vendor pre-print claim contradicted by independent university replication showing 81.2%.',
    source_url: 'https://arxiv.org/abs/sample-pre-print-z',
    source_title: 'Preprint Vendor Technical Report',
    source_rank: 'TIER_2_ACADEMIC',
    published_date: '2025-06-01',
    accessed_date: '2026-08-01',
    verification_method: 'Cross-benchmarking across independent test harness.',
    independent_supporting_sources: [],
    contradiction_level: 'HIGH',
    effective_date: '2025-06-01',
    review_due_date: '2026-09-01',
    verification_status: 'Conflicting evidence',
    origin_provider: 'unverified-external-model-x',
    reuse_policy: 'store-with-citation',
    storage_permission_granted: true,
    is_accessible_url: true,
    version: 1,
    change_log: [
      {
        timestamp: '2026-08-01T15:00:00Z',
        note: 'Contradiction flagged: independent replication failed to reproduce vendor claim.',
        changedBy: 'evaluator_apex'
      }
    ]
  },
  {
    id: 'claim_104',
    claim: 'Legacy framework v1.2 deprecated security tokens on December 31, 2024.',
    short_explanation: 'Historical deprecation notice. Review date has passed and needs re-audit.',
    source_url: 'https://example.org/security-notice-2024',
    source_title: 'Security Advisory 2024-12',
    source_rank: 'TIER_3_REPUTABLE_PRESS',
    published_date: '2024-01-15',
    accessed_date: '2024-02-01',
    verification_method: 'Archival notice review.',
    independent_supporting_sources: [],
    contradiction_level: 'LOW',
    effective_date: '2024-01-15',
    review_due_date: '2024-12-31', // EXPIRED (Outdated)
    verification_status: 'Outdated',
    origin_provider: 'gemini-2.5-flash',
    reuse_policy: 'store-with-citation',
    storage_permission_granted: true,
    is_accessible_url: true,
    version: 1,
    change_log: [
      {
        timestamp: '2024-02-01T09:00:00Z',
        note: 'Initial entry from 2024 security advisory.',
        changedBy: 'system'
      }
    ]
  }
];

export const INITIAL_CONFLICT_EDGES: ConflictEdge[] = [
  {
    id: 'conflict_edge_01',
    claimAId: 'claim_103',
    claimBId: 'claim_103_replication',
    natureOfConflict: 'Mathematical reasoning accuracy benchmark divergence (98.4% vs 81.2%)',
    perspectiveA: 'Vendor preprint claims 98.4% with custom few-shot prompt formulation.',
    perspectiveB: 'Independent university lab benchmark replicates only 81.2% under standardized zero-leakage evaluation.',
    evidenceA: ['https://arxiv.org/abs/sample-pre-print-z'],
    evidenceB: ['https://benchmark-lab.edu/reproduction-study-2025'],
    unresolvedReason: 'Prompt sensitivity and test-set contamination under vendor testing remains unresolved.',
    status: 'OPEN_DEBATE'
  }
];

export class KnowledgeEngine {
  private claims: Map<string, VerifiedClaim>;
  private conflicts: ConflictEdge[];
  private ephemeralCache: Map<string, { data: string; expiresAt: number }>;

  constructor(
    initialClaims: VerifiedClaim[] = INITIAL_VERIFIED_CLAIMS,
    initialConflicts: ConflictEdge[] = INITIAL_CONFLICT_EDGES
  ) {
    this.claims = new Map();
    for (const c of initialClaims) {
      this.claims.set(c.id, { ...c });
    }
    this.conflicts = [...initialConflicts];
    this.ephemeralCache = new Map();
  }

  public getAllClaims(): VerifiedClaim[] {
    return Array.from(this.claims.values());
  }

  public getClaim(id: string): VerifiedClaim | null {
    return this.claims.has(id) ? { ...this.claims.get(id)! } : null;
  }

  public getAllConflicts(): ConflictEdge[] {
    return [...this.conflicts];
  }

  /**
   * Evaluates and adds a claim into the Verified Knowledge Base.
   *
   * Enforces:
   * 1. reuse_policy rules:
   *    - 'no-store': strictly BLOCKED from persistent knowledge base.
   *    - 'cache-only': only placed in ephemeral memory, not persisted.
   *    - 'store-with-citation': requires verified source and provider terms check.
   * 2. Provider Terms Registry check:
   *    - Must permit allow_knowledge_base_reuse.
   * 3. Sourcing:
   *    - If no source is provided or URL is inaccessible, status defaults to 'Unverified'.
   * 4. Temporal Validity check:
   *    - If review_due_date is in the past, status is set to 'Outdated'.
   */
  public addClaim(
    claimInput: Omit<VerifiedClaim, 'id' | 'version' | 'change_log'>,
    termsRegistry: ProviderTermsRegistry
  ): { success: boolean; claim?: VerifiedClaim; error?: string } {
    // 1. Strict check: 'no-store' policy
    if (claimInput.reuse_policy === 'no-store') {
      return {
        success: false,
        error: "Action rejected: reuse_policy is set to 'no-store'. This data is legally prohibited from being written to the persistent knowledge base."
      };
    }

    // 2. Check: 'cache-only' policy
    if (claimInput.reuse_policy === 'cache-only') {
      const cacheId = `cache_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`;
      this.ephemeralCache.set(cacheId, {
        data: claimInput.claim,
        expiresAt: Date.now() + 300000 // 5 minutes TTL
      });
      return {
        success: false,
        error: "Action routed: reuse_policy is 'cache-only'. Data placed in ephemeral transient cache with 5-minute TTL; excluded from persistent knowledge base."
      };
    }

    // 3. Provider Terms validation
    const termsCheck = termsRegistry.validateActionPermissions(
      claimInput.origin_provider,
      'KB_REUSE'
    );
    if (!termsCheck.allowed) {
      return {
        success: false,
        error: `Provider terms restriction: ${termsCheck.reason}`
      };
    }

    // 4. Source validation: Claims without source or with inaccessible URL must be 'Unverified'
    let finalStatus: ClaimVerificationStatus = claimInput.verification_status;
    let sourceRank: SourceRankingTier = claimInput.source_rank || 'TIER_4_COMMUNITY';

    if (!claimInput.source_url || claimInput.source_url.trim() === '') {
      finalStatus = 'Unverified';
    } else if (claimInput.is_accessible_url === false) {
      finalStatus = 'Unverified';
    }

    // 5. Temporal Validity check
    const today = new Date().toISOString().slice(0, 10);
    if (claimInput.review_due_date && claimInput.review_due_date < today) {
      finalStatus = 'Outdated';
    }

    const newClaim: VerifiedClaim = {
      ...claimInput,
      id: `claim_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
      verification_status: finalStatus,
      source_rank: sourceRank,
      version: 1,
      change_log: [
        {
          timestamp: new Date().toISOString(),
          note: 'Initial ingest through Verified Knowledge Engine.',
          changedBy: 'knowledge_pipeline'
        }
      ]
    };

    this.claims.set(newClaim.id, newClaim);
    return { success: true, claim: newClaim };
  }

  /**
   * Flags a contradiction between two claims and updates statuses to 'Conflicting evidence'
   */
  public flagConflict(
    claimAId: string,
    claimBId: string,
    conflictData: {
      natureOfConflict: string;
      perspectiveA: string;
      perspectiveB: string;
      evidenceA: string[];
      evidenceB: string[];
      unresolvedReason: string;
    }
  ): ConflictEdge | null {
    const claimA = this.claims.get(claimAId);
    if (!claimA) return null;

    const edge: ConflictEdge = {
      id: `conflict_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
      claimAId,
      claimBId,
      natureOfConflict: conflictData.natureOfConflict,
      perspectiveA: conflictData.perspectiveA,
      perspectiveB: conflictData.perspectiveB,
      evidenceA: conflictData.evidenceA,
      evidenceB: conflictData.evidenceB,
      unresolvedReason: conflictData.unresolvedReason,
      status: 'OPEN_DEBATE'
    };

    // Update claim A status
    claimA.verification_status = 'Conflicting evidence';
    claimA.contradiction_level = 'HIGH';
    claimA.change_log.push({
      timestamp: new Date().toISOString(),
      note: `Contradiction flagged against claim ${claimBId}: ${conflictData.natureOfConflict}`,
      changedBy: 'conflict_detector'
    });

    const claimB = this.claims.get(claimBId);
    if (claimB) {
      claimB.verification_status = 'Conflicting evidence';
      claimB.contradiction_level = 'HIGH';
      claimB.change_log.push({
        timestamp: new Date().toISOString(),
        note: `Contradiction flagged against claim ${claimAId}: ${conflictData.natureOfConflict}`,
        changedBy: 'conflict_detector'
      });
    }

    this.conflicts.push(edge);
    return edge;
  }

  /**
   * Promotes a claim to 'Verified' in Review Queue via authorized human reviewer
   * Models cannot self-validate without independent corroborating evidence.
   */
  public reviewAndVerifyClaim(
    claimId: string,
    reviewerId: string,
    evidenceSources: string[]
  ): { success: boolean; error?: string } {
    const claim = this.claims.get(claimId);
    if (!claim) {
      return { success: false, error: 'Claim not found.' };
    }

    if (!evidenceSources || evidenceSources.length === 0) {
      return {
        success: false,
        error: 'Independent corroborating evidence sources are required to promote claim to Verified status. Models cannot self-validate without external evidence.'
      };
    }

    claim.verification_status = 'Verified';
    claim.independent_supporting_sources = Array.from(
      new Set([...claim.independent_supporting_sources, ...evidenceSources])
    );
    claim.contradiction_level = 'NONE';
    claim.version++;
    claim.change_log.push({
      timestamp: new Date().toISOString(),
      note: `Verified by human compliance reviewer ${reviewerId} with independent evidence: ${evidenceSources.join(', ')}`,
      changedBy: reviewerId
    });

    return { success: true };
  }

  /**
   * Scans all claims for temporal expiration (review_due_date < today)
   * Flags expired claims as Outdated.
   */
  public auditTemporalValidity(): Array<{ claimId: string; claim: string; reviewDueDate: string }> {
    const today = new Date().toISOString().slice(0, 10);
    const expired: Array<{ claimId: string; claim: string; reviewDueDate: string }> = [];

    for (const [id, claim] of this.claims.entries()) {
      if (claim.review_due_date && claim.review_due_date < today) {
        if (claim.verification_status !== 'Outdated') {
          claim.verification_status = 'Outdated';
          claim.change_log.push({
            timestamp: new Date().toISOString(),
            note: `Auto-flagged as Outdated: review due date (${claim.review_due_date}) expired.`,
            changedBy: 'temporal_validity_scheduler'
          });
        }
        expired.push({
          claimId: id,
          claim: claim.claim,
          reviewDueDate: claim.review_due_date
        });
      }
    }

    return expired;
  }
}
