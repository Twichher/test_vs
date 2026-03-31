import { configureStore } from '@reduxjs/toolkit';
import authReducer from './authSlice';
import draftReducer from './draftSlice';

export const store = configureStore({
  reducer: {
    auth: authReducer,
    draft: draftReducer,
  },
});

// Типы для useSelector и useDispatch
export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
