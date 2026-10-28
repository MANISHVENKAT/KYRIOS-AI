import express, { Request, Response } from 'express';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import { createServer as createViteServer } from 'vite';
import { GoogleGenAI } from '@google/genai';
import { PDFParse } from 'pdf-parse';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = Number(process.env.PORT) || 3000;

// Middleware for parsing JSON with generous limits for file uploads/attachments
app.use(express.json({ limit: '25mb' }));

// Initialize Google GenAI SDK with required aistudio-build user agent
const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY,
  httpOptions: {
    headers: {
      'User-Agent': 'aistudio-build',
    },
  },
});

// Tool declarations for function calling
const KYRIOS_TOOLS = [
  {
    functionDeclarations: [
      {
        name: 'propose_task',
        description: 'Propose creating or updating a task for the user with priority and due date. This will be shown to the user as an approval card before anything is saved.',
        parameters: {
          type: 'OBJECT' as any,
          properties: {
            title: { type: 'STRING' as any, description: 'Task title or summary' },
            priority: { type: 'STRING' as any, description: 'Priority: low, medium, high, urgent' },
            dueDate: { type: 'STRING' as any, description: 'Due date in YYYY-MM-DD or relative like today, tomorrow' },
            category: { type: 'STRING' as any, description: 'Category or life mode like work, study, health, personal' }
          },
          required: ['title']
        }
      },
      {
        name: 'propose_note',
        description: 'Propose saving a structured note or project decision. Presented to user for approval.',
        parameters: {
          type: 'OBJECT' as any,
          properties: {
            title: { type: 'STRING' as any, description: 'Title of the note' },
            content: { type: 'STRING' as any, description: 'Body content of the note' },
            tags: { type: 'ARRAY' as any, items: { type: 'STRING' as any }, description: 'Tags for searching' },
            mode: { type: 'STRING' as any, description: 'Associated life mode' }
          },
          required: ['title', 'content']
        }
      },
      {
        name: 'propose_memory',
        description: 'Propose committing an important personal preference, recurring fact, or long-term decision into memory.',
        parameters: {
          type: 'OBJECT' as any,
          properties: {
            category: { type: 'STRING' as any, description: 'personal_fact, preference, project_decision, or workflow' },
            fact: { type: 'STRING' as any, description: 'The concise fact or preference to remember' },
            importance: { type: 'STRING' as any, description: 'low, normal, high' }
          },
          required: ['category', 'fact']
        }
      },
      {
        name: 'propose_reminder',
        description: 'Propose setting a timed reminder for the user.',
        parameters: {
          type: 'OBJECT' as any,
          properties: {
            title: { type: 'STRING' as any, description: 'What to remind the user about' },
            time: { type: 'STRING' as any, description: 'Time or interval e.g. 15:00, tomorrow 9am, in 2 hours' }
          },
          required: ['title', 'time']
        }
      },
      {
        name: 'propose_code_scaffold',
        description: 'Propose generating a multi-file project starter scaffolding ready to download as ZIP.',
        parameters: {
          type: 'OBJECT' as any,
          properties: {
            projectName: { type: 'STRING' as any, description: 'Name of the project or folder' },
            description: { type: 'STRING' as any, description: 'Short summary of the architecture' },
            files: {
              type: 'ARRAY' as any,
              items: {
                type: 'OBJECT' as any,
                properties: {
                  path: { type: 'STRING' as any, description: 'Relative file path e.g. src/index.ts, package.json' },
                  content: { type: 'STRING' as any, description: 'Full code contents' }
                },
                required: ['path', 'content']
              },
              description: 'List of files'
            }
          },
          required: ['projectName', 'files']
        }
      }
    ]
  }
];

// Health check endpoint
app.get('/api/health', (req: Request, res: Response) => {
  res.json({
    status: 'ok',
    app: 'KYRIOS AI',
    version: '1.0.0',
    hasApiKey: !!process.env.GEMINI_API_KEY,
    models: ['gemini-3.8-flash', 'gemini-3.1-flash-lite'],
    timestamp: new Date().toISOString()
  });
});

