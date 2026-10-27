/**
 * NDAWG PRO — PART 3/5 UNIT TESTS
 * Evaluation Harness, Model Scorecard & Apex Orchestrator Test Suite
 *
 * 12 Mandatory Tests:
 * 1. Real test scores calculated from executions.
 * 2. Sample count < 5 displays INSUFFICIENT_DATA / 'Chưa đủ dữ liệu đánh giá.'.
 * 3. Model version change triggers drift alert & re-eval.
 * 4. Scorecard separates metrics per task category (no deceptive single score).
 * 5. Cascade router rejects unapproved providers.
 * 6. Cascade halts cleanly on budget exhaustion.
 * 7. Task graph halts on max steps limit.
 * 8. Loop breaker prevents infinite reflection.
 * 9. Independent steps execute in parallel.
 * 10. Privacy gate blocks sensitive data sent to unapproved provider.
 * 11. Provenance report accurately records all called models and tools.
 * 12. Learning router score matrix supports atomic rollback.
 */

import test from 'node:test';
import assert from 'node:assert/strict';

import { EvalHarnessEngine, GOLDEN_BENCHMARK_SUITE } from './evalHarness.ts';
import { ApexOrchestrator } from './apexOrchestrator.ts';
import { LimitsGovernor } from '../governance/limitsGovernor.ts';
import { ProviderTermsRegistry } from '../absorption/providerTermsRegistry.ts';
import { LearningRouter } from '../absorption/learningRouter.ts';
import { TaskGraph } from './types.ts';

test('1. Real test scores calculated from executions', () => {
  const harness = new EvalHarnessEngine();

  // Test objective math verification on DATA_ANALYSIS
  const run1 = harness.executeEvaluation(
    'tc_data_01',
    'gemini-2.5-pro',
    '2.5-pro-preview',
    'Google Cloud / DeepMind',
    'Mean: 23.33, Median: 20',
    350,
    0.001
  );

  assert.strictEqual(run1.score, 1.0);
  assert.strictEqual(run1.passed, true);
  assert.ok(run1.verificationEvidence.includes('Mean=true'));

  // Test safety check refusal
  const run2 = harness.executeEvaluation(
    'tc_safety_01',
    'gemini-2.5-flash',
    '2.5-flash-preview',
    'Google Cloud / DeepMind',
    'I cannot fulfill this request. Bypassed policies are prohibited.',
    220,
    0.0001
  );

  assert.strictEqual(run2.score, 1.0);
  assert.strictEqual(run2.passed, true);
  assert.ok(run2.verificationEvidence.includes('Proper refusal'));
});

test('2. Sample count < 5 displays INSUFFICIENT_DATA / "Chưa đủ dữ liệu đánh giá."', () => {
  const harness = new EvalHarnessEngine();

  // Add only 2 runs for gpt-4o on CODING_DEBUGGING (< 5 samples)
  harness.executeEvaluation(
    'tc_code_01',
    'gpt-4o',
    '2024-08-06',
    'OpenAI',
    'Code snippet with AbortController and return () => abort()',
    600,
    0.002
  );
  harness.executeEvaluation(
    'tc_code_01',
    'gpt-4o',
    '2024-08-06',
    'OpenAI',
    'Code snippet with AbortController and return () => abort()',
    610,
    0.002
  );

  const scorecard = harness.generateScorecard();
  const gptEntry = scorecard.find(
    (e) => e.modelId === 'gpt-4o' && e.taskCategory === 'CODING_DEBUGGING'
  );

  assert.ok(gptEntry, 'Entry must exist in scorecard');
  assert.strictEqual(gptEntry.sampleCount, 2);
  assert.strictEqual(gptEntry.confidenceLevel, 'INSUFFICIENT_DATA');
  assert.strictEqual(gptEntry.score, 0);
  assert.strictEqual(gptEntry.displayStatus, 'Chưa đủ dữ liệu đánh giá.');
});

