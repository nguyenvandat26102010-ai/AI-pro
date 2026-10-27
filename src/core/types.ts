/**
 * NDAWG PRO — PART 6/8 (FINAL V3)
 * Core Architecture, Tier Classification & Shared Service Contracts
 */

import type { UserRole } from '../governance/types.ts';

// ---------------------------------------------------------------------------
// 1. THREE-TIER CLASSIFICATION
// ---------------------------------------------------------------------------
export type SystemTier = 'TIER_A_APP' | 'TIER_B_TRAINING' | 'TIER_C_KNOWLEDGE_CARDS';

export type StandardAcceptanceStatus =
  | 'Implemented and tested'
  | 'Implemented, awaiting configuration'
  | 'Partially implemented'
  | 'Not implemented'
  | 'Test failed';

export interface TierClassification {
  tier: SystemTier;
  label: string;
  description: string;
  status: StandardAcceptanceStatus;
}

// ---------------------------------------------------------------------------
// 2. TRAINING GATE (7 MANDATORY PREREQUISITES FOR TIER B)
// ---------------------------------------------------------------------------
export type DetailedConditionStatus =
  | 'Not implemented'
  | 'Not verified'
  | 'Implemented, awaiting configuration'
  | 'Test failed'
  | 'Blocked'
  | 'Implemented and tested';

export interface TrainingGateConditionDetail {
  id: string;
  key: keyof TrainingGateCriteria;
  name: string;
  category: string;
  status: DetailedConditionStatus;
  evidence: string;
  verificationNotes: string;
  lastEvaluated: number;
  isPassed: boolean;
}

export interface TrainingGateCriteria {
  gpuClusterVerified: boolean;        // 1. Real physical GPU cluster (H100/B200) or confirmed vCluster
  dataRightsAndLicensing: boolean;    // 2. Clear IP/licensing verification
  computeBudgetEnergyAllocated: boolean; // 3. Verified compute budget & PUE
  checkpointStorageVersioned: boolean;// 4. Versioned immutable weight storage
  safetyAlignmentBenchmarks: boolean; // 5. Red teaming & Toxigen baseline
  legalExportControlsCleared: boolean;// 6. Export control & data jurisdiction
  validationDatasetVerified: boolean; // 7. Independent validation benchmark set
}

export interface TrainingGateResult {
  passed: boolean;
  passedCount: number;
  totalCount: number;
  criteriaResults: Record<keyof TrainingGateCriteria, boolean>;
  conditions: TrainingGateConditionDetail[];
  missingCriteria: string[];
  status: StandardAcceptanceStatus;
  verdictMessage: string;
  isChatBlocked: boolean; // Must always remain false: Training Gate never blocks chat!
}

// ---------------------------------------------------------------------------
// 2.1. KNOWLEDGE CARDS ITEM (TIER C EDUCATIONAL REPOSITORY)
// ---------------------------------------------------------------------------
export interface KnowledgeCardItem {
  id: string;
  title: string;
  category: string;
  summary: string;
  specs: string[];
  references: string[];
  author: string;
  version: string;
  verificationStatus: KnowledgeGateBadge;
  hardwareNotice: string;
  createdAt: number;
  lastUpdated: string;
}


// ---------------------------------------------------------------------------
// 3. TOOL REGISTRY (4 PERMISSION TIERS)
// ---------------------------------------------------------------------------
export type ToolPermissionTier =
  | 'TIER_1_READ'
  | 'TIER_2_REVERSIBLE_WRITE'
  | 'TIER_3_SENSITIVE_CONFIRMATION'
  | 'TIER_4_PROHIBITED';

export interface ToolDefinition {
  id: string;
  name: string;
  description: string;
  tier: ToolPermissionTier;
  category: 'READ' | 'WRITE' | 'SYSTEM' | 'SECURITY';
  isReversible: boolean;
  requiresUserConfirmation: boolean;
  enabled: boolean;
}

export interface ToolExecutionRequest {
  toolId: string;
  params: Record<string, unknown>;
  actorId: string;
  actorRole: UserRole;
  userConfirmed?: boolean;
}

export interface ToolExecutionResponse {
  toolId: string;
  allowed: boolean;
  executed: boolean;
  tier: ToolPermissionTier;
  result?: unknown;
  error?: string;
  requiresConfirmationPrompt?: boolean;
}

// ---------------------------------------------------------------------------
// 4. REASONING ENGINE (GIẢI - KIỂM - SỬA)
// ---------------------------------------------------------------------------
export type ReasoningMode = 'Fast' | 'Standard' | 'Deep' | 'Verified';
export type ReasoningOutcome = 'VERIFIED' | 'UNVERIFIED' | 'FAILED';

