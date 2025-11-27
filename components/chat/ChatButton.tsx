'use client';

import { useState } from 'react';
import { MessageSquare, X } from 'lucide-react';
import { useSession } from 'next-auth/react';
import { AIChatPanel } from './AIChatPanel';

export function ChatButton() {
  const { data: session } = useSession();
  const [isOpen, setIsOpen] = useState(false);

  // Csak bejelentkezett felhasználóknak jelenjen meg
  if (!session) {
    return null;
  }

  return (
    <>
      {/* Lebegő gomb */}
      <button
        onClick={() => setIsOpen(true)}
        className="fixed bottom-6 right-6 w-14 h-14 bg-primary-600 text-white rounded-full shadow-lg hover:bg-primary-700 transition-all hover:scale-110 z-[45] flex items-center justify-center group"
        title="AI Chat Támogatás"
      >
        {isOpen ? (
          <X className="w-6 h-6" />
        ) : (
          <MessageSquare className="w-6 h-6" />
        )}
        {!isOpen && (
          <span className="absolute -top-1 -right-1 w-3 h-3 bg-green-500 rounded-full border-2 border-white animate-pulse"></span>
        )}
      </button>

      {/* Chat Panel */}
      <AIChatPanel isOpen={isOpen} onClose={() => setIsOpen(false)} />
    </>
  );
}

