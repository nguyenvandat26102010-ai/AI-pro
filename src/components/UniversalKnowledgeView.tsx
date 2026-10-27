/**
 * NDAWG PRO — PART 11 / V9 UPGRADE
 * Universal Human Knowledge Explorer & RAG Fabric View (Directives Part 2–5)
 *
 * Visualizes the 15 Universal Knowledge Domains (A through O),
 * Live Connector statuses (arXiv, OpenAlex, Wikipedia, World Bank, Gutenberg),
 * and an interactive cross-domain RAG retrieval and citation engine.
 */

import React, { useState, useEffect } from 'react';
import {
  BookOpen,
  Search,
  Globe,
  Database,
  ShieldCheck,
  ExternalLink,
  ChevronRight,
  ChevronDown,
  Layers,
  Sparkles,
  CheckCircle2,
  AlertCircle,
  Copy,
  Check,
  RefreshCw,
  Cpu,
  GraduationCap,
  Scale,
  Landmark,
  Trees,
  HeartPulse,
  Palette,
  Briefcase,
  Users,
  Atom,
  Calculator,
  Code
} from 'lucide-react';

interface KnowledgeDomain {
  id: string;
  code: string;
  name: string;
  englishName: string;
  category: string;
  iconName: string;
  subdomains: string[];
  supportedLanguages: string[];
  availableSourceCollections: string[];
  indexedRecordsCount: number;
  retrievalCapability: 'ACTIVE' | 'PARTIAL' | 'SCHEDULED';
  lastIndexedAt: string;
  freshness: string;
  knownDataGaps: string[];
  verificationStatus: 'VERIFIED' | 'REVIEW_IN_PROGRESS' | 'CURATED';
  coverageScore: number;
  disclaimer?: string;
  sampleTopics: string[];
}

interface KnowledgeConnector {
  id: string;
  name: string;
  type: string;
  provider: string;
  status: string;
  endpoint: string;
  license: string;
  attribution: string;
  supportedFormats: string[];
  indexedDocumentsCount: number;
  lastHealthCheck: string;
  rateLimitPerMin: number;
}

interface UniversalKnowledgeViewProps {
  onBackToChat?: () => void;
}

