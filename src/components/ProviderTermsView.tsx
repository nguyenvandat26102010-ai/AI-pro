import React, { useState } from 'react';
import {
  ShieldCheck,
  ShieldAlert,
  AlertTriangle,
  ExternalLink,
  CheckCircle2,
  XCircle,
  Clock,
  KeyRound,
  FileText
} from 'lucide-react';
import { ProviderTermsEntry, TermVerificationStatus } from '../absorption/types.ts';
import { ProviderTermsRegistry } from '../absorption/providerTermsRegistry.ts';
import { UserRole } from '../governance/types.ts';

interface ProviderTermsViewProps {
  termsRegistry: ProviderTermsRegistry;
  role: UserRole;
  onRefresh: () => void;
}

const STATUS_BADGES: Record<
  TermVerificationStatus,
  { bg: string; text: string; border: string; label: string }
> = {
  VERIFIED: {
    bg: 'bg-emerald-950/60',
    text: 'text-emerald-400',
    border: 'border-emerald-800',
    label: 'Verified & Compliant'
  },
  UNVERIFIED: {
    bg: 'bg-rose-950/60',
    text: 'text-rose-400',
    border: 'border-rose-800',
    label: 'Unverified (Strict Deny)'
  },
  NEEDS_RECHECK: {
    bg: 'bg-amber-950/60',
    text: 'text-amber-300',
    border: 'border-amber-800',
    label: 'Audit Due Soon'
  },
  EXPIRED: {
    bg: 'bg-rose-950/60',
    text: 'text-rose-400',
    border: 'border-rose-800',
    label: 'Terms Expired'
  }
};

