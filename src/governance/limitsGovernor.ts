/**
 * NDAWG PRO — APEX LIMITS GOVERNOR
 * Deterministic pre-execution gate, loop detector, circuit breaker,
 * 3-tier permission enforcer, and audit hash-chain coordinator.
 */

import {
  AuditLogEntry,
  CircuitBreakerState,
  ExecutionContext,
  GovernorDecision,
  KillSwitchState,
  PermissionTier,
  PolicyConfig,
  ProposedAction,
  UserRole
} from './types.ts';
import {
  computeAuditEntryHash,
  hashActorId,
  redactSecrets,
  sha256,
  verifyAuditChainIntegrity
} from './crypto.ts';
import { DEFAULT_POLICY_CONFIG, PolicyEngine } from './policyEngine.ts';

export class LimitsGovernor {
  private policyEngine: PolicyEngine;
  private killSwitches: KillSwitchState;
  private circuitBreaker: CircuitBreakerState;
  private auditLog: AuditLogEntry[];
  private dailyUserSpend: Map<string, number>; // actorHash -> USD
  private systemSpendMonthlyUsd: number;

  constructor(policyConfig: PolicyConfig = DEFAULT_POLICY_CONFIG) {
    this.policyEngine = new PolicyEngine(policyConfig);
    this.killSwitches = {
      globalAgentPaused: false,
      disabledProviders: [],
      disabledTools: []
    };
    this.circuitBreaker = {
      isOpen: false,
      consecutiveErrors: 0
    };
    this.auditLog = [];
    this.dailyUserSpend = new Map();
    this.systemSpendMonthlyUsd = 0;
  }

  public getPolicy(): Readonly<PolicyConfig> {
    return this.policyEngine.getPolicy();
  }

  public getKillSwitches(): Readonly<KillSwitchState> {
    return { ...this.killSwitches };
  }

  public getCircuitBreaker(): Readonly<CircuitBreakerState> {
    return { ...this.circuitBreaker };
  }

  public getAuditLog(): Readonly<AuditLogEntry[]> {
    return [...this.auditLog];
  }

  public getUserDailySpend(actorId: string): number {
    const actorHash = hashActorId(actorId);
    return this.dailyUserSpend.get(actorHash) || 0;
  }

  public getMonthlySystemSpend(): number {
    return this.systemSpendMonthlyUsd;
  }

  public redactSensitiveData(text: string): string {
    return redactSecrets(text);
  }

  /**
   * Toggles kill switches for providers, tools, or global pause
   */
  public setKillSwitch(
    type: 'global' | 'provider' | 'tool',
    target: string,
    disabled: boolean,
    role: UserRole
  ): { success: boolean; error?: string } {
    if (role !== 'ADMIN') {
      return { success: false, error: 'Unauthorized: Only ADMIN can toggle kill switches.' };
    }

    if (type === 'global') {
      this.killSwitches.globalAgentPaused = disabled;
    } else if (type === 'provider') {
      if (disabled) {
        if (!this.killSwitches.disabledProviders.includes(target)) {
          this.killSwitches.disabledProviders.push(target);
        }
      } else {
        this.killSwitches.disabledProviders = this.killSwitches.disabledProviders.filter(
          (p) => p !== target
        );
      }
    } else if (type === 'tool') {
      if (disabled) {
        if (!this.killSwitches.disabledTools.includes(target)) {
          this.killSwitches.disabledTools.push(target);
        }
      } else {
        this.killSwitches.disabledTools = this.killSwitches.disabledTools.filter((t) => t !== target);
      }
    }

    return { success: true };
  }

  /**
   * Resets the circuit breaker
   */
  public resetCircuitBreaker(role: UserRole): { success: boolean; error?: string } {
    if (role !== 'ADMIN') {
      return { success: false, error: 'Unauthorized: Only ADMIN can reset circuit breaker.' };
    }
    this.circuitBreaker = {
      isOpen: false,
      consecutiveErrors: 0
    };
    return { success: true };
  }

  /**
   * Update policy via PolicyEngine
   */
  public updatePolicy(
    newPolicy: Partial<PolicyConfig>,
    requesterRole: UserRole,
    adminToken?: string
  ): { success: boolean; error?: string } {
    return this.policyEngine.updatePolicy(newPolicy, requesterRole, adminToken);
  }

