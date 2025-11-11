// components/Translator.tsx
import React, { useState, useCallback, useEffect } from 'react';
import { generateTextContent, detectLanguage } from '../services/geminiService';
import { DEFAULT_AI_MODEL, SYSTEM_INSTRUCTION_TRANSLATOR } from '../constants';
import LoadingSpinner from './LoadingSpinner';
import { AIActionProps, LanguageCode, DebugLogLevel } from '../types';
import { globalEmitter } from '../utils/eventEmitter'; // Import the global emitter


export const Translator: React.FC<AIActionProps> = ({ initialInput, onActionComplete, onLogDebug, onSpeakText }) => {
  const [inputText, setInputText] = useState(initialInput || '');
  const [translatedText, setTranslatedText] = useState('');
  const [detectedLanguage, setDetectedLanguage] = useState('...');
  const [targetLanguage, setTargetLanguage] = useState<LanguageCode>(LanguageCode.ENGLISH_US);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isApiKeyMissing, setIsApiKeyMissing] = useState(false);

  const availableLanguages = [
    { code: LanguageCode.ENGLISH_US, name: 'English (US)' },
    { code: LanguageCode.FRENCH, name: 'French' },
    { code: LanguageCode.SPANISH, name: 'Spanish' },
    { code: LanguageCode.GERMAN, name: 'German' },
    { code: LanguageCode.ITALIAN, name: 'Italian' },
    { code: LanguageCode.PORTUGUESE, name: 'Portuguese' },
    { code: LanguageCode.CHINESE, name: 'Chinese (Simplified)' },
    { code: LanguageCode.JAPANESE, name: 'Japanese' },
    { code: LanguageCode.KOREAN, name: 'Korean' },
    { code: LanguageCode.ARABIC, name: 'Arabic' },
    { code: LanguageCode.HINDI, name: 'Hindi' },
    { code: LanguageCode.RUSSIAN, name: 'Russian' },
  ];

  const autoDetectLanguage = useCallback(async (text: string) => {
    if (!text.trim()) {
      setDetectedLanguage('...');
      return;
    }
    setDetectedLanguage('Detecting...');
    try {
      const lang = await detectLanguage(text, onLogDebug || ((entry) => globalEmitter.emit('debugLog', entry))); // Pass onLogDebug
      setDetectedLanguage(lang.toUpperCase());
    } catch (err) {
      console.error("Error during language detection:", err);
      setDetectedLanguage('Failed');
      onLogDebug?.({
        id: `translator-lang-detect-error-${Date.now()}`,
        timestamp: new Date(),
        level: DebugLogLevel.ERROR,
        message: `Language detection failed: ${String(err)}`,
        details: { error: String(err), text: text.substring(0, 50) },
      });
    }
  }, [onLogDebug]);

  // Effect to auto-detect language on input change (with a debounce for performance)
  useEffect(() => {
    const handler = setTimeout(() => {
      autoDetectLanguage(inputText);
    }, 500); // Debounce for 500ms
    return () => clearTimeout(handler);
  }, [inputText, autoDetectLanguage]);

  const translateText = useCallback(async (textToTranslate: string, toLang: LanguageCode) => {
    setIsLoading(true);
    setError(null);
    try {
      if (!process.env.API_KEY) {
        setIsApiKeyMissing(true);
        setError("API Key is not configured. Please ensure your API key is set in the environment.");
        onLogDebug?.({
          id: `translator-api-key-missing-${Date.now()}`,
          timestamp: new Date(),
          level: DebugLogLevel.API_KEY_MISSING,
          message: "Translator failed: API Key is not configured.",
        });
        return;
      }
      setIsApiKeyMissing(false);

      const prompt = `Translate the following text to ${toLang}.
      Text: "${textToTranslate}"`;

      const { text } = await generateTextContent({
        model: DEFAULT_AI_MODEL,
        prompt: prompt,
        systemInstruction: SYSTEM_INSTRUCTION_TRANSLATOR,
        onLogDebug: onLogDebug || ((entry) => globalEmitter.emit('debugLog', entry)), // Use prop callback or global emitter
      });
      setTranslatedText(text.trim());
      onActionComplete?.(text.trim());
    } catch (err: any) {
      console.error('Error translating text:', err);
      if (err.message.includes("API Key is not configured")) { // Check for the custom error message
        setIsApiKeyMissing(true);
        setError("API Key is not configured. Please ensure your API key is set in the environment.");
        onLogDebug?.({
          id: `translator-api-key-invalid-${Date.now()}`,
          timestamp: new Date(),
          level: DebugLogLevel.API_KEY_MISSING,
          message: `Translator failed: API Key invalid.`,
          details: { error: err.message },
        });
      } else {
        setError(`Failed to translate: ${err.message}`);
        onLogDebug?.({
          id: `translator-error-${Date.now()}`,
          timestamp: new Date(),
          level: DebugLogLevel.ERROR,
          message: `Translator failed: ${err.message}`,
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
      translateText(initialInput, targetLanguage);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initialInput]); // Only run when initialInput changes

  const handleTranslateClick = () => {
    if (!inputText.trim()) {
      setError("Please enter some text to translate.");
      return;
    }
    translateText(inputText, targetLanguage);
  };

  const handleCopyToClipboard = () => {
    if (translatedText) {
      navigator.clipboard.writeText(translatedText);
    }
  };

  const handleSpeakClick = () => {
    if (translatedText && onSpeakText) {
      onSpeakText(translatedText);
    }
  };

  return React.createElement(
    "div",
    { className: "p-4 space-y-4" },
    React.createElement(
      "h2",
      { className: "text-xl font-bold text-gray-800 dark:text-gray-200" },
      "Translator"
    ),
    React.createElement(
      "p",
      { className: "text-sm text-gray-600 dark:text-gray-400" },
      "Translate text between major languages, auto-detecting input and maintaining tone."
    ),
    React.createElement(
      "div",
      null,
      React.createElement(
        "label",
        { htmlFor: "translator-input", className: "block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1" },
        "Input Text (Detected: ",
        React.createElement("span", { className: "font-semibold" }, detectedLanguage),
        "):"
      ),
      React.createElement("textarea", {
        id: "translator-input",
        className: "w-full p-3 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500 resize-y min-h-[120px] shadow-sm text-gray-800 bg-white dark:bg-gray-700 dark:text-gray-100 dark:border-gray-600",
        placeholder: "Enter text to translate...",
        value: inputText,
        onChange: (e) => setInputText(e.target.value),
        rows: 6,
        disabled: isLoading,
      } as React.TextareaHTMLAttributes<HTMLTextAreaElement>)
    ),
    React.createElement(
      "div",
      null,
      React.createElement(
        "label",
        { htmlFor: "target-language", className: "block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1" },
        "Translate to:"
      ),
      React.createElement(
        "select",
        {
          id: "target-language",
          className: "w-full p-3 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500 shadow-sm text-gray-800 bg-white dark:bg-gray-700 dark:text-gray-100 dark:border-gray-600",
          value: targetLanguage,
          onChange: (e) => setTargetLanguage(e.target.value as LanguageCode),
          disabled: isLoading,
        } as React.SelectHTMLAttributes<HTMLSelectElement>,
        availableLanguages.map((lang) =>
          React.createElement(
            "option",
            { key: lang.code, value: lang.code },
            lang.name
          )
        )
      )
    ),
    React.createElement(
      "button",
      {
        onClick: handleTranslateClick,
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
          " Translating..."
        )
      ) : (
        "Translate"
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
    translatedText &&
    React.createElement(
      "div",
      { className: "space-y-2" },
      React.createElement(
        "label",
        { className: "block text-sm font-medium text-gray-700 dark:text-gray-300" },
        "Translated Text:"
      ),
      React.createElement(
        "div",
        { className: "relative" },
        React.createElement("textarea", {
          readOnly: true,
          className: "w-full p-3 border border-gray-300 bg-gray-50 rounded-md resize-y min-h-[120px] shadow-sm text-gray-800 dark:bg-gray-800 dark:text-gray-100 dark:border-gray-600",
          value: translatedText,
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