/**
 * NDAWG PRO — Google Workspace & Cloud Firestore Hub
 * Comprehensive integrated interface for Google Tasks, Google Drive, Google Chat,
 * and Firestore Cloud Synchronization with mandatory confirmation dialogs for destructive actions.
 */

import React, { useState, useEffect, useCallback } from 'react';
import {
  CheckSquare,
  HardDrive,
  MessageCircle,
  Database,
  Lock,
  LogOut,
  RefreshCw,
  Plus,
  Trash2,
  ExternalLink,
  Search,
  AlertTriangle,
  CheckCircle2,
  Clock,
  Send,
  Cloud,
  FileText,
  FileCode,
  Image as ImageIcon,
  Folder,
  Shield,
  Layers,
  ChevronRight,
  Info
} from 'lucide-react';
import { User } from 'firebase/auth';
import {
  initAuth,
  googleSignIn,
  logout,
  getAccessToken,
  fetchTaskLists,
  fetchTasks,
  createGoogleTask,
  toggleTaskCompletion,
  deleteGoogleTask,
  fetchDriveFiles,
  createDriveTextFile,
  deleteDriveFile,
  fetchChatSpaces,
  fetchChatMessages,
  sendChatMessage,
  syncItemToFirestore,
  fetchFirestoreSyncItems,
  removeFirestoreSyncItem,
  recordAuditToFirestore,
  GoogleTaskList,
  GoogleTask,
  GoogleDriveFile,
  GoogleChatSpace,
  GoogleChatMessage,
  WorkspaceSyncItem
} from '../services/googleWorkspaceService.ts';
import { testFirestoreConnection } from '../services/firebaseConfig.ts';

type WorkspaceSubTab = 'tasks' | 'drive' | 'chat' | 'firestore';

interface ConfirmationModalState {
  isOpen: boolean;
  title: string;
  description: string;
  confirmLabel: string;
  isDestructive: boolean;
  onConfirm: () => Promise<void>;
}

