import React, { useEffect, useState } from 'react';
import { Play, Volume2, Settings, Maximize, Users, Flame } from 'lucide-react';

interface Props {
  streamerName: string;
  streamTitle: string;
  isGameActive: boolean;
  score: number;
  currentViewers: number;
  subscribers: number;
  combo: number;
  enjouPoints: number;
}

export const LiveStreamScreen: React.FC<Props> = ({ streamerName, streamTitle, isGameActive, score, currentViewers, subscribers, combo, enjouPoints }) => {
  const [comboScale, setComboScale] = useState(1);

  useEffect(() => {
    if (combo > 1) {
      setComboScale(1.5);
      const timer = setTimeout(() => setComboScale(1), 150);
      return () => clearTimeout(timer);
    }
  }, [combo]);

  return (
    <div className="flex flex-col h-full bg-black relative overflow-hidden group">
      {/* Video Placeholder */}
      <div className="flex-1 bg-gradient-to-br from-indigo-900 to-purple-900 flex items-center justify-center relative">
        {/* Animated Background Elements */}
        <div className="absolute inset-0 opacity-20">
          <div className="absolute top-1/4 left-1/4 w-32 h-32 bg-pink-500 rounded-full blur-3xl animate-pulse"></div>
          <div className="absolute bottom-1/3 right-1/4 w-48 h-48 bg-blue-500 rounded-full blur-3xl animate-pulse delay-700"></div>
        </div>

        {/* Center Content */}
        <div className="text-center z-10 p-8 transition-opacity duration-300" style={{ opacity: (isGameActive && combo > 5) ? 0.3 : 1 }}>
            <div className="w-32 h-32 mx-auto bg-gray-800 rounded-full mb-4 border-4 border-red-500 flex items-center justify-center overflow-hidden shadow-lg shadow-red-500/20 relative">
                 <img 
                    src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${streamerName}`} 
                    alt="Streamer" 
                    className="w-full h-full object-cover"
                />
                 {isGameActive && (
                    <div className="absolute bottom-0 w-full h-full bg-black/30 flex items-end justify-center pb-2">
                        <div className="flex space-x-1">
                             <div className="w-1 h-3 bg-red-500 animate-bounce"></div>
                             <div className="w-1 h-5 bg-red-500 animate-bounce delay-75"></div>
                             <div className="w-1 h-2 bg-red-500 animate-bounce delay-150"></div>
                        </div>
                    </div>
                 )}
            </div>
            <h2 className="text-white text-3xl font-bold tracking-tight drop-shadow-md">{streamerName}</h2>
            <p className="text-red-400 font-medium tracking-widest text-sm mt-1 uppercase animate-pulse">
                {isGameActive ? "🔴 配信中" : "オフライン"}
            </p>
        </div>

        {/* Game HUD Overlay on top of "Video" */}
        {isGameActive && (
          <div className="absolute top-4 left-4 right-4 flex justify-between items-start z-20">
             <div className="flex flex-col gap-2">
                 <div className="bg-black/60 backdrop-blur-md rounded-lg p-3 border border-white/10 text-white w-40">
                    <div className="text-xs text-gray-400 uppercase">売上 (スコア)</div>
                    <div className="text-2xl font-mono font-bold text-yellow-400">¥{score.toLocaleString()}</div>
                 </div>
                 <div className="bg-black/60 backdrop-blur-md rounded-lg p-3 border border-white/10 text-white w-40 flex items-center gap-2">
                    <Users className="w-5 h-5 text-blue-400" />
                    <div>
                        <div className="text-xs text-gray-400 uppercase">同接数</div>
                        <div className="text-lg font-mono font-bold">{currentViewers.toLocaleString()}</div>
                    </div>
                 </div>
             </div>
             
             {/* Enjou Meter (Flaming Risk) */}
             <div className="bg-black/60 backdrop-blur-md rounded-lg p-3 border border-white/10 text-white w-64">
                 <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                        <Flame className={`w-5 h-5 ${enjouPoints > 50 ? 'text-red-500 animate-bounce' : 'text-orange-400'}`} />
                        <span className="text-xs font-bold uppercase text-red-200">炎上リスク</span>
                    </div>
                    <span className="text-sm font-bold text-red-200">{enjouPoints}%</span>
                 </div>
                 <div className="w-full bg-gray-700 h-3 rounded-full overflow-hidden border border-white/10">
                     <div 
                        className={`h-full transition-all duration-300 ease-out ${
                            enjouPoints > 80 ? 'bg-red-600 animate-pulse' : 
                            enjouPoints > 50 ? 'bg-orange-500' : 'bg-yellow-500'
                        }`}
                        style={{ width: `${enjouPoints}%` }}
                     ></div>
                 </div>
                 {enjouPoints > 50 && (
                     <div className="text-xs text-red-400 text-center mt-1 font-bold animate-pulse">
                         {enjouPoints > 80 ? "炎上寸前！！！" : "コメントが荒れています"}
                     </div>
                 )}
             </div>
          </div>
        )}
        
        {/* Central Combo Animation */}
        {isGameActive && combo > 1 && (
            <div className="absolute inset-0 flex items-center justify-center z-30 pointer-events-none">
                <div 
                    className="flex flex-col items-center transition-transform duration-100 ease-out origin-center"
                    style={{ transform: `scale(${comboScale}) rotate(${combo % 2 === 0 ? '3deg' : '-3deg'})` }}
                >
                    <div className="relative">
                        <span className="text-9xl font-black italic text-yellow-400 drop-shadow-[0_8px_0_rgba(0,0,0,0.8)]" 
                              style={{ WebkitTextStroke: '4px #b91c1c' }}>
                            {combo}
                        </span>
                        {combo >= 10 && (
                            <span className="absolute -top-8 -right-12 text-6xl animate-bounce filter drop-shadow-lg">🔥</span>
                        )}
                    </div>
                    <div className="bg-red-600 text-white px-6 py-2 transform -skew-x-12 border-4 border-white shadow-xl mt-2">
                        <span className="text-4xl font-black italic uppercase tracking-tighter block transform skew-x-12">
                            COMBO!
                        </span>
                    </div>
                </div>
            </div>
        )}
      </div>

      {/* Player Controls (Fake) */}
      <div className="h-14 bg-gradient-to-t from-black/90 to-transparent absolute bottom-0 w-full flex items-center px-4 space-x-4 opacity-0 group-hover:opacity-100 transition-opacity duration-300 z-40">
        <Play className="text-white w-5 h-5 fill-white" />
        <Volume2 className="text-white w-5 h-5" />
        <div className="flex-1 h-1 bg-gray-600 rounded-full overflow-hidden">
            <div className="h-full w-[95%] bg-red-600"></div>
        </div>
        <span className="text-white text-xs font-medium bg-red-600 px-1 rounded">ライブ</span>
        <Settings className="text-white w-5 h-5" />
        <Maximize className="text-white w-5 h-5" />
      </div>

      {/* Stream Info (Below Video) */}
      <div className="bg-[#121212] p-4 border-b border-gray-800">
        <h1 className="text-xl text-white font-semibold line-clamp-1">{streamTitle}</h1>
        <div className="flex items-center space-x-2 mt-2 text-gray-400 text-sm">
            <img src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${streamerName}`} className="w-10 h-10 rounded-full bg-gray-700" alt="Avatar"/>
            <div className="flex flex-col">
                <span className="text-white font-medium">{streamerName}</span>
                <span className="text-xs">登録者数 {subscribers.toLocaleString()}人</span>
            </div>
            <button className="ml-auto bg-white text-black px-4 py-2 rounded-full font-bold text-sm hover:bg-gray-200">チャンネル登録</button>
            <button className="bg-white/10 text-white px-4 py-2 rounded-full font-bold text-sm hover:bg-white/20">メンバーになる</button>
        </div>
      </div>
    </div>
  );
};