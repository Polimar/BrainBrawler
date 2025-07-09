import { EventEmitter } from 'events';

export interface P2PPeer {
  id: string;
  userId: string;
  username: string;
  isHost: boolean;
  isConnected: boolean;
  latency: number;
  lastSeen: Date;
  connectionQuality: 'excellent' | 'good' | 'poor' | 'disconnected';
}

export interface P2PGameState {
  gameId: string;
  status: 'waiting' | 'starting' | 'in_progress' | 'paused' | 'completed';
  currentQuestionIndex: number;
  currentQuestion?: any;
  timeRemaining: number;
  roundStartTime?: Date;
  scores: Map<string, number>;
  answers: Map<string, { answer: string; timeSpent: number }>;
  hostId: string;
  peers: Map<string, P2PPeer>;
}

export interface HostElectionCriteria {
  connectionQuality: number; // 0-100
  latency: number; // ms
  devicePerformance: number; // 0-100
  batteryLevel?: number; // 0-100
  isCharging?: boolean;
}

export class P2PGameService extends EventEmitter {
  private gameState: P2PGameState;
  private electionInProgress: boolean = false;
  private heartbeatInterval?: NodeJS.Timeout;
  private syncInterval?: NodeJS.Timeout;

  constructor(gameId: string, initialHostId: string) {
    super();
    
    this.gameState = {
      gameId,
      status: 'waiting',
      currentQuestionIndex: 0,
      timeRemaining: 0,
      scores: new Map(),
      answers: new Map(),
      hostId: initialHostId,
      peers: new Map()
    };

    this.startHeartbeat();
    this.startSyncProcess();
  }

  // Peer Management
  public addPeer(peer: Omit<P2PPeer, 'lastSeen' | 'connectionQuality'>): void {
    const fullPeer: P2PPeer = {
      ...peer,
      lastSeen: new Date(),
      connectionQuality: 'excellent'
    };

    this.gameState.peers.set(peer.id, fullPeer);
    this.emit('peer-joined', fullPeer);

    console.log(`Peer joined P2P game: ${peer.username} (${peer.id})`);
  }

  public removePeer(peerId: string): void {
    const peer = this.gameState.peers.get(peerId);
    if (!peer) return;

    this.gameState.peers.delete(peerId);
    this.gameState.scores.delete(peerId);
    this.gameState.answers.delete(peerId);

    this.emit('peer-left', peer);

    // If the host left, trigger election
    if (peer.isHost && this.gameState.peers.size > 0) {
      this.startHostElection();
    }

    console.log(`Peer left P2P game: ${peer.username} (${peerId})`);
  }

  public updatePeerStatus(peerId: string, updates: Partial<P2PPeer>): void {
    const peer = this.gameState.peers.get(peerId);
    if (!peer) return;

    Object.assign(peer, updates, { lastSeen: new Date() });
    
    // Update connection quality based on latency
    if (updates.latency !== undefined) {
      peer.connectionQuality = this.calculateConnectionQuality(updates.latency);
    }

    this.emit('peer-updated', peer);
  }

  // Host Election System
  public startHostElection(): void {
    if (this.electionInProgress) return;

    this.electionInProgress = true;
    console.log(`Starting host election for game ${this.gameState.gameId}`);

    const candidates = this.getElectionCandidates();
    if (candidates.length === 0) {
      console.log('No candidates available for host election');
      this.emit('no-candidates');
      return;
    }

    const suggestedHost = this.selectBestCandidate(candidates);
    
    this.emit('host-election-started', {
      candidates: candidates.map(c => ({
        id: c.peer.id,
        username: c.peer.username,
        score: c.score,
        criteria: c.criteria
      })),
      suggestedHostId: suggestedHost.peer.id,
      timeout: 10000 // 10 seconds for election
    });

    // Auto-elect after timeout
    setTimeout(() => {
      if (this.electionInProgress) {
        this.electHost(suggestedHost.peer.id);
      }
    }, 10000);
  }

