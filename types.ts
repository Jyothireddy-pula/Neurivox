// types.ts
import React from 'react';
import { Type } from '@google/genai'; // Assuming Type enum from GenAI SDK for responseSchema

export type ThemeMode = 'light' | 'dark';

export enum PersonaKey {
  DEFAULT = 'Default',
  DEVELOPER = 'Developer',
  STUDENT = 'Student',
  RESEARCHER = 'Researcher',
  MARKETER = 'Marketer',
}

export interface PersonaProfile {
  key: PersonaKey;
  name: string;
  description: string;
  defaultPromptCategory?: PromptCategory; // E.g., for 'Developer', default to 'Code' prompts
  defaultTone?: 'friendly' | 'formal' | 'concise' | 'empathetic'; // For EmailWriter
}

export interface AIAction {
  id: string;
  name: string;
  description: string;
  icon: React.ReactNode;
  component: React.FC<AIActionProps>;
}

export interface AIActionProps {
  onActionComplete?: (result: string) => void;
  initialInput?: string;
  // For chat-like components (e.g., Text Analyzer)
  chatSession?: ChatSession;
  onUpdateChatSession?: (session: ChatSession) => void;
  // For debugging/logging
  onLogDebug?: (entry: DebugLogEntry) => void;
  debugLogs?: DebugLogEntry[];
  // For personalization features
  currentPersonaKey?: PersonaKey;
  onSelectPersona?: (key: PersonaKey) => void;
  themeMode?: ThemeMode;
  onSetThemeMode?: (mode: ThemeMode) => void;
  // For TTS
  onSpeakText?: (text: string) => void;
}

export enum WorkspaceKey {
  RESEARCH = 'Research',
  WRITING = 'CODE', // Renamed to WRITING to match existing label
  CODE = 'Code',
  SOCIAL = 'Social',
  ADVANCED = 'Advanced', // New workspace for Level 3 tools
  SETTINGS = 'Settings', // Added new workspace for Settings, to contain ApiConfig, PersonaManager, ThemeSwitcher
  DEVELOPER = 'Developer', // Added new workspace for Developer Tools
  INTEGRATIONS = 'Integrations', // Added new workspace for Integrations
  PRIVACY = 'Privacy', // Added new workspace for Privacy
  FUTURISTIC = 'Futuristic', // Added new workspace for Futuristic Add-ons
}

export interface Workspace {
  key: WorkspaceKey;
  label: string;
  icon: React.ReactNode;
  availableActions: AIAction[];
}

export interface ApiConfig {
  mode: 'cloud' | 'local';
  cloudProvider: 'gemini' | 'openai' | 'anthropic';
  localModel: 'ollama' | 'lmstudio';
  apiKey?: string; // Not directly managed by UI, but for conceptual representation
}

export enum PromptCategory {
  WRITING = 'Writing',
  CODE = 'Code',
  RESEARCH = 'Research',
  MARKETING = 'Marketing',
  GENERAL = 'General',
  VALIDATION = 'Validation', // Added for validation prompts
  AUTOMATION = 'Automation', // Added for automation prompts
}

// Fix: Define PromptVersion interface
export interface PromptVersion {
  timestamp: Date;
  name: string;
  description?: string;
  content: string;
  category: PromptCategory;
}

export interface PromptTemplate {
  id: string;
  name: string;
  category: PromptCategory;
  content: string; // Renamed from 'template' to 'content' for clarity
  description?: string;
  history?: PromptVersion[]; // Added for Smart Prompt History
}


// Fix: Separated GoogleMapsPlaceAnswerSource into its own interface for clearer typing
export interface GoogleMapsPlaceAnswerSource {
  reviewSnippets?: Array<{
    uri?: string; // Made optional
  }>;
}

export interface GroundingChunk {
  web?: {
    uri?: string; // Made optional
    title?: string; // Made optional
  };
  maps?: {
    uri?: string; // Made optional
    title?: string; // Made optional
    // Fix: Use the new GoogleMapsPlaceAnswerSource interface for placeAnswerSources array
    placeAnswerSources?: GoogleMapsPlaceAnswerSource[];
  };
}

// Fix: Define `AIStudio` interface for the shape of `window.aistudio` directly.
// This prevents the "Subsequent property declarations" error by providing a single, clear definition.
export interface AIStudio { // Renamed from IAIStudio to AIStudio
  hasSelectedApiKey: () => Promise<boolean>;
  openSelectKey: () => Promise<void>;
}

declare global {
  interface Window {
    // Fix: Directly reference the exported AIStudio type without path specifier.
    // TypeScript should resolve AIStudio from the current module context.
    aistudio?: AIStudio;
  }
}
// Removed the redundant export type AIStudio = NonNullable<Window['aistudio']>;
// as the interface itself is now named AIStudio and is directly applied to window.aistudio.


export enum LanguageCode {
  ENGLISH_US = 'en-US',
  ENGLISH_AU = 'en-AU',
  FRENCH = 'fr',
  SPANISH = 'es',
  GERMAN = 'de',
  ITALIAN = 'it',
  PORTUGUESE = 'pt',
  CHINESE = 'zh-CN',
  JAPANESE = 'ja',
  KOREAN = 'ko',
  ARABIC = 'ar',
  HINDI = 'hi',
  RUSSIAN = 'ru',
}

export interface ApiResponseFormat {
  type: Type;
  properties?: { [key: string]: ApiResponseFormat };
  items?: ApiResponseFormat;
  description?: string;
  required?: string[];
  propertyOrdering?: string[];
}

export enum ChatMessageType {
  USER = 'user',
  MODEL = 'model',
  TOOL_CALL = 'tool_call',
  TOOL_RESPONSE = 'tool_response',
}

export interface ChatMessage {
  id: string;
  type: ChatMessageType;
  content: string;
  timestamp: Date;
  // For text analyzer to store full responses including grounding chunks or tool calls
  fullResponse?: any;
}

export interface ChatSession {
  id: string;
  messages: ChatMessage[];
  title: string;
  lastUpdated: Date;
}

export enum DebugLogLevel {
  INFO = 'info',
  WARNING = 'warning',
  ERROR = 'error',
  API_CALL = 'api_call',
  API_RESPONSE = 'api_response',
  // New debug levels for specific scenarios
  API_KEY_MISSING = 'api_key_missing',
  MODEL_SELECTION = 'model_selection',
  CONTEXT_MEMORY = 'context_memory',
  AUTOMATION_STEP = 'automation_step',
  UI_EVENT = 'ui_event',
}

export interface DebugLogEntry {
  id: string;
  timestamp: Date;
  level: DebugLogLevel;
  message: string;
  details?: any;
}

export interface AutomationStep {
  actionId: string;
  inputKey?: string; // e.g., 'initialInput'
  outputKey?: string; // e.g., 'result'
  options?: Record<string, any>; // specific options for the action, e.g., 'emojiMode' for social commenter
}

export interface AutomationAction {
  id: string;
  name: string;
  description: string;
  steps: AutomationStep[];
}