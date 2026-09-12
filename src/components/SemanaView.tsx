import React, { useState } from 'react';
import { Task, NoteItem, TaskStatus } from '../types';
import {
  getWeekDays,
  getWeekLabel,
  shiftWeek,
  getTodayDateStr,
  formatPtDate,
  isDateOverdue,
  isCurrentWeek,
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
  CalendarClock,
  History,
  PenLine,
  Share2,
  Mail,
  MessageCircle,
  Copy,
  X,
} from 'lucide-react';

interface SemanaViewProps {
  tasks: Task[];
  notes: NoteItem[];
  currentWeekRefDate: string;
  onSetWeekRefDate: (dateStr: string) => void;
  onToggleTaskStatus: (taskId: string) => void;
  onSetTaskStatus?: (taskId: string, status: TaskStatus) => void;
  onMoveToToday: (taskId: string) => void;
  onRescheduleTask: (taskId: string, newDate: string) => void;
  onOpenTaskDetail: (task: Task) => void;
  onGoToCaderno: () => void;
  onGoToAnotacoes?: () => void;
  onQuickAddTask: (title: string, targetDate: string) => void;
  onUpdateTaskTitle?: (taskId: string, newTitle: string) => void;
}

export const SemanaView: React.FC<SemanaViewProps> = ({
  tasks,
  notes,
  currentWeekRefDate,
  onSetWeekRefDate,
  onToggleTaskStatus,
  onSetTaskStatus,
  onMoveToToday,
  onRescheduleTask,
  onOpenTaskDetail,
  onGoToCaderno,
  onGoToAnotacoes,
  onQuickAddTask,
  onUpdateTaskTitle,
}) => {
  const [quickAddDay, setQuickAddDay] = useState<string | null>(null);
  const [quickAddText, setQuickAddText] = useState('');
  const [rescheduleTaskId, setRescheduleTaskId] = useState<string | null>(null);
  const [overdueFilter, setOverdueFilter] = useState<'all' | 'previous_week' | 'this_week'>('all');
  const [editingTaskId, setEditingTaskId] = useState<string | null>(null);
  const [editingTaskTitle, setEditingTaskTitle] = useState<string>('');

  // Share modal state
  const [shareDayData, setShareDayData] = useState<{
    dateStr: string;
    shortDay: string;
    dayNum: number;
  } | null>(null);
  const [copiedShareFeedback, setCopiedShareFeedback] = useState(false);

  const handleStartEditTask = (e: React.MouseEvent, t: Task) => {
    e.stopPropagation();
    setEditingTaskId(t.id);
    setEditingTaskTitle(t.title);
  };

  const handleSaveEditTask = (e: React.FormEvent | React.MouseEvent, taskId: string) => {
    e.stopPropagation();
    e.preventDefault();
    if (editingTaskTitle.trim() && onUpdateTaskTitle) {
      onUpdateTaskTitle(taskId, editingTaskTitle.trim());
    }
    setEditingTaskId(null);
    setEditingTaskTitle('');
  };

  const handleCancelEditTask = (e: React.MouseEvent) => {
    e.stopPropagation();
    setEditingTaskId(null);
    setEditingTaskTitle('');
  };

  const todayStr = getTodayDateStr();
  const weekDays = getWeekDays(currentWeekRefDate);
  const weekLabel = getWeekLabel(currentWeekRefDate);

  const mondayOfCurrentWeek = weekDays[0]?.dateStr || todayStr;

  // Calculate statistics across tasks in this week or global
  const weekDateStrs = new Set(weekDays.map((d) => d.dateStr));
  const weekTasks = tasks.filter((t) => weekDateStrs.has(t.targetDate));

  // 1. Tasks that rolled over strictly from PREVIOUS weeks (targetDate < mondayOfCurrentWeek)
  const previousWeekTasks = tasks.filter(
    (t) => t.status !== 'concluido' && t.targetDate < mondayOfCurrentWeek
  );

  // 2. Tasks overdue from earlier days of THIS week (targetDate >= mondayOfCurrentWeek and targetDate < todayStr)
  const earlierThisWeekTasks = tasks.filter(
    (t) =>
      t.status !== 'concluido' &&
      t.targetDate >= mondayOfCurrentWeek &&
      isDateOverdue(t.targetDate, todayStr)
  );

  // 3. Combined all overdue tasks that rolled over or are delayed
  const allRolledOverTasks = tasks.filter(
    (t) =>
      t.status !== 'concluido' &&
      (t.targetDate < mondayOfCurrentWeek || isDateOverdue(t.targetDate, todayStr))
  );

  const totalCompleted = weekTasks.filter((t) => t.status === 'concluido').length;
  const totalPending = weekTasks.filter((t) => t.status === 'pendente' && !isDateOverdue(t.targetDate, todayStr)).length;
  const totalOverdue = allRolledOverTasks.length;

  const totalRelevant = weekTasks.length;
  const completionPercentage = totalRelevant > 0 ? Math.round((totalCompleted / totalRelevant) * 100) : 0;

  // Filtered list to display in the section
  const displayedOverdueTasks =
    overdueFilter === 'previous_week'
      ? previousWeekTasks
      : overdueFilter === 'this_week'
      ? earlierThisWeekTasks
      : allRolledOverTasks;

  const handlePullAllToToday = () => {
    allRolledOverTasks.forEach((t) => {
      onMoveToToday(t.id);
    });
  };

  const handlePullAllToMonday = () => {
    allRolledOverTasks.forEach((t) => {
      onRescheduleTask(t.id, mondayOfCurrentWeek);
    });
  };

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
              className="p-1.5 hover:bg-white rounded-lg text-slate-600 transition-colors cursor-pointer"
              title="Semana anterior"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
            <button
              id="current-week-today-btn"
              onClick={() => onSetWeekRefDate(getTodayDateStr())}
              className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-all flex items-center gap-1.5 cursor-pointer ${
                isCurrentWeek(currentWeekRefDate)
                  ? 'bg-white text-indigo-700 shadow-xs'
                  : 'text-slate-700 hover:bg-white/80'
              }`}
              title="Sincronizar com o dia certo (Hoje)"
            >
              <RotateCcw className="w-3.5 h-3.5 text-indigo-600" />
              <span>Hoje</span>
            </button>
            <button
              id="next-week-btn"
              onClick={() => onSetWeekRefDate(shiftWeek(currentWeekRefDate, 1))}
              className="p-1.5 hover:bg-white rounded-lg text-slate-600 transition-colors cursor-pointer"
              title="Próxima semana"
            >
              <ChevronRight className="w-5 h-5" />
            </button>
          </div>

          <div>
            <span className="text-xs font-bold tracking-wider text-indigo-600 uppercase flex items-center gap-1.5">
              <span>Visão Semanal</span>
              {isCurrentWeek(currentWeekRefDate) && (
                <span className="text-[10px] font-bold bg-indigo-100 text-indigo-800 px-1.5 py-0.5 rounded-md">
                  Semana Atual
                </span>
              )}
            </span>
            <h1 className="text-lg md:text-xl font-black text-slate-900 tracking-tight">
              {weekLabel}
            </h1>
          </div>
        </div>

        {/* Prominent Actions: ESCREVER NO CADERNO & MINHAS ANOTAÇÕES (Com mesmo tamanho) */}
        <div className="grid grid-cols-2 gap-2.5 w-full md:w-auto">
          <button
            id="hero-write-notebook-btn"
            onClick={onGoToCaderno}
            className="w-full md:w-52 h-11 inline-flex items-center justify-center gap-2 px-3 sm:px-4 rounded-xl bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-700 hover:to-violet-700 text-white font-semibold text-xs sm:text-sm shadow-md shadow-indigo-200 hover:shadow-lg transition-all transform hover:-translate-y-0.5 active:translate-y-0 cursor-pointer"
          >
            <span className="text-base">✍️</span>
            <span className="truncate">Escrever no Caderno</span>
          </button>

          {onGoToAnotacoes && (
            <button
              id="hero-goto-anotacoes-btn"
              onClick={onGoToAnotacoes}
              className="w-full md:w-52 h-11 inline-flex items-center justify-center gap-2 px-3 sm:px-4 rounded-xl bg-amber-50 hover:bg-amber-100 text-amber-900 border border-amber-300 font-semibold text-xs sm:text-sm shadow-xs hover:shadow-sm transition-all transform hover:-translate-y-0.5 active:translate-y-0 cursor-pointer"
            >
              <span className="text-base">📝</span>
              <span className="truncate">Minhas Anotações</span>
            </button>
          )}
        </div>
      </div>

      {/* Week Summary Stats Card: Only Concluídas, Pendentes, Atrasadas (Progresso removed) */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div className="bg-emerald-50/70 border border-emerald-200/70 rounded-xl p-3.5 flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-emerald-100 flex items-center justify-center text-emerald-700 font-bold text-base">
            ✅
          </div>
          <div>
            <p className="text-xl font-black text-emerald-900">{totalCompleted}</p>
            <p className="text-xs font-semibold text-emerald-700 uppercase tracking-wide">Concluídos</p>
          </div>
        </div>

        <div className="bg-amber-50/70 border border-amber-200/70 rounded-xl p-3.5 flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-amber-100 flex items-center justify-center text-amber-700 font-bold text-base">
            🟡
          </div>
          <div>
            <p className="text-xl font-black text-amber-900">{totalPending}</p>
            <p className="text-xs font-semibold text-amber-700 uppercase tracking-wide">Pendentes</p>
          </div>
        </div>

        <div className="bg-rose-50/70 border border-rose-200/70 rounded-xl p-3.5 flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-rose-100 flex items-center justify-center text-rose-700 font-bold text-base">
            🔴
          </div>
          <div>
            <p className="text-xl font-black text-rose-900">{totalOverdue}</p>
            <p className="text-xs font-semibold text-rose-700 uppercase tracking-wide">
              {previousWeekTasks.length > 0
                ? `${previousWeekTasks.length} da semana anterior`
                : 'Atrasados'}
            </p>
          </div>
        </div>
      </div>

      {/* 🔴 ÁREA DE TAREFAS ATRASADAS: O que ficou da semana anterior para essa */}
      <div id="tarefas-atrasadas-area" className="transition-all">
        {allRolledOverTasks.length === 0 ? (
          <div className="bg-white border border-emerald-200/80 rounded-2xl p-4 sm:p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shadow-xs">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center font-bold shrink-0">
                <CheckCircle2 className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                  <span>Tarefas Atrasadas & Semana Anterior</span>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800">
                    Tudo em Dia
                  </span>
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Nenhuma tarefa ficou pendente da semana anterior para esta. Todas as pendências estão resolvidas!
                </p>
              </div>
            </div>
            <div className="text-[11px] font-semibold text-emerald-700 bg-emerald-50 px-3 py-1.5 rounded-xl border border-emerald-200/60">
              0 pendências atrasadas
            </div>
          </div>
        ) : (
          <div className="bg-gradient-to-r from-rose-50/90 via-amber-50/70 to-orange-50/50 border-2 border-rose-300/80 rounded-2xl p-4 sm:p-5 shadow-xs">
            {/* Header com contadores e botões em lote */}
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3 mb-4 pb-3 border-b border-rose-200/70">
              <div>
                <div className="flex items-center gap-2 flex-wrap">
                  <div className="w-7 h-7 rounded-lg bg-rose-600 text-white flex items-center justify-center shadow-xs">
                    <CalendarClock className="w-4 h-4" />
                  </div>
                  <h2 className="text-base font-black text-rose-950 tracking-tight">
                    Tarefas Atrasadas (Ficaram da Semana Anterior para Esta)
                  </h2>
                  <span className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-rose-600 text-white shadow-xs">
                    {allRolledOverTasks.length} {allRolledOverTasks.length === 1 ? 'pendência' : 'pendências'}
                  </span>
                  {previousWeekTasks.length > 0 && (
                    <span className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-amber-200 text-amber-900 border border-amber-300">
                      {previousWeekTasks.length} da semana anterior
                    </span>
                  )}
                </div>
                <p className="text-xs text-rose-800/90 mt-1">
                  Tarefas que não foram concluídas na semana anterior e foram repassadas para esta semana para não serem esquecidas.
                </p>
              </div>

              {/* Ações Rápidas em Lote e Filtros */}
              <div className="flex items-center gap-2 flex-wrap">
                {allRolledOverTasks.length > 1 && (
                  <div className="flex items-center gap-1.5">
                    <button
                      type="button"
                      onClick={handlePullAllToToday}
                      className="text-xs font-bold px-3 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white shadow-xs transition-all flex items-center gap-1.5 cursor-pointer"
                      title="Move todas as pendências atrasadas para o dia de hoje"
                    >
                      <Sparkles className="w-3.5 h-3.5 text-amber-300" />
                      <span>Puxar todas p/ Hoje</span>
                    </button>

                    <button
                      type="button"
                      onClick={handlePullAllToMonday}
                      className="text-xs font-bold px-2.5 py-1.5 rounded-xl bg-white hover:bg-rose-100 text-rose-900 border border-rose-300 shadow-xs transition-all flex items-center gap-1 cursor-pointer"
                      title="Mover todas para Segunda-feira desta semana"
                    >
                      <span>Puxar todas p/ Seg</span>
                    </button>
                  </div>
                )}

                {/* Filtro caso haja tarefas de semanas anteriores E dias anteriores desta semana */}
                {previousWeekTasks.length > 0 && earlierThisWeekTasks.length > 0 && (
                  <div className="flex items-center p-0.5 bg-rose-200/70 rounded-lg text-xs font-semibold">
                    <button
                      type="button"
                      onClick={() => setOverdueFilter('all')}
                      className={`px-2 py-1 rounded-md transition-all cursor-pointer ${
                        overdueFilter === 'all'
                          ? 'bg-white text-rose-900 shadow-xs'
                          : 'text-rose-800 hover:text-rose-950'
                      }`}
                    >
                      Todas ({allRolledOverTasks.length})
                    </button>
                    <button
                      type="button"
                      onClick={() => setOverdueFilter('previous_week')}
                      className={`px-2 py-1 rounded-md transition-all cursor-pointer ${
                        overdueFilter === 'previous_week'
                          ? 'bg-white text-rose-900 shadow-xs'
                          : 'text-rose-800 hover:text-rose-950'
                      }`}
                    >
                      Semana Anterior ({previousWeekTasks.length})
                    </button>
                    <button
                      type="button"
                      onClick={() => setOverdueFilter('this_week')}
                      className={`px-2 py-1 rounded-md transition-all cursor-pointer ${
                        overdueFilter === 'this_week'
                          ? 'bg-white text-rose-900 shadow-xs'
                          : 'text-rose-800 hover:text-rose-950'
                      }`}
                    >
                      Desta Semana ({earlierThisWeekTasks.length})
                    </button>
                  </div>
                )}
              </div>
            </div>

            {/* Grid com os cards das tarefas que ficaram pendentes */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
              {displayedOverdueTasks.map((t) => {
                const isFromPreviousWeek = t.targetDate < mondayOfCurrentWeek;

                return (
                  <div
                    key={t.id}
                    className="bg-white rounded-xl p-3.5 border border-rose-200 shadow-xs flex flex-col justify-between gap-3 hover:border-rose-400 hover:shadow-md transition-all"
                  >
                    <div>
                      {/* Selo identificando a origem (Semana anterior vs atrasada nesta semana) */}
                      <div className="flex items-center justify-between gap-2 mb-2">
                        {isFromPreviousWeek ? (
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-100 text-amber-900 border border-amber-300 flex items-center gap-1">
                            <History className="w-3 h-3 text-amber-700" />
                            Ficou da semana anterior
                          </span>
                        ) : (
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-rose-100 text-rose-900 border border-rose-300 flex items-center gap-1">
                            <AlertCircle className="w-3 h-3 text-rose-700" />
                            Atrasada nesta semana
                          </span>
                        )}

                        <span className="text-[11px] font-semibold text-slate-500">
                          {formatPtDate(t.targetDate)}
                        </span>
                      </div>

                      {/* Checkbox de Concluir + Título ou Edição com a Caneta */}
                      {editingTaskId === t.id ? (
                        <form
                          onSubmit={(e) => handleSaveEditTask(e, t.id)}
                          onClick={(e) => e.stopPropagation()}
                          className="space-y-2 p-1 bg-indigo-50/50 rounded-xl border border-indigo-200"
                        >
                          <div className="flex items-center gap-1.5 text-[11px] font-bold text-indigo-700">
                            <PenLine className="w-3.5 h-3.5 text-indigo-600" />
                            <span>Editar o que está escrito:</span>
                          </div>
                          <textarea
                            autoFocus
                            rows={2}
                            value={editingTaskTitle}
                            onChange={(e) => setEditingTaskTitle(e.target.value)}
                            onKeyDown={(e) => {
                              if (e.key === 'Enter' && !e.shiftKey) {
                                e.preventDefault();
                                handleSaveEditTask(e, t.id);
                              } else if (e.key === 'Escape') {
                                handleCancelEditTask(e as any);
                              }
                            }}
                            className="w-full text-xs font-semibold p-2 border-2 border-indigo-400 rounded-lg bg-white text-slate-900 focus:outline-hidden"
                            placeholder="Editar o que está escrito..."
                          />
                          <div className="flex items-center justify-end gap-1.5">
                            <button
                              type="button"
                              onClick={handleCancelEditTask}
                              className="px-2.5 py-1 text-[11px] font-bold text-slate-500 hover:text-slate-700 bg-white border border-slate-200 rounded-md transition-colors cursor-pointer"
                            >
                              Cancelar
                            </button>
                            <button
                              type="submit"
                              className="px-2.5 py-1 text-[11px] font-bold text-white bg-indigo-600 hover:bg-indigo-700 rounded-md shadow-2xs transition-colors flex items-center gap-1 cursor-pointer"
                            >
                              <Check className="w-3 h-3" />
                              <span>Salvar</span>
                            </button>
                          </div>
                        </form>
                      ) : (
                        <div className="flex items-start gap-2.5">
                          <button
                            id={`pendencia-check-${t.id}`}
                            type="button"
                            onClick={() => onToggleTaskStatus(t.id)}
                            className="mt-0.5 w-5 h-5 rounded-md border-2 border-rose-400 hover:bg-emerald-500 hover:border-emerald-500 flex items-center justify-center transition-colors group cursor-pointer shrink-0"
                            title="Concluir tarefa atrasada"
                          >
                            <Check className="w-3.5 h-3.5 text-white opacity-0 group-hover:opacity-100" />
                          </button>

                          <div
                            className="flex-1 cursor-pointer min-w-0"
                            onClick={() => onOpenTaskDetail(t)}
                          >
                            <div className="flex items-start justify-between gap-1.5">
                              <p className="text-xs font-bold text-slate-900 hover:text-indigo-600 line-clamp-2 leading-snug">
                                {t.title}
                              </p>
                              <button
                                id={`btn-edit-overdue-${t.id}`}
                                type="button"
                                onClick={(e) => handleStartEditTask(e, t)}
                                className="p-1 rounded-md text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 border border-transparent hover:border-indigo-200 transition-colors cursor-pointer shrink-0"
                                title="Logo da caneta: Editar o que está escrito"
                              >
                                <PenLine className="w-3.5 h-3.5 text-indigo-600" />
                              </button>
                            </div>

                            {t.person && (
                              <div className="flex items-center gap-1 mt-1 text-[11px] text-slate-600 font-medium">
                                <User className="w-3 h-3 text-slate-400" />
                                <span>{t.person}</span>
                              </div>
                            )}
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Barra de ações para puxar ou reprogramar a tarefa */}
                    <div className="pt-2 border-t border-slate-100 flex flex-col gap-1.5">
                      <div className="flex items-center gap-1.5">
                        <button
                          id={`jogar-para-hoje-${t.id}`}
                          type="button"
                          onClick={() => onMoveToToday(t.id)}
                          className="flex-1 text-[11px] font-bold py-1.5 px-2 rounded-lg bg-indigo-50 hover:bg-indigo-100 text-indigo-700 transition-colors text-center cursor-pointer"
                          title="Puxar para o dia de hoje"
                        >
                          → Puxar p/ Hoje
                        </button>

                        <button
                          type="button"
                          onClick={() => onRescheduleTask(t.id, mondayOfCurrentWeek)}
                          className="text-[11px] font-bold py-1.5 px-2 rounded-lg bg-amber-50 hover:bg-amber-100 text-amber-800 transition-colors text-center cursor-pointer"
                          title="Mover para Segunda desta semana"
                        >
                          → Seg
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
                            className="text-[11px] py-1 px-1.5 border border-slate-300 rounded-lg bg-white"
                          />
                        ) : (
                          <button
                            id={`reprogramar-${t.id}`}
                            type="button"
                            onClick={() => setRescheduleTaskId(t.id)}
                            className="text-[11px] font-bold py-1.5 px-2 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 transition-colors cursor-pointer"
                            title="Escolher outro dia para reprogramar"
                          >
                            Outro dia...
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>

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
                      {editingTaskId === t.id ? (
                        <form
                          onSubmit={(e) => handleSaveEditTask(e, t.id)}
                          onClick={(e) => e.stopPropagation()}
                          className="space-y-1.5 p-0.5"
                        >
                          <div className="flex items-center gap-1 text-[10px] font-bold text-indigo-700">
                            <PenLine className="w-3 h-3 text-indigo-600" />
                            <span>Editar o que está escrito:</span>
                          </div>
                          <textarea
                            autoFocus
                            rows={2}
                            value={editingTaskTitle}
                            onChange={(e) => setEditingTaskTitle(e.target.value)}
                            onKeyDown={(e) => {
                              if (e.key === 'Enter' && !e.shiftKey) {
                                e.preventDefault();
                                handleSaveEditTask(e, t.id);
                              } else if (e.key === 'Escape') {
                                handleCancelEditTask(e as any);
                              }
                            }}
                            className="w-full text-xs font-semibold p-1.5 border-2 border-indigo-400 rounded-lg bg-white text-slate-900 focus:outline-hidden"
                            placeholder="Editar o que está escrito..."
                          />
                          <div className="flex items-center justify-end gap-1">
                            <button
                              type="button"
                              onClick={handleCancelEditTask}
                              className="px-2 py-0.5 text-[10px] font-bold text-slate-500 hover:text-slate-700 bg-slate-100 rounded-md transition-colors cursor-pointer"
                            >
                              Cancelar
                            </button>
                            <button
                              type="submit"
                              className="px-2 py-0.5 text-[10px] font-bold text-white bg-indigo-600 hover:bg-indigo-700 rounded-md shadow-2xs transition-colors flex items-center gap-0.5 cursor-pointer"
                            >
                              <Check className="w-3 h-3" />
                              <span>Salvar</span>
                            </button>
                          </div>
                        </form>
                      ) : (
                        <>
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
                              <div className="flex items-start justify-between gap-1 mb-0.5">
                                <div className="flex items-center gap-1 min-w-0">
                                  <span className="text-xs shrink-0">{statusBadge}</span>
                                  <span
                                    className={`text-xs font-semibold line-clamp-2 leading-tight ${
                                      isDone ? 'line-through text-slate-400' : 'text-slate-800'
                                    }`}
                                  >
                                    {t.title}
                                  </span>
                                </div>
                                <button
                                  id={`btn-edit-col-task-${t.id}`}
                                  type="button"
                                  onClick={(e) => handleStartEditTask(e, t)}
                                  className="p-1 rounded text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 transition-colors cursor-pointer shrink-0"
                                  title="Logo da caneta: Editar o que está escrito"
                                >
                                  <PenLine className="w-3.5 h-3.5 text-indigo-600" />
                                </button>
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
                        </>
                      )}
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

                {/* Botão de Compartilhar Pendências do Dia */}
                <button
                  id={`share-day-btn-${day.shortDay.toLowerCase()}`}
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    setShareDayData({
                      dateStr: day.dateStr,
                      shortDay: day.shortDay,
                      dayNum: day.dayNum,
                    });
                    setCopiedShareFeedback(false);
                  }}
                  className="w-full py-1 text-[11px] font-semibold text-slate-500 hover:text-indigo-700 hover:bg-indigo-50/80 rounded-lg flex items-center justify-center gap-1.5 transition-colors cursor-pointer mt-1 border border-dashed border-slate-200 hover:border-indigo-300"
                  title="Compartilhar lista de pendências deste dia"
                >
                  <Share2 className="w-3 h-3 text-indigo-600" />
                  <span>Compartilhar</span>
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* 📤 POPUP DE COMPARTILHAR PENDÊNCIAS DO DIA */}
      {shareDayData && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl max-w-md w-full p-5 sm:p-6 shadow-2xl border border-slate-200 space-y-4">
            <div className="flex items-start justify-between">
              <div>
                <span className="text-xs font-bold text-indigo-600 uppercase tracking-wider block">
                  Compartilhar Pendências
                </span>
                <h3 className="text-base font-black text-slate-900 mt-0.5">
                  {shareDayData.shortDay} ({formatPtDate(shareDayData.dateStr)})
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setShareDayData(null)}
                className="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Content preview */}
            <div className="bg-slate-50 rounded-xl p-3.5 border border-slate-200 text-xs space-y-2">
              <p className="font-bold text-slate-700">
                Prévia da mensagem formatada:
              </p>
              {(() => {
                const dayPendingTasks = tasks.filter(
                  (t) => t.targetDate === shareDayData.dateStr && t.status !== 'concluido'
                );

                const shareText = dayPendingTasks.length > 0
                  ? `📋 Pendências de ${shareDayData.shortDay} (${formatPtDate(shareDayData.dateStr)}):\n` +
                    dayPendingTasks.map((t) => `- ${t.title}`).join('\n')
                  : `✅ Todas as tarefas de ${shareDayData.shortDay} (${formatPtDate(shareDayData.dateStr)}) estão concluídas!`;

                return (
                  <>
                    <pre className="whitespace-pre-wrap font-sans text-slate-800 bg-white p-3 rounded-lg border border-slate-200/80 leading-relaxed text-xs">
                      {shareText}
                    </pre>

                    {dayPendingTasks.length === 0 && (
                      <p className="text-[11px] text-emerald-600 font-semibold flex items-center gap-1">
                        <Check className="w-3.5 h-3.5" />
                        Nenhuma pendência para este dia.
                      </p>
                    )}

                    {/* Action buttons: WhatsApp and E-mail */}
                    <div className="grid grid-cols-2 gap-2 pt-2">
                      <a
                        href={`https://api.whatsapp.com/send?text=${encodeURIComponent(shareText)}`}
                        target="_blank"
                        rel="noreferrer"
                        className="py-2.5 px-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs flex items-center justify-center gap-2 shadow-xs transition-colors cursor-pointer"
                      >
                        <MessageCircle className="w-4 h-4" />
                        <span>WhatsApp</span>
                      </a>

                      <a
                        href={`mailto:?subject=${encodeURIComponent(`Pendências de ${shareDayData.shortDay} (${formatPtDate(shareDayData.dateStr)})`)}&body=${encodeURIComponent(shareText)}`}
                        className="py-2.5 px-3 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs flex items-center justify-center gap-2 shadow-xs transition-colors cursor-pointer"
                      >
                        <Mail className="w-4 h-4" />
                        <span>E-mail</span>
                      </a>
                    </div>

                    <div className="pt-1">
                      <button
                        type="button"
                        onClick={() => {
                          navigator.clipboard.writeText(shareText);
                          setCopiedShareFeedback(true);
                          setTimeout(() => setCopiedShareFeedback(false), 2000);
                        }}
                        className="w-full py-2 px-3 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-xs flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                      >
                        {copiedShareFeedback ? (
                          <>
                            <Check className="w-3.5 h-3.5 text-emerald-600" />
                            <span className="text-emerald-700 font-bold">Copiado para área de transferência!</span>
                          </>
                        ) : (
                          <>
                            <Copy className="w-3.5 h-3.5 text-slate-500" />
                            <span>Copiar texto das pendências</span>
                          </>
                        )}
                      </button>
                    </div>
                  </>
                );
              })()}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
