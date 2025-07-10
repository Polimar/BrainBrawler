import { configureStore } from '@reduxjs/toolkit';

// Basic store setup - slices will be added later
export const store = configureStore({
  reducer: {
    // Add your slices here
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: {
        ignoredActions: ['persist/PERSIST'],
      },
    }),
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch; 