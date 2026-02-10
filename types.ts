export interface Viewer {
  name: string;
  avatarColor: string;
  isMember?: boolean;
}

export interface StreamContext {
  streamerName: string;
  streamTitle: string;
  topic: string;
  viewerPool: Viewer[];
  genericComments: string[];
}

export type SuperChatTier = 'blue' | 'cyan' | 'green' | 'yellow' | 'orange' | 'magenta' | 'red';

export interface ChatMessage {
  id: string;
  viewer: Viewer;
  text: string;
  isSuperChat: boolean;
  tier?: SuperChatTier;
  amount?: string;
  timestamp: number;
}

export interface ActiveSuperChat {
  id: string;
  viewerName: string;
  tier: SuperChatTier;
  options: string[];
  expiresAt: number;
}

export interface GameState {
  isPlaying: boolean;
  score: number;
  currentViewers: number;
  subscribers: number;
  streak: number;
  enjouPoints: number; // 0 to 100, 100 is Game Over
  gameOver: boolean;
  activeSuperChats: ActiveSuperChat[];
}

export interface GeneratedScenario {
  streamerName: string;
  streamTitle: string;
  viewers: string[];
  comments: string[];
}