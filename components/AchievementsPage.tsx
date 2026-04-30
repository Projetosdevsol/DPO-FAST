
import React, { useState } from 'react';
import { Trophy, ShieldCheck, Star, Zap, Award, Layers, Map, Eye, Scale, Sword, Lock, Info, ChevronRight, CheckCircle2 } from 'lucide-react';
import { ACHIEVEMENTS } from '../logic/achievementEngine';
import { User, QuestionnaireData, ComplianceTask } from '../types';

const ICON_MAP: any = { Trophy, ShieldCheck, Star, Zap, Award, Layers, Map, Eye, Scale, Sword };

export const AchievementsPage: React.FC<{ user: User, qData: QuestionnaireData | null, tasks: ComplianceTask[] }> = ({ user, qData, tasks }) => {
  const [filter, setFilter] = useState<'all' | 'unlocked' | 'locked'>('all');
  const userAchievements = user.achievements || [];
  
  const filteredAchievements = ACHIEVEMENTS.filter(a => {
    if (filter === 'unlocked') return userAchievements.includes(a.id);
    if (filter === 'locked') return !userAchievements.includes(a.id);
    return true;
  });

  const getRarityColor = (type: string) => {
    switch (type) {
      case 'platinum': return 'text-indigo-400 bg-indigo-400/10 border-indigo-400/20';
      case 'gold': return 'text-amber-400 bg-amber-400/10 border-amber-400/20';
      case 'silver': return 'text-slate-300 bg-slate-300/10 border-slate-300/20';
      default: return 'text-orange-400 bg-orange-400/10 border-orange-400/20';
    }
  };


  const sectorCount = (qData && qData.sectors) ? qData.sectors.length : 0;
  const totalTasks = tasks ? tasks.length : 0;
  const completedTasks = tasks ? tasks.filter(t => t.status === 'Concluída').length : 0;
  const tasksPercentage = totalTasks === 0 ? 0 : Math.round((completedTasks / totalTasks) * 100);

  const getTrophyGradient = (type: string, isLocked: boolean, isBlocked = false) => {
    if (isBlocked) return 'from-red-900 to-slate-900 border-red-800 opacity-80 grayscale';
    if (isLocked) return 'from-slate-800 to-slate-900 border-slate-700 opacity-40 grayscale';

    switch (type) {
      case 'platinum': return 'from-indigo-400 to-blue-600 border-indigo-300 shadow-[0_0_20px_rgba(79,70,229,0.3)]';
      case 'gold': return 'from-amber-300 to-amber-600 border-amber-200 shadow-[0_0_20px_rgba(245,158,11,0.2)]';
      case 'silver': return 'from-slate-200 to-slate-400 border-[var(--border)]';
      default: return 'from-orange-300 to-orange-600 border-orange-200';
    }
  };

  return (
    <div className="space-y-8 page-transition">
      <header className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div>
          <h2 className="text-3xl font-black text-[var(--text-primary)] tracking-tight">Galeria de Troféus</h2>
          <p className="text-[var(--text-muted)] font-medium mt-1">Sua jornada rumo à conformidade total, gamificada.</p>
        </div>
        
        <div className="flex bg-[var(--surface)] p-1 rounded-2xl border border-[var(--border)] shadow-[var(--shadow)]">
          {[
            { id: 'all', label: 'Todos' },
            { id: 'unlocked', label: 'Conquistados' },
            { id: 'locked', label: 'Pendentes' }
          ].map(f => (
            <button 
              key={f.id}
              onClick={() => setFilter(f.id as any)}
              className={`px-6 py-2 rounded-xl text-xs font-bold transition-all ${filter === f.id ? 'bg-indigo-600 text-white shadow-lg' : 'text-[var(--text-muted)] hover:bg-[var(--surface-muted)]'}`}
            >
              {f.label}
            </button>
          ))}
        </div>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredAchievements.map(achievement => {
          const isUnlocked = userAchievements.includes(achievement.id);
          const Icon = ICON_MAP[achievement.icon] || Trophy;
          
          return (
            <div 
              key={achievement.id} 
              className={`relative bg-[var(--surface)] p-6 rounded-[2.5rem] border transition-all duration-500 overflow-hidden group ${isUnlocked ? 'border-indigo-100 shadow-xl' : 'border-[var(--border)] grayscale hover:grayscale-0'}`}
            >
              <div className="flex items-start gap-5">
                <div className={`h-20 w-20 rounded-[1.5rem] bg-gradient-to-br border-2 flex items-center justify-center shrink-0 transition-transform group-hover:scale-110 duration-500 ${getTrophyGradient(achievement.type, !isUnlocked, achievement.id === 'platinum_seal' && sectorCount < 5)}`}>
                                    {achievement.id === 'platinum_seal' && sectorCount < 5 ? (
                    <Lock className="h-8 w-8 text-red-400" />
                  ) : isUnlocked ? (
                    <Icon className={`h-10 w-10 text-white ${achievement.type === 'platinum' ? 'animate-pulse' : ''}`} strokeWidth={2.5} />
                  ) : (
                    <Lock className="h-8 w-8 text-slate-400" />
                  )}
                </div>
                
                <div className="flex-1 min-w-0 py-1">
                  <div className="flex items-center gap-2 mb-1">
                    <span className={`px-2 py-0.5 rounded text-[8px] font-black uppercase tracking-widest border ${getRarityColor(achievement.type)}`}>
                      {achievement.type}
                    </span>
                    {isUnlocked && <CheckCircle2 className="h-4 w-4 text-green-500" />}
                  </div>
                                    <h3 className={`font-black text-lg truncate ${isUnlocked ? 'text-[var(--text-primary)]' : 'text-slate-400'}`}>
                    {achievement.title}
                  </h3>
                  {achievement.id === 'platinum_seal' && sectorCount < 5 ? (
                    <p className="text-[10px] text-red-500 font-bold leading-relaxed mt-1">
                      Este selo exige uma estrutura organizacional mínima de 5 setores cadastrados para auditoria completa.
                    </p>
                  ) : (
                    <p className="text-xs text-[var(--text-muted)] font-medium leading-relaxed mt-1">
                      {achievement.description}
                    </p>
                  )}
                </div>
              </div>

              {!isUnlocked && (
                <div className="mt-6 pt-5 border-t border-slate-50">
                  <div className="flex items-start gap-3 bg-[var(--surface-muted)] p-4 rounded-2xl">
                    <Info className="h-4 w-4 text-indigo-500 mt-0.5 shrink-0" />
                    <div>
                      <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Como Desbloquear:</p>
                      <p className="text-xs text-[var(--text-muted)] font-medium leading-relaxed">{achievement.howToUnlock}</p>
                    </div>
                  </div>
                </div>
              )}

              {isUnlocked && (
                <div className="absolute top-4 right-6 opacity-5 group-hover:opacity-10 transition-opacity">
                  <Icon className="h-24 w-24 text-indigo-600" />
                </div>
              )}
            </div>
          );
        })}
      </div>
      

      <div className="bg-[var(--surface-muted)] p-8 rounded-[2.5rem] border border-[var(--border)] space-y-6 mb-6">
        <div className="flex items-center gap-3 mb-2">
          <ShieldCheck className="h-6 w-6 text-blue-500" />
          <h3 className="text-lg font-black text-[var(--text-primary)]">Status de Elegibilidade para Certificação 100%</h3>
        </div>
        <p className="text-sm text-[var(--text-muted)]">Apenas organizações com estrutura mínima (5+ setores) e 100% de adequação nos processos garantem o Selo Platina.</p>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="bg-[var(--surface)] p-5 rounded-2xl border border-[var(--border)] flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Layers className="h-5 w-5 text-slate-400" />
              <div>
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Setores Cadastrados</p>
                <p className="text-lg font-black text-[var(--text-primary)]">{sectorCount} de 5</p>
              </div>
            </div>
            <div className={`h-3 w-3 rounded-full ${sectorCount >= 5 ? 'bg-green-500' : 'bg-red-500'}`} />
          </div>

          <div className="bg-[var(--surface)] p-5 rounded-2xl border border-[var(--border)] flex items-center justify-between">
            <div className="flex items-center gap-3">
              <CheckCircle2 className="h-5 w-5 text-slate-400" />
              <div>
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Processos Adequados</p>
                <p className="text-lg font-black text-[var(--text-primary)]">{tasksPercentage}%</p>
              </div>
            </div>
            <div className={`h-3 w-3 rounded-full ${tasksPercentage === 100 ? 'bg-green-500' : 'bg-amber-500'}`} />
          </div>
        </div>
      </div>

      <div className="bg-slate-900 p-10 rounded-[3rem] text-white flex flex-col md:flex-row items-center justify-between gap-8">
        <div className="space-y-2">
          <h3 className="text-2xl font-bold">Rumo à Platina</h3>
          <p className="text-slate-400 max-w-md">O Selo de Adequação 100% (Platina) é concedido apenas para as empresas que completam todas as tarefas técnicas e jurídicas.</p>
        </div>
        <div className="flex items-center gap-4">
          <div className="text-right hidden sm:block">
            <p className="text-xs font-bold text-slate-400 uppercase">Seu Progresso</p>
            <p className="text-2xl font-black">{Math.round((userAchievements.length / ACHIEVEMENTS.length) * 100)}%</p>
          </div>
          <div className="h-20 w-20 rounded-full border-4 border-slate-800 flex items-center justify-center relative">
             <div className="absolute inset-0 rounded-full border-4 border-indigo-500 border-t-transparent animate-spin" style={{ animationDuration: '3s' }} />
             <Trophy className="h-8 w-8 text-indigo-400" />
          </div>
        </div>
      </div>
    </div>
  );
};
