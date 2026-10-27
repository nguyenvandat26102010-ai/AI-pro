import React, { useState } from 'react';
import {
  CheckCircle2,
  Clock,
  AlertCircle,
  XCircle,
  GitCompare,
  Plus,
  ExternalLink,
  ShieldCheck,
  Calendar,
  Layers,
  Search,
  UserCheck
} from 'lucide-react';
import {
  ClaimVerificationStatus,
  ConflictEdge,
  ReusePolicy,
  SourceRankingTier,
  VerifiedClaim
} from '../absorption/types.ts';
import { KnowledgeEngine } from '../absorption/knowledgeEngine.ts';
import { ProviderTermsRegistry } from '../absorption/providerTermsRegistry.ts';
import { UserRole } from '../governance/types.ts';

interface VerifiedKnowledgeViewProps {
  knowledgeEngine: KnowledgeEngine;
  termsRegistry: ProviderTermsRegistry;
  role: UserRole;
  onRefresh: () => void;
}

const STATUS_CONFIG: Record<
  ClaimVerificationStatus,
  { bg: string; text: string; border: string; icon: React.ComponentType<{ className?: string }> }
> = {
  Verified: {
    bg: 'bg-emerald-950/60',
    text: 'text-emerald-400',
    border: 'border-emerald-800',
    icon: CheckCircle2
  },
  'Partially verified': {
    bg: 'bg-sky-950/60',
    text: 'text-sky-300',
    border: 'border-sky-800',
    icon: Clock
  },
  'Conflicting evidence': {
    bg: 'bg-rose-950/60',
    text: 'text-rose-400',
    border: 'border-rose-800',
    icon: GitCompare
  },
  Unverified: {
    bg: 'bg-slate-800/60',
    text: 'text-slate-400',
    border: 'border-slate-700',
    icon: XCircle
  },
  Outdated: {
    bg: 'bg-amber-950/60',
    text: 'text-amber-300',
    border: 'border-amber-800',
    icon: AlertCircle
  }
};

const TIER_LABELS: Record<SourceRankingTier, { label: string; color: string }> = {
  TIER_1_OFFICIAL: { label: 'Tier 1: Official / Primary', color: 'text-cyan-400' },
  TIER_2_ACADEMIC: { label: 'Tier 2: Academic / Research', color: 'text-indigo-400' },
  TIER_3_REPUTABLE_PRESS: { label: 'Tier 3: Reputable Press', color: 'text-emerald-400' },
  TIER_4_COMMUNITY: { label: 'Tier 4: Community / Unverified', color: 'text-slate-400' }
};

