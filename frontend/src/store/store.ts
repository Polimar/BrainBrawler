import { configureStore } from '@reduxjs/toolkit'
import authSlice from './slices/authSlice'
import userSlice from './slices/userSlice'
import gameSlice from './slices/gameSlice'

export const store = configureStore({
  reducer: {
    auth: authSlice,
    user: userSlice,
    game: gameSlice,
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: {
        ignoredActions: ['persist/PERSIST'],
      },
    }),
})

export type RootState = ReturnType<typeof store.getState>
export type AppDispatch = typeof store.dispatch 