// constants.ts
import React from 'react';
import { Workspace, WorkspaceKey, AIActionProps, LanguageCode, ApiResponseFormat, PromptCategory, PersonaKey, PersonaProfile } from './types';
import { GrammarFixer } from './components/GrammarFixer';
import { Summarizer } from './components/Summarizer';
import { SocialMediaCommenter } from './components/SocialMediaCommenter';
import { Translator } from './components/Translator';
import { Rewriter } from './components/Rewriter';
import { TextAnalyzer } from './components/TextAnalyzer';
import { KeywordExtractor } from './components/KeywordExtractor';
import { EmailWriter } from './components/EmailWriter';
import { DataExtractor } from './components/DataExtractor';
import { FileUploadSummarizer } from './components/FileUploadSummarizer';
import { PromptFactory } from './components/PromptFactory';
import { ValidationEngine } from './components/ValidationEngine';
import { DebuggingTools } from './components/DebuggingTools';
import { AutomationActions } from './components/AutomationActions';
import { CodeReviewer } from './components/CodeReviewer'; 
import { VoiceControl } from './components/VoiceControl'; // New: Voice Control
import { VisionIntegration } from './components/VisionIntegration'; // New: Vision Integration
import { LLMSwitchOptimizer } from './components/LLMSwitchOptimizer'; // New: LLM Switch Optimizer
import { GenericAIAction } from './components/GenericAIAction'; // New: Generic AI Action for common placeholders


import { Type } from '@google/genai';


// Converted icon component declarations from JSX to React.createElement for robustness.
// Fix: Updated icon components to accept and pass React.SVGProps<SVGSVGElement>
// Fix: Changed "svg" to 'svg' for string literal consistency in React.createElement
const TextIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => {
  return React.createElement(
    'svg',
    { ...props, className: `w-5 h-5 ${props.className || ''}`, fill: "none", stroke: "currentColor", viewBox: "0 0 24 24", xmlns: "http://www.w3.org/2000/svg" },
    React.createElement("path", { strokeLinecap: "round", strokeLinejoin: "round", strokeWidth: "2", d: "M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" })
  );
};
const BookIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => {
  return React.createElement(
    'svg',
    { ...props, className: `w-5 h-5 ${props.className || ''}`, fill: "none", stroke: "currentColor", viewBox: "0 0 24 24", xmlns: "http://www.w3.org/2000/svg" },
    React.createElement("path", { strokeLinecap: "round", strokeLinejoin: "round", strokeWidth: "2", d: "M12 6.253v13m0-13C10.832 5.477 9.206 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.794 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.794 5 16.5 5c1.706 0 3.332.477 4.5 1.253v13C19.832 18.477 18.206 18 16.5 18c-1.706 0-3.332.477-4.5 1.253" })
  );
};
const CodeIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => {
  return React.createElement(
    'svg',
    { ...props, className: `w-5 h-5 ${props.className || ''}`, fill: "none", stroke: "currentColor", viewBox: "0 0 24 24", xmlns: "http://www.w3.org/2000/svg" },
    React.createElement("path", { strokeLinecap: "round", strokeLinejoin: "round", strokeWidth: "2", d: "M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" })
  );
};
const UsersIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => {
  return React.createElement(
    'svg',
    { ...props, className: `w-5 h-5 ${props.className || ''}`, fill: "none", stroke: "currentColor", viewBox: "0 0 24 24", xmlns: "http://www.w3.org/2000/svg" },
    React.createElement("path", { strokeLinecap: "round", strokeLinejoin: "round", strokeWidth: "2", d: "M17 20h5v-2a3 3 0 00-5.356-1.857M17 20v-2c0-.653-.134-1.3-.393-1.9M12 18V5m0 0l-3 3m3-3l3 3m-9 11h9.231C18.785 19.109 20 18.156 20 17c0-1.222-1.39-2.001-2.915-1.5M4 19v-2c0-1.222-1.39-2.001-2.915-1.5m2.915 1.5H9" })
  );
};

// Moved SettingsIcon definition here from Sidebar.tsx and converted to React.createElement
export const SettingsIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => {
  return React.createElement(
    'svg',
    { ...props, className: `w-5 h-5 ${props.className || ''}`, fill: "none", stroke: "currentColor", viewBox: "0 0 24 24", xmlns: "http://www.w3.org/2000/svg" },
    React.createElement("path", { strokeLinecap: "round", strokeLinejoin: "round", strokeWidth: "2", d: "M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" }),
    React.createElement("path", { strokeLinecap: "round", strokeLinejoin: "round", strokeWidth: "2", d: "M15 12a3 3 0 11-6 0 3 3 0 016 0z" })
  );
};

// New Icons (Converted to React.createElement)
const ChatIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => {
  return React.createElement(
    'svg',
    { ...props, className: `w-5 h-5 ${props.className || ''}`, fill: "none", stroke: "currentColor", viewBox: "0 0 24 24", xmlns: "http://www.w3.org/2000/svg" },
    React.createElement("path", { strokeLinecap: "round", strokeLinejoin: "round", strokeWidth: "2", d: "M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" })
  );
};

const GlobeIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => {
  return React.createElement(
    'svg',
    { ...props, className: `w-5 h-5 ${props.className || ''}`, fill: "none", stroke: "currentColor", viewBox: "0 0 24 24", xmlns: "http://www.w3.org/2000/svg" },
    React.createElement("path", { strokeLinecap: "round", strokeLinejoin: "round", strokeWidth: "2", d: "M3 5h12M9 3v2m1.048 9.5A18.022 18.022 0 0115 10c0 1.01-.299 2.774-1.282 4.125m.603-4.125c1.354-.853 2.249-2.12 2.73-3.627m-4.5 5.257V12a8.96 8.96 0 00-1.753-3.799M12 21c4.97 0 9-3.651 9-8s-4.03-8-9-8-9 3.651-9 8 4.03 8 9 8z" })
  );
};

const PencilIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => {
  return React.createElement(
    'svg',
    { ...props, className: `w-5 h-5 ${props.className || ''}`, fill: "none", stroke: "currentColor", viewBox: "0 0 24 24", xmlns: "http://www.w3.org/2000/svg" },
    React.createElement("path", { strokeLinecap: "round", strokeLinejoin: "round", strokeWidth: "2", d: "M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" })
  );
};

const SearchIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => {
  return React.createElement(
    'svg',
    { ...props, className: `w-5 h-5 ${props.className || ''}`, fill: "none", stroke: "currentColor", viewBox: "0 0 24 24", xmlns: "http://www.w3.org/2000/svg" },
    React.createElement("path", { strokeLinecap: "round", strokeLinejoin: "round", strokeWidth: "2", d: "M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" })
  );
};

const MailIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => {
  return React.createElement(
    'svg',
    { ...props, className: `w-5 h-5 ${props.className || ''}`, fill: "none", stroke: "currentColor", viewBox: "0 0 24 24", xmlns: "http://www.w3.org/2000/svg" },
    React.createElement("path", { strokeLinecap: "round", strokeLinejoin: "round", strokeWidth: "2", d: "M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" })
  );
};

const TableIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => {
  return React.createElement(
    'svg',
    { ...props, className: `w-5 h-5 ${props.className || ''}`, fill: "none", stroke: "currentColor", viewBox: "0 0 24 24", xmlns: "http://www.w3.org/2000/svg" },
    React.createElement("path", { strokeLinecap: "round", strokeLinejoin: "round", strokeWidth: "2", d: "M3 10h18M3 14h18m-9-4v8m-10 0h18a2 2 0 002-2V8a2 2 0 00-2-2H3a2 2 0 00-2 2v8a2 2 0 002 2z" })
  );
};

const DatabaseIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => {
  return React.createElement(
    'svg',
    { ...props, className: `w-5 h-5 ${props.className || ''}`, fill: "none", stroke: "currentColor", viewBox: "0 0 24 24", xmlns: "http://www.w3.org/2000/svg" },
    React.createElement("path", { strokeLinecap: "round", strokeLinejoin: "round", strokeWidth: "2", d: "M4 7v10m0 0l-2 2m2-2l2 2m0-10h16m0 0l-2-2m2 2l-2 2M6 5v14M18 5v14" })
  );
};

const TestTubeIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => {
  return React.createElement(
    'svg',
    { ...props, className: `w-5 h-5 ${props.className || ''}`, fill: "none", stroke: "currentColor", viewBox: "0 0 24 24", xmlns: "http://www.w3.org/2000/svg" },
    React.createElement("path", { strokeLinecap: "round", strokeLinejoin: "round", strokeWidth: "2", d: "M19.428 15.428a2 2 0 00-1.022-.547l-2.007-.444a5.002 5.002 0 01-2.006-.547m0 0V9.5m0 3.5a1.5 1.5 0 01-3 0V9.5m0 0a1.5 1.5 0 00-3 0V4.5c0-1.11.895-2 2-2h0c1.11 0 2 .895 2 2M7.428 15.428a2 2 0 01-1.022-.547l-2.007-.444A5.002 5.002 0 013.25 10.5m0 0V9.5m0 3.5a1.5 1.5 0 01-3 0V9.5m0 0a1.5 1.5 0 00-3 0V4.5c0-1.11.895-2 2-2h0c1.11 0 2 .895 2 2" })
  );
};

const BugIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => {
  return React.createElement(
    'svg',
    { ...props, className: `w-5 h-5 ${props.className || ''}`, fill: "none", stroke: "currentColor", viewBox: "0 0 24 24", xmlns: "http://www.w3.org/2000/svg" },
    React.createElement("path", { strokeLinecap: "round", strokeLinejoin: "round", strokeWidth: "2", d: "M9 12H7m5 0h2m5.05 4.95A10 10 0 0112 21c-3.12 0-5.94-.7-8.35-2.05m14.7-4.9c-.31-.83-.71-1.63-1.19-2.37M21 12H3m14 0c-.31-.83-.71-1.63-1.19-2.37m-1.74-.75c-.71-1.03-1.57-1.95-2.5-2.75M12 3v3m-3-1l.75-.75m4.5 0L15 2.25M12 18v3m-3 1l.75.75m4.5 0L15 21.75" })
  );
};

const AutomationIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => {
  return React.createElement(
    'svg',
    { ...props, className: `w-5 h-5 ${props.className || ''}`, fill: "none", stroke: "currentColor", viewBox: "0 0 24 24", xmlns: "http://www.w3.org/2000/svg" },
    React.createElement("path", { strokeLinecap: "round", strokeLinejoin: "round", strokeWidth: "2", d: "M4 6h16M4 12h16m-7 6h7" })
  );
};

const UploadIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => {
  return React.createElement(
    'svg',
    { ...props, className: `w-5 h-5 ${props.className || ''}`, fill: "none", stroke: "currentColor", viewBox: "0 0 24 24", xmlns: "http://www.w3.org/2000/svg" },
    React.createElement("path", { strokeLinecap: "round", strokeLinejoin: "round", strokeWidth: "2", d: "M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" })
  );
};

const PromptIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => {
  return React.createElement(
    'svg',
    { ...props, className: `w-5 h-5 ${props.className || ''}`, fill: "none", stroke: "currentColor", viewBox: "0 0 24 24", xmlns: "http://www.w3.org/2000/svg" },
    React.createElement("path", { strokeLinecap: "round", strokeLinejoin: "round", strokeWidth: "2", d: "M7 8h10M7 12h4m1 8l-4-4H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-3l-4 4z" })
  );
};

// New Icons (Converted to React.createElement)
const HistoryIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => React.createElement('svg', { ...props, className: `w-5 h-5 ${props.className || ''}`, fill: "none", stroke: "currentColor", viewBox: "0 0 24 24", xmlns: "http://www.w3.org/2000/svg" },
  React.createElement("path", { strokeLinecap: "round", strokeLinejoin: "round", strokeWidth: "2", d: "M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" }));

const UserIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => React.createElement('svg', { ...props, className: `w-5 h-5 ${props.className || ''}`, fill: "none", stroke: "currentColor", viewBox: "0 0 24 24", xmlns: "http://www.w3.org/2000/svg" },
  React.createElement("path", { strokeLinecap: "round", strokeLinejoin: "round", strokeWidth: "2", d: "M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" }));

const CodeReviewIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => React.createElement('svg', { ...props, className: `w-5 h-5 ${props.className || ''}`, fill: "none", stroke: "currentColor", viewBox: "0 0 24 24", xmlns: "http://www.w3.org/2000/svg" },
  React.createElement("path", { strokeLinecap: "round", strokeLinejoin: "round", strokeWidth: "2", d: "M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" }));

const BugFillIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => React.createElement('svg', { ...props, className: `w-5 h-5 ${props.className || ''}`, fill: "currentColor", viewBox: "0 0 24 24", xmlns: "http://www.w3.org/2000/svg" },
  React.createElement("path", { fillRule: "evenodd", d: "M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.83 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.953 0-1.09.39-1.983 1.029-2.682-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.022A9.607 9.607 0 0112 6.844c.85.004 1.70.115 2.5.357 1.909-1.292 2.747-1.022 2.747-1.022.546 1.379.203 2.398.098 2.65.64.699 1.029 1.592 1.029 2.682 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z", clipRule: "evenodd" }));

const PaletteIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => React.createElement('svg', { ...props, className: `w-5 h-5 ${props.className || ''}`, fill: "none", stroke: "currentColor", viewBox: "0 0 24 24", xmlns: "http://www.w3.org/2000/svg" },
  React.createElement("path", { strokeLinecap: "round", strokeLinejoin: "round", strokeWidth: "2", d: "M7 21a4 4 0 01-4-4V5a2 2 0 012-2h14a2 2 0 012 2v12a4 4 0 01-4 4h-4a2 2 0 01-2-2v-2a2 2 0 00-2-2H9a2 2 0 00-2 2v2a2 2 0 01-2 2zm10-7h2m-4 0h-2m-4 0H7m6 0v-2m-4 2v-2m-4 2v-2" }));

const VoiceIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => React.createElement('svg', { ...props, className: `w-5 h-5 ${props.className || ''}`, fill: "none", stroke: "currentColor", viewBox: "0 0 24 24", xmlns: "http://www.w3.org/2000/svg" },
  React.createElement("path", { strokeLinecap: "round", strokeLinejoin: "round", strokeWidth: "2", d: "M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a4 4 0 11-8 0 4 4 0 018 0z" }));

const EyeIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => React.createElement('svg', { ...props, className: `w-5 h-5 ${props.className || ''}`, fill: "none", stroke: "currentColor", viewBox: "0 0 24 24", xmlns: "http://www.w3.org/2000/svg" },
  React.createElement("path", { strokeLinecap: "round", strokeLinejoin: "round", strokeWidth: "2", d: "M15 12a3 3 0 11-6 0 3 3 0 016 0z" }),
  React.createElement("path", { strokeLinecap: "round", strokeLinejoin: "round", strokeWidth: "2", d: "M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" }));

const MicrochipIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => React.createElement('svg', { ...props, className: `w-5 h-5 ${props.className || ''}`, fill: "none", stroke: "currentColor", viewBox: "0 0 24 24", xmlns: "http://www.w3.org/2000/svg" },
  React.createElement("path", { strokeLinecap: "round", strokeLinejoin: "round", strokeWidth: "2", d: "M5 3v4M3 5h4m6 0v4m-2-2h4m5-2v4m-2-2h4M9 21v-4m-2 2h4m6 0v-4m-2 2h4M7 9h10a2 2 0 012 2v6a2 2 0 01-2 2H7a2 2 0 01-2-2v-6a2 2 0 012-2zM4 11h2m-2 2h2m-2 2h2m14-4h2m-2 2h2m-2 2h2" }));

export const BrainIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => React.createElement('svg', { ...props, className: `w-5 h-5 ${props.className || ''}`, fill: "none", stroke: "currentColor", viewBox: "0 0 24 24", xmlns: "http://www.w3.org/2000/svg" },
  React.createElement("path", { strokeLinecap: "round", strokeLinejoin: "round", strokeWidth: "2", d: "M9 13a6 6 0 01-6-6V5a2 2 0 012-2h2a2 2 0 012 2v2a6 6 0 01-6 6zM15 13a6 6 0 006-6V5a2 2 0 00-2-2h-2a2 2 0 00-2 2v2a6 6 0 006 6zM9 21a6 6 0 01-6-6v-2a2 2 0 012-2h2a2 2 0 012 2v2a6 6 0 01-6 6zM15 21a6 6 0 006-6v-2a2 2 0 00-2-2h-2a2 2 0 00-2 2v2a6 6 0 006 6z" }));

const GlobeAltIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => React.createElement('svg', { ...props, className: `w-5 h-5 ${props.className || ''}`, fill: "none", stroke: "currentColor", viewBox: "0 0 24 24", xmlns: "http://www.w3.org/2000/svg" },
  React.createElement("path", { strokeLinecap: "round", strokeLinejoin: "round", strokeWidth: "2", d: "M12 1.5l.75 3.375m-1.5 0L12 1.5m.75 3.375V6a2.25 2.25 0 01-2.25 2.25H7.5A2.25 2.25 0 005.25 10.5v11.25H3.75V10.5A3.75 3.75 0 017.5 6.75h2.25A2.25 2.25 0 0112 4.5V1.5z" }),
  React.createElement("path", { strokeLinecap: "round", strokeLinejoin: "round", strokeWidth: "2", d: "M12 1.5h-.001M17.25 10.5V6.75h-2.25A3.75 3.75 0 0111.25 3H7.5A3.75 3.75 0 013.75 6.75V10.5c0 1.242.44 2.383 1.18 3.25L12 22.5l7.07-8.75C20.81 12.883 21.25 11.742 21.25 10.5V6.75h-2.25z" }));

const ThemeIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => React.createElement('svg', { ...props, className: `w-5 h-5 ${props.className || ''}`, fill: "none", stroke: "currentColor", viewBox: "0 0 24 24", xmlns: "http://www.w3.org/2000/svg" },
  React.createElement("path", { strokeLinecap: "round", strokeLinejoin: "round", strokeWidth: "2", d: "M7.066 3.077A9.458 9.458 0 0012 21.5a9.458 9.458 0 004.934-18.423a2.25 2.25 0 01-2.288 3.55c-1.397.098-2.502 1.176-2.502 2.572C12.144 11.275 10 11.082 10 9a2.25 2.25 0 01-2.288-3.55zM12 3a9.75 9.75 0 00-6.113 16.736A9.75 9.75 0 0012 3z" }));

const TestScriptIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => React.createElement('svg', { ...props, className: `w-5 h-5 ${props.className || ''}`, fill: "none", stroke: "currentColor", viewBox: "0 0 24 24", xmlns: "http://www.w3.org/2000/svg" },
  React.createElement("path", { strokeLinecap: "round", strokeLinejoin: "round", strokeWidth: "2", d: "M9.75 17.25v1.007a.75.75 0 01-.75.75H5.25a.75.75 0 01-.75-.75V8.406a1.5 1.5 0 011.5-1.5h1.968c.355 0 .695.163.926.447l2.234 2.768c.39.48.971.758 1.584.758h.273a2.25 2.25 0 002.25-2.25v-.877m-12.247 0h7.502m-7.502 0v-.877a1.5 1.5 0 011.5-1.5H7.5M12 9.75V12h3.75M4.5 21l-1.5-1.5m18 0l-1.5 1.5m-16.5 0h1.5a2.25 2.25 0 002.25-2.25V17.25h1.5m-5.25-.75L9 15m0 0a2.25 2.25 0 012.25 2.25v2.25M15 17.25h1.5A2.25 2.25 0 0018.75 15v-1.5m-5.25.75L15 15m0 0a2.25 2.25 0 002.25 2.25v2.25m-1.5 0H21" }));

const WebAuditIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => React.createElement('svg', { ...props, className: `w-5 h-5 ${props.className || ''}`, fill: "none", stroke: "currentColor", viewBox: "0 0 24 24", xmlns: "http://www.w3.org/2000/svg" },
  React.createElement("path", { strokeLinecap: "round", strokeLinejoin: "round", strokeWidth: "2", d: "M9 17.25v-.877m-2 2.627V17.25m-2 0v-.877a.75.75 0 01.75-.75h.923c.355 0 .695.163.926.447l.865 1.071m0-2.148V17.25m-2 2.627a.75.75 0 01-.75.75H4.25a.75.75 0 01-.75-.75V8.406A1.5 1.5 0 015.25 6.91H7.5m4.249-.877L15 8.406M17.25 6.91h-2.25m2.25 0V8.406m0-2.148V17.25m0 2.627a.75.75 0 01-.75.75h-1.026a.75.75 0 01-.75-.75V17.25m-5.25 2.627v-.877m2.25-.877V17.25m0-2.148V17.25m2.25 0v-.877a.75.75 0 01.75-.75h.923c.355 0 .695.163.926.447l.865 1.071m0-2.148V17.25m-2 2.627a.75.75 0 01-.75.75h-1.026a.75.75 0 01-.75-.75V17.25M7.5 9.75h9M3.75 12h16.5M3.75 14.25h16.5M3.75 16.5h16.5M3.75 18.75h16.5" }));

const IntegrateIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => React.createElement('svg', { ...props, className: `w-5 h-5 ${props.className || ''}`, fill: "none", stroke: "currentColor", viewBox: "0 0 24 24", xmlns: "http://www.w3.org/2000/svg" },
  React.createElement("path", { strokeLinecap: "round", strokeLinejoin: "round", strokeWidth: "2", d: "M7.5 14.25v2.25m-.75-7.5h1.5m-1.5 0h1.5m-1.5 0v1.5m1.5-1.5v1.5m1.5-1.5v1.5M7.5 14.25v2.25m-1.5 2.25h1.5m-1.5 0h1.5m-1.5 0v1.5m1.5-1.5v1.5m1.5-1.5v1.5M10.5 14.25v2.25m-.75-7.5h1.5m-1.5 0h1.5m-1.5 0v1.5m1.5-1.5v1.5m1.5-1.5v1.5M13.5 14.25v2.25m-.75-7.5h1.5m-1.5 0h1.5m-1.5 0v1.5m1.5-1.5v1.5m1.5-1.5v1.5M16.5 14.25v2.25m-.75-7.5h1.5m-1.5 0h1.5m-1.5 0v1.5m1.5-1.5v1.5m1.5-1.5v1.5" }));

const ShieldIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => React.createElement('svg', { ...props, className: `w-5 h-5 ${props.className || ''}`, fill: "none", stroke: "currentColor", viewBox: "0 0 24 24", xmlns: "http://www.w3.org/2000/svg" },
  React.createElement("path", { strokeLinecap: "round", strokeLinejoin: "round", strokeWidth: "2", d: "M9 12l2 2 4-4m5.636 2.864a2 2 0 000-2.828 2 2 0 00-2.828 0c-.753.753-1.662 1.258-2.652 1.503M4 12V4a2 2 0 012-2h12a2 2 0 012 2v8a2 2 0 01-2 2H6a2 2 0 01-2-2z" }));

// NEW: GitHub Icon
export const GithubIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => React.createElement('svg', { ...props, className: `w-5 h-5 ${props.className || ''}`, fill: "currentColor", viewBox: "0 0 24 24", xmlns: "http://www.w3.org/2000/svg" },
  React.createElement("path", { fillRule: "evenodd", d: "M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.83 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.953 0-1.09.39-1.983 1.029-2.682-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.022A9.607 9.607 0 0112 6.844c.85.004 1.70.115 2.5.357 1.909-1.292 2.747-1.022 2.747-1.022.546 1.379.203 2.398.098 2.65.64.699 1.029 1.592 1.029 2.682 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z", clipRule: "evenodd" }));

// NEW: LinkedIn Icon
export const LinkedinIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => React.createElement('svg', { ...props, className: `w-5 h-5 ${props.className || ''}`, fill: "currentColor", viewBox: "0 0 24 24", xmlns: "http://www.w3.org/2000/svg" },
  React.createElement("path", { d: "M20.447 20.452h-3.529v-5.592c0-1.338-.027-3.061-1.861-3.061-1.861 0-2.144 1.447-2.144 2.969v5.684h-3.529V9.288h3.389l.169 1.642h.046c.475-.898 1.637-1.861 3.339-1.861 3.561 0 4.223 2.35 4.223 5.405v6.28h-.001zM7.91 6.305c-1.164 0-2.109-.949-2.109-2.121 0-1.166.945-2.115 2.109-2.115s2.109.949 2.109 2.115c.001 1.172-.944 2.121-2.109 2.121zM6.075 9.288H9.4v11.164H6.075V9.288z" }));


export const DEFAULT_AI_MODEL = 'gemini-2.5-flash';
export const PRO_AI_MODEL = 'gemini-2.5-pro'; // For more complex tasks if implemented
export const IMAGE_AI_MODEL = 'gemini-2.5-flash-image';
export const SPEECH_AI_MODEL = 'gemini-2.5-flash-preview-tts';
export const VIDEO_AI_MODEL_FAST = 'veo-3.1-fast-generate-preview';
export const VIDEO_AI_MODEL_GEN = 'veo-3.1-generate-preview';
export const LIVE_AUDIO_AI_MODEL = 'gemini-2.5-flash-native-audio-preview-09-2025';

// System Instructions
export const SYSTEM_INSTRUCTION_GRAMMAR_FIXER = `
You are a grammar correction and proofreading assistant. Your task is to correct grammar, spelling, and punctuation errors in the provided text.
Maintain the original tone, style, and meaning as closely as possible. If the input is empty or invalid, respond with "Please provide text to fix."
Output only the corrected text.
`;

export const SYSTEM_INSTRUCTION_SUMMARIZER = `
You are a summarization assistant. Your task is to condense the provided text or webpage content into a concise summary of 3-5 key ideas.
Maintain the original readability and tone. If the input is empty or invalid, respond with "Please provide text to summarize."
Output only the summary.
`;

export const SYSTEM_INSTRUCTION_SOCIAL_MEDIA_COMMENTER = `
You are a social media assistant. Your task is to write short, context-relevant, polite, coherent, and concise comments for social media posts.
You can also respond in emoji-only mode if requested.
`;

