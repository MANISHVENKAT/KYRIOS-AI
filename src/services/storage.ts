import {
  UserProfile,
  Message,
  Memory,
  Project,
  TaskItem,
  Habit,
  MoodEntry,
  DocumentItem,
  AuditLogEntry,
  LifeMode
} from '../types';
import { INITIAL_LIFE_MODES } from '../constants/lifeModes';

const STORAGE_KEYS = {
  PROFILE: 'kyrios_profile',
  MESSAGES: 'kyrios_messages',
  MEMORIES: 'kyrios_memories',
  PROJECTS: 'kyrios_projects',
  TASKS: 'kyrios_tasks',
  HABITS: 'kyrios_habits',
  MOOD: 'kyrios_mood',
  DOCUMENTS: 'kyrios_docs',
  AUDIT_LOGS: 'kyrios_audit_logs',
  CUSTOM_MODES: 'kyrios_custom_modes',
};

const DEFAULT_PROFILE: UserProfile = {
  name: 'Alex',
  nickname: 'Lex',
  friendTone: 'warm',
  feedbackStyle: 'gentle',
  personaTraits: ['creative', 'curious', 'organized'],
  ageGroup: 'adult',
  customInstructions: 'Prioritize clarity, depth, and actionable steps. Never invent facts.',
  voiceSpeed: 1.0,
  voicePitch: 1.0,
  theme: 'dark',
  language: 'English',
  privateMode: false,
  quietHoursEnabled: false
};

const DEFAULT_HABITS: Habit[] = [
  { id: '1', name: 'Morning Deep Hydration (500ml)', category: 'water', target: 1, unit: 'bottle', streak: 4, logDates: [new Date().toISOString().split('T')[0]] },
  { id: '2', name: '7+ Hours Restful Sleep', category: 'sleep', target: 7, unit: 'hours', streak: 6, logDates: [new Date().toISOString().split('T')[0]] },
  { id: '3', name: '20 Min Focus Walk or Workout', category: 'exercise', target: 20, unit: 'mins', streak: 2, logDates: [] },
  { id: '4', name: 'Master Coder Coding Practice', category: 'learning', target: 1, unit: 'session', streak: 5, logDates: [new Date().toISOString().split('T')[0]] }
];

const DEFAULT_MEMORIES: Memory[] = [
  {
    id: 'm1',
    category: 'preference',
    text: 'Prefers TypeScript with strict typing, Tailwind CSS, and modular component architecture.',
    importance: 'high',
    pinned: true,
    createdAt: new Date().toISOString()
  },
  {
    id: 'm2',
    category: 'personal_fact',
    text: 'Building KYRIOS AI as a trusted personal multimodal digital partner.',
    importance: 'high',
    pinned: true,
    createdAt: new Date().toISOString()
  },
  {
    id: 'm3',
    category: 'workflow',
    text: 'Likes morning daily briefings summarizing top 3 priority tasks and habit streaks.',
    importance: 'normal',
    pinned: false,
    createdAt: new Date().toISOString()
  }
];

const DEFAULT_PROJECTS: Project[] = [
  {
    id: 'proj-1',
    title: 'KYRIOS AI Architecture & Deployment',
    description: 'Design and polish the ultimate multimodal personal AI companion with complete privacy and full-stack control.',
    status: 'active',
    tags: ['AI', 'Productivity', 'FullStack'],
    deadline: '2026-11-15',
    notes: [
      {
        id: 'n1',
        title: 'Core Philosophy: Intelligence. Initiative. Control.',
        content: 'Every consequential tool execution must generate a user confirmation card. Zero hidden actions. Strict memory privacy and local persistence.',
        tags: ['architecture', 'security'],
        createdAt: new Date().toISOString()
      }
    ],
    taskIds: ['t1', 't2', 't3'],
    createdAt: new Date().toISOString()
  }
];

const DEFAULT_TASKS: TaskItem[] = [
  {
    id: 't1',
    title: 'Review today’s morning briefing & priority goals',
    completed: false,
    priority: 'high',
    dueDate: new Date().toISOString().split('T')[0],
    mode: 'work',
    projectId: 'proj-1',
    createdAt: new Date().toISOString()
  },
  {
    id: 't2',
    title: 'Test voice synthesis and live audio waveform input',
    completed: true,
    priority: 'medium',
    dueDate: new Date().toISOString().split('T')[0],
    mode: 'friend',
    projectId: 'proj-1',
    createdAt: new Date().toISOString(),
    completedAt: new Date().toISOString()
  },
  {
    id: 't3',
    title: 'Upload project documentation for semantic RAG grounding',
    completed: false,
    priority: 'high',
    dueDate: new Date(Date.now() + 86400000).toISOString().split('T')[0],
    mode: 'work',
    projectId: 'proj-1',
    createdAt: new Date().toISOString()
  }
];

