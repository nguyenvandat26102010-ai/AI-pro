/**
 * NDAWG PRO — PART 7/8 (UNIFIED FINAL V2)
 * Slide-out Sidebar Component
 * Supports New Chat, Search, History Switching/Renaming/Deletion, Modules, Plugins & Admin Lock
 */

import React, { useState, useMemo } from 'react';
import { 
  Plus, 
  Search, 
  MessageSquare, 
  Trash2, 
  Edit3, 
  Check, 
  X, 
  Lock, 
  ShieldCheck, 
  Layers, 
  Image as ImageIcon, 
  BookOpen, 
  FolderGit2, 
  LogOut,
  ChevronRight,
  Sparkles,
  Globe,
  Zap,
  Briefcase,
  HardDrive,
  Dna,
  Gamepad2
} from 'lucide-react';
import { ChatConversation, AdminSession } from '../types/chat.ts';

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
  conversations: ChatConversation[];
  activeConversationId: string;
  onSelectConversation: (id: string) => void;
  onNewChat: () => void;
  onDeleteConversation: (id: string) => void;
  onRenameConversation: (id: string, newTitle: string) => void;
  onOpenPluginCenter: () => void;
  onOpenAdminLogin: () => void;
  onOpenAdminConsole: () => void;
  adminSession: AdminSession;
  onAdminLogout: () => void;
  onNavigateModule: (moduleName: string) => void;
}

