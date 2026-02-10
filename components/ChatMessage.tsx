import React from 'react';
import { ChatMessage as ChatMessageType } from '../types';
import { SC_TIERS } from '../constants';

interface Props {
  message: ChatMessageType;
}

export const ChatMessage = React.memo(({ message }: Props) => {
  const { viewer, text, isSuperChat, tier, amount } = message;

  if (isSuperChat && tier && amount) {
    const style = SC_TIERS[tier];
    return (
      <div className={`mb-2 rounded-lg overflow-hidden shadow-sm animate-fade-in font-sans mx-2 ${tier === 'red' ? 'ring-4 ring-red-400 animate-pulse' : ''}`}>
        {/* Header */}
        <div className={`${style.color} px-3 py-1 flex justify-between items-center ${style.textColor}`}>
          <div className="flex items-center gap-2">
            <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold bg-white/20`}>
              {viewer.name[0].toUpperCase()}
            </div>
            <span className="font-bold text-sm truncate max-w-[120px]">{viewer.name}</span>
          </div>
          <span className="font-bold text-sm">{amount}</span>
        </div>
        {/* Body */}
        <div className={`${style.color} brightness-90 px-3 py-2 ${style.textColor}`}>
          <p className="text-sm break-words">{text}</p>
        </div>
      </div>
    );
  }

  // Normal Message
  return (
    <div className="flex items-start gap-2 px-3 py-1 hover:bg-white/5 text-sm font-sans">
      <div className={`mt-0.5 flex-shrink-0 w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold text-white`} style={{ backgroundColor: viewer.avatarColor }}>
        {viewer.name[0].toUpperCase()}
      </div>
      <div className="min-w-0">
        <span className="font-semibold text-gray-400 mr-2 text-xs">{viewer.name}</span>
        <span className="text-gray-200 break-words">{text}</span>
      </div>
    </div>
  );
});

ChatMessage.displayName = 'ChatMessage';
