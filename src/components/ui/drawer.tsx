"use client";

import * as React from "react";
import { cn } from "@/lib/utils";

interface DrawerContextProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const DrawerContext = React.createContext<DrawerContextProps | undefined>(undefined);

function useDrawer() {
  const context = React.useContext(DrawerContext);
  if (!context) {
    throw new Error("useDrawer must be used within a Drawer");
  }
  return context;
}

interface DrawerProps {
  children: React.ReactNode;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
}

const Drawer = ({ children, open = false, onOpenChange }: DrawerProps) => {
  const [internalOpen, setInternalOpen] = React.useState(open);
  
  const isControlled = onOpenChange !== undefined;
  const isOpen = isControlled ? open : internalOpen;
  
  const handleOpenChange = React.useCallback((newOpen: boolean) => {
    if (isControlled) {
      onOpenChange(newOpen);
    } else {
      setInternalOpen(newOpen);
    }
  }, [isControlled, onOpenChange]);

  React.useEffect(() => {
    if (isControlled) {
      setInternalOpen(open);
    }
  }, [open, isControlled]);

  return (
    <DrawerContext.Provider value={{ open: isOpen, onOpenChange: handleOpenChange }}>
      {children}
    </DrawerContext.Provider>
  );
};

interface DrawerTriggerProps {
  asChild?: boolean;
  children: React.ReactNode;
}

const DrawerTrigger = ({ asChild = false, children }: DrawerTriggerProps) => {
  const { onOpenChange } = useDrawer();
  
  if (asChild) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    return React.cloneElement(children as React.ReactElement<any>, {
      onClick: () => onOpenChange(true),
    });
  }
  
  return (
    <button onClick={() => onOpenChange(true)}>
      {children}
    </button>
  );
};

interface DrawerContentProps {
  className?: string;
  children: React.ReactNode;
}

const DrawerContent = ({ className, children }: DrawerContentProps) => {
  const { open, onOpenChange } = useDrawer();
  
  const handleOverlayClick = (e: React.MouseEvent) => {
    // Check if the click is on a table row (which should switch tasks, not close)
    const target = e.target as HTMLElement;
    const isTableRow = target.closest('[role="row"]') || target.closest('tr');
    
    // Only close if not clicking on a table row
    if (!isTableRow) {
      onOpenChange(false);
    }
  };
  
  return (
    <>
      {/* Invisible overlay for click outside to close, but allow clicks on the left side for the list */}
      <div 
        className={cn(
          "fixed inset-0 z-40 transition-opacity duration-500",
          open ? "opacity-100" : "opacity-0 pointer-events-none",
          // Make the overlay only cover the area not occupied by the drawer
          "right-[600px]"
        )}
        onClick={handleOverlayClick}
      />
      
      {/* Drawer Content - slide from right */}
      <div className={cn(
        "fixed inset-y-0 right-0 z-50 w-[600px] transform transition-transform duration-500 ease-in-out",
        "bg-background border-l shadow-xl",
        "flex flex-col",
        open ? "translate-x-0" : "translate-x-full",
        className
      )}>
        <div className="flex-1 overflow-y-auto">
          {children}
        </div>
      </div>
    </>
  );
};

interface DrawerHeaderProps {
  className?: string;
  children: React.ReactNode;
}

const DrawerHeader = ({ className, children }: DrawerHeaderProps) => {
  return (
    <div className={cn("grid gap-1.5 p-4 text-center sm:text-left", className)}>
      {children}
    </div>
  );
};

interface DrawerTitleProps {
  className?: string;
  children: React.ReactNode;
}

const DrawerTitle = ({ className, children }: DrawerTitleProps) => {
  return (
    <h2 className={cn("text-lg font-semibold leading-none tracking-tight", className)}>
      {children}
    </h2>
  );
};

interface DrawerDescriptionProps {
  className?: string;
  children: React.ReactNode;
}

const DrawerDescription = ({ className, children }: DrawerDescriptionProps) => {
  return (
    <p className={cn("text-sm text-muted-foreground", className)}>
      {children}
    </p>
  );
};

export {
  Drawer,
  DrawerTrigger,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
  DrawerDescription,
};