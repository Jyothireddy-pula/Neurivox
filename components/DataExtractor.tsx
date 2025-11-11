// components/DataExtractor.tsx
import React, { useState, useCallback, useEffect } from 'react';
import { generateTextContent } from '../services/geminiService';
import { DEFAULT_AI_MODEL, SYSTEM_INSTRUCTION_DATA_EXTRACTOR, DEFAULT_DATA_SCHEMA } from '../constants';
import LoadingSpinner from './LoadingSpinner';
import { AIActionProps, ApiResponseFormat, DebugLogLevel } from '../types';
import { globalEmitter } from '../utils/eventEmitter'; // Import the global emitter


export const DataExtractor: React.FC<AIActionProps> = ({ initialInput, onActionComplete, onLogDebug, onSpeakText }) => {
  const [inputText, setInputText] = useState(initialInput || '');
  const [extractedData, setExtractedData] = useState('');
  const [outputFormat, setOutputFormat] = useState<'json' | 'csv'>('json');
  const [jsonSchema, setJsonSchema] = useState(JSON.stringify(DEFAULT_DATA_SCHEMA, null, 2));
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isApiKeyMissing, setIsApiKeyMissing] = useState(false);
  const [showSchemaInput, setShowSchemaInput] = useState(false);

  const extractData = useCallback(async (textToProcess: string, format: 'json' | 'csv', schemaString: string) => {
    setIsLoading(true);
    setError(null);
    setExtractedData('');
    try {
      if (!process.env.API_KEY) {
        setIsApiKeyMissing(true);
        setError("API Key is not configured. Please ensure your API key is set in the environment.");
        onLogDebug?.({
          id: `data-extractor-api-key-missing-${Date.now()}`,
          timestamp: new Date(),
          level: DebugLogLevel.API_KEY_MISSING,
          message: "Data Extractor failed: API Key is not configured.",
        });
        return;
      }
      setIsApiKeyMissing(false);

      let prompt = `Extract structured data from the following content and output it strictly in ${format.toUpperCase()} format.`;
      let effectiveSchema: ApiResponseFormat | undefined = undefined;

      if (format === 'json') {
        if (schemaString) {
          try {
            effectiveSchema = JSON.parse(schemaString) as ApiResponseFormat;
            prompt += ` Adhere to this JSON schema for the output: ${schemaString}`;
          } catch (e) {
            throw new Error("Invalid JSON schema provided. Please check its syntax.");
          }
        } else {
          effectiveSchema = DEFAULT_DATA_SCHEMA;
          prompt += ` Use a default JSON structure if no specific schema is provided.`;
        }
      }

      prompt += ` Content: "${textToProcess}"`;

      const { text } = await generateTextContent({
        model: DEFAULT_AI_MODEL,
        prompt: prompt,
        systemInstruction: SYSTEM_INSTRUCTION_DATA_EXTRACTOR,
        responseMimeType: format === 'json' ? 'application/json' : undefined, // GenAI only supports JSON mime type
        responseSchema: format === 'json' ? effectiveSchema : undefined,
        onLogDebug: onLogDebug || ((entry) => globalEmitter.emit('debugLog', entry)), // Use prop callback or global emitter
      });

      setExtractedData(text.trim());
      onActionComplete?.(text.trim());

    } catch (err: any) {
      console.error('Error extracting data:', err);
      if (err.message.includes("API Key is not configured")) { // Check for the custom error message
        setIsApiKeyMissing(true);
        setError("API Key is not configured. Please ensure your API key is set in the environment.");
        onLogDebug?.({
          id: `data-extractor-api-key-invalid-${Date.now()}`,
          timestamp: new Date(),
          level: DebugLogLevel.API_KEY_MISSING,
          message: `Data Extractor failed: API Key invalid.`,
          details: { error: err.message },
        });
      } else {
        setError(`Failed to extract data: ${err.message}`);
        onLogDebug?.({
          id: `data-extractor-error-${Date.now()}`,
          timestamp: new Date(),
          level: DebugLogLevel.ERROR,
          message: `Data Extractor failed: ${err.message}`,
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
      extractData(initialInput, outputFormat, jsonSchema);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initialInput]);

  const handleExtractClick = () => {
    if (!inputText.trim()) {
      setError("Please enter some content to extract data from.");
      return;
    }
    extractData(inputText, outputFormat, jsonSchema);
  };

  const handleCopyToClipboard = () => {
    if (extractedData) {
      navigator.clipboard.writeText(extractedData);
    }
  };

  const handleSpeakClick = () => {
    if (extractedData && onSpeakText) {
      onSpeakText(extractedData);
    }
  };

  return React.createElement(
    "div",
    { className: "p-4 space-y-4 dark:bg-gray-900 dark:text-gray-200" },
    React.createElement(
      "h2",
      { className: "text-xl font-bold text-gray-800 dark:text-gray-200" },
      "Data Extractor"
    ),
    React.createElement(
      "p",
      { className: "text-sm text-gray-600 dark:text-gray-400" },
      "Extract structured data from webpages (tables, prices, reviews) in JSON or CSV format."
    ),
    React.createElement(
      "div",
      null,
      React.createElement(
        "label",
        { htmlFor: "data-extractor-input", className: "block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1" },
        "Input Content (Text or Webpage Data):"
      ),
      React.createElement("textarea", {
        id: "data-extractor-input",
        className: "w-full p-3 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500 resize-y min-h-[120px] shadow-sm text-gray-800 bg-white dark:bg-gray-700 dark:text-gray-100 dark:border-gray-600",
        placeholder: "Paste text, table data, or relevant webpage content here...",
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
        { htmlFor: "output-format", className: "block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1" },
        "Output Format:"
      ),
      React.createElement(
        "select",
        {
          id: "output-format",
          className: "w-full p-3 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500 shadow-sm text-gray-800 bg-white dark:bg-gray-700 dark:text-gray-100 dark:border-gray-600",
          value: outputFormat,
          onChange: (e) => setOutputFormat(e.target.value as 'json' | 'csv'), // Fix: Use 'json' | 'csv' for type assertion
          disabled: isLoading,
        } as React.SelectHTMLAttributes<HTMLSelectElement>,
        React.createElement("option", { value: "json" }, "JSON"),
        React.createElement("option", { value: "csv" }, "CSV (General Text)")
      )
    ),
    outputFormat === 'json' && React.createElement(
      "div",
      null,
      React.createElement(
        "label",
        { htmlFor: "json-schema", className: "block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1" },
        "Optional JSON Schema (for structured output):"
      ),
      React.createElement("textarea", {
        id: "json-schema",
        className: "w-full p-3 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500 resize-y min-h-[100px] shadow-sm text-gray-800 bg-white dark:bg-gray-700 dark:text-gray-100 dark:border-gray-600 font-mono text-xs",
        value: jsonSchema,
        onChange: (e) => setJsonSchema(e.target.value),
        placeholder: JSON.stringify(DEFAULT_DATA_SCHEMA, null, 2),
        rows: 5,
        disabled: isLoading,
      } as React.TextareaHTMLAttributes<HTMLTextAreaElement>),
      React.createElement(
        "div",
        { className: "flex items-center mt-2" },
        React.createElement("input", {
          type: "checkbox",
          id: "show-schema-input",
          checked: showSchemaInput,
          onChange: () => setShowSchemaInput(!showSchemaInput),
          className: "h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded dark:bg-gray-700 dark:border-gray-600 dark:checked:bg-blue-600",
          disabled: isLoading,
        } as React.InputHTMLAttributes<HTMLInputElement>),
        React.createElement(
          "label",
          { htmlFor: "show-schema-input", className: "ml-2 text-sm text-gray-900 dark:text-gray-300" },
          "Customize JSON Schema"
        )
      )
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
          " Extracting Data..."
        )
      ) : (
        "Extract Data"
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
      { className: "space-y-2" },
      React.createElement(
        "label",
        { className: "block text-sm font-medium text-gray-700 dark:text-gray-300" },
        "Extracted Data:"
      ),
      React.createElement(
        "div",
        { className: "relative" },
        React.createElement("textarea", {
          readOnly: true,
          className: "w-full p-3 border border-gray-300 bg-gray-50 rounded-md resize-y min-h-[120px] shadow-sm text-gray-800 dark:bg-gray-800 dark:text-gray-100 dark:border-gray-600 font-mono text-sm",
          value: extractedData,
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