import React, { useState } from 'react';
import {
  Globe,
  Mic,
  Volume2,
  Lock,
  CheckCircle2,
  AlertCircle,
  ShieldCheck,
  Languages,
  Sliders,
  AudioWaveform
} from 'lucide-react';
import { AiCoreService } from '../core/aiCoreService.ts';
import {
  SupportedUiLanguage,
  SupportedResponseLanguage,
  SupportedVoiceLanguage,
  MultilingualVoicePreferences
} from '../core/types.ts';

interface Part8MultilingualVoiceViewProps {
  aiCore: AiCoreService;
}

export const Part8MultilingualVoiceView: React.FC<Part8MultilingualVoiceViewProps> = ({ aiCore }) => {
  const [preferences, setPreferences] = useState<MultilingualVoicePreferences>(() =>
    aiCore.getUserPreferences('default_user')
  );

  const [micActive, setMicActive] = useState<boolean>(false);
  const [micStatusMsg, setMicStatusMsg] = useState<string | null>(null);

  const [ttsInput, setTtsInput] = useState<string>(
    'Hệ thống AI Core Ndawg Pro phiên bản Part 6 đã kích hoạt và sẵn sàng tích hợp.'
  );
  const [ttsStatusMsg, setTtsStatusMsg] = useState<string | null>(null);

  const handleUpdatePreference = (field: keyof MultilingualVoicePreferences, val: any) => {
    const updated = aiCore.setUserPreferences('default_user', { [field]: val });
    setPreferences(updated);
  };

  const handleTestMic = async () => {
    setMicActive(true);
    setMicStatusMsg('Đang kích hoạt Modality Gate kiểm tra micro...');

    const res = await aiCore.transcribeAudio({
      sampleRate: 16000,
      channels: 1,
      durationSeconds: 3
    });

    setMicActive(false);
    setMicStatusMsg(
      `Trạng thái Modality Gate STT: [${res.status}]. API âm thanh bên ngoài chưa cấu hình khóa backend. Hệ thống không tạo phiên âm giả.`
    );
  };

  const handleTestTts = async () => {
    setTtsStatusMsg('Đang gửi văn bản tới Modality Gate TTS...');
    const res = await aiCore.generateSpeech(ttsInput, {
      voiceLanguage: preferences.voiceLanguage,
      gender: preferences.voiceGender
    });

    setTtsStatusMsg(
      `Trạng thái Modality Gate TTS: [${res.status}]. Khóa dịch vụ tổng hợp giọng nói chưa cấu hình. Không giả lập âm thanh.`
    );
  };

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 shadow-xl">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-indigo-950 border border-indigo-800 flex items-center justify-center text-indigo-400">
              <Globe className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl font-bold text-white tracking-tight">Part 8: UI, Multi-Language &amp; Voice Hub</h1>
                <span className="text-xs px-2.5 py-0.5 rounded-full font-mono bg-indigo-950 text-indigo-300 border border-indigo-800">
                  Tách Biệt 3 Tầng Ngôn Ngữ
                </span>
              </div>
              <p className="text-sm text-slate-400 mt-1">
                Quản lý độc lập: Giao diện (Interface) • Câu trả lời mô hình (Response) • Giọng đọc &amp; Hội thoại (Voice). Đổi ngôn ngữ UI không làm biến đổi ngôn ngữ suy luận.
              </p>
            </div>
          </div>

          <span className="text-xs font-mono px-3 py-1 bg-slate-950 text-cyan-400 rounded border border-cyan-800">
            Fulfills Contracts #8, #9 &amp; #10
          </span>
        </div>
      </div>

      {/* 3-Way Independent Language Selectors */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 space-y-4">
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <h2 className="text-sm font-bold text-white flex items-center gap-2">
            <Languages className="w-4 h-4 text-cyan-400" />
            Cấu Hình Độc Lập 3 Tầng Ngôn Ngữ (Language Separation)
          </h2>
          <span className="text-xs font-mono text-emerald-400 flex items-center gap-1">
            <ShieldCheck className="w-3.5 h-3.5" />
            Bảo đảm không đột biến chéo
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* 1. Interface Language */}
          <div className="bg-slate-950 p-4 rounded-lg border border-slate-800 space-y-2">
            <span className="text-xs font-bold text-cyan-400 block font-mono">1. NGÔN NGỮ GIAO DIỆN (UI)</span>
            <p className="text-[11px] text-slate-400">Hiển thị các nút bấm, menu, nhãn trạng thái và dashboard.</p>
            <select
              value={preferences.interfaceLanguage}
              onChange={(e) => handleUpdatePreference('interfaceLanguage', e.target.value as SupportedUiLanguage)}
              className="w-full bg-slate-900 border border-slate-700 rounded p-2 text-xs text-slate-200 font-medium"
            >
              <option value="vi">Tiếng Việt (vi)</option>
              <option value="en">English (en)</option>
              <option value="ja">日本語 (ja)</option>
              <option value="zh">中文 (zh)</option>
              <option value="fr">Français (fr)</option>
            </select>
          </div>

          {/* 2. Model Response Language */}
          <div className="bg-slate-950 p-4 rounded-lg border border-slate-800 space-y-2">
            <span className="text-xs font-bold text-indigo-400 block font-mono">2. NGÔN NGỮ SUY LUẬN (RESPONSE)</span>
            <p className="text-[11px] text-slate-400">Ngôn ngữ mô hình sử dụng để trả lời câu hỏi và xuất báo cáo.</p>
            <select
              value={preferences.responseLanguage}
              onChange={(e) => handleUpdatePreference('responseLanguage', e.target.value as SupportedResponseLanguage)}
              className="w-full bg-slate-900 border border-slate-700 rounded p-2 text-xs text-slate-200 font-medium"
            >
              <option value="match_input">Khớp theo ngôn ngữ đầu vào (match_input)</option>
              <option value="vi">Tiếng Việt (vi)</option>
              <option value="en">English (en)</option>
              <option value="ja">日本語 (ja)</option>
              <option value="zh">中文 (zh)</option>
              <option value="fr">Français (fr)</option>
            </select>
          </div>

          {/* 3. Voice & Speech Language */}
          <div className="bg-slate-950 p-4 rounded-lg border border-slate-800 space-y-2">
            <span className="text-xs font-bold text-amber-400 block font-mono">3. NGÔN NGỮ GIỌNG ĐỌC (VOICE)</span>
            <p className="text-[11px] text-slate-400">Dùng cho tổng hợp âm thanh TTS và nhận diện giọng nói STT.</p>
            <select
              value={preferences.voiceLanguage}
              onChange={(e) => handleUpdatePreference('voiceLanguage', e.target.value as SupportedVoiceLanguage)}
              className="w-full bg-slate-900 border border-slate-700 rounded p-2 text-xs text-slate-200 font-medium"
            >
              <option value="vi-VN">Tiếng Việt — Hà Nội/Sài Gòn (vi-VN)</option>
              <option value="en-US">English — United States (en-US)</option>
              <option value="ja-JP">日本語 — Tokyo (ja-JP)</option>
              <option value="zh-CN">中文 — Standard Mandarin (zh-CN)</option>
            </select>
          </div>
        </div>

        {/* Verification of Independence Banner */}
        <div className="p-3 bg-slate-950 rounded-lg border border-slate-800 text-xs font-mono text-slate-400 flex items-center justify-between">
          <span>
            Trạng thái hiện tại: UI = <strong className="text-cyan-400">{preferences.interfaceLanguage}</strong> | Response ={' '}
            <strong className="text-indigo-400">{preferences.responseLanguage}</strong> | Voice ={' '}
            <strong className="text-amber-400">{preferences.voiceLanguage}</strong>
          </span>
          <span className="text-emerald-400 font-bold">✓ ISOLATED</span>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Module 2: STT Modality Gate & Microphone Permission */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <Mic className="w-4 h-4 text-rose-400" />
              Microphone &amp; STT Modality Gate (Contract #9)
            </h3>
            <span className="text-xs font-mono text-slate-400 bg-slate-950 px-2 py-0.5 rounded border border-slate-800">
              Quyền riêng tư minh bạch
            </span>
          </div>

          <p className="text-xs text-slate-400">
            Hệ thống tuân thủ nguyên tắc không âm thầm thu âm hoặc giả lập kết quả nhận diện giọng nói khi chưa có luồng xử lý thực tế.
          </p>

          <button
            onClick={handleTestMic}
            disabled={micActive}
            className={`w-full py-2 rounded-lg text-xs font-bold flex items-center justify-center gap-2 transition-colors ${
              micActive
                ? 'bg-rose-700 text-white animate-pulse'
                : 'bg-rose-600 hover:bg-rose-500 text-white'
            }`}
          >
            <Mic className="w-4 h-4" />
            {micActive ? 'Đang gửi qua Modality Gate...' : 'Kiểm tra quyền Microphone & STT Gateway'}
          </button>

          {micStatusMsg && (
            <div className="p-3 rounded bg-slate-950 border border-slate-800 text-xs font-mono text-slate-300">
              {micStatusMsg}
            </div>
          )}
        </div>

        {/* Module 3: TTS Modality Gate (Contract #10) */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <Volume2 className="w-4 h-4 text-indigo-400" />
              Text-to-Speech (TTS) Gateway (Contract #10)
            </h3>
            <span className="text-xs font-mono text-slate-400 bg-slate-950 px-2 py-0.5 rounded border border-slate-800">
              Tách biệt giọng đọc
            </span>
          </div>

          <div>
            <label className="text-xs text-slate-400 block mb-1">Văn bản cần đọc mẫu:</label>
            <input
              type="text"
              value={ttsInput}
              onChange={(e) => setTtsInput(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded p-2 text-xs text-slate-200"
            />
          </div>

          <button
            onClick={handleTestTts}
            className="w-full py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-xs font-bold flex items-center justify-center gap-2 transition-colors"
          >
            <Volume2 className="w-4 h-4" />
            Kiểm tra Tổng Hợp Giọng Nói (TTS)
          </button>

          {ttsStatusMsg && (
            <div className="p-3 rounded bg-slate-950 border border-slate-800 text-xs font-mono text-slate-300">
              {ttsStatusMsg}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
