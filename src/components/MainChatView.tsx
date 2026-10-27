/**
 * NDAWG PRO — PART 9/9 (APEX FINAL)
 * Main AI Chat Interface (Default App Screen)
 * Dark Slate + Cyan Theme, Responsive, Multimodal Attachments, Real Backend Integration, Plugins & History
 */

import React, { useState, useRef, useEffect } from 'react';
import { 
  Menu, 
  Send, 
  Square, 
  Sparkles, 
  Trash2, 
  Copy, 
  Check, 
  RotateCcw, 
  Layers, 
  Cpu, 
  ShieldCheck, 
  Calculator, 
  Globe, 
  BookOpen, 
  Code, 
  Image as ImageIcon,
  ChevronDown,
  ChevronUp,
  AlertCircle,
  Paperclip,
  X,
  FileText,
  Mic,
  MicOff,
  Volume2,
  HardDrive,
  Video,
  MapPin,
  Search,
  Loader2,
  Download,
  ExternalLink,
  Film,
  AlertTriangle,
  Info
} from 'lucide-react';
import { ChatConversation, ChatMessage, ChatAttachment } from '../types/chat.ts';
import { normalizeRenderText } from '../core/renderIntegrity.ts';

interface MainChatViewProps {
  conversation: ChatConversation;
  onSendMessage: (input: string | { text: string; attachments?: ChatAttachment[] }) => Promise<void>;
  onClearChat: () => void;
  onOpenSidebar: () => void;
  onOpenPluginCenter: () => void;
  onOpenAdminConsole?: () => void;
  onOpenWorkspace?: () => void;
  onSelectModel: (model: string) => void;
  isAdminAuthenticated: boolean;
  isLoading: boolean;
  onStopGeneration?: () => void;
}

const SUGGESTED_PROMPTS = [
  {
    title: 'Kiểm chứng toán học chính xác',
    prompt: 'Hãy dùng Math Kernel để tính toán biểu thức: calculate 125 * 8 + 450 - 250 / 5 và giải thích các bước.'
  },
  {
    title: 'Truy xuất tri thức kiểm chứng NDAWG',
    prompt: 'Truy xuất Verified Knowledge Base và tóm tắt cơ chế Apex Limits Governor cùng Audit Hash-chain.'
  },
  {
    title: 'Phân tích kiến trúc đa mô hình',
    prompt: 'Trình bày kiến trúc tích hợp Part 6–7–8–9: AI Core, 13 Shared Contracts, Multimodal Input và phương pháp Giải - Kiểm - Sửa.'
  },
  {
    title: 'Tìm kiếm trực tuyến & Grounding',
    prompt: 'Tìm kiếm thông tin mới nhất về Google Gemini Flash và các mô hình đa phương thức thế hệ mới.'
  }
];

const AVAILABLE_MODELS = [
  { id: 'gemini-3.8-flash', name: 'Gemini 3.8 Flash (Tác vụ chung)', speed: 'Search / Maps Grounding', badge: 'Standard' },
  { id: 'gemini-4-argon', name: 'Gemini 4 Argon (Tác vụ phức tạp)', speed: 'Suy luận chuyên sâu & Code', badge: 'Argon' },
  { id: 'gemini-3.1-flash-lite', name: 'Gemini 3.1 Flash Lite (Siêu tốc)', speed: 'Phản hồi tức thì <1s', badge: 'Fast Lite' },
  { id: 'gemini-3.8-live', name: 'Gemini 3.8 Live (Voice Real-time)', speed: 'Hội thoại trực tiếp', badge: 'Live API' },
  { id: 'gemini-3.5-transcribe', name: 'Gemini 3.5 Transcribe (Audio STT)', speed: 'Chuyển đổi âm thanh', badge: 'Audio STT' },
  { id: 'gemini-nano-banana-2.1', name: 'Gemini Nano Banana 2.1', speed: 'Tạo & Chỉnh ảnh 1K/2K/4K', badge: 'Image' },
  { id: 'gemini-omni-1.1-flash', name: 'Gemini Omni Flash 1.1', speed: 'Tạo Video 16:9 / 9:16', badge: 'Video' }
];

