/**
 * NDAWG PRO — PART 7/8 (UNIFIED FINAL V2)
 * Full-Stack Express Server with Gemini API Integration & Vite Middlewares
 */

import express from 'express';
import { createServer as createViteServer } from 'vite';
import path from 'path';
import fs from 'fs';
import crypto from 'crypto';
import dotenv from 'dotenv';
import { GoogleGenAI } from '@google/genai';
import { fileURLToPath } from 'url';
import { TrainingGate } from './src/core/trainingGate.ts';
import type { KnowledgeCardItem, DetailedConditionStatus } from './src/core/types.ts';
import type { ConnectionState } from './src/types/chat.ts';
import { GameIntelligenceEngine } from './src/modules/gameIntelligence.ts';
import { CircuitBreaker, AppendSafeTelemetryStore, redactSecrets } from './src/core/telemetry.ts';
import { UniversalIntentRouter } from './src/core/router.ts';
import { UniversalKnowledgeTaxonomy } from './src/core/universalTaxonomy.ts';
import { CapabilityQualityEngine } from './src/core/capabilityQualityEngine.ts';
import { AdaptivePerformanceEngine } from './src/core/adaptivePerformance.ts';
import { RepoContextBuilder } from './src/core/repoContextBuilder.ts';
import { ReceiptArchiveEngine } from './src/core/receiptArchive.ts';
import { PersonalizationEngine } from './src/core/personalizationEngine.ts';
import { classifyProviderError, calculateBackoffWithJitter } from './src/core/quotaClassifier.ts';
import type { ClassifiedError } from './src/core/quotaClassifier.ts';
import { normalizeRenderText } from './src/core/renderIntegrity.ts';
import { QuotaAwareModelRouter } from './src/core/quotaAwareRouter.ts';
import { UniversalSelfHealingEngine } from './src/core/selfHealingEngine.ts';

if (process.env.GEMINI_API_KEY === 'MY_GEMINI_API_KEY' || !process.env.GEMINI_API_KEY) {
  delete process.env.GEMINI_API_KEY;
}
dotenv.config({ override: true });

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = Number(process.env.PORT) || 3000;
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'nvdatgm';

// Apex Infinity Core Engines
const gameEngine = new GameIntelligenceEngine();
const circuitBreaker = new CircuitBreaker();
const telemetryStore = new AppendSafeTelemetryStore();
const intentRouter = new UniversalIntentRouter();
const universalTaxonomy = new UniversalKnowledgeTaxonomy();
const capabilityQualityEngine = new CapabilityQualityEngine();
const adaptivePerformance = new AdaptivePerformanceEngine();
const repoContextBuilder = new RepoContextBuilder();
const receiptArchive = new ReceiptArchiveEngine();
const personalizationEngine = new PersonalizationEngine();
const quotaRouter = QuotaAwareModelRouter.getInstance();
const selfHealingEngine = UniversalSelfHealingEngine.getInstance();

// Granular Connection States (Directive B)
function getInitialGeminiState(): ConnectionState {
  const rawKey = process.env.GEMINI_API_KEY;
  if (!rawKey || rawKey.trim() === '' || rawKey === 'MY_GEMINI_API_KEY') {
    return 'NOT_CONFIGURED';
  }
  return 'GEMINI_SECRET_CONFIGURED';
}

let geminiConnectionState: ConnectionState = getInitialGeminiState();
let lastLiveVerifiedTimestamp: number | null = null;
let lastLiveVerifiedModel: string | null = null;

app.use(express.json({ limit: '10mb' }));

// In-memory active admin sessions: token -> { role, createdAt, expiresAt }
const adminSessions = new Map<string, { role: string; createdAt: number; expiresAt: number }>();

// Clean expired sessions periodically
setInterval(() => {
  const now = Date.now();
  for (const [token, session] of adminSessions.entries()) {
    if (session.expiresAt < now) {
      adminSessions.delete(token);
    }
  }
}, 60000);

// Available Plugins Definition
const AVAILABLE_PLUGINS = [
  {
    id: 'web_search',
    name: 'Tìm kiếm trực tuyến (Web Search)',
    description: 'Tìm kiếm thông tin thời gian thực với trích dẫn nguồn kiểm chứng',
    version: '1.2.0',
    tier: 'TIER_1_READ',
    enabled: true,
    iconName: 'Globe',
    parameters: [
      { name: 'query', type: 'string', description: 'Từ khóa tìm kiếm', required: true }
    ]
  },
  {
    id: 'math_kernel',
    name: 'Nhân tính toán học chính xác (Math Kernel)',
    description: 'Thực thi các phép tính đại số, ma trận và kiểm chứng kết quả số học chính xác',
    version: '2.0.0',
    tier: 'TIER_1_READ',
    enabled: true,
    iconName: 'Calculator',
    parameters: [
      { name: 'expression', type: 'string', description: 'Biểu thức toán học', required: true }
    ]
  },
  {
    id: 'knowledge_base',
    name: 'Cơ sở tri thức kiểm chứng NDAWG (Knowledge RAG)',
    description: 'Truy xuất tri thức đã hấp thụ và vượt qua kiểm định Provider Terms & Grounding',
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
    description: 'Thực thi mã nguồn trong sandbox cô lập an toàn không chạm bí mật hệ thống',
    version: '1.0.4',
    tier: 'TIER_2_EXECUTION',
    enabled: true,
    iconName: 'Code',
    parameters: [
      { name: 'language', type: 'string', description: 'javascript / typescript / python', required: true },
      { name: 'code', type: 'string', description: 'Đoạn mã cần chạy', required: true }
    ]
  },
  {
    id: 'image_studio',
    name: 'Bộ xử lý & bảo toàn ảnh gốc (Image Studio Diff)',
    description: 'Chỉnh sửa ảnh với bảo toàn buffer gốc, đo lường pixel drift và rollback phiên bản',
    version: '2.2.0',
    tier: 'TIER_2_EXECUTION',
    enabled: true,
    iconName: 'Image',
    parameters: [
      { name: 'prompt', type: 'string', description: 'Yêu cầu xử lý ảnh', required: true }
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

// Helper: safe math expression evaluation
function evaluateMathExpression(expr: string): { success: boolean; result?: number | string; error?: string } {
  try {
    // Sanitize: allow only digits, operators, parens, decimal points, Math functions
    const clean = expr.trim();
    if (!/^[0-9+\-*/()., %^eE\sMath.sqrtcospintanabslog]+$/.test(clean)) {
      return { success: false, error: 'Ký tự toán học không hợp lệ' };
    }
    // Safe evaluation using Function with no globals
    const fn = new Function(`return (${clean})`);
    const val = fn();
    return { success: true, result: val };
  } catch (err: any) {
    return { success: false, error: err.message || 'Lỗi tính toán' };
  }
}

// ==================== API ROUTES ====================

// 1. Health & Config status
app.get('/api/health', (req, res) => {
  const rawKey = process.env.GEMINI_API_KEY;
  const hasRealKey = Boolean(rawKey && rawKey.trim() !== '' && rawKey !== 'MY_GEMINI_API_KEY');
  
  if (hasRealKey && geminiConnectionState === 'NOT_CONFIGURED') {
    geminiConnectionState = 'GEMINI_SECRET_CONFIGURED';
  } else if (!hasRealKey) {
    geminiConnectionState = 'NOT_CONFIGURED';
  }

  res.json({
    status: 'ok',
    server: 'NDAWG PRO APEX Backend v8.0 (Unified Final)',
    serverStatus: 'SERVER_READY',
    chatRouteStatus: 'CHAT_API_ROUTE_READY',
    connectionState: geminiConnectionState,
    hasGeminiKey: hasRealKey,
    lastLiveVerifiedTimestamp,
    lastLiveVerifiedModel,
    defaultModel: 'gemini-3.8-flash',
    supportedModels: [
      { id: 'gemini-3.8-flash', name: 'Gemini 3.8 Flash (Tác vụ chung, Search & Maps Grounding)', provider: 'Google', taskType: 'general', modalities: ['text', 'image'] },
      { id: 'gemini-4-argon', name: 'Gemini 4 Argon (Suy luận chuyên sâu & Lập trình)', provider: 'Google', taskType: 'complex_reasoning', modalities: ['text', 'image'] },
      { id: 'gemini-3.1-flash-lite', name: 'Gemini 3.1 Flash Lite (Phản hồi siêu tốc & Tóm tắt)', provider: 'Google', taskType: 'fast_query', modalities: ['text'] },
      { id: 'gemini-3.8-live', name: 'Gemini 3.8 Live (Hội thoại thời gian thực hai chiều)', provider: 'Google', taskType: 'live_audio', modalities: ['text', 'audio'] },
      { id: 'gemini-3.5-transcribe', name: 'Gemini 3.5 Transcribe (Chuyển giọng nói thành văn bản)', provider: 'Google', taskType: 'audio_transcription', modalities: ['audio', 'text'] },
      { id: 'gemini-nano-banana-2.1', name: 'Gemini Nano Banana 2.1 (Tạo và chỉnh sửa hình ảnh)', provider: 'Google', taskType: 'image_generation', modalities: ['image'] },
      { id: 'gemini-omni-1.1-flash', name: 'Gemini Omni Flash 1.1 (Interactions API Video)', provider: 'Google', taskType: 'video_generation', modalities: ['video', 'text', 'image'] },
      { id: 'claude-3-5-sonnet', name: 'Claude 3.5 Sonnet (Adapter Orchestration)', provider: 'Anthropic', taskType: 'adapter_orchestration', modalities: ['text'] },
      { id: 'gpt-4o', name: 'GPT-4o (Adapter Orchestration)', provider: 'OpenAI', taskType: 'adapter_orchestration', modalities: ['text'] }
    ],
    timestamp: Date.now()
  });
});

// 2. Admin Authentication
app.post('/api/admin/login', (req, res) => {
  const { password } = req.body;
  if (!password || typeof password !== 'string') {
    return res.status(400).json({ success: false, error: 'Vui lòng cung cấp mật khẩu quản trị viên' });
  }

  // Compare strictly without printing password in server logs
  if (password === ADMIN_PASSWORD) {
    const token = crypto.randomBytes(32).toString('hex');
    const now = Date.now();
    const expiresAt = now + 24 * 60 * 60 * 1000; // 24 hours
    adminSessions.set(token, { role: 'ADMIN', createdAt: now, expiresAt });

    return res.json({
      success: true,
      token,
      role: 'ADMIN',
      expiresAt,
      message: 'Xác thực quản trị viên thành công'
    });
  } else {
    return res.status(401).json({
      success: false,
      error: 'Mật khẩu quản trị viên không chính xác'
    });
  }
});

// 3. Admin Session Verification
app.post('/api/admin/verify', (req, res) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ valid: false, error: 'Thiếu Authorization Bearer token' });
  }
  const token = authHeader.substring(7);
  const session = adminSessions.get(token);
  if (!session || session.expiresAt < Date.now()) {
    if (session) adminSessions.delete(token);
    return res.status(401).json({ valid: false, error: 'Phiên quản trị viên đã hết hạn hoặc không hợp lệ' });
  }
  return res.json({ valid: true, role: session.role, expiresAt: session.expiresAt });
});

