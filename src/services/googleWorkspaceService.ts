/**
 * NDAWG PRO — Google Workspace Service
 * Integrates Google Tasks, Google Drive, and Google Chat via Client-Side Bearer Tokens
 * Strictly conforms to Workspace Integration Skill:
 * - Scopes configured via set_up_oauth
 * - In-memory token caching (NO localStorage/sessionStorage for access tokens)
 * - Confirmation flow on destructive mutations
 * - Cloud Firestore synchronization & auditing
 */

import {
  signInWithPopup,
  GoogleAuthProvider,
  onAuthStateChanged,
  User,
  signOut
} from 'firebase/auth';
import {
  collection,
  doc,
  setDoc,
  getDocs,
  deleteDoc,
  query,
  limit
} from 'firebase/firestore';
import { auth, db, OperationType, handleFirestoreError } from './firebaseConfig.ts';

// Configured Workspace Scopes
export const WORKSPACE_SCOPES = [
  'https://www.googleapis.com/auth/tasks',
  'https://www.googleapis.com/auth/tasks.readonly',
  'https://www.googleapis.com/auth/drive',
  'https://www.googleapis.com/auth/drive.file',
  'https://www.googleapis.com/auth/drive.readonly',
  'https://www.googleapis.com/auth/drive.metadata.readonly',
  'https://www.googleapis.com/auth/chat.spaces',
  'https://www.googleapis.com/auth/chat.spaces.readonly',
  'https://www.googleapis.com/auth/chat.spaces.create',
  'https://www.googleapis.com/auth/chat.messages',
  'https://www.googleapis.com/auth/chat.messages.readonly',
  'https://www.googleapis.com/auth/chat.messages.create',
  'https://www.googleapis.com/auth/chat.memberships',
  'https://www.googleapis.com/auth/chat.memberships.readonly'
];

// Initialize Google Auth Provider
export const googleAuthProvider = new GoogleAuthProvider();
WORKSPACE_SCOPES.forEach((scope) => {
  googleAuthProvider.addScope(scope);
});

// Prompt consent to ensure refreshed access tokens with scopes
googleAuthProvider.setCustomParameters({
  prompt: 'consent'
});

// IN-MEMORY TOKEN CACHE (Security constraint: strictly never persisted to storage)
let cachedAccessToken: string | null = null;
let isSigningIn = false;

// Types for Google Tasks
export interface GoogleTaskList {
  id: string;
  title: string;
  updated: string;
}

export interface GoogleTask {
  id: string;
  title: string;
  notes?: string;
  status: 'needsAction' | 'completed';
  due?: string;
  updated: string;
  parent?: string;
}

// Types for Google Drive
export interface GoogleDriveFile {
  id: string;
  name: string;
  mimeType: string;
  modifiedTime: string;
  size?: string;
  webViewLink?: string;
  iconLink?: string;
}

// Types for Google Chat
export interface GoogleChatSpace {
  name: string; // e.g. "spaces/AAAAAAAAAAA"
  displayName?: string;
  type?: 'SPACE' | 'GROUP_CHAT' | 'DIRECT_MESSAGE';
  spaceType?: string;
}

export interface GoogleChatMessage {
  name: string;
  text?: string;
  formattedText?: string;
  createTime: string;
  sender?: {
    name?: string;
    displayName?: string;
    avatarUrl?: string;
    type?: string;
  };
}

// Types for Firestore Workspace Sync
export interface WorkspaceSyncItem {
  id: string;
  userId: string;
  service: 'tasks' | 'drive' | 'chat';
  resourceId: string;
  title: string;
  status?: string;
  lastSyncedAt: string;
}

export interface FirestoreAuditEntry {
  id: string;
  userId: string;
  action: string;
  details: string;
  timestamp: string;
}

/**
 * Initializes the auth listener to monitor sign-in state
 */
export const initAuth = (
  onAuthSuccess?: (user: User, token: string) => void,
  onAuthFailure?: () => void
) => {
  return onAuthStateChanged(auth, async (user: User | null) => {
    if (user) {
      if (cachedAccessToken) {
        if (onAuthSuccess) onAuthSuccess(user, cachedAccessToken);
      } else if (!isSigningIn) {
        cachedAccessToken = null;
        if (onAuthFailure) onAuthFailure();
      }
    } else {
      cachedAccessToken = null;
      if (onAuthFailure) onAuthFailure();
    }
  });
};

/**
 * Sign in using Firebase Google popup and capture the OAuth access token in-memory
 */
export const googleSignIn = async (): Promise<{ user: User; accessToken: string } | null> => {
  try {
    isSigningIn = true;
    const result = await signInWithPopup(auth, googleAuthProvider);
    const credential = GoogleAuthProvider.credentialFromResult(result);
    if (!credential?.accessToken) {
      throw new Error('Google Sign-In succeeded but OAuth access token was not returned.');
    }

    cachedAccessToken = credential.accessToken;
    return { user: result.user, accessToken: cachedAccessToken };
  } catch (error: any) {
    // Gracefully handle user closing or cancelling the popup without breaking the app
    if (error?.code === 'auth/popup-closed-by-user' || error?.code === 'auth/cancelled-popup-request') {
      console.info('Google Sign-in popup was closed by user.');
      return null;
    }
    console.error('Google Sign-In Error:', error);
    throw error;
  } finally {
    isSigningIn = false;
  }
};

