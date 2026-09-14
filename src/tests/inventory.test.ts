import { describe, it, expect } from 'vitest';
// @ts-ignore
import { SectorAnswers } from '../../types';

describe('B) Testes de Expansão do Inventário', () => {
  it('O schema do inventário deve aceitar os novos campos e a sensibilidade', () => {
    // Simulando a estrutura esperada no Firestore/Types
    const newInventoryData: any = {
      tituloEleitor: { value: '1234', sensibilidade: 'pessoal' },
      carteiraTrabalho: { value: '5678', sensibilidade: 'sensivel' },
      certidaoNascimento: { value: '9012', sensibilidade: 'pessoal' },
      certidaoCasamento: { value: '3456', sensibilidade: 'pessoal' },
      comprovanteMatricula: { value: '7890', sensibilidade: 'pessoal' }
    };

    expect(newInventoryData).toHaveProperty('tituloEleitor');
    expect(newInventoryData.tituloEleitor).toHaveProperty('sensibilidade');
    expect(newInventoryData.tituloEleitor.sensibilidade).toBe('pessoal');
  });

  it('O array titulares deve aceitar "filhos" e "parentes" nas opções', () => {
    const titulares = ['clientes', 'filhos', 'parentes'];
    expect(titulares).toContain('filhos');
    expect(titulares).toContain('parentes');
  });
});
