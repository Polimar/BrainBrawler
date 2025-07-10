import { io, Socket } from 'socket.io-client'
import { toast } from 'react-hot-toast'

interface WebSocketEvents {
  // Game events
  'game:updated': (data: any) => void
  'game:started': (data: any) => void
  'game:ended': (data: any) => void
  'game:question_changed': (data: any) => void
  'game:player_joined': (data: any) => void
  'game:player_left': (data: any) => void
  'game:player_answered': (data: any) => void
  
  // Friend events
  'friend:request_received': (data: any) => void
  'friend:request_accepted': (data: any) => void
  'friend:status_changed': (data: any) => void
  'friend:invite_received': (data: any) => void
  
  // Notification events
  'notification:new': (data: any) => void
  'notification:read': (data: any) => void
  
  // User events
  'user:coins_updated': (data: any) => void
  'user:achievement_unlocked': (data: any) => void
  'user:level_up': (data: any) => void
  
  // Shop events
  'shop:purchase_completed': (data: any) => void
  'shop:item_added': (data: any) => void
}

export class WebSocketService {
  private socket: Socket | null = null
  private reconnectAttempts = 0
  private maxReconnectAttempts = 5
  private reconnectDelay = 1000
  private eventHandlers: Map<string, Set<(...args: any[]) => void>> = new Map()

  constructor() {
    this.connect()
  }

  private connect() {
    const token = localStorage.getItem('token')
    if (!token) {
      console.warn('No token found, cannot connect to WebSocket')
      return
    }

    const wsUrl = 'http://localhost:3000'
    
    this.socket = io(wsUrl, {
      auth: {
        token: token
      },
      transports: ['websocket', 'polling'],
      reconnection: true,
      reconnectionAttempts: this.maxReconnectAttempts,
      reconnectionDelay: this.reconnectDelay
    })

    this.setupEventListeners()
  }

  private setupEventListeners() {
    if (!this.socket) return

    this.socket.on('connect', () => {
      console.log('Connected to WebSocket server')
      this.reconnectAttempts = 0
      toast.success('🔗 Connected to real-time updates')
    })

    this.socket.on('disconnect', (reason) => {
      console.log('Disconnected from WebSocket server:', reason)
      if (reason === 'io server disconnect') {
        // Server disconnected, try to reconnect
        this.socket?.connect()
      }
    })

    this.socket.on('connect_error', (error) => {
      console.error('WebSocket connection error:', error)
      this.reconnectAttempts++
      
      if (this.reconnectAttempts >= this.maxReconnectAttempts) {
        toast.error('❌ Real-time connection failed')
      }
    })

    this.socket.on('reconnect', (attemptNumber) => {
      console.log('Reconnected to WebSocket server after', attemptNumber, 'attempts')
      toast.success('🔗 Reconnected to real-time updates')
    })

    // Game events
    this.socket.on('game:updated', (data) => {
      this.emit('game:updated', data)
    })

    this.socket.on('game:started', (data) => {
      this.emit('game:started', data)
      toast.success(`🎮 Game started: ${data.gameCode}`)
    })

    this.socket.on('game:ended', (data) => {
      this.emit('game:ended', data)
      toast.success(`🏁 Game ended: ${data.gameCode}`)
    })

    this.socket.on('game:question_changed', (data) => {
      this.emit('game:question_changed', data)
    })

    this.socket.on('game:player_joined', (data) => {
      this.emit('game:player_joined', data)
      toast.success(`👋 ${data.username} joined the game`)
    })

    this.socket.on('game:player_left', (data) => {
      this.emit('game:player_left', data)
      toast(`👋 ${data.username} left the game`, { icon: '👋' })
    })

    this.socket.on('game:player_answered', (data) => {
      this.emit('game:player_answered', data)
    })

    // Friend events
    this.socket.on('friend:request_received', (data) => {
      this.emit('friend:request_received', data)
      toast.success(`👥 Friend request from ${data.senderUsername}`, {
        duration: 5000
      })
    })

    this.socket.on('friend:request_accepted', (data) => {
      this.emit('friend:request_accepted', data)
      toast.success(`🎉 ${data.username} accepted your friend request!`)
    })

    this.socket.on('friend:status_changed', (data) => {
      this.emit('friend:status_changed', data)
      if (data.isOnline) {
        toast(`🟢 ${data.username} is now online`, { 
          duration: 2000,
          icon: '👋' 
        })
      }
    })

    this.socket.on('friend:invite_received', (data) => {
      this.emit('friend:invite_received', data)
      toast.success(`🎮 Game invite from ${data.fromUsername}`, {
        duration: 8000
      })
    })

    // Notification events
    this.socket.on('notification:new', (data) => {
      this.emit('notification:new', data)
      this.showNotification(data)
    })

    this.socket.on('notification:read', (data) => {
      this.emit('notification:read', data)
    })

    // User events
    this.socket.on('user:coins_updated', (data) => {
      this.emit('user:coins_updated', data)
      if (data.change > 0) {
        toast.success(`💰 +${data.change} coins earned!`)
      }
    })

    this.socket.on('user:achievement_unlocked', (data) => {
      this.emit('user:achievement_unlocked', data)
      toast.success(`🏆 Achievement unlocked: ${data.name}!`, {
        duration: 5000,
        style: {
          background: 'linear-gradient(45deg, #FFD700, #FFA500)',
          color: 'black'
        }
      })
    })

    this.socket.on('user:level_up', (data) => {
      this.emit('user:level_up', data)
      toast.success(`⬆️ Level up! You're now level ${data.newLevel}`, {
        duration: 5000,
        style: {
          background: 'linear-gradient(45deg, #9333EA, #EC4899)',
          color: 'white'
        }
      })
    })

    // Shop events
    this.socket.on('shop:purchase_completed', (data) => {
      this.emit('shop:purchase_completed', data)
      toast.success(`🛍️ Purchase successful: ${data.itemName}`)
    })

    this.socket.on('shop:item_added', (data) => {
      this.emit('shop:item_added', data)
      if (data.isFeatured) {
        toast.success(`✨ New featured item: ${data.name}`, {
          duration: 5000
        })
      }
    })
  }

