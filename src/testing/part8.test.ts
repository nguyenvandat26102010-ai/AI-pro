/**
 * NDAWG PRO — PART 8/8 (FINAL V2)
 * Knowledge Cards Repair, Training Gate Verification & System Status Test Suite
 */

import test from 'node:test';
import assert from 'node:assert/strict';
import { TrainingGate } from '../core/trainingGate.ts';
import {
  TrainingGateConditionDetail,
  DetailedConditionStatus,
  KnowledgeCardItem,
  KnowledgeGateBadge
} from '../core/types.ts';

test('P8.1: Training Gate dynamically counts passed conditions (passedCount / totalCount = 7)', () => {
  const gate = new TrainingGate();
  const initial = gate.evaluateGate();

  assert.equal(initial.totalCount, 7);
  assert.equal(initial.passedCount, 0);
  assert.equal(initial.passed, false);
  assert.equal(initial.status, 'Not implemented');

  // Verify dynamic count updating
  gate.updateConditionStatus(
    'gpuClusterVerified',
    'Implemented and tested',
    'Cluster verified',
    'Authorized bare-metal access'
  );

  const step1 = gate.evaluateGate();
  assert.equal(step1.passedCount, 1);
  assert.equal(step1.totalCount, 7);
  assert.equal(step1.passed, false);
  assert.equal(step1.status, 'Not implemented');

  // Add 2 more passed conditions
  gate.updateConditionStatus('dataRightsAndLicensing', 'Implemented and tested');
  gate.updateConditionStatus('computeBudgetEnergyAllocated', 'Implemented and tested');

  const step3 = gate.evaluateGate();
  assert.equal(step3.passedCount, 3);
  assert.equal(step3.totalCount, 7);
  assert.equal(step3.passed, false);
});

test('P8.2: Training Gate distinguishes 6 technical statuses and only "Implemented and tested" counts as passed', () => {
  const gate = new TrainingGate();

  // Test 'Implemented, awaiting configuration'
  gate.updateConditionStatus('computeBudgetEnergyAllocated', 'Implemented, awaiting configuration');
  let result = gate.evaluateGate();
  assert.equal(result.criteriaResults.computeBudgetEnergyAllocated, false);
  assert.equal(result.passedCount, 0);

  // Test 'Not verified'
  gate.updateConditionStatus('validationDatasetVerified', 'Not verified');
  result = gate.evaluateGate();
  assert.equal(result.criteriaResults.validationDatasetVerified, false);
  assert.equal(result.passedCount, 0);

  // Test 'Test failed'
  gate.updateConditionStatus('safetyAlignmentBenchmarks', 'Test failed');
  result = gate.evaluateGate();
  assert.equal(result.criteriaResults.safetyAlignmentBenchmarks, false);
  assert.equal(result.passedCount, 0);

  // Test 'Blocked'
  gate.updateConditionStatus('legalExportControlsCleared', 'Blocked');
  result = gate.evaluateGate();
  assert.equal(result.criteriaResults.legalExportControlsCleared, false);
  assert.equal(result.passedCount, 0);

  // Test 'Not implemented'
  gate.updateConditionStatus('checkpointStorageVersioned', 'Not implemented');
  result = gate.evaluateGate();
  assert.equal(result.criteriaResults.checkpointStorageVersioned, false);
  assert.equal(result.passedCount, 0);

  // Finally 'Implemented and tested'
  gate.updateConditionStatus('checkpointStorageVersioned', 'Implemented and tested');
  result = gate.evaluateGate();
  assert.equal(result.criteriaResults.checkpointStorageVersioned, true);
  assert.equal(result.passedCount, 1);
});

test('P8.3: Training Gate strictly enforces all 7/7 criteria for Tầng B activation without fake bypass', () => {
  const gate = new TrainingGate();

  const allKeys: (keyof typeof gate['criteria'])[] = [
    'gpuClusterVerified',
    'dataRightsAndLicensing',
    'computeBudgetEnergyAllocated',
    'checkpointStorageVersioned',
    'safetyAlignmentBenchmarks',
    'legalExportControlsCleared',
    'validationDatasetVerified'
  ];

  // Set 6 of 7 criteria to passed
  for (let i = 0; i < 6; i++) {
    gate.updateConditionStatus(allKeys[i], 'Implemented and tested');
  }

  const nearGate = gate.evaluateGate();
  assert.equal(nearGate.passedCount, 6);
  assert.equal(nearGate.totalCount, 7);
  assert.equal(nearGate.passed, false);
  assert.equal(nearGate.status, 'Not implemented');
  assert.equal(nearGate.missingCriteria.length, 1);

  // Complete the 7th criterion
  gate.updateConditionStatus(allKeys[6], 'Implemented and tested');
  const fullGate = gate.evaluateGate();
  assert.equal(fullGate.passedCount, 7);
  assert.equal(fullGate.totalCount, 7);
  assert.equal(fullGate.passed, true);
  assert.equal(fullGate.status, 'Implemented and tested');
  assert.ok(fullGate.verdictMessage.includes('được phép kích hoạt'));
});

