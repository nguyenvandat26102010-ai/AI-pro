/**
 * NDAWG PRO — PART 7/8 (UNIFIED FINAL V2)
 * Plugin Center Modal
 * Allows inspection and enabling/disabling of tools & plugins per conversation
 */

import React from 'react';
import { 
  X, 
  Cpu, 
  Calculator, 
  Globe, 
  BookOpen, 
  Code, 
  Image as ImageIcon, 
  CheckCircle, 
  AlertTriangle,
  Layers,
  Gamepad2
} from 'lucide-react';
import { PluginDefinition } from '../types/chat.ts';

interface PluginCenterModalProps {
  isOpen: boolean;
  onClose: () => void;
  enabledPluginIds: string[];
  onTogglePlugin: (pluginId: string) => void;
}

const AVAILABLE_PLUGINS: PluginDefinition[] = [
  {
    id: 'web_search',
    name: 'Tìm kiếm trực tuyến (Web Search)',
    description: 'Tìm kiếm thông tin thời gian thực với trích dẫn nguồn kiểm chứng (Grounding)',
    version: '1.2.0',
    tier: 'TIER_1_READ',
    enabled: true,
    iconName: 'Globe',
    parameters: [
      { name: 'query', type: 'string', description: 'Từ khóa tìm kiếm thông tin', required: true }
    ]
  },
  {
    id: 'math_kernel',
    name: 'Nhân tính toán học chính xác (Math Kernel)',
    description: 'Thực thi các phép tính đại số, căn thức, ma trận và kiểm chứng kết quả số học chính xác',
    version: '2.0.0',
    tier: 'TIER_1_READ',
    enabled: true,
    iconName: 'Calculator',
    parameters: [
      { name: 'expression', type: 'string', description: 'Biểu thức toán học cần tính', required: true }
    ]
  },
  {
    id: 'knowledge_base',
    name: 'Cơ sở tri thức kiểm chứng NDAWG (Knowledge RAG)',
    description: 'Truy xuất tri thức đã kiểm định Provider Terms, License Badge và Fact-checking',
    version: '3.1.0',
    tier: 'TIER_1_READ',
    enabled: true,
    iconName: 'BookOpen',
    parameters: [
      { name: 'topic', type: 'string', description: 'Chủ đề hoặc câu hỏi tri thức', required: true }
    ]
  },
  {
    id: 'code_runner',
    name: 'Môi trường thực thi mã nguồn an toàn (Code Runner)',
    description: 'Thực thi mã nguồn trong sandbox cô lập an toàn không chạm bí mật hoặc hệ thống',
    version: '1.0.4',
    tier: 'TIER_2_EXECUTION',
    enabled: false,
    iconName: 'Code',
    parameters: [
      { name: 'language', type: 'string', description: 'javascript / typescript / python', required: true },
      { name: 'code', type: 'string', description: 'Đoạn mã cần thực thi', required: true }
    ]
  },
  {
    id: 'image_studio',
    name: 'Bộ xử lý & bảo toàn ảnh gốc (Image Studio Diff)',
    description: 'Chỉnh sửa ảnh với bảo toàn buffer gốc, kiểm soát pixel drift dưới 2% và rollback phiên bản',
    version: '2.2.0',
    tier: 'TIER_2_EXECUTION',
    enabled: false,
    iconName: 'ImageIcon',
    parameters: [
      { name: 'prompt', type: 'string', description: 'Mô tả tác vụ xử lý hình ảnh', required: true }
    ]
  },
  {
    id: 'game_intelligence',
    name: 'Game Intelligence Engine (Tối ưu hóa chiến thuật & Meta)',
    description: 'Phân tích chiến thuật, meta game (MOBA, FPS), build trang bị theo patch version và cảnh báo tính thời điểm',
    version: '2.1.0',
    tier: 'TIER_1_READ',
    enabled: true,
    iconName: 'Gamepad2',
    parameters: [
      { name: 'gameTitle', type: 'string', description: 'Tên tựa game', required: true },
      { name: 'query', type: 'string', description: 'Tướng hoặc chiến thuật cần tra cứu', required: true }
    ]
  }
];

