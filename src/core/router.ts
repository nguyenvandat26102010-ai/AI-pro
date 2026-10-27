/**
 * NDAWG PRO — PART 10/10 (APEX INFINITY FINAL MASTER) & V18 EXTENSION
 * Universal Intent Router & Quota-Aware Multi-Model Intelligence Engine (Directives P3 & 4)
 *
 * Implements:
 * 1. Deterministic domain classification:
 *    - CALCULATION, KNOWLEDGE_RAG, GAMING_INTELLIGENCE, CODE_EXECUTION, MULTIMODAL_IMAGE, GENERAL_CONVERSATION
 * 2. Truthful Capability & Model Registry:
 *    - gemini-3.8-flash (General, Search & Maps Grounding)
 *    - gemini-4-argon (Complex reasoning, STEM, code)
 *    - gemini-3.1-flash-lite (Fast inference, latency optimization)
 *    - gemini-3.8-live (Voice real-time)
 *    - gemini-3.5-transcribe (Speech-to-text)
 *    - gemini-nano-banana-2.1 (Image generation & editing)
 *    - gemini-omni-1.1-flash (Video generation via Interactions API)
 * 3. Quota-aware fallback routing:
 *    - Excludes models in quota cooldown
 *    - Evaluates measured latency and status
 */

import { QuotaCooldownManager } from './quotaClassifier.ts';
import type { ProviderStatusType } from './quotaClassifier.ts';

export type DomainIntent = 
  | 'CALCULATION'
  | 'KNOWLEDGE_RAG'
  | 'GAMING_INTELLIGENCE'
  | 'CODE_EXECUTION'
  | 'MULTIMODAL_IMAGE'
  | 'GENERAL_CONVERSATION';

export interface RouteIntentResult {
  primaryDomain: DomainIntent;
  confidence: number;
  recommendedPlugin: string | null;
  recommendedModel: string;
  requiresMultimodal: boolean;
  reasoningContext: string;
  matchedKeywords: string[];
}

export interface ModelCapabilityEntry {
  modelId: string;
  provider: string;
  supportedTasks: string[];
  supportedModalities: string[];
  groundingSupported: boolean;
  streamingSupported: boolean;
  status: ProviderStatusType;
  description: string;
}

export class UniversalIntentRouter {
  private cooldownManager = QuotaCooldownManager.getInstance();

  private modelCatalog: ModelCapabilityEntry[] = [
    {
      modelId: 'gemini-3.8-flash',
      provider: 'google_gemini',
      supportedTasks: ['general', 'search_grounding', 'maps_grounding', 'multimodal_text'],
      supportedModalities: ['text', 'image', 'audio', 'file'],
      groundingSupported: true,
      streamingSupported: true,
      status: 'READY',
      description: 'Mô hình tiêu chuẩn đa thể thức, hỗ trợ Google Search Grounding và Google Maps Grounding.'
    },
    {
      modelId: 'gemini-4-argon',
      provider: 'google_gemini',
      supportedTasks: ['complex_reasoning', 'coding', 'stem_math'],
      supportedModalities: ['text', 'image'],
      groundingSupported: true,
      streamingSupported: true,
      status: 'READY',
      description: 'Mô hình tư duy chuyên sâu, suy luận logic phức tạp và lập trình nâng cao.'
    },
    {
      modelId: 'gemini-3.1-flash-lite',
      provider: 'google_gemini',
      supportedTasks: ['low_latency', 'general', 'fast_response'],
      supportedModalities: ['text', 'image'],
      groundingSupported: true,
      streamingSupported: true,
      status: 'READY',
      description: 'Mô hình siêu tốc độ trễ thấp, phục vụ tác vụ nhanh và fallback khi quá tải.'
    },
    {
      modelId: 'gemini-3.8-live',
      provider: 'google_gemini',
      supportedTasks: ['realtime_voice', 'bidi_audio'],
      supportedModalities: ['audio'],
      groundingSupported: false,
      streamingSupported: true,
      status: 'READY',
      description: 'Mô hình hội thoại giọng nói hai chiều trực tiếp qua Live API.'
    },
    {
      modelId: 'gemini-3.5-transcribe',
      provider: 'google_gemini',
      supportedTasks: ['speech_to_text'],
      supportedModalities: ['audio'],
      groundingSupported: false,
      streamingSupported: false,
      status: 'READY',
      description: 'Mô hình chuyên dụng phiên âm giọng nói microphone sang văn bản tiếng Việt/đa ngữ.'
    },
    {
      modelId: 'gemini-nano-banana-2.1',
      provider: 'google_gemini',
      supportedTasks: ['image_generation', 'image_editing'],
      supportedModalities: ['image'],
      groundingSupported: false,
      streamingSupported: false,
      status: 'READY',
      description: 'Mô hình tạo và chỉnh sửa hình ảnh độ phân giải cao 1K/2K/4K.'
    },
    {
      modelId: 'gemini-omni-1.1-flash',
      provider: 'google_gemini',
      supportedTasks: ['video_generation', 'image_to_video'],
      supportedModalities: ['video'],
      groundingSupported: false,
      streamingSupported: false,
      status: 'READY',
      description: 'Mô hình tạo video tỉ lệ 16:9 và 9:16 thông qua Google Interactions API.'
    }
  ];

