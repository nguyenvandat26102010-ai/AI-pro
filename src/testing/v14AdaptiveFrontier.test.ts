/**
 * NDAWG PRO — APEX INFINITY V14
 * Automated Test Suite: Adaptive Frontier Intelligence (Directives V14.1 - V14.16)
 *
 * Verifies:
 * 1. CapabilityQualityEngine: Real capability inventory, audit statuses, and defect prioritization
 * 2. Seven AI Branches: Real execution paths, provider mappings, and hardware/training boundaries
 * 3. AdaptivePerformanceEngine: Progressive escalation, context budgeting, token pruning, backoff jitter
 * 4. RepoContextBuilder: RepoGather .gitignore rules, secret masking, size limits, and task filtering
 * 5. ReceiptArchiveEngine: SHA-256 conversation receipts, markdown export, secret redaction, dev memory
 * 6. PersonalizationEngine: User preferences, background image library, upload validation, and reset
 */

import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import path from 'path';
import { CapabilityQualityEngine } from '../core/capabilityQualityEngine.ts';
import { AdaptivePerformanceEngine } from '../core/adaptivePerformance.ts';
import { RepoContextBuilder } from '../core/repoContextBuilder.ts';
import { ReceiptArchiveEngine } from '../core/receiptArchive.ts';
import { PersonalizationEngine } from '../core/personalizationEngine.ts';