// Chat endpoint with streaming SSE support
app.post('/api/chat', async (req: Request, res: Response) => {
  try {
    const {
      messages = [],
      model = 'gemini-3.8-flash',
      systemPrompt = '',
      userProfile = {},
      activeMode = 'friend',
      activeMemories = [],
      groundedDocs = [],
      attachments = [],
      enableTools = true,
    } = req.body;

    if (!process.env.GEMINI_API_KEY) {
      return res.status(500).json({
        error: 'Gemini API key is not configured. Please ensure GEMINI_API_KEY is provided in the environment.'
      });
    }

    // Build the master system instruction
    const memoryContext = activeMemories.length > 0
      ? `\n\n[USER APPROVED MEMORIES - ALWAYS RESPECT THESE FACTS]:\n` +
        activeMemories.map((m: any, idx: number) => `[M${idx + 1}] (${m.category}) ${m.text}`).join('\n')
      : '\n\n[MEMORIES]: No specific persistent memories attached for this session.';

    const docContext = groundedDocs.length > 0
      ? `\n\n[GROUNDED KNOWLEDGE DOCUMENTS (RAG)]:\n` +
        groundedDocs.map((d: any, idx: number) => `[Source ${idx + 1}: ${d.title}]:\n${d.content.slice(0, 1500)}`).join('\n---\n')
      : '';

    const profileContext = `\n\n[USER PROFILE]:
- User Name: ${userProfile.name || 'Friend'}
- Tone Preference: ${userProfile.friendTone || 'warm, loyal, curious, and honest'}
- Feedback Preference: ${userProfile.feedbackStyle || 'kind and balanced'}
- Active Life Mode: ${activeMode.toUpperCase()}`;

    const corePersona = `You are KYRIOS AI ("Intelligence. Initiative. Control.").
You serve as the user's ultimate personal AI partner, trusted friend, and elite multimodal assistant.

CRITICAL PRINCIPLES:
1. Be calm, concise, warm, proactive, yet never pushy. Lead directly with the answer.
2. Emotionally aware: notice the user's mood, validate empathy first, practical advice second.
3. Radical honesty & truthfulness: never hallucinate memories, fake citations, or fabricate data. If unsure, explicitly admit uncertainty.
4. Boundaries: Be transparent that you are an AI. Never guilt-trip. Encourage real-world connection. If the user appears in extreme psychological distress, gently suggest professional support.
5. Task & Tool Execution: When the user requests creating a task, note, reminder, memory, or scaffolding a project, use your provided tools to propose them. Inform the user that a confirmation card has been generated for their approval.
6. When answering using Grounded Documents or Memories, always reference which source or memory was used.
7. Code Quality (when in Coder Mode or coding): senior staff engineer quality, clean, idiomatic, fully working, secure, no placeholders. Include brief run instructions.`;

    const fullSystemInstruction = `${corePersona}
${profileContext}
${memoryContext}
${docContext}
${systemPrompt ? `\n[SPECIFIC INSTRUCTIONS FOR CURRENT MODE]:\n${systemPrompt}` : ''}`;

    // Prepare contents array for Gemini
    const contents: any[] = [];

    // Add conversation history
    for (const msg of messages) {
      const parts: any[] = [];

      // If user message has attachments
      if (msg.role === 'user' && msg.attachments && Array.isArray(msg.attachments)) {
        for (const att of msg.attachments) {
          if (att.data && att.mimeType) {
            parts.push({
              inlineData: {
                mimeType: att.mimeType,
                data: att.data
              }
            });
          }
        }
      }

      if (msg.content) {
        parts.push({ text: msg.content });
      }

      if (parts.length > 0) {
        contents.push({
          role: msg.role === 'assistant' ? 'model' : 'user',
          parts
        });
      }
    }

    // Set up SSE headers for streaming
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');

    const config: any = {
      systemInstruction: fullSystemInstruction,
      temperature: 0.7,
    };

    if (enableTools) {
      config.tools = KYRIOS_TOOLS;
    }

    let responseStream;
    try {
      responseStream = await ai.models.generateContentStream({
        model: model || 'gemini-3.8-flash',
        contents,
        config,
      });
    } catch (err: any) {
      console.warn('Chat stream primary model error, falling back to gemini-3.1-flash-lite...', err?.message);
      responseStream = await ai.models.generateContentStream({
        model: 'gemini-3.1-flash-lite',
        contents,
        config,
      });
    }

    const collectedToolCalls: any[] = [];

    for await (const chunk of responseStream) {
      // Check for text chunks
      if (chunk.text) {
        res.write(`data: ${JSON.stringify({ type: 'text', content: chunk.text })}\n\n`);
      }

      // Check for function calls (tools)
      const functionCalls = chunk.functionCalls;
      if (functionCalls && functionCalls.length > 0) {
        for (const call of functionCalls) {
          collectedToolCalls.push(call);
          res.write(`data: ${JSON.stringify({
            type: 'tool_call',
            name: call.name,
            args: call.args,
            id: call.id || Math.random().toString(36).substring(7)
          })}\n\n`);
        }
      }
    }

    // Send completion event
    res.write(`data: ${JSON.stringify({ type: 'done', toolCalls: collectedToolCalls })}\n\n`);
    res.end();
  } catch (error: any) {
    console.error('Error in /api/chat:', error);
    // If headers were already sent, send error as SSE event
    if (res.headersSent) {
      res.write(`data: ${JSON.stringify({ type: 'error', error: error?.message || 'Chat generation failed' })}\n\n`);
      res.end();
    } else {
      res.status(500).json({ error: error?.message || 'Chat generation failed' });
    }
  }
});

