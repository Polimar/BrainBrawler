import React from 'react'
import { useSelector } from 'react-redux'
import { RootState } from '../store/store'

const Shop: React.FC = () => {
  const { user } = useSelector((state: RootState) => state.auth)

  const shopItems = [
    {
      id: 1,
      name: 'Premium Avatar Pack',
      description: 'Unlock exclusive avatar designs',
      price: 200,
      icon: '🎭',
      category: 'Avatars'
    },
    {
      id: 2,
      name: 'Extra Lives Pack',
      description: '5 extra chances in games',
      price: 150,
      icon: '💖',
      category: 'Power-ups'
    },
    {
      id: 3,
      name: 'Double XP Boost',
      description: '2x experience for 24 hours',
      price: 300,
      icon: '⚡',
      category: 'Boosts'
    }
  ]

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-white">Shop</h1>
          <p className="text-gray-300">Spend your coins on amazing items!</p>
        </div>
        <div className="glass-card px-4 py-2 flex items-center space-x-2">
          <span className="text-yellow-400">💰</span>
          <span className="text-white font-bold">{user?.coins || 0}</span>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {shopItems.map((item) => (
          <div key={item.id} className="glass-card p-6 card-hover">
            <div className="text-center">
              <div className="text-4xl mb-4">{item.icon}</div>
              <h3 className="text-xl font-bold text-white mb-2">{item.name}</h3>
              <p className="text-gray-300 text-sm mb-4">{item.description}</p>
              <div className="flex items-center justify-center space-x-2 mb-4">
                <span className="text-yellow-400">💰</span>
                <span className="text-white font-bold text-lg">{item.price}</span>
              </div>
              <button 
                className={`btn-primary w-full ${
                  (user?.coins || 0) < item.price ? 'opacity-50 cursor-not-allowed' : ''
                }`}
                disabled={(user?.coins || 0) < item.price}
              >
                {(user?.coins || 0) >= item.price ? 'Purchase' : 'Not enough coins'}
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

export default Shop 