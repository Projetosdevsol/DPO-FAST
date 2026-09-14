// @vitest-environment jsdom
import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import React from 'react';

// Simulando importações que podem não existir ainda no formato exato
import { getAppName } from '../utils/app';
import { Header } from '../../components/Header';

describe('A) Testes de Renomeação', () => {
  it('getAppName() deve retornar "Guardião" e não "DPO Fast"', () => {
    const appName = getAppName();
    expect(appName).toBe('Guardião');
    expect(appName).not.toContain('DPO Fast');
  });

  it('O componente Header deve renderizar o texto "Guardião"', () => {
    render(<Header />);
    const headerElement = screen.getByText(/Guardião/i);
    expect(headerElement).toBeDefined();
  });
});
