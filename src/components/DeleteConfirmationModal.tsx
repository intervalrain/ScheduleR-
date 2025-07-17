"use client";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

interface DeleteConfirmationModalProps {
  isOpen: boolean;
  setIsOpen: (isOpen: boolean) => void;
  title: string;
  isRecurring: boolean;
  onConfirm: (deleteType: 'single' | 'future' | 'all') => void;
}

export function DeleteConfirmationModal({
  isOpen,
  setIsOpen,
  title,
  isRecurring,
  onConfirm,
}: DeleteConfirmationModalProps) {
  const handleConfirm = (deleteType: 'single' | 'future' | 'all') => {
    onConfirm(deleteType);
    setIsOpen(false);
  };

  const handleCancel = () => {
    setIsOpen(false);
  };

  if (!isRecurring) {
    return (
      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Time Block</DialogTitle>
          </DialogHeader>
          <div className="py-4">
            <p className="text-sm text-gray-600">
              Are you sure you want to delete &ldquo;{title}&rdquo;?
            </p>
          </div>
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={handleCancel}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={() => handleConfirm('single')}>
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Delete Recurring Time Block</DialogTitle>
        </DialogHeader>
        <div className="py-4">
          <p className="text-sm text-gray-600 mb-4">
            This is part of a recurring series. What would you like to delete?
          </p>
          <div className="text-sm text-gray-800 font-medium mb-2">
            &ldquo;{title}&rdquo;
          </div>
        </div>
        <DialogFooter className="gap-2 flex-col sm:flex-row">
          <Button variant="outline" onClick={handleCancel} className="w-full sm:w-auto">
            Cancel
          </Button>
          <Button 
            variant="destructive" 
            onClick={() => handleConfirm('single')}
            className="w-full sm:w-auto"
          >
            Only This
          </Button>
          <Button 
            variant="destructive" 
            onClick={() => handleConfirm('future')}
            className="w-full sm:w-auto"
          >
            This & Future
          </Button>
          <Button 
            variant="destructive" 
            onClick={() => handleConfirm('all')}
            className="w-full sm:w-auto"
          >
            All
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}