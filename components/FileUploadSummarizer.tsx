// components/FileUploadSummarizer.tsx
import React, { useState, useCallback } from 'react';
import { generateTextContent } from '../services/geminiService';
import { DEFAULT_AI_MODEL, SYSTEM_INSTRUCTION_SUMMARIZER } from '../constants';
import LoadingSpinner from './LoadingSpinner';
import { AIActionProps, DebugLogLevel } from '../types';
import { globalEmitter } from '../utils/eventEmitter'; // Import the global emitter

export const FileUploadSummarizer: React.FC<AIActionProps> = ({ onActionComplete, onLogDebug }) => {
  const [file, setFile] = useState<File | null>(null);
  const [summaryText, setSummaryText] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isApiKeyMissing, setIsApiKeyMissing] = useState(false);
  const [statusMessage, setStatusMessage] = useState('');

  const summarizeContent = useCallback(async (content: string, filename: string) => {
    setIsLoading(true);
    setError(null);
    setSummaryText('');
    setStatusMessage(`Summarizing content from ${filename}...`);
    try {
      if (!process.env.API_KEY) {
        setIsApiKeyMissing(true);
        setError("API Key is not configured. Please ensure your API key is set in the environment.");
        onLogDebug?.({
          id: `file-upload-summarizer-api-key-missing-${Date.now()}`,
          timestamp: new Date(),
          level: DebugLogLevel.API_KEY_MISSING,
          message: "File Upload Summarizer failed: API Key is not configured.",
        });
        return;
      }
      setIsApiKeyMissing(false);

      const prompt = `Summarize the following document content (from file: ${filename}) into 3-5 key ideas.
      Document Content: "${content}"`;

      const { text } = await generateTextContent({
        model: DEFAULT_AI_MODEL,
        prompt: prompt,
        systemInstruction: SYSTEM_INSTRUCTION_SUMMARIZER,
        onLogDebug: onLogDebug || ((entry) => globalEmitter.emit('debugLog', entry)), // Use prop callback or global emitter
      });
      setSummaryText(text.trim());
      setStatusMessage(`Summary generated for ${filename}.`);
      onActionComplete?.(text.trim());
    } catch (err: any) {
      console.error('Error summarizing file:', err);
      if (err.message.includes("API Key is not configured")) { // Check for the custom error message
        setIsApiKeyMissing(true);
        setError("API Key is not configured. Please ensure your API key is set in the environment.");
        onLogDebug?.({
          id: `file-upload-summarizer-api-key-invalid-${Date.now()}`,
          timestamp: new Date(),
          level: DebugLogLevel.API_KEY_MISSING,
          message: `File Upload Summarizer failed: API Key invalid.`,
          details: { error: err.message },
        });
      } else {
        setError(`Failed to summarize file: ${err.message}`);
        onLogDebug?.({
          id: `file-upload-summarizer-error-${Date.now()}`,
          timestamp: new Date(),
          level: DebugLogLevel.ERROR,
          message: `File Upload Summarizer failed: ${err.message}`,
          details: { error: err.message, filename },
        });
      }
      setStatusMessage(`Failed to summarize ${filename}.`);
    } finally {
      setIsLoading(false);
    }
  }, [onActionComplete, onLogDebug]);

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = event.target.files?.[0] || null;
    setFile(selectedFile);
    setSummaryText('');
    setError(null);
    setStatusMessage('');
  };

  const handleSummarizeClick = () => {
    if (!file) {
      setError("Please select a file to summarize.");
      return;
    }

    if (file.type === 'text/plain') {
      const reader = new FileReader(); // Correct instantiation
      reader.onload = async (e) => {
        const textContent = e.target?.result as string;
        if (textContent) {
          await summarizeContent(textContent, file.name);
        } else {
          setError("Could not read text from file.");
          setStatusMessage("File is empty or unreadable.");
        }
      };
      reader.onerror = () => {
        setError("Error reading file.");
        setStatusMessage("Error reading file.");
      };
      reader.readAsText(file);
    } else if (file.type === 'application/pdf' || file.type === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document') {
      // For PDF/DOCX, acknowledge but explain limitations in a frontend-only context
      setStatusMessage(`Parsing for ${file.type} files (like ${file.name}) is complex and often requires a backend service or specialized libraries. This prototype will acknowledge the upload, but cannot fully process its content for summarization. For .txt files, full processing is available.`);
      setSummaryText(`Acknowledged file: ${file.name} (${file.type}). Full content parsing for this format is not supported in this frontend-only prototype. Please try a .txt file for full summarization.`);
      setError(null);
      onLogDebug?.({
        id: `file-upload-${Date.now()}`,
        timestamp: new Date(),
        level: DebugLogLevel.WARNING,
        message: `Attempted to upload unsupported file type for full parsing: ${file.name} (${file.type})`,
        details: { fileName: file.name, mimeType: file.type },
      });
    } else {
      setError("Unsupported file format. Please upload a .txt, .pdf, or .docx file.");
      setStatusMessage("Unsupported file type.");
    }
  };

  const handleCopyToClipboard = () => {
    if (summaryText) {
      navigator.clipboard.writeText(summaryText);
    }
  };

  return React.createElement(
    "div",
    { className: "p-4 space-y-4 dark:bg-gray-900 dark:text-gray-200" },
    React.createElement(
      "h2",
      { className: "text-xl font-bold text-gray-800 dark:text-gray-200" },
      "Summarize PDF / Docs (via upload)"
    ),
    React.createElement(
      "p",
      { className: "text-sm text-gray-600 dark:text-gray-400 mb-4" },
      "Upload files (.txt, .pdf, .docx) to generate summaries, key insights, and topic classification."
    ),
    React.createElement(
      "div",
      {
        className: `border-2 border-dashed rounded-lg p-6 flex flex-col items-center justify-center text-gray-500 bg-gray-50 dark:bg-gray-800 dark:border-gray-600
          ${file ? 'border-blue-400 dark:border-blue-500' : 'border-gray-300'}`
      },
      React.createElement("input", {
        type: "file",
        id: "file-upload",
        className: "hidden",
        onChange: handleFileChange,
        accept: ".txt,.pdf,.docx",
        disabled: isLoading,
      } as React.InputHTMLAttributes<HTMLInputElement>),
      React.createElement("svg", { className: "w-12 h-12 mb-3 text-gray-400 dark:text-gray-500", fill: "none", stroke: "currentColor", viewBox: "0 0 24 24", xmlns: "http://www.w3.org/2000/svg" }, React.createElement("path", { strokeLinecap: "round", strokeLinejoin: "round", strokeWidth: "2", d: "M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" })),
      file ? (
        React.createElement(
          "p",
          { className: "text-lg font-medium text-blue-700 dark:text-blue-300" },
          "File selected: ",
          file.name
        )
      ) : (
        React.createElement(
          React.Fragment,
          null,
          React.createElement(
            "p",
            { className: "text-lg font-medium text-gray-700 dark:text-gray-300" },
            "Drag and drop your files here,"
          ),
          React.createElement(
            "p",
            { className: "text-lg font-medium text-gray-700 dark:text-gray-300" },
            "or ",
            React.createElement(
              "label",
              { htmlFor: "file-upload", className: "text-blue-600 cursor-pointer hover:underline dark:text-blue-400" },
              "click to browse"
            )
          )
        )
      ),
      React.createElement(
        "p",
        { className: "text-xs mt-2 text-gray-600 dark:text-gray-400" },
        "Supported formats: .txt (full processing), .pdf, .docx (limited parsing)"
      ),
      statusMessage && React.createElement(
        "p",
        { className: "text-sm mt-3 text-blue-600 dark:text-blue-400" },
        statusMessage
      )
    ),
    React.createElement(
      "button",
      {
        onClick: handleSummarizeClick,
        disabled: isLoading || !file,
        className: `w-full py-2 px-4 rounded-md text-white font-semibold transition-colors
          ${isLoading || !file
            ? 'bg-blue-300 cursor-not-allowed'
            : 'bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50'
          }`,
      },
      isLoading ? (
        React.createElement(
          "span",
          { className: "flex items-center justify-center" },
          React.createElement(LoadingSpinner, null),
          " Summarizing File..."
        )
      ) : (
        "Summarize File"
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
    summaryText &&
    React.createElement(
      "div",
      { className: "space-y-2" },
      React.createElement(
        "label",
        { className: "block text-sm font-medium text-gray-700 dark:text-gray-300" },
        "Summary:"
      ),
      React.createElement(
        "div",
        { className: "relative" },
        React.createElement("textarea", {
          readOnly: true,
          className: "w-full p-3 border border-gray-300 bg-gray-50 rounded-md resize-y min-h-[120px] shadow-sm text-gray-800 dark:bg-gray-800 dark:text-gray-100 dark:border-gray-600",
          value: summaryText,
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