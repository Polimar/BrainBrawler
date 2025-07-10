import React, { useState } from 'react'

const GameLobby: React.FC = () => {
  const [roomCode, setRoomCode] = useState('')

  return (
    <div className="space-y-6">
      <div className="text-center">
        <h1 className="text-3xl font-bold text-white mb-4">Game Lobby</h1>
        <p className="text-gray-300">Find or create a game room to start playing!</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Quick Join */}
        <div className="glass-card p-6">
          <h2 className="text-2xl font-bold text-white mb-4 flex items-center">
            <span className="mr-2">⚡</span> Quick Join
          </h2>
          <div className="space-y-4">
            <input
              type="text"
              placeholder="Enter room code"
              value={roomCode}
              onChange={(e) => setRoomCode(e.target.value.toUpperCase())}
              className="input-field"
              maxLength={6}
            />
            <button className="btn-primary w-full">
              🚀 Join Game
            </button>
          </div>
        </div>

        {/* Create Room */}
        <div className="glass-card p-6">
          <h2 className="text-2xl font-bold text-white mb-4 flex items-center">
            <span className="mr-2">🎯</span> Create Room
          </h2>
          <div className="space-y-4">
            <select className="input-field">
              <option>Science Questions</option>
              <option>History Questions</option>
              <option>Geography Questions</option>
            </select>
            <button className="btn-secondary w-full">
              🎮 Create Game
            </button>
          </div>
        </div>
      </div>

      {/* Available Rooms */}
      <div className="glass-card p-6">
        <h2 className="text-2xl font-bold text-white mb-4">Available Rooms</h2>
        <div className="space-y-3">
          <div className="glass-card p-4 flex items-center justify-between">
            <div>
              <h3 className="text-white font-bold">Science Quiz</h3>
              <p className="text-gray-400 text-sm">2/4 players • Medium difficulty</p>
            </div>
            <button className="btn-success">Join</button>
          </div>
        </div>
      </div>
    </div>
  )
}

export default GameLobby 