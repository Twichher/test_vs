import { createSlice } from '@reduxjs/toolkit';
import type { PayloadAction } from '@reduxjs/toolkit'; // ← добавить type


interface AuthState {
  isAuth: boolean;
  user_id: number | null;
  first_name: string | null;
  last_name: string | null;
  district: string | null;
  is_blocked: boolean;
  is_organizer: boolean;
  is_admin: boolean;
  is_registration_completed: boolean;
  meetings_as_currency: number | null;
}

const initialState: AuthState = {
  isAuth: false,
  user_id: null,
  first_name: null,
  last_name: null,
  district: null,
  is_blocked: false,
  is_organizer: false,
  is_admin: false,
  is_registration_completed: false,
  meetings_as_currency: null,
};

interface UpdateProfilePayload {
  first_name?: string;
  last_name?: string;
  district?: string;
}

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    // Логин — записать данные пользователя
    setUser(state, action: PayloadAction<Omit<AuthState, 'isAuth'>>) {
      state.isAuth = true;
      state.user_id = action.payload.user_id;
      state.first_name = action.payload.first_name;
      state.last_name = action.payload.last_name;
      state.district = action.payload.district;
      state.is_blocked = action.payload.is_blocked;
      state.is_organizer = action.payload.is_organizer;
      state.is_admin = action.payload.is_admin;
      state.is_registration_completed = action.payload.is_registration_completed;
      state.meetings_as_currency = action.payload.meetings_as_currency;
    },
    // Обновление данных профиля (после сохранения настроек)
    updateUserProfile(state, action: PayloadAction<UpdateProfilePayload>) {
      if (action.payload.first_name !== undefined) {
        state.first_name = action.payload.first_name;
      }
      if (action.payload.last_name !== undefined) {
        state.last_name = action.payload.last_name;
      }
      if (action.payload.district !== undefined) {
        state.district = action.payload.district;
      }
    },
    // Логаут — сбросить всё
    clearUser(state) {
      return initialState;
    },
  },
});

export const { setUser, updateUserProfile, clearUser } = authSlice.actions;
export default authSlice.reducer;