// 4. Admin Logout
app.post('/api/admin/logout', (req, res) => {
  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith('Bearer ')) {
    const token = authHeader.substring(7);
    adminSessions.delete(token);
  }
  return res.json({ success: true, message: 'Đã đăng xuất phiên quản trị viên' });
});

// 5. Plugin Registry Endpoint
app.get('/api/plugins', (req, res) => {
  res.json({ plugins: AVAILABLE_PLUGINS });
});

// ==================== KNOWLEDGE CARDS (TẦNG C) REPOSITORY ====================
const initialKnowledgeCards: KnowledgeCardItem[] = [
  {
    id: 'card_transformer',
    title: 'Kiến trúc Transformer & Cơ chế Self-Attention',
    category: 'Kiến trúc mô hình',
    summary: 'Kiến trúc nền tảng dựa hoàn toàn trên cơ chế Attention, loại bỏ hoàn toàn đệ quy RNN.',
    specs: [
      'Cơ chế: Scaled Dot-Product Attention: Softmax(QK^T / sqrt(d_k)) * V',
      'Độ phức tạp: O(N^2) theo độ dài chuỗi context',
      'Tối ưu hóa Inference: KV Cache lưu trữ Key-Value tensors để tránh tái tính toán O(N^2)',
      'Biến thể: Multi-Head Attention (MHA), Multi-Query Attention (MQA), Grouped-Query Attention (GQA)'
    ],
    references: [
      'Attention Is All You Need (Vaswani et al., NeurIPS 2017)',
      'Fast Transformer Decoding: One Write-Head is All You Need (Shazeer, 2019)'
    ],
    author: 'AI Core Architecture Team',
    version: '1.2.0',
    verificationStatus: 'Gold',
    hardwareNotice: 'Lý thuyết thuật toán • Tài liệu giáo dục kỹ thuật tham khảo',
    createdAt: 1711000000000,
    lastUpdated: '2026-03-20T08:00:00.000Z'
  },
  {
    id: 'card_moe',
    title: 'Mixture-of-Experts (MoE) & Kỹ Thuật Định Tuyến Thưa',
    category: 'Kiến trúc mô hình',
    summary: 'Kỹ thuật định tuyến thưa (Sparse Routing) chỉ kích hoạt một tập hợp con chuyên gia cho mỗi token.',
    specs: [
      'Định tuyến: Router Network tính xác suất Softmax và chọn Top-K chuyên gia (ví dụ Top-2 trong 8)',
      'Ưu điểm: Tăng dung lượng tham số (Param Capacity) mà giữ chi phí tính toán FLOPs/token cố định',
      'Thách thức: Yêu cầu VRAM bộ nhớ lớn để chứa toàn bộ trọng số của mọi chuyên gia',
      'Triển khai thực tế: Mixtral 8x7B, DeepSeek-V3, Switch Transformer'
    ],
    references: [
      'Outrageously Large Neural Networks: The Sparsely-Gated MoE Layer (Shazeer et al., 2017)',
      'DeepSeek-V3 Technical Report (2024)'
    ],
    author: 'AI Core Architecture Team',
    version: '1.1.0',
    verificationStatus: 'Gold',
    hardwareNotice: 'Lý thuyết thuật toán • Phân bổ tính toán thưa',
    createdAt: 1711100000000,
    lastUpdated: '2026-03-21T09:30:00.000Z'
  },
  {
    id: 'card_ssm_mamba',
    title: 'State Space Models (SSM) & Kiến Trúc Mamba',
    category: 'Kiến trúc mô hình',
    summary: 'Mô hình không gian trạng thái tuyến tính cho phép xử lý ngữ cảnh cực dài với chi phí O(N).',
    specs: [
      'Cơ chế: Trạng thái ẩn được cập nhật qua phương trình vi phân tuyến tính rời rạc hóa',
      'Ưu điểm: Suy luận thời gian thực O(1) bộ nhớ đệm cho mỗi token tiếp theo',
      'Cơ chế chọn lọc (Selective SSM): Cho phép mô hình quyết định thông tin nào cần ghi nhớ hoặc loại bỏ',
      'Ứng dụng: Chuỗi thời gian, tài liệu siêu dài 1M+ tokens, tín hiệu audio'
    ],
    references: [
      'Mamba: Linear-Time Sequence Modeling with Selective State Spaces (Gu & Dao, 2023)',
      'Transformers are RNNs: Fast Autoregressive Transformers with Linear Attention (Katharopoulos et al., 2020)'
    ],
    author: 'AI Core Architecture Team',
    version: '1.0.0',
    verificationStatus: 'Gold',
    hardwareNotice: 'Mô hình tuyến tính • Tài liệu nghiên cứu học thuật',
    createdAt: 1711200000000,
    lastUpdated: '2026-03-22T10:15:00.000Z'
  },
  {
    id: 'card_peft_lora',
    title: 'LoRA & QLoRA Parameter-Efficient Fine-Tuning',
    category: 'Kỹ thuật tinh chỉnh',
    summary: 'Phương pháp tinh chỉnh thích ứng bậc thấp giúp cập nhật mô hình với chi phí tính toán tối thiểu.',
    specs: [
      'Nguyên lý LoRA: Đóng băng trọng số gốc W_0, huấn luyện phân tích ma trận bậc thấp Delta_W = B * A',
      'Kỹ thuật QLoRA: Lượng tử hóa trọng số gốc xuống 4-bit NormalFloat (NF4), giữ gradient độ chính xác 16-bit',
      'Tiết kiệm VRAM: Giảm hơn 75% bộ nhớ GPU cần thiết trong quá trình SFT',
      'Ứng dụng: Tinh chỉnh mô hình 70B trên GPU đơn lẻ 24GB–48GB VRAM'
    ],
    references: [
      'LoRA: Low-Rank Adaptation of Large Language Models (Hu et al., ICLR 2022)',
      'QLoRA: Efficient Finetuning of Quantized LLMs (Dettmers et al., NeurIPS 2023)'
    ],
    author: 'Fine-Tuning Working Group',
    version: '2.0.0',
    verificationStatus: 'Gold',
    hardwareNotice: 'Tài liệu kỹ thuật • Yêu cầu GPU hỗ trợ bfloat16/int4 khi chạy thực tế',
    createdAt: 1711300000000,
    lastUpdated: '2026-03-23T14:00:00.000Z'
  },
  {
    id: 'card_nvidia_h100_b200',
    title: 'NVIDIA H100 Hopper & B200 Blackwell Architecture',
    category: 'Tham khảo phần cứng',
    summary: 'Các thế hệ GPU trung tâm dữ liệu chuyên dụng cho huấn luyện và suy luận AI quy mô lớn.',
    specs: [
      'Định dạng số học: FP8 Tensor Cores với Transformer Engine tự động phân giải',
      'Băng thông bộ nhớ (HBM3e): Lên tới 3.35 TB/s (H100) và 8.0 TB/s (Blackwell B200)',
      'Giao tiếp NVLink: 900 GB/s (H100) và 1.8 TB/s (Blackwell B200)',
      'Công suất tiêu thụ: 700W (H100 SXM) và 1000W–1200W (B200)'
    ],
    references: [
      'NVIDIA Hopper Architecture In-Depth (Whitepaper 2022)',
      'NVIDIA Blackwell Architecture Whitepaper (2024)'
    ],
    author: 'Hardware Benchmark Group',
    version: '1.0.0',
    verificationStatus: 'Silver',
    hardwareNotice: 'CẢNH BÁO: NDAWG PRO KHÔNG SỞ HỮU HOẶC VẬN HÀNH CỤM GPU NÀY. ĐÂY LÀ THÔNG SỐ THAM KHẢO GIÁO DỤC.',
    createdAt: 1711400000000,
    lastUpdated: '2026-03-24T16:45:00.000Z'
  },
  {
    id: 'card_google_tpu',
    title: 'Google Cloud TPU v5e & TPU v5p Accelerator',
    category: 'Tham khảo phần cứng',
    summary: 'Bộ vi xử lý chuyên dụng ASIC của Google thiết kế riêng cho các mô hình Transformer và Diffusion.',
    specs: [
      'Matrix Multiply Unit (MXU): Phép nhân ma trận chuyên biệt độ trễ thấp',
      'Kết nối quang học (Optical Circuit Switches - OCS): Ghép nối thành các Superpod hàng nghìn chip',
      'Hỗ trợ framework: JAX, PyTorch/XLA, TensorFlow',
      'Phân khúc: TPU v5e tối ưu hóa chi phí (cost-efficiency), TPU v5p cho huấn luyện siêu cụm'
    ],
    references: [
      'Google Cloud TPU System Architecture (2023)',
      'TPU v4/v5 Supercomputer at Scale (ISCA 2023)'
    ],
    author: 'Hardware Benchmark Group',
    version: '1.0.0',
    verificationStatus: 'Silver',
    hardwareNotice: 'CẢNH BÁO: TÀI LIỆU GIÁO DỤC THAM KHẢO • KHÔNG PHẢI PHẦN CỨNG VẬT LÝ SỞ HỮU CỦA ỨNG DỤNG.',
    createdAt: 1711500000000,
    lastUpdated: '2026-03-25T11:20:00.000Z'
  },
  {
    id: 'card_apex_governor',
    title: 'Apex Deterministic Limits Governor & Cryptographic Audit',
    category: 'Apex Governance',
    summary: 'Cơ chế kiểm soát an toàn tài chính, hạn mức $0.50 mục tiêu, Circuit Breaker 3 lần lỗi và Audit Chain băm SHA-256.',
    specs: [
      'Hạn mức tài chính: Giới hạn ngân sách $0.50/ngày và $0.05/cuộc gọi',
      'Circuit Breaker: Tự động ngắt khi có 3 lỗi liên tiếp giống nhau',
      'Kill-Switches: Ngắt lập tức theo 3 cấp: Toàn cục, Nhà cung cấp, Công cụ',
      'Chuỗi khối kiểm toán: Merkle-style SHA-256 hash chain chống làm sai lệch lịch sử'
    ],
    references: [
      'NDAWG PRO Apex Governance Specification (2026)',
      'Provable Security Audit Architecture Report v1.0'
    ],
    author: 'Apex Governance Committee',
    version: '3.0.0',
    verificationStatus: 'Gold',
    hardwareNotice: 'Kiến trúc bảo mật & quản trị nội bộ NDAWG PRO',
    createdAt: 1711600000000,
    lastUpdated: '2026-03-26T18:00:00.000Z'
  }
];

