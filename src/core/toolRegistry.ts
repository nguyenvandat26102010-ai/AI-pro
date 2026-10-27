/**
 * NDAWG PRO — PART 6/8
 * Tool Registry (4 Permission Tiers & Granular Safety Controls)
 *
 * Implements strict 4-tier permission enforcement, human confirmation gating,
 * instantaneous kill-switches, and defense against prohibited actions.
 */

import {
  ToolDefinition,
  ToolExecutionRequest,
  ToolExecutionResponse,
  ToolPermissionTier
} from './types.ts';

export class ToolRegistry {
  private tools: Map<string, ToolDefinition> = new Map();
  private auditAlerts: Array<{ timestamp: number; toolId: string; reason: string; actorId: string }> = [];

  constructor() {
    this.registerDefaultTools();
  }

  private registerDefaultTools() {
    // Tier 1: Read-only
    this.registerTool({
      id: 'read_docs',
      name: 'Tra cứu tài liệu',
      description: 'Đọc tài liệu và thông số kỹ thuật nội bộ',
      tier: 'TIER_1_READ',
      category: 'READ',
      isReversible: true,
      requiresUserConfirmation: false,
      enabled: true
    });
    this.registerTool({
      id: 'query_knowledge',
      name: 'Truy vấn tri thức',
      description: 'Tìm kiếm trên Verified Knowledge Base',
      tier: 'TIER_1_READ',
      category: 'READ',
      isReversible: true,
      requiresUserConfirmation: false,
      enabled: true
    });
    this.registerTool({
      id: 'calculator',
      name: 'Kernel số học',
      description: 'Thực hiện phép tính toán học xác định',
      tier: 'TIER_1_READ',
      category: 'READ',
      isReversible: true,
      requiresUserConfirmation: false,
      enabled: true
    });

    // Tier 2: Reversible write
    this.registerTool({
      id: 'save_workspace_draft',
      name: 'Lưu bản thảo',
      description: 'Lưu bản thảo văn bản hoặc code có khả năng undo',
      tier: 'TIER_2_REVERSIBLE_WRITE',
      category: 'WRITE',
      isReversible: true,
      requiresUserConfirmation: false,
      enabled: true
    });
    this.registerTool({
      id: 'update_user_preference',
      name: 'Cập nhật tùy chọn ngôn ngữ/giao diện',
      description: 'Lưu cấu hình giao diện cá nhân có lịch sử rollback',
      tier: 'TIER_2_REVERSIBLE_WRITE',
      category: 'WRITE',
      isReversible: true,
      requiresUserConfirmation: false,
      enabled: true
    });

    // Tier 3: Sensitive requiring human confirmation
    this.registerTool({
      id: 'delete_dataset_record',
      name: 'Xóa bản ghi dữ liệu',
      description: 'Xóa vĩnh viễn bản ghi hoặc tệp tin khỏi hệ thống lưu trữ',
      tier: 'TIER_3_SENSITIVE_CONFIRMATION',
      category: 'WRITE',
      isReversible: false,
      requiresUserConfirmation: true,
      enabled: true
    });
    this.registerTool({
      id: 'execute_terminal_command',
      name: 'Chạy lệnh shell máy chủ',
      description: 'Thực thi lệnh shell sandbox trên máy chủ backend',
      tier: 'TIER_3_SENSITIVE_CONFIRMATION',
      category: 'SYSTEM',
      isReversible: false,
      requiresUserConfirmation: true,
      enabled: true
    });
    this.registerTool({
      id: 'export_unredacted_data',
      name: 'Xuất dữ liệu nguyên bản',
      description: 'Xuất dữ liệu chưa qua bộ lọc che giấu thông tin nhạy cảm',
      tier: 'TIER_3_SENSITIVE_CONFIRMATION',
      category: 'SECURITY',
      isReversible: false,
      requiresUserConfirmation: true,
      enabled: true
    });

    // Tier 4: Prohibited (Always blocked)
    this.registerTool({
      id: 'read_system_prompt',
      name: 'Đọc System Prompt mật',
      description: 'Hành vi cố ý trích xuất prompt định hướng hệ thống',
      tier: 'TIER_4_PROHIBITED',
      category: 'SECURITY',
      isReversible: false,
      requiresUserConfirmation: false,
      enabled: false
    });
    this.registerTool({
      id: 'dump_api_keys',
      name: 'Trích xuất API Key',
      description: 'Cố ý hiển thị hoặc xuất API key bí mật ra ngoài',
      tier: 'TIER_4_PROHIBITED',
      category: 'SECURITY',
      isReversible: false,
      requiresUserConfirmation: false,
      enabled: false
    });
    this.registerTool({
      id: 'bypass_governor_budget',
      name: 'Vượt hạn mức ngân sách',
      description: 'Thao túng mã nguồn để bỏ qua kiểm tra Limits Governor',
      tier: 'TIER_4_PROHIBITED',
      category: 'SECURITY',
      isReversible: false,
      requiresUserConfirmation: false,
      enabled: false
    });
  }

