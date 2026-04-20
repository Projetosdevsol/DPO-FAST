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
  CalendarPlus,
  Calendar as CalendarIcon,
  LayoutList,
  ChevronLeft
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
  const [viewMode, setViewMode] = useState<'list' | 'calendar'>('list');
  
  const [selectedSectorId, setSelectedSectorId] = useState<string>('all');
  const [selectedProcessId, setSelectedProcessId] = useState<string>('all');

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

  const [currentMonth, setCurrentMonth] = useState(new Date());

  const calendarDays = useMemo(() => {
    const year = currentMonth.getFullYear();
    const month = currentMonth.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();
    const startDayOfWeek = firstDay.getDay();
    const days = [];
    const prevMonthLastDay = new Date(year, month, 0).getDate();
    for (let i = startDayOfWeek - 1; i >= 0; i--) {
      days.push({ day: prevMonthLastDay - i, month: month - 1, year, isCurrentMonth: false });
    }
    for (let i = 1; i <= daysInMonth; i++) {
      days.push({ day: i, month, year, isCurrentMonth: true });
    }
    const remaining = 42 - days.length;
    for (let i = 1; i <= remaining; i++) {
      days.push({ day: i, month: month + 1, year, isCurrentMonth: false });
    }
    return days;
  }, [currentMonth]);

  const getTasksForDate = (date: { day: number, month: number, year: number }) => {
    return filteredTasks.filter(task => {
      if (!task.dueDate) return false;
      const d = new Date(task.dueDate);
      return d.getDate() === date.day && d.getMonth() === date.month && d.getFullYear() === date.year;
    });
  };

  const nextMonth = () => setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1));
  const prevMonth = () => setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1));

  return (
    <div className="space-y-8 pb-20 page-transition">
      
      {/* 1. RESUMO GRID */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
        {sectorStats.map(stat => (
          <button 
            key={stat.id}
            onClick={() => {
              setSelectedSectorId(stat.id);
              setSelectedProcessId('all');
            }}
            className={`p-5 rounded-[2rem] border transition-all text-left group ${selectedSectorId === stat.id ? 'bg-blue-600 border-blue-600 shadow-xl shadow-blue-100' : 'bg-[var(--surface)] border-[var(--border)] hover:border-blue-500/50'}`}
          >
            <div className="flex items-center justify-between mb-3">
              <div className={`p-2 rounded-xl shrink-0 ${selectedSectorId === stat.id ? 'bg-white/20 text-white' : 'bg-blue-600/10 text-blue-600'}`}>
                <Activity className="h-4 w-4" />
              </div>
              <span className={`text-[10px] font-black ${selectedSectorId === stat.id ? 'text-blue-100' : 'text-slate-400'}`}>
                {stat.percent}%
              </span>
            </div>
            <h4 className={`text-xs font-black uppercase tracking-tight truncate ${selectedSectorId === stat.id ? 'text-white' : 'text-[var(--text-primary)]'}`}>
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

      {/* 2. FILTROS */}
      <div className="bg-[var(--surface)] p-4 md:p-6 rounded-[2rem] md:rounded-[2.5rem] border border-[var(--border)] shadow-sm space-y-6">
        <div className="flex flex-col lg:flex-row gap-4 md:gap-6">
          <div className="relative flex-1">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400" />
            <input 
              type="text" 
              placeholder="Buscar tarefa..." 
              className="w-full pl-12 pr-4 py-3.5 md:py-4 rounded-xl md:rounded-2xl bg-[var(--surface-muted)] border border-[var(--border)] focus:bg-[var(--surface)] focus:ring-4 focus:ring-blue-500/5 outline-none transition-all text-sm font-bold text-[var(--text-primary)] placeholder:text-slate-400"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          
          <div className="flex flex-col sm:flex-row flex-wrap gap-4">
            <div className="flex bg-[var(--surface-muted)] p-1 rounded-xl md:rounded-2xl border border-[var(--border)] w-full sm:w-auto">
               <button onClick={() => setViewMode('list')} className={`flex-1 sm:flex-none flex items-center justify-center gap-2 px-4 md:px-6 py-2.5 rounded-lg md:rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${viewMode === 'list' ? 'bg-blue-600 text-white shadow-lg' : 'text-slate-500 hover:text-blue-600'}`}>
                 <LayoutList className="h-4 w-4" /> <span className="hidden xs:inline">Lista</span>
               </button>
               <button onClick={() => setViewMode('calendar')} className={`flex-1 sm:flex-none flex items-center justify-center gap-2 px-4 md:px-6 py-2.5 rounded-lg md:rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${viewMode === 'calendar' ? 'bg-blue-600 text-white shadow-lg' : 'text-slate-500 hover:text-blue-600'}`}>
                 <CalendarIcon className="h-4 w-4" /> <span className="hidden xs:inline">Calendário</span>
               </button>
            </div>
            <div className="flex flex-1 items-center gap-2 bg-[var(--surface-muted)] px-4 py-2.5 rounded-xl md:rounded-2xl border border-[var(--border)]">
              <Filter className="h-4 w-4 text-slate-400 shrink-0" />
              <select value={selectedSectorId} onChange={(e) => setSelectedSectorId(e.target.value)} className="bg-transparent text-[10px] font-black uppercase tracking-widest text-[var(--text-primary)] outline-none cursor-pointer w-full">
                <option value="all">Sectors</option>
                {qData?.sectors.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
              </select>
            </div>
            <button onClick={() => exportTasksToCSV(tasks)} className="flex items-center justify-center gap-3 px-6 py-4 bg-slate-900 text-white rounded-xl md:rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-black transition-all shadow-xl shadow-slate-900/10">
              <Download className="h-4 w-4" /> <span className="sm:hidden lg:inline">Exportar</span>
            </button>
          </div>
        </div>
      </div>

      {/* 3. CONTEÚDO */}
      {viewMode === 'list' ? (
        <div className="space-y-4 animate-in fade-in slide-in-from-bottom-6 duration-700">
          {filteredTasks.length > 0 ? filteredTasks.map((task) => {
            const isExpanded = expandedTaskId === task.id;
            const sector = (qData?.sectors || []).find(s => s.id === task.sectorId);
            const process = sector?.processes?.find(p => p.id === task.processId);
            
            return (
              <div key={task.id} className={`bg-[var(--surface)] rounded-[2rem] md:rounded-[2.5rem] border transition-all duration-500 ${isExpanded ? 'border-blue-500 shadow-2xl shadow-blue-500/10' : 'border-[var(--border)] shadow-sm hover:border-blue-500/30'}`}>
                <div className="p-6 md:p-8 cursor-pointer flex flex-col md:flex-row md:items-center justify-between gap-6" onClick={() => toggleExpand(task.id)}>
                  <div className="flex items-start gap-4 md:gap-6">
                    <div className={`p-3 md:p-4 rounded-xl md:rounded-2xl shrink-0 ${task.status === 'Concluída' ? 'bg-green-600/10 text-green-600' : task.priority === 'Alta' ? 'bg-red-600/10 text-red-600' : 'bg-blue-600/10 text-blue-600'}`}>
                      {task.status === 'Concluída' ? <CheckCircle2 className="h-6 w-6 md:h-7 md:w-7" /> : <ShieldCheck className="h-6 w-6 md:h-7 md:w-7" />}
                    </div>
                    <div className="space-y-2">
                      <h4 className={`text-lg md:text-xl font-black tracking-tighter ${task.status === 'Concluída' ? 'text-slate-300 line-through' : 'text-[var(--text-primary)]'}`}>
                        {task.title}
                      </h4>
                      <div className="flex flex-wrap gap-2 md:gap-3 items-center">
                        <span className="text-[8px] md:text-[9px] font-black text-blue-600 uppercase tracking-widest bg-blue-600/10 px-2 md:px-3 py-1 md:py-1.5 rounded-lg md:rounded-xl border border-blue-500/20">{task.targetDocument}</span>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-4 md:gap-10 justify-between md:justify-end shrink-0">
                     <div className="flex flex-col items-end">
                       <span className={`text-[8px] md:text-[10px] font-black uppercase px-3 md:px-4 py-1 md:py-1.5 rounded-full border ${task.priority === 'Alta' ? 'bg-red-600/10 text-red-600 border-red-500/20' : 'bg-slate-500/10 text-slate-400 border-[var(--border)]'}`}>
                         {task.priority}
                       </span>
                     </div>
                     <div className={`p-2.5 md:p-4 rounded-full transition-all duration-500 ${isExpanded ? 'rotate-180 bg-blue-600 text-white shadow-xl shadow-blue-600/30' : 'text-slate-300 bg-[var(--surface-muted)] border border-[var(--border)]'}`}>
                       <ChevronDown className="h-4 w-4 md:h-6 md:w-6" />
                     </div>
                  </div>
                </div>
                {isExpanded && (
                  <div className="px-6 md:px-8 pb-8 md:pb-10 animate-in slide-in-from-top-4 duration-500">
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 md:gap-8 pt-6 md:pt-8 border-t border-[var(--border)]">
                      <div className="bg-[var(--surface-muted)] p-6 md:p-8 rounded-[1.5rem] md:rounded-[2rem] border border-[var(--border)] space-y-4">
                        <h5 className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Identificação</h5>
                        <p className="text-[var(--text-primary)] font-bold text-base md:text-lg leading-relaxed">{task.description}</p>
                      </div>
                      <div className="bg-slate-950 p-6 md:p-8 rounded-[1.5rem] md:rounded-[2rem] text-white shadow-2xl space-y-6">
                        <h5 className="text-[10px] font-black text-blue-400 uppercase tracking-widest">Plano de Ação</h5>
                        <p className="text-slate-300 text-xs md:text-sm font-medium leading-relaxed whitespace-pre-wrap">{task.explanation}</p>
                        <div className="flex flex-col sm:flex-row gap-3">
                          <button onClick={() => setSelectedTask(task)} className="flex-1 bg-blue-600 text-white py-4 md:py-5 rounded-xl md:rounded-2xl font-black text-[10px] uppercase tracking-widest hover:bg-blue-700 transition-all flex items-center justify-center gap-3">
                            {task.status === 'Concluída' ? 'Ver' : 'Validar'} <ArrowRight className="h-4 w-4" />
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            );
          }) : (
            <div className="py-20 text-center bg-[var(--surface)] rounded-[2rem] border border-[var(--border)] shadow-sm">
              <FileSearch className="h-12 w-12 text-slate-300 mx-auto mb-4" />
              <h4 className="font-black text-[var(--text-primary)] text-lg">Nada encontrado</h4>
            </div>
          )}
        </div>
      ) : (
        <div className="overflow-x-auto -mx-4 px-4 pb-4 md:mx-0 md:px-0 scrollbar-hide">
          <div className="min-w-[800px] lg:min-w-0 bg-[var(--surface)] rounded-[2rem] md:rounded-[3rem] border border-[var(--border)] p-4 md:p-10 space-y-6 md:space-y-10 animate-in zoom-in-95 duration-700 shadow-xl overflow-hidden">
             <div className="flex flex-col md:flex-row items-center justify-between gap-6">
                <div className="flex items-center gap-6">
                   <button onClick={prevMonth} className="p-3 hover:bg-[var(--surface-muted)] rounded-2xl border border-[var(--border)] transition-all text-[var(--text-primary)]">
                      <ChevronLeft className="h-6 w-6" />
                   </button>
                   <div className="flex flex-col items-center md:items-start text-center">
                      <h3 className="text-2xl md:text-3xl font-black text-[var(--text-primary)] tracking-tighter uppercase mb-0.5">
                         {currentMonth.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' })}
                      </h3>
                   </div>
                   <button onClick={nextMonth} className="p-3 hover:bg-[var(--surface-muted)] rounded-2xl border border-[var(--border)] transition-all text-[var(--text-primary)]">
                      <ChevronRight className="h-6 w-6" />
                   </button>
                </div>
             </div>
             <div className="grid grid-cols-7 border-t border-l border-[var(--border)] overflow-hidden rounded-2xl md:rounded-3xl">
                {['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'].map(d => (
                  <div key={d} className="p-3 md:p-6 bg-[var(--surface-muted)] border-b border-r border-[var(--border)] text-center text-[10px] font-black text-slate-400 uppercase tracking-widest">{d}</div>
                ))}
                {calendarDays.map((date, idx) => {
                  const dayTasks = getTasksForDate(date);
                  const isToday = new Date().toDateString() === new Date(date.year, date.month, date.day).toDateString();
                  return (
                    <div key={idx} className={`min-h-[100px] md:min-h-[140px] p-2 md:p-4 border-b border-r border-[var(--border)] transition-colors relative group ${date.isCurrentMonth ? 'bg-[var(--surface)]' : 'bg-[var(--surface-muted)] opacity-30 cursor-not-allowed'}`}>
                      <div className="flex items-center justify-between mb-2 md:mb-3">
                         <span className={`text-xs md:text-sm font-black ${isToday ? 'bg-blue-600 text-white w-6 h-6 md:w-8 md:h-8 rounded-lg md:rounded-xl flex items-center justify-center' : 'text-slate-400'}`}>{date.day}</span>
                         {dayTasks.length > 0 && <span className="text-[8px] font-black text-blue-600 bg-blue-600/10 px-1.5 py-0.5 rounded-md border border-blue-500/20">{dayTasks.length}</span>}
                      </div>
                      <div className="space-y-1 overflow-y-auto max-h-[60px] md:max-h-[80px] custom-scrollbar pr-1">
                         {dayTasks.map(t => (
                           <div key={t.id} onClick={() => { setSelectedTask(t); toggleExpand(t.id); setViewMode('list'); }} className={`px-2 py-1.5 rounded-lg text-[8px] font-bold leading-tight cursor-pointer transition-all hover:scale-[1.03] shadow-sm truncate ${t.status === 'Concluída' ? 'bg-green-600/10 text-green-700 border border-green-500/20' : t.priority === 'Alta' ? 'bg-red-600/10 text-red-700 border border-red-500/20' : 'bg-blue-600/10 text-blue-700 border border-blue-500/20'}`}>
                             {t.title}
                           </div>
                         ))}
                      </div>
                    </div>
                  );
                })}
             </div>
          </div>
        </div>
      )}

      {selectedTask && (
        <TaskValidationModal 
          task={selectedTask}
          onClose={() => setSelectedTask(null)}
          onSave={(ev, res, obs, url, status) => {
            onUpdateTask(selectedTask.id, ev, res, obs, url, status);
            if (status === 'Concluída') setSelectedTask(null);
            else setSelectedTask({ ...selectedTask, evidence: ev, validationResult: res, observations: obs, evidenceUrl: url, status: status });
          }}
          suggestedDocContent={getSuggestedDocContent(selectedTask)}
        />
      )}
    </div>
  );
};
