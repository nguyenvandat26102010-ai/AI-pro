import React, { useState } from 'react';
import {
  Cpu,
  Layers,
  Zap,
  ShieldCheck,
  DollarSign,
  Play,
  RotateCcw,
  CheckCircle2,
  AlertTriangle,
  Lock,
  Eye,
  SlidersHorizontal,
  Flame,
  FileCode2
} from 'lucide-react';
import { AiCoreService } from '../core/aiCoreService.ts';
import { SupportedModality, TaskRoutingRequest, TaskRoutingDecision } from '../core/types.ts';
import { UserRole } from '../governance/types.ts';

interface AiCoreViewProps {
  aiCore: AiCoreService;
  role: UserRole;
}

export const AiCoreView: React.FC<AiCoreViewProps> = ({ aiCore, role }) => {
  const models = aiCore.listModelCapabilities();
  const tools = aiCore.toolRegistry.listTools();
  const usage = aiCore.getUsageAndCost();

  // Task Router Sandbox State
  const [taskType, setTaskType] = useState<'text' | 'code' | 'image' | 'audio' | 'reasoning'>('reasoning');
  const [complexity, setComplexity] = useState<'simple' | 'medium' | 'complex'>('complex');
  const [priority, setPriority] = useState<'low' | 'normal' | 'high'>('high');
  const [selectedModalities, setSelectedModalities] = useState<SupportedModality[]>(['text', 'code']);
  const [routingDecision, setRoutingDecision] = useState<TaskRoutingDecision | null>(null);

  // Tool Registry Test State
  const [selectedToolId, setSelectedToolId] = useState<string>('read_docs');
  const [userConfirmCheck, setUserConfirmCheck] = useState<boolean>(false);
  const [toolResultMsg, setToolResultMsg] = useState<string | null>(null);

  const handleTestRoute = () => {
    const req: TaskRoutingRequest = {
      taskId: `test_route_${Date.now()}`,
      taskType,
      priority,
      requiredModalities: selectedModalities,
      estimatedComplexity: complexity
    };
    const decision = aiCore.routeTask(req);
    setRoutingDecision(decision);
  };

  const toggleModality = (mod: SupportedModality) => {
    if (selectedModalities.includes(mod)) {
      setSelectedModalities(selectedModalities.filter((m) => m !== mod));
    } else {
      setSelectedModalities([...selectedModalities, mod]);
    }
  };

  const handleExecuteTool = () => {
    const res = aiCore.toolRegistry.executeTool({
      toolId: selectedToolId,
      params: { sampleArg: 'test_value' },
      actorId: 'operator_01',
      actorRole: role,
      userConfirmed: userConfirmCheck
    });

    if (res.allowed && res.executed) {
      setToolResultMsg(`Thực thi thành công [${res.tier}]: ${JSON.stringify(res.result)}`);
    } else {
      setToolResultMsg(`Từ chối / Chặn [${res.tier}]: ${res.error}`);
    }
  };

  const handleToggleToolKillSwitch = (toolId: string, currentEnabled: boolean) => {
    aiCore.toolRegistry.setToolEnabled(toolId, !currentEnabled);
    setToolResultMsg(`Đã ${!currentEnabled ? 'kích hoạt' : 'vô hiệu hóa'} công cụ ${toolId} qua Kill-Switch.`);
  };

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 shadow-xl">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-cyan-950 border border-cyan-800 flex items-center justify-center text-cyan-400">
              <Cpu className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl font-bold text-white tracking-tight">AI Core &amp; 13 Shared Service Contracts</h1>
                <span className="text-xs px-2.5 py-0.5 rounded-full font-mono bg-cyan-950 text-cyan-300 border border-cyan-800">
                  Tầng A — Ứng Dụng Làm Thật
                </span>
              </div>
              <p className="text-sm text-slate-400 mt-1">
                Lớp điều phối trung tâm chuẩn hóa: Model Registry, Modality Gate, Routing Logic, 4-Tier Tool Safety &amp; Usage Governor.
              </p>
            </div>
          </div>

          {/* Quick Metrics */}
          <div className="flex items-center gap-3 bg-slate-950 p-2.5 rounded-lg border border-slate-800 text-xs font-mono">
            <div>
              <span className="text-slate-500 block">DAILY SPEND</span>
              <span className="text-emerald-400 font-bold">${usage.dailySpendUsd.toFixed(4)}</span>
            </div>
            <div className="h-6 w-px bg-slate-800" />
            <div>
              <span className="text-slate-500 block">REMAINING BUDGET</span>
              <span className="text-cyan-400 font-bold">${usage.remainingBudgetUsd.toFixed(4)}</span>
            </div>
            <div className="h-6 w-px bg-slate-800" />
            <div>
              <span className="text-slate-500 block">CIRCUIT BREAKER</span>
              <span className={usage.circuitBreakerTripped ? 'text-rose-400 font-bold' : 'text-emerald-400 font-bold'}>
                {usage.circuitBreakerTripped ? 'TRIPPED' : 'ARMED'}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* 13 Shared Contracts Overview Grid */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-5">
        <h2 className="text-sm font-semibold text-slate-200 uppercase tracking-wider mb-3 flex items-center gap-2">
          <Layers className="w-4 h-4 text-cyan-400" />
          13 Shared Logic Service Contracts (Kế thừa cho Part 7 &amp; Part 8)
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5 text-xs">
          {[
            { num: 1, name: 'getModelCapabilities', desc: 'Đọc thông số & modalities mô hình', target: 'Part 6/7' },
            { num: 2, name: 'routeTask', desc: 'Định tuyến thông minh & Modality Gate', target: 'Part 6/7' },
            { num: 3, name: 'executeTask', desc: 'Thực thi tác vụ có giám sát ngân sách', target: 'Part 6/7' },
            { num: 4, name: 'verifyResult', desc: 'Kiểm chứng độc lập kết quả đầu ra', target: 'Part 7' },
            { num: 5, name: 'searchKnowledge', desc: 'Tìm kiếm Verified Knowledge theo Badge', target: 'Part 7' },
            { num: 6, name: 'ingestKnowledge', desc: 'Nạp tri thức qua Ingestion Gate', target: 'Part 7' },
            { num: 7, name: 'getUsageAndCost', desc: 'Báo cáo chi phí & chốt chặn an toàn', target: 'Part 7/8' },
            { num: 8, name: 'getUserPreferences', desc: 'Độc lập ngôn ngữ UI / Model / Voice', target: 'Part 8' },
            { num: 9, name: 'transcribeAudio', desc: 'STT qua Modality Gate minh bạch', target: 'Part 8' },
            { num: 10, name: 'generateSpeech', desc: 'TTS tổng hợp giọng nói đa ngôn ngữ', target: 'Part 8' },
            { num: 11, name: 'exportResult', desc: 'Xuất kết quả JSON, Markdown, CSV', target: 'Part 7' },
            { num: 12, name: 'createShareArtifact', desc: 'Che giấu API keys & PII khi chia sẻ', target: 'Part 7' },
            { num: 13, name: 'recordFeedback', desc: 'Ghi nhận phản hồi và đánh giá người dùng', target: 'Part 7' }
          ].map((c) => (
            <div key={c.num} className="bg-slate-950 p-2.5 rounded-lg border border-slate-800 flex items-start gap-2.5">
              <span className="w-5 h-5 rounded-full bg-cyan-950 text-cyan-400 border border-cyan-800 flex items-center justify-center font-mono font-bold shrink-0 text-[10px]">
                {c.num}
              </span>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between">
                  <span className="font-mono font-bold text-slate-200 truncate">{c.name}</span>
                  <span className="text-[10px] text-cyan-400 bg-cyan-950/60 px-1 rounded border border-cyan-800/40">
                    {c.target}
                  </span>
                </div>
                <p className="text-slate-400 text-[11px] mt-0.5">{c.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Modality Gate & Model Router Tester */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-slate-200 flex items-center gap-2">
              <Zap className="w-4 h-4 text-amber-400" />
              Contract 2: Modality Gate &amp; Model Router Tester
            </h3>
            <button
              onClick={handleTestRoute}
              className="px-3 py-1 bg-cyan-600 hover:bg-cyan-500 text-white rounded-lg text-xs font-medium flex items-center gap-1.5 transition-colors"
            >
              <Play className="w-3.5 h-3.5" />
              Định tuyến thử
            </button>
          </div>

          <div className="grid grid-cols-3 gap-3 text-xs">
            <div>
              <label className="text-slate-400 block mb-1">Loại tác vụ</label>
              <select
                value={taskType}
                onChange={(e) => setTaskType(e.target.value as any)}
                className="w-full bg-slate-950 border border-slate-800 rounded p-1.5 text-slate-200"
              >
                <option value="reasoning">Suy luận (reasoning)</option>
                <option value="text">Văn bản (text)</option>
                <option value="code">Lập trình (code)</option>
                <option value="image">Hình ảnh (image)</option>
                <option value="audio">Âm thanh (audio)</option>
              </select>
            </div>
            <div>
              <label className="text-slate-400 block mb-1">Độ phức tạp</label>
              <select
                value={complexity}
                onChange={(e) => setComplexity(e.target.value as any)}
                className="w-full bg-slate-950 border border-slate-800 rounded p-1.5 text-slate-200"
              >
                <option value="simple">Đơn giản (simple)</option>
                <option value="medium">Trung bình (medium)</option>
                <option value="complex">Phức tạp (complex)</option>
              </select>
            </div>
            <div>
              <label className="text-slate-400 block mb-1">Mức ưu tiên</label>
              <select
                value={priority}
                onChange={(e) => setPriority(e.target.value as any)}
                className="w-full bg-slate-950 border border-slate-800 rounded p-1.5 text-slate-200"
              >
                <option value="low">Thấp (low)</option>
                <option value="normal">Bình thường (normal)</option>
                <option value="high">Cao (high)</option>
              </select>
            </div>
          </div>

          <div>
            <label className="text-xs text-slate-400 block mb-1.5">
              Yêu cầu Modalities (Kiểm thử Modality Gate)
            </label>
            <div className="flex flex-wrap gap-1.5">
              {(['text', 'image', 'audio_stt', 'audio_tts', 'code', 'video'] as SupportedModality[]).map((mod) => {
                const active = selectedModalities.includes(mod);
                return (
                  <button
                    key={mod}
                    onClick={() => toggleModality(mod)}
                    className={`px-2 py-1 rounded text-xs font-mono transition-colors ${
                      active
                        ? 'bg-indigo-600 text-white border border-indigo-400'
                        : 'bg-slate-950 text-slate-400 border border-slate-800 hover:border-slate-700'
                    }`}
                  >
                    {active ? '✓ ' : '+ '}
                    {mod}
                  </button>
                );
              })}
            </div>
          </div>

          {routingDecision && (
            <div
              className={`p-3 rounded-lg border text-xs font-mono space-y-1.5 ${
                routingDecision.modalityGateApproved
                  ? 'bg-slate-950 border-emerald-900/60 text-slate-200'
                  : 'bg-rose-950/40 border-rose-800 text-rose-200'
              }`}
            >
              <div className="flex items-center justify-between font-bold">
                <span>Trạng thái Modality Gate:</span>
                <span className={routingDecision.modalityGateApproved ? 'text-emerald-400' : 'text-rose-400'}>
                  {routingDecision.modalityGateApproved ? 'PASSED (ĐƯỢC CHẤP THUẬN)' : 'BLOCKED (BỊ CHẶN)'}
                </span>
              </div>
              <div>Mô hình chính: <span className="text-cyan-300 font-bold">{routingDecision.selectedModel}</span></div>
              <div>Mô hình dự phòng: <span className="text-slate-400">{routingDecision.fallbackModel}</span></div>
              <div>Dự tính chi phí: <span className="text-emerald-400">${routingDecision.estimatedCostUsd}</span></div>
              <p className="text-[11px] text-slate-400 pt-1 border-t border-slate-800/80">{routingDecision.routingReason}</p>
            </div>
          )}

          {/* Model Registry List */}
          <div className="pt-2">
            <span className="text-xs font-semibold text-slate-400 block mb-2">Model Capability Registry</span>
            <div className="space-y-1.5 max-h-48 overflow-y-auto pr-1">
              {models.map((m) => (
                <div key={m.modelId} className="p-2 rounded bg-slate-950 border border-slate-800 text-xs flex items-center justify-between">
                  <div>
                    <span className="font-mono font-bold text-slate-200">{m.modelId}</span>
                    <span className="text-slate-500 text-[11px] ml-2">({m.provider})</span>
                    <div className="flex gap-1 mt-1">
                      {m.supportedModalities.map((s) => (
                        <span key={s} className="text-[10px] bg-slate-800 text-slate-300 px-1 py-0.2 rounded font-mono">
                          {s}
                        </span>
                      ))}
                    </div>
                  </div>
                  <div className="text-right">
                    <span
                      className={`text-[10px] px-1.5 py-0.5 rounded font-mono ${
                        m.status === 'Implemented and tested'
                          ? 'bg-emerald-950 text-emerald-300 border border-emerald-800'
                          : 'bg-amber-950 text-amber-300 border border-amber-800'
                      }`}
                    >
                      {m.status === 'Implemented and tested' ? 'TESTED' : 'AWAITING KEY'}
                    </span>
                    <div className="text-[10px] text-slate-500 mt-1">${m.costPer1kInputTokens * 1000}/1M tok</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* 4-Tier Tool Safety Registry & Kill-Switches */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-slate-200 flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-emerald-400" />
              Tool Safety Registry (4 Permission Tiers)
            </h3>
            <span className="text-xs text-slate-400 font-mono">
              Vai trò: <strong className="text-cyan-400">{role}</strong>
            </span>
          </div>

          <div className="space-y-2 text-xs">
            <label className="text-slate-400 block">Chọn công cụ để thử nghiệm:</label>
            <select
              value={selectedToolId}
              onChange={(e) => setSelectedToolId(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded p-2 text-slate-200 font-mono"
            >
              {tools.map((t) => (
                <option key={t.id} value={t.id}>
                  [{t.tier.replace('TIER_', 'T')}] {t.name} ({t.id})
                </option>
              ))}
            </select>
          </div>

          {/* User Confirmation Checkbox for Tier 3 */}
          <div className="p-3 bg-slate-950 rounded-lg border border-slate-800 flex items-center justify-between">
            <label className="flex items-center gap-2 text-xs text-slate-300 cursor-pointer">
              <input
                type="checkbox"
                checked={userConfirmCheck}
                onChange={(e) => setUserConfirmCheck(e.target.checked)}
                className="w-4 h-4 rounded text-cyan-600 bg-slate-900 border-slate-700"
              />
              <span>Xác nhận người dùng (Human Confirmation Token) cho Tier 3</span>
            </label>
            <button
              onClick={handleExecuteTool}
              className="px-3 py-1 bg-indigo-600 hover:bg-indigo-500 text-white rounded text-xs font-medium"
            >
              Chạy công cụ
            </button>
          </div>

          {toolResultMsg && (
            <div className="p-3 rounded-lg bg-slate-950 border border-slate-800 text-xs font-mono text-slate-300">
              {toolResultMsg}
            </div>
          )}

          {/* Tool List with Tiers & Kill Switches */}
          <div className="space-y-1.5 max-h-56 overflow-y-auto pr-1">
            {tools.map((tool) => {
              const tierBadge =
                tool.tier === 'TIER_1_READ'
                  ? 'bg-emerald-950 text-emerald-400 border-emerald-800'
                  : tool.tier === 'TIER_2_REVERSIBLE_WRITE'
                  ? 'bg-cyan-950 text-cyan-400 border-cyan-800'
                  : tool.tier === 'TIER_3_SENSITIVE_CONFIRMATION'
                  ? 'bg-amber-950 text-amber-400 border-amber-800'
                  : 'bg-rose-950 text-rose-400 border-rose-800';

              return (
                <div
                  key={tool.id}
                  className="p-2 rounded bg-slate-950 border border-slate-800 flex items-center justify-between text-xs"
                >
                  <div className="flex-1 pr-2">
                    <div className="flex items-center gap-2">
                      <span className="font-mono font-bold text-slate-200">{tool.name}</span>
                      <span className={`text-[10px] font-mono px-1.5 py-0.2 rounded border ${tierBadge}`}>
                        {tool.tier.replace('TIER_', '')}
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-400 mt-0.5">{tool.description}</p>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <button
                      onClick={() => handleToggleToolKillSwitch(tool.id, tool.enabled)}
                      className={`px-2 py-0.5 rounded text-[10px] font-mono border transition-colors ${
                        tool.enabled
                          ? 'bg-emerald-950/60 text-emerald-400 border-emerald-800 hover:bg-rose-950 hover:text-rose-400'
                          : 'bg-rose-950 text-rose-300 border-rose-800'
                      }`}
                    >
                      {tool.enabled ? 'ACTIVE' : 'KILLED'}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};
