import React from 'react';
import {
  Shield,
  Activity,
  Sliders,
  Database,
  FileText,
  AlertTriangle,
  FileCheck2,
  Compass,
  GitBranch,
  BarChart3,
  Zap,
  Layers,
  Image as ImageIcon,
  Code,
  Gamepad2,
  GraduationCap,
  Briefcase,
  Cpu,
  Brain,
  GitMerge,
  BookOpen,
  Globe,
  Dna
} from 'lucide-react';
import { CircuitBreakerState, KillSwitchState, UserRole } from '../governance/types.ts';

export type ActiveNavTab =
  | 'bioscience'
  | 'game3d'
  | 'workspace'
  | 'v14adaptive'
  | 'universalknowledge'
  | 'aicore'
  | 'reasoning'
  | 'synthesizer'
  | 'knowledgecards'
  | 'part7product'
  | 'part8voice'
  | 'finalreport'
  | 'agent'
  | 'imagestudio'
  | 'codelab'
  | 'game'
  | 'study'
  | 'work'
  | 'eval'
  | 'scorecard'
  | 'orchestrator'
  | 'terms'
  | 'knowledge'
  | 'absorption'
  | 'dashboard'
  | 'registry'
  | 'audit'
  | 'policy'
  | 'p0report';

interface NavbarProps {
  activeTab: ActiveNavTab;
  setActiveTab: (tab: ActiveNavTab) => void;
  circuitBreaker: CircuitBreakerState;
  killSwitches: KillSwitchState;
  role: UserRole;
  setRole: (role: UserRole) => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  activeTab,
  setActiveTab,
  circuitBreaker,
  killSwitches,
  role,
  setRole
}) => {
  return (
    <header className="bg-slate-900 border-b border-slate-800 text-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Brand Logo & Version */}
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-cyan-500 via-indigo-600 to-amber-500 flex items-center justify-center shadow-lg shadow-cyan-500/20 ring-1 ring-cyan-400/30">
              <Shield className="w-5 h-5 text-white" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-bold text-lg tracking-tight bg-gradient-to-r from-white via-slate-100 to-slate-400 bg-clip-text text-transparent">
                  NDAWG PRO
                </span>
                <span className="text-[11px] font-mono px-2 py-0.5 rounded-full bg-cyan-950 text-cyan-300 border border-cyan-800/80 font-bold">
                  APEX V9 INFINITY
                </span>
              </div>
              <p className="text-xs text-slate-400 hidden sm:block">
                AI Core • 15 Miền Tri Thức • 13 Hợp Đồng • Verified Reasoning • Frontier AI
              </p>
            </div>
          </div>

          {/* Navigation Links */}
          <nav className="flex items-center gap-1 overflow-x-auto py-2 mx-4 scrollbar-thin">
            {/* V14 Adaptive Frontier AI Hub */}
            {/* Bioscience Hub (DeepMind Science Suite) */}
            <button
              onClick={() => setActiveTab('bioscience')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold whitespace-nowrap transition-all ${
                activeTab === 'bioscience'
                  ? 'bg-gradient-to-r from-emerald-600 to-teal-700 text-white shadow-md ring-1 ring-emerald-400'
                  : 'text-emerald-300 hover:text-white hover:bg-slate-800'
              }`}
            >
              <Dna className="w-3.5 h-3.5 text-emerald-300" />
              <span>Bioscience (AlphaFold/PubChem)</span>
            </button>

            {/* Three.js 3D Arena & Recon Game */}
            <button
              onClick={() => setActiveTab('game3d')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold whitespace-nowrap transition-all ${
                activeTab === 'game3d'
                  ? 'bg-gradient-to-r from-indigo-600 via-sky-600 to-cyan-600 text-white shadow-md ring-1 ring-cyan-400'
                  : 'text-sky-300 hover:text-white hover:bg-slate-800'
              }`}
            >
              <Gamepad2 className="w-3.5 h-3.5 text-sky-300" />
              <span>Three.js 3D Game (Orbital Recon)</span>
            </button>

            {/* Google Workspace & Cloud Firestore Hub */}
            <button
              onClick={() => setActiveTab('workspace')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold whitespace-nowrap transition-all ${
                activeTab === 'workspace'
                  ? 'bg-gradient-to-r from-emerald-600 via-teal-600 to-cyan-600 text-white shadow-md ring-1 ring-emerald-400'
                  : 'text-emerald-300 hover:text-white hover:bg-slate-800'
              }`}
            >
              <Briefcase className="w-3.5 h-3.5 text-emerald-300" />
              <span>Google Workspace (Tasks/Drive/Chat)</span>
            </button>

            {/* V14 Adaptive Frontier Intelligence */}
            <button
              onClick={() => setActiveTab('v14adaptive')}
              className={`flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-bold whitespace-nowrap transition-all ${
                activeTab === 'v14adaptive'
                  ? 'bg-gradient-to-r from-cyan-500 via-sky-600 to-indigo-600 text-white shadow-md ring-1 ring-cyan-400'
                  : 'text-cyan-200 hover:text-white hover:bg-slate-800'
              }`}
            >
              <Zap className="w-3.5 h-3.5 text-amber-300" />
              <span>V14 Frontier AI</span>
            </button>

            {/* V9 Universal Knowledge Fabric */}
            <button
              onClick={() => setActiveTab('universalknowledge')}
              className={`flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-bold whitespace-nowrap transition-all ${
                activeTab === 'universalknowledge'
                  ? 'bg-gradient-to-r from-cyan-600 to-indigo-600 text-white shadow-md ring-1 ring-cyan-400'
                  : 'text-cyan-300 hover:text-white hover:bg-slate-800'
              }`}
            >
              <Globe className="w-3.5 h-3.5" />
              <span>V9 Tri thức Nhân loại</span>
            </button>

            {/* Part 6 Priority Hubs */}
            <button
              onClick={() => setActiveTab('aicore')}
              className={`flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-all ${
                activeTab === 'aicore'
                  ? 'bg-cyan-600 text-white shadow-sm ring-1 ring-cyan-400'
                  : 'text-cyan-300 hover:text-white hover:bg-slate-800'
              }`}
            >
              <Cpu className="w-3.5 h-3.5" />
              <span>AI Core (13 Contracts)</span>
            </button>

            <button
              onClick={() => setActiveTab('reasoning')}
              className={`flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-all ${
                activeTab === 'reasoning'
                  ? 'bg-indigo-600 text-white shadow-sm ring-1 ring-indigo-400'
                  : 'text-indigo-300 hover:text-white hover:bg-slate-800'
              }`}
            >
              <Brain className="w-3.5 h-3.5" />
              <span>Giải - Kiểm - Sửa</span>
            </button>

            <button
              onClick={() => setActiveTab('synthesizer')}
              className={`flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-all ${
                activeTab === 'synthesizer'
                  ? 'bg-amber-600 text-white shadow-sm ring-1 ring-amber-400'
                  : 'text-amber-300 hover:text-white hover:bg-slate-800'
              }`}
            >
              <GitMerge className="w-3.5 h-3.5" />
              <span>Synthesizer (Gate)</span>
            </button>

            <button
              onClick={() => setActiveTab('knowledgecards')}
              className={`flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-all ${
                activeTab === 'knowledgecards'
                  ? 'bg-amber-700 text-white shadow-sm'
                  : 'text-amber-200 hover:text-white hover:bg-slate-800'
              }`}
            >
              <BookOpen className="w-3.5 h-3.5" />
              <span>Knowledge Cards (Tầng C)</span>
            </button>

            <button
              onClick={() => setActiveTab('part7product')}
              className={`flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-all ${
                activeTab === 'part7product'
                  ? 'bg-emerald-600 text-white shadow-sm'
                  : 'text-emerald-300 hover:text-white hover:bg-slate-800'
              }`}
            >
              <Layers className="w-3.5 h-3.5" />
              <span>Part 7 Product</span>
            </button>

            <button
              onClick={() => setActiveTab('part8voice')}
              className={`flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-all ${
                activeTab === 'part8voice'
                  ? 'bg-indigo-600 text-white shadow-sm'
                  : 'text-indigo-300 hover:text-white hover:bg-slate-800'
              }`}
            >
              <Globe className="w-3.5 h-3.5" />
              <span>Part 8 Language &amp; Voice</span>
            </button>

            <button
              onClick={() => setActiveTab('finalreport')}
              className={`flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-bold whitespace-nowrap transition-all ${
                activeTab === 'finalreport'
                  ? 'bg-emerald-600 text-white shadow-sm ring-1 ring-emerald-400'
                  : 'text-emerald-400 hover:text-white hover:bg-slate-800'
              }`}
            >
              <FileCheck2 className="w-3.5 h-3.5" />
              <span>Final Acceptance Audit</span>
            </button>

            <div className="w-px h-5 bg-slate-800 mx-1 shrink-0" />

            {/* Part 4 Priority Modules */}
            <button
              onClick={() => setActiveTab('agent')}
              className={`flex items-center gap-1 px-2 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-all ${
                activeTab === 'agent'
                  ? 'bg-amber-600 text-white shadow-sm'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800'
              }`}
            >
              <Zap className="w-3.5 h-3.5" />
              <span>Reliable Agent</span>
            </button>

            <button
              onClick={() => setActiveTab('imagestudio')}
              className={`flex items-center gap-1 px-2 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-all ${
                activeTab === 'imagestudio'
                  ? 'bg-cyan-600 text-white shadow-sm'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800'
              }`}
            >
              <ImageIcon className="w-3.5 h-3.5" />
              <span>Image Studio</span>
            </button>

            <button
              onClick={() => setActiveTab('codelab')}
              className={`flex items-center gap-1 px-2 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-all ${
                activeTab === 'codelab'
                  ? 'bg-indigo-600 text-white shadow-sm'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800'
              }`}
            >
              <Code className="w-3.5 h-3.5" />
              <span>Code Lab</span>
            </button>

            <button
              onClick={() => setActiveTab('game')}
              className={`flex items-center gap-1 px-2 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-all ${
                activeTab === 'game'
                  ? 'bg-amber-600 text-white shadow-sm'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800'
              }`}
            >
              <Gamepad2 className="w-3.5 h-3.5" />
              <span>Game Intel</span>
            </button>

            <button
              onClick={() => setActiveTab('study')}
              className={`flex items-center gap-1 px-2 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-all ${
                activeTab === 'study'
                  ? 'bg-emerald-600 text-white shadow-sm'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800'
              }`}
            >
              <GraduationCap className="w-3.5 h-3.5" />
              <span>Study Center</span>
            </button>

            <button
              onClick={() => setActiveTab('work')}
              className={`flex items-center gap-1 px-2 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-all ${
                activeTab === 'work'
                  ? 'bg-indigo-600 text-white shadow-sm'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800'
              }`}
            >
              <Briefcase className="w-3.5 h-3.5" />
              <span>Work Center</span>
            </button>

            <div className="w-px h-5 bg-slate-800 mx-1 shrink-0" />

            {/* Governance & Subsystems */}
            <button
              onClick={() => setActiveTab('eval')}
              className={`flex items-center gap-1 px-2 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-all ${
                activeTab === 'eval'
                  ? 'bg-cyan-600 text-white shadow-sm'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800'
              }`}
            >
              <span>Eval</span>
            </button>

            <button
              onClick={() => setActiveTab('scorecard')}
              className={`flex items-center gap-1 px-2 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-all ${
                activeTab === 'scorecard'
                  ? 'bg-cyan-600 text-white shadow-sm'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800'
              }`}
            >
              <span>Scorecard</span>
            </button>

            <button
              onClick={() => setActiveTab('orchestrator')}
              className={`flex items-center gap-1 px-2 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-all ${
                activeTab === 'orchestrator'
                  ? 'bg-cyan-600 text-white shadow-sm'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800'
              }`}
            >
              <span>Orchestrator</span>
            </button>

            <button
              onClick={() => setActiveTab('terms')}
              className={`flex items-center gap-1 px-2 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-all ${
                activeTab === 'terms'
                  ? 'bg-cyan-600 text-white shadow-sm'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800'
              }`}
            >
              <span>Terms</span>
            </button>

            <button
              onClick={() => setActiveTab('dashboard')}
              className={`flex items-center gap-1 px-2 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-all ${
                activeTab === 'dashboard'
                  ? 'bg-cyan-600 text-white shadow-sm'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800'
              }`}
            >
              <Activity className="w-3.5 h-3.5" />
              <span>Limits</span>
            </button>

            <button
              onClick={() => setActiveTab('audit')}
              className={`flex items-center gap-1 px-2 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-all ${
                activeTab === 'audit'
                  ? 'bg-cyan-600 text-white shadow-sm'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800'
              }`}
            >
              <FileText className="w-3.5 h-3.5" />
              <span>Audit Chain</span>
            </button>

            <button
              onClick={() => setActiveTab('policy')}
              className={`flex items-center gap-1 px-2 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-all ${
                activeTab === 'policy'
                  ? 'bg-cyan-600 text-white shadow-sm'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800'
              }`}
            >
              <Sliders className="w-3.5 h-3.5" />
              <span>Policy</span>
            </button>
          </nav>

          {/* System Status Indicators & Role Toggle */}
          <div className="flex items-center gap-3 shrink-0">
            {circuitBreaker.isOpen ? (
              <div className="flex items-center gap-1.5 px-2 py-1 rounded-md bg-rose-950/80 border border-rose-800 text-rose-300 text-xs font-mono animate-pulse">
                <AlertTriangle className="w-3.5 h-3.5 text-rose-400" />
                <span className="hidden sm:inline">TRIPPED</span>
              </div>
            ) : (
              <div className="hidden lg:flex items-center gap-1.5 px-2 py-1 rounded-md bg-emerald-950/60 border border-emerald-800/80 text-emerald-400 text-xs font-mono">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span>
                <span>OK</span>
              </div>
            )}

            {/* Role Switcher */}
            <div className="flex items-center bg-slate-800 rounded-lg p-0.5 border border-slate-700">
              <button
                onClick={() => setRole('USER')}
                className={`px-2 py-0.5 rounded text-xs font-medium transition-colors ${
                  role === 'USER'
                    ? 'bg-slate-700 text-white shadow-sm'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                User
              </button>
              <button
                onClick={() => setRole('ADMIN')}
                className={`px-2 py-0.5 rounded text-xs font-medium transition-colors ${
                  role === 'ADMIN'
                    ? 'bg-cyan-600 text-white shadow-sm'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                Admin
              </button>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
};
