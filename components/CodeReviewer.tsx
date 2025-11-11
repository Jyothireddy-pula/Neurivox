// components/CodeReviewer.tsx
import React, { useState, useCallback, useEffect } from 'react';
import { generateTextContent } from '../services/geminiService';
import { DEFAULT_AI_MODEL, SYSTEM_INSTRUCTION_CODE_REVIEWER } from '../constants';
import LoadingSpinner from './LoadingSpinner';
import { AIActionProps, DebugLogLevel } from '../types';
import { globalEmitter } from '../utils/eventEmitter'; // Import the global emitter

type ReviewType = 'bugs' | 'optimize' | 'docstring' | 'security';

export const CodeReviewer: React.FC<AIActionProps> = ({ initialInput, onActionComplete, onLogDebug, onSpeakText }) => {
  const [codeSnippet, setCodeSnippet] = useState(initialInput || '');
  const [reviewType, setReviewType] = useState<ReviewType>('bugs');
  const [aiReview, setAiReview] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isApiKeyMissing, setIsApiKeyMissing] = useState(false);

  const performCodeReview = useCallback(async (code: string, type: ReviewType) => {
    setIsLoading(true);
    setError(null);
    setAiReview('');
    try {
      if (!process.env.API_KEY) {
        setIsApiKeyMissing(true);
        setError("API Key is not configured. Please ensure your API key is set in the environment.");
        onLogDebug?.({
          id: `code-reviewer-api-key-missing-${Date.now()}`,
          timestamp: new Date(),
          level: DebugLogLevel.API_KEY_MISSING,
          message: "Code Reviewer failed: API Key is not configured.",
        });
        return;
      }
      setIsApiKeyMissing(false);

      let prompt = `Review the following code snippet for ${type}. Provide detailed, actionable feedback.
      Code:
      \`\`\`
      ${code}
      \`\`\`
      `;

      if (type === 'bugs') {
        prompt = `Identify potential bugs, errors, and common pitfalls in the following code snippet. Explain why they are bugs and suggest fixes.
        Code:
        \`\`\`
        ${code}
        \`\`\`
        `;
      } else if (type === 'optimize') {
        prompt = `Suggest ways to optimize the following code snippet for performance, readability, and best practices.
        Code:
        \`\`\`
        ${code}
        \`\`\`
        `;
      } else if (type === 'docstring') {
        prompt = `Generate a clear and concise docstring (or code comments, if not a Python function) for the following code snippet, explaining its purpose, parameters, and return values.
        Code:
        \`\`\`
        ${code}
        \`\`\`
        `;
      } else if (type === 'security') {
        prompt = `Analyze the following code snippet for potential security vulnerabilities (e.g., injection, XSS, insecure deserialization) and suggest remediation steps.
        Code:
        \`\`\`
        ${code}
        \`\`\`
        `;
      }

      const { text } = await generateTextContent({
        model: DEFAULT_AI_MODEL,
        prompt: prompt,
        systemInstruction: SYSTEM_INSTRUCTION_CODE_REVIEWER,
        onLogDebug: onLogDebug || ((entry) => globalEmitter.emit('debugLog', entry)),
      });
      setAiReview(text.trim());
      onActionComplete?.(text.trim());
    } catch (err: any) {
      console.error('Error performing code review:', err);
      if (err.message.includes("API Key is not configured")) { // Check for the custom error message
        setIsApiKeyMissing(true);
        setError("API Key is not configured. Please ensure your API key is set in the environment.");
        onLogDebug?.({
          id: `code-reviewer-api-key-invalid-${Date.now()}`,
          timestamp: new Date(),
          level: DebugLogLevel.API_KEY_MISSING,
          message: `Code Reviewer failed: API Key invalid.`,
          details: { error: err.message },
        });
      } else {
        setError(`Failed to perform code review: ${err.message}`);
        onLogDebug?.({
          id: `code-reviewer-error-${Date.now()}`,
          timestamp: new Date(),
          level: DebugLogLevel.ERROR,
          message: `Code Reviewer failed: ${err.message}`,
          details: { error: err.message, prompt },
        });
      }
    } finally {
      setIsLoading(false);
    }
  }, [onActionComplete, onLogDebug]);

  useEffect(() => {
    if (initialInput) {
      setCodeSnippet(initialInput);
      performCodeReview(initialInput, reviewType);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initialInput, reviewType]);

  const handleReviewClick = () => {
    if (!codeSnippet.trim()) {
      setError("Please enter a code snippet to review.");
      return;
    }
    performCodeReview(codeSnippet, reviewType);
  };

  const handleCopyToClipboard = () => {
    if (aiReview) {
      navigator.clipboard.writeText(aiReview);
    }
  };

  const handleSpeakClick = () => {
    if (aiReview && onSpeakText) {
      onSpeakText(aiReview);
    }
  };

  return React.createElement(
    "div",
    { className: "p-4 space-y-4" },
    React.createElement(
      "h2",
      { className: "text-xl font-bold text-gray-800 dark:text-gray-200" },
      "Code Snippet Reviewer"
    ),
    React.createElement(
      "p",
      { className: "text-sm text-gray-600 dark:text-gray-400" },
      "Highlight code to get reviews, bug detection, optimization suggestions, or docstrings."
    ),
    React.createElement(
      "div",
      null,
      React.createElement(
        "label",
        { htmlFor: "code-input", className: "block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1" },
        "Code Snippet:"
      ),
      React.createElement("textarea", {
        id: "code-input",
        className: "w-full p-3 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500 resize-y min-h-[150px] shadow-sm text-gray-800 bg-white dark:bg-gray-700 dark:text-gray-100 dark:border-gray-600 font-mono text-sm",
        placeholder: "Paste your code here...",
        value: codeSnippet,
        onChange: (e) => setCodeSnippet(e.target.value),
        rows: 8,
        disabled: isLoading,
      } as React.TextareaHTMLAttributes<HTMLTextAreaElement>)
    ),
    React.createElement(
      "div",
      null,
      React.createElement(
        "label",
        { htmlFor: "review-type", className: "block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1" },
        "Review Type:"
      ),
      React.createElement(
        "select",
        {
          id: "review-type",
          className: "w-full p-3 border border-gray-300 rounded-md focus:ring-blue-500",
          value: reviewType,
          onChange: (e) => setReviewType(e.target.value as ReviewType),
          disabled: isLoading,
        } as React.SelectHTMLAttributes<HTMLSelectElement>,
        React.createElement("option", { value: "bugs" }, "Bug Detection"),
        React.createElement("option", { value: "optimize" }, "Optimization Suggestions"),
        React.createElement("option", { value: "docstring" }, "Docstring Generation"),
        React.createElement("option", { value: "security" }, "Security Vulnerabilities")
      )
    ),
    React.createElement(
      "button",
      {
        onClick: handleReviewClick,
        disabled: isLoading || !codeSnippet.trim(),
        className: `w-full py-2 px-4 rounded-md text-white font-semibold transition-colors
          ${isLoading || !codeSnippet.trim()
            ? 'bg-blue-300 cursor-not-allowed'
            : 'bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50'
          }`,
      },
      isLoading ? (
        React.createElement(
          "span",
          { className: "flex items-center justify-center" },
          React.createElement(LoadingSpinner, null),
          " Performing Review..."
        )
      ) : (
        "Perform Code Review"
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
    aiReview &&
    React.createElement(
      "div",
      { className: "space-y-2" },
      React.createElement(
        "label",
        { className: "block text-sm font-medium text-gray-700 dark:text-gray-300" },
        "AI Review:"
      ),
      React.createElement(
        "div",
        { className: "relative" },
        React.createElement("textarea", {
          readOnly: true,
          className: "w-full p-3 border border-gray-300 bg-gray-50 rounded-md resize-y min-h-[150px] shadow-sm text-gray-800 dark:bg-gray-800 dark:text-gray-100 dark:border-gray-600 font-mono text-sm",
          value: aiReview,
          rows: 8,
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