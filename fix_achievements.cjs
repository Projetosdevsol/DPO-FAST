const fs = require('fs');
let page = fs.readFileSync('components/AchievementsPage.tsx', 'utf8');

page = page.replace(
  "import { Trophy, ShieldCheck, Star, Zap, Award, Layers, Map, Eye, Scale, Sword, Lock, Info, ChevronRight, CheckCircle2 } from 'lucide-react';",
  "import { Trophy, ShieldCheck, Star, Zap, Award, Layers, Map, Eye, Scale, Sword, Lock, Info, ChevronRight, CheckCircle2 } from 'lucide-react';"
);

page = page.replace(
  "import { User } from '../types';",
  "import { User, QuestionnaireData, ComplianceTask } from '../types';"
);

page = page.replace(
  "export const AchievementsPage: React.FC<{ user: User }> = ({ user }) => {",
  "export const AchievementsPage: React.FC<{ user: User, qData: QuestionnaireData | null, tasks: ComplianceTask[] }> = ({ user, qData, tasks }) => {"
);

const newLogic = `
  const sectorCount = (qData && qData.sectors) ? qData.sectors.length : 0;
  const totalTasks = tasks ? tasks.length : 0;
  const completedTasks = tasks ? tasks.filter(t => t.status === 'Concluída').length : 0;
  const tasksPercentage = totalTasks === 0 ? 0 : Math.round((completedTasks / totalTasks) * 100);

  const getTrophyGradient = (type: string, isLocked: boolean, isBlocked = false) => {
    if (isBlocked) return 'from-red-900 to-slate-900 border-red-800 opacity-80 grayscale';
    if (isLocked) return 'from-slate-800 to-slate-900 border-slate-700 opacity-40 grayscale';
`;

page = page.replace("  const getTrophyGradient = (type: string, isLocked: boolean) => {\n    if (isLocked) return 'from-slate-800 to-slate-900 border-slate-700 opacity-40 grayscale';", newLogic);


page = page.replace(
  "getTrophyGradient(achievement.type, !isUnlocked)}`",
  "getTrophyGradient(achievement.type, !isUnlocked, achievement.id === 'platinum_seal' && sectorCount < 5)}`"
);

const lockRender = `                  {achievement.id === 'platinum_seal' && sectorCount < 5 ? (
                    <Lock className="h-8 w-8 text-red-400" />
                  ) : isUnlocked ? (
                    <Icon className={\`h-10 w-10 text-white \${achievement.type === 'platinum' ? 'animate-pulse' : ''}\`} strokeWidth={2.5} />
                  ) : (
                    <Lock className="h-8 w-8 text-slate-400" />
                  )}`;

page = page.replace(/\{isUnlocked \? \(\s*<Icon className=\{`h-10 w-10 text-white \$\{achievement\.type === 'platinum' \? 'animate-pulse' : ''\}`\} strokeWidth=\{2\.5\} \/>\s*\) : \(\s*<Lock className="h-8 w-8 text-slate-400" \/>\s*\)\}/g, lockRender);

const titleRender = `                  <h3 className={\`font-black text-lg truncate \${isUnlocked ? 'text-[var(--text-primary)]' : 'text-slate-400'}\`}>
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
                  )}`;

page = page.replace(/<h3 className=\{`font-black text-lg truncate \$\{isUnlocked \? 'text-\[var\(--text-primary\)\]' : 'text-slate-400'\}`\}>\s*\{achievement\.title\}\s*<\/h3>\s*<p className="text-xs text-\[var\(--text-muted\)\] font-medium leading-relaxed mt-1\">\s*\{achievement\.description\}\s*<\/p>/g, titleRender);


const eligibilityStatus = `
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
            <div className={\`h-3 w-3 rounded-full \${sectorCount >= 5 ? 'bg-green-500' : 'bg-red-500'}\`} />
          </div>

          <div className="bg-[var(--surface)] p-5 rounded-2xl border border-[var(--border)] flex items-center justify-between">
            <div className="flex items-center gap-3">
              <CheckCircle2 className="h-5 w-5 text-slate-400" />
              <div>
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Processos Adequados</p>
                <p className="text-lg font-black text-[var(--text-primary)]">{tasksPercentage}%</p>
              </div>
            </div>
            <div className={\`h-3 w-3 rounded-full \${tasksPercentage === 100 ? 'bg-green-500' : 'bg-amber-500'}\`} />
          </div>
        </div>
      </div>

      <div className="bg-slate-900`;

page = page.replace('      <div className="bg-slate-900', eligibilityStatus);

fs.writeFileSync('components/AchievementsPage.tsx', page);
console.log('AchievementsPage updated successfully');
