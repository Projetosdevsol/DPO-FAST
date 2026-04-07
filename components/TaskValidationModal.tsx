
import React, { useState, useRef } from 'react';
import { 
  X, CheckCircle, AlertTriangle, ShieldCheck, 
  FileText, Send, ArrowRight, Upload, Link as LinkIcon, 
  FileCheck, Loader2, Paperclip, Trash2, HelpCircle, 
  History, Info, MessageSquare, Save, PlayCircle, AlertCircle,
  Zap
} from 'lucide-react';
import { ComplianceTask, ValidationResult, ValidationHistoryEntry } from '../types';
import { validateTaskCompliance, LGPD_CRITERIA_EXPLANATIONS } from '../logic/validationEngine';
import { extractTextFromFile } from '../logic/documentProcessor';
import { storage } from '../lib/firebase';
import { ref, uploadBytesResumable, getDownloadURL } from 'https://www.gstatic.com/firebasejs/10.8.0/firebase-storage.js';
import { useAuth } from '../context/AuthContext';

interface TaskValidationModalProps {
  task: ComplianceTask;
  onClose: () => void;
  onSave: (evidence: string, result: ValidationResult, observations: string, fileUrl?: string, status?: 'Concluída' | 'Revisar') => void;
  suggestedDocContent?: string;
}

type EvidenceType = 'system' | 'text' | 'file' | 'link';

