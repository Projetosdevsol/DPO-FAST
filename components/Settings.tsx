import React, { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  User as UserIcon, 
  Lock, 
  HelpCircle, 
  Mail, 
  Save, 
  ShieldAlert, 
  Image as ImageIcon,
  Loader2,
  CheckCircle,
  AlertCircle,
  ShieldCheck,
  Terminal,
  ChevronRight,
  Building,
  Layers,
  MapPin,
  RefreshCw,
  LayoutGrid,
  Info,
  Plus,
  CreditCard,
  Moon,
  Sun,
  Fingerprint,
  Calendar,
  History,
  ExternalLink,
  Target,
  Sparkles,
  Hash,
  Briefcase
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { storage, db } from '../lib/firebase';
import { ref, uploadBytes, getDownloadURL } from 'https://www.gstatic.com/firebasejs/10.8.0/firebase-storage.js';
import { collection, addDoc } from 'https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js';
import { QuestionnaireData, SectorMapping } from '../types';
import { PLAN_LIMITS } from '../lib/plans';

interface SettingsProps {
  initialQData?: QuestionnaireData | null;
  onSaveQData?: (data: QuestionnaireData) => Promise<void>;
}

export const Settings: React.FC<SettingsProps> = ({ initialQData, onSaveQData }) => {
  const { authState, updateUser, updateUserEmail, resetPassword } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const navigate = useNavigate();
  const [loading, setLoading] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Perfil State
  const [profileData, setProfileData] = useState({
    name: authState.user?.name || '',
    companyName: authState.user?.companyName || '',
    cnpj: authState.user?.cnpj || '',
    address: authState.user?.address || ''
  });
  const [email, setEmail] = useState(authState.user?.email || '');
  const [showEmailModal, setShowEmailModal] = useState(false);
  const [currentPassword, setCurrentPassword] = useState('');

  // Suporte State
  const [supportSubject, setSupportSubject] = useState('Dúvida sobre LGPD');
  const [supportMessage, setSupportMessage] = useState('');
  const [supportFile, setSupportFile] = useState<File | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const clearMessages = () => {
    setTimeout(() => {
      setSuccess(null);
      setError(null);
    }, 4000);
  };

  const handleUpdateProfile = async () => {
    setLoading('profile');
    try {
      await updateUser(profileData);
      setSuccess('Perfil e dados corporativos atualizados!');
    } catch (err) {
      setError('Erro ao atualizar dados.');
    } finally {
      setLoading(null);
      clearMessages();
    }
  };

  const handleUpdateEmail = async () => {
    setLoading('email');
    try {
      await updateUserEmail(email, currentPassword);
      setSuccess('E-mail alterado com sucesso!');
      setShowEmailModal(false);
      setCurrentPassword('');
    } catch (err: any) {
      setError(err.message || 'Erro ao alterar e-mail. Verifique sua senha.');
    } finally {
      setLoading(null);
      clearMessages();
    }
  };

  const handleResetPass = async () => {
    setLoading('security');
    try {
      await resetPassword(authState.user!.email);
      setSuccess('E-mail de redefinição enviado!');
    } catch (err) {
      setError('Erro ao enviar e-mail.');
    } finally {
      setLoading(null);
      clearMessages();
    }
  };

  const handleSupportSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!supportMessage.trim()) return;

    setLoading('support');
    try {
      let fileUrl = '';
      if (supportFile) {
        const storageRef = ref(storage, `support/${authState.user!.id}/${Date.now()}_${supportFile.name}`);
        const snapshot = await uploadBytes(storageRef, supportFile);
        fileUrl = await getDownloadURL(snapshot.ref);
      }

      await addDoc(collection(db, 'support_tickets'), {
        userId: authState.user!.id,
        userName: authState.user!.name,
        userEmail: authState.user!.email,
        subject: supportSubject,
        message: supportMessage,
        attachment: fileUrl,
        status: 'open',
        createdAt: new Date().toISOString()
      });

      setSuccess('Mensagem enviada! Responderemos em até 48h.');
      setSupportMessage('');
      setSupportFile(null);
    } catch (err) {
      setError('Erro ao enviar solicitação de suporte.');
    } finally {
      setLoading(null);
      clearMessages();
    }
  };

  const currentPlan = authState.user?.plan || 'basico';
  const planInfo = PLAN_LIMITS[currentPlan as keyof typeof PLAN_LIMITS] || PLAN_LIMITS.basico;
  const isProfileChanged = 
    profileData.name !== authState.user?.name || 
    profileData.companyName !== authState.user?.companyName || 
    profileData.cnpj !== authState.user?.cnpj || 
    profileData.address !== authState.user?.address;

  return (
    <div className="max-w-4xl mx-auto space-y-10 animate-in fade-in pb-24 px-4 sm:px-0">
      <header className="space-y-2">
        <h1 className="text-4xl font-black text-[var(--text-primary)] tracking-tighter">Configurações</h1>
        <p className="text-slate-500 font-medium">Personalize sua experiência e gerencie sua conformidade.</p>
      </header>

      {success && (
        <div className="p-5 bg-green-500/10 border border-green-500/20 rounded-2xl flex items-center gap-3 text-green-600 font-bold shadow-sm animate-in slide-in-from-top-2">
          <CheckCircle className="h-5 w-5" /> {success}
        </div>
      )}

      {error && (
        <div className="p-5 bg-red-500/10 border border-red-200 rounded-2xl flex items-center gap-3 text-red-600 font-bold shadow-sm animate-in slide-in-from-top-2">
          <AlertCircle className="h-5 w-5" /> {error}
        </div>
      )}

      {/* SEÇÃO: ASSINATURA ATUAL */}
      <section className="bg-[var(--surface)] p-8 rounded-[2.5rem] border border-[var(--border)] shadow-sm relative overflow-hidden">
        <div className="absolute top-0 right-0 p-8 opacity-5">
           <CreditCard className="h-32 w-32 text-[var(--text-primary)]" />
        </div>
        
        <div className="relative z-10 space-y-8">
           <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
              <div className="space-y-1">
                <div className="flex items-center gap-3">
                   <div className="p-2 bg-blue-600 rounded-xl text-white">
                      <Target className="h-5 w-5" />
                   </div>
                   <h2 className="text-xl font-black text-[var(--text-primary)] uppercase tracking-tight">Plano & Assinatura</h2>
                </div>
                <p className="text-slate-500 text-sm font-medium">Gerencie seus limites e faturamento.</p>
              </div>
              
              <div className="flex items-center gap-3 bg-[var(--surface-muted)] p-2 pr-6 rounded-full border border-[var(--border)]">
                 <div className={`h-10 px-4 flex items-center justify-center rounded-full text-[10px] font-black uppercase tracking-widest text-white shadow-lg ${
                   currentPlan === 'personalite' ? 'bg-amber-500 shadow-amber-500/20' : 
                   currentPlan === 'pro' ? 'bg-blue-600 shadow-blue-600/20' : 'bg-slate-500 shadow-slate-500/20'
                 }`}>
                   {currentPlan}
                 </div>
                 <div className="flex flex-col">
                    <span className="text-[9px] font-black uppercase text-slate-400">Status</span>
                    <span className="text-xs font-bold text-emerald-500 uppercase">Ativo</span>
                 </div>
              </div>
           </div>

           <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="bg-[var(--surface-muted)] p-6 rounded-3xl border border-[var(--border)] space-y-2">
                 <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Setores Disponíveis</p>
                 <p className="text-2xl font-black text-[var(--text-primary)]">{planInfo.limite_setores === 999 ? 'Ilimitados' : planInfo.limite_setores}</p>
              </div>
              <div className="bg-[var(--surface-muted)] p-6 rounded-3xl border border-[var(--border)] space-y-2">
                 <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Mapeamentos</p>
                 <p className="text-2xl font-black text-[var(--text-primary)]">Ilimitados</p>
              </div>
              <div className="bg-[var(--surface-muted)] p-6 rounded-3xl border border-[var(--border)] space-y-2">
                 <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Nível de Suporte</p>
                 <p className="text-sm font-bold text-[var(--text-primary)]">{planInfo.suporte}</p>
              </div>
           </div>

           <div className="pt-4 border-t border-[var(--border)] flex flex-col md:flex-row items-center justify-between gap-4">
              <p className="text-xs text-slate-500 font-medium">Sua próxima renovação ocorre via Stripe.</p>
              <button 
                onClick={() => navigate('/planos')}
                className="w-full md:w-auto px-8 py-4 bg-blue-600 text-white rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-blue-700 transition-all flex items-center justify-center gap-2 always-white shadow-xl shadow-blue-600/20"
              >
                Upgrade de Plano <Sparkles className="h-4 w-4" />
              </button>
           </div>
        </div>
      </section>

      {/* SEÇÃO: PREFERÊNCIAS VISUAIS */}
      <section className="bg-[var(--surface)] p-8 rounded-[2.5rem] border border-[var(--border)] shadow-sm space-y-6">
        <h2 className="text-xl font-black text-[var(--text-primary)] flex items-center gap-3">
          <Sparkles className="h-5 w-5 text-amber-500" /> Interface & Temas
        </h2>
        
        <div className="flex flex-col md:flex-row items-center justify-between gap-6 p-6 bg-[var(--surface-muted)] rounded-3xl border border-[var(--border)]">
           <div className="space-y-1">
              <p className="text-sm font-black text-[var(--text-primary)] uppercase tracking-tight">Visual da Plataforma</p>
              <p className="text-xs text-slate-500 font-medium">Adapte a luminosidade do sistema ao seu ambiente.</p>
           </div>
           
           <div className="flex bg-[var(--surface)] p-1.5 rounded-2xl border border-[var(--border)] shadow-inner">
              <button 
                onClick={() => theme !== 'light' && toggleTheme()}
                className={`flex items-center gap-2 px-6 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${
                  theme === 'light' ? 'bg-white text-slate-900 shadow-md border border-slate-100' : 'text-slate-500 hover:text-slate-300'
                }`}
              >
                <Sun className="h-4 w-4" /> Claro
              </button>
              <button 
                onClick={() => theme !== 'dark' && toggleTheme()}
                className={`flex items-center gap-2 px-6 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${
                  theme === 'dark' ? 'bg-slate-900 text-white shadow-md border border-slate-800' : 'text-slate-500 hover:text-slate-700'
                }`}
              >
                <Moon className="h-4 w-4" /> Escuro
              </button>
           </div>
        </div>
      </section>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* SEÇÃO: PERFIL & EMPRESA */}
        <section className="bg-[var(--surface)] p-8 rounded-[2.5rem] border border-[var(--border)] shadow-sm space-y-8 h-full">
          <h2 className="text-xl font-black text-[var(--text-primary)] flex items-center gap-3 uppercase tracking-tight">
            <Building className="h-5 w-5 text-blue-600" /> Identidade & Perfil
          </h2>
          
          <div className="space-y-5">
            <div>
              <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest block mb-2 px-1">Nome do Gestor</label>
              <div className="relative">
                <UserIcon className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                <input 
                  type="text" 
                  value={profileData.name} 
                  onChange={(e) => setProfileData({...profileData, name: e.target.value})}
                  className="w-full pl-12 pr-5 py-4 rounded-2xl border border-[var(--border)] focus:bg-[var(--surface)] focus:ring-4 focus:ring-blue-500/5 focus:border-blue-600 outline-none transition-all text-[var(--text-primary)] font-bold placeholder:text-slate-400 bg-[var(--surface-muted)]"
                />
              </div>
            </div>

            <div>
              <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest block mb-2 px-1">Nome da Organização</label>
              <div className="relative">
                <Briefcase className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                <input 
                  type="text" 
                  value={profileData.companyName} 
                  onChange={(e) => setProfileData({...profileData, companyName: e.target.value})}
                  className="w-full pl-12 pr-5 py-4 rounded-2xl border border-[var(--border)] focus:bg-[var(--surface)] focus:ring-4 focus:ring-blue-500/5 focus:border-blue-600 outline-none transition-all text-[var(--text-primary)] font-bold placeholder:text-slate-400 bg-[var(--surface-muted)]"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
               <div>
                  <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest block mb-2 px-1">Documento (CNPJ)</label>
                  <div className="relative">
                    <Hash className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                    <input 
                      type="text" 
                      value={profileData.cnpj} 
                      onChange={(e) => setProfileData({...profileData, cnpj: e.target.value})}
                      className="w-full pl-12 pr-5 py-4 rounded-2xl border border-[var(--border)] focus:bg-[var(--surface)] focus:ring-4 focus:ring-blue-500/5 focus:border-blue-600 outline-none transition-all text-[var(--text-primary)] font-bold placeholder:text-slate-400 bg-[var(--surface-muted)]"
                    />
                  </div>
               </div>
               <div>
                  <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest block mb-2 px-1">Localização</label>
                  <div className="relative">
                    <MapPin className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                    <input 
                      type="text" 
                      value={profileData.address} 
                      onChange={(e) => setProfileData({...profileData, address: e.target.value})}
                      className="w-full pl-12 pr-5 py-4 rounded-2xl border border-[var(--border)] focus:bg-[var(--surface)] focus:ring-4 focus:ring-blue-500/5 focus:border-blue-600 outline-none transition-all text-[var(--text-primary)] font-bold placeholder:text-slate-400 bg-[var(--surface-muted)]"
                    />
                  </div>
               </div>
            </div>

            <button 
              onClick={handleUpdateProfile}
              disabled={loading === 'profile' || !isProfileChanged}
              className="w-full py-5 bg-blue-600 text-white rounded-2xl font-black text-xs uppercase tracking-widest flex items-center justify-center gap-3 hover:bg-blue-700 transition-all disabled:opacity-30 always-white shadow-lg shadow-blue-600/10"
            >
              {loading === 'profile' ? <Loader2 className="h-5 w-5 animate-spin" /> : <Save className="h-5 w-5" />}
              Salvar Alterações Globais
            </button>
          </div>
        </section>

        {/* SEÇÃO: DETALHES AVANÇADOS */}
        <section className="bg-[var(--surface)] p-8 rounded-[2.5rem] border border-[var(--border)] shadow-sm space-y-8 flex flex-col h-full">
          <h2 className="text-xl font-black text-[var(--text-primary)] flex items-center gap-3 uppercase tracking-tight">
            <Fingerprint className="h-5 w-5 text-indigo-600" /> Metadados da Conta
          </h2>
          
          <div className="space-y-4 flex-1">
             <div className="p-5 bg-[var(--surface-muted)] rounded-2xl border border-[var(--border)] flex items-center justify-between">
                <div className="flex items-center gap-3">
                   <Calendar className="h-4 w-4 text-slate-400" />
                   <span className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Criação da Conta</span>
                </div>
                <span className="text-[11px] font-bold text-[var(--text-primary)]">
                  {authState.user?.createdAt ? new Date(authState.user.createdAt).toLocaleDateString('pt-BR', { day: '2-digit', month: 'long', year: 'numeric' }) : '---'}
                </span>
             </div>

             <div className="p-5 bg-[var(--surface-muted)] rounded-2xl border border-[var(--border)] flex items-center justify-between">
                <div className="flex items-center gap-3">
                   <History className="h-4 w-4 text-slate-400" />
                   <span className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Último Login</span>
                </div>
                <span className="text-[11px] font-bold text-[var(--text-primary)]">
                   {authState.user?.lastLogin ? new Date(authState.user.lastLogin).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }) : '---'}
                </span>
             </div>

             <div className="p-5 bg-[var(--surface-muted)] rounded-2xl border border-[var(--border)] space-y-2">
                <div className="flex items-center justify-between">
                   <div className="flex items-center gap-3">
                      <Terminal className="h-4 w-4 text-slate-400" />
                      <span className="text-[10px] font-black uppercase text-slate-400 tracking-widest">User Global ID</span>
                   </div>
                </div>
                <code className="text-[10px] font-mono font-bold text-blue-600 bg-blue-600/5 px-3 py-2 rounded-lg block truncate border border-blue-600/10">
                  {authState.user?.id}
                </code>
             </div>

             <div className="p-5 bg-[var(--surface-muted)] rounded-2xl border border-[var(--border)] flex items-center justify-between opacity-60">
                <div className="flex items-center gap-3">
                   <Mail className="h-4 w-4 text-slate-400" />
                   <span className="text-[10px] font-black uppercase text-slate-400 tracking-widest">E-mail Protegido</span>
                </div>
                <button onClick={() => setShowEmailModal(true)} className="text-[9px] font-black text-blue-600 uppercase underline tracking-widest">Editar</button>
             </div>
          </div>

          <div className="pt-2">
            <button 
              onClick={handleResetPass}
              disabled={loading === 'security'}
              className="w-full py-5 bg-[var(--surface)] text-[var(--text-primary)] rounded-2xl font-black text-xs uppercase tracking-widest flex items-center justify-center gap-3 hover:bg-[var(--surface-muted)] border border-[var(--border)] transition-all disabled:opacity-30"
            >
              {loading === 'security' ? <Loader2 className="h-5 w-5 animate-spin" /> : <Lock className="h-5 w-5" />}
              Redefinir Credenciais
            </button>
          </div>
        </section>
      </div>

       {/* SEÇÃO: ADMIN COMMAND CENTER - Visível apenas para Admins */}
       {authState.user?.isAdmin && (
        <section className="bg-slate-950 p-10 rounded-[3rem] border border-slate-800 shadow-2xl relative overflow-hidden group border-l-[10px] border-l-blue-600">
          <div className="absolute top-0 right-0 p-12 opacity-5 group-hover:opacity-10 transition-opacity transform translate-x-10 -translate-y-10">
            <Terminal className="h-48 w-48 text-white" />
          </div>
          <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-10">
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-blue-600 rounded-xl">
                  <ShieldCheck className="h-6 w-6 text-white" />
                </div>
                <h2 className="text-2xl font-black text-white uppercase tracking-tighter">Command Center</h2>
              </div>
              <p className="text-slate-400 text-sm font-medium max-w-lg leading-relaxed">
                Você possui privilégios de Super Admin. Acesse o painel operacional para gerenciar usuários, visualizar logs de acesso e auditar conformidades globais.
              </p>
            </div>
            <button 
              onClick={() => navigate('/admin')}
              className="flex items-center justify-center gap-3 px-10 py-5 bg-blue-600 text-white font-black text-xs uppercase tracking-widest rounded-2xl hover:bg-blue-700 transition-all shadow-2xl shadow-blue-600/40 active:scale-95 whitespace-nowrap always-white"
            >
              Painel Estratégico <ChevronRight className="h-5 w-5" />
            </button>
          </div>
        </section>
      )}

      {/* SEÇÃO: SUPORTE */}
      <section className="bg-[var(--surface)] p-10 rounded-[2.5rem] border border-[var(--border)] shadow-sm">
        <div className="flex flex-col md:flex-row gap-16">
          <div className="md:w-1/3 space-y-6">
            <div className="p-5 bg-blue-600/10 rounded-3xl w-fit">
              <HelpCircle className="h-12 w-12 text-blue-600" />
            </div>
            <div className="space-y-2">
              <h2 className="text-3xl font-black text-[var(--text-primary)] tracking-tighter">Central de Ajuda</h2>
              <p className="text-slate-500 leading-relaxed font-medium">Encontrou algum erro ou tem dúvidas sobre como aplicar a LGPD no seu negócio? Nossa equipe de suporte está pronta para te ouvir.</p>
            </div>
            <div className="pt-4 flex items-center gap-3 text-[10px] font-black text-blue-600 uppercase tracking-widest">
              <div className="h-2.5 w-2.5 rounded-full bg-blue-600 animate-pulse" /> Resposta em até 48h úteis
            </div>
          </div>

          <form onSubmit={handleSupportSubmit} className="flex-1 space-y-8">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="text-[10px] font-black text-slate-500 uppercase mb-2 block px-1">Assunto da Demanda</label>
                <select 
                  value={supportSubject} 
                  onChange={(e) => setSupportSubject(e.target.value)}
                  className="w-full px-5 py-4 rounded-2xl border border-[var(--border)] outline-none focus:ring-4 focus:ring-blue-500/5 focus:bg-[var(--surface)] text-[var(--text-primary)] font-bold bg-[var(--surface-muted)] transition-all cursor-pointer"
                >
                  <option>Dúvida sobre LGPD</option>
                  <option>Erro no Sistema</option>
                  <option>Sugestão de Melhoria</option>
                  <option>Problemas com Pagamento</option>
                  <option>Outro</option>
                </select>
              </div>
              <div>
                <label className="text-[10px] font-black text-slate-500 uppercase mb-2 block px-1">Evidência Anexa (Opcional)</label>
                <div 
                  onClick={() => fileInputRef.current?.click()}
                  className="px-5 py-4 rounded-2xl border border-[var(--border)] bg-[var(--surface-muted)] text-slate-600 flex items-center gap-3 cursor-pointer hover:bg-[var(--surface)] transition-all truncate group"
                >
                  <ImageIcon className="h-5 w-5 shrink-0 text-slate-400 group-hover:text-blue-600 transition-colors" />
                  <span className="text-[11px] font-bold text-[var(--text-primary)] truncate">{supportFile ? supportFile.name : 'Selecionar imagem (máx 2MB)'}</span>
                </div>
                <input 
                  type="file" 
                  ref={fileInputRef} 
                  className="hidden" 
                  accept="image/*"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file && file.size > 2 * 1024 * 1024) {
                      setError('A imagem deve ter no máximo 2MB.');
                      return;
                    }
                    setSupportFile(file || null);
                  }}
                />
              </div>
            </div>
            <div>
              <label className="text-[10px] font-black text-slate-500 uppercase mb-2 block px-1">Detalhamento</label>
              <textarea 
                value={supportMessage}
                onChange={(e) => setSupportMessage(e.target.value)}
                required
                className="w-full h-40 px-5 py-5 rounded-2xl border border-[var(--border)] focus:bg-[var(--surface)] focus:border-blue-600 focus:ring-4 focus:ring-blue-500/5 outline-none transition-all resize-none text-[var(--text-primary)] font-bold placeholder:text-slate-400 bg-[var(--surface-muted)] leading-relaxed"
                placeholder="Descreva exatamente como podemos te ajudar..."
              />
            </div>
            <button 
              type="submit"
              disabled={loading === 'support' || !supportMessage.trim()}
              className="px-12 py-5 bg-slate-950 text-white rounded-2xl font-black text-xs uppercase tracking-widest flex items-center gap-3 hover:bg-black transition-all disabled:opacity-30 always-white shadow-xl shadow-slate-900/10"
            >
              {loading === 'support' ? <Loader2 className="h-5 w-5 animate-spin" /> : <Mail className="h-5 w-5" />}
              Abrir Chamado de Suporte
            </button>
          </form>
        </div>
      </section>

      {/* MODAL DE REAUTENTICAÇÃO PARA E-MAIL */}
      {showEmailModal && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-md z-[100] flex items-center justify-center p-6 sm:p-10">
          <div className="bg-[var(--surface)] w-full max-w-lg rounded-[3rem] p-12 shadow-[0_30px_100px_rgba(0,0,0,0.5)] animate-in zoom-in-95 space-y-8 border border-[var(--border)]">
            <div className="text-center space-y-4">
              <div className="p-4 bg-blue-600/10 rounded-2xl w-fit mx-auto">
                <ShieldAlert className="h-10 w-10 text-blue-600" />
              </div>
              <h3 className="text-3xl font-black text-[var(--text-primary)] tracking-tight">Segurança Exigida</h3>
              <p className="text-sm text-slate-500 font-medium">Por segurança, insira sua senha atual para alterar o e-mail da conta.</p>
            </div>

            <div className="space-y-6">
              <div>
                <label className="text-[10px] font-black text-slate-500 uppercase block mb-2 px-1">Novo E-mail Corporativo</label>
                <input 
                  type="email" 
                  value={email} 
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full px-5 py-4 rounded-2xl border border-[var(--border)] focus:bg-[var(--surface)] focus:border-blue-600 focus:ring-4 focus:ring-blue-500/5 outline-none text-[var(--text-primary)] font-bold bg-[var(--surface-muted)] transition-all"
                />
              </div>
              <div>
                <label className="text-[10px] font-black text-slate-500 uppercase block mb-2 px-1">Senha de Verificação</label>
                <input 
                  type="password" 
                  value={currentPassword} 
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  className="w-full px-5 py-4 rounded-2xl border border-[var(--border)] focus:bg-[var(--surface)] focus:border-blue-600 focus:ring-4 focus:ring-blue-500/5 outline-none text-[var(--text-primary)] font-bold bg-[var(--surface-muted)] transition-all"
                />
              </div>
            </div>

            <div className="flex gap-4 pt-4">
              <button 
                onClick={() => setShowEmailModal(false)}
                className="flex-1 py-5 text-xs font-black uppercase text-slate-500 tracking-widest hover:bg-[var(--surface-muted)] rounded-2xl transition-all"
              >
                Cancelar
              </button>
              <button 
                onClick={handleUpdateEmail}
                disabled={loading === 'email' || !currentPassword}
                className="flex-1 py-5 bg-blue-600 text-white rounded-2xl font-black text-xs uppercase tracking-widest shadow-2xl shadow-blue-600/20 hover:bg-blue-700 transition-all disabled:opacity-30 always-white"
              >
                {loading === 'email' ? <Loader2 className="h-5 w-5 animate-spin mx-auto" /> : 'Validar & Salvar'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
