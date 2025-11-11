// components/EmailWriter.tsx
import React, { useState, useCallback, useEffect } from 'react';
import { generateTextContent } from '../services/geminiService';
import { DEFAULT_AI_MODEL, SYSTEM_INSTRUCTION_EMAIL_MESSAGE_WRITER, DEFAULT_PERSONAS } from '../constants';
import LoadingSpinner from './LoadingSpinner';
import { AIActionProps, DebugLogLevel, PersonaKey } from '../types'; // Fix: Import PersonaKey from types.ts
import { globalEmitter } from '../utils/eventEmitter'; // Import the global emitter


type Tone = 'friendly' | 'formal' | 'concise' | 'empathetic';

export const EmailWriter: React.FC<AIActionProps> = ({ initialInput, onActionComplete, onLogDebug, currentPersonaKey, onSpeakText }) => {
  const [originalMessage, setOriginalMessage] = useState(initialInput || '');
  const [context, setContext] = useState('');
  const [generatedReply, setGeneratedReply] = useState('');
  const [tone, setTone] = useState<Tone>('friendly');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isApiKeyMissing, setIsApiKeyMissing] = useState(false);

  // Apply persona's default tone if available
  useEffect(() => {
    if (currentPersonaKey) {
      const activePersona = DEFAULT_PERSONAS.find(p => p.key === currentPersonaKey);
      if (activePersona?.defaultTone) {
        setTone(activePersona.defaultTone);
        onLogDebug?.({
          id: `email-writer-persona-tone-${Date.now()}`,
          timestamp: new Date(),
          level: DebugLogLevel.CONTEXT_MEMORY,
          message: `Email Writer: Applied default tone "${activePersona.defaultTone}" from persona "${activePersona.name}".`,
        });
      }
    }
  }, [currentPersonaKey, onLogDebug]);

  const generateReply = useCallback(async (message: string, currentContext: string, selectedTone: Tone) => {
    setIsLoading(true);
    setError(null);
    try {
      if (!process.env.API_KEY) {
        setIsApiKeyMissing(true);
        setError("API Key is not configured. Please ensure your API key is set in the environment.");
        onLogDebug?.({
          id: `email-writer-api-key-missing-${Date.now()}`,
          timestamp: new Date(),
          level: DebugLogLevel.API_KEY_MISSING,
          message: "Email Writer failed: API Key is not configured.",
        });
        return;
      }
      setIsApiKeyMissing(false);

      let prompt = `Generate a concise and professional reply for the following message, maintaining a ${selectedTone} tone.`;
      if (currentContext) {
        prompt += ` Use this additional context: "${currentContext}".`;
      }
      prompt += ` Original Message: "${message}"`;

      const { text } = await generateTextContent({
        model: DEFAULT_AI_MODEL,
        prompt: prompt,
        systemInstruction: SYSTEM_INSTRUCTION_EMAIL_MESSAGE_WRITER,
        onLogDebug: onLogDebug || ((entry) => globalEmitter.emit('debugLog', entry)), // Use prop callback or global emitter
      });
      setGeneratedReply(text.trim());
      onActionComplete?.(text.trim());
    } catch (err: any) {
      console.error('Error generating email reply:', err);
      if (err.message.includes("API Key is not configured")) { // Check for the custom error message
        setIsApiKeyMissing(true);
        setError("API Key is not configured. Please ensure your API key is set in the environment.");
        onLogDebug?.({
          id: `email-writer-api-key-invalid-${Date.now()}`,
          timestamp: new Date(),
          level: DebugLogLevel.API_KEY_MISSING,
          message: `Email Writer failed: API Key invalid.`,
          details: { error: err.message },
        });
      } else {
        setError(`Failed to generate reply: ${err.message}`);
        onLogDebug?.({
          id: `email-writer-error-${Date.now()}`,
          timestamp: new Date(),
          level: DebugLogLevel.ERROR,
          message: `Email Writer failed: ${err.message}`,
          details: { error: err.message, prompt },
        });
      }
    } finally {
      setIsLoading(false);
    }
  }, [onActionComplete, onLogDebug]);

  useEffect(() => {
    if (initialInput) {
      setOriginalMessage(initialInput);
      // Automatically generate a reply with default tone/context if initialInput is provided
      generateReply(initialInput, context, tone);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initialInput]);

  const handleGenerateClick = () => {
    if (!originalMessage.trim()) {
      setError("Please enter the original message to reply to.");
      return;
    }
    generateReply(originalMessage, context, tone);
  };

  const handleCopyToClipboard = () => {
    if (generatedReply) {
      navigator.clipboard.writeText(generatedReply);
    }
  };

  const handleSpeakClick = () => {
    if (generatedReply && onSpeakText) {
      onSpeakText(generatedReply);
    }
  };

  return React.createElement(
    "div",
    { className: "p-4 space-y-4" },
    React.createElement(
      "h2",
      { className: "text-xl font-bold text-gray-800 dark:text-gray-200" },
      "Email & Message Writer"
    ),
    React.createElement(
      "p",
      { className: "text-sm text-gray-600 dark:text-gray-400" },
      "Generate concise professional replies for various platforms, maintaining a natural tone."
    ),
    React.createElement(
      "div",
      null,
      React.createElement(
        "label",
        { htmlFor: "original-message", className: "block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1" },
        "Original Message:"
      ),
      React.createElement("textarea", {
        id: "original-message",
        className: "w-full p-3 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500 resize-y min-h-[100px] shadow-sm text-gray-800 bg-white dark:bg-gray-700 dark:text-gray-100 dark:border-gray-600",
        placeholder: "Paste the original email or message here...",
        value: originalMessage,
        onChange: (e) => setOriginalMessage(e.target.value),
        rows: 5,
        disabled: isLoading,
      } as React.TextareaHTMLAttributes<HTMLTextAreaElement>)
    ),
    React.createElement(
      "div",
      null,
      React.createElement(
        "label",
        { htmlFor: "context", className: "block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1" },
        "Additional Context (Optional):"
      ),
      React.createElement("textarea", {
        id: "context",
        className: "w-full p-3 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500 resize-y min-h-[80px] shadow-sm text-gray-800 bg-white dark:bg-gray-700 dark:text-gray-100 dark:border-gray-600",
        placeholder: "Add any relevant details or instructions for the reply...",
        value: context,
        onChange: (e) => setContext(e.target.value),
        rows: 4,
        disabled: isLoading,
      } as React.TextareaHTMLAttributes<HTMLTextAreaElement>)
    ),
    React.createElement(
      "div",
      null,
      React.createElement(
        "label",
        { htmlFor: "tone-select", className: "block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1" },
        "Tone:"
      ),
      React.createElement(
        "select",
        {
          id: "tone-select",
          className: "w-full p-3 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500 shadow-sm text-gray-800 bg-white dark:bg-gray-700 dark:text-gray-100 dark:border-gray-600",
          value: tone,
          onChange: (e) => setTone(e.target.value as Tone),
          disabled: isLoading,
        } as React.SelectHTMLAttributes<HTMLSelectElement>,
        React.createElement("option", { value: "friendly" }, "Friendly"),
        React.createElement("option", { value: "formal" }, "Formal"),
        React.createElement("option", { value: "concise" }, "Concise"),
        React.createElement("option", { value: "empathetic" }, "Empathetic")
      )
    ),
    React.createElement(
      "button",
      {
        onClick: handleGenerateClick,
        disabled: isLoading || !originalMessage.trim(),
        className: `w-full py-2 px-4 rounded-md text-white font-semibold transition-colors
          ${isLoading || !originalMessage.trim()
            ? 'bg-blue-300 cursor-not-allowed'
            : 'bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50'
          }`,
      },
      isLoading ? (
        React.createElement(
          "span",
          { className: "flex items-center justify-center" },
          React.createElement(LoadingSpinner, null),
          " Generating Reply..."
        )
      ) : (
        "Generate Reply"
      )
    ),
    error &&
    React.createElement(
      "div",
      { className: `p-3 rounded-md text-sm ${isApiKeyMissing ? 'bg-orange-100 text-orange-700 dark:bg-orange-900 dark:text-orange-200' : 'bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-200'}` },
      React.createElement(
        "p",
        { className: "font-medium" },
        "Error:"
      ),
      React.createElement("p", null, error),
      isApiKeyMissing &&
      React.createElement(
        "p",
        { className: "mt-2" },
        "Please ensure your API key is set in the environment."
      )
    ),
    generatedReply &&
    React.createElement(
      "div",
      { className: "space-y-2" },
      React.createElement(
        "label",
        { className: "block text-sm font-medium text-gray-700 dark:text-gray-300" },
        "Generated Reply:"
      ),
      React.createElement(
        "div",
        { className: "relative" },
        React.createElement("textarea", {
          readOnly: true,
          className: "w-full p-3 border border-gray-300 bg-gray-50 rounded-md resize-y min-h-[120px] shadow-sm text-gray-800 dark:bg-gray-800 dark:text-gray-100 dark:border-gray-600",
          value: generatedReply,
          rows: 6,
        } as React.TextareaHTMLAttributes<HTMLTextAreaElement>),
        React.createElement(
          "div",
          { className: "absolute top-2 right-2 flex space-x-1" },
          onSpeakText && React.createElement(
            "button",
            {
              onClick: handleSpeakClick,
              className: "p-2 bg-gray-200 hover:bg-gray-300 rounded-md text-gray-700 text-xs flex items-center space-x-1 dark:bg-gray-600 dark:hover:bg-gray-500 dark:text-gray-200",
              title: "Speak text aloud",
            },
            React.createElement("svg", { className: "w-4 h-4", fill: "none", stroke: "currentColor", viewBox: "0 0 24 24", xmlns: "http://www.w3.org/2000/svg" }, React.createElement("path", { strokeLinecap: "round", strokeLinejoin: "round", strokeWidth: "2", d: "M15.536 8.464a5 5 0 010 7.072m2.828-9.9a9 9 0 010 12.728M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.106 12 5v14c0 .894-1.077 1.337-1.707.707L5.586 15z" })),
            React.createElement("span", null, "Speak")
          ),
          React.createElement(
            "button",
            {
              onClick: handleCopyToClipboard,
              className: "p-2 bg-gray-200 hover:bg-gray-300 rounded-md text-gray-700 text-xs flex items-center space-x-1 dark:bg-gray-600 dark:hover:bg-gray-500 dark:text-gray-200",
              title: "Copy to clipboard",
            },
            React.createElement("svg", { className: "w-4 h-4", fill: "none", stroke: "currentColor", viewBox: "0 0 24 24", xmlns: "http://www.w3.org/2000/svg" }, React.createElement("path", { strokeLinecap: "round", strokeLinejoin: "round", strokeWidth: "2", d: "M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" })),
            React.createElement("span", null, "Copy")
          )
        )
      )
    )
  );
};