export const TaskValidationModal: React.FC<TaskValidationModalProps> = ({ task, onClose, onSave, suggestedDocContent }) => {
  const { authState } = useAuth();
  const [evidenceType, setEvidenceType] = useState<EvidenceType>(task.evidenceUrl ? 'file' : 'system');
  const [evidence, setEvidence] = useState(task.evidence || '');
  const [observations, setObservations] = useState(task.observations || '');
  const [result, setResult] = useState<ValidationResult | null>(task.validationResult || null);
  const [statusText, setStatusText] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadedFile, setUploadedFile] = useState<{name: string, url: string} | null>(task.evidenceUrl ? { name: 'Arquivo de Evidência', url: task.evidenceUrl } : null);
  const [activeHelp, setActiveHelp] = useState<string | null>(null);
  const [showHistory, setShowHistory] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleValidate = async () => {
    setIsProcessing(true);
    setStatusText('Validando conteúdo contra regras da LGPD...');
    try {
      await new Promise(r => setTimeout(r, 1000));
      const validation = validateTaskCompliance(task, evidence);
      setResult(validation);
    } catch (err) {
      console.error(err);
    } finally {
      setIsProcessing(false);
      setStatusText('');
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !authState.user) return;

    setIsProcessing(true);
    setStatusText('Extraindo texto do arquivo...');
    setUploadProgress(0);
    
    try {
      const text = await extractTextFromFile(file);
      setEvidence(text);

      setStatusText('Enviando arquivo para servidor seguro...');
      const storageRef = ref(storage, `evidences/${authState.user.id}/${task.id}_${file.name}`);
      const uploadTask = uploadBytesResumable(storageRef, file);

      uploadTask.on('state_changed', 
        (snapshot) => {
          const progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
          setUploadProgress(progress);
        }, 
        (error) => {
          throw error;
        }, 
        async () => {
          const url = await getDownloadURL(uploadTask.snapshot.ref);
          setUploadedFile({ name: file.name, url });
          setStatusText('Validando conformidade do documento...');
          const validation = validateTaskCompliance(task, text);
          setResult(validation);
          setIsProcessing(false);
          setStatusText('');
        }
      );
    } catch (err: any) {
      alert(err.message || 'Erro ao processar arquivo.');
      setIsProcessing(false);
      setStatusText('');
    }
  };

  const handleUseSuggested = () => {
    if (suggestedDocContent) {
      setEvidence(suggestedDocContent);
      setEvidenceType('system');
      setResult(null);
    }
  };

  const handleRequestReview = () => {
    if (!evidence.trim()) return;
    const validation = result || validateTaskCompliance(task, evidence);
    onSave(evidence, validation, observations, uploadedFile?.url, 'Revisar');
  };

  const EvidenceTabs = () => (
    <div className="flex bg-slate-100 p-1 rounded-2xl gap-1">
      {['system', 'text', 'file', 'link'].map((type) => (
        <button 
          key={type}
          onClick={() => setEvidenceType(type as EvidenceType)}
          className={`flex-1 flex items-center justify-center gap-2 py-2 px-3 rounded-xl text-[10px] font-black uppercase tracking-tight transition-all ${evidenceType === type ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
        >
          {type === 'system' && <FileCheck className="h-4 w-4" />}
          {type === 'text' && <FileText className="h-4 w-4" />}
          {type === 'file' && <Paperclip className="h-4 w-4" />}
          {type === 'link' && <LinkIcon className="h-4 w-4" />}
          {type === 'system' ? 'Sistema' : type === 'text' ? 'Texto' : type === 'file' ? 'Arquivo' : 'Link'}
        </button>
      ))}
    </div>
  );

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
      <div className="bg-white w-full max-w-5xl rounded-[2.5rem] shadow-2xl flex flex-col overflow-hidden animate-in zoom-in-95 duration-200 max-h-[95vh]">
        <div className="px-8 py-6 border-b border-slate-100 flex items-center justify-between bg-slate-50/30">
          <div className="flex items-center gap-4">
            <div className={`p-3 rounded-2xl ${task.priority === 'Alta' ? 'bg-red-50 text-red-600' : 'bg-blue-50 text-blue-600'}`}>
              <ShieldCheck className="h-6 w-6" />
            </div>
            <div>
              <h2 className="text-xl font-black text-slate-900 leading-none">Validação de Conformidade</h2>
              <p className="text-[10px] text-slate-400 mt-2 uppercase font-black tracking-[0.2em]">{task.title}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {task.history && task.history.length > 0 && (
              <button 
                onClick={() => setShowHistory(!showHistory)}
                className={`p-2.5 rounded-xl transition-all ${showHistory ? 'bg-blue-600 text-white' : 'bg-white border border-slate-200 text-slate-400 hover:text-blue-600'}`}
                title="Histórico de Tentativas"
              >
                <History className="h-5 w-5" />
              </button>
            )}
            <button onClick={onClose} className="p-2.5 bg-white border border-slate-200 rounded-xl text-slate-400 hover:text-red-500 hover:bg-red-50 transition-all"><X className="h-6 w-6" /></button>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-0 grid grid-cols-1 lg:grid-cols-5 h-full">
          {/* Coluna Lateral: Guia de Implementação */}
          <div className="lg:col-span-2 bg-slate-50/50 p-8 border-r border-slate-100 space-y-8">
            <section className="space-y-4">
              <div className="flex items-center gap-2 text-amber-600">
                <AlertCircle className="h-4 w-4" />
                <h4 className="text-[10px] font-black uppercase tracking-widest">O que identificamos?</h4>
              </div>
              <p className="text-sm font-bold text-slate-600 leading-relaxed bg-white p-4 rounded-2xl border border-slate-100">
                {task.description}
              </p>
            </section>

            <section className="space-y-4">
              <div className="flex items-center gap-2 text-blue-600">
                <PlayCircle className="h-4 w-4" />
                <h4 className="text-[10px] font-black uppercase tracking-widest">Como implementar?</h4>
              </div>
              <div className="text-sm font-medium text-slate-500 leading-relaxed bg-blue-50/50 p-4 rounded-2xl border border-blue-100/50 whitespace-pre-wrap">
                {task.explanation}
              </div>
            </section>

            {showHistory && (
              <section className="space-y-4 animate-in slide-in-from-left-4">
                <div className="flex items-center gap-2 text-indigo-600">
                  <History className="h-4 w-4" />
                  <h4 className="text-[10px] font-black uppercase tracking-widest">Histórico</h4>
                </div>
                <div className="space-y-3">
                  {task.history?.map((entry, idx) => (
                    <div key={idx} className="p-3 rounded-xl bg-white border border-slate-100 text-[10px] shadow-sm">
                      <div className="flex justify-between items-center mb-1">
                        <span className="font-bold text-slate-400">{new Date(entry.date).toLocaleDateString()}</span>
                        <span className={`font-black uppercase ${entry.result.isValid ? 'text-green-600' : 'text-amber-600'}`}>
                          {entry.result.isValid ? 'Válido' : 'Inválido'}
                        </span>
                      </div>
                      <p className="text-slate-500 truncate italic">"{entry.evidence}"</p>
                    </div>
                  ))}
                </div>
              </section>
            )}
          </div>

          {/* Coluna Central: Ação de Validação */}
          <div className="lg:col-span-3 p-8 space-y-6">
            <div className="space-y-4">
              <h4 className="text-[11px] font-black text-slate-400 uppercase tracking-widest">Sua Evidência de Implementação</h4>
              <EvidenceTabs />

              <div className="space-y-4 min-h-[300px]">
                {evidenceType === 'system' && (
                  <div className="bg-slate-50 p-10 rounded-[2rem] border-2 border-dashed border-slate-200 text-center space-y-4">
                    <FileCheck className="h-12 w-12 text-slate-300 mx-auto" />
                    <div>
                      <h4 className="font-black text-slate-900">Documentação do Sistema</h4>
                      <p className="text-xs text-slate-500 mt-1">Podemos preencher a evidência com o conteúdo oficial sugerido.</p>
                    </div>
                    <button 
                      onClick={handleUseSuggested}
                      disabled={!suggestedDocContent}
                      className="px-8 py-3 bg-white border border-slate-200 rounded-2xl text-xs font-black text-blue-600 hover:shadow-lg transition-all disabled:opacity-30"
                    >
                      Usar Texto Sugerido
                    </button>
                  </div>
                )}

                {evidenceType === 'text' && (
                  <textarea
                    className="w-full h-48 p-6 rounded-[2rem] border border-slate-200 focus:bg-white focus:ring-4 focus:ring-blue-50 outline-none text-sm leading-relaxed transition-all text-slate-900 font-bold placeholder:text-slate-400"
                    placeholder="Descreva detalhadamente a medida técnica ou cole o conteúdo do documento que você implementou..."
                    value={evidence}
                    onChange={(e) => { setEvidence(e.target.value); setResult(null); }}
                  />
                )}

                {evidenceType === 'file' && (
                  <div className="space-y-4">
                    {!uploadedFile ? (
                      <div 
                        onClick={() => !isProcessing && fileInputRef.current?.click()}
                        className={`bg-slate-50 p-16 rounded-[2.5rem] border-2 border-dashed border-slate-200 text-center transition-all group ${isProcessing ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer hover:border-blue-400 hover:bg-blue-50'}`}
                      >
                        <Upload className="h-12 w-12 text-slate-300 mx-auto mb-4 group-hover:text-blue-500 group-hover:-translate-y-1 transition-all" />
                        <h4 className="font-black text-slate-900">Clique para enviar arquivo</h4>
                        <p className="text-xs text-slate-400 mt-1 uppercase font-bold tracking-widest">Suporte: PDF, DOCX ou TXT</p>
                        <input type="file" ref={fileInputRef} className="hidden" accept=".pdf,.docx,.txt" onChange={handleFileUpload} disabled={isProcessing} />
                      </div>
                    ) : (
                      <div className="bg-blue-600 p-5 rounded-3xl flex items-center justify-between text-white shadow-xl shadow-blue-100">
                        <div className="flex items-center gap-4">
                          <div className="p-3 bg-white/20 rounded-xl"><FileText className="h-6 w-6" /></div>
                          <div>
                            <p className="text-sm font-black truncate max-w-[200px]">{uploadedFile.name}</p>
                            <p className="text-[10px] font-bold text-blue-200 uppercase tracking-widest">Documento Processado</p>
                          </div>
                        </div>
                        <button onClick={() => setUploadedFile(null)} className="p-2 hover:bg-white/10 rounded-xl transition-all"><Trash2 className="h-5 w-5" /></button>
                      </div>
                    )}
                  </div>
                )}

                {evidenceType === 'link' && (
                  <div className="space-y-4">
                    <div className="relative">
                      <LinkIcon className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400" />
                      <input 
                        type="url"
                        placeholder="https://seu-site.com/privacidade"
                        className="w-full pl-12 pr-4 py-4 rounded-2xl border border-slate-200 focus:bg-white focus:ring-4 focus:ring-blue-50 outline-none text-slate-900 font-bold"
                        value={evidence.startsWith('http') ? evidence : ''}
                        onChange={(e) => setEvidence(e.target.value)}
                      />
                    </div>
                    <p className="text-[10px] text-slate-400 font-bold px-2">Insira o link público onde o aviso ou termo está publicado.</p>
                  </div>
                )}

                <div className="space-y-3">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2 ml-1">
                    <MessageSquare className="h-3 w-3" /> Anotações Adicionais
                  </label>
                  <input 
                    type="text"
                    className="w-full px-5 py-4 rounded-2xl bg-slate-50 border border-slate-100 focus:bg-white focus:ring-4 focus:ring-blue-50 outline-none text-sm text-slate-900 font-bold"
                    placeholder="Algo que o auditor precise saber sobre essa evidência?"
                    value={observations}
                    onChange={(e) => setObservations(e.target.value)}
                  />
                </div>
              </div>

              {isProcessing && (
                <div className="space-y-3 p-4 bg-slate-50 rounded-2xl border border-slate-100">
                  <div className="flex items-center justify-between text-[10px] font-black text-blue-600 uppercase tracking-widest">
                    <div className="flex items-center gap-2">
                      <Loader2 className="h-3 w-3 animate-spin" /> {statusText}
                    </div>
                    {uploadProgress > 0 && <span>{Math.round(uploadProgress)}%</span>}
                  </div>
                  <div className="h-2 w-full bg-slate-200 rounded-full overflow-hidden">
                    <div className="h-full bg-blue-600 transition-all duration-300" style={{ width: `${uploadProgress || 100}%` }} />
                  </div>
                </div>
              )}

              {result && !isProcessing && (
                <div className={`p-6 rounded-[2rem] border-2 animate-in slide-in-from-bottom-4 ${result.isValid ? 'bg-emerald-50 border-emerald-100' : 'bg-amber-50 border-amber-100'}`}>
                  <div className="flex gap-4">
                    <div className={`mt-1 p-2.5 rounded-xl shrink-0 ${result.isValid ? 'bg-emerald-500 text-white' : 'bg-amber-500 text-white'}`}>
                      {result.isValid ? <CheckCircle className="h-5 w-5" /> : <AlertTriangle className="h-5 w-5" />}
                    </div>
                    <div className="flex-1">
                      <h4 className={`text-sm font-black uppercase tracking-tight ${result.isValid ? 'text-emerald-900' : 'text-amber-900'}`}>
                        {result.isValid ? 'Conformidade Verificada' : 'Ajustes Necessários'}
                      </h4>
                      <p className={`text-sm mt-1 font-medium ${result.isValid ? 'text-emerald-800' : 'text-amber-800'}`}>{result.feedback}</p>
                      
                      {!result.isValid && result.missingElements.length > 0 && (
                        <div className="mt-4 flex flex-wrap gap-2">
                          {result.missingElements.map(el => (
                            <div key={el} className="relative">
                              <button 
                                onClick={() => setActiveHelp(activeHelp === el ? null : el)}
                                className="flex items-center gap-2 px-3 py-1.5 bg-white border border-amber-200 text-amber-700 text-[10px] font-black uppercase rounded-xl hover:bg-amber-100 transition-all"
                              >
                                {el} <HelpCircle className="h-3 w-3" />
                              </button>
                              {activeHelp === el && (
                                <div className="absolute z-[120] bottom-full left-0 mb-3 w-64 p-4 bg-slate-900 text-white text-[11px] rounded-[1.5rem] shadow-2xl animate-in fade-in zoom-in-95 border border-slate-700 leading-relaxed">
                                  {LGPD_CRITERIA_EXPLANATIONS[el] || 'Requisito essencial para validade jurídica desta tarefa.'}
                                </div>
                              )}
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Rodapé do Modal */}
        <div className="p-8 border-t border-slate-100 bg-slate-50/50 flex flex-col sm:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-2 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">
            <ShieldCheck className="h-4 w-4 text-emerald-500" /> Auditoria LGPD Ativa
          </div>
          <div className="flex gap-3 w-full sm:w-auto">
            <button
              onClick={handleRequestReview}
              disabled={!evidence.trim() || isProcessing}
              className="flex-1 sm:flex-none px-6 py-4 rounded-2xl bg-white border border-slate-200 font-black text-slate-500 text-xs uppercase tracking-widest hover:bg-slate-50 transition-all disabled:opacity-30"
            >
              Solicitar Revisão
            </button>
            <button
              onClick={handleValidate}
              disabled={!evidence.trim() || isProcessing}
              className="flex-1 sm:flex-none px-6 py-4 rounded-2xl bg-indigo-50 text-indigo-600 border border-indigo-100 font-black text-xs uppercase tracking-widest hover:bg-indigo-100 transition-all disabled:opacity-30 flex items-center justify-center gap-2"
            >
              {isProcessing ? <Loader2 className="h-4 w-4 animate-spin" /> : <Zap className="h-4 w-4 fill-current" />}
              {isProcessing ? 'Analisando...' : 'Analisar Evidência'}
            </button>
            <button
              onClick={() => result && onSave(evidence, result, observations, uploadedFile?.url, 'Concluída')}
              disabled={!result?.isValid || isProcessing}
              className="flex-1 sm:flex-none px-10 py-4 bg-slate-900 text-white rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-black disabled:opacity-30 shadow-xl transition-all flex items-center justify-center gap-2"
            >
              Finalizar <ArrowRight className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
