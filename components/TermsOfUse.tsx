import React from 'react';
import { Link } from 'react-router-dom';
import { ChevronLeft, ShieldCheck, FileText } from 'lucide-react';

export const TermsOfUse: React.FC = () => {
  return (
    <div className="min-h-screen bg-black text-slate-500 selection:bg-blue-500/20 selection:text-white relative overflow-hidden">
      <nav className="glass-nav sticky top-0 z-50">
        <div className="max-w-4xl mx-auto px-6 h-20 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-3">
             <div className="p-2 bg-orange-600 rounded-xl font-bold">
               <ShieldCheck className="h-5 w-5 text-white" />
             </div>
             <span className="font-black text-lg text-white tracking-tighter">LGPD Fácil</span>
          </Link>
          <Link to="/" className="text-[10px] font-black uppercase tracking-widest text-slate-500 hover:text-white flex items-center gap-2 transition-all">
            <ChevronLeft className="h-4 w-4" /> Voltar ao Início
          </Link>
        </div>
      </nav>

      <main className="max-w-4xl mx-auto px-6 py-24 relative z-10">
        <header className="mb-16">
          <div className="inline-flex items-center gap-3 px-4 py-1.5 bg-white/5 border border-white/10 text-orange-500 rounded-full text-[10px] font-black uppercase tracking-[0.2em] mb-6">
            <FileText className="h-3 w-3" /> Regras de Utilização
          </div>
          <h1 className="text-5xl font-black text-white tracking-tighter mb-4">Termos de Uso</h1>
          <p className="text-slate-500 font-bold uppercase tracking-widest text-[10px]">Última atualização: {new Date().toLocaleDateString('pt-BR')}</p>
        </header>

        <article className="glass-card p-10 md:p-16 border-white/5 space-y-12 leading-relaxed">
          <section className="space-y-4">
            <h2 className="text-xl font-bold text-white tracking-tight">1. Aceitação do Serviço</h2>
            <p className="text-slate-500 text-sm">
              Ao utilizar a plataforma LGPD Fácil, sua empresa adere a um modelo de adequação guiada. Este sistema foi desenhado para facilitar a jornada de conformidade, fornecendo tecnologia de ponta para automação de registros e auditorias.
            </p>
          </section>

          <section className="space-y-4">
            <h2 className="text-xl font-bold text-white tracking-tight">2. Escopo da Tecnologia</h2>
            <p className="text-slate-500 text-sm leading-relaxed">
              Fornecemos inteligência de software para diagnóstico setorial, geração de RAT e políticas customizadas. Nossos modelos são atualizados conforme as notas técnicas da ANPD, garantindo que você esteja sempre utilizando os padrões mais recentes do mercado.
            </p>
          </section>

          <section className="space-y-4">
            <h2 className="text-xl font-bold text-white tracking-tight">3. Veracidade e Responsabilidade</h2>
            <p className="text-slate-500 text-sm">
              A precisão da sua documentação depende da veracidade das informações inseridas. O usuário assume total responsabilidade pelo conteúdo autodeclarado durante o mapeamento de processos.
            </p>
          </section>

          <section className="space-y-6">
            <div className="p-8 bg-orange-500/10 border border-orange-500/20 rounded-[2rem] space-y-4">
              <h2 className="text-xl font-bold text-white tracking-tight">4. Limitação de Responsabilidade Legal</h2>
              <p className="text-orange-200/60 text-sm">
                O LGPD Fácil é um assistente tecnológico. Embora ofereçamos suporte jurídico de base, o sistema não substitui a necessidade de implementação prática de medidas técnicas de segurança no dia a dia da sua organização.
              </p>
            </div>
          </section>

          <section className="space-y-4">
            <h2 className="text-xl font-bold text-white tracking-tight">5. Propriedade Intelectual</h2>
            <p className="text-slate-500 text-sm">
              Todos os algoritmos de análise, fluxos de diagnóstico e elementos de design são propriedade intelectual da LGPD Fácil. A licença de uso é intransferível e válida apenas para o domínio da empresa registrada.
            </p>
          </section>
        </article>

        <footer className="mt-24 text-center">
          <p className="text-[10px] font-black uppercase tracking-widest text-slate-700">© {new Date().getFullYear()} LGPD Fácil Tecnologia. Inteligência em Conformidade.</p>
        </footer>
      </main>
    </div>
  );
};
