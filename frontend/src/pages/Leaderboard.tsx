import React from 'react'
import { useSelector } from 'react-redux'
import { RootState } from '../store/store'

const Leaderboard: React.FC = () => {
  const { user } = useSelector((state: RootState) => state.auth)

  // Mock leaderboard data
  const leaderboardData = [
    { rank: 1, username: 'BrainMaster', score: 15420, games: 89, winRate: 94 },
    { rank: 2, username: 'QuizKing', score: 14890, games: 76, winRate: 91 },
    { rank: 3, username: 'SmartPlayer', score: 13750, games: 82, winRate: 88 },
    { rank: 4, username: 'TriviaLord', score: 12990, games: 71, winRate: 85 },
    { rank: 5, username: user?.username || 'You', score: user?.totalScore || 0, games: user?.totalGamesPlayed || 0, winRate: user && user.totalGamesPlayed > 0 ? Math.round((user.totalGamesWon / user.totalGamesPlayed) * 100) : 0 },
  ]

  const getRankIcon = (rank: number) => {
    switch (rank) {
      case 1: return '🥇'
      case 2: return '🥈'
      case 3: return '🥉'
      default: return '🏅'
    }
  }

  const getRankColor = (rank: number) => {
    switch (rank) {
      case 1: return 'from-yellow-400 to-yellow-600'
      case 2: return 'from-gray-300 to-gray-500'
      case 3: return 'from-orange-400 to-orange-600'
      default: return 'from-blue-400 to-purple-600'
    }
  }

  return (
    <div className="space-y-6">
      <div className="text-center">
        <h1 className="text-3xl font-bold text-white mb-4">🏆 Leaderboard</h1>
        <p className="text-gray-300">See how you rank against other Brain Brawlers!</p>
      </div>

      {/* Top 3 Podium */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
        {leaderboardData.slice(0, 3).map((player) => (
          <div key={player.rank} className={`glass-card p-6 text-center order-${player.rank === 1 ? '2' : player.rank === 2 ? '1' : '3'}`}>
            <div className={`w-16 h-16 mx-auto mb-4 bg-gradient-to-r ${getRankColor(player.rank)} rounded-full flex items-center justify-center text-3xl`}>
              {getRankIcon(player.rank)}
            </div>
            <h3 className="text-xl font-bold text-white mb-2">{player.username}</h3>
            <div className="text-purple-400 font-bold text-lg mb-1">{player.score.toLocaleString()} pts</div>
            <div className="text-gray-400 text-sm">{player.winRate}% win rate</div>
          </div>
        ))}
      </div>

      {/* Full Leaderboard */}
      <div className="glass-card p-6">
        <h2 className="text-2xl font-bold text-white mb-6">Top Players</h2>
        <div className="space-y-3">
          {leaderboardData.map((player) => (
            <div 
              key={player.rank} 
              className={`flex items-center p-4 rounded-xl transition-all duration-200 ${
                player.username === user?.username 
                  ? 'bg-gradient-to-r from-purple-500/20 to-pink-500/20 border border-purple-500/30' 
                  : 'bg-white/5 hover:bg-white/10'
              }`}
            >
              {/* Rank */}
              <div className="w-12 text-center">
                <span className="text-2xl">{getRankIcon(player.rank)}</span>
              </div>

              {/* Player Info */}
              <div className="flex-1 ml-4">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 bg-gradient-to-r from-pink-500 to-purple-600 rounded-full flex items-center justify-center text-white font-bold">
                    {player.username[0].toUpperCase()}
                  </div>
                  <div>
                    <h3 className={`font-bold ${player.username === user?.username ? 'text-purple-400' : 'text-white'}`}>
                      {player.username}
                      {player.username === user?.username && <span className="ml-2 text-xs bg-purple-500/30 px-2 py-1 rounded-full">YOU</span>}
                    </h3>
                    <p className="text-gray-400 text-sm">{player.games} games played</p>
                  </div>
                </div>
              </div>

              {/* Stats */}
              <div className="text-right">
                <div className="text-white font-bold text-lg">{player.score.toLocaleString()}</div>
                <div className="text-gray-400 text-sm">{player.winRate}% wins</div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Your Stats */}
      <div className="glass-card p-6 bg-gradient-to-r from-purple-600/20 to-pink-600/20 border-purple-500/30">
        <h2 className="text-2xl font-bold text-white mb-4">Your Performance</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="text-center">
            <div className="text-2xl font-bold text-white">#5</div>
            <div className="text-gray-400 text-sm">Current Rank</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-white">{user?.totalScore?.toLocaleString() || '0'}</div>
            <div className="text-gray-400 text-sm">Total Score</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-white">{user?.totalGamesPlayed || 0}</div>
            <div className="text-gray-400 text-sm">Games Played</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-white">
              {user && user.totalGamesPlayed > 0 
                ? `${Math.round((user.totalGamesWon / user.totalGamesPlayed) * 100)}%`
                : '0%'}
            </div>
            <div className="text-gray-400 text-sm">Win Rate</div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default Leaderboard 