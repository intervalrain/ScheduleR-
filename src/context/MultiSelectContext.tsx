'use client';

import React, { createContext, useContext, useState, ReactNode } from 'react';

interface MultiSelectContextType {
  isMultiSelectMode: boolean;
  selectedTaskIds: Set<string>;
  setMultiSelectMode: (enabled: boolean) => void;
  toggleTaskSelection: (taskId: string) => void;
  selectTask: (taskId: string) => void;
  deselectTask: (taskId: string) => void;
  clearSelection: () => void;
  isTaskSelected: (taskId: string) => boolean;
}

const MultiSelectContext = createContext<MultiSelectContextType | undefined>(undefined);

export function MultiSelectProvider({ children }: { children: ReactNode }) {
  const [isMultiSelectMode, setIsMultiSelectMode] = useState(false);
  const [selectedTaskIds, setSelectedTaskIds] = useState<Set<string>>(new Set());

  const setMultiSelectMode = (enabled: boolean) => {
    setIsMultiSelectMode(enabled);
    if (!enabled) {
      setSelectedTaskIds(new Set());
    }
  };

  const toggleTaskSelection = (taskId: string) => {
    setSelectedTaskIds(prev => {
      const newSet = new Set(prev);
      if (newSet.has(taskId)) {
        newSet.delete(taskId);
      } else {
        newSet.add(taskId);
      }
      return newSet;
    });
  };

  const selectTask = (taskId: string) => {
    setSelectedTaskIds(prev => new Set(prev).add(taskId));
  };

  const deselectTask = (taskId: string) => {
    setSelectedTaskIds(prev => {
      const newSet = new Set(prev);
      newSet.delete(taskId);
      return newSet;
    });
  };

  const clearSelection = () => {
    setSelectedTaskIds(new Set());
  };

  const isTaskSelected = (taskId: string) => {
    return selectedTaskIds.has(taskId);
  };

  return (
    <MultiSelectContext.Provider
      value={{
        isMultiSelectMode,
        selectedTaskIds,
        setMultiSelectMode,
        toggleTaskSelection,
        selectTask,
        deselectTask,
        clearSelection,
        isTaskSelected,
      }}
    >
      {children}
    </MultiSelectContext.Provider>
  );
}

export function useMultiSelect() {
  const context = useContext(MultiSelectContext);
  if (!context) {
    throw new Error('useMultiSelect must be used within a MultiSelectProvider');
  }
  return context;
}