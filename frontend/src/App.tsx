import { useEffect } from 'react'
import { Routes, Route, Navigate } from 'react-router-dom'
import { useSelector, useDispatch } from 'react-redux'
import { RootState, AppDispatch } from './store/store'
import { Toaster } from 'react-hot-toast'
import { loadUser } from './store/slices/authSlice'
// WebSocket service automatically initialized
import './services/websocket'

// Pages
import LandingPage from './pages/LandingPage'
import AuthPage from './pages/AuthPage'
import Dashboard from './pages/Dashboard'
import GameLobby from './pages/GameLobby'
import GameRoom from './pages/GameRoom'
import Profile from './pages/Profile'
import Shop from './pages/Shop'
import Leaderboard from './pages/Leaderboard'
import Friends from './pages/Friends'
import QuestionSets from './pages/QuestionSets'
import CreateGame from './pages/CreateGame'
import AdminPanel from './pages/AdminPanel';

// Layout
import Layout from './components/Layout/Layout'

function App() {
  const { isAuthenticated, user } = useSelector((state: RootState) => state.auth)
  const dispatch = useDispatch<AppDispatch>()

  useEffect(() => {
    const token = localStorage.getItem('brainbrawler_token')
    if (token) {
      dispatch(loadUser())
    }
  }, [dispatch])

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900">
      <Toaster 
        position="top-center"
        toastOptions={{
          duration: 4000,
          style: {
            background: '#1f2937',
            color: '#fff',
            borderRadius: '12px',
            fontSize: '14px',
          },
        }}
      />
      
      <Routes>
        {/* Public routes */}
        <Route path="/" element={<LandingPage />} />
        <Route path="/auth" element={<AuthPage />} />
        
        {/* Protected routes */}
        <Route path="/app" element={
          isAuthenticated ? <Layout /> : <Navigate to="/auth" />
        }>
          <Route index element={<Dashboard />} />
          <Route path="lobby" element={<GameLobby />} />
          <Route path="create-game" element={<CreateGame />} />
          <Route path="game/:roomCode" element={<GameRoom />} />
          <Route path="friends" element={<Friends />} />
          <Route path="question-sets" element={<QuestionSets />} />
          <Route path="profile" element={<Profile />} />
          <Route path="shop" element={<Shop />} />
          <Route path="leaderboard" element={<Leaderboard />} />
          {user?.accountType === 'ADMIN' && (
            <Route path="admin" element={<AdminPanel />} />
          )}
        </Route>
        
        {/* Catch all - redirect to appropriate page */}
        <Route path="*" element={
          <Navigate to={isAuthenticated ? "/app" : "/"} />
        } />
      </Routes>
    </div>
  )
}

export default App 