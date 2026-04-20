
import React, { useState, useEffect, useMemo } from 'react';
import { Routes, Route, NavLink, useNavigate } from 'react-router-dom';
import { 
  Users, 
  CreditCard, 
  LifeBuoy, 
  Activity, 
  ShieldCheck, 
  Search, 
  MoreVertical, 
  CheckCircle2, 
  Clock, 
  AlertCircle,
  LogOut,
  ChevronRight,
  TrendingUp,
  UserCheck,
  Loader2,
  ExternalLink,
  MessageSquare,
  Paperclip,
  Eye,
  Filter,
  ArrowLeft,
  Calendar,
  User as UserIcon,
  Tag,
  Trash2,
  Edit,
  X,
  Save,
  Building,
  Check,
  ShieldAlert,
  ArrowUpRight,
  ClipboardList,
  Layers,
  Map,
  Target,
  Mail,
  MapPin,
  Clipboard,
  Info,
  History,
  FileText,
  Trophy,
  Scale,
  Sword,
  Star,
  LogIn
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { adminService } from '../services/adminService';
import { questionnaireService, tasksService } from '../services/firestoreService';
import { User, SupportTicket, Subscription, QuestionnaireData, ComplianceTask, AccessLog } from '../types';
import { ACHIEVEMENTS } from '../logic/achievementEngine';
import { Logo } from './Logo';

const ICON_MAP: any = { Trophy, ShieldCheck, Star, Zap: Trophy, Award: Trophy, Layers, Map, Eye, Scale, Sword };

const AdminOverview: React.FC<{ users: User[], tickets: SupportTicket[] }> = ({ users, tickets }) => {
  const activeUsers = (users || []).filter(u => u.status !== 'suspended').length;
  const onlineUsers = (users || []).filter(u => u.isOnline).length;
  const proUsers = (users || []).filter(u => u.plan === 'pro' || u.plan === 'enterprise').length;
  const openTickets = (tickets || []).filter(t => t.status === 'open').length;

  const stats = [
    { label: 'Total Usuários', value: (users || []).length, icon: Users, color: 'text-indigo-600', bg: 'bg-indigo-50' },
    { label: 'Online Agora', value: onlineUsers, icon: Activity, color: 'text-emerald-600', bg: 'bg-emerald-50' },
    { label: 'Assinantes Pagos', value: proUsers, icon: CreditCard, color: 'text-blue-600', bg: 'bg-blue-50' },
    { label: 'Suporte Pendente', value: openTickets, icon: MessageSquare, color: 'text-amber-600', bg: 'bg-amber-50' },
  ];

  return (
    <div className="space-y-8 page-transition">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((s, i) => (
          <div key={i} className="bg-white p-6 rounded-[2rem] border border-slate-100 shadow-sm flex items-center gap-5">
            <div className={`p-4 ${s.bg} ${s.color} rounded-2xl`}>
              <s.icon className={`h-6 w-6 ${s.label === 'Online Agora' && s.value > 0 ? 'animate-pulse' : ''}`} />
            </div>
            <div>
              <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">{s.label}</p>
              <p className="text-2xl font-black text-slate-900">{s.value}</p>
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-sm">
          <div className="flex items-center justify-between mb-8">
            <h3 className="text-xl font-bold text-slate-900 flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-indigo-600" /> Atividade Recente
            </h3>
            <span className="text-xs font-bold text-slate-400">Últimos 30 dias</span>
          </div>
          <div className="space-y-4">
            {(users || []).slice(0, 5).map((user) => (
              <div key={user.id} className="flex items-center justify-between p-4 bg-slate-50 rounded-2xl">
                <div className="flex items-center gap-4">
                  <div className="relative">
                    <div className="h-10 w-10 bg-white rounded-xl flex items-center justify-center font-bold text-indigo-600 shadow-sm border border-slate-100">
                      {user.name.charAt(0)}
                    </div>
                    {user.isOnline && (
                      <div className="absolute -top-1 -right-1 h-3.5 w-3.5 bg-emerald-500 rounded-full border-2 border-white shadow-sm" />
                    )}
                  </div>
                  <div>
                    <p className="text-sm font-bold text-slate-900">{user.name}</p>
                    <p className="text-[10px] text-slate-400 font-bold uppercase">{user.companyName}</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-xs font-bold text-slate-600">{user.plan.toUpperCase()}</p>
                  <p className="text-[10px] text-slate-400 font-medium">{new Date(user.createdAt).toLocaleDateString()}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-slate-900 p-8 rounded-[2.5rem] text-white shadow-xl">
          <h3 className="text-lg font-bold mb-6 flex items-center gap-2">
            <LifeBuoy className="h-5 w-5 text-indigo-400" /> Resumo de Suporte
          </h3>
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <span className="text-sm text-slate-400">Tickets Resolvidos</span>
              <span className="text-sm font-bold">{(tickets || []).filter(t => t.status === 'resolved').length}</span>
            </div>
            <div className="h-2 bg-slate-800 rounded-full overflow-hidden">
              <div 
                className="h-full bg-indigo-500" 
                style={{ width: `${((tickets || []).filter(t => t.status === 'resolved').length / Math.max((tickets || []).length, 1)) * 100}%` }} 
              />
            </div>
            <div className="space-y-3">
              {(tickets || []).filter(t => t.status === 'open').slice(0, 3).map(ticket => (
                <div key={ticket.id} className="p-3 bg-white/5 border border-white/10 rounded-xl text-xs">
                  <p className="font-bold truncate">{ticket.subject}</p>
                  <p className="text-slate-500 mt-1 truncate">{ticket.userName}</p>
                </div>
              ))}
            </div>
            <NavLink to="/admin/support" className="block text-center py-3 bg-white text-slate-900 rounded-xl font-bold text-xs hover:bg-indigo-50 transition-colors">
              Ir para Central de Suporte
            </NavLink>
          </div>
        </div>
      </div>
    </div>
  );
};

const TicketDetailsModal: React.FC<{ ticket: SupportTicket; onClose: () => void; onStatusUpdate: any }> = ({ ticket, onClose, onStatusUpdate }) => {
  const [internalNotes, setInternalNotes] = useState(ticket.internalNotes || '');
  const [isSaving, setIsSaving] = useState(false);
  const [copySuccess, setCopySuccess] = useState(false);

  const handleSaveNotes = async () => {
    setIsSaving(true);
    try {
      await adminService.updateTicketNotes(ticket.id, internalNotes);
      setIsSaving(false);
    } catch (err) {
      alert('Erro ao salvar notas.');
      setIsSaving(false);
    }
  };

  const copyEmail = () => {
    navigator.clipboard.writeText(ticket.userEmail);
    setCopySuccess(true);
    setTimeout(() => setCopySuccess(false), 2000);
  };

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[110] flex items-center justify-center p-4">
      <div className="bg-white w-full max-w-4xl max-h-[90vh] rounded-[2.5rem] overflow-hidden shadow-2xl animate-in zoom-in-95 flex flex-col">
        <div className="p-8 border-b border-slate-50 flex items-center justify-between bg-slate-50/50">
          <div className="flex items-center gap-5">
            <div className={`p-4 rounded-2xl shadow-lg ${ticket.status === 'open' ? 'bg-red-500 text-white' : ticket.status === 'in_progress' ? 'bg-amber-500 text-white' : 'bg-emerald-500 text-white'}`}>
              <MessageSquare className="h-6 w-6" />
            </div>
            <div>
              <h3 className="text-2xl font-black text-slate-900">{ticket.subject}</h3>
              <p className="text-xs font-bold text-slate-400 uppercase tracking-widest flex items-center gap-2">
                Ticket #{ticket.id.slice(-6).toUpperCase()} • Aberto em {new Date(ticket.createdAt).toLocaleString()}
              </p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 text-slate-400 hover:bg-white rounded-full transition-all border border-transparent hover:border-slate-100 shadow-sm"><X className="h-6 w-6" /></button>
        </div>

        <div className="flex-1 overflow-y-auto p-8 grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-8">
            <div className="space-y-4">
              <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Mensagem do Cliente</h4>
              <div className="bg-slate-50 p-6 rounded-3xl border border-slate-100 text-slate-700 leading-relaxed font-medium">
                {ticket.message}
              </div>
              {ticket.attachment && (
                <a 
                  href={ticket.attachment} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-3 p-4 bg-indigo-50 border border-indigo-100 rounded-2xl text-indigo-700 font-bold text-sm hover:bg-indigo-100 transition-all"
                >
                  <Paperclip className="h-5 w-5" /> Visualizar Anexo do Ticket
                </a>
              )}
            </div>

            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Notas Internas (Equipe Admin)</h4>
                {isSaving && <span className="text-[10px] font-bold text-indigo-500 animate-pulse">SALVANDO...</span>}
              </div>
              <textarea 
                value={internalNotes}
                onChange={(e) => setInternalNotes(e.target.value)}
                onBlur={handleSaveNotes}
                className="w-full h-32 p-4 rounded-2xl bg-slate-50 border border-slate-200 focus:bg-white focus:border-indigo-600 focus:ring-4 focus:ring-indigo-50 outline-none transition-all text-sm font-bold text-slate-950 placeholder:text-slate-400"
                placeholder="Anote aqui detalhes do atendimento, prazos acordados ou informações técnicas relevantes para outros administradores..."
              />
            </div>
          </div>

          <div className="space-y-6">
            <div className="bg-slate-50 p-6 rounded-3xl border border-slate-100 space-y-4">
              <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Dossiê do Solicitante</h4>
              <div className="space-y-4">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 bg-white rounded-xl flex items-center justify-center font-bold text-indigo-600 shadow-sm">{ticket.userName.charAt(0)}</div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-bold text-slate-900 truncate">{ticket.userName}</p>
                    <p className="text-[10px] text-slate-500 font-bold truncate uppercase">{ticket.userEmail}</p>
                  </div>
                  <button onClick={copyEmail} className="p-2 hover:bg-white rounded-lg transition-colors text-slate-400 hover:text-indigo-600">
                    {copySuccess ? <Check className="h-4 w-4" /> : <Clipboard className="h-4 w-4" />}
                  </button>
                </div>
                <div className="pt-4 border-t border-slate-200 grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-[10px] font-bold text-slate-400 uppercase">ID Usuário</p>
                    <p className="text-[10px] font-bold text-slate-700 truncate">{ticket.userId}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-[10px] font-bold text-slate-400 uppercase">Status Ticket</p>
                    <span className={`inline-block px-2 py-0.5 rounded text-[8px] font-black uppercase ${ticket.status === 'open' ? 'bg-red-100 text-red-700' : ticket.status === 'in_progress' ? 'bg-amber-100 text-amber-700' : 'bg-emerald-100 text-emerald-700'}`}>
                      {ticket.status === 'open' ? 'Aberto' : ticket.status === 'in_progress' ? 'Em Fila' : 'Resolvido'}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            <div className="space-y-3">
              <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Alterar Fluxo</h4>
              <select 
                value={ticket.status} 
                onChange={(e) => onStatusUpdate(ticket.id, e.target.value as any)}
                className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl text-xs font-bold text-slate-950 focus:bg-white focus:border-indigo-600 outline-none focus:ring-4 focus:ring-indigo-50 transition-all"
              >
                <option value="open">Reabrir / Novo</option>
                <option value="in_progress">Mover para Atendimento</option>
                <option value="resolved">Marcar como Resolvido</option>
              </select>
              <div className="p-4 bg-indigo-50 rounded-2xl flex items-start gap-3">
                <span className="text-[10px] text-indigo-700 font-medium">Ao marcar como "Resolvido", o ticket será movido para o histórico do cliente no dashboard.</span>
              </div>
            </div>
          </div>
        </div>

        <div className="p-8 bg-slate-50 border-t border-slate-100 flex justify-end gap-3">
          <button onClick={onClose} className="px-8 py-3 bg-white text-slate-900 font-bold rounded-2xl border border-slate-200 hover:bg-slate-100 transition-all shadow-sm">Fechar Detalhes</button>
          <a href={`mailto:${ticket.userEmail}?subject=Re: [LGPD Fácil] ${ticket.subject}`} className="px-8 py-3 bg-indigo-600 text-white font-bold rounded-2xl shadow-xl shadow-indigo-100 hover:bg-indigo-700 transition-all flex items-center gap-2">
            Responder via E-mail <ExternalLink className="h-4 w-4" />
          </a>
        </div>
      </div>
    </div>
  );
};

const UserDetailsModal: React.FC<{ user: User; onClose: () => void }> = ({ user, onClose }) => {
  const [qData, setQData] = useState<QuestionnaireData | null>(null);
  const [tasks, setTasks] = useState<ComplianceTask[]>([]);
  const [accessLogs, setAccessLogs] = useState<AccessLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'info' | 'mapping' | 'tasks' | 'achievements' | 'logs'>('info');

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const [questionnaire, fetchedTasks, fetchedLogs] = await Promise.all([
          questionnaireService.get(user.id),
          new Promise<ComplianceTask[]>((resolve) => {
            const unsub = tasksService.subscribe(user.id, (t) => {
              unsub();
              resolve(t);
            });
          }),
          adminService.getUserAccessLogs(user.id)
        ]);
        setQData(questionnaire);
        setTasks(fetchedTasks || []);
        setAccessLogs(fetchedLogs || []);
      } catch (err) {
        console.error("Erro ao buscar detalhes do usuário:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [user.id]);

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[110] flex items-center justify-center p-4">
      <div className="bg-white w-full max-w-4xl max-h-[90vh] rounded-[2.5rem] overflow-hidden shadow-2xl animate-in zoom-in-95 flex flex-col">
        <div className="p-8 border-b border-slate-50 flex items-center justify-between bg-slate-50/50">
          <div className="flex items-center gap-5">
            <div className="relative">
              <div className="h-14 w-14 bg-indigo-600 text-white rounded-2xl flex items-center justify-center text-xl font-black shadow-lg shadow-indigo-100">
                {user.name.charAt(0)}
              </div>
              {user.isOnline && (
                <div className="absolute -top-1 -right-1 h-5 w-5 bg-emerald-500 rounded-full border-4 border-white shadow-sm" />
              )}
            </div>
            <div>
              <h3 className="text-2xl font-black text-slate-900">{user.name}</h3>
              <p className="text-xs font-bold text-slate-400 uppercase tracking-widest flex items-center gap-2">
                {user.companyName} • {user.isOnline ? <span className="text-emerald-500 font-black">ONLINE AGORA</span> : `Visto por último: ${user.lastLogin ? new Date(user.lastLogin).toLocaleString('pt-BR') : 'Sem registro'}`}
              </p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 text-slate-400 hover:bg-white rounded-full transition-all border border-transparent hover:border-slate-100 shadow-sm"><X className="h-6 w-6" /></button>
        </div>

        <div className="flex-1 overflow-y-auto p-8">
          {loading ? (
            <div className="h-64 flex flex-col items-center justify-center space-y-4">
              <Loader2 className="h-10 w-10 text-indigo-600 animate-spin" />
              <p className="text-sm font-bold text-slate-400 uppercase tracking-widest">Carregando dossiê...</p>
            </div>
          ) : (
            <div className="space-y-8">
              <div className="flex bg-slate-100 p-1 rounded-2xl gap-1 w-fit overflow-x-auto">
                <button onClick={() => setActiveTab('info')} className={`px-6 py-2.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap ${activeTab === 'info' ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-500 hover:bg-white/50'}`}>Informações Gerais</button>
                <button onClick={() => setActiveTab('mapping')} className={`px-6 py-2.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap ${activeTab === 'mapping' ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-500 hover:bg-white/50'}`}>Mapeamento</button>
                <button onClick={() => setActiveTab('tasks')} className={`px-6 py-2.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap ${activeTab === 'tasks' ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-500 hover:bg-white/50'}`}>Plano de Ação</button>
                <button onClick={() => setActiveTab('logs')} className={`px-6 py-2.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap ${activeTab === 'logs' ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-500 hover:bg-white/50'}`}>Auditoria de Acesso</button>
                <button onClick={() => setActiveTab('achievements')} className={`px-6 py-2.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap ${activeTab === 'achievements' ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-500 hover:bg-white/50'}`}>Conquistas</button>
              </div>

              {activeTab === 'info' && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 animate-in fade-in duration-300">
                  <div className="bg-slate-50 p-6 rounded-3xl space-y-4 border border-slate-100">
                    <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] flex items-center gap-2"><Building className="h-3 w-3" /> Dados da Empresa</h4>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <p className="text-[10px] font-bold text-slate-400 uppercase">CNPJ</p>
                        <p className="text-sm font-bold text-slate-700">{user.cnpj || 'Não informado'}</p>
                      </div>
                      <div>
                        <p className="text-[10px] font-bold text-slate-400 uppercase">Porte</p>
                        <p className="text-sm font-bold text-slate-700">{qData?.companySize || 'Não mapeado'}</p>
                      </div>
                      <div className="col-span-2">
                        <p className="text-[10px] font-bold text-slate-400 uppercase">Endereço</p>
                        <p className="text-sm font-bold text-slate-700">{user.address || 'Não informado'}</p>
                      </div>
                    </div>
                  </div>
                  <div className="bg-slate-50 p-6 rounded-3xl space-y-4 border border-slate-100">
                    <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] flex items-center gap-2"><Tag className="h-3 w-3" /> Conta e Assinatura</h4>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <p className="text-[10px] font-bold text-slate-400 uppercase">Plano Atual</p>
                        <span className={`inline-block px-2 py-0.5 rounded text-[9px] font-black uppercase mt-1 ${user.plan === 'enterprise' ? 'bg-purple-100 text-purple-700' : user.plan === 'pro' ? 'bg-blue-100 text-blue-700' : 'bg-slate-200 text-slate-600'}`}>{user.plan}</span>
                      </div>
                      <div>
                        <p className="text-[10px] font-bold text-slate-400 uppercase">Status</p>
                        <span className={`inline-block px-2 py-0.5 rounded text-[9px] font-black uppercase mt-1 ${user.status === 'suspended' ? 'bg-red-100 text-red-700' : 'bg-green-100 text-green-700'}`}>{user.status || 'active'}</span>
                      </div>
                      <div>
                        <p className="text-[10px] font-bold text-slate-400 uppercase">Data de Cadastro</p>
                        <p className="text-sm font-bold text-slate-700">{new Date(user.createdAt).toLocaleDateString('pt-BR')}</p>
                      </div>
                      <div>
                        <p className="text-[10px] font-bold text-slate-400 uppercase">Último Acesso</p>
                        <p className="text-sm font-bold text-slate-700">{user.lastLogin ? new Date(user.lastLogin).toLocaleDateString('pt-BR') : '--'}</p>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {activeTab === 'mapping' && (
                <div className="space-y-4 animate-in fade-in duration-300">
                  {qData && qData.sectors && qData.sectors.length > 0 ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {qData.sectors.map(sector => (
                        <div key={sector.id} className="p-5 border border-slate-100 rounded-3xl bg-slate-50 flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <div className={`p-2.5 rounded-xl ${(sector.processes || []).some(p => p.status === 'completed') ? 'bg-green-100 text-green-600' : 'bg-amber-100 text-amber-600'}`}>
                              <Layers className="h-5 w-5" />
                            </div>
                            <div>
                              <p className="text-sm font-bold text-slate-900">{sector.name}</p>
                              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{(sector.processes || []).some(p => p.status === 'completed') ? 'Mapeado' : `Pendente`}</p>
                            </div>
                          </div>
                          {(sector.processes || []).some(p => p.status === 'completed') && <CheckCircle2 className="h-5 w-5 text-green-500" />}
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="py-12 text-center bg-slate-50 rounded-3xl border border-dashed border-slate-200">
                      <Map className="h-10 w-10 text-slate-300 mx-auto mb-3" />
                      <p className="text-sm font-bold text-slate-400 uppercase">Nenhum setor mapeado ainda</p>
                    </div>
                  )}
                </div>
              )}

              {activeTab === 'tasks' && (
                <div className="space-y-4 animate-in fade-in duration-300">
                  {(tasks || []).length > 0 ? (
                    <div className="space-y-3">
                      {tasks.map(task => (
                        <div key={task.id} className="p-4 border border-slate-100 rounded-2xl flex items-center justify-between hover:bg-slate-50 transition-colors">
                          <div className="flex items-center gap-4">
                            <div className={`h-2 w-2 rounded-full ${task.status === 'Concluída' ? 'bg-green-50' : 'bg-amber-500'}`} />
                            <div>
                              <p className="text-sm font-bold text-slate-900">{task.title}</p>
                              <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">{task.targetDocument}</p>
                            </div>
                          </div>
                          <span className={`px-2 py-0.5 rounded text-[9px] font-black uppercase ${task.status === 'Concluída' ? 'bg-green-100 text-green-700' : 'bg-slate-100 text-slate-500'}`}>{task.status}</span>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="py-12 text-center bg-slate-50 rounded-3xl border border-dashed border-slate-200">
                      <Target className="h-10 w-10 text-slate-300 mx-auto mb-3" />
                      <p className="text-sm font-bold text-slate-400 uppercase">Plano de ação ainda não gerado</p>
                    </div>
                  )}
                </div>
              )}

              {activeTab === 'logs' && (
                <div className="space-y-6 animate-in fade-in duration-300">
                  <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] flex items-center gap-2"><History className="h-3 w-3" /> Histórico de Sessões</h4>
                  {accessLogs.length > 0 ? (
                    <div className="space-y-3">
                      {accessLogs.map((log, idx) => (
                        <div key={idx} className="p-4 border border-slate-100 rounded-2xl bg-white shadow-sm flex items-center justify-between">
                          <div className="flex items-center gap-4">
                             <div className={`p-2.5 rounded-xl ${log.type === 'login' ? 'bg-emerald-50 text-emerald-600' : 'bg-slate-100 text-slate-500'}`}>
                               <LogIn className="h-4 w-4" />
                             </div>
                             <div>
                               <p className="text-xs font-bold text-slate-900 uppercase tracking-tight">{log.type === 'login' ? 'Entrada no Sistema' : 'Saída do Sistema'}</p>
                               <p className="text-[10px] text-slate-400 font-medium truncate max-w-md">{log.userAgent}</p>
                             </div>
                          </div>
                          <div className="text-right">
                             <p className="text-xs font-black text-slate-700">{new Date(log.timestamp).toLocaleTimeString('pt-BR')}</p>
                             <p className="text-[10px] text-slate-400 font-bold uppercase">{new Date(log.timestamp).toLocaleDateString('pt-BR')}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="py-12 text-center bg-slate-50 rounded-3xl border border-dashed border-slate-200">
                      <LogIn className="h-10 w-10 text-slate-300 mx-auto mb-3" />
                      <p className="text-sm font-bold text-slate-400 uppercase">Sem logs de acesso registrados</p>
                    </div>
                  )}
                </div>
              )}

              {activeTab === 'achievements' && (
                <div className="space-y-6 animate-in fade-in duration-300">
                  <div className="flex items-center justify-between">
                    <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] flex items-center gap-2"><Trophy className="h-3 w-3" /> Conquistas do Cliente</h4>
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                      {user.achievements?.length || 0} / {ACHIEVEMENTS.length} Desbloqueadas
                    </span>
                  </div>
                  
                  {user.achievements && user.achievements.length > 0 ? (
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      {ACHIEVEMENTS.filter(a => user.achievements?.includes(a.id)).map(achievement => {
                        const Icon = ICON_MAP[achievement.icon] || Trophy;
                        return (
                          <div key={achievement.id} className="p-4 bg-white border border-slate-100 rounded-2xl shadow-sm text-center space-y-2">
                             <div className={`h-12 w-12 rounded-xl mx-auto flex items-center justify-center ${achievement.type === 'platinum' ? 'bg-indigo-50 text-indigo-600' : achievement.type === 'gold' ? 'bg-amber-50 text-amber-600' : 'bg-slate-50 text-slate-500'}`}>
                               <Icon className="h-6 w-6" />
                             </div>
                             <p className="text-[10px] font-bold text-slate-900 truncate">{achievement.title}</p>
                             <span className="text-[8px] font-black uppercase text-slate-400">{achievement.type}</span>
                          </div>
                        );
                      })}
                    </div>
                  ) : (
                    <div className="py-12 text-center bg-slate-50 rounded-3xl border border-dashed border-slate-200">
                      <Trophy className="h-10 w-10 text-slate-300 mx-auto mb-3" />
                      <p className="text-sm font-bold text-slate-400 uppercase">Nenhuma conquista desbloqueada</p>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
        </div>

        <div className="p-8 bg-slate-50 border-t border-slate-100 flex justify-end">
          <button onClick={onClose} className="px-8 py-3 bg-white text-slate-900 font-bold rounded-2xl border border-slate-200 hover:bg-slate-100 transition-all shadow-sm">Fechar Dossiê</button>
        </div>
      </div>
    </div>
  );
};

const UserManagement: React.FC<{ users: User[], onRefresh: () => void }> = ({ users, onRefresh }) => {
  const { authState } = useAuth();
  const [searchTerm, setSearchTerm] = useState('');
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [editFormData, setEditFormData] = useState<Partial<User>>({});
  const [detailedUser, setDetailedUser] = useState<User | null>(null);
  const [isUpdating, setIsUpdating] = useState(false);

  const filteredUsers = useMemo(() => {
    return (users || []).filter(u => 
      (u.name || '').toLowerCase().includes(searchTerm.toLowerCase()) || 
      (u.companyName || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (u.cnpj || '').includes(searchTerm)
    );
  }, [users, searchTerm]);

  const handleEditOpen = (user: User) => {
    setEditingUser(user);
    setEditFormData({
      name: user.name,
      companyName: user.companyName,
      cnpj: user.cnpj,
      address: user.address,
      plan: user.plan,
      status: user.status || 'active'
    });
  };

  const handleSaveEdit = async () => {
    if (!authState.user || !editingUser) return;
    setIsUpdating(true);
    try {
      await adminService.updateUserDetails(editingUser.id, editFormData, authState.user.id, authState.user.name);
      onRefresh();
      setEditingUser(null);
    } catch (err) {
      alert('Erro ao atualizar dados do usuário.');
    } finally {
      setIsUpdating(false);
    }
  };

  const handleAction = async (action: 'status' | 'delete', userId: string, extra?: any) => {
    if (!authState.user) return;
    setIsUpdating(true);
    try {
      if (action === 'status') await adminService.toggleUserStatus(userId, extra, authState.user.id, authState.user.name);
      if (action === 'delete') {
        if (confirm('ATENÇÃO: Esta ação é irreversível e excluirá permanentemente a conta, questionários e tarefas do cliente. Prosseguir?')) {
          await adminService.deleteUser(userId, authState.user.id, authState.user.name);
        }
      }
      onRefresh();
      setEditingUser(null);
    } catch (err) {
      alert('Erro ao processar ação.');
    } finally {
      setIsUpdating(false);
    }
  };

  return (
    <div className="space-y-6 page-transition">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <h2 className="text-2xl font-bold text-slate-900">Gestão de Clientes</h2>
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400" />
          <input 
            type="text" 
            placeholder="Buscar por nome, empresa ou CNPJ..." 
            className="w-full pl-12 pr-4 py-3 rounded-2xl bg-white border border-slate-100 focus:ring-4 focus:ring-indigo-50 focus:border-indigo-600 outline-none transition-all text-sm text-slate-950 font-bold placeholder:text-slate-500"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      <div className="bg-white rounded-[2.5rem] border border-slate-100 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="text-[10px] font-bold text-slate-400 uppercase tracking-widest border-b border-slate-50">
                <th className="px-8 py-5">Cliente / Empresa</th>
                <th className="px-8 py-5">Status / Acesso</th>
                <th className="px-8 py-5">Plano / Status</th>
                <th className="px-8 py-5">Criação</th>
                <th className="px-8 py-5 text-right">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {filteredUsers.map((user) => (
                <tr key={user.id} className="hover:bg-slate-50/50 transition-all group cursor-pointer" onClick={() => setDetailedUser(user)}>
                  <td className="px-8 py-6">
                    <div className="flex items-center gap-4">
                      <div className="relative">
                        <div className="h-10 w-10 bg-indigo-50 text-indigo-600 rounded-xl flex items-center justify-center font-bold border border-slate-100">
                          {(user.name || 'U').charAt(0)}
                        </div>
                        {user.isOnline && (
                          <div className="absolute -top-1 -right-1 h-3.5 w-3.5 bg-emerald-500 rounded-full border-2 border-white shadow-sm animate-pulse" />
                        )}
                      </div>
                      <div>
                        <p className="text-sm font-bold text-slate-900 group-hover:text-indigo-600 transition-colors flex items-center gap-2">
                          {user.name}
                        </p>
                        <p className="text-[10px] text-slate-400 font-bold uppercase">{user.companyName}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-8 py-6">
                    <div className="space-y-1">
                      <div className="flex items-center gap-1.5">
                        <div className={`h-1.5 w-1.5 rounded-full ${user.isOnline ? 'bg-emerald-500' : 'bg-slate-300'}`} />
                        <span className={`text-[10px] font-black uppercase ${user.isOnline ? 'text-emerald-600' : 'text-slate-400'}`}>
                          {user.isOnline ? 'Online agora' : 'Offline'}
                        </span>
                      </div>
                      <p className="text-[9px] font-bold text-slate-400 uppercase tracking-tight">
                        {user.lastLogin ? `Visto ${new Date(user.lastLogin).toLocaleString('pt-BR')}` : 'Nunca acessou'}
                      </p>
                    </div>
                  </td>
                  <td className="px-8 py-6">
                    <div className="flex flex-col gap-1.5">
                      <span className={`w-fit px-2 py-0.5 rounded text-[9px] font-black uppercase ${user.plan === 'enterprise' ? 'bg-purple-100 text-purple-700' : user.plan === 'pro' ? 'bg-blue-100 text-blue-700' : 'bg-slate-200 text-slate-600'}`}>
                        {user.plan}
                      </span>
                      <span className={`w-fit px-2 py-0.5 rounded text-[9px] font-black uppercase ${user.status === 'suspended' ? 'bg-red-100 text-red-700' : 'bg-green-100 text-green-700'}`}>
                        {user.status || 'active'}
                      </span>
                    </div>
                  </td>
                  <td className="px-8 py-6 text-xs text-slate-400 font-medium">
                    {new Date(user.createdAt).toLocaleDateString()}
                  </td>
                  <td className="px-8 py-6 text-right" onClick={(e) => e.stopPropagation()}>
                    <div className="flex justify-end gap-2">
                      <button 
                        onClick={() => handleEditOpen(user)}
                        className="p-2 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-all"
                        title="Editar Dados Cadastrais"
                      >
                        <Edit className="h-4 w-4" />
                      </button>
                      <button 
                        onClick={() => handleAction('delete', user.id)}
                        className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all"
                        title="Excluir Usuário permanentemente"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {detailedUser && (
        <UserDetailsModal user={detailedUser} onClose={() => setDetailedUser(null)} />
      )}

      {editingUser && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[120] flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-xl rounded-[2.5rem] overflow-hidden shadow-2xl animate-in zoom-in-95 flex flex-col max-h-[90vh]">
            <div className="p-8 border-b border-slate-50 flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-indigo-50 text-indigo-600 rounded-2xl">
                  <UserIcon className="h-6 w-6" />
                </div>
                <h3 className="text-xl font-bold text-slate-900">Editar Dados Cadastrais</h3>
              </div>
              <button onClick={() => setEditingUser(null)} className="p-2 text-slate-400 hover:bg-slate-100 rounded-full transition-colors">
                <X className="h-6 w-6" />
              </button>
            </div>
            
            <div className="flex-1 overflow-y-auto p-8 space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest flex items-center gap-2">
                    <UserIcon className="h-3 w-3" /> Nome do Responsável
                  </label>
                  <input 
                    type="text" 
                    value={editFormData.name} 
                    onChange={e => setEditFormData({...editFormData, name: e.target.value})}
                    className="w-full p-3.5 rounded-xl bg-slate-50 border border-slate-100 focus:bg-white focus:border-indigo-600 focus:ring-4 focus:ring-indigo-50 outline-none transition-all text-sm font-bold text-slate-950"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest flex items-center gap-2">
                    <Building className="h-3 w-3" /> Razão Social / Empresa
                  </label>
                  <input 
                    type="text" 
                    value={editFormData.companyName} 
                    onChange={e => setEditFormData({...editFormData, companyName: e.target.value})}
                    className="w-full p-3.5 rounded-xl bg-slate-50 border border-slate-100 focus:bg-white focus:border-indigo-600 focus:ring-4 focus:ring-indigo-50 outline-none transition-all text-sm font-bold text-slate-950"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest flex items-center gap-2">
                    <Mail className="h-3 w-3" /> CNPJ
                  </label>
                  <input 
                    type="text" 
                    value={editFormData.cnpj} 
                    onChange={e => setEditFormData({...editFormData, cnpj: e.target.value})}
                    className="w-full p-3.5 rounded-xl bg-slate-50 border border-slate-100 focus:bg-white focus:border-indigo-600 focus:ring-4 focus:ring-indigo-50 outline-none transition-all text-sm font-bold text-slate-950"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest flex items-center gap-2">
                    <Tag className="h-3 w-3" /> Plano do Sistema
                  </label>
                  <select 
                    value={editFormData.plan} 
                    onChange={e => setEditFormData({...editFormData, plan: e.target.value as any})}
                    className="w-full p-3.5 rounded-xl bg-slate-50 border border-slate-100 focus:bg-white focus:border-indigo-600 focus:ring-4 focus:ring-indigo-50 outline-none transition-all text-sm font-bold text-slate-950"
                  >
                    <option value="free">FREE</option>
                    <option value="pro">PRO</option>
                    <option value="enterprise">ENTERPRISE</option>
                  </select>
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest flex items-center gap-2">
                  <MapPin className="h-3 w-3" /> Endereço Comercial
                </label>
                <textarea 
                  value={editFormData.address} 
                  onChange={e => setEditFormData({...editFormData, address: e.target.value})}
                  className="w-full p-3.5 rounded-xl bg-slate-50 border border-slate-100 focus:bg-white focus:border-indigo-600 focus:ring-4 focus:ring-indigo-50 outline-none transition-all text-sm font-bold text-slate-950 h-24 resize-none placeholder:text-slate-400"
                />
              </div>

              <div className="pt-6 border-t border-slate-50 space-y-4">
                 <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Status da Conta</label>
                 <div className="flex gap-4">
                   <button 
                     onClick={() => handleAction('status', editingUser.id, editingUser.status)}
                     className={`flex-1 py-4 rounded-2xl font-bold text-sm transition-all flex items-center justify-center gap-2 ${editingUser.status === 'suspended' ? 'bg-green-50 text-green-700 border border-green-100 hover:bg-green-100' : 'bg-red-50 text-red-700 border border-red-100 hover:bg-red-100'}`}
                   >
                     {editingUser.status === 'suspended' ? <UserCheck className="h-5 w-5" /> : <ShieldAlert className="h-5 w-5" />}
                     {editingUser.status === 'suspended' ? 'Ativar Conta' : 'Suspender Acesso'}
                   </button>
                 </div>
              </div>
            </div>

            <div className="p-8 bg-slate-50 border-t border-slate-100 flex gap-3">
              <button 
                onClick={() => setEditingUser(null)} 
                className="flex-1 py-4 bg-white text-slate-600 font-bold rounded-2xl border border-slate-200 hover:bg-slate-50 transition-all"
              >
                Cancelar
              </button>
              <button 
                onClick={handleSaveEdit}
                disabled={isUpdating}
                className="flex-[2] py-4 bg-indigo-600 text-white font-bold rounded-2xl hover:bg-indigo-700 transition-all shadow-xl shadow-indigo-100 flex items-center justify-center gap-2 disabled:opacity-50"
              >
                {isUpdating ? <Loader2 className="h-5 w-5 animate-spin" /> : <Save className="h-5 w-5" />}
                Salvar Alterações
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

// --- NOVOS COMPONENTES ADICIONADOS PARA RESOLVER O ERRO DE EXPORTAÇÃO ---

/**
 * Componente principal do Painel Administrativo.
 * Gerencia as rotas internas do admin e o estado global dos dados administrativos.
 */
export const AdminPanel: React.FC = () => {
  const { authState, logout } = useAuth();
  const [users, setUsers] = useState<User[]>([]);
  const [tickets, setTickets] = useState<SupportTicket[]>([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  const fetchUsers = async () => {
    try {
      const allUsers = await adminService.getAllUsers();
      setUsers(allUsers);
    } catch (err) {
      console.error("Erro ao carregar usuários:", err);
    }
  };

  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      await fetchUsers();
      setLoading(false);
    };
    loadData();

    // Inscrição em tempo real para tickets de suporte
    const unsubTickets = adminService.subscribeToTickets((t) => setTickets(t));
    return () => unsubTickets();
  }, []);

  if (loading) {
    return (
      <div className="h-screen flex items-center justify-center bg-slate-50">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="h-10 w-10 text-indigo-600 animate-spin" />
          <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Iniciando Admin Command Center...</p>
        </div>
      </div>
    );
  }

  const navItems = [
    { name: 'Dashboard', path: '/admin', icon: Activity, end: true },
    { name: 'Usuários', path: '/admin/users', icon: Users, end: false },
    { name: 'Suporte', path: '/admin/support', icon: LifeBuoy, end: false },
  ];

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col lg:flex-row">
      {/* Sidebar Administrativa */}
      <aside className="w-full lg:w-72 bg-slate-900 text-white lg:fixed lg:top-0 lg:bottom-0 z-50 flex flex-col transition-all">
        <div className="p-8 flex items-center gap-3">
          <Logo className="h-10 w-10" />
          <div className="flex flex-col">
            <span className="font-bold text-xl tracking-tight">Admin</span>
            <span className="text-[10px] font-bold text-indigo-400 uppercase tracking-widest">LGPD Fácil</span>
          </div>
        </div>

        <nav className="flex-1 px-4 space-y-1">
          <p className="px-4 text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-4 mt-2">Navegação</p>
          {navItems.map((item) => (
            <NavLink
              key={item.path}
              to={item.path}
              end={item.end}
              className={({ isActive }) => `
                flex items-center gap-3 px-4 py-3.5 rounded-2xl text-sm font-bold transition-all
                ${isActive ? 'bg-indigo-600 text-white shadow-xl shadow-indigo-900/40' : 'text-slate-400 hover:bg-white/5 hover:text-white'}
              `}
            >
              <item.icon className="h-5 w-5" />
              {item.name}
            </NavLink>
          ))}
        </nav>

        <div className="p-6 border-t border-white/10 space-y-4">
          <button 
            onClick={() => navigate('/dashboard')}
            className="w-full flex items-center gap-3 px-4 py-3 text-sm font-bold text-slate-400 hover:text-white transition-colors group"
          >
            <ArrowLeft className="h-5 w-5 group-hover:-translate-x-1 transition-transform" /> Voltar ao App
          </button>
          <button 
            onClick={logout}
            className="w-full flex items-center gap-3 px-4 py-3 text-sm font-bold text-red-400 hover:bg-red-400/10 rounded-2xl transition-all"
          >
            <LogOut className="h-5 w-5" /> Sair da Conta
          </button>

          <footer className="pt-4 text-center">
             <p className="text-[8px] font-black text-slate-500 uppercase tracking-[0.2em] leading-relaxed">
                Solution © 2026<br/>
                Desenvolvido por <a href="https://felipe-84bca.web.app/" target="_blank" className="text-indigo-400 hover:underline">Felipe Sadrak</a>
             </p>
          </footer>
        </div>
      </aside>

      {/* Conteúdo Principal */}
      <main className="flex-1 lg:pl-72 transition-all">
        <div className="p-4 md:p-8 max-w-7xl mx-auto min-h-screen">
          <Routes>
            <Route index element={<AdminOverview users={users} tickets={tickets} />} />
            <Route path="users" element={<UserManagement users={users} onRefresh={fetchUsers} />} />
            <Route path="support" element={<SupportTicketsView tickets={tickets} />} />
          </Routes>
        </div>
      </main>
    </div>
  );
};

/**
 * Visualização da listagem de tickets de suporte no painel admin.
 */
const SupportTicketsView: React.FC<{ tickets: SupportTicket[] }> = ({ tickets }) => {
  const [selectedTicket, setSelectedTicket] = useState<SupportTicket | null>(null);
  const [filter, setFilter] = useState<'all' | 'open' | 'resolved'>('all');

  const filteredTickets = useMemo(() => {
    return tickets.filter(t => {
      if (filter === 'open') return t.status !== 'resolved';
      if (filter === 'resolved') return t.status === 'resolved';
      return true;
    });
  }, [tickets, filter]);

  const handleStatusUpdate = async (id: string, status: SupportTicket['status']) => {
    try {
      await adminService.updateTicketStatus(id, status);
    } catch (err) {
      console.error("Erro ao atualizar status do ticket:", err);
    }
  };

  return (
    <div className="space-y-6 page-transition">
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-900">Central de Atendimento</h2>
          <p className="text-sm text-slate-500">Gerencie as solicitações de suporte e dúvidas dos clientes.</p>
        </div>
        <div className="flex bg-white p-1 rounded-xl border border-slate-100 shadow-sm">
          {[
            { id: 'all', label: 'Todos' },
            { id: 'open', label: 'Pendentes' },
            { id: 'resolved', label: 'Resolvidos' }
          ].map(f => (
            <button 
              key={f.id}
              onClick={() => setFilter(f.id as any)}
              className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-all ${filter === f.id ? 'bg-indigo-600 text-white' : 'text-slate-500 hover:bg-slate-50'}`}
            >
              {f.label}
            </button>
          ))}
        </div>
      </header>

      <div className="grid grid-cols-1 gap-4">
        {filteredTickets.length > 0 ? filteredTickets.map(ticket => (
          <div 
            key={ticket.id} 
            onClick={() => setSelectedTicket(ticket)}
            className="bg-white p-6 rounded-[2rem] border border-slate-100 shadow-sm hover:shadow-md transition-all cursor-pointer flex items-center justify-between group"
          >
            <div className="flex items-center gap-5">
              <div className={`p-4 rounded-2xl shadow-sm ${ticket.status === 'open' ? 'bg-red-50 text-red-500' : ticket.status === 'in_progress' ? 'bg-amber-50 text-amber-500' : 'bg-emerald-50 text-emerald-500'}`}>
                <MessageSquare className="h-6 w-6" />
              </div>
              <div>
                <h4 className="font-bold text-slate-900 group-hover:text-indigo-600 transition-colors">{ticket.subject}</h4>
                <div className="flex items-center gap-3 mt-1.5">
                  <span className="text-xs font-bold text-slate-700">{ticket.userName}</span>
                  <span className="text-slate-300">•</span>
                  <span className="text-[10px] text-slate-400 font-medium">{new Date(ticket.createdAt).toLocaleString('pt-BR')}</span>
                </div>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <span className={`px-3 py-1 rounded-xl text-[10px] font-black uppercase tracking-widest ${ticket.status === 'open' ? 'bg-red-100 text-red-700' : ticket.status === 'in_progress' ? 'bg-amber-100 text-amber-700' : 'bg-emerald-100 text-emerald-700'}`}>
                {ticket.status === 'open' ? 'Novo' : ticket.status === 'in_progress' ? 'Em Fila' : 'Concluído'}
              </span>
              <div className="p-2 bg-slate-50 rounded-full group-hover:bg-indigo-50 group-hover:text-indigo-600 text-slate-300 transition-all">
                <ChevronRight className="h-5 w-5" />
              </div>
            </div>
          </div>
        )) : (
          <div className="py-20 text-center bg-white rounded-[2.5rem] border border-dashed border-slate-200">
            <LifeBuoy className="h-12 w-12 text-slate-200 mx-auto mb-4" />
            <p className="text-sm font-bold text-slate-400 uppercase tracking-widest">Nenhum ticket encontrado</p>
          </div>
        )}
      </div>

      {selectedTicket && (
        <TicketDetailsModal 
          ticket={selectedTicket} 
          onClose={() => setSelectedTicket(null)} 
          onStatusUpdate={handleStatusUpdate}
        />
      )}
    </div>
  );
};