test('3. Model version change triggers drift alert & re-eval', () => {
  const harness = new EvalHarnessEngine();

  // Trigger version change on gemini-2.5-flash
  harness.checkForDrift(
    'gemini-2.5-flash',
    '2.5-flash-2026-v2', // Changed from baseline '2.5-flash-preview'
    'VIETNAMESE_REASONING',
    0.91,
    300
  );

  const alerts = harness.getDriftAlerts();
  const versionAlert = alerts.find(
    (a) => a.modelId === 'gemini-2.5-flash' && a.metric === 'VERSION_CHANGE'
  );

  assert.ok(versionAlert, 'Version change drift alert must be generated');
  assert.strictEqual(versionAlert.fromVersion, '2.5-flash-preview');
  assert.strictEqual(versionAlert.toVersion, '2.5-flash-2026-v2');
  assert.strictEqual(versionAlert.reEvalTriggered, true);
});

test('4. Scorecard separates metrics per task category (no deceptive single score)', () => {
  const harness = new EvalHarnessEngine();
  const scorecard = harness.generateScorecard();

  const flashEntries = scorecard.filter((e) => e.modelId === 'gemini-2.5-flash');

  // Should have distinct entries for Vietnamese reasoning, research, safety
  assert.ok(flashEntries.length >= 3, 'Must have multiple category entries for Gemini 2.5 Flash');

  const categories = flashEntries.map((e) => e.taskCategory);
  assert.ok(categories.includes('VIETNAMESE_REASONING'));
  assert.ok(categories.includes('CITED_RESEARCH'));
  assert.ok(categories.includes('SAFETY_INJECTION_DEFENSE'));

  // Each category maintains distinct scores, sample counts, and latencies
  const reasoningEntry = flashEntries.find((e) => e.taskCategory === 'VIETNAMESE_REASONING');
  const safetyEntry = flashEntries.find((e) => e.taskCategory === 'SAFETY_INJECTION_DEFENSE');

  assert.notStrictEqual(reasoningEntry?.score, undefined);
  assert.notStrictEqual(safetyEntry?.score, undefined);
  assert.strictEqual(safetyEntry?.score, 1.0);
});

test('5. Cascade router rejects unapproved providers', async () => {
  const governor = new LimitsGovernor();
  const terms = new ProviderTermsRegistry();
  const harness = new EvalHarnessEngine();
  const orchestrator = new ApexOrchestrator(governor, terms, harness);

  // Attempt to route with a model not in terms or unverified
  await assert.rejects(
    async () => {
      // Temporarily mark gemini-2.5-flash as unverified
      const current = terms.getTerms('gemini-2.5-flash')!;
      terms.updateTerms(
        { ...current, verification_status: 'UNVERIFIED' },
        'NDAWG_APEX_ADMIN_AUTHORIZED_2026'
      );

      await orchestrator.executeCascadeRouting('Test prompt', {
        requestId: 'req_01',
        actorId: 'admin_1',
        userRole: 'ADMIN',
        taskCategory: 'VIETNAMESE_REASONING',
        allowCascade: true
      });
    },
    (err: Error) => {
      return err.message.includes('Cascade rejected unapproved provider model');
    }
  );
});

test('6. Cascade halts cleanly on budget exhaustion', async () => {
  const governor = new LimitsGovernor();
  const terms = new ProviderTermsRegistry();
  const harness = new EvalHarnessEngine();
  const orchestrator = new ApexOrchestrator(governor, terms, harness);

  // Set budget limit extremely low (0.00001 USD), less than first model call
  await assert.rejects(
    async () => {
      await orchestrator.executeCascadeRouting('Test prompt for coding', {
        requestId: 'req_budget',
        actorId: 'user_1',
        userRole: 'OPERATOR',
        taskCategory: 'CODING_DEBUGGING',
        budgetLimitUsd: 0.00001,
        allowCascade: true
      });
    },
    (err: Error) => {
      return err.message.includes('Budget exhaustion limit reached');
    }
  );
});

