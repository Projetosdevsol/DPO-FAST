import React, { useState, useRef, useEffect, useCallback } from 'react';
import { MessageCircle, X, Send, Bot, Loader2, GripHorizontal, Minus, Maximize2, Minimize2 } from 'lucide-react';
import { functions } from '../lib/firebase';
import { httpsCallable } from 'firebase/functions';
import { useAuth } from '../context/AuthContext';

interface Message {
  role: 'user' | 'model';
  text: string;
}

const POS_KEY = 'dpo-chat-pos';
const QUICK_PROMPTS = [
  'Como preencher o BYOD?',
  'Explicar legítimo interesse',
  'Gerar cláusula RH',
];

/** Renderiza markdown-lite (bold, listas, código) com escape de HTML. */
function renderMarkdown(text: string): string {
  const esc = text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
  const withCodeBlocks: string[] = [];
  const withoutBlocks = esc.replace(/```([\s\S]*?)```/g, (_, code) => {
    withCodeBlocks.push(`<pre class="mt-2 overflow-x-auto rounded-lg bg-slate-900 p-3 text-xs text-slate-100"><code>${code.trim()}</code></pre>`);
    return `\u0000${withCodeBlocks.length - 1}\u0000`;
  });
  const lines = withoutBlocks.split('\n');
  const html: string[] = [];
  let inList = false;
  for (const line of lines) {
    const trimmed = line.trim();
    const listMatch = /^[-*]\s+(.*)/.exec(trimmed);
    const numberedMatch = /^\d+\.\s+(.*)/.exec(trimmed);
    const content = listMatch?.[1] ?? numberedMatch?.[1];
    if (content !== undefined) {
      if (!inList) { html.push('<ul class="list-disc pl-5 space-y-1">'); inList = true; }
      html.push(`<li>${inlineFmt(content)}</li>`);
    } else {
      if (inList) { html.push('</ul>'); inList = false; }
      if (trimmed === '') html.push('<div class="h-2" />');
      else if (trimmed.startsWith('\u0000')) html.push(trimmed);
      else html.push(`<p>${inlineFmt(line)}</p>`);
    }
  }
  if (inList) html.push('</ul>');
  return html.join('').replace(/\u0000(\d+)\u0000/g, (_, i) => withCodeBlocks[Number(i)]);
}

