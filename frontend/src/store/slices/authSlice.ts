import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit'
import { api } from '../../services/api'

interface User {
  id: string
  username: string
  email: string
  accountType: 'FREE' | 'PREMIUM' | 'ADMIN'
  coins: number
  totalScore: number
  totalGamesPlayed: number
  totalGamesWon: number
}

interface AuthState {
  isAuthenticated: boolean
  user: User | null
  token: string | null
  loading: boolean
  error: string | null
}

const initialState: AuthState = {
  isAuthenticated: false,
  user: null,
  token: null,
  loading: false,
  error: null,
}

// Async thunks
export const login = createAsyncThunk(
  'auth/login',
  async ({ emailOrUsername, password }: { emailOrUsername: string; password: string }) => {
    const response = await api.post('/auth/login', { emailOrUsername, password })
    localStorage.setItem('brainbrawler_token', response.data.tokens.accessToken)
    return response.data
  }
)

export const register = createAsyncThunk(
  'auth/register',
  async ({ username, email, password }: { username: string; email: string; password: string }) => {
    const response = await api.post('/auth/register', { username, email, password })
    localStorage.setItem('brainbrawler_token', response.data.tokens.accessToken)
    return response.data
  }
)

export const loadUser = createAsyncThunk(
  'auth/loadUser',
  async () => {
    const token = localStorage.getItem('brainbrawler_token')
    if (!token) throw new Error('No token found')
    
    const response = await api.get('/auth/profile', {
      headers: { Authorization: `Bearer ${token}` }
    })
    return response.data
  }
)

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    logout: (state) => {
      state.isAuthenticated = false
      state.user = null
      state.token = null
      localStorage.removeItem('brainbrawler_token')
    },
    clearError: (state) => {
      state.error = null
    },
    updateUserCoins: (state, action: PayloadAction<number>) => {
      if (state.user) {
        state.user.coins = action.payload
      }
    },
  },
  extraReducers: (builder) => {
    builder
      // Login
      .addCase(login.pending, (state) => {
        state.loading = true
        state.error = null
      })
      .addCase(login.fulfilled, (state, action) => {
        state.loading = false
        state.isAuthenticated = true
        state.user = action.payload.user
        state.token = action.payload.tokens.accessToken
      })
      .addCase(login.rejected, (state, action) => {
        state.loading = false
        state.error = action.error.message || 'Login failed'
      })
      // Register
      .addCase(register.pending, (state) => {
        state.loading = true
        state.error = null
      })
      .addCase(register.fulfilled, (state, action) => {
        state.loading = false
        state.isAuthenticated = true
        state.user = action.payload.user
        state.token = action.payload.tokens.accessToken
      })
      .addCase(register.rejected, (state, action) => {
        state.loading = false
        state.error = action.error.message || 'Registration failed'
      })
      // Load user
      .addCase(loadUser.fulfilled, (state, action) => {
        state.isAuthenticated = true
        state.user = action.payload.user
      })
      .addCase(loadUser.rejected, (state) => {
        state.isAuthenticated = false
        state.user = null
        state.token = null
        localStorage.removeItem('brainbrawler_token')
      })
  },
})

export const { logout, clearError, updateUserCoins } = authSlice.actions
export default authSlice.reducer 