// Helper safe JSON parse
function getLocal<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : fallback;
  } catch (e) {
    console.warn(`Error reading ${key} from storage:`, e);
    return fallback;
  }
}

function setLocal<T>(key: string, value: T): void {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch (e) {
    console.error(`Error saving ${key} to storage:`, e);
  }
}

export const StorageService = {
  // Profile
  getProfile(): UserProfile {
    return getLocal<UserProfile>(STORAGE_KEYS.PROFILE, DEFAULT_PROFILE);
  },
  saveProfile(profile: UserProfile): void {
    setLocal(STORAGE_KEYS.PROFILE, profile);
  },

  // Messages
  getMessages(): Message[] {
    return getLocal<Message[]>(STORAGE_KEYS.MESSAGES, []);
  },
  saveMessages(messages: Message[]): void {
    setLocal(STORAGE_KEYS.MESSAGES, messages);
  },
  addMessage(message: Message): void {
    const profile = this.getProfile();
    if (profile.privateMode) {
      // In private mode, do not persist to storage
      return;
    }
    const current = this.getMessages();
    setLocal(STORAGE_KEYS.MESSAGES, [...current, message]);
  },
  clearMessages(): void {
    setLocal(STORAGE_KEYS.MESSAGES, []);
  },

  // Memories
  getMemories(): Memory[] {
    return getLocal<Memory[]>(STORAGE_KEYS.MEMORIES, DEFAULT_MEMORIES);
  },
  saveMemories(memories: Memory[]): void {
    setLocal(STORAGE_KEYS.MEMORIES, memories);
  },
  addMemory(memory: Omit<Memory, 'id' | 'createdAt'>): Memory {
    const newMemory: Memory = {
      ...memory,
      id: 'mem-' + Math.random().toString(36).substring(2, 9),
      createdAt: new Date().toISOString()
    };
    const current = this.getMemories();
    this.saveMemories([newMemory, ...current]);
    this.logAction('save_memory', `Learned memory: "${newMemory.text.slice(0, 40)}..."`, 'approved', newMemory);
    return newMemory;
  },
  deleteMemory(id: string): void {
    const current = this.getMemories().filter(m => m.id !== id);
    this.saveMemories(current);
  },
  togglePinMemory(id: string): void {
    const current = this.getMemories().map(m => m.id === id ? { ...m, pinned: !m.pinned } : m);
    this.saveMemories(current);
  },

  // Projects
  getProjects(): Project[] {
    return getLocal<Project[]>(STORAGE_KEYS.PROJECTS, DEFAULT_PROJECTS);
  },
  saveProjects(projects: Project[]): void {
    setLocal(STORAGE_KEYS.PROJECTS, projects);
  },
  addProject(project: Omit<Project, 'id' | 'createdAt'>): Project {
    const newProj: Project = {
      ...project,
      id: 'proj-' + Math.random().toString(36).substring(2, 9),
      createdAt: new Date().toISOString()
    };
    const current = this.getProjects();
    this.saveProjects([newProj, ...current]);
    return newProj;
  },

  // Tasks
  getTasks(): TaskItem[] {
    return getLocal<TaskItem[]>(STORAGE_KEYS.TASKS, DEFAULT_TASKS);
  },
  saveTasks(tasks: TaskItem[]): void {
    setLocal(STORAGE_KEYS.TASKS, tasks);
  },
  addTask(task: Omit<TaskItem, 'id' | 'createdAt'>): TaskItem {
    const newTask: TaskItem = {
      ...task,
      id: 'task-' + Math.random().toString(36).substring(2, 9),
      createdAt: new Date().toISOString()
    };
    const current = this.getTasks();
    this.saveTasks([newTask, ...current]);
    this.logAction('create_task', `Created task: "${newTask.title}"`, 'approved', newTask);
    return newTask;
  },
  toggleTask(id: string): void {
    const current = this.getTasks().map(t => {
      if (t.id === id) {
        const nextCompleted = !t.completed;
        return {
          ...t,
          completed: nextCompleted,
          completedAt: nextCompleted ? new Date().toISOString() : undefined
        };
      }
      return t;
    });
    this.saveTasks(current);
  },
  deleteTask(id: string): void {
    const current = this.getTasks().filter(t => t.id !== id);
    this.saveTasks(current);
  },

  // Habits
  getHabits(): Habit[] {
    return getLocal<Habit[]>(STORAGE_KEYS.HABITS, DEFAULT_HABITS);
  },
  saveHabits(habits: Habit[]): void {
    setLocal(STORAGE_KEYS.HABITS, habits);
  },
  toggleHabitToday(id: string): void {
    const today = new Date().toISOString().split('T')[0];
    const current = this.getHabits().map(h => {
      if (h.id === id) {
        const isLogged = h.logDates.includes(today);
        let newDates = isLogged ? h.logDates.filter(d => d !== today) : [...h.logDates, today];
        let newStreak = isLogged ? Math.max(0, h.streak - 1) : h.streak + 1;
        return { ...h, logDates: newDates, streak: newStreak };
      }
      return h;
    });
    this.saveHabits(current);
  },

  // Mood Entries
  getMoodEntries(): MoodEntry[] {
    return getLocal<MoodEntry[]>(STORAGE_KEYS.MOOD, [
      {
        id: 'mood-init',
        date: new Date().toISOString().split('T')[0],
        emoji: '⚡',
        moodLabel: 'Energized & Focused',
        score: 5,
        gratitudeNote: 'Grateful for having creative freedom and building this partner app.',
        reflection: 'Ready to bring ideas to reality with calm precision.',
        createdAt: new Date().toISOString()
      }
    ]);
  },
  addMoodEntry(entry: Omit<MoodEntry, 'id' | 'createdAt'>): MoodEntry {
    const newEntry: MoodEntry = {
      ...entry,
      id: 'mood-' + Math.random().toString(36).substring(2, 9),
      createdAt: new Date().toISOString()
    };
    const current = this.getMoodEntries();
    setLocal(STORAGE_KEYS.MOOD, [newEntry, ...current]);
    return newEntry;
  },

  // Documents (RAG)
  getDocuments(): DocumentItem[] {
    return getLocal<DocumentItem[]>(STORAGE_KEYS.DOCUMENTS, []);
  },
  saveDocuments(docs: DocumentItem[]): void {
    setLocal(STORAGE_KEYS.DOCUMENTS, docs);
  },
  addDocument(doc: DocumentItem): void {
    const current = this.getDocuments();
    this.saveDocuments([doc, ...current]);
    this.logAction('upload_document', `Indexed document: "${doc.name}" (${doc.chunks.length} chunks)`, 'executed', { name: doc.name, size: doc.size });
  },
  deleteDocument(id: string): void {
    const current = this.getDocuments().filter(d => d.id !== id);
    this.saveDocuments(current);
  },

  // Audit Logs
  getAuditLogs(): AuditLogEntry[] {
    return getLocal<AuditLogEntry[]>(STORAGE_KEYS.AUDIT_LOGS, []);
  },
  logAction(actionType: string, summary: string, status: AuditLogEntry['status'], details?: Record<string, any>): void {
    const entry: AuditLogEntry = {
      id: 'log-' + Math.random().toString(36).substring(2, 9),
      timestamp: new Date().toISOString(),
      actionType,
      summary,
      status,
      details
    };
    const current = this.getAuditLogs();
    setLocal(STORAGE_KEYS.AUDIT_LOGS, [entry, ...current.slice(0, 99)]);
  },

  // Custom Modes
  getCustomModes(): LifeMode[] {
    return getLocal<LifeMode[]>(STORAGE_KEYS.CUSTOM_MODES, []);
  },
  addCustomMode(mode: LifeMode): void {
    const current = this.getCustomModes();
    setLocal(STORAGE_KEYS.CUSTOM_MODES, [...current, mode]);
  },

  // Export & Wipe
  exportAllData(): { json: string; markdown: string } {
    const fullDump = {
      exportedAt: new Date().toISOString(),
      profile: this.getProfile(),
      memories: this.getMemories(),
      tasks: this.getTasks(),
      projects: this.getProjects(),
      habits: this.getHabits(),
      moodHistory: this.getMoodEntries(),
      documents: this.getDocuments().map(d => ({ id: d.id, name: d.name, size: d.size, uploadedAt: d.uploadedAt })),
      auditLogs: this.getAuditLogs(),
    };

    const json = JSON.stringify(fullDump, null, 2);

    let md = `# KYRIOS AI Data Export\n*Exported on: ${new Date().toLocaleString()}*\n\n`;
    md += `## Profile\n- **Name**: ${fullDump.profile.name}\n- **Tone**: ${fullDump.profile.friendTone}\n- **Instructions**: ${fullDump.profile.customInstructions}\n\n`;
    md += `## Long-Term Memories (${fullDump.memories.length})\n`;
    fullDump.memories.forEach((m, i) => {
      md += `${i + 1}. [${m.category.toUpperCase()}] ${m.text} *(Importance: ${m.importance})*\n`;
    });
    md += `\n## Projects (${fullDump.projects.length})\n`;
    fullDump.projects.forEach(p => {
      md += `### ${p.title} (${p.status})\n${p.description}\n`;
    });
    md += `\n## Active Tasks (${fullDump.tasks.length})\n`;
    fullDump.tasks.forEach(t => {
      md += `- [${t.completed ? 'x' : ' '}] **${t.title}** (Priority: ${t.priority}, Due: ${t.dueDate || 'None'})\n`;
    });

    return { json, markdown: md };
  },

  wipeAllData(): void {
    Object.values(STORAGE_KEYS).forEach(k => localStorage.removeItem(k));
  }
};