/**
 * Get current cached access token (in-memory)
 */
export const getAccessToken = async (): Promise<string | null> => {
  return cachedAccessToken;
};

/**
 * Sign out and flush cached token from memory
 */
export const logout = async (): Promise<void> => {
  await signOut(auth);
  cachedAccessToken = null;
};

// ==========================================
// GOOGLE TASKS API CLIENT
// ==========================================

export async function fetchTaskLists(): Promise<GoogleTaskList[]> {
  const token = await getAccessToken();
  if (!token) throw new Error('Unauthenticated: Access token required for Google Tasks API');

  const res = await fetch('https://tasks.googleapis.com/tasks/v1/users/@me/lists', {
    headers: { Authorization: `Bearer ${token}` }
  });

  if (!res.ok) {
    const errText = await res.text();
    throw new Error(`Google Tasks API Error (${res.status}): ${errText}`);
  }

  const data = await res.json();
  return (data.items || []).map((item: any) => ({
    id: item.id,
    title: item.title,
    updated: item.updated
  }));
}

export async function fetchTasks(taskListId: string): Promise<GoogleTask[]> {
  const token = await getAccessToken();
  if (!token) throw new Error('Unauthenticated: Access token required for Google Tasks API');

  const res = await fetch(`https://tasks.googleapis.com/tasks/v1/lists/${taskListId}/tasks?showCompleted=true&showHidden=true`, {
    headers: { Authorization: `Bearer ${token}` }
  });

  if (!res.ok) {
    const errText = await res.text();
    throw new Error(`Google Tasks API Error (${res.status}): ${errText}`);
  }

  const data = await res.json();
  return (data.items || []).map((t: any) => ({
    id: t.id,
    title: t.title || 'Không có tiêu đề',
    notes: t.notes || '',
    status: t.status === 'completed' ? 'completed' : 'needsAction',
    due: t.due,
    updated: t.updated,
    parent: t.parent
  }));
}

export async function createGoogleTask(
  taskListId: string,
  task: { title: string; notes?: string; due?: string }
): Promise<GoogleTask> {
  const token = await getAccessToken();
  if (!token) throw new Error('Unauthenticated: Access token required for Google Tasks API');

  const res = await fetch(`https://tasks.googleapis.com/tasks/v1/lists/${taskListId}/tasks`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      title: task.title,
      notes: task.notes || '',
      due: task.due || undefined
    })
  });

  if (!res.ok) {
    const errText = await res.text();
    throw new Error(`Failed to create task (${res.status}): ${errText}`);
  }

  return await res.json();
}

export async function toggleTaskCompletion(
  taskListId: string,
  taskId: string,
  currentStatus: 'needsAction' | 'completed'
): Promise<GoogleTask> {
  const token = await getAccessToken();
  if (!token) throw new Error('Unauthenticated');

  const newStatus = currentStatus === 'completed' ? 'needsAction' : 'completed';
  const res = await fetch(`https://tasks.googleapis.com/tasks/v1/lists/${taskListId}/tasks/${taskId}`, {
    method: 'PATCH',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      status: newStatus,
      completed: newStatus === 'completed' ? new Date().toISOString() : null
    })
  });

  if (!res.ok) {
    const errText = await res.text();
    throw new Error(`Failed to toggle task status: ${errText}`);
  }

  return await res.json();
}

export async function deleteGoogleTask(taskListId: string, taskId: string): Promise<void> {
  const token = await getAccessToken();
  if (!token) throw new Error('Unauthenticated');

  const res = await fetch(`https://tasks.googleapis.com/tasks/v1/lists/${taskListId}/tasks/${taskId}`, {
    method: 'DELETE',
    headers: { Authorization: `Bearer ${token}` }
  });

  if (!res.ok && res.status !== 204) {
    const errText = await res.text();
    throw new Error(`Failed to delete task: ${errText}`);
  }
}

// ==========================================
// GOOGLE DRIVE API CLIENT
// ==========================================

