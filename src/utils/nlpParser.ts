import { Task, NoteItem, TaskCategory, NoteType } from '../types';
import { getTodayDateStr, parseDate, formatDateStr, getWeekDays } from './dateUtils';

interface ExtractedTaskRaw {
  title: string;
  person?: string | null;
  deadlineText: string;
  suggestedDate: string;
  category: TaskCategory;
  priority?: 'alta' | 'media' | 'baixa';
  clarificationQuestion?: string | null;
}

interface ExtractedNoteRaw {
  type: NoteType;
  title: string;
  content: string;
  items?: string[];
}

export interface AnalysisResult {
  tasks: ExtractedTaskRaw[];
  notes: ExtractedNoteRaw[];
  summary: string;
  usedAi: boolean;
}

/**
 * Calculates a specific target date string from Portuguese weekday words
 * based on the reference date (e.g. 2026-09-11).
 */
export function resolveDateFromPortuguese(text: string, referenceDateStr: string = getTodayDateStr()): { dateStr: string; label: string } {
  const lower = text.toLowerCase();
  const weekDays = getWeekDays(referenceDateStr);
  // Week days index: 0 = SEG, 1 = TER, 2 = QUA, 3 = QUI, 4 = SEX, 5 = SÁB, 6 = DOM

  if (lower.includes('segunda') || lower.includes('seg')) {
    return { dateStr: weekDays[0].dateStr, label: 'Segunda-feira' };
  }
  if (lower.includes('terça') || lower.includes('terca') || lower.includes('ter')) {
    return { dateStr: weekDays[1].dateStr, label: 'Terça-feira' };
  }
  if (lower.includes('quarta') || lower.includes('qua')) {
    return { dateStr: weekDays[2].dateStr, label: 'Quarta-feira' };
  }
  if (lower.includes('quinta') || lower.includes('qui')) {
    return { dateStr: weekDays[3].dateStr, label: 'Quinta-feira' };
  }
  if (lower.includes('sexta') || lower.includes('sex')) {
    return { dateStr: weekDays[4].dateStr, label: 'Sexta-feira' };
  }
  if (lower.includes('sábado') || lower.includes('sabado') || lower.includes('sab')) {
    return { dateStr: weekDays[5].dateStr, label: 'Sábado' };
  }
  if (lower.includes('domingo') || lower.includes('dom')) {
    return { dateStr: weekDays[6].dateStr, label: 'Domingo' };
  }
  if (lower.includes('hoje')) {
    return { dateStr: referenceDateStr, label: 'Hoje' };
  }
  if (lower.includes('amanhã') || lower.includes('amanha')) {
    const d = parseDate(referenceDateStr);
    d.setDate(d.getDate() + 1);
    return { dateStr: formatDateStr(d), label: 'Amanhã' };
  }

  // Default to today if not specified
  return { dateStr: referenceDateStr, label: 'Sem prazo específico' };
}

/**
 * Detects common people names in Portuguese business texts
 */
function extractPerson(text: string): string | null {
  // Look for "para o X", "com o X", "mandar para X", etc.
  const personMatch = text.match(/(?:para (?:o |a )?|com (?:o |a )?|ao |à )([A-ZÀ-Ú][a-zà-ú]+)/);
  if (personMatch && personMatch[1]) {
    const candidate = personMatch[1];
    const excluded = ['Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado', 'Domingo', 'Hoje', 'Amanhã', 'Nike', 'Vans', 'Puma', 'Adidas'];
    if (!excluded.includes(candidate)) {
      return candidate;
    }
  }

  // Also check common names
  const knownNames = ['Marcelo', 'Fábio', 'Fabio', 'Carlos', 'Ana', 'Mariana', 'Lucas', 'Juliana', 'Rodrigo', 'Beatriz', 'Fornecedor', 'Cliente'];
  for (const name of knownNames) {
    const reg = new RegExp(`\\b${name}\\b`, 'i');
    if (reg.test(text)) {
      return name;
    }
  }

  return null;
}

/**
 * Detects appropriate category
 */
function detectCategory(text: string): TaskCategory {
  const lower = text.toLowerCase();
  if (lower.includes('estoque') || lower.includes('boné') || lower.includes('produto') || lower.includes('giro')) {
    return 'Estoque';
  }
  if (lower.includes('fornecedor') || lower.includes('vans') || lower.includes('nike') || lower.includes('puma') || lower.includes('pedido')) {
    return 'Fornecedores';
  }
  if (lower.includes('reunião') || lower.includes('reuniao') || lower.includes('alinhamento') || lower.includes('call')) {
    return 'Reunião';
  }
  if (lower.includes('planilha') || lower.includes('pagamento') || lower.includes('nf') || lower.includes('nota')) {
    return 'Financeiro';
  }
  if (lower.includes('venda') || lower.includes('cliente') || lower.includes('proposta')) {
    return 'Vendas';
  }
  return 'Trabalho';
}

/**
 * Robust client-side natural language rule-based parser
 */
