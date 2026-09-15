import { describe, it, expect } from 'vitest';
import { can, next } from './taskStateMachine';

describe('State Machine - Validação Determinística', () => {
  it('PENDENTE -> SUBMETER = EM_ANALISE', () => {
    expect(can('PENDENTE','SUBMETER')).toBe(true);
    expect(next('PENDENTE','SUBMETER')).toBe('EM_ANALISE');
  });
  it('PENDENTE não pode APROVAR/REJEITAR/REABRIR', () => {
    expect(can('PENDENTE','APROVAR')).toBe(false);
    expect(can('PENDENTE','REJEITAR')).toBe(false);
    expect(can('PENDENTE','REABRIR')).toBe(false);
    expect(()=>next('PENDENTE','APROVAR')).toThrow();
  });
  it('EM_ANALISE -> APROVAR = CONFORME', () => {
    expect(can('EM_ANALISE','APROVAR')).toBe(true);
    expect(next('EM_ANALISE','APROVAR')).toBe('CONFORME');
  });
  it('EM_ANALISE -> REJEITAR = REJEITADO', () => {
    expect(can('EM_ANALISE','REJEITAR')).toBe(true);
    expect(next('EM_ANALISE','REJEITAR')).toBe('REJEITADO');
  });
  it('EM_ANALISE não pode SUBMETER/REABRIR', () => {
    expect(can('EM_ANALISE','SUBMETER')).toBe(false);
    expect(can('EM_ANALISE','REABRIR')).toBe(false);
  });
  it('REJEITADO -> SUBMETER = EM_ANALISE', () => {
    expect(can('REJEITADO','SUBMETER')).toBe(true);
    expect(next('REJEITADO','SUBMETER')).toBe('EM_ANALISE');
  });
  it('REJEITADO não pode APROVAR/REJEITAR', () => {
    expect(can('REJEITADO','APROVAR')).toBe(false);
    expect(can('REJEITADO','REJEITAR')).toBe(false);
  });
  it('CONFORME -> REABRIR = PENDENTE e bloqueia demais', () => {
    expect(can('CONFORME','REABRIR')).toBe(true);
    expect(next('CONFORME','REABRIR')).toBe('PENDENTE');
    expect(can('CONFORME','APROVAR')).toBe(false);
    expect(can('CONFORME','SUBMETER')).toBe(false);
  });
});
