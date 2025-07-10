import React, { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { useSelector } from 'react-redux'
import { RootState } from '../store/store'

const LandingPage: React.FC = () => {
  const { isAuthenticated } = useSelector((state: RootState) => state.auth)
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  if (isAuthenticated) {
    window.location.href = '/app'
    return null
  }

  return (
    <div className="min-h-screen flex flex-col relative overflow-hidden">
      {/* Animated Background Elements */}
      <div className="absolute inset-0">
        <div className="absolute top-20 left-10 w-20 h-20 bg-pink-500/20 rounded-full animate-float"></div>
        <div className="absolute top-40 right-20 w-16 h-16 bg-purple-500/20 rounded-full animate-float" style={{ animationDelay: '1s' }}></div>
        <div className="absolute bottom-32 left-1/4 w-12 h-12 bg-blue-500/20 rounded-full animate-float" style={{ animationDelay: '2s' }}></div>
        <div className="absolute bottom-20 right-1/3 w-14 h-14 bg-yellow-500/20 rounded-full animate-float" style={{ animationDelay: '0.5s' }}></div>
      </div>

      {/* Header */}
      <header className="relative z-10 p-6">
        <nav className="flex justify-between items-center max-w-7xl mx-auto">
          <div className="flex items-center space-x-3">
            <img 
              src="/logo.jpg" 
              alt="BrainBrawler" 
              className="w-12 h-12 rounded-xl brain-glow animate-pulse-glow"
            />
            <h1 className="text-2xl font-bold text-white">BrainBrawler</h1>
          </div>
          <Link 
            to="/auth" 
            className="btn-primary text-sm"
          >
            Play Now
          </Link>
        </nav>
      </header>

      {/* Hero Section */}
      <main className="flex-1 flex items-center justify-center px-6">
        <div className={`text-center max-w-4xl mx-auto ${mounted ? 'animate-fade-in-scale' : 'opacity-0'}`}>
          {/* Logo Hero */}
          <div className="mb-8 flex justify-center">
            <img 
              src="/logo.jpg" 
              alt="BrainBrawler Logo" 
              className="w-32 h-32 md:w-48 md:h-48 rounded-3xl brain-glow animate-float shadow-2xl"
            />
          </div>

          {/* Title */}
          <h1 className="text-4xl md:text-6xl lg:text-7xl font-bold mb-6 text-gradient leading-tight">
            Challenge Your
            <br />
            <span className="text-white">Brain Power!</span>
          </h1>

          {/* Subtitle */}
          <p className="text-lg md:text-xl text-gray-300 mb-8 max-w-2xl mx-auto">
            Compete with friends in real-time trivia battles. Test your knowledge, 
            climb the leaderboards, and become the ultimate Brain Brawler!
          </p>

          {/* Feature Pills */}
          <div className="flex flex-wrap justify-center gap-4 mb-10">
            <div className="glass-card px-4 py-2 text-sm text-white">
              🚀 Real-time Multiplayer
            </div>
            <div className="glass-card px-4 py-2 text-sm text-white">
              🧠 Multiple Categories
            </div>
            <div className="glass-card px-4 py-2 text-sm text-white">
              🏆 Global Leaderboards
            </div>
            <div className="glass-card px-4 py-2 text-sm text-white">
              💎 Premium Features
            </div>
          </div>

          {/* CTA Buttons */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
            <Link 
              to="/auth" 
              className="btn-primary text-lg px-8 py-4 w-full sm:w-auto"
            >
              🎮 Start Playing Free
            </Link>
            <Link 
              to="/auth" 
              className="btn-secondary text-lg px-8 py-4 w-full sm:w-auto"
            >
              👥 Play with Friends
            </Link>
          </div>

          {/* Stats */}
          <div className="mt-16 grid grid-cols-2 md:grid-cols-4 gap-8">
            <div className="text-center">
              <div className="text-2xl md:text-3xl font-bold text-white mb-2">1M+</div>
              <div className="text-gray-400 text-sm">Questions Answered</div>
            </div>
            <div className="text-center">
              <div className="text-2xl md:text-3xl font-bold text-white mb-2">50K+</div>
              <div className="text-gray-400 text-sm">Active Players</div>
            </div>
            <div className="text-center">
              <div className="text-2xl md:text-3xl font-bold text-white mb-2">100+</div>
              <div className="text-gray-400 text-sm">Categories</div>
            </div>
            <div className="text-center">
              <div className="text-2xl md:text-3xl font-bold text-white mb-2">24/7</div>
              <div className="text-gray-400 text-sm">Live Matches</div>
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="relative z-10 p-6 text-center text-gray-400 text-sm">
        <p>&copy; 2024 BrainBrawler. Ready to challenge your mind?</p>
      </footer>
    </div>
  )
}

export default LandingPage 