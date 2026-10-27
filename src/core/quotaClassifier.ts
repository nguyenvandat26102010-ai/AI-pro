/**
 * NDAWG PRO — APEX INFINITY V18
 * Universal Provider Quota Classifier & Cooldown Engine (Directives P0 & 2)
 *
 * Implements deterministic classification of provider errors, distinguishing:
 * - Temporary rate limit (RPM/TPM with retry-after)
 * - Daily quota exhausted (GenerateRequestsPerDayPerProjectPerModel-FreeTier)
 * - Quota limit equals zero (model unavailable in current tier)
 * - Billing or spend restrictions
 * - Temporary provider overload (503 / UNAVAILABLE)
 * - Authentication, permission, and configuration errors
 *
 * Never disguises quota exhaustion as "server latency due to high traffic".
 */

export type ProviderErrorCategory =
  | 'DAILY_QUOTA_EXHAUSTED'
  | 'TEMPORARY_RATE_LIMIT'
  | 'QUOTA_ZERO'
  | 'QUOTA_LIMIT_ZERO'
  | 'BILLING_RESTRICTION'
  | 'PROVIDER_OVERLOAD'
  | 'INVALID_CONFIG'
  | 'INVALID_REQUEST'
  | 'AUTH_ERROR'
  | 'UNKNOWN';

export type ProviderStatusType =
  | 'READY'
  | 'DEGRADED'
  | 'COOLDOWN'
  | 'QUOTA_EXHAUSTED'
  | 'NOT_CONFIGURED'
  | 'UNSUPPORTED'
  | 'BLOCKED'
  | 'UNKNOWN';

export interface DiagnosticInfo {
  code: string;
  safeDetails: string;
  adminActionHint: string;
}

export interface ProviderErrorClassification {
  provider: string;
  model: string;
  httpStatus: number;
  providerStatus: ProviderStatusType;
  errorCategory: ProviderErrorCategory;
  quotaMetric?: string;
  quotaLimit?: number;
  retryable: boolean;
  retryAfterMs?: number;
  userMessage: {
    vi: string;
    ko: string;
    en: string;
  } & string;
  userMessageVi: string;
  userMessageKo: string;
  userMessageEn: string;
  technicalDetails?: string;
  diagnostic: DiagnosticInfo;
  requestId: string;
  timestamp: number;
}

export type ClassifiedError = ProviderErrorClassification;

export function sanitizeErrorDetails(raw: string): string {
  if (!raw) return '';
  return raw
    .replace(/AIza[0-9A-Za-z-_]+/g, '[REDACTED_API_KEY]')
    .replace(/\/app\/applet\/node_modules[^\s]*/g, '[REDACTED_PATH]')
    .replace(/\/home\/[^\s]+/g, '[REDACTED_PATH]')
    .replace(/bearer\s+[a-zA-Z0-9._-]+/gi, 'Bearer [REDACTED_TOKEN]');
}

export function calculateBackoffWithJitter(
  attempt: number,
  baseDelayMs: number = 1000,
  maxDelayMs: number = 10000,
  jitterRatio: number = 0.2
): number {
  const exponential = Math.min(baseDelayMs * Math.pow(2, attempt - 1), maxDelayMs);
  const jitter = exponential * jitterRatio * (Math.random() * 2 - 1);
  return Math.max(500, Math.round(exponential + jitter));
}

export interface QuotaCooldownEntry {
  provider: string;
  model: string;
  metric?: string;
  category: ProviderErrorCategory;
  blockedUntilEpoch: number;
  reason: string;
}

/**
 * Classifies raw upstream errors from Google Gemini and other AI providers.
 */
