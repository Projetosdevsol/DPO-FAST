
import React, { useState, useRef } from 'react';
import { 
  Check, ChevronRight, ChevronLeft, Save, Plus, 
  Trash2, Layers, ClipboardCheck, Database, Cloud, Lock, 
  Share2, Info, ShieldCheck, Loader2, Edit3, Copy, AlertCircle,
  Briefcase, MessageSquare, Zap, HardDrive, Shield, UserCheck, RefreshCw, Trash,
  CheckCircle2, Users, Scale, BookOpen, Lightbulb, HelpCircle, Upload, Paperclip, FileText, X
} from 'lucide-react';
import { QuestionnaireData, SectorMapping, DataProcess, SectorAnswers } from '../types';
import { storage } from '../lib/firebase';
import { ref, uploadBytesResumable, getDownloadURL } from 'https://www.gstatic.com/firebasejs/10.8.0/firebase-storage.js';
import { useAuth } from '../context/AuthContext';

interface QuestionnaireProps {
  initialData?: QuestionnaireData | null;
  onSave: (data: QuestionnaireData, isFinal?: boolean) => Promise<void>;
}

const SECTOR_TEMPLATES: Record<string, { name: string; description: string }[]> = {
  'RH / DP': [
    { name: 'Recrutamento e Seleção', description: 'Coleta de currículos e triagem de candidatos.' },
    { name: 'Gestão de Folha de Pagamento', description: 'Processamento de salários e encargos.' },
    { name: 'Gestão de Benefícios', description: 'Plano de saúde, vale transporte e outros.' }
  ],
  'Marketing': [
    { name: 'Envio de Newsletter', description: 'Disparo de comunicações por e-mail para leads.' },
    { name: 'Campanhas em Redes Sociais', description: 'Análise de perfil e redirecionamento de anúncios.' }
  ],
  'Vendas': [
    { name: 'Gestão de Leads no CRM', description: 'Registro de contatos comerciais para vendas.' },
    { name: 'Contratação de Serviços', description: 'Fechamento de contrato e faturamento.' }
  ],
  'Atendimento': [
    { name: 'Suporte por WhatsApp', description: 'Atendimento direto ao cliente por chat.' },
    { name: 'Ouvidoria', description: 'Tratamento de reclamações e elogios.' }
  ]
};

const LEGAL_BASES_INFO: Record<string, { label: string; description: string; hint: string; why: string }> = {
  'Consentimento': {
    label: 'Consentimento',
    description: 'Quando o titular autoriza expressamente o uso dos dados para uma finalidade específica.',
    hint: 'Ex: Envio de marketing, newsletters ou uso de imagem para redes sociais.',
    why: 'Selecione esta opção se você perguntou ao cliente se ele aceita e ele teve a opção de dizer "no" sem que isso impedisse a entrega do serviço principal.'
  },
  'Obrigação Legal ou Regulatória': {
    label: 'Obrigação Legal ou Regulatória',
    description: 'Quando o tratamento é exigido por alguma lei brasileira ou norma de órgão regulador.',
    hint: 'Ex: Enviar dados ao eSocial, emitir notas fiscais ou guardar registros por ordem da Receita Federal.',
    why: 'Escolha esta base se você trata os dados porque "a lei te obriga". Nestes casos, o cliente não pode se opor, pois a lei está acima da vontade dele.'
  },
  'Execução de Contrato': {
    label: 'Execução de Contrato',
    description: 'Quando os dados são indispensáveis para cumprir o que foi prometido em um contrato ou termos de uso.',
    hint: 'Ex: Endereço para entrega, CPF para emissão de boleto ou dados bancários para pagamento.',
    why: 'Use quando for impossível realizar o serviço contratado sem esses dados. É a base mais comum para vendas e prestação de serviços.'
  },
  'Exercício Regular de Direitos': {
    label: 'Exercício Regular de Direitos',
    description: 'Uso de dados para se defender ou iniciar processos na justiça ou em órgãos administrativos.',
    hint: 'Ex: Guardar o histórico de conversas para provar que um serviço foi realizado em caso de processo judicial.',
    why: 'Selecione se o motivo de guardar os dados é puramente para segurança jurídica futura da empresa.'
  },
  'Legítimo Interesse': {
    label: 'Legítimo Interesse',
    description: 'Quando o tratamento é necessário para interesses da empresa, desde que não fira direitos do titular.',
    hint: 'Ex: Prevenção a fraudes, análises de mercado, segurança do ambiente físico (câmeras) ou melhoria de processos.',
    why: 'É uma base "flexível". Escolha se o tratamento traz um benefício para a empresa e o cliente já espera que isso aconteça (expectativa razoável).'
  },
  'Proteção do Crédito': {
    label: 'Proteção do Crédito',
    description: 'Utilizado especificamente para análise de risco financeiro e proteção contra inadimplência.',
    hint: 'Ex: Consulta ao Serasa/SPC antes de liberar um parcelamento.',
    why: 'Selecione apenas se a finalidade principal for avaliar se o cliente tem capacidade de pagar.'
  },
  'Proteção da Vida / Incolumidade Física': {
    label: 'Proteção da Vida / Incolumidade Física',
    description: 'Uso de dados em situações extremas onde há risco imediato à vida do titular ou de terceiros.',
    hint: 'Ex: Cadastro de alergias em hospitais para atendimento de urgência ou brigada de incêndio.',
    why: 'Use em situações críticas de emergência onde a segurança física está em jogo.'
  }
};

const LEGAL_BASES = Object.keys(LEGAL_BASES_INFO);

const DATA_TYPES_INFO = [
  { id: 'Nome', label: 'Nome', description: 'Nome completo, apelido ou nome social do titular.' },
  { id: 'CPF/RG', label: 'CPF/RG', description: 'Documentos oficiais (CPF, RG, CNH, Passaporte, PIS).' },
  { id: 'E-mail', label: 'E-mail', description: 'Endereço de correio eletrônico pessoal ou profissional.' },
  { id: 'Endereco', label: 'Endereço', description: 'Localização residencial ou comercial (Rua, CEP, Bairro).' },
  { id: 'Telefone', label: 'Telefone', description: 'Número de telefone fixo, celular ou contato de WhatsApp.' },
  { id: 'Financeiro', label: 'Financeiro', description: 'Dados bancários, número de conta, agência, cartão de crédito ou transações.' },
  { id: 'Nacionalidade', label: 'Nacionalidade', description: 'País de origem, naturalidade e status de residência.' },
  { id: 'Educacional', label: 'Educação', description: 'Histórico escolar, acadêmico, diplomas, certificados e notas.' },
  { id: 'Trabalho', label: 'Relação de Trabalho', description: 'Número de CTPS, PIS, histórico profissional e cargo.' },
  { id: 'Sindicato', label: 'Sindicato', description: 'DADO SENSÍVEL: Filiação sindical ou associativa profissional.', isSensitive: true },
  { id: 'Parental', label: 'Info. Parentais', description: 'Dados de filhos, dependentes, certidões de nascimento ou estado civil.' },
  { id: 'Saude', label: 'Saúde', description: 'DADO SENSÍVEL: Prontuários, laudos médicos, exames ou histórico de saúde.', isSensitive: true },
  { id: 'Biometria', label: 'Biometria', description: 'DADO SENSÍVEL: Digitais, reconhecimento facial, íris ou padrão de voz.', isSensitive: true },
  { id: 'GeneroOrientacao', label: 'Gênero e Orientação', description: 'DADO SENSÍVEL: Identidade de gênero e orientação sexual.', isSensitive: true },
  { id: 'EtniaRaca', label: 'Etnia/Raça', description: 'DADO SENSÍVEL: Origem racial ou étnica.', isSensitive: true }
];

