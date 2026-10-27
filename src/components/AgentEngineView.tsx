import React, { useState } from 'react';
import {
  Zap,
  Play,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  RotateCcw,
  StopCircle,
  ShieldAlert,
  GitBranch,
  Key,
  Layers,
  UserCheck
} from 'lucide-react';
import {
  ReliableAgentEngine,
  AgentTask,
  AgentStep,
  AgentCheckpoint
} from '../modules/agentEngine.ts';
import { ExecutionContext } from '../governance/types.ts';

interface AgentEngineViewProps {
  agentEngine: ReliableAgentEngine;
}

export const AgentEngineView: React.FC<AgentEngineViewProps> = ({ agentEngine }) => {
  const [task, setTask] = useState<AgentTask | null>(() => {
    const existing = agentEngine.getTask('task_demo_01');
    if (existing) return existing;
    agentEngine.createPlan('task_demo_01', 'Tự Động Hóa Kiểm Định Mã & Thu Thập Tri Thức', [
      {
        name: 'Bước 1: Quét Bản Đồ Repo & Sensitive Zones',
        type: 'TOOL_CALL',
        input: { targetDir: 'src/' },
        completionCriteria: 'Xác định đầy đủ các file nhạy cảm và entry points',
        idempotencyKey: 'idem_scan_repo_01'
      },
      {
        name: 'Bước 2: Đối Chiếu Điều Khoản Nhà Cung Cấp',
        type: 'MODEL_CALL',
        input: { provider: 'Google AI', model: 'gemini-2.5-flash' },
        completionCriteria: 'Xác nhận train_on_output = DENY và quyền lưu trữ',
        idempotencyKey: 'idem_check_terms_02'
      },
      {
        name: 'Bước 3: Tổng Hợp Báo Cáo Tri Thức Kiểm Chứng',
        type: 'TOOL_CALL',
        input: { format: 'markdown' },
        completionCriteria: 'Tạo tài liệu báo cáo kèm mã hash SHA-256',
        idempotencyKey: 'idem_gen_report_03'
      }
    ]);
    return agentEngine.getTask('task_demo_01');
  });

  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [infoMessage, setInfoMessage] = useState<string | null>(null);
  const [isExecuting, setIsExecuting] = useState<boolean>(false);

  const refreshState = () => {
    if (task) {
      setTask(agentEngine.getTask(task.id));
    }
  };

  const handleExecuteStep = async (stepId: string) => {
    if (!task) return;
    setErrorMessage(null);
    setInfoMessage(null);
    setIsExecuting(true);

    const ctx: ExecutionContext = {
      requestId: `req_${Date.now()}`,
      actorId: 'agent_executor_01',
      role: 'ADMIN',
      depth: 0,
      stepCount: 1,
      modelCallsCount: 0,
      toolCallsCount: 0,
      startTime: Date.now(),
      accumulatedCostUsd: 0,
      callHistory: []
    };

    try {
      const res = await agentEngine.executeStep(task.id, stepId, ctx);
      if (res.wasCached) {
        setInfoMessage(`[Idempotency Deduplication] Đã phát hiện Idempotency Key trùng lặp! Trả về kết quả bộ đệm lập tức, không hao tốn hạn mức Governor.`);
      } else {
        setInfoMessage(`Bước thực thi thành công. Đang chờ Verifier độc lập nghiệm thu.`);
      }
      refreshState();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      setErrorMessage(msg);
    } finally {
      setIsExecuting(false);
    }
  };

  const handleVerifyAsPlanner = (stepId: string) => {
    if (!task) return;
    setErrorMessage(null);
    setInfoMessage(null);

    try {
      agentEngine.verifyStep(
        task.id,
        stepId,
        'PLANNER', // Architecturally forbidden!
        'planner_lead_01',
        true,
        'Planner tự nghiệm thu'
      );
      refreshState();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      setErrorMessage(msg);
    }
  };

  const handleVerifyAsVerifier = (stepId: string) => {
    if (!task) return;
    setErrorMessage(null);
    setInfoMessage(null);

    try {
      agentEngine.verifyStep(
        task.id,
        stepId,
        'VERIFIER', // Independent certifier!
        'independent_verifier_02',
        true,
        'Đã đối chiếu completionCriteria và xác nhận đạt yêu cầu.'
      );
      setInfoMessage('Nghiệm thu thành công bởi Verifier độc lập!');
      refreshState();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      setErrorMessage(msg);
    }
  };

  const handleCreateCheckpoint = () => {
    if (!task) return;
    setErrorMessage(null);
    try {
      const chk = agentEngine.createCheckpoint(task.id);
      setInfoMessage(`Đã lưu checkpoint: ${chk.checkpointId} tại bước thứ ${chk.stepIndex}.`);
      refreshState();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      setErrorMessage(msg);
    }
  };

  const handleResumeCheckpoint = (chkId: string) => {
    setErrorMessage(null);
    try {
      const resumed = agentEngine.resumeFromCheckpoint(chkId);
      setTask(resumed);
      setInfoMessage(`Đã khôi phục trạng thái thành công từ checkpoint: ${chkId}.`);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      setErrorMessage(msg);
    }
  };

  const handleCancelTask = () => {
    if (!task) return;
    setErrorMessage(null);
    try {
      const cancelled = agentEngine.cancelTask(task.id, 'Người dùng bấm Emergency Stop');
      setTask(cancelled);
      setInfoMessage('Tác vụ đã được hủy bỏ. Toàn bộ tiến trình thực thi tiếp theo bị đình chỉ.');
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      setErrorMessage(msg);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-slate-900 border border-slate-800 rounded-xl p-5">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-bold text-white flex items-center gap-2">
              <Zap className="w-5 h-5 text-amber-400" />
              Reliable Agent Engine — Tri-Role Architecture &amp; Resumption
            </h1>
            <span className="text-xs px-2.5 py-0.5 rounded-full font-mono bg-amber-950 text-amber-300 border border-amber-800">
              Part 4/5
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Tam quyền phân lập (Planner - Executor - Verifier) • Cấm Planner tự nghiệm thu • Checkpointing &amp; Hoàn tác • Khóa Idempotency chống trùng
          </p>
        </div>

        {/* Global Task Actions */}
        <div className="flex items-center gap-2">
          <button
            onClick={handleCreateCheckpoint}
            disabled={!task || task.status === 'CANCELLED'}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 disabled:opacity-40 text-slate-200 text-xs font-medium border border-slate-700 transition-colors"
          >
            <Layers className="w-3.5 h-3.5 text-cyan-400" />
            <span>Tạo Checkpoint</span>
          </button>

          <button
            onClick={handleCancelTask}
            disabled={!task || task.status === 'CANCELLED' || task.status === 'COMPLETED'}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-rose-950/80 hover:bg-rose-900/80 disabled:opacity-40 text-rose-300 text-xs font-medium border border-rose-800 transition-colors"
          >
            <StopCircle className="w-3.5 h-3.5 text-rose-400" />
            <span>Dừng Khẩn Cấp (Cancel)</span>
          </button>
        </div>
      </div>

      {/* Messages */}
      {errorMessage && (
        <div className="p-4 rounded-xl bg-rose-950/80 border border-rose-800 text-rose-200 text-xs flex items-start gap-3">
          <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
          <div>
            <span className="font-bold uppercase tracking-wider block">CHẶN KIẾN TRÚC / LỖI THỰC THI</span>
            <p className="mt-0.5 font-mono">{errorMessage}</p>
          </div>
        </div>
      )}

      {infoMessage && (
        <div className="p-3 rounded-xl bg-emerald-950/60 border border-emerald-800 text-emerald-300 text-xs flex items-center gap-2 font-mono">
          <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>{infoMessage}</span>
        </div>
      )}

      {/* Tri-Role Architecture Banner */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        <div className="p-3.5 rounded-xl bg-slate-900 border border-slate-800 space-y-1">
          <span className="text-[10px] uppercase tracking-wider text-cyan-400 font-bold block">
            1. PLANNER (Lập Kế Hoạch)
          </span>
          <p className="text-xs text-slate-300 font-medium">Lập danh sách bước &amp; tiêu chí nghiệm thu.</p>
          <span className="text-[10px] text-rose-400 block font-mono">Tuyệt đối cấm tự nghiệm thu (No Self-Certify)</span>
        </div>

        <div className="p-3.5 rounded-xl bg-slate-900 border border-slate-800 space-y-1">
          <span className="text-[10px] uppercase tracking-wider text-amber-400 font-bold block">
            2. EXECUTOR (Thực Thi)
          </span>
          <p className="text-xs text-slate-300 font-medium">Gọi công cụ dưới giám sát Governor.</p>
          <span className="text-[10px] text-emerald-400 block font-mono">Khóa Idempotency chống trùng side-effects</span>
        </div>

        <div className="p-3.5 rounded-xl bg-slate-900 border border-slate-800 space-y-1">
          <span className="text-[10px] uppercase tracking-wider text-emerald-400 font-bold block">
            3. VERIFIER (Nghiệm Thu Độc Lập)
          </span>
          <p className="text-xs text-slate-300 font-medium">Đối chiếu khách quan với completionCriteria.</p>
          <span className="text-[10px] text-cyan-400 block font-mono">Quyết định chuyển bước hoặc hoàn tác</span>
        </div>
      </div>

      {/* Active Task Steps Stepper */}
      {task && task.plan && (
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-800 pb-3">
            <div>
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <span>Mục Tiêu: {task.title}</span>
                <span
                  className={`text-[10px] font-mono px-2 py-0.5 rounded border ${
                    task.status === 'COMPLETED'
                      ? 'bg-emerald-950 text-emerald-300 border-emerald-800'
                      : task.status === 'CANCELLED'
                      ? 'bg-rose-950 text-rose-300 border-rose-800'
                      : 'bg-cyan-950 text-cyan-300 border-cyan-800'
                  }`}
                >
                  STATUS: {task.status}
                </span>
              </h3>
              <span className="text-xs text-slate-400 font-mono">
                Task ID: {task.id} • Tiến độ: Bước {task.currentStepIndex}/{task.plan.steps.length}
              </span>
            </div>

            {task.cancellationReason && (
              <span className="text-xs text-rose-400 font-mono">
                Lý do dừng: {task.cancellationReason}
              </span>
            )}
          </div>

          {/* Steps List */}
          <div className="space-y-3">
            {task.plan.steps.map((step, idx) => {
              const isCurrent = idx === task.currentStepIndex && task.status !== 'CANCELLED';
              return (
                <div
                  key={step.id}
                  className={`p-4 rounded-xl border transition-all ${
                    step.status === 'VERIFIED'
                      ? 'bg-emerald-950/20 border-emerald-800/80'
                      : isCurrent
                      ? 'bg-cyan-950/20 border-cyan-500/80 shadow-md shadow-cyan-950/40'
                      : 'bg-slate-950 border-slate-800'
                  }`}
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold text-white font-mono">
                          {step.name}
                        </span>
                        <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-slate-900 border border-slate-800 text-slate-400">
                          {step.type}
                        </span>
                        <span
                          className={`text-[10px] font-mono px-2 py-0.5 rounded border ${
                            step.status === 'VERIFIED'
                              ? 'bg-emerald-950 text-emerald-300 border-emerald-800'
                              : step.status === 'AWAITING_VERIFICATION'
                              ? 'bg-amber-950 text-amber-300 border-amber-800'
                              : 'bg-slate-900 text-slate-400 border-slate-800'
                          }`}
                        >
                          {step.status}
                        </span>
                      </div>

                      <div className="mt-1 text-xs text-slate-400 space-y-0.5">
                        <p>
                          Tiêu chí nghiệm thu:{' '}
                          <span className="text-slate-300 font-mono">{step.completionCriteria}</span>
                        </p>
                        {step.idempotencyKey && (
                          <p className="flex items-center gap-1 font-mono text-[11px] text-cyan-400">
                            <Key className="w-3 h-3 text-cyan-400 shrink-0" />
                            <span>Idempotency Key: {step.idempotencyKey}</span>
                          </p>
                        )}
                        {step.verifierNotes && (
                          <p className="text-[11px] font-mono text-emerald-300">
                            {step.verifierNotes}
                          </p>
                        )}
                      </div>
                    </div>

                    {/* Step Action Buttons */}
                    <div className="flex flex-wrap items-center gap-2 shrink-0">
                      {/* Execute Step */}
                      <button
                        onClick={() => handleExecuteStep(step.id)}
                        disabled={task.status === 'CANCELLED' || isExecuting}
                        className="px-2.5 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 disabled:opacity-40 text-white text-xs font-medium flex items-center gap-1.5 transition-colors"
                      >
                        <Play className="w-3 h-3" />
                        <span>Thực Thi (Executor)</span>
                      </button>

                      {/* Planner Self-Certify Test Button (Forbidden) */}
                      <button
                        onClick={() => handleVerifyAsPlanner(step.id)}
                        disabled={task.status === 'CANCELLED' || step.status !== 'AWAITING_VERIFICATION'}
                        className="px-2.5 py-1.5 rounded-lg bg-rose-950/40 hover:bg-rose-900/40 disabled:opacity-30 text-rose-300 text-xs font-medium border border-rose-800/80 transition-colors"
                        title="Thử nghiệm Planner tự nghiệm thu (Kiến trúc sẽ chặn)"
                      >
                        <span>Thử Tự Nghiệm Thu (Cấm)</span>
                      </button>

                      {/* Verifier Independent Review Button (Allowed) */}
                      <button
                        onClick={() => handleVerifyAsVerifier(step.id)}
                        disabled={task.status === 'CANCELLED' || step.status !== 'AWAITING_VERIFICATION'}
                        className="px-2.5 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 disabled:opacity-30 text-white text-xs font-medium flex items-center gap-1.5 transition-colors"
                      >
                        <UserCheck className="w-3 h-3" />
                        <span>Nghiệm Thu (Verifier)</span>
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Checkpoints & Resumption Inspector */}
      {task && (
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 space-y-4">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <span className="text-xs font-semibold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
              <Layers className="w-3.5 h-3.5 text-cyan-400" />
              Điểm Phục Hồi &amp; Hoàn Tác (Checkpoints Stack)
            </span>
            <span className="text-xs font-mono text-slate-400">
              Tổng số checkpoints: {task.checkpoints.length}
            </span>
          </div>

          {task.checkpoints.length > 0 ? (
            <div className="space-y-2">
              {task.checkpoints.map((chk) => (
                <div
                  key={chk.checkpointId}
                  className="p-3 rounded-lg bg-slate-950 border border-slate-800 flex items-center justify-between text-xs"
                >
                  <div className="space-y-0.5">
                    <span className="font-mono font-bold text-cyan-300">{chk.checkpointId}</span>
                    <span className="text-slate-400 block font-mono text-[11px]">
                      Bước thứ {chk.stepIndex} • {chk.completedStepIds.length} bước hoàn tất • {new Date(chk.timestamp).toLocaleTimeString()}
                    </span>
                  </div>

                  <button
                    onClick={() => handleResumeCheckpoint(chk.checkpointId)}
                    className="flex items-center gap-1 px-2.5 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium border border-slate-700 transition-colors"
                  >
                    <RotateCcw className="w-3 h-3" />
                    <span>Khôi Phục Trạng Thái</span>
                  </button>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-xs text-slate-500 italic text-center py-2">
              Chưa có checkpoint nào. Nhấn &quot;Tạo Checkpoint&quot; để lưu ảnh chụp trạng thái tác vụ.
            </p>
          )}
        </div>
      )}
    </div>
  );
};
