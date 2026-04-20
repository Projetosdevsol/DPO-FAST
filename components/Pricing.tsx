import React from 'react';
import { Check, Zap, Shield, Crown, ArrowRight, Star, Clock, FileText, Database, X, ArrowLeft } from 'lucide-react';
import { useNavigate, Link } from 'react-router-dom';

export const Pricing: React.FC<{ isLandingPage?: boolean }> = ({ isLandingPage }) => {
  const navigate = useNavigate();

  const plans = [
    {
      name: 'Básico',
      id: 'basico',
      price: 'R$ 197',
      period: '/mês',
      description: 'Ideal para MEIs e pequenas empresas que buscam o essencial da conformidade.',
      features: [
        { text: 'Aviso de Privacidade Essencial', icon: FileText },
        { text: 'Política Interna de Privacidade', icon: Shield },
        { text: 'Até 1 Setor e 3 Processos', icon: Database },
        { text: 'Diagnóstico Básico de Riscos', icon: Zap },
        { text: 'SLA de Suporte: 72h úteis', icon: Clock },
      ],
      color: 'blue',
      buttonText: 'Assinar Plano Básico',
      highlight: false,
      stripeUrl: 'https://buy.stripe.com/test_9B600lagGgxhffe6Sj3AY00'
    },
    {
      name: 'Pro',
      id: 'pro',
      price: 'R$ 497',
      period: '/mês',
      description: 'O plano completo para empresas em crescimento com auditoria automatizada.',
      features: [
        { text: 'Todos os Documentos (RIPD, RAT)', icon: FileText },
        { text: 'Auditoria de Terceiros e Contratos', icon: Shield },
        { text: 'Até 10 Setores e 20 Processos', icon: Database },
        { text: 'Análise Profunda com IA Qwen', icon: Zap },
        { text: 'SLA de Suporte: 24h úteis', icon: Clock },
        { text: 'Recomendações Personalizadas', icon: Star },
      ],
      color: 'indigo',
      buttonText: 'Garantir Plano Pro',
      highlight: true,
      stripeUrl: 'https://buy.stripe.com/test_28E8wRagGftd0kkekL3AY01'
    },
    {
      name: 'Personalité',
      id: 'personalite',
      price: 'Sob Consulta',
      period: '',
      description: 'Consultoria dedicada e suporte sob medida para grandes estruturas.',
      features: [
        { text: 'Documentação Customizada', icon: FileText },
        { text: 'Múltiplas Empresas (CNPJs)', icon: Database },
        { text: 'Auditoria Humana por DPOs', icon: Shield },
        { text: 'SLA Prioritário: 4h úteis', icon: Clock },
        { text: 'Gerente de Conta Dedicado', icon: Crown },
        { text: 'Treinamentos para Equipe', icon: Star },
      ],
      color: 'slate',
      buttonText: 'Agendar com Especialista',
      highlight: false
    }
  ];

  return (
    <div className={`relative ${isLandingPage ? 'py-32' : 'min-h-screen bg-[var(--background)] py-20'} px-6 transition-colors duration-500`}>
      {!isLandingPage && (
        <>
          {/* Mobile X Button */}
          <button 
            onClick={() => navigate(-1)}
            className="lg:hidden absolute top-10 right-6 p-4 bg-[var(--surface)] text-[var(--text-primary)] rounded-2xl border border-[var(--border)] shadow-xl z-50 hover:bg-[var(--surface-muted)] transition-all"
          >
            <X className="h-6 w-6" />
          </button>

          {/* Desktop/Global Back Button */}
          <button 
            onClick={() => navigate(-1)}
            className="absolute top-10 left-6 lg:left-12 flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-slate-500 hover:text-[var(--text-primary)] transition-all group z-50"
          >
            <ArrowLeft className="h-4 w-4 group-hover:-translate-x-1 transition-transform" />
            Voltar
          </button>
        </>
      )}

      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-24 space-y-6">
          <span className={`px-5 py-2 rounded-full text-[10px] font-black uppercase tracking-[0.2em] ${
            isLandingPage ? 'bg-blue-600/20 text-blue-500 border border-blue-500/20' : 'bg-blue-600/10 text-blue-600 border border-blue-500/10'
          }`}>
            Investimento em Segurança
          </span>
          <h1 className={`text-4xl md:text-6xl font-black tracking-tighter text-[var(--text-primary)]`}>
            Proteção que cabe no <span className={isLandingPage ? 'text-slate-500/50 italic text-[var(--text-muted)]' : 'text-blue-600'}>bolso</span>.
          </h1>
          <p className={`text-lg max-w-2xl mx-auto font-medium text-slate-500 leading-relaxed`}>
            Escolha o nível de blindagem jurídica ideal para o seu negócio.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-12">
          {plans.map((plan) => (
            <div 
              key={plan.id}
              className={`relative p-8 md:p-12 transition-all duration-700 border border-[var(--border)] rounded-[2rem] md:rounded-[2.5rem] bg-[var(--surface-muted)] hover:border-blue-500/30 group ${
                plan.highlight ? 'border-blue-500/50 ring-1 ring-blue-500/20 shadow-2xl shadow-blue-500/10 scale-[1.02]' : ''
              }`}
            >
              {plan.highlight && (
                <div className={`absolute -top-3 left-10 px-4 py-1.5 rounded-full text-[8px] font-black uppercase tracking-[0.2em] shadow-sm bg-blue-600 text-white always-white z-10`}>
                  Mais Eficiente
                </div>
              )}

              <div className="mb-8">
                <h3 className={`text-2xl font-black mb-3 text-[var(--text-primary)]`}>{plan.name}</h3>
                <p className={`text-sm font-medium leading-relaxed text-slate-500`}>
                  {plan.description}
                </p>
              </div>

              <div className="mb-10 flex items-baseline gap-1">
                <span className={`text-4xl font-black text-[var(--text-primary)]`}>{plan.price}</span>
                <span className={`font-bold text-xs uppercase tracking-widest text-slate-400`}>
                  {plan.period}
                </span>
              </div>

              <div className="space-y-6 mb-12">
                {plan.features.map((feature, i) => (
                  <div key={i} className="flex items-start gap-4 group/item">
                    <div className={`p-2.5 rounded-xl shrink-0 transition-all bg-[var(--background)] text-slate-500 group-hover/item:text-blue-500 group-hover/item:scale-110`}>
                      <feature.icon className="h-4 w-4" />
                    </div>
                    <span className={`text-sm font-bold leading-tight pt-1 transition-colors text-slate-600 group-hover/item:text-[var(--text-primary)]`}>
                      {feature.text}
                    </span>
                  </div>
                ))}
              </div>

              <button 
                onClick={() => {
                  if (plan.id === 'personalite') {
                    window.open('https://api.whatsapp.com/send?phone=YOUR_NUMBER&text=Olá! Gostaria de saber mais sobre o plano Personalité do LGPD Fácil.', '_blank');
                  } else if (plan.stripeUrl) {
                    window.location.href = plan.stripeUrl;
                  }
                }}
                className={`btn-primary w-full py-5 rounded-2xl flex items-center justify-center gap-3 always-white shadow-xl group-hover:shadow-blue-600/30 transition-all`}
              >
                {plan.buttonText}
                <ArrowRight className="h-4 w-4 group-hover:translate-x-1 transition-transform" />
              </button>
            </div>
          ))}
        </div>

        <div className="mt-24 text-center">
          <p className={`text-[10px] font-black uppercase tracking-[0.2em] text-slate-500`}>
            Dúvidas sobre faturamento? 
            <button 
              onClick={() => navigate('/dashboard/configuracoes')}
              className={`ml-2 transition-colors text-blue-600 hover:underline underline-offset-4`}
            >
              Consulte nosso suporte especializado
            </button>
          </p>
        </div>
      </div>
    </div>
  );
};
