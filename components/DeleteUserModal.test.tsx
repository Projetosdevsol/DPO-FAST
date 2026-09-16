// @vitest-environment jsdom
import { describe, it, expect, vi, afterEach } from 'vitest';
import { render, screen, fireEvent, cleanup } from '@testing-library/react';
import React from 'react';
import { DeleteUserModal } from './DeleteUserModal';

afterEach(() => cleanup());

describe('TU-ADM-05/06 — DeleteUserModal', () => {
  const base = {
    userName: 'Cliente X',
    userEmail: 'x@empresa.com',
    onClose: vi.fn(),
    onConfirm: vi.fn().mockResolvedValue(undefined),
  };

  it('TU-ADM-05: exige digitar o e-mail para liberar a exclusão', () => {
    render(<DeleteUserModal {...base} confirming={false} />);
    const btn = screen.getByRole('button', { name: /excluir definitivamente/i });
    expect((btn as HTMLButtonElement).disabled).toBe(true);
    fireEvent.change(screen.getByPlaceholderText(/digite o e-mail/i), { target: { value: 'x@empresa.com' } });
    expect((btn as HTMLButtonElement).disabled).toBe(false);
  });

  it('TU-ADM-06: loading bloqueia duplo clique e mostra estado', async () => {
    const onConfirm = vi.fn(() => new Promise(() => {})); // nunca resolve
    render(<DeleteUserModal {...base} onConfirm={onConfirm} confirming={true} />);
    const btn = screen.getByRole('button', { name: /excluindo/i });
    expect((btn as HTMLButtonElement).disabled).toBe(true);
    fireEvent.click(btn);
    expect(onConfirm).not.toHaveBeenCalled();
  });

  it('confirma chama onConfirm uma única vez', async () => {
    const onConfirm = vi.fn().mockResolvedValue(undefined);
    render(<DeleteUserModal {...base} onConfirm={onConfirm} confirming={false} />);
    fireEvent.change(screen.getByPlaceholderText(/digite o e-mail/i), { target: { value: 'x@empresa.com' } });
    fireEvent.click(screen.getByRole('button', { name: /excluir definitivamente/i }));
    expect(onConfirm).toHaveBeenCalledTimes(1);
  });
});
