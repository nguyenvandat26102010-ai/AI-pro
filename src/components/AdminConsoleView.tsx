/**
 * NDAWG PRO — PART 7/8 (UNIFIED FINAL V2)
 * Admin Console View
 * Authenticated administration portal housing all Part 1-6 subsystems & governance tools
 */

import React, { useState } from 'react';
import { 
  ArrowLeft, 
  ShieldCheck, 
  Cpu, 
  Gauge, 
  Lock, 
  LogOut, 
  Activity, 
  Layers, 
  BookOpen, 
  FileCheck, 
  Database,
  Sparkles
} from 'lucide-react';
import { Navbar, ActiveNavTab } from './Navbar.tsx';
import { LimitsDashboard } from './LimitsDashboard.tsx';
import { EvalHarnessView } from './EvalHarnessView.tsx';
import { ModelScorecardView } from './ModelScorecardView.tsx';
import { ApexOrchestratorView } from './ApexOrchestratorView.tsx';
import { ProviderTermsView } from './ProviderTermsView.tsx';
import { VerifiedKnowledgeView } from './VerifiedKnowledgeView.tsx';
import { AbsorptionPipelineView } from './AbsorptionPipelineView.tsx';
import { CapabilityRegistryView } from './CapabilityRegistryView.tsx';
import { AuditLogView } from './AuditLogView.tsx';
import { PolicyAndKillSwitches } from './PolicyAndKillSwitches.tsx';
import { AuditReportP0 } from './AuditReportP0.tsx';

// Part 4 UI Components
import { ImageStudioView } from './ImageStudioView.tsx';
import { CodeLabView } from './CodeLabView.tsx';
import { GameIntelligenceView } from './GameIntelligenceView.tsx';
import { StudyCenterView } from './StudyCenterView.tsx';
import { WorkCenterView } from './WorkCenterView.tsx';
import { AgentEngineView } from './AgentEngineView.tsx';

// Part 6, 7 & 8 UI Components
import { AiCoreView } from './AiCoreView.tsx';
import { ReasoningEngineView } from './ReasoningEngineView.tsx';
import { KnowledgeSynthesizerView } from './KnowledgeSynthesizerView.tsx';
import { KnowledgeCardsView } from './KnowledgeCardsView.tsx';
import { Part7ProductIntegrationView } from './Part7ProductIntegrationView.tsx';
import { Part8MultilingualVoiceView } from './Part8MultilingualVoiceView.tsx';
import { FinalAcceptanceReportView } from './FinalAcceptanceReportView.tsx';
import { UniversalKnowledgeView } from './UniversalKnowledgeView.tsx';
import { V14AdaptiveFrontierView } from './V14AdaptiveFrontierView.tsx';
import { WorkspaceHubView } from './WorkspaceHubView.tsx';
import { BioscienceHubView } from './BioscienceHubView.tsx';
import { Apex3DGameView } from './Apex3DGameView.tsx';

import { UserRole, ExecutionContext, ProposedAction } from '../governance/types.ts';

interface AdminConsoleViewProps {
  onBackToChat: () => void;
  onLogout: () => void;
  role: UserRole;
  setRole: (role: UserRole) => void;
  governor: any;
  termsRegistry: any;
  knowledgeEngine: any;
  learningRouter: any;
  crossCritiqueEngine: any;
  playbookLibrary: any;
  evalHarness: any;
  orchestrator: any;
  imageStudio: any;
  codeLab: any;
  gameIntelligence: any;
  studyCenter: any;
  workCenter: any;
  agentEngine: any;
  reasoningEngine: any;
  knowledgeSynthesizer: any;
  trainingGate: any;
  aiCore: any;
  initialTab?: ActiveNavTab;
}