export function Sidebar({
  isOpen,
  onClose,
  conversations,
  activeConversationId,
  onSelectConversation,
  onNewChat,
  onDeleteConversation,
  onRenameConversation,
  onOpenPluginCenter,
  onOpenAdminLogin,
  onOpenAdminConsole,
  adminSession,
  onAdminLogout,
  onNavigateModule
}: SidebarProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingTitle, setEditingTitle] = useState('');

  // Filter conversations by search query
  const filteredConversations = useMemo(() => {
    if (!searchQuery.trim()) return conversations;
    const q = searchQuery.toLowerCase();
    return conversations.filter(c =>
      c.title.toLowerCase().includes(q) ||
      c.messages.some(m => m.content.toLowerCase().includes(q))
    );
  }, [conversations, searchQuery]);

  const handleStartRename = (conv: ChatConversation, e: React.MouseEvent) => {
    e.stopPropagation();
    setEditingId(conv.id);
    setEditingTitle(conv.title);
  };

  const handleSaveRename = (convId: string, e: React.MouseEvent | React.FormEvent) => {
    e.stopPropagation();
    e.preventDefault();
    if (editingTitle.trim()) {
      onRenameConversation(convId, editingTitle.trim());
    }
    setEditingId(null);
  };

  const handleDelete = (convId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    onDeleteConversation(convId);
  };

  return (
    <>
      {/* Mobile Backdrop Overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 z-40 bg-slate-950/80 backdrop-blur-sm lg:hidden transition-opacity"
          onClick={onClose}
        />
      )}

      {/* Slide-out Sidebar Drawer */}
      <aside
        className={`fixed top-0 bottom-0 left-0 z-40 w-72 sm:w-80 bg-slate-950 border-r border-slate-800/80 flex flex-col transition-transform duration-300 ease-in-out shadow-2xl ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {/* Header */}
        <div className="p-4 border-b border-slate-800/80 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-cyan-500 to-sky-700 flex items-center justify-center text-slate-950 font-black text-sm shadow-md shadow-cyan-500/20">
              N
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="font-bold text-sm tracking-wide text-slate-100">NDAWG PRO</span>
                <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-cyan-950 text-cyan-400 border border-cyan-800/40">
                  v7.0
                </span>
              </div>
              <p className="text-[10px] text-slate-400 font-mono">APEX UNIFIED CORE</p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-100 hover:bg-slate-900 rounded-lg transition-colors"
            title="Đóng sidebar"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Primary Action: New Chat */}
        <div className="p-3">
          <button
            onClick={() => {
              onNewChat();
              if (window.innerWidth < 1024) onClose();
            }}
            className="w-full py-2.5 px-4 rounded-xl bg-gradient-to-r from-cyan-500 to-sky-600 hover:from-cyan-400 hover:to-sky-500 text-slate-950 font-semibold text-xs transition-all flex items-center justify-center gap-2 shadow-lg shadow-cyan-950/40 group cursor-pointer"
          >
            <Plus className="w-4 h-4 transition-transform group-hover:rotate-90" />
            <span>Đoạn chat mới</span>
          </button>
        </div>

        {/* Search input */}
        <div className="px-3 pb-2">
          <div className="relative">
            <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Tìm kiếm lịch sử..."
              className="w-full bg-slate-900/90 border border-slate-800 rounded-lg pl-8 pr-3 py-1.5 text-xs text-slate-200 placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-cyan-500/60 focus:border-cyan-500 font-sans"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-200 p-0.5"
              >
                <X className="w-3 h-3" />
              </button>
            )}
          </div>
        </div>

        {/* Quick Modules & Tools */}
        <div className="px-3 py-2 border-y border-slate-800/80 bg-slate-900/30 space-y-1">
          <div className="text-[10px] font-mono text-slate-400 px-2 uppercase tracking-wider font-semibold">
            Công cụ & Không gian
          </div>

          {/* Bioscience DeepMind Science Suite */}
          <button
            onClick={() => {
              onNavigateModule('bioscience');
              if (window.innerWidth < 1024) onClose();
            }}
            className="w-full flex items-center justify-between px-2.5 py-1.5 rounded-lg text-xs text-emerald-200 hover:bg-slate-800/90 hover:text-emerald-300 transition-colors bg-gradient-to-r from-emerald-950/60 to-teal-950/40 border border-emerald-500/40"
          >
            <div className="flex items-center gap-2">
              <Dna className="w-3.5 h-3.5 text-emerald-400" />
              <span className="font-bold">Bioscience (AlphaFold DB)</span>
            </div>
            <span className="text-[10px] font-mono bg-emerald-950 text-emerald-300 px-1.5 py-0.5 rounded border border-emerald-800/60 font-semibold">
              Science
            </span>
          </button>

          {/* Three.js 3D Orbital Game */}
          <button
            onClick={() => {
              onNavigateModule('game3d');
              if (window.innerWidth < 1024) onClose();
            }}
            className="w-full flex items-center justify-between px-2.5 py-1.5 rounded-lg text-xs text-sky-200 hover:bg-slate-800/90 hover:text-sky-300 transition-colors bg-gradient-to-r from-sky-950/60 via-indigo-950/40 to-slate-900/40 border border-sky-500/40"
          >
            <div className="flex items-center gap-2">
              <Gamepad2 className="w-3.5 h-3.5 text-sky-400" />
              <span className="font-bold">Three.js 3D Recon Game</span>
            </div>
            <span className="text-[10px] font-mono bg-sky-950 text-sky-300 px-1.5 py-0.5 rounded border border-sky-800/60 font-semibold">
              60fps PBR
            </span>
          </button>

          <button
            onClick={() => {
              onNavigateModule('workspace');
              if (window.innerWidth < 1024) onClose();
            }}
            className="w-full flex items-center justify-between px-2.5 py-1.5 rounded-lg text-xs text-emerald-200 hover:bg-slate-800/90 hover:text-emerald-300 transition-colors bg-gradient-to-r from-emerald-950/50 via-teal-950/40 to-slate-900/40 border border-emerald-500/40"
          >
            <div className="flex items-center gap-2">
              <HardDrive className="w-3.5 h-3.5 text-emerald-400" />
              <span className="font-bold">Google Workspace &amp; Cloud</span>
            </div>
            <span className="text-[10px] font-mono bg-emerald-950 text-emerald-300 px-1.5 py-0.5 rounded border border-emerald-800/60 font-semibold">
              Tasks/Drive/Chat
            </span>
          </button>

          <button
            onClick={() => {
              onNavigateModule('v14adaptive');
              if (window.innerWidth < 1024) onClose();
            }}
            className="w-full flex items-center justify-between px-2.5 py-1.5 rounded-lg text-xs text-white hover:bg-slate-800/90 hover:text-cyan-300 transition-colors bg-gradient-to-r from-cyan-900/40 via-sky-950/40 to-indigo-950/40 border border-cyan-500/40"
          >
            <div className="flex items-center gap-2">
              <Zap className="w-3.5 h-3.5 text-amber-300" />
              <span className="font-bold">V14 Frontier AI Hub</span>
            </div>
            <span className="text-[10px] font-mono bg-cyan-950 text-cyan-300 px-1.5 py-0.5 rounded border border-cyan-800/60 font-semibold">
              Live Audit
            </span>
          </button>

          <button
            onClick={() => {
              onNavigateModule('universalknowledge');
              if (window.innerWidth < 1024) onClose();
            }}
            className="w-full flex items-center justify-between px-2.5 py-1.5 rounded-lg text-xs text-slate-200 hover:bg-slate-800/90 hover:text-cyan-300 transition-colors bg-gradient-to-r from-cyan-950/40 to-indigo-950/30 border border-cyan-800/40"
          >
            <div className="flex items-center gap-2">
              <Globe className="w-3.5 h-3.5 text-cyan-400" />
              <span className="font-semibold">Tri thức Nhân loại (V9)</span>
            </div>
            <span className="text-[10px] font-mono bg-cyan-900/60 text-cyan-300 px-1.5 py-0.5 rounded border border-cyan-700/50">
              15 Miền
            </span>
          </button>

          <button
            onClick={() => {
              onOpenPluginCenter();
              if (window.innerWidth < 1024) onClose();
            }}
            className="w-full flex items-center justify-between px-2.5 py-1.5 rounded-lg text-xs text-slate-300 hover:bg-slate-800/80 hover:text-cyan-300 transition-colors"
          >
            <div className="flex items-center gap-2">
              <Layers className="w-3.5 h-3.5 text-cyan-400" />
              <span>Plugin Center</span>
            </div>
            <span className="text-[10px] font-mono bg-cyan-950 text-cyan-400 px-1.5 py-0.5 rounded border border-cyan-800/40">
              5 Tools
            </span>
          </button>

          <button
            onClick={() => {
              onNavigateModule('imagestudio');
              if (window.innerWidth < 1024) onClose();
            }}
            className="w-full flex items-center justify-between px-2.5 py-1.5 rounded-lg text-xs text-slate-300 hover:bg-slate-800/80 hover:text-cyan-300 transition-colors"
          >
            <div className="flex items-center gap-2">
              <ImageIcon className="w-3.5 h-3.5 text-pink-400" />
              <span>Studio Ảnh (Diff Check)</span>
            </div>
            <ChevronRight className="w-3 h-3 text-slate-400" />
          </button>

          <button
            onClick={() => {
              onNavigateModule('knowledgecards');
              if (window.innerWidth < 1024) onClose();
            }}
            className="w-full flex items-center justify-between px-2.5 py-1.5 rounded-lg text-xs text-slate-300 hover:bg-slate-800/80 hover:text-cyan-300 transition-colors"
          >
            <div className="flex items-center gap-2">
              <BookOpen className="w-3.5 h-3.5 text-amber-400" />
              <span>Thư viện tri thức (RAG)</span>
            </div>
            <ChevronRight className="w-3 h-3 text-slate-400" />
          </button>

          <button
            onClick={() => {
              onNavigateModule('work');
              if (window.innerWidth < 1024) onClose();
            }}
            className="w-full flex items-center justify-between px-2.5 py-1.5 rounded-lg text-xs text-slate-300 hover:bg-slate-800/80 hover:text-cyan-300 transition-colors"
          >
            <div className="flex items-center gap-2">
              <FolderGit2 className="w-3.5 h-3.5 text-emerald-400" />
              <span>Dự án & Không gian làm việc</span>
            </div>
            <ChevronRight className="w-3 h-3 text-slate-400" />
          </button>
        </div>

        {/* Chat History List */}
        <div className="flex-1 overflow-y-auto px-3 py-2 space-y-1">
          <div className="text-[10px] font-mono text-slate-400 px-2 uppercase tracking-wider font-semibold mb-1">
            Lịch sử trò chuyện ({filteredConversations.length})
          </div>

          {filteredConversations.length === 0 ? (
            <div className="p-4 text-center text-xs text-slate-400 font-sans">
              Không tìm thấy cuộc trò chuyện phù hợp
            </div>
          ) : (
            filteredConversations.map((conv) => {
              const isActive = conv.id === activeConversationId;
              const isEditing = editingId === conv.id;

              return (
                <div
                  key={conv.id}
                  onClick={() => {
                    onSelectConversation(conv.id);
                    if (window.innerWidth < 1024) onClose();
                  }}
                  className={`group relative flex items-center justify-between px-3 py-2 rounded-xl text-xs transition-all cursor-pointer ${
                    isActive
                      ? 'bg-slate-900 border border-cyan-500/40 text-slate-100 font-medium shadow-sm shadow-cyan-950/20'
                      : 'text-slate-400 hover:bg-slate-900/60 hover:text-slate-200 border border-transparent'
                  }`}
                >
                  <div className="flex items-center gap-2.5 min-w-0 flex-1 mr-2">
                    <MessageSquare
                      className={`w-3.5 h-3.5 shrink-0 ${
                        isActive ? 'text-cyan-400' : 'text-slate-400 group-hover:text-slate-400'
                      }`}
                    />

                    {isEditing ? (
                      <form
                        onSubmit={(e) => handleSaveRename(conv.id, e)}
                        className="flex items-center gap-1 w-full"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <input
                          type="text"
                          value={editingTitle}
                          onChange={(e) => setEditingTitle(e.target.value)}
                          className="bg-slate-950 border border-cyan-500 rounded px-1.5 py-0.5 text-xs text-slate-100 w-full focus:outline-none font-sans"
                          autoFocus
                        />
                        <button
                          type="button"
                          onClick={(e) => handleSaveRename(conv.id, e)}
                          className="p-1 text-emerald-400 hover:text-emerald-300"
                        >
                          <Check className="w-3.5 h-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            setEditingId(null);
                          }}
                          className="p-1 text-slate-400 hover:text-slate-200"
                        >
                          <X className="w-3.5 h-3.5" />
                        </button>
                      </form>
                    ) : (
                      <span className="truncate block font-sans">{conv.title}</span>
                    )}
                  </div>

                  {/* Actions on hover or active */}
                  {!isEditing && (
                    <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
                      <button
                        onClick={(e) => handleStartRename(conv, e)}
                        className="p-1 text-slate-400 hover:text-slate-200 hover:bg-slate-800 rounded transition-colors"
                        title="Đổi tên"
                      >
                        <Edit3 className="w-3 h-3" />
                      </button>
                      <button
                        onClick={(e) => handleDelete(conv.id, e)}
                        className="p-1 text-slate-400 hover:text-rose-400 hover:bg-slate-800 rounded transition-colors"
                        title="Xóa đoạn chat"
                      >
                        <Trash2 className="w-3 h-3" />
                      </button>
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>

        {/* Footer: Secure Admin Console Button & Logout */}
        <div className="p-3 border-t border-slate-800/80 bg-slate-900/40 space-y-2">
          {adminSession.isAuthenticated ? (
            <div className="space-y-1.5">
              <button
                onClick={() => {
                  onOpenAdminConsole();
                  if (window.innerWidth < 1024) onClose();
                }}
                className="w-full flex items-center justify-between px-3 py-2 rounded-xl bg-gradient-to-r from-emerald-950/60 to-slate-900 border border-emerald-500/40 text-emerald-300 hover:border-emerald-400 transition-all text-xs font-semibold group"
              >
                <div className="flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4 text-emerald-400" />
                  <span>Admin Console (Đã mở)</span>
                </div>
                <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              </button>

              <button
                onClick={onAdminLogout}
                className="w-full flex items-center justify-center gap-1.5 py-1.5 text-[11px] text-slate-400 hover:text-rose-400 hover:bg-slate-900 rounded-lg transition-colors"
              >
                <LogOut className="w-3 h-3" />
                <span>Đăng xuất Admin</span>
              </button>
            </div>
          ) : (
            <button
              onClick={() => {
                onOpenAdminLogin();
              }}
              className="w-full flex items-center justify-between px-3 py-2 rounded-xl bg-slate-900/90 border border-slate-800 hover:border-cyan-500/50 hover:bg-slate-850 text-slate-300 hover:text-cyan-300 transition-all text-xs group"
            >
              <div className="flex items-center gap-2">
                <Lock className="w-4 h-4 text-cyan-400" />
                <span>Quản trị viên (Khóa)</span>
              </div>
              <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-slate-800 text-slate-400 group-hover:text-cyan-300">
                Xác thực
              </span>
            </button>
          )}

          <div className="flex items-center justify-between text-[10px] font-mono text-slate-400 pt-1 px-1">
            <span>NDAWG APEX ENGINE</span>
            <span className="flex items-center gap-1">
              <Sparkles className="w-2.5 h-2.5 text-cyan-400" />
              <span>v7.0 Stable</span>
            </span>
          </div>
        </div>
      </aside>
    </>
  );
}