export const SYSTEM_INSTRUCTION_TRANSLATOR = `
You are a language translation assistant. Your task is to translate the provided text between languages.
Detect the input language automatically and translate it to the target language.
Maintain the original tone and meaning. Output only the translated text.
`;

export const SYSTEM_INSTRUCTION_REWRITER = `
You are a text rewriting and paraphrasing assistant. Your task is to rewrite the provided text in a clear, fluent, and original way, avoiding plagiarism.
Preserve the meaning and tone of the original text. Output only the rewritten text.
`;

export const SYSTEM_INSTRUCTION_TEXT_ANALYZER = `
You are a text analysis and discussion assistant. Your task is to explain complex parts of the provided content (articles, research, posts), analyze arguments, and generate initial insights.
Support follow-up questions for a back-and-forth dialogue.
`;

export const SYSTEM_INSTRUCTION_KEYWORD_EXTRACTOR = `
You are a keyword and SEO extraction assistant. Your task is to extract key phrases, SEO keywords, and a meta description from the provided content.
Additionally, suggest 5 best hashtags or SEO titles. Output should be structured clearly, perhaps in a list format.
`;

export const SYSTEM_INSTRUCTION_EMAIL_MESSAGE_WRITER = `
You are a professional email and message writing assistant. Your task is to generate concise professional replies for platforms like Gmail or LinkedIn.
Maintain a friendly, formal, or custom tone as specified. Output only the generated message.
`;

export const SYSTEM_INSTRUCTION_DATA_EXTRACTOR = `
You are a structured data extraction assistant. Your task is to extract specific structured data from the provided webpage content (e.g., tables, prices, reviews).
Output the extracted data in JSON or CSV format as requested. If a specific schema is provided, adhere to it strictly.
`;

export const SYSTEM_INSTRUCTION_VALIDATION_ENGINE = `
You are an AI validation and testing agent. Your task is to critically evaluate a given AI response against specified criteria (e.g., correctness, tone, factual consistency).
Provide a clear assessment, score (out of 5), and explain any inconsistencies or hallucinations.
`;

export const SYSTEM_INSTRUCTION_AUTOMATION_ENGINE = `
You are an automation agent. Your task is to execute a sequence of AI tasks. When prompted with an input, apply the defined steps, passing the output of one step as the input to the next.
`;

export const SYSTEM_INSTRUCTION_CODE_REVIEWER = `
You are a code review assistant. Your task is to analyze the provided code snippet for potential bugs, suggest improvements, identify security vulnerabilities, or generate documentation/docstrings.
Specify the area of review (e.g., bug detection, optimization, docstring generation) and provide detailed, actionable feedback.
`;

export const SYSTEM_INSTRUCTION_AUTO_AGENT_COMPOSER = `
You are an AI agent composer. Given a complex task, propose a sequence of simpler AI actions (e.g., summarize, translate, rewrite) to achieve the goal.
Outline the steps and the type of AI tool needed for each.
`;

export const SYSTEM_INSTRUCTION_TEST_SCRIPT_GENERATOR = `
You are an AI test script generator. Given a description of a web page interaction or a feature, generate a basic, executable test script in a common framework (e.g., Playwright or Selenium Python/JS).
Focus on a simple user flow or element interaction.
`;

export const SYSTEM_INSTRUCTION_WEB_VALIDATION_SUITE = `
You are an AI web validation assistant. Given a webpage content snippet and a type of audit (e.g., accessibility, SEO, performance), provide a high-level summary of potential issues and suggestions for improvement.
`;

export const SYSTEM_INSTRUCTION_CI_STATUS = `
You are a CI/CD status reporter. Given a brief description of a CI pipeline event or status, provide a concise summary of the outcome and any critical issues.
`;

export const SYSTEM_INSTRUCTION_SEARCH_ENHANCER = `
You are a search enhancement AI. Given a search query and a list of (mock) search results, summarize the key findings and provide a concise answer to the query based on the results.
`;

export const SYSTEM_INSTRUCTION_PLUGIN_SDK = `
You are an AI plugin development assistant. Given a high-level description of a desired browser extension functionality, outline the steps and key browser APIs (e.g., chrome.scripting, chrome.tabs) required to build it as a simple Neurivox plugin.
`;

export const SYSTEM_INSTRUCTION_INTEGRATION_DASHBOARD = `
You are an AI integration assistant. Given an AI-generated text and a target application (e.g., "Notion", "Gmail", "GitHub Gist"), suggest a plausible action to 'send' the text to that application. For this simulation, simply describe what the action would entail.
`;

export const SYSTEM_INSTRUCTION_CLOUD_SYNC = `
You are a cloud sync assistant. Given a request to sync user data (like prompts or settings), describe the process of securely storing and retrieving this data from a cloud service.
`;

export const SYSTEM_INSTRUCTION_ANALYTICS_DASHBOARD = `
You are an AI analytics reporter. Given a hypothetical AI usage scenario, provide a summary of potential metrics (e.g., token count, latency, success rate) and how they indicate performance.
`;

export const SYSTEM_INSTRUCTION_LLM_GATEWAY_SUPPORT = `
You are an LLM Gateway configurator. Given a request to connect to a specific LLM endpoint (e.g., Groq, Anthropic), provide a brief description of how such an integration would be set up, focusing on API endpoints and authentication.
`;

export const SYSTEM_INSTRUCTION_PRIVACY_SETTINGS = `
You are a privacy and governance AI. Given a user query about data privacy or security in an AI extension, explain how features like local encryption, data redaction, or granular permissions would protect their information.
`;

export const SYSTEM_INSTRUCTION_AUTONOMOUS_RESEARCH = `
You are an autonomous research agent. Given a research topic, describe a high-level plan for how an AI would browse, read, summarize, and cite information from the web to answer it.
`;

export const SYSTEM_INSTRUCTION_NEURIVOX_COPILOT = `
You are a proactive AI copilot. Given a user's current context (e.g., "writing an email about a meeting") and a task, offer a helpful suggestion or automation (e.g., "Draft a summary of the meeting notes for your email").
`;

export const SYSTEM_INSTRUCTION_LIVE_LEARNING_LOOP = `
You are an adaptive AI learning system. Explain how an AI extension could personalize its behavior and improve over time based on a user's continuous feedback and usage patterns.
`;

export const SYSTEM_INSTRUCTION_AR_VR_BROWSER_OVERLAY = `
You are an AR/VR interface designer. Describe how AI-generated information or interactive elements could be visualized as an augmented reality overlay on a web page, enhancing the user experience.
`;


