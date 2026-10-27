/**
 * NDAWG PRO — PART 7/8 (UNIFIED FINAL V2)
 * Main Application Shell: Real AI Chat + Sidebar + History + Plugins + Secure Admin Console
 */

import React, { useState, useMemo, useEffect, useRef } from 'react';
import { LimitsGovernor } from './governance/limitsGovernor.ts';
import { ProviderTermsRegistry } from './absorption/providerTermsRegistry.ts';
import { KnowledgeEngine } from './absorption/knowledgeEngine.ts';
import { LearningRouter } from './absorption/learningRouter.ts';
import { CrossCritiqueEngine } from './absorption/crossCritique.ts';
import { PlaybookLibrary } from './absorption/playbookLibrary.ts';
import { EvalHarnessEngine } from './evaluation/evalHarness.ts';
import { ApexOrchestrator } from './evaluation/apexOrchestrator.ts';

// Part 4 Module Intelligence & Reliable Agent Engines
import { ImageStudioEngine } from './modules/imageStudio.ts';
import { CodeLabEngine } from './modules/codeLab.ts';
import { GameIntelligenceEngine } from './modules/gameIntelligence.ts';
import { StudyCenterEngine } from './modules/studyCenter.ts';
import { WorkCenterEngine } from './modules/workCenter.ts';
import { ReliableAgentEngine } from './modules/agentEngine.ts';

// Part 6 AI Core, Reasoning, Synthesizer & Training Gate Subsystems
import { ReasoningEngine } from './core/reasoningEngine.ts';
import { KnowledgeSynthesizer } from './core/knowledgeSynthesizer.ts';
import { ToolRegistry } from './core/toolRegistry.ts';
import { TrainingGate } from './core/trainingGate.ts';
import { AiCoreService } from './core/aiCoreService.ts';

// Part 7 Components & Services
import { ChatService } from './services/chatService.ts';
import { AdminAuthService } from './services/adminAuthService.ts';
import { MainChatView } from './components/MainChatView.tsx';
import { Sidebar } from './components/Sidebar.tsx';
import { AdminLoginModal } from './components/AdminLoginModal.tsx';
import { PluginCenterModal } from './components/PluginCenterModal.tsx';
import { AdminConsoleView } from './components/AdminConsoleView.tsx';
import { ActiveNavTab } from './components/Navbar.tsx';

import { ChatConversation, AdminSession, ChatAttachment } from './types/chat.ts';
import { ExecutionContext, UserRole } from './governance/types.ts';