function inlineFmt(s: string): string {
  return s
    .replace(/`([^`]+)`/g, '<code class="rounded bg-slate-900/10 px-1 text-[13px]">$1</code>')
    .replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>');
}

export const DPOAssistant: React.FC = () => {
  const { authState } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const [minimized, setMinimized] = useState(false);
  const [expanded, setExpanded] = useState(false);
  const [message, setMessage] = useState('');
  const [messages, setMessages] = useState<Message[]>([
    { role: 'model', text: 'Olá! Sou seu DPO Assistant. Como posso ajudar na adequação LGPD da sua empresa hoje? 🚀' }
  ]);
  const [isLoading, setIsLoading] = useState(false);
  const [pos, setPos] = useState<{ x: number; y: number } | null>(null);
  const [dragging, setDragging] = useState(false);
  const [autoScroll, setAutoScroll] = useState(true);
  const scrollRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const dragRef = useRef<{ startX: number; startY: number; baseX: number; baseY: number; left: number; top: number; width: number; height: number } | null>(null);
  const windowRef = useRef<HTMLDivElement>(null);

  // Restaura posição salva
  useEffect(() => {
    try {
      const raw = localStorage.getItem(POS_KEY);
      if (raw) setPos(JSON.parse(raw));
    } catch { /* sem posição salva */ }
  }, []);

  // Smart auto-scroll: só rola se o usuário estiver no fim
  useEffect(() => {
    const el = scrollRef.current;
    if (el && autoScroll) el.scrollTop = el.scrollHeight;
  }, [messages, isLoading, autoScroll, isOpen]);

  const handleScroll = useCallback(() => {
    const el = scrollRef.current;
    if (!el) return;
    const nearBottom = el.scrollHeight - el.scrollTop - el.clientHeight < 60;
    setAutoScroll(nearBottom);
  }, []);

  // Textarea auto-resize
  useEffect(() => {
    const ta = textareaRef.current;
    if (!ta) return;
    ta.style.height = 'auto';
    ta.style.height = `${Math.min(ta.scrollHeight, 120)}px`;
  }, [message, isOpen]);

  const isDesktopDrag = useCallback(() => window.matchMedia('(min-width: 768px)').matches, []);

  const onDragStart = (e: React.PointerEvent) => {
    if (!isDesktopDrag() || e.button !== 0) return;
    const win = windowRef.current;
    if (!win) return;
    // getBoundingClientRect já inclui o transform atual
    const rect = win.getBoundingClientRect();
    dragRef.current = {
      startX: e.clientX,
      startY: e.clientY,
      baseX: (pos ?? { x: 0, y: 0 }).x,
      baseY: (pos ?? { x: 0, y: 0 }).y,
      left: rect.left,
      top: rect.top,
      width: rect.width,
      height: rect.height,
    };
    setDragging(true);
  };

  const onDragMove = (e: React.PointerEvent) => {
    const d = dragRef.current;
    if (!d) return;
    const dx = e.clientX - d.startX;
    const dy = e.clientY - d.startY;
    // Mantém ≥80px da janela sempre visível dentro da viewport
    const minVisible = 80;
    const minX = minVisible - (d.left + d.width);
    const maxX = window.innerWidth - minVisible - d.left;
    const minY = minVisible - (d.top + d.height);
    const maxY = window.innerHeight - minVisible - d.top;
    setPos({
      x: Math.min(maxX, Math.max(minX, d.baseX + dx)),
      y: Math.min(maxY, Math.max(minY, d.baseY + dy)),
    });
  };

  const onDragEnd = () => {
    if (!dragRef.current) return;
    dragRef.current = null;
    setDragging(false);
    setPos((p) => {
      if (p) {
        try { localStorage.setItem(POS_KEY, JSON.stringify(p)); } catch { /* storage indisponível */ }
      }
      return p;
    });
  };

  const sendMessage = async (text: string) => {
    const userMessage = text.trim();
    if (!userMessage || isLoading || !authState.user) return;
    setMessage('');
    setMessages(prev => [...prev, { role: 'user', text: userMessage }]);
    setAutoScroll(true);
    setIsLoading(true);

    try {
      const consultantFn = httpsCallable(functions, 'consultant');
      const history = [...messages, { role: 'user', text: userMessage }].map(msg => ({
        role: msg.role === 'model' ? 'model' : 'user',
        content: [{ text: msg.text }]
      }));

      const result = await consultantFn({
        userId: authState.user.id,
        message: userMessage,
        history: history.slice(0, -1)
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

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    void sendMessage(message);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      void sendMessage(message);
    }
  };

  const toggleOpen = () => {
    setIsOpen(v => !v);
    setMinimized(false);
  };

  return (
    <div className="fixed bottom-4 right-4 sm:bottom-6 sm:right-6 z-[9999] flex flex-col items-end">
      {isOpen && (
        <div
          ref={windowRef}
          style={pos ? { transform: `translate(${pos.x}px, ${pos.y}px)` } : undefined}
          className={[
            'mb-3 sm:mb-4 flex flex-col overflow-hidden bg-[var(--surface)]/95 backdrop-blur-xl border border-white/20 shadow-2xl',
            // Mobile: bottom-sheet fullscreen; Desktop: widget arrastável
            'w-[calc(100vw-2rem)] h-[70vh] rounded-[1.5rem]',
            'md:w-[400px] md:h-[550px] md:rounded-[2rem]',
            expanded ? 'md:w-[560px] md:h-[680px]' : '',
            minimized ? 'h-auto' : '',
            'transition-[width,height] duration-300',
          ].join(' ')}
        >
          {/* Header = Drag Handle (desktop) */}
          <div
            onPointerDown={onDragStart}
            onPointerMove={onDragMove}
            onPointerUp={onDragEnd}
            onPointerCancel={onDragEnd}
            className="p-4 sm:p-5 bg-slate-900 text-white flex items-center justify-between gap-2 shrink-0 select-none md:cursor-grab md:active:cursor-grabbing touch-none md:touch-none"
          >
            <div className="flex items-center gap-3 min-w-0">
              <GripHorizontal className="hidden md:block h-4 w-4 text-slate-500 shrink-0" />
              <div className="p-2 bg-blue-600 rounded-xl shrink-0">
                <Bot className="h-5 w-5" />
              </div>
              <div className="min-w-0">
                <h3 className="font-bold text-sm truncate">DPO Assistant</h3>
                <div className="flex items-center gap-1.5">
                  <span className="h-1.5 w-1.5 bg-green-500 rounded-full animate-pulse" />
                  <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider truncate">DPO Assistente Online</span>
                </div>
              </div>
            </div>
            <div className="flex items-center gap-1 shrink-0">
              <button onClick={() => setMinimized(v => !v)} aria-label="Minimizar" className="p-2 min-h-[44px] min-w-[44px] flex items-center justify-center hover:bg-white/10 rounded-lg transition-colors">
                <Minus className="h-4 w-4" />
              </button>
              <button onClick={() => setExpanded(v => !v)} aria-label="Expandir" className="hidden md:flex p-2 min-h-[44px] min-w-[44px] items-center justify-center hover:bg-white/10 rounded-lg transition-colors">
                {expanded ? <Minimize2 className="h-4 w-4" /> : <Maximize2 className="h-4 w-4" />}
              </button>
              <button onClick={() => setIsOpen(false)} aria-label="Fechar" className="p-2 min-h-[44px] min-w-[44px] flex items-center justify-center hover:bg-white/10 rounded-lg transition-colors">
                <X className="h-5 w-5" />
              </button>
            </div>
          </div>
          {dragging && <div className="h-0.5 bg-blue-500/60" />}

          {!minimized && (
            <>
              {/* Messages */}
              <div ref={scrollRef} onScroll={handleScroll} className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-4 scroll-smooth bg-[var(--surface-muted)]/50">
                {messages.map((msg, idx) => (
                  <div key={idx} className={`flex items-end gap-2 ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                    {msg.role === 'model' && (
                      <div className="p-1.5 bg-blue-600 rounded-lg shrink-0 self-start">
                        <Bot className="h-3.5 w-3.5 text-white" />
                      </div>
                    )}
                    <div className={`max-w-[85%] p-3 sm:p-4 rounded-2xl text-sm leading-relaxed break-words ${
                      msg.role === 'user'
                        ? 'bg-blue-600 text-white rounded-tr-none'
                        : 'bg-[var(--surface)] border border-[var(--border)] text-slate-700 shadow-[var(--shadow)] rounded-tl-none'
                    }`}>
                      {msg.role === 'model'
                        ? <div dangerouslySetInnerHTML={{ __html: renderMarkdown(msg.text) }} />
                        : msg.text}
                    </div>
                  </div>
                ))}
                {isLoading && (
                  <div className="flex items-end gap-2 justify-start">
                    <div className="p-1.5 bg-blue-600 rounded-lg shrink-0">
                      <Bot className="h-3.5 w-3.5 text-white" />
                    </div>
                    <div className="bg-[var(--surface)] border border-[var(--border)] px-4 py-3 rounded-2xl rounded-tl-none shadow-[var(--shadow)] flex items-center gap-1.5" aria-label="Digitando">
                      <span className="h-2 w-2 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                      <span className="h-2 w-2 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                      <span className="h-2 w-2 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                    </div>
                  </div>
                )}
                {!autoScroll && (
                  <button
                    onClick={() => { setAutoScroll(true); scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' }); }}
                    className="sticky bottom-2 mx-auto block px-4 py-2 min-h-[44px] bg-slate-900 text-white text-xs font-bold rounded-full shadow-lg"
                  >
                    ↓ Voltar ao fim
                  </button>
                )}
              </div>

              {/* Quick prompts */}
              {messages.length <= 1 && !isLoading && (
                <div className="px-4 sm:px-5 pt-3 flex gap-2 overflow-x-auto bg-[var(--surface-muted)]/50">
                  {QUICK_PROMPTS.map(q => (
                    <button
                      key={q}
                      onClick={() => void sendMessage(q)}
                      className="shrink-0 px-3 py-2 min-h-[44px] text-xs font-bold text-blue-700 bg-blue-50 border border-blue-200 rounded-full hover:bg-blue-100 transition-colors"
                    >
                      {q}
                    </button>
                  ))}
                </div>
              )}

              {/* Input */}
              <form onSubmit={handleSubmit} className="p-3 sm:p-4 bg-[var(--surface)] border-t border-[var(--border)] flex items-end gap-2">
                <textarea
                  ref={textareaRef}
                  rows={1}
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder="Pergunte sobre sua adequação..."
                  className="flex-1 bg-[var(--surface-muted)] border-none rounded-xl px-4 py-3 text-base md:text-sm focus:ring-2 focus:ring-blue-600 outline-none transition-all resize-none max-h-[120px]"
                />
                <button
                  type="submit"
                  disabled={isLoading || !message.trim()}
                  aria-label="Enviar"
                  className="p-3 min-h-[44px] min-w-[44px] flex items-center justify-center bg-blue-600 text-white rounded-xl hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-lg shrink-0"
                >
                  {isLoading ? <Loader2 className="h-5 w-5 animate-spin" /> : <Send className="h-5 w-5" />}
                </button>
              </form>
            </>
          )}
        </div>
      )}

      {/* Botão Flutuante */}
      <button
        onClick={toggleOpen}
        aria-label={isOpen ? 'Fechar chat' : 'Abrir chat'}
        className={`p-4 min-h-[44px] rounded-2xl shadow-2xl flex items-center gap-3 transition-all duration-300 group ${
          isOpen ? 'bg-slate-900' : 'bg-blue-600 hover:scale-105 active:scale-95'
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
            <span className="text-white font-bold text-xs pr-2 hidden sm:inline">Falar com DPO</span>
          </>
        )}
      </button>
    </div>
  );
};