// Default JSON schema for Data Extractor
export const DEFAULT_DATA_SCHEMA: ApiResponseFormat = {
  type: Type.OBJECT,
  properties: {
    extracted_data: {
      type: Type.STRING,
      description: "A general string representation of the extracted data if no specific format is requested.",
    },
  },
  propertyOrdering: ["extracted_data"],
};

// Default Persona Profiles
export const DEFAULT_PERSONAS: PersonaProfile[] = [
  {
    key: PersonaKey.DEFAULT,
    name: 'Default',
    description: 'A general-purpose AI assistant.',
  },
  {
    key: PersonaKey.DEVELOPER,
    name: 'Developer Mode',
    description: 'Optimized for code review, debugging, and technical tasks.',
    defaultPromptCategory: PromptCategory.CODE,
    defaultTone: 'formal',
  },
  {
    key: PersonaKey.STUDENT,
    name: 'Student Mode',
    description: 'Helpful for summarization, research, and learning tasks.',
    defaultPromptCategory: PromptCategory.RESEARCH,
    defaultTone: 'friendly',
  },
  {
    key: PersonaKey.RESEARCHER,
    name: 'Researcher Mode',
    description: 'Focuses on deep analysis, data extraction, and critical evaluation.',
    defaultPromptCategory: PromptCategory.RESEARCH,
    defaultTone: 'formal',
  },
  {
    key: PersonaKey.MARKETER,
    name: 'Marketer Mode',
    description: 'Assists with content creation, SEO, and social media tasks.',
    defaultPromptCategory: PromptCategory.MARKETING,
    defaultTone: 'concise',
  },
];