export function classifyProviderError(
  error: any,
  provider: string = 'google_gemini',
  model: string = 'gemini-3.8-flash',
  preferredLang: 'vi' | 'ko' | 'en' = 'vi'
): ProviderErrorClassification {
  const timestamp = Date.now();
  const requestId = `req_${timestamp}_${Math.random().toString(36).substring(2, 7)}`;

  const rawMessage = typeof error === 'string' ? error : (error?.message || error?.statusText || JSON.stringify(error) || '');
  const rawStatus = Number(error?.status || error?.statusCode || error?.code) || 500;

  let httpStatus = rawStatus >= 400 && rawStatus <= 599 ? rawStatus : 500;
  let errorCategory: ProviderErrorCategory = 'UNKNOWN';
  let providerStatus: ProviderStatusType = 'UNKNOWN';
  let retryable = false;
  let retryAfterMs: number | undefined = undefined;
  let quotaMetric: string | undefined = undefined;
  let quotaLimit: number | undefined = undefined;

  // 1. Detect 429 Status
  const is429 = httpStatus === 429 || /429|resource_exhausted|quota|rate limit/i.test(rawMessage);

  // 2. Parse retry-after from error details or headers if available
  const retryMatch =
    rawMessage.match(/retry(?:ing)?\s+after\s+([\d.]+)\s*(?:s|seconds|ms)?/i) ||
    rawMessage.match(/retryAfter:\s*([\d.]+)/i) ||
    rawMessage.match(/reset in ([\d.]+)s/i);
  if (retryMatch) {
    const rawVal = parseFloat(retryMatch[1]);
    retryAfterMs = rawVal > 1000 ? Math.round(rawVal) : Math.round(rawVal * 1000);
  }

  // 3. Daily Quota Exhausted Detection
  const isDailyExhausted =
    /generaterequestsperday/i.test(rawMessage) ||
    /perdayperproject/i.test(rawMessage) ||
    /requests per day limit exceeded/i.test(rawMessage) ||
    /daily quota/i.test(rawMessage) ||
    /quota exceeded for quota metric 'generate content requests per day'/i.test(rawMessage);

  // 4. Quota equals zero detection
  const isZeroQuota =
    /quota limit:\s*0/i.test(rawMessage) ||
    /limit of 0/i.test(rawMessage) ||
    /quota is 0/i.test(rawMessage) ||
    /current quota (?:limit )?is 0/i.test(rawMessage) ||
    /limit 0 requests/i.test(rawMessage);

  // 5. Billing / Spend cap restriction
  const isBillingIssue =
    httpStatus === 402 ||
    /billing/i.test(rawMessage) ||
    /payment/i.test(rawMessage) ||
    /spend cap/i.test(rawMessage) ||
    /credit depleted/i.test(rawMessage) ||
    /tier not enabled/i.test(rawMessage);

  // 6. Authentication or Key Missing
  const isAuthError =
    httpStatus === 401 ||
    httpStatus === 403 ||
    /api key not found/i.test(rawMessage) ||
    /invalid api key/i.test(rawMessage) ||
    /unauthenticated/i.test(rawMessage) ||
    /permission denied/i.test(rawMessage) ||
    /api_key_invalid/i.test(rawMessage);

  // 7. Temporary Overload (503 / UNAVAILABLE / Overloaded)
  const isOverload =
    httpStatus === 503 ||
    /overloaded/i.test(rawMessage) ||
    /service unavailable/i.test(rawMessage) ||
    /temporarily unavailable/i.test(rawMessage) ||
    /high traffic spike/i.test(rawMessage);

  // 8. Invalid Model or Config (404 / 400 Bad Request)
  const isInvalidConfig =
    httpStatus === 400 ||
    httpStatus === 404 ||
    /model not found/i.test(rawMessage) ||
    /unsupported model/i.test(rawMessage) ||
    /invalid argument/i.test(rawMessage);

  // Classify category & retryable flag
  if (isDailyExhausted) {
    httpStatus = 429;
    errorCategory = 'DAILY_QUOTA_EXHAUSTED';
    providerStatus = 'QUOTA_EXHAUSTED';
    retryable = false;
    quotaMetric = 'requests_per_day';
    // Daily cooldown default: 3600 seconds (1 hour minimum) or until midnight
    retryAfterMs = retryAfterMs || 3600000;
  } else if (isZeroQuota) {
    httpStatus = 429;
    errorCategory = 'QUOTA_LIMIT_ZERO';
    providerStatus = 'BLOCKED';
    retryable = false;
    quotaLimit = 0;
  } else if (isBillingIssue) {
    httpStatus = 402;
    errorCategory = 'BILLING_RESTRICTION';
    providerStatus = 'BLOCKED';
    retryable = false;
  } else if (isAuthError) {
    errorCategory = 'AUTH_ERROR';
    providerStatus = 'NOT_CONFIGURED';
    retryable = false;
  } else if (isOverload) {
    httpStatus = 503;
    errorCategory = 'PROVIDER_OVERLOAD';
    providerStatus = 'DEGRADED';
    retryable = true;
    retryAfterMs = retryAfterMs || 3000;
  } else if (is429) {
    httpStatus = 429;
    errorCategory = 'TEMPORARY_RATE_LIMIT';
    providerStatus = 'COOLDOWN';
    retryable = true;
    if (/token/i.test(rawMessage)) {
      quotaMetric = 'TokensPerMinute';
    } else {
      quotaMetric = 'requests_per_minute';
    }
    retryAfterMs = retryAfterMs || 5000;
  } else if (isInvalidConfig) {
    errorCategory = 'INVALID_REQUEST';
    providerStatus = 'UNSUPPORTED';
    retryable = false;
  } else {
    errorCategory = 'UNKNOWN';
    providerStatus = 'DEGRADED';
    retryable = false;
  }

  // Construct localized user-facing messages
  const viMessages: Record<ProviderErrorCategory, string> = {
    DAILY_QUOTA_EXHAUSTED: `Model này đã hết hạn mức sử dụng trong ngày của dự án hiện tại. Hệ thống đã tạm dừng các lần gọi lặp lại. Bạn có thể chọn một model khác đã được cấu hình và còn khả dụng, hoặc kiểm tra hạn mức và thông tin thanh toán.`,
    TEMPORARY_RATE_LIMIT: `Model đang nhận quá nhiều yêu cầu. Hệ thống sẽ thử lại có giới hạn và thông báo nếu chưa thể khôi phục.`,
    QUOTA_ZERO: `Model hiện không khả dụng với cấu hình hoặc hạn mức hiện tại. Chưa có kết quả từ model này.`,
    QUOTA_LIMIT_ZERO: `Model hiện không khả dụng với cấu hình hoặc hạn mức hiện tại. Chưa có kết quả từ model này.`,
    BILLING_RESTRICTION: `Dự án chưa kích hoạt thanh toán hoặc đã chạm giới hạn ngân sách (spend cap). Chưa thể thực hiện lệnh gọi API cho model ${model}.`,
    PROVIDER_OVERLOAD: `Nhà cung cấp đang tạm thời quá tải. Hệ thống sẽ thử lại trong giới hạn cho phép.`,
    AUTH_ERROR: `Xác thực API không thành công hoặc khóa GEMINI_API_KEY không hợp lệ. Vui lòng kiểm tra lại cấu hình trong AI Studio Secrets.`,
    INVALID_CONFIG: `Yêu cầu không hợp lệ hoặc mô hình ${model} không được hỗ trợ cho chức năng này.`,
    INVALID_REQUEST: `Yêu cầu không hợp lệ hoặc model ${model} không được hỗ trợ cho chức năng này.`,
    UNKNOWN: `Đã xảy ra lỗi khi kết nối với nhà cung cấp (${rawMessage.slice(0, 100)}).`
  };

  const koMessages: Record<ProviderErrorCategory, string> = {
    DAILY_QUOTA_EXHAUSTED: `${model} 모델의 일일 사용량 한도가 초과되었습니다. 반복 호출을 일시 중단했습니다. 다른 모델을 선택하거나 할당량을 확인하십시오.`,
    TEMPORARY_RATE_LIMIT: `${model} 모델에 요청이 너무 많이 집중되고 있습니다. 잠시 후 제한된 범위 내에서 재시도합니다.`,
    QUOTA_ZERO: `${model} 모델의 현재 할당량이 0으로 설정되어 있어 사용할 수 없습니다.`,
    QUOTA_LIMIT_ZERO: `${model} 모델의 현재 할당량이 0으로 설정되어 있어 사용할 수 없습니다.`,
    BILLING_RESTRICTION: `결제 계정 설정 또는 비용 한도 제한으로 인해 요청을 처리할 수 없습니다.`,
    PROVIDER_OVERLOAD: `제공자 서버가 일시적으로 과부하 상태입니다. 잠시 후 다시 시도합니다.`,
    AUTH_ERROR: `API 키 인증에 실패했습니다. 올바른 키가 설정되어 있는지 확인하세요.`,
    INVALID_CONFIG: `잘못된 모델 이름이거나 지원되지 않는 매개변수입니다.`,
    INVALID_REQUEST: `잘못된 모델 이름이거나 지원되지 않는 매개변수입니다.`,
    UNKNOWN: `공급자 통신 중 오류가 발생했습니다 (${rawMessage.slice(0, 100)}).`
  };

  const enMessages: Record<ProviderErrorCategory, string> = {
    DAILY_QUOTA_EXHAUSTED: `Model ${model} has exceeded its daily request quota for the current project. Repeated calls have been suspended. Please switch to an available model or check quotas in Google Cloud.`,
    TEMPORARY_RATE_LIMIT: `Model ${model} is currently receiving too many requests. The system is applying bounded backoff and will retry safely.`,
    QUOTA_ZERO: `Model ${model} has an assigned quota limit of 0 under the current configuration and is not available.`,
    QUOTA_LIMIT_ZERO: `Model ${model} has an assigned quota limit of 0 under the current configuration and is not available.`,
    BILLING_RESTRICTION: `Project billing restriction or spending cap encountered. Requests to ${model} are paused.`,
    PROVIDER_OVERLOAD: `The upstream provider is temporarily overloaded (503). Retrying with bounded jitter.`,
    AUTH_ERROR: `Authentication failed or invalid API credentials for provider. Check GEMINI_API_KEY in Secrets.`,
    INVALID_CONFIG: `Invalid request configuration or model ${model} is not supported for this capability.`,
    INVALID_REQUEST: `Invalid request configuration or model ${model} is not supported for this capability.`,
    UNKNOWN: `Upstream provider error (${rawMessage.slice(0, 100)}).`
  };

  const userMessageVi = viMessages[errorCategory] || viMessages.UNKNOWN;
  const userMessageKo = koMessages[errorCategory] || koMessages.UNKNOWN;
  const userMessageEn = enMessages[errorCategory] || enMessages.UNKNOWN;

  const userMessageStr = preferredLang === 'ko' ? userMessageKo : (preferredLang === 'en' ? userMessageEn : userMessageVi);
  const userMessage = Object.assign(String(userMessageStr), {
    vi: userMessageVi,
    ko: userMessageKo,
    en: userMessageEn
  }) as { vi: string; ko: string; en: string } & string;

  const adminActionHint =
    errorCategory === 'DAILY_QUOTA_EXHAUSTED'
      ? 'Hạn mức ngày đã hết. Đổi sang model khác hoặc nâng cấp hạn mức tại Google Cloud Console.'
      : errorCategory === 'AUTH_ERROR'
      ? 'Kiểm tra GEMINI_API_KEY trong AI Studio Secrets.'
      : errorCategory === 'QUOTA_LIMIT_ZERO' || (errorCategory as string) === 'QUOTA_ZERO'
      ? 'Hạn ngạch được gán là 0. Kiểm tra billing project.'
      : 'Kiểm tra trạng thái kết nối mạng và upstream Google.';

  const diagnostic: DiagnosticInfo = {
    code: errorCategory,
    safeDetails: sanitizeErrorDetails(rawMessage.length > 300 ? `${rawMessage.slice(0, 300)}...` : rawMessage),
    adminActionHint
  };

  return {
    provider,
    model,
    httpStatus,
    providerStatus,
    errorCategory,
    quotaMetric,
    quotaLimit,
    retryable,
    retryAfterMs,
    userMessage,
    userMessageVi,
    userMessageKo,
    userMessageEn,
    technicalDetails: sanitizeErrorDetails(rawMessage.length > 300 ? `${rawMessage.slice(0, 300)}...` : rawMessage),
    diagnostic,
    requestId,
    timestamp
  };
}

