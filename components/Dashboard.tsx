
import React, { useState, useEffect, useMemo } from 'react';
import { Routes, Route, useNavigate } from 'react-router-dom';
import { Sidebar } from './Sidebar';
import { useAuth } from '../context/AuthContext';
import { Questionnaire } from './Questionnaire';
import { Settings } from './Settings';
import { SectorsView } from './SectorsView';
import { AchievementsPage } from './AchievementsPage';
import { generateComplianceTasks } from '../logic/complianceEngine';
import { generateDocument, DocumentContent } from '../logic/templates';
import { DocumentPreview } from './DocumentPreview';
import { ImplementationSchedule } from './ImplementationSchedule';
import { questionnaireService, tasksService } from '../services/firestoreService';
import { 
  FileCheck, ShieldCheck, ClipboardList, AlertTriangle, 
  ChevronRight, ArrowRight, CheckCircle2, FileSearch, Zap, 
  TrendingUp, Info, Trophy, Download, LayoutGrid, Award, Star
} from 'lucide-react';
import { QuestionnaireData, ComplianceTask, User, ValidationResult } from '../types';

const Overview: React.FC<{ qData: QuestionnaireData | null; tasks: ComplianceTask[]; user: User }> = ({ qData, tasks, user }) => {
  const navigate = useNavigate();
  
  const totalProcesses = useMemo(() => {
    return qData?.sectors?.reduce((acc, s) => acc + (s.processes?.length || 0), 0) || 0;
  }, [qData]);

  const completedProcesses = useMemo(() => {
    return qData?.sectors?.reduce((acc, s) => acc + (s.processes?.filter(p => p.status === 'completed').length || 0), 0) || 0;
  }, [qData]);

  const progress = totalProcesses > 0 ? Math.round((completedProcesses / totalProcesses) * 100) : 0;
  const completedTasks = tasks?.filter(t => t.status === 'Concluída').length || 0;
  const highPriorityTasks = tasks?.filter(t => t.status === 'Pendente' && t.priority === 'Alta') || [];

  return (
    <div className="space-y-8 page-transition pb-20">
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">Status de Conformidade</h1>
          <p className="text-slate-500 font-medium">Monitoramento em tempo real dos fluxos da <span className="text-blue-600 font-bold">{user.companyName}</span>.</p>
        </div>
        {progress === 100 && (
          <div className="px-6 py-3 bg-indigo-600 text-white rounded-2xl shadow-xl flex items-center gap-3 animate-bounce">
            <Trophy className="h-5 w-5 text-amber-300" />
            <span className="text-xs font-black uppercase">Pronto para Certificar</span>
          </div>
        )}
      </header>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        <div className="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-sm relative overflow-hidden group">
          <div className="absolute top-0 right-0 p-8 opacity-5 group-hover:opacity-10 transition-opacity"><TrendingUp className="h-24 w-24 text-blue-600" /></div>
          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-4">Progresso do Mapeamento</p>
          <div className="flex items-end gap-2 mb-4">
            <span className="text-5xl font-black text-slate-900">{progress}%</span>
            <span className="text-xs font-bold text-blue-600 mb-1.5 uppercase">Concluído</span>
          </div>
          <div className="h-2.5 bg-slate-100 rounded-full overflow-hidden">
            <div className="h-full bg-blue-600 transition-all duration-1000" style={{ width: `${progress}%` }} />
          </div>
          <p className="text-[10px] text-slate-400 font-bold mt-4">{completedProcesses} de {totalProcesses} processos finalizados</p>
        </div>

        <div className="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-sm flex flex-col justify-between">
          <div className="flex items-center gap-5">
            <div className="p-4 bg-green-50 text-green-600 rounded-2xl"><CheckCircle2 className="h-7 w-7" /></div>
            <div>
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Tarefas Executadas</p>
              <p className="text-3xl font-black text-slate-900 mt-1">{completedTasks}</p>
            </div>
          </div>
          <button onClick={() => navigate('/dashboard/conformidade')} className="mt-8 flex items-center justify-between p-4 bg-slate-50 rounded-2xl hover:bg-slate-100 transition-all group">
            <span className="text-xs font-bold text-slate-600">Ver plano de ação</span>
            <ChevronRight className="h-4 w-4 text-slate-400 group-hover:translate-x-1 transition-transform" />
          </button>
        </div>

        <div className="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-sm flex flex-col justify-between">
          <div className="flex items-center gap-5">
            <div className="p-4 bg-amber-50 text-amber-600 rounded-2xl"><AlertTriangle className="h-7 w-7" /></div>
            <div>
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Riscos Críticos</p>
              <p className="text-3xl font-black text-slate-900 mt-1">{highPriorityTasks.length}</p>
            </div>
          </div>
          <p className="text-[10px] text-slate-400 font-medium leading-relaxed mt-4">Foque na resolução das pendências de <span className="text-amber-600 font-bold">ALTA prioridade</span> para reduzir sua exposição legal.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-sm">
             <div className="flex items-center justify-between mb-8">
               <h3 className="text-xl font-bold text-slate-900 flex items-center gap-3">
                 <LayoutGrid className="h-5 w-5 text-blue-600" /> Departamentos Ativos
               </h3>
               <button onClick={() => navigate('/dashboard/departamentos')} className="text-xs font-bold text-blue-600 hover:underline">Gerenciar Estrutura</button>
             </div>

             <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
               {qData?.sectors?.map(sector => {
                 const comp = sector.processes?.filter(p => p.status === 'completed').length || 0;
                 const total = sector.processes?.length || 0;
                 return (
                   <div key={sector.id} className="p-5 border border-slate-100 rounded-3xl bg-slate-50/50 hover:bg-white transition-all group cursor-pointer" onClick={() => navigate('/dashboard/mapeamento')}>
                      <div className="flex items-center justify-between mb-3">
                        <span className="font-bold text-slate-900 text-sm">{sector.name}</span>
                        <ChevronRight className="h-4 w-4 text-slate-300 group-hover:text-blue-600 transition-colors" />
                      </div>
                      <div className="flex items-center justify-between text-[9px] font-black uppercase tracking-widest text-slate-400 mb-2">
                        <span>{total > 0 ? `${comp}/${total} Processos` : 'Sem processos'}</span>
                        <span>{total > 0 ? Math.round((comp/total)*100) : 0}%</span>
                      </div>
                      <div className="h-1 bg-slate-100 rounded-full overflow-hidden">
                        <div className="h-full bg-blue-600" style={{ width: `${total > 0 ? (comp/total)*100 : 0}%` }} />
                      </div>
                   </div>
                 );
               })}
             </div>
          </div>
        </div>

        <div className="space-y-6">
           <div className="bg-slate-900 text-white p-8 rounded-[2.5rem] shadow-xl relative overflow-hidden group">
             <div className="absolute -top-10 -right-10 h-32 w-32 bg-blue-600/20 rounded-full blur-3xl" />
             <h3 className="text-lg font-bold mb-4 flex items-center gap-2"><FileSearch className="h-5 w-5 text-blue-400" /> RAT Consolidado</h3>
             <p className="text-slate-400 text-xs leading-relaxed mb-6">O Registro de Atividades de Tratamento é gerado automaticamente com base nos processos que você finaliza.</p>
             <button onClick={() => navigate('/dashboard/documentos')} className="w-full py-4 bg-white text-slate-900 rounded-2xl font-black text-xs hover:bg-blue-50 transition-all">Acessar Dossiê de Documentos</button>
           </div>

           <div className="bg-blue-50 p-6 rounded-[2.5rem] border border-blue-100 flex items-start gap-4">
              <Info className="h-6 w-6 text-blue-600 mt-1 shrink-0" />
              <p className="text-xs text-blue-800 leading-relaxed font-medium"><strong>Dica de Conformidade:</strong> Lembre-se de duplicar processos que possuem fluxos similares para agilizar seu mapeamento.</p>
           </div>
        </div>
      </div>
    </div>
  );
};

