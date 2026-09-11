import React from 'react';
import { AppLogo } from './AppLogo';
import { UserAccount } from '../types';
import {
  X,
  ShieldCheck,
  Cloud,
  Smartphone,
  Laptop,
  CheckCircle2,
  Calendar,
  BookOpen,
  Sparkles,
  Info,
} from 'lucide-react';

interface SiteInfoModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentUser: UserAccount | null;
  cloudConnected: boolean;
}

export function SiteInfoModal({
  isOpen,
  onClose,
  currentUser,
  cloudConnected,
}: SiteInfoModalProps) {
  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto animate-fadeIn"
      onClick={onClose}
    >
      <div
        className="w-full max-w-lg bg-white rounded-3xl border border-slate-200 shadow-2xl overflow-hidden my-6"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header with decorative background */}
        <div className="bg-gradient-to-br from-slate-900 via-indigo-950 to-slate-900 text-white p-6 sm:p-8 relative">
          <button
            onClick={onClose}
            className="absolute top-4 right-4 w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition-colors cursor-pointer"
            title="Fechar informações"
          >
            <X className="w-4 h-4" />
          </button>

          <div className="flex flex-col sm:flex-row items-center sm:items-start gap-4 text-center sm:text-left">
            {/* Prominent Official Logo */}
            <div className="w-20 h-20 rounded-2xl bg-white p-3 flex items-center justify-center text-slate-900 shadow-xl shrink-0 border-2 border-white/20">
              <AppLogo className="w-full h-full text-slate-900" />
            </div>

            <div>
              <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-indigo-500/30 border border-indigo-400/30 text-indigo-200 text-[10px] font-bold uppercase tracking-wider mb-1.5">
                <Sparkles className="w-3 h-3 text-amber-300" />
                Informações Oficiais do Site
              </div>
              <h2 className="text-2xl font-black tracking-tight text-white">
                Caderno & Planner
              </h2>
              <p className="text-xs text-slate-300 mt-1 leading-relaxed">
                Planner semanal inteligente com caderno digital, extração automática de tarefas e sincronização na nuvem.
              </p>
            </div>
          </div>
        </div>

        {/* Modal Content */}
        <div className="p-6 space-y-5 text-slate-700 text-xs">
          {/* Permanent Login Status */}
          <div className="p-3.5 bg-emerald-50 border border-emerald-200 rounded-2xl flex items-start gap-3">
            <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
            <div>
              <strong className="text-emerald-900 text-xs block font-bold">
                Conexão Permanente Ativa
              </strong>
              <span className="text-emerald-800 text-[11px] leading-relaxed block mt-0.5">
                Sua sessão permanece conectada neste aparelho. Ao atualizar a página (F5) ou fechar e reabrir o navegador no celular ou computador, o aplicativo abre diretamente no seu planner sem solicitar login novamente.
              </span>
            </div>
          </div>

          {/* Cloud Synchronization Status */}
          <div className="p-3.5 bg-indigo-50/80 border border-indigo-100 rounded-2xl flex items-start gap-3">
            <Cloud className="w-5 h-5 text-indigo-600 shrink-0 mt-0.5" />
            <div>
              <div className="flex items-center gap-2">
                <strong className="text-indigo-950 text-xs font-bold">
                  Sincronização em Tempo Real (Firebase Cloud)
                </strong>
                <span
                  className={`text-[10px] px-2 py-0.5 rounded-full font-bold ${
                    cloudConnected
                      ? 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                      : 'bg-amber-100 text-amber-800 border border-amber-200'
                  }`}
                >
                  {cloudConnected ? 'Online e Conectado' : 'Aguardando Rede'}
                </span>
              </div>
              <p className="text-indigo-900 text-[11px] leading-relaxed mt-1">
                Tudo o que você digita ou atualiza no celular é refletido instantaneamente no computador e vice-versa.
              </p>
              <div className="flex items-center gap-3 mt-2 text-[10px] font-semibold text-indigo-700">
                <span className="flex items-center gap-1">
                  <Laptop className="w-3.5 h-3.5" /> Computador
                </span>
                <span>•</span>
                <span className="flex items-center gap-1">
                  <Smartphone className="w-3.5 h-3.5" /> Celular (Smartphone)
                </span>
              </div>
            </div>
          </div>

          {/* Active User Details */}
          {currentUser && (
            <div className="border border-slate-200 rounded-2xl p-3.5 bg-slate-50/70">
              <div className="text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                <ShieldCheck className="w-3.5 h-3.5 text-slate-400" />
                Dados do Usuário Conectado
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-sm font-bold text-slate-900">
                    {currentUser.name}
                  </div>
                  <div className="text-xs font-mono text-slate-500">
                    @{currentUser.username}
                  </div>
                </div>
                <div className="text-right">
                  <span
                    className={`inline-block text-[10px] font-bold px-2 py-0.5 rounded-md ${
                      currentUser.role === 'admin' || currentUser.username === 'henrique'
                        ? 'bg-amber-100 text-amber-900 border border-amber-300'
                        : 'bg-slate-200 text-slate-700'
                    }`}
                  >
                    {currentUser.role === 'admin' || currentUser.username === 'henrique'
                      ? 'Administrador'
                      : 'Usuário Individual'}
                  </span>
                  <div className="text-[10px] text-slate-400 mt-0.5">
                    Ambiente privativo e isolado
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* App Structure Guide */}
          <div className="space-y-1.5 pt-1">
            <div className="text-[11px] font-bold text-slate-600 uppercase tracking-wider">
              Módulos do Sistema:
            </div>
            <div className="grid grid-cols-2 gap-2 text-[11px]">
              <div className="p-2.5 rounded-xl border border-slate-200/80 bg-white">
                <span className="font-bold text-slate-900 block">1. Semana</span>
                <span className="text-slate-500 text-[10px] block">
                  Visão dos 7 dias com tarefas e prioridades diárias.
                </span>
              </div>
              <div className="p-2.5 rounded-xl border border-slate-200/80 bg-white">
                <span className="font-bold text-slate-900 block">2. Caderno</span>
                <span className="text-slate-500 text-[10px] block">
                  Escrita livre com IA que extrai tarefas e datas.
                </span>
              </div>
              <div className="p-2.5 rounded-xl border border-slate-200/80 bg-white">
                <span className="font-bold text-slate-900 block">3. Anotações</span>
                <span className="text-slate-500 text-[10px] block">
                  Banco de notas permanentes e registros de ideias.
                </span>
              </div>
              <div className="p-2.5 rounded-xl border border-slate-200/80 bg-white">
                <span className="font-bold text-slate-900 block">4. Tarefas</span>
                <span className="text-slate-500 text-[10px] block">
                  Controle de pendências, prazos e histórico.
                </span>
              </div>
            </div>
          </div>

          <div className="pt-2 border-t border-slate-100 flex items-center justify-between">
            <span className="text-[10px] text-slate-400">
              Caderno & Planner • Versão 2.1
            </span>
            <button
              onClick={onClose}
              className="py-2 px-4 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs transition-colors cursor-pointer"
            >
              Fechar
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
