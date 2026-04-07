
import React, { useState } from 'react';
import { Trophy, ShieldCheck, Star, Zap, Award, Layers, Map, Eye, Scale, Sword, Lock, Info, ChevronRight, CheckCircle2 } from 'lucide-react';
import { ACHIEVEMENTS } from '../logic/achievementEngine';
import { User } from '../types';

const ICON_MAP: any = { Trophy, ShieldCheck, Star, Zap, Award, Layers, Map, Eye, Scale, Sword };

export const AchievementsPage: React.FC<{ user: User }> = ({ user }) => {
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

  const getTrophyGradient = (type: string, isLocked: boolean) => {
    if (isLocked) return 'from-slate-800 to-slate-900 border-slate-700 opacity-40 grayscale';
    switch (type) {
      case 'platinum': return 'from-indigo-400 to-blue-600 border-indigo-300 shadow-[0_0_20px_rgba(79,70,229,0.3)]';
      case 'gold': return 'from-amber-300 to-amber-600 border-amber-200 shadow-[0_0_20px_rgba(245,158,11,0.2)]';
      case 'silver': return 'from-slate-200 to-slate-400 border-slate-100';
      default: return 'from-orange-300 to-orange-600 border-orange-200';
    }
  };

  return (
    <div className="space-y-8 page-transition">
      <header className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div>
          <h2 className="text-3xl font-black text-slate-900 tracking-tight">Galeria de Troféus</h2>
          <p className="text-slate-500 font-medium mt-1">Sua jornada rumo à conformidade total, gamificada.</p>
        </div>
        
        <div className="flex bg-white p-1 rounded-2xl border border-slate-100 shadow-sm">
          {[
            { id: 'all', label: 'Todos' },
            { id: 'unlocked', label: 'Conquistados' },
            { id: 'locked', label: 'Pendentes' }
          ].map(f => (
            <button 
              key={f.id}
              onClick={() => setFilter(f.id as any)}
              className={`px-6 py-2 rounded-xl text-xs font-bold transition-all ${filter === f.id ? 'bg-indigo-600 text-white shadow-lg' : 'text-slate-500 hover:bg-slate-50'}`}
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
              className={`relative bg-white p-6 rounded-[2.5rem] border transition-all duration-500 overflow-hidden group ${isUnlocked ? 'border-indigo-100 shadow-xl' : 'border-slate-100 grayscale hover:grayscale-0'}`}
            >
              <div className="flex items-start gap-5">
                <div className={`h-20 w-20 rounded-[1.5rem] bg-gradient-to-br border-2 flex items-center justify-center shrink-0 transition-transform group-hover:scale-110 duration-500 ${getTrophyGradient(achievement.type, !isUnlocked)}`}>
                  {isUnlocked ? (
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
                  <h3 className={`font-black text-lg truncate ${isUnlocked ? 'text-slate-900' : 'text-slate-400'}`}>
                    {achievement.title}
                  </h3>
                  <p className="text-xs text-slate-500 font-medium leading-relaxed mt-1">
                    {achievement.description}
                  </p>
                </div>
              </div>

              {!isUnlocked && (
                <div className="mt-6 pt-5 border-t border-slate-50">
                  <div className="flex items-start gap-3 bg-slate-50 p-4 rounded-2xl">
                    <Info className="h-4 w-4 text-indigo-500 mt-0.5 shrink-0" />
                    <div>
                      <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Como Desbloquear:</p>
                      <p className="text-xs text-slate-600 font-medium leading-relaxed">{achievement.howToUnlock}</p>
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