export const Dashboard: React.FC = () => {
  const { authState } = useAuth();
  const [qData, setQData] = useState<QuestionnaireData | null>(null);
  const [tasks, setTasks] = useState<ComplianceTask[]>([]);
  const [isSyncing, setIsSyncing] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    if (authState.user) {
      const unsubQ = questionnaireService.subscribe(authState.user.id, (data) => {
        setQData(data);
        if (data) {
          const newTasks = generateComplianceTasks(data);
          setTasks(newTasks);
          tasksService.saveAll(authState.user!.id, newTasks);
        }
        setIsSyncing(false);
      });

      const unsubT = tasksService.subscribe(authState.user.id, (fetchedTasks) => {
        if (fetchedTasks && fetchedTasks.length > 0) {
          setTasks(fetchedTasks);
        }
      });

      return () => { unsubQ(); unsubT(); };
    }
  }, [authState.user]);

  const handleUpdateTask = async (taskId: string, evidence: string, result: ValidationResult, observations: string, fileUrl?: string, status?: any) => {
    if (!authState.user) return;
    const updatedTasks = tasks.map(t => t.id === taskId ? { ...t, evidence, validationResult: result, observations, status: status || (result.isValid ? 'Concluída' : 'Revisar'), evidenceUrl: fileUrl } : t);
    setTasks(updatedTasks);
    await tasksService.saveAll(authState.user.id, updatedTasks);
  };

  const handleSaveQuestionnaire = async (data: QuestionnaireData, isFinal: boolean = false) => {
    if (!authState.user) return;
    await questionnaireService.save(authState.user.id, data);
    if (isFinal) navigate('/dashboard');
  };

  if (authState.loading || isSyncing) return <div className="h-screen flex items-center justify-center font-bold text-slate-400 animate-pulse">Sincronizando ambiente seguro...</div>;

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col lg:flex-row">
      <Sidebar />
      <main className="flex-1 lg:pl-72 transition-all pt-16 lg:pt-0">
        <div className="p-4 md:p-8 max-w-7xl mx-auto min-h-screen">
          <Routes>
            <Route path="/" element={<Overview qData={qData} tasks={tasks} user={authState.user!} />} />
            <Route path="/departamentos" element={<SectorsView qData={qData} onSave={handleSaveQuestionnaire} />} />
            <Route path="/mapeamento" element={<Questionnaire initialData={qData} onSave={handleSaveQuestionnaire} />} />
            <Route path="/documentos" element={<DocumentsListView qData={qData} tasks={tasks} user={authState.user!} />} />
            <Route path="/conformidade" element={<ComplianceView tasks={tasks} user={authState.user!} onUpdateTask={handleUpdateTask} qData={qData} />} />
            <Route path="/conquistas" element={<AchievementsPage user={authState.user!} />} />
            <Route path="/configuracoes" element={<Settings initialQData={qData} onSaveQData={handleSaveQuestionnaire} />} />
          </Routes>
        </div>
      </main>
    </div>
  );
};

