import React, { useState, useRef } from 'react';
import { DocumentItem } from '../../types';
import { StorageService } from '../../services/storage';
import { RagService, RetrievedChunk } from '../../services/rag';
import {
  BookOpen,
  UploadCloud,
  FileText,
  Search,
  Trash2,
  Sparkles,
  Layers,
  CheckCircle2,
  FileCode,
  File,
  MessageSquare,
  AlertCircle
} from 'lucide-react';

interface Props {
  documents: DocumentItem[];
  setDocuments: React.Dispatch<React.SetStateAction<DocumentItem[]>>;
  onNavigateToChat: (prompt: string) => void;
}

export const KnowledgeView: React.FC<Props> = ({
  documents,
  setDocuments,
  onNavigateToChat,
}) => {
  const [testQuery, setTestQuery] = useState('');
  const [searchResults, setSearchResults] = useState<RetrievedChunk[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadStatus, setUploadStatus] = useState<string>('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    setIsUploading(true);
    setUploadStatus(`Indexing ${files.length} document(s)...`);

    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      const isPdf = file.name.toLowerCase().endsWith('.pdf') || file.type === 'application/pdf';

      if (isPdf) {
        setUploadStatus(`Parsing PDF text: ${file.name}...`);
        try {
          // Read as base64
          const base64Data = await new Promise<string>((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = () => {
              const res = reader.result as string;
              resolve(res.includes(',') ? res.split(',')[1] : res);
            };
            reader.onerror = reject;
            reader.readAsDataURL(file);
          });

          // Call backend PDF parser
          const parseRes = await fetch('/api/documents/parse-pdf', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ base64Data, filename: file.name })
          });

          const parseData = await parseRes.json();
          const extractedText = parseData.text || '';
          const chunks = RagService.chunkText(extractedText, 350, 50);

          const newDoc: DocumentItem = {
            id: 'doc-' + Date.now() + Math.random().toString(36).substring(2, 5),
            name: file.name,
            size: file.size,
            mimeType: 'application/pdf',
            text: extractedText,
            chunks,
            uploadedAt: new Date().toISOString()
          };

          StorageService.addDocument(newDoc);
        } catch (err: any) {
          console.error('Failed to parse PDF:', err);
          alert(`Could not extract text from PDF ${file.name}: ${err.message}`);
        }
      } else {
        // Plain text, markdown, json, csv, code files
        setUploadStatus(`Indexing ${file.name}...`);
        try {
          const text = await new Promise<string>((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = () => resolve((reader.result as string) || '');
            reader.onerror = reject;
            reader.readAsText(file);
          });

          const chunks = RagService.chunkText(text, 350, 50);
          const newDoc: DocumentItem = {
            id: 'doc-' + Date.now() + Math.random().toString(36).substring(2, 5),
            name: file.name,
            size: file.size,
            mimeType: file.type || 'text/plain',
            text,
            chunks,
            uploadedAt: new Date().toISOString()
          };

          StorageService.addDocument(newDoc);
        } catch (err: any) {
          console.error('Failed to read file:', err);
        }
      }
    }

    setDocuments(StorageService.getDocuments());
    setIsUploading(false);
    setUploadStatus('');
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleTestSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (!testQuery.trim()) return;

    const results = RagService.retrieveRelevantChunks(testQuery, documents, 4);
    setSearchResults(results);
  };

  const handleDeleteDoc = (id: string) => {
    if (confirm('Delete this document from knowledge index?')) {
      StorageService.deleteDocument(id);
      setDocuments(StorageService.getDocuments());
    }
  };

  return (
    <div className="max-w-6xl mx-auto space-y-6 pb-16">
      {/* Header */}
      <div className="p-6 md:p-8 rounded-3xl bg-[#111827]/80 border border-white/5 backdrop-blur-xl flex flex-col md:flex-row md:items-center justify-between gap-6 shadow-xl">
        <div className="space-y-1.5">
          <div className="flex items-center gap-2 text-indigo-400 text-xs font-semibold uppercase tracking-wider">
            <BookOpen className="w-4 h-4" />
            <span>Document Q&A & Semantic RAG</span>
          </div>
          <h1 className="text-2xl md:text-3xl font-extrabold text-white">Files & Knowledge Vault</h1>
          <p className="text-xs md:text-sm text-slate-400 max-w-xl">
            Upload PDFs, Markdown documents, source code, and project files. KYRIOS chunks the text and answers questions grounded strictly in your files.
          </p>
        </div>

        <div>
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileUpload}
            multiple
            accept=".pdf,.txt,.md,.json,.csv,.ts,.tsx,.js,.py,.rs,.html,.css"
            className="hidden"
          />
          <button
            onClick={() => fileInputRef.current?.click()}
            disabled={isUploading}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white text-xs font-semibold shadow-md shadow-indigo-600/30 transition-all"
          >
            <UploadCloud className="w-4 h-4" />
            <span>{isUploading ? 'Parsing & Indexing...' : 'Upload Files & PDFs'}</span>
          </button>
        </div>
      </div>

      {/* Upload Zone */}
      <div
        onClick={() => fileInputRef.current?.click()}
        className="p-8 rounded-3xl border-2 border-dashed border-indigo-500/20 hover:border-indigo-500/50 bg-[#111827]/40 hover:bg-[#111827]/60 transition-all cursor-pointer flex flex-col items-center justify-center text-center space-y-3"
      >
        <div className="p-4 rounded-2xl bg-indigo-500/10 text-indigo-400">
          <UploadCloud className="w-8 h-8" />
        </div>
        <div className="space-y-1">
          <h3 className="font-bold text-sm text-white">Upload PDFs, Specifications, or Code</h3>
          <p className="text-xs text-slate-400">
            Supports PDF (.pdf), Markdown (.md), Text (.txt), JSON, CSV, TypeScript, and Python.
          </p>
        </div>
        {uploadStatus && (
          <span className="text-xs text-indigo-400 font-semibold animate-pulse">{uploadStatus}</span>
        )}
      </div>

      {/* Semantic Search Tester */}
      <div className="p-6 rounded-3xl bg-[#111827]/80 border border-white/5 backdrop-blur-xl space-y-4">
        <h2 className="text-sm font-bold text-white flex items-center gap-2">
          <Search className="w-4 h-4 text-indigo-400" />
          Test Semantic Search Across Your Uploaded Files
        </h2>
        <form onSubmit={handleTestSearch} className="flex gap-2">
          <input
            type="text"
            placeholder="Type a concept, query, or keyword to test retrieval..."
            value={testQuery}
            onChange={(e) => setTestQuery(e.target.value)}
            className="flex-1 bg-[#0B0F17] border border-white/10 rounded-xl px-3.5 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500"
          />
          <button
            type="submit"
            className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold"
          >
            Search
          </button>
        </form>

        {searchResults.length > 0 && (
          <div className="space-y-2 pt-2">
            <span className="text-xs text-slate-400 font-semibold block">
              Found {searchResults.length} relevant chunks:
            </span>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {searchResults.map((res, i) => (
                <div key={i} className="p-3.5 rounded-2xl bg-black/30 border border-white/5 space-y-2">
                  <div className="flex items-center justify-between text-[11px]">
                    <span className="font-bold text-indigo-300 truncate">{res.documentTitle}</span>
                    <span className="font-mono text-emerald-400 font-semibold">Match score: {res.score}</span>
                  </div>
                  <p className="text-xs text-slate-300 font-mono line-clamp-3 leading-relaxed">
                    {res.chunkText}
                  </p>
                  <button
                    onClick={() => onNavigateToChat(`Based on "${res.documentTitle}", explain: "${res.chunkText.slice(0, 160)}..."`)}
                    className="text-[11px] text-indigo-400 hover:text-indigo-300 font-semibold pt-1 flex items-center gap-1"
                  >
                    <MessageSquare className="w-3.5 h-3.5" />
                    <span>Ask KYRIOS about this section →</span>
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Indexed Documents Table */}
      <div className="space-y-3">
        <div className="flex items-center justify-between px-1">
          <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-400">
            Indexed Documents & PDFs ({documents.length})
          </h3>
          <span className="text-xs text-indigo-400 font-medium">
            {documents.reduce((acc, d) => acc + d.chunks.length, 0)} total semantic chunks
          </span>
        </div>

        {documents.length === 0 ? (
          <div className="text-center py-12 rounded-3xl bg-[#111827]/40 border border-white/5 text-slate-400 text-xs">
            No files or PDFs uploaded yet. Drag & drop a PDF above to start asking questions!
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {documents.map((doc) => {
              const isPdf = doc.name.toLowerCase().endsWith('.pdf') || doc.mimeType === 'application/pdf';
              return (
                <div key={doc.id} className="p-5 rounded-3xl bg-[#111827]/70 border border-white/5 space-y-3 flex flex-col justify-between hover:border-indigo-500/30 transition-all">
                  <div className="space-y-2.5">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2.5 overflow-hidden">
                        <div className={`p-2 rounded-xl ${isPdf ? 'bg-rose-500/20 text-rose-400' : 'bg-indigo-500/20 text-indigo-400'}`}>
                          {isPdf ? <File className="w-4 h-4" /> : <FileText className="w-4 h-4" />}
                        </div>
                        <div className="min-w-0">
                          <span className="font-bold text-xs text-white truncate block">{doc.name}</span>
                          <span className="text-[10px] text-slate-500 font-mono">
                            {(doc.size / 1024).toFixed(1)} KB • {isPdf ? 'PDF Document' : 'Text Source'}
                          </span>
                        </div>
                      </div>

                      <button
                        onClick={() => handleDeleteDoc(doc.id)}
                        className="p-1.5 rounded-lg hover:bg-white/10 text-slate-400 hover:text-rose-400 transition-colors"
                        title="Delete document"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>

                    <div className="flex items-center gap-2 text-[10px] font-mono">
                      <span className="px-2 py-0.5 rounded-md bg-white/5 text-slate-300">
                        {doc.chunks.length} chunks indexed
                      </span>
                    </div>

                    <p className="text-xs text-slate-400 font-sans line-clamp-2">
                      {doc.text.slice(0, 160)}...
                    </p>
                  </div>

                  <div className="pt-3 border-t border-white/5 flex items-center justify-between">
                    <span className="text-[10px] text-slate-500">
                      {new Date(doc.uploadedAt).toLocaleDateString()}
                    </span>
                    <button
                      onClick={() => onNavigateToChat(`What are the key findings, conclusions, and action items in "${doc.name}"?`)}
                      className="text-xs text-indigo-400 hover:text-indigo-300 font-semibold flex items-center gap-1.5 bg-indigo-500/10 px-2.5 py-1 rounded-lg border border-indigo-500/20"
                    >
                      <span>Ask Questions</span>
                      <Sparkles className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};
