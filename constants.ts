import { SuperChatTier } from './types';

export const GAME_CONFIG = {
  INITIAL_VIEWERS: 10000,
  INITIAL_SUBSCRIBERS: 1000000,
  VIEWER_PENALTY: 2000,
  VIEWER_REWARD: 500,
  
  // Difficulty Settings
  INITIAL_SPAWN_RATE_MS: 600, // Start speed
  MIN_SPAWN_RATE_MS: 120,     // Max speed (fastest)
  TIME_TO_MAX_DIFFICULTY: 90000, // Time to reach max speed (ms) -> 90 seconds

  SUPER_CHAT_CHANCE: 0.15, // 15% chance of any SC
  RED_SC_CHANCE: 0.05, // 5% chance of Red SC
  SCROLL_SPEED: 2,
  REACTION_TIME_MS: 5000, // 5 seconds to react
};

export const SC_TIERS: Record<SuperChatTier, { color: string; amount: string; textColor: string; damage: number }> = {
  blue: { color: 'bg-blue-600', amount: '¥200', textColor: 'text-white', damage: 1 },
  cyan: { color: 'bg-teal-500', amount: '¥500', textColor: 'text-black', damage: 2 },
  green: { color: 'bg-green-500', amount: '¥1,000', textColor: 'text-black', damage: 3 },
  yellow: { color: 'bg-yellow-400', amount: '¥2,000', textColor: 'text-black', damage: 5 },
  orange: { color: 'bg-orange-500', amount: '¥5,000', textColor: 'text-white', damage: 8 },
  magenta: { color: 'bg-fuchsia-600', amount: '¥10,000', textColor: 'text-white', damage: 12 },
  red: { color: 'bg-red-600', amount: '¥50,000', textColor: 'text-white', damage: 15 },
};

// Fallback data if API fails or is not used
export const FALLBACK_SCENARIO = {
  streamerName: "もふもふちゃん",
  streamTitle: "【エルデンリング】目隠しでマレニア倒す！ノーヒット縛り！🔴",
  viewers: [
    "草マスター", "エビフライ", "ねこ好き99", "田中太郎", "ゲーマーボーイ",
    "眠い騎士", "ラーメン大好き", "推ししか勝たん", "ホロゾーン", "Apexプレデター",
    "マイクラ勇者", "ゾンビ子", "スパチャ王", "財布くん", "養分",
    "ガチ恋", "海外ニキ", "日本のアニキ", "ローマ字戦士", "翻訳求ム"
  ],
  comments: [
    "草", "ｗｗｗ", "きたああああ", "うおおおお", "ないす！", "GG", "RIP",
    "かわいい！", "結婚して", "認知して", "ラグい？", "F",
    "まじか！", "神プ", "指示厨BANして", "回復使え！",
    "初見です", "ブラジルから見てます", "888888", "たすかる"
  ]
};