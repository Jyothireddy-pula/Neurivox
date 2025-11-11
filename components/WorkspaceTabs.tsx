// components/WorkspaceTabs.tsx
import React from 'react';
import { Workspace, WorkspaceKey } from '../types';

interface WorkspaceTabsProps {
  workspaces: Workspace[];
  activeWorkspaceKey: WorkspaceKey;
  onSelectWorkspace: (key: WorkspaceKey) => void;
}

export const WorkspaceTabs: React.FC<WorkspaceTabsProps> = ({
  workspaces,
  activeWorkspaceKey,
  onSelectWorkspace,
}) => {
  return React.createElement(
    "div",
    { className: "flex flex-col space-y-2 p-2" },
    workspaces.map((workspace) =>
      React.createElement(
        "button",
        {
          key: workspace.key,
          onClick: () => onSelectWorkspace(workspace.key),
          className: `
            flex items-center space-x-3 p-3 rounded-lg text-left
            transition-colors duration-200 ease-in-out
            ${activeWorkspaceKey === workspace.key
              ? 'bg-blue-600 text-white shadow-md'
              : 'text-gray-700 dark:text-white hover:bg-gray-100 dark:hover:bg-gray-700'
            }
          `,
        },
        React.createElement(
          "div",
          {
            className: `
            flex-shrink-0 w-6 h-6 flex items-center justify-center rounded-full
            ${activeWorkspaceKey === workspace.key ? 'bg-white text-blue-600' : 'text-blue-500'}
          `,
          },
          workspace.icon
        ),
        React.createElement(
          "span",
          { className: "font-medium text-sm" },
          workspace.label
        )
      )
    )
  );
};