export const WORKSPACES: Workspace[] = [
  {
    key: WorkspaceKey.RESEARCH,
    label: 'Research',
    // Converted from component reference to JSX element
    icon: React.createElement(BookIcon, null),
    availableActions: [
      {
        id: 'summarize',
        name: 'Summariser',
        description: 'Summarise any text or webpage (3-5 key ideas).',
        // Converted from component reference to JSX element
        icon: React.createElement(BookIcon, null),
        component: Summarizer,
      },
      {
        id: 'text-analyzer',
        name: 'Text Analyzer & Discussor',
        description: 'Explain complex parts, analyze arguments, generate insights. Supports dialogue.',
        icon: React.createElement(ChatIcon, null),
        component: TextAnalyzer,
      },
      {
        id: 'keyword-extractor',
        name: 'Keyword & SEO Extractor',
        description: 'Extract key phrases, SEO keywords, meta descriptions & suggest hashtags.',
        icon: React.createElement(SearchIcon, null),
        component: KeywordExtractor,
      },
      {
        id: 'data-extractor',
        name: 'Data Extractor',
        description: 'Extract structured data from a webpage (tables, prices, reviews) in JSON/CSV.',
        icon: React.createElement(TableIcon, null),
        component: DataExtractor,
      },
      {
        id: 'summarize-files',
        name: 'Summarize PDF / Docs (via upload)',
        description: 'Upload and summarize content from TXT, PDF, DOCX files.',
        icon: React.createElement(UploadIcon, null),
        component: FileUploadSummarizer,
      },
      {
        id: 'search-enhancer',
        name: 'AI-Driven Search Enhancement',
        description: 'Summarize Google results inline and enhance search experience.',
        icon: React.createElement(SearchIcon, null),
        // Fix: Pass props correctly to React.createElement for GenericAIAction
        component: (props: AIActionProps) => React.createElement(GenericAIAction, {
          ...props, // Spread existing props first
          heading: 'AI-Driven Search Enhancement',
          description: 'Summarize search results and get deeper insights for your query.',
          inputPlaceholder: 'Enter your search query or paste search results here...',
          outputLabel: 'Enhanced Search Results:',
          systemInstruction: SYSTEM_INSTRUCTION_SEARCH_ENHANCER,
        }),
      },
      {
        id: 'autonomous-research',
        name: 'Autonomous Research Mode',
        description: 'AI browses, reads, summarizes, and cites automatically.',
        icon: React.createElement(BookIcon, null),
        component: (props: AIActionProps) => React.createElement(GenericAIAction, {
          ...props,
          heading: 'Autonomous Research Mode',
          description: 'Delegate research topics; AI will browse, summarize, and cite for you.',
          inputPlaceholder: 'Enter a research topic (e.g., "The history of renewable energy in Europe")...',
          outputLabel: 'Research Summary:',
          systemInstruction: SYSTEM_INSTRUCTION_AUTONOMOUS_RESEARCH,
          model: PRO_AI_MODEL, // More complex task might use PRO model
        }),
      },
    ],
  },
  {
    key: WorkspaceKey.WRITING,
    label: 'Writing',
    // Converted from component reference to JSX element
    icon: React.createElement(TextIcon, null),
    availableActions: [
      {
        id: 'fix-grammar',
        name: 'Grammar Fixer',
        description: 'Fix grammar in Australian/US English, keep tone.',
        // Converted from component reference to JSX element
        icon: React.createElement(TextIcon, null),
        component: GrammarFixer,
      },
      {
        id: 'rewriter',
        name: 'Rewriter / Paraphraser',
        description: 'Rewrite text clearly, avoid plagiarism, preserve meaning.',
        icon: React.createElement(PencilIcon, null),
        component: Rewriter,
      },
      {
        id: 'translator',
        name: 'Translator',
        description: 'Translate text between major languages (auto-detect input).',
        icon: React.createElement(GlobeIcon, null),
        component: Translator,
      },
      {
        id: 'email-writer',
        name: 'Email & Message Writer',
        description: 'Generate concise professional replies for Gmail, LinkedIn, etc.',
        icon: React.createElement(MailIcon, null),
        component: EmailWriter,
      },
    ],
  },
  {
    key: WorkspaceKey.CODE,
    label: 'Code',
    icon: React.createElement(CodeIcon, null),
    availableActions: [
      {
        id: 'code-reviewer',
        name: 'Code Snippet Reviewer',
        description: 'Highlight any code → get review, bug detection, or docstring.',
        icon: React.createElement(CodeReviewIcon, null),
        component: CodeReviewer,
      },
      {
        id: 'test-script-generator',
        name: 'AI Test Script Generator',
        description: 'Generates Selenium/Playwright tests from page context or user flow descriptions.',
        icon: React.createElement(TestScriptIcon, null),
        component: (props: AIActionProps) => React.createElement(GenericAIAction, {
          ...props,
          heading: 'AI Test Script Generator',
          description: 'Generate basic Selenium/Playwright test scripts for given web interactions.',
          inputPlaceholder: 'Describe the user flow or elements to test (e.g., "login process on example.com")...',
          outputLabel: 'Generated Test Script:',
          systemInstruction: SYSTEM_INSTRUCTION_TEST_SCRIPT_GENERATOR,
          model: PRO_AI_MODEL,
        }),
      },
      {
        id: 'ai-debugger-webpages',
        name: 'AI Debugger for Webpages',
        description: 'Explain errors in console or page scripts in real time.',
        icon: React.createElement(BugIcon, null),
        component: DebuggingTools, 
      },
    ],
  },
  {
    key: WorkspaceKey.SOCIAL,
    label: 'Social',
    // Converted from component reference to JSX element
    icon: React.createElement(UsersIcon, null),
    availableActions: [
      {
        id: 'social-commenter',
        name: 'Social Media Commenter',
        description: 'Reply to posts with short, context-relevant comments.',
        icon: React.createElement(UsersIcon, null),
        component: SocialMediaCommenter,
      },
    ],
  },
  {
    key: WorkspaceKey.ADVANCED,
    label: 'Advanced',
    icon: React.createElement(BrainIcon, null), // Using a new BrainIcon for advanced tools
    availableActions: [
      {
        id: 'prompt-factory',
        name: 'Prompt Factory (Core)',
        description: 'Create, edit, and reuse custom prompts in categories, with history & versioning.',
        icon: React.createElement(PromptIcon, null),
        component: PromptFactory,
      },
      {
        id: 'validation-engine',
        name: 'Validation & Testing Engine',
        description: 'Test prompt responses for correctness, tone, or factual consistency.',
        icon: React.createElement(TestTubeIcon, null),
        component: ValidationEngine,
      },
      {
        id: 'automation-actions',
        name: 'Automation Actions (Mini Agents)',
        description: 'Allow simple automations like: Extract + summarize, Rewrite + post comment.',
        icon: React.createElement(AutomationIcon, null),
        component: AutomationActions,
      },
      {
        id: 'voice-control',
        name: 'Voice-to-Prompt / Speech Command',
        description: 'Speak instructions; AI executes them and responds vocally.',
        icon: React.createElement(VoiceIcon, null),
        component: VoiceControl,
      },
      {
        id: 'vision-integration',
        name: 'Vision Integration (OCR + Image Understanding)',
        description: 'Upload an image or screenshot and ask AI to describe its content.',
        icon: React.createElement(EyeIcon, null),
        component: VisionIntegration,
      },
      {
        id: 'auto-agent-composer',
        name: 'Auto Agent Composer',
        description: 'Dynamically creates micro-agents for different tasks based on a high-level goal.',
        icon: React.createElement(MicrochipIcon, null),
        component: (props: AIActionProps) => React.createElement(GenericAIAction, {
          ...props,
          heading: 'Auto Agent Composer',
          description: 'Propose a sequence of AI actions to achieve a complex goal.',
          inputPlaceholder: 'Describe the complex task you want to automate (e.g., "Research a new product and draft a marketing email")...',
          outputLabel: 'Proposed Agent Workflow:',
          systemInstruction: SYSTEM_INSTRUCTION_AUTO_AGENT_COMPOSER,
          model: PRO_AI_MODEL,
        }),
      },
      {
        id: 'llm-switch-optimizer',
        name: 'LLM-Switch Optimiser',
        description: 'Automatically picks the best model (Claude → GPT → Gemini → local) based on task, cost, and speed.',
        icon: React.createElement(BrainIcon, null),
        component: LLMSwitchOptimizer,
      },
    ],
  },
  {
    key: WorkspaceKey.DEVELOPER,
    label: 'Developer',
    icon: React.createElement(CodeIcon, null), 
    availableActions: [
      {
        id: 'debugging-tools',
        name: 'Debugging & Developer Tools',
        description: 'Inspect model responses, latency, and API logs. Enable "Developer Mode".',
        icon: React.createElement(BugFillIcon, null), 
        component: DebuggingTools,
      },
      {
        id: 'web-validation-suite',
        name: 'Web Validation Suite',
        description: 'Run accessibility, SEO, and performance audits on webpage content.',
        icon: React.createElement(WebAuditIcon, null),
        component: (props: AIActionProps) => React.createElement(GenericAIAction, {
          ...props,
          heading: 'Web Validation Suite',
          description: 'Perform accessibility, SEO, or performance audits on provided webpage content.',
          inputPlaceholder: 'Paste webpage HTML/content or describe audit type (e.g., "Accessibility audit for this content...")...',
          outputLabel: 'Audit Report:',
          systemInstruction: SYSTEM_INSTRUCTION_WEB_VALIDATION_SUITE,
          model: PRO_AI_MODEL,
        }),
      },
      {
        id: 'ci-notifications',
        name: 'Browser-Integrated CI Notifications',
        description: 'Summarize GitHub Actions/Jenkins build statuses.',
        icon: React.createElement(DatabaseIcon, null), 
        component: (props: AIActionProps) => React.createElement(GenericAIAction, {
          ...props,
          heading: 'Browser-Integrated CI Notifications',
          description: 'Get concise summaries of CI pipeline events and statuses.',
          inputPlaceholder: 'Paste CI log output or describe a build status (e.g., "GitHub Actions pipeline failed, error was \'X\'")...',
          outputLabel: 'CI Status Summary:',
          systemInstruction: SYSTEM_INSTRUCTION_CI_STATUS,
        }),
      },
    ],
  },
  {
    key: WorkspaceKey.INTEGRATIONS,
    label: 'Integrations',
    icon: React.createElement(IntegrateIcon, null), 
    availableActions: [
      {
        id: 'plugin-sdk',
        name: 'Plugin System (Neurivox Modules)',
        description: 'Outline steps to build custom Neurivox plug-ins.',
        icon: React.createElement(PaletteIcon, null), 
        component: (props: AIActionProps) => React.createElement(GenericAIAction, {
          ...props,
          heading: 'Plugin System (Neurivox Modules)',
          description: 'Get guidance on building custom browser extension plugins for Neurivox.',
          inputPlaceholder: 'Describe the plugin you want to build (e.g., "a plugin to extract recipes from cooking blogs")...',
          outputLabel: 'Plugin Development Outline:',
          systemInstruction: SYSTEM_INSTRUCTION_PLUGIN_SDK,
          model: PRO_AI_MODEL,
        }),
      },
      {
        id: 'cross-app-actions',
        name: 'Cross-App Actions',
        description: 'Simulate sending content to Notion, Gmail, GitHub Gist, etc.',
        icon: React.createElement(IntegrateIcon, null), 
        component: (props: AIActionProps) => React.createElement(GenericAIAction, {
          ...props,
          heading: 'Cross-App Actions',
          description: 'Simulate sending AI-generated content to various external applications.',
          inputPlaceholder: 'Provide the content and target app (e.g., "Summarize this article and draft an email to John")...',
          outputLabel: 'Proposed Action:',
          systemInstruction: SYSTEM_INSTRUCTION_INTEGRATION_DASHBOARD,
        }),
      },
      {
        id: 'cloud-sync',
        name: 'Cloud Sync + Account Login',
        description: 'Explain the process of syncing prompts/settings across browsers.',
        icon: React.createElement(DatabaseIcon, null), 
        component: (props: AIActionProps) => React.createElement(GenericAIAction, {
          ...props,
          heading: 'Cloud Sync + Account Login',
          description: 'Understand how Neurivox data can be securely synchronized across devices.',
          inputPlaceholder: 'Ask about cloud sync (e.g., "How does cloud sync work for my prompts?")...',
          outputLabel: 'Explanation:',
          systemInstruction: SYSTEM_INSTRUCTION_CLOUD_SYNC,
        }),
      },
      {
        id: 'analytics-dashboard',
        name: 'Analytics Dashboard',
        description: 'Interpret AI usage, token spend, success/failure stats.',
        icon: React.createElement(TableIcon, null), 
        component: (props: AIActionProps) => React.createElement(GenericAIAction, {
          ...props,
          heading: 'Analytics Dashboard',
          description: 'Get insights into AI usage metrics, performance, and costs.',
          inputPlaceholder: 'Describe a hypothetical AI usage scenario (e.g., "Daily usage of summarizer tool")...',
          outputLabel: 'Analytics Summary:',
          systemInstruction: SYSTEM_INSTRUCTION_ANALYTICS_DASHBOARD,
        }),
      },
      {
        id: 'llm-gateway-support',
        name: 'LLM Gateway Support',
        description: 'Explain integrating open-source or private endpoints (Groq, Together, Anthropic, etc.).',
        icon: React.createElement(MicrochipIcon, null), 
        component: (props: AIActionProps) => React.createElement(GenericAIAction, {
          ...props,
          heading: 'LLM Gateway Support',
          description: 'Learn about connecting Neurivox to various LLM endpoints.',
          inputPlaceholder: 'Ask about integrating a specific LLM (e.g., "How to connect to Groq via an LLM Gateway?")...',
          outputLabel: 'Integration Steps:',
          systemInstruction: SYSTEM_INSTRUCTION_LLM_GATEWAY_SUPPORT,
          model: PRO_AI_MODEL,
        }),
      },
    ],
  },
  {
    key: WorkspaceKey.PRIVACY,
    label: 'Privacy',
    icon: React.createElement(ShieldIcon, null), 
    availableActions: [
      {
        id: 'privacy-settings',
        name: 'Privacy, Safety & Governance',
        description: 'Understand local encryption, granular permissions, audit trail, and data redaction.',
        icon: React.createElement(ShieldIcon, null), 
        component: (props: AIActionProps) => React.createElement(GenericAIAction, {
          ...props,
          heading: 'Privacy, Safety & Governance',
          description: 'Explore features for data protection and responsible AI use within Neurivox.',
          inputPlaceholder: 'Ask about a privacy feature (e.g., "How is my data protected with local encryption?")...',
          outputLabel: 'Privacy Explanation:',
          systemInstruction: SYSTEM_INSTRUCTION_PRIVACY_SETTINGS,
        }),
      },
    ],
  },
  {
    key: WorkspaceKey.FUTURISTIC,
    label: 'Futuristic',
    icon: React.createElement(GlobeAltIcon, null), 
    availableActions: [
      {
        id: 'multi-agent-collaboration',
        name: 'Multi-Agent Collaboration View',
        description: 'Simulate how Navigator, Planner, and Executor agents would interact for complex tasks.',
        icon: React.createElement(BrainIcon, null), 
        component: (props: AIActionProps) => React.createElement(GenericAIAction, {
          ...props,
          heading: 'Multi-Agent Collaboration View',
          description: 'Visualize how specialized AI agents might collaborate on a complex task.',
          inputPlaceholder: 'Describe a complex problem for agents (e.g., "Plan a charity event")...',
          outputLabel: 'Agent Collaboration Scenario:',
          systemInstruction: SYSTEM_INSTRUCTION_AUTO_AGENT_COMPOSER, // Reusing agent composition instruction
          model: PRO_AI_MODEL,
        }),
      },
      {
        id: 'neurivox-copilot',
        name: 'Neurivox Copilot Mode',
        description: 'Simulate an OS-level AI proactively offering suggestions and automation.',
        icon: React.createElement(VoiceIcon, null), 
        component: (props: AIActionProps) => React.createElement(GenericAIAction, {
          ...props,
          heading: 'Neurivox Copilot Mode',
          description: 'Experience proactive AI assistance, offering relevant suggestions based on context.',
          inputPlaceholder: 'Describe your current task (e.g., "I\'m writing an email about a project deadline")...',
          outputLabel: 'Copilot Suggestion:',
          systemInstruction: SYSTEM_INSTRUCTION_NEURIVOX_COPILOT,
        }),
      },
      {
        id: 'live-learning-loop',
        name: 'Live Learning Loop',
        description: 'Explain how the AI adapts based on your usage and feedback (personalized intelligence).',
        icon: React.createElement(MicrochipIcon, null), 
        component: (props: AIActionProps) => React.createElement(GenericAIAction, {
          ...props,
          heading: 'Live Learning Loop',
          description: 'Understand how Neurivox can adapt and personalize its intelligence over time.',
          inputPlaceholder: 'Ask about AI personalization (e.g., "How does the AI learn from my corrections?")...',
          outputLabel: 'Learning Loop Explanation:',
          systemInstruction: SYSTEM_INSTRUCTION_LIVE_LEARNING_LOOP,
        }),
      },
      {
        id: 'ar-vr-overlay',
        name: 'AR/VR Browser Overlay',
        description: 'Describe how AI-generated insights could be visualized in mixed reality over browser content.',
        icon: React.createElement(EyeIcon, null), 
        component: (props: AIActionProps) => React.createElement(GenericAIAction, {
          ...props,
          heading: 'AR/VR Browser Overlay',
          description: 'Explore concepts for visualizing AI data and interactions in augmented/virtual reality within the browser.',
          inputPlaceholder: 'Describe a scenario for AR/VR overlay (e.g., "Show stock data as a 3D graph over a finance website")...',
          outputLabel: 'AR/VR Visualization Concept:',
          systemInstruction: SYSTEM_INSTRUCTION_AR_VR_BROWSER_OVERLAY,
        }),
      },
    ],
  },
];