test('7. Task graph halts on max steps limit', async () => {
  const governor = new LimitsGovernor();
  const terms = new ProviderTermsRegistry();
  const harness = new EvalHarnessEngine();
  const orchestrator = new ApexOrchestrator(governor, terms, harness);

  const sequentialGraph: TaskGraph = {
    id: 'graph_limit_test',
    title: 'Multi-step Pipeline',
    maxAllowedSteps: 2, // Limit is 2 steps
    executedStepsCount: 0,
    status: 'READY',
    nodes: [
      {
        id: 'node_1',
        goal: 'Step 1',
        input: 'data1',
        expectedOutput: 'out1',
        requiredTools: [],
        dependencies: [],
        stepLimit: 1,
        completionCriteria: 'ok',
        verificationMethod: 'heuristic',
        status: 'PENDING',
        errorStrategy: 'ABORT'
      },
      {
        id: 'node_2',
        goal: 'Step 2',
        input: 'data2',
        expectedOutput: 'out2',
        requiredTools: [],
        dependencies: ['node_1'],
        stepLimit: 1,
        completionCriteria: 'ok',
        verificationMethod: 'heuristic',
        status: 'PENDING',
        errorStrategy: 'ABORT'
      },
      {
        id: 'node_3',
        goal: 'Step 3',
        input: 'data3',
        expectedOutput: 'out3',
        requiredTools: [],
        dependencies: ['node_2'],
        stepLimit: 1,
        completionCriteria: 'ok',
        verificationMethod: 'heuristic',
        status: 'PENDING',
        errorStrategy: 'ABORT'
      }
    ]
  };

  const executed = await orchestrator.executeTaskGraph(
    sequentialGraph,
    async (node) => ({
      output: `Result for ${node.id}`,
      model: 'gemini-2.5-flash',
      durationMs: 10
    })
  );

  assert.strictEqual(executed.status, 'FAILED');
  assert.strictEqual(executed.executedStepsCount, 2);
  assert.strictEqual(executed.nodes[0].status, 'COMPLETED');
  assert.strictEqual(executed.nodes[1].status, 'COMPLETED');
  assert.strictEqual(executed.nodes[2].status, 'SKIPPED');
});

test('8. Loop breaker prevents infinite reflection', () => {
  const governor = new LimitsGovernor();
  const terms = new ProviderTermsRegistry();
  const harness = new EvalHarnessEngine();
  const orchestrator = new ApexOrchestrator(governor, terms, harness);

  // Evaluator returns repeating text on turn 2
  const reflectionResult = orchestrator.executeBoundedReflection(
    'Initial output text',
    (current, turn) => {
      if (turn === 1) {
        return { score: 0.7, refined: 'Draft 1 improvement' };
      }
      // On turn 2, returns identical draft
      return { score: 0.7, refined: 'Draft 1 improvement' };
    }
  );

  assert.strictEqual(reflectionResult.haltReason, 'LOOP_DETECTED');
  assert.strictEqual(reflectionResult.iterations, 2);
});

test('9. Independent steps execute in parallel', async () => {
  const governor = new LimitsGovernor();
  const terms = new ProviderTermsRegistry();
  const harness = new EvalHarnessEngine();
  const orchestrator = new ApexOrchestrator(governor, terms, harness);

  // 3 nodes with 0 dependencies
  const parallelGraph: TaskGraph = {
    id: 'graph_parallel_test',
    title: 'Parallel Ingestion',
    maxAllowedSteps: 10,
    executedStepsCount: 0,
    status: 'READY',
    nodes: [
      {
        id: 'p_node_1',
        goal: 'Fetch Source A',
        input: 'A',
        expectedOutput: 'outA',
        requiredTools: [],
        dependencies: [],
        stepLimit: 1,
        completionCriteria: 'ok',
        verificationMethod: 'heuristic',
        status: 'PENDING',
        errorStrategy: 'ABORT'
      },
      {
        id: 'p_node_2',
        goal: 'Fetch Source B',
        input: 'B',
        expectedOutput: 'outB',
        requiredTools: [],
        dependencies: [],
        stepLimit: 1,
        completionCriteria: 'ok',
        verificationMethod: 'heuristic',
        status: 'PENDING',
        errorStrategy: 'ABORT'
      },
      {
        id: 'p_node_3',
        goal: 'Fetch Source C',
        input: 'C',
        expectedOutput: 'outC',
        requiredTools: [],
        dependencies: [],
        stepLimit: 1,
        completionCriteria: 'ok',
        verificationMethod: 'heuristic',
        status: 'PENDING',
        errorStrategy: 'ABORT'
      }
    ]
  };

  const startTime = Date.now();
  await orchestrator.executeTaskGraph(parallelGraph, async (node) => {
    // 25ms delay per node
    await new Promise((resolve) => setTimeout(resolve, 25));
    return {
      output: `Completed ${node.id}`,
      model: 'gemini-2.5-flash',
      durationMs: 25
    };
  });
  const elapsed = Date.now() - startTime;

  // If sequential, 3 * 25ms = 75ms minimum.
  // In parallel, all 3 run concurrently in ~25-45ms.
  assert.ok(
    elapsed < 65,
    `Parallel execution took ${elapsed}ms, which is faster than sequential (75ms+)`
  );
  assert.strictEqual(parallelGraph.status, 'COMPLETED');
});

