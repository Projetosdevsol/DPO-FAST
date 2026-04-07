
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
  Plus
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { storage, db } from '../lib/firebase';
import { ref, uploadBytes, getDownloadURL } from 'https://www.gstatic.com/firebasejs/10.8.0/firebase-storage.js';
import { collection, addDoc } from 'https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js';
import { QuestionnaireData, SectorMapping } from '../types';

interface SettingsProps {
  initialQData?: QuestionnaireData | null;
  onSaveQData?: (data: QuestionnaireData) => Promise<void>;
}

export const Settings: React.FC<SettingsProps> = ({ initialQData, onSaveQData }) => {
  const { authState, updateUser, updateUserEmail, resetPassword } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Perfil State
  const [name, setName] = useState(authState.user?.name || '');
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
      await updateUser({ name });
      setSuccess('Perfil atualizado com sucesso!');
    } catch (err) {
      setError('Erro ao atualizar perfil.');
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

  return (
    <div className="max-w-4xl mx-auto space-y-8 animate-in fade-in pb-20">
      <header>
        <h1 className="text-3xl font-bold text-gray-900">Ajustes</h1>
        <p className="text-gray-500">Gerencie sua conta e entre em contato com o suporte.</p>
      </header>

      {success && (
        <div className="p-4 bg-green-50 border border-green-200 rounded-2xl flex items-center gap-3 text-green-700 font-bold shadow-sm">
          <CheckCircle className="h-5 w-5" /> {success}
        </div>
      )}

      {error && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-2xl flex items-center gap-3 text-red-700 font-bold shadow-sm">
          <ShieldAlert className="h-5 w-5" /> {error}
        </div>
      )}

      {/* SEÇÃO: ADMIN COMMAND CENTER - Visível apenas para Admins */}
      {authState.user?.isAdmin && (
        <section className="bg-slate-900 p-8 rounded-[2.5rem] border border-slate-800 shadow-2xl shadow-slate-200 relative overflow-hidden group border-l-[6px] border-l-indigo-600">
          <div className="absolute top-0 right-0 p-12 opacity-5 group-hover:opacity-10 transition-opacity transform translate-x-10 -translate-y-10">
            <Terminal className="h-40 w-40 text-white" />
          </div>
          <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <div className="p-1.5 bg-indigo-600 rounded-lg">
                  <ShieldCheck className="h-4 w-4 text-white" />
                </div>
                <h2 className="text-xl font-bold text-white uppercase tracking-wider">Acesso Administrativo</h2>
              </div>
              <p className="text-slate-400 text-sm max-w-md">
                Você possui privilégios de Super Admin. Acesse o painel operacional para gerenciar usuários, assinaturas e tickets de suporte.
              </p>
            </div>
            <button 
              onClick={() => navigate('/admin')}
              className="flex items-center justify-center gap-2 px-8 py-4 bg-indigo-600 text-white font-bold rounded-2xl hover:bg-indigo-700 transition-all shadow-xl shadow-indigo-900/40 active:scale-95 whitespace-nowrap"
            >
              Abrir Admin Command Center <ChevronRight className="h-5 w-5" />
            </button>
          </div>
        </section>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        
        {/* SEÇÃO: PERFIL */}
        <section className="bg-white p-8 rounded-[2rem] border border-gray-100 shadow-sm space-y-6">
          <h2 className="text-xl font-bold text-gray-900 flex items-center gap-3">
            <UserIcon className="h-5 w-5 text-blue-600" /> Dados do Perfil
          </h2>
          
          <div className="space-y-4">
            <div>
              <label className="text-xs font-bold text-gray-500 uppercase tracking-widest block mb-2">Nome Completo</label>
              <input 
                type="text" 
                value={name} 
                onChange={(e) => setName(e.target.value)}
                className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:bg-white focus:ring-4 focus:ring-blue-50 focus:border-blue-600 outline-none transition-all text-slate-950 font-bold placeholder:text-slate-400 bg-slate-50"
              />
            </div>
            <div>
              <label className="text-xs font-bold text-gray-500 uppercase tracking-widest block mb-2">E-mail Corporativo</label>
              <div className="flex gap-2">
                <input 
                  type="email" 
                  value={email} 
                  disabled
                  className="flex-1 px-4 py-3 rounded-xl border border-slate-200 bg-slate-100 text-slate-500 outline-none transition-all"
                />
                <button 
                  onClick={() => setShowEmailModal(true)}
                  className="px-4 bg-slate-50 text-slate-600 rounded-xl hover:bg-slate-100 border border-slate-200 font-bold text-xs"
                >
                  Alterar
                </button>
              </div>
            </div>
            <button 
              onClick={handleUpdateProfile}
              disabled={loading === 'profile' || name === authState.user?.name}
              className="w-full py-4 bg-blue-600 text-white rounded-2xl font-bold flex items-center justify-center gap-2 hover:bg-blue-700 transition-all disabled:opacity-30"
            >
              {loading === 'profile' ? <Loader2 className="h-5 w-5 animate-spin" /> : <Save className="h-5 w-5" />}
              Salvar Alterações
            </button>
          </div>
        </section>

        {/* SEÇÃO: SEGURANÇA */}
        <section className="bg-white p-8 rounded-[2rem] border border-gray-100 shadow-sm space-y-6">
          <h2 className="text-xl font-bold text-gray-900 flex items-center gap-3">
            <Lock className="h-5 w-5 text-red-500" /> Segurança
          </h2>
          <p className="text-sm text-gray-500">Deseja alterar sua senha de acesso? Enviaremos um link de redefinição para o seu e-mail.</p>
          <button 
            onClick={handleResetPass}
            disabled={loading === 'security'}
            className="w-full py-4 bg-gray-50 text-gray-900 rounded-2xl font-bold flex items-center justify-center gap-2 hover:bg-gray-100 border border-gray-200 transition-all disabled:opacity-30"
          >
            {loading === 'security' ? <Loader2 className="h-5 w-5 animate-spin" /> : <Mail className="h-5 w-5" />}
            Redefinir Senha via E-mail
          </button>
        </section>
      </div>

      {/* SEÇÃO: SUPORTE */}
      <section className="bg-white p-10 rounded-[2.5rem] border border-gray-100 shadow-sm">
        <div className="flex flex-col md:flex-row gap-12">
          <div className="md:w-1/3 space-y-4">
            <div className="p-4 bg-blue-50 rounded-3xl w-fit">
              <HelpCircle className="h-10 w-10 text-blue-600" />
            </div>
            <h2 className="text-2xl font-bold text-gray-900">Central de Ajuda</h2>
            <p className="text-gray-500 leading-relaxed">Encontrou algum erro ou tem dúvidas sobre como aplicar a LGPD no seu negócio? Nossa equipe de especialistas está pronta para te ouvir.</p>
            <div className="pt-4 flex items-center gap-3 text-xs font-bold text-blue-600 uppercase tracking-widest">
              <div className="h-2 w-2 rounded-full bg-blue-600 animate-pulse" /> Resposta em até 48h úteis
            </div>
          </div>

          <form onSubmit={handleSupportSubmit} className="flex-1 space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-bold text-gray-500 uppercase mb-2 block">Assunto</label>
                <select 
                  value={supportSubject} 
                  onChange={(e) => setSupportSubject(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl border border-slate-200 outline-none focus:ring-4 focus:ring-blue-50 focus:bg-white text-slate-950 font-bold bg-slate-50 transition-all"
                >
                  <option>Dúvida sobre LGPD</option>
                  <option>Erro no Sistema</option>
                  <option>Sugestão de Melhoria</option>
                  <option>Problemas com Pagamento</option>
                  <option>Outro</option>
                </select>
              </div>
              <div>
                <label className="text-xs font-bold text-gray-500 uppercase mb-2 block">Anexar Evidência (Opcional)</label>
                <div 
                  onClick={() => fileInputRef.current?.click()}
                  className="px-4 py-3 rounded-xl border border-slate-200 bg-slate-50 text-slate-600 flex items-center gap-2 cursor-pointer hover:bg-slate-100 transition-all truncate"
                >
                  <ImageIcon className="h-4 w-4 shrink-0" />
                  <span className="text-xs font-bold text-slate-950 truncate">{supportFile ? supportFile.name : 'Selecionar imagem (máx 2MB)'}</span>
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
              <label className="text-xs font-bold text-gray-500 uppercase mb-2 block">Sua Mensagem</label>
              <textarea 
                value={supportMessage}
                onChange={(e) => setSupportMessage(e.target.value)}
                required
                className="w-full h-32 px-4 py-4 rounded-xl border border-slate-200 focus:bg-white focus:border-blue-600 focus:ring-4 focus:ring-blue-50 outline-none transition-all resize-none text-slate-950 font-bold placeholder:text-slate-400 bg-slate-50"
                placeholder="Descreva detalhadamente sua dúvida ou o problema encontrado..."
              />
            </div>
            <button 
              type="submit"
              disabled={loading === 'support' || !supportMessage.trim()}
              className="px-10 py-4 bg-gray-900 text-white rounded-2xl font-bold flex items-center gap-2 hover:bg-black transition-all disabled:opacity-30"
            >
              {loading === 'support' ? <Loader2 className="h-5 w-5 animate-spin" /> : <Mail className="h-5 w-5" />}
              Enviar Mensagem
            </button>
          </form>
        </div>
      </section>

      {/* MODAL DE REAUTENTICAÇÃO PARA E-MAIL */}
      {showEmailModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-md rounded-[2.5rem] p-10 shadow-2xl animate-in zoom-in-95 space-y-6">
            <div className="text-center space-y-2">
              <div className="p-3 bg-blue-50 rounded-2xl w-fit mx-auto">
                <ShieldAlert className="h-8 w-8 text-blue-600" />
              </div>
              <h3 className="text-2xl font-bold text-gray-900">Confirme sua Identidade</h3>
              <p className="text-sm text-gray-500">Por segurança, insira sua senha atual para alterar o e-mail da conta.</p>
            </div>

            <div className="space-y-4">
              <div>
                <label className="text-xs font-bold text-gray-500 uppercase block mb-2">Novo E-mail</label>
                <input 
                  type="email" 
                  value={email} 
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:bg-white focus:border-blue-600 focus:ring-4 focus:ring-blue-50 outline-none text-slate-950 font-bold bg-slate-50 transition-all"
                />
              </div>
              <div>
                <label className="text-xs font-bold text-gray-500 uppercase block mb-2">Sua Senha Atual</label>
                <input 
                  type="password" 
                  value={currentPassword} 
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:bg-white focus:border-blue-600 focus:ring-4 focus:ring-blue-50 outline-none text-slate-950 font-bold bg-slate-50 transition-all"
                />
              </div>
            </div>

            <div className="flex gap-3">
              <button 
                onClick={() => setShowEmailModal(false)}
                className="flex-1 py-4 text-sm font-bold text-gray-500 hover:bg-gray-50 rounded-2xl transition-all"
              >
                Cancelar
              </button>
              <button 
                onClick={handleUpdateEmail}
                disabled={loading === 'email' || !currentPassword}
                className="flex-1 py-4 bg-blue-600 text-white rounded-2xl font-bold text-sm shadow-lg shadow-blue-100 hover:bg-blue-700 transition-all disabled:opacity-30"
              >
                {loading === 'email' ? <Loader2 className="h-5 w-5 animate-spin mx-auto" /> : 'Confirmar'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
