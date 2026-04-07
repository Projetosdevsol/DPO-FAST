
import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { AlertCircle, ChevronLeft } from 'lucide-react';
import { Logo } from './Logo';

export const Register: React.FC = () => {
  const [formData, setFormData] = useState({
    name: '',
    companyName: '',
    cnpj: '',
    address: '',
    email: '',
    password: '',
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);
  const { authState, register } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (authState.isAuthenticated && !authState.loading) {
      navigate('/dashboard', { state: { isFirstVisit: true } });
    }
  }, [authState.isAuthenticated, authState.loading, navigate]);

  const validateCnpj = (cnpj: string) => {
    const digitsOnly = cnpj.replace(/\D/g, '');
    return digitsOnly.length === 14;
  };

  const handleCnpjChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let value = e.target.value.replace(/\D/g, '').substring(0, 14);
    let formatted = '';
    if (value.length > 0) {
      formatted = value.substring(0, 2);
      if (value.length > 2) formatted += '.' + value.substring(2, 5);
      if (value.length > 5) formatted += '.' + value.substring(5, 8);
      if (value.length > 8) formatted += '/' + value.substring(8, 12);
      if (value.length > 12) formatted += '-' + value.substring(12, 14);
    }
    setFormData({ ...formData, cnpj: formatted });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateCnpj(formData.cnpj)) {
      setErrors({ cnpj: 'CNPJ inválido.' });
      return;
    }
    setLoading(true);
    try {
      await register(formData);
    } catch (err) {
      setLoading(false);
      setErrors({ general: 'Erro ao cadastrar. Tente outro e-mail.' });
    }
  };

  return (
    <div className="flex min-h-screen bg-gray-50 items-center justify-center px-4 py-12">
      <div className="w-full max-w-lg">
        <div className="mb-8">
          <Link to="/" className="inline-flex items-center gap-1 text-sm font-bold text-gray-400 hover:text-blue-600 transition-colors mb-6">
            <ChevronLeft className="h-4 w-4" /> Voltar ao início
          </Link>
          <div className="text-center">
            <div className="flex justify-center mb-4">
              <Logo className="h-16 w-16" />
            </div>
            <h1 className="text-3xl font-bold text-gray-900">Começar Agora</h1>
            <p className="text-gray-600 mt-2">Crie sua conta corporativa em segundos</p>
          </div>
        </div>

        <div className="bg-white p-8 rounded-2xl shadow-xl border border-gray-100">
          <form onSubmit={handleSubmit} className="space-y-4">
            {errors.general && (
              <div className="p-3 bg-red-50 border border-red-200 text-red-600 rounded-lg text-sm flex items-center gap-2">
                <AlertCircle className="h-4 w-4" /> {errors.general}
              </div>
            )}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Seu Nome</label>
                <input type="text" required className="w-full px-4 py-3 rounded-lg border border-slate-300 outline-none focus:ring-2 focus:ring-blue-600 text-slate-950 font-bold placeholder:text-slate-400 bg-slate-50 focus:bg-white transition-all" value={formData.name} onChange={(e) => setFormData({...formData, name: e.target.value})} placeholder="Seu nome" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">E-mail Corporativo</label>
                <input type="email" required className="w-full px-4 py-3 rounded-lg border border-slate-300 outline-none focus:ring-2 focus:ring-blue-600 text-slate-950 font-bold placeholder:text-slate-400 bg-slate-50 focus:bg-white transition-all" value={formData.email} onChange={(e) => setFormData({...formData, email: e.target.value})} placeholder="contato@empresa.com" />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Nome da Empresa</label>
              <input type="text" required className="w-full px-4 py-3 rounded-lg border border-slate-300 outline-none focus:ring-2 focus:ring-blue-600 text-slate-950 font-bold placeholder:text-slate-400 bg-slate-50 focus:bg-white transition-all" value={formData.companyName} onChange={(e) => setFormData({...formData, companyName: e.target.value})} placeholder="Razão Social" />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">CNPJ</label>
                <input type="text" required maxLength={18} className="w-full px-4 py-3 rounded-lg border border-slate-300 outline-none focus:ring-2 focus:ring-blue-600 text-slate-950 font-bold placeholder:text-slate-400 bg-slate-50 focus:bg-white transition-all" value={formData.cnpj} onChange={handleCnpjChange} placeholder="00.000.000/0000-00" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Senha</label>
                <input type="password" required minLength={6} className="w-full px-4 py-3 rounded-lg border border-slate-300 outline-none focus:ring-2 focus:ring-blue-600 text-slate-950 font-bold placeholder:text-slate-400 bg-slate-50 focus:bg-white transition-all" value={formData.password} onChange={(e) => setFormData({...formData, password: e.target.value})} placeholder="No mínimo 6 caracteres" />
              </div>
            </div>
            <button type="submit" disabled={loading} className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 rounded-lg shadow-md transition-all active:scale-[0.98] mt-4">
              {loading ? 'Processando...' : 'Criar Conta'}
            </button>
          </form>
          <div className="mt-8 pt-6 border-t border-gray-100 text-center text-sm text-gray-600">
            <p>Já possui cadastro? <Link to="/login" className="text-blue-600 font-semibold hover:underline">Acessar conta</Link></p>
          </div>
        </div>
      </div>
    </div>
  );
};