  public voteForHost(voterPeerId: string, candidateId: string): void {
    if (!this.electionInProgress) return;

    this.emit('host-vote', {
      voterPeerId,
      candidateId,
      timestamp: new Date()
    });
  }

  public electHost(newHostId: string): void {
    if (!this.electionInProgress) return;

    const newHost = this.gameState.peers.get(newHostId);
    if (!newHost) {
      console.error(`Cannot elect host: peer ${newHostId} not found`);
      return;
    }

    // Update previous host
    const oldHost = this.gameState.peers.get(this.gameState.hostId);
    if (oldHost) {
      oldHost.isHost = false;
    }

    // Set new host
    newHost.isHost = true;
    this.gameState.hostId = newHostId;
    this.electionInProgress = false;

    this.emit('host-elected', {
      newHostId,
      newHostUsername: newHost.username,
      previousHostId: oldHost?.id
    });

    console.log(`New host elected: ${newHost.username} (${newHostId})`);
  }

  private getElectionCandidates(): Array<{ peer: P2PPeer; criteria: HostElectionCriteria; score: number }> {
    const candidates: Array<{ peer: P2PPeer; criteria: HostElectionCriteria; score: number }> = [];

    for (const peer of this.gameState.peers.values()) {
      if (!peer.isConnected || peer.connectionQuality === 'disconnected') continue;

      const criteria: HostElectionCriteria = {
        connectionQuality: this.getConnectionQualityScore(peer.connectionQuality),
        latency: peer.latency,
        devicePerformance: 75 // Default, could be enhanced with actual device info
      };

      const score = this.calculateHostScore(criteria);
      candidates.push({ peer, criteria, score });
    }

    return candidates.sort((a, b) => b.score - a.score);
  }

  private selectBestCandidate(candidates: Array<{ peer: P2PPeer; criteria: HostElectionCriteria; score: number }>): { peer: P2PPeer; criteria: HostElectionCriteria; score: number } {
    if (candidates.length === 0) throw new Error('No candidates available');
    return candidates[0]; // Already sorted by score
  }

  private calculateHostScore(criteria: HostElectionCriteria): number {
    let score = 0;

    // Connection quality (40% weight)
    score += criteria.connectionQuality * 0.4;

    // Latency (30% weight) - lower is better
    const latencyScore = Math.max(0, 100 - (criteria.latency / 10));
    score += latencyScore * 0.3;

    // Device performance (20% weight)
    score += criteria.devicePerformance * 0.2;

    // Battery considerations (10% weight)
    if (criteria.batteryLevel !== undefined) {
      const batteryScore = criteria.isCharging ? 100 : criteria.batteryLevel;
      score += batteryScore * 0.1;
    } else {
      score += 50 * 0.1; // Default neutral score
    }

    return Math.round(score);
  }

  private getConnectionQualityScore(quality: P2PPeer['connectionQuality']): number {
    switch (quality) {
      case 'excellent': return 100;
      case 'good': return 75;
      case 'poor': return 40;
      case 'disconnected': return 0;
      default: return 50;
    }
  }

  private calculateConnectionQuality(latency: number): P2PPeer['connectionQuality'] {
    if (latency < 50) return 'excellent';
    if (latency < 150) return 'good';
    if (latency < 300) return 'poor';
    return 'disconnected';
  }

  // Game State Management
  public updateGameState(updates: Partial<P2PGameState>): void {
    Object.assign(this.gameState, updates);
    this.emit('game-state-updated', this.gameState);
  }

  public submitAnswer(peerId: string, answer: string, timeSpent: number): void {
    this.gameState.answers.set(peerId, { answer, timeSpent });
    
    this.emit('answer-submitted', {
      peerId,
      answer,
      timeSpent,
      totalAnswers: this.gameState.answers.size,
      totalPlayers: this.gameState.peers.size
    });

    // Check if all players answered
    if (this.gameState.answers.size === this.gameState.peers.size) {
      this.emit('all-answers-received');
    }
  }