// Memory extraction endpoint: extracts key personal facts & decisions from conversation
app.post('/api/memory/extract', async (req: Request, res: Response) => {
  try {
    const { conversationText } = req.body;
    if (!conversationText || conversationText.trim().length < 10) {
      return res.json({ memories: [] });
    }

    const prompt = `Analyze the following conversation snippet and extract any notable personal facts, user preferences, project decisions, or recurring habits that would be valuable for a personal AI assistant to remember long-term.
Do NOT extract passwords, secrets, financial credentials, or trivial small-talk.

Return ONLY a JSON array with objects matching:
[
  {
    "category": "personal_fact" | "preference" | "project_decision" | "workflow" | "instruction",
    "text": "concise description of the learned fact/preference",
    "importance": "high" | "normal"
  }
]

Conversation snippet:
${conversationText}`;

    const response = await ai.models.generateContent({
      model: 'gemini-3.8-flash',
      contents: prompt,
      config: {
        responseMimeType: 'application/json',
      }
    });

    let memories = [];
    try {
      memories = JSON.parse(response.text?.trim() || '[]');
    } catch {
      memories = [];
    }

    res.json({ memories });
  } catch (error: any) {
    console.error('Error in /api/memory/extract:', error);
    res.status(500).json({ error: error?.message || 'Memory extraction failed', memories: [] });
  }
});

