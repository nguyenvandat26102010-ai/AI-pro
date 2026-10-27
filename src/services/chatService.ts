/**
 * NDAWG PRO — PART 9/9 (APEX FINAL)
 * Chat & History Management Service
 * Supports multi-turn context, attachments, resilient JSON parsing (no Unexpected token '<' crashes),
 * unified response contract, auto-titling, and localStorage persistence.
 */

import { ChatConversation, ChatMessage, ChatResponsePayload, ChatAttachment } from '../types/chat.ts';

const STORAGE_KEY_CONVERSATIONS = 'ndawg_pro_conversations_v8';
const STORAGE_KEY_ACTIVE_ID = 'ndawg_pro_active_conv_id_v8';

export class ChatService {
  private static instance: ChatService;

  private constructor() {}

  public static getInstance(): ChatService {
    if (!ChatService.instance) {
      ChatService.instance = new ChatService();
    }
    return ChatService.instance;
  }

  /**
   * Load all saved conversations from localStorage.
   * If none exists, creates and returns an initial default conversation.
   */
  public getConversations(): ChatConversation[] {
    try {
      const raw = localStorage.getItem(STORAGE_KEY_CONVERSATIONS);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed) && parsed.length > 0) {
          return parsed;
        }
      }
    } catch (e) {
      console.warn('Failed to parse conversations from localStorage:', e);
    }

    const defaultConv = this.createDefaultConversation();
    this.saveConversations([defaultConv]);
    return [defaultConv];
  }

  /**
   * Persist conversations array to localStorage.
   */
  public saveConversations(conversations: ChatConversation[]): void {
    try {
      localStorage.setItem(STORAGE_KEY_CONVERSATIONS, JSON.stringify(conversations));
    } catch (e) {
      console.error('Failed to save conversations to localStorage:', e);
    }
  }

  /**
   * Get active conversation ID from storage or return the first available conversation.
   */
  public getActiveConversationId(conversations: ChatConversation[]): string {
    const saved = localStorage.getItem(STORAGE_KEY_ACTIVE_ID);
    if (saved && conversations.some(c => c.id === saved)) {
      return saved;
    }
    const firstId = conversations[0]?.id || this.createDefaultConversation().id;
    this.setActiveConversationId(firstId);
    return firstId;
  }

  public setActiveConversationId(id: string): void {
    try {
      localStorage.setItem(STORAGE_KEY_ACTIVE_ID, id);
    } catch (e) {
      console.error('Failed to save active conversation id:', e);
    }
  }

  /**
   * Create a new blank conversation.
   */
  public createConversation(title?: string, model: string = 'gemini-3.8-flash'): ChatConversation {
    const now = Date.now();
    const newConv: ChatConversation = {
      id: `conv_${now}_${Math.random().toString(36).substring(2, 6)}`,
      title: title || 'Đoạn chat mới',
      createdAt: now,
      updatedAt: now,
      model,
      enabledPluginIds: ['math_kernel', 'web_search', 'knowledge_base'],
      messages: [],
      totalCostUsd: 0,
      totalTokens: 0
    };
    return newConv;
  }

  private createDefaultConversation(): ChatConversation {
    return {
      id: `conv_${Date.now()}_init`,
      title: 'Khởi đầu NDAWG PRO',
      createdAt: Date.now(),
      updatedAt: Date.now(),
      model: 'gemini-3.8-flash',
      enabledPluginIds: ['math_kernel', 'web_search', 'knowledge_base'],
      messages: [],
      totalCostUsd: 0,
      totalTokens: 0
    };
  }

  /**
   * Send a message to backend /api/chat with resilient error handling,
   * safe HTML-trap detection (never throws "Unexpected token '<'"),
   * multimodal attachments support, and multi-turn context preservation.
   */
  public async sendMessage(
    conversation: ChatConversation,
    messageInput: string | { text: string; attachments?: ChatAttachment[] },
    abortSignal?: AbortSignal
  ): Promise<{ conversation: ChatConversation; assistantMessage: ChatMessage }> {
    const text = typeof messageInput === 'string' ? messageInput.trim() : (messageInput.text || '').trim();
    const attachments = typeof messageInput === 'object' && messageInput.attachments ? messageInput.attachments : [];

    const userMsgId = `msg_user_${Date.now()}`;
    const userMessage: ChatMessage = {
      id: userMsgId,
      role: 'user',
      content: text,
      attachments: attachments.length > 0 ? attachments : undefined,
      timestamp: Date.now()
    };

    // Auto-generate title if this is the first message
    let updatedTitle = conversation.title;
    if (conversation.messages.length === 0 || conversation.title === 'Đoạn chat mới' || conversation.title === 'Khởi đầu NDAWG PRO') {
      updatedTitle = this.generateAutoTitle(text || (attachments[0] ? `Tệp: ${attachments[0].name}` : 'Hội thoại mới'));
    }

    const updatedMessages = [...conversation.messages, userMessage];

    // Format chat history for context (preserving up to 14 recent turns in chronological order)
    const historyPayload = updatedMessages.slice(-14, -1).map(m => ({
      role: m.role as 'user' | 'assistant',
      content: m.content
    }));

    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        signal: abortSignal,
        body: JSON.stringify({
          conversationId: conversation.id,
          message: text,
          history: historyPayload,
          model: conversation.model,
          enabledPluginIds: conversation.enabledPluginIds,
          attachments: attachments.map(a => ({
            id: a.id,
            type: a.type,
            name: a.name,
            mimeType: a.mimeType,
            data: a.data
          }))
        })
      });

      // Read raw text first to prevent JSON syntax crash on HTML 404 / SPA fallbacks
      const rawBody = await response.text();
      let data: any = null;

      const trimmedBody = rawBody.trim();
      if (trimmedBody.startsWith('<') || trimmedBody.toLowerCase().startsWith('<!doctype')) {
        // Unexpected HTML received from server/proxy
        const errorContent = `### ⚠️ [LỖI ĐỊNH DẠNG PHẢN HỒI MÁY CHỦ]

Máy chủ hoặc cổng proxy đã trả về mã HTTP **${response.status}** kèm trang HTML thay vì dữ liệu JSON API.
- **Endpoint yêu cầu:** \`POST /api/chat\`
- **Nguyên nhân khả dĩ:** API route chưa khởi chạy hoàn tất hoặc bị chặn bởi bộ định tuyến SPA.
- **Gợi ý xử lý:** Kiểm tra lại backend server và đảm bảo tiến trình Express đang hoạt động bình thường.`;

        const assistantMessage: ChatMessage = {
          id: `msg_err_${Date.now()}`,
          role: 'assistant',
          content: errorContent,
          timestamp: Date.now(),
          model: conversation.model,
          error: `HTTP ${response.status}: Máy chủ trả về HTML thay vì JSON API.`
        };

        const finalMessages = [...updatedMessages, assistantMessage];
        const updatedConv: ChatConversation = {
          ...conversation,
          title: updatedTitle,
          updatedAt: Date.now(),
          messages: finalMessages
        };

        return { conversation: updatedConv, assistantMessage };
      }

      try {
        data = JSON.parse(rawBody);
      } catch (jsonErr: any) {
        throw new Error(`Dữ liệu từ máy chủ không phải JSON hợp lệ: ${jsonErr.message}`);
      }

      // Check if backend returned an error response
      if (!response.ok || data.success === false) {
        const errMessage = data.error?.message || data.error || data.details || `Mã lỗi HTTP ${response.status}`;
        const assistantMessage: ChatMessage = {
          id: data.messageId || `msg_err_${Date.now()}`,
          role: 'assistant',
          content: data.content || data.reply || `⚠️ Lỗi xử lý từ backend: ${errMessage}`,
          timestamp: Date.now(),
          model: data.model || conversation.model,
          pluginCalls: data.pluginCalls || [],
          error: errMessage,
          classifiedError: data.classifiedError,
          diagnostic: data.error?.diagnostic
        };

        const finalMessages = [...updatedMessages, assistantMessage];
        const updatedConv: ChatConversation = {
          ...conversation,
          title: updatedTitle,
          updatedAt: Date.now(),
          messages: finalMessages
        };

        return { conversation: updatedConv, assistantMessage };
      }

      // Unified response mapping: support both data.reply and data.content
      const replyContent = data.reply || data.content || 'Đã nhận được phản hồi rỗng từ mô hình.';

      const assistantMessage: ChatMessage = {
        id: data.messageId || `msg_asst_${Date.now()}`,
        role: 'assistant',
        content: replyContent,
        timestamp: Date.now(),
        model: data.model || conversation.model,
        tokens: data.tokens,
        costUsd: data.costUsd,
        pluginCalls: data.pluginCalls || [],
        reasoningSteps: data.reasoningSteps || [],
        groundingMetadata: data.groundingMetadata
      };

      const finalMessages = [...updatedMessages, assistantMessage];
      const updatedConv: ChatConversation = {
        ...conversation,
        title: updatedTitle,
        updatedAt: Date.now(),
        messages: finalMessages,
        totalCostUsd: Number((conversation.totalCostUsd + (data.costUsd || 0)).toFixed(7)),
        totalTokens: conversation.totalTokens + (data.tokens?.totalTokens || 0)
      };

      this.saveConversations([updatedConv]);
      return { conversation: updatedConv, assistantMessage };
    } catch (err: any) {
      if (err.name === 'AbortError') {
        const cancelMsg: ChatMessage = {
          id: `msg_abort_${Date.now()}`,
          role: 'assistant',
          content: '⏹️ Phản hồi đã được dừng theo yêu cầu của người dùng.',
          timestamp: Date.now()
        };
        const finalMessages = [...updatedMessages, cancelMsg];
        const updatedConv: ChatConversation = {
          ...conversation,
          title: updatedTitle,
          updatedAt: Date.now(),
          messages: finalMessages
        };
        return { conversation: updatedConv, assistantMessage: cancelMsg };
      }

      const errorMsg: ChatMessage = {
        id: `msg_err_${Date.now()}`,
        role: 'assistant',
        content: `⚠️ Không thể nhận phản hồi từ backend: ${err.message || 'Lỗi mạng hoặc server không phản hồi'}`,
        timestamp: Date.now(),
        error: err.message
      };

      const finalMessages = [...updatedMessages, errorMsg];
      const updatedConv: ChatConversation = {
        ...conversation,
        title: updatedTitle,
        updatedAt: Date.now(),
        messages: finalMessages
      };

      return { conversation: updatedConv, assistantMessage: errorMsg };
    }
  }

  /**
   * Generate short clean title from user prompt
   */
  public generateAutoTitle(prompt: string): string {
    const clean = prompt.replace(/[#*`_~]/g, '').trim();
    if (clean.length <= 30) return clean;
    return clean.substring(0, 27).trim() + '...';
  }
}
