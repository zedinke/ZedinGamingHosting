'use client';

import { useState, useEffect, useRef } from 'react';
import toast from 'react-hot-toast';

interface Message {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  createdAt: string;
  metadata?: any;
}

interface Conversation {
  id: string;
  title: string;
  messages: Message[];
  createdAt: string;
  updatedAt: string;
}

export function AIChatPanel() {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [currentConversation, setCurrentConversation] = useState<Conversation | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [streaming, setStreaming] = useState(false);
  const [streamingContent, setStreamingContent] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const [showSidebar, setShowSidebar] = useState(true);
  const [useWebSearch, setUseWebSearch] = useState(false);
  const abortControllerRef = useRef<AbortController | null>(null);

  // Konverzációk betöltése
  useEffect(() => {
    loadConversations();
  }, []);

  // Üzenetek betöltése konverzációváltáskor
  useEffect(() => {
    if (currentConversation) {
      setMessages(currentConversation.messages || []);
    } else {
      setMessages([]);
    }
  }, [currentConversation]);

  // Auto scroll
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, streamingContent]);

  const loadConversations = async () => {
    try {
      const response = await fetch('/api/admin/ai/chat');
      if (response.ok) {
        const data = await response.json();
        setConversations(data.conversations || []);
      }
    } catch (error) {
      console.error('Konverzációk betöltése hiba:', error);
    }
  };

  const loadConversation = async (conversationId: string) => {
    try {
      const response = await fetch(`/api/admin/ai/chat?conversationId=${conversationId}`);
      if (response.ok) {
        const data = await response.json();
        setCurrentConversation(data.conversation);
      }
    } catch (error) {
      console.error('Konverzáció betöltése hiba:', error);
    }
  };

  const sendMessage = async (stream = true) => {
    if (!input.trim() || loading) return;

    const userMessage: Message = {
      id: `temp-${Date.now()}`,
      role: 'user',
      content: input,
      createdAt: new Date().toISOString(),
    };

    const newMessages = [...messages, userMessage];
    setMessages(newMessages);
    setInput('');
    setLoading(true);

    if (stream) {
      setStreaming(true);
      setStreamingContent('');
    }

    try {
      const conversationId = currentConversation?.id;

      if (stream) {
        // Streaming válasz
        // Abort controller létrehozása a megszakításhoz
        abortControllerRef.current = new AbortController();
        
        const response = await fetch('/api/admin/ai/chat', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            conversationId,
            message: input,
            stream: true,
            useWebSearch,
          }),
          signal: abortControllerRef.current.signal,
        });

        if (!response.ok) {
          const errorText = await response.text().catch(() => '');
          let errorMessage = `Hiba történt (${response.status})`;
          try {
            const errorData = JSON.parse(errorText);
            errorMessage = errorData.error || errorMessage;
          } catch {
            if (errorText) errorMessage = errorText;
          }
          throw new Error(errorMessage);
        }

        const reader = response.body?.getReader();
        const decoder = new TextDecoder();

        if (!reader) {
          throw new Error('Nem sikerült olvasni a stream-et');
        }

        let fullResponse = '';
        let finalConversationId = conversationId;

        try {
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
                    fullResponse += data.content;
                    setStreamingContent(fullResponse);
                  }
                  if (data.error) {
                    throw new Error(data.error);
                  }
                  if (data.done) {
                    finalConversationId = data.conversationId || finalConversationId;
                    setStreaming(false);
                    setStreamingContent('');
                    
                    // Válasz hozzáadása
                    const assistantMessage: Message = {
                      id: `msg-${Date.now()}`,
                      role: 'assistant',
                      content: fullResponse,
                      createdAt: new Date().toISOString(),
                    };
                    setMessages([...newMessages, assistantMessage]);
                    
                    // Konverzáció frissítése
                    if (finalConversationId) {
                      await loadConversation(finalConversationId);
                      await loadConversations();
                    }
                    break;
                  }
                } catch (e) {
                  // JSON parse hiba, folytatjuk
                }
              }
            }
          }
        } catch (abortError: any) {
          // AbortError esetén megszakítjuk
          if (abortError.name === 'AbortError') {
            if (fullResponse) {
              const assistantMessage: Message = {
                id: `msg-${Date.now()}`,
                role: 'assistant',
                content: fullResponse + '\n\n[Megszakítva]',
                createdAt: new Date().toISOString(),
              };
              setMessages([...newMessages, assistantMessage]);
            }
            return;
          }
          throw abortError;
        }
        } catch (abortError: any) {
          // AbortError esetén megszakítjuk
          if (abortError.name === 'AbortError') {
            if (fullResponse) {
              const assistantMessage: Message = {
                id: `msg-${Date.now()}`,
                role: 'assistant',
                content: fullResponse + '\n\n[Megszakítva]',
                createdAt: new Date().toISOString(),
              };
              setMessages([...newMessages, assistantMessage]);
            }
            return;
          }
          throw abortError;
        }
      } else {
        // Normál válasz
        const response = await fetch('/api/admin/ai/chat', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            conversationId,
            message: input,
            stream: false,
            useWebSearch,
          }),
        });

        if (!response.ok) {
          const errorText = await response.text().catch(() => '');
          let errorMessage = `Hiba történt (${response.status})`;
          try {
            const errorData = JSON.parse(errorText);
            errorMessage = errorData.error || errorMessage;
          } catch {
            if (errorText) errorMessage = errorText;
          }
          throw new Error(errorMessage);
        }

        const data = await response.json();
        
        const assistantMessage: Message = {
          id: data.message.id,
          role: 'assistant',
          content: data.message.content,
          createdAt: data.message.createdAt,
        };

        setMessages([...newMessages, assistantMessage]);

        // Konverzáció frissítése
        if (data.conversationId) {
          await loadConversation(data.conversationId);
          await loadConversations();
        }
      }
    } catch (error: any) {
      // AbortError esetén ne jelenjen meg hibaüzenet
      if (error.name === 'AbortError') {
        // Megszakított válasz mentése
        if (streamingContent) {
          const assistantMessage: Message = {
            id: `msg-${Date.now()}`,
            role: 'assistant',
            content: streamingContent + '\n\n[Megszakítva]',
            createdAt: new Date().toISOString(),
          };
          setMessages([...newMessages, assistantMessage]);
        }
        return;
      }
      
      console.error('Üzenet küldés hiba:', error);
      toast.error(error.message || 'Hiba történt az üzenet küldése során');
      
      const errorMessage: Message = {
        id: `error-${Date.now()}`,
        role: 'assistant',
        content: 'Sajnálom, hiba történt. Kérlek, próbáld újra.',
        createdAt: new Date().toISOString(),
      };
      setMessages([...newMessages, errorMessage]);
    } finally {
      setLoading(false);
      setStreaming(false);
      setStreamingContent('');
      abortControllerRef.current = null;
    }
  };

  const stopGeneration = () => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
      setStreaming(false);
      setLoading(false);
      toast.success('Válasz generálás megszakítva');
    }
  };

  const startNewConversation = () => {
    setCurrentConversation(null);
    setMessages([]);
    setInput('');
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  return (
    <div className="flex h-screen bg-gray-50">
      {/* Sidebar - Konverzációk */}
      {showSidebar && (
        <div className="w-64 bg-white border-r border-gray-200 flex flex-col">
          <div className="p-4 border-b border-gray-200">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-gray-900">AI Chat</h2>
              <button
                onClick={() => setShowSidebar(false)}
                className="text-gray-500 hover:text-gray-700"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <button
              onClick={startNewConversation}
              className="w-full px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors"
            >
              + Új beszélgetés
            </button>
          </div>

          <div className="flex-1 overflow-y-auto">
            {conversations.length === 0 ? (
              <div className="p-4 text-center text-gray-500 text-sm">
                Nincs korábbi beszélgetés
              </div>
            ) : (
              <div className="p-2">
                {conversations.map((conv) => (
                  <button
                    key={conv.id}
                    onClick={() => loadConversation(conv.id)}
                    className={`w-full text-left p-3 rounded-lg mb-2 transition-colors ${
                      currentConversation?.id === conv.id
                        ? 'bg-primary-50 text-primary-900 border border-primary-200'
                        : 'hover:bg-gray-50 text-gray-700'
                    }`}
                  >
                    <div className="font-medium text-sm truncate">
                      {conv.title || 'Beszélgetés'}
                    </div>
                    <div className="text-xs text-gray-500 mt-1">
                      {new Date(conv.updatedAt).toLocaleDateString('hu-HU')}
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Fő tartalom */}
      <div className="flex-1 flex flex-col">
        {/* Header */}
        <div className="bg-white border-b border-gray-200 p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              {!showSidebar && (
                <button
                  onClick={() => setShowSidebar(true)}
                  className="text-gray-500 hover:text-gray-700"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                  </svg>
                </button>
              )}
              <h1 className="text-xl font-semibold text-gray-900">
                AI Fejlesztési Asszisztens
              </h1>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-sm text-gray-500">
                {currentConversation?.title || 'Új beszélgetés'}
              </span>
            </div>
          </div>
        </div>

        {/* Üzenetek */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {messages.length === 0 && !streaming && (
            <div className="flex items-center justify-center h-full">
              <div className="text-center">
                <div className="text-6xl mb-4">🤖</div>
                <h2 className="text-2xl font-semibold text-gray-900 mb-2">
                  AI Fejlesztési Asszisztens
                </h2>
                <p className="text-gray-600 mb-4">
                  Segítek a fejlesztésben, tesztelésben, hibakeresésben és javításban.
                </p>
                <div className="text-sm text-gray-500 space-y-1">
                  <p>• Kód elemzés és review</p>
                  <p>• Tesztek generálása</p>
                  <p>• Hibakeresés logokból</p>
                  <p>• Automatikus kód írás és javítás</p>
                  <p>• Internetes keresés és információk</p>
                </div>
              </div>
            </div>
          )}

          {messages.map((message) => (
            <div
              key={message.id}
              className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              <div
                className={`max-w-3xl rounded-lg px-4 py-3 ${
                  message.role === 'user'
                    ? 'bg-primary-600 text-white'
                    : 'bg-white border border-gray-200 text-gray-900'
                }`}
              >
                <div className="whitespace-pre-wrap break-words">{message.content}</div>
                <div
                  className={`text-xs mt-2 ${
                    message.role === 'user' ? 'text-primary-100' : 'text-gray-500'
                  }`}
                >
                  {new Date(message.createdAt).toLocaleTimeString('hu-HU')}
                </div>
              </div>
            </div>
          ))}

          {streaming && streamingContent && (
            <div className="flex justify-start">
              <div className="max-w-3xl rounded-lg px-4 py-3 bg-white border border-gray-200 text-gray-900">
                <div className="whitespace-pre-wrap break-words">{streamingContent}</div>
                <div className="inline-block w-2 h-4 bg-primary-600 ml-1 animate-pulse" />
              </div>
            </div>
          )}

          {loading && !streaming && (
            <div className="flex justify-start">
              <div className="max-w-3xl rounded-lg px-4 py-3 bg-white border border-gray-200">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-primary-600 rounded-full animate-bounce" />
                  <div className="w-2 h-2 bg-primary-600 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }} />
                  <div className="w-2 h-2 bg-primary-600 rounded-full animate-bounce" style={{ animationDelay: '0.4s' }} />
                </div>
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Input */}
        <div className="bg-white border-t border-gray-200 p-4">
          <div className="flex items-end gap-2">
            <textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="Írj be egy kérdést vagy kérést... (pl: 'Írj egy új API endpointot', 'Javítsd a lib/error-handler.ts fájlt')"
              className="flex-1 min-h-[60px] max-h-[200px] px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent resize-none text-gray-900 bg-white"
              disabled={loading}
            />
            <div className="flex flex-col gap-2">
              {streaming ? (
                <button
                  onClick={stopGeneration}
                  className="px-6 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
                >
                  Leállítás
                </button>
              ) : (
                <button
                  onClick={() => sendMessage()}
                  disabled={loading || !input.trim()}
                  className="px-6 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  Küldés
                </button>
              )}
              <label className="flex items-center gap-2 text-xs text-gray-600 cursor-pointer">
                <input
                  type="checkbox"
                  checked={useWebSearch}
                  onChange={(e) => setUseWebSearch(e.target.checked)}
                  className="rounded"
                />
                <span>Web keresés</span>
              </label>
            </div>
          </div>
          <div className="mt-2 flex items-center justify-between">
            <div className="text-xs text-gray-500">
              Enter: küldés, Shift+Enter: új sor
            </div>
            <div className="text-xs text-gray-500">
              💡 Próbáld ki: "Írj egy új funkciót..." vagy "Javítsd a hibát..."
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

