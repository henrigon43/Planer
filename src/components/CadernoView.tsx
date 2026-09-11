import React, { useState } from 'react';
import { NotebookEntry, Task, NoteItem } from '../types';
import { formatPtDate, getTodayDateStr } from '../utils/dateUtils';
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
} from 'lucide-react';

interface CadernoViewProps {
  entries: NotebookEntry[];
  tasks: Task[];
  notes: NoteItem[];
  onProcessNote: (rawText: string) => Promise<void>;
  onToggleTaskStatus: (taskId: string) => void;
  onOpenTaskDetail: (task: Task) => void;
  onGoToSemana: () => void;
  onDeleteEntry: (entryId: string) => void;
  highlightEntryId?: string | null;
}

export const CadernoView: React.FC<CadernoViewProps> = ({
  entries,
  tasks,
  notes,
  onProcessNote,
  onToggleTaskStatus,
  onOpenTaskDetail,
  onGoToSemana,
  onDeleteEntry,
  highlightEntryId,
}) => {
  const [noteText, setNoteText] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [searchHistory, setSearchHistory] = useState('');

  const todayStr = getTodayDateStr();
  const displayTodayPt = formatPtDate(todayStr);

  const samplePrompts = [
    'Verificar pedido da Nike e mandar para o Marcelo até quarta.',
    'Pedir para o fornecedor verificar a previsão do pedido Vans. Preciso resolver isso até sexta.',
    'Segunda preciso verificar os pedidos da Puma e mandar a posição para o Fábio.',
    'Na próxima compra, lembrar de analisar melhor o giro dos bonés.',
  ];

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
              rows={4}
              value={noteText}
              onChange={(e) => setNoteText(e.target.value)}
              placeholder="Escreva livremente aqui... Ex: 'Verificar pedido da Nike e mandar para o Marcelo até quarta.'"
              className="w-full bg-transparent text-slate-800 font-sans text-base leading-relaxed placeholder:text-slate-400 border-0 focus:ring-0 resize-y p-0 outline-hidden"
              style={{
                backgroundImage: 'repeating-linear-gradient(transparent, transparent 29px, #e7e0d3 30px)',
                lineHeight: '30px',
              }}
            />
          </div>

          {/* Quick prompt suggestions chips */}
          <div>
            <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block mb-2">
              💡 Exemplos rápidos para testar o entendimento da IA:
            </span>
            <div className="flex flex-wrap gap-1.5">
              {samplePrompts.map((prompt, i) => (
                <button
                  key={i}
                  id={`sample-prompt-${i}`}
                  onClick={() => setNoteText(prompt)}
                  className="text-xs bg-white hover:bg-amber-100/70 text-slate-700 hover:text-amber-900 border border-amber-200/90 rounded-lg px-2.5 py-1 text-left transition-colors truncate max-w-full"
                  title="Clique para colar no caderno"
                >
                  "{prompt}"
                </button>
              ))}
            </div>
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
            <span className="text-3xl mb-1">📓</span>
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

                          return (
                            <div
                              key={t.id}
                              className={`p-3.5 rounded-xl border flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${
                                isDone
                                  ? 'bg-emerald-50/60 border-emerald-200'
                                  : isOver
                                  ? 'bg-rose-50/60 border-rose-200'
                                  : 'bg-indigo-50/40 border-indigo-200'
                              }`}
                            >
                              <div className="flex items-start gap-3">
                                <button
                                  id={`history-task-check-${t.id}`}
                                  onClick={() => onToggleTaskStatus(t.id)}
                                  className={`mt-0.5 w-5 h-5 rounded-md border flex items-center justify-center transition-colors ${
                                    isDone
                                      ? 'bg-emerald-600 border-emerald-600 text-white'
                                      : 'border-slate-300 hover:border-emerald-500 bg-white'
                                  }`}
                                  title={isDone ? 'Reabrir' : 'Marcar concluída'}
                                >
                                  {isDone && <CheckCircle2 className="w-3.5 h-3.5" />}
                                </button>

                                <div>
                                  <h3
                                    onClick={() => onOpenTaskDetail(t)}
                                    className={`text-sm font-bold cursor-pointer hover:text-indigo-600 ${
                                      isDone ? 'line-through text-slate-400' : 'text-slate-900'
                                    }`}
                                  >
                                    {t.title}
                                  </h3>

                                  <div className="flex flex-wrap items-center gap-2 mt-1.5 text-xs">
                                    <span className="text-slate-600 flex items-center gap-1">
                                      <Calendar className="w-3 h-3 text-slate-400" />
                                      Prazo: <strong className="text-slate-800">{t.deadlineText}</strong> ({formatPtDate(t.targetDate)})
                                    </span>

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

                              {/* Status Tag and Planner History Record */}
                              <div className="flex items-center gap-2 self-end sm:self-center">
                                <span
                                  className={`text-xs font-bold px-2.5 py-1 rounded-full ${
                                    isDone
                                      ? 'bg-emerald-100 text-emerald-800'
                                      : isOver
                                      ? 'bg-rose-100 text-rose-800'
                                      : 'bg-blue-100 text-blue-800'
                                  }`}
                                >
                                  {isDone ? '✅ Concluído' : isOver ? '🔴 Atrasado' : '🔵 Pendente'}
                                </span>

                                <button
                                  onClick={() => onOpenTaskDetail(t)}
                                  className="text-xs text-indigo-600 hover:text-indigo-800 font-semibold p-1"
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
