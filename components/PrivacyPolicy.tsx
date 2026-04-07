
import React from 'react';
import { Link } from 'react-router-dom';
import { ChevronLeft, ShieldCheck, Lock } from 'lucide-react';

export const PrivacyPolicy: React.FC = () => {
  return (
    <div className="min-h-screen bg-white text-gray-900 font-sans">
      <nav className="border-b border-gray-100 bg-white/80 backdrop-blur-md sticky top-0 z-50">
        <div className="max-w-4xl mx-auto px-6 h-20 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2">
            <div className="p-1.5 bg-blue-600 rounded-lg">
              <ShieldCheck className="h-5 w-5 text-white" />
            </div>
            <span className="font-bold text-lg tracking-tight">LGPD Fácil</span>
          </Link>
          <Link to="/" className="text-sm font-bold text-gray-500 hover:text-blue-600 flex items-center gap-1 transition-colors">
            <ChevronLeft className="h-4 w-4" /> Voltar
          </Link>
        </div>
      </nav>

      <main className="max-w-4xl mx-auto px-6 py-16">
        <header className="mb-12">
          <div className="inline-flex items-center gap-2 px-3 py-1 bg-blue-50 text-blue-700 rounded-full text-xs font-bold uppercase tracking-wider mb-4">
            <Lock className="h-3 w-3" /> Sua privacidade em primeiro lugar
          </div>
          <h1 className="text-4xl font-extrabold text-gray-900 mb-4">Política de Privacidade</h1>
          <p className="text-gray-500 font-medium italic">Última atualização: {new Date().toLocaleDateString('pt-BR')}</p>
        </header>

        <article className="prose prose-blue max-w-none space-y-8 text-gray-600 leading-relaxed">
          <section className="space-y-4">
            <h2 className="text-2xl font-bold text-gray-900">1. Compromisso com a Proteção de Dados</h2>
            <p>
              Como uma plataforma dedicada à conformidade com a LGPD, tratamos seus dados pessoais com o mais alto rigor de segurança. Esta política descreve como coletamos e utilizamos as informações de nossos usuários corporativos.
            </p>
          </section>

          <section className="space-y-4">
            <h2 className="text-2xl font-bold text-gray-900">2. Dados que Coletamos</h2>
            <ul className="list-disc pl-6 space-y-2">
              <li><strong>Dados de Cadastro:</strong> Nome, e-mail, CNPJ e endereço comercial para criação da conta e personalização de documentos.</li>
              <li><strong>Dados de Diagnóstico:</strong> Respostas sobre o fluxo de dados da sua empresa (estes dados são utilizados exclusivamente para gerar os seus documentos de conformidade).</li>
              <li><strong>Logs de Acesso:</strong> IP e data/hora para segurança e prevenção a fraudes.</li>
            </ul>
          </section>

          <section className="space-y-4">
            <h2 className="text-2xl font-bold text-gray-900">3. Finalidade do Tratamento</h2>
            <p>
              Os dados coletados são tratados com base na <strong>Execução de Contrato</strong> (prestação do serviço de adequação) e <strong>Cumprimento de Obrigação Legal</strong>. Não vendemos ou compartilhamos seus dados com terceiros para fins de marketing.
            </p>
          </section>

          <section className="space-y-4">
            <h2 className="text-2xl font-bold text-gray-900">4. Segurança dos Dados</h2>
            <p>
              Utilizamos criptografia para armazenamento e transporte de dados, além de backups regulares. Seus diagnósticos são armazenados de forma isolada e protegida por credenciais robustas.
            </p>
          </section>

          <section className="space-y-4">
            <h2 className="text-2xl font-bold text-gray-900">5. Seus Direitos</h2>
            <p>
              Conforme o Art. 18 da LGPD, você pode solicitar a confirmação do tratamento, acesso, correção ou exclusão de seus dados a qualquer momento através do nosso canal de suporte.
            </p>
          </section>
        </article>

        <footer className="mt-20 pt-8 border-t border-gray-100 text-center">
          <p className="text-sm text-gray-400">© {new Date().getFullYear()} LGPD Fácil Tecnologia LTDA.</p>
        </footer>
      </main>
    </div>
  );
};
