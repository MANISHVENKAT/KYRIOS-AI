export type Priority = 'low' | 'medium' | 'high' | 'urgent';
export type MemoryCategory = 'personal_fact' | 'preference' | 'project_decision' | 'workflow' | 'instruction';
export type ActionStatus = 'pending' | 'approved' | 'rejected' | 'edited';
export type AIState = 'idle' | 'listening' | 'processing' | 'speaking';

export interface ProposedAction {
  id: string;
  type: 'task' | 'note' | 'memory' | 'reminder' | 'code_scaffold';
  status: ActionStatus;
  title: string;
  data: Record<string, any>;
  createdAt: string;
}

export interface Attachment {
  name: string;
  mimeType: string;
  data: string; // base64
  size?: number;
}

export interface Message {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: string;
  attachments?: Attachment[];
  usedMemories?: string[];
  citations?: Array<{ title: string; snippet?: string; source?: string }>;
  proposedActions?: ProposedAction[];
  mode?: string;
  moodEmoji?: string;
}

export interface Memory {
  id: string;
  category: MemoryCategory;
  text: string;
  importance: 'normal' | 'high';
  pinned?: boolean;
  mode?: string;
  disabled?: boolean;
  createdAt: string;
  updatedAt?: string;
}

export interface TaskItem {
  id: string;
  title: string;
  completed: boolean;
  priority: Priority;
  dueDate?: string;
  mode?: string;
  category?: string;
  projectId?: string;
  createdAt: string;
  completedAt?: string;
}

export interface ProjectNote {
  id: string;
  title: string;
  content: string;
  tags?: string[];
  createdAt: string;
  updatedAt?: string;
}

export interface Project {
  id: string;
  title: string;
  description: string;
  status: 'planning' | 'active' | 'completed' | 'paused';
  tags: string[];
  deadline?: string;
  notes: ProjectNote[];
  taskIds: string[];
  createdAt: string;
}

export interface Habit {
  id: string;
  name: string;
  category: 'sleep' | 'water' | 'exercise' | 'routine' | 'learning';
  target: number;
  unit: string;
  streak: number;
  logDates: string[]; // YYYY-MM-DD
  icon?: string;
}

export interface MoodEntry {
  id: string;
  date: string; // YYYY-MM-DD
  emoji: string;
  moodLabel: string;
  score: number; // 1-5
  gratitudeNote?: string;
  reflection?: string;
  tags?: string[];
  createdAt: string;
}

export interface DocumentItem {
  id: string;
  name: string;
  size: number;
  mimeType: string;
  text: string;
  chunks: string[];
  uploadedAt: string;
}

export interface AuditLogEntry {
  id: string;
  timestamp: string;
  actionType: string;
  summary: string;
  status: 'approved' | 'rejected' | 'executed' | 'cancelled';
  details?: Record<string, any>;
}

export interface UserProfile {
  name: string;
  nickname: string;
  friendTone: 'warm' | 'chill' | 'cheerful' | 'calm' | 'witty';
  feedbackStyle: 'gentle' | 'direct';
  personaTraits: string[];
  ageGroup: 'adult' | 'teen';
  customInstructions: string;
  appPin?: string; // App lock PIN
  isLocked?: boolean;
  privateMode?: boolean; // Ephemeral mode
  voiceSpeed: number; // 0.8 - 1.4
  voicePitch: number;
  preferredVoice?: string;
  theme: 'dark' | 'light' | 'amoled';
  language: string;
  quietHoursEnabled?: boolean;
}

export interface LifeMode {
  id: string;
  name: string;
  tagline: string;
  iconName: string;
  color: string;
  systemPrompt: string;
  isCustom?: boolean;
}