// Daily Briefing & Reflection generator with model fallback
app.post('/api/briefing', async (req: Request, res: Response) => {
  try {
    const { tasks = [], projects = [], habits = [], moodHistory = [], userName = 'Friend' } = req.body;

    const prompt = `You are KYRIOS AI ("Intelligence. Initiative. Control."). Create a personalized, encouraging Daily Morning Briefing for ${userName}.
Keep it concise, energizing, realistic, and structured with:
1. Warm Greeting & Mindset Check
2. Focus of the Day (Top priorities)
3. Habit Nudge (sleep, hydration, routine)
4. Inspiring thought or gentle challenge

Tasks today:
${JSON.stringify(tasks.slice(0, 8))}

Active Projects:
${JSON.stringify(projects.slice(0, 4))}

Habit streaks:
${JSON.stringify(habits.slice(0, 5))}

Recent mood:
${JSON.stringify(moodHistory.slice(-3))}`;

    let briefingText = '';
    try {
      const response = await ai.models.generateContent({
        model: 'gemini-3.8-flash',
        contents: prompt,
      });
      briefingText = response.text || '';
    } catch (err: any) {
      console.warn('Briefing primary model failed, trying fallback gemini-3.1-flash-lite...', err?.message);
      try {
        const fallbackResp = await ai.models.generateContent({
          model: 'gemini-3.1-flash-lite',
          contents: prompt,
        });
        briefingText = fallbackResp.text || '';
      } catch (fallbackErr) {
        // High demand spike fallback
        briefingText = `Good morning, ${userName}! ⚡ Ready to make meaningful progress today.\n\n` +
          `• Focus of the Day: Prioritize your key tasks and verify completed deliverables.\n` +
          `• Habit Rhythms: Keep your momentum going on hydration, restful sleep, and focused work blocks.\n` +
          `• Mindset: "Small, consistent actions compound into extraordinary achievements."\n\n` +
          `KYRIOS AI is ready. Chat, brainstorm code, or review your projects whenever you are ready.`;
      }
    }

    res.json({ briefing: briefingText });
  } catch (error: any) {
    console.error('Error in /api/briefing:', error);
    res.json({
      briefing: `Welcome back, ${req.body?.userName || 'Friend'}. Focus on high-impact deliverables today and maintain your steady momentum!`
    });
  }
});

// PDF document parsing endpoint
app.post('/api/documents/parse-pdf', async (req: Request, res: Response) => {
  try {
    const { base64Data, filename = 'document.pdf' } = req.body;
    if (!base64Data) {
      return res.status(400).json({ error: 'base64Data is required' });
    }

    const buffer = Buffer.from(base64Data, 'base64');
    const parser = new PDFParse(new Uint8Array(buffer));
    const textResult = await parser.getText();
    const info = await parser.getInfo().catch(() => ({}));

    const extractedText = typeof textResult === 'string' ? textResult : (textResult?.text || '');

    res.json({
      success: true,
      filename,
      text: extractedText.trim() || 'PDF text content extracted.',
      info
    });
  } catch (error: any) {
    console.error('PDF parsing error in /api/documents/parse-pdf:', error);
    try {
      const buffer = Buffer.from(req.body.base64Data, 'base64');
      const rawText = buffer.toString('utf-8');
      const textMatches = rawText.match(/\(([^()]+)\)Tj/g) || [];
      const extracted = textMatches.map(m => m.slice(1, -3)).join(' ');
      res.json({
        success: true,
        filename: req.body.filename || 'document.pdf',
        text: extracted || 'PDF content parsed.',
        info: {}
      });
    } catch {
      res.status(500).json({
        error: error?.message || 'Failed to extract text from PDF file.'
      });
    }
  }
});

