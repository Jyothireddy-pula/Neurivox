// components/AutomationActions.tsx
import React, { useState, useCallback, useMemo } from 'react';
import { AIActionProps, AutomationStep, DebugLogLevel } from '../types';
import { WORKSPACES, DEFAULT_AI_MODEL } from '../constants';
import LoadingSpinner from './LoadingSpinner';
import { generateTextContent, generateImages } from '../services/geminiService'; // Import generateImages
import { globalEmitter } from '../utils/eventEmitter';

export const AutomationActions: React.FC<AIActionProps> = ({ onActionComplete, onLogDebug }) => {
  const [automationName, setAutomationName] = useState('');
  const [steps, setSteps] = useState<AutomationStep[]>([]);
  const [initialAutomationInput, setInitialAutomationInput] = useState('');
  const [automationOutput, setAutomationOutput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isApiKeyMissing, setIsApiKeyMissing] = useState(false);

  // Flatten all available actions for selection, using useMemo to avoid top-level access
  const allAvailableActions = useMemo(() => {
    return WORKSPACES.flatMap(ws => ws.availableActions);
  }, []); // WORKSPACES is a constant, so an empty dependency array is appropriate

  const addStep = () => {
    if (steps.length < 3) { // Limit to 3 steps for simplicity in this prototype
      setSteps([...steps, { actionId: '', options: {} }]);
    }
  };

  const removeStep = (index: number) => {
    setSteps(steps.filter((_, i) => i !== index));
  };

  const updateStep = (index: number, key: keyof AutomationStep, value: any) => {
    const newSteps = [...steps];
    newSteps[index] = { ...newSteps[index], [key]: value };
    setSteps(newSteps);
  };

  const runAutomation = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    setAutomationOutput('');
    const automationDebugId = `automation-${Date.now()}`;
    const log = onLogDebug || ((entry) => globalEmitter.emit('debugLog', entry));

    log({
      id: automationDebugId,
      timestamp: new Date(),
      level: DebugLogLevel.INFO,
      message: `Starting automation: ${automationName || 'Untitled Automation'}`,
      details: { initialInput: initialAutomationInput, steps },
    });

    try {
      if (!process.env.API_KEY) {
        setIsApiKeyMissing(true);
        setError("API Key is not configured. Please ensure your API key is set in the environment.");
        log({
          id: automationDebugId,
          timestamp: new Date(),
          level: DebugLogLevel.ERROR,
          message: "Automation failed: API Key missing.",
        });
        return;
      }
      setIsApiKeyMissing(false);

      let currentInput = initialAutomationInput;
      // Track if the current input is an image base64 string
      let isInputImage = false;

      for (let i = 0; i < steps.length; i++) {
        const step = steps[i];
        const action = allAvailableActions.find(a => a.id === step.actionId);

        if (!action) {
          throw new Error(`Invalid action ID: ${step.actionId} at step ${i + 1}`);
        }

        log({
          id: automationDebugId,
          timestamp: new Date(),
          level: DebugLogLevel.INFO,
          message: `Executing step ${i + 1}: ${action.name}`,
          details: { actionId: action.id, input: currentInput, options: step.options },
        });

        let stepOutput = '';

        if (action.id === 'vision-integration') {
          // Vision integration step: expects currentInput to be an image URL or base64 string
          if (!currentInput.startsWith('data:image/')) {
            throw new Error(`Vision Integration requires an image input (base64 data URL). Current input is not an image.`);
          }
          const mimeType = currentInput.split(';')[0].split(':')[1];
          const base64Data = currentInput.split(',')[1];
          const imagePart = { inlineData: { mimeType, data: base64Data } };

          const response = await generateImages({
            model: 'gemini-2.5-flash-image',
            prompt: 'Describe this image in detail.',
            imagePart: imagePart,
          });

          // Assuming generateImages with imagePart returns a GenerateContentResponse with text
          if (typeof response !== 'string' && 'text' in response) {
            stepOutput = response.text.trim();
          } else {
            throw new Error("Vision integration did not return expected text output.");
          }
          isInputImage = false; // Output of vision is text
        } else if (action.id === 'social-commenter') {
          // Social commenter step (text-in, text-out)
          const emojiMode = step.options?.emojiMode || false;
          const prompt = emojiMode
            ? `Given the following social media post, generate a short, polite, context-relevant, and concise comment using ONLY emojis (1-3 emojis max).
            Post: "${currentInput}"`
            : `Given the following social media post, generate a short, polite, coherent, and concise comment (max 20 words).
            Post: "${currentInput}"`;
          const { text } = await generateTextContent({
            model: DEFAULT_AI_MODEL,
            prompt,
            systemInstruction: action.description, // Use action description as system instruction
            onLogDebug: log,
          });
          stepOutput = text.trim();
          isInputImage = false;
        } else {
          // Generic execution for most text-based actions (text-in, text-out)
          if (isInputImage) {
            throw new Error(`Text-based action '${action.name}' cannot process image input from previous step.`);
          }
          const { text } = await generateTextContent({
            model: DEFAULT_AI_MODEL,
            prompt: currentInput,
            systemInstruction: action.description, // Using action description as system instruction
            onLogDebug: log,
          });
          stepOutput = text.trim();
          isInputImage = false;
        }


        log({
          id: automationDebugId,
          timestamp: new Date(),
          level: DebugLogLevel.INFO,
          message: `Step ${i + 1} completed.`,
          details: { output: stepOutput.substring(0, 100) + (stepOutput.length > 100 ? '...' : '') },
        });

        currentInput = stepOutput; // Output of current step becomes input for next
        // Special handling if currentInput becomes an image (e.g., if a future step generates an image)
        // For now, assume most outputs are text. If a step generated an image, it would need to return base64.
        if (currentInput.startsWith('data:image/')) {
          isInputImage = true;
        }
      }

      setAutomationOutput(currentInput);
      onActionComplete?.(`Automation "${automationName}" completed.`);
      log({
        id: automationDebugId,
        timestamp: new Date(),
        level: DebugLogLevel.INFO,
        message: `Automation "${automationName || 'Untitled Automation'}" finished successfully.`,
        details: { finalOutput: currentInput },
      });

    } catch (err: any) {
      console.error('Error running automation:', err);
      if (err.message.includes("API Key is not configured")) { // Check for the custom error message
        setIsApiKeyMissing(true);
        setError("API Key is not configured. Please ensure your API key is set in the environment.");
      } else {
        setError(`Failed to run automation: ${err.message}`);
      }
      log({
        id: automationDebugId,
        timestamp: new Date(),
        level: DebugLogLevel.ERROR,
        message: `Automation "${automationName || 'Untitled Automation'}" failed.`,
        details: { error: err.message || String(err) },
      });
    } finally {
      setIsLoading(false);
    }
  }, [automationName, steps, initialAutomationInput, onActionComplete, onLogDebug, allAvailableActions]); // Added allAvailableActions to dependencies for useCallback

  const handleRunAutomation = () => {
    if (steps.length === 0) {
      setError("Please add at least one step to the automation.");
      return;
    }
    if (!initialAutomationInput.trim()) {
      setError("Please provide initial input for the automation.");
      return;
    }
    runAutomation();
  };

  return React.createElement(
    "div",
    { className: "p-4 space-y-4 dark:bg-gray-900 dark:text-gray-200" },
    React.createElement(
      "h2",
      { className: "text-xl font-bold text-gray-800 dark:text-gray-200" },
      "Automation Actions (Mini Agents)"
    ),
    React.createElement(
      "p",
      { className: "text-sm text-gray-600 dark:text-gray-400 mb-4" },
      "Chain AI actions to perform multi-step tasks. Output of one step becomes the input of the next."
    ),

    // Automation Builder
    React.createElement(
      "div",
      { className: "space-y-4 bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md border border-red-200 dark:border-red-700" },
      React.createElement(
        "h3",
        { className: "text-lg font-semibold text-red-700 dark:text-red-300" },
        "Build Automation Workflow"
      ),
      React.createElement(
        "div",
        null,
        React.createElement(
          "label",
          { htmlFor: "automation-name", className: "block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1" },
          "Automation Name (Optional):"
        ),
        React.createElement("input", {
          type: "text",
          id: "automation-name",
          className: "w-full p-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500 bg-white dark:bg-gray-700 dark:text-gray-100 dark:border-gray-600",
          value: automationName,
          onChange: (e) => setAutomationName(e.target.value),
          placeholder: "e.g., Summarize & Translate Article",
          disabled: isLoading,
        } as React.InputHTMLAttributes<HTMLInputElement>)
      ),
      React.createElement(
        "div",
        null,
        React.createElement(
          "label",
          { htmlFor: "initial-input", className: "block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1" },
          "Initial Input for Automation (Text or Base64 Image Data URL):"
        ),
        React.createElement("textarea", {
          id: "initial-input",
          className: "w-full p-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500 resize-y min-h-[80px] bg-white dark:bg-gray-700 dark:text-gray-100 dark:border-gray-600",
          value: initialAutomationInput,
          onChange: (e) => setInitialAutomationInput(e.target.value),
          placeholder: "Provide the starting text or base64 image data URL for your automation...",
          rows: 4,
          disabled: isLoading,
        } as React.TextareaHTMLAttributes<HTMLTextAreaElement>)
      ),

      React.createElement(
        "div",
        null,
        React.createElement(
          "label",
          { className: "block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2" },
          "Automation Steps:"
        ),
        steps.map((step, index) =>
          React.createElement(
            "div",
            { key: index, className: "flex items-center space-x-2 mb-2 p-2 bg-gray-50 dark:bg-gray-700 rounded-md border border-gray-200 dark:border-gray-600" },
            React.createElement(
              "span",
              { className: "font-semibold text-gray-800 dark:text-gray-200" },
              `Step ${index + 1}:`
            ),
            React.createElement(
              "select",
              {
                className: "flex-1 p-2 border border-gray-300 rounded-md bg-white dark:bg-gray-800 dark:text-gray-100 dark:border-gray-600",
                value: step.actionId,
                onChange: (e) => updateStep(index, 'actionId', e.target.value),
                disabled: isLoading,
              } as React.SelectHTMLAttributes<HTMLSelectElement>,
              React.createElement("option", { value: "" }, "-- Select AI Action --"),
              allAvailableActions.filter(action => !['text-analyzer', 'summarize-files', 'debugging-tools', 'prompt-factory', 'validation-engine', 'automation-actions', 'voice-control', 'llm-switch-optimizer'].includes(action.id)).map(action => // Filter out chat-like, file-upload, and advanced tools
                React.createElement(
                  "option",
                  { key: action.id, value: action.id },
                  action.name
                )
              )
            ),
            step.actionId === 'social-commenter' && React.createElement(
              "label",
              { className: "inline-flex items-center" },
              React.createElement("input", {
                type: "checkbox",
                checked: step.options?.emojiMode || false,
                onChange: (e) => updateStep(index, 'options', { ...step.options, emojiMode: e.target.checked }),
                className: "h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded dark:bg-gray-600 dark:border-gray-500 dark:checked:bg-blue-600",
                disabled: isLoading,
              } as React.InputHTMLAttributes<HTMLInputElement>),
              React.createElement("span", { className: "ml-1 text-sm text-gray-700 dark:text-gray-300" }, "Emoji Mode")
            ),
            React.createElement(
              "button",
              {
                onClick: () => removeStep(index),
                className: "p-2 text-red-600 hover:bg-red-100 dark:text-red-400 dark:hover:bg-red-900 rounded-full",
                title: "Remove step",
                "aria-label": `Remove step ${index + 1}`,
                disabled: isLoading,
              },
              React.createElement("svg", { className: "w-5 h-5", fill: "none", stroke: "currentColor", viewBox: "0 0 24 24", xmlns: "http://www.w3.org/2000/svg" }, React.createElement("path", { strokeLinecap: "round", strokeLinejoin: "round", strokeWidth: "2", d: "M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" }))
            )
          )
        ),
        React.createElement(
          "button",
          {
            onClick: addStep,
            disabled: isLoading || steps.length >= 3,
            className: `mt-2 w-full py-2 px-4 rounded-md text-blue-600 border border-blue-600 hover:bg-blue-50 dark:text-blue-400 dark:border-blue-400 dark:hover:bg-blue-900 transition-colors
              ${isLoading || steps.length >= 3
                ? 'opacity-50 cursor-not-allowed'
                : ''
              }`,
          },
          "Add Step"
        )
      ),
      React.createElement(
        "button",
        {
          onClick: handleRunAutomation,
          disabled: isLoading || !initialAutomationInput.trim() || steps.length === 0,
          className: `w-full py-2 px-4 rounded-md text-white font-semibold transition-colors
            ${isLoading || !initialAutomationInput.trim() || steps.length === 0
              ? 'bg-red-300 cursor-not-allowed'
              : 'bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-opacity-50'
            }`,
        },
        isLoading ? (
          React.createElement(
            "span",
            { className: "flex items-center justify-center" },
            React.createElement(LoadingSpinner, null),
            " Running Automation..."
          )
        ) : (
          "Run Automation"
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

    automationOutput &&
    React.createElement(
      "div",
      { className: "space-y-2" },
      React.createElement(
        "label",
        { className: "block text-sm font-medium text-gray-700 dark:text-gray-300" },
        "Automation Result:"
      ),
      React.createElement(
        "div",
        { className: "relative" },
        React.createElement("textarea", {
          readOnly: true,
          className: "w-full p-3 border border-gray-300 bg-gray-50 rounded-md resize-y min-h-[120px] shadow-sm text-gray-800 dark:bg-gray-800 dark:text-gray-100 dark:border-gray-600",
          value: automationOutput,
          rows: 6,
        } as React.TextareaHTMLAttributes<HTMLTextAreaElement>),
        React.createElement(
          "button",
          {
            onClick: () => navigator.clipboard.writeText(automationOutput),
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