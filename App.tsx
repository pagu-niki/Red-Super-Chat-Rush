import React, { useState, useEffect, useRef, useCallback } from 'react';
import { v4 as uuidv4 } from 'uuid';
import { generateStreamScenario } from './services/geminiService';
import { ChatMessage as ChatMessageType, StreamContext, GameState, Viewer } from './types';
import { SC_TIERS, GAME_CONFIG } from './constants';
import { ChatMessage } from './components/ChatMessage';
import { LiveStreamScreen } from './components/LiveStreamScreen';
import { ReactionPanel } from './components/ReactionPanel';
import { Loader2, Trophy, AlertTriangle, RefreshCcw, UserPen, Flame } from 'lucide-react';

const App: React.FC = () => {
  // --- State ---
  const [context, setContext] = useState<StreamContext | null>(null);
  const [loading, setLoading] = useState(false);
  
  // Custom streamer name input
  const [customStreamerName, setCustomStreamerName] = useState("");

  const [messages, setMessages] = useState<ChatMessageType[]>([]);
  const [gameState, setGameState] = useState<GameState>({
    isPlaying: false,
    score: 0,
    currentViewers: GAME_CONFIG.INITIAL_VIEWERS,
    subscribers: GAME_CONFIG.INITIAL_SUBSCRIBERS,
    streak: 0,
    enjouPoints: 0,
    gameOver: false,
    activeSuperChats: []
  });

  const chatContainerRef = useRef<HTMLDivElement>(null);
  const gameLoopRef = useRef<number | null>(null);
  const lastSpawnTimeRef = useRef<number>(0);
  const gameStartTimeRef = useRef<number>(0);
  const scTimeoutsRef = useRef<Map<string, number>>(new Map());

  // --- Initialization ---

  const initGame = async () => {
    setLoading(true);
    const data = await generateStreamScenario(customStreamerName);
    
    // Convert string array to Viewer objects
    const viewerPool: Viewer[] = data.viewers.map(name => ({
      name,
      avatarColor: `hsl(${Math.floor(Math.random() * 360)}, 70%, 50%)`,
    }));

    setContext({
      streamerName: data.streamerName,
      streamTitle: data.streamTitle,
      topic: "Just Chatting",
      viewerPool,
      genericComments: data.comments
    });

    setLoading(false);
    resetGame();
  };

  const resetGame = () => {
    setMessages([]);
    // Clear any existing timeouts
    scTimeoutsRef.current.forEach(timeoutId => clearTimeout(timeoutId));
    scTimeoutsRef.current.clear();

    gameStartTimeRef.current = Date.now();

    setGameState({
      isPlaying: true,
      score: 0,
      currentViewers: GAME_CONFIG.INITIAL_VIEWERS,
      subscribers: GAME_CONFIG.INITIAL_SUBSCRIBERS,
      streak: 0,
      enjouPoints: 0,
      gameOver: false,
      activeSuperChats: []
    });
    // Add initial welcome message
    setMessages([{
        id: 'system-start',
        viewer: { name: 'System', avatarColor: '#000' },
        text: 'チャットへようこそ！スパチャに警戒せよ！',
        isSuperChat: false,
        timestamp: Date.now()
    }]);
  };

  useEffect(() => {
    return () => {
        // Cleanup timeouts on unmount
        scTimeoutsRef.current.forEach(timeoutId => clearTimeout(timeoutId));
    };
  }, []);

  // --- Enjou Reduction on Streak ---
  useEffect(() => {
    if (!gameState.isPlaying || gameState.gameOver) return;

    const interval = setInterval(() => {
        setGameState(prev => {
            // If user has a streak and has enjou points, reduce them
            if (prev.streak > 0 && prev.enjouPoints > 0) {
                return {
                    ...prev,
                    enjouPoints: Math.max(0, prev.enjouPoints - 1)
                };
            }
            return prev;
        });
    }, 1000);

    return () => clearInterval(interval);
  }, [gameState.isPlaying, gameState.gameOver]);

  // --- Game Mechanics Helpers ---

  const getRandomViewer = useCallback(() => {
    if (!context) return { name: '名無し', avatarColor: '#ccc' };
    return context.viewerPool[Math.floor(Math.random() * context.viewerPool.length)];
  }, [context]);

  const generateOptions = useCallback((correctName: string) => {
    if (!context) return [];
    const pool = context.viewerPool.map(v => v.name).filter(n => n !== correctName);
    // Shuffle pool
    const shuffled = pool.sort(() => 0.5 - Math.random());
    const wrongOptions = shuffled.slice(0, 3);
    const allOptions = [correctName, ...wrongOptions].sort(() => 0.5 - Math.random());
    return allOptions;
  }, [context]);

  const handleScMiss = useCallback((scId: string) => {
    setGameState(prev => {
        if (prev.gameOver) return prev;
        
        // Check if SC still exists
        const missedSc = prev.activeSuperChats.find(sc => sc.id === scId);
        if (!missedSc) return prev;

        const damage = SC_TIERS[missedSc.tier].damage || 10;
        const newEnjou = Math.min(100, prev.enjouPoints + damage);

        return {
            ...prev,
            // Viewers DO NOT decrease anymore
            streak: 0,
            enjouPoints: newEnjou,
            activeSuperChats: prev.activeSuperChats.filter(sc => sc.id !== scId),
            gameOver: newEnjou >= 100
        };
    });
    
    scTimeoutsRef.current.delete(scId);
  }, []);

  const spawnMessage = useCallback(() => {
    if (!context) return;
    
    const now = Date.now();
    // Allow spawning if we have fewer than 5 active SCs
    const canSpawnSC = gameState.activeSuperChats.length < 5;
    const isSuperChat = canSpawnSC && Math.random() < GAME_CONFIG.SUPER_CHAT_CHANCE;
    
    let message: ChatMessageType;
    const viewer = getRandomViewer();

    if (isSuperChat) {
      // Determine Tier
      const tierRoll = Math.random();
      let tier: keyof typeof SC_TIERS = 'blue';
      
      // Determine color rarity
      if (Math.random() < GAME_CONFIG.RED_SC_CHANCE) tier = 'red';
      else if (tierRoll > 0.9) tier = 'magenta';
      else if (tierRoll > 0.8) tier = 'orange';
      else if (tierRoll > 0.6) tier = 'yellow';
      else if (tierRoll > 0.4) tier = 'green';
      else if (tierRoll > 0.2) tier = 'cyan';

      const scData = SC_TIERS[tier];
      
      message = {
        id: uuidv4(),
        viewer,
        text: tier === 'red' ? "気づいてえええええ！大好き！！！！" : "いつも応援してます！配信頑張って！",
        isSuperChat: true,
        tier,
        amount: scData.amount,
        timestamp: now
      };

      // ACTIVATE GAME EVENT
      const options = generateOptions(viewer.name);
      
      const newActiveSc = {
          id: message.id,
          viewerName: viewer.name,
          tier,
          options,
          expiresAt: now + GAME_CONFIG.REACTION_TIME_MS
      };

      setGameState(prev => ({
          ...prev,
          activeSuperChats: [...prev.activeSuperChats, newActiveSc]
      }));

      // Set timeout to fail
      const timeoutId = window.setTimeout(() => {
          handleScMiss(message.id);
      }, GAME_CONFIG.REACTION_TIME_MS);
      
      scTimeoutsRef.current.set(message.id, timeoutId);

    } else {
      // Normal Message
      message = {
        id: uuidv4(),
        viewer,
        text: context.genericComments[Math.floor(Math.random() * context.genericComments.length)],
        isSuperChat: false,
        timestamp: now
      };
    }

    setMessages(prev => {
        const newArr = [...prev, message];
        if (newArr.length > 50) return newArr.slice(newArr.length - 50); // Keep buffer small
        return newArr;
    });

  }, [context, gameState.activeSuperChats.length, getRandomViewer, generateOptions, handleScMiss]);

  // --- Game Loop ---

  useEffect(() => {
    if (!gameState.isPlaying || gameState.gameOver || !context) {
        if (gameLoopRef.current) cancelAnimationFrame(gameLoopRef.current);
        return;
    }

    const loop = (time: number) => {
        // Dynamic Difficulty: Speed increases based on Viewer Count
        // Base: 10,000 viewers. Max Speed at: 50,000 viewers (just an example cap)
        const viewersGained = Math.max(0, gameState.currentViewers - GAME_CONFIG.INITIAL_VIEWERS);
        const maxViewerGainForSpeed = 50000;
        const progress = Math.min(1, viewersGained / maxViewerGainForSpeed);
        
        const currentSpawnRate = GAME_CONFIG.INITIAL_SPAWN_RATE_MS - 
            (progress * (GAME_CONFIG.INITIAL_SPAWN_RATE_MS - GAME_CONFIG.MIN_SPAWN_RATE_MS));

        if (time - lastSpawnTimeRef.current > currentSpawnRate) {
            spawnMessage();
            lastSpawnTimeRef.current = time;
        }
        gameLoopRef.current = requestAnimationFrame(loop);
    };

    gameLoopRef.current = requestAnimationFrame(loop);

    return () => {
        if (gameLoopRef.current) cancelAnimationFrame(gameLoopRef.current);
    };
  }, [gameState.isPlaying, gameState.gameOver, context, spawnMessage, gameState.currentViewers]);

  // --- Auto Scroll ---
  useEffect(() => {
    if (chatContainerRef.current) {
        chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight;
    }
  }, [messages]);


  // --- User Interaction ---

  const handleOptionSelect = (scId: string, selectedName: string) => {
    const targetSc = gameState.activeSuperChats.find(sc => sc.id === scId);
    if (!targetSc) return;

    // Clear timeout immediately
    const timeoutId = scTimeoutsRef.current.get(scId);
    if (timeoutId) {
        clearTimeout(timeoutId);
        scTimeoutsRef.current.delete(scId);
    }

    if (selectedName === targetSc.viewerName) {
        // CORRECT
        setGameState(prev => {
            const streakBonus = prev.streak * 100;
            // Subscribers do NOT increase anymore
            
            return {
                ...prev,
                score: prev.score + 1000 + (prev.streak * 500),
                currentViewers: prev.currentViewers + GAME_CONFIG.VIEWER_REWARD + streakBonus,
                // subscribers: prev.subscribers, // Static
                streak: prev.streak + 1,
                activeSuperChats: prev.activeSuperChats.filter(sc => sc.id !== scId)
            };
        });
    } else {
        // WRONG
        handleScMiss(scId);
    }
  };

  // --- Renders ---

  if (loading) {
      return (
          <div className="min-h-screen bg-black flex items-center justify-center text-white flex-col gap-4">
              <Loader2 className="animate-spin w-12 h-12 text-red-500" />
              <p className="text-xl font-mono animate-pulse">{customStreamerName}の配信を準備中...</p>
          </div>
      );
  }

  if (!context) {
      return (
        <div className="min-h-screen bg-neutral-900 flex items-center justify-center p-4">
            <div className="bg-neutral-800 p-8 rounded-2xl shadow-2xl max-w-lg w-full text-center border border-neutral-700">
                <div className="w-20 h-20 bg-red-600 rounded-full mx-auto flex items-center justify-center mb-6 shadow-lg shadow-red-600/30">
                    <Trophy className="text-white w-10 h-10" />
                </div>
                <h1 className="text-4xl font-black text-white mb-2">スパチャラッシュ</h1>
                <p className="text-gray-400 mb-6">
                    君は究極のモデレーターだ。<br/>
                    次々と来るスパチャを捌き切れ！<br/>
                </p>

                <div className="mb-6 text-left">
                    <label className="block text-gray-400 text-xs font-bold mb-2 uppercase tracking-wide flex items-center gap-2">
                        <UserPen className="w-4 h-4" />
                        配信者の名前 (オプション)
                    </label>
                    <input 
                        type="text" 
                        value={customStreamerName}
                        onChange={(e) => setCustomStreamerName(e.target.value)}
                        placeholder="例: もふもふちゃん (未入力でランダム)"
                        className="w-full bg-neutral-900 text-white rounded-lg p-3 border border-neutral-600 focus:border-red-500 focus:outline-none transition-colors placeholder-gray-600"
                    />
                </div>

                <button 
                    onClick={initGame}
                    className="w-full bg-red-600 hover:bg-red-700 text-white font-bold py-4 px-6 rounded-xl transition-all transform hover:scale-105 active:scale-95 shadow-lg"
                >
                    配信開始
                </button>
            </div>
        </div>
      );
  }

  return (
    <div className="min-h-screen bg-[#0f0f0f] text-white flex flex-col md:flex-row h-screen overflow-hidden font-sans">
      
      {/* LEFT: Stream Content */}
      <div className="flex-1 flex flex-col relative h-1/2 md:h-full">
         <LiveStreamScreen 
            streamerName={context.streamerName}
            streamTitle={context.streamTitle}
            isGameActive={gameState.isPlaying && !gameState.gameOver}
            score={gameState.score}
            currentViewers={gameState.currentViewers}
            subscribers={gameState.subscribers}
            combo={gameState.streak}
            enjouPoints={gameState.enjouPoints}
         />
         
         {/* Game Over Overlay */}
         {gameState.gameOver && (
            <div className="absolute inset-0 bg-black/80 z-50 flex items-center justify-center backdrop-blur-sm">
                <div className="text-center p-8 bg-neutral-800 rounded-xl border border-red-500 shadow-2xl animate-fade-in-up">
                    <Flame className="w-16 h-16 text-orange-500 mx-auto mb-4 animate-bounce" />
                    <h2 className="text-3xl font-bold text-white mb-2">SNSで炎上してしまった…</h2>
                    <p className="text-red-400 font-bold mb-4">スパチャ無視は許されない！</p>
                    <div className="text-6xl font-black text-yellow-400 mb-6">{gameState.score.toLocaleString()}</div>
                    <div className="flex gap-4 justify-center">
                        <button 
                            onClick={initGame} 
                            className="flex items-center gap-2 bg-white text-black font-bold py-3 px-6 rounded-full hover:bg-gray-200 transition"
                        >
                            <RefreshCcw className="w-5 h-5" /> 別の配信へ
                        </button>
                        <button 
                            onClick={resetGame} 
                            className="flex items-center gap-2 bg-red-600 text-white font-bold py-3 px-6 rounded-full hover:bg-red-700 transition"
                        >
                            もう一度
                        </button>
                    </div>
                </div>
            </div>
         )}
      </div>

      {/* RIGHT: Chat & Game Controls */}
      <div className="w-full md:w-[400px] flex flex-col border-l border-gray-800 bg-[#18181b] h-1/2 md:h-full z-10 shadow-xl">
        {/* Chat Header */}
        <div className="p-3 border-b border-gray-700 flex justify-between items-center bg-[#212121]">
            <h3 className="uppercase text-sm font-semibold tracking-wider text-gray-300">ライブチャット</h3>
            
            <div className="flex items-center gap-4">
                <div className="flex items-center gap-2">
                    <div className={`w-2 h-2 rounded-full ${gameState.isPlaying ? 'bg-red-500 animate-pulse' : 'bg-gray-500'}`}></div>
                    <span className="text-xs text-red-500 font-bold">
                        {gameState.isPlaying ? `${gameState.currentViewers.toLocaleString()} 人` : 'オフライン'}
                    </span>
                </div>
            </div>
        </div>

        {/* Messages Feed */}
        <div 
            ref={chatContainerRef}
            className="flex-1 overflow-y-auto overflow-x-hidden p-2 space-y-1 relative"
            style={{ scrollBehavior: 'smooth' }}
        >
            {messages.map((msg) => (
                <ChatMessage key={msg.id} message={msg} />
            ))}
            
            {/* Scroll Anchor */}
            <div className="h-1"></div>
        </div>

        {/* Input area is replaced by Game Controls */}
        <ReactionPanel 
            activeSuperChats={gameState.activeSuperChats}
            onSelect={handleOptionSelect}
            gameActive={gameState.isPlaying && !gameState.gameOver}
        />
      </div>
    </div>
  );
};

export default App;