/**
 * NDAWG PRO — Capability Registry (Apex Foundation)
 * Authoritative registry of all system capabilities and baseline audit statuses.
 * Strictly uses the 5 mandatory standard labels:
 *  - Implemented and tested
 *  - Implemented, awaiting configuration
 *  - Partially implemented
 *  - Not implemented
 *  - Test failed
 */

import { CapabilityItem } from './types.ts';

export const CAPABILITY_REGISTRY: CapabilityItem[] = [
  {
    id: 'cap-governor',
    name: 'Final Limits Governor (Pre-Execution Gate)',
    category: 'Governance & Security',
    status: 'Implemented and tested',
    description:
      'Deterministic pre-execution gate enforcing limits on model calls (max 3), tool calls (max 12), execution steps (max 20/50), timeouts, recursion depth, and cost budgets before any provider/tool execution.',
    dependencies: ['PolicyEngine', 'CryptoSubsystem'],
    associatedTests: [
      'P1.1: Model call limit exceeded',
      'P1.2: Tool call limit exceeded',
      'P1.3: Agent max steps exceeded'
    ],
    testEvidence: 'Automated unit tests in src/governance/governance.test.ts passing 100%.',
    lastVerified: '2026-10-22',
    knownLimitations:
      'Client-side enforcement within this SPA. Full server-side proxy required for zero-trust third-party client protection.',
    activationPrerequisites: 'Active by default on all executions.'
  },
  {
    id: 'cap-policy-as-code',
    name: 'Safety & Legal Policy-as-Code Engine',
    category: 'Governance & Security',
    status: 'Implemented and tested',
    description:
      'Pre-model content filter blocking CBRN/WMD, CSAM/CSAE, malware, deepfake fraud, mass copyright piracy, rate-limit circumvention, and private data exfiltration.',
    dependencies: ['PolicyEngine'],
    associatedTests: [
      'P1.7: Unauthorized policy mutation blocked',
      'P1.8: Secret leakage prevention & redaction',
      'P1.9: Prompt injection bypass rejected',
      'P1.11: Invalid policy configuration rejected'
    ],
    testEvidence: 'Unit test suite P1.7, P1.8, P1.9, P1.11 verified clean pass.',
    lastVerified: '2026-10-22',
    knownLimitations:
      'Regex and structural heuristic classification; semantic LLM jury layer will be introduced in Part 2.',
    activationPrerequisites: 'Configured in PolicyConfig version 1.0.0-apex.'
  },
  {
    id: 'cap-audit-hashchain',
    name: 'Tamper-Evident Audit Log (SHA-256 Hash Chain)',
    category: 'Governance & Security',
    status: 'Implemented and tested',
    description:
      'Cryptographic ledger recording timestamp, requestId, anonymized actor hash, target, decision, reason, duration, estimated cost, and parent entry hash.',
    dependencies: ['CryptoSubsystem', 'sha256'],
    associatedTests: ['P1.12: Audit log captures block decisions with hash chain'],
    testEvidence:
      'Cryptographic chain verification algorithm tested against valid chains and simulated tamper corruption.',
    lastVerified: '2026-10-22',
    knownLimitations:
      'Tamper detection is cryptographic inside the chain. Storage layer replacement still requires backend append-only storage.',
    activationPrerequisites: 'Initialized on system startup.'
  },
  {
    id: 'cap-agent-tiers',
    name: '3-Tier Agent Permissions & Approval Gate',
    category: 'Governance & Security',
    status: 'Implemented and tested',
    description:
      'Enforces Tier 1 (Read: auto), Tier 2 (Reversible Write: requires snapshot & rollback payload), and Tier 3 (Irreversible Action: requires explicit human confirmation modal).',
    dependencies: ['LimitsGovernor'],
    associatedTests: ['P1.10: External irreversible action blocked without human confirmation'],
    testEvidence:
      'Test P1.10 asserts that unconfirmed Tier 3 action returns REQUIRE_CONFIRMATION status.',
    lastVerified: '2026-10-22',
    knownLimitations:
      'Confirmation modal requires human operator presence in the UI loop.',
    activationPrerequisites: 'Action metadata must declare action.tier accurately.'
  },
  {
    id: 'cap-circuit-breaker',
    name: 'Circuit Breaker, Kill Switches & Loop Detector',
    category: 'Governance & Security',
    status: 'Implemented and tested',
    description:
      'Circuit breaker trips on consecutive execution failures or identical repetitive agent call loops. Individual kill switches for providers, tools, and global agent pause.',
    dependencies: ['LimitsGovernor'],
    associatedTests: [
      'P1.4: Agent loop detection and circuit breaker trip',
      'P1.5: Budget quota exhaustion and alert trigger',
      'P1.6: Provider kill switch active'
    ],
    testEvidence: 'Unit tests P1.4, P1.5, P1.6 verified passing with simulated loops & spending.',
    lastVerified: '2026-10-22',
    knownLimitations:
      'Circuit breaker reset requires ADMIN authorization or reset timeout.',
    activationPrerequisites: 'Integrated into LimitsGovernor.'
  },
  {
    id: 'cap-ai-core-gemini',
    name: 'AI Core — Gemini Provider Adapter (@google/genai)',
    category: 'AI Core',
    status: 'Implemented, awaiting configuration',
    description:
      'Direct adapter for Gemini 2.5 Flash and Pro models using the modern @google/genai SDK, routed through Limits Governor.',
    dependencies: ['@google/genai', 'LimitsGovernor'],
    associatedTests: ['Gemini integration connectivity tests (Part 2)'],
    testEvidence: 'SDK installed in package.json; awaiting GEMINI_API_KEY injection.',
    lastVerified: '2026-10-22',
    knownLimitations:
      'Requires GEMINI_API_KEY environment variable. If absent, adapter rejects calls gracefully without crashing.',
    activationPrerequisites: 'GEMINI_API_KEY injected in environment.'
  },
  {
    id: 'cap-ai-router',
    name: 'AI Core — Multi-Model Router & Cost Estimator',
    category: 'AI Core',
    status: 'Partially implemented',
    description:
      'Static cost estimation lookup and provider routing table. Dynamic multi-provider failover and latency-based routing scheduled for Part 2.',
    dependencies: ['LimitsGovernor'],
    associatedTests: ['Unit cost estimation table'],
    testEvidence: 'Cost estimator active in Governor; multi-provider dynamic routing pending.',
    lastVerified: '2026-10-22',
    knownLimitations:
      'Currently tracks standard token/call estimates. Dynamic provider health pinging scheduled for Part 2.',
    activationPrerequisites: 'Part 2 Model Router upgrade.'
  },
  {
    id: 'cap-agent-engine',
    name: 'Reliable Agent Engine (Tri-Role Architecture & Resumption)',
    category: 'AI Core',
    status: 'Implemented and tested',
    description:
      'Tri-role separation (Planner, Executor, Verifier) where Planner cannot self-certify its own work. Step-level checkpointing, state resumption, task cancellation with clean accounting, and idempotency key deduplication.',
    dependencies: ['LimitsGovernor', '3-Tier Agent Permissions'],
    associatedTests: [
      'P4.10: Agent Engine enforces independent Verifier role (no self-certification)',
      'P4.11: Checkpoint persistence and state resumption from interruption',
      'P4.12: Cancellation stops execution and idempotency key blocks duplicates'
    ],
    testEvidence: 'Automated unit tests P4.10, P4.11, P4.12 in src/modules/part4.test.ts passing 100%.',
    lastVerified: '2026-10-22',
    knownLimitations:
      'Checkpoints persisted in-memory session. Distributed durable workflow state store queued for Part 5 enterprise tier.',
    activationPrerequisites: 'Active in ReliableAgentEngine.'
  },
  {
    id: 'cap-provider-terms',
    name: 'Provider Terms Registry (Default DENY & Legal Basis)',
    category: 'Governance & Security',
    status: 'Implemented and tested',
    description:
      'Authoritative registry tracking terms of service, intellectual property, retention windows, and output reuse permissions per provider. Default DENY for model training, caching, and persistent storage.',
    dependencies: ['ProviderTermsRegistry', 'PolicyEngine'],
    associatedTests: [
      'P2.1: Unverified provider terms default to restricted',
      'P2.2: Commercial API providers train_on_output defaults to DENY',
      'P2.3: cache_output and store_output denied when unpermitted',
      'P2.11: Unapproved provider blocked from receiving data'
    ],
    testEvidence: 'Unit tests P2.1, P2.2, P2.3, P2.11 passing 100%.',
    lastVerified: '2026-10-22',
    knownLimitations:
      'Terms checks based on registered provider metadata. Periodic manual compliance audit required for provider updates.',
    activationPrerequisites: 'Active by default in ProviderTermsRegistry.'
  },
  {
    id: 'cap-knowledge-engine',
    name: 'Knowledge Engine & Verified Claim Verifier',
    category: 'Knowledge & Memory',
    status: 'Implemented and tested',
    description:
      'Verified knowledge base enforcing 4-tier source ranking, conflict graph mapping, temporal expiration tracking, and reuse_policy enforcement (cache-only, store-with-citation, no-store).',
    dependencies: ['KnowledgeEngine', 'ProviderTermsRegistry'],
    associatedTests: [
      'P2.4: no-store blocked from persistent knowledge base',
      'P2.5: Claim without source labeled Unverified',
      'P2.6: Conflicting claims trigger Conflict Graph',
      'P2.7: Expired source flagged as Outdated',
      'P2.8: Inaccessible URL prevents claim verification'
    ],
    testEvidence: 'Unit tests P2.4, P2.5, P2.6, P2.7, P2.8 passing 100%.',
    lastVerified: '2026-10-22',
    knownLimitations:
      'In-memory graph in Part 2. Persistent distributed vector database integration scheduled for Part 3.',
    activationPrerequisites: 'Initialized in KnowledgeEngine.'
  },
  {
    id: 'cap-learning-router',
    name: 'Learning Router & Live Orchestration',
    category: 'AI Core',
    status: 'Implemented and tested',
    description:
      'Adaptive model router recommending best provider per task domain based on historical benchmarks, with outlier protection rejecting unverified feedback or low sample counts.',
    dependencies: ['LearningRouter', 'ProviderTermsRegistry'],
    associatedTests: ['P2.9: Learning router rejects unverified updates or low sample count'],
    testEvidence: 'Unit test P2.9 passing 100%.',
    lastVerified: '2026-10-22',
    knownLimitations:
      'Updates routing scoring matrix only; does not alter model weights. Requires minimum 3 samples to shift weights.',
    activationPrerequisites: 'Active in LearningRouter.'
  },
  {
    id: 'cap-cross-critique',
    name: 'Multi-Model Cross-Critique Orchestration',
    category: 'AI Core',
    status: 'Implemented and tested',
    description:
      'Orchestrates initial proposal (Model A), cross-family critique (Model B), factual tool verification, and synthesis (Synthesizer) with full execution trace.',
    dependencies: ['CrossCritiqueEngine', 'LimitsGovernor'],
    associatedTests: ['CrossCritique trace verification in UI and execution tests'],
    testEvidence: 'End-to-end execution trace verified with step logging.',
    lastVerified: '2026-10-22',
    knownLimitations:
      'Higher latency and cost; invoked on complex queries rather than default for all simple requests.',
    activationPrerequisites: 'Triggered via CrossCritique pipeline.'
  },
  {
    id: 'cap-playbook-library',
    name: 'Playbook Library (Validated SOPs with Rollback)',
    category: 'Studio & Tools',
    status: 'Implemented and tested',
    description:
      'Standard operating procedure repository containing prompt templates, tool sequences, task checklists, and atomic version rollback.',
    dependencies: ['PlaybookLibrary'],
    associatedTests: ['P2.10: Playbook modifications preserve history and support atomic rollback'],
    testEvidence: 'Unit test P2.10 passing 100%.',
    lastVerified: '2026-10-22',
    knownLimitations:
      'Rollback is bounded by in-memory history stack in Part 2.',
    activationPrerequisites: 'Active in PlaybookLibrary.'
  },
  {
    id: 'cap-eval-harness',
    name: 'Empirical Evaluation Harness (10 Benchmark Categories & Drift Monitor)',
    category: 'AI Core',
    status: 'Implemented and tested',
    description:
      'Independent empirical benchmark suite across 10 categories with versioned Golden Sets, automated and deterministic objective checks, and drift alerts on version changes, quality drops, or latency spikes.',
    dependencies: ['EvalHarnessEngine', 'CryptoSubsystem'],
    associatedTests: [
      '1. Real test scores calculated from executions',
      '2. Sample count < 5 displays INSUFFICIENT_DATA',
      '3. Model version change triggers drift alert & re-eval',
      '4. Scorecard separates metrics per task category'
    ],
    testEvidence: 'Automated unit tests in src/evaluation/evaluation.test.ts passing 100%.',
    lastVerified: '2026-10-22',
    knownLimitations: 'Heuristic rubric evaluations for open-ended pedagogical explanations require multi-judge scoring.',
    activationPrerequisites: 'Active in EvalHarnessEngine.'
  },
  {
    id: 'cap-model-scorecard',
    name: 'Multi-Dimensional Model Scorecard (Anti-Deception Matrix)',
    category: 'AI Core',
    status: 'Implemented and tested',
    description:
      'Multi-dimensional score matrix by provider, model ID, version, and task category. Strictly displays "Chưa đủ dữ liệu đánh giá." when samples < 5. Never aggregates into a deceptive single score.',
    dependencies: ['EvalHarnessEngine'],
    associatedTests: [
      '2. Sample count < 5 displays INSUFFICIENT_DATA',
      '4. Scorecard separates metrics per task category'
    ],
    testEvidence: 'Unit tests 2 & 4 verified clean pass.',
    lastVerified: '2026-10-22',
    knownLimitations: 'Requires at least 5 empirical test runs before displaying quantitative score.',
    activationPrerequisites: 'Integrated in ModelScorecardView.'
  },
  {
    id: 'cap-apex-orchestrator',
    name: 'Apex Orchestrator (DAG Parallel Dispatch, Cascade, Privacy Gate & Provenance)',
    category: 'AI Core',
    status: 'Implemented and tested',
    description:
      'Task Graph (DAG) planner executing independent nodes in parallel via Promise.all, Cascade router escalating fast-to-advanced models with budget/step halts, Bounded Reflection (max 3 turns, loop breaker), Privacy Gate blocking unapproved endpoints, and auditable Provenance Reports.',
    dependencies: ['ApexOrchestrator', 'LimitsGovernor', 'ProviderTermsRegistry'],
    associatedTests: [
      '5. Cascade router rejects unapproved providers',
      '6. Cascade halts cleanly on budget exhaustion',
      '7. Task graph halts on max steps limit',
      '8. Loop breaker prevents infinite reflection',
      '9. Independent steps execute in parallel',
      '10. Privacy gate blocks sensitive data sent to unapproved provider',
      '11. Provenance report accurately records all called models and tools',
      '12. Learning router score matrix supports atomic rollback'
    ],
    testEvidence: 'Unit tests 5 through 12 in src/evaluation/evaluation.test.ts verified passing 100%.',
    lastVerified: '2026-10-22',
    knownLimitations: 'Step execution timeout is enforced per batch. Full distributed multi-machine DAG worker queued for Part 5.',
    activationPrerequisites: 'Active in ApexOrchestrator.'
  },
  {
    id: 'cap-open-weight-teachers',
    name: 'Open-Weight Teachers (SFT/LoRA/DPO Training)',
    category: 'AI Core',
    status: 'Not implemented',
    description:
      'Fine-tuning pipeline for open-weight models (Llama, Mistral) utilizing SFT, LoRA, and DPO under valid community licenses.',
    dependencies: ['GPU Cluster', 'Training Framework (PyTorch/HuggingFace)'],
    associatedTests: ['Not implemented'],
    testEvidence: 'None. Honest assessment: requires dedicated GPU training cluster not provisioned in web sandbox.',
    lastVerified: '2026-10-22',
    knownLimitations:
      'No multi-GPU infrastructure available in current environment. Pipeline specified but un-runnable without external training cluster.',
    activationPrerequisites: 'Dedicated GPU infrastructure and approved training budget.'
  },
  {
    id: 'cap-memory-system',
    name: 'State Memory & Session Checkpointing',
    category: 'Knowledge & Memory',
    status: 'Partially implemented',
    description:
      'Local snapshotting and reversible state checkpointing for Tier 2 writes. Persistent vector database storage scheduled for Part 3.',
    dependencies: ['LocalStorage / State Manager'],
    associatedTests: ['State rollback unit test'],
    testEvidence: 'Snapshot-before metadata captured in Tier 2 actions.',
    lastVerified: '2026-10-22',
    knownLimitations: 'Transient session memory; external persistent database integration in Part 3.',
    activationPrerequisites: 'Part 3 persistence layer.'
  },
  {
    id: 'cap-image-studio',
    name: 'Image Studio & Immutable Original Asset Preservation',
    category: 'Studio & Tools',
    status: 'Implemented and tested',
    description:
      'Asset versioning pipeline with immutable original buffer protection, mask drift calculation (>2% threshold warning), seam blend reconstruction, honest quality control, and strict anti-deepfake safety filters.',
    dependencies: ['ImageStudioEngine', 'LimitsGovernor'],
    associatedTests: [
      'P4.1: Immutable original buffer preservation & undo rollback',
      'P4.2: Outside-mask drift warning when ratio exceeds 2%',
      'P4.3: Honest failure handling when service fails (no false success)'
    ],
    testEvidence: 'Automated unit tests P4.1, P4.2, P4.3 in src/modules/part4.test.ts passing 100%.',
    lastVerified: '2026-10-22',
    knownLimitations:
      'Client-side vector/canvas representation. Distributed GPU rendering cluster queued for future scale.',
    activationPrerequisites: 'Active in ImageStudioEngine.'
  },
  {
    id: 'cap-code-lab',
    name: 'Code Lab (Repo Map, Test-First Workflow & Sandbox)',
    category: 'Studio & Tools',
    status: 'Implemented and tested',
    description:
      'Interactive codebase repository map, strict 8-step Test-First workflow with reversible checkpoints, 6-dimension Second Review scanner, and isolated code sandbox with zero admin privileges and resource quotas.',
    dependencies: ['CodeLabEngine', 'LimitsGovernor'],
    associatedTests: [
      'P4.4: Code Lab Test-First 8-step workflow records diff & progression',
      'P4.5: Sandbox blocks untrusted code from host secrets & admin privileges'
    ],
    testEvidence: 'Automated unit tests P4.4 and P4.5 in src/modules/part4.test.ts passing 100%.',
    lastVerified: '2026-10-22',
    knownLimitations:
      'In-browser sandbox enforces deterministic bounds; full containerized Docker runner queued for enterprise deployment.',
    activationPrerequisites: 'Active in CodeLabEngine.'
  },
  {
    id: 'cap-game-intelligence',
    name: 'Game Intelligence (Patch-Linked Meta & Provenance Engine)',
    category: 'Vertical Centers',
    status: 'Implemented and tested',
    description:
      'Game knowledge linked to active patch, season, and update timestamp with 3-tier provenance (Official Data, Community Meta, AI Hypothesis) and automatic outdated patch warnings.',
    dependencies: ['GameIntelligenceEngine'],
    associatedTests: [
      'P4.6: Distinguishes official vs AI hypothesis and emits outdated patch alert'
    ],
    testEvidence: 'Automated unit test P4.6 in src/modules/part4.test.ts passing 100%.',
    lastVerified: '2026-10-22',
    knownLimitations:
      'Historical patch database covers active seed titles. Dynamic live Riot/Valve API webhook crawler queued for Part 5.',
    activationPrerequisites: 'Active in GameIntelligenceEngine.'
  },
  {
    id: 'cap-study-center',
    name: 'Study Center (SuperMemo SM-2 & Empirical Active Recall)',
    category: 'Vertical Centers',
    status: 'Implemented and tested',
    description:
      'Mathematical SuperMemo SM-2 spaced repetition algorithm, memory retention calculation R(t) = exp(-t/S), and genuine mastery percentages derived exclusively from empirical attempt logs (no fake badges).',
    dependencies: ['StudyCenterEngine'],
    associatedTests: [
      'P4.7: SuperMemo SM-2 interval and ease factor calculation on real grade',
      'P4.8: Mastery percentage accurately reflects real attempt history only'
    ],
    testEvidence: 'Automated unit tests P4.7 and P4.8 in src/modules/part4.test.ts passing 100%.',
    lastVerified: '2026-10-22',
    knownLimitations:
      'Flashcards stored in reactive session state. Cloud sync across devices queued for Part 5.',
    activationPrerequisites: 'Active in StudyCenterEngine.'
  },
  {
    id: 'cap-work-center',
    name: 'Work Center (Deterministic Math Engine & Verified Exporter)',
    category: 'Vertical Centers',
    status: 'Implemented and tested',
    description:
      'Verifiable descriptive and bivariate statistical engine (mean, median, variance, std dev, pearson r, linear regression) and genuine downloadable artifact generators (CSV, Markdown reports, SVG charts) with strict download verification gate.',
    dependencies: ['WorkCenterEngine'],
    associatedTests: [
      'P4.9: Statistical computations verified and downloadable artifacts generated'
    ],
    testEvidence: 'Automated unit test P4.9 in src/modules/part4.test.ts passing 100%.',
    lastVerified: '2026-10-22',
    knownLimitations:
      'Statistical calculations bounded by JavaScript double-precision float limits.',
    activationPrerequisites: 'Active in WorkCenterEngine.'
  }
];
