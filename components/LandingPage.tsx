
import React, { useState } from 'react';
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
  Scale
} from 'lucide-react';

const FAQItem: React.FC<{ question: string; answer: string }> = ({ question, answer }) => {
  const [isOpen, setIsOpen] = useState(false);
  return (
    <div className="border-b border-gray-100 last:border-0">
      <button 
        onClick={() => setIsOpen(!isOpen)}
        className="w-full py-6 flex items-center justify-between text-left focus:outline-none group"
      >
        <span className="font-bold text-gray-900 group-hover:text-blue-600 transition-colors">{question}</span>
        {isOpen ? <ChevronUp className="h-5 w-5 text-blue-600" /> : <ChevronDown className="h-5 w-5 text-gray-400" />}
      </button>
      {isOpen && (
        <div className="pb-6 animate-in slide-in-from-top-2 duration-300">
          <p className="text-gray-600 leading-relaxed">{answer}</p>
        </div>
      )}
    </div>
  );
};

export const LandingPage: React.FC = () => {
  const navigate = useNavigate();

  const faqData = [
    {
      question: "O que é a LGPD e por que minha empresa precisa dela?",
      answer: "A Lei Geral de Proteção de Dados (LGPD) é a norma que regula o tratamento de dados pessoais no Brasil. Todas as empresas, independente do tamanho, que lidam com nomes, e-mails ou documentos de clientes e funcionários precisam estar adequadas para evitar multas de até 2% do faturamento e proteger sua reputação."
    },
    {
      question: "Minha empresa é pequena ou sou MEI, eu realmente preciso me adequar?",
      answer: "Sim. Embora a ANPD (Autoridade Nacional) ofereça regras simplificadas para pequenos negócios e MEIs, a obrigação de proteger os dados e respeitar os direitos dos titulares permanece. O LGPD Fácil já aplica essas simplificações automaticamente para você."
    },
    {
      question: "Quanto tempo leva o processo de adequação no sistema?",
      answer: "O diagnóstico inicial leva cerca de 10 a 15 minutos. Após o preenchimento, seus principais documentos (Políticas, Termos e RAT) são gerados instantaneamente. A implementação completa das sugestões de segurança costuma levar de 15 a 45 dias dependendo da sua agilidade."
    },
    {
      question: "Os documentos gerados são válidos juridicamente?",
      answer: "Sim. Nossos templates são baseados nas melhores práticas recomendadas pela ANPD e em padrões de conformidade internacional, adaptados para o contexto de micro e pequenas empresas brasileiras."
    },
    {
      question: "Como funciona o suporte em caso de dúvidas?",
      answer: "Oferecemos tutoriais guiados dentro da plataforma e suporte via e-mail para todos os planos. Nosso objetivo é que você consiga se adequar sem precisar contratar uma consultoria externa cara."
    }
  ];

  return (
    <div className="min-h-screen bg-white text-gray-900 overflow-x-hidden font-sans">
      {/* Navbar */}
      <nav className="fixed top-0 left-0 right-0 bg-white/80 backdrop-blur-md z-50 border-b border-gray-100">
        <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="p-1.5 bg-blue-600 rounded-lg">
              <ShieldCheck className="h-6 w-6 text-white" />
            </div>
            <span className="font-bold text-xl tracking-tight">LGPD Fácil</span>
          </div>
          
          <div className="hidden md:flex items-center gap-8 text-sm font-medium text-gray-600">
            <a href="#funcionalidades" className="hover:text-blue-600 transition-colors">Funcionalidades</a>
            <a href="#beneficios" className="hover:text-blue-600 transition-colors">Benefícios</a>
            <a href="#faq" className="hover:text-blue-600 transition-colors">FAQ</a>
          </div>

          <div className="flex items-center gap-4">
            <Link to="/login" className="text-sm font-bold text-gray-700 hover:text-blue-600 transition-colors">Acessar</Link>
            <Link 
              to="/register" 
              className="px-5 py-2.5 bg-gray-900 text-white text-sm font-bold rounded-xl hover:bg-black transition-all shadow-lg shadow-gray-200"
            >
              Começar Agora
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="pt-32 pb-20 px-6">
        <div className="max-w-7xl mx-auto text-center lg:text-left flex flex-col lg:flex-row items-center gap-12">
          <div className="lg:w-1/2 space-y-8">
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-blue-50 text-blue-700 rounded-full text-xs font-bold uppercase tracking-wider">
              <Zap className="h-3.5 w-3.5" /> Adequação em tempo recorde
            </div>
            <h1 className="text-5xl lg:text-7xl font-extrabold text-gray-900 leading-[1.1]">
              A LGPD não precisa ser um <span className="text-blue-600">pesadelo</span> jurídico.
            </h1>
            <p className="text-xl text-gray-600 max-w-xl mx-auto lg:mx-0">
              Automatize seus documentos, mapeie riscos e proteja sua empresa com a plataforma de conformidade mais simples do Brasil.
            </p>
            <div className="flex flex-col sm:flex-row items-center gap-4 justify-center lg:justify-start">
              <Link 
                to="/register" 
                className="w-full sm:w-auto px-8 py-4 bg-blue-600 text-white rounded-2xl font-bold flex items-center justify-center gap-3 hover:bg-blue-700 shadow-xl shadow-blue-100 transition-all text-lg"
              >
                Começar agora <ChevronRight className="h-5 w-5" />
              </Link>
              <a 
                href="#funcionalidades"
                className="w-full sm:w-auto px-8 py-4 bg-gray-50 text-gray-600 rounded-2xl font-bold hover:bg-gray-100 transition-all text-lg text-center"
              >
                Explorar Recursos
              </a>
            </div>
            <div className="flex items-center gap-6 justify-center lg:justify-start text-xs font-medium text-gray-400">
              <div className="flex items-center gap-1.5">
                <CheckCircle2 className="h-4 w-4 text-green-500" /> Sem cartão de crédito
              </div>
              <div className="flex items-center gap-1.5">
                <CheckCircle2 className="h-4 w-4 text-green-500" /> Pronto em minutos
              </div>
            </div>
          </div>
          <div className="lg:w-1/2 relative">
            <div className="bg-blue-600/5 absolute inset-0 blur-3xl rounded-full -z-10 transform scale-150"></div>
            <div className="bg-white p-4 rounded-[2rem] shadow-2xl border border-gray-100 transform lg:rotate-2 hover:rotate-0 transition-transform duration-500">
               <img 
                 src="https://images.unsplash.com/photo-1460925895917-afdab827c52f?auto=format&fit=crop&w=800&q=80" 
                 alt="Painel de Controle LGPD" 
                 className="rounded-2xl shadow-inner border border-gray-100"
               />
               <div className="absolute -bottom-6 -left-6 bg-white p-6 rounded-3xl shadow-xl border border-gray-50 max-w-[200px] animate-bounce">
                  <div className="flex items-center gap-2 mb-2">
                    <div className="h-2 w-2 rounded-full bg-green-500"></div>
                    <span className="text-[10px] font-bold text-gray-400 uppercase">Status Global</span>
                  </div>
                  <p className="text-sm font-bold">100% Protegido</p>
               </div>
            </div>
          </div>
        </div>
      </section>

      {/* Funcionalidades Detalhadas */}
      <section id="funcionalidades" className="py-24 px-6 bg-gray-50">
        <div className="max-w-7xl mx-auto">
          <div className="text-center max-w-2xl mx-auto mb-20 space-y-4">
            <h2 className="text-blue-600 text-sm font-bold uppercase tracking-widest">O que oferecemos</h2>
            <h3 className="text-4xl font-extrabold">Funcionalidades poderosas, uso simplificado</h3>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="bg-white p-8 rounded-3xl border border-gray-100 hover:shadow-xl transition-all duration-300">
              <div className="p-3 bg-blue-50 rounded-2xl w-fit mb-6">
                <Search className="h-6 w-6 text-blue-600" />
              </div>
              <h4 className="font-bold text-lg mb-3">Diagnóstico Setorial</h4>
              <p className="text-gray-500 text-sm leading-relaxed">Mapeamento específico para cada área da sua empresa (RH, Vendas, TI) sem complicações.</p>
            </div>

            <div className="bg-white p-8 rounded-3xl border border-gray-100 hover:shadow-xl transition-all duration-300">
              <div className="p-3 bg-green-50 rounded-2xl w-fit mb-6">
                <Scale className="h-6 w-6 text-green-600" />
              </div>
              <h4 className="font-bold text-lg mb-3">Base Legal Inteligente</h4>
              <p className="text-gray-500 text-sm leading-relaxed">O sistema sugere automaticamente a base jurídica (Consentimento, Legítimo Interesse, etc) para cada dado.</p>
            </div>

            <div className="bg-white p-8 rounded-3xl border border-gray-100 hover:shadow-xl transition-all duration-300">
              <div className="p-3 bg-purple-50 rounded-2xl w-fit mb-6">
                <Users className="h-6 w-6 text-purple-600" />
              </div>
              <h4 className="font-bold text-lg mb-3">Gestão de Titulares</h4>
              <p className="text-gray-500 text-sm leading-relaxed">Painel para organizar e responder solicitações de clientes sobre seus dados pessoais.</p>
            </div>

            <div className="bg-white p-8 rounded-3xl border border-gray-100 hover:shadow-xl transition-all duration-300">
              <div className="p-3 bg-amber-50 rounded-2xl w-fit mb-6">
                <Lock className="h-6 w-6 text-amber-600" />
              </div>
              <h4 className="font-bold text-lg mb-3">RAT Automatizado</h4>
              <p className="text-gray-500 text-sm leading-relaxed">Geração automática do Registro de Atividades de Tratamento, o documento mais exigido pela ANPD.</p>
            </div>
          </div>
        </div>
      </section>

      {/* Benefícios por Porte/Setor */}
      <section id="beneficios" className="py-24 px-6 bg-white">
        <div className="max-w-7xl mx-auto">
          <div className="text-center max-w-2xl mx-auto mb-20 space-y-4">
            <h2 className="text-blue-600 text-sm font-bold uppercase tracking-widest">Feito para você</h2>
            <h3 className="text-4xl font-extrabold text-gray-900">Soluções sob medida para o seu porte</h3>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-12">
            <div className="space-y-6 p-8 border border-gray-100 rounded-[2.5rem] hover:border-blue-200 transition-colors">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-gray-50 rounded-2xl">
                  <Store className="h-6 w-6 text-gray-700" />
                </div>
                <h4 className="text-xl font-bold">MEI & Autônomos</h4>
              </div>
              <ul className="space-y-3">
                <li className="flex items-center gap-3 text-sm text-gray-600">
                  <CheckCircle2 className="h-4 w-4 text-green-500" /> Adequação em 10 minutos
                </li>
                <li className="flex items-center gap-3 text-sm text-gray-600">
                  <CheckCircle2 className="h-4 w-4 text-green-500" /> Termos de uso para WhatsApp
                </li>
                <li className="flex items-center gap-3 text-sm text-gray-600">
                  <CheckCircle2 className="h-4 w-4 text-green-500" /> Dispensa de DPO formalizada
                </li>
              </ul>
              <p className="text-sm text-gray-500 bg-gray-50 p-4 rounded-2xl italic">"Ideal para quem quer apenas a segurança jurídica mínima sem burocracia."</p>
            </div>

            <div className="space-y-6 p-8 border-2 border-blue-600 rounded-[2.5rem] relative shadow-2xl shadow-blue-50">
              <div className="absolute -top-4 left-1/2 -translate-x-1/2 bg-blue-600 text-white text-[10px] font-bold px-4 py-1.5 rounded-full uppercase tracking-widest">
                Mais Popular
              </div>
              <div className="flex items-center gap-4">
                <div className="p-3 bg-blue-50 rounded-2xl">
                  <Building className="h-6 w-6 text-blue-600" />
                </div>
                <h4 className="text-xl font-bold">Microempresas</h4>
              </div>
              <ul className="space-y-3">
                <li className="flex items-center gap-3 text-sm text-gray-600 font-bold">
                  <CheckCircle2 className="h-4 w-4 text-green-500" /> Mapeamento de até 5 setores
                </li>
                <li className="flex items-center gap-3 text-sm text-gray-600">
                  <CheckCircle2 className="h-4 w-4 text-green-500" /> Política Interna de RH
                </li>
                <li className="flex items-center gap-3 text-sm text-gray-600">
                  <CheckCircle2 className="h-4 w-4 text-green-500" /> Treinamento para equipe
                </li>
              </ul>
              <p className="text-sm text-blue-700 bg-blue-50 p-4 rounded-2xl italic">"Perfeito para quem está crescendo e precisa fechar contratos corporativos."</p>
            </div>

            <div className="space-y-6 p-8 border border-gray-100 rounded-[2.5rem] hover:border-blue-200 transition-colors">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-gray-50 rounded-2xl">
                  <Briefcase className="h-6 w-6 text-gray-700" />
                </div>
                <h4 className="text-xl font-bold">Pequenas Empresas</h4>
              </div>
              <ul className="space-y-3">
                <li className="flex items-center gap-3 text-sm text-gray-600">
                  <CheckCircle2 className="h-4 w-4 text-green-500" /> Gestão completa de riscos
                </li>
                <li className="flex items-center gap-3 text-sm text-gray-600">
                  <CheckCircle2 className="h-4 w-4 text-green-500" /> Inventário de Dados (Data Mapping)
                </li>
                <li className="flex items-center gap-3 text-sm text-gray-600">
                  <CheckCircle2 className="h-4 w-4 text-green-500" /> Cronograma de 12 meses
                </li>
              </ul>
              <p className="text-sm text-gray-500 bg-gray-50 p-4 rounded-2xl italic">"Ideal para empresas com muitos funcionários ou base de clientes ativa."</p>
            </div>
          </div>
        </div>
      </section>

      {/* Seção de FAQ */}
      <section id="faq" className="py-24 px-6 bg-gray-50">
        <div className="max-w-3xl mx-auto">
          <div className="text-center mb-16 space-y-4">
            <h2 className="text-blue-600 text-sm font-bold uppercase tracking-widest">Dúvidas Comuns</h2>
            <h3 className="text-4xl font-extrabold">Perguntas Frequentes</h3>
          </div>
          
          <div className="bg-white rounded-3xl p-8 border border-gray-100 shadow-sm">
            {faqData.map((item, index) => (
              <FAQItem key={index} question={item.question} answer={item.answer} />
            ))}
          </div>

          <div className="mt-12 text-center p-8 bg-blue-600 rounded-[2.5rem] text-white shadow-xl shadow-blue-100">
            <h4 className="text-xl font-bold mb-4">Ainda tem dúvidas?</h4>
            <p className="text-blue-100 mb-6">Nossa equipe está pronta para te ajudar a entender o melhor caminho para a sua empresa.</p>
            <Link 
              to="/register" 
              className="inline-flex items-center gap-2 px-8 py-3 bg-white text-blue-600 rounded-xl font-bold hover:bg-blue-50 transition-all"
            >
              Falar com um Especialista
            </Link>
          </div>
        </div>
      </section>

      {/* CTA Final */}
      <section className="py-24 px-6 text-center">
        <div className="max-w-4xl mx-auto space-y-8">
          <div className="p-4 bg-green-50 text-green-700 rounded-2xl w-fit mx-auto text-xs font-bold uppercase tracking-widest mb-4">
            Livre de burocracia
          </div>
          <h3 className="text-4xl md:text-5xl font-extrabold leading-tight">Prepare sua empresa para o futuro digital.</h3>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            A conformidade com a LGPD gera confiança, evita multas e organiza sua operação. 
            Comece agora sem pagar nada pelo cadastro.
          </p>
          <div className="pt-4">
            <Link 
              to="/register" 
              className="inline-flex items-center gap-3 px-12 py-6 bg-blue-600 text-white rounded-[2rem] font-extrabold text-2xl hover:bg-blue-700 shadow-2xl shadow-blue-200 transition-all hover:-translate-y-1"
            >
              Começar minha adequação <ArrowRight className="h-7 w-7" />
            </Link>
          </div>
          <div className="flex flex-wrap justify-center gap-8 text-sm font-medium text-gray-400 mt-12">
            <span className="flex items-center gap-2"><Lock className="h-4 w-4" /> Dados Criptografados</span>
            <span className="flex items-center gap-2"><CheckCircle2 className="h-4 w-4" /> 100% Online</span>
            <span className="flex items-center gap-2"><Scale className="h-4 w-4" /> Suporte Jurídico</span>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-50 border-t border-gray-100 py-16 px-6">
        <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-4 gap-12 mb-12">
          <div className="col-span-1 md:col-span-2 space-y-6">
            <div className="flex items-center gap-2">
              <div className="p-1.5 bg-blue-600 rounded-lg">
                <ShieldCheck className="h-6 w-6 text-white" />
              </div>
              <span className="font-bold text-2xl tracking-tight">LGPD Fácil</span>
            </div>
            <p className="text-gray-500 max-w-sm leading-relaxed">
              A solução definitiva para micro e pequenas empresas brasileiras que buscam segurança jurídica e proteção de dados sem a complexidade tradicional.
            </p>
          </div>
          
          <div className="space-y-4">
            <h5 className="font-bold text-gray-900">Plataforma</h5>
            <ul className="space-y-2 text-sm text-gray-500 font-medium">
              <li><a href="#funcionalidades" className="hover:text-blue-600">Funcionalidades</a></li>
              <li><a href="#beneficios" className="hover:text-blue-600">Planos</a></li>
              <li><Link to="/register" className="hover:text-blue-600">Documentos</Link></li>
              <li><Link to="/register" className="hover:text-blue-600">Treinamentos</Link></li>
            </ul>
          </div>

          <div className="space-y-4">
            <h5 className="font-bold text-gray-900">Legal</h5>
            <ul className="space-y-2 text-sm text-gray-500 font-medium">
              <li><Link to="/termos" className="hover:text-blue-600">Termos de Uso</Link></li>
              <li><Link to="/privacidade" className="hover:text-blue-600">Política de Privacidade</Link></li>
              <li><Link to="/login" className="hover:text-blue-600">Compliance</Link></li>
              <li><Link to="/login" className="hover:text-blue-600">DPO</Link></li>
            </ul>
          </div>
        </div>
        
        <div className="max-w-7xl mx-auto border-t border-gray-200 pt-8 flex flex-col md:flex-row justify-between items-center gap-4">
          <p className="text-xs text-gray-400 font-medium">
            © {new Date().getFullYear()} LGPD Fácil Tecnologia LTDA. Todos os direitos reservados.
          </p>
          <div className="flex gap-6">
            <div className="flex items-center gap-2 text-xs font-bold text-gray-400 bg-white px-3 py-1.5 rounded-lg border border-gray-100 uppercase tracking-widest">
              <ShieldCheck className="h-3 w-3 text-green-500" /> Adequado à LGPD
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};
