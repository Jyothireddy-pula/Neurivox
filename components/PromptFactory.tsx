// components/PromptFactory.tsx
import React, { useState, useEffect, useCallback } from 'react';
import { AIActionProps, PromptTemplate, PromptCategory, DebugLogLevel } from '../types';
import { globalEmitter } from '../utils/eventEmitter'; // Import global emitter for logging

const LOCAL_STORAGE_KEY = 'neurivox_prompts';

export const PromptFactory: React.FC<AIActionProps> = ({ onLogDebug }) => {
  const [prompts, setPrompts] = useState<PromptTemplate[]>([]);
  const [editingPrompt, setEditingPrompt] = useState<PromptTemplate | null>(null);
  const [newPromptName, setNewPromptName] = useState('');
  const [newPromptDescription, setNewPromptDescription] = useState('');
  const [newPromptContent, setNewPromptContent] = useState('');
  const [newPromptCategory, setNewPromptCategory] = useState<PromptCategory>(PromptCategory.GENERAL);
  const [filterCategory, setFilterCategory] = useState<PromptCategory | 'All'>('All');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    try {
      const storedPrompts = localStorage.getItem(LOCAL_STORAGE_KEY);
      if (storedPrompts) {
        setPrompts(JSON.parse(storedPrompts));
      }
      onLogDebug?.({
        id: `prompt-factory-load-${Date.now()}`,
        timestamp: new Date(),
        level: DebugLogLevel.INFO,
        message: "Prompts loaded from local storage.",
      });
    } catch (e: any) {
      console.error("Failed to load prompts from local storage:", e);
      setErrorMessage("Failed to load prompts from local storage.");
      onLogDebug?.({
        id: `prompt-factory-load-error-${Date.now()}`,
        timestamp: new Date(),
        level: DebugLogLevel.ERROR,
        message: `Failed to load prompts: ${e.message || String(e)}`,
      });
    }
  }, [onLogDebug]);

  useEffect(() => {
    try {
      localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(prompts));
      onLogDebug?.({
        id: `prompt-factory-save-${Date.now()}`,
        timestamp: new Date(),
        level: DebugLogLevel.INFO,
        message: "Prompts saved to local storage.",
      });
    } catch (e: any) {
      console.error("Failed to save prompts to local storage:", e);
      setErrorMessage("Failed to save prompts to local storage.");
      onLogDebug?.({
        id: `prompt-factory-save-error-${Date.now()}`,
        timestamp: new Date(),
        level: DebugLogLevel.ERROR,
        message: `Failed to save prompts: ${e.message || String(e)}`,
      });
    }
  }, [prompts, onLogDebug]);

  const resetForm = useCallback(() => {
    setEditingPrompt(null);
    setNewPromptName('');
    setNewPromptDescription('');
    setNewPromptContent('');
    setNewPromptCategory(PromptCategory.GENERAL);
    setErrorMessage(null);
  }, []);

  const handleAddOrUpdatePrompt = () => {
    if (!newPromptName.trim() || !newPromptContent.trim()) {
      setErrorMessage("Prompt name and content cannot be empty.");
      onLogDebug?.({
        id: `prompt-factory-validation-${Date.now()}`,
        timestamp: new Date(),
        level: DebugLogLevel.WARNING,
        message: "Attempted to add/update prompt with empty fields.",
      });
      return;
    }

    if (editingPrompt) {
      setPrompts(prompts.map(p =>
        p.id === editingPrompt.id
          ? {
              ...p,
              name: newPromptName,
              description: newPromptDescription,
              content: newPromptContent,
              category: newPromptCategory,
              // Add current content to history before updating
              history: [...(p.history || []), {
                timestamp: new Date(),
                content: p.content,
                description: p.description,
                name: p.name,
                category: p.category,
              }]
            }
          : p
      ));
      onLogDebug?.({
        id: `prompt-factory-update-${Date.now()}`,
        timestamp: new Date(),
        level: DebugLogLevel.INFO,
        message: `Prompt updated: ${newPromptName}`,
        details: { promptId: editingPrompt.id, newName: newPromptName },
      });
    } else {
      const newPrompt: PromptTemplate = {
        id: Date.now().toString(),
        name: newPromptName,
        description: newPromptDescription,
        content: newPromptContent,
        category: newPromptCategory,
        history: [], // New prompts start with empty history
      };
      setPrompts([...prompts, newPrompt]);
      onLogDebug?.({
        id: `prompt-factory-add-${Date.now()}`,
        timestamp: new Date(),
        level: DebugLogLevel.INFO,
        message: `New prompt added: ${newPromptName}`,
        details: { promptId: newPrompt.id, name: newPromptName },
      });
    }
    resetForm();
  };

  const handleEditPrompt = (prompt: PromptTemplate) => {
    setEditingPrompt(prompt);
    setNewPromptName(prompt.name);
    setNewPromptDescription(prompt.description || '');
    setNewPromptContent(prompt.content);
    setNewPromptCategory(prompt.category);
    setErrorMessage(null);
    onLogDebug?.({
      id: `prompt-factory-edit-start-${Date.now()}`,
      timestamp: new Date(),
      level: DebugLogLevel.UI_EVENT,
      message: `Started editing prompt: ${prompt.name}`,
      details: { promptId: prompt.id },
    });
  };

  const handleRevertPrompt = (promptId: string, versionIndex: number) => {
    setPrompts(prompts.map(p => {
      if (p.id === promptId && p.history && p.history[versionIndex]) {
        const historyEntry = p.history[versionIndex];
        const updatedHistory = p.history.slice(0, versionIndex + 1); // Keep up to the reverted version
        const newCurrentContent = {
          name: historyEntry.name,
          description: historyEntry.description,
          content: historyEntry.content,
          category: historyEntry.category,
        };
        onLogDebug?.({
          id: `prompt-factory-revert-${Date.now()}`,
          timestamp: new Date(),
          level: DebugLogLevel.INFO,
          message: `Reverted prompt "${p.name}" to an older version.`,
          details: { promptId: p.id, versionIndex },
        });
        return {
          ...p,
          ...newCurrentContent,
          history: updatedHistory,
        };
      }
      return p;
    }));
    resetForm(); // Reset form if currently editing the reverted prompt
  };


  const handleDeletePrompt = (id: string) => {
    if (window.confirm("Are you sure you want to delete this prompt?")) {
      setPrompts(prompts.filter(p => p.id !== id));
      if (editingPrompt?.id === id) {
        resetForm();
      }
      onLogDebug?.({
        id: `prompt-factory-delete-${Date.now()}`,
        timestamp: new Date(),
        level: DebugLogLevel.INFO,
        message: `Prompt deleted: ${id}`,
      });
    }
  };

  const handleExportPrompts = () => {
    const json = JSON.stringify(prompts, null, 2);
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'neurivox_prompts.json';
    a.style.display = 'none'; // Hide the element
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    onLogDebug?.({
      id: `prompt-factory-export-${Date.now()}`,
      timestamp: new Date(),
      level: DebugLogLevel.INFO,
      message: "Prompts exported to neurivox_prompts.json.",
    });
  };

  const handleImportPrompts = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          const imported = JSON.parse(e.target?.result as string) as PromptTemplate[];
          // Basic validation for imported structure
          if (Array.isArray(imported) && imported.every(p => p.id && p.name && p.content && p.category)) {
            // Merge with existing prompts, overwrite if IDs conflict
            const mergedPrompts = [...prompts];
            imported.forEach(importedPrompt => {
              const existingIndex = mergedPrompts.findIndex(p => p.id === importedPrompt.id);
              if (existingIndex > -1) {
                mergedPrompts[existingIndex] = importedPrompt; // Overwrite
              } else {
                mergedPrompts.push(importedPrompt); // Add new
              }
            });
            setPrompts(mergedPrompts);
            setErrorMessage(null);
            alert('Prompts imported successfully!');
            onLogDebug?.({
              id: `prompt-factory-import-${Date.now()}`,
              timestamp: new Date(),
              level: DebugLogLevel.INFO,
              message: "Prompts imported successfully.",
              details: { importedCount: imported.length },
            });
          } else {
            setErrorMessage("Invalid JSON format for prompts. Please ensure it matches the expected structure.");
            onLogDebug?.({
              id: `prompt-factory-import-error-${Date.now()}`,
              timestamp: new Date(),
              level: DebugLogLevel.ERROR,
              message: "Failed to import prompts: Invalid JSON format.",
            });
          }
        } catch (error: any) {
          console.error("Error importing prompts:", error);
          setErrorMessage("Failed to parse imported file as JSON.");
          onLogDebug?.({
            id: `prompt-factory-import-parse-error-${Date.now()}`,
            timestamp: new Date(),
            level: DebugLogLevel.ERROR,
            message: `Failed to import prompts: ${error.message || String(error)}`,
          });
        }
      };
      reader.readAsText(file);
    }
  };

  const filteredPrompts = React.useMemo(() => {
    if (filterCategory === 'All') {
      return prompts;
    }
    return prompts.filter(p => p.category === filterCategory);
  }, [prompts, filterCategory]);

  return React.createElement(
    "div",
    { className: "p-4 space-y-6 dark:bg-gray-900 dark:text-gray-200" },
    React.createElement(
      "h2",
      { className: "text-xl font-bold text-gray-800 dark:text-gray-200" },
      "Prompt Factory"
    ),
    React.createElement(
      "p",
      { className: "text-sm text-gray-600 dark:text-gray-400" },
      "Create, edit, and reuse custom prompts, saving them in categories, with version history."
    ),

    // Prompt Form
    React.createElement(
      "div",
      { className: "bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md space-y-4 border border-blue-200 dark:border-blue-700" },
      React.createElement(
        "h3",
        { className: "text-lg font-semibold text-blue-700 dark:text-blue-300" },
        editingPrompt ? `Edit Prompt: ${editingPrompt.name}` : "Create New Prompt"
      ),
      errorMessage && React.createElement(
        "div",
        { className: "bg-red-100 dark:bg-red-900 text-red-700 dark:text-red-200 p-2 rounded text-sm" },
        errorMessage
      ),
      React.createElement(
        "div",
        null,
        React.createElement(
          "label",
          { htmlFor: "prompt-name", className: "block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1" },
          "Prompt Name:"
        ),
        React.createElement("input", {
          type: "text",
          id: "prompt-name",
          className: "w-full p-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500 bg-white dark:bg-gray-700 dark:text-gray-100 dark:border-gray-600",
          value: newPromptName,
          onChange: (e) => setNewPromptName(e.target.value),
          placeholder: "e.g., Summarize Article for Kids",
          "aria-label": "Prompt name",
        } as React.InputHTMLAttributes<HTMLInputElement>)
      ),
      React.createElement(
        "div",
        null,
        React.createElement(
          "label",
          { htmlFor: "prompt-description", className: "block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1" },
          "Description (Optional):"
        ),
        React.createElement("input", {
          type: "text",
          id: "prompt-description",
          className: "w-full p-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500 bg-white dark:bg-gray-700 dark:text-gray-100 dark:border-gray-600",
          value: newPromptDescription,
          onChange: (e) => setNewPromptDescription(e.target.value),
          placeholder: "A short description of when to use this prompt",
          "aria-label": "Prompt description",
        } as React.InputHTMLAttributes<HTMLInputElement>)
      ),
      React.createElement(
        "div",
        null,
        React.createElement(
          "label",
          { htmlFor: "prompt-category", className: "block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1" },
          "Category:"
        ),
        React.createElement(
          "select",
          {
            id: "prompt-category",
            className: "w-full p-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500 bg-white dark:bg-gray-700 dark:text-gray-100 dark:border-gray-600",
            value: newPromptCategory,
            onChange: (e) => setNewPromptCategory(e.target.value as PromptCategory),
            "aria-label": "Prompt category",
          } as React.SelectHTMLAttributes<HTMLSelectElement>,
          Object.values(PromptCategory).map(category =>
            React.createElement("option", { key: category, value: category }, category)
          )
        )
      ),
      React.createElement(
        "div",
        null,
        React.createElement(
          "label",
          { htmlFor: "prompt-content", className: "block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1" },
          "Prompt Content:"
        ),
        React.createElement("textarea", {
          id: "prompt-content",
          className: "w-full p-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500 resize-y min-h-[100px] bg-white dark:bg-gray-700 dark:text-gray-100 dark:border-gray-600",
          value: newPromptContent,
          onChange: (e) => setNewPromptContent(e.target.value),
          placeholder: "E.g., Summarize the following text for a 5-year-old: {text}",
          rows: 5,
          "aria-label": "Prompt content",
        } as React.TextareaHTMLAttributes<HTMLTextAreaElement>)
      ),
      React.createElement(
        "div",
        { className: "flex space-x-2" },
        React.createElement(
          "button",
          {
            onClick: handleAddOrUpdatePrompt,
            className: "flex-1 bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded-md transition-colors",
            "aria-label": editingPrompt ? "Update prompt" : "Add new prompt",
          },
          editingPrompt ? "Update Prompt" : "Add Prompt"
        ),
        editingPrompt && React.createElement(
          "button",
          {
            onClick: resetForm,
            className: "flex-1 bg-gray-300 hover:bg-gray-400 text-gray-800 dark:bg-gray-600 dark:hover:bg-gray-500 dark:text-gray-200 font-bold py-2 px-4 rounded-md transition-colors",
            "aria-label": "Cancel editing prompt",
          },
          "Cancel Edit"
        )
      )
    ),

    // Prompt List & Management
    React.createElement(
      "div",
      { className: "bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md space-y-4" },
      React.createElement(
        "h3",
        { className: "text-lg font-semibold text-gray-800 dark:text-gray-200" },
        "Your Saved Prompts"
      ),
      React.createElement(
        "div",
        { className: "flex justify-between items-center mb-4" },
        React.createElement(
          "select",
          {
            className: "p-2 border border-gray-300 rounded-md bg-white dark:bg-gray-700 dark:text-gray-100 dark:border-gray-600",
            value: filterCategory,
            onChange: (e) => setFilterCategory(e.target.value as PromptCategory | 'All'),
            "aria-label": "Filter prompts by category",
          } as React.SelectHTMLAttributes<HTMLSelectElement>,
          React.createElement("option", { value: "All" }, "All Categories"),
          Object.values(PromptCategory).map(category =>
            React.createElement("option", { key: category, value: category }, category)
          )
        ),
        React.createElement(
          "div",
          { className: "space-x-2" },
          React.createElement(
            "button",
            {
              onClick: handleExportPrompts,
              className: "bg-green-500 hover:bg-green-600 text-white text-sm py-1 px-3 rounded-md transition-colors",
              "aria-label": "Export all prompts as JSON",
            },
            "Export"
          ),
          React.createElement(
            "label",
            {
              htmlFor: "import-prompts",
              className: "bg-purple-500 hover:bg-purple-600 text-white text-sm py-1 px-3 rounded-md transition-colors cursor-pointer",
              "aria-label": "Import prompts from JSON file",
            },
            "Import"
          ),
          React.createElement("input", {
            type: "file",
            id: "import-prompts",
            className: "hidden",
            accept: ".json",
            onChange: handleImportPrompts,
          } as React.InputHTMLAttributes<HTMLInputElement>)
        )
      ),
      filteredPrompts.length > 0 ? (
        React.createElement(
          "ul",
          { className: "divide-y divide-gray-200 dark:divide-gray-700" },
          filteredPrompts.map(prompt =>
            React.createElement(
              "li",
              { key: prompt.id, className: "py-3 flex justify-between items-start" },
              React.createElement(
                "div",
                { className: "flex-grow mr-4" },
                React.createElement(
                  "h4",
                  { className: "font-semibold text-gray-800 dark:text-gray-200" },
                  prompt.name,
                  React.createElement(
                    "span",
                    { className: "ml-2 text-xs font-medium text-blue-600 bg-blue-50 px-2 py-0.5 rounded-full dark:bg-blue-900 dark:text-blue-200" },
                    prompt.category
                  )
                ),
                prompt.description && React.createElement(
                  "p",
                  { className: "text-sm text-gray-600 dark:text-gray-400" },
                  prompt.description
                ),
                React.createElement(
                  "p",
                  { className: "text-xs text-gray-500 dark:text-gray-500 mt-1" },
                  React.createElement(
                    "code",
                    { className: "bg-gray-100 dark:bg-gray-700 p-1 rounded break-all text-gray-800 dark:text-gray-200" },
                    prompt.content
                  )
                ),
                prompt.history && prompt.history.length > 0 && React.createElement(
                  "div",
                  { className: "mt-2" },
                  React.createElement(
                    "details",
                    { className: "text-sm text-gray-600 dark:text-gray-400" },
                    React.createElement(
                      "summary",
                      { className: "cursor-pointer hover:underline" },
                      `View History (${prompt.history.length} versions)`
                    ),
                    React.createElement(
                      "ul",
                      { className: "mt-2 space-y-2 pl-4 border-l border-gray-300 dark:border-gray-600" },
                      prompt.history.map((version, index) =>
                        React.createElement(
                          "li",
                          { key: index, className: "bg-gray-50 dark:bg-gray-700 p-2 rounded-md" },
                          React.createElement(
                            "p",
                            { className: "font-medium text-gray-700 dark:text-gray-300" },
                            `Version ${index + 1}: `,
                            new Date(version.timestamp).toLocaleString()
                          ),
                          React.createElement(
                            "p",
                            { className: "text-xs text-gray-600 dark:text-gray-400" },
                            version.content.substring(0, 100), "..."
                          ),
                          React.createElement(
                            "button",
                            {
                              onClick: () => handleRevertPrompt(prompt.id, index),
                              className: "mt-1 text-blue-500 hover:text-blue-700 text-xs",
                              "aria-label": `Revert prompt ${prompt.name} to version ${index + 1}`,
                            },
                            "Revert to this version"
                          )
                        )
                      )
                    )
                  )
                )
              ),
              React.createElement(
                "div",
                { className: "flex space-x-2 flex-shrink-0" },
                React.createElement(
                  "button",
                  {
                    onClick: () => handleEditPrompt(prompt),
                    className: "text-blue-600 hover:text-blue-800 text-sm",
                    "aria-label": `Edit prompt ${prompt.name}`,
                  },
                  "Edit"
                ),
                React.createElement(
                  "button",
                  {
                    onClick: () => handleDeletePrompt(prompt.id),
                    className: "text-red-600 hover:text-red-800 text-sm",
                    "aria-label": `Delete prompt ${prompt.name}`,
                  },
                  "Delete"
                )
              )
            )
          )
        )
      ) : (
        React.createElement(
          "p",
          { className: "text-center text-gray-500 dark:text-gray-400 py-4" },
          "No prompts saved yet. Create one above!"
        )
      )
    )
  );
};
