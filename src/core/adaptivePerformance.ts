/**
 * NDAWG PRO — APEX INFINITY V14
 * Adaptive Performance Engine & Request Tracing (Part 6)
 *
 * Implements:
 * - Request Tracing: Queue wait, validation, retrieval, connection, TTFT, tool execution, total latency
 * - Progressive Escalation: Fast direct answer -> Retrieval -> Specialized tool -> Independent verification
 * - Context-size Budgeting & Token Optimization
 * - Bounded Retry with Exponential Backoff & Jitter
 */

export interface RequestTraceItem {
  requestId: string;
  timestamp: string;
  epochMs: number;
  promptLength: number;
  domainIntent: string;
  selectedModel: string;
  escalationStage: 'FAST_DIRECT' | 'RETRIEVAL' | 'SPECIALIZED_TOOL' | 'INDEPENDENT_VERIFICATION';
  timings: {
    queueWaitMs: number;
    requestValidationMs: number;
    retrievalMs: number;
    providerConnectionMs: number;
    timeToFirstTokenMs: number;
    toolExecutionMs: number;
    outputProcessingMs: number;
    totalResponseTimeMs: number;
  };
  contextBudget: {
    rawTokensEstimate: number;
    optimizedTokensEstimate: number;
    tokensSavedPercentage: number;
    prunedMessagesCount: number;
  };
  retryAttempts: number;
  circuitState: 'CLOSED' | 'HALF_OPEN' | 'OPEN';
  success: boolean;
  notes?: string;
}

export interface EscalationDecision {
  stage: 'FAST_DIRECT' | 'RETRIEVAL' | 'SPECIALIZED_TOOL' | 'INDEPENDENT_VERIFICATION';
  recommendedModel: string;
  requiresRAG: boolean;
  requiresTools: string[];
  requiresDualPassVerification: boolean;
  rationale: string;
}

export interface MessageContextItem {
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp?: number;
  tokensEstimate?: number;
}

export class AdaptivePerformanceEngine {
  private recentTraces: RequestTraceItem[] = [];
  private readonly maxTracesRetained = 100;

  /**
   * Progressive Escalation Logic (Directive 6.4)
   * FAST DIRECT ANSWER -> RETRIEVAL IF NEEDED -> SPECIALIZED TOOL IF NEEDED -> INDEPENDENT VERIFICATION IF JUSTIFIED
   */
  public evaluateEscalation(
    prompt: string,
    hasAttachments: boolean = false,
    explicitDomain?: string
  ): EscalationDecision {
    const cleanText = (prompt || '').trim().toLowerCase();

    // 1. Math, Code execution or Specialized Tools
    const isMath = /(?:tính|calculate|solve|giải toán|\+|\-|\*|\/|\^|sqrt)/i.test(cleanText) && /[0-9]/.test(cleanText);
    const isCode = /(?:viết code|debug|function|thuật toán|lập trình|typescript|python|react|refactor)/i.test(cleanText);
    const isGaming = /(?:build đồ|bảng ngọc|meta|aatrox|yasuo|patch|tướng|game)/i.test(cleanText);

    if (isMath) {
      return {
        stage: 'SPECIALIZED_TOOL',
        recommendedModel: 'gemini-3.6-flash',
        requiresRAG: false,
        requiresTools: ['math_kernel'],
        requiresDualPassVerification: true,
        rationale: 'Kích hoạt công cụ chuyên biệt Math Kernel để tính toán tất định chính xác 100%.'
      };
    }

    if (isCode) {
      return {
        stage: 'SPECIALIZED_TOOL',
        recommendedModel: 'gemini-3.8-flash',
        requiresRAG: true,
        requiresTools: ['code_lab'],
        requiresDualPassVerification: true,
        rationale: 'Kích hoạt Code Lab sandbox để kiểm tra cú pháp và sinh mã an toàn.'
      };
    }

    if (isGaming) {
      return {
        stage: 'SPECIALIZED_TOOL',
        recommendedModel: 'gemini-3.6-flash',
        requiresRAG: true,
        requiresTools: ['game_intelligence'],
        requiresDualPassVerification: false,
        rationale: 'Kích hoạt Gaming Intelligence Engine để tra cứu meta chiến thuật.'
      };
    }

    // 2. High-stake deep research / medical / legal -> Independent Verification
    const isHighStakes = /(?:luật|pháp lý|y tế|thuốc|điều trị|bệnh án|hợp đồng|chứng khoán|đầu tư lớn)/i.test(cleanText);
    if (isHighStakes) {
      return {
        stage: 'INDEPENDENT_VERIFICATION',
        recommendedModel: 'gemini-3.8-flash',
        requiresRAG: true,
        requiresTools: ['knowledge_base', 'web_search'],
        requiresDualPassVerification: true,
        rationale: 'Lĩnh vực pháp lý / y tế / tài chính: kích hoạt xác minh nguồn chéo và đính kèm cảnh báo bắt buộc.'
      };
    }

    // 3. Retrieval needed (knowledge, specs, history, taxonomy)
    const isKnowledgeRetrieval =
      hasAttachments ||
      /(?:là gì|thông số|lịch sử|nguồn gốc|định nghĩa|kiến trúc|tài liệu|tri thức|h100|b200|transformer)/i.test(cleanText);
    if (isKnowledgeRetrieval) {
      return {
        stage: 'RETRIEVAL',
        recommendedModel: 'gemini-3.6-flash',
        requiresRAG: true,
        requiresTools: ['knowledge_base'],
        requiresDualPassVerification: false,
        rationale: 'Yêu cầu tra cứu dữ liệu: kích hoạt Universal Knowledge RAG Fabric.'
      };
    }

    // 4. Default: Fast Direct Answer
    return {
      stage: 'FAST_DIRECT',
      recommendedModel: 'gemini-3.6-flash',
      requiresRAG: false,
      requiresTools: [],
      requiresDualPassVerification: false,
      rationale: 'Truy vấn thông thường: phản hồi nhanh trực tiếp với chi phí và độ trễ tối thiểu.'
    };
  }

