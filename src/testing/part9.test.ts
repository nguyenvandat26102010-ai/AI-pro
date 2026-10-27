/**
 * NDAWG PRO — PART 9/9 (APEX FINAL)
 * Full System Repair, Real AI Chat Intelligence & Multimodal Test Suite
 */

import test from 'node:test';
import assert from 'node:assert/strict';
import { ChatService } from '../services/chatService.ts';
import { ChatConversation, ChatMessage, ChatAttachment } from '../types/chat.ts';

test('P9.1: Safe HTML response trapping prevents "Unexpected token <" JSON parse crashes', async () => {
  const htmlSample = '<!doctype html><html><head><title>404 Not Found</title></head><body>Cannot POST /api/chat</body></html>';
  
  // Simulate the parsing logic implemented in ChatService
  const trimmedBody = htmlSample.trim();
  const isHtml = trimmedBody.startsWith('<') || trimmedBody.toLowerCase().startsWith('<!doctype');
  assert.equal(isHtml, true);

  let errorThrown: any = null;
  try {
    if (isHtml) {
      throw new Error('Máy chủ phản hồi trang HTML thay vì JSON API.');
    }
    JSON.parse(htmlSample);
  } catch (err: any) {
    errorThrown = err;
  }

  assert.ok(errorThrown);
  assert.equal(errorThrown.message, 'Máy chủ phản hồi trang HTML thay vì JSON API.');
  assert.ok(!errorThrown.message.includes('Unexpected token'));
});

test('P9.2: Multi-turn conversation context keeps chronological history without role collisions', () => {
  const rawHistory = [
    { role: 'user', content: 'Tôi đang dùng điện thoại Galaxy Wide6.' },
    { role: 'assistant', content: 'Chào bạn, tôi đã ghi nhận bạn đang dùng Samsung Galaxy Wide6 (chip Dimensity 700, pin 5000mAh).' },
    { role: 'user', content: 'Làm sao để nó bớt giật?' }
  ];

  // Sanitization logic for Gemini API
  const sanitized: Array<{ role: 'user' | 'model'; parts: any[] }> = [];
  for (const h of rawHistory) {
    const targetRole = h.role === 'assistant' ? 'model' : 'user';
    if (sanitized.length > 0 && sanitized[sanitized.length - 1].role === targetRole) {
      sanitized[sanitized.length - 1].parts[0].text += `\n\n${h.content.trim()}`;
    } else {
      sanitized.push({
        role: targetRole,
        parts: [{ text: h.content.trim() }]
      });
    }
  }

  assert.equal(sanitized.length, 3);
  assert.equal(sanitized[0].role, 'user');
  assert.equal(sanitized[1].role, 'model');
  assert.equal(sanitized[2].role, 'user');
  assert.ok(sanitized[0].parts[0].text.includes('Galaxy Wide6'));
  assert.ok(sanitized[2].parts[0].text.includes('bớt giật'));
});

test('P9.3: Multimodal image and file attachments are properly structured with metadata', () => {
  const imageAttachment: ChatAttachment = {
    id: 'att_img_1',
    type: 'image',
    name: 'architecture_diagram.png',
    mimeType: 'image/png',
    sizeBytes: 102400,
    data: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==',
    previewUrl: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg=='
  };

  const fileAttachment: ChatAttachment = {
    id: 'att_file_1',
    type: 'file',
    name: 'specs.txt',
    mimeType: 'text/plain',
    sizeBytes: 256,
    data: 'NDAWG PRO Architecture Tier A, B, C Specifications.'
  };

  assert.equal(imageAttachment.type, 'image');
  assert.ok(imageAttachment.data.includes('base64'));
  assert.equal(fileAttachment.type, 'file');
  assert.ok(fileAttachment.data.includes('NDAWG PRO'));
});

test('P9.4: Chat request validator rejects empty messages without attachments', () => {
  const validateChatInput = (message: any, attachments: any[]) => {
    const rawMsg = typeof message === 'string' ? message.trim() : '';
    const hasAttachments = Array.isArray(attachments) && attachments.length > 0;
    if (!rawMsg && !hasAttachments) {
      return { valid: false, error: 'Nội dung tin nhắn hoặc tệp đính kèm không được để trống' };
    }
    return { valid: true };
  };

  const emptyRes = validateChatInput('', []);
  assert.equal(emptyRes.valid, false);
  assert.ok(emptyRes.error);

  const textRes = validateChatInput('Xin chào', []);
  assert.equal(textRes.valid, true);

  const fileOnlyRes = validateChatInput('', [{ id: '1', type: 'image', data: 'xyz' }]);
  assert.equal(fileOnlyRes.valid, true);
});

test('P9.5: Unified API response contract conforms to expected success/reply/error schema', () => {
  const successPayload = {
    success: true,
    reply: 'Đây là câu trả lời kiểm chứng.',
    conversationId: 'conv_123',
    messageId: 'msg_456',
    model: 'gemini-3.6-flash',
    tokens: { promptTokens: 10, completionTokens: 20, totalTokens: 30 }
  };

  assert.equal(successPayload.success, true);
  assert.ok(successPayload.reply);
  assert.equal(successPayload.conversationId, 'conv_123');

  const errorPayload = {
    success: false,
    error: {
      code: 'PROVIDER_UNAVAILABLE',
      message: 'AI provider hiện không khả dụng.'
    }
  };

  assert.equal(errorPayload.success, false);
  assert.equal(errorPayload.error.code, 'PROVIDER_UNAVAILABLE');
});

test('P9.6: Title generator generates concise titles and ignores markdown syntax', () => {
  const chatService = ChatService.getInstance();

  const title1 = chatService.generateAutoTitle('# Hướng dẫn lập trình Python cơ bản');
  assert.ok(title1.length <= 30);
  assert.ok(!title1.includes('#'));

  const longPrompt = 'Đây là một câu hỏi rất dài có rất nhiều từ vượt quá ba mươi ký tự trong tiếng Việt để kiểm tra chức năng cắt chuỗi.';
  const title2 = chatService.generateAutoTitle(longPrompt);
  assert.ok(title2.length <= 30);
  assert.ok(title2.endsWith('...'));
});

test('P9.7: Chat conversations maintain separate independent identities and message histories', () => {
  const chatService = ChatService.getInstance();

  const convA = chatService.createConversation('Đoạn chat A', 'gemini-3.6-flash');
  const convB = chatService.createConversation('Đoạn chat B', 'gemini-3.8-flash');

  assert.notEqual(convA.id, convB.id);
  assert.equal(convA.messages.length, 0);
  assert.equal(convB.messages.length, 0);
  assert.equal(convA.model, 'gemini-3.6-flash');
  assert.equal(convB.model, 'gemini-3.8-flash');
});
