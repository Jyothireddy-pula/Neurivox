// components/VoiceControl.tsx
import React, { useState, useCallback, useEffect } from 'react';
import { generateTextContent } from '../services/geminiService';
import { DEFAULT_AI_MODEL } from '../constants';
import LoadingSpinner from './LoadingSpinner';
import { AIActionProps, DebugLogLevel } from '../types';
import { globalEmitter } from '../utils/eventEmitter';

// Added comprehensive `declare global` for SpeechRecognition API to resolve TypeScript errors.
// These types are typically available via "lib": ["dom"] in tsconfig.json,
// but are explicitly defined here to ensure compatibility in all environments.
declare global {
  // Define the SpeechRecognition interface
  interface SpeechRecognition extends EventTarget {
    grammars: SpeechGrammarList;
    lang: string;
    continuous: boolean;
    interimResults: boolean;
    maxAlternatives: number;
    serviceURI: string;

    start(): void;
    stop(): void;
    abort(): void;

    onaudiostart: ((this: SpeechRecognition, ev: Event) => any) | null;
    onaudioend: ((this: SpeechRecognition, ev: Event) => any) | null;
    onend: ((this: SpeechRecognition, ev: Event) => any) | null;
    onerror: ((this: SpeechRecognition, ev: SpeechRecognitionErrorEvent) => any) | null;
    onomatch: ((this: SpeechRecognition, ev: SpeechRecognitionEvent) => any) | null;
    onresult: ((this: SpeechRecognition, ev: SpeechRecognitionEvent) => any) | null;
    onsoundstart: ((this: SpeechRecognition, ev: Event) => any) | null;
    onsoundend: ((this: SpeechRecognition, ev: Event) => any) | null;
    onspeechstart: ((this: SpeechRecognition, ev: Event) => any) | null;
    onspeechend: ((this: SpeechRecognition, ev: Event) => any) | null;
    onstart: ((this: SpeechRecognition, ev: Event) => any) | null;

    addEventListener<K extends keyof SpeechRecognitionEventMap>(type: K, listener: (this: SpeechRecognition, ev: SpeechRecognitionEventMap[K]) => any, options?: boolean | AddEventListenerOptions): void;
    addEventListener(type: string, listener: EventListenerOrEventListenerObject, options?: boolean | AddEventListenerOptions): void;
    removeEventListener<K extends keyof SpeechRecognitionEventMap>(type: K, listener: (this: SpeechRecognition, ev: SpeechRecognitionEventMap[K]) => any, options?: boolean | EventListenerOptions): void;
    removeEventListener(type: string, listener: EventListenerOrEventListenerObject, options?: boolean | EventListenerOptions): void;
  }

  // Declare the SpeechRecognition constructor global variable
  var SpeechRecognition: {
    prototype: SpeechRecognition;
    new(): SpeechRecognition;
  };

  // Extend the Window interface to include webkitSpeechRecognition
  interface Window {
    webkitSpeechRecognition: {
      prototype: SpeechRecognition;
      new(): SpeechRecognition;
    };
  }

  // Define related event map and event interfaces if not already in lib.dom
  interface SpeechRecognitionEventMap {
    "audiostart": Event;
    "audioend": Event;
    "end": Event;
    "error": SpeechRecognitionErrorEvent;
    "nomatch": SpeechRecognitionEvent;
    "result": SpeechRecognitionEvent;
    "soundstart": Event;
    "soundend": Event;
    "speechstart": Event;
    "speechend": Event;
    "start": Event;
  }

  interface SpeechRecognitionEvent extends Event {
    readonly results: SpeechRecognitionResultList;
    readonly interpretation: any;
    readonly emma: Document | null;
  }

  interface SpeechRecognitionResultList {
    readonly length: number;
    item(index: number): SpeechRecognitionResult;
    [index: number]: SpeechRecognitionResult;
  }

  interface SpeechRecognitionResult {
    readonly length: number;
    item(index: number): SpeechRecognitionAlternative;
    [index: number]: SpeechRecognitionAlternative;
    readonly isFinal: boolean;
  }

  interface SpeechRecognitionAlternative {
    readonly transcript: string;
    readonly confidence: number;
  }

  interface SpeechRecognitionErrorEvent extends Event {
    readonly error: SpeechRecognitionErrorCode;
    readonly message: string;
  }

  type SpeechRecognitionErrorCode =
    | "no-speech"
    | "aborted"
    | "audio-capture"
    | "network"
    | "not-allowed"
    | "service-not-allowed"
    | "bad-grammar"
    | "language-not-supported";

  interface SpeechGrammarList {
    readonly length: number;
    addFromString(grammar: string, weight?: number): void;
    addFromURI(src: string, weight?: number): void;
    item(index: number): SpeechGrammar;
    [index: number]: SpeechGrammar;
  }

  interface SpeechGrammar {
    src: string;
    weight: number;
  }
}

