import React, { useState, useRef, useEffect } from 'react';
import {
  Message,
  UserProfile,
  LifeMode,
  ProposedAction,
  Memory,
  DocumentItem,
  AIState,
  Attachment
} from '../../types';
import { StorageService } from '../../services/storage';
import { VoiceService } from '../../services/voice';
import { RagService } from '../../services/rag';
import { ResilienceService } from '../../services/resilience';
import { ActionApprovalCard } from './ActionApprovalCard';
import {
  Send,
  Mic,
  MicOff,
  Volume2,
  VolumeX,
  Paperclip,
  Smile,
  Sparkles,
  Bot,
  User,
  Trash2,
  Brain,
  FileText,
  Copy,
  Check,
  RotateCcw,
  ShieldCheck,
  X,
  File,
  HelpCircle,
  Square,
  Zap,
  RefreshCw
} from 'lucide-react';

interface Props {
  messages: Message[];
  setMessages: React.Dispatch<React.SetStateAction<Message[]>>;
  profile: UserProfile;
  activeMode: LifeMode;
  aiState: AIState;
  setAiState: React.Dispatch<React.SetStateAction<AIState>>;
  onExecuteApprovedAction: (action: ProposedAction) => void;
  onNavigateToTab?: (tab: any) => void;
  initialPrompt?: string;
  onClearInitialPrompt?: () => void;
}

