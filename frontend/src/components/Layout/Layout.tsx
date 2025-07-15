import React, { useEffect } from 'react'
import { Outlet, NavLink, useNavigate } from 'react-router-dom'
import { useDispatch, useSelector } from 'react-redux'
import { AppDispatch, RootState } from '../../store/store'
import { logout, loadUser } from '../../store/slices/authSlice'

const Layout: React.FC = () => {
  const dispatch = useDispatch<AppDispatch>()
  const navigate = useNavigate()
  const { user } = useSelector((state: RootState) => state.auth)

  useEffect(() => {
    if (!user) {
      dispatch(loadUser())
    }
  }, [dispatch, user])

  const handleLogout = () => {
    dispatch(logout())
    navigate('/auth')
  }

  const navItems = [
    { path: '/app', label: 'Dashboard', icon: '🏠', exact: true },
    { path: '/app/lobby', label: 'Game Lobby', icon: '🎮' },
    { path: '/app/create-game', label: 'Create Game', icon: '➕', premium: true },
    { path: '/app/friends', label: 'Friends', icon: '👥' },
    { path: '/app/question-sets', label: 'Question Sets', icon: '📚', premium: true },
    { path: '/app/profile', label: 'Profile', icon: '👤' },
    { path: '/app/shop', label: 'Shop', icon: '🛒' },
    { path: '/app/leaderboard', label: 'Leaderboard', icon: '🏆' },
  ]

  const isAdmin = user?.accountType === 'ADMIN'
  if (isAdmin) {
    navItems.push({ path: '/app/admin', label: 'Admin Panel', icon: '🛠️' })
  }

  const isPremium = user?.accountType === 'PREMIUM' || user?.accountType === 'ADMIN'

  return (
    <div className="min-h-screen flex">
      {/* Sidebar */}
      <aside className="w-64 bg-gradient-to-b from-gray-900/90 to-gray-800/90 backdrop-blur-xl border-r border-white/10">
        {/* Logo */}
        <div className="p-6 border-b border-white/10">
          <div className="flex items-center space-x-3">
            <img 
              src="/logo.jpg" 
              alt="BrainBrawler" 
              className="w-10 h-10 rounded-xl brain-glow"
            />
            <div>
              <h1 className="text-xl font-bold text-white">BrainBrawler</h1>
              <p className="text-xs text-gray-400">Challenge Your Mind</p>
            </div>
          </div>
        </div>

        {/* User Info */}
        {user && (
          <div className="p-4 border-b border-white/10">
            <div className="glass-card p-3">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-gradient-to-r from-pink-500 to-purple-600 rounded-full flex items-center justify-center text-white font-bold">
                  {user.username[0].toUpperCase()}
                </div>
                <div className="flex-1">
                  <p className="text-white font-medium text-sm">{user.username}</p>
                  <p className="text-xs text-gray-400 capitalize">{user.accountType.toLowerCase()}</p>
                </div>
              </div>
              <div className="mt-3 flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <span className="text-yellow-400">💰</span>
                  <span className="text-white font-medium">{user.coins}</span>
                </div>
                <div className="flex items-center space-x-2">
                  <span className="text-purple-400">⭐</span>
                  <span className="text-white font-medium">{user.totalScore}</span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Navigation */}
        <nav className="p-4 space-y-2">
          {navItems.map((item) => {
            // Hide premium features for free users
            if (item.premium && !isPremium) {
              return (
                <div
                  key={item.path}
                  className="flex items-center space-x-3 px-4 py-3 rounded-xl text-gray-500 relative"
                >
                  <span className="text-lg opacity-50">{item.icon}</span>
                  <span className="font-medium opacity-50">{item.label}</span>
                  <span className="absolute right-2 text-xs bg-yellow-600 text-white px-2 py-1 rounded-full">PRO</span>
                </div>
              )
            }

            return (
              <NavLink
                key={item.path}
                to={item.path}
                end={item.exact}
                className={({ isActive }) =>
                  `flex items-center space-x-3 px-4 py-3 rounded-xl transition-all duration-200 relative ${
                    isActive
                      ? 'bg-gradient-to-r from-pink-500/20 to-purple-600/20 text-white border border-purple-500/30'
                      : 'text-gray-300 hover:text-white hover:bg-white/5'
                  }`
                }
              >
                <span className="text-lg">{item.icon}</span>
                <span className="font-medium">{item.label}</span>
                {item.premium && isPremium && (
                  <span className="absolute right-2 text-xs bg-purple-600 text-white px-2 py-1 rounded-full">PRO</span>
                )}
              </NavLink>
            )
          })}
        </nav>

        {/* Bottom Actions */}
        <div className="absolute bottom-6 left-4 right-4">
          <button
            onClick={handleLogout}
            className="w-full flex items-center justify-center space-x-2 px-4 py-3 bg-red-500/20 hover:bg-red-500/30 text-red-400 hover:text-red-300 rounded-xl transition-all duration-200 border border-red-500/30"
          >
            <span>🚪</span>
            <span className="font-medium">Logout</span>
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-auto">
        {/* Header */}
        <header className="bg-gradient-to-r from-gray-900/50 to-gray-800/50 backdrop-blur-xl border-b border-white/10 p-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-white">Welcome back!</h1>
              <p className="text-gray-400">Ready for your next brain challenge?</p>
            </div>
            <div className="flex items-center space-x-4">
              {/* Quick Stats */}
              <div className="hidden md:flex items-center space-x-6">
                <div className="text-center">
                  <div className="text-lg font-bold text-white">{user?.totalGamesPlayed || 0}</div>
                  <div className="text-xs text-gray-400">Games</div>
                </div>
                <div className="text-center">
                  <div className="text-lg font-bold text-white">{user?.totalGamesWon || 0}</div>
                  <div className="text-xs text-gray-400">Wins</div>
                </div>
                                 <div className="text-center">
                   <div className="text-lg font-bold text-white">
                     {user && user.totalGamesPlayed > 0 ? Math.round((user.totalGamesWon / user.totalGamesPlayed) * 100) : 0}%
                   </div>
                   <div className="text-xs text-gray-400">Win Rate</div>
                 </div>
              </div>
              
              {/* Play Button */}
              <NavLink 
                to="/app/lobby"
                className="btn-primary"
              >
                🎮 Quick Play
              </NavLink>
            </div>
          </div>
        </header>

        {/* Page Content */}
        <div className="p-6">
          <Outlet />
        </div>
      </main>
    </div>
  )
}

export default Layout 