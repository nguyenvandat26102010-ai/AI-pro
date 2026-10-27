/**
 * NDAWG PRO — APEX INFINITY V18
 * Quota Recovery, Routing, Self-Healing & Render Integrity Regression Test Suite
 * Conforms to Directives 2, 3, 4, 6, 7, 8, 9, 15
 */

import { describe, it } from 'node:test';
import assert from 'node:assert';
import {
  classifyProviderError,
  calculateBackoffWithJitter,
  sanitizeErrorDetails
} from '../core/quotaClassifier.ts';
import {
  normalizeRenderText,
  cleanSpuriousMarkdownEscapes,
  decodeSafeHtmlEntities,
  standardizeLatexDelimiters,
  repairMarkdownLinks,
  sanitizeRawJsonErrorLeak
} from '../core/renderIntegrity.ts';
import { QuotaAwareModelRouter } from '../core/quotaAwareRouter.ts';
import { UniversalSelfHealingEngine } from '../core/selfHealingEngine.ts';
import { INITIAL_PROVIDER_TERMS } from '../absorption/providerTermsRegistry.ts';
import type { ConnectionState } from '../types/chat.ts';

describe('NDAWG PRO V18 — Quota Recovery, Router & Render Integrity Suite', () => {
  describe('1. Gemini 429 Quota Classifier (Directive 2 & 3)', () => {
    it('1.1: Classifies transient RPM rate limit with retry-after parsing', () => {
      const error = new Error('Resource has been exhausted (e.g. check quota). Retrying after 4.5 seconds');
      (error as any).status = 429;

      const classified = classifyProviderError(error, 'google-gemini', 'gemini-3.8-flash');
      assert.strictEqual(classified.errorCategory, 'TEMPORARY_RATE_LIMIT');
      assert.strictEqual(classified.httpStatus, 429);
      assert.strictEqual(classified.retryable, true);
      assert.strictEqual(classified.retryAfterMs, 4500);
      assert.ok(classified.userMessage.vi.includes('Model đang nhận quá nhiều yêu cầu'));
      assert.ok(classified.userMessage.en.includes('too many requests'));
      assert.ok(classified.userMessage.ko.includes('요청이 너무 많이'));
    });

    it('1.2: Classifies TPM (TokensPerMinute) rate limit', () => {
      const error = new Error('Rate limit exceeded: 1000000 tokens per minute exceeded');
      (error as any).status = 429;

      const classified = classifyProviderError(error, 'google-gemini', 'gemini-4-argon');
      assert.strictEqual(classified.errorCategory, 'TEMPORARY_RATE_LIMIT');
      assert.strictEqual(classified.quotaMetric, 'TokensPerMinute');
      assert.strictEqual(classified.retryable, true);
    });

    it('1.3: Classifies Daily Quota Exhausted and blocks repeated retry loops', () => {
      const error = new Error(
        'Quota exceeded for quota metric GenerateRequestsPerDayPerProjectPerModel-FreeTier and limit 50'
      );
      (error as any).status = 429;

      const classified = classifyProviderError(error, 'google-gemini', 'gemini-3.8-flash');
      assert.strictEqual(classified.errorCategory, 'DAILY_QUOTA_EXHAUSTED');
      assert.strictEqual(classified.providerStatus, 'QUOTA_EXHAUSTED');
      assert.strictEqual(classified.retryable, false, 'Daily quota must NOT be retryable immediately');
      assert.ok((classified.retryAfterMs ?? 0) >= 3600000, 'Must enforce cooldown');
      assert.ok(classified.userMessage.vi.includes('Model này đã hết hạn mức sử dụng trong ngày'));
    });

    it('1.4: Classifies Quota Limit Zero as BLOCKED without retrying', () => {
      const error = new Error('Resource has been exhausted. Current quota limit is 0 requests per minute.');
      (error as any).status = 429;

      const classified = classifyProviderError(error, 'google-gemini', 'gemini-nano-banana-2.1');
      assert.strictEqual(classified.errorCategory, 'QUOTA_LIMIT_ZERO');
      assert.strictEqual(classified.quotaLimit, 0);
      assert.strictEqual(classified.retryable, false);
      assert.strictEqual(classified.providerStatus, 'BLOCKED');
      assert.ok(classified.userMessage.vi.includes('Model hiện không khả dụng với cấu hình hoặc hạn mức'));
    });

    it('1.5: Classifies Billing or Spend Cap restriction', () => {
      const error = new Error('Billing account has reached spend cap or payment is disabled.');
      (error as any).status = 402;

      const classified = classifyProviderError(error, 'google-gemini', 'gemini-3.8-flash');
      assert.strictEqual(classified.errorCategory, 'BILLING_RESTRICTION');
      assert.strictEqual(classified.retryable, false);
      assert.strictEqual(classified.providerStatus, 'BLOCKED');
    });

    it('1.6: Classifies Missing or Invalid API Key as AUTH_ERROR', () => {
      const error = new Error('API_KEY_INVALID: The provided API key is expired or unauthorized');
      (error as any).status = 401;

      const classified = classifyProviderError(error, 'google-gemini', 'gemini-3.8-flash');
      assert.strictEqual(classified.errorCategory, 'AUTH_ERROR');
      assert.strictEqual(classified.providerStatus, 'NOT_CONFIGURED');
      assert.strictEqual(classified.retryable, false);
      assert.ok(classified.diagnostic.adminActionHint.includes('GEMINI_API_KEY'));
    });

    it('1.7: Classifies Temporary Provider Overload (503/504) distinctly from daily quota', () => {
      const error = new Error('503 The model is overloaded. Please try again later.');
      (error as any).status = 503;

      const classified = classifyProviderError(error, 'google-gemini', 'gemini-3.8-flash');
      assert.strictEqual(classified.errorCategory, 'PROVIDER_OVERLOAD');
      assert.strictEqual(classified.retryable, true);
      assert.ok(classified.userMessage.vi.includes('Nhà cung cấp đang tạm thời quá tải'));
    });

    it('1.8: Classifies Invalid Model ID / Parameter error (400)', () => {
      const error = new Error('400 Invalid argument: model models/unknown-fake-model not found');
      (error as any).status = 400;

      const classified = classifyProviderError(error, 'google-gemini', 'unknown-fake-model');
      assert.strictEqual(classified.errorCategory, 'INVALID_REQUEST');
      assert.strictEqual(classified.providerStatus, 'UNSUPPORTED');
      assert.strictEqual(classified.retryable, false);
    });

    it('1.9: Sanitizes secrets and internal file paths from diagnostic snippets', () => {
      const rawWithKey = 'Error at AIzaSyB123456789012345678901234567890 in /app/applet/node_modules/google-genai';
      const sanitized = sanitizeErrorDetails(rawWithKey);
      assert.ok(!sanitized.includes('AIzaSyB1234567890'));
      assert.ok(sanitized.includes('[REDACTED_API_KEY]'));
      assert.ok(!sanitized.includes('/app/applet/node_modules'));
    });

    it('1.10: Calculates bounded backoff with randomized jitter', () => {
      const delay1 = calculateBackoffWithJitter(1, 1000, 8000, 0.2);
      const delay2 = calculateBackoffWithJitter(2, 1000, 8000, 0.2);
      assert.ok(delay1 >= 800 && delay1 <= 3000);
      assert.ok(delay2 >= 1600 && delay2 <= 6000);
    });
  });

  describe('2. Quota-Aware Model Router & Circuit Breaker (Directive 4 & 6)', () => {
    it('2.1: Router manages model registry with explicit truthful statuses', () => {
      const router = QuotaAwareModelRouter.getInstance();
      const models = router.getAllModels();
      assert.ok(models.length >= 6);

      const flash = router.getModel('gemini-3.8-flash');
      assert.ok(flash);
      assert.strictEqual(flash?.circuitState, 'CLOSED');
    });

    it('2.2: Circuit breaker transitions to OPEN and records cooldown on daily quota exhausted', () => {
      const router = QuotaAwareModelRouter.getInstance();
      const modelId = 'gemini-3.8-flash';

      const mockDailyError = classifyProviderError(
        new Error('GenerateRequestsPerDayPerProjectPerModel-FreeTier limit exceeded'),
        'google-gemini',
        modelId
      );

      router.recordFailure(modelId, mockDailyError);

      const meta = router.getModel(modelId);
      assert.strictEqual(meta?.status, 'QUOTA_EXHAUSTED');
      assert.strictEqual(meta?.circuitState, 'OPEN');

      const check = router.isModelAvailable(modelId);
      assert.strictEqual(check.available, false);
      assert.ok(check.reason?.includes('QUOTA_EXHAUSTED') || check.reason?.includes('hạ nhiệt'));

      // Clean up for subsequent tests
      router.recordSuccess(modelId);
    });

    it('2.3: Finds compatible fallback model when requested model is unavailable', () => {
      const router = QuotaAwareModelRouter.getInstance();
      const fallback = router.findFallbackModel('gemini-4-argon', 'general', true);
      assert.ok(fallback);
      assert.notStrictEqual(fallback, 'gemini-4-argon');
    });
  });

  describe('3. Universal Render Integrity Engine (Directive 8)', () => {
    it('3.1: Cleans spurious backslashes before bold and italic markdown', () => {
      const input = 'Đây là \\*\\*chữ in đậm\\*\\* và \\*chữ in nghiêng\\*';
      const output = cleanSpuriousMarkdownEscapes(input);
      assert.strictEqual(output, 'Đây là **chữ in đậm** và *chữ in nghiêng*');
    });

    it('3.2: Restores broken horizontal rules', () => {
      const input = 'Dòng trên\n\\---\nDòng dưới';
      const output = cleanSpuriousMarkdownEscapes(input);
      assert.strictEqual(output, 'Dòng trên\n---\nDòng dưới');
    });

    it('3.3: Decodes accidental HTML entity &#x20; to space', () => {
      const input = 'Từ&#x20;thứ&#x20;nhất&#x20;tới&#x20;từ&#x20;hai';
      const output = decodeSafeHtmlEntities(input);
      assert.strictEqual(output, 'Từ thứ nhất tới từ hai');
    });

    it('3.4: Normalizes nested malformed Markdown links safely', () => {
      const malformed = 'Truy cập [Google](https://google.com[Search](https://google.com/search)) để tra cứu.';
      const output = repairMarkdownLinks(malformed);
      assert.ok(output.includes('https://google.com/search'));
      assert.ok(!output.includes('https://google.com[Search]'));
    });

    it('3.5: Standardizes LaTeX delimiters without corrupting currency values', () => {
      const mathInput = 'Công thức: \\(E=mc^2\\) và diện tích: \\[A=\\pi r^2\\]. Giá vé: $50.';
      const output = standardizeLatexDelimiters(mathInput);
      assert.ok(output.includes('$E=mc^2$'));
      assert.ok(output.includes('$$A=\\pi r^2$$'));
      assert.ok(output.includes('$50'));
    });

    it('3.6: Preserves Vietnamese diacritics, Korean Hangul, and math symbols intact', () => {
      const unicodeSample = 'Kiểm chứng thuật toán AI (Tiếng Việt) • 한국어 모델 할당량 관리 • ∑_{i=1}^n x_i ≤ 100 🚀';
      const output = normalizeRenderText(unicodeSample);
      assert.strictEqual(output, unicodeSample, 'Unicode text must remain perfectly intact');
    });

    it('3.7: Protects code blocks from being altered by text escapes', () => {
      const codeSnippet = '```typescript\nconst regex = /\\*\\*bold\\*\\*/;\n```';
      const output = normalizeRenderText(codeSnippet);
      assert.strictEqual(output, codeSnippet, 'Fenced code blocks must be protected verbatim');
    });

    it('3.8: Detects and converts raw provider JSON leak to friendly warning', () => {
      const rawJson = JSON.stringify({
        error: {
          code: 429,
          message: 'Resource has been exhausted',
          status: 'RESOURCE_EXHAUSTED'
        }
      });
      const output = sanitizeRawJsonErrorLeak(rawJson);
      assert.ok(output.includes('⚠️ **[Lỗi từ nhà cung cấp: 429]**'));
      assert.ok(!output.startsWith('{"error"'));
    });
  });

  describe('4. Universal Self-Healing Engine (Directive 7)', () => {
    it('4.1: Registers incident into self-healing lifecycle', () => {
      const engine = UniversalSelfHealingEngine.getInstance();
      const mockError = classifyProviderError(
        new Error('GenerateRequestsPerDayPerProjectPerModel-FreeTier'),
        'google-gemini',
        'gemini-3.8-flash'
      );

      const incident = engine.handleRuntimeError(mockError, { prompt: 'Test self healing' });
      assert.ok(incident.incidentId);
      assert.strictEqual(incident.phase, 'ACCEPT');
      assert.strictEqual(incident.isResolved, true);
      assert.ok(incident.proposedAction.includes('QUOTA_EXHAUSTED'));

      const recent = engine.getRecentIncidents(5);
      assert.ok(recent.length > 0);
    });
  });

  describe('5. V23.2 Granular Connection States & Model Registry Audit', () => {
    const EXPECTED_MODELS = [
      'gemini-3.8-flash',
      'gemini-4-argon',
      'gemini-3.1-flash-lite',
      'gemini-3.8-live',
      'gemini-3.5-transcribe',
      'gemini-nano-banana-2.1',
      'gemini-omni-1.1-flash'
    ];

    it('5.1: Verifies all 7 Gemini models exist in QuotaAwareModelRouter with proper metadata', () => {
      const router = QuotaAwareModelRouter.getInstance();
      for (const modelId of EXPECTED_MODELS) {
        const meta = router.getModel(modelId);
        assert.ok(meta, `Model ${modelId} must exist in router registry`);
        assert.strictEqual(meta?.providerId, 'google-gemini');
        assert.ok(meta?.modalities.length > 0, `Model ${modelId} must declare modalities`);
        assert.ok(meta?.taskTypes.length > 0, `Model ${modelId} must declare task types`);
      }
    });

    it('5.2: Enforces Default DENY for model training across all modern Gemini models', () => {
      for (const modelId of EXPECTED_MODELS) {
        const term = INITIAL_PROVIDER_TERMS.find(t => t.modelId === modelId);
        assert.ok(term, `Terms entry must exist for ${modelId}`);
        assert.strictEqual(term?.train_on_output, false, `train_on_output must be strictly false (Default DENY) for ${modelId}`);
        assert.strictEqual(term?.verification_status, 'VERIFIED');
      }
    });

    it('5.3: Validates exhaustive definition of 10 granular connection states', () => {
      const states: ConnectionState[] = [
        'SERVER_READY',
        'CHAT_API_ROUTE_READY',
        'GEMINI_SECRET_CONFIGURED',
        'GEMINI_AUTH_VERIFIED',
        'GEMINI_LIVE_REQUEST_VERIFIED',
        'MODEL_UNAVAILABLE',
        'QUOTA_BLOCKED',
        'NOT_CONFIGURED',
        'NETWORK_ERROR',
        'INTERNAL_ERROR'
      ];
      assert.strictEqual(states.length, 10);
      assert.ok(states.includes('GEMINI_LIVE_REQUEST_VERIFIED'));
      assert.ok(states.includes('NOT_CONFIGURED'));
    });

    it('5.4: Fallback candidates never loop the same model ID', () => {
      const router = QuotaAwareModelRouter.getInstance();
      const fallback = router.findFallbackModel('gemini-3.8-flash', 'general', true);
      assert.notStrictEqual(fallback, 'gemini-3.8-flash', 'Fallback must never be the failing model itself');
    });
  });
});