// --- COMPONENTE INTERNO REATORADO PARA FORA ---
interface ProcessFormWizardProps {
  process: DataProcess;
  activeSectorId: string;
  data: QuestionnaireData;
  onSave: (updatedData: QuestionnaireData, isFinal?: boolean) => Promise<void>;
  setView: (v: 'mapping' | 'sector-hub' | 'process-form') => void;
}

const ProcessFormWizard: React.FC<ProcessFormWizardProps> = ({ process, activeSectorId, data, onSave, setView }) => {
  const { authState } = useAuth();
  const [answers, setAnswers] = useState<SectorAnswers>(process.answers || {
    processName: process.name,
    responsibleRole: '',
    purpose: process.description,
    collectedData: [],
    hasSensitiveData: false,
    dataSubjects: [],
    estimatedVolume: 'Baixo (1-500 registros/mês)',
    legalBasis: '',
    storageType: 'Digital',
    collectionChannels: [],
    hasBackups: false,
    hasEncryption: false,
    isSharedInternal: false,
    isSharedExternal: false,
    isInternationalTransfer: false,
    accessControl: 'Apenas Responsáveis',
    hasMFA: false,
    hasIncidentPlan: false,
    hasStaffTraining: false,
    retentionPeriod: '',
    deletionMethod: 'Exclusão Permanente',
    hasSecondaryUse: false
  });

  const [currentStep, setCurrentStep] = useState(process.lastStep || 1);
  const [isSaving, setIsSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [hoveredDataId, setHoveredDataId] = useState<string | null>(null);
  const [activeTooltipId, setActiveTooltipId] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const updateStep = async (step: number, finalize: boolean = false, goBackToHub: boolean = false) => {
    setIsSaving(true);
    const updatedSectors = (data.sectors || []).map(s => 
      s.id === activeSectorId ? {
        ...s,
        processes: (s.processes || []).map(p => 
          p.id === process.id ? { 
            ...p, 
            name: answers.processName || p.name, 
            description: answers.purpose || p.description, 
            answers, 
            lastStep: step, 
            status: (finalize ? 'completed' : 'in_progress') as any 
          } : p
        )
      } : s
    );
    const updatedData = { ...data, sectors: updatedSectors, lastUpdated: new Date().toISOString() };
    await onSave(updatedData);
    setIsSaving(false);
    if (finalize || goBackToHub) setView('sector-hub');
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !authState.user) return;

    setUploading(true);
    setUploadProgress(0);

    const storageRef = ref(storage, `shared_contracts/${authState.user.id}/${process.id}_${file.name}`);
    const uploadTask = uploadBytesResumable(storageRef, file);

    uploadTask.on('state_changed', 
      (snapshot) => {
        const progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
        setUploadProgress(progress);
      }, 
      (error) => {
        console.error("Upload error:", error);
        setUploading(false);
        alert("Erro ao enviar arquivo.");
      }, 
      async () => {
        const url = await getDownloadURL(uploadTask.snapshot.ref);
        setAnswers({ 
          ...answers, 
          sharedExternalDocumentUrl: url, 
          sharedExternalDocumentName: file.name 
        });
        setUploading(false);
      }
    );
  };

  const steps = [
    { id: 1, title: 'Contexto', icon: Info },
    { id: 2, title: 'Dados', icon: Database },
    { id: 3, title: 'Jurídico', icon: ClipboardCheck },
    { id: 4, title: 'Infra', icon: Cloud },
    { id: 5, title: 'Fluxos', icon: Share2 },
    { id: 6, title: 'Defesa', icon: Lock },
    { id: 7, title: 'Retenção', icon: Check }
  ];

  const FieldLabel = ({ id, label, why, how, tip }: { id: string; label: string; why: string; how: string; tip?: string }) => (
    <div className="flex items-center justify-between mb-2 ml-1 relative">
      <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.15em]">{label}</label>
      <div className="relative">
        <button 
          onMouseEnter={() => setActiveTooltipId(id)}
          onMouseLeave={() => setActiveTooltipId(null)}
          className="p-1 text-slate-300 hover:text-blue-600 transition-colors"
        >
          <HelpCircle className="h-4 w-4" />
        </button>
        {activeTooltipId === id && (
          <div className="absolute z-[150] right-0 bottom-full mb-3 w-80 p-6 bg-slate-950 text-white rounded-[1.5rem] shadow-[0_20px_50px_rgba(0,0,0,0.5)] animate-in fade-in zoom-in-95 border border-slate-700 ring-1 ring-white/10 pointer-events-none">
             <div className="space-y-5">
                <div>
                  <p className="text-[10px] font-black text-blue-400 uppercase tracking-[0.15em] mb-1.5 flex items-center gap-2">
                     <div className="h-1.5 w-1.5 rounded-full bg-blue-400" /> Por que preencher?
                  </p>
                  <p className="text-xs font-bold text-white leading-relaxed">{why}</p>
                </div>
                <div className="pt-4 border-t border-white/10">
                  <p className="text-[10px] font-black text-emerald-400 uppercase tracking-[0.15em] mb-1.5 flex items-center gap-2">
                     <div className="h-1.5 w-1.5 rounded-full bg-emerald-400" /> Como responder?
                  </p>
                  <p className="text-xs font-medium text-slate-100 leading-relaxed">{how}</p>
                </div>
                {tip && (
                  <div className="pt-3 flex items-center gap-2.5 bg-white/5 p-3 rounded-xl border border-white/5">
                     <Lightbulb className="h-4 w-4 text-amber-400 shrink-0" />
                     <p className="text-[11px] font-bold text-amber-100 leading-snug italic">{tip}</p>
                  </div>
                )}
             </div>
             <div className="absolute top-full right-2 border-[10px] border-transparent border-t-slate-950" />
          </div>
        )}
      </div>
    </div>
  );

  const Toggle = ({ id, label, value, onChange, icon: Icon, why, how, tip }: any) => (
    <div className="space-y-2 relative">
      <button onClick={() => onChange(!value)} className={`w-full p-4 rounded-2xl border text-left flex items-center justify-between transition-all ${value ? 'bg-blue-600 border-blue-600 text-white shadow-lg' : 'bg-slate-50 border-slate-200 text-slate-600'}`}>
        <div className="flex items-center gap-3">
          {Icon && <Icon className="h-4 w-4" />}
          <span className="text-xs font-bold">{label}</span>
        </div>
        <div className="flex items-center gap-2">
           <div 
             onMouseEnter={() => setActiveTooltipId(id)}
             onMouseLeave={() => setActiveTooltipId(null)}
             className={`p-1 rounded-full transition-colors ${value ? 'text-blue-200 hover:text-white' : 'text-slate-300 hover:text-blue-500'}`}
           >
             <HelpCircle className="h-4 w-4" />
           </div>
           {value ? <CheckCircle2 className="h-4 w-4" /> : <div className="h-4 w-4 rounded-full border-2 border-slate-200" />}
        </div>
      </button>
      {activeTooltipId === id && (
          <div className="absolute z-[150] right-0 bottom-full mb-3 w-80 p-6 bg-slate-950 text-white rounded-[1.5rem] shadow-[0_20px_50px_rgba(0,0,0,0.5)] animate-in fade-in zoom-in-95 border border-slate-700 ring-1 ring-white/10 pointer-events-none">
             <div className="space-y-5 text-left">
                <div>
                  <p className="text-[10px] font-black text-blue-400 uppercase tracking-[0.15em] mb-1.5 flex items-center gap-2">
                     <div className="h-1.5 w-1.5 rounded-full bg-blue-400" /> Por que preencher?
                  </p>
                  <p className="text-xs font-bold text-white leading-relaxed">{why}</p>
                </div>
                <div className="pt-4 border-t border-white/10">
                  <p className="text-[10px] font-black text-emerald-400 uppercase tracking-[0.15em] mb-1.5 flex items-center gap-2">
                     <div className="h-1.5 w-1.5 rounded-full bg-emerald-400" /> Como responder?
                  </p>
                  <p className="text-xs font-medium text-slate-100 leading-relaxed">{how}</p>
                </div>
                {tip && (
                  <div className="pt-3 flex items-center gap-2.5 bg-white/5 p-3 rounded-xl border border-white/5 text-left">
                     <Lightbulb className="h-4 w-4 text-amber-400 shrink-0" />
                     <p className="text-[11px] font-bold text-amber-100 leading-snug italic">{tip}</p>
                  </div>
                )}
             </div>
             <div className="absolute top-full right-2 border-[10px] border-transparent border-t-slate-950" />
          </div>
        )}
    </div>
  );

  return (
    <div className="max-w-4xl mx-auto space-y-6 page-transition">
      <div className="bg-white p-6 rounded-[2.5rem] border border-slate-100 shadow-sm sticky top-2 z-40">
         <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 bg-blue-600 text-white rounded-xl flex items-center justify-center font-black">{currentStep}</div>
              <div>
                <h3 className="font-bold text-slate-900 leading-tight">{answers.processName || process.name}</h3>
                <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">Setor Ativo</p>
              </div>
            </div>
            {isSaving && <div className="flex items-center gap-2 text-[10px] font-black text-blue-600 uppercase animate-pulse"><Loader2 className="h-3 w-3 animate-spin" /> Salvando...</div>}
         </div>
         <div className="flex justify-between relative px-2">
           <div className="absolute top-1/2 left-0 w-full h-1 bg-slate-100 -translate-y-1/2 z-0 rounded-full" />
           <div className="absolute top-1/2 left-0 h-1 bg-blue-600 -translate-y-1/2 z-0 transition-all duration-700 rounded-full" style={{ width: `${((currentStep - 1) / 6) * 100}%` }} />
           {steps.map(s => (
             <div key={s.id} className={`relative z-10 h-8 w-8 rounded-full border-4 flex items-center justify-center transition-all ${currentStep >= s.id ? 'bg-blue-600 border-blue-100 text-white' : 'bg-white border-slate-50 text-slate-300'}`}>
               <s.icon className="h-3 w-3" />
             </div>
           ))}
         </div>
      </div>

      <div className="bg-white p-10 rounded-[2.5rem] border border-slate-100 shadow-xl min-h-[500px]">
         {currentStep === 1 && (
           <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4">
             <div className="flex items-center gap-3 mb-2">
               <div className="p-3 bg-blue-50 rounded-2xl text-blue-600"><Info className="h-6 w-6" /></div>
               <h4 className="text-xl font-black text-slate-900">Configuração do Contexto</h4>
             </div>
             
             <div className="space-y-8">
               <div>
                 <FieldLabel 
                   id="fn-name"
                   label="Nome Oficial da Atividade"
                   why="Para identificar este fluxo no seu Registro de Atividades (RAT). Sem um nome claro, você não saberá qual processo está protegendo em caso de fiscalização." 
                   how="Use nomes simples que descrevam a ação. Exemplos: 'Folha de Pagamento', 'Campanha de E-mail Marketing' ou 'Contratação de Software'." 
                 />
                 <input type="text" value={answers.processName} onChange={e => setAnswers({...answers, processName: e.target.value})} className="w-full p-4 rounded-2xl bg-slate-50 border border-slate-200 focus:bg-white focus:border-blue-600 focus:ring-4 focus:ring-blue-50 outline-none transition-all text-slate-950 font-bold placeholder:text-slate-400" />
               </div>
               
               <div>
                 <FieldLabel 
                   id="fn-role"
                   label="Responsável pela Execução (Cargo)"
                   why="A LGPD exige que a empresa saiba quem tem o controle operacional do dado (Accountability). Isso ajuda a definir quem deve receber treinamento específico." 
                   how="Insira o CARGO ou DEPARTAMENTO, não o nome da pessoa física. Ex: 'Gerente Comercial' ou 'Equipe de Faturamento'." 
                 />
                 <input type="text" value={answers.responsibleRole} onChange={e => setAnswers({...answers, responsibleRole: e.target.value})} className="w-full p-4 rounded-2xl bg-slate-50 border border-slate-200 focus:bg-white focus:border-blue-600 focus:ring-4 focus:ring-blue-50 outline-none transition-all text-slate-950 font-bold placeholder:text-slate-400" placeholder="Ex: Analista de RH Senior" />
               </div>

               <div>
                 <FieldLabel 
                   id="fn-purpose"
                   label="Finalidade Específica (Art. 6º, I)"
                   why="O Princípio da Finalidade é a regra n.º 1 da LGPD. Você não pode coletar dados 'por via das dúvidas', deve haver um objetivo legítimo e explícito." 
                   how="Explique para que o dado é usado na prática. Ex: 'Dados coletados para processar a venda e emitir a nota fiscal obrigatória por lei'." 
                   tip="Se você não consegue explicar a finalidade, talvez não devesse estar coletando esse dado."
                 />
                 <textarea value={answers.purpose} onChange={e => setAnswers({...answers, purpose: e.target.value})} className="w-full p-4 rounded-2xl bg-slate-50 border border-slate-200 focus:bg-white focus:border-blue-600 focus:ring-4 focus:ring-blue-50 outline-none transition-all text-slate-950 font-bold h-32 resize-none placeholder:text-slate-400" placeholder="Descreva exatamente por que esses dados são tratados..." />
               </div>
             </div>
           </div>
         )}

         {currentStep === 2 && (
           <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4">
             <div className="flex items-center gap-3 mb-2">
               <div className="p-3 bg-purple-50 rounded-2xl text-purple-600"><Database className="h-6 w-6" /></div>
               <h4 className="text-xl font-black text-slate-900">Inventário de Dados</h4>
             </div>

             <div className="bg-blue-50 p-4 rounded-2xl border border-blue-100 mb-6">
               <p className="text-xs font-bold text-blue-700">Selecione abaixo quais tipos de informação você manipula nesta atividade. Use o ícone de interrogação acima de cada categoria se tiver dúvidas.</p>
             </div>
             
             <div className="grid grid-cols-2 md:grid-cols-4 gap-4 relative">
               {DATA_TYPES_INFO.map(d => {
                 const isSelected = (answers.collectedData || []).includes(d.id);
                 const isHovered = hoveredDataId === d.id;

                 return (
                   <div key={d.id} className="relative">
                     <button 
                       onMouseEnter={() => setHoveredDataId(d.id)}
                       onMouseLeave={() => setHoveredDataId(null)}
                       onClick={() => {
                         const list = isSelected ? (answers.collectedData || []).filter(i => i !== d.id) : [...(answers.collectedData || []), d.id];
                         const sensitiveIds = ['Sindicato', 'Saude', 'Biometria', 'GeneroOrientacao', 'EtniaRaca'];
                         setAnswers({...answers, collectedData: list, hasSensitiveData: list.some(i => sensitiveIds.includes(i))});
                       }} 
                       className={`w-full p-5 rounded-2xl border text-xs font-bold transition-all text-left flex items-center justify-between relative group ${isSelected ? 'bg-blue-600 border-blue-600 text-white shadow-xl shadow-blue-100 scale-[1.02]' : 'bg-white border-slate-100 text-slate-600 hover:border-blue-200 hover:bg-slate-50 shadow-sm'}`}
                     >
                       <div className="flex items-center gap-2">
                         {d.isSensitive && <Shield className={`h-3 w-3 ${isSelected ? 'text-blue-200' : 'text-amber-500'}`} />}
                         {d.label}
                       </div>
                       {isSelected ? <Check className="h-4 w-4" /> : <HelpCircle className="h-4 w-4 text-slate-300 group-hover:text-blue-400 transition-colors" />}
                     </button>

                     {isHovered && (
                       <div className="absolute z-[150] bottom-full left-1/2 -translate-x-1/2 mb-2 w-64 p-5 bg-slate-950 text-white text-[11px] rounded-[1.25rem] shadow-[0_25px_50px_-12px_rgba(0,0,0,0.5)] animate-in fade-in zoom-in-95 border border-slate-700 ring-1 ring-white/10 leading-relaxed pointer-events-none">
                         <div className="flex items-center gap-2 mb-3">
                           <div className={`h-2 w-2 rounded-full ${d.isSensitive ? 'bg-amber-500' : 'bg-blue-500'}`} />
                           <p className="font-black uppercase tracking-widest text-slate-100">{d.label}</p>
                         </div>
                         <p className="font-bold text-slate-100 mb-2">Por que preencher?</p>
                         <p className="font-medium text-slate-300">{d.description}</p>
                         <div className="absolute top-full left-1/2 -translate-x-1/2 border-[8px] border-transparent border-t-slate-950" />
                       </div>
                     )}
                   </div>
                 );
               })}
             </div>

             <div className="pt-8 border-t border-slate-100">
               <FieldLabel 
                 id="fn-subjects"
                 label="Quem são os titulares?"
                 why="Titulares são as pessoas 'donas' dos dados. A LGPD dá direitos diferentes para cada categoria (ex: um funcionário tem direitos diferentes de um lead)." 
                 how="Selecione todos os grupos de pessoas que possuem dados transitando neste processo." 
               />
               <div className="flex flex-wrap gap-2 mb-4">
                 {['Clientes', 'Colaboradores', 'Candidatos', 'Fornecedores', 'Leads'].map(t => (
                   <button key={t} onClick={() => setAnswers({...answers, dataSubjects: (answers.dataSubjects || []).includes(t) ? answers.dataSubjects.filter(i => i !== t) : [...(answers.dataSubjects || []), t]})} className={`px-5 py-2.5 rounded-full border text-xs font-bold transition-all ${answers.dataSubjects?.includes(t) ? 'bg-slate-900 text-white border-slate-900 shadow-lg' : 'bg-white text-slate-500 border-slate-200 hover:border-slate-300'}`}>{t}</button>
                 ))}
               </div>
             </div>
           </div>
         )}

         {currentStep === 3 && (
           <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4">
             <div className="flex items-center gap-3 mb-2">
               <div className="p-3 bg-green-50 rounded-2xl text-green-600"><ClipboardCheck className="h-6 w-6" /></div>
               <h4 className="text-xl font-black text-slate-900">Fundamentação Jurídica</h4>
             </div>
             
             <div className="bg-slate-50 p-6 rounded-[2rem] border border-slate-100 space-y-4">
               <div className="flex items-center gap-3 text-slate-800">
                  <Scale className="h-5 w-5 text-indigo-600" />
                  <h5 className="text-sm font-black uppercase tracking-tight">O que é a Base Legal?</h5>
               </div>
               <p className="text-xs text-slate-600 leading-relaxed font-medium">
                 De acordo com a LGPD (Art. 7º), todo tratamento de dados pessoais precisa ter uma "âncora jurídica". Isso significa que você deve justificar legalmente por que coleta e guarda essas informações.
               </p>
               <div className="flex items-start gap-2 bg-white/60 p-3 rounded-xl">
                 <Lightbulb className="h-4 w-4 text-amber-500 mt-0.5 shrink-0" />
                 <p className="text-[11px] font-bold text-slate-600">
                   Dica: Se o dado é essencial para entregar o produto, use <span className="text-blue-600">Execução de Contrato</span>. Se for para marketing opcional, use <span className="text-blue-600">Consentimento</span>.
                 </p>
               </div>
             </div>

             <div className="space-y-6">
               <div>
                 <FieldLabel 
                   id="fn-legal"
                   label="Base Legal (Art. 7º LGPD)"
                   why="Todo tratamento de dados pessoais deve estar fundamentado em uma das hipóteses previstas em lei. Sem isso, o tratamento é ilegal."
                   how="Escolha a justificativa que melhor se aplica ao seu caso de uso comercial."
                 />
                 <select 
                   value={answers.legalBasis} 
                   onChange={e => setAnswers({...answers, legalBasis: e.target.value})} 
                   className="w-full p-4 rounded-2xl bg-slate-50 border border-slate-200 font-bold text-slate-950 outline-none focus:ring-4 focus:ring-blue-50 focus:bg-white transition-all"
                 >
                   <option value="">Selecione a base jurídica...</option>
                   {LEGAL_BASES.map(b => <option key={b} value={b}>{LEGAL_BASES_INFO[b].label}</option>)}
                 </select>
               </div>

               {answers.legalBasis && LEGAL_BASES_INFO[answers.legalBasis] && (
                 <div className="p-6 bg-blue-50 border border-blue-100 rounded-[2rem] animate-in zoom-in-95 space-y-4">
                   <div className="flex items-center gap-3">
                     <div className="p-2 bg-blue-600 text-white rounded-xl">
                       <Info className="h-4 w-4" />
                     </div>
                     <h5 className="text-xs font-black uppercase text-blue-900 tracking-tight">Análise Detalhada</h5>
                   </div>
                   
                   <div className="space-y-3 text-left">
                      <div className="space-y-1">
                        <p className="text-[9px] font-black text-blue-400 uppercase tracking-widest">O que significa?</p>
                        <p className="text-sm font-bold text-blue-800 leading-relaxed">
                          {LEGAL_BASES_INFO[answers.legalBasis].description}
                        </p>
                      </div>

                      <div className="space-y-1">
                        <p className="text-[9px] font-black text-blue-400 uppercase tracking-widest">Por que selecionar esta opção?</p>
                        <p className="text-[11px] font-medium text-blue-700 leading-relaxed">
                          {LEGAL_BASES_INFO[answers.legalBasis].why}
                        </p>
                      </div>

                      <div className="flex items-start gap-2 bg-white/50 p-3 rounded-xl">
                        <BookOpen className="h-4 w-4 text-blue-500 mt-0.5 shrink-0" />
                        <p className="text-[11px] font-medium text-blue-700 italic leading-snug">
                          <strong>Exemplo prático:</strong> {LEGAL_BASES_INFO[answers.legalBasis].hint}
                        </p>
                      </div>
                   </div>
                 </div>
               )}

               {answers.legalBasis === 'Consentimento' && (
                 <div className="space-y-4 animate-in zoom-in-95">
                   <div>
                     <FieldLabel 
                       id="fn-consent-mechanism"
                       label="Como o consentimento é coletado?"
                       why="Se a base é consentimento, você precisa provar que ele foi livre. Se não houver registro, o tratamento é nulo." 
                       how="Descreva o canal. Ex: 'E-mail de confirmação', 'Checkbox em Landing Page' ou 'Assinatura em papel'." 
                     />
                     <input type="text" value={answers.consentMechanism} onChange={e => setAnswers({...answers, consentMechanism: e.target.value})} className="w-full p-4 rounded-2xl bg-slate-50 border border-slate-200 font-bold text-slate-950 focus:bg-white focus:border-blue-600 outline-none transition-all placeholder:text-slate-400" placeholder="Ex: Checkbox no formulário do site" />
                   </div>
                   <Toggle 
                     id="fn-consent-proof"
                     label="A empresa possui prova/log dessa coleta?" 
                     value={answers.hasConsentProof} 
                     onChange={(v: boolean) => setAnswers({...answers, hasConsentProof: v})} 
                     icon={Shield} 
                     why="O ônus da prova é da empresa. Se um titular negar que deu consentimento, você precisa mostrar o log (IP, Data, Hora)." 
                     how="Responda SIM se você guarda esse registro de forma organizada." 
                   />
                 </div>
               )}
             </div>
           </div>
         )}

         {currentStep === 4 && (
           <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4">
             <div className="flex items-center gap-3 mb-2">
               <div className="p-3 bg-amber-50 rounded-2xl text-amber-600"><Cloud className="h-6 w-6" /></div>
               <h4 className="text-xl font-black text-slate-900">Armazenamento e Infraestrutura</h4>
             </div>
             <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
               <div>
                 <FieldLabel 
                   id="fn-storage"
                   label="Tipo de Armazenamento"
                   why="Para avaliar o risco de perda ou acesso indevido. Roubo de papel exige tranca física; invasão digital exige antivírus e firewall." 
                   how="Selecione o formato predominante onde as informações ficam guardadas." 
                 />
                 <select value={answers.storageType} onChange={e => setAnswers({...answers, storageType: e.target.value as any})} className="w-full p-4 rounded-2xl bg-slate-50 border border-slate-200 font-bold text-slate-950 outline-none focus:ring-4 focus:ring-blue-50 focus:bg-white transition-all">
                   <option value="Digital">100% Digital (Nuvem/Local)</option>
                   <option value="Físico">Apenas Físico (Papel/Arquivo)</option>
                   <option value="Híbrido">Híbrido (Digital e Físico)</option>
                 </select>
               </div>
               <div>
                 <FieldLabel 
                   id="fn-cloud"
                   label="Servidor/Cloud Usado"
                   why="Identificar quem é o seu 'operador' (subcontratado). Se o servidor deles falhar, sua empresa pode ser responsabilizada." 
                   how="Informe o nome da plataforma ou empresa onde os dados ficam salvos." 
                 />
                 <input type="text" value={answers.cloudProvider} onChange={e => setAnswers({...answers, cloudProvider: e.target.value})} className="w-full p-4 rounded-2xl bg-slate-50 border border-slate-200 font-bold text-slate-950 focus:bg-white focus:border-blue-600 outline-none transition-all placeholder:text-slate-400" placeholder="Ex: Google Drive, AWS, Hostgator..." />
               </div>
             </div>
             <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4 border-t border-slate-50">
               <Toggle 
                id="fn-backup"
                label="Os dados possuem Backup regular?" 
                value={answers.hasBackups} 
                onChange={(v: boolean) => setAnswers({...answers, hasBackups: v})} 
                icon={RefreshCw} 
                why="A LGPD protege a disponibilidade. Se você perder os dados de um cliente e não tiver backup, você feriu o direito dele de acessar a informação."
                how="Considere backup se houver cópia automática em outro local (ex: nuvem ou HD externo)."
               />
               <Toggle 
                id="fn-encrypt"
                label="Existe criptografia no repouso?" 
                value={answers.hasEncryption} 
                onChange={(v: boolean) => setAnswers({...answers, hasEncryption: v})} 
                icon={Lock} 
                why="Medida de segurança técnica vital. Se o arquivo for roubado mas estiver criptografado, o dado fica ilegível e o dano é zero."
                how="Responda SIM se o sistema que você usa protege os arquivos com senha forte ou criptografia de disco."
               />
             </div>
           </div>
         )}

         {currentStep === 5 && (
           <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4">
             <div className="flex items-center gap-3 mb-2">
               <div className="p-3 bg-blue-50 rounded-2xl text-blue-600"><Share2 className="h-6 w-6" /></div>
               <h4 className="text-xl font-black text-slate-900">Fluxos e Compartilhamentos</h4>
             </div>
             <div className="space-y-6">
               <Toggle 
                id="fn-shared-int"
                label="Os dados são compartilhados com outros setores internos?" 
                value={answers.isSharedInternal} 
                onChange={(v: boolean) => setAnswers({...answers, isSharedInternal: v})} 
                icon={Briefcase} 
                why="Princípio do Privilégio Mínimo. Um vendedor não precisa ver os dados bancários do RH. Mapear isso ajuda a trancar acessos desnecessários."
                how="Marque SIM se mais de uma equipe acessa as mesmas planilhas ou pastas."
               />
               
               <Toggle 
                id="fn-shared-ext"
                label="Os dados são enviados para parceiros/terceiros externos?" 
                value={answers.isSharedExternal} 
                onChange={(v: boolean) => {
                  const val = v;
                  if (!val) {
                    setAnswers({ ...answers, isSharedExternal: false, externalThirdParties: '', sharedExternalDocumentUrl: '', sharedExternalDocumentName: '' });
                  } else {
                    setAnswers({ ...answers, isSharedExternal: true });
                  }
                }} 
                icon={Users} 
                why="O risco aqui é a Responsabilidade Solidária. Se você envia dados para a contabilidade e eles vazam, você também paga a multa."
                how="Considere qualquer envio via e-mail, integração de sistema ou acesso direto de terceiros."
               />

               {answers.isSharedExternal && (
                 <div className="pl-6 border-l-4 border-blue-100 animate-in slide-in-from-left-2 space-y-6">
                   <div>
                     <FieldLabel 
                       id="fn-third-parties"
                       label="Quais os terceiros envolvidos?"
                       why="Para gerar a cláusula de compartilhamento no seu Aviso de Privacidade (Transparência)." 
                       how="Liste os nomes ou categorias das empresas parceiras." 
                     />
                     <input type="text" value={answers.externalThirdParties} onChange={e => setAnswers({...answers, externalThirdParties: e.target.value})} className="w-full p-4 rounded-2xl bg-slate-50 border border-slate-200 font-bold text-slate-950 focus:bg-white focus:border-blue-600 outline-none transition-all placeholder:text-slate-400" placeholder="Ex: Contabilidade, Agência de Marketing..." />
                   </div>

                   <div className="space-y-4">
                      <FieldLabel 
                        id="fn-third-contract"
                        label="Contrato / Termo de Consentimento do Terceiro"
                        why="A ANPD exige que você comprove que o terceiro com quem você compartilha dados está ciente e concorda com as regras de tratamento da sua empresa."
                        how="Anexe o contrato assinado ou termo aditivo que inclua as cláusulas de LGPD aceitas pelo parceiro."
                      />
                      
                      {!answers.sharedExternalDocumentUrl ? (
                        <div 
                          onClick={() => !uploading && fileInputRef.current?.click()}
                          className={`p-10 rounded-[2rem] border-2 border-dashed transition-all flex flex-col items-center justify-center gap-3 cursor-pointer ${uploading ? 'bg-slate-50 border-slate-200 opacity-60 cursor-not-allowed' : 'bg-slate-50 border-slate-200 hover:border-blue-400 hover:bg-blue-50'}`}
                        >
                          <input type="file" ref={fileInputRef} className="hidden" accept=".pdf,.docx,.doc,.jpg,.png" onChange={handleFileChange} />
                          {uploading ? (
                            <div className="flex flex-col items-center gap-2">
                              <Loader2 className="h-8 w-8 text-blue-600 animate-spin" />
                              <span className="text-[10px] font-black text-blue-600 uppercase tracking-widest">Enviando {Math.round(uploadProgress)}%</span>
                            </div>
                          ) : (
                            <>
                              <Upload className="h-8 w-8 text-slate-400" />
                              <span className="text-xs font-bold text-slate-500">Clique para anexar o contrato assinado</span>
                              <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">PDF, DOCX ou Imagem</span>
                            </>
                          )}
                        </div>
                      ) : (
                        <div className="p-5 bg-emerald-50 border border-emerald-100 rounded-[1.5rem] flex items-center justify-between shadow-sm animate-in zoom-in-95">
                          <div className="flex items-center gap-4">
                            <div className="p-3 bg-emerald-100 text-emerald-600 rounded-xl">
                              <FileText className="h-6 w-6" />
                            </div>
                            <div className="min-w-0">
                              <p className="text-sm font-bold text-emerald-900 truncate max-w-[200px]">{answers.sharedExternalDocumentName}</p>
                              <p className="text-[10px] font-black text-emerald-600 uppercase tracking-widest">Documento Validado</p>
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            <a href={answers.sharedExternalDocumentUrl} target="_blank" rel="noopener noreferrer" className="p-2 text-emerald-600 hover:bg-emerald-100 rounded-lg transition-colors">
                              <ChevronRight className="h-5 w-5" />
                            </a>
                            <button onClick={() => setAnswers({...answers, sharedExternalDocumentUrl: '', sharedExternalDocumentName: ''})} className="p-2 text-red-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors">
                              <Trash2 className="h-5 w-5" />
                            </button>
                          </div>
                        </div>
                      )}
                      {uploading && (
                        <div className="h-1.5 w-full bg-slate-100 rounded-full overflow-hidden">
                          <div className="h-full bg-blue-600 transition-all duration-300" style={{ width: `${uploadProgress}%` }} />
                        </div>
                      )}
                   </div>
                 </div>
               )}
               <Toggle 
                id="fn-intl"
                label="Existe transferência de dados para fora do Brasil?" 
                value={answers.isInternationalTransfer} 
                onChange={(v: boolean) => setAnswers({...answers, isInternationalTransfer: v})} 
                icon={Cloud} 
                why="A LGPD tem regras rígidas para dados saindo do país. Muitos serviços de nuvem (como Dropbox ou AWS) guardam dados fora, e você precisa saber disso."
                how="Marque SIM se você usa softwares estrangeiros para salvar esses dados."
               />
             </div>
           </div>
         )}

         {currentStep === 6 && (
           <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4">
             <div className="flex items-center gap-3 mb-2">
               <div className="p-3 bg-red-50 rounded-2xl text-red-600"><ShieldCheck className="h-6 w-6" /></div>
               <h4 className="text-xl font-black text-slate-900">Defesa e Segurança (Art. 46)</h4>
             </div>
             <div className="space-y-8">
               <div>
                 <FieldLabel 
                   id="fn-access"
                   label="Como o acesso é controlado?"
                   why="A ANPD exige provas de que você tenta impedir o acesso de curiosos. O controle de acesso é a primeira barreira contra vazamentos." 
                   how="Exemplos: 'Login e Senha individual', 'Chave física em armário', 'Apenas IPs autorizados'." 
                 />
                 <input type="text" value={answers.accessControl} onChange={e => setAnswers({...answers, accessControl: e.target.value})} className="w-full p-4 rounded-2xl bg-slate-50 border border-slate-200 font-bold text-slate-950 focus:bg-white focus:border-blue-600 outline-none transition-all placeholder:text-slate-400" />
               </div>
               <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                 <Toggle 
                  id="fn-mfa"
                  label="Usa MFA (2 fatores de acesso)?" 
                  value={answers.hasMFA} 
                  onChange={(v: boolean) => setAnswers({...answers, hasMFA: v})} 
                  icon={UserCheck} 
                  why="MFA reduz em 99% o risco de invasão por rotbo de senha. É o padrão de segurança exigido para empresas digitais hoje."
                  how="Responda SIM se seus e-mails ou sistemas pedem código por SMS ou App (Authenticator)."
                 />
                 <Toggle 
                  id="fn-incident"
                  label="Possui plano de resposta a incidentes?" 
                  value={answers.hasIncidentPlan} 
                  onChange={(v: boolean) => setAnswers({...answers, hasIncidentPlan: v})} 
                  icon={Shield} 
                  why="Se um vazamento acontecer hoje, você sabe o que fazer nas primeiras 48h? Ter um plano reduz o valor da multa da ANPD."
                  how="Marque SIM se você tem um guia de 'Quem avisar' e 'O que fazer' em caso de problemas."
                 />
               </div>
               <Toggle 
                id="fn-training"
                label="A equipe que trata esses dados recebeu treinamento em LGPD?" 
                value={answers.hasStaffTraining} 
                onChange={(v: boolean) => setAnswers({...answers, hasStaffTraining: v})} 
                icon={ClipboardCheck} 
                why="80% dos vazamentos são erros humanos. Treinar a equipe mostra para a justiça que a empresa agiu com boa-fé."
                how="Responda SIM se houve reunião, curso ou envio de manual de conduta para os envolvidos."
               />
             </div>
           </div>
         )}

         {currentStep === 7 && (
           <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4">
             <div className="flex items-center gap-3 mb-2">
               <div className="p-3 bg-indigo-50 rounded-2xl text-indigo-600"><HardDrive className="h-6 w-6" /></div>
               <h4 className="text-xl font-black text-slate-900">Ciclo de Vida e Retenção</h4>
             </div>
             <div className="space-y-8">
               <div>
                 <FieldLabel 
                   id="fn-retention"
                   label="Tempo de Retenção (Quanto tempo guarda?)"
                   why="Princípio da Limitação do Armazenamento. Você não pode guardar dados 'para sempre'. Dados velhos são um risco inútil." 
                   how="Informe o prazo. Ex: '5 anos (Fiscal)', '2 anos (Seleção)' ou 'Enquanto durar a conta do usuário'." 
                 />
                 <input type="text" value={answers.retentionPeriod} onChange={e => setAnswers({...answers, retentionPeriod: e.target.value})} className="w-full p-4 rounded-2xl bg-slate-50 border border-slate-200 font-bold text-slate-950 focus:bg-white focus:border-blue-600 outline-none transition-all placeholder:text-slate-400" placeholder="Ex: 5 anos após fim do contrato" />
               </div>
               <div>
                 <FieldLabel 
                   id="fn-deletion"
                   label="Como os dados são eliminados?"
                   why="Para garantir que o dado não possa ser recuperado por terceiros após o descarte." 
                   how="Selecione o método técnico ou físico de destruição da informação." 
                 />
                 <select value={answers.deletionMethod} onChange={e => setAnswers({...answers, deletionMethod: e.target.value})} className="w-full p-4 rounded-2xl bg-slate-50 border border-slate-200 font-bold text-slate-950 outline-none focus:ring-4 focus:ring-blue-50 focus:bg-white transition-all">
                   <option value="Exclusão Permanente">Exclusão Permanente (Lixeira limpa)</option>
                   <option value="Trituração">Trituração Física (Papel)</option>
                   <option value="Anonimização">Anonimização (Os dados deixam de ser pessoais)</option>
                 </select>
               </div>
               <div className="pt-4 border-t border-slate-50">
                 <Toggle 
                  id="fn-secondary"
                  label="Existe uso desses dados para outras finalidades?" 
                  value={answers.hasSecondaryUse} 
                  onChange={(v: boolean) => setAnswers({...answers, hasSecondaryUse: v})} 
                  icon={RefreshCw} 
                  why="Desvio de Finalidade. Se você coletou dados para RH e usou para Marketing sem autorização, a empresa está irregular."
                  how="Marque SIM se o dado 'alimenta' outros processos da empresa além do principal descrito aqui."
                 />
               </div>
             </div>
           </div>
         )}
      </div>

      <div className="flex flex-col sm:flex-row justify-between items-center gap-4 bg-white p-6 rounded-[2.5rem] border border-slate-100 shadow-sm">
         <button 
           onClick={() => { if(currentStep === 1) setView('sector-hub'); else setCurrentStep(s => s - 1); }} 
           className="w-full sm:w-auto px-8 py-4 text-slate-400 font-bold hover:text-blue-600 flex items-center justify-center gap-2 transition-colors"
         >
           <ChevronLeft className="h-5 w-5" /> Voltar
         </button>
         
         <div className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto">
           <button 
              onClick={() => updateStep(currentStep, false, true)}
              disabled={isSaving || uploading}
              className="px-6 py-4 bg-slate-50 text-slate-600 rounded-[1.5rem] font-bold text-sm flex items-center justify-center gap-2 hover:bg-slate-100 transition-all border border-slate-200 disabled:opacity-50"
           >
             {isSaving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
             Salvar Rascunho e Sair
           </button>

           <button 
              onClick={() => { if(currentStep === 7) updateStep(7, true); else { const next = currentStep + 1; setCurrentStep(next); updateStep(next); } }} 
              disabled={uploading}
              className="px-10 py-4 bg-blue-600 text-white rounded-[1.5rem] font-black shadow-xl hover:bg-blue-700 flex items-center justify-center gap-3 transition-all active:scale-95 disabled:opacity-50"
           >
             {currentStep === 7 ? 'Finalizar Processo' : 'Próxima Etapa'} <ChevronRight className="h-5 w-5" />
           </button>
         </div>
      </div>
    </div>
  );
};


