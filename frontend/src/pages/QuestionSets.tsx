import { useState, useEffect } from 'react'
import { useSelector } from 'react-redux'
import { RootState } from '../store/store'
import { 
  Plus,
  BookOpen,
  Brain,
  Trash2,
  Edit,
  Eye,
  Sparkles,
  Lock,
  Users
} from 'lucide-react'
import toast from 'react-hot-toast'

interface QuestionSet {
  id: string
  name: string
  description?: string
  category: string
  difficulty: 'EASY' | 'MEDIUM' | 'HARD'
  isPublic: boolean
  isPremium: boolean
  ownerId?: string
  questionsCount: number
  createdAt: string
  updatedAt: string
  owner?: {
    username: string
    accountType: string
  }
}

interface CreateQuestionSetData {
  name: string
  description: string
  category: string
  difficulty: 'EASY' | 'MEDIUM' | 'HARD'
  topic: string
  questionCount: number
}

export default function QuestionSets() {
  const { user } = useSelector((state: RootState) => state.auth)
  const [questionSets, setQuestionSets] = useState<QuestionSet[]>([])
  const [loading, setLoading] = useState(true)
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [showLLMModal, setShowLLMModal] = useState(false)
  const [generatingQuestions, setGeneratingQuestions] = useState(false)

  const [createData, setCreateData] = useState<CreateQuestionSetData>({
    name: '',
    description: '',
    category: 'GENERAL',
    difficulty: 'MEDIUM',
    topic: '',
    questionCount: 10
  })

  const API_BASE_URL = `${window.location.protocol}//${window.location.hostname}${window.location.port ? ':' + window.location.port : ''}/api`

  const getAuthHeaders = () => ({
    'Authorization': `Bearer ${localStorage.getItem('brainbrawler_token')}`,
    'Content-Type': 'application/json'
  })

  const isPremium = user?.accountType === 'PREMIUM' || user?.accountType === 'ADMIN'

  useEffect(() => {
    loadQuestionSets()
  }, [])

  const loadQuestionSets = async () => {
    try {
      setLoading(true)
      const response = await fetch(`${API_BASE_URL}/question-sets`, {
        headers: getAuthHeaders()
      })
      
      if (response.ok) {
        const data = await response.json()
        setQuestionSets(data.questionSets || [])
      }
    } catch (error) {
      console.error('Error loading question sets:', error)
    } finally {
      setLoading(false)
    }
  }

  const createQuestionSetManually = async () => {
    if (!createData.name.trim()) {
      toast.error('Name is required')
      return
    }

    try {
      const response = await fetch(`${API_BASE_URL}/premium/question-sets`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify(createData)
      })

      if (response.ok) {
        toast.success('Question set created successfully!')
        setShowCreateModal(false)
        setCreateData({
          name: '',
          description: '',
          category: 'GENERAL',
          difficulty: 'MEDIUM',
          topic: '',
          questionCount: 10
        })
        loadQuestionSets()
      } else {
        const error = await response.json()
        toast.error(error.error || 'Failed to create question set')
      }
    } catch (error) {
      toast.error('Failed to create question set')
    }
  }

  const generateQuestionsWithLLM = async () => {
    if (!createData.name.trim() || !createData.topic.trim()) {
      toast.error('Name and topic are required')
      return
    }

    setGeneratingQuestions(true)
    try {
      const response = await fetch(`${API_BASE_URL}/premium/question-sets`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify({
          ...createData,
          useAI: true
        })
      })

      if (response.ok) {
        toast.success('Questions generated successfully!')
        setShowLLMModal(false)
        setCreateData({
          name: '',
          description: '',
          category: 'GENERAL',
          difficulty: 'MEDIUM',
          topic: '',
          questionCount: 10
        })
        loadQuestionSets()
      } else {
        const error = await response.json()
        toast.error(error.error || 'Failed to generate questions')
      }
    } catch (error) {
      toast.error('Failed to generate questions')
    } finally {
      setGeneratingQuestions(false)
    }
  }

  const deleteQuestionSet = async (id: string) => {
    if (!confirm('Are you sure you want to delete this question set?')) return

    try {
      const response = await fetch(`${API_BASE_URL}/question-sets/${id}`, {
        method: 'DELETE',
        headers: getAuthHeaders()
      })

      if (response.ok) {
        toast.success('Question set deleted')
        loadQuestionSets()
      } else {
        const error = await response.json()
        toast.error(error.error || 'Failed to delete question set')
      }
    } catch (error) {
      toast.error('Failed to delete question set')
    }
  }

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'EASY': return 'text-green-400 bg-green-900/30'
      case 'MEDIUM': return 'text-yellow-400 bg-yellow-900/30'
      case 'HARD': return 'text-red-400 bg-red-900/30'
      default: return 'text-gray-400 bg-gray-900/30'
    }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString()
  }

  if (!isPremium) {
    return (
      <div className="max-w-4xl mx-auto p-6">
        <div className="text-center py-12">
          <Lock size={64} className="mx-auto text-gray-600 mb-4" />
          <h1 className="text-2xl font-bold text-white mb-4">Premium Feature Required</h1>
          <p className="text-gray-400 mb-6">
            Creating custom question sets is only available for Premium users.
          </p>
          <button className="bg-gradient-to-r from-purple-600 to-pink-600 text-white px-6 py-3 rounded-lg font-semibold hover:from-purple-700 hover:to-pink-700 transition-all">
            Upgrade to Premium
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-6xl mx-auto p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-white mb-2">Question Sets</h1>
          <p className="text-gray-400">Create and manage your custom question sets</p>
        </div>

        <div className="flex space-x-3">
          <button
            onClick={() => setShowCreateModal(true)}
            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-medium transition-colors flex items-center space-x-2"
          >
            <Plus size={20} />
            <span>Create Manual</span>
          </button>
          <button
            onClick={() => setShowLLMModal(true)}
            className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white px-4 py-2 rounded-lg font-medium transition-all flex items-center space-x-2"
          >
            <Sparkles size={20} />
            <span>AI Generate</span>
          </button>
        </div>
      </div>

      {/* Question Sets Grid */}
      {loading ? (
        <div className="text-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto"></div>
          <p className="text-gray-400 mt-4">Loading question sets...</p>
        </div>
      ) : questionSets.length === 0 ? (
        <div className="text-center py-12">
          <BookOpen size={64} className="mx-auto text-gray-600 mb-4" />
          <h3 className="text-xl text-gray-400 mb-2">No question sets yet</h3>
          <p className="text-gray-500 mb-6">Create your first question set to get started</p>
          <button
            onClick={() => setShowCreateModal(true)}
            className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg font-medium transition-colors"
          >
            Create Your First Set
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {questionSets.map(set => (
            <div key={set.id} className="bg-gray-800 rounded-xl p-6 border border-gray-700 hover:border-gray-600 transition-all">
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center space-x-2">
                  <Brain className="text-purple-400" size={24} />
                  <div>
                    <h3 className="text-white font-semibold text-lg">{set.name}</h3>
                    <p className="text-gray-400 text-sm">{set.category}</p>
                  </div>
                </div>

                <div className="flex space-x-1">
                  {set.ownerId === user?.id && (
                    <>
                      <button className="p-1 text-gray-400 hover:text-blue-400 transition-colors">
                        <Edit size={16} />
                      </button>
                      <button 
                        onClick={() => deleteQuestionSet(set.id)}
                        className="p-1 text-gray-400 hover:text-red-400 transition-colors"
                      >
                        <Trash2 size={16} />
                      </button>
                    </>
                  )}
                  <button className="p-1 text-gray-400 hover:text-green-400 transition-colors">
                    <Eye size={16} />
                  </button>
                </div>
              </div>

              {set.description && (
                <p className="text-gray-300 text-sm mb-4 line-clamp-2">{set.description}</p>
              )}

              <div className="flex items-center justify-between mb-4">
                <span className={`px-3 py-1 rounded-full text-xs font-medium ${getDifficultyColor(set.difficulty)}`}>
                  {set.difficulty}
                </span>
                <span className="text-gray-400 text-sm">{set.questionsCount} questions</span>
              </div>

              <div className="flex items-center justify-between text-sm text-gray-400">
                <div className="flex items-center space-x-1">
                  {set.isPublic ? (
                    <>
                      <Users size={14} />
                      <span>Public</span>
                    </>
                  ) : (
                    <>
                      <Lock size={14} />
                      <span>Private</span>
                    </>
                  )}
                </div>
                <span>Created {formatDate(set.createdAt)}</span>
              </div>

              {set.owner && set.ownerId !== user?.id && (
                <div className="mt-3 pt-3 border-t border-gray-700">
                  <p className="text-gray-400 text-xs">
                    by <span className="text-purple-400">{set.owner.username}</span>
                  </p>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Create Manual Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-gray-800 rounded-xl p-6 w-full max-w-md">
            <h2 className="text-xl font-bold text-white mb-4">Create Question Set</h2>
            
            <div className="space-y-4">
              <div>
                <label className="block text-gray-300 text-sm font-medium mb-2">Name</label>
                <input
                  type="text"
                  value={createData.name}
                  onChange={(e) => setCreateData(prev => ({ ...prev, name: e.target.value }))}
                  className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:border-blue-500 focus:outline-none"
                  placeholder="My Awesome Quiz"
                />
              </div>

              <div>
                <label className="block text-gray-300 text-sm font-medium mb-2">Description</label>
                <textarea
                  value={createData.description}
                  onChange={(e) => setCreateData(prev => ({ ...prev, description: e.target.value }))}
                  className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:border-blue-500 focus:outline-none"
                  rows={3}
                  placeholder="Brief description of your question set"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-gray-300 text-sm font-medium mb-2">Category</label>
                  <select
                    value={createData.category}
                    onChange={(e) => setCreateData(prev => ({ ...prev, category: e.target.value }))}
                    className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:border-blue-500 focus:outline-none"
                  >
                    <option value="GENERAL">General</option>
                    <option value="SCIENCE">Science</option>
                    <option value="HISTORY">History</option>
                    <option value="GEOGRAPHY">Geography</option>
                    <option value="SPORTS">Sports</option>
                    <option value="ENTERTAINMENT">Entertainment</option>
                    <option value="TECHNOLOGY">Technology</option>
                  </select>
                </div>

                <div>
                  <label className="block text-gray-300 text-sm font-medium mb-2">Difficulty</label>
                  <select
                    value={createData.difficulty}
                    onChange={(e) => setCreateData(prev => ({ ...prev, difficulty: e.target.value as 'EASY' | 'MEDIUM' | 'HARD' }))}
                    className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:border-blue-500 focus:outline-none"
                  >
                    <option value="EASY">Easy</option>
                    <option value="MEDIUM">Medium</option>
                    <option value="HARD">Hard</option>
                  </select>
                </div>
              </div>
            </div>

            <div className="flex space-x-3 mt-6">
              <button
                onClick={() => setShowCreateModal(false)}
                className="flex-1 px-4 py-2 bg-gray-600 hover:bg-gray-700 text-white rounded-lg transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={createQuestionSetManually}
                className="flex-1 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
              >
                Create
              </button>
            </div>
          </div>
        </div>
      )}

      {/* AI Generate Modal */}
      {showLLMModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-gray-800 rounded-xl p-6 w-full max-w-md">
            <h2 className="text-xl font-bold text-white mb-4 flex items-center space-x-2">
              <Sparkles className="text-purple-400" />
              <span>AI Question Generator</span>
            </h2>
            
            <div className="space-y-4">
              <div>
                <label className="block text-gray-300 text-sm font-medium mb-2">Set Name</label>
                <input
                  type="text"
                  value={createData.name}
                  onChange={(e) => setCreateData(prev => ({ ...prev, name: e.target.value }))}
                  className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:border-blue-500 focus:outline-none"
                  placeholder="AI Generated Quiz"
                />
              </div>

              <div>
                <label className="block text-gray-300 text-sm font-medium mb-2">Topic</label>
                <input
                  type="text"
                  value={createData.topic}
                  onChange={(e) => setCreateData(prev => ({ ...prev, topic: e.target.value }))}
                  className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:border-blue-500 focus:outline-none"
                  placeholder="e.g., World War 2, Physics, Italian Renaissance"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-gray-300 text-sm font-medium mb-2">Questions</label>
                  <select
                    value={createData.questionCount}
                    onChange={(e) => setCreateData(prev => ({ ...prev, questionCount: parseInt(e.target.value) }))}
                    className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:border-blue-500 focus:outline-none"
                  >
                    <option value={5}>5 Questions</option>
                    <option value={10}>10 Questions</option>
                    <option value={15}>15 Questions</option>
                    <option value={20}>20 Questions</option>
                  </select>
                </div>

                <div>
                  <label className="block text-gray-300 text-sm font-medium mb-2">Difficulty</label>
                  <select
                    value={createData.difficulty}
                    onChange={(e) => setCreateData(prev => ({ ...prev, difficulty: e.target.value as 'EASY' | 'MEDIUM' | 'HARD' }))}
                    className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:border-blue-500 focus:outline-none"
                  >
                    <option value="EASY">Easy</option>
                    <option value="MEDIUM">Medium</option>
                    <option value="HARD">Hard</option>
                  </select>
                </div>
              </div>
            </div>

            <div className="flex space-x-3 mt-6">
              <button
                onClick={() => setShowLLMModal(false)}
                disabled={generatingQuestions}
                className="flex-1 px-4 py-2 bg-gray-600 hover:bg-gray-700 text-white rounded-lg transition-colors disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                onClick={generateQuestionsWithLLM}
                disabled={generatingQuestions}
                className="flex-1 px-4 py-2 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white rounded-lg transition-all disabled:opacity-50 flex items-center justify-center space-x-2"
              >
                {generatingQuestions ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                    <span>Generating...</span>
                  </>
                ) : (
                  <>
                    <Sparkles size={16} />
                    <span>Generate</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
} 