export const VerifiedKnowledgeView: React.FC<VerifiedKnowledgeViewProps> = ({
  knowledgeEngine,
  termsRegistry,
  role,
  onRefresh
}) => {
  const claims = knowledgeEngine.getAllClaims();
  const conflicts = knowledgeEngine.getAllConflicts();

  const [selectedTab, setSelectedTab] = useState<'claims' | 'conflicts' | 'ingest'>('claims');
  const [filterStatus, setFilterStatus] = useState<string>('ALL');
  const [searchTerm, setSearchTerm] = useState('');

  // Review modal state
  const [reviewingClaim, setReviewingClaim] = useState<VerifiedClaim | null>(null);
  const [reviewerId, setReviewerId] = useState('analyst_lead_01');
  const [corroboratingEvidence, setCorroboratingEvidence] = useState('https://independent-benchmark.org/proof');
  const [reviewError, setReviewError] = useState<string | null>(null);

  // New claim ingest form state
  const [newClaimText, setNewClaimText] = useState('');
  const [newShortExpl, setNewShortExpl] = useState('');
  const [newSourceUrl, setNewSourceUrl] = useState('https://ai.google.dev/docs');
  const [newSourceTitle, setNewSourceTitle] = useState('Official API Documentation');
  const [newSourceRank, setNewSourceRank] = useState<SourceRankingTier>('TIER_1_OFFICIAL');
  const [newOriginProvider, setNewOriginProvider] = useState('gemini-2.5-flash');
  const [newReusePolicy, setNewReusePolicy] = useState<ReusePolicy>('store-with-citation');
  const [newReviewDate, setNewReviewDate] = useState('2026-12-31');
  const [ingestFeedback, setIngestFeedback] = useState<{ success: boolean; message: string } | null>(null);

  const filteredClaims = claims.filter((c) => {
    const matchSearch =
      c.claim.toLowerCase().includes(searchTerm.toLowerCase()) ||
      c.source_title.toLowerCase().includes(searchTerm.toLowerCase());
    const matchStatus = filterStatus === 'ALL' || c.verification_status === filterStatus;
    return matchSearch && matchStatus;
  });

  const handleReviewSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!reviewingClaim) return;

    const res = knowledgeEngine.reviewAndVerifyClaim(
      reviewingClaim.id,
      reviewerId,
      [corroboratingEvidence]
    );

    if (!res.success) {
      setReviewError(res.error || 'Failed to verify claim');
    } else {
      setReviewError(null);
      setReviewingClaim(null);
      onRefresh();
    }
  };

  const handleIngestClaim = (e: React.FormEvent) => {
    e.preventDefault();
    const res = knowledgeEngine.addClaim(
      {
        claim: newClaimText,
        short_explanation: newShortExpl,
        source_url: newSourceUrl,
        source_title: newSourceTitle,
        source_rank: newSourceRank,
        published_date: new Date().toISOString().slice(0, 10),
        accessed_date: new Date().toISOString().slice(0, 10),
        verification_method: 'Grounded citation lookup',
        independent_supporting_sources: [],
        contradiction_level: 'NONE',
        effective_date: new Date().toISOString().slice(0, 10),
        review_due_date: newReviewDate,
        verification_status: newSourceUrl ? 'Verified' : 'Unverified',
        origin_provider: newOriginProvider,
        reuse_policy: newReusePolicy,
        storage_permission_granted: newReusePolicy === 'store-with-citation',
        is_accessible_url: newSourceUrl.startsWith('http')
      },
      termsRegistry
    );

    if (res.success) {
      setIngestFeedback({
        success: true,
        message: `Claim successfully ingested with status '${res.claim?.verification_status}' and version ${res.claim?.version}.`
      });
      setNewClaimText('');
      setNewShortExpl('');
      onRefresh();
    } else {
      setIngestFeedback({
        success: false,
        message: res.error || 'Failed to ingest claim.'
      });
    }
  };

  return (
    <div className="space-y-6">
      {/* Review Modal */}
      {reviewingClaim && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl max-w-lg w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-center gap-2">
              <UserCheck className="w-5 h-5 text-cyan-400" />
              <h3 className="text-base font-bold text-white">Review &amp; Verify Claim</h3>
            </div>

            <div className="bg-slate-950 p-3 rounded-xl border border-slate-800 text-xs text-slate-300">
              <span className="text-slate-500 font-semibold block mb-1">CLAIM UNDER REVIEW:</span>
              <p>{reviewingClaim.claim}</p>
            </div>

            <form onSubmit={handleReviewSubmit} className="space-y-3 text-xs">
              <div>
                <label className="block text-slate-400 font-medium mb-1">Compliance Reviewer ID</label>
                <input
                  type="text"
                  value={reviewerId}
                  onChange={(e) => setReviewerId(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2 text-white font-mono"
                  required
                />
              </div>

              <div>
                <label className="block text-slate-400 font-medium mb-1">
                  Independent Corroborating Evidence URL (Mandatory)
                </label>
                <input
                  type="url"
                  value={corroboratingEvidence}
                  onChange={(e) => setCorroboratingEvidence(e.target.value)}
                  placeholder="https://..."
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2 text-white font-mono"
                  required
                />
                <span className="text-[10px] text-slate-500 mt-1 block">
                  Rule: Models cannot self-validate without external independent proof.
                </span>
              </div>

              {reviewError && (
                <div className="p-2.5 rounded-lg bg-rose-950 border border-rose-800 text-rose-300 text-xs">
                  {reviewError}
                </div>
              )}

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setReviewingClaim(null)}
                  className="px-3.5 py-1.5 rounded-lg text-xs font-semibold bg-slate-800 text-slate-300 hover:bg-slate-700"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 rounded-lg text-xs font-semibold bg-cyan-600 hover:bg-cyan-500 text-white shadow-sm"
                >
                  Approve Verification
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Header & Sub-Navigation */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-sm">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <ShieldCheck className="w-5 h-5 text-indigo-400" />
              <h2 className="text-xl font-bold text-white">Verified Knowledge &amp; Research Engine</h2>
            </div>
            <p className="text-sm text-slate-400 mt-1">
              Factual assertions deconstructed into verifiable, cited, and temporally-monitored claims.
              Zero unverified outputs treated as objective fact.
            </p>
          </div>

          <div className="flex items-center gap-1 bg-slate-800 p-1 rounded-xl border border-slate-700">
            <button
              onClick={() => setSelectedTab('claims')}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                selectedTab === 'claims'
                  ? 'bg-cyan-600 text-white shadow-sm'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              Claims Explorer ({claims.length})
            </button>
            <button
              onClick={() => setSelectedTab('conflicts')}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                selectedTab === 'conflicts'
                  ? 'bg-cyan-600 text-white shadow-sm'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              Conflict Graph ({conflicts.length})
            </button>
            <button
              onClick={() => setSelectedTab('ingest')}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                selectedTab === 'ingest'
                  ? 'bg-cyan-600 text-white shadow-sm'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              Ingest Claim
            </button>
          </div>
        </div>
      </div>

      {/* Tab: Claims Explorer */}
      {selectedTab === 'claims' && (
        <div className="space-y-4">
          {/* Filters Bar */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-slate-900 border border-slate-800 p-4 rounded-xl text-xs">
            <div className="relative w-full sm:w-80">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search verified propositions..."
                className="w-full bg-slate-950 border border-slate-800 rounded-lg pl-9 pr-3 py-2 text-slate-200 placeholder-slate-500 focus:outline-none focus:border-cyan-500"
              />
            </div>

            <div className="flex items-center gap-1.5 overflow-x-auto w-full sm:w-auto pb-1 sm:pb-0">
              <span className="text-slate-500">Status:</span>
              {['ALL', 'Verified', 'Partially verified', 'Conflicting evidence', 'Unverified', 'Outdated'].map(
                (st) => (
                  <button
                    key={st}
                    onClick={() => setFilterStatus(st)}
                    className={`px-2.5 py-1 rounded-lg whitespace-nowrap font-medium transition-colors ${
                      filterStatus === st
                        ? 'bg-slate-800 text-cyan-400 border border-cyan-800'
                        : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    {st}
                  </button>
                )
              )}
            </div>
          </div>

          {/* Claims List */}
          <div className="space-y-3">
            {filteredClaims.map((item) => {
              const cfg = STATUS_CONFIG[item.verification_status];
              const Icon = cfg.icon;
              const rankInfo = TIER_LABELS[item.source_rank];

              return (
                <div
                  key={item.id}
                  className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-sm space-y-3 hover:border-slate-700 transition-all"
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <span className={`flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-semibold border ${cfg.bg} ${cfg.text} ${cfg.border}`}>
                        <Icon className="w-3 h-3" />
                        <span>{item.verification_status}</span>
                      </span>

                      <span className={`text-[11px] font-mono font-medium ${rankInfo.color}`}>
                        {rankInfo.label}
                      </span>
                    </div>

                    <div className="flex items-center gap-3 text-[11px] text-slate-500 font-mono">
                      <span>Origin: {item.origin_provider}</span>
                      <span>v{item.version}</span>
                    </div>
                  </div>

                  {/* Main Proposition */}
                  <div>
                    <h3 className="text-sm font-semibold text-white leading-snug">{item.claim}</h3>
                    <p className="text-xs text-slate-400 mt-1">{item.short_explanation}</p>
                  </div>

                  {/* Provenance & Citation Metadata */}
                  <div className="pt-2 border-t border-slate-800/80 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-slate-500">Source:</span>
                      <a
                        href={item.source_url}
                        target="_blank"
                        rel="noreferrer"
                        className="text-cyan-400 hover:underline flex items-center gap-1 font-mono text-[11px]"
                      >
                        {item.source_title}
                        <ExternalLink className="w-3 h-3" />
                      </a>
                    </div>

                    <div className="flex items-center gap-3 text-[11px] text-slate-500 font-mono">
                      <span>Reviewed Due: {item.review_due_date}</span>
                      {item.verification_status === 'Unverified' && (
                        <button
                          onClick={() => setReviewingClaim(item)}
                          className="px-2.5 py-1 rounded bg-cyan-950 text-cyan-300 border border-cyan-800 hover:bg-cyan-900 font-semibold"
                        >
                          Review &amp; Verify
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Tab: Conflict Graph */}
      {selectedTab === 'conflicts' && (
        <div className="space-y-4">
          <div className="p-4 bg-slate-900 border border-slate-800 rounded-xl text-xs text-slate-400">
            The Conflict Graph maps disputed or contradictory assertions across AI providers and academic literature.
            <strong className="text-slate-200"> Principle:</strong> Do not artificially pick a side without decisive empirical proof.
          </div>

          <div className="space-y-4">
            {conflicts.map((edge) => (
              <div
                key={edge.id}
                className="bg-slate-900 border border-rose-900/40 rounded-2xl p-5 shadow-sm space-y-4"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-rose-400 font-semibold text-xs">
                    <GitCompare className="w-4 h-4" />
                    <span>CONTRADICTION DETECTED: {edge.natureOfConflict}</span>
                  </div>
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-rose-950 text-rose-300 border border-rose-800">
                    {edge.status}
                  </span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                  {/* Perspective A */}
                  <div className="p-3 bg-slate-950 rounded-xl border border-slate-800 space-y-2">
                    <span className="text-cyan-400 font-semibold block">PERSPECTIVE A (Vendor Claims):</span>
                    <p className="text-slate-300">{edge.perspectiveA}</p>
                    <div className="text-[11px] text-slate-500 font-mono">
                      Evidence: {edge.evidenceA.join(', ')}
                    </div>
                  </div>

                  {/* Perspective B */}
                  <div className="p-3 bg-slate-950 rounded-xl border border-slate-800 space-y-2">
                    <span className="text-indigo-400 font-semibold block">PERSPECTIVE B (Independent Reproduction):</span>
                    <p className="text-slate-300">{edge.perspectiveB}</p>
                    <div className="text-[11px] text-slate-500 font-mono">
                      Evidence: {edge.evidenceB.join(', ')}
                    </div>
                  </div>
                </div>

                <div className="p-3 bg-amber-950/30 rounded-xl border border-amber-900/50 text-xs">
                  <span className="font-semibold text-amber-300">Why Unresolved: </span>
                  <span className="text-amber-200/90">{edge.unresolvedReason}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Tab: Ingest Claim Form */}
      {selectedTab === 'ingest' && (
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-sm space-y-4 max-w-2xl">
          <div>
            <h3 className="text-sm font-semibold text-white">Ingest Proposition into Verified Knowledge Base</h3>
            <p className="text-xs text-slate-400 mt-0.5">
              Strictly verifies reuse_policy and Provider Terms before persistent storage.
            </p>
          </div>

          <form onSubmit={handleIngestClaim} className="space-y-4 text-xs">
            <div>
              <label className="block text-slate-400 font-medium mb-1">Atomic Proposition / Claim</label>
              <textarea
                rows={2}
                value={newClaimText}
                onChange={(e) => setNewClaimText(e.target.value)}
                placeholder="State the verifiable claim clearly..."
                className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-white"
                required
              />
            </div>

            <div>
              <label className="block text-slate-400 font-medium mb-1">Short Explanation &amp; Context</label>
              <textarea
                rows={2}
                value={newShortExpl}
                onChange={(e) => setNewShortExpl(e.target.value)}
                placeholder="Concise contextual summary..."
                className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-white"
                required
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-slate-400 font-medium mb-1">Source URL</label>
                <input
                  type="text"
                  value={newSourceUrl}
                  onChange={(e) => setNewSourceUrl(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2 text-white font-mono"
                  placeholder="https://..."
                />
              </div>

              <div>
                <label className="block text-slate-400 font-medium mb-1">Source Title</label>
                <input
                  type="text"
                  value={newSourceTitle}
                  onChange={(e) => setNewSourceTitle(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2 text-white"
                />
              </div>
            </div>

            <div className="grid grid-cols-3 gap-3">
              <div>
                <label className="block text-slate-400 font-medium mb-1">Source Hierarchy Rank</label>
                <select
                  value={newSourceRank}
                  onChange={(e) => setNewSourceRank(e.target.value as any)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2 text-white"
                >
                  <option value="TIER_1_OFFICIAL">Tier 1: Official / Primary</option>
                  <option value="TIER_2_ACADEMIC">Tier 2: Academic / Research</option>
                  <option value="TIER_3_REPUTABLE_PRESS">Tier 3: Reputable Press</option>
                  <option value="TIER_4_COMMUNITY">Tier 4: Community</option>
                </select>
              </div>

              <div>
                <label className="block text-slate-400 font-medium mb-1">Origin Provider</label>
                <select
                  value={newOriginProvider}
                  onChange={(e) => setNewOriginProvider(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2 text-white font-mono"
                >
                  <option value="gemini-2.5-flash">gemini-2.5-flash</option>
                  <option value="gemini-2.5-pro">gemini-2.5-pro</option>
                  <option value="claude-3-5-sonnet">claude-3-5-sonnet</option>
                  <option value="unverified-external-model-x">unverified-external-model-x</option>
                </select>
              </div>

              <div>
                <label className="block text-slate-400 font-medium mb-1">Reuse Policy</label>
                <select
                  value={newReusePolicy}
                  onChange={(e) => setNewReusePolicy(e.target.value as any)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2 text-white font-mono"
                >
                  <option value="store-with-citation">store-with-citation</option>
                  <option value="cache-only">cache-only (ephemeral TTL)</option>
                  <option value="no-store">no-store (strict blocked)</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-slate-400 font-medium mb-1">Review Due Date</label>
              <input
                type="date"
                value={newReviewDate}
                onChange={(e) => setNewReviewDate(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2 text-white font-mono"
              />
            </div>

            {ingestFeedback && (
              <div
                className={`p-3 rounded-lg border text-xs ${
                  ingestFeedback.success
                    ? 'bg-emerald-950/60 border-emerald-800 text-emerald-300'
                    : 'bg-rose-950/70 border-rose-800 text-rose-300'
                }`}
              >
                {ingestFeedback.message}
              </div>
            )}

            <button
              type="submit"
              className="py-2.5 px-4 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white font-semibold flex items-center justify-center gap-2 shadow-sm transition-all"
            >
              <Plus className="w-4 h-4" />
              <span>Ingest &amp; Validate Proposition</span>
            </button>
          </form>
        </div>
      )}
    </div>
  );
};
