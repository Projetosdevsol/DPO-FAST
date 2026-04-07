
import React, { useState } from 'react';
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

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white w-full max-w-4xl max-h-[90vh] rounded-3xl shadow-2xl flex flex-col overflow-hidden animate-in zoom-in-95 duration-200">
        <div className="px-8 py-6 border-b border-gray-100 flex items-center justify-between bg-white sticky top-0">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-50 rounded-lg text-blue-600">
              <FileText className="h-5 w-5" />
            </div>
            <h2 className="text-xl font-bold text-gray-900">{document.title}</h2>
          </div>
          <button 
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-full text-gray-400 transition-colors"
          >
            <X className="h-6 w-6" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-8 bg-gray-50">
          <div className="bg-white p-12 shadow-sm rounded-lg border border-gray-200 min-h-full font-serif text-gray-800 leading-relaxed whitespace-pre-wrap">
            {document.content}
          </div>
        </div>

        <div className="px-8 py-6 border-t border-gray-100 flex items-center justify-between bg-white">
          <div className="text-sm text-gray-500 italic">
            Revise as informações acima antes de gerar o arquivo oficial.
          </div>
          <div className="flex gap-4">
            <button
              onClick={handleCopy}
              className="px-6 py-2.5 rounded-xl border border-gray-200 font-bold text-gray-700 hover:bg-gray-50 flex items-center gap-2 transition-all"
            >
              {copied ? <CheckCircle className="h-4 w-4 text-green-600" /> : <Copy className="h-4 w-4" />}
              {copied ? 'Copiado!' : 'Copiar Texto'}
            </button>
            <button
              onClick={onDownload}
              className="px-8 py-2.5 rounded-xl bg-blue-600 text-white font-bold flex items-center gap-2 hover:bg-blue-700 shadow-lg shadow-blue-100 transition-all"
            >
              <Download className="h-4 w-4" />
              Baixar PDF
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
