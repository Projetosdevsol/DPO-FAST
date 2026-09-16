import React, { useState } from 'react';
import { AlertTriangle, Loader2, X } from 'lucide-react';

interface Props {
  userName: string;
  userEmail: string;
  confirming: boolean;
  onClose: () => void;
  onConfirm: () => void | Promise<void>;
}

export const DeleteUserModal: React.FC<Props> = ({ userName, userEmail, confirming, onClose, onConfirm }) => {
  const [typed, setTyped] = useState('');
  const match = typed.trim().toLowerCase() === userEmail.trim().toLowerCase();

  return (
    <div className="fixed inset-0 z-[9999] flex items-end sm:items-center justify-center sm:p-4 overflow-y-auto">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => !confirming && onClose()} />
      <div className="relative w-full sm:max-w-md bg-white rounded-t-[1.5rem] sm:rounded-[1.5rem] shadow-2xl p-5 sm:p-6 space-y-4">
        <div className="flex items-start gap-3">
          <div className="p-3 bg-red-50 text-red-600 rounded-2xl shrink-0">
            <AlertTriangle className="h-6 w-6" />
          </div>
          <div className="min-w-0">
            <h3 className="font-black text-slate-900 text-base sm:text-lg">Excluir conta permanentemente?</h3>
            <p className="text-xs sm:text-sm text-slate-600 mt-1 break-words">
              <b>{userName}</b> ({userEmail}) perderá acesso, Auth, Firestore e arquivos. Esta ação é <b>irreversível</b>.
            </p>
          </div>
          <button onClick={onClose} aria-label="Fechar" disabled={confirming} className="p-2 min-h-[44px] min-w-[44px] flex items-center justify-center rounded-xl text-slate-400 hover:bg-slate-100 shrink-0 disabled:opacity-50">
            <X className="h-5 w-5" />
          </button>
        </div>

        <div>
          <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">
            Digite o e-mail para confirmar
          </label>
          <input
            type="email"
            value={typed}
            onChange={(e) => setTyped(e.target.value)}
            placeholder="Digite o e-mail do usuário"
            disabled={confirming}
            className="mt-2 w-full px-4 py-3 min-h-[44px] rounded-xl border border-[var(--border)] bg-[var(--surface-muted)] text-base md:text-sm font-bold text-slate-900 outline-none focus:ring-4 focus:ring-red-100 focus:border-red-400"
          />
        </div>

        <div className="flex flex-col sm:flex-row gap-3">
          <button
            onClick={onClose}
            disabled={confirming}
            className="flex-1 py-3 min-h-[44px] rounded-xl border border-[var(--border)] font-black text-xs uppercase tracking-widest text-slate-500 hover:bg-slate-50 disabled:opacity-50"
          >
            Cancelar
          </button>
          <button
            onClick={() => void onConfirm()}
            disabled={!match || confirming}
            className="flex-1 py-3 min-h-[44px] rounded-xl bg-red-600 text-white font-black text-xs uppercase tracking-widest hover:bg-red-700 disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {confirming ? (<><Loader2 className="h-4 w-4 animate-spin" /> Excluindo...</>) : 'Excluir definitivamente'}
          </button>
        </div>
      </div>
    </div>
  );
};
