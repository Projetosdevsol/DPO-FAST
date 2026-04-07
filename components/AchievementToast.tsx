
import React, { useEffect, useState } from 'react';
import { Trophy, ShieldCheck, Star, Zap, Award, Target, Layers, Map, Eye, Scale, Sword } from 'lucide-react';
import { Achievement } from '../types';

const ICON_MAP: any = { Trophy, ShieldCheck, Star, Zap, Award, Target, Layers, Map, Eye, Scale, Sword };

export const AchievementToast: React.FC<{ achievement: Achievement; onComplete: () => void }> = ({ achievement, onComplete }) => {
  const Icon = ICON_MAP[achievement.icon] || Trophy;
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    setVisible(true);
    const timer = setTimeout(() => {
      setVisible(false);
      setTimeout(onComplete, 500);
    }, 5000);
    return () => clearTimeout(timer);
  }, [onComplete]);

  const colors = {
    bronze: 'from-orange-400 to-orange-700 border-orange-300',
    silver: 'from-slate-300 to-slate-500 border-slate-200',
    gold: 'from-amber-300 to-amber-500 border-amber-200',
    platinum: 'from-blue-400 to-indigo-600 border-blue-300 shadow-[0_0_30px_rgba(79,70,229,0.4)]'
  };

  return (
    <div className={`fixed top-8 right-8 z-[200] transition-all duration-500 transform ${visible ? 'translate-x-0 opacity-100' : 'translate-x-full opacity-0'}`}>
      <div className="bg-slate-900 text-white p-1 rounded-[1.5rem] shadow-2xl flex items-center min-w-[320px] border border-slate-800">
        <div className={`h-16 w-16 rounded-[1.25rem] bg-gradient-to-br ${colors[achievement.type]} flex items-center justify-center shrink-0 border-2 ml-1 my-1`}>
          <Icon className={`h-8 w-8 ${achievement.type === 'platinum' ? 'animate-pulse' : ''}`} strokeWidth={2.5} />
        </div>
        <div className="px-6 py-2">
          <p className="text-[10px] font-black text-indigo-400 uppercase tracking-[0.2em] mb-0.5">Conquista Desbloqueada!</p>
          <h4 className="text-sm font-black tracking-tight">{achievement.title}</h4>
          <p className="text-[10px] text-slate-400 font-medium leading-tight mt-1">{achievement.description}</p>
        </div>
      </div>
    </div>
  );
};
