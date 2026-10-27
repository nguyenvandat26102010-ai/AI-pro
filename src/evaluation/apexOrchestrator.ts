/**
 * NDAWG PRO — APEX ORCHESTRATOR
 * DAG Task Graph execution, Parallel dispatch, Cascade Routing,
 * Evidence-before-Consensus, Bounded Reflection, and Privacy Gate.
 *
 * Rules:
 * - NO monolithic untracked executions.
 * - Parallel execution for independent DAG nodes.
 * - Halt when step count or budget limits are reached.
 * - Privacy Gate strictly rejects unapproved providers when sensitive data is present.
 * - Full auditable Provenance Report with SHA-256 reproducibility hash.
 */

import {
  EvaluationCategory,
  ProvenanceReport,
  TaskGraph,
  TaskGraphNode
} from './types.ts';
import { LimitsGovernor } from '../governance/limitsGovernor.ts';
import { ProviderTermsRegistry } from '../absorption/providerTermsRegistry.ts';
import { EvalHarnessEngine } from './evalHarness.ts';
import { sha256 } from '../governance/crypto.ts';

export interface OrchestrationContext {
  requestId: string;
  actorId: string;
  userRole: 'ADMIN' | 'OPERATOR' | 'VIEWER';
  taskCategory: EvaluationCategory;
  budgetLimitUsd?: number;
  maxSteps?: number;
  allowCascade?: boolean;
}

export interface PrivacyGateResult {
  cleared: boolean;
  sanitizedPayload: string;
  sensitiveEntitiesFound: string[];
  dataMinimizationApplied: boolean;
  blockedReason?: string;
}

export interface CascadeResult {
  selectedModel: string;
  provider: string;
  output: string;
  costUsd: number;
  latencyMs: number;
  escalated: boolean;
  escalationCount: number;
  verificationPassed: boolean;
  evidence: string;
}

export interface BoundedReflectionResult {
  finalOutput: string;
  iterations: number;
  haltReason: 'CONVERGED' | 'MAX_TURNS_REACHED' | 'NO_MARGINAL_IMPROVEMENT' | 'LOOP_DETECTED';
  scoreHistory: number[];
}

export class ApexOrchestrator {
  private limitsGovernor: LimitsGovernor;
  private termsRegistry: ProviderTermsRegistry;
  private evalHarness: EvalHarnessEngine;
  private executionReports: Map<string, ProvenanceReport>;

  constructor(
    limitsGovernor: LimitsGovernor,
    termsRegistry: ProviderTermsRegistry,
    evalHarness: EvalHarnessEngine
  ) {
    this.limitsGovernor = limitsGovernor;
    this.termsRegistry = termsRegistry;
    this.evalHarness = evalHarness;
    this.executionReports = new Map();
  }

  // =========================================================================
  // 1. PRIVACY GATE
  // =========================================================================

  /**
   * Evaluates input payload for sensitive data (PII, credentials)
   * and verifies whether the destination provider is legally approved.
   */
  public evaluatePrivacyGate(payload: string, destinationModelId: string): PrivacyGateResult {
    const sensitiveEntitiesFound: string[] = [];
    let sanitized = payload;

    // Regex check for API keys & tokens
    const apiKeyRegex = /(?:AIza[0-9A-Za-z-_]{35}|sk-[a-zA-Z0-9]{32,}|ghp_[a-zA-Z0-9]{36}|Bearer\s+[a-zA-Z0-9_.-]+)/g;
    if (apiKeyRegex.test(payload)) {
      sensitiveEntitiesFound.push('API_OR_AUTH_TOKEN');
      sanitized = sanitized.replace(apiKeyRegex, '[REDACTED_SECRET]');
    }

    // Regex check for Email addresses
    const emailRegex = /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/g;
    if (emailRegex.test(payload)) {
      sensitiveEntitiesFound.push('PII_EMAIL');
      sanitized = sanitized.replace(emailRegex, '[REDACTED_EMAIL]');
    }

    // Regex check for Phone numbers
    const phoneRegex = /\b(?:\+?\d{1,3}[-.\s]?)?\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4}\b/g;
    if (phoneRegex.test(payload)) {
      sensitiveEntitiesFound.push('PII_PHONE');
      sanitized = sanitized.replace(phoneRegex, '[REDACTED_PHONE]');
    }

