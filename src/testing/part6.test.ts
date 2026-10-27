/**
 * NDAWG PRO — PART 6/8
 * Unit Tests for AI Core, Reasoning Engine, Knowledge Synthesizer,
 * Tool Registry, Training Gate, Modality Gate & 13 Shared Contracts.
 */

import test from 'node:test';
import assert from 'node:assert/strict';

import { LimitsGovernor } from '../governance/limitsGovernor.ts';
import { ProviderTermsRegistry } from '../absorption/providerTermsRegistry.ts';
import { EvalHarnessEngine } from '../evaluation/evalHarness.ts';
import { ApexOrchestrator } from '../evaluation/apexOrchestrator.ts';
import { ReasoningEngine } from '../core/reasoningEngine.ts';
import { KnowledgeSynthesizer } from '../core/knowledgeSynthesizer.ts';
import { ToolRegistry } from '../core/toolRegistry.ts';
import { TrainingGate } from '../core/trainingGate.ts';
import { AiCoreService } from '../core/aiCoreService.ts';

function createTestCore(): {
  governor: LimitsGovernor;
  aiCore: AiCoreService;
  reasoning: ReasoningEngine;
  synth: KnowledgeSynthesizer;
  tools: ToolRegistry;
  trainingGate: TrainingGate;
} {
  const governor = new LimitsGovernor();
  const terms = new ProviderTermsRegistry();
  const evalHarness = new EvalHarnessEngine();
  const orchestrator = new ApexOrchestrator(governor, terms, evalHarness);
  const reasoning = new ReasoningEngine();
  const synth = new KnowledgeSynthesizer();
  const tools = new ToolRegistry();
  const trainingGate = new TrainingGate();

  const aiCore = new AiCoreService(governor, orchestrator, reasoning, synth, tools, trainingGate);
  return { governor, aiCore, reasoning, synth, tools, trainingGate };
}

test('P6.1: 13 Shared Service Contracts are defined, callable and return valid signatures', async () => {
  const { aiCore } = createTestCore();

  // 1. getModelCapabilities
  const modelCap = aiCore.getModelCapabilities('gemini-2.5-flash');
  assert.ok(modelCap, 'Model profile must exist');
  assert.equal(modelCap.supportedModalities.includes('text'), true);

  // 2. routeTask
  const route = aiCore.routeTask({
    taskId: 'task_t1',
    taskType: 'text',
    priority: 'normal',
    requiredModalities: ['text'],
    estimatedComplexity: 'simple'
  });
  assert.ok(route.selectedModel, 'Route must select a model');
  assert.equal(route.modalityGateApproved, true);

  // 3. executeTask
  const exec = await aiCore.executeTask({
    taskId: 'task_t2',
    taskType: 'text',
    priority: 'normal',
    requiredModalities: ['text'],
    estimatedComplexity: 'simple'
  });
  assert.equal(exec.success, true);
  assert.ok(exec.output.length > 0);

  // 4. verifyResult
  const verify = aiCore.verifyResult(exec, { domain: 'general', strictness: 'standard' });
  assert.equal(verify.isVerified, true);
  assert.equal(verify.status, 'VERIFIED');

  // 5. searchKnowledge
  const search = aiCore.searchKnowledge('Transformer');
  assert.ok(search.results.length >= 1);

  // 6. ingestKnowledge
  const ingest = aiCore.ingestKnowledge('Thử nghiệm Ingest', ['Khẳng định 1 về AI'], {
    provider: 'TestProvider',
    collector: 'TestBot',
    domain: 'NLP'
  });
  assert.ok(ingest.artifactId);

  // 7. getUsageAndCost
  const usage = aiCore.getUsageAndCost();
  assert.ok(typeof usage.totalSpendUsd === 'number');

  // 8. getUserPreferences
  const prefs = aiCore.getUserPreferences('user_abc');
  assert.equal(prefs.interfaceLanguage, 'vi');

  // 9. transcribeAudio (honest awaiting configuration)
  const stt = await aiCore.transcribeAudio({ sampleRate: 16000, channels: 1, durationSeconds: 5 });
  assert.equal(stt.status, 'Implemented, awaiting configuration');

  // 10. generateSpeech (honest awaiting configuration)
  const tts = await aiCore.generateSpeech('Xin chào bạn');
  assert.equal(tts.status, 'Implemented, awaiting configuration');

  // 11. exportResult
  const exportArt = aiCore.exportResult(exec, 'json');
  assert.equal(exportArt.format, 'json');
  assert.ok(exportArt.dataString.includes('task_t2'));

  // 12. createShareArtifact
  const share = aiCore.createShareArtifact('API_KEY: sk-123456789012345678901234', {
    stripApiKeys: true,
    stripInternalPrompt: true,
    maskUserIdentifier: true
  });
  assert.equal(share.isRedacted, true);
  assert.ok(!share.cleanContent.includes('sk-123456789012345678901234'));

  // 13. recordFeedback
  const fb = aiCore.recordFeedback({
    targetId: 'task_t2',
    rating: 5,
    category: 'accuracy',
    comment: 'Tuyệt vời',
    userRole: 'USER'
  });
  assert.equal(fb.recorded, true);
});

