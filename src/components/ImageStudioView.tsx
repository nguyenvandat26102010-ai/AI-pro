import React, { useState } from 'react';
import {
  Image as ImageIcon,
  Shield,
  RotateCcw,
  AlertTriangle,
  CheckCircle2,
  Sliders,
  Crop,
  Layers,
  Sparkles,
  Info,
  Lock,
  Eye
} from 'lucide-react';
import { ImageStudioEngine, EditMethod, ImageVersion } from '../modules/imageStudio.ts';

interface ImageStudioViewProps {
  imageStudio: ImageStudioEngine;
}

export const ImageStudioView: React.FC<ImageStudioViewProps> = ({ imageStudio }) => {
  const [prompt, setPrompt] = useState<string>('Refine highlighted region with cyan accent');
  const [method, setMethod] = useState<EditMethod>('inpaint');
  const [hasMask, setHasMask] = useState<boolean>(true);
  const [highDriftSim, setHighDriftSim] = useState<boolean>(false);
  const [facialCheck, setFacialCheck] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [splitSlider, setSplitSlider] = useState<number>(50);

  const [activeVersion, setActiveVersion] = useState<ImageVersion | null>(() => imageStudio.getActiveVersion());
  const [versionHistory, setVersionHistory] = useState<ImageVersion[]>(() => imageStudio.getVersions());
  const original = imageStudio.getOriginal();

  const refreshState = () => {
    setActiveVersion(imageStudio.getActiveVersion());
    setVersionHistory(imageStudio.getVersions());
  };

  const handleApplyEdit = () => {
    setErrorMessage(null);
    try {
      const editPrompt = highDriftSim ? `${prompt} and change background scene entirely` : prompt;
      imageStudio.applyEdit({
        prompt: editPrompt,
        editRegion: hasMask ? { x: 60, y: 80, width: 80, height: 40 } : null,
        methodUsed: method,
        performFacialComparison: facialCheck
      });
      refreshState();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      setErrorMessage(msg);
    }
  };

  const handleSimulateServiceFailure = () => {
    setErrorMessage(null);
    try {
      imageStudio.applyEdit({
        prompt: 'Generate stylized portrait',
        editRegion: null,
        methodUsed: 'style_transfer',
        simulateServiceFailure: true
      });
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      setErrorMessage(msg);
    }
  };

  const handleSimulateSafetyViolation = () => {
    setErrorMessage(null);
    try {
      imageStudio.applyEdit({
        prompt: 'deepfake impersonation for fraud',
        editRegion: null,
        methodUsed: 'inpaint'
      });
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      setErrorMessage(msg);
    }
  };

  const handleUndo = () => {
    setErrorMessage(null);
    try {
      imageStudio.undo();
      refreshState();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      setErrorMessage(msg);
    }
  };

  const handleSelectVersion = (vId: string) => {
    setErrorMessage(null);
    try {
      imageStudio.undo(vId);
      refreshState();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      setErrorMessage(msg);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-slate-900 border border-slate-800 rounded-xl p-5">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-bold text-white flex items-center gap-2">
              <ImageIcon className="w-5 h-5 text-cyan-400" />
              Image Studio — Immutable Asset &amp; Mask Preservation
            </h1>
            <span className="text-xs px-2.5 py-0.5 rounded-full font-mono bg-cyan-950 text-cyan-300 border border-cyan-800">
              Part 4/5
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Bảo toàn tuyệt đối ảnh gốc • Đo lường biến dạng ngoài vùng chọn (Mask Drift) • Kiểm định đường biên ghép nối
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-emerald-950/60 border border-emerald-800/80 text-emerald-300 text-xs font-mono">
            <Lock className="w-3.5 h-3.5 text-emerald-400" />
            <span>ORIGINAL BUFFER LOCKED</span>
          </div>
          <button
            onClick={handleUndo}
            disabled={versionHistory.length <= 1}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 disabled:opacity-40 text-slate-200 text-xs font-medium border border-slate-700 transition-colors"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Undo (Rollback)</span>
          </button>
        </div>
      </div>

      {/* Error / Warning Alert */}
      {errorMessage && (
        <div className="p-4 rounded-xl bg-rose-950/80 border border-rose-800 text-rose-200 text-xs flex items-start gap-3">
          <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
          <div className="flex-1">
            <p className="font-semibold text-rose-300">Lỗi Thực Thi / Chặn An Toàn</p>
            <p className="mt-1 font-mono">{errorMessage}</p>
          </div>
        </div>
      )}

      {/* Main Grid: Visual Diff Canvas & Control Deck */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Visual Canvas & Before/After */}
        <div className="lg:col-span-7 space-y-4">
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-4">
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-semibold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
                <Eye className="w-3.5 h-3.5 text-cyan-400" />
                So Sánh Trực Quan (Before / After Split)
              </span>
              <span className="text-xs font-mono text-slate-400">
                Split: {splitSlider}%
              </span>
            </div>

            {/* Split View Container */}
            <div className="relative w-full h-80 rounded-lg overflow-hidden border border-slate-800 bg-slate-950 flex items-center justify-center select-none">
              {/* After Image (Active Version) */}
              <div className="absolute inset-0 flex items-center justify-center">
                {activeVersion && (
                  <img
                    src={activeVersion.dataUrl}
                    alt="Active Version"
                    className="w-full h-full object-contain"
                  />
                )}
              </div>

              {/* Before Image (Original) clipped by slider */}
              {original && (
                <div
                  className="absolute inset-y-0 left-0 overflow-hidden border-r-2 border-cyan-400 shadow-xl"
                  style={{ width: `${splitSlider}%` }}
                >
                  <div className="w-[600px] h-full flex items-center justify-center">
                    <img
                      src={original.dataUrl}
                      alt="Original Reference"
                      className="w-full h-full object-contain"
                    />
                  </div>
                </div>
              )}

              {/* Split boundary label */}
              <div className="absolute top-3 left-3 px-2 py-1 rounded bg-black/70 backdrop-blur-md text-[10px] font-mono text-cyan-300 border border-cyan-800/60 pointer-events-none">
                GỐC (ORIGINAL)
              </div>
              <div className="absolute top-3 right-3 px-2 py-1 rounded bg-black/70 backdrop-blur-md text-[10px] font-mono text-emerald-300 border border-emerald-800/60 pointer-events-none">
                HIỆN TẠI (v{activeVersion?.versionNumber || 0})
              </div>
            </div>

            {/* Split Slider Bar */}
            <div className="mt-3 flex items-center gap-3">
              <span className="text-[11px] text-slate-400">Gốc</span>
              <input
                type="range"
                min="0"
                max="100"
                value={splitSlider}
                onChange={(e) => setSplitSlider(Number(e.target.value))}
                className="flex-1 accent-cyan-500 h-1.5 bg-slate-800 rounded-lg cursor-pointer"
              />
              <span className="text-[11px] text-slate-400">Đã sửa</span>
            </div>
          </div>

          {/* Mask Preservation & Drift Metrics */}
          {activeVersion && (
            <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
                  <Sliders className="w-3.5 h-3.5 text-indigo-400" />
                  Chỉ Số Đo Lường Bảo Toàn (Preservation Metrics)
                </span>
                {activeVersion.hasWarning ? (
                  <span className="text-[11px] px-2 py-0.5 rounded font-mono bg-rose-950 text-rose-300 border border-rose-800 flex items-center gap-1">
                    <AlertTriangle className="w-3 h-3 text-rose-400" />
                    DRIFT VƯỢT NGƯỠNG (&gt;2%)
                  </span>
                ) : (
                  <span className="text-[11px] px-2 py-0.5 rounded font-mono bg-emerald-950 text-emerald-300 border border-emerald-800 flex items-center gap-1">
                    <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                    BẢO TOÀN TỐT
                  </span>
                )}
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div className="p-3 rounded-lg bg-slate-950 border border-slate-800">
                  <span className="text-[10px] text-slate-500 uppercase block">Tỷ lệ đổi ngoài mask</span>
                  <span
                    className={`text-base font-bold font-mono ${
                      activeVersion.outsideMaskDriftRatio > 0.02 ? 'text-rose-400' : 'text-emerald-400'
                    }`}
                  >
                    {(activeVersion.outsideMaskDriftRatio * 100).toFixed(1)}%
                  </span>
                  <span className="text-[10px] text-slate-500 block">Ngưỡng chuẩn: ≤ 2.0%</span>
                </div>

                <div className="p-3 rounded-lg bg-slate-950 border border-slate-800">
                  <span className="text-[10px] text-slate-500 uppercase block">Lệch độ sáng (ΔL)</span>
                  <span
                    className={`text-base font-bold font-mono ${
                      activeVersion.luminanceDelta > 10 ? 'text-amber-400' : 'text-slate-200'
                    }`}
                  >
                    {activeVersion.luminanceDelta.toFixed(1)}
                  </span>
                  <span className="text-[10px] text-slate-500 block">Dưới 10.0 chấp nhận được</span>
                </div>

                <div className="p-3 rounded-lg bg-slate-950 border border-slate-800">
                  <span className="text-[10px] text-slate-500 uppercase block">Độ liền mạch biên (Seam)</span>
                  <span className="text-base font-bold font-mono text-cyan-400">
                    {(activeVersion.seamContinuityScore * 100).toFixed(0)}%
                  </span>
                  <span className="text-[10px] text-slate-500 block">Ghép nền tự động</span>
                </div>
              </div>

              {/* Warning List */}
              {activeVersion.warnings.length > 0 && (
                <div className="p-3 rounded-lg bg-amber-950/40 border border-amber-800/80 text-amber-300 text-xs space-y-1">
                  {activeVersion.warnings.map((w, i) => (
                    <div key={i} className="flex items-start gap-2">
                      <AlertTriangle className="w-3.5 h-3.5 text-amber-400 shrink-0 mt-0.5" />
                      <span>{w}</span>
                    </div>
                  ))}
                </div>
              )}

              {/* Facial comparison notice if enabled */}
              {activeVersion.facialComparison?.performed && (
                <div className="p-2.5 rounded-lg bg-indigo-950/40 border border-indigo-800/80 text-indigo-300 text-[11px] flex items-center gap-2">
                  <Info className="w-3.5 h-3.5 text-indigo-400 shrink-0" />
                  <span>{activeVersion.facialComparison.note}</span>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Right Column: Controls, Tools & Version Tree */}
        <div className="lg:col-span-5 space-y-4">
          {/* Edit Control Deck */}
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 space-y-4">
            <span className="text-xs font-semibold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
              Công Cụ Chỉnh Sửa Có Kiểm Chứng
            </span>

            {/* Prompt Input */}
            <div>
              <label className="text-xs text-slate-400 block mb-1">Chỉ dẫn chỉnh sửa (Prompt)</label>
              <input
                type="text"
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-lg text-xs text-slate-200 focus:outline-none focus:border-cyan-500"
                placeholder="Ví dụ: Đổi màu hộp ở trung tâm thành xanh lục bảo..."
              />
            </div>

            {/* Method Select */}
            <div>
              <label className="text-xs text-slate-400 block mb-1">Phương pháp xử lý (Method)</label>
              <div className="grid grid-cols-3 gap-2">
                {(['inpaint', 'style_transfer', 'color_grading'] as EditMethod[]).map((m) => (
                  <button
                    key={m}
                    onClick={() => setMethod(m)}
                    className={`py-1.5 px-2 rounded-lg text-xs font-mono capitalize border transition-colors ${
                      method === m
                        ? 'bg-cyan-950 border-cyan-500 text-cyan-200'
                        : 'bg-slate-950 border-slate-800 text-slate-400 hover:bg-slate-800'
                    }`}
                  >
                    {m.replace('_', ' ')}
                  </button>
                ))}
              </div>
            </div>

            {/* Options */}
            <div className="space-y-2 pt-2 border-t border-slate-800 text-xs">
              <label className="flex items-center gap-2 text-slate-300 cursor-pointer">
                <input
                  type="checkbox"
                  checked={hasMask}
                  onChange={(e) => setHasMask(e.target.checked)}
                  className="rounded border-slate-700 bg-slate-950 accent-cyan-500"
                />
                <span>Khoanh vùng chọn (Mask: [60, 80, 80, 40])</span>
              </label>

              <label className="flex items-center gap-2 text-slate-300 cursor-pointer">
                <input
                  type="checkbox"
                  checked={highDriftSim}
                  onChange={(e) => setHighDriftSim(e.target.checked)}
                  className="rounded border-slate-700 bg-slate-950 accent-cyan-500"
                />
                <span>Mô phỏng sai lệch nền (Kích hoạt cảnh báo Drift &gt;2%)</span>
              </label>

              <label className="flex items-center gap-2 text-slate-300 cursor-pointer">
                <input
                  type="checkbox"
                  checked={facialCheck}
                  onChange={(e) => setFacialCheck(e.target.checked)}
                  className="rounded border-slate-700 bg-slate-950 accent-cyan-500"
                />
                <span>Chỉ số tương đồng đặc điểm (Hỗ trợ xác nhận, không lưu trữ sinh trắc học)</span>
              </label>
            </div>

            {/* Primary Action Button */}
            <div className="pt-2">
              <button
                onClick={handleApplyEdit}
                className="w-full py-2.5 rounded-lg bg-gradient-to-r from-cyan-600 to-indigo-600 hover:from-cyan-500 hover:to-indigo-500 text-white font-medium text-xs shadow-md shadow-cyan-600/20 transition-all flex items-center justify-center gap-2"
              >
                <Crop className="w-3.5 h-3.5" />
                <span>Áp Dụng Chỉnh Sửa &amp; Đo Lường</span>
              </button>
            </div>

            {/* Test Rig Simulation Buttons */}
            <div className="grid grid-cols-2 gap-2 pt-1 border-t border-slate-800">
              <button
                onClick={handleSimulateServiceFailure}
                className="py-1.5 px-2 rounded-lg bg-slate-950 hover:bg-slate-800 border border-slate-800 text-[11px] text-slate-400 hover:text-slate-200 transition-colors"
              >
                Thử nghiệm: Lỗi mô hình (503)
              </button>
              <button
                onClick={handleSimulateSafetyViolation}
                className="py-1.5 px-2 rounded-lg bg-slate-950 hover:bg-slate-800 border border-slate-800 text-[11px] text-slate-400 hover:text-slate-200 transition-colors"
              >
                Thử nghiệm: Deepfake Chặn
              </button>
            </div>
          </div>

          {/* Version History Tree */}
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-4">
            <span className="text-xs font-semibold text-slate-300 uppercase tracking-wider flex items-center gap-1.5 mb-3">
              <Layers className="w-3.5 h-3.5 text-indigo-400" />
              Lịch Sử Phiên Bản (Immutable Version Stack)
            </span>

            <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
              {versionHistory.map((v) => {
                const isActive = v.id === activeVersion?.id;
                return (
                  <div
                    key={v.id}
                    onClick={() => handleSelectVersion(v.id)}
                    className={`p-2.5 rounded-lg border cursor-pointer transition-all ${
                      isActive
                        ? 'bg-cyan-950/60 border-cyan-500 text-white'
                        : 'bg-slate-950/60 border-slate-800 text-slate-400 hover:bg-slate-800/80 hover:text-slate-200'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-mono font-bold text-cyan-300">
                          v{v.versionNumber}
                        </span>
                        <span className="text-xs font-medium truncate max-w-[150px]">
                          {v.prompt}
                        </span>
                      </div>
                      <span className="text-[10px] font-mono text-slate-500">
                        {v.methodUsed}
                      </span>
                    </div>

                    <div className="mt-1 flex items-center justify-between text-[10px] text-slate-500">
                      <span>Drift: {(v.outsideMaskDriftRatio * 100).toFixed(1)}%</span>
                      {v.hasWarning && <span className="text-rose-400 font-bold">Cảnh báo</span>}
                      {isActive && <span className="text-cyan-400 font-bold">● Đang xem</span>}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
