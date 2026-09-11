import React, { useState } from 'react';
import { NoteItem, NoteType, TaskCategory } from '../types';
import { formatPtDate, getTodayDateStr } from '../utils/dateUtils';
import {
  StickyNote,
  Lightbulb,
  Pin,
  CheckSquare,
  Plus,
  ArrowRight,
  Trash2,
  Calendar,
  Sparkles,
  Check,
} from 'lucide-react';

interface AnotacoesViewProps {
  notes: NoteItem[];
  onCreateNote: (note: Omit<NoteItem, 'id' | 'createdDate'>) => void;
  onDeleteNote: (noteId: string) => void;
  onToggleChecklistItem: (noteId: string, itemId: string) => void;
  onConvertToTask: (noteId: string, targetDate: string, category: TaskCategory) => void;
}

export const AnotacoesView: React.FC<AnotacoesViewProps> = ({
  notes,
  onCreateNote,
  onDeleteNote,
  onToggleChecklistItem,
  onConvertToTask,
}) => {
  const [selectedType, setSelectedType] = useState<string>('todos');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [convertingNoteId, setConvertingNoteId] = useState<string | null>(null);
  const [convertDate, setConvertDate] = useState(getTodayDateStr());
  const [convertCategory, setConvertCategory] = useState<TaskCategory>('Trabalho');

  // Form states for new note
  const [newTitle, setNewTitle] = useState('');
  const [newContent, setNewContent] = useState('');
  const [newType, setNewType] = useState<NoteType>('anotacao');
  const [newChecklistText, setNewChecklistText] = useState('');

  const filteredNotes = notes.filter((n) => {
    if (selectedType === 'todos') return true;
    return n.type === selectedType;
  });

  const handleSaveNote = () => {
    if (!newTitle.trim() && !newContent.trim()) return;

    let checklistItems = undefined;
    if (newType === 'checklist') {
      const items = newChecklistText
        .split('\n')
        .map((l) => l.trim())
        .filter(Boolean)
        .map((text, idx) => ({
          id: `item-${Date.now()}-${idx}`,
          text,
          done: false,
        }));
      checklistItems = items;
    }

    onCreateNote({
      type: newType,
      title: newTitle.trim() || 'Sem título',
      content: newContent.trim(),
      checklistItems,
      associatedDate: getTodayDateStr(),
    });

    setNewTitle('');
    setNewContent('');
    setNewChecklistText('');
    setShowCreateModal(false);
  };

  const handleExecuteConvert = (noteId: string) => {
    onConvertToTask(noteId, convertDate, convertCategory);
    setConvertingNoteId(null);
  };

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      {/* Header */}
      <div className="bg-white p-5 md:p-6 rounded-2xl border border-slate-200 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-xl">📝</span>
            <h1 className="text-xl md:text-2xl font-black text-slate-900 tracking-tight">
              Anotações & Ideias
            </h1>
          </div>
          <p className="text-xs md:text-sm text-slate-500 mt-1">
            Espaço para reflexões, referências e insights que não precisam ser tarefas imediatas.
          </p>
        </div>

        <button
          id="btn-nova-anotacao"
          onClick={() => setShowCreateModal(true)}
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-semibold text-xs md:text-sm transition-colors self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" />
          <span>Nova Anotação</span>
        </button>
      </div>

      {/* Filter Tabs */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1">
        {[
          { id: 'todos', label: 'Todos', icon: '📁' },
          { id: 'anotacao', label: 'Anotações', icon: '📝' },
          { id: 'ideia', label: 'Ideias', icon: '💡' },
          { id: 'importante', label: 'Importante', icon: '📌' },
          { id: 'checklist', label: 'Checklists', icon: '☑️' },
        ].map((tab) => (
          <button
            key={tab.id}
            id={`filter-note-${tab.id}`}
            onClick={() => setSelectedType(tab.id)}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-colors flex items-center gap-1.5 ${
              selectedType === tab.id
                ? 'bg-indigo-600 text-white shadow-xs'
                : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'
            }`}
          >
            <span>{tab.icon}</span>
            <span>{tab.label}</span>
          </button>
        ))}
      </div>

      {/* Notes Grid */}
      {filteredNotes.length === 0 ? (
        <div className="bg-white rounded-2xl p-10 text-center border border-slate-200 text-slate-400 text-sm">
          Nenhuma anotação nesta categoria.
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredNotes.map((note) => {
            const isIdea = note.type === 'ideia';
            const isImportant = note.type === 'importante';
            const isChecklist = note.type === 'checklist';

            return (
              <div
                key={note.id}
                id={`note-card-${note.id}`}
                className={`bg-white rounded-2xl border p-5 flex flex-col justify-between gap-4 shadow-xs transition-all hover:shadow-md ${
                  isImportant
                    ? 'border-rose-300 bg-rose-50/20'
                    : isIdea
                    ? 'border-amber-300 bg-amber-50/20'
                    : 'border-slate-200'
                }`}
              >
                <div className="space-y-2.5">
                  {/* Card Type Header */}
                  <div className="flex items-center justify-between">
                    <span
                      className={`text-xs font-bold px-2.5 py-1 rounded-md flex items-center gap-1.5 ${
                        isImportant
                          ? 'bg-rose-100 text-rose-800'
                          : isIdea
                          ? 'bg-amber-100 text-amber-900'
                          : isChecklist
                          ? 'bg-blue-100 text-blue-800'
                          : 'bg-slate-100 text-slate-700'
                      }`}
                    >
                      {isImportant && '📌 Importante'}
                      {isIdea && '💡 Ideia'}
                      {isChecklist && '☑️ Checklist'}
                      {note.type === 'anotacao' && '📝 Anotação'}
                    </span>

                    <button
                      id={`delete-note-${note.id}`}
                      onClick={() => onDeleteNote(note.id)}
                      className="text-slate-300 hover:text-rose-600 transition-colors p-1"
                      title="Excluir anotação"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>

                  {/* Title & Body */}
                  <div>
                    <h3 className="text-base font-bold text-slate-900 leading-snug">
                      {note.title}
                    </h3>
                    <p className="text-xs md:text-sm text-slate-600 mt-1 leading-relaxed whitespace-pre-wrap">
                      {note.content}
                    </p>
                  </div>

                  {/* Interactive Checklist Items */}
                  {isChecklist && note.checklistItems && (
                    <div className="mt-3 pt-2 border-t border-slate-100 space-y-1.5">
                      {note.checklistItems.map((item) => (
                        <label
                          key={item.id}
                          className="flex items-start gap-2 text-xs text-slate-700 cursor-pointer select-none"
                        >
                          <input
                            type="checkbox"
                            checked={item.done}
                            onChange={() => onToggleChecklistItem(note.id, item.id)}
                            className="mt-0.5 rounded text-indigo-600 focus:ring-0"
                          />
                          <span className={item.done ? 'line-through text-slate-400' : ''}>
                            {item.text}
                          </span>
                        </label>
                      ))}
                    </div>
                  )}
                </div>

                {/* Bottom Row: Transform to task action */}
                <div className="pt-3 border-t border-slate-100 flex items-center justify-between gap-2">
                  <span className="text-[11px] text-slate-400">
                    {formatPtDate(note.createdDate)}
                  </span>

                  {note.isConvertedToTask ? (
                    <span className="text-xs font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md flex items-center gap-1">
                      <Check className="w-3 h-3" /> Transformada em tarefa
                    </span>
                  ) : (
                    <button
                      id={`convert-note-${note.id}`}
                      onClick={() => setConvertingNoteId(note.id)}
                      className="text-xs font-semibold text-indigo-700 hover:text-indigo-900 hover:bg-indigo-50 px-2.5 py-1.5 rounded-lg transition-colors flex items-center gap-1"
                      title="Transformar em tarefa da semana"
                    >
                      <span>Transformar em tarefa</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Mini Modal to Convert Note to Task */}
      {convertingNoteId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-xs p-4">
          <div className="bg-white rounded-2xl p-5 max-w-sm w-full space-y-4 shadow-xl border border-slate-200">
            <h3 className="text-sm font-bold text-slate-900">
              Transformar em Tarefa
            </h3>
            <p className="text-xs text-slate-500">
              Defina o prazo e categoria para colocar este item no planner semanal.
            </p>

            <div className="space-y-3">
              <div>
                <label className="text-xs font-semibold text-slate-700 block mb-1">
                  Data de Agendamento:
                </label>
                <input
                  type="date"
                  value={convertDate}
                  onChange={(e) => setConvertDate(e.target.value)}
                  className="w-full text-xs p-2 border border-slate-200 rounded-lg text-slate-800"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-700 block mb-1">
                  Categoria:
                </label>
                <select
                  value={convertCategory}
                  onChange={(e) => setConvertCategory(e.target.value as TaskCategory)}
                  className="w-full text-xs p-2 border border-slate-200 rounded-lg text-slate-800 bg-white"
                >
                  <option value="Trabalho">Trabalho</option>
                  <option value="Estoque">Estoque</option>
                  <option value="Fornecedores">Fornecedores</option>
                  <option value="Financeiro">Financeiro</option>
                  <option value="Vendas">Vendas</option>
                  <option value="Reunião">Reunião</option>
                  <option value="Pessoal">Pessoal</option>
                </select>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
              <button
                onClick={() => setConvertingNoteId(null)}
                className="px-3 py-1.5 text-xs text-slate-500 hover:bg-slate-100 rounded-lg"
              >
                Cancelar
              </button>
              <button
                id="confirm-convert-btn"
                onClick={() => handleExecuteConvert(convertingNoteId)}
                className="px-4 py-1.5 text-xs font-semibold bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg transition-colors"
              >
                Criar Tarefa
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal to Create New Note */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-xs p-4">
          <div className="bg-white rounded-2xl p-6 max-w-md w-full space-y-4 shadow-2xl border border-slate-200">
            <h3 className="text-base font-bold text-slate-900">
              Criar Nova Anotação
            </h3>

            <div className="space-y-3">
              <div>
                <label className="text-xs font-semibold text-slate-700 block mb-1">
                  Tipo:
                </label>
                <div className="grid grid-cols-4 gap-1.5">
                  {(['anotacao', 'ideia', 'importante', 'checklist'] as NoteType[]).map((type) => (
                    <button
                      key={type}
                      type="button"
                      onClick={() => setNewType(type)}
                      className={`text-xs py-1.5 rounded-lg font-medium border text-center transition-all ${
                        newType === type
                          ? 'bg-indigo-50 border-indigo-500 text-indigo-700 font-bold'
                          : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                      }`}
                    >
                      {type === 'anotacao' && '📝 Nota'}
                      {type === 'ideia' && '💡 Ideia'}
                      {type === 'importante' && '📌 Fixar'}
                      {type === 'checklist' && '☑️ Lista'}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-700 block mb-1">
                  Título:
                </label>
                <input
                  type="text"
                  placeholder="Ex: Análise de giro dos bonés..."
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  className="w-full text-xs p-2 border border-slate-200 rounded-lg text-slate-800"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-700 block mb-1">
                  {newType === 'checklist' ? 'Descrição geral:' : 'Conteúdo:'}
                </label>
                <textarea
                  rows={3}
                  placeholder="Escreva os detalhes..."
                  value={newContent}
                  onChange={(e) => setNewContent(e.target.value)}
                  className="w-full text-xs p-2 border border-slate-200 rounded-lg text-slate-800 resize-none"
                />
              </div>

              {newType === 'checklist' && (
                <div>
                  <label className="text-xs font-semibold text-slate-700 block mb-1">
                    Itens da Lista (1 por linha):
                  </label>
                  <textarea
                    rows={3}
                    placeholder="Item 1&#10;Item 2&#10;Item 3"
                    value={newChecklistText}
                    onChange={(e) => setNewChecklistText(e.target.value)}
                    className="w-full text-xs p-2 border border-slate-200 rounded-lg text-slate-800 font-mono"
                  />
                </div>
              )}
            </div>

            <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
              <button
                onClick={() => setShowCreateModal(false)}
                className="px-4 py-2 text-xs text-slate-500 hover:bg-slate-100 rounded-lg"
              >
                Cancelar
              </button>
              <button
                id="save-new-note-btn"
                onClick={handleSaveNote}
                className="px-4 py-2 text-xs font-semibold bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg transition-colors"
              >
                Salvar Anotação
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