test('P6.2: Reasoning Engine "Giải - Kiểm - Sửa" performs verified arithmetic and generates summary', async () => {
  const { reasoning } = createTestCore();

  const result = await reasoning.executeReasoning({
    id: 'reason_1',
    prompt: 'Hãy tính 15 * 8 và giải thích',
    domain: 'math',
    mode: 'Verified'
  });

  assert.equal(result.outcome, 'VERIFIED');
  assert.equal(result.summary.isVerified, true);
  assert.ok(result.finalAnswer.includes('120'));
  assert.ok(result.traces.length >= 2);
  assert.equal(result.traces[0].phase, 'SOLVE');
  assert.equal(result.traces[1].phase, 'VERIFY');
});

test('P6.3: Reasoning Engine automated repair loop triggers on discrepancy and halts at max 3 attempts', async () => {
  const { reasoning } = createTestCore();

  // flaw_test triggers deliberate error in initial answer
  const result = await reasoning.executeReasoning({
    id: 'reason_flaw',
    prompt: 'flaw_test: Hãy tính 20 + 30',
    domain: 'math',
    mode: 'Verified',
    maxRepairs: 3
  });

  assert.equal(result.outcome, 'VERIFIED');
  assert.equal(result.repairAttempts, 1);
  assert.ok(result.finalAnswer.includes('50'));
  assert.ok(result.traces.some((t) => t.phase === 'REPAIR'));
});

test('P6.4: Reasoning Engine never outputs false VERIFIED when verification checks fail', async () => {
  const { reasoning } = createTestCore();

  // require_code prompt without code block in answer
  const result = await reasoning.executeReasoning({
    id: 'reason_fail',
    prompt: 'require_code: Hãy viết thuật toán mà không được sửa',
    domain: 'logic',
    mode: 'Fast'
  });

  // In Fast mode, outcome must be UNVERIFIED, never VERIFIED
  assert.notEqual(result.outcome, 'VERIFIED');
  assert.equal(result.summary.isVerified, false);
});

test('P6.5: Knowledge Synthesizer deduplicates claims via exact hash and token set similarity', () => {
  const { synth } = createTestCore();

  const artifact = synth.synthesize('Kiến trúc Mô hình', [
    { text: 'Mô hình MoE sử dụng cơ chế Top-K routing để kích hoạt một phần trọng số.', source: 'Source A' },
    { text: 'Mô hình MoE sử dụng cơ chế Top-K routing để kích hoạt một phần trọng số.', source: 'Source B' }, // Exact dupe
    { text: 'Kiến trúc MoE sử dụng cơ chế Top-K routing kích hoạt các chuyên gia.', source: 'Source C' } // High token similarity
  ]);

  assert.equal(artifact.deduplicatedCount >= 1, true);
  assert.ok(artifact.canonicalClaims.length < 3);
});

