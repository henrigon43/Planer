import React, { useState } from 'react';
import { NotebookEntry, Task, NoteItem, TaskStatus } from '../types';
import { formatPtDate, getTodayDateStr } from '../utils/dateUtils';
import { AppLogo } from './AppLogo';
import {
  BookOpen,
  Sparkles,
  Calendar,
  User,
  Tag,
  CheckCircle2,
  Clock,
  ArrowRight,
  History,
  Send,
  Loader2,
  Trash2,
  Info,
  HelpCircle,
  PenLine,
  Check,
  X,
} from 'lucide-react';

interface CadernoViewProps {
  entries: NotebookEntry[];
  tasks: Task[];
  notes: NoteItem[];
  onProcessNote: (rawText: string) => Promise<void>;
  onToggleTaskStatus: (taskId: string) => void;
  onSetTaskStatus?: (taskId: string, status: TaskStatus) => void;
  onOpenTaskDetail: (task: Task) => void;
  onGoToSemana: () => void;
  onDeleteEntry: (entryId: string) => void;
  highlightEntryId?: string | null;
  onUpdateEntryText?: (entryId: string, newText: string) => Promise<void>;
  onUpdateTaskTitle?: (taskId: string, newTitle: string) => void;
  onRescheduleTask?: (taskId: string, newDate: string) => void;
}

