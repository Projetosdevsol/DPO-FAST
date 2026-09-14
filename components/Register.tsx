import React, { useState, useRef, useEffect } from 'react';
import { useNavigate, Link, useSearchParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { 
  Loader2, 
  ArrowLeft, 
  CheckCircle2, 
  XCircle, 
  Building2,
  AlertTriangle,
  Sparkles,
  ShieldAlert,
  UserCheck,
  MailCheck
} from 'lucide-react';
import { Logo } from './Logo';
import { STRIPE_LINKS } from '../lib/stripe';

// ---------------------------------------------------------------------------
// Algoritmo de validação matemática de CNPJ (frontend — sem chamada de API)
// ---------------------------------------------------------------------------
function validateCnpjAlgorithm(raw: string): boolean {
  const cnpj = raw.replace(/\D/g, '');
  if (cnpj.length !== 14) return false;
  if (/^(\d)\1+$/.test(cnpj)) return false;

  const calcDigit = (digits: string, weights: number[]): number => {
    const sum = digits.split('').reduce((acc, d, i) => acc + parseInt(d) * weights[i], 0);
    const rem = sum % 11;
    return rem < 2 ? 0 : 11 - rem;
  };

  const w1 = [5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2];
  const w2 = [6, 5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2];

  return (
    calcDigit(cnpj.substring(0, 12), w1) === parseInt(cnpj[12]) &&
    calcDigit(cnpj.substring(0, 13), w2) === parseInt(cnpj[13])
  );
}

// Lista de domínios de email gratuitos/descartáveis
const PERSONAL_DOMAINS = [
  'gmail.com', 'yahoo.com', 'yahoo.com.br', 'hotmail.com', 'hotmail.com.br',
  'outlook.com', 'outlook.com.br', 'live.com', 'live.com.br', 'icloud.com',
  'terra.com.br', 'uol.com.br', 'bol.com.br', 'globomail.com', 'ig.com.br'
];

type CnpjStatus = 'idle' | 'checking' | 'valid' | 'invalid' | 'api-error';

interface CnpjValidation {
  status: CnpjStatus;
  message: string;
  companyName?: string;
}

export const Register: React.FC = () => {
  const [formData, setFormData] = useState({
    name: '',
    companyName: '',
    cnpj: '',
    address: '',
    email: '',
    password: '',
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);
  
  // Status do CNPJ e metadados enriquecidos
  const [cnpjValidation, setCnpjValidation] = useState<CnpjValidation>({
    status: 'idle',
    message: '',
  });
  const [cnpjMetadata, setCnpjMetadata] = useState<any>(null);
  
  // Regras de Negócio / Qualificação de Leads
  const [showPremiumRecommend, setShowPremiumRecommend] = useState(false);
  const [qsaVerified, setQsaVerified] = useState(false);
  
  // Validação de E-mail
  const [emailWarning, setEmailWarning] = useState<string | null>(null);
  const [emailDomainMatch, setEmailDomainMatch] = useState(false);

  const { authState, register } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const selectedPlan = searchParams.get('plan') || 'basico';
  
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // ---------------------------------------------------------------------------
  // Validação em Tempo Real do E-mail
  // ---------------------------------------------------------------------------
  useEffect(() => {
    const email = formData.email.trim();
    if (!email || !email.includes('@')) {
      setEmailWarning(null);
      setEmailDomainMatch(false);
      return;
    }

    const domain = email.split('@')[1]?.toLowerCase();
    
    // 1) Alerta de e-mail gratuito
    if (PERSONAL_DOMAINS.includes(domain)) {
      setEmailWarning('Atenção: Recomendamos o uso de um e-mail profissional para segurança e conformidade.');
      setEmailDomainMatch(false);
    } else {
      setEmailWarning(null);
      
      // 2) Tenta casar o domínio com o e-mail cadastrado na empresa da BrasilAPI
      if (cnpjMetadata?.email) {
        const companyEmail = cnpjMetadata.email.toLowerCase();
        if (companyEmail.includes('@')) {
          const companyDomain = companyEmail.split('@')[1];
          if (domain === companyDomain) {
            setEmailDomainMatch(true);
          } else {
            setEmailDomainMatch(false);
          }
        }
      }
    }
  }, [formData.email, cnpjMetadata]);

  // ---------------------------------------------------------------------------
  // QSA Verification: cruza o nome do usuário com o quadro de sócios
  // ---------------------------------------------------------------------------
  useEffect(() => {
    if (cnpjMetadata?.qsa && formData.name) {
      const inputName = formData.name.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().trim();
      
      const found = cnpjMetadata.qsa.some((member: any) => {
        if (!member.nome_socio) return false;
        const memberName = member.nome_socio.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().trim();
        return memberName.includes(inputName) || inputName.includes(memberName);
      });
      
      setQsaVerified(found);
    } else {
      setQsaVerified(false);
    }
  }, [formData.name, cnpjMetadata]);

  // ---------------------------------------------------------------------------
  // Formata o CNPJ enquanto digita
  // ---------------------------------------------------------------------------
  const handleCnpjChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let value = e.target.value.replace(/\D/g, '').substring(0, 14);
    let formatted = '';
    if (value.length > 0) {
      formatted = value.substring(0, 2);
      if (value.length > 2) formatted += '.' + value.substring(2, 5);
      if (value.length > 5) formatted += '.' + value.substring(5, 8);
      if (value.length > 8) formatted += '/' + value.substring(8, 12);
      if (value.length > 12) formatted += '-' + value.substring(12, 14);
    }
    setFormData(prev => ({ ...prev, cnpj: formatted }));

    // Reseta validações anteriores ao editar
    setCnpjValidation({ status: 'idle', message: '' });
    setCnpjMetadata(null);
    setShowPremiumRecommend(false);
    setQsaVerified(false);

    // Inicia debounce para verificar automaticamente
    if (debounceRef.current) clearTimeout(debounceRef.current);
    if (value.length === 14) {
      debounceRef.current = setTimeout(() => {
        triggerCnpjValidation(formatted);
      }, 600);
    }
  };

  // ---------------------------------------------------------------------------
  // Consulta e Enriquecimento via BrasilAPI
  // ---------------------------------------------------------------------------
  const triggerCnpjValidation = async (cnpjFormatted: string) => {
    const digits = cnpjFormatted.replace(/\D/g, '');

    // Estágio 1: Algoritmo local
    if (!validateCnpjAlgorithm(digits)) {
      setCnpjValidation({
        status: 'invalid',
        message: 'CNPJ inválido. Verifique os números digitados.',
      });
      return;
    }

    // Estágio 2: Chamada BrasilAPI
    setCnpjValidation({ status: 'checking', message: 'Verificando situação na Receita Federal…' });

    try {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 10000);

      const response = await fetch(
        `https://brasilapi.com.br/api/cnpj/v1/${digits}`,
        { signal: controller.signal, headers: { Accept: 'application/json' } }
      );
      clearTimeout(timeout);

      if (response.status === 404) {
        setCnpjValidation({
          status: 'invalid',
          message: 'CNPJ não encontrado na base da Receita Federal.',
        });
        return;
      }

      if (!response.ok) {
        throw new Error('api-error');
      }

      const data = await response.json();
      const situation = (data.descricao_situacao_cadastral || '').toUpperCase();

      const statusMessages: Record<string, string> = {
        'BAIXADA':  'Este CNPJ consta como baixado (encerrado) na Receita Federal.',
        'SUSPENSA': 'Este CNPJ está com situação irregular (suspenso) na Receita Federal.',
        'INAPTA':   'Este CNPJ está inapto na Receita Federal.',
        'NULA':     'Este CNPJ foi declarado nulo pela Receita Federal.',
      };

      if (situation !== 'ATIVA') {
        setCnpjValidation({
          status: 'invalid',
          message: statusMessages[situation] ?? `CNPJ com situação irregular (${situation}).`,
        });
        return;
      }

      // Enriquecimento com Sucesso
      const companyName = data.razao_social || data.nome_fantasia || '';
      setCnpjValidation({
        status: 'valid',
        message: `CNPJ ativo na Receita Federal.`,
        companyName,
      });

      // Salva os metadados brutos recebidos da API
      setCnpjMetadata(data);

      // Auto-preenche Razão Social
      setFormData(prev => ({
        ...prev,
        companyName: companyName,
        address: `${data.logradouro}, ${data.numero}${data.complemento ? `, ${data.complemento}` : ''} - ${data.bairro}, ${data.municipio} - ${data.uf}, CEP ${data.cep}`
      }));

      // Lógica de Risco LGPD baseado em CNAE
      const cnaeCode = Number(data.cnae_fiscal_principal?.codigo);
      const cnaeStr = String(cnaeCode).padStart(7, '0');
      const division = cnaeStr.substring(0, 2);
      const group = cnaeStr.substring(0, 4);

      // Setores de Risco: Saúde (86, 87, 88), Marketing (7311, 7312, 7319), Financeiro (64, 65, 66), HR (78), Telecom (61), Educação (85)
      const sensitiveDivisions = ['64', '65', '66', '86', '87', '88', '85', '61'];
      const sensitiveGroups = ['7311', '7312', '7319', '7810', '7820', '7830'];
      
      const isSensitive = sensitiveDivisions.includes(division) || sensitiveGroups.includes(group);
      setShowPremiumRecommend(isSensitive);

    } catch (err: any) {
      console.error(err);
      setCnpjValidation({
        status: 'api-error',
        message: 'Serviço de validação temporariamente indisponível. Você pode prosseguir e digitar os dados.',
      });
    }
  };

  // ---------------------------------------------------------------------------
  // Submit do formulário
  // ---------------------------------------------------------------------------
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrors({});

    const sanitizedName = formData.name.trim();
    const sanitizedEmail = formData.email.trim();
    const sanitizedCompanyName = formData.companyName.trim();
    const sanitizedCnpj = formData.cnpj.trim();
    const sanitizedAddress = formData.address.trim();

    const newErrors: Record<string, string> = {};

    if (sanitizedName.length < 3 || sanitizedName.length > 80) {
      newErrors.name = 'O nome deve ter entre 3 e 80 caracteres.';
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(sanitizedEmail) || sanitizedEmail.length > 120) {
      newErrors.email = 'Insira um e-mail profissional válido.';
    }

    if (sanitizedCompanyName.length < 2 || sanitizedCompanyName.length > 120) {
      newErrors.companyName = 'Nome da organização inválido.';
    }

    if (cnpjValidation.status === 'invalid') {
      newErrors.cnpj = cnpjValidation.message;
    }

    if (formData.password.length < 6) {
      newErrors.password = 'A senha deve conter no mínimo 6 caracteres.';
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    setLoading(true);
    
    // Qualificação do Lead (Lead Scoring)
    const capitalSocial = cnpjMetadata?.capital_social || 0;
    const leadSegment = capitalSocial >= 5000000 ? 'Enterprise' : 'PME';
    
    let ageInYears = 0;
    if (cnpjMetadata?.data_abertura) {
      const openingDate = new Date(cnpjMetadata.data_abertura);
      const diffMs = Date.now() - openingDate.getTime();
      const ageDate = new Date(diffMs);
      ageInYears = Math.abs(ageDate.getUTCFullYear() - 1970);
    }

    // Estrutura o payload de cadastro com os metadados enriquecidos
    const registerPayload = {
      name: sanitizedName,
      email: sanitizedEmail,
      companyName: sanitizedCompanyName,
      cnpj: sanitizedCnpj,
      address: sanitizedAddress,
      password: formData.password,
      plan: selectedPlan,
      cnpjData: cnpjMetadata ? {
        razaoSocial: cnpjMetadata.razao_social,
        nomeFantasia: cnpjMetadata.nome_fantasia || '',
        cnae: cnpjMetadata.cnae_fiscal_principal,
        capitalSocial: capitalSocial,
        dataAbertura: cnpjMetadata.data_abertura,
        age: ageInYears,
        segment: leadSegment,
        riskScore: showPremiumRecommend ? 'ALTO' : 'MEDIO',
        qsaVerified: qsaVerified,
        emailDomainMatch: emailDomainMatch,
        verifiedAt: new Date().toISOString()
      } : null
    };

    try {
      await register(registerPayload);

      if (['basico', 'pro', 'personalite'].includes(selectedPlan)) {
        const stripeUrl = STRIPE_LINKS[selectedPlan as keyof typeof STRIPE_LINKS];
        if (stripeUrl && stripeUrl.startsWith('http')) {
          window.location.href = stripeUrl;
          return;
        }
      }

      navigate('/dashboard', { state: { isFirstVisit: true } });
    } catch (err: any) {
      setLoading(false);
      setErrors({ general: 'Erro ao cadastrar. Tente outro e-mail.' });
    }
  };

  const renderCnpjStatusIcon = () => {
    switch (cnpjValidation.status) {
      case 'checking':
        return <Loader2 className="h-4 w-4 text-blue-500 animate-spin shrink-0" />;
      case 'valid':
        return <CheckCircle2 className="h-4 w-4 text-emerald-500 shrink-0" />;
      case 'invalid':
        return <XCircle className="h-4 w-4 text-red-500 shrink-0" />;
      case 'api-error':
        return <AlertTriangle className="h-4 w-4 text-amber-500 shrink-0" />;
      default:
        return null;
    }
  };

  const cnpjStatusColors: Record<CnpjStatus, string> = {
    idle: '',
    checking: 'border-blue-300 bg-blue-50/20',
    valid: 'border-emerald-300 bg-emerald-50/20',
    invalid: 'border-red-200 bg-red-50/30',
    'api-error': 'border-amber-200 bg-amber-50/20',
  };

  const cnpjMessageColors: Record<CnpjStatus, string> = {
    idle: '',
    checking: 'text-blue-500',
    valid: 'text-emerald-600',
    invalid: 'text-red-500',
    'api-error': 'text-amber-600',
  };

  return (
    <div className="min-h-screen bg-[var(--background)] flex items-center justify-center p-6 relative overflow-hidden">
      {/* Background Decorativo */}
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none">
        <div className="absolute top-[-10%] right-[-10%] w-[40%] h-[40%] bg-blue-500/5 rounded-full blur-[120px]" />
        <div className="absolute bottom-[-10%] left-[-10%] w-[40%] h-[40%] bg-indigo-500/5 rounded-full blur-[120px]" />
      </div>

      {/* Botão de Voltar */}
      <Link 
        to="/" 
        className="absolute top-8 left-8 flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 hover:text-blue-600 transition-all group z-50"
      >
        <ArrowLeft className="h-4 w-4 group-hover:-translate-x-1 transition-transform" />
        Voltar ao Início
      </Link>

      <div className="auth-card max-w-2xl w-full animate-in fade-in zoom-in-95 duration-700 relative z-10 my-12">
        <div className="flex flex-col items-center text-center mb-8">
          <Link to="/" className="mb-6 transform hover:scale-105 transition-transform">
            <Logo className="h-10 w-auto" />
          </Link>
          <div className="space-y-2">
            <h1 className="text-2xl font-black text-[var(--text-primary)]">Começar Agora</h1>
            <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Inicie sua jornada de adequação à LGPD</p>
          </div>
          
          <div className="mt-4 inline-flex items-center gap-2 px-4 py-1.5 bg-blue-50 rounded-full border border-blue-100 shadow-sm shadow-blue-500/5">
            <span className="text-[10px] font-black text-blue-400 uppercase tracking-wider">Plano Selecionado:</span>
            <span className="text-[10px] font-black text-blue-700 uppercase tracking-widest">{selectedPlan}</span>
          </div>
        </div>

        {/* Recomendação inteligente DPO Premium baseada em CNAE (LGPD Risco) */}
        {showPremiumRecommend && (
          <div className="p-5 bg-indigo-950/40 border border-indigo-500/30 rounded-3xl mb-6 flex items-start gap-4 animate-in slide-in-from-top duration-500">
            <div className="h-10 w-10 bg-indigo-500/10 text-indigo-400 rounded-xl flex items-center justify-center shrink-0 mt-0.5">
              <Sparkles className="h-5 w-5" />
            </div>
            <div className="space-y-1">
              <h4 className="text-xs font-black text-indigo-200 uppercase tracking-wider">Recomendação Inteligente de Conformidade</h4>
              <p className="text-[11px] text-indigo-300 font-medium leading-relaxed">
                Identificamos que seu setor principal (<span className="font-bold text-white">{cnpjMetadata?.cnae_fiscal_principal?.descricao}</span>) realiza tratamento de dados em larga escala ou sensíveis. Recomendamos o plano <span className="font-bold text-white">DPO Premium</span> para cobertura completa regulatória.
              </p>
              {selectedPlan !== 'personalite' && (
                <div className="pt-2">
                  <Link to="/#pricing" className="text-[9px] font-black text-indigo-400 uppercase tracking-widest hover:text-white transition-colors">
                    Alterar para DPO Premium →
                  </Link>
                </div>
              )}
            </div>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-5">
          {errors.general && (
            <div className="p-4 bg-red-50 text-red-600 text-xs font-bold rounded-2xl border border-red-100 flex items-center gap-3">
              <div className="h-2 w-2 rounded-full bg-red-500 animate-pulse" />
              {errors.general}
            </div>
          )}
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {/* Campo Nome */}
            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <label htmlFor="name" className={`auth-label ${errors.name ? 'text-red-500' : ''}`}>Seu Nome</label>
                {qsaVerified && (
                  <span className="flex items-center gap-1 text-[8px] font-black uppercase tracking-wider text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-100 animate-pulse">
                    <UserCheck className="h-2.5 w-2.5" /> Sócio Identificado (QSA)
                  </span>
                )}
              </div>
              <input type="text" id="name" required className={`auth-input ${errors.name ? 'border-red-200 bg-red-50/30' : ''}`} placeholder="João Silva" value={formData.name} onChange={(e) => setFormData({...formData, name: e.target.value})} />
              {errors.name && <p className="text-[10px] font-bold text-red-500 uppercase tracking-wider px-1">{errors.name}</p>}
            </div>

            {/* Campo E-mail */}
            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <label htmlFor="email" className={`auth-label ${errors.email ? 'text-red-500' : ''}`}>E-mail Profissional</label>
                {emailDomainMatch && (
                  <span className="flex items-center gap-1 text-[8px] font-black uppercase tracking-wider text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-100">
                    <MailCheck className="h-2.5 w-2.5" /> Domínio Corporativo Match
                  </span>
                )}
              </div>
              <input type="email" id="email" required className={`auth-input ${errors.email ? 'border-red-200 bg-red-50/30' : ''}`} placeholder="joao@empresa.com" value={formData.email} onChange={(e) => setFormData({...formData, email: e.target.value})} />
              {emailWarning && (
                <div className="flex items-start gap-1.5 text-[9px] text-amber-600 font-bold leading-normal px-1">
                  <AlertTriangle className="h-3.5 w-3.5 shrink-0 mt-0.5" />
                  <span>{emailWarning}</span>
                </div>
              )}
              {errors.email && <p className="text-[10px] font-bold text-red-500 uppercase tracking-wider px-1">{errors.email}</p>}
            </div>

            {/* Campo CNPJ */}
            <div className="space-y-2 md:col-span-2">
              <label htmlFor="cnpj" className={`auth-label ${errors.cnpj || cnpjValidation.status === 'invalid' ? 'text-red-500' : ''}`}>
                Documento (CNPJ)
              </label>
              <div className="relative">
                <input
                  type="text"
                  id="cnpj"
                  required
                  maxLength={18}
                  className={`auth-input pr-10 transition-all ${cnpjStatusColors[cnpjValidation.status]} ${errors.cnpj ? 'border-red-200 bg-red-50/30' : ''}`}
                  placeholder="00.000.000/0000-00"
                  value={formData.cnpj}
                  onChange={handleCnpjChange}
                  onBlur={() => {
                    if (formData.cnpj.replace(/\D/g, '').length === 14) {
                      triggerCnpjValidation(formData.cnpj);
                    }
                  }}
                />
                {cnpjValidation.status !== 'idle' && (
                  <div className="absolute right-4 top-1/2 -translate-y-1/2">
                    {renderCnpjStatusIcon()}
                  </div>
                )}
              </div>

              {cnpjValidation.status !== 'idle' && cnpjValidation.message && (
                <div className={`flex items-start gap-2 px-1 ${cnpjMessageColors[cnpjValidation.status]}`}>
                  <p className="text-[10px] font-bold leading-relaxed">{cnpjValidation.message}</p>
                </div>
              )}

              {/* Botão de verificar manualmente se estiver ocioso */}
              {cnpjValidation.status === 'idle' && formData.cnpj.replace(/\D/g, '').length === 14 && (
                <button
                  type="button"
                  onClick={() => triggerCnpjValidation(formData.cnpj)}
                  className="text-[10px] font-black uppercase tracking-wider text-blue-500 hover:text-blue-700 transition-colors px-1"
                >
                  Verificar CNPJ na Receita Federal →
                </button>
              )}
            </div>

            {/* Nome da Organização */}
            <div className="md:col-span-2 space-y-2">
              <label htmlFor="companyName" className={`auth-label ${errors.companyName ? 'text-red-500' : ''}`}>Nome da Organização</label>
              <input type="text" id="companyName" required className={`auth-input ${errors.companyName ? 'border-red-200 bg-red-50/30' : ''}`} placeholder="Empresa S.A." value={formData.companyName} onChange={(e) => setFormData({...formData, companyName: e.target.value})} />
              {errors.companyName && <p className="text-[10px] font-bold text-red-500 uppercase tracking-wider px-1">{errors.companyName}</p>}
            </div>

            {/* Endereço completo (Auto-preenchido pelo CNPJ / Editável) */}
            <div className="md:col-span-2 space-y-2">
              <label htmlFor="address" className="auth-label">Endereço Completo</label>
              <input 
                type="text" 
                id="address" 
                required 
                className="auth-input" 
                placeholder="Rua, Número, Bairro, Cidade - UF" 
                value={formData.address} 
                onChange={(e) => setFormData({...formData, address: e.target.value})} 
              />
              <p className="text-[9px] text-slate-400 font-medium px-1">Preenchido automaticamente a partir da base do CNPJ. Pode ser modificado se necessário.</p>
            </div>

            {/* Sua Senha */}
            <div className="md:col-span-2 space-y-2">
              <label htmlFor="password" className={`auth-label ${errors.password ? 'text-red-500' : ''}`}>Sua Senha</label>
              <input type="password" id="password" required minLength={6} className={`auth-input ${errors.password ? 'border-red-200 bg-red-50/30' : ''}`} placeholder="••••••••" value={formData.password} onChange={(e) => setFormData({...formData, password: e.target.value})} />
              {errors.password && <p className="text-[10px] font-bold text-red-500 uppercase tracking-wider px-1">{errors.password}</p>}
            </div>
          </div>

          <div className="pt-6 space-y-4">
            <button 
              type="submit" 
              disabled={loading || cnpjValidation.status === 'checking'} 
              className="btn-primary w-full py-4 rounded-2xl text-xs font-black uppercase tracking-[0.2em] shadow-xl shadow-blue-500/20 hover:shadow-blue-500/30 active:scale-[0.98] transition-all disabled:opacity-50"
            >
              {loading 
                ? <Loader2 className="h-5 w-5 animate-spin mx-auto" />
                : cnpjValidation.status === 'checking'
                  ? <span className="flex items-center justify-center gap-2"><Loader2 className="h-4 w-4 animate-spin" /> Verificando CNPJ…</span>
                  : 'Finalizar e Acessar'
              }
            </button>

            <div className="flex items-center gap-4 py-2">
              <div className="h-px flex-1 bg-slate-100" />
              <span className="text-[10px] font-black text-slate-300 uppercase tracking-widest">ou</span>
              <div className="h-px flex-1 bg-slate-100" />
            </div>

            <Link 
              to="/login" 
              className="flex items-center justify-center w-full py-4 border-2 border-slate-100 rounded-2xl text-[10px] font-black uppercase tracking-[0.2em] text-slate-500 hover:bg-slate-50 hover:border-slate-200 transition-all"
            >
              Já tenho uma conta
            </Link>
          </div>

          <p className="text-[10px] text-slate-400 text-center leading-relaxed font-bold uppercase tracking-widest max-w-[280px] mx-auto">
            Ao continuar, você concorda com nossos <span className="text-blue-500 cursor-pointer hover:underline">Termos</span> e <span className="text-blue-500 cursor-pointer hover:underline">Privacidade</span>.
          </p>
        </form>
      </div>

      {/* Footer minimalista */}
      <div className="absolute bottom-8 text-[10px] font-black text-slate-300 uppercase tracking-[0.3em] pointer-events-none">
        GUARDIÃO © {new Date().getFullYear()}
      </div>
    </div>
  );
};