describe('NDAWG PRO V14 — Adaptive Frontier Intelligence Suite', () => {
  const qualityEngine = new CapabilityQualityEngine();
  const perfEngine = new AdaptivePerformanceEngine();
  const repoBuilder = new RepoContextBuilder();
  const receiptEngine = new ReceiptArchiveEngine();
  const personalEngine = new PersonalizationEngine();

  // Test 1: Capability Quality Engine & Defect Inventory
  test('V14.1: CapabilityQualityEngine runs audit without fake claims and calculates health metrics', () => {
    const audit = qualityEngine.runAudit();
    assert.ok(audit.totalCapabilities >= 15, 'Must audit at least 15 core capabilities');
    assert.ok(audit.healthPercentage > 0 && audit.healthPercentage <= 100);
    assert.equal(audit.statusCounts.FAILED, 0, 'No capabilities should be in FAILED state');
    assert.ok(audit.statusCounts.WORKING >= 10, 'Majority of capabilities must be WORKING');

    // Defect inventory prioritization
    for (const defect of audit.prioritizedDefects) {
      assert.ok(defect.priority >= 1 && defect.priority <= 4, 'Defect priority must be 1 to 4');
      assert.ok(defect.remediationAction.length > 5, 'Must provide concrete remediation action');
    }
  });

  // Test 2: Seven AI Branches Boundaries & Disclaimers
  test('V14.2: Seven AI Branches report explicit provider mappings and honest hardware boundaries', () => {
    const branches = qualityEngine.getSevenBranches();
    assert.equal(branches.length, 7, 'Must report exactly 7 AI branches');

    const branchIds = branches.map(b => b.branchId);
    assert.deepEqual(branchIds, ['ML', 'DL', 'NLP', 'CV', 'ROBOTICS', 'EXPERT_SYSTEMS', 'GEN_AI']);

    const robotics = branches.find(b => b.branchId === 'ROBOTICS');
    assert.equal(robotics?.status, 'PARTIAL');
    assert.ok(
      robotics?.limitations.includes('KHÔNG KẾT NỐI PHẦN CỨNG') || robotics?.limitations.includes('mô phỏng'),
      'Robotics branch must contain explicit physical hardware disclaimer'
    );

    const deepLearning = branches.find(b => b.branchId === 'DL');
    assert.equal(deepLearning?.status, 'WORKING');
    assert.ok(deepLearning?.supportedFeatures.some(f => f.includes('Transformer') || f.includes('Attention')));
  });

  // Test 3: Progressive Escalation Routing
  test('V14.3: Progressive Escalation chooses appropriate workflow stage and model without unnecessary calls', () => {
    // 3a. Math expression -> SPECIALIZED_TOOL + math_kernel
    const mathEscalation = perfEngine.evaluateEscalation('Tính giá trị biểu thức: 125 * 8 - 45 / 5');
    assert.equal(mathEscalation.stage, 'SPECIALIZED_TOOL');
    assert.ok(mathEscalation.requiresTools.includes('math_kernel'));
    assert.equal(mathEscalation.requiresDualPassVerification, true);

    // 3b. Code debug -> SPECIALIZED_TOOL + code_lab
    const codeEscalation = perfEngine.evaluateEscalation('Hãy viết code TypeScript và debug thuật toán Dijkstra');
    assert.equal(codeEscalation.stage, 'SPECIALIZED_TOOL');
    assert.ok(codeEscalation.requiresTools.includes('code_lab'));

    // 3c. High stakes (legal/medical) -> INDEPENDENT_VERIFICATION
    const legalEscalation = perfEngine.evaluateEscalation('Tư vấn thủ tục pháp lý thành lập doanh nghiệp cổ phần');
    assert.equal(legalEscalation.stage, 'INDEPENDENT_VERIFICATION');
    assert.equal(legalEscalation.requiresDualPassVerification, true);

    // 3d. Direct simple chat -> FAST_DIRECT
    const simpleEscalation = perfEngine.evaluateEscalation('Xin chào bạn, hôm nay thế nào?');
    assert.equal(simpleEscalation.stage, 'FAST_DIRECT');
    assert.equal(simpleEscalation.requiresRAG, false);
  });

  // Test 4: Context Budgeting and Token Optimization
  test('V14.4: Context Budgeting bounds message window, prunes old messages and computes token savings', () => {
    const rawMessages = [
      { role: 'system' as const, content: 'You are NDAWG PRO system prompt with high priority' },
      { role: 'user' as const, content: 'Message 1    with    excessive    spaces\n\n\n\nand newlines' },
      { role: 'assistant' as const, content: 'Response 1 with some details' },
      { role: 'user' as const, content: 'Message 2 with some query' },
      { role: 'assistant' as const, content: 'Response 2 with answer' },
      { role: 'user' as const, content: 'Message 3 most recent question' }
    ];

    const result = perfEngine.optimizeContext(rawMessages, 120); // Small budget ~120 tokens
    assert.ok(result.optimizedMessages.length >= 2, 'Must preserve at least system + latest message');
    assert.equal(result.optimizedMessages[0].role, 'system', 'System prompt must be retained');
    assert.ok(result.rawTokensEstimate > 0);
    assert.ok(result.optimizedTokensEstimate <= result.rawTokensEstimate);
    assert.ok(result.tokensSavedPercentage >= 0);
  });

  // Test 5: Bounded Backoff with Jitter
  test('V14.5: calculateBackoffDelay produces bounded delays with randomized jitter', () => {
    const delay0 = perfEngine.calculateBackoffDelay(0, 1000, 8000);
    assert.ok(delay0 >= 1000 && delay0 <= 2000, 'Attempt 0 should be around base delay');

    const delay3 = perfEngine.calculateBackoffDelay(3, 1000, 8000);
    assert.ok(delay3 >= 7000 && delay3 <= 8000, 'Attempt 3 should be bounded by max delay');
  });

  // Test 6: RepoGather Source Context Builder
  test('V14.6: RepoGather excludes secrets, node_modules, binaries, and generates manifest with budget', () => {
    const workspaceRoot = path.resolve('.');
    const manifest = repoBuilder.generateManifest(workspaceRoot, 'FULL_ELIGIBLE_MANIFEST');

    assert.ok(manifest.totalFilesScanned > 0, 'Must scan files in repository');
    assert.ok(manifest.eligibleFilesCount > 0, 'Must have eligible source files');
    assert.ok(manifest.excludedFilesCount > 0, 'Must exclude node_modules or dist');

    // Verify .env and private keys are never in eligible files
    const eligiblePaths = manifest.files.filter(f => !f.isExcluded).map(f => f.relativePath);
    assert.ok(!eligiblePaths.some(p => p.includes('.env')), '.env must NEVER be in eligible files');
    assert.ok(!eligiblePaths.some(p => p.endsWith('.pem')), '.pem must NEVER be in eligible files');
    assert.ok(!eligiblePaths.some(p => p.includes('node_modules')), 'node_modules must be excluded');

    // Bundle source
    const bundle = repoBuilder.bundleEligibleSource(workspaceRoot, manifest, 10000);
    assert.ok(bundle.filesIncluded.length > 0, 'Must bundle eligible files within budget');
    assert.ok(bundle.bundledText.includes('// ==================== NDAWG PRO REPOSITORY CONTEXT ===================='));
  });

  // Test 7: Conversation Receipts & Dev Memory Archive
  test('V14.7: ReceiptArchiveEngine generates SHA-256 HMAC receipts, redacts secrets, and exports Markdown', () => {
    const sampleReceipt = receiptEngine.generateReceipt({
      conversationId: 'conv_test_101',
      title: 'Hội thoại có chứa AIzaSyD9876543210 Secret Key',
      actorRole: 'ADMIN',
      modelUsed: 'gemini-3.6-flash',
      provider: 'Google Gemini',
      messages: [
        { id: 'm1', role: 'user', content: 'Hãy ghi nhớ key sk-1234567890abcdef này', timestamp: 1000 },
        { id: 'm2', role: 'assistant', content: 'Tôi đã tiếp nhận nhưng không lưu giữ raw secrets.', timestamp: 2000 }
      ],
      executedTools: [
        { toolId: 'math_kernel', toolName: 'Math Kernel', durationMs: 5, status: 'SUCCESS', verificationPassed: true }
      ],
      citations: ['NDAWG PRO Architecture (2026)'],
      costUsd: 0.001
    });

    assert.ok(sampleReceipt.receiptId.startsWith('rcpt_'));
    assert.equal(sampleReceipt.integrityHash.length, 64, 'SHA-256 hash must be 64 hex characters');

    // Secret redaction verification
    assert.ok(!sampleReceipt.title.includes('AIzaSyD'), 'Gemini API key must be redacted from title');
    assert.ok(!sampleReceipt.messages[0].content.includes('sk-12345'), 'OpenAI key must be redacted from message');
    assert.ok(sampleReceipt.messages[0].content.includes('[REDACTED_API_KEY]'));

    // Markdown format
    const markdown = receiptEngine.formatReceiptAsMarkdown(sampleReceipt);
    assert.ok(markdown.includes('BIÊN BẢN HỘI THOẠI KIỂM TOÁN'));
    assert.ok(markdown.includes(sampleReceipt.integrityHash));
    assert.ok(markdown.includes('Math Kernel'));

    // Dev memory
    const memory = receiptEngine.getDevMemory();
    assert.ok(memory.length >= 3, 'Must have dev memory seed entries');
    assert.ok(memory.some(m => m.summary.includes('Limits Governor')));
  });

  // Test 8: Personalization & Background Image Studio
  test('V14.8: PersonalizationEngine manages preferences, presets, upload validation, and reset', () => {
    const prefs = personalEngine.getPreferences();
    assert.equal(prefs.theme, 'cyber_slate');
    assert.equal(prefs.fontSize, 'medium');

    // Update preferences
    const updated = personalEngine.updatePreferences({ theme: 'midnight_indigo', fontSize: 'large' });
    assert.equal(updated.theme, 'midnight_indigo');
    assert.equal(updated.fontSize, 'large');

    // Background library presets
    const library = personalEngine.getBackgroundLibrary();
    assert.ok(library.length >= 4, 'Must have at least 4 preset backgrounds');
    assert.ok(library.some(b => b.id === 'bg_default_slate'));

    // Upload validation: reject invalid mime
    const invalidMimeRes = personalEngine.uploadCustomBackground({
      name: 'Bad file',
      dataUrl: 'data:application/pdf;base64,xxxx',
      mimeType: 'application/pdf',
      sizeBytes: 500
    });
    assert.equal(invalidMimeRes.success, false);

    // Upload validation: accept valid image
    const validUploadRes = personalEngine.uploadCustomBackground({
      name: 'Valid Cyber BG',
      dataUrl: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==',
      mimeType: 'image/png',
      sizeBytes: 1024
    });
    assert.equal(validUploadRes.success, true);
    assert.equal(personalEngine.getActiveBackground().id, validUploadRes.item?.id);

    // Reset background
    const resetBg = personalEngine.resetBackgroundToDefault();
    assert.equal(resetBg.id, 'bg_default_slate');
  });
});
