'use client';

import { useState, useRef, useEffect } from 'react';
import { toast } from 'react-hot-toast';
import { Toaster } from 'react-hot-toast';

type Message = {
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
};

export default function Home() {
  const [query, setQuery] = useState('');
  const [isFocused, setIsFocused] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    const userMessage = query.trim();
    if (!userMessage || isLoading) return;

    // Add user message to chat
    const newUserMessage: Message = {
      role: 'user',
      content: userMessage,
      timestamp: new Date()
    };
    
    setMessages(prev => [...prev, newUserMessage]);
    setQuery('');
    setIsLoading(true);
    
    try {
      const response = await fetch('/api/agent', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ query: userMessage }),
      });

      if (!response.ok) {
        throw new Error('No se pudo obtener respuesta del agente');
      }

      const data = await response.json();
      
      // Add assistant's response to chat
      const assistantMessage: Message = {
        role: 'assistant',
        content: data.message,
        timestamp: new Date()
      };
      
      setMessages(prev => [...prev, assistantMessage]);
      
    } catch (error) {
      console.error('Error calling agent:', error);
      toast.error('Error al obtener respuesta del asistente');
    } finally {
      setIsLoading(false);
    }
  };
  
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);
  
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-800 via-slate-900 to-gray-900 flex flex-col p-4">
      <Toaster position="top-center" />
      <div className="w-full max-w-2xl mx-auto flex-1 flex flex-col">
        <h1 className="text-4xl font-bold text-white text-center my-8">
          Asistente Poderoso
        </h1>
        
        {/* Chat messages */}
        <div className="flex-1 overflow-y-auto mb-6 space-y-4">
          {messages.length === 0 ? (
            <div className="text-center text-slate-400 mt-12">
              <p className="text-lg">¡Hola! ¿En qué puedo ayudarte hoy?</p>
            </div>
          ) : (
            messages.map((message, index) => (
              <div 
                key={index} 
                className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                <div 
                  className={`max-w-[80%] rounded-lg p-4 ${
                    message.role === 'user' 
                      ? 'bg-blue-600 text-white' 
                      : 'bg-slate-700 text-slate-100'
                  }`}
                >
                  <div className="whitespace-pre-wrap">{message.content}</div>
                  <div className={`text-xs mt-1 ${
                    message.role === 'user' ? 'text-blue-200' : 'text-slate-400'
                  }`}>
                    {message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </div>
                </div>
              </div>
            ))
          )}
          <div ref={messagesEndRef} />
        </div>
        
        {/* Input area */}
        <div className={`relative group transition-all duration-200 ${isFocused ? 'scale-[1.01]' : ''} mb-6`}>
          <div className={`absolute -inset-0.5 bg-gradient-to-r from-slate-600 to-slate-800 rounded-xl opacity-75 group-hover:opacity-100 transition-all duration-300 ${isFocused ? 'opacity-100 blur-sm' : 'blur-[1px]'}`}></div>
          <div className="relative bg-slate-800/80 backdrop-blur-sm rounded-xl overflow-hidden">
            <form onSubmit={handleSearch} className="flex items-stretch">
              <div className="flex-1 flex items-center">
                <input
                  type="text"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  onFocus={() => setIsFocused(true)}
                  onBlur={() => setIsFocused(false)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                      e.preventDefault();
                      handleSearch(e);
                    }
                  }}
                  placeholder="Escribe tu mensaje aquí..."
                  className="w-full bg-transparent border-0 text-slate-100 placeholder-slate-500 focus:ring-0 text-lg py-5 px-6 outline-none"
                  disabled={isLoading}
                  aria-label="Mensaje"
                />
              </div>
              <button 
                type="submit"
                className={`${
                  isLoading || !query.trim()
                    ? 'bg-slate-700 cursor-not-allowed text-slate-500'
                    : 'bg-blue-600 hover:bg-blue-700 text-white'
                } font-medium px-6 transition-all duration-200 flex items-center justify-center`}
                disabled={isLoading || !query.trim()}
              >
                {isLoading ? (
                  <span className="flex items-center">
                    <svg className="animate-spin h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                  </span>
                ) : (
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-8.707l-3-3a1 1 0 00-1.414 1.414L10.586 9H7a1 1 0 100 2h3.586l-1.293 1.293a1 1 0 101.414 1.414l3-3a1 1 0 000-1.414z" clipRule="evenodd" />
                  </svg>
                )}
              </button>
            </form>
          </div>
        </div>
        
        <p className="text-center text-slate-500 text-sm mb-4">
          Presiona Enter para enviar • Pregúntame cualquier cosa en español
        </p>
      </div>
    </div>
  );
}