export const CadernoView: React.FC<CadernoViewProps> = ({
  entries,
  tasks,
  notes,
  onProcessNote,
  onToggleTaskStatus,
  onSetTaskStatus,
  onOpenTaskDetail,
  onGoToSemana,
  onDeleteEntry,
  highlightEntryId,
  onUpdateEntryText,
  onUpdateTaskTitle,
  onRescheduleTask,
}) => {
  const [noteText, setNoteText] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [searchHistory, setSearchHistory] = useState('');

  // Inline task editing in Caderno history
  const [editingTaskId, setEditingTaskId] = useState<string | null>(null);
  const [editingTaskTitle, setEditingTaskTitle] = useState('');

  const todayStr = getTodayDateStr();
  const displayTodayPt = formatPtDate(todayStr);

  const handleStartEditTask = (task: Task) => {
    setEditingTaskId(task.id);
    setEditingTaskTitle(task.title);
  };

  const handleSaveTaskTitle = (taskId: string) => {
    if (editingTaskTitle.trim() && onUpdateTaskTitle) {
      onUpdateTaskTitle(taskId, editingTaskTitle.trim());
    }
    setEditingTaskId(null);
    setEditingTaskTitle('');
  };

  const handleProcess = async () => {
    if (!noteText.trim() || isProcessing) return;
    setIsProcessing(true);
    try {
      await onProcessNote(noteText.trim());
      setNoteText('');
    } finally {
      setIsProcessing(false);
    }
  };

  const filteredEntries = entries.filter((e) => {
    if (!searchHistory.trim()) return true;
    return (
      e.rawText.toLowerCase().includes(searchHistory.toLowerCase()) ||
      e.displayDate.includes(searchHistory)
    );
  });

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      {/* Header Info */}
      <div className="bg-white p-5 md:p-6 rounded-2xl border border-slate-200 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-xl">📓</span>
            <h1 className="text-xl md:text-2xl font-black text-slate-900 tracking-tight">
              Caderno Digital Inteligente
            </h1>
          </div>
          <p className="text-xs md:text-sm text-slate-500 mt-1">
            Escreva normalmente sem formulários. O sistema preserva sua anotação e cria as tarefas e prazos automaticamente.
          </p>
        </div>

        <button
          onClick={onGoToSemana}
          className="inline-flex items-center gap-2 px-4 py-2 text-xs font-semibold text-indigo-700 bg-indigo-50 hover:bg-indigo-100 rounded-xl transition-colors self-start md:self-auto"
        >
          <span>Ver na Minha Semana</span>
          <ArrowRight className="w-4 h-4" />
        </button>
      </div>

      {/* Modern Notebook Sheet */}
      <div
        id="notebook-sheet"
        className="bg-[#faf8f5] rounded-2xl border-2 border-amber-200/80 shadow-md overflow-hidden relative"
      >
        {/* Notebook top binding bar */}
        <div className="bg-amber-100/70 border-b border-amber-200 px-6 py-3 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-amber-400"></span>
            <span className="text-xs font-bold text-amber-900 uppercase tracking-wider font-mono">
              Página de Hoje: {displayTodayPt}
            </span>
          </div>
          <span className="text-xs text-amber-800/80 font-serif italic hidden sm:inline">
            "Eu escrevo como em um caderno. O Planner transforma em organização."
          </span>
        </div>

        {/* Notebook Writing Area */}
        <div className="p-6 space-y-4">
          <div className="relative">
            <textarea
              id="notebook-textarea"
              rows={7}
              value={noteText}
              onChange={(e) => setNoteText(e.target.value)}
              placeholder="Escreva livremente aqui o que precisa ser feito... Ex: 'Verificar pedido da Nike e mandar para o Marcelo até quarta.'"
              className="w-full bg-transparent text-slate-800 font-sans text-base leading-relaxed placeholder:text-slate-400 border-0 focus:ring-0 resize-y p-0 outline-hidden"
              style={{
                backgroundImage: 'repeating-linear-gradient(transparent, transparent 29px, #e7e0d3 30px)',
                lineHeight: '30px',
              }}
            />
          </div>

          {/* Action Row */}
          <div className="flex items-center justify-between pt-4 border-t border-amber-200/60">
            <span className="text-xs text-slate-500">
              {noteText.length} caracteres
            </span>

            <button
              id="process-note-btn"
              onClick={handleProcess}
              disabled={!noteText.trim() || isProcessing}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-amber-600 to-indigo-600 hover:from-amber-700 hover:to-indigo-700 disabled:opacity-50 text-white font-semibold text-xs md:text-sm shadow-md transition-all cursor-pointer disabled:cursor-not-allowed"
            >
              {isProcessing ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>A IA está organizando...</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4" />
                  <span>Registrar no Caderno & Organizar</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Historical Timeline in the Caderno ("O caderno deve ser histórico") */}
      <div className="space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <History className="w-5 h-5 text-indigo-600" />
            <h2 className="text-lg font-bold text-slate-900">
              Histórico do Caderno
            </h2>
            <span className="text-xs bg-slate-200 text-slate-700 font-bold px-2 py-0.5 rounded-full">
              {entries.length} registros
            </span>
          </div>

          {/* Search history */}
          <input
            id="search-notebook-history"
            type="text"
            placeholder="Buscar no histórico do caderno..."
            value={searchHistory}
            onChange={(e) => setSearchHistory(e.target.value)}
            className="text-xs px-3 py-1.5 bg-white border border-slate-200 rounded-lg text-slate-700 w-full sm:w-64 focus:outline-hidden focus:ring-1 focus:ring-indigo-500"
          />
        </div>

        {filteredEntries.length === 0 ? (
          <div className="bg-white rounded-2xl p-10 text-center border border-dashed border-slate-200 text-slate-400 text-sm flex flex-col items-center justify-center gap-2">
            <AppLogo className="w-12 h-12 text-slate-400 mb-1" />
            <p className="font-semibold text-slate-700">Seu caderno está pronto e em branco!</p>
            <p className="text-xs text-slate-400 max-w-md">
              Escreva qualquer anotação, compromisso ou pedido no campo acima. O sistema vai extrair automaticamente tarefas, prazos, pessoas e organizar na sua semana.
            </p>
          </div>
        ) : (
          <div className="space-y-5">
            {filteredEntries.map((entry) => {
              // Find matching tasks from global state to get current status!
              const linkedTasks = tasks.filter((t) => t.originalNoteId === entry.id);
              const linkedNotes = notes.filter((n) => n.originalNotebookEntryId === entry.id);
              const isHighlighted = highlightEntryId === entry.id;

              return (
                <div
                  key={entry.id}
                  id={`notebook-entry-${entry.id}`}
                  className={`bg-white rounded-2xl border transition-all p-5 md:p-6 shadow-xs ${
                    isHighlighted
                      ? 'border-indigo-500 ring-2 ring-indigo-200'
                      : 'border-slate-200'
                  }`}
                >
                  {/* Entry Header with Date */}
                  <div className="flex items-center justify-between border-b border-slate-100 pb-3 mb-3">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold text-indigo-900 bg-indigo-50 px-2.5 py-1 rounded-md">
                        📅 {entry.displayDate}
                      </span>
                      <span className="text-xs text-slate-400">
                        Anotação registrada
                      </span>
                    </div>

                    <button
                      id={`delete-entry-${entry.id}`}
                      onClick={() => onDeleteEntry(entry.id)}
                      className="text-slate-300 hover:text-rose-500 p-1 rounded transition-colors"
                      title="Excluir anotação e suas tarefas"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>

                  {/* Original text intact ("Mas não deve apagar nem alterar sua anotação original. Ela continua no caderno.") */}
                  <div className="mb-4">
                    <p className="text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1">
                      Texto Original no Caderno:
                    </p>
                    <blockquote className="text-slate-800 font-serif text-sm md:text-base italic bg-amber-50/50 p-3 rounded-xl border-l-3 border-amber-400">
                      "{entry.rawText}"
                    </blockquote>
                  </div>

                  {/* Automatic Task Created Below It ("Por baixo dela, o sistema cria: Tarefa criada automaticamente") */}
                  {linkedTasks.length > 0 && (
                    <div className="mt-4 pt-3 border-t border-slate-100">
                      <p className="text-xs font-bold text-slate-600 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                        <Sparkles className="w-3.5 h-3.5 text-indigo-600" />
                        Tarefa criada automaticamente:
                      </p>

                      <div className="space-y-2">
                        {linkedTasks.map((t) => {
                          const isDone = t.status === 'concluido';
                          const isOver = t.status === 'atrasado';

                          const isEditingThis = editingTaskId === t.id;

                          return (
                            <div
                              key={t.id}
                              className={`p-3.5 rounded-xl border flex flex-col sm:flex-row sm:items-center justify-between gap-3 transition-all ${
                                isDone
                                  ? 'bg-emerald-50/60 border-emerald-200'
                                  : isOver
                                  ? 'bg-rose-50/60 border-rose-200'
                                  : 'bg-indigo-50/40 border-indigo-200'
                              }`}
                            >
                              <div className="flex items-start gap-3 flex-1 min-w-0">
                                <button
                                  id={`history-task-check-${t.id}`}
                                  onClick={() => {
                                    if (onSetTaskStatus) {
                                      onSetTaskStatus(t.id, isDone ? 'pendente' : 'concluido');
                                    } else {
                                      onToggleTaskStatus(t.id);
                                    }
                                  }}
                                  className={`mt-0.5 w-5 h-5 rounded-md border flex items-center justify-center transition-colors shrink-0 cursor-pointer ${
                                    isDone
                                      ? 'bg-emerald-600 border-emerald-600 text-white'
                                      : 'border-slate-300 hover:border-emerald-500 bg-white'
                                  }`}
                                  title={isDone ? 'Marcar como Pendente' : 'Marcar como Concluído'}
                                >
                                  {isDone && <CheckCircle2 className="w-3.5 h-3.5" />}
                                </button>

                                <div className="flex-1 min-w-0">
                                  {isEditingThis ? (
                                    <div className="flex items-center gap-2 mb-1.5">
                                      <input
                                        type="text"
                                        autoFocus
                                        value={editingTaskTitle}
                                        onChange={(e) => setEditingTaskTitle(e.target.value)}
                                        onKeyDown={(e) => {
                                          if (e.key === 'Enter') handleSaveTaskTitle(t.id);
                                          if (e.key === 'Escape') setEditingTaskId(null);
                                        }}
                                        className="flex-1 text-sm font-bold p-1.5 border-2 border-indigo-400 rounded-lg bg-white text-slate-900 focus:outline-hidden"
                                        placeholder="Editar título da tarefa..."
                                      />
                                      <button
                                        type="button"
                                        onClick={() => handleSaveTaskTitle(t.id)}
                                        className="p-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-bold flex items-center gap-1 cursor-pointer shrink-0"
                                        title="Salvar alteração"
                                      >
                                        <Check className="w-3.5 h-3.5" />
                                        <span>Salvar</span>
                                      </button>
                                      <button
                                        type="button"
                                        onClick={() => setEditingTaskId(null)}
                                        className="p-1.5 bg-slate-200 hover:bg-slate-300 text-slate-700 rounded-lg text-xs cursor-pointer shrink-0"
                                        title="Cancelar"
                                      >
                                        <X className="w-3.5 h-3.5" />
                                      </button>
                                    </div>
                                  ) : (
                                    <div className="flex items-center gap-2">
                                      <h3
                                        onClick={() => onOpenTaskDetail(t)}
                                        className={`text-sm font-bold cursor-pointer hover:text-indigo-600 truncate ${
                                          isDone ? 'line-through text-slate-400' : 'text-slate-900'
                                        }`}
                                        title="Clique para ver detalhes"
                                      >
                                        {t.title}
                                      </h3>
                                      <button
                                        type="button"
                                        onClick={() => handleStartEditTask(t)}
                                        className="p-1 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded transition-colors shrink-0 cursor-pointer"
                                        title="Editar texto da tarefa"
                                      >
                                        <PenLine className="w-3.5 h-3.5" />
                                      </button>
                                    </div>
                                  )}

                                  <div className="flex flex-wrap items-center gap-2 mt-1.5 text-xs">
                                    <span className="text-slate-600 flex items-center gap-1">
                                      <Calendar className="w-3 h-3 text-slate-400" />
                                      Prazo: <strong className="text-slate-800">{t.deadlineText}</strong> ({formatPtDate(t.targetDate)})
                                    </span>

                                    {onRescheduleTask && (
                                      <input
                                        type="date"
                                        defaultValue={t.targetDate}
                                        onChange={(e) => {
                                          if (e.target.value) {
                                            onRescheduleTask(t.id, e.target.value);
                                          }
                                        }}
                                        className="text-[11px] py-0.5 px-1.5 border border-slate-200 rounded bg-white text-slate-700 hover:border-indigo-300 cursor-pointer"
                                        title="Mudar data da tarefa"
                                      />
                                    )}

                                    {t.person && (
                                      <span className="text-slate-600 flex items-center gap-1">
                                        <User className="w-3 h-3 text-slate-400" />
                                        Pessoa: <strong className="text-slate-800">{t.person}</strong>
                                      </span>
                                    )}

                                    <span className="text-slate-600 flex items-center gap-1">
                                      <Tag className="w-3 h-3 text-slate-400" />
                                      Categoria: <strong className="text-slate-800">{t.category}</strong>
                                    </span>
                                  </div>
                                </div>
                              </div>

                              {/* Status Pills / Selector & Details */}
                              <div className="flex flex-wrap items-center gap-1.5 self-end sm:self-center shrink-0">
                                <button
                                  type="button"
                                  onClick={() => {
                                    if (onSetTaskStatus) onSetTaskStatus(t.id, 'pendente');
                                    else if (isDone) onToggleTaskStatus(t.id);
                                  }}
                                  className={`text-[11px] font-bold px-2 py-1 rounded-lg border transition-all cursor-pointer ${
                                    t.status === 'pendente'
                                      ? 'bg-amber-500 text-white border-amber-600 shadow-2xs'
                                      : 'bg-white text-slate-600 border-slate-200 hover:bg-amber-50 hover:text-amber-900'
                                  }`}
                                  title="Marcar como Pendente"
                                >
                                  🟡 Pendente
                                </button>

                                <button
                                  type="button"
                                  onClick={() => {
                                    if (onSetTaskStatus) onSetTaskStatus(t.id, 'concluido');
                                    else if (!isDone) onToggleTaskStatus(t.id);
                                  }}
                                  className={`text-[11px] font-bold px-2 py-1 rounded-lg border transition-all cursor-pointer ${
                                    t.status === 'concluido'
                                      ? 'bg-emerald-600 text-white border-emerald-700 shadow-2xs'
                                      : 'bg-white text-slate-600 border-slate-200 hover:bg-emerald-50 hover:text-emerald-900'
                                  }`}
                                  title="Marcar como Concluído"
                                >
                                  ✅ Concluído
                                </button>

                                <button
                                  type="button"
                                  onClick={() => {
                                    if (onSetTaskStatus) onSetTaskStatus(t.id, 'atrasado');
                                  }}
                                  className={`text-[11px] font-bold px-2 py-1 rounded-lg border transition-all cursor-pointer ${
                                    t.status === 'atrasado'
                                      ? 'bg-rose-600 text-white border-rose-700 shadow-2xs'
                                      : 'bg-white text-slate-600 border-slate-200 hover:bg-rose-50 hover:text-rose-900'
                                  }`}
                                  title="Marcar como Atrasado"
                                >
                                  🔴 Atrasado
                                </button>

                                <button
                                  onClick={() => onOpenTaskDetail(t)}
                                  className="text-xs text-indigo-600 hover:text-indigo-800 font-bold px-2 py-1 hover:bg-indigo-50 rounded-lg transition-colors cursor-pointer"
                                >
                                  Detalhes
                                </button>
                              </div>
                            </div>
                          );
                        })}
                      </div>

                      {/* Planner completion log message as described in prompt:
                          "11/09 — Verificar pedido Nike — CONCLUÍDO" */}
                      {linkedTasks.some((t) => t.status === 'concluido') && (
                        <div className="mt-2 text-xs text-emerald-800 font-mono bg-emerald-50/70 p-2 rounded-lg border border-emerald-100 flex items-center gap-1.5">
                          <span>✅ Registro no Planner:</span>
                          <span>
                            {linkedTasks
                              .filter((t) => t.status === 'concluido')
                              .map((t) => `${entry.displayDate} — ${t.title} — CONCLUÍDO`)
                              .join(' | ')}
                          </span>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Non-task notes identified */}
                  {linkedNotes.length > 0 && (
                    <div className="mt-4 pt-3 border-t border-slate-100">
                      <p className="text-xs font-bold text-slate-600 uppercase tracking-wider mb-2">
                        Anotações arquivadas deste texto:
                      </p>
                      <div className="space-y-1.5">
                        {linkedNotes.map((note) => (
                          <div
                            key={note.id}
                            className="bg-amber-50/60 p-2.5 rounded-lg border border-amber-200 text-xs text-slate-700"
                          >
                            <span className="font-semibold text-amber-900">
                              {note.type === 'ideia' ? '💡 Ideia: ' : '📝 '}
                              {note.title}
                            </span>
                            <p className="mt-0.5">{note.content}</p>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Clarification prompt if any */}
                  {entry.clarificationQuestion && (
                    <div className="mt-3 p-2.5 bg-sky-50 border border-sky-200 rounded-lg text-xs text-sky-900 flex items-center gap-2">
                      <HelpCircle className="w-4 h-4 text-sky-600" />
                      <span>{entry.clarificationQuestion}</span>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};
