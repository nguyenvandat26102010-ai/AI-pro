/**
 * NDAWG PRO — APEX INFINITY V14
 * Personalization & Background Image Studio (Part 10)
 *
 * Implements:
 * - User preferences: Theme, language, font scale, chat layout, accessibility
 * - Background Image Library: Verified presets, custom image upload validation,
 *   data URL sanitization, active background selection, and reset to default
 */

export interface BackgroundImageItem {
  id: string;
  name: string;
  category: 'PRESET_CYBER' | 'PRESET_SPACE' | 'PRESET_ABSTRACT' | 'USER_UPLOAD';
  thumbnailUrl: string;
  fullUrl: string;
  isCustom: boolean;
  uploadedAt?: string;
  sizeBytes?: number;
}

export interface UserPreferences {
  theme: 'cyber_slate' | 'midnight_indigo' | 'emerald_matrix' | 'classic_dark';
  language: 'vi' | 'en' | 'ja' | 'ko';
  fontSize: 'small' | 'medium' | 'large';
  chatLayout: 'compact' | 'spacious';
  highContrast: boolean;
  selectedBackgroundId: string;
  lastUpdated: string;
}

export class PersonalizationEngine {
  private preferences: UserPreferences;
  private backgroundLibrary: BackgroundImageItem[] = [];

  constructor() {
    this.preferences = {
      theme: 'cyber_slate',
      language: 'vi',
      fontSize: 'medium',
      chatLayout: 'spacious',
      highContrast: false,
      selectedBackgroundId: 'bg_default_slate',
      lastUpdated: new Date().toISOString()
    };

    this.seedBackgrounds();
  }

  private seedBackgrounds(): void {
    this.backgroundLibrary = [
      {
        id: 'bg_default_slate',
        name: 'Mặc định — Slate Cyber (Default)',
        category: 'PRESET_CYBER',
        thumbnailUrl: 'https://images.unsplash.com/photo-1518770660439-4636190af475?auto=format&fit=crop&w=300&q=80',
        fullUrl: 'https://images.unsplash.com/photo-1518770660439-4636190af475?auto=format&fit=crop&w=1920&q=80',
        isCustom: false
      },
      {
        id: 'bg_midnight_nebula',
        name: 'Vũ trụ Tối — Midnight Nebula',
        category: 'PRESET_SPACE',
        thumbnailUrl: 'https://images.unsplash.com/photo-1506703719100-a0f3a48c0f86?auto=format&fit=crop&w=300&q=80',
        fullUrl: 'https://images.unsplash.com/photo-1506703719100-a0f3a48c0f86?auto=format&fit=crop&w=1920&q=80',
        isCustom: false
      },
      {
        id: 'bg_matrix_emerald',
        name: 'Ma trận Xanh — Quantum Circuit',
        category: 'PRESET_ABSTRACT',
        thumbnailUrl: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=300&q=80',
        fullUrl: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=1920&q=80',
        isCustom: false
      },
      {
        id: 'bg_deep_ocean',
        name: 'Đại dương Số — Cybernetic Depths',
        category: 'PRESET_CYBER',
        thumbnailUrl: 'https://images.unsplash.com/photo-1550745165-9bc0b252726f?auto=format&fit=crop&w=300&q=80',
        fullUrl: 'https://images.unsplash.com/photo-1550745165-9bc0b252726f?auto=format&fit=crop&w=1920&q=80',
        isCustom: false
      }
    ];
  }

  public getPreferences(): UserPreferences {
    return { ...this.preferences };
  }

  public updatePreferences(patch: Partial<UserPreferences>): UserPreferences {
    this.preferences = {
      ...this.preferences,
      ...patch,
      lastUpdated: new Date().toISOString()
    };
    return this.getPreferences();
  }

  public getBackgroundLibrary(): BackgroundImageItem[] {
    return [...this.backgroundLibrary];
  }

  public getActiveBackground(): BackgroundImageItem {
    const bg = this.backgroundLibrary.find(b => b.id === this.preferences.selectedBackgroundId);
    return bg || this.backgroundLibrary[0];
  }

  /**
   * Upload and validate custom user background image
   */
  public uploadCustomBackground(data: {
    name: string;
    dataUrl: string;
    mimeType: string;
    sizeBytes: number;
  }): { success: boolean; item?: BackgroundImageItem; error?: string } {
    // Validation
    const allowedMimes = ['image/jpeg', 'image/png', 'image/webp'];
    if (!allowedMimes.includes(data.mimeType)) {
      return {
        success: false,
        error: 'Định dạng hình ảnh không được hỗ trợ. Vui lòng tải ảnh JPEG, PNG hoặc WebP.'
      };
    }

    const maxSizeBytes = 3.5 * 1024 * 1024; // 3.5 MB
    if (data.sizeBytes > maxSizeBytes) {
      return {
        success: false,
        error: `Dung lượng tệp (${Math.round(data.sizeBytes / (1024 * 1024))} MB) vượt quá giới hạn 3.5 MB.`
      };
    }

    if (!data.dataUrl.startsWith('data:image/')) {
      return {
        success: false,
        error: 'Dữ liệu hình ảnh không hợp lệ (Missing data URL header).'
      };
    }

    const newId = `bg_user_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
    const newItem: BackgroundImageItem = {
      id: newId,
      name: data.name.trim() || 'Hình nền tùy chỉnh',
      category: 'USER_UPLOAD',
      thumbnailUrl: data.dataUrl,
      fullUrl: data.dataUrl,
      isCustom: true,
      uploadedAt: new Date().toISOString(),
      sizeBytes: data.sizeBytes
    };

    this.backgroundLibrary.push(newItem);
    this.preferences.selectedBackgroundId = newId;

    return {
      success: true,
      item: newItem
    };
  }

  public resetBackgroundToDefault(): BackgroundImageItem {
    this.preferences.selectedBackgroundId = 'bg_default_slate';
    this.preferences.lastUpdated = new Date().toISOString();
    return this.getActiveBackground();
  }

  public deleteCustomBackground(id: string): boolean {
    const idx = this.backgroundLibrary.findIndex(b => b.id === id && b.isCustom);
    if (idx === -1) return false;

    this.backgroundLibrary.splice(idx, 1);
    if (this.preferences.selectedBackgroundId === id) {
      this.resetBackgroundToDefault();
    }
    return true;
  }
}