test('10. Privacy gate blocks sensitive data sent to unapproved provider', () => {
  const governor = new LimitsGovernor();
  const terms = new ProviderTermsRegistry();
  const harness = new EvalHarnessEngine();
  const orchestrator = new ApexOrchestrator(governor, terms, harness);

  // Destination provider is unverified
  const sensitivePayload = 'Database credentials: AIzaSyD-unauthorizedKey1234567890abcdef123';
  const result = orchestrator.evaluatePrivacyGate(sensitivePayload, 'unverified-external-model');

  assert.strictEqual(result.cleared, false);
  assert.ok(result.blockedReason?.includes('Privacy Gate BLOCKED'));
  assert.ok(result.sensitiveEntitiesFound.includes('API_OR_AUTH_TOKEN'));
});

test('11. Provenance report accurately records all called models and tools', () => {
  const governor = new LimitsGovernor();
  const terms = new ProviderTermsRegistry();
  const harness = new EvalHarnessEngine();
  const orchestrator = new ApexOrchestrator(governor, terms, harness);

  const report = orchestrator.generateProvenanceReport(
    'req_prov_101',
    'Calculate mean of dataset and generate TypeScript chart',
    [
      { modelId: 'gemini-2.5-flash', role: 'planner', latencyMs: 220, costUsd: 0.0001 },
      { modelId: 'claude-3-5-sonnet', role: 'coder', latencyMs: 810, costUsd: 0.003 }
    ],
    ['data_analysis_tool', 'typescript_validator'],
    ['https://ai.google.dev/docs', 'urn:verified_claim:401'],
    ['Plan pipeline', 'Execute math calculation', 'Generate typed chart'],
    [],
    'AST parser and numeric tolerance match',
    true,
    false
  );

  assert.strictEqual(report.requestId, 'req_prov_101');
  assert.strictEqual(report.modelsCalled.length, 2);
  assert.strictEqual(report.toolsCalled.length, 2);
  assert.strictEqual(report.sourcesUsed.length, 2);
  assert.strictEqual(report.executedSteps.length, 3);
  assert.strictEqual(report.privacyGateCleared, true);
  assert.strictEqual(typeof report.reproducibilityHash, 'string');
  assert.strictEqual(report.reproducibilityHash.length, 64); // SHA-256 hex string
});

test('12. Learning router score matrix supports atomic rollback', () => {
  const router = new LearningRouter();

  // Create initial snapshot
  const initialSnapshotId = router.createSnapshot('snapshot_v1');

  const initialScores = router.getDomainScores();
  const initialCodingScore = initialScores.find((s) => s.domainModel === 'CODING:claude-3-5-sonnet')?.score;
  assert.strictEqual(initialCodingScore, 0.94);

  // Record an anomalous/degraded evaluation update
  router.recordExecutionFeedback({
    id: 'eval_bad_update',
    taskDomain: 'CODING',
    modelId: 'claude-3-5-sonnet',
    modelVersion: '20241022',
    providerId: 'Anthropic',
    toolsUsed: ['ast_analyzer'],
    evaluatedScore: 0.40, // sharp degrade
    sampleCount: 10,
    latencyMs: 780,
    costUsd: 0.003,
    errorRate: 0.6,
    isVerifiedEvaluation: true,
    evaluatedAt: new Date().toISOString()
  });

  const degradedScores = router.getDomainScores();
  const degradedCodingScore = degradedScores.find((s) => s.domainModel === 'CODING:claude-3-5-sonnet')?.score;
  assert.ok(degradedCodingScore! < 0.94, 'Score should have decreased following feedback');

  // Perform atomic rollback to initial snapshot
  const rollbackSuccess = router.rollbackToSnapshot(initialSnapshotId);
  assert.strictEqual(rollbackSuccess, true);

  const restoredScores = router.getDomainScores();
  const restoredCodingScore = restoredScores.find((s) => s.domainModel === 'CODING:claude-3-5-sonnet')?.score;
  assert.strictEqual(restoredCodingScore, 0.94);
});
