import { createSlice, createAsyncThunk } from '@reduxjs/toolkit'
import { api } from '../../services/api'

interface UserStats {
  totalGamesPlayed: number
  totalGamesWon: number
  totalScore: number
  averageScore: number
  coins: number
}

interface Friend {
  id: string
  username: string
  isOnline: boolean
  lastSeen: string
}

interface UserState {
  stats: UserStats | null
  friends: Friend[]
  friendRequests: any[]
  loading: boolean
  error: string | null
}

const initialState: UserState = {
  stats: null,
  friends: [],
  friendRequests: [],
  loading: false,
  error: null,
}

export const fetchUserStats = createAsyncThunk(
  'user/fetchStats',
  async () => {
    const response = await api.get('/users/stats')
    return response.data
  }
)

export const fetchFriends = createAsyncThunk(
  'user/fetchFriends',
  async () => {
    const response = await api.get('/users/friends')
    return response.data
  }
)

export const searchUsers = createAsyncThunk(
  'user/searchUsers',
  async (query: string) => {
    const response = await api.get(`/users/search?q=${query}`)
    return response.data
  }
)

const userSlice = createSlice({
  name: 'user',
  initialState,
  reducers: {
    clearError: (state) => {
      state.error = null
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchUserStats.fulfilled, (state, action) => {
        state.stats = action.payload
      })
      .addCase(fetchFriends.fulfilled, (state, action) => {
        state.friends = action.payload
      })
  },
})

export const { clearError } = userSlice.actions
export default userSlice.reducer 