export function WorkspaceHubView() {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isAuthLoading, setIsAuthLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<WorkspaceSubTab>('tasks');
  const [feedbackMessage, setFeedbackMessage] = useState<{ type: 'success' | 'error' | 'info'; text: string } | null>(null);

  // Modal State for Confirmations (Mandatory user confirmation per Workspace Skill)
  const [confirmModal, setConfirmModal] = useState<ConfirmationModalState>({
    isOpen: false,
    title: '',
    description: '',
    confirmLabel: 'Xác nhận',
    isDestructive: false,
    onConfirm: async () => {}
  });

  // Google Tasks State
  const [taskLists, setTaskLists] = useState<GoogleTaskList[]>([]);
  const [selectedTaskListId, setSelectedTaskListId] = useState<string>('');
  const [tasks, setTasks] = useState<GoogleTask[]>([]);
  const [isTasksLoading, setIsTasksLoading] = useState(false);
  const [newTaskTitle, setNewTaskTitle] = useState('');
  const [newTaskNotes, setNewTaskNotes] = useState('');
  const [newTaskDue, setNewTaskDue] = useState('');

  // Google Drive State
  const [driveFiles, setDriveFiles] = useState<GoogleDriveFile[]>([]);
  const [isDriveLoading, setIsDriveLoading] = useState(false);
  const [driveSearchQuery, setDriveSearchQuery] = useState('');
  const [showCreateDocModal, setShowCreateDocModal] = useState(false);
  const [newDocName, setNewDocName] = useState('');
  const [newDocContent, setNewDocContent] = useState('');

  // Google Chat State
  const [chatSpaces, setChatSpaces] = useState<GoogleChatSpace[]>([]);
  const [selectedSpaceName, setSelectedSpaceName] = useState<string>('');
  const [chatMessages, setChatMessages] = useState<GoogleChatMessage[]>([]);
  const [isChatLoading, setIsChatLoading] = useState(false);
  const [chatNotConfigured, setChatNotConfigured] = useState(false);
  const [newMessageText, setNewMessageText] = useState('');

  // Firestore Sync State
  const [syncedItems, setSyncedItems] = useState<WorkspaceSyncItem[]>([]);
  const [isSyncLoading, setIsSyncLoading] = useState(false);
  const [firestoreStatus, setFirestoreStatus] = useState<string>('Chưa kiểm tra');

  // Monitor Authentication
  useEffect(() => {
    const unsubscribe = initAuth(
      (currentUser, accessToken) => {
        setUser(currentUser);
        setToken(accessToken);
        setIsAuthLoading(false);
      },
      () => {
        setUser(null);
        setToken(null);
        setIsAuthLoading(false);
      }
    );
    return () => unsubscribe();
  }, []);

  // Helper notification
  const showFeedback = (text: string, type: 'success' | 'error' | 'info' = 'success') => {
    setFeedbackMessage({ type, text });
    setTimeout(() => setFeedbackMessage(null), 5000);
  };

  // ------------------------------------
  // Google Tasks Handlers
  // ------------------------------------
  const loadTasksData = useCallback(async () => {
    if (!token) return;
    setIsTasksLoading(true);
    try {
      const lists = await fetchTaskLists();
      setTaskLists(lists);
      const activeListId = selectedTaskListId || (lists.length > 0 ? lists[0].id : '@default');
      setSelectedTaskListId(activeListId);
      if (activeListId) {
        const t = await fetchTasks(activeListId);
        setTasks(t);
      }
    } catch (err: any) {
      showFeedback(`Lỗi tải danh sách Tasks: ${err.message}`, 'error');
    } finally {
      setIsTasksLoading(false);
    }
  }, [token, selectedTaskListId]);

  const handleSelectTaskList = async (listId: string) => {
    setSelectedTaskListId(listId);
    setIsTasksLoading(true);
    try {
      const t = await fetchTasks(listId);
      setTasks(t);
    } catch (err: any) {
      showFeedback(`Lỗi tải task: ${err.message}`, 'error');
    } finally {
      setIsTasksLoading(false);
    }
  };

  const handleCreateTask = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTaskTitle.trim() || !selectedTaskListId) return;

    try {
      const created = await createGoogleTask(selectedTaskListId, {
        title: newTaskTitle.trim(),
        notes: newTaskNotes.trim() || undefined,
        due: newTaskDue ? new Date(newTaskDue).toISOString() : undefined
      });
      setTasks((prev) => [created, ...prev]);
      setNewTaskTitle('');
      setNewTaskNotes('');
      setNewTaskDue('');
      showFeedback(`Đã tạo công việc "${created.title}" thành công.`);
      if (user) {
        recordAuditToFirestore(user.uid, 'CREATE_TASK', `Tạo Google Task: ${created.title}`).catch(console.error);
      }
    } catch (err: any) {
      showFeedback(`Không thể tạo công việc: ${err.message}`, 'error');
    }
  };

  const handleToggleTask = async (task: GoogleTask) => {
    try {
      const updated = await toggleTaskCompletion(selectedTaskListId, task.id, task.status);
      setTasks((prev) => prev.map((t) => (t.id === task.id ? updated : t)));
      showFeedback(`Cập nhật trạng thái: "${updated.title}"`);
    } catch (err: any) {
      showFeedback(`Lỗi cập nhật: ${err.message}`, 'error');
    }
  };

  const promptDeleteTask = (task: GoogleTask) => {
    setConfirmModal({
      isOpen: true,
      title: 'Xóa Google Task',
      description: `Bạn có chắc chắn muốn xóa công việc "${task.title}" khỏi tài khoản Google Tasks của bạn? Hành động này không thể hoàn tác.`,
      confirmLabel: 'Xóa vĩnh viễn',
      isDestructive: true,
      onConfirm: async () => {
        try {
          await deleteGoogleTask(selectedTaskListId, task.id);
          setTasks((prev) => prev.filter((t) => t.id !== task.id));
          showFeedback(`Đã xóa công việc "${task.title}".`);
          if (user) {
            recordAuditToFirestore(user.uid, 'DELETE_TASK', `Xóa Google Task: ${task.title}`).catch(console.error);
          }
        } catch (err: any) {
          showFeedback(`Lỗi khi xóa công việc: ${err.message}`, 'error');
        } finally {
          setConfirmModal((prev) => ({ ...prev, isOpen: false }));
        }
      }
    });
  };

  const handleSyncTaskToFirestore = async (task: GoogleTask) => {
    if (!user) return;
    try {
      const item: WorkspaceSyncItem = {
        id: `task_${task.id.replace(/[^a-zA-Z0-9_\-]/g, '_')}`,
        userId: user.uid,
        service: 'tasks',
        resourceId: task.id,
        title: task.title,
        status: task.status,
        lastSyncedAt: new Date().toISOString()
      };
      await syncItemToFirestore(item);
      showFeedback(`Đã lưu "${task.title}" vào Cloud Firestore thành công.`);
      loadSyncedItems();
    } catch (err: any) {
      showFeedback(`Lỗi lưu vào Firestore: ${err.message}`, 'error');
    }
  };

  // ------------------------------------
  // Google Drive Handlers
  // ------------------------------------
  const loadDriveData = useCallback(async (query = driveSearchQuery) => {
    if (!token) return;
    setIsDriveLoading(true);
    try {
      const files = await fetchDriveFiles(query, 25);
      setDriveFiles(files);
    } catch (err: any) {
      showFeedback(`Lỗi tải tệp Google Drive: ${err.message}`, 'error');
    } finally {
      setIsDriveLoading(false);
    }
  }, [token, driveSearchQuery]);

  const handleCreateDriveDoc = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newDocName.trim()) return;

    try {
      const filename = newDocName.endsWith('.md') ? newDocName : `${newDocName}.md`;
      const created = await createDriveTextFile(filename, newDocContent);
      setDriveFiles((prev) => [created, ...prev]);
      setShowCreateDocModal(false);
      setNewDocName('');
      setNewDocContent('');
      showFeedback(`Đã tải tài liệu "${created.name}" lên Google Drive!`);
      if (user) {
        recordAuditToFirestore(user.uid, 'CREATE_DRIVE_FILE', `Tạo file Google Drive: ${created.name}`).catch(console.error);
      }
    } catch (err: any) {
      showFeedback(`Lỗi tạo tệp Drive: ${err.message}`, 'error');
    }
  };

  const promptDeleteDriveFile = (file: GoogleDriveFile) => {
    setConfirmModal({
      isOpen: true,
      title: 'Xóa tệp Google Drive',
      description: `Bạn có chắc chắn muốn xóa tệp "${file.name}" khỏi Google Drive? Tệp sẽ bị xóa khỏi tài khoản của bạn.`,
      confirmLabel: 'Xác nhận xóa tệp',
      isDestructive: true,
      onConfirm: async () => {
        try {
          await deleteDriveFile(file.id);
          setDriveFiles((prev) => prev.filter((f) => f.id !== file.id));
          showFeedback(`Đã xóa tệp "${file.name}" khỏi Google Drive.`);
          if (user) {
            recordAuditToFirestore(user.uid, 'DELETE_DRIVE_FILE', `Xóa file Drive: ${file.name}`).catch(console.error);
          }
        } catch (err: any) {
          showFeedback(`Lỗi khi xóa tệp Drive: ${err.message}`, 'error');
        } finally {
          setConfirmModal((prev) => ({ ...prev, isOpen: false }));
        }
      }
    });
  };

  const handleSyncDriveFileToFirestore = async (file: GoogleDriveFile) => {
    if (!user) return;
    try {
      const item: WorkspaceSyncItem = {
        id: `drive_${file.id.replace(/[^a-zA-Z0-9_\-]/g, '_')}`,
        userId: user.uid,
        service: 'drive',
        resourceId: file.id,
        title: file.name,
        status: file.mimeType,
        lastSyncedAt: new Date().toISOString()
      };
      await syncItemToFirestore(item);
      showFeedback(`Đã lưu bookmark "${file.name}" vào Cloud Firestore.`);
      loadSyncedItems();
    } catch (err: any) {
      showFeedback(`Lỗi đồng bộ Firestore: ${err.message}`, 'error');
    }
  };

  // ------------------------------------
  // Google Chat Handlers
  // ------------------------------------
  const loadChatData = useCallback(async () => {
    if (!token) return;
    setIsChatLoading(true);
    setChatNotConfigured(false);
    try {
      const result = await fetchChatSpaces();
      if (result.notConfigured) {
        setChatNotConfigured(true);
        setChatSpaces([]);
      } else {
        setChatSpaces(result.spaces);
        if (result.spaces.length > 0 && !selectedSpaceName) {
          setSelectedSpaceName(result.spaces[0].name);
          const msgs = await fetchChatMessages(result.spaces[0].name);
          setChatMessages(msgs);
        }
      }
    } catch (err: any) {
      showFeedback(`Lỗi tải Google Chat: ${err.message}`, 'error');
    } finally {
      setIsChatLoading(false);
    }
  }, [token, selectedSpaceName]);

  const handleSelectSpace = async (spaceName: string) => {
    setSelectedSpaceName(spaceName);
    setIsChatLoading(true);
    try {
      const msgs = await fetchChatMessages(spaceName);
      setChatMessages(msgs);
    } catch (err: any) {
      showFeedback(`Lỗi tải tin nhắn: ${err.message}`, 'error');
    } finally {
      setIsChatLoading(false);
    }
  };

  const promptSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessageText.trim() || !selectedSpaceName) return;

    setConfirmModal({
      isOpen: true,
      title: 'Gửi tin nhắn Google Chat',
      description: `Bạn có xác nhận gửi tin nhắn sau đến không gian "${selectedSpaceName}" với tư cách người dùng hiện tại không?\n\n"${newMessageText.trim()}"`,
      confirmLabel: 'Gửi tin nhắn',
      isDestructive: false,
      onConfirm: async () => {
        try {
          const sent = await sendChatMessage(selectedSpaceName, newMessageText.trim());
          setChatMessages((prev) => [...prev, sent]);
          setNewMessageText('');
          showFeedback('Tin nhắn đã được gửi thành công.');
          if (user) {
            recordAuditToFirestore(user.uid, 'SEND_CHAT_MESSAGE', `Gửi tin nhắn tới ${selectedSpaceName}`).catch(console.error);
          }
        } catch (err: any) {
          showFeedback(`Lỗi gửi tin nhắn: ${err.message}`, 'error');
        } finally {
          setConfirmModal((prev) => ({ ...prev, isOpen: false }));
        }
      }
    });
  };

  // ------------------------------------
  // Firestore Sync & Governance Handlers
  // ------------------------------------
  const loadSyncedItems = useCallback(async () => {
    if (!user) return;
    setIsSyncLoading(true);
    try {
      const items = await fetchFirestoreSyncItems(user.uid);
      setSyncedItems(items);
    } catch (err: any) {
      console.warn('Could not list sync items:', err);
    } finally {
      setIsSyncLoading(false);
    }
  }, [user]);

  const handleTestFirestorePing = async () => {
    setFirestoreStatus('Đang kiểm tra kết nối...');
    const res = await testFirestoreConnection();
    setFirestoreStatus(res.message);
    if (res.connected) {
      showFeedback(res.message, 'success');
    } else {
      showFeedback(res.message, 'error');
    }
  };

  const handleRemoveSyncItem = async (itemId: string) => {
    if (!user) return;
    try {
      await removeFirestoreSyncItem(user.uid, itemId);
      setSyncedItems((prev) => prev.filter((i) => i.id !== itemId));
      showFeedback('Đã xóa bản ghi đồng bộ khỏi Firestore.');
    } catch (err: any) {
      showFeedback(`Lỗi xóa: ${err.message}`, 'error');
    }
  };

  // Load appropriate data when tab changes
  useEffect(() => {
    if (!token) return;
    if (activeTab === 'tasks') loadTasksData();
    if (activeTab === 'drive') loadDriveData();
    if (activeTab === 'chat') loadChatData();
    if (activeTab === 'firestore') {
      loadSyncedItems();
      handleTestFirestorePing();
    }
  }, [activeTab, token, loadTasksData, loadDriveData, loadChatData, loadSyncedItems]);

  // Auth Actions
  const handleSignIn = async () => {
    try {
      setIsAuthLoading(true);
      const res = await googleSignIn();
      if (res) {
        setUser(res.user);
        setToken(res.accessToken);
        showFeedback(`Đăng nhập Google thành công: ${res.user.email}`);
      } else {
        showFeedback('Đã hủy đăng nhập Google (cửa sổ đã đóng).', 'info');
      }
    } catch (err: any) {
      showFeedback(`Đăng nhập thất bại: ${err.message}`, 'error');
    } finally {
      setIsAuthLoading(false);
    }
  };

  const handleSignOut = async () => {
    try {
      await logout();
      setUser(null);
      setToken(null);
      setTaskLists([]);
      setTasks([]);
      setDriveFiles([]);
      setChatSpaces([]);
      setSyncedItems([]);
      showFeedback('Đã đăng xuất tài khoản Google.');
    } catch (err: any) {
      showFeedback(`Lỗi đăng xuất: ${err.message}`, 'error');
    }
  };

  // If loading auth state
  if (isAuthLoading) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center p-12 text-center text-slate-400">
        <RefreshCw className="w-8 h-8 text-cyan-400 animate-spin mb-3" />
        <p className="text-sm font-mono">Đang khởi tạo kết nối Google Workspace & Firebase Auth...</p>
      </div>
    );
  }

  // Not signed in state — render official Sign in with Google button
  if (!user || !token) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center p-8 text-center bg-slate-950">
        <div className="max-w-md w-full bg-slate-900/80 border border-slate-800 rounded-3xl p-8 shadow-2xl backdrop-blur-xl space-y-6">
          <div className="w-16 h-16 mx-auto rounded-2xl bg-cyan-950/60 border border-cyan-800/80 flex items-center justify-center text-cyan-400 shadow-lg shadow-cyan-950/50">
            <Layers className="w-8 h-8" />
          </div>

          <div className="space-y-2">
            <h2 className="text-xl font-bold text-white tracking-tight">
              Google Workspace & Cloud Firestore
            </h2>
            <p className="text-xs text-slate-400 leading-relaxed font-sans">
              Đăng nhập với Google để kích hoạt quyền truy cập được cấp phép cho <strong>Google Tasks</strong>, <strong>Google Drive</strong>, và <strong>Google Chat</strong>, kèm bảo vệ đồng bộ dữ liệu vào <strong>Cloud Firestore</strong>.
            </p>
          </div>

          <div className="p-3 bg-slate-950/60 rounded-xl border border-slate-800/60 text-left space-y-1.5 text-xs text-slate-400">
            <div className="flex items-center gap-2 text-cyan-300 font-medium font-mono text-[11px]">
              <Shield className="w-3.5 h-3.5" />
              <span>Tiêu chuẩn bảo mật NDAWG PRO</span>
            </div>
            <p className="text-[11px] text-slate-400 leading-normal">
              Token truy cập chỉ lưu trong bộ nhớ tạm (In-memory token caching). Mọi thao tác cập nhật hoặc xóa dữ liệu đều yêu cầu xác nhận rõ ràng từ bạn.
            </p>
          </div>

          {/* Official Sign in with Google Button Styled per Skill Guidelines */}
          <div className="flex justify-center pt-2">
            <button
              onClick={handleSignIn}
              className="group relative inline-flex items-center justify-center gap-3 px-6 py-3 rounded-full bg-white hover:bg-slate-50 text-slate-800 font-medium text-sm transition-all shadow-md hover:shadow-lg active:scale-98 cursor-pointer"
            >
              <svg version="1.1" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 48 48" className="w-5 h-5 shrink-0">
                <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"></path>
                <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"></path>
                <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"></path>
                <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"></path>
              </svg>
              <span className="font-sans font-semibold">Sign in with Google</span>
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Helper file icon renderer
  const renderFileIcon = (mimeType: string) => {
    if (mimeType.includes('document') || mimeType.includes('text')) return <FileText className="w-4 h-4 text-sky-400" />;
    if (mimeType.includes('image')) return <ImageIcon className="w-4 h-4 text-emerald-400" />;
    if (mimeType.includes('json') || mimeType.includes('javascript') || mimeType.includes('typescript')) return <FileCode className="w-4 h-4 text-amber-400" />;
    if (mimeType.includes('folder')) return <Folder className="w-4 h-4 text-indigo-400" />;
    return <FileText className="w-4 h-4 text-slate-400" />;
  };

  return (
    <div className="flex-1 flex flex-col h-full bg-slate-950 text-slate-100 overflow-hidden font-sans">
      {/* Top Banner / User Credentials Bar */}
      <header className="px-6 py-4 bg-slate-900/60 border-b border-slate-800/80 backdrop-blur-md flex flex-wrap items-center justify-between gap-4 shrink-0">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-cyan-600 to-sky-500 flex items-center justify-center text-slate-950 font-bold shadow-md shadow-cyan-900/30">
            {user.photoURL ? (
              <img src={user.photoURL} alt={user.displayName || 'User'} className="w-10 h-10 rounded-xl object-cover" />
            ) : (
              (user.displayName || user.email || 'U')[0].toUpperCase()
            )}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-sm font-semibold text-white">{user.displayName || 'Google Workspace User'}</h2>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-emerald-950/80 border border-emerald-800/80 text-emerald-300">
                OAuth Active
              </span>
            </div>
            <p className="text-xs text-slate-400 font-mono">{user.email}</p>
          </div>
        </div>

        {/* Global Controls & Sign Out */}
        <div className="flex items-center gap-2">
          <div className="hidden md:flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-950/60 border border-slate-800 text-xs font-mono text-slate-400">
            <Cloud className="w-3.5 h-3.5 text-cyan-400" />
            <span>Firestore: gen-lang-client-0286279859</span>
          </div>

          <button
            onClick={handleSignOut}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-900 border border-slate-800 hover:border-rose-500/50 hover:bg-rose-950/30 text-slate-300 hover:text-rose-300 text-xs font-mono transition-colors cursor-pointer"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span>Đăng xuất</span>
          </button>
        </div>
      </header>

      {/* Feedback Banner */}
      {feedbackMessage && (
        <div
          className={`px-6 py-2 text-xs font-mono flex items-center justify-between border-b transition-all ${
            feedbackMessage.type === 'error'
              ? 'bg-rose-950/70 border-rose-800/80 text-rose-200'
              : feedbackMessage.type === 'info'
              ? 'bg-sky-950/70 border-sky-800/80 text-sky-200'
              : 'bg-emerald-950/70 border-emerald-800/80 text-emerald-200'
          }`}
        >
          <span>{feedbackMessage.text}</span>
          <button onClick={() => setFeedbackMessage(null)} className="text-slate-400 hover:text-white ml-2">
            ✕
          </button>
        </div>
      )}

      {/* Main Tab Navigation */}
      <div className="px-6 border-b border-slate-800/80 bg-slate-900/30 flex items-center gap-2 overflow-x-auto shrink-0">
        <button
          onClick={() => setActiveTab('tasks')}
          className={`flex items-center gap-2 py-3 px-4 text-xs font-semibold border-b-2 transition-colors cursor-pointer whitespace-nowrap ${
            activeTab === 'tasks'
              ? 'border-cyan-400 text-cyan-300 bg-cyan-950/20'
              : 'border-transparent text-slate-400 hover:text-slate-200'
          }`}
        >
          <CheckSquare className="w-4 h-4" />
          <span>Google Tasks</span>
        </button>

        <button
          onClick={() => setActiveTab('drive')}
          className={`flex items-center gap-2 py-3 px-4 text-xs font-semibold border-b-2 transition-colors cursor-pointer whitespace-nowrap ${
            activeTab === 'drive'
              ? 'border-cyan-400 text-cyan-300 bg-cyan-950/20'
              : 'border-transparent text-slate-400 hover:text-slate-200'
          }`}
        >
          <HardDrive className="w-4 h-4" />
          <span>Google Drive</span>
        </button>

        <button
          onClick={() => setActiveTab('chat')}
          className={`flex items-center gap-2 py-3 px-4 text-xs font-semibold border-b-2 transition-colors cursor-pointer whitespace-nowrap ${
            activeTab === 'chat'
              ? 'border-cyan-400 text-cyan-300 bg-cyan-950/20'
              : 'border-transparent text-slate-400 hover:text-slate-200'
          }`}
        >
          <MessageCircle className="w-4 h-4" />
          <span>Google Chat</span>
        </button>

        <button
          onClick={() => setActiveTab('firestore')}
          className={`flex items-center gap-2 py-3 px-4 text-xs font-semibold border-b-2 transition-colors cursor-pointer whitespace-nowrap ${
            activeTab === 'firestore'
              ? 'border-cyan-400 text-cyan-300 bg-cyan-950/20'
              : 'border-transparent text-slate-400 hover:text-slate-200'
          }`}
        >
          <Database className="w-4 h-4" />
          <span>Cloud Firestore & Sync</span>
        </button>
      </div>

      {/* Tab Contents Scroll Area */}
      <div className="flex-1 overflow-y-auto p-6">
        {/* ==================================================== */}
        {/* TAB 1: GOOGLE TASKS */}
        {/* ==================================================== */}
        {activeTab === 'tasks' && (
          <div className="max-w-5xl mx-auto space-y-6">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-slate-900/60 p-4 rounded-2xl border border-slate-800">
              <div className="flex items-center gap-3">
                <label className="text-xs font-mono text-slate-400">Danh sách:</label>
                <select
                  value={selectedTaskListId}
                  onChange={(e) => handleSelectTaskList(e.target.value)}
                  className="bg-slate-950 border border-slate-700 rounded-xl px-3 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-cyan-400"
                >
                  {taskLists.map((l) => (
                    <option key={l.id} value={l.id}>
                      {l.title}
                    </option>
                  ))}
                </select>
              </div>

              <button
                onClick={loadTasksData}
                disabled={isTasksLoading}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs text-slate-200 font-mono transition-colors"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${isTasksLoading ? 'animate-spin text-cyan-400' : ''}`} />
                <span>Làm mới</span>
              </button>
            </div>

            {/* Create Task Form */}
            <form onSubmit={handleCreateTask} className="bg-slate-900/40 p-4 rounded-2xl border border-slate-800 space-y-3">
              <h3 className="text-xs font-mono uppercase tracking-wider text-slate-400 flex items-center gap-2">
                <Plus className="w-3.5 h-3.5 text-cyan-400" />
                <span>Thêm Công Việc Mới Vào Google Tasks</span>
              </h3>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="sm:col-span-2">
                  <input
                    type="text"
                    placeholder="Tiêu đề công việc (vd: Đánh giá mô hình AI)..."
                    value={newTaskTitle}
                    onChange={(e) => setNewTaskTitle(e.target.value)}
                    required
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500"
                  />
                </div>
                <div>
                  <input
                    type="datetime-local"
                    value={newTaskDue}
                    onChange={(e) => setNewTaskDue(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-300 focus:outline-none focus:border-cyan-500"
                  />
                </div>
              </div>

              <div className="flex gap-2">
                <input
                  type="text"
                  placeholder="Ghi chú thêm (tùy chọn)..."
                  value={newTaskNotes}
                  onChange={(e) => setNewTaskNotes(e.target.value)}
                  className="flex-1 bg-slate-950 border border-slate-800 rounded-xl px-3 py-1.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500"
                />
                <button
                  type="submit"
                  disabled={!newTaskTitle.trim()}
                  className="px-4 py-1.5 rounded-xl bg-cyan-600 hover:bg-cyan-500 disabled:opacity-40 text-slate-950 font-semibold text-xs transition-colors cursor-pointer"
                >
                  Tạo Task
                </button>
              </div>
            </form>

            {/* Tasks List */}
            <div className="space-y-2">
              {isTasksLoading ? (
                <div className="p-8 text-center text-slate-500 text-xs font-mono">
                  <RefreshCw className="w-5 h-5 text-cyan-400 animate-spin mx-auto mb-2" />
                  Đang đồng bộ Google Tasks...
                </div>
              ) : tasks.length === 0 ? (
                <div className="p-8 text-center text-slate-500 text-xs font-mono bg-slate-900/20 rounded-2xl border border-slate-800/50">
                  Không có công việc nào trong danh sách này.
                </div>
              ) : (
                tasks.map((task) => (
                  <div
                    key={task.id}
                    className="flex items-center justify-between gap-4 p-3.5 rounded-xl bg-slate-900/60 border border-slate-800/80 hover:border-slate-700 transition-colors"
                  >
                    <div className="flex items-start gap-3 min-w-0">
                      <button
                        onClick={() => handleToggleTask(task)}
                        className={`mt-0.5 p-1 rounded-md transition-colors cursor-pointer ${
                          task.status === 'completed'
                            ? 'bg-emerald-950 text-emerald-400 border border-emerald-800'
                            : 'bg-slate-950 text-slate-500 border border-slate-800 hover:border-cyan-500'
                        }`}
                      >
                        <CheckCircle2 className="w-4 h-4" />
                      </button>

                      <div className="min-w-0">
                        <div
                          className={`text-xs font-medium truncate ${
                            task.status === 'completed' ? 'line-through text-slate-500' : 'text-slate-100'
                          }`}
                        >
                          {task.title}
                        </div>
                        {task.notes && <p className="text-[11px] text-slate-400 mt-0.5">{task.notes}</p>}
                        {task.due && (
                          <div className="flex items-center gap-1 text-[10px] text-amber-400 font-mono mt-1">
                            <Clock className="w-3 h-3" />
                            <span>Hạn: {new Date(task.due).toLocaleDateString()}</span>
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      <button
                        onClick={() => handleSyncTaskToFirestore(task)}
                        className="px-2 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-cyan-400 text-[11px] font-mono transition-colors"
                        title="Lưu bookmark vào Cloud Firestore"
                      >
                        Sync Firestore
                      </button>
                      <button
                        onClick={() => promptDeleteTask(task)}
                        className="p-1.5 rounded-lg text-slate-400 hover:text-rose-400 hover:bg-rose-950/30 transition-colors"
                        title="Xóa công việc (Yêu cầu xác nhận)"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        )}

        {/* ==================================================== */}
        {/* TAB 2: GOOGLE DRIVE */}
        {/* ==================================================== */}
        {activeTab === 'drive' && (
          <div className="max-w-5xl mx-auto space-y-6">
            {/* Drive Search and Actions */}
            <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-slate-900/60 p-4 rounded-2xl border border-slate-800">
              <div className="relative flex-1 w-full">
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Tìm kiếm tệp trong Google Drive..."
                  value={driveSearchQuery}
                  onChange={(e) => setDriveSearchQuery(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && loadDriveData(driveSearchQuery)}
                  className="w-full pl-9 pr-4 py-2 bg-slate-950 border border-slate-700 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-cyan-400"
                />
              </div>

              <div className="flex items-center gap-2 shrink-0 w-full sm:w-auto">
                <button
                  onClick={() => loadDriveData(driveSearchQuery)}
                  disabled={isDriveLoading}
                  className="flex-1 sm:flex-none flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs text-slate-200 font-mono transition-colors"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${isDriveLoading ? 'animate-spin text-cyan-400' : ''}`} />
                  <span>Tìm kiếm</span>
                </button>

                <button
                  onClick={() => setShowCreateDocModal(true)}
                  className="flex-1 sm:flex-none flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-slate-950 font-semibold text-xs transition-colors cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Tạo Tệp Drive</span>
                </button>
              </div>
            </div>

            {/* Create File Modal / Drawer */}
            {showCreateDocModal && (
              <div className="bg-slate-900/90 border border-cyan-800/80 p-5 rounded-2xl space-y-3">
                <div className="flex items-center justify-between">
                  <h3 className="text-xs font-mono uppercase tracking-wider text-cyan-300 font-semibold">
                    Tạo Tài Liệu Mới Lên Google Drive
                  </h3>
                  <button onClick={() => setShowCreateDocModal(false)} className="text-slate-400 hover:text-white">
                    ✕
                  </button>
                </div>
                <form onSubmit={handleCreateDriveDoc} className="space-y-3">
                  <input
                    type="text"
                    placeholder="Tên tệp (vd: apex-analysis-report.md)..."
                    value={newDocName}
                    onChange={(e) => setNewDocName(e.target.value)}
                    required
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-cyan-500"
                  />
                  <textarea
                    rows={4}
                    placeholder="Nội dung văn bản hoặc markdown..."
                    value={newDocContent}
                    onChange={(e) => setNewDocContent(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-cyan-500 font-mono"
                  />
                  <div className="flex justify-end gap-2">
                    <button
                      type="button"
                      onClick={() => setShowCreateDocModal(false)}
                      className="px-3 py-1.5 rounded-xl bg-slate-800 text-xs text-slate-300"
                    >
                      Hủy
                    </button>
                    <button
                      type="submit"
                      className="px-4 py-1.5 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-slate-950 font-semibold text-xs"
                    >
                      Tải Lên Drive
                    </button>
                  </div>
                </form>
              </div>
            )}

            {/* Drive Files Grid */}
            <div className="space-y-2">
              {isDriveLoading ? (
                <div className="p-8 text-center text-slate-500 text-xs font-mono">
                  <RefreshCw className="w-5 h-5 text-cyan-400 animate-spin mx-auto mb-2" />
                  Đang đồng bộ danh sách tệp Google Drive...
                </div>
              ) : driveFiles.length === 0 ? (
                <div className="p-8 text-center text-slate-500 text-xs font-mono bg-slate-900/20 rounded-2xl border border-slate-800/50">
                  Không tìm thấy tệp nào phù hợp trong Google Drive.
                </div>
              ) : (
                driveFiles.map((file) => (
                  <div
                    key={file.id}
                    className="flex items-center justify-between gap-4 p-3 rounded-xl bg-slate-900/60 border border-slate-800/80 hover:border-slate-700 transition-colors"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="p-2 rounded-lg bg-slate-950 border border-slate-800 shrink-0">
                        {renderFileIcon(file.mimeType)}
                      </div>
                      <div className="min-w-0">
                        <div className="text-xs font-medium text-slate-200 truncate">{file.name}</div>
                        <div className="flex items-center gap-2 text-[10px] text-slate-400 font-mono mt-0.5">
                          <span>{new Date(file.modifiedTime).toLocaleDateString()}</span>
                          {file.size && <span>• {(Number(file.size) / 1024).toFixed(1)} KB</span>}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      {file.webViewLink && (
                        <a
                          href={file.webViewLink}
                          target="_blank"
                          rel="noreferrer"
                          className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-mono transition-colors"
                        >
                          <ExternalLink className="w-3 h-3 text-cyan-400" />
                          <span>Mở</span>
                        </a>
                      )}
                      <button
                        onClick={() => handleSyncDriveFileToFirestore(file)}
                        className="px-2 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-cyan-400 text-[11px] font-mono transition-colors"
                        title="Đồng bộ bookmark vào Firestore"
                      >
                        Sync Firestore
                      </button>
                      <button
                        onClick={() => promptDeleteDriveFile(file)}
                        className="p-1.5 rounded-lg text-slate-400 hover:text-rose-400 hover:bg-rose-950/30 transition-colors"
                        title="Xóa tệp (Yêu cầu xác nhận)"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        )}

        {/* ==================================================== */}
        {/* TAB 3: GOOGLE CHAT */}
        {/* ==================================================== */}
        {activeTab === 'chat' && (
          <div className="max-w-5xl mx-auto space-y-6">
            {chatNotConfigured ? (
              <div className="bg-amber-950/40 border border-amber-800/80 rounded-2xl p-6 space-y-3">
                <div className="flex items-center gap-2 text-amber-400 font-semibold text-sm">
                  <AlertTriangle className="w-5 h-5 shrink-0" />
                  <span>Cấu hình Google Chat App (Yêu cầu một lần)</span>
                </div>
                <p className="text-xs text-amber-200 leading-relaxed font-sans">
                  Google Chat API (<code>chat.googleapis.com</code>) yêu cầu cấu hình Chat App trong Google Cloud Console trước khi gọi bằng thông tin xác thực người dùng. Ngoài ra, tính năng này áp dụng cho tài khoản <strong>Google Workspace Business/Enterprise</strong>.
                </p>
                <div className="pt-2">
                  <a
                    href="https://console.cloud.google.com/apis/api/chat.googleapis.com/hangouts-chat?project=gen-lang-client-0286279859"
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-semibold text-xs transition-colors"
                  >
                    <span>Mở trang cấu hình Chat API trên Google Cloud Console</span>
                    <ExternalLink className="w-3.5 h-3.5" />
                  </a>
                </div>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {/* Left: Spaces List */}
                <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <h3 className="text-xs font-mono uppercase tracking-wider text-slate-400">
                      Không Gian Trò Chuyện
                    </h3>
                    <button
                      onClick={loadChatData}
                      disabled={isChatLoading}
                      className="p-1 text-slate-400 hover:text-cyan-400"
                    >
                      <RefreshCw className={`w-3.5 h-3.5 ${isChatLoading ? 'animate-spin' : ''}`} />
                    </button>
                  </div>

                  <div className="space-y-1">
                    {chatSpaces.length === 0 ? (
                      <p className="text-xs text-slate-500 font-mono py-4 text-center">
                        Không tìm thấy không gian Chat nào.
                      </p>
                    ) : (
                      chatSpaces.map((sp) => (
                        <button
                          key={sp.name}
                          onClick={() => handleSelectSpace(sp.name)}
                          className={`w-full text-left p-2.5 rounded-xl text-xs transition-colors cursor-pointer ${
                            selectedSpaceName === sp.name
                              ? 'bg-cyan-950/60 border border-cyan-800 text-cyan-200 font-semibold'
                              : 'text-slate-300 hover:bg-slate-800'
                          }`}
                        >
                          <div className="truncate font-sans">{sp.displayName || sp.name}</div>
                          <div className="text-[10px] text-slate-400 font-mono mt-0.5">{sp.type || 'SPACE'}</div>
                        </button>
                      ))
                    )}
                  </div>
                </div>

                {/* Right: Message Stream & Composer */}
                <div className="md:col-span-2 bg-slate-900/60 border border-slate-800 rounded-2xl flex flex-col h-[500px]">
                  <div className="p-3.5 border-b border-slate-800/80 flex items-center justify-between text-xs font-mono">
                    <span className="text-slate-300 font-semibold truncate">
                      {selectedSpaceName || 'Chọn một không gian'}
                    </span>
                    <span className="text-[10px] text-slate-400">Google Chat v1</span>
                  </div>

                  {/* Messages Feed */}
                  <div className="flex-1 overflow-y-auto p-4 space-y-3">
                    {chatMessages.length === 0 ? (
                      <div className="h-full flex items-center justify-center text-xs text-slate-500 font-mono">
                        Chưa có tin nhắn trong không gian này.
                      </div>
                    ) : (
                      chatMessages.map((msg) => (
                        <div key={msg.name} className="p-3 rounded-xl bg-slate-950/80 border border-slate-800/80 space-y-1">
                          <div className="flex items-center justify-between text-[10px] font-mono text-slate-400">
                            <span className="font-semibold text-cyan-400">{msg.sender?.displayName || 'Thành viên'}</span>
                            <span>{new Date(msg.createTime).toLocaleTimeString()}</span>
                          </div>
                          <p className="text-xs text-slate-200 font-sans">{msg.text || msg.formattedText}</p>
                        </div>
                      ))
                    )}
                  </div>

                  {/* Send Message Form (Protected with Confirmation Modal) */}
                  <form onSubmit={promptSendMessage} className="p-3 border-t border-slate-800 flex gap-2">
                    <input
                      type="text"
                      placeholder="Nhập tin nhắn (Yêu cầu xác nhận trước khi gửi)..."
                      value={newMessageText}
                      onChange={(e) => setNewMessageText(e.target.value)}
                      disabled={!selectedSpaceName}
                      className="flex-1 bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-cyan-500"
                    />
                    <button
                      type="submit"
                      disabled={!newMessageText.trim() || !selectedSpaceName}
                      className="px-4 py-2 rounded-xl bg-cyan-600 hover:bg-cyan-500 disabled:opacity-40 text-slate-950 font-semibold text-xs flex items-center gap-1 cursor-pointer"
                    >
                      <Send className="w-3.5 h-3.5" />
                      <span>Gửi</span>
                    </button>
                  </form>
                </div>
              </div>
            )}
          </div>
        )}

        {/* ==================================================== */}
        {/* TAB 4: CLOUD FIRESTORE & SYNC */}
        {/* ==================================================== */}
        {activeTab === 'firestore' && (
          <div className="max-w-5xl mx-auto space-y-6">
            {/* Status Panel */}
            <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-5 space-y-4">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-cyan-950 border border-cyan-800/80 flex items-center justify-center text-cyan-400">
                    <Database className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-sm font-semibold text-white">Cloud Firestore Provisioning</h3>
                    <p className="text-xs text-slate-400 font-mono">
                      Database: ai-studio-ndawgproapexgove-c6711b60-456c-4524-8c44-e72ab78bf350
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={handleTestFirestorePing}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs text-slate-200 font-mono"
                  >
                    <RefreshCw className="w-3.5 h-3.5 text-cyan-400" />
                    <span>Ping Connection</span>
                  </button>
                </div>
              </div>

              <div className="p-3 bg-slate-950/80 rounded-xl border border-slate-800 flex items-center gap-2 text-xs font-mono">
                <span className="text-slate-400">Trạng thái kết nối:</span>
                <span className="text-cyan-300 font-medium">{firestoreStatus}</span>
              </div>
            </div>

            {/* Synced Workspace Items Table */}
            <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-5 space-y-4">
              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <h3 className="text-sm font-semibold text-white flex items-center gap-2">
                    <Cloud className="w-4 h-4 text-cyan-400" />
                    <span>Bản Ghi Đồng Bộ Google Workspace Trong Firestore</span>
                  </h3>
                  <p className="text-xs text-slate-400">
                    Lưu tại collection: <code>/users/{user.uid}/workspaceSync</code> (quyền sở hữu duy nhất)
                  </p>
                </div>

                <button
                  onClick={loadSyncedItems}
                  disabled={isSyncLoading}
                  className="p-1.5 text-slate-400 hover:text-white"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${isSyncLoading ? 'animate-spin text-cyan-400' : ''}`} />
                </button>
              </div>

              {syncedItems.length === 0 ? (
                <div className="p-6 text-center text-xs text-slate-500 font-mono bg-slate-950/40 rounded-xl border border-slate-800/40">
                  Chưa có bản ghi nào được đồng bộ vào Firestore. Hãy nhấn "Sync Firestore" trên bất kỳ Task hoặc File Drive nào!
                </div>
              ) : (
                <div className="space-y-2">
                  {syncedItems.map((item) => (
                    <div
                      key={item.id}
                      className="flex items-center justify-between gap-3 p-3 rounded-xl bg-slate-950/70 border border-slate-800"
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        <span className="px-2 py-0.5 rounded bg-slate-800 text-[10px] font-mono text-cyan-300 uppercase">
                          {item.service}
                        </span>
                        <div className="min-w-0">
                          <div className="text-xs font-medium text-white truncate">{item.title}</div>
                          <div className="text-[10px] text-slate-500 font-mono">
                            ID: {item.resourceId} • Đồng bộ: {new Date(item.lastSyncedAt).toLocaleString()}
                          </div>
                        </div>
                      </div>

                      <button
                        onClick={() => handleRemoveSyncItem(item.id)}
                        className="p-1.5 text-slate-400 hover:text-rose-400 transition-colors"
                        title="Xóa bản ghi Firestore"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* ==================================================== */}
      {/* MANDATORY USER CONFIRMATION MODAL */}
      {/* ==================================================== */}
      {confirmModal.isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in duration-150">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl max-w-md w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-center gap-3">
              <div
                className={`p-3 rounded-2xl border ${
                  confirmModal.isDestructive
                    ? 'bg-rose-950/50 border-rose-800/80 text-rose-400'
                    : 'bg-cyan-950/50 border-cyan-800/80 text-cyan-400'
                }`}
              >
                <AlertTriangle className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-white tracking-tight">{confirmModal.title}</h3>
                <p className="text-[11px] text-slate-400 font-mono">Xác thực thao tác Workspace có ảnh hưởng</p>
              </div>
            </div>

            <p className="text-xs text-slate-300 leading-relaxed font-sans whitespace-pre-wrap">
              {confirmModal.description}
            </p>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setConfirmModal((prev) => ({ ...prev, isOpen: false }))}
                className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs text-slate-300 font-medium transition-colors cursor-pointer"
              >
                Hủy bỏ
              </button>
              <button
                type="button"
                onClick={confirmModal.onConfirm}
                className={`px-4 py-2 rounded-xl font-semibold text-xs transition-colors cursor-pointer ${
                  confirmModal.isDestructive
                    ? 'bg-rose-600 hover:bg-rose-500 text-white'
                    : 'bg-cyan-600 hover:bg-cyan-500 text-slate-950'
                }`}
              >
                {confirmModal.confirmLabel}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