export function MainChatView({
  conversation,
  onSendMessage,
  onClearChat,
  onOpenSidebar,
  onOpenPluginCenter,
  onOpenAdminConsole,
  onOpenWorkspace,
  onSelectModel,
  isAdminAuthenticated,
  isLoading,
  onStopGeneration
}: MainChatViewProps) {
  const [inputText, setInputText] = useState('');
  const [attachedFiles, setAttachedFiles] = useState<ChatAttachment[]>([]);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [expandedReasoning, setExpandedReasoning] = useState<Record<string, boolean>>({});
  const [expandedDiagnostics, setExpandedDiagnostics] = useState<Record<string, boolean>>({});
  const [errorLanguageView, setErrorLanguageView] = useState<Record<string, 'vi' | 'en' | 'ko'>>({});
  const [showModelDropdown, setShowModelDropdown] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [speechError, setSpeechError] = useState<string | null>(null);

  // Gemini Suite Extension State
  const [showVideoModal, setShowVideoModal] = useState(false);
  const [showImageModal, setShowImageModal] = useState(false);
  const [videoPrompt, setVideoPrompt] = useState('');
  const [videoAspectRatio, setVideoAspectRatio] = useState<'16:9' | '9:16'>('16:9');
  const [videoLoading, setVideoLoading] = useState(false);
  const [videoResult, setVideoResult] = useState<string | null>(null);
  const [videoError, setVideoError] = useState<string | null>(null);
  const [videoInputImage, setVideoInputImage] = useState<string | null>(null);

  const [imagePrompt, setImagePrompt] = useState('');
  const [imageAspectRatio, setImageAspectRatio] = useState<'1:1' | '16:9' | '9:16'>('1:1');
  const [imageSize, setImageSize] = useState<'1K' | '2K' | '4K'>('1K');
  const [imageLoading, setImageLoading] = useState(false);
  const [imageResult, setImageResult] = useState<string | null>(null);
  const [imageError, setImageError] = useState<string | null>(null);

  const [groundingMode, setGroundingMode] = useState<'none' | 'search' | 'maps'>('none');
  const [isTranscribing, setIsTranscribing] = useState(false);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const videoImageInputRef = useRef<HTMLInputElement>(null);
  const recognitionRef = useRef<any>(null);

  // Stop speech recognition on unmount
  useEffect(() => {
    return () => {
      if (recognitionRef.current) {
        try {
          recognitionRef.current.abort();
        } catch {
          // ignore cleanup abort error
        }
      }
      if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
        try {
          mediaRecorderRef.current.stop();
        } catch {
          // ignore cleanup error
        }
      }
    };
  }, []);

  // Web Speech API fallback
  const toggleSpeechRecognition = () => {
    if (isListening) {
      if (recognitionRef.current) {
        try {
          recognitionRef.current.stop();
        } catch {
          // ignore stop error
        }
      }
      setIsListening(false);
      return;
    }

    const SpeechRecognitionAPI =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

    if (!SpeechRecognitionAPI) {
      setSpeechError('Trình duyệt chưa hỗ trợ Web Speech API. Bạn có thể sử dụng nút Gemini 3.5 Transcribe.');
      setTimeout(() => setSpeechError(null), 5000);
      return;
    }

    try {
      const recognition = new SpeechRecognitionAPI();
      recognition.lang = 'vi-VN';
      recognition.continuous = false;
      recognition.interimResults = true;

      recognition.onstart = () => {
        setIsListening(true);
        setSpeechError(null);
      };

      recognition.onresult = (event: any) => {
        const transcript = Array.from(event.results)
          .map((res: any) => (res[0] ? res[0].transcript : ''))
          .join('');
        if (transcript) {
          setInputText((prev) => (prev ? `${prev} ${transcript}` : transcript));
        }
      };

      recognition.onerror = (event: any) => {
        setIsListening(false);
        if (event.error === 'not-allowed') {
          setSpeechError('Quyền truy cập Micro bị từ chối. Vui lòng bật cấp quyền Micro trong cài đặt trình duyệt.');
        } else if (event.error === 'no-speech') {
          setSpeechError('Không phát hiện thấy âm thanh giọng nói.');
        } else {
          setSpeechError(`Lỗi nhận diện âm thanh (${event.error || 'không xác định'}).`);
        }
        setTimeout(() => setSpeechError(null), 5000);
      };

      recognition.onend = () => {
        setIsListening(false);
      };

      recognitionRef.current = recognition;
      recognition.start();
    } catch (err: any) {
      setIsListening(false);
      setSpeechError(`Không thể khởi động micro: ${err?.message || 'Lỗi không xác định'}`);
      setTimeout(() => setSpeechError(null), 5000);
    }
  };

  // Gemini 3.5 Audio Transcribe via server-side GoogleGenAI
  const toggleGeminiTranscribe = async () => {
    if (isTranscribing) {
      if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
        mediaRecorderRef.current.stop();
      }
      setIsTranscribing(false);
      return;
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      audioChunksRef.current = [];
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;

      mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) {
          audioChunksRef.current.push(e.data);
        }
      };

      mediaRecorder.onstop = async () => {
        stream.getTracks().forEach((track) => track.stop());
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        if (audioBlob.size < 500) return;

        const reader = new FileReader();
        reader.readAsDataURL(audioBlob);
        reader.onloadend = async () => {
          const base64Audio = reader.result as string;
          try {
            setSpeechError(null);
            const res = await fetch('/api/gemini/transcribe-audio', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ audioBase64: base64Audio, mimeType: 'audio/webm' })
            });
            const data = await res.json();
            if (data.success && data.transcript) {
              setInputText((prev) => (prev ? `${prev} ${data.transcript}` : data.transcript));
            } else if (data.error) {
              setSpeechError(`Lỗi phiên âm Gemini 3.5: ${data.error}`);
              setTimeout(() => setSpeechError(null), 5000);
            }
          } catch (err: any) {
            setSpeechError(`Không thể gửi âm thanh đến Gemini: ${err.message}`);
            setTimeout(() => setSpeechError(null), 5000);
          }
        };
      };

      mediaRecorder.start();
      setIsTranscribing(true);
      setSpeechError(null);
    } catch (err: any) {
      setIsTranscribing(false);
      setSpeechError(`Không thể truy cập microphone: ${err.message}`);
      setTimeout(() => setSpeechError(null), 5000);
    }
  };

  // Image Generation with Gemini Nano Banana 2.1
  const handleGenerateImage = async () => {
    if (!imagePrompt.trim()) return;
    setImageLoading(true);
    setImageError(null);
    setImageResult(null);
    try {
      const res = await fetch('/api/gemini/image-generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt: imagePrompt.trim(),
          aspectRatio: imageAspectRatio,
          imageSize
        })
      });
      const data = await res.json();
      if (data.success && data.imageUrl) {
        setImageResult(data.imageUrl);
      } else {
        setImageError(data.error || 'Không nhận được ảnh từ Gemini Nano Banana 2.1');
      }
    } catch (err: any) {
      setImageError(`Lỗi gọi API: ${err.message}`);
    } finally {
      setImageLoading(false);
    }
  };

  const handleAttachGeneratedImage = () => {
    if (!imageResult) return;
    const newAtt: ChatAttachment = {
      id: `att_gen_${Date.now()}`,
      type: 'image',
      name: `nano_banana_${Date.now()}.png`,
      mimeType: 'image/png',
      sizeBytes: Math.round(imageResult.length * 0.75),
      data: imageResult,
      previewUrl: imageResult
    };
    setAttachedFiles((prev) => [...prev, newAtt]);
    setShowImageModal(false);
  };

  // Video Generation with Gemini Omni Flash 1.1
  const handleGenerateVideo = async () => {
    if (!videoPrompt.trim()) return;
    setVideoLoading(true);
    setVideoError(null);
    setVideoResult(null);
    try {
      const res = await fetch('/api/gemini/video-generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt: videoPrompt.trim(),
          aspectRatio: videoAspectRatio,
          imageBase64: videoInputImage
        })
      });
      const data = await res.json();
      if (data.success) {
        setVideoResult(data.interactionId ? `Đã gửi tác vụ tạo video thành công (ID: ${data.interactionId}). Trạng thái: ${data.status || 'Đang dựng video'}` : 'Đã tạo video thành công');
      } else {
        setVideoError(data.error || 'Không thể tạo video từ Gemini Omni Flash');
      }
    } catch (err: any) {
      setVideoError(`Lỗi gọi API: ${err.message}`);
    } finally {
      setVideoLoading(false);
    }
  };

  // Auto-scroll to bottom on new messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [conversation.messages, isLoading]);

  // Adjust textarea height automatically
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 180)}px`;
    }
  }, [inputText]);

  const handleSend = async () => {
    const trimmed = inputText.trim();
    if ((!trimmed && attachedFiles.length === 0) || isLoading) return;

    let currentText = trimmed;
    if (groundingMode === 'search') {
      currentText = `[GOOGLE SEARCH GROUNDING] ${trimmed}`;
    } else if (groundingMode === 'maps') {
      currentText = `[GOOGLE MAPS GROUNDING] ${trimmed}`;
    }

    const currentAttachments = [...attachedFiles];

    setInputText('');
    setAttachedFiles([]);
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
    }

    if (currentAttachments.length > 0) {
      await onSendMessage({
        text: currentText,
        attachments: currentAttachments
      });
    } else {
      await onSendMessage(currentText);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    const newAttachments: ChatAttachment[] = [];
    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      if (file.size > 10 * 1024 * 1024) {
        alert(`Tệp "${file.name}" vượt quá giới hạn 10MB.`);
        continue;
      }

      const isImage = file.type.startsWith('image/');
      if (isImage) {
        const dataUrl = await new Promise<string>((resolve) => {
          const reader = new FileReader();
          reader.onload = () => resolve(reader.result as string);
          reader.readAsDataURL(file);
        });
        newAttachments.push({
          id: `att_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
          type: 'image',
          name: file.name,
          mimeType: file.type || 'image/png',
          sizeBytes: file.size,
          data: dataUrl,
          previewUrl: dataUrl
        });
      } else {
        const text = await new Promise<string>((resolve) => {
          const reader = new FileReader();
          reader.onload = () => resolve((reader.result as string) || '');
          reader.readAsText(file);
        });
        newAttachments.push({
          id: `att_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
          type: 'file',
          name: file.name,
          mimeType: file.type || 'text/plain',
          sizeBytes: file.size,
          data: text
        });
      }
    }

    setAttachedFiles((prev) => [...prev, ...newAttachments]);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleRemoveAttachment = (id: string) => {
    setAttachedFiles((prev) => prev.filter((a) => a.id !== id));
  };

  const handleCopy = (id: string, text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const toggleReasoning = (msgId: string) => {
    setExpandedReasoning(prev => ({
      ...prev,
      [msgId]: !prev[msgId]
    }));
  };

  const toggleDiagnostic = (msgId: string) => {
    setExpandedDiagnostics(prev => ({
      ...prev,
      [msgId]: !prev[msgId]
    }));
  };

  const setMsgLang = (msgId: string, lang: 'vi' | 'en' | 'ko') => {
    setErrorLanguageView(prev => ({
      ...prev,
      [msgId]: lang
    }));
  };

  const renderPluginIcon = (pluginId: string) => {
    switch (pluginId) {
      case 'math_kernel': return <Calculator className="w-3.5 h-3.5 text-emerald-400" />;
      case 'web_search': return <Globe className="w-3.5 h-3.5 text-cyan-400" />;
      case 'knowledge_base': return <BookOpen className="w-3.5 h-3.5 text-amber-400" />;
      case 'code_runner': return <Code className="w-3.5 h-3.5 text-violet-400" />;
      case 'image_studio': return <ImageIcon className="w-3.5 h-3.5 text-pink-400" />;
      default: return <Cpu className="w-3.5 h-3.5 text-cyan-400" />;
    }
  };

  return (
    <div className="flex-1 flex flex-col h-screen max-h-screen bg-slate-950 text-slate-100 overflow-hidden">
      {/* Top Bar Header */}
      <header className="h-14 border-b border-slate-800/80 bg-slate-950/90 backdrop-blur-md px-4 flex items-center justify-between z-20 shrink-0">
        <div className="flex items-center gap-2 sm:gap-3">
          {/* Hamburger Menu Toggle Button */}
          <button
            onClick={onOpenSidebar}
            className="p-2 rounded-xl text-slate-300 hover:text-cyan-400 hover:bg-slate-900 border border-slate-800 transition-colors cursor-pointer"
            title="Mở menu (Sidebar)"
          >
            <Menu className="w-5 h-5" />
          </button>

          {/* Model Selector Pill */}
          <div className="relative">
            <button
              onClick={() => setShowModelDropdown(!showModelDropdown)}
              className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-900 border border-slate-800 hover:border-cyan-500/50 text-xs font-mono transition-all text-slate-200 cursor-pointer shadow-sm"
            >
              <Cpu className="w-3.5 h-3.5 text-cyan-400" />
              <span className="font-semibold">{conversation.model}</span>
              <ChevronDown className={`w-3.5 h-3.5 text-slate-400 transition-transform ${showModelDropdown ? 'rotate-180' : ''}`} />
            </button>

            {showModelDropdown && (
              <div className="absolute top-full left-0 mt-1.5 w-64 bg-slate-900 border border-slate-800 rounded-xl shadow-2xl p-1.5 z-50 space-y-1 backdrop-blur-xl">
                <div className="text-[10px] font-mono text-slate-400 px-2 py-1 uppercase tracking-wider">
                  Chọn Mô Hình AI Hoạt Động
                </div>
                {AVAILABLE_MODELS.map((m) => (
                  <button
                    key={m.id}
                    onClick={() => {
                      onSelectModel(m.id);
                      setShowModelDropdown(false);
                    }}
                    className={`w-full text-left px-2.5 py-2 rounded-lg text-xs flex items-center justify-between transition-colors ${
                      conversation.model === m.id
                        ? 'bg-cyan-950/60 border border-cyan-800/80 text-cyan-200 font-semibold'
                        : 'text-slate-300 hover:bg-slate-800'
                    }`}
                  >
                    <div>
                      <div className="font-sans font-medium text-white">{m.name}</div>
                      <div className="text-[10px] text-slate-400 font-mono">{m.speed}</div>
                    </div>
                    <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-slate-800 border border-slate-700 text-slate-300">
                      {m.badge}
                    </span>
                  </button>
                ))}
              </div>
            )}
          </div>

          <div className="hidden md:flex items-center gap-1.5 text-xs font-mono text-slate-400 bg-slate-900/60 px-2.5 py-1 rounded-lg border border-slate-800/80">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <span className="text-emerald-400 font-medium">Live API Connected</span>
          </div>
        </div>

        {/* Right Header Controls */}
        <div className="flex items-center gap-2">
          {/* Clear Chat Button */}
          {conversation.messages.length > 0 && (
            <button
              onClick={onClearChat}
              className="p-2 rounded-xl text-slate-400 hover:text-rose-400 hover:bg-slate-900 border border-slate-800/80 transition-colors cursor-pointer"
              title="Xóa đoạn chat hiện tại"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          )}

          {/* Google Workspace Button */}
          {onOpenWorkspace && (
            <button
              onClick={onOpenWorkspace}
              className="px-2.5 py-1.5 rounded-xl bg-emerald-950/60 border border-emerald-800/80 text-emerald-300 hover:bg-emerald-900/60 text-xs font-mono flex items-center gap-1.5 transition-colors cursor-pointer shadow-sm shadow-emerald-950/30"
              title="Google Tasks, Drive, Chat & Firestore"
            >
              <HardDrive className="w-3.5 h-3.5 text-emerald-400" />
              <span className="hidden sm:inline">Workspace</span>
            </button>
          )}

          {/* Admin status pill */}
          {isAdminAuthenticated && onOpenAdminConsole && (
            <button
              onClick={onOpenAdminConsole}
              className="px-2.5 py-1.5 rounded-xl bg-cyan-950/60 border border-cyan-800/80 text-cyan-300 hover:bg-cyan-900/60 text-xs font-mono flex items-center gap-1.5 transition-colors cursor-pointer shadow-sm shadow-cyan-950/30"
            >
              <ShieldCheck className="w-3.5 h-3.5 text-cyan-400" />
              <span className="hidden sm:inline">Admin Console</span>
            </button>
          )}
        </div>
      </header>

      {/* Messages Scroll Area */}
      <main className="flex-1 overflow-y-auto px-4 py-6 sm:px-6 md:px-8 space-y-6">
        <div className="max-w-3xl mx-auto space-y-6">
          {conversation.messages.length === 0 ? (
            /* Welcome Empty State */
            <div className="pt-8 sm:pt-14 pb-8 text-center space-y-6">
              <div className="w-16 h-16 sm:w-20 sm:h-20 mx-auto rounded-3xl bg-gradient-to-tr from-cyan-500 to-sky-600 flex items-center justify-center text-slate-950 shadow-2xl shadow-cyan-500/20 transform hover:scale-105 transition-transform">
                <Sparkles className="w-9 h-9 sm:w-11 sm:h-11" />
              </div>

              <div className="space-y-2 max-w-lg mx-auto">
                <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-white">
                  NDAWG PRO APEX CHAT
                </h1>
                <p className="text-xs sm:text-sm text-slate-400 leading-relaxed font-sans">
                  Hệ thống AI đa phương thức kết nối trực tiếp với mô hình Gemini thời gian thực, tích hợp RAG Thư viện Tri thức (Tầng C), bộ công cụ Math Kernel và chốt chặn an toàn Apex.
                </p>
              </div>

              {/* Suggestion Prompt Chips */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 max-w-2xl mx-auto text-left pt-2">
                {SUGGESTED_PROMPTS.map((item, idx) => (
                  <button
                    key={idx}
                    onClick={() => onSendMessage(item.prompt)}
                    className="p-3.5 rounded-2xl bg-slate-900/90 hover:bg-slate-800/90 border border-slate-800/90 hover:border-cyan-500/40 text-left transition-all group shadow-md hover:shadow-cyan-950/30 cursor-pointer"
                  >
                    <div className="text-xs font-semibold text-cyan-400 mb-1 group-hover:text-cyan-300 flex items-center gap-1.5">
                      <Sparkles className="w-3 h-3 text-cyan-500" />
                      <span>{item.title}</span>
                    </div>
                    <div className="text-xs text-slate-400 leading-snug line-clamp-2">
                      {item.prompt}
                    </div>
                  </button>
                ))}
              </div>
            </div>
          ) : (
            /* Messages List */
            conversation.messages.map((msg) => {
              const isUser = msg.role === 'user';
              const isAssistant = msg.role === 'assistant';
              const isExpanded = expandedReasoning[msg.id];

              return (
                <div
                  key={msg.id}
                  className={`flex flex-col ${isUser ? 'items-end' : 'items-start'} space-y-1.5`}
                >
                  {/* Sender Tag */}
                  <div className="flex items-center gap-2 px-1 text-[11px] font-mono text-slate-400">
                    <span className="font-semibold text-slate-300">{isUser ? 'Bạn' : 'NDAWG PRO AI'}</span>
                    {msg.model && (
                      <span className="px-1.5 py-0.2 rounded bg-slate-900 border border-slate-800 text-[10px] text-cyan-400">
                        {msg.model}
                      </span>
                    )}
                    <span>•</span>
                    <span>{new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                  </div>

                  {/* Message Bubble Card */}
                  <div
                    className={`max-w-2xl sm:max-w-3xl rounded-2xl px-4 py-3.5 text-sm leading-relaxed transition-all ${
                      isUser
                        ? 'bg-gradient-to-r from-cyan-600 to-sky-700 text-slate-50 shadow-md shadow-cyan-950/30'
                        : msg.error
                        ? 'bg-rose-950/40 border border-rose-800/80 text-rose-200 w-full'
                        : 'bg-slate-900 border border-slate-800 text-slate-100 w-full shadow-md shadow-slate-950/50'
                    }`}
                  >
                    {/* Multimodal Attachments in Message */}
                    {msg.attachments && msg.attachments.length > 0 && (
                      <div className="mb-3 flex flex-wrap gap-2">
                        {msg.attachments.map((att) => (
                          <div
                            key={att.id}
                            className={`rounded-xl overflow-hidden border p-1.5 flex items-center gap-2 ${
                              isUser ? 'bg-cyan-950/50 border-cyan-400/40' : 'bg-slate-950 border-slate-800'
                            }`}
                          >
                            {att.type === 'image' && att.previewUrl ? (
                              <img
                                src={att.previewUrl}
                                alt={att.name}
                                className="w-16 h-16 object-cover rounded-lg border border-slate-800 shrink-0"
                              />
                            ) : (
                              <div className="w-8 h-8 rounded-lg bg-slate-900 border border-slate-800 flex items-center justify-center text-cyan-400 shrink-0">
                                <FileText className="w-4 h-4" />
                              </div>
                            )}
                            <div className="text-[11px] font-mono leading-tight pr-2">
                              <div className="text-white font-medium truncate max-w-[150px]">{att.name}</div>
                              <div className="text-slate-300 text-[10px]">{(att.sizeBytes / 1024).toFixed(1)} KB</div>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}

                    {/* Assistant Plugin Executions Badges */}
                    {isAssistant && msg.pluginCalls && msg.pluginCalls.length > 0 && (
                      <div className="mb-3 space-y-1.5">
                        <div className="text-[10px] font-mono uppercase tracking-wider text-slate-400 font-semibold">
                          Công cụ đã thực thi ({msg.pluginCalls.length})
                        </div>
                        <div className="flex flex-wrap gap-2">
                          {msg.pluginCalls.map((call, idx) => (
                            <div
                              key={idx}
                              className="px-2.5 py-1 rounded-lg bg-slate-950 border border-slate-800 text-xs font-mono flex items-center gap-2"
                            >
                              {renderPluginIcon(call.pluginId)}
                              <span className="text-slate-200">{call.pluginName}</span>
                              <span className="text-emerald-400 text-[10px]">
                                {call.durationMs}ms
                              </span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Collapsible Reasoning Steps */}
                    {isAssistant && msg.reasoningSteps && msg.reasoningSteps.length > 0 && (
                      <div className="mb-3 border border-slate-800 rounded-xl bg-slate-950/60 overflow-hidden">
                        <button
                          onClick={() => toggleReasoning(msg.id)}
                          className="w-full px-3 py-2 text-left text-xs font-mono text-cyan-400 flex items-center justify-between hover:bg-slate-900 transition-colors cursor-pointer"
                        >
                          <div className="flex items-center gap-2">
                            <Cpu className="w-3.5 h-3.5" />
                            <span>Quy trình suy luận ({msg.reasoningSteps.length} bước)</span>
                          </div>
                          {isExpanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                        </button>
                        {isExpanded && (
                          <div className="px-3 pb-2.5 pt-1 space-y-1 border-t border-slate-800/60 text-xs font-mono text-slate-400">
                            {msg.reasoningSteps.map((step, idx) => (
                              <div key={idx} className="flex items-start gap-2">
                                <span className="text-cyan-500 font-bold">{idx + 1}.</span>
                                <span>{step}</span>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    )}

                    {/* V18 Quota / Provider Error Banner */}
                    {isAssistant && msg.classifiedError && (
                      <div className="mb-3 rounded-xl border border-rose-500/40 bg-rose-950/20 p-3.5 space-y-2.5">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0" />
                            <span className="text-xs font-mono font-bold text-rose-300">
                              {msg.classifiedError.errorCategory} (HTTP {msg.classifiedError.httpStatus})
                            </span>
                          </div>
                          {/* Language selector for error message */}
                          <div className="flex items-center gap-1 text-[10px] font-mono">
                            {(['vi', 'en', 'ko'] as const).map(lang => (
                              <button
                                key={lang}
                                type="button"
                                onClick={() => setMsgLang(msg.id, lang)}
                                className={`px-1.5 py-0.5 rounded cursor-pointer transition-colors ${
                                  (errorLanguageView[msg.id] || 'vi') === lang
                                    ? 'bg-rose-500/30 text-rose-200 font-bold border border-rose-500/50'
                                    : 'text-slate-400 hover:text-slate-200'
                                }`}
                              >
                                {lang.toUpperCase()}
                              </button>
                            ))}
                          </div>
                        </div>

                        {/* Localized Message */}
                        <div className="text-xs font-sans text-slate-200 leading-relaxed">
                          {msg.classifiedError.userMessage?.[errorLanguageView[msg.id] || 'vi'] || msg.content}
                        </div>

                        {/* Admin Diagnostics Collapsible */}
                        {msg.classifiedError.diagnostic && (
                          <div className="pt-2 border-t border-rose-900/40">
                            <button
                              type="button"
                              onClick={() => toggleDiagnostic(msg.id)}
                              className="text-[11px] font-mono text-cyan-400 flex items-center justify-between w-full hover:underline cursor-pointer"
                            >
                              <div className="flex items-center gap-1.5">
                                <Info className="w-3.5 h-3.5" />
                                <span>Chi tiết quản trị (Apex Diagnostic)</span>
                              </div>
                              {expandedDiagnostics[msg.id] ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                            </button>

                            {expandedDiagnostics[msg.id] && (
                              <div className="mt-2 p-2.5 rounded-lg bg-slate-950 border border-slate-800 space-y-1 text-[11px] font-mono text-slate-300">
                                <div><span className="text-cyan-400">Mã sự cố:</span> {msg.classifiedError.diagnostic.code}</div>
                                <div><span className="text-cyan-400">Chi tiết an toàn:</span> {msg.classifiedError.diagnostic.safeDetails}</div>
                                <div><span className="text-cyan-400">Khuyến nghị xử lý:</span> {msg.classifiedError.diagnostic.adminActionHint}</div>
                                <div><span className="text-cyan-400">Trạng thái Router:</span> {msg.classifiedError.providerStatus}</div>
                                {msg.classifiedError.retryAfterMs > 0 && (
                                  <div><span className="text-amber-400">Thời gian hạ nhiệt:</span> {msg.classifiedError.retryAfterMs}ms</div>
                                )}
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    )}

                    {/* Google Search / Maps Grounding Metadata Card */}
                    {isAssistant && msg.groundingMetadata && (
                      <div className="mb-3 p-3 rounded-xl bg-cyan-950/20 border border-cyan-800/40 text-xs font-mono space-y-1.5">
                        <div className="flex items-center gap-1.5 text-cyan-300 font-semibold text-[11px]">
                          <Search className="w-3.5 h-3.5 text-cyan-400" />
                          <span>Nguồn trích dẫn kiểm chứng từ Google Search Grounding:</span>
                        </div>
                        {Array.isArray(msg.groundingMetadata.groundingChunks) && msg.groundingMetadata.groundingChunks.length > 0 && (
                          <div className="flex flex-wrap gap-1.5 pt-1">
                            {msg.groundingMetadata.groundingChunks.map((chunk: any, cIdx: number) => {
                              const web = chunk.web;
                              if (!web) return null;
                              return (
                                <a
                                  key={cIdx}
                                  href={web.uri}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-slate-900 hover:bg-slate-800 border border-slate-800 hover:border-cyan-500/50 text-cyan-300 text-[10px] truncate max-w-[240px]"
                                  title={web.title || web.uri}
                                >
                                  <ExternalLink className="w-2.5 h-2.5 shrink-0" />
                                  <span className="truncate">{web.title || web.uri}</span>
                                </a>
                              );
                            })}
                          </div>
                        )}
                        {Array.isArray(msg.groundingMetadata.webSearchQueries) && (
                          <div className="text-[10px] text-slate-400 pt-0.5">
                            Truy vấn: {msg.groundingMetadata.webSearchQueries.join(', ')}
                          </div>
                        )}
                      </div>
                    )}

                    {/* Message Body Content (processed through Universal Render Integrity Engine) */}
                    <div className="whitespace-pre-wrap font-sans break-words selection:bg-cyan-500/30 selection:text-cyan-200 leading-relaxed">
                      {normalizeRenderText(msg.content)}
                    </div>

                    {/* Message Actions */}
                    <div className="mt-3 pt-2 border-t border-slate-800/60 flex items-center justify-between text-xs text-slate-400">
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => handleCopy(msg.id, msg.content)}
                          className="flex items-center gap-1 hover:text-slate-200 p-1 rounded hover:bg-slate-800/80 transition-colors cursor-pointer"
                          title="Sao chép nội dung"
                        >
                          {copiedId === msg.id ? (
                            <>
                              <Check className="w-3.5 h-3.5 text-emerald-400" />
                              <span className="text-emerald-400 text-[11px]">Đã chép</span>
                            </>
                          ) : (
                            <>
                              <Copy className="w-3.5 h-3.5" />
                              <span className="text-[11px]">Sao chép</span>
                            </>
                          )}
                        </button>

                        {isAssistant && (
                          <button
                            onClick={() => onSendMessage(conversation.messages[conversation.messages.length - 2]?.content || '')}
                            className="flex items-center gap-1 hover:text-slate-200 p-1 rounded hover:bg-slate-800/80 transition-colors cursor-pointer"
                            title="Tạo lại câu trả lời"
                          >
                            <RotateCcw className="w-3.5 h-3.5" />
                            <span className="text-[11px]">Thử lại</span>
                          </button>
                        )}
                      </div>

                      {/* Token & Cost tag for assistant */}
                      {isAssistant && msg.tokens && (
                        <div className="text-[10px] font-mono text-slate-400">
                          {msg.tokens.totalTokens} tokens • ${msg.costUsd?.toFixed(6) || '0.000000'}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              );
            })
          )}

          {/* Loading Animation / Streaming Bubble */}
          {isLoading && (
            <div className="flex flex-col items-start space-y-1.5 animate-in fade-in">
              <div className="flex items-center gap-2 px-1 text-[11px] text-cyan-400 font-mono">
                <Sparkles className="w-3 h-3 animate-spin" />
                <span>{conversation.model} đang suy luận & kiểm chứng...</span>
              </div>
              <div className="bg-slate-900 border border-slate-800 rounded-2xl px-5 py-4 text-sm flex items-center gap-3 shadow-lg">
                <div className="flex items-center gap-1.5">
                  <div className="w-2.5 h-2.5 rounded-full bg-cyan-400 animate-bounce [animation-delay:-0.3s]" />
                  <div className="w-2.5 h-2.5 rounded-full bg-cyan-400 animate-bounce [animation-delay:-0.15s]" />
                  <div className="w-2.5 h-2.5 rounded-full bg-cyan-400 animate-bounce" />
                </div>
                <span className="text-xs text-slate-400 font-mono">Đang gọi /api/chat...</span>
                {onStopGeneration && (
                  <button
                    onClick={onStopGeneration}
                    className="ml-4 px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-mono flex items-center gap-1.5 cursor-pointer"
                  >
                    <Square className="w-3 h-3 text-rose-400" />
                    <span>Dừng</span>
                  </button>
                )}
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>
      </main>

      {/* Input Bar Area */}
      <footer className="p-4 border-t border-slate-800/80 bg-slate-950/90 backdrop-blur-md shrink-0">
        <div className="max-w-3xl mx-auto space-y-2">
          {/* Grounding Mode Toggle Bar */}
          <div className="flex items-center justify-between px-1 text-xs">
            <div className="flex items-center gap-1.5 overflow-x-auto py-1">
              <span className="text-[11px] font-mono text-slate-400 uppercase tracking-wider shrink-0">Grounding:</span>
              <button
                type="button"
                onClick={() => setGroundingMode('none')}
                className={`px-2 py-0.5 rounded-lg text-[11px] font-mono transition-colors cursor-pointer shrink-0 ${
                  groundingMode === 'none'
                    ? 'bg-slate-800 text-slate-200 border border-slate-700 font-medium'
                    : 'text-slate-400 hover:text-slate-300 hover:bg-slate-900'
                }`}
              >
                Tắt
              </button>
              <button
                type="button"
                onClick={() => setGroundingMode('search')}
                className={`px-2 py-0.5 rounded-lg text-[11px] font-mono flex items-center gap-1 transition-colors cursor-pointer shrink-0 ${
                  groundingMode === 'search'
                    ? 'bg-cyan-950 border border-cyan-500/80 text-cyan-300 font-semibold shadow-sm shadow-cyan-950/50'
                    : 'text-slate-400 hover:text-cyan-400 hover:bg-slate-900 border border-slate-800'
                }`}
                title="Grounding bằng Google Search với gemini-3.8-flash"
              >
                <Search className="w-3 h-3 text-cyan-400" />
                <span>Google Search</span>
              </button>
              <button
                type="button"
                onClick={() => setGroundingMode('maps')}
                className={`px-2 py-0.5 rounded-lg text-[11px] font-mono flex items-center gap-1 transition-colors cursor-pointer shrink-0 ${
                  groundingMode === 'maps'
                    ? 'bg-emerald-950 border border-emerald-500/80 text-emerald-300 font-semibold shadow-sm shadow-emerald-950/50'
                    : 'text-slate-400 hover:text-emerald-400 hover:bg-slate-900 border border-slate-800'
                }`}
                title="Grounding bằng Google Maps với gemini-3.8-flash"
              >
                <MapPin className="w-3 h-3 text-emerald-400" />
                <span>Google Maps</span>
              </button>
            </div>

            {/* Quick Media Generators */}
            <div className="flex items-center gap-1.5 shrink-0">
              <button
                type="button"
                onClick={() => setShowImageModal(true)}
                className="px-2 py-0.5 rounded-lg bg-pink-950/40 hover:bg-pink-900/60 border border-pink-800/60 text-pink-300 text-[11px] font-mono flex items-center gap-1 transition-colors cursor-pointer"
                title="Tạo ảnh với Gemini Nano Banana 2.1"
              >
                <ImageIcon className="w-3 h-3 text-pink-400" />
                <span className="hidden sm:inline">Nano Banana</span>
              </button>
              <button
                type="button"
                onClick={() => setShowVideoModal(true)}
                className="px-2 py-0.5 rounded-lg bg-violet-950/40 hover:bg-violet-900/60 border border-violet-800/60 text-violet-300 text-[11px] font-mono flex items-center gap-1 transition-colors cursor-pointer"
                title="Tạo video với Gemini Omni Flash 1.1 (Interactions API)"
              >
                <Film className="w-3 h-3 text-violet-400" />
                <span className="hidden sm:inline">Omni Video</span>
              </button>
            </div>
          </div>

          {/* Main Input Box */}
          <div className="relative rounded-2xl bg-slate-900/90 border border-slate-800 focus-within:border-cyan-500/80 focus-within:ring-2 focus-within:ring-cyan-500/20 transition-all p-2 flex flex-col shadow-xl">
            {/* Attached files preview chips */}
            {attachedFiles.length > 0 && (
              <div className="flex flex-wrap gap-2 px-2 pt-1 pb-2 border-b border-slate-800/60 mb-2">
                {attachedFiles.map((att) => (
                  <div
                    key={att.id}
                    className="relative group rounded-xl overflow-hidden border border-cyan-500/40 bg-slate-950 px-2.5 py-1.5 flex items-center gap-2 text-xs"
                  >
                    {att.type === 'image' && att.previewUrl ? (
                      <img
                        src={att.previewUrl}
                        alt={att.name}
                        className="w-7 h-7 object-cover rounded border border-slate-800 shrink-0"
                      />
                    ) : (
                      <FileText className="w-4 h-4 text-cyan-400 shrink-0" />
                    )}
                    <div className="font-mono text-[11px] leading-tight">
                      <span className="text-slate-200 block truncate max-w-[120px] sm:max-w-[180px]">{att.name}</span>
                      <span className="text-slate-400 text-[10px]">{(att.sizeBytes / 1024).toFixed(1)} KB</span>
                    </div>
                    <button
                      type="button"
                      onClick={() => handleRemoveAttachment(att.id)}
                      className="ml-1 p-0.5 rounded-full hover:bg-slate-800 text-slate-400 hover:text-rose-400 cursor-pointer"
                      title="Gỡ tệp"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            )}

            {/* Audio Speech Status Banners */}
            {isListening && (
              <div className="flex items-center justify-between px-3 py-1.5 rounded-xl bg-cyan-950/60 border border-cyan-500/40 text-cyan-300 text-xs font-mono mb-1.5 animate-pulse">
                <div className="flex items-center gap-2">
                  <span className="flex h-2 w-2 relative">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-cyan-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-cyan-500"></span>
                  </span>
                  <span>Đang lắng nghe giọng nói qua Web Speech API... Hãy nói câu hỏi</span>
                </div>
                <button
                  type="button"
                  onClick={toggleSpeechRecognition}
                  className="px-2 py-0.5 rounded-md bg-cyan-900/60 hover:bg-cyan-800 text-[10px] text-cyan-200 cursor-pointer"
                >
                  Dừng nghe
                </button>
              </div>
            )}

            {isTranscribing && (
              <div className="flex items-center justify-between px-3 py-1.5 rounded-xl bg-purple-950/60 border border-purple-500/40 text-purple-300 text-xs font-mono mb-1.5 animate-pulse">
                <div className="flex items-center gap-2">
                  <span className="flex h-2 w-2 relative">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-purple-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-purple-500"></span>
                  </span>
                  <span>Đang ghi âm cho Gemini 3.5 Transcribe... Nhấn dừng để chuyển giọng nói sang văn bản</span>
                </div>
                <button
                  type="button"
                  onClick={toggleGeminiTranscribe}
                  className="px-2 py-0.5 rounded-md bg-purple-900/60 hover:bg-purple-800 text-[10px] text-purple-200 cursor-pointer"
                >
                  Dừng &amp; Phiên âm
                </button>
              </div>
            )}

            {speechError && (
              <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-300 text-xs font-mono mb-1.5 animate-in fade-in">
                <AlertCircle className="w-3.5 h-3.5 shrink-0 text-amber-400" />
                <span className="flex-1">{speechError}</span>
                <button
                  type="button"
                  onClick={() => setSpeechError(null)}
                  className="p-0.5 rounded hover:bg-amber-500/20 text-amber-400 cursor-pointer"
                >
                  <X className="w-3 h-3" />
                </button>
              </div>
            )}

            <textarea
              ref={textareaRef}
              rows={1}
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder={
                groundingMode === 'search'
                  ? '🔍 Nhập câu hỏi tìm kiếm Google Grounding (gemini-3.8-flash)...'
                  : groundingMode === 'maps'
                  ? '📍 Nhập địa điểm hoặc tra cứu Google Maps Grounding...'
                  : 'Nhập câu hỏi, bài toán, sinh học protein, hoặc tải lên ảnh/tài liệu... (Enter để gửi)'
              }
              className="w-full bg-transparent border-0 text-slate-100 placeholder-slate-400 text-sm focus:outline-none resize-none px-2 py-1 max-h-44 font-sans"
              disabled={isLoading}
            />

            <div className="flex items-center justify-between pt-2 border-t border-slate-800/40 px-1">
              {/* Left tool shortcuts & attachment & microphone buttons */}
              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  onClick={onOpenPluginCenter}
                  className="px-2 py-1 rounded-lg bg-slate-950 hover:bg-slate-800 text-[11px] font-mono text-cyan-400 border border-slate-800 hover:border-slate-700 flex items-center gap-1 transition-colors cursor-pointer"
                  title="Tùy chỉnh Plugins"
                >
                  <Layers className="w-3 h-3" />
                  <span>{conversation.enabledPluginIds.length} Plugins</span>
                </button>

                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="p-1.5 rounded-lg bg-slate-950 hover:bg-slate-800 text-slate-400 hover:text-cyan-400 border border-slate-800 hover:border-slate-700 transition-colors cursor-pointer"
                  title="Đính kèm hình ảnh hoặc tệp tài liệu"
                >
                  <Paperclip className="w-3.5 h-3.5" />
                </button>

                {/* Web Speech API Mic */}
                <button
                  type="button"
                  onClick={toggleSpeechRecognition}
                  className={`p-1.5 rounded-lg border transition-colors cursor-pointer relative ${
                    isListening
                      ? 'bg-rose-500/20 border-rose-500/80 text-rose-400 shadow-md shadow-rose-950/50'
                      : 'bg-slate-950 hover:bg-slate-800 text-slate-400 hover:text-cyan-400 border-slate-800 hover:border-slate-700'
                  }`}
                  title={isListening ? 'Đang ghi âm (Nhấn để dừng)' : 'Microphone Web Speech API'}
                >
                  <Mic className="w-3.5 h-3.5" />
                </button>

                {/* Gemini 3.5 Transcribe Mic */}
                <button
                  type="button"
                  onClick={toggleGeminiTranscribe}
                  className={`p-1.5 rounded-lg border text-[11px] font-mono flex items-center gap-1 transition-colors cursor-pointer relative ${
                    isTranscribing
                      ? 'bg-purple-500/20 border-purple-500/80 text-purple-300 shadow-md shadow-purple-950/50'
                      : 'bg-slate-950 hover:bg-slate-800 text-slate-400 hover:text-purple-400 border-slate-800 hover:border-slate-700'
                  }`}
                  title="Ghi âm & Phiên âm bằng Gemini 3.5 Transcribe"
                >
                  <Volume2 className="w-3.5 h-3.5 text-purple-400" />
                  <span className="hidden sm:inline text-[10px]">3.5 STT</span>
                </button>

                <input
                  ref={fileInputRef}
                  type="file"
                  onChange={handleFileChange}
                  accept="image/*,.txt,.md,.json,.csv,.py,.js,.ts,.tsx"
                  multiple
                  className="hidden"
                />
              </div>

              {/* Right Send / Stop Button */}
              <div>
                {isLoading ? (
                  <button
                    type="button"
                    onClick={onStopGeneration}
                    className="p-2 rounded-xl bg-rose-600 hover:bg-rose-500 text-white transition-colors cursor-pointer"
                    title="Dừng tạo"
                  >
                    <Square className="w-4 h-4" />
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={handleSend}
                    disabled={!inputText.trim() && attachedFiles.length === 0}
                    className="p-2 rounded-xl bg-gradient-to-r from-cyan-500 to-sky-600 hover:from-cyan-400 hover:to-sky-500 text-slate-950 font-bold transition-all disabled:opacity-30 disabled:cursor-not-allowed shadow-md shadow-cyan-950/40 cursor-pointer"
                    title="Gửi tin nhắn"
                  >
                    <Send className="w-4 h-4" />
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* Sub-footer Disclaimers & Governance Notice */}
          <div className="flex items-center justify-between px-2 text-[10px] font-mono text-slate-400">
            <span>NDAWG PRO APEX v9.0 • Đa phương thức &amp; Kiểm chứng</span>
            <span className="flex items-center gap-1 text-slate-400">
              <ShieldCheck className="w-3 h-3 text-cyan-500" />
              <span>Bảo mật API Key • Không rò rỉ dữ liệu</span>
            </span>
          </div>
        </div>
      </footer>

      {/* Nano Banana 2.1 Image Generation Modal */}
      {showImageModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-lg p-5 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <ImageIcon className="w-5 h-5 text-pink-400" />
                <h3 className="font-semibold text-white">Gemini Nano Banana 2.1 — Tạo Ảnh</h3>
              </div>
              <button
                onClick={() => setShowImageModal(false)}
                className="p-1 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-white cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <label className="block text-slate-300 font-mono mb-1">Mô tả hình ảnh (Prompt):</label>
                <textarea
                  rows={3}
                  value={imagePrompt}
                  onChange={(e) => setImagePrompt(e.target.value)}
                  placeholder="Ví dụ: Cybernetic laboratory with glowing holographic molecular structures, 8k render, octane render style"
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-slate-200 placeholder-slate-400 focus:outline-none focus:border-pink-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-300 font-mono mb-1">Tỷ lệ khung hình:</label>
                  <select
                    value={imageAspectRatio}
                    onChange={(e: any) => setImageAspectRatio(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2 text-slate-200"
                  >
                    <option value="1:1">1:1 Vuông (Instagram/Avatar)</option>
                    <option value="16:9">16:9 Ngang (YouTube/Desktop)</option>
                    <option value="9:16">9:16 Dọc (TikTok/Story)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-slate-300 font-mono mb-1">Độ phân giải:</label>
                  <select
                    value={imageSize}
                    onChange={(e: any) => setImageSize(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2 text-slate-200"
                  >
                    <option value="1K">1K (Tiêu chuẩn)</option>
                    <option value="2K">2K (Sắc nét)</option>
                    <option value="4K">4K (Siêu phân giải)</option>
                  </select>
                </div>
              </div>

              {imageError && (
                <div className="p-2 rounded-lg bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs font-mono">
                  {imageError}
                </div>
              )}

              {imageResult && (
                <div className="space-y-2 pt-2 border-t border-slate-800">
                  <div className="text-[11px] font-mono text-emerald-400">Đã tạo ảnh thành công:</div>
                  <img
                    src={imageResult}
                    alt="Generated by Gemini Nano Banana"
                    className="w-full max-h-64 object-contain rounded-xl border border-slate-800 bg-slate-950"
                  />
                  <div className="flex items-center gap-2 pt-1">
                    <button
                      onClick={handleAttachGeneratedImage}
                      className="flex-1 py-1.5 px-3 rounded-lg bg-pink-600 hover:bg-pink-500 text-white font-mono text-xs flex items-center justify-center gap-1.5 cursor-pointer"
                    >
                      <Paperclip className="w-3.5 h-3.5" />
                      <span>Đính kèm vào Chat</span>
                    </button>
                    <a
                      href={imageResult}
                      download={`nano_banana_${Date.now()}.png`}
                      className="py-1.5 px-3 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 font-mono text-xs flex items-center justify-center gap-1.5"
                    >
                      <Download className="w-3.5 h-3.5" />
                      <span>Lưu</span>
                    </a>
                  </div>
                </div>
              )}
            </div>

            <div className="pt-2 flex justify-end gap-2 border-t border-slate-800">
              <button
                onClick={() => setShowImageModal(false)}
                className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 font-mono text-xs cursor-pointer"
              >
                Đóng
              </button>
              <button
                onClick={handleGenerateImage}
                disabled={imageLoading || !imagePrompt.trim()}
                className="px-4 py-1.5 rounded-lg bg-gradient-to-r from-pink-500 to-rose-500 hover:from-pink-400 hover:to-rose-400 text-white font-mono text-xs font-semibold flex items-center gap-1.5 disabled:opacity-40 cursor-pointer"
              >
                {imageLoading ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    <span>Đang tạo ảnh...</span>
                  </>
                ) : (
                  <>
                    <Sparkles className="w-3.5 h-3.5" />
                    <span>Tạo ảnh</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Omni Flash 1.1 Video Generation Modal */}
      {showVideoModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-lg p-5 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <Film className="w-5 h-5 text-violet-400" />
                <h3 className="font-semibold text-white">Gemini Omni Flash 1.1 — Tạo Video</h3>
              </div>
              <button
                onClick={() => setShowVideoModal(false)}
                className="p-1 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-white cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <label className="block text-slate-300 font-mono mb-1">Mô tả video (Prompt):</label>
                <textarea
                  rows={3}
                  value={videoPrompt}
                  onChange={(e) => setVideoPrompt(e.target.value)}
                  placeholder="Ví dụ: Cinematic space station orbiting Earth at sunrise, solar panels glistening with lens flare, photorealistic 4k"
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-slate-200 placeholder-slate-400 focus:outline-none focus:border-violet-500"
                />
              </div>

              <div>
                <label className="block text-slate-300 font-mono mb-1">Tỷ lệ khung hình:</label>
                <select
                  value={videoAspectRatio}
                  onChange={(e: any) => setVideoAspectRatio(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2 text-slate-200"
                >
                  <option value="16:9">16:9 Ngang (YouTube/Cinema)</option>
                  <option value="9:16">9:16 Dọc (TikTok/Shorts/Reels)</option>
                </select>
              </div>

              <div>
                <label className="block text-slate-300 font-mono mb-1">Ảnh đầu vào (Tùy chọn — Ảnh chuyển động thành video):</label>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => videoImageInputRef.current?.click()}
                    className="px-3 py-1.5 rounded-lg bg-slate-950 border border-slate-800 hover:border-slate-700 text-slate-300 font-mono text-xs flex items-center gap-1.5 cursor-pointer"
                  >
                    <Paperclip className="w-3.5 h-3.5" />
                    <span>Chọn ảnh tham chiếu</span>
                  </button>
                  {videoInputImage && (
                    <span className="text-[11px] font-mono text-emerald-400">Đã chọn ảnh</span>
                  )}
                  <input
                    ref={videoImageInputRef}
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={async (e) => {
                      const f = e.target.files?.[0];
                      if (!f) return;
                      const reader = new FileReader();
                      reader.onload = () => setVideoInputImage(reader.result as string);
                      reader.readAsDataURL(f);
                    }}
                  />
                </div>
              </div>

              {videoError && (
                <div className="p-2 rounded-lg bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs font-mono">
                  {videoError}
                </div>
              )}

              {videoResult && (
                <div className="p-3 rounded-lg bg-violet-950/40 border border-violet-800/60 text-violet-200 text-xs font-mono">
                  {videoResult}
                </div>
              )}
            </div>

            <div className="pt-2 flex justify-end gap-2 border-t border-slate-800">
              <button
                onClick={() => setShowVideoModal(false)}
                className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 font-mono text-xs cursor-pointer"
              >
                Đóng
              </button>
              <button
                onClick={handleGenerateVideo}
                disabled={videoLoading || !videoPrompt.trim()}
                className="px-4 py-1.5 rounded-lg bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 text-white font-mono text-xs font-semibold flex items-center gap-1.5 disabled:opacity-40 cursor-pointer"
              >
                {videoLoading ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    <span>Đang gọi Interactions API...</span>
                  </>
                ) : (
                  <>
                    <Film className="w-3.5 h-3.5" />
                    <span>Tạo Video</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
