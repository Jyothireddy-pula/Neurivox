// App.tsx
import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { CommandPalette } from './components/CommandPalette';
import { AIAction, DebugLogEntry, PersonaKey, ThemeMode, WorkspaceKey, AIActionProps } from './types'; // Added WorkspaceKey, AIActionProps
import { WORKSPACES, DEFAULT_PERSONAS } from './constants';
import { globalEmitter } from './utils/eventEmitter';
import { decodeBase64Audio, playAudioBuffer } from './utils/audioUtils';
import { SPEECH_AI_MODEL } from './constants';
import { GoogleGenAI, Modality } from "@google/genai";
import { DebugLogLevel } from './types';
import { Header } from './components/Header';
import { DraggableNav } from './components/DraggableNav'; // NEW import
import { MainContentPane } from './components/MainContentPane'; // NEW import

const App: React.FC = () => {
  const [isCommandPaletteOpen, setIsCommandPaletteOpen] = useState(false);
  const [activeActionFromPalette, setActiveActionFromPalette] = useState<AIAction | undefined>(undefined);
  const [initialInputForAction, setInitialInputForAction] = useState<string | undefined>(undefined);
  const [debugLogs, setDebugLogs] = useState<DebugLogEntry[]>([]);
  const [currentPersonaKey, setCurrentPersonaKey] = useState<PersonaKey>(PersonaKey.DEFAULT);
  const [themeMode, setThemeMode] = useState<ThemeMode>('light');

  // State lifted from original Sidebar component
  const [activeWorkspaceKey, setActiveWorkspaceKey] = useState<WorkspaceKey>(WorkspaceKey.WRITING);
  const [activeAction, setActiveAction] = useState<AIAction | null>(null);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);

  // Dragging state for sidebar
  const DRAGGABLE_NAV_WIDTH = 192 + 8; // w-48 (192px) + 8px for drag handle
  const [sidebarXPosition, setSidebarXPosition] = useState(0);
  const [isSidebarDragging, setIsSidebarDragging] = useState(false);
  const dragStartX = useRef(0);
  const initialSidebarX = useRef(0);
  const draggableNavRef = useRef<HTMLDivElement>(null); // Reference to the DraggableNav's root div for width

  // Refs for stable function references for global event listeners
  const dragMoveHandlerRef = useRef<(e: MouseEvent) => void>();
  const dragEndHandlerRef = useRef<() => void>();

  // Flatten all available actions from all workspaces for the command palette
  const allActions = useMemo(() => {
    return WORKSPACES.flatMap(workspace => workspace.availableActions);
  }, []);

  const handleLogDebug = useCallback((entry: DebugLogEntry) => {
    setDebugLogs((prevLogs) => {
      const newLogs = [...prevLogs, entry];
      return newLogs.slice(-50); // Keep only the last 50 logs
    });
  }, []);

  // Use globalEmitter to listen for debug logs from services
  useEffect(() => {
    const unsubscribe = globalEmitter.on('debugLog', handleLogDebug);
    return () => {
      unsubscribe();
    };
  }, [handleLogDebug]);

  // Set initial default action on mount
  useEffect(() => {
    if (!activeAction && !activeActionFromPalette) {
      const defaultWorkspace = WORKSPACES.find(ws => ws.key === WorkspaceKey.WRITING);
      if (defaultWorkspace && defaultWorkspace.availableActions.length > 0) {
        setActiveWorkspaceKey(defaultWorkspace.key);
        setActiveAction(defaultWorkspace.availableActions[0]);
        handleLogDebug({
          id: `ui-default-action-${Date.now()}`,
          timestamp: new Date(),
          level: DebugLogLevel.UI_EVENT,
          message: `Default action set: ${defaultWorkspace.availableActions[0].name}`,
        });
      }
    }
  }, [activeAction, activeActionFromPalette, handleLogDebug]);


  // Effect for handling actions initiated from the Command Palette
  useEffect(() => {
    if (activeActionFromPalette) {
      setActiveAction(activeActionFromPalette);
      const workspace = WORKSPACES.find(ws => ws.availableActions.some(action => action.id === activeActionFromPalette.id));
      if (workspace) {
        setActiveWorkspaceKey(workspace.key);
      }
      setIsSettingsOpen(false); // Close settings when selecting action from palette
      handleLogDebug({
        id: `ui-palette-action-${Date.now()}`,
        timestamp: new Date(),
        level: DebugLogLevel.UI_EVENT,
        message: `Action selected from Command Palette: ${activeActionFromPalette.name}`,
        details: { actionId: activeActionFromPalette.id },
      });
    }
  }, [activeActionFromPalette, handleLogDebug]);

  const handleOpenCommandPalette = useCallback(() => {
    setIsCommandPaletteOpen(true);
  }, []);

  const handleCloseCommandPalette = useCallback(() => {
    setIsCommandPaletteOpen(false);
  }, []);

  const handleSelectActionFromPalette = useCallback((action: AIAction) => {
    setActiveActionFromPalette(action);
    setInitialInputForAction(undefined);
    handleCloseCommandPalette();
  }, [handleCloseCommandPalette]);

  const handleClearActiveActionFromPalette = useCallback(() => {
    setActiveActionFromPalette(undefined);
    setInitialInputForAction(undefined);
  }, []);

  // Handlers lifted from original Sidebar
  const handleActionClick = useCallback((action: AIAction) => {
    setActiveAction(action);
    setIsSettingsOpen(false);
    handleClearActiveActionFromPalette();
    handleLogDebug({
      id: `ui-action-select-${Date.now()}`,
      timestamp: new Date(),
      level: DebugLogLevel.UI_EVENT,
      message: `User selected action: ${action.name} (${action.id})`,
    });
  }, [handleClearActiveActionFromPalette, handleLogDebug]);

  const handleSettingsToggle = useCallback(() => {
    setIsSettingsOpen(prev => !prev);
    setActiveAction(null);
    handleClearActiveActionFromPalette();
    handleLogDebug({
      id: `ui-settings-toggle-${Date.now()}`,
      timestamp: new Date(),
      level: DebugLogLevel.UI_EVENT,
      message: `User ${isSettingsOpen ? 'closed' : 'opened'} settings.`,
    });
  }, [handleClearActiveActionFromPalette, handleLogDebug, isSettingsOpen]);

  const handleWorkspaceSelect = useCallback((key: WorkspaceKey) => {
    setActiveWorkspaceKey(key);
    setIsSettingsOpen(false);
    handleClearActiveActionFromPalette();
    handleLogDebug({
      id: `ui-workspace-select-${Date.now()}`,
      timestamp: new Date(),
      level: DebugLogLevel.UI_EVENT,
      message: `User selected workspace: ${key}`,
    });

    const newWorkspace = WORKSPACES.find(ws => ws.key === key);
    if (newWorkspace && newWorkspace.availableActions.length > 0) {
      setActiveAction(newWorkspace.availableActions[0]);
    } else {
      setActiveAction(null);
    }
  }, [handleClearActiveActionFromPalette, handleLogDebug]);

  const handleSpeakText = useCallback(async (text: string) => {
    if (!process.env.API_KEY) {
      console.error("API Key is not configured for TTS.");
      handleLogDebug({
        id: `tts-error-${Date.now()}`,
        timestamp: new Date(),
        level: DebugLogLevel.ERROR,
        message: "Text-to-Speech failed: API Key is not configured.",
        details: { text },
      });
      return;
    }

    try {
      // CRITICAL: Initialize GoogleGenAI right before the API call to ensure the API key is up-to-date.
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
      const response = await ai.models.generateContent({
        model: SPEECH_AI_MODEL,
        contents: [{ parts: [{ text: text }] }],
        config: {
          responseModalities: [Modality.AUDIO],
          speechConfig: {
            voiceConfig: {
              prebuiltVoiceConfig: { voiceName: 'Kore' },
            },
          },
        },
      });

      const base64Audio = response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
      if (base64Audio) {
        const audioBuffer = await decodeBase64Audio(base64Audio);
        playAudioBuffer(audioBuffer);
        handleLogDebug({
          id: `tts-success-${Date.now()}`,
          timestamp: new Date(),
          level: DebugLogLevel.INFO,
          message: `Text-to-Speech successful for: "${text.substring(0, 50)}..."`,
          details: { textLength: text.length },
        });
      }
    } catch (error: any) {
      console.error("Error generating speech:", error);
      handleLogDebug({
        id: `tts-failure-${Date.now()}`,
        timestamp: new Date(),
        level: DebugLogLevel.ERROR,
        message: `Text-to-Speech failed: ${error.message || String(error)}`,
        details: { text, error: error.message || String(error) },
      });
    }
  }, [handleLogDebug]);

  // Fix: Explicitly type the memoized object as AIActionProps.
  // The errors on lines 38 and 39 (onLogDebug and debugLogs) were unusual as they are property assignments, not function calls.
  // Explicitly typing the object here helps TypeScript ensure the structure matches AIActionProps, potentially resolving
  // any subtle type inference issues that might lead to misreported errors in certain build environments.
  const activeComponentProps: AIActionProps = useMemo(() => ({
    initialInput: initialInputForAction,
    onActionComplete: (result: string) => {
      handleLogDebug({
        id: `action-complete-${Date.now()}`,
        timestamp: new Date(),
        level: DebugLogLevel.INFO,
        message: `AI action completed. Output length: ${result.length} characters.`,
        details: { outputSnippet: result.substring(0, 100) },
      });
      handleClearActiveActionFromPalette();
    },
    onLogDebug: handleLogDebug,
    debugLogs: debugLogs,
    currentPersonaKey: currentPersonaKey,
    onSelectPersona: setCurrentPersonaKey,
    themeMode: themeMode,
    onSetThemeMode: setThemeMode,
    onSpeakText: handleSpeakText,
  }), [initialInputForAction, handleClearActiveActionFromPalette, handleLogDebug, debugLogs, currentPersonaKey, themeMode, handleSpeakText, setThemeMode]); // Added setThemeMode to dependencies

  // Keyboard shortcut for command palette
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.ctrlKey && event.shiftKey && event.key === 'P') {
        event.preventDefault();
        handleOpenCommandPalette();
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [handleOpenCommandPalette]);

  // Dragging event handlers for the sidebar
  const handleDragMove = useCallback((e: MouseEvent) => {
    if (!isSidebarDragging) return;

    let newX = initialSidebarX.current + (e.clientX - dragStartX.current);

    // Constrain the sidebar position:
    // Min X: 0 (left edge of the window)
    // Max X: window.innerWidth - DRAGGABLE_NAV_WIDTH (right edge of the window, accounting for sidebar width)
    newX = Math.max(0, newX);
    newX = Math.min(window.innerWidth - DRAGGABLE_NAV_WIDTH, newX);

    setSidebarXPosition(newX);
  }, [isSidebarDragging, DRAGGABLE_NAV_WIDTH]);

  const handleDragEnd = useCallback(() => {
    setIsSidebarDragging(false);
    document.body.style.userSelect = '';
    document.body.style.cursor = '';

    // Remove listeners using the stable refs
    if (dragMoveHandlerRef.current) {
      document.removeEventListener('mousemove', dragMoveHandlerRef.current);
    }
    if (dragEndHandlerRef.current) {
      document.removeEventListener('mouseup', dragEndHandlerRef.current);
    }
  }, []); // Empty dependency array because it uses refs, which are stable.

  // Update refs whenever the functions themselves are re-created by useCallback (which should be rare with correct deps)
  useEffect(() => {
    dragMoveHandlerRef.current = handleDragMove;
    dragEndHandlerRef.current = handleDragEnd;
  }, [handleDragMove, handleDragEnd]);


  const handleDragStart = useCallback((e: React.MouseEvent) => {
    e.preventDefault(); // Prevent text selection during drag
    setIsSidebarDragging(true);
    dragStartX.current = e.clientX;
    initialSidebarX.current = sidebarXPosition;

    document.body.style.userSelect = 'none'; // Prevent text selection
    document.body.style.cursor = 'grabbing'; // Change cursor

    // Add listeners using the stable refs
    if (dragMoveHandlerRef.current) {
      document.addEventListener('mousemove', dragMoveHandlerRef.current);
    }
    if (dragEndHandlerRef.current) {
      document.addEventListener('mouseup', dragEndHandlerRef.current);
    }
  }, [sidebarXPosition]); // sidebarXPosition is a dependency because initialSidebarX.current depends on its value.

  return React.createElement(
    "div",
    { className: `App flex flex-col h-screen ${themeMode === 'dark' ? 'dark bg-gray-900' : 'light bg-f4f7fa'}` },
    React.createElement(Header, {}),
    React.createElement(
      "div",
      { className: "flex flex-1 relative w-full overflow-hidden" }, // Ensure container is relative for absolute children
      // Fix: Pass ref to DraggableNav wrapped with React.forwardRef
      React.createElement(DraggableNav, {
        ref: draggableNavRef, // Pass ref to DraggableNav
        workspaces: WORKSPACES,
        activeWorkspaceKey: activeWorkspaceKey,
        onSelectWorkspace: handleWorkspaceSelect,
        isSettingsOpen: isSettingsOpen,
        onSettingsToggle: handleSettingsToggle,
        onLogDebug: handleLogDebug,
        xPosition: sidebarXPosition,
        onDragStart: handleDragStart,
        isDragging: isSidebarDragging,
        draggableNavWidth: DRAGGABLE_NAV_WIDTH,
      }),
      React.createElement(MainContentPane, {
        activeWorkspaceKey: activeWorkspaceKey,
        activeAction: activeAction,
        isSettingsOpen: isSettingsOpen,
        onSelectAction: handleActionClick,
        activeComponentProps: activeComponentProps,
        marginLeft: sidebarXPosition + DRAGGABLE_NAV_WIDTH, // Main content starts after the draggable nav
      }),
      React.createElement(CommandPalette, {
        isOpen: isCommandPaletteOpen,
        onClose: handleCloseCommandPalette,
        actions: allActions,
        onSelectAction: handleSelectActionFromPalette,
      })
    )
  );
};


export default App;
