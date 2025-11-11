// components/DebuggingTools.tsx
import React, { useState, useEffect } from 'react';
import { AIActionProps, DebugLogEntry, DebugLogLevel } from '../types';
import { globalEmitter } from '../utils/eventEmitter';

export const DebuggingTools: React.FC<AIActionProps> = ({ debugLogs: initialDebugLogs }) => {
  const [debugLogs, setDebugLogs] = useState<DebugLogEntry[]>(initialDebugLogs || []);
  const [developerMode, setDeveloperMode] = useState(false);

  // Sync state with prop, but allow internal management for filtering/clearing
  useEffect(() => {
    setDebugLogs(initialDebugLogs || []);
  }, [initialDebugLogs]);

  // Optionally listen to global emitter if not using prop drilling for logs
  // (In this setup, logs are passed via props from App.tsx, but this shows how global emitter could be used)
  useEffect(() => {
    const unsubscribe = globalEmitter.on('debugLog', (entry: DebugLogEntry) => {
      setDebugLogs(prevLogs => {
        const newLogs = [...prevLogs, entry];
        return newLogs.slice(-50); // Keep last 50
      });
    });
    return () => unsubscribe();
  }, []);

  const clearLogs = () => {
    setDebugLogs([]);
  };

  const getLogLevelColor = (level: DebugLogLevel) => {
    switch (level) {
      case DebugLogLevel.INFO: return 'text-blue-400';
      case DebugLogLevel.WARNING: return 'text-yellow-400';
      case DebugLogLevel.ERROR: return 'text-red-400';
      case DebugLogLevel.API_CALL: return 'text-purple-400';
      case DebugLogLevel.API_RESPONSE: return 'text-green-400';
      case DebugLogLevel.API_KEY_MISSING: return 'text-orange-400'; // Specific color for API key issues
      case DebugLogLevel.MODEL_SELECTION: return 'text-pink-400';
      case DebugLogLevel.CONTEXT_MEMORY: return 'text-indigo-400';
      case DebugLogLevel.AUTOMATION_STEP: return 'text-teal-400';
      case DebugLogLevel.UI_EVENT: return 'text-gray-400';
      default: return 'text-gray-500';
    }
  };

  const formatTimestamp = (date: Date) => {
    return date.toLocaleTimeString('en-US', { hour12: false, hour: '2-digit', minute: '2-digit', second: '2-digit' });
  };

  return React.createElement(
    "div",
    { className: "p-4 space-y-4 flex flex-col h-full dark:bg-gray-900 dark:text-gray-200" },
    React.createElement(
      "h2",
      { className: "text-xl font-bold text-gray-800 dark:text-gray-200" },
      "Debugging & Developer Tools"
    ),
    React.createElement(
      "p",
      { className: "text-sm text-gray-600 dark:text-gray-400 mb-4" },
      "Inspect model responses, latency, and API logs. Enable 'Developer Mode' for detailed debugging."
    ),

    React.createElement(
      "div",
      { className: "flex items-center justify-between mb-4 bg-white dark:bg-gray-800 p-3 rounded-lg shadow-sm border border-purple-200 dark:border-purple-700" },
      React.createElement(
        "label",
        { htmlFor: "developer-mode-toggle", className: "inline-flex items-center cursor-pointer" },
        React.createElement("input", {
          id: "developer-mode-toggle",
          type: "checkbox",
          checked: developerMode,
          onChange: (e) => setDeveloperMode(e.target.checked),
          className: "sr-only peer",
          "aria-label": "Toggle Developer Mode",
        } as React.InputHTMLAttributes<HTMLInputElement>),
        React.createElement("div", { className: "relative w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-purple-300 dark:peer-focus:ring-purple-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-purple-600" }),
        React.createElement("span", { className: "ml-3 text-sm font-medium text-gray-900 dark:text-gray-300" }, "Developer Mode")
      ),
      React.createElement(
        "button",
        {
          onClick: clearLogs,
          className: "bg-red-500 hover:bg-red-600 text-white text-sm py-1 px-3 rounded-md transition-colors",
          "aria-label": "Clear all debug logs",
        },
        "Clear Logs"
      )
    ),

    developerMode ? (
      React.createElement(
        "div",
        { className: "flex-1 overflow-y-auto bg-gray-900 text-gray-100 font-mono text-xs rounded-lg p-3 shadow-inner" },
        debugLogs.length === 0 && React.createElement(
          "p",
          { className: "text-gray-500" },
          "No API logs yet. Perform an AI action to see logs here."
        ),
        debugLogs.map((log) =>
          React.createElement(
            "div",
            { key: log.id, className: `mb-2 p-2 rounded-md ${log.level === DebugLogLevel.ERROR ? 'bg-red-900' : log.level === DebugLogLevel.WARNING ? 'bg-yellow-900' : 'bg-gray-800'}` },
            React.createElement(
              "div",
              { className: "flex justify-between items-center" },
              React.createElement(
                "span",
                { className: `${getLogLevelColor(log.level)} font-bold` },
                `[${log.level.toUpperCase()}]`
              ),
              React.createElement(
                "span",
                { className: "text-gray-400" },
                formatTimestamp(log.timestamp)
              )
            ),
            React.createElement(
              "p",
              { className: "mt-1 whitespace-pre-wrap" },
              log.message
            ),
            log.details && React.createElement(
              "pre",
              { className: "mt-1 bg-gray-700 p-2 rounded overflow-x-auto text-gray-200" },
              JSON.stringify(log.details, null, 2)
            )
          )
        )
      )
    ) : (
      React.createElement(
        "div",
        { className: "flex-1 flex items-center justify-center bg-gray-100 dark:bg-gray-800 rounded-lg text-gray-500 dark:text-gray-400" },
        React.createElement(
          "p",
          { className: "text-center" },
          "Developer Mode is off. Toggle it on to view API logs and debugging information."
        )
      )
    )
  );
};