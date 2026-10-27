import React, { useState } from 'react';
import {
  Briefcase,
  FileSpreadsheet,
  FileText,
  Download,
  BarChart,
  CheckCircle2,
  Calculator,
  TrendingUp,
  Table,
  Sparkles
} from 'lucide-react';
import {
  WorkCenterEngine,
  StatisticalSummary,
  BivariateAnalysis,
  GeneratedArtifact
} from '../modules/workCenter.ts';

interface WorkCenterViewProps {
  workCenter: WorkCenterEngine;
}

export const WorkCenterView: React.FC<WorkCenterViewProps> = ({ workCenter }) => {
  const [dataInput, setDataInput] = useState<string>('12, 24, 38, 45, 58, 62, 75, 89, 94');
  const [xDataInput, setXDataInput] = useState<string>('1, 2, 3, 4, 5, 6, 7');
  const [yDataInput, setYDataInput] = useState<string>('14, 28, 41, 55, 72, 85, 98');

  const [univariateStats, setUnivariateStats] = useState<StatisticalSummary | null>(() => {
    return workCenter.computeUnivariateStats([12, 24, 38, 45, 58, 62, 75, 89, 94]);
  });

  const [bivariateStats, setBivariateStats] = useState<BivariateAnalysis | null>(() => {
    return workCenter.computeBivariateStats([1, 2, 3, 4, 5, 6, 7], [14, 28, 41, 55, 72, 85, 98]);
  });

  const [artifacts, setArtifacts] = useState<GeneratedArtifact[]>(() => workCenter.getArtifacts());
  const [lastGeneratedId, setLastGeneratedId] = useState<string | null>(null);

  const handleComputeUnivariate = () => {
    const parsed = dataInput
      .split(',')
      .map((s) => parseFloat(s.trim()))
      .filter((n) => !isNaN(n));

    if (parsed.length > 0) {
      const stats = workCenter.computeUnivariateStats(parsed);
      setUnivariateStats(stats);
    }
  };

  const handleComputeBivariate = () => {
    const xParsed = xDataInput
      .split(',')
      .map((s) => parseFloat(s.trim()))
      .filter((n) => !isNaN(n));
    const yParsed = yDataInput
      .split(',')
      .map((s) => parseFloat(s.trim()))
      .filter((n) => !isNaN(n));

    if (xParsed.length === yParsed.length && xParsed.length >= 2) {
      const res = workCenter.computeBivariateStats(xParsed, yParsed);
      setBivariateStats(res);
    }
  };

  const handleGenerateCsv = () => {
    const headers = ['SampleID', 'Value', 'DeviationFromMean'];
    const parsed = dataInput
      .split(',')
      .map((s) => parseFloat(s.trim()))
      .filter((n) => !isNaN(n));

    const mean = univariateStats?.mean || 0;
    const rows = parsed.map((v, i) => [i + 1, v, Number((v - mean).toFixed(2))]);

    const artifact = workCenter.generateCsvExport('univariate_dataset_export.csv', headers, rows);
    setArtifacts(workCenter.getArtifacts());
    setLastGeneratedId(artifact.id);
  };

  const handleGenerateMarkdown = () => {
    if (!univariateStats) return;
    const artifact = workCenter.generateMarkdownReport(
      'Báo Cáo Phân Tích Dữ Liệu Thực Nghiệm',
      univariateStats,
      bivariateStats || undefined
    );
    setArtifacts(workCenter.getArtifacts());
    setLastGeneratedId(artifact.id);
  };

  const handleGenerateSvg = () => {
    const parsed = dataInput
      .split(',')
      .map((s) => parseFloat(s.trim()))
      .filter((n) => !isNaN(n));

    const labels = parsed.map((_, i) => `S${i + 1}`);
    const artifact = workCenter.generateSvgChart('statistical_distribution.svg', labels, parsed);
    setArtifacts(workCenter.getArtifacts());
    setLastGeneratedId(artifact.id);
  };

  const triggerDownload = (artifact: GeneratedArtifact) => {
    const blob = new Blob([artifact.content], { type: artifact.mimeType });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = artifact.filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-slate-900 border border-slate-800 rounded-xl p-5">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-bold text-white flex items-center gap-2">
              <Briefcase className="w-5 h-5 text-indigo-400" />
              Work Center — Deterministic Analytics &amp; Verified Exporter
            </h1>
            <span className="text-xs px-2.5 py-0.5 rounded-full font-mono bg-indigo-950 text-indigo-300 border border-indigo-800">
              Part 4/5
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Tính toán số học thực nghiệm (mean, median, variance, std dev, pearson r) • Tạo xuất bản thực tế (CSV/MD/SVG) • Rào chắn chống xuất file rỗng
          </p>
        </div>

        {/* Quick Generator Actions */}
        <div className="flex items-center gap-2">
          <button
            onClick={handleGenerateCsv}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-medium transition-all shadow-sm"
          >
            <FileSpreadsheet className="w-3.5 h-3.5" />
            <span>Tạo CSV</span>
          </button>
          <button
            onClick={handleGenerateMarkdown}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-medium transition-all shadow-sm"
          >
            <FileText className="w-3.5 h-3.5" />
            <span>Tạo Báo Cáo MD</span>
          </button>
          <button
            onClick={handleGenerateSvg}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-medium transition-all shadow-sm"
          >
            <BarChart className="w-3.5 h-3.5" />
            <span>Tạo Biểu Đồ SVG</span>
          </button>
        </div>
      </div>

      {/* Main Grid: Descriptive Univariate & Bivariate Analytics */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Univariate Math Engine */}
        <div className="lg:col-span-6 space-y-4">
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 space-y-4">
            <span className="text-xs font-semibold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
              <Calculator className="w-3.5 h-3.5 text-cyan-400" />
              1. Thống Kê Mô Tả Một Biến (Univariate Analysis)
            </span>

            <div>
              <label className="text-xs text-slate-400 block mb-1">Chuỗi giá trị mẫu (cách nhau bằng dấu phẩy):</label>
              <input
                type="text"
                value={dataInput}
                onChange={(e) => setDataInput(e.target.value)}
                className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-lg text-xs font-mono text-slate-200 focus:outline-none focus:border-cyan-500"
              />
            </div>

            <button
              onClick={handleComputeUnivariate}
              className="py-1.5 px-3 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium border border-slate-700 transition-colors"
            >
              Tính Toán Chỉ Số Thống Kê
            </button>

            {univariateStats && (
              <div className="grid grid-cols-3 gap-2.5 pt-2 border-t border-slate-800">
                <div className="p-2.5 rounded bg-slate-950 border border-slate-800">
                  <span className="text-[10px] text-slate-500 uppercase block">Cỡ Mẫu (N)</span>
                  <span className="text-base font-mono font-bold text-white">{univariateStats.count}</span>
                </div>
                <div className="p-2.5 rounded bg-slate-950 border border-slate-800">
                  <span className="text-[10px] text-slate-500 uppercase block">Trung Bình (Mean)</span>
                  <span className="text-base font-mono font-bold text-cyan-400">{univariateStats.mean}</span>
                </div>
                <div className="p-2.5 rounded bg-slate-950 border border-slate-800">
                  <span className="text-[10px] text-slate-500 uppercase block">Trung Vị (Median)</span>
                  <span className="text-base font-mono font-bold text-indigo-400">{univariateStats.median}</span>
                </div>
                <div className="p-2.5 rounded bg-slate-950 border border-slate-800">
                  <span className="text-[10px] text-slate-500 uppercase block">Phương Sai (s²)</span>
                  <span className="text-base font-mono font-bold text-slate-300">{univariateStats.variance}</span>
                </div>
                <div className="p-2.5 rounded bg-slate-950 border border-slate-800">
                  <span className="text-[10px] text-slate-500 uppercase block">Độ Lệch Chuẩn (s)</span>
                  <span className="text-base font-mono font-bold text-emerald-400">{univariateStats.stdDev}</span>
                </div>
                <div className="p-2.5 rounded bg-slate-950 border border-slate-800">
                  <span className="text-[10px] text-slate-500 uppercase block">Khoảng Biến Thiên</span>
                  <span className="text-base font-mono font-bold text-amber-400">{univariateStats.range}</span>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Right Column: Bivariate Correlation & Linear Regression */}
        <div className="lg:col-span-6 space-y-4">
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 space-y-4">
            <span className="text-xs font-semibold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
              <TrendingUp className="w-3.5 h-3.5 text-indigo-400" />
              2. Tương Quan &amp; Hồi Quy Tuyến Tính (Bivariate)
            </span>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs text-slate-400 block mb-1">Mảng X (Độc lập):</label>
                <input
                  type="text"
                  value={xDataInput}
                  onChange={(e) => setXDataInput(e.target.value)}
                  className="w-full px-3 py-1.5 bg-slate-950 border border-slate-700 rounded-lg text-xs font-mono text-slate-200"
                />
              </div>
              <div>
                <label className="text-xs text-slate-400 block mb-1">Mảng Y (Phụ thuộc):</label>
                <input
                  type="text"
                  value={yDataInput}
                  onChange={(e) => setYDataInput(e.target.value)}
                  className="w-full px-3 py-1.5 bg-slate-950 border border-slate-700 rounded-lg text-xs font-mono text-slate-200"
                />
              </div>
            </div>

            <button
              onClick={handleComputeBivariate}
              className="py-1.5 px-3 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium border border-slate-700 transition-colors"
            >
              Phân Tích Tương Quan
            </button>

            {bivariateStats && (
              <div className="space-y-3 pt-2 border-t border-slate-800">
                <div className="grid grid-cols-3 gap-2.5">
                  <div className="p-2.5 rounded bg-slate-950 border border-slate-800">
                    <span className="text-[10px] text-slate-500 uppercase block">Pearson r</span>
                    <span className="text-base font-mono font-bold text-cyan-400">
                      {bivariateStats.pearsonCorrelation}
                    </span>
                  </div>
                  <div className="p-2.5 rounded bg-slate-950 border border-slate-800">
                    <span className="text-[10px] text-slate-500 uppercase block">Hệ số R²</span>
                    <span className="text-base font-mono font-bold text-indigo-400">
                      {bivariateStats.rSquared}
                    </span>
                  </div>
                  <div className="p-2.5 rounded bg-slate-950 border border-slate-800">
                    <span className="text-[10px] text-slate-500 uppercase block">Hệ số góc (Slope)</span>
                    <span className="text-base font-mono font-bold text-emerald-400">
                      {bivariateStats.regressionSlope}
                    </span>
                  </div>
                </div>

                <div className="p-3 rounded-lg bg-slate-950 border border-slate-800 text-xs font-mono space-y-1">
                  <p className="text-slate-300">
                    Phương trình đường thẳng: <strong className="text-amber-400">y = {bivariateStats.regressionSlope}x + {bivariateStats.regressionIntercept}</strong>
                  </p>
                  <p className="text-slate-400 text-[11px]">{bivariateStats.trendDescription}</p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Generated Artifacts & Download Gate */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 space-y-4">
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <span className="text-xs font-semibold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
            <Table className="w-3.5 h-3.5 text-emerald-400" />
            Kho Tài Liệu Xuất Bản Đã Xác Thực (Generated Artifacts)
          </span>
          <span className="text-xs font-mono text-slate-400">
            Tổng số: {artifacts.length} tệp
          </span>
        </div>

        {artifacts.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            {artifacts.map((art) => (
              <div
                key={art.id}
                className="p-3 rounded-lg bg-slate-950 border border-slate-800 space-y-2 flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold font-mono text-white truncate max-w-[180px]">
                      {art.filename}
                    </span>
                    <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-slate-900 text-slate-400 border border-slate-800">
                      {art.mimeType.split('/')[1]}
                    </span>
                  </div>
                  <span className="text-[10px] font-mono text-slate-500 block mt-1">
                    Kích thước: {art.sizeBytes} bytes • Tạo lúc: {new Date(art.createdAt).toLocaleTimeString()}
                  </span>
                </div>

                {/* Genuine Download Button: only enabled when artifact is verified */}
                <button
                  onClick={() => triggerDownload(art)}
                  disabled={!art.downloadAvailable}
                  className="w-full py-1.5 rounded bg-slate-800 hover:bg-slate-700 text-cyan-300 text-xs font-medium flex items-center justify-center gap-1.5 transition-colors border border-slate-700"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Tải Xuống Thực Tế</span>
                </button>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-xs text-slate-500 italic text-center py-4">
            Chưa có tài liệu nào được tạo. Nhấn &quot;Tạo CSV&quot;, &quot;Tạo Báo Cáo MD&quot;, hoặc &quot;Tạo Biểu Đồ SVG&quot; ở trên để tạo tệp tải xuống thực sự.
          </p>
        )}
      </div>
    </div>
  );
};
