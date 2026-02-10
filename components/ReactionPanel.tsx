import React, { useEffect, useState } from 'react';
import { Timer } from 'lucide-react';
import { ActiveSuperChat } from '../types';
import { SC_TIERS } from '../constants';

interface Props {
  activeSuperChats: ActiveSuperChat[];
  onSelect: (scId: string, name: string) => void;
  gameActive: boolean;
}

const SuperChatCard: React.FC<{
  sc: ActiveSuperChat;
  onSelect: (scId: string, name: string) => void;
}> = ({ sc, onSelect }) => {
  const [timeLeft, setTimeLeft] = useState(100);
  const style = SC_TIERS[sc.tier];

  useEffect(() => {
    const update = () => {
      const now = Date.now();
      const remaining = sc.expiresAt - now;
      const total = 5000; // Assuming 5000ms fixed duration
      const percent = Math.max(0, (remaining / total) * 100);
      setTimeLeft(percent);
    };
    
    // Run immediately
    update();
    
    const interval = setInterval(update, 50);
    return () => clearInterval(interval);
  }, [sc.expiresAt]);

  return (
    <div className={`flex-shrink-0 w-[300px] bg-gray-900 border-2 ${style.textColor === 'text-black' ? 'border-white' : style.color.replace('bg-', 'border-')} rounded-xl p-3 flex flex-col relative overflow-hidden shadow-lg mr-4`}>
        {/* Tier Indicator Background (Faint) */}
        <div className={`absolute inset-0 ${style.color} opacity-10 pointer-events-none`}></div>

        {/* Header */}
        <div className="flex justify-between items-center mb-2 z-10">
            <div className="flex items-center space-x-2">
                <Timer className={`w-4 h-4 ${timeLeft < 30 ? 'text-red-500 animate-pulse' : 'text-gray-400'}`} />
                <span className="text-xs font-bold uppercase text-gray-300">送り主は？</span>
            </div>
            <div className={`text-xs font-bold px-2 py-0.5 rounded ${style.color} ${style.textColor}`}>
                {style.amount}
            </div>
        </div>

        {/* Timer Bar */}
        <div className="w-full h-1.5 bg-gray-800 rounded-full mb-3 z-10 overflow-hidden">
            <div 
                className={`h-full transition-all duration-100 ease-linear ${timeLeft < 30 ? 'bg-red-500' : style.color.replace('bg-', 'bg-')}`}
                style={{ width: `${timeLeft}%` }}
            ></div>
        </div>

        {/* Options Grid */}
        <div className="grid grid-cols-2 gap-2 flex-1 z-10">
            {sc.options.map((name, idx) => (
                <button
                    key={`${sc.id}-${idx}`}
                    onClick={() => onSelect(sc.id, name)}
                    className="bg-gray-800 hover:bg-gray-700 active:scale-95 border border-gray-700 hover:border-white text-gray-200 text-xs font-bold py-2 px-1 rounded transition-all truncate"
                >
                    {name}
                </button>
            ))}
        </div>
    </div>
  );
};

export const ReactionPanel: React.FC<Props> = ({ activeSuperChats, onSelect, gameActive }) => {
  if (!gameActive) return null;

  return (
    <div className="bg-[#18181b] border-t border-gray-700 h-[250px] flex flex-col relative">
        <div className="flex-1 overflow-x-auto overflow-y-hidden p-4 flex items-center no-scrollbar">
            {activeSuperChats.length === 0 ? (
                <div className="w-full h-full flex flex-col items-center justify-center text-gray-600 space-y-2 opacity-50">
                    <Timer className="w-8 h-8" />
                    <span className="font-bold tracking-widest">スパチャ待機中...</span>
                </div>
            ) : (
                activeSuperChats.map(sc => (
                    <SuperChatCard key={sc.id} sc={sc} onSelect={onSelect} />
                ))
            )}
        </div>
        {/* Scroll hint gradient */}
        {activeSuperChats.length > 0 && (
             <div className="absolute right-0 top-0 bottom-0 w-8 bg-gradient-to-l from-[#18181b] to-transparent pointer-events-none"></div>
        )}
    </div>
  );
};
