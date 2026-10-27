import React, { useState } from 'react';
import {
  Compass,
  GitBranch,
  BookOpen,
  Play,
  RotateCcw,
  CheckCircle2,
  AlertCircle,
  Clock,
  Layers,
  ArrowRight,
  ExternalLink,
  Zap,
  ShieldCheck,
  Cpu
} from 'lucide-react';
import { LearningRouter } from '../absorption/learningRouter.ts';
import { CrossCritiqueEngine } from '../absorption/crossCritique.ts';
import { PlaybookLibrary } from '../absorption/playbookLibrary.ts';
import { CrossCritiquePipeline, TaskDomain } from '../absorption/types.ts';

interface AbsorptionPipelineViewProps {
  learningRouter: LearningRouter;
  crossCritiqueEngine: CrossCritiqueEngine;
  playbookLibrary: PlaybookLibrary;
  onRefresh: () => void;
}

export const AbsorptionPipelineView: React.FC<AbsorptionPipelineViewProps> = ({
  learningRouter,
  crossCritiqueEngine,
  playbookLibrary,
  onRefresh
}) => {
  const [activeSection, setActiveSection] = useState<'router' | 'crosscritique' | 'playbooks'>('router');

  // Router state
  const [selectedDomain, setSelectedDomain] = useState<TaskDomain>('CODING');
  const routeRec = learningRouter.recommendRoute(selectedDomain);
  const domainScores = learningRouter.getDomainScores();
  const [routerFeedbackTest, setRouterFeedbackTest] = useState<{ accepted: boolean; reason?: string } | null>(null);

  // Cross Critique state
  const [critiqueQuery, setCritiqueQuery] = useState(
    'Should we use Kafka streaming or PostgreSQL transactional outbox for audit logging under 5,000 events/sec?'
  );
  const [activePipeline, setActivePipeline] = useState<CrossCritiquePipeline | null>(null);
  const [isDebating, setIsDebating] = useState(false);

  // Playbook state
  const playbooks = playbookLibrary.getAll();
  const [playbookMessage, setPlaybookMessage] = useState<{ text: string; error?: boolean } | null>(null);

  const handleTestUnverifiedFeedback = () => {
    const res = learningRouter.recordExecutionFeedback({
      id: `fb_test_${Date.now()}`,
      taskDomain: selectedDomain,
      providerId: 'OpenAI',
      modelId: 'gpt-4o',
      modelVersion: '2024-08-06',
      toolsUsed: ['code_eval'],
      evaluatedScore: 0.99,
      latencyMs: 250,
      costUsd: 0.002,
      errorRate: 0,
      evaluatedAt: new Date().toISOString(),
      isVerifiedEvaluation: false, // UNVERIFIED!
      sampleCount: 5
    });
    setRouterFeedbackTest(res);
  };

  const handleRunCrossCritique = () => {
    setIsDebating(true);
    setTimeout(() => {
      const pipeline = crossCritiqueEngine.executeCrossCritique(
        critiqueQuery,
        'gemini-2.5-flash',
        'claude-3-5-sonnet',
        'gemini-2.5-pro'
      );
      setActivePipeline(pipeline);
      setIsDebating(false);
      onRefresh();
    }, 400);
  };

  const handleEditPlaybook = (id: string) => {
    const res = playbookLibrary.updatePlaybook(
      id,
      {
        promptTemplate: 'Enhanced SOP prompt: Enforce zero-trust boundaries and run AST security parser.',
        evaluationScore: 0.96
      },
      'lead_architect'
    );

    if (res.success) {
      setPlaybookMessage({
        text: `Playbook updated to version ${res.playbook?.version}. Previous version saved to history stack.`,
        error: false
      });
      onRefresh();
    } else {
      setPlaybookMessage({ text: res.error || 'Failed to update playbook', error: true });
    }
  };

  const handleRollbackPlaybook = (id: string) => {
    const res = playbookLibrary.rollbackPlaybook(id);
    if (res.success) {
      setPlaybookMessage({
        text: `Playbook successfully rolled back to version ${res.restoredVersion}.`,
        error: false
      });
      onRefresh();
    } else {
      setPlaybookMessage({ text: res.error || 'Failed to rollback playbook', error: true });
    }
  };

  return (
    <div className="space-y-6">
      {/* Header & Sub-Tabs */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-sm">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <Compass className="w-5 h-5 text-cyan-400" />
              <h2 className="text-xl font-bold text-white">Knowledge Absorption Pipeline</h2>
            </div>
            <p className="text-sm text-slate-400 mt-1">
              Multi-model orchestration, cross-family critique, adaptive model routing, and validated SOP playbooks.
            </p>
          </div>

          <div className="flex items-center gap-1 bg-slate-800 p-1 rounded-xl border border-slate-700">
            <button
              onClick={() => setActiveSection('router')}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                activeSection === 'router'
                  ? 'bg-cyan-600 text-white shadow-sm'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              Learning Router
            </button>
            <button
              onClick={() => setActiveSection('crosscritique')}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                activeSection === 'crosscritique'
                  ? 'bg-cyan-600 text-white shadow-sm'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              Cross-Critique Runner
            </button>
            <button
              onClick={() => setActiveSection('playbooks')}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                activeSection === 'playbooks'
                  ? 'bg-cyan-600 text-white shadow-sm'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              Playbook Library ({playbooks.length})
            </button>
          </div>
        </div>
      </div>

      {/* SECTION: LEARNING ROUTER */}
      {activeSection === 'router' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Domain Selector & Recommendation */}
            <div className="lg:col-span-2 bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-sm space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-semibold text-white flex items-center gap-2">
                  <Zap className="w-4 h-4 text-cyan-400" />
                  Live Dynamic Model Orchestration
                </h3>
                <span className="text-[11px] font-mono text-emerald-400">Zero Model Retraining</span>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 text-xs">
                {(['CODING', 'RESEARCH', 'DATA_ANALYSIS', 'VISION_MULTIMODAL', 'REASONING_STUDY'] as TaskDomain[]).map(
                  (dom) => (
                    <button
                      key={dom}
                      onClick={() => setSelectedDomain(dom)}
                      className={`p-2.5 rounded-xl border text-center transition-all ${
                        selectedDomain === dom
                          ? 'bg-cyan-950/60 border-cyan-500 text-cyan-300 font-bold'
                          : 'bg-slate-950 border-slate-800 text-slate-400 hover:border-slate-700'
                      }`}
                    >
                      {dom.replace('_', ' ')}
                    </button>
                  )
                )}
              </div>

              {/* Recommendation Card */}
              <div className="p-4 bg-slate-950 rounded-xl border border-slate-800 space-y-3 text-xs">
                <div className="flex items-center justify-between">
                  <span className="text-slate-400">Recommended Model:</span>
                  <span className="font-mono text-cyan-400 font-bold text-sm">
                    {routeRec.providerId} — {routeRec.modelId}
                  </span>
                </div>

                <p className="text-slate-300 leading-relaxed bg-slate-900/60 p-3 rounded-lg border border-slate-800/80">
                  {routeRec.recommendedReason}
                </p>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 font-mono text-[11px]">
                  <div className="p-2 bg-slate-900 rounded border border-slate-800">
                    <span className="text-slate-500 block">Fallback:</span>
                    <span className="text-slate-300">{routeRec.fallbackModelId}</span>
                  </div>
                  <div className="p-2 bg-slate-900 rounded border border-slate-800">
                    <span className="text-slate-500 block">Confidence:</span>
                    <span className="text-emerald-400 font-bold">{(routeRec.confidenceScore * 100).toFixed(0)}%</span>
                  </div>
                  <div className="p-2 bg-slate-900 rounded border border-slate-800">
                    <span className="text-slate-500 block">Est. Latency:</span>
                    <span className="text-slate-300">{routeRec.expectedLatencyMs}ms</span>
                  </div>
                  <div className="p-2 bg-slate-900 rounded border border-slate-800">
                    <span className="text-slate-500 block">Cost / 1k:</span>
                    <span className="text-slate-300">${routeRec.estimatedCostPer1kTokens.toFixed(5)}</span>
                  </div>
                </div>
              </div>

              {/* Outlier & Unverified Update Protection Test */}
              <div className="p-4 bg-slate-950/60 rounded-xl border border-slate-800 space-y-2 text-xs">
                <div className="flex items-center justify-between">
                  <span className="font-semibold text-slate-300">Router Outlier Defense Test</span>
                  <span className="text-[10px] text-slate-500 font-mono">Rejects noise and unverified ratings</span>
                </div>
                <p className="text-slate-400 text-[11px]">
                  The Learning Router requires <code className="text-cyan-300">isVerifiedEvaluation=true</code> and minimum 3 samples to adjust weights. Test sending unverified feedback:
                </p>
                <button
                  onClick={handleTestUnverifiedFeedback}
                  className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-xs text-slate-200 border border-slate-700"
                >
                  Test Unverified Evaluation Ingest
                </button>

                {routerFeedbackTest && (
                  <div
                    className={`p-2.5 rounded-lg border text-[11px] ${
                      routerFeedbackTest.accepted
                        ? 'bg-emerald-950/60 border-emerald-800 text-emerald-300'
                        : 'bg-rose-950/70 border-rose-800 text-rose-300'
                    }`}
                  >
                    {routerFeedbackTest.accepted
                      ? 'Feedback Accepted'
                      : `REJECTED: ${routerFeedbackTest.reason}`}
                  </div>
                )}
              </div>
            </div>

            {/* Historical Scoreboard */}
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-sm space-y-3">
              <h3 className="text-sm font-semibold text-white">Domain Scoring Matrix</h3>
              <p className="text-xs text-slate-400">
                Scores adjust via exponential moving average decay over verified benchmark runs:
              </p>

              <div className="space-y-2 text-xs font-mono">
                {domainScores.map((scoreItem) => (
                  <div
                    key={scoreItem.domainModel}
                    className="p-2.5 rounded-lg bg-slate-950 border border-slate-800 flex items-center justify-between"
                  >
                    <div>
                      <div className="text-slate-300 font-semibold">{scoreItem.domainModel}</div>
                      <div className="text-[10px] text-slate-500">{scoreItem.samples} verified samples</div>
                    </div>
                    <div className="text-emerald-400 font-bold text-sm">
                      {scoreItem.score.toFixed(2)}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* SECTION: CROSS-CRITIQUE RUNNER */}
      {activeSection === 'crosscritique' && (
        <div className="space-y-6">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-sm space-y-4">
            <div>
              <h3 className="text-sm font-semibold text-white flex items-center gap-2">
                <GitBranch className="w-4 h-4 text-cyan-400" />
                Cross-Critique Multi-Model Pipeline
              </h3>
              <p className="text-xs text-slate-400 mt-1">
                4-Stage workflow for complex architectural inquiries: Initial Proposal (Model A) → Cross-family Critique (Model B) → Independent Tool Verification → Synthesis.
              </p>
            </div>

            <div className="space-y-2 text-xs">
              <label className="block text-slate-400 font-medium">Complex Technical Inquiry</label>
              <textarea
                rows={3}
                value={critiqueQuery}
                onChange={(e) => setCritiqueQuery(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-white font-mono text-xs"
              />
              <button
                onClick={handleRunCrossCritique}
                disabled={isDebating}
                className="py-2.5 px-4 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white font-semibold flex items-center gap-2 shadow-sm transition-all"
              >
                <Play className="w-4 h-4" />
                <span>{isDebating ? 'Orchestrating Debate...' : 'Execute Cross-Critique Workflow'}</span>
              </button>
            </div>
          </div>

          {activePipeline && (
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-sm space-y-6">
              <h3 className="text-sm font-semibold text-white flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                Execution Trace &amp; Cross-Family Debate
              </h3>

              {/* 4 Stages Visualizer */}
              <div className="space-y-4 text-xs">
                {/* Stage 1 */}
                <div className="p-4 rounded-xl bg-slate-950 border border-cyan-800/60 space-y-2">
                  <div className="flex items-center justify-between text-cyan-400 font-semibold font-mono text-[11px]">
                    <span>STEP 1: INITIAL PROPOSAL (Google Gemini 2.5 Flash)</span>
                    <span>t+140ms</span>
                  </div>
                  <p className="text-slate-200">{activePipeline.initialResponse}</p>
                </div>

                {/* Stage 2 */}
                <div className="p-4 rounded-xl bg-slate-950 border border-amber-800/60 space-y-2">
                  <div className="flex items-center justify-between text-amber-400 font-semibold font-mono text-[11px]">
                    <span>STEP 2: CROSS-FAMILY CRITIQUE (Anthropic Claude 3.5 Sonnet)</span>
                    <span>t+380ms</span>
                  </div>
                  <p className="text-slate-200">{activePipeline.critiqueFeedback}</p>
                </div>

                {/* Stage 3 */}
                <div className="p-4 rounded-xl bg-slate-950 border border-indigo-800/60 space-y-2">
                  <div className="flex items-center justify-between text-indigo-400 font-semibold font-mono text-[11px]">
                    <span>STEP 3: INDEPENDENT TOOL FACT-CHECK (benchmark_docs_lookup)</span>
                    <span>t+510ms</span>
                  </div>
                  <div className="space-y-1">
                    {activePipeline.toolVerificationResults.map((toolRes, i) => (
                      <div key={i} className="text-slate-300 font-mono text-[11px] bg-slate-900 p-2 rounded flex items-center gap-1.5">
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                        <span>{toolRes.claim} — <span className="text-emerald-400 font-semibold">{toolRes.evidence}</span></span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Stage 4 */}
                <div className="p-4 rounded-xl bg-slate-950 border border-emerald-800/80 space-y-2">
                  <div className="flex items-center justify-between text-emerald-400 font-semibold font-mono text-[11px]">
                    <span>STEP 4: FINAL BALANCED SYNTHESIS (Google Gemini 2.5 Pro)</span>
                    <span>t+890ms</span>
                  </div>
                  <pre className="text-slate-200 whitespace-pre-wrap font-sans leading-relaxed">
                    {activePipeline.finalSynthesizedResponse}
                  </pre>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* SECTION: PLAYBOOK LIBRARY */}
      {activeSection === 'playbooks' && (
        <div className="space-y-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-sm space-y-2">
            <h3 className="text-sm font-semibold text-white flex items-center gap-2">
              <BookOpen className="w-4 h-4 text-cyan-400" />
              Validated Playbook Library &amp; Standard Operating Procedures
            </h3>
            <p className="text-xs text-slate-400">
              Battle-tested prompt templates and tool sequences with full version history and atomic rollback.
            </p>

            {playbookMessage && (
              <div
                className={`p-3 rounded-lg border text-xs mt-3 ${
                  playbookMessage.error
                    ? 'bg-rose-950/70 border-rose-800 text-rose-300'
                    : 'bg-emerald-950/70 border-emerald-800 text-emerald-300'
                }`}
              >
                {playbookMessage.text}
              </div>
            )}
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {playbooks.map((pb) => (
              <div
                key={pb.id}
                className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-sm space-y-4"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-white text-sm">{pb.name}</span>
                    <span className="px-2 py-0.5 rounded bg-cyan-950 text-cyan-300 border border-cyan-800 font-mono text-[10px]">
                      v{pb.version}
                    </span>
                  </div>
                  <span className="text-emerald-400 font-mono text-xs font-bold">
                    Score: {(pb.evaluationScore * 100).toFixed(0)}%
                  </span>
                </div>

                <div className="bg-slate-950 p-3 rounded-xl border border-slate-800 text-xs space-y-2 font-mono">
                  <span className="text-slate-500 text-[10px] block">PROMPT TEMPLATE:</span>
                  <p className="text-slate-300">{pb.promptTemplate}</p>
                  <div className="pt-2 border-t border-slate-800 text-slate-400 text-[11px]">
                    Tool Sequence: {pb.toolSequence.join(' → ')}
                  </div>
                </div>

                <div className="text-xs space-y-1">
                  <span className="text-slate-400 font-medium">Task Checklist:</span>
                  <ul className="text-slate-300 list-disc list-inside space-y-0.5 text-[11px]">
                    {pb.taskChecklist.map((task, i) => (
                      <li key={i}>{task}</li>
                    ))}
                  </ul>
                </div>

                <div className="flex items-center justify-between pt-2 border-t border-slate-800/80 text-xs">
                  <button
                    onClick={() => handleEditPlaybook(pb.id)}
                    className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 transition-colors"
                  >
                    Edit &amp; Bump Version
                  </button>

                  <button
                    onClick={() => handleRollbackPlaybook(pb.id)}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-amber-950/70 hover:bg-amber-900/70 text-amber-300 border border-amber-800 transition-colors"
                    disabled={pb.previousVersions.length === 0}
                  >
                    <RotateCcw className="w-3.5 h-3.5" />
                    <span>Rollback ({pb.previousVersions.length} in stack)</span>
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
