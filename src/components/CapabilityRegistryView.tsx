import React, { useState, useMemo } from 'react';
import { Search, CheckCircle2, Clock, AlertCircle, XCircle, ShieldAlert, Layers, ChevronRight, ChevronDown } from 'lucide-react';
import { CAPABILITY_REGISTRY } from '../governance/capabilityRegistry.ts';
import { CapabilityItem, CapabilityStatus } from '../governance/types.ts';

const STATUS_CONFIG: Record<
  CapabilityStatus,
  { bg: string; text: string; border: string; icon: React.ComponentType<{ className?: string }> }
> = {
  'Implemented and tested': {
    bg: 'bg-emerald-950/40',
    text: 'text-emerald-400',
    border: 'border-emerald-800/80',
    icon: CheckCircle2
  },
  'Implemented, awaiting configuration': {
    bg: 'bg-amber-950/40',
    text: 'text-amber-300',
    border: 'border-amber-800/80',
    icon: Clock
  },
  'Partially implemented': {
    bg: 'bg-sky-950/40',
    text: 'text-sky-300',
    border: 'border-sky-800/80',
    icon: AlertCircle
  },
  'Not implemented': {
    bg: 'bg-slate-800/40',
    text: 'text-slate-400',
    border: 'border-slate-700/80',
    icon: XCircle
  },
  'Test failed': {
    bg: 'bg-rose-950/40',
    text: 'text-rose-400',
    border: 'border-rose-800/80',
    icon: ShieldAlert
  }
};

