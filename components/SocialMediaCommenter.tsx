// components/SocialMediaCommenter.tsx
import React, { useState, useCallback, useEffect } from 'react';
import { generateTextContent } from '../services/geminiService';
import { DEFAULT_AI_MODEL, SYSTEM_INSTRUCTION_SOCIAL_MEDIA_COMMENTER } from '../constants';
import LoadingSpinner from './LoadingSpinner';
import { AIActionProps, DebugLogLevel } from '../types';
import { globalEmitter } from '../utils/eventEmitter'; // Import the global emitter


export const SocialMediaCommenter: React.FC<AIActionProps> = ({ initialInput, onActionComplete, onLogDebug, onSpeakText }) => {
  const [postContent, setPostContent] = useState(initialInput || '');
  const [comment, setComment] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isApiKeyMissing, setIsApiKeyMissing] = useState(false);
  const [emojiMode, setEmojiMode] = useState(false);

  const generateComment = useCallback(async (content: string, isEmojiMode: boolean) => {
    setIsLoading(true);
    setError(null);
    try {
      if (!process.env.API_KEY) {
        setIsApiKeyMissing(true);
        setError("API Key is not configured. Please ensure your API key is set in the environment.");
        onLogDebug?.({
          id: `social-commenter-api-key-missing-${Date.now()}`,
          timestamp: new Date(),
          level: DebugLogLevel.API_KEY_MISSING,
          message: "Social Media Commenter failed: API Key is not configured.",
        });
        return;
      }
      setIsApiKeyMissing(false);

      const prompt = isEmojiMode
        ? `Given the following social media post, generate a short, polite, context-relevant, and concise comment using ONLY emojis (1-3 emojis max).
        Post: "${content}"`
        : `Given the following social media post, generate a short, polite, coherent, and concise comment (max 20 words).
        Post: "${content}"`;

      const { text } = await generateTextContent({
        model: DEFAULT_AI_MODEL,
        prompt: prompt,
        systemInstruction: SYSTEM_INSTRUCTION_SOCIAL_MEDIA_COMMENTER,
        onLogDebug: onLogDebug || ((entry) => globalEmitter.emit('debugLog', entry)), // Use prop callback or global emitter
      });
      setComment(text.trim());
      onActionComplete?.(text.trim());
    } catch (err: any) {
      console.error('Error generating comment:', err);
      if (err.message.includes("API Key is not configured")) { // Check for the custom error message
        setIsApiKeyMissing(true);
        setError("API Key is not configured. Please ensure your API key is set in the environment.");
        onLogDebug?.({
          id: `social-commenter-api-key-invalid-${Date.now()}`,
          timestamp: new Date(),
          level: DebugLogLevel.API_KEY_MISSING,
          message: `Social Media Commenter failed: API Key invalid.`,
          details: { error: err.message },
        });
      } else {
        setError(`Failed to generate comment: ${err.message}`);
        onLogDebug?.({
          id: `social-commenter-error-${Date.now()}`,
          timestamp: new Date(),
          level: DebugLogLevel.ERROR,
          message: `Social Media Commenter failed: ${err.message}`,
          details: { error: err.message, prompt },
        });
      }
    } finally {
      setIsLoading(false);
    }
  }, [onActionComplete, onLogDebug]);

  useEffect(() => {
    if (initialInput) {
      setPostContent(initialInput);
      generateComment(initialInput, emojiMode);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initialInput, emojiMode]); // Added generateComment to deps as it's stable via useCallback

  const handleGenerateClick = () => {
    if (!postContent.trim()) {
      setError("Please enter some social media content to comment on.");
      return;
    }
    generateComment(postContent, emojiMode);
  };

  const handleCopyToClipboard = () => {
    if (comment) {
      navigator.clipboard.writeText(comment);
    }
  };

  const handleSpeakClick = () => {
    if (comment && onSpeakText) {
      onSpeakText(comment);
    }
  };

  return React.createElement(
    "div",
    { className: "p-4 space-y-4" },
    React.createElement(
      "h2",
      { className: "text-xl font-bold text-gray-800 dark:text-gray-200" },
      "Social Media Commenter"
    ),
    React.createElement(
      "p",
      { className: "text-sm text-gray-600 dark:text-gray-400" },
      "Reply to posts with short, context-relevant comments. Optional emoji-only mode."
    ),
    React.createElement(
      "div",
      null,
      React.createElement(
        "label",
        { htmlFor: "post-content", className: "block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1" },
        "Social Media Post Content:"
      ),
      React.createElement("textarea", {
        id: "post-content",
        className: "w-full p-3 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500 resize-y min-h-[120px] shadow-sm text-gray-800 bg-white dark:bg-gray-700 dark:text-gray-100 dark:border-gray-600",
        placeholder: "Paste the social media post content here...",
        value: postContent,
        onChange: (e) => setPostContent(e.target.value),
        rows: 6,
        disabled: isLoading,
      } as React.TextareaHTMLAttributes<HTMLTextAreaElement>)
    ),
    React.createElement(
      "div",
      { className: "flex items-center" },
      React.createElement("input", {
        id: "emoji-mode-toggle",
        type: "checkbox",
        checked: emojiMode,
        onChange: (e) => setEmojiMode(e.target.checked),
        className: "h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded dark:bg-gray-700 dark:border-gray-600 dark:checked:bg-blue-600",
        disabled: isLoading,
      } as React.InputHTMLAttributes<HTMLInputElement>),
      React.createElement(
        "label",
        { htmlFor: "emoji-mode-toggle", className: "ml-2 block text-sm text-gray-900 dark:text-gray-300" },
        "Emoji-only mode"
      )
    ),
    React.createElement(
      "button",
      {
        onClick: handleGenerateClick,
        disabled: isLoading || !postContent.trim(),
        className: `w-full py-2 px-4 rounded-md text-white font-semibold transition-colors
          ${isLoading || !postContent.trim()
            ? 'bg-blue-300 cursor-not-allowed'
            : 'bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50'
          }`,
      },
      isLoading ? (
        React.createElement(
          "span",
          { className: "flex items-center justify-center" },
          React.createElement(LoadingSpinner, null),
          " Generating Comment..."
        )
      ) : (
        "Generate Comment"
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
    comment &&
    React.createElement(
      "div",
      { className: "space-y-2" },
      React.createElement(
        "label",
        { className: "block text-sm font-medium text-gray-700 dark:text-gray-300" },
        "Generated Comment:"
      ),
      React.createElement(
        "div",
        { className: "relative" },
        React.createElement("textarea", {
          readOnly: true,
          className: "w-full p-3 border border-gray-300 bg-gray-50 rounded-md resize-y min-h-[100px] shadow-sm text-gray-800 dark:bg-gray-800 dark:text-gray-100 dark:border-gray-600",
          value: comment,
          rows: 4,
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