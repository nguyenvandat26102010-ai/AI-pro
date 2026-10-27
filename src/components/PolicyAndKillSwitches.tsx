import React, { useState } from 'react';
import { Sliders, Power, ShieldAlert, CheckCircle, RefreshCw, KeyRound, AlertCircle, FileCode } from 'lucide-react';
import { CircuitBreakerState, KillSwitchState, PolicyConfig, UserRole } from '../governance/types.ts';

interface PolicyAndKillSwitchesProps {
  policy: PolicyConfig;
  killSwitches: KillSwitchState;
  circuitBreaker: CircuitBreakerState;
  role: UserRole;
  onToggleKillSwitch: (
    type: 'global' | 'provider' | 'tool',
    target: string,
    disabled: boolean
  ) => { success: boolean; error?: string };
  onResetCircuitBreaker: () => { success: boolean; error?: string };
  onUpdatePolicy: (
    newPolicy: Partial<PolicyConfig>,
    adminKey: string
  ) => { success: boolean; error?: string };
}

const KNOWN_PROVIDERS = [
  { id: 'gemini-2.5-flash', name: 'Gemini 2.5 Flash' },
  { id: 'claude-3-opus', name: 'Anthropic Claude 3 Opus' },
  { id: 'gpt-4o', name: 'OpenAI GPT-4o' }
];

const KNOWN_TOOLS = [
  { id: 'file_delete', name: 'File Delete Tool', tier: 'Tier 3 (Irreversible)' },
  { id: 'send_email', name: 'Send External Email', tier: 'Tier 3 (Irreversible)' },
  { id: 'execute_shell', name: 'Host Shell Execution', tier: 'Tier 3 (Irreversible)' },
  { id: 'web_scraper', name: 'Web Content Crawler', tier: 'Tier 1 (Read)' }
];

