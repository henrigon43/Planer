import React, { useState } from 'react';
import { Task, NoteItem } from '../types';
import {
  getWeekDays,
  getWeekLabel,
  shiftWeek,
  getTodayDateStr,
  formatPtDate,
  isDateOverdue,
} from '../utils/dateUtils';
import {
  ChevronLeft,
  ChevronRight,
  Calendar,
  CheckCircle2,
  Clock,
  AlertCircle,
  Plus,
  ArrowRight,
  RotateCcw,
  Sparkles,
  BookOpen,
  CalendarDays,
  Flame,
  User,
  Check,
} from 'lucide-react';

interface SemanaViewProps {
  tasks: Task[];
  notes: NoteItem[];
  currentWeekRefDate: string;
  onSetWeekRefDate: (dateStr: string) => void;
  onToggleTaskStatus: (taskId: string) => void;
  onMoveToToday: (taskId: string) => void;
  onRescheduleTask: (taskId: string, newDate: string) => void;
  onOpenTaskDetail: (task: Task) => void;
  onGoToCaderno: () => void;
  onQuickAddTask: (title: string, targetDate: string) => void;
}

export const SemanaView: React.FC<SemanaViewProps> = ({
  tasks,
  notes,
  currentWeekRefDate,
  onSetWeekRefDate,
  onToggleTaskStatus,
  onMoveToToday,
  onRescheduleTask,
  onOpenTaskDetail,
  onGoToCaderno,
  onQuickAddTask,
}) => {
  const [quickAddDay, setQuickAddDay] = useState<string | null>(null);
  const [quickAddText, setQuickAddText] = useState('');
  const [rescheduleTaskId, setRescheduleTaskId] = useState<string | null>(null);

  const todayStr = getTodayDateStr();
  const weekDays = getWeekDays(currentWeekRefDate);
  const weekLabel = getWeekLabel(currentWeekRefDate);

  // Calculate statistics across tasks in this week or global
  const weekDateStrs = new Set(weekDays.map((d) => d.dateStr));
  const weekTasks = tasks.filter((t) => weekDateStrs.has(t.targetDate));

  const totalCompleted = weekTasks.filter((t) => t.status === 'concluido').length;
  const totalPending = weekTasks.filter((t) => t.status === 'pendente' && !isDateOverdue(t.targetDate, todayStr)).length;
  const totalOverdue = tasks.filter(
    (t) => t.status !== 'concluido' && isDateOverdue(t.targetDate, todayStr)
  ).length;

  const totalRelevant = weekTasks.length;
  const completionPercentage = totalRelevant > 0 ? Math.round((totalCompleted / totalRelevant) * 100) : 0;

  // Overdue tasks list for the "PENDÊNCIAS" section
  const overdueTasks = tasks.filter(
    (t) => t.status !== 'concluido' && isDateOverdue(t.targetDate, todayStr)
  );

  const handleQuickAddSubmit = (dayDateStr: string) => {
    if (quickAddText.trim()) {
      onQuickAddTask(quickAddText.trim(), dayDateStr);
      setQuickAddText('');
      setQuickAddDay(null);
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Banner: Prominent Button & Navigation */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-4 md:p-5 rounded-2xl border border-slate-200/80 shadow-xs">
        {/* Week navigation */}
        <div className="flex items-center gap-3">
          <div className="flex items-center bg-slate-100 p-1 rounded-xl">
            <button
              id="prev-week-btn"
              onClick={() => onSetWeekRefDate(shiftWeek(currentWeekRefDate, -1))}
              className="p-1.5 hover:bg-white rounded-lg text-slate-600 transition-colors"
              title="Semana anterior"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
            <button
              id="current-week-today-btn"
              onClick={() => onSetWeekRefDate(todayStr)}
              className="px-2.5 py-1 text-xs font-semibold text-slate-700 hover:bg-white rounded-lg transition-colors"
            >
              Hoje
            </button>
            <button
              id="next-week-btn"
              onClick={() => onSetWeekRefDate(shiftWeek(currentWeekRefDate, 1))}
              className="p-1.5 hover:bg-white rounded-lg text-slate-600 transition-colors"
              title="Próxima semana"
            >
              <ChevronRight className="w-5 h-5" />
            </button>
          </div>

          <div>
            <span className="text-xs font-bold tracking-wider text-indigo-600 uppercase">
              Visão Semanal
            </span>
            <h1 className="text-lg md:text-xl font-black text-slate-900 tracking-tight">
              {weekLabel}
            </h1>
          </div>
        </div>

        {/* Big Prominent Action: ESCREVER NO CADERNO */}
        <button
          id="hero-write-notebook-btn"
          onClick={onGoToCaderno}
          className="inline-flex items-center justify-center gap-2.5 px-5 py-3 rounded-xl bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-700 hover:to-violet-700 text-white font-semibold text-sm shadow-md shadow-indigo-200 hover:shadow-lg transition-all transform hover:-translate-y-0.5 active:translate-y-0"
        >
          <span className="text-lg">✍️</span>
          <span>Escrever no Caderno</span>
        </button>
      </div>

      {/* Week Summary Stats Card */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="bg-emerald-50/70 border border-emerald-200/70 rounded-xl p-3.5 flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-emerald-100 flex items-center justify-center text-emerald-700 font-bold">
            ✅
          </div>
          <div>
            <p className="text-xl font-black text-emerald-900">{totalCompleted}</p>
            <p className="text-xs font-medium text-emerald-700">concluídas</p>
          </div>
        </div>

        <div className="bg-amber-50/70 border border-amber-200/70 rounded-xl p-3.5 flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-amber-100 flex items-center justify-center text-amber-700 font-bold">
            🟡
          </div>
          <div>
            <p className="text-xl font-black text-amber-900">{totalPending}</p>
            <p className="text-xs font-medium text-amber-700">pendentes</p>
          </div>
        </div>

        <div className="bg-rose-50/70 border border-rose-200/70 rounded-xl p-3.5 flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-rose-100 flex items-center justify-center text-rose-700 font-bold">
            🔴
          </div>
          <div>
            <p className="text-xl font-black text-rose-900">{totalOverdue}</p>
            <p className="text-xs font-medium text-rose-700">atrasadas</p>
          </div>
        </div>

        <div className="bg-indigo-50/70 border border-indigo-200/70 rounded-xl p-3.5 flex flex-col justify-center">
          <div className="flex items-center justify-between mb-1">
            <span className="text-xs font-semibold text-indigo-700">📊 Progresso</span>
            <span className="text-sm font-black text-indigo-950">{completionPercentage}%</span>
          </div>
          <div className="w-full bg-indigo-100/80 rounded-full h-2 overflow-hidden">
            <div
              className="bg-indigo-600 h-2 rounded-full transition-all duration-500"
              style={{ width: `${completionPercentage}%` }}
            />
          </div>
        </div>
      </div>

      {/* 🔴 ÁREA "PENDÊNCIAS" - Crucial requirement from prompt */}
      {overdueTasks.length > 0 && (
        <div
          id="pendencias-area"
          className="bg-gradient-to-r from-rose-50 via-rose-50/80 to-amber-50/40 border-2 border-rose-200/90 rounded-2xl p-4 md:p-5 shadow-xs"
        >
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <span className="text-base">🔴</span>
              <h2 className="text-sm md:text-base font-bold text-rose-950 uppercase tracking-wide">
                Pendências ({overdueTasks.length})
              </h2>
              <span className="text-xs bg-rose-200/80 text-rose-900 font-medium px-2 py-0.5 rounded-full">
                Não concluídas
              </span>
            </div>
            <p className="hidden sm:block text-xs text-rose-800/80">
              Uma tarefa nunca simplesmente desaparece — resolva ou reprograme.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2.5">
            {overdueTasks.map((t) => (
              <div
                key={t.id}
                className="bg-white rounded-xl p-3 border border-rose-200 shadow-xs flex flex-col justify-between gap-2.5 hover:border-rose-300 transition-all"
              >
                <div className="flex items-start gap-2.5">
                  <button
                    id={`pendencia-check-${t.id}`}
                    onClick={() => onToggleTaskStatus(t.id)}
                    className="mt-0.5 w-5 h-5 rounded-md border-2 border-rose-400 hover:bg-emerald-500 hover:border-emerald-500 flex items-center justify-center transition-colors group"
                    title="Concluir pendência"
                  >
                    <Check className="w-3.5 h-3.5 text-white opacity-0 group-hover:opacity-100" />
                  </button>

                  <div
                    className="flex-1 cursor-pointer"
                    onClick={() => onOpenTaskDetail(t)}
                  >
                    <p className="text-xs font-semibold text-slate-900 hover:text-indigo-600 line-clamp-1">
                      {t.title}
                    </p>
                    <div className="flex items-center gap-2 mt-1 text-[11px] text-slate-500">
                      <span className="text-rose-600 font-medium">
                        Prazo: {formatPtDate(t.targetDate)}
                      </span>
                      {t.person && (
                        <span className="flex items-center gap-0.5 text-slate-600">
                          <User className="w-3 h-3" /> {t.person}
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Action buttons: "→ Jogar para hoje" ou "→ Reprogramar" */}
                <div className="flex items-center gap-1.5 pt-1 border-t border-slate-100">
                  <button
                    id={`jogar-para-hoje-${t.id}`}
                    onClick={() => onMoveToToday(t.id)}
                    className="flex-1 text-[11px] font-semibold py-1 px-2 rounded-lg bg-indigo-50 hover:bg-indigo-100 text-indigo-700 transition-colors text-center"
                  >
                    → Jogar para hoje
                  </button>

                  {rescheduleTaskId === t.id ? (
                    <input
                      type="date"
                      autoFocus
                      defaultValue={todayStr}
                      onBlur={() => setRescheduleTaskId(null)}
                      onChange={(e) => {
                        if (e.target.value) {
                          onRescheduleTask(t.id, e.target.value);
                          setRescheduleTaskId(null);
                        }
                      }}
                      className="text-[11px] py-0.5 px-1 border border-slate-300 rounded"
                    />
                  ) : (
                    <button
                      id={`reprogramar-${t.id}`}
                      onClick={() => setRescheduleTaskId(t.id)}
                      className="text-[11px] font-semibold py-1 px-2 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 transition-colors"
                    >
                      → Reprogramar
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 📊 VISÃO DA SEMANA: O Quadro de Dias (SEG | TER | QUA | QUI | SEX | SÁB | DOM) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-7 gap-3">
        {weekDays.map((day) => {
          const dayTasks = tasks.filter((t) => t.targetDate === day.dateStr);
          const dayNotes = notes.filter((n) => n.associatedDate === day.dateStr);
          const isToday = day.isToday;

          return (
            <div
              key={day.dateStr}
              id={`col-day-${day.shortDay.toLowerCase()}`}
              className={`flex flex-col min-h-[360px] rounded-2xl border transition-all ${
                isToday
                  ? 'bg-indigo-50/40 border-indigo-300 shadow-xs'
                  : 'bg-white border-slate-200/80 shadow-xs'
              }`}
            >
              {/* Day Header */}
              <div
                className={`p-3 rounded-t-2xl border-b flex items-center justify-between ${
                  isToday
                    ? 'bg-indigo-600 text-white border-indigo-700'
                    : 'bg-slate-50 text-slate-800 border-slate-100'
                }`}
              >
                <div>
                  <span className="text-[11px] font-bold uppercase tracking-wider block opacity-90">
                    {day.shortDay}
                  </span>
                  <span className="text-base font-black leading-tight">
                    {day.dayNum}
                  </span>
                </div>

                {isToday && (
                  <span className="text-[10px] font-bold bg-white/20 px-2 py-0.5 rounded-full">
                    HOJE
                  </span>
                )}

                <span className="text-xs font-semibold opacity-70">
                  {dayTasks.length}
                </span>
              </div>

              {/* Day Content Area */}
              <div className="p-2 space-y-2 flex-1 overflow-y-auto max-h-[440px]">
                {/* Day Notes */}
                {dayNotes.map((note) => (
                  <div
                    key={note.id}
                    className="p-2.5 rounded-xl bg-amber-50/80 border border-amber-200/70 text-slate-800 text-xs shadow-2xs"
                  >
                    <div className="flex items-center gap-1 font-semibold text-amber-900 mb-0.5">
                      <span>{note.type === 'ideia' ? '💡' : note.type === 'checklist' ? '☑️' : '📝'}</span>
                      <span className="line-clamp-1">{note.title}</span>
                    </div>
                    <p className="text-slate-600 line-clamp-2 text-[11px] font-sans">
                      {note.content}
                    </p>
                  </div>
                ))}

                {/* Day Tasks */}
                {dayTasks.map((t) => {
                  const isDone = t.status === 'concluido';
                  const isOver = t.status === 'atrasado' || (!isDone && isDateOverdue(t.targetDate, todayStr));
                  const isMeeting = t.category === 'Reunião';

                  // Status dot/icon
                  const statusBadge = isDone
                    ? '✅'
                    : isOver
                    ? '🔴'
                    : isMeeting
                    ? '🟢'
                    : '🟡';

                  return (
                    <div
                      key={t.id}
                      id={`task-card-${t.id}`}
                      className={`group relative p-2.5 rounded-xl border transition-all flex flex-col justify-between gap-1.5 cursor-pointer ${
                        isDone
                          ? 'bg-slate-50/90 border-slate-200 opacity-75'
                          : isOver
                          ? 'bg-rose-50/70 border-rose-200 hover:border-rose-300'
                          : 'bg-white border-slate-200/90 hover:border-indigo-300 hover:shadow-xs'
                      }`}
                      onClick={() => onOpenTaskDetail(t)}
                    >
                      <div className="flex items-start gap-2">
                        {/* Checkbox */}
                        <button
                          id={`task-check-${t.id}`}
                          onClick={(e) => {
                            e.stopPropagation();
                            onToggleTaskStatus(t.id);
                          }}
                          className={`mt-0.5 flex-shrink-0 w-4 h-4 rounded-md border flex items-center justify-center transition-colors ${
                            isDone
                              ? 'bg-emerald-600 border-emerald-600 text-white'
                              : isOver
                              ? 'border-rose-400 hover:bg-emerald-500 hover:border-emerald-500'
                              : 'border-slate-300 hover:border-indigo-500'
                          }`}
                          title={isDone ? 'Reabrir tarefa' : 'Marcar concluída'}
                        >
                          {isDone && <Check className="w-3 h-3 text-white" />}
                        </button>

                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-1 mb-0.5">
                            <span className="text-xs">{statusBadge}</span>
                            <span
                              className={`text-xs font-semibold line-clamp-2 leading-tight ${
                                isDone ? 'line-through text-slate-400' : 'text-slate-800'
                              }`}
                            >
                              {t.title}
                            </span>
                          </div>

                          {t.person && (
                            <div className="flex items-center gap-1 text-[10px] text-slate-500 font-medium">
                              <User className="w-2.5 h-2.5 text-slate-400" />
                              <span className="truncate">{t.person}</span>
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Origin indicator tag */}
                      <div className="flex items-center justify-between pt-1 border-t border-slate-100 text-[10px] text-slate-400">
                        <span className="text-[10px] font-medium text-slate-500">
                          {t.category}
                        </span>
                        <span className="flex items-center gap-0.5 text-amber-700/80 hover:text-amber-900">
                          <BookOpen className="w-2.5 h-2.5" />
                          <span>origem</span>
                        </span>
                      </div>
                    </div>
                  );
                })}

                {/* Empty State in day */}
                {dayTasks.length === 0 && dayNotes.length === 0 && (
                  <div className="h-24 flex items-center justify-center text-center p-2 text-slate-300 text-xs italic">
                    Livre
                  </div>
                )}
              </div>

              {/* Quick Add at bottom of column */}
              <div className="p-2 border-t border-slate-100 bg-slate-50/50 rounded-b-2xl">
                {quickAddDay === day.dateStr ? (
                  <div className="space-y-1.5">
                    <input
                      type="text"
                      autoFocus
                      placeholder="Ex: Verificar planilha..."
                      value={quickAddText}
                      onChange={(e) => setQuickAddText(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') handleQuickAddSubmit(day.dateStr);
                        if (e.key === 'Escape') setQuickAddDay(null);
                      }}
                      className="w-full text-xs p-1.5 bg-white border border-indigo-300 rounded-lg focus:outline-hidden"
                    />
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => handleQuickAddSubmit(day.dateStr)}
                        className="flex-1 text-[11px] font-medium bg-indigo-600 text-white py-1 rounded"
                      >
                        Salvar
                      </button>
                      <button
                        onClick={() => setQuickAddDay(null)}
                        className="text-[11px] text-slate-500 px-2 py-1"
                      >
                        ✕
                      </button>
                    </div>
                  </div>
                ) : (
                  <button
                    id={`quick-add-${day.shortDay.toLowerCase()}`}
                    onClick={() => {
                      setQuickAddDay(day.dateStr);
                      setQuickAddText('');
                    }}
                    className="w-full py-1 text-[11px] font-semibold text-slate-500 hover:text-indigo-600 hover:bg-slate-100 rounded-lg flex items-center justify-center gap-1 transition-colors"
                  >
                    <Plus className="w-3 h-3" /> Adicionar
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
