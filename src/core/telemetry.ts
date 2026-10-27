/**
 * NDAWG PRO — PART 10/10 (APEX INFINITY FINAL MASTER)
 * Append-Safe Telemetry, Redaction & Circuit Breaker Engine (Directives 10.5 & 10.8)
 */

export interface TelemetryEvent {
  id: string;
  timestamp: string;
  epochMs: number;
  type: 'CHAT_REQUEST' | 'PLUGIN_EXEC' | 'CIRCUIT_BREAKER' | 'SECURITY_EVENT' | 'GATE_AUDIT' | 'STT_EVENT';
  model?: string;
  status: 'SUCCESS' | 'FAILURE' | 'CIRCUIT_OPEN' | 'FALLBACK';
  durationMs: number;
  details: string;
}

export type CircuitBreakerState = 'CLOSED' | 'OPEN' | 'HALF_OPEN';

export interface CircuitBreakerStatus {
  state: CircuitBreakerState;
  consecutiveFailures: number;
  failureThreshold: number;
  lastFailureTime?: number;
  cooldownPeriodMs: number;
  totalTrippedCount: number;
}

/**
 * Secret redaction: scrubs API keys, auth bearer tokens, and passwords from logs/telemetry.
 */
export function redactSecrets(text: string): string {
  if (!text || typeof text !== 'string') return '';
  return text
    .replace(/(?:AIza[0-9A-Za-z-_]{10,})/g, '[REDACTED_GEMINI_KEY]')
    .replace(/(?:sk-[a-zA-Z0-9]{10,})/g, '[REDACTED_API_KEY]')
    .replace(/(?:Bearer\s+)[A-Za-z0-9-_.]+/gi, 'Bearer [REDACTED_TOKEN]')
    .replace(/(?:password['"]?\s*[:=]\s*['"])([^'"]+)(['"])/gi, 'password: "[REDACTED_PASSWORD]"')
    .replace(/(?:ADMIN_PASSWORD\s*=\s*)([^\s]+)/gi, 'ADMIN_PASSWORD=[REDACTED]');
}

export class CircuitBreaker {
  private state: CircuitBreakerState = 'CLOSED';
  private consecutiveFailures = 0;
  private readonly failureThreshold = 3;
  private readonly cooldownPeriodMs = 20000; // 20s cooldown
  private lastFailureTime = 0;
  private totalTrippedCount = 0;

  public canExecute(): boolean {
    if (this.state === 'CLOSED') return true;

    const now = Date.now();
    if (this.state === 'OPEN') {
      if (now - this.lastFailureTime > this.cooldownPeriodMs) {
        this.state = 'HALF_OPEN';
        return true;
      }
      return false; // Fast fail without calling failing upstream
    }

    if (this.state === 'HALF_OPEN') {
      return true; // Probe attempt
    }

    return true;
  }

  public recordSuccess(): void {
    this.consecutiveFailures = 0;
    this.state = 'CLOSED';
  }

  public recordFailure(): CircuitBreakerState {
    this.consecutiveFailures++;
    this.lastFailureTime = Date.now();

    if (this.consecutiveFailures >= this.failureThreshold) {
      this.state = 'OPEN';
      this.totalTrippedCount++;
    }

    return this.state;
  }

  public getStatus(): CircuitBreakerStatus {
    // Check if cooldown elapsed
    if (this.state === 'OPEN' && Date.now() - this.lastFailureTime > this.cooldownPeriodMs) {
      this.state = 'HALF_OPEN';
    }

    return {
      state: this.state,
      consecutiveFailures: this.consecutiveFailures,
      failureThreshold: this.failureThreshold,
      lastFailureTime: this.lastFailureTime || undefined,
      cooldownPeriodMs: this.cooldownPeriodMs,
      totalTrippedCount: this.totalTrippedCount
    };
  }

  public reset(): void {
    this.state = 'CLOSED';
    this.consecutiveFailures = 0;
    this.lastFailureTime = 0;
  }
}

export class AppendSafeTelemetryStore {
  private events: TelemetryEvent[] = [];
  private readonly maxEntries = 500;

  public logEvent(event: Omit<TelemetryEvent, 'id' | 'timestamp' | 'epochMs' | 'details'> & { details: string }): TelemetryEvent {
    const epochMs = Date.now();
    const entry: TelemetryEvent = {
      ...event,
      id: `tel_${epochMs}_${Math.random().toString(36).substring(2, 6)}`,
      timestamp: new Date(epochMs).toISOString(),
      epochMs,
      details: redactSecrets(event.details)
    };

    this.events.unshift(entry);
    if (this.events.length > this.maxEntries) {
      this.events.pop();
    }
    return entry;
  }

  public getRecentEvents(limit = 50): TelemetryEvent[] {
    return this.events.slice(0, limit);
  }

  public clear(): void {
    this.events = [];
  }
}