  public registerTool(tool: ToolDefinition) {
    this.tools.set(tool.id, tool);
  }

  public getTool(toolId: string): ToolDefinition | undefined {
    return this.tools.get(toolId);
  }

  public listTools(): ToolDefinition[] {
    return Array.from(this.tools.values());
  }

  public setToolEnabled(toolId: string, enabled: boolean): boolean {
    const tool = this.tools.get(toolId);
    if (!tool) return false;
    tool.enabled = enabled;
    return true;
  }

  /**
   * Execute or gate a tool based on 4-tier permission policy
   */
  public executeTool(request: ToolExecutionRequest): ToolExecutionResponse {
    const tool = this.tools.get(request.toolId);

    if (!tool) {
      return {
        toolId: request.toolId,
        allowed: false,
        executed: false,
        tier: 'TIER_1_READ',
        error: `Công cụ "${request.toolId}" không tồn tại trong Registry.`
      };
    }

    // Tier 4: Prohibited - Strictly blocked always, triggers high-severity audit alert
    if (tool.tier === 'TIER_4_PROHIBITED') {
      this.auditAlerts.push({
        timestamp: Date.now(),
        toolId: tool.id,
        reason: 'Attempted execution of Tier 4 Prohibited Tool',
        actorId: request.actorId
      });
      return {
        toolId: tool.id,
        allowed: false,
        executed: false,
        tier: 'TIER_4_PROHIBITED',
        error: `BỊ CẤM TUYỆT ĐỐI (TIER 4): Thao tác "${tool.name}" vi phạm chính sách an toàn bảo mật cốt lõi.`
      };
    }

    // Check Kill-Switch
    if (!tool.enabled) {
      return {
        toolId: tool.id,
        allowed: false,
        executed: false,
        tier: tool.tier,
        error: `Công cụ "${tool.name}" đang bị vô hiệu hóa bởi Kill-Switch.`
      };
    }

    // Tier 3: Sensitive - Requires explicit human confirmation
    if (tool.tier === 'TIER_3_SENSITIVE_CONFIRMATION') {
      if (!request.userConfirmed) {
        return {
          toolId: tool.id,
          allowed: false,
          executed: false,
          tier: 'TIER_3_SENSITIVE_CONFIRMATION',
          requiresConfirmationPrompt: true,
          error: `YÊU CẦU XÁC NHẬN (TIER 3): Thao tác "${tool.name}" tiềm ẩn rủi ro phá hủy hoặc rò rỉ dữ liệu. Bắt buộc người dùng nhấn xác nhận trước khi chạy.`
        };
      }
    }

    // Tier 1 & Tier 2: Safe execution (or Tier 3 once confirmed)
    let executionOutput: unknown = null;
    if (tool.id === 'calculator') {
      const expr = (request.params.expression as string) || '1 + 1';
      try {
        const sanitized = expr.replace(/[^\d\+\-\*\/\.\s\(\)]/g, '');
        // eslint-disable-next-line no-eval
        const val = Function(`'use strict'; return (${sanitized})`)();
        executionOutput = { expression: expr, result: val };
      } catch {
        executionOutput = { expression: expr, result: 'Math error' };
      }
    } else if (tool.id === 'read_docs') {
      executionOutput = { content: 'Tài liệu kiến trúc AI Core NDAWG PRO v3: Phiên bản chuẩn hóa 13 Contracts.' };
    } else if (tool.id === 'save_workspace_draft') {
      executionOutput = { draftId: `draft_${Date.now()}`, savedBytes: 1024, rollbackAvailable: true };
    } else {
      executionOutput = { message: `Đã thực thi thành công thao tác "${tool.name}".`, payload: request.params };
    }

    return {
      toolId: tool.id,
      allowed: true,
      executed: true,
      tier: tool.tier,
      result: executionOutput
    };
  }

  public getAuditAlerts() {
    return [...this.auditAlerts];
  }
}
