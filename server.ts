import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI, Type } from "@google/genai";
import dotenv from "dotenv";

dotenv.config();

let aiClient: GoogleGenAI | null = null;
function getGeminiClient(): GoogleGenAI | null {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey || apiKey === "MY_GEMINI_API_KEY") {
    return null;
  }
  if (!aiClient) {
    aiClient = new GoogleGenAI({
      apiKey,
      httpOptions: {
        headers: {
          "User-Agent": "aistudio-build",
        },
      },
    });
  }
  return aiClient;
}

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

  // Health check
  app.get("/api/health", (_req, res) => {
    res.json({
      status: "ok",
      hasGeminiKey: Boolean(process.env.GEMINI_API_KEY && process.env.GEMINI_API_KEY !== "MY_GEMINI_API_KEY"),
    });
  });

  // Intelligent analysis of notebook freeform text
  app.post("/api/analyze-note", async (req, res) => {
    try {
      const { text, referenceDate } = req.body;
      if (!text || typeof text !== "string") {
        return res.status(400).json({ error: "Text is required" });
      }

      const client = getGeminiClient();
      const now = new Date();
      const defaultToday = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
      const refDate = referenceDate || defaultToday;
      const [ry, rm, rd] = refDate.split('-').map(Number);
      const refDateObj = new Date(ry, rm - 1, rd, 12, 0, 0);
      const ptWeekdays = ["Domingo", "Segunda-feira", "Terça-feira", "Quarta-feira", "Quinta-feira", "Sexta-feira", "Sábado"];
      const refDayName = ptWeekdays[refDateObj.getDay()];

      if (!client) {
        // Return notice that server fallback should be used
        return res.json({
          usedFallback: true,
          message: "No Gemini API key provided; client-side rules engine will be used.",
        });
      }

      const prompt = `Você é o cérebro do aplicativo "Caderno & Planner Inteligente".
O usuário escreve de forma livre, natural e espontânea em seu caderno de trabalho (em português).
Sua missão é extrair Tarefas com prazos, pessoas e categorias a fazer.
IMPORTANTE: No Caderno, TUDO o que o usuário escreve deve ser transformado em Tarefas (tasks) para o Planner Semanal. A aba Anotações é separada e independente (não deve ser alimentada pelo Caderno).

Regras fundamentais:
1. Data de referência de hoje: ${refDate} (${refDayName}).
2. Se o texto fala "segunda", "terça", "quarta", etc., calcule a data futura mais próxima correspondente no formato YYYY-MM-DD (se o dia da semana já passou nesta semana em relação a hoje, agende para o próximo dia da semana correspondente).
3. Se falar "hoje", use ${refDate}. Se falar "amanhã", adicione 1 dia. Se não houver dia explícito, use a data de hoje (${refDate}).
4. Identifique claramente pessoas citadas (ex: Marcelo, Fábio, etc.) no campo "person".
5. Categorias possíveis: "Trabalho", "Fornecedores", "Estoque", "Vendas", "Reunião", "Financeiro", "Pessoal", "Outro".
6. Todo e qualquer item deve virar uma tarefa no array "tasks" (com status pendente). Se for um lembrete ou reflexão (ex: "Na próxima compra, lembrar de analisar melhor o giro dos bonés"), crie uma tarefa "Lembrar de analisar melhor o giro dos bonés" associada à data de hoje. Mantenha o array "notes" vazio [].
7. Se houver alguma ambiguidade real, preencha o campo "clarificationQuestion". Caso contrário, deixe nulo ou string vazia.
8. Retorne SEMPRE em JSON válido conforme o esquema.

Texto do caderno:
"""${text}"""`;

      const response = await client.models.generateContent({
        model: "gemini-3.8-flash",
        contents: prompt,
        config: {
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              tasks: {
                type: Type.ARRAY,
                items: {
                  type: Type.OBJECT,
                  properties: {
                    title: { type: Type.STRING, description: "Título claro e objetivo da tarefa" },
                    person: { type: Type.STRING, description: "Nome da pessoa relacionada ou responsável, se houver" },
                    deadlineText: { type: Type.STRING, description: "Expressão do prazo original (ex: 'quarta-feira', 'até sexta')" },
                    suggestedDate: { type: Type.STRING, description: "Data sugerida no formato YYYY-MM-DD" },
                    category: { type: Type.STRING, description: "Categoria da tarefa" },
                    priority: { type: Type.STRING, description: "alta, media, ou baixa" },
                    clarificationQuestion: { type: Type.STRING, description: "Pergunta se houver dúvida ou vazio" },
                  },
                  required: ["title", "deadlineText", "suggestedDate", "category"],
                },
              },
              notes: {
                type: Type.ARRAY,
                items: {
                  type: Type.OBJECT,
                  properties: {
                    type: { type: Type.STRING, description: "anotacao, ideia, importante, checklist" },
                    title: { type: Type.STRING, description: "Título breve da anotação" },
                    content: { type: Type.STRING, description: "Conteúdo da anotação" },
                    items: {
                      type: Type.ARRAY,
                      items: { type: Type.STRING },
                      description: "Itens se for checklist",
                    },
                  },
                  required: ["type", "title", "content"],
                },
              },
              summary: {
                type: Type.STRING,
                description: "Resumo em 1 frase curta do que foi identificado",
              },
            },
            required: ["tasks", "notes", "summary"],
          },
        },
      });

      const jsonStr = response.text ? response.text.trim() : "{}";
      const parsed = JSON.parse(jsonStr);
      return res.json({ success: true, ...parsed });
    } catch (err: any) {
      console.error("Gemini analysis error:", err);
      return res.status(500).json({
        error: "Failed to analyze with Gemini",
        details: err?.message || String(err),
      });
    }
  });

  // Vite middleware for development vs static build in production
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true, host: "0.0.0.0" },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (_req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Caderno & Planner server running on port ${PORT}`);
  });
}

startServer();