const DocumentsListView: React.FC<{ qData: QuestionnaireData | null; tasks: ComplianceTask[]; user: User }> = ({ qData, tasks, user }) => {
  const [previewDoc, setPreviewDoc] = useState<DocumentContent | null>(null);
  const navigate = useNavigate();

  const availableDocs = useMemo(() => {
    if (!qData) return [];
    const docTypes = Array.from(new Set(tasks.map(t => t.targetDocument))) as string[];
    return docTypes.map(type => generateDocument(type, qData, user));
  }, [qData, tasks, user]);

  if (!qData) return <div className="py-20 text-center space-y-4 px-6 bg-white rounded-[2.5rem] border border-slate-100"><FileSearch className="h-12 w-12 text-slate-300 mx-auto" /><h3 className="text-xl font-bold">Inicie o diagnóstico</h3><p className="text-slate-400">Seus documentos serão gerados conforme você mapeia os processos.</p><button onClick={() => navigate('/dashboard/mapeamento')} className="px-10 py-4 bg-blue-600 text-white rounded-2xl font-bold">Mapear Processos</button></div>;

  return (
    <div className="space-y-8 page-transition">
      <header>
        <h2 className="text-3xl font-extrabold text-slate-900 tracking-tight">Central de Documentos</h2>
        <p className="text-slate-500 font-medium">Consulte e faça o download dos registros oficiais de conformidade da empresa.</p>
      </header>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {availableDocs.map((doc, idx) => (
          <div key={idx} className="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-sm flex items-center justify-between group hover:shadow-lg transition-all border-l-8 border-l-blue-600">
            <div className="flex items-center gap-6">
              <div className="p-4 bg-blue-50 text-blue-600 rounded-2xl group-hover:bg-blue-600 group-hover:text-white transition-all"><FileCheck className="h-6 w-6" /></div>
              <div><h3 className="font-bold text-slate-900">{doc.title}</h3><p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-1">Sincronizado</p></div>
            </div>
            <button onClick={() => setPreviewDoc(doc)} className="p-3 bg-slate-900 text-white rounded-xl hover:bg-black transition-all shadow-lg"><ChevronRight className="h-5 w-5" /></button>
          </div>
        ))}
      </div>
      {previewDoc && <DocumentPreview document={previewDoc} onClose={() => setPreviewDoc(null)} onDownload={() => {
         const printWindow = window.open('', '_blank');
         printWindow?.document.write(`<html><head><title>${previewDoc.title}</title><style>body { font-family: sans-serif; padding: 40px; white-space: pre-wrap; }</style></head><body><h1>${previewDoc.title}</h1>${previewDoc.content}</body></html>`);
         printWindow?.document.close();
         printWindow?.print();
      }} />}
    </div>
  );
};

const ComplianceView: React.FC<{ tasks: ComplianceTask[]; user: User; onUpdateTask: any; qData: any }> = ({ tasks, user, onUpdateTask, qData }) => {
  return (
    <div className="space-y-8 page-transition">
      <header>
        <h2 className="text-3xl font-extrabold text-slate-900 tracking-tight">Caminho da Conformidade</h2>
        <p className="text-slate-500 font-medium">Siga as orientações geradas pelo diagnóstico para zerar seus riscos.</p>
      </header>
      <ImplementationSchedule tasks={tasks} user={user} onUpdateTask={onUpdateTask} qData={qData} />
    </div>
  );
};
