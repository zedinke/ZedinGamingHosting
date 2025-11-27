'use client';

import { useState, useEffect, useRef } from 'react';
import { Send, Bot, User, X, MessageSquare, Trash2 } from 'lucide-react';
import toast from 'react-hot-toast';
import { useSession } from 'next-auth/react';

interface Message {
  id: string;
  role: 'USER' | 'ASSISTANT';
  content: string;
  createdAt: Date;
}

interface AIChatPanelProps {
  isOpen: boolean;
  onClose: () => void;
}

export function AIChatPanel({ isOpen, onClose }: AIChatPanelProps) {
  const { data: session } = useSession();
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [conversationId, setConversationId] = useState<string | undefined>();
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (isOpen && conversationId) {
      loadConversation();
    }
  }, [isOpen, conversationId]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const loadConversation = async () => {
    if (!conversationId) return;

    try {
      const response = await fetch(`/api/chat?conversationId=${conversationId}`);
      const data = await response.json();
      if (data.conversation) {
        setMessages(data.conversation.messages);
      }
    } catch (error) {
      console.error('Hiba a konverzáció betöltésekor:', error);
    }
  };

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isLoading) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'USER',
      content: input,
      createdAt: new Date(),
    };

    const userInput = input;
    setMessages((prev) => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);

    // Streaming válasz kezelése
    const useStreaming = true; // Streaming bekapcsolva

    try {
      if (useStreaming) {
        // Streaming válasz
        const response = await fetch('/api/chat', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            conversationId,
            message: userInput,
            stream: true,
          }),
        });

        if (!response.ok) {
          const error = await response.json();
          throw new Error(error.error || 'Hiba történt');
        }

        // Streaming válasz feldolgozása
        const reader = response.body?.getReader();
        const decoder = new TextDecoder();

        if (!reader) {
          throw new Error('Nem sikerült olvasni a stream-et');
        }

        // Üres assistant üzenet létrehozása
        const assistantMessageId = Date.now().toString();
        let fullContent = '';

        setMessages((prev) => [
          ...prev,
          {
            id: assistantMessageId,
            role: 'ASSISTANT',
            content: '',
            createdAt: new Date(),
          },
        ]);

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          const chunk = decoder.decode(value);
          const lines = chunk.split('\n').filter((line) => line.trim());

          for (const line of lines) {
            if (line.startsWith('data: ')) {
              try {
                const data = JSON.parse(line.slice(6));
                if (data.content) {
                  fullContent += data.content;
                  // Frissítjük az üzenetet
                  setMessages((prev) =>
                    prev.map((msg) =>
                      msg.id === assistantMessageId
                        ? { ...msg, content: fullContent }
                        : msg
                    )
                  );
                }
                if (data.conversationId) {
                  setConversationId(data.conversationId);
                }
                if (data.done) {
                  if (data.conversationId) {
                    setConversationId(data.conversationId);
                  }
                  break;
                }
                if (data.error) {
                  throw new Error(data.error);
                }
              } catch (e) {
                // JSON parse hiba, folytatjuk
              }
            }
          }
        }
      } else {
        // Normál válasz (nem streaming)
        const response = await fetch('/api/chat', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            conversationId,
            message: userInput,
            stream: false,
          }),
        });

        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.error || 'Hiba történt');
        }

        setConversationId(data.conversationId);
        setMessages((prev) => [
          ...prev,
          {
            id: data.message.id,
            role: 'ASSISTANT',
            content: data.message.content,
            createdAt: new Date(data.message.createdAt),
          },
        ]);
      }
    } catch (error: any) {
      toast.error(error.message || 'Hiba történt a válasz generálása során');
      setMessages((prev) => prev.slice(0, -1)); // Visszavonjuk a felhasználó üzenetét
    } finally {
      setIsLoading(false);
    }
  };

  const handleNewChat = () => {
    setConversationId(undefined);
    setMessages([]);
    setInput('');
  };

  if (!isOpen) return null;

  return (
    <>
      {/* Overlay mobil nézethez */}
      <div
        className="fixed inset-0 bg-black bg-opacity-50 z-40 md:hidden"
        onClick={onClose}
      />
      <div className="fixed right-0 top-0 h-full w-full md:w-96 bg-white shadow-2xl z-50 flex flex-col border-l border-gray-200 animate-slide-in-right">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-gray-200 bg-primary-600 text-white">
        <div className="flex items-center gap-2">
          <Bot className="w-5 h-5" />
          <h2 className="font-semibold text-lg">AI Chat Támogatás</h2>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={handleNewChat}
            className="p-1.5 hover:bg-primary-700 rounded transition-colors"
            title="Új beszélgetés"
          >
            <Trash2 className="w-4 h-4" />
          </button>
          <button
            onClick={onClose}
            className="p-1.5 hover:bg-primary-700 rounded transition-colors"
            title="Bezárás"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-50">
        {messages.length === 0 && (
          <div className="text-center text-gray-500 py-8">
            <Bot className="mx-auto mb-4 w-12 h-12 text-gray-400" />
            <p className="font-medium mb-2">Kérdezz bármit a hostingról!</p>
            <p className="text-sm">
              Például: "Hogyan állítsak be egy Minecraft szervert?"
            </p>
          </div>
        )}

        {messages.map((message) => (
          <div
            key={message.id}
            className={`flex gap-3 ${
              message.role === 'USER' ? 'justify-end' : 'justify-start'
            }`}
          >
            {message.role === 'ASSISTANT' && (
              <div className="w-8 h-8 rounded-full bg-primary-100 flex items-center justify-center flex-shrink-0">
                <Bot className="w-5 h-5 text-primary-600" />
              </div>
            )}
            <div
              className={`max-w-[80%] rounded-lg px-4 py-2 ${
                message.role === 'USER'
                  ? 'bg-primary-600 text-white'
                  : 'bg-white text-gray-900 border border-gray-200'
              }`}
            >
              <p className="whitespace-pre-wrap text-sm">{message.content}</p>
            </div>
            {message.role === 'USER' && (
              <div className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center flex-shrink-0">
                <User className="w-5 h-5 text-gray-600" />
              </div>
            )}
          </div>
        ))}

        {isLoading && (
          <div className="flex gap-3 justify-start">
            <div className="w-8 h-8 rounded-full bg-primary-100 flex items-center justify-center">
              <Bot className="w-5 h-5 text-primary-600" />
            </div>
            <div className="bg-white rounded-lg px-4 py-2 border border-gray-200">
              <div className="flex gap-1">
                <div
                  className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"
                  style={{ animationDelay: '0ms' }}
                ></div>
                <div
                  className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"
                  style={{ animationDelay: '150ms' }}
                ></div>
                <div
                  className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"
                  style={{ animationDelay: '300ms' }}
                ></div>
              </div>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <form onSubmit={handleSend} className="border-t border-gray-200 p-4 bg-white">
        <div className="flex gap-2">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Írd be a kérdésed..."
            className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 text-sm"
            disabled={isLoading}
          />
          <button
            type="submit"
            disabled={isLoading || !input.trim()}
            className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 transition-colors"
          >
            <Send className="w-4 h-4" />
          </button>
        </div>
      </form>
    </div>
    </>
  );
}

