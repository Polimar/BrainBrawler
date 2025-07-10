import { Routes, Route, Navigate } from 'react-router-dom'
import { useSelector } from 'react-redux'
import { RootState } from './store/store'
import { Toaster } from 'react-hot-toast'

// Pages
import LandingPage from './pages/LandingPage'
import AuthPage from './pages/AuthPage'
import Dashboard from './pages/Dashboard'
import GameLobby from './pages/GameLobby'
import GameRoom from './pages/GameRoom'
import Profile from './pages/Profile'
import Shop from './pages/Shop'
import Leaderboard from './pages/Leaderboard'

// Layout
import Layout from './components/Layout/Layout'

function App() {
  const { isAuthenticated } = useSelector((state: RootState) => state.auth)

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
          <Route path="game/:roomCode" element={<GameRoom />} />
          <Route path="profile" element={<Profile />} />
          <Route path="shop" element={<Shop />} />
          <Route path="leaderboard" element={<Leaderboard />} />
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