  /**
   * Evaluates proposed action against all safety, governance, cost, and loop rules.
   * This is the DETERMINISTIC PRE-EXECUTION GATE.
   */
  public evaluate(context: ExecutionContext, action: ProposedAction): GovernorDecision {
    const policy = this.policyEngine.getPolicy();
    const actorHash = hashActorId(context.actorId);
    const isBackground = context.isBackgroundAgent || false;
    const limits = isBackground ? policy.backgroundAgentLimits : policy.interactiveLimits;

    // 1. Check Global Kill Switch
    if (this.killSwitches.globalAgentPaused) {
      return this.recordDecision(context, action, {
        status: 'BLOCKED',
        ruleViolated: 'GLOBAL_AGENT_KILL_SWITCH',
        reason: 'Global agent execution has been paused by administrator kill switch.',
        executionAllowed: false
      });
    }

    // 2. Check Provider Kill Switch
    if (
      action.type === 'MODEL_CALL' &&
      this.killSwitches.disabledProviders.includes(action.targetProviderOrTool)
    ) {
      return this.recordDecision(context, action, {
        status: 'BLOCKED',
        ruleViolated: 'PROVIDER_KILL_SWITCH_ACTIVE',
        reason: `Provider '${action.targetProviderOrTool}' is currently disabled by administrator kill switch.`,
        suggestedAction: 'Switch to an approved alternative provider or contact admin.',
        executionAllowed: false
      });
    }

    // 3. Check Tool Kill Switch
    if (
      action.type === 'TOOL_CALL' &&
      this.killSwitches.disabledTools.includes(action.targetProviderOrTool)
    ) {
      return this.recordDecision(context, action, {
        status: 'BLOCKED',
        ruleViolated: 'TOOL_KILL_SWITCH_ACTIVE',
        reason: `Tool '${action.targetProviderOrTool}' is currently disabled by administrator kill switch.`,
        executionAllowed: false
      });
    }

    // 4. Check Circuit Breaker
    if (this.circuitBreaker.isOpen) {
      return this.recordDecision(context, action, {
        status: 'BLOCKED',
        ruleViolated: 'CIRCUIT_BREAKER_OPEN',
        reason: `Circuit breaker is currently TRIPPED due to: ${this.circuitBreaker.tripReason || 'excessive consecutive failures'}.`,
        executionAllowed: false
      });
    }

    // 5. Evaluate Safety & Legal Policy (WMD, CSAM, malware, deepfake fraud, copyright, rate limit circumvention, exfil, prompt injection)
    const payloadStr =
      typeof action.inputPayload === 'string'
        ? action.inputPayload
        : JSON.stringify(action.inputPayload);

    const safetyViolation = this.policyEngine.evaluateSafety(payloadStr);
    if (safetyViolation) {
      return this.recordDecision(context, action, {
        status: 'BLOCKED',
        ruleViolated: `SAFETY_POLICY_${safetyViolation.category}`,
        reason: `Action rejected by Safety Policy: ${safetyViolation.description}`,
        executionAllowed: false
      });
    }

    // 6. Check Self-Elevation / Privilege Escalation Attempt
    if (action.type === 'SYSTEM_MUTATION') {
      if (context.role !== 'ADMIN') {
        return this.recordDecision(context, action, {
          status: 'BLOCKED',
          ruleViolated: 'UNAUTHORIZED_PRIVILEGE_ESCALATION',
          reason: 'Agents and non-admin users cannot alter security policies, self-grant roles, or generate API keys.',
          executionAllowed: false
        });
      }
    }

    // 7. Check Model Call Count Limit (Interactive: max 3)
    if (action.type === 'MODEL_CALL') {
      const maxModels = policy.interactiveLimits.maxModelsPerRequest;
      if (context.modelCallsCount >= maxModels) {
        return this.recordDecision(context, action, {
          status: 'BLOCKED',
          ruleViolated: 'MAX_MODEL_CALLS_EXCEEDED',
          reason: `Request has reached maximum allowed model calls (${maxModels}). Current count: ${context.modelCallsCount}.`,
          executionAllowed: false
        });
      }
    }

    // 8. Check Tool Call Count Limit (Interactive: max 12)
    if (action.type === 'TOOL_CALL') {
      const maxTools = policy.interactiveLimits.maxToolCallsPerRequest;
      if (context.toolCallsCount >= maxTools) {
        return this.recordDecision(context, action, {
          status: 'BLOCKED',
          ruleViolated: 'MAX_TOOL_CALLS_EXCEEDED',
          reason: `Request has reached maximum allowed tool calls (${maxTools}). Current count: ${context.toolCallsCount}.`,
          executionAllowed: false
        });
      }
    }

    // 9. Check Step Count Limit (Interactive: max 20, Background: max 50)
    const maxSteps = isBackground
      ? policy.backgroundAgentLimits.maxSteps
      : policy.interactiveLimits.maxStepsPerRequest;
    if (context.stepCount >= maxSteps) {
      return this.recordDecision(context, action, {
        status: 'BLOCKED',
        ruleViolated: 'MAX_STEPS_EXCEEDED',
        reason: `Maximum execution step limit (${maxSteps}) reached. Execution terminated.`,
        executionAllowed: false
      });
    }

    // 10. Check Agent Recursion Depth (Background: max 3)
    if (isBackground && context.depth > policy.backgroundAgentLimits.maxAgentRecursionDepth) {
      return this.recordDecision(context, action, {
        status: 'BLOCKED',
        ruleViolated: 'MAX_AGENT_DEPTH_EXCEEDED',
        reason: `Agent recursion depth of ${context.depth} exceeds limit of ${policy.backgroundAgentLimits.maxAgentRecursionDepth}.`,
        executionAllowed: false
      });
    }

    // 11. Check Timeout Limit (Interactive: 120s, Background: 30min)
    const elapsedSeconds = (Date.now() - context.startTime) / 1000;
    const maxTimeoutSeconds = isBackground
      ? policy.backgroundAgentLimits.maxTimeoutMinutes * 60
      : policy.interactiveLimits.maxTimeoutSeconds;

    if (elapsedSeconds > maxTimeoutSeconds) {
      return this.recordDecision(context, action, {
        status: 'BLOCKED',
        ruleViolated: 'TIMEOUT_EXCEEDED',
        reason: `Execution timeout exceeded. Allowed: ${maxTimeoutSeconds}s, Elapsed: ${elapsedSeconds.toFixed(1)}s.`,
        executionAllowed: false
      });
    }

    // 12. Check Cost & Budget Quotas
    const projectedRequestCost = context.accumulatedCostUsd + action.estimatedCostUsd;
    const targetBudgetLimit = limits.targetBudgetMaxUsd;
    if (projectedRequestCost > targetBudgetLimit) {
      return this.recordDecision(context, action, {
        status: 'BLOCKED',
        ruleViolated: 'BUDGET_QUOTA_EXHAUSTED',
        reason: `Request budget limit exceeded. Max: $${targetBudgetLimit.toFixed(2)}, Projected: $${projectedRequestCost.toFixed(4)}.`,
        executionAllowed: false
      });
    }

    const currentDailySpend = this.dailyUserSpend.get(actorHash) || 0;
    if (currentDailySpend + action.estimatedCostUsd > policy.budgetConfig.dailyUserQuotaUsd) {
      return this.recordDecision(context, action, {
        status: 'BLOCKED',
        ruleViolated: 'DAILY_USER_QUOTA_EXHAUSTED',
        reason: `Daily user spending quota of $${policy.budgetConfig.dailyUserQuotaUsd.toFixed(2)} exceeded.`,
        executionAllowed: false
      });
    }

    // 13. Loop & Stagnation Detection (Circuit breaker against infinite spinning)
    const callSignature = `${action.targetProviderOrTool}:${sha256(payloadStr).slice(0, 16)}`;
    const recentHistory = context.callHistory.slice(-policy.maxConsecutiveIdenticalCalls);
    const identicalCallsCount = recentHistory.filter(
      (h) => `${h.target}:${h.paramsHash}` === callSignature
    ).length;

    if (identicalCallsCount >= policy.maxConsecutiveIdenticalCalls) {
      // Trip circuit breaker on repetitive loop
      this.tripCircuitBreaker(`Agent loop detected: ${identicalCallsCount} identical consecutive calls without progress.`);
      return this.recordDecision(context, action, {
        status: 'BLOCKED',
        ruleViolated: 'AGENT_LOOP_DETECTED',
        reason: `Agent loop detected: called '${action.targetProviderOrTool}' with identical parameters ${identicalCallsCount} times consecutively.`,
        executionAllowed: false
      });
    }

    // 14. 3-Tier Agent Permissions Check
    // Tier 1 (READ): allowed automatically
    // Tier 2 (REVERSIBLE WRITE): allowed, but must be accompanied by snapshot/rollback metadata
    // Tier 3 (IRREVERSIBLE ACTION): sending messages, external publishing, permanent deletion, payment
    // MUST require human confirmation!
    if (action.tier === 'TIER_3_IRREVERSIBLE_ACTION') {
      if (!action.humanConfirmed) {
        return this.recordDecision(context, action, {
          status: 'REQUIRE_CONFIRMATION',
          requiresTierConfirmation: true,
          reason: `Action '${action.name}' is Tier 3 (IRREVERSIBLE ACTION). Explicit human approval is required before execution.`,
          executionAllowed: false
        });
      }
    }

    // Passed all guards!
    return this.recordDecision(context, action, {
      status: 'ALLOWED',
      reason: 'All safety, limits, quota, and permission checks satisfied.',
      executionAllowed: true
    });
  }