export const VoiceControl: React.FC<AIActionProps> = ({ onActionComplete, onLogDebug, onSpeakText }) => {
  const [inputText, setInputText] = useState('');
  const [aiResponse, setAiResponse] = useState('');
  const [isListening, setIsListening] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isApiKeyMissing, setIsApiKeyMissing] = useState(false);
  const recognitionRef = React.useRef<SpeechRecognition | null>(null);

  const startListening = useCallback(() => {
    setError(null);
    // Access SpeechRecognition via window
    if (!('SpeechRecognition' in window) && !('webkitSpeechRecognition' in window)) {
      setError("Speech Recognition is not supported in your browser.");
      onLogDebug?.({
        id: `voice-control-error-${Date.now()}`,
        timestamp: new Date(),
        level: DebugLogLevel.ERROR,
        message: "Speech Recognition not supported.",
      });
      return;
    }

    const SpeechRecognition = (window.SpeechRecognition || window.webkitSpeechRecognition);
    recognitionRef.current = new SpeechRecognition();
    recognitionRef.current.continuous = false;
    recognitionRef.current.interimResults = false;
    recognitionRef.current.lang = 'en-US';

    recognitionRef.current.onstart = () => {
      setIsListening(true);
      onLogDebug?.({
        id: `voice-control-start-${Date.now()}`,
        timestamp: new Date(),
        level: DebugLogLevel.INFO,
        message: "Voice control: Started listening.",
      });
    };

    recognitionRef.current.onresult = (event) => {
      const transcript = Array.from(event.results)
        .map((result) => result[0])
        .map((result) => result.transcript)
        .join('');
      setInputText(transcript);
      if (transcript.trim()) {
        sendToAI(transcript);
      }
    };

    recognitionRef.current.onerror = (event) => {
      setIsListening(false);
      setError(`Speech recognition error: ${event.error}`);
      onLogDebug?.({
        id: `voice-control-error-${Date.now()}`,
        timestamp: new Date(),
        level: DebugLogLevel.ERROR,
        message: `Voice control: Speech recognition error - ${event.error}`,
        details: { error: event.error },
      });
    };

    recognitionRef.current.onend = () => {
      setIsListening(false);
      onLogDebug?.({
        id: `voice-control-end-${Date.now()}`,
        timestamp: new Date(),
        level: DebugLogLevel.INFO,
        message: "Voice control: Stopped listening.",
      });
    };

    recognitionRef.current.start();
  }, [onLogDebug]);

  const stopListening = useCallback(() => {
    if (recognitionRef.current) {
      recognitionRef.current.stop();
      setIsListening(false);
      onLogDebug?.({
        id: `voice-control-stop-manual-${Date.now()}`,
        timestamp: new Date(),
        level: DebugLogLevel.INFO,
        message: "Voice control: Manual stop listening.",
      });
    }
  }, [onLogDebug]);

  const sendToAI = useCallback(async (command: string) => {
    setIsLoading(true);
    setError(null);
    setAiResponse('');
    try {
      if (!process.env.API_KEY) {
        setIsApiKeyMissing(true);
        setError("API Key is not configured. Please ensure your API key is set in the environment.");
        onLogDebug?.({
          id: `voice-control-api-key-missing-${Date.now()}`,
          timestamp: new Date(),
          level: DebugLogLevel.API_KEY_MISSING,
          message: "Voice Control failed: API Key is not configured.",
        });
        return;
      }
      setIsApiKeyMissing(false);

      const systemInstruction = "You are a helpful AI assistant that responds to voice commands and queries. Provide concise and relevant answers.";
      const prompt = `Respond to this voice command/query: "${command}"`;

      const { text } = await generateTextContent({
        model: DEFAULT_AI_MODEL,
        prompt: prompt,
        systemInstruction: systemInstruction,
        onLogDebug: onLogDebug || ((entry) => globalEmitter.emit('debugLog', entry)),
      });
      setAiResponse(text.trim());
      onActionComplete?.(text.trim());

      if (onSpeakText) {
        onSpeakText(text.trim());
      }

    } catch (err: any) {
      console.error('Error processing voice command:', err);
      if (err.message.includes("API Key is not configured")) { // Check for the custom error message
        setIsApiKeyMissing(true);
        setError("API Key is not configured. Please ensure your API key is set in the environment.");
        onLogDebug?.({
          id: `voice-control-api-key-invalid-${Date.now()}`,
          timestamp: new Date(),
          level: DebugLogLevel.API_KEY_MISSING,
          message: `Voice Control failed: API Key invalid.`,
          details: { error: err.message },
        });
      } else {
        setError(`Failed to process command: ${err.message}`);
        onLogDebug?.({
          id: `voice-control-error-${Date.now()}`,
          timestamp: new Date(),
          level: DebugLogLevel.ERROR,
          message: `Voice Control failed: ${err.message}`,
          details: { error: err.message, command },
        });
      }
    } finally {
      setIsLoading(false);
    }
  }, [onActionComplete, onLogDebug, onSpeakText]);

  const handleManualSend = () => {
    if (inputText.trim()) {
      sendToAI(inputText);
    } else {
      setError("Please enter a command to send to AI.");
    }
  };

  const handleCopyToClipboard = () => {
    if (aiResponse) {
      navigator.clipboard.writeText(aiResponse);
    }
  };

  return React.createElement(
    "div",
    { className: "p-4 space-y-4 dark:bg-gray-900 dark:text-gray-200" },
    React.createElement(
      "h2",
      { className: "text-xl font-bold text-gray-800 dark:text-gray-200" },
      "Voice-to-Prompt / Speech Command"
    ),
    React.createElement(
      "p",
      { className: "text-sm text-gray-600 dark:text-gray-400 mb-4" },
      "Speak your instructions or type them; AI will execute them and respond vocally."
    ),
    React.createElement(
      "div",
      { className: "flex items-center justify-center space-x-4 mb-4" },
      React.createElement(
        "button",
        {
          onClick: isListening ? stopListening : startListening,
          disabled: isLoading,
          className: `py-3 px-6 rounded-full text-white font-semibold transition-colors flex items-center space-x-2
            ${isListening
              ? 'bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-opacity-50'
              : 'bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50'
            }
            ${isLoading ? 'opacity-50 cursor-not-allowed' : ''}`
        },
        isListening ? (
          React.createElement(
            React.Fragment,
            null,
            React.createElement("svg", { className: "w-5 h-5 animate-pulse", fill: "none", stroke: "currentColor", viewBox: "0 0 24 24", xmlns: "http://www.w3.org/2000/svg" }, React.createElement("path", { strokeLinecap: "round", strokeLinejoin: "round", strokeWidth: "2", d: "M21 12a9 9 0 11-18 0 9 9 0 0118 0z" }), React.createElement("path", { strokeLinecap: "round", strokeLinejoin: "round", strokeWidth: "2", d: "M9 10H7m2 0v6m4-6H9m2 0V4m4 6h2m-2 0v6m-4 0v2m4-2h-4" })),
            " Stop Listening"
          )
        ) : (
          React.createElement(
            React.Fragment,
            null,
            React.createElement("svg", { className: "w-5 h-5", fill: "none", stroke: "currentColor", viewBox: "0 0 24 24", xmlns: "http://www.w3.org/2000/svg" }, React.createElement("path", { strokeLinecap: "round", strokeLinejoin: "round", strokeWidth: "2", d: "M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a4 4 0 11-8 0 4 4 0 018 0z" })),
            " Start Listening"
          )
        )
      )
    ),
    isListening && React.createElement(
      "p",
      { className: "text-center text-blue-600 dark:text-blue-400 font-medium" },
      "Listening for your command..."
    ),
    React.createElement(
      "div",
      null,
      React.createElement(
        "label",
        { htmlFor: "voice-input", className: "block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1" },
        "Your Command (or transcribed speech):"
      ),
      React.createElement("textarea", {
        id: "voice-input",
        className: "w-full p-3 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500 resize-y min-h-[80px] shadow-sm text-gray-800 bg-white dark:bg-gray-700 dark:text-gray-100 dark:border-gray-600",
        placeholder: "Type your command here or click 'Start Listening'...",
        value: inputText,
        onChange: (e) => setInputText(e.target.value),
        rows: 4,
        disabled: isLoading,
      } as React.TextareaHTMLAttributes<HTMLTextAreaElement>)
    ),
    React.createElement(
      "button",
      {
        onClick: handleManualSend,
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
          " Processing Command..."
        )
      ) : (
        "Send Command to AI"
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
    aiResponse &&
    React.createElement(
      "div",
      { className: "space-y-2" },
      React.createElement(
        "label",
        { className: "block text-sm font-medium text-gray-700 dark:text-gray-300" },
        "AI Response:"
      ),
      React.createElement(
        "div",
        { className: "relative" },
        React.createElement("textarea", {
          readOnly: true,
          className: "w-full p-3 border border-gray-300 bg-gray-50 rounded-md resize-y min-h-[120px] shadow-sm text-gray-800 dark:bg-gray-800 dark:text-gray-100 dark:border-gray-600",
          value: aiResponse,
          rows: 6,
        } as React.TextareaHTMLAttributes<HTMLTextAreaElement>),
        React.createElement(
          "button",
          {
            onClick: handleCopyToClipboard,
            className: "absolute top-2 right-2 p-2 bg-gray-200 hover:bg-gray-300 rounded-md text-gray-700 text-xs flex items-center space-x-1 dark:bg-gray-600 dark:hover:bg-gray-500 dark:text-gray-200",
            title: "Copy to clipboard",
          },
          React.createElement("svg", { className: "w-4 h-4", fill: "none", stroke: "currentColor", viewBox: "0 0 24 24", xmlns: "http://www.w3.org/2000/svg" }, React.createElement("path", { strokeLinecap: "round", strokeLinejoin: "round", strokeWidth: "2", d: "M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" })),
          React.createElement("span", null, "Copy")
        )
      )
    )
  );
};