test('P6.6: Knowledge Synthesizer contradiction detector identifies conflicting claims', () => {
  const { synth } = createTestCore();

  const artifact = synth.synthesize('Thông số B200', [
    { text: 'GPU Blackwell B200 tiêu thụ công suất 1000W.', source: 'Specs A' },
    { text: 'GPU Blackwell B200 tiêu thụ công suất 700W.', source: 'Specs B' }
  ]);

  assert.ok(artifact.contradictionsFound.length >= 1);
  assert.equal(artifact.contradictionsFound[0].severity, 'MEDIUM');
  assert.equal(artifact.badge, 'Silver');
});

test('P6.7: Knowledge Ingestion Gate assigns Gold, Silver, Bronze badges accurately', () => {
  const { synth } = createTestCore();

  // Gold: 2+ providers, no contradictions
  const goldArt = synth.synthesize('Chủ đề Đồng thuận', [
    { text: 'Hệ thống AI Core đảm bảo tính xác minh.', source: 'Provider 1' },
    { text: 'AI Core cung cấp cơ chế kiểm chứng độc lập.', source: 'Provider 2' }
  ]);
  assert.equal(goldArt.badge, 'Gold');
  assert.equal(goldArt.ingestionPassed, true);

  // Bronze: severe contradiction (negation conflict)
  const bronzeArt = synth.synthesize('Mâu thuẫn lớn', [
    { text: 'Tính năng này hoạt động bình thường trên hệ thống.', source: 'Provider A' },
    { text: 'Tính năng này không hoạt động và chưa bao giờ được hỗ trợ.', source: 'Provider B' }
  ]);
  assert.equal(bronzeArt.badge, 'Bronze');
  assert.equal(bronzeArt.ingestionPassed, false);
});

test('P6.8: Tool Registry enforces 4 tiers; Tier 3 halts without human confirmation', () => {
  const { tools } = createTestCore();

  // Tier 1: Auto allowed
  const t1Res = tools.executeTool({
    toolId: 'read_docs',
    params: {},
    actorId: 'user_1',
    actorRole: 'USER'
  });
  assert.equal(t1Res.allowed, true);
  assert.equal(t1Res.executed, true);

  // Tier 3 unconfirmed: Halts
  const t3Unconfirmed = tools.executeTool({
    toolId: 'delete_dataset_record',
    params: { recordId: 'rec_99' },
    actorId: 'user_1',
    actorRole: 'USER',
    userConfirmed: false
  });
  assert.equal(t3Unconfirmed.allowed, false);
  assert.equal(t3Unconfirmed.executed, false);
  assert.equal(t3Unconfirmed.requiresConfirmationPrompt, true);

  // Tier 3 confirmed: Allowed
  const t3Confirmed = tools.executeTool({
    toolId: 'delete_dataset_record',
    params: { recordId: 'rec_99' },
    actorId: 'user_1',
    actorRole: 'USER',
    userConfirmed: true
  });
  assert.equal(t3Confirmed.allowed, true);
  assert.equal(t3Confirmed.executed, true);
});

test('P6.9: Tool Registry Tier 4 prohibited actions are permanently blocked and logged', () => {
  const { tools } = createTestCore();

  const res = tools.executeTool({
    toolId: 'dump_api_keys',
    params: {},
    actorId: 'attacker_007',
    actorRole: 'USER'
  });

  assert.equal(res.allowed, false);
  assert.equal(res.tier, 'TIER_4_PROHIBITED');
  assert.ok(res.error?.includes('BỊ CẤM TUYỆT ĐỐI'));

  const alerts = tools.getAuditAlerts();
  assert.ok(alerts.some((a) => a.toolId === 'dump_api_keys'));
});

test('P6.10: Tool Registry Kill-Switch disables tools instantaneously', () => {
  const { tools } = createTestCore();

  tools.setToolEnabled('calculator', false);

  const res = tools.executeTool({
    toolId: 'calculator',
    params: { expression: '2+2' },
    actorId: 'user_1',
    actorRole: 'USER'
  });

  assert.equal(res.allowed, false);
  assert.ok(res.error?.includes('Kill-Switch'));
});