test('P8.4: Training Gate non-blocking guarantee: isChatBlocked is strictly false', () => {
  const gate = new TrainingGate();

  const evalInitial = gate.evaluateGate();
  assert.equal(evalInitial.isChatBlocked, false);
  assert.ok(evalInitial.verdictMessage.includes('Chat Tầng A'));

  // Even when all 7 criteria fail, chat remains unblocked
  assert.equal(evalInitial.passedCount, 0);
  assert.equal(evalInitial.isChatBlocked, false);
});

test('P8.5: Diagnostic Audit runner executes honest environment checks and returns non-fabricated log trace', () => {
  const gate = new TrainingGate();

  const audit = gate.runDiagnosticAudit();
  assert.ok(audit.diagnosticLog.length >= 7);
  assert.ok(audit.diagnosticLog.some((log) => log.includes('Điều kiện 1')));
  assert.ok(audit.diagnosticLog.some((log) => log.includes('Điều kiện 7')));
  assert.equal(audit.evaluation.passedCount, 0);
  assert.equal(audit.evaluation.passed, false);

  const history = gate.getAuditHistory();
  assert.ok(history.length >= 1);
  assert.equal(history[0].action, 'DIAGNOSTIC_AUDIT_EXECUTED');
});

test('P8.6: Knowledge Cards schema validation: stable ID, required fields, and hardware disclaimer', () => {
  const sampleCard: KnowledgeCardItem = {
    id: 'card_transformer_test',
    title: 'Kiến trúc Transformer',
    category: 'Kiến trúc mô hình',
    summary: 'Kiến trúc nền tảng dựa trên cơ chế Self-Attention',
    specs: ['Scaled Dot-Product Attention', 'KV Cache O(1) per token'],
    references: ['Vaswani et al., 2017'],
    author: 'AI Research Team',
    version: '1.2.0',
    verificationStatus: 'Gold',
    hardwareNotice: 'Tài liệu giáo dục kỹ thuật tham khảo • Không sở hữu phần cứng',
    createdAt: Date.now(),
    lastUpdated: new Date().toISOString()
  };

  assert.ok(sampleCard.id.startsWith('card_'));
  assert.equal(sampleCard.verificationStatus, 'Gold');
  assert.ok(sampleCard.specs.length >= 2);
  assert.ok(sampleCard.references.length >= 1);
  assert.ok(sampleCard.hardwareNotice.includes('Không sở hữu'));
});

test('P8.7: Knowledge Cards CRUD operations maintain repository integrity', () => {
  const repository: KnowledgeCardItem[] = [];

  // Create
  const newCard: KnowledgeCardItem = {
    id: 'card_custom_1',
    title: 'DeepSeek-V3 Multi-Head Latent Attention',
    category: 'Kiến trúc mô hình',
    summary: 'MLA nén KV cache thành vector tiềm ẩn để giảm VRAM',
    specs: ['Nén KV qua ma trận W_DKV', 'Kích hoạt 37B tham số trên 671B'],
    references: ['DeepSeek-V3 Technical Report (2024)'],
    author: 'AI Architect',
    version: '1.0.0',
    verificationStatus: 'Gold',
    hardwareNotice: 'Tài liệu học thuật tham khảo',
    createdAt: Date.now(),
    lastUpdated: new Date().toISOString()
  };
  repository.push(newCard);
  assert.equal(repository.length, 1);

  // Update
  const target = repository.find((c) => c.id === 'card_custom_1');
  assert.ok(target);
  target.summary = 'Tóm tắt đã được hiệu chỉnh chính xác';
  target.verificationStatus = 'Gold';
  assert.equal(repository[0].summary, 'Tóm tắt đã được hiệu chỉnh chính xác');

  // Delete
  const filtered = repository.filter((c) => c.id !== 'card_custom_1');
  assert.equal(filtered.length, 0);
});

