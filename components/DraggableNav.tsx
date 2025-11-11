// components/DraggableNav.tsx
import React, { useMemo } from 'react';
import { Workspace, WorkspaceKey, PersonaKey, ThemeMode, DebugLogEntry } from '../types';
import { WORKSPACES, SettingsIcon, GithubIcon, LinkedinIcon } from '../constants';
import { WorkspaceTabs } from './WorkspaceTabs';
import { globalEmitter } from '../utils/eventEmitter';
import { DebugLogLevel } from '../types';

interface DraggableNavProps {
  workspaces: Workspace[];
  activeWorkspaceKey: WorkspaceKey;
  onSelectWorkspace: (key: WorkspaceKey) => void;
  isSettingsOpen: boolean;
  onSettingsToggle: () => void;
  onLogDebug: (entry: DebugLogEntry) => void;
  // Dragging props
  xPosition: number;
  onDragStart: (e: React.MouseEvent) => void;
  isDragging: boolean;
  draggableNavWidth: number; // The fixed width of the draggable nav part
}

// Fix: Wrap DraggableNav with React.forwardRef to accept a ref prop
export const DraggableNav = React.forwardRef<HTMLDivElement, DraggableNavProps>(({
  workspaces,
  activeWorkspaceKey,
  onSelectWorkspace,
  isSettingsOpen,
  onSettingsToggle,
  onLogDebug,
  xPosition,
  onDragStart,
  isDragging,
  draggableNavWidth,
}, ref) => { // Accept ref as the second argument

  const handleSocialLinkClick = React.useCallback((platform: string, url: string) => {
    onLogDebug({
      id: `ui-social-link-${Date.now()}`,
      timestamp: new Date(),
      level: DebugLogLevel.UI_EVENT,
      message: `User clicked ${platform} link.`,
      details: { url },
    });
    window.open(url, '_blank', 'noopener noreferrer');
  }, [onLogDebug]);

  return React.createElement(
    "div",
    {
      ref: ref, // Assign the forwarded ref to the root div
      className: `absolute top-0 h-full bg-white border-r border-gray-200 shadow-lg dark:bg-gray-800 dark:border-gray-700
                  transition-shadow duration-100 ease-in-out z-30 flex flex-col`,
      style: { left: `${xPosition}px`, width: `${draggableNavWidth}px` }, // Fixed width
      role: "navigation",
      "aria-label": "Primary navigation and settings",
    },
    React.createElement(
      "div",
      { className: "flex-grow p-2" },
      React.createElement(WorkspaceTabs, {
        workspaces: workspaces,
        activeWorkspaceKey: activeWorkspaceKey,
        onSelectWorkspace: onSelectWorkspace,
      })
    ),
    React.createElement(
      "div",
      { className: "py-2 border-t border-gray-200 dark:border-gray-700" },
      React.createElement(
        "div",
        { className: "flex justify-center space-x-4 py-2" },
        React.createElement(
          "button",
          {
            onClick: () => handleSocialLinkClick('GitHub', 'https://github.com/Jyothireddy-pula'),
            className: `
              flex items-center justify-center w-10 h-10 rounded-lg
              text-gray-700 hover:bg-gray-100 hover:text-blue-600 dark:text-white dark:hover:bg-gray-700 dark:hover:text-blue-400
              transition-colors duration-200 ease-in-out
            `,
            title: "My GitHub Profile",
            "aria-label": "Link to GitHub profile",
          },
          React.createElement(
            "div",
            { className: "w-6 h-6 text-gray-600 hover:text-blue-600 dark:text-white dark:hover:text-blue-400" },
            React.createElement(GithubIcon, null)
          )
        ),
        React.createElement(
          "button",
          {
            onClick: () => handleSocialLinkClick('LinkedIn', 'https://www.linkedin.com/in/jyothireddy-pula-5b3a01337/'),
            className: `
              flex items-center justify-center w-10 h-10 rounded-lg
              text-gray-700 hover:bg-gray-100 hover:text-blue-600 dark:text-white dark:hover:bg-gray-700 dark:hover:text-blue-400
              transition-colors duration-200 ease-in-out
            `,
            title: "My LinkedIn Profile",
            "aria-label": "Link to LinkedIn profile",
          },
          React.createElement(
            "div",
            { className: "w-6 h-6 text-gray-600 hover:text-blue-600 dark:text-white dark:hover:text-blue-400" },
            React.createElement(LinkedinIcon, null)
          )
        )
      ),
      React.createElement(
        "button",
        {
          onClick: onSettingsToggle,
          className: `
            flex items-center justify-center w-full h-12 rounded-lg text-left
            transition-colors duration-200 ease-in-out
            ${isSettingsOpen
              ? 'bg-blue-600 text-white shadow-md'
              : 'text-gray-700 hover:bg-gray-100 hover:text-blue-600 dark:text-white dark:hover:bg-gray-700 dark:hover:text-blue-400'
            }
          `,
          title: "Settings",
          "aria-label": "Toggle settings panel",
        },
        React.createElement(
          "div",
          {
            className: `
            flex-shrink-0 w-6 h-6 flex items-center justify-center rounded-full
            ${isSettingsOpen ? 'bg-white text-blue-600' : 'text-blue-500 dark:text-white'}
          `,
          },
          React.createElement(SettingsIcon, null)
        )
      )
    ),
    // Drag handle
    React.createElement(
      "div",
      {
        className: `absolute right-0 top-0 h-full w-2 bg-gray-200 dark:bg-gray-700 cursor-grab z-40
                    hover:bg-blue-400 dark:hover:bg-blue-600 transition-colors duration-100 ease-in-out`,
        onMouseDown: onDragStart,
        title: "Drag to reposition sidebar",
        "aria-label": "Drag handle for sidebar repositioning",
        role: "separator",
        tabIndex: 0,
        style: {
          cursor: isDragging ? 'grabbing' : 'grab',
          right: '-8px', // Position outside the main nav content slightly
        }
      }
    )
  );
});