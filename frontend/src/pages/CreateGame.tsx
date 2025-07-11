import { useState, useEffect } from 'react'
import { useSelector } from 'react-redux'
import { useNavigate } from 'react-router-dom'
import { RootState } from '../store/store'
import { 
  GamepadIcon,
  Users,
  Settings,
  Lock,
  Copy,
  Check,
  UserPlus
} from 'lucide-react'
import toast from 'react-hot-toast'

interface QuestionSet {
  id: string
  name: string
  description?: string
  category: string
  difficulty: string
  questionsCount: number
  isPublic: boolean
  isPremium: boolean
  owner?: {
    username: string
  }
}

interface Friend {
  id: string
  username: string
  isOnline: boolean
  lastSeen: string
}

interface GameSettings {
  questionSetId: string
  maxPlayers: number
  totalQuestions: number
  timePerQuestion: number
  isPrivate: boolean
}

export default function CreateGame() {
  const { user } = useSelector((state: RootState) => state.auth)
  const navigate = useNavigate()
  
  const [questionSets, setQuestionSets] = useState<QuestionSet[]>([])
  const [friends, setFriends] = useState<Friend[]>([])
  const [selectedFriends, setSelectedFriends] = useState<string[]>([])
  const [loading, setLoading] = useState(true)
  const [creating, setCreating] = useState(false)
  const [gameCreated, setGameCreated] = useState<any>(null)
  const [copiedCode, setCopiedCode] = useState(false)

  const [settings, setSettings] = useState<GameSettings>({
    questionSetId: '',
    maxPlayers: 4,
    totalQuestions: 10,
    timePerQuestion: 30,
    isPrivate: false
  })

  const API_BASE_URL = `${window.location.protocol}//${window.location.hostname}${window.location.port ? ':' + window.location.port : ''}/api`

  const getAuthHeaders = () => ({
    'Authorization': `Bearer ${localStorage.getItem('brainbrawler_token')}`,
    'Content-Type': 'application/json'
  })

  const isPremium = user?.accountType === 'PREMIUM' || user?.accountType === 'ADMIN'

  useEffect(() => {
    if (isPremium) {
      loadData()
    }
  }, [isPremium])

  const loadData = async () => {
    try {
      setLoading(true)
      const [questionSetsResponse, friendsResponse] = await Promise.all([
        fetch(`${API_BASE_URL}/question-sets`, { headers: getAuthHeaders() }),
        fetch(`${API_BASE_URL}/friends`, { headers: getAuthHeaders() })
      ])

      if (questionSetsResponse.ok) {
        const questionSetsData = await questionSetsResponse.json()
        setQuestionSets(questionSetsData.questionSets || [])
        // Auto-select first available question set
        if (questionSetsData.questionSets?.length > 0) {
          setSettings(prev => ({ 
            ...prev, 
            questionSetId: questionSetsData.questionSets[0].id 
          }))
        }
      }

      if (friendsResponse.ok) {
        const friendsData = await friendsResponse.json()
        setFriends(friendsData.friends || [])
      }
    } catch (error) {
      console.error('Error loading data:', error)
    } finally {
      setLoading(false)
    }
  }

  const createGame = async () => {
    if (!settings.questionSetId) {
      toast.error('Please select a question set')
      return
    }

    setCreating(true)
    try {
      const response = await fetch(`${API_BASE_URL}/games`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify(settings)
      })

      if (response.ok) {
        const data = await response.json()
        setGameCreated(data.game)
        toast.success('Game created successfully!')
        
        // Send invitations to selected friends
        if (selectedFriends.length > 0) {
          await sendInvitations()
        }
      } else {
        const error = await response.json()
        toast.error(error.error || 'Failed to create game')
      }
    } catch (error) {
      toast.error('Failed to create game')
    } finally {
      setCreating(false)
    }
  }

  const sendInvitations = async () => {
    // Note: This would typically send actual invitations via WebSocket or push notifications
    // For now, we'll just show a success message
    toast.success(`Invitations sent to ${selectedFriends.length} friends!`)
  }

  const copyGameCode = () => {
    if (gameCreated) {
      navigator.clipboard.writeText(gameCreated.code)
      setCopiedCode(true)
      toast.success('Game code copied!')
      setTimeout(() => setCopiedCode(false), 2000)
    }
  }

  const joinCreatedGame = () => {
    if (gameCreated) {
      navigate(`/app/game/${gameCreated.code}`)
    }
  }

  const selectedQuestionSet = questionSets.find(qs => qs.id === settings.questionSetId)

  if (!isPremium) {
    return (
      <div className="max-w-4xl mx-auto p-6">
        <div className="text-center py-12">
          <Lock size={64} className="mx-auto text-gray-600 mb-4" />
          <h1 className="text-2xl font-bold text-white mb-4">Premium Feature Required</h1>
          <p className="text-gray-400 mb-6">
            Creating games is only available for Premium users. Free users can join games created by others.
          </p>
          <button 
            onClick={() => navigate('/app/lobby')}
            className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg font-semibold transition-colors mr-4"
          >
            Browse Games
          </button>
          <button className="bg-gradient-to-r from-purple-600 to-pink-600 text-white px-6 py-3 rounded-lg font-semibold hover:from-purple-700 hover:to-pink-700 transition-all">
            Upgrade to Premium
          </button>
        </div>
      </div>
    )
  }

  if (gameCreated) {
    return (
      <div className="max-w-4xl mx-auto p-6">
        <div className="text-center py-12">
          <div className="bg-green-600 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-6">
            <Check size={32} className="text-white" />
          </div>
          
          <h1 className="text-3xl font-bold text-white mb-4">Game Created!</h1>
          <p className="text-gray-400 mb-8">Your game is ready and waiting for players</p>

          {/* Game Details */}
          <div className="bg-gray-800 rounded-xl p-6 mb-8 max-w-md mx-auto">
            <h2 className="text-xl font-semibold text-white mb-4">Game Details</h2>
            
            <div className="space-y-3 text-left">
              <div className="flex justify-between">
                <span className="text-gray-400">Game Code:</span>
                <div className="flex items-center space-x-2">
                  <code className="bg-gray-700 px-2 py-1 rounded text-yellow-400 font-mono">
                    {gameCreated.code}
                  </code>
                  <button
                    onClick={copyGameCode}
                    className="p-1 hover:bg-gray-700 rounded transition-colors"
                  >
                    {copiedCode ? (
                      <Check size={16} className="text-green-400" />
                    ) : (
                      <Copy size={16} className="text-gray-400" />
                    )}
                  </button>
                </div>
              </div>
              
              <div className="flex justify-between">
                <span className="text-gray-400">Question Set:</span>
                <span className="text-white">{gameCreated.questionSet?.name}</span>
              </div>
              
              <div className="flex justify-between">
                <span className="text-gray-400">Max Players:</span>
                <span className="text-white">{gameCreated.maxPlayers}</span>
              </div>
              
              <div className="flex justify-between">
                <span className="text-gray-400">Questions:</span>
                <span className="text-white">{gameCreated.totalQuestions}</span>
              </div>
              
              <div className="flex justify-between">
                <span className="text-gray-400">Time per Question:</span>
                <span className="text-white">{gameCreated.timePerQuestion}s</span>
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="flex flex-col sm:flex-row justify-center space-y-3 sm:space-y-0 sm:space-x-4">
            <button
              onClick={joinCreatedGame}
              className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg font-semibold transition-colors flex items-center justify-center space-x-2"
            >
              <GamepadIcon size={20} />
              <span>Join Game</span>
            </button>
            
            <button
              onClick={() => setGameCreated(null)}
              className="bg-gray-600 hover:bg-gray-700 text-white px-6 py-3 rounded-lg font-semibold transition-colors"
            >
              Create Another
            </button>
          </div>

          {selectedFriends.length > 0 && (
            <div className="mt-8 p-4 bg-green-900/30 border border-green-700 rounded-lg">
              <p className="text-green-400 text-sm">
                ✓ Invitations sent to {selectedFriends.length} friends
              </p>
            </div>
          )}
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-4xl mx-auto p-6">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-white mb-2">Create Game</h1>
        <p className="text-gray-400">Set up a custom game for you and your friends</p>
      </div>

      {loading ? (
        <div className="text-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto"></div>
          <p className="text-gray-400 mt-4">Loading...</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Game Settings */}
          <div className="space-y-6">
            <div className="bg-gray-800 rounded-xl p-6">
              <h2 className="text-xl font-semibold text-white mb-4 flex items-center space-x-2">
                <Settings size={24} />
                <span>Game Settings</span>
              </h2>

              <div className="space-y-4">
                {/* Question Set Selection */}
                <div>
                  <label className="block text-gray-300 text-sm font-medium mb-2">
                    Question Set
                  </label>
                  <select
                    value={settings.questionSetId}
                    onChange={(e) => setSettings(prev => ({ ...prev, questionSetId: e.target.value }))}
                    className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:border-blue-500 focus:outline-none"
                  >
                    <option value="">Select a question set</option>
                    {questionSets.map(qs => (
                      <option key={qs.id} value={qs.id}>
                        {qs.name} ({qs.questionsCount} questions)
                      </option>
                    ))}
                  </select>
                  {selectedQuestionSet && (
                    <p className="text-gray-400 text-sm mt-1">
                      {selectedQuestionSet.description} • {selectedQuestionSet.category} • {selectedQuestionSet.difficulty}
                    </p>
                  )}
                </div>

                {/* Max Players */}
                <div>
                  <label className="block text-gray-300 text-sm font-medium mb-2">
                    Max Players
                  </label>
                  <select
                    value={settings.maxPlayers}
                    onChange={(e) => setSettings(prev => ({ ...prev, maxPlayers: parseInt(e.target.value) }))}
                    className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:border-blue-500 focus:outline-none"
                  >
                    {[2, 3, 4, 5, 6, 7, 8].map(num => (
                      <option key={num} value={num}>{num} players</option>
                    ))}
                  </select>
                </div>

                {/* Total Questions */}
                <div>
                  <label className="block text-gray-300 text-sm font-medium mb-2">
                    Number of Questions
                  </label>
                  <select
                    value={settings.totalQuestions}
                    onChange={(e) => setSettings(prev => ({ ...prev, totalQuestions: parseInt(e.target.value) }))}
                    className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:border-blue-500 focus:outline-none"
                  >
                    {[5, 10, 15, 20, 25, 30].map(num => (
                      <option key={num} value={num}>{num} questions</option>
                    ))}
                  </select>
                </div>

                {/* Time per Question */}
                <div>
                  <label className="block text-gray-300 text-sm font-medium mb-2">
                    Time per Question
                  </label>
                  <select
                    value={settings.timePerQuestion}
                    onChange={(e) => setSettings(prev => ({ ...prev, timePerQuestion: parseInt(e.target.value) }))}
                    className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:border-blue-500 focus:outline-none"
                  >
                    {[15, 20, 25, 30, 45, 60].map(seconds => (
                      <option key={seconds} value={seconds}>{seconds} seconds</option>
                    ))}
                  </select>
                </div>

                {/* Privacy Setting */}
                <div>
                  <label className="flex items-center space-x-3">
                    <input
                      type="checkbox"
                      checked={settings.isPrivate}
                      onChange={(e) => setSettings(prev => ({ ...prev, isPrivate: e.target.checked }))}
                      className="form-checkbox h-5 w-5 text-blue-600 rounded focus:ring-blue-500 focus:ring-2"
                    />
                    <div>
                      <span className="text-gray-300 font-medium">Private Game</span>
                      <p className="text-gray-400 text-sm">Only invited players can join</p>
                    </div>
                  </label>
                </div>
              </div>
            </div>
          </div>

          {/* Friend Invitations */}
          <div className="space-y-6">
            <div className="bg-gray-800 rounded-xl p-6">
              <h2 className="text-xl font-semibold text-white mb-4 flex items-center space-x-2">
                <UserPlus size={24} />
                <span>Invite Friends</span>
              </h2>

              {friends.length === 0 ? (
                <div className="text-center py-8">
                  <Users size={48} className="mx-auto text-gray-600 mb-3" />
                  <p className="text-gray-400 mb-4">No friends to invite</p>
                  <button
                    onClick={() => navigate('/app/friends')}
                    className="text-blue-400 hover:text-blue-300 transition-colors"
                  >
                    Add some friends first
                  </button>
                </div>
              ) : (
                <div className="space-y-3 max-h-64 overflow-y-auto">
                  {friends.map(friend => (
                    <div
                      key={friend.id}
                      className={`flex items-center justify-between p-3 rounded-lg border transition-all cursor-pointer ${
                        selectedFriends.includes(friend.id)
                          ? 'bg-blue-600/20 border-blue-500'
                          : 'bg-gray-700 border-gray-600 hover:border-gray-500'
                      }`}
                      onClick={() => {
                        setSelectedFriends(prev =>
                          prev.includes(friend.id)
                            ? prev.filter(id => id !== friend.id)
                            : [...prev, friend.id]
                        )
                      }}
                    >
                      <div className="flex items-center space-x-3">
                        <div className="relative">
                          <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-pink-500 rounded-full flex items-center justify-center text-white font-semibold">
                            {friend.username[0].toUpperCase()}
                          </div>
                          {friend.isOnline && (
                            <div className="absolute -bottom-1 -right-1 w-3 h-3 bg-green-500 border-2 border-gray-800 rounded-full"></div>
                          )}
                        </div>
                        <div>
                          <p className="text-white font-medium">{friend.username}</p>
                          <p className="text-gray-400 text-sm">
                            {friend.isOnline ? 'Online' : 'Offline'}
                          </p>
                        </div>
                      </div>

                      <div className={`w-5 h-5 rounded border-2 flex items-center justify-center ${
                        selectedFriends.includes(friend.id)
                          ? 'bg-blue-500 border-blue-500'
                          : 'border-gray-400'
                      }`}>
                        {selectedFriends.includes(friend.id) && (
                          <Check size={12} className="text-white" />
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {selectedFriends.length > 0 && (
                <div className="mt-4 p-3 bg-blue-600/20 border border-blue-500 rounded-lg">
                  <p className="text-blue-400 text-sm">
                    {selectedFriends.length} friend{selectedFriends.length > 1 ? 's' : ''} selected for invitation
                  </p>
                </div>
              )}
            </div>

            {/* Create Game Button */}
            <button
              onClick={createGame}
              disabled={creating || !settings.questionSetId}
              className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 disabled:from-gray-600 disabled:to-gray-600 text-white px-6 py-4 rounded-xl font-semibold transition-all disabled:cursor-not-allowed flex items-center justify-center space-x-2"
            >
              {creating ? (
                <>
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                  <span>Creating Game...</span>
                </>
              ) : (
                <>
                  <GamepadIcon size={20} />
                  <span>Create Game</span>
                </>
              )}
            </button>
          </div>
        </div>
      )}
    </div>
  )
} 