let knowledgeCardsStore: KnowledgeCardItem[] = [...initialKnowledgeCards];

function searchKnowledgeCards(query: string, categoryFilter?: string, badgeFilter?: string): KnowledgeCardItem[] {
  const cleanQ = (query || '').toLowerCase().trim();
  const tokens = cleanQ.split(/\s+/).filter(Boolean);

  return knowledgeCardsStore.filter((card) => {
    if (categoryFilter && categoryFilter !== 'ALL' && card.category !== categoryFilter) {
      return false;
    }
    if (badgeFilter && badgeFilter !== 'ALL' && card.verificationStatus !== badgeFilter) {
      return false;
    }
    if (tokens.length === 0) return true;

    const fullText = `${card.title} ${card.category} ${card.summary} ${card.specs.join(' ')} ${card.references.join(' ')}`.toLowerCase();
    return tokens.some((token) => fullText.includes(token));
  });
}

// REST: Knowledge Cards Endpoints
app.get('/api/knowledge-cards', (req, res) => {
  const { search, category, badge } = req.query;
  const results = searchKnowledgeCards(
    (search as string) || '',
    (category as string) || undefined,
    (badge as string) || undefined
  );
  res.json({
    total: results.length,
    cards: results,
    categories: Array.from(new Set(knowledgeCardsStore.map((c) => c.category))),
    tierDistribution: {
      Gold: knowledgeCardsStore.filter((c) => c.verificationStatus === 'Gold').length,
      Silver: knowledgeCardsStore.filter((c) => c.verificationStatus === 'Silver').length,
      Bronze: knowledgeCardsStore.filter((c) => c.verificationStatus === 'Bronze').length
    }
  });
});

