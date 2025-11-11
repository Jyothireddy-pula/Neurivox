// components/VisionIntegration.tsx
import React, { useState, useCallback, useEffect, ChangeEvent } from 'react';
import { generateImages } from '../services/geminiService';
import { IMAGE_AI_MODEL } from '../constants';
import LoadingSpinner from './LoadingSpinner';
import { AIActionProps, DebugLogLevel } from '../types';
import { globalEmitter } from '../utils/eventEmitter';

export const VisionIntegration: React.FC<AIActionProps> = ({ onActionComplete, onLogDebug, onSpeakText }) => {
  const [file, setFile] = useState<File | null>(null);
  const [imagePreviewUrl, setImagePreviewUrl] = useState<string | null>(null);
  const [aiDescription, setAiDescription] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isApiKeyMissing, setIsApiKeyMissing] = useState(false);

  const handleFileChange = (event: ChangeEvent<HTMLInputElement>) => {
    const selectedFile = event.target.files?.[0] || null;
    setFile(selectedFile);
    if (selectedFile) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreviewUrl(reader.result as string);
      };
      reader.readAsDataURL(selectedFile);
    } else {
      setImagePreviewUrl(null);
    }
    setAiDescription('');
    setError(null);
  };

  const describeImage = useCallback(async (base64Image: string) => {
    setIsLoading(true);
    setError(null);
    setAiDescription('');
    try {
      if (!process.env.API_KEY) {
        setIsApiKeyMissing(true);
        setError("API Key is not configured. Please ensure your API key is set in the environment.");
        onLogDebug?.({
          id: `vision-api-key-missing-${Date.now()}`,
          timestamp: new Date(),
          level: DebugLogLevel.API_KEY_MISSING,
          message: "Vision Integration failed: API Key is not configured.",
        });
        return;
      }
      setIsApiKeyMissing(false);

      // Extract base64 data without the mime type prefix (e.g., "data:image/png;base64,")
      const base64Data = base64Image.split(',')[1];

      // Fix: The generateImages function in geminiService correctly handles multi-modal input for 'gemini-2.5-flash-image'
      // and returns a GenerateContentResponse. Extract the text directly from this response.
      const response = await generateImages({
        model: IMAGE_AI_MODEL, // This model supports image understanding via generateContent
        prompt: 'Describe this image in detail.',
        imagePart: {
          inlineData: {
            mimeType: file?.type || 'image/jpeg',
            data: base64Data,
          },
        },
      });

      // Assert response type and extract text
      if (typeof response !== 'string' && 'text' in response) {
        setAiDescription(response.text.trim());
        onActionComplete?.(response.text.trim());
      } else {
        throw new Error("Unexpected response format from image analysis.");
      }

    } catch (err: any) {
      console.error('Error describing image:', err);
      if (err.message.includes("API Key is not configured")) { // Check for the custom error message
        setIsApiKeyMissing(true);
        setError("API Key is not configured. Please ensure your API key is set in the environment.");
        onLogDebug?.({
          id: `vision-api-key-invalid-${Date.now()}`,
          timestamp: new Date(),
          level: DebugLogLevel.API_KEY_MISSING,
          message: `Vision Integration failed: API Key invalid.`,
          details: { error: err.message },
        });
      } else {
        setError(`Failed to describe image: ${err.message}`);
        onLogDebug?.({
          id: `vision-error-${Date.now()}`,
          timestamp: new Date(),
          level: DebugLogLevel.ERROR,
          message: `Vision Integration failed: ${err.message}`,
          details: { error: err.message },
        });
      }
    } finally {
      setIsLoading(false);
    }
  }, [onActionComplete, onLogDebug, file]);

  const handleAnalyzeClick = () => {
    if (!file || !imagePreviewUrl) {
      setError("Please upload an image to analyze.");
      return;
    }
    // fileReader.result is already base64 string
    describeImage(imagePreviewUrl);
  };

  const handleCopyToClipboard = () => {
    if (aiDescription) {
      navigator.clipboard.writeText(aiDescription);
    }
  };

  const handleSpeakClick = () => {
    if (aiDescription && onSpeakText) {
      onSpeakText(aiDescription);
    }
  };

  return React.createElement(
    "div",
    { className: "p-4 space-y-4 dark:bg-gray-900 dark:text-gray-200" },
    React.createElement(
      "h2",
      { className: "text-xl font-bold text-gray-800 dark:text-gray-200" },
      "Vision Integration (Image Understanding)"
    ),
    React.createElement(
      "p",
      { className: "text-sm text-gray-600 dark:text-gray-400 mb-4" },
      "Upload an image or screenshot and ask AI to describe its content."
    ),
    React.createElement(
      "div",
      {
        className: `border-2 border-dashed rounded-lg p-6 flex flex-col items-center justify-center text-gray-500 bg-gray-50 dark:bg-gray-800 dark:border-gray-600
          ${file ? 'border-blue-400 dark:border-blue-500' : 'border-gray-300'}`
      },
      React.createElement("input", {
        type: "file",
        id: "image-upload",
        className: "hidden",
        onChange: handleFileChange,
        accept: "image/*",
        disabled: isLoading,
      } as React.InputHTMLAttributes<HTMLInputElement>),
      imagePreviewUrl ? (
        React.createElement(
          "div",
          { className: "relative w-full h-48 mb-4 flex items-center justify-center" },
          React.createElement("img", {
            src: imagePreviewUrl,
            alt: "Image Preview",
            className: "max-h-full max-w-full object-contain rounded-md shadow-md",
          }),
          React.createElement(
            "button",
            {
              onClick: () => {
                setFile(null);
                setImagePreviewUrl(null);
              },
              className: "absolute top-2 right-2 p-1 bg-red-500 text-white rounded-full hover:bg-red-600",
              title: "Remove image",
            },
            React.createElement("svg", { className: "w-4 h-4", fill: "none", stroke: "currentColor", viewBox: "0 0 24 24", xmlns: "http://www.w3.org/2000/svg" }, React.createElement("path", { strokeLinecap: "round", strokeLinejoin: "round", strokeWidth: "2", d: "M6 18L18 6M6 6l12 12" }))
          )
        )
      ) : (
        React.createElement(
          React.Fragment,
          null,
          React.createElement("svg", { className: "w-12 h-12 mb-3 text-gray-400 dark:text-gray-500", fill: "none", stroke: "currentColor", viewBox: "0 0 24 24", xmlns: "http://www.w3.org/2000/svg" }, React.createElement("path", { strokeLinecap: "round", strokeLinejoin: "round", strokeWidth: "2", d: "M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-5 4h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" })),
          React.createElement(
            "p",
            { className: "text-lg font-medium text-gray-700 dark:text-gray-300" },
            "Drag and drop an image here,"
          ),
          React.createElement(
            "p",
            { className: "text-lg font-medium text-gray-700 dark:text-gray-300" },
            "or ",
            React.createElement(
              "label",
              { htmlFor: "image-upload", className: "text-blue-600 cursor-pointer hover:underline dark:text-blue-400" },
              "click to browse"
            )
          )
        )
      ),
      React.createElement(
        "p",
        { className: "text-xs mt-2 text-gray-600 dark:text-gray-400" },
        "Supported formats: JPG, PNG, GIF, WebP (up to 4MB)"
      )
    ),
    React.createElement(
      "button",
      {
        onClick: handleAnalyzeClick,
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
          " Analyzing Image..."
        )
      ) : (
        "Analyze Image"
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
    aiDescription &&
    React.createElement(
      "div",
      { className: "space-y-2" },
      React.createElement(
        "label",
        { className: "block text-sm font-medium text-gray-700 dark:text-gray-300" },
        "AI Description:"
      ),
      React.createElement(
        "div",
        { className: "relative" },
        React.createElement("textarea", {
          readOnly: true,
          className: "w-full p-3 border border-gray-300 bg-gray-50 rounded-md resize-y min-h-[120px] shadow-sm text-gray-800 dark:bg-gray-800 dark:text-gray-100 dark:border-gray-600",
          value: aiDescription,
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