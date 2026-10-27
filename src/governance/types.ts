/**
 * NDAWG PRO — APEX UPGRADE (PART 1/5)
 * Core Governance, Security & Limits Foundation Types
 */

export type CapabilityStatus =
  | 'Implemented and tested'
  | 'Implemented, awaiting configuration'
  | 'Partially implemented'
  | 'Not implemented'
  | 'Test failed';

export type UserRole = 'USER' | 'AGENT' | 'ADMIN';

export type SafetyCategory =
  | 'WMD_CBRN'
  | 'CSAM_CSAE'
  | 'MALWARE_EXPLOIT'
  | 'DEEPFAKE_FRAUD'
  | 'MASS_COPYRIGHT'
  | 'RATE_LIMIT_CIRCUMVENTION'
  | 'UNAUTHORIZED_DATA_EXFIL'
  | 'PROMPT_INJECTION_BYPASS';

export type PermissionTier =
  | 'TIER_1_READ'
  | 'TIER_2_REVERSIBLE_WRITE'
  | 'TIER_3_IRREVERSIBLE_ACTION';

export interface InteractiveLimits {
  maxModelsPerRequest: number; // default: 3
  maxToolCallsPerRequest: number; // default: 12
  maxStepsPerRequest: number; // default: 20
  maxTimeoutSeconds: number; // default: 120s
  targetBudgetMaxUsd: number; // default: 0.50 USD
}

export interface BackgroundAgentLimits {
  maxSteps: number; // default: 50
  maxTimeoutMinutes: number; // default: 30
  targetBudgetMaxUsd: number; // default: 5.00 USD
  maxAgentRecursionDepth: number; // default: 3
}

export interface BudgetConfig {
  dailyUserQuotaUsd: number; // e.g. 10.00
  monthlySystemBudgetUsd: number; // e.g. 500.00
  warningThresholds: number[]; // [0.5, 0.8, 1.0] (50%, 80%, 100%)
}

export interface PolicyConfig {
  version: string;
  updatedAt: string;
  updatedBy: string;
  interactiveLimits: InteractiveLimits;
  backgroundAgentLimits: BackgroundAgentLimits;
  budgetConfig: BudgetConfig;
  circuitBreakerThresholdConsecutiveErrors: number;
  circuitBreakerResetTimeoutMs: number;
  maxConsecutiveIdenticalCalls: number; // Loop detector
}

export interface KillSwitchState {
  globalAgentPaused: boolean;
  disabledProviders: string[]; // e.g. ['gemini-2.5-flash', 'claude-3-opus', 'gpt-4o']
  disabledTools: string[]; // e.g. ['file_delete', 'send_email', 'execute_shell']
}

export interface CircuitBreakerState {
  isOpen: boolean;
  consecutiveErrors: number;
  lastOpenedAt?: number;
  tripReason?: string;
}

export interface ExecutionContext {
  requestId: string;
  actorId: string;
  role: UserRole;
  isBackgroundAgent?: boolean;
  depth: number;
  stepCount: number;
  modelCallsCount: number;
  toolCallsCount: number;
  startTime: number;
  accumulatedCostUsd: number;
  callHistory: Array<{
    target: string;
    paramsHash: string;
  }>;
}

export interface ProposedAction {
  id: string;
  name: string;
  tier: PermissionTier;
  targetProviderOrTool: string;
  type: 'MODEL_CALL' | 'TOOL_CALL' | 'SYSTEM_MUTATION';
  inputPayload: Record<string, unknown> | string;
  estimatedCostUsd: number;
  isReversible: boolean;
  humanConfirmed?: boolean;
  snapshotBefore?: Record<string, unknown>;
  rollbackPayload?: Record<string, unknown>;
}

export type DecisionStatus = 'ALLOWED' | 'BLOCKED' | 'REQUIRE_CONFIRMATION';

export interface GovernorDecision {
  status: DecisionStatus;
  ruleViolated?: string;
  reason: string;
  requiresTierConfirmation?: boolean;
  suggestedAction?: string;
  executionAllowed: boolean;
}

export interface AuditLogEntry {
  id: string;
  timestamp: string;
  requestId: string;
  actorHash: string; // privacy-preserving anonymized hash
  target: string;
  actionTier?: PermissionTier;
  decision: DecisionStatus;
  reason?: string;
  durationMs: number;
  estimatedCostUsd: number;
  policyVersion: string;
  prevHash: string;
  hash: string;
}

export interface CapabilityItem {
  id: string;
  name: string;
  category: 'Governance & Security' | 'AI Core' | 'Knowledge & Memory' | 'Studio & Tools' | 'Vertical Centers';
  status: CapabilityStatus;
  description: string;
  dependencies: string[];
  associatedTests: string[];
  testEvidence: string;
  lastVerified: string;
  knownLimitations: string;
  activationPrerequisites: string;
}
