// components/PersonaManager.tsx
import React from 'react';
import { AIActionProps, PersonaKey, PersonaProfile, DebugLogLevel } from '../types';
import { DEFAULT_PERSONAS } from '../constants';
import { globalEmitter } from '../utils/eventEmitter'; // Import the global emitter

export const PersonaManager: React.FC<AIActionProps> = ({ currentPersonaKey, onSelectPersona, onLogDebug }) => {
  const handlePersonaChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const selectedKey = e.target.value as PersonaKey;
    onSelectPersona?.(selectedKey);
    onLogDebug?.({
      id: `persona-select-${Date.now()}`,
      timestamp: new Date(),
      level: DebugLogLevel.UI_EVENT,
      message: `User selected persona: ${selectedKey}`,
      details: { personaKey: selectedKey },
    });
  };

  const activePersona = DEFAULT_PERSONAS.find(p => p.key === currentPersonaKey) || DEFAULT_PERSONAS[0];

  return React.createElement(
    "div",
    { className: "p-4 bg-gray-50 rounded-lg shadow-inner mt-4" },
    React.createElement(
      "h3",
      { className: "text-lg font-semibold text-gray-800 dark:text-gray-200 mb-2" },
      "Persona Profiles"
    ),
    React.createElement(
      "p",
      { className: "text-sm text-gray-600 dark:text-gray-400 mb-4" },
      "Switch between different AI personas to tailor responses to your current task or role."
    ),
    React.createElement(
      "div",
      { className: "mb-4" },
      React.createElement(
        "label",
        { htmlFor: "persona-select", className: "block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1" },
        "Select Persona:"
      ),
      React.createElement(
        "select",
        {
          id: "persona-select",
          className: "w-full p-3 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500 shadow-sm text-gray-800 bg-white dark:bg-gray-700 dark:text-gray-100 dark:border-gray-600",
          value: currentPersonaKey,
          onChange: handlePersonaChange,
        } as React.SelectHTMLAttributes<HTMLSelectElement>,
        DEFAULT_PERSONAS.map((persona: PersonaProfile) =>
          React.createElement(
            "option",
            { key: persona.key, value: persona.key },
            persona.name
          )
        )
      )
    ),
    activePersona && React.createElement(
      "div",
      { className: "p-3 bg-blue-50 dark:bg-blue-900 rounded-md text-sm text-blue-800 dark:text-blue-100" },
      React.createElement(
        "p",
        { className: "font-semibold" },
        "Current Persona: ",
        activePersona.name
      ),
      React.createElement(
        "p",
        null,
        activePersona.description
      )
    )
  );
};
