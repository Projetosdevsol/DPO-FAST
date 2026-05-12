import React, { useState } from 'react';
import { createPortal } from 'react-dom';
import { X, Download, FileText, CheckCircle, Copy } from 'lucide-react';
import { DocumentContent } from '../logic/templates';

interface DocumentPreviewProps {
  document: DocumentContent;
  onClose: () => void;
  onDownload: () => void;
}

export const DocumentPreview: React.FC<DocumentPreviewProps> = ({ document, onClose, onDownload }) => {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(document.content);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return createPortal(
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 overflow-y-auto">
      <div className="min-h-screen flex items-center justify-center p-4 md:p-8">
        <div className="bg-[var(--surface)] w-full max-w-4xl flex flex-col rounded-3xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
          <div className="px-6 md:px-8 py-4 md:py-6 border-b border-[var(--border)] flex items-center justify-between bg-[var(--surface)] sticky top-0 shrink-0">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-500/10 rounded-lg text-blue-600 hidden md:block">
                <FileText className="h-5 w-5" />
              </div>
              <h2 className="text-lg md:text-xl font-bold text-[var(--text-primary)] truncate max-w-[200px] md:max-w-none">{document.title}</h2>
            </div>
            <button 
              onClick={onClose}
              className="p-2 hover:bg-[var(--surface-muted)] rounded-full text-[var(--text-muted)] transition-colors"
            >
              <X className="h-6 w-6" />
            </button>
          </div>

          <div className="flex-1 overflow-y-auto p-4 md:p-8 bg-[var(--background)]">
            <div className="bg-[var(--surface)] p-6 md:p-12 shadow-xl rounded-lg border border-[var(--border)] min-h-full font-serif text-[var(--text-primary)] text-sm md:text-base leading-relaxed whitespace-pre-wrap">
              {document.content}
            </div>
          </div>

          <div className="px-6 md:px-8 py-4 md:py-6 border-t border-[var(--border)] flex flex-col md:flex-row items-center justify-between gap-4 bg-[var(--surface)] shrink-0">
            <div className="text-[10px] md:text-sm text-[var(--text-muted)] italic text-center md:text-left">
              Revise as informações acima antes de gerar o arquivo oficial.
            </div>
            <div className="flex w-full md:w-auto gap-3 md:gap-4">
              <button
                onClick={handleCopy}
                className="flex-1 md:flex-none px-4 md:px-6 py-2.5 rounded-xl border border-[var(--border)] font-black text-[10px] md:text-xs uppercase tracking-widest text-[var(--text-primary)] hover:bg-[var(--surface-muted)] flex items-center justify-center gap-2 transition-all"
              >
                {copied ? <CheckCircle className="h-4 w-4 text-green-500" /> : <Copy className="h-4 w-4" />}
                {copied ? 'Copiado!' : 'Copiar'}
              </button>
              <button
                onClick={onDownload}
                className="flex-1 md:flex-none px-6 md:px-8 py-2.5 rounded-xl bg-blue-600 text-white font-black text-[10px] md:text-xs uppercase tracking-widest flex items-center justify-center gap-2 hover:bg-blue-700 shadow-lg shadow-blue-600/20 transition-all always-white"
              >
                <Download className="h-4 w-4" />
                Baixar
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>,
    document.body
  );
};
