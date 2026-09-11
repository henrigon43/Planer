import React, { useState, useEffect } from 'react';
import { Task } from '../types';
import { formatPtDate, getWeekdayName, getRelativeDayOffset } from '../utils/dateUtils';
import {
  X,
  CheckCircle2,
  Calendar,
  User,
  Tag,
  BookOpen,
  Clock,
  ArrowRight,
  AlertCircle,
  RotateCcw,
  Trash2,
  PenLine,
  Check,
} from 'lucide-react';

interface TaskDetailModalProps {
  task: Task | null;
  onClose: () => void;
  onToggleStatus: (taskId: string) => void;
  onMoveToToday: (taskId: string) => void;
  onReschedule: (taskId: string, newDate: string) => void;
  onDeleteTask: (taskId: string) => void;
  onOpenNotebookEntry?: (entryId: string) => void;
  onUpdateTitle?: (taskId: string, newTitle: string) => void;
}

export const TaskDetailModal: React.FC<TaskDetailModalProps> = ({
  task,
  onClose,
  onToggleStatus,
  onMoveToToday,
  onReschedule,
  onDeleteTask,
  onOpenNotebookEntry,
  onUpdateTitle,
}) => {
  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const [editTitleText, setEditTitleText] = useState('');

  useEffect(() => {
    if (task) {
      setEditTitleText(task.title);
      setIsEditingTitle(false);
    }
  }, [task]);

  if (!task) return null;

  const isDone = task.status === 'concluido';
  const isOverdue = task.status === 'atrasado';

  const handleSaveTitle = (e: React.FormEvent) => {
    e.preventDefault();
    if (editTitleText.trim() && onUpdateTitle) {
      onUpdateTitle(task.id, editTitleText.trim());
    }
    setIsEditingTitle(false);
  };

  return (
    <div
      id="task-detail-modal-backdrop"
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-xs p-4"
      onClick={onClose}
    >
      <div
        id="task-detail-modal-content"
        className="relative w-full max-w-lg bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[90vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="p-5 border-b border-slate-100 flex items-start justify-between bg-slate-50/70">
          <div className="flex items-center gap-2">
            <span
              className={`inline-flex items-center gap-1 text-xs font-semibold px-2.5 py-1 rounded-full ${
                isDone
                  ? 'bg-emerald-100 text-emerald-800'
                  : isOverdue
                  ? 'bg-rose-100 text-rose-800'
                  : 'bg-amber-100 text-amber-800'
              }`}
            >
              {isDone ? '✅ Concluído' : isOverdue ? '🔴 Atrasado' : '🟡 Pendente'}
            </span>
            <span className="text-xs text-slate-500 font-medium px-2 py-0.5 rounded bg-slate-200/70">
              {task.category}
            </span>
          </div>
          <button
            id="task-detail-close-btn"
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 p-1.5 rounded-lg hover:bg-slate-200/60 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="p-6 overflow-y-auto space-y-6">
          {/* Title & Checkbox */}
          <div className="flex items-start gap-3">
            <button
              id={`task-modal-toggle-${task.id}`}
              onClick={() => onToggleStatus(task.id)}
              className={`mt-1 flex-shrink-0 w-6 h-6 rounded-full border-2 flex items-center justify-center transition-all ${
                isDone
                  ? 'bg-emerald-600 border-emerald-600 text-white'
                  : 'border-slate-300 hover:border-emerald-500'
              }`}
              title={isDone ? 'Reabrir tarefa' : 'Marcar como concluído'}
            >
              {isDone && <CheckCircle2 className="w-4 h-4 text-white" />}
            </button>
            <div className="flex-1 min-w-0">
              {isEditingTitle ? (
                <form onSubmit={handleSaveTitle} className="space-y-2">
                  <div className="flex items-center gap-1.5 text-xs font-bold text-indigo-700">
                    <PenLine className="w-3.5 h-3.5 text-indigo-600" />
                    <span>Editar o que está escrito:</span>
                  </div>
                  <input
                    type="text"
                    autoFocus
                    value={editTitleText}
                    onChange={(e) => setEditTitleText(e.target.value)}
                    className="w-full text-base font-bold p-2 border-2 border-indigo-400 rounded-xl bg-white text-slate-900 focus:outline-hidden"
                    placeholder="Título da tarefa..."
                  />
                  <div className="flex items-center gap-2">
                    <button
                      type="submit"
                      className="px-3 py-1.5 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg transition-colors flex items-center gap-1 cursor-pointer"
                    >
                      <Check className="w-3.5 h-3.5" />
                      <span>Salvar</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setEditTitleText(task.title);
                        setIsEditingTitle(false);
                      }}
                      className="px-3 py-1.5 text-xs font-bold text-slate-500 hover:text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors cursor-pointer"
                    >
                      Cancelar
                    </button>
                  </div>
                </form>
              ) : (
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <h2
                      className={`text-lg font-bold text-slate-900 leading-snug ${
                        isDone ? 'line-through text-slate-400' : ''
                      }`}
                    >
                      {task.title}
                    </h2>
                    <p className="text-xs text-slate-500 mt-1">
                      Criada em {formatPtDate(task.createdDate)}
                    </p>
                  </div>
                  {onUpdateTitle && (
                    <button
                      type="button"
                      id="modal-edit-task-pen"
                      onClick={() => setIsEditingTitle(true)}
                      className="p-1.5 rounded-lg text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 border border-transparent hover:border-indigo-100 transition-colors cursor-pointer shrink-0"
                      title="Logo da caneta: Editar o que está escrito"
                    >
                      <PenLine className="w-4 h-4 text-indigo-600" />
                    </button>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Key metadata grid */}
          <div className="grid grid-cols-2 gap-3 bg-slate-50 p-4 rounded-xl border border-slate-100 text-sm">
            <div className="flex items-center gap-2.5 text-slate-700">
              <Calendar className="w-4 h-4 text-slate-400" />
              <div>
                <p className="text-xs text-slate-400">Prazo agendado</p>
                <p className="font-medium text-slate-800">
                  {getWeekdayName(task.targetDate)} ({formatPtDate(task.targetDate)})
                </p>
                <span className="text-xs text-indigo-600 font-medium">
                  {getRelativeDayOffset(task.targetDate)}
                </span>
              </div>
            </div>

            <div className="flex items-center gap-2.5 text-slate-700">
              <User className="w-4 h-4 text-slate-400" />
              <div>
                <p className="text-xs text-slate-400">Pessoa relacionada</p>
                <p className="font-medium text-slate-800">
                  {task.person || 'Ninguém específico'}
                </p>
              </div>
            </div>
          </div>

          {/* Original Caderno Note Box (Highlight of the app concept!) */}
          <div className="bg-amber-50/70 border border-amber-200/80 rounded-xl p-4">
            <div className="flex items-center justify-between mb-2">
              <span className="flex items-center gap-1.5 text-xs font-semibold text-amber-900">
                <BookOpen className="w-3.5 h-3.5 text-amber-700" />
                Anotação original no Caderno
              </span>
              {onOpenNotebookEntry && task.originalNoteId && (
                <button
                  onClick={() => {
                    onOpenNotebookEntry(task.originalNoteId);
                    onClose();
                  }}
                  className="text-xs text-amber-700 hover:text-amber-900 font-medium underline flex items-center gap-0.5"
                >
                  Abrir no Caderno
                  <ArrowRight className="w-3 h-3" />
                </button>
              )}
            </div>
            <blockquote className="text-sm italic text-slate-700 font-serif border-l-2 border-amber-400 pl-3 py-1">
              "{task.originalNoteText || 'Anotação direta inserida no planner.'}"
            </blockquote>
            <p className="text-xs text-amber-800/80 mt-2">
              O sistema identificou esta tarefa a partir da sua escrita livre no caderno.
            </p>
          </div>

          {/* History log if completed */}
          {task.historyLog && task.historyLog.length > 0 && (
            <div className="space-y-1.5">
              <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider flex items-center gap-1">
                <Clock className="w-3.5 h-3.5" /> Histórico de execução
              </p>
              <div className="bg-slate-50 rounded-lg p-3 text-xs text-slate-600 space-y-1 font-mono">
                {task.historyLog.map((log, idx) => (
                  <p key={idx}>{log}</p>
                ))}
              </div>
            </div>
          )}

          {/* Quick Reschedule */}
          <div className="border-t border-slate-100 pt-4">
            <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider block mb-2">
              Reprogramar data
            </label>
            <div className="flex items-center gap-2 flex-wrap">
              <button
                id="task-move-to-today-btn"
                onClick={() => onMoveToToday(task.id)}
                className="px-3 py-1.5 text-xs font-medium bg-indigo-50 hover:bg-indigo-100 text-indigo-700 rounded-lg transition-colors"
              >
                → Jogar para hoje
              </button>
              <input
                id="task-reschedule-input"
                type="date"
                defaultValue={task.targetDate}
                onChange={(e) => {
                  if (e.target.value) {
                    onReschedule(task.id, e.target.value);
                  }
                }}
                className="px-2.5 py-1 text-xs border border-slate-200 rounded-lg text-slate-700 focus:outline-hidden focus:ring-1 focus:ring-indigo-500"
              />
            </div>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="p-4 border-t border-slate-100 bg-slate-50 flex items-center justify-between">
          <button
            id="task-delete-btn"
            onClick={() => {
              onDeleteTask(task.id);
              onClose();
            }}
            className="text-xs text-rose-600 hover:text-rose-700 font-medium flex items-center gap-1.5 px-3 py-2 rounded-lg hover:bg-rose-50 transition-colors"
          >
            <Trash2 className="w-4 h-4" />
            Excluir tarefa
          </button>

          <div className="flex items-center gap-2">
            <button
              onClick={onClose}
              className="px-4 py-2 text-xs font-medium text-slate-600 hover:bg-slate-200/70 rounded-lg transition-colors"
            >
              Fechar
            </button>
            <button
              onClick={() => {
                onToggleStatus(task.id);
                onClose();
              }}
              className={`px-4 py-2 text-xs font-medium rounded-lg text-white transition-colors flex items-center gap-1.5 ${
                isDone ? 'bg-slate-700 hover:bg-slate-800' : 'bg-emerald-600 hover:bg-emerald-700'
              }`}
            >
              {isDone ? (
                <>
                  <RotateCcw className="w-3.5 h-3.5" /> Reabrir
                </>
              ) : (
                <>
                  <CheckCircle2 className="w-3.5 h-3.5" /> Concluir
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
