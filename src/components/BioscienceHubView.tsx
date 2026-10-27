/**
 * NDAWG PRO — Bioscience Hub View
 * Interactive Scientific Computing & Bioinformatics Platform
 * Conforms to Google DeepMind Science Skills:
 * - AlphaFold DB (structure predictions & pLDDT confidence)
 * - UniProtKB & RCSB PDB
 * - PubChem & Lipinski Rule of 5 Drug Discovery
 * - Europe PMC Literature Search
 * - Reactome Pathways
 */

import React, { useState } from 'react';
import {
  Dna,
  Search,
  ExternalLink,
  BookOpen,
  Layers,
  Activity,
  CheckCircle2,
  AlertCircle,
  FlaskConical,
  GitBranch,
  RefreshCw,
  Sparkles,
  ShieldCheck
} from 'lucide-react';
import {
  fetchAlphaFoldStructure,
  fetchPubChemCompound,
  searchEuropePMC,
  fetchReactomePathways,
  AlphaFoldPrediction,
  PubChemCompound,
  ScienceArticle,
  ReactomePathway
} from '../services/bioscienceService.ts';

type ScienceTab = 'proteins' | 'chemistry' | 'pathways' | 'literature';

export const BioscienceHubView: React.FC = () => {
  const [activeTab, setActiveTab] = useState<ScienceTab>('proteins');

  // Protein State
  const [proteinQuery, setProteinQuery] = useState('P04637'); // Tumor protein p53
  const [proteinData, setProteinData] = useState<AlphaFoldPrediction | null>(null);
  const [isProteinLoading, setIsProteinLoading] = useState(false);

  // Chemistry State
  const [compoundQuery, setCompoundQuery] = useState('Aspirin');
  const [compoundData, setCompoundData] = useState<PubChemCompound | null>(null);
  const [isCompoundLoading, setIsCompoundLoading] = useState(false);

  // Pathway State
  const [pathwayQuery, setPathwayQuery] = useState('P04637');
  const [pathways, setPathways] = useState<ReactomePathway[]>([]);
  const [isPathwayLoading, setIsPathwayLoading] = useState(false);

  // Literature State
  const [literatureQuery, setLiteratureQuery] = useState('AlphaFold structural biology');
  const [articles, setArticles] = useState<ScienceArticle[]>([]);
  const [isLiteratureLoading, setIsLiteratureLoading] = useState(false);

  // Handlers
  const handleSearchProtein = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!proteinQuery.trim()) return;
    setIsProteinLoading(true);
    try {
      const data = await fetchAlphaFoldStructure(proteinQuery);
      setProteinData(data);
    } finally {
      setIsProteinLoading(false);
    }
  };

  const handleSearchCompound = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!compoundQuery.trim()) return;
    setIsCompoundLoading(true);
    try {
      const data = await fetchPubChemCompound(compoundQuery);
      setCompoundData(data);
    } finally {
      setIsCompoundLoading(false);
    }
  };

  const handleSearchPathways = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!pathwayQuery.trim()) return;
    setIsPathwayLoading(true);
    try {
      const list = await fetchReactomePathways(pathwayQuery);
      setPathways(list);
    } finally {
      setIsPathwayLoading(false);
    }
  };

  const handleSearchLiterature = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!literatureQuery.trim()) return;
    setIsLiteratureLoading(true);
    try {
      const list = await searchEuropePMC(literatureQuery);
      setArticles(list);
    } finally {
      setIsLiteratureLoading(false);
    }
  };

  return (
    <div className="space-y-6 max-w-6xl mx-auto font-sans">
      {/* Header Banner */}
      <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-xl bg-emerald-950/80 border border-emerald-800/80 text-emerald-400">
              <Dna className="w-5 h-5" />
            </div>
            <h1 className="text-xl font-bold text-white tracking-tight">
              Bioscience &amp; Molecular Intelligence Platform
            </h1>
            <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-emerald-950 text-emerald-300 border border-emerald-800">
              DeepMind Science Suite
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-2 font-sans leading-relaxed">
            Nền tảng tra cứu và phân tích cấu trúc sinh học phân tử: AlphaFold DB (pLDDT confidence), PubChem &amp; Lipinski Rule of 5, Reactome Pathways và Thư viện Y sinh Europe PMC.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <div className="px-3 py-1.5 rounded-xl bg-slate-950/80 border border-slate-800 text-[11px] font-mono text-slate-300 flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <span>AlphaFold DB v4 Connected</span>
          </div>
        </div>
      </div>

      {/* Sub Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-800 pb-2 overflow-x-auto">
        <button
          onClick={() => setActiveTab('proteins')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold transition-all cursor-pointer whitespace-nowrap ${
            activeTab === 'proteins'
              ? 'bg-emerald-600 text-white shadow-md'
              : 'text-slate-400 hover:text-white hover:bg-slate-900'
          }`}
        >
          <Layers className="w-4 h-4" />
          <span>Cấu Trúc Protein &amp; AlphaFold DB</span>
        </button>

        <button
          onClick={() => setActiveTab('chemistry')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold transition-all cursor-pointer whitespace-nowrap ${
            activeTab === 'chemistry'
              ? 'bg-emerald-600 text-white shadow-md'
              : 'text-slate-400 hover:text-white hover:bg-slate-900'
          }`}
        >
          <FlaskConical className="w-4 h-4" />
          <span>Hóa Học &amp; Dược Lý (PubChem)</span>
        </button>

        <button
          onClick={() => setActiveTab('pathways')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold transition-all cursor-pointer whitespace-nowrap ${
            activeTab === 'pathways'
              ? 'bg-emerald-600 text-white shadow-md'
              : 'text-slate-400 hover:text-white hover:bg-slate-900'
          }`}
        >
          <GitBranch className="w-4 h-4" />
          <span>Con Đường Sinh Học (Reactome)</span>
        </button>

        <button
          onClick={() => setActiveTab('literature')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold transition-all cursor-pointer whitespace-nowrap ${
            activeTab === 'literature'
              ? 'bg-emerald-600 text-white shadow-md'
              : 'text-slate-400 hover:text-white hover:bg-slate-900'
          }`}
        >
          <BookOpen className="w-4 h-4" />
          <span>Y Văn &amp; Thử Nghiệm Lâm Sàng</span>
        </button>
      </div>

      {/* TAB 1: PROTEINS & ALPHAFOLD DB */}
      {activeTab === 'proteins' && (
        <div className="space-y-4">
          <form onSubmit={handleSearchProtein} className="flex gap-2">
            <input
              type="text"
              placeholder="Nhập mã UniProt Accession (vd: P04637, P00533, P68871)..."
              value={proteinQuery}
              onChange={(e) => setProteinQuery(e.target.value)}
              className="flex-1 bg-slate-900 border border-slate-800 rounded-2xl px-4 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500 font-mono"
            />
            <button
              type="submit"
              disabled={isProteinLoading}
              className="px-5 py-2.5 rounded-2xl bg-emerald-600 hover:bg-emerald-500 text-slate-950 font-bold text-xs flex items-center gap-2 transition-all cursor-pointer"
            >
              <Search className="w-4 h-4" />
              <span>Tra Cứu AlphaFold</span>
            </button>
          </form>

          {isProteinLoading ? (
            <div className="p-12 text-center text-slate-500 text-xs font-mono">
              <RefreshCw className="w-6 h-6 text-emerald-400 animate-spin mx-auto mb-2" />
              Đang truy vấn mô hình dự đoán cấu trúc 3D từ AlphaFold DB...
            </div>
          ) : proteinData ? (
            <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 space-y-4">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 border-b border-slate-800/80 pb-4">
                <div>
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-950 text-emerald-400 border border-emerald-800">
                    {proteinData.entryId}
                  </span>
                  <h3 className="text-base font-bold text-white mt-1">
                    {proteinData.gene} — {proteinData.organismScientificName}
                  </h3>
                  <p className="text-xs text-slate-400 mt-0.5 font-sans">{proteinData.uniprotDescription}</p>
                </div>

                <div className="p-3 bg-slate-950 rounded-2xl border border-slate-800 text-right">
                  <div className="text-[10px] font-mono text-slate-400">Độ Tin Cậy pLDDT Trung Bình</div>
                  <div className="text-xl font-bold font-mono text-emerald-400 mt-0.5">
                    {proteinData.globalMetricValue.toFixed(1)} / 100
                  </div>
                  <div className="text-[10px] text-slate-500">
                    {proteinData.globalMetricValue > 90 ? 'Very High (>90)' : 'Confident (70-90)'}
                  </div>
                </div>
              </div>

              {/* pLDDT Color Legend */}
              <div className="p-3 bg-slate-950/60 rounded-xl border border-slate-800 flex flex-wrap items-center justify-between gap-2 text-[10px] font-mono">
                <span className="text-slate-400 font-semibold">Thang màu pLDDT AlphaFold:</span>
                <span className="px-2 py-0.5 rounded bg-blue-900 text-blue-200">Very High (&gt;90)</span>
                <span className="px-2 py-0.5 rounded bg-cyan-900 text-cyan-200">Confident (70-90)</span>
                <span className="px-2 py-0.5 rounded bg-amber-900 text-amber-200">Low (50-70)</span>
                <span className="px-2 py-0.5 rounded bg-orange-950 text-orange-300">Very Low (&lt;50)</span>
              </div>

              {/* Download Links & External Deep-Links */}
              <div className="flex flex-wrap items-center gap-2 pt-2">
                {proteinData.pdbUrl && (
                  <a
                    href={proteinData.pdbUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs text-slate-200 font-mono transition-colors"
                  >
                    <ExternalLink className="w-3.5 h-3.5 text-emerald-400" />
                    <span>Tải tệp .PDB</span>
                  </a>
                )}
                {proteinData.cifUrl && (
                  <a
                    href={proteinData.cifUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs text-slate-200 font-mono transition-colors"
                  >
                    <ExternalLink className="w-3.5 h-3.5 text-cyan-400" />
                    <span>Tải tệp .CIF (mmCIF)</span>
                  </a>
                )}
                <a
                  href={`https://alphafold.ebi.ac.uk/entry/${proteinData.uniprotAccession}`}
                  target="_blank"
                  rel="noreferrer"
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-950/60 hover:bg-emerald-900/60 border border-emerald-800/80 text-xs text-emerald-300 font-mono transition-colors ml-auto"
                >
                  <ExternalLink className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Mở AlphaFold DB</span>
                </a>
              </div>
            </div>
          ) : (
            <div className="p-8 text-center text-slate-500 text-xs font-mono bg-slate-900/40 rounded-3xl border border-slate-800/50">
              Nhấn "Tra Cứu AlphaFold" để kiểm tra cấu trúc 3D của protein p53 (P04637) hoặc nhập mã UniProt của bạn.
            </div>
          )}
        </div>
      )}

      {/* TAB 2: CHEMISTRY & DRUG DISCOVERY (PUBCHEM) */}
      {activeTab === 'chemistry' && (
        <div className="space-y-4">
          <form onSubmit={handleSearchCompound} className="flex gap-2">
            <input
              type="text"
              placeholder="Nhập tên hoạt chất hoặc hợp chất (vd: Aspirin, Ibuprofen, Paracetamol, Remdesivir)..."
              value={compoundQuery}
              onChange={(e) => setCompoundQuery(e.target.value)}
              className="flex-1 bg-slate-900 border border-slate-800 rounded-2xl px-4 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500"
            />
            <button
              type="submit"
              disabled={isCompoundLoading}
              className="px-5 py-2.5 rounded-2xl bg-emerald-600 hover:bg-emerald-500 text-slate-950 font-bold text-xs flex items-center gap-2 transition-all cursor-pointer"
            >
              <Search className="w-4 h-4" />
              <span>Tra Cứu PubChem</span>
            </button>
          </form>

          {isCompoundLoading ? (
            <div className="p-12 text-center text-slate-500 text-xs font-mono">
              <RefreshCw className="w-6 h-6 text-emerald-400 animate-spin mx-auto mb-2" />
              Đang truy vấn PubChem PUG REST API &amp; tính toán quy tắc Lipinski...
            </div>
          ) : compoundData ? (
            <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 space-y-4">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-slate-800 pb-4">
                <div>
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-800 text-slate-300">
                    PubChem CID: {compoundData.cid}
                  </span>
                  <h3 className="text-lg font-bold text-white mt-1 capitalize">{compoundData.name}</h3>
                  <p className="text-xs text-slate-400 font-mono mt-0.5">
                    Công thức: <span className="text-cyan-300 font-bold">{compoundData.molecularFormula}</span> • Khối lượng: {compoundData.molecularWeight.toFixed(2)} g/mol
                  </p>
                </div>

                <div
                  className={`p-3 rounded-2xl border text-right ${
                    compoundData.lipinskiPassed
                      ? 'bg-emerald-950/60 border-emerald-800 text-emerald-300'
                      : 'bg-amber-950/60 border-amber-800 text-amber-300'
                  }`}
                >
                  <div className="text-[10px] font-mono uppercase font-semibold">Lipinski Rule of 5</div>
                  <div className="text-sm font-bold mt-0.5">
                    {compoundData.lipinskiPassed ? 'Đạt chuẩn (0 vi phạm)' : `${compoundData.lipinskiViolations.length} vi phạm`}
                  </div>
                </div>
              </div>

              {/* Physicochemical Parameters Grid */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div className="p-3 bg-slate-950 rounded-xl border border-slate-800/80">
                  <div className="text-[10px] font-mono text-slate-400">LogP (Độ tan dầu)</div>
                  <div className="text-sm font-bold text-white font-mono mt-0.5">{compoundData.xLogP?.toFixed(2) ?? 'N/A'}</div>
                  <div className="text-[10px] text-slate-500">&le; 5.0 chuẩn</div>
                </div>
                <div className="p-3 bg-slate-950 rounded-xl border border-slate-800/80">
                  <div className="text-[10px] font-mono text-slate-400">H-Bond Donors</div>
                  <div className="text-sm font-bold text-white font-mono mt-0.5">{compoundData.hBondDonorCount}</div>
                  <div className="text-[10px] text-slate-500">&le; 5 chuẩn</div>
                </div>
                <div className="p-3 bg-slate-950 rounded-xl border border-slate-800/80">
                  <div className="text-[10px] font-mono text-slate-400">H-Bond Acceptors</div>
                  <div className="text-sm font-bold text-white font-mono mt-0.5">{compoundData.hBondAcceptorCount}</div>
                  <div className="text-[10px] text-slate-500">&le; 10 chuẩn</div>
                </div>
                <div className="p-3 bg-slate-950 rounded-xl border border-slate-800/80">
                  <div className="text-[10px] font-mono text-slate-400">TPSA (Diện tích cực)</div>
                  <div className="text-sm font-bold text-white font-mono mt-0.5">{compoundData.tpsa?.toFixed(1) ?? 'N/A'} &Aring;&sup2;</div>
                  <div className="text-[10px] text-slate-500">&le; 140 &Aring;&sup2;</div>
                </div>
              </div>

              {/* Canonical SMILES */}
              <div className="p-3 bg-slate-950 rounded-xl border border-slate-800 font-mono text-xs">
                <div className="text-[10px] text-slate-400 mb-1">Chuỗi SMILES chuẩn (Canonical SMILES):</div>
                <code className="text-emerald-400 break-all">{compoundData.canonicalSmiles}</code>
              </div>

              {/* 2D Structure Preview from PubChem */}
              <div className="flex items-center gap-4 pt-2">
                <img
                  src={`https://pubchem.ncbi.nlm.nih.gov/rest/pug/compound/cid/${compoundData.cid}/PNG?image_size=160x160`}
                  alt={compoundData.name}
                  className="w-24 h-24 rounded-xl bg-white p-2 object-contain border border-slate-700"
                />
                <div className="space-y-1">
                  <div className="text-xs font-semibold text-white">Cấu trúc 2D PubChem</div>
                  <p className="text-[11px] text-slate-400">
                    Biểu diễn phối cảnh nguyên tử và liên kết hóa học chuẩn PUG REST.
                  </p>
                  <a
                    href={`https://pubchem.ncbi.nlm.nih.gov/compound/${compoundData.cid}`}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-1 text-[11px] font-mono text-emerald-400 hover:underline pt-1"
                  >
                    <span>Mở chi tiết trên PubChem</span>
                    <ExternalLink className="w-3 h-3" />
                  </a>
                </div>
              </div>
            </div>
          ) : (
            <div className="p-8 text-center text-slate-500 text-xs font-mono bg-slate-900/40 rounded-3xl border border-slate-800/50">
              Nhấn "Tra Cứu PubChem" để phân tích đặc tính lý hóa và quy tắc Lipinski của hoạt chất Aspirin.
            </div>
          )}
        </div>
      )}

      {/* TAB 3: REACTOME PATHWAYS */}
      {activeTab === 'pathways' && (
        <div className="space-y-4">
          <form onSubmit={handleSearchPathways} className="flex gap-2">
            <input
              type="text"
              placeholder="Nhập mã UniProt để tra con đường sinh học Reactome (vd: P04637)..."
              value={pathwayQuery}
              onChange={(e) => setPathwayQuery(e.target.value)}
              className="flex-1 bg-slate-900 border border-slate-800 rounded-2xl px-4 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500 font-mono"
            />
            <button
              type="submit"
              disabled={isPathwayLoading}
              className="px-5 py-2.5 rounded-2xl bg-emerald-600 hover:bg-emerald-500 text-slate-950 font-bold text-xs flex items-center gap-2 transition-all cursor-pointer"
            >
              <Search className="w-4 h-4" />
              <span>Tra Cứu Pathways</span>
            </button>
          </form>

          {isPathwayLoading ? (
            <div className="p-12 text-center text-slate-500 text-xs font-mono">
              <RefreshCw className="w-6 h-6 text-emerald-400 animate-spin mx-auto mb-2" />
              Đang tải danh sách con đường sinh học từ Reactome Content Service...
            </div>
          ) : pathways.length > 0 ? (
            <div className="space-y-2">
              {pathways.map((p) => (
                <div
                  key={p.stId}
                  className="flex items-center justify-between p-3.5 rounded-2xl bg-slate-900 border border-slate-800 hover:border-slate-700 transition-colors"
                >
                  <div>
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-800 text-slate-400">
                      {p.stId}
                    </span>
                    <h4 className="text-xs font-semibold text-white mt-1">{p.name}</h4>
                    <span className="text-[10px] text-slate-400 font-mono">{p.species}</span>
                  </div>

                  <a
                    href={`https://reactome.org/PathwayBrowser/#/${p.stId}`}
                    target="_blank"
                    rel="noreferrer"
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs text-slate-200 font-mono transition-colors"
                  >
                    <span>Xem Sơ Đồ</span>
                    <ExternalLink className="w-3 h-3 text-emerald-400" />
                  </a>
                </div>
              ))}
            </div>
          ) : (
            <div className="p-8 text-center text-slate-500 text-xs font-mono bg-slate-900/40 rounded-3xl border border-slate-800/50">
              Nhấn "Tra Cứu Pathways" để kiểm tra các con đường sinh học liên quan đến p53 (P04637).
            </div>
          )}
        </div>
      )}

      {/* TAB 4: LITERATURE & CLINICAL TRIALS */}
      {activeTab === 'literature' && (
        <div className="space-y-4">
          <form onSubmit={handleSearchLiterature} className="flex gap-2">
            <input
              type="text"
              placeholder="Từ khóa tra cứu y văn (vd: AlphaFold structural biology, CRISPR-Cas9 clinical trial)..."
              value={literatureQuery}
              onChange={(e) => setLiteratureQuery(e.target.value)}
              className="flex-1 bg-slate-900 border border-slate-800 rounded-2xl px-4 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500"
            />
            <button
              type="submit"
              disabled={isLiteratureLoading}
              className="px-5 py-2.5 rounded-2xl bg-emerald-600 hover:bg-emerald-500 text-slate-950 font-bold text-xs flex items-center gap-2 transition-all cursor-pointer"
            >
              <Search className="w-4 h-4" />
              <span>Tìm Kiếm Y Văn</span>
            </button>
          </form>

          {isLiteratureLoading ? (
            <div className="p-12 text-center text-slate-500 text-xs font-mono">
              <RefreshCw className="w-6 h-6 text-emerald-400 animate-spin mx-auto mb-2" />
              Đang tìm kiếm bài báo khoa học từ Europe PMC &amp; PubMed...
            </div>
          ) : articles.length > 0 ? (
            <div className="space-y-3">
              {articles.map((art) => (
                <div key={art.id} className="p-4 rounded-2xl bg-slate-900 border border-slate-800 space-y-2">
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-[10px] font-mono text-slate-400">
                      {art.journalTitle || 'Europe PMC'} • {art.pubYear}
                    </span>
                    {art.isOpenAccess && (
                      <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-950 text-emerald-400 border border-emerald-800">
                        Open Access
                      </span>
                    )}
                  </div>
                  <h4 className="text-xs font-bold text-white hover:text-emerald-300 transition-colors">
                    <a href={art.url} target="_blank" rel="noreferrer">
                      {art.title}
                    </a>
                  </h4>
                  <p className="text-[11px] text-slate-400 font-sans">{art.authorString}</p>
                  {art.abstractText && (
                    <p className="text-[11px] text-slate-400 font-sans leading-relaxed bg-slate-950/60 p-2.5 rounded-xl border border-slate-800/60">
                      {art.abstractText}
                    </p>
                  )}
                  <div className="pt-1">
                    <a
                      href={art.url}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex items-center gap-1 text-[11px] font-mono text-emerald-400 hover:underline"
                    >
                      <span>Đọc bài báo gốc</span>
                      <ExternalLink className="w-3 h-3" />
                    </a>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="p-8 text-center text-slate-500 text-xs font-mono bg-slate-900/40 rounded-3xl border border-slate-800/50">
              Nhấn "Tìm Kiếm Y Văn" để truy xuất các bài báo mới nhất về AlphaFold &amp; Sinh học cấu trúc.
            </div>
          )}
        </div>
      )}
    </div>
  );
};
