/**
 * NDAWG PRO — PART 8/8 (FINAL V2)
 * Knowledge Cards (Tier C) & Training Gate (Tier B) Verification View
 *
 * Fully repaired and upgraded:
 * 1. Training Gate: Real dynamic calculation of passedCount/totalCount (no hardcoded 0/7).
 *    6 technical statuses, diagnostic audit runner with real-time logs, non-blocking chat guarantee.
 * 2. Knowledge Cards: Complete CRUD, search, category filter, badge filter, sorting,
 *    detail modal, copy citation, and mobile-responsive layout.
 */

import React, { useState, useMemo, useEffect } from 'react';
import {
  BookOpen,
  Cpu,
  Server,
  Layers,
  ShieldAlert,
  Info,
  CheckCircle2,
  XCircle,
  HelpCircle,
  Zap,
  Search,
  Filter,
  Plus,
  Trash2,
  Edit3,
  Copy,
  ExternalLink,
  ChevronDown,
  ChevronUp,
  RefreshCw,
  Award,
  Terminal,
  Check,
  X,
  AlertTriangle,
  Lock,
  ArrowUpDown
} from 'lucide-react';
import { TrainingGate } from '../core/trainingGate.ts';
import {
  TrainingGateConditionDetail,
  DetailedConditionStatus,
  KnowledgeCardItem,
  KnowledgeGateBadge
} from '../core/types.ts';

interface KnowledgeCardsViewProps {
  trainingGate: TrainingGate;
}