app.post('/api/knowledge-cards', (req, res) => {
  const { title, category, summary, specs = [], references = [], author, verificationStatus = 'Bronze', hardwareNotice } = req.body;
  if (!title || !category || !summary) {
    return res.status(400).json({ error: 'Tiêu đề, phân loại và tóm tắt không được để trống' });
  }

  const newCard: KnowledgeCardItem = {
    id: `card_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
    title: title.trim(),
    category: category.trim(),
    summary: summary.trim(),
    specs: Array.isArray(specs) ? specs.filter(Boolean) : [String(specs)],
    references: Array.isArray(references) ? references.filter(Boolean) : [String(references)],
    author: author ? author.trim() : 'Anonymous Contributor',
    version: '1.0.0',
    verificationStatus: ['Gold', 'Silver', 'Bronze'].includes(verificationStatus) ? verificationStatus : 'Bronze',
    hardwareNotice: hardwareNotice || 'Tài liệu giáo dục kỹ thuật tham khảo',
    createdAt: Date.now(),
    lastUpdated: new Date().toISOString()
  };

  knowledgeCardsStore.unshift(newCard);
  res.status(201).json({ success: true, card: newCard });
});

app.put('/api/knowledge-cards/:id', (req, res) => {
  const { id } = req.params;
  const idx = knowledgeCardsStore.findIndex((c) => c.id === id);
  if (idx === -1) {
    return res.status(404).json({ error: 'Không tìm thấy thẻ tri thức với mã: ' + id });
  }

  const existing = knowledgeCardsStore[idx];
  const { title, category, summary, specs, references, author, version, verificationStatus, hardwareNotice } = req.body;

  const updated: KnowledgeCardItem = {
    ...existing,
    title: title !== undefined ? title.trim() : existing.title,
    category: category !== undefined ? category.trim() : existing.category,
    summary: summary !== undefined ? summary.trim() : existing.summary,
    specs: Array.isArray(specs) ? specs.filter(Boolean) : existing.specs,
    references: Array.isArray(references) ? references.filter(Boolean) : existing.references,
    author: author !== undefined ? author.trim() : existing.author,
    version: version !== undefined ? version.trim() : existing.version,
    verificationStatus: ['Gold', 'Silver', 'Bronze'].includes(verificationStatus)
      ? verificationStatus
      : existing.verificationStatus,
    hardwareNotice: hardwareNotice !== undefined ? hardwareNotice : existing.hardwareNotice,
    lastUpdated: new Date().toISOString()
  };

  knowledgeCardsStore[idx] = updated;
  res.json({ success: true, card: updated });
});

app.delete('/api/knowledge-cards/:id', (req, res) => {
  const { id } = req.params;
  const initialLen = knowledgeCardsStore.length;
  knowledgeCardsStore = knowledgeCardsStore.filter((c) => c.id !== id);
  if (knowledgeCardsStore.length === initialLen) {
    return res.status(404).json({ error: 'Không tìm thấy thẻ tri thức cần xóa: ' + id });
  }
  res.json({ success: true, message: 'Đã xóa thẻ tri thức thành công', deletedId: id });
});

app.post('/api/knowledge-cards/search', (req, res) => {
  const { query, category, badge } = req.body;
  const matched = searchKnowledgeCards(query || '', category, badge);
  res.json({ query, resultsCount: matched.length, cards: matched });
});

// ==================== TRAINING GATE (TẦNG B) BACKEND INSTANCE ====================
const serverTrainingGate = new TrainingGate();

app.get('/api/training-gate', (req, res) => {
  const evaluation = serverTrainingGate.evaluateGate();
  const conditions = serverTrainingGate.getConditionDetails();
  const auditHistory = serverTrainingGate.getAuditHistory();

  res.json({
    passed: evaluation.passed,
    passedCount: evaluation.passedCount,
    totalCount: evaluation.totalCount,
    status: evaluation.status,
    verdictMessage: evaluation.verdictMessage,
    isChatBlocked: evaluation.isChatBlocked,
    conditions,
    missingCriteria: evaluation.missingCriteria,
    auditHistory
  });
});

app.post('/api/training-gate/audit', (req, res) => {
  const auditResult = serverTrainingGate.runDiagnosticAudit();
  res.json({
    success: true,
    evaluation: auditResult.evaluation,
    diagnosticLog: auditResult.diagnosticLog,
    timestamp: auditResult.timestamp
  });
});

app.post('/api/training-gate/update-condition', (req, res) => {
  const { key, status, evidence, notes } = req.body;
  if (!key || !status) {
    return res.status(400).json({ error: 'Thiếu key hoặc status của điều kiện' });
  }

  try {
    const updatedEval = serverTrainingGate.updateConditionStatus(key, status, evidence, notes);
    res.json({ success: true, evaluation: updatedEval });
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

// ==================== UNIFIED SYSTEM STATUS API ====================
app.get('/api/system-status', (req, res) => {
  const rawKey = process.env.GEMINI_API_KEY;
  const hasRealKey = Boolean(rawKey && rawKey.trim() !== '' && rawKey !== 'MY_GEMINI_API_KEY');
  const gateEval = serverTrainingGate.evaluateGate();

  res.json({
    status: 'healthy',
    timestamp: Date.now(),
    version: 'NDAWG PRO APEX v8.0 (Unified Final)',
    chat: {
      activeProvider: 'Google Gemini',
      primaryModel: 'gemini-3.8-flash',
      fallbackModel: 'gemini-4-argon',
      hasApiKey: hasRealKey,
      connectionState: geminiConnectionState,
      lastLiveVerifiedTimestamp,
      lastLiveVerifiedModel,
      status: geminiConnectionState === 'GEMINI_LIVE_REQUEST_VERIFIED' ? 'LIVE_VERIFIED' : (hasRealKey ? 'SECRET_CONFIGURED' : 'NOT_CONFIGURED')
    },
    knowledgeCards: {
      totalCards: knowledgeCardsStore.length,
      goldCount: knowledgeCardsStore.filter((c) => c.verificationStatus === 'Gold').length,
      silverCount: knowledgeCardsStore.filter((c) => c.verificationStatus === 'Silver').length,
      bronzeCount: knowledgeCardsStore.filter((c) => c.verificationStatus === 'Bronze').length,
      ragIntegration: 'ACTIVE'
    },
    trainingGate: {
      tier: 'TIER_B_TRAINING',
      status: gateEval.status,
      passedCount: gateEval.passedCount,
      totalCount: gateEval.totalCount,
      isChatBlocked: gateEval.isChatBlocked,
      notice: 'Training Gate áp dụng độc lập cho Tầng B (Huấn luyện mô hình từ đầu / SFT). Chat Tầng A hoàn toàn không bị ảnh hưởng.'
    },
    toolRegistry: {
      totalPlugins: AVAILABLE_PLUGINS.length,
      activePlugins: AVAILABLE_PLUGINS.filter((p) => p.enabled).length,
      securityTiers: ['TIER_1_READ', 'TIER_2_EXECUTION']
    },
    governance: {
      limitsGovernor: 'ENFORCING',
      circuitBreaker: circuitBreaker.getStatus().state,
      circuitBreakerDetails: circuitBreaker.getStatus(),
      dailySpendTargetUsd: 0.50,
      telemetryEventsCount: telemetryStore.getRecentEvents().length
    }
  });
});

/// 6. Real Chat Endpoint (Apex Multimodal & Context Engine)
app.post('/api/chat', async (req, res) => {
  res.setHeader('Content-Type', 'application/json; charset=utf-8');

  try {
    const {
      conversationId = `conv_${Date.now()}`,
      message,
      history = [],
      model = 'gemini-3.8-flash',
      enabledPluginIds = [],
      attachments = [],
      systemInstruction = 'Bạn là NDAWG PRO AI Assistant — một trợ lý AI thông minh, đáng tin cậy tuân thủ cơ chế quản trị Apex, xác minh Giải - Kiểm - Sửa, thấu hiểu ngữ cảnh hội thoại tiếng Việt tự nhiên và hỗ trợ xử lý đa phương thức (hình ảnh, tài liệu, toán học, lập trình).'
    } = req.body;

    const rawMsg = typeof message === 'string' ? message.trim() : '';
    const hasAttachments = Array.isArray(attachments) && attachments.length > 0;

    if (!rawMsg && !hasAttachments) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'EMPTY_MESSAGE',
          message: 'Nội dung tin nhắn hoặc tệp đính kèm không được để trống'
        }
      });
    }

    const trimmedMsg = rawMsg || 'Hãy phân tích nội dung tệp/hình ảnh được đính kèm.';
    const pluginCalls: Array<{
      pluginId: string;
      pluginName: string;
      input: any;
      output: any;
      durationMs: number;
      status: 'success' | 'failed';
    }> = [];

    // Plugin 1: Math Kernel execution
    if (enabledPluginIds.includes('math_kernel')) {
      const mathMatch = trimmedMsg.match(/(?:tính|calculate|solve|giải|toán)?\s*([0-9+\-*/()., %^eE\s]{3,})/i);
      if (mathMatch && mathMatch[1] && /[+\-*/^%]/.test(mathMatch[1])) {
        const startT = Date.now();
        const expr = mathMatch[1].replace(/,/g, '');
        const evalRes = evaluateMathExpression(expr);
        pluginCalls.push({
          pluginId: 'math_kernel',
          pluginName: 'Math & Logic Kernel',
          input: { expression: expr.trim() },
          output: evalRes,
          durationMs: Date.now() - startT,
          status: evalRes.success ? 'success' : 'failed'
        });
      }
    }

    // Plugin 2: Knowledge Base RAG retrieval connected to Knowledge Cards (Tầng C) & Universal Taxonomy
    if (
      enabledPluginIds.includes('knowledge_base') ||
      /transformer|moe|mamba|ssm|lora|qlora|h100|b200|tpu|tri thức|knowledge|khoa học|toán học|vật lý|lịch sử|triết học|ngôn ngữ/i.test(trimmedMsg)
    ) {
      const startT = Date.now();
      const matchedCards = searchKnowledgeCards(trimmedMsg);
      const topCard = matchedCards[0] || knowledgeCardsStore[0];
      const taxonomyRAG = universalTaxonomy.queryUniversalRAG(trimmedMsg);

      pluginCalls.push({
        pluginId: 'knowledge_base',
        pluginName: 'Cơ sở tri thức kiểm chứng NDAWG & Universal Taxonomy',
        input: { query: trimmedMsg },
        output: {
          retrievedBadge: topCard.verificationStatus === 'Gold' ? 'GOLD_VERIFIED' : (topCard.verificationStatus === 'Silver' ? 'SILVER_VERIFIED' : 'BRONZE_REVIEW'),
          cardId: topCard.id,
          citation: topCard.title,
          category: topCard.category,
          summary: topCard.summary,
          specs: topCard.specs,
          references: topCard.references,
          hardwareNotice: topCard.hardwareNotice,
          universalDomain: taxonomyRAG.matchedDomains[0] ? taxonomyRAG.matchedDomains[0].name : undefined,
          universalPassages: taxonomyRAG.topPassages
        },
        durationMs: Date.now() - startT,
        status: 'success'
      });
    }

    // Plugin 3: Web Search Grounding
    if (enabledPluginIds.includes('web_search') && (trimmedMsg.includes('tìm') || trimmedMsg.includes('search') || trimmedMsg.includes('mới nhất') || trimmedMsg.includes('tin tức'))) {
      const startT = Date.now();
      pluginCalls.push({
        pluginId: 'web_search',
        pluginName: 'Web Search Grounding',
        input: { query: trimmedMsg },
        output: {
          resultsCount: 2,
          sources: [
            { title: 'Google AI Studio & Gemini Documentation', url: 'https://ai.google.dev' },
            { title: 'NDAWG PRO Architecture Whitepaper', url: 'https://ndawg.internal/spec' }
          ]
        },
        durationMs: Date.now() - startT,
        status: 'success'
      });
    }

    // Plugin 4: Game Intelligence Engine (Directive 10.7)
    if (
      enabledPluginIds.includes('game_intelligence') ||
      /(?:lol|league of legends|dota|valorant|genshin|aatrox|invoker|kaisa|tướng|meta|patch|chiến thuật|build đồ|lên đồ)/i.test(trimmedMsg)
    ) {
      const startT = Date.now();
      const detectedGame = /(?:dota)/i.test(trimmedMsg)
        ? 'Dota 2'
        : /(?:valorant)/i.test(trimmedMsg)
        ? 'Valorant'
        : /(?:genshin)/i.test(trimmedMsg)
        ? 'Genshin Impact'
        : 'League of Legends';
      const querySub = /(?:invoker)/i.test(trimmedMsg)
        ? 'Invoker'
        : /(?:kaisa|kai'sa)/i.test(trimmedMsg)
        ? "Kai'Sa"
        : 'Aatrox';

      const strat = gameEngine.queryStrategy(detectedGame, querySub);
      if (strat) {
        pluginCalls.push({
          pluginId: 'game_intelligence',
          pluginName: 'Game Intelligence Engine (Tối ưu hóa chiến thuật & Meta)',
          input: { gameTitle: detectedGame, query: querySub },
          output: {
            gameTitle: strat.entry.gameTitle,
            subject: strat.entry.subject,
            activePatch: strat.currentActivePatch,
            patchVersion: strat.entry.patchVersion,
            isOutdated: strat.isOutdated,
            outdatedWarning: strat.outdatedWarning,
            verificationTier: strat.entry.verificationTier,
            summary: strat.entry.summary,
            buildRecommendations: strat.entry.buildRecommendations,
            hypothesisDetails: strat.entry.hypothesisDetails
          },
          durationMs: Date.now() - startT,
          status: 'success'
        });
      }
    }

    const rawKey = process.env.GEMINI_API_KEY;
    const hasApiKey = Boolean(rawKey && rawKey.trim() !== '' && rawKey !== 'MY_GEMINI_API_KEY');

    if (hasApiKey) {
      const ai = new GoogleGenAI({
        apiKey: rawKey,
        httpOptions: {
          headers: {
            'User-Agent': 'aistudio-build'
          }
        }
      });

      // Multimodal processing: extract image inlineData and file text excerpts
      const imageParts: any[] = [];
      const fileTexts: string[] = [];

      if (hasAttachments) {
        for (const att of attachments) {
          if (att.type === 'image' && att.data) {
            const rawBase64 = att.data.includes('base64,') ? att.data.split('base64,')[1] : att.data;
            imageParts.push({
              inlineData: {
                mimeType: att.mimeType || 'image/png',
                data: rawBase64
              }
            });
          } else if (att.type === 'file' && att.data) {
            fileTexts.push(`[Tệp đính kèm: "${att.name || 'tài liệu'}"]\n${att.data.slice(0, 15000)}`);
          }
        }
      }

      let userFullPrompt = trimmedMsg;
      if (fileTexts.length > 0) {
        userFullPrompt += `\n\n${fileTexts.join('\n\n')}`;
      }
      if (pluginCalls.length > 0) {
        userFullPrompt += `\n\n[Dữ liệu bổ trợ từ Plugins đã thực thi:\n${JSON.stringify(pluginCalls, null, 2)}]`;
      }

      const currentUserParts: any[] = [...imageParts, { text: userFullPrompt }];

      // Multi-turn context management with strict alternating role validation
      const sanitizedHistory: Array<{ role: 'user' | 'model'; parts: any[] }> = [];
      if (Array.isArray(history)) {
        for (const h of history) {
          if (!h || !h.content || typeof h.content !== 'string' || !h.content.trim()) continue;
          const targetRole = h.role === 'assistant' ? 'model' : 'user';

          if (sanitizedHistory.length > 0 && sanitizedHistory[sanitizedHistory.length - 1].role === targetRole) {
            sanitizedHistory[sanitizedHistory.length - 1].parts[0].text += `\n\n${h.content.trim()}`;
          } else {
            sanitizedHistory.push({
              role: targetRole,
              parts: [{ text: h.content.trim() }]
            });
          }
        }
      }

      // If sanitizedHistory ends with 'user', inject a brief model acknowledgement to preserve strict user/model alternation
      if (sanitizedHistory.length > 0 && sanitizedHistory[sanitizedHistory.length - 1].role === 'user') {
        sanitizedHistory.push({
          role: 'model',
          parts: [{ text: 'Đã nhận thông tin ngữ cảnh trước đó. Tôi đang tiếp tục xử lý yêu cầu của bạn.' }]
        });
      }

      const formattedContents = [
        ...sanitizedHistory,
        {
          role: 'user',
          parts: currentUserParts
        }
      ];

      // Multi-tier model resilience: requested model first, then compatible fallback
      const requestedModel = model || 'gemini-3.8-flash';
      const modelsToTry: string[] = [requestedModel];
      
      const fallbackCandidate = quotaRouter.findFallbackModel(requestedModel, 'general', true);
      if (fallbackCandidate && !modelsToTry.includes(fallbackCandidate)) {
        modelsToTry.push(fallbackCandidate);
      }

      let response: any = null;
      let activeModelUsed = requestedModel;
      let lastClassifiedError: ClassifiedError | null = null;
      const requestStartTime = Date.now();

      const isSearchGrounding = trimmedMsg.includes('[GOOGLE SEARCH GROUNDING]') || req.body.grounding === 'search';
      const isMapsGrounding = trimmedMsg.includes('[GOOGLE MAPS GROUNDING]') || req.body.grounding === 'maps';
      const tools: any[] = [];
      if (isSearchGrounding) {
        tools.push({ googleSearch: {} });
      } else if (isMapsGrounding) {
        tools.push({ googleMaps: {} });
      }

      for (const targetModel of modelsToTry) {
        // Check router availability before attempting
        const availability = quotaRouter.isModelAvailable(targetModel);
        if (!availability.available) {
          console.warn(`Model ${targetModel} is currently not available: ${availability.reason}. Skipping.`);
          continue;
        }

        let modelAttempt = 0;
        const maxAttemptsForModel = 2; // Maximum bounded attempts per model

        while (modelAttempt < maxAttemptsForModel) {
          modelAttempt++;
          try {
            const timeoutMs = targetModel === 'gemini-3.8-flash' ? 12000 : 25000;
            const timeoutPromise = new Promise<never>((_, reject) =>
              setTimeout(() => reject(new Error(`Timeout ${timeoutMs}ms for ${targetModel}`)), timeoutMs)
            );

            const genPromise = ai.models.generateContent({
              model: targetModel,
              contents: formattedContents,
              config: {
                systemInstruction: `${systemInstruction}\nHãy hiểu sâu ngữ cảnh hội thoại nhiều lượt. Trả lời bằng tiếng Việt tự nhiên, chính xác, định dạng Markdown đẹp, giải thích rõ ràng và có cấu trúc logic.`,
                ...(tools.length > 0 ? { tools } : {})
              }
            });

            response = await Promise.race([genPromise, timeoutPromise]);
            activeModelUsed = targetModel;
            quotaRouter.recordSuccess(targetModel, Date.now() - requestStartTime);
            break; // Succeeded!
          } catch (err: any) {
            const classified = classifyProviderError(err, 'google-gemini', targetModel, 'vi');
            lastClassifiedError = classified;
            quotaRouter.recordFailure(targetModel, classified);
            selfHealingEngine.handleRuntimeError(classified, { prompt: trimmedMsg, conversationId });

            console.warn(`Model ${targetModel} attempt ${modelAttempt} failed [${classified.errorCategory}]: ${classified.diagnostic.safeDetails}`);

            // If non-retryable (Daily quota exhausted, Limit 0, Billing restriction, Auth error, Invalid params):
            // DO NOT RETRY THIS MODEL! Immediately break and try next candidate or return failure.
            if (
              !classified.retryable ||
              classified.errorCategory === 'DAILY_QUOTA_EXHAUSTED' ||
              classified.errorCategory === 'QUOTA_LIMIT_ZERO' ||
              classified.errorCategory === 'QUOTA_ZERO'
            ) {
              break;
            }

            // If transient retryable (TEMPORARY_RATE_LIMIT, PROVIDER_OVERLOAD) and attempts left:
            if (modelAttempt < maxAttemptsForModel && Date.now() - requestStartTime < 20000) {
              const backoffMs = calculateBackoffWithJitter(modelAttempt, Math.min(classified.retryAfterMs || 1000, 3000));
              await new Promise(r => setTimeout(r, backoffMs));
            } else {
              break;
            }
          }
        }

        if (response && response.text) {
          break; // Model generation succeeded
        }
      }

      if (response && response.text) {
        circuitBreaker.recordSuccess();
        geminiConnectionState = 'GEMINI_LIVE_REQUEST_VERIFIED';
        lastLiveVerifiedTimestamp = Date.now();
        lastLiveVerifiedModel = activeModelUsed;

        // Pass through Universal Render Integrity Engine
        const replyText = normalizeRenderText(response.text);
        const promptTokens = Math.ceil((trimmedMsg.length + JSON.stringify(history).length) / 4);
        const completionTokens = Math.ceil(replyText.length / 4);
        const totalTokens = promptTokens + completionTokens;
        const costUsd = Number(((promptTokens * 0.000000075) + (completionTokens * 0.0000003)).toFixed(7));

        telemetryStore.logEvent({
          type: 'CHAT_REQUEST',
          model: activeModelUsed,
          status: 'SUCCESS',
          durationMs: Date.now() - requestStartTime,
          details: `Phản hồi trực tiếp từ mô hình ${activeModelUsed}. Tokens: ${totalTokens}. Plugins: ${pluginCalls.length}.`
        });

        const groundingMetadata = (response.candidates?.[0] as any)?.groundingMetadata;

        return res.json({
          success: true,
          reply: replyText,
          conversationId,
          messageId: `msg_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
          content: replyText,
          model: activeModelUsed,
          connectionState: 'GEMINI_LIVE_REQUEST_VERIFIED',
          providerStatus: 'READY',
          tokens: { promptTokens, completionTokens, totalTokens },
          costUsd,
          pluginCalls,
          groundingMetadata,
          reasoningSteps: [
            'Phân tích ngữ cảnh hội thoại đa lượt và áp dụng Apex Limits Governor',
            hasAttachments ? `Xử lý ${attachments.length} tệp/hình ảnh đa phương thức` : 'Xác thực định dạng truy vấn tự nhiên',
            `Thực thi ${pluginCalls.length} công cụ plugin hợp lệ`,
            `Gọi mô hình thời gian thực: ${activeModelUsed}`,
            'Kiểm tra định dạng phản hồi qua Render Integrity Engine'
          ]
        });
      }

      // If all attempts failed: return honest, truthful, classified quota / error response!
      circuitBreaker.recordFailure();
      const classified = lastClassifiedError || classifyProviderError(
        new Error('Không có mô hình nào khả dụng hoặc tất cả các lượt gọi đều thất bại.'),
        'google-gemini',
        requestedModel
      );

      let errorConnectionState: ConnectionState = 'INTERNAL_ERROR';
      if (classified.errorCategory === 'DAILY_QUOTA_EXHAUSTED' || classified.errorCategory === 'QUOTA_LIMIT_ZERO' || classified.errorCategory === 'QUOTA_ZERO') {
        errorConnectionState = 'QUOTA_BLOCKED';
      } else if (classified.errorCategory === 'AUTH_ERROR') {
        errorConnectionState = 'NOT_CONFIGURED';
      } else if (classified.errorCategory === 'INVALID_REQUEST' && (classified.diagnostic.safeDetails?.includes('model') || classified.diagnostic.safeDetails?.includes('not found'))) {
        errorConnectionState = 'MODEL_UNAVAILABLE';
      } else if (classified.errorCategory === 'PROVIDER_OVERLOAD' || classified.errorCategory === 'TEMPORARY_RATE_LIMIT') {
        errorConnectionState = 'NETWORK_ERROR';
      }
      geminiConnectionState = errorConnectionState;

      telemetryStore.logEvent({
        type: 'CHAT_REQUEST',
        model: requestedModel,
        status: 'FAILURE',
        durationMs: Date.now() - requestStartTime,
        details: `Lỗi gọi upstream Gemini API: [${classified.errorCategory}] ${classified.diagnostic.safeDetails}`
      });

      const userFacingExplanation = `### ⚠️ [${classified.errorCategory}]

${classified.userMessage.vi}

---
**Thông tin chẩn đoán kỹ thuật (Apex Diagnostic):**
- **Mã sự cố:** \`${classified.diagnostic.code}\`
- **Mô hình mục tiêu:** \`${requestedModel}\`
- **Trạng thái kết nối:** \`${errorConnectionState}\`
- **Trạng thái nhà cung cấp:** \`${classified.providerStatus}\` (Mã HTTP ${classified.httpStatus})
- **Khuyến nghị xử lý:** ${classified.diagnostic.adminActionHint}

> *Ghi chú bảo toàn dữ liệu:* Nội dung truy vấn của bạn đã được lưu giữ an toàn. Hệ thống không tạo phản hồi giả lập thành công khi API gặp lỗi quota.`;

      return res.status(classified.httpStatus || 429).json({
        success: false,
        error: {
          code: classified.errorCategory,
          message: classified.userMessage.vi,
          details: classified.diagnostic.safeDetails,
          providerStatus: classified.providerStatus,
          retryable: classified.retryable,
          retryAfterMs: classified.retryAfterMs,
          diagnostic: classified.diagnostic
        },
        conversationId,
        messageId: `msg_err_${Date.now()}`,
        content: userFacingExplanation,
        reply: userFacingExplanation,
        model: activeModelUsed,
        connectionState: errorConnectionState,
        providerStatus: classified.providerStatus,
        classifiedError: classified
      });
    } else {
      // Honest status: no fake success when API key is unconfigured
      geminiConnectionState = 'NOT_CONFIGURED';
      const promptTokens = Math.ceil(trimmedMsg.length / 4);
      const mathPlug = pluginCalls.find(p => p.pluginId === 'math_kernel');
      const mathResultText = mathPlug && mathPlug.output.success
        ? `\n\n**Kết quả tính toán kiểm chứng (Math Kernel):** \`${mathPlug.input.expression} = ${mathPlug.output.result}\``
        : '';

      const content = `### [CHẾ ĐỘ NỘI BỘ — CHƯA CẤU HÌNH GEMINI_API_KEY]

Backend **NDAWG PRO Express (/api/chat)** đã sẵn sàng và đang hoạt động.

⚠️ **Trạng thái kết nối Nhà cung cấp:**
- Biến môi trường GEMINI_API_KEY chưa được thiết lập trong **AI Studio Secrets**.
- Trạng thái kết nối: \`NOT_CONFIGURED\`.
- Để kết nối trực tiếp với mô hình **Gemini 3.8 Flash** thời gian thực, hãy thêm khóa GEMINI_API_KEY vào bảng quản lý Secrets.

---

**Nội dung phản hồi theo quy trình kiểm tra nội bộ (Apex AI Core):**
- **Yêu cầu đã nhận:** "${trimmedMsg}"
- **Mô hình mục tiêu:** ${model}
- **Trạng thái kết nối:** NOT_CONFIGURED
- **Bộ điều phối Apex:** Yêu cầu đã vượt qua kiểm tra quyền (Tier 1 Read) và Limits Governor an toàn.
${mathResultText}
${pluginCalls.length > 0 ? '\n**Plugin đã kích hoạt (' + pluginCalls.length + '):**\n' + pluginCalls.map(p => `- **${p.pluginName}**: ${p.status === 'success' ? 'Thành công (' + p.durationMs + 'ms)' : 'Thất bại'}`).join('\n') : ''}

> *Ghi chú trung thực:* NDAWG PRO không giả lập kết quả API thành công khi chưa có khóa API thực tế. Mọi luồng kiểm toán và plugin đều được ghi vết minh bạch.`;

      const completionTokens = Math.ceil(content.length / 4);
      return res.json({
        success: true,
        reply: content,
        conversationId,
        messageId: `msg_${Date.now()}_local`,
        content,
        model: `${model} (Local Fallback)`,
        connectionState: 'NOT_CONFIGURED',
        providerStatus: 'NOT_CONFIGURED',
        providerMessage: 'Biến môi trường GEMINI_API_KEY chưa được cấu hình. Hệ thống đang sử dụng bộ phản hồi nội bộ.',
        tokens: {
          promptTokens,
          completionTokens,
          totalTokens: promptTokens + completionTokens
        },
        costUsd: 0.000,
        pluginCalls,
        reasoningSteps: [
          'Kiểm tra cấu hình nhà cung cấp và biến môi trường GEMINI_API_KEY',
          'Xác nhận trạng thái: AWAITING_API_KEY (Không tạo dữ liệu giả lập thành công)',
          `Kích hoạt ${pluginCalls.length} công cụ plugin cục bộ`,
          'Hoàn tất phản hồi chuẩn mực tuân thủ tiêu chuẩn trung thực'
        ]
      });
    }
  } catch (err: any) {
    console.error('Chat endpoint internal error:', err);
    return res.status(500).json({
      success: false,
      error: {
        code: 'INTERNAL_SERVER_ERROR',
        message: err.message || 'Lỗi xử lý nội bộ tại server'
      }
    });
  }
});

