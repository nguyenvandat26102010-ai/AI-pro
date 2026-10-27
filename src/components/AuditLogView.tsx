import React, { useState } from 'react';
import { ShieldCheck, ShieldAlert, KeyRound, RefreshCw, Lock, Link as LinkIcon, AlertTriangle } from 'lucide-react';
import { AuditLogEntry } from '../governance/types.ts';

interface AuditLogViewProps {
  auditLog: readonly AuditLogEntry[];
  onVerifyChain: () => { valid: boolean; tamperedIndex?: number; reason?: string };
  onSimulateTamper: (index: number) => void;
  onResetLedger: () => void;
}

export const AuditLogView: React.FC<AuditLogViewProps> = ({
  auditLog,
  onVerifyChain,
  onSimulateTamper,
  onResetLedger
}) => {
  const [verificationResult, setVerificationResult] = useState<{
    valid: boolean;
    tamperedIndex?: number;
    reason?: string;
  } | null>(null);
  const [selectedEntry, setSelectedEntry] = useState<AuditLogEntry | null>(auditLog[0] || null);

  const handleRunVerify = () => {
    const res = onVerifyChain();
    setVerificationResult(res);
  };

  const handleTamperTest = () => {
    if (auditLog.length === 0) return;
    onSimulateTamper(0);
    const res = onVerifyChain();
    setVerificationResult(res);
  };

  return (
    <div className="space-y-6">
      {/* Header and Verification Status */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-sm">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <Lock className="w-5 h-5 text-cyan-400" />
              <h2 className="text-xl font-bold text-white">
                Tamper-Evident Audit Log (SHA-256 Hash Chain)
              </h2>
            </div>
            <p className="text-sm text-slate-400 mt-1">
              Every governor decision and blocked action is cryptographically anchored to its predecessor via SHA-256 hash chaining, guaranteeing mathematical tamper detection.
            </p>
          </div>

          {/* Action buttons */}
          <div className="flex items-center gap-2 flex-wrap">
            <button
              onClick={handleRunVerify}
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-semibold shadow-sm transition-all"
            >
              <ShieldCheck className="w-4 h-4" />
              <span>Verify Chain Integrity</span>
            </button>

            <button
              onClick={handleTamperTest}
              className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-rose-950/80 hover:bg-rose-900/80 text-rose-300 border border-rose-800 text-xs font-medium transition-all"
              title="Maliciously alters historical entry 0 to test cryptographic tamper detection"
            >
              <AlertTriangle className="w-4 h-4 text-rose-400" />
              <span>Simulate Tamper Attack</span>
            </button>

            <button
              onClick={onResetLedger}
              className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-medium border border-slate-700 transition-all"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span>Reset Ledger</span>
            </button>
          </div>
        </div>

        {/* Verification Alert Banner */}
        {verificationResult && (
          <div
            className={`mt-6 p-4 rounded-xl border flex items-start gap-3 transition-all ${
              verificationResult.valid
                ? 'bg-emerald-950/50 border-emerald-800/80 text-emerald-300'
                : 'bg-rose-950/60 border-rose-800 text-rose-300 animate-pulse'
            }`}
          >
            {verificationResult.valid ? (
              <ShieldCheck className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
            ) : (
              <ShieldAlert className="w-5 h-5 text-rose-400 shrink-0 mt-0.5" />
            )}
            <div>
              <div className="font-semibold text-sm">
                {verificationResult.valid
                  ? 'Cryptographic Ledger Integrity Confirmed Valid'
                  : 'Tampering Detected in Audit Log Chain!'}
              </div>
              <div className="text-xs mt-0.5 opacity-90">
                {verificationResult.valid
                  ? `All ${auditLog.length} historical entries verified against SHA-256 parent hashes. Zero data alterations or link breaks found.`
                  : `Entry index ${verificationResult.tamperedIndex} was modified post-signature: ${verificationResult.reason}`}
              </div>
            </div>
          </div>
        )}

        {/* Real-time Ledger Stats */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-6">
          <div className="p-3 bg-slate-950/50 rounded-xl border border-slate-800">
            <span className="text-[11px] text-slate-400 font-medium">Total Entries</span>
            <div className="text-xl font-bold text-white mt-0.5">{auditLog.length}</div>
          </div>
          <div className="p-3 bg-slate-950/50 rounded-xl border border-slate-800">
            <span className="text-[11px] text-slate-400 font-medium">Blocked Actions</span>
            <div className="text-xl font-bold text-rose-400 mt-0.5">
              {auditLog.filter((e) => e.decision === 'BLOCKED').length}
            </div>
          </div>
          <div className="p-3 bg-slate-950/50 rounded-xl border border-slate-800">
            <span className="text-[11px] text-slate-400 font-medium">Pending Confirmations</span>
            <div className="text-xl font-bold text-amber-300 mt-0.5">
              {auditLog.filter((e) => e.decision === 'REQUIRE_CONFIRMATION').length}
            </div>
          </div>
          <div className="p-3 bg-slate-950/50 rounded-xl border border-slate-800">
            <span className="text-[11px] text-slate-400 font-medium">Secret Redaction</span>
            <div className="text-xl font-bold text-cyan-400 mt-0.5 flex items-center gap-1">
              <KeyRound className="w-4 h-4" />
              <span>ACTIVE</span>
            </div>
          </div>
        </div>
      </div>

      {/* Audit Log Table & Details Drawer */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Table Column */}
        <div className="lg:col-span-2 bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-sm">
          <div className="p-4 border-b border-slate-800 flex items-center justify-between">
            <h3 className="text-sm font-semibold text-white">Cryptographic Transaction Ledger</h3>
            <span className="text-xs text-slate-400 font-mono">
              genesis: 0000000000000000000000000000000000000000000000000000000000000000
            </span>
          </div>

          <div className="overflow-x-auto max-h-[500px] overflow-y-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-950 text-slate-400 uppercase tracking-wider sticky top-0 border-b border-slate-800">
                <tr>
                  <th className="py-2.5 px-3 font-semibold">Time</th>
                  <th className="py-2.5 px-3 font-semibold">Actor</th>
                  <th className="py-2.5 px-3 font-semibold">Target / Action</th>
                  <th className="py-2.5 px-3 font-semibold">Decision</th>
                  <th className="py-2.5 px-3 font-semibold">SHA-256 Hash</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 font-mono">
                {auditLog.map((entry, idx) => {
                  const isSelected = selectedEntry?.id === entry.id;
                  const isBlocked = entry.decision === 'BLOCKED';
                  const isPending = entry.decision === 'REQUIRE_CONFIRMATION';

                  return (
                    <tr
                      key={entry.id}
                      onClick={() => setSelectedEntry(entry)}
                      className={`cursor-pointer transition-colors ${
                        isSelected
                          ? 'bg-cyan-950/30'
                          : idx % 2 === 0
                          ? 'bg-slate-900/60 hover:bg-slate-800/60'
                          : 'bg-slate-950/30 hover:bg-slate-800/60'
                      }`}
                    >
                      <td className="py-2 px-3 text-slate-400 whitespace-nowrap">
                        {new Date(entry.timestamp).toLocaleTimeString()}
                      </td>
                      <td className="py-2 px-3 text-cyan-300 font-semibold">{entry.actorHash}</td>
                      <td className="py-2 px-3 text-slate-200">
                        <div className="font-sans font-medium truncate max-w-[150px]">{entry.target}</div>
                        {entry.actionTier && (
                          <div className="text-[10px] text-slate-400 font-mono">
                            {entry.actionTier.replace('TIER_', 'T')}
                          </div>
                        )}
                      </td>
                      <td className="py-2 px-3">
                        <span
                          className={`inline-block px-2 py-0.5 rounded text-[10px] font-semibold ${
                            isBlocked
                              ? 'bg-rose-950 text-rose-300 border border-rose-800'
                              : isPending
                              ? 'bg-amber-950 text-amber-300 border border-amber-800'
                              : 'bg-emerald-950 text-emerald-300 border border-emerald-800'
                          }`}
                        >
                          {entry.decision}
                        </span>
                      </td>
                      <td className="py-2 px-3 text-slate-500 text-[11px] truncate max-w-[120px]">
                        {entry.hash.slice(0, 14)}...
                      </td>
                    </tr>
                  );
                })}

                {auditLog.length === 0 && (
                  <tr>
                    <td colSpan={5} className="py-12 text-center text-slate-500 font-sans">
                      No audit records logged yet. Fire actions in the Limits &amp; Testbed tab.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Selected Entry Inspector */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-sm space-y-4">
          <h3 className="text-sm font-semibold text-white flex items-center gap-2">
            <LinkIcon className="w-4 h-4 text-cyan-400" />
            Hash Chain Entry Inspector
          </h3>

          {selectedEntry ? (
            <div className="space-y-3 text-xs">
              <div className="bg-slate-950 p-3 rounded-lg border border-slate-800 space-y-1 font-mono">
                <div className="text-slate-500 text-[10px]">ENTRY ID</div>
                <div className="text-slate-200 break-all">{selectedEntry.id}</div>
                <div className="text-slate-500 text-[10px] mt-2">TIMESTAMP</div>
                <div className="text-slate-200">{selectedEntry.timestamp}</div>
                <div className="text-slate-500 text-[10px] mt-2">REQUEST ID</div>
                <div className="text-slate-200">{selectedEntry.requestId}</div>
                <div className="text-slate-500 text-[10px] mt-2">ACTOR PRIVACY HASH</div>
                <div className="text-cyan-300">{selectedEntry.actorHash}</div>
              </div>

              <div>
                <span className="text-slate-400 font-medium">Target &amp; Decision:</span>
                <div className="mt-1 p-2.5 rounded-lg bg-slate-950 border border-slate-800">
                  <div className="font-semibold text-white">{selectedEntry.target}</div>
                  <div className="text-slate-400 mt-1">{selectedEntry.reason || 'None'}</div>
                </div>
              </div>

              <div className="bg-slate-950 p-3 rounded-lg border border-slate-800 space-y-2 font-mono text-[11px]">
                <div>
                  <div className="text-slate-500 text-[10px] font-semibold">PREVIOUS HASH (prevHash)</div>
                  <div className="text-slate-400 break-all bg-slate-900/80 p-1.5 rounded mt-0.5">
                    {selectedEntry.prevHash}
                  </div>
                </div>

                <div>
                  <div className="text-cyan-400 text-[10px] font-semibold">ENTRY HASH (SHA-256)</div>
                  <div className="text-cyan-300 break-all bg-cyan-950/40 border border-cyan-800/80 p-1.5 rounded mt-0.5">
                    {selectedEntry.hash}
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2 text-slate-400 text-[11px]">
                <div className="bg-slate-950 p-2 rounded border border-slate-800">
                  <span className="text-slate-500">Duration:</span> {selectedEntry.durationMs}ms
                </div>
                <div className="bg-slate-950 p-2 rounded border border-slate-800">
                  <span className="text-slate-500">Est. Cost:</span> ${selectedEntry.estimatedCostUsd.toFixed(4)}
                </div>
              </div>
            </div>
          ) : (
            <div className="p-8 text-center text-slate-500 text-xs">
              Select an entry from the ledger to inspect its cryptographic links and verification checksum.
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