export const ProviderTermsView: React.FC<ProviderTermsViewProps> = ({
  termsRegistry,
  role,
  onRefresh
}) => {
  const entries = termsRegistry.getAllEntries();
  const [selectedEntry, setSelectedEntry] = useState<ProviderTermsEntry>(entries[0]);
  const [evalAction, setEvalAction] = useState<'TRAIN' | 'CACHE' | 'STORE' | 'KB_REUSE'>('STORE');
  const [evalResult, setEvalResult] = useState<{ allowed: boolean; reason: string } | null>(null);

  // Quick permission evaluator
  const handleEvaluatePermission = (modelId: string, actionType: 'TRAIN' | 'CACHE' | 'STORE' | 'KB_REUSE') => {
    const result = termsRegistry.validateActionPermissions(modelId, actionType);
    setEvalResult(result);
  };

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-sm">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <ShieldCheck className="w-5 h-5 text-cyan-400" />
              <h2 className="text-xl font-bold text-white">Provider Terms Registry</h2>
            </div>
            <p className="text-sm text-slate-400 mt-1">
              Tracks intellectual property terms, retention windows, and output usage rights per model.
              <strong className="text-slate-200"> Strict Default DENY:</strong> All training and storage flags are denied unless verified by formal legal license.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-xs font-mono px-3 py-1.5 rounded-lg bg-slate-800 text-slate-300 border border-slate-700">
              LEGAL STATUS: <span className="text-emerald-400 font-bold">DEFAULT DENY ENFORCED</span>
            </span>
          </div>
        </div>

        {/* Quick Permission Gate Tester */}
        <div className="mt-6 p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-300">Live Action Permission Gate Tester</span>
            <span className="text-[11px] text-slate-500 font-mono">Test model rights before dispatch</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
            <div>
              <label className="block text-slate-400 mb-1">Target Model</label>
              <select
                value={selectedEntry.modelId}
                onChange={(e) => {
                  const entry = termsRegistry.getTerms(e.target.value);
                  if (entry) setSelectedEntry(entry);
                }}
                className="w-full bg-slate-900 border border-slate-800 rounded-lg p-2 text-white font-mono"
              >
                {entries.map((ent) => (
                  <option key={ent.modelId} value={ent.modelId}>
                    {ent.provider} — {ent.modelId}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-slate-400 mb-1">Proposed Action</label>
              <select
                value={evalAction}
                onChange={(e) => setEvalAction(e.target.value as any)}
                className="w-full bg-slate-900 border border-slate-800 rounded-lg p-2 text-white"
              >
                <option value="STORE">Persistent Storage (store_output)</option>
                <option value="TRAIN">Model Training (train_on_output)</option>
                <option value="CACHE">Ephemeral Caching (cache_output)</option>
                <option value="KB_REUSE">Knowledge Base Reuse (allow_kb_reuse)</option>
              </select>
            </div>

            <div className="flex items-end">
              <button
                onClick={() => handleEvaluatePermission(selectedEntry.modelId, evalAction)}
                className="w-full py-2 px-3 rounded-lg bg-cyan-600 hover:bg-cyan-500 text-white font-semibold text-xs transition-colors"
              >
                Verify Legality
              </button>
            </div>
          </div>

          {evalResult && (
            <div
              className={`p-3 rounded-lg border text-xs flex items-start gap-2 ${
                evalResult.allowed
                  ? 'bg-emerald-950/60 border-emerald-800 text-emerald-300'
                  : 'bg-rose-950/70 border-rose-800 text-rose-300'
              }`}
            >
              {evalResult.allowed ? (
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
              ) : (
                <XCircle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
              )}
              <div>
                <span className="font-bold">
                  {evalResult.allowed ? 'ACTION AUTHORIZED: ' : 'ACTION DENIED: '}
                </span>
                <span>{evalResult.reason}</span>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Provider Matrix Table */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-sm">
        <div className="p-4 border-b border-slate-800 flex items-center justify-between">
          <h3 className="text-sm font-semibold text-white">Registered Providers &amp; Output Permitted Uses</h3>
          <span className="text-xs text-slate-400 font-mono">{entries.length} Providers Tracked</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-950 text-slate-400 uppercase tracking-wider border-b border-slate-800">
              <tr>
                <th className="py-3 px-4 font-semibold">Provider &amp; Model ID</th>
                <th className="py-3 px-4 font-semibold">Verification Status</th>
                <th className="py-3 px-4 font-semibold text-center">train_on_output</th>
                <th className="py-3 px-4 font-semibold text-center">store_output</th>
                <th className="py-3 px-4 font-semibold text-center">cache_output</th>
                <th className="py-3 px-4 font-semibold text-center">kb_reuse</th>
                <th className="py-3 px-4 font-semibold">Retention</th>
                <th className="py-3 px-4 font-semibold">Legal Basis &amp; Terms</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800 font-mono">
              {entries.map((entry) => {
                const badge = STATUS_BADGES[entry.verification_status];
                const isSelected = selectedEntry.modelId === entry.modelId;

                return (
                  <tr
                    key={entry.modelId}
                    onClick={() => setSelectedEntry(entry)}
                    className={`cursor-pointer transition-colors ${
                      isSelected ? 'bg-cyan-950/30' : 'hover:bg-slate-800/40'
                    }`}
                  >
                    <td className="py-3 px-4">
                      <div className="font-sans font-semibold text-white">{entry.provider}</div>
                      <div className="text-[11px] text-cyan-300">{entry.modelId}</div>
                    </td>

                    <td className="py-3 px-4 whitespace-nowrap">
                      <span className={`inline-block px-2.5 py-1 rounded-full text-[10px] font-semibold border ${badge.bg} ${badge.text} ${badge.border}`}>
                        {badge.label}
                      </span>
                    </td>

                    <td className="py-3 px-4 text-center">
                      {entry.train_on_output ? (
                        <span className="px-2 py-0.5 rounded bg-emerald-950 text-emerald-300 border border-emerald-800 text-[10px]">
                          ALLOW
                        </span>
                      ) : (
                        <span className="px-2 py-0.5 rounded bg-rose-950 text-rose-300 border border-rose-800 text-[10px]">
                          DENY
                        </span>
                      )}
                    </td>

                    <td className="py-3 px-4 text-center">
                      {entry.store_output ? (
                        <span className="text-[11px] font-bold text-emerald-400">YES</span>
                      ) : (
                        <span className="text-[11px] font-bold text-rose-400">NO</span>
                      )}
                    </td>

                    <td className="py-3 px-4 text-center">
                      {entry.cache_output ? (
                        <span className="text-[11px] font-bold text-emerald-400">YES</span>
                      ) : (
                        <span className="text-[11px] font-bold text-rose-400">NO</span>
                      )}
                    </td>

                    <td className="py-3 px-4 text-center">
                      {entry.allow_knowledge_base_reuse ? (
                        <span className="text-[11px] font-bold text-emerald-400">YES</span>
                      ) : (
                        <span className="text-[11px] font-bold text-rose-400">NO</span>
                      )}
                    </td>

                    <td className="py-3 px-4 text-slate-300">
                      {entry.retention_period_days} days
                    </td>

                    <td className="py-3 px-4 text-slate-400 font-sans text-xs">
                      <div className="truncate max-w-xs">{entry.license_or_legal_basis}</div>
                      <div className="flex items-center gap-2 text-[10px] text-cyan-400 mt-0.5">
                        <a
                          href={entry.termsUrl}
                          target="_blank"
                          rel="noreferrer"
                          className="hover:underline flex items-center gap-0.5"
                          onClick={(e) => e.stopPropagation()}
                        >
                          Terms <ExternalLink className="w-2.5 h-2.5" />
                        </a>
                        <span>•</span>
                        <span>Recheck: {entry.recheck_due_date}</span>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Selected Provider Terms Card */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-sm space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <FileText className="w-5 h-5 text-indigo-400" />
            <h3 className="text-sm font-semibold text-white">
              Compliance Detail: {selectedEntry.provider} — {selectedEntry.modelId}
            </h3>
          </div>
          <span className="text-xs text-slate-400 font-mono">
            Audited by: {selectedEntry.approved_by}
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
          <div className="p-3 bg-slate-950 rounded-xl border border-slate-800 space-y-1">
            <span className="text-slate-500 font-semibold">DATA STORAGE CONDITIONS:</span>
            <p className="text-slate-300">{selectedEntry.data_storage_conditions}</p>
          </div>

          <div className="p-3 bg-slate-950 rounded-xl border border-slate-800 space-y-1">
            <span className="text-slate-500 font-semibold">PRIVACY &amp; RETENTION:</span>
            <p className="text-slate-300">{selectedEntry.privacy_and_data_handling}</p>
          </div>
        </div>

        <div className="p-3 bg-slate-950/60 rounded-xl border border-slate-800 flex items-center justify-between text-xs font-mono">
          <div className="text-slate-400">
            Terms Checked: <span className="text-white">{selectedEntry.termsCheckedDate}</span>
          </div>
          <div className="text-slate-400">
            Next Audit Due: <span className="text-cyan-400">{selectedEntry.recheck_due_date}</span>
          </div>
        </div>
      </div>
    </div>
  );
};
