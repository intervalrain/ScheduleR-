'use client';

import React, { useState } from 'react';
import { useSession } from 'next-auth/react';
import { useMultiSelect } from '@/context/MultiSelectContext';
import { useSprint } from '@/context/SprintContext';
import { useTaskRefresh } from '@/context/TaskContext';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { X, ArrowRight, Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface Sprint {
  id: string;
  name: string;
}

interface BulkMoveToolbarProps {
  sprints: Sprint[];
}

export function BulkMoveToolbar({ sprints }: BulkMoveToolbarProps) {
  const { data: session } = useSession();
  const { isMultiSelectMode, selectedTaskIds, setMultiSelectMode, clearSelection } = useMultiSelect();
  const { selectedSprintId } = useSprint();
  const { triggerRefresh } = useTaskRefresh();
  const [isMoving, setIsMoving] = useState(false);
  const [targetSprintId, setTargetSprintId] = useState<string>('');
  const { toast } = useToast();

  // Don't show toolbar if not authenticated or not in multi-select mode
  if (!session || !isMultiSelectMode || selectedTaskIds.size === 0) {
    return null;
  }

  const availableSprints = sprints.filter(sprint => sprint.id !== selectedSprintId);

  const handleCancel = () => {
    setMultiSelectMode(false);
    setTargetSprintId('');
  };

  const handleBulkMove = async () => {
    if (!targetSprintId || selectedTaskIds.size === 0) {
      toast({
        title: "錯誤",
        description: "請選擇目標 Sprint",
        variant: "destructive",
      });
      return;
    }

    setIsMoving(true);
    try {
      console.log('Attempting to move tasks:', Array.from(selectedTaskIds), 'to sprint:', targetSprintId);
      
      const response = await fetch('/api/tasks/bulk-move', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          taskIds: Array.from(selectedTaskIds),
          targetSprintId,
        }),
      });

      console.log('Response status:', response.status);
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error('API Error Response:', errorText);
        
        let errorMessage = 'Failed to move tasks';
        try {
          const errorJson = JSON.parse(errorText);
          errorMessage = errorJson.error || errorMessage;
        } catch {
          errorMessage = `HTTP ${response.status}: ${errorText}`;
        }
        throw new Error(errorMessage);
      }

      const result = await response.json();
      console.log('Move result:', result);
      
      toast({
        title: "成功",
        description: `已成功移動 ${result.tasks.length} 個任務`,
      });

      // Reset state and refresh
      setMultiSelectMode(false);
      setTargetSprintId('');
      triggerRefresh();

    } catch (error) {
      console.error('Error moving tasks:', error);
      toast({
        title: "錯誤",
        description: error instanceof Error ? error.message : "移動任務失敗",
        variant: "destructive",
      });
    } finally {
      setIsMoving(false);
    }
  };

  return (
    <div className="fixed bottom-6 left-1/2 transform -translate-x-1/2 z-50">
      <div className="bg-white border border-gray-200 rounded-lg shadow-lg p-4 min-w-96">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium">已選擇 {selectedTaskIds.size} 個任務</span>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={handleCancel}
            disabled={isMoving}
          >
            <X className="h-4 w-4" />
          </Button>
        </div>

        <div className="flex items-center gap-3">
          <Select value={targetSprintId} onValueChange={setTargetSprintId}>
            <SelectTrigger className="flex-1">
              <SelectValue placeholder="選擇目標 Sprint" />
            </SelectTrigger>
            <SelectContent>
              {availableSprints.map((sprint) => (
                <SelectItem key={sprint.id} value={sprint.id}>
                  {sprint.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Button
            onClick={handleBulkMove}
            disabled={!targetSprintId || isMoving}
            className="flex items-center gap-2"
          >
            {isMoving ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <ArrowRight className="h-4 w-4" />
            )}
            移動
          </Button>
        </div>
      </div>
    </div>
  );
}