export const ChatView: React.FC<Props> = ({
  messages,
  setMessages,
  profile,
  activeMode,
  aiState,
  setAiState,
  onExecuteApprovedAction,
  initialPrompt,
  onClearInitialPrompt,
}) => {
  const [input, setInput] = useState('');
  const [attachments, setAttachments] = useState<Attachment[]>([]);
  const [selectedMoodEmoji, setSelectedMoodEmoji] = useState<string>('✨');
  const [showMoodPicker, setShowMoodPicker] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [currentlySpeakingId, setCurrentlySpeakingId] = useState<string | null>(null);
  const [isRecording, setIsRecording] = useState(false);
  const [micTranscript, setMicTranscript] = useState('');
  const [expandedMemories, setExpandedMemories] = useState<Record<string, boolean>>({});
  const [isParsingDocument, setIsParsingDocument] = useState<boolean>(false);
  const [latestUploadedDoc, setLatestUploadedDoc] = useState<{ name: string; chunks: number } | null>(null);
  const [selectedModel, setSelectedModel] = useState<'auto' | 'gemini-3.1-flash-lite' | 'gemini-3.8-flash'>('auto');
  const [liveTtft, setLiveTtft] = useState<number | null>(null);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const abortControllerRef = useRef<AbortController | null>(null);
  const animationFrameRef = useRef<number | null>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, aiState]);

  useEffect(() => {
    if (initialPrompt) {
      setInput(initialPrompt);
      onClearInitialPrompt?.();
    }
  }, [initialPrompt]);

  // Voice Speech-to-text
  const toggleRecording = () => {
    if (isRecording) {
      VoiceService.stopListening();
      setIsRecording(false);
      setAiState('idle');
      if (micTranscript.trim()) {
        setInput(prev => (prev ? prev + ' ' : '') + micTranscript);
        setMicTranscript('');
      }
    } else {
      const started = VoiceService.startListening(
        (transcript, isFinal) => {
          setMicTranscript(transcript);
          if (isFinal) {
            setInput(prev => (prev ? prev + ' ' : '') + transcript);
            setMicTranscript('');
          }
        },
        (err) => {
          console.warn('Speech recognition error:', err);
          setIsRecording(false);
          setAiState('idle');
        },
        () => {
          setIsRecording(false);
          setAiState('idle');
        }
      );

      if (started) {
        setIsRecording(true);
        setAiState('listening');
      }
    }
  };

  // Voice Text-to-speech
  const speakMessage = (id: string, text: string) => {
    if (currentlySpeakingId === id) {
      VoiceService.stopSpeaking();
      setCurrentlySpeakingId(null);
      setAiState('idle');
      return;
    }

    VoiceService.speak(text, {
      speed: profile.voiceSpeed,
      pitch: profile.voicePitch,
      voiceName: profile.preferredVoice,
      onStart: () => {
        setCurrentlySpeakingId(id);
        setAiState('speaking');
      },
      onEnd: () => {
        setCurrentlySpeakingId(null);
        setAiState('idle');
      },
      onError: () => {
        setCurrentlySpeakingId(null);
        setAiState('idle');
      }
    });
  };

  // Handle file and PDF attachment
  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    setIsParsingDocument(true);

    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      const isPdf = file.name.toLowerCase().endsWith('.pdf') || file.type === 'application/pdf';

      if (isPdf) {
        try {
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

          // Index into storage
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
          setLatestUploadedDoc({ name: file.name, chunks: chunks.length });

          setAttachments(prev => [
            ...prev,
            {
              name: file.name,
              mimeType: 'application/pdf',
              data: base64Data,
              size: file.size
            }
          ]);
        } catch (err: any) {
          console.error('Failed to parse PDF:', err);
        }
      } else {
        // Text / Markdown / Code file
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
          setLatestUploadedDoc({ name: file.name, chunks: chunks.length });

          const base64Data = btoa(unescape(encodeURIComponent(text)));
          setAttachments(prev => [
            ...prev,
            {
              name: file.name,
              mimeType: file.type || 'text/plain',
              data: base64Data,
              size: file.size
            }
          ]);
        } catch (err) {
          console.error('Failed to read file:', err);
        }
      }
    }

    setIsParsingDocument(false);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  // Stop streaming generation immediately
  const handleStopGenerating = () => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
    }
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
      animationFrameRef.current = null;
    }
    setAiState('idle');
    setLiveTtft(null);
  };

  // Core chat execution logic (used by both initial message and regenerate)
  const executeChatRequest = async (userText: string, currentAttachments: Attachment[], existingUserMessage?: Message) => {
    let userMessage = existingUserMessage;
    let newMessages = [...messages];

    if (!userMessage) {
      userMessage = {
        id: 'msg-' + Date.now(),
        role: 'user',
        content: userText,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        attachments: currentAttachments,
        mode: activeMode.id,
        moodEmoji: selectedMoodEmoji,
      };
      newMessages = [...messages, userMessage];
      setMessages(newMessages);
      StorageService.addMessage(userMessage);
    }

    // Prepare assistant placeholder
    const assistantMsgId = 'msg-' + (Date.now() + 1);
    const placeholderMsg: Message = {
      id: assistantMsgId,
      role: 'assistant',
      content: '',
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      mode: activeMode.id,
      usedMemories: [],
      citations: [],
      proposedActions: []
    };

    setMessages([...newMessages, placeholderMsg]);
    setAiState('processing');
    setLiveTtft(null);

    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    const controller = new AbortController();
    abortControllerRef.current = controller;

    // Gather active memories and relevant RAG documents (available to both stream and error recovery)
    const allMemories = StorageService.getMemories().filter(m => !m.disabled);
    const allDocs = StorageService.getDocuments();
    const retrievedChunks = RagService.retrieveRelevantChunks(userText, allDocs, 4);

    const relevantMemories = allMemories.filter(m =>
      m.pinned || userText.toLowerCase().includes(m.category) || (m.mode && m.mode === activeMode.id)
    ).slice(0, 5);

    const citations = retrievedChunks.map(c => ({
      title: c.documentTitle,
      snippet: c.chunkText.slice(0, 140) + '...',
      source: 'Document Vault'
    }));

    try {

      // Call streaming backend with optimized context
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        signal: controller.signal,
        body: JSON.stringify({
          messages: newMessages.slice(-6),
          model: selectedModel,
          systemPrompt: activeMode.systemPrompt,
          userProfile: profile,
          activeMode: activeMode.id,
          activeMemories: relevantMemories,
          groundedDocs: retrievedChunks.map(c => ({ title: c.documentTitle, content: c.chunkText })),
          enableTools: true
        })
      });

      let accumulatedText = '';
      const proposedActions: ProposedAction[] = [];
      let finalTelemetry: any = undefined;
      let isFallbackActive = false;

      // Handle 405 Method Not Allowed or server unavailability seamlessly
      if (!response.ok || !response.body) {
        console.warn(`[KYRIOS AI] Backend returned ${response.status} ${response.statusText}; activating Resilience Service...`);
        const fallback = ResilienceService.generateAnswer(
          userText,
          activeMode,
          profile.name || 'Friend',
          retrievedChunks,
          relevantMemories
        );

        // Stream fallback text progressively
        const words = fallback.content.split(' ');
        for (let i = 0; i < words.length; i += 3) {
          if (controller.signal.aborted) break;
          const slice = words.slice(i, i + 3).join(' ') + ' ';
          accumulatedText += slice;
          setMessages(prev => prev.map(m => m.id === assistantMsgId ? { ...m, content: accumulatedText } : m));
          await new Promise(r => setTimeout(r, 20));
        }

        proposedActions.push(...fallback.actions);
        finalTelemetry = {
          ttftMs: 25,
          durationMs: 350,
          tokenCount: Math.ceil(accumulatedText.length / 4),
          tokensPerSec: 60,
          modelUsed: 'kyrios-resilience-engine',
          isFallback: true
        };
      } else {
        const reader = response.body.getReader();
        const decoder = new TextDecoder('utf-8');

        // 60fps batched streaming to eliminate lag and re-render overhead
        const scheduleUpdate = () => {
          if (animationFrameRef.current !== null) return;
          animationFrameRef.current = requestAnimationFrame(() => {
            animationFrameRef.current = null;
            const currentText = accumulatedText;
            setMessages(prev => prev.map(m => m.id === assistantMsgId ? { ...m, content: currentText } : m));
          });
        };

        while (true) {
          const { value, done } = await reader.read();
          if (done) break;

          const chunkText = decoder.decode(value, { stream: true });
          const lines = chunkText.split('\n\n');

          for (const line of lines) {
            if (line.startsWith('data: ')) {
              try {
                const data = JSON.parse(line.replace('data: ', ''));

                if (data.type === 'start') {
                  if (data.ttftMs) setLiveTtft(data.ttftMs);
                } else if (data.type === 'fallback') {
                  isFallbackActive = true;
                } else if (data.type === 'text') {
                  accumulatedText += data.content;
                  scheduleUpdate();
                } else if (data.type === 'tool_call') {
                  const actionType = data.name.replace('propose_', '') as ProposedAction['type'];
                  const newAction: ProposedAction = {
                    id: data.id || 'act-' + Math.random().toString(36).substring(2, 7),
                    type: actionType,
                    status: 'pending',
                    title: data.args?.title || data.args?.fact || `${data.name} proposal`,
                    data: data.args || {},
                    createdAt: new Date().toISOString()
                  };
                  proposedActions.push(newAction);
                  setMessages(prev => prev.map(m => m.id === assistantMsgId ? { ...m, proposedActions: [...proposedActions] } : m));
                } else if (data.type === 'done') {
                  if (data.telemetry) {
                    finalTelemetry = {
                      ...data.telemetry,
                      isFallback: data.telemetry.isFallback || isFallbackActive
                    };
                  }
                }
              } catch {
                // Ignore partial JSON chunks in stream
              }
            }
          }
        }
      }

      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
        animationFrameRef.current = null;
      }

      // Finalize assistant message
      const finalizedMsg: Message = {
        id: assistantMsgId,
        role: 'assistant',
        content: accumulatedText || 'I processed your request.',
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        mode: activeMode.id,
        usedMemories: relevantMemories.map(m => `[${m.category}] ${m.text}`),
        citations,
        proposedActions,
        telemetry: finalTelemetry
      };

      setMessages(prev => prev.map(m => m.id === assistantMsgId ? finalizedMsg : m));
      StorageService.addMessage(finalizedMsg);
      setAiState('idle');
      setLiveTtft(null);

      // Auto-extract memories in background
      if (userText.length > 30) {
        fetch('/api/memory/extract', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ conversationText: `User: ${userText}\nAssistant: ${accumulatedText}` })
        }).then(res => res.json()).then(extracted => {
          if (extracted.memories && extracted.memories.length > 0) {
            extracted.memories.forEach((mem: any) => {
              StorageService.addMemory({
                category: mem.category || 'personal_fact',
                text: mem.text,
                importance: mem.importance || 'normal',
                mode: activeMode.id
              });
            });
          }
        }).catch(err => console.warn('Memory auto-extract non-fatal:', err));
      }

    } catch (err: any) {
      if (err.name === 'AbortError') {
        if (animationFrameRef.current) {
          cancelAnimationFrame(animationFrameRef.current);
          animationFrameRef.current = null;
        }
        setAiState('idle');
        setLiveTtft(null);
        return;
      }

      console.warn('Chat request encountered error, recovering with ResilienceService:', err);
      const fallback = ResilienceService.generateAnswer(
        userText,
        activeMode,
        profile.name || 'Friend',
        retrievedChunks,
        relevantMemories
      );

      const recoveredMsg: Message = {
        id: assistantMsgId,
        role: 'assistant',
        content: fallback.content,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        mode: activeMode.id,
        usedMemories: relevantMemories.map(m => `[${m.category}] ${m.text}`),
        citations: fallback.citations,
        proposedActions: fallback.actions,
        telemetry: {
          ttftMs: 20,
          durationMs: 250,
          tokensPerSec: 65,
          modelUsed: 'kyrios-resilience-recovery',
          isFallback: true
        }
      };
      setMessages(prev => prev.map(m => m.id === assistantMsgId ? recoveredMsg : m));
      StorageService.addMessage(recoveredMsg);
      setAiState('idle');
      setLiveTtft(null);
    }
  };

  // Submit message from input bar
  const handleSendMessage = async () => {
    if (!input.trim() && attachments.length === 0) return;

    const userText = input.trim();
    const currentAttachments = [...attachments];

    // Reset input states
    setInput('');
    setAttachments([]);
    setMicTranscript('');
    setLatestUploadedDoc(null);

    await executeChatRequest(userText, currentAttachments);
  };

  // Regenerate an assistant response
  const handleRegenerate = (assistantMsgId: string) => {
    const msgIndex = messages.findIndex(m => m.id === assistantMsgId);
    if (msgIndex < 0) return;

    let userPrompt = '';
    let userAtts: Attachment[] = [];
    let userMsg: Message | undefined;

    for (let i = msgIndex - 1; i >= 0; i--) {
      if (messages[i].role === 'user') {
        userPrompt = messages[i].content;
        userAtts = messages[i].attachments || [];
        userMsg = messages[i];
        break;
      }
    }

    if (!userPrompt && userAtts.length === 0) return;

    // Filter out the assistant message being regenerated
    setMessages(prev => prev.filter(m => m.id !== assistantMsgId));
    executeChatRequest(userPrompt, userAtts, userMsg);
  };

  const handleCopy = (id: string, text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleActionApproved = (action: ProposedAction) => {
    onExecuteApprovedAction(action);
    setMessages(prev => prev.map(m => ({
      ...m,
      proposedActions: m.proposedActions?.map(a => a.id === action.id ? { ...a, status: 'approved' } : a)
    })));
  };

  const handleActionRejected = (actionId: string) => {
    StorageService.logAction('reject_action', `User rejected proposed action #${actionId}`, 'rejected');
    setMessages(prev => prev.map(m => ({
      ...m,
      proposedActions: m.proposedActions?.map(a => a.id === actionId ? { ...a, status: 'rejected' } : a)
    })));
  };

  const handleActionEdited = (updatedAction: ProposedAction) => {
    onExecuteApprovedAction(updatedAction);
    setMessages(prev => prev.map(m => ({
      ...m,
      proposedActions: m.proposedActions?.map(a => a.id === updatedAction.id ? updatedAction : a)
    })));
  };

  const clearChatHistory = () => {
    if (confirm('Clear current chat conversation? This will not erase long-term memories or saved projects.')) {
      setMessages([]);
      StorageService.clearMessages();
    }
  };

  const moodEmojis = ['✨', '⚡', '🌿', '🎯', '🎨', '💡', '🔥', '❤️'];

  return (
    <div className="flex flex-col h-[calc(100vh-4rem)] md:h-[calc(100vh-2rem)] max-w-5xl mx-auto relative">
      {/* Ambient glow */}
      <div className={`absolute -top-12 left-1/2 -translate-x-1/2 w-96 h-96 rounded-full blur-3xl pointer-events-none transition-all duration-700 ${
        aiState === 'listening' ? 'bg-emerald-500/20 scale-125' :
        aiState === 'processing' ? 'bg-amber-500/20 scale-110 animate-pulse' :
        aiState === 'speaking' ? 'bg-cyan-500/25 scale-110' :
        'bg-indigo-600/10 scale-90'
      }`} />

      {/* Chat Header */}
      <div className="flex flex-wrap items-center justify-between pb-3 px-2 border-b border-white/5 relative z-10 shrink-0 gap-2">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-indigo-600 to-purple-600 flex items-center justify-center text-white shadow-md">
            <Sparkles className="w-4 h-4" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-bold text-sm text-white">{activeMode.name}</span>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-white/5 text-slate-400">
                RAG Grounded • Multimodal
              </span>
            </div>
            <p className="text-[11px] text-slate-400 line-clamp-1">{activeMode.tagline}</p>
          </div>
        </div>

        {/* Model Selector & Performance Controls */}
        <div className="flex items-center gap-2">
          {/* Model Switcher */}
          <div className="flex items-center bg-black/40 border border-white/10 rounded-xl p-0.5 text-xs font-mono shadow-inner">
            <button
              onClick={() => setSelectedModel('auto')}
              className={`flex items-center gap-1 px-2.5 py-1 rounded-lg transition-all ${
                selectedModel === 'auto'
                  ? 'bg-indigo-600 text-white font-semibold shadow-md'
                  : 'text-slate-400 hover:text-white hover:bg-white/5'
              }`}
              title="Auto-Adaptive: Fast routing with instant quota fallback"
            >
              <Zap className="w-3 h-3 text-amber-300" />
              <span className="hidden sm:inline">Auto</span>
            </button>
            <button
              onClick={() => setSelectedModel('gemini-3.1-flash-lite')}
              className={`flex items-center gap-1 px-2.5 py-1 rounded-lg transition-all ${
                selectedModel === 'gemini-3.1-flash-lite'
                  ? 'bg-indigo-600 text-white font-semibold shadow-md'
                  : 'text-slate-400 hover:text-white hover:bg-white/5'
              }`}
              title="Ultra Fast (gemini-3.1-flash-lite): Lowest latency, lightning fast token stream"
            >
              <Sparkles className="w-3 h-3 text-cyan-300" />
              <span className="hidden sm:inline">Fast</span>
            </button>
            <button
              onClick={() => setSelectedModel('gemini-3.8-flash')}
              className={`flex items-center gap-1 px-2.5 py-1 rounded-lg transition-all ${
                selectedModel === 'gemini-3.8-flash'
                  ? 'bg-indigo-600 text-white font-semibold shadow-md'
                  : 'text-slate-400 hover:text-white hover:bg-white/5'
              }`}
              title="Deep Reasoning (gemini-3.8-flash): Deep technical analysis & multi-step coding"
            >
              <Brain className="w-3 h-3 text-purple-300" />
              <span className="hidden sm:inline">Deep</span>
            </button>
          </div>

          {/* Real-time State & Live TTFT Indicator */}
          {aiState === 'processing' && (
            <div className="flex items-center gap-2">
              <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-amber-500/10 border border-amber-500/30 text-[11px] text-amber-300 font-mono">
                <div className="w-2 h-2 rounded-full bg-amber-400 animate-ping" />
                <span>{liveTtft ? `⚡ ${liveTtft}ms TTFT` : 'Streaming...'}</span>
              </div>
              <button
                onClick={handleStopGenerating}
                className="flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-rose-500/20 hover:bg-rose-500/30 border border-rose-500/40 text-rose-300 text-xs font-semibold transition-all shadow"
                title="Stop Generating (Abort current stream)"
              >
                <Square className="w-3 h-3 fill-rose-300" />
                <span>Stop</span>
              </button>
            </div>
          )}

          {aiState === 'listening' && (
            <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-[11px] text-emerald-300 font-medium">
              <div className="flex items-center gap-0.5">
                <span className="w-1 h-3 bg-emerald-400 rounded-full animate-bounce" />
                <span className="w-1 h-4 bg-emerald-400 rounded-full animate-bounce [animation-delay:0.1s]" />
                <span className="w-1 h-2 bg-emerald-400 rounded-full animate-bounce [animation-delay:0.2s]" />
              </div>
              <span>Listening</span>
            </div>
          )}

          {aiState === 'speaking' && (
            <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-cyan-500/10 border border-cyan-500/30 text-[11px] text-cyan-300 font-medium">
              <Volume2 className="w-3.5 h-3.5 text-cyan-400 animate-pulse" />
              <span>Speaking</span>
            </div>
          )}

          <button
            onClick={clearChatHistory}
            className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-white/5 transition-colors"
            title="Clear Chat History"
          >
            <RotateCcw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Messages Canvas */}
      <div className="flex-1 overflow-y-auto py-4 px-2 space-y-6 relative z-10">
        {messages.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-center p-6 space-y-5">
            <div className="w-16 h-16 rounded-3xl bg-gradient-to-tr from-indigo-500/20 via-purple-500/20 to-cyan-500/20 border border-indigo-500/30 flex items-center justify-center text-indigo-400 shadow-xl">
              <Bot className="w-8 h-8" />
            </div>
            <div className="space-y-1.5 max-w-md">
              <h3 className="text-lg font-bold text-white">How can KYRIOS assist you today?</h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                Upload PDFs and documents using the paperclip, ask questions about your files, manage tasks, or collaborate in any of your 10 life modes.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 w-full max-w-lg pt-2">
              <button
                onClick={() => setInput('What are my top live tasks and project deadlines today?')}
                className="p-3 text-left rounded-xl bg-white/[0.02] border border-white/5 hover:border-indigo-500/30 hover:bg-white/[0.04] text-xs text-slate-300 transition-all flex items-center justify-between"
              >
                <span>"Review my live tasks & deadlines"</span>
                <Sparkles className="w-3.5 h-3.5 text-indigo-400 shrink-0" />
              </button>
              <button
                onClick={() => setInput('What files and PDFs do I have indexed in my knowledge vault?')}
                className="p-3 text-left rounded-xl bg-white/[0.02] border border-white/5 hover:border-indigo-500/30 hover:bg-white/[0.04] text-xs text-slate-300 transition-all flex items-center justify-between"
              >
                <span>"Inspect my uploaded knowledge docs"</span>
                <FileText className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
              </button>
              <button
                onClick={() => setInput('Scaffold a full-stack TypeScript project structure for me.')}
                className="p-3 text-left rounded-xl bg-white/[0.02] border border-white/5 hover:border-indigo-500/30 hover:bg-white/[0.04] text-xs text-slate-300 transition-all flex items-center justify-between"
              >
                <span>"Scaffold a full-stack project"</span>
                <Sparkles className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
              </button>
              <button
                onClick={() => setInput('Give me a mindful check-in and an inspiring thought for today.')}
                className="p-3 text-left rounded-xl bg-white/[0.02] border border-white/5 hover:border-indigo-500/30 hover:bg-white/[0.04] text-xs text-slate-300 transition-all flex items-center justify-between"
              >
                <span>"Mindful check-in & reflection"</span>
                <Smile className="w-3.5 h-3.5 text-pink-400 shrink-0" />
              </button>
            </div>
          </div>
        ) : (
          messages.map((msg) => (
            <div
              key={msg.id}
              className={`flex gap-3 max-w-3xl ${msg.role === 'user' ? 'ml-auto flex-row-reverse' : 'mr-auto'}`}
            >
              {/* Avatar */}
              <div className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 text-white text-xs font-bold shadow-md ${
                msg.role === 'user'
                  ? 'bg-gradient-to-tr from-purple-600 to-indigo-600'
                  : 'bg-gradient-to-tr from-indigo-600 via-indigo-500 to-cyan-400'
              }`}>
                {msg.role === 'user' ? (
                  msg.moodEmoji || profile.name.charAt(0).toUpperCase()
                ) : (
                  <Bot className="w-4 h-4" />
                )}
              </div>

              {/* Message Content */}
              <div className="space-y-2 min-w-0 flex-1">
                <div className={`p-4 rounded-2xl border text-sm leading-relaxed backdrop-blur-md ${
                  msg.role === 'user'
                    ? 'bg-indigo-600/90 text-white border-indigo-500/40 rounded-tr-sm shadow-lg shadow-indigo-950/20'
                    : 'bg-[#111827]/85 text-slate-100 border-white/10 rounded-tl-sm shadow-xl'
                }`}>
                  {/* Attachments preview */}
                  {msg.attachments && msg.attachments.length > 0 && (
                    <div className="flex flex-wrap gap-2 mb-2 pb-2 border-b border-white/10">
                      {msg.attachments.map((att, i) => (
                        <div key={i} className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-black/30 text-xs text-slate-200 border border-white/10">
                          {att.name.endsWith('.pdf') ? <File className="w-3.5 h-3.5 text-rose-400" /> : <FileText className="w-3.5 h-3.5 text-indigo-300" />}
                          <span className="truncate max-w-[150px] font-mono">{att.name}</span>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Text Content */}
                  <div className="whitespace-pre-wrap font-sans break-words selection:bg-indigo-400/40">
                    {msg.content}
                  </div>

                  {/* Proposed Actions (Approval Cards) */}
                  {msg.proposedActions && msg.proposedActions.length > 0 && (
                    <div className="mt-3 space-y-2">
                      {msg.proposedActions.map((action) => (
                        <ActionApprovalCard
                          key={action.id}
                          action={action}
                          onApprove={handleActionApproved}
                          onReject={handleActionRejected}
                          onEdit={handleActionEdited}
                        />
                      ))}
                    </div>
                  )}

                  {/* Used Memories disclosure */}
                  {msg.usedMemories && msg.usedMemories.length > 0 && (
                    <div className="mt-3 pt-2.5 border-t border-white/5">
                      <button
                        onClick={() => setExpandedMemories(prev => ({ ...prev, [msg.id]: !prev[msg.id] }))}
                        className="flex items-center gap-1.5 text-[11px] text-indigo-400 hover:text-indigo-300 font-semibold transition-colors"
                      >
                        <Brain className="w-3.5 h-3.5" />
                        <span>Used {msg.usedMemories.length} long-term memories</span>
                      </button>

                      {expandedMemories[msg.id] && (
                        <div className="mt-2 space-y-1 bg-black/20 p-2 rounded-lg border border-white/5 text-xs text-slate-300 font-mono">
                          {msg.usedMemories.map((m, idx) => (
                            <div key={idx} className="flex items-start gap-1">
                              <span className="text-indigo-400">•</span>
                              <span>{m}</span>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  )}

                  {/* Citations / Grounded Sources */}
                  {msg.citations && msg.citations.length > 0 && (
                    <div className="mt-2.5 pt-2 border-t border-white/5 space-y-1">
                      <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider block">Grounded Sources:</span>
                      <div className="flex flex-wrap gap-1.5">
                        {msg.citations.map((c, idx) => (
                          <span key={idx} className="text-[10px] px-2.5 py-1 rounded-md bg-white/5 border border-white/10 text-slate-300 flex items-center gap-1.5 font-mono">
                            <ShieldCheck className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                            <span className="truncate max-w-[200px]">{c.title}</span>
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                {/* Footer action buttons & Telemetry */}
                <div className={`flex flex-wrap items-center gap-2 text-[10px] text-slate-400 px-1 pt-0.5 ${
                  msg.role === 'user' ? 'justify-end' : 'justify-between'
                }`}>
                  <div className="flex items-center gap-2">
                    <span>{msg.timestamp}</span>

                    {/* Performance Telemetry badge */}
                    {msg.role === 'assistant' && msg.telemetry && (
                      <div className="flex items-center gap-1.5 text-[10px] text-slate-300 font-mono bg-white/[0.04] border border-white/10 px-2 py-0.5 rounded-md shadow-xs">
                        <span className="flex items-center gap-1 text-emerald-400 font-medium">
                          <Zap className="w-3 h-3" />
                          <span>{msg.telemetry.ttftMs}ms TTFT</span>
                        </span>
                        {msg.telemetry.tokensPerSec ? (
                          <span className="text-slate-400">• {msg.telemetry.tokensPerSec} t/s</span>
                        ) : null}
                        <span className="text-indigo-300">• {msg.telemetry.modelUsed?.replace('gemini-', '')}</span>
                        {msg.telemetry.isFallback && (
                          <span className="px-1.5 py-0.2 rounded bg-amber-500/20 text-amber-300 border border-amber-500/30 text-[9px] font-sans font-semibold">
                            Fallback Active
                          </span>
                        )}
                      </div>
                    )}
                  </div>

                  {msg.role === 'assistant' && (
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => handleRegenerate(msg.id)}
                        disabled={aiState === 'processing'}
                        className="p-1 rounded hover:bg-white/10 text-slate-400 hover:text-indigo-300 disabled:opacity-40 transition-colors"
                        title="Regenerate response"
                      >
                        <RefreshCw className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => speakMessage(msg.id, msg.content)}
                        className={`p-1 rounded hover:bg-white/10 transition-colors ${
                          currentlySpeakingId === msg.id ? 'text-cyan-400' : 'text-slate-400 hover:text-white'
                        }`}
                        title="Read aloud"
                      >
                        {currentlySpeakingId === msg.id ? <VolumeX className="w-3.5 h-3.5" /> : <Volume2 className="w-3.5 h-3.5" />}
                      </button>
                      <button
                        onClick={() => handleCopy(msg.id, msg.content)}
                        className="p-1 rounded hover:bg-white/10 text-slate-400 hover:text-white transition-colors"
                        title="Copy message"
                      >
                        {copiedId === msg.id ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Floating Action & Input Bar */}
      <div className="pt-2 pb-3 px-2 relative z-20">
        {/* PDF/Document Loaded Context Notification Strip */}
        {latestUploadedDoc && (
          <div className="mb-2 p-3 rounded-2xl bg-gradient-to-r from-indigo-950/80 to-purple-950/80 border border-indigo-500/40 backdrop-blur-xl flex flex-col sm:flex-row sm:items-center justify-between gap-2 shadow-lg">
            <div className="flex items-center gap-2 text-xs text-white">
              <File className="w-4 h-4 text-rose-400 shrink-0" />
              <span className="font-bold truncate">{latestUploadedDoc.name}</span>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-white/10 text-indigo-300">
                {latestUploadedDoc.chunks} chunks indexed
              </span>
            </div>

            <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0">
              <button
                onClick={() => setInput(`Summarize the main points and key takeaways in "${latestUploadedDoc.name}"`)}
                className="px-2.5 py-1 rounded-lg bg-white/10 hover:bg-white/20 text-[11px] text-white whitespace-nowrap"
              >
                Summarize
              </button>
              <button
                onClick={() => setInput(`Extract all action items, decisions, and deadlines mentioned in "${latestUploadedDoc.name}"`)}
                className="px-2.5 py-1 rounded-lg bg-white/10 hover:bg-white/20 text-[11px] text-white whitespace-nowrap"
              >
                Action Items
              </button>
              <button
                onClick={() => setLatestUploadedDoc(null)}
                className="p-1 text-slate-400 hover:text-white ml-1"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        )}

        {/* Attachment preview chips */}
        {attachments.length > 0 && (
          <div className="flex flex-wrap gap-2 mb-2 p-2 rounded-xl bg-[#111827]/90 border border-white/10 backdrop-blur-md">
            {attachments.map((att, i) => (
              <div key={i} className="flex items-center gap-2 px-2.5 py-1 rounded-lg bg-white/5 text-xs text-white border border-white/10">
                {att.name.endsWith('.pdf') ? <File className="w-3.5 h-3.5 text-rose-400" /> : <FileText className="w-3.5 h-3.5 text-indigo-400" />}
                <span className="truncate max-w-[160px] font-mono">{att.name}</span>
                <button
                  onClick={() => setAttachments(prev => prev.filter((_, idx) => idx !== i))}
                  className="hover:text-rose-400"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
            ))}
          </div>
        )}

        {/* Parsing spinner */}
        {isParsingDocument && (
          <div className="mb-2 p-2 rounded-xl bg-indigo-950/60 border border-indigo-500/30 text-xs text-indigo-200 flex items-center gap-2">
            <div className="w-3.5 h-3.5 border-2 border-indigo-400 border-t-transparent rounded-full animate-spin" />
            <span>Parsing file & generating semantic embeddings for RAG...</span>
          </div>
        )}

        {/* Live mic transcript preview */}
        {isRecording && (
          <div className="mb-2 p-2.5 rounded-xl bg-emerald-950/40 border border-emerald-500/40 backdrop-blur-md flex items-center justify-between text-xs text-emerald-200">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-ping" />
              <span>{micTranscript || 'Listening to your speech... (speak clearly)'}</span>
            </div>
            <button
              onClick={toggleRecording}
              className="text-[11px] underline font-semibold text-emerald-300"
            >
              Done
            </button>
          </div>
        )}

        {/* Input box */}
        <div className="relative rounded-2xl bg-[#111827]/90 border border-white/10 shadow-2xl backdrop-blur-xl focus-within:border-indigo-500/60 transition-all p-2 flex items-end gap-2">
          {/* Hidden file input */}
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileSelect}
            multiple
            accept=".pdf,.txt,.md,.json,.csv,.ts,.tsx,.js,.py"
            className="hidden"
          />

          {/* Left tools: File attach + Mood picker */}
          <div className="flex items-center gap-1 pb-1">
            <button
              onClick={() => fileInputRef.current?.click()}
              className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-white/5 transition-colors"
              title="Attach PDF or document to ask questions"
            >
              <Paperclip className="w-4 h-4" />
            </button>

            <div className="relative">
              <button
                onClick={() => setShowMoodPicker(!showMoodPicker)}
                className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-white/5 transition-colors text-sm"
                title="Select mood emoji"
              >
                {selectedMoodEmoji}
              </button>

              {showMoodPicker && (
                <div className="absolute bottom-12 left-0 p-2 rounded-xl bg-[#0B0F17] border border-white/10 shadow-xl grid grid-cols-4 gap-1 z-50">
                  {moodEmojis.map((emoji) => (
                    <button
                      key={emoji}
                      onClick={() => {
                        setSelectedMoodEmoji(emoji);
                        setShowMoodPicker(false);
                      }}
                      className="p-1.5 rounded hover:bg-white/10 text-base"
                    >
                      {emoji}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Text Area */}
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                handleSendMessage();
              }
            }}
            placeholder={`Ask KYRIOS anything, or ask questions about your uploaded PDFs/files...`}
            rows={1}
            className="flex-1 bg-transparent border-0 resize-none text-sm text-white placeholder-slate-500 focus:outline-none py-2 px-1 max-h-32 min-h-[38px]"
          />

          {/* Right tools: Voice mic + Send button */}
          <div className="flex items-center gap-1 pb-1">
            <button
              onClick={toggleRecording}
              className={`p-2 rounded-xl transition-all ${
                isRecording
                  ? 'bg-rose-500 text-white animate-pulse shadow-lg shadow-rose-500/40'
                  : 'text-slate-400 hover:text-white hover:bg-white/5'
              }`}
              title={isRecording ? 'Stop Recording' : 'Voice Input (Hands-free / Push-to-talk)'}
            >
              {isRecording ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
            </button>

            <button
              onClick={handleSendMessage}
              disabled={(!input.trim() && attachments.length === 0) || aiState === 'processing'}
              className="p-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 disabled:opacity-40 disabled:hover:bg-indigo-600 text-white transition-all shadow-md shadow-indigo-600/30"
              title="Send (Enter)"
            >
              <Send className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
