import crypto from 'crypto';

// Generate unique game code
export const generateGameCode = (): string => {
  return crypto.randomBytes(3).toString('hex').toUpperCase();
};

// Generate unique peer ID for WebRTC
export const generatePeerId = (): string => {
  return crypto.randomBytes(8).toString('hex');
};

// Calculate host election score based on connection quality and other factors
export const calculateHostScore = (participant: {
  connectionQuality?: string;
  latency?: number;
  isHost?: boolean;
  joinedAt?: Date;
}): number => {
  let score = 0;

  // Connection quality score (40% weight)
  switch (participant.connectionQuality) {
    case 'excellent':
      score += 40;
      break;
    case 'good':
      score += 30;
      break;
    case 'poor':
      score += 10;
      break;
    default:
      score += 0;
  }

  // Latency score (30% weight)
  if (participant.latency !== undefined && participant.latency !== null) {
    if (participant.latency < 50) {
      score += 30;
    } else if (participant.latency < 100) {
      score += 25;
    } else if (participant.latency < 200) {
      score += 20;
    } else if (participant.latency < 300) {
      score += 15;
    } else {
      score += 5;
    }
  }

  // Current host bonus (20% weight) - gives preference to current host to avoid unnecessary changes
  if (participant.isHost) {
    score += 20;
  }

  // Tenure bonus (10% weight) - slight preference for longer participation
  if (participant.joinedAt) {
    const tenureMinutes = (Date.now() - participant.joinedAt.getTime()) / (1000 * 60);
    score += Math.min(10, Math.floor(tenureMinutes / 10)); // Max 10 points for tenure
  }

  return score;
};

// Select best host from participants
export const selectBestHost = (participants: Array<{
  userId: string;
  connectionQuality?: string;
  latency?: number;
  isHost?: boolean;
  joinedAt?: Date;
}>): string | null => {
  if (participants.length === 0) return null;

  let bestCandidate = participants[0];
  let bestScore = calculateHostScore(bestCandidate);

  for (const participant of participants.slice(1)) {
    const score = calculateHostScore(participant);
    if (score > bestScore) {
      bestScore = score;
      bestCandidate = participant;
    }
  }

  return bestCandidate.userId;
};

// Validate game configuration
export const validateGameConfig = (config: {
  maxPlayers?: number;
  totalQuestions?: number;
  timePerQuestion?: number;
}): { isValid: boolean; errors: string[] } => {
  const errors: string[] = [];

  if (config.maxPlayers !== undefined) {
    if (config.maxPlayers < 2 || config.maxPlayers > 20) {
      errors.push('Max players must be between 2 and 20');
    }
  }

  if (config.totalQuestions !== undefined) {
    if (config.totalQuestions < 5 || config.totalQuestions > 100) {
      errors.push('Total questions must be between 5 and 100');
    }
  }

  if (config.timePerQuestion !== undefined) {
    if (config.timePerQuestion < 10 || config.timePerQuestion > 300) {
      errors.push('Time per question must be between 10 and 300 seconds');
    }
  }

  return {
    isValid: errors.length === 0,
    errors
  };
};

// Generate invite code for private games
export const generateInviteCode = (): string => {
  return crypto.randomBytes(4).toString('hex').toUpperCase();
};

// Check if game code format is valid
export const isValidGameCode = (code: string): boolean => {
  return /^[A-F0-9]{6}$/.test(code);
};

// Check if invite code format is valid
export const isValidInviteCode = (code: string): boolean => {
  return /^[A-F0-9]{8}$/.test(code);
}; 