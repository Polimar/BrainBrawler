import React, { useState, useEffect, useRef } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useSelector } from 'react-redux'
import { RootState } from '../store/store'
import { api } from '../services/api'
import toast from 'react-hot-toast'

interface Player {
  id: string
  username: string
  accountType: string
  isHost: boolean
  isReady: boolean
  score: number
  isOnline: boolean
  joinedAt: string
}

interface Question {
  id: string
  text: string
  options: { id: string; text: string }[]
  correctAnswer: string
  timeLimit: number
  points: number
}

interface GameState {
  id: string
  code: string
  state: 'WAITING' | 'IN_PROGRESS' | 'COMPLETED'
  questionSet: {
    name: string
    category: string
    difficulty: string
  }
  participants: Player[]
  currentQuestion: Question | null
  currentQuestionIndex: number
  totalQuestions: number
  timePerQuestion: number
  timeRemaining: number
  maxPlayers: number
  isHost: boolean
  hostId: string
  scores: { [playerId: string]: number }
}

const GameRoom: React.FC = () => {
  const { gameId } = useParams<{ gameId: string }>()
  const navigate = useNavigate()
  const { user } = useSelector((state: RootState) => state.auth)
  
  const [gameState, setGameState] = useState<GameState | null>(null)
  const [selectedAnswer, setSelectedAnswer] = useState<string>('')
  const [hasAnswered, setHasAnswered] = useState(false)
  const [loading, setLoading] = useState(true)
  const [timeLeft, setTimeLeft] = useState(0)
  const [mounted, setMounted] = useState(false)
  
  const timerRef = useRef<number>()
  const pollRef = useRef<number>()

  useEffect(() => {
    setMounted(true)
    if (gameId) {
      loadGameState()
      startPolling()
    }
    
    return () => {
      if (timerRef.current) clearInterval(timerRef.current)
      if (pollRef.current) clearInterval(pollRef.current)
    }
  }, [gameId])

  useEffect(() => {
    if (gameState?.state === 'IN_PROGRESS' && gameState.currentQuestion) {
      setTimeLeft(gameState.timeRemaining || gameState.timePerQuestion)
      setHasAnswered(false)
      setSelectedAnswer('')
      startTimer()
    }
  }, [gameState?.currentQuestion, gameState?.state])

  const loadGameState = async () => {
    try {
      const response = await api.get(`/games/${gameId}`)
      const game = response.data.game
      
      setGameState({
        ...game,
        isHost: game.hostId === user?.id,
        participants: game.participants || [],
        scores: game.scores || {}
      })
      setLoading(false)
    } catch (error: any) {
      console.error('Error loading game:', error)
      toast.error('Failed to load game')
      navigate('/app/lobby')
    }
  }

  const startPolling = () => {
    pollRef.current = setInterval(loadGameState, 2000)
  }

  const startTimer = () => {
    if (timerRef.current) clearInterval(timerRef.current)
    
    timerRef.current = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) {
          if (!hasAnswered) {
            handleTimeUp()
          }
          return 0
        }
        return prev - 1
      })
    }, 1000)
  }

  const handleStartGame = async () => {
    try {
      await api.post(`/games/${gameId}/start`)
      toast.success('Game started!')
    } catch (error: any) {
      toast.error(error.response?.data?.error || 'Failed to start game')
    }
  }

  const handleToggleReady = async () => {
    try {
      await api.post(`/games/${gameId}/ready`)
    } catch (error: any) {
      toast.error(error.response?.data?.error || 'Failed to update ready status')
    }
  }

  const handleAnswerSelect = async (answerId: string) => {
    if (hasAnswered || !gameState?.currentQuestion) return
    
    setSelectedAnswer(answerId)
    setHasAnswered(true)
    
    try {
      await api.post(`/games/${gameId}/answer`, {
        questionId: gameState.currentQuestion.id,
        answer: answerId,
        timeElapsed: gameState.timePerQuestion - timeLeft
      })
      toast.success('Answer submitted!')
    } catch (error: any) {
      console.error('Error submitting answer:', error)
      setHasAnswered(false)
      setSelectedAnswer('')
      toast.error('Failed to submit answer')
    }
  }

  const handleTimeUp = async () => {
    if (hasAnswered || !gameState?.currentQuestion) return
    
    setHasAnswered(true)
    try {
      await api.post(`/games/${gameId}/answer`, {
        questionId: gameState.currentQuestion.id,
        answer: null,
        timeElapsed: gameState.timePerQuestion
      })
      toast.error('Time\'s up!')
    } catch (error) {
      console.error('Error submitting timeout:', error)
    }
  }

  const handleLeaveGame = async () => {
    try {
      await api.post(`/games/${gameId}/leave`)
      navigate('/app/lobby')
    } catch (error) {
      console.error('Error leaving game:', error)
      navigate('/app/lobby')
    }
  }

  const getAnswerButtonClass = (optionId: string) => {
    if (!hasAnswered) {
      return 'btn-secondary w-full text-left justify-start p-4 min-h-[60px] transition-all duration-200 hover:scale-105'
    }
    
    if (selectedAnswer === optionId) {
      return 'btn-primary w-full text-left justify-start p-4 min-h-[60px] ring-2 ring-purple-400'
    }
    
    return 'btn-disabled w-full text-left justify-start p-4 min-h-[60px] opacity-50'
  }

  const getTimerColor = () => {
    if (timeLeft > 10) return 'text-green-400'
    if (timeLeft > 5) return 'text-yellow-400'
    return 'text-red-400 animate-pulse'
  }

  const getPlayerReadyIcon = (player: Player) => {
    if (player.isHost) return '👑'
    if (player.isReady) return '✅'
    return '⏳'
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-purple-500 border-t-transparent rounded-full animate-spin mb-4"></div>
          <p className="text-gray-300">Loading game...</p>
        </div>
      </div>
    )
  }

  if (!gameState) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="text-6xl mb-4">🎮</div>
          <h1 className="text-2xl font-bold text-white mb-2">Game not found</h1>
          <p className="text-gray-300 mb-4">This game may have ended or doesn't exist.</p>
          <button onClick={() => navigate('/app/lobby')} className="btn-primary">
            Back to Lobby
          </button>
        </div>
      </div>
    )
  }

  // Waiting Room
  if (gameState.state === 'WAITING') {
    const currentPlayer = gameState.participants.find(p => p.id === user?.id)
    const readyPlayersCount = gameState.participants.filter(p => p.isReady || p.isHost).length
    
    return (
      <div className={`space-y-6 ${mounted ? 'animate-fade-in-scale' : 'opacity-0'}`}>
        {/* Game Info Header */}
        <div className="glass-card p-6 bg-gradient-to-r from-purple-600/20 to-pink-600/20 border-purple-500/30">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h1 className="text-3xl font-bold text-white mb-2">🎮 {gameState.questionSet.name}</h1>
              <div className="flex items-center space-x-4 text-gray-300">
                <span className="bg-purple-500/30 px-3 py-1 rounded-full text-sm">
                  {gameState.questionSet.category}
                </span>
                <span className="bg-yellow-500/30 px-3 py-1 rounded-full text-sm">
                  {gameState.questionSet.difficulty}
                </span>
                <span className="bg-blue-500/30 px-3 py-1 rounded-full text-sm">
                  Room: {gameState.code}
                </span>
              </div>
            </div>
            <button 
              onClick={handleLeaveGame}
              className="btn-error"
            >
              🚪 Leave Game
            </button>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-center">
            <div>
              <div className="text-2xl font-bold text-white">{gameState.participants.length}/{gameState.maxPlayers}</div>
              <div className="text-gray-400 text-sm">Players</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-white">{gameState.totalQuestions}</div>
              <div className="text-gray-400 text-sm">Questions</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-white">{gameState.timePerQuestion}s</div>
              <div className="text-gray-400 text-sm">Per Question</div>
            </div>
          </div>
        </div>

        {/* Players List */}
        <div className="glass-card p-6">
          <h2 className="text-2xl font-bold text-white mb-4">👥 Players ({gameState.participants.length}/{gameState.maxPlayers})</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {gameState.participants.map((player, index) => (
              <div 
                key={player.id}
                className={`glass-card p-4 flex items-center space-x-3 animate-slide-in-up ${
                  player.id === user?.id ? 'border-purple-500/50 bg-purple-500/10' : ''
                }`}
                style={{ animationDelay: `${index * 0.1}s` }}
              >
                <div className="w-12 h-12 bg-gradient-to-r from-pink-500 to-purple-600 rounded-full flex items-center justify-center text-white font-bold">
                  {player.username[0].toUpperCase()}
                </div>
                <div className="flex-1">
                  <div className="flex items-center space-x-2">
                    <h3 className="text-white font-bold">{player.username}</h3>
                    {player.id === user?.id && <span className="text-xs bg-purple-500/30 px-2 py-1 rounded-full text-purple-300">YOU</span>}
                    {player.accountType === 'PREMIUM' && <span className="text-xs bg-yellow-500/30 px-2 py-1 rounded-full text-yellow-300">★</span>}
                  </div>
                  <p className="text-gray-400 text-sm">
                    {player.isHost ? 'Host' : player.isReady ? 'Ready' : 'Not Ready'}
                  </p>
                </div>
                <div className="text-2xl">
                  {getPlayerReadyIcon(player)}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Game Controls */}
        <div className="glass-card p-6">
          <div className="flex flex-col md:flex-row gap-4 justify-center">
            {!gameState.isHost ? (
              <button 
                onClick={handleToggleReady}
                className={`${
                  currentPlayer?.isReady 
                    ? 'btn-success' 
                    : 'btn-primary'
                } px-8 py-4 text-lg`}
              >
                {currentPlayer?.isReady ? '✅ Ready!' : '🎯 Get Ready'}
              </button>
            ) : (
              <button 
                onClick={handleStartGame}
                disabled={readyPlayersCount < 2}
                className="btn-success px-8 py-4 text-lg disabled:opacity-50 disabled:cursor-not-allowed"
              >
                🚀 Start Game
              </button>
            )}
          </div>
          
          {gameState.isHost && (
            <p className="text-center text-gray-400 text-sm mt-4">
              Waiting for players to get ready... ({readyPlayersCount}/{gameState.participants.length} ready)
            </p>
          )}
        </div>
      </div>
    )
  }

  // Game In Progress
  if (gameState.state === 'IN_PROGRESS' && gameState.currentQuestion) {
    return (
      <div className={`space-y-6 ${mounted ? 'animate-slide-in-up' : 'opacity-0'}`}>
        {/* Progress Bar */}
        <div className="glass-card p-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-white font-bold">
              Question {gameState.currentQuestionIndex + 1} of {gameState.totalQuestions}
            </span>
            <span className={`font-bold text-xl ${getTimerColor()}`}>
              ⏱️ {timeLeft}s
            </span>
          </div>
          <div className="w-full bg-gray-700 rounded-full h-3">
            <div 
              className="bg-gradient-to-r from-purple-500 to-pink-500 h-3 rounded-full transition-all duration-300"
              style={{ width: `${((gameState.currentQuestionIndex + 1) / gameState.totalQuestions) * 100}%` }}
            ></div>
          </div>
        </div>

        {/* Question */}
        <div className="glass-card p-8 text-center">
          <h1 className="text-2xl md:text-3xl font-bold text-white mb-6 leading-relaxed">
            {gameState.currentQuestion.text}
          </h1>
        </div>

        {/* Answer Options */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {gameState.currentQuestion.options.map((option, index) => (
            <button
              key={option.id}
              onClick={() => handleAnswerSelect(option.id)}
              disabled={hasAnswered}
              className={`${getAnswerButtonClass(option.id)} animate-fade-in-scale`}
              style={{ animationDelay: `${index * 0.1}s` }}
            >
              <span className="font-bold text-xl mr-4 w-8 h-8 bg-white/20 rounded-full flex items-center justify-center">
                {String.fromCharCode(65 + index)}
              </span>
              <span className="flex-1">{option.text}</span>
            </button>
          ))}
        </div>

        {/* Status */}
        {hasAnswered && (
          <div className="glass-card p-4 text-center bg-green-500/20 border-green-500/30">
            <p className="text-green-400 font-bold">✅ Answer submitted! Waiting for other players...</p>
          </div>
        )}

        {/* Player Scores */}
        <div className="glass-card p-4">
          <h3 className="text-white font-bold mb-3">🏆 Live Scores</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
            {gameState.participants
              .sort((a, b) => (gameState.scores[b.id] || 0) - (gameState.scores[a.id] || 0))
              .map((player) => (
                <div key={player.id} className="text-center">
                  <div className={`text-sm truncate ${player.id === user?.id ? 'text-purple-400 font-bold' : 'text-white'}`}>
                    {player.username}
                  </div>
                  <div className="text-lg font-bold text-yellow-400">
                    {gameState.scores[player.id] || 0}
                  </div>
                </div>
              ))}
          </div>
        </div>
      </div>
    )
  }

  // Game Completed
  if (gameState.state === 'COMPLETED') {
    const sortedPlayers = gameState.participants
      .sort((a, b) => (gameState.scores[b.id] || 0) - (gameState.scores[a.id] || 0))

    return (
      <div className={`space-y-6 ${mounted ? 'animate-fade-in-scale' : 'opacity-0'}`}>
        {/* Game Over Header */}
        <div className="glass-card p-6 text-center bg-gradient-to-r from-purple-600/20 to-pink-600/20 border-purple-500/30">
          <div className="text-6xl mb-4 animate-bounce">🏆</div>
          <h1 className="text-4xl font-bold text-white mb-2">Game Over!</h1>
          <p className="text-gray-300">Thanks for playing BrainBrawler</p>
        </div>

        {/* Final Leaderboard */}
        <div className="glass-card p-6">
          <h2 className="text-2xl font-bold text-white mb-6 text-center">🎉 Final Results</h2>
          <div className="space-y-3">
            {sortedPlayers.map((player, index) => (
              <div 
                key={player.id}
                className={`glass-card p-4 flex items-center space-x-4 animate-slide-in-up ${
                  player.id === user?.id ? 'border-purple-500/50 bg-purple-500/10 ring-2 ring-purple-500/30' : ''
                }`}
                style={{ animationDelay: `${index * 0.1}s` }}
              >
                <div className="text-4xl">
                  {index === 0 ? '🥇' : index === 1 ? '🥈' : index === 2 ? '🥉' : '🏅'}
                </div>
                <div className="w-12 h-12 bg-gradient-to-r from-pink-500 to-purple-600 rounded-full flex items-center justify-center text-white font-bold">
                  {player.username[0].toUpperCase()}
                </div>
                <div className="flex-1">
                  <h3 className={`font-bold text-lg ${player.id === user?.id ? 'text-purple-400' : 'text-white'}`}>
                    {player.username}
                    {player.id === user?.id && <span className="ml-2 text-xs bg-purple-500/30 px-2 py-1 rounded-full">YOU</span>}
                  </h3>
                  <p className="text-gray-400 text-sm">Position #{index + 1}</p>
                </div>
                <div className="text-right">
                  <div className="text-3xl font-bold text-yellow-400">
                    {gameState.scores[player.id] || 0}
                  </div>
                  <div className="text-xs text-gray-400">points</div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col md:flex-row gap-4 justify-center">
          <button 
            onClick={() => navigate('/app/lobby')}
            className="btn-primary px-8 py-4 text-lg"
          >
            🎮 Play Again
          </button>
          <button 
            onClick={() => navigate('/app/leaderboard')}
            className="btn-secondary px-8 py-4 text-lg"
          >
            🏆 View Leaderboard
          </button>
          <button 
            onClick={() => navigate('/app')}
            className="btn-ghost px-8 py-4 text-lg"
          >
            🏠 Dashboard
          </button>
        </div>
      </div>
    )
  }

  return null
}

export default GameRoom 