export function parseNoteTextLocally(text: string, referenceDateStr: string = getTodayDateStr()): AnalysisResult {
  const tasks: ExtractedTaskRaw[] = [];
  const notes: ExtractedNoteRaw[] = [];

  // Split into paragraphs or sentences
  const sentences = text
    .split(/\n+|\.(?=\s+[A-ZÀ-Ú])/)
    .map((s) => s.trim())
    .filter(Boolean);

  for (const sentence of sentences) {
    const lower = sentence.toLowerCase();

    // Check if it's a pure idea or non-urgent note
    const isIdea =
      lower.startsWith('na próxima') ||
      lower.startsWith('na proxima') ||
      lower.startsWith('lembrar de') ||
      lower.includes('ideia:') ||
      lower.includes('anotação:') ||
      lower.includes('giro dos') ||
      lower.includes('pensar em');

    const isChecklist =
      sentence.includes('- [ ]') ||
      sentence.includes('[ ]') ||
      sentence.split('\n').filter((l) => l.trim().startsWith('-') || l.trim().startsWith('*')).length > 1;

    if (isChecklist) {
      const items = sentence
        .split('\n')
        .map((l) => l.replace(/^[-*•]\s*(\[[ xX]\])?\s*/, '').trim())
        .filter(Boolean);
      notes.push({
        type: 'checklist',
        title: 'Checklist de Verificação',
        content: sentence,
        items,
      });
      continue;
    }

    if (isIdea) {
      notes.push({
        type: 'ideia',
        title: sentence.length > 50 ? `${sentence.slice(0, 50)}...` : sentence,
        content: sentence,
      });
      continue;
    }

    // Check for action triggers
    const hasAction =
      lower.includes('verificar') ||
      lower.includes('mandar') ||
      lower.includes('pedir') ||
      lower.includes('preciso') ||
      lower.includes('conferir') ||
      lower.includes('atualizar') ||
      lower.includes('fazer') ||
      lower.includes('ligar') ||
      lower.includes('enviar') ||
      lower.includes('cobrar') ||
      lower.includes('reunião') ||
      lower.includes('reuniao') ||
      lower.includes('resolver');

    const dateResolved = resolveDateFromPortuguese(sentence, referenceDateStr);
    const person = extractPerson(sentence);
    const category = detectCategory(sentence);

    if (hasAction || dateResolved.label !== 'Sem prazo específico') {
      // Clean up title
      let title = sentence;
      // If starts with "Segunda preciso verificar...", clean to "Verificar..."
      title = title.replace(/^(?:segunda|terça|quarta|quinta|sexta|sábado|domingo|hoje|amanhã)[,\s]+(?:preciso\s+|vou\s+)?/i, '');
      title = title.replace(/^preciso\s+/i, '');
      title = title.replace(/\s+até\s+(?:segunda|terça|quarta|quinta|sexta|sábado|domingo)[^.]*/i, '');
      title = title.trim();
      if (!title) title = sentence;

      // Capitalize first letter
      title = title.charAt(0).toUpperCase() + title.slice(1);

      tasks.push({
        title,
        person,
        deadlineText: dateResolved.label,
        suggestedDate: dateResolved.dateStr,
        category,
        priority: lower.includes('urgente') || lower.includes('importante') ? 'alta' : 'media',
        clarificationQuestion: null,
      });
    } else {
      // General note
      notes.push({
        type: 'anotacao',
        title: sentence.length > 40 ? `${sentence.slice(0, 40)}...` : sentence,
        content: sentence,
      });
    }
  }

  // If nothing was extracted, make a default task or note
  if (tasks.length === 0 && notes.length === 0 && text.trim().length > 0) {
    const dateResolved = resolveDateFromPortuguese(text, referenceDateStr);
    tasks.push({
      title: text.trim(),
      person: extractPerson(text),
      deadlineText: dateResolved.label,
      suggestedDate: dateResolved.dateStr,
      category: detectCategory(text),
      priority: 'media',
    });
  }

  const summary = tasks.length > 0
    ? `${tasks.length} ${tasks.length === 1 ? 'tarefa identificada' : 'tarefas identificadas'}${notes.length > 0 ? ` e ${notes.length} anotação` : ''}.`
    : `${notes.length} anotação registrada.`;

  return {
    tasks,
    notes,
    summary,
    usedAi: false,
  };
}

/**
 * Analyses note text using the Gemini backend endpoint,
 * with automatic fallback to local NLP engine on error or missing key.
 */
export async function analyzeNoteWithAI(
  text: string,
  referenceDateStr: string = getTodayDateStr()
): Promise<AnalysisResult> {
  try {
    const res = await fetch('/api/analyze-note', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text, referenceDate: referenceDateStr }),
    });

    if (res.ok) {
      const data = await res.json();
      if (data && data.success && Array.isArray(data.tasks)) {
        return {
          tasks: data.tasks.map((t: any) => ({
            title: t.title || 'Nova tarefa',
            person: t.person || null,
            deadlineText: t.deadlineText || 'Prazo definido',
            suggestedDate: t.suggestedDate || referenceDateStr,
            category: (t.category as TaskCategory) || 'Trabalho',
            priority: t.priority || 'media',
            clarificationQuestion: t.clarificationQuestion || null,
          })),
          notes: Array.isArray(data.notes)
            ? data.notes.map((n: any) => ({
                type: (n.type as NoteType) || 'anotacao',
                title: n.title || 'Anotação',
                content: n.content || '',
                items: n.items || [],
              }))
            : [],
          summary: data.summary || 'Anotação analisada pela IA com sucesso.',
          usedAi: true,
        };
      }
    }
  } catch (err) {
    console.warn('API analyze-note request failed, using local NLP parser:', err);
  }

  // Graceful, instant fallback
  return parseNoteTextLocally(text, referenceDateStr);
}
