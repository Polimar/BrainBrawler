import { useState, useEffect } from 'react'
import { 
  UserPlus, 
  Users, 
  Search, 
  Check, 
  X, 
  Clock,
  UserMinus,
  MessageCircle,
  GamepadIcon
} from 'lucide-react'
import toast from 'react-hot-toast'

interface User {
  id: string
  username: string
  selectedAvatarId?: string
  isOnline: boolean
  lastSeen: string
  relationshipStatus?: 'friend' | 'pending' | 'none'
}

interface Friend extends User {
  friendshipCreatedAt: string
}

interface FriendRequest {
  id: string
  status: string
  createdAt: string
  sender: User
  receiver: User
}

export default function Friends() {
  const [activeTab, setActiveTab] = useState<'friends' | 'requests' | 'search'>('friends')
  const [friends, setFriends] = useState<Friend[]>([])
  const [receivedRequests, setReceivedRequests] = useState<FriendRequest[]>([])
  const [sentRequests, setSentRequests] = useState<FriendRequest[]>([])
  const [searchResults, setSearchResults] = useState<User[]>([])
  const [searchQuery, setSearchQuery] = useState('')
  const [loading, setLoading] = useState(false)

  const API_BASE_URL = `${window.location.protocol}//${window.location.hostname}${window.location.port ? ':' + window.location.port : ''}/api`

  const getAuthHeaders = () => ({
    'Authorization': `Bearer ${localStorage.getItem('brainbrawler_token')}`,
    'Content-Type': 'application/json'
  })

  // Load friends on component mount
  useEffect(() => {
    loadFriends()
    loadFriendRequests()
  }, [])

  const loadFriends = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/friends`, {
        headers: getAuthHeaders()
      })
      
      if (response.ok) {
        const data = await response.json()
        setFriends(data.friends || [])
      }
    } catch (error) {
      console.error('Error loading friends:', error)
    }
  }

  const loadFriendRequests = async () => {
    try {
      const [receivedResponse, sentResponse] = await Promise.all([
        fetch(`${API_BASE_URL}/friends/requests`, { headers: getAuthHeaders() }),
        fetch(`${API_BASE_URL}/friends/sent-requests`, { headers: getAuthHeaders() })
      ])

      if (receivedResponse.ok) {
        const receivedData = await receivedResponse.json()
        setReceivedRequests(receivedData.requests || [])
      }

      if (sentResponse.ok) {
        const sentData = await sentResponse.json()
        setSentRequests(sentData.requests || [])
      }
    } catch (error) {
      console.error('Error loading friend requests:', error)
    }
  }

  const searchUsers = async (query: string) => {
    if (query.length < 2) {
      setSearchResults([])
      return
    }

    setLoading(true)
    try {
      const response = await fetch(`${API_BASE_URL}/friends/search`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify({ query })
      })

      if (response.ok) {
        const data = await response.json()
        setSearchResults(data.users || [])
      }
    } catch (error) {
      console.error('Error searching users:', error)
    } finally {
      setLoading(false)
    }
  }

  const sendFriendRequest = async (userId: string) => {
    try {
      const response = await fetch(`${API_BASE_URL}/friends/request`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify({ userId })
      })

      if (response.ok) {
        toast.success('Friend request sent!')
        // Update search results to show pending status
        setSearchResults(prev => 
          prev.map(user => 
            user.id === userId 
              ? { ...user, relationshipStatus: 'pending' }
              : user
          )
        )
        loadFriendRequests()
      } else {
        const error = await response.json()
        toast.error(error.error || 'Failed to send friend request')
      }
    } catch (error) {
      toast.error('Failed to send friend request')
    }
  }

  const acceptFriendRequest = async (requestId: string) => {
    try {
      const response = await fetch(`${API_BASE_URL}/friends/accept/${requestId}`, {
        method: 'POST',
        headers: getAuthHeaders()
      })

      if (response.ok) {
        toast.success('Friend request accepted!')
        loadFriends()
        loadFriendRequests()
      } else {
        const error = await response.json()
        toast.error(error.error || 'Failed to accept friend request')
      }
    } catch (error) {
      toast.error('Failed to accept friend request')
    }
  }

  const rejectFriendRequest = async (requestId: string) => {
    try {
      const response = await fetch(`${API_BASE_URL}/friends/reject/${requestId}`, {
        method: 'POST',
        headers: getAuthHeaders()
      })

      if (response.ok) {
        toast.success('Friend request rejected')
        loadFriendRequests()
      } else {
        const error = await response.json()
        toast.error(error.error || 'Failed to reject friend request')
      }
    } catch (error) {
      toast.error('Failed to reject friend request')
    }
  }

  const removeFriend = async (friendId: string) => {
    if (!confirm('Are you sure you want to remove this friend?')) return

    try {
      const response = await fetch(`${API_BASE_URL}/friends/${friendId}`, {
        method: 'DELETE',
        headers: getAuthHeaders()
      })

      if (response.ok) {
        toast.success('Friend removed')
        loadFriends()
      } else {
        const error = await response.json()
        toast.error(error.error || 'Failed to remove friend')
      }
    } catch (error) {
      toast.error('Failed to remove friend')
    }
  }

  const formatTimeAgo = (dateString: string) => {
    const date = new Date(dateString)
    const now = new Date()
    const diffMs = now.getTime() - date.getTime()
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24))
    
    if (diffDays === 0) return 'Today'
    if (diffDays === 1) return 'Yesterday'
    if (diffDays < 7) return `${diffDays} days ago`
    return date.toLocaleDateString()
  }

  const UserCard = ({ user, type, requestId }: { 
    user: User | Friend
    type: 'friend' | 'received' | 'sent' | 'search'
    requestId?: string 
  }) => (
    <div className="bg-gray-800 rounded-xl p-4 border border-gray-700 hover:border-gray-600 transition-all">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <div className="relative">
            <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-pink-500 rounded-full flex items-center justify-center text-white font-semibold text-lg">
              {user.username[0].toUpperCase()}
            </div>
            {user.isOnline && (
              <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-green-500 border-2 border-gray-800 rounded-full"></div>
            )}
          </div>
          <div>
            <h3 className="text-white font-semibold">{user.username}</h3>
            <p className="text-gray-400 text-sm">
              {user.isOnline ? 'Online' : `Last seen ${formatTimeAgo(user.lastSeen)}`}
            </p>
          </div>
        </div>

        <div className="flex items-center space-x-2">
          {type === 'friend' && (
            <>
              <button className="p-2 bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors">
                <MessageCircle size={18} />
              </button>
              <button className="p-2 bg-purple-600 hover:bg-purple-700 rounded-lg transition-colors">
                <GamepadIcon size={18} />
              </button>
              <button 
                onClick={() => removeFriend(user.id)}
                className="p-2 bg-red-600 hover:bg-red-700 rounded-lg transition-colors"
              >
                <UserMinus size={18} />
              </button>
            </>
          )}
          
          {type === 'received' && requestId && (
            <>
              <button 
                onClick={() => acceptFriendRequest(requestId)}
                className="p-2 bg-green-600 hover:bg-green-700 rounded-lg transition-colors"
              >
                <Check size={18} />
              </button>
              <button 
                onClick={() => rejectFriendRequest(requestId)}
                className="p-2 bg-red-600 hover:bg-red-700 rounded-lg transition-colors"
              >
                <X size={18} />
              </button>
            </>
          )}

          {type === 'sent' && (
            <div className="flex items-center space-x-2 text-yellow-400">
              <Clock size={18} />
              <span className="text-sm">Pending</span>
            </div>
          )}

          {type === 'search' && user.relationshipStatus === 'none' && (
            <button 
              onClick={() => sendFriendRequest(user.id)}
              className="p-2 bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors"
            >
              <UserPlus size={18} />
            </button>
          )}

          {type === 'search' && user.relationshipStatus === 'pending' && (
            <div className="flex items-center space-x-2 text-yellow-400">
              <Clock size={18} />
              <span className="text-sm">Pending</span>
            </div>
          )}

          {type === 'search' && user.relationshipStatus === 'friend' && (
            <div className="flex items-center space-x-2 text-green-400">
              <Check size={18} />
              <span className="text-sm">Friends</span>
            </div>
          )}
        </div>
      </div>
    </div>
  )

  return (
    <div className="max-w-4xl mx-auto p-6">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-white mb-2">Friends</h1>
        <p className="text-gray-400">Manage your friendships and find new players</p>
      </div>

      {/* Tabs */}
      <div className="flex space-x-1 mb-6 bg-gray-800 p-1 rounded-xl">
        <button
          onClick={() => setActiveTab('friends')}
          className={`flex-1 py-3 px-4 rounded-lg font-medium transition-all ${
            activeTab === 'friends'
              ? 'bg-blue-600 text-white'
              : 'text-gray-400 hover:text-white'
          }`}
        >
          <div className="flex items-center justify-center space-x-2">
            <Users size={20} />
            <span>Friends ({friends.length})</span>
          </div>
        </button>
        <button
          onClick={() => setActiveTab('requests')}
          className={`flex-1 py-3 px-4 rounded-lg font-medium transition-all ${
            activeTab === 'requests'
              ? 'bg-blue-600 text-white'
              : 'text-gray-400 hover:text-white'
          }`}
        >
          <div className="flex items-center justify-center space-x-2">
            <Clock size={20} />
            <span>Requests ({receivedRequests.length})</span>
          </div>
        </button>
        <button
          onClick={() => setActiveTab('search')}
          className={`flex-1 py-3 px-4 rounded-lg font-medium transition-all ${
            activeTab === 'search'
              ? 'bg-blue-600 text-white'
              : 'text-gray-400 hover:text-white'
          }`}
        >
          <div className="flex items-center justify-center space-x-2">
            <Search size={20} />
            <span>Find Friends</span>
          </div>
        </button>
      </div>

      {/* Tab Content */}
      {activeTab === 'friends' && (
        <div className="space-y-4">
          {friends.length === 0 ? (
            <div className="text-center py-12">
              <Users size={64} className="mx-auto text-gray-600 mb-4" />
              <h3 className="text-xl text-gray-400 mb-2">No friends yet</h3>
              <p className="text-gray-500">Start by searching for players to add as friends</p>
            </div>
          ) : (
            friends.map(friend => (
              <UserCard key={friend.id} user={friend} type="friend" />
            ))
          )}
        </div>
      )}

      {activeTab === 'requests' && (
        <div className="space-y-6">
          {/* Received Requests */}
          <div>
            <h2 className="text-xl font-semibold text-white mb-4">Friend Requests ({receivedRequests.length})</h2>
            <div className="space-y-4">
              {receivedRequests.length === 0 ? (
                <div className="text-center py-8">
                  <Clock size={48} className="mx-auto text-gray-600 mb-3" />
                  <p className="text-gray-400">No pending friend requests</p>
                </div>
              ) : (
                receivedRequests.map(request => (
                  <UserCard 
                    key={request.id} 
                    user={request.sender} 
                    type="received" 
                    requestId={request.id}
                  />
                ))
              )}
            </div>
          </div>

          {/* Sent Requests */}
          <div>
            <h2 className="text-xl font-semibold text-white mb-4">Sent Requests ({sentRequests.length})</h2>
            <div className="space-y-4">
              {sentRequests.length === 0 ? (
                <div className="text-center py-8">
                  <p className="text-gray-400">No sent requests</p>
                </div>
              ) : (
                sentRequests.map(request => (
                  <UserCard 
                    key={request.id} 
                    user={request.receiver} 
                    type="sent"
                  />
                ))
              )}
            </div>
          </div>
        </div>
      )}

      {activeTab === 'search' && (
        <div className="space-y-6">
          {/* Search Input */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
            <input
              type="text"
              placeholder="Search by username or email..."
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value)
                searchUsers(e.target.value)
              }}
              className="w-full pl-10 pr-4 py-3 bg-gray-800 border border-gray-700 rounded-xl text-white placeholder-gray-400 focus:border-blue-500 focus:outline-none"
            />
          </div>

          {/* Search Results */}
          <div className="space-y-4">
            {loading && (
              <div className="text-center py-8">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto"></div>
                <p className="text-gray-400 mt-4">Searching...</p>
              </div>
            )}

            {!loading && searchQuery.length >= 2 && searchResults.length === 0 && (
              <div className="text-center py-8">
                <Search size={48} className="mx-auto text-gray-600 mb-3" />
                <p className="text-gray-400">No users found</p>
              </div>
            )}

            {searchResults.map(user => (
              <UserCard key={user.id} user={user} type="search" />
            ))}
          </div>
        </div>
      )}
    </div>
  )
} 