import React, { useState, useEffect } from 'react'
import { useSelector, useDispatch } from 'react-redux'
import { useNavigate } from 'react-router-dom'
import { RootState } from '../store/store'
import { api } from '../services/api'
import toast from 'react-hot-toast'
import AdBanner from '../components/AdBanner'

interface Game {
  id: string
  code: string
  questionSet: {
    name: string
    category: string
    difficulty: string
  }
  creator: {
    username: string
    accountType: string
  }
  maxPlayers: number
  totalQuestions: number
  timePerQuestion: number
  participantCount: number
  isPrivate: boolean
  state: string
}

const GameLobby: React.FC = () => {
  const navigate = useNavigate()
  const user = useSelector((state: RootState) => state.auth.user)
  const [games, setGames] = useState<Game[]>([])
  const [loading, setLoading] = useState(true)
  const [joinCode, setJoinCode] = useState('')
  const [showUpgradeModal, setShowUpgradeModal] = useState(false)

  useEffect(() => {
    if (user) {
      loadAvailableGames()
    }
  }, [user])

  const loadAvailableGames = async () => {
    try {
      const response = await api.get('/games/available')
      setGames(response.data.games || [])
    } catch (error) {
      console.error('Error loading games:', error)
      toast.error('Failed to load games')
    } finally {
      setLoading(false)
    }
  }

  const handleCreateGame = () => {
    // Check if user is premium (only premium users can create games)
    if (user?.accountType === 'FREE') {
      setShowUpgradeModal(true)
      return
    }
    
    navigate('/create-game')
  }

  const handleJoinGame = async (gameCode: string) => {
    try {
      const response = await api.post('/games/join', { gameCode })
      
      if (response.data.success) {
        toast.success('Joined game successfully!')
        navigate(`/game/${response.data.game.id}`)
      }
    } catch (error: any) {
      const message = error.response?.data?.error || 'Failed to join game'
      toast.error(message)
    }
  }

  const handleJoinByCode = async () => {
    if (!joinCode.trim()) {
      toast.error('Please enter a game code')
      return
    }
    
    await handleJoinGame(joinCode)
  }

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty.toLowerCase()) {
      case 'easy': return 'text-green-400'
      case 'medium': return 'text-yellow-400'
      case 'hard': return 'text-red-400'
      default: return 'text-gray-400'
    }
  }

  const getAccountTypeBadge = (accountType: string) => {
    if (accountType === 'PREMIUM' || accountType === 'ADMIN') {
      return (
        <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-yellow-500/20 text-yellow-400 border border-yellow-500/30">
          👑 Premium
        </span>
      )
    }
    return (
      <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-gray-500/20 text-gray-400 border border-gray-500/30">
        🆓 Free
      </span>
    )
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-purple-500 border-t-transparent rounded-full animate-spin mb-4"></div>
          <p className="text-gray-300">Loading games...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header with Account Type Info */}
      <div className="glass-card p-6 bg-gradient-to-r from-purple-600/20 to-pink-600/20 border-purple-500/30">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-white mb-2">🎮 Game Lobby</h1>
            <div className="flex items-center space-x-4">
              <p className="text-gray-300">Welcome, {user?.username}!</p>
              {getAccountTypeBadge(user?.accountType || 'FREE')}
            </div>
          </div>
          <div className="text-right">
            <div className="text-2xl mb-2">💰 {user?.coins?.toLocaleString() || 0}</div>
            <div className="text-sm text-gray-400">coins</div>
          </div>
        </div>
      </div>

      {/* Account Type Restrictions Info */}
      {user?.accountType === 'FREE' && (
        <div className="glass-card p-4 bg-gradient-to-r from-blue-600/20 to-cyan-600/20 border-blue-500/30">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="text-2xl">💡</div>
              <div>
                <h3 className="text-white font-bold">Free Account Limitations</h3>
                <p className="text-gray-300 text-sm">You can join games but cannot create them. Upgrade to Premium for full access!</p>
              </div>
            </div>
            <button 
              onClick={() => setShowUpgradeModal(true)}
              className="btn-warning"
            >
              Upgrade Now
            </button>
          </div>
        </div>
      )}

      {/* Action Buttons */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Create Game - Premium Only */}
        <div className="glass-card p-6">
          <h3 className="text-xl font-bold text-white mb-4">🚀 Create New Game</h3>
          {user?.accountType === 'FREE' ? (
            <div className="space-y-3">
              <div className="bg-red-500/20 border border-red-500/30 rounded-lg p-3">
                <div className="flex items-center space-x-2 text-red-400">
                  <span>🔒</span>
                  <span className="text-sm font-medium">Premium Feature</span>
                </div>
                <p className="text-red-300 text-xs mt-1">Only premium users can create custom games</p>
              </div>
              <button 
                onClick={() => setShowUpgradeModal(true)}
                className="btn-warning w-full"
              >
                👑 Upgrade to Create Games
              </button>
            </div>
          ) : (
            <div className="space-y-3">
              <p className="text-gray-300 text-sm">Create a custom game with your own settings</p>
              <button 
                onClick={handleCreateGame}
                className="btn-primary w-full"
              >
                Create Game
              </button>
            </div>
          )}
        </div>

        {/* Join Game by Code */}
        <div className="glass-card p-6">
          <h3 className="text-xl font-bold text-white mb-4">🔗 Join by Code</h3>
          <p className="text-gray-300 text-sm mb-4">Enter a game code to join a private game</p>
          <div className="space-y-3">
            <input
              type="text"
              value={joinCode}
              onChange={(e) => setJoinCode(e.target.value.toUpperCase())}
              placeholder="Enter game code..."
              className="w-full p-3 bg-white/10 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:border-purple-500 focus:outline-none"
              maxLength={6}
            />
            <button 
              onClick={handleJoinByCode}
              className="btn-secondary w-full"
              disabled={!joinCode.trim()}
            >
              Join Game
            </button>
          </div>
        </div>
      </div>

      {/* Ad Banner for FREE users */}
      {user?.accountType === 'FREE' && (
        <AdBanner placement="lobby" className="animate-fade-in-scale" />
      )}

      {/* Available Games */}
      <div className="glass-card p-6">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold text-white">🎯 Available Games</h2>
          <button 
            onClick={loadAvailableGames}
            className="btn-ghost"
          >
            🔄 Refresh
          </button>
        </div>

        {games.length === 0 ? (
          <div className="text-center py-12">
            <div className="text-6xl mb-4">🎮</div>
            <h3 className="text-xl font-bold text-white mb-2">No games available</h3>
            <p className="text-gray-400 mb-6">Be the first to create a game!</p>
            {user?.accountType === 'PREMIUM' ? (
              <button 
                onClick={handleCreateGame}
                className="btn-primary"
              >
                Create First Game
              </button>
            ) : (
              <button 
                onClick={() => setShowUpgradeModal(true)}
                className="btn-warning"
              >
                Upgrade to Create Games
              </button>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {games.map((game, index) => (
              <div 
                key={game.id}
                className="glass-card p-4 card-hover animate-fade-in-scale"
                style={{ animationDelay: `${index * 0.1}s` }}
              >
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center space-x-3">
                    <h3 className="text-lg font-bold text-white">{game.questionSet.name}</h3>
                    {getAccountTypeBadge(game.creator.accountType)}
                  </div>
                  <div className="text-right">
                    <div className="text-purple-400 font-bold">#{game.code}</div>
                    {game.isPrivate && (
                      <div className="text-xs text-yellow-400">🔒 Private</div>
                    )}
                  </div>
                </div>

                <div className="space-y-2 mb-4">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-400">Category:</span>
                    <span className="text-white">{game.questionSet.category}</span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-400">Difficulty:</span>
                    <span className={getDifficultyColor(game.questionSet.difficulty)}>
                      {game.questionSet.difficulty}
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-400">Players:</span>
                    <span className="text-white">{game.participantCount}/{game.maxPlayers}</span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-400">Questions:</span>
                    <span className="text-white">{game.totalQuestions}</span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-400">Creator:</span>
                    <span className="text-white">{game.creator.username}</span>
                  </div>
                </div>

                <button 
                  onClick={() => handleJoinGame(game.code)}
                  className="btn-primary w-full"
                  disabled={game.participantCount >= game.maxPlayers}
                >
                  {game.participantCount >= game.maxPlayers ? '🔒 Full' : '🎮 Join Game'}
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Upgrade Modal */}
      {showUpgradeModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="glass-card p-8 max-w-lg w-full mx-4">
            <div className="text-center">
              <div className="text-6xl mb-4">👑</div>
              <h2 className="text-3xl font-bold text-white mb-4">Upgrade to Premium</h2>
              <p className="text-gray-300 mb-6">
                Unlock the full BrainBrawler experience with Premium features!
              </p>

              {/* Premium Features */}
              <div className="space-y-4 mb-8">
                <div className="flex items-start space-x-3 text-left">
                  <div className="text-green-400 text-xl">✓</div>
                  <div>
                    <h4 className="text-white font-bold">Create Custom Games</h4>
                    <p className="text-gray-400 text-sm">Set your own rules, player count, and time limits</p>
                  </div>
                </div>
                <div className="flex items-start space-x-3 text-left">
                  <div className="text-green-400 text-xl">✓</div>
                  <div>
                    <h4 className="text-white font-bold">Build Question Sets</h4>
                    <p className="text-gray-400 text-sm">Create custom trivia content for your friends</p>
                  </div>
                </div>
                <div className="flex items-start space-x-3 text-left">
                  <div className="text-green-400 text-xl">✓</div>
                  <div>
                    <h4 className="text-white font-bold">No Advertisements</h4>
                    <p className="text-gray-400 text-sm">Enjoy uninterrupted gaming sessions</p>
                  </div>
                </div>
                <div className="flex items-start space-x-3 text-left">
                  <div className="text-green-400 text-xl">✓</div>
                  <div>
                    <h4 className="text-white font-bold">AI Question Generation</h4>
                    <p className="text-gray-400 text-sm">Use AI to generate questions automatically</p>
                  </div>
                </div>
              </div>

              <div className="flex space-x-4">
                <button 
                  onClick={() => setShowUpgradeModal(false)}
                  className="btn-ghost flex-1"
                >
                  Maybe Later
                </button>
                <button 
                  onClick={() => {
                    setShowUpgradeModal(false)
                    navigate('/premium')
                  }}
                  className="btn-warning flex-1"
                >
                  Upgrade Now
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default GameLobby 