export const Questionnaire: React.FC<QuestionnaireProps> = ({ initialData, onSave }) => {
  const [view, setView] = useState<'mapping' | 'sector-hub' | 'process-form'>(
    initialData?.industry ? 'sector-hub' : 'mapping'
  );
  
  const [activeSectorId, setActiveSectorId] = useState<string | null>(null);
  const [activeProcessId, setActiveProcessId] = useState<string | null>(null);

  const [data, setData] = useState<QuestionnaireData>(initialData || {
    companySize: 'Microempresa' as any,
    industry: '',
    sectors: [],
    lastUpdated: new Date().toISOString()
  });

  const handleToggleSector = (name: string) => {
    const sectors = data.sectors || [];
    const exists = sectors.find(s => s.name === name);
    if (exists) {
      setData({ ...data, sectors: sectors.filter(s => s.id !== exists.id) });
    } else {
      const newSector: SectorMapping = {
        id: Math.random().toString(36).substr(2, 9),
        name,
        isCustom: false,
        processes: []
      };
      setData({ ...data, sectors: [...sectors, newSector] });
    }
  };

  const handleAddProcess = (sectorId: string, template?: { name: string; description: string }) => {
    const newProcess: DataProcess = {
      id: Math.random().toString(36).substr(2, 9),
      name: template?.name || 'Novo Processo de Tratamento',
      description: template?.description || 'Descreva a finalidade deste fluxo...',
      status: 'pending',
      lastStep: 1,
      answers: template ? {
        processName: template.name,
        responsibleRole: '',
        purpose: template.description,
        collectedData: [],
        hasSensitiveData: false,
        dataSubjects: [],
        estimatedVolume: 'Baixo (1-500 registros/mês)',
        legalBasis: '',
        storageType: 'Digital',
        collectionChannels: [],
        hasBackups: false,
        hasEncryption: false,
        isSharedInternal: false,
        isSharedExternal: false,
        isInternationalTransfer: false,
        accessControl: 'Apenas Responsáveis',
        hasMFA: false,
        hasIncidentPlan: false,
        hasStaffTraining: false,
        retentionPeriod: '',
        deletionMethod: 'Exclusão Permanente',
        hasSecondaryUse: false
      } : undefined
    };

    const updatedSectors = (data.sectors || []).map(s => 
      s.id === sectorId ? { ...s, processes: [...(s.processes || []), newProcess] } : s
    );
    
    setData({ ...data, sectors: updatedSectors });
  };

  const handleDuplicateProcess = (sectorId: string, process: DataProcess) => {
    const duplicated: DataProcess = {
      ...process,
      id: Math.random().toString(36).substr(2, 9),
      name: `${process.name} (Cópia)`,
      status: 'pending'
    };
    const updatedSectors = (data.sectors || []).map(s => 
      s.id === sectorId ? { ...s, processes: [...(s.processes || []), duplicated] } : s
    );
    setData({ ...data, sectors: updatedSectors });
  };

  const handleRemoveProcess = (sectorId: string, processId: string) => {
    if (!confirm('Deseja excluir este processo e todas as suas respostas?')) return;
    const updatedSectors = (data.sectors || []).map(s => 
      s.id === sectorId ? { ...s, processes: (s.processes || []).filter(p => p.id !== processId) } : s
    );
    setData({ ...data, sectors: updatedSectors });
  };

  const handleStartProcessQuestionnaire = (sectorId: string, processId: string) => {
    setActiveSectorId(sectorId);
    setActiveProcessId(processId);
    setView('process-form');
  };

  const syncData = async (updatedData: QuestionnaireData, isFinal: boolean = false) => {
    setData(updatedData);
    await onSave(updatedData, isFinal);
  };

  if (view === 'mapping') {
    return (
      <div className="max-w-4xl mx-auto space-y-8 page-transition">
        <div className="bg-white p-12 rounded-[2.5rem] border border-slate-100 shadow-sm space-y-10">
          <header>
            <h2 className="text-3xl font-black text-slate-900 tracking-tight">Estrutura da Empresa</h2>
            <p className="text-slate-500 font-medium">Defina os parâmetros base da sua empresa para iniciarmos o mapeamento.</p>
          </header>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
            <div className="space-y-4">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] ml-1">Porte da Empresa</label>
              <select 
                className="w-full p-4 rounded-2xl bg-slate-50 border border-slate-200 font-bold text-slate-950 outline-none focus:ring-4 focus:ring-blue-50 focus:bg-white transition-all cursor-pointer" 
                value={data.companySize} 
                onChange={e => setData({...data, companySize: e.target.value as any})}
              >
                <option value="MEI">MEI</option>
                <option value="Microempresa">Microempresa</option>
                <option value="Pequena Empresa">Pequena Empresa</option>
              </select>
            </div>
            <div className="space-y-4">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] ml-1">Setor de Atuação Principal</label>
              <select className="w-full p-4 rounded-2xl bg-slate-50 border border-slate-200 font-bold text-slate-950 outline-none focus:ring-4 focus:ring-blue-50 focus:bg-white transition-all cursor-pointer" value={data.industry} onChange={e => setData({...data, industry: e.target.value})}>
                <option value="">Selecione...</option>
                {['Tecnologia', 'Varejo', 'Saúde', 'Educação', 'Serviços', 'Indústria'].map(r => <option key={r} value={r}>{r}</option>)}
              </select>
            </div>
          </div>

          <div className="pt-8 border-t border-slate-100 space-y-6">
            <label className="text-sm font-bold text-slate-700 block">Quais departamentos sua empresa possui inicialmente?</label>
            <div className="flex flex-wrap gap-2">
              {['RH / DP', 'Marketing', 'Vendas', 'Atendimento', 'Financeiro', 'TI', 'Jurídico'].map(s => {
                const isSelected = (data.sectors || []).some(sec => sec.name === s);
                return (
                  <button key={s} onClick={() => handleToggleSector(s)} className={`px-5 py-2.5 rounded-full border text-xs font-bold transition-all ${isSelected ? 'bg-blue-600 text-white border-blue-600 shadow-lg shadow-blue-100' : 'bg-white border-slate-200 text-slate-500 hover:border-blue-300'}`}>
                    {s}
                  </button>
                );
              })}
            </div>
          </div>
        </div>
        <button onClick={() => syncData(data).then(() => setView('sector-hub'))} disabled={!data.sectors || data.sectors.length === 0 || !data.industry} className="w-full md:w-auto px-12 py-5 bg-blue-600 text-white rounded-[2rem] font-black text-lg flex items-center justify-center gap-3 ml-auto block shadow-xl hover:bg-blue-700 transition-all disabled:opacity-50 active:scale-95">
          Confirmar Dados Iniciais <ChevronRight className="h-6 w-6" />
        </button>
      </div>
    );
  }

  if (view === 'sector-hub') {
    return (
      <div className="max-w-5xl mx-auto space-y-8 page-transition pb-20">
        <header className="flex flex-col md:flex-row md:items-center justify-between gap-4 px-4">
          <div>
            <h2 className="text-3xl font-black text-slate-900 tracking-tight">Mapeamento de Processos</h2>
            <p className="text-slate-500 font-medium">Mapeie as atividades de tratamento de dados pessoais em cada departamento.</p>
          </div>
          <div className="flex items-center gap-3">
             <div className="text-right hidden sm:block">
               <p className="text-[10px] font-black text-slate-400 uppercase">{data.companySize}</p>
               <p className="text-xs font-bold text-blue-600">{data.industry}</p>
             </div>
             <div className="h-10 w-10 bg-blue-50 text-blue-600 rounded-xl flex items-center justify-center">
               <Briefcase className="h-5 w-5" />
             </div>
          </div>
        </header>

        <div className="space-y-12">
          {(data.sectors || []).map(sector => (
            <section key={sector.id} className="space-y-6">
              <div className="flex items-center gap-3 px-4">
                <div className="p-2.5 bg-blue-50 text-blue-600 rounded-xl">
                  <Layers className="h-5 w-5" />
                </div>
                <h3 className="text-xl font-bold text-slate-900">{sector.name}</h3>
                <span className="text-xs font-bold text-slate-300 uppercase tracking-widest ml-2">{(sector.processes || []).length} Processos</span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 px-4">
                <div className="bg-white border-2 border-dashed border-slate-200 rounded-[2rem] p-6 flex flex-col items-center justify-center text-center gap-4 hover:border-blue-400 hover:bg-blue-50/50 transition-all group cursor-pointer" onClick={() => handleAddProcess(sector.id)}>
                   <div className="p-3 bg-slate-50 rounded-full group-hover:bg-blue-100 transition-colors">
                     <Plus className="h-6 w-6 text-slate-400 group-hover:text-blue-600" />
                   </div>
                   <div className="space-y-1">
                     <p className="font-bold text-slate-900 text-sm">Novo Processo</p>
                     <p className="text-[10px] text-slate-400 font-medium px-4 leading-tight">Crie manualmente uma linha de tratamento para este setor.</p>
                   </div>
                </div>

                {(!sector.processes || sector.processes.length === 0) && SECTOR_TEMPLATES[sector.name]?.map((tpl, i) => (
                  <div key={i} className="bg-blue-50 border border-blue-100 rounded-[2rem] p-6 flex flex-col justify-between hover:shadow-lg transition-all cursor-pointer group" onClick={() => handleAddProcess(sector.id, tpl)}>
                     <div className="space-y-2">
                       <div className="flex items-center gap-2">
                         <Zap className="h-3 w-3 text-blue-600" />
                         <span className="text-[8px] font-black uppercase text-blue-600 tracking-widest">Sugerido</span>
                       </div>
                       <p className="font-bold text-slate-900 text-sm">{tpl.name}</p>
                       <p className="text-[10px] text-slate-500 leading-relaxed line-clamp-2">{tpl.description}</p>
                     </div>
                     <div className="mt-4 flex items-center gap-1 text-[10px] font-bold text-blue-600 group-hover:translate-x-1 transition-transform">
                        Usar Template <ChevronRight className="h-3 w-3" />
                     </div>
                  </div>
                ))}

                {(sector.processes || []).map(process => (
                  <div key={process.id} className={`bg-white border rounded-[2rem] p-6 flex flex-col justify-between hover:shadow-xl transition-all group ${process.status === 'completed' ? 'border-green-100 shadow-green-100/50' : 'border-slate-100'}`}>
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                         <div className={`p-2.5 rounded-xl ${process.status === 'completed' ? 'bg-green-50 text-green-600' : 'bg-amber-50 text-amber-600'}`}>
                           <ClipboardCheck className="h-5 w-5" />
                         </div>
                         <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                           <button onClick={(e) => { e.stopPropagation(); handleDuplicateProcess(sector.id, process); }} title="Duplicar Processo" className="p-2 text-slate-300 hover:text-blue-600 transition-colors"><Copy className="h-4 w-4" /></button>
                           <button onClick={(e) => { e.stopPropagation(); handleRemoveProcess(sector.id, process.id); }} title="Remover" className="p-2 text-slate-300 hover:text-red-500 transition-colors"><Trash2 className="h-4 w-4" /></button>
                         </div>
                      </div>
                      <div>
                        <h4 className="font-bold text-slate-900 text-sm">{process.name}</h4>
                        <p className="text-[10px] text-slate-400 font-medium leading-relaxed mt-1 line-clamp-2">{process.description}</p>
                      </div>
                    </div>

                    <div className="mt-6 space-y-3">
                       <div className="flex items-center justify-between text-[8px] font-black uppercase tracking-widest">
                         <span className={process.status === 'completed' ? 'text-green-600' : 'text-amber-600'}>{process.status === 'completed' ? 'Mapeado' : `Etapa ${process.lastStep || 1}/7`}</span>
                         <span className="text-slate-400">{process.status === 'completed' ? '100%' : `${Math.round(((process.lastStep || 1) / 7) * 100)}%`}</span>
                       </div>
                       <div className="h-1.5 bg-slate-50 rounded-full overflow-hidden">
                         <div className={`h-full transition-all duration-700 ${process.status === 'completed' ? 'bg-green-500' : 'bg-amber-500'}`} style={{ width: `${((process.lastStep || 1) / 7) * 100}%` }} />
                       </div>
                       <button onClick={() => handleStartProcessQuestionnaire(sector.id, process.id)} className={`w-full py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${process.status === 'completed' ? 'bg-slate-50 text-slate-600 hover:bg-slate-100' : 'bg-blue-600 text-white shadow-lg shadow-blue-100 hover:bg-blue-700'}`}>
                         {process.status === 'completed' ? 'Editar Respostas' : 'Continuar Mapeamento'}
                       </button>
                    </div>
                  </div>
                ))}
              </div>
            </section>
          ))}
        </div>

        <div className="bg-slate-900 p-10 rounded-[3rem] text-white flex flex-col md:flex-row items-center justify-between gap-8 sticky bottom-4 z-40 mx-4 shadow-2xl">
          <div className="space-y-1">
             <h3 className="text-2xl font-bold">Finalizar Inventário Global</h3>
             <p className="text-slate-400 text-xs">A plataforma consolidará todos os processos mapeados para gerar o seu RAT oficial.</p>
          </div>
          <button 
            onClick={() => syncData(data, true)} 
            disabled={!data.sectors || data.sectors.every(s => !s.processes || s.processes.length === 0) || data.sectors.some(s => (s.processes || []).some(p => p.status !== 'completed'))}
            className="w-full md:w-auto px-10 py-4 bg-white text-slate-900 rounded-[1.5rem] font-black text-sm flex items-center justify-center gap-3 shadow-xl hover:bg-blue-50 disabled:opacity-30 transition-all active:scale-95"
          >
            Gerar Diagnóstico <ShieldCheck className="h-5 w-5" />
          </button>
        </div>
      </div>
    );
  }

  if (view === 'process-form' && activeSectorId && activeProcessId) {
    const currentSector = (data.sectors || []).find(s => s.id === activeSectorId);
    const currentProcess = currentSector?.processes?.find(p => p.id === activeProcessId);
    
    if (currentProcess) {
      return (
        <ProcessFormWizard 
          process={currentProcess} 
          activeSectorId={activeSectorId} 
          data={data} 
          onSave={syncData} 
          setView={setView} 
        />
      );
    }
  }

  return null;
};