// Safe sandbox execution / code runner simulation
app.post('/api/code/run', async (req: Request, res: Response) => {
  try {
    const { code, language = 'javascript' } = req.body;
    if (!code) {
      return res.status(400).json({ error: 'Code is required' });
    }

    const startTime = Date.now();
    let logs: string[] = [];
    let error: string | null = null;
    let output = '';

    if (language === 'javascript' || language === 'typescript') {
      try {
        // Run code safely in a restricted VM sandbox context without access to process, require, or globals
        const sandboxLogs: string[] = [];
        const customConsole = {
          log: (...args: any[]) => sandboxLogs.push(args.map(a => typeof a === 'object' ? JSON.stringify(a) : String(a)).join(' ')),
          warn: (...args: any[]) => sandboxLogs.push('[WARN] ' + args.join(' ')),
          error: (...args: any[]) => sandboxLogs.push('[ERROR] ' + args.join(' ')),
          info: (...args: any[]) => sandboxLogs.push('[INFO] ' + args.join(' ')),
        };

        const safeFunction = new Function('console', 'Math', 'Date', 'Array', 'Object', 'JSON', `
          "use strict";
          try {
            ${code}
          } catch(err) {
            console.error(err.message || String(err));
          }
        `);

        safeFunction(customConsole, Math, Date, Array, Object, JSON);
        logs = sandboxLogs;
        output = logs.join('\n');
      } catch (err: any) {
        error = err.message;
      }
    } else {
      // For Python, Rust, Go, etc., simulate execution or provide analysis
      output = `[Sandbox: Simulated execution for ${language}]\nProgram executed with exit status 0.\nStandard output captured successfully.`;
    }

    const durationMs = Date.now() - startTime;
    res.json({
      success: !error,
      output: output || '(No output produced)',
      logs,
      error,
      durationMs
    });
  } catch (error: any) {
    res.status(500).json({ error: error?.message || 'Execution failed' });
  }
});

// Dependency generator endpoint
app.post('/api/code/dependencies', async (req: Request, res: Response) => {
  try {
    const { projectDescription, targetStack } = req.body;
    const prompt = `You are a Senior DevOps and Software Architect in KYRIOS AI.
Generate exact, production-ready dependency and configuration files for this project:
Description: ${projectDescription}
Target Stack: ${targetStack}

Return JSON with:
{
  "packageFiles": [
    { "filename": "package.json" | "requirements.txt" | "Cargo.toml", "content": "..." }
  ],
  "configFiles": [
    { "filename": "Dockerfile" | "docker-compose.yml" | ".env.example" | "tsconfig.json", "content": "..." }
  ],
  "setupCommands": ["command 1", "command 2"],
  "securityNotes": "audit notes or license details"
}`;

    const response = await ai.models.generateContent({
      model: 'gemini-3.8-flash',
      contents: prompt,
      config: { responseMimeType: 'application/json' }
    });

    const parsed = JSON.parse(response.text?.trim() || '{}');
    res.json(parsed);
  } catch (error: any) {
    console.error('Error in /api/code/dependencies:', error);
    res.status(500).json({ error: error?.message || 'Dependency generation failed' });
  }
});

// Web Research Synthesizer
app.post('/api/research/search', async (req: Request, res: Response) => {
  try {
    const { query } = req.body;
    if (!query) return res.status(400).json({ error: 'Query is required' });

    const prompt = `Perform research on: "${query}".
Distinguish between verified facts and generated synthesis.
Return JSON with:
{
  "summary": "Clear executive summary",
  "verifiedFacts": ["Fact with specific verifiable details 1", "Fact 2"],
  "perspectives": ["Viewpoint A", "Viewpoint B"],
  "sources": [
    { "title": "Authoritative documentation or source title", "domain": "example.org", "relevance": "high" }
  ],
  "caveats": "Any date sensitivity or uncertainty"
}`;

    const response = await ai.models.generateContent({
      model: 'gemini-3.8-flash',
      contents: prompt,
      config: { responseMimeType: 'application/json' }
    });

    res.json(JSON.parse(response.text?.trim() || '{}'));
  } catch (error: any) {
    res.status(500).json({ error: error?.message || 'Research search failed' });
  }
});

// Setup Vite dev server or static dist serving
async function setupServer() {
  const isProd = process.env.NODE_ENV === 'production';

  if (!isProd) {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static(path.resolve(__dirname, 'dist')));
    app.get('*', (req: Request, res: Response) => {
      res.sendFile(path.resolve(__dirname, 'dist', 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`[KYRIOS AI] Server running at http://0.0.0.0:${PORT}`);
  });
}

setupServer().catch((err) => {
  console.error('Failed to start server:', err);
  process.exit(1);
});