export const CapabilityRegistryView: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedStatus, setSelectedStatus] = useState<string>('ALL');
  const [selectedCategory, setSelectedCategory] = useState<string>('ALL');
  const [expandedId, setExpandedId] = useState<string | null>(CAPABILITY_REGISTRY[0]?.id || null);

  // Status counts
  const counts = useMemo(() => {
    const c: Record<string, number> = {
      ALL: CAPABILITY_REGISTRY.length,
      'Implemented and tested': 0,
      'Implemented, awaiting configuration': 0,
      'Partially implemented': 0,
      'Not implemented': 0,
      'Test failed': 0
    };
    CAPABILITY_REGISTRY.forEach((item) => {
      if (c[item.status] !== undefined) {
        c[item.status]++;
      }
    });
    return c;
  }, []);

  const categories = useMemo(() => {
    const set = new Set<string>();
    CAPABILITY_REGISTRY.forEach((i) => set.add(i.category));
    return ['ALL', ...Array.from(set)];
  }, []);

  const filteredItems = useMemo(() => {
    return CAPABILITY_REGISTRY.filter((item) => {
      const matchSearch =
        item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.id.toLowerCase().includes(searchTerm.toLowerCase());
      const matchStatus = selectedStatus === 'ALL' || item.status === selectedStatus;
      const matchCategory = selectedCategory === 'ALL' || item.category === selectedCategory;
      return matchSearch && matchStatus && matchCategory;
    });
  }, [searchTerm, selectedStatus, selectedCategory]);

  return (
    <div className="space-y-6">
      {/* Header & Overview */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-sm">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h2 className="text-xl font-bold text-white flex items-center gap-2">
              <Layers className="w-5 h-5 text-cyan-400" />
              Capability Registry &amp; System Inventory
            </h2>
            <p className="text-sm text-slate-400 mt-1">
              Authoritative inventory across all 5 planned Ndawg Pro upgrade phases. Every capability is categorized using strictly defined verification labels.
            </p>
          </div>

          <div className="flex items-center gap-2 text-xs font-mono px-3 py-1.5 rounded-lg bg-slate-800/80 border border-slate-700 text-slate-300">
            <span>AUDIT STATUS:</span>
            <span className="text-cyan-400 font-bold">100% TRANSPARENT</span>
          </div>
        </div>

        {/* 5-Status Filter Badges */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2 mt-6">
          <button
            onClick={() => setSelectedStatus('ALL')}
            className={`p-3 rounded-xl border text-left transition-all ${
              selectedStatus === 'ALL'
                ? 'bg-cyan-950/60 border-cyan-500 ring-1 ring-cyan-500/50 text-white'
                : 'bg-slate-950/40 border-slate-800 text-slate-400 hover:border-slate-700'
            }`}
          >
            <div className="text-xs font-semibold text-slate-300">All Modules</div>
            <div className="text-xl font-bold text-white mt-1">{counts.ALL}</div>
          </button>

          {(Object.keys(STATUS_CONFIG) as CapabilityStatus[]).map((status) => {
            const cfg = STATUS_CONFIG[status];
            const Icon = cfg.icon;
            const isSelected = selectedStatus === status;
            return (
              <button
                key={status}
                onClick={() => setSelectedStatus(status)}
                className={`p-3 rounded-xl border text-left transition-all ${
                  isSelected
                    ? `${cfg.bg} ${cfg.border} ring-1 ring-current text-white`
                    : 'bg-slate-950/40 border-slate-800 text-slate-400 hover:border-slate-700'
                }`}
              >
                <div className="flex items-center gap-1.5">
                  <Icon className={`w-3.5 h-3.5 ${cfg.text}`} />
                  <span className={`text-[11px] font-medium truncate ${cfg.text}`}>{status}</span>
                </div>
                <div className="text-xl font-bold text-white mt-1">{counts[status] || 0}</div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Filters and Search Bar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 bg-slate-900 border border-slate-800 p-4 rounded-xl">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search capability, test, or dependency..."
            className="w-full bg-slate-950 border border-slate-800 rounded-lg pl-9 pr-4 py-2 text-sm text-slate-200 placeholder-slate-500 focus:outline-none focus:border-cyan-500"
          />
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto overflow-x-auto pb-1 sm:pb-0">
          <span className="text-xs text-slate-400 whitespace-nowrap">Category:</span>
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`px-3 py-1 rounded-lg text-xs font-medium whitespace-nowrap transition-colors ${
                selectedCategory === cat
                  ? 'bg-slate-800 text-cyan-400 border border-cyan-800/80'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* Capabilities List */}
      <div className="space-y-3">
        {filteredItems.map((item) => {
          const cfg = STATUS_CONFIG[item.status];
          const Icon = cfg.icon;
          const isExpanded = expandedId === item.id;

          return (
            <div
              key={item.id}
              className={`bg-slate-900 border rounded-xl overflow-hidden transition-all ${
                isExpanded ? 'border-slate-700 shadow-md' : 'border-slate-800 hover:border-slate-700/80'
              }`}
            >
              {/* Header row */}
              <div
                onClick={() => setExpandedId(isExpanded ? null : item.id)}
                className="p-4 flex items-center justify-between cursor-pointer select-none"
              >
                <div className="flex items-center gap-3">
                  <button className="text-slate-500 hover:text-slate-300">
                    {isExpanded ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
                  </button>
                  <div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-semibold text-white text-sm">{item.name}</span>
                      <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-800 text-slate-400 border border-slate-700">
                        {item.category}
                      </span>
                    </div>
                    <p className="text-xs text-slate-400 mt-0.5 line-clamp-1">{item.description}</p>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <div className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border ${cfg.bg} ${cfg.text} ${cfg.border}`}>
                    <Icon className="w-3.5 h-3.5" />
                    <span className="hidden sm:inline">{item.status}</span>
                  </div>
                </div>
              </div>

              {/* Expanded details */}
              {isExpanded && (
                <div className="border-t border-slate-800/80 bg-slate-950/60 p-5 space-y-4 text-xs">
                  <div>
                    <h4 className="font-semibold text-slate-300 mb-1">Detailed Description</h4>
                    <p className="text-slate-400 leading-relaxed">{item.description}</p>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="bg-slate-900/80 p-3 rounded-lg border border-slate-800">
                      <div className="font-medium text-slate-300 mb-1">Associated Tests &amp; Evidence</div>
                      <div className="text-slate-400 space-y-1">
                        <div>
                          <span className="text-slate-500">Test suite:</span>{' '}
                          {item.associatedTests.join(', ')}
                        </div>
                        <div>
                          <span className="text-slate-500">Verified evidence:</span>{' '}
                          <span className="text-emerald-400 font-mono">{item.testEvidence}</span>
                        </div>
                        <div>
                          <span className="text-slate-500">Last verified:</span>{' '}
                          <span className="text-slate-300">{item.lastVerified}</span>
                        </div>
                      </div>
                    </div>

                    <div className="bg-slate-900/80 p-3 rounded-lg border border-slate-800">
                      <div className="font-medium text-slate-300 mb-1">Dependencies &amp; Prerequisites</div>
                      <div className="text-slate-400 space-y-1">
                        <div>
                          <span className="text-slate-500">Dependencies:</span>{' '}
                          {item.dependencies.join(', ')}
                        </div>
                        <div>
                          <span className="text-slate-500">Prerequisites:</span>{' '}
                          <span className="text-slate-300">{item.activationPrerequisites}</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="bg-amber-950/20 border border-amber-900/40 p-3 rounded-lg">
                    <span className="font-semibold text-amber-300">Known Limitations &amp; Architecture Boundary: </span>
                    <span className="text-amber-200/80">{item.knownLimitations}</span>
                  </div>
                </div>
              )}
            </div>
          );
        })}

        {filteredItems.length === 0 && (
          <div className="p-12 text-center text-slate-500 bg-slate-900 border border-slate-800 rounded-xl">
            No capabilities found matching your search and filter criteria.
          </div>
        )}
      </div>
    </div>
  );
};
