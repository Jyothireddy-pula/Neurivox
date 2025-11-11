// components/ThemeSwitcher.tsx
import React from 'react';
import { AIActionProps, ThemeMode, DebugLogLevel } from '../types';
import { globalEmitter } from '../utils/eventEmitter'; // Import the global emitter

export const ThemeSwitcher: React.FC<AIActionProps> = ({ themeMode, onSetThemeMode, onLogDebug }) => {
  const handleToggleTheme = () => {
    const newMode: ThemeMode = themeMode === 'light' ? 'dark' : 'light';
    onSetThemeMode?.(newMode);
    onLogDebug?.({
      id: `theme-toggle-${Date.now()}`,
      timestamp: new Date(),
      level: DebugLogLevel.UI_EVENT,
      message: `User toggled theme to: ${newMode}`,
      details: { newThemeMode: newMode },
    });
  };

  return React.createElement(
    "div",
    { className: "p-4 bg-gray-50 rounded-lg shadow-inner mt-4" },
    React.createElement(
      "h3",
      { className: "text-lg font-semibold text-gray-800 dark:text-gray-200 mb-2" },
      "Theme & Appearance"
    ),
    React.createElement(
      "p",
      { className: "text-sm text-gray-600 dark:text-gray-400 mb-4" },
      "Switch between light and dark modes to customize your visual experience."
    ),
    React.createElement(
      "div",
      { className: "flex items-center space-x-4" },
      React.createElement(
        "label",
        { htmlFor: "theme-toggle", className: "inline-flex items-center cursor-pointer" },
        React.createElement("input", {
          id: "theme-toggle",
          type: "checkbox",
          className: "sr-only peer",
          checked: themeMode === 'dark',
          onChange: handleToggleTheme,
        } as React.InputHTMLAttributes<HTMLInputElement>),
        React.createElement("div", { className: "relative w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 dark:peer-focus:ring-blue-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-blue-600" }),
        React.createElement("span", { className: "ml-3 text-sm font-medium text-gray-900 dark:text-gray-300" }, "Dark Mode")
      )
    )
  );
};