export function UniversalKnowledgeView({ onBackToChat }: UniversalKnowledgeViewProps) {
  const [activeTab, setActiveTab] = useState<'taxonomy' | 'rag_lab' | 'connectors'>('taxonomy');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedLanguage, setSelectedLanguage] = useState('ALL');
  const [selectedCategory, setSelectedCategory] = useState('ALL');
  const [expandedDomainId, setExpandedDomainId] = useState<string | null>('dom_computing_tech');

  // Domains & Connectors state
  const [domains, setDomains] = useState<KnowledgeDomain[]>([]);
  const [connectors, setConnectors] = useState<KnowledgeConnector[]>([]);
  const [totalRecords, setTotalRecords] = useState(0);
  const [avgCoverage, setAvgCoverage] = useState(0);
  const [isLoading, setIsLoading] = useState(true);

  // RAG query state
  const [ragQuery, setRagQuery] = useState('');
  const [ragResult, setRagResult] = useState<any>(null);
  const [isSearchingRag, setIsSearchingRag] = useState(false);
  const [copiedCitationId, setCopiedCitationId] = useState<string | null>(null);

  // Load initial taxonomy & connectors
  useEffect(() => {
    fetchTaxonomyData();
    fetchConnectorsData();
  }, []);

  const fetchTaxonomyData = async () => {
    setIsLoading(true);
    try {
      const res = await fetch('/api/universal-knowledge/taxonomy');
      if (res.ok) {
        const data = await res.json();
        setDomains(data.domains || []);
        setTotalRecords(data.totalRecords || 0);
        setAvgCoverage(data.averageCoverageScore || 0);
      }
    } catch (err) {
      console.warn('Failed to fetch taxonomy data, fallback to local', err);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchConnectorsData = async () => {
    try {
      const res = await fetch('/api/universal-knowledge/connectors');
      if (res.ok) {
        const data = await res.json();
        setConnectors(data.connectors || []);
      }
    } catch (err) {
      console.warn('Failed to fetch connectors data', err);
    }
  };

  const handleExecuteRag = async (overrideQuery?: string) => {
    const q = overrideQuery || ragQuery;
    if (!q.trim()) return;

    setIsSearchingRag(true);
    try {
      const res = await fetch('/api/universal-knowledge/search', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query: q.trim() })
      });
      if (res.ok) {
        const data = await res.json();
        setRagResult(data);
      }
    } catch (err) {
      console.error('Universal RAG search failed', err);
    } finally {
      setIsSearchingRag(false);
    }
  };

  const copyCitation = (citation: string, id: string) => {
    navigator.clipboard.writeText(citation);
    setCopiedCitationId(id);
    setTimeout(() => setCopiedCitationId(null), 2500);
  };

  const renderDomainIcon = (iconName: string) => {
    switch (iconName) {
      case 'Calculator': return <Calculator className="w-5 h-5 text-cyan-400" />;
      case 'Atom': return <Atom className="w-5 h-5 text-emerald-400" />;
      case 'HeartPulse': return <HeartPulse className="w-5 h-5 text-rose-400" />;
      case 'Cog': return <Cpu className="w-5 h-5 text-amber-400" />;
      case 'Code': return <Code className="w-5 h-5 text-indigo-400" />;
      case 'Users': return <Users className="w-5 h-5 text-sky-400" />;
      case 'BookOpen': return <BookOpen className="w-5 h-5 text-violet-400" />;
      case 'Globe': return <Globe className="w-5 h-5 text-teal-400" />;
      case 'Palette': return <Palette className="w-5 h-5 text-pink-400" />;
      case 'Briefcase': return <Briefcase className="w-5 h-5 text-amber-300" />;
      case 'Scale': return <Scale className="w-5 h-5 text-amber-500" />;
      case 'Landmark': return <Landmark className="w-5 h-5 text-yellow-500" />;
      case 'Trees': return <Trees className="w-5 h-5 text-emerald-500" />;
      case 'GraduationCap': return <GraduationCap className="w-5 h-5 text-cyan-300" />;
      default: return <Sparkles className="w-5 h-5 text-cyan-400" />;
    }
  };

  // Filtered domains
  const filteredDomains = domains.filter(d => {
    const q = searchQuery.toLowerCase().trim();
    const matchSearch =
      !q ||
      d.name.toLowerCase().includes(q) ||
      d.englishName.toLowerCase().includes(q) ||
      d.subdomains.some(s => s.toLowerCase().includes(q)) ||
      d.sampleTopics.some(t => t.toLowerCase().includes(q));

    const matchLang = selectedLanguage === 'ALL' || d.supportedLanguages.includes(selectedLanguage);
    const matchCat = selectedCategory === 'ALL' || d.category === selectedCategory;

    return matchSearch && matchLang && matchCat;
  });

  const categories = Array.from(new Set(domains.map(d => d.category)));

  return (
    <div className="space-y-6">
      {/* Top Banner & Header */}
      <div className="p-6 rounded-2xl bg-gradient-to-r from-slate-900 via-cyan-950/40 to-slate-900 border border-slate-800 shadow-xl relative overflow-hidden">
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1.5">
            <div className="flex items-center gap-2">
              <span className="text-xs font-mono font-bold px-2.5 py-0.5 rounded-full bg-cyan-950 text-cyan-400 border border-cyan-800/60">
                NDAWG PRO APEX V9.0
              </span>
              <span className="text-xs text-slate-400 font-mono">UNIVERSAL HUMAN KNOWLEDGE ARCHITECTURE</span>
            </div>
            <h1 className="text-2xl font-black text-slate-100 tracking-tight flex items-center gap-3">
              <Globe className="w-7 h-7 text-cyan-400 animate-pulse" />
              Mạng Lưới Tri Thức Nhân Loại Toàn Năng
            </h1>
            <p className="text-xs text-slate-300 max-w-2xl leading-relaxed">
              Cấu trúc phân loại 15 miền khoa học &amp; văn minh nhân loại (A–O). Tích hợp cổng tri thức mở học thuật 
              (arXiv, OpenAlex, Wikipedia, World Bank), cơ chế trích dẫn có thể kiểm chứng độc lập và cảnh báo giới hạn dữ liệu.
            </p>
          </div>

          {onBackToChat && (
            <button
              onClick={onBackToChat}
              className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-mono font-semibold flex items-center gap-2 border border-slate-700 transition-colors shrink-0"
            >
              <span>Về khung Chat</span>
              <ChevronRight className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-5 pt-4 border-t border-slate-800/80">
          <div className="bg-slate-950/60 p-3 rounded-xl border border-slate-800/60">
            <span className="text-[10px] text-slate-400 font-mono block">Miền Tri thức (A–O)</span>
            <span className="text-xl font-bold font-mono text-cyan-400">15 / 15</span>
          </div>
          <div className="bg-slate-950/60 p-3 rounded-xl border border-slate-800/60">
            <span className="text-[10px] text-slate-400 font-mono block">Bản ghi Học thuật</span>
            <span className="text-xl font-bold font-mono text-emerald-400">{totalRecords.toLocaleString()}</span>
          </div>
          <div className="bg-slate-950/60 p-3 rounded-xl border border-slate-800/60">
            <span className="text-[10px] text-slate-400 font-mono block">Cổng Kết nối Mở</span>
            <span className="text-xl font-bold font-mono text-indigo-400">{connectors.length} Connectors</span>
          </div>
          <div className="bg-slate-950/60 p-3 rounded-xl border border-slate-800/60">
            <span className="text-[10px] text-slate-400 font-mono block">Độ bao phủ chương trình</span>
            <span className="text-xl font-bold font-mono text-amber-400">{avgCoverage}% Avg</span>
          </div>
        </div>
      </div>

      {/* Navigation Sub-Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-800 pb-2">
        <button
          onClick={() => setActiveTab('taxonomy')}
          className={`px-4 py-2 rounded-xl text-xs font-semibold font-mono flex items-center gap-2 transition-all ${
            activeTab === 'taxonomy'
              ? 'bg-cyan-950 text-cyan-300 border border-cyan-800 shadow-md'
              : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
          }`}
        >
          <Layers className="w-4 h-4" />
          <span>15 Miền Tri Thức ({filteredDomains.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('rag_lab')}
          className={`px-4 py-2 rounded-xl text-xs font-semibold font-mono flex items-center gap-2 transition-all ${
            activeTab === 'rag_lab'
              ? 'bg-cyan-950 text-cyan-300 border border-cyan-800 shadow-md'
              : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
          }`}
        >
          <Search className="w-4 h-4" />
          <span>Phòng Nghiệm RAG &amp; Trích Dẫn</span>
        </button>

        <button
          onClick={() => setActiveTab('connectors')}
          className={`px-4 py-2 rounded-xl text-xs font-semibold font-mono flex items-center gap-2 transition-all ${
            activeTab === 'connectors'
              ? 'bg-cyan-950 text-cyan-300 border border-cyan-800 shadow-md'
              : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
          }`}
        >
          <Database className="w-4 h-4" />
          <span>Cổng Nguồn Dữ Liệu ({connectors.length})</span>
        </button>
      </div>

      {/* TAB 1: 15 KNOWLEDGE DOMAINS */}
      {activeTab === 'taxonomy' && (
        <div className="space-y-4">
          {/* Search & Filters */}
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Tìm kiếm chuyên ngành, chủ đề (Toán học, Vật lý, AI, Luật, Di sản)..."
                className="w-full pl-9 pr-4 py-2 bg-slate-900 border border-slate-800 rounded-xl text-xs text-slate-100 placeholder-slate-400 focus:outline-none focus:border-cyan-500"
              />
            </div>

            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-cyan-500"
            >
              <option value="ALL">Tất cả Nhóm Ngành ({domains.length})</option>
              {categories.map(c => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>

            <select
              value={selectedLanguage}
              onChange={(e) => setSelectedLanguage(e.target.value)}
              className="bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-cyan-500"
            >
              <option value="ALL">Mọi ngôn ngữ</option>
              <option value="vi">Tiếng Việt</option>
              <option value="en">English</option>
              <option value="ko">한국어 (Korean)</option>
              <option value="zh">中文 (Chinese)</option>
              <option value="ja">日本語 (Japanese)</option>
              <option value="fr">Français (French)</option>
            </select>
          </div>

          {/* Domain Cards Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {filteredDomains.map((domain) => {
              const isExpanded = expandedDomainId === domain.id;
              return (
                <div
                  key={domain.id}
                  className={`rounded-2xl border transition-all ${
                    isExpanded
                      ? 'bg-slate-900/90 border-cyan-500/50 shadow-lg shadow-cyan-950/30'
                      : 'bg-slate-950/70 border-slate-800 hover:border-slate-700'
                  }`}
                >
                  {/* Card Header */}
                  <div
                    onClick={() => setExpandedDomainId(isExpanded ? null : domain.id)}
                    className="p-4 cursor-pointer flex items-start justify-between gap-3 select-none"
                  >
                    <div className="flex items-start gap-3">
                      <div className="p-2.5 rounded-xl bg-slate-900 border border-slate-800 shrink-0">
                        {renderDomainIcon(domain.iconName)}
                      </div>
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <span className="font-mono text-xs font-black px-1.5 py-0.5 rounded bg-cyan-950 text-cyan-400 border border-cyan-800/60">
                            {domain.code}
                          </span>
                          <h3 className="font-bold text-sm text-slate-100">{domain.name}</h3>
                        </div>
                        <p className="text-[11px] text-slate-400 font-mono">{domain.englishName} • {domain.category}</p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-emerald-950/80 text-emerald-300 border border-emerald-800/60">
                        {domain.coverageScore}% Phủ
                      </span>
                      {isExpanded ? <ChevronDown className="w-4 h-4 text-slate-400" /> : <ChevronRight className="w-4 h-4 text-slate-400" />}
                    </div>
                  </div>

                  {/* Summary Bar */}
                  <div className="px-4 pb-3 flex items-center justify-between text-[11px] font-mono text-slate-400 border-t border-slate-800/40 pt-2">
                    <span>{domain.indexedRecordsCount.toLocaleString()} bản ghi học thuật</span>
                    <span>Độ mới: {domain.freshness}</span>
                  </div>

                  {/* Expanded Details */}
                  {isExpanded && (
                    <div className="p-4 bg-slate-950 border-t border-slate-800 space-y-3.5 text-xs">
                      {/* Subdomains list */}
                      <div>
                        <span className="font-mono text-[11px] text-cyan-400 block mb-1">Các Phân Ngành Chuyên Sâu ({domain.subdomains.length}):</span>
                        <div className="flex flex-wrap gap-1.5">
                          {domain.subdomains.map((sub, idx) => (
                            <span key={idx} className="px-2 py-0.5 rounded-md bg-slate-900 border border-slate-800 text-slate-300 text-[11px]">
                              {sub}
                            </span>
                          ))}
                        </div>
                      </div>

                      {/* Sample Topics */}
                      <div>
                        <span className="font-mono text-[11px] text-amber-400 block mb-1">Chủ Đề &amp; Thực Thể Tiêu Biểu:</span>
                        <div className="flex flex-wrap gap-1.5">
                          {domain.sampleTopics.map((topic, idx) => (
                            <button
                              key={idx}
                              onClick={(e) => {
                                e.stopPropagation();
                                setRagQuery(topic);
                                setActiveTab('rag_lab');
                                handleExecuteRag(topic);
                              }}
                              className="px-2 py-0.5 rounded-md bg-amber-950/30 hover:bg-amber-900/40 border border-amber-800/40 text-amber-200 text-[11px] transition-colors cursor-pointer flex items-center gap-1"
                              title="Tra cứu chủ đề này trong RAG Lab"
                            >
                              <span>{topic}</span>
                              <ChevronRight className="w-3 h-3 text-amber-400" />
                            </button>
                          ))}
                        </div>
                      </div>

                      {/* Source Collections */}
                      <div>
                        <span className="font-mono text-[11px] text-slate-400 block mb-1">Kho Nguồn Kết Nối:</span>
                        <div className="flex flex-wrap gap-1.5">
                          {domain.availableSourceCollections.map((col, idx) => (
                            <span key={idx} className="px-2 py-0.5 rounded-md bg-slate-900/60 border border-slate-800 text-slate-400 text-[10px] font-mono">
                              {col}
                            </span>
                          ))}
                        </div>
                      </div>

                      {/* Data Gaps & Disclaimer */}
                      {domain.disclaimer && (
                        <div className="p-2.5 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-300 text-[11px] font-mono flex items-start gap-2">
                          <AlertCircle className="w-3.5 h-3.5 shrink-0 text-amber-400 mt-0.5" />
                          <span>{domain.disclaimer}</span>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* TAB 2: INTERACTIVE RAG LAB */}
      {activeTab === 'rag_lab' && (
        <div className="space-y-4">
          <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 space-y-3">
            <h3 className="text-sm font-bold text-slate-100 flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-cyan-400" />
              Tra Cứu Đối Chiếu Tri Thức Đa Miền (Universal RAG)
            </h3>
            <p className="text-xs text-slate-400">
              Nhập câu hỏi hoặc chủ đề học thuật để kiểm chứng khả năng trích xuất đoạn văn (passages), xác định độ tin cậy và nguồn trích dẫn học thuật (APA / IEEE).
            </p>

            <div className="flex gap-2">
              <input
                type="text"
                value={ragQuery}
                onChange={(e) => setRagQuery(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleExecuteRag()}
                placeholder="Nhập câu hỏi, ví dụ: 'Cơ chế chú ý trong Transformer', 'Kim tự tháp Giza', 'Định lý Fermat'..."
                className="flex-1 bg-slate-950 border border-slate-800 rounded-xl px-4 py-2 text-xs text-slate-100 placeholder-slate-400 focus:outline-none focus:border-cyan-500"
              />
              <button
                onClick={() => handleExecuteRag()}
                disabled={isSearchingRag || !ragQuery.trim()}
                className="px-4 py-2 rounded-xl bg-gradient-to-r from-cyan-500 to-sky-600 hover:from-cyan-400 hover:to-sky-500 text-slate-950 font-bold text-xs flex items-center gap-2 transition-all disabled:opacity-40 cursor-pointer shadow-md"
              >
                {isSearchingRag ? (
                  <>
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                    <span>Đang truy xuất...</span>
                  </>
                ) : (
                  <>
                    <Search className="w-3.5 h-3.5" />
                    <span>Truy xuất RAG</span>
                  </>
                )}
              </button>
            </div>
          </div>

          {/* RAG Results Display */}
          {ragResult && (
            <div className="p-5 rounded-2xl bg-slate-900/90 border border-slate-800 space-y-4 shadow-xl">
              <div className="flex items-center justify-between pb-3 border-b border-slate-800">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                  <span className="font-bold text-sm text-slate-100">Kết Quả Truy Xuất Kiểm Chứng</span>
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-800 text-slate-400">
                    {ragResult.retrievalLatencyMs}ms
                  </span>
                </div>
                <span className="text-xs text-slate-400 font-mono">
                  Khớp {ragResult.matchedDomains?.length || 0} Miền Tri Thức
                </span>
              </div>

              {/* Matched Domains Badges */}
              <div className="flex flex-wrap gap-2">
                {ragResult.matchedDomains?.map((md: any) => (
                  <span key={md.id} className="px-2.5 py-1 rounded-lg bg-cyan-950 text-cyan-300 border border-cyan-800/80 text-xs font-mono font-semibold flex items-center gap-1.5">
                    <span>[{md.code}] {md.name}</span>
                  </span>
                ))}
              </div>

              {/* Top Passages */}
              <div className="space-y-3">
                {ragResult.topPassages?.map((passage: any) => (
                  <div key={passage.id} className="p-4 rounded-xl bg-slate-950 border border-slate-800/80 space-y-2">
                    <div className="flex items-center justify-between">
                      <h4 className="font-semibold text-xs text-cyan-300">{passage.title}</h4>
                      <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-950 text-emerald-300 border border-emerald-800">
                        {passage.verificationTier} • {(passage.confidence * 100).toFixed(0)}% Tin cậy
                      </span>
                    </div>

                    <p className="text-xs text-slate-200 leading-relaxed font-sans">
                      {passage.content}
                    </p>

                    <div className="p-2 rounded-lg bg-slate-900 border border-slate-800/60 flex items-center justify-between text-[11px] font-mono text-slate-400">
                      <span className="truncate mr-2">Trích dẫn: {passage.citation}</span>
                      <button
                        onClick={() => copyCitation(passage.citation, passage.id)}
                        className="px-2 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-200 text-[10px] flex items-center gap-1 shrink-0 transition-colors"
                        title="Sao chép trích dẫn"
                      >
                        {copiedCitationId === passage.id ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                        <span>{copiedCitationId === passage.id ? 'Đã chép' : 'Chép'}</span>
                      </button>
                    </div>
                  </div>
                ))}
              </div>

              {/* Disclaimer */}
              {ragResult.disclaimer && (
                <div className="text-[11px] font-mono text-slate-400 p-2.5 rounded-xl bg-slate-950 border border-slate-800 flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4 text-cyan-500 shrink-0" />
                  <span>{ragResult.disclaimer}</span>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* TAB 3: CONNECTORS DIRECTORY */}
      {activeTab === 'connectors' && (
        <div className="space-y-4">
          <div className="p-4 rounded-xl bg-slate-900 border border-slate-800">
            <h3 className="text-sm font-bold text-slate-100 flex items-center gap-2">
              <Database className="w-4 h-4 text-cyan-400" />
              Danh Mục Cổng Nguồn Dữ Liệu Học Thuật Mở (Universal Connectors)
            </h3>
            <p className="text-xs text-slate-400 mt-1">
              Các nguồn tài nguyên mở được cấp phép, có API tra cứu chính thống, hỗ trợ đối chiếu thực tế và không xâm phạm bản quyền đóng.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {connectors.map((conn) => (
              <div key={conn.id} className="p-4 rounded-2xl bg-slate-950 border border-slate-800 hover:border-slate-700 transition-all space-y-3">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <h4 className="font-bold text-sm text-slate-100">{conn.name}</h4>
                    <p className="text-[11px] text-slate-400 font-mono">{conn.provider}</p>
                  </div>
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-emerald-950 text-emerald-300 border border-emerald-800 font-bold">
                    {conn.status}
                  </span>
                </div>

                <div className="space-y-1 text-xs text-slate-300">
                  <div className="flex items-center justify-between text-[11px] font-mono">
                    <span className="text-slate-400">Giấy phép:</span>
                    <span className="text-slate-200">{conn.license}</span>
                  </div>
                  <div className="flex items-center justify-between text-[11px] font-mono">
                    <span className="text-slate-400">Bản ghi có sẵn:</span>
                    <span className="text-cyan-400 font-bold">{conn.indexedDocumentsCount.toLocaleString()}</span>
                  </div>
                  <div className="flex items-center justify-between text-[11px] font-mono">
                    <span className="text-slate-400">Định dạng hỗ trợ:</span>
                    <span className="text-slate-200">{conn.supportedFormats.join(', ')}</span>
                  </div>
                </div>

                <div className="pt-2 border-t border-slate-800/60 flex items-center justify-between text-[10px] font-mono text-slate-400">
                  <span>Hạn mức: {conn.rateLimitPerMin} req/phút</span>
                  <span className="text-slate-400 truncate max-w-[150px]">{conn.endpoint}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
