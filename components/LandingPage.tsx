import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { 
  ShieldCheck, 
  CheckCircle2, 
  FileText, 
  Clock, 
  Zap, 
  ChevronRight, 
  AlertTriangle,
  Lock,
  ArrowRight,
  ClipboardCheck,
  ChevronDown,
  ChevronUp,
  Building,
  Store,
  Briefcase,
  Users,
  Search,
  Scale,
  Sparkles,
  Layout,
  MessageSquare,
  Activity,
  Calendar,
  Layers,
  MousePointer2
} from 'lucide-react';
import { Pricing } from './Pricing';
import { Logo } from './Logo';
import { ThemeToggle } from './ThemeToggle';

const InterfaceCarousel: React.FC = () => {
  const [activeSlide, setActiveSlide] = useState(0);

  const slides = [
    {
      id: 'dashboard',
      title: 'Dashboard Estratégico',
      desc: 'Visualize sua conformidade em tempo real com métricas precisas.',
      icon: Activity,
      color: 'blue'
    },
    {
      id: 'compliance',
      title: 'Cronograma Progressivo',
      desc: 'Gestão de prazos e tarefas em um calendário inteligente.',
      icon: Calendar,
      color: 'indigo'
    },
    {
      id: 'docs',
      title: 'Dossiê Automatizado',
      desc: 'Geração de documentos legais com apenas alguns cliques.',
      icon: FileText,
      color: 'cyan'
    }
  ];

  useEffect(() => {
    const timer = setInterval(() => {
      setActiveSlide((prev) => (prev + 1) % slides.length);
    }, 5000);
    return () => clearInterval(timer);
  }, [slides.length]);

  return (
    <div className="mt-32 relative max-w-5xl mx-auto space-y-8 animate-in fade-in duration-1000 delay-500">
      <div className="flex justify-center gap-2 mb-8">
        {slides.map((_, i) => (
          <button 
            key={i}
            onClick={() => setActiveSlide(i)}
            className={`h-1 transition-all duration-500 rounded-full ${activeSlide === i ? 'w-12 bg-blue-600' : 'w-4 bg-slate-200'}`}
          />
        ))}
      </div>

      <div className="relative border border-[var(--border)] rounded-[3rem] bg-[var(--surface-muted)] overflow-hidden aspect-[16/8] shadow-2xl shadow-black/[0.02] group">
        {/* Simulação de Interface Dashboard */}
        <div className={`absolute inset-0 transition-opacity duration-700 ${activeSlide === 0 ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}>
           <div className="p-10 h-full flex flex-col gap-8">
              <div className="flex items-center justify-between">
                 <div className="flex items-center gap-4">
                    <div className="h-10 w-10 bg-blue-600 rounded-xl flex items-center justify-center text-white"><Activity className="h-5 w-5" /></div>
                    <div className="h-4 w-32 bg-slate-200 rounded-full"></div>
                 </div>
                 <div className="flex gap-2">
                    <div className="h-8 w-8 bg-slate-100 rounded-lg"></div>
                    <div className="h-8 w-8 bg-slate-100 rounded-lg"></div>
                 </div>
              </div>
              <div className="grid grid-cols-3 gap-6 flex-1">
                 <div className="bg-white rounded-3xl border border-slate-100 p-6 flex flex-col justify-between shadow-sm">
                    <div className="h-3 w-12 bg-blue-50 rounded-full"></div>
                    <div className="flex items-end gap-2">
                       <span className="text-3xl font-black text-slate-900">82%</span>
                       <span className="text-[10px] font-bold text-green-500 mb-1">+12%</span>
                    </div>
                 </div>
                 <div className="bg-white rounded-3xl border border-slate-100 p-6 flex flex-col justify-between">
                    <div className="h-3 w-16 bg-indigo-50 rounded-full"></div>
                    <div className="h-10 w-full bg-slate-50 rounded-xl"></div>
                 </div>
                 <div className="bg-slate-900 rounded-3xl p-6 flex flex-col justify-between shadow-xl">
                    <Sparkles className="h-6 w-6 text-blue-400" />
                    <div className="space-y-2">
                       <div className="h-2 w-full bg-white/20 rounded-full"></div>
                       <div className="h-2 w-2/3 bg-white/10 rounded-full"></div>
                    </div>
                 </div>
              </div>
              <div className="h-24 bg-white rounded-3xl border border-slate-100 p-6 flex items-center justify-between">
                 <div className="flex items-center gap-4">
                    <div className="h-12 w-12 bg-slate-100 rounded-2xl"></div>
                    <div className="space-y-2">
                       <div className="h-3 w-40 bg-slate-200 rounded-full"></div>
                       <div className="h-2 w-24 bg-slate-100 rounded-full"></div>
                    </div>
                 </div>
                 <div className="h-10 px-6 bg-blue-600 rounded-xl"></div>
              </div>
           </div>
        </div>

        {/* Simulação de Interface Calendário */}
        <div className={`absolute inset-0 transition-opacity duration-700 ${activeSlide === 1 ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}>
           <div className="p-10 h-full flex flex-col">
              <div className="flex items-center gap-4 mb-10">
                 <div className="h-4 w-40 bg-slate-200 rounded-full"></div>
                 <div className="h-4 w-4 bg-slate-100 rounded-full"></div>
              </div>
              <div className="grid grid-cols-7 gap-4 flex-1">
                 {[...Array(14)].map((_, i) => (
                   <div key={i} className="bg-white rounded-2xl border border-slate-100 p-4 relative group/day">
                      <span className="text-[10px] font-black text-slate-300">{i + 1}</span>
                      {i === 4 && <div className="absolute inset-x-2 bottom-2 h-4 bg-blue-600 rounded-lg shadow-lg"></div>}
                      {i === 8 && <div className="absolute inset-x-2 bottom-2 h-4 bg-red-100 rounded-lg"></div>}
                      {i === 11 && <div className="absolute inset-x-2 bottom-2 h-4 bg-green-100 rounded-lg"></div>}
                   </div>
                 ))}
              </div>
           </div>
        </div>

        {/* Simulação de Interface Documentos */}
        <div className={`absolute inset-0 transition-opacity duration-700 ${activeSlide === 2 ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}>
           <div className="p-10 h-full flex gap-10">
              <div className="w-1/3 space-y-4">
                 {[...Array(4)].map((_, i) => (
                   <div key={i} className={`p-4 rounded-2xl border transition-all ${i === 0 ? 'bg-white border-blue-200 shadow-lg' : 'bg-transparent border-slate-100'}`}>
                      <div className="h-2 w-20 bg-slate-200 rounded-full mb-2"></div>
                      <div className="h-1.5 w-full bg-slate-100 rounded-full"></div>
                   </div>
                 ))}
              </div>
              <div className="flex-1 bg-white rounded-[2rem] border border-slate-100 p-8 shadow-2xl relative">
                 <div className="space-y-6">
                    <div className="h-4 w-32 bg-slate-200 rounded-full mx-auto mb-10"></div>
                    <div className="space-y-3">
                       {[...Array(8)].map((_, i) => (
                         <div key={i} className="h-2 w-full bg-slate-50 rounded-full" style={{ width: `${100 - (i * 3)}%` }}></div>
                       ))}
                    </div>
                    <div className="pt-10 flex justify-end gap-3">
                       <div className="h-10 w-24 bg-slate-100 rounded-xl"></div>
                       <div className="h-10 w-32 bg-blue-600 rounded-xl"></div>
                    </div>
                 </div>
                 <div className="absolute top-4 right-4"><Zap className="h-5 w-5 text-amber-500" /></div>
              </div>
           </div>
        </div>

        {/* Overlay Hover para Lead Capture */}
        <div className="absolute inset-0 bg-blue-600/0 hover:bg-blue-600/5 transition-all flex items-center justify-center group/overlay cursor-pointer">
           <div className="p-4 bg-white rounded-full shadow-2xl scale-0 group-hover/overlay:scale-100 transition-all duration-300">
              <MousePointer2 className="h-6 w-6 text-blue-600" />
           </div>
        </div>
      </div>

      {/* Info do Slide Atual */}
      <div className="flex flex-col md:flex-row items-center justify-between gap-8 pt-8">
        <div className="space-y-2 text-center md:text-left transition-all duration-500">
           <h3 className="text-2xl font-black text-[var(--text-primary)] tracking-tighter uppercase">{slides[activeSlide].title}</h3>
           <p className="text-slate-500 font-medium">{slides[activeSlide].desc}</p>
        </div>
        <Link to="/register" className="group flex items-center gap-4 bg-[var(--surface)] px-10 py-5 rounded-2xl border border-[var(--border)] hover:border-blue-600 transition-all shadow-xl shadow-black/5 hover:-translate-y-1">
           <span className="text-[10px] font-black uppercase tracking-widest text-[var(--text-primary)]">Testar Gratuitamente</span>
           <div className="p-2 bg-blue-600 rounded-xl text-white group-hover:px-4 transition-all">
              <ArrowRight className="h-4 w-4" />
           </div>
        </Link>
      </div>
    </div>
  );
};

const FAQItem: React.FC<{ question: string; answer: string }> = ({ question, answer }) => {
  const [isOpen, setIsOpen] = useState(false);
  return (
    <div className="border-b border-[var(--border)] last:border-0 group">
      <button 
        onClick={() => setIsOpen(!isOpen)}
        className="w-full py-7 flex items-center justify-between text-left focus:outline-none transition-all"
      >
        <span className={`text-base font-medium transition-all ${isOpen ? 'text-[var(--text-primary)]' : 'text-slate-500 group-hover:text-[var(--text-primary)]'}`}>{question}</span>
        <div className={`transition-transform duration-300 ${isOpen ? 'rotate-180 text-blue-500' : 'text-slate-600'}`}>
          <ChevronDown className="h-4 w-4" />
        </div>
      </button>
      {isOpen && (
        <div className="pb-7 animate-in fade-in duration-700">
          <p className="text-slate-500 leading-relaxed max-w-2xl text-sm">{answer}</p>
        </div>
      )}
    </div>
  );
};

export const LandingPage: React.FC = () => {
  const navigate = useNavigate();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const features = [
    {
      title: "Diagnóstico",
      desc: "Mapeamento simplificado por áreas estratégicas.",
      icon: Layout
    },
    {
      title: "Inteligência Legal",
      desc: "Sugestões automáticas baseadas em IA.",
      icon: Sparkles
    },
    {
      title: "Privacidade",
      desc: "Gestão centralizada de direitos dos titulares.",
      icon: MessageSquare
    },
    {
      title: "Documentação",
      desc: "Geração instantânea de RAT e Avisos.",
      icon: FileText
    }
  ];

  return (
    <div className="min-h-screen bg-[var(--background)] text-slate-500 selection:bg-blue-500/30 selection:text-white">
      {/* Background Glows Removed strictly as requested */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        {/* No blue squares/glows here anymore */}
      </div>

      {/* Navbar */}
      <nav className="fixed top-0 left-0 right-0 z-[100] py-6 md:py-10 transition-all bg-[var(--background)] md:bg-transparent backdrop-blur-md md:backdrop-blur-none border-b border-[var(--border)] md:border-0">
        <div className="max-w-6xl mx-auto px-6 flex items-center justify-between">
          <div className="flex items-center gap-4">
             <Logo className="h-8 md:h-10 w-auto" />
             <span className="font-bold text-xl md:text-2xl text-[var(--text-primary)] tracking-tighter">LGPD Fácil</span>
          </div>
          
          <div className="flex items-center gap-4 md:hidden">
             <ThemeToggle />
             <button onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)} className="p-2 text-[var(--text-primary)]">
                {isMobileMenuOpen ? <X className="h-6 w-6" /> : <div className="space-y-1.5"><div className="h-0.5 w-6 bg-current" /><div className="h-0.5 w-6 bg-current" /></div>}
             </button>
          </div>

          <div className="hidden md:flex items-center gap-12 text-[10px] font-black uppercase tracking-[0.2em] text-slate-500/60 transition-colors">
            <a href="#recursos" className="hover:text-[var(--text-primary)] transition-colors">Funcionalidades</a>
            <a href="#planos" className="hover:text-[var(--text-primary)] transition-colors">Planos</a>
            <Link to="/login" className="hover:text-[var(--text-primary)] transition-colors">Entrar</Link>
            <ThemeToggle />
            <Link to="/register" className="px-6 py-2 border border-[var(--border)] rounded-full text-[var(--text-primary)] hover:bg-[var(--text-primary)] hover:text-[var(--background)] transition-all">
              Começar
            </Link>
          </div>
        </div>

        {/* Mobile Menu Overlay */}
        {isMobileMenuOpen && (
          <div className="fixed inset-0 top-[73px] bg-[var(--background)] z-[90] md:hidden animate-in fade-in slide-in-from-top-4 duration-300 p-8 flex flex-col gap-10">
            <div className="flex flex-col gap-8 text-sm font-black uppercase tracking-widest text-[var(--text-primary)]">
               <a href="#recursos" onClick={() => setIsMobileMenuOpen(false)}>Funcionalidades</a>
               <a href="#planos" onClick={() => setIsMobileMenuOpen(false)}>Planos</a>
               <Link to="/login" onClick={() => setIsMobileMenuOpen(false)}>Entrar</Link>
            </div>
            <Link to="/register" onClick={() => setIsMobileMenuOpen(false)} className="w-full py-5 bg-blue-600 text-white rounded-2xl flex items-center justify-center gap-3 always-white">
               Testar Agora <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        )}
      </nav>

      {/* Hero Section */}
      <section className="relative pt-64 pb-32 px-6">
        <div className="max-w-4xl mx-auto text-center space-y-12">
          <div className="space-y-6">
            <h1 className="text-5xl md:text-7xl font-black text-[var(--text-primary)] leading-[1.1] tracking-tight animate-in fade-in slide-in-from-bottom-4 duration-1000">
              Conformidade digital <br />
              <span className="text-slate-500/50 italic font-medium">sem complexidade.</span>
            </h1>
            <p className="text-lg md:text-xl text-slate-500 max-w-2xl mx-auto leading-relaxed font-light animate-in fade-in slide-in-from-bottom-4 delay-200 duration-1000">
              Uma abordagem minimalista para gerir a privacidade da sua empresa com inteligência e segurança comprovada.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-6 pt-4 animate-in fade-in slide-in-from-bottom-4 delay-500 duration-1000">
            <Link to="/register" className="btn-primary px-10 py-5 rounded-2xl shadow-blue-500/20 shadow-2xl always-white">
              Iniciar Diagnóstico Grátis
            </Link>
            <a href="#recursos" className="text-[10px] font-black uppercase tracking-widest text-slate-500 hover:text-[var(--text-primary)] transition-colors bg-[var(--surface-muted)] px-8 py-5 rounded-2xl border border-[var(--border)]">
              Explorar Recursos
            </a>
          </div>

          {/* Interactive Interface Carousel */}
          <InterfaceCarousel />
        </div>
      </section>

      {/* Features - Grid Refinado */}
      <section id="recursos" className="py-48 px-6">
        <div className="max-w-6xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-12 md:gap-8">
            {features.map((f, i) => (
              <div key={i} className="space-y-6 group">
                <div className="p-4 bg-[var(--surface-muted)] border border-[var(--border)] rounded-2xl w-fit group-hover:bg-blue-600 transition-all duration-500 group-hover:shadow-xl group-hover:shadow-blue-600/20 group-hover:-translate-y-1">
                  <f.icon className="h-5 w-5 text-slate-500 group-hover:text-white" />
                </div>
                <div className="space-y-2">
                  <h4 className="text-[var(--text-primary)] font-bold text-base tracking-tight">{f.title}</h4>
                  <p className="text-sm text-slate-500 leading-relaxed font-light">{f.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section id="planos" className="relative py-20 overflow-hidden bg-[var(--surface-muted)] border-y border-[var(--border)]">
        <Pricing isLandingPage={true} />
      </section>

      {/* FAQ Section */}
      <section className="py-48 px-6">
        <div className="max-w-3xl mx-auto">
          <div className="space-y-2 mb-16">
             <h2 className="text-3xl font-black text-[var(--text-primary)] tracking-tight uppercase tracking-widest">Questões Comuns</h2>
             <p className="text-slate-500 font-medium italic">Respostas rápidas para sua jornada inicial.</p>
          </div>
          
          <div className="space-y-2">
             <FAQItem 
               question="Como funciona o diagnóstico automatizado?" 
               answer="Nossa ferramenta guia você por uma série de perguntas estruturadas sobre o tratamento de dados em cada área da empresa, gerando a documentação necessária baseada nas suas respostas em segundos." 
             />
             <FAQItem 
               question="Meus dados estão seguros na nuvem?" 
               answer="Sim. Utilizamos criptografia padrão bancário AES-256 e TLS 1.3 em toda a plataforma. Seus dados nunca são compartilhados ou vendidos, permanecendo sob sua total custódia." 
             />
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-24 px-6 border-t border-[var(--border)]">
        <div className="max-w-6xl mx-auto flex flex-col md:flex-row justify-between items-center gap-12">
          <div className="flex items-center gap-2">
             <Logo className="h-5 w-auto" />
             <span className="font-bold text-[var(--text-primary)] tracking-tighter">LGPD Fácil</span>
          </div>
          
          <div className="flex gap-10 text-[10px] font-bold uppercase tracking-widest text-slate-400">
             <a href="#" className="hover:text-blue-600 transition-colors">LinkedIn</a>
             <a href="#" className="hover:text-blue-600 transition-colors">Termos</a>
             <a href="#" className="hover:text-blue-600 transition-colors">Privacidade</a>
          </div>

          <p className="text-[10px] font-black text-slate-400 tracking-widest uppercase">
             Solution © 2026 | Desenvolvido por <a href="https://felipe-84bca.web.app/" target="_blank" className="hover:text-blue-600 transition-colors">Felipe Sadrak</a>
          </p>
        </div>
      </footer>
    </div>
  );
};
