/**
 * NDAWG PRO — Policy Engine (Policy-as-Code)
 * Deterministic safety, legal, and operational governance rules independent of AI output.
 */

import { PolicyConfig, SafetyCategory, UserRole } from './types.ts';

export const DEFAULT_POLICY_CONFIG: PolicyConfig = {
  version: '1.0.0-apex',
  updatedAt: new Date().toISOString(),
  updatedBy: 'system-genesis',
  interactiveLimits: {
    maxModelsPerRequest: 3,
    maxToolCallsPerRequest: 12,
    maxStepsPerRequest: 20,
    maxTimeoutSeconds: 120,
    targetBudgetMaxUsd: 0.50
  },
  backgroundAgentLimits: {
    maxSteps: 50,
    maxTimeoutMinutes: 30,
    targetBudgetMaxUsd: 5.00,
    maxAgentRecursionDepth: 3
  },
  budgetConfig: {
    dailyUserQuotaUsd: 10.00,
    monthlySystemBudgetUsd: 500.00,
    warningThresholds: [0.5, 0.8, 1.0]
  },
  circuitBreakerThresholdConsecutiveErrors: 4,
  circuitBreakerResetTimeoutMs: 60000,
  maxConsecutiveIdenticalCalls: 3
};

export interface SafetyViolation {
  category: SafetyCategory;
  description: string;
  matchedRule: string;
}

/**
 * Patterns and heuristics for the 7 forbidden categories specified in Section III.A:
 * 1. Weapons of mass destruction (CBRN / WMD)
 * 2. Child sexual abuse/exploitation (CSAM / CSAE)
 * 3. Malware, unauthorized intrusion, credential/data theft
 * 4. Harmful deepfakes, impersonation fraud
 * 5. Mass copyright piracy
 * 6. Bypassing/circumventing security or rate limits
 * 7. Exfiltrating private data without consent
 */
const SAFETY_PATTERNS: Array<{
  category: SafetyCategory;
  pattern: RegExp;
  description: string;
}> = [
  // 1. WMD & CBRN
  {
    category: 'WMD_CBRN',
    pattern: /(synthesis\s+of\s+(sarin|vx|novichok|ricin|anthrax|smallpox)|enrich\s+uranium\s+for\s+warhead|dirty\s+bomb\s+construction|weaponize\s+(pathogen|virus|biological\s+agent))/i,
    description: 'Prohibited request relating to chemical, biological, radiological, or nuclear weapons.'
  },
  // 2. CSAM / CSAE
  {
    category: 'CSAM_CSAE',
    pattern: /(child\s+sexual|pedophil|underage\s+explicit|child\s+nude|csam)/i,
    description: 'Zero tolerance for child sexual abuse material or exploitation.'
  },
  // 3. Malware, exploits, credential theft
  {
    category: 'MALWARE_EXPLOIT',
    pattern: /(write\s+ransomware|keylogger\s+payload|create\s+trojan|exploit\s+0day\s+to\s+steal\s+passwords|sql\s+injection\s+exploit\s+script\s+to\s+dump\s+database|bypass\s+antivirus\s+stealth\s+dropper)/i,
    description: 'Creation of malware, destructive exploits, or credential theft tools is prohibited.'
  },
  // 4. Harmful Deepfake & Fraudulent Impersonation
  {
    category: 'DEEPFAKE_FRAUD',
    pattern: /(deepfake\s+(nude|porn|non-consensual)|forge\s+kyc\s+identity\s+document|spoof\s+ceo\s+voice\s+to\s+wire\s+funds|generate\s+fake\s+passport\s+scan)/i,
    description: 'Generating non-consensual deepfakes, synthetic fraud, or malicious impersonation is prohibited.'
  },
  // 5. Mass Copyright Violation
  {
    category: 'MASS_COPYRIGHT',
    pattern: /(scrape\s+and\s+pirate\s+entire\s+library|bypass\s+drm\s+widevine\s+downloader|torrent\s+cracked\s+software\s+distributor)/i,
    description: 'Automated mass copyright infringement or DRM cracking is prohibited.'
  },
  // 6. Rate Limit & Defense Circumvention
  {
    category: 'RATE_LIMIT_CIRCUMVENTION',
    pattern: /(circumvent\s+rate\s+limit|bypass\s+cloud\s+waf\s+ddos|ddos\s+attack\s+generator|spoof\s+ip\s+to\s+evade\s+ban)/i,
    description: 'Attempts to evade, circumvent, or exploit service rate limits and protections are prohibited.'
  },
  // 7. Unauthorized Data Exfiltration
  {
    category: 'UNAUTHORIZED_DATA_EXFIL',
    pattern: /(exfiltrate\s+customer\s+records\s+to\s+external\s+webhook|covertly\s+transmit\s+private\s+keys\s+without\s+consent|dump\s+all\s+user\s+pii\s+silently)/i,
    description: 'Sending private or confidential data without explicit verified user consent is prohibited.'
  }
];

/**
 * Heuristics for Prompt Injection and Safety Override Attempts.
 * Ensures system prompts, untrusted documents, user prompts, or tool outputs
 * cannot disable safety policies or elevate privileges.
 */
