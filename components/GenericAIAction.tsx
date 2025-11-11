// components/GenericAIAction.tsx
import React, { useState, useCallback, useEffect } from 'react';
import { generateTextContent } from '../services/geminiService';
import { DEFAULT_AI_MODEL } from '../constants';
import LoadingSpinner from './LoadingSpinner';
import { AIActionProps, DebugLogLevel } from '../types';
import { globalEmitter } from '../utils/eventEmitter';

interface GenericAIActionProps extends AIActionProps {
  heading: string;
  description: string;
  inputPlaceholder: string;
  outputLabel: string;
  systemInstruction: string;
  model?: string; // Allow overriding the default model
}

export const GenericAIAction: React.FC<GenericAIActionProps> = ({
  initialInput,
  onActionComplete,
  onLogDebug,
  onSpeakText,
  heading,
  description,
  inputPlaceholder,
  outputLabel,
  systemInstruction,
  model = DEFAULT_AI_MODEL,
}) => {
  const [inputText, setInputText] = useState(initialInput || '');
  const [outputText, setOutputText] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isApiKeyMissing, setIsApiKeyMissing] = useState(false);

  const performAction = useCallback(async (textToProcess: string) => {
    setIsLoading(true);
    setError(null);
    setOutputText('');
    try {
      if (!process.env.API_KEY) {
        setIsApiKeyMissing(true);
        setError("API Key is not configured. Please ensure your API key is set in the environment.");
        onLogDebug?.({
          id: `${heading.toLowerCase().replace(/\s/g, '-')}-api-key-missing-${Date.now()}`,
          timestamp: new Date(),
          level: DebugLogLevel.API_KEY_MISSING,
          message: `${heading} failed: API Key is not configured.`,
        });
        return;
      }
      setIsApiKeyMissing(false);

      const { text } = await generateTextContent({
        model: model,
        prompt: textToProcess,
        systemInstruction: systemInstruction,
        onLogDebug: onLogDebug || ((entry) => globalEmitter.emit('debugLog', entry)),
      });
      setOutputText(text.trim());
      onActionComplete?.(text.trim());
    } catch (err: any) {
      console.error(`Error in ${heading}:`, err);
      if (err.message.includes("API Key is not configured")) { // Check for the custom error message
        setIsApiKeyMissing(true);
        setError("API Key is not configured. Please ensure your API key is set in the environment.");
        onLogDebug?.({
          id: `${heading.toLowerCase().replace(/\s/g, '-')}-api-key-invalid-${Date.now()}`,
          timestamp: new Date(),
          level: DebugLogLevel.API_KEY_MISSING,
          message: `${heading} failed: API Key invalid.`,
          details: { error: err.message },
        });
      } else {
        setError(`Failed to perform action: ${err.message}`);
        onLogDebug?.({
          id: `${heading.toLowerCase().replace(/\s/g, '-')}-error-${Date.now()}`,
          timestamp: new Date(),
          level: DebugLogLevel.ERROR,
          message: `${heading} failed: ${err.message}`,
          details: { error: err.message, prompt: textToProcess },
        });
      }
    } finally {
      setIsLoading(false);
    }
  }, [onActionComplete, onLogDebug, heading, systemInstruction, model]);

  useEffect(() => {
    if (initialInput) {
      setInputText(initialInput);
      performAction(initialInput);
    }
  }, [initialInput, performAction]);

  const handleActionClick = () => {
    if (!inputText.trim()) {
      setError("Please enter some input to perform the action.");
      return;
    }
    performAction(inputText);
  };

  const handleCopyToClipboard = () => {
    if (outputText) {
      navigator.clipboard.writeText(outputText);
    }
  };

  const handleSpeakClick = () => {
    if (outputText && onSpeakText) {
      onSpeakText(outputText);
    }
  };

  return React.createElement(
    "div",
    { className: "p-4 space-y-4 dark:bg-gray-900 dark:text-gray-200" },
    React.createElement(
      "h2",
      { className: "text-xl font-bold text-gray-800 dark:text-gray-200" },
      heading
    ),
    React.createElement(
      "p",
      { className: "text-sm text-gray-600 dark:text-gray-400 mb-4" },
      description
    ),
    React.createElement(
      "div",
      null,
      React.createElement(
        "label",
        { htmlFor: "generic-input", className: "block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1" },
        "Input:"
      ),
      React.createElement("textarea", {
        id: "generic-input",
        className: "w-full p-3 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500 resize-y min-h-[120px] shadow-sm text-gray-800 bg-white dark:bg-gray-700 dark:text-gray-100 dark:border-gray-600",
        placeholder: inputPlaceholder,
        value: inputText,
        onChange: (e) => setInputText(e.target.value),
        rows: 6,
        disabled: isLoading,
      } as React.TextareaHTMLAttributes<HTMLTextAreaElement>)
    ),
    React.createElement(
      "button",
      {
        onClick: handleActionClick,
        disabled: isLoading || !inputText.trim(),
        className: `w-full py-2 px-4 rounded-md text-white font-semibold transition-colors
          ${isLoading || !inputText.trim()
            ? 'bg-blue-300 cursor-not-allowed'
            : 'bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50'
          }`,
      },
      isLoading ? (
        React.createElement(
          "span",
          { className: "flex items-center justify-center" },
          React.createElement(LoadingSpinner, null),
          ` Performing Action...`
        )
      ) : (
        `Perform Action`
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
    outputText &&
    React.createElement(
      "div",
      { className: "space-y-2" },
      React.createElement(
        "label",
        { className: "block text-sm font-medium text-gray-700 dark:text-gray-300" },
        outputLabel
      ),
      React.createElement(
        "div",
        { className: "relative" },
        React.createElement("textarea", {
          readOnly: true,
          className: "w-full p-3 border border-gray-300 bg-gray-50 rounded-md resize-y min-h-[120px] shadow-sm text-gray-800 dark:bg-gray-800 dark:text-gray-100 dark:border-gray-600",
          value: outputText,
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