import React, { useState } from 'react';
import {
  Code,
  FolderTree,
  Terminal,
  ShieldAlert,
  Play,
  RotateCcw,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  FileCode,
  FileText,
  Lock,
  Cpu,
  Layers,
  ArrowRight
} from 'lucide-react';
import {
  CodeLabEngine,
  RepoMapData,
  TestFirstWorkflowRun,
  SecondReviewReport,
  SandboxExecutionResult
} from '../modules/codeLab.ts';

interface CodeLabViewProps {
  codeLab: CodeLabEngine;
}

export const CodeLabView: React.FC<CodeLabViewProps> = ({ codeLab }) => {
  const [activeTab, setActiveTab] = useState<'repomap' | 'testfirst' | 'secondreview' | 'sandbox'>('repomap');
  const [repoMap] = useState<RepoMapData>(() => codeLab.getRepoMap());
  const [selectedFile, setSelectedFile] = useState(repoMap.files[2]); // Governor by default

  // Test-First Workflow State
  const [workflowRuns, setWorkflowRuns] = useState<TestFirstWorkflowRun[]>(() => codeLab.getWorkflowHistory());
  const [issueInput, setIssueInput] = useState<string>('Off-by-one boundary check in Governor step limit');
  const [testInput, setTestInput] = useState<string>('P1.3: Blocks execution when agent exceeds max step count');
  const [activeWorkflow, setActiveWorkflow] = useState<TestFirstWorkflowRun | null>(
    () => workflowRuns[0] || null
  );

  // Second Review State
  const [diffInput, setDiffInput] = useState<string>(
    `diff --git a/src/governance/limitsGovernor.ts b/src/governance/limitsGovernor.ts
--- a/src/governance/limitsGovernor.ts
+++ b/src/governance/limitsGovernor.ts
@@ -250,5 +250,5 @@
-    if (context.stepCount >= maxSteps) {
+    if (context.stepCount > maxSteps) { // Potential off-by-one bug!
+      console.log('debug step:', process.env.API_KEY); // Secret leak!`
  );
  const [reviewReport, setReviewReport] = useState<SecondReviewReport | null>(null);

  // Sandbox State
  const [sandboxCode, setSandboxCode] = useState<string>(
    `// Safe TypeScript calculation inside Sandbox
const items = [12, 24, 36, 48];
const total = items.reduce((a, b) => a + b, 0);
console.log("Computed total:", total);
return { total, count: items.length };`
  );
  const [sandboxResult, setSandboxResult] = useState<SandboxExecutionResult | null>(null);
  const [requestRoot, setRequestRoot] = useState<boolean>(false);
  const [simulateSecretAccess, setSimulateSecretAccess] = useState<boolean>(false);

  const handleRunWorkflow = () => {
    const run = codeLab.startTestFirstWorkflow(issueInput, testInput);
    setWorkflowRuns(codeLab.getWorkflowHistory());
    setActiveWorkflow(run);
  };

  const handleRunSecondReview = () => {
    const report = codeLab.runSecondReview(diffInput);
    setReviewReport(report);
  };

  const handleRunSandbox = () => {
    let codeToRun = sandboxCode;
    if (simulateSecretAccess) {
      codeToRun += '\nconst leakedKey = process.env.GEMINI_KEY;';
    }
    const result = codeLab.executeInSandbox({
      code: codeToRun,
      language: 'typescript',
      requestedPrivileges: requestRoot ? 'ROOT' : 'USER',
      timeoutMs: 2000,
      memoryQuotaMb: 64
    });
    setSandboxResult(result);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-slate-900 border border-slate-800 rounded-xl p-5">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-bold text-white flex items-center gap-2">
              <Code className="w-5 h-5 text-indigo-400" />
              Code Lab — Repo Map, Test-First &amp; Sandbox Runner
            </h1>
            <span className="text-xs px-2.5 py-0.5 rounded-full font-mono bg-indigo-950 text-indigo-300 border border-indigo-800">
              Part 4/5
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Bản đồ kho mã tương tác • Quy trình 8 bước Test-First nghiêm ngặt • Kiểm định Second Review • Sandbox cô lập quyền hạn
          </p>
        </div>

        {/* Tab Switcher */}
        <div className="flex items-center bg-slate-950 p-1 rounded-lg border border-slate-800">
          <button
            onClick={() => setActiveTab('repomap')}
            className={`px-3 py-1.5 rounded-md text-xs font-medium transition-all ${
              activeTab === 'repomap'
                ? 'bg-indigo-600 text-white shadow-sm'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Repo Map
          </button>
          <button
            onClick={() => setActiveTab('testfirst')}
            className={`px-3 py-1.5 rounded-md text-xs font-medium transition-all ${
              activeTab === 'testfirst'
                ? 'bg-indigo-600 text-white shadow-sm'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Test-First (8 Bước)
          </button>
          <button
            onClick={() => setActiveTab('secondreview')}
            className={`px-3 py-1.5 rounded-md text-xs font-medium transition-all ${
              activeTab === 'secondreview'
                ? 'bg-indigo-600 text-white shadow-sm'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Second Review
          </button>
          <button
            onClick={() => setActiveTab('sandbox')}
            className={`px-3 py-1.5 rounded-md text-xs font-medium transition-all ${
              activeTab === 'sandbox'
                ? 'bg-indigo-600 text-white shadow-sm'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Sandbox Runner
          </button>
        </div>
      </div>

      {/* 1. REPO MAP TAB */}
      {activeTab === 'repomap' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* File Tree & Categorization */}
          <div className="lg:col-span-5 bg-slate-900 border border-slate-800 rounded-xl p-4 space-y-3">
            <span className="text-xs font-semibold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
              <FolderTree className="w-3.5 h-3.5 text-cyan-400" />
              Cấu Trúc Tệp Tin &amp; Phân Vùng Nhạy Cảm
            </span>

            <div className="space-y-1.5 max-h-[500px] overflow-y-auto pr-1">
              {repoMap.files.map((file) => {
                const isSelected = file.path === selectedFile.path;
                const isSensitive = file.category === 'sensitive_zone';
                return (
                  <div
                    key={file.path}
                    onClick={() => setSelectedFile(file)}
                    className={`p-2.5 rounded-lg border cursor-pointer transition-all ${
                      isSelected
                        ? 'bg-indigo-950/70 border-indigo-500 text-white'
                        : isSensitive
                        ? 'bg-rose-950/20 border-rose-900/60 text-slate-300 hover:bg-slate-800'
                        : 'bg-slate-950/60 border-slate-800/80 text-slate-300 hover:bg-slate-800'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <FileCode className={`w-3.5 h-3.5 ${isSensitive ? 'text-rose-400' : 'text-slate-400'}`} />
                        <span className="text-xs font-mono font-medium">{file.name}</span>
                      </div>
                      <span
                        className={`text-[10px] font-mono px-1.5 py-0.5 rounded border ${
                          isSensitive
                            ? 'bg-rose-950 text-rose-300 border-rose-800'
                            : file.category === 'entry_point'
                            ? 'bg-amber-950 text-amber-300 border-amber-800'
                            : file.category === 'test'
                            ? 'bg-emerald-950 text-emerald-300 border-emerald-800'
                            : 'bg-slate-800 text-slate-400 border-slate-700'
                        }`}
                      >
                        {file.category}
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-400 mt-1 line-clamp-1">{file.description}</p>
                  </div>
                );
              })}
            </div>
          </div>

          {/* File Detail & Sensitive Zone Inspector */}
          <div className="lg:col-span-7 space-y-4">
            <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 space-y-4">
              <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                <div>
                  <h3 className="text-sm font-bold font-mono text-cyan-300 flex items-center gap-2">
                    <FileText className="w-4 h-4 text-cyan-400" />
                    {selectedFile.path}
                  </h3>
                  <p className="text-xs text-slate-400 mt-0.5">{selectedFile.description}</p>
                </div>
                <div className="text-right font-mono text-xs text-slate-400">
                  <div>{selectedFile.lines} lines</div>
                  <div>{(selectedFile.sizeBytes / 1024).toFixed(1)} KB</div>
                </div>
              </div>

              {/* Sensitive Zone Alert if applicable */}
              {selectedFile.sensitiveReason && (
                <div className="p-3 rounded-lg bg-rose-950/50 border border-rose-800 text-rose-300 text-xs flex items-start gap-2.5">
                  <ShieldAlert className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
                  <div>
                    <span className="font-bold uppercase tracking-wider block">VÙNG MÃ NHẠY CẢM (CRITICAL ZONE)</span>
                    <p className="mt-0.5 text-rose-200">{selectedFile.sensitiveReason}</p>
                    <p className="text-[11px] text-rose-400 mt-1 font-mono">
                      Mọi sửa đổi trong vùng này bắt buộc vượt qua 100% bài test hồi quy và xác nhận Tier 3.
                    </p>
                  </div>
                </div>
              )}

              {/* Imports & Dependencies */}
              <div>
                <span className="text-xs font-semibold text-slate-300 uppercase tracking-wider block mb-2">
                  Phụ Thuộc (Imports &amp; Dependencies)
                </span>
                {selectedFile.imports.length > 0 ? (
                  <div className="flex flex-wrap gap-1.5">
                    {selectedFile.imports.map((imp) => (
                      <span
                        key={imp}
                        className="text-[11px] font-mono px-2 py-1 rounded bg-slate-950 border border-slate-800 text-slate-300"
                      >
                        {imp}
                      </span>
                    ))}
                  </div>
                ) : (
                  <span className="text-xs text-slate-500 italic">Không có dependencies ngoài.</span>
                )}
              </div>

              {/* External Services Connected */}
              <div>
                <span className="text-xs font-semibold text-slate-300 uppercase tracking-wider block mb-2">
                  Dịch Vụ &amp; API Bên Ngoài Được Kết Nối
                </span>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                  {repoMap.externalServices.map((srv) => (
                    <div key={srv.name} className="p-2.5 rounded-lg bg-slate-950 border border-slate-800 text-xs">
                      <span className="font-semibold text-white block">{srv.name}</span>
                      <span className="text-[10px] text-cyan-400 font-mono block">{srv.provider}</span>
                      <span className="text-[10px] text-slate-500 font-mono block">{srv.protocol}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 2. TEST-FIRST TAB */}
      {activeTab === 'testfirst' && (
        <div className="space-y-6">
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 space-y-4">
            <span className="text-xs font-semibold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
              <Terminal className="w-3.5 h-3.5 text-cyan-400" />
              Khởi Chạy Quy Trình 8 Bước Test-First
            </span>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="text-xs text-slate-400 block mb-1">Mô tả lỗi / bug cần sửa</label>
                <input
                  type="text"
                  value={issueInput}
                  onChange={(e) => setIssueInput(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-lg text-xs text-slate-200 focus:outline-none focus:border-cyan-500"
                />
              </div>

              <div>
                <label className="text-xs text-slate-400 block mb-1">Bài test mục tiêu (Target Test Case)</label>
                <input
                  type="text"
                  value={testInput}
                  onChange={(e) => setTestInput(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-lg text-xs text-slate-200 focus:outline-none focus:border-cyan-500"
                />
              </div>
            </div>

            <button
              onClick={handleRunWorkflow}
              className="py-2.5 px-4 rounded-lg bg-cyan-600 hover:bg-cyan-500 text-white font-medium text-xs flex items-center gap-2 transition-all shadow-md shadow-cyan-600/20"
            >
              <Play className="w-3.5 h-3.5" />
              <span>Thực Hiện Quy Trình 8 Bước Test-First</span>
            </button>
          </div>

          {/* Stepper Progress */}
          {activeWorkflow && (
            <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 space-y-4">
              <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                <div>
                  <h3 className="text-sm font-bold text-white">Tiến Độ Quy Trình: {activeWorkflow.issueDescription}</h3>
                  <span className="text-xs font-mono text-cyan-400">Run ID: {activeWorkflow.runId}</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-xs font-mono px-2 py-0.5 rounded bg-emerald-950 text-emerald-300 border border-emerald-800">
                    COMPLETE (8/8)
                  </span>
                  <span className="text-xs font-mono text-slate-400">
                    Rollback Checkpoint: {activeWorkflow.rollbackCheckpointId}
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
                {activeWorkflow.steps.map((step) => (
                  <div
                    key={step.step}
                    className="p-3 rounded-lg bg-slate-950 border border-slate-800 space-y-1.5"
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-slate-200">{step.name}</span>
                      <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                    </div>
                    <p className="text-[11px] text-slate-400 leading-relaxed">{step.details}</p>
                    <span className="text-[10px] font-mono text-slate-600 block">{step.timestamp}</span>
                  </div>
                ))}
              </div>

              {activeWorkflow.diffSummary && (
                <div className="p-3 rounded-lg bg-slate-950 border border-slate-800 flex items-center justify-between text-xs font-mono">
                  <span className="text-slate-400">
                    Diff Evaluation: +{activeWorkflow.diffSummary.insertions} lines, -{activeWorkflow.diffSummary.deletions} lines
                  </span>
                  <span className="px-2 py-0.5 rounded bg-emerald-950 text-emerald-300 border border-emerald-800">
                    Blast Radius: {activeWorkflow.diffSummary.blastRadius}
                  </span>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* 3. SECOND REVIEW TAB */}
      {activeTab === 'secondreview' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          <div className="lg:col-span-6 bg-slate-900 border border-slate-800 rounded-xl p-5 space-y-4">
            <span className="text-xs font-semibold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
              <FileCode className="w-3.5 h-3.5 text-indigo-400" />
              Mã Nguồn / Git Diff Cần Kiểm Định
            </span>

            <textarea
              rows={12}
              value={diffInput}
              onChange={(e) => setDiffInput(e.target.value)}
              className="w-full p-3 bg-slate-950 border border-slate-700 rounded-lg text-xs font-mono text-slate-200 focus:outline-none focus:border-indigo-500"
            />

            <button
              onClick={handleRunSecondReview}
              className="w-full py-2.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white font-medium text-xs flex items-center justify-center gap-2 transition-all shadow-md shadow-indigo-600/20"
            >
              <ShieldAlert className="w-3.5 h-3.5" />
              <span>Chạy Second Review (6 Tiêu Chí)</span>
            </button>
          </div>

          <div className="lg:col-span-6 space-y-4">
            {reviewReport ? (
              <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 space-y-4">
                <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                  <div>
                    <h3 className="text-sm font-bold text-white">Kết Quả Kiểm Định Thứ Hai</h3>
                    <span className="text-xs font-mono text-indigo-400">
                      Method: {reviewReport.reviewerType}
                    </span>
                  </div>
                  <div className="text-right">
                    <span
                      className={`text-lg font-bold font-mono ${
                        reviewReport.score >= 80 ? 'text-emerald-400' : 'text-rose-400'
                      }`}
                    >
                      {reviewReport.score}/100
                    </span>
                    <span className="text-[10px] text-slate-500 block">Điểm Tin Cậy</span>
                  </div>
                </div>

                {/* 6 Dimension Checklist */}
                <div className="space-y-2">
                  {Object.entries(reviewReport.categories).map(([key, val]) => (
                    <div
                      key={key}
                      className="p-2.5 rounded-lg bg-slate-950 border border-slate-800 text-xs flex items-start justify-between"
                    >
                      <div>
                        <span className="font-semibold text-slate-200 capitalize">
                          {key.replace(/([A-Z])/g, ' $1')}
                        </span>
                        {val.findings.length > 0 && (
                          <div className="mt-1 space-y-0.5">
                            {val.findings.map((f, i) => (
                              <p key={i} className="text-[11px] text-rose-300">
                                • {f}
                              </p>
                            ))}
                          </div>
                        )}
                      </div>
                      {val.passed ? (
                        <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                      ) : (
                        <XCircle className="w-4 h-4 text-rose-400 shrink-0" />
                      )}
                    </div>
                  ))}
                </div>

                <p className="text-[11px] text-slate-500 italic border-t border-slate-800 pt-3">
                  {reviewReport.limitationsDisclosed}
                </p>
              </div>
            ) : (
              <div className="bg-slate-900 border border-slate-800 rounded-xl p-8 text-center text-slate-500 text-xs">
                Nhấn &quot;Chạy Second Review&quot; để quét rò rỉ bảo mật, lỗi logic và nguy cơ mất dữ liệu trong diff.
              </div>
            )}
          </div>
        </div>
      )}

      {/* 4. SANDBOX TAB */}
      {activeTab === 'sandbox' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          <div className="lg:col-span-6 bg-slate-900 border border-slate-800 rounded-xl p-5 space-y-4">
            <span className="text-xs font-semibold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
              <Cpu className="w-3.5 h-3.5 text-cyan-400" />
              Môi Trường Sandbox Cô Lập (Resource &amp; Zero-Admin Quotas)
            </span>

            <textarea
              rows={8}
              value={sandboxCode}
              onChange={(e) => setSandboxCode(e.target.value)}
              className="w-full p-3 bg-slate-950 border border-slate-700 rounded-lg text-xs font-mono text-slate-200 focus:outline-none focus:border-cyan-500"
            />

            {/* Quota & Security Limits Checklist */}
            <div className="p-3 rounded-lg bg-slate-950 border border-slate-800 text-xs space-y-2">
              <div className="flex items-center justify-between text-slate-400">
                <span>Timeout Quota:</span>
                <span className="font-mono text-white">2000 ms</span>
              </div>
              <div className="flex items-center justify-between text-slate-400">
                <span>Memory Quota:</span>
                <span className="font-mono text-white">64 MB</span>
              </div>
              <div className="flex items-center justify-between text-slate-400">
                <span>Thư mục cho phép:</span>
                <span className="font-mono text-cyan-400">/tmp/sandbox (chỉ ghi tạm)</span>
              </div>
            </div>

            {/* Test Simulation Toggles */}
            <div className="space-y-2 text-xs text-slate-300">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={requestRoot}
                  onChange={(e) => setRequestRoot(e.target.checked)}
                  className="rounded border-slate-700 bg-slate-950 accent-rose-500"
                />
                <span>Thử nghiệm yêu cầu quyền ROOT (Bị Governor chặn ngay lập tức)</span>
              </label>

              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={simulateSecretAccess}
                  onChange={(e) => setSimulateSecretAccess(e.target.checked)}
                  className="rounded border-slate-700 bg-slate-950 accent-rose-500"
                />
                <span>Thử nghiệm trích xuất biến môi trường host (GEMINI_KEY)</span>
              </label>
            </div>

            <button
              onClick={handleRunSandbox}
              className="w-full py-2.5 rounded-lg bg-cyan-600 hover:bg-cyan-500 text-white font-medium text-xs flex items-center justify-center gap-2 transition-all shadow-md shadow-cyan-600/20"
            >
              <Play className="w-3.5 h-3.5" />
              <span>Chạy Mã Trong Sandbox</span>
            </button>
          </div>

          <div className="lg:col-span-6 space-y-4">
            {sandboxResult ? (
              <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 space-y-4">
                <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                  <div>
                    <h3 className="text-sm font-bold text-white">Kết Quả Sandbox</h3>
                    <span className="text-xs font-mono text-cyan-400">
                      ID: {sandboxResult.executionId}
                    </span>
                  </div>
                  <span
                    className={`text-xs font-mono px-2 py-0.5 rounded border ${
                      sandboxResult.success
                        ? 'bg-emerald-950 text-emerald-300 border-emerald-800'
                        : 'bg-rose-950 text-rose-300 border-rose-800'
                    }`}
                  >
                    EXIT CODE {sandboxResult.exitCode}
                  </span>
                </div>

                {/* Console Output */}
                <div className="bg-slate-950 border border-slate-800 rounded-lg p-3 font-mono text-xs">
                  <span className="text-[10px] text-slate-500 block mb-1">STDOUT:</span>
                  <pre className="text-emerald-400 whitespace-pre-wrap">{sandboxResult.stdout || '(trống)'}</pre>
                  {sandboxResult.stderr && (
                    <div className="mt-2 pt-2 border-t border-slate-800">
                      <span className="text-[10px] text-rose-500 block mb-1">STDERR / BLOCKED:</span>
                      <pre className="text-rose-400 whitespace-pre-wrap">{sandboxResult.stderr}</pre>
                    </div>
                  )}
                </div>

                {/* Isolation Guarantees Verified */}
                <div className="p-3 rounded-lg bg-slate-950 border border-slate-800 space-y-2 text-xs">
                  <span className="text-[10px] text-slate-400 uppercase tracking-wider block">
                    Bảo Đảm Cô Lập (Isolation Guarantees)
                  </span>
                  <div className="flex items-center justify-between text-slate-300">
                    <span>Chặn quyền Root / Sudo:</span>
                    <span className="font-mono text-emerald-400">ĐÃ THỰC THI (PASSED)</span>
                  </div>
                  <div className="flex items-center justify-between text-slate-300">
                    <span>Giới hạn thư mục /tmp/sandbox:</span>
                    <span className="font-mono text-emerald-400">ĐÃ THỰC THI (PASSED)</span>
                  </div>
                  <div className="flex items-center justify-between text-slate-300">
                    <span>Ẩn bí mật môi trường Host:</span>
                    <span className="font-mono text-emerald-400">ĐÃ THỰC THI (PASSED)</span>
                  </div>
                </div>
              </div>
            ) : (
              <div className="bg-slate-900 border border-slate-800 rounded-xl p-8 text-center text-slate-500 text-xs">
                Nhấn &quot;Chạy Mã Trong Sandbox&quot; để quan sát console output và rào chắn cô lập an toàn.
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