export default function App() {
  // Authoritative Governor & Security Instances
  const [governor] = useState(() => {
    const gov = new LimitsGovernor();
    const genesisCtx: ExecutionContext = {
      requestId: 'req_genesis_init',
      actorId: 'system_root',
      role: 'ADMIN',
      depth: 0,
      stepCount: 0,
      modelCallsCount: 0,
      toolCallsCount: 0,
      startTime: Date.now() - 60000,
      accumulatedCostUsd: 0,
      callHistory: []
    };
    gov.evaluate(genesisCtx, {
      id: 'act_genesis',
      name: 'system_bootstrap',
      tier: 'TIER_1_READ',
      targetProviderOrTool: 'security_governor_core',
      type: 'MODEL_CALL',
      inputPayload: { status: 'INITIALIZING_GOVERNANCE_LAYER' },
      estimatedCostUsd: 0.001,
      isReversible: true
    });
    return gov;
  });

  // Part 2 Absorption & Knowledge Subsystems
  const [termsRegistry] = useState(() => new ProviderTermsRegistry());
  const [knowledgeEngine] = useState(() => new KnowledgeEngine());
  const [learningRouter] = useState(() => new LearningRouter());
  const [crossCritiqueEngine] = useState(() => new CrossCritiqueEngine());
  const [playbookLibrary] = useState(() => new PlaybookLibrary());

  // Part 3 Evaluation Harness & Apex Orchestrator
  const [evalHarness] = useState(() => new EvalHarnessEngine());
  const [orchestrator] = useState(() => new ApexOrchestrator(governor, termsRegistry, evalHarness));

  // Part 4 Module Intelligence & Reliable Agent Subsystems
  const [imageStudio] = useState(() => new ImageStudioEngine());
  const [codeLab] = useState(() => new CodeLabEngine());
  const [gameIntelligence] = useState(() => new GameIntelligenceEngine());
  const [studyCenter] = useState(() => new StudyCenterEngine());
  const [workCenter] = useState(() => new WorkCenterEngine());
  const [agentEngine] = useState(() => new ReliableAgentEngine(governor));

  // Part 6 AI Core, Reasoning, Synthesizer & Training Gate Subsystems
  const [reasoningEngine] = useState(() => new ReasoningEngine());
  const [knowledgeSynthesizer] = useState(() => new KnowledgeSynthesizer());
  const [toolRegistry] = useState(() => new ToolRegistry());
  const [trainingGate] = useState(() => new TrainingGate());
  const [aiCore] = useState(
    () =>
      new AiCoreService(
        governor,
        orchestrator,
        reasoningEngine,
        knowledgeSynthesizer,
        toolRegistry,
        trainingGate
      )
  );

  // App Navigation & Modal States
  // 'chat' is the default view as requested in Part 7
  const [currentView, setCurrentView] = useState<'chat' | 'admin'>('chat');
  const [activeAdminTab, setActiveAdminTab] = useState<ActiveNavTab>('dashboard');
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [adminModalOpen, setAdminModalOpen] = useState(false);
  const [pluginModalOpen, setPluginModalOpen] = useState(false);
  const [role, setRole] = useState<UserRole>('ADMIN');

  // Part 7 Chat Service & History State
  const chatService = useMemo(() => ChatService.getInstance(), []);
  const authService = useMemo(() => AdminAuthService.getInstance(), []);

  const [conversations, setConversations] = useState<ChatConversation[]>(() => chatService.getConversations());
  const [activeConversationId, setActiveConversationId] = useState<string>(() => chatService.getActiveConversationId(conversations));
  const [adminSession, setAdminSession] = useState<AdminSession>(() => authService.getSession());
  const [isLoading, setIsLoading] = useState(false);

  // Synchronize active conversation object
  const activeConversation = useMemo(() => {
    return conversations.find((c) => c.id === activeConversationId) || conversations[0] || chatService.createConversation();
  }, [conversations, activeConversationId, chatService]);

  // Persist conversation updates
  const updateConversationState = (updated: ChatConversation) => {
    setConversations((prev) => {
      const idx = prev.findIndex((c) => c.id === updated.id);
      let next: ChatConversation[];
      if (idx >= 0) {
        next = [...prev];
        next[idx] = updated;
      } else {
        next = [updated, ...prev];
      }
      chatService.saveConversations(next);
      return next;
    });
  };

  // Chat Actions
  const abortControllerRef = useRef<AbortController | null>(null);

  const handleSendMessage = async (input: string | { text: string; attachments?: ChatAttachment[] }) => {
    const rawText = typeof input === 'string' ? input.trim() : (input.text || '').trim();
    const hasAtt = typeof input === 'object' && input.attachments && input.attachments.length > 0;
    if ((!rawText && !hasAtt) || isLoading) return;

    setIsLoading(true);
    abortControllerRef.current = new AbortController();

    try {
      const { conversation: updatedConv } = await chatService.sendMessage(
        activeConversation,
        input,
        abortControllerRef.current.signal
      );
      updateConversationState(updatedConv);
    } catch (e) {
      console.error('Failed to send message:', e);
    } finally {
      setIsLoading(false);
      abortControllerRef.current = null;
    }
  };

  const handleStopGeneration = () => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
  };

  const handleNewChat = () => {
    const newConv = chatService.createConversation();
    const updated = [newConv, ...conversations];
    setConversations(updated);
    chatService.saveConversations(updated);
    setActiveConversationId(newConv.id);
    chatService.setActiveConversationId(newConv.id);
    setCurrentView('chat');
  };

  const handleDeleteConversation = (id: string) => {
    const remaining = conversations.filter((c) => c.id !== id);
    if (remaining.length === 0) {
      const fresh = chatService.createConversation();
      setConversations([fresh]);
      chatService.saveConversations([fresh]);
      setActiveConversationId(fresh.id);
      chatService.setActiveConversationId(fresh.id);
    } else {
      setConversations(remaining);
      chatService.saveConversations(remaining);
      if (activeConversationId === id) {
        setActiveConversationId(remaining[0].id);
        chatService.setActiveConversationId(remaining[0].id);
      }
    }
  };

  const handleRenameConversation = (id: string, newTitle: string) => {
    setConversations((prev) => {
      const next = prev.map((c) => (c.id === id ? { ...c, title: newTitle, updatedAt: Date.now() } : c));
      chatService.saveConversations(next);
      return next;
    });
  };

  const handleClearChat = () => {
    const cleared: ChatConversation = {
      ...activeConversation,
      messages: [],
      totalTokens: 0,
      totalCostUsd: 0,
      updatedAt: Date.now()
    };
    updateConversationState(cleared);
  };

  const handleTogglePlugin = (pluginId: string) => {
    const currentEnabled = activeConversation.enabledPluginIds || [];
    const exists = currentEnabled.includes(pluginId);
    const updatedPluginIds = exists
      ? currentEnabled.filter((id) => id !== pluginId)
      : [...currentEnabled, pluginId];

    const updated: ChatConversation = {
      ...activeConversation,
      enabledPluginIds: updatedPluginIds,
      updatedAt: Date.now()
    };
    updateConversationState(updated);
  };

  const handleSelectModel = (model: string) => {
    const updated: ChatConversation = {
      ...activeConversation,
      model,
      updatedAt: Date.now()
    };
    updateConversationState(updated);
  };

  const handleSelectConversation = (id: string) => {
    setActiveConversationId(id);
    chatService.setActiveConversationId(id);
    setCurrentView('chat');
  };

  // Admin Auth Handlers
  const handleAdminLoginSuccess = () => {
    setAdminSession(authService.getSession());
    setRole('ADMIN');
    setCurrentView('admin');
  };

  const handleAdminLogout = async () => {
    await authService.logout();
    setAdminSession(authService.getSession());
    setRole('USER');
    setCurrentView('chat');
  };

  // Module Navigation Handlers
  const handleNavigateModule = (moduleTab: string) => {
    // Direct access to user features (Workspace, Bioscience, 3D Game) or admin if authenticated
    setActiveAdminTab(moduleTab as ActiveNavTab);
    const isPublicModule = ['workspace', 'bioscience', 'game3d'].includes(moduleTab);
    if (adminSession.isAuthenticated || isPublicModule) {
      setCurrentView('admin');
    } else {
      setAdminModalOpen(true);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans selection:bg-cyan-500/30 selection:text-cyan-200">
      {/* Slide-out Sidebar */}
      <Sidebar
        isOpen={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
        conversations={conversations}
        activeConversationId={activeConversationId}
        onSelectConversation={handleSelectConversation}
        onNewChat={handleNewChat}
        onDeleteConversation={handleDeleteConversation}
        onRenameConversation={handleRenameConversation}
        onOpenPluginCenter={() => setPluginModalOpen(true)}
        onOpenAdminLogin={() => setAdminModalOpen(true)}
        onOpenAdminConsole={() => setCurrentView('admin')}
        adminSession={adminSession}
        onAdminLogout={handleAdminLogout}
        onNavigateModule={handleNavigateModule}
      />

      {/* Main View Router */}
      {currentView === 'chat' ? (
        <MainChatView
          conversation={activeConversation}
          onSendMessage={handleSendMessage}
          onClearChat={handleClearChat}
          onOpenSidebar={() => setSidebarOpen(true)}
          onOpenPluginCenter={() => setPluginModalOpen(true)}
          onOpenAdminConsole={adminSession.isAuthenticated ? () => setCurrentView('admin') : undefined}
          onOpenWorkspace={() => handleNavigateModule('workspace')}
          onSelectModel={handleSelectModel}
          isAdminAuthenticated={adminSession.isAuthenticated}
          isLoading={isLoading}
          onStopGeneration={handleStopGeneration}
        />
      ) : (
        <AdminConsoleView
          onBackToChat={() => setCurrentView('chat')}
          onLogout={handleAdminLogout}
          role={role}
          setRole={setRole}
          governor={governor}
          termsRegistry={termsRegistry}
          knowledgeEngine={knowledgeEngine}
          learningRouter={learningRouter}
          crossCritiqueEngine={crossCritiqueEngine}
          playbookLibrary={playbookLibrary}
          evalHarness={evalHarness}
          orchestrator={orchestrator}
          imageStudio={imageStudio}
          codeLab={codeLab}
          gameIntelligence={gameIntelligence}
          studyCenter={studyCenter}
          workCenter={workCenter}
          agentEngine={agentEngine}
          reasoningEngine={reasoningEngine}
          knowledgeSynthesizer={knowledgeSynthesizer}
          trainingGate={trainingGate}
          aiCore={aiCore}
          initialTab={activeAdminTab}
        />
      )}

      {/* Admin Login Modal */}
      <AdminLoginModal
        isOpen={adminModalOpen}
        onClose={() => setAdminModalOpen(false)}
        onSuccess={handleAdminLoginSuccess}
      />

      {/* Plugin Center Modal */}
      <PluginCenterModal
        isOpen={pluginModalOpen}
        onClose={() => setPluginModalOpen(false)}
        enabledPluginIds={activeConversation.enabledPluginIds || []}
        onTogglePlugin={handleTogglePlugin}
      />
    </div>
  );
}