export interface ReasoningStepTrace {
  stepIndex: number;
  phase: 'SOLVE' | 'VERIFY' | 'REPAIR';
  description: string;
  details: string;
  passedVerification?: boolean;
  timestamp: number;
}

export interface ReasoningSummary {
  goals: string[];
  assumptions: string[];
  methods: string[];
  toolsUsed: string[];
  evidence: Array<{ claim: string; verified: boolean; source: string }>;
  uncertainties: string[];
  repairAttempts: number;
  outcome: ReasoningOutcome;
  isVerified: boolean;
}

export interface ReasoningTaskRequest {
  id: string;
  prompt: string;
  domain: 'math' | 'code' | 'logic' | 'research' | 'general';
  mode: ReasoningMode;
  maxRepairs?: number; // default: 3
  timeoutMs?: number;
}

export interface ReasoningTaskResult {
  taskId: string;
  mode: ReasoningMode;
  initialAnswer: string;
  finalAnswer: string;
  outcome: ReasoningOutcome;
  repairAttempts: number;
  summary: ReasoningSummary;
  traces: ReasoningStepTrace[];
  durationMs: number;
}

// ---------------------------------------------------------------------------
// 5. MULTI-MODEL KNOWLEDGE SYNTHESIZER
// ---------------------------------------------------------------------------
export type KnowledgeGateBadge = 'Gold' | 'Silver' | 'Bronze';

export interface ExtractedClaim {
  id: string;
  text: string;
  sourceModelOrProvider: string;
  confidence: number;
  timestamp: number;
  hash: string;
}

export interface ContradictionPair {
  claimA: ExtractedClaim;
  claimB: ExtractedClaim;
  topic: string;
  reason: string;
  severity: 'HIGH' | 'MEDIUM' | 'LOW';
}

export interface SynthesizedKnowledgeArtifact {
  id: string;
  topic: string;
  badge: KnowledgeGateBadge;
  canonicalClaims: ExtractedClaim[];
  deduplicatedCount: number;
  contradictionsFound: ContradictionPair[];
  consensusScore: number; // 0 to 1
  provenance: string[];
  ingestionPassed: boolean;
}

// ---------------------------------------------------------------------------
// 6. LANGUAGE CONFIGURATION (PART 8 INDEPENDENCE)
// ---------------------------------------------------------------------------
export type SupportedUiLanguage = 'vi' | 'en' | 'ja' | 'zh' | 'fr';
export type SupportedResponseLanguage = 'vi' | 'en' | 'ja' | 'zh' | 'fr' | 'match_input';
export type SupportedVoiceLanguage = 'vi-VN' | 'en-US' | 'ja-JP' | 'zh-CN';

export interface MultilingualVoicePreferences {
  interfaceLanguage: SupportedUiLanguage;
  responseLanguage: SupportedResponseLanguage;
  voiceLanguage: SupportedVoiceLanguage;
  voiceGender?: 'male' | 'female';
  speechRate?: number;
}

// ---------------------------------------------------------------------------
// 7. MODALITY GATE
// ---------------------------------------------------------------------------
export type SupportedModality = 'text' | 'image' | 'audio_stt' | 'audio_tts' | 'code' | 'video';

export interface ModelCapabilityProfile {
  modelId: string;
  provider: string;
  version: string;
  supportedModalities: SupportedModality[];
  maxContextTokens: number;
  costPer1kInputTokens: number;
  costPer1kOutputTokens: number;
  status: StandardAcceptanceStatus;
}

// ---------------------------------------------------------------------------
// 8. 13 SHARED SERVICE CONTRACTS (FOR PART 7 & PART 8)
// ---------------------------------------------------------------------------

// Contract 1: getModelCapabilities
export type GetModelCapabilitiesFn = (modelId: string) => ModelCapabilityProfile | null;

// Contract 2: routeTask
export interface TaskRoutingRequest {
  taskId: string;
  taskType: 'text' | 'code' | 'image' | 'audio' | 'reasoning';
  priority: 'low' | 'normal' | 'high';
  requiredModalities: SupportedModality[];
  estimatedComplexity: 'simple' | 'medium' | 'complex';
  maxBudgetUsd?: number;
}
export interface TaskRoutingDecision {
  selectedModel: string;
  fallbackModel: string;
  routingReason: string;
  estimatedCostUsd: number;
  modalityGateApproved: boolean;
}
export type RouteTaskFn = (task: TaskRoutingRequest) => TaskRoutingDecision;