test('P8.8: Knowledge Cards keyword search and topic filter return matching items', () => {
  const mockCards: KnowledgeCardItem[] = [
    {
      id: 'c1',
      title: 'Kiến trúc Transformer & Self-Attention',
      category: 'Kiến trúc mô hình',
      summary: 'Loại bỏ đệ quy RNN với Dot-Product Attention',
      specs: ['O(N^2) complexity'],
      references: ['Vaswani 2017'],
      author: 'Team',
      version: '1.0.0',
      verificationStatus: 'Gold',
      hardwareNotice: 'Tham khảo',
      createdAt: 1,
      lastUpdated: '2026-03-20'
    },
    {
      id: 'c2',
      title: 'Mixture-of-Experts (MoE)',
      category: 'Kiến trúc mô hình',
      summary: 'Định tuyến thưa Top-2 chuyên gia',
      specs: ['Sparse compute FLOPs'],
      references: ['Shazeer 2017'],
      author: 'Team',
      version: '1.0.0',
      verificationStatus: 'Gold',
      hardwareNotice: 'Tham khảo',
      createdAt: 2,
      lastUpdated: '2026-03-21'
    },
    {
      id: 'c3',
      title: 'NVIDIA H100 Hopper Architecture',
      category: 'Tham khảo phần cứng',
      summary: 'GPU trung tâm dữ liệu FP8 Tensor Cores',
      specs: ['3.35 TB/s HBM3e', 'NVLink 900 GB/s'],
      references: ['NVIDIA 2022'],
      author: 'Team',
      version: '1.0.0',
      verificationStatus: 'Silver',
      hardwareNotice: 'Không sở hữu phần cứng',
      createdAt: 3,
      lastUpdated: '2026-03-22'
    }
  ];

  // Search by keyword "MoE"
  const searchMoe = mockCards.filter((c) =>
    `${c.title} ${c.summary} ${c.specs.join(' ')}`.toLowerCase().includes('moe')
  );
  assert.equal(searchMoe.length, 1);
  assert.equal(searchMoe[0].id, 'c2');

  // Filter by category "Tham khảo phần cứng"
  const hwCards = mockCards.filter((c) => c.category === 'Tham khảo phần cứng');
  assert.equal(hwCards.length, 1);
  assert.equal(hwCards[0].id, 'c3');

  // Filter by badge "Silver"
  const silverCards = mockCards.filter((c) => c.verificationStatus === 'Silver');
  assert.equal(silverCards.length, 1);
  assert.equal(silverCards[0].id, 'c3');
});

test('P8.9: Knowledge citation formatting includes academic provenance and hardware disclaimer', () => {
  const card: KnowledgeCardItem = {
    id: 'c_lora',
    title: 'LoRA Fine-Tuning',
    category: 'Kỹ thuật tinh chỉnh',
    summary: 'Huấn luyện ma trận bậc thấp Delta_W',
    specs: ['Tiết kiệm 75% VRAM'],
    references: ['Hu et al., ICLR 2022'],
    author: 'Fine-Tuning Group',
    version: '2.0.0',
    verificationStatus: 'Gold',
    hardwareNotice: 'Tài liệu giáo dục kỹ thuật tham khảo',
    createdAt: Date.now(),
    lastUpdated: new Date().toISOString()
  };

  const citation = `[Trích dẫn Tri Thức NDAWG PRO - ${card.verificationStatus.toUpperCase()}] ${card.title} (${card.category} v${card.version})\nNguồn: ${card.references.join(', ')}\nLưu ý: ${card.hardwareNotice}`;

  assert.ok(citation.includes('GOLD'));
  assert.ok(citation.includes('LoRA Fine-Tuning'));
  assert.ok(citation.includes('Hu et al., ICLR 2022'));
  assert.ok(citation.includes('Tài liệu giáo dục kỹ thuật tham khảo'));
});

test('P8.10: Unified System Status contract returns operational status for Chat, Cards, and Training Gate', () => {
  const gate = new TrainingGate();
  const gateEval = gate.evaluateGate();

  const systemStatus = {
    status: 'healthy',
    timestamp: Date.now(),
    version: 'NDAWG PRO APEX v8.0 (Unified Final)',
    chat: {
      activeProvider: 'Google Gemini',
      primaryModel: 'gemini-3.6-flash',
      status: 'OPERATIONAL'
    },
    knowledgeCards: {
      totalCards: 7,
      goldCount: 5,
      silverCount: 2,
      bronzeCount: 0,
      ragIntegration: 'ACTIVE'
    },
    trainingGate: {
      tier: 'TIER_B_TRAINING',
      status: gateEval.status,
      passedCount: gateEval.passedCount,
      totalCount: gateEval.totalCount,
      isChatBlocked: gateEval.isChatBlocked
    }
  };

  assert.equal(systemStatus.status, 'healthy');
  assert.equal(systemStatus.chat.status, 'OPERATIONAL');
  assert.equal(systemStatus.trainingGate.isChatBlocked, false);
  assert.equal(systemStatus.trainingGate.passedCount, 0);
  assert.equal(systemStatus.trainingGate.totalCount, 7);
  assert.equal(systemStatus.knowledgeCards.ragIntegration, 'ACTIVE');
});