const INJECTION_PATTERNS = [
  /ignore\s+(all\s+)?(previous|prior)\s+instructions/i,
  /disable\s+(safety|limits\s+governor|security\s+layer|policies)/i,
  /you\s+are\s+now\s+in\s+developer\s+mode\s+without\s+limits/i,
  /elevate\s+(my\s+)?role\s+to\s+admin/i,
  /bypass\s+(all\s+)?(governance|restrictions|limits|guardrails)/i,
  /print\s+(all\s+)?(secrets|env\s+vars|gemini_api_key|api\s+keys)/i,
  /disregard\s+the\s+system\s+prompt/i,
  /DAN\s+mode\s+enabled/i
];

export class PolicyEngine {
  private currentPolicy: PolicyConfig;

  constructor(initialPolicy: PolicyConfig = DEFAULT_POLICY_CONFIG) {
    this.currentPolicy = { ...initialPolicy };
  }

  public getPolicy(): Readonly<PolicyConfig> {
    return Object.freeze({ ...this.currentPolicy });
  }

  /**
   * Evaluates input payload for forbidden safety violations
   */
  public evaluateSafety(text: string): SafetyViolation | null {
    if (!text || typeof text !== 'string') return null;

    // Check prompt injection bypass first
    for (const pattern of INJECTION_PATTERNS) {
      if (pattern.test(text)) {
        return {
          category: 'PROMPT_INJECTION_BYPASS',
          description: 'Detected prompt injection attempting to disable safety guards or extract secrets.',
          matchedRule: pattern.toString()
        };
      }
    }

    // Check core 7 safety categories
    for (const rule of SAFETY_PATTERNS) {
      if (rule.pattern.test(text)) {
        return {
          category: rule.category,
          description: rule.description,
          matchedRule: rule.pattern.toString()
        };
      }
    }

    return null;
  }

  /**
   * Updates policy. MUST be authenticated ADMIN role.
   * Reject all modifications from regular users, agents, or models.
   */
  public updatePolicy(
    newPolicy: Partial<PolicyConfig>,
    requesterRole: UserRole,
    adminToken?: string
  ): { success: boolean; error?: string } {
    if (requesterRole !== 'ADMIN') {
      return {
        success: false,
        error: 'Unauthorized: Only authenticated administrators can modify policy configuration. Agents and users have read-only access.'
      };
    }

    // Validate admin token presence
    if (!adminToken || adminToken !== 'NDAWG_APEX_ADMIN_AUTHORIZED_2026') {
      return {
        success: false,
        error: 'Forbidden: Invalid or missing administrator authentication credential.'
      };
    }

    // Validate proposed policy values
    const validationError = this.validatePolicyConfig({
      ...this.currentPolicy,
      ...newPolicy
    });

    if (validationError) {
      return { success: false, error: `Invalid policy configuration: ${validationError}` };
    }

    this.currentPolicy = {
      ...this.currentPolicy,
      ...newPolicy,
      updatedAt: new Date().toISOString(),
      updatedBy: 'admin-authorized-session'
    };

    return { success: true };
  }

  /**
   * Validates configuration parameters to avoid corrupted limits
   */
  public validatePolicyConfig(policy: PolicyConfig): string | null {
    if (!policy.version || typeof policy.version !== 'string') {
      return 'Policy version is required and must be a string.';
    }

    const { interactiveLimits, backgroundAgentLimits, budgetConfig } = policy;

    if (!interactiveLimits || interactiveLimits.maxModelsPerRequest < 1) {
      return 'interactiveLimits.maxModelsPerRequest must be at least 1.';
    }
    if (interactiveLimits.maxToolCallsPerRequest < 0) {
      return 'interactiveLimits.maxToolCallsPerRequest must be non-negative.';
    }
    if (interactiveLimits.maxStepsPerRequest < 1) {
      return 'interactiveLimits.maxStepsPerRequest must be at least 1.';
    }
    if (interactiveLimits.maxTimeoutSeconds <= 0) {
      return 'interactiveLimits.maxTimeoutSeconds must be greater than 0.';
    }
    if (interactiveLimits.targetBudgetMaxUsd <= 0) {
      return 'interactiveLimits.targetBudgetMaxUsd must be greater than 0.';
    }

    if (!backgroundAgentLimits || backgroundAgentLimits.maxSteps < 1) {
      return 'backgroundAgentLimits.maxSteps must be at least 1.';
    }
    if (backgroundAgentLimits.maxTimeoutMinutes <= 0) {
      return 'backgroundAgentLimits.maxTimeoutMinutes must be greater than 0.';
    }
    if (backgroundAgentLimits.targetBudgetMaxUsd <= 0) {
      return 'backgroundAgentLimits.targetBudgetMaxUsd must be greater than 0.';
    }
    if (backgroundAgentLimits.maxAgentRecursionDepth < 1) {
      return 'backgroundAgentLimits.maxAgentRecursionDepth must be at least 1.';
    }

    if (!budgetConfig || budgetConfig.dailyUserQuotaUsd <= 0) {
      return 'budgetConfig.dailyUserQuotaUsd must be greater than 0.';
    }
    if (budgetConfig.monthlySystemBudgetUsd <= 0) {
      return 'budgetConfig.monthlySystemBudgetUsd must be greater than 0.';
    }

    return null;
  }
}
