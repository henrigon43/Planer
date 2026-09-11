import React, { useState } from 'react';
import { UserAccount } from '../types';
import {
  Users,
  UserPlus,
  ShieldCheck,
  Key,
  UserCheck,
  Trash2,
  Lock,
  Check,
  Copy,
  AlertCircle,
  Sparkles,
  Laptop,
} from 'lucide-react';

interface UsuariosViewProps {
  currentUser: UserAccount;
  allUsers: UserAccount[];
  onCreateUser: (newUser: Omit<UserAccount, 'id' | 'createdAt' | 'createdBy'>) => Promise<boolean>;
  onDeleteUser: (userId: string) => void;
  onUpdatePassword: (userId: string, newPass: string) => void;
}

export function UsuariosView({
  currentUser,
  allUsers,
  onCreateUser,
  onDeleteUser,
  onUpdatePassword,
}: UsuariosViewProps) {
  const [name, setName] = useState('');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState<'user' | 'admin'>('user');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // Edit password modal/input
  const [editingUserId, setEditingUserId] = useState<string | null>(null);
  const [newPasswordInput, setNewPasswordInput] = useState('');

  if (currentUser.role !== 'admin' && currentUser.username !== 'henrique') {
    return (
      <div className="max-w-2xl mx-auto p-8 text-center bg-white rounded-2xl border border-rose-200 shadow-sm mt-8">
        <AlertCircle className="w-12 h-12 text-rose-500 mx-auto mb-3" />
        <h2 className="text-xl font-bold text-slate-900">Acesso Restrito</h2>
        <p className="text-sm text-slate-600 mt-2">
          Apenas o administrador <strong>Henrique</strong> tem permissão para cadastrar e gerenciar logins.
        </p>
      </div>
    );
  }

  const handleSubmitNewUser = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setSuccessMsg(null);

    const cleanUsername = username.trim().toLowerCase();
    const cleanName = name.trim();
    const cleanPassword = password.trim();

    if (!cleanUsername || !cleanName || !cleanPassword) {
      setErrorMsg('Por favor, preencha todos os campos.');
      return;
    }

    if (cleanUsername.length < 3) {
      setErrorMsg('O nome de usuário deve ter pelo menos 3 caracteres.');
      return;
    }

    // Check if username already exists
    const exists = allUsers.some(
      (u) => u.username.toLowerCase() === cleanUsername
    );
    if (exists) {
      setErrorMsg(`O usuário "${cleanUsername}" já existe. Escolha outro nome de login.`);
      return;
    }

    const success = await onCreateUser({
      name: cleanName,
      username: cleanUsername,
      password: cleanPassword,
      role,
    });

    if (success) {
      setSuccessMsg(`Usuário "${cleanName}" cadastrado com sucesso! Ele já pode acessar no celular ou PC.`);
      setName('');
      setUsername('');
      setPassword('');
      setRole('user');
      setTimeout(() => setSuccessMsg(null), 5000);
    }
  };

  const handleCopyCredentials = (u: UserAccount) => {
    const text = `Acesso ao Caderno & Planner:\nLogin: ${u.username}\nSenha: ${u.password}\nCada usuário vê exclusivamente seu próprio planner privativo.`;
    navigator.clipboard?.writeText(text);
    setCopiedId(u.id);
    setTimeout(() => setCopiedId(null), 3000);
  };

  return (
    <div className="max-w-5xl mx-auto space-y-8 animate-fadeIn">
      {/* Top Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white rounded-2xl p-6 sm:p-8 shadow-sm border border-slate-800">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3.5">
            <div className="w-12 h-12 rounded-xl bg-indigo-600/80 border border-indigo-400/40 flex items-center justify-center text-white text-2xl shadow-inner">
              <ShieldCheck className="w-7 h-7 text-indigo-200" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl sm:text-2xl font-black tracking-tight">
                  Painel de Administração de Usuários
                </h1>
                <span className="bg-amber-400/20 text-amber-300 border border-amber-400/40 text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full">
                  Exclusivo Henrique
                </span>
              </div>
              <p className="text-xs sm:text-sm text-slate-300 mt-1 max-w-2xl">
                Como administrador, você é o único que cria novos acessos. Cada pessoa cadastrada
                terá seu <strong>planner 100% individual e privativo</strong>, sincronizado entre celular e PC.
              </p>
            </div>
          </div>

          <div className="bg-white/10 backdrop-blur-xs px-4 py-2.5 rounded-xl border border-white/10 text-xs">
            <div className="text-slate-300">Total de Usuários</div>
            <div className="text-xl font-bold text-white flex items-center gap-1.5 mt-0.5">
              <Users className="w-4 h-4 text-indigo-400" />
              <span>{allUsers.length} contas ativas</span>
            </div>
          </div>
        </div>
      </div>

      {/* Main Grid: Create form + User list */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Column: Form to create new user (5 cols) */}
        <div className="lg:col-span-5 bg-white rounded-2xl border border-slate-200 shadow-xs p-6">
          <div className="flex items-center gap-2 mb-4 pb-3 border-b border-slate-100">
            <div className="w-8 h-8 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center">
              <UserPlus className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900">Cadastrar Novo Usuário</h2>
              <p className="text-xs text-slate-500">Crie um login para um membro da equipe</p>
            </div>
          </div>

          {errorMsg && (
            <div className="mb-4 p-3 bg-rose-50 border border-rose-200 text-rose-700 text-xs rounded-xl flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          {successMsg && (
            <div className="mb-4 p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs rounded-xl flex items-center gap-2">
              <Check className="w-4 h-4 shrink-0" />
              <span>{successMsg}</span>
            </div>
          )}

          <form onSubmit={handleSubmitNewUser} className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Nome Completo da Pessoa:
              </label>
              <input
                id="input-new-user-name"
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Ex: Ana Clara, Dr. Roberto, Lucas"
                className="w-full text-xs sm:text-sm px-3.5 py-2.5 rounded-xl border border-slate-200 focus:outline-hidden focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all bg-slate-50/50"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Nome de Usuário (Login):
              </label>
              <div className="relative">
                <input
                  id="input-new-user-username"
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value.toLowerCase().replace(/\s+/g, ''))}
                  placeholder="Ex: anaclara, roberto, lucas"
                  className="w-full text-xs sm:text-sm pl-8 pr-3 py-2.5 rounded-xl border border-slate-200 focus:outline-hidden focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all bg-slate-50/50"
                  required
                />
                <span className="absolute left-3 top-3 text-slate-400 text-xs font-semibold">@</span>
              </div>
              <span className="text-[11px] text-slate-400 mt-1 block">
                Será digitado na tela de login (sem espaços).
              </span>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Senha Provisória ou Definitiva:
              </label>
              <div className="relative">
                <input
                  id="input-new-user-password"
                  type="text"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Ex: 1234 ou senha segura"
                  className="w-full text-xs sm:text-sm pl-8 pr-3 py-2.5 rounded-xl border border-slate-200 focus:outline-hidden focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all bg-slate-50/50"
                  required
                />
                <Key className="w-3.5 h-3.5 absolute left-3 top-3.5 text-slate-400" />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Perfil de Acesso:
              </label>
              <div className="grid grid-cols-2 gap-2 text-xs">
                <button
                  type="button"
                  onClick={() => setRole('user')}
                  className={`py-2 px-3 rounded-xl font-semibold border text-left flex items-center gap-2 transition-all ${
                    role === 'user'
                      ? 'border-indigo-600 bg-indigo-50/70 text-indigo-900 shadow-xs'
                      : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                  }`}
                >
                  <UserCheck className="w-3.5 h-3.5 text-indigo-600" />
                  <span>Usuário Padrão</span>
                </button>

                <button
                  type="button"
                  onClick={() => setRole('admin')}
                  className={`py-2 px-3 rounded-xl font-semibold border text-left flex items-center gap-2 transition-all ${
                    role === 'admin'
                      ? 'border-indigo-600 bg-indigo-50/70 text-indigo-900 shadow-xs'
                      : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                  }`}
                >
                  <ShieldCheck className="w-3.5 h-3.5 text-indigo-600" />
                  <span>Administrador</span>
                </button>
              </div>
              <span className="text-[11px] text-slate-400 mt-1 block">
                {role === 'user'
                  ? 'Vê exclusivamente suas próprias tarefas e caderno.'
                  : 'Pode também cadastrar outros usuários.'}
              </span>
            </div>

            <button
              id="btn-submit-create-user"
              type="submit"
              className="w-full py-2.5 px-4 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs sm:text-sm flex items-center justify-center gap-2 shadow-xs transition-colors mt-4 cursor-pointer"
            >
              <UserPlus className="w-4 h-4" />
              <span>Criar Conta de Acesso</span>
            </button>
          </form>

          <div className="mt-5 pt-4 border-t border-slate-100 flex items-center gap-2 text-[11px] text-slate-500">
            <Laptop className="w-4 h-4 text-indigo-500 shrink-0" />
            <span>
              Ao criar, a conta fica disponível imediatamente para entrar pelo celular ou computador.
            </span>
          </div>
        </div>

        {/* Right Column: User list (7 cols) */}
        <div className="lg:col-span-7 space-y-4">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-6">
            <div className="flex items-center justify-between mb-4 pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center">
                  <Users className="w-4 h-4" />
                </div>
                <div>
                  <h2 className="text-base font-bold text-slate-900">Usuários Cadastrados</h2>
                  <p className="text-xs text-slate-500">Contas com acesso ao sistema</p>
                </div>
              </div>
              <span className="text-xs font-bold text-indigo-600 bg-indigo-50 px-2.5 py-1 rounded-full">
                {allUsers.length} cadastrados
              </span>
            </div>

            <div className="space-y-3">
              {allUsers.map((user) => {
                const isAdmin = user.role === 'admin' || user.username === 'henrique';
                const isHenrique = user.username === 'henrique';

                return (
                  <div
                    key={user.id}
                    id={`user-row-${user.username}`}
                    className={`p-4 rounded-xl border transition-all ${
                      isHenrique
                        ? 'border-indigo-200 bg-indigo-50/40'
                        : 'border-slate-200 bg-white hover:border-slate-300'
                    }`}
                  >
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                      <div className="flex items-center gap-3">
                        <div
                          className={`w-10 h-10 rounded-xl flex items-center justify-center font-bold text-sm shadow-xs ${
                            isAdmin
                              ? 'bg-indigo-600 text-white'
                              : 'bg-slate-100 text-slate-700 border border-slate-200'
                          }`}
                        >
                          {user.name.charAt(0).toUpperCase()}
                        </div>

                        <div>
                          <div className="flex items-center gap-2">
                            <span className="text-sm font-bold text-slate-900">{user.name}</span>
                            {isAdmin && (
                              <span className="text-[10px] font-bold uppercase bg-amber-100 text-amber-800 px-2 py-0.5 rounded-md border border-amber-200 flex items-center gap-1">
                                <ShieldCheck className="w-3 h-3" /> Admin
                              </span>
                            )}
                            {isHenrique && (
                              <span className="text-[10px] font-bold text-indigo-700 bg-indigo-100 px-1.5 py-0.2 rounded">
                                Você
                              </span>
                            )}
                          </div>

                          <div className="flex items-center gap-3 text-xs text-slate-500 mt-0.5">
                            <span className="font-mono text-slate-700 font-medium">
                              Login: @{user.username}
                            </span>
                            <span>•</span>
                            <span className="font-mono text-slate-600">
                              Senha: {user.password}
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* Action buttons */}
                      <div className="flex items-center gap-1.5 self-end sm:self-auto">
                        <button
                          id={`btn-copy-${user.username}`}
                          onClick={() => handleCopyCredentials(user)}
                          className="px-2.5 py-1.5 text-xs font-semibold rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 flex items-center gap-1 transition-colors"
                          title="Copiar dados de login"
                        >
                          {copiedId === user.id ? (
                            <>
                              <Check className="w-3 h-3 text-emerald-600" />
                              <span className="text-emerald-700">Copiado!</span>
                            </>
                          ) : (
                            <>
                              <Copy className="w-3 h-3" />
                              <span>Copiar</span>
                            </>
                          )}
                        </button>

                        <button
                          onClick={() => {
                            if (editingUserId === user.id) {
                              setEditingUserId(null);
                            } else {
                              setEditingUserId(user.id);
                              setNewPasswordInput(user.password);
                            }
                          }}
                          className="px-2.5 py-1.5 text-xs font-semibold rounded-lg border border-slate-200 hover:bg-slate-50 text-slate-700 flex items-center gap-1 transition-colors"
                          title="Alterar senha"
                        >
                          <Lock className="w-3 h-3" />
                          <span>Mudar Senha</span>
                        </button>

                        {!isHenrique && (
                          <button
                            id={`btn-delete-${user.username}`}
                            onClick={() => {
                              if (
                                window.confirm(
                                  `Tem certeza que deseja remover o acesso de "${user.name}" (@${user.username})?`
                                )
                              ) {
                                onDeleteUser(user.id);
                              }
                            }}
                            className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                            title="Excluir usuário"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    </div>

                    {/* Inline password edit form */}
                    {editingUserId === user.id && (
                      <div className="mt-3 pt-3 border-t border-slate-100 flex items-center gap-2 bg-slate-50 p-2.5 rounded-lg">
                        <span className="text-xs font-bold text-slate-700">Nova Senha:</span>
                        <input
                          type="text"
                          value={newPasswordInput}
                          onChange={(e) => setNewPasswordInput(e.target.value)}
                          className="text-xs px-2 py-1 border border-slate-300 rounded-md bg-white focus:outline-hidden focus:ring-1 focus:ring-indigo-500"
                          placeholder="Digite nova senha"
                        />
                        <button
                          onClick={() => {
                            if (newPasswordInput.trim()) {
                              onUpdatePassword(user.id, newPasswordInput.trim());
                              setEditingUserId(null);
                            }
                          }}
                          className="text-xs px-2.5 py-1 bg-indigo-600 text-white rounded-md font-semibold hover:bg-indigo-700"
                        >
                          Salvar
                        </button>
                        <button
                          onClick={() => setEditingUserId(null)}
                          className="text-xs px-2 py-1 text-slate-500 hover:text-slate-700"
                        >
                          Cancelar
                        </button>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Tips card */}
          <div className="bg-amber-50/70 border border-amber-200/80 rounded-2xl p-4.5 text-xs text-amber-900 flex items-start gap-3">
            <Sparkles className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
            <div>
              <p className="font-bold">Como funciona a privacidade de cada pessoa?</p>
              <p className="text-amber-800 mt-0.5 leading-relaxed">
                Cada usuário tem um espaço 100% isolado. Quando <strong>Henrique</strong> acessa, ele vê suas próprias tarefas e anotações. Quando outro usuário (ex: <strong>João</strong>) acessa, o sistema carrega apenas as tarefas e caderno de João.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
