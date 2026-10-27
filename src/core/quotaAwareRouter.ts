/**
 * NDAWG PRO — APEX INFINITY V18
 * Quota-Aware Model Router & Multi-Tier Circuit Breaker (Directives 4 & 6)
 *
 * Enforces verified provider and model metadata, circuit breaker states:
 * CLOSED -> OPEN -> HALF_OPEN -> CLOSED
 *
 * Prevents pointless retries on daily quota exhaustion or limit = 0.
 * Enables graceful fallback to compatible configured models.
 */

import type { ProviderStatusType, ClassifiedError } from './quotaClassifier.ts';

export type CircuitState = 'CLOSED' | 'OPEN' | 'HALF_OPEN';

export interface ModelMetadata {
  providerId: string;
  modelId: string;
  displayName: string;
  taskTypes: string[];
  modalities: Array<'text' | 'image' | 'audio' | 'video'>;
  supportsGrounding: boolean;
  supportsStreaming: boolean;
  status: ProviderStatusType;
  circuitState: CircuitState;
  consecutiveFailures: number;
  lastFailureTimestamp?: number;
  cooldownUntilTimestamp?: number;
  lastError?: ClassifiedError;
  measuredLatencyMs?: number;
}

export class QuotaAwareModelRouter {
  private static instance: QuotaAwareModelRouter;
  private registry: Map<string, ModelMetadata>;
  private readonly failureThreshold = 3;
  private readonly defaultCooldownMs = 30000; // 30s for transient
  private readonly dailyCooldownMs = 3600000; // 1 hour for daily quota exhausted

  private constructor() {
    this.registry = new Map();
    this.initRegistry();
  }

  public static getInstance(): QuotaAwareModelRouter {
    if (!QuotaAwareModelRouter.instance) {
      QuotaAwareModelRouter.instance = new QuotaAwareModelRouter();
    }
    return QuotaAwareModelRouter.instance;
  }

  private initRegistry(): void {
    const models: Omit<ModelMetadata, 'circuitState' | 'consecutiveFailures'>[] = [
      {
        providerId: 'google-gemini',
        modelId: 'gemini-3.8-flash',
        displayName: 'Gemini 3.8 Flash (Tác vụ chung)',
        taskTypes: ['general', 'search_grounding', 'maps_grounding', 'rag'],
        modalities: ['text', 'image'],
        supportsGrounding: true,
        supportsStreaming: true,
        status: 'READY'
      },
      {
        providerId: 'google-gemini',
        modelId: 'gemini-4-argon',
        displayName: 'Gemini 4 Argon (Suy luận chuyên sâu)',
        taskTypes: ['complex_reasoning', 'coding', 'stem_math'],
        modalities: ['text', 'image'],
        supportsGrounding: false,
        supportsStreaming: true,
        status: 'READY'
      },
      {
        providerId: 'google-gemini',
        modelId: 'gemini-3.1-flash-lite',
        displayName: 'Gemini 3.1 Flash Lite (Siêu tốc)',
        taskTypes: ['fast_query', 'summarization', 'simple_chat'],
        modalities: ['text'],
        supportsGrounding: false,
        supportsStreaming: true,
        status: 'READY'
      },
      {
        providerId: 'google-gemini',
        modelId: 'gemini-3.8-live',
        displayName: 'Gemini 3.8 Live (Voice Real-time)',
        taskTypes: ['voice_conversation', 'live_audio'],
        modalities: ['text', 'audio'],
        supportsGrounding: false,
        supportsStreaming: true,
        status: 'READY'
      },
      {
        providerId: 'google-gemini',
        modelId: 'gemini-3.5-transcribe',
        displayName: 'Gemini 3.5 Transcribe (Audio STT)',
        taskTypes: ['audio_transcription'],
        modalities: ['audio', 'text'],
        supportsGrounding: false,
        supportsStreaming: false,
        status: 'READY'
      },
      {
        providerId: 'google-gemini',
        modelId: 'gemini-nano-banana-2.1',
        displayName: 'Gemini Nano Banana 2.1 (Tạo ảnh chất lượng cao)',
        taskTypes: ['image_generation', 'image_editing'],
        modalities: ['image'],
        supportsGrounding: false,
        supportsStreaming: false,
        status: 'READY'
      },
      {
        providerId: 'google-gemini',
        modelId: 'gemini-omni-1.1-flash',
        displayName: 'Gemini Omni Flash 1.1 (Interactions API Video)',
        taskTypes: ['video_generation', 'video_extension'],
        modalities: ['video', 'text', 'image'],
        supportsGrounding: false,
        supportsStreaming: false,
        status: 'READY'
      }
    ];

    for (const m of models) {
      this.registry.set(m.modelId, {
        ...m,
        circuitState: 'CLOSED',
        consecutiveFailures: 0
      });
    }
  }

  /**
   * Get metadata for a specific model ID.
   */
  public getModel(modelId: string): ModelMetadata | undefined {
    return this.registry.get(modelId);
  }

