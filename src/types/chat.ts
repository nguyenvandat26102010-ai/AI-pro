/**
 * NDAWG PRO — PART 7/8 (UNIFIED FINAL V2)
 * Chat, History, Plugin & Admin Session Type Definitions
 */

export interface ChatAttachment {
  id: string;
  type: 'image' | 'file';
  name: string;
  mimeType: string;
  sizeBytes: number;
  data: string; // base64 or text content
  previewUrl?: string;
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: number;
  model?: string;
  tokens?: {
    promptTokens: number;
    completionTokens: number;
    totalTokens: number;
  };
  costUsd?: number;
  pluginCalls?: Array<{
    pluginId: string;
    pluginName: string;
    input: any;
    output: any;
    durationMs: number;
    status: 'success' | 'failed';
  }>;
  reasoningSteps?: string[];
  attachments?: ChatAttachment[];
  isStreaming?: boolean;
  error?: string;
  classifiedError?: any;
  diagnostic?: any;
  groundingMetadata?: any;
}

export interface ChatConversation {
  id: string;
  title: string;
  createdAt: number;
  updatedAt: number;
  model: string;
  systemInstruction?: string;
  enabledPluginIds: string[];
  messages: ChatMessage[];
  totalCostUsd: number;
  totalTokens: number;
}

export interface PluginDefinition {
  id: string;
  name: string;
  description: string;
  version: string;
  tier: 'TIER_1_READ' | 'TIER_2_EXECUTION' | 'TIER_3_IRREVERSIBLE';
  enabled: boolean;
  iconName: string;
  parameters: {
    name: string;
    type: string;
    description: string;
    required: boolean;
  }[];
}

export interface AdminSession {
  isAuthenticated: boolean;
  token: string | null;
  role: 'ADMIN' | 'ANALYST' | 'VIEWER';
  loginTime: number | null;
  expiresAt: number | null;
}

export interface ChatRequestPayload {
  conversationId: string;
  message: string;
  history: Array<{ role: 'user' | 'assistant'; content: string }>;
  model: string;
  enabledPluginIds: string[];
  attachments?: ChatAttachment[];
  systemInstruction?: string;
}

export type ConnectionState =
  | 'SERVER_READY'
  | 'CHAT_API_ROUTE_READY'
  | 'GEMINI_SECRET_CONFIGURED'
  | 'GEMINI_AUTH_VERIFIED'
  | 'GEMINI_LIVE_REQUEST_VERIFIED'
  | 'MODEL_UNAVAILABLE'
  | 'QUOTA_BLOCKED'
  | 'NOT_CONFIGURED'
  | 'NETWORK_ERROR'
  | 'INTERNAL_ERROR';

export interface ChatResponsePayload {
  success?: boolean;
  reply?: string;
  conversationId: string;
  messageId: string;
  content: string;
  model: string;
  connectionState?: ConnectionState;
  providerStatus: 'LIVE_API' | 'AWAITING_API_KEY' | 'ERROR' | ConnectionState;
  providerMessage?: string;
  tokens: {
    promptTokens: number;
    completionTokens: number;
    totalTokens: number;
  };
  costUsd: number;
  pluginCalls: Array<{
    pluginId: string;
    pluginName: string;
    input: any;
    output: any;
    durationMs: number;
    status: 'success' | 'failed';
  }>;
  reasoningSteps?: string[];
  error?: {
    code: string;
    message: string;
    details?: any;
  };
}
