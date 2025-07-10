import React from 'react'
import { useSelector } from 'react-redux'
import { RootState } from '../store/store'

const Profile: React.FC = () => {
  const { user } = useSelector((state: RootState) => state.auth)

  return (
    <div className="space-y-6">
      <div className="glass-card p-6">
        <div className="flex items-center space-x-6">
          <div className="w-24 h-24 bg-gradient-to-r from-pink-500 to-purple-600 rounded-full flex items-center justify-center text-white text-3xl font-bold">
            {user?.username[0].toUpperCase()}
          </div>
          <div>
            <h1 className="text-3xl font-bold text-white">{user?.username}</h1>
            <p className="text-gray-300 capitalize">{user?.accountType.toLowerCase()} Account</p>
            <div className="flex items-center space-x-4 mt-2">
              <span className="text-yellow-400">💰 {user?.coins}</span>
              <span className="text-purple-400">⭐ {user?.totalScore}</span>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="glass-card p-6">
          <h2 className="text-2xl font-bold text-white mb-4">Game Statistics</h2>
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
          </div>
        </div>

        <div className="glass-card p-6">
          <h2 className="text-2xl font-bold text-white mb-4">Account Settings</h2>
          <div className="space-y-4">
            <button className="btn-secondary w-full">Edit Profile</button>
            <button className="btn-warning w-full">Change Password</button>
            <button className="btn-primary w-full">Upgrade to Premium</button>
          </div>
        </div>
      </div>
    </div>
  )
}

export default Profile 