import { describe, it, expect } from 'vitest';
// @ts-ignore
import * as functionsConfig from '../index';

describe('A) Testes de Renomeação - Rotas das Functions', () => {
  it('Nenhuma rota exportada deve conter "dpo" ou "fast"', () => {
    const exportedFunctions = Object.keys(functionsConfig);
    
    // Supondo que tenhamos rotas como generateDocument, onUserCreate, etc.
    // Todas devem ter sido renomeadas se tinham 'dpo' antes.
    const invalidRoutes = exportedFunctions.filter(
      name => name.toLowerCase().includes('dpo') || name.toLowerCase().includes('fast')
    );
    
    expect(invalidRoutes).toHaveLength(0);
  });
});
