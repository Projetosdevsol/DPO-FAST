
import React from 'react';
import { Link } from 'react-router-dom';
import { ChevronLeft, ShieldCheck } from 'lucide-react';

export const TermsOfUse: React.FC = () => {
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
          <h1 className="text-4xl font-extrabold text-gray-900 mb-4">Termos de Uso</h1>
          <p className="text-gray-500 font-medium italic">Última atualização: {new Date().toLocaleDateString('pt-BR')}</p>
        </header>

        <article className="prose prose-blue max-w-none space-y-8 text-gray-600 leading-relaxed">
          <section className="space-y-4">
            <h2 className="text-2xl font-bold text-gray-900">1. Aceitação dos Termos</h2>
            <p>
              Ao acessar e utilizar a plataforma LGPD Fácil, você concorda em cumprir e estar vinculado a estes Termos de Uso. Este sistema é destinado a auxiliar micro e pequenas empresas na jornada de adequação à Lei Geral de Proteção de Dados (LGPD).
            </p>
          </section>

          <section className="space-y-4">
            <h2 className="text-2xl font-bold text-gray-900">2. Descrição do Serviço</h2>
            <p>
              O LGPD Fácil fornece ferramentas de diagnóstico, geração de modelos de documentos e cronogramas de implementação. Note que a plataforma automatiza processos baseados nas suas respostas, mas não substitui a consultoria jurídica especializada para casos complexos.
            </p>
          </section>

          <section className="space-y-4">
            <h2 className="text-2xl font-bold text-gray-900">3. Responsabilidades do Usuário</h2>
            <p>
              O usuário é responsável pela veracidade de todas as informações inseridas no sistema. A eficácia dos documentos gerados depende diretamente da precisão dos dados fornecidos durante o diagnóstico setorial.
            </p>
          </section>

          <section className="space-y-4">
            <h2 className="text-2xl font-bold text-gray-900">4. Propriedade Intelectual</h2>
            <p>
              Todo o conteúdo, modelos de documentos, algoritmos e interface da plataforma são de propriedade exclusiva do LGPD Fácil. O uso é concedido apenas para fins de adequação da empresa cadastrada.
            </p>
          </section>

          <section className="space-y-4 bg-blue-50 p-8 rounded-3xl border border-blue-100">
            <h2 className="text-2xl font-bold text-blue-900">5. Isenção de Responsabilidade</h2>
            <p className="text-blue-800">
              O LGPD Fácil envida esforços para manter as informações atualizadas de acordo com as diretrizes da ANPD. No entanto, não garantimos imunidade total a fiscalizações ou incidentes se as medidas de segurança sugeridas não forem efetivamente implementadas no dia a dia da empresa.
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