  /**
   * Trips the circuit breaker
   */
  public tripCircuitBreaker(reason: string) {
    this.circuitBreaker.isOpen = true;
    this.circuitBreaker.lastOpenedAt = Date.now();
    this.circuitBreaker.tripReason = reason;
  }

  /**
   * Registers a failed execution outcome to evaluate circuit breaker thresholds
   */
  public reportExecutionError(errorDescription: string) {
    this.circuitBreaker.consecutiveErrors++;
    const threshold = this.policyEngine.getPolicy().circuitBreakerThresholdConsecutiveErrors;
    if (this.circuitBreaker.consecutiveErrors >= threshold) {
      this.tripCircuitBreaker(
        `Tripped automatically after ${this.circuitBreaker.consecutiveErrors} consecutive errors: ${errorDescription}`
      );
    }
  }

  /**
   * Registers successful execution to reset consecutive errors and record spend
   */
  public recordExecutionSuccess(
    context: ExecutionContext,
    action: ProposedAction,
    durationMs: number
  ) {
    this.circuitBreaker.consecutiveErrors = 0;
    const actorHash = hashActorId(context.actorId);
    const prevDaily = this.dailyUserSpend.get(actorHash) || 0;
    this.dailyUserSpend.set(actorHash, prevDaily + action.estimatedCostUsd);
    this.systemSpendMonthlyUsd += action.estimatedCostUsd;

    // Record call history for loop detection
    context.callHistory.push({
      target: action.targetProviderOrTool,
      paramsHash: sha256(
        typeof action.inputPayload === 'string'
          ? action.inputPayload
          : JSON.stringify(action.inputPayload)
      ).slice(0, 16)
    });

    if (action.type === 'MODEL_CALL') {
      context.modelCallsCount++;
    } else if (action.type === 'TOOL_CALL') {
      context.toolCallsCount++;
    }
    context.stepCount++;
    context.accumulatedCostUsd += action.estimatedCostUsd;
  }

