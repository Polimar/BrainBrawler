import React, { useEffect, useState } from 'react'
import { useSelector } from 'react-redux'
import { RootState } from '../store/store'
import { api } from '../services/api'
import toast from 'react-hot-toast'

interface AdBannerProps {
  placement: 'lobby' | 'game' | 'results'
  className?: string
}

interface AdConfig {
  showAds: boolean
  adConfig: {
    bannerFrequency: string
    adUnits: {
      banner: string
      interstitial: string
      rewarded: string
    }
    placement: {
      lobby: string[]
      game: string[]
      results: string[]
    }
  } | null
}

const AdBanner: React.FC<AdBannerProps> = ({ placement, className = '' }) => {
  const user = useSelector((state: RootState) => state.auth.user)
  const [adConfig, setAdConfig] = useState<AdConfig | null>(null)
  const [showUpgradePrompt, setShowUpgradePrompt] = useState(false)

  useEffect(() => {
    if (user && user.accountType === 'FREE') {
      loadAdConfig()
    }
  }, [user])

  const loadAdConfig = async () => {
    try {
      const response = await api.get('/ads/config')
      setAdConfig(response.data)
    } catch (error) {
      console.error('Error loading ad config:', error)
    }
  }

  const trackAdImpression = async () => {
    if (!adConfig?.showAds) return

    try {
      const response = await api.post('/ads/impression', {
        adType: 'BANNER',
        adUnit: adConfig.adConfig?.adUnits.banner,
        placement
      })

      if (response.data.showUpgradePrompt) {
        setShowUpgradePrompt(true)
      }
    } catch (error) {
      console.error('Error tracking ad impression:', error)
    }
  }

  const handleAdClick = async () => {
    if (!adConfig?.showAds) return

    try {
      const response = await api.post('/ads/click', {
        adType: 'BANNER',
        adUnit: adConfig.adConfig?.adUnits.banner
      })

      if (response.data.earnedCoins > 0) {
        toast.success(`+${response.data.earnedCoins} coins earned!`)
      }

      if (response.data.showUpgradePrompt) {
        setShowUpgradePrompt(true)
      }

      // Simulate ad click behavior
      window.open('https://example.com/sample-ad', '_blank')
    } catch (error) {
      console.error('Error tracking ad click:', error)
    }
  }

  const handleUpgrade = () => {
    setShowUpgradePrompt(false)
    // Navigate to premium upgrade page
    window.location.href = '/premium'
  }

  // Don't show ads for premium users
  if (!user || user.accountType !== 'FREE' || !adConfig?.showAds) {
    return null
  }

  // Check if ads should be shown for this placement
  if (!adConfig.adConfig?.placement[placement]?.includes('banner')) {
    return null
  }

  return (
    <>
      {/* Ad Banner */}
      <div className={`glass-card p-4 bg-gradient-to-r from-yellow-500/20 to-orange-500/20 border-yellow-500/30 ${className}`}>
        <div 
          className="cursor-pointer transition-transform hover:scale-105"
          onClick={handleAdClick}
          onLoad={trackAdImpression}
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="text-2xl">🎮</div>
              <div>
                <h3 className="text-white font-bold text-sm">Play More Games!</h3>
                <p className="text-yellow-300 text-xs">Click to discover new gaming experiences</p>
              </div>
            </div>
            <div className="text-xs text-yellow-400 bg-yellow-500/20 px-2 py-1 rounded">
              AD
            </div>
          </div>
          
          {/* Sample ad content */}
          <div className="mt-3 p-3 bg-white/10 rounded-lg">
            <div className="flex items-center justify-between">
              <span className="text-white text-sm font-medium">🎯 Gaming Gear Sale</span>
              <span className="text-yellow-400 text-sm">Up to 50% OFF</span>
            </div>
            <p className="text-gray-300 text-xs mt-1">Premium gaming accessories for pro players</p>
          </div>
        </div>
        
        {/* Remove ads prompt */}
        <div className="mt-3 pt-3 border-t border-white/10">
          <div className="flex items-center justify-between">
            <span className="text-gray-400 text-xs">Remove ads with Premium</span>
            <button 
              onClick={handleUpgrade}
              className="text-yellow-400 hover:text-yellow-300 text-xs font-bold transition-colors"
            >
              UPGRADE →
            </button>
          </div>
        </div>
      </div>

      {/* Upgrade Prompt Modal */}
      {showUpgradePrompt && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="glass-card p-6 max-w-md w-full mx-4">
            <div className="text-center">
              <div className="text-4xl mb-4">👑</div>
              <h2 className="text-2xl font-bold text-white mb-2">Upgrade to Premium</h2>
              <p className="text-gray-300 mb-6">
                Enjoy an ad-free experience, create custom games, and access premium features!
              </p>
              
              <div className="space-y-3 mb-6">
                <div className="flex items-center text-green-400 text-sm">
                  <span className="mr-2">✓</span>
                  <span>No advertisements</span>
                </div>
                <div className="flex items-center text-green-400 text-sm">
                  <span className="mr-2">✓</span>
                  <span>Create custom games</span>
                </div>
                <div className="flex items-center text-green-400 text-sm">
                  <span className="mr-2">✓</span>
                  <span>Build custom question sets</span>
                </div>
                <div className="flex items-center text-green-400 text-sm">
                  <span className="mr-2">✓</span>
                  <span>Priority support</span>
                </div>
              </div>

              <div className="flex space-x-3">
                <button 
                  onClick={() => setShowUpgradePrompt(false)}
                  className="btn-ghost flex-1"
                >
                  Maybe Later
                </button>
                <button 
                  onClick={handleUpgrade}
                  className="btn-primary flex-1"
                >
                  Upgrade Now
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  )
}

export default AdBanner 