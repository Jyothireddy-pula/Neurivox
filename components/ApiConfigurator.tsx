// components/ApiConfigurator.tsx
import React, { useState, useEffect, useCallback } from 'react';
import { DebugLogEntry, DebugLogLevel, AIStudio } from '../types';
import { globalEmitter } from '../utils/eventEmitter';
import { validateApiKey } from '../services/geminiService';
import LoadingSpinner from './LoadingSpinner'; // Added missing import

type ApiProvider = 'gemini' | 'aistudio';

interface ApiConfiguratorProps {
  onLogDebug?: (entry: DebugLogEntry) => void;
}

export const ApiConfigurator: React.FC<ApiConfiguratorProps> = ({ onLogDebug }) => {
  const [selectedProvider, setSelectedProvider] = useState<ApiProvider>('gemini');
  const [inputApiKey, setInputApiKey] = useState('');
  const [savedGeminiKey, setSavedGeminiKey] = useState<string | null>(null); // For localStorage
  
  const [aiStudioAvailable, setAiStudioAvailable] = useState<boolean | null>(null); // null: checking, false: not available, true: available
  const [aiStudioKeySelected, setAiStudioKeySelected] = useState<boolean | null>(null); // null: checking, false: not selected, true: selected
  const [checkingAiStudioKey, setCheckingAiStudioKey] = useState(false);

  const [apiValidationSuccess, setApiValidationSuccess] = useState<boolean | null>(null);
  const [apiValidationError, setApiValidationError] = useState<string | null>(null);
  const [isApiKeyTesting, setIsApiKeyTesting] = useState(false);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);


  // Load Gemini key from localStorage on mount and provider change
  useEffect(() => {
    const storedKey = localStorage.getItem('apiKey_gemini');
    setSavedGeminiKey(storedKey);
  }, [selectedProvider]); // Reload if provider changes (relevant if we manage other keys later)

  // Callback to detect AI Studio environment and check its key status
  const checkAiStudioEnvironment = useCallback(async () => {
    setCheckingAiStudioKey(true);
    setAiStudioAvailable(null); // Reset before checking
    setAiStudioKeySelected(null); // Reset before checking

    const aistudio = window.aistudio as AIStudio | undefined;
    if (aistudio) {
      setAiStudioAvailable(true);
      onLogDebug?.({
        id: `aistudio-detect-${Date.now()}`,
        timestamp: new Date(),
        level: DebugLogLevel.INFO,
        message: "Google AI Studio environment detected.",
      });
      try {
        const selected = await aistudio.hasSelectedApiKey();
        setAiStudioKeySelected(selected);
        if (selected) {
          onLogDebug?.({
            id: `aistudio-key-status-${Date.now()}`,
            timestamp: new Date(),
            level: DebugLogLevel.INFO,
            message: "API Key already selected via Google AI Studio.",
          });
        } else {
          onLogDebug?.({
            id: `aistudio-key-status-${Date.now()}`,
            timestamp: new Date(),
            level: DebugLogLevel.WARNING,
            message: "No API Key selected via Google AI Studio yet.",
          });
        }
      } catch (error) {
        console.error("Error checking AI Studio API key:", error);
        onLogDebug?.({
          id: `aistudio-key-check-error-${Date.now()}`,
          timestamp: new Date(),
          level: DebugLogLevel.ERROR,
          message: `Error checking AI Studio API key: ${String(error)}`,
        });
        setAiStudioKeySelected(false);
      }
    } else {
      setAiStudioAvailable(false);
      onLogDebug?.({
        id: `aistudio-detect-${Date.now()}`,
        timestamp: new Date(),
        level: DebugLogLevel.INFO,
        message: "Google AI Studio environment NOT detected.",
      });
    }
    setCheckingAiStudioKey(false);
  }, [onLogDebug]);

  useEffect(() => {
    checkAiStudioEnvironment();
  }, [checkAiStudioEnvironment]);

  // Handle provider change
  const handleProviderChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setSelectedProvider(e.target.value as ApiProvider);
    setInputApiKey(''); // Clear input when switching providers
    setApiValidationSuccess(null);
    setApiValidationError(null);
    setStatusMessage(null);
  };

  // Helper to get the API key that would be used for validation/API calls
  const getActiveApiKeyForValidation = useCallback(() => {
    if (selectedProvider === 'gemini') {
        return savedGeminiKey || process.env.API_KEY;
    } else if (selectedProvider === 'aistudio') {
        return process.env.API_KEY; // AI Studio key is always from process.env.API_KEY if selected
    }
    return null;
  }, [selectedProvider, savedGeminiKey]);


  // Callback to validate API key
  const testApiKey = useCallback(async () => {
    setIsApiKeyTesting(true);
    setApiValidationError(null);
    setStatusMessage(null);
    setApiValidationSuccess(null);

    const keyToValidate = getActiveApiKeyForValidation();

    if (!keyToValidate) {
        setApiValidationSuccess(false);
        setApiValidationError("No API Key detected for the selected provider. Please configure it.");
        onLogDebug?.({
            id: `api-key-test-skip-${Date.now()}`,
            timestamp: new Date(),
            level: DebugLogLevel.INFO,
            message: `Skipping API key validation test: No API key found for ${selectedProvider}.`,
        });
        setIsApiKeyTesting(false);
        return;
    }

    onLogDebug?.({
      id: `api-key-test-start-${Date.now()}`,
      timestamp: new Date(),
      level: DebugLogLevel.UI_EVENT,
      message: `User initiated API key validation test for ${selectedProvider}.`,
    });
    try {
      const isValid = await validateApiKey(keyToValidate, onLogDebug);
      setApiValidationSuccess(isValid);
      setApiValidationError(null);
      setStatusMessage("API Key validation succeeded!");
      onLogDebug?.({
        id: `api-key-test-success-${Date.now()}`,
        timestamp: new Date(),
        level: DebugLogLevel.INFO,
        message: `API Key validation succeeded for ${selectedProvider}.`,
      });
    } catch (err: any) {
      setApiValidationSuccess(false);
      let errorMessage = err.message || String(err);

      // Specific handling for "Requested entity was not found." as per Veo guidelines
      if (selectedProvider === 'aistudio' && (errorMessage.includes("Requested entity was not found.") || errorMessage.includes("Invalid API key"))) {
        errorMessage += "<br/>It looks like the AI Studio API key might be invalid or not properly selected. Please try re-selecting your key via the 'Select API Key via AI Studio' button.";
        // Reset AI Studio state to prompt re-selection
        setAiStudioKeySelected(false);
        setStatusMessage("AI Studio key might be invalid. Please re-select.");
      } else {
        setStatusMessage("API Key validation failed.");
      }
      setApiValidationError(errorMessage);
      onLogDebug?.({
        id: `api-key-test-error-${Date.now()}`,
        timestamp: new Date(),
        level: DebugLogLevel.ERROR,
        message: `API Key test encountered an error for ${selectedProvider}: ${errorMessage}`,
        details: { error: errorMessage, stack: err.stack },
      });
    } finally {
      setIsApiKeyTesting(false);
    }
  }, [onLogDebug, selectedProvider, getActiveApiKeyForValidation]);

  // Auto-run API key test on initial load or if relevant state changes
  useEffect(() => {
    // Only auto-test if AI Studio is checked or not available, and a key is available, and not already tested
    const shouldAutoTestGemini =
        selectedProvider === 'gemini' &&
        !checkingAiStudioKey &&
        (savedGeminiKey || process.env.API_KEY) &&
        apiValidationSuccess === null &&
        !isApiKeyTesting;

    const shouldAutoTestAiStudio =
        selectedProvider === 'aistudio' &&
        !checkingAiStudioKey &&
        aiStudioAvailable === true &&
        aiStudioKeySelected === true &&
        process.env.API_KEY && // AI Studio key is always in process.env.API_KEY
        apiValidationSuccess === null &&
        !isApiKeyTesting;

    if (shouldAutoTestGemini || shouldAutoTestAiStudio) {
      const timer = setTimeout(() => {
        testApiKey();
      }, 500); // Debounce
      return () => clearTimeout(timer);
    }
  }, [
    selectedProvider,
    aiStudioAvailable,
    aiStudioKeySelected,
    savedGeminiKey,
    apiValidationSuccess,
    isApiKeyTesting,
    checkingAiStudioKey,
    testApiKey,
  ]);


  // localStorage key management functions
  const handleSaveKey = () => {
    if (!inputApiKey.trim()) {
      setStatusMessage("Please enter an API key to save.");
      return;
    }
    localStorage.setItem('apiKey_gemini', inputApiKey.trim());
    setSavedGeminiKey(inputApiKey.trim());
    setInputApiKey('');
    setStatusMessage("Gemini API key saved successfully!");
    setApiValidationSuccess(null); // Reset validation to encourage re-test
    setApiValidationError(null);
    onLogDebug?.({
        id: `gemini-key-save-${Date.now()}`,
        timestamp: new Date(),
        level: DebugLogLevel.UI_EVENT,
        message: "Gemini API key saved to local storage.",
    });
    testApiKey(); // Test the newly saved key
  };

  const handleEditKey = () => {
    if (savedGeminiKey) {
      setInputApiKey(savedGeminiKey);
      setStatusMessage("Gemini API key loaded for editing.");
    } else {
      setStatusMessage("No Gemini API key saved to edit.");
    }
  };

  const handleReplaceKey = () => {
    if (!inputApiKey.trim()) {
      setStatusMessage("Please enter a new API key to replace the existing one.");
      return;
    }
    localStorage.setItem('apiKey_gemini', inputApiKey.trim());
    setSavedGeminiKey(inputApiKey.trim());
    setInputApiKey('');
    setStatusMessage("Gemini API key replaced successfully!");
    setApiValidationSuccess(null);
    setApiValidationError(null);
    onLogDebug?.({
        id: `gemini-key-replace-${Date.now()}`,
        timestamp: new Date(),
        level: DebugLogLevel.UI_EVENT,
        message: "Gemini API key replaced in local storage.",
    });
    testApiKey(); // Test the newly replaced key
  };

  const handleResetKey = () => {
    localStorage.removeItem('apiKey_gemini');
    setSavedGeminiKey(null);
    setInputApiKey('');
    setStatusMessage("Gemini API key reset (removed from local storage).");
    setApiValidationSuccess(null);
    setApiValidationError(null);
    onLogDebug?.({
        id: `gemini-key-reset-${Date.now()}`,
        timestamp: new Date(),
        level: DebugLogLevel.UI_EVENT,
        message: "Gemini API key removed from local storage.",
    });
  };

  // AI Studio specific action
  const handleSelectAiStudioKey = async () => {
    const aistudio = window.aistudio as AIStudio | undefined;
    if (aistudio) {
      setCheckingAiStudioKey(true);
      setApiValidationSuccess(null); // Reset validation status
      setApiValidationError(null); // Clear previous errors
      setStatusMessage(null);
      onLogDebug?.({
        id: `aistudio-open-select-key-${Date.now()}`,
        timestamp: new Date(),
        level: DebugLogLevel.UI_EVENT,
        message: "User initiated AI Studio API key selection dialog.",
      });
      try {
        await aistudio.openSelectKey();
        setAiStudioKeySelected(true); // Assume success per guideline
        // After selection, re-check AI Studio environment (which will trigger auto-test if successful)
        checkAiStudioEnvironment();
        setStatusMessage("AI Studio key selection dialog opened. Please select your key.");
      } catch (error) {
        console.error("Error opening AI Studio key selection:", error);
        onLogDebug?.({
          id: `aistudio-open-select-key-error-${Date.now()}`,
          timestamp: new Date(),
          level: DebugLogLevel.ERROR,
          message: `Error opening AI Studio key selection: ${String(error)}`,
        });
        setAiStudioKeySelected(false);
        setApiValidationError("Failed to open key selection dialog or key selection was cancelled/failed.");
        setStatusMessage("Failed to select AI Studio key.");
      } finally {
        setCheckingAiStudioKey(false);
      }
    }
  };

  return React.createElement(
    "div",
    { className: "p-4 bg-gray-50 dark:bg-gray-800 rounded-lg shadow-inner mt-4" },
    React.createElement(
      "h3",
      { className: "text-lg font-semibold text-gray-800 dark:text-gray-200 mb-2" },
      "Gemini API Configuration"
    ),

    (checkingAiStudioKey || isApiKeyTesting) && React.createElement(
      "p",
      { className: "text-sm text-gray-600 dark:text-gray-400 mb-4 flex items-center space-x-2" },
      React.createElement(LoadingSpinner, null),
      checkingAiStudioKey ? "Detecting AI Studio environment..." : "Testing API key validity..."
    ),

    React.createElement(
      "div",
      { className: "mb-4" },
      React.createElement(
        "label",
        { htmlFor: "api-provider-select", className: "block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1" },
        "Select API Key Provider:"
      ),
      React.createElement(
        "select",
        {
          id: "api-provider-select",
          className: "w-full p-3 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500 shadow-sm text-gray-800 bg-white dark:bg-gray-700 dark:text-gray-100 dark:border-gray-600",
          value: selectedProvider,
          onChange: handleProviderChange,
          disabled: isApiKeyTesting || checkingAiStudioKey,
        } as React.SelectHTMLAttributes<HTMLSelectElement>,
        React.createElement("option", { value: "gemini" }, "Gemini (Manual / Local Storage)"),
        React.createElement("option", { value: "aistudio" }, "AI Studio (Environment Managed)")
      )
    ),

    // Gemini (Manual) Configuration Section
    selectedProvider === 'gemini' && React.createElement(
      "div",
      { className: "mb-6 p-4 bg-indigo-50 dark:bg-indigo-900 border border-indigo-200 dark:border-indigo-700 rounded-lg" },
      React.createElement(
        "h4",
        { className: "text-md font-semibold text-indigo-800 dark:text-indigo-200 mb-2" },
        "Gemini API Key (Local Storage)"
      ),
      React.createElement(
        "p",
        { className: "text-sm text-indigo-700 dark:text-indigo-300 mb-3" },
        "Manage your Gemini API key, stored securely in your browser's local storage."
      ),
      React.createElement(
        "div",
        null,
        React.createElement(
          "label",
          { htmlFor: "gemini-api-key-input", className: "block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1" },
          "API Key:"
        ),
        React.createElement("input", {
          id: "gemini-api-key-input",
          type: "password",
          className: "w-full p-3 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500 shadow-sm text-gray-800 bg-white dark:bg-gray-700 dark:text-gray-100 dark:border-gray-600",
          placeholder: "Enter your Gemini API key",
          value: inputApiKey,
          onChange: (e) => setInputApiKey(e.target.value),
          disabled: isApiKeyTesting,
        } as React.InputHTMLAttributes<HTMLInputElement>)
      ),
      React.createElement(
        "div",
        { className: "flex flex-wrap gap-2 mt-3" },
        !savedGeminiKey ? React.createElement(
          "button",
          {
            onClick: handleSaveKey,
            className: "bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded-md transition-colors",
            disabled: isApiKeyTesting || !inputApiKey.trim(),
            "aria-label": "Save Gemini API Key",
          },
          "Save Key"
        ) : (
          React.createElement(
            "button",
            {
              onClick: handleEditKey,
              className: "bg-gray-300 hover:bg-gray-400 text-gray-800 dark:bg-gray-600 dark:hover:bg-gray-500 dark:text-gray-200 font-bold py-2 px-4 rounded-md transition-colors",
              disabled: isApiKeyTesting,
              "aria-label": "Edit Gemini API Key",
            },
            "Edit Key"
          )
        ),
        savedGeminiKey && React.createElement(
          "button",
          {
            onClick: handleReplaceKey,
            className: "bg-yellow-500 hover:bg-yellow-600 text-white font-bold py-2 px-4 rounded-md transition-colors",
            disabled: isApiKeyTesting || !inputApiKey.trim(),
            "aria-label": "Replace Gemini API Key",
          },
          "Replace Key"
        ),
        savedGeminiKey && React.createElement(
          "button",
          {
            onClick: handleResetKey,
            className: "bg-red-500 hover:bg-red-600 text-white font-bold py-2 px-4 rounded-md transition-colors",
            disabled: isApiKeyTesting,
            "aria-label": "Reset Gemini API Key",
          },
          "Reset"
        )
      ),
      savedGeminiKey && React.createElement(
        "p",
        { className: "mt-4 text-sm text-indigo-700 dark:text-indigo-300" },
        "✅ An API key is saved locally for Gemini."
      ),
      !savedGeminiKey && React.createElement(
        "p",
        { className: "mt-4 text-sm text-orange-700 dark:text-orange-300" },
        "⚠️ No API key saved locally for Gemini. It will fall back to 'process.env.API_KEY' if available."
      ),
      React.createElement(
        "button",
        {
          onClick: testApiKey,
          className: "mt-3 bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded-md transition-colors",
          disabled: isApiKeyTesting || !(savedGeminiKey || process.env.API_KEY),
          "aria-label": "Test Gemini API Key",
        },
        isApiKeyTesting ? "Testing..." : "Test Gemini API Key"
      )
    ),

    // AI Studio Configuration Section
    selectedProvider === 'aistudio' && aiStudioAvailable === true && !checkingAiStudioKey && React.createElement(
      "div",
      { className: "mb-6 p-4 bg-blue-50 dark:bg-blue-900 border border-blue-200 dark:border-blue-700 rounded-lg" },
      React.createElement(
        "h4",
        { className: "text-md font-semibold text-blue-800 dark:text-blue-200 mb-2" },
        "Google AI Studio Environment"
      ),
      aiStudioKeySelected === true && React.createElement(
        "p",
        { className: "text-sm text-blue-700 dark:text-blue-300 mb-2" },
        "✅ An API key has been selected via AI Studio and loaded into the environment."
      ),
      aiStudioKeySelected === false && React.createElement(
        "p",
        { className: "text-sm text-orange-700 dark:text-orange-300 mb-2" },
        "⚠️ No API key selected yet via AI Studio. Please select one to enable full AI functionality."
      ),
      React.createElement(
        "button",
        {
          onClick: handleSelectAiStudioKey,
          className: "mt-3 bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded-md transition-colors",
          disabled: isApiKeyTesting || checkingAiStudioKey,
          "aria-label": "Select API Key via AI Studio",
        },
        isApiKeyTesting ? "Testing Key..." : (aiStudioKeySelected ? "Re-Select API Key" : "Select API Key via AI Studio")
      ),
      React.createElement(
        "p",
        { className: "text-xs text-blue-600 dark:text-blue-400 mt-2" },
        "The selected AI Studio API key is automatically provided to the application via ",
        React.createElement("code", { className: "font-mono" }, "process.env.API_KEY"),
        "."
      ),
      aiStudioKeySelected === true && React.createElement(
        "button",
        {
          onClick: testApiKey,
          className: "mt-3 bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded-md transition-colors",
          disabled: isApiKeyTesting || checkingAiStudioKey,
          "aria-label": "Test AI Studio API Key",
        },
        isApiKeyTesting ? "Testing..." : "Test AI Studio API Key"
      )
    ),

    selectedProvider === 'aistudio' && aiStudioAvailable === false && !checkingAiStudioKey && React.createElement(
      "div",
      { className: "p-3 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-200 rounded-md mb-4" },
      React.createElement("p", { className: "font-semibold" }, "AI Studio Environment Not Detected"),
      React.createElement("p", { className: "text-sm" }, "The Google AI Studio environment was not detected. Please switch to the 'Gemini (Manual)' provider to configure your API key locally or ensure you are running within the AI Studio frame."),
      React.createElement(
        "p",
        { className: "text-sm mt-2" },
        "You can manually set ", React.createElement("code", { className: "font-mono" }, "process.env.API_KEY"), " for development outside AI Studio."
      )
    ),

    // Common API Key Status (for either provider)
    apiValidationSuccess === true && React.createElement(
      "div",
      { className: "bg-green-100 dark:bg-green-900 text-green-700 dark:text-green-300 p-3 rounded-md mb-4" },
      React.createElement("p", { className: "font-semibold" }, "API Key Status:"),
      React.createElement("p", null, "✅ API Key is valid and functional!")
    ),

    apiValidationError && React.createElement(
        "div",
        { className: "bg-red-100 dark:bg-red-900 text-red-700 dark:text-red-200 p-3 rounded-md text-sm mb-4" },
        React.createElement("p", { className: "font-semibold" }, "API Key Error:"),
        React.createElement("p", { dangerouslySetInnerHTML: { __html: apiValidationError } }),
        (selectedProvider === 'gemini' || aiStudioKeySelected === true) && !isApiKeyTesting && React.createElement(
            "button",
            {
              onClick: testApiKey,
              className: "mt-3 bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded-md transition-colors",
              disabled: isApiKeyTesting,
              "aria-label": "Re-Test API Key",
            },
            isApiKeyTesting ? "Testing..." : "Re-Test API Key"
        )
    ),
    
    React.createElement(
      "p",
      { className: "text-xs text-gray-500 dark:text-gray-500 mt-2 text-center" },
      "Your API key is essential for Gemini API calls.",
      React.createElement(
        "a",
        { href: "https://ai.google.dev/gemini-api/docs/billing", target: "_blank", rel: "noopener noreferrer", className: "text-blue-500 hover:underline dark:text-blue-400 ml-1" },
        "Learn about billing."
      )
    )
  );
};