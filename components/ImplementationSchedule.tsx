
import React, { useState, useMemo } from 'react';
import { 
  ShieldCheck, 
  CheckCircle2, 
  AlertTriangle, 
  ChevronDown,
  Clock,
  Download,
  Search,
  Layers,
  FileSearch,
  PlayCircle,
  BookOpen,
  ArrowRight,
  Filter,
  Target,
  Activity,
  ChevronRight,
  Info,
  // Added CalendarPlus to fix error on line 277
  CalendarPlus
} from 'lucide-react';
import { ComplianceTask, User, QuestionnaireData, ValidationResult } from '../types';
import { generateGoogleCalendarLink, exportTasksToCSV } from '../logic/calendarIntegration';
import { TaskValidationModal } from './TaskValidationModal';
import { generateDocument } from '../logic/templates';

interface ImplementationScheduleProps {
  tasks: ComplianceTask[];
  user: User;
  onUpdateTask: (taskId: string, evidence: string, result: ValidationResult, observations: string, fileUrl?: string, status?: any) => void;
  qData: QuestionnaireData | null;
}

export const ImplementationSchedule: React.FC<ImplementationScheduleProps> = ({ tasks, user, onUpdateTask, qData }) => {
  const [selectedTask, setSelectedTask] = useState<ComplianceTask | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [expandedTaskId, setExpandedTaskId] = useState<string | null>(null);
  
  // Novos Estados de Filtro
  const [selectedSectorId, setSelectedSectorId] = useState<string>('all');
  const [selectedProcessId, setSelectedProcessId] = useState<string>('all');

  // Cálculo de estatísticas por setor para o Header
  const sectorStats = useMemo(() => {
    if (!qData) return [];
    return (qData.sectors || []).map(sector => {
      const sectorTasks = tasks.filter(t => t.sectorId === sector.id);
      const completed = sectorTasks.filter(t => t.status === 'Concluída').length;
      const total = sectorTasks.length;
      const percent = total > 0 ? Math.round((completed / total) * 100) : 0;
      return { ...sector, percent, totalTasks: total };
    });
  }, [qData, tasks]);

  // Processos disponíveis para o setor selecionado
  const availableProcesses = useMemo(() => {
    if (selectedSectorId === 'all' || !qData) return [];
    const sector = qData.sectors.find(s => s.id === selectedSectorId);
    return sector?.processes || [];
  }, [selectedSectorId, qData]);

  // Lógica de Filtragem Final
  const filteredTasks = useMemo(() => {
    return (tasks || []).filter(t => {
      const matchesSearch = (t.title || '').toLowerCase().includes(searchTerm.toLowerCase()) || 
                           (t.targetDocument || '').toLowerCase().includes(searchTerm.toLowerCase());
      const matchesSector = selectedSectorId === 'all' || t.sectorId === selectedSectorId;
      const matchesProcess = selectedProcessId === 'all' || t.processId === selectedProcessId;
      
      return matchesSearch && matchesSector && matchesProcess;
    });
  }, [tasks, searchTerm, selectedSectorId, selectedProcessId]);

  const toggleExpand = (id: string) => {
    setExpandedTaskId(expandedTaskId === id ? null : id);
  };

  const getSuggestedDocContent = (task: ComplianceTask) => {
    if (!qData) return undefined;
    try {
      return generateDocument(task.targetDocument, qData, user).content;
    } catch {
      return undefined;
    }
  };

  return (
    <div className="space-y-8 pb-20">
      
      {/* 1. RESUMO DE CONFORMIDADE POR SETOR (GRID VISUAL) */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
        {sectorStats.map(stat => (
          <button 
            key={stat.id}
            onClick={() => {
              setSelectedSectorId(stat.id);
              setSelectedProcessId('all');
            }}
            className={`p-5 rounded-[2rem] border transition-all text-left group ${selectedSectorId === stat.id ? 'bg-blue-600 border-blue-600 shadow-xl shadow-blue-100' : 'bg-white border-slate-100 hover:border-blue-200'}`}
          >
            <div className="flex items-center justify-between mb-3">
              <div className={`p-2 rounded-xl ${selectedSectorId === stat.id ? 'bg-white/20 text-white' : 'bg-blue-50 text-blue-600'}`}>
                <Activity className="h-4 w-4" />
              </div>
              <span className={`text-[10px] font-black ${selectedSectorId === stat.id ? 'text-blue-100' : 'text-slate-400'}`}>
                {stat.percent}%
              </span>
            </div>
            <h4 className={`text-xs font-black uppercase tracking-tight truncate ${selectedSectorId === stat.id ? 'text-white' : 'text-slate-900'}`}>
              {stat.name}
            </h4>
            <div className="mt-3 h-1 w-full bg-black/10 rounded-full overflow-hidden">
              <div 
                className={`h-full transition-all duration-700 ${selectedSectorId === stat.id ? 'bg-white' : 'bg-blue-600'}`} 
                style={{ width: `${stat.percent}%` }}
              />
            </div>
          </button>
        ))}
      </div>

      {/* 2. BARRA DE FILTROS AVANÇADA */}
      <div className="bg-white p-6 rounded-[2.5rem] border border-slate-100 shadow-sm space-y-4">
        <div className="flex flex-col lg:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400" />
            <input 
              type="text" 
              placeholder="Buscar tarefa ou documento..." 
              className="w-full pl-12 pr-4 py-3.5 rounded-2xl bg-slate-50 border border-slate-100 focus:bg-white focus:ring-4 focus:ring-blue-50 outline-none transition-all text-sm font-bold text-slate-900"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="flex items-center gap-2 bg-slate-50 px-4 py-2 rounded-2xl border border-slate-100">
              <Filter className="h-4 w-4 text-slate-400" />
              <select 
                value={selectedSectorId}
                onChange={(e) => {
                  setSelectedSectorId(e.target.value);
                  setSelectedProcessId('all');
                }}
                className="bg-transparent text-xs font-bold text-slate-700 outline-none cursor-pointer"
              >
                <option value="all">Todos os Setores</option>
                {qData?.sectors.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
              </select>
            </div>

            {selectedSectorId !== 'all' && (
              <div className="flex items-center gap-2 bg-blue-50 px-4 py-2 rounded-2xl border border-blue-100 animate-in fade-in zoom-in-95">
                <Target className="h-4 w-4 text-blue-600" />
                <select 
                  value={selectedProcessId}
                  onChange={(e) => setSelectedProcessId(e.target.value)}
                  className="bg-transparent text-xs font-bold text-blue-700 outline-none cursor-pointer"
                >
                  <option value="all">Todas as Linhas de Tratamento</option>
                  {availableProcesses.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                </select>
              </div>
            )}

            <button 
              onClick={() => exportTasksToCSV(tasks)}
              className="flex items-center justify-center gap-2 px-6 py-3.5 bg-slate-900 text-white rounded-2xl text-xs font-bold hover:bg-black transition-all"
            >
              <Download className="h-4 w-4" /> Exportar
            </button>
          </div>
        </div>
      </div>

      {/* 3. LISTA DE TAREFAS (DOSSIÊ) */}
      <div className="space-y-4">
        {filteredTasks.length > 0 ? filteredTasks.map((task) => {
          const isExpanded = expandedTaskId === task.id;
          const sector = (qData?.sectors || []).find(s => s.id === task.sectorId);
          const process = sector?.processes?.find(p => p.id === task.processId);
          
          return (
            <div key={task.id} className={`bg-white rounded-[2.5rem] border transition-all duration-300 ${isExpanded ? 'border-blue-200 shadow-xl shadow-blue-50' : 'border-slate-100 shadow-sm hover:border-slate-200'}`}>
              <div 
                className="p-8 cursor-pointer flex flex-col md:flex-row md:items-center justify-between gap-6"
                onClick={() => toggleExpand(task.id)}
              >
                <div className="flex items-start gap-5">
                  <div className={`p-4 rounded-[1.5rem] shrink-0 ${task.status === 'Concluída' ? 'bg-green-50 text-green-600' : task.priority === 'Alta' ? 'bg-red-50 text-red-600' : 'bg-blue-50 text-blue-600'}`}>
                    {task.status === 'Concluída' ? <CheckCircle2 className="h-7 w-7" /> : <ShieldCheck className="h-7 w-7" />}
                  </div>
                  <div className="space-y-2">
                    <h4 className={`text-lg font-black tracking-tight ${task.status === 'Concluída' ? 'text-slate-300 line-through' : 'text-slate-900'}`}>
                      {task.title}
                    </h4>
                    <div className="flex flex-wrap gap-3 items-center">
                      <span className="text-[9px] font-black text-blue-600 uppercase tracking-[0.15em] bg-blue-50 px-3 py-1 rounded-lg border border-blue-100">{task.targetDocument}</span>
                      {sector && (
                        <div className="flex items-center gap-1.5 text-[10px] font-bold text-slate-400 uppercase bg-slate-50 px-2 py-1 rounded-lg">
                          <Layers className="h-3.5 w-3.5" /> {sector.name}
                        </div>
                      )}
                      {process && (
                        <div className="flex items-center gap-1.5 text-[10px] font-bold text-indigo-500 uppercase bg-indigo-50 px-2 py-1 rounded-lg border border-indigo-100">
                          <Target className="h-3.5 w-3.5" /> {process.name}
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-8 justify-between md:justify-end shrink-0">
                   <div className="flex flex-col items-end">
                     <span className={`text-[10px] font-black uppercase px-3 py-1 rounded-xl border ${task.priority === 'Alta' ? 'bg-red-50 text-red-600 border-red-100' : 'bg-slate-50 text-slate-400 border-slate-200'}`}>
                       Prioridade {task.priority}
                     </span>
                     <span className="text-[10px] font-bold text-slate-400 mt-2 flex items-center gap-1.5">
                       <Clock className="h-3.5 w-3.5" /> Prazo: {task.dueDate ? new Date(task.dueDate).toLocaleDateString('pt-BR') : 'A definir'}
                     </span>
                   </div>
                   <div className={`p-3 rounded-full transition-transform ${isExpanded ? 'rotate-180 bg-blue-50 text-blue-600 shadow-inner' : 'text-slate-300 bg-slate-50'}`}>
                     <ChevronDown className="h-6 w-6" />
                   </div>
                </div>
              </div>

              {isExpanded && (
                <div className="px-8 pb-10 animate-in slide-in-from-top-4 duration-500">
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 pt-8 border-t border-slate-50">
                    
                    {/* Bloco: O que identificamos */}
                    <div className="space-y-4">
                      <div className="bg-slate-50 p-8 rounded-[2rem] border border-slate-100 h-full flex flex-col">
                        <div className="flex items-center gap-3 mb-6">
                          <div className="p-2 bg-amber-100 rounded-xl text-amber-600">
                            <AlertTriangle className="h-5 w-5" />
                          </div>
                          <h5 className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em]">O que identificamos?</h5>
                        </div>
                        <p className="text-slate-700 font-bold leading-relaxed flex-1">
                          {task.description}
                        </p>
                        <div className="mt-8 p-4 bg-white border border-slate-100 rounded-2xl flex items-center gap-3">
                           <BookOpen className="h-5 w-5 text-blue-600" />
                           <span className="text-[10px] font-black text-blue-600 uppercase tracking-widest">Base Legal Integrada à ANPD</span>
                        </div>
                      </div>
                    </div>

                    {/* Bloco: Plano de Ação */}
                    <div className="space-y-4">
                      <div className="bg-slate-900 p-8 rounded-[2rem] text-white shadow-2xl shadow-slate-200 h-full flex flex-col">
                        <div className="flex items-center gap-3 mb-6">
                          <div className="p-2 bg-indigo-500 rounded-xl text-white">
                            <PlayCircle className="h-5 w-5" />
                          </div>
                          <h5 className="text-[10px] font-black text-indigo-400 uppercase tracking-[0.2em]">Plano de Ação Corretiva</h5>
                        </div>
                        <div className="text-slate-300 text-sm font-medium leading-relaxed whitespace-pre-wrap flex-1">
                          {task.explanation}
                        </div>
                        
                        <div className="mt-10 flex flex-col sm:flex-row gap-3">
                          <button 
                            onClick={() => setSelectedTask(task)}
                            className="flex-1 bg-indigo-600 text-white py-4 rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-indigo-700 transition-all flex items-center justify-center gap-2 shadow-xl shadow-indigo-900/20"
                          >
                            {task.status === 'Concluída' ? 'Ver Comprovante' : 'Validar Implementação'} <ArrowRight className="h-4 w-4" />
                          </button>
                          <a
                            href={generateGoogleCalendarLink(task, user.companyName)}
                            target="_blank"
                            className="bg-white/10 text-white p-4 rounded-2xl hover:bg-white/20 transition-all flex items-center justify-center border border-white/10"
                            title="Agendar no Google Agenda"
                          >
                            <CalendarPlus className="h-5 w-5" />
                          </a>
                        </div>
                      </div>
                    </div>

                  </div>
                </div>
              )}
            </div>
          );
        }) : (
          <div className="py-24 flex flex-col items-center justify-center text-center px-6 bg-white rounded-[3rem] border border-slate-100 shadow-sm">
            <div className="p-8 bg-slate-50 rounded-full mb-6">
              <FileSearch className="h-12 w-12 text-slate-300" />
            </div>
            <h4 className="font-bold text-slate-900 text-xl tracking-tight">Nenhuma tarefa encontrada para este filtro</h4>
            <p className="text-slate-500 text-sm mt-2 max-w-sm">Tente ajustar seus filtros acima ou complete o mapeamento de um novo setor para gerar mais ações.</p>
            <button 
              onClick={() => { setSelectedSectorId('all'); setSelectedProcessId('all'); setSearchTerm(''); }}
              className="mt-6 text-sm font-bold text-blue-600 hover:underline"
            >
              Limpar todos os filtros
            </button>
          </div>
        )}
      </div>

      {selectedTask && (
        <TaskValidationModal 
          task={selectedTask}
          onClose={() => setSelectedTask(null)}
          onSave={(ev, res, obs, url, status) => {
            onUpdateTask(selectedTask.id, ev, res, obs, url, status);
            if (status === 'Concluída') {
                setSelectedTask(null);
            } else {
                setSelectedTask({
                    ...selectedTask,
                    evidence: ev,
                    validationResult: res,
                    observations: obs,
                    evidenceUrl: url,
                    status: status
                });
            }
          }}
          suggestedDocContent={getSuggestedDocContent(selectedTask)}
        />
      )}
    </div>
  );
};