export const PolicyAndKillSwitches: React.FC<PolicyAndKillSwitchesProps> = ({
  policy,
  killSwitches,
  circuitBreaker,
  role,
  onToggleKillSwitch,
  onResetCircuitBreaker,
  onUpdatePolicy
}) => {
  const [adminToken, setAdminToken] = useState('NDAWG_APEX_ADMIN_AUTHORIZED_2026');
  const [statusMessage, setStatusMessage] = useState<{ text: string; error?: boolean } | null>(null);

  // Edit limits state
  const [maxModels, setMaxModels] = useState(policy.interactiveLimits.maxModelsPerRequest);
  const [maxTools, setMaxTools] = useState(policy.interactiveLimits.maxToolCallsPerRequest);
  const [maxSteps, setMaxSteps] = useState(policy.interactiveLimits.maxStepsPerRequest);
  const [maxBudget, setMaxBudget] = useState(policy.interactiveLimits.targetBudgetMaxUsd);

  const handleGlobalPauseToggle = () => {
    const res = onToggleKillSwitch('global', '', !killSwitches.globalAgentPaused);
    if (!res.success) {
      setStatusMessage({ text: res.error || 'Failed to toggle kill switch', error: true });
    } else {
      setStatusMessage({ text: 'Global kill switch updated successfully.', error: false });
    }
  };

  const handleProviderToggle = (providerId: string) => {
    const isCurrentlyDisabled = killSwitches.disabledProviders.includes(providerId);
    const res = onToggleKillSwitch('provider', providerId, !isCurrentlyDisabled);
    if (!res.success) {
      setStatusMessage({ text: res.error || 'Failed to toggle provider', error: true });
    } else {
      setStatusMessage({
        text: `Provider ${providerId} ${!isCurrentlyDisabled ? 'disabled' : 'enabled'}.`,
        error: false
      });
    }
  };

  const handleToolToggle = (toolId: string) => {
    const isCurrentlyDisabled = killSwitches.disabledTools.includes(toolId);
    const res = onToggleKillSwitch('tool', toolId, !isCurrentlyDisabled);
    if (!res.success) {
      setStatusMessage({ text: res.error || 'Failed to toggle tool', error: true });
    } else {
      setStatusMessage({
        text: `Tool ${toolId} ${!isCurrentlyDisabled ? 'disabled' : 'enabled'}.`,
        error: false
      });
    }
  };

  const handleSavePolicy = () => {
    const res = onUpdatePolicy(
      {
        interactiveLimits: {
          ...policy.interactiveLimits,
          maxModelsPerRequest: Number(maxModels),
          maxToolCallsPerRequest: Number(maxTools),
          maxStepsPerRequest: Number(maxSteps),
          targetBudgetMaxUsd: Number(maxBudget)
        }
      },
      adminToken
    );

    if (!res.success) {
      setStatusMessage({ text: res.error || 'Failed to update policy', error: true });
    } else {
      setStatusMessage({ text: 'Policy limits updated and verified successfully.', error: false });
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-sm">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h2 className="text-xl font-bold text-white flex items-center gap-2">
              <Sliders className="w-5 h-5 text-cyan-400" />
              Policy-as-Code &amp; Emergency Kill Switches
            </h2>
            <p className="text-sm text-slate-400 mt-1">
              Deterministic, versioned governance controls. All operational boundaries are defined as code and only modifiable by authenticated administrators.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-xs text-slate-400 font-mono">POLICY VERSION:</span>
            <span className="px-2.5 py-1 rounded bg-slate-800 border border-slate-700 text-cyan-300 font-mono text-xs font-bold">
              {policy.version}
            </span>
          </div>
        </div>

        {statusMessage && (
          <div
            className={`mt-4 p-3 rounded-lg text-xs flex items-center gap-2 ${
              statusMessage.error
                ? 'bg-rose-950/70 border border-rose-800 text-rose-300'
                : 'bg-emerald-950/70 border border-emerald-800 text-emerald-300'
            }`}
          >
            {statusMessage.error ? (
              <AlertCircle className="w-4 h-4 shrink-0 text-rose-400" />
            ) : (
              <CheckCircle className="w-4 h-4 shrink-0 text-emerald-400" />
            )}
            <span>{statusMessage.text}</span>
          </div>
        )}
      </div>

      {/* Kill Switches Matrix */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Global Kill Switch */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Power className="w-5 h-5 text-rose-400" />
              <h3 className="text-sm font-semibold text-white">Global Agent Pause</h3>
            </div>
            <span
              className={`text-[10px] font-mono px-2 py-0.5 rounded ${
                killSwitches.globalAgentPaused
                  ? 'bg-rose-950 text-rose-300 border border-rose-800'
                  : 'bg-emerald-950 text-emerald-300 border border-emerald-800'
              }`}
            >
              {killSwitches.globalAgentPaused ? 'SUSPENDED' : 'ACTIVE'}
            </span>
          </div>
          <p className="text-xs text-slate-400">
            Emergency master switch. Instantly intercepts and blocks all agent execution and background workflows across the system.
          </p>
          <button
            onClick={handleGlobalPauseToggle}
            className={`w-full py-2.5 px-4 rounded-xl text-xs font-semibold transition-all ${
              killSwitches.globalAgentPaused
                ? 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-md'
                : 'bg-rose-600 hover:bg-rose-500 text-white shadow-md'
            }`}
          >
            {killSwitches.globalAgentPaused ? 'Resume Global Agents' : 'Emergency Pause All Agents'}
          </button>
        </div>

        {/* Provider Kill Switches */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-semibold text-white">Model Provider Switches</h3>
            <span className="text-xs text-slate-400 font-mono">
              {killSwitches.disabledProviders.length} Disabled
            </span>
          </div>
          <div className="space-y-2">
            {KNOWN_PROVIDERS.map((provider) => {
              const isDisabled = killSwitches.disabledProviders.includes(provider.id);
              return (
                <div
                  key={provider.id}
                  className="flex items-center justify-between p-2.5 rounded-lg bg-slate-950 border border-slate-800 text-xs"
                >
                  <span className="font-medium text-slate-200">{provider.name}</span>
                  <button
                    onClick={() => handleProviderToggle(provider.id)}
                    className={`px-2.5 py-1 rounded text-[11px] font-semibold transition-colors ${
                      isDisabled
                        ? 'bg-rose-950 text-rose-400 border border-rose-800 hover:bg-rose-900'
                        : 'bg-emerald-950 text-emerald-400 border border-emerald-800 hover:bg-emerald-900'
                    }`}
                  >
                    {isDisabled ? 'Disabled' : 'Enabled'}
                  </button>
                </div>
              );
            })}
          </div>
        </div>

        {/* Tool Kill Switches */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-semibold text-white">Tool &amp; Action Switches</h3>
            <span className="text-xs text-slate-400 font-mono">
              {killSwitches.disabledTools.length} Disabled
            </span>
          </div>
          <div className="space-y-2">
            {KNOWN_TOOLS.map((tool) => {
              const isDisabled = killSwitches.disabledTools.includes(tool.id);
              return (
                <div
                  key={tool.id}
                  className="flex items-center justify-between p-2.5 rounded-lg bg-slate-950 border border-slate-800 text-xs"
                >
                  <div>
                    <div className="font-medium text-slate-200">{tool.name}</div>
                    <div className="text-[10px] text-slate-500 font-mono">{tool.tier}</div>
                  </div>
                  <button
                    onClick={() => handleToolToggle(tool.id)}
                    className={`px-2.5 py-1 rounded text-[11px] font-semibold transition-colors ${
                      isDisabled
                        ? 'bg-rose-950 text-rose-400 border border-rose-800 hover:bg-rose-900'
                        : 'bg-emerald-950 text-emerald-400 border border-emerald-800 hover:bg-emerald-900'
                    }`}
                  >
                    {isDisabled ? 'Disabled' : 'Enabled'}
                  </button>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Circuit Breaker & Admin Policy Editor */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Circuit Breaker Management */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <ShieldAlert className="w-5 h-5 text-amber-400" />
              <h3 className="text-sm font-semibold text-white">Circuit Breaker Status</h3>
            </div>
            <span
              className={`px-2.5 py-1 rounded text-xs font-mono font-bold ${
                circuitBreaker.isOpen
                  ? 'bg-rose-950 text-rose-300 border border-rose-800 animate-pulse'
                  : 'bg-emerald-950 text-emerald-300 border border-emerald-800'
              }`}
            >
              {circuitBreaker.isOpen ? 'TRIPPED (OPEN)' : 'CLOSED (HEALTHY)'}
            </span>
          </div>

          <div className="p-3 bg-slate-950 rounded-xl border border-slate-800 text-xs space-y-2 font-mono">
            <div className="flex justify-between">
              <span className="text-slate-400">Consecutive Errors:</span>
              <span className="text-white font-bold">{circuitBreaker.consecutiveErrors} / {policy.circuitBreakerThresholdConsecutiveErrors}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-400">Trip Condition:</span>
              <span className="text-slate-300">Errors ≥ 4 OR Repetitive Agent Loop</span>
            </div>
            {circuitBreaker.tripReason && (
              <div className="text-rose-400 text-[11px] pt-1 border-t border-slate-800">
                Reason: {circuitBreaker.tripReason}
              </div>
            )}
          </div>

          <div className="flex items-center justify-between pt-2">
            <p className="text-xs text-slate-400">
              Trips automatically on cascading provider errors or repetitive non-advancing agent loops.
            </p>
            <button
              onClick={onResetCircuitBreaker}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-xs font-medium text-slate-200 border border-slate-700 transition-all shrink-0"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span>Reset Breaker</span>
            </button>
          </div>
        </div>

        {/* Authenticated Admin Policy Limits Editor */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <KeyRound className="w-5 h-5 text-cyan-400" />
              <h3 className="text-sm font-semibold text-white">Adjust Governor Limits (Admin)</h3>
            </div>
            <span className="text-xs text-slate-400 font-mono">Role: {role}</span>
          </div>

          <div className="grid grid-cols-2 gap-3 text-xs">
            <div>
              <label className="block text-slate-400 font-medium mb-1">Max Models / Req</label>
              <input
                type="number"
                value={maxModels}
                onChange={(e) => setMaxModels(Number(e.target.value))}
                className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2 text-white font-mono"
              />
            </div>
            <div>
              <label className="block text-slate-400 font-medium mb-1">Max Tools / Req</label>
              <input
                type="number"
                value={maxTools}
                onChange={(e) => setMaxTools(Number(e.target.value))}
                className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2 text-white font-mono"
              />
            </div>
            <div>
              <label className="block text-slate-400 font-medium mb-1">Max Steps / Req</label>
              <input
                type="number"
                value={maxSteps}
                onChange={(e) => setMaxSteps(Number(e.target.value))}
                className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2 text-white font-mono"
              />
            </div>
            <div>
              <label className="block text-slate-400 font-medium mb-1">Budget Max USD</label>
              <input
                type="number"
                step="0.05"
                value={maxBudget}
                onChange={(e) => setMaxBudget(Number(e.target.value))}
                className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2 text-white font-mono"
              />
            </div>
          </div>

          <div>
            <label className="block text-slate-400 text-xs font-medium mb-1">Admin Auth Credential</label>
            <input
              type="password"
              value={adminToken}
              onChange={(e) => setAdminToken(e.target.value)}
              placeholder="Enter admin authorization key"
              className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2 text-xs text-white font-mono"
            />
          </div>

          <button
            onClick={handleSavePolicy}
            className="w-full py-2 px-4 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-semibold shadow-sm transition-all"
          >
            Apply &amp; Audit Policy Change
          </button>
        </div>
      </div>

      {/* Policy-as-Code JSON Viewer */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-sm space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <FileCode className="w-5 h-5 text-slate-400" />
            <h3 className="text-sm font-semibold text-white">Active Policy-as-Code Manifest</h3>
          </div>
          <span className="text-[11px] font-mono text-emerald-400">IMMUTABLE RUNTIME STATE</span>
        </div>
        <pre className="bg-slate-950 p-4 rounded-xl border border-slate-800 text-slate-300 font-mono text-xs overflow-x-auto max-h-72">
          {JSON.stringify(policy, null, 2)}
        </pre>
      </div>
    </div>
  );
};
