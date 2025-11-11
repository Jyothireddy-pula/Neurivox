// components/ValidationEngine.tsx
import React, { useState, useCallback, useEffect } from 'react';
import { generateTextContent } from '../services/geminiService';
import { DEFAULT_AI_MODEL, SYSTEM_INSTRUCTION_VALIDATION_ENGINE } from '../constants';
import LoadingSpinner from './LoadingSpinner';
import { AIActionProps, DebugLogLevel } from '../types';
import { globalEmitter } from '../utils/eventEmitter'; // Import the global emitter

export const ValidationEngine: React.FC<AIActionProps> = ({ onActionComplete, onLogDebug }) => {
  const [testPrompt, setTestPrompt] = useState('');
  const [expectedCriteria, setExpectedCriteria] = useState('');
  const [aiResponse, setAiResponse] = useState('');
  const [validationResult, setValidationResult] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isApiKeyMissing, setIsApiKeyMissing] = useState(false);

  const runValidation = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    setAiResponse('');
    setValidationResult('');
    try {
      if (!process.env.API_KEY) {
        setIsApiKeyMissing(true);
        setError("API Key is not configured. Please ensure your API key is set in the environment.");
        onLogDebug?.({
          id: `validation-engine-api-key-missing-${Date.now()}`,
          timestamp: new Date(),
          level: DebugLogLevel.API_KEY_MISSING,
          message: "Validation Engine failed: API Key is not configured.",
        });
        return;
      }
      setIsApiKeyMissing(false);

      // Step 1: Get the AI's initial response to the test prompt
      const { text: generatedResponse } = await generateTextContent({
        model: DEFAULT_AI_MODEL,
        prompt: testPrompt,
        systemInstruction: "You are a helpful AI assistant. Respond to the following prompt:",
        onLogDebug: onLogDebug || ((entry) => globalEmitter.emit('debugLog', entry)),
      });
      setAiResponse(generatedResponse.trim());

      // Step 2: Use the AI to validate its own response against the criteria
      const validationPrompt = `Evaluate the following AI response against the given criteria.
      AI Response: "${generatedResponse}"
      Validation Criteria: "${expectedCriteria}"

      Provide a clear assessment, a score out of 5 for how well the response meets the criteria, and explain any inconsistencies or hallucinations.`;

      const { text: validationOutput } = await generateTextContent({
        model: DEFAULT_AI_MODEL, // Could use a more robust model for validation if available
        prompt: validationPrompt,
        systemInstruction: SYSTEM_INSTRUCTION_VALIDATION_ENGINE,
        onLogDebug: onLogDebug || ((entry) => globalEmitter.emit('debugLog', entry)),
      });
      setValidationResult(validationOutput.trim());
      onActionComplete?.(`Validation complete for: ${testPrompt}`);

    } catch (err: any) {
      console.error('Error during validation:', err);
      if (err.message.includes("API Key is not configured")) { // Check for the custom error message
        setIsApiKeyMissing(true);
        setError("API Key is not configured. Please ensure your API key is set in the environment.");
        onLogDebug?.({
          id: `validation-engine-api-key-invalid-${Date.now()}`,
          timestamp: new Date(),
          level: DebugLogLevel.API_KEY_MISSING,
          message: `Validation Engine failed: API Key invalid.`,
          details: { error: err.message },
        });
      } else {
        setError(`Failed to run validation: ${err.message}`);
        onLogDebug?.({
          id: `validation-engine-error-${Date.now()}`,
          timestamp: new Date(),
          level: DebugLogLevel.ERROR,
          message: `Validation Engine failed: ${err.message}`,
          details: { error: err.message, prompt: testPrompt },
        });
      }
    } finally {
      setIsLoading(false);
    }
  }, [testPrompt, expectedCriteria, onActionComplete, onLogDebug]);

  const handleRunValidation = () => {
    if (!testPrompt.trim() || !expectedCriteria.trim()) {
      setError("Please provide both a test prompt and validation criteria.");
      return;
    }
    runValidation();
  };

  return React.createElement(
    "div",
    { className: "p-4 space-y-4 dark:bg-gray-900 dark:text-gray-200" },
    React.createElement(
      "h2",
      { className: "text-xl font-bold text-gray-800 dark:text-gray-200" },
      "Validation & Testing Engine"
    ),
    React.createElement(
      "p",
      { className: "text-sm text-gray-600 dark:text-gray-400 mb-4" },
      "Automatically test AI responses for correctness, tone, or factual consistency."
    ),

    React.createElement(
      "div",
      { className: "space-y-4 bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md border border-green-200 dark:border-green-700" },
      React.createElement(
        "h3",
        { className: "text-lg font-semibold text-green-700 dark:text-green-300" },
        "Define Validation Scenario"
      ),
      React.createElement(
        "div",
        null,
        React.createElement(
          "label",
          { htmlFor: "test-prompt", className: "block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1" },
          "Test Prompt:"
        ),
        React.createElement("textarea", {
          id: "test-prompt",
          className: "w-full p-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500 resize-y min-h-[80px] bg-white dark:bg-gray-700 dark:text-gray-100 dark:border-gray-600",
          value: testPrompt,
          onChange: (e) => setTestPrompt(e.target.value),
          placeholder: "Enter the prompt you want to test (e.g., 'Explain quantum physics simply')...",
          rows: 4,
          disabled: isLoading,
        } as React.TextareaHTMLAttributes<HTMLTextAreaElement>)
      ),
      React.createElement(
        "div",
        null,
        React.createElement(
          "label",
          { htmlFor: "expected-criteria", className: "block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1" },
          "Validation Criteria:"
        ),
        React.createElement("textarea", {
          id: "expected-criteria",
          className: "w-full p-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500 resize-y min-h-[80px] bg-white dark:bg-gray-700 dark:text-gray-100 dark:border-gray-600",
          value: expectedCriteria,
          onChange: (e) => setExpectedCriteria(e.target.value),
          placeholder: "What are the criteria for a good response? (e.g., 'Must be simple, accurate, and concise, score out of 5 for each')...",
          rows: 4,
          disabled: isLoading,
        } as React.TextareaHTMLAttributes<HTMLTextAreaElement>)
      ),
      React.createElement(
        "button",
        {
          onClick: handleRunValidation,
          disabled: isLoading || !testPrompt.trim() || !expectedCriteria.trim(),
          className: `w-full py-2 px-4 rounded-md text-white font-semibold transition-colors
            ${isLoading || !testPrompt.trim() || !expectedCriteria.trim()
              ? 'bg-green-300 cursor-not-allowed'
              : 'bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-opacity-50'
            }`,
        },
        isLoading ? (
          React.createElement(
            "span",
            { className: "flex items-center justify-center" },
            React.createElement(LoadingSpinner, null),
            " Running Validation..."
          )
        ) : (
          "Run Validation"
        )
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

    aiResponse && React.createElement(
      "div",
      { className: "space-y-2" },
      React.createElement(
        "label",
        { className: "block text-sm font-medium text-gray-700 dark:text-gray-300" },
        "AI Response to Test Prompt:"
      ),
      React.createElement("textarea", {
        readOnly: true,
        className: "w-full p-3 border border-gray-300 bg-gray-50 rounded-md resize-y min-h-[120px] shadow-sm text-gray-800 dark:bg-gray-800 dark:text-gray-100 dark:border-gray-600",
        value: aiResponse,
        rows: 6,
      } as React.TextareaHTMLAttributes<HTMLTextAreaElement>)
    ),

    validationResult && React.createElement(
      "div",
      { className: "space-y-2" },
      React.createElement(
        "label",
        { className: "block text-sm font-medium text-gray-700 dark:text-gray-300" },
        "Validation Result (AI's Assessment):"
      ),
      React.createElement("textarea", {
        readOnly: true,
        className: "w-full p-3 border border-gray-300 bg-gray-50 rounded-md resize-y min-h-[150px] shadow-sm text-gray-800 dark:bg-gray-800 dark:text-gray-100 dark:border-gray-600",
        value: validationResult,
        rows: 8,
      } as React.TextareaHTMLAttributes<HTMLTextAreaElement>)
    )
  );
};