  public updateScore(peerId: string, score: number): void {
    this.gameState.scores.set(peerId, score);
    this.emit('score-updated', { peerId, score });
  }

  public nextQuestion(): void {
    this.gameState.currentQuestionIndex++;
    this.gameState.answers.clear();
    this.gameState.roundStartTime = new Date();
    
    this.emit('next-question', {
      questionIndex: this.gameState.currentQuestionIndex,
      startTime: this.gameState.roundStartTime
    });
  }

  public pauseGame(): void {
    this.gameState.status = 'paused';
    this.emit('game-paused');
  }

  public resumeGame(): void {
    this.gameState.status = 'in_progress';
    this.emit('game-resumed');
  }

  public completeGame(): void {
    this.gameState.status = 'completed';
    
    const finalStats = {
      gameId: this.gameState.gameId,
      finalScores: Object.fromEntries(this.gameState.scores),
      totalQuestions: this.gameState.currentQuestionIndex,
      completedAt: new Date(),
      participants: Array.from(this.gameState.peers.values()).map(p => ({
        id: p.id,
        userId: p.userId,
        username: p.username,
        finalScore: this.gameState.scores.get(p.id) || 0,
        rank: this.calculateRank(p.id)
      }))
    };

    this.emit('game-completed', finalStats);
    this.cleanup();
  }

  private calculateRank(peerId: string): number {
    const playerScore = this.gameState.scores.get(peerId) || 0;
    const sortedScores = Array.from(this.gameState.scores.values()).sort((a, b) => b - a);
    return sortedScores.indexOf(playerScore) + 1;
  }

  // Heartbeat and Sync
  private startHeartbeat(): void {
    this.heartbeatInterval = setInterval(() => {
      this.checkPeerConnections();
    }, 5000); // Check every 5 seconds
  }

  private startSyncProcess(): void {
    this.syncInterval = setInterval(() => {
      if (this.isHost()) {
        this.broadcastGameState();
      }
    }, 1000); // Sync every second during active game
  }

  private checkPeerConnections(): void {
    const now = new Date();
    const timeoutThreshold = 15000; // 15 seconds

    for (const peer of this.gameState.peers.values()) {
      const timeSinceLastSeen = now.getTime() - peer.lastSeen.getTime();
      
      if (timeSinceLastSeen > timeoutThreshold && peer.isConnected) {
        console.log(`Peer ${peer.username} timed out`);
        peer.isConnected = false;
        peer.connectionQuality = 'disconnected';
        
        this.emit('peer-timeout', peer);
        
        // If host timed out, start election
        if (peer.isHost && this.gameState.peers.size > 1) {
          this.startHostElection();
        }
      }
    }
  }

  private broadcastGameState(): void {
    this.emit('sync-request', {
      gameState: this.gameState,
      timestamp: new Date()
    });
  }

  // Utility Methods
  public isHost(): boolean {
    const myPeerId = this.getCurrentPeerId();
    return myPeerId === this.gameState.hostId;
  }

  private getCurrentPeerId(): string {
    // This should be implemented to return the current device's peer ID
    // For now, return empty string - this will be set by the client
    return '';
  }

  public getGameState(): P2PGameState {
    return { ...this.gameState };
  }

  public getPeers(): P2PPeer[] {
    return Array.from(this.gameState.peers.values());
  }

  public getConnectedPeers(): P2PPeer[] {
    return this.getPeers().filter(p => p.isConnected);
  }

  public getCurrentHost(): P2PPeer | undefined {
    return this.gameState.peers.get(this.gameState.hostId);
  }

  private cleanup(): void {
    if (this.heartbeatInterval) {
      clearInterval(this.heartbeatInterval);
    }
    if (this.syncInterval) {
      clearInterval(this.syncInterval);
    }
  }

  public destroy(): void {
    this.cleanup();
    this.removeAllListeners();
  }
} 