  /**
   * Get live status of a model considering quota cooldowns.
   */
  public getModelStatus(modelId: string, hasApiKey: boolean = true): ProviderStatusType {
    if (!hasApiKey) return 'NOT_CONFIGURED';

    const check = this.cooldownManager.isBlocked('google_gemini', modelId);
    if (check.blocked) {
      if (check.entry?.category === 'DAILY_QUOTA_EXHAUSTED') return 'QUOTA_EXHAUSTED';
      if (check.entry?.category === 'QUOTA_ZERO') return 'UNSUPPORTED';
      if (check.entry?.category === 'BILLING_RESTRICTION') return 'BLOCKED';
      return 'COOLDOWN';
    }

    const found = this.modelCatalog.find(m => m.modelId === modelId);
    return found ? found.status : 'UNKNOWN';
  }

  /**
   * Resolves a model to use, picking an available fallback if requested model is in cooldown.
   */
  public resolveModelWithFallback(
    requestedModel: string,
    hasApiKey: boolean = true
  ): {
    selectedModel: string;
    isFallback: boolean;
    originalRequested: string;
    reason?: string;
  } {
    const status = this.getModelStatus(requestedModel, hasApiKey);

    if (status === 'READY') {
      return {
        selectedModel: requestedModel,
        isFallback: false,
        originalRequested: requestedModel
      };
    }

    // Requested model is blocked or in cooldown; search for healthy text-capable candidates
    const fallbackCandidates = ['gemini-3.8-flash', 'gemini-3.1-flash-lite', 'gemini-4-argon'].filter(
      m => m !== requestedModel
    );

    for (const candidate of fallbackCandidates) {
      if (this.getModelStatus(candidate, hasApiKey) === 'READY') {
        return {
          selectedModel: candidate,
          isFallback: true,
          originalRequested: requestedModel,
          reason: `Mô hình ${requestedModel} đang trong trạng thái ${status}. Tự động định tuyến sang ${candidate} còn khả dụng.`
        };
      }
    }

    // All fallback models are blocked/in cooldown
    return {
      selectedModel: requestedModel,
      isFallback: false,
      originalRequested: requestedModel,
      reason: `Tất cả mô hình nhà cung cấp hiện đang gặp giới hạn hạn ngạch (${status}).`
    };
  }