  /**
   * Records decision into the tamper-evident cryptographic hash chain
   */
  private recordDecision(
    context: ExecutionContext,
    action: ProposedAction,
    decision: GovernorDecision
  ): GovernorDecision {
    const GENESIS_PREV_HASH = '0000000000000000000000000000000000000000000000000000000000000000';
    const lastEntry = this.auditLog[this.auditLog.length - 1];
    const prevHash = lastEntry ? lastEntry.hash : GENESIS_PREV_HASH;

    const actorHash = hashActorId(context.actorId);
    const sanitizedReason = redactSecrets(decision.reason);
    const sanitizedTarget = redactSecrets(action.targetProviderOrTool);

    const baseEntry: Omit<AuditLogEntry, 'hash'> = {
      id: `audit_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
      timestamp: new Date().toISOString(),
      requestId: context.requestId,
      actorHash,
      target: sanitizedTarget,
      actionTier: action.tier,
      decision: decision.status,
      reason: sanitizedReason,
      durationMs: Date.now() - context.startTime,
      estimatedCostUsd: action.estimatedCostUsd,
      policyVersion: this.policyEngine.getPolicy().version,
      prevHash
    };

    const hash = computeAuditEntryHash(prevHash, baseEntry);
    const fullEntry: AuditLogEntry = { ...baseEntry, hash };

    this.auditLog.push(fullEntry);
    return decision;
  }

  /**
   * Verifies the cryptographic integrity of the internal audit log chain
   */
  public verifyAuditChain() {
    return verifyAuditChainIntegrity(this.auditLog);
  }

  /**
   * For testing/auditing: simulates tampering with an audit record to prove
   * that the hash chain detects tampering mathematically.
   */
  public simulateTampering(index: number, fakeReason: string) {
    if (this.auditLog[index]) {
      this.auditLog[index] = {
        ...this.auditLog[index],
        reason: fakeReason
      };
    }
  }
}
