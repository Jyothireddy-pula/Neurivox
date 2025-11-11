// components/KeywordExtractor.tsx
import React, { useState, useCallback, useEffect } from 'react';
import { generateTextContent } from '../services/geminiService';
import { DEFAULT_AI_MODEL, SYSTEM_INSTRUCTION_KEYWORD_EXTRACTOR } from '../constants';
import LoadingSpinner from './LoadingSpinner';
import { AIActionProps, DebugLogLevel } from '../types';
import { globalEmitter } from '../utils/eventEmitter'; // Import the global emitter


export const KeywordExtractor: React.FC<AIActionProps> = ({ initialInput, onActionComplete, onLogDebug, onSpeakText }) => {
  const [inputText, setInputText] = useState(initialInput || '');
  const [extractedData, setExtractedData] = useState<{ keywords: string[], metaDescription: string, hashtags: string[] } | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isApiKeyMissing, setIsApiKeyMissing] = useState(false);

  const extractKeywords = useCallback(async (textToProcess: string) => {
    setIsLoading(true);
    setError(null);
    setExtractedData(null);
    try {
      if (!process.env.API_KEY) {
        setIsApiKeyMissing(true);
        setError("API Key is not configured. Please ensure your API key is set in the environment.");
        onLogDebug?.({
          id: `keyword-extractor-api-key-missing-${Date.now()}`,
          timestamp: new Date(),
          level: DebugLogLevel.API_KEY_MISSING,
          message: "Keyword Extractor failed: API Key is not configured.",
        });
        return;
      }
      setIsApiKeyMissing(false);

      const prompt = `From the following text, extract:
      1. Key phrases/SEO keywords (comma-separated).
      2. A concise meta description (max 160 characters).
      3. 5 best hashtags, in '#hashtag' format.

      Format your response strictly as follows:
      KEYWORDS: [list of keywords]
      META DESCRIPTION: [meta description]
      HASHTAGS: [list of hashtags]

      Text: "${textToProcess}"`;

      const { text } = await generateTextContent({
        model: DEFAULT_AI_MODEL,
        prompt: prompt,
        systemInstruction: SYSTEM_INSTRUCTION_KEYWORD_EXTRACTOR,
        onLogDebug: onLogDebug || ((entry) => globalEmitter.emit('debugLog', entry)), // Use prop callback or global emitter
      });

      // Parse the structured output
      const lines = text.trim().split('\n');
      let keywords: string[] = [];
      let metaDescription = '';
      let hashtags: string[] = [];

      lines.forEach(line => {
        if (line.startsWith('KEYWORDS:')) {
          keywords = line.replace('KEYWORDS:', '').trim().split(',').map(k => k.trim()).filter(Boolean);
        } else if (line.startsWith('META DESCRIPTION:')) {
          metaDescription = line.replace('META DESCRIPTION:', '').trim();
        } else if (line.startsWith('HASHTAGS:')) {
          hashtags = line.replace('HASHTAGS:', '').trim().split(' ').map(h => h.trim()).filter(Boolean);
        }
      });

      setExtractedData({ keywords, metaDescription, hashtags });
      onActionComplete?.(text.trim());

    } catch (err: any) {
      console.error('Error extracting keywords:', err);
      if (err.message.includes("API Key is not configured")) { // Check for the custom error message
        setIsApiKeyMissing(true);
        setError("API Key is not configured. Please ensure your API key is set in the environment.");
        onLogDebug?.({
          id: `keyword-extractor-api-key-invalid-${Date.now()}`,
          timestamp: new Date(),
          level: DebugLogLevel.API_KEY_MISSING,
          message: `Keyword Extractor failed: API Key invalid.`,
          details: { error: err.message },
        });
      } else {
        setError(`Failed to extract keywords: ${err.message}`);
        onLogDebug?.({
          id: `keyword-extractor-error-${Date.now()}`,
          timestamp: new Date(),
          level: DebugLogLevel.ERROR,
          message: `Keyword Extractor failed: ${err.message}`,
          details: { error: err.message, prompt },
        });
      }
    } finally {
      setIsLoading(false);
    }
  }, [onActionComplete, onLogDebug]);

  useEffect(() => {
    if (initialInput) {
      setInputText(initialInput);
      extractKeywords(initialInput);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initialInput]);

  const handleExtractClick = () => {
    if (!inputText.trim()) {
      setError("Please enter some text to extract keywords from.");
      return;
    }
    extractKeywords(inputText);
  };

  const handleCopyToClipboard = (content: string) => {
    navigator.clipboard.writeText(content);
  };

  const handleSpeakClick = (text: string) => {
    if (text && onSpeakText) {
      onSpeakText(text);
    }
  };

  return React.createElement(
    "div",
    { className: "p-4 space-y-4" },
    React.createElement(
      "h2",
      { className: "text-xl font-bold text-gray-800 dark:text-gray-200" },
      "Keyword & SEO Extractor"
    ),
    React.createElement(
      "p",
      { className: "text-sm text-gray-600 dark:text-gray-400" },
      "Extract key phrases, SEO keywords, meta description, and suggest 5 best hashtags/SEO titles."
    ),
    React.createElement(
      "div",
      null,
      React.createElement(
        "label",
        { htmlFor: "keyword-input", className: "block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1" },
        "Input Text/Content:"
      ),
      React.createElement("textarea", {
        id: "keyword-input",
        className: "w-full p-3 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500 resize-y min-h-[120px] shadow-sm text-gray-800 bg-white dark:bg-gray-700 dark:text-gray-100 dark:border-gray-600",
        placeholder: "Enter text or paste content here to extract keywords and SEO data...",
        value: inputText,
        onChange: (e) => setInputText(e.target.value),
        rows: 6,
        disabled: isLoading,
      } as React.TextareaHTMLAttributes<HTMLTextAreaElement>)
    ),
    React.createElement(
      "button",
      {
        onClick: handleExtractClick,
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
          " Extracting..."
        )
      ) : (
        "Extract Keywords & SEO"
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
    extractedData &&
    React.createElement(
      "div",
      { className: "space-y-4" },
      React.createElement(
        "div",
        null,
        React.createElement(
          "label",
          { className: "block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1" },
          "Keywords:"
        ),
        React.createElement(
          "div",
          { className: "relative" },
          React.createElement("textarea", {
            readOnly: true,
            className: "w-full p-3 border border-gray-300 bg-gray-50 rounded-md resize-y min-h-[80px] shadow-sm text-gray-800 dark:bg-gray-800 dark:text-gray-100 dark:border-gray-600",
            value: extractedData.keywords.join(', '),
            rows: 3,
          } as React.TextareaHTMLAttributes<HTMLTextAreaElement>),
          React.createElement(
            "div",
            { className: "absolute top-2 right-2 flex space-x-1" },
            onSpeakText && extractedData.keywords.length > 0 && React.createElement(
              "button",
              {
                onClick: () => handleSpeakClick(extractedData.keywords.join(', ')),
                className: "p-2 bg-gray-200 hover:bg-gray-300 rounded-md text-gray-700 text-xs flex items-center space-x-1 dark:bg-gray-600 dark:hover:bg-gray-500 dark:text-gray-200",
                title: "Speak text aloud",
              },
              React.createElement("svg", { className: "w-4 h-4", fill: "none", stroke: "currentColor", viewBox: "0 0 24 24", xmlns: "http://www.w3.org/2000/svg" }, React.createElement("path", { strokeLinecap: "round", strokeLinejoin: "round", strokeWidth: "2", d: "M15.536 8.464a5 5 0 010 7.072m2.828-9.9a9 9 0 010 12.728M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.106 12 5v14c0 .894-1.077 1.337-1.707.707L5.586 15z" })),
              React.createElement("span", null, "Speak")
            ),
            React.createElement(
              "button",
              {
                onClick: () => handleCopyToClipboard(extractedData.keywords.join(', ')),
                className: "p-2 bg-gray-200 hover:bg-gray-300 rounded-md text-gray-700 text-xs flex items-center space-x-1 dark:bg-gray-600 dark:hover:bg-gray-500 dark:text-gray-200",
                title: "Copy to clipboard",
              },
              React.createElement("svg", { className: "w-4 h-4", fill: "none", stroke: "currentColor", viewBox: "0 0 24 24", xmlns: "http://www.w3.org/2000/svg" }, React.createElement("path", { strokeLinecap: "round", strokeLinejoin: "round", strokeWidth: "2", d: "M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" })),
              React.createElement("span", null, "Copy")
            )
          )
        )
      ),
      React.createElement(
        "div",
        null,
        React.createElement(
          "label",
          { className: "block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1" },
          "Meta Description:"
        ),
        React.createElement(
          "div",
          { className: "relative" },
          React.createElement("textarea", {
            readOnly: true,
            className: "w-full p-3 border border-gray-300 bg-gray-50 rounded-md resize-y min-h-[80px] shadow-sm text-gray-800 dark:bg-gray-800 dark:text-gray-100 dark:border-gray-600",
            value: extractedData.metaDescription,
            rows: 3,
          } as React.TextareaHTMLAttributes<HTMLTextAreaElement>),
          React.createElement(
            "div",
            { className: "absolute top-2 right-2 flex space-x-1" },
            onSpeakText && extractedData.metaDescription && React.createElement(
              "button",
              {
                onClick: () => handleSpeakClick(extractedData.metaDescription),
                className: "p-2 bg-gray-200 hover:bg-gray-300 rounded-md text-gray-700 text-xs flex items-center space-x-1 dark:bg-gray-600 dark:hover:bg-gray-500 dark:text-gray-200",
                title: "Speak text aloud",
              },
              React.createElement("svg", { className: "w-4 h-4", fill: "none", stroke: "currentColor", viewBox: "0 0 24 24", xmlns: "http://www.w3.org/2000/svg" }, React.createElement("path", { strokeLinecap: "round", strokeLinejoin: "round", strokeWidth: "2", d: "M15.536 8.464a5 5 0 010 7.072m2.828-9.9a9 9 0 010 12.728M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.106 12 5v14c0 .894-1.077 1.337-1.707.707L5.586 15z" })),
              React.createElement("span", null, "Speak")
            ),
            React.createElement(
              "button",
              {
                onClick: () => handleCopyToClipboard(extractedData.metaDescription),
                className: "p-2 bg-gray-200 hover:bg-gray-300 rounded-md text-gray-700 text-xs flex items-center space-x-1 dark:bg-gray-600 dark:hover:bg-gray-500 dark:text-gray-200",
                title: "Copy to clipboard",
              },
              React.createElement("svg", { className: "w-4 h-4", fill: "none", stroke: "currentColor", viewBox: "0 0 24 24", xmlns: "http://www.w3.org/2000/svg" }, React.createElement("path", { strokeLinecap: "round", strokeLinejoin: "round", strokeWidth: "2", d: "M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" })),
              React.createElement("span", null, "Copy")
            )
          )
        )
      ),
      React.createElement(
        "div",
        null,
        React.createElement(
          "label",
          { className: "block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1" },
          "Hashtags/SEO Titles:"
        ),
        React.createElement(
          "div",
          { className: "relative" },
          React.createElement("textarea", {
            readOnly: true,
            className: "w-full p-3 border border-gray-300 bg-gray-50 rounded-md resize-y min-h-[80px] shadow-sm text-gray-800 dark:bg-gray-800 dark:text-gray-100 dark:border-gray-600",
            value: extractedData.hashtags.join(' '),
            rows: 3,
          } as React.TextareaHTMLAttributes<HTMLTextAreaElement>),
          React.createElement(
            "div",
            { className: "absolute top-2 right-2 flex space-x-1" },
            onSpeakText && extractedData.hashtags.length > 0 && React.createElement(
              "button",
              {
                onClick: () => handleSpeakClick(extractedData.hashtags.join(' ')),
                className: "p-2 bg-gray-200 hover:bg-gray-300 rounded-md text-gray-700 text-xs flex items-center space-x-1 dark:bg-gray-600 dark:hover:bg-gray-500 dark:text-gray-200",
                title: "Speak text aloud",
              },
              React.createElement("svg", { className: "w-4 h-4", fill: "none", stroke: "currentColor", viewBox: "0 0 24 24", xmlns: "http://www.w3.org/2000/svg" }, React.createElement("path", { strokeLinecap: "round", strokeLinejoin: "round", strokeWidth: "2", d: "M15.536 8.464a5 5 0 010 7.072m2.828-9.9a9 9 0 010 12.728M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.106 12 5v14c0 .894-1.077 1.337-1.707.707L5.586 15z" })),
              React.createElement("span", null, "Speak")
            ),
            React.createElement(
              "button",
              {
                onClick: () => handleCopyToClipboard(extractedData.hashtags.join(' ')),
                className: "p-2 bg-gray-200 hover:bg-gray-300 rounded-md text-gray-700 text-xs flex items-center space-x-1 dark:bg-gray-600 dark:hover:bg-gray-500 dark:text-gray-200",
                title: "Copy to clipboard",
              },
              React.createElement("svg", { className: "w-4 h-4", fill: "none", stroke: "currentColor", viewBox: "0 0 24 24", xmlns: "http://www.w3.org/2000/svg" }, React.createElement("path", { strokeLinecap: "round", strokeLinejoin: "round", strokeWidth: "2", d: "M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" })),
              React.createElement("span", null, "Copy")
            )
          )
        )
      )
    )
  );
};