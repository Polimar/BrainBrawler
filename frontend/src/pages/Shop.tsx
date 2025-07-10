import React, { useState, useEffect } from 'react'
import { useSelector } from 'react-redux'
import { RootState } from '../store/store'
import { api } from '../services/api'
import toast from 'react-hot-toast'

interface ShopItem {
  id: string
  name: string
  description: string
  category: string
  itemType: string
  price: number
  originalPrice?: number
  currency: string
  isActive: boolean
  isFeatured: boolean
  avatarId?: string
  bundleItems?: any
  metadata?: any
  maxPurchases?: number
}

interface CartItem {
  id: string
  shopItemId: string
  quantity: number
  shopItem: ShopItem
}

interface Purchase {
  id: string
  shopItemId: string
  amount: number
  currency: string
  status: string
  createdAt: string
  shopItem: ShopItem
}

const Shop: React.FC = () => {
  const user = useSelector((state: RootState) => state.auth.user)
  
  // State hooks
  const [mounted, setMounted] = useState(false)
  const [loading, setLoading] = useState(true)
  const [shopItems, setShopItems] = useState<ShopItem[]>([])
  const [cart, setCart] = useState<CartItem[]>([])
  const [purchases, setPurchases] = useState<Purchase[]>([])
  const [ownedAvatars, setOwnedAvatars] = useState<string[]>([])
  const [activeCategory, setActiveCategory] = useState('featured')
  const [showCart, setShowCart] = useState(false)

  const categories = [
    { id: 'featured', name: 'Featured', icon: '⭐', description: 'Best deals and new items' },
    { id: 'avatars', name: 'Avatars', icon: '🎭', description: 'Unique avatar designs' },
    { id: 'customization', name: 'Customization', icon: '🎨', description: 'Colors and accessories' },
    { id: 'question_sets', name: 'Question Sets', icon: '📚', description: 'Premium trivia content' },
    { id: 'power_ups', name: 'Power-ups', icon: '⚡', description: 'Game boosts and bonuses' },
    { id: 'subscriptions', name: 'Premium', icon: '👑', description: 'Monthly and yearly plans' }
  ]

  useEffect(() => {
    setMounted(true)
    loadShopData()
  }, [])

  const loadShopData = async () => {
    setLoading(true)
    try {
      const [itemsRes, cartRes, purchasesRes, ownedRes] = await Promise.all([
        api.get('/shop/items'),
        api.get('/shop/cart'),
        api.get('/shop/purchases'),
        api.get('/avatars/owned')
      ])
      
      setShopItems(itemsRes.data.items || [])
      setCart(cartRes.data.items || [])
      setPurchases(purchasesRes.data.purchases || [])
      setOwnedAvatars(ownedRes.data.avatars || [])
    } catch (error) {
      console.error('Error loading shop data:', error)
      toast.error('Failed to load shop data')
    } finally {
      setLoading(false)
    }
  }

  const getFilteredItems = () => {
    if (activeCategory === 'featured') {
      return shopItems.filter((item: ShopItem) => item.isFeatured)
    }
    return shopItems.filter((item: ShopItem) => item.category.toLowerCase() === activeCategory)
  }

  const addToCart = async (itemId: string) => {
    try {
      await api.post('/shop/cart/add', { itemId, quantity: 1 })
      toast.success('Added to cart!')
      
      // Update local cart
      const item = shopItems.find((i: ShopItem) => i.id === itemId)
      if (item) {
        const existingCartItem = cart.find((c: CartItem) => c.shopItemId === itemId)
        if (existingCartItem) {
          setCart(prev => prev.map((c: CartItem) => 
            c.shopItemId === itemId 
              ? { ...c, quantity: c.quantity + 1 }
              : c
          ))
        } else {
          setCart(prev => [...prev, {
            id: `temp-${Date.now()}`,
            shopItemId: itemId,
            quantity: 1,
            shopItem: item
          }])
        }
      }
    } catch (error: any) {
      const message = error.response?.data?.error || 'Failed to add to cart'
      toast.error(message)
    }
  }

  const removeFromCart = async (itemId: string) => {
    try {
      await api.delete(`/shop/cart/${itemId}`)
      setCart(prev => prev.filter((c: CartItem) => c.shopItemId !== itemId))
      toast.success('Removed from cart')
    } catch (error: any) {
      const message = error.response?.data?.error || 'Failed to remove from cart'
      toast.error(message)
    }
  }

  const purchaseItem = async (itemId: string) => {
    try {
      const response = await api.post('/shop/purchase', {
        itemId,
        platform: 'WEB_STRIPE'
      })
      
      if (response.data.success) {
        toast.success('Purchase successful!')
        loadShopData() // Refresh data
        
        // If it's an avatar, show celebration
        const item = shopItems.find((i: ShopItem) => i.id === itemId)
        if (item?.itemType === 'AVATAR') {
          toast.success(`🎉 New avatar unlocked: ${item.name}!`)
        }
      }
    } catch (error: any) {
      const message = error.response?.data?.error || 'Purchase failed'
      toast.error(message)
    }
  }

  const checkout = async () => {
    if (cart.length === 0) {
      toast.error('Cart is empty')
      return
    }

    try {
      const response = await api.post('/shop/checkout', {
        items: cart.map((c: CartItem) => ({ itemId: c.shopItemId, quantity: c.quantity }))
      })
      
      if (response.data.success) {
        toast.success('Checkout successful!')
        setCart([])
        setShowCart(false)
        loadShopData()
      }
    } catch (error: any) {
      const message = error.response?.data?.error || 'Checkout failed'
      toast.error(message)
    }
  }

  const getItemPrice = (item: ShopItem) => {
    const hasDiscount = item.originalPrice && item.originalPrice > item.price
    return (
      <div className="flex items-center space-x-2">
        <span className="text-yellow-400 font-bold text-lg">
          💰 {item.price.toFixed(2)} {item.currency}
        </span>
        {hasDiscount && (
          <span className="text-gray-400 line-through text-sm">
            {item.originalPrice!.toFixed(2)}
          </span>
        )}
        {hasDiscount && (
          <span className="bg-red-500 text-white text-xs px-2 py-1 rounded-full">
            SALE
          </span>
        )}
      </div>
    )
  }

  const isItemOwned = (item: ShopItem) => {
    if (item.itemType === 'AVATAR' && item.avatarId) {
      return ownedAvatars.includes(item.avatarId)
    }
    return purchases.some((p: Purchase) => p.shopItemId === item.id && p.status === 'COMPLETED')
  }

  const isInCart = (itemId: string) => {
    return cart.some((c: CartItem) => c.shopItemId === itemId)
  }

  const getCartTotal = () => {
    return cart.reduce((total: number, item: CartItem) => total + (item.shopItem.price * item.quantity), 0)
  }

  const getItemTypeIcon = (itemType: string) => {
    switch (itemType) {
      case 'AVATAR': return '🎭'
      case 'COLOR_PACK': return '🎨'
      case 'ACCESSORY_PACK': return '👑'
      case 'ANIMATION_PACK': return '✨'
      case 'QUESTION_SET': return '📚'
      case 'POWER_UP': return '⚡'
      case 'SUBSCRIPTION': return '👑'
      case 'BUNDLE': return '📦'
      default: return '🛍️'
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-purple-500 border-t-transparent rounded-full animate-spin mb-4"></div>
          <p className="text-gray-300">Loading shop...</p>
        </div>
      </div>
    )
  }

  return (
    <div className={`space-y-6 ${mounted ? 'animate-fade-in-scale' : 'opacity-0'}`}>
      {/* Shop Header */}
      <div className="glass-card p-6 bg-gradient-to-r from-purple-600/20 to-pink-600/20 border-purple-500/30">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-white mb-2">🛍️ BrainBrawler Shop</h1>
            <p className="text-gray-300">Enhance your gaming experience with premium items!</p>
          </div>
          <div className="flex items-center space-x-4">
            <div className="glass-card px-4 py-2 flex items-center space-x-2">
              <span className="text-yellow-400">💰</span>
              <span className="text-white font-bold">{user?.coins?.toLocaleString() || 0}</span>
              <span className="text-gray-400 text-sm">coins</span>
            </div>
            <button 
              onClick={() => setShowCart(true)}
              className="btn-primary relative"
            >
              🛒 Cart
              {cart.length > 0 && (
                <span className="absolute -top-2 -right-2 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                  {cart.length}
                </span>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Category Navigation */}
      <div className="glass-card p-2">
        <div className="flex space-x-2 overflow-x-auto">
          {categories.map((category) => (
            <button
              key={category.id}
              onClick={() => setActiveCategory(category.id)}
              className={`flex-shrink-0 px-4 py-3 rounded-lg font-medium transition-all duration-200 ${
                activeCategory === category.id
                  ? 'bg-purple-500/30 text-white border border-purple-500/50'
                  : 'text-gray-300 hover:text-white hover:bg-white/10'
              }`}
            >
              <span className="mr-2">{category.icon}</span>
              <span className="hidden md:inline">{category.name}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Featured Banner (only on featured tab) */}
      {activeCategory === 'featured' && (
        <div className="glass-card p-6 bg-gradient-to-r from-yellow-500/20 to-orange-500/20 border-yellow-500/30">
          <div className="text-center">
            <h2 className="text-2xl font-bold text-white mb-2">🔥 Limited Time Offers</h2>
            <p className="text-gray-300 mb-4">Don't miss out on these amazing deals!</p>
            <div className="flex justify-center space-x-4">
              <div className="bg-white/10 px-4 py-2 rounded-lg">
                <div className="text-yellow-400 font-bold">50% OFF</div>
                <div className="text-xs text-gray-400">Premium Avatars</div>
              </div>
              <div className="bg-white/10 px-4 py-2 rounded-lg">
                <div className="text-yellow-400 font-bold">Buy 2 Get 1</div>
                <div className="text-xs text-gray-400">Question Sets</div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Items Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {getFilteredItems().map((item, index) => (
          <div 
            key={item.id}
            className={`glass-card p-6 card-hover animate-fade-in-scale relative ${
              item.isFeatured ? 'ring-2 ring-yellow-500/50' : ''
            }`}
            style={{ animationDelay: `${index * 0.1}s` }}
          >
            {/* Featured Badge */}
            {item.isFeatured && (
              <div className="absolute -top-2 -right-2 bg-yellow-500 text-black text-xs font-bold px-2 py-1 rounded-full">
                ⭐ FEATURED
              </div>
            )}

            {/* Sale Badge */}
            {item.originalPrice && item.originalPrice > item.price && (
              <div className="absolute -top-2 -left-2 bg-red-500 text-white text-xs font-bold px-2 py-1 rounded-full">
                SALE
              </div>
            )}

            <div className="text-center">
              {/* Item Icon/Image */}
              <div className="text-6xl mb-4">
                {getItemTypeIcon(item.itemType)}
              </div>

              {/* Item Info */}
              <h3 className="text-xl font-bold text-white mb-2">{item.name}</h3>
              <p className="text-gray-300 text-sm mb-4 h-12 overflow-hidden">
                {item.description}
              </p>

              {/* Price */}
              <div className="mb-4">
                {getItemPrice(item)}
              </div>

              {/* Action Button */}
              {isItemOwned(item) ? (
                <div className="text-green-400 font-bold">✅ Owned</div>
              ) : isInCart(item.id) ? (
                <div className="flex space-x-2">
                  <button 
                    onClick={() => removeFromCart(item.id)}
                    className="btn-warning flex-1 text-sm"
                  >
                    🛒 In Cart
                  </button>
                  <button 
                    onClick={() => purchaseItem(item.id)}
                    className="btn-success text-sm"
                  >
                    💳 Buy Now
                  </button>
                </div>
              ) : (
                <div className="flex space-x-2">
                  <button 
                    onClick={() => addToCart(item.id)}
                    className="btn-secondary flex-1"
                  >
                    🛒 Add to Cart
                  </button>
                  <button 
                    onClick={() => purchaseItem(item.id)}
                    className="btn-primary text-sm"
                  >
                    💳
                  </button>
                </div>
              )}

              {/* Item Details */}
              <div className="mt-4 text-xs text-gray-400">
                <div>{item.category} • {item.itemType.replace('_', ' ')}</div>
                {item.maxPurchases && (
                  <div>Max {item.maxPurchases} per user</div>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Empty State */}
      {getFilteredItems().length === 0 && (
        <div className="text-center py-12">
          <div className="text-6xl mb-4">🛍️</div>
          <h3 className="text-xl font-bold text-white mb-2">No items found</h3>
          <p className="text-gray-400">
            {activeCategory === 'featured' 
              ? 'No featured items available right now' 
              : `No items in ${categories.find(c => c.id === activeCategory)?.name} category`}
          </p>
        </div>
      )}

      {/* Cart Modal */}
      {showCart && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="glass-card p-6 max-w-md w-full mx-4 max-h-[80vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-2xl font-bold text-white">🛒 Shopping Cart</h2>
              <button 
                onClick={() => setShowCart(false)}
                className="btn-ghost text-lg"
              >
                ✕
              </button>
            </div>

            {cart.length === 0 ? (
              <div className="text-center py-8">
                <div className="text-4xl mb-4">🛒</div>
                <p className="text-gray-400">Your cart is empty</p>
              </div>
            ) : (
              <>
                <div className="space-y-3 mb-6">
                  {cart.map((item) => (
                    <div key={item.id} className="glass-card p-3 flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <div className="text-2xl">{getItemTypeIcon(item.shopItem.itemType)}</div>
                        <div>
                          <h4 className="text-white font-bold text-sm">{item.shopItem.name}</h4>
                          <p className="text-gray-400 text-xs">
                            {item.shopItem.price.toFixed(2)} × {item.quantity}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center space-x-2">
                        <span className="text-yellow-400 font-bold">
                          💰 {(item.shopItem.price * item.quantity).toFixed(2)}
                        </span>
                        <button 
                          onClick={() => removeFromCart(item.shopItemId)}
                          className="text-red-400 hover:text-red-300"
                        >
                          ❌
                        </button>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="border-t border-gray-600 pt-4">
                  <div className="flex justify-between items-center mb-4">
                    <span className="text-white font-bold">Total:</span>
                    <span className="text-yellow-400 font-bold text-lg">
                      💰 {getCartTotal().toFixed(2)} EUR
                    </span>
                  </div>
                  <button 
                    onClick={checkout}
                    className="btn-success w-full"
                  >
                    💳 Checkout
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  )
}

export default Shop 