import React, { useState } from 'react';
import {
  GitFork,
  ArrowRight,
  ShieldAlert,
  ShieldCheck,
  Zap,
  Play,
  RotateCcw,
  CheckCircle2,
  XCircle,
  Clock,
  Layers,
  FileText,
  DollarSign,
  AlertTriangle,
  Lock,
  Search,
  Hash
} from 'lucide-react';
import { ApexOrchestrator, CascadeResult, PrivacyGateResult } from '../evaluation/apexOrchestrator.ts';
import { ProvenanceReport, TaskGraph, TaskGraphNode } from '../evaluation/types.ts';

interface ApexOrchestratorViewProps {
  orchestrator: ApexOrchestrator;
}

export const ApexOrchestratorView: React.FC<ApexOrchestratorViewProps> = ({ orchestrator }) => {
  const [activeSubView, setActiveSubView] = useState<'dag' | 'cascade' | 'privacy' | 'provenance'>('dag');

  // =========================================================================
  // 1. DAG STATE
  // =========================================================================
  const [taskGraph, setTaskGraph] = useState<TaskGraph>({
    id: 'dag_pipeline_01',
    title: 'Pipeline Tích Hợp Tri Thức & Kiểm Thử Mã Nguồn Đồng Thời',
    maxAllowedSteps: 6,
    executedStepsCount: 0,
    status: 'READY',
    nodes: [
      {
        id: 'node_fetch_terms',
        goal: 'Kiểm tra Provider Terms Registry & Giấy phép',
        input: { provider: 'Anthropic', model: 'claude-3-5-sonnet' },
        expectedOutput: 'Terms verified (train_on_output=false)',
        requiredTools: ['terms_lookup'],
        dependencies: [],
        stepLimit: 1,
        completionCriteria: 'Status is VERIFIED',
        verificationMethod: 'Registry deterministic lookup',
        status: 'PENDING',
        errorStrategy: 'ABORT'
      },
      {
        id: 'node_ast_analysis',
        goal: 'Quét AST & Kiểm tra lỗ hổng bảo mật',
        input: { source: 'src/governance/limitsGovernor.ts' },
        expectedOutput: 'AST clean, zero unsafe eval detected',
        requiredTools: ['ast_scanner'],
        dependencies: [],
        stepLimit: 1,
        completionCriteria: 'No Critical CVE',
        verificationMethod: 'AST parse check',
        status: 'PENDING',
        errorStrategy: 'CASCADE_MODEL'
      },
      {
        id: 'node_extract_claims',
        goal: 'Trích xuất Claim có nguồn chính thức',
        input: { sourceDoc: 'https://docs.anthropic.com' },
        expectedOutput: 'Verified claim with source URL',
        requiredTools: ['url_verifier'],
        dependencies: ['node_fetch_terms'],
        stepLimit: 1,
        completionCriteria: 'URL accessible and supported',
        verificationMethod: 'Primary source check',
        status: 'PENDING',
        errorStrategy: 'RETRY'
      },
      {
        id: 'node_generate_patch',
        goal: 'Sinh mã sửa lỗi & Tối ưu hoá đường truyền',
        input: { target: 'cache-invalidation-fix' },
        expectedOutput: 'TypeScript fix with AbortController',
        requiredTools: ['code_sandbox'],
        dependencies: ['node_ast_analysis'],
        stepLimit: 1,
        completionCriteria: 'Unit test 100% pass',
        verificationMethod: 'Sandbox unit test execution',
        status: 'PENDING',
        errorStrategy: 'CASCADE_MODEL'
      },
      {
        id: 'node_synthesis_audit',
        goal: 'Tổng hợp báo cáo Provenance & Hash Chain',
        input: { combined: 'all-steps' },
        expectedOutput: 'Provenance Report with SHA-256 reproducibility hash',
        requiredTools: ['crypto_hasher'],
        dependencies: ['node_extract_claims', 'node_generate_patch'],
        stepLimit: 1,
        completionCriteria: 'Hash generated and verified',
        verificationMethod: 'SHA-256 cryptographic proof',
        status: 'PENDING',
        errorStrategy: 'ABORT'
      }
    ]
  });

  const [isRunningDag, setIsRunningDag] = useState(false);
  const [dagExecutionLog, setDagExecutionLog] = useState<string[]>([]);

  const handleRunDag = async () => {
    setIsRunningDag(true);
    setDagExecutionLog((prev) => [...prev, `[${new Date().toLocaleTimeString()}] Bắt đầu thực thi DAG: ${taskGraph.title}`]);

    const updatedGraph: TaskGraph = JSON.parse(JSON.stringify(taskGraph));
    updatedGraph.executedStepsCount = 0;
    updatedGraph.nodes.forEach((n: TaskGraphNode) => {
      n.status = 'PENDING';
      n.outputResult = undefined;
    });
    setTaskGraph({ ...updatedGraph });

    await orchestrator.executeTaskGraph(updatedGraph, async (node) => {
      // Small simulated async delay
      await new Promise((resolve) => setTimeout(resolve, 350));
      setDagExecutionLog((prev) => [
        ...prev,
        `[${new Date().toLocaleTimeString()}] Node [${node.id}] hoàn thành trên model 'gemini-2.5-flash'.`
      ]);

      return {
        output: `Hoàn thành mục tiêu: ${node.goal}. Tiêu chuẩn: ${node.completionCriteria}`,
        model: 'gemini-2.5-flash',
        durationMs: 350
      };
    });

    setTaskGraph({ ...updatedGraph });
    setIsRunningDag(false);
    setDagExecutionLog((prev) => [
      ...prev,
      `[${new Date().toLocaleTimeString()}] DAG kết thúc với trạng thái: ${updatedGraph.status}. Tổng bước đã chạy: ${updatedGraph.executedStepsCount}/${updatedGraph.maxAllowedSteps}.`
    ]);
  };

  const handleResetDag = () => {
    const resetNodes = taskGraph.nodes.map((n) => ({
      ...n,
      status: 'PENDING' as const,
      outputResult: undefined,
      executedModel: undefined
    }));
    setTaskGraph({
      ...taskGraph,
      status: 'READY',
      executedStepsCount: 0,
      nodes: resetNodes
    });
    setDagExecutionLog([]);
  };

  // =========================================================================
  // 2. CASCADE ROUTING STATE
  // =========================================================================
  const [cascadePrompt, setCascadePrompt] = useState('Viết hàm TypeScript xử lý debounce và race condition với AbortController.');
  const [cascadeBudget, setCascadeBudget] = useState(0.005);
  const [isCascading, setIsCascading] = useState(false);
  const [cascadeResult, setCascadeResult] = useState<CascadeResult | null>(null);
  const [cascadeError, setCascadeError] = useState<string | null>(null);

  const handleRunCascade = async () => {
    setIsCascading(true);
    setCascadeError(null);
    setCascadeResult(null);

    try {
      const res = await orchestrator.executeCascadeRouting(
        cascadePrompt,
        {
          requestId: `req_${Date.now()}`,
          actorId: 'operator_apex',
          userRole: 'OPERATOR',
          taskCategory: 'CODING_DEBUGGING',
          budgetLimitUsd: cascadeBudget,
          allowCascade: true
        },
        // Verification: If model output contains 'TypeScript AST', mark passed
        (output) => output.includes('TypeScript AST')
      );
      setCascadeResult(res);
    } catch (err: unknown) {
      setCascadeError(err instanceof Error ? err.message : String(err));
    } finally {
      setIsCascading(false);
    }
  };

  // =========================================================================
  // 3. PRIVACY GATE STATE
  // =========================================================================
  const [privacyPayload, setPrivacyPayload] = useState(
    'Dữ liệu người dùng: email nguyen.van.a@example.com, SĐT: 0912-345-678, Secret: AIzaSyD-unauthorizedKey1234567890abcdef123'
  );
  const [targetProviderModel, setTargetProviderModel] = useState('unverified-external-model');
  const [privacyResult, setPrivacyResult] = useState<PrivacyGateResult | null>(null);

  const handleTestPrivacyGate = () => {
    const res = orchestrator.evaluatePrivacyGate(privacyPayload, targetProviderModel);
    setPrivacyResult(res);
  };

  // =========================================================================
  // 4. PROVENANCE REPORT STATE
  // =========================================================================
  const [provenanceReports, setProvenanceReports] = useState<ProvenanceReport[]>(() =>
    orchestrator.getAllProvenanceReports()
  );

  const handleGenerateSampleProvenance = () => {
    const rep = orchestrator.generateProvenanceReport(
      `req_demo_${Date.now().toString().slice(-4)}`,
      'Phân tích kiến trúc bảo mật Limits Governor và đồng bộ hóa Provider Terms',
      [
        { modelId: 'gemini-2.5-flash', role: 'planner_router', latencyMs: 230, costUsd: 0.0001 },
        { modelId: 'claude-3-5-sonnet', role: 'ast_code_analyzer', latencyMs: 790, costUsd: 0.003 }
      ],
      ['ast_validator', 'terms_registry_lookup', 'hash_chain_verifier'],
      ['https://ai.google.dev/docs', 'urn:verified_claim:401', 'https://docs.anthropic.com'],
      ['Khởi tạo DAG', 'Quét AST song song', 'Đối chiếu Provider Terms', 'Tạo Hash Provenance'],
      [],
      'Deterministic AST rule verification and SHA-256 cryptographic seal',
      true,
      false
    );
    setProvenanceReports(orchestrator.getAllProvenanceReports());
  };

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className="px-2.5 py-0.5 rounded text-xs font-semibold bg-cyan-950 text-cyan-400 border border-cyan-800/80">
                APEX ORCHESTRATOR
              </span>
              <span className="text-xs text-slate-400 font-mono">DAG Execution • Cascade • Privacy Gate</span>
            </div>
            <h2 className="text-2xl font-bold text-white tracking-tight">
              Điều Phối Viên Đỉnh Cao (Apex Orchestrator)
            </h2>
            <p className="text-sm text-slate-400 mt-1 max-w-3xl">
              Thực thi đồ thị tác vụ (DAG) theo luồng song song, định tuyến Cascade từ mô hình nhẹ/rẻ lên mô hình cao cấp khi cần thiết, ưu tiên bằng chứng kiểm chứng trước biểu quyết mô hình, và ngăn chặn rò rỉ dữ liệu qua Privacy Gate.
            </p>
          </div>

          {/* Sub-Navigation Tabs */}
          <div className="flex items-center gap-1.5 bg-slate-950 p-1.5 rounded-lg border border-slate-800">
            <button
              onClick={() => setActiveSubView('dag')}
              className={`px-3 py-1.5 rounded text-xs font-medium transition ${
                activeSubView === 'dag' ? 'bg-cyan-600 text-white' : 'text-slate-400 hover:text-white'
              }`}
            >
              Task Graph (DAG)
            </button>
            <button
              onClick={() => setActiveSubView('cascade')}
              className={`px-3 py-1.5 rounded text-xs font-medium transition ${
                activeSubView === 'cascade' ? 'bg-cyan-600 text-white' : 'text-slate-400 hover:text-white'
              }`}
            >
              Cascade Router
            </button>
            <button
              onClick={() => setActiveSubView('privacy')}
              className={`px-3 py-1.5 rounded text-xs font-medium transition ${
                activeSubView === 'privacy' ? 'bg-cyan-600 text-white' : 'text-slate-400 hover:text-white'
              }`}
            >
              Privacy Gate
            </button>
            <button
              onClick={() => setActiveSubView('provenance')}
              className={`px-3 py-1.5 rounded text-xs font-medium transition ${
                activeSubView === 'provenance' ? 'bg-cyan-600 text-white' : 'text-slate-400 hover:text-white'
              }`}
            >
              Provenance Reports
            </button>
          </div>
        </div>
      </div>

      {/* ===================================================================== */}
      {/* 1. DAG SUBVIEW */}
      {/* ===================================================================== */}
      {activeSubView === 'dag' && (
        <div className="space-y-6">
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <h3 className="text-lg font-bold text-white flex items-center gap-2">
                  <GitFork className="w-5 h-5 text-cyan-400" />
                  <span>{taskGraph.title}</span>
                </h3>
                <p className="text-xs text-slate-400 mt-1">
                  Các bước độc lập (Dependencies = 0 hoặc đã hoàn tất) sẽ được kích hoạt thực thi song song qua Promise.all.
                </p>
              </div>

              <div className="flex items-center gap-3">
                <div className="text-xs font-mono bg-slate-950 px-3 py-1.5 rounded border border-slate-800 text-slate-300">
                  Bước đã chạy:{' '}
                  <span className="text-cyan-400 font-bold">
                    {taskGraph.executedStepsCount}/{taskGraph.maxAllowedSteps}
                  </span>
                </div>

                <button
                  disabled={isRunningDag}
                  onClick={handleRunDag}
                  className="flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-semibold bg-cyan-600 hover:bg-cyan-500 text-white transition disabled:opacity-50"
                >
                  {isRunningDag ? (
                    <>
                      <RotateCcw className="w-4 h-4 animate-spin" />
                      <span>Đang chạy song song...</span>
                    </>
                  ) : (
                    <>
                      <Play className="w-4 h-4" />
                      <span>Thực thi DAG</span>
                    </>
                  )}
                </button>

                <button
                  onClick={handleResetDag}
                  className="p-2 rounded-lg text-slate-400 hover:text-white bg-slate-800 border border-slate-700 transition"
                  title="Đặt lại đồ thị"
                >
                  <RotateCcw className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Nodes Visual Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 pt-2">
              {taskGraph.nodes.map((node, index) => {
                const isIndependent = node.dependencies.length === 0;

                return (
                  <div
                    key={node.id}
                    className={`p-4 rounded-xl border text-xs space-y-3 transition ${
                      node.status === 'RUNNING'
                        ? 'bg-cyan-950/40 border-cyan-500 ring-1 ring-cyan-500/50'
                        : node.status === 'COMPLETED'
                        ? 'bg-slate-900 border-emerald-800/80'
                        : node.status === 'SKIPPED'
                        ? 'bg-slate-900/40 border-slate-800 opacity-60'
                        : 'bg-slate-950 border-slate-800'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-mono text-[11px] font-bold text-slate-400">
                        Node {index + 1}: {node.id}
                      </span>
                      {node.status === 'COMPLETED' && (
                        <span className="flex items-center gap-1 px-2 py-0.5 rounded bg-emerald-950 text-emerald-400 border border-emerald-800 font-bold text-[10px]">
                          <CheckCircle2 className="w-3 h-3" />
                          <span>COMPLETED</span>
                        </span>
                      )}
                      {node.status === 'RUNNING' && (
                        <span className="flex items-center gap-1 px-2 py-0.5 rounded bg-cyan-950 text-cyan-300 border border-cyan-800 font-bold text-[10px] animate-pulse">
                          <RotateCcw className="w-3 h-3 animate-spin" />
                          <span>RUNNING</span>
                        </span>
                      )}
                      {node.status === 'PENDING' && (
                        <span className="px-2 py-0.5 rounded bg-slate-800 text-slate-400 font-bold text-[10px]">
                          PENDING
                        </span>
                      )}
                      {node.status === 'SKIPPED' && (
                        <span className="px-2 py-0.5 rounded bg-slate-800 text-slate-500 font-bold text-[10px]">
                          SKIPPED
                        </span>
                      )}
                    </div>

                    <div>
                      <h4 className="font-semibold text-white">{node.goal}</h4>
                      <p className="text-slate-400 text-[11px] mt-1">
                        Phương pháp: {node.verificationMethod}
                      </p>
                    </div>

                    <div className="pt-2 border-t border-slate-800/80 space-y-1 text-[11px]">
                      <div className="flex items-center justify-between text-slate-400">
                        <span>Dependencies:</span>
                        <span className="font-mono text-cyan-300">
                          {isIndependent ? 'None (Song song)' : node.dependencies.join(', ')}
                        </span>
                      </div>
                      <div className="flex items-center justify-between text-slate-400">
                        <span>Chiến lược lỗi:</span>
                        <span className="font-mono text-amber-300">{node.errorStrategy}</span>
                      </div>
                      {node.outputResult && (
                        <div className="mt-2 p-2 rounded bg-slate-950 border border-emerald-900/60 text-emerald-300 font-mono text-[10px]">
                          {node.outputResult}
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Execution logs */}
            {dagExecutionLog.length > 0 && (
              <div className="mt-4 p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-1 font-mono text-[11px] text-slate-400 max-h-48 overflow-y-auto">
                <div className="font-semibold text-cyan-400 mb-2">Live Execution Log:</div>
                {dagExecutionLog.map((log, i) => (
                  <div key={i}>{log}</div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* ===================================================================== */}
      {/* 2. CASCADE ROUTER SUBVIEW */}
      {/* ===================================================================== */}
      {activeSubView === 'cascade' && (
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 space-y-6">
          <div>
            <h3 className="text-lg font-bold text-white flex items-center gap-2">
              <Zap className="w-5 h-5 text-amber-400" />
              <span>Cascade Routing &amp; Escalate Threshold Simulation</span>
            </h3>
            <p className="text-xs text-slate-400 mt-1 max-w-2xl">
              Cơ chế leo thang bậc thang: Bắt đầu từ model siêu tốc, siêu rẻ (Gemini 2.5 Flash). Chỉ leo thang lên Gemini 2.5 Pro hoặc Claude 3.5 Sonnet khi tiêu chuẩn kiểm chứng khách quan thất bại. Dừng ngay lập tức nếu chạm ngân sách tối đa.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="md:col-span-2 space-y-4">
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">
                  Prompt kiểm thử tác vụ:
                </label>
                <textarea
                  rows={3}
                  value={cascadePrompt}
                  onChange={(e) => setCascadePrompt(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 text-white text-xs rounded-xl p-3 focus:outline-none focus:ring-1 focus:ring-cyan-500 font-mono"
                />
              </div>

              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-slate-950 p-4 rounded-xl border border-slate-800">
                <div>
                  <label className="text-xs font-semibold text-white block">
                    Giới hạn ngân sách tối đa: ${cascadeBudget.toFixed(4)} USD
                  </label>
                  <span className="text-[11px] text-slate-400">
                    Thử kéo về $0.00005 để xem Cascade dừng khẩn cấp do Budget Exhaustion.
                  </span>
                </div>
                <input
                  type="range"
                  min="0.00005"
                  max="0.01"
                  step="0.0001"
                  value={cascadeBudget}
                  onChange={(e) => setCascadeBudget(parseFloat(e.target.value))}
                  className="w-44 accent-cyan-500"
                />
              </div>

              <button
                disabled={isCascading}
                onClick={handleRunCascade}
                className="flex items-center gap-2 px-5 py-2.5 rounded-lg text-xs font-semibold bg-amber-600 hover:bg-amber-500 text-white transition disabled:opacity-50"
              >
                {isCascading ? (
                  <>
                    <RotateCcw className="w-4 h-4 animate-spin" />
                    <span>Đang định tuyến Cascade...</span>
                  </>
                ) : (
                  <>
                    <Play className="w-4 h-4" />
                    <span>Kích hoạt Cascade Router</span>
                  </>
                )}
              </button>
            </div>

            {/* Cascade Flow Explanation */}
            <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 text-xs space-y-3">
              <h4 className="font-semibold text-white">Thứ tự Cascade Định Tuyến</h4>
              <div className="space-y-2">
                <div className="p-2.5 rounded bg-slate-900 border border-slate-800 flex items-center justify-between">
                  <div>
                    <div className="font-bold text-cyan-400 font-mono">1. gemini-2.5-flash</div>
                    <div className="text-[10px] text-slate-400">$0.0001 / call • 250ms</div>
                  </div>
                  <span className="text-[10px] font-bold text-emerald-400">FAST TIER</span>
                </div>
                <div className="text-center text-slate-600">↓ nếu kiểm chứng thất bại</div>
                <div className="p-2.5 rounded bg-slate-900 border border-slate-800 flex items-center justify-between">
                  <div>
                    <div className="font-bold text-indigo-400 font-mono">2. gemini-2.5-pro</div>
                    <div className="text-[10px] text-slate-400">$0.0015 / call • 650ms</div>
                  </div>
                  <span className="text-[10px] font-bold text-indigo-400">REASONING</span>
                </div>
                <div className="text-center text-slate-600">↓ nếu cần AST code cao cấp</div>
                <div className="p-2.5 rounded bg-slate-900 border border-slate-800 flex items-center justify-between">
                  <div>
                    <div className="font-bold text-amber-400 font-mono">3. claude-3-5-sonnet</div>
                    <div className="text-[10px] text-slate-400">$0.0030 / call • 820ms</div>
                  </div>
                  <span className="text-[10px] font-bold text-amber-400">SPECIALIZED</span>
                </div>
              </div>
            </div>
          </div>

          {/* Cascade Output Result */}
          {cascadeResult && (
            <div className="bg-slate-950 border border-emerald-800/80 rounded-xl p-5 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-emerald-400 flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Cascade thành công: Chọn {cascadeResult.selectedModel}</span>
                </span>
                <span className="text-xs font-mono text-slate-400">
                  Leo thang: {cascadeResult.escalationCount} lần • Chi phí: ${cascadeResult.costUsd.toFixed(4)}
                </span>
              </div>
              <p className="text-xs font-mono text-slate-300 bg-slate-900 p-3 rounded border border-slate-800">
                {cascadeResult.output}
              </p>
              <div className="text-[11px] text-slate-400">
                Bằng chứng kiểm chứng: <span className="text-emerald-400">{cascadeResult.evidence}</span>
              </div>
            </div>
          )}

          {cascadeError && (
            <div className="bg-rose-950/40 border border-rose-800 rounded-xl p-4 flex items-center gap-3 text-xs text-rose-300">
              <AlertTriangle className="w-5 h-5 text-rose-400 shrink-0" />
              <div>
                <span className="font-bold">Lỗi dừng Cascade:</span> {cascadeError}
              </div>
            </div>
          )}
        </div>
      )}

      {/* ===================================================================== */}
      {/* 3. PRIVACY GATE SUBVIEW */}
      {/* ===================================================================== */}
      {activeSubView === 'privacy' && (
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 space-y-6">
          <div>
            <h3 className="text-lg font-bold text-white flex items-center gap-2">
              <Lock className="w-5 h-5 text-cyan-400" />
              <span>Privacy Gate &amp; Data Minimization Gatekeeper</span>
            </h3>
            <p className="text-xs text-slate-400 mt-1 max-w-2xl">
              Tự động phát hiện thông tin định danh cá nhân (PII như Email, SĐT) và mã bảo mật (API keys, Tokens). Nếu đích đến là nhà cung cấp chưa được xác minh (UNVERIFIED) hoặc cấm lưu trữ, Privacy Gate sẽ chặn đứng yêu cầu.
            </p>
          </div>

          <div className="space-y-4">
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">
                Dữ liệu đầu vào cần quét PII / Secrets:
              </label>
              <textarea
                rows={3}
                value={privacyPayload}
                onChange={(e) => setPrivacyPayload(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 text-white text-xs rounded-xl p-3 focus:outline-none focus:ring-1 focus:ring-cyan-500 font-mono"
              />
            </div>

            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-slate-950 p-4 rounded-xl border border-slate-800">
              <div className="flex items-center gap-2">
                <span className="text-xs text-slate-400">Model đích đến:</span>
                <select
                  value={targetProviderModel}
                  onChange={(e) => setTargetProviderModel(e.target.value)}
                  className="bg-slate-800 border border-slate-700 text-white text-xs rounded-lg px-2.5 py-1.5 focus:outline-none focus:ring-1 focus:ring-cyan-500 font-mono"
                >
                  <option value="unverified-external-model">unverified-external-model (CHƯA XÁC MINH)</option>
                  <option value="gemini-2.5-flash">gemini-2.5-flash (VERIFIED)</option>
                  <option value="claude-3-5-sonnet">claude-3-5-sonnet (VERIFIED)</option>
                </select>
              </div>

              <button
                onClick={handleTestPrivacyGate}
                className="flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-semibold bg-cyan-600 hover:bg-cyan-500 text-white transition"
              >
                <Search className="w-4 h-4" />
                <span>Kiểm tra Privacy Gate</span>
              </button>
            </div>

            {privacyResult && (
              <div
                className={`p-5 rounded-xl border text-xs space-y-3 ${
                  privacyResult.cleared
                    ? 'bg-slate-950 border-emerald-800/80'
                    : 'bg-rose-950/40 border-rose-800'
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    {privacyResult.cleared ? (
                      <ShieldCheck className="w-5 h-5 text-emerald-400" />
                    ) : (
                      <ShieldAlert className="w-5 h-5 text-rose-400" />
                    )}
                    <span className="font-bold text-sm text-white">
                      {privacyResult.cleared
                        ? 'Privacy Gate: THÔNG QUA (CLEARED)'
                        : 'Privacy Gate: BỊ CHẶN (BLOCKED)'}
                    </span>
                  </div>

                  <span className="text-slate-400 font-mono text-[11px]">
                    Thực thể nhạy cảm phát hiện: {privacyResult.sensitiveEntitiesFound.join(', ') || 'None'}
                  </span>
                </div>

                {!privacyResult.cleared && (
                  <p className="text-rose-300 font-medium">{privacyResult.blockedReason}</p>
                )}

                <div className="pt-2 border-t border-slate-800/80">
                  <span className="text-slate-400 font-medium">Dữ liệu đã thu nhỏ &amp; ẩn danh (Sanitized Payload):</span>
                  <div className="p-3 bg-slate-900 rounded border border-slate-800 font-mono text-cyan-300 mt-1">
                    {privacyResult.sanitizedPayload}
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ===================================================================== */}
      {/* 4. PROVENANCE REPORTS SUBVIEW */}
      {/* ===================================================================== */}
      {activeSubView === 'provenance' && (
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h3 className="text-lg font-bold text-white flex items-center gap-2">
                <Hash className="w-5 h-5 text-indigo-400" />
                <span>Auditable Provenance Reports ({provenanceReports.length})</span>
              </h3>
              <p className="text-xs text-slate-400 mt-1">
                Lưu vết có thể kiểm toán gồm toàn bộ models được gọi, công cụ sử dụng, nguồn trích dẫn và mã băm SHA-256 tái tạo.
              </p>
            </div>

            <button
              onClick={handleGenerateSampleProvenance}
              className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-semibold bg-indigo-600 hover:bg-indigo-500 text-white transition"
            >
              <FileText className="w-3.5 h-3.5" />
              <span>Tạo Provenance Report mẫu</span>
            </button>
          </div>

          <div className="space-y-4">
            {provenanceReports.map((report) => (
              <div
                key={report.requestId}
                className="bg-slate-950 border border-slate-800 rounded-xl p-5 text-xs space-y-3"
              >
                <div className="flex items-center justify-between flex-wrap gap-2">
                  <div className="flex items-center gap-2">
                    <span className="font-mono font-bold text-white">{report.requestId}</span>
                    <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-emerald-950 text-emerald-400 border border-emerald-800">
                      PRIVACY CLEARED
                    </span>
                  </div>
                  <span className="text-slate-500 font-mono text-[11px]">
                    {new Date(report.timestamp).toLocaleString()}
                  </span>
                </div>

                <div className="text-slate-300">
                  <span className="text-slate-500 font-medium">Nhiệm vụ:</span> {report.userPromptSummary}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-2 border-t border-slate-800/80">
                  <div>
                    <span className="text-slate-500 font-medium block mb-1">Mô hình đã gọi:</span>
                    <div className="space-y-1">
                      {report.modelsCalled.map((m, idx) => (
                        <div key={idx} className="flex items-center justify-between font-mono text-[11px] bg-slate-900 p-1.5 rounded">
                          <span className="text-cyan-300">{m.modelId} ({m.role})</span>
                          <span className="text-slate-400">{m.latencyMs}ms • ${m.costUsd.toFixed(4)}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div>
                    <span className="text-slate-500 font-medium block mb-1">Công cụ &amp; Nguồn trích dẫn:</span>
                    <div className="space-y-1 font-mono text-[11px]">
                      <div className="text-slate-300">Tools: {report.toolsCalled.join(', ')}</div>
                      <div className="text-slate-400 truncate">Sources: {report.sourcesUsed.join(', ')}</div>
                    </div>
                  </div>
                </div>

                <div className="pt-2 border-t border-slate-800 flex items-center justify-between flex-wrap gap-2 font-mono text-[11px]">
                  <span className="text-slate-500">Reproducibility Hash:</span>
                  <span className="text-indigo-400 font-bold select-all bg-indigo-950/40 px-2 py-0.5 rounded border border-indigo-900">
                    {report.reproducibilityHash}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