const DEFAULT_CARDS: KnowledgeCardItem[] = [
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

export const KnowledgeCardsView: React.FC<KnowledgeCardsViewProps> = ({ trainingGate }) => {
  // Training Gate State
  const [gateResult, setGateResult] = useState(() => trainingGate.evaluateGate());
  const [conditions, setConditions] = useState<TrainingGateConditionDetail[]>(() => trainingGate.getConditionDetails());
  const [isAuditing, setIsAuditing] = useState(false);
  const [auditLogs, setAuditLogs] = useState<string[]>([]);
  const [showLogs, setShowLogs] = useState(false);
  const [selectedCondition, setSelectedCondition] = useState<TrainingGateConditionDetail | null>(null);

  // Knowledge Cards State
  const [cards, setCards] = useState<KnowledgeCardItem[]>(DEFAULT_CARDS);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('ALL');
  const [selectedBadge, setSelectedBadge] = useState<string>('ALL');
  const [sortBy, setSortBy] = useState<'title' | 'newest' | 'badge'>('title');

  // Modals & Feedback
  const [activeModal, setActiveModal] = useState<'detail' | 'create' | 'edit' | 'delete' | null>(null);
  const [activeCard, setActiveCard] = useState<KnowledgeCardItem | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Form State for Create/Edit
  const [formData, setFormData] = useState({
    title: '',
    category: 'Kiến trúc mô hình',
    summary: '',
    specs: '',
    references: '',
    author: '',
    version: '1.0.0',
    verificationStatus: 'Gold' as KnowledgeGateBadge,
    hardwareNotice: 'Tài liệu giáo dục kỹ thuật tham khảo'
  });

  // Sync with backend API on mount
  useEffect(() => {
    fetch('/api/knowledge-cards')
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (data && data.cards && data.cards.length > 0) {
          setCards(data.cards);
        }
      })
      .catch(() => {
        // Fallback to DEFAULT_CARDS
      });

    fetch('/api/training-gate')
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (data && data.conditions) {
          setConditions(data.conditions);
          setGateResult({
            passed: data.passed,
            passedCount: data.passedCount,
            totalCount: data.totalCount,
            status: data.status,
            verdictMessage: data.verdictMessage,
            isChatBlocked: false,
            criteriaResults: trainingGate.getCriteria(),
            missingCriteria: data.missingCriteria || [],
            conditions: data.conditions
          });
        }
      })
      .catch(() => {
        // Use local instance
      });
  }, [trainingGate]);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  // Run Diagnostic Audit
  const handleRunDiagnosticAudit = async () => {
    setIsAuditing(true);
    setShowLogs(true);
    try {
      const res = await fetch('/api/training-gate/audit', { method: 'POST' });
      if (res.ok) {
        const data = await res.json();
        setAuditLogs(data.diagnosticLog || []);
        const freshEval = trainingGate.runDiagnosticAudit();
        setGateResult(freshEval.evaluation);
        setConditions(trainingGate.getConditionDetails());
        showToast('Đã hoàn tất kiểm định chẩn đoán thực tế');
      } else {
        const freshEval = trainingGate.runDiagnosticAudit();
        setGateResult(freshEval.evaluation);
        setConditions(trainingGate.getConditionDetails());
        setAuditLogs(freshEval.diagnosticLog);
        showToast('Đã thực thi chẩn đoán nội bộ');
      }
    } catch {
      const freshEval = trainingGate.runDiagnosticAudit();
      setGateResult(freshEval.evaluation);
      setConditions(trainingGate.getConditionDetails());
      setAuditLogs(freshEval.diagnosticLog);
      showToast('Đã thực thi chẩn đoán nội bộ');
    } finally {
      setIsAuditing(false);
    }
  };

  // Update condition status in modal
  const handleSaveConditionStatus = async (
    key: any,
    status: DetailedConditionStatus,
    evidence: string,
    notes: string
  ) => {
    try {
      await fetch('/api/training-gate/update-condition', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ key, status, evidence, notes })
      });
    } catch {
      // Ignore network fail
    }

    const updated = trainingGate.updateConditionStatus(key, status, evidence, notes);
    setGateResult(updated);
    setConditions(trainingGate.getConditionDetails());
    setSelectedCondition(null);
    showToast(`Đã cập nhật trạng thái tiêu chuẩn: ${status}`);
  };

  // Card CRUD
  const handleOpenCreateModal = () => {
    setFormData({
      title: '',
      category: 'Kiến trúc mô hình',
      summary: '',
      specs: '',
      references: '',
      author: 'AI Core Architecture Team',
      version: '1.0.0',
      verificationStatus: 'Gold',
      hardwareNotice: 'Tài liệu giáo dục kỹ thuật tham khảo'
    });
    setActiveModal('create');
  };

  const handleOpenEditModal = (card: KnowledgeCardItem) => {
    setActiveCard(card);
    setFormData({
      title: card.title,
      category: card.category,
      summary: card.summary,
      specs: card.specs.join('\n'),
      references: card.references.join('\n'),
      author: card.author,
      version: card.version,
      verificationStatus: card.verificationStatus,
      hardwareNotice: card.hardwareNotice
    });
    setActiveModal('edit');
  };

  const handleSaveCard = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.title.trim() || !formData.summary.trim()) {
      showToast('Vui lòng điền tiêu đề và tóm tắt thẻ');
      return;
    }

    const specsArray = formData.specs
      .split('\n')
      .map((s) => s.trim())
      .filter(Boolean);
    const referencesArray = formData.references
      .split('\n')
      .map((r) => r.trim())
      .filter(Boolean);

    if (activeModal === 'create') {
      const newCard: KnowledgeCardItem = {
        id: `card_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
        title: formData.title.trim(),
        category: formData.category.trim(),
        summary: formData.summary.trim(),
        specs: specsArray.length > 0 ? specsArray : ['Thông số đang được cập nhật'],
        references: referencesArray.length > 0 ? referencesArray : ['Tài liệu nội bộ NDAWG PRO'],
        author: formData.author.trim() || 'Contributor',
        version: formData.version.trim() || '1.0.0',
        verificationStatus: formData.verificationStatus,
        hardwareNotice: formData.hardwareNotice.trim() || 'Tài liệu giáo dục kỹ thuật tham khảo',
        createdAt: Date.now(),
        lastUpdated: new Date().toISOString()
      };

      setCards((prev) => [newCard, ...prev]);

      try {
        await fetch('/api/knowledge-cards', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(newCard)
        });
      } catch {
        // Fallback local state is already updated
      }

      showToast('Đã thêm thẻ tri thức mới thành công');
    } else if (activeModal === 'edit' && activeCard) {
      const updated: KnowledgeCardItem = {
        ...activeCard,
        title: formData.title.trim(),
        category: formData.category.trim(),
        summary: formData.summary.trim(),
        specs: specsArray.length > 0 ? specsArray : activeCard.specs,
        references: referencesArray.length > 0 ? referencesArray : activeCard.references,
        author: formData.author.trim() || activeCard.author,
        version: formData.version.trim() || activeCard.version,
        verificationStatus: formData.verificationStatus,
        hardwareNotice: formData.hardwareNotice.trim() || activeCard.hardwareNotice,
        lastUpdated: new Date().toISOString()
      };

      setCards((prev) => prev.map((c) => (c.id === updated.id ? updated : c)));

      try {
        await fetch(`/api/knowledge-cards/${updated.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(updated)
        });
      } catch {
        // Local state updated
      }

      showToast('Đã cập nhật thẻ tri thức thành công');
    }

    setActiveModal(null);
    setActiveCard(null);
  };

  const handleDeleteCard = async () => {
    if (!activeCard) return;
    const cardId = activeCard.id;
    setCards((prev) => prev.filter((c) => c.id !== cardId));

    try {
      await fetch(`/api/knowledge-cards/${cardId}`, { method: 'DELETE' });
    } catch {
      // Local state updated
    }

    showToast('Đã xóa thẻ tri thức');
    setActiveModal(null);
    setActiveCard(null);
  };

  const handleCopyCitation = (card: KnowledgeCardItem, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    const citationText = `### [Trích dẫn Tri Thức NDAWG PRO - ${card.verificationStatus.toUpperCase()}]\n**${card.title}** (${card.category} v${card.version})\n${card.summary}\n\n*Thông số cốt lõi:*\n${card.specs.map((s) => `- ${s}`).join('\n')}\n\n*Tài liệu tham khảo:*\n${card.references.map((r) => `- ${r}`).join('\n')}\n\n*Lưu ý:* ${card.hardwareNotice}`;

    navigator.clipboard
      .writeText(citationText)
      .then(() => showToast(`Đã sao chép trích dẫn: ${card.title}`))
      .catch(() => showToast('Không thể sao chép vào bộ nhớ tạm'));
  };

  // Filter & Sort
  const categoriesList = useMemo(() => {
    return Array.from(new Set(cards.map((c) => c.category)));
  }, [cards]);

  const filteredCards = useMemo(() => {
    let result = cards.filter((card) => {
      if (selectedCategory !== 'ALL' && card.category !== selectedCategory) return false;
      if (selectedBadge !== 'ALL' && card.verificationStatus !== selectedBadge) return false;
      if (!searchQuery.trim()) return true;

      const q = searchQuery.toLowerCase().trim();
      const inTitle = card.title.toLowerCase().includes(q);
      const inSummary = card.summary.toLowerCase().includes(q);
      const inCategory = card.category.toLowerCase().includes(q);
      const inSpecs = card.specs.some((s) => s.toLowerCase().includes(q));
      const inRefs = card.references.some((r) => r.toLowerCase().includes(q));

      return inTitle || inSummary || inCategory || inSpecs || inRefs;
    });

    result.sort((a, b) => {
      if (sortBy === 'title') return a.title.localeCompare(b.title);
      if (sortBy === 'newest') return b.createdAt - a.createdAt;
      if (sortBy === 'badge') {
        const score = (badge: KnowledgeGateBadge) =>
          badge === 'Gold' ? 3 : badge === 'Silver' ? 2 : 1;
        return score(b.verificationStatus) - score(a.verificationStatus);
      }
      return 0;
    });

    return result;
  }, [cards, searchQuery, selectedCategory, selectedBadge, sortBy]);

  // Color helper for 6 technical statuses
  const getStatusBadge = (status: DetailedConditionStatus) => {
    switch (status) {
      case 'Implemented and tested':
        return {
          bg: 'bg-emerald-950/80 text-emerald-300 border-emerald-800',
          icon: <CheckCircle2 className="w-3 h-3 text-emerald-400" />,
          label: 'PASSED'
        };
      case 'Implemented, awaiting configuration':
        return {
          bg: 'bg-cyan-950/80 text-cyan-300 border-cyan-800',
          icon: <RefreshCw className="w-3 h-3 text-cyan-400" />,
          label: 'AWAITING CONFIG'
        };
      case 'Not verified':
        return {
          bg: 'bg-amber-950/80 text-amber-300 border-amber-800',
          icon: <HelpCircle className="w-3 h-3 text-amber-400" />,
          label: 'UNVERIFIED'
        };
      case 'Test failed':
        return {
          bg: 'bg-purple-950/80 text-purple-300 border-purple-800',
          icon: <AlertTriangle className="w-3 h-3 text-purple-400" />,
          label: 'TEST FAILED'
        };
      case 'Blocked':
        return {
          bg: 'bg-rose-950/80 text-rose-300 border-rose-800',
          icon: <Lock className="w-3 h-3 text-rose-400" />,
          label: 'BLOCKED'
        };
      case 'Not implemented':
      default:
        return {
          bg: 'bg-rose-950/80 text-rose-300 border-rose-800',
          icon: <XCircle className="w-3 h-3 text-rose-400" />,
          label: 'NOT MET'
        };
    }
  };

  // Badge icon for Gold/Silver/Bronze
  const getBadgeIcon = (tier: KnowledgeGateBadge) => {
    if (tier === 'Gold')
      return (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-amber-950/90 text-amber-300 border border-amber-700/80 shadow-xs">
          <Award className="w-3 h-3 text-amber-400" />
          GOLD TIER
        </span>
      );
    if (tier === 'Silver')
      return (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-slate-800 text-slate-200 border border-slate-600">
          <Award className="w-3 h-3 text-slate-300" />
          SILVER TIER
        </span>
      );
    return (
      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-orange-950/90 text-orange-300 border border-orange-800">
        <Award className="w-3 h-3 text-orange-400" />
        BRONZE TIER
      </span>
    );
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto px-2 sm:px-0">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 px-4 py-2.5 rounded-xl bg-cyan-950 border border-cyan-500/80 text-cyan-200 text-xs shadow-2xl flex items-center gap-2 animate-bounce">
          <Check className="w-4 h-4 text-cyan-400 shrink-0" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* MANDATORY WARNING BANNER FOR TIER C */}
      <div className="p-4 rounded-xl bg-amber-950/40 border-2 border-amber-600/80 text-amber-200 shadow-xl space-y-2">
        <div className="flex items-center gap-2.5 font-bold text-sm tracking-wide text-amber-300">
          <ShieldAlert className="w-5 h-5 text-amber-400 shrink-0" />
          <span>CẢNH BÁO TẦNG C (KNOWLEDGE CARDS) — NỘI DUNG GIÁO DỤC THAM KHẢO</span>
        </div>
        <p className="text-xs text-amber-200/90 leading-relaxed font-sans">
          Toàn bộ thông số kiến trúc mô hình, GPU NVIDIA H100 / Blackwell B200, Google Cloud TPU, và kỹ thuật huấn luyện dưới đây là <strong>tài liệu học thuật và giáo dục kỹ thuật</strong>. NDAWG PRO <strong>không sở hữu, không vận hành và không tự nhận sở hữu</strong> các cụm phần cứng vật lý này. Mọi hành vi quảng bá hoặc tuyên bố sai lệch về quyền sở hữu hạ tầng đều bị nghiêm cấm theo hiến pháp dự án.
        </p>
      </div>

      {/* ========================================================================= */}
      {/* 1. TRAINING GATE AUDIT STATUS (TẦNG B) */}
      {/* ========================================================================= */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 sm:p-5 space-y-4 shadow-xl">
        {/* Header row */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 border-b border-slate-800 pb-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-rose-950/60 border border-rose-800/80 flex items-center justify-center text-rose-400 shrink-0">
              <Server className="w-5 h-5" />
            </div>
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <h3 className="text-sm font-bold text-white tracking-wide">
                  Trạng Thái Tầng B: Huấn Luyện Mô Hình (Training Gate)
                </h3>
                <span
                  className={`text-[11px] font-mono px-2 py-0.5 rounded-full border ${
                    gateResult.passed
                      ? 'bg-emerald-950 text-emerald-300 border-emerald-800'
                      : 'bg-rose-950 text-rose-300 border-rose-800'
                  }`}
                >
                  {gateResult.status}
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                Chốt chặn 7 tiêu chuẩn bắt buộc cho pre-training, SFT, RLHF/DPO, và cập nhật trọng số mô hình.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 self-stretch sm:self-auto justify-between sm:justify-end">
            <button
              onClick={handleRunDiagnosticAudit}
              disabled={isAuditing}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-slate-800 hover:bg-slate-700 text-cyan-300 border border-slate-700 transition-colors disabled:opacity-50"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isAuditing ? 'animate-spin' : ''}`} />
              <span>{isAuditing ? 'Đang chẩn đoán...' : 'Chạy Kiểm Định'}</span>
            </button>

            {/* DYNAMIC PASS COUNT: NEVER HARDCODED */}
            <span className="text-xs font-mono text-slate-400 bg-slate-950 px-3 py-1.5 rounded-lg border border-slate-800 shrink-0">
              Tiêu chuẩn đạt:{' '}
              <strong
                className={
                  gateResult.passedCount === gateResult.totalCount
                    ? 'text-emerald-400'
                    : gateResult.passedCount > 0
                    ? 'text-amber-400'
                    : 'text-rose-400'
                }
              >
                {gateResult.passedCount}/{gateResult.totalCount}
              </strong>
            </span>
          </div>
        </div>

        {/* NON-BLOCKING CHAT CONFIRMATION NOTICE */}
        <div className="p-2.5 rounded-lg bg-emerald-950/30 border border-emerald-800/40 text-emerald-300 text-[11px] flex items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>
              <strong>Tầng A Hoạt Động Độc Lập:</strong> Training Gate chỉ áp dụng riêng cho Tầng B (Huấn luyện từ đầu / Cập nhật trọng số). Chat AI với nhà cung cấp sẵn có (Gemini / Claude / OpenAI) <strong>hoàn toàn không bị chặn</strong>.
            </span>
          </div>
          <span className="font-mono text-[10px] bg-emerald-900/60 text-emerald-200 px-2 py-0.5 rounded border border-emerald-700 shrink-0">
            TIER A: UNBLOCKED
          </span>
        </div>

        {/* 7 Criteria Detailed Checklist Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-2.5 text-xs">
          {conditions.map((c) => {
            const badge = getStatusBadge(c.status);
            return (
              <div
                key={c.id}
                className="p-3 rounded-lg bg-slate-950 border border-slate-800/90 hover:border-slate-700 transition-colors flex flex-col justify-between gap-2"
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <span className="text-slate-200 font-semibold block leading-tight">{c.name}</span>
                    <span className="text-[10px] font-mono text-slate-500 uppercase">{c.category}</span>
                  </div>
                  <span
                    className={`text-[10px] font-mono px-2 py-0.5 rounded border flex items-center gap-1 shrink-0 ${badge.bg}`}
                  >
                    {badge.icon}
                    <span>{badge.label}</span>
                  </span>
                </div>

                <div className="text-[11px] text-slate-400 bg-slate-900/80 p-2 rounded border border-slate-800/60 font-sans leading-relaxed">
                  <p className="text-slate-300">
                    <strong className="text-slate-400 font-mono text-[10px]">Bằng chứng kỹ thuật:</strong>{' '}
                    {c.evidence}
                  </p>
                  {c.verificationNotes && (
                    <p className="text-slate-400 mt-1 italic text-[10.5px]">
                      * {c.verificationNotes}
                    </p>
                  )}
                </div>

                <div className="flex items-center justify-between text-[10px] text-slate-500 font-mono pt-1 border-t border-slate-900">
                  <span>Trạng thái: {c.status}</span>
                  <button
                    onClick={() => setSelectedCondition(c)}
                    className="text-cyan-400 hover:text-cyan-300 hover:underline"
                  >
                    Cập nhật bằng chứng
                  </button>
                </div>
              </div>
            );
          })}
        </div>

        {/* Verdict Message & Log Toggle */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 p-3 bg-slate-950 rounded-lg border border-slate-800 text-xs text-slate-400 font-mono">
          <div className="flex items-center gap-2">
            <Info className="w-4 h-4 text-cyan-400 shrink-0" />
            <span>{gateResult.verdictMessage}</span>
          </div>
          {auditLogs.length > 0 && (
            <button
              onClick={() => setShowLogs(!showLogs)}
              className="text-[11px] text-cyan-400 hover:text-cyan-300 flex items-center gap-1 shrink-0"
            >
              <Terminal className="w-3.5 h-3.5" />
              <span>{showLogs ? 'Ẩn nhật ký kiểm định' : 'Xem nhật ký kiểm định'}</span>
              {showLogs ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
            </button>
          )}
        </div>

        {/* Diagnostic Logs Panel */}
        {showLogs && auditLogs.length > 0 && (
          <div className="p-3 rounded-lg bg-black border border-slate-800 text-[11px] font-mono text-slate-300 space-y-1 max-h-48 overflow-y-auto">
            <div className="text-cyan-400 font-bold border-b border-slate-800 pb-1 mb-2">
              NHẬT KÝ CHẨN ĐOÁN KỸ THUẬT MÔI TRƯỜNG THỰC TẾ
            </div>
            {auditLogs.map((log, i) => (
              <div key={i} className="leading-snug">
                <span className="text-slate-600 mr-2">[{i + 1}]</span>
                <span className={log.includes('NOT MET') ? 'text-rose-400' : log.includes('AWAITING') ? 'text-cyan-400' : 'text-slate-300'}>
                  {log}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* ========================================================================= */}
      {/* 2. EDUCATIONAL KNOWLEDGE CARDS (TẦNG C) */}
      {/* ========================================================================= */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 sm:p-5 space-y-5 shadow-xl">
        {/* Section Header & Primary Actions */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-slate-800 pb-4">
          <div>
            <h2 className="text-base font-bold text-white flex items-center gap-2">
              <BookOpen className="w-5 h-5 text-cyan-400 shrink-0" />
              <span>Thư Viện Thẻ Tri Thức Kỹ Thuật (Knowledge Cards Tầng C)</span>
            </h2>
            <p className="text-xs text-slate-400 mt-1">
              Kho lưu trữ tri thức kiểm chứng kết nối trực tiếp với RAG Chat, trích dẫn học thuật và phân loại chất lượng Gold/Silver/Bronze.
            </p>
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
            <button
              onClick={handleOpenCreateModal}
              className="flex items-center justify-center gap-1.5 px-3.5 py-2 rounded-lg text-xs font-semibold bg-cyan-600 hover:bg-cyan-500 text-white shadow-md shadow-cyan-950/40 transition-colors w-full sm:w-auto"
            >
              <Plus className="w-4 h-4" />
              <span>Thêm Thẻ Mới</span>
            </button>
          </div>
        </div>

        {/* Search & Filter Toolbar */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2.5 text-xs">
          {/* Search Input */}
          <div className="relative">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Tìm theo tiêu đề, thông số, trích dẫn..."
              className="w-full pl-9 pr-8 py-2 rounded-lg bg-slate-950 border border-slate-800 text-slate-200 placeholder-slate-500 focus:outline-none focus:border-cyan-500 text-xs"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Category Filter */}
          <div className="relative">
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="w-full py-2 px-3 rounded-lg bg-slate-950 border border-slate-800 text-slate-300 focus:outline-none focus:border-cyan-500 text-xs appearance-none cursor-pointer"
            >
              <option value="ALL">Tất cả chủ đề ({cards.length})</option>
              {categoriesList.map((cat) => (
                <option key={cat} value={cat}>
                  {cat} ({cards.filter((c) => c.category === cat).length})
                </option>
              ))}
            </select>
            <ChevronDown className="w-3.5 h-3.5 absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 pointer-events-none" />
          </div>

          {/* Badge Filter */}
          <div className="relative">
            <select
              value={selectedBadge}
              onChange={(e) => setSelectedBadge(e.target.value)}
              className="w-full py-2 px-3 rounded-lg bg-slate-950 border border-slate-800 text-slate-300 focus:outline-none focus:border-cyan-500 text-xs appearance-none cursor-pointer"
            >
              <option value="ALL">Tất cả cấp bậc</option>
              <option value="Gold">Gold Tier (Kiểm chứng chuẩn)</option>
              <option value="Silver">Silver Tier (Tham khảo sơ bộ)</option>
              <option value="Bronze">Bronze Tier (Cần xem xét)</option>
            </select>
            <ChevronDown className="w-3.5 h-3.5 absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 pointer-events-none" />
          </div>

          {/* Sorting */}
          <div className="relative">
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as any)}
              className="w-full py-2 px-3 rounded-lg bg-slate-950 border border-slate-800 text-slate-300 focus:outline-none focus:border-cyan-500 text-xs appearance-none cursor-pointer"
            >
              <option value="title">Sắp xếp: Tiêu đề A-Z</option>
              <option value="newest">Sắp xếp: Mới nhất</option>
              <option value="badge">Sắp xếp: Cấp bậc kiểm định</option>
            </select>
            <ArrowUpDown className="w-3.5 h-3.5 absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 pointer-events-none" />
          </div>
        </div>

        {/* Result Counter & Active Filter Chips */}
        <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-slate-400 border-t border-slate-800/60 pt-3">
          <div className="flex items-center gap-2">
            <span>
              Hiển thị <strong>{filteredCards.length}</strong> / {cards.length} thẻ
            </span>
            {(selectedCategory !== 'ALL' || selectedBadge !== 'ALL' || searchQuery) && (
              <button
                onClick={() => {
                  setSelectedCategory('ALL');
                  setSelectedBadge('ALL');
                  setSearchQuery('');
                }}
                className="text-[11px] text-cyan-400 hover:underline ml-2"
              >
                Đặt lại bộ lọc
              </button>
            )}
          </div>

          <div className="flex items-center gap-2 text-[11px] font-mono">
            <span className="text-amber-400">
              Gold: {cards.filter((c) => c.verificationStatus === 'Gold').length}
            </span>
            <span>•</span>
            <span className="text-slate-300">
              Silver: {cards.filter((c) => c.verificationStatus === 'Silver').length}
            </span>
            <span>•</span>
            <span className="text-orange-400">
              Bronze: {cards.filter((c) => c.verificationStatus === 'Bronze').length}
            </span>
          </div>
        </div>

        {/* Knowledge Cards Grid */}
        {filteredCards.length === 0 ? (
          <div className="py-12 text-center text-slate-500 space-y-2 border border-dashed border-slate-800 rounded-xl">
            <BookOpen className="w-8 h-8 mx-auto text-slate-600" />
            <p className="text-sm">Không tìm thấy thẻ tri thức nào phù hợp với bộ lọc hiện tại.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredCards.map((card) => (
              <div
                key={card.id}
                className="bg-slate-950/80 border border-slate-800 hover:border-slate-700/80 rounded-xl p-4 flex flex-col justify-between transition-all shadow-md group"
              >
                <div className="space-y-3">
                  {/* Category & Badge Header */}
                  <div className="flex flex-wrap items-center justify-between gap-1.5">
                    <span className="text-cyan-400 font-semibold text-[11px] font-mono tracking-tight">
                      {card.category}
                    </span>
                    {getBadgeIcon(card.verificationStatus)}
                  </div>

                  {/* Title & Summary */}
                  <div>
                    <h3 className="text-sm font-bold text-white group-hover:text-cyan-300 transition-colors tracking-tight line-clamp-2">
                      {card.title}
                    </h3>
                    <p className="text-xs text-slate-400 mt-1.5 leading-relaxed line-clamp-3">
                      {card.summary}
                    </p>
                  </div>

                  {/* Core Specs Snapshot */}
                  <div className="pt-2 border-t border-slate-800/80 space-y-1.5">
                    <span className="text-[10px] uppercase font-mono text-slate-500 block font-semibold">
                      Thông số cốt lõi:
                    </span>
                    <ul className="text-[11px] text-slate-300 space-y-1 list-disc list-inside">
                      {card.specs.slice(0, 3).map((spec, i) => (
                        <li key={i} className="leading-snug line-clamp-1">
                          {spec}
                        </li>
                      ))}
                      {card.specs.length > 3 && (
                        <li className="text-[10px] text-cyan-400 list-none italic">
                          +{card.specs.length - 3} thông số chi tiết khác
                        </li>
                      )}
                    </ul>
                  </div>

                  {/* Hardware Notice Tag */}
                  <div className="p-2 rounded bg-slate-900 border border-slate-800 text-[10px] text-amber-300/80 leading-snug">
                    {card.hardwareNotice}
                  </div>
                </div>

                {/* Card Action Buttons */}
                <div className="mt-4 pt-3 border-t border-slate-800 flex items-center justify-between gap-1 text-[11px]">
                  <button
                    onClick={() => {
                      setActiveCard(card);
                      setActiveModal('detail');
                    }}
                    className="px-2.5 py-1 rounded bg-slate-900 hover:bg-slate-800 text-slate-200 border border-slate-800 transition-colors"
                  >
                    Chi tiết
                  </button>

                  <div className="flex items-center gap-1">
                    <button
                      onClick={(e) => handleCopyCitation(card, e)}
                      title="Sao chép trích dẫn"
                      className="p-1.5 rounded hover:bg-slate-800 text-slate-400 hover:text-cyan-300 transition-colors"
                    >
                      <Copy className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => handleOpenEditModal(card)}
                      title="Chỉnh sửa thẻ"
                      className="p-1.5 rounded hover:bg-slate-800 text-slate-400 hover:text-amber-300 transition-colors"
                    >
                      <Edit3 className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => {
                        setActiveCard(card);
                        setActiveModal('delete');
                      }}
                      title="Xóa thẻ"
                      className="p-1.5 rounded hover:bg-slate-800 text-slate-400 hover:text-rose-400 transition-colors"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* ========================================================================= */}
      {/* 3. MODALS */}
      {/* ========================================================================= */}

      {/* MODAL 1: CARD DETAIL VIEW */}
      {activeModal === 'detail' && activeCard && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto p-5 sm:p-6 space-y-4 shadow-2xl">
            <div className="flex items-start justify-between gap-3 border-b border-slate-800 pb-3">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-xs font-mono text-cyan-400 font-semibold">{activeCard.category}</span>
                  {getBadgeIcon(activeCard.verificationStatus)}
                  <span className="text-[10px] font-mono text-slate-500">v{activeCard.version}</span>
                </div>
                <h3 className="text-base sm:text-lg font-bold text-white">{activeCard.title}</h3>
              </div>
              <button
                onClick={() => {
                  setActiveModal(null);
                  setActiveCard(null);
                }}
                className="p-1.5 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4 text-xs">
              {/* Summary */}
              <div>
                <span className="text-[11px] font-mono uppercase text-slate-500 block mb-1">Tóm tắt nội dung:</span>
                <p className="text-slate-300 leading-relaxed bg-slate-950 p-3 rounded-lg border border-slate-800">
                  {activeCard.summary}
                </p>
              </div>

              {/* Specs */}
              <div>
                <span className="text-[11px] font-mono uppercase text-slate-500 block mb-1">
                  Thông số kỹ thuật đầy đủ ({activeCard.specs.length}):
                </span>
                <div className="bg-slate-950 p-3 rounded-lg border border-slate-800 space-y-2">
                  {activeCard.specs.map((s, i) => (
                    <div key={i} className="flex items-start gap-2 text-slate-200">
                      <span className="text-cyan-400 font-mono">•</span>
                      <span>{s}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* References */}
              <div>
                <span className="text-[11px] font-mono uppercase text-slate-500 block mb-1">
                  Nguồn tham khảo & Kiểm chứng học thuật:
                </span>
                <div className="bg-slate-950 p-3 rounded-lg border border-slate-800 space-y-1.5">
                  {activeCard.references.map((r, i) => (
                    <div key={i} className="text-slate-400 font-mono text-[11px] flex items-center gap-2">
                      <ExternalLink className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
                      <span>{r}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Metadata */}
              <div className="grid grid-cols-2 gap-2 text-[10px] font-mono text-slate-400 bg-slate-950 p-3 rounded-lg border border-slate-800">
                <div>Người kiểm duyệt: <strong className="text-slate-200">{activeCard.author}</strong></div>
                <div>Cập nhật lần cuối: <strong className="text-slate-200">{new Date(activeCard.lastUpdated).toLocaleDateString('vi-VN')}</strong></div>
                <div className="col-span-2 text-amber-300/80 pt-1 border-t border-slate-900">
                  {activeCard.hardwareNotice}
                </div>
              </div>
            </div>

            <div className="flex items-center justify-between pt-3 border-t border-slate-800">
              <button
                onClick={() => handleCopyCitation(activeCard)}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs bg-slate-800 hover:bg-slate-700 text-cyan-300 border border-slate-700 transition-colors"
              >
                <Copy className="w-3.5 h-3.5" />
                <span>Sao chép trích dẫn</span>
              </button>
              <button
                onClick={() => {
                  setActiveModal(null);
                  setActiveCard(null);
                }}
                className="px-4 py-1.5 rounded-lg text-xs bg-cyan-600 hover:bg-cyan-500 text-white font-medium"
              >
                Đóng
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 2: CREATE / EDIT CARD */}
      {(activeModal === 'create' || activeModal === 'edit') && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
          <form
            onSubmit={handleSaveCard}
            className="bg-slate-900 border border-slate-800 rounded-2xl max-w-xl w-full max-h-[90vh] overflow-y-auto p-5 sm:p-6 space-y-4 shadow-2xl"
          >
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="text-sm sm:text-base font-bold text-white flex items-center gap-2">
                <BookOpen className="w-4 h-4 text-cyan-400" />
                <span>{activeModal === 'create' ? 'Thêm Thẻ Tri Thức Mới' : 'Chỉnh Sửa Thẻ Tri Thức'}</span>
              </h3>
              <button
                type="button"
                onClick={() => {
                  setActiveModal(null);
                  setActiveCard(null);
                }}
                className="p-1 rounded hover:bg-slate-800 text-slate-400 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <label className="text-slate-300 font-medium block mb-1">Tiêu đề thẻ *</label>
                <input
                  type="text"
                  required
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  placeholder="Ví dụ: Kiến trúc DeepSeek-V3 Multi-head Latent Attention"
                  className="w-full px-3 py-2 rounded-lg bg-slate-950 border border-slate-800 text-slate-200 placeholder-slate-500 focus:outline-none focus:border-cyan-500"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-slate-300 font-medium block mb-1">Chủ đề / Phân loại *</label>
                  <input
                    type="text"
                    required
                    value={formData.category}
                    onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                    placeholder="Ví dụ: Kiến trúc mô hình"
                    className="w-full px-3 py-2 rounded-lg bg-slate-950 border border-slate-800 text-slate-200 focus:outline-none focus:border-cyan-500"
                  />
                </div>
                <div>
                  <label className="text-slate-300 font-medium block mb-1">Cấp bậc kiểm định *</label>
                  <select
                    value={formData.verificationStatus}
                    onChange={(e) => setFormData({ ...formData, verificationStatus: e.target.value as any })}
                    className="w-full px-3 py-2 rounded-lg bg-slate-950 border border-slate-800 text-slate-200 focus:outline-none focus:border-cyan-500"
                  >
                    <option value="Gold">Gold Tier (Toàn diện, không mâu thuẫn)</option>
                    <option value="Silver">Silver Tier (Tham khảo học thuật sơ bộ)</option>
                    <option value="Bronze">Bronze Tier (Cần xem xét bổ sung)</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="text-slate-300 font-medium block mb-1">Tóm tắt nội dung *</label>
                <textarea
                  required
                  rows={2}
                  value={formData.summary}
                  onChange={(e) => setFormData({ ...formData, summary: e.target.value })}
                  placeholder="Mô tả ngắn gọn nguyên lý hoặc đặc điểm kỹ thuật..."
                  className="w-full px-3 py-2 rounded-lg bg-slate-950 border border-slate-800 text-slate-200 focus:outline-none focus:border-cyan-500"
                />
              </div>

              <div>
                <label className="text-slate-300 font-medium block mb-1">
                  Thông số cốt lõi (Mỗi dòng một thông số)
                </label>
                <textarea
                  rows={3}
                  value={formData.specs}
                  onChange={(e) => setFormData({ ...formData, specs: e.target.value })}
                  placeholder="Độ phức tạp: O(N)&#10;Bộ nhớ đệm: KV Cache O(1)&#10;Số tham số: 671B tổng, 37B kích hoạt"
                  className="w-full px-3 py-2 rounded-lg bg-slate-950 border border-slate-800 text-slate-200 font-mono text-[11px] focus:outline-none focus:border-cyan-500"
                />
              </div>

              <div>
                <label className="text-slate-300 font-medium block mb-1">
                  Nguồn trích dẫn học thuật (Mỗi dòng một nguồn)
                </label>
                <textarea
                  rows={2}
                  value={formData.references}
                  onChange={(e) => setFormData({ ...formData, references: e.target.value })}
                  placeholder="Vaswani et al. (2017)&#10;DeepSeek Technical Report (2024)"
                  className="w-full px-3 py-2 rounded-lg bg-slate-950 border border-slate-800 text-slate-200 font-mono text-[11px] focus:outline-none focus:border-cyan-500"
                />
              </div>

              <div>
                <label className="text-slate-300 font-medium block mb-1">Cảnh báo / Ghi chú phần cứng</label>
                <input
                  type="text"
                  value={formData.hardwareNotice}
                  onChange={(e) => setFormData({ ...formData, hardwareNotice: e.target.value })}
                  className="w-full px-3 py-2 rounded-lg bg-slate-950 border border-slate-800 text-slate-200 focus:outline-none focus:border-cyan-500"
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-800">
              <button
                type="button"
                onClick={() => {
                  setActiveModal(null);
                  setActiveCard(null);
                }}
                className="px-3.5 py-1.5 rounded-lg text-xs bg-slate-800 hover:bg-slate-700 text-slate-300"
              >
                Hủy
              </button>
              <button
                type="submit"
                className="px-4 py-1.5 rounded-lg text-xs bg-cyan-600 hover:bg-cyan-500 text-white font-medium shadow-md"
              >
                {activeModal === 'create' ? 'Tạo Thẻ Tri Thức' : 'Lưu Thay Đổi'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* MODAL 3: DELETE CONFIRMATION */}
      {activeModal === 'delete' && activeCard && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
          <div className="bg-slate-900 border border-rose-900/60 rounded-2xl max-w-md w-full p-5 space-y-4 shadow-2xl">
            <div className="flex items-center gap-3 text-rose-400">
              <div className="w-10 h-10 rounded-full bg-rose-950/80 border border-rose-800 flex items-center justify-center shrink-0">
                <Trash2 className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-white">Xác nhận xóa thẻ tri thức</h3>
                <p className="text-xs text-slate-400">Hành động này không thể hoàn tác.</p>
              </div>
            </div>

            <div className="p-3 bg-slate-950 rounded-lg border border-slate-800 text-xs text-slate-300">
              Bạn có chắc chắn muốn xóa thẻ tri thức: <strong className="text-white">"{activeCard.title}"</strong> (ID: {activeCard.id})?
            </div>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                onClick={() => {
                  setActiveModal(null);
                  setActiveCard(null);
                }}
                className="px-3 py-1.5 rounded-lg text-xs bg-slate-800 hover:bg-slate-700 text-slate-300"
              >
                Hủy bỏ
              </button>
              <button
                onClick={handleDeleteCard}
                className="px-4 py-1.5 rounded-lg text-xs bg-rose-600 hover:bg-rose-500 text-white font-semibold shadow-md shadow-rose-950/40"
              >
                Xác nhận xóa
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 4: TRAINING GATE CONDITION UPDATE */}
      {selectedCondition && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-lg w-full p-5 space-y-4 shadow-2xl">
            <div className="flex items-start justify-between border-b border-slate-800 pb-3">
              <div>
                <span className="text-[10px] font-mono uppercase text-slate-400 block">
                  Cập nhật tiêu chuẩn Training Gate
                </span>
                <h3 className="text-sm font-bold text-white mt-0.5">{selectedCondition.name}</h3>
              </div>
              <button
                onClick={() => setSelectedCondition(null)}
                className="p-1 rounded hover:bg-slate-800 text-slate-400 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <label className="text-slate-300 font-medium block mb-1">
                  Trạng thái kỹ thuật thực tế (6 trạng thái tiêu chuẩn) *
                </label>
                <select
                  id="cond_status_select"
                  defaultValue={selectedCondition.status}
                  className="w-full px-3 py-2 rounded-lg bg-slate-950 border border-slate-800 text-slate-200 focus:outline-none focus:border-cyan-500"
                >
                  <option value="Not implemented">Not implemented (Chưa triển khai)</option>
                  <option value="Not verified">Not verified (Chưa xác minh)</option>
                  <option value="Implemented, awaiting configuration">Implemented, awaiting configuration (Đã triển khai, chờ cấu hình)</option>
                  <option value="Test failed">Test failed (Kiểm thử thất bại)</option>
                  <option value="Blocked">Blocked (Bị chặn do rủi ro an toàn/pháp lý)</option>
                  <option value="Implemented and tested">Implemented and tested (Đã triển khai và kiểm thử đạt)</option>
                </select>
              </div>

              <div>
                <label className="text-slate-300 font-medium block mb-1">
                  Bằng chứng kỹ thuật thực tế *
                </label>
                <textarea
                  id="cond_evidence_input"
                  rows={3}
                  defaultValue={selectedCondition.evidence}
                  className="w-full px-3 py-2 rounded-lg bg-slate-950 border border-slate-800 text-slate-200 font-mono text-[11px] focus:outline-none focus:border-cyan-500"
                />
              </div>

              <div>
                <label className="text-slate-300 font-medium block mb-1">
                  Ghi chú kiểm định
                </label>
                <input
                  id="cond_notes_input"
                  type="text"
                  defaultValue={selectedCondition.verificationNotes}
                  className="w-full px-3 py-2 rounded-lg bg-slate-950 border border-slate-800 text-slate-200 focus:outline-none focus:border-cyan-500"
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-800">
              <button
                type="button"
                onClick={() => setSelectedCondition(null)}
                className="px-3.5 py-1.5 rounded-lg text-xs bg-slate-800 hover:bg-slate-700 text-slate-300"
              >
                Hủy
              </button>
              <button
                type="button"
                onClick={() => {
                  const statusSelect = document.getElementById('cond_status_select') as HTMLSelectElement;
                  const evidenceInput = document.getElementById('cond_evidence_input') as HTMLTextAreaElement;
                  const notesInput = document.getElementById('cond_notes_input') as HTMLInputElement;

                  handleSaveConditionStatus(
                    selectedCondition.key,
                    statusSelect.value as DetailedConditionStatus,
                    evidenceInput.value,
                    notesInput.value
                  );
                }}
                className="px-4 py-1.5 rounded-lg text-xs bg-cyan-600 hover:bg-cyan-500 text-white font-medium shadow-md"
              >
                Lưu bằng chứng & trạng thái
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
