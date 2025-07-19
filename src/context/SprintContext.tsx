"use client";

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useSession } from 'next-auth/react';
import { mockSprints } from '@/lib/mockData';

interface Sprint {
  id: string;
  name: string;
  startDate: string;
  endDate: string;
  type?: 'PROJECT' | 'CASUAL';
  defaultWorkDays?: number[];
  defaultWorkHours?: { start: string; end: string };
}

interface SprintContextType {
  sprints: Sprint[];
  selectedSprintId: string | null;
  selectedSprint: Sprint | null;
  setSelectedSprintId: (sprintId: string | null) => void;
  refreshSprints: () => Promise<void>;
  loading: boolean;
}

const SprintContext = createContext<SprintContextType | undefined>(undefined);

export function SprintProvider({ children }: { children: ReactNode }) {
  const { data: session, status } = useSession();
  const [sprints, setSprints] = useState<Sprint[]>([]);
  const [selectedSprintId, setSelectedSprintId] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const selectedSprint = sprints.find(sprint => sprint.id === selectedSprintId) || null;

  const fetchSprints = async () => {
    if (status === "loading") return;
    
    if (!session) {
      // Use mock data when not authenticated
      setSprints(mockSprints);
      setSelectedSprintId(mockSprints[0]?.id || null);
      return;
    }

    setLoading(true);
    try {
      const response = await fetch('/api/sprints');
      if (response.ok) {
        const data = await response.json();
        setSprints(data);
        
        // Auto-select active sprint or first sprint if none selected
        if (data.length > 0 && !selectedSprintId) {
          const now = new Date();
          const activeSprint = data.find((sprint: Sprint) => {
            const start = new Date(sprint.startDate);
            const end = new Date(sprint.endDate);
            return now >= start && now <= end;
          });
          setSelectedSprintId((activeSprint || data[0]).id);
        }
        
        // If selected sprint doesn't exist in new data, reset selection
        if (selectedSprintId && !data.find((s: Sprint) => s.id === selectedSprintId)) {
          setSelectedSprintId(data.length > 0 ? data[0].id : null);
        }
      } else {
        console.error('Failed to fetch sprints');
        setSprints([]);
        setSelectedSprintId(null);
      }
    } catch (error) {
      console.error('Error fetching sprints:', error);
      setSprints([]);
      setSelectedSprintId(null);
    } finally {
      setLoading(false);
    }
  };

  const refreshSprints = async () => {
    await fetchSprints();
  };

  // Fetch sprints when session changes
  useEffect(() => {
    fetchSprints();
  }, [session, status]);

  const value: SprintContextType = {
    sprints,
    selectedSprintId,
    selectedSprint,
    setSelectedSprintId,
    refreshSprints,
    loading,
  };

  return (
    <SprintContext.Provider value={value}>
      {children}
    </SprintContext.Provider>
  );
}

export function useSprint() {
  const context = useContext(SprintContext);
  if (context === undefined) {
    throw new Error('useSprint must be used within a SprintProvider');
  }
  return context;
}