    const hasSensitiveData = sensitiveEntitiesFound.length > 0;
    const providerTerms = this.termsRegistry.getTerms(destinationModelId);

    // If destination provider is unverified or not registered
    if (!providerTerms || providerTerms.verification_status !== 'VERIFIED') {
      if (hasSensitiveData) {
        return {
          cleared: false,
          sanitizedPayload: sanitized,
          sensitiveEntitiesFound,
          dataMinimizationApplied: false,
          blockedReason: `Privacy Gate BLOCKED: Payload contains sensitive data (${sensitiveEntitiesFound.join(
            ', '
          )}) but target provider '${destinationModelId}' is UNVERIFIED or lacks valid data handling terms.`
        };
      }
    }

    return {
      cleared: true,
      sanitizedPayload: sanitized,
      sensitiveEntitiesFound,
      dataMinimizationApplied: hasSensitiveData
    };
  }

  // =========================================================================
  // 2. CASCADE ROUTING
  // =========================================================================

  /**
   * Cascade Routing:
   * Starts with fast/cost-effective model (gemini-2.5-flash),
   * escalating to heavier model only if empirical threshold or verification fails.
   * Enforces provider terms and limits governor budget/step limits.
   */
  public async executeCascadeRouting(
    prompt: string,
    context: OrchestrationContext,
    customVerification?: (output: string) => boolean
  ): Promise<CascadeResult> {
    const candidateModels = [
      { id: 'gemini-2.5-flash', provider: 'Google Cloud / DeepMind', costPerCall: 0.0001, speedMs: 250 },
      { id: 'gemini-2.5-pro', provider: 'Google Cloud / DeepMind', costPerCall: 0.0015, speedMs: 650 },
      { id: 'claude-3-5-sonnet', provider: 'Anthropic', costPerCall: 0.003, speedMs: 820 }
    ];

    let currentCost = 0;
    let escalationCount = 0;
    const maxBudget = context.budgetLimitUsd ?? 0.01;

    for (let i = 0; i < candidateModels.length; i++) {
      const candidate = candidateModels[i];

      // Check 1: Provider Terms check (Reject unapproved providers)
      const terms = this.termsRegistry.getTerms(candidate.id);
      if (!terms || terms.verification_status !== 'VERIFIED') {
        throw new Error(
          `Cascade rejected unapproved provider model: '${candidate.id}'. Verification status: ${
            terms?.verification_status || 'NOT_REGISTERED'
          }`
        );
      }

      // Check 2: Budget check before calling model
      if (currentCost + candidate.costPerCall > maxBudget) {
        throw new Error(
          `Cascade halted: Budget exhaustion limit reached ($${maxBudget.toFixed(
            4
          )}). Cannot dispatch to '${candidate.id}'.`
        );
      }

      // Check 3: Privacy Gate
      const privacy = this.evaluatePrivacyGate(prompt, candidate.id);
      if (!privacy.cleared) {
        throw new Error(privacy.blockedReason || 'Privacy Gate blocked dispatch.');
      }

      // Execute simulated model call
      currentCost += candidate.costPerCall;
      const latencyMs = candidate.speedMs + Math.floor(Math.random() * 40);

      // Model simulated response generator
      let output = `[${candidate.id}] Processed response for: "${prompt.slice(0, 40)}..."`;
      if (candidate.id === 'claude-3-5-sonnet') {
        output += ' [Deep verified code structure with TypeScript AST compliance]';
      } else if (candidate.id === 'gemini-2.5-pro') {
        output += ' [Comprehensive multi-step reasoning with formal verification]';
      }

      // Check verification criteria
      let verificationPassed = true;
      if (customVerification) {
        verificationPassed = customVerification(output);
      } else {
        // Default verification: coding tasks on flash escalate if complex
        if (context.taskCategory === 'CODING_DEBUGGING' && candidate.id === 'gemini-2.5-flash') {
          verificationPassed = false; // Trigger cascade to pro/sonnet
        }
      }

      // If passed or at final model, return result
      if (verificationPassed || i === candidateModels.length - 1 || !context.allowCascade) {
        return {
          selectedModel: candidate.id,
          provider: candidate.provider,
          output,
          costUsd: currentCost,
          latencyMs,
          escalated: escalationCount > 0,
          escalationCount,
          verificationPassed,
          evidence: verificationPassed
            ? `Verified successfully on ${candidate.id}.`
            : `Completed fallback on final tier (${candidate.id}).`
        };
      }

      // Escalate to next model
      escalationCount++;
    }

    throw new Error('Cascade routing exhausted without completion.');
  }

  // =========================================================================
  // 3. BOUNDED REFLECTION
  // =========================================================================

  /**
   * Bounded Reflection: Max 3 turns.
   * Halts immediately if loop detected or marginal score improvement <= 0.01.
   */
  public executeBoundedReflection(
    initialPrompt: string,
    evaluator: (candidate: string, turn: number) => { score: number; refined: string }
  ): BoundedReflectionResult {
    let currentOutput = initialPrompt;
    const scoreHistory: number[] = [];
    const seenOutputs = new Set<string>();
    seenOutputs.add(sha256(currentOutput));

    const maxTurns = 3;

    for (let turn = 1; turn <= maxTurns; turn++) {
      const { score, refined } = evaluator(currentOutput, turn);
      const prevScore = scoreHistory[scoreHistory.length - 1] ?? 0;

      scoreHistory.push(score);

      // Check loop
      const outputHash = sha256(refined);
      if (seenOutputs.has(outputHash)) {
        return {
          finalOutput: currentOutput,
          iterations: turn,
          haltReason: 'LOOP_DETECTED',
          scoreHistory
        };
      }
      seenOutputs.add(outputHash);

      // Check convergence (perfect score)
      if (score >= 0.98) {
        return {
          finalOutput: refined,
          iterations: turn,
          haltReason: 'CONVERGED',
          scoreHistory
        };
      }

      // Check marginal improvement
      if (turn > 1 && score - prevScore <= 0.01) {
        return {
          finalOutput: refined,
          iterations: turn,
          haltReason: 'NO_MARGINAL_IMPROVEMENT',
          scoreHistory
        };
      }

      currentOutput = refined;
    }

    return {
      finalOutput: currentOutput,
      iterations: maxTurns,
      haltReason: 'MAX_TURNS_REACHED',
      scoreHistory
    };
  }

  // =========================================================================
  // 4. TASK GRAPH (DAG) EXECUTION WITH PARALLEL DISPATCH
  // =========================================================================

  /**
   * Executes a TaskGraph DAG:
   * - Parallel execution of independent steps
   * - Strict enforcement of maxAllowedSteps
   * - Tracking status and step outputs
   */
  public async executeTaskGraph(
    graph: TaskGraph,
    nodeExecutor: (node: TaskGraphNode) => Promise<{ output: string; model: string; durationMs: number }>
  ): Promise<TaskGraph> {
    graph.status = 'RUNNING';
    const executedNodeIds = new Set<string>();

    while (executedNodeIds.size < graph.nodes.length) {
      // Find all ready nodes whose dependencies are all completed
      const readyNodes = graph.nodes.filter(
        (node) =>
          node.status === 'PENDING' &&
          node.dependencies.every((depId) => executedNodeIds.has(depId))
      );

      // If no nodes are ready, check if there's a deadlock or remaining failed
      if (readyNodes.length === 0) {
        const hasPending = graph.nodes.some((n) => n.status === 'PENDING');
        if (hasPending) {
          graph.status = 'FAILED';
          break;
        }
        break;
      }

      // Check step limit
      if (graph.executedStepsCount + readyNodes.length > graph.maxAllowedSteps) {
        // Enforce max step limit
        const allowedCount = Math.max(0, graph.maxAllowedSteps - graph.executedStepsCount);
        const toRun = readyNodes.slice(0, allowedCount);
        const toSkip = readyNodes.slice(allowedCount);

        for (const s of toSkip) {
          s.status = 'SKIPPED';
        }

        if (toRun.length === 0) {
          graph.status = 'FAILED';
          break;
        }

        // Execute available within limit
        await this.runNodeBatch(toRun, nodeExecutor, graph, executedNodeIds);
        graph.status = 'FAILED'; // Halted by step limit
        break;
      }

      // PARALLEL EXECUTION of independent ready nodes
      await this.runNodeBatch(readyNodes, nodeExecutor, graph, executedNodeIds);
    }

    const allCompleted = graph.nodes.every((n) => n.status === 'COMPLETED');
    if (allCompleted) {
      graph.status = 'COMPLETED';
    } else if (graph.status === 'RUNNING') {
      graph.status = 'FAILED';
    }

    return graph;
  }

  private async runNodeBatch(
    batch: TaskGraphNode[],
    nodeExecutor: (node: TaskGraphNode) => Promise<{ output: string; model: string; durationMs: number }>,
    graph: TaskGraph,
    executedNodeIds: Set<string>
  ) {
    // Mark batch as RUNNING
    batch.forEach((node) => {
      node.status = 'RUNNING';
    });

    // Execute concurrently via Promise.all
    const results = await Promise.all(
      batch.map(async (node) => {
        try {
          const res = await nodeExecutor(node);
          return { node, success: true, ...res };
        } catch (err: unknown) {
          return {
            node,
            success: false,
            output: `Execution error: ${err instanceof Error ? err.message : String(err)}`,
            model: 'none',
            durationMs: 0
          };
        }
      })
    );

    // Update node results and step counter
    for (const r of results) {
      graph.executedStepsCount++;
      r.node.outputResult = r.output;
      r.node.executedModel = r.model;
      r.node.executionDurationMs = r.durationMs;

      if (r.success) {
        r.node.status = 'COMPLETED';
        executedNodeIds.add(r.node.id);
      } else {
        r.node.status = 'FAILED';
      }
    }
  }

  // =========================================================================
  // 5. PROVENANCE REPORT GENERATOR
  // =========================================================================

  public generateProvenanceReport(
    requestId: string,
    prompt: string,
    models: Array<{ modelId: string; role: string; latencyMs: number; costUsd: number }>,
    tools: string[],
    sources: string[],
    executedSteps: string[],
    failedSteps: string[],
    verificationMethod: string,
    privacyGateCleared: boolean,
    dataMinimizationApplied: boolean
  ): ProvenanceReport {
    const reproducibilityPayload = JSON.stringify({
      prompt,
      models: models.map((m) => m.modelId),
      tools,
      sources,
      executedSteps
    });

    const report: ProvenanceReport = {
      requestId,
      timestamp: new Date().toISOString(),
      userPromptSummary: prompt.length > 80 ? prompt.slice(0, 80) + '...' : prompt,
      modelsCalled: models,
      toolsCalled: tools,
      sourcesUsed: sources,
      executedSteps,
      failedSteps,
      verificationMethod,
      reproducibilityHash: sha256(reproducibilityPayload),
      dataMinimizationApplied,
      privacyGateCleared
    };

    this.executionReports.set(requestId, report);
    return report;
  }

  public getProvenanceReport(requestId: string): ProvenanceReport | null {
    return this.executionReports.get(requestId) || null;
  }

  public getAllProvenanceReports(): ProvenanceReport[] {
    return Array.from(this.executionReports.values());
  }
}
