import { createSlice, type PayloadAction } from '@reduxjs/toolkit';

// Типы для черновика встречи
export interface MeetingDraft {
  title: string;
  description: string;
  maxPeople: string;
  address: string;
  meetingDate: string;
  startTime: string;
  endTime: string;
  emailMessage: string;
  adultsOnly: boolean;
  photos: string[];
  selectedWarnings: Record<number, number>; // warning_id -> option_id
  selectedCategoryIds: number[];
  savedAt: string; // ISO timestamp
}

interface DraftState {
  meetingDraft: MeetingDraft | null;
}

// Ключ для localStorage
const getDraftKey = (userId: number) => `meeting_draft_${userId}`;

// Загрузка черновика из localStorage
const loadDraftFromStorage = (userId: number | null): MeetingDraft | null => {
  if (!userId) return null;
  try {
    const saved = localStorage.getItem(getDraftKey(userId));
    if (saved) {
      return JSON.parse(saved) as MeetingDraft;
    }
  } catch (error) {
    console.error('Error loading draft from localStorage:', error);
  }
  return null;
};

// Сохранение черновика в localStorage
const saveDraftToStorage = (userId: number | null, draft: MeetingDraft | null) => {
  if (!userId) return;
  try {
    if (draft) {
      localStorage.setItem(getDraftKey(userId), JSON.stringify(draft));
    } else {
      localStorage.removeItem(getDraftKey(userId));
    }
  } catch (error) {
    console.error('Error saving draft to localStorage:', error);
  }
};

// Удаление черновика из localStorage
const clearDraftFromStorage = (userId: number | null) => {
  if (!userId) return;
  try {
    localStorage.removeItem(getDraftKey(userId));
  } catch (error) {
    console.error('Error clearing draft from localStorage:', error);
  }
};

const initialState: DraftState = {
  meetingDraft: null,
};

const draftSlice = createSlice({
  name: 'draft',
  initialState,
  reducers: {
    // Инициализировать черновик из localStorage
    initDraft(state, action: PayloadAction<{ userId: number }>) {
      state.meetingDraft = loadDraftFromStorage(action.payload.userId);
    },

    // Сохранить/обновить черновик
    saveDraft(state, action: PayloadAction<{ userId: number; draft: Partial<MeetingDraft> }>) {
      const { userId, draft } = action.payload;
      const currentDraft = state.meetingDraft || {
        title: '',
        description: '',
        maxPeople: '',
        address: '',
        meetingDate: '',
        startTime: '',
        endTime: '',
        emailMessage: '',
        adultsOnly: false,
        photos: [],
        selectedWarnings: {},
        selectedCategoryIds: [],
        savedAt: new Date().toISOString(),
      };

      const updatedDraft: MeetingDraft = {
        ...currentDraft,
        ...draft,
        savedAt: new Date().toISOString(),
      };

      state.meetingDraft = updatedDraft;
      saveDraftToStorage(userId, updatedDraft);
    },

    // Очистить черновик
    clearDraft(state, action: PayloadAction<{ userId: number }>) {
      state.meetingDraft = null;
      clearDraftFromStorage(action.payload.userId);
    },

    // Обновить отдельное поле черновика
    updateDraftField<T extends keyof MeetingDraft>(
      state: DraftState,
      action: PayloadAction<{ userId: number; field: T; value: MeetingDraft[T] }>
    ) {
      const { userId, field, value } = action.payload;
      const currentDraft = state.meetingDraft || {
        title: '',
        description: '',
        maxPeople: '',
        address: '',
        meetingDate: '',
        startTime: '',
        endTime: '',
        emailMessage: '',
        adultsOnly: false,
        photos: [],
        selectedWarnings: {},
        selectedCategoryIds: [],
        savedAt: new Date().toISOString(),
      };

      const updatedDraft: MeetingDraft = {
        ...currentDraft,
        [field]: value,
        savedAt: new Date().toISOString(),
      };

      state.meetingDraft = updatedDraft;
      saveDraftToStorage(userId, updatedDraft);
    },
  },
});

export const { initDraft, saveDraft, clearDraft, updateDraftField } = draftSlice.actions;
export default draftSlice.reducer;
