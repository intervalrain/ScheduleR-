"use client";

import React, { createContext, useContext, useState, useCallback } from "react";

interface TaskContextType {
  refreshTrigger: number;
  triggerRefresh: () => void;
  deletedTaskIds: string[];
  markTaskAsDeleted: (taskId: string) => void;
}

const TaskContext = createContext<TaskContextType | undefined>(undefined);

export const TaskProvider = ({ children }: { children: React.ReactNode }) => {
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  const [deletedTaskIds, setDeletedTaskIds] = useState<string[]>([]);

  const triggerRefresh = useCallback(() => {
    setRefreshTrigger(prev => prev + 1);
    // Clear deleted task IDs when refreshing
    setDeletedTaskIds([]);
  }, []);

  const markTaskAsDeleted = useCallback((taskId: string) => {
    setDeletedTaskIds(prev => [...prev, taskId]);
  }, []);

  return (
    <TaskContext.Provider value={{ 
      refreshTrigger, 
      triggerRefresh, 
      deletedTaskIds, 
      markTaskAsDeleted 
    }}>
      {children}
    </TaskContext.Provider>
  );
};

export const useTaskRefresh = () => {
  const context = useContext(TaskContext);
  if (context === undefined) {
    throw new Error("useTaskRefresh must be used within a TaskProvider");
  }
  return context;
};