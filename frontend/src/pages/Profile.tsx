import React, { useState, useEffect } from 'react'
import { useSelector } from 'react-redux'
import { RootState } from '../store/store'
import { api } from '../services/api'
import toast from 'react-hot-toast'

interface Friend {
  id: string
  username: string
  selectedAvatarId: string | null
  isOnline: boolean
  lastSeen: string
  friendshipCreatedAt: string
}

interface FriendRequest {
  id: string
  sender: {
    id: string
    username: string
    selectedAvatarId: string | null
    isOnline: boolean
    lastSeen: string
  }
  receiver?: {
    id: string
    username: string
    selectedAvatarId: string | null
    isOnline: boolean
    lastSeen: string
  }
  status: string
  createdAt: string
}

interface SearchResult {
  id: string
  username: string
  selectedAvatarId: string | null
  isOnline: boolean
  lastSeen: string
  relationshipStatus: 'friend' | 'pending' | 'none'
}

const Profile: React.FC = () => {
  const { user } = useSelector((state: RootState) => state.auth)
  const [activeTab, setActiveTab] = useState<'stats' | 'friends' | 'search' | 'requests'>('stats')
  const [friends, setFriends] = useState<Friend[]>([])
  const [friendRequests, setFriendRequests] = useState<FriendRequest[]>([])
  const [sentRequests, setSentRequests] = useState<FriendRequest[]>([])
  const [searchResults, setSearchResults] = useState<SearchResult[]>([])
  const [searchQuery, setSearchQuery] = useState('')
  const [loading, setLoading] = useState(false)
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
    loadFriends()
    loadFriendRequests()
  }, [])

  const loadFriends = async () => {
    try {
      const response = await api.get('/friends')
      setFriends(response.data.friends || [])
    } catch (error) {
      console.error('Error loading friends:', error)
    }
  }

  const loadFriendRequests = async () => {
    try {
      const [receivedRes, sentRes] = await Promise.all([
        api.get('/friends/requests'),
        api.get('/friends/sent-requests')
      ])
      setFriendRequests(receivedRes.data.requests || [])
      setSentRequests(sentRes.data.requests || [])
    } catch (error) {
      console.error('Error loading friend requests:', error)
    }
  }

  const handleSearch = async () => {
    if (!searchQuery.trim() || searchQuery.length < 2) {
      toast.error('Search query must be at least 2 characters')
      return
    }

    setLoading(true)
    try {
      const response = await api.post('/friends/search', {
        query: searchQuery.trim()
      })
      setSearchResults(response.data.users || [])
    } catch (error: any) {
      const message = error.response?.data?.error || 'Search failed'
      toast.error(message)
    } finally {
      setLoading(false)
    }
  }

  const handleSendFriendRequest = async (userId: string, username: string) => {
    try {
      await api.post('/friends/request', { userId })
      toast.success(`Friend request sent to ${username}!`)
      
      // Update search results
      setSearchResults(prev => prev.map(user => 
        user.id === userId 
          ? { ...user, relationshipStatus: 'pending' }
          : user
      ))
      
      // Refresh sent requests
      loadFriendRequests()
    } catch (error: any) {
      const message = error.response?.data?.error || 'Failed to send friend request'
      toast.error(message)
    }
  }

  const handleAcceptRequest = async (requestId: string, senderName: string) => {
    try {
      await api.post(`/friends/accept/${requestId}`)
      toast.success(`You are now friends with ${senderName}!`)
      loadFriends()
      loadFriendRequests()
    } catch (error: any) {
      const message = error.response?.data?.error || 'Failed to accept friend request'
      toast.error(message)
    }
  }

  const handleRejectRequest = async (requestId: string) => {
    try {
      await api.post(`/friends/reject/${requestId}`)
      toast.success('Friend request rejected')
      loadFriendRequests()
    } catch (error: any) {
      const message = error.response?.data?.error || 'Failed to reject friend request'
      toast.error(message)
    }
  }

  const handleRemoveFriend = async (friendId: string, username: string) => {
    if (!confirm(`Are you sure you want to remove ${username} from your friends?`)) {
      return
    }

    try {
      await api.delete(`/friends/${friendId}`)
      toast.success(`${username} removed from friends`)
      loadFriends()
    } catch (error: any) {
      const message = error.response?.data?.error || 'Failed to remove friend'
      toast.error(message)
    }
  }

  const getStatusIcon = (isOnline: boolean, lastSeen: string) => {
    if (isOnline) return '🟢'
    const lastSeenDate = new Date(lastSeen)
    const now = new Date()
    const diffHours = (now.getTime() - lastSeenDate.getTime()) / (1000 * 60 * 60)
    
    if (diffHours < 1) return '🟡' // Less than 1 hour
    if (diffHours < 24) return '🟠' // Less than 24 hours
    return '🔴' // More than 24 hours
  }

  const getLastSeenText = (isOnline: boolean, lastSeen: string) => {
    if (isOnline) return 'Online now'
    const lastSeenDate = new Date(lastSeen)
    const now = new Date()
    const diffMinutes = (now.getTime() - lastSeenDate.getTime()) / (1000 * 60)
    
    if (diffMinutes < 60) return `${Math.floor(diffMinutes)}m ago`
    if (diffMinutes < 1440) return `${Math.floor(diffMinutes / 60)}h ago`
    return `${Math.floor(diffMinutes / 1440)}d ago`
  }

  const renderUserAvatar = (username: string, isOnline: boolean) => (
    <div className="relative">
      <div className="w-12 h-12 bg-gradient-to-r from-pink-500 to-purple-600 rounded-full flex items-center justify-center text-white font-bold">
        {username[0].toUpperCase()}
      </div>
      {isOnline && (
        <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-green-500 rounded-full border-2 border-gray-800"></div>
      )}
    </div>
  )

  const tabs = [
    { id: 'stats', label: 'Statistics', icon: '📊' },
    { id: 'friends', label: 'Friends', icon: '👥', badge: friends.length },
    { id: 'search', label: 'Find Friends', icon: '🔍' },
    { id: 'requests', label: 'Requests', icon: '📩', badge: friendRequests.length }
  ]

  return (
    <div className={`space-y-6 ${mounted ? 'animate-fade-in-scale' : 'opacity-0'}`}>
      {/* Profile Header */}
      <div className="glass-card p-6 bg-gradient-to-r from-purple-600/20 to-pink-600/20 border-purple-500/30">
        <div className="flex items-center space-x-4 mb-4">
          <div className="w-20 h-20 bg-gradient-to-r from-pink-500 to-purple-600 rounded-full flex items-center justify-center text-white font-bold text-2xl">
            {user?.username?.[0]?.toUpperCase() || 'U'}
          </div>
          <div>
            <h1 className="text-3xl font-bold text-white">{user?.username}</h1>
            <div className="flex items-center space-x-4 text-gray-300">
              <span className={`${user?.accountType === 'PREMIUM' ? 'text-yellow-400' : 'text-gray-400'}`}>
                {user?.accountType === 'PREMIUM' ? '⭐ Premium User' : '🆓 Free User'}
              </span>
              <span className="text-green-400">🟢 Online</span>
            </div>
          </div>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="glass-card p-2">
        <div className="flex space-x-2">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`flex-1 relative px-4 py-3 rounded-lg font-medium transition-all duration-200 ${
                activeTab === tab.id
                  ? 'bg-purple-500/30 text-white'
                  : 'text-gray-300 hover:text-white hover:bg-white/10'
              }`}
            >
              <span className="mr-2">{tab.icon}</span>
              {tab.label}
              {tab.badge && tab.badge > 0 && (
                <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                  {tab.badge}
                </span>
              )}
            </button>
          ))}
        </div>
      </div>

      {/* Tab Content */}
      {activeTab === 'stats' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 animate-fade-in-scale">
          {/* Game Statistics */}
          <div className="glass-card p-6">
            <h2 className="text-2xl font-bold text-white mb-4">🎮 Game Statistics</h2>
            <div className="space-y-4">
              <div className="flex justify-between">
                <span className="text-gray-300">Games Played:</span>
                <span className="text-white font-bold">{user?.totalGamesPlayed || 0}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-300">Games Won:</span>
                <span className="text-white font-bold">{user?.totalGamesWon || 0}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-300">Win Rate:</span>
                <span className="text-white font-bold">
                  {user && user.totalGamesPlayed > 0 
                    ? `${Math.round((user.totalGamesWon / user.totalGamesPlayed) * 100)}%`
                    : '0%'}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-300">Total Score:</span>
                <span className="text-yellow-400 font-bold">{user?.totalScore?.toLocaleString() || '0'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-300">Coins:</span>
                <span className="text-yellow-400 font-bold">💰 {user?.coins?.toLocaleString() || '0'}</span>
              </div>
            </div>
          </div>

          {/* Account Settings */}
          <div className="glass-card p-6">
            <h2 className="text-2xl font-bold text-white mb-4">⚙️ Account Settings</h2>
            <div className="space-y-4">
              <button className="btn-secondary w-full">✏️ Edit Profile</button>
              <button className="btn-warning w-full">🔒 Change Password</button>
              {user?.accountType === 'FREE' && (
                <button className="btn-primary w-full">⭐ Upgrade to Premium</button>
              )}
              <button className="btn-ghost w-full">🎨 Customize Avatar</button>
              <button className="btn-error w-full">🚪 Sign Out</button>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'friends' && (
        <div className="glass-card p-6 animate-slide-in-up">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold text-white">👥 Your Friends ({friends.length})</h2>
            <button 
              onClick={loadFriends}
              className="btn-ghost text-sm"
            >
              🔄 Refresh
            </button>
          </div>
          
          {friends.length === 0 ? (
            <div className="text-center py-8">
              <div className="text-4xl mb-4">👻</div>
              <p className="text-gray-400">No friends yet!</p>
              <p className="text-gray-500 text-sm mt-2">Use the search tab to find and add friends.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {friends.map((friend, index) => (
                <div 
                  key={friend.id}
                  className="glass-card p-4 flex items-center justify-between animate-fade-in-scale"
                  style={{ animationDelay: `${index * 0.1}s` }}
                >
                  <div className="flex items-center space-x-3">
                    {renderUserAvatar(friend.username, friend.isOnline)}
                    <div>
                      <h3 className="text-white font-bold">{friend.username}</h3>
                      <p className="text-gray-400 text-sm flex items-center">
                        {getStatusIcon(friend.isOnline, friend.lastSeen)}
                        <span className="ml-1">{getLastSeenText(friend.isOnline, friend.lastSeen)}</span>
                      </p>
                    </div>
                  </div>
                  <div className="flex space-x-2">
                    <button className="btn-primary text-sm">🎮 Invite to Game</button>
                    <button 
                      onClick={() => handleRemoveFriend(friend.id, friend.username)}
                      className="btn-error text-sm"
                    >
                      ❌
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {activeTab === 'search' && (
        <div className="glass-card p-6 animate-slide-in-up">
          <h2 className="text-2xl font-bold text-white mb-6">🔍 Find New Friends</h2>
          
          <div className="flex space-x-4 mb-6">
            <input
              type="text"
              placeholder="Search by username or email..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
              className="input-field flex-1"
            />
            <button 
              onClick={handleSearch}
              disabled={loading || searchQuery.length < 2}
              className="btn-primary disabled:opacity-50"
            >
              {loading ? <div className="spinner"></div> : '🔍 Search'}
            </button>
          </div>

          {searchResults.length > 0 && (
            <div className="space-y-3">
              {searchResults.map((user, index) => (
                <div 
                  key={user.id}
                  className="glass-card p-4 flex items-center justify-between animate-fade-in-scale"
                  style={{ animationDelay: `${index * 0.1}s` }}
                >
                  <div className="flex items-center space-x-3">
                    {renderUserAvatar(user.username, user.isOnline)}
                    <div>
                      <h3 className="text-white font-bold">{user.username}</h3>
                      <p className="text-gray-400 text-sm flex items-center">
                        {getStatusIcon(user.isOnline, user.lastSeen)}
                        <span className="ml-1">{getLastSeenText(user.isOnline, user.lastSeen)}</span>
                      </p>
                    </div>
                  </div>
                  <div>
                    {user.relationshipStatus === 'friend' && (
                      <span className="text-green-400 text-sm">✅ Already friends</span>
                    )}
                    {user.relationshipStatus === 'pending' && (
                      <span className="text-yellow-400 text-sm">⏳ Request sent</span>
                    )}
                    {user.relationshipStatus === 'none' && (
                      <button 
                        onClick={() => handleSendFriendRequest(user.id, user.username)}
                        className="btn-success text-sm"
                      >
                        ➕ Add Friend
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {activeTab === 'requests' && (
        <div className="space-y-6 animate-slide-in-up">
          {/* Received Requests */}
          <div className="glass-card p-6">
            <h2 className="text-2xl font-bold text-white mb-4">📩 Friend Requests ({friendRequests.length})</h2>
            
            {friendRequests.length === 0 ? (
              <div className="text-center py-6">
                <p className="text-gray-400">No pending friend requests</p>
              </div>
            ) : (
              <div className="space-y-3">
                {friendRequests.map((request, index) => (
                  <div 
                    key={request.id}
                    className="glass-card p-4 flex items-center justify-between animate-fade-in-scale"
                    style={{ animationDelay: `${index * 0.1}s` }}
                  >
                    <div className="flex items-center space-x-3">
                      {renderUserAvatar(request.sender.username, request.sender.isOnline)}
                      <div>
                        <h3 className="text-white font-bold">{request.sender.username}</h3>
                        <p className="text-gray-400 text-sm">
                          Sent {new Date(request.createdAt).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                    <div className="flex space-x-2">
                      <button 
                        onClick={() => handleAcceptRequest(request.id, request.sender.username)}
                        className="btn-success text-sm"
                      >
                        ✅ Accept
                      </button>
                      <button 
                        onClick={() => handleRejectRequest(request.id)}
                        className="btn-error text-sm"
                      >
                        ❌ Decline
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Sent Requests */}
          <div className="glass-card p-6">
            <h2 className="text-2xl font-bold text-white mb-4">📤 Sent Requests ({sentRequests.length})</h2>
            
            {sentRequests.length === 0 ? (
              <div className="text-center py-6">
                <p className="text-gray-400">No sent requests</p>
              </div>
            ) : (
              <div className="space-y-3">
                {sentRequests.map((request, index) => (
                  <div 
                    key={request.id}
                    className="glass-card p-4 flex items-center justify-between animate-fade-in-scale"
                    style={{ animationDelay: `${index * 0.1}s` }}
                  >
                    <div className="flex items-center space-x-3">
                      {renderUserAvatar(request.receiver!.username, request.receiver!.isOnline)}
                      <div>
                        <h3 className="text-white font-bold">{request.receiver!.username}</h3>
                        <p className="text-gray-400 text-sm">
                          Sent {new Date(request.createdAt).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                    <span className="text-yellow-400 text-sm">⏳ Pending</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}

export default Profile 