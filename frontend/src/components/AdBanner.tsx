import React, { useEffect, useState } from 'react'
import { useSelector } from 'react-redux'
import { RootState } from '../store/store'
import { api } from '../services/api'
import toast from 'react-hot-toast'

interface AdBannerProps {
  placement: 'lobby' | 'game' | 'results'
  className?: string
}

const AdBanner: React.FC<AdBannerProps> = ({ placement, className = '' }) => {
  const user = useSelector((state: RootState) => state.auth.user)
  const [adConfig, setAdConfig] = useState<any>(null)

  useEffect(() => {
    if (user && user.accountType === 'FREE') {
      api.get('/ads/config')
        .then(response => setAdConfig(response.data.adConfig))
        .catch(error => console.error('Failed to load ad config', error))
    }
  }, [user])

  // Don't show ads for premium users or if config is not loaded
  if (!user || user.accountType !== 'FREE' || !adConfig) {
    return null
  }

  // TODO: Replace this with the actual Advanced Native Ad implementation
  // using the Google Mobile Ads SDK or Google Publisher Tag (GPT) for web.
  // The necessary ad unit IDs are provided in the adConfig object.
  // adConfig.sdkConfig.appId: 'ca-app-pub-8145977851051737~8523227896'
  // adConfig.sdkConfig.nativeAdUnitId: 'ca-app-pub-8145977851051737/1115511164'
  
  const handleAdClick = () => {
    // This should be handled by the ad SDK, which will track clicks.
    // The API call below is for backend tracking.
    api.post('/ads/click', {
      adType: 'NATIVE_ADVANCED',
      adUnit: adConfig.sdkConfig.nativeAdUnitId,
      placement
    }).catch(error => console.error('Failed to track ad click', error));
    toast.success("Thanks for supporting us!");
  }

  return (
    <div className={`glass-card p-4 bg-yellow-900/30 border-yellow-500/30 ${className}`}>
      <div className="flex items-center justify-between text-xs text-yellow-400 mb-2">
        <span>Advertisement</span>
      </div>
      <div 
        className="cursor-pointer"
        onClick={handleAdClick}
      >
        <h3 className="font-bold text-white">Your Ad Title Here</h3>
        <p className="text-gray-300 text-sm">This is where the native ad content would be rendered by the Google Ads SDK.</p>
        <button className="text-xs bg-yellow-500 text-black px-2 py-1 rounded mt-2">
          Learn More
                </button>
              </div>
            </div>
  )
}

export default AdBanner 