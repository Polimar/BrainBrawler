import React, { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useSelector } from 'react-redux'
import { RootState } from '../store/store'

const Dashboard: React.FC = () => {
  const { user } = useSelector((state: RootState) => state.auth)
  const [mounted, setMounted] = useState(false)
  const navigate = useNavigate()

  useEffect(() => {
    setMounted(true)
  }, [])

  const quickActions = [
    {
      title: 'Quick Match',
      description: 'Jump into a random game',
      icon: '⚡',
      color: 'from-pink-500 to-purple-600',
      action: () => navigate('/app/lobby')
    },
    {
      title: 'Create Room',
      description: 'Invite friends to play',
      icon: '🎯',
      color: 'from-blue-500 to-cyan-500',
      action: () => navigate('/app/lobby')
    },
    {
      title: 'Practice Mode',
      description: 'Sharpen your skills',
      icon: '📚',
      color: 'from-green-500 to-emerald-500',
      action: () => navigate('/app/lobby')
    },
    {
      title: 'Leaderboard',
      description: 'Check your ranking',
      icon: '🏆',
      color: 'from-yellow-500 to-orange-500',
      action: () => navigate('/app/leaderboard')
    }
  ]

  const stats = [
    {
      label: 'Total Score',
      value: user?.totalScore?.toLocaleString() || '0',
      icon: '⭐',
      color: 'text-purple-400'
    },
    {
      label: 'Games Played',
      value: user?.totalGamesPlayed || 0,
      icon: '🎮',
      color: 'text-blue-400'
    },
    {
      label: 'Games Won',
      value: user?.totalGamesWon || 0,
      icon: '🏆',
      color: 'text-green-400'
    },
    {
      label: 'Win Rate',
      value: user && user.totalGamesPlayed > 0 
        ? `${Math.round((user.totalGamesWon / user.totalGamesPlayed) * 100)}%`
        : '0%',
      icon: '📊',
      color: 'text-yellow-400'
    }
  ]

  const achievements = [
    { title: 'First Victory', description: 'Win your first game', completed: (user?.totalGamesWon || 0) > 0, icon: '🥇' },
    { title: 'Knowledge Seeker', description: 'Play 10 games', completed: (user?.totalGamesPlayed || 0) >= 10, icon: '📖' },
    { title: 'Brain Master', description: 'Score 1000 points', completed: (user?.totalScore || 0) >= 1000, icon: '🧠' },
    { title: 'Coin Collector', description: 'Earn 500 coins', completed: (user?.coins || 0) >= 500, icon: '💰' }
  ]

  return (
    <div className={`space-y-6 ${mounted ? 'animate-slide-in-up' : 'opacity-0'}`}>
      {/* Welcome Banner */}
      <div className="glass-card p-6 bg-gradient-to-r from-purple-600/20 to-pink-600/20 border-purple-500/30">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-white mb-2">
              Welcome back, {user?.username}! 🎉
            </h1>
            <p className="text-gray-300 text-lg">
              Ready to challenge your brain today?
            </p>
          </div>
          <div className="hidden md:block">
            <img 
              src="/logo.jpg" 
              alt="BrainBrawler" 
              className="w-20 h-20 rounded-2xl brain-glow animate-float"
            />
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div>
        <h2 className="text-2xl font-bold text-white mb-4">Quick Actions</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {quickActions.map((action, index) => (
            <button
              key={action.title}
              onClick={action.action}
              className={`glass-card p-6 card-hover group animate-fade-in-scale`}
              style={{ animationDelay: `${index * 0.1}s` }}
            >
              <div className={`w-12 h-12 bg-gradient-to-r ${action.color} rounded-xl flex items-center justify-center text-2xl mb-4 group-hover:animate-wiggle`}>
                {action.icon}
              </div>
              <h3 className="text-white font-bold text-lg mb-2">{action.title}</h3>
              <p className="text-gray-300 text-sm">{action.description}</p>
            </button>
          ))}
        </div>
      </div>

      {/* Stats Overview */}
      <div>
        <h2 className="text-2xl font-bold text-white mb-4">Your Stats</h2>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {stats.map((stat, index) => (
            <div
              key={stat.label}
              className={`glass-card p-6 text-center animate-fade-in-scale`}
              style={{ animationDelay: `${index * 0.1}s` }}
            >
              <div className={`text-3xl mb-2 ${stat.color}`}>{stat.icon}</div>
              <div className="text-2xl font-bold text-white mb-1">{stat.value}</div>
              <div className="text-gray-400 text-sm">{stat.label}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Recent Activity & Achievements */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Achievements */}
        <div>
          <h2 className="text-2xl font-bold text-white mb-4">Achievements</h2>
          <div className="space-y-3">
            {achievements.map((achievement, index) => (
              <div
                key={achievement.title}
                className={`glass-card p-4 flex items-center space-x-4 animate-slide-in-up ${
                  achievement.completed ? 'border-green-500/30 bg-green-500/10' : 'opacity-60'
                }`}
                style={{ animationDelay: `${index * 0.1}s` }}
              >
                <div className={`text-3xl ${achievement.completed ? 'animate-pulse-glow' : ''}`}>
                  {achievement.icon}
                </div>
                <div className="flex-1">
                  <h3 className={`font-bold ${achievement.completed ? 'text-green-400' : 'text-white'}`}>
                    {achievement.title}
                  </h3>
                  <p className="text-gray-400 text-sm">{achievement.description}</p>
                </div>
                {achievement.completed && (
                  <div className="text-green-400 text-xl">✓</div>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Daily Challenge */}
        <div>
          <h2 className="text-2xl font-bold text-white mb-4">Daily Challenge</h2>
          <div className="glass-card p-6 bg-gradient-to-r from-yellow-500/20 to-orange-500/20 border-yellow-500/30">
            <div className="text-center">
              <div className="text-4xl mb-4 animate-float">🔥</div>
              <h3 className="text-xl font-bold text-white mb-2">Science Trivia</h3>
              <p className="text-gray-300 mb-4">
                Test your knowledge of the natural world in today's challenge!
              </p>
              <div className="flex items-center justify-center space-x-4 mb-4">
                <div className="text-center">
                  <div className="text-lg font-bold text-yellow-400">+50</div>
                  <div className="text-xs text-gray-400">Coins</div>
                </div>
                <div className="text-center">
                  <div className="text-lg font-bold text-purple-400">+100</div>
                  <div className="text-xs text-gray-400">XP</div>
                </div>
              </div>
              <button className="btn-warning w-full">
                🚀 Start Challenge
              </button>
            </div>
          </div>

          {/* Quick Shop */}
          <div className="mt-6">
            <h3 className="text-lg font-bold text-white mb-3">💎 Quick Shop</h3>
            <div className="glass-card p-4">
              <div className="flex items-center justify-between mb-3">
                <div>
                  <h4 className="text-white font-medium">Premium Avatar Pack</h4>
                  <p className="text-gray-400 text-sm">Unlock exclusive avatars</p>
                </div>
                <div className="text-right">
                  <div className="text-yellow-400 font-bold">200 💰</div>
                </div>
              </div>
              <Link to="/app/shop" className="btn-secondary w-full text-sm">
                🛒 Visit Shop
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default Dashboard 