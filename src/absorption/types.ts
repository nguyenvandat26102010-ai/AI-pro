/**
 * NDAWG PRO — APEX UPGRADE (PART 2/5)
 * Provider Terms, Knowledge Absorption & Verified Knowledge Types
 */

export type TermVerificationStatus = 'VERIFIED' | 'UNVERIFIED' | 'NEEDS_RECHECK' | 'EXPIRED';

export interface ProviderTermsEntry {
  provider: string; // e.g. "Google Cloud / DeepMind", "Anthropic", "OpenAI"
  modelId: string; // e.g. "gemini-2.5-flash", "claude-3-5-sonnet", "gpt-4o"
  modelVersion?: string;
  officialDocsUrl: string;
  termsUrl: string;
  termsCheckedDate: string; // YYYY-MM-DD
  train_on_output: boolean; // MUST DEFAULT TO FALSE (DENY)
  cache_output: boolean; // MUST DEFAULT TO FALSE (DENY)
  store_output: boolean; // MUST DEFAULT TO FALSE (DENY)
  allow_knowledge_base_reuse: boolean; // MUST DEFAULT TO FALSE (DENY)
  data_storage_conditions: string;
  retention_period_days: number;
  privacy_and_data_handling: string;
  license_or_legal_basis: string;
  verification_status: TermVerificationStatus;
  approved_by: string;
  recheck_due_date: string;
}

export type ReusePolicy = 'cache-only' | 'store-with-citation' | 'no-store';

export type ClaimVerificationStatus =
  | 'Verified'
  | 'Partially verified'
  | 'Conflicting evidence'
  | 'Unverified'
  | 'Outdated';

export type SourceRankingTier =
  | 'TIER_1_OFFICIAL' // Official docs or primary sources
  | 'TIER_2_ACADEMIC' // Peer-reviewed research, recognized institutions
  | 'TIER_3_REPUTABLE_PRESS' // Verified investigative journalism
  | 'TIER_4_COMMUNITY'; // Community / individual sources

export interface VerifiedClaim {
  id: string;
  claim: string;
  short_explanation: string;
  source_url: string;
  source_title: string;
  source_rank: SourceRankingTier;
  published_date: string;
  accessed_date: string;
  verification_method: string;
  independent_supporting_sources: string[];
  contradiction_level: 'NONE' | 'LOW' | 'MEDIUM' | 'HIGH';
  effective_date: string;
  review_due_date: string;
  verification_status: ClaimVerificationStatus;
  origin_provider: string;
  reuse_policy: ReusePolicy;
  storage_permission_granted: boolean;
  is_accessible_url: boolean;
  version: number;
  change_log: Array<{
    timestamp: string;
    note: string;
    changedBy: string;
  }>;
}

export interface ConflictEdge {
  id: string;
  claimAId: string;
  claimBId: string;
  natureOfConflict: string;
  perspectiveA: string;
  perspectiveB: string;
  evidenceA: string[];
  evidenceB: string[];
  unresolvedReason: string;
  status: 'OPEN_DEBATE' | 'RESOLVED' | 'UNDER_REVIEW';
}

export type TaskDomain =
  | 'CODING'
  | 'RESEARCH'
  | 'DATA_ANALYSIS'
  | 'VISION_MULTIMODAL'
  | 'REASONING_STUDY';

export interface LearningRouterRecord {
  id: string;
  taskDomain: TaskDomain;
  providerId: string;
  modelId: string;
  modelVersion: string;
  toolsUsed: string[];
  evaluatedScore: number; // 0.0 to 1.0
  latencyMs: number;
  costUsd: number;
  errorRate: number;
  evaluatedAt: string;
  isVerifiedEvaluation: boolean;
  sampleCount: number;
}

export interface PlaybookEntry {
  id: string;
  name: string;
  taskDomain: TaskDomain;
  promptTemplate: string;
  toolSequence: string[];
  taskChecklist: string[];
  applicabilityConditions: string[];
  nonApplicabilityConditions: string[];
  version: number;
  previousVersions: Array<{
    version: number;
    timestamp: string;
    promptTemplate: string;
    toolSequence: string[];
    taskChecklist: string[];
    evaluationScore: number;
  }>;
  evaluationScore: number;
  evaluationSampleCount: number;
  isRecommended: boolean;
  createdDate: string;
  reviewDueDate: string;
  referenceSource: string;
  usagePermissions: string;
}

export interface CrossCritiqueStep {
  step: number;
  stage: 'INITIAL_PROPOSAL' | 'CROSS_CRITIQUE' | 'TOOL_FACT_CHECK' | 'SYNTHESIS';
  providerOrTool: string;
  inputSummary: string;
  outputSummary: string;
  timestamp: string;
}

export interface CrossCritiquePipeline {
  id: string;
  query: string;
  initialProposerModel: string;
  initialResponse: string;
  critiquerModel: string;
  critiqueFeedback: string;
  toolVerificationResults: Array<{
    claim: string;
    toolUsed: string;
    verified: boolean;
    evidence: string;
  }>;
  synthesizerModel: string;
  finalSynthesizedResponse: string;
  executionTrace: CrossCritiqueStep[];
}