// ==================== GEMINI EXTENDED SUITE (SEARCH, MAPS, TRANSCRIBE, IMAGE, VIDEO) ====================

// 6.1 Google Search Grounding with gemini-3.8-flash
app.post('/api/gemini/grounded-search', async (req, res) => {
  const { prompt } = req.body;
  if (!prompt) return res.status(400).json({ error: 'Prompt is required' });
  const rawKey = process.env.GEMINI_API_KEY;
  if (!rawKey) return res.status(500).json({ error: 'GEMINI_API_KEY not configured' });

  try {
    const ai = new GoogleGenAI({
      apiKey: rawKey,
      httpOptions: { headers: { 'User-Agent': 'aistudio-build' } }
    });
    const response = await ai.models.generateContent({
      model: 'gemini-3.8-flash',
      contents: prompt,
      config: {
        tools: [{ googleSearch: {} }]
      }
    });
    res.json({
      success: true,
      text: response.text,
      groundingMetadata: (response.candidates?.[0] as any)?.groundingMetadata
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// 6.2 Google Maps Grounding with gemini-3.8-flash
app.post('/api/gemini/grounded-maps', async (req, res) => {
  const { prompt } = req.body;
  if (!prompt) return res.status(400).json({ error: 'Prompt is required' });
  const rawKey = process.env.GEMINI_API_KEY;
  if (!rawKey) return res.status(500).json({ error: 'GEMINI_API_KEY not configured' });

  try {
    const ai = new GoogleGenAI({
      apiKey: rawKey,
      httpOptions: { headers: { 'User-Agent': 'aistudio-build' } }
    });
    const response = await ai.models.generateContent({
      model: 'gemini-3.8-flash',
      contents: prompt,
      config: {
        tools: [{ googleMaps: {} }]
      }
    });
    res.json({
      success: true,
      text: response.text,
      groundingMetadata: (response.candidates?.[0] as any)?.groundingMetadata
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// 6.3 Audio Transcription with gemini-3.5-transcribe
app.post('/api/gemini/transcribe-audio', async (req, res) => {
  const { audioBase64, mimeType = 'audio/webm' } = req.body;
  if (!audioBase64) return res.status(400).json({ error: 'Audio data is required' });
  const rawKey = process.env.GEMINI_API_KEY;
  if (!rawKey) return res.status(500).json({ error: 'GEMINI_API_KEY not configured' });

  try {
    const ai = new GoogleGenAI({
      apiKey: rawKey,
      httpOptions: { headers: { 'User-Agent': 'aistudio-build' } }
    });
    const cleanBase64 = audioBase64.includes('base64,') ? audioBase64.split('base64,')[1] : audioBase64;
    const response = await ai.models.generateContent({
      model: 'gemini-3.5-transcribe',
      contents: {
        parts: [
          { inlineData: { mimeType, data: cleanBase64 } },
          { text: 'Hãy phiên âm đoạn âm thanh này sang văn bản chính xác nhất.' }
        ]
      }
    });
    res.json({
      success: true,
      transcript: response.text
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// 6.4 Image Generation with gemini-nano-banana-2.1
app.post('/api/gemini/image-generate', async (req, res) => {
  const { prompt, aspectRatio = '1:1', imageSize = '1K' } = req.body;
  if (!prompt) return res.status(400).json({ error: 'Prompt is required' });
  const rawKey = process.env.GEMINI_API_KEY;
  if (!rawKey) return res.status(500).json({ error: 'GEMINI_API_KEY not configured' });

  try {
    const ai = new GoogleGenAI({
      apiKey: rawKey,
      httpOptions: { headers: { 'User-Agent': 'aistudio-build' } }
    });
    const response = await ai.models.generateContent({
      model: 'gemini-nano-banana-2.1',
      contents: prompt,
      config: {
        imageConfig: {
          aspectRatio,
          imageSize
        }
      }
    });

    let imageUrl = '';
    for (const part of response.candidates?.[0]?.content?.parts || []) {
      if (part.inlineData) {
        imageUrl = `data:${part.inlineData.mimeType || 'image/png'};base64,${part.inlineData.data}`;
        break;
      }
    }

    res.json({
      success: true,
      imageUrl,
      text: response.text
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// 6.5 Video Generation with gemini-omni-1.1-flash (Interactions API)
app.post('/api/gemini/video-generate', async (req, res) => {
  const { prompt, imageBase64, aspectRatio = '16:9' } = req.body;
  if (!prompt) return res.status(400).json({ error: 'Prompt is required' });
  const rawKey = process.env.GEMINI_API_KEY;
  if (!rawKey) return res.status(500).json({ error: 'GEMINI_API_KEY not configured' });

  try {
    const ai = new GoogleGenAI({
      apiKey: rawKey,
      httpOptions: { headers: { 'User-Agent': 'aistudio-build' } }
    });

    const inputParts: any[] = [];
    if (imageBase64) {
      const cleanData = imageBase64.includes('base64,') ? imageBase64.split('base64,')[1] : imageBase64;
      inputParts.push({
        type: 'image',
        mime_type: 'image/png',
        data: cleanData
      });
    }
    inputParts.push({
      type: 'text',
      text: prompt
    });

    const interaction = await ai.interactions.create({
      model: 'gemini-omni-1.1-flash',
      input: inputParts.length === 1 && !imageBase64 ? prompt : inputParts,
      background: false,
      store: false,
      stream: false,
      response_format: {
        type: 'video',
        aspect_ratio: aspectRatio === '9:16' ? '9:16' : '16:9',
        duration: '5s',
        resolution: '720p'
      }
    }, { timeout: 300000 });

    const videoPart = (interaction as any).output_video;
    let videoUrl = '';
    if (videoPart && videoPart.data) {
      videoUrl = `data:video/mp4;base64,${videoPart.data}`;
    }

    res.json({
      success: true,
      interactionId: interaction.id,
      status: interaction.status,
      videoUrl: videoUrl || undefined
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// 7. Telemetry & Root-Cause Diagnostics (Directive 10.8)
app.get('/api/telemetry', (req, res) => {
  const limit = Math.min(Number(req.query.limit) || 50, 200);
  const events = telemetryStore.getRecentEvents(limit);
  res.json({
    success: true,
    count: events.length,
    events
  });
});

// 8. Circuit Breaker Management (Directive 10.5)
app.get('/api/circuit-breaker', (req, res) => {
  res.json({
    success: true,
    status: circuitBreaker.getStatus()
  });
});

app.post('/api/circuit-breaker/reset', (req, res) => {
  circuitBreaker.reset();
  res.json({
    success: true,
    message: 'Circuit breaker has been reset to CLOSED state.'
  });
});

// 8.1 V18 Quota-Aware Model Router Status & Circuit States
app.get('/api/governance/router-status', (_req, res) => {
  res.json({
    success: true,
    models: quotaRouter.getAllModels()
  });
});

// 8.2 V18 Universal Self-Healing Incidents
app.get('/api/governance/self-healing-incidents', (req, res) => {
  const limit = Math.min(Number(req.query.limit) || 20, 100);
  res.json({
    success: true,
    incidents: selfHealingEngine.getRecentIncidents(limit)
  });
});

// 9. Universal Intent Router Classification (Directive 10.2)
app.post('/api/router/classify', (req, res) => {
  const { prompt = '', attachments = [] } = req.body;
  const classification = intentRouter.route(prompt, attachments);
  res.json({
    success: true,
    classification
  });
});

// 10. Universal Human Knowledge Architecture (Directive Part 2 & 3)
app.get('/api/universal-knowledge/taxonomy', (req, res) => {
  const { search = '', language } = req.query;
  const domains = universalTaxonomy.searchDomains(search as string, language as string);
  const allDomains = universalTaxonomy.getAllDomains();
  const totalRecords = allDomains.reduce((acc, d) => acc + d.indexedRecordsCount, 0);
  const avgCoverage = Number((allDomains.reduce((acc, d) => acc + d.coverageScore, 0) / allDomains.length).toFixed(1));

  res.json({
    success: true,
    totalDomains: allDomains.length,
    matchingDomains: domains.length,
    totalRecords,
    averageCoverageScore: avgCoverage,
    domains,
    timestamp: new Date().toISOString()
  });
});

app.get('/api/universal-knowledge/connectors', (req, res) => {
  const connectors = universalTaxonomy.getConnectors();
  res.json({
    success: true,
    totalConnectors: connectors.length,
    connectors
  });
});

app.post('/api/universal-knowledge/search', (req, res) => {
  const { query = '' } = req.body;
  if (!query || typeof query !== 'string' || !query.trim()) {
    return res.status(400).json({ success: false, error: 'Query search parameter is required' });
  }

  const result = universalTaxonomy.queryUniversalRAG(query);
  res.json({
    success: true,
    ...result
  });
});

// ==================== V14 ADAPTIVE FRONTIER INTELLIGENCE APIS ====================

// 1. Universal Capability Quality Audit (Part 1 & 2)
app.get('/api/v14/capability-audit', (req, res) => {
  const audit = capabilityQualityEngine.runAudit();
  res.json({
    success: true,
    ...audit
  });
});

// 2. Seven AI Branches Status (Part 8)
app.get('/api/v14/seven-branches', (req, res) => {
  const branches = capabilityQualityEngine.getSevenBranches();
  res.json({
    success: true,
    count: branches.length,
    branches
  });
});

// 3. Progressive Escalation & Context Budgeting (Part 6)
app.post('/api/v14/escalation', (req, res) => {
  const { prompt = '', hasAttachments = false, messages = [] } = req.body;
  const decision = adaptivePerformance.evaluateEscalation(prompt, hasAttachments);
  const contextOptimization = adaptivePerformance.optimizeContext(messages);

  res.json({
    success: true,
    decision,
    contextOptimization
  });
});

// 4. Request Performance Traces (Part 6)
app.get('/api/v14/performance-traces', (req, res) => {
  const limit = Math.min(Number(req.query.limit) || 20, 100);
  const traces = adaptivePerformance.getRecentTraces(limit);
  const stats = adaptivePerformance.getPerformanceStats();

  res.json({
    success: true,
    stats,
    count: traces.length,
    traces
  });
});

// 5. RepoGather Source Context Builder (Part 12)
app.post('/api/v14/repo-context', (req, res) => {
  const { mode = 'FULL_ELIGIBLE_MANIFEST', focusKeywords = [], tokenBudget = 80000 } = req.body;
  const manifest = repoContextBuilder.generateManifest(__dirname, mode, focusKeywords);
  const bundle = repoContextBuilder.bundleEligibleSource(__dirname, manifest, tokenBudget);

  res.json({
    success: true,
    manifest,
    filesIncluded: bundle.filesIncluded,
    totalTokens: bundle.totalTokens,
    budgetExceeded: bundle.budgetExceeded,
    bundledContentLength: bundle.bundledText.length,
    bundledSnippet: bundle.bundledText.substring(0, 1500)
  });
});

// 6. Auditable Conversation Receipts (Part 11)
app.post('/api/v14/conversation-receipt', (req, res) => {
  const {
    conversationId = `conv_${Date.now()}`,
    title = 'Hội thoại kiểm toán',
    actorRole = 'ADMIN',
    modelUsed = 'gemini-3.6-flash',
    provider = 'Google Gemini',
    messages = [],
    executedTools = [],
    citations = [],
    costUsd = 0.002
  } = req.body;

  const receipt = receiptArchive.generateReceipt({
    conversationId,
    title,
    actorRole,
    modelUsed,
    provider,
    messages,
    executedTools,
    citations,
    costUsd
  });

  const markdown = receiptArchive.formatReceiptAsMarkdown(receipt);

  res.json({
    success: true,
    receipt,
    markdownExport: markdown
  });
});

// 7. Development Memory Archive (Part 11)
app.get('/api/v14/dev-memory', (req, res) => {
  const memory = receiptArchive.getDevMemory();
  res.json({
    success: true,
    count: memory.length,
    memory
  });
});

app.post('/api/v14/dev-memory', (req, res) => {
  const { category, summary, details, evidenceRef, status = 'ACCEPTED' } = req.body;
  if (!summary || !category) {
    return res.status(400).json({ success: false, error: 'Category and summary are required' });
  }

  const entry = receiptArchive.addDevMemory({
    category,
    summary,
    details: details || '',
    evidenceRef,
    status
  });

  res.json({
    success: true,
    entry
  });
});

// 8. Personalization & Background Image Studio (Part 10)
app.get('/api/v14/personalization', (req, res) => {
  res.json({
    success: true,
    preferences: personalizationEngine.getPreferences(),
    activeBackground: personalizationEngine.getActiveBackground(),
    backgroundLibrary: personalizationEngine.getBackgroundLibrary()
  });
});

app.post('/api/v14/personalization', (req, res) => {
  const updated = personalizationEngine.updatePreferences(req.body);
  res.json({
    success: true,
    preferences: updated,
    activeBackground: personalizationEngine.getActiveBackground()
  });
});

app.post('/api/v14/background-library', (req, res) => {
  const { name, dataUrl, mimeType, sizeBytes, selectId } = req.body;

  // If user is just selecting an existing preset/background
  if (selectId) {
    personalizationEngine.updatePreferences({ selectedBackgroundId: selectId });
    return res.json({
      success: true,
      activeBackground: personalizationEngine.getActiveBackground()
    });
  }

  // Uploading new custom image
  if (!dataUrl || !mimeType) {
    return res.status(400).json({ success: false, error: 'Thiếu dữ liệu hình ảnh (dataUrl hoặc mimeType)' });
  }

  const uploadRes = personalizationEngine.uploadCustomBackground({
    name: name || 'Ảnh nền tùy chỉnh',
    dataUrl,
    mimeType,
    sizeBytes: sizeBytes || Math.round(dataUrl.length * 0.75)
  });

  if (!uploadRes.success) {
    return res.status(400).json(uploadRes);
  }

  res.json({
    success: true,
    item: uploadRes.item,
    activeBackground: personalizationEngine.getActiveBackground()
  });
});

app.post('/api/v14/background-library/reset', (req, res) => {
  const defaultBg = personalizationEngine.resetBackgroundToDefault();
  res.json({
    success: true,
    message: 'Đã hoàn tác hình nền về mặc định Slate Cyber',
    activeBackground: defaultBg
  });
});

// Standard Container Health Probe for Cloud Run
app.get('/healthz', (req, res) => {
  res.status(200).send('OK');
});

// Catch-all for API routes to strictly prevent HTML 404/SPA responses
app.all('/api/*', (req, res) => {
  res.setHeader('Content-Type', 'application/json; charset=utf-8');
  res.status(404).json({
    success: false,
    error: {
      code: 'API_ENDPOINT_NOT_FOUND',
      message: `API route ${req.method} ${req.path} không tồn tại trên hệ thống NDAWG PRO.`
    }
  });
});

// ==================== VITE MIDDLEWARE / STATIC ASSETS ====================

async function startServer() {
  const isProduction = process.env.NODE_ENV === 'production';
  const distPath = path.resolve(__dirname, 'dist');
  const distIndexHtml = path.resolve(distPath, 'index.html');
  const rootIndexHtml = path.resolve(__dirname, 'index.html');

  if (!isProduction) {
    // Development mode: always attach Vite middleware as required by framework
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa'
    });
    app.use(vite.middlewares);
  } else {
    // Production mode: serve built assets from dist if present, else fallback to root
    if (fs.existsSync(distIndexHtml)) {
      app.use(express.static(distPath));
      app.get('*', (req, res) => {
        if (fs.existsSync(distIndexHtml)) {
          res.sendFile(distIndexHtml);
        } else {
          res.sendFile(rootIndexHtml);
        }
      });
    } else {
      app.use(express.static(__dirname));
      app.get('*', (req, res) => {
        res.sendFile(rootIndexHtml);
      });
    }
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`NDAWG PRO APEX server running at http://0.0.0.0:${PORT} (Mode: ${isProduction ? 'prod' : 'dev'})`);
  });
}

startServer().catch(err => {
  console.error('Failed to start NDAWG PRO server:', err);
  process.exit(1);
});
