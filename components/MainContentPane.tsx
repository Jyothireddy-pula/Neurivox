
// components/MainContentPane.tsx
import React, { useMemo } from 'react';
import { Workspace, WorkspaceKey, AIAction, AIActionProps, DebugLogEntry, PersonaKey, ThemeMode } from '../types';
import { WORKSPACES } from '../constants';
import { ActionCard } from './ActionCard';
import { ApiConfigurator } from './ApiConfigurator';
import { PersonaManager } from './PersonaManager';
import { ThemeSwitcher } from './ThemeSwitcher';
import { LLMSwitchOptimizer } from './LLMSwitchOptimizer'; // Fix: Import LLMSwitchOptimizer

interface MainContentPaneProps {
  activeWorkspaceKey: WorkspaceKey;
  activeAction: AIAction | null;
  isSettingsOpen: boolean;
  onSelectAction: (action: AIAction) => void;
  activeComponentProps: AIActionProps;
  // Props for positioning
  marginLeft: number;
}

export const MainContentPane: React.FC<MainContentPaneProps> = ({
  activeWorkspaceKey,
  activeAction,
  isSettingsOpen,
  onSelectAction,
  activeComponentProps,
  marginLeft,
}) => {
  const currentWorkspace = useMemo(
    () => WORKSPACES.find((ws) => ws.key === activeWorkspaceKey),
    [activeWorkspaceKey]
  );

  return React.createElement(
    "main",
    {
      className: "flex-1 flex flex-col p-4 overflow-y-auto bg-gray-50 dark:bg-gray-900 dark:text-gray-200 transition-all duration-100 ease-in-out",
      style: { marginLeft: `${marginLeft}px` }, // Dynamically adjust left margin
      role: "main",
    },
    React.createElement(
      "h1",
      { className: "text-2xl font-bold text-gray-900 mb-4 sticky top-0 bg-gray-50 py-2 z-10 dark:bg-gray-900 dark:text-gray-100" },
      isSettingsOpen ? 'Settings' : currentWorkspace?.label || 'Neurivox | OS'
    ),
    isSettingsOpen ? (
      React.createElement(
        "div",
        { className: "space-y-6" },
        React.createElement(ApiConfigurator, { onLogDebug: activeComponentProps.onLogDebug }),
        React.createElement(PersonaManager, { currentPersonaKey: activeComponentProps.currentPersonaKey, onSelectPersona: activeComponentProps.onSelectPersona, onLogDebug: activeComponentProps.onLogDebug }),
        React.createElement(ThemeSwitcher, { themeMode: activeComponentProps.themeMode, onSetThemeMode: activeComponentProps.onSetThemeMode, onLogDebug: activeComponentProps.onLogDebug }),
        React.createElement(LLMSwitchOptimizer, { onLogDebug: activeComponentProps.onLogDebug })
      )
    ) : (
      React.createElement(
        React.Fragment,
        null,
        React.createElement(
          "section",
          { className: "mb-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4" },
          currentWorkspace?.availableActions.map((action) =>
            React.createElement(ActionCard, {
              key: action.id,
              action: action,
              onClick: onSelectAction,
              isActive: (activeAction?.id === action.id),
            })
          )
        ),
        React.createElement(
          "section",
          { className: "flex-1 bg-white rounded-lg shadow-md p-4 mt-4 dark:bg-gray-800 dark:text-gray-200" },
          activeAction ? (
            React.createElement(activeAction.component, activeComponentProps)
          ) : (
            React.createElement(
              "div",
              { className: "text-center text-gray-500 py-10 dark:text-gray-400" },
              React.createElement(
                "p",
                { className: "mb-2" },
                "Select an action to get started."
              ),
              React.createElement(
                "p",
                { className: "text-sm" },
                currentWorkspace?.key === WorkspaceKey.RESEARCH && "E.g., Summarise an article, analyze text.",
                currentWorkspace?.key === WorkspaceKey.WRITING && "E.g., Fix grammar, rewrite paragraphs.",
                currentWorkspace?.key === WorkspaceKey.CODE && "E.g., Debug code snippets, generate documentation.",
                currentWorkspace?.key === WorkspaceKey.SOCIAL && "E.g., Draft social media replies.",
                currentWorkspace?.key === WorkspaceKey.ADVANCED && "E.g., Manage prompts, test AI responses, set up automations.",
                currentWorkspace?.key === WorkspaceKey.DEVELOPER && "E.g., Inspect logs, run validation tests.",
                currentWorkspace?.key === WorkspaceKey.INTEGRATIONS && "E.g., Explore plugins, connect apps.",
                currentWorkspace?.key === WorkspaceKey.PRIVACY && "E.g., Configure data handling, view audit logs.",
                currentWorkspace?.key === WorkspaceKey.FUTURISTIC && "E.g., Explore multi-agent systems, AI copilots."
              )
            )
          )
        )
      )
    )
  );
};
    