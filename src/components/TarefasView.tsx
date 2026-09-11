import React, { useState } from 'react';
import { Task, TaskFilter, TaskCategory } from '../types';
import {
  getTodayDateStr,
  formatPtDate,
  getWeekdayName,
  getWeekDays,
  parseDate,
  formatDateStr,
  shiftWeek,
} from '../utils/dateUtils';
import {
  CheckCircle2,
  Calendar,
  User,
  Tag,
  Search,
  BookOpen,
  ArrowRight,
  AlertCircle,
  Filter,
  Check,
} from 'lucide-react';

interface TarefasViewProps {
  tasks: Task[];
  onToggleTaskStatus: (taskId: string) => void;
  onOpenTaskDetail: (task: Task) => void;
  onMoveToToday: (taskId: string) => void;
  onRescheduleTask: (taskId: string, newDate: string) => void;
  onGoToCaderno: () => void;
}

export const TarefasView: React.FC<TarefasViewProps> = ({
  tasks,
  onToggleTaskStatus,
  onOpenTaskDetail,
  onMoveToToday,
  onRescheduleTask,
  onGoToCaderno,
}) => {
  const [filter, setFilter] = useState<TaskFilter>('todos');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('todas');

  const todayStr = getTodayDateStr();
  const currentWeekDays = getWeekDays(todayStr);
  const currentWeekDates = new Set(currentWeekDays.map((d) => d.dateStr));

  const nextWeekRef = shiftWeek(todayStr, 1);
  const nextWeekDays = getWeekDays(nextWeekRef);
  const nextWeekDates = new Set(nextWeekDays.map((d) => d.dateStr));

  // Filter tasks based on selected filter and search query
  const filteredTasks = tasks.filter((t) => {
    // Search query filter
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const match =
        t.title.toLowerCase().includes(q) ||
        (t.person && t.person.toLowerCase().includes(q)) ||
        t.category.toLowerCase().includes(q);
      if (!match) return false;
    }

    // Category filter
    if (selectedCategory !== 'todas' && t.category !== selectedCategory) {
      return false;
    }

    // Timeframe filter
    if (filter === 'hoje') {
      return t.targetDate === todayStr;
    }
    if (filter === 'semana') {
      return currentWeekDates.has(t.targetDate);
    }
    if (filter === 'proxima') {
      return nextWeekDates.has(t.targetDate);
    }
    if (filter === 'sem_prazo') {
      return !t.targetDate;
    }

    return true;
  });

  // Group into the 4 explicit categories requested in prompt:
  // 🔴 Atrasadas
  // 🟠 Para hoje
  // 🟡 Próximas
  // ✅ Concluídas
  const atrasadas = filteredTasks.filter(
    (t) => t.status !== 'concluido' && t.targetDate < todayStr
  );

  const paraHoje = filteredTasks.filter(
    (t) => t.status !== 'concluido' && t.targetDate === todayStr
  );

  const proximas = filteredTasks.filter(
    (t) => t.status !== 'concluido' && t.targetDate > todayStr
  );

  const concluidas = filteredTasks.filter((t) => t.status === 'concluido');

  const renderTaskRow = (task: Task) => {
    const isDone = task.status === 'concluido';
    const isOverdue = task.status !== 'concluido' && task.targetDate < todayStr;
    const isToday = task.targetDate === todayStr;

    return (
      <div
        key={task.id}
        id={`task-row-${task.id}`}
        className={`bg-white rounded-xl border p-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-xs hover:border-indigo-300 transition-all ${
          isDone
            ? 'bg-slate-50/70 border-slate-200 opacity-80'
            : isOverdue
            ? 'border-rose-200 hover:border-rose-300'
            : isToday
            ? 'border-amber-200 hover:border-amber-300'
            : 'border-slate-200'
        }`}
      >
        <div className="flex items-start gap-3 flex-1 min-w-0">
          <button
            id={`task-table-check-${task.id}`}
            onClick={() => onToggleTaskStatus(task.id)}
            className={`mt-0.5 flex-shrink-0 w-5 h-5 rounded-md border flex items-center justify-center transition-colors ${
              isDone
                ? 'bg-emerald-600 border-emerald-600 text-white'
                : isOverdue
                ? 'border-rose-400 hover:bg-emerald-500 hover:border-emerald-500'
                : 'border-slate-300 hover:border-indigo-500'
            }`}
            title={isDone ? 'Reabrir' : 'Concluir'}
          >
            {isDone && <Check className="w-3.5 h-3.5 text-white" />}
          </button>

          <div
            className="flex-1 min-w-0 cursor-pointer"
            onClick={() => onOpenTaskDetail(task)}
          >
            <h4
              className={`text-sm font-semibold text-slate-900 line-clamp-1 hover:text-indigo-600 ${
                isDone ? 'line-through text-slate-400' : ''
              }`}
            >
              {task.title}
            </h4>

            <div className="flex flex-wrap items-center gap-3 mt-1 text-xs text-slate-500">
              <span className="flex items-center gap-1 font-medium">
                <Calendar className="w-3 h-3 text-slate-400" />
                {task.deadlineText} ({formatPtDate(task.targetDate)})
              </span>

              {task.person && (
                <span className="flex items-center gap-1 text-indigo-700 bg-indigo-50/80 px-2 py-0.5 rounded">
                  <User className="w-3 h-3" />
                  {task.person}
                </span>
              )}

              <span className="text-slate-500 bg-slate-100 px-2 py-0.5 rounded">
                {task.category}
              </span>
            </div>
          </div>
        </div>

        {/* Action buttons */}
        <div className="flex items-center gap-2 self-end sm:self-center">
          {isOverdue && (
            <button
              id={`row-jogar-hoje-${task.id}`}
              onClick={() => onMoveToToday(task.id)}
              className="text-xs font-semibold py-1 px-2.5 rounded-lg bg-indigo-50 text-indigo-700 hover:bg-indigo-100 transition-colors"
            >
              → Jogar para hoje
            </button>
          )}

          <button
            onClick={() => onOpenTaskDetail(task)}
            className="text-xs font-medium text-slate-500 hover:text-indigo-600 px-2 py-1 rounded hover:bg-slate-100 transition-colors flex items-center gap-1"
          >
            <BookOpen className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Anotação</span>
          </button>
        </div>
      </div>
    );
  };

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      {/* Header */}
      <div className="bg-white p-5 md:p-6 rounded-2xl border border-slate-200 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-xl">📋</span>
            <h1 className="text-xl md:text-2xl font-black text-slate-900 tracking-tight">
              Lista Geral de Tarefas
            </h1>
          </div>
          <p className="text-xs md:text-sm text-slate-500 mt-1">
            Organizadas automaticamente em atrasadas, para hoje, próximas e concluídas.
          </p>
        </div>

        <button
          onClick={onGoToCaderno}
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-xs md:text-sm shadow-xs transition-colors self-start md:self-auto"
        >
          <span>✍️ Escrever no Caderno</span>
        </button>
      </div>

      {/* Filters & Search Bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
        {/* Quick timeframe filter pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 md:pb-0">
          {[
            { id: 'todos', label: 'Todas' },
            { id: 'hoje', label: 'Hoje' },
            { id: 'semana', label: 'Semana' },
            { id: 'proxima', label: 'Próxima semana' },
            { id: 'sem_prazo', label: 'Sem prazo' },
          ].map((f) => (
            <button
              key={f.id}
              id={`filter-task-${f.id}`}
              onClick={() => setFilter(f.id as TaskFilter)}
              className={`px-3 py-1.5 text-xs font-semibold rounded-lg whitespace-nowrap transition-colors ${
                filter === f.id
                  ? 'bg-slate-900 text-white'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>

        {/* Search input */}
        <div className="relative w-full md:w-64">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
          <input
            id="search-tasks-input"
            type="text"
            placeholder="Buscar por tarefa, pessoa..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full text-xs pl-9 pr-3 py-2 border border-slate-200 rounded-lg text-slate-800 focus:outline-hidden focus:ring-1 focus:ring-indigo-500"
          />
        </div>
      </div>

      {/* 🔴 Atrasadas Section */}
      {atrasadas.length > 0 && (
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <span className="text-base">🔴</span>
            <h2 className="text-sm font-bold text-rose-900 uppercase tracking-wider">
              Atrasadas ({atrasadas.length})
            </h2>
          </div>
          <div className="space-y-2">
            {atrasadas.map(renderTaskRow)}
          </div>
        </div>
      )}

      {/* 🟠 Para hoje Section */}
      {paraHoje.length > 0 && (
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <span className="text-base">🟠</span>
            <h2 className="text-sm font-bold text-amber-900 uppercase tracking-wider">
              Para Hoje ({paraHoje.length})
            </h2>
          </div>
          <div className="space-y-2">
            {paraHoje.map(renderTaskRow)}
          </div>
        </div>
      )}

      {/* 🟡 Próximas Section */}
      {proximas.length > 0 && (
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <span className="text-base">🟡</span>
            <h2 className="text-sm font-bold text-slate-800 uppercase tracking-wider">
              Próximas ({proximas.length})
            </h2>
          </div>
          <div className="space-y-2">
            {proximas.map(renderTaskRow)}
          </div>
        </div>
      )}

      {/* ✅ Concluídas Section */}
      {concluidas.length > 0 && (
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <span className="text-base">✅</span>
            <h2 className="text-sm font-bold text-emerald-900 uppercase tracking-wider">
              Concluídas ({concluidas.length})
            </h2>
          </div>
          <div className="space-y-2">
            {concluidas.map(renderTaskRow)}
          </div>
        </div>
      )}

      {/* Empty State */}
      {filteredTasks.length === 0 && (
        <div className="bg-white rounded-2xl p-12 text-center border border-slate-200 text-slate-400 text-sm">
          Nenhuma tarefa encontrada com os filtros selecionados.
        </div>
      )}
    </div>
  );
};