// Contract 3: executeTask
export interface TaskExecutionPlan {
  steps: Array<{ stepId: string; description: string; toolOrModel: string }>;
}
export interface TaskExecutionResult {
  taskId: string;
  success: boolean;
  output: string;
  tokensUsed: number;
  costUsd: number;
  executionDurationMs: number;
}
export type ExecuteTaskFn = (task: TaskRoutingRequest, plan?: TaskExecutionPlan) => Promise<TaskExecutionResult>;

// Contract 4: verifyResult
export interface VerificationConfig {
  domain: 'math' | 'code' | 'citation' | 'general';
  strictness: 'lenient' | 'standard' | 'strict';
}
export interface VerificationReport {
  isVerified: boolean;
  score: number; // 0 to 1
  checkedItems: Array<{ rule: string; passed: boolean; note?: string }>;
  status: 'VERIFIED' | 'UNVERIFIED' | 'FAILED';
}
export type VerifyResultFn = (result: TaskExecutionResult, config: VerificationConfig) => VerificationReport;

// Contract 5: searchKnowledge
export interface KnowledgeFilter {
  topic?: string;
  minBadge?: KnowledgeGateBadge;
  sourceProvider?: string;
}
export interface KnowledgeSearchResult {
  query: string;
  results: SynthesizedKnowledgeArtifact[];
  totalMatches: number;
}
export type SearchKnowledgeFn = (query: string, filter?: KnowledgeFilter) => KnowledgeSearchResult;

// Contract 6: ingestKnowledge
export interface IngestionMetadata {
  provider: string;
  collector: string;
  domain: string;
}
export interface IngestionReceipt {
  artifactId: string;
  badge: KnowledgeGateBadge;
  claimsIngested: number;
  contradictionsCount: number;
  passedGate: boolean;
}
export type IngestKnowledgeFn = (
  topic: string,
  claims: string[],
  metadata: IngestionMetadata
) => IngestionReceipt;

// Contract 7: getUsageAndCost
export interface UsageAndCostReport {
  totalSpendUsd: number;
  dailySpendUsd: number;
  remainingBudgetUsd: number;
  callsCount: number;
  activeKillSwitchesCount: number;
  circuitBreakerTripped: boolean;
}
export type GetUsageAndCostFn = () => UsageAndCostReport;

// Contract 8: getUserPreferences
export type GetUserPreferencesFn = (userId: string) => MultilingualVoicePreferences;

// Contract 9: transcribeAudio
export interface AudioPayload {
  sampleRate: number;
  channels: number;
  durationSeconds: number;
  rawBase64?: string;
}
export interface TranscriptionResult {
  text: string;
  confidence: number;
  languageDetected: string;
  status: StandardAcceptanceStatus;
}
export type TranscribeAudioFn = (audio: AudioPayload) => Promise<TranscriptionResult>;

// Contract 10: generateSpeech
export interface SpeechOptions {
  voiceLanguage: SupportedVoiceLanguage;
  gender?: 'male' | 'female';
  speed?: number;
}
export interface SpeechResult {
  audioUrl?: string;
  textSynthesized: string;
  durationMs: number;
  status: StandardAcceptanceStatus;
}
export type GenerateSpeechFn = (text: string, options?: SpeechOptions) => Promise<SpeechResult>;

// Contract 11: exportResult
export interface ExportArtifact {
  artifactId: string;
  format: 'json' | 'markdown' | 'csv';
  dataString: string;
  fileSizeFormatted: string;
  generatedAt: number;
}
export type ExportResultFn = (result: TaskExecutionResult, format: 'json' | 'markdown' | 'csv') => ExportArtifact;

// Contract 12: createShareArtifact
export interface PrivacyRedactionPolicy {
  stripApiKeys: boolean;
  stripInternalPrompt: boolean;
  maskUserIdentifier: boolean;
}
export interface ShareArtifact {
  shareId: string;
  shareUrl: string;
  isRedacted: boolean;
  redactedKeysCount: number;
  cleanContent: string;
}
export type CreateShareArtifactFn = (
  content: string,
  policy: PrivacyRedactionPolicy
) => ShareArtifact;

// Contract 13: recordFeedback
export interface FeedbackPayload {
  targetId: string;
  rating: 1 | 2 | 3 | 4 | 5;
  category: 'accuracy' | 'speed' | 'safety' | 'ux';
  comment: string;
  userRole: UserRole;
}
export interface FeedbackReceipt {
  feedbackId: string;
  recorded: boolean;
  timestamp: number;
}
export type RecordFeedbackFn = (payload: FeedbackPayload) => FeedbackReceipt;