  /**
   * Returns all registered models with their current truthful statuses.
   */
  public getAllModels(): ModelMetadata[] {
    const now = Date.now();
    for (const model of this.registry.values()) {
      // Check if cooldown has expired for circuit breaker
      if (model.circuitState === 'OPEN' && model.cooldownUntilTimestamp && now >= model.cooldownUntilTimestamp) {
        model.circuitState = 'HALF_OPEN';
        model.status = 'DEGRADED';
      }
    }
    return Array.from(this.registry.values());
  }

  /**
   * Verifies if a model can receive requests right now.
   */
  public isModelAvailable(modelId: string): { available: boolean; reason?: string } {
    const meta = this.getModel(modelId);
    if (!meta) {
      return { available: false, reason: `Mô hình "${modelId}" không nằm trong danh mục hỗ trợ.` };
    }

    const now = Date.now();

    // Check Cooldown
    if (meta.cooldownUntilTimestamp && now < meta.cooldownUntilTimestamp) {
      const waitSeconds = Math.ceil((meta.cooldownUntilTimestamp - now) / 1000);
      return {
        available: false,
        reason: `Mô hình "${modelId}" đang trong thời gian hạ nhiệt (${waitSeconds}s còn lại do ${meta.lastError?.errorCategory || 'lỗi'}).`
      };
    }

    // Check Blocked or Quota Exhausted status
    if (meta.status === 'BLOCKED' || meta.status === 'QUOTA_EXHAUSTED' || meta.status === 'NOT_CONFIGURED') {
      return {
        available: false,
        reason: `Mô hình "${modelId}" có trạng thái [${meta.status}]: ${meta.lastError?.userMessage.vi || 'Không khả dụng'}`
      };
    }

    if (meta.circuitState === 'OPEN') {
      return {
        available: false,
        reason: `Circuit Breaker đang mở (OPEN) cho mô hình "${modelId}" sau ${meta.consecutiveFailures} lỗi liên tiếp.`
      };
    }

    return { available: true };
  }

  /**
   * Record a successful response for a model.
   */
  public recordSuccess(modelId: string, latencyMs?: number): void {
    const meta = this.getModel(modelId);
    if (!meta) return;

    meta.circuitState = 'CLOSED';
    meta.consecutiveFailures = 0;
    meta.cooldownUntilTimestamp = undefined;
    meta.status = 'READY';
    if (latencyMs) meta.measuredLatencyMs = latencyMs;
  }

  /**
   * Record a failure and adjust circuit breaker and cooldown accordingly.
   */
  public recordFailure(modelId: string, classifiedError: ClassifiedError): void {
    const meta = this.getModel(modelId);
    if (!meta) return;

    const now = Date.now();
    meta.lastFailureTimestamp = now;
    meta.lastError = classifiedError;
    meta.consecutiveFailures++;

    if (classifiedError.errorCategory === 'DAILY_QUOTA_EXHAUSTED') {
      meta.status = 'QUOTA_EXHAUSTED';
      meta.circuitState = 'OPEN';
      meta.cooldownUntilTimestamp = now + this.dailyCooldownMs;
    } else if (
      classifiedError.errorCategory === 'QUOTA_LIMIT_ZERO' ||
      classifiedError.errorCategory === 'QUOTA_ZERO' ||
      classifiedError.errorCategory === 'BILLING_RESTRICTION'
    ) {
      meta.status = 'BLOCKED';
      meta.circuitState = 'OPEN';
      meta.cooldownUntilTimestamp = now + 86400000; // 24 hours
    } else if (classifiedError.errorCategory === 'AUTH_ERROR') {
      meta.status = 'NOT_CONFIGURED';
      meta.circuitState = 'OPEN';
    } else if (
      classifiedError.errorCategory === 'INVALID_REQUEST' ||
      classifiedError.errorCategory === 'INVALID_CONFIG'
    ) {
      meta.status = 'UNSUPPORTED';
    } else {
      // Transient rate limits / overloads
      if (meta.consecutiveFailures >= this.failureThreshold) {
        meta.circuitState = 'OPEN';
        meta.status = 'DEGRADED';
        meta.cooldownUntilTimestamp = now + Math.max(classifiedError.retryAfterMs || 5000, this.defaultCooldownMs);
      } else {
        meta.status = 'DEGRADED';
      }
    }
  }

  /**
   * Finds the best compatible fallback model if the requested model is unavailable.
   */
  public findFallbackModel(
    primaryModelId: string,
    requiredTask: string = 'general',
    allowFallback: boolean = true
  ): string | null {
    if (!allowFallback) return null;

    const candidates = this.getAllModels().filter(m => {
      if (m.modelId === primaryModelId) return false;
      const { available } = this.isModelAvailable(m.modelId);
      return available && m.taskTypes.includes(requiredTask);
    });

    if (candidates.length === 0) {
      // Check general text candidates if specific task not matched
      const generalCandidates = this.getAllModels().filter(m => {
        if (m.modelId === primaryModelId) return false;
        const { available } = this.isModelAvailable(m.modelId);
        return available && m.taskTypes.includes('general');
      });
      return generalCandidates[0]?.modelId || null;
    }

    return candidates[0].modelId;
  }
}
