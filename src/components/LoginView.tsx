import React, { useState } from 'react';
import { UserAccount } from '../types';
import { AppLogo } from './AppLogo';
import {
  User,
  Key,
  ShieldCheck,
  AlertCircle,
  LogIn,
  Laptop,
  Smartphone,
  Info,
} from 'lucide-react';

interface LoginViewProps {
  allUsers: UserAccount[];
  onLogin: (username: string, password: string, rememberMe: boolean) => { success: boolean; error?: string };
  onCancel?: () => void;
  isModal?: boolean;
  onOpenSiteInfo?: () => void;
}

export function LoginView({
  allUsers,
  onLogin,
  onCancel,
  isModal = false,
  onOpenSiteInfo,
}: LoginViewProps) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleLoginSubmit = (e: React.FormEvent) => {
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

  const cardContent = (
    <div className="w-full max-w-md bg-white rounded-3xl border border-slate-200/80 shadow-xl overflow-hidden p-6 sm:p-8 animate-fadeIn">
      {/* Brand Header */}
      <div className="text-center mb-6">
        <div
          onClick={onOpenSiteInfo}
          className={`w-16 h-16 mx-auto rounded-2xl bg-white border border-slate-200/80 p-2.5 flex items-center justify-center text-slate-900 shadow-sm mb-3 ${
            onOpenSiteInfo ? 'cursor-pointer hover:border-indigo-400 hover:shadow-md transition-all' : ''
          }`}
          title={onOpenSiteInfo ? 'Clique para ver Informações do Site' : 'Caderno & Planner'}
        >
          <AppLogo className="w-full h-full text-slate-900" />
        </div>
        <div className="flex items-center justify-center gap-1.5">
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">
            Caderno & Planner
          </h1>
          {onOpenSiteInfo && (
            <button
              type="button"
              onClick={onOpenSiteInfo}
              className="text-slate-400 hover:text-indigo-600 transition-colors cursor-pointer p-0.5"
              title="Ver Informações do Site"
            >
              <Info className="w-4 h-4" />
            </button>
          )}
        </div>
        <p className="text-xs text-slate-500 mt-1">
          Acesse seu espaço individual e privativo
        </p>
      </div>

      {/* Notice about individual privacy */}
      <div className="mb-6 p-3.5 bg-indigo-50/80 border border-indigo-100 rounded-2xl text-xs text-indigo-950 flex items-start gap-2.5">
        <ShieldCheck className="w-4 h-4 text-indigo-600 shrink-0 mt-0.5" />
        <div className="text-[11px] leading-relaxed">
          <strong>Acesso Individual:</strong> Cada usuário visualiza exclusivamente suas próprias tarefas e anotações.
        </div>
      </div>

      {errorMessage && (
        <div className="mb-5 p-3.5 bg-rose-50 border border-rose-200 text-rose-700 text-xs rounded-xl flex items-center gap-2 animate-shake">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{errorMessage}</span>
        </div>
      )}

      {/* Direct Login Form */}
      <form onSubmit={handleLoginSubmit} className="space-y-4">
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
              placeholder="Digite seu usuário"
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

        <div className="pt-0.5">
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
              <span className="font-bold text-slate-800 block leading-tight">
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

      {isModal && onCancel && (
        <button
          type="button"
          onClick={onCancel}
          className="w-full mt-3 py-2 text-xs font-semibold text-slate-400 hover:text-slate-600 transition-colors cursor-pointer"
        >
          Cancelar e fechar
        </button>
      )}

      {/* Devices & Site Info Footer */}
      <div className="mt-6 pt-4 border-t border-slate-100 flex flex-col items-center gap-2.5 text-[11px] text-slate-400">
        <div className="flex items-center justify-center gap-2">
          <Laptop className="w-3.5 h-3.5" />
          <span>Sincronizado na Nuvem • Celular e Computador</span>
          <Smartphone className="w-3.5 h-3.5" />
        </div>
        {onOpenSiteInfo && (
          <button
            type="button"
            onClick={onOpenSiteInfo}
            className="text-[11px] text-indigo-600 hover:text-indigo-800 font-semibold inline-flex items-center gap-1.5 transition-colors cursor-pointer"
          >
            <Info className="w-3.5 h-3.5" />
            <span>Informações do Site & Sobre o Planner</span>
          </button>
        )}
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
    <div className="min-h-[85vh] flex items-center justify-center p-4">
      {cardContent}
    </div>
  );
}
