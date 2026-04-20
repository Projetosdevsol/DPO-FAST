import React from 'react';
import { Link } from 'react-router-dom';
import { ChevronLeft, ShieldCheck, Lock } from 'lucide-react';

export const PrivacyPolicy: React.FC = () => {
  return (
    <div className="min-h-screen bg-black text-slate-500 selection:bg-blue-500/20 selection:text-white relative overflow-hidden">
      <nav className="glass-nav sticky top-0 z-50">
        <div className="max-w-4xl mx-auto px-6 h-20 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-3">
             <div className="p-2 bg-orange-600 rounded-xl">
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
            <Lock className="h-3 w-3" /> Sua privacidade em primeiro lugar
          </div>
          <h1 className="text-5xl font-black text-white tracking-tighter mb-4">Política de Privacidade</h1>
          <p className="text-slate-500 font-bold uppercase tracking-widest text-[10px]">Última atualização: {new Date().toLocaleDateString('pt-BR')}</p>
        </header>

        <article className="glass-card p-10 md:p-16 border-white/5 space-y-12 leading-relaxed">
          <section className="space-y-4">
            <h2 className="text-xl font-bold text-white tracking-tight">1. Compromisso com a Proteção de Dados</h2>
            <p className="text-slate-500">
              Como uma ferramenta projetada para automação da conformidade com a LGPD, tratamos seus dados pessoais com o mais alto rigor técnico e jurídico. Esta política descreve como operamos para garantir que sua jornada de adequação seja segura.
            </p>
          </section>

          <section className="space-y-4">
            <h2 className="text-xl font-bold text-white tracking-tight">2. Dados que Coletamos</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="p-6 bg-white/[0.03] border border-white/5 rounded-[1.5rem]">
                <p className="font-black text-white text-xs uppercase tracking-widest mb-2">Dados Cadastrais</p>
                <p className="text-sm text-slate-500">Nome, e-mail corporativo, CNPJ e endereço para personalização de documentos e gestão de conta.</p>
              </div>
              <div className="p-6 bg-white/[0.03] border border-white/5 rounded-[1.5rem]">
                <p className="font-black text-white text-xs uppercase tracking-widest mb-2">Dados de Diagnóstico</p>
                <p className="text-sm text-slate-500">Fluxos de dados declarados durante o mapeamento para geração do RAT e das Políticas.</p>
              </div>
            </div>
          </section>

          <section className="space-y-4">
            <h2 className="text-xl font-bold text-white tracking-tight">3. Finalidade e Base Jurídica</h2>
            <p className="text-slate-500 text-sm">
              Tratamos seus dados com base na <strong>Execução de Contrato</strong> (prestação do serviço de diagnóstico) e <strong>Cumprimento de Obrigação Legal</strong>. Não monetizamos seus dados nem os compartilhamos para fins publicitários de terceiros.
            </p>
          </section>

          <section className="space-y-6">
            <h2 className="text-xl font-bold text-white tracking-tight">4. Segurança de Nível Bancário</h2>
            <p className="text-slate-500 text-sm">
              Implementamos criptografia de ponta a ponta (TLS 1.3) para transmissão e AES-256 para armazenamento. Seus documentos residem em um ambiente isolado, acessível apenas por autenticação robusta.
            </p>
            <div className="p-4 bg-orange-500/10 border border-orange-500/20 text-orange-500 rounded-2xl flex items-center gap-4">
               <ShieldCheck className="h-6 w-6 shrink-0" />
               <p className="text-[10px] font-black uppercase tracking-widest">Infraestrutura Blindada contra Vazamentos</p>
            </div>
          </section>
        </article>

        <footer className="mt-24 text-center">
          <p className="text-[10px] font-black uppercase tracking-widest text-slate-700">© {new Date().getFullYear()} LGPD Fácil Tecnologia. Sem complicação.</p>
        </footer>
      </main>
    </div>
  );
};