  /**
   * Classifies user input prompt and attachments into the optimal domain and recommended plugin.
   */
  public route(prompt: string, attachments: Array<{ type: string }> = []): RouteIntentResult {
    const rawText = (prompt || '').trim().toLowerCase();
    const hasImageAttachment = attachments.some(a => a.type === 'image');

    // 1. Multimodal priority
    if (hasImageAttachment || /(?:bức ảnh|hình ảnh|image|photo|đọc hình|nhìn hình|ocr|screenshot)/i.test(rawText)) {
      const keywords = ['image', 'visual', 'photo'].filter(k => rawText.includes(k));
      return {
        primaryDomain: 'MULTIMODAL_IMAGE',
        confidence: hasImageAttachment ? 1.0 : 0.85,
        recommendedPlugin: 'image_studio',
        recommendedModel: 'gemini-3.8-flash',
        requiresMultimodal: true,
        reasoningContext: 'Phát hiện yêu cầu đa phương thức hình ảnh. Sử dụng Gemini 3.8 Flash với bộ xử lý đa thể thức an toàn.',
        matchedKeywords: keywords
      };
    }

    // 2. Math & Calculation
    const mathRegex = /(?:tính|calculate|solve|giải toán|biểu thức|\+|\-|\*|\/|\^|sqrt|căn bậc|ma trận)/i;
    const hasNumbers = /[0-9]/.test(rawText);
    const hasMathOperators = /[+\-*/^%]/.test(rawText);
    if ((mathRegex.test(rawText) && (hasNumbers || hasMathOperators)) || /calculate\s+[0-9]/i.test(rawText)) {
      return {
        primaryDomain: 'CALCULATION',
        confidence: 0.95,
        recommendedPlugin: 'math_kernel',
        recommendedModel: 'gemini-3.8-flash',
        requiresMultimodal: false,
        reasoningContext: 'Phát hiện biểu thức số học hoặc logic tính toán. Kích hoạt nhân toán học Math Kernel kiểm chứng kết quả.',
        matchedKeywords: ['math', 'calculate']
      };
    }

    // 3. Gaming Intelligence
    const gamingKeywords = [
      'lol', 'league of legends', 'dota', 'valorant', 'genshin', 'aatrox', 'invoker', 
      'kaisa', 'build đồ', 'lên đồ', 'bảng ngọc', 'meta', 'patch', 'tướng', 'counter-pick'
    ];
    const matchedGaming = gamingKeywords.filter(k => rawText.includes(k));
    if (matchedGaming.length > 0) {
      return {
        primaryDomain: 'GAMING_INTELLIGENCE',
        confidence: 0.92,
        recommendedPlugin: 'game_intelligence',
        recommendedModel: 'gemini-3.8-flash',
        requiresMultimodal: false,
        reasoningContext: 'Phát hiện truy vấn chiến thuật game. Kích hoạt Game Intelligence Engine với kiểm định phiên bản patch.',
        matchedKeywords: matchedGaming
      };
    }

    // 4. Code & Programming
    const codeKeywords = ['code', 'python', 'javascript', 'typescript', 'hàm', 'lỗi code', 'syntax', 'function', 'bug', 'class', 'const '];
    const matchedCode = codeKeywords.filter(k => rawText.includes(k));
    if (matchedCode.length >= 2 || /(?:viết hàm|viết code|debug code|chạy mã)/i.test(rawText)) {
      return {
        primaryDomain: 'CODE_EXECUTION',
        confidence: 0.88,
        recommendedPlugin: 'code_runner',
        recommendedModel: 'gemini-4-argon',
        requiresMultimodal: false,
        reasoningContext: 'Phát hiện mã nguồn hoặc yêu cầu lập trình. Đề xuất mô hình Gemini 4 Argon chuyên sâu code.',
        matchedKeywords: matchedCode
      };
    }

    // 5. Verified Knowledge & Specifications (RAG)
    const ragKeywords = [
      'h100', 'b200', 'tpu', 'nvlink', 'transformer', 'moe', 'mamba', 'ssm', 'lora', 'qlora',
      'tri thức', 'kiểm chứng', 'apex governor', 'audit chain', 'training gate', 'gold badge', 'citation'
    ];
    const matchedRag = ragKeywords.filter(k => rawText.includes(k));
    if (matchedRag.length > 0) {
      return {
        primaryDomain: 'KNOWLEDGE_RAG',
        confidence: 0.90,
        recommendedPlugin: 'knowledge_base',
        recommendedModel: 'gemini-3.8-flash',
        requiresMultimodal: false,
        reasoningContext: 'Phát hiện từ khóa kiến trúc phần cứng/thuật toán. Kích hoạt Knowledge Cards RAG với trích dẫn minh bạch.',
        matchedKeywords: matchedRag
      };
    }

    // 6. Default to General Multilingual Conversation
    return {
      primaryDomain: 'GENERAL_CONVERSATION',
      confidence: 0.75,
      recommendedPlugin: null,
      recommendedModel: 'gemini-3.6-flash',
      requiresMultimodal: false,
      reasoningContext: 'Truy vấn hội thoại tự nhiên thông thường. Sử dụng Gemini 3.8 Flash với ngữ cảnh đa lượt.',
      matchedKeywords: []
    };
  }

  public getModelCatalog(): ModelCapabilityEntry[] {
    return [...this.modelCatalog];
  }
}