export function AdminConsoleView({
  onBackToChat,
  onLogout,
  role,
  setRole,
  governor,
  termsRegistry,
  knowledgeEngine,
  learningRouter,
  crossCritiqueEngine,
  playbookLibrary,
  evalHarness,
  orchestrator,
  imageStudio,
  codeLab,
  gameIntelligence,
  studyCenter,
  workCenter,
  agentEngine,
  reasoningEngine,
  knowledgeSynthesizer,
  trainingGate,
  aiCore,
  initialTab = 'dashboard'
}: AdminConsoleViewProps) {
  const [activeTab, setActiveTab] = useState<ActiveNavTab>(initialTab);
  const [updateCounter, setUpdateCounter] = useState(0);
  const triggerRefresh = () => setUpdateCounter((c) => c + 1);

  // Read current governor state
  const policy = governor.getPolicy();
  const killSwitches = governor.getKillSwitches();
  const circuitBreaker = governor.getCircuitBreaker();
  const auditLog = governor.getAuditLog();
  const userDailySpend = governor.getUserDailySpend('analyst_lead_01');

  // Actions
  const handleEvaluateAction = (context: ExecutionContext, action: ProposedAction) => {
    const decision = governor.evaluate(context, action);
    triggerRefresh();
    return decision;
  };

  const handleRecordSuccess = (context: ExecutionContext, action: ProposedAction, durationMs: number) => {
    governor.recordExecutionSuccess(context, action, durationMs);
    triggerRefresh();
  };

  const handleRecordError = (errorDesc: string) => {
    governor.reportExecutionError(errorDesc);
    triggerRefresh();
  };

  const handleResetCircuitBreaker = () => {
    const res = governor.resetCircuitBreaker(role);
    triggerRefresh();
    return res;
  };

  const handleToggleKillSwitch = (
    type: 'global' | 'provider' | 'tool',
    target: string,
    disabled: boolean
  ) => {
    const res = governor.setKillSwitch(type, target, disabled, role);
    triggerRefresh();
    return res;
  };

  const handleUpdatePolicy = (
    newPolicy: Parameters<typeof governor.updatePolicy>[0],
    adminKey: string
  ) => {
    const res = governor.updatePolicy(newPolicy, role, adminKey);
    triggerRefresh();
    return res;
  };

  const handleVerifyChain = () => {
    return governor.verifyAuditChain();
  };

  const handleSimulateTamper = (index: number) => {
    governor.simulateTampering(index, 'MALICIOUS_TAMPERED_LOG_ENTRY_TEST');
    triggerRefresh();
  };

  const handleResetLedger = () => {
    triggerRefresh();
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans">
      {/* Top Bar with Return to Chat & Admin status */}
      <div className="sticky top-0 z-50 bg-slate-900 border-b border-slate-800 px-4 py-2.5 flex items-center justify-between shadow-lg">
        <div className="flex items-center gap-3">
          <button
            onClick={onBackToChat}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-cyan-950/80 border border-cyan-800/80 text-cyan-300 hover:bg-cyan-900 text-xs font-semibold transition-colors cursor-pointer"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Quay lại Chat</span>
          </button>

          <div className="h-4 w-px bg-slate-800" />

          <div className="flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-emerald-400" />
            <span className="text-xs font-bold text-slate-200">BẢNG ĐIỀU KHIỂN QUẢN TRỊ VIÊN (ADMIN CONSOLE)</span>
            <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-950 text-emerald-400 border border-emerald-800/50">
              ĐÃ XÁC THỰC
            </span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={onLogout}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-rose-950 hover:text-rose-300 text-slate-300 text-xs font-medium transition-colors cursor-pointer"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span>Đăng xuất</span>
          </button>
        </div>
      </div>

      {/* Embedded Existing Navbar for all 18+ sub-views */}
      <Navbar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        circuitBreaker={circuitBreaker}
        killSwitches={killSwitches}
        role={role}
        setRole={setRole}
      />

      {/* Main Subsystem Content */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* Bioscience Hub (DeepMind Science Suite) */}
        {activeTab === 'bioscience' && <BioscienceHubView />}

        {/* Three.js 3D Orbital Recon Game */}
        {activeTab === 'game3d' && <Apex3DGameView onBackToConsole={() => setActiveTab('dashboard')} />}

        {/* Google Workspace & Cloud Firestore Hub */}
        {activeTab === 'workspace' && <WorkspaceHubView />}

        {/* V14 Adaptive Frontier Intelligence Hub */}
        {activeTab === 'v14adaptive' && <V14AdaptiveFrontierView onBackToChat={onBackToChat} />}

        {/* V9 Universal Knowledge Fabric View */}
        {activeTab === 'universalknowledge' && <UniversalKnowledgeView onBackToChat={onBackToChat} />}

        {/* Part 6 AI Core Views */}
        {activeTab === 'aicore' && <AiCoreView aiCore={aiCore} role={role} />}
        {activeTab === 'reasoning' && <ReasoningEngineView reasoningEngine={reasoningEngine} />}
        {activeTab === 'synthesizer' && <KnowledgeSynthesizerView knowledgeSynthesizer={knowledgeSynthesizer} />}
        {activeTab === 'knowledgecards' && <KnowledgeCardsView trainingGate={trainingGate} />}
        {activeTab === 'part7product' && <Part7ProductIntegrationView aiCore={aiCore} role={role} />}
        {activeTab === 'part8voice' && <Part8MultilingualVoiceView aiCore={aiCore} />}
        {activeTab === 'finalreport' && <FinalAcceptanceReportView />}

        {/* Part 4 Views */}
        {activeTab === 'agent' && <AgentEngineView agentEngine={agentEngine} />}
        {activeTab === 'imagestudio' && <ImageStudioView imageStudio={imageStudio} />}
        {activeTab === 'codelab' && <CodeLabView codeLab={codeLab} />}
        {activeTab === 'game' && <GameIntelligenceView gameIntelligence={gameIntelligence} />}
        {activeTab === 'study' && <StudyCenterView studyCenter={studyCenter} />}
        {activeTab === 'work' && <WorkCenterView workCenter={workCenter} />}

        {/* Part 3 Views */}
        {activeTab === 'eval' && <EvalHarnessView evalHarness={evalHarness} />}
        {activeTab === 'scorecard' && <ModelScorecardView evalHarness={evalHarness} />}
        {activeTab === 'orchestrator' && <ApexOrchestratorView orchestrator={orchestrator} />}

        {/* Part 1 & 2 Views */}
        {activeTab === 'dashboard' && (
          <LimitsDashboard
            policy={policy}
            circuitBreaker={circuitBreaker}
            killSwitches={killSwitches}
            role={role}
            userDailySpend={userDailySpend}
            onEvaluateAction={handleEvaluateAction}
            onRecordSuccess={handleRecordSuccess}
            onRecordError={handleRecordError}
            onResetCircuitBreaker={handleResetCircuitBreaker}
          />
        )}

        {activeTab === 'terms' && (
          <ProviderTermsView
            termsRegistry={termsRegistry}
            role={role}
            onRefresh={triggerRefresh}
          />
        )}

        {activeTab === 'knowledge' && (
          <VerifiedKnowledgeView
            knowledgeEngine={knowledgeEngine}
            termsRegistry={termsRegistry}
            role={role}
            onRefresh={triggerRefresh}
          />
        )}

        {activeTab === 'absorption' && (
          <AbsorptionPipelineView
            learningRouter={learningRouter}
            crossCritiqueEngine={crossCritiqueEngine}
            playbookLibrary={playbookLibrary}
            onRefresh={triggerRefresh}
          />
        )}

        {activeTab === 'registry' && <CapabilityRegistryView />}

        {activeTab === 'audit' && (
          <AuditLogView
            auditLog={auditLog}
            onVerifyChain={handleVerifyChain}
            onSimulateTamper={handleSimulateTamper}
            onResetLedger={handleResetLedger}
          />
        )}

        {activeTab === 'policy' && (
          <PolicyAndKillSwitches
            policy={policy}
            killSwitches={killSwitches}
            circuitBreaker={circuitBreaker}
            role={role}
            onToggleKillSwitch={handleToggleKillSwitch}
            onResetCircuitBreaker={handleResetCircuitBreaker}
            onUpdatePolicy={handleUpdatePolicy}
          />
        )}

        {activeTab === 'p0report' && <AuditReportP0 />}
      </main>

      <footer className="border-t border-slate-900 bg-slate-950/80 py-4 text-center text-xs text-slate-500 font-mono">
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-2">
          <span>NDAWG PRO APEX ADMIN CONSOLE — PART 7/8 SECURE ACCESS</span>
          <span className="text-slate-400">
            DETERMINISTIC LIMITS • CRYPTOGRAPHIC AUDIT • REASONING ENGINE • MULTI-MODEL SYNTHESIZER
          </span>
        </div>
      </footer>
    </div>
  );
}