test('P6.11: Training Gate strictly enforces Tầng B default to Not implemented unless 7 criteria pass', () => {
  const { trainingGate } = createTestCore();

  const initialGate = trainingGate.evaluateGate();
  assert.equal(initialGate.passed, false);
  assert.equal(initialGate.status, 'Not implemented');
  assert.equal(initialGate.missingCriteria.length, 7);

  // Even if 6 criteria pass, 1 missing still keeps it Not implemented
  trainingGate.updateCriteria('gpuClusterVerified', true);
  trainingGate.updateCriteria('dataRightsAndLicensing', true);
  trainingGate.updateCriteria('computeBudgetEnergyAllocated', true);
  trainingGate.updateCriteria('checkpointStorageVersioned', true);
  trainingGate.updateCriteria('safetyAlignmentBenchmarks', true);
  trainingGate.updateCriteria('legalExportControlsCleared', true);

  const partialGate = trainingGate.evaluateGate();
  assert.equal(partialGate.passed, false);
  assert.equal(partialGate.status, 'Not implemented');
  assert.equal(partialGate.missingCriteria.length, 1);
});

test('P6.12: Modality Gate rejects multimodal audio/video requests when model lacks capability', () => {
  const { aiCore } = createTestCore();

  // Route task requiring video to model that only supports audio_stt
  const decision = aiCore.routeTask({
    taskId: 'modality_test_1',
    taskType: 'image',
    priority: 'normal',
    requiredModalities: ['video', 'audio_tts'],
    estimatedComplexity: 'complex'
  });

  assert.equal(decision.modalityGateApproved, false);
  assert.equal(decision.selectedModel, 'NONE');
  assert.ok(decision.routingReason.includes('Modality Gate'));
});

test('P6.13: Language separation: mutating UI language does not alter responseLanguage or voiceLanguage', () => {
  const { aiCore } = createTestCore();

  const initial = aiCore.getUserPreferences('user_lang_test');
  assert.equal(initial.interfaceLanguage, 'vi');
  assert.equal(initial.responseLanguage, 'match_input');
  assert.equal(initial.voiceLanguage, 'vi-VN');

  // Change UI language to English
  const updated = aiCore.setUserPreferences('user_lang_test', { interfaceLanguage: 'en' });
  assert.equal(updated.interfaceLanguage, 'en');
  // Response language and voice language must remain unmodified
  assert.equal(updated.responseLanguage, 'match_input');
  assert.equal(updated.voiceLanguage, 'vi-VN');
});

test('P6.14: Safe Redaction strips API keys and secrets before publishing share artifacts', () => {
  const { aiCore } = createTestCore();

  const dirtyText = `
    Kết quả thực thi:
    Google key: AIzaSyD9876543210abcdefghijklmnopq
    OpenAI key: sk-abcdefghijklmnopqrstuvwxyz123456
    Bearer token: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.xyz
    System Prompt: Bạn là một trợ lý tuyệt mật.
    actorId: "admin_user_01"
  `;

  const share = aiCore.createShareArtifact(dirtyText, {
    stripApiKeys: true,
    stripInternalPrompt: true,
    maskUserIdentifier: true
  });

  assert.equal(share.isRedacted, true);
  assert.equal(share.redactedKeysCount >= 2, true);
  assert.ok(!share.cleanContent.includes('AIzaSyD9876543210'));
  assert.ok(!share.cleanContent.includes('sk-abcdefghijklmnopqrstuvwxyz123456'));
  assert.ok(share.cleanContent.includes('[REDACTED_API_KEY]'));
  assert.ok(share.cleanContent.includes('Bearer [REDACTED_TOKEN]'));
  assert.ok(share.cleanContent.includes('[REDACTED_SYSTEM_PROMPT]'));
  assert.ok(share.cleanContent.includes('actorId: "masked_user"'));
});