/**
 * Quota Cooldown Manager
 * Tracks quota exhaustion and prevents repeated failing calls to models in cooldown.
 */
export class QuotaCooldownManager {
  private static instance: QuotaCooldownManager;
  private cooldowns: Map<string, QuotaCooldownEntry> = new Map();

  public static getInstance(): QuotaCooldownManager {
    if (!QuotaCooldownManager.instance) {
      QuotaCooldownManager.instance = new QuotaCooldownManager();
    }
    return QuotaCooldownManager.instance;
  }

  private getKey(provider: string, model: string): string {
    return `${provider}::${model}`;
  }

  /**
   * Checks if a model is currently cooling down due to quota or rate limit.
   */
  public isCoolingDown(provider: string, model: string): { isCooling: boolean; entry?: QuotaCooldownEntry } {
    const key = this.getKey(provider, model);
    const entry = this.cooldowns.get(key);
    if (!entry) return { isCooling: false };

    const now = Date.now();
    if (now < entry.blockedUntilEpoch) {
      return { isCooling: true, entry };
    }

    // Cooldown expired
    this.cooldowns.delete(key);
    return { isCooling: false };
  }

  public isBlocked(provider: string, model: string): { blocked: boolean; entry?: QuotaCooldownEntry } {
    const res = this.isCoolingDown(provider, model);
    return { blocked: res.isCooling, entry: res.entry };
  }


