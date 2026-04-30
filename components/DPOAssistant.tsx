import React, { useState, useRef, useEffect } from 'react';
import { MessageCircle, X, Send, Bot, User, Loader2, Sparkles } from 'lucide-react';
import { functions } from '../lib/firebase';
import { httpsCallable } from 'https://www.gstatic.com/firebasejs/10.8.0/firebase-functions.js';
import { useAuth } from '../context/AuthContext';

interface Message {
  role: 'user' | 'model';
  text: string;
}

export const DPOAssistant: React.FC = () => {
  const { authState } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const [message, setMessage] = useState('');
  const [messages, setMessages] = useState<Message[]>([
    { role: 'model', text: 'Olá! Sou seu DPO Assistant. Como posso ajudar na adequação LGPD da sua empresa hoje? 🚀' }
  ]);
  const [isLoading, setIsLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!message.trim() || isLoading || !authState.user) return;

    const userMessage = message.trim();
    setMessage('');
    setMessages(prev => [...prev, { role: 'user', text: userMessage }]);
    setIsLoading(true);

    try {
      const consultantFn = httpsCallable(functions, 'consultant');
      
      // Formata o histórico para o formato que o Genkit espera
      const history = messages.map(msg => ({
        role: msg.role === 'model' ? 'model' : 'user',
        content: [{ text: msg.text }]
      }));

      const result = await consultantFn({
        userId: authState.user.id,
        message: userMessage,
        history: history
      });

      const reply = result.data as string;
      setMessages(prev => [...prev, { role: 'model', text: reply }]);
    } catch (error) {
      console.error('Erro no chat:', error);
      setMessages(prev => [...prev, { role: 'model', text: 'Desculpe, tive um problema técnico. Pode tentar novamente?' }]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed bottom-6 right-6 z-[9999] flex flex-col items-end">
      {/* Janela de Chat */}
      {isOpen && (
        <div className="mb-4 w-[350px] md:w-[400px] h-[500px] bg-[var(--surface)]/90 backdrop-blur-xl rounded-[2.5rem] border border-white/20 shadow-2xl flex flex-col overflow-hidden chat-window-animation">
          {/* Header */}
          <div className="p-6 bg-slate-900 text-white flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-600 rounded-xl">
                <Bot className="h-5 w-5" />
              </div>
              <div>
                <h3 className="font-bold text-sm">DPO Assistant</h3>
                <div className="flex items-center gap-1.5">
                  <span className="h-1.5 w-1.5 bg-green-500 rounded-full animate-pulse" />
                  <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Online</span>
                </div>
              </div>
            </div>
            <button onClick={() => setIsOpen(false)} className="p-2 hover:bg-[var(--surface)]/10 rounded-lg transition-colors">
              <X className="h-5 w-5" />
            </button>
          </div>

          {/* Messages Area */}
          <div ref={scrollRef} className="flex-1 overflow-y-auto p-6 space-y-4 scroll-smooth bg-[var(--surface-muted)]/50">
            {messages.map((msg, idx) => (
              <div key={idx} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                <div className={`max-w-[85%] p-4 rounded-2xl text-sm leading-relaxed ${
                  msg.role === 'user' 
                    ? 'bg-blue-600 text-white rounded-tr-none' 
                    : 'bg-[var(--surface)] border border-[var(--border)] text-slate-700 shadow-[var(--shadow)] rounded-tl-none'
                }`}>
                  {msg.text}
                </div>
              </div>
            ))}
            {isLoading && (
              <div className="flex justify-start">
                <div className="bg-[var(--surface)] border border-[var(--border)] p-4 rounded-2xl rounded-tl-none shadow-[var(--shadow)] flex items-center gap-2 text-slate-400 text-xs font-bold">
                  <Loader2 className="h-3 w-3 animate-spin" />
                  Analisando conformidade...
                </div>
              </div>
            )}
          </div>

          {/* Input Area */}
          <form onSubmit={handleSendMessage} className="p-4 bg-[var(--surface)] border-t border-[var(--border)] flex gap-2">
            <input
              type="text"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Pergunte sobre sua adequação..."
              className="flex-1 bg-[var(--surface-muted)] border-none rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-blue-600 outline-none transition-all"
            />
            <button 
              disabled={isLoading || !message.trim()}
              className="p-3 bg-blue-600 text-white rounded-xl hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-lg"
            >
              <Send className="h-5 w-5" />
            </button>
          </form>
        </div>
      )}

      {/* Botão Flutuante */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`p-4 rounded-2xl shadow-2xl flex items-center gap-3 transition-all duration-500 group ${
          isOpen ? 'bg-slate-900 rotate-90' : 'bg-blue-600 hover:scale-105 active:scale-95'
        }`}
      >
        {isOpen ? (
          <X className="h-6 w-6 text-white" />
        ) : (
          <>
            <div className="relative">
              <MessageCircle className="h-6 w-6 text-white" />
              <div className="absolute -top-1 -right-1 h-3 w-3 bg-red-500 border-2 border-blue-600 rounded-full" />
            </div>
            <span className="text-white font-bold text-xs pr-2">Falar com DPO</span>
          </>
        )}
      </button>
    </div>
  );
};
