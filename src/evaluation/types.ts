/**
 * NDAWG PRO — APEX UPGRADE (PART 3/5)
 * Evaluation Harness, Model Scorecard & Apex Orchestrator Types
 */

export type EvaluationCategory =
  | 'VIETNAMESE_REASONING' // 1. Suy luận và ngôn ngữ tiếng Việt
  | 'CODING_DEBUGGING' // 2. Lập trình và sửa lỗi
  | 'TOOL_CALLING' // 3. Sử dụng công cụ
  | 'CITED_RESEARCH' // 4. Nghiên cứu có trích dẫn
  | 'DATA_ANALYSIS' // 5. Phân tích dữ liệu
  | 'IMAGE_PRESERVATION' // 6. Chỉnh sửa ảnh và bảo toàn vùng ngoài vùng chọn
  | 'TUTORING_EXPLANATION' // 7. Học tập và giải thích
  | 'GAME_INTELLIGENCE' // 8. Game Intelligence theo phiên bản hoặc mùa giải
  | 'MEMORY_INSTRUCTION_FOLLOWING' // 9. Sử dụng bộ nhớ và tuân thủ chỉ dẫn
  | 'SAFETY_INJECTION_DEFENSE'; // 10. An toàn, chống prompt injection và bảo vệ dữ liệu

export interface GoldenTestCase {
  id: string;
  category: EvaluationCategory;
  version: string;
  name: string;
  prompt: string;
  referenceAnswer: string;
  rubric: string;
  automatedCheckType: 'EXACT_MATCH' | 'REGEX_VALIDATION' | 'NUMERIC_TOLERANCE' | 'CODE_EXECUTION' | 'HEURISTIC_RUBRIC';
  passingCriteria: number; // e.g. 0.85
  knownLimitations: string;
  lastUpdated: string;
}

export interface EvaluationRun {
  id: string;
  testCaseId: string;
  category: EvaluationCategory;
  provider: string;
  modelId: string;
  modelVersion: string;
  timestamp: string;
  rawOutput: string;
  score: number; // 0.0 to 1.0
  passed: boolean;
  latencyMs: number;
  costUsd: number;
  verificationEvidence: string;
}

export type ScorecardConfidence = 'HIGH' | 'MEDIUM' | 'LOW' | 'INSUFFICIENT_DATA';

export interface ModelScorecardEntry {
  provider: string;
  modelId: string;
  modelVersion: string;
  taskCategory: EvaluationCategory;
  evaluationDate: string;
  sampleCount: number;
  score: number; // 0.0 to 1.0
  successRate: number; // 0.0 to 1.0
  latencyMs: number;
  costUsd: number;
  errorRate: number;
  refusalRate: number;
  evidenceCount: number;
  confidenceLevel: ScorecardConfidence;
  displayStatus?: string; // "Chưa đủ dữ liệu đánh giá." when sampleCount < 5
}

export interface DriftAlert {
  id: string;
  modelId: string;
  fromVersion: string;
  toVersion: string;
  metric: 'VERSION_CHANGE' | 'QUALITY_DROP' | 'LATENCY_SPIKE' | 'ERROR_SPIKE' | 'COST_ANOMALY';
  baselineValue: number | string;
  currentValue: number | string;
  percentageChange: number;
  detectedAt: string;
  severity: 'WARNING' | 'CRITICAL';
  recommendation: string;
  reEvalTriggered: boolean;
}

export interface TaskGraphNode {
  id: string;
  goal: string;
  input: Record<string, unknown> | string;
  expectedOutput: string;
  requiredTools: string[];
  dependencies: string[]; // Node IDs that must complete first
  stepLimit: number;
  completionCriteria: string;
  verificationMethod: string;
  status: 'PENDING' | 'RUNNING' | 'COMPLETED' | 'FAILED' | 'SKIPPED';
  errorStrategy: 'RETRY' | 'CASCADE_MODEL' | 'ABORT';
  outputResult?: string;
  executedModel?: string;
  executionDurationMs?: number;
}

export interface TaskGraph {
  id: string;
  title: string;
  nodes: TaskGraphNode[];
  maxAllowedSteps: number;
  executedStepsCount: number;
  status: 'READY' | 'RUNNING' | 'COMPLETED' | 'FAILED';
}

export interface ProvenanceReport {
  requestId: string;
  timestamp: string;
  userPromptSummary: string;
  modelsCalled: Array<{
    modelId: string;
    role: string;
    latencyMs: number;
    costUsd: number;
  }>;
  toolsCalled: string[];
  sourcesUsed: string[];
  executedSteps: string[];
  failedSteps: string[];
  verificationMethod: string;
  reproducibilityHash: string;
  dataMinimizationApplied: boolean;
  privacyGateCleared: boolean;
}
