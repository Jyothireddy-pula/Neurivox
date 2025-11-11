// components/CommandPalette.tsx
import React, { useState, useEffect, useCallback, useRef } from 'react';
import { AIAction } from '../types';

interface CommandPaletteProps {
  actions: AIAction[];
  onSelectAction: (action: AIAction) => void;
  isOpen: boolean;
  onClose: () => void;
}

export const CommandPalette: React.FC<CommandPaletteProps> = ({ actions, onSelectAction, isOpen, onClose }) => {
  const [query, setQuery] = useState('');
  const [filteredActions, setFilteredActions] = useState<AIAction[]>([]);
  const [activeIndex, setActiveIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen) {
      setQuery('');
      setActiveIndex(0);
      setFilteredActions(actions);
      inputRef.current?.focus();
    }
  }, [isOpen, actions]);

  useEffect(() => {
    const lowerCaseQuery = query.toLowerCase();
    const results = actions.filter(action =>
      action.name.toLowerCase().includes(lowerCaseQuery) ||
      action.description.toLowerCase().includes(lowerCaseQuery)
    );
    setFilteredActions(results);
    setActiveIndex(0);
  }, [query, actions]);

  const handleKeyDown = useCallback((event: KeyboardEvent) => {
    if (!isOpen) return;

    if (event.key === 'Escape') {
      onClose();
    } else if (event.key === 'ArrowDown') {
      event.preventDefault();
      setActiveIndex((prevIndex) => (prevIndex + 1) % filteredActions.length);
    } else if (event.key === 'ArrowUp') {
      event.preventDefault();
      setActiveIndex((prevIndex) => (prevIndex - 1 + filteredActions.length) % filteredActions.length);
    } else if (event.key === 'Enter') {
      event.preventDefault();
      if (filteredActions[activeIndex]) {
        onSelectAction(filteredActions[activeIndex]);
        onClose();
      }
    }
  }, [isOpen, filteredActions, activeIndex, onSelectAction, onClose]);

  useEffect(() => {
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [handleKeyDown]);

  if (!isOpen) return null;

  // Fix: Explicitly type the 'e' parameter in the onChange handler to resolve
  // "Property 'value' does not exist on type 'EventTarget'" error.
  const inputElementProps: React.HTMLProps<HTMLInputElement> = {
    ref: inputRef,
    type: "text",
    placeholder: "Search AI actions...",
    className: "flex-grow focus:outline-none text-lg text-gray-900 placeholder-gray-400 bg-white",
    value: query,
    onChange: (e: React.ChangeEvent<HTMLInputElement>) => setQuery(e.target.value),
  };

  return React.createElement(
    "div",
    {
      className: "fixed inset-0 z-50 flex items-start justify-center p-4 pt-20 bg-black bg-opacity-50",
      onClick: onClose,
    },
    React.createElement(
      "div",
      {
        className: "bg-white rounded-lg shadow-xl w-full max-w-md overflow-hidden transform transition-all sm:my-8 sm:align-middle sm:max-w-lg",
        onClick: (e) => e.stopPropagation(), // Prevent closing when clicking inside the palette
      },
      React.createElement(
        "div",
        { className: "p-4 border-b border-gray-200 flex items-center" },
        // Fix: Added explicit type assertion to guide TypeScript on SVG props.
        React.createElement('svg', {
          className: "w-5 h-5 text-gray-400 mr-2",
          fill: "none",
          stroke: "currentColor",
          viewBox: "0 0 24 24",
          xmlns: "http://www.w3.org/2000/svg",
        } as React.SVGProps<SVGSVGElement>,
          React.createElement("path", { strokeLinecap: "round", strokeLinejoin: "round", strokeWidth: "2", d: "M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" })),
        React.createElement("input", inputElementProps)
      ),
      React.createElement(
        "ul",
        { className: "max-h-80 overflow-y-auto divide-y divide-gray-100" },
        filteredActions.length > 0 ? (
          filteredActions.map((action, index) =>
            React.createElement(
              "li",
              {
                key: action.id,
                className: `
                  p-4 cursor-pointer flex items-center space-x-3
                  ${index === activeIndex ? 'bg-blue-500 text-white' : 'hover:bg-gray-100 text-gray-900'}
                `,
                onClick: () => {
                  onSelectAction(action);
                  onClose();
                },
                onMouseEnter: () => setActiveIndex(index),
              },
              React.createElement(
                "div",
                {
                  className: `
                  flex-shrink-0 w-6 h-6 flex items-center justify-center rounded-full
                  ${index === activeIndex ? 'bg-white text-blue-500' : 'bg-blue-100 text-blue-600'}
                `,
                },
                action.icon
              ),
              React.createElement(
                "div",
                null,
                React.createElement(
                  "h4",
                  { className: `text-base font-medium ${index === activeIndex ? 'text-white' : 'text-gray-900'}` },
                  action.name
                ),
                React.createElement(
                  "p",
                  { className: `text-sm ${index === activeIndex ? 'text-blue-100' : 'text-gray-500'}` },
                  action.description
                )
              )
            )
          )
        ) : (
          React.createElement("li", { className: "p-4 text-gray-500 text-center" }, "No actions found.")
        )
      )
    )
  );
};