  /**
   * Records a quota restriction and sets cooling down period.
   */
  public recordError(classification: ProviderErrorClassification): void {
    const key = this.getKey(classification.provider, classification.model);

    if (classification.errorCategory === 'DAILY_QUOTA_EXHAUSTED') {
      const duration = classification.retryAfterMs || 3600000;
      this.cooldowns.set(key, {
        provider: classification.provider,
        model: classification.model,
        metric: classification.quotaMetric,
        category: classification.errorCategory,
        blockedUntilEpoch: Date.now() + duration,
        reason: classification.userMessage.vi
      });
    } else if (
      classification.errorCategory === 'QUOTA_ZERO' ||
      classification.errorCategory === 'QUOTA_LIMIT_ZERO' ||
      classification.errorCategory === 'BILLING_RESTRICTION'
    ) {
      // Indefinite/long cooldown for 0 quota (24h) unless manually reset
      this.cooldowns.set(key, {
        provider: classification.provider,
        model: classification.model,
        category: classification.errorCategory,
        blockedUntilEpoch: Date.now() + 86400000,
        reason: classification.userMessage.vi
      });
    } else if (classification.errorCategory === 'TEMPORARY_RATE_LIMIT') {
      const duration = classification.retryAfterMs || 10000;
      this.cooldowns.set(key, {
        provider: classification.provider,
        model: classification.model,
        metric: classification.quotaMetric,
        category: classification.errorCategory,
        blockedUntilEpoch: Date.now() + duration,
        reason: classification.userMessage.vi
      });
    }
  }

  /**
   * Clear cooldown for a specific model or all models
   */
  public resetCooldown(provider?: string, model?: string): void {
    if (provider && model) {
      this.cooldowns.delete(this.getKey(provider, model));
    } else {
      this.cooldowns.clear();
    }
  }

  /**
   * Returns list of currently active cooldowns
   */
  public getActiveCooldowns(): QuotaCooldownEntry[] {
    const now = Date.now();
    const active: QuotaCooldownEntry[] = [];
    for (const [key, entry] of this.cooldowns.entries()) {
      if (now < entry.blockedUntilEpoch) {
        active.push(entry);
      } else {
        this.cooldowns.delete(key);
      }
    }
    return active;
  }
}