  /**
   * Context-size budgeting and token optimization (Directive 6.2)
   * Bounds message window, prunes redundant whitespace, and preserves critical system prompt.
   */
  public optimizeContext(
    messages: MessageContextItem[],
    maxTokensBudget: number = 8000
  ): {
    optimizedMessages: MessageContextItem[];
    rawTokensEstimate: number;
    optimizedTokensEstimate: number;
    tokensSavedPercentage: number;
    prunedMessagesCount: number;
  } {
    if (!messages || messages.length === 0) {
      return {
        optimizedMessages: [],
        rawTokensEstimate: 0,
        optimizedTokensEstimate: 0,
        tokensSavedPercentage: 0,
        prunedMessagesCount: 0
      };
    }

    // Helper: rough token estimate ~ 4 chars per token
    const estimateTokens = (text: string) => Math.ceil((text || '').length / 3.8);

    const rawTotalTokens = messages.reduce((acc, m) => acc + estimateTokens(m.content), 0);

    // Keep system message always
    const systemMessages = messages.filter(m => m.role === 'system');
    const conversationMessages = messages.filter(m => m.role !== 'system');

    // Retain recent messages within budget
    const systemTokens = systemMessages.reduce((acc, m) => acc + estimateTokens(m.content), 0);
    let remainingBudget = Math.max(maxTokensBudget - systemTokens, 1000);

    const selectedMessages: MessageContextItem[] = [];
    let prunedCount = 0;

    // Traverse from most recent backwards
    for (let i = conversationMessages.length - 1; i >= 0; i--) {
      const msg = conversationMessages[i];
      // Clean redundant intermediate spaces and repeated newlines
      const cleanedContent = msg.content
        .replace(/[ \t]+/g, ' ')
        .replace(/\n{3,}/g, '\n\n')
        .trim();

      const msgTokens = estimateTokens(cleanedContent);
      if (remainingBudget - msgTokens >= 0 || selectedMessages.length < 2) {
        selectedMessages.unshift({
          ...msg,
          content: cleanedContent,
          tokensEstimate: msgTokens
        });
        remainingBudget -= msgTokens;
      } else {
        prunedCount++;
      }
    }

    const finalMessages = [...systemMessages, ...selectedMessages];
    const optimizedTotalTokens = finalMessages.reduce((acc, m) => acc + estimateTokens(m.content), 0);
    const savedPercentage = rawTotalTokens > 0
      ? Number((((rawTotalTokens - optimizedTotalTokens) / rawTotalTokens) * 100).toFixed(1))
      : 0;

    return {
      optimizedMessages: finalMessages,
      rawTokensEstimate: rawTotalTokens,
      optimizedTokensEstimate: optimizedTotalTokens,
      tokensSavedPercentage: Math.max(savedPercentage, 0),
      prunedMessagesCount: prunedCount
    };
  }

  /**
   * Bounded Exponential Backoff with Jitter calculation (Directive 6.5)
   */
  public calculateBackoffDelay(
    attempt: number,
    baseDelayMs: number = 1000,
    maxDelayMs: number = 8000
  ): number {
    const exponential = Math.min(maxDelayMs, baseDelayMs * Math.pow(2, attempt));
    // Add 10-25% random jitter to avoid thundering herd problem
    const jitter = Math.floor(Math.random() * (exponential * 0.2));
    return Math.min(exponential + jitter, maxDelayMs);
  }

  /**
   * Record operational trace
   */
  public recordTrace(trace: RequestTraceItem): void {
    this.recentTraces.unshift(trace);
    if (this.recentTraces.length > this.maxTracesRetained) {
      this.recentTraces.pop();
    }
  }

  public getRecentTraces(limit: number = 20): RequestTraceItem[] {
    return this.recentTraces.slice(0, Math.min(limit, this.maxTracesRetained));
  }

  public getPerformanceStats(): {
    totalTraces: number;
    avgResponseTimeMs: number;
    avgTokensSavedPct: number;
    successRate: number;
  } {
    const count = this.recentTraces.length;
    if (count === 0) {
      return {
        totalTraces: 0,
        avgResponseTimeMs: 0,
        avgTokensSavedPct: 0,
        successRate: 100
      };
    }

    const totalTime = this.recentTraces.reduce((acc, t) => acc + t.timings.totalResponseTimeMs, 0);
    const totalSavedPct = this.recentTraces.reduce((acc, t) => acc + t.contextBudget.tokensSavedPercentage, 0);
    const successCount = this.recentTraces.filter(t => t.success).length;

    return {
      totalTraces: count,
      avgResponseTimeMs: Math.round(totalTime / count),
      avgTokensSavedPct: Number((totalSavedPct / count).toFixed(1)),
      successRate: Number(((successCount / count) * 100).toFixed(1))
    };
  }
}
