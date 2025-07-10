import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit'
import { api } from '../../services/api'

interface GameRoom {
  id: string
  code: string
  questionSetId: string
  creatorId: string
  maxPlayers: number
  totalQuestions: number
  timePerQuestion: number
  participants: any[]
  state: 'WAITING' | 'STARTING' | 'IN_PROGRESS' | 'COMPLETED'
}

interface Question {
  id: string
  text: string
  options: { answers: string[] }
  timeLimit: number
  points: number
}

interface GameState {
  currentRoom: GameRoom | null
  availableRooms: GameRoom[]
  currentQuestion: Question | null
  questionIndex: number
  timeLeft: number
  score: number
  answers: Record<string, string>
  loading: boolean
  error: string | null
}

const initialState: GameState = {
  currentRoom: null,
  availableRooms: [],
  currentQuestion: null,
  questionIndex: 0,
  timeLeft: 0,
  score: 0,
  answers: {},
  loading: false,
  error: null,
}

export const fetchAvailableRooms = createAsyncThunk(
  'game/fetchAvailableRooms',
  async () => {
    const response = await api.get('/games/rooms')
    return response.data
  }
)

export const createRoom = createAsyncThunk(
  'game/createRoom',
  async (roomData: { questionSetId: string; maxPlayers: number; timePerQuestion: number }) => {
    const response = await api.post('/games/create', roomData)
    return response.data
  }
)

export const joinRoom = createAsyncThunk(
  'game/joinRoom',
  async (roomCode: string) => {
    const response = await api.post(`/games/join/${roomCode}`)
    return response.data
  }
)

const gameSlice = createSlice({
  name: 'game',
  initialState,
  reducers: {
    setCurrentQuestion: (state, action: PayloadAction<Question>) => {
      state.currentQuestion = action.payload
    },
    setTimeLeft: (state, action: PayloadAction<number>) => {
      state.timeLeft = action.payload
    },
    submitAnswer: (state, action: PayloadAction<{ questionId: string; answer: string }>) => {
      state.answers[action.payload.questionId] = action.payload.answer
    },
    updateScore: (state, action: PayloadAction<number>) => {
      state.score += action.payload
    },
    resetGame: (state) => {
      state.currentRoom = null
      state.currentQuestion = null
      state.questionIndex = 0
      state.timeLeft = 0
      state.score = 0
      state.answers = {}
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchAvailableRooms.fulfilled, (state, action) => {
        state.availableRooms = action.payload
      })
      .addCase(createRoom.fulfilled, (state, action) => {
        state.currentRoom = action.payload
      })
      .addCase(joinRoom.fulfilled, (state, action) => {
        state.currentRoom = action.payload
      })
  },
})

export const { setCurrentQuestion, setTimeLeft, submitAnswer, updateScore, resetGame } = gameSlice.actions
export default gameSlice.reducer 