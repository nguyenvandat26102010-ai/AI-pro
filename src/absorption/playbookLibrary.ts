/**
 * NDAWG PRO — PLAYBOOK LIBRARY
 * Validated Standard Operating Procedures (SOPs), prompt templates,
 * and tool sequences with strict versioning and atomic rollback.
 */

import { PlaybookEntry, TaskDomain } from './types.ts';

export const INITIAL_PLAYBOOKS: PlaybookEntry[] = [
  {
    id: 'pb_audit_review',
    name: 'Enterprise Security Code Audit & Dependency Scanner',
    taskDomain: 'CODING',
    promptTemplate:
      'Perform rigorous static vulnerability analysis on target AST. Check for secret leaks, unvalidated inputs, prototype pollution, and out-of-bounds index access.',
    toolSequence: ['ast_parser', 'cve_database_lookup', 'secret_entropy_scanner'],
    taskChecklist: [
      'Parse AST without executing arbitrary untrusted code',
      'Scan against known CVE advisories',
      'Check for high-entropy tokens matching API keys',
      'Generate remediation report with code snippets'
    ],
    applicabilityConditions: ['TypeScript/JavaScript projects', 'Python source trees'],
    nonApplicabilityConditions: ['Pre-compiled binary blobs', 'Untyped machine assembly'],
    version: 2,
    previousVersions: [
      {
        version: 1,
        timestamp: '2026-09-01T08:00:00Z',
        promptTemplate: 'Scan code for bugs and security vulnerabilities.',
        toolSequence: ['regex_search', 'npm_audit'],
        taskChecklist: ['Run npm audit', 'Check for obvious bugs'],
        evaluationScore: 0.78
      }
    ],
    evaluationScore: 0.94,
    evaluationSampleCount: 38,
    isRecommended: true,
    createdDate: '2026-09-01',
    reviewDueDate: '2026-12-01',
    referenceSource: 'NIST SP 800-218 Secure Software Development Framework',
    usagePermissions: 'Open for enterprise internal audit workflows'
  },
  {
    id: 'pb_fact_checking',
    name: 'Multi-Source Grounded Fact Verification',
    taskDomain: 'RESEARCH',
    promptTemplate:
      'Deconstruct query into atomic claims. Cross-verify each claim against Tier 1 official sources or Tier 2 peer-reviewed literature. Flag any conflicting evidence.',
    toolSequence: ['claim_extractor', 'google_search_grounding', 'doi_resolver'],
    taskChecklist: [
      'Deconstruct into atomic falsifiable propositions',
      'Rank supporting sources according to 4-tier hierarchy',
      'Check for temporal freshness and expiration',
      'Construct conflict edge if contradiction exists'
    ],
    applicabilityConditions: ['Empirical scientific claims', 'Regulatory & compliance inquiries'],
    nonApplicabilityConditions: ['Subjective aesthetic evaluations', 'Creative fiction generation'],
    version: 1,
    previousVersions: [],
    evaluationScore: 0.92,
    evaluationSampleCount: 52,
    isRecommended: true,
    createdDate: '2026-10-05',
    reviewDueDate: '2026-12-31',
    referenceSource: 'Fact-checking best practices & IEEE Standards',
    usagePermissions: 'Open attribution license'
  }
];

export class PlaybookLibrary {
  private playbooks: Map<string, PlaybookEntry>;

  constructor(initialEntries: PlaybookEntry[] = INITIAL_PLAYBOOKS) {
    this.playbooks = new Map();
    for (const p of initialEntries) {
      this.playbooks.set(p.id, { ...p });
    }
  }

  public getAll(): PlaybookEntry[] {
    return Array.from(this.playbooks.values());
  }

  public getById(id: string): PlaybookEntry | null {
    return this.playbooks.has(id) ? { ...this.playbooks.get(id)! } : null;
  }

  /**
   * Updates an existing playbook, capturing a historical snapshot for atomic rollback.
   */
  public updatePlaybook(
    id: string,
    updates: Partial<Omit<PlaybookEntry, 'id' | 'version' | 'previousVersions'>>,
    _updatedBy: string
  ): { success: boolean; playbook?: PlaybookEntry; error?: string } {
    const existing = this.playbooks.get(id);
    if (!existing) {
      return { success: false, error: 'Playbook not found.' };
    }

    // Save previous version snapshot
    const snapshot = {
      version: existing.version,
      timestamp: new Date().toISOString(),
      promptTemplate: existing.promptTemplate,
      toolSequence: [...existing.toolSequence],
      taskChecklist: [...existing.taskChecklist],
      evaluationScore: existing.evaluationScore
    };

    const newVersion = existing.version + 1;
    const updated: PlaybookEntry = {
      ...existing,
      ...updates,
      version: newVersion,
      previousVersions: [snapshot, ...existing.previousVersions]
    };

    this.playbooks.set(id, updated);
    return { success: true, playbook: updated };
  }

  /**
   * Rolls back a playbook to its immediate previous version.
   */
  public rollbackPlaybook(id: string): {
    success: boolean;
    restoredVersion?: number;
    error?: string;
  } {
    const existing = this.playbooks.get(id);
    if (!existing) {
      return { success: false, error: 'Playbook not found.' };
    }

    if (!existing.previousVersions || existing.previousVersions.length === 0) {
      return {
        success: false,
        error: `Playbook '${existing.name}' has no previous version to roll back to (currently at version ${existing.version}).`
      };
    }

    const [targetPrevious, ...remainingHistory] = existing.previousVersions;

    const restored: PlaybookEntry = {
      ...existing,
      version: targetPrevious.version,
      promptTemplate: targetPrevious.promptTemplate,
      toolSequence: [...targetPrevious.toolSequence],
      taskChecklist: [...targetPrevious.taskChecklist],
      evaluationScore: targetPrevious.evaluationScore,
      previousVersions: remainingHistory
    };

    this.playbooks.set(id, restored);
    return { success: true, restoredVersion: restored.version };
  }
}