export async function fetchDriveFiles(searchQuery?: string, pageSize = 20): Promise<GoogleDriveFile[]> {
  const token = await getAccessToken();
  if (!token) throw new Error('Unauthenticated: Access token required for Google Drive API');

  let url = `https://www.googleapis.com/drive/v3/files?pageSize=${pageSize}&fields=files(id,name,mimeType,modifiedTime,size,webViewLink,iconLink)&orderBy=modifiedTime desc`;
  if (searchQuery && searchQuery.trim()) {
    const sanitized = searchQuery.replace(/'/g, "\\'");
    url += `&q=name contains '${sanitized}' and trashed = false`;
  } else {
    url += `&q=trashed = false`;
  }

  const res = await fetch(url, {
    headers: { Authorization: `Bearer ${token}` }
  });

  if (!res.ok) {
    const errText = await res.text();
    throw new Error(`Google Drive API Error (${res.status}): ${errText}`);
  }

  const data = await res.json();
  return data.files || [];
}

export async function createDriveTextFile(name: string, content: string): Promise<GoogleDriveFile> {
  const token = await getAccessToken();
  if (!token) throw new Error('Unauthenticated: Access token required for Google Drive API');

  const metadata = {
    name,
    mimeType: 'text/markdown'
  };

  const form = new FormData();
  form.append('metadata', new Blob([JSON.stringify(metadata)], { type: 'application/json' }));
  form.append('file', new Blob([content], { type: 'text/markdown' }));

  const res = await fetch('https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart&fields=id,name,mimeType,modifiedTime,size,webViewLink', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`
    },
    body: form
  });

  if (!res.ok) {
    const errText = await res.text();
    throw new Error(`Google Drive File Creation Error: ${errText}`);
  }

  return await res.json();
}

export async function deleteDriveFile(fileId: string): Promise<void> {
  const token = await getAccessToken();
  if (!token) throw new Error('Unauthenticated: Access token required for Google Drive API');

  const res = await fetch(`https://www.googleapis.com/drive/v3/files/${fileId}`, {
    method: 'DELETE',
    headers: { Authorization: `Bearer ${token}` }
  });

  if (!res.ok && res.status !== 204) {
    const errText = await res.text();
    throw new Error(`Failed to delete Google Drive file: ${errText}`);
  }
}

// ==========================================
// GOOGLE CHAT API CLIENT
// ==========================================

export async function fetchChatSpaces(): Promise<{ spaces: GoogleChatSpace[]; notConfigured?: boolean }> {
  const token = await getAccessToken();
  if (!token) throw new Error('Unauthenticated: Access token required for Google Chat API');

  const res = await fetch('https://chat.googleapis.com/v1/spaces', {
    headers: { Authorization: `Bearer ${token}` }
  });

  if (!res.ok) {
    const errText = await res.text();
    // Special handling for Workspace requirement / Chat app configuration requirement per Skill doc
    if (res.status === 404 || errText.includes('Chat app not found')) {
      return { spaces: [], notConfigured: true };
    }
    throw new Error(`Google Chat API Error (${res.status}): ${errText}`);
  }

  const data = await res.json();
  return { spaces: data.spaces || [], notConfigured: false };
}

export async function fetchChatMessages(spaceName: string): Promise<GoogleChatMessage[]> {
  const token = await getAccessToken();
  if (!token) throw new Error('Unauthenticated');

  const res = await fetch(`https://chat.googleapis.com/v1/${spaceName}/messages?pageSize=25`, {
    headers: { Authorization: `Bearer ${token}` }
  });

  if (!res.ok) {
    const errText = await res.text();
    throw new Error(`Failed to fetch chat messages: ${errText}`);
  }

  const data = await res.json();
  return data.messages || [];
}

export async function sendChatMessage(spaceName: string, text: string): Promise<GoogleChatMessage> {
  const token = await getAccessToken();
  if (!token) throw new Error('Unauthenticated');

  const res = await fetch(`https://chat.googleapis.com/v1/${spaceName}/messages`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ text })
  });

  if (!res.ok) {
    const errText = await res.text();
    throw new Error(`Failed to send Google Chat message: ${errText}`);
  }

  return await res.json();
}

// ==========================================
// FIRESTORE SYNC & AUDIT CLIENT
// ==========================================

export async function syncItemToFirestore(item: WorkspaceSyncItem): Promise<void> {
  const path = `users/${item.userId}/workspaceSync/${item.id}`;
  try {
    const ref = doc(db, 'users', item.userId, 'workspaceSync', item.id);
    await setDoc(ref, {
      id: item.id,
      userId: item.userId,
      service: item.service,
      resourceId: item.resourceId,
      title: item.title,
      status: item.status || 'active',
      lastSyncedAt: new Date().toISOString()
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
  }
}

export async function fetchFirestoreSyncItems(userId: string): Promise<WorkspaceSyncItem[]> {
  const path = `users/${userId}/workspaceSync`;
  try {
    const colRef = collection(db, 'users', userId, 'workspaceSync');
    const q = query(colRef, limit(50));
    const snap = await getDocs(q);
    return snap.docs.map((d) => d.data() as WorkspaceSyncItem);
  } catch (error) {
    handleFirestoreError(error, OperationType.LIST, path);
  }
}

export async function removeFirestoreSyncItem(userId: string, itemId: string): Promise<void> {
  const path = `users/${userId}/workspaceSync/${itemId}`;
  try {
    const ref = doc(db, 'users', userId, 'workspaceSync', itemId);
    await deleteDoc(ref);
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, path);
  }
}

export async function recordAuditToFirestore(
  userId: string,
  action: string,
  details: string
): Promise<void> {
  const auditId = `aud_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
  const path = `users/${userId}/audits/${auditId}`;
  try {
    const ref = doc(db, 'users', userId, 'audits', auditId);
    await setDoc(ref, {
      id: auditId,
      userId,
      action,
      details,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
  }
}
