import { User } from '../types';

export interface PlanFeatureLimits {
  documentos_essenciais: boolean;
  documentos_avancados: boolean; // RIPD, RAT, etc.
  ia_analise_profunda: boolean;
  limite_setores: number;
  limite_processos_por_setor: number;
  sla_suporte_horas: number;
  gerente_conta: boolean;
  auditoria_humana: boolean;
}

export const PLAN_LIMITS: Record<User['plan'], PlanFeatureLimits> = {
  basico: {
    documentos_essenciais: true,
    documentos_avancados: false,
    ia_analise_profunda: false,
    limite_setores: 1,
    limite_processos_por_setor: 3,
    sla_suporte_horas: 72,
    gerente_conta: false,
    auditoria_humana: false,
  },
  pro: {
    documentos_essenciais: true,
    documentos_avancados: true,
    ia_analise_profunda: true,
    limite_setores: 10,
    limite_processos_por_setor: 20,
    sla_suporte_horas: 24,
    gerente_conta: false,
    auditoria_humana: false,
  },
  personalite: {
    documentos_essenciais: true,
    documentos_avancados: true,
    ia_analise_profunda: true,
    limite_setores: 999, // Ilimitado
    limite_processos_por_setor: 999, // Ilimitado
    sla_suporte_horas: 4,
    gerente_conta: true,
    auditoria_humana: true,
  }
};

export const canAccessFeature = (user: User | null, feature: keyof PlanFeatureLimits): boolean => {
  if (!user) return false;
  if (user.isAdmin) return true;
  
  const limits = PLAN_LIMITS[user.plan] || PLAN_LIMITS.basico;
  const value = limits[feature];
  
  if (typeof value === 'boolean') return value;
  return true; // For numeric limits, we might need a different check function
};

export const getRemainingLimit = (user: User | null, currentCount: number, feature: 'limite_setores' | 'limite_processos_por_setor'): number => {
  if (!user) return 0;
  if (user.isAdmin) return 999;
  
  const limits = PLAN_LIMITS[user.plan] || PLAN_LIMITS.basico;
  return Math.max(0, limits[feature] - currentCount);
};