  private showNotification(notification: any) {
    const { type, title, message /* , data */ } = notification

    switch (type) {
      case 'FRIEND_REQUEST':
        toast.success(`👥 ${title}: ${message}`)
        break
      case 'GAME_INVITE':
        toast.success(`🎮 ${title}: ${message}`, {
          duration: 8000
        })
        break
      case 'ACHIEVEMENT':
        toast.success(`🏆 ${title}: ${message}`, {
          duration: 5000,
          style: {
            background: 'linear-gradient(45deg, #FFD700, #FFA500)',
            color: 'black'
          }
        })
        break
      case 'SYSTEM':
        toast(message, { icon: '📢' })
        break
      default:
        toast.success(`📬 ${title}: ${message}`)
    }
  }

  // Public API
  public on<K extends keyof WebSocketEvents>(event: K, handler: WebSocketEvents[K]) {
    if (!this.eventHandlers.has(event)) {
      this.eventHandlers.set(event, new Set())
    }
    this.eventHandlers.get(event)!.add(handler)
  }

  public off<K extends keyof WebSocketEvents>(event: K, handler: WebSocketEvents[K]) {
    const handlers = this.eventHandlers.get(event)
    if (handlers) {
      handlers.delete(handler)
    }
  }

  private emit(event: string, data: any) {
    const handlers = this.eventHandlers.get(event)
    if (handlers) {
      handlers.forEach(handler => {
        try {
          handler(data)
        } catch (error) {
          console.error('Error in WebSocket event handler:', error)
        }
      })
    }
  }

  public joinGame(gameId: string) {
    if (this.socket) {
      this.socket.emit('game:join', { gameId })
    }
  }

  public leaveGame(gameId: string) {
    if (this.socket) {
      this.socket.emit('game:leave', { gameId })
    }
  }

  public sendGameInvite(friendId: string, gameId: string) {
    if (this.socket) {
      this.socket.emit('game:invite', { friendId, gameId })
    }
  }

  public updateUserStatus(status: 'online' | 'away' | 'busy' | 'offline') {
    if (this.socket) {
      this.socket.emit('user:status_update', { status })
    }
  }

  public markNotificationAsRead(notificationId: string) {
    if (this.socket) {
      this.socket.emit('notification:mark_read', { notificationId })
    }
  }

  public disconnect() {
    if (this.socket) {
      this.socket.disconnect()
      this.socket = null
    }
  }

  public isConnected(): boolean {
    return this.socket?.connected || false
  }

  public reconnect() {
    if (this.socket) {
      this.socket.connect()
    } else {
      this.connect()
    }
  }
}

// Singleton instance
export const wsService = new WebSocketService() 