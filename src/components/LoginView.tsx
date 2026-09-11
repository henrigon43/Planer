import React, { useState } from 'react';
import { UserAccount } from '../types';
import {
  Lock,
  User,
  Key,
  ShieldCheck,
  CheckCircle2,
  AlertCircle,
  LogIn,
  Laptop,
  Smartphone,
  Sparkles,
} from 'lucide-react';

interface LoginViewProps {
  allUsers: UserAccount[];
  onLogin: (username: string, password: string, rememberMe: boolean) => { success: boolean; error?: string };
  onCancel?: () => void;
  isModal?: boolean;
}

export function LoginView({ allUsers, onLogin, onCancel, isModal = false }: LoginViewProps) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(true); // Default to true as requested for seamless mobile/pc
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    const cleanUser = username.trim().toLowerCase();
    const cleanPass = password.trim();

    if (!cleanUser || !cleanPass) {
      setErrorMessage('Por favor, informe o usuário e a senha.');
      return;
    }

    const res = onLogin(cleanUser, cleanPass, rememberMe);
    if (!res.success) {
      setErrorMessage(res.error || 'Usuário ou senha incorretos.');
    }
  };

  const handleQuickAdminLogin = () => {
    setUsername('henrique');
    setPassword('1234');
    const res = onLogin('henrique', '1234', rememberMe);
    if (!res.success) {
      setErrorMessage(res.error || 'Erro ao entrar como admin.');
    }
  };

  const cardContent = (
    <div className="w-full max-w-md bg-white rounded-3xl border border-slate-200/80 shadow-xl overflow-hidden p-7 sm:p-9 animate-fadeIn">
      {/* Brand Header */}
      <div className="text-center mb-6">
        <div className="w-14 h-14 mx-auto rounded-2xl bg-gradient-to-tr from-indigo-600 via-indigo-700 to-violet-600 flex items-center justify-center text-white text-2xl shadow-md mb-3">
          📓
        </div>
        <h1 className="text-2xl font-black text-slate-900 tracking-tight">
          Caderno & Planner
        </h1>
        <p className="text-xs text-slate-500 mt-1">
          Acesse seu espaço individual e privativo
        </p>
      </div>

      {/* Notice about privacy & admin */}
      <div className="mb-6 p-3 bg-indigo-50/80 border border-indigo-100 rounded-2xl text-xs text-indigo-900 flex items-start gap-2.5">
        <ShieldCheck className="w-4 h-4 text-indigo-600 shrink-0 mt-0.5" />
        <div className="text-[11px] leading-relaxed">
          <strong>Acesso Individual:</strong> Cada usuário visualiza exclusivamente suas próprias tarefas e anotações. Apenas o administrador <strong>Henrique</strong> pode cadastrar novos logins.
        </div>
      </div>

      {errorMessage && (
        <div className="mb-5 p-3.5 bg-rose-50 border border-rose-200 text-rose-700 text-xs rounded-xl flex items-center gap-2 animate-shake">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{errorMessage}</span>
        </div>
      )}

      {/* Login Form */}
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-xs font-bold text-slate-700 mb-1.5">
            Nome de Usuário (Login):
          </label>
          <div className="relative">
            <input
              id="login-username"
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value.toLowerCase().replace(/\s+/g, ''))}
              placeholder="Ex: henrique"
              className="w-full text-sm pl-9 pr-3.5 py-3 rounded-xl border border-slate-200 focus:outline-hidden focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 bg-slate-50/60 font-medium transition-all"
              autoFocus
              required
            />
            <User className="w-4 h-4 absolute left-3 top-3.5 text-slate-400" />
          </div>
        </div>

        <div>
          <label className="block text-xs font-bold text-slate-700 mb-1.5">
            Senha:
          </label>
          <div className="relative">
            <input
              id="login-password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Digite sua senha"
              className="w-full text-sm pl-9 pr-3.5 py-3 rounded-xl border border-slate-200 focus:outline-hidden focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 bg-slate-50/60 font-medium transition-all"
              required
            />
            <Key className="w-4 h-4 absolute left-3 top-3.5 text-slate-400" />
          </div>
        </div>

        {/* Option: Deixar Logado (Remember me) - requested specifically */}
        <div className="pt-1">
          <label
            htmlFor="chk-remember-me"
            className="flex items-center gap-2.5 p-2.5 rounded-xl border border-slate-200/80 bg-slate-50/70 hover:bg-slate-100/70 cursor-pointer select-none transition-colors"
          >
            <input
              id="chk-remember-me"
              type="checkbox"
              checked={rememberMe}
              onChange={(e) => setRememberMe(e.target.checked)}
              className="w-4 h-4 rounded text-indigo-600 focus:ring-indigo-500 border-slate-300"
            />
            <div className="text-xs">
              <span className="font-bold text-slate-800 block">
                Deixar logado neste aparelho
              </span>
              <span className="text-[11px] text-slate-500 block">
                Não pedirá senha ao reabrir no celular ou computador.
              </span>
            </div>
          </label>
        </div>

        <button
          id="btn-login-submit"
          type="submit"
          className="w-full py-3 px-4 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-sm flex items-center justify-center gap-2 shadow-md transition-all cursor-pointer mt-2"
        >
          <LogIn className="w-4 h-4" />
          <span>Entrar no Meu Planner</span>
        </button>
      </form>

      {/* Quick Admin Access Button */}
      <div className="mt-5 pt-5 border-t border-slate-100">
        <button
          type="button"
          onClick={handleQuickAdminLogin}
          className="w-full py-2.5 px-3 rounded-xl border border-slate-200 hover:border-indigo-200 bg-white hover:bg-indigo-50/50 text-xs font-semibold text-slate-700 hover:text-indigo-700 flex items-center justify-center gap-2 transition-colors cursor-pointer"
        >
          <ShieldCheck className="w-3.5 h-3.5 text-indigo-600" />
          <span>Acesso Rápido Admin: Henrique (1234)</span>
        </button>
      </div>

      {isModal && onCancel && (
        <button
          type="button"
          onClick={onCancel}
          className="w-full mt-3 py-2 text-xs font-semibold text-slate-400 hover:text-slate-600 transition-colors"
        >
          Cancelar e fechar
        </button>
      )}

      {/* Devices Footer */}
      <div className="mt-6 flex items-center justify-center gap-2 text-[11px] text-slate-400">
        <Laptop className="w-3.5 h-3.5" />
        <span>Sincronizado automaticamente entre PC e Celular</span>
        <Smartphone className="w-3.5 h-3.5" />
      </div>
    </div>
  );

  if (isModal) {
    return (
      <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
        {cardContent}
      </div>
    );
  }

  return (
    <div className="min-h-[80vh] flex items-center justify-center p-4">
      {cardContent}
    </div>
  );
}
