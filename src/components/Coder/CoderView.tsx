import React, { useState } from 'react';
import JSZip from 'jszip';
import {
  Code2,
  Play,
  Download,
  Copy,
  Check,
  FolderTree,
  FileCode,
  Terminal,
  Sparkles,
  RefreshCw,
  FileText
} from 'lucide-react';

export const CoderView: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'sandbox' | 'scaffold' | 'dependencies'>('sandbox');

  const [code, setCode] = useState<string>(`// KYRIOS AI Interactive Sandbox
// Try calculating something or structuring an algorithm:
function fibonacci(n) {
  const sequence = [0, 1];
  for (let i = 2; i < n; i++) {
    sequence.push(sequence[i - 1] + sequence[i - 2]);
  }
  return sequence;
}

const result = fibonacci(10);
console.log("Calculated Fibonacci sequence:", result);
console.log("Sum:", result.reduce((a, b) => a + b, 0));
`);
  const [sandboxOutput, setSandboxOutput] = useState<string>('');
  const [isRunning, setIsRunning] = useState<boolean>(false);
  const [executionStats, setExecutionStats] = useState<{ durationMs?: number; success?: boolean } | null>(null);

  const [selectedTemplate, setSelectedTemplate] = useState<string>('fullstack');
  const [selectedFilePath, setSelectedFilePath] = useState<string>('src/index.ts');

  const [depProjectDesc, setDepProjectDesc] = useState<string>('Production REST API with authentication and PostgreSQL');
  const [depStack, setDepStack] = useState<string>('Node.js TypeScript + Express');
  const [generatedDeps, setGeneratedDeps] = useState<any>(null);
  const [isGeneratingDeps, setIsGeneratingDeps] = useState<boolean>(false);
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  const templates: Record<string, { name: string; description: string; files: Record<string, string> }> = {
    fullstack: {
      name: 'Full-Stack TypeScript & Vite/Express',
      description: 'Production-ready monorepo structure with React, Tailwind, and Express backend',
      files: {
        'package.json': JSON.stringify({
          name: 'kyrios-fullstack-app',
          version: '1.0.0',
          type: 'module',
          scripts: {
            dev: 'tsx server.ts',
            build: 'vite build',
            start: 'node dist/server.js'
          },
          dependencies: {
            react: '^19.0.0',
            'react-dom': '^19.0.0',
            express: '^4.21.0',
            dotenv: '^16.4.0'
          },
          devDependencies: {
            typescript: '^5.7.0',
            vite: '^6.0.0',
            tsx: '^4.19.0'
          }
        }, null, 2),
        'server.ts': `import express from 'express';\nimport dotenv from 'dotenv';\n\ndotenv.config();\nconst app = express();\nconst PORT = process.env.PORT || 3000;\n\napp.use(express.json());\napp.get('/api/health', (req, res) => res.json({ status: 'healthy', timestamp: new Date() }));\n\napp.listen(PORT, () => console.log(\`Server active on port \${PORT}\`));\n`,
        'src/index.ts': `export function main() {\n  console.log("Welcome to your KYRIOS engineered project!");\n}\nmain();\n`,
        'Dockerfile': `FROM node:20-alpine\nWORKDIR /app\nCOPY package*.json ./\nRUN npm ci --omit=dev\nCOPY . .\nEXPOSE 3000\nCMD ["npm", "start"]\n`,
        'README.md': `# KYRIOS Scaffolded Project\n\n## Quick Start\n\`\`\`bash\nnpm install\nnpm run dev\n\`\`\`\n`
      }
    },
    fastapi: {
      name: 'Python FastAPI Microservice',
      description: 'Clean Python FastAPI backend with Pydantic v2 and Docker setup',
      files: {
        'requirements.txt': `fastapi>=0.115.0\nuvicorn[standard]>=0.30.0\npydantic>=2.8.0\npython-dotenv>=1.0.0\n`,
        'main.py': `from fastapi import FastAPI\n\napp = FastAPI(title="KYRIOS AI Microservice")\n\n@app.get("/")\ndef read_root():\n    return {"message": "Service online", "status": "active"}\n\n@app.get("/health")\ndef health_check():\n    return {"status": "ok"}\n`,
        'Dockerfile': `FROM python:3.11-slim\nWORKDIR /app\nCOPY requirements.txt .\nRUN pip install --no-cache-dir -r requirements.txt\nCOPY . .\nCMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8000"]\n`,
        'README.md': `# Python FastAPI Service\n\n## Installation\n\`\`\`bash\npip install -r requirements.txt\nuvicorn main:app --reload\n\`\`\`\n`
      }
    }
  };

  const handleRunCode = async () => {
    setIsRunning(true);
    setSandboxOutput('Running in secure sandbox...');
    try {
      const res = await fetch('/api/code/run', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code, language: 'javascript' })
      });
      const data = await res.json();
      setSandboxOutput(data.output || data.error || 'Execution finished without output.');
      setExecutionStats({ durationMs: data.durationMs, success: data.success });
    } catch (err: any) {
      setSandboxOutput(`Sandbox Error: ${err.message}`);
      setExecutionStats({ success: false });
    } finally {
      setIsRunning(false);
    }
  };

  const handleDownloadZip = async () => {
    const zip = new JSZip();
    const currentFiles = templates[selectedTemplate].files;

    for (const [filePath, content] of Object.entries(currentFiles)) {
      zip.file(filePath, content);
    }

    const blob = await zip.generateAsync({ type: 'blob' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${selectedTemplate}-project.zip`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleGenerateDependencies = async () => {
    setIsGeneratingDeps(true);
    try {
      const res = await fetch('/api/code/dependencies', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          projectDescription: depProjectDesc,
          targetStack: depStack
        })
      });
      const data = await res.json();
      setGeneratedDeps(data);
    } catch (err) {
      console.error(err);
    } finally {
      setIsGeneratingDeps(false);
    }
  };

  const copyToClipboard = (key: string, text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 2000);
  };

  return (
    <div className="max-w-6xl mx-auto space-y-6 pb-12">
      <div className="p-6 md:p-8 rounded-3xl bg-[#111827]/80 border border-white/5 backdrop-blur-xl flex flex-col md:flex-row md:items-center justify-between gap-6 shadow-xl">
        <div className="space-y-1.5">
          <div className="flex items-center gap-2 text-emerald-400 text-xs font-semibold uppercase tracking-wider">
            <Code2 className="w-4 h-4" />
            <span>Master Coder Workspace</span>
          </div>
          <h1 className="text-2xl md:text-3xl font-extrabold text-white">Code Engine & Sandbox</h1>
          <p className="text-xs md:text-sm text-slate-400 max-w-xl">
            Test scripts safely in an isolated sandbox, generate clean build configs, or scaffold and download complete multi-file projects as ZIP.
          </p>
        </div>

        <div className="flex items-center gap-1.5 p-1 bg-black/40 rounded-2xl border border-white/5">
          <button
            onClick={() => setActiveTab('sandbox')}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-all ${
              activeTab === 'sandbox' ? 'bg-indigo-600 text-white shadow-sm' : 'text-slate-400 hover:text-white'
            }`}
          >
            Live Sandbox
          </button>
          <button
            onClick={() => setActiveTab('scaffold')}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-all ${
              activeTab === 'scaffold' ? 'bg-indigo-600 text-white shadow-sm' : 'text-slate-400 hover:text-white'
            }`}
          >
            Project Scaffolder
          </button>
          <button
            onClick={() => setActiveTab('dependencies')}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-all ${
              activeTab === 'dependencies' ? 'bg-indigo-600 text-white shadow-sm' : 'text-slate-400 hover:text-white'
            }`}
          >
            Config Generator
          </button>
        </div>
      </div>

      {activeTab === 'sandbox' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="rounded-2xl bg-[#111827]/80 border border-white/5 overflow-hidden flex flex-col backdrop-blur-xl">
            <div className="p-3.5 bg-black/30 border-b border-white/5 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <FileCode className="w-4 h-4 text-emerald-400" />
                <span className="text-xs font-semibold text-slate-200">sandbox.js (JavaScript / TypeScript)</span>
              </div>
              <button
                onClick={handleRunCode}
                disabled={isRunning}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white text-xs font-semibold shadow-md shadow-emerald-600/30 transition-all"
              >
                <Play className="w-3.5 h-3.5 fill-white" />
                <span>{isRunning ? 'Running...' : 'Run in Sandbox'}</span>
              </button>
            </div>

            <textarea
              value={code}
              onChange={(e) => setCode(e.target.value)}
              rows={18}
              className="w-full flex-1 p-4 bg-transparent font-mono text-xs text-emerald-300 leading-relaxed resize-none focus:outline-none selection:bg-emerald-500/30"
              spellCheck={false}
            />
          </div>

          <div className="rounded-2xl bg-[#0B0F17]/90 border border-white/5 overflow-hidden flex flex-col shadow-2xl">
            <div className="p-3.5 bg-black/50 border-b border-white/5 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Terminal className="w-4 h-4 text-indigo-400" />
                <span className="text-xs font-semibold text-slate-300">Sandbox Console Output</span>
              </div>
              {executionStats && (
                <div className="flex items-center gap-2 text-[11px] font-mono">
                  <span className={`px-2 py-0.5 rounded-full ${executionStats.success ? 'bg-emerald-500/20 text-emerald-400' : 'bg-rose-500/20 text-rose-400'}`}>
                    {executionStats.success ? 'Exit 0' : 'Error'}
                  </span>
                  {executionStats.durationMs !== undefined && (
                    <span className="text-slate-400">{executionStats.durationMs}ms</span>
                  )}
                </div>
              )}
            </div>

            <pre className="flex-1 p-4 font-mono text-xs text-slate-200 whitespace-pre-wrap overflow-y-auto leading-relaxed">
              {sandboxOutput || '// Output will be captured here when you click "Run in Sandbox"'}
            </pre>
          </div>
        </div>
      )}

      {activeTab === 'scaffold' && (
        <div className="space-y-6">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 p-4 rounded-2xl bg-[#111827]/70 border border-white/5 backdrop-blur-xl">
            <div className="flex items-center gap-3">
              <span className="text-xs font-semibold text-slate-300">Choose Architecture:</span>
              <select
                value={selectedTemplate}
                onChange={(e) => {
                  setSelectedTemplate(e.target.value);
                  const firstFile = Object.keys(templates[e.target.value].files)[0];
                  setSelectedFilePath(firstFile);
                }}
                className="bg-[#0B0F17] border border-white/10 rounded-xl px-3 py-1.5 text-xs text-white focus:outline-none focus:border-indigo-500"
              >
                <option value="fullstack">Full-Stack TypeScript & Vite/Express</option>
                <option value="fastapi">Python FastAPI Microservice</option>
              </select>
            </div>

            <button
              onClick={handleDownloadZip}
              className="flex items-center gap-2 px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold shadow-md shadow-indigo-600/30 transition-all"
            >
              <Download className="w-4 h-4" />
              <span>Download Project as .ZIP</span>
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="rounded-2xl bg-[#111827]/80 border border-white/5 p-3 space-y-1">
              <div className="flex items-center gap-1.5 px-2 py-1 text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
                <FolderTree className="w-3.5 h-3.5" />
                <span>Files</span>
              </div>
              {Object.keys(templates[selectedTemplate].files).map((filePath) => (
                <button
                  key={filePath}
                  onClick={() => setSelectedFilePath(filePath)}
                  className={`w-full text-left px-3 py-2 rounded-xl text-xs font-mono transition-all flex items-center gap-2 ${
                    selectedFilePath === filePath
                      ? 'bg-indigo-600 text-white shadow-sm'
                      : 'text-slate-400 hover:bg-white/5 hover:text-white'
                  }`}
                >
                  <FileText className="w-3.5 h-3.5 shrink-0" />
                  <span className="truncate">{filePath}</span>
                </button>
              ))}
            </div>

            <div className="md:col-span-3 rounded-2xl bg-[#0B0F17]/90 border border-white/5 overflow-hidden flex flex-col shadow-2xl">
              <div className="p-3 bg-black/40 border-b border-white/5 flex items-center justify-between">
                <span className="text-xs font-mono text-indigo-300 font-semibold">{selectedFilePath}</span>
                <button
                  onClick={() => copyToClipboard('file', templates[selectedTemplate].files[selectedFilePath])}
                  className="p-1.5 rounded-lg hover:bg-white/10 text-slate-400 hover:text-white transition-colors"
                  title="Copy file content"
                >
                  {copiedKey === 'file' ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                </button>
              </div>
              <pre className="p-4 font-mono text-xs text-slate-200 overflow-x-auto whitespace-pre leading-relaxed">
                {templates[selectedTemplate].files[selectedFilePath]}
              </pre>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'dependencies' && (
        <div className="space-y-6">
          <div className="p-6 rounded-2xl bg-[#111827]/70 border border-white/5 backdrop-blur-xl space-y-4">
            <h2 className="text-base font-bold text-white flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-indigo-400" />
              Generate Production Configs & Dependencies
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="text-xs text-slate-400 block mb-1">Project Description</label>
                <input
                  type="text"
                  value={depProjectDesc}
                  onChange={(e) => setDepProjectDesc(e.target.value)}
                  className="w-full bg-[#0B0F17] border border-white/10 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="text-xs text-slate-400 block mb-1">Target Stack & Language</label>
                <input
                  type="text"
                  value={depStack}
                  onChange={(e) => setDepStack(e.target.value)}
                  className="w-full bg-[#0B0F17] border border-white/10 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-indigo-500"
                />
              </div>
            </div>

            <button
              onClick={handleGenerateDependencies}
              disabled={isGeneratingDeps}
              className="flex items-center gap-2 px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white text-xs font-semibold shadow-md shadow-indigo-600/30 transition-all"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isGeneratingDeps ? 'animate-spin' : ''}`} />
              <span>{isGeneratingDeps ? 'Generating with Gemini...' : 'Generate Production Configs'}</span>
            </button>
          </div>

          {generatedDeps && (
            <div className="space-y-4">
              {generatedDeps.packageFiles?.map((pf: any, i: number) => (
                <div key={i} className="rounded-2xl bg-[#111827]/80 border border-white/5 overflow-hidden shadow-xl">
                  <div className="p-3 bg-black/40 border-b border-white/5 flex items-center justify-between">
                    <span className="text-xs font-mono font-semibold text-emerald-400">{pf.filename}</span>
                    <button
                      onClick={() => copyToClipboard(`pkg-${i}`, pf.content)}
                      className="p-1.5 rounded hover:bg-white/10 text-slate-400 hover:text-white"
                    >
                      {copiedKey === `pkg-${i}` ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                    </button>
                  </div>
                  <pre className="p-4 font-mono text-xs text-slate-200 overflow-x-auto whitespace-pre">
                    {pf.content}
                  </pre>
                </div>
              ))}

              {generatedDeps.configFiles?.map((cf: any, i: number) => (
                <div key={i} className="rounded-2xl bg-[#111827]/80 border border-white/5 overflow-hidden shadow-xl">
                  <div className="p-3 bg-black/40 border-b border-white/5 flex items-center justify-between">
                    <span className="text-xs font-mono font-semibold text-cyan-400">{cf.filename}</span>
                    <button
                      onClick={() => copyToClipboard(`cfg-${i}`, cf.content)}
                      className="p-1.5 rounded hover:bg-white/10 text-slate-400 hover:text-white"
                    >
                      {copiedKey === `cfg-${i}` ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                    </button>
                  </div>
                  <pre className="p-4 font-mono text-xs text-slate-200 overflow-x-auto whitespace-pre">
                    {cf.content}
                  </pre>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
};
