// components/TextAnalyzer.tsx
import React, { useState, useCallback, useEffect, useRef } from 'react';
import { generateContentWithChat } from '../services/geminiService';
import { DEFAULT_AI_MODEL, SYSTEM_INSTRUCTION_TEXT_ANALYZER } from '../constants';
import LoadingSpinner from './LoadingSpinner';
import { AIActionProps, ChatMessage, ChatMessageType, ChatSession, DebugLogLevel } from '../types';
import { globalEmitter } from '../utils/eventEmitter'; // Import the global emitter


export const TextAnalyzer: React.FC<AIActionProps> = ({ initialInput, onActionComplete, onLogDebug, onSpeakText }) => {
  const [inputText, setInputText] = useState(initialInput || '');
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [currentQuestion, setCurrentQuestion] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isApiKeyMissing, setIsApiKeyMissing] = useState(false);
  const chatEndRef = useRef<HTMLDivElement>(null);

  const processText = useCallback(async (initialText: string) => {
    setIsLoading(true);
    setError(null);
    setChatMessages([]); // Clear previous chat
    // Fix: Declare initialPrompt outside the try block
    let initialPrompt = ''; 
    try {
      if (!process.env.API_KEY) {
        setIsApiKeyMissing(true);
        setError("API Key is not configured. Please ensure your API key is set in the environment.");
        onLogDebug?.({
          id: `text-analyzer-api-key-missing-${Date.now()}`,
          timestamp: new Date(),
          level: DebugLogLevel.API_KEY_MISSING,
          message: "Text Analyzer failed: API Key is not configured.",
        });
        return;
      }
      setIsApiKeyMissing(false);

      initialPrompt = `Analyze the following text: "${initialText}". Explain any complex parts, analyze arguments, and generate initial insights.`;

      // Start a new chat session for this analysis
      const userMessage: ChatMessage = {
        id: Date.now().toString() + '-user',
        type: ChatMessageType.USER,
        content: initialPrompt,
        timestamp: new Date(),
      };
      setChatMessages([userMessage]);

      const response = await generateContentWithChat({
        model: DEFAULT_AI_MODEL,
        history: [], // Start with an empty history for the first turn
        message: initialPrompt,
        systemInstruction: SYSTEM_INSTRUCTION_TEXT_ANALYZER,
        onLogDebug: onLogDebug || ((entry) => globalEmitter.emit('debugLog', entry)), // Use prop callback or global emitter
      });

      const modelMessage: ChatMessage = {
        id: Date.now().toString() + '-model',
        type: ChatMessageType.MODEL,
        content: response.text.trim(),
        timestamp: new Date(),
        fullResponse: response, // Store full response for potential debugging or future use
      };
      setChatMessages(prev => [...prev, modelMessage]);
      onActionComplete?.(response.text.trim());

    } catch (err: any) {
      console.error('Error analyzing text:', err);
      if (err.message.includes("API Key is not configured")) { // Check for the custom error message
        setIsApiKeyMissing(true);
        setError("API Key is not configured. Please ensure your API key is set in the environment.");
        onLogDebug?.({
          id: `text-analyzer-api-key-invalid-${Date.now()}`,
          timestamp: new Date(),
          level: DebugLogLevel.API_KEY_MISSING,
          message: `Text Analyzer failed: API Key invalid.`,
          details: { error: err.message },
        });
      } else {
        setError(`Failed to analyze text: ${err.message}`);
        onLogDebug?.({
          id: `text-analyzer-error-${Date.now()}`,
          timestamp: new Date(),
          level: DebugLogLevel.ERROR,
          message: `Text Analyzer failed: ${err.message}`,
          details: { error: err.message, prompt: initialPrompt },
        });
      }
    } finally {
      setIsLoading(false);
    }
  }, [onActionComplete, onLogDebug]);

  const sendChatMessage = useCallback(async (message: string) => {
    if (!message.trim()) return;

    setIsLoading(true);
    setError(null);

    const newUserMessage: ChatMessage = {
      id: Date.now().toString() + '-user',
      type: ChatMessageType.USER,
      content: message,
      timestamp: new Date(),
    };
    setChatMessages(prev => [...prev, newUserMessage]);
    setCurrentQuestion('');

    try {
      if (!process.env.API_KEY) {
        setIsApiKeyMissing(true);
        setError("API Key is not configured. Please ensure your API key is set in the environment.");
        onLogDebug?.({
          id: `text-analyzer-chat-api-key-missing-${Date.now()}`,
          timestamp: new Date(),
          level: DebugLogLevel.API_KEY_MISSING,
          message: "Text Analyzer chat failed: API Key is not configured.",
        });
        return;
      }
      setIsApiKeyMissing(false);

      const response = await generateContentWithChat({
        model: DEFAULT_AI_MODEL,
        history: chatMessages, // Send the accumulated history
        message: message,
        systemInstruction: SYSTEM_INSTRUCTION_TEXT_ANALYZER,
        onLogDebug: onLogDebug || ((entry) => globalEmitter.emit('debugLog', entry)), // Use prop callback or global emitter
      });

      const newModelMessage: ChatMessage = {
        id: Date.now().toString() + '-model',
        type: ChatMessageType.MODEL,
        content: response.text.trim(),
        timestamp: new Date(),
        fullResponse: response,
      };
      setChatMessages(prev => [...prev, newModelMessage]);
      onActionComplete?.(response.text.trim());

    } catch (err: any) {
      console.error('Error sending chat message:', err);
      if (err.message.includes("API Key is not configured")) { // Check for the custom error message
        setIsApiKeyMissing(true);
        setError("API Key is not configured. Please ensure your API key is set in the environment.");
        onLogDebug?.({
          id: `text-analyzer-chat-api-key-invalid-${Date.now()}`,
          timestamp: new Date(),
          level: DebugLogLevel.API_KEY_MISSING,
          message: `Text Analyzer chat failed: API Key invalid.`,
          details: { error: err.message },
        });
      } else {
        setError(`Failed to send message: ${err.message}`);
        onLogDebug?.({
          id: `text-analyzer-chat-error-${Date.now()}`,
          timestamp: new Date(),
          level: DebugLogLevel.ERROR,
          message: `Text Analyzer chat failed: ${err.message}`,
          details: { error: err.message, message },
        });
      }
    } finally {
      setIsLoading(false);
    }
  }, [chatMessages, onActionComplete, onLogDebug]);

  useEffect(() => {
    if (initialInput) {
      setInputText(initialInput);
      processText(initialInput);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initialInput]);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [chatMessages]);


  const handleStartAnalysis = () => {
    if (!inputText.trim()) {
      setError("Please enter some text to analyze.");
      return;
    }
    processText(inputText);
  };

  const handleSendMessage = () => {
    sendChatMessage(currentQuestion);
  };

  const handleSpeakClick = (text: string) => {
    if (text && onSpeakText) {
      onSpeakText(text);
    }
  };

  const renderMessageContent = (content: string, isModelMessage: boolean, messageId: string) => {
    let formattedContent = content;
    formattedContent = formattedContent.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>'); // Bold
    formattedContent = formattedContent.replace(/\*(.*?)\*/g, '<em>$1</em>'); // Italic

    return React.createElement(
      "div",
      { className: "flex items-start justify-between" },
      React.createElement('p', {
        dangerouslySetInnerHTML: { __html: formattedContent },
        className: 'whitespace-pre-wrap flex-grow', // Preserve line breaks
      }),
      isModelMessage && onSpeakText && React.createElement(
        "button",
        {
          onClick: () => handleSpeakClick(content),
          className: "ml-2 p-1 bg-gray-200 hover:bg-gray-300 rounded-md text-gray-700 text-xs flex-shrink-0 dark:bg-gray-600 dark:hover:bg-gray-500 dark:text-gray-200",
          title: "Speak message aloud",
          "aria-label": `Speak message ${messageId}`,
        },
        React.createElement("svg", { className: "w-4 h-4", fill: "none", stroke: "currentColor", viewBox: "0 0 24 24", xmlns: "http://www.w3.org/2000/svg" }, React.createElement("path", { strokeLinecap: "round", strokeLinejoin: "round", strokeWidth: "2", d: "M15.536 8.464a5 5 0 010 7.072m2.828-9.9a9 9 0 010 12.728M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.106 12 5v14c0 .894-1.077 1.337-1.707.707L5.586 15z" }))
      )
    );
  };

  return React.createElement(
    "div",
    { className: "p-4 space-y-4 flex flex-col h-full" },
    React.createElement(
      "h2",
      { className: "text-xl font-bold text-gray-800 dark:text-gray-200" },
      "Text Analyzer & Discussor"
    ),
    React.createElement(
      "p",
      { className: "text-sm text-gray-600 dark:text-gray-400" },
      "Read content, explain complex parts, analyze arguments, generate insights, and discuss."
    ),
    (!chatMessages.length && !initialInput) && React.createElement(
      "div",
      null,
      React.createElement(
        "label",
        { htmlFor: "analyzer-input", className: "block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1" },
        "Content to Analyze:"
      ),
      React.createElement("textarea", {
        id: "analyzer-input",
        className: "w-full p-3 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500 resize-y min-h-[120px] shadow-sm text-gray-800 bg-white dark:bg-gray-700 dark:text-gray-100 dark:border-gray-600",
        placeholder: "Paste article, research, or post content here...",
        value: inputText,
        onChange: (e) => setInputText(e.target.value),
        rows: 6,
        disabled: isLoading,
      } as React.TextareaHTMLAttributes<HTMLTextAreaElement>)
    ),
    (!chatMessages.length && !initialInput) && React.createElement(
      "button",
      {
        onClick: handleStartAnalysis,
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
          " Analyzing..."
        )
      ) : (
        "Start Analysis"
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
    chatMessages.length > 0 && React.createElement(
      "div",
      { className: "flex-1 overflow-y-auto bg-gray-50 dark:bg-gray-800 p-3 rounded-md border border-gray-200 dark:border-gray-700" },
      chatMessages.map((msg) =>
        React.createElement(
          "div",
          {
            key: msg.id,
            className: `mb-3 p-2 rounded-lg ${msg.type === ChatMessageType.USER ? 'bg-blue-100 text-blue-900 self-end ml-auto max-w-[80%] dark:bg-blue-800 dark:text-blue-100' : 'bg-gray-200 text-gray-800 self-start mr-auto max-w-[80%] dark:bg-gray-700 dark:text-gray-200'}`
          },
          React.createElement(
            "p",
            { className: "font-semibold text-xs mb-1" },
            msg.type === ChatMessageType.USER ? "You" : "AI Assistant"
          ),
          renderMessageContent(msg.content, msg.type === ChatMessageType.MODEL, msg.id)
        )
      ),
      isLoading && React.createElement(LoadingSpinner, null),
      React.createElement("div", { ref: chatEndRef })
    ),
    chatMessages.length > 0 && React.createElement(
      "div",
      { className: "flex items-center space-x-2 pt-2" },
      React.createElement("input", {
        type: "text",
        className: "flex-1 p-3 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500 shadow-sm text-gray-800 bg-white dark:bg-gray-700 dark:text-gray-100 dark:border-gray-600",
        placeholder: "Ask a follow-up question...",
        value: currentQuestion,
        onChange: (e) => setCurrentQuestion(e.target.value),
        onKeyPress: (e) => {
          if (e.key === 'Enter' && currentQuestion.trim() && !isLoading) {
            handleSendMessage();
          }
        },
        disabled: isLoading,
      } as React.InputHTMLAttributes<HTMLInputElement>),
      React.createElement(
        "button",
        {
          onClick: handleSendMessage,
          disabled: isLoading || !currentQuestion.trim(),
          className: `px-4 py-2 rounded-md text-white font-semibold transition-colors
            ${isLoading || !currentQuestion.trim()
              ? 'bg-blue-300 cursor-not-allowed'
              : 'bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50'
            }`,
        },
        "Send"
      )
    )
  );
};