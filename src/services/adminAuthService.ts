/**
 * NDAWG PRO — PART 7/8 (UNIFIED FINAL V2)
 * Admin Authentication Client Service
 * Never stores or exposes admin password in plaintext client-side code.
 */

import { AdminSession } from '../types/chat.ts';

const SESSION_TOKEN_KEY = 'ndawg_admin_session_token';

export class AdminAuthService {
  private static instance: AdminAuthService;
  private currentSession: AdminSession = {
    isAuthenticated: false,
    token: null,
    role: 'VIEWER',
    loginTime: null,
    expiresAt: null
  };

  private constructor() {
    this.restoreSessionFromStorage();
  }

  public static getInstance(): AdminAuthService {
    if (!AdminAuthService.instance) {
      AdminAuthService.instance = new AdminAuthService();
    }
    return AdminAuthService.instance;
  }

  private restoreSessionFromStorage(): void {
    try {
      const savedToken = sessionStorage.getItem(SESSION_TOKEN_KEY);
      if (savedToken) {
        this.currentSession = {
          isAuthenticated: true,
          token: savedToken,
          role: 'ADMIN',
          loginTime: Date.now(),
          expiresAt: null
        };
      }
    } catch (e) {
      console.warn('Could not read session token from sessionStorage:', e);
    }
  }

  public getSession(): AdminSession {
    return { ...this.currentSession };
  }

  /**
   * Authenticate with backend /api/admin/login
   */
  public async login(password: string): Promise<{ success: boolean; error?: string }> {
    try {
      const response = await fetch('/api/admin/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password })
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        return {
          success: false,
          error: data.error || 'Xác thực không thành công'
        };
      }

      this.currentSession = {
        isAuthenticated: true,
        token: data.token,
        role: 'ADMIN',
        loginTime: Date.now(),
        expiresAt: data.expiresAt
      };

      try {
        sessionStorage.setItem(SESSION_TOKEN_KEY, data.token);
      } catch (e) {
        console.warn('Could not store session token:', e);
      }

      return { success: true };
    } catch (err: any) {
      return {
        success: false,
        error: `Lỗi kết nối máy chủ: ${err.message || 'Không thể kiểm tra mật khẩu'}`
      };
    }
  }

  /**
   * Verify current token with backend
   */
  public async verifyCurrentToken(): Promise<boolean> {
    if (!this.currentSession.token) {
      return false;
    }

    try {
      const response = await fetch('/api/admin/verify', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.currentSession.token}`
        }
      });

      if (!response.ok) {
        this.logout();
        return false;
      }

      const data = await response.json();
      if (!data.valid) {
        this.logout();
        return false;
      }

      return true;
    } catch {
      return false;
    }
  }

  /**
   * Logout and invalidate session
   */
  public async logout(): Promise<void> {
    if (this.currentSession.token) {
      try {
        await fetch('/api/admin/logout', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${this.currentSession.token}`
          }
        });
      } catch (e) {
        console.warn('Logout network error (clearing local session anyway):', e);
      }
    }

    this.currentSession = {
      isAuthenticated: false,
      token: null,
      role: 'VIEWER',
      loginTime: null,
      expiresAt: null
    };

    try {
      sessionStorage.removeItem(SESSION_TOKEN_KEY);
    } catch (e) {
      console.warn('Could not remove session token:', e);
    }
  }
}
