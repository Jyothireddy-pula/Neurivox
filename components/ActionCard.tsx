// components/ActionCard.tsx
import React from 'react';
import { AIAction } from '../types';

interface ActionCardProps {
  action: AIAction;
  onClick: (action: AIAction) => void;
  isActive?: boolean;
}

export const ActionCard: React.FC<ActionCardProps> = ({ action, onClick, isActive }) => {
  return React.createElement(
    "div",
    {
      onClick: () => onClick(action),
      className: `
        flex items-center space-x-3 p-3 rounded-lg cursor-pointer
        transition-all duration-200 ease-in-out
        ${isActive ? 'bg-blue-500 text-white shadow-md' : 'bg-white hover:bg-gray-100 text-gray-800 border border-gray-200'}
      `,
    },
    React.createElement(
      "div",
      {
        className: `
        flex-shrink-0 w-8 h-8 flex items-center justify-center rounded-full
        ${isActive ? 'bg-white text-blue-500' : 'bg-blue-100 text-blue-600'}
      `,
      },
      action.icon
    ),
    React.createElement(
      "div",
      null,
      React.createElement(
        "h3",
        { className: `text-sm font-semibold ${isActive ? 'text-white' : 'text-gray-900'}` },
        action.name
      ),
      React.createElement(
        "p",
        { className: `text-xs ${isActive ? 'text-blue-100' : 'text-gray-500'}` },
        action.description
      )
    )
  );
};