export function PluginCenterModal({
  isOpen,
  onClose,
  enabledPluginIds,
  onTogglePlugin
}: PluginCenterModalProps) {
  if (!isOpen) return null;

  const renderIcon = (iconName: string) => {
    switch (iconName) {
      case 'Globe': return <Globe className="w-5 h-5 text-cyan-400" />;
      case 'Calculator': return <Calculator className="w-5 h-5 text-emerald-400" />;
      case 'BookOpen': return <BookOpen className="w-5 h-5 text-amber-400" />;
      case 'Code': return <Code className="w-5 h-5 text-violet-400" />;
      case 'ImageIcon': return <ImageIcon className="w-5 h-5 text-pink-400" />;
      case 'Gamepad2': return <Gamepad2 className="w-5 h-5 text-indigo-400" />;
      default: return <Cpu className="w-5 h-5 text-cyan-400" />;
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-in fade-in duration-200">
      <div 
        className="bg-slate-900 border border-slate-700/80 rounded-2xl w-full max-w-2xl max-h-[85vh] flex flex-col shadow-2xl relative overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="p-6 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-cyan-950/80 border border-cyan-800/60 flex items-center justify-center text-cyan-400">
              <Layers className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-slate-100 flex items-center gap-2">
                Trung tâm Plugin & Công cụ
                <span className="text-xs font-mono px-2 py-0.5 rounded-full bg-cyan-950 text-cyan-400 border border-cyan-800/40">
                  {enabledPluginIds.length}/{AVAILABLE_PLUGINS.length} Hoạt động
                </span>
              </h2>
              <p className="text-xs text-slate-400">
                Kích hoạt các công cụ kiểm chứng để AI thực thi trong luồng hội thoại
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-100 hover:bg-slate-800 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto space-y-4 flex-1">
          {AVAILABLE_PLUGINS.map((plugin) => {
            const isEnabled = enabledPluginIds.includes(plugin.id);
            return (
              <div
                key={plugin.id}
                className={`p-4 rounded-xl border transition-all ${
                  isEnabled
                    ? 'bg-slate-950/70 border-cyan-500/40 shadow-sm shadow-cyan-950/30'
                    : 'bg-slate-950/30 border-slate-800/80 opacity-75 hover:opacity-100'
                }`}
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex items-start gap-3.5">
                    <div className="p-2.5 rounded-lg bg-slate-900 border border-slate-800 shrink-0">
                      {renderIcon(plugin.iconName)}
                    </div>
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-semibold text-sm text-slate-100">{plugin.name}</span>
                        <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-slate-800 text-slate-400">
                          v{plugin.version}
                        </span>
                        <span
                          className={`text-[10px] font-mono px-1.5 py-0.5 rounded border ${
                            plugin.tier === 'TIER_1_READ'
                              ? 'bg-emerald-950/50 text-emerald-300 border-emerald-800/50'
                              : 'bg-amber-950/50 text-amber-300 border-amber-800/50'
                          }`}
                        >
                          {plugin.tier}
                        </span>
                      </div>
                      <p className="text-xs text-slate-400 leading-relaxed">
                        {plugin.description}
                      </p>

                      {/* Parameters snippet */}
                      <div className="mt-2.5 flex items-center gap-2 text-[11px] font-mono text-slate-500">
                        <span>Tham số:</span>
                        {plugin.parameters.map(p => (
                          <span key={p.name} className="bg-slate-900 px-1.5 py-0.5 rounded border border-slate-800 text-slate-300">
                            {p.name} ({p.type})
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* Toggle Button */}
                  <button
                    onClick={() => onTogglePlugin(plugin.id)}
                    className={`shrink-0 px-3.5 py-1.5 rounded-lg text-xs font-semibold font-mono transition-all flex items-center gap-1.5 ${
                      isEnabled
                        ? 'bg-cyan-500 text-slate-950 hover:bg-cyan-400 shadow-sm shadow-cyan-500/20'
                        : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                    }`}
                  >
                    {isEnabled ? (
                      <>
                        <CheckCircle className="w-3.5 h-3.5" />
                        BẬT
                      </>
                    ) : (
                      'TẮT'
                    )}
                  </button>
                </div>
              </div>
            );
          })}

          <div className="p-3.5 rounded-xl bg-cyan-950/30 border border-cyan-800/40 text-xs text-cyan-300 flex items-start gap-2.5">
            <AlertTriangle className="w-4 h-4 text-cyan-400 shrink-0 mt-0.5" />
            <p>
              Các công cụ Plugin được giám sát tự động bởi <strong>Apex Limits Governor</strong> và <strong>Tool Registry</strong>. Bất kỳ tác vụ nào vi phạm hạn ngạch hoặc chính sách bảo mật đều bị chặn ngay lập tức.
            </p>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-slate-800 bg-slate-950/60 flex items-center justify-end">
          <button
            onClick={onClose}
            className="px-5 py-2 rounded-xl text-xs font-semibold bg-slate-800 hover:bg-slate-700 text-slate-200 transition-colors"
          >
            Đóng
          </button>
        </div>
      </div>
    </div>
  );
}
