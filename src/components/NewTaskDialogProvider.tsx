
"use client";

import React, { createContext, useContext, useState } from "react";
import { NewTaskDialog } from "./NewTaskDialog";

interface NewTaskDialogContextType {
  openNewTaskDialog: (sprintId?: string) => void;
}

const NewTaskDialogContext = createContext<NewTaskDialogContextType | undefined>(undefined);

export const NewTaskDialogProvider = ({ children }: { children: React.ReactNode }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [selectedSprintId, setSelectedSprintId] = useState<string | undefined>();

  const openNewTaskDialog = (sprintId?: string) => {
    setSelectedSprintId(sprintId);
    setIsOpen(true);
  };

  return (
    <NewTaskDialogContext.Provider value={{ openNewTaskDialog }}>
      {children}
      <NewTaskDialog isOpen={isOpen} setIsOpen={setIsOpen} selectedSprintId={selectedSprintId} />
    </NewTaskDialogContext.Provider>
  );
};

export const useNewTaskDialog = () => {
  const context = useContext(NewTaskDialogContext);
  if (context === undefined) {
    throw new Error("useNewTaskDialog must be used within a NewTaskDialogProvider");
  }
  return context;
};
